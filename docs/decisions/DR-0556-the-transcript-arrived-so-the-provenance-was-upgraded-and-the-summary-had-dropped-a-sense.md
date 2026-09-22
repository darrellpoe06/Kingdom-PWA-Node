# DR-0556 — The transcript arrived, so the provenance was upgraded — and the summary had dropped a sense

- **Status:** accepted
- **Tier:** B
- **Type:** word
- **Date:** 2026-09-22
- **Scope:** `docs/99-session-notes/sources/denis-noble-misled-about-biology/` (the fetched transcript + captions land in the repo); `app/src/lib/world-issues-class.js` (issue 17's `source.note` upgraded; five senses corrected in five places; the finite-monkeys attribution sharpened; the reflection prompt pointed at Psalms 115:6); `app/src/__tests__/wi17-provenance-is-the-transcript-not-the-summary.test.js` (15 checks, new)
- **Principles:** VERIFICATION-DOCTRINE (DR-0076), WORD-FIRST, SPEAK-ESTABLISHED-FACT (DR-0100), PERPETUAL-IMPROVEMENT (DR-0075), REVIEW-OUR-WAYS (DR-0108), DECISION-RECORDS (DR-0011)
- **Grounds:** DR-0555 (issue 17, shipped on summary provenance and carrying `re-review: 2026-10-20` for exactly this day), the `source-transcript-nas.yml` lane (built 2026-09-22 after the CI route was blocked), DR-0108 (the whole team's reach — the NAS has the residential IP this sandbox does not)

---

## What happened

DR-0555 shipped World Issues issue 17 from six summary blocks Darrell pasted, because `youtube.com` is blocked to this sandbox **and** to CI. Its own Limits section named the gap and dated it: `re-review: 2026-10-20`, for the day a transcript existed.

That day came 28 days early. `source-transcript-nas.yml` ran green on 2026-09-22 (run 2) and committed **9,927 words** of auto-generated captions, fetched from the NAS's residential IP, which YouTube does not challenge the way it challenges a datacenter IP. Re-checking the lesson against the speaker's own words **held every attributed position** — the summary was faithful — and corrected two places where it was thinner than he was.

## The correction that matters

**The summary dropped a sense, and it was the one carrying the most weight.**

It said silicon "cannot see, feel, hear, or touch" — four. The transcript has Noble asking **five**, as five questions: *can it see? … feel? … hear? … touch? … smell?* Each answered No.

The dropped sense is **smell**. And smell is precisely what Psalms 115:6 denies an idol: `They have ears, but they hear not: noses have they, but they smell not:`. So the summary had quietly removed the tightest point of contact between the claim and the Psalm this lesson is built on. Noble asks as interrogation what the Word had already stated as fact, and the overlap on see / hear / smell / touch is item-for-item.

That is why this is a provenance record and not a typo fix. A faithful summary can still cost a lesson its sharpest edge, and only the primary source shows which edge.

**The monkeys attribution is sharpened.** The summary framed the calculation loosely. The transcript has him naming the **finite** monkeys theorem, published by two mathematicians about three years before the conversation, and citing it *against* the 19th-century assumption that pure chance plus enough time would produce anything. So it is an argument he invokes, not one he advances — which the lesson now says, keeping the Tier-2 handling honest. Its objection row (`f-finite-monkeys-objection`) stays: selection is not a pure random search, and the lesson says so in the same breath.

**And the disagreement is collegial, from his own mouth.** He calls Dawkins *my friend*. The lesson records it, because a lesson that lets a reader imagine hostility has misreported the room.

## What was deliberately NOT taken from the transcript

The transcript carries an anecdote about Dawkins and an AI chat system. It is not in the lesson, and that is a judgment, not an oversight: it is a claim about a living man held only in auto-generated captions of another man's account, and using it would score a point at his expense. It fails the grace note and DR-0076 in the same move. The substantive content — the five senses — is what the lesson keeps.

## Verification

- **15 new checks**, and they caught two places the by-hand pass missed (the deep-lens `deepSource` and the teen band still read four senses). That is the gate doing the job rather than decorating it.
- **Proven to catch (DR-0076 §3):** reverting one senses list to the summary's four, and replacing the transcript's path in `source.note` with a vague "the repo", fails **2 of 15**; both restored → 15/15.
- The transcript's existence is asserted against the filesystem, not trusted: the note names a path, and a test opens that path, checks it exceeds 20,000 characters, and matches its first sentence. A note may not claim a file that is absent.
- Audit gate on issue 17: `{"ok":true,"violations":[],"errors":[],"warnings":[]}`. Verse gate + class + quotation-integrity: 110/110. ESLint clean. `scripture-inference-guard: clean — 10 files scanned, 2 registered tension(s) enforced.`

## Limits, stated

1. **These are AUTO-GENERATED captions — a machine's hearing.** They carry `>>` speaker markers, `[music]` and `[laughter]`. They establish a position; they are **not** a warrant for putting any living man's sentence inside quotation marks. The lesson still quotes no living man from the recording. `re-review: 2026-11-22` — if a human-corrected transcript or an official one appears, verbatim quotation becomes available and the lesson can be tightened again.
2. **No timestamps on this route.** The fetcher joins the caption segments, so a position can be attributed to the speaker but not cited to a minute mark. The VTT route preserves timestamps but is IP-blocked from CI. `re-review: 2026-10-22` — if the NAS route is extended to write VTT, citations get their minute marks.
3. **The recording still has not been watched**, and the lesson says so. A transcript is not the room; tone, emphasis and what a laugh meant are not in it.
4. **This upgrade closes DR-0555's `re-review: 2026-10-20`** early. Its other dated item — the missing `youth` band, a catalog-wide gap across all World Issues issues rather than anything this lesson introduced — is untouched and keeps `re-review: 2026-11-22`.
