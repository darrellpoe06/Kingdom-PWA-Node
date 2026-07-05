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
- **feedback_console_checklist_complete** — when Darrell is AT a console
  (Cloudflare, GitHub, Vercel, PowerShell) and asks "anything else?", give
  EVERY remaining step that console performs, ordered, each tagged
  REQUIRED-now vs deferrable — and never tag a step deferrable/optional
  unless the fallback it relies on is VERIFIED (DR-0076). His console trip
  is the scarcest resource in the loop. (2026-07-05, "I was just in
  there!!!?" — the poetech.us domain click was called optional while Vercel
  was silently cap-frozen; LESSONS-LEARNED P24.)
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

## Session-learned additions (append per session, newest first)

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
