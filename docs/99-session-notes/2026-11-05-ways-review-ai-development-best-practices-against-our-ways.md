# 2026-11-05 — Ways review: the IT Professionals Forum "AI Development Best Practices" slides, measured against our Ways

**Type:** orchestration · Ways review (DR-0108) · research-review (Layer 4). Recorded as REV-0260; the proposed decisions are DR-1330 (status `proposed`, for Darrell to ratify, amend or strike).
**Prompted by:** Darrell, 2026-11-05, six slides from the IT Professionals Forum (Fall 2026, University of Illinois): *"We need to evaluate our Ways and documentation and procedures for these types of processes... also just do a report so I and then we can make decisions... for building our new necessary workflows and evaluation methods."* Then, mid-review: *"various user flows debugging tests so users don't have basic bugs... automated"*; *"Navigating between all playwright automated test site.... to test our sites or pages"*; *"Are we protected from outside issues?!!!!!!"*; *"I also don't like bloated code!!!!!!!!! DRs.... review..."*
**Builds on (read, not redone):** `docs/99-session-notes/2026-06-17-security-posture-review.md` (the last security pass; its header gate still holds), DR-0072 (the freshness-review loop: external best practice diffed against our practice, which this review does by hand), DR-0934 (the one end-to-end journey in CI), DR-1218 (end-of-life register), DR-1262 (the dependency backlog), DR-0819 (the eight questions of Proving Our Ways).
**Method:** SHOULD / ARE / GAPS / CLOSE (DR-0219) per slide bullet. Every ARE is a read of the file named; every number is a measurement run this session on this checkout (main at 8ebafe5). Nothing is recalled.
**Re-review:** 2026-11-19, or the day Darrell ratifies DR-1330, whichever comes first.

---

## 0. The answer in one paragraph

The slides describe a solo-developer practice at the scale of 3,299 lines and three weeks. Ours is 400,673 lines of app source, 1,224 decision records and 95 workflows. On most of the slides' bullets we are ahead of what they recommend: the deterministic gate suite, proven-to-catch, the decision ledger as change log, the outside-in site witness, the sovereign-first model routing with a spend cap. We are behind on five things the slides name and we never built: **a general user-flow test that walks the whole app in a real browser** (one journey exists, for property doors), **a dependency vulnerability audit and a secret-scanning gate** (neither runs anywhere), **error text that reaches users** (raw exception messages in about 26 places), **logging of sign-in failures** (the table allows it; nothing writes it), and **a per-task AI cost and time ledger** (we track dollars per day on a runner, never per task). And on bloat, which Darrell added to the scope, the measurement is against us: 894 of 1,224 decision records break the ledger's own 45-line rule, the index holds one row of 63,818 characters, seven source files exceed 3,000 lines, and 95 workflows carry 21,896 lines of YAML (the Pages Functions, by contrast, are clean: 37 files, every one tested). Section 1 answers "are we protected from outside issues" in three tiers. Section 6 lists the twelve decisions, each with a recommended default.

## 1. Are we protected from outside issues? — three tiers (DR-0100)

**Tier 1 — established, measured, stated plainly.**

| Protection | State | Evidence |
|---|---|---|
| Browser-side hardening (CSP, frame-ancestors none, HSTS, nosniff, referrer, permissions) | **In place and gated.** Same CSP on Cloudflare and Vercel; a test fails the build if it weakens | `app/public/_headers:22-29`; `app/vercel.json:23-28`; `app/src/__tests__/security-headers-guard.test.js` |
| SQL injection | **Not reachable.** All access via supabase-js / PostgREST | 2026-06-17 review §1, re-grepped this session |
| Cross-site request forgery | **Low exposure by construction.** Session in localStorage, bearer header; a cross-site form cannot add it. Stripe webhook HMAC with timing-safe compare | `app/src/lib/supabase.js:60-70`; `app/functions/api/stripe-webhook.js:51-70` |
| Row isolation | **Proven daily on the live database**, rolled back; a failing leg files on the incident issue | `.github/workflows/rls-isolation.yml:1-40` |
| Secrets in git | **Clean by convention.** Only `.env.example` placeholders committed; compose reads `.env`; no key-shaped literals | `.gitignore:41-82`; scan this session |
| Runtime end of life | **Known and gated for Node.** Node 22 everywhere; a test refuses an end-of-life Node | DR-1218; `app/src/__tests__/no-node-past-its-end-of-life.test.js` |
| The site itself | **Witnessed from outside** every ~10 minutes with a downtime ledger | DR-0125; `site-health.yml` |

**Tier 1 — established, measured, and exposed. These are real gaps, not maybes.**

| Exposure | Fact | Evidence |
|---|---|---|
| No vulnerability audit | `npm audit`, `pip-audit`, osv-scanner: **zero** occurrences in 95 workflows and 255 scripts. Dependabot opens weekly npm and Actions PRs; it covers no pip and no Docker image | `.github/dependabot.yml`; grep this session |
| No secret-scanning gate | gitleaks / trufflehog / detect-secrets: **not found** | grep this session |
| One committed credential | A probe account's password is a literal in a workflow that signs into **production** auth | `.github/workflows/nas-health.yml:99,108` |
| Raw exception text to users | 3 Pages Functions / worker and 23 NAS services return `e.message` / `str(e)` as `detail`; the app's error card shows `error.message` under "Technical detail" | `app/functions/api/voice-speak.js:75`; `app/functions/_lib/funnel-proxy.js:101`; `backend/voice-worker/src/index.js:62`; `app/src/components/ErrorBoundary.jsx:58-62` |
| Sign-in failures never logged | `audit_log` allows `failed-auth` and `login`; **no code writes either**. Only role changes and support-door grants are audited | `infra/supabase/schema-v2.1-infra.sql:495-497`; `migrations-auto/0111,0114,0115` |
| Machine-token compare | Plain `===` on the push-send machine token (not constant-time) | `app/functions/api/push-send.js:84` |
| CORS fallback | The voice worker falls back to `*` when its allowlist is empty | `backend/voice-worker/src/index.js:264-266` |
| CSP width | `connect-src https:` permits any HTTPS host; `style-src 'unsafe-inline'` | `app/public/_headers:23` |
| NAS runtime past end of life | DSM's Python 3.8.15 (EOL 2024-10) and openssl 1.1.1u (EOL 2023-09), recorded, not yet moved | DR-1218 "What was measured" |
| Python dependencies unpinned in CI | `pip install` lines in workflows carry no versions; no `requirements.txt` in the repo | grep this session |

**Tier 2 — genuinely open, named narrowly.** Whether any dependency in `app/package-lock.json` currently carries a known vulnerability is **unknown**, because nothing has ever measured it; the first `npm audit` run answers it. Whether the 23 NAS `str(e)` returns ever carry a path or a secret is unknown until each is read; the pattern is the risk, not a proven leak.

**Tier 3 — the over-claim to correct.** "No stack traces reach users" is true and the slides' pitfall is avoided in its literal form (`err.stack` / `traceback`: zero hits). But the *reason* the pitfall exists, exception internals shown to a stranger, is not avoided. Stating only the literal truth would be the under-claim DR-0100 forbids.

**Verdict.** From the browser inward we are well protected and the protection is gated. From the supply chain inward we are **unmeasured**, which is not the same as safe, and the slides' first pitfall, outdated dependencies with vulnerabilities, is exactly the unmeasured one.

## 2. Slide by slide — SHOULD / ARE / GAPS

### 2.1 Prompting

| Slide bullet | ARE (ours) | Gap |
|---|---|---|
| Break tasks into smaller components | One decision per file (README rule 1); the builder brief is one OUTCOME with DONE-WHEN evidence (`docs/templates/builder-brief.md:8-17`) | None in principle. In practice the records grew (§4) |
| Specify technical requirements | Reality-trace before building (DR-0061); SHOULD with `file:line` before "done" (DR-0219) | None |
| Add files, symbols, stack traces, logs to context | The required-reading hook hands governing docs at write time (`scripts/required-reading-pretool-hook.mjs`); context-hygiene hook keeps raw transcripts out (DR-0244) | None |
| Start new sessions for new tasks | **Deliberately the opposite**: the same session continues and pulls the next item (CLAUDE.md DR-0103 §4, DR-0236). Branch and worktree per session (DR-0011) | A recorded difference, not a gap. Our brake on context rot is Layer 0's byte budget (`scripts/claude-md-budget.json`, 57,891 B, at its ceiling today) and compaction |
| Keep sensitive data out of model context | TLC firewall fails closed; `private: true` specs route local-only (`app/src/lib/llm-router.js:74-79`; `scripts/lib/handoff.mjs:140-141`) | **No redaction layer exists.** MODE-ROUTING.md:193 names an "existing redaction layer"; no code implements one. INPUT-VISIBILITY-TO-CLAUDE.md forwards family messages verbatim |
| Validate outputs: code AND functionality through tests | 1,802 vitest files; 16 CI legs; proven-to-catch (DR-0076 §3); the Stop hook blocks a "done" with no evidence | **Functionality through the user's path** is the gap: §3 |
| Markdown | 1,821 Markdown files; no markdown lint | None worth a gate |
| Follow toolchain best practices | `.claude/settings.json` hooks; `skills-lock.json` pins two skills by hash | None |

### 2.2 Software development

| Slide bullet | ARE | Gap |
|---|---|---|
| Modular code structure | Surface registry (`app/src/surfaces.js`), module-boundary guard, monolith budget guard (shrink-only) | Seven files over 3,000 lines (§4). The monolith guard covers one file |
| Consistent style and patterns | ESLint, zero warnings, in CI (`app/eslint.config.js`; `ci.yml:89`) | **No Prettier. No Python linter** (ruff/flake8/black: none) across 18 `test_*.py` and 36 self-tested services |
| Descriptive names, comments | WHY-headers citing DRs are the house style | No naming guide; not a gap worth a rule |
| Automated testing | As above; plus 11 PostgreSQL "walls" legs and the door journeys | No coverage threshold (not recommended either; the gates are per-class, which is stronger) |
| Logging | App: device-local error journal (`app/src/lib/error-journal.js`), 221 raw `console.warn` sites; NAS: ad-hoc `def log()` per script, no `logging` module, no aggregation | **No security-event log** (§1). No structured log on the NAS |
| Git | Plain subjects with `(DR-NNNN) (#PR)`; `npm run ship` runs guards before push; dr-number-claim at PR time | None |
| Dependency management | Dependabot npm + Actions; lockfile; DR-1262 sorts bumps from migrations | **No CVE audit; no pip or Docker coverage** (§1) |
| Read docs and GitHub issues | DR-1262 read every breaking-change note before bumping; health probes file on the `incident` issue | None recorded as a practice; it happens |
| Debugging the stack | Runbooks live as dated session notes; `docs/03-network-playbook/README.md` is a stub | A findable runbook index is missing; small |

### 2.3 Common AI pitfalls

| Pitfall | ARE | Verdict |
|---|---|---|
| Outdated dependencies with vulnerabilities | React 18, Vite 5, Vitest 2, Tailwind 3 (each one major behind, deferred knowingly in DR-1262); **no audit** | **Open** |
| Plausible but functionally incorrect code | The whole of DR-0076; proven-to-catch; the door journeys found a real dead-board bug on their first run (DR-0934) | Closed by design; open at the user-path layer (§3) |
| Hardcoded default credentials | Clean except `nas-health.yml:99,108` | One to move into a secret |
| Deprecated or hallucinated APIs | decision-citation-guard (a cited DR must exist); `--selftest` on 36 services; PostgREST pinned with checksum | Closed for our own APIs; vendor APIs are caught by the build and the self-tests |
| Stack traces to end users | No stacks; raw messages yes (§1) | **Partly open** |
| Missing CSRF and CSP | CSP gated; CSRF low by bearer design; no Origin check on unauthenticated writes | CSP closed; CSRF acceptable, one small close |

### 2.4 Model selection and usage tracking

| Slide bullet | ARE | Gap |
|---|---|---|
| Rightsize the model per task | Three-tier routing: Ollama 3B router / 14B daily, Claude for code and architecture, Gemini for fresh knowledge (`CLAUDE-TOOL-ROUTING.md:33-70`); the in-app router picks cheapest-capable, sovereign first (`llm-router.js:69-93`) | Six hardcoded local model ids in app code; the router ships inert. The slide's "auto model selection" is what the router is, unarmed |
| Track credits per model and per task | `vendors.mjs:27-45` prices tokens; `wake-router.mjs` and `cap-resume.mjs` write a per-day spend file; $25 soft / $50 hard monthly cap (`CLAUDE-TOOL-ROUTING.md:76`) | **No per-task, per-PR ledger.** "There is no live cost dashboard yet" (`CLAUDE-TOOL-ROUTING.md:181`) |
| The project-results table (task · credits · cost · weeks without AI · time with AI) | `app/src/lib/delay-ledger.json` has 2 entries, minutes only, built for exactly this reason ("data-driven reasons to use this model AI or that one") | **Never populated.** The Claude Code session that does most of the work records nothing at all |

### 2.5 Cybersecurity considerations

| Slide bullet | ARE | Gap |
|---|---|---|
| Strong SDLC | Branch → push → 16 legs → required check → squash auto-merge → deploy → outside-in witness; `hold` is the brake (RELEASE-LANE.md; DR-0103; DR-0107) | None; stronger than the slide |
| Code review | Deterministic gates + AI self-verification + the Stop hook. **No human or peer review per PR**, no CODEOWNERS; `ari-comprehensive-review.yml` ships inactive | A recorded choice (ORCHESTRATION-AND-VERIFICATION-OPERATING-MODEL.md:118 "no human click"). The slide's point stands for **security-sensitive paths**: nothing marks them for a second look |
| Manage secrets with compliant solutions | GitHub secrets, `.env` on the NAS, runner-over-tailnet for NAS values (DR-1159) | No rotation record except `nas-rotate-bearer.yml`; no scanning gate |
| Keep a change log | The decision ledger (1,224 records, INDEX as truth) plus `(DR-NNNN)` in every squash subject | Fulfilled, at a cost: §4 |
| Document endpoints and data stores | `scripts/system-flow-registry.mjs` (about 245 entries, checked in CI by `system-flow-proof.yml`) | **No human-readable register of endpoints with their auth requirement**, and no data-store register |
| Log critical security events | §1 | **Open** |
| Anticipate end-of-life dates | DR-1218 for Node and the NAS | A register with dates for Python 3.11/3.12, Postgres 15.8, PostgREST 12.2.12, Vite 5, React 18, DSM 7.3.2 does not exist; the Node test is the only gate |

## 3. User flows and a navigation sweep — the gap Darrell named mid-review

**SHOULD.** "What a person does in the app is proven the way they do it: on the built app, in a browser, against a real database" (DR-0934 Context). The slides' largest line item (708.5 of 2,100.9 credits) was automated end-user acceptance tests.

**ARE, measured.**

| Instrument | Scope | Where |
|---|---|---|
| door-journeys | 8 steps, one module (property doors), real Chromium + PostgREST + PostgreSQL, proven-to-catch per fault, **required in CI** | `scripts/e2e/door-journeys.mjs` (957 lines); `ci.yml:1538-1603` |
| Browser probes in CI | SW navigation, chrome layout at 3 widths, read-highlight, mic-record, scripture inference, each with a selftest-break | `ci.yml:654-705, 710-741` |
| Live witnesses (dispatch or schedule) | Link landing, install, level switch, public shelf, money, nearby, bus, and others: **about 20** single-question probes against poetech.us | `scripts/*-probe.mjs`, `*-witness.mjs`; their workflows |
| A Playwright test runner | **None.** No `playwright.config.*`, no `@playwright/test`; `playwright-core@1` is installed ad hoc per job | `ci.yml:655,729,1587` |
| A sweep across the app's surfaces | **None.** The registry declares about 70 lazy surfaces across top / church / books / create (`app/src/surfaces.js`); nothing opens each one in a browser and asks whether it rendered without an error boundary, a console error, or a hollow state | — |

**GAPS.** (1) No general navigation sweep: a surface can ship that throws on mount and nothing but a person finds it; the 2026-08-13 shared-link miss (live-link-probe header: 7,678 tests mounted Learn directly, none walked the shell's routing) is this class. (2) No journey outside property doors: sign-in, open a lesson, follow a shared link, send a message, leave feedback, the church and books tabs have unit tests and a few live probes, no end-to-end walk. (3) Each probe is a bespoke script; there is no shared harness, so each new question costs a new 300-line file.

**CLOSE (proposed, D1 and D2 in §6).** Build the sweep *from the registry* so every new surface is covered at birth (HOLD-THE-HAND: new workflows join at birth), on the door-journeys stack (already real, already in CI), proven-to-catch with a planted throwing surface. Then a journey registry: one journey per module, and a coverage guard shaped like `lessons-gate-coverage.mjs` that fails when a module has none.

## 4. Bloat — code and decision records, measured

| Measure | Value | The rule it is measured against |
|---|---|---|
| Decision records on disk | 1,224 | — |
| Median / p90 / max length (lines) | 62 / 131 / 1,547 | README rule 1: "~25–45 lines" |
| Records over 45 lines | **894 (73%)** | same |
| Mean length of the newest 30 | 104 lines | same |
| Largest record | 193,434 bytes (DR-0418) | same |
| `docs/decisions/INDEX.md` | 2,256,882 bytes; longest row **63,818 characters** | README rule 5: the index is what you read to verify |
| `docs/` total | 25 MB, 1,821 Markdown files | — |
| App source (non-test) | 400,673 lines | — |
| App tests | 350,817 lines in 1,802 files | — |
| Source files over 3,000 lines | 7; the largest 29,435 (`lib/living-lessons-class.js`), 9,048, 6,729, 5,884, 5,186 (the monolith, shrink-only gated) | `monolith-budget-guard` covers only the monolith |
| Scripts | 255 (55 guards, 18 probes and witnesses, 7 hooks, 169 other) | — |
| Workflows | **95 files, 21,896 lines of YAML**; 40 dispatch-only, 39 scheduled; 35 named health / witness / probe; the largest probe (`site-health.yml`) is 1,184 lines | `workflow-list-order-guard` checks order, nothing checks size or liveness |
| Pages Functions | 37 files, 1,761 lines; **every one referenced by a test** | clean |
| Layer 0 | 57,891 bytes, at its ceiling | `claude-md-budget.json`, ratchet |

**Reading.** Darrell's "clean functions and workflows": the functions are clean. The workflows are not: 35 probes each carry their own harness, headers and brakes as prose, averaging 230 lines, and nothing records which dispatch-only ones have ever run. The ledger does what a change log should, and it is also where the bloat is: the records carry the narrative that the README said belongs in session notes (rule 6: "narratives point at DRs"). An index row that runs 63,818 characters cannot be "read to verify" by anyone. On code, the three class files are authored lesson content compiled into the bundle; whether content belongs in JavaScript is a decision (D9), and the asset-size guard already watches its weight. The monolith ratchet works (5,186 and falling); it is simply alone.

## 5. The five Ways questions (DR-0108)

1. **Team capability unused?** Yes: `playwright-core` is on every CI runner and the door-journeys stack already stands up a real database; a sweep over the registry is composition, not invention.
2. **Unverified "can't"?** "The sandbox cannot reach poetech.us" is verified and routed (the runner is the eye, DR-0125). Nothing in this review rests on a can't.
3. **Repeated friction?** Each browser question has cost a new bespoke script (about 20). A shared harness ends that.
4. **Scoped to the agent's limits?** The cost ledger is the one: the agent's own sessions are the largest AI spend and the only unmeasured one.
5. **A more streamlined way?** For decision records, yes: a length ratchet and a one-paragraph index row make the ledger readable again without rewriting the past (append-only holds).

## 6. Decisions for Darrell — each with a recommended default (DR-0111)

Recorded as DR-1330, status `proposed`. Build order is the recommendation; the Governor may strike or reorder. Thirteen decisions; every one but D9(c) is a build with no bright line in it.

| # | Decision | Default | Why first |
|---|---|---|---|
| D1 | A registry-driven **navigation sweep**: every surface in `surfaces.js` opened in Chromium on the door-journeys stack at phone and laptop widths; fails on an error boundary, a console error, or a hollow render; proven-to-catch with a planted throwing surface; a required CI leg | Build | His ask; the slides' largest cost line; catches "basic bugs" before a user does |
| D2 | A **journey registry** and coverage guard: one end-to-end journey per module (sign-in, lesson open, shared link, message, feedback, church, books, doors), a guard that fails a module with none | Build after D1 | Turns the one journey into a Way |
| D3 | **Vulnerability audit gate**: `npm audit --audit-level=high` in the guards leg; `pip-audit` over a generated requirements file per Dockerfile; Dependabot gains `pip` and `docker` | Build | The one slide pitfall we have never measured |
| D4 | **Secret-scanning gate** (gitleaks, pinned) in CI, and `nas-health.yml`'s probe password moved to a repository secret | Build | A committed production credential, however small |
| D5 | **Error-text policy and guard**: no `e.message` / `str(e)` in a client response; a correlation id instead, the text to the error journal; `ErrorBoundary` technical detail shown only in reviewer mode (DR-0104) | Build | 26 sites; the slide's pitfall in substance |
| D6 | **Security-event logging**: write `login` and `failed-auth` to `audit_log` (the CHECK already allows it) from an auth hook; alert on a burst by ntfy | Build | The table was designed for it and never fed |
| D7 | **Endpoint and data-store register**, generated at build from `system-flow-registry.mjs` with each Pages Function's auth requirement, served in-app under Admin | Build | The slide asks for it; we have the data and no page |
| D8 | **AI usage ledger per task**: every PR carries model, tokens, cost (via `vendors.mjs`), wall-clock and an estimate-without-AI; rolls up in-app beside Proving Our Ways. The Claude Code session records its own | Build | The slides' results table; we built the file for it and never fed it |
| D9 | **Bloat ratchets**: (a) new decision records capped at 60 lines and an index row at 600 characters, enforced by `decision-record-guard`; existing records untouched (append-only); (b) a per-file line budget for `app/src` that only goes down, the seven files named as the baseline; (c) lesson content moved out of JavaScript into data the build loads | (a) and (b) build; (c) Governor's call (bright line: content architecture) | His word; the ledger's own rule is broken 894 times |
| D10 | **Prettier and ruff** in CI, formatting only, no style debates | Build | Cheap; the slide's "consistent style" |
| D11 | **Small closes**: constant-time compare on the push-send token; remove the `*` CORS fallback; Origin check on unauthenticated write functions | Build | Each is a line |
| D12 | **End-of-life register** with dates for every pinned runtime, the Node test generalised to read it | Build | Extends DR-1218 |
| D13 | **Clean workflows**: one reusable `workflow_call` harness for browser probes (checkout, Node, playwright-core, brakes, artifact upload) so a probe is its script plus ten lines; a generated workflow register (purpose, trigger, last run) checked in CI; dispatch-only workflows with no run in 90 days retired by record | Build | His word; 21,896 lines of YAML is the second ledger nobody can read |

**Not recommended.** A coverage percentage threshold (the per-class gates are stronger); a human approval on every PR (recorded choice, DR-0103); new sessions per task (recorded choice, DR-0236). Each stays as is, and each is named here so the non-change is a decision, not a drift (DR-0075).

## 7. What was not verified

- No `npm audit` was run this session; the sandbox's registry access was not needed for the review and the first run belongs to D3 where its result becomes a gate.
- The 23 NAS `str(e)` sites were counted by grep, not each read.
- Whether the in-flight proxy strip (`server-error-text.js`) reaches every Pages Function path was not traced.
- Counts of "about 70 surfaces" and "about 20 probes" are grep counts of declarations, not a walk.
