# DR-1456: The Youth Zone — two doors, the words of the Word, and badges from rows

**Date:** 2026-11-12
**Status:** Accepted (Phase 2 of the Love Corner redesign built; the Bible-character game and youth-event posting named with their gates)
**Tier:** B (a church-facing surface for children; no schema, no auth change, no child record)
**Type:** decision
**Area:** `app/src/components/YouthZone.jsx`, `app/src/lib/youth-zone.js`, `app/src/lib/church-staff.js` (moved out of the shell), `app/src/components/Engagement.jsx` (TriviaCard exported), `app/src/surfaces.js`, `app/src/lib/nav-history.js`, `app/src/lib/church-tabs.jsx`, `app/src/components/lovecorner/LoveCornerHome.jsx`, `app/src/index.css`
**Sent in by:** Darrell's redesign brief, 2026-11-12 §6: "Create a dedicated Youth Zone that children and teenagers actually want to visit... different experiences for children and teenagers... Rewards should encourage participation, learning, kindness, and spiritual growth rather than unhealthy competition... Do not introduce public child profiles or unrestricted messaging." Pulled forward the same day under DR-0236 once Phase 1 (DR-1455) was live.
**Pairs with:** DR-1455 (the front door; its Youth Zone door now opens this), DR-0093 (children join through the safety rails), DR-0418 (every age version is the full message; youth its own level), DR-0431 (Little Learners), DR-1428 (a lesson link opens in the app the lesson belongs to), DR-0076 (derived, never painted)

## Context

The front door promised a Youth Zone and, until now, opened Engagement's trivia. Children had no door of their own, and anything built for them had to be real on first open or it would teach them that the app paints.

## What was measured

| what | measured |
| --- | --- |
| age bands the doors read at | Kids → `child` (6–10), Teens → `teen` (15–17; youth 11–14 falls to teen, DR-0418) |
| courses the weekly lesson draws from | `little-learners` (7 modules), `living-lessons` (189) — both registered |
| memory verses listed | 10 references, every one parsed by the hosted KJV; words never typed |
| badges | 6, each a predicate over learner rows; zero rows → zero earned (proven-to-catch) |
| shell lines before / after | 5186 → 5178 (the staff allowlist moved to `lib/church-staff.js`; budget re-frozen at 5178) |
| tests | youth-zone 15, youth-zone-render 8; 15 pinned suites 224 green |

## Impact

A child taps Youth Zone and lands on Kids or Teens with this week's verse to fill in from the Word's own words, Bishop Gwin's trivia, this week's real lesson, and badges that only their own lessons can light. No profile, no chat, no scoreboard exists on the surface, and the door choice lives on the device, not in a record.

## Decision

1. **Two doors over the app's own age bands**, remembered on the device (`localStorage`), never as a child record.
2. **The memory verse game loads words from the hosted King James text at play time** (`verseText`); a verse not on the device says so and shows no blanks.
3. **Badges are derived from the learner's rows** (`fetchLearnerRecords`): First Step, Five Lessons, Quiz Star, Three in a Row, Showed Up (three days in a week), Little Reader (a youth band). Signed out, nothing is earned and the card says what signing in earns. No count of anyone else.
4. **The week's lesson is a real module** of the door's course, chosen by the calendar week, opened through the shared lesson link.
5. **Trivia is Engagement's own card**, exported, so the live `trivia_questions` row is the same question everywhere.
6. **Youth events are the church record's announced events, future only**; music is the church's own channel.

## What is NOT in this record

A "Who am I?" Bible-character game needs authored clues with every verse fetched verbatim (DR-0076); it is Phase 2b, `re-review: 2026-11-19`. Youth-specific event posting rides the office's announcements seam when it lands. A child-role read that opens Kids by default waits on the first linked child account (DR-0093's own date).

## Verification after merge

DR-0107: deploy on the merged SHA, boot check green, `site-health.yml` UP and fresh, then the Youth Zone opened on a phone from the front door's Youth door. Recorded here when done.
