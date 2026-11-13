# DR-1462: L302 — A Standard for Every Age: the Golden Rule, its Author, and the only Good

**Date:** 2026-11-13
**Status:** Accepted (renumbered from DR-1461 the same day, after main took DR-1461 for the 0319 smoke record)
**Tier:** A (one Living Lesson; content only)
**Type:** lesson
**Area:** Living Lessons (`app/src/lib/living-lessons-class.js`, `living-lessons-dates.js`)
**Spoken by:** Darrell, 2026-11-13, in two parts the same day
**Pairs with:** DR-0098 (teach the Word, do not debate it), DR-0100 (state established fact; flag only the narrow open point), DR-0076 (every verse fetched; no claim without evidence), DR-0331 (render his words for meaning, never in quotes), DR-0210 (Yahweh in our voice), DR-1126 (the third pile is counted)

## Context

Darrell spoke with an older gentleman he respects and salutes: a veteran, once a military police officer, and a Catholic. The elder said no moral standard can survive every age. Darrell disagreed. In his view, not killing, stealing or destroying, and treating your neighbor the way you want to be treated, fits everyone, even a person who wants no part of Yahweh, and that is why it is perfect. He asked for the Word first and research second, at an institution's rigor, and asked to be shown anything he was missing. He wondered whether the elder's view came from a Catholic book he did not know.

Later the same day he added the heart of it. Yahweh says we need Him, and without Him we get a reprobate mind. Evil abounds when good men do nothing. Jesus said none is good but Yahweh, so good cannot stand apart from His eternal good and righteousness.

## Decision

`ll302-a-standard-for-every-age` is dated 2026-11-13, after L301. It is taught from the Word first:

- the standard lasts because its Author does not change (Malachi 3:6; Hebrews 13:8; Isaiah 40:8; Matthew 24:35; Psalms 119:89, 160);
- Darrell's standard is Jesus' own words (Matthew 7:12; Matthew 22:37-40; Leviticus 19:18; Exodus 20:13-15; Romans 13:9-10);
- his three words, kill, steal and destroy, are the thief's three works in John 10:10;
- it fits even the one who refuses its Author, because the work of the law is written in every heart. It is universal, but not neutral (Romans 2:14-15; Jeremiah 31:33; Psalms 19:7);
- what changes across the ages is man's code (Mark 7:8; Judges 21:25; Isaiah 5:20; Proverbs 14:12). That is the honest reading of the elder's sentence, and it is the reason the standard must come from Yahweh;
- **the heart:** none is good but one (Mark 10:18; Luke 18:19; Psalms 14:3; Romans 3:10; Psalms 119:142; Psalms 111:7-8; Isaiah 64:6). The road without the Author is the reprobate mind (Romans 1:28; Romans 7:12);
- knowing good and not doing it is sin (James 4:17; Ezekiel 22:30; Romans 12:21);
- where Darrell may be missing something: agreement does not make the standard and cannot keep it (Romans 3:23; James 2:10). It is kept only in Jesus (Ecclesiastes 12:13; Micah 6:8; Romans 3:21-22; Romans 8:3-4; Ezekiel 36:26; John 15:5; Romans 5:8);
- the elder is honored, as a son speaks to a father (1 Timothy 5:1; Leviticus 19:32; Proverbs 16:31; Romans 13:4; Luke 7:9; Acts 10:2; 1 Peter 3:15).

It has two parables with invented people and an eleven-question quiz.

## Research, and what was not read

Confirmed by web search on 2026-11-13. The results quoted or described the Vatican's own pages:

In its own words, the Catechism of the Catholic Church §1956 calls the natural law universal in its precepts, and §1958 calls it immutable and permanent throughout the variations of history. §1957 and §1960 are given as paraphrase, and the lesson says so: the application varies with circumstances, and not everyone perceives the precepts clearly and immediately.

So the Catholic Church's own Catechism agrees with Darrell, not with the elder's sentence.

Also confirmed by search. **Veritatis Splendor (1993)** teaches that some acts are always wrong and rejects theories that let an outcome justify the act; this rests on Catholic secondary reporting. **Joseph Fletcher** was an Episcopal priest, not a Catholic one, and his *Situation Ethics* came out in 1966, confirmed through the Episcopal Church's own dictionary entry as search showed it. **The Burke saying:** Quotation researchers and fact-checks report that the sentence has not been found in Burke's writings, and a similar line is reported from Mill in 1867. The attribution is held as unverified (DR-0100, tier 2, named narrowly), and the Word states the truth: James 4:17 and Ezekiel 22:30.

Roads refused from this sandbox (getaddrinfo ENOTFOUND): `www.vatican.va` and `usccb.org`. `peped.org` was refused in the coordinator's earlier attempt. So the Catechism's own pages, the encyclical, Burke's writings, Mill's address and Fletcher's book were **not read**. Every reader text says so.

No Catechism wording is put in double quotes. Double quotes in a lesson are reserved for Scripture with a reference. The Catechism's words are rendered as "in its own words", with the paragraph number. Pius XII on situation ethics was **not** cited, because it was not verified.

## What was measured

Verses: 50 anchor references and 190 quoted spans, every one fetched from `app/public/bible/kjv`. There are 0 verse faults and 0 quotes lacking a reference. Length: The adult text is 3,417 words, with 2,641 words of prose. Band shares are child 0.50, youth 0.60, teen 0.60 and senior 0.60. Reading ladder: Child 2.2, youth 4.2, teen 5.4, senior 7.3. Band overlap: The worst pair is 0.06. Voice: No generic God, GOD or LORD in our voice. Darrell's words are never in quotes.

## Verification

`living-lessons-ll302-a-standard-for-every-age.test.js` runs 53 cases (vitest's count, including the shared length suite it imports). It pins 13 spine spans in every text. Its eight proven-to-catch cases are: a band drops a spine verse; a verse word is altered; a mid-verse span is capitalized; the teen friend line is stripped; a generic "God" appears in our voice; the agreement line is lost; the Burke attribution is stated as fact; the not-read disclosure is dropped.

## Honesty gap

The lesson admits unchecked material and has no figure to give a source row, so the third-pile GAP pin rises by one, with a dated note in `the-third-pile-is-a-worklist.test.js`.

re-review: 2026-11-27. Read the Catechism paragraphs from a runner with web access, and replace the paraphrase of §1957 and §1960 with their wording if the pages confirm it.
