// =============================================================================
// KitchenInventory — the REUSABLE inventory MODULE (Stock + Counts), chef preset.
// =============================================================================
// Darrell + Chef Mario 2026-06-25/26. Mario wanted a mobile-first app that
// simplifies inventory for a busy kitchen: organize by category, count by weight
// or unit, compare against last time, see value / variance, get flagged when
// something runs low. This is that — built ON the proven primitives, not anew.
//
// HOMED inside Chef's Corner (recipes + inventory together), but ARCHITECTED as a
// reusable MODULE: it takes a `config` (taxonomy + copy; default KITCHEN_CONFIG)
// and renders the same Stock + Counts workflow for ANY context. A church-AV or
// business-assets surface mounts the SAME component with a different config — same
// engine, different vocabulary. It is mounted via a dynamic import (a runtime
// mount, not a static feature-to-feature coupling — module-boundary-guard).
//
//   * ITEMS + ON-HAND + the LEDGER come from lib/inventory.js (migration 0052):
//     on-hand is DERIVED from an append-only movement ledger, never typed. Par
//     level = the item's reorderPoint; value = on-hand * unitCost.
//   * THE COUNT (lib/kitchen-count.js, migration 0053): a chef walks an area,
//     enters what's physically there, sees variance + dollar value live. Closing
//     RECONCILES the ledger (one adjust movement per off line) so on-hand == shelf.
//
// MONEY STAYS THE OWNER'S HAND: tracks cost + value; never takes a payment.
// UNBREAKABLE: SectionBoundary by the host; defensive empty/unwired states;
// optimistic-local-then-cloud; rem chrome (large-print scales it); real controls;
// UiIcon not emoji; theme-covered colors (consistency- + contrast-guard).
import React, { useMemo, useState } from 'react';
import { SectionTitle, MetricCell, TabScroll } from './shared.jsx';
import UiIcon from './UiIcon.jsx';
import {
  decorateItems, filterItems, summarizeInventory, lowStockItems, onHandFor,
} from '../lib/inventory.js';
import { KITCHEN_CONFIG, modeForUnit } from '../lib/kitchen-taxonomy.js';
import {
  makeCount, makeCountLine, summarizeCount, lineVariance, lineVarianceValue,
  varianceStatus, reconcileCount, compareToPrevious,
} from '../lib/kitchen-count.js';
import {
  buildPurchaseDrafts, draftSummary, makePurchaseOrder, makePurchaseOrderLine,
  poToReceiveMovements,
} from '../lib/purchasing.js';

const money = (n) => `$${(Number(n) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const signedMoney = (n) => `${(Number(n) || 0) < 0 ? '−' : '+'}${money(Math.abs(Number(n) || 0))}`;
const qtyFmt = (n) => (Number(n) || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
const when = (iso) => {
  if (!iso) return '';
  try { return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); }
  catch { return iso; }
};

const STATUS_BADGE = {
  ok:  { label: 'OK',  cls: 'bg-[#F0F4EA] text-[#3F5226] border-[#5A6E3D]' },
  low: { label: 'LOW', cls: 'bg-[#FBF7EC] text-[#B45309] border-[#B85838]' },
  out: { label: 'OUT', cls: 'bg-[#FEE2E2] text-[#7A1F1F] border-[#7A1F1F]' },
};
// Variance badges reuse the theme-covered status palette (green / amber / red) so
// every theme — incl. midnight — has a contrast-safe remap (contrast-guard):
// match = good (green), over = caution (amber, same as LOW), short = loss (red).
const VAR_BADGE = {
  match: { label: 'MATCH', cls: 'bg-[#F0F4EA] text-[#3F5226] border-[#5A6E3D]' },
  over:  { label: 'OVER',  cls: 'bg-[#FBF7EC] text-[#B45309] border-[#B85838]' },
  short: { label: 'SHORT', cls: 'bg-[#FEE2E2] text-[#7A1F1F] border-[#7A1F1F]' },
};
// Signed-figure text colors: loss = red, gain/flat = green (the inventory ledger
// convention; all midnight-safe).
const varText = (n) => (Number(n) < 0 ? 'text-[#7A1F1F]' : 'text-[#3F5226]');

const inputCls = 'w-full border border-[#E8E4DC] bg-white px-2 py-1.5 text-sm focus:outline focus:outline-2 focus:outline-[#B85838]';

function Field({ label, children, hint }) {
  return (
    <label className="block">
      <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] mb-1">{label}</div>
      {children}
      {hint && <div className="text-[0.625rem] text-[#5A5751] mt-1">{hint}</div>}
    </label>
  );
}

// Build label resolvers from the config so the SAME component renders any
// vocabulary (kitchen categories, or AV-gear categories, etc.).
function makeLabelers(config) {
  const cat = Object.fromEntries((config.categories || []).map((c) => [c.id, c.label]));
  const area = Object.fromEntries((config.storageAreas || []).map((a) => [a.id, a.label]));
  return {
    catLabel: (id) => (id ? (cat[id] || id) : 'Uncategorized'),
    areaLabel: (id) => (id ? (area[id] || id) : 'Unassigned'),
  };
}

export default function KitchenInventory({
  config = KITCHEN_CONFIG,
  items = [],
  movements = [],
  counts = [],
  countLines = [],
  addItem,
  updateItem,
  recordMovements,
  addCount,
  updateCount,
  addCountLine,
  updateCountLine,
  // Purchasing (0054) — optional; the Purchasing tab only mounts when wired.
  purchaseOrders = [],
  purchaseOrderLines = [],
  addPurchaseOrder,
  updatePurchaseOrder,
  addPurchaseOrderLine,
  currentUserPersona = null,
}) {
  const [tab, setTab] = useState('stock');
  const [notice, setNotice] = useState(null);

  const labelers = useMemo(() => makeLabelers(config), [config]);
  const summary = useMemo(() => summarizeInventory(items, movements), [items, movements]);
  const lows = useMemo(() => lowStockItems(items, movements), [items, movements]);
  const openCount = useMemo(() => counts.find((c) => c.status === 'open') || null, [counts]);
  // The LOOP: live on-hand vs par → draft POs grouped by vendor (derived, always
  // current). Vendors already on an open (approved/placed, not received) PO are
  // suppressed so an approved draft doesn't keep re-appearing before it arrives.
  const onOrderVendors = useMemo(
    () => new Set((purchaseOrders || []).filter((p) => p.status === 'approved' || p.status === 'placed').map((p) => p.vendor || '')),
    [purchaseOrders],
  );
  const drafts = useMemo(
    () => buildPurchaseDrafts(items, movements).filter((d) => !onOrderVendors.has(d.vendor)),
    [items, movements, onOrderVendors],
  );
  const canPurchase = !!addPurchaseOrder;

  // Defensive: never white-screen if wiring is incomplete (hooks run first so the
  // hook order stays stable across renders).
  if (!addItem || !addCount) {
    return (
      <div className="max-w-2xl">
        <SectionTitle eyebrow={config.eyebrow}>{config.title}</SectionTitle>
        <div className="bg-[#FAF8F4] border border-[#E8E4DC] p-6 text-sm text-[#5A5751]">
          {config.title} is not wired to persistence in this view.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      <SectionTitle eyebrow={config.eyebrow}>{config.title}</SectionTitle>

      <p className="text-sm text-[#5A5751] mb-4 max-w-3xl">{config.intro}</p>

      {/* Dashboard — derived from the ledger + the latest count. */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 mb-4">
        <MetricCell label="Items tracked" value={qtyFmt(summary.itemCount)} />
        <MetricCell label="Inventory value" value={money(summary.totalValue)} accent="green" />
        <MetricCell label={`Below ${config.parNoun || 'par'}`} value={qtyFmt(lows.length)} accent={lows.length ? 'rust' : undefined} sub={`${summary.outCount} out`} />
        <MetricCell
          label={openCount ? 'Count in progress' : 'Counts run'}
          value={openCount ? '1 open' : qtyFmt(counts.filter((c) => c.status === 'closed').length)}
          accent={openCount ? 'rust' : undefined}
          sub={openCount ? (openCount.storageArea ? labelers.areaLabel(openCount.storageArea) : `whole ${config.key}`) : 'closed'}
        />
      </div>

      {notice && (
        <div className={`mb-3 px-3 py-2 text-sm border ${notice.kind === 'error' ? 'bg-[#FEE2E2] border-[#7A1F1F] text-[#7A1F1F]' : 'bg-[#F0F4EA] border-[#5A6E3D] text-[#3F5226]'}`} role="status">
          {notice.message}
        </div>
      )}

      {lows.length > 0 && (
        <div className="mb-3 px-3 py-2 text-sm border border-[#B85838] bg-[#FBF7EC] text-[#B45309]">
          <strong>{lows.length}</strong> item{lows.length === 1 ? '' : 's'} at or below {config.parNoun || 'par'} — reorder:{' '}
          {lows.slice(0, 6).map((r) => r.item.name).join(', ')}{lows.length > 6 ? '…' : ''}
        </div>
      )}

      <TabScroll chrome={false} className="mb-4" label={`${config.title} sections`}>
        {[
          ['stock', 'Stock'],
          ['counts', `Counts${openCount ? ' · 1 open' : ''}`],
          ...(canPurchase ? [['purchasing', `Purchasing${drafts.length ? ` · ${drafts.length}` : ''}`]] : []),
        ].map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={`whitespace-nowrap px-3 py-2 text-xs uppercase tracking-wider border-b-2 ${tab === k ? 'border-[#B85838] text-[#1A1815] font-medium' : 'border-transparent text-[#5A5751] hover:text-[#1A1815]'}`}
          >
            {label}
          </button>
        ))}
      </TabScroll>

      {tab === 'stock' && (
        <StockTab
          config={config}
          labelers={labelers}
          items={items}
          movements={movements}
          addItem={addItem}
          recordMovements={recordMovements}
          setNotice={setNotice}
        />
      )}

      {tab === 'counts' && (
        <CountsTab
          config={config}
          labelers={labelers}
          items={items}
          movements={movements}
          counts={counts}
          countLines={countLines}
          openCount={openCount}
          addCount={addCount}
          updateCount={updateCount}
          addCountLine={addCountLine}
          updateCountLine={updateCountLine}
          recordMovements={recordMovements}
          currentUserPersona={currentUserPersona}
          setNotice={setNotice}
        />
      )}

      {tab === 'purchasing' && canPurchase && (
        <PurchasingTab
          config={config}
          labelers={labelers}
          drafts={drafts}
          purchaseOrders={purchaseOrders}
          purchaseOrderLines={purchaseOrderLines}
          addPurchaseOrder={addPurchaseOrder}
          updatePurchaseOrder={updatePurchaseOrder}
          addPurchaseOrderLine={addPurchaseOrderLine}
          recordMovements={recordMovements}
          currentUserPersona={currentUserPersona}
          setNotice={setNotice}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// StockTab — the item catalog: organize by category / storage area, see par
// status + value, add an item with the configured vocabulary.
// ---------------------------------------------------------------------------
function StockTab({ config, labelers, items, movements, addItem, recordMovements, setNotice }) {
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [area, setArea] = useState('');
  const [lowOnly, setLowOnly] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  const visible = useMemo(
    () => filterItems(items, movements, { q, category: category || null, location: area || null, lowOnly }),
    [items, movements, q, category, area, lowOnly],
  );
  const decorated = useMemo(() => decorateItems(items, movements), [items, movements]);

  return (
    <div>
      <div className="flex flex-wrap items-end gap-2 mb-3">
        <div className="flex-1 min-w-[160px]">
          <Field label="Search">
            <input className={inputCls} value={q} onChange={(e) => setQ(e.target.value)} placeholder="name, SKU…" />
          </Field>
        </div>
        <div className="min-w-[140px]">
          <Field label="Category">
            <select className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">All categories</option>
              {config.categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </Field>
        </div>
        <div className="min-w-[140px]">
          <Field label={config.areaNoun ? config.areaNoun.replace(/^\w/, (m) => m.toUpperCase()) : 'Storage area'}>
            <select className={inputCls} value={area} onChange={(e) => setArea(e.target.value)}>
              <option value="">All areas</option>
              {config.storageAreas.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
            </select>
          </Field>
        </div>
        <label className="flex items-center gap-1.5 text-xs text-[#5A5751] pb-2 cursor-pointer">
          <input type="checkbox" checked={lowOnly} onChange={(e) => setLowOnly(e.target.checked)} />
          Below {config.parNoun || 'par'} only
        </label>
        <button
          type="button"
          onClick={() => setShowAdd((s) => !s)}
          className="pb-2 text-xs uppercase tracking-wider px-3 py-2 border border-[#B85838] text-[#B85838] hover:bg-[#B85838] hover:text-white"
        >
          {showAdd ? '× Close' : `+ Add ${config.itemNoun || 'item'}`}
        </button>
      </div>

      {showAdd && (
        <AddItemForm
          config={config}
          onCancel={() => setShowAdd(false)}
          existingSkus={items.map((it) => (it.sku || '').trim().toUpperCase()).filter(Boolean)}
          onAdd={(item, opening) => {
            const id = addItem(item);
            if (opening && Number(opening.qty) > 0) {
              recordMovements([{ itemId: id, kind: 'in', qty: Number(opening.qty), location: item.location || null, reason: 'Opening count' }]);
            }
            setShowAdd(false);
            setNotice({ kind: 'ok', message: `Added "${item.name}".` });
          }}
        />
      )}

      {decorated.length === 0 ? (
        <div className="bg-[#FAF8F4] border border-[#E8E4DC] p-8 text-center">
          <div className="mb-1 flex justify-center text-2xl" aria-hidden="true"><UiIcon name="chefHat" /></div>
          <div className="text-sm text-[#5A5751] mb-1">No items yet.</div>
          <div className="text-xs text-[#5A5751]">{config.emptyHint}</div>
        </div>
      ) : visible.length === 0 ? (
        <div className="bg-[#FAF8F4] border border-[#E8E4DC] p-6 text-center text-sm text-[#5A5751]">No items match the current filters.</div>
      ) : (
        <div className="overflow-x-auto border border-[#E8E4DC]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F4F2EE] text-left text-[0.625rem] uppercase tracking-wider text-[#5A5751]">
                <th className="px-2 py-2">Item</th>
                <th className="px-2 py-2 hidden sm:table-cell">Category</th>
                <th className="px-2 py-2 hidden md:table-cell">Storage</th>
                <th className="px-2 py-2 text-right">On hand</th>
                <th className="px-2 py-2 text-right hidden sm:table-cell">{(config.parNoun || 'par').replace(/^\w/, (m) => m.toUpperCase())}</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2 text-right hidden sm:table-cell">Value</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((it) => {
                const badge = STATUS_BADGE[it.status] || STATUS_BADGE.ok;
                return (
                  <tr key={it.id} className="border-t border-[#E8E4DC] bg-white">
                    <td className="px-2 py-2">
                      <div className="font-medium text-[#1A1815]">{it.name}</div>
                      <div className="text-[0.625rem] text-[#5A5751]">{it.sku ? `SKU ${it.sku} · ` : ''}{money(it.unitCost)}/{it.unit}</div>
                    </td>
                    <td className="px-2 py-2 hidden sm:table-cell text-[#5A5751]">{labelers.catLabel(it.category)}</td>
                    <td className="px-2 py-2 hidden md:table-cell text-[#5A5751]">{labelers.areaLabel(it.location)}</td>
                    <td className="px-2 py-2 text-right tabular-nums text-[#1A1815]">{qtyFmt(it.onHand)} <span className="text-[0.625rem] text-[#5A5751]">{it.unit}</span></td>
                    <td className="px-2 py-2 text-right tabular-nums hidden sm:table-cell text-[#5A5751]">{it.reorderPoint ? qtyFmt(it.reorderPoint) : '—'}</td>
                    <td className="px-2 py-2"><span className={`inline-block px-1.5 py-0.5 text-[0.625rem] font-semibold border ${badge.cls}`}>{badge.label}</span></td>
                    <td className="px-2 py-2 text-right tabular-nums hidden sm:table-cell text-[#5A5751]">{money(it.value)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-[0.625rem] text-[#5A5751] mt-2">On hand and value are derived from the stock ledger. To correct on-hand, run a count — never edit a quantity directly.</p>
    </div>
  );
}

function AddItemForm({ config, onAdd, onCancel, existingSkus }) {
  const cats = config.categories;
  const areas = config.storageAreas;
  const units = config.units;
  const [f, setF] = useState({ name: '', sku: '', category: cats[0]?.id || '', location: areas[0]?.id || '', unit: units[0] || 'each', reorderPoint: '', unitCost: '', vendor: '', opening: '' });
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const skuDup = f.sku.trim() && existingSkus.includes(f.sku.trim().toUpperCase());
  const canAdd = f.name.trim() && !skuDup;
  return (
    <div className="border border-[#B85838] bg-white p-3 mb-3">
      <div className="text-[0.6875rem] uppercase tracking-wider text-[#B85838] mb-2 font-semibold">New {config.itemNoun || 'item'}</div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <Field label="Name *"><input className={inputCls} value={f.name} onChange={set('name')} placeholder="Chicken breast" /></Field>
        <Field label="SKU / PLU" hint={skuDup ? 'A SKU already exists' : ''}><input className={`${inputCls} ${skuDup ? 'outline outline-2 outline-[#7A1F1F]' : ''}`} value={f.sku} onChange={set('sku')} placeholder="PROT-CHK" /></Field>
        <Field label="Category">
          <select className={inputCls} value={f.category} onChange={set('category')}>{cats.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select>
        </Field>
        <Field label={config.areaNoun ? config.areaNoun.replace(/^\w/, (m) => m.toUpperCase()) : 'Storage area'}>
          <select className={inputCls} value={f.location} onChange={set('location')}>{areas.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}</select>
        </Field>
        <Field label="Stock unit">
          <select className={inputCls} value={f.unit} onChange={set('unit')}>{units.map((u) => <option key={u} value={u}>{u}</option>)}</select>
        </Field>
        <Field label={`${(config.parNoun || 'par').replace(/^\w/, (m) => m.toUpperCase())} level`} hint="below this = reorder"><input className={inputCls} type="number" min="0" value={f.reorderPoint} onChange={set('reorderPoint')} placeholder="10" /></Field>
        <Field label="Unit cost"><input className={inputCls} type="number" min="0" step="0.01" value={f.unitCost} onChange={set('unitCost')} placeholder="2.00" /></Field>
        <Field label="Vendor" hint="groups the reorder draft"><input className={inputCls} value={f.vendor} onChange={set('vendor')} placeholder="Sysco" /></Field>
        <Field label="Opening count" hint="posts a 'Received' movement"><input className={inputCls} type="number" min="0" value={f.opening} onChange={set('opening')} placeholder="20" /></Field>
      </div>
      <div className="flex gap-2 mt-3">
        <button
          type="button"
          disabled={!canAdd}
          onClick={() => onAdd(
            { name: f.name.trim(), sku: f.sku.trim() || null, category: f.category, location: f.location, unit: f.unit, reorderPoint: Number(f.reorderPoint) || 0, unitCost: Number(f.unitCost) || 0, vendor: f.vendor.trim() || null },
            { qty: Number(f.opening) || 0 },
          )}
          className="text-xs uppercase tracking-wider px-3 py-2 border border-[#B85838] text-white bg-[#B85838] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Add {config.itemNoun || 'item'}
        </button>
        <button type="button" onClick={onCancel} className="text-xs uppercase tracking-wider px-3 py-2 border border-[#E8E4DC] text-[#5A5751] hover:text-[#1A1815]">Cancel</button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CountsTab — start a count, fill the count sheet (weight or unit), see the
// running variance + value, close it to reconcile the ledger; past counts list.
// ---------------------------------------------------------------------------
function CountsTab({ config, labelers, items, movements, counts, countLines, openCount, addCount, updateCount, addCountLine, updateCountLine, recordMovements, currentUserPersona, setNotice }) {
  if (openCount) {
    return (
      <CountSheet
        config={config}
        labelers={labelers}
        count={openCount}
        items={items}
        movements={movements}
        countLines={countLines.filter((l) => l.countId === openCount.id)}
        addCountLine={addCountLine}
        updateCountLine={updateCountLine}
        onClose={(lines) => {
          const adjusts = reconcileCount(lines, openCount);
          if (adjusts.length) recordMovements(adjusts);
          updateCount(openCount.id, { status: 'closed', closedAt: new Date().toISOString() });
          const s = summarizeCount(lines);
          setNotice({ kind: 'ok', message: `Count closed — ${adjusts.length} adjustment${adjusts.length === 1 ? '' : 's'} posted. Net variance ${signedMoney(s.varianceValue)}.` });
        }}
      />
    );
  }
  return (
    <StartCount
      config={config}
      labelers={labelers}
      counts={counts}
      countLines={countLines}
      addCount={addCount}
      currentUserPersona={currentUserPersona}
      setNotice={setNotice}
    />
  );
}

function StartCount({ config, labelers, counts, countLines, addCount, currentUserPersona, setNotice }) {
  const [area, setArea] = useState('');
  const [label, setLabel] = useState('');
  const closed = useMemo(
    () => counts.filter((c) => c.status === 'closed').sort((a, b) => String(b.closedAt || '').localeCompare(String(a.closedAt || ''))),
    [counts],
  );

  const start = () => {
    const c = makeCount({
      label: label.trim() || (area ? `${labelers.areaLabel(area)} count` : 'Full count'),
      storageArea: area || null,
      countedBy: currentUserPersona,
      startedAt: new Date().toISOString(),
    });
    addCount(c);
    setNotice({ kind: 'ok', message: `Count started${area ? ` — ${labelers.areaLabel(area)}` : ''}. Walk the shelf and enter what's there.` });
  };

  return (
    <div>
      <div className="border border-[#B85838] bg-white p-3 mb-4">
        <div className="text-[0.6875rem] uppercase tracking-wider text-[#B85838] mb-2 font-semibold">Start a count</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
          <Field label="Scope">
            <select className={inputCls} value={area} onChange={(e) => setArea(e.target.value)}>
              <option value="">Whole {config.key}</option>
              {config.storageAreas.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
            </select>
          </Field>
          <Field label="Label" hint="optional">
            <input className={inputCls} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Weekly count" />
          </Field>
          <button type="button" onClick={start} className="text-xs uppercase tracking-wider px-3 py-2 border border-[#B85838] text-white bg-[#B85838] hover:opacity-90">
            Start count
          </button>
        </div>
      </div>

      <div className="text-[0.6875rem] uppercase tracking-wider text-[#5A5751] mb-2 font-semibold">Past counts</div>
      {closed.length === 0 ? (
        <div className="bg-[#FAF8F4] border border-[#E8E4DC] p-6 text-center text-sm text-[#5A5751]">No counts yet. Start one above — your variance history builds from here.</div>
      ) : (
        <div className="space-y-2">
          {closed.map((c, i) => {
            const lines = countLines.filter((l) => l.countId === c.id);
            const s = summarizeCount(lines);
            const prev = closed.slice(i + 1).find((p) => (p.storageArea || null) === (c.storageArea || null));
            const cmp = prev ? compareToPrevious(s, summarizeCount(countLines.filter((l) => l.countId === prev.id))) : null;
            return (
              <div key={c.id} className="border border-[#E8E4DC] bg-white p-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <div className="font-medium text-[#1A1815]">{c.label}</div>
                    <div className="text-[0.625rem] text-[#5A5751]">{c.storageArea ? labelers.areaLabel(c.storageArea) : `Whole ${config.key}`} · {when(c.closedAt)} · {c.countedBy || '—'}</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-semibold tabular-nums ${varText(s.varianceValue)}`}>{signedMoney(s.varianceValue)}</div>
                    <div className="text-[0.625rem] text-[#5A5751]">{s.lineCount} line{s.lineCount === 1 ? '' : 's'} · counted {money(s.countedValue)}</div>
                  </div>
                </div>
                {cmp && (
                  <div className="text-[0.625rem] text-[#5A5751] mt-1">
                    {cmp.tightening ? 'Tighter than last time' : 'Wider than last time'} ({signedMoney(cmp.delta)} vs last {c.storageArea ? labelers.areaLabel(c.storageArea) : 'full'} count)
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// CountSheet — the live count. For each in-scope item: expected on-hand (derived,
// snapshotted on save), a counted input, and the live variance + its value.
// Closing reconciles the ledger.
function CountSheet({ config, labelers, count, items, movements, countLines, addCountLine, updateCountLine, onClose }) {
  const [drafts, setDrafts] = useState({});   // itemId -> string being typed

  const scoped = useMemo(() => {
    const active = (items || []).filter((it) => it && it.active !== false);
    return count.storageArea ? active.filter((it) => (it.location || null) === count.storageArea) : active;
  }, [items, count.storageArea]);

  const lineByItem = useMemo(() => {
    const m = {};
    for (const l of countLines) m[l.itemId] = l;
    return m;
  }, [countLines]);

  // A line's effective values for live display: typed draft (if any) over the saved line.
  const effectiveLine = (it) => {
    const saved = lineByItem[it.id] || null;
    const draft = drafts[it.id];
    const countedQty = draft !== undefined && draft !== '' ? Number(draft) : (saved ? saved.countedQty : null);
    const expectedQty = saved ? saved.expectedQty : onHandFor(movements, it.id);
    return makeCountLine({
      id: saved?.id, countId: count.id, itemId: it.id,
      countedQty: countedQty == null ? 0 : countedQty,
      expectedQty, unitCost: it.unitCost, countUnit: it.unit, countMode: modeForUnit(it.unit),
    });
  };

  // Persist a counted value on blur: snapshot expected on-hand + unit cost now.
  const saveLine = (it, raw) => {
    if (raw === '' || raw === undefined) return;
    const n = Number(raw);
    if (!Number.isFinite(n)) return;
    const saved = lineByItem[it.id] || null;
    const expectedQty = saved ? saved.expectedQty : onHandFor(movements, it.id);
    if (saved && saved.id) {
      updateCountLine(saved.id, { countedQty: n, expectedQty, unitCost: it.unitCost, countUnit: it.unit, countMode: modeForUnit(it.unit), countedAt: new Date().toISOString() });
    } else {
      addCountLine(makeCountLine({
        countId: count.id, itemId: it.id, countedQty: n, expectedQty,
        unitCost: it.unitCost, countUnit: it.unit, countMode: modeForUnit(it.unit), countedAt: new Date().toISOString(),
      }));
    }
  };

  // Plain consts (cheap) so the live totals can't drift from the rendered rows and
  // we don't memoize over the per-render effectiveLine closure.
  const enteredLines = scoped
    .map((it) => (lineByItem[it.id] ? effectiveLine(it) : null))
    .filter(Boolean);
  const running = summarizeCount(enteredLines);
  const countedItems = enteredLines.length;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div>
          <div className="font-medium text-[#1A1815]">{count.label}</div>
          <div className="text-[0.625rem] text-[#5A5751]">{count.storageArea ? labelers.areaLabel(count.storageArea) : `Whole ${config.key}`} · started {when(count.startedAt)} · {countedItems}/{scoped.length} counted</div>
        </div>
        <button
          type="button"
          onClick={() => onClose(enteredLines)}
          disabled={countedItems === 0}
          className="text-xs uppercase tracking-wider px-3 py-2 border border-[#B85838] text-white bg-[#B85838] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Close &amp; reconcile
        </button>
      </div>

      {/* Running totals — derived live from entered lines. */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 mb-3">
        <MetricCell label="Counted value" value={money(running.countedValue)} />
        <MetricCell label="Net variance" value={signedMoney(running.varianceValue)} accent={running.varianceValue < 0 ? 'rust' : undefined} />
        <MetricCell label="Shrink" value={money(running.shrinkValue)} accent={running.shrinkValue < 0 ? 'rust' : undefined} />
        <MetricCell label="Overage" value={money(running.overageValue)} accent="green" />
      </div>

      {scoped.length === 0 ? (
        <div className="bg-[#FAF8F4] border border-[#E8E4DC] p-6 text-center text-sm text-[#5A5751]">
          No items in {count.storageArea ? labelers.areaLabel(count.storageArea) : `the ${config.key}`} yet. Add items in the Stock tab first.
        </div>
      ) : (
        <div className="overflow-x-auto border border-[#E8E4DC]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F4F2EE] text-left text-[0.625rem] uppercase tracking-wider text-[#5A5751]">
                <th className="px-2 py-2">Item</th>
                <th className="px-2 py-2 text-right">Expected</th>
                <th className="px-2 py-2 text-right">Counted</th>
                <th className="px-2 py-2 text-right hidden sm:table-cell">Variance</th>
                <th className="px-2 py-2 text-right">Value</th>
                <th className="px-2 py-2">±</th>
              </tr>
            </thead>
            <tbody>
              {scoped.map((it) => {
                const ln = effectiveLine(it);
                const hasEntry = lineByItem[it.id] || (drafts[it.id] !== undefined && drafts[it.id] !== '');
                const v = lineVariance(ln);
                const vv = lineVarianceValue(ln);
                const st = varianceStatus(ln);
                const badge = VAR_BADGE[st];
                return (
                  <tr key={it.id} className="border-t border-[#E8E4DC] bg-white">
                    <td className="px-2 py-2">
                      <div className="font-medium text-[#1A1815]">{it.name}</div>
                      <div className="text-[0.625rem] text-[#5A5751]">{modeForUnit(it.unit) === 'weight' ? 'weigh' : 'count'} · {money(it.unitCost)}/{it.unit}</div>
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums text-[#5A5751]">{qtyFmt(onHandFor(movements, it.id))} <span className="text-[0.625rem]">{it.unit}</span></td>
                    <td className="px-2 py-2 text-right">
                      <input
                        className={`${inputCls} w-20 text-right`}
                        type="number"
                        inputMode="decimal"
                        value={drafts[it.id] !== undefined ? drafts[it.id] : (lineByItem[it.id] ? String(lineByItem[it.id].countedQty) : '')}
                        onChange={(e) => setDrafts((d) => ({ ...d, [it.id]: e.target.value }))}
                        onBlur={(e) => saveLine(it, e.target.value)}
                        placeholder={qtyFmt(onHandFor(movements, it.id))}
                        aria-label={`Counted quantity for ${it.name} in ${it.unit}`}
                      />
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums hidden sm:table-cell">
                      {hasEntry ? <span className={varText(v)}>{v > 0 ? '+' : ''}{qtyFmt(v)}</span> : <span className="text-[#5A5751]">—</span>}
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums">
                      {hasEntry ? <span className={varText(vv)}>{signedMoney(vv)}</span> : <span className="text-[#5A5751]">—</span>}
                    </td>
                    <td className="px-2 py-2">{hasEntry ? <span className={`inline-block px-1.5 py-0.5 text-[0.625rem] font-semibold border ${badge.cls}`}>{badge.label}</span> : <span className="text-[0.625rem] text-[#5A5751]">—</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-[0.625rem] text-[#5A5751] mt-2">Expected is the system's derived on-hand; variance is counted minus expected. Closing posts one count-adjustment per off line into the append-only ledger so on-hand matches the shelf.</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PurchasingTab — the inventory→purchasing LOOP. Live on-hand vs par produces
// draft purchase orders grouped by vendor (derived, always current). A human
// REVIEWS and APPROVES (preview→execute gate); placing the order / spending money
// stays the owner's hand — the system records the approved order, it never sends
// it or pays. Receiving a placed order posts 'Received' movements that raise
// on-hand (the loop closes; the draft clears).
// ---------------------------------------------------------------------------
function PurchasingTab({ config, labelers, drafts, purchaseOrders, purchaseOrderLines, addPurchaseOrder, updatePurchaseOrder, addPurchaseOrderLine, recordMovements, currentUserPersona, setNotice }) {
  const summary = useMemo(() => draftSummary(drafts), [drafts]);
  const openOrders = useMemo(
    () => (purchaseOrders || []).filter((p) => p.status === 'approved' || p.status === 'placed')
      .sort((a, b) => String(b.approvedAt || '').localeCompare(String(a.approvedAt || ''))),
    [purchaseOrders],
  );
  const receivedOrders = useMemo(
    () => (purchaseOrders || []).filter((p) => p.status === 'received')
      .sort((a, b) => String(b.receivedAt || '').localeCompare(String(a.receivedAt || ''))),
    [purchaseOrders],
  );
  const linesFor = (poId) => (purchaseOrderLines || []).filter((l) => l.poId === poId);

  // APPROVE — record the order (header + line snapshot) at status 'approved'.
  // This is the execute step of preview→execute: it commits the decision but does
  // NOT place the order or move money. The owner places it with the vendor.
  const approve = (draft) => {
    const po = makePurchaseOrder(draft, { status: 'approved' });
    const id = addPurchaseOrder({ ...po, approvedBy: currentUserPersona, approvedAt: new Date().toISOString() });
    if (!id) { setNotice({ kind: 'error', message: 'Could not record the order.' }); return; }
    for (const line of draft.lines) addPurchaseOrderLine(makePurchaseOrderLine(line, id));
    setNotice({ kind: 'ok', message: `Approved ${draft.vendor} order — ${draft.lines.length} item${draft.lines.length === 1 ? '' : 's'}, ${money(draft.totalCost)}. Place it with your vendor; the system won't spend for you.` });
  };

  const markPlaced = (po) => {
    updatePurchaseOrder(po.id, { status: 'placed', placedAt: new Date().toISOString() });
    setNotice({ kind: 'ok', message: `Marked "${po.vendor}" order placed. Receive it when it arrives to update stock.` });
  };

  // RECEIVE — the placed order arrived: post a 'Received' movement per line so
  // on-hand rises (perpetual-inventory tie), then mark the PO received.
  const receive = (po) => {
    const lines = linesFor(po.id);
    const movements = poToReceiveMovements(lines, po);
    if (movements.length) recordMovements(movements);
    updatePurchaseOrder(po.id, { status: 'received', receivedAt: new Date().toISOString() });
    setNotice({ kind: 'ok', message: `Received "${po.vendor}" — ${movements.length} item${movements.length === 1 ? '' : 's'} added to stock.` });
  };

  return (
    <div>
      <p className="text-sm text-[#5A5751] mb-3 max-w-3xl">
        Drafts are generated automatically from what's <strong>below {config.parNoun || 'par'}</strong> right now —
        the quantity to bring each item back up to {config.parNoun || 'par'}, grouped by vendor. Review and
        <strong> approve</strong> an order; <strong>placing it and paying stays your call</strong> — the system
        records the order, it never sends it or spends your money.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 mb-4">
        <MetricCell label="Vendors to order" value={qtyFmt(summary.vendorCount)} accent={summary.vendorCount ? 'rust' : undefined} />
        <MetricCell label="Lines to order" value={qtyFmt(summary.lineCount)} />
        <MetricCell label="Est. order cost" value={money(summary.totalCost)} accent="green" />
        <MetricCell label="Orders on the way" value={qtyFmt(openOrders.length)} sub={`${receivedOrders.length} received`} />
      </div>

      {/* DRAFTS — one card per vendor, the auto-generated "what to order". */}
      {drafts.length === 0 ? (
        <div className="bg-[#FAF8F4] border border-[#E8E4DC] p-6 text-center text-sm text-[#5A5751]">
          Nothing to reorder — every item with a {config.parNoun || 'par'} level is at or above it. Drafts appear here automatically as stock drops below {config.parNoun || 'par'}.
        </div>
      ) : (
        <div className="space-y-3">
          {drafts.map((d) => (
            <div key={d.vendor} className="border border-[#B85838] bg-white">
              <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-[#E8E4DC] bg-[#FBF7EC]">
                <div>
                  <div className="font-medium text-[#1A1815]">{d.vendor}</div>
                  <div className="text-[0.625rem] text-[#5A5751]">{d.lines.length} item{d.lines.length === 1 ? '' : 's'} · est. {money(d.totalCost)}</div>
                </div>
                <button
                  type="button"
                  onClick={() => approve(d)}
                  className="text-xs uppercase tracking-wider px-3 py-2 border border-[#B85838] text-white bg-[#B85838] hover:opacity-90"
                >
                  Approve order
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[0.625rem] uppercase tracking-wider text-[#5A5751]">
                      <th className="px-3 py-1.5">Item</th>
                      <th className="px-3 py-1.5 text-right">On hand</th>
                      <th className="px-3 py-1.5 text-right">{(config.parNoun || 'par').replace(/^\w/, (m) => m.toUpperCase())}</th>
                      <th className="px-3 py-1.5 text-right">Order</th>
                      <th className="px-3 py-1.5 text-right">Est. cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.lines.map((l) => (
                      <tr key={l.itemId} className="border-t border-[#E8E4DC]">
                        <td className="px-3 py-1.5 text-[#1A1815]">{l.name}</td>
                        <td className="px-3 py-1.5 text-right tabular-nums text-[#7A1F1F]">{qtyFmt(l.onHand)} <span className="text-[0.625rem] text-[#5A5751]">{l.unit}</span></td>
                        <td className="px-3 py-1.5 text-right tabular-nums text-[#5A5751]">{qtyFmt(l.par)}</td>
                        <td className="px-3 py-1.5 text-right tabular-nums font-medium text-[#1A1815]">{qtyFmt(l.orderQty)} <span className="text-[0.625rem] text-[#5A5751]">{l.unit}</span></td>
                        <td className="px-3 py-1.5 text-right tabular-nums text-[#5A5751]">{money(l.lineCost)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* OPEN ORDERS — approved (recorded) + placed (owner placed it). */}
      {openOrders.length > 0 && (
        <div className="mt-6">
          <div className="text-[0.6875rem] uppercase tracking-wider text-[#5A5751] mb-2 font-semibold">Orders on the way</div>
          <div className="space-y-2">
            {openOrders.map((po) => (
              <div key={po.id} className="border border-[#E8E4DC] bg-white p-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="font-medium text-[#1A1815]">{po.vendor} <span className={`ml-1 text-[0.625rem] uppercase tracking-wider px-1.5 py-0.5 border ${po.status === 'placed' ? 'bg-[#F0F4EA] text-[#3F5226] border-[#5A6E3D]' : 'bg-[#FBF7EC] text-[#B45309] border-[#B85838]'}`}>{po.status}</span></div>
                  <div className="text-[0.625rem] text-[#5A5751]">{linesFor(po.id).length} item{linesFor(po.id).length === 1 ? '' : 's'} · est. {money(po.totalCost)} · approved {when(po.approvedAt)}{po.approvedBy ? ` · ${po.approvedBy}` : ''}</div>
                </div>
                <div className="flex gap-2">
                  {po.status === 'approved' && (
                    <button type="button" onClick={() => markPlaced(po)} className="text-xs uppercase tracking-wider px-3 py-2 border border-[#B85838] text-[#B85838] hover:bg-[#B85838] hover:text-white">I placed it</button>
                  )}
                  <button type="button" onClick={() => receive(po)} className="text-xs uppercase tracking-wider px-3 py-2 border border-[#5A6E3D] text-white bg-[#5A6E3D] hover:opacity-90">Receive into stock</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {receivedOrders.length > 0 && (
        <div className="mt-6">
          <div className="text-[0.6875rem] uppercase tracking-wider text-[#5A5751] mb-2 font-semibold">Received</div>
          <div className="space-y-1">
            {receivedOrders.slice(0, 10).map((po) => (
              <div key={po.id} className="text-xs text-[#5A5751] flex justify-between gap-2 border-b border-[#E8E4DC] py-1">
                <span>{po.vendor} · {linesFor(po.id).length} items</span>
                <span className="tabular-nums">{money(po.totalCost)} · {when(po.receivedAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-[0.625rem] text-[#5A5751] mt-3">Drafts are derived live from on-hand vs {config.parNoun || 'par'}. Approving records the order; the system never places it or moves money — you place it with the vendor. Receiving posts the items into the stock ledger so on-hand updates.</p>
    </div>
  );
}
