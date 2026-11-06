# DR-1334: A credential in the tree is a red build — two scanners on every push, and the first runs found two real ones

**Date:** 2026-11-05
**Status:** accepted
**Tier:** B (the CI lane gains two gates; one workflow reads a secret it used to carry as a literal; one dispatch input writes once on the NAS)
**Type:** security posture + gate (VERIFICATION-DOCTRINE) · DR-1330 D4
**Area:** `scripts/secret-scan-guard.mjs`; `scripts/secret-scan-allowlist.json`; `app/src/__tests__/secret-scan-guard.test.js`; `.gitleaks.toml`; `.github/workflows/ci.yml` (guards leg); `.github/workflows/nas-health.yml` (`NAS_HEALTH_PROBE_PIN`, `rotate_probe_user`); `docs/SESSION-HANDOFF-2026-05-26.md`, `infra/n8n/INSTALL.md`, `docs/00-foundations/SEED-PROJECTS-2026-05-25.md` (redactions)
**Grounds:** VERIFICATION-DOCTRINE (DR-0076 §3 proven to catch, §7 an independent second method), DR-1159 (the runner over the tailnet is the first road to a NAS value), PERPETUAL-IMPROVEMENT (DR-0075), DR-1330 (the review that measured the absence)

## Context

The Ways review (DR-1330) measured no secret scanner anywhere and one committed credential: the nas-health probe user's production sign-in PIN, a literal in the workflow. Darrell ratified the build.

## What was measured

- **The house guard** (`secret-scan-guard.mjs`): twelve specific shapes (a JWT, an AWS key id, a GitHub token, a Stripe key, an Anthropic or OpenAI key, a Google API key, a Slack token, a Supabase secret key, a private-key block, a Pushover key) plus two house rules gitleaks cannot know: a workflow `"password"` literal aimed at an identity that is not a self-declaring fake, and a literal in a tracked `.env*` or compose file. 6,733 tracked text files in 1.6 s. Proven to catch in 9 unit cases including the nas-health line verbatim; the fakes the other probes use, the `${VAR:-}` compose reads and the app's thousands of `token:` labels pass.
- **gitleaks v8.30.1**, the independent second method, built from source here and installed in CI by `go install` at the pinned version (the Go checksum database verifies it; a release download is not reachable from this sandbox). First run over `app/`: 24 findings; over the root: 13 more. Each was read. **Two were real:** the probe PIN (`nas-health.yml`), and **a Pushover user key in a session-handoff note, an install guide and a seed-projects note** — a credential the house grep had no rule for, which is exactly why the second method runs (DR-0076 §7). Both are out of the tree; the key gained a house rule. The rest: test fixtures, placeholders (`not-a-real`, `YOUR_…`, `PASTE_TOKEN_HERE`, `CHANGE-ME`), a public PayPal donate address, two localStorage key names, wyzeapy's public client constant, and three lines of prose the generic rule misread. `.gitleaks.toml` names every one with its reason; with it, **0 findings**.
- **The probe PIN** now comes from the repo secret `NAS_HEALTH_PROBE_PIN`; absent, the two probe-user steps say so and are skipped, never a literal. A dispatch input `rotate_probe_user` makes the workflow's one write: over the tailnet it deletes the old probe user, so the next outside-in sign-up mints a fresh hash from the secret (DR-1159's first road, not a paste). Both values were in git history already; rotation, not redaction, is what closes them.

## Impact

A credential shape in any tracked text file turns the guards leg red from the push that adds it, by two methods that do not share rules. The two real ones are gone from the tree; the probe account is rotated the first time the workflow is dispatched with the input after the secret is set. The Pushover user key cannot be rotated by us (Pushover issues one per account); it identifies a recipient and sends nothing without the app token, which was never in the tree.

## Decision

Both scanners are required in the guards leg. Setting `NAS_HEALTH_PROBE_PIN` is a GitHub-settings value (Settings → Secrets and variables → Actions) and the one hand step here, with the dispatch that follows it: `rotate_probe_user=true`, once. `re-review: 2026-11-19` — confirm the rotated probe user signs in on a nas-health run, and that both scanners have run red at least once on a planted fault in CI (the unit cases prove the house guard; gitleaks is proven by its own first-run findings).

## Verification

`secret-scan-guard`: OK (6,733 files, 12 rules, 0 allowlisted); its suite 9 cases green; lint clean. gitleaks v8.30.1 with `.gitleaks.toml`: 0 findings, from two builds (source and `go install`). `nas-health.yml` and `ci.yml` parse; `workflow-list-order-guard` OK. `git grep` of the Pushover key: 0 tracked occurrences.
