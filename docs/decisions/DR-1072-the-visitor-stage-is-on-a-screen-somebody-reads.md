# DR-1072: The visitor stage is on a screen somebody reads — and the funnel's own header was quoting a struck promise

**Date:** 2026-10-16
**Status:** accepted
**Tier:** B (a new steward-facing surface in Admin, reading live edge data)
**Type:** word
**Area:**
- `app/src/components/VisitorDoors.jsx` (new — the surface)
- `app/src/components/AccessUsageMetrics.jsx` (the chip, between Signups and Bots & blocks)
- `app/src/lib/visitor-funnel.js` (its header corrected — it cited the clause DR-1071 struck)
- `app/src/__tests__/visitor-doors-surface.test.jsx` (new — proven-to-catch)
- `app/src/__tests__/visitor-funnel.test.js` (the same stale quotation, retargeted)

**Grounds:** DR-1070's own `re-review: 2026-10-20`, run four days early under DR-0236 (*"'Later' is not a scheduling tool — directed work that can be built and verified with the tools available right now is built right now"*) and DR-0065 (*"the app is always the main thing we are actively creating"*). Standing direction from Darrell, 2026-10-16: **"Count what makes sure we build solid solutions... period."** A count nobody can read is not a count.
**Principles:** DR-0061 / P15 (a surface is a live view of real system state; reality-trace before building); DR-0065 (build it in the app); DR-0076 (unknown is never a no; proven-to-catch); DR-1070 (the derivation); DR-1071 (the disclosure, and the struck clause)

## Context

DR-1070 answered Darrell's analytics question by deriving the visitor stage from
Cloudflare's own records instead of building a tracker — and shipped it as
`visitor-funnel.js`, a pure library with 21 tests and **no caller**. It went to
production in that state and its own record admitted it: *"written but not yet
wired to Access & Usage."*

That is the exact shape of the thing DR-1070 was built to fix. DR-0008 decided
a visitor funnel in June and nobody built it for four months; DR-1070 built the
arithmetic and nobody could see it. A measurement no steward can read is not a
measurement, it is a file.

## What was measured

**The library had exactly zero callers.** `grep -rn 'visitor-funnel' app/src`
returned its own module and its own test — nothing else in 1,222 files. Every
export was reachable only from the suite.

**And the reality-trace turned up a second, worse thing.** Step 4 of DR-0061 is
*state the assumptions first*, so I read the header before writing the surface.
`visitor-funnel.js` justified its whole design by quoting the member covenant:

> *"the church's records are 'never sold, never sent to an employer, a lender or
> an advertiser, never used to decide who is welcome, or ever used to train
> anything' (DR-1064). Google is an advertiser."*

**DR-1071 struck that clause three hours earlier**, because the app has offered
a Google sign-in door the whole time and the clause was therefore already false
when members signed it. The file was arguing from a promise that no longer
exists — and `visitor-funnel.test.js:31` quoted the same dead sentence. Had the
surface been built without reading the header, it would have inherited the
argument.

**The argument that survives is the stronger one**, and it is now what the file
says: a visitor table would be a fourth place holding something about people who
never signed anything, and a derivation from logs Cloudflare keeps anyway
creates no such place. That is about what EXISTS rather than what was promised.
TLC is untouched and remains the harder line — a therapy practice, zero PHI, no
client-level tracking (DR-0008).

## Impact

A steward can now read the stage before sign-up, on the screen where they
already read the stage after it — and the three things that make the number
honest are rendered **from the library's own strings**, so the words on the
screen cannot drift from the words the library is tested against.

## Decision

**A chip, "At the doors", in Admin → Users & usage**, between *Signups* and
*Bots & blocks*: the visitor side belongs beside the signed-in side, and the
fetch only runs when the chip is opened. It reads `getTraffic(24)` on the app's
own `/edge` road — the same live road the chip next to it already uses.

**What it draws, and what it refuses to draw:**

- **Requests per door** (`doorTraffic`), labelled *requests*, never *visitors*,
  with the plumbing total said separately so the reader is not left wondering
  where 1,200 asset requests went.
- **The mix, site-wide, in four buckets** (`trafficMix` + the Edge Guard's own
  `agentKind`): browsers, **our own witnesses**, crawlers/scripts/AI, and
  unknown. Our own site-health probes are named on the screen as ours.
- **No conversion rate, and no per-door mix.** Cloudflare returns paths and
  agents as two independent aggregations, so no row links an agent to a path.
  "Human visits to the church door" would be a join that is not in the data.
- **No member side.** `doorFunnel()`'s signed-in half exists but `usage_events`
  is not aggregated per door, and splitting it would be the painted number
  DR-0061 forbids. It stays unused until that aggregate is real.
- **Unknown is never zero.** If the road does not answer, the surface says so in
  the Worker's own words and draws **no bars at all**.

## Verification

- **7 cases, weighted at the three lies a visitor surface tells most easily** —
  zeros for an unanswered road, our own probes counted as people, and requests
  labelled as people — not at the arithmetic, which DR-1070's 21 cases pin.
- **Proven to catch, by two mutations** (DR-0076 §3):
  - rendering the door list when the road did **not** answer → the
    "UNKNOWN, NOT ZERO" case **fails**;
  - folding `ourWitness` in with `browser` → the four-bucket case **fails**,
    because the fixture is built so that lie reads as 81% people instead of 58%.
  - File restored byte-identical after each (`git diff --stat` empty); 7/7 green
    after restore.
- The fixture is shaped exactly like the Edge Guard's real payload: paths and
  agents as separate lists, two plumbing paths, and one empty user-agent so the
  `unknown` bucket is exercised rather than assumed.
- **The chip is asserted to be WIRED**, by reading `AccessUsageMetrics.jsx` for
  the import, the id, the label and the render — because an orphaned component
  is the precise failure this record exists to close.
- The component is asserted to write nothing (`insert`/`upsert`/`localStorage`)
  and to contain no tracker call — a tracker on the one surface about visitors
  would be the whole joke.
- 8 suites re-run around the panel (`member-inspect`, both `signups-*`,
  `roster-named-*`, `access-usage-slow-load`, `edge-guard`, `visitor-funnel`,
  the new one): 79 tests green. 23 gates green by exit code; lint clean; build
  green.
- **DR-1070's `re-review: 2026-10-20` is answered early and closed.** What it
  asked — *wire the funnel, and name the one place a steward reads the count* —
  is done: Admin → Users & usage → **At the doors**.

## What this does not do

- **It does not add a per-door human count**, and the surface says why in the
  library's own sentence. That needs a join Cloudflare's payload does not carry.
- **It does not aggregate `usage_events` per door**, so the signed-in half of
  `doorFunnel()` is still unused. That is a real gap with a real cost — a
  steward cannot yet see "40 requests at the church door, 3 people signed in" —
  and it needs a governor-gated aggregate that does not expose a person's trail.
  **`re-review: 2026-10-23`.**
- **It does not change what is collected.** Nothing. No tracker, no cookie, no
  beacon, no row about anyone who has not signed in — rendered on the screen,
  not only asserted here.
- **It does not read the number for anybody.** The next honest question is what
  the real 24-hour mix actually is on poetech.us, and this sandbox has no route
  to the site: that reading comes from a steward opening the chip, or from the
  runner-side witness. I have not seen it and do not claim it.
