# DR-0343 — The colleague intake lives in the TLC app, and approval publishes the card

- **date:** 2026-09-10
- **status:** accepted
- **tier:** B (one additive migration: four instance-scoped tables, one private bucket, SECURITY DEFINER functions gated on the existing office role; no money moves; the only public-facing change is an anon-readable roster function returning the same five public columns the seed cards already publish)
- **decides:** where a new TLC colleague's intake packet lives, who reads it and how that is proven, what the app refuses to collect, and that approval feeds the "Match a Preferred Provider" roster in the format the current cards use
- **pairs-with:** DR-0271 (assistant rights; the office owner/admin gate), DR-0187 (two-party invite; membership is a separate act), DR-0303 / P40 (the list never carries the bytes), DR-0060 / DR-0074 (the database is the wall), DR-0076, DR-0100, DR-0108 (Ways review), USER-ACCOUNTS-AND-HISTORIES-STANDARD, DATA-AS-EMPOWERMENT behaviors 6 and 7
- **source:** Darrell, 2026-09-10: *"We need the TLC Therapy Solutions intake form inside the TLC Therapy Solutions App... so Christina can on-board new colleagues inside the TLC Therapy Solutions App... go look at our Google drive and use that to build the system from as our scaling process or scaffolding."* Then, mid-build: *"On-boarding should also update the Apps and other online locations with new Therapists using the same format as the current ones."*

## The Ways review first (DR-0108)

The scaffolding in Drive is the Google Form "TLC Therapy Solutions – Therapist Onboarding | Hiring Form", its Responses sheet, and a File-responses folder; five colleagues have come through it (Sep 2025 to May 2026). Beside it: the Independent Contractor Handbook, the Independent Contractor Agreement, and the Confidentiality Agreement (NDA), all TLC-owned. What the form does well is the question set: it is complete and the colleagues already know it. What the form costs is that every answer lands in one shared sheet in the clear: dates of birth, home addresses, bank routing and account numbers, and, in one response, a CAQH password typed into a free-text box. That is established fact from the sheet itself (DR-0100), and the app must not inherit it.

What the app already held: the clinicians roster (schema v2.3, never fed by anything), the 0104 token invite and 0130 office role Christina already uses for assistants, private buckets born by migration (0078 / 0180), the 0186 thumbnail cap, and the seven roster cards in `lib/tlc-practice.js` that three surfaces render.

## The decision

1. **The intake is the app's, field for field.** `lib/tlc-onboarding.js` carries every question the Drive form asked, under the same label, grouped the way the form reads, with its option lists (populations, specialties, the 7 am to 9 pm hour slots, "No Clients Today"). The seven-day availability grid, the 150 to 300 word bio, and the three signed acknowledgments are kept as they were.
2. **Three departures, each a safety, each pinned by a test.** No password field: the form's "CAQH Username/Password" becomes "I have added TLC as an authorized practice manager in CAQH". Banking is not in the packet: bank name, routing and account numbers go to `tlc_onboarding_banking`, RLS on with no policy, written through `tlc_onboarding_save` and read only through `tlc_onboarding_banking_read`, which audits every reveal; every other read returns last four. Uploads are pointers into the private `tlc-onboarding` bucket, never bytes in the row; the headshot rides as a 160 px thumbnail plus the full file.
3. **The link is a token minted by the office owner/admin;** the packet binds to whoever signs in with it. Filling in a form makes no one a member: app access stays the Team access handshake (DR-0187 / DR-0271).
4. **The record is the colleague's** (USER-ACCOUNTS-AND-HISTORIES-STANDARD): scoped to their account and to the office; they read it back, export it as labelled JSON, and withdraw it, a hard delete that removes files first and cascades banking. The office can remove one it holds. An office read of a colleague's record writes an audit row, not only the banking reveal.
5. **Approval publishes.** `tlc_onboarding_review('approve')` writes the clinicians row (bound to the applicant's user id) and, given the card Christina previewed and could edit, a `tlc_roster` row in the seed format: name, role, specialty line, page link, photo. `tlc_public_roster()` (anon, public columns only) feeds `useTlcRoster()`, which merges live rows after the seven seed cards, a live row replacing a same-name seed card. The TLC door, the Moore door's Practice tab and the operator Practice tab all read it.
6. **Where it lives:** the TLC door (`?tlc=1`) gains an **Onboarding** section for the office owner/admin and an invite flow under `?onboard=TOKEN`; the operator TLC tab gains an **Onboarding** sub-tab (registry-mounted; the shell grew one render line, budget 5344 to 5345 with its reason).

## What is NOT decided

- The website (tlctherapysolutions.me) has no write door the app holds; the app cannot push a card there. Each roster card copies out as text for its editor. If a write path appears, it is a new DR.
- Whether an approved colleague should be auto-invited as an app member: no. Access is a separate, explicit grant (DR-0187). Re-review 2026-10-01 after the first live onboarding, with Christina.

## Proven-to-catch (DR-0076 §3)

- `tlc-onboarding.test.js` (30): every Drive question present by label; no password field; banking never a packet key; option lists kept; submit rules mirror the server; ABA checksum; link and path shapes; export never carries full numbers; roster card shape equals the seed shape; source pins on 0187 fail if banking gains a policy, an audited function stops auditing, the save stops refusing a password or banking key, the bucket goes public, the list selects the body or headshot, the overlays are dropped, or the public roster function leaks a non-public column.
- `tlc-onboarding-render.test.jsx` (11): the real form opens, refuses an unsigned submit on the device, saves through the one write; the real office panel mints a link landing on `/tlc/app/?tlc=1&onboard=`, previews the card, reveals banking only on demand, approves with the card, returns with a note; the real door swaps to the invite flow under `?onboard=` and renders the live roster card after the seed cards.

## Honest limit (DR-0100)

The sandbox cannot sign in to the live office, so the live round trip (mint, open on a phone, upload, submit, approve, card on the door) is unexercised here; it rides the same RPC and storage seams every other surface uses, and the migration's shape is pinned. `re-review: 2026-09-17` — run one real onboarding with Christina and confirm the card appears on all three surfaces.
