# TLC colleague onboarding — the intake packet lives in the TLC app

**Date:** 2026-09-10 · **Branch:** `claude/tlc-intake-form-xr7jhw` · **Rule:** DR-0344 (new), DR-0271, DR-0187, DR-0303, DR-0076, USER-ACCOUNTS-AND-HISTORIES-STANDARD, DATA-AS-EMPOWERMENT

**Trigger.** Darrell: *"We need the TLC Therapy Solutions intake form inside the TLC Therapy Solutions App... so Christina can on-board new colleagues inside the TLC Therapy Solutions App... go look at our Google drive and use that to build the system from as our scaling process or scaffolding."* Mid-build, with a screenshot of the door's "Match a Preferred Provider": *"On-boarding should also update the Apps and other online locations with new Therapists using the same format as the current ones."*

## The Ways review (DR-0108) — what Drive holds

- The Google Form **TLC Therapy Solutions – Therapist Onboarding | Hiring Form**, its **Responses** sheet (five colleagues, Sep 2025 to May 2026), and the **File responses** folder. The sheet's header row is the field list; the sheet body is where the cost shows: every answer in the clear, including bank routing and account numbers and, in one response, a CAQH password typed into the free-text box. None of that data was copied anywhere; only the question labels and the option lists were used.
- The **Independent Contractor Handbook** (section 9 is the acknowledgment text), the **Independent Contractor Agreement** and the **Confidentiality Agreement (NDA)**, all TLC-owned. The three in-app acknowledgments point at these documents and carry each one's own statement.
- The Drive form's `download_file_content` export failed with an internal error, so the option lists come from the observed responses (populations, specialties, hour slots, "No Clients Today"). If the form carries an option no colleague has ever picked, it is not in the app's list yet; Christina can name it and it is a one-line addition.

## What was built

| Piece | File | What it does |
|---|---|---|
| Migration | `infra/supabase/migrations-auto/0187-…sql` | `tlc_onboarding_invites`, `tlc_onboarding_packets` (bounded jsonb, headshot thumb), `tlc_onboarding_banking` (RLS on, **no policy**), `tlc_roster`; the private `tlc-onboarding` bucket with owner/office policies; SECURITY DEFINER functions for invite, revoke, open, save/submit, list, read (audited), banking reveal (audited), review (approve writes the clinicians row and the public card), withdraw, delete, roster upsert/remove/list, and the anon `tlc_public_roster()`; both overlays re-run |
| Spec (pure) | `app/src/lib/tlc-onboarding.js` | Every Drive question by label, grouped as the form reads; option lists; validation mirroring the server; ABA checksum; progress; link and path builders; the labelled export |
| Seam | `app/src/lib/tlc-onboarding-sync.js` | Every call through the migration's functions, timeouts on every network call, fail-soft sentences; documents as pointers; files removed before a row is deleted |
| Roster | `app/src/lib/tlc-roster-cards.js` (pure) + `app/src/lib/tlc-roster.js` (hook + seam) | The seed card format; live rows merged after the seven seed cards; `useTlcRoster()` on the TLC door, the Moore door's Practice tab and the operator Practice tab |
| Colleague | `app/src/components/TlcOnboardingForm.jsx` | Sliding sections, autosave draft, submit blocked on the device until the required answers and three signatures are in, export, withdraw |
| Christina | `app/src/components/TlcOnboarding.jsx` | Mint a link, open invites, packets, the readout, banking reveal (logged), the card preview she edits before approving, return with a note, the live roster editor with "Copy for website" |
| Readout | `app/src/components/TlcOnboardingReadout.jsx` | One read-only rendering shared by both sides; documents open on a short-lived signed URL |
| Mounts | `TlcPublicDoor.jsx`, `surfaces.js`, the shell (+1 line, budget 5344 → 5345) | `?onboard=TOKEN` swaps the door to the invite flow; an Onboarding section for the owner/admin; an Onboarding sub-tab on the operator TLC tab |

## Proof

- `tlc-onboarding.test.js` (30) and `tlc-onboarding-render.test.jsx` (11), both green; `tlc-door.test.js` re-pinned to the roster hook. Each source pin was broken once on purpose while writing and failed by name.
- Guards green: eslint, module-boundary, monolith-budget, migration return-type / replay-order / replay-completeness, rls-isolation-matrix, no-prompt, interconnect, infra-transport, business-systems (ledger whole at DR-0344), tenancy, assistant-scope, assistant-wall.

## Honest limits (DR-0100)

- The live round trip (mint on Christina's phone, open on a colleague's, upload, submit, approve, card on all three surfaces) is not exercised in the sandbox: no session can sign in to the live office from here. `re-review: 2026-09-17` with the first real onboarding.
- The website (tlctherapysolutions.me) has no write door the app holds; the app publishes to its own three surfaces and hands Christina the card text for the site editor. This is a named gap, not a claim.
- The existing Google Sheet still holds the five earlier responses, including the plaintext password and bank numbers. That sheet is Christina's to clean; the app does not read it. Recommended, in Drive by her hand (a dashboard step): remove the CAQH password cell, then restrict the sheet's sharing to herself.

## Same session, four more directives (the Drive sweep, training, the flatten)

Darrell pasted the whole *Training Notes for Therapists-in-Training* document, then: *"intuitive integration for easy on-boarding and user experiences"* · *"We have lessons etc can we make sure those workflows are inside the TLC Therapy Solutions App comb our drive for documentation of systems we need or should add here"* · *"Training etc..."* · with four screenshots of the operator TLC tab: *"we need sliding tabs like the others so there are only one or two levels"* · *"learn space... is different from the church learn space."*

**The Drive sweep — every TLC systems document found, and its in-app carry**

| Drive document | Owner | In the app now | Remaining |
|---|---|---|---|
| Therapist Onboarding \| Hiring Form + Responses + File responses | Darrell | The Onboarding intake packet (this delivery) | Christina cleans the old sheet (a Drive step by her hand: remove the password cell, restrict sharing) |
| Independent Contractor Handbook | TLC | Readable in place on Team, section for section (`lib/tlc-handbook.js`) | The Drive doc stays the source; a change there is a one-file edit here |
| Independent Contractor Agreement; Confidentiality Agreement (NDA) | TLC | Signed in the intake packet; linked on Team | none |
| Training Notes for Therapists-in-Training (six scripts) | TLC | Six courses in Training (`lib/tlc-session-scripts.js`), her words, verbatim KJV, four strands | Christina's in-app Agree on each |
| TLCTS LAUNCH (task tracker) | Christina | Linked on Team; the Assistant workspace carries the working schedule | A launch board in the Assistant workspace — `re-review: 2026-09-24` |
| Finding Peace: Biblical Wisdom for Life's Stressors (manuscript, 11 chapters) | Christina | Linked on Team | A client-facing lesson track; her quotations are NIV, the app hosts KJV/WEB, so verses open in place by reference — `re-review: 2026-09-24` |
| TLC Therapy Data (2025 prototype sheet) | Darrell | superseded by the app | none |

Not TLC Therapy: Streaming Instructions for TLC 2020 and *TLC Infrastructure* (the church), the career class (church youth), trucking and real-estate sheets.

**Built.** `lib/tlc-session-scripts.js` (six courses registered in the training library) · `lib/tlc-handbook.js` (handbook + office documents as data) · `components/TlcTeamResources.jsx` (Team) · `myPacketStatus()` in the seam · the TLC door gains **Training** (the TLC Learn space, `PracticeLearn`, never the church Learn space) and **Team** for every signed-in colleague; the invite flow points an approved colleague at them · the operator TLC tab is one strip — Practice · Client Growth · Learn · Intake · Assistant · Onboarding — `Practice` takes a `section` prop and renders the destination without its own strip (shell line count unchanged at 5345).

**Proof.** `tlc-session-scripts.test.js` (10) green, including every quoted verse against `app/public/bible/kjv` word for word; `tlc-training-library`, `tlc-course-strands`, `tlc-practice`, the door tests and the onboarding render tests re-run green; guards unchanged.

## Then: every TLC workflow inside the TLC app, on one slider

Darrell: *"there are tabs inside the PoeTech App that are not inside the TLC Therapy Solutions App?!"* · *"The tabs need to be only side by side... slider..."* · *"only two levels... make sure they make sense..."*

| Workflow | PoeTech TLC tab (one slider under the top nav) | TLC app (one slider) |
|---|---|---|
| Team & services / roster | Practice | Find your therapist |
| Pre-intake inquiries | Inquiries | Inquiries (staff) |
| Revenue estimate (from inquiries) | Revenue | Revenue (staff) |
| Client acquisition CRM | Client Growth | Client Growth (staff) |
| TLC Learn space (training, scripts, hours) | Learn | Training |
| Family inbound router (voice ops, incidents) | Intake | not carried: family ops, not TLC's; TLC intake is Inquiries |
| Referral / assistant workspace | Assistant | Assistant |
| Colleague onboarding | Onboarding | Onboarding (owner/admin) |
| Handbook, agreements, office documents | (via Onboarding packet) | Team |

Built: `lib/tlc-office-data.js` (the standalone office store over the same two syncs), `Practice` renders an operations sub-id directly (no chips) and takes `findRelatedAuto` from the lib, the door mounts Inquiries / Client Growth / Revenue for staff. Proof: `tlc-office-data.test.js` (8), door render (+2), guards green.

## Then: no Google link anywhere, and areas on a second row

Darrell: *"drive?! I want this built into the App!"* · *"why would you use Google?! fix it build the whole process workflows!"* · *"training tab is too deep... another tab slider for each section... any long scrolling tabs"* · *"users need to see the areas easier."*

| Document | Was | Now |
|---|---|---|
| Independent Contractor Agreement | Drive link | `lib/tlc-agreements.js`, read in place at the signature and on Team |
| Confidentiality Agreement (NDA) | Drive link | same |
| Independent Contractor Handbook | data, but the acknowledgment linked out | read in place at the signature (`TlcAgreementReader`) |
| Training Notes | six courses; Team linked the doc | Team fold → "Open Training" moves the slider |
| Hiring form | the intake; Team linked the form | Team fold → "Open Onboarding" (staff) |
| TLCTS LAUNCH tracker | Drive link | live board, `tlc_office_tasks` (0188), 15 rows in five phases |
| Finding Peace manuscript | Drive link | eleven client lessons, `lib/tlc-finding-peace.js`, 39 verses verbatim |

Areas (second-row chips, one shows at a time): Training = Lessons · What you'll gain · Course library · Training map · Pathways · Certificates · Hours · CE renewal · Catalog & required (per audience). Team = Documents · Launch board · Who we are. Onboarding = Invite · Packets · Roster.

Proof: `tlc-office-documents.test.js` (14), `tlc-onboarding-render.test.jsx` (16), `practice-learn-render.test.jsx` (9); full suite 13,071 passing; every CI guard green; build green.

Open, from Darrell in the same hour (next increment): every course as two lesson versions (with the Word, without it) so the curriculum serves every client; the 24 therapist trainings weekly and comprehensive on current Illinois policy; therapists schedule lessons for a client to review before the next session; every hand-off between tabs proven end to end.

## Then: two renderings, Illinois on every training, one a week, a lesson scheduled for a client (DR-0345)

Darrell, within the hour: *"build two lessons one with the Word and the other without it so our curriculum is capable of working for all clients"* · *"on click for the Word versions"* · *"the 24 trainings for therapists to be for the week... comprehensive... latest... Illinois policy and program and procedures"* · *"Therapist should be able to schedule lessons for their clients to review before their next session... all low hanging fruit"* · *"Each tab that should work together make sure they work end to end."*

| Built | Where | Proof |
|---|---|---|
| Plain rendering + the Word on click for every lesson | `lib/lesson-word.js`; `word` on the client modules; Finding Peace split into plain tips + her chapter; library lessons draw on the course's Yahweh strand; `LessonRunner` button + `VerseBlock` (verbatim from the corpus) | `tlc-curriculum.test.js`, `practice-learn-render.test.jsx` |
| Illinois: policy, program and procedure on every course | `lib/tlc-illinois-policy.js` (11 rules, dated 2026-09-10, cited, `verbatim:false`, `smeConfirm` on the open points); `withIllinois` in the library | same |
| One training a week | `buildWeeklyPlan`; the Training map leads with it | same |
| A therapist schedules a lesson | migration 0189 `tlc_lesson_assignments`; `lib/tlc-assignments.js` (+ `-core`); Assign-to-a-client on every lesson; For you / Assigned areas | same |
| Hand-offs end to end | Team → Onboarding → approve → Roster → Find; Team → Training → Lessons + Assigned | `tlc-onboarding-render.test.jsx` |

The Illinois wording is a paraphrase verified by web search (the primary IDFPR / ILGA / LII / Justia pages are egress-blocked from the sandbox); every rule names its primary page for Christina's ratification, re-review 2026-09-17.

Open, from Darrell in the same hour (next increment): *"Assistants and others need hierarchy for making sure we have appropriate governance and resources for our business."*

## Then: the office governs itself from the TLC app (DR-0346)

Darrell: *"Assistants and others need hierarchy for making sure we have appropriate governance and resources for our business"* · *"Owners and managers etc need to be able to govern using the same app."* Built: `lib/tlc-governance.js` (eight seats, reports-to, governs, may, reaches) and a Governance area on Team for the office owner/admin (`TlcGovernance`: chart, matrix, live members with guarded seat changes, removal, invite with a seat). Proof: `tlc-governance.test.js` (4), onboarding render (+2).

## Then: the pre-existing rls-isolation red, root-caused and closed (DR-0347)

The `viewer-readonly` leg's 0126 smoke ("write:choir grant did not unlock the choir area") was red since 0181 (2026-09-06): 0181's redefinition of `apply_viewer_readonly_overlay()` dropped 0126's capability predicate, and every later re-run rebuilt the pure deny in production (verified live). Migration 0190 carries both the predicate and the full participation list; `viewer-overlay-lineage.test.js` gates the class (proven-to-catch against 0181's own body); 0190 joins the matrix leg. Live proof: the next rls-isolation run after merge.

Darrell: *"not fake test... also documenting the best workflows behavior."* Added the `tlc-office` matrix leg (`0189-tlc-office-smoke.sql`, the real policies for 0188/0189, rolled back on the real database) and §9 of the operating model, the proof ladder. Live proof for both legs: the rls-isolation run db-migrate dispatches after this merges.
