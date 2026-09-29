---
id: DR-0672
title: Your lessons shows each lesson from arrival to live, with the time each step took, and every writer's version side by side for the Governor to choose, merge, or take the best of
status: accepted
date: 2026-09-29
tier: B
type: surface
declared_by: Darrell
scope:
  - app/src/lib/lesson-pipeline.js (new — the five stages, derived from the row's tags, the NAS builder's own `build:<stage>@<time>` tags and the real PR; the elapsed times; the PR read through the OpsBoard's reads, found by number or by the builder's branch)
  - app/src/lib/lesson-versions.js (new — DR-0669's lesson_versions read, Governor only; same-prompt proof; gates as the builder measured them; the shipped one and why; where versions differ)
  - app/src/lib/lesson-inbox.js (reads through my_lesson_rows(); the client tenancy guard ownLessonRows; transcript/failure times, the rung, the build's progress tags)
  - app/src/lib/github-ops.js (normalizePulls carries created_at; fetchPull for one PR, same ETag cache)
  - app/src/lib/lesson-decisions.js (new — DR-0669's decision contract from the Governor's hand: the builder's parts, the best part of each, its assembly as a preview, quoted spans locked, the publish contract, the review queue)
  - app/src/components/LessonRoad.jsx, LessonVersionsCompare.jsx, LessonDecide.jsx, LessonReviewQueue.jsx (new); LessonInbox.jsx (the road and the compare/decide view on every lesson); Projects.jsx (the review queue and the link, in Projects → Decisions)
  - infra/supabase/migrations-auto/0241-your-lessons-reads-the-governors-own-two-doors.sql + tests/0241-my-lesson-rows-smoke.sql (rides the sovereign-noise-thought leg of rls-isolation.yml)
  - infra/nas-lesson-voice/lesson_voice_transcribe.py (return_progress_once — the build's progress carried back to the live row, once each)
  - scripts/system-flow-registry.mjs (the new reads and writes); scripts/chrome-layout-probe.mjs (the notes view joins the sweep)
  - app/src/__tests__/your-lessons-live.test.jsx (new, 39); system-flow-graph.test.jsx fixture carries created_by
principles: [VERIFICATION-DOCTRINE (DR-0076), REALITY-TRACE (DR-0061), APP-IS-PRIMARY (DR-0065), ROLE-CAPABILITY-MODEL (DR-0060, the tenancy guard), HOLD-THE-HAND (DR-0621)]
grounds:
  - Darrell 2026-09-29: "Do we need claude? Can we build the workflows inside the PoeTech App?" and "Yes build it all in the app!!!"
  - Darrell 2026-09-29: "I want to be able to use any LLM? To see the difference between lessons after they receive the same prompts... and have both versions of the same lessons to validate against to see..."
  - Darrell 2026-09-29: "When we have all same lessons those end in PoeTech for me to review their and the decide on which one or merge 2 of them or all of them..."
  - DR-0622 (Your lessons), DR-0614 (the mirror), DR-0635 / DR-0639 (members' lessons), DR-0610 (parallel-compared), DR-0669 (the NAS lesson builder, PR #1837: its migration 0240 defines lesson_versions, lesson_decisions and lesson_builder_settings, and its stage vocabulary is what this surface reads)
---

## Context — what Darrell asked for

A live "Your lessons" view that shows every lesson he has sent, from arrival to live on the site, with the time each step took. Then, the same day: every writer's version of the same lesson, from the same prompt, side by side, so the versions can be checked against each other. Then: every lesson that has more than one version ends in the app for him to review, and he decides — one version, a merge of two, or all of them.

## What was measured — the reality trace (CLAUDE.md, before any code)

1. **Which database the app reads.** The app's client is built against `VITE_SUPABASE_URL`. `deploy-cloudflare-pages.yml:82-121`: while `infra/nas-supabase/REPOINT-ARMED` exists (armed 2026-08-19), the build uses `https://poetech.us/sb` and the anon key fetched from the NAS. **The app reads and writes `agent_inbox` on the sovereign NAS database.** The hosted project (`mjjlevhdufpaplypnqrv`) is a mirror: `lesson_voice_transcribe.py` copies each lesson row there (`mirror_once`, DR-0614) because the cloud lesson Routine can only reach hosted. The REPOINT-ARMED file itself says hosted rows say nothing about live rows. Every row count in this record is therefore marked as hosted or not measured.
2. **RLS.** Since migration 0237, `agent_inbox_read` is `created_by = auth.uid() AND user_role_in_instance(instance_id) IS NOT NULL`. That is the live definition read from hosted, whose schema matches sovereign by db-migrate. So a member reads only their own rows. Darrell's two accounts (f13843f2… and c2a6c39a…) are both Governor doors under `lesson_governor_emails()` (checked on hosted `auth.users`), but each sign-in could read only its own lessons. The phone showed the phone's lessons and the desk showed the desk's.
3. **The Routine's tags live on hosted, and only two came back.** The Routine tags `lesson-captured` (and `parallel-compared`) on the hosted copy. It tags `lesson-published` + `lesson-id:` only for members' rows. It records no PR number anywhere; no lesson PR in GitHub search names its row id. Before this record the NAS job carried only `lesson-published` and `lesson-id:` back to the live row (`return_published_once`). The app could never see a lesson captured, and no row pointed at its PR.
4. **The NAS builder (DR-0669, PR #1837), read from its branch.** It writes to the live database directly and tags every row of a teaching `build:<stage>@<UTC time>` at each stage (`claimed` … `pushed`, `published`; or `failed` with `build-reason:`, `deferred`, `duplicate`, `skipped-test`, `awaiting-review`, `decided`), holds `lesson-building` while it owns the row, names the lesson with `build-lesson:L<n>` (branch `claude/lesson-l<n>-<slug>`), and after the push writes `lesson-captured`, `lesson-published` and `lesson-id:`. Its migration 0240 defines `lesson_versions` and `lesson_decisions` (read by `is_lesson_steward()`: Darrell's two accounts or the Governor). More than one version is tagged `awaiting-review` and ships nothing until he decides.
5. **PR state.** The OpsBoard already reads GitHub live and unauthenticated through `github-ops.js`: `fetchOps` for open PRs, `fetchDeliveryRecord` for the newest 100 merged, and one shared ETag cache inside the 60/hr budget. This record reuses those reads and adds no new fetch path.

## What can and cannot be derived

| Stage | Evidence | Time |
|---|---|---|
| Recorded | the lesson row | its `created_at` |
| Words arrived | transcript row (`voice-transcript` + `of:<id>`); or failure row (`voice-failed` + `of:<id>`) and its stated reason; a typed lesson's words arrive with it | the transcript or failure row's `created_at` |
| Being built | the builder's tags: in progress (`lesson-building`, the latest `build:<stage>`, "Now writing, since …"); done (`build:pushed`, or `lesson-captured` from the Routine); failed (`build:failed` + `build-reason:`); waiting for his decision (`awaiting-review`); handed to the Routine (`deferred`); already a lesson (`parallel-compared` / `duplicate`). A member's row first waits for `lesson-approved`; `lesson-declined` stops it | `build:claimed` for a build in progress, `build:pushed` for a finished one; the Routine's lessons are timed by their PR opening |
| PR open | `lesson-pr:<n>` (the Routine), or the builder's branch `claude/lesson-l<n>-` for `build-lesson:L<n>`, read live | the PR's `created_at`; closed unmerged = failed |
| Live | the lesson named by `lesson-id:<id>` is **in the catalog of the build the viewer is running** | the PR's `merged_at` |

"Merged" is not "live": a merged PR whose lesson is not in the running build reads *waiting*, not done (proven-to-catch). "Pushed" is not "live" either: the builder writes `lesson-published` after its push, and this surface still asks the running build. A stage with no evidence reads **unknown** and says what is missing. A stage with no timestamp shows no time, and the same moment twice is one event, not "+under a minute".

**Lessons the hourly Routine builds** still carry no PR number and, for Darrell's own rows, no lesson id; their PR and live stages read "unknown" until the Routine writes `lesson-pr:` and `lesson-id:` (the contract below). Lessons the NAS builder builds carry everything the road needs.

## Decision

1. **The road on every lesson** (`LessonRoad`, inside the existing Your lessons on the Thinking Space and under the Lesson recorder): five stages. Stacked on a phone, five across from 640px (a television reads it across the room). Each stage has its time and `+elapsed` since the previous timed stage, plus "Arrival to live: …" once live, and a link to the live lesson.
2. **The Governor's two doors, and no one else's.** Migration 0241 adds `my_lesson_rows(p_limit)`, SECURITY DEFINER and read-only. Everyone gets their own `lesson` rows. The Governor (`is_lesson_governor()`) also gets rows written by his other declared door. The widening is by the Governor's own email list, never by instance, role or tag. `agent_inbox_read` is unchanged. The client adds a second lock: `ownLessonRows` shows a member only rows they wrote, and the Governor only his two accounts' rows, whatever a read returns. A database without 0241 falls back to the own-rows table read.
3. **The Routine's progress comes home.** `return_progress_once` carries `lesson-captured`, `parallel-compared`, `lesson-pr:`, `lesson-id:`, `lesson-published`, `captured-at:` and `lesson-building` from the hosted copy to the live row. Each tag is carried once (the hosted copy is marked `returned:<tag>`). A tag written later is carried on a later run, and a failed carry marks nothing. (The NAS builder writes the live row directly and needs no carry.)
4. **The Routine's tag contract**: after the push, tag the row it built from `lesson-captured`, **`lesson-pr:<number>`** and **`lesson-id:<lesson id>`** (or `lesson-id:<course>/<id>`), for Darrell's rows as well as members'.
5. **Compare the versions** (Governor only: Darrell's two accounts or his sign-in doors, checked before any read; the database's `is_lesson_steward()` is the real gate). For each lesson, "Compare versions" shows its latest build's versions from `lesson_versions`:
   - every version side by side from 1024px, stacked on a phone, each labeled writer · model; a writer that did not finish shows its error;
   - **the same-prompt proof**: one sha256 across all versions, or "Not the same prompt" in coral with the count, plus the prompt text to read;
   - each version's gates as the builder measured them (`lesson_gates.py gate_version`): verses verbatim / spans, each fault named with where it sits, each failing check named (structure, quotation integrity, our voice, the repository's own gates), elapsed. A layer the builder skipped reads "not run", and a gate not measured reads "not measured", never a pass;
   - which version shipped (`published`) and why, in the builder's words when it records them;
   - where they differ: movement counts, a movement one version lacks, and a table of every verse each version names, with the ones not cited by all marked;
   - "Read the full version" for each (opening, numbered movements, closing).
   The shape is pinned against DR-0669's own files once they are on disk: every column read must be in its `lesson_versions` migration and in `lesson_builder.py`'s INSERT, and `lesson_gates.py` must still write the keys read. Checked here against PR #1837's files, brought into the worktree for the run and removed: **pass**. A missing table reads "No versions yet". Backfill rows (existing lessons re-written for comparison) are never put in the queue.
6. **Review and decide** (`LessonDecide`, in each lesson's compare view and in **Lessons to decide**, a queue in Projects → Decisions). Every build with more than one lesson version waits there (the builder tags it `awaiting-review` and ships nothing). For each he can:
   - **Choose one.**
   - **Merge**, part by part, over the builder's own `PART_KEYS`: title, big idea, opening, each movement (`movements.<i>`), closing, each band (`levels.child|youth|teen|senior`), quiz, benefits, talking points, and a *base* version that supplies everything else. A merge must use at least two versions.
   - **Take all**, with each part prefilled from the best version for that part: the fewest verse faults the builder found in that part (its `where`, mapped the way its `part_of` does), then its own ranking (verse passed, all gates passed, verbatim count, movements, quiz, faster).
   - A live preview shows the lesson as the builder will assemble it (base, then each merged part, then edits).
   - He may edit title, big idea, opening, closing, a band, or a movement's title or text before publishing. **Quoted Scripture is locked**: every double-quoted span, the builder's own lock (`quoted_spans_of`), is shown locked and is never a field; a straight quote typed between spans cannot open a new one; the publish contract refuses any edit whose quoted spans are not exactly the original's, in order. The builder refuses it again.
   - **Publish** inserts one row into DR-0669's `lesson_decisions`: `build_id`, `teaching_row_id`, `instance_id`, `version_id` (the chosen or base version), `merge_map` (part → version id, or null for one version), `edits`. The database stamps `decided_by`, `decided_at` and `status = decided`, and rings the builder.
   - The builder claims it, assembles, **re-runs every gate on the composite**, and writes back `building` → `shipped` (lesson id, branch, PR link, shown here) or `gate-failed` / `failed` with `gate_result.failures [{ check, part, detail }]`. The queue brings the lesson back and names each failed check and part. Nothing ships.
   - The record is append-only from the app (DR-0669's insert policy: stewards only, as themselves, born `decided` with no outcome). It is the record the Tower parity loop reads: which versions were chosen or merged, by whom, and when.
7. **Placement.** Your lessons on the Thinking Space (where he records lessons) and under the Lesson recorder. In Projects → Decisions (the Governor's area): **Lessons to decide**, and a link, "Thinking Space → Your lessons", that navigates and scrolls to it.

## Verification

- `your-lessons-live.test.jsx`: 39 tests. Mutation runs, each restored after:
  - removing the `ownLessonRows` filter fails 5;
  - letting a merged PR count as live fails the merged-is-not-live test;
  - making the prompt proof always "same" fails 2;
  - letting any signed-in person compare versions fails 2;
  - making the Scripture check always pass fails the locked-Scripture test;
  - letting the editor change a locked span fails it too;
  - letting anyone publish a decision fails the Governor-only test;
  - reading a failed build as in progress fails the builder-stage test.
- The pins against PR #1837's real files: the first run **failed** on a real parse error (the builder's INSERT spans adjacent Python strings), so the pin does fail on a mismatch. After the fix, both pins **passed** against its migration 0240, `PART_KEYS`, INSERT and gate keys.
- Migration 0241 + its smoke were run on the hosted project inside one transaction ended by a raised exception (nothing committed; confirmed afterwards: function absent, test users and rows absent, the real Governor list intact). It **passed**. The same smoke against a broken variant (Governor branch without the email restriction) **failed**: "the Governor at his desk read a…,b…,c…,d…". It rides `rls-isolation.yml` (sovereign-noise-thought leg).
- Every test file that touches what changed (150 files: the lesson libraries and components, Projects, the Thinking Space, One Voice, the flow registry, the decision ledger, migrations, the isolation matrix, contrast and legibility): **3,129 tests pass**; `npm run lint` clean.
- `test_lesson_voice.py`: 40 pass. Removing the carried-once rule fails the new progress test.
- The flow registry is whole (system-flow-graph 54/54); contrast, legibility, tenancy, rls-isolation-matrix, migration-replay-order, migration-return-type, business-systems and the other CI guards pass.

## Limits, stated

- **This record does not define `lesson_versions` or `lesson_decisions`.** They are DR-0669's (its migration 0240). Until #1837 is on the database the app reads, the compare view and the queue read "No versions yet", truthfully. Their flow-registry reads join when that migration is on main, because the graph refuses a `db:` read of a table no migration creates.
- **Layout measured by jsdom structure, not geometry, in this session.** The sandbox has no Chromium, and the full suite could not finish here: the machine ran at load 25 on 4 cores with other agents, and the run was killed at 469 of 1,245 files. The four failures in that partial run were in areas this change does not touch, and took 16 to 78 s each. CI's required check runs the full suite. The Thinking Space (`notes`) joins `chrome-layout-probe.mjs --sweep` (360 / 768 / 1440 / 1920), which CI's runner measures. The probe loads signed out, so it measures the page that hosts Your lessons, not signed-in rows. re-review: 2026-10-06, with a signed-in fixture mode for the probe.
- **The hourly Routine** (trigger `trig_01KnByrzx8yYCURwfRKUrvTq`) does not yet write `lesson-pr:`/`lesson-id:` for Darrell's rows, nor skip `lesson-building` / `awaiting-review` rows (DR-0669 asks the second). It is not changed from this lane; the coordinator owns the Routine. re-review: 2026-10-01.
