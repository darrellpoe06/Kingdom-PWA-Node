# DR-0872 — A repeated JSX prop silently wins; it now fails the build

- **Status:** accepted
- **Tier:** A (gate + mechanical correction, no behaviour decision)
- **Date:** 2026-10-10
- **Type:** gate
- **Scope:** `app/eslint.config.js` (`react/jsx-no-duplicate-props: error`), and the 25 corrections in `ReadinessTab.jsx`, `Bookstore.jsx`, `Library.jsx`, `DataLiberation.jsx`, `PropertiesApp.jsx`, `DoorCameras.jsx`, `Storefront.jsx`
- **Principles:** VERIFICATION-DOCTRINE (DR-0076 §2 deterministic gates, §3 proven-to-catch), PERPETUAL-IMPROVEMENT (DR-0075)
- **Grounds:** DR-0860-class legibility passes; PR #1149 (the oldest surviving instance)

## The defect

Writing JSX, a second `className` on the same element is not an error. React
keeps the **last** one and silently discards the first — taking its sizing,
spacing, border and layout classes with it. Nothing warns. The element simply
renders wrong.

Found while tracing an unrelated report, on a line this session had itself
written that morning:

```jsx
<span className="text-[0.625rem] uppercase tracking-wider"
      className={p.state === 'built' ? 'text-[#2F5D50]' : 'text-[#8A867E]'}>
```

## What was measured

Grep found 17. Enabling the rule found **25** — grep could not see the
multi-line cases, which is itself the argument for the gate over the habit.

| file | count |
| --- | --- |
| `ReadinessTab.jsx` | 7 |
| `Bookstore.jsx` | 5 |
| `DataLiberation.jsx` | 4 |
| `Library.jsx` | 4 |
| `PropertiesApp.jsx` | 2 |
| `DoorCameras.jsx` | 1 |
| `Storefront.jsx` | 1 |
| **flagged by the rule** | **24** |
| `PropertiesApp.jsx:1512`, corrected by hand before the rule was enabled | 1 |
| **total** | **25** |

Every one came from the same mechanical act: an inline-colour → themed-class
pass that appended a new `className` instead of merging into the one already
there. The oldest is from **PR #1149**, months back. They were invisible to
every existing gate because the *colour* was correct — the contrast checker
was satisfied while the layout had quietly fallen off the element.

`react/jsx-no-duplicate-props` was simply not in `eslint.config.js`.

## Impact

This is a whole bug CLASS, not an incident: any future mechanical sweep over
`className` reproduces it, and the symptom (slightly wrong spacing or a
missing border) is exactly the kind a reader blames on their own screen. One
of the 25 was on the Guest Ready panel Darrell had photographed hours earlier.

The gate costs nothing at runtime and forbids a construction that is never
intentional — hence `error`, not `warn`.

## The decision

Enable `react/jsx-no-duplicate-props` as **error** in `app/eslint.config.js`,
and merge all 25 duplicates into single attributes — template literals where a
conditional was involved, plain concatenation where both were static. No
visual intent was changed; in every case the first attribute's classes were
being dropped, so restoring them is the correction.

## Proven-to-catch

The rule was run against the tree **before** the corrections and flagged
**24**, naming file and column for each. (The 25th, `PropertiesApp.jsx:1512`,
had already been corrected by hand minutes earlier — which is why it is absent
from that run and counted separately above. Stated precisely rather than
rounded up to a tidier number.) After the corrections the same run reports
**0**.
That is the DR-0076 §3 requirement met in the order it requires: shown to
catch the real break first, green second.

Pinned in `the-people-on-a-door-have-names.test.jsx` so the rule cannot be
quietly dropped from the config again.
