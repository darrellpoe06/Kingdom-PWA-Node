# DR-0427 — The little ones grow too: small content text is floored at the prose size from Larger up

- **Status:** accepted
- **Tier:** A (a stylesheet rule and its pins; no schema, no money)
- **Date:** 2026-09-15
- **Type:** product
- **Scope:** `app/src/index.css` (the floor rule for `text-[0.5rem]`, `text-[0.5625rem]`, `text-[0.625rem]`, `text-[0.6875rem]` at `larger` / `largest` / `bigprint`, chrome excluded), `app/src/__tests__/the-little-ones-grow-too.test.js`
- **Principles:** COMMUNITY-FIRST (elders and children read here), WCAG 1.4.4 as the text-size primitive already claims, VERIFICATION-DOCTRINE (DR-0076), PERPETUAL-IMPROVEMENT (DR-0075)
- **Grounds:** `lib/text-size.js` (root-scale primitive, chrome cap — DR-0145, DR-0147, DR-0276), DR-0410 (the frame stays a frame at Big Print)

## The word, as spoken

Darrell, 2026-09-15, at A+++ on Lesson 152: *"Also want all text to be able to be big!!! Even the green space... when the text is enlarged... some text are way bigger than others well we want to see the little ones too!!!"*

## What was true

The text-size primitive scales the root, so every rem label grows — and keeps its ratio. At Big Print (2.75×) the prose (`text-xs`, 0.75rem) is 33px while a step marker or the stage meta (`text-[0.5625rem]`) is 24.75px and a `text-[0.625rem]` label is 27.5px. They grew and stayed the little ones, which is exactly what he saw: the words huge, the frame around them still small print. The chrome cap (DR-0276 rule 3) is correct for navigation and controls; it was never meant for content labels, blurbs, the green Word block or the verse chips.

## The decision

From **Larger** (1.5×) up, every small content size is **floored at the prose size** (0.75rem, line-height 1.5): `text-[0.5rem]`, `text-[0.5625rem]`, `text-[0.625rem]`, `text-[0.6875rem]`. Chrome keeps its cap: the rule excludes anything inside `.ts-chrome-region`, and the reading panel is em-sized and unaffected. Normal and Large are untouched, so a reader on the default sees nothing change. Hierarchy at big print is carried by case and tracking (the labels are uppercase and letter-spaced), not by being smaller than a reader can see.

## Proof

- Pinned: the stylesheet carries the rule for all three steps × four classes with the chrome exclusion, and never for Normal/Large.
- Measured in real Chromium on the built app (L153 open in Learn), computed font-size in px:

| element (class) | Normal | Big Print before | Big Print after |
|---|---|---|---|
| prose (`text-xs`) | 12 | 33 | 33 |
| stage meta (`text-[0.625rem]`) | 10 | 27.5 | **33** |
| stage blurb (`text-[0.6875rem]`) | 11 | 30.25 | **33** |
| verse chip button (`text-[0.625rem]`) | 10 | 27.5 | **33** |
| sub-nav label inside `.ts-chrome-region` (`text-[0.625rem]`) | 10 | 27.5 | 27.5 (capped, unchanged) |

  Normal is pixel-identical before and after.
- CI's `chrome-layout-probe.mjs` Big Print pass still holds the layout (no overflow, escape hatch on screen).

## Boundaries

- Fixed-px chrome (the text-size control itself) is unchanged by design — big text must stay reversible.
- Sizes above 0.6875rem are not touched; `text-[0.75rem]` and up already read as prose.

## Re-review

- **re-review: 2026-09-29** — walk one lesson at A44 on Darrell's phone; if any content label still reads small, name its class and add it to the floor.
