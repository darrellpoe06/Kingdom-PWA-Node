# Research-Review: Tina Huang's "My Full Claude Cowork Setup (steal my workflows!)"

**Reviewer:** Claude (PoeTech AI Foundation), at Darrell Poe's request
**Date:** 2026-06-01 evening
**Subject video:** https://www.youtube.com/watch?v=gdrPkpXuNks
**Author:** Tina Huang (ex-Meta data scientist, CEO of Lonely Octopus, @TinaHuang1)
**Published:** 2026-05-18
**Companion resource (with the actual prompts):** https://resource.lonelyoctopus.com/doc/ce409140-9c5c-4923-a739-871048b339eb/
**Third-party walkthrough:** https://www.geeky-gadgets.com/automate-workflows-claude-cowork/
**Per:** Darrell's binding `feedback-research-first` principle. This report exists before any change to PoeTech's processes, not after.

---

## 1. Executive summary

Tina Huang's video is the highest-leverage Cowork workflow content currently public. It is one focused operator's documented system, with the actual prompts shipped on the LonelyOctopus resource page, and it overlaps PoeTech's existing process at almost every layer -- which means the comparison is unusually direct.

**By the numbers:**

- **14 distinct techniques cataloged** across configuration, PRD authoring, folder architecture, execution, autonomous build, and memory management.
- **6 PoeTech is already doing the same or better** (PRD-first, push-back behavior, reversibility guards, note-taking, three-tier memory analog, scheduled tasks).
- **5 PoeTech is doing partially -- Tina's version is stronger and worth adopting** (Operating Instructions doc, Data-Lake / Block-0-first build sequence, per-domain folder pattern, autonomous-builder pending/in-progress/done/failed lifecycle, the "interview-then-PRD" two-step pattern).
- **2 worth adopting net-new** (the "mission control" project-as-workspace model for PoeTech-internal builds, the Productivity plugin's `/start` + `/update` + dashboard.html scaffold at the repo root).
- **1 explicit non-adoption** (Google-Drive-style cloud connectors as data sources for sensitive Family / Counseling / Church data -- conflicts with TLC firewall + sovereign-LLM-teams).

**Top 3 highest-leverage adoptions:**

1. **An "Operating Instructions" doc at the Cowork-account level** (Tina's Config Metaprompt) -- four-section spec: About Me, Building (PRD-first), Pushback, Reversibility, Note-Taking, Working Style. PoeTech has the equivalent inside `CLAUDE.md` at the repo, but NOT at the Cowork-account level where it would apply to every session. Adoption cost: ~1 hour.
2. **The PRD Metaprompt's "Phase 0 -- Orient yourself" pattern** -- before asking the user anything, pre-fill every answer the system can infer from memory + give a "here's what I already know about you" recap so the user only corrects. This is a measurable speed win for every PRD-generation session. Adoption cost: ~30 min (encode in `CLAUDE.md` as a binding pattern).
3. **The Autonomous Builder lifecycle (pending/in-progress/done/failed folders + 30-min scheduled pickup task)** -- this is the structural pattern Darrell already wants for the Workflow Module Library and the sovereign LLM teams. Tina has it working today. Adoption cost: ~2 focused hours (folder skeleton + one n8n workflow that scans pending/ every 30 min + ntfy push on state transitions).

**The honest take:** Tina's setup is single-user, single-machine, Cowork-only, and lives entirely in her local file system with cloud connectors as data sources. PoeTech is multi-user, multi-machine (NAS + PWA + Cowork + Dispatch + Code), multi-community (Family + COLG + future communities), and treats the NAS as the sovereign substrate. So her architecture transfers as a **pattern**, not as a literal folder copy. The patterns worth taking are the discipline patterns (PRD-first, push-back, reversibility, Block-0-setup-before-build) and the lifecycle pattern (autonomous-builder pending/in-progress/done/failed). The implementation always re-roots in the NAS.

---

## 2. Technique inventory (with timestamps + Tina's stated rationale)

The chapter timestamps are from the YouTube video chapters; the prompt content is from the LonelyOctopus resource doc, which Tina explicitly says contains "all the prompts you need."

### 2.1 Configuration: the Operating Instructions doc (00:42 -- 02:50)

**What it is:** A four-section doc pasted into Claude Cowork Settings -> Cowork. It applies to every Cowork session globally, not per-project. Generated from Tina's "Config Metaprompt" prompt (full text in the LonelyOctopus resource).

**The four sections:**

1. **About Me** -- pulled from past conversations: name, role, what the company/team does, public work, side projects, biggest pain points, tools used. Missing info? Ask, do not guess.
2. **Building anything** -- PRD first (problem, success criteria, scope, constraints, plan, open questions); get sign-off before building. Check what already exists before proposing custom work.
3. **Pushback** -- "Interrogate vague requests. Disagree when something's off. Flag contradictions before acting -- never silently overwrite. No sycophancy."
4. **Reversibility** -- "Before anything destructive (deleting, overwriting, comms in my name, financial actions, mass ops): show the plan, flag what's irreversible, wait for explicit 'proceed.'"
5. **Note-taking** -- "Capture context, decisions, and open threads continuously. Checkpoint before switching domains or when a chat runs long."
6. **Working style** -- "Show reasoning, not just conclusions. Breadth and rigor. Skip filler. If I say 'things changed,' re-interview me."

**Her stated rationale:** "These instructions shape how Cowork thinks, pushes back, documents, and builds. ... interrupting with a question is always cheaper than silently destroying something."

### 2.2 Project Instructions (per-project) (00:42 -- 02:50)

**What it is:** Pasted into the Cowork project's custom-instructions field when the project is created. Identifies the project's role (her example: "mission control workspace"), establishes default tone, and explicitly names the PRD file at root as the authoritative architecture spec.

**Key line from Tina's text:** "When operating in a specific subfolder (investments/, personal/, etc.), respect that folder's CLAUDE.md for voice and approach." -- This is the folder-as-context-scoping move ICM also names.

### 2.3 PRD Metaprompt (02:50 -- 09:19)

**What it is:** A 200+ line prompt the user pastes into Claude **chat** (not Cowork) that interviews the user briefly and produces a build-ready PRD as a markdown file. The PRD then gets dropped into a Cowork project folder, and Cowork executes from it.

**Architectural moves inside the metaprompt:**

- **Phase 0 -- Orient yourself first.** Before asking the user anything, search memory + past conversations. Pre-fill every answer. Give a "here's what I already know about you" recap (5-7 bullets). Do not ask what you can already answer.
- **Phase 1 -- Propose, do not interrogate.** Step 1: suggest 4-6 candidate domains as a pick-list. Step 2: state best guess of the user's technical level + which connectors are enabled, "correct anything." Step 3: ask the one thing that cannot be guessed -- build length in hours, as a one-tap choice (3 / 5 / 8). Step 4: fill any real remaining gaps, one short question at a time.
- **Fixed conventions** (the metaprompt enforces these, every PRD looks identical in structure):
  - **Foundation = Cowork's Productivity plugin.** Installed via Cowork -> Customize -> Plugins -> "Productivity." Initialized once by running `/start`. Creates at project root: `CLAUDE.md`, `TASKS.md`, `memory/`, `dashboard.html`. Provides `/update` + create-skill workflow.
  - **Setup sequence = Block 0.** Verify project exists, plugin installed, `/start` run, connectors enabled. Only then begin data layer.
  - **Root folder skeleton:** see Section 2.4 below.
  - **Per-domain folder pattern:** `inputs/` (human-maintained, never auto-overwritten), `data/` (machine-refreshed), `outputs/` (generated), plus `CLAUDE.md` for folder-level voice/role.
  - **Three-tier memory:** root CLAUDE.md (cross-cutting) / memory/{domain}/ (deep) / {domain}/CLAUDE.md (in-domain voice).
  - **Naming conventions:** folders kebab-case; memory files noun.md; data files noun.json; date-stamped files name-YYYY-MM-DD.md.
  - **Interaction patterns:** dashboard / brief / skill / (optional) autonomous-builder.
  - **Scoping rule:** ~3 hours = foundation + 1 domain + morning brief. ~5 hours = foundation + 2 domains OR 1 domain + builder. ~8 hours = foundation + 2-3 domains. Never more than ~4 active domains in one window.
- **Phase 2 -- Sketch architecture, get sign-off before PRD.** One-page architecture sketch first. User reacts and adjusts.
- **Phase 3 -- Produce PRD.** Ten fixed sections, same order every time:
  1. Executive summary
  2. Quick start -- moving this into Cowork
  3. Goals and non-goals
  4. Architecture overview
  5. The data layer -- the foundation
  6. Component specifications
  7. The build plan (Block 0 setup + hour-sized blocks 1..N)
  8. Setup details + copy-paste prompts
  9. Decision log (8-15 rows of non-obvious choices)
  10. Out of scope / future work

**Her stated rationale:** "A weak PRD leads to a weak system, just like a bad blueprint leads to a building that falls down. ... The good news: she provides a prompt in the description that you paste into your Claude chat. It asks you a series of questions and then generates your own custom version of this PRD."

### 2.4 Root folder skeleton (09:19 -- 10:30)

```
~/cowork/                          <- Cowork project root (LOCAL folder)
|-- CLAUDE.md                      <- plugin: cross-cutting working memory
|-- TASKS.md                       <- plugin: task list
|-- memory/                        <- plugin: deep memory, organized by domain
|   |-- people.md
|   |-- terminology.md
|   `-- {domain}/                  <- one subfolder per domain
|-- dashboard.html                 <- plugin dashboard
|-- PRD-{system-name}.md           <- this PRD, dropped at root for reference
|-- toolbox/                       <- installable custom skills (source of truth)
|-- briefs/                        <- morning-brief output + archive/
`-- {domain}/                      <- one folder per domain (pattern below)
    |-- CLAUDE.md
    |-- inputs/                    <- human-maintained, NEVER auto-overwritten
    |-- data/                      <- machine-refreshed derived files
    `-- outputs/                   <- generated artifacts
```

The only variable part is the `{domain}/` folders. Optional `builds/` drop-zone if autonomous-builder is in scope.

### 2.5 Project setup flow (09:19 -- 10:30)

1. Finder -> create folder ("mission control" in Tina's case).
2. Cowork -> Projects -> New Project -> Use an Existing Folder. Open it.
3. Instructions field: reference the PRD file you are about to drop in.
4. Click Create.
5. Drop PRD file into the folder.
6. Type the literal first sentence: "Please start building with the mission control PRD."

Total manual setup: ~1 minute. Cowork takes over from there, walking through plugin install + connector enablement.

### 2.6 Block 0 -- Setup before data layer (10:30 -- 12:45)

The first thing Cowork runs in a fresh project. Verifies:

1. Cowork project created, pointed at local folder.
2. Productivity plugin installed.
3. `/start` run (root files exist).
4. Required connectors enabled.

Quick (~15-30 min), mostly user actions with Cowork checking. **Block 1 (data layer) does not begin until Block 0 is complete.**

### 2.7 Block 1 -- The data layer (Hour 1) (10:30 -- 12:45)

Build the folder tree, seed input files, scheduled data-refresh workflows. The "lake" analogy: before you can build anything on the lake, you have to fill it with water. Pipelines feed: calendar, email, investments, news, etc.

**Hard rule:** A refresh task never writes to `inputs/`. Inputs are human-maintained. Data is machine-refreshed.

### 2.8 Blocks 2-4 -- Interfaces (Hours 2-4) (10:30 -- 12:45)

Built on top of the data layer:

- **Dashboards** (always-on visual)
- **Briefs / digests** (scheduled push)
- **Skills** (on-demand commands)
- **Autonomous Builder** (if scope allows)

Tina's specific Hour 2 = Investment Dashboard. Hour 3 = Morning Brief + Skills Suite (Today, Research, Prep). Hour 4 = autonomous-builder setup (if scope allows).

### 2.9 Block N -- Polish + E2E test (Hour 5) (10:30 -- 12:45)

Notifications wired, end-to-end tests run. Not new building.

### 2.10 The Autonomous Builder (12:45 -- end)

**Lifecycle pattern (this is the highest-value piece for PoeTech):**

1. Tina asks Cowork to suggest new things to build across company, personal life, investments.
2. Cowork drafts PRDs for the suggestions.
3. Tina reviews and approves -- approved PRDs land in a `pending/` folder.
4. **A scheduled task runs every 30 minutes**, scans `pending/`, picks up any waiting PRD, starts building.
5. While building, the project moves to `in-progress/`.
6. On success, moves to `done/`. On failure, moves to `failed/`.
7. Cowork keeps logs of everything built.

**Mission-control dashboard for the builder:** shows queued / in-progress / completed / failed at a glance.

**For more complex builds:** Tina sometimes hands the PRD to Claude Code instead of Cowork. (She does not detail this; this is a tell that Cowork has scope ceilings she has bumped against.)

**Her stated rationale:** "She wakes up to a finished project. ... You can queue builds before bed and wake up to finished projects."

### 2.11 Skills as first-class artifacts (10:30 -- 12:45, expanded in Geeky Gadgets summary)

Skills are reusable task instructions, stored in `toolbox/`. Examples:

- **Today Skill:** fetch/update morning brief on demand.
- **Research Skill:** `/research [ticker]` deep-dive on a stock, feeds the investment dashboard.
- **Prep Skill:** input any meeting, get full context on attendees + what to know going in.

Skills are shareable across users. Plugins combine Skills + Connectors.

### 2.12 Connectors as sources, never storage

**Hard rule from the PRD metaprompt:** "Connectors (Drive, Gmail, Calendar, Notion) are data sources workflows pull from or push to -- never storage. ... The build never creates folders in Google Drive."

This is structurally consistent with PoeTech's NAS-as-sovereign-substrate principle.

### 2.13 Note-taking + memory bloat warning (end of video)

Tina explicitly warns that memory bloats over time, especially as more projects accumulate. She has implemented a more complex memory architecture on top of the base system. Possible Part 3 on memory management for power users.

### 2.14 The "pure execution" posture (10:30 -- 12:45)

Once the PRD is in place, Tina follows Cowork through it block by block. "Having the PRD gets you 95% of the way there. The rest is just giving permissions and making small tweaks as you go." This is the disciplined-supervision posture, not autopilot. Pairs with her note: "please continue to pay attention and push back when needed because Cowork is not perfect and still requires you to have discernment."

---

## 3. Comparison matrix vs. PoeTech current practice

| # | Technique | PoeTech status | Strength delta | File / process |
|---|-----------|----------------|----------------|----------------|
| 1 | Operating Instructions doc at Cowork-account level | **Partial -- Tina is stronger.** PoeTech has the equivalent inside repo `CLAUDE.md`, but only applies inside the repo. Cowork sessions outside the repo run without these rules. | Tina wins on scope (every session). | Cowork Settings -> Cowork -> paste operating instructions. |
| 2 | Per-project instructions field | **Doing.** The repo `CLAUDE.md` is auto-loaded by Cowork sessions opened on the repo, which functions as the project instructions. | Even. | `CLAUDE.md` at `C:\Users\dpoe\Kingdom-PWA-Node\` |
| 3 | PRD metaprompt with Phase 0 / Phase 1 / Phase 2 / Phase 3 | **Partial -- Tina is stronger.** PoeTech writes PRDs but does not have a standardized metaprompt that pre-fills from memory before asking the user anything. The Drive-Don't-Delegate rule is in spirit consistent; the Phase 0 "pre-fill from memory then recap" mechanic is more disciplined than what we do today. | Tina wins on mechanism. | Encode as a binding pattern in `CLAUDE.md` and/or `docs/00-foundations/_root/PRD-METAPROMPT.md` (new file). |
| 4 | Fixed-structure PRD (10 sections, every time) | **Partial -- Tina is stronger.** PoeTech's research-review reports are well-structured but PRDs themselves vary. Standardizing PRD structure reduces every-time-reinvention cost. | Tina wins on consistency. | New foundation doc: `docs/00-foundations/_root/PRD-STRUCTURE-STANDARD.md`. |
| 5 | Root folder skeleton (CLAUDE.md / TASKS.md / memory/ / dashboard.html / toolbox/ / briefs/ / {domain}/) | **Partial.** PoeTech has `CLAUDE.md` and the equivalent of `memory/` (the agent memory directory). No `TASKS.md`, no root `dashboard.html`, no `toolbox/`, no `briefs/`. | Tina wins on scaffold completeness for a single-user system. PoeTech's NAS-side workflow library is functionally bigger but structurally less convention-bound. | If we adopt: scaffold under the repo or under a new `cowork/` directory inside the repo. |
| 6 | Per-domain pattern (inputs / data / outputs + folder CLAUDE.md) | **Partial -- Tina is stronger.** PoeTech has this discipline implicitly (the workflow module library, the per-module memory) but not as a fixed convention everyone honors. | Tina wins on naming + the inputs-never-auto-overwritten guard. | Bake into the workflow-module-library spec. |
| 7 | Three-tier memory (root / memory/{domain}/ / {domain}/CLAUDE.md) | **Doing the same or better.** PoeTech already has the agent memory directory (root) + per-domain notes in `docs/` + per-foundation-doc voice. Tina's three-tier ladder is a clearer naming of what we already do. | Even -- adopt her **naming**. | Update `MEMORY.md` index header to name the three tiers. |
| 8 | Naming conventions (kebab-case folders, noun.md memory, noun.json data, name-YYYY-MM-DD.md date-stamped) | **Partial -- Tina is stronger and more explicit.** PoeTech uses YYYY-MM-DD- prefix for session notes (matches) but inconsistent kebab-case enforcement elsewhere. | Tina wins on explicitness. | Add to `CLAUDE.md`. |
| 9 | Block 0 setup -- verify before build | **Doing.** PoeTech already runs `git status` + service health checks before substantive work. Tina's version is more explicit and audience-friendly (Cowork checks for non-technical users). | Even. | -- |
| 10 | Data Lake principle (data layer first, interfaces on top) | **Doing the same or better.** PoeTech's NAS-as-substrate + data-then-workflows-then-PWA is exactly this. Tina names the analogy more crisply ("man-made lake"). | Even -- steal her **analogy** for explaining the architecture to non-technical communities (COLG, family). | Cite in `docs/00-foundations/_root/INFRASTRUCTURE-PIPELINE.md`. |
| 11 | Autonomous Builder lifecycle (pending / in-progress / done / failed + 30-min scheduled pickup) | **Not doing -- worth adopting.** Closest analog is the scheduled tasks (5 daily check-ins) but not the lifecycle-folder-as-queue pattern. This IS the structural pattern Darrell named today for the Workflow Module Library + the sovereign-LLM-teams. | Tina wins -- adopt directly. | New workflow `wf-autonomous-builder.json` + folder scaffold under the NAS at `/data/cowork/builds/`. Pairs with INSTITUTIONAL-MEMORY-EVENTS. |
| 12 | Skills as first-class artifacts in `toolbox/` | **Partial.** PoeTech has n8n workflows + the Cowork skills directory, but not a clean shared `toolbox/` source-of-truth folder per project. | Tina wins on naming + portability. | Folder `cowork/toolbox/` once we scaffold the cowork/ tree. |
| 13 | Connectors as sources, never storage | **Doing the same or better.** PoeTech's "all persistence on the NAS, connectors are I/O" matches exactly. Already a binding rule in `PERPETUAL-PIPELINE-HEALTH.md` and `DATA-AS-EMPOWERMENT-NOT-EXTRACTION.md`. | Even. | -- |
| 14 | Push-back / no-sycophancy directive | **Doing the same or better.** PoeTech `CLAUDE.md` already binds the Religion-AND-Relationship test + Phil 4:8 test + the "tell me when I am wrong" posture (Drive-Don't-Delegate, research-first, distinguish-data-from-brand all have it). | Even. | -- |
| 15 | Reversibility guard before destructive ops | **Doing the same or better.** PoeTech has Two-Session Git Race rule + the binding "no destructive ops without an explicit batch plan." | Even -- but adopt Tina's tighter language ("show the plan, flag what's irreversible, wait for explicit 'proceed'") in `CLAUDE.md`. | One-line addition to `CLAUDE.md`. |
| 16 | Note-taking aggressively from day one | **Doing the same or better.** PoeTech `docs/99-session-notes/` is already this. INSTITUTIONAL-MEMORY-EVENTS principle declared today goes further. | PoeTech wins. | -- |
| 17 | Memory bloat anticipated as a scaling problem | **Doing -- partially named.** The consolidation-memory skill exists (anthropic-skills:consolidate-memory). | Even. | Run consolidate-memory monthly. |

### Quick tally

- **Already doing same or better:** Items 2, 7 (with adoption of her naming), 9, 10 (with adoption of her analogy), 13, 14, 15 (with one-line tightening), 16. **8 items.**
- **Doing partially, Tina stronger, adopt:** Items 1, 3, 4, 5 (partial), 6, 8, 12. **7 items.**
- **Not doing, worth adopting net-new:** Item 11 (the big one). **1 item.**
- **Not applicable / non-adoption:** see Section 7.

---

## 4. Cross-reference with the ICM paper (Van Clief & McDermott, arXiv:2603.16021)

(Per the ICM paper review at `docs/99-session-notes/2026-06-01-icm-paper-review-for-childhood-friend.md`.)

### Where they overlap

- **Folder structure as agentic architecture.** ICM names this explicitly with a five-layer hierarchy (Identity / Routing / Stage Contract / Reference / Working). Tina names it implicitly with the three-tier memory + per-domain folder pattern.
- **Per-folder CLAUDE.md as context-scoping.** Both endorse the pattern. ICM is more rigorous about WHY (Liu et al.'s "lost in the middle"); Tina is more rigorous about the DEFAULTS (the exact files the Productivity plugin creates).
- **Markdown as the universal interchange.** Both treat .md as the primary artifact. Both treat folder-copy as the deployment mechanism.
- **Single orchestrating agent reading the right files at the right time.** ICM names this as the orchestration model. Tina builds on it directly (one Cowork session per project, reading the appropriate folder's CLAUDE.md).

### Where Tina goes further

- **The pending / in-progress / done / failed lifecycle.** ICM does not have an explicit queue pattern for autonomous execution. Tina ships one and uses it daily.
- **The Productivity plugin as a shared scaffold.** ICM authors built their workspaces ad hoc. Tina has a plugin that standardizes the root files across every project -- which is the "make-style convention" ICM aspires to but does not deliver.
- **The interview-then-PRD-then-build pattern is named end-to-end.** ICM stays at the architecture level; Tina ships the complete workflow with the actual prompts.

### Where ICM goes further

- **The Layer 3 / Layer 4 distinction (reference vs working) is sharper than anything in Tina's setup.** Her `inputs/ data/ outputs/` per-domain split is the same idea but lacks the framing.
- **The compiler analogy (Section 6.1 of the ICM paper) is more durable architecturally than Tina's "data lake" analogy.** Lake is easier to teach to non-technical communities; compiler is more rigorous for engineers.
- **ICM names what it does not solve (real-time multi-agent, high-concurrency, automated branching).** Tina's setup hits these limits implicitly (she mentions handing complex builds to Claude Code instead of Cowork) but does not name them.
- **ICM's "edit source not output" principle.** Tina does not explicitly bind this. PoeTech adopts it via INSTITUTIONAL-MEMORY-EVENTS.

### Where they complement each other for PoeTech

Tina's autonomous-builder lifecycle is the **operational layer** that sits on top of ICM's **architectural layer**. ICM says "structure the folders so the agent's reasoning is interpretable." Tina says "structure the folders so the queue is observable." Combined: a workspace where every build's reasoning AND its lifecycle state are both readable from the file system. That is the pattern PoeTech wants.

---

## 5. CLAUDE.md alignment screen

Every adoption recommendation in Section 6 has been screened against the binding rules. Results:

### 5.1 Typographic theology

None of Tina's techniques involve doctrine, scripture, or named theological content. No conflicts. When her metaprompt is adopted into PoeTech, the wording will be transcribed verbatim with the single exception that any reference to "the devil" / "satan" / "the adversary" (none appear in her actual prompts) would be lowercased. **No conflicts found in source material.**

### 5.2 Religion AND Relationship test

- **Religion check (backbone):** Tina's PRD metaprompt has unusually rigorous structure -- ten fixed sections, named phases, fixed conventions, scoping rule with hour budgets. This is high-backbone work. **Passes.**
- **Relationship check (warmth):** Tina explicitly designs the metaprompt to minimize user effort ("Propose, do not interrogate. ... Keep my total input to a handful of picks and confirmations."). The "Phase 0 -- give me a 5-7 bullet recap so I can correct anything wrong" pattern is warm -- it respects the user's time AND respects the user's authority to correct. **Passes.**

### 5.3 Phil 4:8 Test

| Question | Verdict |
|----------|---------|
| TRUE -- factually accurate? | Yes. Tina's setup is hers and works today; the prompts are shipped. |
| HONORABLE -- dignified? | Yes. The "do not silently overwrite" + "interrupting with a question is always cheaper than silently destroying something" are dignified default postures. |
| JUST -- aligned with God's standard? | Yes for the disciplines named. The data sovereignty caveat (Section 7 below) is where alignment requires care. |
| PURE -- free of bitterness, manipulation, lust? | Yes. No dark patterns. No engagement-loop manipulation. |
| LOVELY -- draws the reader toward good? | Yes. The PRD-first discipline is a kindness to future-self and to anyone who inherits the project. |
| COMMENDABLE -- good-sounding, no slander? | Yes. Tina credits her sources and is honest about the system's limits. |
| EXCELLENT -- the best version, not lazy? | Yes. The metaprompts are concrete and rigorous. |
| PRAISEWORTHY -- worth amplifying? | Yes, with the caveats in Section 7. |

**Overall:** Passes Phil 4:8 with care taken on data sovereignty.

### 5.4 Drive Don't Delegate

Tina's workflow is single-user (her) so her metaprompts ask the user for things only the user knows (build length, which domains to pick). When adopted into PoeTech, the metaprompts must be adapted so Claude (the agent) drives everything Claude can drive, and only escalates to Darrell for the four legitimate-ask categories (real user-gesture / value only he has / decision only he can make / verification on a screen Claude cannot see).

**Risk:** Tina's "Step 3: ask the one thing you cannot guess -- build length, as 3 / 5 / 8 hours" is a legitimate ask (decision only the principal can make). Her "Step 4: anything still genuinely unknown -- propose a sensible default and let me confirm" matches PoeTech's posture exactly.

**Verdict:** Compatible with care. Adapt phrasing to PoeTech's "pre-fill, propose, do not interrogate" frame.

### 5.5 Research-First

Tina's "PRD first, get sign-off before building" is the research-first principle one layer up the stack. **Strongly compatible.** Her metaprompt's Phase 2 ("sketch the architecture and get sign-off before writing the full PRD") is even better -- it is research-first applied recursively.

**Verdict:** Strongly compatible. Adopting her PRD metaprompt strengthens research-first, does not weaken it.

### 5.6 Anxiety-Clarity Principle

Tina's design choice to minimize user effort, give recaps so the user can correct, and produce a complete build-ready PRD before any building starts maps directly to the anxiety-clarity principle (every surface answers what / when / why / how). **Strongly compatible.**

### 5.7 Sovereign-LLM-teams direction

Tina's setup is Cowork-native, which means it uses Anthropic-hosted Claude models. PoeTech's sovereign-LLM-teams direction reserves vendor LLMs for strategic / heavy-reasoning work and runs sovereign teams for daily work. **Tension here:** Tina's autonomous builder is a vendor-LLM-driven autonomous build pattern. Adopting the **lifecycle pattern** is compatible; adopting the **vendor-LLM-driven default** is not.

**Resolution:** Adopt Tina's lifecycle (pending / in-progress / done / failed + 30-min scheduled pickup) but route the actual build work through PoeTech's per-industry sovereign LLM teams. Cowork-as-orchestrator is fine; Cowork-as-the-only-executor is not.

### 5.8 Community-First Mission

Tina's setup serves one person (her). PoeTech's setup serves COLG first + the family + future communities. The metaprompt's "interview the user, fill from memory, propose-not-interrogate" pattern scales TO communities IF the memory is per-community-scoped. **Compatible if scoped per community.**

---

## 6. Concrete adoption recommendations (ranked by leverage)

### 6.1 Adopt: Cowork-account-level Operating Instructions doc

**Adoption priority:** #1
**Adoption cost:** ~1 focused hour
**Dependencies:** none

**Before (PoeTech today):**
- Binding rules live in repo `CLAUDE.md`. Sessions opened in the repo inherit them. Sessions opened elsewhere (e.g. agent-mode sessions in `C:\Users\dpoe\AppData\Roaming\Claude\...`) do not. Cowork-account-level instructions are blank.

**After (adoption):**
- Compose an Operating Instructions doc that distills the four-section pattern (PRD-first / Pushback / Reversibility / Note-taking) AND adds PoeTech-specific bindings: typographic theology, religion-AND-relationship test, Phil 4:8 test, Drive-Don't-Delegate, Research-First, the four legitimate-ask categories. Paste into Cowork Settings -> Cowork.

**File changes:** new file `docs/00-foundations/_root/COWORK-ACCOUNT-OPERATING-INSTRUCTIONS.md` (source of truth for the doc) + manual paste into Cowork Settings.

**Open question for Darrell:** does he want this typed and bindingly identical across his Cowork account AND Dispatch + Code subagents, or scoped only to Cowork sessions?

### 6.2 Adopt: PRD Metaprompt with Phase 0 / Phase 1 / Phase 2 / Phase 3 pattern

**Adoption priority:** #2
**Adoption cost:** ~30 min to encode + ~30 min to use it once on a real PRD to validate
**Dependencies:** none

**Before:**
- Today, when Darrell asks Claude to draft a PRD, Claude sometimes starts asking questions before pre-filling from memory. Sometimes starts writing without sketching architecture first.

**After:**
- New binding pattern: "Before drafting any PRD, run Phase 0 (orient from memory + give a 5-7 bullet 'here's what I already know about you' recap). Then Phase 1 (propose, do not interrogate, with a pick-list). Then Phase 2 (architecture sketch + sign-off). Then Phase 3 (full PRD)."

**File changes:** new section in `CLAUDE.md` titled "PRD Drafting Pattern (Phase 0 -- Phase 3)" with the four phases named verbatim from Tina's metaprompt but adapted to PoeTech's voice + binding rules.

**Open question for Darrell:** none. This is a clear-win pattern.

### 6.3 Adopt: Autonomous Builder lifecycle (pending / in-progress / done / failed)

**Adoption priority:** #3 (highest structural leverage but also biggest implementation)
**Adoption cost:** ~2 focused hours (folder scaffold + one n8n workflow that scans pending/ every 30 min + ntfy push on state transitions + a sovereign-LLM-team handler for the actual build)
**Dependencies:** Workflow Module Library foundation, INSTITUTIONAL-MEMORY-EVENTS, EXECUTION-OUTCOME-OBSERVABILITY (all named today; the principles exist, the workflows do not yet).

**Before:**
- Today, when Darrell wants something built autonomously, he opens a Dispatch task and supervises. There is no queue, no lifecycle, no failure-folder, no scheduled pickup. The 5 daily check-ins exist but are user-facing, not build-facing.

**After:**
- Folder structure on NAS at `/data/cowork/builds/`:
  ```
  /data/cowork/builds/
  |-- pending/        <- approved PRDs waiting for pickup
  |-- in-progress/    <- currently being built
  |-- done/           <- completed
  |-- failed/         <- failed, with failure log
  `-- archive/        <- aged-out done/
  ```
- New n8n workflow `wf-autonomous-builder.json`:
  - Schedule: every 30 minutes.
  - Scan `pending/` for new PRD files.
  - For each: move to `in-progress/`, spawn the appropriate sovereign-LLM-team handler (per the per-industry routing), and after completion move to `done/` or `failed/` with an event log.
  - Emits ntfy push on every state transition (per INPUT-VISIBILITY-TO-CLAUDE).
  - Records every build's outcome as a first-class Event (per INSTITUTIONAL-MEMORY-EVENTS).
- New section on the PWA mission-control dashboard: queue depth, currently-building, last 5 done, last 5 failed.

**File changes:**
- New foundation doc `docs/00-foundations/_root/AUTONOMOUS-BUILDER-LIFECYCLE.md` (binds the pending/in-progress/done/failed pattern + the 30-min pickup cadence + the event-log requirement).
- New n8n workflow JSON at `docs/00-foundations/n8n-workflows/wf-autonomous-builder.json`.
- New PWA dashboard module under `apps/pwa/dashboard/builder/`.

**Open question for Darrell:** what is the pickup cadence -- 30 min like Tina's, or hourly to start? And which industry / sovereign-LLM-team handles which build (or is there a routing skill)?

### 6.4 Adopt: Per-domain folder pattern (inputs / data / outputs + folder CLAUDE.md)

**Adoption priority:** #4
**Adoption cost:** ~1 focused hour (the convention exists; codifying + back-filling existing modules)
**Dependencies:** Workflow Module Library

**Before:**
- Workflow Module Library principle is named (today). Per-module folder layout is implicit.

**After:**
- Bind the per-module folder pattern in `WORKFLOW-MODULE-LIBRARY.md`:
  - `inputs/` (human-maintained, NEVER auto-overwritten)
  - `data/` (machine-refreshed derived files)
  - `outputs/` (generated artifacts)
  - `CLAUDE.md` (folder-level voice + role)
- Add hard guard to every refresh workflow: "CRITICAL: never write to inputs/."

**File changes:** edit `WORKFLOW-MODULE-LIBRARY.md` to bind the per-module pattern.

**Open question for Darrell:** none. Clear-win.

### 6.5 Adopt: Fixed-structure PRD (10 sections, every time)

**Adoption priority:** #5
**Adoption cost:** ~30 min
**Dependencies:** Section 6.2 (the PRD metaprompt)

**Before:**
- PRDs vary. Some have a build plan; some are research-review-shaped; some are roadmap-shaped.

**After:**
- Bind the 10-section structure (from Section 2.3 above) as the canonical PRD shape. Research-reviews stay separate (they have their own shape -- this one). Roadmaps are out of scope for "PRD."

**File changes:** new foundation doc `docs/00-foundations/_root/PRD-STRUCTURE-STANDARD.md`.

**Open question for Darrell:** does he want a TEMPLATE file checked into the repo at `docs/templates/PRD-template.md` so future builds start from it?

### 6.6 Adopt: Tighter Reversibility language in CLAUDE.md

**Adoption priority:** #6 (tiny)
**Adoption cost:** ~5 minutes
**Dependencies:** none

**Before:** CLAUDE.md mentions reversibility in the Two-Session Git Race rule but does not have a general reversibility binding.

**After:** Add one bullet to CLAUDE.md: "Before any destructive op (deleting, overwriting, comms in Darrell's name, financial actions, mass ops): show the plan, flag what is irreversible, wait for explicit 'proceed.'"

**File changes:** one-line addition to `CLAUDE.md`.

### 6.7 Adopt: The Data Lake analogy as a teaching tool

**Adoption priority:** #7 (non-binding, community-facing)
**Adoption cost:** ~15 min
**Dependencies:** none

**Before:** PoeTech explains the architecture to non-technical communities using engineering-flavored language.

**After:** Adopt Tina's "man-made lake" analogy for COLG / family / community audiences. Cite in `INFRASTRUCTURE-PIPELINE.md`.

**File changes:** one-paragraph addition to `INFRASTRUCTURE-PIPELINE.md`.

### 6.8 Adopt: Naming conventions explicit binding

**Adoption priority:** #8 (small but pays compounding interest)
**Adoption cost:** ~15 min
**Dependencies:** none

**Before:** PoeTech uses YYYY-MM-DD-prefixed session notes (matches Tina). Kebab-case for folders is inconsistent.

**After:** Bind in `CLAUDE.md`: "folders kebab-case; memory files noun.md; data files noun.json; date-stamped files name-YYYY-MM-DD.md."

**File changes:** one-bullet addition to `CLAUDE.md`.

### 6.9 Adopt: Three-tier memory naming

**Adoption priority:** #9 (clarification, not change)
**Adoption cost:** ~15 min
**Dependencies:** none

**Before:** PoeTech already has the three-tier structure; it is not named.

**After:** Name the three tiers in `MEMORY.md`'s index header: cross-cutting / per-domain / in-domain-voice.

**File changes:** edit `MEMORY.md` header.

### 6.10 Run `consolidate-memory` skill monthly

**Adoption priority:** #10
**Adoption cost:** ~30 min monthly
**Dependencies:** none

**Before:** Memory accumulates. Tina warns about bloat. PoeTech has the `anthropic-skills:consolidate-memory` skill installed.

**After:** Add monthly scheduled task to run `consolidate-memory` and review the diff.

**File changes:** new scheduled task entry.

---

## 7. Explicit non-adoptions

### 7.1 DO NOT: Use Google Drive / Gmail / Notion as data sources for sensitive Family / Counseling / Church data

**Why not:** Tina's setup pulls from cloud connectors freely. PoeTech's binding `DATA-AS-EMPOWERMENT-NOT-EXTRACTION.md` + `COMMUNITY-FIRST-MISSION.md` + TLC firewall + sovereign-LLM-teams direction all require sensitive data stays on the NAS or in carefully governed sovereign zones. Google Drive as a data source for the Family-Finance workspace is acceptable IF the data is non-sensitive (e.g., public stock prices) -- but routing Christina's TLC clinical notes through Gmail OAuth is a hard no.

**The rule:** Adopt Tina's "connectors are sources, never storage" -- but qualify it with "AND connectors are sources only for data classes that pass DATA-AS-EMPOWERMENT-NOT-EXTRACTION + the TLC firewall." For TLC clinical, Family-Finance personal, Church-financial, the source IS the NAS, full stop.

### 7.2 DO NOT: Default the autonomous-builder to vendor-LLM (Anthropic Claude) for daily build work

**Why not:** Sovereign-LLM-teams direction reserves vendor LLMs for strategic / heavy-reasoning work. Daily builds should route through per-industry sovereign LLM teams. Tina's setup uses vendor Claude as the only executor; PoeTech's autonomous builder must support per-build routing.

**The rule:** Adopt the LIFECYCLE; reject the SOLE-EXECUTOR-AS-CLAUDE-COWORK default.

### 7.3 DO NOT: Treat the Cowork-account-level Operating Instructions doc as the source of truth

**Why not:** The repo `CLAUDE.md` + foundation docs are the source of truth. The Cowork-account doc is a derived mirror that points back at the repo. If the two drift, the repo wins.

**The rule:** The Cowork-account doc must include a line: "Source of truth: `CLAUDE.md` + `docs/00-foundations/_root/`. When these conflict with this doc, those govern."

### 7.4 DO NOT: Adopt Tina's "drop the PRD in a folder, type the magic sentence, Cowork takes over" frictionlessness as the default for community-facing builds

**Why not:** PoeTech serves COLG (elderly tech-novice staff). The "type 'Please start building with the mission control PRD' to a chat box" UI is not enough scaffolding for a non-technical staffer. Per `ANXIETY-CLARITY-PRINCIPLE.md`, the COLG-facing equivalent must answer what / when / why / how with more guidance.

**The rule:** Internal Poe-family builds use Tina's frictionless pattern. COLG-facing builds wrap it in a guided UI per the anxiety-clarity principle.

### 7.5 DO NOT: Adopt Tina's PRD section ordering verbatim for SKOS-foundation-related work

**Why not:** PRDs for technical builds match Tina's ten-section shape well. PRDs that touch SKOS foundations / doctrine / community-voice need to start with the binding-principle screen (typographic theology, religion-AND-relationship, Phil 4:8, sovereign-LLM-teams, COMMUNITY-FIRST-MISSION). Tina's order does not have this slot.

**The rule:** Adopt Tina's 10-section shape for technical PRDs. Add a Section 0 ("Binding-principle screen + alignment check") for any PRD that touches a foundation doc or community-facing surface.

---

## 8. Open questions for Darrell (only the ones that genuinely need his input)

1. **(Adoption 6.1, scope)** Does the Cowork-account-level Operating Instructions doc apply across his Cowork account ONLY, or should the same doc be the source for Dispatch + Code subagent operating instructions too?
2. **(Adoption 6.3, cadence)** Autonomous-builder pickup cadence -- 30 min like Tina, or hourly to start more conservatively until the failure rate is understood?
3. **(Adoption 6.3, routing)** Is there a routing skill that decides which per-industry sovereign LLM team handles a given build, or does each PRD declare its industry up front?
4. **(Adoption 6.5, template)** Should `docs/templates/PRD-template.md` exist as a starting-point file, or is the metaprompt + foundation doc sufficient guidance?

That is the whole list. Everything else in Sections 6 and 7 is a clear-win or clear-rejection that Claude can execute without further input.

---

## Sources

- Tina Huang, "My Full Claude Cowork Setup (steal my workflows!)" YouTube, 2026-05-18, https://www.youtube.com/watch?v=gdrPkpXuNks
- LonelyOctopus resource (full prompts + walkthrough), https://resource.lonelyoctopus.com/doc/ce409140-9c5c-4923-a739-871048b339eb/
- Geeky Gadgets, "Ultimate Cowork Guide : Are You Using Claude to Its Full Potential?", 2026-05-12, https://www.geeky-gadgets.com/automate-workflows-claude-cowork/
- Geeky Gadgets, "Full Guide to Claude Cowork Workflows and Automation," 2026, https://www.geeky-gadgets.com/claude-cowork-ai-productivity-2026/
- Tina Huang YouTube channel, https://www.youtube.com/@TinaHuang1/videos
- Van Clief & McDermott, "Interpretable Context Methodology: Folder Structure as Agentic Architecture," arXiv:2603.16021, March 2026, https://arxiv.org/pdf/2603.16021
- Authors' repo for ICM, https://github.com/RinDig/Interpretable-Context-Methodology-ICM-
- PoeTech ICM paper review (today), `docs/99-session-notes/2026-06-01-icm-paper-review-for-childhood-friend.md`
- PoeTech foundation docs, `docs/00-foundations/_root/`
- PoeTech `CLAUDE.md`, repo root
- PoeTech memory directory, `C:\Users\dpoe\AppData\Roaming\Claude\local-agent-mode-sessions\fbc038c6-aa86-4614-805f-5cb564c7c603\c3bc5726-cc11-46b8-ae30-46ea74edec89\agent\memory\`

---

**Phil 4:8 self-check on this report:** TRUE (claims cite sources). HONORABLE (Tina is credited and treated as a peer). JUST (alignment-screened against every binding rule in CLAUDE.md before recommending adoption). PURE (no manipulation; explicit non-adoptions named honestly). LOVELY (lifts the reader toward better practice). COMMENDABLE (cites where Tina's work is genuinely stronger than PoeTech's current practice). EXCELLENT (concrete, not vague). PRAISEWORTHY (high-leverage adoptions named with focused-hour estimates so they can actually be executed).

**Religion check:** Backbone -- the 10 adoption recommendations are concrete, ordered by leverage, with file paths and dependencies. **Relationship check:** Warmth -- the open-questions list is short (4 items) because most recommendations are clear-wins; this respects Darrell's time. Both pass.
