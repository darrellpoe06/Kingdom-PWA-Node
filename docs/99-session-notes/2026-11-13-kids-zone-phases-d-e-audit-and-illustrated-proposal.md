# Kids Zone, Phases D and E: audit, illustrated proposal, plan

Date: 2026-11-13. Branch: `ccr-117befe9-n9u0iz`. Status: **audit done; illustrated proposal delivered; the visual build waits on Darrell's approval of the screens (his own gate in the brief). What does not depend on the visuals shipped the same session, proven: the Word Builder and Who Am I? engines and Ari's child-mode read (DR-1505; no surface mounts them yet).**

Deliverables, all in `docs/design/love-corner-kids/`:

- `2026-11-13-kids-zone-mockup.html` — six phone screens (open in any browser; artifact https://claude.ai/artifact/Tm31Uyr7cK8GUYZbeeDGSq), the cast, the palette, and the reality-trace table.
- `2026-11-13-kids-preview-{1-kids-home,2-teens-home,3-adventure,4-word-builder,5-who-am-i,6-badges}.png` and `-cast.png` — stills of the same mockup at 390 px, 2×.

## 1. What was asked

Take ownership of Phases D and E of the Love Corner redesign (the 2026-11-13 shell note §6): a colorful, interactive Kids Zone that reads as a professionally designed children's Bible app, in the church's red, black, white and gold with bright accents; separate experiences for 6–10 and 11–17; engaging Bible lessons; the Word Builder and Who Am I? games; better trivia, memory verses, challenges and badges; everything Darrell built preserved; mobile first. Audit first, show the design before building, a separate branch, no merge or deploy without approval. Mid-review Darrell approved Screen 3's layout and vibrant colors and asked for **illustrations of Black children throughout**: boys and girls 6–10 exploring, reading, playing, celebrating; diverse skin tones; natural hair, braids, twists, locs; treasure maps, stars, badges, Bible characters; a welcoming place that also shows children of other backgrounds; more mature art of Black teens for 11–17; no emoji, no clip art; enhance, do not redesign.

## 2. Audit: the Kids Zone as it is (read before drawing)

| Part | Where | What it does today |
|---|---|---|
| Surface | `surfaces.js:129`, mounted at shell `:4638` as `churchView === 'youth'` | `YouthZone.jsx` (383 lines): a red-into-black band, two doors, four `SectionTabs` (Trivia · Memory verse · This week · Badges), the safety line, a Grown-ups link to Learn |
| Doors | `lib/youth-zone.js:34-53` | Kids 6–10 → `child` band, course `little-learners`; Teens 11–17 → `teen` band, course `living-lessons`; the choice is `localStorage` (`poetech.youth.door`), never a child record |
| Weekly lesson | `weeklyLesson()` | a real module picked by ISO week; Kids from the 9 Little Learners modules, Teens from the 307 Living Lessons; opens through `lessonUrl()` into Learn |
| Memory verse | `MEMORY_VERSES` (10 references), `MemoryVerseGame` | words loaded from the hosted KJV (`lib/bible-kjv.js`, 66 books under `public/bible/kjv/`); every fourth word blanked by the week's seed; a verse that does not load says so |
| Trivia | `Engagement.jsx` `TriviaCard` | Bishop Gwin's live `trivia_questions` row (multiple choice) when one passes fidelity, else the dated John 18 anchor set (free text); answers upload through `uploadTriviaAnswer` |
| Badges | `badgesFor()`, `BadgeShelf` | six badges derived from `learner_lesson_records`; signed out, none earned and the card says why; proven to catch both ways in `youth-zone.test.js` |
| Events, music | `upcomingAnnounced()`, `church.media.youtube` | future announced events only, honest fallback; the church channel |
| Ari | `lib/class-tutor.js` | `tutorSystemPrompt` reads `courseMeta.intro` and `posture`; `LITTLE_LEARNERS_TUTOR_META.childMode` exists and is **never read** |
| Lessons for the young | `little-learners-class.js` (9 modules, read-aloud options, `readOptionsAloud`), `living-lessons` (307 modules, every one with an authored `child` level screened by `living-lessons-age-appropriateness.test.js`; 242 with a `youth` level, the rest fall youth → teen) | |
| Coloring pages | `lib/coloring-page.js`, `ColoringSheet.jsx` (DR-0866) | the lesson's own verse and words as outlines, derived, reachable from Learn |
| Age-paced reading | `lessonPlanForAge()` + `AgePacedLesson` in `ChurchLearn.jsx` | the child band cut into 5-minute segments with a check after each; the quiz is `QuizBlock` |
| Games art lineage | `components/games/GameArt.jsx` | inline SVG scenes of Black children and families; dignity is the binding rule; no true red as decoration (DR-0099) |
| Tests | `youth-zone.test.js`, `youth-zone-render.test.jsx`, the Little Learners read-aloud test | pinned test ids: `door-kids`, `door-teens`, `youth-zone[data-door]`, `youth-safety`, `weekly-lesson-open`, `youth-events-empty`, `youth-channel`, `memory-*`, `badge-*` |
| Styles | `index.css` lines 562–635 (`.lc-yz`, `.yz-*`) | shared with the homepage; **Phase C (#2695) edits `index.css`**, so the Kids Zone gets its own stylesheet |
| In flight | PR #2695 (Phase C, branch `ccr-91fb688d-spyn2g`) | touches `ChromeDock`, `ChurchHome`, `LoveCornerHome`, `LoveCornerMenus`, `index.css`, `church-tabs`, `church-home-section`, the shell. **None of `YouthZone.jsx`, `youth-zone.js` or their tests**, so Phases D and E do not collide if they stay out of those files |

## 3. Premise conflicts and facts surfaced before anything was drawn

1. **"The colorful design references I provided."** Nothing was uploaded to this session (`/mnt/user-data/uploads` is empty). The only approved colorful reference in the repository is Screen 3 of the 2026-11-13 shell previews; Darrell confirmed mid-review that it is the design to keep. The mockup is Screen 3's layout, illustrated.
2. **Palette.** The 06:00 brief says red, black, white and gold with bright accents; the mid-review word says keep Screen 3's vibrant colors. Both are honored: the church's four colors are the **frame** (header, seal, gold rule, the red Start, the gold badges and progress, the Bible's red cover with its gold cross) and the Kids Zone's purple-blue-teal world lives inside it. The Teens Zone wears the house by night (black into deep red, gold) with one cool accent. True red on the Word stays the Blood's color and marks nothing else (DR-0099).
3. **The ages do not match the courses** (the shell note §2.2). The Kids door says 6–10 but its weekly lesson comes from Little Learners, whose own meta says about 3 to 6; the Teens door reads at teen (15–17) and the youth band (11–14) is unused. Proposed: Kids 6–10 reads **Living Lessons at the child band** (every lesson has one, screened), Little Learners stays as the **Little Ones (3–6)** door inside Kids, Teens reads **youth by default and teen on a tap**. The learner record's `age_band` keeps the band that was read, so the `kids-reader` badge still derives.
4. **"3 questions today" on Screen 3 was painted.** Trivia today is one live question or the two-question anchor. The mockup says "From the message" and paints no count.
5. **The adventure map bar on Screen 3 was labeled "(example)".** The proposal derives it from the signed-in child's rows (lit stops = lessons with a real record) and says "sign in" when signed out; the still shows an example fill and says so.
6. **Illustrations are hand-built inline SVG, not generated images.** The redesign brief forbids generated replacements for official assets, and generated faces of children would be unreviewable. The cast is a parametric system (skin tone, hair, pose, clothes, props) in the `GameArt.jsx` lineage, drawn once and reused, so every face can be reviewed and corrected, loads offline, and is CSP-safe. This is the one place the proposal most needs Darrell's eye: the style is the system's, and it can be pushed (rounder, bolder outlines, more scene detail) before Phase D1 builds it.
7. **The games' stars are per round, not a record.** Word Builder and Who Am I? show stars for the round only; nothing about a child is written anywhere. If Darrell wants game stickers to persist, that is a device-only play log and its own decision, listed in §7.

## 4. The proposal, screen by screen

Six screens, all at 390 px, each annotated in the mockup with what is real:

1. **Kids home** — Screen 3 kept: the church frame; the door switch; the hero with three explorers (puffs, fade, braids), a treasure map, the winding path and the chest; this week's real lesson named; the adventure map bar; the big adventure card; the 2×2 games (Memory verse, Bible trivia, Word builder, Who am I?), one child per tile; the six badges as gold stickers; Ari as a gold star helper; the Little Ones door; the kid dock (Adventure · Games · Badges · Grown-ups · Read).
2. **Teens home** — the house by night, Fraunces display, two teens against a skyline; the reading band toggle (11–14 / 15–17); the weekly challenge; the same four games in their teen forms; youth events and music exactly as today; the safety line; the teen dock (Challenge · Games · Badges · Events · Read).
3. **The adventure (lesson)** — the lesson's child-band opening in a speech bubble; the anchor verse card in red and gold; the step bar from the age-paced plan; one scene per step from a small pool chosen by lesson id; Read to me, Ask Ari (child mode), Color it; the lesson's real quiz as big tappable answers with a speaker each (the Little Learners read-aloud rule, extended to the Kids door). A pass writes the same learner record Learn writes.
4. **Word builder** — every word of four letters or more from the weekly verse, loaded verbatim from the KJV; the hint is the verse with that word blanked; letter tiles shuffled by the week's seed; Hear the verse; Show a letter costs a star. Teens: the verse's phrases to put in order, then a long word with no hints.
5. **Who am I?** — a roster of Bible people, each with three clue references; the verses load from the KJV with the name blanked; four names; a wrong tap says "not yet"; the reveal shows the verses whole and opens the Scripture tab to the book. A test proves each clue verse contains the name it blanks.
6. **Badges** — the celebration scene and the sentence chosen by the number of badges the real rows earn; the six stickers; the adventure map with lit stops from the same rows; the safety line verbatim.

## 5. Component layout (new files only; the shell is not touched)

```
components/kids/KidsArt.jsx        the cast (kid, teen), hair styles, faces, props, scenes, badges, icons — inline SVG, React
components/kids/KidsZone.jsx       the Kids door: hero, adventure card, games grid, badges strip, Ari, Little Ones, kid dock
components/kids/TeensZone.jsx      the Teens door: hero, challenge, games, events, music, teen dock
components/kids/KidsAdventure.jsx  the in-zone lesson reader over lessonPlanForAge + QuizBlock + TTS + ColoringSheet + TutorPanel(childMode)
components/kids/WordBuilder.jsx    Phase E
components/kids/WhoAmI.jsx         Phase E
components/kids/kids-zone.css      the Kids and Teens styles, imported by KidsZone (index.css is Phase C's)
components/YouthZone.jsx           becomes the door switch that mounts KidsZone or TeensZone; keeps its exports and test ids
lib/youth-zone.js                  doors gain band pairs (kids: child; teens: youth|teen) and the Little Ones door; weeklyLesson reads the door's course
lib/kids/word-builder.js           pure: words from text, shuffle by seed, grading
lib/kids/who-am-i.js               pure: the rosters (references only), name blanking, choice sets
lib/class-tutor.js                 tutorSystemPrompt reads courseMeta.childMode for real
```

Real data each part reads: `learner_lesson_records` (badges, map, adventure progress); `LIVING_LESSONS_MODULES` and `LITTLE_LEARNERS_MODULES`; `trivia_questions` through `TriviaCard`; the hosted KJV through `verseText`; the church record (events, channel); the `/llm/chat` seam through `askTutor`. Nothing painted.

## 6. Phases (each its own PR, `hold` until Darrell lifts it)

| Phase | Scope | Tier | Done when |
|---|---|---|---|
| D1 | KidsArt + KidsZone + TeensZone shells over the existing doors, games, badges, events; `kids-zone.css`; true ages (child / youth|teen / Little Ones); Ari `childMode` read; the adventure reader | B | existing youth-zone tests green (ids kept) or updated with a why; new render tests: doors, derived badges, no profile/chat/scoreboard strings, childMode text proven in the prompt; 390 px measured with no overflow; the layout probe |
| E1 | Word builder (kids letters, teens phrase order) | B | pure tests: words only from the loaded text; the seed shuffles the same all week; a verse that does not load says so |
| E2 | Who am I? (kids and teens rosters) | B | a test loads every clue verse from the in-repo KJV and proves the blanked name is in it |
| F | Comfort pass at 360/390/768/1440 and three text sizes; keyboard walk | A | zero overflow; 36 px floor; focus order |

No schema, no auth, no RLS, no payment in any phase. Each PR is opened with the `hold` label and stays out of the auto-merge lane until Darrell lifts it (the brief's "do not merge or deploy until I approve").

## 7. Decisions requested (recommendation first)

1. **Approve the six screens and the cast as the Phase D1 target**, or say what to change. Recommended: approve; the art can be pushed in D1 (bolder outlines, more scene detail) without changing the layout.
2. **The ages**: Kids 6–10 at the Living Lessons child band, Little Ones 3–6 inside Kids, Teens at youth by default. Recommended: yes (it is what the courses actually are).
3. **Game stickers that persist on the device** (a play log with no account, no name): not in this proposal. Recommended: no for now; badges stay derived from lesson records, which is what the brief protects.

## 8. Not verified (said plainly)

- The signed-in Youth Zone was audited in code, not observed live: the local build has no Supabase. The live walk happens in reviewer mode after D1 (DR-0104).
- The mockup's lesson words are the real child-band opening of ll28 and a paraphrase of its Berea paragraph for the still; the build reads the band verbatim.
- Fonts: the mockup loads Nunito from Google Fonts for the stills; the app self-hosts Fraunces and DM Sans. D1 either self-hosts a rounded face under `public/fonts/` with its OFL, or uses DM Sans at 800 for the Kids Zone. Listed, not decided.
