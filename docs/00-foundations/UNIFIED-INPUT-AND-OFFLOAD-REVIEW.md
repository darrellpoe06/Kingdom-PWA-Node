# Unified Input, PoeTech-as-Cockpit, and Offload-the-Vendor-LLM — Research Review

**Date:** 2026-06-17
**Author:** Claude Code (advisory; Darrell governs, Foundation executes — GOVERNANCE-EXECUTION-ADVISORY)
**Posture:** Review-first (binding rule). This document does NOT build the big pieces. It maps opportunity, constraint, and a real timeline for each of Darrell's three asks, and it identifies + ships **one** safe first step (the input convergence seam, PR #269). Everything that touches autonomy stays review-first and behind the Cage brakes.
**Verification:** Every "what exists today" claim below is grounded in `file:line` evidence from the repo as of 2026-06-17. Where something is designed-but-not-built, it is marked as such — per DR-0076 (Verification Doctrine), "looks built" is not "is built."

---

## The three asks (verbatim intent)

- **A — Unify inputs.** "All these input spaces are separated and not in the exact same interface with all of the features of the inputs we already have." One input PRIMITIVE reused everywhere, not N bespoke boxes (CONSISTENCY-STANDARD).
- **B — PoeTech as cockpit.** "The app should let me do the exact same thing I do here except inside PoeTech." Direct, review, and orchestrate work from inside the app the way Darrell directs the Dispatch assistant now.
- **C — Offload off the vendor LLM.** "Find a way for work to happen without you today, so when we use you it's for heavy lifting." Routine work runs on the sovereign stack (local/Ollama + wake-orchestrator + pending OpenClaw eval) behind the Cage; the vendor LLM is reserved for heavy reasoning.

---

## Executive summary (the honest one-paragraph version)

**Ask A is closest — closer than the ask assumed.** The unified input primitive Darrell asked us to "extract" **already exists** and is in production on two surfaces; the work remaining is *convergence* (adopt it on the other ~7 surfaces and add the missing features attach/rich-text), not extraction. **Ask B is half-built**: the app already *records intent* richly and syncs it (directives, decisions, hand-offs, incidents), and shows real system state — but there is no *executor* that picks up an in-app directive and works it. **Ask C is the furthest out and the one where honesty matters most**: today the vendor LLM + Claude Code sessions ARE the engine for routine work. The sovereign layer that would replace them is **designed and scaffolded but not stood up** — and the gating dependency is *hardware that has not been procured*. "Work without the vendor today" is not near; it is staged behind a procurement decision plus four build steps. The details, with evidence, follow.

---

# ASK A — Unify the inputs

## What exists today (verified)

A shared input primitive is already built and live:

- **`app/src/components/OneVoiceInput.jsx`** — the one master "type OR speak, routed for you" box. Voice is built in (`useVoiceDictation`), the routing suggestion is always visible, the person has the last word (MODE-ROUTING).
- **`app/src/lib/one-voice-routing.js`** — the shared classifier (`suggestDestination`, `destinationsFor`) + the pure `planDispatch` routing→action matrix (8 destinations: private, poetech, prayer, pastor, conference, serve, work, counseling).
- **`app/src/lib/voice-dictation.js`** — `useVoiceDictation` hook (feature-detected speech, graceful type-only fallback).
- **`app/src/__tests__/one-voice-dispatch.test.js`** + **`one-voice-routing.test.js`** — characterization tests pinning the routing matrix (PR #154 consolidation).

It is used today by **2 surfaces**:
- `app/src/components/ThinkingSpace.jsx:51` — the Notes "Thinking Space · your diary" (the seed Darrell named).
- `app/src/components/ChurchOneVoice.jsx:14` — the Church "Speak — one place for everything" box (a thin config of the same component).

### Premise correction (surfaced per `feedback-surface-premise-conflicts`)

The ask was to "extract the Notes Thinking-Space input+routing into one shared component." **That extraction is already done** (PR #154, 2026-06-15: "consolidate the inputs to make a master multiinput"). So the real first step is not *extract* — it is *make the existing primitive reusable by the remaining surfaces and grow its feature set*.

### The scattered surfaces that have NOT adopted it (the convergence backlog)

| Surface | File | Voice | Attach | Rich-text | Routing | Persistence |
|---|---|---|---|---|---|---|
| Notes Thinking Space | `ThinkingSpace.jsx` | yes (primitive) | no | no | yes (primitive) | device-local |
| Church Speak | `ChurchOneVoice.jsx` | yes (primitive) | no | no | yes (primitive) | routed tables |
| Study "Capture an Exchange" | `Study.jsx` (`MicButton`, `EntryEditor`, `CaptureBox`) | yes (hook, hand-rolled) | no | no | none (sovereign) | localStorage `poetech.study.v1` |
| Create Workspace | `CreationWorkspace.jsx` | no | no | **yes** (contenteditable) | no | `creation_workspaces` + localStorage |
| Engagement family thread | `Engagement.jsx` | no | no | no | thread-only | `feedback` table |
| Conference registration | `ConferenceRegisterForm.jsx` | no | no | no | one-way form | cloud RPC |
| Learn interest | `ChurchLearn.jsx` | no | no | no | button signal | cross-tenant feedback |
| Choir songs/links/comments | `Choir.jsx` | no | no | no | thread + metadata | choir tables |
| Feedback floater | (feedback component) | no | **screenshots** | no | feedback areas | `feedback` table |

**Note on feature coverage:** the primitive today is text + voice + visible routing + URL-link extraction. It does **not** yet do attach/image or rich-text — two features Darrell listed as part of "all the features of the inputs we already have." Those live in other surfaces (screenshots in Feedback; rich-text in Create). True "all features in one interface" requires adding those to the primitive.

## Opportunities

1. **The hard part is done.** A shared, tested, voice-enabled, routing-aware primitive already ships. Convergence is incremental adoption, not a rewrite.
2. **Consistency win with no hardware and no autonomy.** Every surface that adopts it gets voice, routing, and a consistent feel for free, and a change lands everywhere at once. Directly serves CONSISTENCY-STANDARD.
3. **A natural home for the cockpit input (Ask B).** A "say it to PoeTech" directive box is just a new surface config whose default route is `poetech` — it already records an `appDirective` with no executor and no autonomy. The convergence seam is the same seam the cockpit needs.
4. **Feature consolidation pays compounding interest.** Add attach/image once, in the primitive, and every surface gains it — instead of re-implementing per box.

## Constraints (brutally honest)

1. **Not every surface should adopt it, and forcing it would regress behavior.** Study's "Capture an Exchange" is a *distillation* surface (deep/plain layers, scripture/tags, localStorage-sovereign, **no routing**) — semantically different from "say it once, route it." Conference registration is a one-way structured form. Choir/Engagement are *threads*, not multi-destination routers. Adoption must be **opt-in per surface**, picking the parts that fit, never a mandatory swap.
2. **Feature gaps are real work.** Attach/image and rich-text are not in the primitive yet. Adding them touches storage (where do attachments live — NAS photo bridge? Supabase?) and the rich-text/voice interaction question (dictating into formatted text). This is its own design pass, not a config change.
3. **Sibling-collision risk.** `CONSISTENCY-STANDARD`, `DR-0078 hybrid-modular-shell`, and the swimlanes/pipeline-fix lanes are actively touching UI and component structure. Convergence work must rebase on `main` frequently and land in small PRs to avoid conflicts in the monolith and in shared components.
4. **The monolith.** Several inputs are wired through `poe-financial-mvp-v28.jsx` (~692 KB). Adoption that requires monolith edits competes with every other in-flight lane for that file; prefer adopting at the component boundary (pass handlers in) per `project-new-surface-new-module`.

## Timeline to production

- **Step 0 — SHIPPED (this review):** caller-extensible seam (PR #269). The primitive can now be adopted by a new surface without editing the component. Gates green, behavior-preserving.
- **Tier A, ~days each:** adopt the primitive on the surfaces where it is a clean fit and additive — e.g. a cockpit "issue a directive" box (records `appDirective` only), and any new free-text surface. Each is a small PR with a characterization test.
- **Tier B, ~1-2 weeks:** add **attach/image** to the primitive (design where attachments persist; reuse the NAS photo bridge or Supabase per `project-photo-sovereignty`), then roll to Feedback + Notes. Soak on a preview.
- **Tier B/C, ~2-4 weeks:** add **rich-text** as an optional mode; reconcile with Create Workspace (likely Create stays the document surface and the primitive gains a light formatting mode for longer notes). Family review for feel.
- **Ongoing:** retire the hand-rolled voice in `Study.jsx`/`InputCenter.jsx` in favor of the shared hook where it does not change behavior.

**Net:** the consistency core is reachable in days-to-weeks because the primitive exists. "All features in one interface" (incl. attach + rich-text) is a 3-6 week arc, gated mostly by the attachment-storage design, not by anything hard.

---

# ASK B — PoeTech as the cockpit

## What exists today (verified)

**The intent-recording half is real, rich, and synced.**

- **Command, Control & Serve Center (C2S)** — `app/src/components/CommandServeCenter.jsx` (nav id `center`, family-gated, no-leak gate at `:75-93`). Four faculties — See / Command / Control / Serve (`lib/command-serve-center.js`). It composes live surfaces and shows **real state or honest-empty** (DR-0076), not painted data.
- **See** is live: OpsBoard (real GitHub merge/PR/CI state), QualityProof (CI gates + measured contrast), ConflictLoop (real conflict-rate from `conflict-events.jsonl`).
- **Command** shows the WakeOrchestrator brake state (kill-switch, budget, concurrency lock, arm, summon consent) — the engine ships **inert behind the Cage**.
- **Projects management cockpit** — `app/src/components/Projects.jsx`: eternal-sequence stages, lifecycle log, priority reprioritization, inline discussions, and a **Governor-only hand-off** (`:324-336`).
- **The hand-off records intent, never dispatches.** `app/src/lib/orchestrator-handoff.js`: `buildHandoff()` writes a `discussions` row with `meta.dispatchState: 'staged'` — hard-coded; `'cleared'`/`'dispatched'` are defined but **unreachable** in the codebase. `evaluateHandoffGate()` reads the real brake state and blocks if the Cage would. This is deliberate (the comment says the autonomous-drive piece is explicitly not wired here).
- **Discussions** (`kind: directive | decision | handoff | reflection`) persist to the `discussions` table and sync cross-device (`discussions-sync.js`, `addDiscussion` in the monolith `:3162`).
- **Governance decision-queue** — `docs/governance/decision-queue.md` (source of truth) surfaced in-app via `GovernanceQueue.jsx` (Governor-only). Real data, bundled at build time.
- **One working request→action path already exists:** maintenance. An incident → `dispatchIncident()` → DispatchPanel one-tap SMS/call to a 1099 worker (`lib/dispatch.js`). The worker is contacted; there is no auto-routing back.

## The gap (verified)

**The executor does not exist.** Concretely, there is no code that:
1. Polls the `discussions` table for `kind='handoff', dispatchState='staged'`;
2. Routes a hand-off's named lane to an n8n webhook or a worker;
3. Advances `dispatchState` `staged → cleared → dispatched`;
4. Reacts when a brake clears ("a blocked hand-off is now eligible");
5. Closes the loop back onto the Build board ("done").

So: Darrell can type a directive, watch it sync to his phone, and a week later it is still `status: open`, un-acted-on. **Recording is done; acting is not.**

## Opportunities

1. **The "issue a request" UI is essentially built.** Directives, hand-offs, and the brake-aware gate already exist. The cockpit's *front end* is mostly present.
2. **The maintenance dispatch loop is a proven pattern** to generalize: intent → gate → contact/execute → lifecycle log.
3. **The brake state is already observable in-app**, so an executor can be built to *respect* the same gate the UI already shows — no new safety surface needed, just enforcement.
4. **Ask A's convergence seam gives the cockpit its input** — a `poetech`-default OneVoiceInput surface is the "talk to PoeTech like Dispatch" box.

## Constraints (brutally honest)

1. **The executor is the autonomy line.** Anything that *reads a queue and acts* is exactly the class governed by `feedback-autonomous-automation-three-brakes` (budget + concurrency lock + kill-switch) and is **Tier C, never Tier A**. It cannot ship `active`. This is review-first by binding rule.
2. **The executor needs a host.** It is a daemon (NAS-side n8n workflow or a guarded host process), not app code. That ties Ask B to the same sovereign-stack readiness as Ask C — and today that stack is inert (see below).
3. **The vendor-LLM dependency.** If the executor's "work" is *reasoning* work, then today it would still call the vendor LLM to do it — which is the thing Ask C wants to avoid. A cockpit that "works" directives is only sovereign once Ask C's local layer is real. Until then, an in-app executor would either (a) do only mechanical lanes (file a ticket, move a card, run a deterministic workflow) without an LLM, or (b) summon the vendor — defeating the offload goal.
4. **Loop-closure is non-trivial.** Updating project/Build-board state from an async executor requires a reverse channel (executor → DB → app) that does not exist yet.

## Timeline to production

- **Now (Tier A):** add the cockpit input box (Ask A seam, records `appDirective`/directive only — no executor). Real value, no autonomy.
- **Phase 1 (Tier B/C, weeks):** a **mechanical-only executor** — an n8n workflow that picks up `kind='handoff'` rows whose lane maps to a *deterministic* action (open a GitHub issue, run an existing workflow, post a notification), respects `evaluateHandoffGate`, and writes `dispatchState` back. No LLM in the loop. Single-instance, budgeted, kill-switchable. Ships inactive; turned on attended.
- **Phase 2 (Tier C, gated on Ask C):** an executor that does *reasoning* work routes it to the **local** sovereign team (not the vendor). This is blocked until the sovereign layer is stood up (hardware + teams + armed orchestrator).
- **Phase 3 (Tier C):** full loop closure — executor results advance project state and surface "done" on the Build board, with the conflict/quality loops watching it.

**Net:** a *mechanical* cockpit ("issue a directive → a deterministic lane runs it → it shows done") is a few-weeks Tier-C build. A *reasoning* cockpit that works directives **without the vendor LLM** is gated entirely on Ask C's hardware-first dependency chain below — realistically a quarter-plus out.

---

# ASK C — Offload routine work off the vendor LLM

## The core finding (brutally honest)

**Today the vendor LLM + Claude Code sessions ARE the engine for all routine development and reasoning work.** The sovereign layer that would replace them is **fully designed, scaffolded in code, and — except for the inert portable skeleton and a couple of hand-run scripts — not deployed anywhere.** Nothing is autonomous. Nothing runs unattended. The single gating dependency is **GPU hardware that has not been procured.** This is not near. Anyone who says "work happens without the vendor today" is wrong; what exists is the blueprint and the brakes, not the engine.

## What exists today (verified, with status)

- **Portable orchestrator** — `infra/ai-orchestrator/portable/`. A supervisor loop with all three brakes coded (budget, concurrency lock via mkdir, file-based kill-switch) + a wake scheduler. **Status: INERT scaffolding.** `state/KILL_SWITCH` present (engaged), no `state/ARMED` flag, budgets default to 0. Self-drive and vendor-summoning are **deliberately not implemented** in the skeleton (entrypoint comments say so). Not deployed in any running container.
- **Wake / handoff bridge** — contract + schema + both halves coded (`orchestrator/lib/wake.sh` scheduler; `scripts/wake-router.mjs` router). **Status: DESIGNED, NOT WIRED.** Scheduler runs only inside the inert container; router is never called by any workflow; zero live handoffs; a fourth consent gate (`state/WAKE_SUMMON`) is absent.
- **Vendor routing strategy + tiered orchestrator spec** — `docs/99-session-notes/2026-06-13-vendor-llm-routing-strategy.md`, `...-tiered-llm-orchestrator-spec.md`. Affinity map (local-first; Claude for code/strict-writing; Gemini for long-context/multimodal/research) + priority/backfill policy. **Status: SPEC ONLY.** `scripts/orchestrator-v0.mjs` (advisory) and `v05.mjs` (bounded + judge + ledger) exist but are **run-by-hand, never called by any workflow or the app**; `v1` (the real autonomous engine) does not exist.
- **Local Ollama** — running on the home NAS (`poetech`, 192.168.1.26:11434), Ollama 0.24.0, 4 models pulled (`qwen2.5:14b`, `deepseek-r1:8b`, `qwen2.5:3b`, `nomic-embed-text`). **Status: LIVE but CPU-ONLY.** Xeon D-1527, no GPU. The 14B model runs at ~1-3 tok/s — usable for small classification/embeddings, **not conversational**. A 2,000-token reply ≈ 10-16 minutes.
- **Per-industry sovereign teams** (Church / Therapy / Dev-Ops / Online) — `project-sovereign-llm-teams`. **Status: ZERO BUILT.** No team prompts, tool lists, RAG corpora, or routing exist.
- **Class-tutor local LLM** — `app/src/lib/class-tutor.js` routes to the NAS Ollama (`qwen2.5`), honest-offline fallback. **Status: IN-APP but NOT CONVERSATIONAL** (CPU-only backend; pending GPU).
- **OpenClaw** — single bibliography URL in one research note. **Status: NOT EVALUATED.** No eval doc, no decision, no code.
- **Hardware** — `DR-0012`, `DR-0014`, the network-infra and hardware-advisory reviews. Standard brick chosen (dual RTX-3090, 48 GB): PoeTech farm (~$5k) first, church node (~$9k) second. **Status: RATIFIED PLAN, NOT PROCURED.** Probed 2026-06-10: "the mesh is real and healthy; the GPU compute tier is entirely absent." No GPU box is on the tailnet.

## The real dependency chain (what must exist before routine work runs locally)

```
GOAL: routine work (docs, comms, tagging, scheduling, classification) runs on
      sovereign local LLMs inside a braked, gated orchestrator — vendor LLM
      reserved for heavy reasoning/strategy.

1. HARDWARE PROCURED & ON-MESH .............. NOT STARTED  (gating dependency)
     dual-3090 PoeTech farm (48GB) ~$5k  -> not ordered
     dual-3090 church node (48GB) ~$9k   -> not ordered
2. MODELS MOVED TO GPU ...................... PARTIAL
     4 models pulled on CPU-only NAS; same models hit 20-40 tok/s on GPU
3. PER-INDUSTRY TEAMS BUILT ................. NOT STARTED
     prompts / tools / RAG corpora / routing for Church, Therapy, Dev-Ops, Online
4. ORCHESTRATOR ARMED WITH BRAKES .......... SCAFFOLDING ONLY
     brakes coded + engaged; container not deployed; v1 engine does not exist
5. WAKE / HANDOFF BRIDGE WIRED ............. DESIGNED, NOT WIRED
     both halves coded; router not called by any workflow; no live handoffs
6. VENDOR ROUTING LIVE ..................... DESIGNED, NOT IMPLEMENTED
     affinity map + backfill policy specced; no auto-classify/route/escalate
   ----------------------------------------------------------------------------
   RESULT: GOAL NOT MET. Vendor LLM + Claude Code remain the engine.
```

**The chain is strictly ordered at the top:** nothing above the dotted line is conversational without **link 1 (hardware)**. Links 3-6 are code/prompt work that can be *prepared* in parallel, but they cannot *run for real* until the GPU exists. OpenClaw is an optional accelerant for link 4/5 and is unevaluated.

## Opportunities

1. **The safety architecture is already built and proven-to-catch.** Three brakes + Cage + kill-switch exist and default engaged. When the engine turns on, it turns on *safe*.
2. **The routing intelligence is fully specced.** The affinity map and priority/backfill policy are written; implementing them is engineering, not research.
3. **Local models are already pulled and the mesh is healthy.** The day a GPU box lands, models move with one command and latency drops ~10-20x.
4. **Real cost lever.** Once local-first routing is live, every lightweight task (classification, tagging, summarization, scheduling) leaves the vendor bill — vendor budget concentrates on heavy reasoning, exactly as asked.

## Constraints (brutally honest)

1. **Hardware is the wall, and it is a spend decision, not a code task.** No amount of building moves the needle until a GPU box is procured and on the mesh. Everything conversational is blocked on it.
2. **CPU-only local is not a substitute.** The current NAS can do embeddings and small classification only; it cannot run a daily code-reviewer, conversational tutor, or per-industry teams at acceptable latency.
3. **This whole class is Tier C, never Tier A** (`feedback-autonomous-automation-three-brakes`, post-2026-06-06-runaway). It ships inactive, turns on attended, never while Darrell travels. Sovereignty of location does not bound cost or blast radius.
4. **Per-industry teams are real unbuilt work** — prompts, tool lists, RAG corpora, evaluation. Each team is a project.
5. **OpenClaw is unproven here.** It is one URL. Adopting it requires an eval (does it fit the Cage/brakes model? does it add value over n8n + the orchestrator scripts?) before it can be counted on.
6. **The vendor cannot be "turned off" on a schedule.** Until links 1-6 are real, attempting to route routine work locally would either fail (CPU latency) or silently fall back to the vendor — which is the current state, honestly named.

## Timeline to production (honest, hardware-gated)

- **Pre-procurement (now, no GPU): weeks of prep that does NOT need hardware** — write the per-industry team prompts/corpora (link 3), implement the routing affinity map as code on the existing v0/v05 scripts (link 6, advisory mode), run the OpenClaw eval. None of this runs routine work yet; it makes the day-after-hardware fast.
- **Procurement decision (Darrell): the pacing item.** Order the ~$5k PoeTech farm. Lead time + build: ~2-4 weeks after the decision.
- **Hardware online + models on GPU: ~days** after the box arrives (link 2).
- **Armed orchestrator + wake bridge wired (Tier C): ~2-4 weeks** after hardware, with soak (links 4-5).
- **Local-first routing live for routine work (Tier C, attended): ~1 week** after the above, then a soak.

**Net, realistically:** even on an aggressive path, "routine work runs locally, vendor reserved for heavy lifting" is **a quarter-plus out**, and the clock does not start until the **procurement decision** is made. Before that decision, the vendor LLM remains the engine — and that is the truthful status to plan around. The highest-leverage thing Darrell can do to pull this in is **make the GPU procurement call**; everything else is prep that waits on it.

---

## Cross-ask coordination (siblings — avoid collision)

- **CONSISTENCY-STANDARD** — Ask A's convergence *is* a consistency program; align the primitive-adoption roadmap with it. Small PRs, rebase often.
- **DR-0078 hybrid-modular-shell + swimlanes-engine** — component-structure changes; convergence should adopt at component boundaries, not deepen the monolith.
- **pipeline-fix-list / n8n funnel work** — Ask B's mechanical executor and Ask C's wake bridge both ride n8n; sequence them after the funnel/pipeline fixes settle.
- **The Cage / three-brakes / RELEASE-TIERS** — every Ask B executor and all of Ask C is Tier C behind the brakes. Non-negotiable.

---

## The first shippable step (identified + SHIPPED)

**PR #269 — `feat/unified-input-primitive`:** make `OneVoiceInput` caller-extensible.

- Extracts the per-surface config out of the component into a pure `app/src/lib/one-voice-surfaces.js` (`SURFACES` + `resolveSurface`), mirroring why `planDispatch` was pulled out.
- Adds optional `surfaceConfig` / `destinations` props so a new surface (a Study capture, an Engagement thread, the cockpit "issue a directive" box) can adopt the one primitive **without editing it**.
- `church`/`notes` resolve **byte-identical** with no override — the PR #154 characterization test still passes.
- New `one-voice-surfaces.test.js` locks the invariant and proves a custom surface routes through the same `planDispatch` matrix.
- **Evidence:** `eslint --max-warnings 0` clean; `vitest run` = 116 files / 1217 tests pass; `vite build` exits 0. No UI/behavior change, no migration, no autonomy, no hardware. Additive seam only.

This unblocks Ask A's convergence and gives Ask B its input surface, while every autonomy-touching piece (the executor, the sovereign offload) stays review-first and behind the Cage — exactly where the binding rules require them.

---

# Extension — second pass (2026-06-17): in-app creation, in-app LLM generation, and the model-tier guide

Darrell extended the scope with the same theme — in-app creation + LLM + offload + model sizing. Folded in below as new sections D–J. Same posture: review-first for the generation layer, with one **low-risk near-term shippable PR** flagged (the Create export-format + editor-styling increment). The model-tier section is **web-verified** (mid-2026), per Darrell's explicit instruction to confirm fast-moving model claims rather than architect around them.

---

## D. Creation Workspace — document round-trip + export formats  `[NEAR-TERM SHIPPABLE PR — low risk]`

### What exists today (verified)
`app/src/components/CreationWorkspace.jsx` — the 🎨 Create tab. Native dependency-free rich-text via `contenteditable` + `document.execCommand` (Bold/Italic/Underline/H1-H2/lists); persists to the `creation_workspaces` table + a localStorage optimistic save; exports to **image (PNG/JPG)** via native SVG `<foreignObject>` → `<canvas>` (`lib/creation-workspace.js`, no external service). `WORKSPACE_TYPES` is already an extensible list.

### The ask
1. **Iterative round-trip:** open → edit → re-save documents repeatedly (not one-shot).
2. **Export to PDF and HTML**, not just image. Treat **image / PDF / HTML as export-format options** (a workspace export choice), not a single hard-coded path.
3. **Open-source / self-hostable libs only** — no proprietary export service.

### Verified open-source export paths (all MIT, client-side, no service)
| Format | Recommended path | Library / mechanism | Selectable text? | Color fidelity | Notes |
|---|---|---|---|---|---|
| **HTML** | Serialize the editor's sanitized HTML + inline the document styles | native (no dep) | n/a | exact | Trivial, zero-dep. The portable, re-importable form (round-trip friendly). |
| **PDF (best fidelity)** | Render document HTML in a print stylesheet → browser **print-to-PDF** | native `window.print()` + `@media print` CSS with `print-color-adjust: exact` | **yes (vector text)** | exact incl. Yahweh-red | WYSIWYG, selectable, preserves colors; zero dependency. Default printable path. |
| **PDF (one-click download)** | In-app "Download PDF" button | `html2pdf.js` (wraps `html2canvas` + `jsPDF`, all MIT) | image-based (not selectable) | good | Convenient single-file download; rasterized — keep print-to-PDF as the high-fidelity option. |
| **PDF (programmatic, selectable)** | If selectable-text download is required | `jsPDF` (MIT) or `pdfmake` (MIT) | yes | exact | More layout work than html2pdf; reserve for when searchable-text download matters. |
| **Image** | Already shipped | SVG `foreignObject` → canvas | n/a | exact | Keep as-is; it becomes one option among the format set. |

Independently confirmed: `html2pdf.js` / `jsPDF` / `html2canvas` / `pdfmake` / `pdf-lib` are all open-source, client-side, no server ([html2pdf.js](https://github.com/eKoopmans/html2pdf.js), [JS HTML→PDF comparison 2026](https://www.nutrient.io/blog/html-to-pdf-in-javascript/)). Honest caveat already surfaced above: **html2pdf.js rasterizes** (PDF text is not selectable). For a true **printable** document with selectable text + preserved colors, the **browser print-to-PDF path is superior and dependency-free** — make it the default printable route and offer html2pdf.js as the convenience download.

### Why this is the near-term shippable PR
Export-format choice + iterative re-open/edit/re-save is **additive, deterministic, no autonomy, no hardware, no migration** (the table already stores content; round-trip is open→edit→update the existing row). It folds together with the editor-styling work in §E/§F as **one reviewed Create PR**. Gate it like PR #269: tests for the export serializers (HTML serialize round-trips; PDF/print path renders the page; colors survive), a11y on the toolbar, and a "printable output matches editor render" (WYSIWYG) check.

**Timeline:** Tier A/B, ~days-to-1-week once the §F document-default contradiction is confirmed by Darrell (below).

---

## E. The shared writing/editor primitive — color, highlight, and the "Yahweh's Word" red-letter mark

Darrell's requirement is that the writing styling live in a **shared writing/editor primitive** reused across **every** writing surface (Study, Create, The Word, anywhere writing appears) — not just the Create tab. This is the CONSISTENCY-STANDARD applied to writing, exactly as `OneVoiceInput` is the consistency primitive for inputs.

### Requirements (Darrell)
1. **Writing surface default:** black background with colored letters; **default text WHITE** (the editor chrome, dark-themed). Contrast must pass **both directions** — the color/highlight picker must **not silently allow illegible combinations** (warn, or block, on a failed contrast check).
2. **Full color + highlight control:** choose **any** text color and highlight any selection **any** color (a color picker + highlighter in the toolbar). The color/highlight formatting **saves with the document** and **carries into PDF/HTML/image exports**.
3. **Red-letter for Yahweh** (a distinctive, named convention): text renders **red whenever Yahweh's word/opinion is involved**, regardless of who is speaking or quoting — a red-letter Bible convention extended to Yahweh's voice generally. It is a **named style** (a "Yahweh's Word" mark), not an ad-hoc red, so it is consistent everywhere and persists + exports.

### Proposed implementation (review-first; specced, not yet built)
- **A new shared primitive** `app/src/components/WritingEditor.jsx` + `app/src/lib/writing-style.js`. CreationWorkspace, Study's capture, and The Word adopt it (the same way ThinkingSpace/ChurchOneVoice adopt `OneVoiceInput`). New surfaces opt in; existing ones migrate where it does not regress behavior.
- **Color + highlight** via `execCommand('foreColor'|'hiliteColor')` (or a small Range/span applier) so formatting lives as inline style on the saved HTML — which means it **automatically survives** HTML export, print-to-PDF, and the canvas image export (all render the same HTML).
- **"Yahweh's Word" as a named mark**, not a raw color: a semantic wrapper (`<span class="yahweh-word">` or `data-mark="yahweh-word"`) bound to a single **design token** (e.g. `--ink-yahweh: #C0392B`-class red, tuned for AA on both the dark editor and the white page). Because it is a class/token, one definition governs its red everywhere; restyling it later is one change; and a future feature ("show me everything marked as Yahweh's Word") becomes a query, not a color-scan. Provide a one-tap toolbar action **"Mark as Yahweh's Word"** on the selection.
- **Contrast guard both directions:** reuse the existing contrast-guard discipline (`project-contrast-guard-dark-mode-coverage`, WCAG AA binding). The picker runs the chosen text-vs-background pair through the AA check and **warns/blocks illegible combos** — on both the dark editor surface and the white document page. This is a gate, per DR-0076 (a green check must mean something).

**Typographic-theology alignment:** the red-letter-for-Yahweh convention is consistent with this repo's binding rule that Yahweh is always honored typographically (CLAUDE.md Typographic Theology). The named mark is the structural way to keep that honor consistent across every surface.

---

## F. Two contexts: the editor surface vs the document artifact (+ one contradiction, flagged)

Darrell clarified two distinct contexts. They must not be conflated:

- **Context 1 — the on-screen WRITING/editor surface** (app chrome, dark theme): **black background, white default text**, red for Yahweh's word, full color + highlight choosable. (Specced in §E.)
- **Context 2 — the DOCUMENT ARTIFACT itself** (the composed/exported/printed page). Darrell said: *"white is the default text color AND the default background color of the digital document. printable."*

### The contradiction, surfaced (per `feedback-surface-premise-conflicts` + DR-0076)
**White text on a white page is invisible and cannot print or be read.** We interpret the coherent intent as: **the document defaults to a WHITE PAGE (printable, like paper), with a sensible default text color of BLACK/dark** so it is readable AND printable — with full color choice, the highlight tool, and the "Yahweh's Word" red mark all available on that white page.

**Build it that way as the default — and this note is the flag:** we interpreted *"white text on white page"* as *"white printable page + dark default text,"* because literal white-on-white can neither print nor be read. **Darrell, correct us if you meant something else** — e.g. a **dark document mode toggle** (a black-page artifact with white text, for screen reading), which we can add as an explicit per-document theme rather than the default. The white printable page is the safe default; a dark-document mode is a clean opt-in if that was the intent.

### Printable is first-class (WYSIWYG)
The document must export/print cleanly as a **white page with its colors preserved** (including the Yahweh-red), via the PDF/HTML/print path. **The editor's page render must match the printable output** — WYSIWYG. Mechanism: the editor composes the document inside a white "page" element whose styles are the **same** styles used by the HTML export and the print stylesheet, with `print-color-adjust: exact` so browsers do not strip colors on print. The dark editor *chrome* surrounds that white page; the page itself is the artifact. One stylesheet drives screen + export + print, so they cannot drift.

---

## G. Discuss-with-an-LLM-in-app → produce the artifact (tier-routed generation)  `[REVIEW-FIRST]`

### The ask
A surface where Darrell and family **discuss with an LLM inside PoeTech** and it **produces the requested artifact** (a document / PDF / HTML) right there — and it must **route by tier**: prefer the **sovereign/local** LLM (Ollama) for routine generation, **vendor LLM only for heavy lifting**. This ties directly to Ask C (offload) and rides the **same routing the offload section defines**.

### How it rides the offload routing (Ask C)
The generation surface is a **consumer of the tiered router**, not a new engine. The flow:
1. The discussion input is the **unified input primitive** (§A / `OneVoiceInput`) configured for a "generate" surface (default route = a new `generate` destination).
2. The request is **classified** by the same affinity map the offload section defines: routine drafting/summarizing/structuring → **local Ollama**; heavy reasoning / nuanced long-form / code → **vendor**; **video/multimodal review → Gemini** (§I).
3. The model returns content; the content **lands directly in the shared WritingEditor (§E)** as a draft the family then edits and exports (§D). Discussion → production → editable artifact, in one place.
4. Everything runs **behind the Cage brakes** (budget + concurrency lock + kill-switch) and shows which tier served the request (honest provenance, DR-0076).

### Honest dependency (the hard truth, same as Ask C)
**This cannot be "local-first" for real until the sovereign layer is stood up.** Today the only conversational engine is the vendor LLM; the NAS Ollama is CPU-only (~1-3 tok/s for 14B — not conversational). So an in-app generation surface built **now** would, in practice, call the **vendor** for anything substantial — which is the opposite of the offload goal. Therefore:
- **Phase 0 (buildable now, honest):** ship the generation surface **vendor-routed and clearly labeled as such**, with the local-tier routing **stubbed and inert** behind the same router interface — so the day local conversational inference exists (GPU procured), routine generation flips to local with **no surface rewrite**, just a routing-table change.
- **Phase 1 (gated on Ask C hardware):** local-first routing becomes real; vendor reserved for heavy lifting.

**Timeline:** the surface itself is Tier B/C, **weeks** (it is review-first — an in-app generation layer). Its *sovereign* behavior is gated entirely on the Ask C hardware-first dependency chain (a quarter-plus, clock starting at the GPU procurement decision).

---

## H. "What to expect from what size systems" — the model-tier expectation guide (WEB-VERIFIED)

Per Darrell's instruction, the candidate model names were **web-verified live** (mid-2026), not taken as fact. **Honest meta-caveat first:** these are fast-moving releases past reliable training knowledge. The **Ollama-library availability** (what is *pullable today*) was independently confirmed by direct fetch for the two MVP-target families (Qwen3.6, Gemma 4); the param/license/architecture specifics come from a verification pass citing model cards/vendor blogs and should be **re-confirmed at architecture time** before committing.

### Verified model table

| Role / tier | Verified model (pullable on Ollama) | Params | Arch | License | Approx RAM @ Q4 | Realistic hardware |
|---|---|---|---|---|---|---|
| Deep logic + RAG (MVP target) | **`qwen3.6:35b`** (also `:27b`, `:35b-mlx`) | 35B (and a 27B variant) | dense/MoE — see correction | Apache 2.0 | ~24 GB (`:35b`), ~17 GB (`:27b`) | **GPU node** (24GB+) |
| Dense logic alt | `qwen3:32b` | 32B | dense | Apache 2.0 | ~20 GB | GPU node |
| Conversational/structured (MVP target) | **`gemma4:26b`** (MoE) / `gemma4:31b` (dense) | 26B-MoE / 31B | MoE / dense | **Gemma ToU** (use-restricted — sovereignty flag) | ~18 GB / ~20 GB | GPU node (or strong CPU, slow) |
| Small conversational | `gemma4:e4b` (~eff. 4B) | ~4-4.5B eff | dense-ish | Gemma ToU | ~5-10 GB | **NAS CPU OK** |
| Agentic tools / coding | `devstral:24b` (pin the latest "Devstral Small 2" tag) | 24B | dense | Apache 2.0 | ~14 GB | GPU node |
| General baseline | `qwen3:8b` | 8B | dense | Apache 2.0 | ~5-6 GB | **NAS CPU OK (modest)** |
| Baseline (Llama) | `llama3.1:8b` | 8B | dense | Llama license | ~5 GB | **NAS CPU OK (modest)** |
| Deep reasoning (local) | `deepseek-r1:32b` (also `:8b`,`:14b`) | 32B / 8B / 14B | dense distills | MIT | ~20 GB / ~5-6 GB | GPU node (8B will run on CPU but slowly) |
| Frontier reasoning | DeepSeek-V4 (`-flash`/`-pro`) | 24B act / huge MoE | MoE | MIT | 24GB+ / 48GB+ VRAM | GPU only; `-pro` is multi-GPU/server — **out of scope for the home node** |
| **Video / multimodal review** | **Gemini API** (not local, not Claude) | — | — | proprietary API | — | cloud (see §I) |

### Corrections to the candidate names (honest)
1. **"Qwen 3.6 (27B dense / 35B MoE)"** — **largely correct.** Ollama directly shows **`qwen3.6:27b` (17GB)** and **`qwen3.6:35b` (24GB)** plus MLX variants — so the 27B is **real**, not fabricated (an initial verification pass wrongly claimed "no 27B"; direct Ollama fetch corrected that). The exact dense-vs-MoE split per tag is **not stated on the Ollama page** — confirm on the model card before relying on "27B dense / 35B MoE" precisely. Qwen3.6 flagships (Plus/Max/Flash) are **API-only, not pullable**.
2. **"Gemma 4 (26B-A4B MoE)" and "Gemma 4 (4B)"** — **correct.** Gemma 4 is real and current (Gemma 3 is the prior gen). Ollama shows `e2b / e4b / 12b / 26b (MoE) / 31b (dense)`. The "4B" is the **`e4b`** (effective-4B) tag. **License is Google's Gemma ToU, not Apache/MIT** — flag for sovereignty if Apache/MIT-only is a hard rule.
3. **"Devstral Small (24B)"** — **correct.** Mistral's agentic coding model, 24B, Apache 2.0; pin the latest "Devstral Small 2" tag rather than `latest`.
4. **"Qwen3 (8B)"** — **correct.** `qwen3:8b`, Apache 2.0, runs on the NAS.
5. **"Llama 3.2 (8B)"** — **WRONG, no such model.** Llama 3.2 ships only 1B / 3B (text) and 11B / 90B (vision). The real ~8B is **`llama3.1:8b`** — or prefer the newer `qwen3:8b`.
6. **"DeepSeek-V4 / R1 distills"** — **V4 is real but NOT locally runnable** on the home node (server-class MoE; only `-flash` fits a 24GB GPU). For local "deep reasoning" use **R1 distills (8B/14B/32B, MIT)**. The line conflates a server flagship with runnable distills.

### What to expect, by tier (the honest "what size does what")
- **NAS-CPU tier now (DS1621xs+, Xeon, no GPU, 16-32GB):** good for **quick drafts, tagging, summaries, classification, routing, RAG answering** with `qwen3:8b` / `llama3.1:8b` / `gemma4:e4b`. **Honest limit:** weak at long, complex, multi-part personas (e.g. the 7-tier persona / 81-book RAG), and **14B+ is ~1-3 tok/s — not conversational.** Reasoning models (R1) run but feel slow because they emit long hidden chains. Do **not** expect nuanced long-form or reliable code here.
- **Mid local (14-32B on a real GPU):** longer documents, decent structure, usable agentic tool-calling (`devstral:24b`), solid RAG. **Honest limit:** weaker reasoning and nuance than the vendor frontier; can lose coherence on very long complex tasks.
- **Vendor / heavy (Claude, Gemini frontier):** complex reasoning, code, nuanced writing, long-context synthesis. **Reserve the vendor for these** — that is the whole offload thesis.
- **The MVP target Darrell stated** (Ollama; Qwen3.6-27B/35B for deep logic + Gemma 4 for conversational) is **sound and real** — but **all of it needs the GPU "Forge" node**; on the current CPU-only NAS, only the ~4-8B models run usefully. So the MVP-as-described is **hardware-gated**, consistent with Ask C: the models exist and are pullable, the **box to run them conversationally does not exist yet**.

---

## I. Multimodal / video routing — Gemini owns video

**Verified:** the **Gemini API natively ingests a YouTube URL** and analyzes the **actual video — frames + audio** (passed as `file_data`/`file_uri`; current Gemini models process video, 2.5+ handle multiple videos/request) ([Gemini video understanding](https://ai.google.dev/gemini-api/docs/video-understanding)). **Claude does NOT** natively ingest a YouTube URL or analyze video frames/audio — it is text + image + document focused; any "video understanding" with Claude is done by external tooling that pre-extracts frames/transcript (often routing the actual watching through Gemini).

**Routing rule for the multi-vendor router (add to the affinity map in the offload section):**
- **VIDEO / watch-and-understand** (sermon-video analysis, multimodal review) → **Gemini**.
- **Code / heavy reasoning / strict-constraint writing** → **Claude**.
- **Routine text / classification / drafts** → **local Ollama** (when the GPU tier exists).

This matches the existing hybrid-router research (Gemini for grounded + multimodal, Claude for code, Ollama for narrow/clinical/routine). The **"video" capability is provider-owned, not size-owned** — no local model and no Claude tier substitutes for Gemini's native video here.

---

## J. Strategic note — sovereign-by-default (the cloud-dependency framing, honestly handled)

Darrell referenced a video's strategic framing. Handled per the Verification Doctrine:

- **The video's "Anthropic Fable-5 model banned by the US Government" is the CREATOR'S hypothetical scenario, NOT a confirmed event.** There is no verified record of such a ban. **Do not record it as fact.** It is recorded here only as a *narrative device* the video used.
- **The underlying point is sound and reinforces our existing direction:** dependence on a single cloud vendor = exposure to provider/policy/pricing/availability change; **local inference = resilience** ("a generator in the garage"). This is exactly the **sovereign-by-default** posture already binding in this repo (AI-FOUNDATION-INTERNAL-OPERATIONS, DATA-AS-EMPOWERMENT-NOT-EXTRACTION) and the **offload goal** of Ask C. The framing strengthens the case for the GPU procurement decision; it does not change the honest timeline.

**On "the 5 local-AI business opportunities":** the specific five from the video were **not provided to me**, so — per the no-fabrication rule — I am **not** inventing the creator's list. Captured instead as the local-AI opportunity *categories* that align with PoeTech's mission (clearly my synthesis, not the video's enumeration; Darrell can paste the actual five and we will reconcile):
1. **Accessibility-law compliance tooling** (EAA/ADA) with prove-it verification gates — already a named pipeline (`project-accessibility-law-compliance-product`).
2. **Sovereign per-industry AI** for overlooked communities (church, therapy) — local, private, non-extractive (COMMUNITY-FIRST-MISSION).
3. **Local/sovereign media production** (the AI-MEDIA-PRODUCTION-PLATFORM-VISION) — generation that never leaves the family's hardware.
4. **Data-sovereignty / "own your AI" consulting + install** — standing up braked local stacks for others (the portable orchestrator bundle is already this shape).
5. **Offline-resilient tools** that keep working when a cloud vendor changes terms or goes down — resilience as a feature.

This note is **strategy/sovereignty context**, not a build directive; it informs *why* the offload + GPU path matters, not *when* it lands.

---

## Updated first-shippable picture

- **SHIPPED:** PR #269 — caller-extensible `OneVoiceInput` (the input convergence seam).
- **NEXT NEAR-TERM PR (specced, build-ready, low risk):** the **Create export-format + shared writing-editor increment** (§D + §E + §F) — iterative round-trip, image/PDF/HTML export via open-source libs, the color/highlight picker with a both-directions contrast gate, and the named **"Yahweh's Word"** red-letter mark, with **WYSIWYG printable** output. **One open question gates the start:** Darrell's confirmation of the §F document-default interpretation (white printable page + dark default text, vs a dark-document mode). Everything else (the in-app generation surface §G, the sovereign offload §H) stays **review-first and behind the Cage**, hardware-gated as the dependency chain above makes honest.
