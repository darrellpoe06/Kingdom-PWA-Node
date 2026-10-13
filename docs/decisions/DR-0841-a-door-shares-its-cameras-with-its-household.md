# DR-0841 — A door shares its cameras with its household

- **Status:** accepted
- **Tier:** B (a tenant-facing capability on a live door; the NAS still enforces every camera a grant may open; nothing new reaches the LAN or the Funnel)
- **Type:** feature
- **Date:** 2026-10-09
- **Scope:** `infra/supabase/migrations-auto/0258-a-door-can-share-its-cameras-with-its-household.sql` (`rental_tenancies.camera_grant`, `camera_grant_note`), `app/src/modules/properties/door-cameras.js` (new, pure plus the one write: `doorGrantName`, `suggestDoorCameras`, `grantNote`, `grantIdOf`, `doorCameraState`, `setDoorCameraGrant`), `app/src/modules/properties/DoorCameras.jsx` (new: `DoorCamerasTab`, `TenantCamerasTab`), `app/src/modules/properties/model.js` (a Cameras tab on the tenant and the manager faces), `app/src/modules/properties/PropertiesApp.jsx` (door-scoped; `renderCameras` prop), `app/src/modules/properties/cloud.js` (the doors read carries the grant), `app/src/components/PropertiesDoor.jsx` (hands the Cameras surface to the module), `scripts/system-flow-registry.mjs` (`door-cameras` node, `db:rental_tenancies`), `app/src/__tests__/properties-door-cameras.test.jsx` (7).
- **Principles:** DR-0778 (a grant is a token for a named viewer and a subset of cameras, minted on the NAS, never the family key), DR-0756 (one restreamer, one road), DR-0061 (the row the tenant reads is the real state), DR-0076 (the list is the NAS's, the grant is minted there; a NAS that does not answer is said), DR-0827 (the tenants' version of the app, the lost low-hanging features back), DR-0837 (an option inside the door).
- **Grounds:** Darrell, 2026-10-09: *"Also want to be able to add the Wyze cameras for 805 Prospect Ave Champaign Illinois apartments cameras specifically... porch etc... available when we want the tenants to have access to the cameras... make sense?"*

## Context

The cameras could be shared with a person (DR-0778): the owner's device mints a grant on the NAS with a name, the cameras it opens, an expiry and whether the doors come too, and hands the link to one phone. A tenant is not one phone; a tenant is a door, and the household behind it changes. Nothing tied a grant to a door, and the Poe Properties faces had no Cameras tab at all.

## What was measured

- `lib/cameras.js` 876-982: `GRANT_TOKEN` `g.<id>.<secret>`, `createGrant({ name, cameras, days, actions }, token)`, `revokeGrant(id, token)`, `saveGrantToken`, `grantLink`; `Cameras.jsx` 1456: a device with no family key and a saved grant runs as `kind: 'grant'` on that token alone.
- `rental_tenancies_read` (0150) lets the tenant and the household read their own row; `rental_tenancies_update` (0055) is owner/admin/member only, so a tenant can read a grant and never write one.
- The 805 cameras on the NAS are named `805 Porch Cam`, `805 Back Door`, `805 Front Outside`, `805 Hallway - North East`, `805 Upper Hallway - South West`, `805 North`, `805 North East`, `805 Apt 4`, `805 Basement`, `805 Front Office View` (cams-diag 37879231884): the house number is the word that picks them.

## Impact

- Unresolved: the porch and hallway cameras at 805 exist for the landlord alone; a tenant who should see who is at the door cannot, and giving them a personal link means a new link for every household.
- The call obligates: the grant belongs to the door; the household reads it from their own row and watches through the same NAS road on that grant alone; taking it back clears the row and revokes the grant on the NAS, in that order of truth (the NAS is the gate, the row is the carrier).

## Decision

1. **The tenancy row carries the door's grant** (0258): the token and a plain note of what it opens and until when.
2. **The landlord's Cameras tab, inside the door:** the NAS's camera list read with the family key this device holds; the cameras carrying the door's address ticked already (`suggestDoorCameras`: the house number first); a grant minted on the NAS named for the door (`805 North Prospect Avenue · Apt 4`), no door actions, for the chosen time; the token and the note written onto the row. No key on the device, or a NAS that does not answer, is said and nothing is minted.
3. **The household's Cameras tab:** with a grant, the row's token is saved on the device and the family's own Cameras surface renders on it (the Poe Properties door hands the surface in; in PoeTech the tab offers the grant link instead); without one, *your landlord has not shared any camera with this door yet*.
4. **Take back:** revoke the grant on the NAS by the id inside the token, then clear the row.
5. **Which cameras at 805:** the landlord ticks them per door; the porch and the shared hallways are the ones a household should see, an apartment's own camera is not shared to another door. That choice stays the landlord's hand, suggested, never assumed.

## Verification

- `properties-door-cameras.test.jsx`: the grant name, the suggestion by house number and by a word of the address, the note with and without an expiry, the id from a token, the row's state (none, shared, garbage), the row write and clear with the exact patch; the landlord's tab with the NAS list and the 805 cameras ticked, Share minting a grant with those ids under the door's name and writing the token and note; a sharing door showing what and Take back revoking on the NAS and clearing the row; no family key, and a 503 from the NAS, each said with nothing minted; the household's tab saving the token and rendering the surface on it, the PoeTech link when no surface is handed in, and the honest line when nothing is shared.
- The properties suites still green with the Cameras tab on both faces; interconnect guard 13/13 wired with `door-cameras` placed; module-boundary guard clean; eslint clean.
- Owed after merge: db-migrate applies 0258; a grant minted for the 805 door from Darrell's device and a tenant phone showing the porch camera through it (the first field read).
- `re-review: 2026-10-23`: whether a household member's own device should also be able to approve a wall screen (DR-0778 pairing) on the door's grant, and whether the grant should expire with the lease end automatically.
