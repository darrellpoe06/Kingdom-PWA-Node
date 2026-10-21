# DR-1181: The Life Hub shows your home, live — and for everyone else it says what the space is for

**Date:** 2026-10-21
**Status:** accepted
**Tier:** B (the Big Picture tab's home screen, family-facing copy; no money, no schema)
**Type:** feature

**Area:**
- `app/src/lib/hub-camera.js` (new)
- `app/src/components/HubCamera.jsx` (new)
- `app/src/components/LifeHub.jsx` (the header)
- `app/src/__tests__/hub-camera.test.jsx` (new)

**Principles:**
- DR-0061: reality-trace the surface before building it.
- DR-0065: the app is the primary artifact.
- DR-0076: unknown never looks like fine.
- DR-1046: the Life Hub is the home.
- DR-1097: one player, one stream, and at most three views of one camera.
- DR-1176: the same promoting half, on the Poe Properties door.

## Context

Darrell, 2026-10-21, with a screenshot of the Life Hub and the empty space beside its title circled:

> *"I would to have a live stream of the camera chosen by the user as a livestream... just because we can... right where the white box is... make sense? With a connect a camera feed or even a ability to see smaller ones and click on one to stay there consistently... make sense... it should be a picture of their home or a home and the text explains the function of the space... make sense?"*

Then: *"Advertising the app... family operating system shows privileges other's potential users would like to be able to use..."* And: *"We already have a cameras tab... this would be great to have as another big picture location for advertising that surveillance is also available... make sense?"*

## The reality trace (DR-0061)

- **Real data.**
  - The credential is `cameraCredential({bridge: bridgeToken()})`: the family key, or a grant the owner gave this device.
  - `GET /cams/list` with that key answers only the cameras it opens. The NAS is the wall, and `/ticket` returns 403 for any other camera.
  - The live picture is the Cameras tab's own `TileLive`, already exported for DR-1176. One road and one player, not a second copy.
  - The small frames come from `GET /cams/snap/<id>.jpg?w=320`, asked with the same key.
  - The kept choice is `poetech.hub.camera.v1` on the device.
- **The surface.** `LifeHub.jsx`'s header, which is the Big Picture tab's home (DR-1046), in the space Darrell circled.
- **Not observed live.** This sandbox has no route to poetech.us. The live read is the re-review below.

## Decision

1. **A device that holds a camera key sees its chosen camera, live, in that space.**
   - It plays the camera's SD twin when the NAS keeps one.
   - Up to four of its other cameras sit small beneath it, as still frames asked once a minute while the page is visible. They are never more live views.
   - A tap keeps a camera there on this device. A kept camera the credential no longer opens is never played; the first camera plays instead.
2. **It plays on its own**, unlike the Poe Properties door, which keeps its photograph and plays the porch only on a press (DR-1176).
   - Only a device already holding a key ever sees the stream, and Darrell asked for it live.
   - Leaving the Hub unmounts the player, and its cleanup gives the stream back (DR-1097, nineteenth read). A test pins that the element it played has no src afterwards.
3. **A device with no key sees a painted home and the words for the space.**
   - The house keeps no stock photography (HomeHero.jsx).
   - The words: *"Family Operating Systems can keep a camera of your home right here: the one you choose plays live, the others wait small beneath it, and a tap keeps the one you want."*
   - Then where the rest lives: recordings, who may watch and for how long, and the garage door, in the Cameras tab, for the family and anyone the owner shares a camera with.
   - Nothing is asked of the NAS for that device. A test pins zero calls.
4. **Every state says what it is, in words:**
   - asking which cameras the key opens;
   - a key that opens no camera yet ("Connect one in the Cameras tab", with a Cameras button);
   - a road that did not answer. That is never shown as "no cameras" (DR-0076).

## Not built, with the why

- **No "Connect a camera" button for a device with no key.** The Cameras surface is `whenDenied: 'hide'` for anyone who is neither family nor holding a grant. A button from the home screen would open a door the registry hides, and the Life Hub does not know `isFamilyMember`: the shell is frozen and hands it nothing. The advert therefore says where cameras live and who gets them, rather than offering a press that might lead nowhere.
- `re-review: 2026-10-28`: if the shell starts handing the viewer to Home (DR-0078 budget permitting), offer the button to the family.

## Proven

- `hub-camera.test.jsx`, 9 cases:
  - the lib's choice, small frames and states;
  - the advert with zero NAS calls;
  - a keyed device playing the first camera's SD twin, with four still frames and exactly one ticket;
  - a tap keeping a camera and switching the player;
  - the kept choice playing first next time;
  - the connect and no-answer words;
  - the stream given back on unmount.
- PROVEN TO CATCH:
  - ignoring the kept choice turns 3 cases red;
  - reading a dead road as "connect" turns 2 red.
- The Life Hub suites still pass: `life-hub`, `heritage-home`, `the-big-picture-is-the-familys-years` (62 cases).
- `verify:gates` 0; legibility PASS; eslint 0.
