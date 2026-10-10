# 2026-10-10 — Work is filed on the door (DR-0859)

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
