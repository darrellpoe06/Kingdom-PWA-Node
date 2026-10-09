# 2026-10-07 — Access is given and taken back, never a password

**Layer 4 working note.** Decision: DR-0778. Pairs with DR-0777 (the garage, the kept sign-in), DR-0756 (the camera road), DR-0613 (the family key provisions itself).

## What Darrell said

- *"My wife and family should also have access to my cameras.... unless I say no... One time setup for owners and they can give access to who they want.... inside or out somehow..."*
- *"I don't want them to time out after any times... create a new API key when necessary if ever... unless we want to change the access for those we have because we never give a password just access and no access whenever the owner wants to... make sense?"*

## What was measured

- The gate was an email allowlist (`isFamilyEmail`) and one shared family bearer; taking access from one person meant rotating the key for everyone.
- The forwarder had one `_authed()` with nine callers and no notion of a viewer narrower than the owner.

## What changed

- `cams_forwarder.py`: grants (`camera-grants.json`, 0600): `POST /grants` (owner) -> `{id, token, link_path}` once; `GET /grants`; `POST /grants/<id>/revoke`. `_viewer()` = owner | grant; `_may_see(camera)`; `_may_act()`. Read roads admit a grant for its cameras; `/list` returns `access`; owner roads refuse a grant. Selftest 8h.
- `cameras.js`: `adoptGrantFromUrl` (boot), `cameraCredential` (bearer first, grant second), `grantToken` / `saveGrantToken`, `fetchGrants` / `createGrant` / `revokeGrant`, `grantLine` / `grantState` / `grantLink`.
- `surface-access.js` + `surfaces.js`: the `cameras` requirement (family OR `hasCameraGrant`); the shell's viewer carries `hasCameraGrant`; `main.jsx` adopts `?cams-grant=` before anything else reads the address.
- `Cameras.jsx`: `AccessPanel` (owner: Give someone access -> link shown once + Copy; list with last used; Take back), `AccessChip` (holder: whose access, until when, doors; remove from this device); the holder loses setup, restart, recording, access management; an ended grant says so.

## For Darrell

In Cameras, scroll to **Who can see the cameras**, press **Give someone access**, type Christina, keep *every camera*, keep *Until I take it back*, tick *The doors too* if she should open the garage, press **Make the link**, then **Copy the link** and text it to her. Opening it on her phone is the whole setup. The list shows when she last used it; **Take back** ends it.

## Open

- In-app delivery to a signed-in family member (no link to text): re-review 2026-10-21.
- What emptied go2rtc's config at 07:31 CDT (DR-0777 follow-up).
