# The Love Corner shell redesign: audit, preservation checklist, three previews

Date: 2026-11-13. Branch: `ccr-91fb688d-spyn2g`. Status: **audit and previews delivered; no file under `app/src` changed; waiting on Darrell's approval of the three screens (brief, Phase 10).**

Previews: `docs/design/love-corner-shell/2026-11-13-shell-previews.html` (artifact https://claude.ai/artifact/8ai6La7jakepWyYNe3MbSe) and the stills `2026-11-13-preview-screen-{1-home,1b-profile-menu,2-personalize,3-kids-zone}.png` beside it. The current top of the app, measured, is `2026-11-13-current-top-390.png`.

## 1. What was asked

Modernize the shell of the Love Corner app without removing, replacing or rebuilding anything that exists: one compact header (logo, name; bell, picture, menu), the approved welcome section beneath it, a Personalize My App sheet in place of the color circles and font/voice controls, a profile menu for account and utility functions, a clean bottom navigation with every existing tab still reachable, the sophisticated church design kept for adults, a playful Kids Zone presentation over the existing lessons, the Institute kept prominent. Audit first; three phone previews; wait for approval.

## 2. Premise conflicts and facts surfaced before anything was drawn

1. **"Use the previously approved colorful Kids Learning Zone concept."** No such concept exists in the repository: searches of `docs/`, `app/src` and the git log for "Kids Learning Zone", "Kids Zone", "Bible adventure" return nothing. The only approved child-facing design is the Youth Zone card in the 2026-11-12 homepage mockup (red, black, gold; chips for trivia, memory verse, Who am I?, this week's adventure, badges), now built as DR-1456. **Screen 3 is therefore the first drawing of the colorful concept**, not a reproduction of one. Approve it on its own merits.
2. **The Kids door's ages do not match the course behind it.** `youth-zone.js:34-53` labels Kids 6–10 over Little Learners, whose own meta says "about 3 to 6" (`little-learners-class.js:162`); Teens is labelled 11–17 but reads at the 15–17 band, so the 11–14 "youth" band of `AGE_BANDS` is unused. The redesign should say the true ages and let the Teens door read at the youth band for 11–14. A one-line fix in Phase 7; flagged here so it is decided, not slid in.
3. **"Subscription" on the church door.** The header's only subscription control is "💳 Subscribe" → `setView('about')` (shell :4177). On the church door the About view has no tab, so the only way back is the browser Back. The profile menu keeps the same destination; a Back affordance is part of the design.
4. **Two real bugs found in the dock, kept for the fix list:** `navForDock` (shell :1246) never passes `churchHomeSection`, but the dock reads it (`ChromeDock.jsx:179`), so the Watch tab never lights up; and Giving Book (shell :4644) renders nothing at all for a non-office visitor instead of a locked surface.
5. **The shell is frozen at 5,178 lines** (`scripts/monolith-budget.json`), with zero headroom. The header redesign can only land by moving the header out of the shell into its own component, which shrinks the shell. That is a constraint that helps.
6. **Ari's child mode flag is never read.** `LITTLE_LEARNERS_TUTOR_META.childMode` exists (`little-learners-class.js:220-225`) but only its `intro`/`posture` text reaches the prompt. Phase 7 should read the flag for real.
7. **Themes number eleven**, not "every color" plus blue/red/purple: Heritage, The Love Corner, TLC, Anchor, Bedrock, Cream, Snow, Glacier, Sapphire, Rose, Midnight (`theme-css.js:620-640`). There is no purple theme; the brief's "Purple" is not offered unless a palette is added, which is a separate decision.

## 3. Audit: what the app is today (the fifteen items of Phase 1)

| # | Item | Where it lives (file:line) |
|---|---|---|
| 1 | Navigation tabs and sub-tabs | Top views: `lib/nav-history.js:40-54` (38 ids), gated by `lib/nav-items.jsx:33-175`; the church door keeps only `church` (`nav-items.jsx:172`). Church sub-tabs: `lib/church-tabs.jsx:24-147`, 23 in the strip + `eternal-algorithms` as a 24th valid route. |
| 2 | Routes and screens | `?view=`/`?tab=`, `sub=`, aliases (`nav-history.js:61-109`); `VALID_CHURCH_SUBS` :134-138; every mount is a `churchView === '<id>'` branch in the shell :4358-4646; preserved params `lovecorner, moore, tlc, biz, demo, course, lesson` (:202). |
| 3 | Database connections | `lib/supabase.js`; profiles (`profiles-sync.js`), family snapshots (`snapshot-sync.js`, table `family_snapshots`), arrivals (`agent_inbox` realtime), learner records (`learner_lesson_records`), trivia (`trivia_questions`, `trivia_answers`), the Institute (0325), church access (`church-access-store.js`). |
| 4 | Components in the top chrome | h1/tagline/build (:4145-4151); controls row (:4153-4226): ComfortBarToggle, ChurchGiveHeaderButton, HeaderAuthButton, AuthBanner, Subscribe, AppDoorControls (Install + Share), HelpButton, Garage/Opener, ArrivalsBell, TextSizeControl, ReadingVoiceControl, theme swatches, version block; TopNavRow (Back/Forward, BrandLockup, "Show header" hatch); PublicWelcome ("free to read" line); church sub-tab TabScroll (:4263-4271). |
| 5 | Accounts and authentication | `HeaderAuthButton.jsx` (session from `onAuthChange`, profile from `profiles`, `signOut()`), `AuthBanner.jsx` (phone/email identity, `promoteEmailToLogin`), `AuthModal`. Untouched by this work. |
| 6 | Roles and permissions | `useChurchAccess` (shell :1231), `isChurchOfficeRole` (owner/admin, `church-access-store.js:77`), `isChurchStaff` (:1232), reviewer mode (`reviewer-lens.js`), `REQUIREMENTS` (`surface-access.js:55-122`), `LockedSurface`. The database (RLS) is the real wall. Untouched. |
| 7 | Administrative features | Admin view (`nav-items.jsx:171`), Church office tabs (giving-book, harvest, videowall, devices, infra-plan, observe), reviewer mode banner. |
| 8 | Church ministry features | Ministries landing (DR-1458), Choir, Bus Ministry, Youth Zone, Order of Service, Conference, Campus Rentals (id `events`), Projects. |
| 9 | Learning features | `LEARN_CATALOG` (`learn-catalog.js:74`), `ChurchLearn.jsx` (QuizBlock, LessonReader, TutorPanel, CourseView), learner records sync, the Institute (DR-1455/1460), Youth Zone (DR-1456), coloring pages (DR-0865/0866). |
| 10 | Notifications and communication | `ArrivalsBell` header/dock (count from `arrivals-watch.js`), `PushNotifications.jsx`, DM unread (`dm-notify.js`), Messages view (filtered off the church door). |
| 11 | Giving and financial | `ChurchGiveHeaderButton` / `ChurchGivePanel` / `ChurchGiveDockButton` (`ChurchGiving.jsx`), Giving Book (office), the "projections, not promises" strip (:3561). |
| 12 | AI integrations | Ari the learner tutor (`lib/ari.js`, `lib/class-tutor.js` → `/llm/chat` Pages Function → NAS FastAPI → Ollama; TutorPanel in ChurchLearn), "Talk about this" in the reader (`talk-about.js`); Ari dev tooling (`ari-app-review.js`, the stop hook) is not learner-facing. |
| 13 | Accessibility | Text size steps A/A+/A++/A+++/A44 (`text-size.js:61-74`, key `poe-text-size`), the escape hatch, read aloud (`TTSControl.jsx`, READ in the dock), voice (`reading-voice.js`, synced via `user_metadata`), rate (`tts.js`), focus rings, the 36px floor (DR-1459), remote navigation. |
| 14 | Themes and personalization | Eleven themes (`theme-css.js:620-640`); key `poe-theme-pref` (:721); church door default `lovecorner` (:661); theme rides the family snapshot (`snapshot-sync.js`), text size is device-only, voice syncs through auth metadata; header collapsed `poe-header-collapsed`; comfort bar `poe-comfort-bar-collapsed`. |
| 15 | Tests and deployment | `ci.yml` (lint, 4 vitest shards, probes, layout, Postgres walls incl. `institute-walls`), auto-open-pr / auto-merge / deploy-cloudflare-pages / site-health; ~60 shell, dock, theme, text-size, voice, notification and church-door tests listed in §6. |

## 4. Preservation checklist

Every item maps to where it is today and where it lives in the redesign. Nothing is deleted; nothing changes identity.

### 4a. The header's controls

| Today (component) | Redesign |
|---|---|
| Give (`ChurchGiveHeaderButton`) | Homepage door "Give"; profile menu "Give"; More sheet. Same `ChurchGivePanel`. |
| Picture + name + Log out (`HeaderAuthButton`) | The picture in the header opens the profile menu; Log Out is its last line; same `signOut()`, same `MyProfile` dialog. Signed out: "Sign in" opens the same `AuthModal`. |
| Phone / email icons (`AuthBanner`) | Profile menu → My Profile, same Account modal. |
| 💳 Subscribe | Profile menu → Subscription (same destination: About's `TrialStatus` / `PoeTechPlusButton`). |
| Install + Share (`AppDoorControls`) | Menu (≡) and profile menu; same `AppShareQR`, same door URL. |
| Help (`HelpButton`) | Menu and profile menu; same help sheet and `helpFor`. |
| Notifications (`ArrivalsBell`) | The bell; same count source and panel; the dock copy stays for the auto-open-on-launch behavior. |
| Text size (`TextSizeControl`, hatch, `ComfortBarToggle`) | Personalize sheet → Accessibility; the Largest/Big Print fixed bottom hatch is kept as is (it is a floor for seniors, not clutter). |
| Reading voice (`ReadingVoiceControl`) | Personalize sheet → Voice; same `reading-voice.js`. |
| Theme swatches | Personalize sheet → theme cards; same `THEMES`, same `setThemePref`, same key. The reader's own picker in `TTSControl` stays. |
| Build / version block, FreshnessDot | Foot of the menu and Help. |
| "Show header" hatch, repeated titles (six places) | One brand line; the hatch's job (bring controls back) is the menu. |
| PublicWelcome "free to read, no account" | The sentence moves into the sign-in sheet; the component's `end` placement stays. |
| "Projections, not promises" strip | Shown where money is shown (Books, Giving Book, finance); not on the church homepage. |
| Back / Forward (`NavControls`) | Browser history untouched (`useBrowserHistoryNav`); a ← in the header on every non-home church screen. |
| Church sub-tab strip (TabScroll) | Dock + the menu's All Features (grouped exactly as `churchTabGroups`); the strip stays on tablet and desktop widths. |

### 4b. Every church tab (ids are the real ones; none renamed)

| id | label | gate today | reached in the redesign by |
|---|---|---|---|
| home | Church | open | dock Home |
| ministries | Ministries | open | homepage door, More first row, All Features |
| pulpit | The Word | open | dock Word |
| scripture | Scripture | open | Word page tab, All Features |
| engagement | Engagement | open | All Features (Worship & the Word) |
| choir | Choir | open | Ministries landing, All Features |
| bus | Bus Ministry | open (bus surface locks for signed-out) | Ministries landing, All Features |
| youth | Youth Zone | open | homepage door, Learning Zone, All Features |
| program | Order of Service | open | Watch page, All Features |
| learn | Learn | open | Learning Zone, All Features |
| institute | Institute | open | homepage card, homepage door, All Features |
| eternal-algorithms | Eternal Algorithms | open (route only) | Learn department, deep link |
| conference | Conference | open | More (Events & the campus) |
| events | Campus Rentals | open | More (Events & the campus) |
| projects | Projects | open; staff manage | More (Events & the campus) |
| my-record | My Record | signed in | dock Church, profile menu My Church |
| access | Access | signed in | dock Church |
| members | Members | signed in | dock Church |
| giving-book | Giving Book | office, not reviewer | dock Church (office group) |
| harvest · videowall · devices · infra-plan · observe | staff | `isChurchStaff` | dock Church (office group), as today; `observe` stays hidden-when-denied |

Deep links: `?view=church&sub=<id>`, `course=`, `lesson=`, `lovecorner=1`, `moore=1`, the ten legacy aliases, back/forward and scroll restore all ride `nav-history.js` unchanged. No route identifier changes.

### 4c. Everything else the brief named

Themes (11, same keys), text-size presets (5), read aloud and voice, notifications with counts, profile data, subscription status, Ari (same `/llm/chat` seam), Youth Zone games and badges, Institute, Ministries, Choir, Bus Ministry, Learn, Order of Service, admin surfaces, reviewer mode: all kept, each reached from the places in 4a/4b.

## 5. Component layout (new presentation layer; business logic untouched)

```
components/shell/AppHeader.jsx        one compact header: logo+name (BrandLockup), ← on inner screens,
                                      ArrivalsBell, HeaderAuthButton's avatar → ProfileMenu, MenuButton
components/shell/ProfileMenu.jsx      the list in Screen 1b; every row calls the existing handler
components/shell/AllFeaturesSheet.jsx the ≡ sheet: churchTabGroups() + Personalize + Help + Share + Install + build
components/shell/PersonalizeSheet.jsx theme cards over THEMES/useThemePref; TextSizeControl panel variant;
                                      ReadingVoiceControl; rate from tts.js; save/restore/reset
components/ChromeDock.jsx             church bar: Home · Watch · Word · Church · More (+READ slot); fix churchHomeSection
components/kids/KidsZoneShell.jsx     the bright frame around YouthZone's existing doors, games, badges, weekly lesson
components/kids/KidsAdventureCard.jsx wraps the existing lesson link (lessonUrl) + QuizBlock + TutorPanel in child mode
```

Real data each part reads: the header reads `authSession`, `profiles`, arrivals; the sheet reads `THEMES`, `TEXT_SIZE_STEPS`, `reading-voice`, `tts prefs`; the dock reads `churchSubTabs(...)`; the Kids Zone reads `learner_lesson_records` (badges, progress), `little-learners` / `living-lessons` modules, `trivia_questions`, KJV verse text. Nothing painted.

## 6. Implementation phases (each its own PR; `hold` is Darrell's brake)

| Phase | Scope | Tier | Done when |
|---|---|---|---|
| A | `AppHeader` + `ProfileMenu` + `AllFeaturesSheet`, mounted in place of the header block (:4124-4283) on the church door only; the family app's header untouched until reviewed | A | every control in §4a reachable; shell line count below 5,178; header tests green or updated with a why |
| B | `PersonalizeSheet` (themes, text size, voice, speed, save/restore/reset) | A | theme and text size persist exactly as before (same keys); the swatches test moves to the sheet |
| C | Dock: Church tab, `churchHomeSection` fix, Giving Book locked surface | A | lovecorner-dock test extended; Watch lights up |
| D | Kids Zone shell over Youth Zone; true age labels; Teens at the youth band; Ari child mode read | B | child-safety tests (no profile/chat/leaderboard) still green; progress derived; Ari posture proven in the prompt |
| E | Word builder and Who am I? games (verses verbatim, DR-0076) | B | each game reads only module/verse data; re-review 2026-11-19 honored |
| F | Tablet and desktop: header + strip; comfort probe re-run at 360/390/768/1440 and three text sizes | A | zero overflow, 36px floor, keyboard walk |

Phases A–F change no schema, no auth, no RLS, no payment. "Save my appearance" to a church member's account would need a `profiles` column: **not included**; proposed separately if wanted.

## 7. Testing strategy

Run the current suite (lint + 4 vitest shards + gates) on every PR. Add: header render tests (each control present once, by test id), profile menu handler tests (each row calls the existing function), personalize sheet persistence (same localStorage keys read back), dock Church tab + Watch active state, Kids Zone render (doors, games, badges derived; no profile/chat/scoreboard strings), comfort probe at four widths and three text sizes, deep-link sweep over every `VALID_CHURCH_SUBS` id, a keyboard walk header → dock → More. Live review after each merge per DR-0104; site-health after each deploy per DR-0125.

## 8. Not yet verified (said plainly)

- The signed-in header (Give, picture, name, phone/email, Subscribe, Share, Help, bell, voice, swatches, build) was audited in code, not observed live: the local build has no Supabase. The live walk happens in reviewer mode after Phase A.
- The family app (PoeTech face) header is out of scope for Phase A; its tests are listed in §3/15 and stay green because the new header mounts only when `churchDoorOnly`.
- No purple theme exists; adding one is a palette decision.
- Word builder and Who am I? are drawn, not built; they wait for their verse data and the dated re-review.

## 9. Decision requested

Approve Screens 1, 1b, 2 and 3 as drawn, or say what to change. Nothing under `app/src` moves until then.
