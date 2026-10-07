# 2026-10-07 — The TV reader: controls on the sides, full screen, whole lists, and why it slowed down

Darrell, on the Firestick in the wall-mounted Hisense, in this order:

1. *"I can't change reading speed nor other items inside the reader tab because it's hard to scroll the reader section... it doesn't show all control options... maybe we need to pull out the controller for TV? And bigger screens when detected or on Firestick"*
2. *"It does read though!!!!"* / *"Nice!!!!"* — the screenshot: the lit sentence, the docked bar (Following · Back · Pause · Next · Window · Read).
3. *"Can't scroll lists of lessons on Firestick... how can we choose from the whole list in a Firestick?!!!"* — Church → Learn, OCTOBER 2026 · 7, four lessons visible.
4. *"Maybe put the other reader options on the sides in the black space... so all options are always there... unless we go to full screen then the controls are not there just listen to the app and seeing the Word"*
5. *"The reader begins to slow down on firestick... longer pauses... etc... over time... why?!!!!!"*
6. *"Comprehensive fixing... not quick and undermining... thoroughly testing and getting it right asap and high quality"*

## What his words became

- **DR-0785** — the Read Aloud panel splits into two rails on a TV (and any screen ≥ 1600px): play on the left, how-it-sounds-and-looks on the right, always there; `<main>` is inset by the rail width so the Word narrows between them (the shell's main is full width — a premise the test caught before it shipped); ⇔ Sides / ⇕ Tall in the header, kept on the device; ⤢ Full screen hides the rails, the dock and the header (Back, Esc or a faint corner mark returns); on a TV every inner scroll box inside `<main>` is flattened so the page is the only scroller, and the dock grows ▲ Up / ▼ Down chips that page 80% of a screen per click.
- **DR-0786** — why it slowed down, measured in the code: every saved sentence awaited a full scan of every clip on the device; every read awaited a write; the fetch-ahead asked the NAS for three against a cap of two. Fixed at the root (one count, scheduled eviction past the cap, batched "last played", `AHEAD_CONCURRENCY` pinned to the NAS by CI), and the pause itself is now measured per piece and said in the panel's last-trip line.

## Evidence

- `reader-controller-pulls-out-on-tv.test.jsx` 12 · `lesson-lists-reach-the-whole-list-on-a-tv.test.jsx` 7 · `the-reader-does-not-slow-down-over-time.test.js` 12 · every reader panel suite re-run green (16 files, 144 tests) · voice suites green (7 files, 75 tests).
- Not yet measured: the Firestick's own wait numbers. The next reading on the TV writes them into the Read Aloud panel after it ends.
