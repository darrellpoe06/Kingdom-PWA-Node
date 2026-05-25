# Session Handoff — 2026-05-24

> Tonight's session, end-of-day. Picks up exactly where this session ends so the next session (whether in Cowork, Dispatch, or any fresh Claude window) can continue without context loss. Read this first in the next session, then read the relevant memory files in `C:\Users\dpoe\AppData\Roaming\Claude\local-agent-mode-sessions\fbc038c6-aa86-4614-805f-5cb564c7c603\c3bc5726-cc11-46b8-ae30-46ea74edec89\spaces\ef0c5478-11db-49da-9beb-bc7066500b03\memory\` (the `MEMORY.md` index lists them).

---

## Headline

**13 commits shipped this session.** Branch `docs/foundations-and-framework-2026-05-23` at `bfbaf4d`, fully pushed to origin. Layer 2 live and proven on the laptop. Two critical financial-math bugs fixed AND locked in by automated tests. A reusable Queue widget proven on two surfaces. Audit Pass 1 done with 13 documented flags. Audit Pass 2 started with 25 green tests. Entities-sync live as the second sync surface. Accounts tab reorganized with Move-to-Legal added.

**The single open behavioral question:** Darrell has held off entering real financial numbers because only `feedback` and `entities` sync across devices today — the numeric tables (accounts, debts, transactions, rentals, projects, incidents, inquiries) don't yet. The next session's first major workstream is the **verify-balances walkthrough + numeric table sync**.

---

## Critical IDs / URLs (unchanged from 2026-05-23, with updates)

| What | Value |
|---|---|
| **App URL (family install)** | https://192-168-1-26.poetech.direct.quickconnect.to/poetech-app/ |
| **GitHub repo** | https://github.com/darrellpoe06/Kingdom-PWA-Node |
| **Active git branch** | `docs/foundations-and-framework-2026-05-23` |
| **HEAD commit** | `bfbaf4d feat(accounts): reorg + Move-to-Legal + credit-cards-on-Debts-only` |
| **Synology Web Station alias** | `\\PoeTech\poetech-app\` |
| **Supabase project URL** | https://mjjlevhdufpaplypnqrv.supabase.co |
| **Supabase project ref** | `mjjlevhdufpaplypnqrv` |
| **Tenant ID** | `poe-family` (per `join_default_tenant()` RPC) |
| **Pass 2 tests** | `app/src/__tests__/` — 4 files, 25 cases, all green |
| **Pass 1 calc inventory** | `docs/05-financial-os/CALC-INVENTORY.md` — 13 flags |

---

## Commits landed this session (most recent first)

```
bfbaf4d feat(accounts): reorg + Move-to-Legal + credit-cards-on-Debts-only
d8e3adf feat(sync): generic table-sync helper + entities sync (second sync surface)
67be569 test(financial-os): Pass 2 starter tests -- FLAG-10 + FLAG-11 regressions + frequencyToMonthly + projectDebt basics + FLAG-13
29fe44d feat(tests): Vitest infrastructure for Pass 2 of the financial-accuracy audit
826e573 feat(practice): wire Queue widget into Inquiries + section reorder
912a47c docs(financial-os): Audit Pass 1 -- calc inventory + 12 flags
04632ab fix(financial-os): FLAG-11 -- Practice pipeline math matches its stated assumption
9904118 feat: Books subtab restructure + Feedback Log Promote Queue + FLAG-10 fix
3ca7c07 docs(foundations): restore SCHEMA-V2-MULTI-DOMAIN-DRAFT.md
d10d970 docs: drive-don't-delegate rule + PROJECT-FRAMEWORK reconciliation
1c58c09 feat(auth): Layer 2 Royalty Link sign-in + cross-device feedback sync
564ea24 build(synology): coordinate /poetech-app/ base path across vite + manifest + SW
cace1b8 chore(gitignore): supabase secrets, vite env files, and stale dist-* dirs
```

---

## What real users would experience differently from yesterday

**On the laptop, post-deploy (already live):**
- Top-of-app Royalty Link sign-in strip; sign in with Gmail
- Debts is now a Books subtab between Accounts and Tx (no longer a top-level tab)
- Projects tab has a `Feedback Log · Promote queue` (focus pane + paginated cards) between All Projects and the 12-Month Capital Forecast — each item gets `+ Change` / `+ Incident` / `+ Project` action buttons
- Practice tab is reordered: Pre-Intake Inquiry Tracking header → Active/Converted/Declined/Conversion stats → Inquiries Queue (the merged focus + cards widget) → Pipeline Revenue → By Source
- Accounts tab: cash total at top → Personal entities first then Business entities → only Bank Accounts shown per entity (credit cards/loans removed) → Move-to-Legal button on every row
- Legal tab: new "Accounts In Legal" section at top with empty-state copy

**On other devices** (Christina's phone, twins' devices): app is live but **the feedback log and entities are the only data that syncs across devices.** Everything else is per-device localStorage. Darrell has not entered real data into the app yet because of this — he is waiting for the numeric-table sync to ship before doing so. See `project_full-data-sync-next-priority` memory for the seed-handling decision (Option C: upload seed → verify balances walkthrough → sync opens).

---

## Where the session STOPPED

Darrell asked for `handoff`. The session ended on a clean push of `bfbaf4d`. No work is in flight; the working tree is clean of unshipped product code (the only untracked items are the helper PowerShell scripts written during the session, which are intentional and gitignored or left as-is for reuse).

---

## What's NEXT (priority order for the next session)

The next session should open by reading this doc, the memory files, and the latest `CALC-INVENTORY.md`. Then move through these in order:

### 1. Verify-balances walkthrough + numeric-table sync (the big one)
Per Darrell's Option-C decision on 2026-05-24, the seed-handling pattern for the numeric tables is:
- First sign-in uploads local seed to Supabase
- Cross-device sync is GATED behind a "verify balances" walkthrough — user steps through each entity/account/debt/rental/etc. and confirms the starting number
- Only after verification does sync open to other devices

Implementation order (by table consequentiality):
1. Build the verify-balances UI (new component, probably `app/src/components/VerifyBalances.jsx`)
2. Wire it as a gate before the sync wrappers fire
3. Ship `accounts-sync.js` (mirror entities-sync pattern; localKey 'accounts', remoteTable 'accounts', map balance/type/entityId, etc.)
4. Ship `debts-sync.js` (highest-consequence — drives the debt-free projection)
5. Ship `transactions-sync.js`
6. Ship `rentals-sync.js` (note: nested under `data.inflows.rentals` locally, flat in Supabase)
7. Ship `projects-sync.js`, `incidents-sync.js`, `inquiries-sync.js`

The generic `app/src/lib/table-sync.js` helper is already shipped and proven on entities. Each new table is roughly a 50-line wrapper + reducer wiring.

### 2. Cross-device smoke test
Once feedback + entities + accounts sync work, get Christina to sign in on her phone, add a feedback note, edit an entity name, verify both devices show the change. That proves the cross-device loop end-to-end.

### 3. Pass 2 expansion — tests for the remaining calc engines
Existing tests cover FLAG-10 regression, FLAG-11 regression, frequencyToMonthly, projectDebt basics. Add:
- `projectDebtSnowball.test.js` — sort orders (snowball/avalanche/hybrid), cascade-on-clear, freedFromSnowball math
- `projectDebtMinimumOnly.test.js` — stuck-debt detection, FLAG-3 edge case
- `projectRentalSnowball.test.js` — best-cashflow sort (FLAG-4)
- `findExtraForTarget.test.js` — binary-search convergence
- `computeReserves.test.js` — edge cases beyond FLAG-10 (FLAG-9 lumpy tax)
- `totals.test.js` — once `computeTotals()` is extracted (currently inline useMemo)

### 4. Pass 3 — xlsx reconciliation
Compare the app's outputs against `Poe_Family_Financial_Control_System_v1.xlsx` (Drive ID `1NrIu796vnSRoKtGYsbs7C2HVyOsAUMAo`) on the family's actual numbers. Discrepancies are the real bugs.

### 5. Pass 4 — "show your work" UI tooltips
Every consequential number gets a `(?)` disclosure showing formula + inputs + assumptions.

### 6. Queue on Action Queue (BigPicture)
Bigger than expected — it's a unified ITSM queue (changes + incidents + projects). Needs careful design about per-type renderFocus / renderCard. Plan as its own session.

### 7. Remaining flags
- FLAG-1 (monthly vs daily compounding on credit cards)
- FLAG-4 (best-cashflow rental sort ignores reserves)
- FLAG-7 (investment accounts treated as cash)
- FLAG-8 (hardcoded $2,000 discretionary)
- FLAG-9 (lumpy taxes straight-lined)
- FLAG-12 (cart subscription billingCycle ignored)
- FLAG-13 (projectDebt empty-input 1-month projection)

### 8. Extract calc functions to standalone (task #20)
Move `projectDebt` etc. out of the MVP file into a standalone React-free module so Pass 2 tests can run in node instead of jsdom. Drops startup time.

---

## Memory files written this session

All in `C:\Users\dpoe\AppData\Roaming\Claude\local-agent-mode-sessions\fbc038c6-aa86-4614-805f-5cb564c7c603\c3bc5726-cc11-46b8-ae30-46ea74edec89\spaces\ef0c5478-11db-49da-9beb-bc7066500b03\memory\`:

- `feedback_powershell-absolute-paths.md` — every PowerShell command uses absolute paths
- `feedback_phantom-git-lock-routing.md` — sandbox git can't see Windows lock state; route through PowerShell
- `feedback_visible-progress-cadence.md` — never silent >2 min; write incrementally not in one big dump
- `feedback_max-forward-motion.md` — Darrell's default: do all tracks in parallel, never sequentially gate
- `feedback_powershell-ascii-only.md` — no emoji/unicode in .ps1 files; mis-parses on default code page
- `project_resilience-roadmap.md` — 3-phase plan; June 1 ships current arch, sync queue/dual-write later
- `project_financial-accuracy-load-bearing.md` — never assume calc is right; 4-pass audit framework
- `project_full-data-sync-next-priority.md` — next session's first workstream + Option-C seed-handling
- (Pre-existing: drive-don't-delegate, royalty-link naming, both-device-links, father-in-love, etc.)

---

## How to start the next session

Open Cowork (or Dispatch, or any fresh Claude window) with this folder. Paste:

> Read `docs/SESSION-HANDOFF-2026-05-24.md` first. Then read `MEMORY.md` and the memory files it indexes. Then proceed with item #1 from the handoff's "What's NEXT" list — the verify-balances walkthrough + numeric-table sync. Default working mode: max forward motion (see `feedback_max-forward-motion`).

---

## June 1 status check

The June 1 family + church soft-launch deadline is still real. As of this handoff:
- Layer 2 auth + feedback sync: SHIPPED, proven on laptop ✓
- Smoke test cross-device (Christina's phone): pending her availability
- Entities sync: SHIPPED ✓
- Numeric-table sync: not yet
- Math correctness (2 critical fixes): SHIPPED + tested ✓
- Audit Pass 1: SHIPPED ✓
- Audit Pass 2 starter: SHIPPED (25 tests green) ✓
- Audit Pass 3 + Pass 4: pending

If numeric-table sync lands in the next 1-2 sessions, June 1 holds easily. If it stalls, the family can still soft-launch on the laptop-only mode with the feedback-and-entities sync proving the architecture for later expansion.

---

*Written 2026-05-24 at session end. The work resumes from here without any context loss.*
