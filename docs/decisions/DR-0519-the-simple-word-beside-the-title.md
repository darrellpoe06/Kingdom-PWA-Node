# DR-0519 — The simple word beside the title: connection, never rename

- **Status:** accepted
- **Date:** 2026-09-19
- **Type:** architecture
- **Relates to:** DR-0516 (one home, many shelves — the other half of "how does a reader find this"), DR-0121 (a department exists because a course declares it)

## The ask, and the correction that defines it

Darrell, 2026-09-19, in three messages that only make sense read together:

> "Even courses on Money... course titles pulls people into the lessons and courses... so kids and adults can learn however we need to use terms they already understand so words that are to big or not usually used will not be understood unless we also use them in context and also use words that are in the current vocabulary..."

> "Not saying don't use the same words we are just thinking about broad connections made by simple word choices..."

> "I like the current titles they pull me in..."

The first message reads like a request to rename things, and that is how it was first taken — a retitle of the eleven courses whose titles carry house vocabulary was drafted. **The second and third messages corrected it before a line of that shipped, and the correction IS the design: the titles stay exactly as they are, and the everyday word rides alongside.**

## The premise, stated so a wrong one is cheap (Reality-Trace step 4)

Both of these are true at the same time and neither cancels the other:

- *"Kingdom Economics: Stewardship, Ownership & the Body's Economic Witness"* is a title that pulls Darrell in and is worth keeping.
- It contains **no word a child, or a newcomer, would ever type looking for it.** Not money. Not debt. Not saving.

A rename would have destroyed the first to fix the second. Adding a layer fixes the second and leaves the first alone.

## Measured before building

Across the 31 catalog courses, the titles carrying terms outside everyday vocabulary: stewardship, sovereign, provisions, discernment, the Body, 3rd-Dimension Witness, prophetic, functions, office. Eleven titles. **Zero of the 37 mounted courses could be reached by the plain word for what they teach** — `money` found nothing in Kingdom Economics, `sleep` found nothing in Healthy Living, `jobs` found nothing in The Functions of the House.

## The decision

One declaration per course in **`app/src/lib/learn-plain-words.js`** — a registry, not thirty-seven edits scattered across course files — doing two jobs that must never drift apart:

1. **CONNECTION.** The words are folded into `buildLessonIndex`'s body haystack for every lesson of the course, so the live search finds Kingdom Economics when somebody types `money`.
2. **VOCABULARY.** The same words render under the open course as an **In plain words** line, which is the house term and the everyday term meeting in one glance — which is exactly how the bigger word gets learned *in context*, as he asked, rather than looked up.

One declaration drives both, so what a reader sees and what reaches them can never become two things that disagree.

**The rules every row obeys, enforced rather than remembered:** at least three words; every word drawn from a declared `EVERYDAY_WORDS` list; at least one word that appears **nowhere in the course's own title**, because a row that only echoes the title adds no connection at all.

`EVERYDAY_WORDS` is a **declared** list, not a measured one, and the record says so plainly (DR-0076 §8). A word belongs there when a ten-year-old would use it without being taught it. When a course cannot be described from that list, **the fix is a simpler word, never adding the house word to the list** — the gate says so in its own failure message, because the cheapest way to defeat this rule is to widen the list until it means nothing.

## Gates

**`course-plain-words.test.js` — 20 checks.** Four break the measure on purpose and require it to report: a course with no words, a row that only echoes its title, a registry key no mounted course claims, and a search term nobody declared returning nothing (so a green search result is not the search matching everything).

The connection is proven **through the live search**, not asserted: every one of the ~200 declared words is run through `searchLessons` against the real mounted index and must return its own course. Zero dead words.

**`the-plain-word-is-under-the-title.test.jsx` — 3 checks** on the REAL component tree (DR-0076 §6): opening Kingdom Economics renders `money · debt · giving · saving · business · work`; the `<h2>` still reads *Kingdom Economics* and still contains no word from that line; and the line follows the reader to the next course rather than sticking.

**The additive claim is itself gated:** the registry holds no title field, and a check asserts no course title string appears anywhere in it. If a future edit tries to turn this into a rename, it fails there.

## What this does NOT do

- It does not change one course title. That was asked for and then withdrawn, and the withdrawal is the decision.
- It does not touch lesson titles.
- It does not reorder or re-file any course. Departments are still declared by `meta.category` (DR-0121) and gathered by DR-0516.

## Follow-on

- **A Banking course.** Darrell named the gap in the same session: *"Banking courses etc..."* — accounts, interest, credit, what a bank actually does with a deposit, and what the Word says about lending. The plain words are already reserved in `EVERYDAY_WORDS` (`bank`, `banking`, `interest`, `saving`). `re-review: 2026-09-22`.
- **The plain word on the picker row itself.** Today the line renders under the open course; the `<select>` option still shows only code · title · lesson count, so a reader scanning the list has not met the plain word yet. Deliberate for now — option text is a single line on a phone and three more words there costs the title its readability. `re-review: 2026-09-26`.
