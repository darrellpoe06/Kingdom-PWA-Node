---
id: DR-0672
title: Your lessons shows each lesson from arrival to live, with the time each step took, and every writer's version side by side for the Governor to choose, merge, or take the best of
status: accepted
date: 2026-09-29
tier: B
type: surface
declared_by: Darrell
scope:
  - app/src/lib/lesson-pipeline.js (new — the five stages, derived from the row's tags and the real PR; the elapsed times; the PR read through the OpsBoard's reads)
  - app/src/lib/lesson-versions.js (new — the lesson_versions read, Governor only; same-prompt proof; gates as measured; the shipped one and why; where versions differ)
  - app/src/lib/lesson-inbox.js (reads through my_lesson_rows(); the client tenancy guard ownLessonRows; transcript/failure times, the rung, the build's progress tags)
  - app/src/lib/github-ops.js (normalizePulls carries created_at; fetchPull for one PR, same ETag cache)
  - app/src/lib/lesson-decisions.js (new — the parts, the best part of each, the composite, Scripture spans locked, the publish contract, the review queue)
  - app/src/components/LessonRoad.jsx, LessonVersionsCompare.jsx, LessonDecide.jsx, LessonReviewQueue.jsx (new); LessonInbox.jsx (the road and the compare/decide view on every lesson); Projects.jsx (the review queue and the link, in Projects → Decisions)
  - infra/supabase/migrations-auto/0241-the-governor-decides-which-version-ships.sql + tests/0241-lesson-decisions-smoke.sql (public.lesson_decisions; same leg)
  - infra/supabase/migrations-auto/0240-your-lessons-reads-the-governors-own-two-doors.sql + tests/0240-my-lesson-rows-smoke.sql (rides the sovereign-noise-thought leg of rls-isolation.yml)
  - infra/nas-lesson-voice/lesson_voice_transcribe.py (return_progress_once — the build's progress carried back to the live row, once each)
  - scripts/system-flow-registry.mjs (the new reads and writes); scripts/chrome-layout-probe.mjs (the notes view joins the sweep)
  - app/src/__tests__/your-lessons-live.test.jsx (new, 36); system-flow-graph.test.jsx fixture carries created_by
principles: [VERIFICATION-DOCTRINE (DR-0076), REALITY-TRACE (DR-0061), APP-IS-PRIMARY (DR-0065), ROLE-CAPABILITY-MODEL (DR-0060, the tenancy guard), HOLD-THE-HAND (DR-0621)]
grounds:
  - Darrell 2026-09-29: "Do we need claude? Can we build the workflows inside the PoeTech App?" and "Yes build it all in the app!!!"
  - Darrell 2026-09-29: "I want to be able to use any LLM? To see the difference between lessons after they receive the same prompts... and have both versions of the same lessons to validate against to see..."
  - Darrell 2026-09-29: "When we have all same lessons those end in PoeTech for me to review their and the decide on which one or merge 2 of them or all of them..."
  - DR-0622 (Your lessons), DR-0614 (the mirror), DR-0635 / DR-0639 (members' lessons), DR-0610 (parallel-compared), DR-0669 (the NAS lesson builder and lesson_versions, in flight)
---

## Context — what Darrell asked for

A live "Your lessons" view that shows every lesson he has sent, from arrival to live on the site, with the time each step took. Then, the same day: every writer's version of the same lesson, from the same prompt, side by side, so the versions can be checked against each other. Then: every lesson that has more than one version ends in the app for him to review, and he decides — one version, a merge of two, or all of them.

## What was measured — the reality trace (CLAUDE.md, before any code)

1. **Which database the app reads.** The app's client is built against `VITE_SUPABASE_URL`. `deploy-cloudflare-pages.yml:82-121`: while `infra/nas-supabase/REPOINT-ARMED` exists (armed 2026-08-19), the build uses `https://poetech.us/sb` and the anon key fetched from the NAS. **The app reads and writes `agent_inbox` on the sovereign NAS database.** The hosted project (`mjjlevhdufpaplypnqrv`) is a mirror: `lesson_voice_transcribe.py` copies each lesson row there (`mirror_once`, DR-0614) because the cloud lesson Routine can only reach hosted. The REPOINT-ARMED file itself says hosted rows say nothing about live rows. Every row count in this record is therefore marked as hosted or not measured.
2. **RLS.** Since migration 0237, `agent_inbox_read` is `created_by = auth.uid() AND user_role_in_instance(instance_id) IS NOT NULL`. That is the live definition read from hosted, whose schema matches sovereign by db-migrate. So a member reads only their own rows. Darrell's two accounts (f13843f2… and c2a6c39a…) are both Governor doors under `lesson_governor_emails()` (checked on hosted `auth.users`), but each sign-in could read only its own lessons. The phone showed the phone's lessons and the desk showed the desk's.
3. **The Routine's tags live on hosted, and only two came back.** The Routine tags `lesson-captured` (and `parallel-compared`) on the hosted copy. It tags `lesson-published` + `lesson-id:` only for members' rows. It records no PR number anywhere; no lesson PR in GitHub search names its row id. Before this record the NAS job carried only `lesson-published` and `lesson-id:` back to the live row (`return_published_once`). The app could never see a lesson captured, and no row pointed at its PR.
4. **PR state.** The OpsBoard already reads GitHub live and unauthenticated through `github-ops.js`: `fetchOps` for open PRs, `fetchDeliveryRecord` for the newest 100 merged, and one shared ETag cache inside the 60/hr budget. This record reuses those reads and adds no new fetch path.

## What can and cannot be derived

| Stage | Evidence | Time |
|---|---|---|
| Recorded | the lesson row | its `created_at` |
| Words arrived | transcript row (`voice-transcript` + `of:<id>`); or failure row (`voice-failed` + `of:<id>`) and its stated reason; a typed lesson's words arrive with it | the transcript or failure row's `created_at` |
| Being built | `lesson-captured` (pushed), or `lesson-building` (started); a member's row first waits for `lesson-approved`, and `lesson-declined` stops it | `captured-at:<iso>` if written, else the PR's `created_at` (the push); otherwise none |
| PR open | `lesson-pr:<n>`, read live | the PR's `created_at`; closed unmerged = failed |
| Live | the lesson named by `lesson-id:<id>` is **in the catalog of the build the viewer is running** | the PR's `merged_at` |

"Merged" is not "live": a merged PR whose lesson is not in the running build reads *waiting*, not done (proven-to-catch). A stage with no evidence reads **unknown** and says what is missing. A stage with no timestamp shows no time, and the same moment twice is one event, not "+under a minute".

**Until the builder writes `lesson-pr:` and `lesson-id:` on every captured row, Darrell's own lessons show "Being built: unknown" or "PR: unknown", truthfully.** Today the Routine writes neither for his rows. The contract below closes that gap.

## Decision

1. **The road on every lesson** (`LessonRoad`, inside the existing Your lessons on the Thinking Space and under the Lesson recorder): five stages. Stacked on a phone, five across from 640px (a television reads it across the room). Each stage has its time and `+elapsed` since the previous timed stage, plus "Arrival to live: …" once live, and a link to the live lesson.
2. **The Governor's two doors, and no one else's.** Migration 0240 adds `my_lesson_rows(p_limit)`, SECURITY DEFINER and read-only. Everyone gets their own `lesson` rows. The Governor (`is_lesson_governor()`) also gets rows written by his other declared door. The widening is by the Governor's own email list, never by instance, role or tag. `agent_inbox_read` is unchanged. The client adds a second lock: `ownLessonRows` shows a member only rows they wrote, and the Governor only his two accounts' rows, whatever a read returns. A database without 0240 falls back to the own-rows table read.
3. **The progress comes home.** `return_progress_once` carries `lesson-captured`, `parallel-compared`, `lesson-pr:`, `lesson-id:`, `lesson-published`, `captured-at:` and `lesson-building` from the hosted copy to the live row. Each tag is carried once (the hosted copy is marked `returned:<tag>`). A tag written later is carried on a later run, and a failed carry marks nothing.
4. **The builder's tag contract** (for the Routine now, and for DR-0669's NAS builder): after the push, tag the row it built from `lesson-captured`, **`lesson-pr:<number>`** and **`lesson-id:<lesson id>`** (or `lesson-id:<course>/<id>`), for Darrell's rows as well as members'. Optionally tag `lesson-building` when starting and `captured-at:<iso>` at the push.
5. **Compare the versions** (Governor only: Darrell's two accounts or his sign-in doors, checked before any read). For each lesson, "Compare versions" reads `lesson_versions` (DR-0669) for its row and its transcript. It shows:
   - every version side by side from 1024px, stacked on a phone, each labeled writer · model;
   - **the same-prompt proof**: one sha256 across all versions, or "Not the same prompt" in coral with the count, plus the prompt text to read;
   - each version's gates as the builder measured them: verses verbatim / total, each mismatch named, structure checks passed with each failure named, elapsed. A gate not measured reads "not measured", never a pass;
   - which version shipped (`published`) and why: `gate_results.shipped_because` in the builder's words, or its measured gates and "did not record a reason";
   - where they differ: movement counts, a movement one version lacks, and a table of every verse each version names, with the ones not cited by all marked;
   - "Read the full version" for each.
   The gates are read exactly as the builder writes them (`lesson_gates.py gate_version`, read from the builder's worktree on 2026-09-29): `verse { spans, verbatim, faults[{ kind, ref, where }] }`, `structure { passed, problems, counts }`, `quotation`, `voice`, and `repo_gates`, which may be `{ skipped }`. A skipped layer shows as "not run" and never counts as a pass. The shape is pinned three ways: `LESSON_VERSION_COLUMNS` (the documented columns plus `id` and `build_id`, which the builder inserts and a decision names); a migration that creates `lesson_versions`, once on disk, must carry every column; and `lesson_builder.py`'s INSERT and `lesson_gates.py`'s keys, once on disk, must still write what the view reads. A missing table reads "No versions yet". **Asked of DR-0669:** RLS on `lesson_versions` that admits only `is_lesson_governor()` (the client gate here is a second lock, not the only one), and `shipped_because` in `gate_results` when the builder picks one.
6. **Review and decide** (`LessonDecide`, in each lesson's compare view and in **Lessons to decide**, a queue in Projects → Decisions). A lesson with more than one version waits there, and the builder stops auto-shipping it (DR-0669). For each lesson he can:
   - **Choose one.**
   - **Merge**, part by part. The parts are the title, each movement, the full lesson, each band (child, youth, teen, senior), the quiz, and a *base* that supplies everything else (anchor, big idea, benefits, talking points). A merge must use at least two versions.
   - **Take all**, with every part prefilled from the best version for that part: the fewest verse faults the builder found in that part (by its `where`), then the builder's own ranking (verse passed, all gates passed, verbatim count, movements, quiz, faster).
   - A live preview shows the lesson as it will ship.
   - He may edit any text part before publishing. **Scripture is locked:** each quoted verse span — `"words" (Book C:V)`, the builder's and the repository's own span pattern — is shown locked and is never a field. The publish contract refuses any edit whose spans are not exactly the original's, in order (changed, removed, or added).
   - **Publish** writes one row to `public.lesson_decisions` (migration 0241, written here because the builder's branch has no decisions table): `mode`, `chosen_version_id` or `merge_map` (part → version id, `base` required), `edits` (part → text), `version_ids`, `status = pending`. The database stamps `decided_by = auth.uid()` and `decided_at`.
   - The builder reads the newest pending row, composes, **re-runs every gate on the composite**, and writes back `status` (`building` / `shipped` / `gate-failed` / `superseded`), `gate_result`, `lesson_id` and `pr_number`. On `gate-failed` the queue brings the lesson back and names each failed check and the part it sits in (`gate_result.failures [{ check, part, detail }]`, or the builder's own gate record read by `where`). Nothing ships.
   - The record is append-only from the app: only the Governor reads or inserts, as himself, pending only, never a gate result; no client UPDATE or DELETE. It is the record the Tower parity loop reads: which versions were chosen or merged, by whom, and when.
7. **Placement.** Your lessons on the Thinking Space (where he records lessons) and under the Lesson recorder. In Projects → Decisions (the Governor's area): **Lessons to decide**, and a link, "Thinking Space → Your lessons", that navigates and scrolls to it.

## Verification

- `your-lessons-live.test.jsx`: 36 tests. Mutation runs, each restored after:
  - removing the `ownLessonRows` filter fails 5;
  - letting a merged PR count as live fails the merged-is-not-live test;
  - making the prompt proof always "same" fails 2;
  - letting any signed-in person compare versions fails 2;
  - making the Scripture check always pass fails the locked-Scripture test;
  - letting the editor change a locked span fails it too;
  - letting anyone publish a decision fails the Governor-only test.
- Migration 0241 + its smoke, run the same way on hosted (rolled back, confirmed absent afterwards), **passed**: the Governor sends a pending decision as himself; a member neither reads nor writes; he cannot write another's name, a shipped status or a gate result; a `choose` without a version and a merge without a base are refused; UPDATE and DELETE change nothing. With the insert policy weakened to "the Governor" alone, the smoke **failed**: "a decision was recorded in another person's name".
- Migration 0240 + its smoke were run on the hosted project inside one transaction ended by a raised exception (nothing committed; confirmed afterwards: function absent, test users and rows absent, the real Governor list intact). It **passed**. The same smoke against a broken variant (Governor branch without the email restriction) **failed**: "the Governor at his desk read a0240,b0240,c0240,d0240". It rides `rls-isolation.yml` (sovereign-noise-thought leg) from now on.
- `test_lesson_voice.py`: 40 pass. Removing the carried-once rule fails the new progress test.
- The flow registry is whole (system-flow-graph 54/54); contrast-guard, tenancy-guard, rls-isolation-matrix-guard, migration-replay-order-guard and migration-return-type-guard pass.

## Limits, stated

- **Migration numbers.** This record takes 0240 and 0241. DR-0669's `lesson_versions` and `lesson_builder_settings` migrations take 0242 onward.
- **The builder reads `lesson_decisions`** (DR-0669): it takes the newest `pending` row per `teaching_row_id`, marks older rows `superseded`, and writes `status`, `gate_result` (`failures [{ check, part, detail }]` on a failure), `lesson_id`, `pr_number` and `updated_at`. Until it does, a published decision stays "Sent", truthfully.

- **Layout measured by jsdom structure, not geometry, in this session.** The sandbox has no Chromium. The Thinking Space (`notes`) joins `chrome-layout-probe.mjs --sweep` (360 / 768 / 1440 / 1920), which CI's runner measures. The probe loads signed out, so it measures the page that hosts Your lessons, not signed-in rows. re-review: 2026-10-06, with a signed-in fixture mode for the probe.
- **`lesson_versions` is not in the flow registry yet.** The graph refuses a `db:` read of a table no migration creates; DR-0669's migration PR adds `{ res: 'db:lesson_versions', file: 'app/src/lib/lesson-versions.js', token: 'LESSON_VERSIONS_TABLE' }` to the lesson-inbox node.
- **"Being built" has no start time** unless the builder writes `lesson-building`/`captured-at:`. The Routine does not today.
- **The Routine prompt** (trigger `trig_01KnByrzx8yYCURwfRKUrvTq`) does not yet write `lesson-pr:`/`lesson-id:` for Darrell's rows. That is the one change that turns his "unknown" stages into times. It is not made from this lane; the coordinator owns the Routine. re-review: 2026-10-01.
