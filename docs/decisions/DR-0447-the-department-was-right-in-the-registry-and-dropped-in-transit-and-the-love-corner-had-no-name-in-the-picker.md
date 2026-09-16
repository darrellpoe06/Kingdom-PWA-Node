# DR-0447 — the department was right in the registry and dropped in transit, and the Love Corner had no name in the picker

- **status:** accepted
- **date:** 2026-09-16
- **extends:** DR-0149 (a course declares its own category), DR-0432 (Learn is a school of derived departments), DR-0121 (derived, never a hand-kept list), DR-0444 (the door a space lives behind), DR-0076 (verification doctrine), DR-0111 (do the work)
- **retracts:** my own reply earlier this session, which "corrected" Darrell's report by counting the REGISTRY (19 courses, 5 departments) instead of the MOUNTED catalog. He was reading the live shelf. The live shelf was right and I was measuring the wrong thing.

## What he saw

Darrell, 2026-09-16, on `poetech.us/lovecorner/app/?view=church` → Learn:

> "One course.... 8 lessons?"

and, of the same strip:

> "Should a section be call Ai - ?"

and, with Messages → Add contact open:

> "Messages don't give an option for the Love Corner."

Three reports, three real defects. None of them was a misreading.

## Measured first (DR-0076 §1, §4)

Rebuilding the mounted list exactly as the church door assembles it — the
component-wired youth course, the four cohort courses as the host retypes them,
the self-paced courses from the registry, and the six Eternal-Algorithms
courses:

| department | as mounted | as the registry declares |
|---|---|---|
| The Word & The Way | 7 courses · 228 | 7 courses · 228 |
| The Eternal Algorithms | 6 courses · 149 | 6 courses · 149 |
| **General Studies** | **4 courses · 46** | **does not exist** |
| Serve the House | 3 courses · 27 | **5 courses · 46** |
| Kingdom Life & Stewardship | 3 courses · 20 | 3 courses · 20 |
| **A.I. The Way** | **1 course · 8** | **3 courses · 35** |
| Mathematics | 1 course · 8 | 1 course · 8 |
| **program total** | 25 courses · 486 | 25 courses · 486 (unchanged) |

The A.I. shelf really did hold one course of eight lessons, exactly as the
screenshot said, while `sovereign-ai` (21 lessons) and `ai-legal-blueprint`
(6 lessons) sat in a department nobody built.

## Why — the category was never missing, it was dropped in transit

`learn-catalog.js` declares a `category` on every one of the twenty registered
courses. `courseDepartment()` reads `meta.category` and defaults to
`General Studies` when there is none. The self-paced descriptors pass
`meta: e.meta` — the registry's own object — and arrive correct. The four
**cohort**-wired courses are assembled in the host instead, like this:

```js
meta: { ...SOVEREIGN_AI_META, key: 'sovereign-ai' },
```

The key is carried. The category is not mentioned, so it is not carried.
Four courses — `broadcast`, `infrastructure`, `sovereign-ai`,
`ai-legal-blueprint` — fell to the default, and the default is a department
label, so the miss looked like content rather than a bug: a real-looking
"General Studies" tab holding 46 real lessons, and an A.I. department reduced
to its first small class.

This is the DR-0121 law failing at a seam rather than at its source. The
registry was never hand-kept and never wrong; the hand-typed thing was the
**merge**.

## Decisions

**a. The merge is a function, not a literal.** `catalogMeta(key, meta)` in
`learn-catalog.js` builds a mounted course's meta FROM the registry — its own
meta, plus the key, plus the department the registry declares. Every mounted
descriptor (the four cohort courses in the host, the youth course in
`ChurchLearn.jsx`) now goes through it. A field cannot be dropped by a caller
who never retypes it. An unregistered key gets no invented department.

**b. A dotted initialism is its own code.** `departmentCode('A.I. The Way')`
returned `AW` — the first letters of "A.I." and "Way", which names nothing a
reader recognizes. Answering Darrell's question directly: yes, the section
should read **AI**. When a label contains an initialism, those letters ARE the
abbreviation. Still derived from the label; every other code is unchanged
(WW, EA, SH, KLS, MAT).

**c. A.I. The Way sits immediately after The Eternal Algorithms.** Darrell:
"Most people want Ai understanding built in their curriculum also make the tab
after eternal algorithms." Departments are ordered by how much they teach,
which is right for a catalog and wrong for a department people must FIND: at 35
lessons the A.I. shelf falls behind every larger one, off the scroll edge of
the tab strip. One declared adjacency — `DEPARTMENT_AFTER`, read as "place this
department immediately after that one" — is applied over the derived order.
It is a placement he named, recorded as a decision, not painted data: a
department named there that is not mounted simply has nowhere to go, and weight
still decides everything else.

**d. A space is named by the door it lives behind.** Measured against the live
database the same day, Darrell is **owner** of the church instance, so the Add
contact picker DID offer it — under the name the row carries, *The Church of
the Living God*. He opens that house through a door named **The Love Corner**,
so the option he was looking for was not there to find. To the person using it,
a space named only by its registry name is missing. `app-doors.js` already
knows which door a slug belongs to (DR-0444); it gains `spaceLabel()`, which
says the door and keeps the record's own name beside it — *The Love Corner ·
The Church of the Living God* — and says the name once when a space is its own
door's namesake (*TLC Therapy Solutions*). Migration **0221** adds `slug` to
`list_my_admin_instances` so the picker has something to read a door from; the
client falls back to the display name until it is applied.

## Proven to catch (DR-0076 §3)

Four gates, each shown to FAIL on the exact defect before being kept:

1. **The source of the drop.** A scan of the two mounting files for
   `meta: { ...*_META` — restoring the one line at
   `poe-financial-mvp-v28.jsx:4661` fails it by file and line number.
2. **The registry's own completeness.** Removing `category` from the
   `sovereign-ai` entry fails five assertions, including "no registered course
   falls through to General Studies."
3. **The real catalog.** Built from `buildCatalogCourseDescriptors()`: no
   General Studies department, A.I. The Way immediately after The Eternal
   Algorithms, its code `AI`, and both other A.I. courses on its shelf.
4. **The picker, on the surface.** Rendering the real `Messages` with the real
   measured five-space set; reverting the option label to `displayName` fails
   it (DR-0076 §6 — observed, not reasoned about).

## What is NOT closed here

- **Cross-listing.** "A.I. understanding built in their curriculum" asks for
  more than a department that counts correctly: A.I. lessons that live in other
  courses should also gather under A.I. The Way, and credit either way. That
  needs a cross-listing registry, a lesson-existence gate, and a resume key
  that credits both shelves (`learn-resume.js` stores one
  `{ courseKey, lessonId }` today). Being built next, this session, per
  DR-0236.
- **The invite TEXT still says the registry name.** The picker names the door;
  the outgoing "you're invited" message built by `messages-invite.js` still
  uses `displayName` only. **re-review: 2026-09-30** — decide whether the text
  a stranger receives should name the door they will install.
- **Elective or mandatory.** Darrell raised it ("it can be an Ai course that is
  an elective or a mandatory course"). There is no requirement model in Learn at
  all yet — no program requirements, no credit hours. **re-review: 2026-10-14.**
