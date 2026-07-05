# Capability-Claims Audit — every promise the app makes vs. what the code delivers

**Date:** 2026-07-05 · **Trigger:** Darrell — "There are words written all over the app that we don't or potentially can't do. We need to actually be capable of all requirements written to users inside the PoeTech App."
**Governed by:** DR-0076 (Verification Doctrine — trust nothing unverified), DR-0075 (perpetual improvement — why + re-review date for anything parked), DR-0100 (speak established fact plainly), BUSINESS-PROCESS-CONNECTIONS (a surface's other end must be wired before it ships).

## Method

Five parallel audit passes swept the entire user-facing tree — all 146 components, the shell (`poe-financial-mvp-v28.jsx`), `surfaces.js`, `index.html`, the manifest, the service worker, and every promise-bearing lib string. Every user-visible claim (contact promises, sync/privacy/security guarantees, notification promises, live-data claims, tier/pricing features, "we'll reach out" copy, button labels implying delivery) was traced to its handler, its lib, its API endpoint, its migration, or its absence.

**~703 claims checked across ~156 surfaces. 69 failed the promise.** The rest verified WORKS (notable verified-true claims: append-only inventory is DB-enforced, Game Night phones-as-controllers is real Supabase Realtime, demo "nothing saves" is genuinely gated, sw.js offline shell is real, cross-device table-sync for signed-in users is real, tenant-portal scoping migrations are real).

## What was fixed this session

### Capabilities made real (code, not copy)

| Surface | Was | Now |
|---|---|---|
| Church → "Invite your church" form | Submission discarded — button only flipped local state; the confirmation ("we'll reach out… so we can reply") was backed by nothing | Wired into the real `app_interest` lane (`lib/interest-sync.js` → anon-insert RLS table → AppInterestAdmin console), source-tagged `church-invite`, with failure surfaced + email fallback |
| Choir → "Send an email invite" | RPC recorded an `instance_invites` row; **no email was ever sent** while the director was told "Invite sent to X" | Honest status ("invite recorded — no email goes out automatically") + one-tap pre-filled mailto so the director actually sends the email; access-on-next-sign-in unchanged (that part was real) |
| Venue / space requests | "A leader will reach out" while email AND phone were both optional — a reach-out could be impossible | `validateBookingRequest` now requires at least one contact method (test added, proven-to-catch); labels updated |
| InputCenter "Send →" | Default builder opened the note's own link (or `#`) while stamping "✓ sent" — fabricated delivery | Send renders only when the caller supplies a real destination |
| Rentals seed note | Hardcoded "All 11 rentals" shown to any user with equal rates | Driven by `rentals.length` |

### Copy corrected to the truth (the claim was false as written)

- **Waitlist privacy (shell):** "private inbox we run on our own infrastructure — no third-party" → the truth: relayed by formsubmit.co to Darrell's own inbox, used only to reach you, never sold. The phantom "reply to the email we send" (no email is ever sent) → "email darrellpoe06@gmail.com with your confirmation ID."
- **"Real-data view ships late June"** (stale, unshipped) → "in build"; "your data never leaves your device" (contradicted by the actual upload handler which posts to the NAS) → removed; the dead upload modal's "we read it in your browser, nothing saves" → truthful family-owned-server description.
- **$89 Household tier sold "🔒 Legal Matters — PIN + AES-GCM encrypted" as available now** while the module is an unbuilt placeholder (tasks #94–#99) → moved to Ships next. The Legal tab itself now carries an explicit **Build status** banner and presents its encryption/audit/export descriptions as the design contract, not current behavior.
- **Bible reader:** "highlights follow you across devices" → device-local truth stated, sync named as in build.
- **Feedback Center:** "nothing leaves your device until you choose to share it" → signed-in submit uploads immediately; copy now says exactly that.
- **Thought Finalizer:** "lives on this device only, never sent to the cloud" → contradicted by Study sync; now states it follows your sign-in through the family's own server.
- **Self-serve welcome:** "infrastructure you control" (it's PoeTech's Supabase) → "isolated space, walled off at the database level"; "yours to export or delete" → truth: per-page CSV today, whole-account export/delete on the build list.
- **Guardian panel / Family Roster:** the ask-first queue **can never receive a request** (no surface files one) and per-child switches have no runtime consumer — copy now states which walls are enforced today (DB-level child money wall) and that enforcement wiring is in build.
- **"🔔 Notify me · vote on priority"** → no notification pipeline exists; now "Vote on priority" with notifications named as coming.
- Also: Foundation export note (30-day reminder has zero code — now named as shipping with export), Loved Ones tier feature qualifiers, free-tier claim flow ("sending the pre-filled email finishes your claim"), sponsor SLA softened to "we aim to," Governance Queue "live" → "as of the last deploy," ChurchHome auto-live-stream claim → schedule-window truth, "Settings → My church home" dead buttons → "(coming soon)," DevOps fabricated "two warm prospects / Active This Year" section reference, Dispatch "sent" → "assigned," certificates "Verify {code}" (no verifier exists) → "Record ID," Practice Academy hours/certs device-only durability disclosures, Eternal Algorithms Game Night handoff (deck is never read by any game — in-page round named live, carry named in build), CreationWorkspace signed-in sync qualifier, SectionBoundary "nothing you entered was lost" → honest saved-data guarantee, VoiceStudio "available on a subscription" (no purchase path) → "subscriptions open soon," Engagement trivia "save across devices" (write-only, never read back) → "recorded; history views on the build list," Rentals "always finds the right address" → ~80% slug-guess truth.

## What is now visible in the app itself

Per App-Is-the-Primary-Artifact: the 18 promise-vs-reality gaps that need real builds are a new ledger, **`app/src/lib/capability-findings.json`**, read through onto the in-app **Concerns & Solutions board** (source `capability-audit`, read-only, each with a re-review date per DR-0075) via `capabilityToConcernCards()` in `lib/concerns.js` — the same auto-resolve contract as the DR-0086 audit feed: **when a build ships, its card is removed in the same PR.** Proven-to-catch test added in `concerns.test.js`.

Highest-priority open cards (full list in the artifact):
- **cap-n8n-rewrite-dead-paths** (re-review 2026-07-19) — property-history import + nas-photos still ride the `/n8n`/`/nas-photos` rewrites that `n8n-base.js` documents as always-502; likely dead in production.
- **cap-private-gate-fail-open** (2026-07-19, Governor decision) — the Financial/Legal/Sermons PIN gate unlocks without a PIN when the backend is unreachable, undisclosed.
- **cap-child-capability-enforcement** (2026-08-01) — wire `decideChildAction()` into real surfaces; file ask-first requests.
- **cap-waitlist-own-infrastructure** (2026-08-15) — restore the sovereign n8n wf29 intake and retire formsubmit.co.
- **cap-account-export-delete** (2026-08-15) — DATA-AS-EMPOWERMENT's export/delete commitment needs its surface.

## Verification

- Full suite: **365 files / 4,464 tests green** after changes (includes the two new proven-to-catch tests: venue contact-method requirement; capability read-through filtering).
- Monolith budget guard held at 5,907 (shell edits net-zero); consistency guard held (no new emoji-as-icon).
- Unverifiable-from-repo external claims (Twilio/Worker voicemail isolation, NAS runner latency, TLC staffing/insurance facts) are **flagged, not asserted** — cards carry the verification step.

## The standing principle this encodes

A word written to a user **is** a requirement. Every promise on a surface either has verified wiring behind it, or the surface says "in build" in plain sight, or it lands on the Concerns board with a date. Silence between those three states is the failure mode this audit removes.
