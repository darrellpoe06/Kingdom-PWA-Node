# DR-1599: The Malcolm X lesson carries his name in its title

**Date:** 2026-11-19
**Status:** Accepted
**Tier:** A (one lesson's title text; no schema)
**Type:** fix
**Area:** Living Lessons, `app/src/lib/living-lessons/ll337-not-far-from-the-kingdom.js`
**Pairs with:** DR-1583 (L337)

## Context

Darrell, 2026-11-19: "The Malcolm X lesson needs his name in the title so it can be found... I can't find it... is it ready?" L337 (DR-1583) shipped as "Not Far from the Kingdom — a fallen leader, a changed mind, and the one Name". The name a reader searches by appeared only inside the text.

## What was measured

Before: the lesson's title held no "Malcolm"; his name appeared only in the text. After: the title starts with "Malcolm X", and the same full title opens the adult lesson and all four bands (6 places).

## Impact

A reader who looks for the Malcolm X lesson by his name finds it in the lesson list. Nothing kept against the lesson changes: the id, number and date are the same.

## Decision

The title becomes "Malcolm X — Not Far from the Kingdom: a fallen leader, a changed mind, and the one Name", and the full title that opens the adult lesson and every band (title-in-narrative gate) carries the same words. The lesson's id, number, date, text and verses are unchanged, so any record already kept against it still matches.

## Verification

The lesson's shared gate, `title-in-narrative-gate`, `doubled-word-guard` and `quoted-verse-is-the-verse`: 46 of 46. On merge: deploy run on main's head.
