# L127 — The Firsts: what Yahweh did in each century that had never been done before

**Date:** 2026-09-05 · **Branch:** `claude/yahweh-actions-by-century-exjvvv`

## What Darrell asked for

Across a run of messages, building on each other:

1. "Research what Yahweh has done in each century that was new to that century and how each or all of the things inside that century is was and continues to be or ended in a certain century all Word based and historical accuracy"
2. "why it was needed and how it was is and will be used"
3. "if it wasn't in this century then etc... so like a puzzle look at historical events without Yahweh's perspectives and with"
4. "provisions and without etc..."
5. "promises that were fulfilled etc.."
6. "we can deduce that the 100 years are backwards compatible for reference"
7. "We acknowledge that the lack of knowledge is real... however we can deduct and use that type of knowledge to get closer to the biblical scriptures perspectives"

Plus five spoken teachings fed in mid-build, all captured as build input per CLAUDE.md:

- **The normal.** "Yahweh just wants to be normal with us no super nothing... just family... no need for a miracle... just Love." / "He can have anything except true love unless the other soul is true too." / "He has Jesus and The Holy Spirit... He wants us too." / "His will not listen to another voice."
- **Integrity.** "integrity can't be faked because Yahweh access the heart... The Word separates the soul from the spirit... Jesus separated the soul from the spirit... Why?"
- **Blind until.** "they will only be blind until they are not... then they thrive..."
- **The wilderness.** "but they became new creatures because they were put through the wilderness of life... our mothers and fathers hated us... we still love them... Jesus said this would happen..."
- **Credit and no condemnation.** "We also give credit where credit is due.... so naming or not... we don't mean to condemn anyone we let their fruit and ways testify to our users... not narratives without data... Word first..."

## What was built

| File | What it is |
|---|---|
| `app/src/lib/yahweh-by-century.js` | The spine — 22 entries, creation → the 21st century AD |
| `scripts/fetch-century-verses.mjs` | Resolves every reference against the in-repo KJV corpus |
| `app/src/lib/yahweh-by-century-verses.json` | Generated; the ONLY source of verse text (349 verses) |
| `app/src/components/YahwehByCentury.jsx` | The in-app surface, reached from the lesson |
| `app/src/__tests__/yahweh-by-century.test.js` | 31 tests — verbatim, dating tiers, canon fence, ledger |
| `app/src/__tests__/living-lessons-l127-verses.test.js` | 20 tests — the lesson's own gate |
| `app/src/__tests__/living-lessons-adult-band-debt.test.js` | 12 tests — the adult-band ratchet (below) |
| `living-lessons-class.js` | L127 added with `explore: 'centuries'`; `weeks` 125 → 126 |

Every century entry answers all of Darrell's asks as **named fields**, so a missing
answer is a build failure rather than a paragraph that forgot: `firsts`,
`whyNeeded`, `usedThen` / `usedNow` / `willBeUsed`, `ended`, `provision` /
`withoutProvision`, `withoutHim` / `withHim` / `piece`, `ifNotThisCentury`,
`promises`, `anchors`, `history`, and a `possibilities` block where believers
genuinely differ.

## The three decisions that shaped it

**1. Three dating tiers, never blurred.** `scripture-chronology.js` already binds
the house to "NO ABSOLUTE BC DATES" for the early record. So `word-clock` entries
print no BC century at all (a test fails the build if one appears); `synchronized`
entries are pinned by Qarqar 853, the Black Obelisk 841, Samaria 722, the
Sennacherib prism 701, Jerusalem 586, Babylon 539; `documented` entries are AD.

**2. The backward grid answers Darrell's hundred-year point without over-claiming.**
`CENTURY_GRID` takes a year fixed by external record, subtracts the interval
Scripture *states*, and reports a **computed, reversible** position with its fork
named — e.g. 1 Kings 6:1's 480 years puts the exodus near 1446 BC as a reference
position, with the 13th-century reading beside it. The interval is stated; the
century is computed; both are said.

**3. `DEDUCTION_DOCTRINE` holds both halves.** The gap is real *and* deduction is
legitimate. Refusing to reason from what is written, in the name of caution, is
under-claiming — the DR-0100 failure wearing humility's coat. Daniel 9:2 is the
precedent: he worked the seventy years out by reading and prayed on the count.

**The canon fence.** After the apostles the entries change kind and say so.
Nothing post-AD-100 is offered as new revelation; preservation, canon, translation,
printing, mission and the Qumran verification are documented history read under
promises already given. A test fails the build if a post-canon entry claims otherwise.

## Verification — the gates caught me, repeatedly

This is the answer to "how do we know you followed all the rules." Not assertion:

- **19 verbatim defects** in my own quotations, caught by corpus check before commit.
  Including a real content error — I typed "since the days of **Joshua**"; Nehemiah
  8:17 says **Jeshua the son of Nun**.
- **6 uses of the generic "God"** in my authored voice, caught by the DR-0210 gate.
  Fixed per DR-0210's actual instruction — name Him, or quote the verse properly —
  never a blind sweep, which that DR expressly forbids.
- **Our own emphasis wearing quotation marks** ("like a puzzle", "with Him"), the
  same family the L126 sweep caught ten of. Removed, not allowlisted.
- **A word-clock entry carrying a BC century**, **a capitalized false-god name**,
  and **three thin fields** — all caught by the new gate on first run.
- **`max-w-3xl` in the new component**, caught by `consistency-guard` (DR-0246
  made width caps a hard gate). Removed.
- **`legibility-health.json` out of sync**, caught by `legibility-guard`. Regenerated.

The in-repo KJV corpus lowercases false-god names (1 Kings 18:21 reads "baal"), so
quoting it verbatim satisfies the typographic rule automatically.

## A scoping bug this work exposed

Fifteen lesson verse-tests (l112–l126) sliced the catalog as
`src.slice(start).split('\n  },\n];')[0]` — from their own lesson to the **end of
the array**. Every lesson added after them was silently swept by gates written for
a different lesson. L127 tripped fourteen of them at once, which is how it surfaced.
All fifteen are now bounded to their own lesson, and L127 carries its own gate with
a declared non-Scripture allowlist.

## Findings reported, not silently fixed

**The adult band (18–64) has no prose of its own in 48 lessons.** Measured, not
assumed: child, youth, teen and senior are at **0 gaps across all 126 lessons**;
adult is at **48** (ll78 onward). Those lessons carry child/teen/senior levels but
no base `lesson` and no `levels.standard`, so `learn-framework`'s emergency
fallback serves the adult band the **senior** text. Never blank, never a fragment —
but the widest audience in the series reads prose tuned for 65+. Chunking still
adapts (200 words/segment vs 120), so the pacing layer works; only the text does not.

`living-lessons-adult-band-debt.test.js` now pins the 48 as a ratchet: the list may
only shrink, a new lesson without adult prose fails the build, and a paid-off id
left on the list also fails. Darrell's instruction — "48 needs to be done" — is the
work this gate now measures. L127 carries all five bands and does not add to it.

**A second finding, recorded separately rather than folded in:** `ll78` (581/730/745
chars) and `ll85` (1468) are thin at *every* band, not only at adult. That is the
short-lesson class Darrell named on 2026-08-25, and the fix is fuller authoring, not
a fallback change. Pinned in the same file so it cannot grow unnoticed.

**Scripture quotations across the series — held pending agreement.** A sweep of all
9,153 attributed quotations found **8,292 matching the cited KJV verse**, 17 matching
WEB, and **811 matching neither in-repo translation, across 77 lessons** — from
sampling, mostly ESV/modern renderings quoted without the translation badge
`SCRIPTURE-REFERENCE-STANDARD` requires. Darrell has since confirmed "ESV is Good and
KJV", so the remedy is classification and badging rather than conversion. **No
existing lesson's quotations were changed in this session** — he asked to agree first,
and the 811 have not been individually classified. `re-review: 2026-09-12`.

## Definition of Done

- [x] Full suite green: **823 files, 11,879 passing, 1 skipped**
- [x] Every verse fetched from the corpus, never from model memory (DR-0076)
- [x] Every age band served prose authored for it, in the new lesson
- [x] Surfaced in the app, not only in a file (DR-0065)
- [x] Documented here, with findings named rather than smoothed
