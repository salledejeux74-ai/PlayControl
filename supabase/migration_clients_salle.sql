-- ─── PLAYCONTROL - ISOLATION DES CLIENTS PAR SALLE DE JEUX ───────────────────

-- 1. Ajouter la colonne salle_id de type UUID pointant vers la table salles
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS salle_id UUID REFERENCES public.salles(id) ON DELETE CASCADE;

-- 2. Associer les clients existants à la salle de Paul (GameHub) par défaut
UPDATE public.clients 
SET salle_id = '9315cd40-eec4-412c-9ef3-d1daac605dff'
WHERE salle_id IS NULL;

-- 3. Rendre la colonne salle_id obligatoire (NOT NULL)
ALTER TABLE public.clients ALTER COLUMN salle_id SET NOT NULL;

-- 4. Journaliser l'activité de migration
INSERT INTO public.activity_logs (actor, role, action, salle, severity)
VALUES ('Système', 'Migration', 'Ajout de la colonne salle_id aux clients et restriction par salle', 'Global', 'info');
