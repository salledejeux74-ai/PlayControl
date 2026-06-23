-- ─── PLAYCONTROL - ISOLATION DES REVENUS PAR SALLE DE JEUX ───────────────────
-- À exécuter dans le SQL Editor de Supabase (https://supabase.com/dashboard/project/kkjvujdjhpfyzicfibqv/sql/new)

-- 1. Ajouter la colonne salle_id à la table shifts
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS salle_id UUID REFERENCES public.salles(id) ON DELETE CASCADE;

-- 2. Ajouter la colonne salle_id à la table transactions
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS salle_id UUID REFERENCES public.salles(id) ON DELETE CASCADE;

-- 3. Associer les shifts existants à la salle de Paul (GameHub) via le profil du caissier
UPDATE public.shifts s
SET salle_id = p.salle_id::uuid
FROM public.profiles p
WHERE s.cashier_id = p.id
  AND s.salle_id IS NULL
  AND p.salle_id IS NOT NULL;

-- Fallback: si le profil n'a pas de salle_id, associer à la salle de Paul
UPDATE public.shifts
SET salle_id = '9315cd40-eec4-412c-9ef3-d1daac605dff'
WHERE salle_id IS NULL;

-- 4. Associer les transactions existantes à la salle via le shift correspondant
UPDATE public.transactions t
SET salle_id = s.salle_id
FROM public.shifts s
WHERE t.shift_id = s.id
  AND t.salle_id IS NULL;

-- 5. Rendre salle_id obligatoire (NOT NULL) après migration
ALTER TABLE public.shifts ALTER COLUMN salle_id SET NOT NULL;
ALTER TABLE public.transactions ALTER COLUMN salle_id SET NOT NULL;

-- 7. Activer realtime sur transactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;

-- 8. Journaliser l'activité de migration
INSERT INTO public.activity_logs (actor, role, action, salle, severity)
VALUES ('Système', 'Migration', 'Isolation des revenus et transactions par salle de jeux', 'Global', 'info');
