# DR-0337 — The porter was already in the text: a Labor Day lesson, and the two-track honesty rule for history beside Scripture

- **date:** 2026-09-08
- **status:** accepted
- **tier:** A (one Living Lesson + its gate; no schema, no money, no front-door identity)
- **decides:** how this series handles a lesson whose occasion is documented HISTORY rather than a sermon — and what the gate must assert when it does
- **pairs-with:** DR-0098 (teach the Word, do not debate it), DR-0100 (speak established fact — false skepticism is not discernment), DR-0076 (verify; proven-to-catch), DR-0210 (Yahweh in our voice, the KJV untouched inside quotes), DR-0190 (attribute, never assert on our own authority), DR-0331 (quote him for meaning, not his typos), CLAUDE.md "Spoken Teachings Are Build Input"

## The trigger

Darrell, 2026-09-08, one word — **"lesson."** — followed by a telling about the Pullman porters: men hired out of slavery to staff America's sleeping cars, addressed by passengers as **George**, the company owner's first name, because *"you didn't have to learn who they were."* Labor Day, the 1894 strike they were excluded from, the newspapers they carried south in their bags, the porter who bailed out Rosa Parks and phoned a young minister nobody had heard of.

## Decision 1 — The lesson is built on the Word the history happened to walk into

The occasion is history. **The lesson is Scripture**, and the join was not manufactured for effect — it was found in the text.

**The KJV word for the man at the door of the sheepfold is PORTER**, and the sentence it sits in is about the opposite of what a railway carriage did:

> "To him the porter openeth; and the sheep hear his voice: and he calleth his own sheep by name, and leadeth them out." (John 10:3)

The porter opens; the Shepherd who enters refuses to work in bulk. And in the house of Yahweh the porters are an **ordained Levitical office** — named in the permanent record ("And the porters were, Shallum, and Akkub, and Talmon, and Ahiman…", 1 Chronicles 9:17), two hundred and twelve of them, "whom David and Samuel the seer did ordain in their set office." (1 Chronicles 9:22), trusted with the treasury (1 Chronicles 9:26), given authority and the watch (Mark 13:34). A reigning king wanted the job (Psalms 84:10).

**The word a nation used to make men interchangeable is the word Yahweh uses for a named, ordained servant at His own gate.** That is the spine, and the gate asserts it: if the weld ever drifts out of the text, the lesson has become a history talk with verses attached.

The rest is the Word on its own terms: Yahweh names and is **never once recorded un-naming** (Genesis 17:5; Genesis 32:28; John 1:42; Isaiah 56:5; Revelation 2:17); a discarded slave woman is the person who names *Him*, and the name is about being **seen** (Genesis 16:13); He positions the overlooked on purpose (Genesis 39:2; 2 Kings 5:2-3; 1 Corinthians 1:27-28); the stone the **builders** refuse is the one He sets in the corner (Psalms 118:22); and He legislated the labourer's wage — same day, before sundown, *"for he is poor, and setteth his heart upon it"* (Deuteronomy 24:15) — millennia before any nation had a labour movement.

It ends on the Son who was looked away from (Isaiah 53:3), took the servant's form (Philippians 2:7), and was given **the Name above every name** (Philippians 2:9). **A worship lesson, not a grievance lesson**, and the gate asserts that too.

## Decision 2 — The two-track honesty rule, stated once and now gated

A lesson whose occasion is documented history carries **two different kinds of claim**, and conflating them is how a good lesson gets walked back later. So:

- **Scripture is fetched verbatim and checkable.** 198 quoted spans in this lesson, every one letter-for-letter KJV from the in-repo corpus, single-verse only. The allowlist of non-Scripture quoted spans is **EMPTY**: our own emphasis wears capitals, never quotation marks.
- **History states its own status.** Firmly established facts are stated **plainly and without hedging** — DR-0100 is explicit that under-claiming a truth is its own way of lying. Figures that are commonly cited ranges (the strike deaths, the size of the Great Migration) are **labelled as ranges** rather than borrowing Scripture's certainty.
- **A compression in the telling gets corrected in our prose, gently, with the reason.** The telling calls the Brotherhood of Sleeping Car Porters the first Black union ever chartered in America. The precise claim is narrower and still remarkable: the first Black-led union **chartered by the American Federation of Labor**, and the first to win a collective bargaining agreement with a major American corporation. Stated in the lesson as offered "the way you would want it offered to you" — because **accuracy makes the story harder to dismiss, not smaller** (DR-0331: quote him for meaning; DR-0100: precision is not hedging).
- **Provenance is named.** The Scripture was verified against the corpus in this session. The history is well-established knowledge, **not fetched** — the sandbox is egress-blocked — and the lesson says so in its own opening rather than implying both tracks were checked the same way (DR-0076 §8).

## Decision 3 — Both fences, because this material wounds when preached bare

The gate refuses drift in **either** direction, and each fence is a live assertion:

1. **Under-claiming is forbidden.** The Word sentences the man-stealer to death — "And he that stealeth a man, and selleth him, or if he be found in his hand, he shall surely be put to death." (Exodus 21:16) — and the apostolic writings keep the category by name, listing **menstealers** among things "contrary to sound doctrine" (1 Timothy 1:10). Softening that into a regrettable custom is the DR-0100 failure.
2. **Over-claiming is equally forbidden.** Providential placement never sanctifies the injury. Genesis 50:20 says the brothers **thought evil** *and* that Yahweh **meant it unto good** — two facts, not one. Collapsing them converts a comfort into a defence of the men who did it, and the guard sentence is gated.
3. **The edit is the tell.** Editions of Scripture were produced for enslaved readers with large portions removed. Had the text as written supported the institution, no editor would have needed a blade. Paired with the prohibition on cutting (Deuteronomy 4:2) and the standard of "all the counsel of God." (Acts 20:27) — and with the **restored** suppressed half: "Masters, give unto your servants that which is just and equal; knowing that ye also have a Master in heaven." (Colossians 4:1) The transferable discipline, worth more than the history: **when someone teaches you half a text, go find the other half.**
4. **No partisan contest is staged** (DR-0098). Naming documented history is required; recruiting the reader into a present-day political fight is not teaching, and the gate asserts the absence.

## Verification (DR-0076)

- **198 quoted spans, every one verbatim KJV**, read from `app/public/bible/kjv/` before a word of prose was written. Nothing from memory.
- **`living-lessons-l134-verses.test.js` — 31 tests**, with an **empty** `NOT_SCRIPTURE` allowlist.
- **Proven-to-catch against two real defects this authoring produced**, both re-introduced deliberately and each turning the suite red before being restored:
  1. **A shortened quotation.** The first draft wrote *"…for so had God commanded."* for 2 Chronicles 8:14. The verse reads *"…for so had David the man of God commanded."* Trimming a quotation so it reads better is editing Scripture, and the shortened form is not in the corpus at all. Suite went red on two assertions.
  2. **Six generic "God" in our authored voice** — a child-level paraphrase, one talking point and four quiz options (DR-0210). The check **strips quoted spans before it looks**, because DR-0210 governs our prose only; a check that did not strip would demand we corrupt the very text we are required to reproduce. Suite went red; all six corrected to Yahweh or to our own wording.
- **Typography:** zero generic "God" in our authored voice (82 × Yahweh); no capitalised adversary name; the KJV's "God" and "the LORD" verified **still present and untouched** inside quotations — the complement assertion, so a find-replace can never pass this gate.
- **Register measured, not claimed:** child **1.30** / teen **6.70** / adult **8.00** / senior **12.30**. Not inverted; child well under the 7.0 ceiling. The shrink-only baseline gained **no new offenders** (30 inverted / 17 over-ceiling unchanged; count 132 → 133).
- **Full suite green**, lint clean at `--max-warnings 0`, real `npm run build` clean.

## A numbering collision, recorded because it will recur

This lesson was authored as **L131** and shipped as **L134**. While it was being written, another session merged L131, L132 and L133 to `main`. Caught before pushing by fetching `main` and diffing the module ids — not by a gate. The in-repo lesson id is claimed **at merge, not at authoring time**, so concurrent lesson sessions will collide again. `re-review: 2026-09-15` — decide whether a lesson-id gate is worth building or whether the fetch-before-push habit is sufficient.

## Consequences

- The series has a worked example for the class of lesson whose occasion is documented history, and a stated rule for how the two kinds of claim are kept apart.
- The porter/`John 10:3` weld is now gated, so a later edit cannot quietly turn a Word-first lesson into a history talk.
- The DR-0210 typography check gains its complement — the KJV's own "God" must still be **present** inside quotations — which closes the loophole where a blind find-replace would have satisfied the original assertion.
