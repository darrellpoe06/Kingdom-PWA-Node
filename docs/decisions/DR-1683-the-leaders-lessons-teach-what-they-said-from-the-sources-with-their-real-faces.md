# DR-1683: The leaders' lessons teach what they said, from the sources, with their real faces

**Date:** 2026-11-26
**Status:** Accepted
**Tier:** B (lesson content in every member's Learn; one environment allowlist change; no schema)
**Type:** content + ways
**Area:** Prophetic Voices (`app/src/lib/prophetic-voices.js`), the cloud environment's network allowlist, `docs/99-session-notes/2026-11-26-leader-portrait-permission-requests.md`
**Sent in by:** Darrell, 2026-11-26, from the new-look lessons on Dr. Frederick K.C. Price and Pastor Stephen Darby: "We need to do better with our leaders messages!!!! They said more than we show?!!!!!! A lot more... these lessons seem to be undermined... research and update these lessons inside these courses... Create a new channel for the work if needed." Then: "Foundation is solid however it leaves me wanting to understand what they said?!!!!", "Were those lessons ever longer?!!!!!! Can we tell from the DRs?!!!", "Real photos for Price and Darby too!!!!", "Send me the permission request drafts!!!!", "Also we need to do what we do and have been doing for our work!!!!!!!!", and "Public knowledge of the individuals and their work is open to the public education..."
**Pairs with:** DR-0076 (verification), DR-0108 / DR-1159 (review our ways), DR-0098 (teach the Word), DR-0129 (Prophetic Voices surfaced)

## Context

Prophetic Voices teaches six voices, one lesson each. Every lesson tells who the leader was and why he was brave; none teaches the content of his message.

## What was measured

- **Never cut, written short.** The main lesson text, by word count, at the commit that created the course (`fcd84e50ce`, #540, 2026-07-03) and on `main` today: Price 281, Darby 445, Diop 351, Obenga 309, Williams 348, inventions 386 -- identical at every commit between (`10a26e8d5e` DR-0129, `b50cb5d663` #1893 age bands, `c36e3faba2` DR-1031 capitals). The sources cited were the ministry site and the channel listing, never the messages themselves.
- **The research was blocked by our own network.** The work session's first passes reached none of the primary sources: YouTube, Wikipedia, stephendarbyministries.com, eifmondemand.com, archive.org, Google Books, Find a Grave and the transcript tool were all refused by the environment's allowlist (agent-proxy `connect_rejected 403`, reproduced in this session). Search snippets cannot carry a leader's words (DR-0076), so no lesson was written from them.
- **Two corrections found** (PR #2936): the live Darby lesson says "d. early 2021" while a Find a Grave memorial reads 1972-2017; Price's series has a Volume 3, "Jesus, Christianity & Islam", the lesson never names.
- **Photos.** English Wikipedia has a freely licensed photo for Diop (public domain) and Obenga (CC BY-SA 3.0, credit "Teham"); its page for Price carries no image.

## Decision

1. **A dedicated channel.** The leaders' work runs in its own session (as Darrell said), on its own branch and PR, so it does not wait on or stall other work.
2. **The allowlist carries the sources** (a Ways finding, DR-0108): YouTube, youtu.be, Wikipedia, the two ministry sites, eifmondemand.com, archive.org, Google Books, tactiq.io, Find a Grave, and Wikimedia's two image hosts were added to the Kingdom-PWA-Node environment with Darrell's approval, and checked open (200).
3. **Each leader's lessons teach what he said**: his argument step by step, his evidence, his own lines verbatim where a fetched source holds them, and his call to the listener -- then weighed by the Word. The bio becomes the short opening lesson; 3 to 6 lessons per leader, as much as the verified material supports.
4. **Public knowledge is open to public education** (Darrell): the leaders' teaching, words, facts and public work are taught, quoted and weighed by the Word in full -- teaching and commentary. A photograph is different: its copyright sits with whoever took it. A freely licensed photo is used now with its credit (Diop, Obenga); Watch plays Price's and Darby's own messages from their official channels now; their cover portraits come by the ministries' reply (drafts ready for Darrell) or a photo they publish for media use. Whether to place a public photo on those covers under an education claim before a reply is Darrell's call, open as of this record.
5. **The two corrections ship with the lessons**, settled from fetched sources.

## Impact

- Readers learn the leaders' messages, not only their courage.
- Diop and Obenga show their real faces now; Price and Darby show their own voices in Watch, and their portraits on permission.

## Verification after merge

- The work session's PR: every quoted line traces to a fetched source (URL and date on its record); the Price/Darby dates settled; the scripture integrity and learn-integrity gates green.
- Live: open Price's lessons in the new look; there are several, and each teaches a part of what he said.
- Permission replies recorded on this record when they arrive.

`re-review: 2026-12-03`
