# DR-1053: A read that could not be made is NOT a no — the church surfaces that turned a failed query into a verdict about a person

**Date:** 2026-10-15
**Status:** accepted
**Tier:** B (church-facing; changes what a person is TOLD about their standing, changes nobody's actual access)
**Type:** word
**Area:**
- `app/src/lib/church-access.js` (new — the three-valued answer, the bounded ask, the combinator)
- `app/src/lib/church-instance.js` (the resolver stops collapsing "no church" and "could not ask" into one null)
- `app/src/lib/choir-sync.js`, `app/src/components/Choir.jsx` (his first screenshot)
- `app/src/lib/church-member-sync.js`, `app/src/components/ChurchMemberSpace.jsx` (his second screenshot)
- `app/src/lib/bus-ministry-sync.js`, `conference-sync.js`, `church-devices-sync.js`, `church-ministries-sync.js`, `ministry-ops-sync.js`, `video-wall-sync.js`, `app/src/components/AdminConsole.jsx` (the same keystroke, seven more places)
- `scripts/unknown-is-not-a-no-guard.mjs` + `app/package.json` (the gate, in the required lane)

**Grounds:** Darrell, 2026-10-15, from his phone at The Love Corner. Two screenshots an hour apart, then: **"Comprehensive understanding of the system and processes then opportunities and constraints then solutions... fix it soundly."**
**Principles:** DR-0076 §3 (proven-to-catch), §4 (measure, do not claim), §5 (characterize before you change), §6 (reality-trace); DR-0219 (SHOULD / ARE / GAPS / CLOSE); DR-0330 (a surface that lies is worse than one that is blank); DR-0621 (hold the hand of the process); DR-0111 / DR-0236 (build it now)

## Context — two screenshots, one defect

**The first**, the Choir tab, signed in, at his own church:

> This is the choir's space. Ask the choir director to add you to the roster, then the week's music, schedule, and messages will show up here.

**The second**, an hour later, the My Record tab, same session:

> Your record could not be opened. opening your record timed out after 15000 ms.

The second explains the first, and that is the whole finding.

## SHOULD — what the documented intent is

`church-instance.js:9` states the contract in its own header: the resolver
"returns the church instance id, or null when the user has no church access
(callers degrade to empty / 'ask to be added')." `Choir.jsx` renders the
"ask the director" panel on `!access.canSee`. `ChurchMemberSpace.jsx` renders
the error panel on a failed read. Each of those is correct **for the case it
names.** None of them names the third case.

## ARE — traced end to end, before a line was written

**My Record.** `ChurchMemberSpace` → `readMyChurchRecord` →
`rpc('church_member_record_read')`, wrapped in **one 15-second timeout, one
attempt, no retry, nothing to tap.** And the RPC itself (0212) **raises** on
every named failure — `sign in first`, `no church to read`, `that is not your
church` — each of which comes back as a PostgREST error in milliseconds. So a
15-second timeout is **none of the failures the function knows how to have.**
It is the request never completing at all.

**Choir.** `Choir.jsx` → `getChoirAccess`, which read, verbatim:

```js
const [{ data: role }, { data: inChoir }] = await Promise.all([
  supabase.rpc('user_role_in_instance', { tenant_uuid: tenantId }),
  supabase.rpc('user_in_choir',         { instance_uuid: tenantId }),
]);
const { canEdit, canSee } = deriveAccess(role, inChoir);
```

**The `error` is destructured away.** When the same stall that timed out My
Record hits these two calls, `role` and `inChoir` are `undefined`,
`deriveAccess(undefined, undefined)` returns `canSee: false`, and the surface
tells a member of the church that he is not on the roster.

And `churchInstanceId` did it one layer down, for **all 23 of its callers**:
`if (error) { console.warn(...); return null; }` — "you belong to no church"
and "we could not ask" came out of that function identical.

**So one surface reported the failure honestly and dead-ended; the other turned
it into a statement about his standing in the house of Yahweh that was not
true.** That second one is the defect. It is DR-0076's "unknown is never up"
turned inside out: **unknown is never a no.**

## What was measured

**GAPS, counted rather than estimated.**

Counted on the real tree at `5da26a971`, in `app/src`:

| place | what it did |
|---|---|
| `choir-sync.js:472` | `{ data: role }`, `{ data: inChoir }` — error dropped |
| `bus-ministry-sync.js:50` | same shape |
| `conference-sync.js:272` | same shape |
| `church-devices-sync.js:132` | `{ data: role }` — error dropped |
| `church-ministries-sync.js:25` | same |
| `ministry-ops-sync.js:39` | same |
| `video-wall-sync.js:144` | same |
| `AdminConsole.jsx:225` | same — **found by the guard, not by me** |
| `church-instance.js` | one null for two different worlds, 23 callers |
| `church-member-sync.js` | one attempt, 15 s, no way forward on screen |

`service-program.js` was **already right** and is left alone: it keeps every
`error` and renders them on the refused screen. It is the pattern the rest
should have copied.

## Impact

**What it buys.** The two surfaces Darrell photographed stop lying and stop
dead-ending: a church read that cannot be made now says so, in plain words that
name it as a failure to ASK rather than a verdict about the person, with a Try
again. Eight access paths stop discarding the one piece of information that
distinguishes the two. And a single stalled request on a phone is no longer the
whole answer.

**What it costs.** Nothing in access: the combinator proves it. A few hundred
milliseconds of backoff on a genuinely unreachable read, inside the same total
patience the person already spent.

**What it obligates.** Seven surfaces now receive `unavailable` and still draw
their old empty state; each needs the third panel Choir and My Record got.
`re-review: 2026-10-29`.

**What it does NOT reach, and this matters most.** It does not fix the outage.
The measurement that arrived while this was being written (site-health run
38811322129, 2026-10-15 21:37 UTC) says **every Cloudflare Pages Function has
been dead since 2026-10-09 — #2057, day 6 — and `/sb`, the road to the church's
records, is first on the list of dark roads.** Three retries against a road
that has been dark for six days still fail. This change makes the app honest
about that; it does not make the app work. The cure is Cloudflare-side and no
change in this repository reaches it.

## Decision

1. **One primitive, `lib/church-access.js`.** A question is asked up to three
   times, with a per-attempt ceiling, and its answer is three-valued:
   `{ ok:true, value }` — which includes a legitimate `value: null` — or
   `{ ok:false, reason }`.
2. **What gets asked again is decided by WHO SPOKE.** A PostgREST error means
   the server answered; `no church to read` is a true answer and asking twice
   only doubles the wait. A timeout or a thrown fetch means nothing came back,
   and that is the one a second attempt cures.
3. **`knownOrUnavailable(answers, derive)` is the combinator, and it is the
   safety argument.** When every answer arrived it calls **the surface's own
   `deriveAccess`, unchanged, with exactly the arguments it always received**,
   and returns its verdict verbatim. When any answer is missing it
   short-circuits to `unavailable`. **Nothing in this change decides who may
   see what.** No person gains access; no person loses access. The only new
   outcome is a third state that did not exist.
4. **The patience spent does not grow.** 3 × 5000 ms + 300 + 900 = **16.2 s**
   worst case, against the old **15 s** single shot. Same wait, three chances.
5. **The two surfaces he photographed get the third state.** Choir renders
   "We could not reach the church records just now" with a **Try again**, above
   and before the "ask the director" panel. My Record keeps its honest message
   and gains a **Try again** plus the sentence that says plainly this is not a
   statement about his record or his standing.
6. **`churchInstanceId` keeps its exact signature** so none of the 23 callers
   churn; it is now built on `churchInstanceResolve`, which means all 23
   quietly gain the bounded retry. `null` still means `null` — it simply takes
   three stalled attempts to say so instead of believing the first one.
7. **A gate, so the keystroke cannot come back.**

## Verification

- **`npm run lint` clean. 21 gates green** (the 20 that existed plus the new
  one). **`vitest` — 25 new cases pass; 290 existing cases across the twelve
  touched areas pass unchanged** (choir-sync 85, church-devices 30,
  bus-ministry 29, church-ministries 25, conference-sync 22, video-wall 18,
  church-own-door 17, church-either-door 17, admin-console 15, resolve-church
  14, ministry-ops 12, choir-sync-writes 6).
- **The combinator is pinned against the real access table.** Six
  `(role, inChoir)` combinations are asserted to produce the identical verdict
  they produced before, and `derive` is asserted to be called with
  `('owner', true)` — the same arguments, not a re-shaped pair. That is what
  makes "eight access paths in one merge" a safe sentence rather than a hopeful
  one.
- **Proven to catch (DR-0076 §3).** The guard is fed the **actual
  `getChoirAccess` body that shipped and produced the screenshot** and must
  find it — it does, at the real line, naming `user_role_in_instance`. Fed the
  replacement, the `{ data, error }` form, and a non-access RPC, it must find
  nothing — it does.
- **The guard found a place I had missed.** Its first run on the tree flagged
  `AdminConsole.jsx:225`, where a returned (not thrown) error left `myRole`
  undefined while the console reported `status: 'ok'` — an admin shown as
  having no role. Fixed in the same merge. **A gate that only confirms what its
  author already knew has not been tested.**
- **And it flagged itself, correctly, on its first run.** `church-access.js`
  quotes the broken body in its header as the record of what went wrong. The
  cure is `stripComments`, which blanks comments **while preserving every byte
  offset**, so reported line numbers stay real — the same correction the Python
  3.9 check needed on 2026-10-14, for the same reason.

## What this does NOT do, stated plainly

- **It does not prove the live cause of his 15 seconds.** The sandbox has no
  route to the live database and the Supabase connector is unauthenticated this
  session, so what stalled — a token refresh, a mobile link, PostgREST — is
  **not measured and is not claimed.** What IS proven from the code is that a
  single unretried attempt was the whole answer, and that a failed answer was
  being printed as a denial. Both are fixed regardless of which stall it was.
  **`re-review: 2026-10-22`** — read his seat live and close the DR-1052
  question with it.
- **It does not resolve whether Darrell is on the choir roster.** It makes the
  app stop claiming to know when it does not.
- **The seven other surfaces now carry `unavailable` in their access object but
  do not yet render a third panel** — their libs stopped lying; their screens
  still show the old empty state. Choir and My Record, the two he photographed,
  are complete. **`re-review: 2026-10-29`** for the remaining panels.
- **`ministry-roster.js` (DR-1052) gets the same cure when it merges.** It sits
  on an unmerged branch, where `listMinistryMembers` returns `[]` for both an
  empty roster and an unread one — the identical defect, in the surface built
  for the Media team this morning. Applied the moment that PR lands.
