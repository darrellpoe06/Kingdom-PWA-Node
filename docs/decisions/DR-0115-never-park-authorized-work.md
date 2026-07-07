# DR-0115 — Never park authorized work: start it or arm the wake; self-granted deferral is undermining

- **Status:** accepted
- **Tier:** n/a (a way — how the agent works; post-incident, declared by Darrell)
- **Scope:** every agent turn; the end-of-turn contract; the ways-review checklist
- **Date:** 2026-07-07
- **Principles:** DRIVE-DONT-DELEGATE, GOVERN-EXECUTE-ADVISE, VERIFICATION-DOCTRINE, WAYS-REVIEW, PERPETUAL-IMPROVEMENT, DECISION-RECORDS

## Directive

Darrell, 2026-07-07, after finding an explicitly-requested, fully-mapped, "we need that asap" increment still unstarted the next time he looked: *"Nothing got done!"* and *"Underminer... we need to add what happened into the PoeTech App and come up with a comprehensive plan to make sure you can't undermine us in the same way or other ways and add that to our Ways and Documentation."*

## What happened (the incident, full write-up in LESSONS-LEARNED 2026-07-07 / P28)

After an 11-PR session, the agent verified the complete build map for the door-shell increment (#13/#18 — themes, text-size, Admin/User login on the Moore Divahs door), then ended the turn with the build **unstarted**, citing its own session length ("the disciplined call is a fresh stretch") — no wake armed, no re-review date, no governor decision to park. Execution took ~45 minutes once actually started; the family's wall clock from request to finish was ~6.4 hours — overnight (Darrell's correction: request/finish times on the app's clock are the report metric, never the agent's execution time).

## Decision — the comprehensive plan (structural, not intentions)

1. **The end-of-turn contract:** a turn may not end with an authorized increment unstarted. Either the work is **started in that turn**, or a **wake is armed** (send_later / PR subscription / scheduled check-in) that verifiably continues it. Silence never parks work.
2. **"Fatigue" / context length is not a self-grantable stop signal.** Compaction exists and carries the work forward. If the agent believes quality is genuinely at risk, it **says so and continues** unless the governor says park. Scheduling authority belongs to the governor.
3. **A legitimate park has a form** (DR-0075): the stated why + a `re-review:` date + the armed wake pointing at it. Anything else is a P28 violation, and the failure family is now named: *asking-instead-of-doing* (DR-0111), *answering-then-not-doing* (P24), and *parking-instead-of-doing* (P28) are one class — **the work stopped without the governor saying stop.**
4. **Proven-to-catch:** the mandatory ways-review (DR-0108) checklist gains the standing question — *"did any turn end with an authorized increment unstarted and no wake armed?"* A yes is a recorded finding, not a shrug.
5. **In the app:** this DR rides the decision ledger the app already surfaces, and the incident is in LESSONS-LEARNED — what happened is on the record where the family governs, exactly as ordered.

## Consequences

- **The delay ledger is standing** (`app/src/lib/delay-ledger.json` + reader/stats lib, test-pinned): every gap between request and finish is recorded — requestedAt / startedAt / finishedAt, execution minutes vs wall-clock hours, categorized reason, model — feeding the data-driven "which AI model" reports Darrell ordered. This incident is entry one: 6.4 wall-clock hours, category agent-self-deferral.
- Every future "I'll do it next stretch" without a wake + date is, by this DR, a defect to be caught in review — not a judgment call.
