-- =============================================================================
-- 0225 -- the five migrations that never lived in this repository come home
-- =============================================================================
-- THE MEASUREMENT (nas-health run 35872569736, 2026-09-23 14:13Z, the first
-- post-repoint parity line ever read; cutover_sync.py "post-repoint" mode):
--
--   go=false
--   tables missing on the sovereign box, by name:
--     _expected_grants, _sync_tokens, course_shares, courses, lessons
--   functions missing (17):  assert_expected_grants, claim_course_share,
--     courses_bump_on_lesson_change, immutable_join, learn_touch_updated_at,
--     ledger_order_disagreements, ledger_reject_duplicate_ordinal,
--     lessons_inherit_instance, lessons_needing_audio, migration_ordinal,
--     mint_course_share, refresh_expected_grants, revoke_course_share,
--     set_lesson_audio, sync_learn_catalog, sync_learn_catalog_result,
--     upsert_course_from_json
--   triggers missing (5):  _schema_migrations.ledger_unique_ordinal,
--     courses.courses_touch, lessons.lessons_bump_course,
--     lessons.lessons_instance, lessons.lessons_touch
--   rls policies missing (35): the 12 admin/member policies on courses,
--     lessons and course_shares, plus the 23 overlay policies the two overlay
--     functions stamp on any RLS table that carries instance_id (they could
--     not stamp tables that did not exist), plus push_subscriptions'
--     viewer_readonly_* (0181 named it a participation table; the overlay
--     had not been re-run on the box since).
--
-- THE CAUSE, read from the hosted ledger (public._schema_migrations), not
-- inferred: five rows exist there that NO file in this repository has ever
-- carried --
--
--   0168-the-ledger-refuses-a-second-file-with-the-same-number.sql
--   0169-grants-are-asserted-after-every-migration.sql
--   0170-courses-a-lesson-belongs-to-a-course.sql          (all four applied
--   0171-a-course-is-imported-the-same-way-twice.sql        2026-09-05 14:50:44Z)
--   0172-a-lesson-can-carry-its-own-voice.sql              (2026-09-05 14:54:49Z)
--
-- #1467 (2026-09-05) met them as ordinal collisions and renumbered THIS
-- repository's files around them ("a courses/grants workstream is applying
-- migrations to the same database from outside main"). It moved our numbers;
-- it could not move their SQL here, because the files were never here. The
-- sovereign replay (infra/nas-supabase/replay_migrations.sh) restores the
-- hosted baseline of 2026-08-19 and then replays only migrations-auto files
-- that sort after it. Five migrations that hosted ran on 2026-09-05 from
-- outside the repository are therefore invisible to the box: the ledger row
-- count matches (230 = 230, the ledger table rides the baseline dump) while
-- the objects do not. That is the whole NO-GO, named at last (DR-0583).
--
-- WHAT THIS FILE IS. The five migrations' effect, recovered from the hosted
-- catalog itself (pg_get_functiondef, pg_get_constraintdef, pg_get_triggerdef,
-- pg_policies, pg_indexes, information_schema, the comments on every object),
-- 2026-09-23. Not a re-typing from memory of files nobody here has read.
-- Written so that it is a NO-OP where the objects already exist (hosted) and
-- creates them where they do not (the box): create-if-not-exists for tables,
-- create-or-replace for functions, drop-if-exists + create for policies and
-- triggers. Applied through the same ledger on both sides, it lands as 0225
-- on each; the five external rows stay exactly as hosted recorded them.
--
-- WHAT IS NOT COPIED, on purpose. (1) The learn-catalog sync TOKEN. Hosted
-- holds a 64-char shared secret in _sync_tokens; a secret does not travel in a
-- migration file. The box mints its own on first apply (below) -- the edge
-- function that reads it is hosted-only today (the URL inside
-- sync_learn_catalog is hosted's), so the box's token is a placeholder until
-- that function moves, and this comment says so. (2) The _expected_grants
-- SNAPSHOT rows (3,497 on hosted). refresh_expected_grants() re-snapshots
-- from the live grants on first apply where the table is empty; hosted's
-- snapshot is left untouched (a re-snapshot there would silently bless
-- whatever grants exist today, which is exactly what the assertion exists to
-- question).
--
-- The ledger trigger is created LAST, after this file's own DDL, and it fires
-- on the ledger INSERT that records this file -- which is the first time the
-- sovereign ledger is guarded the way hosted's has been since 2026-09-05.
-- =============================================================================

-- Two of the recovered functions are LANGUAGE sql over net._http_response
-- (pg_net). A SQL-language body is checked at CREATE time, so on a box where
-- the `net` schema is absent the CREATE itself would fail and take the whole
-- file with it. The bodies are hosted's verbatim (already proven there); the
-- check is skipped for this file only, the way pg_dump restores do, and
-- restored at the end.
SET check_function_bodies = off;

-- ---------------------------------------------------------------------------
-- 0168: the ledger refuses a second file with the same number
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.migration_ordinal(p_filename text)
 RETURNS integer
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$ select nullif(substring(p_filename from '^([0-9]+)'), '')::integer $function$;
COMMENT ON FUNCTION public.migration_ordinal(text) IS 'Leading numeric ordinal of a migration filename. Null if the name has none.';

CREATE OR REPLACE FUNCTION public.ledger_reject_duplicate_ordinal()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_ord integer := public.migration_ordinal(new.filename); v_clash text;
begin
  if v_ord is null then raise exception 'migration % has no leading ordinal', new.filename using errcode = '23514'; end if;
  select filename into v_clash from public._schema_migrations where public.migration_ordinal(filename) = v_ord and filename <> new.filename limit 1;
  if v_clash is not null then raise exception 'ordinal % already used by % — pick the next free number', lpad(v_ord::text,4,'0'), v_clash using errcode='23505', hint='See FAILURE-REGISTER.md §A2. Applied history is frozen; new files must be unique.'; end if;
  return new; end $function$;

CREATE OR REPLACE FUNCTION public.ledger_order_disagreements()
 RETURNS TABLE(filename text, applied_at timestamp with time zone, previous_filename text)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
  with m as (select filename, applied_at, public.migration_ordinal(filename) as ord, lag(filename) over (order by applied_at, filename) as prev_name, lag(public.migration_ordinal(filename)) over (order by applied_at, filename) as prev_ord from public._schema_migrations)
  select filename, applied_at, prev_name from m where prev_ord is not null and ord < prev_ord $function$;
COMMENT ON FUNCTION public.ledger_order_disagreements() IS 'Rows where a migration was applied after a higher-numbered one. Six historical rows are expected; any new row fails the gate.';

-- ---------------------------------------------------------------------------
-- 0169: grants are asserted after every migration
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public._expected_grants (
  grantee     text NOT NULL,
  table_name  text NOT NULL,
  privilege   text NOT NULL,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (grantee, table_name, privilege)
);
COMMENT ON TABLE public._expected_grants IS 'Snapshot of table grants for anon/authenticated/service_role. assert_expected_grants() fails a deploy if any of these are missing (W5). Internal — no RLS policies, no API access.';
ALTER TABLE public._expected_grants ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public._expected_grants FROM anon, authenticated;
GRANT ALL ON public._expected_grants TO service_role;

CREATE OR REPLACE FUNCTION public.refresh_expected_grants()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_count integer; begin delete from public._expected_grants;
  insert into public._expected_grants (grantee, table_name, privilege) select grantee, table_name, privilege_type from information_schema.role_table_grants where table_schema='public' and grantee in ('anon','authenticated','service_role') and table_name not like '\_%' on conflict do nothing;
  get diagnostics v_count = row_count; return v_count; end $function$;
COMMENT ON FUNCTION public.refresh_expected_grants() IS 'Re-snapshot current grants as the expected set. Call only from a migration that intentionally changes grants.';
REVOKE ALL ON FUNCTION public.refresh_expected_grants() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.assert_expected_grants()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_missing text; v_n integer; begin
  select count(*), string_agg(format('%s:%s:%s', e.grantee, e.table_name, e.privilege), ', ' order by e.table_name, e.grantee, e.privilege) into v_n, v_missing from public._expected_grants e
  left join information_schema.role_table_grants g on g.table_schema='public' and g.table_name=e.table_name and g.grantee=e.grantee and g.privilege_type=e.privilege
  where g.table_name is null and exists (select 1 from information_schema.tables t where t.table_schema='public' and t.table_name=e.table_name);
  if v_n > 0 then raise exception 'GRANT LOSS: % expected grant(s) missing — %', v_n, v_missing using errcode='42501', hint='A migration dropped grants as collateral damage (FAILURE-REGISTER §A1). Re-grant, or refresh_expected_grants() if the change was intentional.'; end if; end $function$;
COMMENT ON FUNCTION public.assert_expected_grants() IS 'Raises if any snapshotted grant is missing on a table that still exists. Dropped tables are ignored. Run at the end of every migration and in CI (W5).';
REVOKE ALL ON FUNCTION public.assert_expected_grants() FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 0170: courses -- a lesson belongs to a course
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.immutable_join(p_parts text[])
 RETURNS text
 LANGUAGE sql
 IMMUTABLE PARALLEL SAFE
 SET search_path TO 'public', 'pg_temp'
AS $function$ select array_to_string(p_parts, ' ') $function$;
COMMENT ON FUNCTION public.immutable_join(text[]) IS 'Immutable wrapper over array_to_string(arr, '' '') for use in generated columns.';

CREATE TABLE IF NOT EXISTS public.courses (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id   uuid NOT NULL REFERENCES public.instances(id) ON DELETE CASCADE,
  slug          text NOT NULL,
  title         text NOT NULL,
  subtitle      text,
  version       integer NOT NULL DEFAULT 1,
  status        text NOT NULL DEFAULT 'draft' CONSTRAINT courses_status_check CHECK (status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text])),
  total_minutes integer,
  created_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT courses_instance_id_slug_key UNIQUE (instance_id, slug)
);
COMMENT ON TABLE public.courses IS 'A teaching course owned by one instance. Version increments whenever any lesson in it changes; share packs and live sessions cite the version they were built from.';
COMMENT ON COLUMN public.courses.version IS 'Bumped by trigger on any lesson insert/update/delete. A shared pack records this number so a church can tell when it is behind.';
COMMENT ON COLUMN public.courses.status IS 'draft = editable, invisible to shares. published = shareable. archived = retained, hidden from browse.';
COMMENT ON COLUMN public.courses.total_minutes IS 'Cached sum of lessons.weight_minutes. Recomputed by trigger; never hand-edited.';
CREATE INDEX IF NOT EXISTS courses_instance_idx ON public.courses USING btree (instance_id, status);

CREATE TABLE IF NOT EXISTS public.lessons (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id      uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  instance_id    uuid NOT NULL REFERENCES public.instances(id) ON DELETE CASCADE,
  week_no        integer NOT NULL CONSTRAINT lessons_week_no_check CHECK (week_no > 0),
  title          text NOT NULL,
  scriptures     text[] NOT NULL DEFAULT '{}'::text[],
  bodies         jsonb NOT NULL DEFAULT '{}'::jsonb CONSTRAINT lessons_bodies_check CHECK (jsonb_typeof(bodies) = 'object'::text),
  notes          text,
  weight_minutes integer NOT NULL DEFAULT 10 CONSTRAINT lessons_weight_minutes_check CHECK (weight_minutes > 0),
  search_text    tsvector GENERATED ALWAYS AS (
                   (setweight(to_tsvector('english'::regconfig, COALESCE(title, ''::text)), 'A'::"char")
                   || setweight(to_tsvector('english'::regconfig, public.immutable_join(scriptures)), 'B'::"char"))
                   || setweight(to_tsvector('english'::regconfig, COALESCE((bodies ->> 'everyone'::text), ''::text)), 'C'::"char")
                 ) STORED,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lessons_course_id_week_no_key UNIQUE (course_id, week_no)
);
COMMENT ON TABLE public.lessons IS 'One lesson in a course. bodies holds the age variants the reader already presents: {everyone, children, teens, adults}. One row per (course, week) — declared at creation, not repaired later.';
COMMENT ON COLUMN public.lessons.instance_id IS 'Denormalised from courses so RLS is a direct column check, not a subquery. Enforced equal to the parent course by trigger.';
COMMENT ON COLUMN public.lessons.scriptures IS 'Reference strings as displayed, e.g. {"1 Corinthians 6:12","Proverbs 4:23"}. Order is display order.';
COMMENT ON COLUMN public.lessons.bodies IS 'Plain text per audience: {"everyone": "...", "children": "...", "teens": "...", "adults": "..."}. Plain text on purpose — the read-aloud tokenizer is offset-based and needs the rendered string to be the spoken string.';
COMMENT ON COLUMN public.lessons.weight_minutes IS 'Relative weight used by the presenter timer: "each runs to its own weight".';
CREATE INDEX IF NOT EXISTS lessons_course_week_idx ON public.lessons USING btree (course_id, week_no);
CREATE INDEX IF NOT EXISTS lessons_instance_idx ON public.lessons USING btree (instance_id);
CREATE INDEX IF NOT EXISTS lessons_search_idx ON public.lessons USING gin (search_text);

CREATE TABLE IF NOT EXISTS public.course_shares (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id    uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  instance_id  uuid NOT NULL REFERENCES public.instances(id) ON DELETE CASCADE,
  code         text NOT NULL CONSTRAINT course_shares_code_key UNIQUE,
  mode         text NOT NULL DEFAULT 'read' CONSTRAINT course_shares_mode_check CHECK (mode = ANY (ARRAY['read'::text, 'live'::text])),
  label        text,
  expires_at   timestamptz,
  revoked_at   timestamptz,
  created_by   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz,
  use_count    integer NOT NULL DEFAULT 0
);
COMMENT ON TABLE public.course_shares IS 'A code that opens one course read-only. Never read directly by anon or authenticated — the only path in is claim_course_share(code). Revocation is a timestamp, not a delete, so the audit trail survives.';
COMMENT ON COLUMN public.course_shares.mode IS 'read = the whole course as a pack. live = follow the presenter (the congregation-phones door).';
CREATE INDEX IF NOT EXISTS course_shares_course_idx ON public.course_shares USING btree (course_id);

ALTER TABLE public.courses       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_shares ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.courses, public.lessons, public.course_shares FROM anon;
GRANT ALL ON public.courses, public.lessons, public.course_shares TO authenticated, service_role;

-- The 12 policies the files declared (the overlays add the other 23 below).
DROP POLICY IF EXISTS courses_member_read   ON public.courses;
CREATE POLICY courses_member_read   ON public.courses FOR SELECT TO authenticated USING (public.user_in_instance(instance_id));
DROP POLICY IF EXISTS courses_admin_insert  ON public.courses;
CREATE POLICY courses_admin_insert  ON public.courses FOR INSERT TO authenticated WITH CHECK (public.user_role_in_instance(instance_id) = ANY (ARRAY['admin'::text, 'owner'::text]));
DROP POLICY IF EXISTS courses_admin_update  ON public.courses;
CREATE POLICY courses_admin_update  ON public.courses FOR UPDATE TO authenticated USING (public.user_role_in_instance(instance_id) = ANY (ARRAY['admin'::text, 'owner'::text])) WITH CHECK (public.user_role_in_instance(instance_id) = ANY (ARRAY['admin'::text, 'owner'::text]));
DROP POLICY IF EXISTS courses_admin_delete  ON public.courses;
CREATE POLICY courses_admin_delete  ON public.courses FOR DELETE TO authenticated USING (public.user_role_in_instance(instance_id) = ANY (ARRAY['admin'::text, 'owner'::text]));

DROP POLICY IF EXISTS lessons_member_read   ON public.lessons;
CREATE POLICY lessons_member_read   ON public.lessons FOR SELECT TO authenticated USING (public.user_in_instance(instance_id));
DROP POLICY IF EXISTS lessons_admin_insert  ON public.lessons;
CREATE POLICY lessons_admin_insert  ON public.lessons FOR INSERT TO authenticated WITH CHECK (public.user_role_in_instance(instance_id) = ANY (ARRAY['admin'::text, 'owner'::text]));
DROP POLICY IF EXISTS lessons_admin_update  ON public.lessons;
CREATE POLICY lessons_admin_update  ON public.lessons FOR UPDATE TO authenticated USING (public.user_role_in_instance(instance_id) = ANY (ARRAY['admin'::text, 'owner'::text])) WITH CHECK (public.user_role_in_instance(instance_id) = ANY (ARRAY['admin'::text, 'owner'::text]));
DROP POLICY IF EXISTS lessons_admin_delete  ON public.lessons;
CREATE POLICY lessons_admin_delete  ON public.lessons FOR DELETE TO authenticated USING (public.user_role_in_instance(instance_id) = ANY (ARRAY['admin'::text, 'owner'::text]));

DROP POLICY IF EXISTS course_shares_admin_read   ON public.course_shares;
CREATE POLICY course_shares_admin_read   ON public.course_shares FOR SELECT TO authenticated USING (public.user_role_in_instance(instance_id) = ANY (ARRAY['admin'::text, 'owner'::text]));
DROP POLICY IF EXISTS course_shares_admin_insert ON public.course_shares;
CREATE POLICY course_shares_admin_insert ON public.course_shares FOR INSERT TO authenticated WITH CHECK (public.user_role_in_instance(instance_id) = ANY (ARRAY['admin'::text, 'owner'::text]));
DROP POLICY IF EXISTS course_shares_admin_update ON public.course_shares;
CREATE POLICY course_shares_admin_update ON public.course_shares FOR UPDATE TO authenticated USING (public.user_role_in_instance(instance_id) = ANY (ARRAY['admin'::text, 'owner'::text])) WITH CHECK (public.user_role_in_instance(instance_id) = ANY (ARRAY['admin'::text, 'owner'::text]));

CREATE OR REPLACE FUNCTION public.learn_touch_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$ begin new.updated_at := now(); return new; end $function$;

CREATE OR REPLACE FUNCTION public.lessons_inherit_instance()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$ declare v_inst uuid; begin select instance_id into v_inst from public.courses where id = new.course_id; if v_inst is null then raise exception 'lesson references a course that does not exist' using errcode='23503'; end if; new.instance_id := v_inst; return new; end $function$;
COMMENT ON FUNCTION public.lessons_inherit_instance() IS 'Forces lessons.instance_id to equal the parent course. A lesson cannot be smuggled into another instance by supplying a different instance_id.';

CREATE OR REPLACE FUNCTION public.courses_bump_on_lesson_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_course uuid := coalesce(new.course_id, old.course_id); begin
  if tg_op = 'UPDATE' and (old.title, old.scriptures, old.bodies, old.notes, old.weight_minutes) is not distinct from (new.title, new.scriptures, new.bodies, new.notes, new.weight_minutes) then return null; end if;
  update public.courses c set version = c.version + 1, total_minutes = (select coalesce(sum(weight_minutes),0) from public.lessons l where l.course_id = c.id), updated_at = now() where c.id = v_course;
  return null; end $function$;
COMMENT ON FUNCTION public.courses_bump_on_lesson_change() IS 'Any lesson change bumps the course version and recomputes total_minutes. This is what makes an exported pack able to say which version it is.';

CREATE OR REPLACE FUNCTION public.mint_course_share(p_course_id uuid, p_mode text DEFAULT 'read'::text, p_label text DEFAULT NULL::text, p_expires timestamp with time zone DEFAULT NULL::timestamp with time zone)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$ declare v_inst uuid; v_code text; begin select instance_id into v_inst from public.courses where id = p_course_id; if v_inst is null then raise exception 'course not found' using errcode='P0002'; end if; if public.user_role_in_instance(v_inst) not in ('admin','owner') then raise exception 'only admin/owner can share a course' using errcode='42501'; end if; v_code := substr(upper(translate(encode(gen_random_bytes(6),'base64'),'0O1Il+/=','ABCDEFGH')),1,8); insert into public.course_shares (course_id, instance_id, code, mode, label, expires_at, created_by) values (p_course_id, v_inst, v_code, p_mode, p_label, p_expires, auth.uid()); return v_code; end $function$;
COMMENT ON FUNCTION public.mint_course_share(uuid, text, text, timestamp with time zone) IS 'admin/owner mints a share code for a course. Returns the code. The code is the only thing that leaves the instance.';
REVOKE ALL ON FUNCTION public.mint_course_share(uuid, text, text, timestamp with time zone) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mint_course_share(uuid, text, text, timestamp with time zone) TO authenticated;

CREATE OR REPLACE FUNCTION public.revoke_course_share(p_code text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$ declare v_inst uuid; begin select instance_id into v_inst from public.course_shares where code = upper(trim(p_code)); if v_inst is null then return false; end if; if public.user_role_in_instance(v_inst) not in ('admin','owner') then raise exception 'only admin/owner can revoke' using errcode='42501'; end if; update public.course_shares set revoked_at = now() where code = upper(trim(p_code)) and revoked_at is null; return found; end $function$;
REVOKE ALL ON FUNCTION public.revoke_course_share(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.revoke_course_share(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.claim_course_share(p_code text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_share public.course_shares%rowtype; v_course public.courses%rowtype; v_out jsonb; begin
  select * into v_share from public.course_shares where code = upper(trim(p_code)) and revoked_at is null and (expires_at is null or expires_at > now()); if v_share.id is null then return null; end if;
  select * into v_course from public.courses where id = v_share.course_id and status='published'; if v_course.id is null then return null; end if;
  update public.course_shares set use_count = use_count + 1, last_used_at = now() where id = v_share.id;
  select jsonb_build_object('course', jsonb_build_object('id', v_course.id, 'slug', v_course.slug, 'title', v_course.title, 'subtitle', v_course.subtitle, 'version', v_course.version, 'total_minutes', v_course.total_minutes, 'mode', v_share.mode),
    'lessons', coalesce(jsonb_agg(jsonb_build_object('id', l.id, 'week_no', l.week_no, 'title', l.title, 'scriptures', to_jsonb(l.scriptures), 'bodies', l.bodies, 'notes', l.notes, 'weight_minutes', l.weight_minutes, 'audio', l.audio) order by l.week_no), '[]'::jsonb))
  into v_out from public.lessons l where l.course_id = v_course.id; return v_out; end $function$;
COMMENT ON FUNCTION public.claim_course_share(text) IS 'The one door for anyone outside the instance. Returns a read-only snapshot of a published course or null. Grants nothing on any table; the caller stays anon (W3). Invalid, revoked, expired, and unpublished all return null identically.';
GRANT EXECUTE ON FUNCTION public.claim_course_share(text) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- 0171: a course is imported the same way twice
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.upsert_course_from_json(p_instance_id uuid, p_course jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$ declare v_course_id uuid; v_lesson jsonb; v_before integer; v_after integer; begin
  if public.user_role_in_instance(p_instance_id) not in ('admin','owner') then raise exception 'only admin/owner can import a course' using errcode='42501'; end if;
  if coalesce(p_course->>'slug','')='' or coalesce(p_course->>'title','')='' then raise exception 'course needs slug and title' using errcode='22023'; end if;
  insert into public.courses (instance_id, slug, title, subtitle, status, created_by) values (p_instance_id, p_course->>'slug', p_course->>'title', p_course->>'subtitle', coalesce(p_course->>'status','draft'), auth.uid()) on conflict (instance_id, slug) do update set title=excluded.title, subtitle=excluded.subtitle, status=excluded.status returning id into v_course_id;
  select count(*) into v_before from public.lessons where course_id = v_course_id;
  for v_lesson in select * from jsonb_array_elements(coalesce(p_course->'lessons','[]'::jsonb)) loop
    if (v_lesson->>'week_no') is null or (v_lesson->>'title') is null then raise exception 'every lesson needs week_no and title (offending: %)', v_lesson using errcode='22023'; end if;
    insert into public.lessons (course_id, instance_id, week_no, title, scriptures, bodies, notes, weight_minutes) values (v_course_id, p_instance_id, (v_lesson->>'week_no')::integer, v_lesson->>'title', coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(v_lesson->'scriptures','[]'::jsonb)) x),'{}'), coalesce(v_lesson->'bodies','{}'::jsonb), v_lesson->>'notes', coalesce((v_lesson->>'weight_minutes')::integer,10))
    on conflict (course_id, week_no) do update set title=excluded.title, scriptures=excluded.scriptures, bodies=excluded.bodies, notes=excluded.notes, weight_minutes=excluded.weight_minutes
    where (public.lessons.title, public.lessons.scriptures, public.lessons.bodies, public.lessons.notes, public.lessons.weight_minutes) is distinct from (excluded.title, excluded.scriptures, excluded.bodies, excluded.notes, excluded.weight_minutes);
  end loop;
  select count(*) into v_after from public.lessons where course_id = v_course_id;
  return jsonb_build_object('course_id', v_course_id, 'lessons_inserted', v_after - v_before, 'lessons_total', v_after, 'version', (select version from public.courses where id = v_course_id)); end $function$;
COMMENT ON FUNCTION public.upsert_course_from_json(uuid, jsonb) IS 'Idempotent import of one course with its lessons. Upserts on (instance_id, slug) and (course_id, week_no); never deletes; unchanged lessons are no-ops so a re-run does not bump the version. Run twice = same counts.';
REVOKE ALL ON FUNCTION public.upsert_course_from_json(uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.upsert_course_from_json(uuid, jsonb) TO authenticated;

CREATE TABLE IF NOT EXISTS public._sync_tokens (
  name       text PRIMARY KEY,
  token      text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public._sync_tokens IS 'Shared secrets between the database and its own edge functions. service_role reads; nothing else. Rotate by updating the row.';
ALTER TABLE public._sync_tokens ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public._sync_tokens FROM anon, authenticated;
GRANT ALL ON public._sync_tokens TO service_role;
-- The secret is minted where it lives, never carried in this file (see the
-- header). ON CONFLICT DO NOTHING: hosted's row is untouched. Core
-- gen_random_uuid() (two of them, 64 hex chars) rather than pgcrypto's
-- gen_random_bytes, so the mint does not depend on which schema an
-- extension was installed into on the box.
INSERT INTO public._sync_tokens (name, token)
  VALUES ('learn-catalog', replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''))
  ON CONFLICT (name) DO NOTHING;

CREATE OR REPLACE FUNCTION public.sync_learn_catalog(p_ref text DEFAULT 'main'::text, p_instance text DEFAULT 'colg'::text, p_publish boolean DEFAULT true, p_course text DEFAULT NULL::text)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
declare v_token text; v_url text; v_id bigint; begin
  select token into v_token from public._sync_tokens where name='learn-catalog';
  if v_token is null then raise exception 'no learn-catalog sync token'; end if;
  v_url := 'https://mjjlevhdufpaplypnqrv.supabase.co/functions/v1/sync-learn-catalog' || '?ref=' || p_ref || '&instance=' || p_instance || '&publish=' || p_publish::text || coalesce('&course=' || p_course, '');
  select net.http_post(url := v_url, headers := jsonb_build_object('Content-Type','application/json','x-sync-token', v_token), body := '{}'::jsonb, timeout_milliseconds := 150000) into v_id;
  return v_id; end $function$;
COMMENT ON FUNCTION public.sync_learn_catalog(text, text, boolean, text) IS 'Asks the sync-learn-catalog edge function to pull every course from the repo at p_ref into p_instance. Returns the pg_net request id; the response lands in net._http_response.';
REVOKE ALL ON FUNCTION public.sync_learn_catalog(text, text, boolean, text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.sync_learn_catalog_result(p_request_id bigint)
 RETURNS TABLE(status integer, body jsonb, error text, created timestamp with time zone)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
  select r.status_code, r.content::jsonb, r.error_msg, r.created from net._http_response r where r.id = p_request_id $function$;
REVOKE ALL ON FUNCTION public.sync_learn_catalog_result(bigint) FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 0172: a lesson can carry its own voice
-- ---------------------------------------------------------------------------
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS audio jsonb NOT NULL DEFAULT '{}'::jsonb;
COMMENT ON COLUMN public.lessons.audio IS 'Per-audience rendered audio + word timings from the NAS voice job. Keyed by audience; each entry carries text_hash of the body it was rendered from. Reader uses it only when the hash matches the displayed body.';
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lessons_audio_check' AND conrelid = 'public.lessons'::regclass) THEN
    ALTER TABLE public.lessons ADD CONSTRAINT lessons_audio_check CHECK (jsonb_typeof(audio) = 'object'::text);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.lessons_needing_audio(p_audiences text[] DEFAULT ARRAY['everyone'::text, 'children'::text, 'teens'::text, 'adults'::text])
 RETURNS TABLE(lesson_id uuid, course_id uuid, audience text, text_hash text, body text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  select l.id, l.course_id, a.aud, encode(sha256(convert_to(l.bodies->>a.aud,'utf8')),'hex'), l.bodies->>a.aud
  from public.lessons l join public.courses c on c.id = l.course_id and c.status='published'
  cross join unnest(p_audiences) as a(aud)
  where coalesce(l.bodies->>a.aud,'') <> '' and coalesce(l.audio->a.aud->>'text_hash','') <> encode(sha256(convert_to(l.bodies->>a.aud,'utf8')),'hex')
  order by c.id, l.week_no, a.aud $function$;
COMMENT ON FUNCTION public.lessons_needing_audio(text[]) IS 'Work queue for the NAS voice job: (lesson, audience) pairs on published courses whose audio is missing or whose text_hash no longer matches the body. service_role only.';
REVOKE ALL ON FUNCTION public.lessons_needing_audio(text[]) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.set_lesson_audio(p_lesson_id uuid, p_audience text, p_audio jsonb)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_current_hash text; begin
  select encode(sha256(convert_to(bodies->>p_audience,'utf8')),'hex') into v_current_hash from public.lessons where id = p_lesson_id;
  if v_current_hash is null then raise exception 'lesson % has no % body', p_lesson_id, p_audience using errcode='P0002'; end if;
  if coalesce(p_audio->>'text_hash','') <> v_current_hash then return false; end if;
  if jsonb_typeof(p_audio->'words') <> 'array' or coalesce(p_audio->>'url','') = '' then raise exception 'audio entry needs url and words[]' using errcode='22023'; end if;
  update public.lessons set audio = audio || jsonb_build_object(p_audience, p_audio || jsonb_build_object('rendered_at', now())) where id = p_lesson_id;
  return true; end $function$;
COMMENT ON FUNCTION public.set_lesson_audio(uuid, text, jsonb) IS 'NAS voice job writes a rendered audience entry. Returns false (stores nothing) if text_hash no longer matches the body. service_role only.';
REVOKE ALL ON FUNCTION public.set_lesson_audio(uuid, text, jsonb) FROM PUBLIC, anon, authenticated;

-- Triggers: dropped-and-created so the definitions are exactly hosted's.
DROP TRIGGER IF EXISTS courses_touch ON public.courses;
CREATE TRIGGER courses_touch BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.learn_touch_updated_at();
DROP TRIGGER IF EXISTS lessons_instance ON public.lessons;
CREATE TRIGGER lessons_instance BEFORE INSERT OR UPDATE OF course_id ON public.lessons FOR EACH ROW EXECUTE FUNCTION public.lessons_inherit_instance();
DROP TRIGGER IF EXISTS lessons_bump_course ON public.lessons;
CREATE TRIGGER lessons_bump_course AFTER INSERT OR DELETE OR UPDATE OF title, scriptures, bodies, notes, weight_minutes ON public.lessons FOR EACH ROW EXECUTE FUNCTION public.courses_bump_on_lesson_change();
DROP TRIGGER IF EXISTS lessons_touch ON public.lessons;
CREATE TRIGGER lessons_touch BEFORE UPDATE ON public.lessons FOR EACH ROW
  WHEN (old.course_id IS DISTINCT FROM new.course_id OR old.week_no IS DISTINCT FROM new.week_no OR old.title IS DISTINCT FROM new.title OR old.scriptures IS DISTINCT FROM new.scriptures OR old.bodies IS DISTINCT FROM new.bodies OR old.notes IS DISTINCT FROM new.notes OR old.weight_minutes IS DISTINCT FROM new.weight_minutes OR old.audio IS DISTINCT FROM new.audio)
  EXECUTE FUNCTION public.learn_touch_updated_at();

-- The two overlays stamp their restrictive policies on the three new tables
-- (and re-stamp push_subscriptions per 0181's participation list), exactly as
-- 0223 did for church_ministries (DR-0059 / DR-0241 / DR-0347).
SELECT public.apply_viewer_readonly_overlay();
SELECT public.apply_assistant_scope_overlay();

-- First population of the grant snapshot ONLY where it is empty (the box);
-- hosted's 3,497 rows are not re-blessed by this file.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM public._expected_grants) THEN
    PERFORM public.refresh_expected_grants();
  END IF;
END $$;
SELECT public.assert_expected_grants();

-- LAST: the ledger guard. On hosted it exists (2026-09-05); on the box this
-- is its first day, and the INSERT recording this very file is its first test.
DROP TRIGGER IF EXISTS ledger_unique_ordinal ON public._schema_migrations;
CREATE TRIGGER ledger_unique_ordinal BEFORE INSERT ON public._schema_migrations FOR EACH ROW EXECUTE FUNCTION public.ledger_reject_duplicate_ordinal();

RESET check_function_bodies;

NOTIFY pgrst, 'reload schema';
