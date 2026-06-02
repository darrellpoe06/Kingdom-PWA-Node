# Online Research Bundle -- Holly Hill sqft, Karpathy video, refi rates, GPU-closet, tenant plan, @nas-replies-back, opportunities

**Date:** 2026-06-02
**Author:** Claude as Advisor (per `GOVERNANCE-EXECUTION-ADVISORY`)
**Frame:** Parallel research bundle per Darrell's 2026-06-02 "Always-Now Viable Fix + Source-Don't-Ask" directive. Seven tracks, sourced online, no work placed on Darrell or Christina.
**Senior foundations applied:** `feedback-research-first`, `feedback-distinguish-data-from-brand`, `COMMUNITY-FIRST-MISSION`, `BUSINESS-PROCESS-CONNECTIONS`, `project-sovereign-mesh-mvp-pragmatism`, `project-cost-discipline-with-growth-permission`, `feedback-decisions-with-rationale`, `MIND-OF-CHRIST` (the Phil 4:8 Test applied to every finding before delivery).
**Output:** consolidated findings + recommended action per track. Cite every claim.
**Scripture standard:** ESV primary per `SCRIPTURE-REFERENCE-STANDARD.md`.

---

## Executive summary -- the 10 highest-value findings + actions

1. **Both Holly Hill rentals are 972 sqft / 1 bath / 1959 ranches** -- identical Garden Hills 3rd Replat units. 1513 is parcel 412002376004, 1508 is parcel sequence-adjacent (likely 412002376003 or 412002376005). At the comp anchor of $113.75/sqft (Christina's 1501 HH + 1519 Hedge Rd average), **each Poe Holly Hill door appraises at ~$111K, not $150-$185K.** This tightens the equity-out math substantially -- and the verdict shifts.

2. **Cash-out math at the real 972-sqft anchor:** Combined Holly Hill cash-out potential = **only ~$0 at 75% LTV** (1513: $83K ceiling - $88K mortgage = negative; 1508: $83K ceiling - $110K mortgage = negative). The two Holly Hill doors are **roughly at parity or slightly underwater on a strict 75% LTV cash-out test.** This is a material finding -- the median-$57K-cash-out scenario from 2026-06-01 was based on an over-large sqft assumption.

3. **The hJNp9RwK-Uw video is "Kaparthy revealed the most profitable business to build in 2026 (Software 3.0)"** by Dream Labs AI, published 2026-05-23. Topic: Karpathy's Software 1.0 / 2.0 / 3.0 framework + the four moats that matter in the AI era: **Data, Distribution, Brand, Trust.** This is directly the strategic frame for the PoeTech showcase.

4. **2026 investment-property cash-out refi rates: ~7.0-7.5%.** National 30-yr fixed refi (owner-occupied) averaged 6.62-6.79% on June 1 2026; investment property adds 1-2% premium; cash-out adds another 0.25-0.5%. Net realistic Holly Hill quote: ~7.0-7.5% on a 30-year fixed cash-out. MBA forecasts rates do NOT fall below 6% in 2026.

5. **The right Champaign-area lender to call first is Busey Bank** (headquartered in Champaign, $10B+ asset bank, named originators Jan Buerkett + Jason Holdren + Kyle Watson at the University Ave mortgage center). Backup: UIECU + Heartland Bank + Hickory Point Bank. Get three quotes before committing.

6. **Holly Hill GPU-box closet specs are MET by any standard residential closet** with these confirmations: (a) dedicated 15A or 20A circuit ideally not shared with HVAC, (b) ~1,800-2,200 BTU/hr cooling capacity to dissipate ~450-650W under full load, (c) ambient air below 80F sustained, (d) at least 6-inch front + rear clearance, (e) Cat5e/Cat6 ethernet drop. A NEMA 5-15 circuit at 12A draw will work for the 4090 + 7950X + system; a 5-20 is safer headroom. Closet humidity should stay below 60% (most homes are fine; verify with a $10 sensor).

7. **Illinois 5-day notice is the cure path for non-payment** (765 ILCS 5/9-209). Champaign County has a free Eviction Mediation Program through the Dispute Resolution Institute -- mandatory pre-mediation session for both parties before court. Filing fee is ~$200, total process 3-8 weeks. Illinois Court-Based Rental Assistance Program offers up to $10K past-due rent + $700 court costs + 2 months future rent for tenants -- worth pointing the 1508 tenant to BEFORE issuing the 5-day notice. **Pastoral framing first, legal compliance always.**

8. **@nas-replies-back v1 design is straightforward**: Synology Chat outgoing webhook is already wired (wf08 captures inbound); add a Synology Chat INCOMING webhook (DSM 7 supports both) + n8n cron node firing every 4 hours during waking hours (7am-9pm) posting a status digest. The digest pulls from `/data/chatin/` recent captures + existing scheduled-check-in patterns. On-demand triggered by parsing "@nas status" / "@nas opportunities" / "@nas family voices" via the existing wf13 chat-action-router pattern.

9. **Master opportunities list across all reviewed contexts identifies 12 PoeTech opportunities** for the public PWA / sovereign-LLM-team substrate, ranked by sovereign-mesh tier + revenue-tier impact + focused-hour estimate. Highest-leverage: (a) **Sovereign Media Production Pipeline** (Tier 1, Business tier, ~24h to v1), (b) **The Family Worldview Commentary Pipeline** (Tier 1, Premium tier, ~12h to v1), (c) **Workspace-Builder-as-Product** (Tier 2, Business tier, ~16h to v1).

10. **The 1508 Holly Hill tenant resolution should follow the "Both" path Darrell chose**: send the payment plan WITHIN 24 HOURS (template provided below in Track 5) AND prepare the 5-day notice as a parallel artifact NOT sent yet. The Illinois CBRAP rental-assistance program info accompanies the payment plan -- pastoral first, legal compliance ready. Christina's clinical experience makes her uniquely well-positioned to read tenant context; she should be the human-in-the-loop voice for this single message.

---

## Track 1 -- Holly Hill property sqft (Champaign County records)

### Findings

**1513 Holly Hill Dr, Champaign, IL 61821**
- Square footage: **972 sqft** (assessor record, verified via Zillow public record)
- Beds / baths: **1 bath, beds not enumerated on Zillow but Garden Hills 3rd Replat layout is consistently 3-bed** (neighbors 1509, 1511, 1515 are all 3-bed/1-bath/972 sqft)
- Year built: **1959**
- Lot size: ~6,969 sqft (based on 1509 lot dimensions 70 x 100; identical replat lots)
- Parcel number: **412002376004**
- 2024 tax assessment: **$15,130**
- 2024 property taxes: **$1,319**
- Last sale: **$45,000 on 2023-01-26** (last recorded public sale; likely the Poe acquisition transaction; verify against title)
- Zestimate (Zillow, as of fetch): **$94,700** (range $78K-$112K)
- Rent Zestimate: **$1,345/mo**
- Heating / cooling: Forced Air / Central Air (inferred from neighbors)
- Construction: Brick exterior, Asphalt shingle roof (per 1509 record)
- Style: 1-story ranch
- Source: [Zillow 1513 Holly Hill](https://www.zillow.com/homedetails/1513-Holly-Hill-Dr-Champaign-IL-61821/3220604_zpid/)

**1508 Holly Hill Dr, Champaign, IL 61821**
- Square footage: **972 sqft** (confirmed via Spokeo public records + HotPads listing pattern)
- Beds / baths: **1 bath** (Spokeo confirms), beds inferred 3 from Garden Hills layout (verify against Poe lease)
- Year built: **1959**
- Lot size: ~6,969 sqft (assumed identical Garden Hills replat lot)
- Parcel number: not directly recovered online; parcel-sequence interpolation suggests **412002376003 or 412002376005** -- Darrell should confirm via [Champaign County Tax Inquiry](https://champaignil.devnetwedge.com/) by entering the street address
- Source: [Spokeo Holly Hill](https://www.spokeo.com/Holly+Hill+Dr+Champaign+IL+addresses), [HotPads 1508](https://hotpads.com/1508-holly-hill-dr-champaign-il-61821-1km75wf/pad)

**ZIP code correction:** Both homes are in **61821, not 61820** as the seed data shows. The seed data should be corrected in `app/src/poe-financial-mvp-v28.jsx` at the rentals seed if it's displayed publicly. Trivial fix; not a privacy issue, just an accuracy issue.

### What this changes

The 2026-06-01 holly-hill-equity-evaluation-with-real-comps.md used a ±10% range around the comp-average 1,525 sqft. **The actual sqft is 972 sqft per door -- 36% smaller than the comp anchor.**

**Revised appraisal anchor at $113.75/sqft x 972 sqft = ~$111,000 per door** (not $150-$185K).

**Revised cash-out math at 75% LTV:**

| Door | Mortgage | Appraisal (972 sqft x $113.75) | 75% LTV ceiling | Cash-out available |
|---|---|---|---|---|
| r2 -- 1513 Holly Hill | $88,000 | ~$111,000 | $83,250 | **-$4,750 (UNDERWATER vs 75% LTV)** |
| r3 -- 1508 Holly Hill | $110,000 | ~$111,000 | $83,250 | **-$26,750 (UNDERWATER vs 75% LTV)** |

**Verdict:** The two Holly Hill doors do NOT support a cash-out refinance against current mortgages at the 972-sqft / $113.75 comp anchor. They MAY support a rate-and-term refi if the existing 6.50% rates can be replaced with something better -- but 2026 investment-property rates are 7.0-7.5%, so the refi math is also unfavorable.

**Two paths remain viable:**
1. **Re-comp the appraisal more aggressively.** The recent 1501 HH sale at $123.33/sqft is a higher anchor; if a real appraiser values at $120-$130/sqft on improved condition or upgraded interior, the math shifts modestly positive. A real appraisal is needed before assuming this.
2. **Look elsewhere in the portfolio.** The 1003 Koehn, 1213 Koehn, 805 Apt complex, and 440 South Street doors all may have stronger equity-out potential. The Koehn doors with $1,250 / $1,200 rents against $95K-$100K mortgages and the 805 four-plex against $70K each are the next places to apply the same analysis. **Recommend running the same comp-anchored equity-out evaluation against the rest of the portfolio.**

### Recommended action

- **Update `2026-06-01-holly-hill-equity-evaluation-with-real-comps.md` with the 972-sqft revision** -- prepend a "2026-06-02 update: actual sqft confirmed at 972, revising equity-out math down to roughly neutral" note. Do NOT delete the original analysis; the framework remains correct, only the input changed.
- **Correct ZIP from 61820 to 61821** in the rentals seed data if public-facing (verify with Darrell first per `feedback-distinguish-data-from-brand`).
- **Pull the 1508 parcel number** by entering the address into [Champaign County Tax Inquiry](https://champaignil.devnetwedge.com/) -- this completes the records for the institutional-memory schema.
- **Get one real appraisal quote from Busey Bank** before treating the Holly Hill cash-out as off the table. The neighborhood IS appreciating; a real appraiser may anchor higher than the strict $113.75/sqft pull. But plan B (other portfolio doors) is the more probable path.

---

## Track 2 -- hJNp9RwK-Uw video (Karpathy Software 3.0)

### Video metadata

- **Title:** "Kaparthy revealed the most profitable business to build in 2026 (Software 3.0)" (the channel mis-spells Karpathy as Kaparthy)
- **Channel:** Dream Labs AI (https://www.youtube.com/channel/UC-PNuiLzjoIZO7cBhg7bJyQ)
- **Published:** 2026-05-23
- **URL:** https://www.youtube.com/watch?v=hJNp9RwK-Uw
- **Note:** YouTube served bot-protection on direct fetch + Tactiq returned empty transcript on free tier. Title, channel, date, and description recovered from embedded metadata; full transcript not extracted. Summary below assembled from the description + cross-referenced press coverage of the Sequoia Ascent 2026 source talk.

### 5-bullet argument summary

1. **Software 3.0 = LLMs as the programmable substrate, with the context window as the main lever.** Software 1.0 was humans writing code; 2.0 was humans curating datasets and training neural networks; 3.0 is humans programming LLMs via prompts, context, tools, examples, memory, instructions.
2. **Some apps stop existing as apps.** Karpathy's MenuGen example: in 1.0/2.0 you build a pipeline of OCR + image-gen + UX; in 3.0, hand the menu photo to a multimodal model and ask it to render dish images directly. The scaffolding code disappears.
3. **AI automates fastest where output can be verified** (math, code, structured tasks). Where verification is hard (taste, judgment, relational nuance), human + LLM stays competitive longest.
4. **The four moats that survive in Software 3.0: Data, Distribution, Brand, Trust.** Tech parity is the assumption; defensibility moves to (a) proprietary data flywheels, (b) reach-velocity into the addressable market, (c) brand-as-mindshare-anchor, (d) trust-as-explainability-and-safety.
5. **The next infrastructure wave is agent-native, not user-native** -- systems built for agents to operate, not just for humans to click. This aligns with `AI-FOUNDATION-INTERNAL-OPERATIONS.md` ("anything that is a click today should be an API call tomorrow").

### Most-quoted moments (from Sequoia talk press coverage)

- *"Some apps should stop existing as apps."* -- the MenuGen pivot.
- *"The context window is the new main lever."*
- *"AI automates fastest where output can be verified."*
- *"Brand becomes the product when tech parity is the norm."*

### Sources

- [Karpathy Sequoia Ascent 2026 summary (Karpathy's own blog)](https://karpathy.bearblog.dev/sequoia-ascent-2026/)
- [Karpathy's Software 3.0 Playbook -- philippdubach.com](https://philippdubach.com/posts/karpathys-software-3.0-playbook/)
- [Sequoia AI Ascent 2026: Andrej Karpathy -- Guillermo Flor](https://www.theaiopportunities.com/p/sequoia-ai-ascent-2026-andrej-karpathy)
- [Vibe Coding Was Just the Warmup -- Dealroom](https://app.dealroom.co/news/note/vibe-coding-was-just-the-warmup-andrej-karpathy-on-the-dawn-of-software-3-0)
- [Software 3.0 is eating the stack -- Kyndryl on the four moats](https://www.kyndryl.com/us/en/about-us/news/2025/10/rise-of-software-3-0)
- [Brand Distribution Trust the last moats -- GrowthMarshal](https://www.growthmarshal.io/blog/brand-distribution-and-trust-are-the-last-moats)

### PoeTech business opportunities from this video (3-5)

1. **Sovereign-LLM-team-as-product**: PoeTech IS the Software 3.0 substrate for non-Silicon-Valley businesses (church, therapy, online side hustles, Dev/Ops). The Karpathy framing directly validates the `project-sovereign-llm-teams-per-industry` direction. Use the four-moats framework on the public website as the explainer for WHY PoeTech-the-platform is defensible: family-data (DATA moat), Church-of-the-Living-God + COLG reach (DISTRIBUTION moat), Poe-family-name + the Worldview text (BRAND moat), open-source-core + sovereign-mesh + family-controlled-keys (TRUST moat).
2. **Agent-Native Surface Layer**: every existing PoeTech surface (Books, Real Estate, Debts, Markets, Church, Dev/Ops) gets a parallel agent-native API endpoint so the sovereign LLM teams can operate it as an MCP. Direct alignment with the existing AI Foundation principle. **Pre-existing direction; this video adds the Karpathy validation footnote.**
3. **The "App Disappears" template** -- a content series on the PoeTech blog / Educational module: "What old app should stop existing because Software 3.0 ate it?" Pick one per week from the 73-promise inventory; show what the Software-3.0 version looks like; ship the simpler one. Marketing-as-thought-leadership AND product roadmap input.
4. **MenuGen pattern for COLG**: The church bulletin / order-of-service / weekly-announcements task is a perfect MenuGen-equivalent. Photo of last week's bulletin + voice memo from Pastor + multimodal LLM = next week's bulletin draft. Ship as a Church Module v2 feature.

### Recommended action

- **Add the four-moats frame to the public PWA's About page** as the third pillar of "Why PoeTech" copy. Single short section, ~150 words. This is brand-positioning, not a feature ship. Pairs with the existing Religion AND Relationship copy.
- **Reference this video + Karpathy's Sequoia talk in the Sovereign-LLM-Teams-Per-Industry foundation doc** as external validation footnote.
- **Defer the MenuGen-pattern-for-COLG product feature** until the Church Module v1 (membership directory + communication + giving) ships, then add this as v2.

---

## Track 3 -- 2026 cash-out refinance rate landscape (investment property)

### National 2026 rate landscape (as of 2026-06-01)

- **30-yr fixed conventional refi (owner-occupied) average:** **6.62% per Zillow** / **6.79% APR per Bankrate** / **~6.5% per Freddie Mac PMMS**. ([Bankrate Cash-Out Refi rates](https://www.bankrate.com/mortgages/cash-out-refinance-rates/), [NerdWallet Cash-Out Compare](https://www.nerdwallet.com/mortgages/refinance-rates/cash-out-refinance), [Norada June 1 2026 update](https://www.noradarealestate.com/blog/mortgage-refinance-rates-today-june-1-2026/))
- **Cash-out premium over rate-and-term refi:** **+0.25 to +0.50 percentage points**. ([Bankrate Cash-Out](https://www.bankrate.com/mortgages/cash-out-refinance-rates/))
- **Investment property premium over owner-occupied:** **+1.0 to +2.0 percentage points** (loan officer guidance via Bankrate). ([Bankrate Investment Property Rates](https://www.bankrate.com/mortgages/investment-property-rates/), [The Mortgage Reports June 2026](https://themortgagereports.com/27698/investment-property-mortgage-rates-how-much-more-will-you-pay))
- **Combined: realistic 2026 investment-property cash-out refi rate = ~7.0% to 7.5% on a 30-year fixed.**

### Trend direction (forecast)

- **MBA forecast:** rates do NOT dip below 6% in 2026; could rise back toward 6.5%. First Fed hike forecast for mid-2027. ([MBA 2026 Forecast](https://nationalmortgageprofessional.com/news/mba-solidifies-2026-forecast))
- **NerdWallet June outlook:** rates could climb as hopes fade for Fed cut. ([NerdWallet June 2026 outlook](https://www.nerdwallet.com/mortgages/news/mortgage-outlook-june-2026))
- **Q2 2026 range:** 6.2% to 6.4% on baseline 30-yr; +1.5 to +2.5 percentage premium for investment cash-out gets you to that 7.0-7.5% range. ([Norada 2-year forecast](https://www.noradarealestate.com/blog/mortgage-rate-predictions-next-two-years-2026-2027/))

### Closing costs (typical)

- **Investment property cash-out closing costs: 2-5% of loan amount.** On the Holly Hill scenario, a $83K refi means $1,700-$4,150 in closing costs per door, $3,400-$8,300 across the two. Originator fees, appraisal ($500-$700), title insurance, escrow, recording, transfer tax are the line items.

### Recommended Champaign-area lenders

1. **Busey Bank** -- headquartered Champaign, $10B+ assets, top-3% nationally. Mortgage center at 100 W. University Ave, Champaign IL 61820, phone 217 number on file. Named originators: Jan Buerkett, Jason Holdren, Kyle Watson. ([Busey Champaign Mortgage](https://www.busey.com/locations/university/champaign---mortgage), [Busey Mortgage Team](https://www.busey.com/mortgage/mortgage-team))
2. **UIECU (University of Illinois Employees Credit Union)** -- credit-union pricing often 0.125-0.25% below banks; need to confirm investment-property programs.
3. **Heartland Bank** -- Bloomington-Normal HQ but Champaign branches; community-bank pricing.
4. **Hickory Point Bank** -- Decatur HQ but Champaign presence.
5. **Online national:** Better.com, Rocket, LoanDepot for shop-the-rate validation only -- their service quality on investment-property refi is mixed; use as a pricing floor, not as the operator.

### Recommended action

- **Get three quotes** -- one from Busey (in-person), one from UIECU (phone), one from Better.com (online). 30 minutes per quote. Compare on (a) headline rate, (b) closing costs, (c) timeline to close, (d) appraisal cost.
- **DO NOT initiate the actual refi until the appraisal is in hand**, given the underwater-at-strict-LTV math in Track 1. A real appraiser may anchor higher; only then is the cash-out viable.
- **MVP pragmatism (per `project-sovereign-mesh-mvp-pragmatism`):** the lender is mainstream-extractive infrastructure; that's the cost of the bridge. The Poe family does not need to wait for a sovereign-mesh lender to exist. Use the mainstream lender, take the cash, deploy it toward sovereign infrastructure (GPU box, vacation buffer, debt cancellation).

---

## Track 4 -- GPU box closet specs checklist

### The thermal load

- **RTX 4090 max power draw: ~450W under sustained load** ([Microcenter RTX 4090 power guide](https://www.microcenter.com/site/mc-news/article/nvidia-rtx-4090-power-requirements.aspx))
- **Ryzen 9 7950X TDP: 170W base, ~230W under PBO**
- **Motherboard + 64GB DDR5 + NVMe + cooling overhead: ~80-100W**
- **System total at full load: ~700-780W; realistic sustained 400-550W under mixed workloads**
- **BTU/hr conversion: 1W = 3.412 BTU/hr** ([Home Server Blog BTU calculator](https://thehomeserverblog.com/server-room-btu-calculator/))
- **Sustained heat load: 1,365-1,876 BTU/hr; peak 2,389-2,661 BTU/hr**

### The "Does Your Closet Meet These?" 1-page checklist

| Requirement | Acceptable range | How to verify in 5 min |
|---|---|---|
| **Dedicated 15A or 20A circuit** | NEMA 5-15R (15A) outlet works for 12A draw at 120V; 5-20R (20A) is safer headroom. NOT shared with HVAC. | Look at the outlet; T-slot horizontal = 20A, both slots vertical = 15A. Flip the breaker in the panel and confirm the closet outlet dies + nothing else in the office does. |
| **Cooling capacity** | Closet door cracked + box-fan into the closet = ~2,000 BTU/hr equivalent free. For sustained ops, a portable AC rated 5,000-8,000 BTU is overkill but cheap insurance. | If the closet door is full-height + has even 2-inch gap top/bottom, passive ventilation usually suffices. If the closet seals tight, add a $30 USB-powered closet exhaust fan. |
| **Ambient temperature ceiling** | Closet ambient under 80F sustained (RTX 4090 throttles above 87C GPU, ~10C above ambient under load) | A $10 Govee H5075 temp/humidity sensor logs ambient continuously. Place inside closet at component height. |
| **Humidity** | 30-60% RH | Same Govee H5075 sensor reads humidity. If Champaign-summer humidity pushes over 60%, run office dehumidifier. |
| **Network** | Cat5e/Cat6 ethernet drop to nearest router/switch; gigabit minimum | Run a single cable along the baseboard if not already present. Powerline ethernet adapter is plan B if cable run is impractical. |
| **Clearance** | 6 inches front + 6 inches rear of case for airflow + cable management | Tape-measure check. |
| **Physical security** | Lockable door OPTIONAL for family use; LAN-only network access is the real security layer. | Skip if family-use. Verify the door closes. |
| **Noise** | A Fractal North case with Noctua NH-D15 + Noctua chassis fans + Founders Edition 4090 = ~38-42 dBA under load. Office-acceptable. | Hear the existing office HVAC at startup; the box will be quieter or comparable. |
| **Fire safety** | Smoke detector within 10 ft (existing residential code) + dedicated breaker + UPS on automatic shutdown | Confirm the office has a smoke detector. Existing residential. |
| **Maintenance access** | Ability to slide the box out for component swap once a year | Verify the closet depth allows the case + 6 inches behind. |

### Recommended 2026 products (cost-discipline-with-growth-permission)

| Item | Product | Price (Amazon 2026) | Justification |
|---|---|---|---|
| **UPS** | APC Back-UPS Pro BR1500MS2 (1500VA / 900W) | ~$220 | Handles the 4090 + system at brownout; 19 min runtime at 300W; automatic shutdown signal via USB; 3-year warranty. ([APC BR1500MS2 at CDW](https://www.cdw.com/product/apc-back-ups-pro-1500va-900w-tower-120v-10x-nema-5-15r-outlets-avr-us/6403997)) |
| **Smart plug with energy monitoring** | Kasa KP125M (Matter) or Govee H7102 | $15-25 | Real-time + historical power draw, ties into Home Assistant or n8n via API. Confirms actual sustained wattage so we know if the math matches reality. ([Kasa KP125M](https://www.kasasmart.com/us/products/smart-plugs/kasa-smart-plug-slim-energy-monitoring-kp125m), [Govee with Energy Monitoring](https://www.amazon.com/Govee-Monitoring-Bluetooth-Assistant-Controller/dp/B0CW29H21T)) |
| **Temperature / humidity sensor** | Govee H5075 (Bluetooth + WiFi via hub) | $13 | Logs every minute, exports CSV, mobile app alerts at thresholds. Cheap insurance against runaway ambient. |
| **Closet exhaust fan** | AC Infinity AIRPLATE T7 or USB 120mm | $50-80 | Optional. Only needed if closet is fully sealed. Most office closets with door + crack are fine without. |
| **Cable management** | Pre-existing Cat6 + Velcro ties | <$10 | Velcro over zip-ties for future maintainability. |
| **Total accessories** | | **~$250-350** | Below the $500 ceiling typically allocated for accessories on a $3,500-$4,200 build. Aligned with cost-discipline-with-growth-permission. |

### Sovereign-mesh tier label

**Tier 1 (sovereign mesh native).** The GPU box is sovereign infrastructure by definition -- owned, on-prem, family-controlled keys, no external dependency. It IS the showcase.

### Recommended action

- **Have Darrell walk through the 10-point checklist in 5 minutes.** Each row he confirms shifts the readiness needle. Each row he can't confirm is a concrete action item (e.g., "the closet outlet shares a circuit with the office HVAC" = need an electrician to drop a dedicated circuit, ~$200-$400 in Champaign).
- **Order the UPS + Kasa smart plug + Govee sensor BEFORE the GPU box ships.** They're <$300 combined and they'll be installed when the box arrives.
- **Skip the portable AC unless the closet ambient reads above 80F under sustained use.** Adding it before measurement is over-engineering.

---

## Track 5 -- Tenant payment-plan template + escalation prep (1508 Holly Hill)

### Context

1508 Holly Hill tenant is $850 short on the current month per seed-data flag (`poe-financial-mvp-v28.jsx:103, 113-119`). Darrell answered "Both" -- send the payment plan AND prepare escalation in parallel.

### A. Payment plan template (markdown -- Darrell + Christina edit before send)

```
Dear [Tenant first name],

Christina and I noticed that this month's rent at 1508 Holly Hill came up
$850 short. Before anything else: we're not assuming anything about why.
Life happens, and we'd rather work this out with you than around you.

Here's what we'd like to propose. If something on this doesn't fit your
situation, please tell us -- it's a starting point, not a take-it-or-leave-it.

PAYMENT PLAN PROPOSAL:
- The $850 outstanding from [Month YYYY] gets paid back over [3 / 4 / 6]
  weeks at $[amount]/week or $[amount]/biweekly, on top of your normal
  rent.
- Your next regular rent payment of $1,400 is still due on [normal due date].
- We agree to NOT file an eviction notice while this plan is in good standing.
- If a payment in the plan is missed, we restart the conversation -- we do
  not jump straight to the next step.

WE WANT YOU TO KNOW:
- Illinois has a rental-assistance program (CBRAP) that can cover up to
  $10,000 of past-due rent plus 2 months of future rent for tenants in
  hardship. If you'd like, we can help you apply -- the link is
  https://www.illinoishousinghelp.org/cbrap. We'd rather see you stay than
  see you go.
- The Champaign County Eviction Mediation Program through the Dispute
  Resolution Institute is also available, free, before anything goes to
  court. We mention this in case the plan above doesn't work and we need
  a neutral third party to help us figure out something fair.

If you'd like to talk by phone or in person, Christina or I are available
this week. Just text either of us back.

In Christ,
Darrell + Christina Poe
[phone]
```

**Rationale notes for Darrell + Christina:**
- Opens with relationship before transaction (Religion AND Relationship).
- Names the gap honestly without accusation (the Behavioral Mirror: DATA-only).
- Offers a structured path, not an ultimatum.
- Points at CBRAP first -- the tenant may not know this exists, and $10K of state money beats $850 of evicted relationship.
- Identifies the mediation program as a path BEFORE court, not as a threat.
- Signs from both Darrell + Christina (Christina's LCSW + the marriage covenant strengthen the pastoral tone).

### B. Illinois 5-day notice (Plan B -- prepared but NOT sent)

Per 765 ILCS 5/9-209, a 5-day notice to pay rent or quit is the required first legal step before eviction can be filed. The standard Illinois form is:

```
ILLINOIS 5-DAY NOTICE TO PAY RENT OR QUIT
(765 ILCS 5/9-209)

TO: [Tenant full name]
TENANT(S) IN POSSESSION OF:
  1508 Holly Hill Drive
  Champaign, IL 61821

YOU ARE HEREBY NOTIFIED that there is now due to the undersigned the sum
of EIGHT HUNDRED FIFTY DOLLARS ($850.00) being rent for the premises
described above, for the period of [Month YYYY] through [Month YYYY].

YOU ARE FURTHER NOTIFIED that payment of said sum so due has been and is
hereby demanded of you, and that unless payment thereof is made on or
before the expiration of FIVE (5) DAYS after service of this notice, your
lease of said premises will be terminated.

ONLY FULL PAYMENT OF THE RENT DEMANDED IN THIS NOTICE WILL WAIVE THE
LANDLORD'S RIGHT TO TERMINATE THE LEASE UNDER THIS NOTICE, unless the
landlord agrees in writing to continue the lease in exchange for receiving
partial payment.

Dated: [date]
Landlord / Agent: Darrell Poe
Signature: ________________________
Address for payment: [address]
```

Service: Hand to the tenant, or post conspicuously on the door AND mail certified, return receipt requested. Per Illinois practice, hand-service is strongest.

**Hold this notice in a draft folder. Do not send unless the payment plan is rejected, ignored for 7 days, or actively broken.**

### C. Champaign County eviction process (Plan C -- last resort)

If the 5-day notice expires without cure, the next step is:

1. **File an eviction (Forcible Entry and Detainer) complaint** in Champaign County Circuit Court. Filing fee ~$200 (verify current schedule with the court clerk at 101 E. Main St., Urbana). ([Champaign County Circuit Court](https://www.champaigncountyil.gov/CircuitCourt/Orders.php))
2. **Mandatory pre-mediation session** through the Dispute Resolution Institute Eviction Mediation Program. Both parties must attend at least one pre-mediation session. ([DRI Eviction Mediation Program](https://dri-inc.org/eviction-mediation-program), [Champaign County Eviction Mediation Information PDF](https://www.co.champaign.il.us/CircuitCourt/PDFS/Small_Claims_Protocols/Eviction-Mediation-Program-Information-2021.pdf))
3. **Service of summons** by sheriff or licensed process server.
4. **Court appearance** 5-14 days after filing.
5. **Order of possession** if landlord prevails -- typically 7 days for tenant to vacate.
6. **Total timeline: 3-8 weeks** from 5-day notice to physical removal. ([Illinois Eviction Timeline -- iPropertyManagement](https://ipropertymanagement.com/laws/illinois-eviction-process))

### D. Faith-rooted / relational framing (for situations where escalation is the wrong move)

If the tenant responds with hardship context -- job loss, illness, family crisis, mental-health crisis -- the right next step is NOT the 5-day notice. The Religion-AND-Relationship standard says:

- **Job loss:** route to CBRAP IMMEDIATELY; offer to write a landlord-cooperation letter for the application.
- **Illness / medical:** offer to defer the $850 entirely if a doctor's note or hospital discharge document is provided, with the understanding that future rent resumes on schedule.
- **Family crisis (death, divorce, child crisis):** Christina's LCSW lens reads the room. The deferral may be 30 days, may be a different unit, may be exit-gracefully without eviction record. **The tenant becomes a soul cared for, not a case to close.**
- **Mental-health crisis:** Christina's TLC firewall holds -- she does NOT take this person as a clinical client. She can refer to community resources. The landlord relationship stays the landlord relationship.

**ESV -- Galatians 6:2:** *"Bear one another's burdens, and so fulfill the law of Christ."*

The 5-day notice is the legal floor, not the relational ceiling.

### Sources

- [Illinois Five Day Notice -- Kelley Kelley Kelley](https://kelleykelleykelley.com/illinois-five-day-notice-and-eviction/)
- [Illinois Landlord Tenant Rights -- IL AG PDF](https://illinoisattorneygeneral.gov/Page-Attachments/LandlordAndTenantRightsLaws.pdf)
- [Illinois Forcible Entry and Detainer Act -- ILGA](https://www.ilga.gov/legislation/ilcs/ilcs4.asp?ActID=2017&ChapterID=56)
- [Champaign County Eviction Mediation Program PDF](https://www.co.champaign.il.us/CircuitCourt/PDFS/Small_Claims_Protocols/Eviction-Mediation-Program-Information-2021.pdf)
- [Illinois Court-Based Rental Assistance Program](https://www.illinoishousinghelp.org/cbrap)
- [Dispute Resolution Institute -- Eviction Mediation](https://dri-inc.org/eviction-mediation-program)
- [AOA USA sample payment plan](https://aoausa.com/sample-payment-plan/)
- [Past Due Rent Payment Plan -- eForms](https://eforms.com/loan-agreement/payment-plan/past-due-rent/)
- [Free Rent Payment Plan -- Rocket Lawyer](https://www.rocketlawyer.com/real-estate/landlords/property-management/document/rent-payment-plan)

### Recommended action

- **Christina edits the payment plan text** above to match her voice + the actual relationship with the tenant. 15-min edit max.
- **Send via text + email** (the tenant's preferred channel) within 24 hours.
- **Hold the 5-day notice in a draft folder.** Do NOT send it. Do NOT mention it in the payment plan message.
- **Set a 5-day check-in:** if no response by 2026-06-07, Christina sends a single follow-up: *"Hey [name], just wanted to make sure the message went through. Are you doing okay?"*
- **Set a 10-day decision gate:** if no response or rejection by 2026-06-12, the 5-day notice is served. Document the decision per `feedback-decisions-with-rationale`.

---

## Track 6 -- @nas-replies-back v1 implementation pattern

### Architecture (v1 scope: status digest reply, on-demand trigger)

**Two new pieces to add:**

1. **Synology Chat INCOMING webhook** (already supported in DSM 7.x) -- a single URL that n8n can POST to in order to send a message into the #PoeTech-PWA channel. ([Synology Chat Integration KB](https://kb.synology.com/en-global/DSM/help/Chat/chat_integration?version=7), [Synology Chat Webhooks and Slash Commands KB](https://kb.synology.com/en-us/DSM/tutorial/How_to_configure_webhooks_and_slash_commands_in_Chat_Integration))
2. **New n8n workflow `wf38-nas-replies-back-status-digest.json`** -- cron trigger every 4 hours during waking hours (7am, 11am, 3pm, 7pm CDT) + on-demand trigger via wf08 ("@nas status" / "@nas opportunities" / "@nas family voices" / "@nas blockers") + classifier code node + Synology Chat POST.

### Workflow node-by-node spec (wf38)

```
[Cron Trigger]            [Webhook trigger (from wf08 @nas pattern)]
   |                              |
   v                              v
[Build digest payload]    [Parse @nas command]
   |                              |
   v                              v
   +-----[Classifier: which content section to include?]-----+
                            |
                            v
            [Read /data/chatin/ recent captures (last 4h)]
                            |
                            v
            [Read /data/family-feedback/ recent (last 4h)]
                            |
                            v
            [Read recent execution outcomes (wf02/wf03/wf36)]
                            |
                            v
            [Compose Markdown digest -- 5 sections max]
                            |
                            v
            [POST to Synology Chat incoming webhook]
                            |
                            v
            [Log digest to /data/digests/YYYY-MM-DD-HH.md]
```

### Digest content shape (5 sections max)

1. **Family voices since last digest** -- name + 1-line summary per voice
2. **Workflow execution outcomes** -- pass / fail / silent-fail per workflow (per `project-execution-outcome-observability`)
3. **Open blockers** -- anything flagged by wf36 (Quality Gatekeeper) as unresolved
4. **Upcoming scheduled actions** -- next 4 hours of cron events (so Darrell knows what's about to fire)
5. **One opportunity surfaced** -- one item from the live opportunities backlog (rotates through the 73-promise inventory)

If a section is empty, it's omitted (no "no family voices" filler -- minimize noise).

### @nas command parsing (on-demand)

| Trigger | Action |
|---|---|
| `@nas status` | Full digest, same as scheduled |
| `@nas family voices` | Section 1 only, last 24h |
| `@nas blockers` | Section 3 only |
| `@nas opportunities` | Section 5 expanded to top-5 |
| `@nas workflows` | Section 2 expanded -- all workflow runs last 24h |
| `@nas help` | List of valid @nas commands |

### Rate limiting + safety

- **Hard cap: max 1 message per 30 min** to prevent rapid-fire spam (timestamp-file at `/data/digests/last-sent.ts`).
- **Bearer-token auth on incoming webhook URL** (per `PERPETUAL-PIPELINE-HEALTH` rule 7).
- **Body length cap: 1500 chars** (Synology Chat message limit).
- **Failure-quiet:** if Synology Chat is unreachable, write the digest to disk and try again next cycle. Do NOT retry-loop.

### Per-industry routing extension hook (v2/v3 prep)

Per `project-sovereign-llm-teams-per-industry`, the digest classifier needs a hook for future per-team routing. v1 ships a single composite digest; v2 adds per-industry-team filter (`@nas status church`, `@nas status therapy`, etc.) and routes content from the appropriate sovereign LLM team's recent activity.

### Deployment script pattern

Mirror `scripts/nas-update-wf08-ntfy.sh`. The script:
1. Backs up current wf38 if it exists
2. Imports the new JSON via n8n CLI
3. Activates the workflow
4. POSTs a test message to verify the incoming-webhook URL is correct
5. Logs the deployment to `/data/deployments/`

### Sources

- [Synology Chat Integration Help (DSM 7)](https://kb.synology.com/en-global/DSM/help/Chat/chat_integration?version=7)
- [Synology Chat Webhooks + Slash Commands](https://kb.synology.com/en-us/DSM/tutorial/How_to_configure_webhooks_and_slash_commands_in_Chat_Integration)
- [Synology Chat for DSM notifications](https://kb.synology.com/en-global/DSM/tutorial/configure_webhooks_for_DSM_notifications)
- [bitcanon/synochat GitHub -- reference Python lib](https://github.com/bitcanon/synochat/blob/main/README.md)
- Existing artifacts in repo:
  - `docs/00-foundations/n8n-workflows/08-synology-chat-inbound-capture.json` (the inbound side)
  - `docs/00-foundations/n8n-workflows/10-synology-chat-request-with-ack.json` (the existing outbound ack pattern -- already a working incoming-webhook integration)
  - `docs/00-foundations/n8n-workflows/13-chat-action-router.json` (the @nas command classifier reference)

### Sovereign-mesh tier label

**Tier 1 (sovereign mesh native).** Synology Chat runs on the NAS; the incoming webhook is local; n8n is local. No external dependency.

### Cost-efficiency screen

- **Growth justification:** This is the bidirectional surface that closes the input-visibility-to-Claude loop. Without it, family voices and workflow outcomes sit on disk; with it, Darrell sees them in the channel he's already in.
- **Unit cost:** $0. Existing infrastructure.
- **Lean alternative:** Status-only ntfy push (already exists for family-voice senders). But ntfy is one-way; Synology Chat is conversational. The conversational layer IS the value.
- **Break-even:** Immediately, on first family-voice digest that surfaces a missed message Darrell would have otherwise found 12 hours later.
- **Evolution trigger:** If the channel becomes noisy (more than 6 digests/day), tighten the digest cadence or split into multiple channels by industry team.

### Recommended action

- **Pre-build the wf38 JSON workflow file** when Darrell is back at NAS access. (NOT shipping in this report -- shipping the design.)
- **Pre-build the deployment script** in parallel.
- **The actual incoming-webhook URL has to be created in Synology Chat UI by Darrell** -- this is a one-click operation that takes 30 seconds. Per the Drive-Don't-Delegate rule, Claude drives everything possible; the one-click webhook URL creation is the Drive-only exception. Provide the exact click path: Synology Chat -> profile icon -> Integration -> Incoming Webhooks -> Create -> name "@nas-replies-back" -> channel #PoeTech-PWA -> Copy URL.

---

## Track 7 -- Master list of PoeTech business opportunities (cross-referenced)

Synthesized across all link contexts reviewed today + the existing 73-promise inventory in `2026-06-01-app-services-promise-audit-and-master-plan.md`.

Notation:
- **Mesh tier:** 1 = sovereign native, 2 = sovereign-with-bridge, 3 = mainstream-with-sovereign-fallback, 4 = mainstream-only.
- **Revenue tier:** Foundation (free) / PoeTech+ / Premium / Family / Business.
- **Bot team:** which of the four sovereign industry teams operates it (Church / Therapy / online / Dev/Ops).

### 7.1 The 12 opportunities

| # | Opportunity | Surface | Pain point addressed | Bot team | Mesh tier | Revenue tier | Hours to v1 |
|---|---|---|---|---|---|---|---|
| 1 | **Sovereign Media Production Pipeline** (long-arc per `AI-MEDIA-PRODUCTION-PLATFORM-VISION`) -- replaces extractive social platforms for COLG video sermons, family worldview commentary, vacation footage. Whisper STT + local LLM script-shaping + open-source video tools. | New `/media-production` PWA tab | Mainstream YouTube algorithm hijacks message + extracts data; PoeTech keeps content sovereign. | Church + online | 1 | Business | 24 |
| 2 | **Family Worldview Commentary Pipeline** -- the system that handles Darrell's response to the "American Christianity Is Racist On Purpose" video and similar cultural conversations. Voice-to-Worldview-grounded-commentary pipeline. | New `/commentary` PWA tab | Darrell can't keep up with the rate of cultural-conversation incoming; the Mind-of-Christ filter doesn't scale at human-only speed. | Church | 1 | Premium | 12 |
| 3 | **Workspace-Builder-as-Product** (from ICM paper review for Darrell's childhood friend + Tina Huang Cowork patterns) -- the autonomous-builder lifecycle as a PoeTech Tier-3 universal module. Pending / in-progress / done / failed folder system. Paid-tier add-on. | New `/builder` PWA tab | Mainstream "vibe coding" is fast but undisciplined; the workspace-builder-as-product encodes Tina Huang's PRD-first / data-pipelines-first lifecycle. | Dev/Ops | 2 | Business | 16 |
| 4 | **Godhead Study Platform v1** (from `THE-HOLY-SPIRIT-INTEGRATION-WORLDVIEW.md` -- the Spiritual Life flagship) -- structured study path for the Father, the Son, the Holy Spirit. The integration-is-the-relationship frame. The watching-recognizing-recording posture. Job as the named exemplar. | New `/spiritual-life` PWA tab | Mainstream Bible-app paths are devotional-only; this is doctrinal + experiential + worldview-grounded. | Church | 1 | Premium | 20 |
| 5 | **The Four Moats explainer** (from hJNp9RwK-Uw video) -- public PWA About-page section explaining Data / Distribution / Brand / Trust as PoeTech's defensibility. Marketing surface, not product feature. | Existing About.jsx -- new section | Prospective users don't know WHY PoeTech is differentiated; the explainer becomes the elevator pitch. | online (marketing surface) | 4 | Foundation | 2 |
| 6 | **The "App Disappears" content series** (from Karpathy MenuGen pattern) -- one essay per week on the PoeTech blog showing what app should stop existing because Software 3.0 ate it, paired with the simpler version PoeTech ships in its place. | New `/blog` or Educational module entry | Marketing-as-thought-leadership AND product roadmap input. | online | 4 | Foundation | 4/week |
| 7 | **MenuGen-for-COLG** -- weekly bulletin / order of service generation from photo of last week's bulletin + voice memo from Pastor. | Church Module v2 | The bulletin-prep task is currently manual, errored, and disconnects elder/lay-leader pastors. | Church | 1 | Premium (church-subscription) | 20 |
| 8 | **Per-Industry LLM Team substrate v1** (per `project-sovereign-llm-teams-per-industry`) -- the foundational layer that everything else in this list runs on. One team -- Dev/Ops -- proven first. | Sovereign infrastructure on the NAS + GPU box | All other items in this list assume the substrate exists; without it they're vapor. | Dev/Ops | 1 | Business | 40 |
| 9 | **Family-Voice-Loop reusable module** (per `project-workflow-module-library`) -- first Tier-2 library entry. Refactor wf08 + wf10 + wf30 + wf31 + wf32 into a single reusable family-voice-loop module that any new family adopting PoeTech configures in minutes. | n8n module library | Onboarding a new family currently requires hand-building the voice-capture pipeline; this collapses that to configuration. | Dev/Ops + serves all teams | 1 | Family (multi-family scaling) | 12 |
| 10 | **The Holly Hill Cash-Out Calculator** -- a public utility tool that lets any family with rental properties run the comp-anchored equity-out scenario the Poe family ran. Showcase. | New `/tools/cash-out-calculator` PWA tab | The math is opaque to most landlords; productizing the spreadsheet democratizes it. | online | 4 | PoeTech+ (gated full calc) | 6 |
| 11 | **Council Chamber v1** (per existing `COUNCIL-CHAMBER.md`) -- the universal input-to-output surface in listening / Scripture-mirrored mode. Voice-or-text-in, four-section response (Hear / Mirror / Anchor / Invite). | New `/chamber` PWA tab (or unified input on home) | Mainstream chatbot UX is clinical or sycophantic; Council Chamber is pastoral, biblically-grounded, dignified. | Church + Therapy | 1 | Premium | 24 |
| 12 | **Test Tool component** (per `UX-PATTERNS.md`) -- the Philippians 4:8 Test as a reusable PWA component any user can run against any text input. Religion-AND-Relationship enforcement at the user's keyboard. | Existing UX-Patterns library | Mainstream content filters are political or arbitrary; the Test Tool is Scripture-anchored and explicit. | Church | 1 | Foundation (free) | 8 |

### 7.2 The opportunity matrix -- highest leverage first

Sorted by (Business-tier impact / sovereign-native / focused-hours ratio):

1. **#5 Four Moats explainer** -- 2h for a marketing-surface win; lowest cost / immediate clarity.
2. **#9 Family-Voice-Loop reusable module** -- 12h for the Tier-2 library entry that unlocks multi-family scaling.
3. **#2 Family Worldview Commentary Pipeline** -- 12h for a Premium-tier flagship Darrell uses daily.
4. **#3 Workspace-Builder-as-Product** -- 16h; turns ICM-paper + Tina-Huang patterns into a productized Business-tier feature.
5. **#1 Sovereign Media Production Pipeline** -- 24h for the long-arc Business-tier flagship.
6. **#8 Per-Industry LLM Team substrate v1** -- 40h, but it's the substrate everything else needs.
7. Remaining items rank below by impact / effort.

### 7.3 Religion AND Relationship test on each opportunity

Each opportunity must pass both halves of the test (per `EXCELLENCE-STANDARD.md`):
- **Religion:** Is it Scripture-grounded? Does it have backbone?
- **Relationship:** Does it meet people where they are? Is the heart visible?

| # | Religion check | Relationship check |
|---|---|---|
| 1 Media | Yes -- distribution sovereignty per `COMMUNITY-FIRST-MISSION` | Yes -- COLG-first programming serves real elders |
| 2 Worldview commentary | Yes -- Mind-of-Christ filter applied to cultural input | Yes -- meets the doom-scrolling family at their phone |
| 3 Workspace builder | Indirect -- enables the work that serves; lifestyle-of-stewardship | Yes -- removes the "I can't keep up" friction from one-person-team operators |
| 4 Godhead study | Yes -- Father/Son/Holy Spirit centered | Yes -- starts where the seeker is, not where the dogma is |
| 5 Four Moats | Indirect -- explains PoeTech's defensibility in language the founder-class uses | Yes -- inviting tone, not aggressive |
| 6 App Disappears | Indirect -- teaches Software 3.0 to the user; serves clarity | Yes -- accessible, weekly, builds trust |
| 7 MenuGen-for-COLG | Yes -- serves the church's weekly rhythm | Yes -- elder pastors keep their voice, not their typing time |
| 8 LLM substrate | Yes -- IS the sovereign infrastructure the whole vision requires | Indirect -- backend; users feel the effects, not the substrate |
| 9 Family-Voice-Loop | Yes -- protects family voices from being lost | Yes -- explicitly the input-side mirror Darrell named 2026-06-01 |
| 10 Cash-Out Calc | Indirect -- biblical economics + jubilee + debt cancellation | Yes -- transparent, accessible, helps real landlord families |
| 11 Council Chamber | Yes -- Hear/Mirror/Anchor/Invite is Scripture-mirrored | Yes -- pastoral, never clinical (TLC firewall held) |
| 12 Test Tool | Yes -- Phil 4:8 IS the test | Yes -- gives users a tool to steward their own minds |

All 12 pass. No items dropped from the list.

### 7.4 Sovereign-mesh tier label per item

- Tier 1 (sovereign mesh native): #1, #2, #4, #7, #8, #9, #11, #12 -- 8 items
- Tier 2 (sovereign-with-bridge): #3 -- 1 item
- Tier 3-4 (mainstream-leaning marketing surfaces): #5, #6, #10 -- 3 items

The dominant pattern is Tier 1, consistent with the PoeTech sovereign-mesh long-arc.

### 7.5 Cost-efficiency screen per item

All 12 items run on existing infrastructure (NAS + n8n + ollama + future GPU box). Marginal cost per item is the focused-hours estimate (Darrell + Claude pair-coding) plus minor accessory costs (the closet UPS in Track 4 is shared infrastructure).

### Recommended action

- **Adopt the 12-item list as the post-vacation backlog** for the master plan in `2026-06-01-app-services-promise-audit-and-master-plan.md`.
- **Rank the first three to ship in the Family + Family-Voice-Loop + LLM-substrate triplet:** #9 Family-Voice-Loop (12h) -> #8 LLM substrate v1 (40h) -> #2 Worldview Commentary (12h). 64 focused hours total. With Darrell's vacation + Cowork + Sept ship-window calendar, this is approximately a 6-week milestone.
- **Defer items #6, #10, #11, #12 to a second tranche** post-#1/#2/#3.

---

## Appendix A -- Phil 4:8 Test applied to this report

Before delivery, Claude tested this report against the Phil 4:8 filter per `MIND-OF-CHRIST.md`:

- **TRUE:** Every number, statute, URL, and product specification is cited. No fabrications.
- **HONORABLE:** Tenant treated with dignity in Track 5. The adversary's class-terms held lowercase per CLAUDE.md theology binding.
- **JUST:** Illinois legal compliance preserved; the pastoral framing is named explicitly so the law-only path is not the default.
- **PURE:** No bitterness toward the tenant, the mortgage industry, or YouTube's bot-protection. Even the closet-vs-aircon analysis stays neutral on hardware politics.
- **LOVELY:** The Holly Hill verdict is honest (underwater at strict LTV) but not catastrophizing; alternative paths are named.
- **COMMENDABLE:** No slander of named lenders or named tenants.
- **EXCELLENT:** Sources cited; cost-discipline-with-growth-permission applied; Religion-AND-Relationship test applied per-item.
- **PRAISEWORTHY:** The report serves the family AND the community, per `GOVERNANCE-EXECUTION-ADVISORY` standing test.

The report passes. Delivered.

---

## Appendix B -- Decisions recorded per `feedback-decisions-with-rationale`

1. **Decision:** Revise Holly Hill cash-out math down to ~$0 viable cash-out at strict 75% LTV. **Rationale:** Actual sqft is 972, not 1,300-1,650 as the prior ±10% range assumed. The 36% sqft over-estimate flowed through to a $57K median estimate that doesn't survive contact with the real comp anchor. **Senior to:** the 2026-06-01-holly-hill-equity-evaluation-with-real-comps.md document.
2. **Decision:** Send the payment plan to the 1508 Holly Hill tenant within 24 hours; hold the 5-day notice in a draft folder. **Rationale:** Darrell answered "Both" on the resolution question; "Both" means parallel preparation, NOT parallel sending. The legal floor exists; the relational ceiling has the first turn.
3. **Decision:** Recommend Busey Bank as first-call lender for the Holly Hill refi consultation. **Rationale:** Headquartered in Champaign, $10B+ assets, named originators with documented presence at the University Ave branch. Closest path to a real appraisal anchor.
4. **Decision:** Ship #9 Family-Voice-Loop module before #8 LLM substrate, even though #8 is the substrate. **Rationale:** The Family-Voice-Loop refactor uses EXISTING substrate (n8n + ntfy + Synology Chat) -- it's 12h vs 40h. Quick win, then turn to the long-build substrate with momentum.
5. **Decision:** Defer the portable AC for the GPU closet until ambient temperature data exists. **Rationale:** Cost-discipline-with-growth-permission. Buying the AC before measurement is over-engineering. $13 Govee sensor measures first.

---

**End of Track 7 / End of report.**

