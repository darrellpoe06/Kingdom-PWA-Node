# DR-1085: The electric car and the car that drives itself — the children's next two questions, worked with the same craft

**Date:** 2026-10-17
**Status:** accepted
**Tier:** A (additive curriculum: two new lessons on an existing History course, with their gate; seven new record hosts, each read by a runner first)
**Type:** curriculum
**Area:**
- `app/src/lib/car-research-course.js` (lessons 5 and 6, nine new sources, the meta for six lessons)
- `app/src/lib/history-course.js` (`HISTORY_RECORD_HOSTS`: seven hosts added, with the probe runs that read them)
- `app/src/lib/learn-catalog.js` and `app/src/lib/learn-crosslist.js` (six competencies; the measured count, 25 anchors across six lessons)
- `app/src/__tests__/car-research-course.test.js` (the gate for six lessons, and what each new lesson must teach)

**Amends:** DR-1083 (the car course grows from four lessons to six). Grounds: DR-0580 and DR-0597 (their words fetched, dated entries probed), DR-0601 (a worked case in every lesson), DR-0098 and DR-0100 (teach the Word, speak established fact, name a genuinely open question narrowly), DR-0210 (Yahweh in our voice), DR-0733 (every place sends the reader three ways).
**Declared by:** Darrell, 2026-10-17, answering DR-1083's own re-review question about whether "driving car" meant a car that drives itself: "Electric and or driving car... meaning it is self driven no human... make sense? The kids asked so we wanted a lesson..."

---

## Context

DR-1083 built the History department's third course on the motor car and left one question for review: did "the driving car" mean the motor car, or a car that drives itself? Darrell answered that the children asked about both. Both are "who invented it?" questions, so both are taught on the same Level-1 research craft, as lessons 5 and 6 of the same course, rather than as a separate course.

The sandbox still has no road to these pages. I found candidate records by search, then dispatched the probe mode of `history-voices-witness.yml` twice (runs 38990058537 and 38990334741). Eleven pages were read. Nine answered HTTP 200 and are quoted. The Henry Ford's older artifact address returned 404 and its current one answered. Waymo's Medium post returned 403 and is not used. Every voice, date and figure below is the page's own text as the runner read it.

What the records showed, and the two competencies they teach:

5. **Read the past in its own day: the electric car came early.**
   - The Department of Energy's history (Rebecca Matulka, September 15, 2014) says "it's hard to pinpoint the invention of the electric car to one inventor or country". It names William Morrison of Des Moines for the first successful American electric car, around 1890. By 1900 electrics were "around a third of all vehicles on the road".
   - The Henry Ford's catalog says electrics "started instantly without hand cranking". Clara Ford, wife of Henry Ford, drove her 1914 Detroit Electric into the 1930s. It cost $3,730 as outfitted, against an average 1914 wage of $627, "about 5 years, 11 months" of work.
   - The car lost for documented reasons: $650 against $1,750 in 1912, Kettering's electric starter the same year, roads, Texas oil, and no wires outside the cities. Electrics were "all but disappeared by 1935".
   - Word: Ecclesiastes 1:10 and 1:11 (why a people forgets), and Job 38:35 with Psalm 135:7 (Yahweh makes the lightning every battery stores).
6. **Name the level, and who answers for it: the car that drives itself.**
   - SAE J3016 (first issued 2014, refined with ISO on May 3, 2021) sets the levels.
   - NHTSA states the levels in plain words. It says "every vehicle currently for sale in the United States requires the full attention of the driver at all times", and it declines the term "self-driving" itself.
   - The milestones, each a first at its own level:
     - Navlab 5's 1995 trip, a computer driving "more than 98 percent" of 2,850 miles;
     - DARPA's unwon $1 million in 2004;
     - Stanford's $2 million in 2005;
     - Steve Mahan, a blind man, in 2015, on what Waymo calls "the world's first ride in a self-driving car on public roads";
     - Waymo's public driverless rides in Phoenix, October 8, 2020.
   - The second question is who answers when no one drives. It is taught from the law of the ox (Exodus 21:29), applied with care and marked as an application. NHTSA says liability and insurance are still being worked out, so that question is named open, narrowly.
   - Word: Proverbs 14:15, Jeremiah 10:23, Proverbs 16:9.

## What was measured

- **Records:** 21 distinct records across the course (12 before), on 16 hosts. The seven new hosts are www.energy.gov, csd.cmu.edu, www.darpa.mil, computerhistory.org, waymo.com, www.sae.org and www.nhtsa.gov. Each answered the runner with HTTP 200 and the quoted words.
- **Anchors:** 25, eight of them new. Every quoted verse was fetched from `app/public/bible/kjv` and checked case-sensitively.
- **Reading levels:** each band measured the way the department gate measures it.

  | | child | youth | teen | senior |
  |---|---|---|---|---|
  | Lesson 5 | 2.07 | 5.48 | 3.47 | 9.52 |
  | Lesson 6 | 2.72 | 6.34 | 3.05 | 9.25 |

  The ceilings are 5.0, 8.0, 6.0 and 10.0.
- **Band shares:**
  - On the first measure, three bands fell short: lesson 5's child band (0.48) and lesson 6's teen band (0.56) were under their floors, and lesson 6's youth band sat exactly on its floor. Each was deepened with a fetched fact (the 1915 letter to Clara Ford, the $1 million prize and the 132 miles, Firefly's 25 mph) rather than the adult text cut. All bands now sit between 0.51 and 0.68.
  - No pair overlaps above 0.05.
- **Arithmetic:** the gate checks the museum's figure against the arithmetic: $3,730 divided by $627 is just under six years.
- **Details kept out:** details I did not fetch were left out. They include the 1925 radio-controlled car, the Futurama exhibit, Dickmanns's dates, La Jamais Contente, and the claim that Mahan rode "alone". Only the Medium post says alone, and the runner was refused it.

## Impact

A child who asked who invented the electric car learns three things: no one person did; their great-great-grandparents drove electric cars; and the reasons those cars lost are on the record. A child who asked about the car that drives itself learns the levels before the firsts, so a true claim is not stretched past what it proved. That child also learns to ask who answers when no one drives. Both lessons end every place in three directions: parents to children, children to parents, and friend to friend.

## Decision

The car course carries six competencies. Lesson 5 reads the past in its own day; lesson 6 names the level, and who answers for it. The open questions are stated narrowly:
- which first deserves the word inventor (definition);
- who first built an electric carriage (the records fetched name Anderson without a year);
- who answers for a car with no driver (responsibility, still being worked out).

Every dated fact is stated plainly with its record.

## Verification

- `car-research-course.test.js`:
  - six lessons in order, the whole shape on each;
  - every quoted span verbatim and case-sensitive;
  - 25 anchors that resolve;
  - four bands per lesson under the ceilings and floors, no near copy;
  - a worked case and a faultless timeline per lesson;
  - every source on a probed and listed host, 21 sources in all;
  - lesson 5's voices, prices, years, names and verses;
  - lesson 6's claim, the agency's words, Level 4 in every band, the milestones' years, the four verses, and the open question named as responsibility.
- `history-voices-witness.yml` runs on the push that carries the course and reads every new voice and dated phrase from its page.
- `re-review: 2026-10-24`:
  - read lessons 5 and 6 on the live app in each band with the children who asked;
  - re-run the witness;
  - if they ask next about the radio-controlled car of 1925 or the 1939 Futurama, fetch those records first and add them to lesson 6's timeline.
