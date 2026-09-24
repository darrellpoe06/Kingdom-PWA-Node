# DR-0608 — The lesson door inside the app: built and pinned, its reader staged, and the transition from the inbox Way written before it is taken

- **Status:** accepted (the door ships; the reader is a disabled Routine the Governor arms; the transition has acceptance criteria and a human decision)
- **Tier:** A for the door (a chip and a tagged row into an RLS-scoped table that already exists); C for the transition (a new Way of processing; timer-driven AI-class automation, full brake set, ships staged per DR-0312's own precedent)
- **Type:** orchestration (a Way, DR-0108) + fix
- **Date:** 2026-09-24
- **Scope:** `app/src/lib/one-voice-routing.js` (destination `lesson`, the first-word marker rule placed FIRST, `planDispatch` case, `RULES_FOR_TEST`); `app/src/components/OneVoiceInput.jsx` (the `lesson` action relays to `agent_inbox` tagged `lesson` with the surface's source tag, failure said on the surface); `app/src/lib/one-voice-surfaces.js` (confirmation + honest failure line on both built-in surfaces); `app/src/__tests__/lesson-door-and-pm11.test.js` (the door's pins); the Routine **"In-app lesson intake (staged — Governor arms it)"**, disabled at creation
- **Principles:** APP-IS-PRIMARY (DR-0065), WAYS-REVIEW (DR-0108), SPEC-CONFORMANCE-REVIEW (DR-0219), THREE-BRAKES / EARN-AUTONOMY (a new processing Way ships staged), VERIFICATION-DOCTRINE (DR-0076 — proven-to-catch pins; the transition is measured, not declared), REPEATABLE-GOVERNANCE (DR-0607), DR-0312 (the inbox Way this door joins), DR-0218 (the sovereign relay this door rides)
- **Grounds:** Darrell, 2026-09-24: *"How can I currently use the PoeTech App to get a lesson or courses created like we currently do just make you source it from the intake inside the app?"* — with the comprehensive-review checklist — and, minutes later: *"I want a rigorous process before transitioning to a new way of processing... can or will we be capable of getting quality voice recordings?"* and *"Our workflows for our projects need to be tied end to end ensuring that they work first... how can we do that best?"*

## Context — the question (SHOULD → ARE → GAPS, DR-0219)

**SHOULD** (cited per DR-0219 §"The decision", `docs/decisions/DR-0219-spec-conformance-review-should-then-prove.md:32`). A teaching sent into the platform is build input (`CLAUDE.md:335`, "Spoken Teachings Are Build Input"). The inbox is a lesson door with a written protocol and an idempotency ledger (`DR-0312:8` "The Way"; `DR-0312:30` the `Lesson-Captured` label; `DR-0312:34` placement; `DR-0312:89` the lock brake). A directive spoken into the app persists to the sovereign `agent_inbox` table, RLS-scoped, polled outbound, never an inbound webhook (`app/src/lib/agent-inbox-sync.js:6`, citing migration 0127 and DR-0218). The app is the primary artifact: a capability that can live in the app should (`CLAUDE.md:301`).

**ARE (measured 2026-09-24).**

| door | state |
| --- | --- |
| this chat | live; the spoken-teaching law; every lesson today came through it or the inbox |
| Gmail "Lesson" marker | live; the 4-hourly Routine ran at 12:48 today and found nothing new; the 5-minute event watcher is **dormant** — `.github/workflows/lesson-mail-watch.yml:15` says so by design, and its run log reads "watcher dormant: GMAIL_WATCH_APP_PASSWORD secret not set (honest no-op)" (run 35985894117) |
| in-app Speak box | 8 destinations (`app/src/lib/one-voice-routing.js:31`); `poetech` writes a build directive; **no lesson destination**; the sovereign relay `relayThought()` (`app/src/lib/agent-inbox-sync.js:15`) existed with **no caller** in the app (grep: only its own definition) and `agent_inbox` holds **0 rows** (SQL count on the live project) |
| instance-authored courses | `courses` / `lessons` tables exist (0 rows, `lessons.audio` column present) with no writer in `app/src` — a separate authored-course path, not the lesson lane |
| voice | dictation is browser speech-to-text (`voice-dictation.js`, 5-minute cap, 3-hour long-form opt-in); the TRANSCRIPT is the record, no audio is kept; in-app audio capture exists only for voice enrollment (`voice-recording.js`: getUserMedia + MediaRecorder, 8-second floor, 30-second good sample) |

**GAPS.** No in-app door reaches the lesson lane; the sovereign relay is wired but unused; no reader exists for it; no audio path exists for a lesson; and no end-to-end proof exists for either door beyond the label ledger.

## What was built (the door)

1. **A `📖 Lesson` chip on both Speak surfaces** (`one-voice-routing.js:47` the destination, `:54` the marker rule first, `:131` the dispatch case; `OneVoiceInput.jsx:104` the handler is the relay itself, `:109` the action) (Church One Voice and the Thinking Space), suggested automatically when the text begins with the word *Lesson* — the same marker the inbox door reads — and placed FIRST in the rule table so no other keyword steals a marked lesson (pinned).
2. **Send relays the words to `agent_inbox`** tagged `['lesson']` with the surface's source tag, through the existing sovereign relay; a signed-out or refused insert is said on the surface with its reason, never swallowed; the words stay in the box.
3. **Nothing reads it yet.** That is deliberate (below).

## The transition, written before it is taken (his "rigorous process")

The new Way is not switched on by this record. It is **staged**: the Routine "In-app lesson intake (staged — Governor arms it)" is created **disabled**, carrying the same protocol as the inbox Routine (fetch in full; Word first; every verse verbatim and pinned; provenance honest; place it; full suite and lint; ship through the lane; mark captured ONLY after the push; report) with the three brakes: **budget** at most 3 rows per firing; **lock** the tag `lesson-captured` appended to the row's tags after the push, so a crashed run leaves the row unmarked and the next tick retries; **kill** the Routine is disabled in one call and its FAILED runs are the signal. It reads only rows whose `created_by` is Darrell's account; a `lesson`-tagged row from any other member is counted and reported, never captured, because widening the door is his decision (DR-0312).

**Acceptance criteria before the in-app door becomes a lane of record (a decision requiring his approval):**

1. **The end-to-end canary passes three times.** A canary row (`tags: ['lesson','canary']`, body "Lesson. canary <date>") is inserted from the app on his phone; the armed Routine captures it into a throwaway lesson on a `claude/canary-*` branch that is closed unmerged; the row reads `lesson-captured`; the elapsed time is recorded on the OpsBoard-style readout. Three consecutive passes, measured.
2. **Parallel run.** For at least three real lessons the same words go through both doors (spoken here or emailed, AND sent from the app); the captured lessons are compared; no loss of content, verses, or provenance.
3. **The report reaches him** where he sent it from: the confirmation names the lesson that shipped (the lane's report), not only "heard".
4. **A dated re-review** after the first month with the Routine's run history read from `list_triggers`.

Until all four hold, this chat and the inbox remain the lanes of record, and the in-app door is a second entrance whose rows are visible but unprocessed.

## Voice recordings — the honest answer (DR-0100 tiers)

- **Established:** the app already captures audio in-browser for voice enrollment (MediaRecorder, feature-detected, consent by the act of recording) and already stores private files in Supabase storage with signed URLs (the family vault, member documents, legal documents). The `lessons` table already carries an `audio` column. So a lesson intake that keeps the RECORDING, not only the dictated text, is buildable with parts that exist.
- **Quality:** browser dictation quality depends on the device microphone and the browser's own recognizer; it is fast and free and drops words on a poor mic. A kept recording transcribed by the sovereign whisper on the tower (`infra/church-gpu-node`, `voice-studio`) is the quality path, and it is gated by the same unopened door as the voice studio: the tower's password secret is not yet visible to a run (measured today, run 36005924144).
- **Not yet built, and not claimed:** a "record this lesson" control on the Speak box that uploads the audio to a private bucket, links it to the `agent_inbox` row, and lets the Routine transcribe it on the tower. It is the next buildable item once the tower opens; it is recorded here with a date, not assumed. `re-review: 2026-10-07`.

## Tying workflows end to end — how, in this house

Each workflow carries three things or it is not tied: **a written contract** (input → steps → output, with the record it reads and writes named — this record is one), **a canary that walks the whole path on a schedule** (not a unit test of one step: the arm lane's runner probe, the site-health outside-in probe, and the canary row above are the pattern — the runner is the team's eye where the sandbox cannot reach), and **a readout inside the app** where the last pass and its time are shown (the OpsBoard's uptime strip is the model; a "Ways" strip listing each intake door with its last canary is the next surface). A workflow that has all three can be trusted without one person remembering it works, which is DR-0607's sentence applied to our own Ways.

## What was measured

| what | measured |
| --- | --- |
| the router | `lesson` present on church and notes; the marker rule first; `planDispatch('lesson')` → its own action; fallback to a note when no relay, proven-to-catch |
| the box | relays with tags `['lesson']` and the surface's source tag; failure line rendered with the reason (source pins) |
| existing pins | `one-voice-routing` (the surface-count identity `DESTINATIONS.length * 2 - 2` still holds with the new door on both), `one-voice-dispatch`, `one-voice-surfaces`, `thinking-space-edit`, `it-listens-to-the-whole-thing` — green in one run with the door's own suite |
| the sovereign consumer | no NAS-side poller of `agent_inbox` exists in `infra/` (grep: only the migration and its smoke test); the staged Routine is the first reader |

## Decision

1. The in-app lesson door ships (the chip, the relay, the pins).
2. Its reader ships **staged**: the Routine exists disabled; the Governor arms it after the acceptance criteria above, and that arming is the transition.
3. The canary + parallel-run + report + dated re-review are the rigorous process for this and for every future change of a processing Way.
4. The voice-recording path is recorded as buildable with existing parts and gated by the tower, dated.

## Verification

- `lesson-door-and-pm11.test.js` and the suites named above, green in one run; eslint 0.
- After merge: DR-0104 live review on his phone — Church → Speak: type "Lesson. …", the 📖 chip suggested, Send, the confirmation; then in Supabase the row with `tags = ["lesson"]` and his `created_by` (the canary's first half).

## Limits, stated

1. **The report-back to the sender is not built.** Today the lane's report reaches this chat; the confirmation on the surface promises a report and the Routine's prompt carries it, but the surface itself does not yet show "your lesson shipped as L193". `re-review: 2026-10-07`.
2. **No Ways strip on the OpsBoard yet.** The last-canary readout is described above and not built. `re-review: 2026-10-07`.
