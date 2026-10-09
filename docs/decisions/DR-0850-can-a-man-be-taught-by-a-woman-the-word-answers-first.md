# DR-0850 — Can a man be taught by a woman? Knowing Him is most important, He can use anyone, and the Word answers first (L228)

**Date:** 2026-10-09
**Status:** accepted
**Area:** Living Lessons (L228), teaching and learning across men and women, held to the text
**Principle:** Spoken Teachings Are Build Input (Layer 0), DR-0331, DR-0076 (verify every verse; honest uncertainty; the subject where selective quotation does real harm), DR-0098 (teach the Word, do not debate it; name a debate only to educate past it by the Word; where the Word is reticent, stay with what it says), DR-0100 (state what is established plainly), DR-0733

## Context

Darrell spoke it into the app on 2026-10-09 as a question: *"Why is it hard for a man to be taught by a woman when comprehending the Word is most important... not necessary who He uses He can use anything and anyone... knowing Him Is Most Important... making 50% of humanity not teach about Him doesn't seem to be biblical to me... however Word first responds to the question... Lesson."*

His last clause is the method of the lesson and of this house: **the Word answers first.** This is the one subject on which a teaching can mislead a reader while every word in it is true, simply by leaving half of the text out, in either direction. So both halves are in the lesson, in every band, quoted exactly as written, each allowed to say what it governs by its own words, with nothing erased and nothing added.

- **The measure.** Knowing Him is life eternal (John 17:3; Jeremiah 9:23-24; Hosea 4:6; Proverbs 4:7; Philippians 3:8), and no question about the messenger outranks the message.
- **He can use anything and anyone.** The donkey that corrected a prophet (Numbers 22:28), the stones (Luke 19:40), no respecter of persons (Acts 10:34), the Spirit dividing as He will (1 Corinthians 12:7, 12:11).
- **The order verses, exactly as written.** 1 Timothy 2:11-14 and 1 Corinthians 14:34-35 are quoted in full, not softened, not explained away; by their own words they govern teaching that usurps authority over the man, and order in the churches. Where the Word is this plain the lesson stays with what it says.
- **The record, exactly as written.** Priscilla, named with Aquila, expounded the way more perfectly to Apollos (Acts 18:24-26); Deborah judged Israel (Judges 4:4-5, 4:9); the high priest went to Huldah for a word (2 Kings 22:14-15); Miriam among the sent (Exodus 15:20; Micah 6:4); Anna spoke of Him to all (Luke 2:36-38); Philip's daughters prophesied (Acts 21:9); women praying and prophesying regulated, not forbidden (1 Corinthians 11:5); sons and daughters shall prophesy, poured out at Pentecost (Joel 2:28; Acts 2:18); David blessed Abigail's advice (1 Samuel 25:32-33); Phebe, Priscilla, the women who laboured in the gospel (Romans 16:1-4; Philippians 4:3); the woman at the well (John 4:29, 4:39); and the first news of the resurrection, carried by a woman to the apostles by His own instruction (John 20:17-18; Matthew 28:7, 28:10).
- **The teaching the Word commands women to do.** The aged women, *teachers of good things* (Titus 2:3-5); Lois and Eunice (2 Timothy 1:5, 3:15); *forsake not the law of thy mother* (Proverbs 1:8, 6:20); Proverbs 31:26.
- **The Word's diagnosis of why it is hard.** Pride, not the woman (Proverbs 16:18; James 4:6; Proverbs 13:10, 12:1, 19:20). A man who cannot receive a true thing about Him from a woman the Word itself used has a pride problem and not a Scripture problem; the order verses give no man a licence for that pride and never say a man cannot learn from a woman.
- **Holding both as written.** Galatians 3:28; Ephesians 4:11-12; Psalms 68:11. Making half of humanity silent about Him is not what the Word does, and the lesson will not say it does; nor will it erase the order verses to make the record louder. It says what is written, both halves, and stops where the Word stops.

## What was measured

| band | prose words | ratio | floor |
|---|---|---|---|
| adult | 1,152 | — | >1,000 |
| child | 590 | 0.512 | 0.50 |
| youth | 699 | 0.607 | 0.60 |
| teen | 724 | 0.628 | 0.60 |
| senior | 824 | 0.715 | 0.60 |

Reading ladder: child 2.19, youth 5.74, teen 6.83, senior 7.18. 64 anchor references, every one taught in the body. 274 referenced spans, every one verbatim under the strict comparison. Caught before the push: the child band at 0.489 and the youth at 0.498, raised with teaching they lacked (that the question is never who is talking but whether it is true and from Him; that the gain is yours whoever carried it); the senior band's reading level at 5.95 sitting below the teen's 6.83, an inverted ladder, corrected with the longer sentences the elder register should carry; two anchor references (Acts 2:17; John 4:28) listed but not taught, removed from the anchor; a doubled word, *Word word*, caught by the doubled-word guard; and one quiz option carrying the generic name in our voice.

## Impact

L228 joins Living Lessons as the 225th module. Seven movements: the measure; He can use anything and anyone; the order verses, exactly as written; the record, exactly as written; the teaching the Word commands women to do; so why is it hard for a man; hold both as written. A practice for men and a practice for women, each from the text.

## Decision

Ship L228 with its full four-band build, a ten-question quiz, twelve benefits, twelve facilitator talking points, its date row, and a verse-pin gate that requires BOTH halves in every band: 1 Timothy 2:12 and 1 Corinthians 14:34 in every band, Deborah and Titus 2:3 in every band, twenty-five spine references in every band, the pride diagnosis in every band, and the four sentences in the lesson that keep both halves standing. The facilitator notes say not to host the debate between schools, and to teach what is written, both halves.

`re-review: 2026-11-09` — read L228 on the live build with the women of the house and with the men, separately, and confirm each hears both halves and neither hears a grievance.

## Verification

- `app/src/__tests__/living-lessons-l228-verses.test.js` — 21 cases green, including the both-halves gates per band and the four as-written sentences in the lesson.
- The catalog-wide suites over the live modules: 6,749 cases green with the five new lessons in place.
- Lint clean at zero warnings; every gate green before the push.
