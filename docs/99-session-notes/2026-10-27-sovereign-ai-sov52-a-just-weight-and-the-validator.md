# 2026-10-27 — Sovereign A.I. week 52: a just weight and the validator that checks the file

**Module id:** `sov52-a-just-weight-and-the-validator-that-checks-the-file`
**Record:** [DR-1258](../decisions/DR-1258-a-just-weight-and-the-validator-that-checks-the-file-sov52.md)
**Course:** Sovereign A.I. (tech), week 52
**Row:** `agent_inbox` `60972a31-db63-4959-8a50-ee58a28643d4` · research item `7c5c5edd-443e-4a3c-a7c3-f85d43631347`

## What he sent

A link to **veraPDF** down the app's own research road, under his one word, **"Lesson,"** with his own note on why it mattered: open source, hundreds of checks, metadata read into a report to be used as a foundation for a new file, duplicate detection.

## Why it was built by hand

The row waited about **119 hours**. The NAS lesson builder claimed it four times and failed each time; its own recorded reasons across the day were the account's session limit (`HTTP 429 … resets 2am (America/Winnipeg)`) and an OAuth refresh race (`another Claude Code process is refreshing it`). Neither is fixable from this repository, and DR-1219 says a waiting teaching is built rather than watched.

## What the road actually returned

A **service notice**. The reading step never completed — *"not made yet (the tower had not answered); the source below is the whole of the research."* The page carried the maintainers' own statement that the website and other online resources had been taken offline as a precaution following news of a critical vulnerability affecting PHP, with thanks to members who helped assess it, plus a one-paragraph product description.

That thinness is stated inside the lesson rather than disguised, and it turned out to be the week's best material: the validator does not depend on PHP, so the **shopfront** went dark while the tool's own work did not, because it runs on the user's machine. The course's sovereignty argument arrived as evidence instead of assertion.

## The seam, kept visible

- **Established and stated plainly:** purpose-built, open source, covers all PDF/A and PDF/UA parts and conformance levels, designed for digital preservationists, supported by the PDF software developer community, copyright 2015–2026, offline by the maintainers' own decision.
- **Darrell's own description, named as his, not asserted as product fact:** the check count, the metadata report, duplicate detection. The one page confirms none of them.

## Measured

| measure | value |
| --- | --- |
| referenced quoted spans / corpus faults | **112 / 0** |
| bands (chars) | 4,535 · 7,968 · 13,694 · 14,498 |
| reading-grade ladder | 4.13 · 6.58 · 8.16 · 9.32 |
| worst band overlap (authored prose) | 0.170 (ceiling 0.5) |
| heading numbers | 1..10 contiguous |
| doubled words · elisions · generic "God" in our voice | 0 · 0 · 0 |
| `anchor.ref` | 32 references |
| cases | 54 (plus 22 in the class gate) |

## Two things worth carrying forward

**A register error, caught by checking the convention instead of assuming it.** The first senior band was written as facilitator notes ("Ask the room…"), but sov51's senior band addresses the reader directly. Teaching notes belong in `facilitator.howToRun`. Rewriting it in the reader's register also corrected a grade ladder that had senior reading *below* teen.

**A fault in the verification itself.** The obvious pattern for finding quoted Scripture mis-pairs quote marks when a short quotation sits in the prose — this lesson quotes his own word `"Lesson,"` — so the scan swallowed the prose *between* two real quotations. It produced five false "Yahweh inside a quotation" alarms and counted 104 spans where correct pairing counts 112: a false alarm and an undercount at once, both reading authoritative. The gate now pairs by splitting on the quote character, and a case asserts that the naive regex does mis-pair, so it cannot come back.

## Still waiting when this shipped

`d56b9e85` (~109 h) and `b97aa626` (~16 h), both genuinely unbuilt. Named here so the count is not lost.
