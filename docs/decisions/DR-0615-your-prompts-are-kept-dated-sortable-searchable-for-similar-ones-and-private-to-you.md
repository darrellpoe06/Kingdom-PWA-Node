# DR-0615 — Your prompts: every lesson and PoeTech request you send is kept, dated, sortable, searchable for similar ones, reusable in one tap, and private to you

- **Status:** accepted
- **Tier:** B (a migration: one new instance-scoped table private to its author, one SECURITY INVOKER function, a no-leak smoke in the isolation matrix)
- **Type:** feature
- **Date:** 2026-09-24
- **Scope:** `infra/supabase/migrations-auto/0232-your-prompts-are-kept-dated-and-yours-alone.sql`; `infra/supabase/tests/0232-saved-prompts-smoke.sql` and its leg in `.github/workflows/rls-isolation.yml`; `app/src/lib/saved-prompts.js` (new); `app/src/components/PromptHistory.jsx` (new); `app/src/components/OneVoiceInput.jsx` (remember on send, Save as prompt, reuse event); `app/src/components/ThinkingSpace.jsx` (mounts the history); `app/src/__tests__/saved-prompts.test.jsx` (new, 14); `app/src/lib/legibility-health.json` (one more page)
- **Principles:** APP-IS-PRIMARY (DR-0065), REALITY-TRACE (DR-0061), DR-0060 (tenancy; here narrower: author-only), VERIFICATION-DOCTRINE (DR-0076)
- **Grounds:** Darrell, 2026-09-24: *"We also need a historical prompts space so I can use the same or similar prompts later for various reasons."* and *"Dated and sortable etc..."*

## Context — the question

Everything Darrell sends to be built (a lesson, a request to PoeTech) was delivered and gone; there was no place to find last month's prompt, see how often he used it, or send it again with a change.

## What was measured

| what | measured |
| --- | --- |
| where his prompts land today | the lesson door and PoeTech requests (agent_inbox, the directive path); private notes stay on the device by design |
| an existing history of them | none in the app |
| the reality trace | real rows: `saved_prompts`, one per person per distinct prompt; the surface: Notes → Thinking Space, under the box he already types into; the live path: the same Supabase the app reads, through RLS |

## Impact

Unresolved: a good prompt had to be remembered or retyped. Resolved: each one is kept with its date, how many times it was used, and whether he chose to keep it; the list sorts five ways and a search finds the same or similar prompts; one tap puts a prompt back in the box, where he still chooses where it goes.

## Decision

1. **What is kept automatically:** a lesson or a PoeTech request sent from the Thinking Space or the Yahweh Hears You box. **What is kept on request:** anything else, with "Save as prompt". **What is never sent:** private notes, which stay on the device as before.
2. **One row per distinct prompt per person.** The same words again raise `use_count` and move the date (`remember_prompt`, `ON CONFLICT (created_by, body_sha)`), never a second copy.
3. **Private to its author,** even inside the same instance: every policy is `created_by = auth.uid() AND user_in_instance(instance_id)`; proven by the smoke (another member of the same instance reads none and changes none; a non-member cannot write). Both overlays re-run.
4. **On screen:** "Your prompts · N" under the Thinking Space box; each row shows its date and time, where it went, "used N times, first <date>", and kept; sorts: most recent, oldest first, most used, kept first, A to Z; search matches the phrase first, then prompts sharing words; buttons: Put it in the box, Copy, Keep, Delete.

## Verification

- `saved-prompts.test.jsx` 14: each sort; the list is never reordered in place; dates as written, unknown blank; search ranks the phrase first and finds similar prompts, and stays quiet on no shared word; remember goes through the counting function; signed out or empty remembers nothing; a refused read says why; only lessons and PoeTech requests are automatic; the table's five author-only policies and the smoke leg pinned; the history renders dated rows with counts, sorts and searches, and hands a prompt back to the box.
- The box's suites (draft autosave, one-voice routing and dispatch, the lesson door, spoken lessons), consistency, legibility and show-the-word guards: green. eslint 0.
- After merge: db-migrate applies 0232 on the database the app reads; on Notes, send a 📖 Lesson, and "Your prompts · 1" shows it dated; send it again and it reads "used 2 times".

## Limits, stated

1. **Prompts sent before today are not in it:** the history begins with this release. Past lessons are in the Living Lessons catalog and the decision records, with their grounds quoted. `re-review: 2026-10-07` — whether to seed the history from the decision records' grounds.
2. **The history lives on the Notes tab only.** The Yahweh Hears You box on the Church tab remembers into the same history but does not show it there. `re-review: 2026-10-07`.
