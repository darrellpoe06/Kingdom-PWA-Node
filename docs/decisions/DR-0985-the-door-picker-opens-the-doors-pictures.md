# DR-0985: The door picker opens the door's pictures

**Date:** 2026-10-13
**Status:** accepted
**Area:** `PropertiesApp.jsx` (the door picker beside the face label)
**Amends:** DR-0978 (the picker holds every door)

## Context

Darrell, 2026-10-13, with a screenshot of the picker now holding every door:

> "The the drop down doesn't go directly to that page... it should right?"
> "Defaulting to the pictures tab... make sense?"
> "A faster way to get to the same thing as going down the list in the screen to see the image first... make sense?"

## What was measured

Choosing a door in the picker set the door and cleared the tab (`setTab('')`). The face then landed on its default tab, not the door's pictures. Seeing a door's images meant scrolling the Doors board to that door.

## Impact

The picker was the slow way to the thing he uses it for.

## Decision

- Choosing a door in the picker opens that door's **Pictures** tab, whenever the face has one unlocked.
- A face without one (a tenant, for example) keeps its own landing tab.
- The address follows the change (DR-0901), so the back gesture and a shared link land on the same page.

## Verification

- `the-door-picker-holds-every-door.test.jsx`: picking door 7 makes **Pictures** the active tab and puts `gallery` in the address.
- **Proven to catch:** with `setTab('')` restored, the case fails.
