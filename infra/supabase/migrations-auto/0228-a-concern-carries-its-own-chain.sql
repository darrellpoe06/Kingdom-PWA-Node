-- =============================================================================
-- 0228 -- a concern carries its own chain: evidence, impact, the decision it
-- needs, its outcome, and who owns it -- as columns, not as prose in a note
-- =============================================================================
-- Darrell 2026-09-23, from his governance brief: any stakeholder should open
-- the board and see "what the issue was, what evidence supported it, what
-- business impact occurred, what decision was required, what outcome
-- resulted" -- the four columns he recommends beside Status / Owner / Due --
-- and then: "Make sure the workflows are database fields connected to the
-- systems... processes are rigorous and maintained."
--
-- THE REAL DATA (DR-0061). The concerns table (0039) is the board the family
-- and the app's own checks already write to: concern (the issue), solution
-- (the intended fix), target_date, status, area, links. It has no column for
-- what PROVES the concern, what it COSTS unresolved, what DECISION it waits
-- on, or what came of it; those, when written at all, are folded into the
-- solution text where nothing can read them back. This file adds the five
-- columns so the chain is a database fact the boards edit, the decisions
-- surface derives from, and the intelligence layer (repeated risks, stalls,
-- ownership gaps, decisions waiting) can count -- never inferred from prose.
--
-- Additive and idempotent. No policy changes: the 0039 self-scoped instance
-- policies and the viewer / assistant overlays already cover the row; new
-- columns inherit them. Nullable on purpose -- an empty column reads as "not
-- recorded", which the surface says out loud rather than painting a value.
-- =============================================================================

ALTER TABLE public.concerns ADD COLUMN IF NOT EXISTS evidence          text;  -- what proves this is a real issue
ALTER TABLE public.concerns ADD COLUMN IF NOT EXISTS impact            text;  -- what happens if unresolved
ALTER TABLE public.concerns ADD COLUMN IF NOT EXISTS decision_required text;  -- who needs to decide what
ALTER TABLE public.concerns ADD COLUMN IF NOT EXISTS outcome           text;  -- final disposition
ALTER TABLE public.concerns ADD COLUMN IF NOT EXISTS owner             text;  -- the person who carries it (a persona / name, not an auth id)

COMMENT ON COLUMN public.concerns.evidence          IS 'What proves this is a real issue (runs, rows, recordings, quotes). DR-0589.';
COMMENT ON COLUMN public.concerns.impact            IS 'What happens if unresolved: cost, delay, who is affected. DR-0589.';
COMMENT ON COLUMN public.concerns.decision_required IS 'Who needs to decide what. Non-empty on an open row = a decision is waiting. DR-0589.';
COMMENT ON COLUMN public.concerns.outcome           IS 'Final disposition once resolved. DR-0589.';
COMMENT ON COLUMN public.concerns.owner             IS 'Who carries this concern. Empty on an open row = an ownership gap. DR-0589.';

-- A stalled or waiting concern is found by status + these dates; the partial
-- index keeps that read cheap as the board grows.
CREATE INDEX IF NOT EXISTS concerns_open_updated_idx
  ON public.concerns (instance_id, updated_at)
  WHERE status <> 'done';

NOTIFY pgrst, 'reload schema';
