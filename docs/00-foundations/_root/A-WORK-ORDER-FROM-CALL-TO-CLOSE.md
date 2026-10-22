# A Work Order, From the Call to the Close

**Status:** binding procedure (DR-1216). **Layer 3 (reference).** Read before changing anything that files, moves, assigns or closes a work order.

Darrell, 2026-10-22: *"805 N Prospect Ave Champaign IL the building... not one of the apartments... we need work done in the foyer... and other basement activities... how do we add a work order from scratch and what to do with it when its for the building"*, *"seeing all workers outstanding and just a place to review the results"*, *"one comprehensive review of the procedure we need and opportunities and constraints and solutions that take everything into account"*, *"End to end understanding first then a fix that makes sure we have accounted for potential issues based on the process"*, and *"Our number of buildings dont change however the number of doors can because of our needs to have flexibility in our support for tenants and the community to have housing... our systems need to be able to do this."*

Faithful work is checked work.

**KJV — 1 Corinthians 4:2:** *"Moreover it is required in stewards, that a man be found faithful."*

The Word puts the weight on being *found* faithful: the faithfulness is seen, not claimed. So a work order is not done because someone said so. It is done when what was done is written on it and someone looked.

---

## 1. Where work lives (measured, building-probe, 2026-10-22)

Work orders live in **three** stores. The procedure treats them as one queue and never moves a work order out of the store it belongs to.

| Store | What it holds | Who files | Who writes | Live count |
|---|---|---|---|---|
| `incidents` (Real Estate work orders) | Owner-side work: a door, **a building**, or nothing in particular. A lifecycle log of notes; a crew of 1099 workers (`dispatch.assignments`). | The owner, from the triage, Real Estate, or Big Picture | The shell's `addIncident` / `updateIncident` / `workerOps` | 4 (1 linked to nothing, 3 to a door) |
| `tenant_maintenance_requests` (Poe Properties work orders) | Work a tenant, household member, manager or owner reported on **their door**. Job notes from the worker (`request_documentation`), every change (`door_events`), and notes (`tenancy_notes`). | The tenant's household or the manager, on a tenancy | `setWorkOrderStatus`, `assignWorkOrder`, `postNote`, under RLS | 0 |
| `board_tasks` on a property board (`airbnb-ready:<door>`) | A door's readiness checklist on Projects. Only the items someone touched exist as rows. | Anyone working the board | The board store (`patchTask`) | 805 Apt 2: 8 items, 5 done, 3 not started, nobody on them |

Program boards (Moore Divahs, church infrastructure, succession…) are projects, not property work; they stay on Projects and are **not** work orders.

## 2. One building, flexible doors

805 N Prospect is **one building**. Its doors are a list that changes with the need: a unit splits into two, into rooms, into beds, or they merge again. Measured: 805 has five door records (Apt 1, Apt 2, Apt 3, Apt 4, and a second "Apt 4" added 2026-08-28 for the split). Only one of the five carries the building name.

- **The building is the stable record.** Its doors are read as one building by their shared address and the one building name among them (`buildingResolver`, lib/building-group.js). Two different building names at one address are never guessed together.
- **Building work links to the building**, `{ type: 'building', id: <building name> }`, never to a door. It survives every split and merge.
- **A door count is never called wrong.** Five doors under four named apartments is allowed. The only thing flagged is two doors with the **same name**, because then no one can tell them apart; the strip offers one tap to give the split half its own name ("Apt 4B", editable).
- **The record is fixed at its source.** The doors missing the building name get it written on them in one tap, so every screen agrees without inference.

## 3. The procedure

| Step | What happens | Where | What it writes |
|---|---|---|---|
| **1. It comes in** | Pick **where** (a building's common areas and which part: foyer, basement, hallways and stairs, laundry, utilities, exterior, roof, parking, the whole building; or one door; or not a property), say what needs doing, and how soon. Nothing is filed until "where" is chosen. | Projects → Work → **Work orders** (+ New work order); the Life Hub; Big Picture → Now; under the building's header in Real Estate | An incident, its words led by the part of the building |
| **2. A worker is put on it** | Give it to a 1099 worker. A worker with a phone on record can be **texted the job** (the person sends it; nothing is sent on its own). | The open work order | The crew on the incident (and its log), `assigned_to_label`, or the board item's owner |
| **3. The work is done** | The worker's part is marked done (Real Estate), or the worker files a job note (Poe Properties). | DispatchPanel; the worker's own screen in Poe Properties | The assignment's done-state; `request_documentation` |
| **4. It is checked** | **To review** lists every open work order the workers have finished. Open it, read what came back, then close it or **send it back** (the worker's part reopens, and why is logged). | Work orders → To review | The log; the reopened assignment |
| **5. It closes with a result** | **Resolve / Done asks "What was done?"** and shows what is unchecked first (no worker, not every part done, nothing written). It does not close without the words. | The close panel | `Resolve: <result>` in the log; a `Result:` note then the status move (Poe Properties); `Result:` in the board item's notes |

**Seeing where it stands.** Every work order shows one track, read from its record: *Came in → Assigned → Work done → Checked.* Its pill says what it needs: **Needs a worker** (amber), **Worker on it** (blue), **Check it** (green), **Past due** (rust, with the days open), **Closed** (gray), **No result** (amber, on a close that carried no words). True red is never used (Color Theology).

**Every worker's open work.** *By worker* lists each worker with what is theirs to do and what is done waiting on review; tapping a job opens it in the queue. Names on the roster with nothing open are listed too.

## 4. What can go wrong, and what handles it

| # | Failure | Handled by |
|---|---|---|
| 1 | Building work filed on one apartment, so it disappears when the door splits | The building is a choice of its own; its work links to the building |
| 2 | 805's doors read as five separate properties | `buildingResolver` reads the shared address; "Write it on them" fixes the record |
| 3 | Two doors with one name ("Apt 4" twice) | Flagged; one tap names the split half |
| 4 | A work order filed to nowhere by a silent default | "Where" must be picked; Save refuses without it (proven to catch) |
| 5 | Closed with no record of what was done | Resolve / Done asks for the result; it cannot close without it (proven to catch, all three stores) |
| 6 | A close from the older one-tap Resolve (Real Estate, Action Queue) carries no result | Read from the log and shown as **No result** on the card and in To review |
| 7 | The worker never hears about a Real Estate work order (they have no screen for it) | Text the job to them, from the work order |
| 8 | Finished work sits open, unseen | To review lists it; the pill turns **Check it** |
| 9 | Work past due, unseen | **Past due** pill, rust border, days open |
| 10 | Projects board property items live apart from work orders | Property-board items are in the same queue, written through the board's own store |
| 11 | A Poe Properties close moved before its result was saved | The result note is written first; the status moves only after it is accepted |
| 12 | Projects too busy to find anything | Projects is four areas (Work · Voices · Reviews · PoeTech Build), each a row of pages; no page is a long scroll |

## 5. Open constraints (each with a why and a date, DR-0075)

| Constraint | Why it is not closed today | re-review |
|---|---|---|
| A 1099 worker cannot open a Real Estate work order on their own screen | Their screen reads Poe Properties' tables under RLS; `incidents` are owner rows. A worker policy is a schema/RLS change with its own review (RELEASE-TIERS Tier B). The text is the road until then. | 2026-10-29 |
| The older one-tap Resolve (Real Estate's "Mark resolved", the Action Queue, DispatchPanel) does not ask for the result | Four call sites route through the shell's `resolveIncident`; changing it changes every caller's close. Shown as **No result** until they route through the close panel. | 2026-10-29 |
| A tenant reports a common-area problem on their own door | A Poe Properties request belongs to a tenancy; the owner files the building's own work order from it. | 2026-11-05 |
| A renamed building would leave its work orders under the old name | Buildings do not change (Darrell, 2026-10-22); a rename would need the links moved with it. | when a building is renamed |

## 6. Gates

- `a-building-work-order-from-call-to-close.test.jsx`: the building rule on 805's measured shape, the filing, the workers, the review, the close (proven to catch, all three stores), the board items, the building strip, and the Projects menu.
- `a-work-order-is-acted-on-from-the-triage.test.jsx`, `every-work-order-in-the-order-it-came-in.test.jsx` (DR-1213, DR-1215).
