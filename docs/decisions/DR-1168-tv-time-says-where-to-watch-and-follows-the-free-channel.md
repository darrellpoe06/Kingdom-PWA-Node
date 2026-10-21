# DR-1168: TV Time answers "where is it on" and follows the free channel — the connect button that could not work was never built

**Date:** 2026-10-21
**Status:** accepted
**Tier:** A (one existing module's tab gains two panels; device-local state, one keyless same-origin read route; no schema, no money, no front-door identity)
**Type:** feature

**Area:** `app/src/components/TVTime.jsx`, `app/src/components/TVChannels.jsx`, `app/src/lib/tv-where-to-watch.js`, `app/src/lib/youtube-follow.js`, `app/src/lib/tv-catalog.js`, `app/src/lib/tv-time.js`, `app/functions/api/youtube-feed.js`, `app/src/lib/feature-registry.json`.

**Principles:** DR-0076 §3 (proven-to-catch), §4 (measure, never claim), §8 (provenance + honest uncertainty); DR-1053 (unknown is never a no); DR-0381 (not hollow); DR-0061 (reality-trace first); DR-0726 (a control keeps its registry entry); DR-0099 (true red is reserved); DR-0210 (our voice); DR-1136 (two records cannot share one number).

## Context — what Darrell asked

2026-10-21, on the **PoeTech TV Time** tab:

> "I want users to be able to connect their streaming platforms and the free ones
> YouTube channels explains... just an easy way to get it done through this tab...
> make sense?"

Two things are being asked for, and only one of them can be built the way it is
worded. This record says plainly which is which.

## The premise, and what is actually ours to claim

**UNVERIFIED LEAD, carried as a lead and not as fact (DR-0076 §8).** That
Netflix, Hulu, Max, Disney+ and Prime Video publish no consumer API for linking
an account or reading a watch history was handed to this work as a premise. **We
did not confirm it.** This build has no network route to any of those vendors —
every host tried answered `CONNECT tunnel failed, response 403` — so no claim
about any platform's API or embed policy is established fact here, and none is
written into the code as one. The modules say so in their own headers.

**What does not depend on the lead being true:** we ship no control whose working
we cannot demonstrate. A "Connect Netflix" button we cannot exercise even once is
a surface that looks finished and is not (DR-0381). So it is not built, not
stubbed, and no copy promises one is coming — and a test asserts all three.

What we built instead is **the question the connect button was only ever a means
to**: *where is this on, and can I watch it for free?* — plus the one platform
that genuinely does connect, keylessly: a free YouTube channel.

## Reality-trace (DR-0061), run before any code

**The real rows TV Time reads and writes today.** Device-local `localStorage` at
`poetech.tvtime.v1:<email>` (`lib/tv-time.js:22,84`), shaped
`{ shows: { id: {status, rating, comments, watched, share} }, custom: { id: {kind,title,genre,poster,year,network,seasons,sourceId} } }`;
plus, signed in, the owner-only `tv_watch` Supabase row (`lib/tv-time-sync.js:99`)
merged newest-wins. Live provider reads are browser-side and keyless: TVmaze
(`api.tvmaze.com`) and the iTunes Search API, through `lib/tv-catalog.js`.

**The fact that answers Darrell's question was already arriving — and was being
thrown away.** TVmaze returns BOTH `network` (the broadcaster) and `webChannel`
(the streaming service). `showBrief` collapsed them with a single `||`
(`lib/tv-catalog.js:58`, pre-change), so "HBO" and "HBO Max" became one
indistinguishable string, and that string was rendered **only** as a grey crumb
inside a `year · network · genre` join (`TVTime.jsx:194` and `:659`). The one
field that says where a show streams was in every payload, in every stored
record, and on no surface as an answer. **That gap was the work.**

**The surface a person actually uses** was read in the running component, not
assumed: `TVTime.jsx` renders `SectionTabs` with `My shows & picks` and
`Your circle`, and each card already folds `Episodes` and `Talk` behind their own
controls — so a third fold is the shape the card already teaches.

**Premise written down before coding:** that a real streaming answer exists
keylessly (TVmaze `webChannel`), that free-service search routes are real but
unmeasured, and that a YouTube channel's Atom feed needs no key. All three were
then measured. Two of the three were partly wrong, and the measurement is why
this record can say so.

## What was measured, and what the measurement changed

The cloud sandbox has no route to `tubitv.com`, `pluto.tv`,
`therokuchannel.roku.com`, `api.tvmaze.com` or `youtube.com` (403 on every
`CONNECT`), and `WebFetch` resolves none of them. So a **temporary GitHub-runner
probe workflow** did the measuring, in three rounds, and was deleted in this same
PR. Runs **39558010050**, **39558202527**, **39558498265**.

| Candidate | Measured | Shipped as |
| --- | --- | --- |
| `tubitv.com/search/<q>` | **200**, page title ECHOED the query; a nonsense path on the same host **404s** | `kind: 'search'` — proven |
| `tubitv.com/search?q=<q>` | 200 but title read "Trending Searches" — query ignored | not shipped |
| `pluto.tv/en/search/<q>` | 200 but served the **home page**; query silently dropped | **not shipped — this was my first guess** |
| `pluto.tv/en/search?q=<q>` | **200**, body mentions the queried title; nonsense path served home | `kind: 'search'` — proven |
| `therokuchannel.roku.com/search/<q>` | 200 but a 24KB `<meta name="fragment">` SPA shell, **15 bytes** off a nonsense path; the home page ships **no `/search` href at all** | `kind: 'browse'` to its verified home (200), labelled **"Open"**, carrying **no query** |
| `watch.plex.tv/search?query=` | 200, route distinct (840KB vs 381KB) | not shipped — not a service Darrell named; scope held to three |
| `crackle.com` | connection error from the runner | not shipped |
| **Freevee** home | **404** | **not shipped — the service is gone** |
| `feeds/videos.xml?channel_id=<id from memory>` | **404**, twice | — |
| `youtube.com/@Google` | **200**, and the page carries `channel_id=UC…` | handle resolution, keyless |
| `feeds/videos.xml?channel_id=<id measured from the page>` | **200**, 40,021 bytes | the sovereign road |

Four things that measurement bought, each of which would otherwise have shipped
as a defect:

1. **Pluto TV's URL was wrong in my first draft.** The path form looks right and
   returns 200; it just ignores the title. One probe, one corrected line.
2. **Freevee is dead.** Darrell named it. Amazon announced its end in November
   2024 and the app went offline by August 2025, its catalogue folded into Prime
   Video under a "Watch for Free" label; its home now 404s. A Freevee chip in
   October 2026 is a button to nothing, so the list ships three services, not
   four, and a proven-to-catch case fails if Freevee is ever added back.
3. **The Roku Channel has no verifiable search route.** Rather than invent one
   or drop a service Darrell named, it ships as a `browse` link with a different
   label ("Open" rather than "Look on") and no query string — the honest shape.
4. **The YouTube feed endpoint works; my channel ids did not.** Two ids recalled
   from memory 404'd, which looked exactly like a blocked host and would have
   been reported as "the sovereign road is absent". Resolving a handle to its
   real id first returned 200 and 40KB. **The road was fine; the memory was not**
   — which is DR-0076 §8 in one afternoon.

**And the live document exposed a parser trap.** The real feed's header drops the
`UC` prefix from its own element while the per-entry copy keeps it:

```
<id>yt:channel:AuUUnT6oDeKwE6v1NGQxug</id>
<yt:channelId>AuUUnT6oDeKwE6v1NGQxug</yt:channelId>        <-- no "UC"
<link rel="self" href="...?channel_id=UCAuUUnT6oDeKwE6v1NGQxug"/>
```

Reading `yt:channelId` — the obvious element — yields a 22-character string that
is **not** a channel id, and would have produced a silently un-followable row.
`parseFeed` therefore takes the id from the header's urls, where YouTube writes
it in full, and accepts the bare element only when it is genuinely well-formed. A
parser written from a remembered shape ships this bug; the sample in
`youtube-follow.test.js` is a verbatim slice of the real document, which is why
this one does not.

## The decision

**1. `network` and `webChannel` are two facts and are stored as two fields.**
`showBrief` keeps them apart, and `webChannel` is **always present** — set to
`''` when TVmaze records no streamer. Its *presence* is load-bearing: it is how
`whereToWatch` tells **"we asked and TVmaze had no answer"** apart from **"we
never asked"**. Records written before this DR carry no key at all and stay
honestly un-asked until a reader checks.

**2. Unknown is never a no (DR-1053).** `whereToWatch` returns exactly one of
`streaming` / `broadcast-only` / `unknown`. There is no `none`. No sentence it
produces contains "not available" or "unavailable", in any state, for any input
including `null` — asserted over every state at once, and proven-to-catch against
a wrong implementation that says "Not available on any streaming service." A
broadcaster is reported **as a broadcaster** and is never promoted into a
streaming claim it never made.

**3. A free-service link is a search or a browse, and the label says which.** A
proven search route reads "Look on Tubi"; an unverified one reads "Open The Roku
Channel" and carries no query. Neither makes an availability claim, so neither
can lie, and every title gets them — nothing dead-ends.

**4. The one platform that really connects is the free one.** A YouTube channel's
Atom feed needs no key, no OAuth and no account. It is fetched by
`app/functions/api/youtube-feed.js`, our same-origin Pages Function, following
the `api/link-title.js` pattern (`onRequestGet` + Cache API + an 8s timeout + a
512KB capped read). The host is **pinned**: `channel_id` must match
`/^UC[A-Za-z0-9_-]{22}$/` and the feed url is built by us, never taken from the
caller, so this cannot become an open proxy; the `url` form accepts only a
youtube.com/youtu.be channel page and is used solely to read a `UC` id out of it.
Resolving at our edge is also the **privacy** property: the family member's
device never talks to Google, so what they follow does not leave it.

**5. An un-read feed is not an empty channel.** `mergeEpisodes` returns
`missing` for every followed channel whose feed was not read, and the surface
names them — *"That is not the same as having no new episodes."* A channel that
was read and genuinely has nothing is a different, separately-rendered sentence.
Proven-to-catch against a merge that defaults an un-read channel to
`{ episodes: [] }`.

**6. Nothing loops on a clock.** Feeds are read when the panel opens and when the
reader taps "Check for new episodes". The TVmaze check is gesture-driven and
single-flight per title, so a 100-show imported wall shares one lookup per title
and can never burst a free API. No timer, no self-triggering work, so the
three-brakes rule's autonomous class is not entered at all.

## Colour and voice

No true red is introduced; the "Free with ads" badge and the free-service routes
use the themed accent green `#5A6E3D` and `#C9BFA8`, and red stays reserved for
the Blood (DR-0099). The contrast guard **caught a real failure of mine**: the
badge first used `#2F6B33` as TEXT, which measures **2.87:1 on midnight's
`#141414`** — it carries no midnight remap and is only ever safe as a background
behind white. Changed to `#5A6E3D` and the guard passes every theme.

## Verification

- `tv-where-to-watch.test.js` — 20 cases: the measured routes, the dead service,
  unknown-is-not-a-no across every state, asked-vs-never-asked, and that no
  connect-an-account control or "coming soon" copy exists in the module.
- `youtube-follow.test.js` — 20 cases against a **verbatim slice of the live
  feed**, including the missing-`UC` trap and un-read-is-not-empty.
- `tv-watch-proves-catch.test.js` — **5 breaks, each required to fail**:
  "not available" instead of unknown; Pluto's query-dropping path form; the naive
  `yt:channelId` read; an un-read feed counted as zero episodes; Freevee added
  back.
- `tv-where-to-watch-render.test.jsx` — 10 **live render** cases: the panel on a
  real card, a free service named and badged, a broadcaster reading unknown, the
  labelled routes with `target=_blank rel=noopener`, no connect control on screen,
  the measured coverage line, and a real **Check → answer → persisted** round
  trip; plus following a channel over a stubbed edge, a bad link reported
  plainly, an unreadable feed named, and an empty list fetching nothing.
- `tv-catalog.test.js` — **18 -> 24** cases: broadcaster/streamer kept apart,
  `webChannel` always present, and `resolveWatch`'s asked / un-asked /
  single-flight / never-throws behaviour.

**Counted, not estimated** (this record first said "53 new cases plus 5
extended", which was neither — measured per file): **61 new cases** across the
five new suites (20 + 20 + 5 + 10 + 6) and **+6 extended** in `tv-catalog`,
**67 in all**. Correcting my own arithmetic is the same rule as correcting a
provider URL (DR-0076 §4).
- `feature-presence.test.jsx` — two new walks and **nine new registry entries**
  (DR-0726). Verified proven-to-catch by renaming one `data-testid`: the gate
  went red naming *"Missing: Where to watch (on a show card)"* and five siblings.
- `youtube-feed-edge-guards.test.js` — 6 cases on the edge road's safety
  decisions, which are the part of a Pages Function a test can actually run.
  The host allow-list refuses a lookalike subdomain, a suffix lookalike, the
  name appearing only in a query string, loopback v4 and v6, **the cloud
  metadata address `169.254.169.254`**, `file://` and `javascript:`, a
  scheme-relative url and a bare host. Proven-to-catch by widening the
  allow-list from equality to `h.includes('youtube.com')`: the gate went red
  naming `"https://youtube.com.evil.com/x" must be refused`, and the file was
  restored **byte-identical, verified with `cmp`** (DR-1092 — `git diff --stat`
  cannot tell a restored file from an edited one while real edits are
  uncommitted).
- `contrast-guard.mjs` — PASS, 11 themes, 60 bg + 57 text classes both
  directions in midnight.

## Honest limits — what is NOT verified (DR-0076 §8)

- **I could not run the layout sweep in this sandbox.** `playwright-core`
  installs but the Chromium CDN (`playwright*.azureedge.net`) is refused by the
  egress proxy, so `chrome-layout-probe.mjs --sweep` cannot run here. CI runs the
  `--selftest-break` pass and then the sweep at 360/768/1440/1920 on every push,
  and that run is the measurement of record for this change.
- **I never saw this rendered in a browser.** Every render claim above comes from
  jsdom through the real components, not from a screenshot of poetech.us — the
  sandbox has no route to the live site either.
- **The edge function has not been exercised against the real feed end to end.**
  Its parser is verified against the live document and its route is verified from
  a runner, but `/api/youtube-feed` itself runs only once deployed. First real
  exercise is the live review pass (DR-0104).
- **The paid-platform API premise remains an unverified lead**, as stated above.
  Nothing shipped depends on it.

## Re-review

**`re-review: 2026-11-21`** — one month. Two open items, neither blocking:
(1) **The Roku Channel's search route.** It ships as a browse link because no
search route could be proven from HTTP. A browser-side read of its SPA bundle, or
its own in-app search once observed, would settle it; if a real route is found,
the entry moves from `browse` to `search` and the label follows.
(2) **Coverage depends on TVmaze's `webChannel`, which is sparse for older and
imported titles.** The measured coverage line on the surface makes that visible
rather than hiding it. If coverage reads poorly against a real family list, the
next step is a provider that covers availability properly — Trakt is the one
service in this space with a genuine OAuth API and is the recorded candidate —
which is a **new decision with a key to obtain**, not a change to this one.
