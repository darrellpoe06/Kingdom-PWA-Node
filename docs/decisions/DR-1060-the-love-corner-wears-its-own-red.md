# DR-1060: The Love Corner wears its own red — measured from the church's emblem, not picked

**Date:** 2026-10-16
**Status:** accepted
**Tier:** B (the church's identity on every surface of its own door)
**Type:** word
**Area:**
- `app/src/lib/theme-css.js` (three new themes; `CHURCH_DEFAULT_THEME`)
- `app/src/poe-financial-mvp-v28.jsx` (the church door's fallback — one line for one line; the shell did not grow)
- `app/src/__tests__/the-love-corner-wears-its-own-red.test.js` (new)
- `app/src/__tests__/books-reports-theme.test.jsx` (the two coverage registries learn the new themes)

**Grounds:** Darrell, 2026-10-16: **"We want to keep the Love Corner signature colors of red and white and some black... however mostly red and white... also... make that the default color when it shows initially... and have other options that look amazing and meek strength under control... sound and solid... perpetual... intimately intuitive engineering... modern and elegant"** — then, with the church door on screen: **"Make sure you taking care of the Love Corner App"**
**Principles:** DR-0076 §4 (measure, do not claim); DR-0099 (red is the Blood — the reservation, and its real scope); DR-1046 (Heritage is the family app's first-run theme); DR-0524 (a device that chose keeps its choice)

## Context

The Love Corner has worn a black ring, a white field and a red heart since
1946, and the app's church door wore none of it. Darrell asked for the
church's own colors to be what a member sees when the door first opens, with
two further palettes to the brief. Nothing in the repository declared a brand
color for that door, so the red had to be found rather than chosen.

## What was measured

**No brand color existed for that door.** `manifest-lovecorner.webmanifest` ships the
generic `#1A1815`; nothing in `app-doors.js`, `church-own-door.js` or
`default-church.js` declares a red. The maroon on screen was the `rose`
palette's `#831843`, which is a wine, not the church's red.

**So the church's own emblem was decoded and sampled.**
`public/lovecorner-icon-512.png`, unfiltered scanline by scanline, strongly-red
pixels bucketed:

```
#E43C28  ×40   #E04028  ×29   #E4402C  ×29   ...
```

**`#E43C28`** — and the emblem is the brief in one picture: a **black ring**, a
**white field**, a **red heart** over the cross. He asked for red and white and
some black; the church has been wearing exactly that since 1946.

**Two constraints the palette had to satisfy, both measured before any CSS:**

1. **The emblem red cannot carry text.** `#E43C28` is **4.22:1** on white and
   **3.98:1** under white — both fail WCAG AA. It is a fill and a mark only.
2. **It must not be the Blood marker.** DR-0099 reserves true red inside the
   Scripture color code for the Blood of Jesus, and that palette's crimson is
   **`#B01E1E`** (`scripture-highlights.js`). A brand red landing on it would
   blur the one reservation this platform treats as doctrine.

So the text-bearing red is **`#C03222`**: the emblem's own hue (G/R 0.260 vs
0.263, B/R 0.177 vs 0.175), darkened until it carries white — and **25.9 away
in RGB from `#B01E1E`**, deliberately.

## The DR-0099 question, asked rather than assumed

Heritage's own header says *"True red marks nothing (DR-0099)."* That reading
had to be tested before overriding it, and it does not survive contact with the
rule's text: DR-0099 scopes the reservation to **"any Scripture color code…
(the in-app highlight palette, the Inductive/Precept thematic markers, and any
future surface that assigns color meaning to Scripture)."** A brand theme
assigns no meaning to Scripture.

**And the mechanism makes it impossible to cross anyway**, which is better than
an argument: the themes remap a fixed set of base literals, and `#B01E1E` is
not one of them. A test asserts the theme CSS contains it nowhere — with
comments stripped, since this record's own CSS header names it.

The deeper point: the church's emblem puts the red heart **on the cross**. The
red on this door is the Blood and the love, in the church's own symbol. It is
not red marking something else.

## Decision

1. **`lovecorner`** — `#FFF8F7` field, white cards, `#1A1012` ink (the ring's
   black), `#C03222` for every fill, rule and accent. Mostly red and white,
   some black.
2. **The church door opens in it**, by a **door fallback**
   (`CHURCH_DEFAULT_THEME`), not a new global default. **DR-1046 is not
   overturned:** Heritage remains the family app's first-run theme, by his own
   approval relayed by Christina *one day earlier*. A sentence about the
   church's colors is not a reversal of that, and silently treating it as one
   would be the worse reading of both. Every palette stays one tap away on
   both doors, and a device that chose keeps its choice (DR-0524).
3. **Two more options**, to the brief: **Anchor** (cool stone, white cards,
   deep ink, one controlled accent — meek strength, nothing raising its voice)
   and **Bedrock** (warm stone, paper cards, earth ink, bronze — sound, solid,
   settled). Cool and precise against warm and enduring, so the two are a real
   choice rather than one palette twice.

## Verification

- **Every ratio computed before a line of CSS was written**, with the guard's
  own math — 33 pairs across the three themes, all ≥ AA. Then the real guard
  was run over the real file: it parses all three and reports **0 violations**.
- **Proven to catch:** the emblem red fed in as the dark fill and the accent
  makes `checkContrastDetailed` return violations naming both `light-on-dark
  button` and `rust accent text`; the unmutated palette returns `[]`. That is
  the exact mistake the palette was designed around, refused by the gate.
- **The shell did not grow: 5193 → 5193.** One line out, one line in.
- **Three existing tests failed and all three were right.** Two coverage
  registries in `books-reports-theme.test.jsx` enumerate every theme the app
  offers and must be extended when one is added — so the new three are now
  actually covered by the chip-contrast check, not merely added. The third
  pinned `THEMES[0] === 'heritage'`, which encodes DR-1046; **my assertion was
  the wrong one and it changed, not theirs.**
- **One of my own checks matched its own documentation** — the `#B01E1E`
  assertion hit this record's CSS comment. Cured by stripping comments, and by
  asserting the stripper did not simply blank the file. The same self-match as
  `unknown-is-not-a-no-guard` a day earlier.
- Lint clean; 77 cases green across all 8 theme/contrast suites; 21 gates.

## What this does not do

- **It does not restyle any component.** The themes remap base literals, so all
  725 components inherit the finish and nothing they key on changes.
- **No dark sibling of Anchor yet.** A second dark theme would inherit every
  inline-color hazard `midnight` has without the dark-on-dark token scan that
  was built specifically for `midnight` (`contrast-guard.mjs`, `DARK_THEME`).
  Adding one means extending that scan to every dark theme first.
  **`re-review: 2026-10-23`.**
