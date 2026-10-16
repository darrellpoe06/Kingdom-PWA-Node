# DR-1083: Who invented the car? — a second case for the Level-1 research craft, read from records a runner fetched first

**Date:** 2026-10-16
**Status:** accepted
**Tier:** A (additive curriculum: one new History course, four lessons, with its gate; nine new record hosts, each read by a runner first)
**Type:** curriculum
**Area:**
- `app/src/lib/car-research-course.js` (new: `CAR_RESEARCH_MODULES`, four lessons, and the course exports)
- `app/src/lib/learn-catalog.js` (the History department's third course, `car-research-who-invented-the-car`)
- `app/src/lib/learn-crosslist.js` (home in History, cross-listed onto The Word & The Way with its measured count)
- `app/src/lib/history-course.js` (`HISTORY_RECORD_HOSTS`: nine hosts added, each with the probe runs that read it)
- `scripts/history-voices-witness.mjs` and `.github/workflows/history-voices-witness.yml` (the witness reads the new course's voices and dated entries on every push to it)
- `app/src/__tests__/car-research-course.test.js` (its gate)
- `app/src/__tests__/historical-research-course.test.js` (the department now lists three courses)

**Amends:** nothing. Grounds: DR-0580 and DR-0597 (their words, fetched not remembered; dated entries probed), DR-0590 (the Level-1 research course), DR-0601 (a worked case in every lesson), DR-0098 and DR-0100 (teach the Word, speak established fact, name a genuinely open question narrowly), DR-0210 (Yahweh in our voice), DR-0540 (every course declares its shelves).
**Declared by:** Darrell, 2026-10-16: "Lesson... who invented the driving car? Based on documentation of history etc... make sure we use all sources inside the app... and research 1 level context however the Higher Education Yahweh as the foundation of our comprehension of the world and dimensions... lesson...", and minutes later: "1619 historical events... in context historical accuracy and science of how we understand as a community..."

---

## Context

"1 level" is his own name for the History department's Level-1 research course (DR-0590), whose case is the 1619 Project. "All sources inside the app" is that course's source discipline: listed record hosts, and the runner witness that reads every voice and every dated entry from its page. His second message names the method and the aim: historical accuracy in context, and the science of how a community comes to understand its past. So the car lesson is built as a course in that shape, a second case for the same craft, rather than a devotional Living Lesson.

The sandbox has no road to these pages. I located candidate records by search, then dispatched the existing probe mode of `history-voices-witness.yml` twice (runs 38969635014 and 38969913844). Those probes read 13 candidate pages and then the Wayback Machine's copies of two that refused the runner. Nothing in the course rests on a search summary. Every voice and every dated phrase is a page's own words as the runner read them.

What the records showed decided the course's shape:

1. **Define before you count.** In 2009 news outlets reported that the Library of Congress had ruled for Germany. The Library's own blog (February 26, 2009) answered that its page named Karl Benz only conditionally ("If we had to give credit to one inventor, it would probably be Karl Benz"), under a disclaimer that the question has no straightforward answer. Its page as revised on December 5, 2024 says "exactly who invented the automobile is a matter of opinion" and "our knowledge of the invention of the true automobile continues to evolve". A careful community learning in public, with both versions on the record.
2. **Go to the issuing record.** A respected museum's anniversary page (January 15, 2026) opens on "German patent no. 37345" and calls January 29 the grant. Four witnesses say otherwise: the patent office's page, the company history, the patent record and the UN notice of 2011. The number is 37435, applied for on January 29 and granted on November 2, 1886, dated back to the application. The museum's own page says so further down. That is Deuteronomy 19:15 in one case.
3. **Others laboured.** Around the single name the records hold:
   - Cugnot's steam vehicle (1769 and 1770);
   - Daimler and Maybach's engine (1885) and Daimler's four-wheeled car of March 8, 1886;
   - Bertha Benz's drive of August 5, 1888, of which the patent office says "without Bertha Benz, the history of mobility would have been different";
   - the Duryeas' road test (1893) and their company (1896);
   - Selden's patent of 1895, never manufactured, on which he collected royalties.
4. **For the multitude, and the Giver.** The Model T went on sale on October 1, 1908 at $850, and the moving lines finished one every 93 minutes by early 1914. Then comes the Higher Education he named: "I wisdom dwell with prudence, and find out knowledge of witty inventions" (Proverbs 8:12); "For his God doth instruct him to discretion, and doth teach him" (Isaiah 28:26); the worlds "were framed by the word of God" (Hebrews 11:3).

## What was measured

- 12 distinct records are quoted or dated, on nine hosts. Every one answered a runner with HTTP 200 and the quoted words. The live loc.gov and si.edu pages refused the runner (HTTP 403, a bot check), so both are read only from dated Wayback copies, and the gate pins that.
- The runner reads text case-folded, so capitals inside the historical quotations are restored by ordinary rules; the words and their order are the page's. One German record is quoted in German, with our translation marked as ours.
- Every verse was fetched from `app/public/bible/kjv`. More than 120 referenced quotations are verbatim, case included. The gate's case-sensitive walk caught four quotations capitalised at a sentence start ("At the mouth of two witnesses", "Other men laboured", "Let her own works") where the verses read lower case; all four were corrected. The 1619 course's own gate compares case-insensitively and would not have caught them.
- Three details I first wrote from memory were caught against the probe text before commit, and corrected:
  - the speech's date relative to the blog;
  - a "cobbler" who helped Bertha Benz (the patent office says a blacksmith, and a pharmacy sold her the fuel);
  - "slower than you can walk" for a figure the record gives as 2.5 mph.
  A telegram and "only rich people could buy them" were removed: no fetched record carries them.
- Bands, measured the way the 1619 gate measures them:
  - child ≤ 5.0, teen ≤ 6.0, youth ≤ 8.0, senior ≤ 10.0, with child and teen below senior;
  - shares of the adult text between 0.68 and 1.09;
  - no pair of texts over 0.25 overlap.
  Senior bands first read 10.8 (lesson 1) and 11.5 (lesson 4), and lesson 3's senior band overlapped the adult text at 0.34; all three were rewritten.
- The 277 days from application to grant are computed in the gate, not asserted.

## Impact

A reader learns to ask what is being counted before naming a first, and to read the sentence under a headline. They learn to go to the office that issued a document, and to set two or three witnesses side by side so an honest slip shows itself. They give their due to the people one name leaves out, Bertha Benz above all. They write the finding in order with a record under every sentence. And they hold every invention under the One who made the iron and wrote the laws it obeys. The Library of Congress's own revision is the course's picture of a community coming to understand its past.

## Decision

The car is taught as the History department's third course, a second case for the Level-1 craft, and not as a Living Lesson. The witness, the timeline and the worked-case gates live in the History department, and his "1 level" names that course. Nine record hosts join `HISTORY_RECORD_HOSTS`, each annotated with the probe runs that read it, and the witness now reads this course on every push to it. The one genuinely open question, which first deserves the single word "inventor", is stated narrowly as a question of definition, exactly as the Library of Congress now states it (DR-0100). Every dated fact is stated plainly with its record.

## Verification

- `car-research-course.test.js`:
  - the four competencies in order, and the whole shape on every lesson;
  - the meta's limit, Word-first, both spans verbatim, and the session adding to 65 minutes;
  - every quoted span in the whole module verbatim, case-sensitive; no elision; Yahweh in our voice in every band, and "the LORD" only inside quotations; 17 anchors that all resolve;
  - four bands per lesson under the department's ceilings and floors, none a near copy, rendering without loss, two verses each;
  - each lesson's own finding pinned: the 2009 and 2024 Library wording; the transposed number, the four witnesses and the computed 277 days; everyone the single answer leaves out, with the patent office's words on Bertha Benz; the $850, the 93 minutes and the four Higher Education verses;
  - no both-sides language, and the open question named as definition;
  - a worked case with all ten parts and no fault in every lesson, the claim on a probed host, and the event on the lesson's own timeline;
  - at least three voices and a faultless timeline per lesson, every source on a probed and listed host, the two refusing pages read only from the Wayback Machine, and one course timeline from 1769 to 2026;
  - proven to catch: an unlisted host, an unnamed year, an elided voice and a wrong-case verse are each refused;
  - catalog, department of three, shelves with the real count, schedule, progress, export, and tutor posture.
- `history-voices-witness.yml` runs on the push that carries the course and reads every voice and dated phrase from its page.
- The catalog-walking suites (every test that reads `LEARN_CATALOG`, the crosslist or the record hosts) run green with the course mounted; lint and the gates run before the push.
- `re-review: 2026-10-23`:
  - read the course on the live app in each band;
  - re-run the witness;
  - if Darrell meant cars that drive themselves rather than the motor car, add that case as lesson five on the same craft.
