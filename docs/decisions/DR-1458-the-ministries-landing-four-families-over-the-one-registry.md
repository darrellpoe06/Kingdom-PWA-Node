# DR-1458: The Ministries landing — four families over the one registry

**Date:** 2026-11-12
**Status:** Accepted (Phase 3 of the Love Corner redesign built)
**Tier:** A (a landing over the existing Ministries tab; no schema, no auth, no money)
**Type:** decision
**Area:** `app/src/lib/ministry-groups.js` (new), `app/src/components/ChurchMinistries.jsx` (the landing at the top; the list below unchanged), `app/src/lib/church-ministries.js` (the Youth Ministry's surface), `app/src/index.css`
**Sent in by:** Darrell's redesign brief, 2026-11-12 §5: "Create a beautiful Ministries landing page with individual ministry cards: Music & Worship, Transportation, Children & Youth, Church Life. Preserve the existing Choir and Bus Ministry tabs as direct-access shortcuts. Do not assume every ministry has an existing management system. Connect to existing functionality first." Pulled forward under DR-0236 after Phase 2 (DR-1456) went live.
**Pairs with:** DR-1455 (the front door's four ministry cards open these), DR-1456 (the Youth Ministry's page is the Youth Zone), DR-0677 (derived, not a second list), DR-1052 (every ministry can say who is on its team), DR-0076

## Context

The Ministries tab already listed the house's 23 ministries from one registry, split into "In the app" and "Named, not built yet". The brief asks for the same ministries organized into four families a member recognizes, without inventing a management system for any of them.

## What was measured

| what | measured |
| --- | --- |
| registry ministries | 23, every one in exactly one of the four families (test) |
| ministries with a page today | 4: choir, bus, media (Video Wall), youth (the Youth Zone, newly linked) |
| ministries named, no page | 19, each shown in the family with "no page yet" and the feedback door |
| unknown id (an office-added row) | lands in Church Life, never hidden (test) |
| tests | ministry-groups 6 green; church-ministries 25 green; front door and feedback suites green |

## Impact

A member opens Ministries and sees four cards: Music & Worship, Transportation, Children & Youth, Church Life. A ministry with a page is a door; one without says so and takes a note. Choir and Bus Ministry keep their own tabs. The search and the full list below are exactly as before.

## Decision

1. **Four families over the one registry** (`lib/ministry-groups.js`): the registry stays the only list of ministries; the file only says which family an id belongs to. An id it does not know lands in Church Life.
2. **The landing sits at the top of the existing Ministries surface** and steps aside while a search narrows the list; nothing below it changed.
3. **The Youth Ministry's surface is the Youth Zone** now that the page exists (DR-1456); the other 19 keep `surface: null` and say so.
4. **No ministry gains a management system by this record.** Rehearsal schedules, transportation requests and volunteer sign-ups are each their own decision when the office asks.

## Verification after merge

DR-0107, done 2026-11-12: #2648 squash-merged as `5d42abc5` at 23:06Z; Deploy (Cloudflare Pages) run 43325967791 on that SHA green at 23:12Z, its real-browser boot check BOOT OK on poetech.us, pages.dev, the Moore door and `?view=church`. DR-0125: `site-health.yml` run 43326896479 at 23:13Z: verdict UP, served build `5d42abc` = main. The phone walk from the front door's Ministries card is the DR-0104 reviewer pass Darrell makes.
