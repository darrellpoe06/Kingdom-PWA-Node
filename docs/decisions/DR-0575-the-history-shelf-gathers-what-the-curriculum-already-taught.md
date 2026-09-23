# DR-0575 — The History shelf gathers what the curriculum already taught

- **Status:** accepted
- **Tier:** A
- **Type:** fix
- **Date:** 2026-09-23
- **Scope:** `app/src/lib/learn-crosslist.js` (seventeen lesson-level pointers onto the History department, each with its measured reason); `app/src/__tests__/learn-crosslist.test.js` (five new checks)
- **Principles:** DR-0447 / DR-0448 (a cross-listing is a pointer, never a copy), DR-0516 (one home, many shelves), DR-0540 (every course declares its shelves), VERIFICATION-DOCTRINE (DR-0076 §4: measure, don't claim), DR-0100 (documented damage is stated plainly)
- **Grounds:** Darrell, 2026-09-23, the evening DR-0572 opened the department: *"History section doesn't have any of the historical events we currently have... why not?!"*

---

## Why not

Because a lesson has one `category` string. DR-0572 opened the History department with its one course, and the department showed exactly that course, while the curriculum had been teaching dated American and world history for months — the Pullman porters (L135, Labor Day), Greenwood (Kingdom Economics 7), the 1965 Act (World Issues), the 1921 Evanston ordinance (World Issues), redlining written into federal manuals (Kingdom Economics 5), the patent law that barred the enslaved (Prophetic Voices) — each shelved where it was first taught and invisible from History. It is the same wall DR-0447 hit for A.I. and DR-0516 hit for Business, and it has the same answer: a pointer, never a copy.

## How the shelf was found

Not by title-matching. Every mounted lesson was scanned for distinct dated years and for a fixed history vocabulary (slavery, emancipation, reconstruction, jim crow, redlining, treaty, constitution, reparations, civil war, and so on). **103 lessons** carried three or more distinct years or four or more of those words. A keyword count is not a shelf — Living Lessons scores against everything by volume — so each candidate's own big idea was then read, and only lessons whose **subject** is a documented event or period were declared. Lessons that cite a date in passing (a 2026 filing; a sermon quoted for its doctrine) stay off. Every dated claim in a reason was then checked against the lesson's own text before it was written; one that the lesson did not carry (a "1954 onward" for Diop) was corrected to what the lesson does say (Cairo, 1974).

**Seventeen pointers**, from five courses in two departments outside History (The Word & The Way; Kingdom Life & Stewardship):

| Home course | Lessons |
|---|---|
| Living Lessons | L135 the Pullman porters · L90 the vote from the Three-Fifths Compromise · L134 the record of Black invention · L40 Assyria's conquest as real history · L127 the firsts of each century |
| World Issues | Evanston 1921 · two aftermaths on one scale · the 1965 Act · the prison industrial complex |
| Prophetic Voices | the stolen patent record · Dr. Price 1997 · Dr. Diop · Dr. Obenga · Dr. Williams |
| Kingdom Economics | the engineered barriers · Greenwood 1921 |
| Legacy Provisions | how we got here (the trust from 1535) |

The reason beside each names what the measurement returned (history terms, the year span), so the shelf is data a reader can check, not taste.

## What does not move

One home, one credit, one place record. The program totals are pinned before and after (47 courses / 695 lessons, unchanged); opening a lesson from History opens it in its home course, exactly as DR-0448's A.I. shelf does. The department line now reads "· 17 more lessons taught across the curriculum" from the same live count.

## Verification

Five new checks: at least seventeen rows resolve and equal the declared count; they draw from at least five courses in the two departments other than History and never from `history-truth`; the five events he would look for first are present by id; every reason carries `(measured:`; the department's live count equals the resolved rows. The existing gates hold: no missing pointer, no self-listing, no duplicate, totals unchanged.

## Limits, stated

1. **The scan's vocabulary is fixed and English.** A lesson teaching history in words outside that list (a place name, a person) could be missed. The 103-candidate list was read whole; a lesson below both thresholds was not. `re-review: 2026-10-19`, with the HOME_ONLY read already dated there.
2. **Seventeen is what the curriculum holds today.** A new history-bearing lesson added elsewhere does not declare itself onto this shelf — the DR-0540 declaration gate is course-level, not lesson-level. The lesson-level equivalent (a lesson that measures history and declares no shelf fails the build) is the next gate. `re-review: 2026-10-19`.
