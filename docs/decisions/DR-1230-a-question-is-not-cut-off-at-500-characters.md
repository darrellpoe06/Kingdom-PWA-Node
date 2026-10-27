# DR-1230: A question is not cut off at 500 characters, and the cap that bounds it stays provable

**Date:** 2026-10-27
**Status:** Accepted
**Area:** `infra/nas-research/research_forwarder.py` — the sovereign research road

## Context

The research road is the sovereign path a link or a question takes to the tower's
own model: the app posts to `/ask`, the forwarder bounds the request and hands it
to Vane on the NAS, and the answer comes back marked `"verified": false` so it can
only enter a lesson through the verification gates. It is request-driven, not the
timer-driven class the three-brakes rule governs, but a public door still carries
bounds: one question in flight, a timeout per answer, and a cap on how long a
single question may be.

## What was measured

A real research question sent from the app came back **413 — "query is longer than
500 characters"** (`research_forwarder.py:239`). Five hundred characters is about
eighty words: shorter than the questions this road actually carries. The same file
lets a single **read** take 24000 characters (`MAX_READ_CHARS`), so the two halves
of one road disagreed by a factor of forty-eight about what counts as too much
text, and the smaller number was bounding the wrong thing.

The purpose of a per-question cap is to stop one caller handing the tower's GPU an
unbounded prompt. Four thousand characters is roughly a thousand tokens — nothing
for a local model — so the brake still brakes at the raised value.

## The cap is written in THREE places, and a raise is three edits or it is not a raise

This is the part worth recording, because the first attempt at this change got it
wrong and CI caught it. One cap, three implementations:

| where | what it does |
| --- | --- |
| `app/src/lib/research.js` — `MAX_QUERY_CHARS` | `queryProblem()` refuses the question **in the app, before any request is sent**. This is the one the reader actually meets. |
| `infra/nas-research/research_forwarder.py` — `MAX_QUERY_CHARS` | the NAS door's own 413, for anything arriving by another path |
| `.github/workflows/research-ask.yml` — `[ "$LEN" -gt … ]` | the shell cap on the dispatch road |

The first commit raised **only the forwarder**. Every local check passed — lint,
28 gates, the forwarder's own self-test — and the full suite in CI went red on
`research-road.test.jsx`, which asserts the forwarder's constant **equals the
app's**. That assertion is why the mistake was caught rather than shipped, and
the mistake mattered: with the app still at 500, `queryProblem()` would have gone
on refusing every long question before the request was even made, so the
user-visible defect this record exists to fix would have been **entirely
unfixed** while the record claimed otherwise.

Three test sites had the number spelled as a literal `500`, which is how a
one-sided raise could ever look green. They now derive it from the app constant:
`research-road`'s cap case and its 413-message case, and the build-tool test's
workflow check, which reads the cap out of `app/src/lib/research.js` and requires
the workflow to match it.

## The decision

`MAX_QUERY_CHARS` is **4000**, raised from 500, **in all three places**.

It is deliberately at most **half of `MAX_BODY_BYTES` (8192)**, and that
relationship is now asserted rather than left as a coincidence. The reason is the
self-test. The suite's existing check sends `MAX_QUERY_CHARS + 1` and expects 413.
Had the cap been raised to 8000 instead, that check would still have passed — but
on the **body** refusal, not the length cap, so the length cap would have stopped
being tested at all while the suite stayed green. That was reproduced, not
reasoned about: at 8000 the over-cap check printed `ok` and only the new
separability check went red.

Two checks were added beside the existing one, because refusing an over-long
question never proved that a question at the cap is *accepted* — the half that
the raise exists for:

- a question of exactly `MAX_QUERY_CHARS` is answered, not refused;
- `MAX_QUERY_CHARS * 2 <= MAX_BODY_BYTES`, so the two bounds stay separately
  provable.

## Impact — what this obligates

- **A later raise is three edits.** The app, the NAS door and the dispatch
  workflow must all carry the same number, and two tests now fail if they
  diverge. The durable fix would be one source the other two read; that is not
  done here, because a shell workflow, a NAS Python file and an app module do not
  share a module boundary, and inventing a generated constant across all three is
  a larger change than this record's subject. The gates hold them equal in the
  meantime. `re-review: 2026-11-24`.
- A later raise must keep the cap at or under half the body cap, or the
  self-test fails and says why. Raise it on a **measured refusal**, never a
  guess; `re-review: 2026-12-27`.
- The change reaches the NAS by the ordinary road: `services-sync.sh` pulls the
  mirror, and `install.sh` keeps the forwarder running. Nothing is hand-copied.

### Limits, named rather than left

- **This does not fix the defect behind the one it fixes.** When a link cannot be
  read, `app/src/lib/research-create.js` records the failure **as prose only** —
  "THE LINK COULD NOT BE READ on our own machines" — and the filed row carries
  **no tag** saying so. The tags on a created row are written by the SQL in
  `.github/workflows/research-inbox.yml`, which already has
  `research-failed` and `research-reading-failed` for the *answer* row but
  nothing on the *created* row. So nothing downstream can tell an empty research
  item from a full one without reading its prose, which is exactly the kind of
  distinction a machine should not have to infer from a sentence. A
  `research-unread` tag is the fix. It is **not** in this record: it changes tag
  semantics in a live workflow that writes to real rows, and that deserves its
  own characterization pass rather than being folded into a cap raise.
  `re-review: 2026-11-10`.
- The 4000 figure is bounded by the body cap and by what a local model shrugs at;
  it is not derived from a measured distribution of real question lengths,
  because only the one refusal was observed. If questions start being refused at
  4000, that is the measurement, and it moves.

## Proven to catch

Both new checks were shown to fail on the exact breaks they name, and to pass
again when restored:

- the cap's comparison changed from `>` to `>=` → *"a question AT the cap (4000
  chars) is answered, not refused"* **FAIL**;
- `MAX_QUERY_CHARS` raised to 8000 → *"the length cap (8000) stays provable under
  the body cap (8192)"* **FAIL**, while the pre-existing over-cap check still
  reported `ok` — the silent degradation this record exists to prevent.

`python3 infra/nas-research/research_forwarder.py --selftest` → **OK** on the
shipped values.

And the three-places agreement, each partial raise shown to fail:

- the **workflow** left at 500 while the app is 4000 → *"expected ... to match
  `/-gt 4000/`"* **FAIL** (1 of 14);
- the **forwarder** left at 500 while the app is 4000 — the exact mistake this
  record describes — → *"expected ... to match `/^MAX_QUERY_CHARS = 4000$/m`"*
  **FAIL** (1 of 16);
- all three at 4000 → **30 passed**.
