# DR-1550: The church website is read into the app: the office's calendar, letter and flyers, without going to the site

**Date:** 2026-11-18
**Status:** Accepted
**Tier:** B (congregation-facing surface; a new same-origin relay to one fixed public host; no schema, no money, no secret)
**Type:** decision
**Area:** `app/functions/api/church-site.js` (the relay); `app/src/lib/church-site.js` (the parser and digest); `app/src/components/lovecorner/ChurchOfficeBoard.jsx` (the board, on the Love Corner door and the Times tab); `app/src/lib/home-week.js` (the feature card); `.github/workflows/church-site-probe.yml` (the read-only probe that measured the site)
**Sent in by:** Darrell, 2026-11-18: *"The Love Corner App should be able to get the latest data from the website... announcements... upcoming events... Without needing to go to the site!!!! Pull in the new information for those using the app."*
**Pairs with:** DR-1540 (its `re-review` named this record), DR-0061 (a surface is a live view of real state), DR-0076 (nothing unverified is shown), the `/api/church-recent` relay (the proven thin-proxy shape)

## Context

The app's "Announcements" card read *No new announcements posted* from a hand-typed list whose two events were in July and August. The office publishes on its own website and nowhere else, and a browser cannot read it cross-origin.

## What was measured

Three runs of `church-site-probe.yml` from a runner on 2026-11-18 (the sandbox has no route to the site): a Weebly site with no feed and no API (`/feed`, `/rss.xml`, `/wp-json/*` all 404). The month's calendar is one picture under a "november 2026" heading on `/calendar.html`; the Letters from BG are a picture named `october-2026-letter`; the current events are flyer pictures in a slideshow (`battle-cry-sunday-veterans-flyer-3.jpg` on the page's `og:image`); the service times are text on the home page. The content sits in `<div id="wsite-content">`; headings in `h2.wsite-content-title`; prose in `div.paragraph`.

## Impact

A parishioner opens the app and sees the month's calendar, the latest letter and the flyers the office posted, without going to the site; the office changes nothing about how it publishes. The app's announcements stop depending on a hand-typed list.

## Decision

1. **One same-origin relay, `/api/church-site`**, the shape of `/api/church-recent`: `?page=` one of five listed pages of the one fixed host, answered as JSON with the page's content region (scripts and styles dropped) and every picture the page names under its own `/uploads/`; `?asset=` a picture only under that path with a picture extension (`..` and `//` refused). Each upstream call carries a timeout; the Cache API holds a page an hour and a picture a day. The app only ever talks to poetech.us.
2. **The client parses** (`church-site.js`, pure, deterministic, proven on the captured markup): the month from the heading or the file name, the calendar and letter pictures, the flyers with their names from the files, the service-time lines. A page that did not read is null in the digest. Nothing is typed by hand.
3. **The office board** shows the calendar, the letter and the flyers as the office published them, each opening full size in the app, with the time it was read. No news read → no board, and the feature card stays honest. The feature card names the posted month calendar when no announced event is coming. The board asks the relay only when the church record's site IS the church's own.

## Verification

- `church-site-read-into-the-app.test.js` (14): the parser on the site's captured markup; the digest; the loader keeping going when a page fails or times out; the relay's walls (host, page list, asset path, region slicing, icon exclusion).
- `church-office-board.test.jsx` (7): the board's pictures all through the relay; full size opens and closes; nothing painted on nothing read; the door reads the four pages and shows the board and the card; a failing relay leaves the door as before; a church whose site is not the church's own never asks.
- Not measured here: the relay against the live site (the sandbox has no route); the first live read is the Ways item below.
- `re-review: 2026-11-25` — read the live board on the phone; the sitemap's `lastmod` per page can date each item; the service times read from the site can be checked against the app's own.
