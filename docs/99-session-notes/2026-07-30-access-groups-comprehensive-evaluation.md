# Access Groups — Comprehensive Data-Driven Evaluation, Inside and Outside the App (2026-07-30)

**Charge (Darrell):** comprehensive data-driven evaluation of access groups outside and inside the app — what is happening and not — to create a best-practices evaluation and implementation for current needs and perpetual improvement; Ways and documentation included.

**Standard:** COMPREHENSIVE-REVIEW-STANDARD (DR-0239), all seven dimensions run. **Method:** two parallel deep auditors (in-app permission model; external access surfaces) + direct measurement (tenancy-guard live run, GitHub collaborator API, guard executions). Every number measured, never estimated (DR-0076).

## The seven dimensions — run, with results

**1. SHOULD/ARE — RUN.** The SHOULD is unusually well-written here (relationships.js's 41-capability registry, 8 DB roles, the DR-0241/0252/0253 decisions); the ARE diverges in a repeating shape: **the database layer is stronger than the app layer, and both are stronger than the claims.** Measured: 167 instance-scoped tables, 196 RLS-enabled, **zero uncovered** (tenancy-guard PASS A–E, live run this session); 761 CREATE POLICY statements; 9 isolation smokes. But the child-safety runtime gate (`decideChildAction`) has **zero action-path callers**; the assistant's 4 grantable work surfaces have **no DB table**; delegated-PM has full DB enforcement and **zero app wiring**; `specialist` is seeded in the DB but **un-grantable from any surface**; and `isGovernor` — 105 sites — is a client-side email map, not a role.

**2. JOURNEY WALKS — RUN.** Walked as: a stranger on poetech.us (lands in their own empty `u-<uuid>` instance as owner — never inside anyone's data; anon DB reach is 3 INSERT-only tables + 6 curated SECURITY DEFINER reads, **no anon SELECT on any table**); a phone-only signup (own instance; **the DR-0253 promotion edge found**: promoting to an allowlisted email never joins poe-family because membership short-circuits before the allowlist — unrecorded until now); a guardian configuring a child (the config saves; 11 of 13 child capabilities then gate nothing at runtime); an anonymous browser on the LAN (gets `isGovernor` chrome per DR-0241 — sessionless, so RLS returns no data); a stolen family phone (bridge + review tokens + session; PIN gates cover Financial only; no expiry, no per-device revocation).

**3. SURFACE-SAYS-TRUTH — RUN.** Fixed this session: `relationships.js` under-claimed the successor wall ("next verified slice" — it shipped in 0082); the bearer-rotation runbook instructed a rotation against **Vercel, a dead host** (would fail at first paste); the monolith's intake modal comment described a "post-vacation" plan two months stale. Remaining truth debts carried: `guardian-child.js`'s "the single gate the rest of the app calls" (it doesn't, yet), PrivateGate's header claiming three areas while wrapping one.

**4. FORM-FACTOR — RUN at the fleet level.** Access chrome rides the same measured CI probe (selftest + sweep at 360/768/1440px) on every push; no access-specific geometry defects surfaced in this pass.

**5. DELIVERY-CONTEXT — RUN.** The one his-hand step this evaluation produces is the NAS bearer rotation, and its runbook now matches the real bench: NAS script + per-device token typing, **no env var, no redeploy** (the old steps 3–4 were the stale-Vercel path). Everything else shipped through the lane.

**6. FINDINGS ARE A WORK QUEUE — RUN.** Done-with-evidence below; carried items ride REV-0216's dated lines (watcher-swept daily, surfaced on the rolling `overdue` issue).

**7. GATE-THE-CLASS — RUN.** New machinery left behind: the vendor-form allowlist is now **empty** (any third-party form endpoint anywhere fails the build — it caught this session's own comment text within minutes of the change, live proof); Dependabot is the repo's first dependency witness (its branches don't match the auto-merge prefixes — nothing supply-chain merges unattended); 0127 folded into the rls-isolation matrix ending its one-day-old sibling drift.

## What is happening (measured strengths)

- **The tenancy floor is the healthiest access system in the repo**: 0 uncovered instance-scoped tables; the viewer RESTRICTIVE deny-overlay auto-covers new tables (guard Check E); provisioning is deterministic (0119 — the "my Books are gone" class closed); invites are a two-party handshake (DR-0187); role escalation is capped in SECURITY DEFINER (owner untouchable, admin can't mint admin, no self-change).
- **Privileged actions leave receipts**: role changes and support grants write audit_log; every break-glass `support_read` is logged; the support door is scoped, time-boxed, reason-required, PHI-fail-closed.
- **The trust roots are minimal and known**: exactly **one human collaborator (darrellpoe06, admin — measured via the GitHub API)**; the bot acts only through scoped tokens; 14 distinct CI secrets inventoried with blast radii; reviewer-mode can only ever *narrow* privilege by construction.
- **Aggregate-only usage ethics hold**: no per-person behavior is collected; even the Governor reads only aggregates; the access roster shows names/roles, never emails.

## What is not (ranked gaps, both auditors merged)

1. **Claimed-but-unwired app layers** (child runtime gate, assistant grants, delegated-PM UI, specialist granting) — the DB or model promises what no surface delivers.
2. **The three strongest role walls (0082 successor/child books, 0100 assistant wall) have static proof only** — the only walls without a live matrix smoke; DR-0252's own re-review line carries it.
3. **Governor is a bundle-shipped email map** — UI-only by design (RLS is the data gate), but 105 sites of governance chrome derive from plaintext client state; a server-checked role is the best-practice end-state.
4. **Public reverse-proxy adds no rate limit or allowlist** — the Funnel throttle the proxy bypasses for family also no longer brakes attackers; the whole model rests on NAS-side auth this repo can't see.
5. **CI holds a prod-DB superuser string with no staging tier**; the merge lane is humanless by decided design (DR-0103) — accepted trade, re-affirmed here, with the `hold` label and gates as the brakes.
6. **No denial telemetry** — RLS rejections, blocked writes, failed PINs are invisible in aggregate; only successful break-glass reads are logged.
7. **Token/device hygiene**: no expiry or per-device revocation for the bridge/review tokens; the NAS-side bearer still awaits rotation (his-hand); TS_AUTHKEY guidance permits a reusable key; the sudoers brake nas-bootstrap advertises is unversioned and unverifiable from the repo.
8. Vercel still previews every branch (both in-repo kill levers measured dead — dashboard action); GitHub-native secret scanning/push protection state is a settings-page fact the repo can't attest.

## Best practices implemented THIS SESSION (evidence attached)

- **Bundle secret exposure closed as a class**: `VITE_N8N_BEARER` and `VITE_REVIEW_TOKEN` build-time fallbacks deleted from the client and their deploy-time injection removed — the public bundle now carries **no shared secret**; per-device localStorage tokens are the only client source (lib/n8n-base.js, ReviewFeed.jsx, deploy-cloudflare-pages.yml; token tests 21 green).
- **PII to third parties ended**: the intake modal now submits to the sovereign `app_interest` lane (migration 0025, anon-INSERT RLS, admin-read in-app) instead of POSTing name/email/phone off-site; the vendor-form allowlist emptied so the class fails the build forever (business-systems-guard: "vendor forms contained to 0"; monolith ratchet re-frozen lower at 5,444).
- **Dependency witness added**: `.github/dependabot.yml` (weekly, grouped, auto-merge-safe by prefix construction).
- **0127 matrix fold** — one dispatch, every isolation proof, no sibling workflows.
- **Ways/documentation corrected**: rotation runbook (real host, per-device model), relationships.js under-claim, monolith intake comment.

## Carried (REV-0216 dated lines; watcher-swept; the lane executes)

Live smokes for 0082/0100 as matrix legs + wire `decideChildAction` into the real action paths (2026-08-01) · NAS bearer + review-token rotation — **your hand**: run the NAS script, type the new values on the family devices, runbook is paste-ready (2026-08-01) · server-checked governor role to replace the email map, and grant-paths for `specialist` (2026-08-06) · assistant grant table + delegated-PM UI wiring, or an honest retirement of the unwired claims (2026-08-06) · denial telemetry aggregate + member-readable audit_log (rides DR-0242's 2026-09-15 line) · proxy rate-limit/allowlist decision + Vercel preview shutoff + GitHub secret-scanning/push-protection check — dashboard steps, listed for your sitting (2026-08-06) · DR-0253 promotion edge recorded and decided (2026-08-06).

**Not knowable from the repo** (needs live DB/dashboards): actual role occupancy (does any successor/child/assistant/specialist row exist), applied-migration reality, matrix run history, Supabase auth config, token scopes, tailnet device list, Vercel preview protection. These are the questions for the next sitting with the dashboards open.
