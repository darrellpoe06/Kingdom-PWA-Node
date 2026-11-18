# DR-1539: Words read at every size: columns collapse with the text, and a gate measures the words

**Date:** 2026-11-18
**Status:** Accepted
**Tier:** B (the church door everyone lands on; one stylesheet; one new pass in the layout probe)
**Type:** decision
**Area:** `app/src/index.css` (`.lc-hero`, `.lc-quick`, `.lc-tiles`, `.lc-mins`, `.lc-adv`, `.lc-home`); `scripts/chrome-layout-probe.mjs` (the WORDS READ pass)
**Sent in by:** Darrell, 2026-11-18, three screenshots from his phone and his Fold: *"Words are squeezed on a normal cell phone... fix it and the evaluation of this as a process... should be done so it's always good."* And: *"Words looks matter for reading..."*
**Pairs with:** DR-0239 (comprehensive = measured), DR-0276 (layout at the big text steps), DR-0147 (Big Print 44), DR-0076 (verification)

## Context

The church door's grids fixed their column counts: the hero gave its words `minmax(0,1fr)` beside an `auto` pastor card, the quick tiles were eight across from 640px, the cards two or four across. At Normal they fit. When a reader picked Larger or Big Print the columns stayed and the words gave way: the welcome paragraph one word per line, "Ministries" running into "Events", "Ministri" and "Upcomir" cut off. The layout probe measured the chrome and the lesson at those sizes; it never measured the words of the church door.

## What was measured

Chromium, the church door, before the fix: at 360px Larger the welcome paragraph was 18 words on 18 lines in a 12px column; at 412px Larger, 64px. At 360px Big Print the pastor's name ran 20px past the band and "TLC Theological Institute" 49px past its card. After the fix, at 360/412/768/1800px × Normal/Larger/Big Print: no block of 6+ words in a column under 60% of the content width, no text past a clipping ancestor, no two tile labels overlapping.

## Impact

A parishioner who makes the words bigger gets bigger words, not fewer per line and none cut off; the pastor's card steps under the welcome when there is no room beside it, the tiles wrap to another row, the cards go one across. The same measurement runs on every push, so the fault cannot come back unseen.

## Decision

1. **Column counts come from a minimum width in rem, never a fixed count.** The hero is a wrapping flex row (words `1 1 14rem`, the card `auto`); quick tiles, tiles, cards and the Kids & Youth band use `repeat(auto-fit, minmax(min(100%, Nrem), 1fr))`. Rem scales with the text, so the columns collapse as the words grow.
2. **A word that fits nowhere wraps, never clips.** `.lc-home { overflow-wrap: anywhere }`.
3. **The gate.** The layout probe's WORDS READ pass loads the church door at four widths and three text sizes and fails on: squeezed prose (6+ words, 3+ lines, under 2.5 words a line, in a column under 60% of the content width); a word cut off (text past an ancestor that hides overflow, screen-reader-only text and scroll rows excepted); labels colliding. Its self-test forces the hero column to 12px and the tiles to 40px and must trip.

## Verification

- `node scripts/chrome-layout-probe.mjs`: 12 words cases measured, none failing; `--selftest-break`: the words pass trips (the exact counts are in the PR).
- Stills under `docs/design/love-corner-kids/phone/words-read/`.
- `re-review: 2026-12-02` — sweep the other doors (Institute, Moore, TLC) with the same pass.
