# Daily Family Feedback Shipping Cadence — 2026-05-29

**Triggered by Darrell via @nas while traveling, 2026-05-29:**

> "I would like to see changes daily based on feedback and inputs from our family. So the website updates and other updates are fast."

This note captures the architecture, gaps, build sequence, and risks for moving the PoeTech Family OS to a daily family-feedback-driven shipping cadence. It joins [LLM Team Shape](./2026-05-29-llm-team-shape-faster-production-deeper-testing.md) (which names the team) as the operational complement (which names how the team runs daily).

## The vision

Every family voice — Darrell's @nas drops, Christina's @cpoe drops, Christiana's drops, in-app Suggest button submissions — is captured, classified, implemented, shipped, and acknowledged within 24 hours. Family sees their input becoming product within a day. Trust and engagement compound. The product evolves at the speed of the family's lived experience with it.

This is the operational embodiment of [BUSINESS-PROCESS-CONNECTIONS](../00-foundations/_root/BUSINESS-PROCESS-CONNECTIONS.md) Timeline-First extension applied internally: the family's voices ARE the timeline commitment. Foundation honors them within a day or surfaces honestly why a particular item slipped.

## The daily cadence (target operational state)

### 7am Central — Morning digest

Foundation Agent (workflow 27) reads the last 24 hours of family voices: @nas messages from `dpoe`, `cpoe`, `christiana` (and any future family members); in-app Suggest button submissions from `/webhook/family-feedback`; captured site errors. Summarizes via Ollama 14b. Posts to Synology Chat #PoeTech-PWA-Family channel + ntfy to all family members:

> Yesterday's feedback summary: 4 items.
> 2 from Christina — Practice tab copy reads cold; demo welcome flow has too many steps.
> 1 from Christiana — mobile layout glitch on Big Picture tab when scrolling fast.
> 1 from Darrell — data-dump spec refinement for Layer 3.
> Foundation Agent queueing 2 to Claude (Christina #1, Christiana #1). Drafting 2 copy edits for approval (Christina #2, Darrell #1).

### Throughout the day

Family members drop voice memos (via Whisper STT on NAS, post-Week-1), @nas chat messages, or in-app Suggest button submissions. Foundation Agent classifies each in real time via Ollama 14b:

- **Feature request** → queue to Claude with the context loaded
- **Bug report** → file an issue, route to Code Generator with reproduction context
- **Copy edit** → Foundation Agent drafts the change inline, queues for one-click approval
- **Question** → Conversational Responder (Role 2) replies via @nas
- **Strategic input** → captured to a "for weekly review" queue, not acted on immediately

For substantive code work, Foundation Agent opens a branch + drafts the PR description with the family-voice attribution + queues to Claude. When Darrell opens Dispatch, Claude implements + Test Author writes tests + PR is opened. Code-review LLM pair runs immediately. Quality Gatekeeper runs the foundation checks. If green, Darrell sees a notification: "PR ready for review."

### 5pm Central — Review window

Foundation Agent posts a Quality Gatekeeper digest:

> 3 PRs green and ready to merge:
> #142 — Christina's Practice tab copy fix (3-line change, Foundation-screen pass, no test impact)
> #143 — Christiana's mobile layout fix (Big Picture tab, visual regression baseline updated, all 6 personas pass)
> #144 — Darrell's data-dump Layer 3 refinement (matched-services rules engine, 12 new tests, all pass)
>
> 1 PR pending review:
> #145 — your @nas request from 11:43am ("add a 'tithe' shortcut to quick-add"). Implementation drafted, tests pending Test Author session. Likely ready by 7pm.

Darrell reviews on phone, taps merge, Vercel deploys in 1-3 min.

### 9pm Central — Ship summary

Foundation Agent generates the "Today we shipped" message attributed to each family member whose feedback drove the change. Posts to family channel + ntfy:

> Today we shipped 3 changes:
> Practice tab copy refresh — Christina's feedback (live 2:43pm)
> Big Picture mobile layout fix — Christiana's feedback (live 5:11pm)
> Tithe quick-add shortcut — Darrell's @nas (live 7:42pm)
>
> Still in review: 1 PR. Carries to tomorrow's queue.

## The gaps between today and the daily cadence

### Gap 1 — Family inputs are partial

**Today:** Darrell (`dpoe`) and Christina (`cpoe`) confirmed on @nas via Synology Chat. Christiana, Christian, and Christyn untested. No in-app Suggest button anywhere.

**Family roster (verified 2026-05-29):**

- `dpoe` — Darrell (Governor, primary operator)
- `cpoe` — Christina (wife, LCSW; weighted voice on brand + UX)
- `christiana` — older daughter; UIUC fall 2026; weighted voice on mobile + next-gen usability
- `christian` — Darrell Christian Poe, twin son, 10 (`darrellpoejr@gmail.com`); seed-data interests = tech/networking/lawn-care
- `christyn` — Christyn Elaine Poe, twin daughter, 10 (`christynpoe@gmail.com`); seed-data interests = teaching/tutoring/community/pet-care

The twins are minors. Their voices belong in the family-feedback queue, but with **parental visibility**: Darrell + Christina see everything they submit. Workflow 30 already pushes ntfy on every signup; route twin submissions to the `poetech-family-feedback` topic that both parents subscribe to. No external surface for twin-attributed content until they're old enough to consent.

**Need:** Test @nas capture for Christiana, Christian, and Christyn (workflow 08 is channel-level, should already work). Add Suggest button to all PWA screens (done in-PWA, awaiting workflow 30 activation on NAS).

### Gap 2 — Foundation Agent response loop is degraded

**Today:** Workflow 27 runs but its writes to `/data/poetech-briefing/` go into a void (bind mount not added). Responses don't surface to family.

**Need:** Fix workflow 27 bind mount. Single most important gate — without this, none of the rest works.

### Gap 3 — No feedback-to-code workflow

**Today:** Foundation Agent classifies inbox thoughts and can queue to Claude. No automatic PR creation, no source-family-member tagging, no daily digest generation, no ship summary.

**Need:** Three new workflows — 30 (Family feedback intake), 31 (Daily standup digest), 32 (Daily ship summary).

### Gap 4 — Quality Gatekeeper doesn't exist

**Today:** Every PR needs Darrell's eyes for foundation-check compliance.

**Need:** Role 10 (Quality Gatekeeper) on Ollama 14b or Gemini Flash. Drafted in [AI-TEAM-DISTRIBUTION](../00-foundations/_root/AI-TEAM-DISTRIBUTION.md).

### Gap 5 — No tests on most code paths

**Today:** Smoke tests by Darrell after manual deploy.

**Need:** Test Author (Role 8) + Test Runner (Role 9) per the LLM team shape note. Visual regression suite. Without these, daily ship = daily regression risk.

### Gap 6 — Family isn't visible to each other

**Today:** Christina drops feedback in @nas; only Darrell sees it because it's his inbox. No family-shared feed.

**Need:** Family-visible feed surface in PWA (post-Week 2) AND ntfy to a family channel for all members to see ship summaries.

## The build sequence

### Week 1 post-vacation — Foundation layer (5-7 days)

1. **Fix workflow 27 bind mount.** SSH commit + recreate path (or Duplicate UI dance). This unblocks the entire response loop. Without it, nothing else matters.
2. **Add `/data/feedback/` bind mount** in same maintenance window. Used by workflow 30.
3. **Add in-app Suggest button** to all PWA screens. POSTs to `/webhook/family-feedback` with screen context, sender (from current profile), timestamp. UI is small, unobtrusive — a "Suggest" link in the corner of every tab.
4. **New workflow 30 — Family feedback intake.** Same shape as workflow 29 (waitlist) but with:
   - Sender classification (`dpoe`, `cpoe`, `christiana`, future family)
   - Screen-context tagging
   - Writes to `/data/feedback/<id>.json`
   - Pushes ntfy to family channel + Foundation Agent inbox for processing
5. **Onboard Christiana to @nas.** Synology Chat invite, test message, confirm capture.

### Week 2 post-vacation — Daily cadence loop (5-7 days)

6. **Quality Gatekeeper (Role 10)** on Ollama 14b OR Gemini Flash. Wired as GitHub PR check. Runs Foundation-screen + EXCELLENCE-STANDARD + BUSINESS-PROCESS-CONNECTIONS five-question test on every PR diff.
7. **Test Author (Role 8) + Test Runner (Role 9)** scaffold. Per [LLM team shape note](./2026-05-29-llm-team-shape-faster-production-deeper-testing.md).
8. **New workflow 31 — Daily standup digest.** 7am Central cron. Reads `/data/feedback/` + `/data/chatin/` from last 24h. Summarizes via Ollama 14b. Posts to family channel + ntfy.
9. **New workflow 32 — Daily ship summary.** 9pm Central cron. Reads GitHub commits + Vercel deploys + closed PRs. Generates "today we shipped" message attributed per family member.

### Week 3 post-vacation — Sustained daily operation (5-7 days)

10. **Parallel Claude Code worktrees pattern in production.** 2-3 feedback items implemented in parallel per Dispatch session. Documented in CLAUDE.md.
11. **Auto-PR creation from Foundation Agent.** When a feedback item is classified `actionable-code-change`, Foundation Agent drafts the PR description + opens a branch + queues to Claude with context already loaded. Darrell's Dispatch session picks it up with one click.
12. **Family-visible feed surface in PWA.** Small "What's shipping this week" widget on the picker landing. Pulls from workflow 32's output. Family sees what's being built; external visitors also see signs of active improvement.

### Estimated calendar to first daily-cadence day

3 weeks of focused post-vacation work. First true daily ship day: ~21 days after Darrell returns and starts the buildout.

## Risks + mitigations

### Daily ship + no tests = regression risk

**Mitigation:** Test Author (Role 8) + Quality Gatekeeper (Role 10) land in Week 1-2 BEFORE daily cadence goes live in Week 3. No daily ship without test coverage on the changed surface.

### Family feedback volume could overwhelm Darrell

**Mitigation:** Foundation Agent auto-implements trivial changes (typo fixes, copy tweaks under 10 words, color adjustments within the existing palette). Only substantive changes need Governor review. Daily volume estimated: 3-7 PRs initially, scaling with family engagement.

### Family members might disagree on direction

**Mitigation:** Governor (Darrell) makes the call per [GOVERNANCE-EXECUTION-ADVISORY](../00-foundations/_root/GOVERNANCE-EXECUTION-ADVISORY.md). Foundation Agent surfaces the disagreement transparently rather than resolving silently. Christina's voice on brand/UX has weighted authority per the conversation 2026-05-28. Christiana's voice on next-generation usability has weighted authority for mobile + accessibility surfaces.

### Shipping every day without strategic anchor drifts the product

**Mitigation:** Weekly review every Sunday. Darrell + Christina (and Christiana when relevant) look at the week's ships against the data-dump spec + foundation principles. Course correct. The week's strategic anchor is named ahead of time so daily ships stay aligned.

### External users could swamp the same intake once promoted

**Mitigation:** Foundation Agent classifies by sender-trust-tier. Family voices route to immediate-priority queue; external user voices route to a different queue with a different SLA. Family-first per SKOS principle, but external users get honest commitment per BUSINESS-PROCESS-CONNECTIONS Timeline-First.

## How qualitative + quantitative discipline is preserved

**Qualitative:**

- Quality Gatekeeper (Role 10) enforces foundation principles on every PR pre-merge.
- Test Author (Role 8) writes tests against persona-specific expectations.
- Weekly strategic review keeps daily ships aligned to longer-arc spec.
- Foundation Agent's classification is transparent — every routing decision is logged.

**Quantitative:**

- Ollama (sovereign, free) handles classification, digest generation, Quality Gatekeeper, Test Runner triage.
- Claude reserved for substantive code generation + complex test authoring.
- Per-tenant token budgets (Phase 5 of n8n scaling) make cost visible even at daily cadence.
- Daily ship rate becomes a quantitative metric — track via workflow 32's output over time.

## Connection to other foundations

- **AI-FOUNDATION-INTERNAL-OPERATIONS** — daily cadence IS the foundation operating the system. Every workflow named here is the foundation acting; browsers/humans only for the merge decision and the strategic anchor calls.
- **GOVERNANCE-EXECUTION-ADVISORY** — Darrell as Governor approves the cadence + merges. Foundation as Executor runs workflows 30/31/32. Claude as Advisor writes code + reviews drafts.
- **BUSINESS-PROCESS-CONNECTIONS** — family voice is the connection that the system MUST wire. Without the response loop, the family stops giving feedback (broken promise). With it, family voice → product change is the most powerful connection in the system.
- **EXCELLENCE-STANDARD** — religion AND relationship. Daily cadence is the religion (discipline). Family voice attribution + ship summaries are the relationship (warmth, visibility, gratitude).
- **ANXIETY-CLARITY-PRINCIPLE** — anxiety reduces when family sees their input becoming product within a day. Clarity wins. The 7am digest + 9pm ship summary answer what/when/why/how about every voice they raised.
- **SEED-DATA-AS-ASPIRATION** — the daily cadence itself becomes part of what the seed teaches. New users see "What's shipping this week" and understand this product is actively built BY a family FOR families.

## Open governance decisions queued for post-vacation

1. **Family Suggest button placement** — corner of every tab? Bottom of every screen? Floating action button? Recommendation: floating action button, lower-right, dismissible.
2. **In-app Suggest button identity** — does it require login (post-Phase 4 multi-tenant) or work anonymously today (using profile from localStorage)? Recommendation: works with current profile for now; tied to authenticated identity once Layer B PIN auth ships.
3. **Family channel format** — Synology Chat group, ntfy topic, or new dedicated PWA family-feed surface? Recommendation: all three; redundancy is good for family adoption.
4. **Christiana onboarding cadence** — Synology Chat for her may not be the right surface (she's 18, headed to UIUC). Could be SMS-to-@nas via a Twilio webhook, or in-app Suggest button only. Discuss with her directly.
5. **Daily ship cap** — at peak, how many PRs per day before the Governor's review burden becomes unsustainable? Recommendation: 5-7 PRs/day target; throttle via Foundation Agent prioritization if exceeded.

## Closing

Daily family-feedback-driven shipping is the operational fulfillment of "we build for our family, in our family, with our family." The architecture above makes it real. Three weeks of focused post-vacation work; sovereignty preserved; quality enforced; family voice honored.

Wire before you write. Process before you promise. Timeline before you market. Family voice before all of it. We all win. We create. Amen.
