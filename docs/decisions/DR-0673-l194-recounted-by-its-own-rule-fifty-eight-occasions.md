# DR-0673: L194 recounted by its own rule. Fifty-eight occasions, with the four scenes L196 found counted where they belong

- **Status:** accepted
- **Tier:** A (content in an existing course; no schema, no transport, no money)
- **Type:** correction (a count made honest by applying its stated rule to itself)
- **Date:** 2026-09-29
- **Closes:** DR-0661 `re-review: 2026-10-13` (recount L194 with the four scenes found on the way).
- **Scope:**
  - `app/src/lib/living-lessons-class.js`: L194 gains four occasions and is renumbered 1–58 on every surface: the adult lesson, all four bands, the tally, the confession cross-references and the facilitator's ranges. Its counts become fifty-eight; the scenes new against L191 go from thirty-six to forty. L191's one line pointing to L194 now says fifty-eight. L196's marks are remapped to the new numbers. Its "found on the way" paragraph becomes "counted again in L194" on every surface, as do its benefit, quiz and facilitator lines.
  - `app/src/__tests__/living-lessons-l194-verses.test.js`: the pins move to fifty-eight, plus two new checks: the recount itself, and a proven-to-catch.
  - `app/src/__tests__/living-lessons-l196-verses.test.js`: the marks read "inside the fifty-eight", and each counted-again scene must be the named L194 occasion carrying the same verse.
- **Principles:** SOURCE-OF-ANSWERS; DR-0076 §1/§3/§5 (verbatim spans, proven-to-catch, derived counts); DR-0098; DR-0210; DR-0604 (L191 keeps its one line, updated only in its number).
- **Grounds:** Darrell, 2026-09-29: *"We just kept the rule the same all the way through."* L194's first kind counts a scene where Jesus names who He is, including by calling Yahweh His own Father. L194 counted His prayer in John 17 on exactly that ground. Four scenes meet the same ground and were missing: Gethsemane (Matthew 26:39), the two words to the Father from the cross (Luke 23:34; Luke 23:46), and Nazareth the second time (Mark 6:4). DR-0661 named them and left L194's number unchanged. Keeping the rule the same means counting them.

## Context

L194 stated a rule and counted fifty-four under it. L196, walking what that rule set aside, found four scenes the rule itself counts. DR-0661 named them and left L194's number as published.

## Impact

Left alone, L194 would publish a number that its own rule contradicts, and L196 would carry a side note in place of the count. Fixing it changes L194's occasion numbers from 20 up, so every surface that cites a number (the tally, the cross-references, the facilitator's ranges, L196's marks) moves with it. This can be undone by reverting one commit.

## Decision

1. **The four scenes, in the order of events, all "New here" against L191:**
   - 20, His own town again (Mark 6:1-6; Matthew 13:54-58);
   - 44, the Father, in Gethsemane (Matthew 26:36-46; Mark 14:32-42; Luke 22:39-46);
   - 49, the Father, from the cross, as they crucified Him (Luke 23:33-34);
   - 51, the Father, from the cross, at the ninth hour (Luke 23:44-46; Matthew 27:45-50; Mark 15:33-37; John 19:28-30).
2. **Renumbering is mechanical:** old 1–19 stay; old 20–42 → +1; old 43–46 → +2; old 47 → 50; old 48–54 → +4. The tally is regenerated from the remapped lists:
   - (A) He names who He is: 38, which is the old 34 plus the new four;
   - (B) He receives or corrects a confession: 18;
   - (C) He answers a direct question: 8 (15, 24, 31, 38, 39, 46, 47, 48);
   - (D) unclean spirits: 4 (8, 9, 14, 18);
   - the four kinds together cover all 58.
3. **The recount is said once on each surface where the count is checked:** the lesson first counted fifty-four, and walking the rest of the Word for L196 turned up these four. No surface hides the earlier number.
4. **L196 follows:**
   - Gethsemane (4.20) is now inside the fifty-eight (occasion 44), so movement four becomes 5 of its own scenes and 15 inside; the five-movement split becomes 57 of their own scenes, 33 inside and 4 in the writers' own words; the total stays 94.
   - The mockers at the cross (2.6) now end at Matthew 27:44 / Mark 15:32, where occasion 51's ninth hour begins, so no fresh scene overlaps an L194 scene.

## What was measured

| what | measured |
| --- | --- |
| L194 quoted spans | 485, all verbatim; every band's occasion markers run 1–58 in order |
| L196 quoted spans | 785, all verbatim; fullness child 0.51, youth 0.61, teen 0.62, senior 0.61; worst band overlap 0.04 |
| proven to catch | in the real catalog, "OCCASION 51:" renamed to a bare heading fails four L194 checks (the order, the L191 tags, the recount, the removal check); restored, 26/26. In the test, occasion 49 cut out breaks the sequence and the count of new scenes. |

## Verification

L194 26/26, L196 29/29, L191 17/17; then the full Vitest suite, `eslint src --max-warnings 0` and `business-systems-guard`. After merge, live review under DR-0104: L194 on a phone. Check that 20, 44, 49 and 51 read in place and that L196's "counted again" paragraph points at them.
