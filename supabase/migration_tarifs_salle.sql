-- ─── PLAYCONTROL - ISOLATION DES TARIFS ET ABONNEMENTS PAR SALLE DE JEUX ─────

-- 1. Supprimer d'abord la clé étrangère dépendante sur la table postes
ALTER TABLE public.postes DROP CONSTRAINT IF EXISTS postes_type_fkey;

-- 2. Ajouter la colonne salle_id de type UUID pointant vers la table salles
ALTER TABLE public.material_types ADD COLUMN IF NOT EXISTS salle_id UUID REFERENCES public.salles(id) ON DELETE CASCADE;
ALTER TABLE public.abonnement_packages ADD COLUMN IF NOT EXISTS salle_id UUID REFERENCES public.salles(id) ON DELETE CASCADE;

-- 3. Associer les tarifs et forfaits existants à la salle de Paul (GameHub)
UPDATE public.material_types 
SET salle_id = '9315cd40-eec4-412c-9ef3-d1daac605dff'
WHERE salle_id IS NULL;

UPDATE public.abonnement_packages 
SET salle_id = '9315cd40-eec4-412c-9ef3-d1daac605dff'
WHERE salle_id IS NULL;

-- 4. Rendre la colonne salle_id obligatoire (NOT NULL)
ALTER TABLE public.material_types ALTER COLUMN salle_id SET NOT NULL;
ALTER TABLE public.abonnement_packages ALTER COLUMN salle_id SET NOT NULL;

-- 5. Supprimer les anciennes contraintes d'unicité globale
ALTER TABLE public.material_types DROP CONSTRAINT IF EXISTS material_types_type_key;
ALTER TABLE public.abonnement_packages DROP CONSTRAINT IF EXISTS abonnement_packages_type_key;

-- 6. Créer les contraintes uniques composites (par salle)
ALTER TABLE public.material_types ADD CONSTRAINT material_types_type_salle_id_key UNIQUE (type, salle_id);
ALTER TABLE public.abonnement_packages ADD CONSTRAINT abonnement_packages_type_salle_id_key UNIQUE (type, salle_id);

-- 7. Créer la nouvelle contrainte de clé étrangère sur postes(type, salle_id)
ALTER TABLE public.postes ADD CONSTRAINT postes_type_salle_id_fkey FOREIGN KEY (type, salle_id) REFERENCES public.material_types(type, salle_id) ON UPDATE CASCADE ON DELETE RESTRICT;

-- 8. Journaliser l'activité de migration
INSERT INTO public.activity_logs (actor, role, action, salle, severity)
VALUES ('Système', 'Migration', 'Isolation des tarifs et abonnements par salle de jeux', 'Global', 'info');
