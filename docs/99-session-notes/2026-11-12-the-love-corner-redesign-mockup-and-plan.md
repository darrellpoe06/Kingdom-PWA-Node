# 2026-11-12 — The Love Corner redesign: homepage mockup and implementation plan

Layer 4 working artifact (audit + reality-trace + plan). Branch `ccr-91fb688d-spyn2g`.
Status: **mockup approved by Darrell ("Perfect keep going", 2026-11-12); Phase 0 and Phase 1 BUILT the same
session (DR-1455), with the Institute's Slice A landing. Phase 2 (the Youth Zone, DR-1456) and Phase 3 (the Ministries landing, DR-1458) were built the same session once Phase 1 was live; Phases 4–6 remain as named in §7.** The real logo and
Bishop Gwin's photograph arrived mid-session and are in `app/public/lovecorner/`; the empty slot is gone.

Deliverables in this folder and in `docs/design/love-corner-redesign/`:

- `docs/design/love-corner-redesign/2026-11-12-homepage-mockup.html` — the interactive phone mockup
  (open in any browser; palette toggle; Bishop-photo loader; the Institute landing at `#institute`;
  the More sheet with every existing tab).
- `2026-11-12-mockup-home-hero.png`, `...-home-youth-ministries-institute.png`,
  `...-institute-landing.png`, `...-more-sheet-all-tabs.png` — stills of the same mockup.
- `2026-11-12-live-build-*.png` — the REAL app after Phase 1, built (`vite build`) and served at the site root the
  way Pages serves it, screenshotted on a 390×844 phone viewport: the hero with the real seal and portrait, the doors
  and the week, Youth Zone and Ministries, the Institute landing, the More sheet. The build needed placeholder
  Supabase values to boot locally (the real ones are deploy secrets); the sandbox has no route to poetech.us.

## 1. What was asked

Redesign the existing Church of the Living God / The Love Corner app face: a welcoming, mobile-first,
multigenerational homepage (hero with the emblem and Bishop Gwin, quick access, a rotating feature
area, a day-aware week), The Word as a Learning Zone, a Ministries landing, a Youth Zone, a prominent
**TLC Theological Institute** featured card with its own landing page (added mid-session), senior-friendly
comfort, a bottom nav, and every existing tab, route, permission and integration preserved. First
deliverable: a mobile mockup using the real logo and the real photograph, then a preservation
checklist, component layout, navigation mapping, phases and a testing strategy. Stop before coding.

## 2. Premise conflicts and facts surfaced before anything was drawn (feedback_surface_premise_conflicts)

1. **Bishop Gwin's photograph is not in the repository and nothing was uploaded to this session**
   (`/mnt/user-data/uploads` empty; no image of him under `app/public`). The mockup carries an
   honest, labeled empty slot and a local file loader so Darrell can preview the real photo in place.
   **No face was generated.** To ship, the real photo goes to `app/public/lovecorner/bishop-gwin.jpg`
   (or is attached to a session) and the hero reads it; until then the slot stays honest.
2. **The logo IS in the repository.** `app/public/lovecorner-icon-512.png` is the church's own seal
   (black ring, white field, gold cross, purple L, red heart, dove, "1946"); the manifest and the
   lock-screen already use it (DR-0753). The mockup inlines that exact file.
3. **Palette: the brief says purple + gold; DR-1060 (2026-10-16) made red + white the church door's
   default, measured from the same emblem.** Both are in the emblem. Measured from
   `lovecorner-icon-512.png` this session (DR-0076 §4): the L is `#582860` (most common purple
   bucket, 2,576 px), the cross is `#CFA63C` (207,166,60), the heart is `#E43C28` (DR-1060's red).
   **Decided by Darrell mid-session (2026-11-12): "make the colors red black white with a touch gold."**
   The mockup's default is now red `#C03222` (DR-1060's measured red), black `#1A1012`, white, and
   gold `#CFA63C` as the touch (the Watch button, the tagline, the laurel, the Give pill). Purple + gold
   stays one tap away as a comparison only. This confirms DR-1060's red + white + black and adds the
   gold accent; the production theme is the existing `lovecorner` theme with gold accent tokens added
   (no new default theme needed; a new DR records the gold touch).
4. **"TLC" collides with TLC Therapy Solutions in this codebase** (`app/tlc/`, `components/Tlc*.jsx`,
   `view === 'tlc'`; see the 2026-11-12 Institute note §2.1). The church's own face is The Love Corner.
   The Institute's **display name** is "TLC Theological Institute" exactly as the brief says; its
   **code identifier** is `institute` (surface id, `churchView`, ministry key), never `tlc`.
5. **"Events" means two things in the app.** The existing tab labeled **Campus Rentals** has the
   id `events` (`EventManagement.jsx`); the church's announced events live on the church record
   (`announcedEvents`) and render in Church Home → Parish Life. The homepage "Events" shortcut opens
   the church calendar (Parish Life + services), not Campus Rentals. Campus Rentals keeps its tab.
6. **The two announced events on the record are in the past** (77th Assembly 2026-07-14, Gospel Fest
   2026-08-29). The mockup therefore shows the honest fallback plus the weekly services; it does not
   paint a future event (brief §9: "If no current content is available, show an appropriate fallback").
7. **The Institute's courses.** Only four courses that already exist in the Learn catalog are shown
   as available (the Functions of the House; Who He Is; Made in Time; Handed Forward). Survey and
   doctrine courses, enrollment, certificates and announcements are shown as **Planned**. No
   accreditation, authorization or degree is claimed anywhere (brief §7; Institute note §6).

## 3. Audit: what the app is today (read before designing)

- **One app, several faces (DR-0258).** `app/lovecorner/app/index.html` serves the same React app
  (`src/main.jsx`) under scope `/lovecorner/` with `manifest-lovecorner.webmanifest`
  (`start_url: /lovecorner/app/?view=church&lovecorner=1`). `isChurchDoorContext()` →
  `churchDoorOnly` hides the PoeTech side nav and applies `CHURCH_DEFAULT_THEME`.
- **The Church tab is one `view` ('church') with a `churchView` sub-state.** The sub-nav is a single
  inline list in `poe-financial-mvp-v28.jsx` (~line 4277); mounts are the `churchView === …` block
  (~lines 4368–4654). Surfaces are registered in `app/src/surfaces.js` (lines 117–140) with
  `requires` / `gate` metadata (anyone · signed-in · church-staff · office).
- **Church Home** (`components/ChurchHome.jsx`, 976 lines) already carries: Live Worship (channel
  embed, service-window-gated, `lib/church-live.js`), One Voice, pastoral content, Testimony Diary
  door, "Yahweh Hears You" prayer intake, service times + save-to-calendar, media, Give + Parish Life
  (announced events), ministry interest, prayer requests, directory, invite, the share QR (DR-0176)
  and a LOG IN / CREATE ACCOUNT door.
- **Live:** `LiveWorshipBar.jsx` (shell-level pinned player), `FloatingPlayer.jsx`, `GoLiveControl.jsx`;
  the schedule is the record in `lib/default-church.js` (Sun 11:00 AM; Wed 1:00 PM and 6:00 PM).
- **Giving:** `ChurchGiveHeaderButton`, `lib/giving.js` — never invents a URL; the deep-link is still
  pending the office (`givingPageHint`). The Giving Book (office) is separate (0214).
- **Learning:** `ChurchLearn.jsx` renders 45 registered courses (`lib/learn-catalog.js`), with
  `AGE_BANDS` child 6–10 / youth 11–14 / teen 15–17 / adult / senior (`lib/learn-framework.js`),
  quizzes (`gradeQuiz`), read-aloud, print and download; `ScriptureLibrary.jsx` (Scripture tab);
  `Pulpit.jsx` (The Word tab); `Engagement.jsx` has a live `trivia_questions`-backed Trivia card.
- **Ministries:** `lib/church-ministries.js` registry of 23 ministries (bus, choir, band, media,
  ushers, security, hospitality, outreach, new-members, music, it, parking, deacons, prayer, missions,
  children, youth, college, school-outreach, administration, events, care, counseling) → table
  `church_ministries` (0223); `ChurchMinistries.jsx` is the directory; `Choir.jsx`, `BusMinistry.jsx`.
- **Members / office:** `ChurchMemberSpace.jsx` (My Record), `AccessRequests.jsx`, `ChurchMembers.jsx`,
  `ChurchGivingBook.jsx`, staff-only Harvest / Video Wall / Devices / Infra Plan / Observation.
- **Bottom bar:** `ChromeDock.jsx` already exists (feedback, text size A−/A+, Give, More, and a
  phone-width tabs mode) — the new bottom nav is a configuration of it, not a second bar.
- **Comfort:** `TTSControl` (read aloud), the text-size row (`index.css .ts-escape-hatch`),
  `lib/comfort-bar.js`, notifications, share, subscriptions — all shell-level and untouched.
- **Tests:** 1,923 files under `app/src/__tests__`; `npm run verify` = lint + ~40 deterministic
  gates (`verify:gates`) + the full Vitest suite. The monolith is under a line budget that may only go
  DOWN (`scripts/monolith-budget-guard.mjs`), so the new homepage must be a module, not shell growth.
- **Delivery lane:** PR → `ci.yml` → auto-merge on green → deploy (DR-0103/0107). The brief's "do not
  deploy to production without approval" is honored with the `hold` label on the redesign PRs.

## 4. Existing feature preservation checklist

Every row is kept, reachable from the More sheet (and the existing sub-nav, which stays as the
desktop/tablet rail), with the same `churchView` id, component, and gate.

| Tab (label today) | `churchView` | Component | Gate | In the redesign |
|---|---|---|---|---|
| Church | `home` | ChurchHome | anyone | becomes the new homepage shell; every existing section stays, below the fold or one tap away |
| Ministries | `ministries` | ChurchMinistries | anyone | Ministries landing (grouped cards) opens this |
| The Word | `pulpit` | Pulpit | anyone | Learning Zone entry; route unchanged |
| Scripture | `scripture` | ScriptureLibrary | anyone | kept; Learning Zone "Today's reading" |
| Engagement | `engagement` | Engagement | anyone | kept; its Trivia card feeds the Youth Zone |
| Choir | `choir` | Choir | anyone | kept as direct shortcut under Music & Worship |
| Bus Ministry | `bus` | BusMinistry | signed-in + bus role | kept as direct shortcut under Transportation |
| Order of Service | `program` | ServiceProgram | anyone | linked from This Week |
| Learn | `learn` | ChurchLearn | anyone | kept; Learning Zone "All courses" and the Institute's courses |
| Conference | `conference` | ConferenceModule / Variance / EventCenter | anyone | kept |
| Campus Rentals | `events` | EventManagement | anyone | kept under Events & the campus (id unchanged) |
| Projects | `projects` | ChurchProjects | staff (read-only otherwise) | kept |
| My Record | `my-record` | ChurchMemberSpace | signed-in | kept; Institute enrollment will show here |
| Access | `access` | AccessRequests | signed-in | kept |
| Members | `members` | ChurchMembers | signed-in / office | kept |
| Giving Book | `giving-book` | ChurchGivingBook | office | kept (staff group) |
| Harvest | `harvest` | HarvestLedger | staff | kept (staff group) |
| Video Wall | `videowall` | ChurchVideoWall | staff | kept (staff group) |
| Devices | `devices` | DeviceInventory | staff | kept (staff group) |
| Infra Plan | `infra-plan` | ChurchInfraPlan | staff | kept (staff group) |
| Observation | `observe` | ChurchObservation | staff (hidden otherwise) | kept (staff group) |
| Eternal Algorithms | `eternal-algorithms` | EternalAlgorithmsStudy | anyone | kept (reached from Learn as today) |

Shell features kept untouched: notifications, text size, read aloud (TTSControl), subscriptions,
share QR, Give header button, LiveWorshipBar, FloatingPlayer, Feedback, Admin → Actions reviewer mode,
PasswordAuth phone+PIN door, the `/lovecorner/` install identity, the service worker lifecycle.
No migration, no RLS change, no auth change in Phases 1–4.

## 5. Proposed homepage component layout (new module, mounted at `churchView === 'home'`)

```
components/lovecorner/
  LoveCornerHome.jsx          — the composition (replaces the top of ChurchHome; ChurchHome's
                                 existing sections mount below it, unchanged, in their order)
  HomeHero.jsx                — emblem · church name · Bishop photo · welcome · Watch Live
                                 (liveStatus from lib/church-live.js) · next service · visitor link
  FeatureCarousel.jsx         — rotating cards from lib/home-week.js (day-aware) + announcedEvents
                                 + office announcements; honest fallback when none
  QuickAccess.jsx             — 8 doors; each is a churchView (or #section) that already exists
  ThisWeek.jsx                — the 7-day strip + today's card from the church record's services
  LearningZoneCard.jsx        — Today's reading (scripture) · lessons (learn) · quiz/memory (engagement
                                 trivia + learn-framework quizzes) · sermon study (pulpit)
  YouthZoneCard.jsx           — Kids / Teens doors (AGE_BANDS child|youth|teen) + activity chips
  MinistriesCard.jsx          — 4 grouped cards over lib/church-ministries.js (ids listed in §6)
  InstituteFeatureCard.jsx    — the featured card (drawn SVG art, two buttons) → churchView 'institute'
  UpcomingCard.jsx            — announcedEvents (future only) + weekly services; fallback copy
  PrayerCard.jsx              — opens the existing "Yahweh Hears You" intake (addPrayerRequest)
  ComfortRow.jsx              — A−/A+ and Read aloud, wired to the existing text-size + TTS state
components/ChurchInstitute.jsx — the Institute landing (About · Courses · Enrollment · Students ·
                                 Certificates · Announcements), per the 2026-11-12 Institute note §5
components/YouthZone.jsx       — the Youth Zone surface (churchView 'youth')
components/MinistriesLanding.jsx — grouped landing over the existing ChurchMinistries directory
lib/home-week.js               — pure: weekday → feature cards (now passed in; tests pin each day)
lib/lovecorner-palette.js      — the measured tokens (purple #582860, gold #CFA63C, heart #E43C28)
lib/theme-css.js               — 'lovecorner' theme gains gold accent tokens (red, black, white + gold)
```

Real data each part reads (DR-0061 trace): church record (`resolveChurch`), `liveStatus(now)`,
`announcedEvents`, `church_ministries`, `LEARN_CATALOG`, `trivia_questions`, `learner_lesson_records`
(signed-in progress; never painted), `prayer_requests` (intake), the Institute tables once Slice B
of the Institute note lands. Nothing on the homepage shows a number that is not a count of real rows.

## 6. Navigation mapping

**Bottom nav (phone, via ChromeDock tabs mode):** Home → `church/home` · Watch → `church/home#worship`
(LiveWorshipBar + the in-page player) · Give → existing Give button (`resolveGiveDestination`) ·
Word → `church/pulpit` · More → sheet with every tab in §4, grouped: Worship & the Word · Ministries ·
Learning · Events & the campus · My church (signed-in) · Church office (staff) · Settings.

**Quick access (8):** Watch Live → `home#worship` · The Word → `pulpit` · Ministries → `ministries`
(landing) · Events → `home#parish-life` (announced events + services; save-to-calendar) · Give →
Give button · Prayer → `home#prayer` · Youth Zone → `youth` (new) · Connect → `home#directory`
(sign in / create account, ministry interest, directory, invite).

**Ministries landing → registry ids:** Music & Worship → `choir` tab, `music`, `band`, `media` ·
Transportation → `bus` tab · Children & Youth → `children`, `youth`, `college`, `school-outreach`
(+ Youth Zone) · Church Life → `hospitality`, `outreach`, `prayer`, `care`, `new-members`, `missions`,
`ushers`, `deacons`, `security`, `parking`, `it`, `administration`, `events`, `counseling`.

**Institute:** homepage featured card → `churchView 'institute'` (new surface, `requires: 'anyone'`);
"View Courses" → the same surface's Courses section, which links the four existing Learn courses by
key; also reachable from More → Learning and from the Learn tab. Ministry key `institute` added to the
registry so the directory and the feedback picker know it.

**Tablet / desktop:** the existing sub-nav rail stays (it already scrolls via `TabScroll`); the
homepage grid widens to 2–3 columns; the bottom nav is phone-only (`ChromeDock` already switches).

## 7. Implementation phases (each a PR with the `hold` label until Darrell lifts it)

| Phase | Scope | Tier | Files | Done when |
|---|---|---|---|---|
| 0 | Assets: the real Bishop photo into `app/public/lovecorner/`; gold accent tokens on the `lovecorner` theme; `lib/lovecorner-palette.js` (red, black, white, gold, measured) | A | public/, theme-css.js | photo renders at 2× on the hero; contrast gate passes for the gold-on-red and gold-on-black pairs |
| 1 | Homepage shell: `LoveCornerHome` + Hero + QuickAccess + ThisWeek + FeatureCarousel + bottom nav (ChromeDock tabs config) + More sheet; ChurchHome's existing sections mount below unchanged | A | components/lovecorner/*, ChromeDock config, surfaces.js, the one mount line in the shell | every §4 tab reachable in ≤2 taps on a 390px phone; monolith line count does not grow |
| 2 | Learning Zone card + Youth Zone surface (Kids/Teens doors over AGE_BANDS, trivia from `trivia_questions`, memory verse from the Scripture reader, badges = derived from `learner_lesson_records` counts, never painted) + child-account guardrails (no public child profile, no messaging; youth content read-only until a parent/household row exists per DR-0093) | B | YouthZone.jsx, lib/youth-zone.js, tests | badges proven derived (test sets rows → badge appears; deletes rows → it does not) |
| 3 | Ministries landing (grouped over the registry) + Institute Slice A (`ChurchInstitute.jsx`, `lib/church-institute.js`, featured card, registry entry, Learn category) | A | per Institute note §5 Slice A | Institute shows only the 4 existing courses as available; `launchState` never reads open without `confirmed` |
| 4 | Senior comfort + a11y pass: comfort row, 44px targets, keyboard order, screen-reader landmarks, reduced motion; tablet/desktop grid | A | lovecorner/*, index.css | axe + keyboard walk green on home, institute, youth |
| 5 | Institute Slice B (enrollment, attendance, credentials; migration 0325 + RLS + smoke SQL) | C | per Institute note §5 Slice B | office issues a certificate only through the server-side RPC; verify lookup returns the minimal fields |
| 6 | Institute Slice C (tuition on the store seam) — only on the Bishop's decision | C | per Institute note §5 Slice C | not started without the word |

Phases 0–4 touch no schema, no auth, no RLS, no payment. Phase 1 lands first and alone so the
homepage can be reviewed live (DR-0104) before the rest stacks on it.

## 8. Testing strategy

- **Unit (Vitest, jsdom):** `lib/home-week.test.js` pins every weekday's cards with `now` passed in,
  Champaign wall-clock (mirrors `church-live.test`); hero reads Live only inside a real window;
  Upcoming renders the fallback when `announcedEvents` are all past; Youth badges derived from rows
  (proven-to-catch both ways); Institute `launchState` and course-key resolution; the More sheet
  lists exactly the §4 ids (a snapshot of the id list, so a dropped tab fails the build).
- **Preservation gate (new, proven-to-catch):** a test imports the shell's church sub-nav list and
  `surfaces.js` and asserts every id in §4 still mounts under `churchView` with the same component
  and `requires` — removing or renaming one turns the gate red.
- **Existing gates stay green:** `npm run verify` (lint, ~40 gates incl. monolith budget, journey
  coverage, surface-hollow, contrast per theme, tenancy/RLS matrix) + the full suite (1,923 files).
- **Layout (CI probe already in the lane):** phone 390×844, tablet 820×1180, desktop 1440; no
  horizontal scroll; bottom nav only on phone; `TabScroll` rail on tablet/desktop.
- **Accessibility:** keyboard walk of hero → quick access → bottom nav → More sheet (focus trap,
  Escape closes, focus returns); screen-reader landmarks and names; A−/A+ and read-aloud unchanged;
  `prefers-reduced-motion` disables the carousel auto-advance and the live-dot pulse.
- **Live review (DR-0104):** after each merge, the reviewer-mode walk on poetech.us and on the
  `/lovecorner/` install: livestream, Give button destination, Choir, Bus Ministry (signed-in),
  Learn, My Record, Admin — recorded in this note's follow-up.
- **Site witness:** `site-health.yml` after each deploy (DR-0125).

## 9. What is NOT done (by design) and what waits on whom

- No file under `app/src` changed. Approval of the mockup is the gate (brief §12).
- Bishop's photograph: a value only Darrell holds → attach it or drop it in `app/public/lovecorner/`.
- Palette: DECIDED — red, black, white with a touch of gold (Darrell, 2026-11-12). Phase 0 adds the
  gold accent tokens to the `lovecorner` theme; `lovecorner-royal` is dropped from the plan.
- Institute name "TLC Theological Institute": taken from this brief; the Institute note's §7.1 name
  decision is thereby answered unless the Bishop says otherwise.
- The giving deep-link (`links.give`) and the Facebook URLs remain pending the office (unchanged).
- `re-review: 2026-11-19` — regulatory text for the Institute (Institute note §2.2), and this
  plan's Phase 1 start once approved.
