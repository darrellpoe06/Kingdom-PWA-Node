# DR-1532: What the trust could not keep (L319)

**Date:** 2026-11-18
**Status:** Accepted
**Tier:** A (one Living Lesson in its own file; no schema, no shared line touched)
**Type:** decision
**Area:** `app/src/lib/living-lessons/ll319-what-the-trust-could-not-keep.js`, its gate test
**Sent in by:** Darrell, 2026-11-18, a news summary under one word, Lesson, pasted into a Claude Code build session (not the Gmail intake)
**Pairs with:** DR-0100 (speak established fact, tiered), DR-0076 (verify; name what was not read), DR-0098 (teach the Word, do not debate it), DR-0210 (Yahweh in our voice), DR-0331 (render, never quote, his words and anyone's), DR-1477 (the shared gate), DR-0611 (a sent teaching is build input), DR-1495 (L316, the money lesson it stands beside)

## Context

The summary relays Barron's reading of SEC Form 4 filings: two ten-year
grantor retained annuity trusts that Jensen Huang and his wife funded in March
2016 ended on 2026-03-18 and delivered 58,962,602 Nvidia shares into the Huang
Irrevocable Remainder Trust, reported at more than $10.5 billion, none sold. On
2026-11-12 he resigned as Nvidia's chief executive after reports of affairs
outside his marriage. One life, two plans: the money plan held to the day; the
heart plan, as far as the record shows, was never written. That is a money and
heart teaching, so it is a Living Lesson beside L316, not a Sovereign A.I. week.

## What was measured

- **Not already built.** `scripts/lesson-already-built.mjs` returned WEAK (terms
  only); no lesson, record or branch carries this teaching.
- **The events are real, and current.** Search summaries of NBC News, NPR, PBS,
  Fox Business and 24/7 Wall St confirm the 2026-11-12 resignation, his public
  statement that he made serious mistakes in his personal life, the board's
  refusal to reinstate him, and an ongoing investigation. Search summaries of
  Yahoo Finance, The Standard, BigGo Finance and a relay of the Form 4 confirm
  the trust dates, the 29,481,301 shares per trust, the 58,962,602 total, the
  roughly $51 million at funding, the reported 22,161% growth and no sale.
- **Not read directly.** npr.org and pasqualepillitteri.it refused (host not in
  the session's network allowlist); the Form 4 and the Barron's article were not
  opened. Named in `UNCHECKED`, `re-review: 2026-12-18`.
- **One forwarded figure did not hold.** No source confirmed the $181.93 per-share
  price in the summary; the lesson does not use it.
- **131 quotations, all filled from `app/public/bible/kjv`** by `fill-verses.mjs`.
  None typed by hand.

## Decision

1. **Honour the plan, then teach what it could not keep.** Long-range planning for
   heirs is taught as wisdom (Proverbs 13:22; 22:3; Luke 14:28); the turn is that
   a trust holds shares and cannot hold a heart (Proverbs 22:1; 4:23; Matthew
   16:26; Psalms 127:1).
2. **Tiered.** The figures are stated as reported, with the filings named; how a
   GRAT works is stated plainly as law; his admission is rendered, not quoted.
3. **The unproven accusation is left out.** The reported espionage allegation is
   under investigation and is not the teaching; carrying it would be raising a
   report (Exodus 23:1). The children are not named: the filings do not name the
   beneficiaries. Both are gated.
4. **No gloating.** The adult lesson and every band carry Proverbs 24:17 and
   Galatians 6:1, and close with David's road back (2 Samuel 12:7; Psalms 51).
5. **Not advice.** The lesson and the in-app card both say it is not financial,
   tax or legal advice; no text recommends a trust or a trade.

## Impact

L319 joins the Living Lessons catalog on 2026-11-18 by auto-discovery (no
catalog line edited). Readers meet the Word on legacy, a good name and a fallen
leader without a forecast, a recommendation, or an unproven charge.

## Verification

- `living-lessons-ll319-what-the-trust-could-not-keep.test.js`: **15 of 15** —
  the shared gate (spine of seven spans in the lesson and all four bands,
  quotations corpus-verbatim, Yahweh in our voice, three talk-together
  directions per place, band shares 0.59 / 0.62 / 0.61 / 0.64, overlap at most
  0.06, ladder child 1.4 < youth 3.5 < teen 4.8 < senior 8.6, two parables, ten
  questions, dated `UNCHECKED`) and five lesson-specific dangers, each proven to
  catch a planted defect.
- **Caught, not claimed:** the first run failed the teen band for a missing
  parents-to-children direction (the word teenager is not in that vocabulary);
  fixed to son or daughter and re-run.

`re-review: 2026-12-18` — open the Form 4 and the Barron's article if the network
allows, and update the lesson if the board investigation reports.
