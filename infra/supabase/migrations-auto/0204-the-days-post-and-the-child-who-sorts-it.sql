-- =============================================================================
-- 0204 — The day's post, and the child who sorts it (DR-0360)
-- =============================================================================
-- Darrell, 2026-09-11, answering whether a child may sort the day's post:
--   "Yes. We want our children to learn the process and a system helps them to
--    learn how we work"
--
-- And the shape of the work, from the same day:
--   "people can review their documents that came in that day and sort them to
--    their respective products and locations for users to see a now or later
--    whenever they want"
--
-- WHAT 0202 ALREADY BUILT: `document_route` sorts a document by what it means
-- (bill-to-pay / proof-of-payment / for-the-record), which product, and which
-- place — reversibly, audited. Its rule is "the person who filed it, or an
-- owner or admin". A CHILD is neither, so under 0202 a child cannot sort
-- anything except what they filed themselves, and cannot even SEE a document
-- someone else filed unless it was shared with the whole household.
--
-- THE TENSION THIS FILE RESOLVES. Darrell wants the children learning the
-- process. DR-0094 says what a child sees stays the guardian's decision, and
-- the books wall (0082/0100, kept by 0202/0203) keeps a child out of the
-- ledger entirely. Handing a child the whole shelf would break both.
--
-- THE RESOLUTION: A GUARDIAN RELEASES ONE DOCUMENT AT A TIME INTO THE TRAY.
-- Releasing is the guardian's judgement, recorded with their name and the
-- moment — exactly the decision DR-0094 reserves to them, now written down
-- instead of implied. A released document a child can see and sort; everything
-- else on the shelf stays invisible to them, and the ledger stays invisible
-- either way. A child never learns an amount from this: they learn that post
-- arrives, that it means something, and that it belongs somewhere.
--
-- Sorting is the lesson. The books are not.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. The release — a guardian's decision, with their name on it.
-- ---------------------------------------------------------------------------
ALTER TABLE public.family_documents
  ADD COLUMN IF NOT EXISTS sorting_released_at timestamptz;
ALTER TABLE public.family_documents
  ADD COLUMN IF NOT EXISTS sorting_released_by uuid REFERENCES auth.users(id);

-- A release is either whole or absent: a timestamp with nobody's name on it is
-- a decision with no one accountable for it.
ALTER TABLE public.family_documents DROP CONSTRAINT IF EXISTS family_documents_release_whole_chk;
ALTER TABLE public.family_documents
  ADD CONSTRAINT family_documents_release_whole_chk
  CHECK ((sorting_released_at IS NULL) = (sorting_released_by IS NULL));

CREATE INDEX IF NOT EXISTS family_documents_tray_idx
  ON public.family_documents (instance_id, sorting_released_at)
  WHERE sorting_released_at IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 2. A released document is visible to the household — and only that one.
-- ---------------------------------------------------------------------------
-- 0201's read policy is: yours, or shared with the household. This ADDS a third
-- door, deliberately narrow: a document a guardian has released for sorting.
-- The file BYTES are untouched by this — storage policies still require the
-- document to be the reader's own or shared, so releasing a document for
-- sorting does NOT hand a child the PDF. They sort what the household calls it,
-- not what is inside it.
DROP POLICY IF EXISTS family_documents_read ON public.family_documents;
CREATE POLICY family_documents_read ON public.family_documents FOR SELECT TO authenticated
  USING (created_by = auth.uid()
         OR (shared_with_household AND public.user_in_instance(instance_id))
         OR (sorting_released_at IS NOT NULL AND public.user_in_instance(instance_id)));

-- ---------------------------------------------------------------------------
-- 3. Releasing and withdrawing. Owner or admin only — never a child.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.document_release_for_sorting(
  document_id_in uuid,
  release_in     boolean DEFAULT true
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_doc  public.family_documents%ROWTYPE;
  v_role text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'sign in first'; END IF;

  SELECT * INTO v_doc FROM public.family_documents WHERE id = document_id_in;
  IF v_doc.id IS NULL THEN RAISE EXCEPTION 'no such document'; END IF;

  v_role := coalesce(public.user_role_in_instance(v_doc.instance_id), '');
  IF coalesce(v_role, '') NOT IN ('owner','admin') THEN
    RAISE EXCEPTION 'only a guardian decides what a child sees';
  END IF;

  UPDATE public.family_documents
     SET sorting_released_at = CASE WHEN release_in THEN now() ELSE NULL END,
         sorting_released_by = CASE WHEN release_in THEN auth.uid() ELSE NULL END,
         updated_at = now()
   WHERE id = v_doc.id
   RETURNING * INTO v_doc;

  INSERT INTO audit_log (instance_id, user_id, action, entity_type, entity_id, from_value, to_value, note)
  VALUES (v_doc.instance_id, auth.uid(), 'update', 'family_document', v_doc.id, NULL,
          jsonb_build_object('sorting_released', release_in),
          CASE WHEN release_in THEN 'released for sorting' ELSE 'withdrawn from the tray' END);

  RETURN to_jsonb(v_doc);
END;
$$;

REVOKE ALL ON FUNCTION public.document_release_for_sorting(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.document_release_for_sorting(uuid, boolean) TO authenticated;

-- ---------------------------------------------------------------------------
-- 4. Sorting, widened by exactly one case.
-- ---------------------------------------------------------------------------
-- Same signature and return type as 0202's, so this replaces rather than adds.
-- The ONLY change is the third branch: a member of this household — a child
-- included — may sort a document a guardian released. Everything else 0202
-- refused, this still refuses.
CREATE OR REPLACE FUNCTION public.document_route(
  document_id_in uuid,
  means_in       text DEFAULT NULL,
  product_in     text DEFAULT NULL,
  place_in       text DEFAULT NULL,
  arrived_on_in  date DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_doc  public.family_documents%ROWTYPE;
  v_role text;
  v_may  boolean;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'sign in first'; END IF;
  IF means_in IS NOT NULL AND means_in NOT IN ('bill-to-pay','proof-of-payment','for-the-record') THEN
    RAISE EXCEPTION 'a document is a bill to pay, proof of payment, or for the record';
  END IF;
  IF product_in IS NOT NULL AND product_in NOT IN ('poetech','properties','tlc') THEN
    RAISE EXCEPTION 'no such product to sort it to';
  END IF;

  SELECT * INTO v_doc FROM public.family_documents WHERE id = document_id_in;
  IF v_doc.id IS NULL THEN RAISE EXCEPTION 'no such document'; END IF;

  v_role := coalesce(public.user_role_in_instance(v_doc.instance_id), '');

  v_may := v_doc.created_by = auth.uid()
        OR coalesce(v_role, '') IN ('owner','admin')
        -- The child's lane: released by a guardian, sorted by anyone in the
        -- household. A person outside it is still nobody here.
        OR (v_doc.sorting_released_at IS NOT NULL AND coalesce(v_role, '') <> '');

  IF NOT v_may THEN
    RAISE EXCEPTION 'only the person who filed it, a guardian, or the household when it is in the sorting tray';
  END IF;

  UPDATE public.family_documents
     SET means = means_in,
         routed_product = product_in,
         routed_place = nullif(btrim(coalesce(place_in,'')),''),
         arrived_on = coalesce(arrived_on_in, arrived_on),
         routed_at = CASE WHEN means_in IS NULL AND product_in IS NULL THEN NULL ELSE now() END,
         routed_by = CASE WHEN means_in IS NULL AND product_in IS NULL THEN NULL ELSE auth.uid() END,
         updated_at = now()
   WHERE id = v_doc.id
   RETURNING * INTO v_doc;

  INSERT INTO audit_log (instance_id, user_id, action, entity_type, entity_id, from_value, to_value, note)
  VALUES (v_doc.instance_id, auth.uid(), 'update', 'family_document', v_doc.id, NULL,
          jsonb_build_object('means', v_doc.means, 'product', v_doc.routed_product,
                             'place', v_doc.routed_place, 'sorted_from_tray', v_doc.sorting_released_at IS NOT NULL),
          'document_route');

  RETURN to_jsonb(v_doc);
END;
$$;

REVOKE ALL ON FUNCTION public.document_route(uuid, text, text, text, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.document_route(uuid, text, text, text, date) TO authenticated;

SELECT public.apply_assistant_scope_overlay();
SELECT public.apply_viewer_readonly_overlay();

NOTIFY pgrst, 'reload schema';
