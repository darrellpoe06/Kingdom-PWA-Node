# DR-1639: The Word tab opens on Bishop Gwin's latest message, in big

**Date:** 2026-11-24
**Status:** Accepted
**Tier:** A (one section added to an existing tab; the player and the feed are the ones already in use; no data, no schema, no money)
**Type:** decision
**Area:** `app/src/components/WordLatestMessage.jsx` (new), `app/src/lib/word-latest.js` (new), `app/src/components/Pulpit.jsx`
**Sent in by:** Darrell, 2026-11-24, with The Word tab and the Church tab side by side: *"The Word tab needs to be updated... it should be inviting... BG's latest in big like the Home tab does at the bottom of the page... make sense?"*
**Pairs with:** DR-1506 (past services play), DR-1045, the Church tab's Live Worship player (`ChurchHome.jsx`), DR-0076

## Context

The Word tab is where people come to hear the Bishop's messages, so it should open on one to watch.

## What was measured

- The Church tab opens on a large player of the newest message.
- The Word tab opened on its tools instead: the Nehemiah epigraph, the two study tabs, Present, We are live, the sort and the preacher chips. There was no message to watch until the library, below the fold.
- The tab already reads the channel feed (`/api/church-recent`, `channelFresh`), so the latest message was in hand and unused at the top.

## Decision

1. **The tab opens on Bishop Gwin's latest, at full width.** It uses the same player and skip buttons as the Church tab (`worshipPlayerSrc`, `VideoSkip`), with the message's title, its date, and "Come and hear the Word. Every earlier message is in the library below."
2. **His latest, not merely the newest.** Guest preachers fill in, so the first feed title naming Gwin is chosen. When none names him, the newest message is shown as "The latest message" and is never claimed as his.
3. **The tools and the library keep their reading width** (`max-w-2xl`) under the wider hero (`max-w-4xl`).
4. **No feed yet means no hero.** Nothing waits as a dead frame and no failure is claimed. The library fills the tab as before.
5. **L317 cites this file by line number** and its text is locked by the Learn integrity baseline, so the new import shares a line with its neighbor and the cited lines do not move.

## Impact

Until this ships, a member opening The Word sees tools before the Word. The call obligates the tab to keep a message to watch at its top.

## Verification

- `the-word-opens-on-his-latest.test.jsx` has 7 cases:
  - his newest is chosen over a newer guest's;
  - the fallback never claims a guest's message is his;
  - an empty or malformed feed shows nothing;
  - the date is written in words, or left out when it cannot be read;
  - the hero plays his video at full width and names it;
  - nothing renders before the feed answers;
  - the hero sits above the epigraph and the library.
- **Proven to catch:** choosing the newest upload instead fails 3 cases by name.
- 182 cases pass across every Pulpit suite, L317 and the Learn integrity baseline.
- On the live build: The Word tab opens on his latest message. `re-review: 2026-11-25`.
