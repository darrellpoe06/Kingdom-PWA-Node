# DR-0853 — Competence before submission: the study skills and doing skills of a wife and a husband, with the Word answering first (L230)

**Date:** 2026-10-09
**Status:** accepted
**Area:** Living Lessons (L230), marriage, competence and order, held to the text
**Principle:** Spoken Teachings Are Build Input (Layer 0), DR-0331, DR-0076 (verify every verse; the subject where selective quotation does real harm), DR-0098 (teach the Word, do not debate it), DR-0100 (state what is established plainly), DR-0733

## Context

Darrell spoke it into the app on 2026-10-09: *"I'm not sure there are a lot of women who can be wives based on their study skills... then also her doing skills... same for a man... how can we submit to a person who isn't competent with the Spiritual Mindset... however believes he should be submitted to without understanding what He Says... His Skills Matter... future either comes or doesn't... make sense? Lesson."*

The Word answers first, and it answers in an order most teaching reverses. The same passage that says *Wives, submit yourselves* (Ephesians 5:22) names the husband's competence before it is done: he is to sanctify and cleanse her *with the washing of water by the word* (Ephesians 5:26), which a man who does not know the Word cannot do, and to *dwell with them according to knowledge* (1 Peter 3:7). Both halves are in every band, exactly as written; neither is erased to make the other louder.

- **The standard is on the man first** (Ephesians 5:21-29, 5:33; Colossians 3:19; 1 Corinthians 11:3; 1 Peter 3:7).
- **A man's competence, named.** Ruling his own house well; Ezra's order, prepared his heart to seek, to do, to teach; a workman that needeth not to be ashamed; the builder on the rock and the builder on the sand; why call ye me Lord (1 Timothy 3:4-5; Ezra 7:10; 2 Timothy 2:15; Genesis 2:15; Proverbs 22:29, 24:27, 27:23; Deuteronomy 6:7; Matthew 7:24-26; Luke 6:46; Luke 16:10; James 1:22).
- **A wife's competence, named in her own chapter.** Study: she openeth her mouth with wisdom; a woman that feareth the LORD. Doing: she seeketh wool and flax, considereth a field and buyeth it, looketh well to the ways of her household (Proverbs 31:10-31; Proverbs 14:1, 12:4, 19:14; 1 Peter 3:4; Ruth 3:11; Proverbs 11:22).
- **The choice is where competence is weighed.** Can two walk together, except they be agreed; only in the Lord; not unequally yoked; counsellors; he that hasteth with his feet sinneth; why knowledge matters (Amos 3:3; 1 Corinthians 7:39; 2 Corinthians 6:14; Proverbs 13:20, 15:22, 19:2, 18:22; Genesis 2:18, 2:24; Ecclesiastes 4:9-12; Hosea 4:6; Proverbs 4:7).
- **A marriage already made to a Nabal.** The Word does not pretend these do not exist: Abigail's understanding, blessed be thy advice; Peter's instruction, won without the word; the man still under the standard; the flip side for the man (1 Samuel 25:3, 25:17, 25:25, 25:33; 1 Peter 3:1-2; Proverbs 21:9).
- **The future either comes or it does not.** Boast not thyself of to morrow; choose life; Wisdom builds, Understanding establishes, Knowledge fills (Proverbs 27:1; Deuteronomy 30:19; Psalms 1:2-3; Proverbs 24:3-4; Proverbs 3:5-6).
- **What competence is, so no one mistakes it for confidence.** Not a feeling a person has about himself but what his mouth and hands can do on the day they are tested; built in the years before the wedding, by reading when no one is watching and finishing work no one is checking.

The lesson gives no husband a pass for not knowing what He says, and no wife a licence for contempt. Darrell's own words stay his (DR-0331); the adversary name inside the quoted record stays lowercase (belial, 1 Samuel 25:17).

## What was measured

| band | prose words | ratio | floor |
|---|---|---|---|
| adult | 1,149 | — | >1,000 |
| child | 610 | 0.531 | 0.50 |
| youth | 723 | 0.629 | 0.60 |
| teen | 690 | 0.601 | 0.60 |
| senior | 699 | 0.608 | 0.60 |

Reading ladder: child 1.67, youth 5.48, teen 6.64, senior 6.72. 73 anchor references, every one taught in the body. 330 referenced spans, every one verbatim under the strict comparison. Caught before the push: the adult at 989, the child at 0.447 and the youth at 0.544, each raised with teaching they lacked (what competence is; a skill is something you can do, learned by doing it many times; readiness is the skill itself, measured by what you can do today).

**One catalog test widened.** `living-lessons-l206-verses.test.js` asked the shared-ground finder for L206's top 50 neighbours and expected L202 among them. With the catalog at 227 modules L202 is the 52nd, displaced by lessons that share more verses (L229 shares twelve with L206). The surface itself shows three neighbours and is unchanged; the test's intent is that L202 is on the shared ground, so the window is now the whole catalog.

## Impact

L230 joins Living Lessons as the 227th module. Six movements, the definition of competence, a practice for men and a practice for women, each from the text, and the three talk directions in every band. The companion to L228 (the Word answers first) and L227 (do the Word for the skill).

## Decision

Ship L230 with its full four-band build, a ten-question quiz, twelve benefits, twelve facilitator talking points, its date row, and a verse-pin gate that requires BOTH halves in every band: Ephesians 5:22 quoted whole AND the husband's standard (Ephesians 5:25-26 and 1 Peter 3:7) in every band; the wife's study verse and doing verses (Proverbs 31:26, 31:16, 31:27) in every band; the choosing (Amos 3:3; 1 Corinthians 7:39; Proverbs 15:22) in every band; Abigail and Peter (1 Samuel 25:3, 25:33; 1 Peter 3:1-2) in every band; Proverbs 27:1 and Deuteronomy 30:19 in every band; twenty-three spine references in every band; the no-pass-no-licence sentence in the lesson; and belial lowercase everywhere.

`re-review: 2026-11-09` — read L230 on the live build with the men and the women of the house separately, and confirm each hears the standard on themselves before they hear it on the other.

## Verification

- `app/src/__tests__/living-lessons-l230-verses.test.js` — 22 cases green.
- `living-lessons-l206-verses.test.js`, `living-lessons-order.test.jsx` green with the two lessons in place; the living-lessons suites over the live catalog: 6,331 cases green.
- Lint clean at zero warnings; `verify:gates` green before the push.
