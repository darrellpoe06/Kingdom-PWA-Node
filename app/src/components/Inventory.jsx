// =============================================================================
// Inventory — a REAL inventory control system (the systems-of-record demo).
// =============================================================================
// Declared by Darrell 2026-06-25: Books "should keep historical accuracy and
// information processing ... easy corporate business systems, typical inventory
// controls." This surface is the concrete proof of what enterprise software is
// genuinely good at and a spreadsheet is not:
//
//   * ON-HAND IS DERIVED, never typed. Every quantity on this page is computed
//     from the append-only movement ledger (lib/inventory.js) — the same rule as
//     "a balance is opening + settled transactions." You cannot fat-finger the
//     on-hand; you post a movement and the truth recomputes.
//   * THE LEDGER IS THE AUDIT TRAIL. Every receipt, issue, count, and transfer is
//     an immutable, timestamped, attributed row. The full history of an item's
//     stock is right there, with the running on-hand after each move.
//   * ITEMS ARE VERSIONED. Editing an item's reorder point / cost / location
//     records a record-history event (lib/record-history.js) — you can see what
//     it was, who changed it, and when.
//   * CORPORATE CONTROLS. No-negative guard, balanced transfers (out+in),
//     reorder-point low-stock flags, duplicate-SKU detection.
//
// The seeded use case is the church's AV / equipment + supplies (incl. the new
// LED video-wall gear) — a real COLG need. Persistence + cross-device sync ride
// the proven table-sync path (inventory_items / inventory_movements /
// record_events, migration 0052).
//
// UNBREAKABLE basics: mounted in a <SectionBoundary> by the shell; clear empty
// state; optimistic local writes with cloud sync on sign-in; every figure
// traceable to real movements; keyboard-operable real <button>/<select>/<input>;
// rem-based chrome so the global text-size control scales it.
import React, { useMemo, useState } from 'react';
import { SectionTitle, MetricCell } from './shared.jsx';
import {
  decorateItems, filterItems, summarizeInventory, onHandByItemLocation,
  onHandFor, validateMovement, buildTransfer, lowStockItems, dedupeBySku,
  itemHistoryFromMovements, rollupByCategory, MOVEMENT_LABEL,
} from '../lib/inventory.js';
import { versionTimeline } from '../lib/record-history.js';

const money = (n) => `$${(Number(n) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const qtyFmt = (n) => (Number(n) || 0).toLocaleString();
const when = (iso) => {
  if (!iso) return '';
  try { return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); }
  catch { return iso; }
};

const STATUS_BADGE = {
  ok:   { label: 'OK',  cls: 'bg-[#F0F4EA] text-[#3F5226] border-[#5A6E3D]' },
  low:  { label: 'LOW', cls: 'bg-[#FBF7EC] text-[#B45309] border-[#B85838]' },
  out:  { label: 'OUT', cls: 'bg-[#FEE2E2] text-[#7A1F1F] border-[#7A1F1F]' },
};

const UNITS = ['each', 'box', 'case', 'pair', 'set', 'ft', 'roll', 'pack'];

function Field({ label, children, hint }) {
  return (
    <label className="block">
      <div className="text-[10px] uppercase tracking-wider text-[#5A5751] mb-1">{label}</div>
      {children}
      {hint && <div className="text-[10px] text-[#5A5751] mt-1">{hint}</div>}
    </label>
  );
}

const inputCls = 'w-full border border-[#E8E4DC] bg-white px-2 py-1.5 text-sm focus:outline focus:outline-2 focus:outline-[#B85838]';

export default function Inventory({
  items = [],
  movements = [],
  recordEvents = [],
  addItem,
  updateItem,
  recordMovements,
  currentUserPersona = null,
}) {
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [lowOnly, setLowOnly] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [notice, setNotice] = useState(null);

  const decorated = useMemo(() => decorateItems(items, movements), [items, movements]);
  const summary = useMemo(() => summarizeInventory(items, movements), [items, movements]);
  const visible = useMemo(
    () => filterItems(items, movements, { q, category: category || null, location: location || null, lowOnly }),
    [items, movements, q, category, location, lowOnly],
  );
  const lows = useMemo(() => lowStockItems(items, movements), [items, movements]);
  const dupes = useMemo(() => dedupeBySku(items).duplicates, [items]);
  const byLoc = useMemo(() => onHandByItemLocation(movements), [movements]);

  const categories = useMemo(
    () => Array.from(new Set(decorated.map((it) => it.category || 'Uncategorized'))).sort(),
    [decorated],
  );
  const locations = useMemo(
    () => Array.from(new Set(decorated.map((it) => it.location || 'Unspecified'))).sort(),
    [decorated],
  );

  if (!addItem) {
    // Defensive: never white-screen if wiring is incomplete.
    return (
      <div className="max-w-2xl">
        <SectionTitle eyebrow="System of record">Inventory</SectionTitle>
        <div className="bg-[#FAF8F4] border border-[#E8E4DC] p-6 text-sm text-[#5A5751]">
          Inventory is not wired to persistence in this view.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      <SectionTitle eyebrow="System of record · derived on-hand · immutable ledger">Inventory</SectionTitle>

      <p className="text-sm text-[#5A5751] mb-4 max-w-3xl">
        Every quantity here is <strong>derived</strong> from the stock ledger below — never typed in. Post a
        movement (received, issued, counted, transferred) and the on-hand recomputes. The ledger is
        append-only: a posted movement can't be edited, only corrected by a new one. That's the difference
        between a system of record and a spreadsheet.
      </p>

      {/* Roll-up — every figure derived from the movement ledger. */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-1 mb-4">
        <MetricCell label="Items tracked" value={qtyFmt(summary.itemCount)} />
        <MetricCell label="Units on hand" value={qtyFmt(summary.totalUnits)} />
        <MetricCell label="Inventory value" value={money(summary.totalValue)} accent="green" />
        <MetricCell label="Low stock" value={qtyFmt(summary.lowCount)} accent={summary.lowCount ? 'rust' : undefined} />
        <MetricCell label="Out of stock" value={qtyFmt(summary.outCount)} accent={summary.outCount ? 'rust' : undefined} />
      </div>

      {notice && (
        <div className={`mb-3 px-3 py-2 text-sm border ${notice.kind === 'error' ? 'bg-[#FEE2E2] border-[#7A1F1F] text-[#7A1F1F]' : 'bg-[#F0F4EA] border-[#5A6E3D] text-[#3F5226]'}`} role="status">
          {notice.message}
        </div>
      )}

      {/* Reorder callout — the system tells you what to reorder. */}
      {lows.length > 0 && (
        <div className="mb-3 px-3 py-2 text-sm border border-[#B85838] bg-[#FBF7EC] text-[#B45309]">
          <strong>{lows.length}</strong> item{lows.length === 1 ? '' : 's'} at or below reorder point:{' '}
          {lows.slice(0, 6).map((r) => r.item.name).join(', ')}{lows.length > 6 ? '…' : ''}
        </div>
      )}

      {/* Duplicate-SKU integrity warning. */}
      {dupes.length > 0 && (
        <div className="mb-3 px-3 py-2 text-sm border border-[#7A1F1F] bg-[#FEE2E2] text-[#7A1F1F]">
          <strong>{dupes.length}</strong> duplicate SKU{dupes.length === 1 ? '' : 's'} detected — the same SKU should be one item so its stock isn't split across rows.
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-end gap-2 mb-3">
        <div className="flex-1 min-w-[160px]">
          <Field label="Search">
            <input className={inputCls} value={q} onChange={(e) => setQ(e.target.value)} placeholder="name, SKU, category…" />
          </Field>
        </div>
        <div className="min-w-[130px]">
          <Field label="Category">
            <select className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">All</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
        </div>
        <div className="min-w-[130px]">
          <Field label="Location">
            <select className={inputCls} value={location} onChange={(e) => setLocation(e.target.value)}>
              <option value="">All</option>
              {locations.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </Field>
        </div>
        <label className="flex items-center gap-1.5 text-xs text-[#5A5751] pb-2 cursor-pointer">
          <input type="checkbox" checked={lowOnly} onChange={(e) => setLowOnly(e.target.checked)} />
          Low / out only
        </label>
        <button
          type="button"
          onClick={() => { setShowAdd((s) => !s); setSelectedId(null); }}
          className="pb-2 text-xs uppercase tracking-wider px-3 py-2 border border-[#B85838] text-[#B85838] hover:bg-[#B85838] hover:text-white"
        >
          {showAdd ? '× Close' : '+ Add item'}
        </button>
      </div>

      {showAdd && (
        <AddItemForm
          onCancel={() => setShowAdd(false)}
          existingSkus={items.map((it) => (it.sku || '').trim().toUpperCase()).filter(Boolean)}
          onAdd={(item, opening) => {
            const id = addItem(item);
            if (opening && Number(opening.qty) > 0) {
              recordMovements([{
                itemId: id, kind: 'in', qty: Number(opening.qty),
                location: item.location || null, reason: 'Opening count',
              }]);
            }
            setShowAdd(false);
            setSelectedId(id);
            setNotice({ kind: 'ok', message: `Added "${item.name}".` });
          }}
        />
      )}

      {/* Items table */}
      {decorated.length === 0 ? (
        <div className="bg-[#FAF8F4] border border-[#E8E4DC] p-8 text-center">
          <div className="text-2xl mb-1" aria-hidden="true">📦</div>
          <div className="text-sm text-[#5A5751] mb-1">No items yet.</div>
          <div className="text-xs text-[#5A5751]">Add your first item (e.g. an AV cable, a mic, the LED-wall panels) and post an opening count — on-hand builds from there.</div>
        </div>
      ) : visible.length === 0 ? (
        <div className="bg-[#FAF8F4] border border-[#E8E4DC] p-6 text-center text-sm text-[#5A5751]">No items match the current filters.</div>
      ) : (
        <div className="overflow-x-auto border border-[#E8E4DC]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F4F2EE] text-left text-[10px] uppercase tracking-wider text-[#5A5751]">
                <th className="px-2 py-2">Item</th>
                <th className="px-2 py-2 hidden sm:table-cell">Category</th>
                <th className="px-2 py-2 hidden md:table-cell">Location</th>
                <th className="px-2 py-2 text-right">On hand</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2 text-right hidden sm:table-cell">Value</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((it) => {
                const badge = STATUS_BADGE[it.status] || STATUS_BADGE.ok;
                const isSel = it.id === selectedId;
                return (
                  <React.Fragment key={it.id}>
                    <tr
                      className={`border-t border-[#E8E4DC] cursor-pointer hover:bg-[#FAF8F4] ${isSel ? 'bg-[#FAF8F4]' : 'bg-white'}`}
                      onClick={() => setSelectedId(isSel ? null : it.id)}
                    >
                      <td className="px-2 py-2">
                        <div className="font-medium text-[#1A1815]">{it.name}</div>
                        <div className="text-[10px] text-[#5A5751]">{it.sku ? `SKU ${it.sku} · ` : ''}{it.movementCount} movement{it.movementCount === 1 ? '' : 's'}</div>
                      </td>
                      <td className="px-2 py-2 hidden sm:table-cell text-[#5A5751]">{it.category || '—'}</td>
                      <td className="px-2 py-2 hidden md:table-cell text-[#5A5751]">{it.location || '—'}</td>
                      <td className="px-2 py-2 text-right tabular-nums text-[#1A1815]">{qtyFmt(it.onHand)} <span className="text-[10px] text-[#5A5751]">{it.unit}</span></td>
                      <td className="px-2 py-2"><span className={`inline-block px-1.5 py-0.5 text-[10px] font-semibold border ${badge.cls}`}>{badge.label}</span></td>
                      <td className="px-2 py-2 text-right tabular-nums hidden sm:table-cell text-[#5A5751]">{money(it.value)}</td>
                    </tr>
                    {isSel && (
                      <tr className="bg-[#FAF8F4]">
                        <td colSpan={6} className="px-2 py-3">
                          <ItemDetail
                            item={it}
                            movements={movements}
                            recordEvents={recordEvents}
                            byLoc={byLoc[it.id] || {}}
                            currentUserPersona={currentUserPersona}
                            onPostMovement={(mv) => {
                              const scopeOnHand = mv.location
                                ? onHandFor(movements, it.id, mv.location)
                                : it.onHand;
                              const check = validateMovement(it, scopeOnHand, mv);
                              if (!check.ok) { setNotice({ kind: 'error', message: check.error }); return false; }
                              recordMovements([mv]);
                              setNotice({ kind: 'ok', message: `${MOVEMENT_LABEL[mv.kind] || mv.kind} posted for "${it.name}".` });
                              return true;
                            }}
                            onTransfer={(qty, fromLocation, toLocation, reason) => {
                              const scopeOnHand = onHandFor(movements, it.id, fromLocation);
                              const probe = { itemId: it.id, kind: 'transfer-out', qty, location: fromLocation };
                              const check = validateMovement(it, scopeOnHand, probe);
                              if (!check.ok) { setNotice({ kind: 'error', message: check.error }); return false; }
                              const pair = buildTransfer({ itemId: it.id, qty, fromLocation, toLocation, reason, actor: currentUserPersona, idBase: `${Date.now()}` });
                              recordMovements(pair);
                              setNotice({ kind: 'ok', message: `Transferred ${qty} ${it.unit} from ${fromLocation || '—'} to ${toLocation || '—'}.` });
                              return true;
                            }}
                            onEditItem={(patch) => {
                              updateItem(it.id, patch);
                              setNotice({ kind: 'ok', message: `Updated "${it.name}" — change recorded in history.` });
                            }}
                          />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <CategoryRollup items={items} movements={movements} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// AddItemForm — create a catalog entry + optional opening count.
// ---------------------------------------------------------------------------
function AddItemForm({ onAdd, onCancel, existingSkus }) {
  const [f, setF] = useState({ name: '', sku: '', category: '', location: '', unit: 'each', reorderPoint: '', unitCost: '', opening: '' });
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const skuDup = f.sku.trim() && existingSkus.includes(f.sku.trim().toUpperCase());
  const canAdd = f.name.trim() && !skuDup;
  return (
    <div className="border border-[#B85838] bg-white p-3 mb-3">
      <div className="text-[11px] uppercase tracking-wider text-[#B85838] mb-2 font-semibold">New item</div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <Field label="Name *"><input className={inputCls} value={f.name} onChange={set('name')} placeholder="Shure SM58 mic" /></Field>
        <Field label="SKU" hint={skuDup ? 'A SKU already exists' : ''}><input className={`${inputCls} ${skuDup ? 'outline outline-2 outline-[#7A1F1F]' : ''}`} value={f.sku} onChange={set('sku')} placeholder="AV-MIC-058" /></Field>
        <Field label="Category"><input className={inputCls} value={f.category} onChange={set('category')} placeholder="Audio" /></Field>
        <Field label="Location"><input className={inputCls} value={f.location} onChange={set('location')} placeholder="Sound booth" /></Field>
        <Field label="Unit">
          <select className={inputCls} value={f.unit} onChange={set('unit')}>{UNITS.map((u) => <option key={u} value={u}>{u}</option>)}</select>
        </Field>
        <Field label="Reorder point" hint="low-stock flag"><input className={inputCls} type="number" min="0" value={f.reorderPoint} onChange={set('reorderPoint')} placeholder="2" /></Field>
        <Field label="Unit cost"><input className={inputCls} type="number" min="0" step="0.01" value={f.unitCost} onChange={set('unitCost')} placeholder="99.00" /></Field>
        <Field label="Opening count" hint="posts a 'Received' movement"><input className={inputCls} type="number" min="0" value={f.opening} onChange={set('opening')} placeholder="4" /></Field>
      </div>
      <div className="flex gap-2 mt-3">
        <button
          type="button"
          disabled={!canAdd}
          onClick={() => onAdd(
            { name: f.name.trim(), sku: f.sku.trim() || null, category: f.category.trim() || null, location: f.location.trim() || null, unit: f.unit, reorderPoint: Number(f.reorderPoint) || 0, unitCost: Number(f.unitCost) || 0 },
            { qty: Number(f.opening) || 0 },
          )}
          className="text-xs uppercase tracking-wider px-3 py-2 border border-[#B85838] text-white bg-[#B85838] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Add item
        </button>
        <button type="button" onClick={onCancel} className="text-xs uppercase tracking-wider px-3 py-2 border border-[#E8E4DC] text-[#5A5751] hover:text-[#1A1815]">Cancel</button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ItemDetail — record a movement, edit the item, and read its full history.
// ---------------------------------------------------------------------------
function ItemDetail({ item, movements, recordEvents, byLoc, onPostMovement, onTransfer, onEditItem, currentUserPersona }) {
  const [tab, setTab] = useState('move');
  const ledger = useMemo(() => itemHistoryFromMovements(movements, item.id), [movements, item.id]);
  const timeline = useMemo(() => versionTimeline(recordEvents, 'inventory_item', item.id), [recordEvents, item.id]);
  const locEntries = Object.entries(byLoc).filter(([, v]) => v !== 0);

  return (
    <div className="border border-[#E8E4DC] bg-white">
      <div className="flex gap-1 border-b border-[#E8E4DC] text-xs">
        {[['move', 'Record movement'], ['edit', 'Edit item'], ['ledger', `Stock ledger (${ledger.length})`], ['history', `Edit history (${timeline.length})`]].map(([k, label]) => (
          <button key={k} type="button" onClick={() => setTab(k)} className={`px-3 py-2 ${tab === k ? 'border-b-2 border-[#B85838] text-[#1A1815] font-medium' : 'text-[#5A5751] hover:text-[#1A1815]'}`}>{label}</button>
        ))}
      </div>

      {locEntries.length > 1 && (
        <div className="px-3 pt-2 text-[10px] text-[#5A5751]">
          By location: {locEntries.map(([loc, v]) => `${loc}: ${qtyFmt(v)}`).join(' · ')}
        </div>
      )}

      <div className="p-3">
        {tab === 'move' && <MovementForm item={item} onPost={onPostMovement} onTransfer={onTransfer} />}
        {tab === 'edit' && <EditItemForm item={item} onSave={onEditItem} />}
        {tab === 'ledger' && <LedgerView ledger={ledger} unit={item.unit} />}
        {tab === 'history' && <HistoryView timeline={timeline} />}
      </div>
    </div>
  );
}

function MovementForm({ item, onPost, onTransfer }) {
  const [kind, setKind] = useState('in');
  const [qty, setQty] = useState('');
  const [loc, setLoc] = useState(item.location || '');
  const [toLoc, setToLoc] = useState('');
  const [reason, setReason] = useState('');
  const isTransfer = kind === 'transfer';
  const submit = () => {
    const n = Number(qty);
    if (!Number.isFinite(n) || (kind !== 'adjust' && n <= 0)) return;
    let ok;
    if (isTransfer) ok = onTransfer(Math.abs(n), loc || null, toLoc || null, reason || 'Transfer');
    else ok = onPost({ itemId: item.id, kind, qty: n, location: loc || null, reason: reason || null });
    if (ok) { setQty(''); setReason(''); }
  };
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 items-end">
      <Field label="Type">
        <select className={inputCls} value={kind} onChange={(e) => setKind(e.target.value)}>
          <option value="in">Received (+)</option>
          <option value="out">Issued (−)</option>
          <option value="adjust">Count adjust (±)</option>
          <option value="transfer">Transfer</option>
        </select>
      </Field>
      <Field label={kind === 'adjust' ? 'Delta (+/−)' : 'Quantity'}>
        <input className={inputCls} type="number" value={qty} onChange={(e) => setQty(e.target.value)} placeholder={kind === 'adjust' ? '-1' : '5'} />
      </Field>
      <Field label={isTransfer ? 'From location' : 'Location'}>
        <input className={inputCls} value={loc} onChange={(e) => setLoc(e.target.value)} placeholder={item.location || 'location'} />
      </Field>
      {isTransfer
        ? <Field label="To location"><input className={inputCls} value={toLoc} onChange={(e) => setToLoc(e.target.value)} placeholder="Sanctuary" /></Field>
        : <Field label="Reason / ref"><input className={inputCls} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Sunday service" /></Field>}
      {isTransfer && <Field label="Reason / ref"><input className={inputCls} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Setup for service" /></Field>}
      <div>
        <button type="button" onClick={submit} className="text-xs uppercase tracking-wider px-3 py-2 border border-[#B85838] text-white bg-[#B85838] hover:opacity-90">Post movement</button>
      </div>
    </div>
  );
}

function EditItemForm({ item, onSave }) {
  const [f, setF] = useState({ name: item.name || '', category: item.category || '', location: item.location || '', reorderPoint: String(item.reorderPoint ?? 0), unitCost: String(item.unitCost ?? 0) });
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <Field label="Name"><input className={inputCls} value={f.name} onChange={set('name')} /></Field>
        <Field label="Category"><input className={inputCls} value={f.category} onChange={set('category')} /></Field>
        <Field label="Location"><input className={inputCls} value={f.location} onChange={set('location')} /></Field>
        <Field label="Reorder point"><input className={inputCls} type="number" min="0" value={f.reorderPoint} onChange={set('reorderPoint')} /></Field>
        <Field label="Unit cost"><input className={inputCls} type="number" min="0" step="0.01" value={f.unitCost} onChange={set('unitCost')} /></Field>
      </div>
      <button
        type="button"
        onClick={() => onSave({ name: f.name.trim(), category: f.category.trim() || null, location: f.location.trim() || null, reorderPoint: Number(f.reorderPoint) || 0, unitCost: Number(f.unitCost) || 0 })}
        className="mt-3 text-xs uppercase tracking-wider px-3 py-2 border border-[#B85838] text-white bg-[#B85838] hover:opacity-90"
      >
        Save change
      </button>
      <p className="text-[10px] text-[#5A5751] mt-2">Saving records a version in this item's edit history (who, when, what changed). On-hand is never edited here — post a count adjustment for that.</p>
    </div>
  );
}

function LedgerView({ ledger, unit }) {
  if (!ledger.length) return <div className="text-sm text-[#5A5751]">No movements yet. Post a "Received" to set the opening count.</div>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-[10px] uppercase tracking-wider text-[#5A5751]">
            <th className="py-1 pr-2">When</th><th className="py-1 pr-2">Type</th><th className="py-1 pr-2 text-right">Change</th><th className="py-1 pr-2 text-right">On hand</th><th className="py-1 pr-2">Where</th><th className="py-1 pr-2">Reason</th><th className="py-1 pr-2">By</th>
          </tr>
        </thead>
        <tbody>
          {ledger.map((r) => (
            <tr key={r.id} className="border-t border-[#E8E4DC]">
              <td className="py-1 pr-2 whitespace-nowrap text-[#5A5751]">{when(r.at)}</td>
              <td className="py-1 pr-2 text-[#5A5751]">{r.label}</td>
              <td className={`py-1 pr-2 text-right tabular-nums font-medium ${r.delta < 0 ? 'text-[#7A1F1F]' : 'text-[#3F5226]'}`}>{r.delta > 0 ? '+' : ''}{qtyFmt(r.delta)}</td>
              <td className="py-1 pr-2 text-right tabular-nums text-[#1A1815]">{qtyFmt(r.onHandAfter)} {unit}</td>
              <td className="py-1 pr-2 text-[#5A5751]">{r.kind === 'transfer-out' ? `${r.location || '—'} → ${r.toLocation || '—'}` : (r.location || '—')}</td>
              <td className="py-1 pr-2 text-[#5A5751]">{r.reason || '—'}</td>
              <td className="py-1 pr-2 text-[#5A5751]">{r.actor || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-[10px] text-[#5A5751] mt-2">Append-only audit trail — these rows cannot be edited or deleted, only corrected by a new movement.</p>
    </div>
  );
}

function HistoryView({ timeline }) {
  if (!timeline.length) return <div className="text-sm text-[#5A5751]">No edits recorded yet. Editing a field above writes a version here.</div>;
  return (
    <div className="space-y-2">
      {timeline.map((v) => (
        <div key={`${v.version}-${v.at}`} className="border-l-2 border-[#B85838] pl-2">
          <div className="text-[10px] uppercase tracking-wider text-[#5A5751]">v{v.version} · {when(v.at)} {v.actor ? `· ${v.actor}` : ''} · {v.action}</div>
          <div className="text-sm text-[#1A1815]">
            {Object.keys(v.changes).length
              ? Object.entries(v.changes).map(([k, c]) => (
                  <span key={k} className="mr-3">{k}: <span className="text-[#7A1F1F]">{String(c.from ?? '∅')}</span> → <span className="text-[#3F5226]">{String(c.to ?? '∅')}</span></span>
                ))
              : <span className="text-[#5A5751]">{v.summary}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

function CategoryRollup({ items, movements }) {
  const roll = useMemo(() => Object.values(rollupByCategory(items, movements)).sort((a, b) => b.value - a.value), [items, movements]);
  if (roll.length <= 1) return null;
  return (
    <div className="mt-6">
      <div className="text-[11px] uppercase tracking-wider text-[#5A5751] mb-2 font-semibold">By category</div>
      <div className="overflow-x-auto border border-[#E8E4DC]">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-[#F4F2EE] text-left text-[10px] uppercase tracking-wider text-[#5A5751]">
              <th className="px-2 py-1.5">Category</th><th className="px-2 py-1.5 text-right">Items</th><th className="px-2 py-1.5 text-right">Units</th><th className="px-2 py-1.5 text-right">Value</th><th className="px-2 py-1.5 text-right">Low / Out</th>
            </tr>
          </thead>
          <tbody>
            {roll.map((r) => (
              <tr key={r.key} className="border-t border-[#E8E4DC]">
                <td className="px-2 py-1.5 text-[#1A1815]">{r.key}</td>
                <td className="px-2 py-1.5 text-right tabular-nums">{qtyFmt(r.items)}</td>
                <td className="px-2 py-1.5 text-right tabular-nums">{qtyFmt(r.units)}</td>
                <td className="px-2 py-1.5 text-right tabular-nums">{money(r.value)}</td>
                <td className="px-2 py-1.5 text-right tabular-nums">{r.low} / {r.out}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
