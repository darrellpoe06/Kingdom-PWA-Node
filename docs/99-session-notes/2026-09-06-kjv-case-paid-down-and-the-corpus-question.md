# 2026-09-06 — `kjv-case` 346 → 9, and an open question in the KJV corpus itself

**Lane:** `claude/yahweh-actions-by-century-exjvvv` → PR → auto-merge.
**Pulled forward from:** the 2026-09-12 re-review on the 346 case-only quotations (DR-0236: buildable now, built now).

## What changed and why

Darrell, 2026-09-06: *"who's dropping letters instead of just making them lowercase? Understanding is the main thing!"* and, on the whole provenance pile, *"sure do it.... why do you need me?"*

Every one of the 346 `kjv-case` rows was a **letter-case-only** difference from the in-repo KJV. Measured before touching anything:

| family | rows | what it was |
|---|---|---|
| opening word only | 115 | a verse's first word lowercased to fit mid-sentence, or capitalised where the KJV runs on |
| emphasis capitals inside the quotation | ~230 | `"thy faith hath made thee WHOLE"`, `"LET NOT YOUR HEART BE TROUBLED"` — the L127 defect class |
| reverence capitals inside the quotation | ~40 (overlapping) | `"in Him dwelleth"`, `"rejected ME"` — our typographic rule applied INSIDE a quote, which the bright line forbids (quoted Scripture stays exactly as written) |
| `LORD` ↔ `Lord` | 9 | see below — the corpus's question |

**The fix is a case-only rewrite** (`scratchpad/kjv-case-fix.mjs`, not committed — it is a one-shot): for each audited quotation, align the letters of the quoted text with the letters of the corpus match and rewrite only the letters whose case differs. Same length, same non-letter characters, so nothing structural can break — the failure that corrupted `living-lessons-class.js` on the earlier bulk pass (a raw newline inside a JS string) is impossible here by construction. Verified after the write: the file parses (esbuild), the nine per-lesson verse gates (732 tests) stay green, the audit re-measures `kjv 11,313 → 11,650`.

Result: **338 rows rewritten, 2,110 letters changed, `kjv-case` 346 → 9, `web-case` 1 → 0.**

The emphasis those capitals carried is not lost to the reader: in every case the surrounding lesson prose already makes the point, and the quotation now says exactly what the Word says.

## The 9 that remain are the corpus's question, not ours

While classifying, the corpus itself surfaced something real (DR-0100: state it plainly):

- **The in-repo KJV prints small-caps `LORD` in 29 New Testament verses.** The KJV translators reserve `LORD` for the Tetragrammaton, which the Greek NT carries only inside OT quotations (Matthew 22:44 *"The LORD said unto my Lord"* is legitimate). Most of the 29 are plain `Lord` in the KJV: Acts 15:11 *"the LORD Jesus Christ"*, Acts 20:19 *"Serving the LORD"*, John 20:2–28 throughout, Acts 8:24, 2 Corinthians 3:18.
- **Verified upstream, not assumed:** `raw.githubusercontent.com/aruljohn/Bible-kjv/master/John.json` reads `My LORD and my God` at 20:28. So this is the source's rendering, faithfully ingested by `scripts/fetch-full-kjv.mjs` — not an ingest defect.
- **Readers see this text** in the in-app Bible (`app/public/bible/kjv/*.json`).
- Separately, the source keeps the printer's chapter-opening small caps in a few places (`"A GOOD name"`, Proverbs 22:1; Psalm 70:1 and 92:1 entirely upper-case; Daniel 5:27–28).

**What I did NOT do:** patch the corpus. DR-0076 forbids correcting Scripture from memory, and the sandbox cannot fetch a second reference text. The 8 lessons quoting John 20:28 keep the KJV's *"My Lord and my God"*; the 1 quoting Proverbs 22:1 keeps *"A good name"*. They are the only rows left under the ceiling, and the gate now asserts that: any other case row fails the build.

**What is pinned so it cannot drift:** `scripture-provenance.test.js` asserts the NT `LORD` count is exactly 29 (a re-ingest that changes it is a decision, not a drift), that John 20:28 and Acts 15:11 are in it, and that the lessons never carry `My LORD and my God`.

**re-review: 2026-09-20** — settle the corpus against a second public-domain KJV text fetched from a machine with egress (Darrell's desktop or the NAS), then decide: patch the 24-odd NT `LORD` → `Lord` renderings with a recorded diff, or re-ingest from a cleaner public-domain source.

## Measured after

```
kjv                      11,650
paraphrase-declared          15
esv-labelled                 13
kjv-case                      9   (John 20:28 ×8, Proverbs 22:1 ×1)
web                           2
open (kjv-drift + attributed) 0
```

## Still open (unchanged by this pass)
- Quoted fragments shorter than 15 characters are not audited (the audit's own floor), e.g. `"shout for JOY"` after an ellipsis. A lower floor would trade precision for noise; not changed here. re-review with the corpus question above.
- The public-domain WEB corpus as a second *readable* modern-English edition for the reader (Darrell: *"build our own quickly"*) — not started in this pass.
