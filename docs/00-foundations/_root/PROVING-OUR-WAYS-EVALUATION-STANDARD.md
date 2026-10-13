# Proving Our Ways — the evaluation and assessment standard

**Declared by Darrell, 2026-10-08. Recorded as DR-0819. The Word under it is Living Lessons L219 (DR-0818).**

> "Where inside the PoeTech App is the reports and historical information and
> framework for our culturally responsive evaluation and assessments to make
> sure we are producing His Will with our ways and tools? Comprehensive
> module/s"

And, into the same channel, the Word he answered himself with:

> "Prudence and also leaning on His Understanding... which tells me to be
> prudent... His Knowledge is the Highest Authority And Level... in all
> dimensions..."

This is the standard that answer became. It is Layer 3 reference: read before
assessing anything we have built. Its surface inside the app is
**Admin → Proving our ways**, and the two are one thing in two places (DR-0065).

## What "culturally responsive" means here, and why it is not borrowed

In the world's usage the phrase means an assessment that meets people inside
their own language, age, pace and circumstance instead of grading everyone
against a stranger's default. This house keeps that meaning and grounds it,
because the Word got there first:

- **Each person in their own register, nothing reduced.** Every lesson carries
  the whole message to child, youth, teen and elder, and a gate measures that
  none of them is given less (the band ratios, the reading ladder).
- **The rhythm of an ordinary day, not an exam hall.** *"And thou shalt teach
  them diligently unto thy children, and shalt talk of them when thou sittest
  in thine house, and when thou walkest by the way, and when thou liest down,
  and when thou risest up."* (Deuteronomy 6:7)
- **And the measure itself does not move.** *"Divers weights, and divers
  measures, both of them are alike abomination to the LORD."* (Proverbs 20:10)

Responsive to the person. Fixed in the standard. Both, or it is not this.

## The eight questions

Each one can be answered from real state, and each stands on a verse. The app
renders these and a test pins every verse verbatim against the in-repo KJV
corpus, the same way every lesson is pinned.

1. **Do we know the real state, or only our impression of it?**
   *"Be thou diligent to know the state of thy flocks, and look well to thy
   herds."* (Proverbs 27:23)
   Asks: is every number read from a real row, a real run or a real timestamp?

2. **Has the thing we shipped actually been used by anyone?**
   *"For which of you, intending to build a tower, sitteth not down first, and
   counteth the cost, whether he have sufficient to finish it?"* (Luke 14:28)
   Asks: of the functions we shipped, how many has a person exercised once?

3. **Is the measure the same for everyone, including us?**
   *"Divers weights, and divers measures, both of them are alike abomination to
   the LORD."* (Proverbs 20:10)
   Asks: would this assessment read the same if someone else had built it?

4. **Are we proving our own work, not comparing ourselves?**
   *"But let every man prove his own work, and then shall he have rejoicing in
   himself alone, and not in another."* (Galatians 6:4)

5. **Does it meet each person where they are, nothing reduced?**
   *"And thou shalt teach them diligently unto thy children..."*
   (Deuteronomy 6:7)

6. **Are we leaning on His Understanding rather than our own?**
   *"Trust in the LORD with all thine heart; and lean not unto thine own
   understanding."* (Proverbs 3:5)

7. **Is the proving aimed at His will, or at our output?**
   *"And be not conformed to this world: but be ye transformed by the renewing
   of your mind, that ye may prove what is that good, and acceptable, and
   perfect, will of God."* (Romans 12:2)

8. **Is the standard faithful, rather than impressive?**
   *"Moreover it is required in stewards, that a man be found faithful."*
   (1 Corinthians 4:2)

## What the app measures, and what it does not

**Measured, from real rows:** whether each registered function has been
exercised, how many times, by how many distinct people, and when last, over a
rolling ninety days (`feature_use_metrics`, migration 0253; the app records
`kind='use'` through `noteUse`). One assessment a day is kept so the direction
is visible, not only today's number.

**Not measured, and said on the surface rather than hidden in a comment:**

- Only the functions in the registry are counted. One that is shipped and never
  registered is invisible to the report, so the registry is the honest limit of
  the claim, and a test refuses a registry row that is not actually wired.
- It measures whether a function was exercised, never whether it served the
  person well. Question 2 of eight is a count; the other seven are answered by
  people.
- It never names a person. Counts and distinct-people counts only. Per-person
  usage already has its own decided road for a steward of a space (migration
  0145), and the question here is about the function, not the person.
- A snapshot that could not be read is reported as unread. An unread day and an
  unused day are not the same sentence, and the surface never prints the second
  when it means the first.

## How it is used

Run the eight questions before calling a process or a feature done, and
whenever anyone asks whether it works. This composes with, and does not
replace, the Spec-Conformance Review (SHOULD / ARE / GAPS / CLOSE, DR-0219) and
the Comprehensive Review Standard's ten dimensions (DR-0239): those ask whether
the thing is built right; this asks whether the way is producing His will for
the people it is for.

Where a question is answered "no" and not fixed in the same pass, that is a
recorded decision with a `re-review:` date, per DR-0075.
