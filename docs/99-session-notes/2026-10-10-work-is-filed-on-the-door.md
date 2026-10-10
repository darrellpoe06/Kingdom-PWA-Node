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

## Then: papers signed in the app (DR-0901, 0263), and proof before payment (DR-0902, 0264)

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
