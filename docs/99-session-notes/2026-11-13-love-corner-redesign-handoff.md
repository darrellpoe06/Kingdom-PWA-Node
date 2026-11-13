# The Love Corner redesign: project handoff

Written 2026-11-13 ~17:00Z by the session that built it (session_01Y64aURLMxqfDbS9NsqA82o). Read this first; then the two notes it points to. Update the "Live status" section when PR #2672 deploys.

## 0. Live status (update this)

- **PR #2672** (`ccr-91fb688d-spyn2g`, head `1deb240b1`): CI running, native squash auto-merge armed, mergeable state "blocked" (CI pending), not "dirty". **Not yet merged, not yet live.** Last CI on the previous head `77d96df1a` was fully green; every later push was only a merge of main or the ledger-line move below.
- Production today still serves the pre-redesign shell on top of the redesigned homepage of DR-1455–1459 (those are live since 2026-11-12).

## 1. Completed and merged (live on poetech.us)

| phase | record | what |
| --- | --- | --- |
| 0–1 | DR-1455 | the Love Corner front door: hero with the real logo and Bishop Gwin's real photo, eight doors, feature cards, week strip, Learning Zone, Institute card, church dock (Home · Watch · Word · More), `lovecorner` theme |
| 2 | DR-1456 | Youth Zone: Kids/Teens doors, memory-verse game from KJV words, trivia, badges derived from `learner_lesson_records`; no profile, chat or leaderboard |
| 3 | DR-1458 | Ministries landing: four families over the one registry |
| 4 | DR-1459 | comfort pass measured at 360/390/768/1440 and three text sizes; the 36 px floor |
| 5 | DR-1460 | the Institute's roll, attendance and credentials (migration 0325, RLS, RPCs, `institute-walls` CI job, matrix leg); the landing's Apply / My standing / Certificates / verify / Office desk |
| — | DR-1461 | the 0319 smoke's `renter` seat fixed; CI bootstrap carries the live eight-role wall |
| — | #2668 | the shell-redesign audit, preservation checklist and the three approved previews (docs only) |

## 2. In progress

- **PR #2672 — Phases A+B (DR-1483)**: `components/shell/LoveCornerHeader.jsx` (menu · logo+name+eyebrow+"Where Love Lives" · search · bell · picture/Sign in; sub-tab strip from `sm` up), `LoveCornerMenus.jsx` (ProfileMenu; AllFeaturesSheet with every gated church tab in six groups, search over tabs and courses, Personalize, Help, Share/Install, feedback, build line), `PersonalizeSheet.jsx` (12 theme cards via the same `setTheme`, text size, voice, reading speed, reset), the **`night` theme** (Midnight's whole remap table in red/black/gold; `CHURCH_DEFAULT_THEME='night'`, cream `lovecorner` one tap away), the finance strip and the hero's duplicate brand row off the door, the layout probe's new door-header pass, `live-homepage-still.yml` (a runner's Chrome screenshots the live door; artifact `live-still`). Shell 5,178 → 5,174 lines; budget re-frozen. Legibility baseline re-frozen (existing inline-color debt now tracked under the second dark theme).
- **Branch `phase-c-wip` (pushed) — Phase C (DR-1484)**: commits `d9ba672e2` (the work) and `b959b1b22` (stills). Seven-tab church bar Home · Watch · Bible · Events · Give · Ministries · Institute (40 px, 8 px words; scrolls sideways at 360 px; no More, no second bell); the home publishes its open section so Watch/Events light; homepage in the picture's order (eight doors with TLC Institute, Customize strip → Personalize sheet by one event, Learning Zone + Kids & Youth Zone pair, Institute banner, Ministries · Upcoming events · Family & community trio); Giving Book shows a locked surface. DR-1484, its INDEX row and ledger line are in `d9ba672e2`. Tests updated (lovecorner-dock, lovecorner-home-render, church-tabs). Verified locally on the built app at 360/390.

## 3. Branches, SHAs, deployment

- `ccr-91fb688d-spyn2g` @ `1deb240b1` = PR #2672 (auto-merge armed).
- `phase-c-wip` @ `b959b1b22` + the handoff commit (this file). Its other commits are already in #2672.
- `main` @ `152cfb3b3` at writing; lesson PRs land every 20–40 min.
- Deployment: merge = deploy (`deploy-cloudflare-pages.yml` dispatched by auto-merge); `site-health.yml` is the witness.

## 4. Blockers and the race, with the fix

- Nothing is red on the current head. The only blocker was the **ledger race**: every lesson merge appends an INDEX row and an `ai-usage-ledger.json` entry at the tail; a PR whose entry sits at that tail reads "dirty" by the time its 35-minute CI finishes. **Fix applied (`1deb240b1`):** this PR's ledger entry moved mid-ledger (order carries no meaning; checked by id). If "dirty" returns: `git fetch origin main && git merge --no-commit origin/main && node scripts/resolve-ledger-conflicts.mjs && git add -A && git commit && git push`. Never force-push; never amend.
- Local `chrome-layout-probe.mjs --sweep` needs `node_modules/playwright-core` at the repo root (symlink from /opt/node-tools) and takes 10+ min here; CI's probe job is the witness.
- `npm run verify:gates` fails only `lesson-dates:check` here (shallow clone); CI has history.

## 5. Design direction (approved)

Red, black, white and gold, exactly as Darrell said ("I still want the red black white and gold, but this is the design type"; "This one instead with the red colors"). The house is dark: black into deep red, gold on it, white words. Tokens: red #C03222, heart #E43C28, black #1A1012, gold #CFA63C (fill, under ink), gold text #E4B93E on dark only, cream #FFF8F7 for the light sibling theme. Gold never carries white; true red is reserved for the Blood inside Scripture palettes (DR-0099), the church's brand red is fine (DR-1060). Generated images are never used for church assets: the real logo and the real Bishop photo only; a real building photo waits on the office. Previews: `docs/design/love-corner-shell/2026-11-13-shell-previews.html` (artifact https://claude.ai/artifact/8ai6La7jakepWyYNe3MbSe) and the stills beside it.

## 6. Homepage and top navigation

Header (DR-1483) and bar + order (DR-1484) are described in §2. Every old header control has a named new place: the table in `2026-11-13-the-love-corner-shell-redesign-audit-and-previews.md` §4a. Deep links, ids and routes are unchanged; the family app's header and bar are untouched (the new header mounts only when `churchDoorOnly`).

## 7. Kids Zone (Phase D, planned)

Over the existing Youth Zone and lessons, never replacing them: a bright frame (purple/blue/teal/orange/pink gradients in the preview) with Kids/Teens doors, "Bible Adventures" with the week's real Little Learners lesson (read-aloud, quiz, Ari in child mode), Memory verse (existing `blankWords`), Bible trivia (existing TriviaCard), Word builder and Who am I? (new, Phase E; verses verbatim), progress derived from `learner_lesson_records`, badges from `badgesFor`, Ari's bubble, Grown-ups door. Fix on the way in: the Kids door's ages (6–10) do not match Little Learners (about 3–6) and Teens is labelled 11–17 but reads at 15–17; use the 11–14 band. `LITTLE_LEARNERS_TUTOR_META.childMode` is never read; read it. No child-to-child messaging, no public child profiles, no leaderboards (DR-1456).

## 8. Preserve (the brief's rule, and the checklist in the audit note §4)

All 24 church routes (`church-tabs.jsx`), every top view (`nav-history.js` VALID_VIEWS), auth and roles untouched, RLS untouched, themes (12 now), text sizes, read aloud and voice, notifications and counts, Give panel, Share/Install, Help, reviewer mode, Ari (`/llm/chat`), Learn and the learner records, the Institute, the family app's header and bar, deep links and `?lovecorner=1`.

## 9. Remaining phases, in order

1. Land #2672; prove the deploy (BOOT OK on the merged SHA; `site-health.yml` UP; dispatch `live-homepage-still.yml` and download `live-still`); write the verification line into DR-1483 (docs commit).
2. Phase C: restart `ccr-91fb688d-spyn2g` from main (`git reset --hard origin/main`, force-with-lease only against the known old head), `git cherry-pick d9ba672e2 b959b1b22`, resolve the ledger if needed, push; PR; prove the deploy; verification line in DR-1484.
3. Phase D (Kids Zone shell, ages, Ari child mode), E (Word builder, Who am I?), F (comfort pass at four widths and three text sizes). Each: DR via `node scripts/claim-decision-number.mjs --reserve`, INDEX row ≤700 chars, `ai-usage-ledger.mjs --add`, tests, `legibility:health`, gates, PR.
4. Findings for the fix list: every Modal portals outside the themed wrapper (the two new sheets carry `data-theme` themselves); search is the one new function of the picture (one box over tabs and courses, built).

## 10. Exact next steps for the next session

1. Read `CLAUDE.md`, this file, then the audit note (§2 premise conflicts, §4 checklist, §6 phases).
2. Check #2672: `gh api repos/darrellpoe06/Kingdom-PWA-Node/pulls/2672 --jq '[.state,.merged,.merge_commit_sha,.mergeable_state]'`. If merged → step 1 of §9. If "dirty" → the merge recipe in §4. If a check is red on the **current head** → read that job's log; red checks on superseded heads are cancelled runs, ignore them.
3. Never push to `ccr-91fb688d-spyn2g` while its CI is green and waiting to merge; a push restarts CI.
4. Do not redo the audit, the previews, the header, the sheets or the night theme; they exist. Do not re-ask what is decided here.
