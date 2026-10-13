# DR-0448 — A.I. understanding is gathered from the whole curriculum as pointers, so a lesson has one home and one credit

- **status:** accepted
- **date:** 2026-09-16
- **extends:** DR-0447 (the department's count), DR-0432 (Learn is a school of derived departments), DR-0149 (a course declares its own category), DR-0121 (derived, never a hand-kept list), DR-0076 (verification doctrine), DR-0236 (nothing buildable waits)

## What he asked for

Darrell, 2026-09-16:

> "Most people want Ai understanding built in their curriculum also make the tab after eternal algorithms"

and, earlier the same day:

> "can we use cross-referenced lessons that get credited either way... it can be an Ai course that is an elective or a mandatory course for this etc"

DR-0447 answered the *count* — the A.I. The Way department really does hold
three courses and 35 lessons, not one course and eight — and placed its tab
immediately after The Eternal Algorithms. **A correct count is not what he
asked for.** He asked for A.I. understanding to be *in* the curriculum.

## What was actually there (measured, DR-0076 §4)

Scanning all 284 lesson records across every mounted course for A.I. subject
matter, the curriculum teaches it in **nine places outside the A.I.
department**:

| home course | its department | lesson |
|---|---|---|
| Living Lessons | The Word & The Way | the tower, the race, and the sovereign — discernment in the age of A.I. |
| Living Lessons | The Word & The Way | made in His image, we make — and why A.I. is not a soul |
| Living Lessons | The Word & The Way | hidden vs known — the needs no machine can meet |
| Living Lessons | The Word & The Way | watch and be ready — a sober word on A.I. and prophecy |
| Living Lessons | The Word & The Way | the build we are going for, and why — a school, Yahweh first |
| Data Systems | Serve the House | meet Ari — the sovereign A.I. |
| Data Systems | Serve the House | the GPU node — local A.I. at the church |
| The Infrastructure | Serve the House | our own A.I. — Ollama and the models on our hardware |
| The Broadcast | Serve the House | A.I. that serves the broadcast — and how it really works |

A reader standing in the A.I. department could see **none** of it. The
understanding was in the curriculum; the curriculum had no way to say so.

## Decisions

**a. A cross-listing is a POINTER, never a copy.** A lesson has exactly one
home course. A department may *gather* a lesson taught elsewhere, and opening
it from that shelf opens it **in its home course** — same lesson, same session
flow, same tutor, same place record. This is what makes "credited either way"
true **by construction** rather than by mechanism: `learn-resume.js` keys a
place `{ courseKey, lessonId }`, and since the cross-listing creates no second
`courseKey`, there is no second identity to credit and nothing to reconcile.
No migration, no dual-write, no read-both. Proven on the surface: opening the
gathered Tower lesson from inside A.I. The Way writes a place record naming
`living-lessons`.

**b. Which lessons teach A.I. understanding is a DECISION, written down.** Nine
declarations in `learn-crosslist.js`, one line each **with its reason**. This
is deliberately not a title regex: "machine", "data" and "model" pull in a
lesson about reasoning in any language and a parable about a jar of secrets,
and a shelf that gathers the wrong lessons is worse than one that gathers none.
What is *not* hand-kept is the lesson: every title, course name, unit label and
anchor reference on the shelf is read live from the mounted course (DR-0121),
so a lesson retitled tomorrow reads correctly on the shelf with no edit here.

**c. Nothing is double-counted, anywhere.** The gathered lessons are not added
to the department's lesson count or the program's: the program line reads
25 courses · 486 lessons before and after, and the department's tab says
"AI · 3 courses · 35 lessons · 9 more taught across the curriculum" — two
honest numbers rather than one blended one. A cross-listing naming a lesson
that already lives in the department it is shelved into is rejected by a gate.

## Proven to catch (DR-0076 §3)

- **A renamed or removed lesson id** — `missingCrossListings()` against the live
  index. Appending `-XX` to one declared id turns **6 assertions red**, naming
  the course and lesson to fix. Without this gate the shelf would render a row
  that opens nothing.
- **A lesson cross-listed into its own department** — checked against the
  registry's declared categories, so the same lesson can never be counted twice.
- **The totals moving** — 25 courses / 486 lessons asserted directly, and again
  as the sum of every department's own lessons.
- **The shelf on the real component tree** — mounted `ChurchLearn`, clicked the
  A.I. The Way tab: nine rows, each naming its home course, the summary line
  saying how many are gathered, and a click landing the lesson in its home
  course with the place record to prove the credit. A department declaring none
  renders no shelf, and the whole-catalog tab renders none.

## What is NOT closed here

- **Elective or mandatory.** Darrell's third clause. Learn has no requirement
  model at all — no program requirements, no credit hours, no "this counts
  toward that." Marking a course elective today would be a label with nothing
  behind it (DR-0121: never painted). The shelf's heading carries the honest
  version for now: these are taught in their own courses and gathered here.
  **re-review: 2026-10-14** — design the requirement model, or say why not.
- **Other departments.** Only A.I. The Way declares cross-listings. The
  machinery is per-department and takes no code to extend; the *decision* of
  which lessons belong is per-department work. Mathematics, The Word & The Way
  and Serve the House are candidates. **re-review: 2026-10-21.**
