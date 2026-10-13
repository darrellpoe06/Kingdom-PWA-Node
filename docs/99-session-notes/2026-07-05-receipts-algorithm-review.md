# Receipts — algorithm review, upgrades & features (2026-07-05)

**Trigger.** Darrell, holding the Aspen Tap House receipt again: *"Can't upload receipts into the PoeTech App for reporting."* Four screenshots showed the Add-a-receipt overlay with a filename chosen but the Save button stuck on **"ADD THE PHOTO FIRST (STEP 1)"**. Then: observe the fix's pipeline timeline, review the algorithm, ship the non-governance fixes, and surface the rest for governance review **inside the app**.

This is the DR-0090 receipts subsystem (`app/src/lib/receipts.js`, `app/src/lib/image.js`, the `ReceiptModal` in `app/src/components/BooksTransactions.jsx`). Governed by APP-IS-PRIMARY, REALITY-TRACE, VERIFICATION-DOCTRINE, PERPETUAL-IMPROVEMENT (DR-0075).

---

## 1. Observed pipeline timeline — PR #604 (the first fix)

The stranded-Save fix rode the sanctioned delivery lane (DR-0103). Measured from the GitHub Actions API, not estimated:

| Event | Timestamp (UTC) | Elapsed from push |
| --- | --- | --- |
| Commit authored | 20:01:42 | — |
| Push → workflows created | 20:01:51 | 0:00 |
| `app — lint + vitest` **started** | 20:01:53 | 0:02 |
| wf36 gatekeeper harness done | 20:02:06 | 0:15 |
| Auto-open PR job done (PR #604 opened, auto-merge armed) | 20:02:04 | 0:13 |
| Vercel preview comment | 20:02:20 | 0:29 |
| `app — lint + vitest` **completed** (green) | 20:04:21 | **2:30** |
| **Squash-merged to `main`** (github-actions bot) | 20:04:24 | **2:33** |

**Read:** end-to-end **~2 min 33 s** from push to merge, with **CI (lint + full Vitest) the long pole at ~2m28s**; every other gate finished inside 30 s. Merge = deploy (DR-0054), so the Vercel production build kicks off at 20:04:24. No human touched it — exactly the streamlined loop DR-0103 describes. The `hold` label was never applied (correct: this is a Tier-A bug fix).

---

## 2. Algorithm review

### What the subsystem does
1. **Capture** — `compressImageFile` reads the picked photo, resizes to ≤1280px, and stores a JPEG **data URL** (~80–250 KB). Save is gated on that compressed `src`.
2. **Shape** — `receiptShape` → `{ id, src, amount(abs), merchant, note, capturedAt }`.
3. **Pending pool** — per-device `localStorage`, capped at 20, drains as matches land.
4. **Match** — `suggestMatches` pairs a pending receipt to bank rows.
5. **Attach** — the receipt is written onto the transaction row and rides the row's sync to every device.

### Findings

| # | Finding | Severity | Disposition |
| --- | --- | --- | --- |
| **G0** | **Re-picking the SAME photo fired no `change` event** → Save stuck on step 1. The reported bug. | HIGH | **Shipped** — PR #604 (input value reset on every change; src cleared per read; empty-decode rejected; standing hint). |
| **G1** | **Exact-cent matching never pairs a tipped receipt to its settled charge.** Paper total $72.60 (balance due) vs VISA settle $86.68 (+ handwritten tip) — the pending receipt would sit forever. Demonstrable on today's real receipt. | HIGH | **Shipped this session** — bounded, one-directional tip tolerance (`TIP_TOLERANCE_PCT = 0.30`). |
| **G5** | Merchant name was captured but **never used** in matching. | MED | **Shipped this session** — `merchantOverlap` used to rank ties (rank-only; never widens/narrows candidates). |
| **G10** | Suggestions gave no signal that a pairing is **inexact** (tip/date-only), inviting a silent wrong-pair. | MED | **Shipped this session** — `matchKind` → each suggestion labeled `exact` / `+ tip?` / `date only — verify`. |
| **G4** | Match window is symmetric (±4 days); a charge essentially never settles **before** the paper exists, so pre-dating is noise. | LOW | Deferred — `re-review: 2026-08-01` (fold into the synced-pool work). Narrowing changes semantics; not worth a standalone change now. |
| **G3** | No dedupe — the same photo can be added to the pool twice. | LOW | Deferred — the cap bounds it; `re-review: 2026-08-01`. |
| **G6** | **No OCR** — merchant/total are hand-typed (Darrell typed `86.68` + `Aspen Tap House`). | FEATURE | **Escalated → OPEN-8** (NAS compute, deterministic-first; Tier B/C). |
| **G7** | Pending pool is **per-device** — a receipt snapped on the phone can't be matched on the laptop. | FEATURE | **Escalated → OPEN-9** (synced table, schema; Tier B). Matches DR-0090's existing `re-review: 2026-08-01`. |
| **G8** | A receipt is often **two slips** (itemized + signature/tip copy — visible in today's photo); only one image attaches. | FEATURE | **Escalated → OPEN-10** (data-shape `src` → `pages[]` on a money row + sync mapping; Tier B). |

---

## 3. What shipped this session (Tier A — pre-authorized, non-governance)

All in `app/src/lib/receipts.js` + the `ReceiptModal` surface, pure logic + proven-to-catch tests (`receipts.test.js`, now 13/13; full suite 4539/4539; lint + per-theme contrast guard green):

1. **Tip-inclusive matching (G1).** `matchKind(receipt, txn)` returns `exact` when magnitudes match to the cent, `tip` when the charge is **≥ the paper total and ≤ +30%** (tip only ever adds, so the window is one-directional and bounded — a charge *below* the paper total or *beyond* +30% is rejected), `date` when the receipt has no total, else `null`. Verified on the verbatim Aspen numbers: 72.60 paper → 86.68 charge classifies as `tip` and is suggested; a −$60 charge (below) and a −$120 charge (beyond ceiling) are both rejected.
2. **Merchant-aware ranking (G5).** `merchantOverlap` counts receipt-merchant words (≥3 chars) present in the bank description and is used **only to order** suggestions (exact > tip > date, then merchant overlap, then nearest date). It can never mis-pair because it never changes the candidate set.
3. **Match-kind labels (G10).** Each suggested row is tagged `exact` / `+ tip?` / `date only — verify`, so an inexact pairing is flagged for the human to confirm rather than trusted silently (VERIFICATION-DOCTRINE).

**Why Tier A:** these are suggestion-layer, **human-confirmed** (the user still taps the row), no money moves, reality-traced against the actual receipt, and proven-to-catch. G1 is squarely a bug fix — the exact-cent rule fails to pair the very receipt DR-0090 was built around.

---

## 4. Escalated for governance (rendered in the in-app Governor queue)

Added to `docs/governance/decision-queue.md` → renders in **Governance · Decisions waiting on you**:

- **OPEN-8 — Receipt OCR (auto-read merchant + total).** Removes the hand-typing. Deterministic-first on the NAS ops-runner lane (DR-0088). Tier B/C (compute + a NAS credential). DR-0090 already named this Phase-2.
- **OPEN-9 — Synced pending pool (cross-device match).** Move the per-device `localStorage` waiting room to a synced table so Christina snaps on her phone and matches on the laptop. Tier B (schema). Matches DR-0090's `re-review: 2026-08-01`.
- **OPEN-10 — Multi-page receipt (itemized + signature/tip copy).** One receipt = several images; today only one attaches. Tier B (data-shape + sync mapping change on a money row).

Each is a real fork with a recommendation; deciding one **creates the next fix** (DR-0075 — the app is where the perpetual loop runs).

---

## 5. Perpetual-improvement ledger (DR-0075)

- G4 (symmetric window), G3 (pool dedupe) — **`re-review: 2026-08-01`**, fold into OPEN-9.
- OPEN-8 / OPEN-9 / OPEN-10 — await the governor's call in-app; no silent drop.
