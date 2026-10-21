# DR-1179: Sharing says who can actually open it — a grant nobody can read is not access

**Date:** 2026-10-21
**Status:** accepted
**Tier:** B (a privacy control Darrell operates; adds words and corrects one test, grants nothing new)
**Type:** fix

**Area:** `app/src/modules/properties/door-cameras.js`, `app/src/modules/properties/DoorCameras.jsx`, `app/src/modules/properties/CameraAccess.jsx`, `app/src/__tests__/sharing-says-who-can-actually-open-it.test.jsx` (new), `app/src/__tests__/properties-door-cameras.test.jsx`.

**Principles:** DR-0841 (a door shares its cameras with its household); DR-0938 (asked for and given, per person); DR-0778 (the NAS mints and enforces); DR-0076 (a surface must not report success it cannot support); DR-0621 (a flag is where the work starts).

## Context

**Darrell, 2026-10-21, three messages:**

> *"Also I gave apt 2 and 1 camera access in way that allowed me too... they didn't get it... why not.... fix it!!!!!"*
>
> *"What about the landlords and owners... etc..."*
>
> *"I checked the anyone can see section for apt 2 cameras including short stays... did it work?!!!!!!!!!!!!!!!!!!!!!"*

## What was measured — why they did not get it, traced rather than guessed

**The grant was right. The reader could not reach it.** `loadMyDoors` (`cloud.js:154`) selects `camera_grant` and leans entirely on RLS. `rental_tenancies_read` (migration **0150**) admits a tenant through exactly two arms:

```
tenant_user_id = auth.uid()        -- a claimed invite
user_is_tenancy_household(id)      -- a row in tenancy_household,
                                      member_user_id = auth.uid(), active = true
```

A tenant who exists only as a **name** on the row — never invited, never claimed — satisfies neither. They are handed **no row at all**, so there is no door to carry the grant, and their Cameras tab truthfully reports that nothing is shared. **Minting a grant for a door nobody has joined can never deliver.**

**And the tab said so in the wrong place.** The notice that would have caught it tested `viewers.length === 0` — but `whoSeesDoorCameras` **counts a lease name as a viewer** (`joined: false`). A door with a `tenant_name` and no `tenant_user_id` therefore has one viewer, the notice never rendered, and the only hint was the words *"has not signed in yet"* appended to a name inside the lower, collapsed "Who has access" fold — underneath a cheerful *"Shared with this door: 2 cameras"*. **Success at the top, the blocking fact buried.**

**The ask menu grants nothing, and he had reason to think it did.** "Cameras people can ask for at this door" plus **Save what can be asked for** writes a `saveCameraMenu` **menu**. Nobody receives a camera from it. And for a **short-stay guest it does nothing whatever**: `resolveFace` gives the `cameras` face to `TENANT_TABS` only, `WORKER_TABS` has no cameras tab, and a guest is not a door role at all — so a worker and a guest **never see that list**. The old copy made it worse by naming *"a 1099 worker sent here"* among those who see these names. They are reached by **Give access to anyone**, the one control on the tab that delivers to someone with no account.

## Decision

**`whoCanOpen({door, people})`** replaces the count. The question is not how many names a door carries; it is **whether anybody on it has joined**. When nobody has, it names who is waiting and what to do, and `DoorCamerasTab` prints it **beside the share state** — in the brand red when something is already shared — instead of in the fold below.

**The share action says it at the moment of sharing.** A share is not finished when the token is written; it is finished when somebody can open it. When nobody can, the success message reads *"Shared with this door: … — but NOBODY CAN OPEN IT YET."* followed by the reason and the remedy.

**`menuReach()`** puts on the menu, in words, that it is a **menu and not access**, that nothing reaches anyone until Give it is pressed, and that a 1099 worker and a short-stay guest cannot see the list at all and are reached by Give access to anyone. The old, wrong claim about the worker is gone.

**`cameraReach(role)`** answers his second question — **every face at a door is reached a different way**, and the difference is real: the **owner, admin and member** by the **family key** their own device holds, needing nothing shared with them; the **tenant and household** by the **door's grant**, and only once signed in; a **1099 worker or short-stay guest** by a grant **of their own**, per person, as a link. An unrecognised role falls to *own grant* — never to the family key.

## Impact

**The failure he hit cannot be silent again:** sharing to a door nobody has joined now says so in the same breath as the success.

**What this does NOT do.** It does not give anybody access, and it does not invite anyone — a tenant still has to accept an invite before any camera can reach them, because that is what the database requires. **It also does not tell me whether Apt 1 and Apt 2 have access now**: this sandbox has no route to the database or the NAS, so the live answer is on his screen, under **Who holds access now**, which lists every live grant by person. **`re-review: 2026-10-22`** — read that list with him.

## Verification

**12 new cases** plus the existing DR-0841 suite: **30 passed** across both. **Two proven to catch by breaking the code:**

| what was broken | what went red |
| --- | --- |
| `joined` counted every viewer again — the original bug, exactly | **2** — *"expected true to be false"* on the named-but-not-joined door |
| an unrecognised role handed the family key | **1** — *"expected 'family key' to be 'own grant'"* |

Restored each time: **12 passed**.

The existing suite's assertion on this notice was **strengthened, not relaxed**: it previously pinned the old copy, and now pins that the notice fires on *nobody has joined* and names the remedy.

`npm run lint` exit **0**, read without a pipe.
