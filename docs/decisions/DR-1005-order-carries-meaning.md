---
id: DR-1005
title: Order carries meaning — sov39, and the adversary's method is rearrangement, not invention
date: 2026-10-13
status: accepted
supersedes: []
superseded-by: null
amends: []
tier: B
entities: [poetech]
grounds: [WORD-FIRST, TEACH-NOT-DEBATE, SPEAK-ESTABLISHED-FACT, VERIFICATION-DOCTRINE, SPOKEN-TEACHINGS-ARE-BUILD-INPUT]
source: 2026-10-13 — Darrell forwarded a ByteByteGo article into the lesson lane with one word on it, "Lesson"
---

## Context

Darrell forwarded a ByteByteGo article on 2026-10-13 at 17:54 UTC with one word
written on it: **"Lesson."** Under the DR-0312 email lane that one word is the
whole instruction. The duplicate check ran first (DR-0610, one teaching one
lesson): `Fourier`, `positional encoding`, `sine and cosine`, `RoPE` and
`Rotary` appear in no lesson catalog and no decision record. Placed in
**Sovereign A.I.** as **sov39** — the subject is how a model is given word
order, and what Scripture says about order.

**What the source is, said first, because it governs the handling — and it is
NOT what sov38's was.** This one is an honest technical exposition. It prints
its own disclaimer, enumerates nine references, and volunteers its own limits
unprompted: it states outright that computing a position encoding for position
one million establishes nothing about a model's ability to read a document that
long. It carries one sponsored block, labelled as sponsored and unrelated to the
argument, which the lesson discards while keeping the exposition entire. Under
DR-0100 tier 1 that distinction is load-bearing in both directions: sov38's
source was an advertisement and the lesson said so, and this one is not, so the
lesson says THAT plainly rather than hedging a true thing into the language of
opinion. Under-claiming a verified truth fails truth exactly as over-claiming an
unverified one does.

**The teaching the Word supplies, which the article does not reach.** The
article's own example is three words long — Alice trusts Bob, Bob trusts Alice —
identical vocabulary asserting opposite relationships. Scripture settled order
long before, and as instruction rather than tidiness, with its reason stated:
*"Let all things be done decently and in order."* (1 Corinthians 14:40) beside
*"For God is not the author of confusion, but of peace, as in all churches of the
saints."* (1 Corinthians 14:33). It is assigned rather than emergent — *"But now
hath God set the members every one of them in the body, as it hath pleased
him."* (1 Corinthians 12:18) — and enumerated where it must be unmistakable:
first apostles, secondarily prophets, thirdly teachers (1 Corinthians 12:28).

**And then the centre, which is DR-0098 caught in the act.** When the adversary
tempted Jesus his instrument was Scripture. Matthew 4:6 quotes the Psalms
accurately and excises the clause *"to keep thee in all thy ways"* from
Psalms 91:11, splicing verse 12 over the seam so it does not show. Every
surviving word is genuine and verifiable. The lie was manufactured by
**rearrangement alone** — nothing invented, something relocated — and the
rearrangement turned a promise of Yahweh's keeping into an invitation to cast
himself down. Jesus answers neither by calling the verse false nor with an
argument of His own, but with more of the Word: *"It is written again."*
(Matthew 4:7) That is the method this platform exists to teach, and it is the
reason removing the deceiving argument is not a style preference.

## What was measured

Everything below is a measurement on the real artifact, not an estimate.

- **Every verse verbatim from the corpus on disk.** All 22 anchor references
  resolve against `app/public/bible/kjv`, and all 22 are actually quoted
  somewhere in the module — not merely listed. **131 `"quote" (Reference)`
  pairs** across the whole module match the corpus character for character.
- **One real drift, caught by that check before the first commit.** A draft of
  `bigIdea` attached `(Matthew 4:7)` to the four-word fragment `"It is written
  again"` as though it were the verse. The reference was right and the quoted
  span was not the verse it named. Quoted in full instead.
- **Bands, word-share of adult prose with quotations stripped** (`full-levels`,
  floors child 0.5 / youth, teen, senior 0.6): child **0.850**, youth **1.042**,
  teen **1.013**, senior **1.361**. Adult prose 1,671 words.
- **Reading level, our prose only** (`reading-level`): child **1.2**, youth
  **5.6**, teen **7.9**, senior **11.5** — not inverted, and child is under the
  5.0 new-lesson ceiling. The teen band first measured **9.2**, above the
  corpus teen p90 of 8.3; that is register inflation, so four paragraphs were
  rewritten in plainer words at the same coverage rather than letting the senior
  band chase it upward.
- **14 caps headings in all five places**, identical counts, and the
  `lessonShareText` round-trip reproduces the adult lesson word for word. No
  author numbering, which would set `hasExplicit` and disable the caps pass
  entirely (DR-0520).
- **One real gap found by the three-directions gate.** `placesMissingDirections`
  reported `parents` missing in all five places: the verb was "say"/"put" and
  the gate's parents-to-children pattern accepts ask/talk/discuss/read/share/
  sit/teach/listen. Changed to "read these two sentences to your children" in
  all five — a fix to the lesson, not a loosening of the gate.
- **Band coverage** rises 236 → **237** lessons carrying all four bands,
  regenerated from the real catalog by `course-band-baseline-write.mjs`.
- **Curriculum gates PASS** on the code: 50 courses, 804 lessons, 55,266
  verbatim spans.

## Impact

The Sovereign A.I. course gains a 39th week. The lesson teaches, from the Word,
that a quotation can be exact and false in its arrangement — which is the most
practically useful defence this course has carried, because it applies to a
sermon, an argument, a headline and a machine alike, and because its answer is
more of the Word rather than suspicion of it.

Three checks in `sovereign-ai-sov39-verses.test.js` exist because this lesson's
own subject makes them load-bearing: a lesson that teaches misquotation and then
misquotes anything would refute itself. The excision check asserts the clause is
absent from what the adversary quotes AND present in the Psalm beside it, in
every band, so the lesson cannot keep teaching a gap it stopped showing.

Two defects in my own checks were found by mutation and fixed rather than
recorded as passing:

1. The "carries the answer" check searched the whole text, which the Matthew 4:7
   quotation satisfies by itself — so it silently duplicated the verbatim check
   and proved nothing about whether the lesson TEACHES the answer. It now strips
   quotations first, the same `ourProseOnly` discipline the band gates use.
2. A first draft demanded the words "disclaimer" and "references" in every band
   and failed the child band for saying "it lists nine books and papers at the
   end" — the same fact in a nine-year-old's vocabulary, which is the entire
   point of having bands. A check that forces adult words into the child band
   measures the wrong thing; it now asserts the substance per band and keeps the
   technical words pinned on the adult lesson only.

## Decision

sov39 ships in the Sovereign A.I. course with all four age bands, 22 verses
verbatim, a 75-minute facilitator guide whose run of show parses into the
course's six-segment flow, six discussion prompts each opening on a pinned
verse, and a five-question quiz. Its own suite pins the verses, the excision,
the honest classification of the source, the section numbering and the guide's
wholeness, and every new check is proven to catch.

The source being honest is stated in the lesson as plainly as sov38 stated that
its source was not. That symmetry is the DR-0100 discipline, not politeness.

## Verification after merge

- 28 green on `sovereign-ai-sov39-verses.test.js`; 51 green with band coverage;
  119 green across sov37, sov38, the course suite, band coverage and main's
  cadence suite on the merged tree.
- Four mutations, each caught by the intended check and only that check:
  restoring the excised clause into the adversary's quotation (4 checks fail);
  stripping the answer from the child band's own prose while leaving the verse
  intact (the strengthened prose check fails); one character of drift in a
  quoted verse, Isaiah 28:10's closing colon (the 131-pair walk fails);
  misclassifying the source as an advertisement (both honesty checks fail).
- 20 repo gates OK, including `business-systems-guard` reporting the ledger
  whole with the pointer correct; `curriculum gates: PASS`; eslint clean.
- The deploy is proven on the exact merge SHA, and the site's own witness
  dispatched, before this record is called done (DR-0107 / DR-0125 / P62).
