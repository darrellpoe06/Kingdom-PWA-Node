# DR-1678: The Learn home leads with pictures, and the first quick fixes from members' own feedback

**Date:** 2026-11-26
**Status:** Accepted
**Tier:** B (every member's Learn home, the ride request form, the bills calendar; no schema)
**Type:** fix
**Area:** `app/src/components/learn-studio/LessonsInOrder.jsx`, `LearnStudio.jsx`, `learn-studio.css`; `app/src/lib/bus-ministry.js`, `app/src/components/BusMinistry.jsx`; `app/src/components/Calendar.jsx`, `app/src/lib/lifecycle-and-flow.js`, `app/src/lib/financial-engineering.js`; `app/src/poe-financial-mvp-v28.jsx` (one line); tests `learn-functions-in-new-look.test.jsx`, `bus-ministry.test.js`, `frequencyToMonthly.test.js`
**Sent in by:** Darrell, 2026-11-26: "The first or initial look should be better... start with the images!!!... should be maybe a drop down defaulting closed... so the images below are showing initially"; "We can use this data to enhance and better our quality and increase less stress on the people by fixing low hanging fruit continuously". The fixes are members' own notes from the feedback table (REV-0262 triage).
**Pairs with:** DR-1676 (every voice reaches the office), REV-0262

## Context

The Learn home opened on the long Lessons list (course picker, order, Show, View, Fold, month groups) above every picture. The member feedback table held 45 members' own notes and 99 automatic learning signals; 151 rows, none triaged since June. A triage of all of them against the current code (REV-0262) named the quick fixes still open.

## What was measured

- Triage of 151 rows: 45 written by members in 24 themes (10 fixed already, 8 partly, 6 open), 99 `[Learn engagement]` signals, 1 class sign-up, 6 empty or tag-only. The board already keeps signals off its default "people" view.
- The learning signals carried the learner's **email** in text that every member of the space may read (`feedback_member_read`).
- Ride request (2 notes): phone and pickup address were optional; the van was an optional checkbox.
- Bills calendar (2 notes): only monthly through biennial; no notes. The date engine already handled weekly and biweekly (`money-dates.js`), but `frequencyToMonthly` counted them as $0 a month.

## Decision

1. **The Learn home leads with pictures**: the Lessons list folds under its heading ("Lessons · N lessons · K read"), closed by default; one tap opens the whole list with every control. Its body is written once (no second copy).
2. **Ride request**: name, phone, pickup address and the van (regular or accessible, a required choice) are required, each marked with a star read aloud as "required"; the pickup area stays an optional help.
3. **Bills**: weekly and every two weeks are offered when adding or editing; a notes field on both; the monthly figure is a year of payments over 12 months (both copies of the math).
4. **No email in learning signals**: the row says "A learner"; the engagement summary counts by age band and never needed the name.

## Impact

- The first screen of Learn is pictures.
- A driver always has a phone, an address and the right van.
- Members' every-two-weeks bills count correctly.

Open from the triage, next in the loop: confirm on a device that Choir's Add keeps the entry and that "Update now" finishes; Capital Expenditure tab (reproduce); login after an update (reproduce); clickable budget figures; Church next-step audit; one-time bills. `re-review: 2026-12-03`

## Verification after merge

- `learn-functions-in-new-look.test.jsx`: the Lessons list is a closed drop-down that names its count and opens with every control.
- `bus-ministry.test.js`: each of name, phone (7+ digits), address and van is required; area alone no longer passes.
- `frequencyToMonthly.test.js`: weekly 120 is 520 a month; biweekly 120 is 260.
- Local: 62 money and calendar files, 1,124 tests, passed; 89 bus ministry tests passed (2026-11-26).

`re-review: 2026-12-03`
