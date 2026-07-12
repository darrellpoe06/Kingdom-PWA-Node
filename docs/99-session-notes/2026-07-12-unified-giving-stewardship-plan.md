# Unified giving & stewardship — one reconciled ledger, transparent reports

**Recorded:** 2026-07-12 · **Source:** DP — "Upload images of envelopes for
verification of members' cash envelopes and quantifying the totals for the
monthly reports that are usually transparent and sent to... trustees... Givelify
and other money records are added together... solid and clear clean records for
transparency and capability and stewardship." **Status:** researched design;
**Tier C** (money + member financial data + images) — the church/trustees set the
control choices; the agent builds and stages, never opens giving on its own.

## The goal (DP's words)

Every giving channel — **cash envelopes, checks, and online (Givelify, Zelle,
Cash App, PayPal)** — combined into **ONE reconciled ledger**, with envelope
**images as verification**, producing the **transparent monthly report** the
church already sends to trustees / monthly-meeting attendees. Clean records for
transparency, capability, and stewardship.

## It maps onto what already exists (little is net-new plumbing)

- `donor_giving` — per-member gift: `method` (cash/check/online/ach/stock/in-kind),
  `fund`, `amount`, `gift_date`, `tax_year`, `parishioner_id`.
- `service_offerings` — per-service **counts**: `cash_total`, `check_total`,
  `check_count`, `check_numbers[]`, **`online_total` / `online_source` /
  `online_batch_id`**, `cash_count_by`, `reconciled_by`.
- `giving_reconciliations` — the join that makes the total honest: named-claim ↔
  anonymous-offering ↔ **`reconciled-from-online`**, `verified_by`, `claim_status`.
- `lib/giving-records.js` (shipped 2026-07-12) — `normalizeGift` + **`planGivingImport`
  (deduped, no double-count)** + `guessGivingColumns` — the shared engine for a
  single cash entry AND a bulk CSV/Excel import.
- `lib/giving.js` — the church's real online channels (Givelify/Zelle/Cash App/
  PayPal), decoded from its own GIVE ONLINE slide.
- Image infra (`Lightbox`, `ChurchObservation`, `ChurchVideoWall`), sovereign
  vision (`sovereign-ai-class.js`).

## What the research says — the CONTROLS matter more than the tech

Church cash-counting best practice (Church Law & Tax, GCFA, church CPAs):
- **Two-person count (dual control):** two *unrelated* counters, neither the
  treasurer/financial secretary; funds stay in both counters' custody until deposit.
- **Original counter + second verifier** each sign the count sheet; **rotate**
  counters to prevent collusion.
- **Group by type** (cash / check / envelope / online) **and purpose** (general /
  designated fund); **document designation at the point of counting**.
- **Reconcile** by someone *other than* the tellers: count sheet ↔ deposit ↔
  ledger ↔ member records ↔ the online platform payouts.
- **Locked door + camera** over the counting area; **publish totals** (transparency).
- **Annual audit** by the board/trustees.

## How we should do it (research × our stack × our Ways)

1. **Count session = one `service_offerings` row, two-person-gated.** The app
   requires *two* counter identities (`cash_count_by` + verifier `reconciled_by`)
   and prompts rotation — the dual-control rule made a gate, not a hope.
2. **Envelope = a photograph (audit evidence) + a named claim.** Snap each
   envelope; the image is the tamper-evident, timestamped record. Name + amount are
   **entered by the counter** (vision may *assist/suggest*, but a human verifies —
   never trust OCR on money; DR-0076 + VISION-FAIRNESS human-verify). Each envelope →
   a `giving_reconciliations` `named-at-service` claim + a `donor_giving` row.
3. **Online records fold in by import.** Givelify/Zelle/Cash App/PayPal each export
   a CSV → `planGivingImport` normalizes + **dedupes** them into the same
   `donor_giving` ledger (`method: online`, `online_source` tagged), so a re-import
   can't double-count. Their monthly payout total reconciles to `online_total`.
4. **Reconciliation is the honesty gate.** cash(envelopes)+loose + checks + online
   **must equal** the service/month total; the app flags a mismatch (the exact
   review the research demands) before a report is trusted — no painted totals (DR-0076).
5. **The transparent monthly report** aggregates the *reconciled* month across all
   channels: totals by fund and by method, the count-team signatures, the mismatch
   status, and links to the envelope evidence. Built to hand to trustees — printable,
   and sovereign (the members' data serving them, never extracted; DATA-AS-EMPOWERMENT).
6. **Sovereignty + privacy (binding).** Envelope images carry names + amounts —
   highly sensitive. Stored sovereignly (NAS per AI-FOUNDATION-INTERNAL-OPERATIONS),
   RLS + steward-role only, never a cloud vision API and never extracted. The app
   **records** gifts already received; it never processes payments (money is the
   owner's hand).

## Sequence

1. **Now (safe, shipped):** the `giving-records` engine (single entry + deduped bulk import).
2. **Steward "Record Giving" tab (Tier C):** quick cash entry + CSV/Excel bulk import
   + year-to-date readout, on the engine. (Offered.)
3. **Count session + envelope image capture (Tier C):** two-person count, envelope
   photos as evidence, per-envelope named claims.
4. **Reconciliation + transparent monthly report (Tier C):** all-channel sum, mismatch
   flag, printable trustee report.

## Governance

All of steps 2–4 are **Tier C** — money + member financial data + images + trustee-
facing. The control choices (who counts, rotation, what the report shows, image
retention) are the **church's / trustees'** decisions (GOVERN-EXECUTE-ADVISE). The
agent builds and stages; the church opens it.

## Sources

- churchlawandtax.com/manage-finances/internal-controls/10-tips-for-counting-cash · churchcpa.com/managing-church-finances-counting-offerings · gcfa.org/resource/good-internal-controls-for-ministries · freechurchaccounting.com/internalcontrols.html
- lbmc.com/blog/church-finances-best-practices · tablestewards.com/cash-income-controls · startchurch.com/blog/view/name/the-dos-and-donts-of-counting-church-money · churchcpa.com/managing-church-finances-envelope-tampering
