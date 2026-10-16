# 2026-10-16 — What should be proprietary, and how to make it official so we can include people and companies

**Type:** research-review (Layer 4)
**Prompted by:** Darrell, 2026-10-16: *"we have some research however... look into the DRs and research current situations.... also what should be proprietary and how to get that official so we can include people and companies... My wife is interested in taking care of this asap."*
**Builds on (read these, do not redo them):** `docs/00-foundations/_root/IP-REGISTER.md` (the live register), `docs/99-session-notes/2026-09-06-poetech-ip-conversion-what-makes-it-a-real-asset.md` (the five tests, the four lanes), `docs/99-session-notes/2026-09-19-ip-assignment-attorney-pack.md` (the dissolved-entity blocker, the formation papers, the clearance finding), `docs/99-session-notes/2026-09-19-poetech-reinstatement-runbook.md` (the two decisions made, the filing order, the call script).
**Not legal, tax or accounting advice.** Every step names who owns it. Law and fee statements below come from secondary sources found on 2026-10-16 and are marked; the governing number is always the agency's own.
**Re-review:** 2026-10-30, or the day the Secretary of State returns POE TECH, LLC to good standing, whichever comes first.

---

## 0. The answer in one paragraph

**The thinking is done; the paperwork is not.** The September work already decided what to protect and in what order. Since then **nothing on the legal side has moved**: POE TECH, LLC still appears to be in involuntary dissolution, no IP has been assigned into it, no contributor agreement exists, no trademark search or filing has happened, and the repository is still public. One step blocks all the rest — **reinstating the LLC** — and it is exactly the kind of step Christina can drive this week: one phone call, one vendor choice, one packet. Two new things change the plan: making the repository private now has a **measured monthly cost** nobody weighed, and **one mark on our register was never ours** ("Love Corner" is the church's), while two more names the app serves (Shay's and Christina's businesses) must never be added. And bringing people and companies in needs a **short set of five agreements**, listed in §4, none of which exists yet.

---

## 1. Current situation — measured 2026-10-16, not recalled

| Item | State | How it was checked |
|---|---|---|
| **POE TECH, LLC** (IL file 05947103) | **Involuntary dissolution since 2024-03-08, as of the 2026-09-19 record.** No sign of reinstatement since. | Darrell's Gmail searched for Secretary of State, reinstatement, registered agent and annual-report mail after 2026-09-18: **none**. ilsos.gov is unreachable from this sandbox, so the live state record was **not** re-read. Christina should confirm it on the state's site (one search, link in §6). |
| **Laverdiere Construction** bid invitations addressed to "Poe Tech LLC" | **Still arriving** — 2026-09-29, 10-01, 10-03, 10-04, 10-05, 10-14 (CDB / IDOT public works). | Gmail, same search. The September holding position stands: do not bid as the LLC until it is back in good standing. |
| **The repository** | **Still public.** `"private": false`, `"visibility": "public"`. | GitHub API, 2026-10-16. |
| **README** | Said *"Private repository of PoeTech LLC."* **That was false on both counts** (public; the registered name is POE TECH, LLC and it is dissolved). | Corrected in this change. |
| **LICENSE + NOTICE** | **Done.** Proprietary, all rights reserved; Scripture and third-party material carved out. | `LICENSE`, `NOTICE` at the root. September's proposal P2 is complete. |
| **IP register** | **Built** — repo file + in-app surface (Books → Legal), engine `app/src/lib/ip-register.js`. Every row still fails the first test, *Owned*. | `docs/00-foundations/_root/IP-REGISTER.md`. |
| **Written IP assignment** (Darrell → the LLC) | **Not executed.** Blocked on the entity. | No instrument in the repo or the mail search. |
| **Contributor / contractor agreement** | **Does not exist.** | No document found. |
| **Trademark clearance or filing** | **None.** "PoeTech" and "Poe Tech" return no USPTO record in a web search; the free USPTO search is unreachable from here. Prior *users* (not registrants) were found in September in CA and MD. | Web search 2026-10-16; USPTO not reachable from this sandbox. |
| **App Terms of Use / Privacy Policy** | **None found** in `app/public` or the components. | Repo search 2026-10-16. |
| **Human contributors to the code** | **1** (Darrell) — title is still clean. | September measurement; the collaborator list has not changed. |

**What changed since September that matters here:** DR-1066 (2026-10-16) made adding a second church a form, not a migration. That means **other churches and businesses can now be onboarded**, which turns "how do we include people and companies" from a future question into a this-month one.

---

## 2. Two new findings

### 2.1 Making the repository private has a real monthly cost, and it was never weighed

September recommended the **split posture** (mission and doctrine public; engine, gate suite and orchestration private). That is still right. But GitHub bills Actions minutes **only on private repositories**, and this repository runs a lot of them:

| Measure | Value | Source |
|---|---|---|
| One main-branch CI run (19 jobs) | **~56 billed minutes** | Measured from run 38752103557, 2026-10-15 |
| CI runs per day | **~48** (run number 8,227 over 172 days) | Measured from the run numbering |
| Rough monthly CI minutes, CI workflow alone | **~80,000** | 48 × 56 × 30, an estimate |
| Included minutes on a free private plan | **~2,000 / month** | Secondary sources, 2026 |
| Linux minute rate beyond that | **~$0.006** | GitHub's published runner pricing reference |
| **Rough cost if flipped private today** | **on the order of $450–500 / month**, before the ~70 other workflows | Estimate; GitHub's own billing would state the real figure |

**So the posture decision has three honest options, not two:**

1. **Stay public for now**, accept that published methods are not trade secrets (they already are not), and rely on copyright + trademark + the LICENSE. Cost: $0. Loss: nothing new beyond what September already counted.
2. **Go private and pay** the minutes. Cost: roughly the figure above, monthly.
3. **Go private and run CI on our own machine** — a self-hosted GitHub runner on the NAS. GitHub does not charge for self-hosted minutes today (a planned per-minute fee was postponed, not cancelled). This is the sovereign-first option and fits `COMMUNITY-FIRST-MISSION.md` Commitment 4, but it puts the NAS in the merge path, so it must carry the same uptime proof as the deploy (DR-0107).

**Recommendation:** option 1 now, option 3 when it is built and proven — **do not flip the setting until CI has somewhere to run**, or the merge lane stops. *Owner: Darrell (it spends money or moves infrastructure).*

### 2.2 One mark on our register belongs to someone else, and two more must never be added

The register listed **Love Corner** as a PoeTech mark candidate. It is not ours. **"The Love Corner" is the church's own name and emblem, worn since 1946** (DR-1060), and DR-0174 built its door as "the church's own door." **Moore Divahs** (Shay's business) and **TLC Therapy Solutions** (Christina's practice) were never on the register, but the app serves both, so they are now recorded beside it as not ours.

What PoeTech owns is **the software and the service**. Each of those three owns **its own name**. The honest arrangement, and the one that makes including them easy:

- PoeTech **licenses the app** to each of them.
- Each of them **owns and may register its own mark**; PoeTech uses it with permission to brand their door.
- Nothing in an IP assignment from Darrell to POE TECH, LLC should sweep in those names. Over-claiming another's name is the same error as over-claiming Scripture.

Corrected in `IP-REGISTER.md` (amendment 2026-10-16) and in the app (`NOT_OURS`, `app/src/lib/ip-portfolio.js`) in this change.

---

## 3. What should be proprietary — the recommendation

Three bins. The test for each item: *whose is it, and does keeping it ours serve the mission or only us?*

### Bin A — ours, and given freely (copyright kept, sharing invited)

| What | Why free | How |
|---|---|---|
| **Living Lessons, the Godhead Study, teaching prose** | The mission is a gift (`COMMUNITY-FIRST-MISSION.md`); the Word must spread | Keep the copyright; license it for **free, attributed, non-commercial, unaltered** sharing. A standard licence of that shape is Creative Commons **BY-NC-ND 4.0**. Anyone may share a lesson; no one may sell it or change it. |
| **The doctrine and foundation documents** | Same | Same licence, or keep under the existing LICENSE and grant permission case by case. |

### Bin B — ours, and kept proprietary (all rights reserved; licensed, never given)

| What | Why |
|---|---|
| **The app and its code** — every door, the church module, the giving book, the onboarding form | This is what churches and businesses pay to use. The LICENSE already says all rights reserved. |
| **The engine** — gate suite, orchestration, module template, NAS riders | Already public, so not secret; still copyrighted and not licensed to anyone. |
| **The marks we actually own**: **PoeTech** (after clearance); a platform name; later, if wanted, **Ari**, **Council Chamber**, **Quality Gatekeeper**, **Behavioral Mirror** | A name is what customers recognize and what a copycat cannot take once registered. |
| **Customer and member data** | Not ours to sell (DR-0009), but ours to protect. It already never enters the repository. |

**On "SKOS":** the September clearance flag stands — it collides with an established W3C standard. Choose the platform's public name **before** filing anything for it. "PoeTech" may be enough on its own.

### Bin C — ours, and kept secret from now on (trade secret, going forward only)

| What | Condition |
|---|---|
| Tenant configurations, per-customer settings, credentials | Already outside the repository — keep it that way. |
| Tuned model weights and NAS runtime artifacts | Already outside the repository. |
| **Any new module built in a private repository from day one** | The only way to have a trade secret again. Pair with §2.1 option 3. |

### Not ours — never claim

| What | Whose |
|---|---|
| The Word (KJV, WEB) | Public domain; named in `NOTICE`. |
| "The Way" | Scripture's own language (Acts); already excluded by test. |
| "The Love Corner" | The Church of the Living God. |
| Bishop Gwin's sermons and the church's service recordings | Bishop Gwin and the church. Our lessons are our own prose, credited and not reproduced (`COLG-SERMON-INTAKE.md` rule 3) — still get the **written permission** in §4.B. |
| "Moore Divahs" | Shay. |
| "TLC Therapy Solutions" | Christina's practice. |
| Third-party open-source code | Its own authors, under its own licences; listed in `NOTICE`. |

---

## 4. Including people and companies — the five agreements

Each one exists so that someone can join **with their share written down**, which is what makes it fair as well as safe. None exists yet. An attorney drafts them; this is the list to hand over.

**A. Contributor agreement** — for every person who builds, writes, teaches or designs for PoeTech (staff, contractors, church volunteers writing lessons).
- **A present assignment** to POE TECH, LLC of what they make for PoeTech ("hereby assigns", not "will assign"). Paying someone does not transfer copyright; only a signed writing does. "Work made for hire" usually does **not** cover a contractor's software, so do not rely on that label alone.
- **A carve-out for what they bring with them** (their own prior work stays theirs).
- **Credit and pay written down** — what they give and what they get. (DR-0191, DR-0038.)
- **Confidentiality, with the federal whistleblower-immunity notice** required by the Defend Trade Secrets Act (18 U.S.C. §1833(b)). Leaving it out costs the right to exemplary damages and attorney fees in a later trade-secret case.
- **No non-compete.** Illinois bars non-competes below **$75,000** a year and non-solicits below **$45,000** (rising to $80,000 / $47,500 on 2027-01-01), and a non-compete is the wrong posture for a community platform anyway.
- **Employee or contractor** is a separate classification question for employment counsel (DR-0021, DR-0026).

**B. Content permission from the Church of the Living God and Bishop Gwin** — covering the in-app recordings, transcripts, the sermon library, and lessons taught from his messages; how he is credited; and that the church keeps its own rights. Short, and it removes the one real ambiguity in the teaching corpus.

**C. Mutual NDA** — for conversations with partner companies and other churches before they sign. Same whistleblower notice as A.

**D. Customer agreements**
- **Church subscription agreement** — the church owns its data and can export it any time; no term lock-in; PoeTech is never the merchant of record for giving (DR-1066); the supported-tier price.
- **Business tenant licence** — for businesses running on PoeTech (DR-0022 named the first).
- **App Terms of Use and Privacy Policy** — published in the app; every user accepts them at sign-in. **Missing today**, and needed before strangers sign up through a second church's door.

**E. Partner agreement** — for larger churches that mentor smaller ones (the Partnership tier, `COMMUNITY-FIRST-MISSION.md` Commitment 5): rights to refer, train and co-brand, and how fees are rebated.

---

## 5. The order to do it in — who does what

Everything downstream of step 4 is blocked until the LLC is back in good standing.

### This week — Christina can drive all of it

| # | Step | Who | Notes |
|---|---|---|---|
| 1 | **Confirm the entity status** on the Illinois business search (link §6) | Christina | Should still read involuntary dissolution. If it does not, stop and tell Darrell. |
| 2 | **Call the Secretary of State, Business Services, 217-524-8008**, using the script in the reinstatement runbook | **Darrell**, or Christina **if** she is named on the record or the operating agreement | The state discusses an entity only with people on its record. Check the 2018 signed operating agreement (Gmail thread "Signed Operation Agreement with EIN") for whether Christina is named; if not, Darrell dials and she takes notes. Write down the exact total, and the answer to "does reinstatement relate back?" |
| 3 | **Choose a commercial registered agent service** | Christina chooses, Darrell's card | Criteria in the runbook: Illinois address, scan-and-forward to email, annual-report reminders. |
| 4 | **Answer the Laverdiere question**: was any invitation answered after 2024-03-08? | Darrell | Do not bid as the LLC until good standing returns. |
| 5 | **Book one business attorney** for one engagement covering: reinstatement relate-back, the IP assignment, the five agreements in §4 | Christina | One engagement, not five. Hand over: the attorney pack, this document, the operating agreement. |

### Weeks 2–3

| # | Step | Who |
|---|---|---|
| 6 | File the reinstatement packet with the agent change inside it; pay the state's number | Darrell signs, Christina assembles |
| 7 | **Trademark clearance search for "PoeTech"**, and decide the platform name (SKOS or another) | Attorney |
| 8 | **Repository posture decision** with the §2.1 cost in hand | Darrell |

### After good standing returns

| # | Step | Who |
|---|---|---|
| 9 | **Sign the IP assignment**, Darrell → POE TECH, LLC, with the dated register printout as Schedule A | Darrell + attorney |
| 10 | **Contributor agreement in place before anyone else contributes** | Attorney drafts; every contributor signs |
| 11 | Church content permission (§4.B) signed by the church | Church office + Bishop Gwin |
| 12 | **File "PoeTech"** with the USPTO (intent-to-use or use basis; likely software and SaaS classes) | Attorney |
| 13 | **Copyright registration** of the human-authored works, with the AI-assisted portions disclosed | Attorney |
| 14 | **Terms of Use + Privacy Policy** published in the app; acceptance at sign-in | Attorney drafts, we build it in |

---

## 6. Costs and facts, with their sources

Government fees are from secondary sources found 2026-10-16. **Confirm each on the agency's own site the day you pay.**

| Item | Figure | Source |
|---|---|---|
| Illinois LLC reinstatement | **$200**, plus **$75** per missed annual report and **$100** penalty per delinquent year; one guide's example puts three years overdue near **$725** | [statebusinesscompliance.com reinstatement 2026](https://www.statebusinesscompliance.com/blog/illinois-llc-reinstatement-in-2026-forms-fees-how-long-it-takes), [annual report 2026](https://www.statebusinesscompliance.com/blog/illinois-llc-annual-report-2026). The Secretary of State's number governs. |
| Reinstatement form | **LLC-35.40** in most sources; one names LLC-45.70 | Same; confirm on [ilsos.gov LLC forms](https://www.ilsos.gov/publications/business-services/llc.html) |
| Illinois business entity search | — | [apps.ilsos.gov/businessentitysearch](https://apps.ilsos.gov/businessentitysearch/) |
| USPTO trademark application | **$350 per class**; **+$200** per class for free-form descriptions not from the ID Manual; **+$100** for an incomplete filing | [beancount.io 2026 USPTO guide](https://beancount.io/blog/2026/09/27/how-much-does-trademark-cost-2026-uspto-fees-guide), [World Trademark Review](https://www.worldtrademarkreview.com/review/the-trademark-prosecution-review/2026/article/specialist-chapter-understanding-the-new-us-trademark-filing-system-and-fee-increases) |
| Professional clearance search | **$500–$1,500** typical | [ipboutiquelaw.com](https://ipboutiquelaw.com/trademark-search-before-filing-what-examiners-look-for-usa/) (a firm that sells it) |
| USPTO free search | tmsearch.uspto.gov | [tmarkmetric.com](https://tmarkmetric.com/insights/tess-uspto-trademark-search) |
| Copyright registration today | **$65** standard, **$45** single, **$85** group of unpublished works | [zenind.com 2026 guide](https://www.zenind.com/help/post/how-to-register-a-copyright-in-the-us-in-2026-a-step-by-step-guide-for-creators-and-businesses) |
| Copyright fee increase | Final schedule sent to Congress July 2026; could take effect **around 2026-11-11** (reported: $85 / $55 / $130). Filing before then saves money if the works are ready. | [policyrisk.com](https://policyrisk.com/federal-register/2026-05529), [Federal Register proposal](https://public-inspection.federalregister.gov/2026-05886.pdf) |
| AI and copyright | The Supreme Court **denied review** in *Thaler v. Perlmutter* on **2026-03-02**: copyright requires a human author. AI-assisted work can still be registered for its human selection, arrangement and writing, with the AI part disclosed. | [Holland & Knight](https://www.hklaw.com/en/insights/publications/2026/03/the-final-word-supreme-court-refuses-to-hear-case-on-ai-authorship), [Baker Donelson](https://www.bakerdonelson.com/supreme-court-denies-certiorari-in-thaler-v-perlmutter-ai-cannot-be-an-author-under-the-copyright-act) |
| Contractor IP | Contractors own their work by default; a written **present** assignment transfers it; work-for-hire rarely covers contractor software | [Rocket Lawyer](https://www.rocketlawyer.com/q-and-a/answer/what-is-the-difference-between-ip-assignment-work-for-hire), [beancount.io contractor guide](https://beancount.io/blog/2026/09/09/contractor-ip-ownership-assignment-agreements-startup-guide) |
| DTSA whistleblower notice | Required in agreements with employees **and contractors** that govern confidential information; omission forfeits exemplary damages and fees | [McGlinchey](https://www.mcglinchey.com/insights/defense-of-trade-secrets-act-prompts-new-notice-in-employment-and-contractor-agreements), [Sterne Kessler](https://www.sternekessler.com/app/uploads/2022/10/Defend_Trade_Secrets_Act_of_2016_Client_Advisory.pdf) |
| Illinois non-compete limits | **$75,000** non-compete, **$45,000** non-solicit; **$80,000 / $47,500** from 2027-01-01; HB1642 ($300,000) did not pass | [BCLP](https://www.bclplaw.com/en-US/events-insights-news/illinois-enacts-sweeping-reforms-to-non-compete-and-non-solicit-agreementswhat-all-employers-need-to-know.html), [ILGA HB1642](https://www.ilga.gov/ftp/legislation/104/BillStatus/HTML/10400HB1642.html) |
| Source-available licences | FSL and BSL block competing hosted services but are not OSI open source; AGPL is OSI-approved | [fsl.software](https://fsl.software/), [Armin Ronacher](https://lucumr.pocoo.org/2024/9/23/fsl-agpl-open-source-businesses/) |
| GitHub Actions on private repos | ~2,000 included minutes/month on Free; Linux 2-core ~$0.006/min | [GitHub runner pricing](https://docs.github.com/en/enterprise-server@3.17/billing/reference/actions-runner-pricing), [cicdpipelinecost.com](https://cicdpipelinecost.com/github-actions-pricing) |

---

## 7. Honest limits (DR-0076 §8)

- **The live Illinois record was not re-read.** ilsos.gov does not answer from this sandbox. "Still dissolved" rests on the 2026-09-19 record plus the absence of any reinstatement mail since.
- **No trademark clearance was run.** USPTO's search does not answer from here either; a web search is not a clearance search.
- **Christina's own mailbox was not searched** — only Darrell's is connected here. If she already called the state or an agent service, this document is behind her.
- **The CI cost is an estimate** from run numbering and one measured run, not a GitHub bill.
- **Every legal statement is for counsel to confirm.** The structure is sound; the drafting is theirs.

---

## 8. Proposed decisions — Darrell declares

| # | Proposal | Default if he says nothing |
|---|---|---|
| Q1 | Christina leads the reinstatement and the attorney engagement | Yes — he asked for it |
| Q2 | Keep the repository public until CI can run on the NAS; then go private | Yes |
| Q3 | License the teaching corpus for free, attributed, non-commercial, unaltered sharing (CC BY-NC-ND 4.0) | Proposed only — a bright line on how the Word-teaching travels |
| Q4 | Do not claim "The Love Corner", "Moore Divahs" or "TLC Therapy Solutions"; license the app to their owners | Yes — they are not ours |
| Q5 | Choose the platform's public name before any filing for "SKOS" | Yes |

---

## 9. Addendum, same day — where the documentation is, why it was not obvious, and what was built (DR-1076)

Darrell, later on 2026-10-16: *"How does Christina get information about the IP information... where is the documentation etc... why isn't it obvious how can we make sure users know where to look for documentation of their records etc... Opportunities and constraints.... solutions after evaluating the DRs and Ways."*

### 9.1 Why it was not obvious (measured)

| Cause | Evidence |
|---|---|
| The plan lived only in the repository | Four documents (§ "Builds on" above and this one), none linked from any screen |
| The in-app register was dated 2026-09-06 and still listed "Love Corner" | `app/src/lib/ip-portfolio.js` before this change |
| The Legal Help entry described only reserve set-asides | `help-content.js` `books:legal` before this change: "Legal and reserve set-asides, kept separate." The tab held three other things |
| That entry was not watched by the freshness gate | `help-freshness.json` held 3 topics, none of them Legal |
| Four record surfaces had no Help at all | Your Data, Church → My Record, Church → Giving Book, Books → Taxes: no `HELP` key |
| No map of where records live | Records sit on seven surfaces; nothing listed them together |
| Each legal shelf is private to its own account | Migration 0180: `legal_documents_read ... USING (created_by = auth.uid())` |
| The Legal screen's headline claimed at-rest encryption is "built in" | The same screen, lower down, said correctly that it is not built |

### 9.2 What was built (the Ways applied: DR-0065 the app is the primary artifact, P15 reality-trace, DR-0076 no claim without evidence)

1. **Make it official, on Books → Legal.** Ten steps in three phases, each with who, why and how. A step reads **done only when its paper is on the Business shelf**, dated on or after 2026-09-19. Seven new document types were added to the Business picker so every step can be proven. The entity's status is still never painted; step 1 is "go and read it." Engine: `app/src/lib/make-it-official.js`; proven by `make-it-official.test.jsx`, including a mutation check (removing the date rule fails the test).
2. **Where your records live.** A new section of the Help roadmap with seven stops, each tapping straight to its screen: Legal, Taxes, the family plan, My Record, your own giving, the Giving Book, Your Data.
3. **Help that tells the truth.** `books:legal` rewritten for all four things the tab holds; new entries for the four surfaces that had none; Legal registered with the freshness gate, so a change to the tab without a Help update now fails the build. The tab shows its registered summary at the top.
4. **The register corrected.** 24 rows; the not-ours list on screen; the amended date shown.
5. **The encryption claim corrected** on the Legal headline.

**How Christina gets it today:** open the app → Books → Legal → *Make it official*. Or tap the **?** at the top of any screen → *How this works* → *Where your records live*.

### 9.3 Constraints that remain

- **Shelves sync between family members only by the filer's choice (DR-1077).** Darrell, the same day: *"We are in the same family and need our records to be in sync with what we are doing and also some users will not want that... we want all opinions to be able to be used without any issues."* Built the same day as DR-1077 (migration 0299): an opt-in share per document to the household, private by default, modelled on the church shelf's existing `shared_with_office` toggle, with its own database smoke because it widens who can read privileged paper.
- **The repository documents are shown as paths, not links.** The repository is public, but sending a reader to GitHub is not where the work runs. The steps carry the substance in the app; the long write-up stays in the repository.
- **Not legal advice.** Counsel still drafts every paper.

## 10. Addendum, same day — delivering at a cost we can sustain

Darrell: *"we want to be able to keep delivering solutions to the users at scale and at a budget we can sustain based on the prices"* and *"Any buildable solutions... open source that could be used for lowering our costs monthly or would be considered too expensive to sustain in work or other issues?"*

### 10.1 What it costs today (Gmail receipts 2026-06-15 → 10-16, plus the repository)

| Line | Monthly | Status |
|---|---|---|
| Claude Max, billed through Google Play (development and the NAS lesson writer, `infra/nas-lesson-builder/`) | **$273.12** ($250 + tax) | measured |
| Supabase Pro, hosted project | **$25.00** | measured. The live database is the NAS since `infra/nas-supabase/REPOINT-ARMED`; the hosted project is a mirror |
| Google AI Plus 2TB | $9.99 | measured; no app use found, likely personal |
| GitHub Actions (73 workflows, 25 with a schedule) | $0 | public repository |
| Cloudflare Pages + Functions, Tailscale, mail | $0 | no receipts |
| Domain, NAS electricity, Webshare proxy | unknown | no receipt in the window |
| **Measured total** | **$308.11** (or $298.12 without the personal line) | |

Against the prices: **one Household plan ($89) covers the hosted database more than three times over; about three and a half Household plans cover everything measured.** Supabase alone already sits at the $25/mo vendor soft cap (`docs/decisions/PRINCIPLES.md`, COST-DISCIPLINE).

### 10.2 Options, sorted

| Option | Verdict | Saves | Cost in work and risk |
|---|---|---|---|
| Move the hosted Supabase project to the free tier, or close it, once its role as a mirror is confirmed | **Do it, after a check** | $25/mo | About an hour. Eight workflows still use Supabase secrets (db-migrate, rls-isolation, harvest-health, nas-storage-sync and four more), counted in the repository, and the free tier pauses idle projects. Check those first. Spends no new money; Darrell's call because it touches the deploy path |
| Bill Claude through the web instead of Google Play | **Check the price first** | Possibly about $50/mo | Ten minutes. The web prices come from third-party sites and were not confirmed on claude.com |
| Stay public; do not flip the repository private | **Keep** | Avoids about $470/mo of Actions minutes | None. The §2.1 estimate stands |
| A self-hosted GitHub runner on the NAS | **Not now** | $0 while public | GitHub's own documentation says to use self-hosted runners **only with private repositories**: a pull request from a fork can run code on the machine. On a public repository it is a security hole at the house. Revisit only with the posture decision |
| Move lesson writing from Claude to the local Ollama models | **Too expensive in work** | About $100–150/mo only if Max were downgraded | Max is still needed for development; quality review would be ongoing; the NAS is one box shared with whisper |
| Self-hosting more services | **Already done** | — | Postgres, auth and storage, local models, voice (Piper, XTTS, F5) and speech-to-text already run on the NAS. The real exposure is **off-box backups of the NAS database**, which self-hosting does not give for free |
| Thin the scheduled workflows | Optional | $0 today | One to two hours. Only matters if the repository ever goes private |
| Voice licences | Watch | — | XTTS-v2's model licence may restrict commercial use (unverified here; check the model card). Piper (MIT) and Kokoro (Apache-2.0) are the safe shipping choices |

**Recommendation:** spend effort on **off-box backups for the NAS database**, not on moving anything else home. Take the two cheap money actions once each is checked. Keep the repository public until the posture decision is made with these numbers in hand.

**Not verified:** domain renewal, Webshare use, whether GitHub's self-hosted runner fee is in effect, whether Cloudflare counts direct uploads against the 500-builds limit. Actions figures are run counts and wall time, not a bill.

Sources: [GitHub 2026 Actions pricing changes](https://resources.github.com/actions/2026-pricing-changes-for-github-actions/) · [GitHub self-hosted runner warning](https://docs.github.com/en/actions/how-tos/manage-runners/self-hosted-runners/add-runners) · [Supabase self-hosting](https://supabase.com/docs/guides/self-hosting) · [Supabase pricing summary](https://www.activepieces.com/blog/supabase-pricing-free-tier-limits-pro-costs-egress) · [Cloudflare Pages limits](https://developers.cloudflare.com/pages/platform/limits) · [Claude Max pricing (third party)](https://intuitionlabs.ai/articles/claude-max-plan-pricing-usage-limits) · [open-source TTS licences](https://tts.ai/tools/open-source-tts/)
