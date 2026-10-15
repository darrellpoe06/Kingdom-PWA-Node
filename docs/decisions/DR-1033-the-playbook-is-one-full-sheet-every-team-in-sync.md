# DR-1033: The playbook is one full sheet — every team's cue on every line, so Media, the Choir and the ushers read the same page at the same clock

**Date:** 2026-10-15
**Status:** accepted
**Tier:** A (a read-only view over the master order; no data, policy or schema change)
**Type:** surface
**Area:**
- `app/src/lib/service-program.js` (`playbookFor(program, segments, { members })` — pure: every line clocked from the start time, who carries it, every sector's cue; `presiding` from the fixed pulpit line; `finalizers` from the roster; a per-team fold of the same sheet)
- `app/src/components/ServiceProgram.jsx` (the "Playbook" chip for the whole team: the governance line, one table with a cue column per team, the per-team fold, Print; a print rule that prints the sheet alone)
- `app/src/__tests__/service-program.test.js` (+4), `app/src/__tests__/service-program-sections.test.jsx` (+1)

**Amends:** DR-1029 (the order that names its people), DR-1032 (the honest gate it sits behind)
**Declared by:** Darrell, 2026-10-15: "Governance comes from a team and is distributed; BG is the key figure in the process and Christina is also; everyone else follows these processes, so we need to have that as a playbook for that Sunday or Wednesday." Then: "I'm in that too, Media team. How else would we function." Then: "All one full print because we all have to be in sync across the whole service."

---

## Context

The master order (0042) already carried a sector per line and a cue per sector, and each team read its own lens. What no one could hold was the whole service on one page with every team's part beside every other team's at the same clock. The run of show showed the steward everything and each sector only itself; a Sunday needs the one sheet.

## What was measured

- `deriveSectorView` computes the clock per line from the program's start time (`computeSchedule`) and carries `cues` per sector; the Playbook reads the same schedule, so the clocks are the run of show's clocks, never a second arithmetic.
- The governance Darrell named is already the model: stewards (owner/admin) and the finalizer circle (0043) build and sign the order; the fixed pulpit line's key personnel is the presiding minister (Bishop Gwin on this order); every other sector follows its stops.
- `window.print()` prints the whole app page; a print rule confined to the sheet is what makes one full print.

## Impact

- One table: Clock · Line · Who · Min · then a column per team present (Media, Choir, Ushers, Welcome, Pastoral, Pulpit, Music) carrying "yours" on the lines the team owns and its cue on the lines that cue it. Under it, the same sheet folded by team ("What Media / AV does on Sunday").
- The header says who presides and who signs the order (the stewards BG · Christina · Darrell, and any roster finalizer), and that everyone else follows their stops.
- Print prints the sheet alone.

## Decision

The playbook is a read of the master, never a second order: it carries no state of its own and changes nothing. The per-team fold is derived from the same lines. A team's column is present only when the team owns or is cued on at least one line, so an empty column never paints a team that has no part.

## Verification

- `playbookFor` pinned (4): clocks from 11:00 AM through 11:48 AM across four lines; presiding from the fixed pulpit line; finalizers from the roster flag; each team's stops are the lines it owns plus the lines that cue it, and a team with neither is absent; an empty order has no window, no presiding, no sectors.
- The chip renders for a non-editing media member with the table, the governance line and Print (sections 5).
- Lint clean. Live proof owed (DR-0107): the first Sunday handout printed from the Fold; `re-review: 2026-10-22` with DR-1029's.
