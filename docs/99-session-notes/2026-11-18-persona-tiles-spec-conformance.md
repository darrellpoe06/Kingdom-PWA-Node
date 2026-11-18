# Persona picker tiles: what they promise vs. what runs (2026-11-18)

Darrell asked whether the "Which life is closest to yours?" tiles still work, or will. This is the DR-0219 review: what the tiles say (SHOULD), what the code does (ARE), the gaps, and how each gap closes.

**SHOULD.** `app/src/lib/demo-data.js:701` (`DEMO_PERSONA_META`) and the picker at `app/src/poe-financial-mvp-v28.jsx` (~line 3590).
**ARE.** Code traced claim by claim (file:line below). The render fix is proven by `app/src/__tests__/demo-seed-choice.test.js`, which was shown to fail against the old code.

## Fixed in this PR

1. **On poetech.us every tile showed the family-of-4 household.** The 2026-06-03 public-host security guard ran before the demo branch in the boot `useState`, so `?demo=landlord`, `?demo=separated` and the rest all booted the Reeves family-of-4 under a different label.
   - **Fix:** `lib/demo-seed-choice.js` lets the persona the visitor chose win. A public or reviewer boot still never gets SEED_DATA.
   - **Why it is safe:** the new test proves no persona passes through more SEED_DATA than family-of-4 already does.
   - **Proven to catch:** with the old ordering, 9 tests fail.
2. **One line of copy was false.** "The shipped tiles run on real data right now" is now "The working samples run the real system on sample numbers. Tap one, nothing saves."

## Did not exist before

No test tied a tile's promise to its data, and no CI browser job loads any `?demo=` key. The only probe that does (`scripts/money-live-probe.mjs`) loads family-of-4 only, and runs only when started by hand.

## Claim ledger (open gaps)

Every row is a gap: one bullet per tile. "Real user" means a signed-in person with their own data.

- **Singles:** "Every subscription on the screen" is **MISSING in the sample**: `subscriptions: []`, and there are no subscription transactions. The feature exists. Close by seeding subscriptions in the family-of-1 dataset.
- **Couples:**
  - "Who-paid-what is a number" is **MISSING**. Nothing computes per-partner contributions or settle-ups. Close by building a per-person contribution and settle-up view on `inflows.salaries.who` plus who paid each transaction.
  - The house-fund goal is **PARTIAL**. Goals work for real users (`goals-sync`), but the sample seeds no goal. Close by seeding a demo goal.
- **Families of 5+:**
  - "Every kid's costs visible" is **MISSING**. There is no per-kid cost view anywhere. Close by building per-person cost tags and a per-kid rollup.
  - "529s for three" is **PARTIAL**: it is one pooled account. Close by splitting the account into three in the dataset.
- **Your family:** "On every screen... what, when, why, how" is **PARTIAL**. The four-question `ClarityLine` is on Forecast only (`components/Forecast.jsx:164`). Close by putting ClarityLine on Money, Books and Coming Up.
- **Co-parents apart:**
  - "Exchange timestamp is in the log" is **MISSING**. There is no custody or exchange log. Close by building an exchange log (append-only, timestamped, per shared-child entity).
  - "Rolls up costs both sides agreed to split" is **PARTIAL**. There is no split model (no %, no per-parent share, no agreed flag). Close with a split model on obligations and transactions.
  - "Receipt's right there" is **PARTIAL**. Receipts work for real users (`BooksTransactions.jsx`), but the sample has none. Close by seeding receipts.
  - "Each household sees its own books" is **PARTIAL**: the sample shows every entity to everyone. This waits on cross-household sync, which the tile's own vision note says is next.
- **Solo practice owners:** this tile is **roadmap per our own code**: `lib/matched-services.js:40-45` targets Q2 2028.
  - "Owner draw clean" is **PARTIAL**: there is no owner-draw classification.
  - "Quarterly tax set aside" is **PARTIAL**: it accrues only when an amount is entered, and the sample's amount is $0.
  - "CEUs and license renewals on the calendar" is **PARTIAL**: the CEU tracker lives in the TLC office only and saves locally.
  - "Books match what the IRS thinks" is **MISSING**: there is no ledger-to-return reconciliation.
- **Landlords:** this tile is **roadmap per our own code**: `lib/matched-services.js:47-56` targets Q3 2028.
  - "Late tenants flagged on the 1st" is **PARTIAL**: late is set by hand, nothing detects it on the 1st.
  - "Capex reserve auto-funded" is **MISSING**.
  - "Per-property cash flow" is **PARTIAL**: there is no net figure per property.
  - "Mortgage timing protected" is **PARTIAL**: the dates are placed, but there is no rent-before-mortgage alert.
  - Separately, the tenant portal, leases and work orders **work for real users** but are absent from the sample.

## Disposition

- **Data-only gaps** (seed subscriptions, the goal, receipts, three 529s): can be built now; next PR.
- **Feature gaps** (who-paid-what, per-kid rollup, exchange log, split model, ClarityLine everywhere, late-on-the-1st detection, capex auto-fund): real builds, queued in the order above. `re-review: 2026-12-02`.
- **Copy vs. roadmap conflict** (the landlord and solo-practice tiles sell as live what `matched-services.js` dates to 2028): this needs Darrell's decision. Either move those claims into each tile's `vision` line, or pull the module build forward. `re-review: 2026-11-25`.
