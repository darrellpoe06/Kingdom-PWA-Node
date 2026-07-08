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

## Session-learned additions (append per session, newest first)

- **2026-07-08 — never trust a piped exit code (REV-0019)** — `npx vitest run
  | tail` and `npm run lint | tail -1` both returned TAIL's exit 0 and masked
  real failures (a 2-test break; the `'userTier' is not defined` lint error)
  in one night — both surfaced only in CI. Piping a gate replaces its verdict
  with the pipe's: DR-0076's painted-green class applied to the agent's own
  process. The way: run gates with visible exit codes (no bare `| tail` /
  `| head` on pass/fail commands; capture `$?` before trimming), and a piped
  local "green" is not evidence — re-run clean before claiming it.

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
