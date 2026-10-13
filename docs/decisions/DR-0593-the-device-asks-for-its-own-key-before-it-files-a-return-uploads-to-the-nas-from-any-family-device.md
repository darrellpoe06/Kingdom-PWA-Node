# DR-0593 — The device asks for its own key before it files a return: uploads to the NAS work from any signed-in family device, and the archive shelves by entity

- **Status:** accepted
- **Tier:** A (one component, one message, no schema, no transport)
- **Type:** fix
- **Date:** 2026-09-23
- **Scope:** `app/src/components/BooksTaxes.jsx` (provision-before-upload; the device's key state on the form; the empty state leads with the in-app upload; a by-entity shelf); `app/src/lib/tax-upload.js` (the 401 message says what actually helps); `app/src/__tests__/books-taxes-render.test.jsx` (+5 pins)
- **Principles:** DRIVE-DONT-DELEGATE, REVIEW-OUR-WAYS (DR-0108 — a "must-be-by-hand" is a premise to challenge), REALITY-TRACE (DR-0061), VERIFICATION-DOCTRINE (DR-0076), the key provisions itself (DR-0574)
- **Grounds:** Darrell 2026-09-23, from the Taxes screen on his Fold: *"we need to be able to upload through the PoeTech App to our nas!!!!!!! Make sense?!!!!"* and *"Christina needs to be able to upload our tax documents and they should be able to be stored in our nas and accessed through the PoeTech App and have a location to see our businesses documents"*.

## Context

Books → Taxes has carried an in-app upload since DR-0330: the form posts the PDF same-origin to the NAS tax service, which stores it under `tax-documents/<entity>/<year>/` and republishes the index the page reads. The screen he photographed showed the form and, below it, "No returns indexed yet" with a three-step by-hand route over SSH. The question was whether the road works, and for whom.

## What was measured

| what | measured |
| --- | --- |
| the road, from a runner (run 35933006510, 23:19Z) | `GET /poetech-app/taxes/archive.json` → HTTP 200 `{"documents": [], "served_at": "2026-09-23T23:15:41Z"}` (a real, empty index); `GET /poetech-app/taxes/upload` → HTTP 405 `method not allowed` (the FastAPI service answering, not the Funnel root); `/nas-photos/health` → `{"ok": true}` |
| the NAS (nas-health run 35923417492) | `poetech-tax-upload.service` loaded, active, running; the tax-upload installer enabled in the services-sync manifest |
| the app's auth | the upload sends `Authorization: Bearer <family bridge token>` from this device's localStorage; the service compares it to `TAX_UPLOAD_TOKEN` (the same family token, installed from `chat-bridge-token.txt`) |
| the gap | BooksTaxes never called `provisionBridgeToken`; only the read-aloud path and the Voice Studio do (DR-0574). A family device that had not opened Real Estate → Photos or read a lesson aloud posted with no key, was refused 401, and was told to "sign in again … to have it reissued", which reissues nothing |
| the "no returns" state | true: the index is empty because nothing has been uploaded yet; the by-hand route was presented as the way in while the in-app door stood unmentioned below it |
| after the fix | books-taxes-render 9/9 (5 new), tax-documents 19/19, tax-upload 10/10, tax-archive 8/8; lint clean; legibility PASS with the health artifact regenerated |

## Impact

Before: whether Christina could file a return from her phone depended on whether that phone had once opened an unrelated panel. After: the form asks the family for the device's key on mount and again before the first post, says on the form which of four states the device is in (holds the key · asking · just received · none, with what to do), leads the empty state with the in-app upload and folds the SSH route away, and shelves every stored document by entity (each business, each person) above the by-year archive, from the same index. Nothing is painted: no entity appears without a file.

## Decision

1. The upload provisions the key first (DR-0574's rule) and never posts a refusal it could have avoided.
2. The form states the device's key state plainly, and the 401 message names the real remedy: sign in as a family member so the device can ask; a steward publishes the key once in Real Estate → Photos.
3. The by-hand route stays, folded, as the second door; the app is the first (DR-0108).
4. The by-entity shelf is the "location to see our businesses documents": counts per entity from the live index, each document still listed under its year with the original printable.

## Verification

- Pins: a keyless device asks on mount and shows "no family key yet" when refused; a device holding the key does not ask and reads "holds the family key"; a device that receives the key reads "just received"; the empty state leads with the in-app upload and keeps the by-hand route under a summary; three documents across two entities shelve as "Poe Holdings LLC · 2 documents" and "Poe Family · 1 document".
- Runner measurement of the live road cited above; the NAS unit state from the box's own words.
- After deploy: Christina, signed in as a family member, opens Books → Taxes; the form reads "holds the family key" or "just received"; she chooses the entity, the year, the PDF, taps Upload to my NAS; the document appears under its year and under its entity with Open / print. That walk is the DR-0104 live review for this record.
- re-review: 2026-10-07 — whether the family bridge token has been published (0128's `set_family_bridge_token`) so devices can provision at all; if no steward has pasted it, the form will read "no family key yet" on every device and the paste is the one-time step.
