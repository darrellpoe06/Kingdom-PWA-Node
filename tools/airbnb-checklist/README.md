# Airbnb Apartment Completion Checklist

A single self-contained page — `index.html` — that tracks everything standing between
the apartment and its first guest. No build step, no dependencies, no server.

## What it is

- **181 tasks** across 9 areas: Construction & Repairs (25), Kitchen (31),
  Bedrooms (16 per bedroom), Bathroom (21), Living & Dining (17),
  Cleaning & Guest Supplies (14), Safety & Airbnb Setup (14),
  Final Walk-Through (23), Airbnb Listing (20).
- Per task: a large checkbox, a three-way status (Not Started / In Progress /
  Completed), an optional cost, and free-form notes.
- Dashboard: overall completion percentage, a progress bar, completed /
  remaining / in-progress counts, estimated remaining cost, an
  "X of X tasks completed" tally, and a progress tile per area that jumps to
  its section.
- Views: All, Still Needed, Completed.
- Add, edit, and delete tasks. Bedrooms can be added or removed as whole
  16-task sets, so a two-bedroom unit is one tap away.
- Reset Checklist behind a confirmation dialog.

## How it saves

1. **`localStorage` is the floor.** Every change is written to
   `airbnb-apartment-checklist-v1` immediately; a refresh never loses progress.
   If the browser blocks storage, the page says so in its footer rather than
   silently dropping work.
2. **Cross-device sync is the ceiling, and it is optional.** When the page runs
   as a published Artifact, it resolves the `db` capability and mirrors state to
   the document `checklist/apartment` (debounced 700 ms), subscribing for live
   updates so the phone and the desktop agree. `claude.use("db")` returning
   `null` — opening the file directly from disk, for instance — degrades to
   local-only with no error path and no missing features. Last-writer-wins,
   resolved on `updatedAt`, with the writing client's id stamped so a page never
   adopts its own echo.

## Design

White ground, warm neutrals biased toward the accent, clay `#a24a32` as the one
bold color, pine `#2f6b4f` for completion and brass `#91631a` for work in
progress kept separate from it so state reads at a glance. Fraunces for display
figures and headings, Karla for everything operated. Full light and dark
palettes are defined token-level for all three viewer theme states.

## Verification (2026-09-12)

Driven headless in Chromium via Playwright (`scratchpad/smoke.js`, 34 assertions,
all passing):

- Renders 9 sections, 181 tasks, 9 dashboard tiles.
- Checking 3 boxes moves the total to 2%, Completed to 3, Remaining to 178, and
  the Construction tile to 3/25.
- A cost of $450 and a note surface on the row; Est. Remaining Cost reads $450;
  In Progress reads 1.
- Editing a title, adding a Kitchen task (182), and adding a bedroom (198) all
  land, with the group header count following.
- Still Needed hides completed rows (195); Completed shows exactly 3.
- After a full page reload: task count, percentage, cost, and the edited title
  all survive.
- Delete arms on the first tap and removes on the second.
- Reset asks first; cancelling keeps 197 tasks, confirming restores 181 and
  clears percentage and cost.
- Zero horizontal overflow at 390 px.

The only console error in the sandbox is `fonts.googleapis.com` being refused by
the egress proxy, which does not apply where the page is actually served.

## It also lives in the app

This page is the standalone version. The same checklist is now a real surface inside the PWA —
**Poe Properties -> a door -> Guest ready** — where it is backed by `board_tasks` rows instead of
`localStorage`, scoped by RLS, shared with everyone who manages the door, and expanded against the
door's real bedrooms. See `app/src/modules/properties/readiness.js`.

Keep this file for what it is good at: no sign-in, no door record, opens from a phone or a USB stick.

## Running it

Open `index.html` in any browser, or publish it as an Artifact to get the
cross-device sync and a URL that works from a phone.
