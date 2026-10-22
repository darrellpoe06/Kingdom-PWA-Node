# DR-1218: No Node past its end of life, and the NAS still trusts the eMudhra roots

**Date:** 2026-10-22
**Status:** accepted
**Tier:** A for the Node pins (CI and an inert NAS service); the NAS trust-store change is recorded as Tier B with its own date
**Type:** security posture + gate (VERIFICATION-DOCTRINE)
**Area:**
- `.github/workflows/*.yml`: 13 workflows moved from Node 20 to Node 22
- `infra/church-runner/docker-compose.yml`: `node:20-alpine` to `node:22-alpine` (the service ships inert)
- `app/src/__tests__/no-node-past-its-end-of-life.test.js` (new)

**Grounds:** Darrell, 2026-10-22, pasted a forum post on PHP's critical release and the eMudhra compromise, marked "Lesson" (the lesson is DR-1217). Before teaching it, we checked our own house.

**Principles:** VERIFICATION-DOCTRINE, REALITY-TRACE, HOLD-THE-HAND

## Context

Eight eMudhra intermediate CA keys were found recoverable. The browsers blocked the certificates through their own revocation lists:
- Firefox and Chrome from 2026-10-17
- Apple from 2026-10-19
- Microsoft from 2026-10-20

Chrome also removed emSign ECC Root CA – G3. Software that keeps its own trust store, and checks no revocation list, still trusts them until that store changes. The fixed stores named are Python certifi 2026.10.19 and Node.js 22.23.4, 24.22.1 and 26.12.1. Node 20 reached its end of life in April 2026 and gets no such fix.

PHP's two critical flaws, released 2026-10-21, do not reach us: no `.php` file and no PHP or WordPress image is in this repo or in any NAS service (Kong is not PHP).

## What was measured

- **Repo:** 13 workflows pinned `node-version` 20; one NAS compose file pinned `node:20-alpine` (church-runner, which ships inert).
- **The NAS** (trust-store-probe over the tailnet, removed in this PR; versions, paths and public root names only):
  - DSM 7.3.2-86009 Update 5.
  - Python 3.8.15, past its end of life in 2024-10.
  - OpenSSL 3.0.9 in Python, and the system `openssl` 1.1.1u, past its end of life in 2023-09.
  - `certifi` 2023.07.22, though no script of ours uses it.
  - No host Node.
  - Python's `urllib`, which every NAS script of ours uses, verifies against the system folders `/etc/ssl/openssl-3/certs` and `/etc/ssl/certs`. Both have 299 entries, and both still hold **all four eMudhra roots**: emSign ECC Root CA – G3, emSign Root CA – G1, emSign ECC Root CA – C3 and emSign Root CA – C1.
  - HTTPS to a public host verifies.

## Impact

- **Unresolved:**
  - CI scripts on Node 20 never receive the corrected trust store.
  - NAS scripts accept a certificate chaining to the recovered intermediates, for any host.
  - Exploiting the NAS gap needs an attacker on its network path, so it is unlikely; the gap is real.
- **The call obligates:**
  - no Node past its end of life, held by a gate
  - the NAS's trust taken out of the hands of an end-of-life system store, for our services, by a set date

## Decision

- **Node 22 everywhere we pin Node.** The new gate fails on any workflow or NAS compose file that pins a Node major below 22. It is proven to catch: it fails on main's own files, naming each one, and passes on this change.
- **The NAS trust store**, recorded with its plan and done in its own reviewed change, because it changes TLS for every NAS service at once:
  - build a curated bundle of the system roots minus the four eMudhra roots
  - point our services at it with `SSL_CERT_FILE`
  - prove one service end to end, then roll it out
  - re-review: 2026-10-24
- **Python 3.8 and OpenSSL 1.1.1 on DSM** are Synology's system packages. Our services move to their own maintained runtime, as the Docker services already do. Re-review with the trust-store change, 2026-10-24.

## Verification

- `no-node-past-its-end-of-life.test.js`: 2/2 on this change. Red on main's files, listing the 13 workflows and the church runner; green after.
- `grep node-version: '20'` across `.github/workflows`: 0.
- The probe output, as quoted above.
