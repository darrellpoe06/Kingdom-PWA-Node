# DR-0432 — Learn is a school: departments derived from the catalog, Courses as a tab, Mathematics as a department, the Eternal Algorithms moved inside Learn

- **Date:** 2026-09-15
- **Type:** product · navigation · governance review
- **Status:** decided and shipped (this push)
- **Declared by:** Darrell, 2026-09-15, in four messages inside one working session
- **Pairs with:** DR-0149 (derived categories, grouped picker), DR-0121 (no static data), DR-0116 (sideways sub-tabs, max three levels), DR-0126 (Learn carries the Eternal Algorithms as processing courses), DR-0318 (the catalog opens without choosing), DR-0431 (Little Learners), DR-0433 (Mathematics), DR-0434 (L163), DR-0076 (verify), DR-0111 (do not re-ask), DR-0236 (nothing waits)

## What Darrell said

1. *"What is the timeline on the mathematics section and maybe we should put the Eternal Algorithms inside learn and add Mathematics as a Tab or the main tab in that sliding sub-tab inside Learn? Flexibility with rigorous control of the system and processes... Identify: Missing information · Assumptions · Risks · Dependencies · Decisions requiring human approval · Opportunities · Constraints · DRs review fully · Never guessed · Always data driven · Timeline?"*
2. *"Add the Courses as a tab with lessons depending on the courses as usual... making it look like a college and or elementary school educational program systemic science of intuitive engineering and technology and development of technology and people with Yahweh knowledge and creating hybrid development skills integrated functions to improve their growth and development and skills and experiences equally with stakeholders supporting their children's education. Lesson also to explain the build we are going for and why we are going for it according to the Word..."*
3. *"Moving current tabs around for functionality and flow.... etc.."*
4. *"Modules so it should be able to be done..."*

## The review he asked for (run before the build, recorded here — never guessed, every line cites the repo)

**Missing information (found, then closed):**
- There was **no mathematics section and no timeline for one** anywhere in `docs/` (grep for `mathematics` returned only two incidental prose hits: `docs/05-financial-os/CALC-INVENTORY.md:125`, `docs/00-foundations/_root/UX-PATTERNS.md:445`). The only dated mathematics commitment was DR-0431's slice-2 re-review (2026-09-22) for Little Learners, whose four counting lessons were the whole of "math" in the app. **Closed by DR-0433:** a Mathematics course exists as of this push, with the timeline below.
- "Eternal Algorithms" was **two things**: a top-level Church chip and route (`app/src/surfaces.js:110`, chip at `app/src/poe-financial-mvp-v28.jsx:4434`, render at `:4544`) AND derived "Deep Processing" courses already inside Learn (`app/src/lib/eternal-algorithms-course.js:81`, mounted `app/src/components/ChurchLearn.jsx:2706`, DR-0126). Half of what he asked for already existed.
- The "sliding sub-tab inside Learn" he named was, in the shipped code, the **course's sections** (`SectionTabs variant="sub"`, `ChurchLearn.jsx:2499`); courses themselves were a grouped native `<select>` (`ChurchLearn.jsx:2838`). There was no course-level tab row. **Closed:** there is one now (below).
- The Living-Lessons-default rule (Darrell 2026-09-11) lived only in code and a test (`ChurchLearn.jsx:2713-2721`; `church-learn-play-and-courses.test.jsx:183-188`) with **no DR**. **Recorded here** as a standing decision: the Courses tab opens on Living Lessons; a device that has chosen keeps its choice.

**Assumptions (stated, then checked):**
- That a "department" can be derived from the one registry rather than hand-listed. **Checked:** every `LEARN_CATALOG` entry already declares `meta.category` (DR-0149); the Eternal family is key-detectable (`eternal-*`). Derivation needed no new data.
- That the DOM-order gates (picker first; lesson index next) would survive a tab row above the picker. **Checked by running them:** `learn-course-picker-is-first`, `learn-lesson-index-is-next`, `learn-catalog-render`, `learn-resume-render`, `church-learn-render`, `church-learn-hostile-data`, `church-learn-play-and-courses` all green after the change.

**Risks (named, with the control):**
- A department tab with **no real content** would be a painted surface (DR-0061 / P15). Control: departments exist only when a course carries the category; the Mathematics tab was built only after a real Mathematics course existed (DR-0433).
- **Dead links** to the retired `eternal-algorithms` Church route (help content, Healthy Living's launch target, Scripture Library's "open algorithms", `nav-history` whitelist). Control: the route still resolves — it now opens Learn on the Eternal Algorithms department (`initialDept`), proven in `learn-is-a-school.test.jsx`; a stale department id falls back to the whole catalog (proven-to-catch).
- **A single-course department hiding its lessons** (the picker only renders with 2+ courses). Control: the lesson index renders for the whole catalog regardless; proven for Mathematics in the same test.
- **Drift already present:** DR-0149 says the picker groups by derived category; the shipped `organizeCourses` grouped only deep-vs-rest. Control: fixed in this push (`learn-organize.js`), with `learn-organize.test.js` rewritten to the DR-0149 contract.

**Dependencies:** `learn-organize.js` (derivation) → `ChurchLearn.jsx` (tab row, narrowing, catalog line, lazy study mount) → host (`poe-financial-mvp-v28.jsx`: chip retired, route mapped, props passed) → `learn-catalog.js` (the Mathematics entry) → `mathematics-class.js` (DR-0433) → the school lesson L163 (DR-0434). Nothing outside the app changed; no schema, no network policy, no NAS service.

**Decisions requiring human approval — surfaced with defaults, and how each was resolved:**
1. *Mathematics as the MAIN (default) tab* would reverse his own 2026-09-11 Living-Lessons-default directive (a front-door, Tier B change). **Default taken:** Courses (all, Living Lessons open) stays the default; Mathematics is a department tab one tap away. Re-review if he says otherwise.
2. *Moving the Eternal Algorithms chip out of the Church strip* is a front-door navigation change. **Resolved by him** in message 3 (*"Moving current tabs around for functionality and flow"*): moved, not duplicated; the old route still lands on the department.
3. *Scope of the Mathematics track* (ages, strands, sequence). **Default taken from his own words in DR-0431** (*"math that has the Word, totally Word based... the math of the Bible... qualitative and quantitative ways of math, like engineering"*): slice 1 is Elementary, eight strands (DR-0433). Later slices are his to shape via the want-more button and the dated re-review.

**Opportunities:** the department model gives every future subject (engineering, the sciences "through His lens", a trade) a home the moment a course declares its category; course codes make the catalog legible to a parent who has seen a college catalog; the `programLevel` field lets Elementary and College sit in one program without a second registry.

**Constraints:** DR-0116's three levels (app nav → Church row → Learn's department row; the course sections remain the chip row inside the panel, unchanged); DR-0121 (nothing hand-sorted — departments are ordered by how much they teach, derived); the reader must never lose the picker-first order (gated); no emoji as icons (consistency guard); everything on the house's own machines.

**DRs reviewed fully:** DR-0116, DR-0121, DR-0126, DR-0127, DR-0149, DR-0318, DR-0417, DR-0418, DR-0431, DR-0061, DR-0076, DR-0111, DR-0236 (each cited above where it bound the build).

## The decision

1. **Learn is one program of departments.** A department is DERIVED from the catalog: the course's own `meta.category`, with the Eternal-Algorithms family detected by key; a course with no category sits in General Studies. Departments are ordered by total lessons (derived), never hand-sorted (`app/src/lib/learn-organize.js` — `courseDepartment`, `learnDepartments`, `departmentCode`, `organizeCourses`).
2. **A row of section tabs across the top of Learn**: Courses (the whole catalog, as usual, open by default on Living Lessons) and one tab per department. A department narrows the picker, the finder and the shelf to its courses; the open course follows; the lessons depend on the course as usual (`ChurchLearn.jsx`, `data-testid="learn-departments"`).
3. **Every course carries a derived catalog code** (department code + 101 upward in authored order: WW-101, MAT-101, EA-101…) printed in the picker and on the catalog line under the course title, with the department and, only where a course declares it, its level (`meta.programLevel`; Little Learners and Mathematics declare Elementary).
4. **The Eternal Algorithms live inside Learn.** The Church chip is retired; the study surface is mounted, lazily, under its department; the `eternal-algorithms` route (deep links, help, launch targets) opens Learn on that department. Nothing about the study itself changed.
5. **Mathematics is a department** because a real Mathematics course now exists (DR-0433).
6. **The Living Lessons default** (Darrell 2026-09-11) is recorded here as a standing decision for the Courses tab.

## Gates (proven-to-catch)
- `app/src/__tests__/learn-is-a-school.test.jsx` — the row derives from the catalog's categories (count = categories + Eternal + Courses); Courses first and open; default Living Lessons; a department narrows the picker and the heading follows; codes on every option; Mathematics tab → MAT-101 · Elementary and its lesson index; the Eternal Algorithms study mounts under its department; `initialDept` lands a deep link; a stale department falls back to the whole catalog; the shell no longer carries the chip and the route maps into Learn.
- `learn-organize.test.js` rewritten to the DR-0149 contract (derived departments, heaviest first, codes, General Studies fallback).

## Timeline (measured, not hoped — DR-0076 §4)
Measured this session: 8 new Living Lessons in one day (L155–L162); 10 full-levels passes at 20–45 minutes each; Little Learners slice 1 (6 lessons) in one session; Mathematics slice 1 (8 lessons) in one session. Therefore:

| slice | what | when |
|---|---|---|
| shipped | the school view; Mathematics slice 1 (Elementary, 8 lessons); L163 | 2026-09-15 |
| next | Little Learners slice 2 (D–Z, 8–20, first sentences) + Mathematics slice 2 (Elementary upper: bigger numbers, ratio and proportion, the temple's geometry, the census as data) — one session each at the measured rate | re-review **2026-09-22** |
| then | an Engineering & Technology department (the sciences "through His lens", Bezaleel's brief as the syllabus) — first slice of 6–8 lessons | re-review **2026-10-13**, sized from the slice-2 measurement |

## Not decided here (surfaced, with recommendations)
- Whether Mathematics should ever be the default tab (recommended: no — the Word course leads; Mathematics is one tap away).
- Whether "General Studies" should ever hold a course on purpose (recommended: no — every course declares its department; the fallback exists so the Courses tab can never collide with a department).
