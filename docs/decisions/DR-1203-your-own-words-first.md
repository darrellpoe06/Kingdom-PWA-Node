# DR-1203: Your own words first — a link that cannot be read is answered by the words sent with it

**Date:** 2026-10-22
**Status:** accepted
**Tier:** A (the research lane's answer for one case, and how the Research card names it; nothing new is public, no new road)
**Type:** orchestration
**Area:**
- `.github/workflows/research-inbox.yml`: the look step answers an unreadable link from the words beside it; the answer row's first line says so
- `app/src/lib/research-create.js` (`parseLinkAnswer`, the filed request), `app/src/lib/research-items.js` (the `filed` state), `app/src/components/ResearchSection.jsx`
- Tests: `a-link-becomes-what-it-was-sent-for.test.jsx` (+7 cases)

**Grounds:** DR-1202 (a link becomes what it was sent for), DR-0076 (verification; say what a thing is, never more), DR-0111 (do the work), DR-0381 (a surface never reads hollow).
**Declared by:** Darrell, 2026-10-22, after DR-1202 filed his mt27.org link as a build request from his own words only once six roads had failed, while the card still said "Could not be looked into":

> *"The features words were already there... how can you not have them?!!!!!!!!"*

## Context

**SHOULD.** The words he writes beside a link are the request. They are in the item from the moment it is sent, so the item should never read as if nothing could be done with it.

**ARE, measured.** The item (`1c14eb85`, 2026-10-21 22:43) holds a link and his words: *"We need this inside the Love Corner App each week... trivia questions"*. DR-1202 tried six roads on the link (run 39706275631: the NAS and the runner fetched the page; even rendered in the runner's browser, 7,144 bytes held no readable words), wrote `research-failed`, and only then, in the backlog pass, filed the build request from his words (run 39706669859: `claim|lesson|build|record = 1|0|1|1`). The request carried his words verbatim. But the lane had treated the LINK as the whole item, the reading never ran on his words, and the card kept saying **"Could not be looked into"** above words that were right there.

## Decision

**His words come first, not last.**

1. **In the lane:** when every road to a link fails and five or more words were written beside it, those words become the answer. The answer row's first line is *"From your own words: the link could not be read, so nothing here came from it."* (never the web-search sentence, which would be untrue), the reading runs on his words in the same pass, and what it was sent for is filed from them like any answer. A bare link with almost nothing beside it still fails with its why.
2. **On the card:** an answer of his own words shows under *"Your own words are the request"*, with the link's failure as a note beneath. An item already filed from his words after a failure reads **"Filed from your words"**, with what was filed, and never "Could not be looked into".
3. **In the filed request:** his words are labelled as the request, and it says nothing in it came from the link.

## What was measured

| what | before | after |
|---|---|---|
| when his words beside an unreadable link are used | after every road failed, in a later pass | the moment the roads fail, in the same pass |
| what the card said for `1c14eb85` | "Could not be looked into" | "Filed from your words" + the build request filed |
| the first line of an answer made of his words | (none; it was a failure) | "From your own words: the link could not be read, so nothing here came from it." |
| does the reading run on his words | no | yes, in the same pass |

## The words read clean, and copy (same day)

Darrell sent a screenshot of an answered YouTube item (the 14:27 link) with *"I need to be able to copy the text... also... why can't you get these text?!"*. Measured on that card: the unverified sentence printed TWICE (the card's note, then the row's own first line inside the words), and the transcript's `# Transcript of YouTube video ... / # Fetched on the NAS ... / # Source: youtube-asr ...` header lines read as part of what was said. Now the row's copy of the sentence is not repeated inside the words, and the header lines become one short *About these words* line above them. **Copy the words** and **Show all the words** (DR-1202) sit under every answer, a transcript included; that screenshot shows the card from before DR-1202 reached the site.

**Why the agent "could not get these texts":** the cloud sandbox has no route to the live database, and the agent stopped there. A runner does have the route: `inbox-lesson-body.yml` reads any of Darrell's own rows, and `source-transcript-nas.yml` commits a video's transcript into the repo where a session reads it. The 14:27 video (`6GVmsB3PLmY`, DR-1175's *"his video is unread"*) was dispatched on that road the same hour.

## Impact

- The trivia item reads as what it is: a build request filed from his words. Every later link that cannot be read but carries his words is answered, read and filed in one pass.
- No source is ever invented: his words are labelled his, and the link's failure is said beside them.

## Verification

- `a-link-becomes-what-it-was-sent-for.test.jsx`: +7 cases (the answer's shape back into "own words", the filed request, the `filed` state, both cards, the lane's branch and first line); **proven to catch** (the `filed` rule removed: 2 red; restored: 36 green).
- The lane's word extraction run in a shell on his item: `[We need this inside the Love Corner App each week... trivia questions] words=12`.
- The clean words: proven to catch (the strip removed: 1 red; restored: 37 green).
- Research suites 73 green; lint 0; `verify:gates` 0.
- **Not yet observed live:** the card on poetech.us after deploy (the stewards' pass, DR-0104); the next unreadable link with words beside it, answered in one pass.
