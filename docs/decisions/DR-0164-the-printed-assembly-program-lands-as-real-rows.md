# DR-0164 — The printed Assembly program lands as real rows: transcribed faithfully, loaded by the steward's tap, the date typo corrected with a receipt

- **Status:** accepted
- **Tier:** A shipped through the lane (a transcribed seed + a Governor-side loader on an existing surface; sessions are written by the steward's own credentials — the cloud never writes family rows)
- **Scope:** `app/src/lib/assembly-program-2026.js` (the transcription + idempotence + room matching), `app/src/components/EventCenterModule.jsx` (the one-tap loader), `app/src/__tests__/assembly-program.test.js`
- **Date:** 2026-07-10
- **Principles:** SPOKEN-TEACHINGS/BUILD-INPUT (handed input is captured and shipped the same session), VERIFICATION-DOCTRINE (DR-0076 — transcribed, never invented; the typo corrected WITH its receipt), NO-STATIC-DATA (DR-0121 — one identity source, rows not images), DR-0060 (RLS: the family writes its own rows), APP-IS-PRIMARY

## Directive

Darrell, 2026-07-10, with two photographs of the church's printed 77th National Assembly program: *"Next week's conference program add this where it makes sense."*

## Decision

1. **Where it makes sense = the Event Center's existing conference record.** The app already holds the 77th National Assembly as a real conference with rooms and sessions (DR-0159's one identity source names it). The printed program becomes SESSION ROWS there — searchable, assignable to rooms, feeding the same registration/meals machinery — never a pasted image.
2. **Transcribed faithfully, all 12 sessions + both facilitator bios** (including the family's own: Every Day Tech Confidence, Wed 11:00–11:50, Sanctuary — Brother Darrell Poe & Brother Clifton Reed). Titles, times, rooms, and leaders are the program's own words.
3. **The printed date typo is corrected with a receipt, never silently** (DR-0100): the printed Day 3 header says "Thursday, July 15, 2026" — the same date as Day 2 (Wednesday). Thursday of that week is July 16. Day 3 is dated 2026-07-16, and `ASSEMBLY_DAY3_DATE_NOTE` records why.
4. **The steward loads it with one tap; the loader is idempotent and honest.** Sessions are family-instance rows (RLS — DR-0060), so a "Load the printed program" action beside "Add session" writes them under the steward's own credentials, adds ONLY what's missing (day+title, case/space-insensitive — a second tap adds nothing, hand-edits survive), matches printed room names to real rooms by name, and leaves a session's room unassigned rather than inventing one.

## Opportunities and constraints (routed)

- **Opportunity:** the facilitator bios can render on the Assembly registration page (`?register` / the conference surface) beside the sessions they lead. `re-review: 2026-07-14` (before the conference).
- **Opportunity:** Day 1 and Days 4+ of the printed program weren't in the photographed pages — when Darrell sends them, they extend the same seed. `re-review: 2026-07-14`.
- **Constraint (held):** the loader never UPDATES an existing row — a steward's hand-edit is senior to the seed, so a reprint means new titles or hand edits, not silent overwrites.

## Supersedes / pairs

Pairs with DR-0159 (the one Assembly identity), DR-0060 (RLS), the Event Center's dual-mode write path, and the SPOKEN-TEACHINGS capture covenant (handed input becomes build the same session). No supersession.
