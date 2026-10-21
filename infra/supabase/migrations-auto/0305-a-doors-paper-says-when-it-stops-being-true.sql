-- =============================================================================
-- 0305 — A door's paper says when it stops being true (DR-1163)
-- =============================================================================
-- Darrell 2026-10-21: "Also... documents and renewal dates on a calendar with
-- reminders etc..."
--
-- WHAT EXISTED. property_documents (0154) carries `effective_on` and no expiry.
-- DR-1084 built the registry of what expires (document-validity.js) and the
-- calendar proposals (DocumentRenewals.jsx), and mounted them on the Legal
-- shelf only; a door's papers never met them, and a date read off the paper
-- had nowhere to live, so the only expiry the app could ever show for a lease
-- or a policy was the kind's usual term, a guess marked as one.
--
-- WHAT THIS ADDS. One nullable column: the day the paper stops being true, as
-- read off the document. Null means "not read", never "does not expire"
-- (DR-1084 rule 1: undated is never valid). RLS is unchanged: 0154's policies
-- already say who writes a document (the family; a delegated worker on the
-- tenancy) and who reads it (the tenant and household their own).
ALTER TABLE public.property_documents ADD COLUMN IF NOT EXISTS expires_on date;
COMMENT ON COLUMN public.property_documents.expires_on IS
  'DR-1163: the day this paper stops being true, read off the document. NULL = not read; the kind''s usual term (DR-1084) is then only a proposal, never a fact.';
