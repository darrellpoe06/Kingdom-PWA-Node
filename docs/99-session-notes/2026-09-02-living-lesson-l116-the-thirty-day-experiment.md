# Living Lesson L116 — The Thirty-Day Experiment

**Date:** 2026-09-02
**Branch:** `claude/christian-experiment-lesson-9zmvt7`
**Input:** Darrell spoke this in — voice-note style, mid-session — retelling a man's documented thirty-day experiment, then said one word: *lesson*.
**Rules in force:** CLAUDE.md "Spoken Teachings Are Build Input — Always Add It" (the capture mandate) · DR-0089 (standing consent — shipping it the same session needs no fresh yes) · DR-0098 (teach the Word, do not platform man's debate) · DR-0100 (state established fact plainly) · DR-0076 (verify; no verse from memory) · CLAUDE.md typographic theology + DR-0210 (Yahweh in our own voice) · DR-0103 (the lane lands it on green).

---

## What he brought in

A man who did not believe ran a thirty-day experiment — act as though Yahweh is real and see what happens. His stated reasoning, as Darrell relayed it: *I don't really know if God is real, but action produces information. So for the next thirty days, I'm gonna pretend he's real.*

Four practices: (1) a morning prayer — a short one before a smoothie, which he said out loud felt awkward; (2) gratitude — for a friend, for a beautiful day, for a yard; (3) reading about Yahweh — Scripture; (4) applying His teachings.

What he reported: reading about Jesus forgiving the men nailing His hands to the cross convicted him immediately about a friend he had never forgiven and was quietly ghosting, and he reached back out. By **day twenty** he stopped calling it an experiment. An **eight-year nicotine habit quietly faded away**. And **bad dreams began that he had never had before**.

Darrell's own two Scriptures: **Jeremiah 29:13** (the seeking clause) and the outpouring — **Joel 2:28**, "the spirit will dwell among all flesh," as he put it. His closing grief: people will read an account like this and *still* argue that the Word is not real — *and this man wasn't even a believer.*

## The premise held, not smoothed over (feedback-surface-premise-conflicts)

The obvious soft reading of this account is "pretending works." It doesn't, and the lesson refuses it in **movement 8**. Jeremiah 29:13 promises finding to those who *"search for me with all your heart"*, and Hebrews 11:6 says *"he that cometh to God must believe that he is."* A pretender satisfies neither at the outset. Both texts are kept intact; the term is taught as the **approach that carried him across the line**, not the qualification — answered by a Father who runs while the son is *"yet a great way off"* (Luke 15:20).

The second guard is the **caution**, taught beside the invitation rather than after it: the Name is not a technique (Acts 19:15, the sons of Sceva), and an emptied life never filled ends worse (Matthew 12:44-45). A term is a doorway, not a destination.

## Source discipline

The account is a **relayed testimony** — reported second-hand, and pinned in the lesson and its test as *a witness to what Scripture already claims about itself, never an authority standing beside it.* No detail was added in the retelling; the specifics in the lesson are exactly the specifics Darrell gave. The teaching weight sits on the Word, not on the video.

## Where the doctrinal weight landed

The hinge is **movement 4**: because the man began with *no sincerity*, the account isolates the variable cleanly — what changed him was the instrument he handled, not his own earnestness. Hebrews 4:12 (alive, and it reads the reader), Isaiah 55:11 (the errand is guaranteed regardless of the reader's posture), John 6:63, 1 Thessalonians 2:13. Any reading that makes the seeker's sincerity the operative power is the failure this lesson exists to prevent.

Two supporting reads that carry the pastoral weight:

- **The order of the fruit is diagnostic.** Forgiveness moved first, under conviction; the addiction moved later and *passively* — Mark 4:26-28, *"he knoweth not how"*, credited to the Son (John 8:36) and to kindness, not fear (Romans 2:4). That is the answer to the long-time believer still white-knuckling something.
- **The post-turn assault is taught in advance.** The dreams began *after* he turned. Mark 4:15,17 predicts the immediate strike at the sown word, and the Lord's own sequence is affirmation then wilderness (Matthew 3:17 → Matthew 4:1). A convert who is not told about this stage reads it as evidence he was wrong.

Darrell's closing grief is answered the Word's own way (DR-0098): we don't take up the argument (2 Timothy 2:23-24; Titus 3:9), we hand over demonstration and testimony (1 Corinthians 2:4-5; John 9:25) and the invitation to run the term — John 7:17 and Psalm 34:8.

## Verification (DR-0076)

- **140 quoted spans, every one letter-for-letter KJV**, read from the in-repo corpus at `app/public/bible/kjv/`. Nothing quoted from memory.
- **The whole-span gate is proven-to-catch against a class this series had not caught before.** Authoring produced two real in-quote alterations — **cross-verse spans quoted as one continuous quotation** (Mark 4:26-27 and Psalm 103:2-3). Each half is real KJV; the *join* silently deletes the verse boundary, and a fragment-list check would never see it. Both were caught by the sweep, fixed with an explicit ellipsis split, and are asserted as negative pins in the test.
- **The age gate caught a real gap and the lesson was fixed, not the test.** The child level had omitted the lesson's own doctrinal centre — the Word doing its own work. It now carries Hebrews 4:12 in child language (*quick is an old word that means ALIVE... you read it, and it reads you back*).
- **Typography:** no generic "God" in our authored voice (25 mentions of Yahweh), no capitalized adversary name, Jesus confessed as the Lamb of Yahweh (John 1:29).
- **Suites:** `living-lessons-l116-verses.test.js` — 87 tests; full Vitest suite green; `npm run lint` clean.

## The collision, and how it was resolved

Three sessions shipped Living Lessons the same day. This one was authored as **L114** and pushed; while its CI ran, `main` took **L114** (covenant vs contract, DR-0320) and **L115** (meek and quiet strength) from two other branches, and the PR went `dirty` on an add/add conflict over the test filename. Resolved by merging `main` in and **renumbering this lesson to L116** — id, test file, recap line and `weeks` ratchet (114 → 115) all moved together. No other session's work was touched.

**Standing note for concurrent lesson sessions:** the next free lesson number is not knowable from a stale branch. Take it from `origin/main` at merge time, not at author time.

## Files

- `app/src/lib/living-lessons-class.js` — L116 added; `weeks` 114 → 115
- `app/src/__tests__/living-lessons-l116-verses.test.js` — new, 87 tests
