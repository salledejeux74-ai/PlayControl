-- ─── PLAYCONTROL - SYSTEM SUPERADMIN TABLES ───────────────────────

-- 1. Table des Salles
CREATE TABLE IF NOT EXISTS public.salles (
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

-- 2. Table des Licences
CREATE TABLE IF NOT EXISTS public.licences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  salle_id UUID REFERENCES public.salles(id) ON DELETE CASCADE,
  activated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'warning', 'expired'))
);

-- 3. Table des Activity Logs (Journaux d'activité)
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  actor TEXT NOT NULL,
  role TEXT NOT NULL,
  action TEXT NOT NULL,
  salle TEXT NOT NULL,
  ip TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  severity TEXT DEFAULT 'info' NOT NULL CHECK (severity IN ('info', 'warning', 'critical'))
);

-- 4. Insertion de données de seed pour les salles, licences et logs
INSERT INTO public.salles (id, name, location, latitude, longitude, owner, phone, postes_count, status, monthly_revenue)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Gaming Zone - Yaoundé', 'Bastos, Yaoundé', 3.8833, 11.5167, 'Marc Kemajou', '+237 699 99 99 99', 20, 'active', 2450000),
  ('22222222-2222-2222-2222-222222222222', 'Arena Games - Douala', 'Bonapriso, Douala', 4.0483, 9.7043, 'Alain Tchakounté', '+237 677 77 77 77', 20, 'active', 1980000),
  ('33333333-3333-3333-3333-333333333333', 'Play Safe - Garoua', 'Plateau, Garoua', 9.3000, 13.4000, 'Amadou Bello', '+237 655 55 55 55', 15, 'active', 1250000),
  ('44444444-4444-4444-4444-444444444444', 'Nexus Gaming - Bafoussam', 'Marché A, Bafoussam', 5.4772, 10.4172, 'Serge Fotso', '+237 688 88 88 88', 12, 'suspended', 0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.licences (key, salle_id, activated_at, expires_at, status)
VALUES 
  ('PLAY-KZ8Y-98X1-24PL', '11111111-1111-1111-1111-111111111111', '2026-01-01 00:00:00+00', '2027-01-01 00:00:00+00', 'active'),
  ('PLAY-QA7M-12D9-98WW', '22222222-2222-2222-2222-222222222222', '2026-02-15 00:00:00+00', '2027-02-15 00:00:00+00', 'active'),
  ('PLAY-LB9R-43K2-09MM', '33333333-3333-3333-3333-333333333333', '2025-06-18 00:00:00+00', '2026-06-18 00:00:00+00', 'warning'),
  ('PLAY-NX5S-55X9-11AA', '44444444-4444-4444-4444-444444444444', '2025-04-10 00:00:00+00', '2026-04-10 00:00:00+00', 'expired')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.activity_logs (actor, role, action, salle, ip, timestamp, severity)
VALUES
  ('Alexandre (SA)', 'Super Admin', 'Génération de clé de licence (PLAY-KZ8Y-98X1)', 'SuperAdmin System', '192.168.1.100', now() - interval '1 hour', 'info'),
  ('Marc Kemajou', 'Admin Salle', 'Création du compte caissier (Sophie)', 'Gaming Zone - Yaoundé', '192.168.1.105', now() - interval '2 hours', 'info'),
  ('Sophie (Caisse)', 'Caissier', 'Suppression forcée de session (Poste 4)', 'Gaming Zone - Yaoundé', '192.168.1.112', now() - interval '3 hours', 'warning'),
  ('Alexandre (SA)', 'Super Admin', 'Suspension de la salle (Nexus Gaming)', 'Nexus Gaming - Bafoussam', '192.168.1.100', now() - interval '5 hours', 'critical');

-- 5. Résolution de l'erreur 403 (RLS)
ALTER TABLE public.salles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.licences DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs DISABLE ROW LEVEL SECURITY;

-- 6. Création du bucket public pour stocker les photos des propriétaires
INSERT INTO storage.buckets (id, name, public) 
VALUES ('salles', 'salles', true)
ON CONFLICT (id) DO NOTHING;

-- 7. Politiques de stockage
DROP POLICY IF EXISTS "Accès public en lecture pour le bucket salles" ON storage.objects;
DROP POLICY IF EXISTS "Accès total pour les utilisateurs sur le bucket salles" ON storage.objects;
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

-- 8. Ajout de la colonne temp_password à la table public.profiles et mise à jour du trigger
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS temp_password TEXT;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role, salle_id, temp_password)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', 'Utilisateur'),
    COALESCE(new.raw_user_meta_data->>'role', 'caissier'),
    new.raw_user_meta_data->>'salle_id',
    new.raw_user_meta_data->>'temp_password'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;




