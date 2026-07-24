# Time Stewardship — Gaps Analysis, Methods, Metrics & Strategy

**Ari (system voice) · 2026-07-24 · Layer 4 working artifact · pairs with DR-0233**

Mandate (Darrell, 2026-07-24, with three screenshots of the University of
Illinois Student Affairs leave system): *"There are a lot of time keeping types
of software; we need a module/s for the PoeTech App and the family of Apps and
users… review the comprehensive project historical events and intended current
and future workflows and implement a gaps analysis… meaningful methods and
metrics… robust and lightweight… rigorous founder-protection rationale…
potential clients and how their connections impact exponentially."*

## 1. SHOULD — what the reference system proves people need (traced)

From the screenshots (Submit Days / Absence Graph / balances): submit a day or
part-day off **by type** with a note; **approval flow** with a named approver;
approved entries cancellable only by a supervisor; **accrual balances**
(balance forward + accrued − used = balance on date, in days or hours);
**team absence graph** with a color legend; FMLA-style flags with increment
rules. This is the shape working adults already know — church staff included.

## 2. ARE — the honest historical review (what the platform already carries)

- `lib/engagement-guard.js` (DR-0232 era): volunteers + 1099 on the same
  projects, told apart by money-flow **with receipts** — the append-only
  ledger pattern time entries now reuse.
- `lib/worker-ops.js` + `lib/assignments.js`: who is on which open work order
  now — assignment state, not time accounting.
- `lib/ceu-tracker.js` + `ceu-sync.js`: hours-based CEU credits — the one
  place hours are already first-class.
- `Contractors1099`, projects `hoursPerWeek`, Calendar, HarvestLedger: time
  *adjacent* (planning, scheduling, giving) — none is leave/PTO/timesheet.
- **Gap, stated plainly (DR-0100):** the platform has NO leave types, NO
  approval flow for time off, NO accrual balances, NO absence graph. Family
  and church staff run their working lives on outside systems like the one
  screenshotted.

## 3. GAPS → the module map (robust and lightweight)

| Gap | Close | Status |
|---|---|---|
| Domain core (types, increments, transitions, balances, graph) | `lib/time-stewardship.js`, pure + unit-tested | **Shipped this session** (13 tests) |
| Separation of duties | `decideTransition` refuses self-approval in the math | **Shipped** |
| Persistence + tenancy | `time_entries` + `time_policies` tables on existing RLS rails (table-sync pattern) | Next increment |
| Surfaces | Submit Days card (member), Approvals queue (steward), Absence Graph (team), balances block | Next increment, per APP-IS-PRIMARY |
| Serve/ministry time | `serve` leave type — COLG volunteers, bus ministry, choir; feeds engagement-guard receipts | Type shipped; wiring with surfaces |
| Payroll/1099 hours export | CSV/report from approved entries | With Books integration |

## 4. Methods & metrics (measured, never asserted — DR-0076)

- **Method:** every state change is an append-only receipt; balances are
  computed from entries + policy, never stored as editable numbers; the graph
  paints approved entries only.
- **Adoption metric:** % of family/COLG staff whose leave lives in-app
  (target: family 100% by +30 days of surfaces landing; COLG staff pilot of 3
  by +60).
- **Trust metric:** 0 balance disputes unresolvable from receipts (the ledger
  answers every "when did I use that day?").
- **Timeliness metric:** median submit→decision time < 48h (the approvals
  queue surfaces aging requests).
- **Robustness gate:** domain lib stays dependency-free and fully unit-tested;
  every new rule lands with a proven-to-catch test (this session: 13).

## 5. Founder-protection rationale (rigorous)

- **Separation of duties in the math:** no self-approval, ever — including
  the founder. Protects Darrell from both error and accusation: the receipts
  show another hand approved every entry (Proverbs 11:14; 2 Cor 8:21 — honest
  things "in the sight of men," not only of the Lord).
- **Append-only receipts:** no silent history edits; disputes end at the
  ledger, not at memory or seniority. This is the engagement-guard/DR-0232
  custody posture extended to time.
- **Owner-gated policy changes:** accrual policies (the money-adjacent knob)
  change by the owner role only, on the same real role system as the signing
  card — never a hardcode.
- **Data sovereignty:** DATA-AS-EMPOWERMENT applies — a member's time record
  is exportable and theirs; no employer-surveillance posture, no engagement
  optimization. We record stewardship, not keystrokes.

## 6. Clients and the exponential connection (BUSINESS-PROCESS-CONNECTIONS)

Four-question test: the surface invites a congregation/small org to run leave
in-app → the pipeline is the same tenancy rails every module rides → volume is
governed per-instance by the owner role → the visible promise is "your team's
time, stewarded with receipts."

- **COLG first** (COMMUNITY-FIRST): elderly staff who already know the
  submit-days shape get it at A44 large print — the accessibility work this
  same day makes the module readable by the people who need it.
- **Exponential edge:** every church/small business that adopts PoeTech for
  time brings its PEOPLE, and each person is a family — the time module is a
  workday-frequency touchpoint (daily/weekly), the highest-frequency habit
  surface after messaging. Frequency × households is the compounding term:
  one org of 15 staff ≈ 15 families meeting the platform weekly, each a
  potential adopter of Books/Learn/Church modules (the land-and-expand the
  App Store shelves already frame).
- **Constraint honored:** marketing follows pipeline readiness — the module
  ships to family + COLG pilot before any client-facing promise.

## 7. Opportunities and constraints (named)

**Opportunities:** workday-frequency engagement; the first module clients
already know how to want; serve-time makes volunteer hours visible for grant
reports and 1099-vs-volunteer clarity (engagement-guard pairing); payroll
export feeds Books.

**Constraints:** approvals need ≥2 humans per instance (solo instances fall
back to receipts-only, no self-approval theater); FMLA/legal compliance is
NOT claimed — we record, employers comply (stated plainly, DR-0100); real
payroll money movement stays behind the payments bright line (owner decision);
surfaces are Tier B (soak) since they're org-facing.

**Re-review:** surfaces increment due within 14 days — 2026-08-07 (DR-0075).
