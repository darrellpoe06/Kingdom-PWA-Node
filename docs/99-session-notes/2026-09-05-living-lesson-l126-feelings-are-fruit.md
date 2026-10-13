# Living Lesson L126 — Feelings Are Fruit, Not Root

**Date:** 2026-09-05
**Branch:** `claude/spiritual-warfare-principalities-fs5op0`
**Module id:** `ll126-feelings-are-fruit-not-root-belief-the-renewed-mind-and-declarations-bounded-by-his-word`
**Harness:** `app/src/__tests__/living-lessons-l126-verses.test.js` (161 assertions)

## What Darrell brought

Nine messages on 2026-09-05, feeding in a second long-form conversation — a host
and a guest teacher on emotions, belief systems, identity, declarations, reasoning
with Yahweh, and honesty in prayer. Sent alongside the spiritual-warfare material
that became L125, so the two are companions: L125 is the outward doctrine of
warfare, L126 is the interior one.

Per *Spoken Teachings Are Build Input — Always Add It*, captured, verified, and
shipped the same session.

## What was built

One Living Lesson, 20 movements plus a close, on the shared Learn engine — so it
rides `lessonPresentable()` and is presentable in **Speaker View** at all four age
bands, same as L125.

The spine: feelings as fruit (2-4) → you are not your thoughts (5-6) → what are you
trying to prove (7) → identity by design (8) → the self-preservation reflex (9) →
rehearsal and written evidence (10) → **the declaration fence** (11-12) → the
sixty-day claim in tiers (13) → fear not shamed (14) → reasoning with Yahweh and
His own first question (15-16) → honesty and the cost of silence (17) →
spirit-to-spirit and substance (18) → need to honour (19) → the unity it is for (20).

## The judgment calls, and why

**Affirm plainly, fence narrowly.** The teacher's mechanism is unusually sound and
is affirmed *without hedging* — Scripture uses her own picture and uses it first
(Luke 6:43-45; Matthew 7:17-18), and Romans 15:13 welds belief to feeling in one
clause: joy and peace arrive **in believing**. Under-claiming a true thing is as
much a failure of truth as over-claiming a false one (DR-0100). Exactly **one**
element is fenced, and the lesson says so.

**The fence is drawn by grammar, not by suspicion.** Romans 4:17 is the verse the
declaration practice is usually built on, and its subject is Yahweh — *He* "calleth
those things which be not as though they were." It states what Abraham believed
*about Him*; it does not transfer the prerogative. What Abraham did is three verses
later: he believed "what he had promised" (Romans 4:21). Bounded by Isaiah 55:11
("that which I please"), 1 John 5:14 ("according to his will"), and James 4:13,15,
which names the unfenced version as presumption. The lesson **affirms speaking the
Word aloud first** (Joshua 1:8; Deuteronomy 6:7; Romans 10:17) so the room does not
discard the good along with the bounded, and hands the rule over as aim rather than
loss: *declare what He said, not what you want.*

**Faith and pretending differ by object, not by denial.** Romans 4:19 says Abraham
"considered not his own body now dead" — he did not deny the facts, he declined to
*weigh* them against a promise. That distinction is what keeps movement 12 from
becoming denial-as-doctrine.

**The sixty-day claim, in honest tiers (DR-0100 / DR-0076).** Stated plainly:
repetition really does move a response from effortful to automatic, and sustained
rehearsal over weeks is what makes it default. **Not** claimed: any round number as
a law — the lesson says outright that it is not attaching a study it has not
verified, and would rather say so than hand the reader "a number wearing a lab
coat." Scripture's own instruction is better because it does not expire: "day and
night" (Joshua 1:8; Psalm 1:2) and senses exercised "by reason of use"
(Hebrews 5:14).

**"Who told you that" is His own question, not a technique.** Genesis 3:11 — asked
for the *source* of a self-assessment, preceded by "Where art thou?" to a man
already in plain sight. Same habit in Genesis 16:8 and 1 Kings 19:9.

**Honesty is not irreverence — and it is not unaccountable either.** Psalm 32:3 puts
the cost of stuffing it in the bones; Psalm 62:8 says pour out; Psalm 13 opens in
accusation and closes in trust, both inspired; Gethsemane speaks the reluctance
*first* and the submission after, both sinless (Matthew 26:38-39). Job 42:7 settles
it: the man who said "How long" spoke rightly, his tidy friends did not. The
boundary is kept visible — Job 13:15 and Habakkuk 2:1 — say the true thing, then
stand for the reply.

**Fear is not shamed, and depression is not a demon to shout at.** Psalm 56:3 says
WHEN; Mark 9:24 holds both halves in one breath and the child is healed anyway;
Elijah got food and sleep before a word (1 Kings 19:7). The senior band carries three
named pastoral failure modes — the strainer, the performer, the declarer.

**The teacher is not named** (Titus 3:2; the L120/L125 precedent), enforced by a
privacy gate that asserts no surname, ministry, platform, or book title survives.

## Verification (DR-0076)

- **313 double-quoted spans, every one verbatim KJV** from the in-repo corpus,
  swept whole-span; 121 fragments additionally pinned to the specific verse they
  are attributed to.
- **Authored voice measured** (quoted Scripture stripped): bare "God" 0, "Satan" 0,
  "Lucifer" 0; "Yahweh" 41.
- **161 assertions pass** for L126; 184 for L125; the living-lessons + presentable
  suites (27 files, 1493 tests) pass.
- **A new duplicate-id gate** asserts every lesson id in the catalog is unique —
  added because this session found the id/label divergence noted in the L125 note.

### Proven-to-catch

The whole-span sweep caught **ten** real alterations in the first draft, all of one
family: **the author's own framing and emphasis wearing Scripture's quotation
marks.** Our phrases ("who told you that", "what are you trying to prove",
"question your reactions") read as citations, and three emphasis-quotes bent real
verses — "I shall YET praise him" capitalises a word the KJV has in lowercase, and
"what he had promised." / "by reason of use." append a full stop the verse does not
have mid-sentence. All ten are pinned in the test.

Two syntax defects were also caught before commit by `node --check`: an unescaped
apostrophe and a double-escaped one introduced by scripted insertion.

`npm run lint` could not run in this sandbox (`@eslint/js` not installed); the
component-test files (265 of them) cannot resolve `react` here either. Both gaps
are environmental and identical before and after this change; CI covers them.
