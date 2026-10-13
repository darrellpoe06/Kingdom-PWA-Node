// =============================================================================
// ledger-edit — edit a transaction's payee or category from ANY surface
// =============================================================================
// Darrell, 2026-09-30: "Tx is the only place to edit names or categories!!!!!
// That is not what we want... we want to edit everywhere it makes sense."
//
// ONE write path. The shell (poe-financial-mvp-v28.jsx) publishes the SAME
// updateTransaction + recategorizePayee it hands the Tx tab, once per render,
// through publishLedgerEditor(). Every surface reads them back with
// getLedgerEditor() at tap time. Nothing here writes to the cloud or to
// storage itself: each change goes through those two functions, which already
// carry the sync, the demo guard for the cloud call, and the record history.
// Because the shell's one `data` object is the only copy, a save re-renders
// every screen from the same rows; no surface keeps its own list.
//
// The shell import rides the existing categorize import line (the monolith is
// line-frozen, DR-0078), which is why payeeKey + applyCategoryToPayee are
// re-exported from here.
//
// Demo mode writes NOTHING: applyLedgerEdit returns null without calling a
// write function, and the sheet shows why. DR-0710.
// =============================================================================
import { payeeKey, applyCategoryToPayee, TX_CATEGORIES } from './categorize.js';

export { payeeKey, applyCategoryToPayee };

let current = null;

// Called by the shell on every render with its live write paths. A plain
// assignment: no subscriber is notified during render, so React never sees a
// cross-component update. Surfaces read it when the person taps.
export function publishLedgerEditor(editor) {
  current = editor || null;
}

// The live editor, or null when this mount has no books (the standalone Poe
// Properties door, a test that published nothing). A surface with no editor
// renders its text plainly: a control that cannot save is never shown.
export function getLedgerEditor() {
  return current;
}

// A typed category name becomes a slug the rest of the books already read
// (the same rule the old Imported "+ New category" input used).
export function normalizeCategory(raw) {
  return String(raw || '').trim().toLowerCase().replace(/[^a-z0-9- ]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

// The pick-list: the canonical set plus every category already in the ledger,
// so a category someone created earlier stays selectable everywhere.
export function categoryOptionsFor(transactions) {
  const seen = new Set(TX_CATEGORIES);
  for (const t of transactions || []) {
    const c = t && t.category;
    if (c) seen.add(String(c).toLowerCase());
  }
  return [...seen];
}

// Which rows an edit touches. scope:
//   'one'      the single transaction `id`
//   'payee'    every transaction whose payeeKey matches `payee`
//   'category' every transaction whose category is `category` (a rollup row)
export function rowsInScope(transactions, { scope, id = null, payee = '', category = null }) {
  const rows = transactions || [];
  if (scope === 'one') return rows.filter((t) => t && t.id === id);
  if (scope === 'payee') {
    const key = payeeKey(payee);
    if (!key) return [];
    return rows.filter((t) => t && payeeKey(t.description) === key);
  }
  if (scope === 'category') {
    const want = category == null || category === 'uncategorized' ? null : String(category).toLowerCase();
    return rows.filter((t) => t && (want === null ? !t.category : String(t.category || '').toLowerCase() === want));
  }
  return [];
}

// Apply one edit through the shell's write paths. Returns an undo record
// { field, scope, value, changes: [{ id, before }], at } or null when nothing
// was written (demo mode, no editor, nothing changed).
//   field 'name'     -> updateTransaction(id, { description }) per row
//   field 'category' -> scope 'payee' uses recategorizePayee (learns the rule
//                       for future imports and back-applies, exactly as Tx);
//                       'one' and 'category' use updateTransaction per row.
export function applyLedgerEdit(editor, { field, scope, id = null, payee = '', category = null, value }) {
  if (!editor || editor.demo) return null;
  const { updateTransaction, recategorizePayee } = editor;
  if (typeof updateTransaction !== 'function') return null;
  const next = field === 'category' ? normalizeCategory(value) : String(value || '').trim();
  if (!next) return null;
  const key = field === 'category' ? 'category' : 'description';
  const rows = rowsInScope(editor.transactions, { scope, id, payee, category })
    .filter((t) => String(t[key] || '') !== next);
  if (!rows.length) return null;
  const changes = rows.map((t) => ({ id: t.id, before: t[key] ?? null }));
  if (field === 'category' && scope === 'payee' && typeof recategorizePayee === 'function') {
    recategorizePayee(payee || rows[0].description, next);
  } else {
    for (const t of rows) updateTransaction(t.id, { [key]: next });
  }
  return { field, scope, value: next, payee: payee || rows[0].description, changes, at: Date.now() };
}

// Put every touched row back to what it was, through the same write path.
// A payee-wide category undo whose rows all shared one earlier category also
// re-teaches that category, so future imports stop following the undone rule.
export function undoLedgerEdit(editor, record) {
  if (!editor || editor.demo || !record || !Array.isArray(record.changes)) return 0;
  const { updateTransaction, recategorizePayee } = editor;
  if (typeof updateTransaction !== 'function') return 0;
  const key = record.field === 'category' ? 'category' : 'description';
  const priors = [...new Set(record.changes.map((c) => c.before || ''))];
  if (key === 'category' && record.scope === 'payee' && priors.length === 1 && priors[0] && typeof recategorizePayee === 'function') {
    recategorizePayee(record.payee, priors[0]);
    return record.changes.length;
  }
  for (const c of record.changes) updateTransaction(c.id, { [key]: c.before ?? '' });
  return record.changes.length;
}

// ---- the "edited" marks ------------------------------------------------------
// A small in-memory list of this session's edits, so the surface that was
// edited (and any other surface showing the same row, payee or category) can
// show "edited · Undo". Notified from event handlers only, never from render.
let marks = [];
const listeners = new Set();
const emit = () => { for (const l of listeners) l(); };

export function subscribeLedgerMarks(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
export function getLedgerMarks() {
  return marks;
}
export function addLedgerMark(record) {
  if (!record) return;
  marks = [record, ...marks].slice(0, 20);
  emit();
}
export function dropLedgerMark(record) {
  marks = marks.filter((m) => m !== record);
  emit();
}
export function clearLedgerMarks() {
  marks = [];
  emit();
}

// The newest mark that covers what a trigger shows: the transaction itself,
// the payee, or the category (as its old or new value).
export function markFor(allMarks, { id = null, payee = '', category = null }) {
  const key = payee ? payeeKey(payee) : '';
  const cat = category ? String(category).toLowerCase() : null;
  return (allMarks || []).find((m) => (
    (id && m.changes.some((c) => c.id === id))
    || (key && m.field === 'name' && (payeeKey(m.value) === key || payeeKey(m.payee) === key))
    || (key && m.field === 'category' && m.scope === 'payee' && payeeKey(m.payee) === key)
    || (cat && m.field === 'category' && m.value === cat)
  )) || null;
}
