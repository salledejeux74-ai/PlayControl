-- ─── POLYCONTROL - SCHÉMA DE BASE DE DONNÉES SUPABASE COMPLET ───────────────────
-- À exécuter dans : Supabase → SQL Editor → New query

-- Désactivation des triggers et nettoyage des tables existantes pour repartir à propre
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.update_modified_column() CASCADE;

DROP TABLE IF EXISTS public.activity_logs CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.shifts CASCADE;
DROP TABLE IF EXISTS public.settings CASCADE;
DROP TABLE IF EXISTS public.postes CASCADE;
DROP TABLE IF EXISTS public.clients CASCADE;
DROP TABLE IF EXISTS public.abonnement_packages CASCADE;
DROP TABLE IF EXISTS public.material_types CASCADE;
DROP TABLE IF EXISTS public.licences CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.salles CASCADE;

-- ── 1. Fonctions Utilitaires ──────────────────────────────────────────────────

-- Fonction pour mettre à jour automatiquement le champ updated_at
CREATE OR REPLACE FUNCTION public.update_modified_column()
RETURNS trigger AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$ LANGUAGE plpgsql;


-- ── 2. Table des Salles ────────────────────────────────────────────────────────
CREATE TABLE public.salles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  location TEXT NOT NULL,
  latitude NUMERIC(9,6),
  longitude NUMERIC(9,6),
  owner TEXT NOT NULL,
  owner_photo TEXT,
  phone TEXT NOT NULL,
  postes_count INTEGER DEFAULT 10 NOT NULL,
  status TEXT DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'suspended')),
  monthly_revenue INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- ── 3. Table des Profils (utilisateurs système) ────────────────────────────────
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT NOT NULL CHECK (role IN ('superadmin', 'admin', 'caissier')),
  salle_id UUID REFERENCES public.salles(id) ON DELETE SET NULL,
  temp_password TEXT,
  phone TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- Trigger pour créer automatiquement un profil à chaque inscription dans auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role, salle_id, temp_password, phone, status)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', 'Utilisateur'),
    COALESCE(new.raw_user_meta_data->>'role', 'caissier'),
    (new.raw_user_meta_data->>'salle_id')::uuid,
    new.raw_user_meta_data->>'temp_password',
    new.raw_user_meta_data->>'phone',
    COALESCE(new.raw_user_meta_data->>'status', 'active')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- ── 4. Table des Licences ──────────────────────────────────────────────────────
CREATE TABLE public.licences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  salle_id UUID REFERENCES public.salles(id) ON DELETE CASCADE,
  activated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'warning', 'expired'))
);


-- ── 5. Table des Types de Matériel (Tarification Horaire) ────────────────────
CREATE TABLE public.material_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  label TEXT NOT NULL,
  price INTEGER NOT NULL CHECK (price >= 0),
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  salle_id UUID REFERENCES public.salles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT material_types_type_salle_id_key UNIQUE (type, salle_id)
);


-- ── 6. Table des Clients (Membres) ─────────────────────────────────────────────
CREATE TABLE public.clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  balance INTEGER DEFAULT 0 NOT NULL CHECK (balance >= 0),
  abonnement_type TEXT DEFAULT 'Aucun' NOT NULL CHECK (abonnement_type IN ('Aucun', 'Journalier', 'Hebdomadaire', 'Mensuel', 'VIP')),
  abonnement_expiration TIMESTAMP WITH TIME ZONE,
  abonnement_remaining_time INTEGER DEFAULT 0 CHECK (abonnement_remaining_time >= 0),
  status TEXT DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'suspended')),
  salle_id UUID REFERENCES public.salles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- ── 7. Table des Postes de Jeu (Consoles) ──────────────────────────────────────
CREATE TABLE public.postes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  characteristics TEXT,
  smart_plug_ip TEXT,
  status TEXT DEFAULT 'libre' NOT NULL CHECK (status IN ('libre', 'en-attente', 'occupe', 'hors-service')),
  client_name TEXT,
  session_code VARCHAR(6),
  minutes_remaining INTEGER,
  total_duration INTEGER,
  salle_id UUID REFERENCES public.salles(id) ON DELETE CASCADE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT postes_name_salle_id_key UNIQUE (name, salle_id),
  CONSTRAINT postes_type_salle_id_fkey FOREIGN KEY (type, salle_id) REFERENCES public.material_types(type, salle_id) ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TRIGGER update_postes_modtime
  BEFORE UPDATE ON public.postes
  FOR EACH ROW EXECUTE PROCEDURE public.update_modified_column();


-- ── 8. Table des Packages d'Abonnement ─────────────────────────────────────────
CREATE TABLE public.abonnement_packages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('Journalier', 'Hebdomadaire', 'Mensuel', 'VIP')),
  price INTEGER NOT NULL CHECK (price >= 0),
  duration_hours INTEGER NOT NULL CHECK (duration_hours > 0),
  salle_id UUID REFERENCES public.salles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT abonnement_packages_type_salle_id_key UNIQUE (type, salle_id)
);


-- ── 9. Table des Paramètres Globaux ───────────────────────────────────────────
CREATE TABLE public.settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salle_name TEXT DEFAULT 'Zone Gaming Center' NOT NULL,
  salle_address TEXT DEFAULT 'Bastos, Yaoundé, Cameroun' NOT NULL,
  phone_country_code TEXT DEFAULT '+237' NOT NULL,
  raw_phone_num TEXT DEFAULT '699999999' NOT NULL,
  pending_update JSONB,
  currency TEXT DEFAULT 'FCFA' NOT NULL,
  tax_rate NUMERIC(5,2) DEFAULT 0.00 NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- ── 10. Table des Shifts Caissiers ─────────────────────────────────────────────
CREATE TABLE public.shifts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cashier_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT NOT NULL,
  opened_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  closed_at TIMESTAMP WITH TIME ZONE,
  initial_cash INTEGER NOT NULL CHECK (initial_cash >= 0),
  closed_cash INTEGER CHECK (closed_cash >= 0),
  expected_cash INTEGER CHECK (expected_cash >= 0),
  cash_difference INTEGER,
  status TEXT DEFAULT 'open' NOT NULL CHECK (status IN ('open', 'closed')),
  salle_id UUID REFERENCES public.salles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- ── 11. Table des Transactions Financières ─────────────────────────────────────
CREATE TABLE public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shift_id UUID REFERENCES public.shifts(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  poste_name TEXT,
  amount INTEGER NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('espèces', 'mobile_money')),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('session', 'recharge', 'abonnement')),
  salle_id UUID REFERENCES public.salles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- ── 12. Table des Notifications ───────────────────────────────────────────────
CREATE TABLE public.notifications (
  id            UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  salle_id      UUID    REFERENCES public.salles(id) ON DELETE CASCADE,
  recipient_role TEXT   NOT NULL CHECK (recipient_role IN ('admin', 'superadmin', 'caissier', 'all')),
  type          TEXT    NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error')),
  title         TEXT    NOT NULL,
  message       TEXT    NOT NULL,
  is_read       BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_salle_id_idx  ON public.notifications(salle_id);
CREATE INDEX IF NOT EXISTS notifications_recipient_idx ON public.notifications(recipient_role);
CREATE INDEX IF NOT EXISTS notifications_is_read_idx   ON public.notifications(is_read);


-- ── 13. Table des Activity Logs (Journaux d'activité) ──────────────────────────
CREATE TABLE public.activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  actor TEXT NOT NULL,
  role TEXT NOT NULL,
  action TEXT NOT NULL,
  salle TEXT NOT NULL,
  ip TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  severity TEXT DEFAULT 'info' NOT NULL CHECK (severity IN ('info', 'warning', 'critical'))
);


-- ── 14. Désactivation de la sécurité RLS pour le développement facile ─────────
ALTER TABLE public.salles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.licences DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.postes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.abonnement_packages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs DISABLE ROW LEVEL SECURITY;


-- ── 15. Configuration du Stockage (Storage Buckets et Politiques) ─────────────

-- Création du bucket 'salles'
INSERT INTO storage.buckets (id, name, public) 
VALUES ('salles', 'salles', true)
ON CONFLICT (id) DO NOTHING;

-- Politiques sur les objets du stockage 'salles'
DROP POLICY IF EXISTS "Permettre la lecture publique du bucket salles" ON storage.objects;
DROP POLICY IF EXISTS "Permettre l'insertion publique dans le bucket salles" ON storage.objects;
DROP POLICY IF EXISTS "Permettre la modification du bucket salles" ON storage.objects;
DROP POLICY IF EXISTS "Permettre la suppression du bucket salles" ON storage.objects;

CREATE POLICY "Permettre la lecture publique du bucket salles"
ON storage.objects FOR SELECT USING (bucket_id = 'salles');

CREATE POLICY "Permettre l'insertion publique dans le bucket salles"
ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'salles');

CREATE POLICY "Permettre la modification du bucket salles"
ON storage.objects FOR UPDATE USING (bucket_id = 'salles') WITH CHECK (bucket_id = 'salles');

CREATE POLICY "Permettre la suppression du bucket salles"
ON storage.objects FOR DELETE USING (bucket_id = 'salles');


-- ── 16. Activation du Temps Réel (Supabase Realtime) ──────────────────────────

-- Création de la publication si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- Ajout des tables à la publication en ignorant les erreurs de duplication
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.postes;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.clients;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.shifts;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
