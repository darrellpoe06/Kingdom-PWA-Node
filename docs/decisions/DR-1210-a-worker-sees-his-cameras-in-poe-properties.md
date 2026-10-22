# DR-1210: A 1099 worker is given cameras by his account and sees them in Poe Properties. Giving him more replaces his grant, and he never sees the household's

**Date:** 2026-10-22
**Status:** accepted
**Tier:** A (app-side; no migration; the security model is unchanged: RLS decides reads, the family key stays on the owner's device, grants are per person and revocable)
**Type:** fix + surface truth
**Area:**
- `app/src/modules/properties/CameraAccess.jsx` (`CameraAccessDesk`: pick someone signed into the door, `person_user_id` on the gift, replace-on-give, the refusal shown beside the button; `AskForCameras`: a live gift opens by its link when no camera surface is handed in)
- `app/src/modules/properties/DoorCameras.jsx` (`TenantCamerasTab` takes `role`; only tenant and household read the door's grant; `DoorCamerasTab` hands `people` to the desk)
- `app/src/modules/properties/door-cameras.js` (`giveRoleOf`, `signedInOnDoor`, `heldBy`; `menuReach` and `CAMERA_REACH.worker` corrected)
- `app/src/modules/properties/people.js` (`peopleOnDoor` carries `userId` from the invite's `claimed_by`)
- `app/src/modules/properties/PropertiesApp.jsx` (passes `role` to the Cameras tab)
- `app/src/modules/properties/access-matrix.js` (the worker's camera cell)
- `app/src/__tests__/worker-cameras-in-properties.test.jsx` (14 cases, 13 fail on the old code)
- `infra/supabase/tests/0266-door-camera-access-smoke.sql` (§4c: a gift by account is read by that worker alone)

**Grounds:** Darrell, 2026-10-22, with screenshots of 805 North Prospect Avenue · Apt 2: *"Still can't give a 1099 worker more cameras... all of them would have cameras and they should be showing on their cameras tab inside the Poe Properties App... sometimes they will not have the PoeTech App... so they will need to see them there... make sense?"*
**Principles:** DR-0076 (no claim without evidence; proven to catch); DR-0061 / reality-trace before building a surface; DR-0219 (SHOULD → ARE → GAPS → CLOSE); DR-0938 (asked for and given, per person); DR-0841 (the door's grant is the household's); DR-1179 (a share says whether it can reach anybody); DR-1198 (a refusal names its cause)

## Context

**SHOULD.** DR-0938 / migration 0266 set out that the family gives cameras "to a person with an account, or by LINK to someone with none", and its read policy hands a row to `person_user_id = auth.uid()`. `WORKER_TABS` (`model.js`) carries a Cameras tab whose stated purpose is *"watch the ones given to me"*. The door's own grant (DR-0841) belongs to the tenant and the household only.

**ARE.** I traced the code from the owner's "Give access to anyone" through to the worker's Cameras tab:

1. `CameraAccess.jsx` `giveNow` wrote every gift with **no `person_user_id`** and never offered one. So 0266's read policy never handed the row to the worker's session, `myLiveGrant(rows, me)` (`door-cameras.js`) never matched it, and a gift could only travel as an SMS link. The smoke pinned the same assumption: `0266-door-camera-access-smoke.sql` §4b asserts *"a gift reaches its holder by link"*.
2. The account id needed to fix (1) was not available. `peopleOnDoor` (`people.js`) dropped the invite's `claimed_by`.
3. With **Who** empty, the press refused with *"Name who it is for and tick at least one camera."* That line was written to the shared `msg` at the very foot of the desk, under the whole holders list. In his screenshot the Who field is empty and the count stays 0, which is a press that looked like nothing happened.
4. Giving again to the same person **stacked** a second grant. Their current cameras were not ticked, nothing was taken back, and `myLiveGrant` shows only the newest grant. So "giving more" handed the worker *fewer* cameras on his tab.
5. `TenantCamerasTab` read `door.camera_grant` for **every** face. A worker holding `property.history` reads the tenancy row (`rental_tenancies_read`, 0150). So the worker's Cameras tab opened the **household's** cameras and saved that token on his device, while the owner's screen said *"A 1099 worker... never do."*
6. In `AskForCameras`, a live gift with no `renderCameras` handed in (the PoeTech shell passes none) rendered no cameras and no link.
7. `menuReach` told the owner *"A 1099 worker ... never see this list at all"*. That is false. `WORKER_TABS` has a Cameras tab, `PropertiesApp` renders `AskForCameras` on it, and `door_camera_menu_read` (0266) admits `door_role_of_user = 'worker'`. His own screenshot 1 shows the worker's preview listing the 2 askable cameras.

The NAS has no cap on cameras per grant (`cams_forwarder.py` `grant_normalize` accepts any list of valid ids). The ledger allows 1 to 64 per row. So the cap was never the cause.

## What was measured

- `worker-cameras-in-properties.test.jsx`, run against the `origin/main` copies of the four source files: **13 failed, 1 passed** (the one that passes is the "tenant face unchanged" guard). With the fix: **14 passed**.
- Affected suites after the fix: `door-camera-access` 12/12, `properties-door-cameras` 18/18 (one assertion moved to the new sentence, same meaning), `sharing-says-who-can-actually-open-it` 12/12, `access-matrix` 7/7.

## Impact

- The owner picks **someone signed into this door** (a 1099 worker among them). The gift is written with their account, and the cameras appear on the **Cameras tab of their Poe Properties app**, live, with no PoeTech app needed. A person with no account is typed by name and still gets the link.
- **Giving again replaces.** That person's current cameras are ticked for the owner, so giving more means ticking more. The new grant carries them all, and the earlier grant is taken back on the NAS and on the ledger. The screen says so before the press and after it.
- "Who holds access now" shows each holder with **"in their Poe Properties app"** or **"by link"**, and keeps Take back.
- A worker's Cameras tab never reads, shows or keeps the door's household grant. He sees only rows given to him (RLS).
- A refusal is shown **beside the Give access button**.

## Decision

1. A gift to someone signed into the door carries `person_user_id`. That id comes from the invite's `claimed_by`, and it is the only way a gift reaches that person's own session.
2. One person, one live grant per door. Giving again replaces the grant, never stacks a second one. The replace is said in words before the press and after it.
3. Only the tenant and household faces read `rental_tenancies.camera_grant` in the app.
4. The menu's words follow the code. A signed-in worker sees the menu and can ask. A short-stay guest never sees it.

**Not done, with why and a date.** The database still lets a delegated worker with `property.history` SELECT the `camera_grant` column on the tenancy row (0150 is row-level, and 0258 added the column with no column grant). This change stops the *app* from reading or using that column for any face but the household's. Closing it in the database means moving the column behind a security-definer read and changing the owner's and the tenant's read paths too, which is a larger change of its own. **re-review: 2026-10-29.**

## Verification

- `npx vitest run src/__tests__/worker-cameras-in-properties.test.jsx`: 14/14. Against the old source: 13 fail (proven to catch).
- `npm run -s lint` and `npm run -s verify:gates` in `app/`: see the commit's run.
- `0266-door-camera-access-smoke.sql` §4c (a gift by account is read by that worker, token and all, and by no tenant, household member or stranger; the worker cannot rewrite it) runs in the dispatch-only `rls-isolation` workflow against the real database. **It was not run from this sandbox.**
- **Not measured:** the live NAS camera road and a real worker's phone. The sandbox cannot reach the NAS or poetech.us. The first live proof is the owner picking a signed-in worker on Apt 2 and that worker's Cameras tab showing the frames.
