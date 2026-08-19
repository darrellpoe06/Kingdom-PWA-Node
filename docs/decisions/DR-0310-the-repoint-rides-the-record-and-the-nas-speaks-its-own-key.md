# DR-0310 — the repoint rides the record, and the NAS speaks its own key

- **status:** accepted
- **date:** 2026-08-19
- **declared by:** Darrell — *"I'm not doing that you are... follow our Ways"*, *"ssh... and or cli... you have access already... for our work..."*, *"comprehensive understanding of the processes... not guessing"* (in-session, 2026-08-19)
- **extends:** DR-0307 (repoint LAST, after GO + outside-in 200), DR-0308/DR-0309 (baseline + refresh), DR-0108 (review our Ways), DR-0247 (agreed work starts itself through the lane)

## The premise that fell

The cutover runbook assumed the repoint was human hands: read the sovereign
anon key off the NAS, paste two values into the repo secret store, dispatch a
deploy. The comprehensive review (2026-08-19) measured the machinery and found
the premise unnecessary: **no workflow can write repo secrets** (every
workflow holds only `GITHUB_TOKEN`; measured across all 28), but **the team's
own SSH channel to the NAS is already in the secret store** (`TS_AUTHKEY` +
`NAS_SSH_KEY`, used daily by nas-health/nas-clock) — and the NAS is the
authoritative source of its own anon key. The build can ask the NAS directly.

## Decision

1. **The repoint is armed by a committed record** — `infra/nas-supabase/REPOINT-ARMED`.
   When it exists, `deploy-cloudflare-pages.yml` joins the tailnet, reads
   `ANON_KEY` from `/volume1/docker/supabase/.env` on the NAS, and builds with
   `VITE_SUPABASE_URL=https://poetech.us/sb` + that key. The hosted secrets
   remain the un-armed fallback — untouched, instantly restorable.
2. **Fail-loud, never half.** Armed + fetch failure = the deploy FAILS; the
   running site keeps its current build (DR-0107 — uptime outranks velocity;
   a build must never ship half a backend).
3. **The off-switch is the record.** Revert the file, dispatch the deploy: the
   app returns to the hosted backend. One revert is the whole rollback.
4. **Sequence enforced by receipt.** The armed record merges only after the
   DR-0309 baseline re-dump receipt (marker `hosted-baseline.sql@<nonce>` in
   the sovereign ledger, read by nas-health) — the Plan tab and every
   post-dump row must exist on sovereign before the app looks there.
5. **The witness follows the backend.** site-health carries a sovereign
   transport probe line (`poetech.us/sb/auth/v1/health`, keyless) — observe-
   only until /sb is live, incident-armed after.

## Ways note (DR-0108)

Recorded as the standing pattern: when a procedure says "a human pastes a
value," first ask whether the value's SOURCE is already reachable by the
team's own channels. The secret store is one transport for configuration —
the authoritative system speaking for itself over an already-held channel is
another, and it removes the hands, the copy step, and the staleness class in
one move.
