-- ─── PLAYCONTROL - ISOLATION DES POSTES PAR SALLE DE JEUX ───────────────────

-- 1. Ajouter la colonne salle_id de type UUID pointant vers la table salles
ALTER TABLE public.postes ADD COLUMN IF NOT EXISTS salle_id UUID REFERENCES public.salles(id) ON DELETE CASCADE;

-- 2. Associer les postes existants à une salle existante par défaut (pour éviter les valeurs NULL)
UPDATE public.postes 
SET salle_id = (SELECT id FROM public.salles ORDER BY created_at ASC LIMIT 1) 
WHERE salle_id IS NULL;

-- 3. Rendre la colonne salle_id obligatoire (NOT NULL)
ALTER TABLE public.postes ALTER COLUMN salle_id SET NOT NULL;

-- 4. Supprimer l'ancienne contrainte d'unicité globale sur le nom du poste
ALTER TABLE public.postes DROP CONSTRAINT IF EXISTS postes_name_key;

-- 5. Créer une nouvelle contrainte d'unicité composite (nom unique par salle)
ALTER TABLE public.postes ADD CONSTRAINT postes_name_salle_id_key UNIQUE (name, salle_id);

-- 6. Journaliser l'activité de migration
INSERT INTO public.activity_logs (actor, role, action, salle, severity)
VALUES ('Système', 'Migration', 'Ajout de la colonne salle_id aux postes de jeu et restriction par salle', 'Global', 'info');
