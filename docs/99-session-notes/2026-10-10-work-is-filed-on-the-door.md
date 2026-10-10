# 2026-10-10 — Work is filed on the door (DR-0897)

**What Darrell saw.** Two screenshots of the Work board on 805 North Prospect Avenue Apt 2. The door reads "No tenancy on this door". *"Add a microwave and cabinet with exhaust fan inside the kitchen."* is typed in, and FILE IT is greyed out. His words: "Can't file a workorder... Fix it", "They obviously should be able to", "Any property including our home... a 1099 worker", and "even a person walking through an Airbnb or short-term rental... cleaning done asap".

**Root cause.** Work orders, their documentation, and dispatch notes all required a tenancy (`tenancy_id NOT NULL` since 0055/0075/0150). No door on the account has a tenancy, so no door could take a work order.

**What changed.**
- **Migration 0260.** Rows name a door (`rental_id`) and/or a tenancy, and one of the two is required. New door-level delegate arms let a 1099 worker or cleaner walking a granted door read, file and document there, and let a manager move jobs. Tenants see none of the landlord's door work. Three triggers back this up:
  - a row's door must be in its instance;
  - documentation takes its scope from its request;
  - "Fixed" resolves the job. Before this, a worker's Fixed left it open, because workers hold no UPDATE arm.
- **The app.** The Work board, Dispatch, notes and documentation file on the door when nobody lives there, and through the tenancy when somebody does. A vacant door no longer falls back to another door's tenancy. A worker may file on a door they were granted.
- **Proof.**
  - A new CI leg runs the real schema chain on PostgreSQL, applies 0260 twice, and runs the smoke. Five walls were proven to catch.
  - The same smoke joins the live `rls-isolation` poe-properties leg.
  - Five app cases fail on the old code and pass on the new.

**Next.** The guest in a short stay who reports a problem with no account, from a link or QR code on the door. This is a new public write path, built as its own decision on the 0152 pattern.

## Then: the guest card (DR-0898, 0261)

**What Darrell asked.** "Even a person walking through an Airbnb or short-term rental... getting work done or issues with systems or cleaning done asap". The integrity guard correctly refused my first instinct, which was to park the guest path as "the next build". The 0152 precedent already decides that a public write needs no account, so it was built in the same session.

**How it works.**
- The family opens a revocable card per door.
- A guest scans it with no account, sees only the door's name, and files a work order onto that door's Work board as `guest`.
- The guest reads nothing back.
- Reports are capped at five per door per hour and twenty per day.
- The office push names the door, never the guest's words.

**Proof.** The smoke runs on PostgreSQL and in the live rls-isolation leg, with five breaks proven to catch. Eight app tests cover the page, the card, and the real door's routing.

**Asked while this was being built, queued in order:**
1. Documents with digital signing, where signed copies file themselves to their tenancy, plus paper uploads as tenant records.
2. A listing link to share on social media that opens the app with the unit's pictures.
3. A "landlord who wants their own app" path on the door, offering Poe Properties alone or the full PoeTech app.

## Then: rent the way it is paid, and the clock (DR-0899, 0262)

**What Darrell asked**, in three messages: hand the tenant off to Cash App, Zelle, cash or a Chase deposit; record full or part payments with what remains and when; date and time on everything, so a situation can be recreated.

**What was built.**
- **How the landlord is paid.** The `rent_payee` table holds the landlord's own words, never an account number.
- **"I'm paying".** The record is written first: what was due, what remains, the promise, a note and the device clock. Then Cash App or Venmo opens with the amount, or the landlord's words are shown.
- **`record_events`.** An append-only, to-the-instant log of every rent and work-order change, with who made it. It is read where the record is read and edited by nobody.

**Proof.** The smoke has seven breaks proven to catch, and one replay gap was found and fixed. There are 8 app tests, including the record-before-hand-off order.

## Then: papers signed in the app (DR-0913, 0263), and proof before payment (DR-0902, 0264)

**Papers.** Asked for: digital signing, papers populated into their places, paper uploads as tenant records, tenants sharing receipts and pictures, and pictures on work orders.
- The family files a paper and asks for signatures; the database fingerprints the stored bytes.
- Each signer signs that fingerprint with a typed name, an attestation, e-sign consent, the device clock and the server instant. Signed papers stay in their tenancy.
- The counsel rule from `documents.js` stands: a generated draft is sent only with the family's recorded attestation that counsel reviewed it.
- Tenants get a Documents tab, and the family's Files tab gains Papers and signatures. Work orders take pictures.

**Proof before payment.** Asked for: notice to 1099 workers that pictures are mandatory for payment, and video when necessary.
- The family sets proof per job, and the worker is told on the job and in the dispatch text.
- The database refuses "Fixed" until the proof is on the job.
- Video is documentation too, kept off the board's list.
- The board says what is still needed, or "ready to pay".

**Along the way.**
- #2095 (0260) merged and is live: deploy, db-migrate and the live rls-isolation run all succeeded on `d5dda5958`. The later commits moved to #2096.
- The reader's color picker fix (#2089) sat red on the spelling gate and the monolith-name gate. It was ported into #2096 with both fixed.
- The Guest Ready subtabs are in #2087, which its own session moved to green.

## Then: the door keeps its money (DR-0903, 0265)

**Asked for.** "How to add payments to the historical events?" (Rent tab, landlord seat), then "the historical money for each property... with or without the tenants information... so the door always pays... the most important thing is to see how much money is being accumulated by each asset".

**What was true.**
- A rent record required a tenancy, so no door on this account could hold money.
- The landlord could only confirm a tenant's report, never record a payment received.
- A payment's date was when it was typed, not when it came.
- Nothing summed money per door.

**What changed.**
- `rent_records` names its door. The door is filled from the tenancy and backfilled; a payment with no tenancy is allowed, and it is the family's record.
- `paid_on` is the day the money came.
- Managers get door-scoped arms.
- `door_money_months` (security_invoker) gives each door's received and awaiting money by month.
- **In the app:**
  - On the Rent tab: "What this door has brought in" and "Record a payment received", plus the door's whole Payment history, each payment marked with when the money came.
  - On the door header and every Doors card: the asset's total. The board also shows the portfolio total.
  - In History: a payment sits on the day it came.
- A door with nothing says so, never $0.

**Proof.**
- The smoke has eight breaks proven to catch. The first pass exposed a NULL-unsafe check and a CHECK hidden behind a policy refusal; both were tightened.
- There are 8 app tests, including a tenant-leak test proven to catch.
- The 0260 through 0265 smokes pass together on the CI chain.

## Then: door cameras, asked for and given (DR-0904, 0266)

**Asked for.** "Cameras tab shows no Cameras!!!!!! It allows giving access to who?!", then "request for certain ones... like the porch... give new tenants and 1099 workers.. and Airbnb guests... whoever we want to", and "Unlocks smart locks for doors... when short term tenants come".

**What was true.**
- On a unit with no tenancy record the tab never read the NAS and said "did not answer (no-door)". The camera witness (#2011) measured the NAS answering with 31 cameras at 18:25 UTC.
- "This door's household" named nobody.
- Nobody could ask, workers and guests had no road, and nothing kept a ledger of who held which camera.

**What changed.**
- The tab reads the list on every door, names who will see the share, and says so when the NAS lists none.
- 0266 adds a per-door menu of cameras that can be asked for, and an access ledger of asks and gifts.
  - The database stamps each person's role, allows one open ask at a time, and lets only the family decide.
  - The token is read only by its holder and the family. Every move is on the clock, and nothing is deleted.
- The family's desk: offer cameras, give or decline asks for the days chosen, give anyone a link to text, and take back.
- Tenants, household members and workers can ask, and watch once given. Workers gain a Cameras tab.

**Smart locks.** No lock driver exists on the NAS. The forwarder speaks Wyze for the garage door, siren and power only. The same access model will carry an unlock window per person; the driver waits on which locks are on the doors (asked).

**Proof.** The smoke has ten breaks proven to catch. There are 15 app tests, three of them proven to catch.

## End to end (DR-0911)

Darrell: "End to end testing..." The door journeys now run in a real browser on every push. The `door-journeys` leg in `ci.yml` is required by "app — lint + vitest":
- Chrome walks the built app, through PostgREST 12.2.12, over a PostgreSQL built from the real chain (`scripts/e2e/build-door-db.sh`).
- **The journeys:**
  - a stranger books two nights and never sees the street;
  - the family sees the street, confirms the ask, and records $300 cash on the door with no tenant;
  - the next stranger finds those nights dark.
- The database is read after every step.
- Four faults (street, confirm, payment, calendar) must each fail their own step on every run.

Building it found three things:
- the Properties face needs `?properties=1` (as the manifest opens it);
- the build serves its assets from `/poetech-app/`;
- a database without production's default privileges reads as "permission denied", which the page reports honestly.

**Next journeys and a live-schema mode:** re-review 2026-10-24.

**The fix that also went in.** The booking calendar's weekday headers now carry `scope="col"` (the table-a11y guard failed 6d0fdf756).

## Where, never the street (DR-0912, 0270)

The listing now shows the area on a map and what is nearby.
- **The area.** It is rounded to 0.005 degrees on the device and again in the database, and a 600 m circle always holds the house.
- **The nearby lines.** Straight-line miles from twelve cited places, computed from the exact point before rounding.
- **Darrell's two estimates, measured:**
  - campus is about 2.0 mi (his "under 5" is true);
  - the "quarter-mile highway" is US-150, which is North Prospect itself; I-74 is about 0.7 mi.
- **The street.** A line naming it is refused.
- **For the family:** Doors → Edit → paste the point from Google Maps → Use this point → Save the area.

**Found by the journeys.** After any save the board's buttons went dead until a reload, because `busy` was a never-cleared timestamp (since #2043). It is fixed, and the fix is pinned in vitest and walked end to end.
