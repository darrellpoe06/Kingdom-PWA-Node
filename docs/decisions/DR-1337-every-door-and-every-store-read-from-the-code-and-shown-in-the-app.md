# DR-1337: Every door and every store, read from the code and shown in the app — never typed, never stale

**Date:** 2026-11-05
**Status:** accepted
**Tier:** A (a generated file, a guard, one Admin tab; no data path touched)
**Type:** register + gate (VERIFICATION-DOCTRINE, APP-IS-PRIMARY) · DR-1330 D7
**Area:** `scripts/endpoint-register.mjs`; `app/src/lib/endpoint-register.json` (generated); `app/src/components/EndpointRegister.jsx`; `app/src/components/AdminConsole.jsx` (the tab); `app/src/__tests__/endpoint-register.test.js`; `app/src/__tests__/endpoint-register-surface.test.jsx`; `.github/workflows/ci.yml` (guards leg)
**Grounds:** VERIFICATION-DOCTRINE (DR-0076 §4 measure, §3 proven to catch), DR-0061 (a surface is a live view of real state), DR-0065 (the app is the primary artifact), DR-1336 (the sign-ins the page reads), DR-1330 (the review that measured the absence)

## Context

The Ways review (DR-1330) measured that the system's flow is declared and checked (`system-flow-registry.mjs`) and that no page anyone can read lists the endpoints with what each requires, or the data stores with whether a wall stands on them. The slide asked for both. Darrell ratified the build.

## What was measured

- **Read from the code, every build.** `endpoint-register.mjs` derives each Pages Function's route from its path, its methods from its exports, its auth class from what the code checks (a user JWT, a machine token, an HMAC signature, a proxy that hands the caller's own headers upstream, or open) and the secrets it names; each NAS FastAPI service's routes and whether the file gates with a bearer; and every table the schema and migrations create, the file that first creates it, whether row-level security is enabled anywhere, and how many policies name it. SQL comments are stripped first: the first run read `if`, `is` and `no` as tables from prose, and a smoke's scratch table as a store.
- **What it found today:** 27 edge functions (16 proxy pass-throughs, 6 open, 3 user-JWT, 1 machine-token, 1 HMAC), 7 NAS services with 33 routes (4 gated by a bearer, 3 open on the tailnet: avatar-studio, voice-studio, whisper-gpu), 320 tables, **1 without row-level security: `role_capabilities`** (migration 0114), a reference table read by every role by design; it is the first row on the page so the design is seen, not assumed.
- **Never stale.** `--check` in the guards leg fails when the committed JSON differs from what the code generates; the unit test regenerates from the live files and proves a stale copy differs.
- **In the app.** Admin → Endpoints & stores renders the three registers, the unwalled tables first, and the sign-ins of the last 24 hours live through `auth_events_recent` (DR-1336). The surface never goes blank: signed out it says so and what to do; on an error it says what it saw and where the record still lives; copy and behaviour are pinned together (4 cases).

## Impact

A new endpoint, service or table appears on the page from the push that adds it, with its gate stated; a table created without a wall rises to the top of the page the same day. The register answers the slide's "document endpoints and data stores" with a page the build keeps true.

## Decision

The generated register is the document; the guard is what makes it one. The Admin tab is the steward's read. `re-review: 2026-12-05` — three open NAS services on the tailnet are to carry a bearer like the other four, or be recorded as tailnet-only by design.

## Verification

`endpoint-register.mjs --check` OK on the live file; `endpoint-register.test.js` 9 cases and `endpoint-register-surface.test.jsx` 4 cases green; every Admin-console suite green; lint clean on the four files; `module-boundary-guard` and `surface-hollow-guard` OK.
