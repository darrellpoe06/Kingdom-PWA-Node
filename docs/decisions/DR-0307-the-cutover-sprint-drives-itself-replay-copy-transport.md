# DR-0307 — The cutover sprint drives itself: replay by ledger, copy as-is, transport by /sb

- **date:** 2026-08-15
- **status:** decided
- **type:** orchestration / infrastructure
- **declared by:** Darrell ("drive it now until done"), executed through the ensemble seam
- **pairs with:** DR-0306 (the stack + the verifier), DR-0084 (self-applying migrations), DR-0132 (sovereign direction), DR-0247 (agreed work starts itself), DR-0076 (prove, don't claim)

## The day this closes

The sovereign Supabase stack reached GREEN on 2026-08-15 — `auth/v1/health HTTP 200`
measured directly by nas-health after five root causes were named by instruments
and cured through the auto-merge lane in one day (realtime's 16-byte AES key; the
service roles that never existed because the custom init dir SHADOWED the image's
own init scripts; psql `-c`'s no-interpolation trap; the missing role
`search_path` pins; the missing `postgres` role). The lesson under all five: the
minimal init replaced the official init volume, so everything the platform
normally provides outside migration files had to be asserted explicitly.

## The decisions

1. **The replay is a ledger, not an event.** `replay_migrations.sh` applies
   `infra/supabase/migrations-auto/*.sql` in filename order into the sovereign
   db, recording each file in `public._sovereign_replay`. It resumes forever,
   budgets per cycle (default 50 files) so the services-sync timeout can never
   blow, and STOPS at the first failure so the frontier names itself in the
   installer's tail — the same one-wall-per-cycle loop that healed the stack.
   Platform prerequisites (extensions schema, `auth.uid/role/email/jwt`, API
   role grants) are asserted idempotently before any file runs.

2. **Accounts copy AS-IS; identities never merge in flight** (ensemble-locked):
   `cutover_sync.py` transfers `auth.users` and `auth.identities` with UUIDs
   and encrypted hashes preserved, over the vendored pg8000 + pinned CA the box
   agent proved, intersecting column lists so GoTrue version drift can never
   invent values. A phone identity and an email identity remain two rows; any
   linking is a later admin step on a stack holding load.

3. **SMTP stays OUT of the critical path** (ensemble-locked): sovereign sign-in
   leads with phone + PIN and password. Magic-link email is an optional later
   add — a third-party relay must not sit inside sovereign auth for the standup.

4. **The public transport is `/sb`, three proven hops:** kong carries mirror
   routes (`/sb/auth/v1` etc., strip_path) beside its originals; the funnel
   path-mounts `/sb -> kong:8800` (additive, reversible, never touching `/`);
   `app/functions/sb/[[path]].js` gives poetech.us the same-origin door via the
   shared funnel-proxy factory. The app repoint (URL + anon key) is the LAST
   step, taken only after `migrate_verify` says GO and the transport measures
   200 end-to-end from outside.

5. **Storage objects are a NAMED gap, not a silent one:** the hosted 3 buckets /
   455 objects hold blob files SQL cannot carry; copying their rows without
   bytes would fabricate working-looking links (the DR-0291 lesson). The rows
   are left uncopied; `migrate_verify` will show storage short and that line is
   read as "known, tracked" — **re-review: 2026-08-22** (pull the blobs via the
   storage API once the gateway is public, or accept photo-feature degradation
   until the NAS photo server absorbs them).

## The proof discipline

Every leg prints one summary line in the installer's LAST lines
(`replay: … frontier: …`, `cutover-sync: verdict GO/NO-GO`,
`sb-transport: …`) — learned the hard way when three cures went blind
mid-output. nas-health carries the gateway's literal HTTP code every probe.
Nothing repoints the family's app until the verdict line says GO.
