# 2026-11-26 — the classic Learn tools wear the new look (DR-1695)

Darrell: "what happened to the green section or the things that is like the full all the courses
looking like the old system? When is that update coming?" / "We have pictures. Why are we showing
words all the time?"

## Reality trace

- Real data: the classic tools read the mounted catalog and the device places; the pictures read
  `presentation-records.json` (the same approved covers the new look's cards use) via the
  presentation index LearnStudio already holds.
- Surface: `?view=church&sub=learn&learnStudio=1`, the "Every Learn Tool" panel opened, each area
  tab pressed (Courses, Continue, Latest, Browse, Find, Record, Downloads).
- Before: light cream card with text rows and green PLAY buttons inside the dark look; 0 images.
- After: dark panels, gold accents, course picture cards, lesson covers on every Latest/Continue row,
  picture tiles in Browse.

## How it works

`scripts/learn-classic-skin.mjs --write` walks ChurchLearn.jsx and every component it reaches
(learn-studio/ excepted), collects each color class, and writes `learn-classic-skin.css` from the
mapping in `lib/learn-classic-skin.js`. Adding a classic tool with a new color class fails the gate
until the generator is re-run; a new color fails until it is given a role.

## Measured (Playwright, vite dev with stub Supabase)

Per tool and width (360/390/1024): light panels 0, contrast failures 0, min ratio 10.15:1,
scrollWidth == viewport width.

## Not done here

- Thumbnails in Find-by-verse results and Record rows (skin only). re-review 2026-12-03.
- The "You just read something free" explainer below the panel is outside the tools; unchanged.
