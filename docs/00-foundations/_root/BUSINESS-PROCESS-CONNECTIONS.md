# Business Process Connections

**Declared by Darrell, 2026-05-28 evening.** Joins THE-WAY, MIND-OF-CHRIST, EXCELLENCE-STANDARD, ANXIETY-CLARITY-PRINCIPLE, AI-FOUNDATION-INTERNAL-OPERATIONS, GOVERNANCE-EXECUTION-ADVISORY, and SEED-DATA-AS-ASPIRATION as senior foundation. Every Claude session reads this before proposing a feature, shipping a surface, or adding marketing copy.

## Why this exists

Direct quote from Darrell, 2026-05-28, after the SEED_DATA hotfix and waitlist activation:

> "having seed data that markets my wife's and I and the churches businesses however the only thing is having real data out there... now real websites and locations are good things they should be advertising what we actually want to when we what to because we will have to support the incoming requirements and relationships alongside the requested paid services so we need to make sure our system pipelines are working."

And then immediately after the waitlist activation:

> "we also need an Ai who thinks like this about connections to business processes asap and why"

This is the principle. Every visible surface — every demo persona, every screenshot, every CTA, every public landing page — generates a downstream obligation. The marketing surface doesn't end at the click; the click starts a process that must be carried through by a human or a workflow on the other side. **If the downstream process isn't wired, the upstream marketing creates exposure, broken promises, and burnout.**

## The principle

**Every visible surface is one end of a connection. The other end must be wired before the surface ships.**

The "other end" of a connection is whatever happens after the user takes the action the surface invites:

- A "Sign up" button → an intake workflow + a Governor review queue + a response SLA.
- A "Book a session" CTA → a calendar integration + a confirmation email + an intake form + a clinical workflow.
- A "Buy this" button → a payment processor + a receipt + a fulfillment workflow + a refund policy.
- An "Apply" link → an application receipt + a reviewer assignment + a decision SLA + a follow-up workflow.
- A phone number → someone who answers, or a voicemail that gets returned, or an explicit "we don't answer this number, use the form" notice.
- An email address → someone who reads it, or a filter that routes it, or an autoresponder that sets expectations.
- A physical address → ability to receive visitors, or signage that says "by appointment only", or staff to greet.

The shape that the connection takes is a design choice. The existence of the connection is non-negotiable.

## The four-question test for any business-facing surface

Before any surface goes live (or before the Governor approves marketing it), Claude as Advisor MUST surface answers to all four:

1. **What does this surface invite?** Describe the action a viewer takes: click, call, email, visit, book, sign up, apply, buy.
2. **What pipeline carries that action?** Name the workflow, the inbox, the human, or the explicit fallback ("we'll respond in 3 weeks"). If no pipeline exists, the surface ships invisible or doesn't ship.
3. **Who is the Governor for the incoming volume?** Who decides which incoming requests get engaged, when, and by whom? (Darrell? Christina? Foundation rules? Workflow auto-routing?) Capacity is finite; the marketing surface generates demand against that finite capacity.
4. **What's the visible promise we're making?** Read the surface as a stranger. What does it imply about response time, scope, cost, fit, professionalism? If we can't honor the promise, the surface is rewritten.

If any answer is "we'll figure it out when it happens", the surface is not ready. Park it.

## Applied to current state of the PWA (2026-05-28 snapshot)

### Surfaces that ARE properly wired

**Waitlist signup (just shipped):**
- Invites: email signup with optional name, phone, interest, notes.
- Pipeline: workflow 29 writes to `/data/waitlist/<id>.json` + pushes ntfy to `poetech-waitlist` topic.
- Governor: Darrell reviews ntfy notifications, engages based on opportunities + capacity. No SLA promised; explicit "engages when opportunities + capacity line up".
- Visible promise: "No promises on a date." Honest. Wired.

**Demo personas (just shipped):**
- Invites: try a sample, see the system without committing.
- Pipeline: in-browser only, nothing saves, nothing leaves the device.
- Governor: not applicable (no data captured).
- Visible promise: "Nothing saves." Honest. Wired.

### Surfaces that ARE NOT properly wired (must not be marketed externally)

**TLC Therapy Solutions reference inside Practice.jsx:**
- Invites: visiting the Practice tab in demo mode currently exposes "TLC Therapy Solutions, Real Solutions for Real Life, Christina Poe LCSW + clinical team" with booking + site URLs.
- Pipeline: NONE — the TLC site, the booking link, the clinical intake are real but are NOT load-tested for traffic that the PWA could route. Christina has not approved a public marketing link from poetech.us to her practice.
- Governor: TLC operations are Christina's authority, not Darrell's, not Foundation's. Any traffic routed there is a Christina-side decision.
- Status: temporarily masked by opaque modal backgrounds (commit 32c82c9). Permanent fix is to gate the Practice tab behind the explicit Christina profile (Layer A). No public exposure until Christina opts in.

**Church of the Living God reference inside seed data:**
- Invites: visible church name implies Darrell's church endorses or uses this system.
- Pipeline: NONE — the church has not been informed, has no opinion, and is not staffed for inbound interest.
- Governor: church-side decisions are not Darrell's authority alone.
- Status: overridden in all four demo personas with generic placeholder. Real-church references are real-app-only behind Layer A.

**Poe Properties rental property addresses:**
- Invites: implies these are public rental availability.
- Pipeline: NONE — rentals are managed by Darrell as landlord, not by an external rental management workflow. Public exposure could generate inbound prospective-tenant inquiries with no intake to handle them.
- Governor: rental marketing is a Darrell decision; the current LLC marketing channels (existing listing sites) are sufficient.
- Status: overridden in landlord persona with city-only references.

### Surfaces that COULD be marketed (governance pending)

**`/roadmap` page:**
- Would invite: public reading of the SKOS roadmap, ITIL service catalog, planned features.
- Pipeline question: does showing a roadmap generate inbound interest in collaboration, paid services, partnerships? If yes, what handles that interest?
- Status: Governor decision pending. Not blocked; not started.

**Specialist directory:**
- Would invite: anonymous viewing of vetted specialists across family / business / legal / financial.
- Pipeline question: how do specialists get vetted? Who does the vetting? How do inbound users contact specialists?
- Status: post-Layer-C. Not blocked at the foundation level; blocked on prerequisites.

## How Claude applies this principle in every conversation

When the user (or any session participant) proposes:

- A new public-facing surface → run the four-question test in the response. If any answer is missing, surface it as a blocker before writing the code.
- New marketing copy → audit what it implies about response time, scope, professionalism, capacity. Don't write the copy until the implied promise is supportable.
- An "activation" of something (waitlist intake, booking, payments) → identify what pipeline carries it, who governs it, and what's promised. Wire the pipeline first. Activate the surface second.
- A demo persona, sample, or screenshot → check it against SEED-DATA-AS-ASPIRATION. The seed teaches what the system does; what it teaches it implies the system supports.
- A connection to an external service (church website, therapy practice, registrar, payment processor) → before linking it, confirm the external service is load-tested for the traffic the link could route, AND that the external owner has approved it.

This is not paranoia. This is stewardship of the obligations marketing creates. Every visible surface is a promise. We keep promises by wiring them through.

## Connection to other foundations

- **ANXIETY-CLARITY-PRINCIPLE** — anxiety is informational; the user reads a surface and assumes a process exists. If it doesn't, that's a betrayal of the implied clarity. Wire the process first.
- **AI-FOUNDATION-INTERNAL-OPERATIONS** — connections are workflows. "What workflow carries this action" is the operational answer to "is this wired".
- **GOVERNANCE-EXECUTION-ADVISORY** — Claude as Advisor names the connection gap. Foundation as Executor builds the workflow. Darrell as Governor approves the marketing surface to go public.
- **SEED-DATA-AS-ASPIRATION** — the seed is itself a marketing surface; every name in it is a connection. Generic placeholders are intentional disconnection because we haven't wired those connections.
- **EXCELLENCE-STANDARD** — religion AND relationship. The religion is the discipline of wiring before marketing. The relationship is honoring the trust a stranger extends when they take an action on the site.
- **No Promises** — we don't promise what we can't carry. Wired surfaces let us make honest promises; unwired surfaces force us to either over-promise or hedge.

## The Timeline-First extension (added 2026-05-28 evening, by Darrell)

Direct quote from Darrell, 2026-05-28 evening, immediately after the four-question principle was committed:

> "Eventually we should be able to give timelines beforehand for what we expect to be doing and how much time we believe we need to set that or those services up, then we market to those wanting that service or services."

This extends the four-question test with a fifth question and reorders when marketing happens. The mature form of the principle is:

### The five-question test (mature form)

1. What does this surface invite?
2. What pipeline carries that action?
3. Who is the Governor for the incoming volume?
4. What's the visible promise we're making?
5. **What's the timeline commitment? How long do we estimate it will take to set this service up to handle the marketed audience, and how confident are we in the estimate?**

The fifth question is the bridge between "we have a pipeline" and "we can scale a pipeline." A wired pipeline that handles 5 inbound requests per month is not yet a pipeline that handles 50. The timeline commitment is the system's honest accounting of what it would take to move from one to the other.

### The mature marketing sequence

Per Darrell's direction, the mature sequence — what the system grows into — is:

1. **Identify the service we want to offer** (Governor decision, informed by Foundation's read of capacity and Advisor's read of fit).
2. **Estimate the setup work** — what workflows, what infrastructure, what staffing, what tooling. Decompose into ITIL-style service-design elements.
3. **Estimate the time honestly** — how long from now until we can serve 5 / 50 / 500 of this customer per month, accounting for the team's actual capacity.
4. **Commit publicly to the timeline** — not a vague "coming soon" but "this service opens Q3 2027 for solo therapists; here's the waitlist."
5. **Market to the specific audience the service is for** — "if you're a solo therapist looking for X, get on this list; we open in 6 months."
6. **Execute the buildout against the committed timeline.**
7. **Open the service on time** — or notify the waitlist honestly if the timeline slips, with the new commitment.

This is the inverse of the typical startup pattern (market first, build during emergency mode). It's the discipline of a craftsman shop, not a growth hack. It's also the only pattern compatible with stewardship — promising what we can deliver, delivering what we promise.

### What this looks like inside the PWA

A future surface — the `/roadmap` or a "services" page — won't say "coming soon" with no commitment. It will say:

> Family OS · Public Beta · Q4 2027
> What it includes: [bullet list of features].
> Who it's for: families managing $5k-$15k/mo income, no W-2 complexity.
> What it costs: [TBD per Governor decision].
> Get on the waitlist: [intake form].
>
> Solo Practice Module · Q2 2028
> What it includes: ...
> Get on the waitlist: ...
>
> Landlord Module · Q3 2028
> What it includes: ...
> Get on the waitlist: ...

Each row has a date, a definition, an audience, and a connection. The dates can slip; the discipline is to update them honestly when they do.

### What this requires of Foundation + Claude

- **Foundation as Executor** maintains a `services-roadmap.json` (or equivalent) that tracks each service's current setup-state, estimated-completion, confidence-level, and last-updated date. Workflow 29 can read it. Workflow 25 (briefing sync) can refresh it.
- **Claude as Advisor** drafts the timeline estimates honestly — not optimistic, not padded — based on what the foundation docs + session notes + current code state actually show. When asked for a timeline, Claude says "I can give a low/medium/high estimate based on these inputs; pick the confidence level you want the surface to reflect."
- **Darrell as Governor** approves the public timeline. The Governor can override the Advisor's estimate (he knows things Claude doesn't), but the override is recorded so the next slippage check can compare against the original Advisor read.

### Connection to other foundations (Timeline-First specifically)

- **GOVERNANCE-EXECUTION-ADVISORY** — timeline commitments are Governor decisions; Claude advises with confidence-banded estimates; Foundation tracks the roadmap state.
- **No Promises** principle — the timeline IS the promise, made explicit and tracked. Honoring or honestly updating it is the discipline.
- **ANXIETY-CLARITY-PRINCIPLE** — the audience reading "Q4 2027" is no longer anxious about whether this service is real; they're informed about whether they want to wait or look elsewhere. Clarity is honored.
- **EXCELLENCE-STANDARD** — the craftsman pattern. Religion (the timeline is a commitment we own) AND relationship (the commitment is made warmly to a specific audience, not as legalese).

## Closing posture

Marketing is a check the system writes on the operations account. The check clears only if operations have funds. Every visible surface is an obligation. Every connection is a process. Every promise is a timeline.

The Foundation's job is to wire processes before the marketing surfaces draw on them, and to track the realistic timeline for every service-in-buildout. The Governor's job is to approve surfaces only when the processes are ready, and to commit publicly to timelines only when the Advisor's confidence + the Foundation's capacity make the commitment honest. Claude's job is to name the connection gap before it becomes a broken promise, and to draft timeline estimates the Governor can stand behind.

Wire before you write. Process before you promise. Timeline before you market. We all win. And we create. Amen.
