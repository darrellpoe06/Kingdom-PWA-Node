# DR-0878 — The reader's color picker reaches every door

- **Status:** accepted
- **Tier:** A (defect; one hook swap, no new behaviour)
- **Date:** 2026-10-10
- **Type:** product (defect)
- **Scope:** `app/src/components/PropertiesDoor.jsx`, `TlcPublicDoor.jsx`, `MooreDoor.jsx`, `app/src/__tests__/the-reader-color-picker-reaches-every-door.test.js` (new)
- **Principles:** VERIFICATION-DOCTRINE (DR-0076), SURFACE-SAYS-TRUTH, DR-0827 (the platform staples follow a person between the apps)
- **Grounds:** DR-0655 (the reader's own controls), `theme-css.js` `useThemePref`

## The word, as spoken

Darrell, 2026-10-10, inside Poe Properties:

> "can't change the color of the system using the reader controller... fix it"

## What was measured

The theme is ONE shared preference. `setThemePref` writes it and publishes to
every subscriber; `useThemePref` both subscribes and saves. The PoeTech shell
(`poe-financial-mvp-v28.jsx:1082`) uses `useThemePref` — so there, tapping the
reader's picker repaints immediately, which it always did.

All three doors held a private copy instead:

```js
const [theme, setTheme] = useState(() => readThemePref('cream'));
useEffect(() => { saveThemePref(theme); }, [theme]);
```

`readThemePref` runs ONCE, at mount. Nothing subscribes. So inside a door the
picker genuinely set the preference, the preference was genuinely saved to the
device, and the screen the reader was looking at never repainted.

| surface | subscribes? | the picker works? |
| --- | --- | --- |
| PoeTech shell | yes (`useThemePref`) | yes |
| PropertiesDoor | **no** | **no** |
| TlcPublicDoor | **no** | **no** |
| MooreDoor | **no** | **no** |

That is why this read as an intermittent, hard-to-believe fault rather than a
missing subscription: whether "the reader can change the system" depended
entirely on which door you were standing in. Darrell was in Poe Properties.

## Impact

A second writer for one preference is also how two copies drift apart: the
hand-written `saveThemePref(theme)` effect and `useThemePref`'s own save would
both have been live. Removing the effect with the hook swap is part of the
fix, not tidying.

Honest limit: this makes the doors HEAR the change. It does not widen which
elements the theme can reach — a surface painting color through inline
`style` is still unreachable by `[data-theme]` rules, which is the separate
problem DR-0873 measured and paid down.

## The decision

All three doors use `useThemePref('cream')`, the same primitive the shell
uses. The hand-written save effect goes with it, because the hook persists.

## Outcome

**38 green** across the new gate (9), `the-reader-can-change-how-it-looks` (13)
and `properties-door-render` (16); eslint clean.

Proven-to-catch, and deliberately pinned on the SHAPE rather than on a color:
the gate fails on the presence of `useState(() => readThemePref(` in any door,
because a surface that reads the preference once can never be correct however
the palette changes. Restoring the old two lines in any of the three turns it
red by name.
