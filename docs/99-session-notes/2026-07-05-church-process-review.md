# Church process review — quality, effectiveness, functionality (+ website) — 2026-07-05

**Directive (Darrell, 2026-07-05, from the TLC text message):** review our church processes for quality, effectiveness and functionality and make recommendations; also review www.thechurchofthelivinggod.com; and the email for the order of service — we need this filled out inside the tab. We are looking to assess and get better now and over time.

**Posture:** the church's own message sets the tone for this review — criticism is not a spiritual gift; where it is necessary: respectful (1 Peter 2:17), gentle (Galatians 6:1), humble (Philippians 2:3), gracious (Colossians 4:6). This review is written as strengths first, then opportunities, each with a concrete next step. COLG is the named first community (COMMUNITY-FIRST-MISSION); serving her well is the mission, not critique for its own sake.

---

## 1. What shipped this session (the "now")

**Order of Service tab — "Paste from church email" import.** The church sends the weekly order of service by email (the PROCLAIM `.docx` from `bg@thechurchofthelivinggod.com`). Until now that document landed in Choir → Team Docs as an attachment (via `scripts/sermon-import/import-team.mjs`), but the structured run-of-show in Church → Order of Service still had to be re-typed by hand. New:

- `app/src/lib/order-import.js` — pure `parseEmailOrder(text)`: paste the emailed order (or the document text), it recognizes segments (title, sector by keyword, planned minutes, owner after a dash/"by", scripture reference, first clock time as the suggested start), skips email plumbing (greetings, signatures, links, phone/address lines) and **surfaces every skipped line** — nothing drops silently, nothing is invented (DR-0076).
- `ServiceProgram.jsx` — a steward/finalizer button "Paste from church email" with a live preview (recognized segments + skipped count) before anything is written; imported segments land through the normal insert lane, append after existing segments, stay editable, and are recorded in the change trail as `import-email`.
- The sermon parses as FIXED (`flexible:false`) so a reflow never compresses the Word — same covenant as the standard seed.
- 11 new vitest cases lock the parser (`order-import.test.js`); lint / full suite (4,473) / build / consistency-guard all green.

**Why paste, not auto-fill:** the emailed order lives in a `.docx` attachment. The cloud session's Gmail connector reads bodies but cannot download attachments, and the document is not in Drive — so pre-filling the tab from here would have meant inventing COLG's run-of-show, which DR-0076 forbids. The paste importer makes the honest path a 30-second action. The auto path is a named follow-up (§3.1).

## 2. Church process review

### 2.1 Strengths (what is genuinely working)

- **The order-of-service learning loop is a real closed loop** — plan → execute → harvest the actual from the service video → reconcile → blueprint seeds next week (`service-program.js`, `service-actuals.js`, 0042/0045). This IS the "assess and get better now and over time" machine, already built. What it needs is weekly use (§3.4).
- **One source, many harvests** — the YouTube service recording drives sermon, choir songs, order-of-service actuals, transcripts, and Learn material through the coverage ledger (0050), with honest provenance (`needs_review` until a steward confirms) everywhere a machine guessed.
- **Institutional memory on every edit** — the change trail (`church_service_program_changes`) records who changed what on the order; Team Docs dedupes by `email_id`; deletions are logged with readable summaries.
- **Sector lenses** — one master program, each staff member reads their own part (choir / pulpit / music / media / ushers / hospitality / pastoral). For an elderly, tech-novice staff this is the right shape: each person sees only what they own, with their cue.
- **Sound governance** — finalizer circle for who edits the master; RLS-scoped reads; church giving stays on the church's own secure page (no card handling in-app).

### 2.2 Opportunities (gaps, each with a next step)

| # | Gap | Evidence | Next step |
|---|-----|----------|-----------|
| 1 | Emailed order → structured segments was manual re-typing | Team Docs holds the document; segments were hand-entered | **Shipped this session** (paste importer). Follow-up: auto-parse in `import-team.mjs` (§3.1) |
| 2 | Trivia producer unwired — the church ALREADY produces weekly trivia by email (question Wednesday, answer Thursday, $2 gift mailed), but nothing writes `trivia_questions`; Engagement renders a fixed set | 2026-06-29 interconnection audit; timeline #2 (re-review 2026-07-19); `info@` trivia emails in the inbox | The email is a simpler producer than the planned NAS/Whisper path — mirror `import-team.mjs` for trivia emails (§3.2) |
| 3 | Presenter worship set list built but mounted by no component | timeline #9 (re-review 2026-08-15); `worship-presenter.js` tested, unmounted | Keep the re-review date; the order-of-service master is its input, which is now easier to fill |
| 4 | Migration 0077 awaiting hand-apply | 2026-07-05 live-data audit, timeline #1 (re-review 2026-07-06) | Darrell applies in Supabase Studio (unchanged) |
| 5 | Church communications are image-only | Both ConvertKit sends inspected this session are a single flyer JPEG with no text body | §2.3 website/comms recommendations |

## 3. Recommendations

### 3.1 Automate the email → order-of-service bridge (next build)
`parseEmailOrder` is pure JS with no browser dependency. Extend `scripts/sermon-import/import-team.mjs`: after uploading the order-of-service `.docx` to Team Docs, extract its text (mammoth or similar), run `parseEmailOrder`, and land a **draft** `church_service_programs` + segments for that service date — status `draft`, so a finalizer confirms in-app before it's the plan (same `needs_review` posture as every harvest). Local, human-run, no timer — three-brakes rule not triggered.

### 3.2 Wire the trivia producer from the email the church already sends
The Wednesday trivia email (question) + Thursday answer email are a complete producer pair arriving weekly from `info@thechurchofthelivinggod.com`. A `classify.mjs` extension + a small parser writes `trivia_questions` (with the answer email closing the loop). This turns Engagement live with zero new work from church staff — they already do their part every week. Sequenced ahead of the Whisper path because the content is already text.

### 3.3 Website (www.thechurchofthelivinggod.com) — see §4
Owner is the church office; PoeTech's role is gentle, concrete suggestions plus the PWA carrying the structured/member-facing surfaces the site doesn't.

### 3.4 The over-time assessment cadence (using what's already built)
- **Weekly (after Sunday):** a finalizer taps "Pull from service video" in Order of Service → reconcile → the variance banner (planned vs actual) is the week's quality number; next week's plan starts from the blueprint. The loop only teaches if it runs weekly.
- **Monthly:** read the change trail + variance trend (are services running closer to plan? is the Word getting its full time?). Surface worth building later: a small variance-trend strip on ServiceActuals.
- **Quarterly:** QUALITY-OF-LIFE check with church staff (does the tool make Sunday easier for the actual people running it — BG, Christina, the keyboardist, ushers). Family-and-community voice per COMMUNITY-FIRST-MISSION.

## 4. Website review — www.thechurchofthelivinggod.com

**Honest scope limit (DR-0076):** this cloud environment's network policy blocks direct fetches of the site (the proxy denies the connection — a policy setting on our side, not the church's server). Reviewed via the search index (all indexed pages), the church's own emails, the Sunday flyer, and press/directory coverage. A hands-on page-by-page pass from Darrell's desktop would complete it — instructions below.

**Strengths:** consistent identity ("The Love Corner"); service info (Sundays 11:00 AM, in person + Facebook/YouTube live, 312 E. Bradley Ave, 217-359-6920) is consistent across flyer, emails, and site; active weekly engagement content (trivia, Bible study points); the E-MEG Christian Center has its own page; mission statement is clear ("Reviving Faith · Restoring Hope · Rebuilding Communities").

**Opportunities (verify on the live site before acting — each is from the index, not a live fetch):**

1. **The front door is an event page.** The root URL currently serves "77th NATIONAL ASSEMBLY" (July 14–16); the church home lives at `/home.html`. A first-time visitor lands on an event, and after July 16 the front door goes stale. Suggest: home page at root with an event banner, event on its own page.
2. **Stale content lingers.** Indexed live: `76th-national-assembly.html` (last year's event), "365 Day Bible Reading Challenge 2022," 2023 trivia pages. Suggest a simple archive section, or unpublish after events close.
3. **Duplicate builder pages.** `bible-study-class-points1.html`, `e-meg-christian-center1.html` — the `1` suffix is the site builder's duplicate-name artifact; the un-suffixed originals may also exist. Worth a dedupe pass.
4. **Email content is image-only.** Both ConvertKit sends inspected are a single flyer JPEG: screen readers get nothing, image-blocking clients show a blank email, and the service time/address exist only inside the picture. Suggest: keep the flyer, add the key lines (service time, address, live links) as text beneath it. This is the accessibility-default commitment (COMMUNITY-FIRST) applied to comms.
5. **No published order of service / bulletin.** Nothing indexed suggests one — the PWA's Order of Service is the right home for the team side; if the church wants a public-facing bulletin later, the master program can export it (possible future surface).

## 5. Verification (gates)

- ESLint `--max-warnings 0`: clean.
- vitest: **4,473 passed** (366 files) including 11 new `order-import.test.js` cases; consistency-guard caught the initial emoji-as-icon on the new button (replaced with `UiIcon name="mail"` — the gate proved itself again).
- `npm run build`: passes.
- Live in-app verification (signed-in finalizer pasting the real PROCLAIM text) follows the validate-by-using-the-app rule — Sunday's paste is the live test.

## 6. Three-brakes note

Nothing here is autonomous or timer-driven: the importer is a human-triggered paste; the recommended `import-team.mjs` extension stays local and human-run. The three-brakes rule is not triggered.
