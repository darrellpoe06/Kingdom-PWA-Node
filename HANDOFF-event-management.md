# HANDOFF — Church › Venues (community Event Management)

**Status: PARKED / on ice (Darrell, 2026-06-17).** Valuable but NOT on the July
conference critical path → deferred. Everything is committed + pushed; nothing is
landing into `main` during the conference window.

## Where it lives
- Branch: `feat/church-event-management` @ `c385c87` (pushed; local == origin).
- PR: **#220, OPEN, labeled `hold`** → will NOT auto-merge / won't touch the
  conference merge-queue. Leave the `hold` label ON until the conference ships.
- Worktree: `.claude/worktrees/event-mgmt` (node_modules is a JUNCTION to the main
  tree — never `git worktree remove --force` without removing the junction first).

## Done (verified)
- New Church sub-tab **Venues**: community `Request a Space` front door (no login,
  WCAG AA) + staff back office (requests inbox, booking calendar with a working
  no-double-booking guard, per-event responsibilities checklists, real revenue).
- Two campuses (North premium / South Event Center @ 1109 N 4th St standard).
- `lib/venue-rental.js` (catalog + conflict engine + responsibilities + revenue),
  `VenueRequestForm.jsx`, `VenueRequest.jsx` (standalone `?request-space=1`),
  `EventManagement.jsx`; host wiring in `main.jsx` + the monolith (nav/route/
  feedback-area `church-events`).
- `migration 0030-venue-bookings.sql` — proven conference_public_registrations RLS
  shape (anon INSERT + trigger-forced COLG instance + owner/admin-only read).
- `npm run verify` green: lint + 838 tests (+19 here; conflict engine proven-to-catch).

## Left to do (re-arm the day AFTER conference ships)
1. Remove the `hold` label on PR #220 → let it land on green CI (or re-review Tier C).
2. **Apply `0030` on cloud** (Studio SQL editor, or `gh workflow run db-migrate.yml`
   then verify the run) — the staff surface 403s until `venue_bookings` exists.
3. Live closed-loop test once 0030 is applied: community request -> staff sees it ->
   schedule -> no double-book; confirm anon cannot read the roll.
4. Verify the staff back-office signed-in (not exercised in a browser yet — needs a
   real church-staff session).
5. Follow-up (re-review, not blocking): staff-editable rate card (today rates are
   relative tier labels + real per-booking quoted_price).

## On rebasing before re-arm
`main` moves; `git fetch origin` + rebase this branch on fresh `origin/main` before
landing. (Heads-up unrelated to this work: at park time the MAIN tree was stuck
mid-orphaned-rebase of `feat/teach-mode-2screen` — left untouched.)
