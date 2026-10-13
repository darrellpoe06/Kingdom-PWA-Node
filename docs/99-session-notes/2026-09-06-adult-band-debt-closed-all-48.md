# Adult Band Debt — Closed, All 48 Paid

**Date:** 2026-09-06
**Branch:** `claude/yahweh-actions-by-century-exjvvv`
**Directive:** Darrell, 2026-09-05 — *"if lessons don't have all age groups then add what's needed... ESV is Good and KJV... 48 needs to be done."*

## What the measurement found

`app/src/__tests__/living-lessons-adult-band-debt.test.js` re-derives the per-band
coverage every run rather than asserting a claim. When first measured across all
126 Living Lessons modules:

| Band | Range | Gaps |
| --- | --- | --- |
| child | 6-10 | 0 |
| youth | 11-14 | 0 |
| teen | 15-17 | 0 |
| senior | 65+ | 0 |
| **adult** | **18-64** | **48** |

The 48 (ll78, ll80, and ll81 through ll126) carried authored `child` / `teen` /
`senior` levels but no base `lesson` and no `levels.standard`. `resolveForAge`
(`app/src/lib/learn-framework.js:274`) therefore served the ADULT band the SENIOR
text through its emergency fallback. Not a blank screen and not a fragment —
real, complete prose, but tuned for 65+ (`AGE_BANDS`: adult tone `plain`, senior
tone `respectful`) and read by the widest audience in the series.

## What was done

All 48 now carry a full adult-register `lesson` field, authored to cover
everything the lesson's `bigIdea` and other bands cover. Not a fallback tweak —
new prose, movement by movement, at adult depth.

This session closed the final twelve: **ll115 through ll126.** Earlier sessions
on this branch closed ll78, ll80, and ll81 through ll114.

## Scripture integrity

Every quotation in the new prose is verbatim KJV from the in-repo corpus
(`app/public/bible/kjv`). `scripts/scripture-provenance-audit.mjs` was run after
each lesson and the two defect classes were held flat throughout:

| Class | Before this session | After |
| --- | --- | --- |
| `kjv` (verbatim) | 9,888 | 10,712 |
| `kjv-case` | 347 | **347** (unchanged) |
| `unverified` | 155 | **155** (unchanged) |
| `web` / `web-case` | 1 / 1 | 1 / 1 |

824 new verbatim quotations added, zero new defects. Where a movement reused a
Scripture span that already appeared in the lesson's `bigIdea` or `benefits`, the
span was copied byte-exact rather than retyped.

## The ratchet, now closed

`ADULT_DEBT` in the debt test is now `[]`, and a new assertion fails the build if
an id is ever re-added. All five bands are hard invariants at zero. A new lesson
without adult-depth prose fails outright.

`THIN_AT_EVERY_BAND` remains `[]` — the ll78 / ll85 short-lesson finding was
closed earlier on this branch by fuller authoring, not by a fallback change.

## Still open (recorded, not closed)

- **155 unverified quotations across 77 lessons.** Darrell confirmed ESV is
  acceptable alongside KJV. `bible-editions.js` is a public-domain-only registry
  by design, so ESV cannot be verified in-repo — the remedy is a translation
  label at the citation, not a conversion. `re-review: 2026-09-12`.
- **347 case-only quotations** differing by case somewhere other than the first
  character. A mid-quote emphasis capital is not the same defect as a dropped
  opening letter; these need a person's eye rather than a mechanical pass.
  `re-review: 2026-09-12`.
