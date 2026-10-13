# DR-0306 — The sovereign Supabase stack, and a migration that proves itself

- **Status:** accepted
- **Tier:** C (a backend for four live apps; ships standing-but-unpointed-at, cutover gated on proven parity)
- **Scope:** the shared Supabase backend behind PoeTech, Moore Divahs, TLC Therapy Solutions and the church app
- **Date:** 2026-08-14
- **Principles:** SOVEREIGN-FIRST, COST-DISCIPLINE, VERIFICATION-DOCTRINE, THREE-BRAKES, DECISION-RECORDS
- **Supersedes:** []

## Directive

Darrell 2026-08-14, after the hosted free tier restricted the project on an
egress quota and locked every user out of all four apps:

> "I'm not paying them... other options!!!!!!!?"

then, on being shown the options:

> "start the NAS supabase stack."

## Decision

Stand up a full self-hosted Supabase stack on the NAS, on the services-sync
lane, **with nothing pointing at it**, and gate the cutover on machine-proven
parity with the hosted project.

## Why this is a swap and not a rewrite (measured)

Self-hosted Supabase serves the identical API. Call sites in the app:
**196 `.from()` · 68 `.auth` · 64 `.rpc()` · 3 `.storage` · 2 `.channel`** — all
333 keep working, so cutover is a URL and an anon key.

That is precisely what beats "move to another free Postgres host": Neon or
Railway give Postgres but not GoTrue, and those 68 auth call sites would have to
be rebuilt. RLS is enforced by Postgres itself, so DR-0060's tenancy guard and
every policy in `infra/supabase/` carry over unchanged.

## The measurement that decided the migration strategy

Read from the live hosted project before planning anything:

| | |
| --- | --- |
| tables | 183 |
| RLS policies | **1,719** |
| functions / triggers | 110 / 91 |
| auth users / identities | 23 / 23 |
| data | **50 MB** |
| storage | 3 buckets, 455 objects |

1,719 looked like a wall and is not. It is mostly **generated**:
`viewer_readonly_{insert,update,delete}` × 159 tables = 477, and
`assistant_scope_{select,insert,update,delete}` × 158 = 632, leaving ~610
hand-written. Those families come from DO-loops in
`infra/supabase/migrations-auto/`, which is why grep finds 495 `CREATE POLICY`
statements where Postgres reports 1,719.

**Therefore the repo's own migration history reproduces the schema.** No schema
dump. The migration is: replay migrations (DR-0084's existing self-applying
lane, pointed at a new target) → copy 50 MB → verify. The risk was never volume.

## The DR-0108 challenge (run first — dimension 5)

**services-sync IS the delivery.** The NAS pulls the repo on its own clock and
runs `install.sh`, the same lane already installing mcp / scribe /
property-photos / ytzero. Merge to main is the deploy. Nothing here is Darrell's
hand. The lawful human tail is exactly two items, neither blocking the standup:
**SMTP credentials** (a secret onto a device; the stack comes up healthy without
them and simply disables email sign-in) and **the cutover decision** itself.

## The brakes

- **Nothing points at it.** The app still talks to the hosted project. A
  half-proven stack must never be able to take the family's app down — which is
  the hole this exists to dig out of.
- **Every port binds `127.0.0.1` only** (8800 kong / 5433 postgres / 8801
  studio), each clear of the twelve ports measured live on this NAS, with 5432
  left alone for DSM. Verified programmatically: zero non-loopback bindings.
- **Secrets minted once, never re-minted.** Re-minting `JWT_SECRET` over a live
  stack signs out every user at once, so `mint_keys.py` refuses to overwrite an
  existing `.env`. Stdlib only — this NAS runs Python 3.8.15 and root cannot
  import dpoe's site-packages (measured, nas-health run 31817289739; the same
  fault that has held the transcript drain dead since Aug 11), so an installer
  needing `pip install PyJWT` fails on this box.
- **The installer proves rather than claims** (DR-0076): polls
  `/auth/v1/health` for 150 s and exits non-zero with `compose ps` if the
  gateway never answers 200.

## Parity is a separate verifier, not a flag on the copier

A copier that grades its own homework is the theater this repo keeps catching.
`migrate_verify.py` reads both databases independently and compares nine
structural counts plus per-table row counts.

**This is DR-0291's photos lesson in SQL: a partial migration is byte-perfect.**
Every copied row is correct, every checksum matches, and the stack is still
wrong because rows are missing. **Integrity is not completeness.**

Proven-to-catch, 14 tests, at the three ways this bites: tables short (names the
exact shortfall); one missing auth user; and **the silent one — all 183 tables
and all the data present with ZERO policies**, a total tenancy breach (DR-0060)
in which every tenant reads every other tenant, which "the data is all there"
hides completely. A target that is *ahead* is reported as divergence, not
blessed.

## Consequences and what is NOT closed

- **Standing the stack up does not restore service.** The hosted project stays
  restricted until its quota resets or the plan changes. This is the exit, not
  the rescue.
- **SMTP is on the critical path for the primary sign-in method.** The app's
  main path is an emailed magic link; self-hosting moves that dependency rather
  than removing it. Free senders exist at 23-user scale.
- **Not done:** the migration runner itself, the Caddy same-origin route (the
  Funnel throttles cross-origin), backups (hosted Supabase did this invisibly;
  on the NAS it is ours and not optional), and a witness for the stack.

## Links

`infra/nas-supabase/` (compose, kong, `mint_keys.py` 12/12, `migrate_verify.py`
14/14, README), `infra/nas-loops/services.json`. DR-0305 (the egress defect),
DR-0303, DR-0084 (the migration lane), DR-0291 (integrity ≠ completeness),
DR-0060, DR-0108, DR-0237 §5.
