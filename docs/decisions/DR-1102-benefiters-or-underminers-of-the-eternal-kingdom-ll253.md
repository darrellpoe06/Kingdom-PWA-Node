# DR-1102: Benefiters or Underminers of the Eternal Kingdom — what we do to each other, we do to Him (ll253)

**Date:** 2026-10-18
**Status:** accepted
**Tier:** A (additive curriculum: one new Living Lessons module, dated, with its gate)
**Type:** curriculum
**Area:**
- `app/src/lib/living-lessons-class.js` (`ll253-benefiters-or-underminers-of-the-eternal-kingdom`, appended after ll252)
- `app/src/lib/living-lessons-dates.js` (ll253's line; the day it was sent)
- `app/src/__tests__/living-lessons-l253-spoken-2026-10-18.test.js` (its gate)
- `app/src/__tests__/living-lessons-order.test.jsx` (note only: the newest day stays 2026-10-18)

**Amends:** nothing. Grounds: DR-0076 (every verse fetched verbatim from the repository's own KJV), DR-0098 (teach the Word, do not debate it), DR-0100 (abuse stated plainly as real), DR-0210 (Yahweh in our voice, quotations untouched), DR-0331 (his words rendered for meaning), DR-0530 (Business Systems as a Resource), the standing rule that a spoken teaching is build input.
**Declared by:** Darrell, 2026-10-18, in one message that began "Lesson" and closed as a prayer, in Jesus' name.

## Context

Darrell's message, rendered for meaning:
- Inside time, we have to start seeing ourselves as either benefiters or underminers of the eternal kingdom.
- If we abuse or undermine each other, we are literally abusing and undermining Yahweh's Way, will and desire.
- We are supposed to be creating ways for each other to develop and grow, with outcomes guaranteed not to undermine it.

His last words in the message ("Love you too, son") were personal, spoken to the builder, not teaching. They are not in the lesson, and the gate checks that they stay out.

The Word carries every line without needing a debate:
- **No neutral ground:** Matthew 12:30.
- **The building and its builders:** 1 Corinthians 3:9-10; Galatians 5:13-15.
- **What we do to each other, we do to Him:** Matthew 25:40 and 25:45; Acts 9:4-5; 1 Corinthians 8:12; 1 John 4:20; Matthew 18:6.
- **His Way, will and desire:** Micah 6:8; John 13:34-35; 1 Timothy 2:4.
- **Ways to grow:** 1 Thessalonians 5:11; Romans 14:19; Ephesians 4:29; Hebrews 10:24; 1 Peter 4:10; 2 Timothy 2:2.
- **The outcome He guarantees:** Galatians 6:7-10; Proverbs 11:25; 1 Corinthians 15:58; Isaiah 55:11.
- **The name he prayed in:** John 14:13.

Two points needed care:
- **"Literally abusing and undermining Yahweh's Way."** This is the Word's own claim, not an overstatement. Christ counts persecution of His people as persecution of Himself (Acts 9:4), and Paul says wounding a brother's conscience is sin "against Christ" (1 Corinthians 8:12). The lesson states it plainly.
- **"Guaranteed outcomes."** No person can guarantee another person's growth. What Yahweh guarantees is the harvest of what is sown (Galatians 6:7-9), so the lesson places the guarantee with Him and our part in building ways that serve it.

Abuse is stated as real and documented, in every band including the child band, and getting help is taught as obedience (Psalms 82:4). So the lesson can never be read as telling a victim to stay quiet for the sake of "not undermining".

## What was measured

- **Verses:** every one fetched from `app/public/bible/kjv` before a sentence was written. There are 169 referenced quotations across the lesson, bands, big idea, benefits, quiz and talking points, each word for word in the verse it cites, case included.
- **First draft, measured mechanically before commit:**
  - every band was under its fullness floor (child 0.48, youth 0.47, teen 0.52, senior 0.53);
  - the reading ladder was inverted (senior 8.23 under teen 8.66);
  - the youth and teen bands never addressed children.
- **The fix:** each band was deepened before its practice. The teen band got short, plain sentences, the senior band long ones, and youth and teen each gained a line to children.
- **Measured after the fix:**

  | Band | Fullness (floor) | Flesch-Kincaid |
  |---|---|---|
  | Child | 0.57 (0.5) | 3.22 |
  | Youth | 0.62 (0.6) | 5.59 |
  | Teen | 0.66 (0.6) | 7.08 |
  | Senior | 0.73 (0.6) | 9.76 |

  The grade rises by more than one at each step, and the child band is under the 5.0 ceiling.
- **Other checks:**
  - worst band overlap is 0.020;
  - every band names the lesson in its opening;
  - all three directions appear in every place;
  - no elision, no recited record, and no generic "God" in our voice.

## Decision

The gate pins the spine in every place a reader reads:
- 15 strands quoted in every band, among them Matthew 12:30, Matthew 25:40, Acts 9:4, Psalms 82:4, John 13:34-35, Galatians 6:7 and 6:9;
- 36 named strands verbatim in total;
- his lines in every band (benefiters, underminers, the eternal kingdom, inside time, his prayer in Jesus' name, growth, a trusted person);
- the seven sections in his order;
- every band closing on Matthew 25:40.

The two stories teach the lesson rather than decorate it:
- **The Two Shovels:** one shovel digs the bed and one fills it back in.
- **The Volunteer Schedule:** a kitchen run for twenty-two years by undermining, then rebuilt by training.

## Impact

A reader sees, in their own band, that there is no neutral way to spend a day among people. Every word about someone who is not in the room, every task kept or handed on, and every new person welcomed or quietly pushed out either builds the eternal kingdom in someone or takes from it. Jesus counts it as done to Him. A child learns that being kind to the new kid is being kind to Jesus, and that telling a trusted adult about abuse is right. A teen learns where undermining hides in a group chat. A senior learns that knowledge kept to oneself is a kitchen that closes when its cook retires.

## Verification

- `living-lessons-l253-spoken-2026-10-18.test.js` checks that the lesson:
  - appears in the catalog once, after L252, dated 2026-10-18;
  - names Darrell and his prayer, and leaves out his personal words;
  - carries his lines and the 15 shared strands in every band;
  - has the seven sections in order;
  - has 36 strands verbatim, and every referenced span verbatim with case. This check is PROVEN TO CATCH an altered Acts 9:4 and "Yahweh" substituted into 1 Corinthians 3:9.
- It also checks:
  - every anchor reference is named in the lesson;
  - the fullness floors hold, proven to catch with a teen band trimmed to 600 characters;
  - the reading ladder rises, every band names the lesson, the bands differ, and every place carries the directions;
  - the two stories are present;
  - Yahweh is named in our voice and never the generic, proven to catch;
  - the quiz answer positions vary.
- The L253, L252, L251 and order tests ran together: 477 passed. The catalog-wide lesson suites run in CI.
- `re-review: 2026-10-25`: read L253 on the live app in each band, and record the first reader who reports building a way for someone else to grow.
