# DR-0838 — Words stay whole and controls wrap under the name: a row never pushes its own panel off the page

- **Status:** accepted
- **Tier:** A (one row's layout and a counter in a guard that already runs)
- **Type:** fix
- **Date:** 2026-10-09
- **Scope:** `app/src/components/AdminConsole.jsx` (the Manage access roles row: `flex-wrap`; the name span `basis-full sm:basis-auto sm:flex-1 min-w-0 break-words`; the controls span wraps), `scripts/consistency-guard.mjs` (`nameBreak` counter: `break-all` on a line that renders a person's name is drift; hard violation over baseline), `app/src/__tests__/consistency-guard.test.js` (+3), `app/src/__tests__/roster-named-from-your-contacts.test.jsx` (+1), `docs/00-foundations/_root/LESSONS-LEARNED.md` (P72), `docs/00-foundations/_root/QUALITY-OF-LIFE-AS-NORTH-STAR.md` (the Way, under How this applies operationally).
- **Principles:** DR-0079 (consistency is a check, not a slogan), DR-0239 (form factor is measured, never assumed), DR-0104 (the live push is reviewed as a user meets it), DR-0076 §3 (the counter is proven to catch), DR-0825 (the contact name that lengthened the row is right; the row was wrong).
- **Grounds:** Darrell, 2026-10-09, two screenshots of Admin → Role & stewardship on his phone: Christyn's row with her name one letter per line down the whole screen, and her *Extra powers* and *Stewardship record* panels found only at the very bottom. *"Couldn't see these forms and options!!!!!! Supposed to be in tabs never scrolled to the bottom of the page!!!????!!!!! Mandatory Ways!!!!!!! Documentation for this asap!!!!????!!!! Never again unless asked... why is the default wrong!!!!?????!!!!! Fix it!!!!!!!!"*

## Context

The roster row was a flex line: the name on the left, the role select, the classification select, the relationship box and three buttons on the right, with `break-all` on the name so a long email could not overflow. The controls never wrap, so on a phone they took the whole width and the name column was left with nothing; `break-all` then obliged, one letter per line. The panels a row opens (Checklist, Known, Inspect) render directly under their row, which is the right place; under a row two thousand pixels tall, the right place is the bottom of the page. DR-0825 made the name longer (*Christyn Poe · in your contacts as Christyn Poe · (447) 220-9779 · signs in by phone · here since · last here*), which is what tipped it.

## What was measured

- `AdminConsole.jsx` 490-491 before: `flex items-baseline justify-between gap-2` with no `flex-wrap`; the name span `break-all min-w-0`; the controls span `flex items-center gap-1.5 shrink-0`.
- The screenshot: the fourth row's name rendered as a single column of characters; the two panels below it reachable only by scrolling past that column.
- `break-all` appears 51 times in `app/src`; one of them was on a person's name (this row). Every other use is on a URL, a code, an email or a log line, where breaking inside the string is the point.

## Impact

- Unresolved: any roster row whose name grows (a contact name, a phone-door address, a long email) collapses on a phone, and whatever the row opens lands off-screen; the governor reads it as the controls being somewhere else.
- The call obligates: a row that holds controls wraps; a person's name keeps a real width and breaks between words; a panel a row opens stays directly under that row and is reachable without scrolling past anything the row itself produced. A `break-all` on a name is drift the guard refuses.

## Decision

1. **The Way (recorded in QUALITY-OF-LIFE-AS-NORTH-STAR, How this applies operationally):** words stay whole; a row's controls wrap under the name on a narrow screen; a control's panel opens in place, under the row or in the row's own tab, never appended at the page's end; `break-all` belongs to URLs, codes and log lines only.
2. **The row:** `flex-wrap`; the name `basis-full` on a phone and `flex-1` beside the controls on a wider screen, `break-words`; the controls wrap.
3. **The gate:** `consistency-guard.mjs` counts `break-all` on a code line that renders a person's name (`displayName`, `who.shown`, `tenant_name`, `nickname`, `fullName`, `firstName`, `lastName`, `.name`); over baseline is a hard violation; the baseline is zero, so the first one fails the build. A roster render test holds the row's classes.

## Verification

- `consistency-guard.test.js`: a `break-all` beside `displayName` counts, one on a URL does not, a comment line does not; the ratchet catches `name-break-all` in a new file.
- `roster-named-from-your-contacts.test.jsx`: the row wraps, the name span has no `break-all` and takes the full width first, the controls span wraps (fails on the row as it was).
- The whole consistency and roster suites green; eslint clean.
- `re-review: 2026-10-16`: the same rule walked across ChurchMembers, Choir and the invites lists on a 360 px viewport by the chrome-layout probe.
