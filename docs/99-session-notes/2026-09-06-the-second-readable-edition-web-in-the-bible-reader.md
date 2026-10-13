# 2026-09-06 — The second readable edition: the WEB in the in-app Bible reader

**Lane:** `claude/yahweh-actions-by-century-exjvvv` → PR → auto-merge.
**Pulled forward from:** Darrell 2026-09-06 — *"we want kjv and esv!!!!"*, *"why can't we carry a cited esv corpus? Or build our own quickly!!!!"*, *"we want users competent about the meaning of the message in any language... clarification is the highest level."*

## The honest answer on the ESV, restated
The ESV is Crossway's copyrighted text. `bible-editions.js` refuses to carry it by design, and `scripture-reading.js` already records the measured answer: *not possible without a licence.* Nothing in this pass changes that; ESV-worded quotations in lessons stay labelled `(Ref, ESV)` as attribution (PR #1458).

## What was built instead — the legal second edition, readable
The **World English Bible** (public domain; a modern-English revision of the ASV) was already ingested to `app/public/bible/web/*.json` in the same per-book shape as the KJV, and `bible-kjv.js`'s loader already served both — but the in-app reader only ever opened the KJV. Now (`BibleReader.jsx`):

- An **Edition** control (KJV · 1611 / WEB · modern English), 44px targets, in the reader's header.
- The chapter **reloads from the chosen corpus**; the rendered verse is the corpus verse (the gate reads the file and compares, never a typed expectation).
- The header names the edition; the **provenance line** (`provenanceLine`) shows under it — the WEB's *name* is a trademark, so the text is labelled as WEB exactly as the registry requires.
- The **copy** label follows the edition (`… (WEB)`).
- The choice is **remembered per device** (`poetech.bible.edition`, `readerEdition()` / `rememberReaderEdition()` in `bible-kjv.js`); only an edition on disk is ever stored.
- **Word-level highlight spans are scoped to the edition they were made in** (`Genesis 1:1@web`): the two editions word a verse differently, and a KJV span painted over WEB words at the same offsets would mark the wrong words. Existing KJV spans keep their keys untouched; whole-verse marks are per verse and shared.

Gate: `bible-reader-edition.test.jsx` (6) — default KJV; WEB reloads Genesis 1:1 to the WEB corpus verse (asserted different from the KJV's); provenance shows "World English Bible — Public Domain … eBible.org"; the choice survives a remount; a KJV span does not paint on WEB and returns on KJV; the pre-fix state (no Edition group, Genesis 1:1 never changes) asserted absent. Existing `bible-reader-render` (15) unchanged and green.

## Not done in this pass (and why)
- The **Scripture tab's read-aloud** still reads the KJV only (its own header documents the decision); reading the WEB aloud there is a follow-on once the reader edition is proven on the live site. re-review: 2026-09-13.
- **Lesson quotations** stay KJV (the per-lesson gates verify against the KJV corpus). A WEB rendering beside a KJV quotation is the Study Edition's job (`study-edition.js`), not the lessons'.
