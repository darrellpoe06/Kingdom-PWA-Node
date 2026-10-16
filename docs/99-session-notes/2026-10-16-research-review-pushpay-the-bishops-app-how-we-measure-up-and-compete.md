# 2026-10-16 — Pushpay, the Bishop's app: opportunities, constraints, how we measure up, how we compete

**Type:** research-review (Layer 4)
**Prompted by:** Darrell, 2026-10-16, from a Google search on his phone: *"The App a Bishop here in Los Angeles is using is called... the app we have is through push pay... investigate the opportunities and constraints of the system and see how we measure up and how we can compete for business."* Then: *"He's paying $200 a month for membership."*
**Pairs with:** `2026-06-24-research-review-gtm-strategy-post-modular-rebuild.md` (the structural moat vs Pushpay, :60; "keep 100% of the offering; pay a fair flat subscription", :164), `2026-06-01-app-services-promise-audit-and-master-plan.md` (competitive scan :467-469; the planned Pushpay/Tithe.ly CSV import :363 and "sovereign giving via Stripe" :468), `COMMUNITY-FIRST-MISSION.md` Commitment 5, DR-0230 (Stripe seam), DR-0362 (the office giving book). No prior document was dedicated to Pushpay; this is the first.

**Posture (DR-0100):** established fact stated plainly; genuinely open points flagged narrowly; vendor marketing named as vendor marketing. Every claim about OUR system cites `file:line`; every claim about Pushpay cites a source in §8. The sandbox has no route to pushpay.com, capterra.com or softwareadvice.com (DNS refused 2026-10-16), so Pushpay facts come from search excerpts of those pages, not a full read — tier 2 where it matters, and marked.

**Re-review:** 2026-11-16 (30 days), or earlier the day the Bishop's written Pushpay quote and contract end date are in hand.

---

## 0. The answer in one paragraph

Pushpay is a **payment processor with software on top**, priced for churches of 1,100+ and sold down-market. The Bishop's $200/month is its entry giving tier; with processing it is roughly **3.5–4% of everything his congregation gives**, on a multi-year auto-renewing contract whose exit cancels every recurring gift. We do not compete by becoming a processor — the binding rule in `app/src/lib/giving.js:9-13` is that no payment data ever touches this app, and `COMMUNITY-FIRST-MISSION.md` forbids the lock-in model outright. We compete on the three things Pushpay structurally cannot do: **(1) count ALL the money** (Cash App, Zelle, checks, plate — not only what rides its rail), **(2) leave the church owning its rail and its data** (its own Stripe nonprofit account at 2.2% + $0.30, its own records on its own NAS), and **(3) a flat, fair, no-term price** that does not scale with the congregation's generosity. The one gap we must close to win a Pushpay church is **processor-fed year-end contribution statements** — today our office book is honest that it is *"not a church-issued tax statement"* (`app/src/lib/giving-reports.js:53`). The second gap is that a **second church cannot be onboarded today**: the data model is multi-tenant, but the join function, the leader allowlist and the giving channels are hardcoded to COLG. Both gaps are the next build, and both are buildable now.

---

## 1. What Pushpay is (the ARE, from the outside)

**Company.** Pushpay Holdings — a church giving + engagement platform that is first a **payment processor** (it operates as an ISO with a processing partner and manages the merchant relationship itself) and second a software suite bolted onto that rail. Acquisitions: Church Community Builder (ChMS, Dec 2019, $87.5M), Resi Media (streaming, 2021, $150M), Nurture.io (pastoral-care engagement, Apr 2026). Suite names: Pushpay Giving, ChurchStaq (giving + ChMS + app), ParishStaq (Catholic), Resi. Dec 2025 launch: AI across the line (AI for Giving Data, AI for People Search, "Genny" support assistant).

**Positioning.** Built for large evangelical and nondenominational churches (core customers 1,100–50,000 weekly attendance per the company profile). Morningstar's initiation note cites ~5% penetration of U.S. religious giving and frames small churches as the untapped pool. It also sells down-market, which is how a congregation the Bishop's size ends up on a $200/month membership.

**What the ~$200/month giving tier buys** (vendor pages + third-party reviews; Pushpay publishes no price list):

| Capability | Included |
|---|---|
| Online giving form (embeds in site) | yes |
| Text-to-give, custom QR codes, tablet kiosk | yes |
| Recurring: weekly / biweekly / monthly / 1st+15th / quarterly / semi-annual / annual | yes |
| "Recurring Suggestions" (ML prompts to convert one-time givers) | yes |
| Payment methods: card, debit, Apple Pay, Google Pay, ACH | yes |
| Donor segments: new / repeat / recurring / at-risk / lapsed, with automations | yes |
| Record checks, cash, in-kind alongside online | yes |
| Annual giving statements, email or print | yes |
| Reporting dashboards | yes |
| Branded church app, ChMS (CCB), streaming (Resi) | add-on tiers, ~$399–$799+/mo |

**What it costs the congregation** (the figure that matters to a church office):

| Line | Rate (sources conflict; ask for the written quote) |
|---|---|
| Platform fee | ~$199/mo giving-only (Capterra lists $199 starting); the Bishop reports $200/mo |
| Card | 2.9% + $0.30 (Pushpay's own blog: 2.1–2.9% + $0.20–0.30 by volume) |
| ACH | ~1% + $0.30 (0.5–1.0% by volume) |
| Contract | 1–3 year terms, auto-renew, no mid-term downgrade; reviewers report a 3-month cancellation notice |
| Exit | self-serve export in dashboard, or a $150 Data Export service ticket; closing the account cancels every active recurring gift and removes saved payment methods; account cannot be reopened |

Worked example, a congregation giving $20,000/month, 70% card / 30% ACH, ~400 gifts/month:

| Component | Monthly |
|---|---|
| Platform | $200 |
| Card processing (2.9% of $14,000 + $0.30 × 280) | $490 |
| ACH processing (1% of $6,000 + $0.30 × 120) | $96 |
| **Total** | **~$786/mo (~$9,400/yr), ~3.9% of giving** |

(Processing goes to the card networks and the ISO whoever the vendor is; the ~0.7-point gap between Pushpay's card rate and Stripe's nonprofit rate of 2.2% + $0.30 is the part a church can actually recover by switching rails.)

## 2. Pushpay's constraints — the documented pain, stated plainly (DR-0100 tier 1)

These are repeated across Capterra (4.2/5, 183 reviews; Value for Money 3.6/5, Support 3.8/5), Software Advice, the BBB complaint file, and Donorbox's cancellation guide. They are not one grumpy reviewer.

1. **Contract lock-in.** Multi-year, auto-renewing, no downgrade mid-term, long notice period. A BBB complainant says Pushpay refused to cancel after several requests. A church that shrinks still pays the large-church price.
2. **Price for small churches.** $3,000–$4,200/yr platform-only for a 100–300 member church (CostBench estimate), plus processing. Reviewers call it "a heavy burden for smaller organizations" and "solid but very expensive."
3. **Recurring gifts are hostage to the processor.** Saved card/ACH tokens live with Pushpay's merchant account. Leaving means every recurring giver re-enrolls somewhere else. Pushpay sells a "Recurring Migration" campaign to pull givers IN; there is no equivalent out.
4. **Data ownership is at minimum unclear.** A competitor's reading says Pushpay's terms assign data ownership to Pushpay. Unverified against the current terms (tier 2), but the export mechanics above make the practical effect the same: the church gets a CSV, not its system.
5. **Oversold onboarding.** Multiple reviewers: promised trial that did not exist, implementation support refused after signature.
6. **Built for the 1,100+ church.** Donor-development dashboards, at-risk segments and ML recurring prompts assume a staff that reads dashboards. A congregation with elderly, tech-novice office staff (COLG's named reality in COMMUNITY-FIRST-MISSION.md) pays for features it does not operate.
7. **Engagement optimization on giving.** "Recurring Suggestions" is machine learning aimed at converting givers — exactly the engagement-optimization pattern DATA-AS-EMPOWERMENT-NOT-EXTRACTION.md names as an anti-pattern that never ships here.

## 3. Pushpay's genuine strengths — stated just as plainly

Underclaiming is also a lie (DR-0100). Pushpay wins today on:

- **It moves the money.** One vendor, one merchant account, card + ACH + wallets, PCI handled. A church office signs once and giving works.
- **Recurring giving infrastructure.** Schedules, failed-payment retry, card updater — the plumbing that makes "set it and forget it" tithing real.
- **Year-end statements that satisfy IRS Pub. 1771** (name of org, amount, "no goods or services" line, delivered before the donor files). Generated from the processor feed, so they are authoritative, not self-reported.
- **One throat to choke.** Giving + ChMS + app + streaming under one contract; a Bishop can buy the whole stack from one rep.
- **Scale and trust.** Public company, 10+ years, thousands of churches; a pastor's peers use it, which is exactly how the Bishop in Los Angeles came to it.

---

## 4. How we measure up — the ARE, from our own code (DR-0219 SHOULD → ARE → GAPS)

**The SHOULD.** `COMMUNITY-FIRST-MISSION.md` names the v1 Church Module scope: membership directory with privacy controls; **giving + tithing tracker with end-of-year tax receipts auto-generated**; calendar + events; communication broadcast; prayer request capture. Commitment 5 fixes the pricing shape: self-host free + open source; a supported tier **flat per month, no per-seat scaling**; *"No data lock-in. Any church can leave with their data, anytime, no friction."* Commitment 4: runs on the church's own infrastructure where feasible, because *"ongoing SaaS costs are the silent tax that grinds down community institutions."*

**The ARE**, capability by capability against the Pushpay giving tier:

| Pushpay giving-tier capability | PoeTech / Love Corner today | Evidence |
|---|---|---|
| Hosted giving form, church is the merchant | **No, by design.** Give surface links out to the church's own confirmed channels only; never invents a URL, never collects money | `app/src/lib/giving.js:9-13`, `:94-135` (`resolveGiveDestination`) |
| Card / ACH / wallets | Via the church's existing channels: Zelle, Cash App ($TheLoveCorner), Givelify, PayPal | `app/src/lib/giving.js:151-187` |
| Recurring giving schedules | **Gap.** Nothing in-app; a member sets recurrence inside Zelle/Cash App/Givelify | — |
| Text-to-give, QR, kiosk | QR share door exists for the church front door; giving QR rides the church's Zelle QR payload | `app/src/lib/church-own-door.js:33-36`, `giving.js:151` |
| Member's own giving history | **Yes, and stronger on privacy.** Owner-only ledger, integer cents, Matthew 6:3-4 stated on the surface; the office cannot read it | `app/src/lib/giving-records.js:8-31`, migration 0184 |
| Church-office contribution book | **Yes, and broader than Pushpay.** One bank deposit split back into named gifts from the Cash App statement; subtotals must tie; unidentified givers are named rows, never dropped | `app/src/lib/giving-batch.js:1-28`, `giving-reports.js:14-35`, tables 0214 |
| Donor identification | Propose-and-stop matching with remembered aliases; never auto-decides a person | `app/src/lib/giving-donor-match.js:1-28` |
| Monthly / by-giver reports, CSV export | Yes, same renderer as the family books | `app/src/lib/giving-reports.js:322` |
| **Year-end contribution statement (IRS Pub. 1771)** | **Gap.** `giverStatement()` exists but is honestly labelled a working record, *"not a church-issued tax statement"* | `app/src/lib/giving-reports.js:53`, `:213` |
| Donor segments (new / lapsed / at-risk) + ML nudges | **No, by doctrine.** Engagement optimization on giving is a named anti-pattern | `DATA-AS-EMPOWERMENT-NOT-EXTRACTION.md` |
| Push notifications to the congregation | **Partly.** Web Push with dedupe lock, dead-subscription pruning, capped fan-out (three brakes) — but only two triggers exist: "service is live" and a new direct message. No general announcement broadcast yet | `app/src/lib/push-fanout.js:1-30`, `app/src/lib/push-announce.js:8-9`, `app/functions/api/push-send.js` |
| Branded church app | Yes, as a PWA under the church's own scope, texted-link share door, no app-store dependency | `app/src/lib/church-own-door.js:28-40` (DR-0174, DR-0258) |
| Membership directory, roles, onboarding | Yes — allowlist + invite join, owner/admin capabilities enforced in the database | `app/src/lib/church-members.js:1-27`, `church-member-intake.js` |
| Prayer requests | Partly — a member's personal log sent to the church by mailto; no intercessor-team queue yet | `app/src/components/ChurchHome.jsx:191-210` |
| Check-in (attendance / children) | **Absent** | — |
| Sermon library, live worship, Call to Give from our own services | Yes — the service-video spine, transcripts, detected giving appeals with office review | `app/src/lib/call-to-give.js:1-30`, `resolve-church.js` |
| Multi-church tenancy | **Data model yes; onboarding a second church NO.** One resolver scopes every Church surface to an instance and RLS is the wall — but `join_church_instance()` returns the first membership (`LIMIT 1`), its leader allowlist maps hardcoded emails to `slug = 'colg'`, the Love Corner door maps only `['colg']`, and the giving channels are COLG constants | `app/src/lib/church-instance.js:1-30`, `infra/supabase/migrations-auto/0294*.sql:77,121-123`, `app/src/lib/app-doors.js:83`, `giving.js:151-187`; DR-0060, DR-1053 |
| Data ownership + export | Church's own Supabase/NAS rows; CSV export from the same report models | Commitment 5; `giving-reports.js` |
| Price | $0 self-host; supported tier flat/month (figure not yet set) | `COMMUNITY-FIRST-MISSION.md` Commitment 5 |

**The GAPS, named plainly:**

1. **No processor-fed, church-issued year-end statement.** This is the one line a church treasurer will not compromise on, and the one Pushpay does well. Our book assembles from the Cash App statement and says so honestly. To issue a Pub. 1771 statement we need (a) a confirmed-giver claim set for the tax year, (b) the organization's name/EIN and the "no goods or services were provided" attestation, (c) the office's sign-off, (d) delivery before the donor files. Items a–d are buildable from tables 0214 today; the missing primitive is **a sign-off state on the batch** and a **statement renderer** with the Pub. 1771 fields.
2. **No in-app recurring giving.** Today it lives inside whichever rail the member chose. The honest path that keeps the link-safety rule: the church's **own Stripe account** at the nonprofit rate (2.2% + $0.30, 80%+ donation volume, EIN/501(c)(3) letter), with Stripe-hosted Payment Links for one-time and recurring gifts. The app still only links out; Stripe hosts the form and the card data; Stripe's webhook (or monthly CSV) feeds the office book the same way the Cash App statement does. The church, not PoeTech, is the merchant — which is the whole point.
3. **A second church cannot be onboarded without a migration.** *(CLOSED the same day — DR-1066, migration 0297: a steward adds a church from Church → Members → Add a church; its office publishes its own face and giving channels under This church’s door; the Give panel never borrows COLG’s list. The installable door per church remains a build step.)* Seventeen migrations reference `'colg'`; a new church today means a new seed migration, generalizing `join_church_instance` and the door/giving config, and a Tier C review (RELEASE-TIERS: first partner-church addition). The LA Bishop cannot be installed until this is a form an owner fills in, not a migration an engineer writes. (`docs/01-architecture/MULTI-INSTANCE-STRATEGY.md` Phase 3 is the named path.)
4. **The supported-tier price was floated, never decided.** Commitment 5 fixes the shape; `2026-06-02-research-review-media-opportunities-from-cbs-death.md:326` floated a COLG-Supported tier at $199/mo flat as a bundle anchor against Subsplash + Tithe.ly; the GTM review (:164) says price *below* category leaders and sell the absence of the skim. Those two have not been reconciled. Recommendation in §7.

**Already in hand for the build (the ARE that helps):** a signature-verified Stripe webhook and server-priced checkout already exist for PoeTech's own products (`app/functions/api/stripe-webhook.js`, `checkout.js`; DR-0230) — the Stripe importer for a church's own account is a sibling of that seam plus `cashapp-statement.js`, not a new integration class. The master plan already named a Pushpay/Tithe.ly CSV giving import (:363) — that is how a Pushpay church's history comes WITH it on day one.

---

## 5. Opportunities — where a Pushpay church is winnable

1. **Every church that shrank or plateaued on a Pushpay contract.** Price is fixed, giving is not; reviewers describe exactly this squeeze. Our pitch is arithmetic, not persuasion: §1's worked example against a flat fee plus 2.2% + $0.30 on the church's own Stripe.
2. **Every church that gives through Cash App / Zelle / plate and cannot reconcile it.** Pushpay reports only what crosses Pushpay. COLG's steward re-keyed figures three times a month (`giving-reports.js:3-7`). The deposit-split book is a capability Pushpay does not have and cannot have without owning the rail.
3. **Contract end dates.** Pushpay auto-renews with long notice. The sales motion is a calendar: ask the renewal date, diary the notice window, be installed and reconciled a month before it.
4. **Sovereignty is the moat, not a feature.** `DATA-AS-EMPOWERMENT-NOT-EXTRACTION.md` says it: the structural difference from extractive tech IS the competitive advantage. A church leaving Pushpay loses its recurring givers; a church leaving us leaves with its rail (its own Stripe), its records (its own rows) and its app (a PWA at its own domain).
5. **The Bishop in Los Angeles is a reference customer, not a one-off.** The Church Module *"generalizes from COLG's needs to other churches anywhere in similar situations"* (COMMUNITY-FIRST-MISSION). Two churches on the same module is the proof the multi-church tenancy in `church-instance.js` was built for.
6. **Partnership tier.** A larger church with tech capacity rebates its fee against contribution (Commitment 5). That is a sales lever Pushpay cannot match.

## 6. Constraints — ours, stated just as plainly

1. **We cannot promise "set it and forget it" recurring giving until §4 gap 2 is built.** Until then the honest line is: recurring rides the rail the member already uses.
2. **We cannot issue the tax statement until §4 gap 1 is built.** Selling against Pushpay before this is closed is selling a hole; DR-0076 forbids it.
3. **The church's own Stripe account means the church does PCI-light onboarding itself** (Stripe handles card data; the church supplies EIN, bank, identity). That is a one-time office task we must walk them through — Commitment 6's train-the-community, with a paste-ready checklist.
4. **Tier C.** Real money flow and a new COLG/partner-church-facing surface are Tier C (`RELEASE-TIERS.md`); the brakes gate activation, never building (DR-0225). Build now, soak, activate with the Bishop watching.
5. **Support capacity.** Pushpay has a support desk (rated 3.8/5, but it exists). Our supported tier must name a response time we can keep; the three-brakes rule and the site-health witness are the machinery, Darrell + the Foundation are the people.
6. **Apple/Google app-store presence.** Pushpay sells a store-listed branded app. Ours is a PWA; on iOS that means Add-to-Home-Screen and Web Push only on iOS 16.4+. State it; do not paper over it.

## 7. How we compete — the recommendation, with a default (DR-0111)

**Default recommendation, proceeding unless Darrell says otherwise:**

1. **Build the gaps now, in this order:** (0) ✔ built 2026-10-16 (DR-1066) — second-church onboarding as an owner-facing form; *(a) moved the same day by another session: DR-1064 (#2216) built the contribution-statement module `app/src/lib/giving-statement.js` with the Pub. 1771 fields — read DR-1064 before shaping what remains of (a); do not build it twice* (generalize `join_church_instance`, the door map and the giving-channel config off the `colg` constants; tenancy guard proves isolation), because nothing else can be sold to the Bishop until it exists; then (a) the Pub. 1771 year-end statement on the office book (batch sign-off state + statement renderer + delivery log), proven-to-catch with a test that fails if any required field is missing; (b) the Stripe-nonprofit rail as a **church-owned** channel: a Stripe Payment Link entry in the church's giving channels (link-out, unchanged safety rule), plus a Stripe statement importer alongside `cashapp-statement.js` so recurring card/ACH gifts land in the same book; and (c) the Pushpay CSV import the master plan already named, so his giving history arrives with him. No PoeTech merchant account, ever.
2. **Set the supported-tier price flat and low enough that the arithmetic sells itself:** a fair flat figure under half of Pushpay's $200 platform fee, no term, cancel any month, data export always on. Darrell sets the number (a bright line only he holds); the two figures already on record are $199/mo flat (the 2026-06-02 bundle anchor, which was priced against Subsplash + Tithe.ly + media hosting, not against giving-only Pushpay) and "below category leaders" (GTM 2026-06-24). For a giving-plus-office-book product sold against a $200/mo Pushpay tier the brief's default is $79/month, re-reviewed with the first two paying churches; the $199 figure stays the anchor for the full media bundle.
3. **The offer to the Bishop, in his terms:** keep what you have until your renewal date; we install beside it; your Cash App/Zelle/plate reconcile on day one; by the notice window you have year-end statements and your own Stripe rail; your recurring givers re-enroll once, to YOUR account, and never again. The questions to ask him first: the written Pushpay quote; the contract end date and notice period; card vs ACH share; number of recurring givers; whether his office issues statements from Pushpay today.
4. **COLG's own statements today:** COLG reportedly runs "Church Plus" on the church NAS (`2026-06-08-research-review-conference-event-center-data-ingestion.md:156,239`); where its year-end statements are produced is still open and must be confirmed with the office before gap (a) is shaped — it may be an import, not a replacement.
5. **Record the posture as a decision** once Darrell confirms the price: "PoeTech is never the merchant of record for a church's giving; the church owns its rail" — a new DR citing Commitment 5 and `giving.js:9-13`, so no future session re-litigates it.

**Not in scope (and why):** replacing CCB/Resi/ChMS head-on — the Bishop pays for giving, not for the suite; the suite tiers ($399–$799+/mo) are a later conversation once the giving win is proven. `re-review:` 2027-01-16.

## 8. Sources

Pushpay (vendor): [digital giving page](https://pushpay.com/digital-giving) · [parish giving features](https://pushpay.com/product/catholic/pd/church-giving/) · [best online giving platforms (their own fee table)](https://pushpay.com/blog/best-online-giving-platforms-churches/) · [AI launch, Dec 2025](https://pushpay.com/blog/pushpays-most-innovative-launch-yet-ai-for-the-journey) · [why Pushpay (ISO / infrastructure claims)](https://pushpay.com/why-pushpay/) · [migration pitch](https://pushpay.com/resources/migration/) · [press](https://pushpay.com/resources/press)
Reviews / complaints: [Capterra, 4.2/5, 183 reviews, $199 starting](https://www.capterra.com/p/142580/Pushpay/reviews/) · [Software Advice reviews](https://www.softwareadvice.com/church/pushpay-profile/reviews/) · [BBB complaint file](https://bbb.org/us/wa/redmond/profile/payment-processing-services/push-pay-1296-1000060647/complaints) · [Donorbox: how to cancel Pushpay ($150 export, recurring cancelled on close)](https://donorbox.org/nonprofit-blog/how-to-cancel-pushpay) · [Donorbox review](https://donorbox.org/nonprofit-blog/pushpay-reviews)
Third-party pricing estimates (not official): [churchmemberpro review](https://churchmemberpro.com/blog/pushpay-review/) · [CostBench pricing + hidden costs](https://costbench.com/software/church-management/pushpay/) · [CostBench calculator](https://costbench.com/software/church-management/pushpay/calculator) · [tap.giving comparison](https://tap.giving/blog/best-online-giving-platforms-churches-2026.html) · [Learn of Christ review](https://learnofchrist.com/resources/pushpay)
Market / company: [Morningstar initiation (5% penetration)](https://www.morningstar.com.au/stocks/morningstar-initiates-coverage-of-faith-based-software-provider-pushpay) · [moomoo profile (core customer 1,100–50,000)](https://moomoo.com/stock/PPH-AU/company) · [yespress (CCB $87.5M, Resi $150M)](https://yespress.io/pushpay) · [faith.tools (Nurture.io, Staq transformation)](https://faith.tools/app/279-pushpay)
Competitor-authored (interested parties, used only for claims marked as such): [Simple Donation on data ownership](https://simpledonation.com/resources/pushpay-analysis-for-rockrms-churches) · [Tithe.ly vs Pushpay](https://get.tithe.ly/compare/pushpay-alternative) · [Zeffy vs Pushpay](https://www.zeffy.com/compare/zeffy-vs-pushpay) · [Vanco vs Pushpay](https://www.vancopayments.com/egiving/pushpay-versus-vanco)
Rails and rules: [Stripe nonprofit discount (official)](https://support.stripe.com/questions/does-stripe-offer-a-fee-discount-for-non-profit-organizations) · [Stripe 2.2% + $0.30 explained](https://guides.kindkiosk.com/article/stripe-nonprofit-rate) · [Planning Center Giving rates](https://planningcenter.com/giving) · [Tithe.ly processing fees](https://get.tithe.ly/blog/online-giving-processing-fees) · [IRS Publication 1771 (copy)](https://resources.foursquare.org/wp-content/uploads/sites/2/2023/03/p1771.pdf) · [Nucleus guide to giving fees](https://www.nucleus.church/blog/ultimate-guide-church-giving-fees)
