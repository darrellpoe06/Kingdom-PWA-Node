# 2026-11-06 — the ledger unions itself

Narrative for **[DR-1369](../decisions/DR-1369-the-usage-ledger-unions-itself-and-has-one-serialization.md)**.

## What it cost before it was worth fixing

I resolved the same conflict set by hand five times in one afternoon, across
nine open branches. The third time I wrote a scratchpad script to do it; the
fifth time I understood that the script was the wrong place for it, because the
resolver the repo already has owns exactly this job and simply did not know
about the file.

DR-1347 is why the file is in every branch: it made a cost line mandatory on
every record. So the moment that rule landed, `ai-usage-ledger.json` became a
second INDEX.md — touched by everything, and therefore in conflict with
everything — without being added to the resolver that exists for that shape.

## The finding I did not expect

I opened the diff of the last landing expecting appends, and found fourteen
deletions. They were not `sessions` churn. They were **em-dashes**:

```
cbc07181aa 0 escapes · 95227a28bd 4 · f415316c47 0 · 7395ffb28a 0
09d800aa17 4 · 3a073d0c3d 0 · f80bf69dea 0 · eab90722c1 0
```

The file flips between `—` and `—` every other landing, and one entry's
`"wallClockHours": 1.0` had become `1` in the same pass. `--add` writes literal
UTF-8; a session hand-writing the JSON writes escapes, trying to be careful
about ASCII. Four flipping lines are enough to conflict the whole file when
both sides only appended one entry at the end.

So half of what I had been resolving by hand was not a merge problem. It was
two writers disagreeing, and the fix for it is not in the resolver at all — it
is a canonical-form check in the writer, which refuses anything but the one
serialization. That half of the tax is now gone at the source rather than
resolved forever.

## The case the resolver refuses, and why it must

The union keeps main's order and appends ours. It **refuses** when an id exists
on both sides with different content, and writes nothing.

That refusal is the whole reason this is safe to automate, and I know what it
costs to get it wrong, because I got it wrong in both directions in one day.
In the morning, taking main as the structural base silently dropped a
correction of mine to the `ll283` entry — the clause DR-1355 added to say an
earlier sentence was false. I restored it by hand. Twice. In the afternoon the
same note fired with the **opposite** correct answer: main had the correction
(it landed with #2569) and five branches held stale copies, so reflexively
restoring "ours" would have undone it.

Same wording, opposite right answer, hours apart. Neither side is reliably
right, which means no rule can pick, which means the only honest behaviour is
to stop and name the id. A resolver that guessed here would be fast and would
quietly delete true things.

## What licenses the union at all

DR-0644 made this same resolver REFUSE two INDEX rows that share a DR number,
and that was right: a DR number is a scarce claim, two decisions reaching for
0762 is a real collision, and keeping one deletes a decision. It would be easy
to read that as "the resolver refuses duplicates" and conclude the usage ledger
must be refused too.

It is the opposite. A usage entry is keyed by its **task id** — a slug of the
work — which two branches never pick by accident. The key is descriptive, not
scarce. That is the difference between a fold that loses a decision and a fold
that loses nothing, and it is the only argument that makes this change
legitimate rather than convenient.

## Proving it, and one false green on the way

Three defects restored, each one real history rather than an invented break:

```
fold a differing id silently (what my hand did twice)   -> 2 failed
canonicalFault accepts whatever is on disk (before)     -> 2 failed
RESOLVED_FILES without the usage ledger (the real pre-state) -> 2 failed, end to end
```

The second of those nearly went unproven. My first attempt to restore it used a
shell one-liner whose quoting silently failed, the suite reported **35 passed**,
and I almost wrote that down as proof. The grep for the defect marker printed
nothing, which is the only reason I caught it: the test had run against the
unmodified file. That is the fifth time today a read that did not happen came
back as a clean result, and the fourth time the thing that saved it was
checking the precondition rather than the outcome.

The end-to-end cases copy the real `ai-usage-ledger.mjs` and its rules into the
throwaway repo, so the validator that runs after the union is the real one, not
a stub.
