-- ─── PLAYCONTROL - INSERTION DES DONNÉES MOCKÉES (SEED) ───────────────────────

-- 1. Insertion des configurations globales (Settings)
INSERT INTO public.settings (salle_name, salle_address, phone_country_code, raw_phone_num, currency, tax_rate, is_active)
VALUES ('Zone Gaming Center', 'Bastos, Yaoundé, Cameroun', '+237', '699999999', 'FCFA', 0.00, true);

-- 2. Insertion des Tarifs / Types de Matériel
INSERT INTO public.material_types (type, label, price, duration_minutes)
VALUES
  ('ps5_vip', 'Console PS5 (Zone VIP)', 1500, 60),
  ('ps5_standard', 'Console PS5 (Zone Standard)', 1000, 60),
  ('ps4_standard', 'Console PS4 (Zone Standard)', 800, 60);

-- 3. Insertion des Formules d'Abonnement (Packages)
INSERT INTO public.abonnement_packages (type, price, duration_hours)
VALUES
  ('Journalier', 5000, 6),
  ('Hebdomadaire', 15000, 20),
  ('Mensuel', 45000, 65),
  ('VIP', 75000, 100);

-- 4. Insertion des Clients Membres
INSERT INTO public.clients (username, full_name, phone, balance, abonnement_type, abonnement_expiration, abonnement_remaining_time, status)
VALUES
  ('gamer_pro', 'Arthur Mbé', '+237699887766', 12000, 'VIP', now() + interval '30 days', 6000, 'active'),
  ('marc_k', 'Marc Kamga', '+237677554433', 1500, 'Aucun', null, 0, 'active'),
  ('alain_t', 'Alain Tchakounté', '+237655443322', 0, 'Journalier', now() + interval '1 day', 360, 'active'),
  ('jr_zogo', 'Junior Zogo', '+237688776655', 5000, 'Aucun', null, 0, 'suspended');

-- 5. Insertion des Consoles de Jeu (Postes)
INSERT INTO public.postes (name, type, characteristics, smart_plug_ip, status, client_name, session_code, minutes_remaining, total_duration)
VALUES
  ('PS5 - VIP #1', 'ps5_vip', 'Écran 4K 120Hz, Canapé Confort VIP, Manette DualSense Edge', '192.168.1.101', 'occupe', 'gamer_pro', null, 45, 120),
  ('PS5 - Standard #2', 'ps5_standard', 'Écran 1080p, Manette standard', '192.168.1.102', 'libre', null, null, null, null),
  ('PS5 - Standard #3', 'ps5_standard', 'Écran 1080p, Manette standard', '192.168.1.103', 'hors-service', null, null, null, null),
  ('PS5 - VIP #2', 'ps5_vip', 'Écran 4K 120Hz, Canapé Confort VIP', '192.168.1.104', 'occupe', 'marc_k', null, 120, 180),
  ('PS4 - Standard #1', 'ps4_standard', 'Écran 1080p, Manette DualShock 4', '192.168.1.105', 'libre', null, null, null, null),
  ('PS4 - Standard #2', 'ps4_standard', 'Écran 1080p, Manette DualShock 4', '192.168.1.106', 'libre', null, null, null, null),
  ('PS5 - VIP #3', 'ps5_vip', 'Écran 4K 120Hz, Canapé Confort VIP', '192.168.1.107', 'occupe', 'alain_t', null, 15, 60),
  ('PS4 - Standard #3', 'ps4_standard', 'Écran 1080p, Manette DualShock 4', '192.168.1.108', 'libre', null, null, null, null);

-- 6. Insertion des utilisateurs Mockés dans Supabase Auth (auth.users)
-- Le mot de passe crypté ci-dessous correspond à 'password' (hachage bcrypt standard compatible Supabase)
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
  (
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-1111-1111-111111111111',
    'authenticated',
    'authenticated',
    'superadmin@playcontrol.com',
    '$2a$10$2B7Qy.1qE4K2l7t4JjNqLuA4.V5xR7d4gLq8d1b1P4zZgYxV9z6wG',
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
  (
    '00000000-0000-0000-0000-000000000000',
    '22222222-2222-2222-2222-222222222222',
    'authenticated',
    'authenticated',
    'salle.admin@playcontrol.com',
    '$2a$10$2B7Qy.1qE4K2l7t4JjNqLuA4.V5xR7d4gLq8d1b1P4zZgYxV9z6wG',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Marc - Gérant","role":"admin","salle_id":"salle_gaming_zone"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '33333333-3333-3333-3333-333333333333',
    'authenticated',
    'authenticated',
    'sophie.caisse@playcontrol.com',
    '$2a$10$2B7Qy.1qE4K2l7t4JjNqLuA4.V5xR7d4gLq8d1b1P4zZgYxV9z6wG',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Sophie - Caissière","role":"caissier","salle_id":"salle_gaming_zone"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  )
ON CONFLICT (id) DO NOTHING;
