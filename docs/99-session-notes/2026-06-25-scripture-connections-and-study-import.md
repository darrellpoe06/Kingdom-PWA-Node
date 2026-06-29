# Scripture connections engine + Study-import (Logos-style word study, modular)

**Date:** 2026-06-25
**Branch:** `feat/scripture-connections-study-import`
**Gates:** 2169 vitest green (35 new) · `npm run build` green · live-verified in the browser preview.

## What shipped

Two related capabilities, both built as proper MODULES on shared primitives (scalability standard), using ONLY open / public-domain study data.

### A) Bring scripture lessons into the personal Study (the content flywheel)
- **`lib/studyable.js`** — the studyable sibling of `presentable.js`: a surface-agnostic
  `studySeed` contract + pure adapters (`studySeedFromVerse / Theme / Connections /
  Discernment / Sermon`). A new source = one more adapter, no change to the Study.
- **`lib/study-space.js`** — added `source` provenance to the entry shape (back-compat:
  old entries -> null), plus `entryFromSeed`, `seedKey`, `addSeedToStudy` (idempotent —
  re-saving refreshes, never duplicates), and `deriveFrom` (the flywheel: CREATE a new
  study seeded from an existing one). All pure + tested.
- **Surfaces:** `ScriptureLibrary` gets a per-verse **"+ Study"** button; the connections
  panel gets **"+ Add to my Study"**; `Study` shows a "saved from …" provenance badge and
  a **"✦ Create from this"** action on every card.
- **Gate-respecting (premise surfaced, not silently widened):** the Study is circle-gated
  (Darrell / Christina / Bishop Gwin). "Add to my Study" renders only where Study is
  already reachable (`canStudy` = `isStudyCircle`). Opening the Study to all signed-in
  users is a one-line governance flip Darrell owns — NOT done here. Live-verified: the
  Add-to-Study buttons are correctly hidden when not signed in.

### B) Logos-style scripture connections engine (sovereign, public domain)
- **`lib/scripture-tsk.js`** — public-domain **Treasury of Scripture Knowledge**
  cross-references (17 anchor verses seeded; fetched from openbible.info, not from memory).
  License cited (TSK public domain; openbible.info compiled set CC BY 4.0). Honest seed —
  the full PD dataset drops in as data with no code change.
- **`lib/scripture-strongs.js`** — a Strong's concordance index **derived** from the
  Study Edition's existing verified `wordStudy` (reuse, not fork). `versesForStrongs` is the
  concordance link, honestly bounded to the tagged corpus.
- **`lib/scripture-connections.js`** — the unifying engine. `connectionsFor(ref, ctx)`
  composes: verbatim text, themes (`findByRef`), merged cross-refs (TSK + theme-overlap,
  deduped + source-labeled + navigable flag), word study, the two-layer Study Edition entry,
  and **appearances** in the church's real sermons / lessons / songs (the harvest — injected
  rows via DI, honestly empty when none provided). `relatedWeb` exposes navigable neighbours.
- **`components/ScriptureConnections.jsx`** — the reusable explorer: tap a verse -> the web;
  tap any in-library cross-ref to recenter (bidirectional, live-verified John 3:16 <-> Romans 5:8);
  link-outs for refs not carried (never a painted verse). Mounted in `ScriptureLibrary`.

### C) Modular for scalability
Both capabilities are reusable engines on shared primitives, mirroring `presentable.js`.
No DB migration (Study = device-local localStorage; connections = computed / read-only) —
which keeps the auto-merge lane clean.

## Verification (DR-0076)
- 5 new test files, 35 tests (proven-to-catch: honest TSK absence, appearance fabrication,
  source-collision, idempotent save). Full suite 2169 green; production build green.
- Browser preview: connections panel renders live (KJV text, TSK badges, Strong's G25,
  public-domain license), cross-ref navigation recenters the web, Add-to-Study gate honored.

## Follow-ups (honest boundary)
- Wire real sermon/lesson/song rows into the Scripture surface so "appearances" is live there
  (engine + tests already support it via DI).
- Governance: decide whether to open the personal Study to all signed-in users (one gate flip).
- Extend the TSK + Strong's seeds toward the full public-domain datasets (data-only).
