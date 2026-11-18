# 2026-11-18 — Every door at once (DR-1530)

**Asked:** one list of every property with the latest of everything (work orders, messages), sortable by KPIs, instead of opening each door.

**What changed and why**

| File | Change |
|---|---|
| `app/src/modules/properties/portfolio.js` (new) | Pure roll-up: tenancy→door mapping (slug or id), per-door summary, attention score, six sorts, totals, all-open-work list, mixed latest feed, `agoLabel`. |
| `app/src/modules/properties/portfolio-cloud.js` (new) | `loadPortfolioPulse()` (kept out of `cloud.js`, which is at its file-budget ceiling): every work order + newest 1,000 messages + newest 1,000 payments under RLS; failing parts named in `unreadable`. |
| `app/src/modules/properties/PortfolioTab.jsx` (new) | The Overview: KPIs, By door / Open work / Latest, sort pills, "only doors with something open", bounded read (12 s), honest loading/failed/partial states; taps open the door on Work board / Messages / Rent. |
| `app/src/modules/properties/model.js` | `TAB('overview', 'Overview', …)` first on `MANAGER_TABS` (landlord + manager face). Landing tab unchanged (Doors). |
| `app/src/modules/properties/PropertiesApp.jsx` | One import + one `case 'overview'` line (budget 2682 → 2684, raise recorded in `scripts/file-budgets.json`); `strict` in the owner's preview so a cut face never sees another door's record. |
| `app/src/__tests__/every-door-at-once.test.jsx` (new) | 11 tests, including proven-to-catch on the untied row and the failed read. |
| `app/src/__tests__/every-poe-properties-page-is-reportable.test.jsx` | Surface tripwire 27→28, feedback group 28→29. |

**CI catches fixed:** the AI usage ledger line (DR-1347), the INDEX row length (≤700), the file budgets for `cloud.js` and `PropertiesApp.jsx`.

**Gates run here:** targeted tests 49/49; ESLint `--max-warnings 0` clean; legibility guard PASS after swapping `#8A5A00` (2.95:1 on night) for the themed `#8A6510`.

**Not verified here:** the live Poe Properties App with real doors (the sandbox cannot reach poetech.us). `re-review: 2026-11-25`.
