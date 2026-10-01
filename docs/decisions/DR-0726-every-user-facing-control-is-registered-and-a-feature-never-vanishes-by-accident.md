# DR-0726 — Every user-facing control is registered, and a feature never vanishes by accident

- **Status:** accepted
- **Tier:** A (a test, a JSON registry and one line in the builder brief; no app behavior changes, no schema)
- **Type:** gate
- **Date:** 2026-10-01
- **Scope:** `app/src/lib/feature-registry.json` (new), `app/src/lib/feature-presence.js` (new), `app/src/__tests__/feature-presence.test.jsx` (new), `docs/templates/builder-brief.md` (one line)
- **Principles:** VERIFICATION-DOCTRINE (DR-0076: deterministic gates over claims, proven-to-catch), PERPETUAL-IMPROVEMENT (DR-0075), HOLD-THE-HAND-OF-THE-PROCESS (DR-0621), builder brief (DR-0697)
- **Grounds:** Darrell, 2026-10-01: *"Are we making sure we're not losing features accidentally?"*

## Context

The honest answer that day was no. The gates were about 6,000 vitest tests in four shards, lint and the guards, the chrome-layout probe, and `surface-audit --fail-on-new`, which scores a quality rubric. None of them asked whether every user-facing control still exists. Seven open PRs were reshaping the same reader surfaces at the same time: #1891 text size, #1915 level choice, #1917 background audio and one reader, #1918 floaters into the bottom bar and a hide-bottom-block button, #1919 add my voice, #1920 my voice, #1922 downloads. A control could drop when one PR restructured a panel and another merged on top, or when a builder "moved" a control and lost it on the way. Only a test that happened to cover that exact control would catch it.

## What was measured

- **Walked the code on origin/main (e17de76a)** for every interactive control on the guarded surfaces, by rendering each surface in jsdom and listing every button, link, input, select, textarea and role-bearing element, then reading `TTSControl.jsx` for controls that only render in some states (a registered lesson, a Wake Lock, the NAS voice, reading, minimized, the mini-player).
- **146 controls registered across seven surfaces:**

  | Surface | Registered |
  |---|---|
  | READ ALOUD panel (button, panel at rest, start-at list, reading, pill, mini-player) | 51 |
  | header bar (Give, account, Help, text size, reading voice, the tucked-away header's controls, shell-inline controls and mounts) | 24 |
  | lesson reader (the guide after Start) | 22 |
  | Learn lists (departments, course picker, order, shelf, find, course tabs, row Open and Play, Latest lessons) | 16 |
  | Books (Upload, its panel and file input, the twelve tabs, the mount) | 16 |
  | lesson header (All courses, All lessons, Prev, Next, Share, Copy lesson, Copy link, Start, Play, Present, Mark done, Share this part) | 12 |
  | footer bar (Feedback, Give floater and its mount, Read aloud mount, Reset to seed) | 5 |

- **The app shell cannot be rendered in jsdom** (5,300 lines, Supabase, the PIN gate). Existing tests pin it by source text (`header-layout.test.js`, `books-upload-every-tab.test.jsx`). The gate does the same for controls written inline in the shell (Subscribe, the header theme swatches, Switch profile, Install, Feedback, Reset to seed, the Books tab labels) and for the mount of each header and footer component; the components themselves are rendered.
- **Not on main, so not pinned:** the Books Reports tab (the Books tab row has no Reports tab at e17de76a), and the controls the open PRs above add. Each is registered by the PR that adds it. The registry's `notPinned` list keeps these, with the states jsdom cannot reach (paragraph jumps while following a live reading; Resume and Continue offers, covered by their own render tests).
- **Gate time:** the seven surface walks run in about 40 seconds in one file, inside the existing shards.

## Impact

A control that disappears from a guarded surface now fails CI with its plain name and where it lived, for example `Missing: Copy link (lesson header)`. A builder who moves or restyles a control updates its locator in the same PR; a builder who means to remove one says why and which DR in the registry, where the reviewer sees it in the diff. Darrell gets a yes to his question that is proven by a test, not a promise.

## Decision

1. **A committed registry**, `app/src/lib/feature-registry.json`. Each entry: `id`, a plain `name`, the `surface`, and `find`, exactly one of `testid` (preferred), `role` + `name` (a substring of the accessible name), `role` + `nameMatch` (a regular expression), `selector`, or `source` (a pin in the shell). One entry per line so a change reads cleanly in a diff.
2. **The gate**, `app/src/__tests__/feature-presence.test.jsx`, renders each surface the way the existing render tests do, walks it through the states a person reaches, and fails with the plain list of missing features. It also fails when an entry is malformed, when a surface has no walk, or when a walk guards nothing.
3. **A feature leaves only on purpose.** Its entry moves from `features` to `removed` with a `removedBecause` line and a `dr` reference, and the gate checks that the DR file exists. A deletion without those fails.
4. **Every builder goes through it.** `docs/templates/builder-brief.md` carries: *"Moving or restyling a control: update its registry entry's locator; never drop it."*
5. **It rides the vitest shards.** No new required check.

## Verification

- **Proven-to-catch, in the suite:** the gate's own walk renders the real lesson header, deletes every Copy link button from the live DOM, and must report exactly `Missing: Copy link (lesson header)`. Separate checks prove the multi-surface report wording, that a removal without `removedBecause` and a DR is refused, and that a shell source pin that no longer matches is reported.
- **Proven-to-catch, on the code:** with the Copy link button deleted from `ChurchLearn.jsx` (not committed), the gate fails with `Missing: Copy link (lesson header)`; the output is in the PR body.
- **Green on main's code:** all 146 registered controls found.
- *re-review: 2026-10-15* — once the seven open reader PRs have merged, confirm each added its entries, register the Books Reports tab if it has landed, and extend the walks to the next surfaces (Church home, Books sub-tab bodies).
