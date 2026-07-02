// components/BooksTransactions.jsx — the Books > Transactions surface.
//
// Peeled out of the monolith shell (poe-financial-mvp-v28.jsx) as Stage 1 of the
// hybrid-modular cutover (DR-0078). It was already a fully prop-driven inline
// component; extraction moved it verbatim into its own file + chunk, behind the
// surface-mount registry's lazy boundary, so ~1,120 lines leave the monolith
// chunk and load only when the Transactions tab opens. Zero behavior change —
// pinned by the existing transactions/figure tests (characterize-before-change,
// DR-0076 §5). Its only shared dependency, `fmt`, now comes from core
// (lib/format.js); TabScroll is a shared primitive; TX_CATEGORIES is local. The
// n8n base + reconciliation helpers it uses were already core libs.
import React, { useState, useEffect, useMemo } from 'react';
import { TabScroll } from './shared.jsx';
import { fmt, fmtCents } from '../lib/format.js';
import { N8N_BASE } from '../lib/n8n-base.js';
import { isReconciled } from '../lib/reconciliation.js';
import { hasReceiptItems, categorySplit, derivedCategory, receiptVerification, categorizeItem } from '../lib/receipt-itemize.js';
import { versionTimeline } from '../lib/record-history.js';
import { isSpreadsheetFile, statementFileToCsv, parseDelimitedToRows } from '../lib/statement-import.js';
import { planBulkImport } from '../lib/bulk-statement-import.js';
import { recordLoopRun } from '../lib/loop-runs.js';
import { filterTransactions, sortTransactions, categorySummary, reviewStatus } from '../lib/transaction-analysis.js';
import { categorize } from '../lib/categorize.js';
import ReceiptCapture from './ReceiptCapture.jsx';
import Lightbox from './Lightbox.jsx';
import InputValidation from './InputValidation.jsx';
import { candidateFromManual, candidateFromBankRow } from '../lib/input-validation.js';

const TX_CATEGORIES = ['salary', 'rental-income', 'transfer', 'groceries', 'fuel', 'utilities', 'dining', 'medical', 'vehicle', 'household', 'charitable', 'business', 'professional', 'insurance', 'subscription', 'debt-payment', 'other'];

// TxHistory — the Books living-record proof: every edit/delete to this
// transaction is an immutable, attributed version in record_events
// (lib/record-history.js). A flat row becomes a record with a recoverable past:
// what it was, who changed it, and when. Empty (the common case) renders nothing.
function TxHistory({ recordEvents, txId }) {
  const timeline = useMemo(() => versionTimeline(recordEvents, 'transaction', txId), [recordEvents, txId]);
  if (!timeline.length) return null;
  const when = (iso) => { try { return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); } catch { return iso; } };
  return (
    <div className="mt-2 pt-2 border-t border-[#E8E4DC]">
      <div className="text-[0.5625rem] uppercase tracking-[0.2em] text-[#5A5751] mb-1">Edit history · {timeline.length} version{timeline.length === 1 ? '' : 's'}</div>
      <div className="space-y-1">
        {timeline.map((v) => (
          <div key={`${v.version}-${v.at}`} className="text-[0.6875rem] text-[#5A5751]">
            <span className="text-[#5A5751]">v{v.version} · {when(v.at)}{v.actor ? ` · ${v.actor}` : ''} · {v.action}</span>{' '}
            {Object.keys(v.changes).length
              ? Object.entries(v.changes).map(([k, c]) => (
                  <span key={k} className="mr-2">{k}: <span className="text-[#7A1F1F]">{String(c.from ?? '∅')}</span> → <span className="text-[#3F5226]">{String(c.to ?? '∅')}</span></span>
                ))
              : <span>{v.summary}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ReceiptItemization — the emailed-receipt enrichment dropdown (DR-0076). When a
// bank transaction is matched to a vendor receipt/order-confirmation email
// (Walmart, Walgreens, Amazon, …), the reconciliation carries the LINE ITEMS the
// bank line never could. This expands a charge to show every item + its price,
// the category SPLIT derived from those items (groceries vs household on one
// charge), and the item-level verification: the items must sum to the same bank
// debit the statement already confirmed. The bank stays the source of truth for
// the amount; the receipt only enriches + double-checks it. Self-explaining with
// hover tooltips; nothing here moves money (display-only).
function ReceiptItemization({ reconciliation, amount, txCategory }) {
  const [showImage, setShowImage] = useState(false);
  if (!hasReceiptItems(reconciliation)) return null;
  const split = categorySplit(reconciliation);
  const verdict = receiptVerification(reconciliation, amount);
  const derived = derivedCategory(reconciliation);
  const orders = (reconciliation.orders || []).filter((o) => Array.isArray(o.items) && o.items.length);
  const itemCount = orders.reduce((n, o) => n + o.items.length, 0);
  const merchant = reconciliation.merchant || 'Receipt';
  // Proof image (photo/OCR path). dataUrl renders directly; a NAS-only ref shows
  // an honest "stored on NAS" note (no thumbnail URL wired here yet).
  const img = reconciliation.source_image || null;
  const imgSrc = img && img.dataUrl ? img.dataUrl : null;
  const catLabel = split.parts.filter((p) => p.category !== 'other').map((p) => p.category).join(' + ') || 'items';
  const email = reconciliation.source_email || null;
  return (
    <details className="mt-1 text-[0.6875rem]">
      <summary
        className="cursor-pointer text-[#5A5751] hover:text-[#1A1815] select-none"
        style={{ fontFamily: '"Fraunces", serif' }}
        title={`Itemized detail from the ${merchant} receipt (${(reconciliation.matched_to || []).includes('photo') ? 'photographed' : 'email'}) matched to this bank charge. Click to expand every item and its price.`}
      >
        {merchant} receipt · {itemCount} item{itemCount === 1 ? '' : 's'} · {catLabel}
        {(reconciliation.matched_to || []).includes('photo') && <span className="text-[#5A5751]" title="This receipt came from a photo you captured; the text was read on-device."> · photo</span>}
      </summary>
      <div className="mt-1 pl-3 border-l-2 border-[#E8E4DC] space-y-2">
        {/* Proof image (photo/OCR path): a thumbnail that opens the full receipt. */}
        {imgSrc && (
          <div className="pb-1">
            <button type="button" onClick={() => setShowImage(true)}
              className="inline-block focus:outline focus:outline-2 focus:outline-[#B85838]"
              title="View the full receipt photo attached as proof (location data was stripped before storing)">
              <img src={imgSrc} alt={`${merchant} receipt photo`} className="h-16 w-16 object-cover border border-[#E8E4DC]" />
            </button>
            <span className="ml-2 text-[0.5625rem] text-[#5A5751] align-top" title="Proof of purchase attached to this charge.">receipt photo · proof attached</span>
          </div>
        )}
        {!imgSrc && img && img.ref && (
          <div className="pb-1 text-[0.5625rem] text-[#5A5751]" title="The receipt photo is stored on the family NAS.">receipt photo stored on NAS · proof attached</div>
        )}
        {orders.map((o, oi) => (
          <div key={oi} className="space-y-0.5">
            {o.order && (
              <div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]" title="The vendor order/receipt number from the email.">Order {o.order}</div>
            )}
            {o.items.map((it, ii) => {
              const cat = categorizeItem(it).category;
              return (
                <div key={ii} className="flex items-baseline justify-between gap-2">
                  <span className="text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>
                    {it.qty && Number(it.qty) !== 1 ? <span className="text-[#5A5751]" title="Quantity on the receipt line">{it.qty}× </span> : ''}
                    {it.name}
                    {cat && (
                      <span
                        className="ml-1.5 inline-block px-1 py-px text-[0.5rem] uppercase tracking-wider text-[#5A5751] border border-[#E8E4DC] align-middle"
                        title={`Categorized from the item name as ${cat}. This is why one charge can split across categories.`}
                      >
                        {cat}
                      </span>
                    )}
                  </span>
                  <span className="text-[#1A1815] whitespace-nowrap" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{fmtCents(it.price)}</span>
                </div>
              );
            })}
            {(o.tax || o.fees || o.shipping || o.discount) ? (
              <div className="flex items-baseline justify-between gap-2 text-[#5A5751]">
                <span title="Tax, fees, shipping, and discounts from the receipt — what makes the items sum to the amount charged.">
                  {[o.tax ? `tax ${fmtCents(o.tax)}` : null, o.fees ? `fees ${fmtCents(o.fees)}` : null, o.shipping ? `shipping ${fmtCents(o.shipping)}` : null, o.discount ? `− discount ${fmtCents(o.discount)}` : null].filter(Boolean).join(' · ')}
                </span>
                <span />
              </div>
            ) : null}
          </div>
        ))}

        {/* Category SPLIT — the precise-categorization payoff. One charge, several categories. */}
        {split.parts.length > 0 && (
          <div className="pt-1 border-t border-[#E8E4DC]">
            <div className="text-[0.5625rem] uppercase tracking-wider text-[#5A6E3D] mb-0.5" title="Where this one charge's dollars actually went, split by item category — instead of filing the whole charge under a single guess.">
              Category split from items
            </div>
            {split.parts.map((p) => (
              <div key={p.category} className="flex items-baseline justify-between gap-2">
                <span className={`uppercase tracking-wider text-[0.5625rem] ${p.category === 'other' ? 'text-[#B85838]' : 'text-[#5A5751]'}`}>
                  {p.category === 'other' ? 'uncategorized' : p.category}{' '}<span className="normal-case tracking-normal">· {p.itemCount} item{p.itemCount === 1 ? '' : 's'}</span>
                </span>
                <span className="text-[#1A1815] whitespace-nowrap" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{fmtCents(p.amount)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Item-level verification — the cross-reference IS the verification. */}
        <div className="pt-1 border-t border-[#E8E4DC] flex items-baseline justify-between gap-2">
          {verdict.verified ? (
            <span className="text-[#5A6E3D]" title={`Every item + tax reconciles to the ${fmtCents(Math.abs(amount))} the bank already confirmed. Two independent sources agree.`}>
              ✓ Items reconcile to the {fmtCents(Math.abs(amount))} bank debit — verified
            </span>
          ) : (
            <span className="text-[#B85838]" title={`This charge is flagged to the Concerns queue: ${verdict.reason}`}>
              Receipt does not reconcile — {verdict.reason}
            </span>
          )}
          <span />
        </div>

        {/* If the items imply a different category than the row is filed under, say so. */}
        {derived && txCategory && derived !== txCategory && (
          <div className="text-[0.625rem] text-[#5A5751]" title="The item mix suggests a more precise category than the current one. Edit the row to apply it.">
            Items suggest <span className="text-[#5A6E3D] uppercase tracking-wider">{derived}</span> (filed as {txCategory})
          </div>
        )}
        {email && (
          <div className="text-[0.5625rem] text-[#5A5751]" title="Provenance: the receipt email this itemization came from.">
            from {email.from || 'vendor email'}{email.received ? ` · ${email.received}` : ''}
          </div>
        )}
        {img && (
          <div className="text-[0.5625rem] text-[#5A5751]" title="The photo's capture time (kept for matching) and confirmation the location tag was removed before storing.">
            photographed{img.captured_at ? ` · ${String(img.captured_at).slice(0, 10)}` : ''} · location tag stripped
          </div>
        )}
      </div>
      {showImage && imgSrc && (
        <Lightbox items={[{ src: imgSrc, alt: `${merchant} receipt photo`, caption: `${merchant} receipt` }]} index={0} onClose={() => setShowImage(false)} />
      )}
    </details>
  );
}

export default function BooksTransactions({ data, entityFilter, setEntityFilter, currentDate, addTransaction, updateTransaction, deleteTransaction, ingestData = null, visibleEntities = null, visibleEntityIds = null }) {
  // UNBREAKABLE (2026-06-25 white-screen fix) — every account/entity access in
  // this view assumed `data.accounts` and `data.entities` were always present
  // arrays. They are not guaranteed: a signed-in user's merged cloud data can
  // arrive with either key absent, and a cloud-synced entity row can carry a
  // null `display_name` (-> `{ name: null }`, see entities-sync.fromRow). The old
  // code reached straight for `data.accounts[0]` and `e.name.split('(')`, throwing
  // a TypeError that took the whole tab to a white screen. Normalize ONCE here
  // (memoized so the deps below stay stable) and route every reference through
  // these; the SectionBoundary around this surface is the backstop, but the
  // surface must not throw at all.
  const accounts = useMemo(() => (Array.isArray(data?.accounts) ? data.accounts : []), [data?.accounts]);
  const entities = useMemo(() => (Array.isArray(data?.entities) ? data.entities : []), [data?.entities]);
  // Safe entity label — never assume a string `name` exists.
  const entityLabel = (e) => ((e && e.name) || (e && e.id) || '—').split('(')[0].trim();
  const [txView, setTxView] = useState('history');
  const [page, setPage] = useState(0);
  const pageSize = 25;
  // Phase 2C (2026-05-28) — reconcile-status filter. Lets the user narrow
  // the merged Tx feed to just the rows that need attention.
  // 'all' (default) shows everything; 'unexplained' is the most-useful
  // surface for the workflow-16 reconcile data (1900+ unexplained rows).
  const [statusFilter, setStatusFilter] = useState('all');
  // Sort + filter the History feed so Darrell + Christina can work the data
  // after a bulk upload: sort by any column, narrow by account / date / text.
  const [sortKey, setSortKey] = useState('date');
  const [sortDir, setSortDir] = useState('desc');
  const [acctFilter, setAcctFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [txSearch, setTxSearch] = useState('');
  // Click a column header: same key flips direction, new key starts descending.
  const toggleSort = (key) => {
    if (key === sortKey) { setSortDir(d => (d === 'asc' ? 'desc' : 'asc')); }
    else { setSortKey(key); setSortDir('desc'); }
  };
  const sortArrow = (key) => (sortKey === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '');
  // Reset pagination whenever any filter changes so user lands on page 1.
  useEffect(() => { setPage(0); }, [txView, entityFilter, statusFilter, acctFilter, dateFrom, dateTo, txSearch, sortKey, sortDir]);

  // Phase 2A — merge ingested bank/Gmail transactions from n8n workflow 18
  // alongside the manual entries. Sovereign-loop: data flows from
  // /volume1/PoeTech/finance-events/ on the NAS, never from a SaaS.
  //
  // Phase 2B.2 — ingestData is now lifted to the top-level App component so
  // Tx + Accounts + Big Picture share one feed. Falls back gracefully if a
  // parent didn't pass it (e.g. during unit tests).
  // Re-derive the same per-row shape Phase 2A built locally, but from the
  // shared `ingestData.transactions` so we keep the dedupe + badge code below
  // unchanged.
  const ingestedTx = useMemo(() => {
    const raw = (ingestData && ingestData.transactions) || [];
    return raw.map(rec => {
      const instStr = String(rec.institution || '');
      const last4Match = instStr.match(/(\d{4})/);
      const last4 = last4Match ? last4Match[1] : null;
      let matchedAccountId = null;
      if (last4 && Array.isArray(accounts)) {
        const cand = accounts.find(a => (a.fragment || '').includes(last4));
        if (cand) matchedAccountId = cand.id;
      }
      const id = `ingest-${rec.id || (rec.fitid || rec.posted + '-' + rec.amount + '-' + rec.name)}`;
      return {
        id,
        date: rec.posted || (rec.captured_at || '').slice(0, 10),
        accountId: matchedAccountId,
        amount: rec.amount,
        description: rec.name || rec.memo || '(no description)',
        category: 'imported',
        _source: 'bank-ingest',
        _institution: instStr,
        _last4: last4,
        _fitid: rec.fitid || null,
        _status: rec.status || 'unknown',
        _accountMatched: !!matchedAccountId,
      };
    });
  }, [ingestData, accounts]);

  // Dedupe key for matching a manual entry to an ingested one.
  // Account match optional (a manual entry might predate the bank link).
  const dedupeKey = (t) => {
    const dt = (t.date || '').slice(0, 10);
    const amt = Math.round((t.amount || 0) * 100); // cents, integer
    const descPrefix = (t.description || '').toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 12);
    const last4 = t._last4 || (t.accountId && (accounts.find(a => a.id === t.accountId)?.fragment || '').match(/\d{4}/)?.[0]) || '';
    return `${last4}|${dt}|${amt}|${descPrefix}`;
  };

  // v28+ Session B: funds-verify trigger + transfer popup
  const FUNDS_BUFFER = 200; // dollars - any projected balance below this triggers the cover prompt
  const [transferContext, setTransferContext] = useState(null); // { targetAccountId, shortfall, occasion }
  const [transferAmount, setTransferAmount] = useState(0);
  const [transferSourceId, setTransferSourceId] = useState('');

  // v28+ CSV import state
  const [csvOpen, setCsvOpen] = useState(false);
  const [csvRaw, setCsvRaw] = useState('');
  const [csvAccountId, setCsvAccountId] = useState(accounts[0]?.id || '');
  const [csvFlipSign, setCsvFlipSign] = useState(false);
  const [bulkPlan, setBulkPlan] = useState(null);
  const [bulkBusy, setBulkBusy] = useState('');
  const [csvError, setCsvError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const todayISO = currentDate.toISOString().slice(0, 10);
  const blank = { date: todayISO, accountId: accounts[0]?.id || '', amount: 0, description: '', category: 'other', entityOverride: '' };
  const [form, setForm] = useState(blank);

  // The ONE shared validate -> preview -> confirm -> commit gate. EVERY input
  // path (manual add, bank-file import, captured photos, emailed receipts) opens
  // this same InputValidation surface with candidates; nothing commits until the
  // user confirms there. `validation` holds the open review, or null.
  const [validation, setValidation] = useState(null);
  const openValidation = (candidates, title) => {
    const list = (candidates || []).filter(Boolean);
    if (list.length) setValidation({ candidates: list, title: title || 'Review before it commits' });
  };

  // Round 9: no scroll-to-top. Form opens at the top of the transaction list;
  // the user keeps their place in whatever row they were reading.
  const startAdd = () => { setForm({ ...blank, accountId: accounts[0]?.id || '' }); setEditingId(null); setShowForm(true); };
  // r32 — Inline edit per IN-PLACE-FIRST: edit form drops down under the row,
  // top form reserved for Add only.
  const startEdit = (t) => { setForm({ date: t.date, accountId: t.accountId, amount: t.amount, description: t.description, category: t.category || 'other', entityOverride: t.entityOverride || '' }); setEditingId(t.id); setShowForm(false); };
  const cancel = () => { setShowForm(false); setEditingId(null); setForm(blank); };
  const submit = () => {
    if (!form.date || !form.accountId || !form.description) { alert('Date, account, and description are required.'); return; }
    const payload = { ...form, amount: parseFloat(form.amount) || 0 };
    if (!payload.entityOverride) delete payload.entityOverride;
    if (editingId) { updateTransaction(editingId, payload); cancel(); return; }
    // ADD goes through the SAME validation gate as every other input — the entry
    // is previewed (auto-picked category, confidence) and confirmed before it
    // commits. Nothing lands silently.
    openValidation([candidateFromManual(payload, { categoryRules: data?.categoryRules })], 'Review this entry');
    cancel();
  };
  const confirmDelete = (t) => { if (confirm(`Delete transaction "${t.description}"?`)) deleteTransaction(t.id); };

  // Phase 2E (2026-05-28) — accept an ingest row as a manual entry. Two
  // ergonomic modes: 'review' opens the new-transaction form pre-filled so
  // the user can adjust category/description before saving; 'quick' adds
  // the entry immediately with the suggested category. The next ingest
  // refresh dedupes — the manual entry and the bank row merge with a
  // green "bank-confirmed" badge.
  // Delegates to the ONE deterministic rule layer (lib/categorize.js). The old
  // inline matcher tagged "WF HOME MTG AUTO PAY" as Vehicle by matching the
  // substring "auto"; the rule layer is token/payee-based, mortgage-first, and
  // honors learned per-payee corrections (data.categoryRules).
  const suggestCategory = (description) => categorize(description, { learned: data?.categoryRules }).category;
  // Phase 2F (2026-05-28) — mark a bank-ingest row as noise. Posts the
  // institution + fitid to n8n workflow 19, which writes 'noise-skip' into
  // the reconcile state file. Workflow 18's next 5-min refresh sees the
  // updated state and the row drops off "Needs attention" forever.
  // We also hold a local Set of just-marked fitids so the row vanishes
  // immediately, before the network round-trip; vital for grinding through
  // a few hundred rows on the plane without 5-min waits between each.
  const [noisedLocally, setNoisedLocally] = useState(new Set());
  const markNoise = async (t) => {
    if (!t || t._source !== 'bank-ingest') return;
    const inst = t._institution || '';
    const fitid = t._fitid || '';
    if (!inst || !fitid) {
      alert('Cannot mark as noise — this row is missing institution or FITID.');
      return;
    }
    // Optimistic: hide it from the merged feed right away.
    setNoisedLocally(prev => {
      const next = new Set(prev);
      next.add(fitid);
      return next;
    });
    const base = N8N_BASE;
    if (!base) return; // local-only optimism; state will not persist
    try {
      const url = `${base.replace(/\/+$/, '')}/webhook/mark-noise`;
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        mode: 'cors',
        body: JSON.stringify({ institution: inst, fitid, reason: 'pwa-tx-mark-noise' })
      });
      if (!r.ok) throw new Error('Mark-noise endpoint returned ' + r.status);
    } catch (e) {
      // Revert optimism on failure so the user knows it didn't stick.
      setNoisedLocally(prev => {
        const next = new Set(prev);
        next.delete(fitid);
        return next;
      });
      alert('Could not save noise marking: ' + e.message);
    }
  };

  const acceptIngest = (t, mode = 'review') => {
    // Find an account: matched by last4 if available; otherwise prompt user
    // to pick during review. Quick-add requires a matched account.
    const matchedAccountId = t.accountId || (t._last4 ? accounts.find(a => (a.fragment || '').includes(t._last4))?.id : null);
    const prefill = {
      date: t.date,
      accountId: matchedAccountId || accounts[0]?.id || '',
      amount: t.amount,
      description: t.description,
      category: suggestCategory(t.description),
      entityOverride: '',
    };
    if (mode === 'quick') {
      if (!prefill.accountId) {
        alert('Cannot quick-add — no account matches this institution. Use Review instead.');
        return;
      }
      const payload = { ...prefill, amount: parseFloat(prefill.amount) || 0 };
      addTransaction(payload);
      return;
    }
    // Review mode: open the form with the prefill and let the user adjust.
    setForm(prefill);
    setEditingId(null);
    setShowForm(true);
    try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) {}
  };

  const matchesEntity = (t) => {
    // Multi-user Layer A — when 'all' is selected, only show transactions
    // whose account belongs to a visible entity. Without this gate the
    // 'all' view would leak every entity's transactions across profiles.
    if (entityFilter === 'all') {
      if (visibleEntityIds && t.accountId) {
        const acc = accounts.find(a => a.id === t.accountId);
        return acc ? visibleEntityIds.has(acc.entityId) : true;
      }
      return true;
    }
    if (t.entityOverride) return t.entityOverride === entityFilter;
    const acc = accounts.find(a => a.id === t.accountId);
    if (acc) return acc.entityId === entityFilter;
    // Ingest entries with no mapped accountId: surface them under the
    // "all" view only — they don't have an entity until you link the
    // account in Books → Accounts. Filtered out of entity-scoped views
    // so they don't muddle entity-specific totals.
    return false;
  };

  // Phase 2A — merge manual transactions with ingested ones. Dedupe by
  // composite key (last4 + date + cents + descPrefix). Manual entries always
  // win when both exist for the same key — the user's record-of-truth is
  // authoritative; the ingest is supporting evidence. Ingested entries that
  // match a manual one get tagged onto the manual row's _ingestMatched flag
  // so renderRow can show a "✓ Bank-confirmed" badge in-line.
  const manualByKey = (() => {
    const m = {};
    for (const t of (data.transactions || [])) {
      m[dedupeKey(t)] = t.id;
    }
    return m;
  })();
  const ingestedFiltered = ingestedTx.filter(t => {
    // Phase 2F — optimistic hide for rows the user just marked noise.
    // Persists locally until the next n8n refresh reflects the state-file
    // update; after that, workflow 18 returns status='noise-skip' and the
    // statusFilter pills already partition it correctly.
    if (t._fitid && noisedLocally.has(t._fitid)) return false;
    // Drop ingest entries that already match a manual entry's dedupe key —
    // the manual row will surface a "bank-confirmed" badge instead.
    return !manualByKey[dedupeKey(t)];
  });
  // Mark manual rows that have an ingest match (for badge rendering).
  const ingestMatchSet = new Set();
  for (const t of ingestedTx) {
    const k = dedupeKey(t);
    if (manualByKey[k]) ingestMatchSet.add(manualByKey[k]);
  }
  const allTxBeforeStatusFilter = [
    ...(data.transactions || []).map(t => ({ ...t, _ingestMatched: ingestMatchSet.has(t.id) })),
    ...ingestedFiltered
  ].filter(matchesEntity);
  // Phase 2C — apply the reconcile-status filter. Manual entries pass through
  // any status filter (they're authoritative). Ingest rows get filtered by
  // their reconcile-status. "needs-attention" is a synthetic filter that
  // combines unexplained + unconfirmed since both want the user's eye.
  const allTx = allTxBeforeStatusFilter.filter(t => {
    if (statusFilter === 'all') return true;
    if (t._source !== 'bank-ingest') return true; // manual entries always show
    if (statusFilter === 'needs-attention') return t._status === 'unexplained' || t._status === 'unconfirmed';
    return t._status === statusFilter;
  });
  const history = allTx.filter(t => t.date <= todayISO).sort((a, b) => b.date.localeCompare(a.date));
  const futureTx = allTx.filter(t => t.date > todayISO).sort((a, b) => a.date.localeCompare(b.date));
  // Counts for the filter dropdown — built from the pre-filter set so each
  // pill always shows the true count regardless of which filter is active.
  const statusCounts = (() => {
    const c = { all: 0, 'needs-attention': 0, unexplained: 0, unconfirmed: 0, verified: 0, 'noise-skip': 0 };
    for (const t of allTxBeforeStatusFilter) {
      c.all += 1;
      if (t._source !== 'bank-ingest') continue;
      if (t._status === 'unexplained' || t._status === 'unconfirmed') c['needs-attention'] += 1;
      if (Object.prototype.hasOwnProperty.call(c, t._status)) c[t._status] += 1;
    }
    return c;
  })();

  const recurringUpcoming = (data.recurringObligations || [])
    .filter(r => r.enabled !== false && r.nextDue && r.nextDue > todayISO)
    .map(r => {
      // Preparatory scaffolding — used by the pending "renews every N months"
      // hint chip in the recurring-obligations preview.
      // eslint-disable-next-line no-unused-vars
      const months = r.frequency === 'monthly' ? 1 : r.frequency === 'quarterly' ? 3 : r.frequency === 'semi-annual' ? 6 : r.frequency === 'annual' ? 12 : r.frequency === 'biennial' ? 24 : 1;
      return {
        id: `ro-preview-${r.id}`,
        date: r.nextDue,
        description: r.name,
        amount: -Math.abs(r.amount),
        category: r.category || 'subscription',
        // Carry the obligation's account through so it flows into that account's
        // "after upcoming" projection and forward forecast. Obligations without
        // an accountId stay unattributed (counted in totals, not per-account).
        accountId: r.accountId,
        _source: 'recurring',
        _frequency: r.frequency,
        _entityId: r.entityId,
      };
    })
    .filter(item => entityFilter === 'all' || item._entityId === entityFilter);

  const upcoming = [...futureTx.map(t => ({ ...t, _source: 'transaction' })), ...recurringUpcoming].sort((a, b) => a.date.localeCompare(b.date));

  // DERIVED balances — every "Right now" figure recomputes from underlying
  // transactions, never a stored literal. "Right now" = openingBalance + the
  // sum of that account's CLEARED (settled, date <= today) transactions. Any
  // real entry added later flows through here and moves every dependent figure
  // (the primary card, inline per-row "(now $X)", and the 30/60/90 forecast).
  // openingBalance falls back to the stored `balance` for accounts that predate
  // the field (and for user-created accounts with no ledger yet → now = balance).
  const clearedByAccount = (data.transactions || []).reduce((acc, t) => {
    if (!t.accountId || !t.date || t.date > todayISO) return acc;
    acc[t.accountId] = (acc[t.accountId] || 0) + (t.amount || 0);
    return acc;
  }, {});
  const liveBalance = (a) => (a.openingBalance != null ? a.openingBalance : (a.balance || 0)) + (clearedByAccount[a.id] || 0);
  const balanceByAccount = (accounts || []).reduce((acc, a) => { acc[a.id] = liveBalance(a); return acc; }, {});

  // For Upcoming: walk transactions chronologically per account, tracking
  // projected running balance so each row can show what the account will
  // become AFTER this charge posts.
  const projectedAfter = (() => {
    const running = { ...balanceByAccount };
    const map = {};
    [...upcoming].sort((a, b) => a.date.localeCompare(b.date)).forEach(t => {
      if (t.accountId && t.accountId in running) {
        running[t.accountId] = (running[t.accountId] || 0) + (t.amount || 0);
        map[t.id] = running[t.accountId];
      }
    });
    return map;
  })();

  // Round 7 — 30/60/90 forecast revised:
  //   · Cash-only (bank/savings/cash/investment). Credit + loan are tracked
  //     separately because they don't hold cash you can spend; mixing them
  //     inflates the negative balances and breaks the projection's meaning.
  //   · Adds previous 30/60/90 days of ACTUALS (from settled transactions)
  //     alongside the forward windows so you can sanity-check the forecast
  //     against lived history — "is what we're projecting realistic?"
  const CASH_ACCOUNT_TYPES = ['checking','savings','cash','investment'];
  const forecast = (() => {
    const today = currentDate;
    const horizon = (days) => {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + days);
      return d.toISOString().slice(0, 10);
    };
    const lookback = (days) => {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - days);
      return d.toISOString().slice(0, 10);
    };
    const fw = { '30': horizon(30), '60': horizon(60), '90': horizon(90) };
    const bw = { '30': lookback(30), '60': lookback(60), '90': lookback(90) };
    const todayISO = today.toISOString().slice(0, 10);

    const cashAccounts = (accounts || []).filter(a => CASH_ACCOUNT_TYPES.includes(a.type));
    const perAccount = {};
    cashAccounts.forEach(a => {
      // "Now" and the forward windows seed from the DERIVED balance (opening +
      // cleared history), not the stored literal, so the forecast moves with the
      // ledger and ties out to the primary card's "Right now".
      const now = liveBalance(a);
      perAccount[a.id] = {
        id: a.id, name: a.name, fragment: a.fragment, type: a.type,
        balance: now, isPrimary: !!a.isPrimary,
        // forward windows
        w30: now, w60: now, w90: now,
        // backward windows — net cash movement over the prior period (sum of actuals)
        a30: 0, a60: 0, a90: 0,
      };
    });

    // Forward projection from upcoming
    upcoming.forEach(t => {
      if (!t.accountId || !(t.accountId in perAccount)) return;
      if (t.date <= fw['30']) perAccount[t.accountId].w30 += (t.amount || 0);
      if (t.date <= fw['60']) perAccount[t.accountId].w60 += (t.amount || 0);
      if (t.date <= fw['90']) perAccount[t.accountId].w90 += (t.amount || 0);
    });

    // Trailing actuals from settled transactions (date <= today and >= lookback)
    (data.transactions || []).forEach(t => {
      if (!t.accountId || !(t.accountId in perAccount)) return;
      if (!t.date || t.date > todayISO) return; // future tx already counted in forward
      if (t.date >= bw['30']) perAccount[t.accountId].a30 += (t.amount || 0);
      if (t.date >= bw['60']) perAccount[t.accountId].a60 += (t.amount || 0);
      if (t.date >= bw['90']) perAccount[t.accountId].a90 += (t.amount || 0);
    });

    return Object.values(perAccount);
  })();
  // Cash-only totals for the "Total cash" row below the per-account grid.
  const forecastTotals = forecast.reduce((acc, f) => ({
    balance: acc.balance + (f.balance || 0),
    w30: acc.w30 + (f.w30 || 0), w60: acc.w60 + (f.w60 || 0), w90: acc.w90 + (f.w90 || 0),
    a30: acc.a30 + (f.a30 || 0), a60: acc.a60 + (f.a60 || 0), a90: acc.a90 + (f.a90 || 0),
  }), { balance: 0, w30: 0, w60: 0, w90: 0, a30: 0, a60: 0, a90: 0 });

  // Per-row shortfall: if projected balance after this charge drops below FUNDS_BUFFER,
  // record how much short we'd be (using the buffer as the floor).
  const shortfallFor = (t) => {
    if (txView !== 'upcoming') return 0;
    const proj = projectedAfter[t.id];
    if (proj === undefined || proj >= FUNDS_BUFFER) return 0;
    return FUNDS_BUFFER - proj;
  };

  const openTransfer = (t) => {
    const short = shortfallFor(t);
    if (short <= 0) return;
    const otherAccounts = (accounts || []).filter(a => a.id !== t.accountId && a.balance > 0);
    const best = otherAccounts.sort((a, b) => b.balance - a.balance)[0];
    setTransferContext({ targetAccountId: t.accountId, shortfall: short, txDescription: t.description, txAmount: t.amount });
    setTransferAmount(Math.ceil(short));
    setTransferSourceId(best ? best.id : '');
  };
  const closeTransfer = () => { setTransferContext(null); setTransferSourceId(''); setTransferAmount(0); };
  const executeTransfer = () => {
    if (!transferContext || !transferSourceId) return;
    const amt = parseFloat(transferAmount) || 0;
    if (amt <= 0) { alert('Transfer amount must be positive.'); return; }
    const src = (accounts || []).find(a => a.id === transferSourceId);
    const tgt = (accounts || []).find(a => a.id === transferContext.targetAccountId);
    if (!src || !tgt) { alert('Source or target account missing.'); return; }
    const today = currentDate.toISOString().slice(0, 10);
    // Two paired transactions, both marked as transfers so they don't muddy expense math
    addTransaction({ date: today, accountId: src.id, amount: -amt, description: `Transfer to ${tgt.name}${tgt.fragment ? ' ' + tgt.fragment : ''}`, category: 'transfer' });
    addTransaction({ date: today, accountId: tgt.id, amount: amt, description: `Transfer from ${src.name}${src.fragment ? ' ' + src.fragment : ''}`, category: 'transfer' });
    closeTransfer();
  };

  // ---- CSV import helpers ----------------------------------------------------
  // Minimal RFC 4180-ish CSV splitter (handles quoted commas + escaped quotes).
  const parseCsvLine = (line) => {
    const out = [];
    let cur = '';
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (inQ) {
        if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
        else if (c === '"') inQ = false;
        else cur += c;
      } else {
        if (c === ',') { out.push(cur); cur = ''; }
        else if (c === '"') inQ = true;
        else cur += c;
      }
    }
    out.push(cur);
    return out.map(s => s.trim());
  };
  const normalizeDate = (s) => {
    if (!s) return '';
    // Try ISO YYYY-MM-DD first
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    // MM/DD/YYYY
    let m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
    if (m) {
      let [, mo, da, yr] = m;
      if (yr.length === 2) yr = (parseInt(yr) > 50 ? '19' : '20') + yr;
      return `${yr}-${mo.padStart(2,'0')}-${da.padStart(2,'0')}`;
    }
    // MM-DD-YYYY
    m = s.match(/^(\d{1,2})-(\d{1,2})-(\d{2,4})$/);
    if (m) {
      let [, mo, da, yr] = m;
      if (yr.length === 2) yr = (parseInt(yr) > 50 ? '19' : '20') + yr;
      return `${yr}-${mo.padStart(2,'0')}-${da.padStart(2,'0')}`;
    }
    return s; // give up, show raw
  };
  const csvParsed = (() => {
    if (!csvRaw.trim()) return { rows: [], headers: [], idx: {}, errors: [] };
    const lines = csvRaw.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length === 0) return { rows: [], headers: [], idx: {}, errors: ['File is empty.'] };
    const headers = parseCsvLine(lines[0]).map(h => h.toLowerCase());
    const findCol = (...names) => {
      for (const n of names) {
        const i = headers.indexOf(n);
        if (i !== -1) return i;
      }
      return -1;
    };
    const idx = {
      date: findCol('transaction date', 'date', 'posted date', 'post date'),
      desc: findCol('description', 'details', 'memo', 'name', 'payee'),
      amount: findCol('amount', 'debit', 'transaction amount'),
      credit: findCol('credit'),
      category: findCol('category', 'type'),
    };
    const errors = [];
    if (idx.date === -1) errors.push('No Date column found.');
    if (idx.desc === -1) errors.push('No Description column found.');
    if (idx.amount === -1 && idx.credit === -1) errors.push('No Amount column found.');
    if (errors.length) return { rows: [], headers, idx, errors };
    const rows = lines.slice(1).map((line, i) => {
      const cells = parseCsvLine(line);
      const rawDate = cells[idx.date] || '';
      const date = normalizeDate(rawDate);
      const desc = cells[idx.desc] || '';
      let amt = 0;
      if (idx.amount !== -1 && cells[idx.amount]) amt = parseFloat(cells[idx.amount].replace(/[$,]/g, '')) || 0;
      else if (idx.credit !== -1 && cells[idx.credit]) amt = parseFloat(cells[idx.credit].replace(/[$,]/g, '')) || 0;
      if (csvFlipSign) amt = -amt;
      const category = idx.category !== -1 ? (cells[idx.category] || 'other').toLowerCase() : 'other';
      const ok = !!date && !!desc && /^\d{4}-\d{2}-\d{2}$/.test(date);
      return { lineNo: i + 2, rawDate, date, desc, amount: amt, category, ok };
    });
    return { rows, headers, idx, errors };
  })();

  const importCsv = () => {
    if (!csvAccountId) { setCsvError('Pick a target account first.'); return; }
    const valid = csvParsed.rows.filter(r => r.ok);
    if (valid.length === 0) { setCsvError('No valid rows to import.'); return; }
    // Bank-file rows go through the SAME validation gate — each parsed row is a
    // candidate (category auto-picked from the description) the user previews +
    // confirms before it commits. No silent bulk insert.
    const cands = valid.map(r => candidateFromBankRow(
      { date: r.date, amount: r.amount, description: r.desc.slice(0, 200), category: r.category },
      { accountId: csvAccountId, categoryRules: data?.categoryRules },
    ));
    const acctName = (accounts.find(a => a.id === csvAccountId) || {}).name || 'account';
    recordLoopRun({ key: 'upload-import', status: 'success', processed: valid.length, detail: `${acctName} · CSV/Excel (review)` });
    setCsvOpen(false);
    setCsvRaw('');
    setCsvError('');
    openValidation(cands, `Review ${cands.length} imported transaction${cands.length === 1 ? '' : 's'}`);
  };
  // Bulk import — drop MANY statement files at once, each AUTO-ROUTED to its
  // account by filename, deduped (FITID/content) so a re-upload or overlapping
  // files can never double-count. For multi-account months + client onboarding.
  const onBulkFiles = async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    setBulkBusy(`Reading ${files.length} file(s)…`); setBulkPlan(null); setCsvError('');
    try {
      const parsed = [];
      for (const f of files) {
        const text = await statementFileToCsv(f);
        parsed.push({ name: f.name, rows: parseDelimitedToRows(text, { flipSign: csvFlipSign }).rows });
      }
      setBulkPlan(planBulkImport(parsed, accounts, data.transactions || [], csvAccountId || null));
    } catch (e) {
      setBulkPlan(null); setCsvError(`Could not read files: ${e.message || 'error'}`);
    } finally { setBulkBusy(''); }
  };
  const commitBulk = () => {
    if (!bulkPlan || !bulkPlan.totalNew) return;
    // Same gate for the multi-file bank import: every routed row becomes a
    // reviewable candidate (its account is already resolved by planBulkImport).
    const cands = bulkPlan.routed.flatMap(b => b.txns.map(t => candidateFromBankRow(
      { date: t.date, amount: t.amount, description: t.description, category: t.category },
      { accountId: t.accountId, categoryRules: data?.categoryRules },
    )));
    recordLoopRun({ key: 'upload-import', status: 'success', processed: bulkPlan.totalNew, detail: `bulk · ${bulkPlan.routed.length} accounts (review)` });
    setBulkPlan(null); setCsvOpen(false);
    openValidation(cands, `Review ${cands.length} imported transaction${cands.length === 1 ? '' : 's'}`);
  };
  const onCsvFile = (file) => {
    if (!file) return;
    // Excel (.xlsx/.xls) is parsed to CSV text first (lazy SheetJS), then flows
    // through the SAME proven CSV mapper + importCsv -> addTransaction -> ledger
    // path that drives the derived balance. Reading an .xlsx as plain text used
    // to yield binary garbage -> zero rows (the bug that broke the upload).
    if (isSpreadsheetFile(file)) {
      setCsvError('Reading spreadsheet…');
      statementFileToCsv(file)
        .then((csv) => { setCsvRaw(csv); setCsvError(''); })
        .catch((err) => setCsvError(`Could not read the spreadsheet: ${err.message || 'unknown error'}`));
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => { setCsvRaw(String(e.target.result || '')); setCsvError(''); };
    reader.onerror = () => setCsvError('Could not read file.');
    reader.readAsText(file);
  };

  const renderRow = (t) => {
    const acc = accounts.find(a => a.id === t.accountId);
    // Phase 2A — label for ingest entries that haven't been linked to an
    // account yet: show the institution + last4 from the QFX so the user
    // recognizes which account it came from.
    const ingestLabel = t._source === 'bank-ingest'
      ? `${(t._institution || 'imported').replace(/_.*$/,'').replace(/(\d{4})$/, ' ····$1')}${acc ? '' : ' · unlinked'}`
      : null;
    const accLabel = acc
      ? `${acc.name}${acc.fragment ? ' ' + acc.fragment : ''}`
      : (t._source === 'recurring' ? 'Recurring obligation' : (ingestLabel || '—'));
    const currentBal = acc ? balanceByAccount[acc.id] : null;
    const afterBal = txView === 'upcoming' && acc && projectedAfter[t.id] !== undefined ? projectedAfter[t.id] : null;
    return (
      <React.Fragment key={t.id}>
      <tr className="border-b border-[#E8E4DC] align-top">
        <td className="p-2 text-xs whitespace-nowrap" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{String(t.date || '').slice(5)}</td>
        <td className="p-2">
          <div style={{ fontFamily: '"Fraunces", serif' }}>{t.description}</div>
          <div className="text-[0.625rem] text-[#5A5751] mt-0.5">
            <span>{accLabel}</span>
            {currentBal !== null && <span className={`ml-1 ${currentBal < 0 ? 'text-[#B85838]' : 'text-[#5A5751]'}`} style={{ fontFamily: '"JetBrains Mono", monospace' }}>(now {fmt(currentBal)})</span>}
            {t.category && <span className="ml-2 uppercase tracking-wider">· {t.category}</span>}
            {t._source === 'recurring' && <span className="ml-2 text-[#B85838] uppercase tracking-wider">· recurring · {t._frequency}</span>}
            {/* Phase 2A — ingest provenance + reconcile status pills. Stays
                quiet on plain manual entries so the existing UX is unchanged. */}
            {t._source === 'bank-ingest' && (
              <span className="ml-2 inline-block px-1.5 py-0.5 text-[0.5625rem] uppercase tracking-wider"
                style={{ backgroundColor: '#1F6FEB22', color: '#1F6FEB', border: '1px solid #1F6FEB' }}
                title={`Imported from bank QFX${t._fitid ? ' · FITID ' + t._fitid : ''}`}>
                bank
              </span>
            )}
            {t._source === 'gmail-ingest' && (
              <span className="ml-2 inline-block px-1.5 py-0.5 text-[0.5625rem] uppercase tracking-wider"
                style={{ backgroundColor: '#DB444422', color: '#DB4444', border: '1px solid #DB4444' }}
                title="Imported from Gmail finance event">
                gmail
              </span>
            )}
            {t._ingestMatched && (
              <span className="ml-2 inline-block px-1.5 py-0.5 text-[0.5625rem] uppercase tracking-wider"
                style={{ backgroundColor: '#16A34A22', color: '#16A34A', border: '1px solid #16A34A' }}
                title="A bank-ingested transaction matches this manual entry — verified.">
                ✓ bank-confirmed
              </span>
            )}
            {/* Stored, evidence-backed reconciliation (migration 0036). Only
                paints when the itemized invoices actually roll up to this one
                debit (isReconciled) — a green badge always means the math held.
                Sits beside the derived bank-confirmed badge above. */}
            {t.reconciliation?.matched && isReconciled(t.reconciliation, t.amount) && (
              <span className="ml-2 inline-block px-1.5 py-0.5 text-[0.5625rem] uppercase tracking-wider"
                style={{ backgroundColor: '#16A34A22', color: '#16A34A', border: '1px solid #16A34A' }}
                title={`Reconciled to the bank withdrawal${(t.reconciliation.matched_to || []).includes('email') ? ' (confirmed by receipt email)' : ''}. ${(t.reconciliation.orders || []).length} invoice(s) roll up to ${fmt(t.reconciliation.total)}.`}>
                ✓ matched to bank{(t.reconciliation.matched_to || []).includes('email') ? ' · email' : ''}
              </span>
            )}
            {/* Emailed-receipt itemization present + reconciles → a distinct
                "receipt verified" badge. Only paints when the line items sum to
                the same bank debit (receiptVerification), so like the bank badge
                a green here always means the two sources agree. */}
            {hasReceiptItems(t.reconciliation) && receiptVerification(t.reconciliation, t.amount).verified && (
              <span className="ml-2 inline-block px-1.5 py-0.5 text-[0.5625rem] uppercase tracking-wider text-[#5A6E3D]"
                style={{ backgroundColor: '#5A6E3D22', border: '1px solid #5A6E3D' }}
                title={`Itemized receipt from ${t.reconciliation.merchant || 'the vendor email'} reconciles to this charge — item detail verified. Expand below.`}>
                ✓ receipt verified
              </span>
            )}
            {hasReceiptItems(t.reconciliation) && !receiptVerification(t.reconciliation, t.amount).verified && (
              <span className="ml-2 inline-block px-1.5 py-0.5 text-[0.5625rem] uppercase tracking-wider text-[#B85838]"
                style={{ backgroundColor: '#B8583822', border: '1px solid #B85838' }}
                title={`Receipt found but it does not reconcile to the bank amount — flagged to Concerns: ${receiptVerification(t.reconciliation, t.amount).reason}`}>
                ! receipt mismatch
              </span>
            )}
            {t._status && t._source === 'bank-ingest' && t._status !== 'unknown' && (
              <span className="ml-2 inline-block px-1.5 py-0.5 text-[0.5625rem] uppercase tracking-wider"
                style={{
                  backgroundColor: (t._status === 'verified' ? '#16A34A' : t._status === 'unexplained' ? '#DC2626' : '#D97706') + '22',
                  color: t._status === 'verified' ? '#16A34A' : t._status === 'unexplained' ? '#DC2626' : '#D97706',
                  border: `1px solid ${t._status === 'verified' ? '#16A34A' : t._status === 'unexplained' ? '#DC2626' : '#D97706'}`
                }}
                title={`Reconcile status: ${t._status}`}>
                {t._status}
              </span>
            )}
          </div>
          {/* Emailed-receipt itemization (Walmart/Walgreens/Amazon…): the line
              items behind this one charge + the category split + item-level
              verification. Rendered instead of the invoice rollup below when the
              reconciliation carries receipt items[]. */}
          {t.reconciliation?.matched && hasReceiptItems(t.reconciliation) && (
            <ReceiptItemization reconciliation={t.reconciliation} amount={t.amount} txCategory={t.category} />
          )}
          {/* Invoice rollup (migration 0036): one bank debit, several merchant
              invoices. Shows that the parts sum to the whole so the single
              ledger amount is never mistaken for triple-counting. The receipt
              path above owns the itemized case; this stays the invoice case. */}
          {t.reconciliation?.matched && !hasReceiptItems(t.reconciliation) && Array.isArray(t.reconciliation.orders) && t.reconciliation.orders.length > 0 && (
            <details className="mt-1 text-[0.6875rem]">
              <summary className="cursor-pointer text-[#5A5751] hover:text-[#1A1815] select-none" style={{ fontFamily: '"Fraunces", serif' }}>
                {t.reconciliation.orders.length} invoices → one {t.reconciliation.method === 'visa-debit' ? 'debit' : 'charge'}{t.reconciliation.card_last4 ? ` ···${t.reconciliation.card_last4}` : ''} · {fmt(t.reconciliation.total)}
              </summary>
              <div className="mt-1 pl-3 border-l-2 border-[#E8E4DC] space-y-1">
                {t.reconciliation.orders.map((o, oi) => (
                  <div key={oi} className="flex items-baseline justify-between gap-2">
                    <span className="text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
                      {o.patient ? `${o.patient} · ` : ''}{o.lines && o.lines.length ? o.lines.join(' + ') : (o.order ? `Order ${o.order}` : 'Invoice')}
                    </span>
                    <span className="text-[#1A1815] whitespace-nowrap" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{fmt(o.paid)}</span>
                  </div>
                ))}
                <div className="flex items-baseline justify-between gap-2 pt-1 border-t border-[#E8E4DC] font-semibold">
                  <span className="uppercase tracking-wider text-[0.5625rem] text-[#5A6E3D]">rolls up to bank debit</span>
                  <span className="text-[#5A6E3D] whitespace-nowrap" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{fmt(t.reconciliation.total)}</span>
                </div>
              </div>
            </details>
          )}
          {afterBal !== null && (() => {
            const short = shortfallFor(t);
            return (
              <>
                <div className={`text-[0.625rem] mt-0.5 ${afterBal < 0 ? 'text-[#B85838] font-semibold' : short > 0 ? 'text-[#B85838]' : 'text-[#5A6E3D]'}`} style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                  {afterBal < 0 ? '⚠ ' : short > 0 ? '⚐ ' : '→ '}After this hits: {fmt(afterBal)}
                  {short > 0 && afterBal >= 0 && <span className="ml-1">(below {fmt(FUNDS_BUFFER)} buffer)</span>}
                </div>
                {short > 0 && (
                  <button type="button" onClick={() => openTransfer(t)} className="mt-1 text-[0.625rem] uppercase tracking-wider px-2 py-0.5 border border-[#B85838] text-[#B85838] hover:bg-[#B85838] hover:text-white">
                    ⚐ Cover with transfer
                  </button>
                )}
              </>
            );
          })()}
        </td>
        <td className={`p-2 text-right whitespace-nowrap ${t.amount < 0 ? 'text-[#B85838]' : 'text-[#5A6E3D]'}`} style={{ fontFamily: '"JetBrains Mono", monospace' }}>{t.amount > 0 ? '+' : ''}{fmt(t.amount)}</td>
        <td className="p-2 text-right whitespace-nowrap">
          {t._source === 'bank-ingest' ? (
            // Phase 2E — ingest rows are read-only on the NAS side, but the
            // user can promote them into the manual ledger. Two flows: Review
            // (open prefilled form to adjust category) and Quick (file as-is
            // with the suggested category). Once accepted, the next ingest
            // refresh tags the ingest row's dedupe key against the new
            // manual entry and the bank-confirmed badge appears.
            // Phase 2F — third action: mark as noise. Writes back to the
            // workflow-16 state file via workflow 19, then the row stays
            // suppressed across refreshes. Used for fee reversals, internal
            // transfers, and other junk that shouldn't surface in the work
            // queue but isn't really worth a manual ledger entry either.
            <span className="inline-flex items-center gap-1 flex-wrap justify-end">
              <button type="button" onClick={() => acceptIngest(t, 'review')} aria-label={`Review and accept ${t.description} as manual entry`} className="text-xs uppercase tracking-wider text-[#1F6FEB] hover:bg-[#1F6FEB] hover:text-white border border-[#1F6FEB] px-3 py-1.5 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">✎ Review</button>
              <span aria-hidden="true" className="h-5 w-px bg-[#E8E4DC]" />
              <button type="button" onClick={() => acceptIngest(t, 'quick')} aria-label={`Quick accept ${t.description} as manual entry with suggested category`} title={`File as manual entry · category guess: ${suggestCategory(t.description)}`} className="text-xs uppercase tracking-wider text-[#5A6E3D] hover:bg-[#5A6E3D] hover:text-white border border-[#5A6E3D] px-3 py-1.5 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">✓ Accept</button>
              <span aria-hidden="true" className="h-5 w-px bg-[#E8E4DC]" />
              <button type="button" onClick={() => { if (confirm(`Mark "${t.description}" as noise? It will stop appearing in 'Needs attention' across all devices.`)) markNoise(t); }} aria-label={`Mark ${t.description} as noise and hide from needs-attention`} title="Mark as noise — fee reversal, internal transfer, or other non-actionable row" className="text-xs uppercase tracking-wider text-[#5A5751] hover:bg-[#5A5751] hover:text-white border border-[#5A5751] px-3 py-1.5 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">🗑 Noise</button>
            </span>
          ) : t._source !== 'recurring' && (
            <span className="inline-flex items-center gap-1">
              <button type="button" onClick={() => editingId === t.id ? cancel() : startEdit(t)} aria-expanded={editingId === t.id} aria-label={editingId === t.id ? `Cancel edit for ${t.description}` : `Edit transaction ${t.description}`} className="text-xs uppercase tracking-wider text-[#5A5751] hover:text-[#1A1815] hover:bg-[#FAF8F4] border border-transparent hover:border-[#1A1815] px-3 py-1.5 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">{editingId === t.id ? '× Cancel' : '✎ Edit'}</button>
              <span aria-hidden="true" className="h-5 w-px bg-[#E8E4DC]" />
              <button type="button" onClick={() => confirmDelete(t)} aria-label={`Delete transaction ${t.description}`} className="text-xs uppercase tracking-wider text-[#5A5751] hover:text-[#B85838] hover:bg-[#FAF8F4] border border-transparent hover:border-[#B85838] px-3 py-1.5 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">Delete</button>
            </span>
          )}
        </td>
      </tr>
      {/* r32 — Inline edit row spans all 4 columns. Per IN-PLACE-FIRST + EDITABLE-EVERYWHERE. */}
      {editingId === t.id && (
        <tr className="border-b border-[#B85838]">
          <td colSpan={4} className="p-3 bg-[#FAF8F4] border-l-4 border-[#B85838]">
            <div className="space-y-2">
              <div className="text-[0.625rem] uppercase tracking-[0.2em] text-[#B85838] font-medium">Quick edit · {t.description}</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div><label className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Date</label><input type="date" className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
                <div><label className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Amount (+ in / − out)</label><input type="number" step="0.01" className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></div>
                <div><label className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Account</label><select className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={form.accountId} onChange={e => setForm({ ...form, accountId: e.target.value })}>{accounts.map(a => <option key={a.id} value={a.id}>{a.name}{a.fragment ? ' ' + a.fragment : ''}</option>)}</select></div>
                <div><label className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Category</label><select className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{TX_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
              </div>
              <div><label className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Description</label><input className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
              <div><label className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Entity override (optional)</label><select className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={form.entityOverride} onChange={e => setForm({ ...form, entityOverride: e.target.value })}><option value="">— No override —</option>{entities.map(en => <option key={en.id} value={en.id}>{entityLabel(en)}</option>)}</select></div>
              <div className="flex gap-2">
                <button type="button" onClick={submit} className="flex-1 bg-[#1A1815] text-white px-4 py-2 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]">Save changes</button>
                <button type="button" onClick={cancel} className="px-4 py-2 border border-[#1A1815] text-xs uppercase tracking-wider hover:bg-white focus:outline focus:outline-2 focus:outline-[#B85838]">Cancel</button>
              </div>
              <TxHistory recordEvents={data.recordEvents || []} txId={t.id} />
            </div>
          </td>
        </tr>
      )}
      </React.Fragment>
    );
  };

  // Human account name for sorting + the filter dropdown.
  const acctName = (id) => (accounts.find(a => a.id === id) || {}).name || id || '—';
  // History → filter (account / date range / text) then sort by the active column.
  const historyView = sortTransactions(
    filterTransactions(history, { accountId: acctFilter, dateFrom, dateTo, search: txSearch }),
    sortKey, sortDir, acctName,
  );
  const list = txView === 'upcoming' ? upcoming : historyView;
  // Evaluate view runs the same filtered set through the income-vs-outflow math.
  const evalSummary = categorySummary(historyView);
  // Verify/categorize scoreboard — categorized (verified) vs still needs review.
  const evalReview = reviewStatus(historyView);

  return (
    <div className="space-y-6">
      <section className="bg-white border border-[#1A1815] p-5 sm:p-6">
        <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] mb-2 font-medium">Transactions · Upcoming · History · Add</div>
        <h2 className="text-2xl mb-3" style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>Every dollar in. Every dollar out. Every dollar coming.</h2>
        <p className="text-base leading-relaxed" style={{ fontFamily: '"Fraunces", serif' }}>
          Add transactions as they happen. See what is already cleared (History) and what is expected to hit next (Upcoming, including the next instance of each enabled recurring obligation). Filters carry through from Entities. Projections, funds-available checks, and the transfer-from popup come in the next pass.
        </p>
      </section>

      {(() => {
        const primary = (accounts || []).find(a => a.isPrimary) || (accounts || []).find(a => a.type === 'checking') || (accounts || [])[0];
        if (!primary) return null;
        // "Right now" is DERIVED from this account's cleared ledger, not the
        // stored literal. Then project after all upcoming charges that hit it.
        const rightNow = liveBalance(primary);
        const futureImpact = upcoming.filter(t => t.accountId === primary.id).reduce((s, t) => s + (t.amount || 0), 0);
        const projected = rightNow + futureImpact;
        return (
          <section className="bg-white border-2 border-[#1A1815] p-4 sm:p-5">
            <div className="flex items-baseline justify-between gap-3 flex-wrap mb-2">
              <div>
                <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] font-semibold">★ Primary Bill-Pay Account</div>
                <div className="text-sm text-[#5A5751] mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>{primary.name}{primary.fragment ? ' ' + primary.fragment : ''}</div>
              </div>
              {!primary.isPrimary && <span className="text-[0.625rem] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>Mark one account as primary in Accounts to lock this</span>}
            </div>
            <div className="grid grid-cols-2 gap-px bg-[#E8E4DC] border border-[#E8E4DC]">
              <div className="bg-white p-3">
                <div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Right now</div>
                <div className={`text-2xl ${rightNow < 0 ? 'text-[#B85838]' : 'text-[#1A1815]'}`} style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 600 }}>{fmt(rightNow)}</div>
              </div>
              <div className="bg-white p-3">
                <div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">After upcoming charges clear</div>
                <div className={`text-2xl ${projected < 0 ? 'text-[#B85838]' : 'text-[#5A6E3D]'}`} style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 600 }}>{fmt(projected)}</div>
              </div>
            </div>
            <p className="text-[0.625rem] text-[#5A5751] italic mt-2" style={{ fontFamily: '"Fraunces", serif' }}>
              Full balances for every account live at the bottom of this tab. Each row also shows that account's current balance inline.
            </p>
          </section>
        );
      })()}

      {/* Photo/OCR receipt capture + emailed receipts — both hand candidates to
          the ONE shared validation gate below (InputValidation), the same gate
          manual entries and bank-file imports use. Capture extracts; the gate
          confirms + commits. */}
      <ReceiptCapture
        transactions={data.transactions || []}
        emailReceipts={data.emailReceipts || []}
        onValidate={openValidation}
      />

      {/* The ONE shared validate -> preview -> confirm -> commit gate. Opened by
          manual add, bank-file import, captured photos, and emailed receipts —
          all reviewed identically here before anything commits. */}
      {validation && (
        <InputValidation
          candidates={validation.candidates}
          title={validation.title}
          accounts={accounts}
          transactions={data.transactions || []}
          addTransaction={addTransaction}
          updateTransaction={updateTransaction}
          onClose={() => setValidation(null)}
        />
      )}

      <section>
        {/* Tx sub-tabs route through the shared <TabScroll> primitive so they
            scroll/swipe exactly like the main nav. */}
        <TabScroll className="border-b border-[#E8E4DC] mb-3">
            {[['upcoming', `Upcoming · ${upcoming.length}`], ['history', `History · ${history.length}`], ['evaluate', 'Evaluate']].map(([id, label]) => (
              <button key={id} onClick={() => setTxView(id)} className={`px-3 py-2 whitespace-nowrap border-b-2 transition-colors ${txView === id ? 'border-[#B85838] text-[#1A1815] font-medium' : 'border-transparent text-[#5A5751] hover:text-[#1A1815]'}`}>{label}</button>
            ))}
        </TabScroll>

        <div className="flex items-baseline justify-between mb-3 gap-2 flex-wrap">
          <div className="flex gap-1 flex-wrap text-xs">
            <button type="button" onClick={() => setEntityFilter('all')} className={`px-3 py-1.5 border ${entityFilter === 'all' ? 'border-[#1A1815] bg-[#1A1815] text-white' : 'border-[#E8E4DC] text-[#5A5751]'}`}>All</button>
            {((Array.isArray(visibleEntities) ? visibleEntities : null) || entities).map(e => <button key={e.id} onClick={() => setEntityFilter(e.id)} className={`px-3 py-1.5 border ${entityFilter === e.id ? 'border-[#1A1815] bg-[#1A1815] text-white' : 'border-[#E8E4DC] text-[#5A5751]'}`}>{entityLabel(e)}</button>)}
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setCsvOpen(true)} className="text-[0.625rem] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815]">📤 Import CSV</button>
            <button type="button" onClick={() => showForm ? cancel() : startAdd()} className="text-[0.625rem] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815]">{showForm ? '× Cancel' : '+ Add transaction'}</button>
          </div>
        </div>

        {/* Work-the-data filter bar — account / date range / text. Drives both
            History (the table) and Evaluate (the income-vs-outflow math) since
            both read the same filtered set. Hidden on Upcoming. */}
        {txView !== 'upcoming' && (
          <div className="mb-3 flex items-end gap-2 flex-wrap text-xs bg-white border border-[#E8E4DC] p-2.5">
            <label className="flex flex-col gap-1">
              <span className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Account</span>
              <select value={acctFilter} onChange={e => setAcctFilter(e.target.value)} className="p-1.5 border border-[#E8E4DC] bg-[#FAF8F4] text-xs">
                <option value="all">All accounts</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}{a.fragment ? ' ' + a.fragment : ''}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">From</span>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="p-1.5 border border-[#E8E4DC] bg-[#FAF8F4] text-xs" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">To</span>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="p-1.5 border border-[#E8E4DC] bg-[#FAF8F4] text-xs" />
            </label>
            <label className="flex flex-col gap-1 flex-1 min-w-[8rem]">
              <span className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Search payee · category</span>
              <input type="text" value={txSearch} onChange={e => setTxSearch(e.target.value)} placeholder="e.g. Zelle, groceries" className="p-1.5 border border-[#E8E4DC] bg-[#FAF8F4] text-xs" />
            </label>
            {(acctFilter !== 'all' || dateFrom || dateTo || txSearch) && (
              <button type="button" onClick={() => { setAcctFilter('all'); setDateFrom(''); setDateTo(''); setTxSearch(''); }} className="p-1.5 border border-[#E8E4DC] text-[#B85838] hover:text-[#1A1815] uppercase tracking-wider text-[0.5625rem]">Clear</button>
            )}
            <span className="text-[0.5625rem] text-[#5A5751] self-center ml-auto">{historyView.length} of {history.length}</span>
          </div>
        )}

        {/* Phase 2C — reconcile-status pills. Only show when there are
            ingest rows in the merged feed; otherwise this is just clutter. */}
        {statusCounts.all > (data.transactions || []).length && (
          <div className="mb-3 flex items-center gap-1 flex-wrap text-[0.625rem]">
            <span className="uppercase tracking-wider text-[#5A5751] mr-1">Filter</span>
            {[
              ['all', `All · ${statusCounts.all}`, '#1A1815'],
              ['needs-attention', `Needs attention · ${statusCounts['needs-attention']}`, '#B85838'],
              ['unexplained', `Unexplained · ${statusCounts.unexplained}`, '#DC2626'],
              ['unconfirmed', `Unconfirmed · ${statusCounts.unconfirmed}`, '#D97706'],
              ['verified', `Verified · ${statusCounts.verified}`, '#16A34A'],
              ['noise-skip', `Noise · ${statusCounts['noise-skip']}`, '#5A5751'],
            ].map(([id, label, color]) => (
              <button key={id} type="button" onClick={() => setStatusFilter(id)} className={`px-2 py-1 border uppercase tracking-wider ${statusFilter === id ? 'text-white' : 'text-[#5A5751]'}`} style={{ backgroundColor: statusFilter === id ? color : 'transparent', borderColor: statusFilter === id ? color : '#E8E4DC' }} title={`Show ${id === 'all' ? 'all rows' : id === 'needs-attention' ? 'unexplained + unconfirmed bank rows' : id + ' bank rows'} (manual entries always shown)`}>
                {label}
              </button>
            ))}
          </div>
        )}

        {/* r32 — Top form for Add only; edit happens inline under the row. */}
        {showForm && !editingId && (
          <div className="bg-white border border-[#B85838] p-4 mb-3 space-y-3">
            <div className="text-[0.625rem] uppercase tracking-[0.2em] text-[#B85838] font-medium">New transaction</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <label className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Date</label>
                <input type="date" className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
              </div>
              <div>
                <label className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Amount (+ in / − out)</label>
                <input type="number" step="0.01" className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" placeholder="-49.99" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
              </div>
              <div>
                <label className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Account</label>
                <select className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={form.accountId} onChange={e => setForm({ ...form, accountId: e.target.value })}>
                  {accounts.length === 0 && <option value="">— Add an account first —</option>}
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name}{a.fragment ? ' ' + a.fragment : ''}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Category</label>
                <select className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  {TX_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Description</label>
              <input className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" placeholder="e.g., Costco · groceries" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <label className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Entity override (optional — defaults to account entity)</label>
              <select className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={form.entityOverride} onChange={e => setForm({ ...form, entityOverride: e.target.value })}>
                <option value="">— No override —</option>
                {entities.map(en => <option key={en.id} value={en.id}>{entityLabel(en)}</option>)}
              </select>
            </div>
            <button type="button" onClick={submit} className="w-full bg-[#1A1815] text-[#FAF8F4] py-2 text-xs uppercase tracking-wider hover:bg-[#B85838]">{editingId ? 'Save Changes' : 'Save Transaction'}</button>
          </div>
        )}

        {txView === 'evaluate' ? (
          /* EVALUATE — the real picture: derived balance per account + income
             vs outflow by category, over the current filter. Pure math from
             transaction-analysis.js; reconciles to the sum of amounts. */
          <div className="space-y-4">
            <section className="bg-white border-2 border-[#1A1815] p-4">
              <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] font-semibold mb-3">Derived balance per account · cleared ledger</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-[#E8E4DC] border border-[#E8E4DC]">
                {accounts.filter(a => acctFilter === 'all' || a.id === acctFilter).map(a => {
                  const bal = liveBalance(a);
                  return (
                    <div key={a.id} className="bg-white p-3">
                      <div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] truncate">{a.name}{a.fragment ? ' ' + a.fragment : ''}</div>
                      <div className={`text-lg ${bal < 0 ? 'text-[#B85838]' : 'text-[#1A1815]'}`} style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 600 }}>{fmt(bal)}</div>
                    </div>
                  );
                })}
              </div>
            </section>
            <section className="bg-white border border-[#1A1815] p-4">
              <div className="flex items-baseline justify-between gap-2 flex-wrap mb-3">
                <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] font-semibold">Verify · categorize</div>
                <div className="text-[0.625rem] text-[#5A5751]">{evalReview.pctCategorized}% categorized</div>
              </div>
              <div className="grid grid-cols-3 gap-px bg-[#E8E4DC] border border-[#E8E4DC]">
                <div className="bg-white p-3"><div className="text-[0.5625rem] uppercase tracking-wider text-[#5A6E3D]">Categorized</div><div className="text-base text-[#5A6E3D]" style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 600 }}>{evalReview.categorized.toLocaleString()}</div></div>
                <div className="bg-white p-3"><div className="text-[0.5625rem] uppercase tracking-wider text-[#B85838]">Needs review</div><div className="text-base text-[#B85838]" style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 600 }}>{evalReview.needsReview.toLocaleString()}</div></div>
                <div className="bg-white p-3"><div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Total</div><div className="text-base text-[#1A1815]" style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 600 }}>{evalReview.total.toLocaleString()}</div></div>
              </div>
              <p className="text-[0.625rem] text-[#5A5751] mt-2" style={{ fontFamily: '"Fraunces", serif' }}>
                Categorized rows carry a real category (deterministic classifier + your edits). "Needs review" are still uncategorized — open a row to set its category.
              </p>
            </section>
            <section className="bg-white border border-[#1A1815] p-4">
              <div className="flex items-baseline justify-between gap-2 flex-wrap mb-3">
                <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] font-semibold">Income vs outflow · by category</div>
                <div className="text-[0.625rem] text-[#5A5751]">{evalSummary.count} transactions</div>
              </div>
              <div className="grid grid-cols-3 gap-px bg-[#E8E4DC] border border-[#E8E4DC] mb-3">
                <div className="bg-white p-3"><div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Income</div><div className="text-base text-[#5A6E3D]" style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 600 }}>{fmt(evalSummary.totalIncome)}</div></div>
                <div className="bg-white p-3"><div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Outflow</div><div className="text-base text-[#B85838]" style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 600 }}>{fmt(evalSummary.totalOutflow)}</div></div>
                <div className="bg-white p-3"><div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Net</div><div className={`text-base ${evalSummary.totalNet < 0 ? 'text-[#B85838]' : 'text-[#1A1815]'}`} style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 600 }}>{fmt(evalSummary.totalNet)}</div></div>
              </div>
              {evalSummary.categories.length === 0 ? (
                <p className="text-sm text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>No transactions in this filter yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#1A1815]">
                      <th className="text-left p-2 text-[0.625rem] uppercase tracking-wider text-[#5A5751]">Category</th>
                      <th className="text-right p-2 text-[0.625rem] uppercase tracking-wider text-[#5A5751]">In</th>
                      <th className="text-right p-2 text-[0.625rem] uppercase tracking-wider text-[#5A5751]">Out</th>
                      <th className="text-right p-2 text-[0.625rem] uppercase tracking-wider text-[#5A5751]">Net</th>
                      <th className="text-right p-2 text-[0.625rem] uppercase tracking-wider text-[#5A5751]">#</th>
                    </tr>
                  </thead>
                  <tbody>
                    {evalSummary.categories.map(c => (
                      <tr key={c.category} className="border-b border-[#E8E4DC]">
                        <td className="p-2 capitalize" style={{ fontFamily: '"Fraunces", serif' }}>{c.category}</td>
                        <td className="p-2 text-right text-[#5A6E3D]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{c.income ? fmt(c.income) : '—'}</td>
                        <td className="p-2 text-right text-[#B85838]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{c.outflow ? fmt(c.outflow) : '—'}</td>
                        <td className={`p-2 text-right ${c.net < 0 ? 'text-[#B85838]' : 'text-[#1A1815]'}`} style={{ fontFamily: '"JetBrains Mono", monospace' }}>{fmt(c.net)}</td>
                        <td className="p-2 text-right text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{c.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </div>
        ) : list.length === 0 ? (
          <div className="bg-white border border-[#E8E4DC] p-6 text-center">
            <p className="text-sm text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>
              {txView === 'upcoming'
                ? 'Nothing upcoming. Future-dated transactions and the next instance of each enabled recurring obligation will appear here.'
                : (acctFilter !== 'all' || dateFrom || dateTo || txSearch)
                  ? 'No transactions match this filter. Adjust the account, dates, or search above — or Clear to see everything.'
                  : 'No history yet. Use + Add transaction above, or add recurring obligations in the Calendar tab.'}
            </p>
          </div>
        ) : (() => {
          const totalPages = Math.max(1, Math.ceil(list.length / pageSize));
          const safePage = Math.min(page, totalPages - 1);
          const startIdx = safePage * pageSize;
          const pageItems = list.slice(startIdx, startIdx + pageSize);
          return (
            <>
              <section className="bg-white border border-[#1A1815] p-3 sm:p-5 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    {txView === 'history' ? (
                      /* Clickable sort headers — same key flips direction. */
                      <tr className="border-b border-[#1A1815]">
                        <th className="text-left p-2 text-[0.625rem] uppercase tracking-wider"><button type="button" onClick={() => toggleSort('date')} className="uppercase tracking-wider text-[#5A5751] hover:text-[#1A1815]">Date{sortArrow('date')}</button></th>
                        <th className="text-left p-2 text-[0.625rem] uppercase tracking-wider text-[#5A5751]">
                          <button type="button" onClick={() => toggleSort('payee')} className="uppercase tracking-wider text-[#5A5751] hover:text-[#1A1815]">Description{sortArrow('payee')}</button>
                          <span className="text-[#B8B2A8]"> · </span>
                          <button type="button" onClick={() => toggleSort('account')} className="uppercase tracking-wider text-[#5A5751] hover:text-[#1A1815]">Account{sortArrow('account')}</button>
                          <span className="text-[#B8B2A8]"> · </span>
                          <button type="button" onClick={() => toggleSort('category')} className="uppercase tracking-wider text-[#5A5751] hover:text-[#1A1815]">Category{sortArrow('category')}</button>
                        </th>
                        <th className="text-right p-2 text-[0.625rem] uppercase tracking-wider"><button type="button" onClick={() => toggleSort('amount')} className="uppercase tracking-wider text-[#5A5751] hover:text-[#1A1815]">Amount{sortArrow('amount')}</button></th>
                        <th className="text-right p-2 text-[0.625rem] uppercase tracking-wider text-[#5A5751]">Actions</th>
                      </tr>
                    ) : (
                      <tr className="border-b border-[#1A1815]">
                        <th className="text-left p-2 text-[0.625rem] uppercase tracking-wider text-[#5A5751]">Date</th>
                        <th className="text-left p-2 text-[0.625rem] uppercase tracking-wider text-[#5A5751]">Description · Account · Category</th>
                        <th className="text-right p-2 text-[0.625rem] uppercase tracking-wider text-[#5A5751]">Amount</th>
                        <th className="text-right p-2 text-[0.625rem] uppercase tracking-wider text-[#5A5751]">Actions</th>
                      </tr>
                    )}
                  </thead>
                  <tbody>{pageItems.map(renderRow)}</tbody>
                </table>
              </section>
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-3 gap-2 flex-wrap">
                  <button type="button" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={safePage === 0} className="text-[0.625rem] uppercase tracking-wider px-3 py-1.5 border border-[#1A1815] bg-white text-[#1A1815] hover:bg-[#1A1815] hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-[#1A1815]">« Previous</button>
                  <div className="flex items-center gap-2 text-[0.625rem] uppercase tracking-wider text-[#5A5751]">
                    <span>Page</span>
                    <select value={safePage} onChange={e => setPage(parseInt(e.target.value, 10))} className="p-1 border border-[#E8E4DC] text-xs bg-[#FAF8F4]">
                      {Array.from({ length: totalPages }).map((_, i) => <option key={i} value={i}>{i + 1}</option>)}
                    </select>
                    <span>of {totalPages} · showing {startIdx + 1}–{Math.min(startIdx + pageSize, list.length)} of {list.length}</span>
                  </div>
                  <button type="button" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={safePage >= totalPages - 1} className="text-[0.625rem] uppercase tracking-wider px-3 py-1.5 border border-[#1A1815] bg-white text-[#1A1815] hover:bg-[#1A1815] hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-[#1A1815]">Next »</button>
                </div>
              )}
            </>
          );
        })()}
      </section>

      {csvOpen && (
        <div className="fixed inset-0 z-50 bg-[#1A1815]/60 flex items-center justify-center p-4" onClick={() => setCsvOpen(false)}>
          <div className="bg-white border-2 border-[#1A1815] max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-[#1A1815] flex items-baseline justify-between gap-3 flex-wrap">
              <div>
                <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] font-semibold">📤 Import CSV</div>
                <h2 className="text-2xl mt-1" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>Drop a bank export</h2>
                <div className="text-xs text-[#5A5751] mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>
                  Chase, AMEX, Discover, and most banks export a CSV with Date / Description / Amount columns. Other columns are ignored.
                </div>
              </div>
              <button type="button" onClick={() => setCsvOpen(false)} aria-label="Close" className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] hover:text-[#1A1815]">× Close</button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">1. Target account (all rows will be assigned to this account)</label>
                <select className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={csvAccountId} onChange={e => setCsvAccountId(e.target.value)}>
                  {accounts.length === 0 && <option value="">— Add an account first —</option>}
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name}{a.fragment ? ' ' + a.fragment : ''}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">2. Pick a CSV or Excel file (.csv, .xlsx, .xls)</label>
                <input type="file" accept=".csv,text/csv,.xlsx,.xls,.xlsm,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" onChange={e => onCsvFile(e.target.files && e.target.files[0])} className="block w-full text-xs file:mr-3 file:px-3 file:py-1.5 file:bg-[#1A1815] file:text-white file:border-0 file:uppercase file:tracking-wider file:text-[0.625rem] file:hover:bg-[#B85838] file:cursor-pointer" />
              </div>

              <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ fontFamily: '"Fraunces", serif' }}>
                <input type="checkbox" checked={csvFlipSign} onChange={e => setCsvFlipSign(e.target.checked)} className="accent-[#B85838]" />
                <span>Flip the sign on every amount. <em>Tick this if your bank exports charges as positive (AMEX, some Discover exports). Chase usually doesn't need this.</em></span>
              </label>

              <div className="border-t border-[#E8E4DC] pt-3">
                <label className="text-[0.5625rem] uppercase tracking-wider text-[#B85838] font-semibold">Or BULK import — drop MANY files at once; each is auto-routed to its account by filename and duplicates are skipped (for whole months + onboarding)</label>
                <input type="file" multiple accept=".csv,text/csv,.xlsx,.xls,.xlsm,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" onChange={e => onBulkFiles(e.target.files)} className="block w-full text-xs mt-1 file:mr-3 file:px-3 file:py-1.5 file:bg-[#B85838] file:text-white file:border-0 file:uppercase file:tracking-wider file:text-[0.625rem] file:cursor-pointer" />
                {bulkBusy && <div className="text-xs text-[#5A5751] mt-1 italic" style={{ fontFamily: '"Fraunces", serif' }}>{bulkBusy}</div>}
                {bulkPlan && (
                  <div className="mt-2 bg-[#FAF8F4] border border-[#1A1815] p-2 space-y-1">
                    <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">{bulkPlan.totalNew} new · {bulkPlan.duplicates} duplicate(s) skipped · {bulkPlan.totalRows} read</div>
                    {bulkPlan.routed.map(b => (
                      <div key={b.accountId} className="text-xs text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>{b.accountName}: <strong>{b.count}</strong> transactions</div>
                    ))}
                    {bulkPlan.unrouted.map((u, i) => (
                      <div key={i} className="text-xs text-[#B85838]" style={{ fontFamily: '"Fraunces", serif' }}>{u.name}: {u.count} — {u.reason}</div>
                    ))}
                    {bulkPlan.totalNew > 0 && (
                      <button type="button" onClick={commitBulk} className="mt-1 w-full bg-[#1A1815] text-white py-2 text-[0.625rem] uppercase tracking-wider font-semibold hover:bg-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]">Import all {bulkPlan.totalNew} transactions</button>
                    )}
                  </div>
                )}
              </div>

              {csvParsed.errors.length > 0 && (
                <div className="text-xs text-[#B85838] px-3 py-2 bg-[#FAF8F4] border border-[#B85838]" role="alert" style={{ fontFamily: '"Fraunces", serif' }}>
                  {csvParsed.errors.map((er, i) => <div key={i}>· {er}</div>)}
                </div>
              )}

              {csvParsed.rows.length > 0 && (
                <div>
                  <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#5A5751] mb-2">3. Preview · {csvParsed.rows.filter(r => r.ok).length} valid / {csvParsed.rows.length} total</div>
                  <div className="border border-[#1A1815] overflow-x-auto max-h-72 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-white">
                        <tr className="border-b border-[#1A1815]">
                          <th className="text-left p-2 text-[0.625rem] uppercase tracking-wider text-[#5A5751]">Date</th>
                          <th className="text-left p-2 text-[0.625rem] uppercase tracking-wider text-[#5A5751]">Description</th>
                          <th className="text-right p-2 text-[0.625rem] uppercase tracking-wider text-[#5A5751]">Amount</th>
                          <th className="text-left p-2 text-[0.625rem] uppercase tracking-wider text-[#5A5751]">Cat</th>
                          <th className="text-left p-2 text-[0.625rem] uppercase tracking-wider text-[#5A5751]">Ok?</th>
                        </tr>
                      </thead>
                      <tbody>
                        {csvParsed.rows.slice(0, 100).map((r, i) => (
                          <tr key={i} className={`border-b border-[#E8E4DC] ${r.ok ? '' : 'bg-[#FAF8F4] opacity-60'}`}>
                            <td className="p-2 whitespace-nowrap" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{r.date || r.rawDate}</td>
                            <td className="p-2" style={{ fontFamily: '"Fraunces", serif' }}>{r.desc.slice(0, 60)}</td>
                            <td className={`p-2 text-right whitespace-nowrap ${r.amount < 0 ? 'text-[#B85838]' : 'text-[#5A6E3D]'}`} style={{ fontFamily: '"JetBrains Mono", monospace' }}>{r.amount > 0 ? '+' : ''}{fmt(r.amount)}</td>
                            <td className="p-2 text-[0.625rem] uppercase tracking-wider">{r.category}</td>
                            <td className="p-2 text-[0.625rem] uppercase tracking-wider">{r.ok ? <span className="text-[#5A6E3D]">✓</span> : <span className="text-[#B85838]">skip</span>}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {csvParsed.rows.length > 100 && <p className="text-[0.625rem] text-[#5A5751] italic mt-1" style={{ fontFamily: '"Fraunces", serif' }}>Showing first 100 rows in preview — all {csvParsed.rows.length} will import.</p>}
                </div>
              )}

              {csvError && <div className="text-xs text-[#B85838] px-3 py-2 bg-[#FAF8F4] border border-[#B85838]" role="alert" style={{ fontFamily: '"Fraunces", serif' }}>{csvError}</div>}

              <button type="button" onClick={importCsv} disabled={csvParsed.rows.filter(r => r.ok).length === 0 || !csvAccountId} className="w-full bg-[#1A1815] text-white py-3 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838] disabled:opacity-40 disabled:hover:bg-[#1A1815]">
                Import {csvParsed.rows.filter(r => r.ok).length} transaction{csvParsed.rows.filter(r => r.ok).length === 1 ? '' : 's'}
              </button>
              <p className="text-[0.625rem] text-[#5A5751] italic text-center" style={{ fontFamily: '"Fraunces", serif' }}>
                Rows without a parseable date are skipped automatically. Amounts with $ or commas are normalized. Unknown categories become 'other'.
              </p>
            </div>
          </div>
        </div>
      )}

      {transferContext && (() => {
        const tgt = (accounts || []).find(a => a.id === transferContext.targetAccountId);
        const candidates = (accounts || []).filter(a => a.id !== transferContext.targetAccountId);
        const src = candidates.find(a => a.id === transferSourceId);
        // Preparatory scaffolding — slot reserved for the pending "balance after
        // this transfer" projection chip (currently mirrors src.balance).
        // eslint-disable-next-line no-unused-vars
        const srcProjected = src ? (projectedAfter[transferContext.txId] !== undefined ? src.balance : src.balance) : 0;
        const wouldDrainSource = src && (src.balance - (parseFloat(transferAmount) || 0)) < 0;
        return (
          <div className="fixed inset-0 z-50 bg-[#1A1815]/60 flex items-center justify-center p-4" onClick={closeTransfer}>
            <div className="bg-white border-2 border-[#1A1815] max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="p-5 border-b border-[#1A1815] flex items-baseline justify-between gap-3 flex-wrap">
                <div>
                  <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] font-semibold">⚐ Too close to call</div>
                  <h2 className="text-2xl mt-1" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>Cover the gap with a transfer</h2>
                  <div className="text-xs text-[#5A5751] mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>
                    Upcoming: {transferContext.txDescription} ({fmt(transferContext.txAmount)}) on {tgt?.name}
                  </div>
                </div>
                <button type="button" onClick={closeTransfer} aria-label="Close" className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] hover:text-[#1A1815]">× Close</button>
              </div>

              <div className="p-5 space-y-4">
                <div className="bg-[#FAF8F4] border border-[#B85838] p-3">
                  <div className="text-[0.625rem] uppercase tracking-wider text-[#B85838] font-semibold mb-1">Projected shortfall</div>
                  <div className="text-xl" style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 600 }}>{fmt(transferContext.shortfall)}</div>
                  <p className="text-[0.625rem] text-[#5A5751] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>
                    Amount needed to keep <strong>{tgt?.name}</strong> at or above the {fmt(FUNDS_BUFFER)} cushion after this charge.
                  </p>
                </div>

                <div>
                  <label className="text-[0.625rem] uppercase tracking-[0.25em] text-[#5A5751] block mb-2">Transfer from</label>
                  <div className="space-y-1 max-h-56 overflow-y-auto border border-[#E8E4DC]">
                    {candidates.length === 0 && <p className="p-3 text-xs text-[#5A5751] italic">No other accounts available.</p>}
                    {candidates.map(a => {
                      const selected = a.id === transferSourceId;
                      const after = a.balance - (parseFloat(transferAmount) || 0);
                      return (
                        <button key={a.id} type="button" onClick={() => setTransferSourceId(a.id)} className={`w-full text-left p-3 border-b border-[#E8E4DC] last:border-b-0 ${selected ? 'bg-[#1A1815] text-white' : 'bg-white hover:bg-[#FAF8F4]'}`}>
                          <div className="flex items-baseline justify-between gap-2">
                            <span style={{ fontFamily: '"Fraunces", serif', fontWeight: selected ? 600 : 500 }}>{a.name}{a.fragment ? ' ' + a.fragment : ''}</span>
                            <span className={`text-sm ${!selected && a.balance < 0 ? 'text-[#B85838]' : ''}`} style={{ fontFamily: '"JetBrains Mono", monospace' }}>{fmt(a.balance)}</span>
                          </div>
                          {selected && (
                            <div className={`text-[0.625rem] mt-1 ${after < 0 ? 'text-[#B85838]' : 'opacity-75'}`} style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                              After transfer: {fmt(after)} {after < 0 && '(would go negative)'}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Transfer amount (defaults to shortfall + cushion)</label>
                  <input type="number" step="0.01" min="0" className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={transferAmount} onChange={e => setTransferAmount(e.target.value)} />
                </div>

                {wouldDrainSource && (
                  <div className="text-xs text-[#B85838] px-3 py-2 bg-[#FAF8F4] border border-[#B85838]" role="alert" style={{ fontFamily: '"Fraunces", serif' }}>
                    This transfer would push the source account below zero. Either pick a different source or reduce the amount.
                  </div>
                )}

                <button type="button" onClick={executeTransfer} disabled={!transferSourceId || (parseFloat(transferAmount) || 0) <= 0} className="w-full bg-[#1A1815] text-white py-3 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838] disabled:opacity-40 disabled:hover:bg-[#1A1815]">
                  Move {fmt(parseFloat(transferAmount) || 0)} · {src ? `${src.name} → ${tgt?.name}` : 'pick a source'}
                </button>
                <p className="text-[0.625rem] text-[#5A5751] italic text-center" style={{ fontFamily: '"Fraunces", serif' }}>
                  Creates two paired transactions dated today, both marked as <em>transfer</em> so they don't double-count in expense math.
                </p>
              </div>
            </div>
          </div>
        );
      })()}

      <section>
        <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#5A5751] mb-2">30 / 60 / 90-Day Cash Forecast · vs prior 30 / 60 / 90 actuals</div>
        <div className="bg-white border border-[#1A1815] overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1A1815] bg-[#FAF8F4]">
                <th className="text-left p-2 text-[0.625rem] uppercase tracking-wider text-[#5A5751]" rowSpan="2">Cash account</th>
                <th className="text-center p-2 text-[0.625rem] uppercase tracking-wider text-[#5A5751] border-l border-[#E8E4DC]" colSpan="3">Previous (actual cash flow)</th>
                <th className="text-center p-2 text-[0.625rem] uppercase tracking-wider text-[#1A1815] border-l border-[#E8E4DC]" rowSpan="2">Now</th>
                <th className="text-center p-2 text-[0.625rem] uppercase tracking-wider text-[#B85838] border-l border-[#E8E4DC]" colSpan="3">Projected (forward)</th>
              </tr>
              <tr className="border-b border-[#1A1815] bg-[#FAF8F4]">
                <th className="text-right p-2 text-[0.5625rem] uppercase tracking-wider text-[#5A5751] border-l border-[#E8E4DC]">−90d</th>
                <th className="text-right p-2 text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">−60d</th>
                <th className="text-right p-2 text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">−30d</th>
                <th className="text-right p-2 text-[0.5625rem] uppercase tracking-wider text-[#B85838] border-l border-[#E8E4DC]">+30d</th>
                <th className="text-right p-2 text-[0.5625rem] uppercase tracking-wider text-[#B85838]">+60d</th>
                <th className="text-right p-2 text-[0.5625rem] uppercase tracking-wider text-[#B85838]">+90d</th>
              </tr>
            </thead>
            <tbody>
              {forecast.length === 0 ? (
                <tr><td colSpan="8" className="p-3 text-xs text-[#5A5751] italic text-center" style={{ fontFamily: '"Fraunces", serif' }}>No cash accounts yet. Add a checking/savings account in Books → Accounts.</td></tr>
              ) : forecast.map(f => (
                <tr key={f.id} className="border-b border-[#E8E4DC]">
                  <td className="p-2">
                    <span style={{ fontFamily: '"Fraunces", serif' }}>{f.name}{f.fragment ? ' ' + f.fragment : ''}</span>
                    {f.isPrimary && <span className="ml-2 text-[0.5625rem] uppercase tracking-wider text-[#B85838] font-semibold">★</span>}
                    <span className="ml-2 text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">{f.type}</span>
                  </td>
                  {/* Trailing actuals — net change over the lookback window */}
                  <td className={`p-2 text-right border-l border-[#E8E4DC] ${f.a90 < 0 ? 'text-[#B85838]' : f.a90 > 0 ? 'text-[#5A6E3D]' : 'text-[#5A5751]'}`} style={{ fontFamily: '"JetBrains Mono", monospace' }}>{f.a90 === 0 ? '—' : `${f.a90 > 0 ? '+' : ''}${fmt(f.a90)}`}</td>
                  <td className={`p-2 text-right ${f.a60 < 0 ? 'text-[#B85838]' : f.a60 > 0 ? 'text-[#5A6E3D]' : 'text-[#5A5751]'}`} style={{ fontFamily: '"JetBrains Mono", monospace' }}>{f.a60 === 0 ? '—' : `${f.a60 > 0 ? '+' : ''}${fmt(f.a60)}`}</td>
                  <td className={`p-2 text-right ${f.a30 < 0 ? 'text-[#B85838]' : f.a30 > 0 ? 'text-[#5A6E3D]' : 'text-[#5A5751]'}`} style={{ fontFamily: '"JetBrains Mono", monospace' }}>{f.a30 === 0 ? '—' : `${f.a30 > 0 ? '+' : ''}${fmt(f.a30)}`}</td>
                  {/* Now */}
                  <td className={`p-2 text-right border-l border-[#E8E4DC] ${f.balance < 0 ? 'text-[#B85838] font-semibold' : ''}`} style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 500 }}>{fmt(f.balance)}</td>
                  {/* Forward projection */}
                  <td className={`p-2 text-right border-l border-[#E8E4DC] ${f.w30 < 0 ? 'text-[#B85838] font-semibold' : f.w30 < FUNDS_BUFFER ? 'text-[#B85838]' : ''}`} style={{ fontFamily: '"JetBrains Mono", monospace' }}>{fmt(f.w30)}</td>
                  <td className={`p-2 text-right ${f.w60 < 0 ? 'text-[#B85838] font-semibold' : f.w60 < FUNDS_BUFFER ? 'text-[#B85838]' : ''}`} style={{ fontFamily: '"JetBrains Mono", monospace' }}>{fmt(f.w60)}</td>
                  <td className={`p-2 text-right ${f.w90 < 0 ? 'text-[#B85838] font-semibold' : f.w90 < FUNDS_BUFFER ? 'text-[#B85838]' : ''}`} style={{ fontFamily: '"JetBrains Mono", monospace' }}>{fmt(f.w90)}</td>
                </tr>
              ))}
              {forecast.length > 1 && (
                <tr className="border-t-2 border-[#1A1815] bg-[#FAF8F4]">
                  <td className="p-2 text-[0.625rem] uppercase tracking-[0.2em] text-[#1A1815] font-semibold">All cash (total)</td>
                  <td className={`p-2 text-right border-l border-[#E8E4DC] ${forecastTotals.a90 < 0 ? 'text-[#B85838]' : 'text-[#5A6E3D]'}`} style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 600 }}>{forecastTotals.a90 === 0 ? '—' : `${forecastTotals.a90 > 0 ? '+' : ''}${fmt(forecastTotals.a90)}`}</td>
                  <td className={`p-2 text-right ${forecastTotals.a60 < 0 ? 'text-[#B85838]' : 'text-[#5A6E3D]'}`} style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 600 }}>{forecastTotals.a60 === 0 ? '—' : `${forecastTotals.a60 > 0 ? '+' : ''}${fmt(forecastTotals.a60)}`}</td>
                  <td className={`p-2 text-right ${forecastTotals.a30 < 0 ? 'text-[#B85838]' : 'text-[#5A6E3D]'}`} style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 600 }}>{forecastTotals.a30 === 0 ? '—' : `${forecastTotals.a30 > 0 ? '+' : ''}${fmt(forecastTotals.a30)}`}</td>
                  <td className={`p-2 text-right border-l border-[#E8E4DC] ${forecastTotals.balance < 0 ? 'text-[#B85838]' : 'text-[#5A6E3D]'}`} style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 700 }}>{fmt(forecastTotals.balance)}</td>
                  <td className={`p-2 text-right border-l border-[#E8E4DC] ${forecastTotals.w30 < 0 ? 'text-[#B85838]' : ''}`} style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 600 }}>{fmt(forecastTotals.w30)}</td>
                  <td className={`p-2 text-right ${forecastTotals.w60 < 0 ? 'text-[#B85838]' : ''}`} style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 600 }}>{fmt(forecastTotals.w60)}</td>
                  <td className={`p-2 text-right ${forecastTotals.w90 < 0 ? 'text-[#B85838]' : ''}`} style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 600 }}>{fmt(forecastTotals.w90)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="text-[0.625rem] text-[#5A5751] italic mt-2" style={{ fontFamily: '"Fraunces", serif' }}>
          <strong>Cash only</strong> — credit cards and loans are tracked separately in Books → Accounts because they don't hold spendable cash. The <strong>left side</strong> is the actual net cash movement over the prior 30/60/90 days (from settled transactions, +inflow / −outflow). The <strong>right side</strong> is the projected balance at each forward window (current balance + upcoming charges + recurring). Compare the two sides to gut-check: if the forward projection drops faster than the prior 90 days bled, you're projecting tighter than reality — or you've got a real upcoming squeeze. Bold rust = below zero; plain rust = below the {fmt(FUNDS_BUFFER)} cushion. Tap any upcoming row's <strong>⚐ Cover with transfer</strong> button to move money preemptively.
        </p>
      </section>

      {(accounts || []).length > 0 && (
        <section>
          <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#5A5751] mb-2">All Account Balances</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-px bg-[#E8E4DC] border border-[#E8E4DC]">
            {(accounts || []).map(a => (
              <div key={a.id} className="bg-white p-3">
                <div className="flex items-baseline justify-between gap-2">
                  <div className="text-[0.625rem] text-[#5A5751] truncate flex-1" style={{ fontFamily: '"Fraunces", serif' }}>{a.name}{a.fragment ? ' ' + a.fragment : ''}</div>
                  {a.isPrimary && <span className="text-[0.5625rem] uppercase tracking-wider text-[#B85838] font-semibold shrink-0">★</span>}
                </div>
                <div className={`text-base ${a.balance < 0 ? 'text-[#B85838]' : 'text-[#1A1815]'}`} style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 500 }}>{fmt(a.balance)}</div>
              </div>
            ))}
          </div>
          <p className="text-[0.625rem] text-[#5A5751] italic mt-2" style={{ fontFamily: '"Fraunces", serif' }}>
            Full balance sweep across every entity. The primary bill-pay account (★) is shown prominently at the top of this tab. Edit any account in Books · Accounts to mark it primary.
          </p>
        </section>
      )}
    </div>
  );
}
