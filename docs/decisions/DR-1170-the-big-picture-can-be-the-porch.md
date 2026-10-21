# DR-1170: The front door's big picture can be the real porch — and for everyone else it says how access works

**Date:** 2026-10-21
**Status:** accepted
**Tier:** B (the Poe Properties front door — the first screen every applicant, tenant, worker and owner meets; COLG-facing copy, no money, no schema)
**Type:** feature

**Area:** `app/src/modules/properties/porch-hero.js` (new), `app/src/components/PorchHero.jsx` (new), `app/src/components/PoePropertiesWelcome.jsx`, `app/src/components/PropertiesDoor.jsx`, `app/src/components/Cameras.jsx` (one `export`), `app/src/__tests__/the-big-picture-can-be-the-porch.test.jsx` (new).

**Principles:** DR-0061 (reality-trace — name the real read and the real screen before building); DR-0065 (the app is the primary artifact); DR-0076 (unknown never looks like fine; measure, do not claim); DR-0841 (a door shares its cameras with its household); DR-0938 (asked for and given, per person); DR-1097 (one player, one stream; the NAS allows three views of one camera); DR-0778 (the grant is minted and enforced on the NAS).

## Context

**Darrell, 2026-10-21, with a screenshot of "805 porch floodlight cam east":**

> *"If a tenant or owner has access to the cameras make the big image have the option to open with the porch Floodlight cam... instead of the hero image make it a hero stream of the porch... make sense?"*

Then, unprompted, the reason it matters more than convenience:

> *"The camera stream shows how access works... If a potential tenant uses the app they will be able to see the level of services that were provided by us."*

And:

> *"Also... tenants and 1099 workers... so it promotes."*

So the big picture on the Poe Properties front door has two jobs, and the second one is the bigger. For a person whose device already holds a camera credential it can **be their porch, live**. For the applicant — who holds nothing — it has to say **what Poe Properties actually provides**, because that is the level of service being promoted, and a photograph alone says nothing about it.

## The reality trace (DR-0061), before a line was written

| | |
|---|---|
| the real read being replaced | `/properties/welcome-entry.jpg` — a file in `app/public`, **Darrell's own mock-up entryway**, not stock (`PoePropertiesWelcome.jsx` says so in its own header) |
| the real read being added | `listUrl()` for which cameras this device's credential opens, then `TileLive`'s ticket + `liveUrl()` for the picture |
| the real credential | `cameraCredential({ bridge: bridgeToken() })` — the owner's family key, or the grant `TenantCamerasTab` already stores when a landlord shares a door |
| the real screen | `WelcomeHero`, rendered by `PropertiesDoor.jsx:504` whenever no portal is chosen |
| the assumption, stated | "the big image" / "the hero image" = the `.pp-photo` frame. It is the **only** big hero photograph on the Properties surface; `HomeHero` carries no image at all |

**What could NOT be observed:** this sandbox has no route to poetech.us — 403 at the egress proxy, measured tonight. **Nobody has seen this rendered on the live site.** Said here rather than left for a reader to assume.

## Decision

**The photograph stays the default; the porch is one press away.** Three reasons, all load-bearing:

1. He asked for an **option** — "the OPTION to open with the porch".
2. The NAS allows **`LIVE_PER_CAMERA = 3`** live views of one camera (`cams_forwarder.py:448`) and ends the oldest when a fourth opens. A hero that autoplayed would spend the family's own slots on people who are not watching.
3. The photograph is **Darrell's own choice of picture**. A silent swap would overrule him to show him something he already has in his Cameras tab.

**Which camera may stand in for the entryway is an allow-list, not "the first one we find".** `PORCH_PREFERENCE` runs porch+floodlight (his own words) → porch → front door → doorbell → entry → front. A back door, a lot, a hallway or a bedroom **never** lands in the frame that promotes the property, and a grant that opens only the lot gets the photograph **and the reason**, not a lot camera.

**It reuses `TileLive`, the camera wall's own player.** One word — `export` — rather than a third player, so the hero inherits every lesson already paid for: the direct road first, the ticket, the chosen mode, the first-frame bound, the freeze and lag tending (DR-0799), and the release discipline that stops orphaning the NAS's slots (DR-1097). **Closing it unmounts the player**, and that unmount is what hands the slot back.

**The promoting half renders for EVERYONE, with or without a credential** — `ACCESS_STORY`, three lines, naming both audiences he named: if you live here, the cameras your landlord shares with your door open on your phone for you and your household; if you do the work (1099), you ask for the camera a job needs and the owner grants it **to you by name**, not to everyone at the door; either way the owner chooses which and for how long and can take it back, and nothing opens a camera the grant does not name. Every line answers to shipped behaviour cited in `porch-hero.js`, so it is a description of the service and never a promise the system cannot keep.

**Privacy is the NAS's, not this file's.** `/list` with a grant returns only that grant's cameras and `/ticket` for any other is `403 not-your-camera` (`cams_forwarder.py:4061`, proven in its own self-test at `:5255-5260`). The hero could not show an ungranted camera even if it asked, and a visitor holding nothing is never offered a picture at all.

**Not in preview.** The OpsBoard's thumbnail of this door passes `preview`, and a thumbnail must not open a live camera.

## Impact

**A prospect now learns what they get before they apply**, from the surface they were already on, instead of nowhere.

**A tenant and the owner can see their own porch from the front door**, on a press, without walking into the Cameras tab.

**What this does NOT do:** it does not make a public showcase stream. A live camera is offered **only** to a device that already holds a credential for it. Making one camera public so a stranger could watch it is a new external-facing publication and a bright line that is **Darrell's to draw, not mine** — flagged to him, not done. **`re-review: 2026-10-28`.**

**The gap I could not close:** nobody has seen this rendered. The sandbox cannot reach the site, and the repo's real-browser sweep does not sign in, so no witness renders this frame. **`re-review: 2026-10-22`** — ask him whether the option appears on his phone, and whether the porch opens in it.

## Verification

**23 cases** in the new suite, and the full suite green. **Two are proven to catch by breaking the component:**

| what was broken | what went red |
| --- | --- |
| the credential check removed from `heroOffer` — a visitor holding nothing offered a live camera | **1** — *"expected { offered: true, …(3) } to match object { Object (offered, why) }"* |
| the real autoplay regression: `useEffect(() => { if (offer.offered) setLive(true) })` | **2** — *"expected 'Back to the photo' to be 'Open the porch, live'"* and the frame's `data-live` |

Restored each time: **23 passed**.

**An honest note on a break that did NOT catch.** The first autoplay break tried was `useState(true)` for `live`, and the suite stayed green — because the component's own guard (`if (live && !offer.offered) setLive(false)`) corrects that state before the offer resolves. That is a real safety rather than a hole, but it is also the reason the *effective* regression had to be found and used instead. A gate that always passes is itself a lie (DR-0076 §3), so the weaker break is recorded here rather than quietly replaced.

`npm run lint` exit **0**, read without a pipe.
