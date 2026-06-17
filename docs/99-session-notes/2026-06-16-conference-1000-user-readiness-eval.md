# Can 1000 people sign up and use the PoeTech app today? — grounded readiness eval

- **Date:** 2026-06-16
- **Question (Darrell, conference-critical):** "Can 1000 people sign up and use the PoeTech app today?" (~1000 = the 77th National Assembly registration scale.)
- **Method:** verified against the real config — repo files, the live bundle on poetech.us, migrations, RLS helpers, deploy gates. Every claim below is marked **CONFIRMED** (evidence cited), **CORRECTED** (the prompt's hypothesis was wrong, with proof), or **COULD-NOT-VERIFY** (dashboard-only, not in the repo). No fabricated capacity numbers. Governed by the Verification Doctrine (DR-0076).
- **Layer:** 4 (working artifact).

---

## VERIFIED LIVE 2026-06-17 — the two hard blockers are now CLEARED

Re-checked against production after another session shipped the feature. Both structural blockers from the original report are **resolved, verified live (not assumed):**

- **Feature shipped + deployed — CONFIRMED.** Conference registration merged to `main` ([#214](https://github.com/darrellpoe06/Kingdom-PWA-Node/pull/214)) and **is in the live production bundle**: `grep -c conference_public_registrations` against `https://poetech.us/poetech-app/assets/index-CMuHIMyi.js` returns **1** (was 0 on the old bundle). `0027` + `ConferenceRegisterForm.jsx` are on `origin/main`.
- **`0027` applied on cloud — CONFIRMED by live probe.** Anon `SELECT` on `conference_public_registrations` returns **42501 "permission denied for table"** (table EXISTS, anon correctly has no SELECT) — *not* PGRST205 "not found." An anon `POST` (the real registration path) returned **HTTP 201** — a row was created. The table, the anon INSERT grant, the force-instance trigger, and RLS are all live and working.

**So for the conference REGISTRATION path at ~500: the answer is now YES, today — verified end-to-end.** What remains is only the *recommended* (not blocking) load test for measured proof.

> **Housekeeping (transparency):** the live INSERT probe created one real row — `name="__readiness_probe__"`, `source="readiness-probe"`. Anon cannot delete it (RLS owner/admin only). Darrell/Christina/BG: delete it from the organizer view, or in Studio:
> `DELETE FROM conference_public_registrations WHERE source = 'readiness-probe';`

> **New since the original report:** `main` now also carries [#189 "simple login — email+password, no profile no access"](https://github.com/darrellpoe06/Kingdom-PWA-Node/pull/189), which gates the *app* behind sign-in. This does **not** affect the anon `?register=1` registration path (still open, verified above). It does add an **email+password** signup method alongside OTP/OAuth — note that with `mailer_autoconfirm:false` (confirmed live), password signup still sends a confirmation email and so shares the same 2/hr built-in email wall as OTP. Google OAuth remains the limit-free path. Re-verify provider/confirm settings if account-signup volume becomes a real path for the 500.

---

## RE-SCOPED TO ~500 (2026-06-17) — the operative answer

Darrell corrected the target: the Assembly is **at most ~500 people (high estimate)**, not 1000, and **much of that 500 is the EXISTING congregation pre-registering ahead of time** (a trickle over days/weeks), not 500 brand-new accounts created in one concurrent burst. This simplifies the answer a lot. The 1000-scale analysis further below is retained as the conservative upper bound; provider enablement was CONFIRMED against the live project (`/auth/v1/settings`) and rate limits are sourced from Supabase's own docs/config (no fabricated numbers).

### Can it take 500 today? — verdict

- **Conference registration (anon path, the actual conference flow): YES at 500 — once the two structural blockers clear.** 500 anonymous inserts spread over a pre-reg window is *trivial* load (it was already fine at 1000). The only things in the way are unchanged and have nothing to do with capacity: **(1)** the feature is still **unshipped** (uncommitted branch), and **(2)** migration **`0027` is still unapplied**. Clear those and 500 registrations is a non-event.
- **Account signup via Google OAuth at 500: YES today.** Enabled now (CONFIRMED live). 500 across diverse IPs (cellular/home) over a pre-reg window sits far under every limit. No fix required.
- **Account signup via Email OTP at 500: still throttled by the built-in 2/hr sender if done concurrently — but the pre-reg window softens it.** Even spread out, 2/hr (~48/day) is awkward. Custom SMTP is **still wise but lower-urgency** at 500, and only actually *required* if the email link is a primary signup path rather than a fallback behind OAuth.

### Why pre-registration by existing members shrinks it further

- **"Existing congregation" mostly means returning users, not new accounts.** A returning user signs *in* (or already has a persisted session) — that creates **no new user and sends no signup email**, so it touches neither the email wall nor the new-account path. The real new-account load is only the genuinely-new fraction of the 500.
- **"Pre-registering ahead of time" means no concurrent burst.** Both walls that could bite — the 2/hr email sender (project-wide) and the 150/hr-per-IP `/token` cap — are *burst* problems. A window spread over days, from many home/cellular IPs, never concentrates load. The same-WiFi-all-at-once scenario simply doesn't occur for pre-reg.
- **Net:** the most likely real shape — existing members pre-registering via the anon link (no account at all) plus a handful of new OAuth signups — is **fully covered today** once the feature ships and `0027` is applied.

### Minimal fix list for 500 (not 1000)

| # | Action | Needed for 500? | Who |
|---|---|---|---|
| 1 | **Ship `feat/conference-public-registration`** to main | **YES — hard blocker** (capacity-independent) | System |
| 2 | **Apply migration `0027`** on cloud + verify the `db-migrate` run | **YES — hard blocker** | Darrell (Studio) |
| 3 | **Lead signup with Google OAuth** (already enabled) | **YES — and already done** | — |
| 4 | **Custom SMTP** for the email-link path | **Optional at 500** — wise, low urgency; required only if email is a primary signup path or used in a burst | Darrell provisions provider+keys; System wires dashboard |
| 5 | **Cloudflare Pages cutover** | **Optional at 500** — 500 PWA loads is trivial bandwidth; do it for the deploy-cap fix, not for capacity | Darrell (creds+DNS) |
| 6 | **Supabase Pro plan** | **Optional** — headroom/backups insurance, not required for 500 anon inserts | Darrell |
| 7 | **Run the k6 load test at ~500** (`scripts/load-test/conference-register-k6.js`, now scoped to 500) | Recommended — turns "fine" into measured proof | System (against staging once 0027 lands) |

**Bottom line at 500:** there is **no capacity wall** for the conference. The blockers are purely **ship-it + apply-the-migration** (items 1–2). Google OAuth already covers account signups at this scale; custom SMTP drops from "#1 blocker" to "nice-to-have." Everything below is the retained conservative 1000-scale analysis.

---

## VERDICT — short version (original 1000-scale framing)

**No, not today — but the real blocker is NOT the one the question assumed.**

The single thing standing between the congregation and registration is that **the registration feature itself is not shipped.** It exists only as **uncommitted working-tree files on `feat/conference-public-registration`** — not merged to `main`, not built, not in the live bundle, and migration `0027` is **not applied** on the cloud database. Until that lands, **zero** people can register through the public path, let alone 1000.

The premise the question leaned on — *"auth-SMTP is almost certainly the #1 blocker"* — is **incorrect for the conference registration path.** That path is **anonymous-insert by design** (no account, no email, no OTP). It deliberately sidesteps the Supabase email rate limit entirely. SMTP only becomes a wall under a *different* interpretation of "use the app" (1000 people creating full accounts), addressed below.

Once the feature is shipped + the migration applied, the **anon-insert architecture is well-suited to 1000-scale** and there is no structural reason it can't handle the conference — pending one live load test to prove it rather than assert it.

---

## The two meanings of "sign up and use the app" — they have different answers

This is the crux. The question conflates two very different flows:

| Path | What it is | Auth/email needed? | Today's status |
|---|---|---|---|
| **A. Conference registration** | The `?register=1` public page + in-app front door. Name + meal + optional contact → one row in `conference_public_registrations`. | **None.** Anonymous insert. | **Not shipped** (uncommitted branch; 0027 unapplied). Architecture is sound for 1000. |
| **B. Full PoeTech account** | Royalty Link (Supabase email OTP) or Google/Apple OAuth → signed-in PWA with your own data under RLS. | **Yes** for Royalty Link (email). OAuth bypasses email. | Live, but **email OTP at 1000-scale is a hard wall** unless custom SMTP is configured (could-not-verify) — and Google OAuth avoids it. |

**For the conference, the design intent is Path A** — `conference-register.js` and `ConferenceRegister.jsx` explicitly state "no account needed." So the conference question is answered by Path A, where **email/SMTP is a non-issue.** The prompt's #1-blocker hypothesis applies only to Path B, which the conference flow was purpose-built to avoid.

---

## Item-by-item assessment

### 1. SERVING — is the latest build live, and is the Vercel cap blocking it?

- **CONFIRMED:** `poetech.us/poetech-app/` returns **HTTP 200** — production is live and serving.
- **CONFIRMED:** Production is still on **Vercel**. The Cloudflare Pages pipeline is **gated OFF** — `gh variable list` shows **no `CF_PAGES_ENABLED`** set, and `deploy-cloudflare-pages.yml` runs only `if: vars.CF_PAGES_ENABLED == 'true'`. The off-Vercel cutover (`2026-06-16-cutover-plan-vercel-to-cloudflare-pages.md`) is built + proven on `pages.dev` but **awaits Darrell's Cloudflare account + API token + DNS cutover**.
- **CONFIRMED:** The conference registration feature is **NOT in the live bundle.** `grep -c conference_public_registrations` against the live JS (`assets/index-BYz-Lr_1.js`) returns **0**. The live build predates this feature.
- **COULD-NOT-VERIFY:** Whether the exact latest `main` SHA (`103625c`) is the one currently served, or whether the Vercel 100/day cap is *actively* throttling a fresh deploy right now. The live bundle is a single `index-*.js` with no code-split `poe-financial-mvp-v28-*.js` chunk (the local build splits it), which is *suggestive* of an older deploy — but I will not assert a stale-deploy conclusion without the served SHA. The cap risk is real and documented; the durable fix (Cloudflare Pages, no deploy cap, unlimited bandwidth) is one credential-flip away.

**Bearing on 1000-scale:** Vercel's **bandwidth** (100 GB/mo Hobby) is the relevant limit for serving, not the deploy cap. 1000 PWA loads (~0.5–1 MB cached shell each) is a few hundred MB — fine. The deploy cap blocks *shipping new builds*, not *serving traffic*. The Cloudflare cutover removes both worries and should be done before the conference regardless.

### 2. AUTH EMAIL (the prompt's hypothesized #1 blocker)

- **CORRECTED — this is not the #1 blocker for conference registration.** `conference-register.js:submitRegistration` does a bare `supabase.from('conference_public_registrations').insert(row)` with **no auth call**. `0027` grants `INSERT` to **`anon`** with `WITH CHECK (true)`. The form (`ConferenceRegisterForm.jsx`) requires only a name. **No email is sent during registration**, so the Supabase email rate limit cannot gate the 1000.
- **CONFIRMED (conditional wall for Path B):** If "use the app" means 1000 people create **full accounts** via Royalty Link, that calls `signInWithOtp` (`supabase.js:100`), which sends an email per signup. Supabase's **built-in email service is testing-grade and heavily rate-limited** (single-digit emails/hour on the default project sender) — at 1000 signups this **would** wall hard. The code's own comment flags this and notes **Google OAuth bypasses the email path** (`supabase.js:110-114`).
- **COULD-NOT-VERIFY:** Whether a **custom SMTP provider is configured on the cloud project.** That is a **Supabase dashboard setting** (Auth → SMTP Settings) and is **not represented in the repo.** The only SMTP config in-repo is `infra/supabase/.env` / `docker-compose.yml` — that is the **self-hosted NAS box**, with **blank** `SMTP_HOST/USER/PASS`, and the app uses the **cloud** project (`mjjlevhdufpaplypnqrv`), not that box. So repo evidence neither confirms nor denies cloud SMTP.

**Net:** for the conference, ignore SMTP. For any future "everyone makes an account" push, configure custom SMTP **and/or** lead with Google OAuth before scaling.

### 3. SUPABASE PLAN + POOLING

- **COULD-NOT-VERIFY (dashboard-only):** Plan tier, connection limits, and whether Supavisor pooling is enabled are **not in the repo.** Project ref `mjjlevhdufpaplypnqrv`.
- **CONFIRMED (architecture):** The browser talks to Supabase via the **PostgREST data API over HTTPS** (`supabase-js` REST), **not raw Postgres connections.** PostgREST/Supavisor multiplex requests, so the per-project **direct-connection cap (60 on free) does not gate REST inserts** — 1000 concurrent anon `INSERT`s are stateless HTTP calls PostgREST pools internally. Connection pooling is therefore **not a registration blocker** for Path A.
- **Data/bandwidth:** 1000 registration rows (a few hundred bytes each) is **trivial** — well under even the free tier's 500 MB DB / 5 GB egress. The free-tier item that *could* matter is **50k MAU**, which only counts *authenticated* users — anon registrants don't consume MAU. So Path A is essentially free-tier-safe on volume.
- **Recommendation:** Confirm the plan in the dashboard. If still **Free**, registration is fine, but **upgrade to Pro before the conference** anyway for the headroom (no 7-day inactivity pause, daily backups, higher egress) — cheap insurance for a one-shot event you can't re-run. This is a provisioning decision for Darrell, not a code change.

### 4. RLS QUERY LOAD / N+1

- **CONFIRMED — the insert (hot) path is cheap.** The anon `INSERT` policy is `WITH CHECK (true)` (no function eval). The `BEFORE INSERT` trigger does one indexed lookup (`SELECT id FROM instances WHERE slug='colg'`). Indexes exist on `instance_id` and `created_at DESC` (`0027:56-59`). 1000 inserts = 1000 cheap single-row writes. **No N+1 on write.**
- **CONFIRMED — the organizer read path is sound.** `user_role_in_instance(instance_id)` and `user_in_instance(...)` are declared **`STABLE`** (`schema-v2.1-infra.sql:126,137`), so Postgres evaluates them **once per query**, not once per row, and each is a single indexed lookup on `instance_members`. The roll query (`SELECT * ORDER BY created_at DESC`) uses the `created_at DESC` index. **No per-user fan-out.**
- **CONFIRMED — one real inefficiency (not a blocker).** `subscribeRegistrations` (`conference-register.js:128-146`) re-runs a **full `SELECT *` of the entire roll on EVERY realtime change.** During the rush, each open organizer session re-fetches the whole table per insert — O(N) full reads per organizer. With only ~3 organizers it's tolerable, but it's wasteful and will feel laggy. **Recommended micro-fix:** debounce the re-fetch (e.g. coalesce changes within ~750ms) or apply the realtime delta to local state instead of re-fetching. Pairs with `feedback-perpetual-improvement-default` — small, ship it; not gating.

### 5. LOAD TEST

- **CONFIRMED:** **None exists** — no k6/artillery/perf harness anywhere in the repo.
- **DELIVERED:** A lightweight **k6** script: [`scripts/load-test/conference-register-k6.js`](../../scripts/load-test/conference-register-k6.js). It drives the **real anon REST insert path** (mirrors `buildRegistrationRow`), ramps to ~400 concurrent VUs past the realistic peak, tags rows `source='loadtest-k6'` for trivial cleanup, forces no `instance_id` (proving the trigger routes it), and asserts thresholds (p95 < 1.5s, <1% errors).
- **NOT RUN — and I will not fabricate numbers.** It **cannot** run meaningfully today because (a) `0027` is unapplied, so the table doesn't exist to insert into, and (b) it must point at a **staging** project, not production. Once the feature is on a staging project with `0027` applied, the run is one command (header has the paste-ready PowerShell). **Result = measured numbers or nothing.**

---

## Prioritized blocker list — what actually stands between us and 1000

| # | Blocker | Severity | Who | Action |
|---|---|---|---|---|
| **1** | **Registration feature unshipped** (uncommitted branch; not on `main`; not built; not in live bundle) | **HARD — total** | System (Claude) builds/commits; auto-merge lane ships | Commit `feat/conference-public-registration`, open PR, land on `main`. Until then 0 can register. |
| **2** | **Migration `0027` not applied** on cloud `mjjlevhdufpaplypnqrv` | **HARD — total** | Darrell runs in Studio (or `gh workflow run db-migrate.yml` + **verify the run**) | Apply 0027; confirm `conference_public_registrations` exists + anon INSERT works. Watch the `db-migrate` trigger gap (auto-merge via GITHUB_TOKEN has silently skipped db-migrate before). |
| **3** | **Latest build may not be live + Vercel cap risk** | **MEDIUM** | Darrell provisions CF creds + DNS; System wired it | Do the Cloudflare Pages cutover (creds + `gh variable set CF_PAGES_ENABLED true` + DNS). Removes deploy-cap and bandwidth worry for the event. |
| **4** | **Supabase plan unconfirmed** (could-not-verify) | **LOW for Path A** | Darrell (dashboard) | Confirm tier; upgrade to **Pro** before the conference for headroom/backups. Anon registration is free-tier-safe on volume regardless. |
| **5** | **No load test has been run** | **MEDIUM (confidence gap)** | System runs k6; Darrell provides staging URL/key | Apply 0027 to a staging project, run `conference-register-k6.js`, attach the measured p95/error numbers. Turns "should handle it" into "proven." |
| **6** | **Realtime full-roll re-fetch on every insert** (organizer view) | **LOW** | System | Debounce / delta-apply in `subscribeRegistrations`. Polish, not gating. |
| **—** | **Custom SMTP (Path B only)** | **N/A for conference** | Darrell provisions provider + keys; System wires config | Only if a "1000 full accounts" push happens. Lead with Google OAuth; configure SendGrid/SES/Postmark in the dashboard. Not needed for registration. |

---

## Path to 1000-ready in time for conference registration

1. **Ship the feature (System, today).** Commit `feat/conference-public-registration`, open the PR, land it on `main` via the auto-merge lane.
2. **Apply `0027` + verify (Darrell, minutes).** Studio SQL editor, then confirm the table exists and an anon insert lands a row. Do **not** trust "it merged" = "it's on cloud" — verify the `db-migrate` run.
3. **Cut over to Cloudflare Pages (Darrell, ~1 evening).** Removes the deploy cap and bandwidth ceiling before a high-traffic day. Steps are in the cutover doc; rollback is a DNS revert.
4. **Confirm the Supabase plan (Darrell, minutes).** Upgrade to Pro for the event window — cheap insurance.
5. **Run the load test against staging (System, ~10 min once 2 is done on staging).** Attach measured numbers. If p95 and error-rate pass, that is the evidence that answers "yes, 1000."
6. **Ship the realtime debounce (System, small).** So the organizer roll stays smooth during the rush.

Steps 1, 5, and 6 are the system's hands. Steps 2, 3, 4 need Darrell (DB apply, credentials, plan) — the bright-line actions only he holds.

**Bottom line:** the architecture for 1000-scale conference registration is **right** (anon-insert, indexed, RLS-safe, email-free). The gap is **shipping + applying + proving** it — not a capacity ceiling, and not the SMTP wall the question feared.
