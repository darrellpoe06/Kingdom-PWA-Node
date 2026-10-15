# DR-1044: One live order, carried forward — never a blank start; the standard order is the one that last ran

**Date:** 2026-10-15
**Status:** accepted
**Tier:** A (defect fix and the church's own order put where the app starts from)
**Type:** orchestration
**Area:**
- `app/src/lib/service-program.js` (`nextServiceDate`, `localIsoDate`, `weekdayOf`, `dayMismatch`, `clockTo24`, `postedStartTimes`; `currentProgram`, `existingOrderFor`, `lastOrderOf`, `carryForwardSegments`, `ordersToArchive`, `startsFromSay`; `carryForwardOrder`, `archivePrograms`, `startOrder`; `seedDefaultOrder` rewritten from the 10-11-2026 sheet)
- `app/src/components/ServiceProgram.jsx` (the one-tap start, Next service, the form's dates and posted times)
- `app/src/__tests__/service-program-carry-forward.test.js`, `service-program.test.js`, `service-program-sections.test.jsx`

**Amends:** DR-1029 (the standard order it seeded) and DR-1032 (which made the tab legible enough for this to be seen).
**Grounds:** Darrell 2026-10-15, three messages and three screens from the Fold; DR-0076; DR-0621; DR-0075
**Declared by:** Darrell — *"We need to edit the last one or update the last one and archive the previous ones... make sense? We should not have repeated start from scratch... situations... I don't see the sections now?!!!!!! Why not?!!!!! Fix it!!!!!!!!!!!!"* and *"From Christina this is the most recent one... so the understanding is available..."*

## Concern

With his phone door finally admitted (DR-1043), Darrell opened Church → Order of Service and got a blank New Service form dated Thursday 10/15/2026 for a Sunday service, under a "Start time (24h)" label showing 11:00 AM. There were no sections, so nothing to edit, and nothing carried from any earlier Sunday.

## Context

The sections (Run of show, Actual times, Track record, Playbook, Team & changes) render only once an order exists. Until this morning the tab refused the owner, so no order had been made on the live database. The empty state told a steward to "create this Sunday's master program, then add segments", which is a start from scratch. Christina's Order of Service for 10-11-2026, sent by Darrell the same morning, is the order the church last ran: every line with its people, the TLC Ensemble and its band, the Giver's Creed PowerPoint after the Call to Give, the headphone levels and the mic plan.

## What was measured

- The screenshot shows no service picker beside the button. The page renders that picker only when the order list is non-empty, so the list was empty for the account.
- `todayIso()` was `new Date().toISOString().slice(0, 10)`, a UTC date. In Central time after 7 PM it names tomorrow. It was also used whatever service was chosen, so a Sunday order opened dated a Thursday.
- The time box is the device's own time control and shows a 12-hour clock on the Fold. The "(24h)" in the label was false on the screen it labels.
- The page opened on `programs[0]`, the newest order of all, which would be an archived one once archiving exists.
- The old standard order was a generic outline: Prayer, Announcements, Choir, Special events, Offering, Choir, Speaker, Benediction. It named nobody.

## Impact

- An empty Order of Service now offers one tap: "Start Sunday's order from Bishop Gwin's order". It makes the next Sunday's order with all eight lines of the church's order in it, and the sections appear.
- Next service, which replaced New service, carries the last order of the same service forward: its lines, people, auxiliaries, minutes, cues and notes. That day's scripture, sermon and songs are left to choose fresh. If no earlier order has lines, it starts from Bishop Gwin's order. Never blank.
- The earlier orders are archived when the new one is made. The status changes; nothing is deleted, and an archived order and its actual times stay on the record and can be reopened from the picker.
- A date and service that already has an order opens that order instead of making a second.
- The page opens on the newest order that is not archived.
- A new order opens on the next day its service meets, by the device's own calendar. Changing the service moves the date and time with it until the person sets either by hand, and a date on the wrong weekday is named under the field.
- Start times come from the church's posted schedule. Sunday has one (11:00 AM) and fills it. Wednesday has two (1:00 PM and 6:00 PM) and offers both as one-tap choices rather than guessing.

## Decision

1. **One road for a new order** (`startOrder`): open the existing order on that date, else make the order, fill it from the last order of the same service or from Bishop Gwin's order, then archive the earlier ones.
2. **Archiving is a status change, never a delete.** Every past order and its clocked times stay on the record.
3. **Bishop Gwin's order is the order that last ran.** `seedDefaultOrder` is Christina's 10-11-2026 sheet: Call to Worship and Prayer (Brother Clifton Reed); Announcements (Sister Kristy Reed); Special presentation (if we have one); Selection, TLC Ensemble, with Brother Fontaine Love (organ), Brother Christian Cunningham (piano), Brother Pancho Moore (drums), Brother Charles Wilson (bass), Brother Kenneth Odom (saxophone), cue "Check levels in headphones"; The Call to Give (Bishop Gwin), cue "Play The Giver's Creed PowerPoint after The Call to Give"; Selection, TLC Ensemble, the same band and cue; Message / Invitation to Christ / Prayer / Benediction (Bishop Gwin, fixed), cue to mute the speakers' and singers' mics with Bishop Gwin's mic staying hot; Closing (Musicians). The mic plan rides the first line's media cue. 84 minutes, inside the 75 to 90 window.
4. **What belonged to 10-11-2026 alone is not repeated:** the Pastor's Appreciation Presentation (Assistant Pastor Evelyn Moore) and Muriel Jones's signatures for Champaign Park District Commissioner. The special line stays open for whatever a Sunday brings. The sheet's "Paino" is read as piano.
5. **Dates are local; posted times are the church's, never invented.**

`re-review: 2026-10-22` — after the first Sunday made this way: did the carried order need changes the next Sunday, and should a Wednesday order carry from the last Wednesday or from Sunday's.

## Verification

- `service-program-carry-forward.test.js`, 15 tests, run in Central and in UTC. They cover the local date at 11:30 PM Thursday; Sunday, Wednesday and special opening days; the posted times read from the church's schedule; the page opening on the live order, proven to catch against the old newest-of-all rule; carry-forward clearing that day's scripture, sermon and songs while keeping people and cues; and `startOrder` against a recorded database. That last check shows lines carried and the earlier order archived, Bishop Gwin's order when none came before, an empty earlier order still never blank, an existing date opened with zero writes, and no delete anywhere.
- `service-program.test.js`: the standard order pinned line by line to the sheet, the dated items asserted absent, 84 minutes inside the window, and the padded-Message case 6 over.
- `service-program-sections.test.jsx`: an empty page shows the one-tap start; the button reads Next service, never New service; its form says what it starts from; the time label reads Start time.
- Live: after the deploy, Darrell opens Church → Order of Service and taps the one start.
