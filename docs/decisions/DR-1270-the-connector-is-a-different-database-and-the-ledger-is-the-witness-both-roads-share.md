# DR-1270 — The connector is a different database, 20 of its 22 "waiting" rows are already live, and the ledger is the witness both roads share

**Status:** accepted (the guard is built and proven; the Routine's instruction needs the Governor)
**Tier:** B (the lesson intake lane)
**Date:** 2026-10-28
**Entities:** `scripts/lesson-row-shipped-sweep.mjs` (new); `app/src/__tests__/a-row-already-shipped-refuses-to-build.test.js` (new, 14 cases); the intake Routine `trig_01KnByrzx8yYCURwfRKUrvTq`; hosted project `mjjlevhdufpaplypnqrv`; `scripts/lesson-inbox-waiting.sql`
**Grounds:** DR-1250 (a shipped lesson does not go on waiting), DR-0610 (one teaching, one lesson), DR-1249 (a read that fails must not read as a clean result), DR-0669 (`lesson-captured` is the builder's lock), VERIFICATION-DOCTRINE (DR-0076), DO-THE-WORK (DR-0111), REVIEW-OUR-WAYS (DR-0108)

## Context

The intake Routine names two roads to the waiting rows: the NAS road (`inbox-lessons-waiting.yml`, which runs `scripts/lesson-inbox-waiting.sql` through `live-sql.sh`), and, *"only if it is actually available, with the same query"*, the hosted Supabase connector for project `mjjlevhdufpaplypnqrv`.

On 2026-10-28 the first road was closed for twelve hours — the runner's Tailscale auth key was refused by Tailscale's control plane (DR-1269; **not** an unreachable NAS, which is the error DR-1267 made). The connector was available. So the permitted fallback was taken, and measured before anything was built from it.

## What was measured

**The two roads do not see the same database.** Three rows tagged through the NAS road earlier the same night come back from the connector untagged:

| row | shipped as | NAS road | hosted connector |
| --- | --- | --- | --- |
| `60972a31-db63-4959-8a50-ee58a28643d4` | sov52, PR #2450 | `lesson-captured`, `lesson-published` | neither tag |
| `d56b9e85-1903-4004-b6ec-04cb319784b0` | ll268, PR #2451 | `lesson-captured`, `lesson-published` | neither tag |
| `b97aa626-fb49-4347-b75c-3040eade2344` | ll269, PR #2452 | `lesson-captured`, `lesson-published` | neither tag, and **still `lesson-building`** |

The last line is the proof rather than the symptom. `lesson-building` is excluded by the waiting query itself, so a row carrying it **cannot appear** on the NAS road's waiting list — yet `b97aa626` appeared there at 01:07, was built, and was tagged. The hosted project still shows it mid-build, with `returned:lesson-building`. One database advanced; the other did not. The app, the waiting witness and the tagging workflow all read the sovereign database on the NAS (REPOINT-ARMED, `live-sql.sh`); the hosted project is a separate store, frozen near the repoint.

**The consequence, measured against the ledger: 20 of the 22 rows the connector calls "waiting" are already named in shipped decision records.** sov52, ll268 and ll269 from last night; ll261 twice (`031a898a`, `bee78650` — DR-1234, the same teaching in two rows), ll262 (`0593ae29`), ll263 (`6130c486`), and twelve more reaching back to DR-0684. Exactly **two** are not named anywhere: `dbc12b70-c908-464c-b246-3230632f480e` and `839d8c16-4a41-4461-86a7-e295b2f2f8ea`, both from 2026-10-22.

So a session with only the connector available sees a twenty-deep backlog that does not exist, and building from it ships the duplicate DR-0610 forbids. **This is DR-1250's harm reached by a second, independent route.** DR-1250's rows lacked `lesson-captured` because it was never written; these lack it because it was written somewhere else. Either way the tags cannot answer the question, which is the point: **`lesson-captured` is untrustworthy precisely when it is most needed.**

**DR-1250's own ask was never built.** It closed with: *"A check run four times by hand in one session is a check that belongs in the instrument."* The bell still decides `shipped` from the `lesson-published` tag (`lesson-inbox-bell.mjs:93`), so it cannot catch either failure. The sweep was run by hand a fifth time to produce the table above.

**So the instrument now exists, and it asks the ledger instead of the tags.** `scripts/lesson-row-shipped-sweep.mjs` searches `docs/decisions/` for each row id and exits 1 if any is already named, so a build lane can refuse. The ledger is the one witness both roads share: a shipped lesson has a decision record, and that record names the row it came from.

**Two defects in that guard, both found by its own tests, both in a direction worth naming:**

1. **A false UNKNOWN.** The first version searched the full uuid only. The ledger conventionally cites a row by its first eight characters, so `c3285321` (DR-0771) and `7ce13700` (DR-0768) came back unknown though both were long since handled. That is the dangerous direction — it permits rebuilding a live lesson, the exact harm this guard exists to stop. Fixed by searching the prefix too, and reporting a prefix-only hit as `SHIPPED?` so the weaker match is visible rather than silently equal.
2. **A false SHIPPED, introduced by that fix.** A bare 8-character prefix is a substring, and the fabricated test id `00000000-…` matched DR-1235, whose text carries the epoch `1761500000000`. A false SHIPPED blocks a teaching nobody has built. Fixed with a hex boundary — the prefix must stand alone, which the ledger's real citation form (a backticked `` `c3285321` ``) satisfies and a digit inside a timestamp does not.

The tool and the by-hand sweep now return the same 20 of 22. **That agreement is the verification**, not the tool's own say-so.

## Impact

- **The backlog is at most two teachings, not twenty-two.** That is the number worth acting on, and it is only knowable by reading the ledger.
- **Those two still cannot be built, and the reason is a standing rule rather than a judgement.** A lesson body may be read ONLY through `inbox-lesson-body.yml`, which needs the same tailnet key that is refused. The connector holds bodies, and taking them from there would both break that rule and source a teaching from the store already shown to be divergent. They wait for the key.
- **The guard is available to every road now** — the bell, the Routine, a build lane, or a person with two row ids and a question.
- **What NOT to conclude: the hosted project is not garbage.** It is a real store that was correct until the repoint. Nothing here says to delete it, and nothing here reads on its tags either way.
- **The Routine's instruction needs amending, and that is the Governor's, not mine.** It currently permits the connector *"with the same query"* as an equal alternative. The measurement says it is not equal: same query, different database, twenty false positives. The recommendation is that the connector line either be removed, or require this sweep first and treat any `SHIPPED` row as unbuildable. **I have not edited the stored Routine prompt** — it is Darrell's standing automation, and changing what it tells future sessions on my own reading of one outage is exactly the usurping DR-0111 forbids in the other direction. `re-review: 2026-11-04`.
- **A smaller finding, dated:** the bell deciding `shipped` from tags alone is now known-insufficient twice over. Wiring this sweep into it is the obvious next step and was not done here, because the bell is the thing that pages and changing it deserves its own proof. `re-review: 2026-11-04`.

## Decision

Build the ledger sweep DR-1250 asked for, and use it rather than the tags to answer "has this row already shipped". Do not build from the hosted connector's waiting list: it is a different database from the one the app, the witness and the tagging road use. Record the Routine's connector instruction as needing the Governor's amendment and leave the stored prompt untouched. The two unnamed rows wait for the tailnet key, because their words may come only through the sanctioned road.

## Verification

- **14 cases green**, run against the REAL ledger rather than a fixture, because a fixture would not have caught either failure: the three rows shipped last night are found with their records and flagged `exact`; the two prefix-only rows are found and flagged NOT exact; a fabricated uuid comes back unknown; an id shorter than 8 characters is refused, not answered; a non-hex id is refused rather than compiled into a regex; and the exit code is 1 for a shipped row, 1 for a mixed batch, 0 for unknown only.
- **Proven to catch, twice, on itself:** the full-uuid-only version returned unknown for `c3285321` and `7ce13700` (false unknown); the bare-prefix version returned SHIPPED for `00000000-…` via DR-1235's epoch (false shipped). Both are pinned by name so neither can return.
- The divergence measured directly: `has_captured`/`has_published` false for all three rows on the hosted project, with `b97aa626` still carrying `lesson-building` — a tag the waiting query excludes, so the NAS road could not have listed it had it carried that tag there.
- The 20-of-22 figure produced twice by different methods — `git grep` by hand and the tool — in agreement.
- `lint` clean; `business-systems-guard`, `decision-citation-guard`, `decision-record-guard`, `his-hand-guard`, `interconnect-guard` all OK.
- **NOT verified:** the bodies of the two unnamed rows, deliberately — they were not read, from either road.
