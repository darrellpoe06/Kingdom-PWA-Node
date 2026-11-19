# DR-1578 — The song that goes with you: sov99 from Darrell's spoken teaching, rebuilt from PR #1814

**Date:** 2026-11-19 · **Status:** accepted · **Tier:** A · **Area:** Sovereign A.I. week 99; the lesson lane
**Principles:** WORD-FIRST, SPOKEN-TEACHINGS-ARE-BUILD-INPUT, VERIFICATION-DOCTRINE, THREE-TIERS, TEACH-NOT-DEBATE, FOUR-BANDS
**Source:** Darrell's spoken teaching of 2026-09-24, 4:57pm, marked "Lesson." First built as sov29 under the original DR-0634 on PR #1814 (branch `claude/lesson-the-song-that-goes-with-you`).
**Reserved:** `refs/heads/reserve/dr-1578` and `refs/heads/reserve/sov99` on origin (empty-value lease), before a word was written.

## Context

PR #1814 carried this teaching and never landed: the sov29 slot and the DR-0634 number went to other work, and the branch has no merge base with today's main. CLAUDE.md, Spoken Teachings Are Build Input: his spoken word is not dropped. His words, rendered for meaning (DR-0331) and never put in quotation marks in the lesson: leaving a tab should not make the player stop; it should play whatever he does, like a radio in the background; stop constraining it, and let it support what he asks. The code answer the same evening was DR-0633; this is the teaching.

One teaching, one lesson (DR-0610): `grep -ri "song that goes with you"` over `app/src/lib` and `docs/decisions` found only DR-0662's note of the #1814 collision; no lesson teaches it. Weeks 96 to 98 were reserved by sessions in flight, so this is week 99. The #1814 draft's lamp movement (Exodus 27:20; Leviticus 6:13) is left out: the week-96 branch teaches the ordered lamps.

## What was measured

| claim | tier | how |
| --- | --- | --- |
| His request, as spoken | HIS WORDS | the #1814 record of the 4:57pm teaching, read with `git show` |
| An idle engine no longer cancels the shared voice; only the reader's Stop stops it | MEASURED | `app/src/lib/tts.js` `stop()`: `if (this.status !== 'idle')` |
| A small player rides on every tab, with Back to the voice | MEASURED | `app/src/components/TTSControl.jsx` |
| The same audio advanced about 5 s after the lesson tab was left, at three sizes | RECORDED | DR-0633's Chromium run; not re-run for this lesson |
| His phone, switching apps, other devices, the home audio voice reachable today | NOT VERIFIED | no device in this session |

Bands written by hand (DR-1306). First build was short in every band (child 0.43, senior 0.59); each gained a taught paragraph. Landed: adult 1,953 prose words; shares 0.524 / 0.614 / 0.607 / 0.633; FK 1.26 < 4.82 < 5.03 < 8.85; worst overlap 0.095 (youth~teen). 28 anchor references, every one filled from the corpus by `scripts/sov99-fill.mjs` through `scripts/lib/kjv.mjs`.

## Impact

Word first on Proverbs 6:22 (when thou goest, it shall lead thee; when thou sleepest, it shall keep thee) and Exodus 33:14 (my presence shall go with thee); neither appears in any earlier week. Then Exodus 13:22, Psalms 139:7, 10, Psalms 121:4, 8, Matthew 28:20, Hebrews 13:5, John 14:16; the song in the night (Psalms 42:8, 34:1, Acts 16:25, Colossians 3:16); the servant (Mark 10:45, Galatians 5:13, 1 Corinthians 4:2); the Word unbound (2 Timothy 2:9, Isaiah 59:1, Proverbs 3:27); closing John 1:29, John 3:16, Hebrews 1:8, Colossians 1:17. **Bright line pinned:** no tool is the presence of Yahweh, and no player is a Keeper. Course-band baseline 320 → 321; `sovereign-ai-class.js` ceiling 15561 → 15742, measured with `wc -l` on the spliced file.

## Decision

1. The teaching is Sovereign A.I. week 99, `sov99-the-song-that-goes-with-you`: what a tool is for and whom it serves is this course's spine.
2. His framing leads, without quotation marks; the house is pinned to code; the browser run stays recorded, the phone unverified.
3. Week 99 lands after weeks 96 to 98. Until they land, 13 tests stay red on this branch by design, as on the week-98 branch: the course's contiguity gates (sovereign-ai-class, sov36, sov52 to sov54, sov57 to sov63) and sov95's tail pin. They hold it from merging ahead. Whoever lands last re-splices and re-pins.
4. PR #1814 is left for Darrell to close; this record supersedes its content, not its history.
5. `re-review: 2026-12-03`: his phone test (leave a tab, switch apps), then bring the house section up to the measured truth.

## Verification

`app/src/__tests__/sovereign-ai-sov99-verses.test.js` (22 cases): the shared gate's checks all empty; the anchor exact both ways and neither spine verse an earlier anchor; Proverbs 6:22 before the code in every teaching place; the bright line, the Lamb of Yahweh and the tiers in every teaching place; the code claims read back from `tts.js` and `TTSControl.jsx`. **Proven-to-catch:** an altered word of Proverbs 6:22, his words in bare quotes, the generic name in our voice and a capitalized adversary are each caught; restoring the unconditional `cancel()` in `tts.js` turned the code pin red, and restoring the guard turned it green.
