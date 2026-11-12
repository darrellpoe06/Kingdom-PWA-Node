# 2026-11-12 — The Institute in the Love Corner app: how the church's Bible college lives online

Layer 4 working artifact (reality-trace + architecture map). Branch `ccr-cfbe1079-mya7hi`.
Status: **plan, aligned up front, awaiting three Governor decisions** (named in §7); every slice that needs none of them is marked buildable now.

## 1. What Darrell asked

In substance: the church is building an institute (a church-owned Bible College and Ministry
Institute, certificates and diplomas first, degree authority later if the Bishop wants it), and he
wants the same institute to exist online, inside the church's app. He pasted a launch plan
(four phases, three programs, a student handbook, enrollment, credentials, a budget, a ten-step
checklist) and asked: look at this and tell me how we can make this work.

## 2. Two premise conflicts, surfaced before anything is built (feedback_surface_premise_conflicts)

1. **"TLC app" names the wrong face in this repo.** Here `TLC` is TLC Therapy Solutions, Christina's
   practice (`app/tlc/app/index.html`, `components/Tlc*.jsx`, `view === 'tlc'`). The church's own
   face is **The Love Corner**: `app/lovecorner/app/index.html` (scope `/lovecorner/`, DR-0258), the
   Church tab (`view === 'church'`), and the `components/Church*.jsx` surfaces. The institute is
   church-owned, so it belongs in **The Love Corner face, as a Church sub-surface**. This plan
   proceeds on that reading. If he did mean the therapy practice, nothing below is wasted: the same
   surface mounts under a different `view`, and the practice already carries the certificate model
   (`lib/practice-academy.js`).
2. **The pasted plan's regulatory claims are unverified by this build.** `www.ibhe.org` and
   `www.ilga.gov` are outside this session's network allowlist (DNS refused for both). The claims
   that Illinois exempts institutions devoted entirely to religion or theology, that religious
   certificates and diplomas are exempt credentials, that an exemption application and annual
   recertification are required, and that degree-granting needs separate authorization are
   **carried as the source's claims, not as fact we checked** (DR-0076 §8; DR-0100 tier 2, named
   narrowly). The app must encode them as a *state the office confirms*, never as a painted
   "exempt". `re-review: 2026-11-19` — read 105 ILCS 426/1-20 and the IBHE PBVS FAQ once a host
   is allowed, and record the exact text in the DR that establishes the institute.

Also carried, not decided: the plan is a drafted recommendation (it says "I recommend", "I favor").
The name, the programs and tuition are the Bishop's and Darrell's to decide (§7), not the draft's.

## 3. What is already true in the app (read before designing; nothing below is new ground)

| The plan needs | The app already has | Where |
|---|---|---|
| Courses with syllabus, lessons, objectives, reading, assessments | 45 registered Learn courses, one renderer, quizzes, age bands, read-aloud, print export, downloads | `lib/learn-catalog.js` (`LEARN_CATALOG`), `components/ChurchLearn.jsx` (CourseView), `lib/learn-framework.js` (`gradeQuiz`, `courseAssessment`) |
| Scheduled lessons on real dates, a cohort start, true weekday | the cohort pattern: dates COMPUTED from a published confirmed start, never typed | `lib/church-classes.js` (`CONFIRMED_COHORT`, `resolveCohortGeneric`, `buildSchedule`) |
| Progress, grades, cross-device, visible to leadership | `learner_lesson_records` (migration 0250): learner writes own rows, the Governor reads all | `lib/learner-records-sync.js`, `lib/use-learner-records.js` |
| A student record and signed policies | the member record, the covenant signed in place, the private shelf shared to the office | `components/ChurchMemberSpace.jsx`, `lib/church-member-sync.js`, migrations 0209 / 0210 / 0300 |
| An enrollment application | the form editors the member intake already uses | `components/TlcRecordEditor.jsx`, `ProductFormEditor.jsx`, `TlcDocumentAcknowledge.jsx`, `lib/church-member-intake.js` ("Growing" section already asks what they want to study) |
| Office-only administration | the church office wall: owner/admin of the church instance, enforced in the DB | `isChurchOfficeRole`, the `church-staff` / `signed-in` gates in `app/src/surfaces.js`, RLS in 0209 / 0214 / 0223 |
| A ministry people can find and join | the ONE ministries registry, the directory, the roster | `lib/church-ministries.js`, `components/ChurchMinistries.jsx`, table `church_ministries` (0223) |
| Certificates with a number and a verify code | the practice academy's pure certificate model | `lib/practice-academy.js` (`makeCertTemplate`, `issueCertificate`, `verifyCodeFor`, `certExpired`) |
| Paid seats, scholarships, a ledger | the store seam: `workshop_events` + `workshop_registrations` (0323), checkout + webhook, coupons and pay-what-you-want (DR-1448 / DR-1449), two processors behind one firewall (DR-1451) | `functions/api/checkout.js`, `functions/api/stripe-webhook.js`, `lib/workshops.js`, `lib/learning-products.js` |
| A launch checklist that is real | church projects with real rows | `components/ChurchProjects.jsx`, `lib/use-church-projects.js` |
| Leadership courses already written | "The Functions of the House: every office, from the Word" (counts measured from the KJV corpus), the Word & The Way department, Kingdom Life & Stewardship | `lib/church-offices-course.js`, `lib/who-he-is-course.js`, `lib/made-in-time-course.js`, `lib/succession-class.js` |

So the institute is **not a new platform**. It is one new Church sub-surface, one pure model, one
migration, and a few registry entries, wired to primitives that already carry real data.

## 4. Reality-trace (DR-0061): the real data each part reads and writes

1. **Programs and courses** — authored content, committed and deployed to everyone, exactly as every
   course today (the syllabus is a published document, not a painted number). Each program is a list
   of course keys from `LEARN_CATALOG`; a course that is not registered cannot be named by a program
   (a test enforces it, the same proven-to-catch shape as `learn-catalog-render.test.jsx`).
2. **Schedule** — computed from the program cohort's published start date and the weekly session
   slots (Tue 6–8 PM, Thu 6–8 PM, Sat 10–12 in the draft, all editable by the office); the true
   weekday is shown; nothing typed.
3. **Enrollment** — rows in a new `institute_enrollments` table, written by the applicant, read by
   the applicant and the office. The count on the office view is `count(*)`, never a figure.
4. **Attendance** — rows in `institute_attendance`, marked by the office per session date, read by the
   student for their own rows.
5. **Grades** — the quiz field already in `learner_lesson_records`; the completion standard is a pure
   function over those rows plus attendance rows. "Complete" is derived, never set by hand.
6. **Credentials** — rows in `institute_credentials`, written ONLY by an office-only RPC that first
   re-runs the completion function on the server side; each row carries a unique credential number
   and a verify code; a public verify lookup returns name, program, kind, date and nothing else.
7. **Regulatory state** — one `institute_settings` row per church instance: name, leadership,
   `exemption_status` (`not-filed` / `filed` / `confirmed`), filing reference and date. The public
   surface reads it and says plainly "Enrollment opens after the state confirmation" until the office
   sets `confirmed`. The Enroll button does not exist until then. That is the plan's own rule
   ("launch enrollment only after regulatory confirmation") carried by data instead of memory.
8. **Tuition** — rides the store's seat seam when the Bishop turns it on; the office's finance view is
   a read over the store ledger filtered to `kind: institute-tuition`, kept apart from the Giving Book
   (0214), because tuition is not a contribution.

## 5. The file map (what gets created or touched, and why)

### Slice A — the public institute surface (Tier A: no schema, no money, no new door) — buildable now
- `app/src/lib/church-institute.js` (new, pure, deterministic, `now` passed in): `INSTITUTE_META`,
  `PROGRAMS` (key, title, credentialKind, durationWeeks, courseKeys, sessionSlots), `programSchedule`,
  `completionStandard(records, attendance, program)`, `credentialNumber(seq, year)`,
  `launchState(settings)`, and the handbook sections as data (admission, tuition and refund,
  grading, integrity, complaints, attendance, transcripts, graduation).
- `app/src/components/ChurchInstitute.jsx` (new): Programs · Calendar · Handbook · Faculty · Apply
  (honest closed state until confirmed) · Office (owner/admin only). Rem-based text, 36px targets,
  `#B85838` focus ring, SectionTabs, mounted in the shell's SectionBoundary like its siblings.
- `app/src/surfaces.js`: one entry `{ id: 'institute', nav: 'church', view: 'church', sub: 'institute', requires: 'anyone' }`.
- `app/src/poe-financial-mvp-v28.jsx`: the Church sub-nav list (~line 4277) gains `['institute', 'Institute']`; the mount line joins the `churchView` block (~line 4650).
- `app/src/lib/church-ministries.js`: entry `institute` with `surface: { view: 'church', sub: 'institute' }` so the Ministries directory, the feedback picker and `church_ministries` all know it (check `scripts/feedback-area-guard.mjs` and the flyer gate when adding).
- `app/src/lib/lesson-links.js`: `LOVE_CORNER_DEPARTMENTS` gains `'The Institute'` so institute lessons open in the church's door, not PoeTech's.
- `app/src/lib/learn-catalog.js`: the institute's own courses (Old Testament Survey, New Testament Survey, Biblical Interpretation, Christian Doctrine, and the leadership and ministry courses) register with `category: 'The Institute'`; where an existing course already teaches the material it is referenced by key, not duplicated.
- `docs/00-foundations/_root/CHURCH-TAB-DIRECTORY.md`: the institute joins the Church tab's directory; `docs/decisions/DR-1453-*.md` establishes it (number provisional against `main`'s pointer, DR-0052).
- Tests: `church-institute.test.js` (program keys resolve, schedule dates and weekdays, completion standard proven-to-catch on a missing quiz and a missed attendance floor, launchState never reads `open` without `confirmed`), a render test for the surface, the ministries registry test.

### Slice B — enrollment, attendance, credentials (Tier C: a schema; no money)
- `infra/supabase/migrations-auto/0325-the-institute-keeps-its-roll-its-attendance-and-its-credentials.sql`:
  `institute_settings`, `institute_enrollments`, `institute_attendance`, `institute_credentials`;
  RLS on the 0223 pattern (applicant reads and writes own; office reads and writes all; `instances` scoped);
  `institute_issue_credential(p_enrollment uuid)` SECURITY DEFINER, office-only, recomputes completion;
  `institute_verify_credential(p_code text)` returning the minimal public fields.
  Smoke test in `infra/supabase/tests/0325-*.sql`; replay order and return-type guards already in `verify:gates`.
- `app/src/lib/church-institute-sync.js` (new): the sync sibling on the `church-member-sync.js` contract (every read three-valued through `lib/church-access.js`, timeouts, no `error` destructured away — DR-1053).
- `components/ChurchInstitute.jsx`: Apply becomes the real form (the intake editors), the office tab gains Applications · Roll · Attendance · Credentials; `ChurchMemberSpace.jsx` My Record shows the student's enrollment, attendance and earned credentials; `usePrinting` renders the certificate (institute legal name, student, program, completion date, signatures, credential number, verify code).
- The student handbook ships as a document on the church shelf shared by the office (0300) and is acknowledged in place (the 0210 signature door) at application.

### Slice C — tuition and scholarships (Tier C: real money) — built only on the Bishop's decision
- A program cohort becomes a `workshop_events` row with its price; enrollment-with-payment reuses
  `workshop_registrations` and the existing checkout and webhook; scholarships are coupons (DR-1449);
  the office finance view reads the ledger by kind. No new processor, no new firewall.

### The launch checklist, in the app
- The ten actions become a church project in `ChurchProjects.jsx` with real rows the office checks off;
  the institute surface's Office tab shows the project's live count. "0 of 10" is never painted.

## 6. What this does not do
- It does not claim accreditation or degree authority anywhere; the credential kinds are
  `certificate` and `diploma` only, and the copy says "religious certificate" and "religious diploma".
- It does not put money in motion until the Bishop decides tuition (§7).
- It does not resolve the pasted plan's regulatory claims; it carries them as the office's confirmed
  state (§2.2).

## 7. The three decisions only Darrell and the Bishop hold (DR-0111 carve-outs), each with a default
1. **The institute's name.** The draft favors "Living God Biblical Institute". Default: the surface
   reads the name from `institute_settings` and shows "The Institute · name pending the Bishop's
   decision" until the office types it. Slice A ships name-agnostic.
2. **Tuition.** Charged or not, and the amounts; whether Yahweh knowledge stays free (the Academy
   ladder, `lib/cohort-programs.js`, already says it does). Default: Slice A and B ship with no price;
   Slice C waits on the word.
3. **Is The Church of the Living God incorporated with its own EIN and bylaws?** The draft's own
   closing question. It changes the paperwork (board resolution, institute charter), not the app.
   The app models the institute as an educational ministry of the church instance either way.

## 8. Order of work
Slice A now (same lane, Tier A). Slice B next, with the migration applied by hand and the smoke test
green before the surface reads it. Slice C on the Bishop's decision. The regulatory re-review on
2026-11-19.
