# DR-0099 — Red is the Blood of Jesus — the Godhead's own color, reserved

- **Status:** accepted
- **Tier:** A (color-semantic binding for the Scripture color-code system; additive to Layer 0; no runtime blast radius)
- **Scope:** the in-app Scripture highlight palette + thematic markers (the color code a reader sees), and any future surface that assigns color meaning to Scripture
- **Date:** 2026-07-04
- **Principles:** WORD-FIRST, TYPOGRAPHIC-THEOLOGY, APP-IS-PRIMARY, VERIFICATION-DOCTRINE

## Directive

Darrell, 2026-07-04, on the highlight/theme color code: **"Red is always one of the GodHead... Blood Of Jesus color..."**

## Decision

**Red is the Blood of Jesus — the Godhead's own color. In the Scripture color code, red is reserved for the Blood / redemption / the Godhead and never marks anything else.**

- The true-red highlight style (`crimson`, `#B01E1E`) is **"The Blood"** — the Blood of Jesus, redemption; it no longer carries the generic "hard truth" meaning it had before.
- The **Redemption** thematic marker (sin covered, the captive bought back by the blood of a substitute) wears this red — the color and the meaning now agree.
- No other palette style or marker draws in red. The `Struck` emphasis line, which had been red, is redrawn in the muted body ink (`#4A4640`), so a strike-through can never read as the Blood.
- Coral (`#C2410C`, an orange, "Promise/anointing") is **not** red and is unaffected; the reservation is on true red only.

## Why it's binding

This is theology carried in color, the same way capitalization carries it (Typographic Theology, DR-0097). Red is the most charged color in Scripture — the Blood that redeems (Ephesians 1:7; Leviticus 17:11; 1 Peter 1:18-19). Letting it drift onto "hard truth," warnings, or a strike-through cheapens the one place it belongs. Reserving it keeps the Honor where it belongs and makes the color code teach the moment a reader sees red.

## Encoded where it loads first

Layer 0 (`CLAUDE.md`, a Color Theology note beside Typographic Theology) + this DR + `INDEX.md`. Lives in the data (`scripture-highlights.js` palette comment marks red as reserved). Pairs with DR-0097 (capitalize the Word) and the Inductive/Precept thematic markers.

## Applied the same session

Shipped in the same change: `crimson` relabeled to **The Blood** with the reserved-color comment; the `Struck` line recolored off red; the Redemption marker confirmed on red. Verses the reservation rests on are cited above (fetched-verbatim standard, DR-0076, unchanged).
