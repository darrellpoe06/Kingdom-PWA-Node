# DR-0739 — L202 gives Deacon Palmer his words, and the class its true count: 50 courses and 750 lessons

- **Status:** accepted (built and proven in the suite; the by-voice confirmation waits on the NAS re-marking the kept recording)
- **Tier:** A (lesson text and its test; two sentences of wording in L205 and L206; no table, no money, no new door)
- **Type:** defect
- **Date:** 2026-10-01
- **Scope:** `app/src/lib/living-lessons-class.js` (L202: the stay-in-it piece is Deacon Palmer's in the full lesson and the youth, teen and senior readings, with DP right after him; the learning-center count in all five readings; L205 and L206 say which courses their scans covered), `app/src/__tests__/living-lessons-l202-verses.test.js` (the speaker pins, two new faults proven to catch, the count), `app/src/components/ChurchLearn.jsx` (one comment), `app/src/lib/talk-together.js` and `app/src/lib/word-codes.js` (the measurement comments), `docs/decisions/INDEX.md`.
- **Principles:** VERIFICATION-DOCTRINE (DR-0076: measure, don't claim; never guess who spoke), SPEAK-ESTABLISHED-FACT (DR-0100), HOLD-THE-HAND (DR-0621), DR-0711 (who spoke in L202, from the recording's context and Darrell's own account), DR-0712 (the transcript says who spoke, by voice, from the next recording on), DR-0720 (a voice is added only by its owner, with consent), DR-0331 (his spoken correction is rendered for meaning).
- **Grounds:** Darrell, 2026-10-01, verbatim: *"DP went on: you cannot read a few verses and think you have it, you have to stay in it; a year later you read the same passage and see so much more. Deacon Palmer said this piece... then I spoke right after... make sense? I thought you could tell the difference between my voice and another... ?"* and *"Not to mention the count was wrong... we have had 50 courses and 750 lessons... before this lesson...?!"*, with a screenshot of L202 on his phone reading "twelve departments, 43 courses and 593 lessons".

## Context

L202 (DR-0690, DR-0711, DR-0719, DR-0727) was built from the one witness that existed on 2026-09-30: a phone recording made inside the app and written down by Whisper on the NAS CPU, with no speakers marked. DR-0711 attributed each line by hand from the recording's context and Darrell's own account. Two of those attributions were wrong, and Darrell corrected both in one message.

## What was measured

**Who said the stay-in-it piece.** The transcript (agent_inbox `aed9557b-333e-4152-adbc-de0f9e695793`, read through `inbox-lesson-body` run 36770368206, 16,511 bytes, md5 `a30e4942e161b7833c6cef051b8ab6fd`) carries, right after DP's neuroplasticity lines (L382 to L405):

| line | the machine's words |
| --- | --- |
| L408 | read a few scriptures and think you got it right you have to stay in it and I'm |
| L409 to L411 | finding that to where I'll be reading for a while and I study for a while and then I say okay I'm gonna work with this / no no you just had / man yep |
| L412 | it's a truth of the matter is I'm gonna be reading scripture and you saw it one way at a year later you ready to say it's never so many words |

DR-0711's evidence for giving L408 to L412 to DP was "the lines run on from his with no break". That was an inference from continuity, not from a voice. Darrell, who was in the room, says Deacon Palmer said the few-verses and a-year-later piece and that he (DP) spoke right after. His account is the evidence this record stands on, the same evidence every other DP line in L202 stands on. The recording does not mark where one voice ends and the next begins, and the lesson now says so.

**Why the process could not tell his voice from another on that day.** The speaker-marking pipeline (DR-0712: sherpa-onnx diarization on the NAS, BG and DP enrolled from attributed words, every other voice S1, S2, ...) merged at 00:05 UTC on 2026-10-01 (PR #1908). The class was recorded and transcribed on 2026-09-30, before it existed, so its transcript came back as one unmarked block and L202 was attributed by hand. The NAS witness (`voice-intake-health` run 36887268042, 2026-10-01 15:52 UTC) shows the pipeline is now in place: the speakers recipe `v1 sherpa-onnx pyannote-seg-3.0 titanet-small` installed, both models present, `BG.json` and `DP.json` written, and the enrollment result `{"enrolled": {"BG": 0, "DP": 26}}`. From the next recording on, the transcript says who spoke.

**The count.** The lesson said the Learn tab held "twelve departments, 43 courses and 593 lessons". That number was read from `learnDepartments(buildCatalogCourseDescriptors())`, and that descriptor set leaves out two things the Learn tab also mounts (`ChurchLearn.jsx`: `[aiCourse, ...builtExtras, ...eternalCourses]`): the A.I. course (8 lessons) and the six Eternal Algorithms courses (149 lessons). Measured again the way the tab assembles it, on this branch:

| set | departments | courses | lessons |
| --- | --- | --- | --- |
| `buildCatalogCourseDescriptors()` alone (what L202 read) | 12 | 43 | 597 today (593 on the morning of 2026-10-01) |
| + the A.I. course + the six Eternal Algorithms courses (what the Learn tab shows) | 13 | 50 | 754 today; 750 on 2026-09-30, before L203 to L206 landed |

Darrell told the class "like 50 courses and like 750 lessons" (transcript L105), and `derive-lesson-dates --check` measured 750 that day (DR-0711). His number was right; the lesson's was the smaller set.

**The same smaller set under L205 and L206.** L205 (DR-0733) and L206 (DR-0734) each state a dated measurement of "the catalog" (593 and 595 lessons). Those scans covered the same 43-course descriptor set. Their direction and link counts stand as measured; the sentences now say which courses the scan covered, so "the catalog" is not claimed for a part of it.

## Decision

1. **L202 gives Deacon Palmer his words.** In the full lesson and the youth, teen and senior readings, the few-verses / a-year-later piece is Deacon Palmer's, "by Darrell's own account", and DP spoke right after him. The child reading never carried the piece and is unchanged. He is named as a deacon of the church in a Bible study the church posts publicly (DR-0711's rule), on the same evidence as DP's own lines.
2. **The count is the Learn tab's own: thirteen departments, 50 courses and 750 lessons when the lesson was written**, with The Eternal Algorithms listed among the departments. "When this was written" stays, so a growing catalog does not make the lesson lie.
3. **Deacon Palmer gets no voiceprint from this record.** BG and DP are the only voices enrolled from attributed words (DR-0712 §6), with BG's consent on record and DP being Darrell himself. Every other voice is added only by its owner, with consent (DR-0720). The pipeline will call him S1, S2, ... until he adds his own voice in the app, or until a transcript shows BG calling him by name just before he speaks (DR-0712 rule 3).
4. **Two faults are pinned so this cannot come back:** Deacon Palmer's words put on DP (in the lesson or any band) fire the speaker check, and "Deacon Palmer" on any sentence that is not his piece fires it. Both proven to catch.
5. **L205 and L206 say which courses their scans covered**; the Learn copy and the two measurement comments say the same.

## Verification

- `living-lessons-l202-verses.test.js`: the speaker pins carry Deacon Palmer and DP-after-him in the lesson and three bands; the planted "DP went on" (lesson), "DP confessed" (senior) and a wandering "Deacon Palmer gave his own testimony" each fire; every reading carries "thirteen departments, 50 courses and 750 lessons" and none carries the old count; The Eternal Algorithms is listed with the departments.
- `living-lessons-l205-verses.test.js` and `living-lessons-l206-verses.test.js`: unchanged floors, green with the reworded sentences.
- The census above, run on this branch with the Learn tab's own `courseLessonCount` and `learnDepartments`.

## Limits, stated

1. **By voice, not yet.** The enrollment result names DP as voice 26 of the 2026-09-30 class, which says the diarizer cut that recording into many voices at the default threshold. The kept audio on the NAS can be re-marked (`name_voice.py --audio <file> --list` with the saved segments) to confirm by voice that L408 and L412 are one voice and not DP's. `re-review: 2026-10-08`, with DR-0712's own review of the first marked class and the threshold on BG's and DP's real voices.
2. **DR-0711's table** (on the closed PR #1900 branch) still reads "DP" for L408 to L412; this record supersedes that row. The record on main is this one.
