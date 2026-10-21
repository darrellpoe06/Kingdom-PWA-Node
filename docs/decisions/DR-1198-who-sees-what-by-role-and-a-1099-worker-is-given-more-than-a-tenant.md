# DR-1198: Who sees what, by role — the access matrix evaluated, and a 1099 worker is given more than a tenant where the family chooses

**Date:** 2026-10-21
**Status:** accepted
**Tier:** A (a read-only matrix on the People tab; a refusal that names its cause; one case added to an existing smoke; no wall moved)
**Type:** product (access) + surface
**Area:**
- `app/src/modules/properties/access-matrix.js` (new): the evaluated matrix, every face × every thing a door holds, with the wall that enforces each cell
- `app/src/modules/properties/AccessMatrix.jsx` (new): "Who sees what" on the People tab, one face at a time
- `app/src/modules/properties/CameraAccess.jsx`, `app/src/lib/cameras.js`: a camera gift that is refused says exactly why (`badCameraIds`, the NAS's own code, the database's own message)
- `infra/supabase/tests/0266-door-camera-access-smoke.sql`: the family gives a 1099 worker five cameras, three off the door's menu
- Tests: `access-matrix.test.js`, `properties-work-on-any-door.test.jsx` (two cases), `door-camera-access.test.jsx` (the mirror in its mock)

**Grounds:** DR-0076 §8 (provenance and honest uncertainty: a refusal names its cause), DR-0938 (a worker or guest is given cameras by a grant of their own), DR-0330, DR-0219, UX-PATTERNS 2g.
**Declared by:** Darrell, 2026-10-21, with the Give-access form open on Apt 2: *"We need to be able to give 1099 workers more access and or different access than a short term renters or even a tenant... so cameras we give 1099 workers maybe basement... where as we may not usually give that to anyone else except management... I tried to give 1099 workers in apt 2 access to more than the 2 I gave to the short stays... it would not work... fix it."* Then: *"And or pictures etc."* And: *"All access to the different options per user needs to be evaluated for correct access and flexibility that gives us options to do what we want."*

## Context

**SHOULD.** The family can give a 1099 worker more than a tenant or a short-stay guest gets — the basement camera, the door's condition pictures — and the rules for every face are evaluated, written down where people are invited, and enforced by the walls they name.

**ARE, traced through every leg of the gift.** A gift to a worker is minted on the NAS (`cams_forwarder.py` `grant_normalize`: any list of ids in the grammar `^[A-Za-z0-9_.-]{1,64}$`, any count, up to 3650 days; the owner's bearer only), then written as a `door_camera_access` row (`0266`: a gift needs the family and the minted token; **only an ASK is checked against the door's menu, never a gift**; cameras 1–64). Nothing in either wall limits a worker to what the door offers its tenants. Pictures: a delegated worker already reads every picture filed to the door (`0185`), where a tenant reads listing shots only (`0309`, DR-1199). So the access Darrell wants is what the walls allow today; the failure he met was not a wall.

What the path did NOT do was say why it refused. The NAS refuses the whole list when one id is outside its grammar (`bad-cameras`) and the app turned that into *"Pick at least one camera, or every camera"* — which he had; a database refusal reached the screen as the bare word `write-failed`. A refusal that cannot be read is indistinguishable from a wall, and that is the "it would not work" this record answers. The matrix itself did not exist: the README held a seven-row table from 2026-08 that predates pictures, cameras, papers and the private notes.

**GAPS.** The refusal's cause; the matrix. **CLOSE.** Below. A reproduction of his exact refusal was not possible from here (the sandbox has no road to the NAS); what was proven is that every leg of the gift accepts a worker with five cameras, three off the menu, and that the next refusal will name itself.

## What was measured

| what | before | after |
|---|---|---|
| a worker's gift of five cameras, three off the menu, through the database (0266 smoke, fresh PostgreSQL 16) | untested | accepted; the row keeps all five; the worker reads nothing of the gift row (it reaches them by link) |
| what the app says when the NAS refuses a camera id | "Pick at least one camera, or every camera." | the ids it would refuse, named before anything is sent; else the NAS's own code |
| what the app says when the record is not written | `write-failed` | the reason and the database's message |
| the access matrix | a seven-row README table from 2026-08 | nine rows × seven faces, each cell with reads, writes, the road, the family's hand and the wall; on the People tab |

## Decision

1. **The access matrix is the evaluation, kept where the walls are described and read where people are invited.** `access-matrix.js` states every cell; `access-matrix.test.js` pins the cells that matter most to the policy text (the gift never checks the menu; the worker's camera cell says any cameras; the worker never reads rent or the private notes; a tenant never reads another tenancy's condition pictures) and the forwarder's grammar to the app's mirror. A changed wall is a changed cell.
2. **A 1099 worker is given more than a tenant by the family's hand, and the hand is named in the matrix:** cameras by the Give-access form, as 1099 worker, any cameras; condition pictures and the door record by the delegation on the invite. Nothing new was built for this because nothing withheld it; the 0266 smoke now proves it on every run.
3. **A refusal names its cause.** `badCameraIds` names the ids the NAS would refuse before a mint; `createGrant` carries the NAS's own code; the desk shows the database's message beside the reason.

## Impact

Darrell gives a worker the basement and sees the gift land, or reads exactly which id or which wall refused it. The family reads who sees what on the People tab before inviting anyone, one face at a time.

## Verification

- Door-work chain on a fresh PostgreSQL 16 in this sandbox: exit 0, `DOOR CAMERA ACCESS SMOKE: PASS` with the worker's five-camera gift, `DOOR PICTURES SMOKE: PASS`.
- `access-matrix` 7 cases, `door-camera-access`, `cameras`, `properties-work-on-any-door` (the People tab carries the matrix for the landlord, opening on the worker; a tenant's face has neither): green. Lint 0.
- Not seen rendered: the live pass is the stewards' after deploy (DR-0104). If a gift is refused again on the phone, the message now carries the cause; that message is the next finding.

## What this does not do

- It does not reproduce the refusal Darrell met; it makes the next one legible and proves the walls accept what he asked for.
- It does not change what a short-stay guest or a tenant is given: those stay by the family's hand per person and per door.
