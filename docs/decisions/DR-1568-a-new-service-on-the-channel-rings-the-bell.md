# DR-1568: A new service on the church channel rings the bell

**Date:** 2026-11-19
**Status:** Accepted
**Tier:** A (one new arrival kind reading a feed the app already reads; no schema, no new route, no money)
**Type:** decision
**Area:** `app/src/lib/arrivals.js`, `app/src/lib/arrivals-watch.js`, `app/src/components/ArrivalsBell.jsx`, `app/src/components/ChurchHome.jsx`, `app/src/__tests__/arrivals-new-services.test.js`
**Sent in by:** Darrell, 2026-11-18, with a screenshot of the Arrivals list showing two new lessons: *"when BG has a new sermon from YouTube... send out a notification to users to watch it... So they know."*
**Pairs with:** DR-0728 (one count for everything that came in), DR-1506 (past services play from the channel feed), DR-1253 (an arrival opens the thing it names), DR-0061 (a surface is a view of real state), DR-0334 (web push to a closed phone, still unproven)

## Context

The Arrivals bell listed new lessons, lesson answers, messages and feedback. Nothing from the church channel reached it, so a person learned of a new recording only by opening Church and looking.

## What was measured

- **The real data exists and is already read.** `/api/church-recent` relays the channel's public feed (ten-minute cache), `parseYoutubeFeed` turns it into `{ videoId, title, published }`, and the Past sermons panel plays from it (DR-1506). The channel id is `COLG_DEFAULT_CHURCH.youtubeChannelId`.
- **The feed names no preacher.** It lists every upload: a Sunday service and a midweek Bible study alike. So the notice says "New service to watch" with the video's own title and never says who preached.
- **Church is the church door's first screen.** Marking the notice seen when Church opens would silence it before anyone read it.
- **The bell marks nothing by rule** (`every-arrival-counted.test.jsx`: a glance at the list never silences what it lists). That rule is kept.

## Impact

Every signed-in person sees a new channel recording in Arrivals and in the badge count, in every door, within about ten minutes of the feed carrying it; a tap opens Church, where it plays. A first look lists the last seven days only (the same start day the lesson arrivals use), at most five. While the app is open in the background and notifications were already allowed, the existing local notification rings for it.

**Not built here:** a push to a phone with the app closed. That rides the web-push stack whose phone proof is still open (DR-0334) and needs a server-side reader of the feed, which is the timer-driven class (budget and lock). `re-review: 2026-12-03`.

## Decision

1. **A new kind, `service-new`**, built by `serviceArrivals(videos, { since })` from the feed's own entries. A video with no readable publish time is left out, never dated today.
2. **The watcher reads the feed at most once per ten minutes**, with an eight-second timeout; a failed, empty or timed-out read returns null and the last picture stands.
3. **A tap marks that one item seen, not the open of Church.** The bell leaves the tapped item's id in the tab's session storage; after the landing reloads the page, the watcher marks that id seen once it holds it. Playing a recording from Past sermons marks the kind seen.
4. **The landing is `?view=church`** in the door the person is already in.

## Verification

`arrivals-new-services.test.js`, 11 cases: the kind from real Atom through `parseYoutubeFeed`; undated videos dropped; the cap of five pinned as a literal; sorting in with lessons and counting until seen; the landing and notification words; the relay URL; five failure shapes all null; a signed-in person with no rows of their own hears the new service with the feed read once; the tap note; the watcher marking only the tapped item after a reload; and the bell still marking nothing. `arrivals.test.js` names eight kinds. Neighbours green: `every-arrival-counted`, `arrivals-new-lessons`, `past-services-play`, `church-home-render`. Not yet seen on a real phone: after merge, the live look on the church door (DR-0104).
