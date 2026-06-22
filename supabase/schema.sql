-- ─── PLAYCONTROL - SCHEMA DE BASE DE DONNÉES SUPABASE ───────────────────────

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.update_modified_column() CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.shifts CASCADE;
DROP TABLE IF EXISTS public.postes CASCADE;
DROP TABLE IF EXISTS public.clients CASCADE;
DROP TABLE IF EXISTS public.material_types CASCADE;
DROP TABLE IF EXISTS public.abonnement_packages CASCADE;
DROP TABLE IF EXISTS public.settings CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;


-- 2. Table Profiles (liée aux utilisateurs de l'Auth Supabase)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT NOT NULL CHECK (role IN ('superadmin', 'admin', 'caissier')),
  salle_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger pour créer automatiquement un profil à chaque inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role, salle_id)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', 'Utilisateur'),
    COALESCE(new.raw_user_meta_data->>'role', 'caissier'),
    new.raw_user_meta_data->>'salle_id'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. Table des Types de Matériel (Tarification Horaire)
CREATE TABLE public.material_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  price INTEGER NOT NULL CHECK (price >= 0),
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Table des Clients (Membres)
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Table des Postes de Jeu (Consoles)
CREATE TABLE public.postes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL REFERENCES public.material_types(type) ON UPDATE CASCADE,
  characteristics TEXT,
  smart_plug_ip TEXT,
  status TEXT DEFAULT 'libre' NOT NULL CHECK (status IN ('libre', 'en-attente', 'occupe', 'hors-service')),
  client_name TEXT, -- Pseudo du membre ou identifiant invité
  session_code VARCHAR(6),
  minutes_remaining INTEGER,
  total_duration INTEGER,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION public.update_modified_column()
RETURNS trigger AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_postes_modtime
  BEFORE UPDATE ON public.postes
  FOR EACH ROW EXECUTE PROCEDURE public.update_modified_column();

-- 6. Table des Configurations d'Abonnement (Packages)
CREATE TABLE public.abonnement_packages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT UNIQUE NOT NULL CHECK (type IN ('Journalier', 'Hebdomadaire', 'Mensuel', 'VIP')),
  price INTEGER NOT NULL CHECK (price >= 0),
  duration_hours INTEGER NOT NULL CHECK (duration_hours > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Table des Paramètres Globaux
CREATE TABLE public.settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salle_name TEXT DEFAULT 'Zone Gaming Center' NOT NULL,
  salle_address TEXT DEFAULT 'Bastos, Yaoundé, Cameroun' NOT NULL,
  phone_country_code TEXT DEFAULT '+237' NOT NULL,
  raw_phone_num TEXT DEFAULT '699999999' NOT NULL,
  pending_update JSONB, -- Stocke la demande de modification en attente sous format JSON
  currency TEXT DEFAULT 'FCFA' NOT NULL,
  tax_rate NUMERIC(5,2) DEFAULT 0.00 NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Table des Shifts Caissiers
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Table des Transactions Financières
CREATE TABLE public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shift_id UUID REFERENCES public.shifts(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  poste_name TEXT,
  amount INTEGER NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('espèces', 'mobile_money')),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('session', 'recharge', 'abonnement')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. Activation du temps réel (Supabase Realtime)
-- Remarque : Supabase active le temps réel par table sur la publication "supabase_realtime"
ALTER PUBLICATION supabase_realtime ADD TABLE public.postes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.clients;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shifts;
