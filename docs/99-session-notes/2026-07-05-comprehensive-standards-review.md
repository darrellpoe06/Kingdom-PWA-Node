# Comprehensive standards review — project + PoeTech App (2026-07-05)

**Requested by Darrell** ("Do a comprehensive review of the project and the PoeTech App for making sure it's sound based on our standards"), the night of the Cloudflare cutover, immediately after build B9E7FCF went live on poetech.us. Four independent read-only auditors swept the repo in parallel, each against the binding documents themselves (CLAUDE.md, DR-0076, DR-0098/0099/0100/0101, LESSONS-LEARNED P1–P24, PERPETUAL-PIPELINE-HEALTH, RELEASE-TIERS, SCRIPTURE-REFERENCE-STANDARD), with file:line evidence required for every claim. This note is the synthesis; each finding below carries its origin lens.

## The verdict, in one line per lens

| Lens | Verdict |
|---|---|
| Security & tenancy | **Sound with recommendations** — RLS spine holds (136/136 instance-scoped tables covered, guard green in CI); no committed secrets; P20 identity gating verified; delegated-PM ships behind live isolation proof as DR-0101 requires. No exploitable blocker. |
| Word / theology / content | **Substantially full compliance, verified with receipts** — all 197 catalog verses independently confirmed verbatim against the in-app KJV; color theology exactly implemented (true red = the Blood only, in all three Scripture color systems); DR-0100 three-tier discipline held and explicitly taught. Peripheral defects only. |
| UX honesty & accessibility | **Culture is real, one violation live** — contrast/legibility/feedback-coverage/dead-ends are machine-gated and tonight's new surfaces are clean; but the header freshness dot claims "LATEST" from absence of evidence (DR-0076 violation, confirmed by Darrell's own screenshot tonight). |
| Architecture & pipeline | **Substantially lives up to its own standards** — every guard spot-checked is proven-to-catch (no theater); monolith holds at exactly its frozen ceiling; SW cache versioning (P2) correctly closed; Three Brakes fully honored (zero active crons). Weak edges at the cutover seams. |

**Overall: SOUND, with a short, concrete fix list.** Nothing found is an exploitable security hole or doctrinal failure. The most important pattern across all four lenses: the few real defects are exactly where the standards predicted they'd be — at seams (host cutover, default DB privileges, gate regexes that lag the newest rule) and at over-claiming surfaces (a green dot that says more than it knows).

## Fixed during the review (same session)

- **`/nas-photos` had no Cloudflare-side proxy** (HIGH, architecture lens): the Vercel rewrite was the only path, so property photos (Big Picture / Rentals) broke on the new host. Fixed: `app/functions/nas-photos/[[path]].js`, same pattern as the `/n8n` Pages Function, prefix-preserving.
- **One live typographic-theology violation** (theology lens): `ACCESS-TO-THE-HUMAN-MIND.md` heading capitalized "The Adversary's Access" → now "What the adversary can access" per the binding lowercase rule.

## Consolidated ranked fix list (queued)

1. **HIGH · FreshnessDot honest three-state** (UX/DR-0076). `lib/freshness.js` has only stale|green; no waiting SW ⇒ green "Latest" even when the served build is behind main. Add `unknown` (idle-grey) default; drive green only from a verified check — the honest comparator already exists (`lib/quality-proof.js freshnessVerdict`). Unknown must render as unknown.
2. **MEDIUM · Revoke the silent UPDATE/DELETE defaults on append-only tables** (security). `0024`'s `ALTER DEFAULT PRIVILEGES … GRANT SELECT, INSERT, UPDATE, DELETE` makes 0075's "only SELECT + INSERT" comments false at the DB layer (append-only currently rests on RLS alone). New migration: `REVOKE UPDATE, DELETE` from `authenticated` on `request_documentation`, `rent_balance_adjustments`, `tenant_messages`, `usage_events`; correct the comments.
3. **MEDIUM · Pin audit-row authorship + instance** (security; pre-Stage-2 gate). 0075's insert policies don't force `author_user_id`/`adjusted_by = auth.uid()` nor validate `instance_id` against the tenancy — forgeable attribution on an audit trail. Fix in the Stage 2 migration before any delegate account is enabled.
4. **MEDIUM · Harden 0074 circle self-join before TV-sharing scales** (security). `tv_circle_member` self-insert doesn't constrain `role` (self-join as 'parent' ⇒ oversight over 'us' shares) and the invite code is client-verified only. `WITH CHECK ((member = auth.uid() AND role <> 'parent') OR …)` + DB-side code check.
5. **MEDIUM · Widen the adversary-capitalization gates** (theology/DR-0076 rule 2). wf36 + `ari.test.js` + `help-content.test.js` regexes predate the baal rule and never covered "Adversary" — the one live violation was exactly the term the gate couldn't catch. Widen with a verbatim-quote/media-title allowlist ("House of the Dragon" must not false-positive).
6. **MEDIUM · Migration numbering discipline** (architecture). Eleven duplicate numbers (0055 × 5); alphabetical luck currently absorbs it. Add a next-free-number CI check; pin `LC_ALL=C` in `db-migrate-apply.sh`.
7. **MEDIUM · Gate the isolation lanes on db-migrate success** (architecture/P22): both run on `workflow_run: completed` without a conclusion check, so green isolation badges can flank a red migration run.
8. **MEDIUM · Retire `VITE_N8N_BEARER` + `VITE_REVIEW_TOKEN` from the client bundle** (security; in-code acknowledged transition). Rotate both, serve via the authenticated same-origin path.
9. **MEDIUM-LOW · `|| true` on the Pages project-create step** (architecture/P22): distinguish "already exists" from a real create failure by inspecting output.
10. **LOW batch:** REVOKE-FROM-PUBLIC on 0074's three helpers · `transcript-backfill.yml` inputs via `env:` · route the two raw `isFamilyEmail` reads (monolith 5100, 5556) through the review lens · record a DR for LAN-visible Admin · ChurchHome "coming soon" buttons need a DR-0075 re-review date · consistency-guard Dingbats gap (✅ U+2705 class) · QualityProof's 5 grandfathered emoji → UiIcon · legibility debt burn-down (Presenter 38 + CreationWorkspace 29 = 55% of it) · SectionTabs tabpanel visible focus + TV tile `aria-expanded` · fix the two edited/misattributed quotes in ACCESS-TO-THE-HUMAN-MIND (Acts 5:3, John 10:27-as-ESV) · label the Exodus 23:2 paraphrase in world-issues teen copy · decide (with a recorded why) whether the ESV-badge citation pattern is docs-only · verify `0055-relationship-permissions` shows applied in the `_schema_migrations` ledger · chip at the 35 untested `*-sync.js` modules.

## Receipts worth keeping

- Tenancy guard: PASS all four sections (RLS coverage 136/136, provisioning allowlist, identity gate, no recursive policy) — and its proven-to-catch tests inject the real regressions.
- Full suite at audit time: 357 files / 4,359 tests, 0 failures.
- Scripture: 197/197 verses byte-verified against the app's own KJV source; 0 mismatches.
- Contrast guard: PASS on every theme, measured. Feedback-area coverage: 7/7, machine-gated.
- Three Brakes: zero active `schedule:` triggers repo-wide; both cron candidates ship inactive with budget/lock/kill-switch documented.
- ReviewAsUser lens verified reduce-only (`!!realFlag && !reviewing`) — cannot mint privilege.
