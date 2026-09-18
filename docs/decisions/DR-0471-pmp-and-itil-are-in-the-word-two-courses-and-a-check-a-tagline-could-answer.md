# DR-0471 — PMP and ITIL are in the Word: two courses, and a check a tagline could answer

- **Status:** accepted
- **Tier:** B (two new learner-facing courses and a new Learn department tab; they make claims about an industry body of knowledge and about this house's own outages)
- **Date:** 2026-09-18
- **Type:** content
- **Scope:** `app/src/lib/project-management-course.js` (new, 10 lessons), `app/src/lib/software-project-management-course.js` (new, 10 lessons), `app/src/lib/learn-catalog.js` (both registered; a new `Project Management` category), `app/src/__tests__/project-management-courses.test.js` (new, 46 checks)
- **Principles:** WORD-FIRST (DR-0127), TYPOGRAPHIC-THEOLOGY + the covenant-name rule (DR-0210), VERIFICATION-DOCTRINE (DR-0076 §3 proven-to-catch, §8 honest uncertainty), REALITY-TRACE (DR-0061 / P15), SPOKEN-TEACHINGS-ARE-BUILD-INPUT, DO-THE-WORK (DR-0111)
- **Grounds:** DR-0432 (a department is DERIVED from `meta.category`; a new category opens a new tab on the next build), DR-0149 (the category field), DR-0121 (counts derived at render, never static), DR-0470 (L173, whose "naming is faster than learning" is this course's pedagogy), DR-0107 / DR-0125 / DR-0075 / DR-0076 (the software course's case studies are these records)

## Why this exists

Darrell, 2026-09-17, spoken into this channel:

> "We should also do courses on project management, and that is anything from building and projects with properties... The church, we've also flipped houses with the church. So just understanding exactly what, who should work, when they should work... what tasks to associate with these people versus these people, what skill sets we need, all those things, counting those costs before we get involved, and then walking through, having timeline and milestones, and meetings to secure quality subject matter experts in order for them to give us the details associated with the things that we need to be able to see clearly, and being able to get down to the root cause of what we need to do and what we don't need to do. So PMP, ITIL, you know, processes."

And, in the same session, the frame that governs both courses:

> "But I do believe PMP and ITIL are in the word of God... I was able to use the Lord's perspectives to make them easier for me to comprehend and therefore quicker for me to comprehend... the algorithms in the Bible are more rigorous than any algorithm and they're telling you about you."

## The decision

### a. THE ORDERING IS THE PEDAGOGY, AND IT IS THE OPPOSITE OF PMP-WITH-VERSES

The easy build is a project-management course with a verse stapled to each module. His claim is the reverse, and it is a stronger claim: **the discipline is in the Word already — with a worked case and a named consequence — and the standard is a VOCABULARY for a shape the Word gave first.**

So every lesson teaches the Word's own case, and THEN names what the industry calls it:

| the Word's case | what the industry calls it |
|---|---|
| the tower counted before it is begun, with mockery named as the consequence (Luke 14:28-30) | business case, feasibility, the commit gate |
| Jethro: *"The thing that thou doest is not good"*, tiers of thousands/hundreds/fifties/tens, and one escalation rule (Exodus 18) | span of control, RACI, escalation path |
| Bezaleel called **by name** with his competencies itemised — and the teaching given with the skill (Exodus 31; 35:34) | skills matrix, bus-factor risk, knowledge transfer |
| Nehemiah declining four invitations because *"the work cease"* (Nehemiah 6:3) | scope control, scope creep |
| the wall finished *"in fifty and two days"* (Nehemiah 6:15) | schedule baseline reported against actuals |
| the multitude of counsellors by which purposes are **established** (Proverbs 11:14; 15:22; 24:6) | expert judgment, stakeholder engagement |
| the watch set day and night, and the watchman held liable for silence (Nehemiah 4:9; Ezekiel 33:6) | risk register: risk, owner, trigger |
| the plumbline held in His own hand (Amos 7:7-8) | quality assurance / control, acceptance criteria |
| the backward look at the plough (Luke 9:62; Philippians 3:13) | sunk cost, stage gate |
| the register gathered after the wall (Nehemiah 7:5; Habakkuk 2:2) | closeout, handover, lessons learned |

That ordering is checked rather than asserted: the session flow must read the anchor, then work the Word's own case, and only then name the industry term — and the tutor posture is held to the same order.

**This is L173's mechanism applied as curriculum design.** Naming is faster than learning: a man who already holds covenant, office, order, measure and stewardship as live categories meets a standard's vocabulary as a new name for a shape he already carries. That is what he reported, and it is why the ordering is not decoration.

### b. A SECOND COURSE RATHER THAN MORE LESSONS, BECAUSE SOFTWARE BREAKS DIFFERENTLY

A wall out of plumb is visible; a defect is not. A building is finished once; software is released continuously, and the release is the moment most houses stop watching. So the software course runs the same method on the failures specific to software — and **its case studies are this house's own recorded outages rather than invented examples**, because a course on delivery taught from hypotheticals in a repository that has real scars would be the weaker teaching AND an untraceable claim:

- **DR-0107** — enabling the auto-merge lane took poetech.us stale for ~9 hours while every CI check was green, because a merge authored with the automation's own token raises no push event, so the deploy silently stopped firing. The identical gap was already documented in the same file.
- **DR-0125** — every safeguard watched the PIPELINE and not one ever made an HTTP request to the product, so whether the site was up had no measured answer at all.
- **DR-0076 §3** — a gate that always passes is itself a lie, so a gate ships only once it is shown to CATCH the break.
- **DR-0075** — anything left rough carries a stated why AND a re-review date; silence is never consent to stall.

Each citation is pinned by a check, with its mechanism and its cost, so a future edit cannot soften a real outage into a vague anecdote.

### c. THE OVER-CLAIM BOTH COURSES REFUSE OUT LOUD

It would be easy, and flattering to the frame, to imply that studying the Word raises a PMP or ITIL exam score, shortens a cycle, or lowers a defect rate. **Nothing measured any of that.** Both headers state the refusal, both tutor postures are forbidden from making the claim, and checks hold all four — because a refusal in a source comment that the tutor can talk past is not a refusal: the learner meets the tutor, not the comment.

What IS claimed: what the verses say, what the named decision records recorded, and what he reported about his own comprehension.

## The finding: A CHECK A TAGLINE COULD ANSWER

The seventeenth face of the recurring finding, and the most instructive one yet, because the check *looked* like exactly the right check.

A whole describe block asserted that each item on his spoken list is taught — counting the cost, who should work, what skill sets, milestones, the SME meeting, seeing clearly, root cause, PMP, ITIL. It pooled **both courses' lesson text AND both courses' metas** into one haystack and matched patterns against it.

The break harness deleted `skills matrix` from every lesson. **The check stayed green** — because `skill sets` survives in the META AUDIENCE. A marketing line was answering for a lesson. Deleting ITIL from the software course also stayed green, because the companion course names it.

**A check that cannot say WHERE something is taught does not establish that it is taught.** Each ask is now assigned to the course that owes it and matched against lesson text only, with the meta excluded on purpose — plus a check that fails specifically when something is advertised in the meta and taught in no lesson.

Three more real weaknesses fell out of the same pass:

1. **The refusal checks read the WHOLE source file**, so deleting the refusal from the header still passed — the tutor posture at the bottom of the same file says "none of that was measured" and satisfied the pattern. Two separate obligations (a maintainer meets the header; a reader meets the tutor) were sharing one check. Now the header is sliced out and checked alone.
2. **`/unknown/i` as a claim.** The rule "unknown must never be reported as fine" could be deleted and the check stayed green, because "unknown" appears nine other times in that file — the honest unknown of estimation, unknown detection capability, unknown freshness. A single common word is not a claim.
3. **`/token/i`, plus an alternation with a vague second branch.** The mechanism IS the lesson, so it is now required whole: a token-authored merge raises no push event.

And one more about the checks themselves: **the header refusal check failed against a header that plainly carries the refusal**, because the header is a wrapped comment and the phrase straddles a line break as `exam\n// score`. It had only ever passed because the unwrapped tutor line was in scope. The header is now normalised — comment markers stripped, whitespace collapsed — before matching.

## The evidence

- **Both courses: 10 lessons each, every quoted span verbatim.** Project Management: 49 quoted spans. Software Project Management: 29. **Every one verbatim against the local KJV corpus under STRICT comparison** (whitespace-only; apostrophes never normalised), **0 ellipses, 0 spans quoting a verse the lesson does not reference, and every anchor reference resolves.**
- **The first audit of these files found 18 spans where quotation marks dressed MY words as Scripture** — `we can start this`, `progressive elaboration`, `Framing in progress`, `done right`, `is the site up?`. All dequoted; a check now stops the next one.
- **Three more were verbatim KJV fragments sitting UNQUOTED in our prose**, which made them read as our voice using the generic name — *able men, such as fear God, men of truth, hating covetousness* and *filled with the spirit of God*. Quoting them with their references fixed the attribution and the covenant-name rule in one move.
- **Covenant name:** Project Management 9 uses of Yahweh in our own prose, Software Project Management 5, **zero generic-name uses in our own authored voice in either**, every quotation's own "God" and "the LORD" left exactly as the corpus carries it.
- **And my own scratch audit had a blind spot the gate caught:** it searched with `/.{50}\bGod\b.{50}/`, requiring 50 characters on each side, so a match near a field boundary was invisible. It reported zero while the gate reported three. The gate was right. Recorded because the instrument being wrong is exactly what DR-0076 §3 is about, and here it was my own.
- **Observed, not inferred (DR-0061):** the `learn-organize` derivation was run against the live catalog and printed the tab strip — a new department `PM — Project Management` now exists carrying both courses. `learn-catalog-render.test.jsx` clicks every registered course in a real render and passes, which is the existing gate against "built but not surfaced."
- **The gate:** 46 checks, green.
- **Proven-to-catch:** 54 targeted breaks in two passes. Pass 1 ran 40 and caught 24; of the sixteen that did not land, **five were real gate weaknesses** (above) and **nine were my own badly-aimed breaks** — three more case-sensitivity misses, four partial replacements leaving an alternation's other branch standing, one that never crossed a floor, one that left the phrase in a sibling field. Pass 2 re-aimed everything as regexes that remove EVERY phrasing able to answer the claim, and exercised the five tightened checks: **14 of 14 caught, 0 missed.**

## What is left open

He said, in the same breath: *"as many lessons in those as we can think of, and I will of course add more to that once we begin."* Twenty lessons is the opening, not the ceiling, and both courses carry an interest rail that asks the reader which part is hardest — for the general course, the project they are carrying; for the software course, what they cannot currently prove about their own system. Those answers are the intended source of the next lessons.

Not built here, and named rather than left implicit: **neither course has age bands.** The Living Lessons series authors every band in full (DR-0418) and these two carry the two-level `teen` / `senior` shape the other topic courses use. Whether a project-management course needs a child band is a real question and not one to answer by default. **`re-review: 2026-11-18`** — after he has read them and added the lessons he said he would add, since what he adds will show whether the audience is wider than the shape assumes.
