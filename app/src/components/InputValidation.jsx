// =============================================================================
// InputValidation — the ONE validate -> preview -> confirm -> commit gate
// =============================================================================
// EVERY money input passes through this same surface: an email receipt, a single
// photo, a bulk drop of photos, a manual entry, and a parsed bank file. It shows
// the user exactly what was extracted (vendor/description, date, amount, line
// items), a CONFIDENCE indicator, the matched bank transaction, and the auto-
// picked category — then waits for a Confirm (or a correction) before anything
// commits. Nothing lands silently (preview-then-execute + the reconciliation
// gate). Low-confidence / unmatched candidates show as "needs a fix" with the
// exact reason, and can be corrected right here before they commit.
//
// One component, not one per source — so the experience is identical no matter
// how the data got in. Consumer-intuitive, self-explaining, hover tooltips.
// It renders candidates (lib/input-validation.js) and calls the SAME commit for
// all; it never reaches a store itself (the parent passes add/updateTransaction).
// =============================================================================
import React, { useState, useMemo } from 'react';
import { fmt, fmtCents } from '../lib/format.js';
import {
  SOURCE_LABEL, READY, applyCorrection, commitCandidate, confidenceTier,
} from '../lib/input-validation.js';
// NOTE: validation status/issues are precomputed on each candidate by the spine
// (revalidate) and refreshed by applyCorrection — the component reads c.status.

const TX_CATEGORIES = ['salary', 'rental-income', 'transfer', 'groceries', 'fuel', 'utilities', 'dining', 'medical', 'vehicle', 'household', 'charitable', 'business', 'professional', 'insurance', 'subscription', 'debt-payment', 'other'];

// Confidence dot — the SAME three-state signal for every source.
function ConfidenceDot({ confidence }) {
  const t = confidenceTier(confidence);
  const cls = t.tier === 'high' ? 'text-[#5A6E3D]' : t.tier === 'low' ? 'text-[#B85838]' : 'text-[#B8860B]';
  return (
    <span className={`inline-flex items-center gap-1 text-[0.625rem] uppercase tracking-wider ${cls}`}
      title={`Extraction confidence: ${t.label}. Below 70% or unmatched needs a quick check before it commits.`}>
      <span aria-hidden="true">●</span>{t.label}
    </span>
  );
}

export default function InputValidation({
  candidates: initial = [], accounts = [], transactions = [], title = 'Review before it commits',
  addTransaction, updateTransaction, onDone, onClose,
}) {
  const [cands, setCands] = useState(() => initial);
  const [committedCount, setCommittedCount] = useState(0);

  const update = (id, patch) => setCands((list) => list.map((c) => (c.id === id ? applyCorrection(c, patch, { transactions }) : c)));

  // Candidate expense transactions a receipt can be linked to (no reconciliation
  // yet), nearest amount first.
  const matchOptions = useMemo(() => {
    return (transactions || []).filter((t) => t && Number(t.amount) < 0 && !t.reconciliation);
  }, [transactions]);

  const readyCount = cands.filter((c) => c.status === READY && !c._committed && !c._skipped).length;
  const pending = cands.filter((c) => !c._committed && !c._skipped);

  const commitOne = (c) => {
    const r = commitCandidate(c, { addTransaction, updateTransaction });
    if (r.committed) {
      setCommittedCount((n) => n + 1);
      setCands((list) => list.map((x) => (x.id === c.id ? { ...x, _committed: true } : x)));
    }
  };
  const skipOne = (id) => setCands((list) => list.map((x) => (x.id === id ? { ...x, _skipped: true } : x)));
  const commitAllReady = () => {
    let n = 0;
    setCands((list) => list.map((c) => {
      if (c.status === READY && !c._committed && !c._skipped) {
        const r = commitCandidate(c, { addTransaction, updateTransaction });
        if (r.committed) { n += 1; return { ...c, _committed: true }; }
      }
      return c;
    }));
    setCommittedCount((v) => v + n);
  };

  const finish = () => { if (typeof onDone === 'function') onDone({ committed: committedCount }); if (typeof onClose === 'function') onClose(); };

  return (
    <div role="dialog" aria-modal="true" aria-label={title}
      className="fixed inset-0 z-[110] bg-black/50 flex items-start sm:items-center justify-center overflow-y-auto p-2 sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) finish(); }}>
      <div className="bg-white border border-[#1A1815] w-full max-w-2xl my-4">
        <div className="flex items-center justify-between gap-3 p-4 border-b border-[#1A1815]">
          <div>
            <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] font-medium">Validate → confirm → commit</div>
            <h3 className="text-lg" style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{title}</h3>
          </div>
          <button type="button" onClick={finish} aria-label="Close" className="text-2xl leading-none w-9 h-9 min-h-[36px] hover:text-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]">×</button>
        </div>

        <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
          <p className="text-xs text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
            Every input — email, photo, bulk photos, manual, or a bank file — is checked here first. Confirm what&apos;s right;
            fix anything flagged. Nothing is filed until you say so.
          </p>

          {pending.length === 0 && (
            <div className="text-sm text-[#5A6E3D] py-6 text-center" style={{ fontFamily: '"Fraunces", serif' }}>
              {committedCount > 0 ? `${committedCount} filed. All done.` : 'Nothing left to review.'}
            </div>
          )}

          {cands.map((c) => {
            if (c._committed) {
              return (
                <div key={c.id} className="border border-[#E8E4DC] p-2 text-xs text-[#5A6E3D]" style={{ fontFamily: '"Fraunces", serif' }}>
                  ✓ Filed · {c.fields.description || 'entry'} · {fmt(c.fields.amount)}{c.commitKind === 'enrich' ? ' (receipt attached)' : ''}
                </div>
              );
            }
            if (c._skipped) return null;
            return (
              <div key={c.id} className={`border p-3 space-y-2 ${c.status === READY ? 'border-[#5A6E3D]' : 'border-[#B85838]'}`}>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-[0.5625rem] uppercase tracking-[0.2em] text-[#5A5751] border border-[#E8E4DC] px-1.5 py-0.5"
                    title="Where this input came from — all sources use this same review.">
                    {SOURCE_LABEL[c.source] || c.source}
                  </span>
                  <ConfidenceDot confidence={c.confidence} />
                </div>

                {/* Extracted, EDITABLE fields — what was pulled out of the input. */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <label className="col-span-2 sm:col-span-2 block">
                    <span className="text-[0.5rem] uppercase tracking-wider text-[#5A5751]">Vendor / description</span>
                    <input className="w-full p-1.5 border border-[#E8E4DC] text-sm bg-white" value={c.fields.description || ''}
                      onChange={(e) => update(c.id, { description: e.target.value })} title="What this charge is. Edit if the extraction got it wrong." />
                  </label>
                  <label className="block">
                    <span className="text-[0.5rem] uppercase tracking-wider text-[#5A5751]">Date</span>
                    <input type="date" className="w-full p-1.5 border border-[#E8E4DC] text-sm bg-white" value={c.fields.date || ''}
                      onChange={(e) => update(c.id, { date: e.target.value })} title="The transaction date extracted from the input." />
                  </label>
                  <label className="block">
                    <span className="text-[0.5rem] uppercase tracking-wider text-[#5A5751]">Amount</span>
                    <input type="number" step="0.01" className="w-full p-1.5 border border-[#E8E4DC] text-sm bg-white" value={c.fields.amount ?? ''}
                      onChange={(e) => update(c.id, { amount: e.target.value === '' ? null : Number(e.target.value) })} title="Negative = money out. The bank stays the source of truth for this amount." />
                  </label>
                </div>

                {/* Line items (receipt sources) — the itemized detail. */}
                {c.items && c.items.length > 0 && (
                  <details className="text-[0.6875rem]">
                    <summary className="cursor-pointer text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>{c.items.length} line item{c.items.length === 1 ? '' : 's'} extracted</summary>
                    <div className="mt-1 pl-3 border-l-2 border-[#E8E4DC] space-y-0.5">
                      {c.items.map((it, i) => (
                        <div key={i} className="flex justify-between gap-2">
                          <span style={{ fontFamily: '"Fraunces", serif' }}>{it.qty && it.qty !== 1 ? `${it.qty}× ` : ''}{it.name}</span>
                          <span style={{ fontFamily: '"JetBrains Mono", monospace' }}>{fmtCents(it.price)}</span>
                        </div>
                      ))}
                    </div>
                  </details>
                )}

                {/* Matched bank transaction (enrich) OR account (create). */}
                {c.commitKind === 'enrich' ? (
                  <div className="text-xs">
                    <span className="text-[0.5rem] uppercase tracking-wider text-[#5A5751]">Matched bank transaction</span>
                    {c.match ? (
                      <div className="text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }} title="The receipt is attached to this existing bank charge. The bank amount is the truth; the receipt adds itemization + proof.">
                        {String(c.match.transaction.date).slice(5)} · {c.match.transaction.description} · <span style={{ fontFamily: '"JetBrains Mono", monospace' }}>{fmt(c.match.transaction.amount)}</span>
                      </div>
                    ) : (
                      <select className="block w-full p-1.5 border border-[#B85838] text-sm bg-white mt-0.5" defaultValue=""
                        onChange={(e) => { const t = matchOptions.find((x) => x.id === e.target.value); if (t) update(c.id, { match: t }); }}
                        title="No bank charge matched automatically. Pick the charge this receipt belongs to (only a matching amount will verify).">
                        <option value="">No match — pick the charge…</option>
                        {matchOptions.map((t) => <option key={t.id} value={t.id}>{String(t.date).slice(5)} · {(t.description || '').slice(0, 24)} · {fmt(t.amount)}</option>)}
                      </select>
                    )}
                  </div>
                ) : (
                  <label className="block text-xs">
                    <span className="text-[0.5rem] uppercase tracking-wider text-[#5A5751]">Account</span>
                    <select className="w-full p-1.5 border border-[#E8E4DC] text-sm bg-white" value={c.fields.accountId || ''}
                      onChange={(e) => update(c.id, { accountId: e.target.value })} title="Which account this new transaction posts to.">
                      <option value="">— pick an account —</option>
                      {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}{a.fragment ? ' ' + a.fragment : ''}</option>)}
                    </select>
                  </label>
                )}

                {/* Auto-picked category (editable). */}
                <label className="block text-xs">
                  <span className="text-[0.5rem] uppercase tracking-wider text-[#5A5751]">Category {c.items && c.items.length ? '(from items)' : '(auto-picked)'}</span>
                  <select className="w-full p-1.5 border border-[#E8E4DC] text-sm bg-white" value={c.fields.category || 'other'}
                    onChange={(e) => update(c.id, { category: e.target.value })} title="Set from the receipt items or the description. Change it if it's off.">
                    {TX_CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </label>

                {/* Proof image (photo path). */}
                {c.proof && c.proof.dataUrl && (
                  <div className="flex items-center gap-2">
                    <img src={c.proof.dataUrl} alt="Receipt proof" className="h-12 w-12 object-cover border border-[#E8E4DC]" />
                    <span className="text-[0.5625rem] text-[#5A5751]" title="Proof photo attached; location data was stripped before storing.">proof photo · location stripped</span>
                  </div>
                )}

                {/* Status / issues + per-card actions. */}
                {c.status !== READY && (
                  <div className="text-[0.6875rem] text-[#B85838]" title="Fix these before this can be filed.">Needs a fix: {c.issues.join(' · ')}</div>
                )}
                <div className="flex items-center gap-2 pt-1">
                  <button type="button" onClick={() => commitOne(c)} disabled={c.status !== READY}
                    className="text-xs uppercase tracking-wider bg-[#1A1815] text-white px-3 py-1.5 min-h-[36px] hover:bg-[#5A6E3D] disabled:opacity-40 focus:outline focus:outline-2 focus:outline-[#B85838]"
                    title={c.status === READY ? 'File this one now' : 'Resolve the flagged items first'}>
                    Confirm &amp; file
                  </button>
                  <button type="button" onClick={() => skipOne(c.id)}
                    className="text-xs uppercase tracking-wider border border-[#5A5751] text-[#5A5751] px-3 py-1.5 min-h-[36px] hover:bg-[#5A5751] hover:text-white focus:outline focus:outline-2 focus:outline-[#B85838]"
                    title="Leave this one out — it won't be filed.">
                    Skip
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-2 p-4 border-t border-[#1A1815]">
          <span className="text-xs text-[#5A5751]">{readyCount} ready · {pending.length} to review{committedCount ? ` · ${committedCount} filed` : ''}</span>
          <div className="flex gap-2">
            <button type="button" onClick={commitAllReady} disabled={readyCount === 0}
              className="text-xs uppercase tracking-wider bg-[#1A1815] text-white px-4 py-2 min-h-[40px] hover:bg-[#5A6E3D] disabled:opacity-40 focus:outline focus:outline-2 focus:outline-[#B85838]"
              title="File every entry that passed validation">
              Confirm &amp; file {readyCount} ready
            </button>
            <button type="button" onClick={finish}
              className="text-xs uppercase tracking-wider border border-[#1A1815] px-4 py-2 min-h-[40px] hover:bg-[#1A1815] hover:text-white focus:outline focus:outline-2 focus:outline-[#B85838]"
              title="Close this review">
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
