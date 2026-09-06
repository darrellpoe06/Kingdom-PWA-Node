# IP REGISTER — the schedule of what PoeTech owns

**Status:** LIVE working register. Append and amend as assets are created, filed, or assigned.
**Engine:** `app/src/lib/ip-register.js` (pure, node-testable) · **Tests:** `app/src/__tests__/ip-register.test.js` (26, proven-to-catch)
**Source analysis:** `docs/99-session-notes/2026-09-06-poetech-ip-conversion-what-makes-it-a-real-asset.md`
**Scope note:** this is the "Defined" test made real — **the schedule a written IP assignment attaches to.** Until that assignment exists, this document records what *would* be assigned, not what is owned.
**Not legal advice.** Lane assignments record the SHAPE of each protection so the register stays honest; what to pursue is counsel's call.

---

## Why this is an engine and not just a table

A hand-kept table drifts, and every value on it is painted. The two findings from the 2026-09-06 review are exactly the class a painted table hides, so both are encoded as **refusals the register cannot talk past** (`validateAsset`), and each is proven by a test that fails when the rule is removed:

1. **Public disclosure forecloses trade secret, permanently.** A row claiming trade-secret protection over published material is refused. Verified break: flipping `survivesDisclosure` to `true` for the trade-secret lane fails 4 tests.
2. **Authorship is never a default.** `authorship` and `publiclyDisclosed` both start `null` and are refused as `null` — overstating the human share can invalidate the registration it was meant to secure. Verified break: giving `authorship` a silent `'human'` default fails 2 tests.
3. **A plan is not a right.** `planned` is not protection and cannot pass the excludable test. Verified break: counting `planned` as protection fails 2 tests.

## The five tests

An item passing all five is an **asset**; anything short is work product, however good. The register reports the **first failing test** as the bottleneck, because that is the only one worth working on next.

**Owned** → **Defined** → **Excludable** → **Transferable** → **Monetised**

Each later test is meaningless without the earlier ones — you cannot transfer what you do not own.

---

## Register — as of 2026-09-06

Legend — **Auth:** human / mixed (human-directed, AI-expressed) / generated · **Pub:** publicly disclosed · **Prot:** none / planned / filed / registered · **Tests:** passed of 5 · **→** bottleneck.

### Marks (lane: trademark — unaffected by authorship *and* by disclosure)

| Asset | Uses | Owner | Auth | Pub | Prot | Tests | → |
|---|---|---|---|---|---|---|---|
| **PoeTech** (house mark) | 203 | — | human | yes | none | 1/5 | owned |
| **SKOS** (platform mark) | 196 | — | human | yes | none | 1/5 | owned |
| **Ari** (AI persona) | 75 | — | human | yes | none | 1/5 | owned |
| **Council Chamber** | 58 | — | human | yes | none | 1/5 | owned |
| **Quality Gatekeeper** | 40 | — | human | yes | none | 1/5 | owned |
| **Behavioral Mirror** | 19 | — | human | yes | none | 1/5 | owned |
| **Love Corner** | 13 | — | human | yes | none | 1/5 | owned |
| **OpsBoard** | 5 | — | human | yes | none | 1/5 | owned |

*Usage counts measured across `docs/00-foundations/_root/*.md` on 2026-09-06 — evidence of consistent use, which is what trademark rights arise from.*

**Clearance flags.** **`SKOS` collides with the W3C Simple Knowledge Organization System** — screen before spending; a rename now costs far less than a rebrand after launch. **`Ari`** is short and in a crowded class. **`The Root`** is descriptive-leaning and weaker.

**Excluded on purpose — "The Way."** Not a candidate and never will be. It is scriptural language (Acts), not a coined mark. Claiming private title over the Word's own language is inconsistent with `CLAUDE.md`'s posture on the Word. *(Proposed as P8; recorded here so no future pass "helpfully" adds it.)*

### Works (lane: copyright — turns on human authorship)

| Asset | Auth | Pub | Prot | Tests | → | Note |
|---|---|---|---|---|---|---|
| **Doctrinal corpus** — the `CLAUDE.md` binding rules, Typographic Theology, Color Theology | human | yes | none | 1/5 | owned | Darrell's declarations. Strongest copyright position in the portfolio. |
| **The Holy Spirit Integration Worldview** (`_root/`) | human | yes | none | 1/5 | owned | The source-of-answers spine. |
| **Decision-record ledger** — 298 records, selection and arrangement | human | yes | none | 1/5 | owned | Dated, attributed provenance most companies cannot produce. |
| **Captured spoken teachings** (2026-07-03 rule) | human | yes | none | 1/5 | owned | Darrell's words, distilled from his framing. |
| **Study Edition clarification layer** | mixed | yes | none | 1/5 | owned | The ownable part. Base texts are PD — see below. |
| **Living Lessons corpus** | mixed | yes | none | 1/5 | owned | Register with generated portions disclosed. |
| **Foundation document set** (`_root/`, ~60 docs) | mixed | yes | none | 1/5 | owned | Human-directed, AI-expressed. Registrable **with disclosure**. |
| **Application source** (2,114 files) | mixed | yes | none | 1/5 | owned | Sort before filing; bulk generated expression is weakest. |

**Not ours, and already handled correctly.** The base biblical texts are public domain (WEB, KJV) and the word-study datasets PD or CC-BY, with SBLGNT correctly avoided — see `docs/99-session-notes/2026-06-25-poetech-study-edition-base-text-license-research-review.md`. That review is the model for how the rest of this sorting should be done. **The clarification layer is the ownable part; the Word is not ours to own.**

### Methods (lane: trade secret — FORFEITED for everything already published)

| Asset | Pub | Trade secret available? |
|---|---|---|
| Deterministic gate suite | yes | **No — disclosed** |
| Ari orchestration / escalation ladder | yes | **No — disclosed** |
| Composable Spine contracts (DR-0039) | yes | **No — disclosed** |
| Workforce Layer QA-gate design (DR-0017/0020) | yes | **No — disclosed** |
| Industry/Role module template (DR-0030) | yes | **No — disclosed** |
| Council Chamber mechanism | yes | **No — disclosed** |
| Prompt libraries | yes | **No — disclosed** |
| Operational runbooks | yes | **No — disclosed** |
| Tenant-portal implementation | yes | **No — disclosed** |

**Cause:** the repository is public. GitHub API, 2026-09-06: `"private": false`, `"visibility": "public"`. Trade secret requires reasonable measures to maintain secrecy; a public repo is the opposite. **Nothing already published can be pulled back into secrecy.**

**Still protectable, because verified unpublished** — what a posture change would actually preserve. Each carries the check that establishes it, because this is the sentence the posture decision rests on:

| Item | Basis |
|---|---|
| Environment values and credentials | `.gitignore` excludes `.env` and `.env.*`; only `.env.example` templates are tracked. |
| Tuned model weights and NAS-side runtime artifacts | `infra/nas-llm/` tracks server code only — no `.gguf` or `.safetensors` in git. |
| Customer and tenant data | Supabase rows behind RLS; never in the repository. |
| Any future module built private from the outset | Not yet written — the one category a posture change fully preserves. |

**Correction, 2026-09-06.** This list first shipped naming *prompt libraries* and *operational runbooks* as still protectable. Both were wrong: `git ls-files` puts the prompts in `app/src/lib/ari.js`, `class-tutor.js` and `infra/nas-sme-pipeline/*-prompt.md`, and the runbooks in `docs/ops/` — all tracked, all public. They are now register rows on the disclosed side, above. An unverified "still protectable" is worse than no list at all, because it is exactly the sentence a posture decision leans on.

### Patents

**None, and none recommended.** A natural person must be named as inventor; software and business-method claims face a hard subject-matter bar; and public disclosure has likely already forfeited most non-US rights. Revisit only if counsel identifies a specific novel mechanism.

---

## Portfolio position — 2026-09-06

**0 of 5 tests fully met, across every row.** Every asset above bottlenecks on the same test: **Owned.**

That is a single point of failure, and it is also the good news — **one document unblocks the entire register.** The written IP assignment from Darrell personally into the entity, with this schedule attached, converts the whole portfolio's first test at once. Nothing else on this page can advance past it.

## The two items that get more expensive every day

1. **The repo posture decision.** Every day public is another day of methods published for free while nothing is claimed. *(Proposed P1: split — mission and doctrine public, module engine and gate suite private.)*
2. **The IP assignment clause in the 1099 contractor agreement.** A contractor owns their work by default absent a written assignment. This must land **before the first Workforce Layer worker onboards** (DR-0017/0021). Nearly free now; expensive to retrofit across a workforce.

## Standing rule for this register

Per DR-0075 (perpetual improvement), every new named surface, module, method, or mark is added here **when it is created**, not in a later sweep — with its authorship and disclosure decided at the same time. A row nobody decided is the one thing this register refuses to hold.

**`re-review:` 2026-12-06** — or immediately upon entity formation, whichever comes first.
