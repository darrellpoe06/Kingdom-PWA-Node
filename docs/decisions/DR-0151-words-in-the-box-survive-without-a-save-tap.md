# DR-0151 — Words in the box survive without a Save tap

- **Status:** accepted
- **Tier:** A — device-local draft persistence on the existing one input primitive; no schema, no money, no new external face
- **Scope:** `lib/draft-autosave.js` (the pure draft store), `components/OneVoiceInput.jsx` (restore on mount + save-as-you-type + clear on send + the quiet notice), `__tests__/draft-autosave.test.js` (round-trip, isolation, the stall-out remount, send-clears)
- **Date:** 2026-07-10
- **Principles:** DATA-AS-EMPOWERMENT (device-local; nothing egresses until sent), ANXIETY-CLARITY, APP-IS-PRIMARY, NO-STATIC-DATA, VERIFICATION-DOCTRINE (DR-0076)

## Directive

Christina, 2026-07-10 (relayed by Darrell with her Thinking Space screenshot, "1. Book cover" typed and unsaved): *"Can you see if you can automatically save your notes like a google doc without hitting save. So when you stall out with time or forget and come back, your information is still there."*

## The verified trace

The Thinking Space (and every tab's input) is the ONE primitive — OneVoiceInput (DR-0131). Its text lived only in React state: a reload, a closed tab, a stall-out, or simply forgetting Save meant the words were gone. The family's first writer asked for the Google-Docs contract: presence without a tap.

## Decision

1. **Every edit persists the draft** — text, chosen destination chip, and name — to a device-local store keyed per surface (lightly debounced). An emptied box clears its draft: an empty box is not a draft.
2. **Coming back restores it.** The box mounts holding the draft, the chosen chip restored (and honored — the suggester doesn't overwrite a restored choice), with a quiet one-line notice: *"Your unsent words were kept — everything here saves as you type, no Save needed."*
3. **A successful Send clears it.** Delivered words are not a draft.
4. **Sovereign by construction:** drafts are localStorage on the writer's own device — nothing leaves until they choose a destination and send (the DR-0131 routing contract unchanged).

## Extension (same day)

Darrell's follow-up — *"Will the notes sections in the app auto save notes for return to keep editing?"* — extended the contract to EDITING an existing note (Thinking Space): the in-progress edit drafts itself per note (`notes-edit:<id>`), reopening the note restores the unsaved edit, Save commits and clears, and Cancel abandons the draft on purpose (an explicit Cancel is a decision, not a stall-out). Pinned in draft-autosave.test.js.

## Opportunities and constraints

- **Opportunity:** the same draft contract for the other long-form editors (song words/lyrics form, sermon notes, feedback composer) — the store is surface-keyed and ready. `re-review: 2026-07-17`.
- **Constraint (held):** device-local means a draft does not follow the writer across devices — cross-device drafts would need a synced store and are a different (Tier B) decision; the notice says nothing false about this.
- **Constraint (held):** storage-blocked browsers (private mode) degrade to today's behavior — never a crash, honestly no draft.

## Supersedes / pairs

Pairs with DR-0131 (the one primitive this protects — fixing it once fixes every tab), DR-0141 (Ari as input manager — the draft is the input's memory), DATA-AS-EMPOWERMENT. Supersedes nothing; adds the missing persistence contract.
