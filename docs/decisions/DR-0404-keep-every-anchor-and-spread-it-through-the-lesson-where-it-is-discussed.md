# DR-0404 — Keep every anchor, and spread it through the lesson where it is discussed

- **Date:** 2026-09-14
- **Numbering:** minted as DR-0403 on this branch; #1584 (sov17) merged first with DR-0403 and keeps it, so this record is DR-0404 per DR-0052.
- **Status:** accepted
- **Tier:** B (lesson content on the surface people read; a data change to 11 lessons + a corpus gate; no schema, no money)
- **Type:** word
- **Scope:** `app/src/lib/living-lessons-class.js` (L141–L152: **396** references named beside their own quotation — in the lesson body, the three age bands, the big idea, the anchor theme and the benefits — **25** short labels extended to the range they quote, **3** apostrophe corruptions repaired), `app/src/__tests__/every-anchor-is-named-in-the-lesson.test.js`
- **Pairs with:** DR-0402 (the Word in the sentence), DR-0391 (a list is not a sentence), DR-0340/0341 (the Word opens in place), SCRIPTURE-REFERENCE-STANDARD §The Citation Pattern, DR-0076 §3 (proven-to-catch), DR-0250 (machinery over memory)
- **Principles:** APP-IS-PRIMARY, VERIFICATION-DOCTRINE, MACHINERY-OVER-MEMORY, REALITY-TRACE, PERPETUAL-IMPROVEMENT, DECISION-RECORDS

## The directive, in his words and in order

> "Keep all anchors just spread out in the lessons!!!!! Why don't you understand that!??!!!!!!"
> "Just sit where they were discussed!!!"
> "Was not ever in need of a list until we tried to fix it!!!!!"
> "Review last month's lessons for structure obviously!!!!" · "Lessons before 140!!!!!" · "Living Lessons was the main format"
> "Stop fake find and fixing quickly without context!!!! Be sure and rigorous!!!!!"

And, on the two halves of the measured gap: *"241 references … the reference just needs to sit beside its own quote. Mechanical, no words of yours change. — Yes!!!!!"* and *"305 references … writing 305 verses into 11 lessons — authoring, not wiring. — Exactly!!!!!! And they should be like they were!!!!!!!!!!"*

## What the building was, measured — not recalled

Every lesson L1–L139 (through 2026-09-09) shares one shape: **an anchor of 1–4 references; a body that names its references beside the quote** (L133 quoted 66 / named 65 · L135 58 / 59 · L139 210 / 211 · L140 273 / 266); every anchor discussed in the prose; three levels; benefits. That is the Living Lessons format, and it held for 139 lessons across two months with **no gate behind it** — the earlier author copied the neighbouring lessons.

**L141 (2026-09-12) broke it in one step:** quoted 57, named **0**, anchor **12**. L146 67 anchors, L149 80, L151 The Tongue **220** — with the body naming none. Across L141–L152: **591 anchor references — 43 named, 241 quoted but never named, 305 neither quoted nor named.** On 2026-08-14 the largest anchor in the corpus was 4. The list was never in the lessons; it was put there, and then DR-0391 (the voice collapse), DR-0392 (the list moved to the end) and #1578 (the chips) built machinery around a problem that did not exist on the 11th.

## Why the build let it happen — the Way, not the data

- **Gated:** every double-quoted span is verbatim KJV (`living-lessons-l*-verses.test.js`, 52 files); the anchor **list** contains the refs (`anchor.ref).toContain(ref)`, 42 files).
- **Never gated:** that a reference is **named in the body** beside its quote. **Zero** of 52 verse tests assert it.
- **What changed on 09-12:** the process became "spoken teaching → lesson" measured by the gated number. The 09-13 records report their proof as *"130 double-quoted spans, every one verbatim"*, *"109"*, *"147"*, *"152"*. The gated metric climbed; the ungated one went to zero; the anchor list absorbed what the sentences dropped. **We built to the gate we had.** Same class as seven of the month's twelve incidents: green instruments, broken thing.
- **And a quote that closes early passes the verbatim gate**, because it checks *substring*. Three apostrophes in L141 had become closing quotes — `man" foes` (Matthew 10:36), `Christ" sake` ×2 (Ephesians 4:32) — corrupted Scripture, green on every gate. Found only because the naming pass looked for where each quote *ends*.

## Decisions

1. **Every anchor is kept. None is trimmed.** The anchor is not a list to shorten; it is the set of verses the lesson stands on, and each one belongs in the teaching where it is discussed.
2. **A quoted verse carries its reference beside its own quote**, in the form the on-shape lessons use — measured: `"…verse…" (Book c:v)` 1,551 times in L121–L140 versus 598 reference-first and 0 bare. **396 references** were named this way across 12 lessons and every field a lesson teaches from (body, child/teen/senior bands, big idea, anchor theme, benefits); **not one word of prose changed** — proven by stripping every label and normalising quote marks and apostrophes from the before and after of all 151 lessons and diffing field by field: the only two differences are the two restored `’s` below. Eight labels the provenance audit then flagged — a quote that begins a verse earlier than the anchor verse found inside it (Ephesians 4:31-32 labelled 4:32) — were recomputed to the exact KJV range that contains the span. Where a quote already carried a label for an earlier verse of the same run, the label was **extended to the range** (25 cases: `(Exodus 20:3)` → `(Exodus 20:3-5)`), never duplicated. Where L151's bands carry a whole verse verbatim with **no quotation marks at all**, the reference was placed at the end of the verse text; 30 fragments quoted without marks were left alone and are counted as owed.
3. **The 180 references that are neither quoted nor named are OWED, by name and by count** (`OWED` in the gate, measured after the naming pass with the bands and benefits counted honestly — the first estimate of 305 counted only the body): L151 61 · L149 30 · L146 26 · L147 23 · L148 15 · L150 13 · L145 11 · L141 1; L142, L143 and L144 owe nothing. Two **original** lessons carry a pre-existing gap of the same kind and are recorded rather than exempted: L54 (2), L81 (1). "Like they were" means each verse written *into* the teaching, verbatim and in context — authoring, done **one lesson at a time for Darrell to test**, never eleven at once. The gate lets each count only fall and fails if the record is not lowered in the same commit.
4. **Three gates, proven-to-catch:** (a) a KJV verse quoted from the anchor and not named → fails by lesson and reference (run against the pre-write corpus: 241 failures); (b) any anchor unnamed beyond the owed count → fails, and an owed count that has FALLEN and not been lowered in the record → also fails (run against the pre-write corpus: 11 lessons); (c) a `"` that restores to a KJV `'s` → fails (run against the pre-repair corpus: 3 hits in L141; the detector's self-check against the exact L141 shape is a test).
5. **The apostrophe corruptions are repaired with the curly `’` the hosted KJV uses** (`man’s foes`, `Christ’s sake` ×2) — the verse gate rejected a straight `'`, which is how the true shape of the corruption (`’` → `"`, a smart-quote mis-mapping) was established rather than assumed. The misplaced closing marks were moved to the end of each verse by hand, and `(Ephesians 4:32)` named beside the one that had no label. Measured corpus-wide with the KJV as the oracle: those three were the only ones in 151 lessons.

## The 09-13 records, re-read

DR-0380, DR-0388, DR-0389, DR-0390 each prove *verbatim*; none states an anchor size or that a reference is named. They were true and incomplete, and the gap they share is the gap this record's gate closes. DR-0392 finding 5 (the list moved to the end) is already superseded for the reading view by DR-0402; this record removes the *reason* for it — a lesson whose anchors are all in the prose has no list to move.

## Amendment 2026-09-14 (late evening) — L151 authored: 61 → 0

The first lesson owed was the worst one and the one on his screen. All 61 of L151's owed anchors are now inside the teaching where each is discussed: 12 were already present as unlabelled fragments and received their reference (Matthew 12:34, Numbers 1:46, Judges 12:6, Proverbs 6:17, 6:19, Malachi 2:15, 2 Chronicles 30:10, 1 Kings 19:7, Matthew 26:41 among them); 49 were written in — each as the verbatim KJV pulled from the corpus at write time, never typed, with one short framing clause in the lesson's own register (e.g. *"Isaiah, shown the King, confessed the mouth before anything else: "Woe is me! …" (Isaiah 6:5)"*; the Elijah sentence now carries 1 Kings 19:4–8 in full; the seven abominations carry Proverbs 6:16–19). 29 insertion points, each anchored on a unique existing sentence; body 19,951 → 28,929 characters. Gates: L151's verse gate green on every span, the provenance ratchet green, reading-level unchanged (bands untouched), the naming gate lowered to 0 for L151 by its own measurement. **Owed now: 119** (L149 30 · L146 26 · L147 23 · L148 15 · L150 13 · L145 11 · L141 1) + 3 pre-existing. Next: L149, after Darrell's live look at L151.

## Verification

- Detector validated before use: L1 reads "2 named"; strip its names → "2 neither". The corruption detector reads the exact L141 text as a hit, and the whole-corpus scan returns exactly those 3.
- After the write: of 591 anchor references in L141–L152, named 43 → **406**; quoted-but-unnamed 241 → **0** in every field (range-aware: one verse cited beside a two-verse quote names it, which is the originals' own practice); neither → **180**, owed and dated; corruptions 3 → 0. Lint clean; the 12 per-lesson verse gates (L141's 39/39 after the repair), the reading-band gates, the adversary-case gate and the new naming gate (7/7) green on the written corpus.
- The diff is reviewable line by line: every `+` is an appended `(Ref)`, an extended label, or `'s` restored.

## Limits, stated

- **119 verses are still owed** (L151 done, see amendment) (plus 3 pre-existing in L54/L81), and this record does not pretend otherwise. First lesson for the live test: **L151 The Tongue** (93 owed, the worst, and the one on his screen). **re-review: 2026-09-16** — L151 authored and seen live, or a why.
- The audit's "quoted" test matches the first 40 characters of a verse; a lesson that paraphrases rather than quotes reads as "neither", correctly — paraphrase is not the Word.
- The gate reads the hosted KJV from disk in the test; it cannot run without `app/public/bible/kjv/`, and says so rather than passing.
