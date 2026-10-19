# DR-1101: A 200 is not an answer on ANY road — and the badge describes the list underneath it

**Date:** 2026-10-19
**Status:** accepted
**Tier:** A (two probe guards tightened, one label condition corrected, two gate files; no schema, no door, no money)
**Type:** way

**Area:**
- `app/src/__tests__/a-200-is-not-an-answer-on-any-road.test.js` (new — the class gate: nine probes, seven roads, two strangers' answers)
- `app/src/__tests__/the-badge-describes-the-list.test.jsx` (new — the Ways card's label, with the build snapshot injected)
- `app/src/lib/ways-brain.js` (the parser's own shape is required, not "some JSON")
- `app/src/lib/cameras.js` (`fetchStreamHealth` requires the forwarder's own shape)
- `app/src/components/AriReview.jsx` (one condition decides the list AND the badge)

**Grounds:** DR-1000's own `re-review: 2026-10-20` — *"whether any OTHER sovereign surface's readiness probe trusts a bare 200. This fix covers the one road it was measured on; the same shape may sit on the other ten the outage listed."* Paid 2026-10-19, a day early, in an idle turn (DR-0103 §4 — pull the next dated item forward rather than wait).
**Principles:** DR-0076 (§3 proven-to-catch; §8 provenance — every contract below is read from its producer, not recalled); DR-1000 (the road this one widens); DR-0125 (unknown freshness never reads as fresh); DR-0239 (the surface-says-truth dimension); DR-0621 (a flag is where the work starts)

## Context

DR-1000 fixed `checkMediaService` on 2026-10-13 after the live site answered
"ready" over a dark house: `/nas-photos` is a Cloudflare Pages Function, no
Function ran (#2057, open since 2026-10-09), the path fell through to the SPA,
and the browser got the app's own `index.html` — HTTP 200, `text/html`. A probe
reading `resp.ok` sees TRUE. That record closed one road and said plainly that
it had not looked at the others, with a date. This is that date.

The hazard is not hypothetical on either side of the wire, and twice it is
already written down in this repository: `GET /voice/health` answered 200 with
**n8n's editor page** for three days (`app/src/lib/voice-service.js:144-151`),
and Cloudflare's HTML 1016 page once streamed through the funnel proxy into
supabase-js and **printed itself as a profile status line**
(`app/functions/_lib/funnel-proxy.js`). Two different strangers, both answering
200 in the server's place.

## What was measured

Every client probe that fetches a same-origin sovereign road was traced to its
conclusion, and each road's real contract was read from its producer:

| probe | road | verdict |
|---|---|---|
| `checkMediaService` | `/nas-photos` | sound — DR-1000 fixed it; now gated class-wide |
| `fetchListingPhoto` | `/nas-photos` (one picture) | sound — `nasFetch` rejects a non-JSON content-type at the transport, then demands `ok:true` + a `data:image/jpeg` payload |
| `probeVoiceService` | `/voice/health` | sound — demands `body.ok === true`; carries the n8n-editor-page lesson in its own comment |
| `probeAvatarHealth` | likeness studio `/health` | sound — reports `ready` from `j.ready`, and an unparsable body throws into its catch |
| `askTutor` | `/llm/chat` | sound — `normalizeTutorReply` requires a reply string |
| `analyzeSkills` | `/llm/chat` | sound — requires a parsable profile |
| `nasOcr` | NAS books OCR | sound — requires `data.text`, and falls back to on-device OCR |
| **`fetchStreamHealth`** | `/cams/streams/health` | **DEFECT** — accepted any JSON object as healthy |
| **`fetchWaysBrain`** | `/ways/brain.json` | **DEFECT** — accepted any object not saying `ok:false` as **live** |

And one finding that is not a probe at all:

| surface | defect |
|---|---|
| **AriReview's Binding Ways card** | the LIST and the BADGE were chosen by two different conditions, so an empty live answer printed **"live · 3 open re-reviews"** directly above the BUILD's snapshot principles |

Seven of nine probes were already honest, several carrying the lesson in their
own comments. That is the real shape of the answer, and it is stated plainly
rather than inflated: the class was mostly closed, and two roads plus one label
were not.

## The defects, exactly

**1. `fetchWaysBrain` / `normalizeWaysBrain`.** The guard was `!json ||
typeof json !== 'object' || json.ok === false`. A body that merely parsed as
JSON and came from anything other than the parser normalized to
`{ ok: true, live: true, principles: [] }`. The producer
(`infra/nas-ways/ways_ingest.py:129-131`) stamps `ok: True` **and** an ISO
`generated_at` on every brain it writes, so that is now what is required.

**2. `fetchStreamHealth`.** The guard was `typeof body === 'object'`, which
reads a stranger's JSON as a healthy house with no cameras in it.
`StreamHealth.summary()` in `infra/nas-cameras/cams_forwarder.py` always
stamps a numeric `interval_s` and a `cameras` object, so that is now what is
required. `sampled_at` is deliberately NOT required: it is null until the
first sample is taken, and demanding it would make a freshly-started
forwarder read as dark.

**3. The badge.** `waysLive` was `!!(brain && brain.live)` while the list was
chosen by `brain.live && brain.principles.length`. The producer writes
`principles: []` whenever `PRINCIPLES.md` parses to zero rows, so this is
reachable from the REAL server, not only from a stranger. One condition now
decides both.

## Impact

Nothing in this record was found by a report from the live site; it was found
by honoring a date. Two of the three defects need a stranger at 200 to bite and
no such body has been measured on those two roads — that is said plainly rather
than dressed up as an outage averted. **The third is reachable from the real
producer today**: any brain with an empty principles list makes the Ways card
print "live" over deploy-time data, and a reader has no way to tell. That is
the one that was actually lying, and it is the one that would never have been
caught by a probe audit, because it is a LABEL, not a probe.

The durable output is the class gate: nine probes and seven roads now answer
one question in one place. A new sovereign road that trusts a bare 200 fails
in CI before it reaches the live site, which is the whole difference between
DR-1000's fix and this one.

## Decision

**1. A readiness claim requires the producer's own shape, read from the
producer.** Not `resp.ok`, not "some JSON", not "an object" — the specific
keys the server really writes, cited to the file that writes them. Where a key
is legitimately absent at times (`sampled_at` before the first sample), it is
excluded on purpose and the reason is written beside it.

**2. A label describing data is bound to the same condition that chose the
data.** Two conditions over one card is how a true fetch becomes a false
caption. This is the surface-says-truth dimension (DR-0239) stated as a rule.

**3. The class is gated once, for every road, by name.** The roster case in
the new gate lists all nine probes explicitly, so a sovereign road added
without a case is visible rather than silently uncovered.
**`re-review: 2026-11-19`** — whether every sovereign road added since has a
case in the roster, and whether any probe has drifted back to accepting a
shape its producer does not write.

## Verification

- **Proven to catch, four for four** (DR-0076 §3), each anchor asserted present
  before mutating and each file restored **byte-identical** (`cmp`) with the
  suite green after restore:
  - `normalizeWaysBrain` back to the `ok: false` guard → the `fetchWaysBrain`
    stranger's-JSON case fails by name.
  - `fetchStreamHealth` back to `typeof body !== 'object'` → its
    stranger's-JSON case fails by name.
  - `checkMediaService` back to the pre-DR-1000 `return resp.ok ? 'ready'` →
    **both** its cases fail, which is the proof that DR-1000's own fix is now
    held by a gate instead of by a comment.
  - `AriReview`'s badge back to the two conditions → the card renders
    `Binding Ways · 3 principles / live · 3 open re-reviews /
    DRIVE-DONT-DELEGATE…`, the defect printed in the reader's own words.
- 245 tests green across 13 suites (the two new gate files plus every suite
  touching the five changed files); lint clean; **`verify:gates` green by exit
  code** (run from `app/`), not by reading its output.
- Every contract in the tables above is a read of the producer's source, cited
  by file and line (DR-0076 §8). Nothing here is recalled.
- **Not measured, and so not claimed:** no live HTTP request was made to
  poetech.us from this session — the cloud sandbox has no route to it
  (DR-0125). `site-health.yml` was dispatched on `main` at 00:12 UTC for the
  independent outside-in read; this record does not depend on its result.

## What this does not do

- **It does not close #2057.** The incident issue is the rolling downtime
  ledger and stays open by design; measured today it is still open, last
  touched 2026-10-18.
- **It does not audit the server side.** These are the client's guards. Whether
  each sovereign road's Function is mounted is the deploy's question, and
  `site-health.yml` is its instrument.
- **It does not ship behind the `hold`.** This work sits on
  `claude/account-backup-storage-purge-xr35o0`, which carries Darrell's `hold`
  on #2166 for the L79 lesson's content. It is verified and waiting, not
  merged — and that is the fourth piece of work now queued behind one label.
  The standing ask is unchanged: **split it**, and the road-signature record
  plus these gates merge on green while the hold stays exactly where he put
  it.
