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
