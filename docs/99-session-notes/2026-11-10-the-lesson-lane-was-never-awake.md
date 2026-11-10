# 2026-11-10 — The lesson lane was never awake: 480 green runs, 77 days, no work

**Record:** [DR-1384](../decisions/DR-1384-a-dormant-lane-says-so-where-someone-will-see-it.md)

A Ways finding (DR-0108), found while checking the Gmail intake queue for the next
oldest-first lesson. Nothing here is a lesson; it is the door the lessons come through.

## What I went looking for, and what the queue said

The documented intake query is in `lesson-mail-watch.yml:63`:

```
{from:darrellpoe06@gmail.com from:dpoe@illinois.edu} Lesson -label:Lesson-Captured newer_than:3d
```

Run without the 3-day window it returns **39 uncaptured threads**. That number is wrong, and
wrong in the dangerous direction: it over-reports. Cross-referencing the 30 on the first page
against the repo, **nine already have shipped lessons** —

| thread | shipped as |
| :--- | :--- |
| `1a18262cf26c9f77` | DR-1295 |
| `1a164afce3d5ed0b` | DR-1332 |
| `1a163d3dfa9641dc` | DR-1338 |
| `1a163d000aaa1023` | DR-1325 |
| `1a163d58a4d068b6` | pm14, DR-1349 |
| `1a164aa1e4aed308` | spm11, DR-1358 |
| `1a1644a252304d70` | sov70 |
| `1a1643591fce3702` | pm15 |
| `1a168b8b45e9410d` | sov72, DR-1376 — in flight on PR #2585, correctly still uncaptured |

An oldest-first pass that trusted the queue would have rebuilt teachings the house has already
taught. This is the near-miss `ledger-names-its-thread.mjs` was written for on 2026-10-15, and
**that witness is what saved it again today**: because every lesson built from a forward records
which forward, one pass over the repo answered "is this already taught?" for all thirty.

## Why the lock is unset: measured, not inferred

`lesson-mail-label.yml` is the sanctioned road to set `Lesson-Captured` (DR-1354) — IMAP, a
runner, allow-listed labels only, never a body. It has run **twice**:

- `2026-11-06T14:52Z` — **success**, and it labelled nothing. This is the dormant-exits-0 bug
  DR-1355 then fixed: *"a run went GREEN having laboured on nothing."*
- `2026-11-06T17:13Z` — **failure**, which is the fix working. Its annotation says it plainly:
  `GMAIL_WATCH_APP_PASSWORD is not set, so NOTHING was labelled.`

So the lock has **never been set on any thread**, which is what DR-1354 already recorded, and is
still true four days later.

**The watcher is the same story, at 240× the scale.** `lesson-mail-watch.yml` has **480 runs**
from 2026-08-25 to 2026-11-09, and the recent ones are all green. The newest run's own output:

```
watcher dormant: GMAIL_WATCH_APP_PASSWORD secret not set (honest no-op)
```

Sampled across the whole span — 2026-08-25, 2026-09-25, 2026-10-27 — **every** sampled run
printed that line. **77 days, 480 green runs, zero mail ever read.** The automated Gmail door has
never once opened. Every lesson built from a forward got there because a session queried Gmail
through the connector by hand.

A green run that laboured on nothing is the shape this repository refuses, and DR-1355 said so —
but the fix landed only in the *label* workflow. The *watcher* still exits 0, and the honest
reason it does is sound: it is scheduled, and 480 red runs is noise, not a witness. That is a
real design question, not an oversight, and it has an answer already in the house (below).

## The Ways check, run before asking him for anything

DR-1159 is explicit that a paste handed for a value the house already holds is a Ways finding and
not a delivery. So before naming this as his:

- Two Gmail app-password secrets are referenced in the workflows: `GMAIL_WATCH_APP_PASSWORD`
  (watch + label) and `SMTP_APP_PASSWORD` (`nas-email-door.yml`). One Google App Password works
  for both SMTP and IMAP, so if the house held either, the dark lane would be a **wiring** fix I
  could make myself.
- `GMAIL_WATCH_APP_PASSWORD` is **definitively not set** — the workflows test it and say so.
- `SMTP_APP_PASSWORD` **could not be determined**, and I am saying so rather than assuming. The
  secrets API is blocked through this proxy (403, by policy). `nas-email-door.yml` prints exactly
  that fact — but its gate checks `TS_AUTHKEY` and `NAS_SSH_KEY` *first* and exits before
  reaching it, so with the tailnet key dead the answer is unreachable. Its five runs all failed
  on 2026-09-16 and tell us nothing about the mail password.

**That gate ordering is itself the finding:** an independent fact is hidden behind an unrelated
dead dependency. In `verify` mode the mail-password presence does not depend on the tailnet at
all, so it should be reported before the tailnet gate. That is a small reorder of a workflow that
already prints the line, so it discloses nothing new.

## What is his, and what is mine

**His, and only his:** a Google App Password (<https://myaccount.google.com/apppasswords>),
pasted at Settings → Secrets and variables → Actions. Set it as **`GMAIL_WATCH_APP_PASSWORD`**
and both the watcher and the label road wake up on the next dispatch. The same 16 characters also
serve `SMTP_APP_PASSWORD` for the email door. This is the one value the box cannot mint itself.

**Mine, and DONE in this change (DR-1384), not waiting on him:**

1. `nas-email-door.yml` now reports `SMTP_APP_PASSWORD` presence **before** the tailnet gate, so
   the house can answer the question above by itself on any dispatch, with the tailnet dead.
   Presence only — `secrets.X != ''` yields the literal `true`/`false`, so there is no secret text
   for masking to reach, which is the distinction P63 draws.
2. The dormant watcher now emits a `::warning::` and a step summary naming what the dormancy
   costs and the one value that ends it. **It still exits 0, on purpose:** the label lane is
   dispatch-only with a required input, so dormancy there means work was asked for and not done
   and failing is right; this lane is *scheduled*, and 480 red runs is noise — a witness nobody
   can bear to look at is no witness either.

**Named as the WEAK fix, because it is.** The strong one is already in the house:
`site-health.yml` files each failing observation on a rolling `incident`-labelled issue (DR-0125),
a queryable ledger that renders on the OpsBoard, so "the door has been shut for 77 days" becomes a
number someone reads rather than a line in log 480. That needs `issues: write` on this workflow
and a de-duplicating key. `re-review: 2026-11-24`.

**And P61 is the real cost, stated so nobody has to discover it again.** A standing lane must not
depend on one chat connector. While this is dormant, the only road that moves lesson mail is a
session querying Gmail through its connector by hand — precisely the dependency P61 forbids for a
standing lane. The lane is not merely quiet; it is being **carried by hand**, and has been for 77
days.

**Still open, and not fixed here:** until the lock can be written the queue keeps over-reporting,
and the brake is the repo-side witness. It worked today. `re-review: 2026-11-17` — if the lock is
still unset then, the cross-reference belongs in a script the next builder runs rather than a pass
someone has to remember.
