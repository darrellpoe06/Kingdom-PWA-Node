# Why the app doesn't feel self-healing — the comprehensive review, and the 335-video gap that proves it

> Layer 4 working artifact. Companion to **DR-0135** (the self-healing program), **DR-0136** (the giving channels), and REV-0026/REV-0027. Triggers, Darrell 2026-07-10: *"Why doesn't the PoeTech App seem like it's self-healing yet? Can you do a comprehensive review of what could make that come to pass... What's not working well in our skills based on the outcomes of our orchestration?... I could take pictures of the choir lists not having all 335 videos inside any of the tabs — we already requested repeatedly."*

## Part 1 — The 335-video gap, diagnosed with evidence (the type specimen)

- **The fact:** migration `0013-colg-sermon-backfill.sql` inserts exactly **125 rows** (`grep -c INSERT` = 125). Its own header records the drop: *"125 of 335 videos carried a parseable date; the rest are undated clips/special events and are left for manual entry."*
- **The mechanism:** one line in the generator — `rows.filter((r) => r.serviceDate)` — dropped every undated video from the SQL. The schema never required it (`service_date` is nullable); the parser always returns a service type. Nothing forced the loss.
- **Why no tab could ever show 335:** the 210 undated videos have NO path into the corpus today — the historical generator dropped them, and the CI channel-sync reads only the RSS feed (newest ~15 uploads). "Manual entry" was the recorded plan, tracked nowhere.
- **Why nobody was told:** the debt lived only inside the migration's own comment. No instrument compared *what the channel has* against *what the app holds*. Every tab told the truth about a corpus that was never whole — and the family photographed what the instruments never measured.
- **A second latent defect found while tracing:** the title parser treated an apostrophe as a quote delimiter, truncating real message titles — rows shipped in 0013 as `'I'` and `'YOU CAN'`. Fixed; regression-pinned.

**The heal shipped (DR-0135 §2):** the generator now emits ALL channel videos (undated insert with NULL dates, labeled undated in-app — DR-0124's rule) and writes a committed **corpus manifest**; `lib/corpus-coverage.js` + a **wholeness strip on the Harvest Ledger** measure live rows against the manifest (amber until whole; an ungenerated manifest NEVER reads as coverage); and **`corpus-reconcile.yml`** is the dispatch-only actuator — it lists the full channel on a runner, applies the idempotent full backfill over the same DB secret the migrate lane holds, and pushes the manifest through the gated lane. **One dispatch of that workflow closes the 210-video gap.**

## Part 2 — Why the app doesn't FEEL self-healing (the measured answer)

The inventory (every mechanism read and verified):

- **ACTIVE, shell-plane:** chunk-reload heal, boot-fallback, the outside-in site-health probe (up + intact + fresh, heals stale builds, files incidents), deploy-freshness, the auto-merge deploy hand-off. The front door genuinely heals itself.
- **DETECT-ONLY, data-plane:** loop-health, db-health, harvest-stall, photo-source-health, NetworkStatus — every one detects and then **waits for a human to act**. The transcript-backfill workflow's schedule ships commented out (by design, three brakes). The error journal never leaves the device.
- **INERT by design:** the GPU scheduler and the orchestrator (the intended tending actuators) are kill-switched per the three-brakes law — correct for safety, but it means the loops watch honestly and then stall.
- **The blind spots with NO probe at all:** a failed/RLS-denied read renders identically to genuinely-empty (the single highest-leverage missing primitive); partial backfills (this gap); un-applied migrations announce nothing; stale derived artifacts; anything that only shows on another family member's device.
- **PERPETUAL-PIPELINE-HEALTH's 13 rules:** ~3 real in some form, 2 partial, ~8 aspirational or obsolete (they governed the n8n stack DR-0132 moved off the critical path).

**What makes self-healing come to pass (DR-0135 §1):** the standard is **probe → in-app derived readout → actuator → announce** for every failure class. A detector without an actuator is a named debt with a re-review date. Routed with dates: the read-outcome envelope (2026-07-24), the announce path and the data-plane probe and detector actuators (2026-07-31), cross-device aggregation (2026-08-14), arming the transcript schedule watched, Tier C (2026-07-24).

## Part 3 — What's not working in the skills (from the orchestration record)

The full record (25 REVs, LESSONS P15–P31, the delay and unnecessary-ask ledgers) says:

1. **Output failures got gates and stopped recurring; process failures did not.** The recurring classes are: **built-but-never-surfaced** (Learn catalog — "my 1000th time requesting"; sideways tabs stalled at 8 of 39; this corpus gap), **claimed-but-not-verified-in-the-failure-mode** (piped exit codes masking red, twice in one night; a backfill that exited 0 while fetching 0/135), **parking and re-asking** (a 6.4-hour wall-clock park on authorized work; "watch or hold?" after agreed work), and **the agent scoping to its own reach** (ConnectBot — the team's path existed the whole time).
2. **Why directives need repeating, located precisely:** they get lost at *capture* (written where they can't be tracked — a code comment is not a backlog), at *survival* (context compaction), or at *application* (a principle with no end-of-turn checkpoint reverts under pressure). The one directive that stopped needing repeats — "update Ways/docs/Ari when features land" — is the one that became **derived-by-construction**.
3. **The method changes the evidence supports** (now standing per DR-0135 §4): every "all X" directive becomes a tracked backlog with per-item coverage AT DECLARATION; the built-⇒-surfaced registry gate extends to every registry; no bare piped exit codes on commands whose pass/fail gates anything; verification applies to the agent's own process, not just the product; and the un-gate-able classes stay measured in their ledgers with the counts treated as KPIs.

## Also shipped this session (same push)

- **DR-0136** — the church's four real giving channels (Zelle to the church's own domain email, Cash App $TheLoveCorner, Givelify, PayPal), decoded verbatim from the church's own GIVE ONLINE slide, now one tap from the bottom-right Give floater with plain-words instructions and scannable QRs; provenance pinned by tests. The Call-to-Give archive (DR-0134) renders in the same panel.
- **DR-0134** — the Call to Give sourced from the same corpus + transcripts, with the honest transcript answer and measured coverage.

Ari's record reflects all of it by construction — DR-0134/0135/0136 land in his derived notes on this build, and the call-to-give + self-healing standing duties resolve live against the ledger.
