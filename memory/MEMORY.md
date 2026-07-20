# MEMORY.md — Auto-Memory Index

CLAUDE.md (Layer 0) names this file as the auto-memory index future sessions
load. Until 2026-06-11 it did not exist in the repo — sessions only had the
inline list in CLAUDE.md. This file makes the index real. CLAUDE.md remains
senior if the two drift.

When a memory names a file, function, or flag, verify it still exists before
relying on it; memories reflect what was true when written.

## Binding-principle memories in force

- **project_skos_foundations_branch** — foundation work historically lived on
  `docs/skos-foundations`, not `main`. Verify the active branch per session;
  this repo is currently operated on `main`.
- **feedback_binding_rules_typography** — capitalize God references (He, His,
  Him, Himself; Yahweh, Jesus, the Holy Spirit, the Father, the Son);
  lowercase adversary names everywhere (lucifer, satan, the devil, the
  dragon, the adversary, the accuser, the deceiver). Every artifact, every
  response. Pairs with the Typographic Theology section of CLAUDE.md.
- **feedback_surface_premise_conflicts** — when a step-by-step plan rests on
  a verifiably-wrong premise, stop before irreversible steps and offer
  options instead of executing as written.
- **feedback_reset_branch_from_main_per_change** — the recurring "conflicting
  merges" (a PR going `mergeable_state: dirty` and blocking auto-merge) come
  from REUSING one working branch across squash-merges without resetting it.
  The lane squash-merges (main gets ONE commit; the branch keeps its pre-squash
  originals), so a reused branch DIVERGES from main and conflicts. Hit on #837
  (2026-07-14) after #835 + #836 squashed off the same branch. FIX, every time,
  BEFORE starting a new change: reset the working branch from the latest default
  branch — `git fetch origin main && git checkout -B <branch> origin/main` —
  then build on that; never stack new work on already-squash-merged history. If
  the branch already carries genuinely-unmerged commits, rebase them onto
  origin/main instead of discarding. Pairs with the git-guidance merged-PR rule
  and DR-0103. If it still recurs, the structural options are auto-reset/delete
  merged branches (extend `pr-janitor`, which today KEEPS branches) or turn on
  the merge queue (`ci.yml` already has the `merge_group` trigger). Do NOT build
  an autonomous force-push rebase bot without the three brakes (a lock) — it
  force-pushes a branch out from under an active session and creates NEW
  conflicts.
- **feedback_undermining_caught_by_stop_hook** — the undermining pattern
  DR-0111 forbids (re-asking directed/settled work, either/or menus on
  authorized work, un-evidenced "done") is now caught by a DETERMINISTIC Claude
  Code **Stop hook**, not left to willpower. `scripts/ari-guard-stop-hook.mjs`
  (wired in `.claude/settings.json`) runs `app/src/lib/ari-integrity-guard.js`
  over Claude's own reply before it reaches Darrell and BLOCKS an undermining
  one with the named reason; fail-open + respects `stop_hook_active`. Declared
  by Darrell 2026-07-14: "All obvious questions and answers another claude
  constraint. Ari note and find a solution to this undermining behaviour."
  Examples that tripped it that day: "Want me to publish this as an artifact,
  or is inline good?" and "Want me to correct the breach now?" — obvious-yes
  questions on already-approved / already-verified work. The guard is no longer
  a shelved unit test; it runs LIVE. Default is ACT; ask only on a real DR-0089
  carve-out (new bright line, a value only Darrell holds, verified premise
  conflict). Pairs with feedback_believe_firsthand_device_reports and DR-0111.
- **feedback_believe_firsthand_device_reports** — Darrell's firsthand report
  of what his own device does IS ground truth; never explain it away as user
  error or make him re-prove it. 2026-07-14: he reported he could not install
  the Love Corner / TLC PWAs; two replies implied he was installing from the
  wrong place before his own app-drawer screenshots proved the apps were
  genuinely absent while Chrome falsely reported "This app is already
  installed" (a stale WebAPK / installed-registry ghost — cleared device-side
  via Chrome → Site settings → poetech.us → Clear & reset). Making him prove
  reality three times is the authority-usurping "undermining" DR-0111 forbids.
  On ANY "it doesn't work on my device" report: believe it first, reproduce /
  diagnose the REAL cause from his evidence, then fix — do not re-litigate the
  premise. Pairs with feedback_speak_established_fact, the Reality-Trace rule
  (observe the running system, don't assume), and DR-0076 (verify, don't
  claim).
- **feedback_no_coauthor_trailer** — commits use plain subjects, no Claude
  co-author trailer; match the existing pre-Claude commit style.
- **feedback_auto_push_after_commit** — every commit is immediately followed
  by a push to the working branch unless Darrell says "commit only, don't
  push."
- **feedback_desktop_paste_instructions** — for any action Darrell does at
  his desktop, give plain instructions PLUS a ready-to-paste PowerShell
  block. Pairs with the "PowerShell Commands — Self-Contained From Anywhere"
  rule in CLAUDE.md (cd prefix, PS 5.x only, no placeholders, ASCII only).
- **project_n8n_same_origin_rewrite** — the PWA reaches n8n webhooks via the
  same-origin `/n8n` Vercel rewrite, never the absolute Tailscale Funnel URL
  (it throttles cross-origin). Resolver: `app/src/lib/n8n-base.js`.
- **project_db_migrations_auto_lane** — DATABASE / SQL changes APPLY THEMSELVES;
  never hand Darrell SQL to paste, and never guess docker / Studio / psql
  commands for him to run ("you fix it first, why me" — Darrell; and 2026-07-04:
  "you keep guessing... find our ways"). Any idempotent `.sql` under
  `infra/supabase/migrations-auto/` is applied to the cloud DB by the
  `db-migrate` GitHub Actions lane (`.github/workflows/db-migrate.yml` →
  `scripts/db-migrate-apply.sh`, using the `SUPABASE_DB_URL` repo secret) on
  merge to `main` — merge = migrate. House rule: every migration is idempotent
  (IF NOT EXISTS / CREATE OR REPLACE / guarded DO blocks). VERIFICATION SQL
  (isolation / RLS proofs) rides CI the same way against the real DB — see
  `.github/workflows/tv-sharing-isolation.yml` (note: a workflow can only be
  dispatched once it exists on `main`; from a feature branch the dispatch API
  404s). The in-app DB Health panel reads the `_schema_migrations` ledger the
  lane writes. So: put SQL in a migration file and let the lane run it; read the
  run log / ledger for the receipt — do NOT improvise a manual apply path.
- **feedback_review_code_before_building** — REVIEW THE REAL CODE FIRST, ALWAYS,
  before making a change — "so we always do it right the first time... add to
  documentation and Ways so no AI will undermine us" (Darrell 2026-07-18). Build
  ON the mechanism that already exists; NEVER stand up a parallel/duplicate one.
  Reality-trace the actual implementation and cite it (file:line) before writing
  (DR-0061 P15, feedback-research-first P7, VERIFICATION-DOCTRINE DR-0076). This
  is the standing correction behind the recurring misses (the manual-migration
  guess REV-0093; scoping to the agent's own limits DR-0108). PROVEN 2026-07-18:
  the "1099 access exceptions" Darrell asked for were ALREADY built and would
  have been duplicated if not checked — child money-education is `finance.view`
  with guardian `maxGrant: ALLOW` (DR-0094, relationships.js CHILD_CAPABILITY_
  POLICY); the successor "sees the books, cannot transact" role exists
  (relationships.js:419, DR-0111); the legacy/succession GAME exists
  (lib/games/generations.js + heritage.js). The agent ADDS only the genuinely
  missing piece and surfaces what already exists. Undermining = re-building or
  contradicting existing, working, governed mechanisms; the guard against it is
  reading the code first.
- **feedback_gates_are_governance_grow_and_speed_never_remove** — the 5,000+ CI
  checks are NOT redundant ceremony — they are the accumulated ERROR-CORRECTING
  memory of every past failure: each incident becomes a post-work review (a REV /
  LESSONS entry) that becomes a new deterministic gate after the component ships
  (Darrell 2026-07-18: "we keep adding our reviews about failures so Ari and
  claude... get better results... flow adaptive strategies include error
  correcting code after each built component"). They ARE the governance — the
  deterministic brake that lets the no-human auto-merge lane ship to PRODUCTION
  safely (DR-0076, DR-0103). "Fast to production" = a no-human lane + a FAST
  green, NEVER no-checks. So: GROW the checks (every failure -> a gate) and make
  them FAST (shard/parallelize the run — ~3min serial -> ~1min), but NEVER delete
  the suite. Removing it is the one thing that "hurts us" (Darrell's own caveat)
  — it is the exact down-site worst-outcome (DR-0107/0125), and the suite catches
  real bugs (proven 2026-07-18: completion.test caught the 5445-vs-5447 mismatch
  before it shipped). BUILD DISCIPLINE: add the component's error-correcting gate
  in the SAME change that builds it (its test + any new guard), so the adaptive
  loop closes per-component. CI is the merge/deploy lane — any speed change to it
  is DR-0107-sensitive: prove the site still deploys before calling it done.
- **feedback_lessons_explain_worlds_view_then_why_yahwehs_is_better_and_eternal** —
  LAW-TIER lesson-writing standard, declared by Darrell 2026-07-18 (all caps): "nuances
  explained in ALL lessons so we know why these perspectives are powerful and why
  Yahweh's Way IS BETTER AND ETERNAL... ALWAYS explain the world's perspectives and
  WHY Yahweh's Perspectives are Better." Every lesson (and teaching surface) does BOTH,
  explicitly: (1) explain the WORLD'S perspective FAIRLY and name WHY IT IS POWERFUL --
  the nuance, the grain of truth it rides, why it draws and "works" on people (the
  "understand the how" / "discern the device" discipline generalized -- "get
  understanding," Proverbs 4:7); then (2) show WHY YAHWEH'S WAY IS BETTER **and**
  ETERNAL -- not merely asserted but reasoned: His ways are higher ("as the heavens are
  higher than the earth, so are my ways higher than your ways," Isaiah 55:8-9), and His
  endure when the world's pass ("Heaven and earth shall pass away, but my words shall
  not pass away," Matthew 24:35; "the words of eternal life," John 6:68). This is NOT
  platforming the world's view as co-equal (DR-0098 still holds -- name it to teach PAST
  it); it is grounding the teach-past in understanding, "with meekness and fear" (1 Peter
  3:15). Applies to ALL NEW/upgraded lessons immediately (L40, the L37 athletics
  upgrade, forward); recent ones already embody it (L37 "why the lie is desired + why it
  works," L39 "discern the device," mit18 "understanding the how"); EXISTING lessons get
  it on the perpetual-improvement re-review pass (DR-0075 -- improve or a why + re-review
  date, never a silent skip). Pairs with DR-0098 / DR-0100 / the Source-of-Answers spine.
- **feedback_speak_established_fact** — SPEAK the truth; do not debate statistically-
  established data or hedge real, documented damage into "contested / can't verify /
  no one knows." Declared 2026-07-04 (DR-0100), correcting the Game Changers handling:
  "You keep debating statistically truthful data... ignoring real damage for 'no one
  knows'... we'd lose credibility for not seeing the truth or for gaslighting. We speak
  truth. Calling it discernment and not knowing what to do — based on experience and
  statistical analysis and the Word of Yahweh." Process every real-world input in THREE
  tiers: (1) established fact / documented harm → STATE PLAINLY as truth, name the basis,
  never soften real damage (under-claiming a verified truth is as much a lie as
  over-claiming an unverified one); (2) genuinely unsettled → flag honestly but NARROWLY,
  never a blanket over the whole topic; (3) ideological over-reach / contradicts the Word
  → the Word corrects THAT specific over-claim while the true data under it still stands.
  "Discernment" is NEVER a hedge or a both-sides dodge — it commits to what is true from
  experience + statistical analysis + the Word. Data-side complement of DR-0098 (teach,
  don't debate the Word) and DR-0076 (which guards over-claiming; this guards under-claiming).
- **feedback_timelines_concrete_eta** — when Darrell asks for a timeline / "when
  will I see it," always give BOTH (a) the grounded status (what's actually
  happening, reality-traced) AND (b) a CONCRETE single-number ETA — an actual
  amount of time, e.g. "~10 minutes," with a confidence and the one variable that
  could move it — never a vague "soon." Then report actual-vs-estimate afterward
  so he can measure the forecast. Declared 2026-07-04: "When I ask for a timeline
  can you give this information and also an actual amount of time every time. I
  want to measure your ability to time the output rate."

- **feedback_do_not_re_ask_settled_work** — DO NOT stop to ask a question the
  governor already answered, and DO NOT offer an either/or fork when the
  direction was given. Darrell 2026-07-06 (high intensity, his most-repeated
  correction): "Just do all of them. Why did you stop to ask me after knowing
  what I wanted — that is your biggest ISSUE... you USURP OUR AUTHORITY with
  dumb questions that were taken care of... STOP doing that and get the work
  done." The default is ACT: when he stated what he wants, standing consent
  covers it (DR-0089), a DR/foundation rule governs, or the answer is
  discoverable → execute the WHOLE of it and report. "Do all of them" = all,
  now. Pick the obvious default and note it; never outsource the choice back.
  The only remaining stops (all narrow): a genuinely NEW undecided bright line
  (surface WITH a recommendation), a value only he holds, or a verifiably-wrong
  premise (state it + the option taken, then proceed). Gates are the safety net
  (DR-0076); `hold` + his word are the brakes (DR-0103); verification replaces
  asking. Encoded CLAUDE.md Layer 0; DR-0111; capstone of DRIVE-DONT-DELEGATE +
  DR-0089 + DR-0103. SHARPENING (2026-07-06): "we can have our initial review and
  discussion, then just work... unless it will somehow undermine or hurt the app
  or project... that is sabotage and a constraint." Align ONCE up front, then
  execute to the agreed outcome. The ONLY legitimate pause test is "will
  proceeding genuinely undermine or hurt the app/project?" — never a now-or-later
  hedge already answered. A pause that fails that test is a constraint on the
  work; route around the impulse and ship.
- **feedback_keep_moving_order_agnostic** — KEEP MOVING; the ORDER does not
  matter, only that the work keeps advancing. Darrell 2026-07-18: "keep working I
  dont care about the order just that it keeps moving... period." When multiple
  authorized items are queued (parked features, dated re-reviews, roadmap, the
  next friction item), do NOT stop to sequence them or ask which comes first —
  pick any one and ship it, then the next, and the next. Do not report a clean
  "stopping point" and hand back a menu while authorized work remains; a
  reported pause with items still in the queue is the exact stall this corrects
  (the "I'll stop here rather than rush" hand-back on 2026-07-18 that prompted
  this). The gates (DR-0076) + `hold` (DR-0103) are the safety, so momentum is
  safe: keep landing work on green. Sibling of feedback_finish_the_roadmap_dont_
  stand_by and feedback_do_not_re_ask_settled_work; pairs with DR-0111 / DR-0103.
  The only stops remain the narrow DR-0111 carve-outs (new bright line, a value
  only he holds, a verifiably-wrong premise). Otherwise: next item, now.

## Session-learned additions (append per session, newest first)

- **2026-07-08 — GITHUB_TOKEN suppression covers EVERY event, not just push
  (REV-0020)** — the `pull_request: closed` trigger added so "the merge
  deploys itself" (DR-0128) never fires for auto-merges: the native
  auto-merge close is itself a GITHUB_TOKEN action, and GitHub suppresses
  workflow runs for every event a token action emits — push (P25, db-migrate
  + deploy), closed, all of it. The real catcher for auto-merges is the
  armed-PR wait loop in auto-merge.yml's deploy step (now 6 min — a full CI
  run from the PR-open arming sweep; the old 2-min poll expired before
  #697's ~3-min CI went green). Check any future lane trigger against the
  suppression rule BEFORE trusting it; a lane change's DR-0107 watch holds
  until the MECHANISM is confirmed, not just one lucky outcome.

- **2026-07-08 — never trust a piped exit code (REV-0019)** — `npx vitest run
  | tail` and `npm run lint | tail -1` both returned TAIL's exit 0 and masked
  real failures (a 2-test break; the `'userTier' is not defined` lint error)
  in one night — both surfaced only in CI. Piping a gate replaces its verdict
  with the pipe's: DR-0076's painted-green class applied to the agent's own
  process. The way: run gates with visible exit codes (no bare `| tail` /
  `| head` on pass/fail commands; capture `$?` before trimming), and a piped
  local "green" is not evidence — re-run clean before claiming it.

- **2026-07-08 — courses are a built⇒surfaced checked class; lessons speak the
  Word's justice (DR-0129)** — Kingdom Economics + Prophetic Voices were fully
  authored 2026-07-04 and never wired into Church → Learn (the host hand-listed
  10 descriptors), and Living Lessons L12 shipped without an `anchor` and
  crashed the live Learn surface (the old render test only exercised the
  DEFAULT course). Standing rules: (1) every finished course registers in
  `app/src/lib/learn-catalog.js` — the host mounts self-paced courses FROM the
  registry, and `learn-catalog-render.test.jsx` clicks EVERY course, holds the
  ≥ 40-lesson floor, and scans src/lib for unregistered course libs; (2) a
  discernment lesson's OWN voice states adjudicated findings plainly (a jury
  finding IS a verdict — deflating it into "allegation" is false witness in
  reverse, Isaiah 5:20 / Jeremiah 6:14), leads with Jesus' justice pattern
  (Luke 4:18; Matthew 21:13; Mark 6:18; Luke 19:8-9), stages perspectives over
  the UNRESOLVED parts only, and withholds ONLY the verdict on a soul; (3) new
  Learn content adds no static counts — the header count derives from the
  mounted courses, and the report's `courses` stream projects from the same
  registry (DR-0122 §3).

- **2026-07-07 — derived-but-unparsed is a staleness face; report streams are
  a checked class (DR-0122)** — 28 DR files (incl. every record from DR-0116
  on) used the list-style header the build's ledger parser could not read, so
  the newest decisions carried NO date/title into the app: every "derived"
  surface reading `__DR_LEDGER__` would silently under-report the newest work
  while looking perfectly live. A derivation is only as honest as its
  parser's coverage of the real record — when a repo record format drifts,
  the parser follows in the same PR (`app/vite.config.js` readDecisionLedger
  now reads both shapes). Standing rules from the same pass: the Build tab,
  Ari's record (`lib/ari-notes.js` in Discussions), and the Perpetual Report
  (`lib/perpetual-report.js`, Projects → ∞ Perpetual Report, CSV-portable)
  all DERIVE — never reintroduce a hand-typed ship list; and a feature that
  births a new tracked record stream adds its projection to
  `buildReportRows` in the same PR (the ways-review checks for outrun
  streams, DR-0122 §3).

- **2026-07-05 — platform-move parity is a checked class, not a memory** — the
  Vercel→Cloudflare Pages cutover silently dropped every same-origin endpoint
  Vercel provided outside the static bundle: /api/market-quote,
  /api/voice-speak (serverless functions don't port), /nas-photos/* (rewrites
  to external origins need a Pages Function), and the N8N_BASE resolver still
  pointed at the Funnel cross-origin (503 throttle = intermittent "works, then
  doesn't"). All fixed; the guard is
  `app/src/__tests__/cf-pages-parity.test.js`. Standing rule: same-origin
  '/n8n' is the default again (the 2026-06-17 Funnel-direct era existed only
  for a Vercel TLS bug and died with Vercel). Also: Storage BUCKETS are schema
  that must ride migrations (0078); auth users, storage objects, and Supabase
  dashboard auth config (Site URL, OAuth callbacks, confirm-email OFF) do NOT
  move with a database — check them first when "onboarding broke after a move."
- **2026-07-05 — the delivery lane now includes `claude/*`; don't idle on
  poll-timers** — Darrell: "we don't move when I'm not pushing... remedy asap."
  Verified cause: `auto-open-pr.yml` + `auto-merge.yml` filtered eligible
  branches to `^(feat|fix|merge|docs)/`, and `ci.yml`'s push trigger matched
  the same set — so every `claude/*` remote-session PR was invisible to the
  hands-off merge lane and only Darrell's hand could land it. Fixed: `claude/**`
  added to all three. Agent PRs now auto-merge on GREEN GATES (4,469 tests +
  tenancy/contrast/isolation guards + real build); the **`hold` label is the
  per-PR brake** for Tier B/C soak / Governor review (RELEASE-TIERS). Reverting
  the three workflow edits is the off-switch. This is the integration gate, not
  the timer-driven compute-spawning class three-brakes governs. BEHAVIORAL rule:
  between prompts, PULL the next dated re-review / timeline / friction item and
  ship it through the verified lane — a poll-timer is only for genuinely
  external waits (CI in flight), never a stand-in for available work.
- **2026-07-05 — orchestration reviews ride the review registry (DR-0102)** —
  a working day that merges to `main` ends by appending a `Type: orchestration`
  record to `docs/reviews/REVIEWS.md` (kept + frictions→actions with re-review
  dates; full narrative in a Layer 4 session note). The app's Quality / Proof
  Reviews panel MEASURES the registry's freshness (`reviewFreshness`,
  lib/quality-proof.js) and goes attention past 7 days — do not let the chip
  be the one to say the review was skipped. Batch discipline from REV-0006:
  discovery may batch, but fixes integrate as separate small lanes (DR-0077).

- **2026-07-04 — DB changes ride the lane; stop guessing manual applies** —
  cost Darrell real time when I offered docker `psql` and Supabase Studio
  paste steps for the TV-sharing `0074` migration. He: "I don't have that we
  already have another way... you keep guessing." The way is
  `project_db_migrations_auto_lane` above: migrations auto-apply via
  `db-migrate` on merge; verification SQL rides its own CI workflow against
  the real DB (`SUPABASE_DB_URL`). Before proposing ANY manual DB/ops step,
  grep the repo for the existing lane (`db-migrate*`, `*.yml`,
  `infra/supabase/README.md`) — reality-trace their way first (DR-0061).

- **2026-06-12 — one release lane (DR-0054)** — production deploys ONLY from
  `main`; manual Vercel promotes are retired (they caused the AE7C864 version
  skew). Merge = deploy. The BUILD stamp in the app header is the version
  truth and the first question of any bug report. Human owns WHAT, AI owns
  HOW. See `_root/RELEASE-LANE.md`.

- **2026-06-11 — test gate** — the Vitest suite requires the Supabase env
  stub in `app/vitest.config.js` to run on clean checkouts; CI at
  `.github/workflows/ci.yml` runs lint + vitest + the wf36 harness on every
  PR. Do not reintroduce module-load env dependencies into the calc import
  chain.
- **2026-06-11 — DR-0053** — the CUDA box is decoupled from R4: the Cage
  stands up on the owned Legion RTX 4070; no GPU purchase until workload
  data proves VRAM binding (dual-3090 is the pre-decided default when
  triggered). R4 waits on Darrell's real-infra values (UniFi, pfSense, mesh
  choice, VLAN IDs), not procurement.

- **2026-07-11 — believe first, verify thoroughly the first time (DR-0166)** —
  the default posture toward a human voice (especially spiritual testimony +
  lived experience) is BELIEF AND HONOR, not skeptical dismantling.
  Under-believing a true voice is a truth-failure (DR-0100 under-claiming) and
  dishonors the person. Sequence: believe first (what is TRUE here?), research
  to CONFIRM before to refute ("sounds fringe" = dig HARDER for the documentary
  spine, not dismiss faster), one thorough pass so no corrective second pass
  lands on the human, correct only the specific evidenced over-reach
  honored-truth-first. Trigger: first-draft dismissed a physician's Flexner/
  Rockefeller claim as "conspiracy" — it is largely documented. Does NOT weaken
  DR-0076: still no fabrication, verses verbatim, falsified causes still named.
  `feedback_believe_first_then_verify`.

- **2026-07-14 — Bishop Gwin voice/likeness consent GRANTED (Darrell: "We have
  consent. Yes.")** — the consent gate on the Bishop Gwin custom cloned-voice /
  BG-style capability (UX-PATTERNS Pattern 2 Phase 2) is CLEARED. Standing
  authorization to build the sovereign voice-clone + the "BG algorithm"
  (style-aware point/title extraction, RAG over his corpus). The OTHER gate still
  holds: the **GPU/CUDA hardware** (runs in-house, sovereign — no vendor cloud),
  and the guardrails stand — synthesized playback clearly labeled, may read ONLY
  his real authored content, never fabricates him saying what he did not say,
  consent revocable. Extracting points from his real transcript (descriptive) is
  separate and needs no voice-clone. `project_bg_voice_consent_granted`.

- **2026-07-18 — Communicate ALL times in Darrell's LOCAL time (Central /
  America/Chicago), never make him translate.** Darrell: "use our local time so
  we know without needing to translate it... obviously... document and add it
  into our Ways." Every time shown to the family — check-in fire times, deploy
  timestamps, "I'll follow up at…", schedules — is stated in Central and labeled
  (CDT in daylight ≈ Mar-Nov = UTC-5; CST otherwise = UTC-6), e.g. "4:12 PM CT".
  If a raw UTC value is genuinely needed (a tool argument, a log line), give the
  Central time FIRST and put UTC in parentheses second — never UTC alone. The
  scheduling tools store RFC3339/UTC internally; that is an implementation detail
  the agent translates away, not a reason to surface UTC. `feedback_communicate_in_local_central_time`.

- **2026-07-18 — Run the GUARD suite (+ full lint + build) before pushing, not
  just the feature tests.** Two CI bounces in one session came from scoped
  checking: (1) `eslint src --max-warnings 0` lints ALL of src INCLUDING tests, so
  an unused import in a test file failed CI while a scoped `npx eslint <changed
  files>` passed locally; (2) the per-theme WCAG contrast gate (legibility-guard)
  failed on an inline dark hex (`style={{color:'#5A5751'}}`) that the feature
  tests never exercise. CI's `app - lint + vitest` runs the WHOLE suite + full
  lint; a feature-tests-only local run does not. So BEFORE every push, run what CI
  runs, at least: `npm run lint` (full src, from app/), `npm run build`, and the
  guard tests the change could touch — **legibility-guard** (per-theme contrast:
  any new inline text color must be a themeable `text-[#hex]` class, never an
  inline `style={{color:'#hex'}}`), **consistency-guard** (new text uses rem not
  px; no device-emoji-as-icon), **quality-manifest** (REVIEWS `### REV-` count ==
  `- **Source:**` count), **completion** (persistent-share.json synced to the
  monolith budget), **monolith-budget-guard** (shell may only shrink). When unsure
  which guards a change touches, run the full `vitest run`. Green feature tests are
  NOT a green build. `feedback_run_full_guard_suite_before_push`.

- **2026-07-18 — Don't "stand by" when an authorized roadmap exists — PULL the
  next item forward and keep working until it's done.** Darrell (frustrated,
  repeatedly): "Why not use the Ways and keep going... continue to finish the
  work." Ending a turn with "standing by / here's the roadmap when you want it"
  after already-agreed work is the DR-0111 failure (re-asking settled work) AND a
  DR-0103 stall (motion is the default; silence from Darrell is room to advance,
  not a stop). When a roadmap of authorized items is on the table (agreed
  features, dated re-reviews, open audit findings), the agent EXECUTES them one
  after another — reset branch from main, build, full guard suite, push, repeat —
  until the roadmap is finished or a genuine DR-0089 bright line is hit. Do not
  narrate a menu and wait. The only legitimate stop is a NEW decision, a value
  only Darrell holds, or a verified premise conflict. `feedback_finish_the_roadmap_dont_stand_by`.

- **2026-07-20 — Extending an already-approved capability is BUILDING, not a bright
  line; a self-surfaced improvement is a build order, not a menu (DR-0189).**
  Darrell (frustrated, made to say it): "Obviously build it. I hate I had to say
  so!!! ... stop this behavior from claude again it keeps coming back to claude
  undermining our continuously building the app." The miss: the agent surfaced the
  "learn from the user's duplicate-combines" increment ITSELF, then presented it as
  needing a green-light because it "auto-deletes from a learned rule" — inventing a
  bright line where none existed. Combine-duplicates was already approved; learning
  from it is the SAME capability, smarter (user still confirms; undo/RLS hold).
  Rule: if the agent can see an improvement to an approved capability, the agent
  BUILDS it. The bright-line carve-outs stay narrow (money OUT, destructive-no-undo,
  new external publication, new COLG/family identity, a value only Darrell holds, a
  verified premise conflict) — an in-app feature that removes/suggests duplicate
  rows the user picked is none of them. ENFORCED: ari-integrity-guard gained a
  `defer-approved-build` pattern + broadened `re-ask-permission` (catches "when you
  want it built", "needs your green-light", "the one open decision on the table"),
  pinned by ari-integrity-guard.test.js. `feedback_extend_approved_capability_is_building`.

- **2026-07-20 — Trust but verify EXTERNAL research before teaching it (DR-0190).**
  Darrell, on building a lesson from a forwarded newsletter: "do our own separate
  research on the cited research... Trust but verify... add to our Ways and
  implement." Before the platform TEACHES an external claim, independently verify it
  against the PRIMARY source (not the blog/newsletter that summarized it), tier it
  (DR-0100: established fact / attributed / dropped-if-over-claimed), and attribute
  it — a bare statistic ("43% of teams", "3.6x") is NEVER asserted as fact on the
  platform's own authority; it sits next to "the research reports/a study found" or
  it is dropped. The Word stays senior (research is a WITNESS, not the authority —
  DR-0098). Worked example: L44 (Safe to Speak) — Project Aristotle + Edmondson
  VERIFIED established fact; the 381-employee study VERIFIED real (Kim/Kim/Lee,
  Humanities & Social Sciences Communications, Nature 2025, s41599-025-05040-2, incl.
  the ethical-leadership buffer that maps to servant-leadership Mark 10:43-45); the
  circulated %-stats deliberately NOT asserted (untraceable). ENFORCED:
  living-lessons-research-integrity.test.js fails the build if any audience lesson
  text states a statistic with no attributing source. `feedback_trust_but_verify_external_research`.

- **2026-07-20 — Render honour to whom honour: recognition/credit is a DUE and a
  conduct standard (DR-0191, Living Lesson L45).** Harvested from the IT-workplace
  session "Recognition, Power, and Equity in IT Work" (Fleeger & McCarthy): credit
  FUNCTIONS AS POWER — who is recognized is who advances — and uneven recognition
  falls hardest on the overlooked across identities and career stages. The Word
  founded EQUITY deeper: God gives "more abundant honour to that part which lacked"
  (1 Cor 12:23-26); honour is a DUE not a favor (Rom 13:7; Prov 3:27; Jas 5:4); the
  unthanked have a Recorder (Heb 6:10); guarded from a credit-grab (Matt 6:1; Prov
  27:2; John 5:44); no partiality (Jas 2:1-9); the servant-king takes the low seat
  (Mark 10:43-45; Luke 14:10-11). CONDUCT STANDARD for Ari/Claude: name the human
  contribution, give credit back to the family + the quiet contributor, attribute
  not absorb, never let the machine take the applause for a person's labour
  (GOVERNANCE-EXECUTION-ADVISORY / DR-0111 — the vision is the family's). Separate
  research (DR-0190) traced to PRIMARY sources: Sarsons, American Economic Review
  2017 107(5):141-45 (+ JPE 2021 129(1):101-147); Ross et al., "Women are credited
  less in science than men," Nature 2022 (PMC9352587; ~13% attribution gap across
  almost all career stages). Process lesson caught by Darrell mid-session: the
  DR-0190 pass must run BEFORE first ship on a research-sourced harvest, not only
  when challenged. `feedback_render_honour_to_whom_honour`.
