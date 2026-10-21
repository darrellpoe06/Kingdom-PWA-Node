# 2026-10-21 — Living Lesson ll257, "Ten Christmases Left"

**Module id:** `ll257-ten-christmases-left-counting-our-days-the-way-yahweh-counts-them` (`ll257`)
**Decision record:** DR-1159
**Source row:** `a6f86a58-684b-4d27-9550-0b5b7bbca4fb`

## What the source is

A **recorded street interview that Darrell captured inside the PoeTech app** on 2026-10-21. The
words reached the lesson intake as a **Whisper transcript** (DR-0611). It was not recorded on a
phone and sent in, and it is not a newsletter or an email — it is a conversation with a stranger,
captured in the app.

**The speakers are not identified.** The transcript marks the interviewer `S1` and the man
answering `S2` and `S3` — two labels, **one man**, split by the transcriber. It names the
interviewer "James" exactly once and never names the man answering. There are no `voice:BG` /
`voice:DP` tags (DR-0712), so this is **not Darrell teaching and not Bishop Gwin teaching**
(DR-0719). The lesson says so in its first paragraph and never guesses a voice.

**Every figure is a speaker's own claim and the lesson asserts none of them** — the man answering
claimed thirty-five software companies, an exit of $670 million, an age of 67, ten Christmases left
and combat in the Gulf War in 1991; the man **filming** claimed the channel of 26 million followers. **Nobody here checked one of them**, and the lesson says that
sentence out loud. The money, company and follower figures are pinned **absent from every age
band** by test; the two numbers the teaching actually works from (67, and ten Christmases) are his
too and are attributed wherever they appear.

**The clip carries advertising** — a plug for a company the transcript calls Bizzy, and the call to
action *"If people want access, all they have to do is just comment the word plan below."* It is
named as advertising, used for nothing, and pinned absent from every age band.

**The transcriber mis-heard at least three spans**, marked as uncertain transcription rather than
tidied: *"I've been eating 60 billionaires in the last five years."* (almost certainly
*interviewing*), *"So they help people start LLCs and escorts."* (garbled — what that company does
is **not recoverable** from this recording, and the lesson says so instead of guessing), and
*"Which one do you think we made?"* (garbled past use). Each appears once, in the provenance only,
and **no teaching rests on any of them**.

**A stranger's words are not cleaned.** DR-0331 licenses rendering **Darrell's own** words for
meaning and is explicitly narrower than it looks — it does not reach a third party. So the 17
spoken spans are quoted exactly as transcribed, **straight apostrophes and all**, while our prose
and every Scripture quotation carry the corpus U+2019. Both registers are asserted by test, because
tidying either direction would be a lie about a source. The 17 spans ride the gate's explicit
`NOT_SCRIPTURE` allowlist, which the gate asserts is **honest** (no entry is secretly Scripture) and
**not a dumping ground** (every entry appears in the lesson) — the DR-0331 §Consequences mechanism,
worked example `living-lessons-l128-verses.test.js`.

## Why the NAS builder failed it twice

The row was claimed by the NAS lesson builder (DR-0669), which failed, retried, failed, and spent
its retries. Its own reasons, from the row's tags:

- attempt 1 — `cli-local verse failed (not-the-verse Psalms 39:4); repo gates failed (verse,talkTogether)`
- attempt 2 — `cli-local repo gates failed (fullLevels,talkTogether)`

So it reached for a verse about the brevity of days and **quoted it wrong twice**, and never carried
TALK ABOUT IT TOGETHER into every band. The corpus writes Psalms 39:4 with a **colon** —
*"what it is: that I may know how frail I am"* — where a writer working from memory reaches for a
semicolon. Both faults are pinned by name in this lesson's gate, and the colon explicitly.

## The teaching

Eight movements, in order, in all five places a reader reads (the adult lesson and each of the four
bands):

1. **A man counted his Christmases** — Psalms 90:12; Psalms 39:4-6; Job 14:5; Matthew 24:36
2. **What combat taught him, the Word said first** — James 4:13-15; Psalms 103:15-16; Isaiah 40:6-8; 1 Peter 1:24-25
3. **The man who counted years he did not have** — Luke 12:15-21; Ecclesiastes 7:2
4. **I don't deserve this** — Ephesians 2:8-9; Titus 3:5; Deuteronomy 8:17-18; 1 Corinthians 4:7; James 1:17; Psalms 103:2; Proverbs 10:22
5. **The charge on a man with much** — 1 Timothy 6:6-19; Matthew 6:19-21; Proverbs 11:28; Proverbs 23:4-5; Ecclesiastes 5:10; Mark 8:36
6. **Advice is not The Way** — John 14:6; Proverbs 14:12; Jeremiah 6:16; Proverbs 19:21; Proverbs 3:5-6; Proverbs 14:15; Acts 17:11
7. **One hundred out of one hundred** — Philippians 2:10-11; Isaiah 45:23; Romans 14:11; James 2:19; Romans 10:9-10; John 1:29; John 3:16; Hebrews 1:8; Colossians 1:16-17; 2 Corinthians 6:2
8. **What to do with ten Christmases** — Psalms 90:9-12; Ephesians 5:16; Hebrews 3:13; 1 John 5:11-13; Psalms 139:16

Then **TALK ABOUT IT TOGETHER**, in the lesson's own words, all three directions, on the lesson and
on every band.

The lesson **takes no position on his market advice** and says so in those words — it neither
endorses nor attacks it, because the Word is not in competition with a business opinion (DR-0098) —
and it **pronounces no verdict on the man's own standing**, which the facilitator notes say is not
ours to give. What it teaches instead is the Word's own distinction: being certain Yahweh exists
(James 2:19) is not the confession the Word calls for (Romans 10:9-10), and the time for that is now
(2 Corinthians 6:2).

## How it was built

Every quotation was written as a `[[Book c:v|span]]` token and expanded by a generator from
`app/public/bible/kjv` **on disk, never from memory** (DR-0076). The generator refuses a span the
corpus does not carry, refuses a declared spoken span that IS in the corpus, and **derives
`anchor.ref` from the same token set**, so a quotation and its anchor cannot disagree in either
direction (DR-0734). The generator was a one-off authoring tool and is not committed; the durable
verification is the pinned gate, which re-derives both directions from the committed module.

## Measured

| what | measured |
| --- | --- |
| referenced spans / faults | **354 / 0** |
| distinct verses quoted · anchored | **76 · 76**, quoted-not-anchored empty, anchored-not-quoted empty |
| spoken spans | **17**, all verbatim in the transcript, 0 secretly Scripture, 0 stale |
| adult lesson prose | 2,659 words (quotations excluded) |
| band fullness (floor) | child **0.56** (0.5) · youth **0.64** (0.6) · teen **0.86** (0.6) · senior **1.11** (0.6); no short band |
| band prose words | child 1,483 · youth 1,714 · teen 2,291 · senior 2,939 |
| reading grades | child **0.94** (new-lesson ceiling 5.0) · youth **3.55** · teen **5.31** · senior **7.06**; strictly ascending, each more than one grade above the last; not inverted |
| band differentiation | worst pair **0.41** (ceiling 0.5) — child~youth 0.05, youth~teen 0.19, teen~senior 0.41, child~senior 0.04 |
| three directions | `placesMissingDirections` empty; `hasAllThree` true — lesson and all four bands |
| title near each band's start | `unnamedBands` empty |
| talk-together ratchet, live | 673 lessons · all 78 · everyBand 78, against a 609 / 14 / 14 baseline (left unraised on purpose; DR-1159 Decision 6, `re-review: 2026-10-28`) |
| four-band ratchet | 426 / 252 **before and after** — regenerated, byte-identical; the Living Lessons series is not one of the 44 catalog courses that ratchet scans |
| lesson-dates | 837 of 837 dated, 0 undated (exit 0) |

**Proven to catch, live on the catalog file.** One word altered in ll257's copy of Psalms 39:4
(*frail* → *fragile*) in `living-lessons-class.js`; the gate failed **by field and reference**,
`lesson :: Psalms 39:4`. **167 passed / 0 failed → 165 passed / 2 failed → restored, 167 passed / 0
failed**, with zero occurrences of the altered word left. The per-band direction check is likewise
proven on the real module: stripping only the youth band's friend sentence leaves
`hasAllThree(module)` **green** while `placesMissingDirections` names
`{ place: 'youth', missing: ['friends'] }` — the exact hazard DR-0795 exists for. Two further live
mutations are pinned: advertising planted in one band is named by that band, and a dropped movement
is named by its band.

## Stated plainly as unverified

- **Not one figure in the clip was checked by anyone here.** They are attributed in the lesson and
  asserted nowhere.
- **Three spans are mis-heard** and are marked as such; what the plugged company actually does is
  not recoverable from this recording and the lesson says so rather than guessing.
- **The pooled `whole`-text pin** for a given verse can be satisfied by another band's copy of it;
  the authority for verse integrity is the per-span check that names the field, which is what the
  live mutation above confirms catches.
- **The live build at Big Print** was not reviewed in this session.
- **One blocker was reported before it was fixed, and then fixed on authorisation.** The full
  suite first came back red on exactly two assertions in
  `app/src/__tests__/living-lessons-ll256-the-lords-release.test.js` — *"is in the catalog exactly
  once, as the last lesson"* (`:180`) and `expect(Math.max(...claimed)).toBe(256)` (`:188`),
  confirmed independently by CI shard 3/4 at those line numbers. Nothing about ll256's lesson was
  wrong; 141 of its 143 cases passed throughout. Those two pinned "no lesson comes after me," which
  any next lesson breaks, and ll255 and ll254 assert no such thing. This build **stopped and
  reported** rather than editing a sibling lesson's test, which is what its brief forbids. The
  Governor verified the claim and authorised a minimal amendment in that file only: ll256 appears
  once and sits **after ll255 by index**, and the max became a **floor**. The 211/212 check, the
  "follows 255" check and all 141 other cases are untouched; the file reads **143/143**. The
  amendment was then proven not to be a weakening — the two assertions, replicated in memory, pass
  the live catalog and catch all four of ll256 moved before ll255, duplicated, removed, and
  renumbered backwards. The same defect was removed from ll257's own gate so it is not inherited.
