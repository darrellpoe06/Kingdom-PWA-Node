# DR-0516 — A course has one home and many shelves: how we differentiate when everything integrates

- **Status:** accepted
- **Tier:** B (how the whole school is organised)
- **Type:** architecture
- **Date:** 2026-09-18
- **Scope:** `app/src/lib/learn-crosslist.js` (course-level cross-listing: `COURSE_CROSS_LISTINGS` + five resolvers), `app/src/components/ChurchLearn.jsx` (the shelf renders them, and the department line counts them), `app/src/__tests__/course-crosslist.test.js` (new, 16 checks)
- **Principles:** ONE-HOME-ONE-CREDIT (DR-0447 / DR-0448), DERIVED-NEVER-PAINTED (DR-0121), REALITY-TRACE (DR-0061), VERIFICATION-DOCTRINE (DR-0076 §2 §3)
- **Grounds:** Darrell 2026-09-18, reading the live picker

## The report

> *"Why are the business courses that have business content and foundational insights and strategies and situational analysis Word first in Business however we only show one business course... each one could be considered a business course as well as another because it is integration of it throughout how do we need to differentiate between the following?"*

He is right, and it is measurable. **31 self-paced courses across 9 departments, and Business holds exactly one** — Rent to Own. Meanwhile at least fourteen others are business content by any honest reading:

| home department | courses that also serve Business |
|---|---|
| Real Estate | all **eight** — property principle, buying terms, leasing, maintenance and trades, partnerships, financing, taxes and records, management |
| Kingdom Life & Stewardship | kingdom economics, legacy provisions, handed forward |
| Project Management | project management, software project management |
| Development | development |

A reader standing in Business could see none of it.

## The cause, which is structural rather than editorial

`meta.category` is a **single string**. A course therefore lives on exactly one shelf, and a curriculum whose entire design is integration cannot be described by a single string. His question is not a taxonomy quibble; it is the data model being narrower than the content.

**This exact wall was hit one level down and already answered.** DR-0447/0448 addressed it for LESSONS — *"can we use cross-referenced lessons that get credited either way"* — with a pointer: one home, one credit, many shelves. That mechanism has been live since 2026-09-16 and has never existed for whole courses. This is that answer at course scale.

## How we differentiate — the rule, so this never becomes a taste argument

**HOME is what a course FORMS.** Ask one question, and it has one answer: *if a person completed only this course, what could he now DO that he could not before?* That answer names one discipline, and that discipline is the home.

- Rent to Own forms an operator who can run a rent-to-own business.
- Financing forms an owner who can read a note and name his position.
- Kingdom Economics forms a believer who understands ownership, production and circulation.

All three are business. **None of them is either of the others**, which is precisely why "it is all business content" cannot be the organising principle — it is true and it does not distinguish.

**CROSS-LISTING is what a course SERVES.** Everything else it genuinely contributes to, declared as a pointer, one line each, **with its reason written down** — because which discipline a course serves is a judgement, and a judgement belongs in the record rather than in a title match.

## The invariant that makes it safe

A cross-listed course is a **POINTER, never a copy**. It keeps one home, one count, one credit, one place record. Tapping it on the Business shelf opens it in its own course, in the full catalog, exactly where it lives — so there was never a second identity to credit.

And every gathered row **names its home out loud**: "Taught in Real Estate · 8 lessons". The shelf shows you the course and tells you where it actually lives, rather than implying it belongs to two departments.

## Proven to catch

16 checks. The gates: a declaration naming a course the catalog does not carry fails the build; a course cross-listed into the department that is already its home is reported (the one mistake this file exists to prevent); a thin reason fails; a duplicate on one shelf fails; and every rendered field is asserted to be read from the live course rather than retyped.

The three deliberate breaks: an unmounted course, a self-listing, and a retyped title.

**And the invariant is asserted as a property, not as a number — after my first draft got the number wrong.** I pinned `37 / 603` there, copied from the neighbouring crosslist test, and it failed: that test counts the catalog through a different filter, and this one sees 31 self-paced rows. A magic number carried in from somewhere else is not a measurement. The check now asserts what actually matters and cannot drift: **no gathered course appears in the shelf's own course list, and the shelf's lesson total is the sum of its own courses only.**

A second draft error is worth recording for the same reason: the check first passed the raw registry to `learnDepartments`, which sums `course.schedule` — and registry rows carry a *builder*, not a schedule, so every department reported zero lessons. It must be given mounted rows the way the app gives them.

## What this does not do

It does not re-home anything. Real Estate keeps its eight courses and its count; Business keeps Rent to Own as the only course it *forms*. Nothing moves. What changes is what a reader standing in Business can find — which was the whole report.

**Open for the next pass, not silently dropped:** the reverse direction is unbuilt. Rent to Own plainly serves Real Estate, and the Word & The Way arguably serves every shelf in the school. Those declarations are not written yet because each one needs the same one-sentence test applied honestly rather than a sweep. **re-review: 2026-09-25.**
