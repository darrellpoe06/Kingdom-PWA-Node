# DR-0938 — A door's camera is asked for, and given to whoever the family chooses

**Date:** 2026-10-10
**Status:** accepted
**Area:** Poe Properties: the Cameras tab on every door, for every seat (migration 0266)
**Principle:** DR-0778 (access is given and taken back by the owner, never a password; the NAS is the wall), DR-0841 (a door shares its cameras), DR-0870 (a door with no tenancy is still a door), DR-0899 (the clock), DR-0076

## Context

Darrell, 2026-10-10, in the landlord's Cameras tab:

> "Cameras tab shows no Cameras!!!!!! It allows giving access to who?!!!!!!!!"

and then:

> "I want the camera to be there for users needing to login and request for certain ones... like the porch... we can just give new tenants and 1099 workers.. and Airbnb guests... whoever we want to... make sense?!!!!!"

> "Unlocks smart locks for doors etc... when short term tenants come... etc..."

**SHOULD.**
- The Cameras tab shows the cameras on every door.
- It says who will see them.
- Anyone signed into a door can ask for specific cameras.
- The family gives access to whoever it chooses (tenants, 1099 workers, short-stay guests) for as long as it chooses, and takes it back.
- A smart lock is opened for a short-stay guest on the same terms.

## What was measured

- **No cameras on an empty unit.** `DoorCamerasTab` read the NAS list only when the door had a tenancy record. On a unit without one it set `no-door` and showed "The NAS did not answer the camera list (no-door)" with nothing to tick. Meanwhile the camera witness (`camera-health.yml`, issue #2011, 18:25 UTC) measured the NAS answering with 31 cameras. This is the DR-0870 root cause again.
- **"Who" had no answer.** The tab said "this door's household" and never named anyone. Sharing went to one grant per tenancy row, readable only by the tenant and household.
- **Nobody could ask**, a 1099 worker could never be given the porch, and a short-stay guest had no road at all. Nothing recorded who held which camera, since when, or who decided.
- **An empty NAS list** drew an empty box with no words.
- **Smart locks:** the NAS forwarder speaks the Wyze cloud for the garage door, siren and power (DR-0777), and for no lock. No lock integration exists anywhere in the repository.

## Impact

On every door without a tenancy record, the landlord's Cameras tab showed no cameras and blamed the NAS, which was answering. Sharing went only to an unnamed household, nobody could ask, a worker or a short-stay guest could not be given the porch, and no record kept who held which camera. A short-stay turnover had no way to give and end access on a schedule.

## Decision

1. **The tab works on every door.** The camera list is read for a unit with no tenancy record; cameras are suggested from the unit's own address; an empty NAS list is said in words; the number of cameras and how many are ticked are shown.
2. **"Who will see them" is answered by name.**
   - Today's household share: the tenant on the record and every tenant and household invite on the door, each with whether they have signed in.
   - It states plainly that a 1099 worker, a guest and an applicant never see that share.
   - If nobody is on the door, it says nobody would see them.
3. **Asked for and given, per person (0266).**
   - **What the door offers.** `door_camera_menu` holds the cameras the family offers on a door, by name. Anyone on the door reads it; only the family writes it.
   - **The ledger.** `door_camera_access` keeps one row per ask or gift.
   - **Asking.** A signed-in tenant, household member, delegated worker or manager asks for cameras on the menu, with a reason.
     - The database stamps their real role (`door_role_of_user`), refuses a camera that isn't offered, and allows one open ask per person per door.
   - **Deciding.** Only the family decides: give it for 1 day, 3 days, a week, 30 days, a year, or until taken back; or decline. The NAS mints the grant (DR-0778), and the row keeps the token, the grant id, the days and the last day.
   - **Giving outright.** The family can also give access to anyone, including a short-stay guest with no account. That produces a link and a ready text ("No account or password needed"); it is not an invitation.
   - **Taking back** kills the NAS grant and clears the token on the row.
   - **Who reads what.** The token is read only by its holder and the family. Nothing is ever deleted, and every ask, decision, gift and take-back is on `record_events` (subject `camera`) to the instant.
   - **No orphan grants.** If the record cannot be written, the app revokes the grant it just minted, so no live grant exists without a record.
4. **Every seat on the door.**
   - Tenants and household members get "Ask for a camera here" under their Cameras tab.
   - 1099 workers gain a Cameras tab for the door they are sent to.
   - Once access is given, the live cameras open in place on that grant.
   - A face that cannot read `rentals` learns its door's id through `door_of_my_tenancy()`, which answers only for a tenancy the caller is on.

### Smart locks: the access model is built; the lock driver waits on one fact

Unlocking a door for a short-stay guest is the same decision as a camera: who, for which door, from when until when, decided by the family, every use on the clock. The ledger above is built so a lock is one more thing it can give.

What is not built yet is the call that turns the lock. No lock driver exists on the NAS. Which locks are on the doors (Wyze Lock, Schlage Encode, August/Yale, Kwikset, or a keypad that takes timed codes) decides which API the NAS speaks, and only Darrell has that fact.

When it arrives, the lock will be built with:
- the NAS as the wall, never the screen;
- a code or unlock window bounded by the stay;
- a per-person grant;
- every unlock on the clock;
- revocation in one press.

`re-review: 2026-10-17`, or as soon as the lock brand and model are known.

`re-review: 2026-10-24` — live checks:
- On 805 Apt 2 (no tenancy), the Cameras tab lists the NAS cameras with the 805 cameras ticked.
- Offer the porch on the door.
- From a worker seat, ask for the porch; give it for 3 days; confirm the porch opens in the worker's tab.
- Give a test guest the porch by link and text it; open it on a phone with no account.
- Take both back and confirm both stop.

## Verification

- **The database.** `infra/supabase/tests/0266-door-camera-access-smoke.sql` runs in the `door-work` CI leg after 0266 applies twice, and in the live rls-isolation poe-properties leg. It proves:
  - the family offers and a tenant cannot;
  - the menu is read by the tenant, household and worker on the door, and by no other door's tenant and no stranger;
  - the door lookup answers the door's own people only;
  - asks are stamped with the real role, once at a time, only for cameras offered, and never by a stranger;
  - the tenant cannot grant their own ask;
  - the family grants, and the token is read by its holder and nobody else on the door;
  - decline is final;
  - a gift needs the NAS grant and the family's hand;
  - take-back clears the token and cannot be reversed;
  - who asked never changes; nothing is deleted;
  - asked, granted, declined, given and revoked are on the clock, and each person reads only their own.
  - Measured on PostgreSQL 16.15: the 0260 through 0266 smokes pass together.
- **Proven to catch.** Each of ten breaks failed the smoke by name:
  - the menu readable by everyone;
  - the menu writable by anyone on the door;
  - the ledger readable by everyone on the door;
  - no insert trigger;
  - no update trigger;
  - anyone on the door able to update;
  - no one-open-ask index;
  - no clock;
  - an unguarded door lookup;
  - a delete policy.
- **The app.**
  - `door-camera-access.test.jsx` (12 tests) covers:
    - the ledger read plainly, including that an expired grant is never handed over as live (proven to catch);
    - the guest's text;
    - offering cameras;
    - giving an ask (minted, then recorded);
    - the orphan-grant revoke (proven to catch);
    - decline;
    - an Airbnb guest's link and SMS;
    - take back;
    - the asker's flow, the live view once given, and the empty and waiting states.
  - `properties-door-cameras.test.jsx` gains three tests: the empty unit reads the list (proven to catch), who sees them by name (never a worker), and the empty NAS list is said.

## Addendum, 2026-10-10: renumbered

This record was written as DR-0904. #2099 merged its own DR-0904 on main first ("a door's own tenancy is not another door's"), so this one is DR-0938, with every reference renamed.
