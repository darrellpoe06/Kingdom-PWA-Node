# Conference Setup & Management Runbook — COLG 77th National Assembly

- **Layer:** 4 (working artifact).
- **Audience:** the organizer (Darrell / Christina / Bishop Gwin) standing up + managing the conference in the PoeTech app, ahead of the event.
- **Why now (Darrell, 2026-06-16):** the conference is **set up and managed in the app for weeks before** the event — registration opens, the schedule is built, rooms/meals/comms are managed ahead of time. So the bar is "usable for setup + management **now**," not "ready by July."
- **Companion in-app:** the **🛠 Conference setup** checklist (the config skeleton) at **Church → Conference → Event Center** shows, live, what's already configured (the known facts) and what's still blank. This runbook is the ordered "how"; the checklist is the live "what's left."

---

## 0. One-time prerequisites (do these first)

1. **Be signed in as a leader.** Setup is shared/synced and only an **owner/admin** of the COLG instance can edit it (Darrell = owner; Christina + Bishop Gwin = admin). Sign in at **poetech.us/poetech-app/** with the church account. If a leader can't edit, they aren't in the COLG instance yet — have an owner/admin invite them (Church → Choir/leaders → invite by email), then they sign in once.
2. **Confirm the registration table is live.** The open registration writes to `conference_public_registrations` (migration `0027`). It applies automatically when PR #214 merges to `main` (the `db-migrate` workflow). Verify the run succeeded:
   `gh run list --workflow=db-migrate.yml -L 3` — the newest run should be **success** after the merge.

   *Until `0027` is applied, the registration form will honestly say "did NOT go through" — it never shows a false success.*

---

## 1. Create the conference (front door)

At **Church → Conference** (top card), as a leader, tap **✎ Edit** and set:

- **Conference name** — `77th National Assembly` *(pre-filled fact; confirm/adjust).*
- **Theme** — `Reviving Faith, Restoring Hope, Rebuilding Communities` *(pre-filled fact; confirm/adjust).*
- **Dates** — **BLANK — fill when confirmed** (e.g., `July 14–18, 2026`). Do not guess.
- **Location** — `1109 N 4th Street, Champaign, IL` (South Campus Event Center).
- **Livestream link** / **Website page** — confirm the COLG URLs.

Tap **Save conference details.** This is shared with everyone in the church instance.

## 2. Confirm the venue + rooms (mostly pre-seeded)

At **Church → Conference → Event Center**:

- **Building** — **South Campus Event Center (1109 N 4th Street)** is already seeded. (The Main Campus, 312 E. Bradley, is also there as the church home.)
- **Rooms** — **Main Sanctuary, Fellowship Hall, Kitchen, Bathrooms** are already seeded and tagged by use (service / class / food / facility).
- **BLANK — set the real seat counts.** Capacities are intentionally empty (no painted numbers). Edit each bookable room (Main Sanctuary, Fellowship Hall, Kitchen) and enter the real capacity. Bathrooms need none. The setup checklist flags exactly which rooms still need a number.

## 3. Build the schedule (sessions)

In **Event Center → Sessions → + Add session**, for each item:

- **Day / Time / Session title / Speaker.**
- **Type** — `Main Service` (the whole-building gathering), `Breakout` (runs alongside a main service), or `Other` (meals / fellowship).
- **Building + Room** — assign it so capacity-vs-registration is tracked.
- **Capacity** — optional; defaults to the room's capacity.
- **Main Service → Service ↔ Choir** — optionally link the real sermon + song set from the Choir module (single source of truth; it shows live in the schedule).

**BLANK — the full session list is yours to add.** Do not invent sessions; add them as the program firms up. The "Whole-building" view then shows how many breakouts run during each main service.

## 4. Meals & dietary

- **No setup needed for preferences.** Every registration captures a meal preference (Regular / Vegetarian / Vegan / Gluten-free / Other) **and** a free allergy/dietary note. The organizer view auto-tallies exact **meal counts** + the **dietary list** for catering — no manual count.
- **Served menu (what's on the table):** there is **no in-app served-menu editor yet** — publish the menu through comms (bulletin / announcement) for now. *(Tracked follow-up.)*

## 5. Open registration to the congregation

- The **registration link** is `https://poetech.us/?register=1` (also shown with a **Copy link** button in the Conference front door, leaders only).
- It needs **no account and no app install** — anyone opens it on their phone and registers in seconds (name + meal + allergy + optional email/phone/days/party).
- **Share it:** text it to the congregation, put it in the bulletin / on the church site / on the screens.

## 6. Manage attendees (ongoing)

At **Event Center → Congregation registrations** (leaders only):

- See the **real head count** (party sizes summed) and **meal counts** update live as people register.
- Each entry can be set **New / Confirmed / Cancelled** (cancelled doesn't count toward heads or meals).
- The roll is **private to leaders** — a registrant can never read it back.

## 7. Comms (interim)

The app does not yet send broadcast email/SMS to registrants. For now, use the captured emails/phones (visible in the registrations roll) plus your existing channels (bulletin, church site, screens, group text). *(Tracked follow-up: in-app comms to the registered list.)*

---

## Quick reference — what's a KNOWN fact vs a BLANK you must fill

| Item | State |
|---|---|
| Venue: South Campus Event Center (1109 N 4th Street) | ✅ seeded |
| Rooms: Main Sanctuary / Fellowship Hall / Kitchen / Bathrooms | ✅ seeded |
| Room seat counts | ⛳ **BLANK — set real numbers** |
| Conference name / theme | ✅ pre-filled facts (confirm) |
| Dates | ⛳ **BLANK — fill when confirmed** |
| Schedule / sessions | ⛳ **BLANK — add the program** |
| Meal preferences + dietary | ✅ auto-collected at registration |
| Served meal menu | ⚠️ via comms (no in-app editor yet) |
| Registration link | ✅ `poetech.us/?register=1` |

## Serving / hosting note (Darrell's hand)

- The app is **served on Vercel/poetech.us today** — setup + registration work now. The Vercel free-tier limit is on **deploy frequency** (≈100/day), not on serving traffic, so the congregation registering is fine.
- The **get-off-Vercel cutover** (Cloudflare Pages, PR #210, currently gated off via `CF_PAGES_ENABLED`) removes that deploy ceiling. It needs **Darrell's hand**: add the Cloudflare credentials, flip `CF_PAGES_ENABLED`, then **point the `poetech.us` DNS** at Cloudflare Pages (the cutover doc in `docs/99-session-notes/` has the exact records). Not a blocker for registration going live — do it when ready for deploy headroom.
