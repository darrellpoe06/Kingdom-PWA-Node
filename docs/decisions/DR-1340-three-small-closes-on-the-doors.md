# DR-1340: Three small closes on the doors — a token compared in constant time, no wildcard origin, and a write from another origin refused

**Date:** 2026-11-05
**Status:** accepted
**Tier:** A (three defensive lines; no behaviour a legitimate caller meets changes)
**Type:** security posture (VERIFICATION-DOCTRINE) · DR-1330 D11
**Area:** `app/functions/api/push-send.js` (`sameToken`); `backend/voice-worker/src/index.js` (`cors`, now exported); `app/functions/_lib/funnel-proxy.js` (the origin check); `app/src/__tests__/three-small-closes.test.js`
**Grounds:** VERIFICATION-DOCTRINE (DR-0076 §3), DR-1330 (the review that named all three)

## Context

The Ways review found three one-line exposures: the push sender compared its machine token with `===` (a caller can measure how much of a guess was right); the voice worker answered `Access-Control-Allow-Origin: *` when its allow list was empty; and no proxied write checked the caller's origin, the session's bearer header being the only lock. Darrell ratified the build.

## What was measured

- `sameToken` folds every byte with XOR after comparing lengths, and never returns inside the loop; an empty expected token never matches.
- `cors` echoes a matched origin, answers an unmatched one with the first allowed origin (a mismatch the browser blocks), and with no allow list sends no origin header at all. Never `*`.
- The proxy refuses a POST, PUT, PATCH or DELETE whose `Origin` differs from the request's own origin with a signed 403 (`code: cross-origin-write`) before anything is forwarded. A same-origin write, an origin-less rider or workflow, and a cross-origin read pass as before.
- Proven in 7 cases; the proxy's existing suites (`every-road-signs-itself`, `media-backup`, `a-200-is-not-an-answer`, `push-send-policy`) stay green, 116 tests.

## Impact

A guessed machine token leaks no timing; an empty allow list opens no browser; a cross-site write hits a second lock at the door. The endpoint register (DR-1337) reads the same code and changes nothing, because the auth classes did not change.

## Decision

The three lines stand, each pinned by the test beside it; the proxy's origin rule is the Way for every Pages road.

## Verification

`three-small-closes.test.js` 7 cases; the four related suites green (116 tests); `error-text-guard` and `endpoint-register --check` OK; lint clean.
