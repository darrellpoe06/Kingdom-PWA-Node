# 2026-11-06 — the in-flight view has an age

Narrative for **[DR-1359](../decisions/DR-1359-the-in-flight-view-has-an-age-and-a-number-can-be-held-twice.md)**.

## How it surfaced

Three pull requests claimed DR-1355 inside one hour — #2565 (another session's ll284), #2566 (this session's dormant-road correction) and #2567 (this session's pm15 lesson, before it was moved to DR-1356). Two of the three were mine, which made it a coordination failure of mine rather than another session's fault: the intake Way says the coordinator assigns numbers up front, and I had briefed two concurrent builders to each run `claim-decision-number.mjs` and take whatever it reported lowest. Given what I had already worked out an hour earlier — that the lowest-free rule makes collisions deterministic rather than occasional — briefing two builders to each take the lowest free number was a guaranteed collision.

Clearing it meant asking the tool what was actually free. That is when the tool itself turned out to be the next finding.

## The measurement

Asked from a tree that had not fetched, it said:

```
in flight: 55 number(s) held by unlanded branches, 2 of them at or above DR-1355
  DR-1355 — origin/claude/a-dormant-road-is-not-a-road
  DR-1356 — origin/claude/pm15-forward-deployed-engineer
```

Two holders. At the same moment `gh api repos/darrellpoe06/Kingdom-PWA-Node/pulls/2565/files` listed `docs/decisions/DR-1355-the-proof-of-the-work-is-readable-inside-the-app-and-the-nas-initiates-every-road.md` — a third holder, pushed, on the server, and invisible here. One

```
git fetch origin 'refs/heads/claude/integrity-lesson-n55fvt:refs/remotes/origin/claude/integrity-lesson-n55fvt'
```

and the same scan saw it. The whole fault is that `refs/remotes/origin/` is a local cache and the tool spoke about it as though it were the server.

Then the second fault showed up underneath the first: once both branches were visible, the output still named one. `held` was a `Map` whose value was the first holder found, so the second was dropped. A session reading that row learns its number is taken; a session on the dropped branch learns nothing at all.

## Why this is the third door, not a new bug

The tool's own header already tells this story twice:

- **DR-1247** — asked from a branch cut days ago, it answered a number main had already landed. The TREE was stale.
- **DR-1249** — in a GitHub Actions checkout there is no `origin/main` ref, so the base read returned nothing and read as "main holds no records." The BASE was unreadable.
- **this one** — the remote-tracking VIEW is stale, and silence about its age reads as currency.

Three doors, one failure: *a read that was not actually made, reported as a clean result.* Which is DR-0076 §8 word for word, and the same rule DR-0125 set for site health — unknown freshness never reads as fresh.

## What it says now

```
next free decision number: DR-1357
  on disk:   1248 record(s), highest DR-1354
  on origin/main: 1248 record(s), highest DR-1354
  in-flight view: refreshed just now (newest branch pushed 6 minute(s) ago).
  in flight: 55 number(s) held by unlanded branches, 2 of them at or above DR-1355
    DR-1355 — origin/claude/integrity-lesson-n55fvt, origin/claude/a-dormant-road-is-not-a-road — HELD BY 2 BRANCHES, one of them must move
    DR-1356 — origin/claude/pm15-forward-deployed-engineer
```

and with the fetch blocked:

```
  in-flight view: UNVERIFIED — the fetch did not run (--no-fetch was passed), so this view is only as fresh
  as the last fetch (newest branch pushed 6 minute(s) ago). A branch pushed since then holds its number on
  the server and holds nothing here. Fetch and ask again before taking a number.
```

## Two things I did not do

**I did not make it refuse.** `onBase()` refuses an unreadable base and prints no number at all, and copying that here was tempting for symmetry. But the base read still works offline and in CI, so refusing would take away a correct landed-numbers answer in order to punish a missing network. Printing the number with the in-flight half marked UNVERIFIED keeps both truths: what is known, and what was not checked.

**I did not touch the convention.** `**Next ID:**` is still one shared line, the resolver still owns it (DR-0644), no past record moves, and the lowest-free rule is still what makes these collisions deterministic. That structural question is on #2566 with `re-review: 2026-11-13` and it is Darrell's to decide, not a tooling change to slip in underneath it. This tool only widens what a session can see before it takes a number.

## The cases

Every one is network-free, with the git runner injected. That is not a style preference: earlier in this same session a test of `format-guard`'s base-fetch called real git against a branch that did not exist, ran three deepen rounds and an unshallow, and had to be killed after minutes. A case that reaches the network is not a fast case that occasionally hangs — it is a different test than the one I wrote.

Proven to catch by deleting the freshness line from `main()`: 3 cases red, file restored byte-identical under `cmp`, 25 green.
