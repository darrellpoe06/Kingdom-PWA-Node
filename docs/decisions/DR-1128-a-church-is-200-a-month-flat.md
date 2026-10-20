# DR-1128: A church is $200 a month, flat — free only where we do no work

**Date:** 2026-10-20
**Status:** accepted
**Tier:** C (a real-money price, decided by the Governor)
**Type:** decision
**Area:**
- `docs/99-session-notes/2026-10-16-research-review-pushpay-the-bishops-app-how-we-measure-up-and-compete.md` (§7's $79 default, superseded by this record)
- `docs/00-foundations/_root/COMMUNITY-FIRST-MISSION.md` (Commitment 5: this fills in the Supported tier's number)
- Not yet changed: `app/src/components/About.jsx` and the landing price strip in `app/src/poe-financial-mvp-v28.jsx`. Publishing the price on the front door waits on the reconciliation below.

**Grounds:** Darrell, 2026-10-20: **"We want to be competitive and have a good price for make sure we can sustain... and grow... so $200 a church doesn't seem to be unreasonable... and then we have more options..."** Then: **"Free if we didn't do any work... however the church has been asking for flexibility and want explicit workflows... we need money for time and a way to sustain their needs as users..."**
**Principles:** COMMUNITY-FIRST-MISSION Commitment 5 (self-host free, Supported flat with no per-seat scaling, Partnership rebated; no lock-in); DR-0100 (state the arithmetic plainly); DR-1066 (a church is added by a form); DR-1073 (the office issues the annual statement)

## Context

The 2026-10-16 Pushpay review set a default of $79 a month for a church and left the number to Darrell. He has set it at $200, so that the work can sustain itself and grow, with more options above it.

## What was measured

| | |
|---|---|
| What PoeTech pays each month (2026-10-16 addendum) | **$308.11**, measured; the AI subscription is $273.12 of it |
| Churches needed to cover that | **2** at $200 (1.54 exactly) |
| The Bishop's Pushpay platform fee | about $200 a month, plus processing on every gift, on a multi-year auto-renewing contract |
| Processing, as published (2026-10-20) | Pushpay about 2.1–2.9% + $0.20–$0.30, by volume. A church's own Stripe nonprofit account: 2.2% + $0.30. PoeTech takes 0% |
| Promises already on the front door (`About.jsx`) | "Church tab — always free for everyone" (Foundation, :227); "Small churches & ministries … Community Partner tier free" (:422); `community-partner` maps to full features for mission-aligned 501(c)(3)s (`tiers.js`) |

## Decision

1. **The Supported tier for a church is $200 a month, flat.** It is the same price for 50 members or 2,000. There is no contract, the church can cancel any month, and its data can be exported at any time. PoeTech takes no share of what the church receives, and gifts move through the church's own channels and its own processor account.
2. **What $200 includes is everything a church already runs on:**
   - the giving book and annual contribution statements;
   - Order of Service and the team views;
   - the 23 ministries, including Bus / Van;
   - Team Docs and records;
   - the Living Lessons catalog for every age;
   - a hosted, backed-up instance.
3. **Free only where PoeTech does no work. Work is paid, because time is the cost.**
   - **Still free, because they ask nothing of us:** members' Church tab (Foundation), self-hosting (Commitment 5), and the published catalog exactly as it is.
   - **Paid, because each one is PoeTech's time:** running a church's instance, its support, and every workflow a church asks for. That covers the flexibility and the explicit workflows the church has been asking for.
   - **A church that cannot pay** is served through the Community Partner tier only when a sponsor pays for the time, as `About.jsx:422` and the Community tier describe (funded by aligned-brand partners). Free to the church never means unpaid work.
4. **A church's workflow request is written down, scoped and priced before any work starts.** It names what the workflow does, who uses it and the date it ships, at a fixed price agreed up front, never an open-ended "whatever it takes". When it ships, it joins the $200 base for every church, so each church's request funds what the others inherit.
5. **"More options" sit above the base and never inside it.** Each is a fixed, written amount:
   - the minister's own lessons brought into the church's space;
   - cameras, offered only once they are proven on PoeTech's own cameras;
   - a feature built for one church. It costs a fixed add-on until the day it ships, and then it joins the $200 base for every church.
6. **Front-door publication waits for one yes.** Putting $200 on the public pricing pages, and rewording `About.jsx:422` so a small church sees both "free if you need it" and "$200 if you want it run", is a front-door change (RELEASE-TIERS). It is built and held, not merged unseen.

## Impact

Two paying churches cover every measured cost, and each one after that funds growth. The work churches ask for is paid for as it is done, so the time spent on one church's workflow is never taken from another's. Against Pushpay, the headline price is the same and the terms are better:
- no contract;
- 0% to PoeTech;
- cash, checks, Zelle and Cash App counted in the same book;
- the church owns its records and its processor account;
- ministry tools Pushpay does not carry.

The card-fee saving depends on volume. At Pushpay's highest-volume rate (about 2.1%), it is close to a nonprofit Stripe rate, so the case is made on terms and tools, never on fees alone.

## Verification

- The arithmetic above is from the 2026-10-16 measured cost table and the published rates cited in the Pushpay review and the 2026-10-20 competitor scan.
- Nothing in the app's gating changes: `tiers.js` is a per-person ladder, and the church price is a contract with a church, not a tier key.
- **re-review:** 2026-11-20, with the first paying church, or sooner if a church declines on price. Record which, and why.
