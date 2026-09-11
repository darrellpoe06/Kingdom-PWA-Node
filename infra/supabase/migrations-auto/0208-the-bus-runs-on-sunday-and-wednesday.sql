-- ===========================================================================
-- 0208 — the bus runs on SUNDAY *AND* WEDNESDAY
-- ===========================================================================
-- Declared by Darrell 2026-09-11, with the COLG leadership looking at the Bus
-- Ministry surface: "You say which Sunday? We need to say Sunday and
-- Wednesday." And, after a leader tapped in: "it just showed me the Sunday
-- sign... Sunday and Wednesday."
--
-- 0095 modelled a bus run as a DATE alone, because the surface only ever
-- offered Sundays. The church's own record (lib/default-church.js) has always
-- carried three services a week — Sunday Worship 11:00 AM, Bible Study
-- Wednesday 1:00 PM and Wednesday 6:00 PM — so a date is no longer a unique
-- run: one Wednesday holds two of them.
--
-- `service_slot` names WHICH service on that date, matching the id in the
-- church record's services array ('svc-sun', 'svc-wed1', 'svc-wed2'). It is
-- NULLABLE on purpose: every row written before today carries no slot and
-- belongs to that date's primary (Sunday) run, which is exactly what those
-- rows have always meant. Nothing is backfilled and nothing is rewritten —
-- the read path treats a null slot as "the primary run" (lib/bus-ministry.js,
-- rowMatchesRun), so existing schedules keep resolving unchanged.
-- ===========================================================================

ALTER TABLE bus_schedule
  ADD COLUMN IF NOT EXISTS service_slot text;

COMMENT ON COLUMN bus_schedule.service_slot IS
  'Which service on service_date (church.services id, e.g. svc-sun / svc-wed1 / svc-wed2). NULL = the date''s primary run, as every pre-2026-09-11 row means.';

-- The coverage read is "this route, on this run" — date plus slot.
CREATE INDEX IF NOT EXISTS bus_schedule_run_idx
  ON bus_schedule(instance_id, service_date, service_slot);

ALTER TABLE bus_ride_requests
  ADD COLUMN IF NOT EXISTS service_slot text;

COMMENT ON COLUMN bus_ride_requests.service_slot IS
  'Which service the rider needs the bus for (church.services id). NULL = the date''s primary run. A Wednesday rider can now ask for the 1:00 PM or the 6:00 PM Bible Study instead of being offered Sunday only.';
