-- ─── PLAYCONTROL - GESTION DES EMPLOYÉS DANS PROFILES ───────────────────────

-- 1. Ajouter les colonnes phone et status à la table profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended'));

-- 2. Mettre à jour la fonction handle_new_user pour insérer le téléphone et le statut lors de la création d'un utilisateur
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role, salle_id, temp_password, phone, status)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', 'Utilisateur'),
    COALESCE(new.raw_user_meta_data->>'role', 'caissier'),
    new.raw_user_meta_data->>'salle_id',
    new.raw_user_meta_data->>'temp_password',
    new.raw_user_meta_data->>'phone',
    COALESCE(new.raw_user_meta_data->>'status', 'active')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Désactiver les politiques RLS sur profiles (si besoin de faire des requêtes en direct par d'autres rôles)
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
