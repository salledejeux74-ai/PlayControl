-- ─── PLAYCONTROL - FIX NOTIFICATIONS ────────────────────────────────────────
-- Exécuter dans : Supabase → SQL Editor → New query

-- ── 1. Créer la table si elle n'existe pas ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id            UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  salle_id      UUID    REFERENCES public.salles(id) ON DELETE CASCADE,
  recipient_role TEXT   NOT NULL CHECK (recipient_role IN ('admin', 'superadmin', 'caissier', 'all')),
  type          TEXT    NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error')),
  title         TEXT    NOT NULL,
  message       TEXT    NOT NULL,
  is_read       BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 2. Index ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS notifications_salle_id_idx  ON public.notifications(salle_id);
CREATE INDEX IF NOT EXISTS notifications_recipient_idx ON public.notifications(recipient_role);
CREATE INDEX IF NOT EXISTS notifications_is_read_idx   ON public.notifications(is_read);

-- ── 3. Désactiver RLS (permet les UPDATE depuis le client) ───────────────────
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;

-- Note: la ligne "ALTER PUBLICATION supabase_realtime ADD TABLE notifications"
-- a été retirée car la table est déjà membre de la publication.
