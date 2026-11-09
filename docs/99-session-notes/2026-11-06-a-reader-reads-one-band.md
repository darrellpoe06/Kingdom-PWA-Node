# 2026-11-06 — a reader reads one band

Narrative for **[DR-1367](../decisions/DR-1367-a-reader-reads-one-band-so-every-band-is-checked.md)**.

## This one came from a builder correcting itself

The sov71 builder had already reported its tree green. Then it came back:

> **Correction to my earlier report — CI found a real defect in my work that my own gate missed.** … The **senior band used the word `assay`** — the first entry in `HARD_TERMS`, and the very word Darrell hit on his phone that founded DR-0521. My DR-0521 case ran `termFaults` against `M.lesson` **only**, so my gate read green while the catalog-wide `the-plain-meaning-comes-first` gate caught it.

That is the report I want from a builder: not that it was green, but that it had claimed green and the claim was wrong. It fixed the prose rather than the registry, widened its own case, and named the generalisable lesson itself.

So the work here was not to find the fault. It was to ask the next question: **where else is this true?**

## The measurement, in three steps

**How many gates carry the narrow form?** 16 gates call `termFaults`; exactly **two** pass only the adult field — `sov69` and `sov70`. Small enough to fix in one sitting, which is why it was fixed in one sitting rather than dated.

**Are they actually leaking?** No. Probed before touching anything, across all six reader places of each lesson: **0 faults**. Their bands happen to be clean. That matters for honesty — this closes a latent hole, and the record says so rather than implying a defect was caught.

**Can the narrow form see a band defect at all?** This is the part worth doing properly instead of reasoning about. With `assay` planted into sov69's senior band in the real module file:

```
narrow form   ->  Tests  36 passed (36)        # misses it completely
widened form  ->  × ... senior: ["assay"]      # names the place
```

Both the module and the test were restored byte-identical under `cmp`. A gate that passes 36 cases while the word that founded its own governing decision sits in a band is not a gate, and that is a measurement rather than an argument.

## What was deliberately not done

Adding `assay` to `HARD_TERMS`, or recording a new fault in the plain-meaning baseline so the lesson passes. `plain-before-the-term.js` exists to prevent exactly that edit and says so in its own header. The sov71 builder refused it too and fixed its sentence instead — *"The fire puts the WORK itself to the test."* Two agents reaching the same refusal independently is the strongest sign the rule is carrying its weight.

And the original per-lesson case is kept rather than replaced. "The terms THIS lesson introduces are glossed at first use" is a different claim from the registry's, made about terms the registry cannot know, and it is worth keeping separately.

## The shape, for whoever reads this next

A per-lesson gate that checks one field does not fail to catch — it catches *elsewhere*, in a slower catalog-wide gate, where the miss shows up as a global debt number moving by one. The author who could fix it in ten seconds never sees it; the next person sees a baseline they did not move. DR-0795 reached this same conclusion for the TALK block for the same reason: **a reader reads one band, so a band is never a lesser copy of the adult field.**

Not claimed: that every lesson gate now checks every band. Thirteen other gates call `termFaults` and do not carry the narrow form, but what each one *does* check was not audited here. `re-review: 2026-12-06`.
