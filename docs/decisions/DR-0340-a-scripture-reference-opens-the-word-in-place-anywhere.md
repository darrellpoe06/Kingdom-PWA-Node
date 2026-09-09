# DR-0340 — A Scripture reference opens the Word in place, anywhere it is named

- **date:** 2026-09-08
- **status:** accepted
- **tier:** A (a reading affordance on existing surfaces; no schema, no money, no new external call — the KJV is already hosted in the app)
- **decides:** what a Scripture reference IS on any PoeTech surface — a button that opens the verbatim text where the reader already is — and the two primitives that make that one import instead of a re-implementation
- **pairs-with:** DR-0201 (inline, no jumping), DR-0131 / DR-0274 (the still screen), DR-0314 (a standard that lives only in code is a coincidence), DR-0076 (verbatim text, honest miss), DR-0098 (teach the Word, do not debate it), UX-PATTERNS Pattern 1 (the Scripture component) and Pattern 2g (reach, hit, name)
- **source:** Darrell, 2026-09-08, on the Torah pattern map: *"Make the bible verses clickable for seeing the Word when pressed... don't leave the page... just open right there... no quick moves to another place... open at the location it's clicked... don't want users needing to find the previous location... inline."* Then, sharpening the scope: *"really anywhere should have this ability... so the scriptures can always be read... anywhere at anytime... simple functions just to show the Word."*

## SHOULD / ARE / GAPS (DR-0219)

**SHOULD.** UX-PATTERNS principle 6 says a response to a tap appears where the eye already is; Pattern 2e says content a tap summons renders at the tap and the screen never flies; Pattern 1 says every reference renders through one Scripture component; the whole KJV is hosted in the app (`bible-kjv.js`, DR on 2026-07-04) precisely so the Word never needs a link out.

**ARE.** On the Torah pattern map a reference was a `<span>` — legible, inert. On the Scripture Library, cross-references were the same. In prose across Study, Learn and the map, a reference named mid-sentence was plain text. The one place references were buttons (`BibleReader`) navigated the reader away. Two separate reference matchers existed (`video-harvest.js`, `prep-outline.js`); neither reported positions, so prose could not be cut around a reference.

**GAPS → closed here.** Nothing in this record waits.

## Decision 1 — A reference is a button, and the Word opens beneath it

`components/VerseChips.jsx`: a row of reference chips; pressing one opens the verbatim KJV text directly beneath the row, in the same card, with the chip marked; pressing again closes it; several may be open at once, in chip order. There is no `href` in the component. If the opened verse's top edge sits below the fold, `gentleReveal` nudges by exactly the overshoot (usually nothing), honouring reduced motion. A verse the device cannot reach says so; it is never filled in.

## Decision 2 — Prose gets the same, without changing a character

`lib/verse-refs.js` (pure) cuts a paragraph into text runs and references using the ONE shared matcher (`video-harvest.js findScriptureRefs`, now position-aware and range-keeping — one regex, two readings). `components/WordInline.jsx` renders the runs as text and each reference as a chip *in its place*, showing the author's own words, and opens the verse beneath the paragraph. A paragraph with no reference renders as the plain element it was.

## Decision 3 — The sweep, measured, and what carries it today

Measured 2026-09-08 before writing (DR-0314): five components map a `refs` array to markup; nineteen render `whitespace-pre-wrap` prose. Wired in this change: the Torah pattern map (chips + `shows` / confession / reticence prose), Study (plain layer, deep source, scripture line), Learn (a story and its verse line), the Scripture Library (cross-reference chips). `EternalAlgorithmsStudy` already quotes its verses inline; `BibleReader`'s chips open the reader because it *is* the reader. **re-review: 2026-09-22** — walk the remaining prose surfaces (LessonFlow, PracticeLearn, the living-lessons bodies, the Godhead study) onto `WordInline`, and decide by measurement whether a source scan can gate "a reference rendered as inert text" without noise.

## Proven-to-catch (DR-0076 §3)

`verse-chips.test.jsx` (9) and `word-inline.test.jsx` (13): an `<a href>` anywhere in either primitive fails; text shown before the loader answers fails; invented text for an unreachable verse fails; a second chip closing the first fails; a chip under the 36px floor or without a focus ring fails; a changed character of prose fails; dropping the range capture from the shared matcher fails; a false positive on "LET GO AND LET GOD" fails; and each wired surface reverting to a plain `<p>` or `<span>` fails its pin. The real Torah map is mounted with the KJV fetch stubbed at the `bible-kjv` seam and proven to open Genesis 6:2 in the card without leaving the map.

## Consequences

The Word is one tap away wherever it is named, and the reader never has to find their place again. New surfaces get it by one import; the pattern is recorded in UX-PATTERNS as Pattern 2h so it is a standard, not a coincidence.
