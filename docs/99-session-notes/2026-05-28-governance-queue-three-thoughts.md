# Governance queue — three substantive thoughts surfaced from @nas inbox

**Drafted by Claude as Advisor; awaiting Governor decision on each.** Per the new Governance-Execution-Advisory foundation, Foundation does not ship any of these without explicit Governor approval. Each section proposes an approach, names tradeoffs, surfaces the question to decide.

These thoughts are sitting in `/data/chatin/` from Synology Chat @nas, surfaced by workflow 23's briefing endpoint after the import.

---

## 1. IoT integration — home + solar systems → AI family hub

**Original thought (2026-05-28 17:20):** *"We already have infrastructure however I am going out of town and have wyze cameras as well as other surveillance systems like ring doorbell etc how can the new Ai family hub or services use this to support my family and pay attention to the electrical systems we have Solar Edge for the system that monitors our electrical panel as well as 69 solar panels so all this data becomes wealth-building for our company and these are the systems that provide operational executive services at the user level all the way to the company's leaders so how can we and should we proceed?"*

### What's actually being asked

Two things layered together:

1. **Family safety while away** — cameras, doorbells, smart-home presence as awareness surfaces the AI family hub knows about and can act on.
2. **Wealth-building data layer** — solar production, panel-level electrical monitoring, household consumption patterns. The data becomes an asset the company can use (for internal optimization AND, potentially, as a product offering to other families).

### What the Foundation can absorb today

Most of these systems have APIs or webhooks. Concretely:

- **Wyze** — official API via Wyze Developer (rate-limited). Better: stream events through the existing Home Assistant integration if one is running, OR via the unofficial wyze-sdk on the NAS.
- **Ring** — official API requires partnership tier; community libraries exist (ring-doorbell) with the usual TOS caveats. Event-stream webhooks are cleaner if Ring's developer program covers your tier.
- **SolarEdge** — well-documented public API. Per-inverter, per-panel telemetry available. Daily / 15-min / live granularity. Wealth-building telemetry lives here.
- **Whole-house electrical (if separate)** — likely Sense, Emporia Vue, or similar. Each has a public API.

The Foundation can pull these into n8n via dedicated workflows (one per source), normalize to a common shape, write to `/data/home-events/`, surface in briefing.

### Proposed architecture

```
Wyze → Workflow 30 (Wyze events watcher)        ↓
Ring → Workflow 31 (Ring events watcher)        ↓
SolarEdge → Workflow 32 (Solar telemetry pull)  → /data/home-events/<source>/<timestamp>.json
Sense/etc → Workflow 33 (Electrical pull)       ↓
                                                ↓
                       Workflow 34 (Home Hub aggregator)
                                                ↓
                       Briefing API + PWA "Home" tab + ntfy alerts
```

The PWA gets a new "Home" tab that mirrors what Books does for finance: at-a-glance health, current state, what to do (lights left on while you're gone, solar production below expected, doorbell motion at 2am, etc.).

### Wealth-building angle, honestly

Solar telemetry alone is genuinely valuable. Per-panel performance over time tells you:
- Whether to file warranty claims on underperforming panels
- Whether the financial model used to size the system is panning out
- When to expand if the panels are outperforming projections

That's owner-level wealth-building today, just by surfacing the data the system already collects.

The bigger play — packaging this as a product for other solar-owning families — is real but is product work, not just data work. Different conversation.

### Tradeoffs

- **Privacy:** camera and doorbell streams are family-private. They should never route to cloud LLMs. Stays on the NAS, processed by Ollama only. Per TLC firewall.
- **Cost:** each integration is ½ day to 1 day of work plus optional cloud API fees. Sense and SolarEdge are free. Ring has tier issues. Wyze has rate limits.
- **Reliability:** consumer IoT is flaky. Workflow 20 health-check should monitor each integration, alert when a feed stops.

### The Governor question

Three options ranked by scope, smallest first:

**Option A — solar first, families-can-use-this-day-one.** Build workflow 32 (SolarEdge telemetry) only. Add a Home tab to the PWA that surfaces per-panel performance, daily/weekly/monthly production, system health flags. Ship in ~2 days. Real value, no privacy surface, no smart-home complexity.

**Option B — solar + electrical + presence (full home health).** Add Wyze (presence + alerts), Sense or Emporia for whole-house, plus solar. Build the Home Hub aggregator. ~1 week. Family-safety surface during travel; full energy picture.

**Option C — A or B as product, not just internal.** Same build but design with multi-family in mind from day one. SolarEdge-owning families is a clean cohort. ~2 weeks with a more careful product surface.

My recommendation: **Option A this trip, Option B post-vacation.** Option C is real but should wait until the financial OS has more users actually using it.

---

## 2. poetech.us roadmap visibility with ITIL & PMP timelines + visualizations

**Original thought (2026-05-28 16:42):** *"When will the poetech.us site update to reflect the options for our potential stakeholders and current stakeholders? Along with the ITIL & PMP timelines and visualizations to explain the opportunities and challenges we support and reduce stress in?"*

### What's actually being asked

The website today (demo personas + first-time landing) explains WHAT the app does. It does not explain WHEN things ship, WHO the stakeholders are, or HOW the work is structured. You want a public-facing roadmap that uses your professional vocabulary (ITIL service lifecycle, PMP phases) to communicate operational maturity and shipping cadence.

This is partly marketing and partly governance — current and potential stakeholders need to see the same view of where things stand.

### What the Foundation can deliver

A new `/roadmap` route on poetech.us with three views:

1. **Timeline view** — Gantt-ish horizontal bars showing each module (Financial / Spiritual Life / Home Hub / Practice Operations / etc.) with PMP phases: Initiating · Planning · Executing · Monitoring & Controlling · Closing. Color-coded by current phase, with target date.
2. **ITIL service catalog view** — each shipped service in the system listed with its operational level: Service Strategy → Service Design → Service Transition → Service Operation → Continual Service Improvement. Maps real workflows (15, 16, 18, 19, 20, 23, 26, 27) to their current ITIL stage.
3. **Stakeholder lens** — which views matter to whom. Founding family (Loved-Ones tier) sees one summary; community partners see another; specialists see a third. Each lens highlights only what's relevant.

The data driving all three lives in `docs/00-foundations/roadmap.yaml` so future Claude sessions can edit it without touching React. Page renders the YAML.

### Tradeoffs

- **Public roadmap commitment** — anything dated publicly is a soft promise. Per the "No Promises" principle from earlier tonight, dates should be RANGES or PHASES (Q3 2026, "in build," "next") rather than specific weeks.
- **Maintenance burden** — a roadmap that goes stale is worse than no roadmap. Workflow 23 briefing should surface "roadmap last updated" age and flag if > 30 days.
- **Vocabulary fit** — ITIL/PMP language is professional and credible to certain audiences (church boards, business owners). It can feel corporate to family-tier viewers. The stakeholder-lens design lets each audience see the framing that fits.

### The Governor question

**Approve / refine / hold:**

- Approve: I'll spec the page (data shape + visual design) and ship in ~3 days when you're back. You'd review the spec on the plane, approve, then a future session executes.
- Refine: tell me which audience to prioritize first (loved-ones / partners / specialists / general public) and I'll narrow the scope.
- Hold: it can sit until you have stakeholders actively asking. Until then the demo + foundation docs do enough.

My recommendation: **Approve with one constraint — phase labels, no specific dates.** Build it with ITIL and PMP language but use phase ranges. Trustworthy AND professional.

---

## 3. System skills inventory + AI team distribution + AI leadership self-examination

**Original thought (2026-05-28 12:38):** *"we need you to keep a list of our system skills so we can refer to for having or using other Ai tools to help aid us in our work. That way we have our procedures documented and easy to follow. And new projects have a easier time experience and outcomes than without the documentation. That way we can determine which internal Ai team should work on what work and I need a internal self-examination and productivity and production changes Ai leadership."*

### What's actually being asked

Three layered asks:

1. **A skills inventory** — a living document of what the system can do today, what each AI tool (Claude / Ollama / Gemini / future agents) is good at, what's queued. So you can route work to the right tool without rediscovery each time.
2. **An AI team distribution model** — who works on what. When does a request go to local Ollama? When does it go to cloud Claude? When to Gemini? When to a future specialist agent?
3. **AI leadership self-examination** — a meta-process where the AI Foundation reflects on its own productivity, finds bottlenecks, proposes improvements. Not just executing — improving the way it executes.

### What the Foundation can deliver

Three things:

**A. `docs/00-foundations/SYSTEM-SKILLS-INVENTORY.md`** — living document covering:
- Each AI tool with its strengths, weaknesses, cost profile, latency, sovereignty (local vs cloud)
- Each existing workflow with what it does, what it doesn't do, what's queued
- Each PWA surface with what it answers and what it doesn't
- "Send work to X when..." routing rules

**B. `docs/00-foundations/AI-TEAM-DISTRIBUTION.md`** — codified routing matrix. For each common request type, which agent / workflow / model handles it. Plus the criteria for when to escalate.

**C. Workflow 29 — Self-examination digest.** Weekly cron. Walks the agent-log and health-run files, computes: how many thoughts processed, how many escalated to Claude, which workflows ran/failed, how long average inbox-to-response was. Drafts a "what's working / what's slow / what to improve" digest. Posts to Synology Chat for Governor review.

### Tradeoffs

- **Document staleness** — skills inventory rots fast if not updated. Workflow 29 can flag stale sections automatically.
- **Routing rigidity** — over-specified rules can make the system brittle. Better: rules with explicit fallback paths and a "Foundation can override based on context" clause.
- **Self-examination overhead** — meta-work shouldn't compete with primary work. Weekly cadence is plenty; daily would be too much.

### The Governor question

This is mostly approve-or-not work, not refine. Recommend approving all three (A, B, C). They're documentation-and-cron, low risk, high leverage. If approved, I draft A and B as PRs against the repo on your next session, and workflow 29 ships in the same batch as workflows 28 (auto-importer) and 30 (SolarEdge) when those happen.

---

## Summary — what needs your governance

| Thought | Recommendation | Effort | Risk |
|---|---|---|---|
| IoT family hub | Approve Option A (solar first) | 2 days | Low (private telemetry only, no smart-home surface yet) |
| poetech.us roadmap | Approve with constraint (phase labels, no dates) | 3 days | Low (phase labels are commitments to direction, not dates) |
| Skills inventory + AI team + self-examination | Approve all three | Documentation: ½ day · Workflow 29: 2 hrs | Very low (docs + meta-cron) |

If you approve all three with my recommendations, the Foundation queues these in this order and ships when you return:

1. Skills inventory + AI team docs (PRs ready for you to read on the plane)
2. Workflow 29 self-examination digest (live the same day, weekly cron from Sundays)
3. Workflow 28 auto-importer (live the same day, eliminates manual workflow imports going forward)
4. Workflow 32 SolarEdge telemetry + PWA Home tab v0 (~2 days)
5. poetech.us /roadmap page with phase labels (~3 days)

Approve, refine, or hold on each. Foundation does nothing until you've governed.
