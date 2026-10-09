# DR-0778 — Camera access is given and taken back by the owner, never a password

- **Status:** accepted
- **Tier:** B (a new credential class on a public door: per-person grants minted and checked on the NAS; owner-only management; proven by selftest)
- **Type:** feature
- **Date:** 2026-10-07
- **Scope:** `infra/nas-cameras/cams_forwarder.py` (`GRANTS_FILE`, `grant_*`, `_viewer` / `_may_see` / `_may_act`, `GET/POST /grants`, `POST /grants/<id>/revoke`, every read road admits a grant for its cameras; `pair_*`, `POST /pair`, `GET /pair/<code>`, `POST /pair/<code>/approve`, `GET /pair`; selftests 8h, 8i), `app/src/lib/cameras.js` (`adoptGrantFromUrl`, `cameraCredential`, `grantToken`, grant helpers), `app/src/lib/surface-access.js` (`cameras` requirement), `app/src/surfaces.js`, `app/src/poe-financial-mvp-v28.jsx` (`hasCameraGrant` on the viewer), `app/src/main.jsx` (the link is adopted at boot), `app/src/components/Cameras.jsx` (`AccessPanel`, `AccessChip`, `PairScreen`, `ApprovePairing`, the family key provisioning, the grant holder's views), `app/src/lib/help-content.js`, tests, `infra/nas-cameras/README.md`.
- **Principles:** DR-0065 (the app is the artifact), DR-0060 (the wall is the server, never the screen), VERIFICATION-DOCTRINE (DR-0076), DR-0756 (the home is the family's business), SOVEREIGNTY (the grant lives on the NAS, no cloud account)
- **Grounds:** Darrell 2026-10-07: *"My wife and family should also have access to my cameras.... unless I say no... as options and opportunities for them not to have to set it up... One time setup for owners and they can give access to who they want.... inside or out somehow"*; *"we never give a password just access and no access whenever the owner wants to... make sense?"*

## Context

The Cameras tab opened only for `family`, an email allowlist in the shell, and every device on it shared one family bearer. A wife not on the allowlist, a grown child at the other house, a neighbor watching the place for a week: none had a road in short of being handed the family bearer itself, which cannot be taken back from one person without rotating it for all.

## What was measured

| what | measured | basis |
| --- | --- | --- |
| the gate | `surfaces.js` `cameras` `requires: 'family'`; `isFamilyMember = isFamilyEmail(email)` | `poe-financial-mvp-v28.jsx:1235`, `surfaces.js:100` |
| the credential | one bearer for every family device, provisioned by `get_family_bridge_token` to members of the family instance | DR-0613, migration 0128 |
| what revocation meant | rotate the one bearer for everyone, or nothing | the forwarder had one `_authed()` and nine callers |

## Impact

Unresolved: access is all-or-nothing and family-only; sharing means sharing the master key. Resolved: the owner hands a person a link, scoped to cameras and time, with or without the doors, and ends it with one press; the person types nothing and never holds a password.

## Decision

1. **A grant is a per-person token minted on the NAS.** `POST /grants` (owner) takes a name, `"*"` or a camera list, `days` (0 = until taken back, up to 3650) and `actions`; it answers `{id, token, link_path}` once. The token is `g.<id>.<HMAC(bearer, id|salt)[:32]>`; the NAS stores only the salt and the record (`camera-grants.json`, 0600). `GET /grants` lists them with `last_used`; `POST /grants/<id>/revoke` ends one. A revoked or expired grant is refused on its next request; a tampered or unknown token the same way; an empty bearer secret admits nobody.
2. **The holder's device sends the grant as its bearer** and the forwarder's `_viewer()` admits it to the READ roads for its cameras only: `/list` (filtered, plus an `access` description), `/ticket`, `/snap`, `/why`, and `/devices` + `/action` only when the grant includes the doors and the device pairs with one of its cameras. Setup, restart, recording, clips and grants stay the owner's (401). Another camera is 403 `not-your-camera`.
3. **The link is the hand-over.** `/poetech-app/?view=cameras&cams-grant=<token>`: `main.jsx` adopts it at boot into the device's storage and takes it out of the address. The `cameras` surface requirement is now *the family, or a device with a grant*; the NAS, not the screen, is the wall for what it may see (DR-0060).
4. **The owner's tab gains "Who can see the cameras."** Give someone access (name, which cameras, how long, the doors too) makes the link, shown once with Copy; every grant is listed with when it was last used; Take back ends it. The holder's tab shows whose access it is and until when, and loses setup, restart, recording and access management; an ended grant says so and can be removed from the device.
5. **A screen is let in from the owner's phone, nothing typed on the TV** (added the same hour; Darrell from the Firestick: *"Even after logging into my PoeTech App on my Firestick... I have to log in.... I hate that!!! Fix it.... I also would like to use a qrcode to type into the Firestick"*). A device with no key asks `POST /pair` (open, throttled, codes live 10 minutes in memory) for a six-letter code from an alphabet with no 0/O/1/I, shows it as a QR of `?cams-pair=<code>` and as letters, and polls `GET /pair/<code>?w=<watch>` with a private watch token. The owner's phone opens the QR (the Cameras tab shows "A screen is asking to see the cameras") or types the code under Who can see the cameras, and `POST /pair/<code>/approve` (owner) mints an ordinary grant; the screen's next poll receives it ONCE and the cameras open. The grant is listed and taken back like any other. Also fixed: the family key now provisions itself on the Cameras tab (DR-0613's RPC was called only by the Photos, Taxes and Gallery screens, so a device that opened Cameras first, the Firestick, never asked).
6. **Nothing here is a password.** The family bearer never leaves the owner's devices; the grant never opens anything beyond its cameras; the owner's "no" is one press.

## Verification

- `cams_forwarder.py --selftest` 8h: making needs the owner (401 for a holder); name / camera grammar / expiry bounds (400); the file is 0600 and never holds the token; the list is newest first with no token or salt; an every-camera grant lists all and names itself; a one-camera grant lists one, mints a ticket for it, fetches its frame, asks why, and gets 403 on another; six owner roads refuse a grant and `/restart` does not restart; a grant without the doors gets 403 on `/devices` and `/action`; one with the doors opens the door; a one-camera doors grant cannot move another camera's door; revoke ends the link on the next request; a day pass dies on the clock; tampered and unknown tokens are refused; `last_used` is recorded.
- `cams_forwarder.py --selftest` 8i: a code with readable letters, a watch token, the link path; a second code inside the throttle refused; the poll says waiting; a poll without the watch token learns nothing; the pending list and the approval need the owner (a grant holder cannot approve); an unknown code is 404; approval makes a listed grant and the phone never sees the token; a code is approved once; the screen's next poll gets the grant and opens the cameras; the token is handed over once; an unapproved code dies on the clock.
- vitest `cameras.test.js`: the link is adopted and scrubbed from the address, junk ignored; the credential order; parse / state / line / link; the three calls and their failure copy. `cameras-render.test.jsx`: the owner's panel lists, makes (the link shown), takes back; a grant holder's device opens the tab with the grant as bearer, sees the access chip and none of the owner's controls. Surface suites: `cameras` requirement registered.

## Follow-ups

- A grant delivered inside the app to a signed-in family member (no link to text): the same record, carried by the database to the person's own devices. `re-review: 2026-10-21`.
- The LAN-direct HTTPS road named by DR-0776: its own record when it is built.
