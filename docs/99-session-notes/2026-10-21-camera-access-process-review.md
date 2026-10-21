# Camera access, end to end — a comprehensive process review

**Date:** 2026-10-21
**Asked for by Darrell:** *"So those work together like they currently should... review for end to end comprehensive understanding and implementation of the process and effectiveness of the process and workflows"*
**Standard run:** `COMPREHENSIVE-REVIEW-STANDARD.md` (DR-0239), procedure `SHOULD → ARE → GAPS → CLOSE` (DR-0219).
**Records that came out of it:** DR-1170 (the hero), DR-1171 (the pre-ticked suggestion).

---

## 1. SHOULD — the documented intent, cited

| what it should do | where that is written |
|---|---|
| The owner's device mints a grant on the NAS — a token for a named viewer, a subset of cameras, an expiry — and **the NAS enforces what the token may see** | DR-0778 |
| A grant can **ride a door**: the tenancy row carries it, everyone who signs into that door reads it as their Cameras tab, taking it back clears the row and revokes on the NAS | DR-0841, `door-cameras.js:8-14` |
| A camera can be **asked for and given per person** — a tenant, a household member, a 1099 worker, a short-stay guest — with the ask, the decision and the expiry on the record | DR-0938, `CameraAccess.jsx:1-21` |
| A door's cameras are shared **per door, never to the whole portfolio** | `DoorCameras.jsx:251` |
| One player holds one stream and **lets go** when replaced or ended; the NAS allows **3 live views of one camera** and ends the oldest beyond that | DR-1097, `camera-video.js`, `cams_forwarder.py:448` |
| The front door's big picture should **promote the service** — "the camera stream shows how access works... a potential tenant... will be able to see the level of services that were provided by us... tenants and 1099 workers... so it promotes" | Darrell, 2026-10-21 → DR-1170 |
| **Undocumented intent is itself a finding** (DR-0219): nothing stated anywhere which of the two grant paths wins on a device that holds both. See GAP 1. | — |

## 2. ARE — the real implementation, traced end to end

**There are two grant paths, and they are genuinely different things.**

**Path A — the door's grant (DR-0841).** Landlord opens a door's Cameras tab → `DoorCamerasTab` reads `listUrl()` with the family key `bridgeToken()` → `suggestDoorCameras` pre-ticks the cameras at that address → `createGrant({name: doorGrantName, cameras: picked, days})` mints on the NAS → `setDoorCameraGrant` writes `camera_grant` + `camera_grant_note` onto the `rental_tenancies` row → the old grant is revoked once the new one is on the door (`DoorCameras.jsx:170`). The tenant's side: `TenantCamerasTab` reads `doorCameraState(door).token` from that same row, calls `saveGrantToken`, and renders the Cameras surface **with the token passed explicitly** (`renderCameras(shared.token)`). Reaches **the tenant and their household** — `whoSeesDoorCameras`, model `TENANT_TABS`.

**Path B — the person's grant (DR-0938).** Owner saves an **ask menu** per door (`saveCameraMenu`) → a person on the door sees those names in `AskForCameras` and asks with a reason (`askForCameras`) → the owner grants with a length (`grant()` → `createGrant` → `decideCameraAccess` row in `door_camera_access`), or gives it outright to someone with no account (`giveNow()` → a `grantLink` to text) → the person's side reads `myLiveGrant(rows, me)` and renders **with that token passed explicitly** (`renderCameras(live.grant_token)`). Reaches **one named person**.

**The enforcement, measured.** `cams_forwarder.py:4061` filters `/list` by `grant_allows`; `/ticket` for anything else is `403 not-your-camera`. The service's own self-test asserts both at `:5255-5260`. Revocation is a real NAS action (`revokeGrant`), not only a row update, and both paths roll back the mint if the row write fails (`CameraAccess.jsx:93,127`; `DoorCameras.jsx:163`).

**The new front-door surface (DR-1170).** `PorchHero` reads `cameraCredential({bridge: bridgeToken()})` — **the single device slot** — asks `/list` with it, picks a front-of-house camera from the answer, and offers one press. Everyone, credential or not, gets the three-line access story.

**Verdict on "do those work together like they currently should":** the two paths **do** work, each is enforced by the NAS rather than by the tab, and both roll back cleanly on a failed write. They are **not** wired to each other, and three of the gaps below come from exactly that.

## 3. GAPS — named plainly, no "mostly works"

**GAP 1 — the two paths write the SAME device slot, and nothing says which should win.** `saveGrantToken` writes one key, `GRANT_KEY = 'poetech.cameras.grant.v1'` (`cameras.js:906`). Both paths call it from an effect: `DoorCameras.jsx:293` for the door's grant, `CameraAccess.jsx:244` for the person's. On a device holding both, **the winner is decided by React's effect order** (child before parent, so `AskForCameras`'s personal grant is written first and `TenantCamerasTab`'s door grant overwrites it) — an accident of tree position, not a decision anyone made or wrote down. It does not leak anything: the NAS enforces whichever token is sent, and both tabs pass their own token explicitly, so **the tabs themselves are correct**. What is affected is every surface that reads the slot — the main Cameras tab, and now the front-door hero.

**GAP 2 — one device, one grant, so a second door overwrites the first.** Same single-slot cause. A household on two properties, or a 1099 worker holding grants at several addresses, keeps only the last one written.

**GAP 3 — a revoked grant is not cleared from the viewer's device.** `takeBack` revokes on the NAS and updates the row; the stale token stays in `localStorage`. Not a security hole — the NAS refuses it — but the words the viewer then reads are *"the camera road did not answer"* rather than *"your access was taken back"*, which is the honesty failure DR-0076 exists to prevent, in miniature.

**GAP 4 — the hero has no door context.** It renders on the signed-out portal picker, before anyone says who they are, so it uses whatever single credential the device holds. Correct by the NAS, but it shows *a* porch, not provably *your* porch. Stated in DR-1170 rather than implied.

**GAP 5 — two independent lists for "which cameras does this door involve".** The door grant's pre-ticks come from `suggestDoorCameras`; the ask menu comes from whatever was saved, seeded from nothing. After DR-1171 the first is narrowed by unit and the second is not, so an owner setting the ask menu by hand gets no such protection.

**GAP 6 (closed tonight, recorded for the chain) — the pre-ticked suggestion offered the whole building.** Measured green on `expect(apt1).toEqual(apt2)` before the fix. DR-1171.

## 4. CLOSE — what was fixed, and the date on the rest

| gap | disposition |
|---|---|
| **6** | **Fixed** — DR-1171, with the old behaviour proven-to-catch. |
| **4** | **Stated, not fixed** — DR-1170 records it; the hero is honest about naming the camera it opens. `re-review: 2026-10-28`. |
| **1, 2** | **Not fixed tonight, deliberately.** The real fix is a multi-grant credential store — keep several grants on a device and choose among them — which changes `cameras.js`, the file every camera surface on the platform depends on, including the wall Darrell was watching tonight. That is a change to make with its proof and with someone awake, not at 07:20 after a one-line read. **`re-review: 2026-10-22`**, as its own PR. |
| **3** | **Not fixed tonight.** Clearing the slot on a `401`/`403` is small, but it belongs with 1 and 2 in the same credential-store change rather than as a third patch to the same object. **`re-review: 2026-10-22`**. |
| **5** | **Open question, not a defect.** Two independent lists may be right — what a door *shares by default* and what a person *may ask for* are not the same question. **`re-review: 2026-10-28`**: seed the ask menu from `suggestDoorCameras`, or write down why two lists is correct. |

## 5. Effectiveness — what the process is actually good at, and where it is thin

**Strong.** Enforcement is in the right place: the NAS, not the tab, and it is self-tested there. Both paths roll back a mint when the row write fails, so a grant never exists on the NAS with no record of it. Revocation is a real action on both sides. The landlord's tab shows **what the tenant sees** by asking the NAS with the tenant's own grant (`TenantEye`), which is independent verification built into the surface rather than a claim.

**Thin.** The device's credential is a single slot with no stated owner (GAPS 1–3) — the one structural weakness, and all three gaps are the same weakness seen from three angles. Nothing tells a viewer their access *ended*, as against *failed*. And nothing in the app yet shows an owner **every grant at every door in one place**; `DoorCameras.jsx:220` points at PoeTech → Cameras → Who can see, which is per-camera rather than per-door.

**Not verified in this review:** none of it was observed on the live site. The sandbox has no route to poetech.us or to the NAS (403 at the egress proxy, measured tonight), so every statement above is read from the code and from the NAS service's own self-test, and none from a running instance. The witness that could close that is a signed-in browser sweep, which the repo does not have.
