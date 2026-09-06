# PoeTech -> Intellectual Property: what has to happen for it to be a REAL ASSET

**Date:** 2026-09-06 - **Branch:** `claude/poetech-ip-conversion-ppi6lh`
**Author:** Claude, on Darrell's question ("how do I turn PoeTech into intellectual properties?" / "What needs to happen for me to have what is considered a real asset?")
**Status:** RESEARCH-REVIEW / decision-support. **No filings, no money moved, no legal instrument executed, no repo settings changed.** Inventory + gap analysis + ordered plan.
**Not legal, tax, or accounting advice.** Every item names the professional who owns it (the same convention as `2026-06-09-poetech-market-strategy-workforce-three-ring.md` §3).
**Reads through:** `CLAUDE.md` Layer 0, `_root/LEGAL-PRIVACY-BOUNDARY.md` (the Business/IP tracking scope), `_root/MARKETPLACE-ARCHITECTURE.md`, `_root/BODY-OF-CHRIST-ECONOMIC-STEWARDSHIP.md`, DR-0017/0018 (workforce + three-ring market), DR-0030 (the reusable module template), DR-0191 (honour/credit as conduct).
**Verification posture (DR-0076):** repo facts below are measured from this working tree and the GitHub API on 2026-09-06 and cite where. Legal-doctrine statements are flagged as such and are **for counsel to confirm** - they are training-data knowledge, not a verified reading of current law.

---

## 0. The one-line answer

**You do not have an asset yet. You have a large, valuable, undefended body of work.**
Four things convert it: **an owner** (an entity that legally holds it), **a boundary** (defined, fixed, provenanced units - not "the repo"), **excludability** (the ability to stop someone else from using it), and **a revenue instrument** (a signed licence or sale). Right now PoeTech has **none of the four**, and one repo setting is actively burning the most valuable category.

---

## 1. What "a real asset" actually means

An asset is not "something good that I made." It is something that satisfies **all five** tests. Anything failing a test is work product, not property.

| # | Test | Plain meaning | Who cares |
|---|---|---|---|
| 1 | **Owned** | A named legal person or entity holds title, in writing. | Buyer, investor, court |
| 2 | **Defined** | It has a boundary and a fixation date. "PoeTech" is not an asset; "the Quality Gatekeeper acceptance-criteria engine, v1.0, fixed 2026-09-06" is. | Registrar, buyer |
| 3 | **Excludable** | You can lawfully stop a third party from using it. No exclusion = no scarcity = no value. | Everyone |
| 4 | **Transferable** | It can be assigned or licensed by a written instrument, separate from you personally. | Buyer, lender |
| 5 | **Monetised (or credibly monetisable)** | A signed licence, a sale, or a revenue stream attributable to it. | CPA, valuer, bank |

**The accounting reality, stated plainly (DR-0100).** Under US GAAP, **internally-generated intangibles are generally expensed as incurred, not capitalised** - so self-built IP typically does **not** appear on your balance sheet no matter how good it is (ASC 350; software has narrow capitalisation windows under ASC 350-40 / 985-20). It becomes a **booked** asset mainly when it is **acquired, sold, or licensed**. Practical consequence: **the licence agreement is the asset event, more than the filing is.** *Owner: a CPA. Confirm before relying on this.*

---

## 2. Where PoeTech stands today - measured, not assumed

### 2.1 The two findings that dominate everything else

**FINDING 1 - The repository is PUBLIC.**
`darrellpoe06/Kingdom-PWA-Node`, GitHub API 2026-09-06: `"private": false`, `"visibility": "public"`, `forks_count: 0`, `stargazers_count: 1`.

Consequence: **trade-secret protection is unavailable for everything already published there.** Trade secret is the one form of IP that protects *methods, architectures, and know-how* - and under the Defend Trade Secrets Act it requires the owner to have taken **reasonable measures to keep the information secret**. A public repository is the opposite of a reasonable measure. Published in that repo today: the Ari orchestration model, the deterministic gate suite, the Composable Spine contracts, the Workforce Layer QA-gate design, the Council Chamber, the module template that DR-0030 calls the productisation engine, and every foundation doc and decision record. *This is the single largest value leak in the portfolio, and it is silent.*

**FINDING 2 - There is no LICENSE file anywhere in the repo.**
Verified: `find . -iname "LICENSE*"` returns only vendored third-party licences under `infra/nas-agent/.vendor/`. No root `LICENSE`, `NOTICE`, `COPYRIGHT`, or `CONTRIBUTING`.

Consequence, and it cuts **both** ways:
- **Good:** no licence granted means default copyright applies - GitHub's terms give viewers the right to view and fork *within GitHub*, but not a general right to copy or commercialise. You have not given the work away.
- **Bad:** there is **no notice of claim**, no ownership statement, no contributor terms. Anyone building on it has a plausible "I thought it was open" story, and you have nothing that puts the world on notice of what you claim.

### 2.2 The five tests, scored against reality today

| Test | Status | Evidence |
|---|---|---|
| **1. Owned** | **FAIL** | No entity formation document, operating agreement, or IP assignment exists in this repo. `_root/LEGAL-PRIVACY-BOUNDARY.md` lists "LLC formation, registered agent" and "IP - trademark filings, copyright, trade secrets" as things the Legal module will **track** - it does not record that any of them **exist**. Copyright vests in the human author personally; an LLC does **not** automatically own founder-created work. Without a signed assignment there is nothing to sell. |
| **2. Defined** | **PARTIAL** | Strong on provenance, weak on boundary. 298 decision records with dates and declarers, ~797 docs, 2,114 app files - excellent evidence of *when* and *by whom*. But nothing is packaged as a discrete, versioned, named deliverable. |
| **3. Excludable** | **FAIL** | Public repo (kills trade secret) + no licence notice + no registrations + no trademark filings = nothing to enforce with. |
| **4. Transferable** | **FAIL** | Nothing separable from Darrell personally. No assignment, no schedule of assets, no entity to hold it. |
| **5. Monetised** | **FAIL** | No signed licence, no paying tenant. DR-0018's Ring 3 (paid business tier) and DR-0022 (the law-firm tenant) are **decided**, not **executed**. |

**Score: 0 of 5 fully met.** That is not a criticism of the work; it is a statement about the wrapper the work is sitting in. The build is years ahead of the paperwork.

---

## 3. The four IP lanes, ranked for THIS portfolio

Not all four fit. Ranked by real value here, highest first.

### Lane A - TRADEMARK (highest value, cheapest, most urgent)

Trademarks protect **names and marks used in commerce**. They are unaffected by who or what authored the underlying code, which matters enormously here (see Lane B). They are the identity layer of a platform that intends to sell to churches, businesses, and a workforce.

Candidate marks, with in-repo usage counts across `docs/00-foundations/_root/` as evidence of consistent use:

| Mark | Uses | Class of goods/services (indicative) |
|---|---|---|
| **PoeTech** | 203 | The house mark. Software-as-a-service; business management software. |
| **SKOS** | 196 | The platform/OS mark. **Clearance risk: "SKOS" is an established W3C standard (Simple Knowledge Organization System).** Screen hard before filing; a rename may be cheaper than a fight. |
| **Ari** | 75 | The AI persona. Short marks in crowded classes are hard; screen carefully. |
| **Council Chamber** | 58 | Governance/collaboration feature. |
| **Quality Gatekeeper** | 40 | Distinctive; describes a real named mechanism (DR-0020). |
| **Behavioral Mirror** | 19 | Distinctive method name. |
| **Love Corner** | 13 | Already has a standalone branded door (DR-0174). |
| **The Root** | 23 | Descriptive-leaning; weaker. |
| **Want-To-Use Bar**, **Composable Spine**, **Workforce Layer**, **OpsBoard**, **Living Lessons** | 2-8 | Method names; protect via copyright/publication rather than filing. |

Two facts that matter: US rights arise from **use in commerce**, and federal registration requires either actual use (1(a)) or a bona fide **intent to use** (1(b)), which lets you stake a priority date **before** launch. Registration is per-class and takes months to over a year. *Owner: a trademark attorney. Not legal advice.*

**Note against our own rules:** `THE-WAY.md` is the meta-frame and "The Way" is a Terminology Binding - but it is a **scriptural** term (Acts), not a coined mark. Do not attempt to own it. That would be claiming private title over the Word's own language, which is inconsistent with `CLAUDE.md`'s posture on the Word.

### Lane B - COPYRIGHT (real, but with an AI authorship problem you must handle honestly)

Copyright attaches automatically on fixation. Registration is what gives you **standing to sue in federal court** and access to **statutory damages and attorney's fees** when registration precedes (or promptly follows) the infringement - which is the difference between a right you have and a right you can afford to enforce.

**The complication, stated plainly rather than hedged:** the US Copyright Office's position is that **copyright requires human authorship**, and that **purely AI-generated material is not protectable** - while a human's own contributions, and a human's creative **selection, arrangement, and modification** of AI output, **are** protectable. (Registration guidance, 88 FR 16190, March 2023; *Copyright and AI, Part 2: Copyrightability*, January 2025. The human-authorship requirement was upheld in *Thaler v. Perlmutter*.) *Owner: an IP attorney. Confirm the current state of the law before filing.*

This repo is largely Claude-authored under Darrell's direction. That means the honest sort is:

- **Strongest human-authored, clearly protectable:** Darrell's **declarations and directives** - the doctrinal rules in `CLAUDE.md`, the Typographic Theology, the Color Theology, the worldview spine (`THE-HOLY-SPIRIT-INTEGRATION-WORLDVIEW.md`), the spoken teachings captured under the 2026-07-03 rule, and the **selection and arrangement** of the 298-record decision ledger.
- **Mixed, requires disclosure on registration:** the foundation docs and specs - human-directed, AI-expressed. Registrable **with** the AI-generated portions disclosed and disclaimed.
- **Weakest:** bulk generated code where the human contribution was direction rather than expression.
- **Not yours at all, and already correctly handled:** the base biblical texts. The 2026-06-25 research-review already did this work properly - WEB and KJV are public domain, the word-study datasets are PD or CC-BY, SBLGNT is correctly avoided. **The clarification layer is the ownable part.** That doc is the model for how the rest of this should be done.

**Do not overstate authorship on a registration.** A knowingly inaccurate application can invalidate the registration. The disclosure requirement is a feature here: it forces the inventory that makes the asset real.

### Lane C - TRADE SECRET (currently forfeited; recoverable only going forward)

This is the lane that would otherwise protect the **methods** - the gate suite, the orchestration ladder, the QA acceptance-criteria engine, the module template. It requires secrecy plus reasonable protective measures. The public repo has already published it. **Nothing already public can be pulled back into secrecy.** What can still be protected: everything not yet published - customer data, prompt libraries, tuned models, operational runbooks, the specific configurations that make a tenant deployment work, and any future module built in a private repo from the outset.

### Lane D - PATENT (lowest priority; likely not worth it)

US patent law requires a **natural person** as inventor - AI cannot be named (*Thaler v. Vidal*, Fed. Cir. 2022). Software and business-method claims face a hard subject-matter bar after *Alice*. Cost runs to five figures per application with multi-year timelines. Additionally, **public disclosure starts the clock**: the US allows a one-year grace period from the inventor's own disclosure, and most foreign jurisdictions allow **none** - the public repo has likely already forfeited most non-US patent rights. **Recommendation: skip, unless a specific novel mechanism is identified and counsel disagrees.**

---

## 4. What has to happen, in order

Ordered by dependency and by urgency. Steps 1-4 are the ones that actually convert work into property.

### Step 1 - Decide the repo posture (Darrell's call; blocks nothing else, but bleeds daily)

The current setting publishes the methods for free while claiming nothing. Three coherent postures - pick one deliberately rather than by default:

- **(a) Private + proprietary.** Flip the repo private, add an "All rights reserved" notice, split any genuinely public surface into a separate repo. Preserves trade secret **for future work**. Strongest commercial posture for Ring 3.
- **(b) Public + licensed.** Stay public, add an explicit licence (proprietary-source, or a copyleft like AGPL that forces anyone building a competing service to publish their changes). Keeps the "for us, by us" visibility; abandons trade secret permanently; still supports trademark + copyright.
- **(c) Split.** Public: the mission, the doctrine, the Living Lessons, the community surfaces. Private: the module engine, the gate suite, the orchestration, tenant configuration. **This is the recommendation** - it matches `COMMUNITY-FIRST-MISSION.md` (the mission is a gift) and DR-0018 (the paid rings fund the free tier) without giving away the machine that makes the paid rings possible.

Either way, **add a root `LICENSE` + `NOTICE` this week.** It is the cheapest step on this page and it is the one that puts the world on notice.

### Step 2 - Form the entity and assign the IP into it (this is the step that creates the asset)

Nothing else counts until this exists. Sequence:

1. Form the LLC (Illinois, per the jurisdiction referenced throughout the strategy docs), get the EIN, adopt an operating agreement.
2. **Execute a written IP assignment from Darrell personally to the entity**, with a **schedule of assigned assets** attached. *This is the single most important document in this entire plan.* Without it the LLC owns nothing and there is nothing to sell, license, or borrow against.
3. Put a **contributor IP assignment / work-made-for-hire clause** into the 1099 contractor agreement **before** the Workforce Layer (DR-0017) onboards its first worker. A contractor owns their work by default absent a written assignment - this is exactly the failure mode DR-0021 already routes to employment counsel. **Adding the IP clause to that same engagement is nearly free right now and expensive to retrofit later.**
4. Record the AI-assistance facts in the assignment so the entity's title is accurate, not overstated.

*Owner: a business-formation attorney + the employment attorney already scoped in DR-0021 and DR-0026. Not legal advice.*

### Step 3 - Build the IP inventory (the "Defined" test) - this one is buildable in-repo now

Convert "the repo" into a **schedule of discrete, named, dated, versioned assets**, each with: name, type (mark / work / secret), owner, fixation date, human-authorship note, provenance (DR refs + commit SHAs), current protection, and intended protection. The repo is unusually well-positioned for this - the 298-record decision ledger with dated declarers is *better* provenance evidence than most companies can produce.

Per `CLAUDE.md` ("The App Is the Primary Artifact"), this belongs **both** as a repo file **and** as a surface inside the app - and `_root/LEGAL-PRIVACY-BOUNDARY.md` already specifies the Business area tracking "IP - trademark filings, copyright, trade secrets, infringement actions." **The IP register is a Legal-module feature that is already designed and not yet built.**

### Step 4 - File, in priority order

1. **Trademark: `PoeTech`** first - the house mark, cleanest, most defensible. Intent-to-use if not yet in commerce.
2. **Clearance search on `SKOS`** before spending anything on it. The W3C collision is real and a rename now costs far less than a rebrand after launch.
3. **Copyright registration** on the highest-value **human-authored** works: the doctrinal corpus (`CLAUDE.md` rules, the Worldview spine, the foundation set) and the Living Lessons / Study Edition clarification layer - as a group registration where eligible, with AI-generated portions disclosed.
4. **Patents: skip** unless counsel identifies something specific.

### Step 5 - Create the revenue instrument (the "Monetised" test)

The asset becomes financially real at the **first signed licence**. DR-0022 already names the vehicle: the law firm running its practice on PoeTech as the first Ring-3 tenant. What that needs is a **written licence agreement** - scope, term, territory, fees, IP ownership of tenant data vs platform, and warranty/liability limits. One signed agreement does more for valuation than every filing above, because it establishes a price.

---

## 5. The honest summary

The work is strong and unusually well documented. The **wrapper** is missing entirely: no entity, no assignment, no notice, no filings, no licence - and a public repository that has been quietly giving away the one protection that would have covered the methods.

**None of that is hard to fix, and none of it requires slowing the build.** Steps 1 and 3 can happen this week without a lawyer. Step 2 is one attorney engagement and is the step that actually creates the asset. Steps 4 and 5 follow from it.

**The right sequencing instinct:** the IP clause in the contractor agreement (Step 2.3) and the repo posture decision (Step 1) are the two that get **more expensive every day they wait**. Everything else can be done deliberately.

---

## 6. Proposed decisions (NOT yet accepted - Darrell declares)

Recorded here so they can become DRs when he decides. Nothing in this document authorises a filing, a formation, a repo settings change, or a payment.

| # | Proposed decision | Tier |
|---|---|---|
| P1 | Adopt the **split posture** (Step 1c): mission/doctrine public, module engine + gate suite + orchestration private. | C |
| P2 | Add a root `LICENSE` + `NOTICE` asserting ownership; no open-source grant by default. | B |
| P3 | Form the entity and execute the **personal-to-entity IP assignment** with an asset schedule. | C |
| P4 | Add an **IP assignment clause** to the 1099 contractor agreement **before** the first Workforce Layer worker onboards. | C |
| P5 | Build the **IP register** as a repo file **and** a Legal-module surface in the app (extends `LEGAL-PRIVACY-BOUNDARY.md`). | B |
| P6 | File `PoeTech` first; **clear `SKOS`** before spending on it. | C |
| P7 | **Do not** pursue patents absent counsel identifying a specific novel mechanism. | B |
| P8 | **Do not** attempt to trademark "The Way." It is the Word's language, not ours to own. | A |

---

*Prepared under `CLAUDE.md` Layer 0. Legal-doctrine statements are training-data knowledge flagged for counsel confirmation per DR-0076 §8, not verified readings of current law. Repo facts are measured from this working tree and the GitHub API on 2026-09-06.*
