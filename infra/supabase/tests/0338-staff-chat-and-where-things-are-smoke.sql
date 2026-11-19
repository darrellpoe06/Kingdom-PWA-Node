-- =============================================================================
-- 0338 SMOKE — the staff chat is the staff's, the tenant chat is the tenant's,
-- and the tenant is told where things are (DR-1598)
-- =============================================================================
-- Needs the door-work chain (0055 .. 0264), 0337 and 0338. One transaction,
-- ROLLED BACK. PASS prints 'STAFF CHAT SMOKE: PASS'; any break RAISES.
--
-- Instance I, owner O. Door D (slug DOOR-D-338) with tenancy T: tenant N,
-- household member H. A second door E. Workers W (assigned a job on D), V
-- (added by hand, later removed), X (never added). Stranger S.
--
--   W joins D's staff chat when assigned; reads and writes it          ✔
--   X (not a member) reads it                                          ✘
--   O adds V; V reads; O removes V; V reads                            ✔ / ✘
--   O adds N (the tenant) or H (household)                             refused
--   N or H reads the staff chat, even with a member row forged by hand ✘
--   N writes the staff chat                                            ✘
--   W adds someone (a worker does not run the chat)                    ✘
--   tenant chat: N reads it; W reads it only when the door enabled him ✔ / ✘→✔
--   where_things_are: N sees the shared system only (name, place);
--   S sees nothing; E's tenant-less shared system is not N's           ✔
-- =============================================================================
BEGIN;

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000a0338', 'authenticated','authenticated','owner338@test.local','', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000b0338', 'authenticated','authenticated','w338@test.local','',     now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000c0338', 'authenticated','authenticated','v338@test.local','',     now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000d0338', 'authenticated','authenticated','x338@test.local','',     now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000e0338', 'authenticated','authenticated','n338@test.local','',     now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-0000000f0338', 'authenticated','authenticated','h338@test.local','',     now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-000000100338', 'authenticated','authenticated','s338@test.local','',     now(), now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO instances (id, slug, display_name, instance_type) VALUES
  ('00000000-0000-4000-b000-000000010338', 'staff-chat-smoke-338', 'Staff Chat Smoke', 'business')
ON CONFLICT (id) DO NOTHING;
INSERT INTO instance_members (instance_id, user_id, role, display_name) VALUES
  ('00000000-0000-4000-b000-000000010338', '00000000-0000-4000-a000-0000000a0338', 'owner', 'Owner')
ON CONFLICT DO NOTHING;

INSERT INTO rentals (id, instance_id, created_by, slug, display_name, address, property_type, status) VALUES
  ('00000000-0000-4000-c000-0000000a0338', '00000000-0000-4000-b000-000000010338', '00000000-0000-4000-a000-0000000a0338', 'DOOR-D-338', 'Door D', '1 D St', 'multi-family', 'occupied'),
  ('00000000-0000-4000-c000-0000000b0338', '00000000-0000-4000-b000-000000010338', '00000000-0000-4000-a000-0000000a0338', 'DOOR-E-338', 'Door E', '2 E St', 'multi-family', 'vacant');

INSERT INTO rental_tenancies (id, instance_id, created_by, rental_ref, property_label, tenant_name, tenant_user_id, monthly_rent, deposit, status) VALUES
  ('00000000-0000-4000-c000-0000000e0338', '00000000-0000-4000-b000-000000010338', '00000000-0000-4000-a000-0000000a0338',
   'DOOR-D-338', 'Door D', 'Tenant N', '00000000-0000-4000-a000-0000000e0338', 900, 900, 'active');
INSERT INTO tenancy_household (instance_id, tenancy_id, member_user_id, display_name, relationship, added_by) VALUES
  ('00000000-0000-4000-b000-000000010338', '00000000-0000-4000-c000-0000000e0338', '00000000-0000-4000-a000-0000000f0338', 'H', 'spouse', '00000000-0000-4000-a000-0000000a0338');

INSERT INTO property_systems (id, instance_id, rental_ref, name, kind, serial, location_note, share_with_tenant) VALUES
  ('00000000-0000-4000-e000-0000000a0338', '00000000-0000-4000-b000-000000010338', '00000000-0000-4000-c000-0000000a0338', 'Water shutoff', 'plumbing', 'SN-1', 'basement, north wall', true),
  ('00000000-0000-4000-e000-0000000b0338', '00000000-0000-4000-b000-000000010338', '00000000-0000-4000-c000-0000000a0338', 'Furnace', 'heating', 'SN-2', 'utility closet', false),
  ('00000000-0000-4000-e000-0000000c0338', '00000000-0000-4000-b000-000000010338', '00000000-0000-4000-c000-0000000b0338', 'Breaker panel', 'electrical', 'SN-3', 'garage', true);

CREATE OR REPLACE FUNCTION pg_temp.as_user(_who uuid) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _who, 'role', 'authenticated')::text, true);
END $$;
CREATE OR REPLACE FUNCTION pg_temp.as_postgres() RETURNS void LANGUAGE plpgsql AS $$
BEGIN PERFORM set_config('role', 'postgres', true); END $$;

-- How many rows of _table (by _col = _id) _who reads.
CREATE OR REPLACE FUNCTION pg_temp.reads(_who uuid, _table text, _col text, _id uuid) RETURNS int LANGUAGE plpgsql AS $$
DECLARE k int;
BEGIN
  PERFORM pg_temp.as_user(_who);
  EXECUTE format('SELECT count(*) FROM %I WHERE %I = %L', _table, _col, _id) INTO k;
  PERFORM pg_temp.as_postgres();
  RETURN k;
END $$;

CREATE OR REPLACE FUNCTION pg_temp.writes(_who uuid, _sql text) RETURNS boolean LANGUAGE plpgsql AS $$
DECLARE ok boolean := true;
BEGIN
  PERFORM pg_temp.as_user(_who);
  BEGIN EXECUTE _sql;
  EXCEPTION WHEN insufficient_privilege OR check_violation OR foreign_key_violation OR raise_exception THEN ok := false;
  END;
  PERFORM pg_temp.as_postgres();
  RETURN ok;
END $$;

CREATE OR REPLACE FUNCTION pg_temp.must(_cond boolean, _label text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN IF NOT coalesce(_cond, false) THEN RAISE EXCEPTION 'STAFF CHAT SMOKE FAIL: %', _label; END IF; END $$;

DO $$
DECLARE
  o uuid := '00000000-0000-4000-a000-0000000a0338';
  w uuid := '00000000-0000-4000-a000-0000000b0338';
  v uuid := '00000000-0000-4000-a000-0000000c0338';
  x uuid := '00000000-0000-4000-a000-0000000d0338';
  n uuid := '00000000-0000-4000-a000-0000000e0338';
  h uuid := '00000000-0000-4000-a000-0000000f0338';
  s uuid := '00000000-0000-4000-a000-000000100338';
  inst uuid := '00000000-0000-4000-b000-000000010338';
  dd uuid := '00000000-0000-4000-c000-0000000a0338';
  tt uuid := '00000000-0000-4000-c000-0000000e0338';
  chat uuid;
  r text;
  k int;
BEGIN
  -- 1. Assigning a job on D puts W in D's staff chat.
  INSERT INTO tenant_maintenance_requests (instance_id, rental_id, created_by, created_by_role, title, status, assigned_to, assigned_to_label)
  VALUES (inst, dd, o, 'landlord', 'Outlet over the window', 'scheduled', w, 'W');
  SELECT id INTO chat FROM property_staff_chats WHERE rental_id = dd;
  PERFORM pg_temp.must(chat IS NOT NULL, 'assigning a job made no staff chat for its door');
  PERFORM pg_temp.must(pg_temp.reads(w, 'property_staff_chats', 'id', chat) = 1, 'W, assigned on D, reads D''s staff chat');
  PERFORM pg_temp.must(pg_temp.writes(w, format('INSERT INTO property_staff_messages (instance_id, chat_id, sender_user_id, body) VALUES (%L, %L, %L, ''Breaker is in the garage'')', inst, chat, w)), 'W writes the staff chat');
  -- The app's own shape: no instance_id; the chat's is copied in.
  PERFORM pg_temp.must(pg_temp.writes(o, format('INSERT INTO property_staff_messages (chat_id, sender_user_id, body) VALUES (%L, %L, ''Thanks, W'')', chat, o)), 'O writes with no instance_id');
  PERFORM pg_temp.must(pg_temp.reads(o, 'property_staff_messages', 'chat_id', chat) = 2, 'O reads both messages');

  -- 2. Not a member: nothing.
  PERFORM pg_temp.must(pg_temp.reads(x, 'property_staff_messages', 'chat_id', chat) = 0, 'X (not a member) reads the staff chat');
  PERFORM pg_temp.must(pg_temp.reads(s, 'property_staff_chats', 'id', chat) = 0, 'a stranger reads the staff chat');

  -- 3. Added reads; removed does not.
  PERFORM pg_temp.as_user(o);
  r := public.staff_chat_add_member(chat, v, 'V');
  PERFORM pg_temp.as_postgres();
  PERFORM pg_temp.must(r = 'added', 'O adds V (' || coalesce(r, 'null') || ')');
  PERFORM pg_temp.must(pg_temp.reads(v, 'property_staff_messages', 'chat_id', chat) = 2, 'V, added, reads the staff chat');
  PERFORM pg_temp.as_user(o);
  r := public.staff_chat_remove_member(chat, v);
  PERFORM pg_temp.as_postgres();
  PERFORM pg_temp.must(r = 'removed', 'O removes V');
  PERFORM pg_temp.must(pg_temp.reads(v, 'property_staff_messages', 'chat_id', chat) = 0, 'V, removed, still reads the staff chat');
  SELECT count(*) INTO k FROM property_staff_chat_members WHERE chat_id = chat AND user_id = v AND added_by = o AND removed_by = o AND removed_at IS NOT NULL;
  PERFORM pg_temp.must(k = 1, 'the list keeps who added and who removed V, and when');

  -- 4. A tenant never: not added, not read, not written, even forged.
  PERFORM pg_temp.as_user(o);
  r := public.staff_chat_add_member(chat, n, 'N');
  PERFORM pg_temp.must(r = 'lives-here', 'O adding the tenant was not refused (' || coalesce(r, 'null') || ')');
  r := public.staff_chat_add_member(chat, h, 'H');
  PERFORM pg_temp.must(r = 'lives-here', 'O adding the household member was not refused');
  PERFORM pg_temp.as_postgres();
  INSERT INTO property_staff_chat_members (instance_id, chat_id, user_id, added_by) VALUES (inst, chat, n, o), (inst, chat, h, o);
  PERFORM pg_temp.must(pg_temp.reads(n, 'property_staff_messages', 'chat_id', chat) = 0, 'the tenant reads the staff chat through a forged member row');
  PERFORM pg_temp.must(pg_temp.reads(h, 'property_staff_messages', 'chat_id', chat) = 0, 'the household member reads the staff chat');
  PERFORM pg_temp.must(NOT pg_temp.writes(n, format('INSERT INTO property_staff_messages (instance_id, chat_id, sender_user_id, body) VALUES (%L, %L, %L, ''hi'')', inst, chat, n)), 'the tenant writes the staff chat');
  PERFORM pg_temp.as_user(n);
  PERFORM pg_temp.must(public.open_staff_chat(dd) IS NULL, 'the tenant opens the staff chat');
  PERFORM pg_temp.as_postgres();

  -- 5. A worker does not run the chat.
  PERFORM pg_temp.must(NOT pg_temp.writes(w, format('SELECT public.staff_chat_add_member(%L, %L, ''X'')', chat, x)), 'W adds X to the staff chat');
  PERFORM pg_temp.must(NOT pg_temp.writes(w, format('INSERT INTO property_staff_chat_members (instance_id, chat_id, user_id) VALUES (%L, %L, %L)', inst, chat, x)), 'W inserts a member row directly');

  -- 6. The tenant chat: the tenant reads it; the worker only once the door enables him.
  INSERT INTO tenant_messages (instance_id, tenancy_id, sender_user_id, from_role, body) VALUES (inst, tt, o, 'landlord', 'The plumber comes Tuesday');
  PERFORM pg_temp.must(pg_temp.reads(n, 'tenant_messages', 'tenancy_id', tt) = 1, 'the tenant reads the tenant chat');
  PERFORM pg_temp.must(pg_temp.reads(w, 'tenant_messages', 'tenancy_id', tt) = 0, 'W reads the tenant chat without being included');
  INSERT INTO tenancy_worker_access (instance_id, tenancy_id, worker_user_id, enabled_by, active) VALUES (inst, tt, w, o, true);
  PERFORM pg_temp.must(pg_temp.reads(w, 'tenant_messages', 'tenancy_id', tt) = 1, 'W, included by the landlord, reads the tenant chat');
  PERFORM pg_temp.must(pg_temp.reads(n, 'property_staff_messages', 'chat_id', chat) = 0, 'the tenant reads the staff chat after all that');

  -- 7. Where things are.
  PERFORM pg_temp.as_user(n);
  SELECT count(*) INTO k FROM public.where_things_are(tt);
  PERFORM pg_temp.must(k = 1, 'the tenant sees ' || k || ' things, expected the one shared on his door');
  SELECT count(*) INTO k FROM public.where_things_are(tt) w2 WHERE w2.name = 'Water shutoff' AND w2.location_note = 'basement, north wall';
  PERFORM pg_temp.must(k = 1, 'the tenant is not told where the water shutoff is');
  PERFORM pg_temp.as_user(s);
  SELECT count(*) INTO k FROM public.where_things_are(tt);
  PERFORM pg_temp.as_postgres();
  PERFORM pg_temp.must(k = 0, 'a stranger reads where things are in someone''s home');

  RAISE NOTICE 'STAFF CHAT SMOKE: PASS';
END $$;

ROLLBACK;
