# 2026-11-06 — a closed list is not a broken gate

Narrative for **[DR-1368](../decisions/DR-1368-a-closed-vocabulary-list-is-friction-not-a-broken-gate.md)**.

## The report, and why I took it seriously

The spm12 builder finished and flagged a neighbour's gate it had not edited:

> `project-management-courses.test.js` refused my senior band although it names six real industry terms its regex cannot spell (*total cost of ownership, run rate, operational readiness, service-level objective, on-call rotation, capacity plan*) … that gate **passes on the phrase with no term present, and fails on six terms with no phrase**.

Both halves of that are true, and a gate that refuses correct content is worse than a missing one — it makes an author rewrite work that was right. So this went to the top of the queue, ahead of the next lesson.

## And then the measurement went against me twice

**First wrong idea: the gate is nearly vacuous.** Reading it, the spm alternation contains bare `incident` and `problem`, matched by `JSON.stringify(m)` against the whole module. That looked damning — "problem" appears in almost any prose. I measured instead of writing it down:

```
spm: 11 modules; pass ONLY via the bare words incident/problem: 0
```

Zero. Every spm module carries a genuine term from the specific part of the list. Had I shipped that sentence, it would have been a false accusation against someone else's gate, in a record.

**Second wrong idea: replace the list with a naming-phrase requirement.** Elegant — check the *form* of the claim rather than enumerate vocabulary, so new terms are never refused. Measured:

```
If the gate instead required a NAMING PHRASE:
  pm  without one: 1/14 -> pm8-the-plumbline
  spm without one: 6/11 -> spm2, spm4, spm5, spm6, spm7, spm8
```

Seven landed lessons refused. The fix would have been the same defect pointing the other way.

## So the answer is no, with a date

The gate is an OR. Both of the builder's observations are properties of an OR, and the half that refused it is the gate doing its job: the course's thesis is that every lesson names what the industry calls it, and the phrase is the cheap way to satisfy that. What is real is **friction** — a lesson with unlisted vocabulary must extend the list with a reason or use the phrase.

The builder already took the right path: it moved its prose into the course's own idiom, which is how its other eleven senior bands read. Nothing in the gate needed to change, and I changed nothing in it.

What this record buys is that the next builder meeting the same refusal reads the measurement instead of re-deriving it — and that if three more lessons hit it, the closedness of the list is what changes, not the lesson. `re-review: 2026-12-06`.

## The link probe, and the thirtyfold undercount

The builder's other finding was its own: its record cited DR-1364 in a Relations line, and `ls docs/decisions/DR-1364-*.md` finds nothing, because sov71 sits unmerged. Its words: *"the defect was in prose, which no gate reads, which is why it survived to a push."*

So I probed for broken links across every record and note. First pass:

```
1651 file(s), 43 relative .md link(s), 1 BROKEN
```

43 links across 1651 files is not plausible — every record I wrote today carries a Narrative link. The regex only matched `./` and `../`. Widened:

```
1651 file(s); link forms: {"bare":1264,"../":39,"./":4,"docs/":1}
```

**1307 links, not 43.** The dominant form is a bare filename, which the first probe could not see. Fourth time today a narrow read nearly became a published number; the figure in the record is 1307 because the probe was widened before it was believed.

Of four hits, two are external `https://…/README.md` URLs — the probe's own false positives, not breaks. The genuine two:

- `2026-10-17-ll255-all-things-work-together.md` → `...-ll254.md`, where the real file ends `-ll255.md`. One character. The note is about ll255 and DR-1094 is its record. **Fixed.**
- `2026-06-16-cutover-plan-vercel-to-cloudflare-pages.md` → `2026-06-16-research-review-off-vercel-hosting.md`, which **has never existed in any ref**. `git log --all --diff-filter=A` finds nothing. **Left standing and named.** No target was invented; a dangling reference to a document nobody wrote is a fact about this repository, and a plausible-looking substitute would be the worse outcome.

No link gate was built. 1307 links and one genuine break is a rate the measurement answers more cheaply than machinery, and that one break needs a document written, which no gate can do.
