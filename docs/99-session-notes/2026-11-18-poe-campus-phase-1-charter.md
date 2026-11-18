# The Poe Campus, Phase 1: hybrid charter, WBS and the money facts checked (2026-11-18)

Darrell brought a PMBOK hybrid project charter and WBS for Phase 1 of the Poe Campus and asked whether reorganizing the project areas around it makes sense. It does. On 2026-11-18 the repo held nothing about the Poe Campus: no board, no document, no data. This note is the record of the project. Its live view is the **Projects → Boards → "The Poe Campus — Phase 1"** board (`board-poe-campus` in `app/src/lib/board.js`), set up at kickoff per DR-0113.

## The charter, as brought

- **Scope:** 40 smart apartments in Champaign, IL, plus:
  - a ground-floor AI Education and Business Development Hub;
  - a podcast and social-media studio;
  - a 24/7 camera and LED safety grid;
  - a solar, battery and EV microgrid.
- **Sponsors:**
  - Poe Properties Management LLC owns the assets and the construction.
  - PoeTech Operating & Governance LLC runs the technology, microgrid and governance.
  - TLC Therapy Solutions is the Phase 2 clinical anchor.
- **The governing rule:** no construction contract is signed until the internal financial gauges reach **Gate 3**:
  - Gate 1 is the family liquidity fortress.
  - Gate 2 is the pre-development pool.
  - Gate 3 is the release.
- **The two tracks:**
  - **Track A** (predictive): governance, land, engineering and construction.
  - **Track B** (agile): app sprints, hardware prototypes and community polling.

## Two money facts that were out of date (checked 2026-11-18)

1. **The solar credit (48E).**
   - **What changed:** after the 2025 law, the begin-construction window for solar closed on 2026-07-04. Solar not yet under construction qualifies only if it is placed in service by **2027-12-31**.
   - **What the charter planned:** to commission the 250 kW array before that date.
   - **Why that can't hold:** the array sits on a building that waits on Gate 3, a parcel and permits. Chasing the date would mean building before Gate 3, which breaks the charter's own rule.
   - **Decision:** the project is modeled with **no 48E credit for solar**.
   - **The exception:** **energy storage is carved out** of the 2027 deadline (48E(e)(4)(C); IRS Notice 2025-42). The 300 kWh battery remains credit-eligible; confirm with the tax advisor.
   - Sources: [IRS Notice 2025-42](https://www.eitc.irs.gov/pub/irs-drop/n-25-42.pdf), [Plante Moran](https://plantemoran.com/explore-our-thinking/insight/2025/07/timing-energy-tax-credits-after-the-one-big-beautiful-bill), [SEIA](https://seia.org/wp-content/uploads/2025/07/OBBB-fact-sheet_july-2025.pdf).
2. **The EV charger credit (30C)** ended for property placed in service after **2026-06-30**. The 20 EV ports carry no federal credit. Illinois and Ameren incentives are an open research item (`pc-ev-credit`).
   - Sources: [IRS OBBB FAQs](https://www.irs.gov/newsroom/faqs-for-modification-of-sections-25c-25d-25e-30c-30d-45l-45w-and-179d-under-public-law-119-21-139-stat-72-july-4-2025-commonly-known-as-the-one-big-beautiful-bill-act-obbb), [Form 8911 instructions](https://www.irs.gov/node/41121).

## Smaller points, each routed to its professional

- **Provisional patent:** generally filed before any public disclosure of the engine. Timing is confirmed with the patent attorney (`pc-patent`).
- **HIPAA:** it binds TLC's clinic as a health provider. The building's own protection is the charter's rule of no cameras inside units or clinical space (`pc-safety`).

## How the board is ordered, and why

- **Sprint 1 comes first** because it builds the gate:
  - the Capital Readiness Gauge, which reads real balances and never a typed number;
  - the Parcel Scorecard;
  - the community demand poll.
  - These are software in the app, so no money moves.
- **The Gate 1–3 thresholds** (`pc-gate-values`) are values only Darrell holds. Until they are entered, the gauge shows "threshold not set".
- **Track A items are `blocked`.** Their dates are the next Gate 3 check (re-review), not construction commitments. This is the charter's own rule made visible.
- **Track B's later sprints** follow Sprint 1. Sprint 3 needs real hardware and a real building.

`re-review: 2027-01-31`: pro forma re-modeled without the solar credit (`pc-solar-credit`), EV incentive research (`pc-ev-credit`), and Sprint 1 status.
