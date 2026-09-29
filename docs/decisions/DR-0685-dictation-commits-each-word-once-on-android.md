---
id: DR-0685
title: Dictation commits each word once — Android Chrome's cumulative "final" partials no longer pile up in the box
status: accepted
date: 2026-09-29
tier: A
type: fix
declared_by: Darrell
scope:
  - app/src/lib/voice-dictation.js (createFinalCommitter + growingPrefixDelta; the hook commits finals through it and calls the latest onTranscript)
  - app/src/components/OneVoiceInput.jsx (functional append, so two chunks in one tick both land)
  - app/src/components/ClientDiscovery.jsx (the mic button called an undefined `start`; it now calls `toggle`)
  - app/src/__tests__/dictation-no-duplicate-partials.test.jsx (new)
principles: [VERIFICATION-DOCTRINE (DR-0076), REALITY-TRACE (DR-0061), CHARACTERIZE-BEFORE-CHANGE, ONE-PRIMITIVE (DR-0131)]
grounds:
  - public.agent_inbox row 8d290c20-1d1c-4901-b8a8-a99b45734e76 (the evidence; not modified here, another lane owns it)
  - DR-0131 — one voice primitive for every input
---

## Context — what was measured

A lesson spoken into Thinking Space on Darrell's phone (Android, Chrome) on
2026-09-29 17:59 UTC was saved to `public.agent_inbox` as **54,115
characters**. It opens:

> lesson lesson or or how or how or how did or how did or how did the or how did the or how did the all ...

The tail of the same row reads as normal speech. Every growing snapshot of
each sentence had been kept as new words.

## SHOULD / ARE / GAPS

- **SHOULD** (`voice-dictation.js`, header): "Duplicate-proof ... a pause
  never re-inserts the sentence before it." Interim words shown live, finals
  appended once.
- **ARE**: Thinking Space's box is `OneVoiceInput` → `useVoiceDictation`.
  `onresult` forwarded `extractNewFinalTranscript(e)`: every result from
  `e.resultIndex` onward with `isFinal` true. Android Chrome in continuous mode
  reports each partial as a result **already marked final**, holding the
  **whole utterance so far**, at a fresh index (or re-reporting the whole list
  from `resultIndex` 0, or reusing one slot). Each snapshot therefore passed as
  "new final text" and was appended.
- **GAPS**: (1) finals were trusted by `resultIndex`/`isFinal`, which Android
  does not honor; (2) the engine's handlers captured `onTranscript` once at
  start, so a surface appending to its own current value (property captions)
  appended to a stale one; (3) `OneVoiceInput` appended through a ref updated
  only on render, so two chunks in one tick lost the first; (4)
  `ClientDiscovery`'s mic called `start`, which the hook never returned — the
  button did nothing.

## Decision

- `createFinalCommitter()` owns final text for a dictation session. Each result
  slot commits once; the same slot returning grown commits only the new words;
  a repeat or a shrink commits nothing. A **new** slot that grows the last
  committed utterance by whole-word prefix (Android's cumulative snapshot)
  commits only the added words — the safety net — within a 10-second window,
  so a real repeat after a real pause is still kept. A push-to-end engine
  restart forgets slots but keeps the last utterance.
- Interim words never pass through it: they are shown live and **replaced**
  each event.
- The hook calls the latest `onTranscript`; `OneVoiceInput` appends
  functionally; `ClientDiscovery` calls `toggle`.
- Every surface on the shared hook gets the fix at once: Thinking Space /
  Creating Station / Church (OneVoiceInput), Messages, Direct Messages,
  property captions, Study, Thought Finalizer, Eternal Algorithms, Story
  Explorer, Client Discovery.

**Whisper recorder path, checked:** `VoiceLessonRecorder` / `recorded-note` /
`workflow-scribe` record an audio blob with MediaRecorder and receive one whole
transcript back from the NAS; no interim results exist on that path, so it
cannot produce this shape. `workflow-scribe` only calls
`releaseSpeechRecognition()`.

## Evidence

- Characterized first: before the fix, the new surface test received
  `"lesson lesson or or how or how or how did or how did or how did the ..."`
  — the row's opening, word for word. The desktop-shape case passed before and
  after (unchanged behavior).
- After the fix: 8/8 in `dictation-no-duplicate-partials.test.jsx`.
- Proven to catch: disabling the cross-slot prefix branch fails 3 of the 8;
  the old commit rule, run over the same events, rebuilds the row's opening.

re-review: 2026-10-29 — sample new Android-dictated `agent_inbox` bodies for
any remaining prefix repetition.
