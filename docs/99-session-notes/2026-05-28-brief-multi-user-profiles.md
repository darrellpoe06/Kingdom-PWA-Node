# Brief — Multi-user / per-device profiles

**Why this exists:** Right now anyone with the kingdom-pwa-node.vercel.app URL sees Darrell's full ledger. That blocks family adoption. Christina (TLC business + personal) and Christiana (UIUC student budget) can't realistically use the app until they have their own views over the same backend.

**Constraints that bind the design:**

1. **TLC firewall** (CLAUDE.md, binding): Christina's clinical / counseling data NEVER leaves the NAS and is NEVER exposed to other profiles. This is the most important rule; it overrides UX convenience.
2. **Family privacy** (CLAUDE.md, binding): kids' data, intimate family conversation, clinical data are never routed through external services.
3. **Sovereignty**: no SaaS auth provider. Authentication if any happens on the NAS.
4. **Mobile-first**: the gate has to be tappable on a phone, no typing if possible.

## Recommended design

Two-layer profile system:

**Layer A — Visibility gate in the PWA (ship first).** Every entity in the data model gets a new `visibleTo` array. The launch screen shows a profile picker (Darrell / Christina / Christiana / Family); the chosen profile sets `currentProfile`. Every view that respects `entityFilter` also respects `visibleTo`, hiding entities the current profile isn't in.

Default `visibleTo` assignments:
- Personal household entity: `['darrell', 'christina']`
- Poe Properties: `['darrell']`
- PoeTech: `['darrell']`
- TLC: `['christina']` ← never visible to others, period
- Christiana student budget (new entity): `['christiana', 'darrell']`

This is enforced client-side, so it's UX-level privacy, not security. Good enough for the "Christina doesn't see PoeTech, Christiana doesn't see TLC" scenario.

**Layer B — Workflow 18 session token (ship second, real security).** PWA on launch shows a 4-digit PIN entry under the profile picker. PIN is sent to a new n8n workflow 21 (`/webhook/login`) which returns a signed session token. Token is stored in `sessionStorage` (not localStorage) and sent in `Authorization: Bearer` header to workflow 18. Workflow 18 validates the token, finds the user's profile, filters `bank_balances` and `transactions` to only the institutions tied to that profile.

This is the actual security layer. Without it, the visibility gate is just UX. With it, even if someone bypasses the PWA and hits the Funnel URL directly, they can't see other profiles' data.

**Layer C — TLC data lives in a separate workflow (ship if Christina uses the app).** TLC clinical data is NOT in `/data/finance-events/`. It's in its own folder `/data/tlc-events/` reached only by workflow 22 (`/webhook/tlc-data`) which requires christina's session token AND a separate "TLC mode" flag. The PWA's TLC view is a separate booksView (e.g. `booksView === 'tlc'`) that only renders for Christina. This guarantees that even a bug in Layer A or B can't leak TLC data into Darrell's view — the data is literally not in the response Darrell's session asks for.

## Implementation order

1. **Add `visibleTo` to entities in SEED_DATA + the data model.** Add a migration in the storage-load useEffect so existing devices don't break.
2. **Add `currentProfile` state in `PoeFinancialSystem`.** Default to `'darrell'` for migration safety; existing devices stay as-is.
3. **Profile picker on launch.** Big-button tap targets (Darrell / Christina / Christiana / Family). Stored in localStorage so it doesn't ask every time. "Switch profile" available in the header menu.
4. **Filter logic:** every place that filters by entity (entityRollups, totals, BigPictureDashboard, BooksAccounts, BooksTransactions, etc.) adds `.filter(e => e.visibleTo.includes(currentProfile))` to its entity set.
5. **Workflow 21 — login + token.** Optional for shipping Layer A; required for Layer B.
6. **Workflow 18 — token check.** Adds an `Authorization` header check; without it, workflow returns only entities marked visibleTo:'public'.
7. **Workflow 22 + TLC view.** Only built if/when Christina opts in.

## Files to touch

- `app/src/poe-financial-mvp-v28.jsx` — profile picker, currentProfile state, filter logic everywhere.
- `app/src/seedData.js` (or wherever SEED_DATA lives) — add `visibleTo` to each entity.
- `docs/00-foundations/n8n-workflows/21-login-token.json` — new.
- `docs/00-foundations/n8n-workflows/18-imported-transactions-api.json` — add token validation.
- `docs/00-foundations/n8n-workflows/22-tlc-data-api.json` — new, only if Layer C is built.

## Estimated effort

- Layer A only (visibility gate, no auth): half-day. Ships actual usable family separation today.
- Layer A + B (gate + sovereign auth): 1.5-2 days. Ships actual security.
- Layer A + B + C (full): 2-3 days. Ships TLC integration.

## Open questions for Darrell

- Christina's PIN preference (4-digit, full word, or none — just a profile pick)?
- Should the kids ever see "Family" rollup (no per-entity breakdown, just total) for the home-budget conversation?
- Does Christiana's profile cover only HER spending or also the parental allowance flowing from your accounts?
