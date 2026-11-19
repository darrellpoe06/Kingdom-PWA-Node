# DR-1595: Parish Life shows what is coming, read from the calendar

**Date:** 2026-11-19
**Status:** Accepted
**Tier:** A (one list on the Give & Serve tab; no schema)
**Type:** fix
**Area:** Love Corner church home, Give & Serve → Parish Life (`app/src/components/ChurchHome.jsx`, new `app/src/lib/parish-life.js`)
**Pairs with:** DR-1585 / DR-1587 (the church calendar as records, and its past years), DR-0061 (a surface shows real, current state), DR-0075

## Context

Darrell, 2026-11-19, with a screenshot of the Love Corner's Give & Serve tab on November 19: Parish Life still listed the 77th National Assembly (July 14-16) and Gospel Fest (August 29), each with a "+ Calendar" button and "+ Add all 2 to my calendar". His words: "Old events for Parish Life... Ari not noticing obvious reasons for updating texts?!!!!"

Traced: the list rendered `church.announcedEvents` from the church record (`app/src/lib/default-church.js`) directly. Those entries have dates but nothing ever compared them to today, so a typed event stayed on the screen forever. The calendar the office now edits (DR-1585) already merges those entries with the office's own rows, but Parish Life never read it.

## Decision

Parish Life reads the merged calendar (the church record's events plus the office's rows) and lists only events that have not ended, in the church's own time zone (`churchDateKey`), soonest first, at most six. An event stays through its last day. With nothing coming it says so and points to the calendar, where past years live. "Add all" counts and saves only the listed events. Nothing is deleted. Darrell added the same day: "We like to keep historical events and activities etc..." So what has ended is listed under a "Past events" fold on the same card, newest first, without the add-to-calendar buttons, and stays in the calendar's past years (DR-1587).

The general rule this sets: a dated item on a screen expires at render against today; it does not wait for someone to notice and edit text.

## What was measured

| what | measured |
| --- | --- |
| the screen Darrell saw, on 2026-11-19 | both events listed (old rule); none listed (new rule) |
| proven to catch | the old rule's list contains Gospel Fest; the new rule's does not |
| an event's last day | listed on 07-15 and 07-16, gone 07-17 |
| an office-added event | listed, soonest first |
| `church-home-render`, `church-calendar-surface` | green |

## Not done

The link label "Bible Reading Challenge 2026" is fixed text and will read stale in January. The church has posted no upcoming events in its record or calendar, so Parish Life will read "No upcoming events posted yet" until the office adds one in Times. `re-review: 2026-12-31`.

## Verification

`parish-life-shows-what-is-coming.test.js` (5 cases). On merge: PR, squash SHA, deploy run on main's head, `site-health.yml`.
