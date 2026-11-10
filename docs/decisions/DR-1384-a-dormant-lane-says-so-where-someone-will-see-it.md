# DR-1384 — A dormant lane says so where someone will see it

**Date:** 2026-11-10
**Status:** Decided
**Narrative:** [2026-11-10 — The lesson lane was never awake](../99-session-notes/2026-11-10-the-lesson-lane-was-never-awake.md)
**Relations:** finishes what DR-1355 began (a run that labours on nothing) · borrows DR-0125's shape · DR-1159 / DR-0108 (the Ways order) · LESSONS P61, P63 · DR-0621

## Context

The documented Gmail intake query returned **39 uncaptured threads**; nine of
the first thirty already had shipped lessons — it over-reports toward re-work.

## What was measured

The `Lesson-Captured` lock has **never been set on any thread**: its road ran
twice, once green having labelled nothing (the dormant-exits-0 bug DR-1355
fixed) and once red saying `GMAIL_WATCH_APP_PASSWORD is not set`. The watcher is
that fault at scale — **480 runs, 2026-08-25 to 2026-11-09**, recent ones green,
every run sampled printing `watcher dormant: ... (honest no-op)`. **77 days of
green runs that read no mail**, found only by opening the raw log of run 480.
DR-1355 named the shape, *"a witness that cannot fail loudly"*, and fixed only
the label lane.

**The Ways check ran before this was called his** (DR-1159): one App Password
serves both SMTP and IMAP, so it could have been a wiring fix.
`GMAIL_WATCH_APP_PASSWORD` is definitively unset; `SMTP_APP_PASSWORD` **could not
be determined** — the one workflow printing that fact checks `TS_AUTHKEY` first
and exits, hiding an independent fact behind a dead dependency.

## Decision

1. **`nas-email-door.yml` reports mail-password presence before the tailnet
   gate.** Presence only: `secrets.X != ''` yields a literal `true`/`false`, so
   no secret text exists for masking to reach — the distinction P63 draws.
2. **The dormant watcher gets a voice:** a `::warning::` and a step summary
   naming the cost and the one value that ends it. **It still exits 0,** which is
   not the same mistake twice — the label lane is dispatch-only with a required
   input, so dormancy there means work was asked for and not done; this lane is
   *scheduled*, where 480 reds is noise, and a witness nobody can bear to look
   at is no witness either.

**Stated as the weak fix.** The strong one is DR-0125's: file each observation on
a rolling `incident`-labelled issue, queryable and on the OpsBoard; needs
`issues: write` and a de-duplicating key. `re-review: 2026-11-24`.

**The cost named, not discovered later (P61):** while dormant, the only road
moving lesson mail is a session querying Gmail by hand — the exact dependency
P61 forbids a standing lane. It is not quiet; it is carried by hand. **His, and
only his:** a Google App Password as `GMAIL_WATCH_APP_PASSWORD`.

## Verification

Both files parse as YAML and the watcher's embedded python parses with `ast` (95
lines) — the dormant branch is the one path reachable without the secret, so a
syntax error there would stay invisible until the next scheduled run. The ceiling
is raised to the **measured** 22722 with its reason; register regenerated, 97
workflows, ceiling met exactly. The new behaviour cannot be proven green here —
the secret's absence IS the condition under test — so what is proven is that the
dormant path runs and says so; the first scheduled run after merge is the live
witness.
