# Projects Tab — IA / Coherence Review

**Type:** READ-ONLY review + recommendation. No behavior change shipped with this doc.
**Date:** 2026-06-23
**Prompt (Darrell):** "projects tabs need something. All of these need to make better sense collectively and separate so we can make sure the loops through the projects are necessary and powerful."
**Reviewer scope:** the nine sub-tabs of the Projects tab, grounded in source.

---

## 0. Ground truth + a wiring seam worth naming first

The live app (`origin/main`) renders the Projects sub-nav in
[`Projects.jsx` → `ProjectsWrapper`](app/src/components/Projects.jsx:134). The tab
strip is built at [`Projects.jsx:138`](app/src/components/Projects.jsx:138):

```
list · discussions · concerns · scopes · inventory · build      (everyone)
+ governance · review · loops                                   (isGovernor only)
```

That is **nine tabs**, but they are **not nine peers** — six are visible to
everyone and three (`Decisions` / `Review` / `Loops`) are pushed only for a
signed-in Governor. The flat strip hides that split.

> **Branch note:** the working branch `docs/feature-workflow-register` is *behind*
> main — its `Projects.jsx` predates PR #277 (Concerns) and PR #276 (Build→C2S
> consolidation) and shows only eight tabs with no `ConcernsBoard.jsx` on disk.
> **This review is written against `origin/main`, which is what Darrell sees.**

**Seam already in motion:** PR #276 ("consolidate buried PoeTech-build functions
into the C2S Center") changed the Build call site to
`<BuildBoard isGovernor onViewDecisions onNavigate />` —
**no `projects` / `discussions` props passed** ([`Projects.jsx:174`](app/src/components/Projects.jsx:174)).
So `ProjectMgmtPulse` *inside* BuildBoard ([`BuildBoard.jsx:333`](app/src/components/BuildBoard.jsx:333))
now reads empty project/discussion data when reached through the Projects tab.
The system-watching surfaces are **already being pulled toward C2S** and away from
Projects. That direction is the right one and this review leans into it.

---

## 1. Per-tab inventory (grounded)

| # | Tab (id) | What it does | Loop / purpose it serves | Data it reads / writes | Primary overlap |
|---|----------|--------------|--------------------------|------------------------|-----------------|
| 1 | **Projects · Timeline** (`list`) | The spine: project list, 12-mo workload forecast, per-project management cockpit (eternal-sequence stage, lifecycle trail, archive, blocker/next-step, braked hand-off). Also embeds the **feedback→promote panel** and a compact Inventory at the bottom. | The work itself + "decide what becomes a project" loop. | R/W `projects` table via `addProject`/`updateProject` ([`Projects.jsx:447`](app/src/components/Projects.jsx:447), `ProjectManage` :304, `ProjectClarity` :243). Reads `discussions` (driving list), `feedback` (promote panel). | Embeds feedback (→ **Concerns**) and Inventory (→ **Inventory**); hand-off writes a `discussions` row (→ **Discussions**). |
| 2 | **💬 Discussions** (`discussions`) | First-class records that *drive* a project: **directive / decision / reflection / hand-off**, each project-linked, with no-leak private visibility. | Discuss-then-document loop: capture the conversation that precedes a build; resolve/archive it. | R/W `discussions` table (migration 0035) via `addDiscussion`/`updateDiscussion` ([`Discussions.jsx:32`](app/src/components/Discussions.jsx:32)); helpers in [`lib/discussions.js`](app/src/lib/discussions.js). `decision` kind carries a free-text `dr_ref`; `reflection` carries `study_ref`. | `decision` kind ↔ **Decisions** (the DR ledger); `hand-off` kind ↔ Projects cockpit; counts re-surfaced in **Build** (`ProjectMgmtPulse`). |
| 3 | **⚠ Concerns & Solutions** (`concerns`) | Every concern in the open, paired with intended **solution + target date + honest status (open/in-progress/done)** and **overdue** tracking. Two feeds: AUTO (every `feedback` row, read-through with thumbnail) + CURATED (seed baseline + DB rows). | Feedback-returns-in-app loop + commitment-to-a-date loop. | R/W `concerns` table (migration 0039) via `addConcern`/`updateConcern`; reads `feedback`; composed in [`lib/concerns.js`](app/src/lib/concerns.js) (`composeConcerns`, `daysLate`). ([`ConcernsBoard.jsx`](app/src/components/ConcernsBoard.jsx)) | Consumes `feedback` — **same source** as the Projects-list promote panel (#1) but a *different* loop; "decision/solution" language brushes **Discussions**. |
| 4 | **Scopes · Agreements** (`scopes`) | Service agreements / SOWs generated from templates (MSW clinical, property contractor, blank), entity- and project-linked. | Contract-artifact loop: turn a project into a signable scope. | R/W `scopes` via `addScope`/`deleteScope`; `SCOPE_TEMPLATES` ([`Projects.jsx:125`](app/src/components/Projects.jsx:125)), `Scope` component. Reads `projects`, `entities`. | Low. Clean WORK artifact. |
| 5 | **Inventory · Capital Forecast** (`inventory`) | CapEx items + 12-mo outflow forecast vs. net cash flow; amber when a month doesn't pencil; savings prompts. | Capital-planning loop. | R/W `capexItems` via `addCapexItem`/`updateCapexItem` ([`ProjectInventory` :1028](app/src/components/Projects.jsx:1028)). Reads `projects`, `rentals`, `accounts`, `netCashFlow`. | Also rendered compact inside #1 (controls-in-context — intended, not a conflict). |
| 6 | **🛠 PoeTech Build** (`build`) | Platform self-build transparency: the `ROADMAP` constant (shipped/building/next/gated + go-live dates), and for a Governor a stacked dashboard: `WorkflowStatus`, `ProjectMgmtPulse`, `OpsBoard`, `QualityProof`, `ConflictLoop`, `WakeOrchestrator`, `LlmHealth`, `LlmReview`. | "Build the platform in the open" loop + Governor ops cockpit. | Reads `ROADMAP` (hardcoded platform data) + `__GOVERNANCE_QUEUE__` (`normalizeGovernanceQueue`); sub-components read ops/quality/conflict/LLM state. ([`BuildBoard.jsx:27`](app/src/components/BuildBoard.jsx:27), :327-354). | **Highest.** Re-aggregates **Discussions** (`ProjectMgmtPulse` :333), **Loops** (`ConflictLoop` :346 — a loop-rate trend), **Review/verify** (`QualityProof` :341), **Decisions** (governance-queue read + `onViewDecisions`). |
| 7 | **⚖ Decisions** (`governance`, Governor) | Two repo-sourced lists rendered natively: the **OPEN** decision queue (waiting on the Governor) and the **DECIDED** DR ledger (number/title/decision/why/date). | Governance loop: batch the calls only Darrell can make; keep the canonical decided record. | Read-only of build-time defines `__GOVERNANCE_QUEUE__` (`docs/governance/decision-queue.md`) + `__DR_LEDGER__` (`docs/decisions/`) ([`GovernanceQueue.jsx:22`](app/src/components/GovernanceQueue.jsx:22)). **No in-app write** — deciding happens in the repo. | `decision` ↔ **Discussions** `decision` kind + `dr_ref`; gated items ↔ **Build** `ROADMAP` `status:'gated'` reasons. |
| 8 | **🔄 Review** (`review`, Governor) | The **freshness loop's** staged web-link summaries (local model, optional vendor cross-check); **Keep / Dismiss** each. | Freshness-proposal loop: review what the always-on loop flowed; act on it. | R/W NAS via n8n: `GET /webhook/review-feed`, `POST /webhook/review-action` ([`ReviewFeed.jsx:82`](app/src/components/ReviewFeed.jsx:82)). Gated on `VITE_REVIEW_TOKEN` — renders **"unconfigured"** when absent (:148). Explicitly **not** family feedback (:132). | Name + "freshness/review" language ↔ **Loops** and ↔ **Concerns** (feedback) and ↔ `QualityProof` in **Build**. Most overloaded name in the strip. |
| 9 | **🩺 Loops** (`loops`, Governor) | "Is the app actually looping?" — each tracked loop's **real** last update; stagnant ones ask **Keep (re-review) / Retire**. | The watchdog meta-loop: keep every *other* loop honest (DR-0075, nothing stagnates silently). | Reads derived app state via `assessLoops` over a fixed registry (financial/ledger/cloud-snapshot/numeric-verify/engagement) ([`lib/loop-health.js:32`](app/src/lib/loop-health.js:32)); writes keep/retire `decisions` via `onLoopDecision`. | "Looping/freshness" ↔ **Review**; `ConflictLoop` in **Build** is another loop-rate surface not tracked here. |

---

## 2. The overlap map — the five process/meta surfaces

The two clean WORK artifacts (Scopes #4, Inventory #5) barely overlap anything.
The confusion lives entirely in the **five process/meta surfaces** — Discussions,
Concerns, Decisions, Review, Loops — plus the Build mega-dashboard that
re-aggregates them. Four concrete collision points:

### A. "A decision and its rationale" exists in **three** places, with no closed link
- **Discussions** `kind:'decision'` — the *in-app capture* of a choice + why, project-linked, with an optional **free-text** `dr_ref` ([`discussions.js:19`](app/src/lib/discussions.js:19); field at [`Discussions.jsx:182`](app/src/components/Discussions.jsx:182)).
- **Decisions** (`GovernanceQueue`) — the **canonical** DECIDED ledger, read-only, repo-sourced.
- **Decisions** OPEN queue — the decision *waiting* to be made.

A decision's life is *open queue → discussion (rationale) → DR ledger*, but the
three surfaces are **not wired**: `dr_ref` is a string a human types, not a link;
nothing promotes a Discussion-decision into the queue or the ledger. A user
genuinely cannot tell **where to record** or **where to find** a decision.

### B. "Feedback / something's wrong" splits across **three** surfaces on **two** meanings of the word
- **Concerns** auto-ingests every `feedback` row as a concern (`composeConcerns`).
- **Projects · Timeline** embeds the **feedback→promote-to-project** panel ([`Projects.jsx:161`](app/src/components/Projects.jsx:161), `feedbackPanel`).
- **Review** is *also* called "review of feedback" by intuition but is actually **web-link freshness** and explicitly excludes family feedback (`ReviewFeed.jsx:132`).

So the same `feedback` table drives two different loops (becomes-a-concern vs.
becomes-a-project) on two tabs, while a third tab named in the same semantic
field ("Review") means something unrelated.

### C. "Is it fresh / looping / stagnant" trades on **one** word across **three** surfaces
- **Loops** = data-staleness of tracked loops (`loop-health.js`).
- **Review** = the *freshness loop's* proposals (`ReviewFeed` header: "What the freshness loop is flowing").
- **Build → ConflictLoop** = merge-conflict-rate trend (another "loop").

"Freshness" and "loop" name three different things one tab-strip apart. Nothing
in the labels distinguishes them.

### D. **PoeTech Build** is a second mega-dashboard that re-renders the other meta-tabs
Inside Build (Governor), [`BuildBoard.jsx:333-354`](app/src/components/BuildBoard.jsx:333) stacks:
`ProjectMgmtPulse` (**Discussions** counts), `QualityProof` (**verification**),
`ConflictLoop` (**a loop**), `OpsBoard`, `LlmReview`, plus a read of the
governance queue (**Decisions**) and `onViewDecisions`. The same signals that
have their own top-level tabs (Discussions/Loops/Review/Decisions) appear *again*
here. This is the single biggest "sprawl" driver.

### E. The strip is split by **gate**, not by **concept**
Discussions + Concerns are everyone; Decisions + Review + Loops are Governor-only;
Build straddles (roadmap for all, dashboard for Governor). Three altitudes —
**work artifacts**, **human discourse**, **system-watching-itself** — are flattened
into one row, so the eye can't group them.

**Net:** of nine tabs, **the five meta surfaces overlap heavily and are split by
permission rather than idea.** A user's honest question — *"a decision goes where?
feedback goes where? what does Review mean vs Loops?"* — has no good answer from
the labels.

---

## 3. Are the loops necessary + powerful? (per loop surface)

| Loop surface | The loop it closes | Verdict |
|--------------|--------------------|---------|
| **Concerns** | feedback/worry → solution → target date → done, with overdue accountability | **Load-bearing + powerful.** Returns the feedback loop in-app (the point of PR #277); overdue tracking holds dates honestly. Keep. |
| **Loops (LoopHealth)** | watches *every other* loop's real freshness; keep/retire the dead ones | **Load-bearing + powerful — the keystone.** It's the watchdog that makes every other "loop" claim verifiable (DR-0075/0076). Keep; it should *gain* coverage (see gaps). |
| **Discussions** | discuss → document → drives project → resolve | **Load-bearing when linked.** Powerful as decision/rationale provenance; degrades to a chat dump if records aren't project-linked. Keep, but close the decision→ledger link. |
| **Decisions (GovernanceQueue)** | open queue → decide → DR ledger | **Necessary but only half-closed in-app.** The "decide" action is **not** in the app — the queue is a read-only mirror of repo files; decisions are made by editing the repo. Powerful as a *display*, weak as a *loop*. Keep, but it's governance, not "projects." |
| **Review (ReviewFeed)** | save link → local summary → keep/dismiss | **Weakest / most likely dead.** Hard-gated on `VITE_REVIEW_TOKEN`; renders "unconfigured" without it, and depends on the NAS freshness loop actually running. Narrowest surface, most overloaded name. **Redundant in altitude with Loops.** Merge. |

**Read:** the loops *are* mostly necessary — but **Review is redundant with Loops
in altitude** (both are "the system's self-watching"), and **Decisions is a
governance display, not a project loop.** Loops is the one that earns its keep
most, because it is what makes the others honest.

---

## 4. Recommendation — keep / merge / cut + grouping

### 4a. Per-tab verdict

| Tab | Verdict | Why |
|-----|---------|-----|
| Projects · Timeline | **KEEP** (it's the hub) | The spine. Already co-locates promote + inventory in context. |
| Discussions | **KEEP** + wire to Decisions | Distinct capture loop; fix the free-text `dr_ref` → a real link. |
| Concerns & Solutions | **KEEP** | Distinct accountability loop; name its feed boundary vs. the promote panel. |
| Scopes · Agreements | **KEEP** | Clean WORK artifact, low overlap. |
| Inventory · Capital Forecast | **KEEP** | Clean WORK artifact, low overlap. |
| Decisions (governance) | **KEEP, RELOCATE** | Governance, not projects. Move under the system home (4c). |
| Review (freshness) | **MERGE into Loops** | Same altitude; overloaded name; often unconfigured. Becomes a section *inside* Loops: "the loops, and what they're flowing." |
| Loops (LoopHealth) | **KEEP, PROMOTE** | The keystone watchdog; make it the home for system self-watch (absorbs Review). |
| PoeTech Build | **KEEP, RELOCATE + DE-DUP** | Platform self-build belongs with the steward seat (C2S), not as a Projects peer; stop it re-rendering Discussions/Loops/Decisions that already have tabs. |

**Nothing is cut outright** — every surface closes a real loop. The fix is
**altitude and grouping**, plus merging Review into Loops.

### 4b. The coherent grouping (collective + separate sense)

Three altitudes, made visible instead of flattened:

```
PROJECTS  (the hub)
│
├─ THE WORK ───────────────  (everyone — your projects + the discourse around them)
│   • Projects · Timeline        ← the spine (leads with the NEW attention roll-up, §5)
│   • Discussions                ← what drives the work
│   • Concerns & Solutions       ← what's wrong + the committed fix
│   • Scopes · Agreements        ← contracts the work produces
│   • Inventory · Capital        ← capital the work needs
│
└─ THE SYSTEM ─────────────  (Governor — the platform watching/deciding/building itself)
    one home, tabs-under-tabs:
      • Decisions    (queue + DR ledger)
      • Loops        (loop health  ⊕  Review/freshness proposals merged in)
      • Build        (roadmap + ops/quality/conflict — de-duped)
```

Top strip drops from **9 flat tabs to 5 + one "System" home** for everyone, and
the three look-alike Governor tabs stop colliding in the same row.

### 4c. Two ways to land it (recommend the second)

- **Minimal (in-place):** nest `Decisions / Review / Loops / Build` under **one
  Governor sub-tab** inside Projects — e.g. **"System"** (or "Governance & Loops")
  — with its own inner strip. Merge Review into Loops. Low blast radius; honors
  "tabs-under-tabs OK but not redundant."

- **Principled (recommended):** **relocate the whole "System" cluster to the
  Command, Control & Serve Center (C2S)**, which is *already* the steward-seat that
  composes OpsBoard/QualityProof/WakeOrchestrator/ConflictLoop, and which PR #276
  already started pulling Build into. Projects then becomes a clean **5-tab WORK
  hub** for everyone; the Governor's "system watching itself" lives in the one
  seat designed for it. This removes the gate-split from the Projects strip
  entirely and ends the Build/C2S double-rendering. Cost: a real IA move + nav
  wiring (Tier B/C, family-soak), so it's a Decision, not a Tier-A edit.

Either way the **merge of Review into Loops** is the cheap, unambiguous win to do
first.

---

## 5. What Projects *needs* that's missing (the "something")

The nine tabs **fragment "what do I do next?"** Attention signals are scattered:
- blocked / next-step per project — buried in each card (`ProjectClarity`),
- overdue concerns — inside the Concerns tab,
- decisions waiting — inside the Decisions tab,
- stagnant loops — inside the Loops tab,
- unlinked / open discussions — inside Discussions.

A person opening Projects **cannot see, in one place,** *"3 blockers · 2 overdue
concerns · 1 decision waiting · 1 stagnant loop."* That single cross-cutting
answer is the missing piece.

**Recommendation — a "Now / Needs attention" roll-up at the head of Projects ·
Timeline** (everyone-safe; Governor rows show only to a Governor). It reads the
*real* signals already computed elsewhere — `isBlocked`/`hasNextStep`
([`Projects.jsx:83`](app/src/components/Projects.jsx:83)), `daysLate` from
`concerns.js`, the open governance count from `normalizeGovernanceQueue`, and
`stagnantLoops` from `loop-health.js` — and links each into its tab. No new data,
no painted numbers; it's the ANXIETY-CLARITY answer to *what / when / why / how*
the strip currently splits five ways. This is also exactly the C2S "See" pane,
which is another argument for 4c.

**Second gap — the Discussions↔Decisions bridge:** a `kind:'decision'` discussion
should be *promotable* into the decision queue / linked to a real DR, closing
that loop in-app instead of via a typed `dr_ref` string. Today the decision loop
is the one most visibly broken between surfaces.

---

## 6. Summary

- **Keep all nine loops** — each closes something real. The problem is **altitude
  and naming**, not surplus surfaces.
- **The five meta-surfaces (Discussions, Concerns, Decisions, Review, Loops) +
  the Build mega-dashboard overlap heavily**, split by *permission* rather than
  *concept*, and collide on three words — *decision*, *feedback*, *freshness/loop*.
- **Do first (cheap):** merge **Review → Loops** (same altitude, overloaded name,
  often unconfigured).
- **Do next (the IA fix):** regroup into **THE WORK (5 tabs, everyone)** + **THE
  SYSTEM (Governor)**; ideally **relocate THE SYSTEM cluster into C2S** (PR #276's
  direction), leaving Projects a clean work hub.
- **Build the missing piece:** a **"Now / Needs attention" roll-up** at the head
  of Projects that aggregates blockers, overdue concerns, waiting decisions, and
  stagnant loops into one answer to *"what do I do next?"* — plus a real
  **Discussions→Decisions** link so the decision loop actually closes in-app.
