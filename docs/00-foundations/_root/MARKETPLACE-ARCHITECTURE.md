# Marketplace Architecture -- Sovereign Sell / Manage / Grow

> *"The rich rules over the poor, and the borrower is the slave of the lender."* -- Proverbs 22:7 (ESV)

> *"For what does it profit a man to gain the whole world and forfeit his soul?"* -- Mark 8:36 (ESV)

**Layer 3 reference document (ICM).** Skeleton binding for the PoeTech marketplace. Specializes `BODY-OF-CHRIST-ECONOMIC-STEWARDSHIP.md` (the economic-powerhouse mission) and is governed by `DATA-AS-EMPOWERMENT-NOT-EXTRACTION.md`, read through the worldview spine and `CLAUDE.md`. Research basis: `docs/99-session-notes/2026-06-03-research-review-marketplace-conversational-space-youtube-1jByzKI.md`. **Status: skeleton -- binding direction + architecture + phasing; implementation is post-vacation, multi-week.**

---

## 1. The binding direction (Darrell, 2026-06-03, verbatim)

> "research the ability to add the internet functionality like square or is it better to integrate with a vendor. We want to sell manage and grow in the PoeTech App on cellphone or laptop syncing data to a database for the benefit of the user's all the way up to the families and businesses. We want the dropshipping process however we add any vendors we want based on what and who does the best and whenever they change we want the ability to keep records and we can change the vendors to reflect our new found reality also consistently looking for better vendors in our spaces."

The decision the direction forces: **own the spine, treat every vendor as swappable, keep an audit trail of every swap.** This is neither "be Square" nor "marry one vendor."

---

## 2. The decision -- build sovereign

**RECOMMENDATION: MedusaJS v2 backend on the Synology NAS (Docker) + React/PWA storefront on Vercel + Stripe Connect + a custom vendor-abstraction-layer module + an append-only `vendor_change_log` audit table + n8n for vendor scoring / swaps / digests.**

Three paths were compared (full analysis in the research-review):

| Path | Verdict |
|---|---|
| Square (turnkey SaaS) | Payments-only rail; data on Square's infra (contractual sovereignty only); free-tier online rate raised to 3.3%+30c Jan 2026; no native dropshipping. Adds nothing over Stripe toward sovereignty. |
| Shopify / BigCommerce / WooCommerce | Shopify/BigCommerce fail structural sovereignty (data on their box; Shopify *surcharges* using your own gateway; BigCommerce GMV caps). WooCommerce is sovereign but PHP/WordPress -- wrong stack. |
| **Sovereign Medusa v2** | **Chosen.** MIT license, Node/Postgres/Redis stack fit, native multi-vendor module, native seams for the swap-with-audit requirement. |

**The honest caveat:** the Medusa backend cannot run on Vercel (persistent Node server, not serverless) -- it runs as an always-on Docker container on the NAS, which the NAS already provides. Vercel hosts the storefront; the PWA reaches Medusa over a same-origin rewrite (parallel to the existing `/n8n` rewrite, per `project_n8n_same_origin_rewrite`).

---

## 3. Architecture

```
[ PWA storefront (React, Vercel) ]
        | same-origin /commerce rewrite
        v
[ Medusa v2 backend (Docker, NAS) ] --- [ Postgres (NAS): products, orders, customers, vendors, vendor_change_log, vendor_performance ]
        |                              --- [ Redis (NAS): v2 workflow engine, cache, event bus ]
        |--- Stripe Connect (Tier 3 payment rail; hosted fields, card data never on NAS)
        |--- Vendor Abstraction Layer --> [ CJAdapter | AliExpressAdapter | AutoDSAdapter | ... ] (Tier 3, swappable)
        |--- event bus --> [ n8n (NAS): vendor scoring, swap automation, audit-log writes, family-voice digests ]
```

### 3.1 The vendor abstraction layer (the heart of the direction)

The Adapter Pattern -- normalize every supplier API into one internal interface so vendors are configuration, not code dependency. Named benefit in the literature: *reliability through seamless provider switching*.

1. **`VendorAdapter` interface** -- every supplier satisfies `searchProducts`, `getInventory`, `placeOrder`, `getTracking`, `getPricing`.
2. **One adapter per supplier** (CJ Dropshipping, AliExpress, AutoDS...), each translating that supplier's quirks into the common interface.
3. **Vendor registry** (Postgres) -- maps each product/SKU to its current active vendor(s). Swap = update the registry, no code change.
4. **Append-only `vendor_change_log`** -- `(product_id, old_vendor, new_vendor, reason, performance_snapshot, actor, timestamp)`. Append-only + on PoeTech's own Postgres = sovereign, tamper-evident. **This is "keep records ... change the vendors to reflect our new found reality."**
5. **`vendor_performance`** -- fed by order outcomes (fulfillment time, defect/return rate, stock-out rate, margin). n8n scores on a schedule and auto-flags underperformers ("consistently looking for better vendors").
6. **Event-bus hooks** -- a swap emits an event; n8n turns it into a digest + notification.

---

## 4. Sovereign-mesh tier labels

(Working interpretation -- the canonical tier model lives in the `project-sovereign-mesh-mvp-pragmatism` agent-workspace memory: Tier 1 fully-sovereign-on-NAS; Tier 2 hybrid-sovereign NAS+cloud-API-with-redaction; Tier 3 vetted-external-vendor; Tier 4 full-external-SaaS data-leaves.)

- **Commerce engine + all product/order/customer/vendor data + audit log: Tier 1** (fully sovereign on the NAS Postgres).
- **Payment rail (Stripe Connect): Tier 3** (vetted external, unavoidable; card data never on the NAS via hosted fields).
- **Dropshipping supplier APIs: Tier 3** (vetted external, swappable; the abstraction layer + audit log keep PoeTech sovereign over *which* vendor and the record).
- **Nothing is Tier 4.**

---

## 5. Cost posture

Per `project-cost-discipline-with-growth-permission`: near-free at MVP (NAS infra is sunk cost); at scale the sovereign build pays *only* the Stripe processor rate -- no platform subscription, no GMV cap, no third-party-gateway surcharge. The trade is engineering time (growth-justified), not recurring rent. (Illustrative cost table in the research-review.)

---

## 6. Lean MVP sequencing (do NOT build everything before the first sale)

| Phase | Ships | Notes |
|---|---|---|
| **Phase 0 (NOW)** | This binding doc. No code. | $0 |
| **Phase 1** | Medusa v2 + Postgres + Redis in Docker on the NAS; Stripe Connect wired; minimal React storefront on Vercel; ONE first product line (see Open Question 1). | ~2-4 weeks; validates demand |
| **Phase 2** | Vendor abstraction layer: `VendorAdapter` interface + 2-3 supplier adapters; vendor registry; append-only audit log. | ~3-6 weeks |
| **Phase 3** | `vendor_performance` scoring + n8n auto-flag + swap digests + family-voice notifications. | event-bus + n8n |
| **Phase 4** | Manage/grow surfaces: inventory, fulfillment tracking, the family/business roll-up ("all the way up to the families and businesses"). | |

---

## 7. The five-test gate (every marketplace decision)

1. **Father's Business** -- serves the soul-first order (Mark 8:36; 3 John 1:2); lifts families out of borrower-as-slave (Prov 22:7) so they are freer to follow The Way. Not a revenue engine.
2. **Phil 4:8 Test** -- true, honorable, just (vendors on merit, auditable), excellent.
3. **Religion AND Relationship** -- backbone (audit trail, merit scoring) + warmth (family-benefit framing).
4. **Data-as-empowerment** -- user activity sovereign, never sold to vendors, no engagement-optimization. Per `feedback-distinguish-data-from-brand`: purchase history is the user's *data*; the PoeTech brand stays.
5. **Cost discipline with growth permission** -- lean MVP, unit-cost-efficient at scale.

**Dust-off-feet (Matthew 10:14):** a vendor or payment partner that rejects the sovereignty boundary or attaches predatory/data-sale terms is declined cleanly. The abstraction layer makes this cheap -- a rejected vendor is one adapter never written.

---

## 8. Open questions (governance -- Darrell)

1. **First product line** -- physical dropshipped goods, the family's own offerings, partner-church merchandise, or sovereignty hardware (dovetails with the aligned-brand-sponsor roster)? Most shapes the build sequence.
2. **Vendor scorecard weights** -- fulfillment speed vs defect rate vs margin vs ethical/values sourcing (paralleling the aligned-brand 8-criterion vetting)?

---

## 9. Cross-references

`BODY-OF-CHRIST-ECONOMIC-STEWARDSHIP.md`, `DATA-AS-EMPOWERMENT-NOT-EXTRACTION.md`, `AI-FOUNDATION-INTERNAL-OPERATIONS.md`, `GOVERNANCE-EXECUTION-ADVISORY.md`, `PERPETUAL-PIPELINE-HEALTH.md`, `QUALITY-OF-LIFE-AS-NORTH-STAR.md`, `CONVERSATIONAL-SPACE-ARCHITECTURE.md`. Research: `docs/99-session-notes/2026-06-03-research-review-marketplace-conversational-space-youtube-1jByzKI.md`. Memory: `project-sovereign-mesh-mvp-pragmatism`, `project-cost-discipline-with-growth-permission`, `feedback-distinguish-data-from-brand`, `project_n8n_same_origin_rewrite`.

---

*Skeleton. Sell, manage, grow -- on a sovereign spine, with every vendor swappable and every swap recorded. The economic powerhouse with the soul-first order held. We all win. We create.*
