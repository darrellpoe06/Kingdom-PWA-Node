# Learn presentation redesign — Phases 1 & 2 (2026-11-23)

A premium, YouTube-style doorway in front of the Learn library. **A presentation layer only: no lesson is rewritten, retitled, reordered or re-departmented.** Built against the approved mockup (`20616.png`, 2026-11-23) with two required departures: the browsing cards show the NEW display title (never the original), and no view counts, likes or "Trending" are drawn, because Learn holds no such data.

Status: prototype built behind a device opt-in flag (`?learnStudio=1`). **Not committed, not deployed, migration not applied, nothing purchased, no paid generation run.**

---

## 1. Audit (Phase 1)

### Where the library lives

| Layer | Finding |
|---|---|
| Lesson content | Bundled in the app: `app/src/lib/*-course.js`, `*-class.js`, `living-lessons/*.js`, registered in `lib/learn-catalog.js` (`LEARN_CATALOG`, 45 courses). |
| The Eternal Algorithms | Built at render time by `lib/eternal-algorithms-course.js` → `buildEternalProcessingCourses()` (6 courses, 156 lessons), **outside** the registry. |
| Supabase Learn tables | `courses`, `lessons`, `curriculum_*`, `learner_lesson_records`, `lesson_versions` all hold **0 rows** (queried as `postgres`, so RLS was not hiding anything). |
| NAS overlay | `useCurriculumOverlay` (`lib/lesson-store.js`) overlays newer copies of EXISTING course keys only; it adds no lessons. |
| Progress | Per-device `localStorage` (`learn-resume.js` places, `reader-bookmarks.js`, `lesson-downloads.js`) plus `learner_lesson_records` sync for signed-in learners. |
| Mount point | `components/ChurchLearn.jsx` assembles `[aiCourse, broadcast, ...extraCourses, ...eternalCourses]`, then dates/quotes/side-story transforms for display. |
| Reader entry | `openLessonFromList()` / `readVersion()` in ChurchLearn; `learn-open.js` `requestOpenLesson()` from elsewhere. |

### Verified counts (spec said "approximately"; measured exactly)

| | Spec | Measured |
|---|---|---|
| Departments | 13 | **13** |
| Courses | 51 | **51** |
| Lessons | 994 | **994** |
| Age-specific readings | 4,258 | **4,258** (child 723 · youth 599 · teen 986 · adult 957 · senior 993) |

| Department | Courses | Lessons | Readings |
|---|---:|---:|---:|
| Living Lessons | 1 | 337 | 1,620 |
| The Eternal Algorithms | 6 | 156 | 468 |
| A.I. The Way | 3 | 115 | 547 |
| Real Estate | 12 | 97 | 389 |
| The Word & The Way | 7 | 88 | 371 |
| Serve the House | 5 | 49 | 178 |
| Stock Market | 4 | 34 | 170 |
| Kingdom Life & Stewardship | 4 | 32 | 128 |
| Project Management | 2 | 31 | 130 |
| History | 3 | 22 | 110 |
| Business | 2 | 17 | 67 |
| Mathematics | 1 | 8 | 40 |
| Development | 1 | 8 | 40 |

Note: lesson **numbers** are the numbers in the lesson IDs (LL338 = `ll338-not-with-eyeservice`), not positions. Living Lessons has gaps (e.g. no LL312), so LL338 is the 334th lesson in its course. The redesign shows the ID number, as the spec's example does.

---

## 2. Content protection

### Backup (restorable, verified)

- `learn-content-export.json.gz` — every course and every raw lesson object (all fields, every age version, every Scripture quote), 51 courses / 994 lessons, pinned to commit `cd21ca0df9e0d9665783c23c66b0c79d71a4d36c`. sha256 `c2c7867ae500e791e4f5e6f0acb3b3115ed022b03c00241943358169668528b4`.
- **Independently verified:** all 994 lessons re-hashed in Python from the export match the JavaScript baseline (994/994, 0 mismatches).
- Git is the primary backup. Recommended once approved: tag `pre-learn-redesign` at `cd21ca0`.

### Integrity baseline + regression gate

- `app/src/lib/learn-presentation/learn-integrity-baseline.json` — per lesson: course, department, position, ID, **exact title**, sha256 of the whole raw lesson object, sha256 of each age version.
- `app/src/__tests__/learn-integrity-baseline.test.js` fails the build on any removed, retitled, rewritten or moved lesson, any lost or changed age version, or any removed or re-departmented course. New lessons pass (the author keeps writing).
- **Proven to catch:** changing one letter's case in LL338's title ("with" → "With") failed two checks; restoring it passed.
- A deliberate author edit is re-measured on purpose (`LEARN_BASELINE_WRITE=1 …`) in its own commit. The redesign itself never needs a re-baseline.

### Integrity report — after all Phase 1–2 work (re-measured 2026-11-23 22:2x CT)

| Check | Result |
|---|---|
| Lessons present | **994 / 994** |
| Original titles identical, character for character | **994 / 994** |
| Whole lesson content (text, Scriptures, anchors, quizzes, stories, facilitator notes, media) identical | **994 / 994** |
| Age-specific readings identical | **4,258 / 4,258** |
| Lessons moved (course, department or position) | **0** |
| Courses removed or re-departmented | **0** |
| Lesson or Scripture source files modified (`git status`) | **0** |
| Files changed outside the new modules | `ChurchLearn.jsx` (+29 lines: flag, mount, return button), `index.css` (+10: Anton `@font-face`), `.gitignore` (+3) |

### Design rules enforced in code (not just stated)

- Presentation records are a **separate file/table** keyed by the existing `(courseKey, lessonId)`. Nothing writes to a lesson. The tests deep-freeze lessons and confirm byte-identical output.
- The original title is always read live from the lesson. The record's copy is a **drift check**: if the author retitles a lesson, that lesson shows its own title until re-reviewed.
- Records in `draft` or `review` never reach a learner build (`VISIBLE_STATUSES = approved, published`).
- A missing image or record never hides a lesson; it falls back to the lesson's own title.
- Searching by the original title still finds the lesson.
- "Watch Video" only appears for a lesson with a playable video source.
- The validator rejects: a drifted original title, a display title that repeats the original, a headline that is the original, a generic "God" in our authored voice (CLAUDE.md DR-0210; quoted Scripture is never touched), over-promising phrases, missing alt text, and duplicate titles.

---

## 3. The prototype (Phase 2)

| File | Role |
|---|---|
| `app/src/components/learn-studio/LearnStudio.jsx` | Home (hero carousel, Continue Learning with real progress, Discover Something New, Recently Added, Explore by Topic, department shelves, All 13 Departments) and the lesson cover. |
| `app/src/lib/learn-presentation/presentation.js` | Read-only presentation model, flag, shelves, search. |
| `app/src/lib/learn-presentation/validate.js` | Machine checks for every record. |
| `app/src/lib/learn-presentation/integrity.js` | Inventory, snapshot, compare. |
| `app/src/lib/learn-presentation/presentation-seed.json` | 20 pilot records (status `review`), all 13 departments. |
| `app/public/fonts/anton-latin.woff2` + `OFL-Anton.txt` | Self-hosted condensed display face (SIL OFL), no runtime dependency. |

**Lesson page hierarchy** (spec §9): cinematic cover → display title → the author's complete original title as the subtitle, directly underneath, in full, visible text (not a tooltip or collapsed section) → course and lesson number → real listening time → actions (Read, Listen, Watch Video only if real, Mark as Completed, Share) → age-version chips → hand-off to the existing reader, unchanged → Next Lesson.

**What hands off to the existing reader:** Read, Listen and every age version call ChurchLearn's own `openLessonFromList` / `readVersion`. Scriptures, read-aloud, quiz, downloads, resume, presenting and the NAS overlay are therefore the production code paths, untouched.

**Flag:** off by default. `?learnStudio=1` turns it on for that device and `?learnStudio=0` turns it off. "All Courses" returns to the classic view, and a "✦ New Learn home (preview)" pill comes back. Note for the active-by-default ledger: this is an approval gate, not a hedge, and it is removed at Phase 6.

### The 20 pilot lessons (all 13 departments)

| Lesson | Department | Original title (unchanged) | Display title | Headline |
|---|---|---|---|---|
| LL338 | Living Lessons | Not with Eyeservice — faithful work when no one is watching | Who Are You When Nobody Is Watching? | NOBODY'S WATCHING |
| LL332 | Living Lessons | Give Me This Mountain — Strength Kept for the Second Half | Your Greatest Years May Still Be Ahead | IT'S NOT TOO LATE |
| LL341 | Living Lessons | Whoso Removeth Stones — When One Small Fault Grounds the Flights | One Small Mistake Can Ground Everything | ONE SMALL FAULT |
| LL340 | Living Lessons | Wisdom Is Profitable to Direct — strategy, value, and the steward who points the resources | Why Wisdom Is Your Greatest Advantage | SHARPEN THE EDGE |
| LL339 | Living Lessons | The Profit of the Earth Is for All — who gains when a company goes public | Who Really Gets Rich When a Company Goes Public? | WHO GETS RICH? |
| LL334 | Living Lessons | This I Recall to My Mind — time, memory, and what Yahweh does with a hard past | How Yahweh Uses Your Painful Past | YOUR PAST HAS PURPOSE |
| LL333 | Living Lessons | Heavenly Cheat Codes: Life His Way — it is not cheating; it only looks like it because of all the winning | The Advantage of Living Yahweh's Way | IT ONLY LOOKS LIKE CHEATING |
| LL331 | Living Lessons | It Doth Not Yet Appear What We Shall Be — how we were made, what was lost, and what Jesus restores | You Were Created for More Than You Can See | BETTER THAN EDEN |
| SOV101 | A.I. The Way | A little leaven leaveneth the whole lump - a flaw in a shared runtime, and the watchman who finds every place it lives | How One Hidden Flaw Spreads Through Everything | ONE FLAW. EVERYWHERE. |
| BC2 | Serve the House | The camera and the image — Chris’s 4K eye | Where Every Broadcast Picture Is Born | IT STARTS AT THE LENS |
| LIL2 | The Word & The Way | Count the Days — Numbers 1 to 7 from Creation | Count the Seven Days of Creation | COUNT TO SEVEN |
| MAT2 | Mathematics | Adding and Taking Away — Loaves, Fishes, Baskets and Gideon’s Army | The Math Hidden Inside the Miracles | 5 + 2 = 7 |
| RTO2 | Business | What Rent to Own Actually Is — The Model, and the Just Weight Laid Beside It | What Rent-to-Own Really Costs | 2 TO 3 TIMES RETAIL |
| DEV2 | Development | Name the Real Record and the Real Screen — The Trace That Runs Before Any Code | Before You Code, Find the Real Data | TRACE IT FIRST |
| PM2 | Project Management | Who should work, and who should not — the span of control, set by a father-in-law | Why Doing It All Yourself Is Not Good | YOU CAN'T DO IT ALONE |
| SUCC2 | Kingdom Life & Stewardship | Read before you rule — learn on the real books | Learn to Read the Money Before You Run It | READ, DON'T WRECK |
| BUY2 | Real Estate | Two sets of weights in one bag | The Double Standard Hiding in a Bad Deal | TWO SETS OF WEIGHTS |
| STK2 | Stock Market | When you buy a share, the company gets nothing — where shares actually come from | When You Buy a Stock, Where Does Your Money Go? | THE COMPANY GETS NOTHING |
| HIST2 | History | The fatherless, the widow and the stranger | The Real Measure of a Nation | THE TRUE MEASURE |
| EA (Torah) | The Eternal Algorithms | Hearken → Blessings Overtake You | When Blessing Overtakes You | HEARKEN FIRST |

Each was written after reading the lesson's big idea and opening text. Spec examples that said "God" were changed to "Yahweh" per the repository's binding rule for our authored voice.

---

## 4. Images — provider, cost, timing

### Canva

The connected Canva account has **no brand kits**, shows only three storybook designs, and returned **"You have exceeded your credit quota"** on a single image. Canva's tools do not expose the account name, so the connected account can't be confirmed as The Love Corner's Premium account (it does not look like it). Canva's own help says AI generation through a connected assistant draws on the same per-seat monthly AI allowance, with no fixed image count, so it cannot be budgeted for 994 images. To switch accounts: claude.ai → Settings → Connectors → disconnect Canva → reconnect while signed in to The Love Corner's Canva account.

### Image providers (994 lessons, one primary image each, plus regeneration)

Regeneration allowance assumed at 25% (about 250 extra images). Total images ≈ 1,245.

| Provider / model | Price per image | 994 only | With 25% regeneration | Notes |
|---|---:|---:|---:|---|
| **FLUX 1.1 [pro] Ultra** (Black Forest Labs) | $0.06 | $59.64 | **$74.70** | Up to 4 MP, photoreal "raw" mode. **Recommended.** |
| FLUX 1.1 [pro] | $0.04 | $39.76 | $49.80 | Lower resolution, cheaper fallback. |
| Ideogram 3.0 Quality | $0.09 | $89.46 | $112.05 | Strong typography, which we don't need (we set the text ourselves). |
| OpenAI GPT Image 1.5, high, 1536×1024 | $0.20 | $198.80 | $249.00 | Excellent prompt-following; over budget. |
| OpenAI GPT Image 1 mini, high, 1536×1024 | $0.052 | $51.69 | $64.74 | Cheaper; quality would need checking in the pilot. |
| Google Imagen 4 Ultra | $0.06 | $59.64 | $74.70 | Reported deprecated or shut down on the Gemini API in 2026; Google points to its Gemini-native image models instead. Not recommended. |
| Local on the NAS GPU (FLUX.1 [dev] / schnell) | $0 cash | — | — | FLUX.1 [dev] weights are **non-commercial**. schnell is Apache-2.0 but visibly lower quality. Slow on consumer GPUs. Not recommended for this standard. |

### Titles, headlines, descriptions, image prompts (LLM)

About 8,000 input + 600 output tokens per lesson, ×1.3 for retries.

| Model | Price (input / output per million tokens) | Estimated total | With Batch API (−50%) |
|---|---|---:|---:|
| **Claude Sonnet 5.5** | $2 / $10 | ~$28 | **~$14** (recommended for judgment and theology care) |
| Claude Haiku 5.5 | $0.10 / $0.50 | ~$1.50 | ~$0.75 |
| Local model on the NAS | $0 | $0 | — (quality unproven) |

### Recommended plan within the $100 ceiling (from the pipeline's own `estimate`)

| Item | Cost |
|---|---:|
| Pilot: 20 lessons, titles + images incl. ~30% regeneration (26 images) | **$1.78** ($1.56 images + $0.22 text) |
| Full library: 994 lessons, titles (Claude Haiku 5.5) | **$10.94** |
| Full library: 1,293 images incl. ~30% regeneration (FLUX 1.1 [pro] Ultra) | **$77.58** |
| Composition, derivatives, duplicate checks | $0 (local) |
| **Total, whole library** | **≈ $88.52**, enforced by `--budget-cents` hard stops. The $100 ceiling leaves about $11 of headroom. |

Title quality check: the pilot's machine-written titles (Haiku) are compared against the 20 hand-written titles in `presentation-seed.json`. Sonnet 5.5 would cost about $28 at standard rates (about $14 with the Batch API, which the pipeline does not use yet). That would push the total past $100, so it is reserved for titles flagged in review.

**Time:** images take about 10 s each. At 6 concurrent jobs and 30 per minute, 1,293 images run in about 45 minutes. Text runs about 20–30 minutes at 4 concurrent jobs. Compose takes about 4.5 s per lesson. **The full library is ready for review in roughly 1.5–2 hours unattended. The pilot takes about 5 minutes.**

### Setting up the image account and authorizing the pilot (secure steps)

1. Go to **dashboard.bfl.ai**, register with The Love Corner's business email, and confirm the email.
2. Under Billing, buy **only $10 of credits** for the pilot (1 credit = $0.01; the pilot needs about $1.56 of images). Do not turn on auto top-up. Credits are prepaid, so the most that can ever be spent is what you load.
3. Under API Keys, choose **Add Key** and name it `love-corner-learn-pilot`.
4. Store the key **only** as a secret, never in code, chat, email or the app:
   - GitHub → repo → Settings → Secrets and variables → Actions → New repository secret: `BFL_API_KEY`.
   - For the title step, the same for `ANTHROPIC_API_KEY` (console.anthropic.com → API Keys, with a monthly spend limit set on that workspace).
5. In the repo's Settings → Secrets and variables → Actions → **Variables**, add `LEARN_PRESENTATION_AUTOPREP` = `on` (this is the on/off switch; delete it or set it to `off` to stop all automatic runs).
6. Tell me "approve the pilot". After this branch is merged, the pilot runs from Actions → "Learn presentation — prepare new lessons" → Run workflow, with `only` = `seed` and `budget_cents` = `500` (a $5 hard stop). Results arrive as a downloadable review package, all in `review` status.
7. After approving the pilot, top up to the full-library amount (about $90) and authorize the full run.
8. When finished, rotate the key: delete the pilot key and create a long-lived key used only by the automated workflow.

---

## 5. What is NOT done, and why

| Item | Status |
|---|---|
| 20 real cinematic thumbnails | **Blocked on approval and funding** (Canva quota exhausted; Picsart 5 credits). The pipeline and compositor are ready; the images render the moment the pilot is authorized. Screenshots show the labeled "Image pending" stand-in, which is not the final design. |
| Migration `0343` | Written and parsed (31 statements). **Not applied.** |
| Admin review dashboard UI | Data layer, history and statuses are designed in `0343`. The screen is a Phase 3/4 item. |
| "My Saved Lessons" | Learn has no save-for-later feature today (bookmarks are reading positions), so none is invented. |
| Personal Growth / Family & Relationships shelves | No department or course carries those categories, so they are not invented. |
| Featured lesson admin control | Featured is a field on the record today; a toggle comes with the dashboard. |

## 6. Open decisions for the owner

1. Approve the prototype layout and the dark cinematic theme. The Studio is dark by design; the app's theme settings still govern every other screen.
2. Approve or edit the 20 display titles and headlines above.
3. Approve FLUX 1.1 [pro] Ultra and the $100 ceiling, then authorize the pilot.
4. Approve applying migration `0343`.

---

## 7. The automated pipeline (ready for the pilot)

| Piece | Where | What it does |
|---|---|---|
| Pipeline CLI | `app/scripts/learn-presentation/` | `estimate`, `text`, `images`, `compose`, `status`, `export`, `retry-failed`. Provider adapters: text (Anthropic, local OpenAI-compatible); images (BFL FLUX, OpenAI, Gemini, ComfyUI on the NAS). Token-bucket rate limits, concurrency pool, exponential backoff with jitter, a timeout on every call, a hard budget cap, and a JSON-lines ledger with leases and idempotency keys (batch + lesson + kind + content hash). Resumes after interruption; never pays twice. |
| Compositor | `app/scripts/learn-thumbs/` | Text-free master → AVIF/WebP at 1920/1280/640/320, a blurred placeholder, and a 1280×720 share thumbnail with the headline set in Anton (white over gold, matching the app). 64-bit perceptual hash for near-duplicate detection. Atomic writes. `sharp` is pinned in its own package so it never enters the app bundle. |
| New-lesson automation | `.github/workflows/learn-presentation-prepare.yml` | Runs when a lesson file lands on `main` (or on demand). Checks integrity before and after, processes only lessons without a record (or whose content changed), and uploads a review package. Three brakes: a per-run spend cap, one run at a time, and an OFF switch (`vars.LEARN_PRESENTATION_AUTOPREP`). **Inert until the switch is turned on and the secrets exist.** |
| App | `LearnStudio.jsx` | Serves AVIF with a WebP fallback and the blurred placeholder; falls back to the labeled stand-in when an image is missing. |

Language choice: the repository runs its build-time tooling as `.mjs` scripts on GitHub Actions (`scripts/*.mjs`, more than 40 workflows), and the lessons themselves are JavaScript modules. The pipeline follows that pattern. CLAUDE.md's Python direction governs NAS runtime services; this pipeline is not one. No rewrite, no new runtime service.

Verified end to end with no network: synthetic master → `compose` (8 derivatives, placeholder, share image) → `export` (a `review` record carrying the new title, the untouched original title, and AVIF/WebP sources).

**Remaining before records reach learners** (Phase 3 approvals): apply `0343`; choose image storage (Supabase Storage bucket recommended, since about 1 GB of masters is too heavy for the repo or Cloudflare Pages); build the review dashboard screen. Until then, approval happens on the exported review package.

## 8. Tests

| Suite | Result |
|---|---|
| `learn-integrity-baseline` | 8/8 |
| `learn-studio-presentation` | 11/11 |
| `learn-presentation-pipeline` | 19/19 |
| `learn-thumbs-compose` | 8/8 |

### Regression (existing suites)

| Run | Result |
|---|---|
| Every test file matching learn / lesson / course (458 files, 15,082 tests), one worker | **449 files passed, 0 assertion failures.** 9 files never reported because their test workers were killed for memory ("Worker exited unexpectedly") while the compositor ran alongside. The jsdom `window.scrollTo` notices in the log are stderr warnings, not failures. |
| Every test file that imports `ChurchLearn.jsx` (the only existing app file changed), 116 files | **116 / 116 pass.** 55 in the first run, 60 in chunks of 8, and `course-duration.test.jsx` (whose worker crashed in a chunk) passes 23/23 alone. |
| Crash classification | `course-duration.test.jsx` passes 23/23 **both with and without** this redesign (`git stash` A/B). The crashes are sandbox memory limits (7 GB, one worker), **not regressions**. No unrelated code was changed to make a test pass. |

## 9. One-click pilot

1. Owner approves a **pipeline-only** pull request: `.github/workflows/learn-presentation-prepare.yml`, `app/scripts/learn-presentation/`, `app/scripts/learn-thumbs/`, `app/src/lib/learn-presentation/`, and the four new test files. It includes **no** change to `ChurchLearn.jsx` or `index.css`. Nothing the app loads imports these files, so learners see no change. Merging to `main` still triggers the normal Cloudflare redeploy of an unchanged app.
2. Owner adds the secret `BFL_API_KEY` (and `ANTHROPIC_API_KEY`) and the variable `LEARN_PRESENTATION_AUTOPREP` = `on`.
3. **One click:** Actions → "Learn presentation — prepare new lessons" → Run workflow → `only` = `seed`, `budget_cents` = `500`.
4. About 5 minutes later the run's artifact holds `review-export.json` plus every composed image, already keyed to each lesson ID. Nothing is uploaded or associated by hand.
5. The 20 are loaded into the prototype and screenshotted for approval.
