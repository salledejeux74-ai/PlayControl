-- ─── POLYCONTROL - DONNÉES DE SEED ET MOCK COMPLETES ─────────────────────────────
-- À exécuter dans : Supabase → SQL Editor → New query (APRES avoir importé le schéma complet)

-- Note : Les identifiants UUID des salles et des utilisateurs sont harmonisés pour assurer la cohérence.

-- Nettoyage des données existantes
TRUNCATE TABLE public.activity_logs CASCADE;
TRUNCATE TABLE public.notifications CASCADE;
TRUNCATE TABLE public.transactions CASCADE;
TRUNCATE TABLE public.shifts CASCADE;
TRUNCATE TABLE public.settings CASCADE;
TRUNCATE TABLE public.postes CASCADE;
TRUNCATE TABLE public.clients CASCADE;
TRUNCATE TABLE public.abonnement_packages CASCADE;
TRUNCATE TABLE public.material_types CASCADE;
TRUNCATE TABLE public.licences CASCADE;
TRUNCATE TABLE public.profiles CASCADE;
DELETE FROM auth.users WHERE id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333'
);
TRUNCATE TABLE public.salles CASCADE;

-- ── 1. Données pour les Salles (Rooms) ──────────────────────────────────────────
INSERT INTO public.salles (id, name, location, latitude, longitude, owner, phone, postes_count, status, monthly_revenue)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Gaming Zone - Yaoundé', 'Bastos, Yaoundé', 3.8833, 11.5167, 'Marc Kemajou', '+237 699 99 99 99', 20, 'active', 2450000),
  ('22222222-2222-2222-2222-222222222222', 'Arena Games - Douala', 'Bonapriso, Douala', 4.0483, 9.7043, 'Alain Tchakounté', '+237 677 77 77 77', 20, 'active', 1980000),
  ('33333333-3333-3333-3333-333333333333', 'Play Safe - Garoua', 'Plateau, Garoua', 9.3000, 13.4000, 'Amadou Bello', '+237 655 55 55 55', 15, 'active', 1250000),
  ('44444444-4444-4444-4444-444444444444', 'Nexus Gaming - Bafoussam', 'Marché A, Bafoussam', 5.4772, 10.4172, 'Serge Fotso', '+237 688 88 88 88', 12, 'suspended', 0)
ON CONFLICT (id) DO NOTHING;


-- ── 2. Données pour les Licences ────────────────────────────────────────────────
INSERT INTO public.licences (key, salle_id, activated_at, expires_at, status)
VALUES 
  ('PLAY-KZ8Y-98X1-24PL', '11111111-1111-1111-1111-111111111111', '2026-01-01 00:00:00+00', '2027-01-01 00:00:00+00', 'active'),
  ('PLAY-QA7M-12D9-98WW', '22222222-2222-2222-2222-222222222222', '2026-02-15 00:00:00+00', '2027-02-15 00:00:00+00', 'active'),
  ('PLAY-LB9R-43K2-09MM', '33333333-3333-3333-3333-333333333333', '2025-06-18 00:00:00+00', '2026-06-18 00:00:00+00', 'warning'),
  ('PLAY-NX5S-55X9-11AA', '44444444-4444-4444-4444-444444444444', '2025-04-10 00:00:00+00', '2026-04-10 00:00:00+00', 'expired')
ON CONFLICT (key) DO NOTHING;


-- ── 3. Données pour les Utilisateurs Authentifiés (auth.users) ─────────────────
-- Le mot de passe crypté ci-dessous est 'password' (compatible bcrypt standard Supabase).
-- L'insertion dans auth.users va déclencher la création automatique du profil correspondant dans public.profiles via le trigger.
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
VALUES
  -- 1. Superadmin global
  (
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-1111-1111-111111111111',
    'authenticated',
    'authenticated',
    'superadmin@playcontrol.com',
    extensions.crypt('password', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Alexandre - Propriétaire","role":"superadmin"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  -- 2. Gérant (Admin) de la salle "Gaming Zone - Yaoundé"
  (
    '00000000-0000-0000-0000-000000000000',
    '22222222-2222-2222-2222-222222222222',
    'authenticated',
    'authenticated',
    'salle.admin@playcontrol.com',
    extensions.crypt('password', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Marc - Gérant","role":"admin","salle_id":"11111111-1111-1111-1111-111111111111","phone":"+237699000111"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  -- 3. Caissière de la salle "Gaming Zone - Yaoundé"
  (
    '00000000-0000-0000-0000-000000000000',
    '33333333-3333-3333-3333-333333333333',
    'authenticated',
    'authenticated',
    'sophie.caisse@playcontrol.com',
    extensions.crypt('password', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Sophie - Caissière","role":"caissier","salle_id":"11111111-1111-1111-1111-111111111111","phone":"+237677111222"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  )
ON CONFLICT (id) DO NOTHING;


-- ── 4. Données pour les Tarifs / Types de Matériel ────────────────────────────
INSERT INTO public.material_types (type, label, price, duration_minutes, salle_id)
VALUES
  -- Tarifs pour la salle 1 (Yaoundé)
  ('ps5_vip', 'Console PS5 (Zone VIP)', 1500, 60, '11111111-1111-1111-1111-111111111111'),
  ('ps5_standard', 'Console PS5 (Zone Standard)', 1000, 60, '11111111-1111-1111-1111-111111111111'),
  ('ps4_standard', 'Console PS4 (Zone Standard)', 800, 60, '11111111-1111-1111-1111-111111111111'),
  
  -- Tarifs pour la salle 2 (Douala)
  ('ps5_vip', 'Console PS5 (Zone VIP)', 1800, 60, '22222222-2222-2222-2222-222222222222'),
  ('ps5_standard', 'Console PS5 (Zone Standard)', 1200, 60, '22222222-2222-2222-2222-222222222222'),
  ('ps4_standard', 'Console PS4 (Zone Standard)', 1000, 60, '22222222-2222-2222-2222-222222222222');


-- ── 5. Données pour les Formules d'Abonnement (Packages) ───────────────────────
INSERT INTO public.abonnement_packages (type, price, duration_hours, salle_id)
VALUES
  -- Forfaits pour la salle 1 (Yaoundé)
  ('Journalier', 5000, 6, '11111111-1111-1111-1111-111111111111'),
  ('Hebdomadaire', 15000, 20, '11111111-1111-1111-1111-111111111111'),
  ('Mensuel', 45000, 65, '11111111-1111-1111-1111-111111111111'),
  ('VIP', 75000, 100, '11111111-1111-1111-1111-111111111111'),
  
  -- Forfaits pour la salle 2 (Douala)
  ('Journalier', 6000, 6, '22222222-2222-2222-2222-222222222222'),
  ('Hebdomadaire', 18000, 20, '22222222-2222-2222-2222-222222222222'),
  ('Mensuel', 50000, 65, '22222222-2222-2222-2222-222222222222'),
  ('VIP', 80000, 100, '22222222-2222-2222-2222-222222222222');


-- ── 6. Données pour les Clients (Membres) ──────────────────────────────────────
INSERT INTO public.clients (username, full_name, phone, balance, abonnement_type, abonnement_expiration, abonnement_remaining_time, status, salle_id)
VALUES
  -- Clients Salle 1 (Yaoundé)
  ('gamer_pro', 'Arthur Mbé', '+237699887766', 12000, 'VIP', now() + interval '30 days', 6000, 'active', '11111111-1111-1111-1111-111111111111'),
  ('marc_k', 'Marc Kamga', '+237677554433', 1500, 'Aucun', null, 0, 'active', '11111111-1111-1111-1111-111111111111'),
  ('alain_t', 'Alain Tchakounté', '+237655443322', 0, 'Journalier', now() + interval '1 day', 360, 'active', '11111111-1111-1111-1111-111111111111'),
  ('jr_zogo', 'Junior Zogo', '+237688776655', 5000, 'Aucun', null, 0, 'suspended', '11111111-1111-1111-1111-111111111111'),
  
  -- Clients Salle 2 (Douala)
  ('douala_gaming', 'Cédric Ngueme', '+237677001122', 8000, 'Mensuel', now() + interval '15 days', 2400, 'active', '22222222-2222-2222-2222-222222222222');


-- ── 7. Données pour les Consoles de Jeu (Postes) ────────────────────────────────
INSERT INTO public.postes (name, type, characteristics, smart_plug_ip, status, client_name, session_code, minutes_remaining, total_duration, salle_id)
VALUES
  -- Postes de la salle 1 (Yaoundé)
  ('PS5 - VIP #1', 'ps5_vip', 'Écran 4K 120Hz, Canapé Confort VIP, Manette DualSense Edge', '192.168.1.101', 'occupe', 'gamer_pro', 'A1B2C3', 45, 120, '11111111-1111-1111-1111-111111111111'),
  ('PS5 - Standard #2', 'ps5_standard', 'Écran 1080p, Manette standard', '192.168.1.102', 'libre', null, null, null, null, '11111111-1111-1111-1111-111111111111'),
  ('PS5 - Standard #3', 'ps5_standard', 'Écran 1080p, Manette standard', '192.168.1.103', 'hors-service', null, null, null, null, '11111111-1111-1111-1111-111111111111'),
  ('PS5 - VIP #2', 'ps5_vip', 'Écran 4K 120Hz, Canapé Confort VIP', '192.168.1.104', 'occupe', 'marc_k', 'X9Y8Z7', 120, 180, '11111111-1111-1111-1111-111111111111'),
  ('PS4 - Standard #1', 'ps4_standard', 'Écran 1080p, Manette DualShock 4', '192.168.1.105', 'libre', null, null, null, null, '11111111-1111-1111-1111-111111111111'),
  ('PS4 - Standard #2', 'ps4_standard', 'Écran 1080p, Manette DualShock 4', '192.168.1.106', 'libre', null, null, null, null, '11111111-1111-1111-1111-111111111111'),
  ('PS5 - VIP #3', 'ps5_vip', 'Écran 4K 120Hz, Canapé Confort VIP', '192.168.1.107', 'occupe', 'alain_t', 'C4D5E6', 15, 60, '11111111-1111-1111-1111-111111111111'),
  ('PS4 - Standard #3', 'ps4_standard', 'Écran 1080p, Manette DualShock 4', '192.168.1.108', 'libre', null, null, null, null, '11111111-1111-1111-1111-111111111111'),
  
  -- Postes de la salle 2 (Douala)
  ('PS5 - VIP #1', 'ps5_vip', 'Écran OLED 4K', '192.168.2.101', 'libre', null, null, null, null, '22222222-2222-2222-2222-222222222222'),
  ('PS5 - Standard #2', 'ps5_standard', 'Écran Standard 1080p', '192.168.2.102', 'libre', null, null, null, null, '22222222-2222-2222-2222-222222222222');


-- ── 8. Données pour les Paramètres Globaux ────────────────────────────────────
INSERT INTO public.settings (salle_name, salle_address, phone_country_code, raw_phone_num, currency, tax_rate, is_active)
VALUES ('PolyControl Systems', 'Bastos, Yaoundé, Cameroun', '+237', '699999999', 'FCFA', 0.00, true);


-- ── 9. Données pour les Journaux d'Activité ────────────────────────────────────
INSERT INTO public.activity_logs (actor, role, action, salle, ip, timestamp, severity)
VALUES
  ('Alexandre (SA)', 'Super Admin', 'Génération de clé de licence (PLAY-KZ8Y-98X1)', 'SuperAdmin System', '192.168.1.100', now() - interval '1 hour', 'info'),
  ('Marc Kemajou', 'Admin Salle', 'Création du compte caissier (Sophie)', 'Gaming Zone - Yaoundé', '192.168.1.105', now() - interval '2 hours', 'info'),
  ('Sophie (Caisse)', 'Caissier', 'Suppression forcée de session (Poste 4)', 'Gaming Zone - Yaoundé', '192.168.1.112', now() - interval '3 hours', 'warning'),
  ('Alexandre (SA)', 'Super Admin', 'Suspension de la salle (Nexus Gaming)', 'Nexus Gaming - Bafoussam', '192.168.1.100', now() - interval '5 hours', 'critical');
