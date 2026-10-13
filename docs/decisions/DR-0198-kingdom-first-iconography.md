---
id: DR-0198
title: Kingdom-First Iconography — emoji/icons are welcome where they serve the work, and the palette must carry Kingdom glyphs
status: accepted
date: 2026-07-20
tier: A
declared_by: Darrell
supersedes: none
amends: clarifies the emoji rule in CONSISTENCY-STANDARD.md (DR-0079); grows the UiIcon palette
principles: [CONSISTENCY-STANDARD (DR-0079), COMMUNITY-FIRST-MISSION, THE-WAY, VERIFICATION-DOCTRINE (DR-0076), PERPETUAL-IMPROVEMENT (DR-0075)]
---

## Context

Darrell, 2026-07-20 (after the notes-editing change removed two emoji to satisfy
the consistency guard):

> "we can have new emojis, we just have to have Kingdom ones too... not only... if
> they make sense with the work... we want that... Ways and documentation."

The consistency guard (DR-0079) ratchets NEW emoji-as-icon over a frozen per-file
baseline, pushing toward the `UiIcon` SVG primitive. That read as a blanket "no
emoji" ban. It isn't — but the rule needed the Kingdom intent written into it.

## The decision — the Way

**Iconography is Kingdom-first: emoji and icons are welcome where they serve the
work, and the palette must carry Kingdom glyphs (cross, dove, flame, crown, open
Word, church), not only secular UI symbols.** Three rules reconcile this with the
real reliability constraint:

1. **Reliability first — Kingdom glyphs ship as `UiIcon` SVG, not raw emoji.** The
   glyphs we most want — 🕊 dove, ✝ cross, ⛪ church, 📖 the Word — are exactly the
   ones that fell back to a **tofu box** on Darrell's (and COLG's) older phones.
   That is *why* the guard exists. So the way to "have Kingdom emoji" that renders
   on every device — the way that honors COMMUNITY-FIRST (COLG's elderly, novice,
   older-device users) — is to add the Kingdom glyph to `app/src/components/UiIcon.jsx`
   as a hand-authored SVG. It ships in the bundle, identical everywhere, never tofu.
   The palette now includes `cross`, `flame`, `crown` alongside `dove` / `bookOpen`.

2. **New emoji ARE allowed — the guard is a ratchet, not a ban.** When a raw emoji
   genuinely serves a *decorative / inline* spot (not load-bearing chrome), it ships
   by an **intentional baseline bump** (edit `scripts/consistency-baseline.json` for
   that file, as a recorded, reviewed act — the same ratchet that let ThinkingSpace
   go 20→23). Intentional and recorded is the bar; silent drift is what's blocked.

3. **"If they make sense with the work" — the test.** An icon/emoji earns its place
   by serving the meaning (a cross on redemption content, a flame on Pentecost, a
   dove on the Spirit). Decoration for its own sake, or a secular glyph where a
   Kingdom one fits the work, does not.

## Opportunities & Constraints

- **Opportunity:** the app's visual language carries the Kingdom, reliably, on every
  device — Kingdom-first *and* tofu-proof. The `UiIcon` palette grows as needs arise
  (DR-0075).
- **Constraint:** SVG glyphs are hand-authored on a 24×24 grid; each new one is a
  small drawing task. The three added here were verified to render real `<svg>` path
  geometry (test below); pixel-perfect refinement of `flame`/`crown` can follow
  (`re-review: 2026-10-20`, DR-0075) — a browser render wasn't available in-session
  to eyeball them, so that's stated honestly (DR-0076), not claimed.
- **Constraint:** this does NOT relax the anti-tofu guard for *load-bearing chrome* —
  nav/button icons still must be `UiIcon`, never a raw emoji.

## Verification (DR-0076)

`UiIcon.jsx` grows `cross` / `flame` / `crown` (Kingdom cluster, commented).
`ui-icon-kingdom.test.jsx` proves the names are registered and render real `<svg>`
path geometry, and that an unknown name renders nothing (no broken box). Lint +
consistency-guard (UiIcon is emoji-exempt) + full suite green. CONSISTENCY-STANDARD.md
updated with the Kingdom-First section. REV-0169; memory `feedback_kingdom_first_iconography`.
