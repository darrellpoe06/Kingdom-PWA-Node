# DR-1335: A person gets a code and a reference, never the exception's words — 26 sites rewritten, a guard keeps it so

**Date:** 2026-11-05
**Status:** accepted
**Tier:** A (error responses change shape; one witness-pinned key kept; no data path touched)
**Type:** security posture + gate (VERIFICATION-DOCTRINE) · DR-1330 D5
**Area:** `scripts/error-text-guard.mjs`; `scripts/error-text-allowlist.json`; `app/src/__tests__/error-text-guard.test.js`; `app/functions/_lib/funnel-proxy.js`; `app/functions/api/voice-speak.js`; `backend/voice-worker/src/index.js`; five NAS services (`whisper-gpu`, `avatar-studio`, `nas-llm`, `nas-tax-ingest`, `voice-studio`); `app/src/components/ErrorBoundary.jsx`; `app/src/__tests__/error-boundary-speaks-a-reference.test.jsx`; `.github/workflows/ci.yml` (guards leg)
**Grounds:** VERIFICATION-DOCTRINE (DR-0076 §3, §5 characterize before you change), DR-0104 (reviewer mode is where the steward reads the build), DR-0092 (the error journal), DR-1330 (the review that measured the sites)

## Context

The Ways review (DR-1330) found the slide's pitfall avoided in its literal form (no `err.stack` or traceback reaches a user) and not in substance: 26 places returned the exception's own words, which can carry a path, a host, a query or a library's internals. Darrell ratified the build.

## What was measured

- **The sites, counted by grep and each read:** `detail: e.message` in `funnel-proxy.js`, `voice-speak.js` and the voice worker; `"detail": str(e)` in twelve FastAPI responses (whisper-gpu 2, avatar-studio 5, nas-llm 1, nas-tax-ingest 1, voice-studio 3); and the app's error card showing `error.message` under "Technical detail" to anyone. The eleven other `str(e)` hits are report dicts batch runners write to their own logs or tables, not responses, and are left alone.
- **The shape now:** a short code and a `ref` (twelve hex characters from the runtime's random id) to the caller; the exception text to the log under `[ref]` with `exc_info` (Python) or `console.error` (Workers). The five services each gain a six-line `_ref(e)` helper rather than a shared module, because each deploys alone. **One pinned contract kept:** the proxy's 502 keeps its `detail` KEY, which the site-health witness greps for (`every-road-signs-itself.test.js` pins the key names); its value is now a constant phrase.
- **The error card:** everyone sees `Reference <8 hex>`, which prefixes the journal entry on the Quality board; the exception text renders only under reviewer mode (DR-0104). Pinned both ways: a thrown `ENOENT: /volume1/secret/path.json` never reaches the screen for a person and does under reviewer mode.
- **The guard** reads every tracked `.py`, `.js`, `.mjs`, `.ts` under `app/functions`, `backend` and `infra` (204 files; tests, vendor and fixtures skipped) and fails a line that both builds a response and carries exception text. Proven to catch on the four 2026-11-05 sites verbatim and on eight shapes in both languages; a log line, a report dict and a comment pass. Allowlist: path + line + why + date; empty.

## Impact

A new endpoint that echoes an exception turns the guards leg red from its first push. A person who hits an error gets something they can read out to a steward, and the steward finds the cause by that reference in the log or the journal. Nothing a person sees names a path or a host.

## Decision

`error-text-guard` runs in the guards leg. The policy for every server and the app: code + ref to the client, text to the log under the ref; the exception's words appear on a screen only under reviewer mode.

## Verification

`error-text-guard`: OK (204 files, 0 allowlisted); its suite 4 cases; `error-boundary-speaks-a-reference` 2 cases; `every-road-signs-itself`, `books-tx-white-screen` green (28 tests across the four); the five Python services compile; lint clean on every `src` file changed; `ci.yml` parses.
