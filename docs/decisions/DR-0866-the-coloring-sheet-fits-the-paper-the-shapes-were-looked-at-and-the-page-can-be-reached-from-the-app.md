# DR-0866 — The coloring sheet fits the paper, the shapes were looked at, and the page can be reached from the app

- **Status:** accepted
- **Tier:** B (family-facing teaching content for children; a new surface on every lesson card)
- **Date:** 2026-10-10
- **Type:** product + fix
- **Scope:** `app/src/lib/coloring-page.js` (`fitLines`, `sheetLayout`, `lineWidth`, `EM`, `SHEET`, `USABLE`, `coloringBooklet`, `bookletCount`; four symbol paths redrawn), `app/src/components/ColoringSheet.jsx` (new), `app/src/components/ChurchLearn.jsx` (two call sites), `app/src/__tests__/a-coloring-page-for-every-lesson.test.js` (16 → 28), `app/src/__tests__/the-coloring-page-can-be-reached.test.jsx` (new, 13)
- **Principles:** VERIFICATION-DOCTRINE (DR-0076 §3 proven-to-catch, §4 measure don't claim, §7 independent verification), COMPREHENSIVE-REVIEW-STANDARD (DR-0239 — the form-factor dimension, which is the one that was skipped), THE-APP-IS-THE-PRIMARY-ARTIFACT (DR-0065), NOTHING-WAITS (DR-0236), HOLD-THE-HAND-OF-THE-PROCESS (DR-0621), TYPOGRAPHIC-THEOLOGY (CLAUDE.md Layer 0)
- **Grounds:** DR-0865 (the coloring page library, shipped earlier the same day, which deferred the in-app surface to `re-review: 2026-10-17`), DR-0698 (downloading needs a free account; reading never does), DR-0691 (copy and behavior are tested together), DR-0688 / P68 (a control lives where its scope lives), DR-0381 / P15 (a surface never goes blank)

## The word, as spoken

Darrell, 2026-10-10: *"Coloring books with words inside... that reflect the same lesson..."*

Note the plural. He asked for coloring **books**. DR-0865 shipped pages, with no way to open one.

## What was measured

Three faults, all mine, all in code merged a few hours earlier in PR #2077. None was found by reasoning about the code; each was found by rendering the real artifact and looking at it.

**1. The sheet did not fit on the paper.** The first cut set the title on ONE line at font-size 44 and the verse at five words a line at 34.

- On the width model: **224 of 236** Living Lesson titles ran off the page, plus three verse lines. The median Living Lesson title is 81 characters — about 1,850px at font-size 44 on a sheet 792px wide. The longest is 164 characters.
- Measured for real, rendering all 236 sheets in Chromium and reading `getBBox`: **214 of 236 sheets had text off the paper, the widest single run 3,098px** — almost four times the width of the page.

So the library shipped a sheet that was unprintable for roughly 95% of the catalog. Two real sheets had been generated and read before it merged, which is how the lowercase `"jesus"` was caught. **Reading a sample proves the content and never the geometry.** That is the form-factor dimension of DR-0239, skipped.

**2. A symbol a child colors read as an obscene gesture.** The `hand` path drew a closed fist with one finger standing far above the others. Rendered, it is unmistakable. Because `give`, `help`, `hold` and `work` are ordinary words, the symbol chooser put it on **122 of the 236 children's sheets**. It shipped because the symbol library was written as SVG path data and never once rendered.

The same look found three more: `lamb` had a head floating detached beside its body — and Layer 0 confesses Jesus as the Lamb of Yahweh, so a malformed Lamb is not a cosmetic defect; `lamp` read as a tripod; `bird` as a pole between two arcs.

**3. The page could not be reached.** No button, anywhere. DR-0865 parked the in-app surface with `re-review: 2026-10-17`. A sheet nobody can open is not delivered (DR-0065), and the date is not a reason to wait when the work is buildable now (DR-0236).

## The decision

1. **Nothing is assumed to be one line.** `fitLines` wraps text and picks the largest size on a ladder that fits, and `sheetLayout` flows the page downward from however tall the title turned out. A 164-character title arrives **whole** — wrapped, never cut, never shortened. Wrapping is tried before shrinking, so a child gets the biggest text that fits.
2. **The symbols fill the room the words leave.** The first fix made everything fit and left four small shapes in the upper third above a dead white half. On a coloring page the picture is the product, so the shapes now take the whole of the space between the verse and the tracing row.
3. **Four paths redrawn, and a ratchet on the eyes.** No assertion can tell whether a path *reads* as what it claims — that needs a person. So every path is pinned by hash: any edit to any symbol turns the gate red until someone renders the library, looks at it, and updates the hash on purpose. The check cannot judge the drawing; it can refuse to let a drawing change unwatched. The specific hand fault is also pinned in the shape itself — four fingers, tops within ten units of each other.
4. **The sheet is reachable, and shown rather than merely offered.** `ColoringSheet` sits directly under *Talk about it together* — the family block — and renders the real sheet inline, with Print it and Save it. The SVG is built from `sheetLayout` as React elements, so nothing about a lesson is ever interpreted as markup.
5. **The book, which is what he actually asked for.** `coloringBooklet` prints every lesson in the course, one sheet a page, as a self-contained HTML document with no script and no stylesheet to fetch — so it prints the same from a phone, a Firestick browser or a desktop, online or off. It is a **course-scope** control and stands with the course's own Copy / Download / Print, never above one open lesson (P68 / DR-0688).
6. **Reading is free; taking it away asks for an account.** Looking at the sheet is reading and stays open to everyone. Print and Save are downloads and ask for a free account, the same line DR-0698 draws everywhere else.
7. **Nothing goes blank.** A lesson with no title says it has no page yet; a lesson that quotes no verse says its page carries words and shapes without one, and that nothing was invented to fill the space; a course with no sheets says so instead of hiding its button (P15 / DR-0381).
8. **A blocked print window is ordinary, not an error.** On a phone a popup blocker is normal, so the fallback saves the file and the note says exactly that — and the test presses the button with the window blocked and checks a file really was saved, because the copy claims one was (DR-0691).

## Verification

**41 cases green** across the two files (16 → 28, plus 13 new), eslint clean at `--max-warnings 0`, and 88 green across the ten ChurchLearn-adjacent suites.

- *Proven-to-catch, independently.* The pre-fix library was rendered in the same Chromium and measured: 214 of 236 sheets off the paper, widest run 3,098px. After: **0 runs off the sheet across all 236**, widest real run 570px where the model says 651 — the model over-states, which is the safe direction and is why `EM` is set to 0.58, wider than Georgia's real average.
- *The ratchet was tripped on purpose.* Changing one coordinate of the hand path (`M26 78` → `M26 79`) turns the gate red with the old and new hashes named.
- *The standing gate is the model, not the browser,* because CI has no renderer. The browser pass is a one-time independent measurement, recorded here. The model walks every run of all 236 sheets on every push.
- *The sheets were looked at.* Three real sheets (longest, median and shortest title) and the whole symbol library were rendered to PNG and read. That is how faults 1 and 2 were found, and it is the only step that would have found either.

## What is NOT in this slice, with a date

- **The width model is an estimate, not a per-device measurement.** It is deliberately conservative and was checked once against Chromium, but a device substituting an unusually wide serif for Georgia is not covered. A hard guarantee via SVG `textLength` is the obvious close. **re-review: 2026-11-10**
- **The symbol library is 16 plain shapes.** Nobody drew 236 pictures and this record does not pretend otherwise. Whether the littlest deserve real illustration for the Genesis→Revelation spine is a separate question, and belongs with that work. **re-review: 2026-11-10**
- **DR-0865's `re-review: 2026-10-17` is ANSWERED by this record** — both halves of it, the in-app button and the month booklet — and should not be swept again.
