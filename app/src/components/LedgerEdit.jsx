// =============================================================================
// LedgerEdit — the ONE inline editor for a payee or category, on every surface
// =============================================================================
// Darrell, 2026-09-30: "we want to edit everywhere it makes sense." Wrap any
// payee name or category a surface shows:
//
//   <LedgerEdit txn={row}>{row.name}</LedgerEdit>                 a transaction
//   <LedgerEdit txn={row} show="category">{label}</LedgerEdit>    its category
//   <LedgerEdit payee="SHELL OIL 123">SHELL OIL</LedgerEdit>      a payee rollup
//   <LedgerEdit categoryKey="dining">Dining</LedgerEdit>          a category rollup
//
// Tapping opens one sheet: rename (this one, or every transaction from this
// payee) and set the category (this one, or every one from this payee, or a
// new category typed in place). Saving goes through lib/ledger-edit.js to the
// shell's own updateTransaction / recategorizePayee, the write paths the Tx
// tab uses, so every screen re-renders from the same rows. After a save the
// trigger shows "edited" with Undo. With no books on this mount it renders the
// text plainly; in demo mode the sheet opens, says so, and cannot save.
// DR-0710.
// =============================================================================
import React, { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import {
  getLedgerEditor, applyLedgerEdit, undoLedgerEdit, rowsInScope, categoryOptionsFor,
  normalizeCategory, subscribeLedgerMarks, getLedgerMarks, addLedgerMark, dropLedgerMark, markFor,
} from '../lib/ledger-edit.js';
import { categoryLabel } from '../lib/categorize.js';

const NEW = '__new__';
const BTN = 'min-h-[44px] px-4 text-xs uppercase tracking-wider font-semibold focus:outline focus:outline-2 focus:outline-[#B85838]';

function Scope({ name, value, onChange, options }) {
  return (
    <div role="radiogroup" className="grid gap-1 mt-1">
      {options.map(([val, label]) => (
        <label key={val} className="flex items-center gap-2 min-h-[44px] px-2 border border-[#E8E4DC] bg-white text-[0.8125rem] text-[#1A1815] cursor-pointer">
          <input type="radio" name={name} value={val} checked={value === val} onChange={() => onChange(val)} className="w-4 h-4" />
          <span>{label}</span>
        </label>
      ))}
    </div>
  );
}

function Sheet({ editor, txn, payee, categoryKey, show, onClose, onSaved }) {
  const titleId = useId();
  const firstRef = useRef(null);
  const all = editor.transactions;
  const payeeName = payee || (txn ? (txn.description ?? txn.name ?? '') : '');
  // A payee rollup has no one row: its category is the one its rows share, if they share one.
  const payeeCats = !txn && payee ? [...new Set(rowsInScope(all, { scope: 'payee', payee }).map((t) => String(t.category || '').toLowerCase()))] : [];
  const catNow = txn ? (txn.category || '') : (payeeCats.length === 1 ? payeeCats[0] : (categoryKey && categoryKey !== 'uncategorized' ? categoryKey : ''));
  const payeeCount = payeeName ? rowsInScope(all, { scope: 'payee', payee: payeeName }).length : 0;
  const categoryCount = categoryKey && !txn && !payee ? rowsInScope(all, { scope: 'category', category: categoryKey }).length : 0;
  const rollupOnly = !txn && !payee && !!categoryKey;
  const options = useMemo(() => categoryOptionsFor(all || []), [all]);

  const [name, setName] = useState(payeeName);
  const [nameScope, setNameScope] = useState(txn ? 'one' : 'payee');
  const [cat, setCat] = useState(String(catNow || '').toLowerCase());
  const [newCat, setNewCat] = useState('');
  const [catScope, setCatScope] = useState(txn ? 'payee' : (rollupOnly ? 'category' : 'payee'));

  useEffect(() => {
    try { firstRef.current && firstRef.current.focus(); } catch { /* focus is a nicety */ }
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const scopeOpts = txn
    ? [['one', 'Just this transaction'], ['payee', `Every transaction from this payee (${payeeCount})`]]
    : [['payee', `Every transaction from this payee (${payeeCount})`]];

  const save = () => {
    const chosenCat = cat === NEW ? normalizeCategory(newCat) : cat;
    const parts = [];
    // Category first: recategorizePayee matches rows by the payee name as it is
    // now, so it must run before any rename changes that name.
    if (chosenCat && chosenCat !== String(catNow || '').toLowerCase()) {
      const r = applyLedgerEdit(editor, rollupOnly
        ? { field: 'category', scope: 'category', category: categoryKey, value: chosenCat }
        : { field: 'category', scope: catScope, id: txn ? txn.id : null, payee: payeeName, value: chosenCat });
      if (r) parts.push(r);
    }
    if (!rollupOnly && name.trim() && name.trim() !== payeeName) {
      const r = applyLedgerEdit(editor, { field: 'name', scope: nameScope, id: txn ? txn.id : null, payee: payeeName, value: name });
      if (r) parts.push(r);
    }
    onSaved(parts);
  };

  const heading = rollupOnly ? `Category · ${categoryLabel(categoryKey) || 'Uncategorized'}` : (payeeName || 'Transaction');

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#1A1815]/40" onClick={onClose} data-ledger-edit-sheet="">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md bg-[#FAF8F4] border-t-2 sm:border-2 border-[#1A1815] p-4 space-y-3 max-h-[90vh] overflow-y-auto"
      >
        <div>
          <div className="text-[0.625rem] uppercase tracking-[0.2em] text-[#B85838] font-semibold">Edit</div>
          <h2 id={titleId} className="text-base text-[#1A1815] break-words" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{heading}</h2>
        </div>
        {editor.demo && (
          <p className="text-[0.75rem] text-[#7A1F1F] border border-[#7A1F1F] bg-white p-2" role="note">Demo mode: nothing you change here is saved.</p>
        )}
        {!rollupOnly && (
          <section className="space-y-1">
            <label className="block text-[0.625rem] uppercase tracking-wider text-[#5A5751]" htmlFor={`${titleId}-name`}>Name</label>
            <input
              id={`${titleId}-name`}
              ref={show === 'category' ? null : firstRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full min-h-[44px] px-2 border border-[#1A1815] bg-white text-sm text-[#1A1815]"
            />
            {name.trim() !== payeeName && <Scope name={`${titleId}-ns`} value={nameScope} onChange={setNameScope} options={scopeOpts} />}
          </section>
        )}
        <section className="space-y-1">
          <label className="block text-[0.625rem] uppercase tracking-wider text-[#5A5751]" htmlFor={`${titleId}-cat`}>
            {rollupOnly ? `Move all ${categoryCount} transaction${categoryCount === 1 ? '' : 's'} in this category to` : 'Category'}
          </label>
          <select
            id={`${titleId}-cat`}
            ref={show === 'category' ? firstRef : null}
            value={cat}
            onChange={(e) => setCat(e.target.value)}
            className="w-full min-h-[44px] px-2 border border-[#1A1815] bg-white text-sm text-[#1A1815]"
          >
            {!cat && <option value="">Uncategorized</option>}
            {options.map((c) => <option key={c} value={c}>{categoryLabel(c)}</option>)}
            <option value={NEW}>+ New category…</option>
          </select>
          {cat === NEW && (
            <input
              aria-label="New category name"
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
              placeholder="e.g. kids sports"
              className="w-full min-h-[44px] px-2 border border-[#1A1815] bg-white text-sm text-[#1A1815]"
            />
          )}
          {!rollupOnly && cat !== String(catNow || '').toLowerCase() && (
            <Scope name={`${titleId}-cs`} value={catScope} onChange={setCatScope} options={scopeOpts} />
          )}
          {!rollupOnly && catScope === 'payee' && cat !== String(catNow || '').toLowerCase() && (
            <p className="text-[0.6875rem] text-[#5A5751]">Every transaction from this payee follows, and future imports from it are categorized the same way.</p>
          )}
        </section>
        <div className="flex gap-2 justify-end pt-1">
          <button type="button" onClick={onClose} className={`${BTN} border border-[#5A5751] text-[#5A5751] bg-white`}>Cancel</button>
          <button type="button" onClick={save} disabled={!!editor.demo} className={`${BTN} bg-[#1A1815] text-white disabled:opacity-50`}>Save</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default function LedgerEdit({ txn = null, payee = null, categoryKey = null, show = 'payee', children = null, className = '' }) {
  const editor = getLedgerEditor();
  const marks = useSyncExternalStore(subscribeLedgerMarks, getLedgerMarks, getLedgerMarks);
  const [open, setOpen] = useState(false);
  const label = children ?? (show === 'category'
    ? (categoryLabel(txn ? txn.category : categoryKey) || 'Uncategorized')
    : (payee || (txn && (txn.description ?? txn.name)) || '—'));
  if (!editor || typeof editor.updateTransaction !== 'function') return <span className={className}>{label}</span>;

  const mark = markFor(marks, {
    id: txn ? txn.id : null,
    payee: show === 'category' ? '' : (payee || (txn && (txn.description ?? txn.name)) || ''),
    category: show === 'category' ? (txn ? txn.category : categoryKey) : null,
  });
  const what = show === 'category' ? 'category' : 'payee';
  const shown = typeof label === 'string' ? label : (payee || categoryKey || (txn && (txn.description ?? txn.name)) || '');
  const stop = (e) => e.stopPropagation();

  const undo = (e) => {
    stop(e);
    const live = getLedgerEditor();
    const group = getLedgerMarks().filter((m) => m.group === mark.group);
    const hasName = group.some((m) => m.field === 'name');
    for (const m of group) {
      undoLedgerEdit(live, hasName ? { ...m, scope: m.scope === 'payee' ? 'rows' : m.scope } : m);
      dropLedgerMark(m);
    }
  };

  return (
    <span className={`inline-flex items-center gap-1 flex-wrap max-w-full ${className}`} onClick={stop}>
      <button
        type="button"
        data-ledger-edit={what}
        onClick={(e) => { stop(e); setOpen(true); }}
        aria-label={`Edit ${what} ${shown}`}
        className="inline-flex items-center gap-1 min-h-[44px] max-w-full text-left underline decoration-dotted decoration-[#8A857B] underline-offset-2 hover:decoration-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]"
      >
        <span className="truncate">{label}</span>
        <span aria-hidden="true" className="text-[#8A857B] text-[0.75em] shrink-0">✎</span>
      </button>
      {mark && (
        <>
          <span className="text-[0.5625rem] uppercase tracking-wider text-[#5A6E3D] border border-[#5A6E3D] rounded-full px-1.5 py-0.5" data-ledger-edited="">edited</span>
          <button type="button" onClick={undo} className="min-h-[44px] px-2 text-[0.625rem] uppercase tracking-wider text-[#1A1815] underline focus:outline focus:outline-2 focus:outline-[#B85838]" aria-label={`Undo edit to ${shown}`}>Undo</button>
        </>
      )}
      {open && (
        <Sheet
          editor={editor}
          txn={txn}
          payee={payee}
          categoryKey={categoryKey}
          show={show}
          onClose={() => setOpen(false)}
          onSaved={(parts) => {
            const group = `g-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
            for (const p of parts.slice().reverse()) addLedgerMark({ ...p, group });
            setOpen(false);
          }}
        />
      )}
    </span>
  );
}
