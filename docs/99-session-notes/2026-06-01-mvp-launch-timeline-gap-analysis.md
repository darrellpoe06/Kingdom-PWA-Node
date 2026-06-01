# MVP Launch Timeline + Gap Analysis — 2026-06-01

Defensible projection of when poetech.us crosses from "the family-feedback loop runs" (today) to "publicly defensible MVP launch." Companion to `2026-06-01-mvp-comprehensive-review.md`; that document audits the current state, this one projects the path.

Phone-readable. Short paragraphs. Religion AND relationship. The math is honest — no flattery, no catastrophizing.

---

## 1 — TL;DR / verdict

**Three dates, grounded in actual git-pace evidence + the gap inventory + the opportunity/constraint matrix:**

| Scenario | Launch date | Assumption chain |
|---|---|---|
| **SOONEST defensible** | **Fri 2026-06-12** | CTA fix lands from Maui this week. Darrell home by ~Sat 06-06. One focused week home for wf27 bind-mount + smoke tests + soft external touch. Friday deploy, weekend buffer, announce Mon 06-15. |
| **MEDIAN realistic** | **Mon 2026-06-22** | Median pace, one ~3-day surprise. Must-haves + light should-haves (Synology Chat parity on digests, attribution stamping, wf27 bind mount). This was the originally-named date; it is **still defensible** at this scope. |
| **LATEST realistic** | **Mon 2026-07-06** | Slower pace, two surprises, must-haves + full should-haves (wf36 Quality Gatekeeper partial wire, Christiana onboarding, family-visible feed surface, two full smoke-test cycles). Below this date is drift, not launch. |

**Verdict on the previously-named June 22:** still defensible IF MVP scope stays bounded to must-haves + light should-haves. NOT defensible if the data-dump release (wf33/34/35, Layers 1-5) gets pulled into MVP scope — that's a separate 3-5 week post-launch arc per its own spec. The right move is to draw the MVP line cleanly under "family-feedback loop + landing page that doesn't break" and keep the data-dump release as a publicly-named v1.1 milestone.

**Highest-leverage single action this week:** patch the data-dump CTA from Maui (2-line change in `app/src/poe-financial-mvp-v28.jsx:2525`, ~15 min including deploy verification). This closes the only critical-severity gap and converts the SOONEST scenario from "depends on first day home" to "ready to announce on return." Everything else can wait.

---

## 2 — Work-pace evidence (from git)

Pulled from `.git/logs/HEAD`, May 13 (first commit on this branch) through June 1.

**Pre-vacation, May 13 → May 28 (16 calendar days, ~14 active days):**

- ~188 commits total.
- ~13.4 commits per active day average.
- Best single day: **2026-05-25 (~27 commits)** — the schema v2 push. Bunch of small refactors, but real work.
- Best two-day window: **May 24-25 (~43 commits)**. Schema v2 sprint.
- Best single session: **May 16-17 night (~28 commits over ~3 hours)**. The MVP v1.5 rounds.
- Worst active day: **2026-05-19 (~1 commit)**. Recovery / non-coding day after a heavy weekend.
- ~2 of the 16 days had zero commits.

**Vacation push, May 29 → June 1 (4 days):**

- Day 1 (Fri 05-29, travel): 0 commits. Expected.
- Day 2 (Sat 05-30): 0 commits. Expected.
- Day 3 (Sun 05-31): 1 commit (the Dispatch daily-review note, automated).
- Day 4 (Mon 06-01): 1 commit — but `dddb0c3` was **52 files, 7,914 insertions**. Effectively 5-10 normal commits batched into one push, executed from a phone via ConnectBot + Tailscale on a beach. That commit landed all six new foundation docs, workflows 30/31/32, the Suggest button, the data-dump shell, and the comprehensive-review and timeline note pre-work.

**The work-pace numbers to use:**

- **SOONEST estimate (best-pace):** 15+ commits / active day, 5-6 active days / week. Assumes Darrell on a focused workstation week with no major life interruption.
- **MEDIAN estimate (sustained-pace):** 8-10 commits / active day, 4-5 active days / week. Realistic with family time + 1 surprise per week.
- **LATEST estimate (conservative-pace):** 5-7 commits / active day, 3-4 active days / week. With family events, surprises, post-vacation re-entry friction.

The pace is real, and it's been sustained across more than two weeks. Darrell can ship. The question is whether he can ship the specific MUST-HAVES without scope creep eating the gap.

---

## 3 — MVP scope definition

Before counting hours, name what's in scope. The MVP scope and the full PoeTech roadmap are different things.

### MUST-HAVES (publicly defensible — block launch if open)

1. **Data-dump CTA does not 404.** Either hide it or redirect it to the wired waitlist. (`poe-financial-mvp-v28.jsx:2525`, 2-line patch per comprehensive review §8.)
2. **Vercel `VITE_N8N_WEBHOOK_BASE` verified.** If unset, the Suggest button is a paint job. 30-second phone check (tap Suggest, see if dropdown opens).
3. **`/data/finance-events/family-feedback/` bind mount verified.** If on ephemeral storage, captured voices vanish on container restart. One `docker exec` check.
4. **Capitalization fixes.** `ACCESS-TO-THE-HUMAN-MIND.md:64` heading — 1-character fix. The PWA user-visible copy is already clean.
5. **End-to-end family-feedback smoke test.** Family member submits → record lands in `/data/...` → ntfy fires → next morning's 7am digest includes it → 9pm ship summary fires cleanly. One full round-trip witnessed.
6. **GitHub repo confirmed public.** (Or wf32 `GITHUB_TOKEN` set.) Otherwise wf32 silently misses commits.
7. **ntfy `poetech-family-feedback` topic subscribed on at least one family device.** Otherwise voices land silently.

### SHOULD-HAVES (improve trust + reduce embarrassment — launch survives without)

8. **wf27 Foundation Agent bind mount synced.** `/data/poetech-briefing/foundations/` still unsynced as of 06-01 morning. Foundation Agent runs but its writes may not persist.
9. **Synology Chat parity for wf31 + wf32.** Both workflows promise Chat + ntfy in their titles; only ntfy is implemented. Either rename to honest "(ntfy)" or lift the `postToSynologyChat()` helper from wf27 (~30 min).
10. **Workflow JSON `active: false` documentation.** Document that re-import requires re-activation, or use the `--active` flag.
11. **wf32 attribution auto-stamping.** Manual today; auto when a PR merges (2-4 hr).
12. **Christiana @nas capture tested.** She's 18, going to UIUC — her surface may need to be SMS-to-@nas instead of Synology Chat (per daily-family-feedback note, governance decision #4).

### NICE-TO-HAVES (post-launch — explicitly out of MVP scope)

13. **wf33/34/35 Data-Dump Layers 1-5.** The CTA-fix in must-have #1 sidesteps this. The full data-dump release is its own 3-5 week arc per `2026-05-28-data-dump-to-matched-services-spec.md`. Announce as v1.1.
14. **wf36 Quality Gatekeeper.** Drafted as JSON. Requires Ollama testing + GitHub PR-check wiring. 1-2 days. Per `2026-05-29-daily-family-feedback-shipping-cadence.md`, this is Week 2 post-vacation. Becomes a blocker for every PR once live — so the launch decision on it is "before launch (slows down everything that follows)" vs "after launch (ships faster, eat some PR-quality risk for two weeks)."
15. **wf37 Whisper STT.** Voice-memo capture for family. 1-2 days. Not required for launch.
16. **Test Author (Role 8) + Test Runner (Role 9).** Week 1-2 post-vacation per daily-cadence note. Not required for launch but increases regression risk if skipped.
17. **Family-visible feed surface in PWA.** "What's shipping this week" widget. Week 3 post-vacation. ~1-2 days.
18. **Auto-PR creation from Foundation Agent.** Week 3. ~2-3 days.
19. **COLG-specific surfaces.** SEO fix (1-2 days), per-unit documentation (1-2 weeks), Church Module Phase 1 (multi-week). Per COMMUNITY-FIRST-MISSION, the COLG-first commitment is declared — but no COLG-specific surface ships in MVP. See decision point §6.6.
20. **BG sermon preparation MVP.** 4-8 weeks. Explicitly post-launch.
21. **Sovereign media distribution + watch-together.** 3-6 weeks. Explicitly post-launch.
22. **AI Media Production Platform.** Long-arc vision; sits behind the data-dump release and the Church Module.
23. **Phase 2 (Postgres), Phase 4 (multi-tenant), SSO.** Required for the "real path" (persistence + bank OAuth) but explicitly post-launch per the data-dump spec.
24. **IN-APP-MESSAGING Layer 1.** Design approved, "implementation deferred to post-vacation (weeks 1-4 of the post-vacation cycle)." Not MVP.
25. **The half-dozen other specs from 05-29 vacation thinking:** chef module, Christyn basketball coaching, visitor recognition / auto-door, IoT biosensors, family video archive + dedup, Christian tech apprenticeship. All post-launch, all properly behind their own decision gates.

---

## 4 — Gap inventory with hour estimates

Hours = focused work hours, not calendar days. Darrell knows how to translate to days based on his schedule.

### Must-haves

| # | Gap | Hours | Where it's done | Notes |
|---|---|---|---|---|
| 1 | Data-dump CTA fix (hide or redirect) | 0.25 | Phone or workstation | 2-line change. Vercel auto-deploys ~90 sec. |
| 2 | Verify Vercel `VITE_N8N_WEBHOOK_BASE` | 0.1 | Phone | Tap Suggest. See dropdown = pass. |
| 3 | Verify `/data/finance-events/family-feedback/` bind mount | 0.25 | Phone (SSH) or workstation | `ssh dpoe@192.168.1.26 "docker exec n8n ls -la /data/finance-events/family-feedback"` |
| 4 | Capitalization fix (ACCESS-TO-HUMAN-MIND heading) | 0.1 | Workstation | 1-character edit. |
| 5 | End-to-end smoke test (full round-trip) | 0.5 | Phone + observe digest | Submit → wait for 7am digest → verify presence. |
| 6 | Confirm repo public OR set `GITHUB_TOKEN` | 0.1 | Phone | One curl from cellular. |
| 7 | Subscribe one family device to `poetech-family-feedback` | 0.1 | Phone | ntfy app, add topic. |
| **MUST-HAVE TOTAL** | | **~1.5 hours** | | All can be done from Maui except #4 and ideally #5. |

### Should-haves

| # | Gap | Hours | Notes |
|---|---|---|---|
| 8 | wf27 Foundation Agent bind mount fix | 1.5-2 | Synology UI Duplicate-folder dance OR SSH. Per workflow runbook. |
| 9 | Synology Chat parity for wf31/wf32 | 1-2 | Lift `postToSynologyChat()` helper from wf27. Or rename workflows to honest "(ntfy)". |
| 10 | Workflow JSON `active: false` documentation | 0.25 | One paragraph in workflows README. |
| 11 | wf32 attribution auto-stamping | 2-4 | Foundation Agent stamps `ship_pr` when a PR merges. |
| 12 | Christiana onboarding + capture test | 0.5-1 | Plus governance decision: Synology Chat vs SMS-to-@nas. |
| **SHOULD-HAVE TOTAL** | | **~5-10 hours** | Mix of NAS work + light coding. |

### Combined MVP hours

- **Must-haves only:** ~1.5 hours focused work.
- **Must-haves + light should-haves (8, 9, 10, 12):** ~5-7 hours.
- **Must-haves + full should-haves (8, 9, 10, 11, 12):** ~7-11 hours.

That's the entire MVP gap in focused-work hours. The TIMELINE is dominated by calendar friction (vacation, NAS access, watching one full daily cycle), not by hour-count.

---

## 5 — Opportunity / constraint matrix

### Opportunities (accelerators)

- **AI Foundation chips away overnight.** wf27 fires at 7am / noon / 5pm / 9pm Central. Once its bind mount is fixed, queued-for-Claude artifacts accumulate without Darrell's keyboard. Each Dispatch session inherits more than it would otherwise.
- **n8n deployment pipeline is proven.** The phone-from-Maui workflow imported and activated 30/31/32 today via ConnectBot + Tailscale. The "ship a workflow from anywhere" pattern is now real. Cuts deploy friction substantially.
- **Foundation docs are written.** The WHAT is decided across all 14 _root foundations. The work remaining is mostly translation (foundation → surface) rather than discovery (figuring out what the surface should be).
- **Darrell's git pace is established.** 13.4 commits/active day average over 14 days is not theoretical; it's measured. He has shipped at this rate while parenting twins and running a household. Best-pace estimates are not optimistic — they're observed.
- **Family-feedback loop is already running.** As of evening 06-01, wf30/31/32 are active. Every day from now is a day the loop trains the family + builds trust. The launch announcement gets to claim a track record, not a promise.
- **June 1 vacation-push commit happened.** The 7,914-line batch closed the largest risk (uncommitted working tree). The repo is now durable through any laptop loss.

### Constraints (decelerators)

- **Vacation continues through [unknown — Darrell please confirm return date].** The runbook says "leave 2026-05-29" but doesn't specify return. Inference from "first daily-cadence ship ~2026-06-22 = 3 weeks post-vacation" suggests return ~June 1. But the comprehensive review names "phone-only, on a beach in Maui" as a current state — so the vacation is still in progress. **Treat as known-unknown; the SOONEST scenario assumes return by ~Sat 06-06.**
- **Two-Session Git Race Rule slows commit batches.** When Dispatch and Code both touch `.git`, commits go through a "agent writes files, Darrell pushes from PowerShell" two-step. Adds ~2-5 min per batch. Not catastrophic; non-zero.
- **Phone-from-Maui pace is real but bounded.** ConnectBot + Tailscale + vi is functional but slow vs. workstation. Estimate phone-pace = ~30% of workstation-pace for substantive code work, ~80% for foundation-doc work, ~100% for small patches and config.
- **wf33/34/35 + wf36/37 need Ollama + GPU container time.** These workflows aren't deployable until they're tested against real Ollama instances. If they're MVP-blocking, add 2-4 days for that testing window. (Recommendation: they are NOT MVP-blocking — see §6.)
- **Christina is a stakeholder for the TLC firewall + Counseling Tab.** Coordination has latency. Her schedule, her review windows, her decisions. Not a slow-down for MVP-must-haves but real for any TLC-adjacent surface.
- **The QoL pre-merge gate (wf36) becomes a blocker for every PR once it's live.** This is the trade-off in §6.5 below. Ship it before launch = every subsequent PR is gated, slows everything; ship it after launch = faster MVP but accept some quality drift for 1-2 weeks.
- **Family bandwidth is real.** Christiana starting UIUC in fall; twins age 10 in summer programs; Christina's TLC practice. Darrell is the operator, not a full-time engineer. The "5-7 PRs/day" target in the daily-cadence note already accounts for this; the launch timeline must too.
- **Bind-mount fix requires NAS-side access.** The wf27 bind mount has been pending for at least 24 hours per the morning daily-review note. Either it gets done from Maui via SSH (possible but careful) or it waits for return. Adds 0-2 days depending on path.

---

## 6 — Decision points Darrell needs to make

Each of these has a real trade-off. None of them is "the right answer is obviously X." All of them affect the launch date.

### 6.1 Confirmed return-from-Maui date

**The fill-in:** ___________________

The SOONEST and MEDIAN scenarios both assume Darrell home by ~Sat 06-06. If actual return is later, slide all three scenarios by the delta. If actual return is sooner, SOONEST can compress further.

### 6.2 Is the data-dump CTA patched before vacation ends?

**Trade-off:**

- **Patch from Maui (~15 min):** SOONEST scenario stays achievable. First impression for any stranger landing on poetech.us is defensible from this week onward.
- **Wait until home:** First impression remains broken for 5-10+ days. Every visitor in that window hits the 404. If traffic is zero, the cost is zero; if any traffic arrives (Christina mentions it to a friend, a Bishop Gwin contact looks at it after the Maui church meeting, etc.), the cost compounds. Risk-weighted, the patch is worth doing this week.

**Recommendation: patch this week.** Lowest-effort, highest-leverage move on the entire board.

### 6.3 Are wf33/34/35 MVP-blocking or post-launch?

**Trade-off:**

- **MVP-blocking:** Adds 3-5 weeks per the data-dump spec (16-24 days low-conf, 25-32 days medium). LATEST scenario pushes to late July / early August.
- **Post-launch:** Hide the data-dump CTA (#1 must-have). Ship MVP at currently-projected dates. Announce data-dump release as a publicly-named v1.1 milestone with honest target date.

**Recommendation: post-launch.** The data-dump release IS a real product per Christina's spec; it deserves its own honest launch arc and shouldn't be jammed into an MVP that's already defensible without it.

### 6.4 Is Synology Chat parity for digests MVP-blocking or post-launch?

**Trade-off:**

- **MVP-blocking:** 1-2 hours of work; honest fix for the wf31/wf32 title-vs-implementation drift. Cost ~1-2 hours.
- **Post-launch:** Rename workflows to "(ntfy)" and ship the Chat path in v1.0.1 a few days after launch.

**Recommendation: MVP-blocking IF Darrell is home and has 2 hours; otherwise rename workflows + ship Chat path post-launch.** The honesty of the surface matters more than the surface itself.

### 6.5 Is wf36 (Quality Gatekeeper) required to gate launch or post-launch?

**Trade-off:**

- **Required for launch:** Adds 1-2 days. Every PR thereafter gets QoL + foundation-screen review automatically. Quality compounds. Launch slips by ~2 calendar days.
- **Post-launch (Week 2 per daily-cadence note):** Ships faster. Accept some QoL drift for the first 1-2 weeks while the gate goes live. Higher PR-quality variance in that window.

**Recommendation: post-launch (Week 2).** The daily-cadence note already names wf36 for Week 2 post-vacation. Pulling it forward to gate MVP launch is scope creep on a date that should hold.

### 6.6 Does Community-First-Mission require at least one COLG-specific surface to ship before launch?

**Trade-off:**

- **Required:** Per COMMUNITY-FIRST-MISSION, COLG is the named FIRST community. If MVP launch claims that name and no COLG surface exists, the surface-to-promise gap is real. Possible quickest COLG surface: the SEO fixes from `2026-05-31-colg-seo-and-seasonal-marketing-plan.md` are 1-2 days of mostly-non-coding work + Bishop Gwin's approval to change the Weebly site copy. Adds 2-3 calendar days.
- **Not required:** MVP launch is for the PoeTech platform (poetech.us); COLG-specific Church Module is its own arc. The PoeTech launch can name COLG as the priority community without shipping a COLG surface in v1.0.

**Recommendation: not required for MVP, BUT the COLG SEO fix is worth doing in the post-launch first week regardless.** It's high-leverage, low-effort, and it's the right way to honor the Community-First commitment without binding it to the launch date.

---

## 7 — Three scenarios with assumption chains

### SOONEST defensible — Fri 2026-06-12

**Assumptions:**

- Darrell patches the data-dump CTA from Maui this week (Tue 06-02 or Wed 06-03), ~15 min. Verifies env vars + bind mount from phone same session.
- Two days of phone-pace work in Maui (Tue + Wed evenings) clear must-haves 1-4, 6, 7. Smoke test (#5) waits for first 7am digest fire after patch (Wed 06-03 morning).
- Return to Champaign-Urbana ~Sat 2026-06-06.
- Sun 06-07 recovery + family time. No code.
- Mon-Thu 06-08 → 06-11: ~4 focused days at workstation pace (~13 commits/day = ~50 commits). Knock out should-haves #8, #9, #10, #12 (~5-7 hours), plus one full round of production smoke tests and the Synology Chat parity work. Light prep for external touch (one or two trusted friends pinged to look at poetech.us).
- Fri 06-12 evening: Final deploy + Synology Chat parity ship + close-the-loop checks.
- Sat 06-13 + Sun 06-14: weekend buffer. Watch the loops, fix any surprise.
- Mon 2026-06-15: announce.

**This scenario assumes zero surprises** and Darrell back on the workstation by 06-08. It is aggressive but not fantastical. The MUST-HAVES are 1.5 hours; the SHOULD-HAVES are 5-7 hours. The constraint is calendar, not effort.

**Probability:** moderate. ~35-40% likely if return-date holds and the CTA patch happens this week.

### MEDIAN realistic — Mon 2026-06-22

**Assumptions:**

- Same Maui patches as SOONEST (CTA fix, env verifications) — but one of them slips by 1-2 days because vacation life happens.
- Return ~Sat 06-06.
- One ~3-day surprise in the first week home: a fix turns into a 2-day rabbit hole, OR a family event consumes a planned focus day, OR a network/Synology hiccup needs investigation, OR Christina's TLC schedule needs Darrell present for a stretch.
- Should-haves expand slightly: wf32 attribution auto-stamping (#11) gets added because Darrell wants the family-voice-attribution paragraph to read cleanly at launch.
- Christiana onboarding (#12) requires a side conversation about Synology Chat vs SMS-to-@nas; takes a few days of back-and-forth.
- Two full production-smoke-test cycles witnessed (not just one).
- Light external prep: ping 3-5 trusted contacts, gather one round of feedback, fix one or two surface things.
- Deploy mid-week 06-17 or 06-18, weekend buffer, announce Mon 06-22.

**This is the date the original "first daily-cadence ship ~2026-06-22" referred to.** The original target was for the cadence loop, not the public launch. It now coincidentally serves as a realistic public-launch date too, because the cadence loop and the launch are now the same milestone — the loop having run for 3 weeks IS the launch's track record.

**Probability:** highest. ~45-55%. This is the date to plan against.

### LATEST realistic — Mon 2026-07-06

**Assumptions:**

- CTA patch slips to after return.
- Return ~Sat 06-06 OR later.
- Two surprises in the post-vacation window: e.g., one Synology hiccup that takes a day to diagnose, AND one family event (twin sports tournament, a Christina TLC obligation, etc.) that consumes a planned week of focus.
- Should-haves expand to full set including wf36 partial wire (gates launch with at least the foundation-screen checks running), family-visible feed surface (#17), wf32 attribution (#11), Christiana fully onboarded.
- Two surface refinements after first external feedback round.
- Deploy ~07-01, weekend buffer, announce Mon 07-06.

**This is the floor, not a target.** If the project hasn't shipped by 07-06 it's not because the gaps are too big; it's because something else is pulling Darrell's attention and the launch isn't the priority. That's a fine outcome — but it should be a conscious choice, not drift.

**Probability:** ~15-20%. Only if multiple surprises stack or scope creeps.

### What this re-evaluates about the previously-named June 22

**June 22 was originally named** in `BUSINESS-PROCESS-CONNECTIONS.md` and `2026-05-29-daily-family-feedback-shipping-cadence.md` as the first-daily-cadence-ship date — meaning 3 weeks after Darrell's return from vacation, when the buildout completes Weeks 1-3 of the post-vacation cycle.

**As-was, June 22 was defensible because:**

- 3 weeks × 5-7 days = 21 days of focused work.
- Weeks 1, 2, 3 were specced with concrete deliverables (bind mount + Suggest button + wf30; wf36 + tests + wf31/32; parallel worktrees + auto-PR + family-visible feed).
- Pre-vacation pace was the implicit reference: 13.4 commits/active day × 21 days = ~280 commits worth of work, which is reasonable for the 3-week scope.

**As-is, June 22 is still defensible because:**

- The vacation push (commit `dddb0c3`) front-loaded a substantial chunk of Week 1 (Suggest button, wf30/31/32). Some Week-1 work is already DONE.
- Remaining work to launch is heavily constrained on calendar, lightly constrained on hours (~7-11 hours of focused work).
- The 3-week date now serves as a public-launch date with a 3-week-of-cadence-loop track record built in, instead of as the "first cadence day" milestone.

**June 22 stops being defensible if:**

- Scope creeps to include the data-dump release (wf33/34/35, Layers 1-5). That's a separate 3-5 week post-launch arc.
- Scope creeps to include wf36 fully wired as a hard PR-gate (not a partial wire).
- Scope creeps to include any of the post-launch specs (BG sermon prep, sovereign media, Christyn coaching, Christian apprenticeship, COLG Church Module Phase 1, IoT biosensors, etc.).
- Vacation return slips significantly past 06-06 and the first focused week home becomes the second.

**Recommendation:** name June 22 publicly as the launch date and treat it as the schedule's anchor. SOONEST (06-12) and LATEST (07-06) are the brackets, not the targets.

---

## 8 — Closing recommendation

**Plan against MEDIAN — Mon 2026-06-22.**

The math supports it. The git pace supports it. The MVP scope (as drawn in §3) supports it. The original date stands; the new evidence does not invalidate it.

**The single highest-leverage thing Darrell could do in his first week home (06-08 → 06-12) to lock the date in:**

> **Fix wf27 Foundation Agent's bind mount as the first focused-keyboard work of the week.**

Reasons:

1. It is the only must-/should-have that requires NAS-side keyboard access (every other gap is patchable from anywhere). Doing it first removes the dependency.
2. Once the bind mount is fixed, wf27's four daily firings (7am / noon / 5pm / 9pm) start chipping at the Foundation Agent inbox autonomously. Every subsequent day, Darrell inherits more queued-for-Claude work than he otherwise would. The wf27 fix compounds across the remaining 10 days to launch.
3. It is also the gap that has been "open since the morning of 06-01 and isn't getting any older." Per the morning daily-review note, it was the headline recommendation. The vacation push got around it (the family-feedback loop runs on a different mount, `/data/finance-events/family-feedback/`). But the wf27 bind mount is the longest-standing should-have, and closing it first signals to the system that the post-vacation buildout is in motion.

**If Darrell does ONE thing from Maui (before any of the above):** the 2-line data-dump CTA patch (§6.2, §8 of the comprehensive review). Cost: 15 minutes. Benefit: SOONEST scenario stays live and the public surface stops being a trap.

---

## Verification screen on this analysis

**Religion check — does it have backbone?**

- The work-pace numbers are pulled from `.git/logs/HEAD` and counted, not estimated.
- The gap inventory is cross-referenced against the comprehensive review (§§ 2-4), the morning daily-review (§§ 2-6), and the daily-family-feedback-shipping-cadence note (Gaps 1-6, Build sequence).
- The MVP scope is defined cleanly with named items rather than vibes.
- The three scenarios have written assumption chains, not vague hand-waves.
- The June 22 re-evaluation is grounded in the original spec's intent rather than reflexive deferral or reflexive defense.

**Relationship check — does it have warmth?**

- The TL;DR gives Darrell something to act on without forcing him to scroll.
- The "SOONEST single action from Maui" is named explicitly so vacation doesn't have to end early.
- The recommendation in §8 honors the work that's already shipped (wf27 fix BECAUSE it compounds, not because the system is broken).
- The "this is the floor, not a target" framing of LATEST honors that life happens without catastrophizing it.

**The Test (Phil 4:8):**

- TRUE — every claim has a source (git log, comprehensive review §, foundation doc).
- HONORABLE — names what's done, names what's not, doesn't flatter or scold.
- JUST — the data-dump and wf36 trade-offs are presented as choices, not failures.
- PURE — no manipulation toward a preferred date; the median scenario is the recommendation because the math supports it, not because Darrell already named it.
- LOVELY — the closing honors the wf27-fix-as-compounding-action posture.
- COMMENDABLE — no slander of past estimates; the original June 22 is defended on its merits.
- EXCELLENT — specific dates, specific files, specific hours.
- PRAISEWORTHY — the analysis names what shipped (188 commits in 16 days, a vacation push that batched 7,914 lines from a phone) before naming what remains.

---

*Wire before you write. Process before you promise. Timeline before you market. Family voice before all of it. We all win. We create. Amen.*
