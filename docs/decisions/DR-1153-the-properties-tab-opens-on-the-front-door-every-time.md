# DR-1153: The Properties tab opens on the front door every time — a visit to Edit is a visit, not a new default

**Date:** 2026-10-21
**Status:** accepted
**Tier:** A (a default inside one tab; no road, no schema, no money)
**Type:** product (Poe Properties inside PoeTech)

**Area:** `app/src/modules/properties/PropertiesTab.jsx` (`initialPane` no longer reads a per-device choice; the pane is not saved), `app/src/__tests__/properties-tab-front-door.test.jsx` (the default is pinned against a remembered Edit).

**Principles:** DR-0061 (the surface the person actually meets); DR-0106 (do, don't re-ask); the #2324 record of the two panes.
**Declared by:** Darrell, 2026-10-21, from the tab sitting on Edit: *"Default to the front door look in the properties tab!!!!!!!"*

---

## Context

#2324 gave the Properties tab two panes: the tenants' own front door, and Edit (the backend). It remembered the last pane on the device. One visit to Edit therefore made Edit the door from then on, which is what his screenshot shows: `EDIT` selected, "The backend your tenants never see," on a tab meant to show him what his tenants see.

## What was measured

`initialPane()` before: a backend deep link → `edit`; else the device's saved pane; else `front`. `savePane()` wrote every pick to `localStorage`. The test suite pinned "the choice is kept on the device."

## Decision

The tab opens on the front door every time. Only a deep link into the backend (`?tab=` or `?door=`, DR-0901) opens Edit, since that is where the link points. The pick is not saved; Edit is one tap away each time, as he asked.

## Impact

Owners meet the tab the way their tenants meet the door. Nothing else in the tab changes: Edit still carries every prop the shell hands it, "see what they see" previews still work.

`re-review: 2026-11-04` — whether a landlord working a door all day wants a "stay on Edit" switch; none is added until asked.

## Verification

`properties-tab-front-door.test.jsx` (6): PROVEN TO CATCH — with `edit` written under the old key, the tab still opens on the front door; a deep link still opens Edit; nothing is written to the device on a pick.
