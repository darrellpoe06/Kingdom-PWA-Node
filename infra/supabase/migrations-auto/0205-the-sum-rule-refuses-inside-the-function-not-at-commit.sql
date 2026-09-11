-- =============================================================================
-- 0205 — The sum rule refuses INSIDE the function, not at commit (DR-0363)
-- =============================================================================
-- A real defect in 0203, caught by its own smoke on the rls-isolation leg
-- (runs 149 and 150, 2026-09-11) and NOT by the local probe that preceded it.
-- Worth recording exactly, because the local probe passed for the wrong reason.
--
-- WHAT WENT WRONG. 0203 enforces "line items must add up to the payment" with a
-- CONSTRAINT TRIGGER that is DEFERRABLE INITIALLY DEFERRED. Deferred means it
-- fires at COMMIT — not when the statement ends, and not when
-- `obligation_set_lines` returns. So inside any open transaction the function
-- writes a breakdown that does not add up, returns the rows, and reports
-- success. The smoke called it with a short set, saw no error, and correctly
-- failed with "a breakdown SHORT of the payment was accepted".
--
-- The local probe missed it because it forced `SET CONSTRAINTS ALL IMMEDIATE`
-- to observe the trigger — which is exactly the condition the real function
-- does not create. A probe that arranges the world so the check fires is not
-- proof that the check fires. That is the lesson (DR-0076 §3: proven-to-catch
-- means proven in the shape the code actually runs in).
--
-- Production was less wrong than the smoke: PostgREST runs each RPC in its own
-- transaction, so the deferred trigger did fire at commit and the client did
-- get an error. But the error arrived from the commit rather than from the
-- function, the function's own return value was a lie, and any caller inside a
-- larger transaction got the failure late or not at all.
--
-- THE FIX: the function checks the sum itself, before it returns. The deferred
-- trigger STAYS as the backstop for any other path into the table — belt and
-- braces, with the belt now doing the work at the moment of the write.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.obligation_set_lines(
  obligation_id_in uuid,
  lines_in         jsonb
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_instance uuid;
  v_role     text;
  v_line     jsonb;
  v_out      jsonb;
  v_count    int;
  v_total    bigint;
  v_amount   bigint;
BEGIN
  SELECT instance_id, amount_cents INTO v_instance, v_amount
    FROM public.obligations WHERE id = obligation_id_in;
  IF v_instance IS NULL THEN RAISE EXCEPTION 'no such obligation'; END IF;

  v_role := coalesce(public.user_role_in_instance(v_instance), '');
  IF coalesce(v_role, '') NOT IN ('owner','admin') THEN
    RAISE EXCEPTION 'only the owner or an admin keeps the books';
  END IF;

  -- Replacing the set is the honest edit: the parts of one payment are one
  -- fact, and half-replacing them is how a total stops matching its parts.
  DELETE FROM public.obligation_lines WHERE obligation_id = obligation_id_in;

  FOR v_line IN SELECT * FROM jsonb_array_elements(coalesce(lines_in, '[]'::jsonb))
  LOOP
    INSERT INTO public.obligation_lines
      (instance_id, obligation_id, created_by, kind, label, amount_cents, note)
    VALUES (
      v_instance,
      obligation_id_in,
      auth.uid(),
      v_line->>'kind',
      nullif(btrim(coalesce(v_line->>'label', '')), ''),
      (v_line->>'amountCents')::bigint,
      nullif(btrim(coalesce(v_line->>'note', '')), '')
    );
  END LOOP;

  -- THE CHECK, HERE, NOW. The deferred trigger would not fire until commit,
  -- which is far too late to be the thing standing between the books and a
  -- total that disagrees with its own parts.
  SELECT count(*), coalesce(sum(amount_cents), 0)
    INTO v_count, v_total
    FROM public.obligation_lines WHERE obligation_id = obligation_id_in;

  IF v_count > 0 AND v_total <> v_amount THEN
    RAISE EXCEPTION
      'the line items come to % but the payment is % — line items must add up to the total (%.2f vs %.2f)',
      v_total, v_amount, v_total / 100.0, v_amount / 100.0;
  END IF;

  SELECT jsonb_agg(jsonb_build_object(
           'id', id, 'kind', kind, 'label', label,
           'amountCents', amount_cents, 'note', note
         ) ORDER BY kind)
    INTO v_out
    FROM public.obligation_lines WHERE obligation_id = obligation_id_in;

  RETURN coalesce(v_out, '[]'::jsonb);
END;
$$;

REVOKE ALL ON FUNCTION public.obligation_set_lines(uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.obligation_set_lines(uuid, jsonb) TO authenticated;

SELECT public.apply_assistant_scope_overlay();
SELECT public.apply_viewer_readonly_overlay();

NOTIFY pgrst, 'reload schema';
