# DR-0719 — When Bishop Gwin (BG) taught it, the lesson says so: never "the teacher" alone, and never an assumed teacher

- **Status:** accepted
- **Tier:** A (wording rule, a pure helper, a gate and builder instructions; no data, no door)
- **Type:** word + ways
- **Date:** 2026-10-01
- **Scope:** `app/src/lib/bible-study-session.js` (new, pure); `app/src/__tests__/bible-study-session-names-bishop-gwin.test.js` (new gate); `infra/nas-lesson-builder/lesson_writer.py` + `test_lesson_builder.py` (the writer's standard and row rules); `docs/00-foundations/_root/COLG-SERMON-INTAKE.md` (item 5); `docs/00-foundations/_root/LESSONS-LEARNED.md` (P70). L202 is NOT edited here: PR #1900 owns it.
- **Principles:** SPOKEN-TEACHINGS-ARE-BUILD-INPUT, VERIFICATION-DOCTRINE (DR-0076), DECISION-RECORDS; DR-0190 (attribute, never assert), DR-0711 / DR-0712 (who spoke), DR-0690 (L202's provenance).
- **Grounds:** Darrell, 2026-10-01, verbatim: *"For that lesson with Mary Gwin... and all lessons that are recorded at that Bible study session time... it's BG... Don't say the teacher alone... say the teacher BG or Bishop Gwin interchangeable because it's him either way... make sense?"* Narrowed the same day: *"The teacher in that specific lesson is BG... others may or may not have him."*

## Context

The weekly 1 p.m. Bible study is held at The Church of the Living God in Champaign, Illinois. Bishop Gwin is BG and Darrell is DP. L202 was recorded at that session on 2026-09-30, and Bishop Gwin taught it. It still called him "the teacher" throughout its bands, its lesson body and its quiz. Darrell's rule is that a lesson Bishop Gwin taught names him, as Bishop Gwin or BG interchangeably. He then narrowed it. The session alone does not show who taught, because others may teach. So BG is named only where the evidence shows he taught: the speaker marks, the lesson's DR or grounds, or the recording.

## What was measured

- **Every lesson in every course file was read for its source,** by id block across `app/src/lib/*.js` (both `id: '…'` and `"id": "…"` shapes), looking for Bishop Gwin, The Church of the Living God, Bible study, and a bare "the teacher" / "our teacher" / "the instructor" / "the speaker".
- **Two lessons come from that session. For both, the provenance names BG as the one teaching:**
  - **L124** (`ll124-equipped-to-win-…`): "captured from a Wednesday Bible Study taught by Bishop Lloyd E. Gwin at The Love Corner, 2026-09-02" (its own SOURCE line; `docs/99-session-notes/2026-09-03-living-lesson-l119-equipped-to-win.md`, video `WQIcLeynG0w`). **0 bare mentions**; it already names Bishop Gwin. No edit needed.
  - **L202** (`ll202-prepared-before-the-position-…`): Darrell, 2026-10-01, *"The teacher in that specific lesson is BG"*. The DR-0711 speaker marks give BG the teaching and its numbered points. DR-0690 is the build record. **43 bare mentions** on main (bands, lesson body, three quiz questions), measured by the new checker. Owned by PR #1900; not edited here.
- **Candidates that are not from the session**, each excluded from its own provenance:
  - L29: "the teacher Michael Heiser" (The Unseen Realm), an author.
  - L187: "the speaker" is Stephen Petro, a video on the gaokao (DR-0539).
  - L194 and L190: "the Teacher Himself" is Jesus.
  - L198: an article by Anne-Laure Le Cunff (DR-0680); its 44 hits in a first scan belonged to L202, which sits after it in a different id shape.
  - L125: a host and a guest teacher on a podcast (session note 2026-09-05). L126: an author, unnamed by design. L163: "the Teacher" is the app's labelled AI likeness. L114, L151, L158, L179 and the rest: a child's school teacher, "the speaker" of a proverb, Yahweh as the Speaker.
  - L14: Bishop Gwin's "Celebration" message, a service message, not the Bible study; it has no bare mention.
  - World Issues (`wi-higher-ed-aid-…`, 45; `wi-historical-trauma-…`, 13): third-party clips, not the church.
- **Strict check on main:** with L202's allowance set to zero, the gate fails 2 of 8 tests on L202. As shipped, 8 of 8 pass.

## Impact

Without a rule a reader of a lesson from that session meets an unnamed "teacher" where the church knows exactly who taught, and the next lesson the builder writes from that session repeats it. With it, the session's lessons say Bishop Gwin or BG, and a new lesson from the session cannot reach main with a bare "the teacher".

## Decision

1. **The rule, in plain words, everywhere a lesson is written:** "Name the teacher from the speaker marks (DR-0712: voice:BG) or the recording; when it is Bishop Gwin, say Bishop Gwin or BG, never 'the teacher' alone; never assume who taught." Use Bishop Gwin at the first mention, then Bishop Gwin or BG. Being at the weekly study is not evidence that he taught. If someone else taught, the lesson names them as the recording does. If no one is identified, the lesson says so. A line the recording does not give to BG is never put on him (DR-0712). Quotations, Scripture and transcript alike, are not touched.
2. **`lib/bible-study-session.js`** lists every weekly-study lesson with its `teacher` and its `evidence`. `teacher: 'BG'` is set only on positive evidence. `showsBishopGwinTaught` reads that evidence from a lesson's own words: "taught by Bishop Gwin", "Bishop Gwin taught", or a `BG:` speaker line. Being "at the study with Bishop Gwin" or a teaching "named for" him is not evidence. The finder recognises any new weekly-study lesson from its own words, so its teacher is decided on evidence and never assumed.
3. **The gate** fails in four cases:
   - a weekly-study lesson is not listed;
   - a listed lesson is not a weekly-study lesson;
   - a lesson marked `BG` has no evidence that names him;
   - a lesson BG taught has a bare mention in its own prose. L202 carries a dated allowance: until 2026-10-07 its count may only fall from 43; after that date it must be zero, and the allowance is removed when PR #1900 lands its conversion.
4. **The rule is written into four places:**
   - the NAS lesson builder's standard (it no longer calls BG "the teacher" by default);
   - its row rules, for rows tagged `voice:BG`. A `lesson-name:Bishop Gwin` tag alone is not evidence;
   - the intake Way (COLG-SERMON-INTAKE, item 5);
   - the builder brief template (`docs/templates/builder-brief.md`, a WHO TAUGHT line for lesson builders).

## Verification

- `bible-study-session-names-bishop-gwin.test.js`: 10/10. `builder-brief-template.test.js`: 3/3. PROVEN-TO-CATCH: L202 as on main (43 hits; strict run fails 2 tests), one bare mention spliced into L124 (fails), the recogniser on a session sentence (found) and on a Sunday message, a passing "Bible study" and a podcast (passed over), "at the study with Bishop Gwin" and "named for Bishop Gwin" (not evidence that he taught), the possessive "the teacher's" and a quiz question (caught), "the Teacher Himself" and quoted lines (left alone).
- `python3 -m unittest test_lesson_builder`: 88/88, with the standard and row-rule lines asserted (`WhoSpoke`).
- `re-review: 2026-10-07`: L202's allowance expires; confirm PR #1900 converted it, then remove `pending`.
