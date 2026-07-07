// =============================================================================
// MooreDivahs — the Moore Divahs Order Board (Shay's fashion business)
// =============================================================================
// The inbox-digging killer (discovery 2026-07-07): one screen that answers who
// paid, who is in week two of the 3-week clock, who ships vs pickup, and who
// still needs the follow-up ask — instead of re-reading five DM inboxes.
// Pure rules: lib/moore-divahs.js. Live store: lib/use-moore-orders.js
// (localStorage + custom_orders realtime, instance-scoped by RLS/0083).
// Money is the owner's hand: the board RECORDS how Shay collected (Square /
// Venmo / Apple Pay); it never processes payment.
// =============================================================================
import React, { useMemo, useState } from 'react';
import {
  MOORE_BRAND, ORDER_STAGE_ORDER, orderStageMeta, nextOrderStage, orderClock,
  PRODUCT_TYPES, ORDER_CHANNELS, PAY_METHODS, CHANGE_BANDS, CHANGE_REASONS,
  changeOrderFee, orderStats, bulkPickList, bulkTotals, isSeedOrder, BULK_CUTS,
  CLASS_FORMATS, seatsLeft, canBook,
  INVENTORY_CATEGORIES, inventoryValueCents, classStats, revenueGoalPlan,
} from '../lib/moore-divahs.js';
import { useMooreOrders, addOrder, advanceOrder, payOrder, recordChangeOrder, patchOrder } from '../lib/use-moore-orders.js';
import { useMooreClasses, addSession, addPaidSignup } from '../lib/use-moore-classes.js';
import { useMooreInventory, addInventoryItem, adjustInventoryQty } from '../lib/use-moore-inventory.js';
import AddressField, { osmLink } from './AddressField.jsx';
import SectionTabs from './SectionTabs.jsx';

const fmt$ = (cents) => (cents == null ? '—' : `$${(cents / 100).toFixed(2)}`);
const SERIF = { fontFamily: '"Fraunces", serif' };

// Stage chip colors ride the sanctioned themed tokens only (no new hex):
// pre = grey, work = blue, done = olive, lost = grey. Overdue = clay (never
// true red — red is reserved, Color Theology / DR-0099).
const GROUP_TEXT = { pre: 'text-[#5A5751]', work: 'text-[#2A5A8E]', done: 'text-[#5A6E3D]', lost: 'text-[#5A5751]' };
const GROUP_BORDER = { pre: 'border-[#5A5751]', work: 'border-[#2A5A8E]', done: 'border-[#5A6E3D]', lost: 'border-[#5A5751]' };

function KpiTile({ label, value }) {
  return (
    <div className="rounded-xl border border-[#E8E2D8] bg-[#FAF8F4] px-3 py-2">
      <div className="text-xs uppercase tracking-wide text-[#5A5751]">{label}</div>
      <div className="text-lg font-semibold text-[#1A1815]" style={SERIF}>{value}</div>
    </div>
  );
}

function ClockBadge({ order }) {
  const clock = orderClock(order);
  if (!clock.running) return null;
  const label = clock.overdue ? `${Math.abs(clock.daysLeft)}d over` : `${clock.daysLeft}d left`;
  const tone = clock.overdue ? 'text-[#B85838] border-[#B85838]' : 'text-[#2A5A8E] border-[#2A5A8E]';
  return <span className={`ml-2 rounded-full border px-2 py-0.5 text-xs ${tone}`}>◔ {label}</span>;
}

function ChangeOrderMini({ order }) {
  const [open, setOpen] = useState(false);
  const [band, setBand] = useState('in-production');
  const [reason, setReason] = useState('customer-requested');
  const [pct, setPct] = useState(50);
  const quote = changeOrderFee({ band, reason, orderTotalCents: order.quoteCents, materialsCents: order.materialsCents, shayPct: pct });
  if (!open) {
    return (
      <button type="button" className="text-xs text-[#5A5751] underline" onClick={() => setOpen(true)}>
        Change order…
      </button>
    );
  }
  return (
    <div className="mt-2 rounded-lg border border-[#E8E2D8] bg-[#FAF8F4] p-2 text-xs">
      <div className="flex flex-wrap gap-2">
        <select aria-label="Change stage" className="rounded border border-[#E8E2D8] bg-white px-1 py-0.5" value={band} onChange={(e) => setBand(e.target.value)}>
          {Object.entries(CHANGE_BANDS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select aria-label="Change reason" className="rounded border border-[#E8E2D8] bg-white px-1 py-0.5" value={reason} onChange={(e) => setReason(e.target.value)}>
          {CHANGE_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        {band === 'in-production' && reason === 'customer-requested' && (
          <label className="flex items-center gap-1 text-[#5A5751]">
            Shay&rsquo;s %
            <input aria-label="Shay percent" type="number" min="50" max="200" className="w-14 rounded border border-[#E8E2D8] bg-white px-1 py-0.5" value={pct} onChange={(e) => setPct(Number(e.target.value))} />
          </label>
        )}
      </div>
      <div className="mt-1 text-[#1A1815]">
        {quote.allowed
          ? <>Fee: <strong>{fmt$(quote.feeCents)}</strong> <span className="text-[#5A5751]">({quote.basis})</span></>
          : <span className="text-[#5A5751]">{quote.basis}</span>}
      </div>
      <div className="mt-1 flex gap-2">
        {quote.allowed && (
          <button
            type="button"
            className="rounded-lg border border-[#5A6E3D] px-2 py-0.5 text-[#5A6E3D]"
            onClick={() => { recordChangeOrder(order, { band, reason, shayPct: pct, acceptedByCustomer: true }); setOpen(false); }}
          >
            ✓ Record (customer accepted)
          </button>
        )}
        <button type="button" className="rounded-lg border border-[#E8E2D8] px-2 py-0.5 text-[#5A5751]" onClick={() => setOpen(false)}>Close</button>
      </div>
    </div>
  );
}

function OrderCard({ order }) {
  const meta = orderStageMeta(order.stage);
  const next = nextOrderStage(order.stage);
  const canPay = !order.paidAt && (order.stage === 'quoted' || order.stage === 'designing' || order.stage === 'inquiry');
  const picks = order.productType === 'bulk-apparel' && order.bulkLines?.length ? bulkPickList(order.bulkLines) : null;
  return (
    <div className="rounded-xl border border-[#E8E2D8] bg-white p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-semibold text-[#1A1815]" style={SERIF}>
            {order.customerName || 'Unnamed customer'}
            <ClockBadge order={order} />
          </div>
          <div className="text-xs text-[#5A5751]">
            {(PRODUCT_TYPES.find((p) => p.key === order.productType) || {}).label || order.productType}
            {order.fabric ? ` · ${order.fabric}` : ''} · via {order.channel}
            {order.quoteCents ? ` · ${fmt$(order.quoteCents)}` : ''}
            {order.paidAt ? ` · paid (${order.payMethod})` : ' · not paid'}
            {` · ${order.delivery === 'pickup' ? 'pickup' : 'ship'}`}
          </div>
          {order.description ? <div className="mt-1 text-xs text-[#1A1815]">{order.description}</div> : null}
          {picks ? (
            <ul className="mt-1 list-disc pl-4 text-xs text-[#1A1815]">
              {picks.map((p, i) => <li key={i}>{p}</li>)}
            </ul>
          ) : null}
        </div>
        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs ${GROUP_TEXT[meta.group]} ${GROUP_BORDER[meta.group]}`}>
          {meta.symbol} {meta.label}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
        {canPay && PAY_METHODS.slice(0, 3).map((m) => (
          <button key={m} type="button" className="rounded-lg border border-[#5A6E3D] px-2 py-0.5 text-[#5A6E3D]" onClick={() => payOrder(order, m)}>
            ◉ Paid via {m}
          </button>
        ))}
        {next && !canPay && (
          <button type="button" className="rounded-lg border border-[#2A5A8E] px-2 py-0.5 text-[#2A5A8E]" onClick={() => advanceOrder(order, next)}>
            → {orderStageMeta(next).label}
          </button>
        )}
        {order.stage === 'delivered' && !order.followUp?.asked && (
          <button type="button" className="rounded-lg border border-[#B85838] px-2 py-0.5 text-[#B85838]" onClick={() => patchOrder(order, { followUp: { ...order.followUp, asked: true } })}>
            ✦ Asked how they liked it + for a photo
          </button>
        )}
        {order.paidAt && orderStageMeta(order.stage).group === 'work' && <ChangeOrderMini order={order} />}
      </div>
    </div>
  );
}

const BLANK = { customerName: '', contactValue: '', channel: 'instagram', productType: 'custom-clothing', description: '', sizeOrMeasurements: '', fabric: '', quote: '', delivery: 'ship', policyAccepted: true };
const BLANK_LINE = { qty: '', cut: 'adult', size: '', color: '', names: '' };

// The Google-Doc killer, at the source: one structured row per "6 adult M blue
// + names" line, so a 25-page group order arrives as data Shay can cut from —
// never prose she digs through.
function BulkLineEditor({ lines, setLines }) {
  const [draft, setDraft] = useState(BLANK_LINE);
  const setD = (k) => (e) => setDraft({ ...draft, [k]: e.target.value });
  const addLine = () => {
    const qty = Math.max(1, Math.round(parseFloat(draft.qty) || 1));
    setLines([...lines, {
      qty,
      cut: draft.cut,
      size: draft.size || 'M',
      color: draft.color,
      names: draft.names.split(',').map((n) => n.trim()).filter(Boolean),
    }]);
    setDraft(BLANK_LINE);
  };
  const totals = bulkTotals(lines);
  return (
    <div className="col-span-2 rounded-lg border border-[#E8E2D8] bg-white p-2 sm:col-span-3">
      <div className="text-xs font-semibold text-[#1A1815]">Line items — qty × cut × size × color + names</div>
      {lines.length > 0 && (
        <ul className="mt-1 list-disc pl-4 text-xs text-[#1A1815]">
          {bulkPickList(lines).map((p, i) => (
            <li key={i}>
              {p}{' '}
              <button type="button" aria-label={`Remove line ${i + 1}`} className="text-[#B85838] underline" onClick={() => setLines(lines.filter((_, j) => j !== i))}>remove</button>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-1 flex flex-wrap items-center gap-1.5">
        <input aria-label="Line quantity" placeholder="Qty" inputMode="numeric" className="w-14 rounded border border-[#E8E2D8] px-1.5 py-0.5 text-xs" value={draft.qty} onChange={setD('qty')} />
        <select aria-label="Line cut" className="rounded border border-[#E8E2D8] bg-white px-1 py-0.5 text-xs" value={draft.cut} onChange={setD('cut')}>
          {BULK_CUTS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input aria-label="Line size" placeholder="Size" className="w-14 rounded border border-[#E8E2D8] px-1.5 py-0.5 text-xs" value={draft.size} onChange={setD('size')} />
        <input aria-label="Line color" placeholder="Color" className="w-20 rounded border border-[#E8E2D8] px-1.5 py-0.5 text-xs" value={draft.color} onChange={setD('color')} />
        <input aria-label="Line names" placeholder="Names, comma-separated" className="min-w-32 flex-1 rounded border border-[#E8E2D8] px-1.5 py-0.5 text-xs" value={draft.names} onChange={setD('names')} />
        <button type="button" className="rounded-lg border border-[#5A6E3D] px-2 py-0.5 text-xs text-[#5A6E3D]" onClick={addLine}>+ Add line</button>
      </div>
      {totals.pieces > 0 && (
        <div className="mt-1 text-xs text-[#5A5751]">{totals.pieces} pieces across {totals.lines} lines · {totals.named} named</div>
      )}
    </div>
  );
}

function AddOrderForm({ onDone }) {
  const [f, setF] = useState(BLANK);
  const [bulkLines, setBulkLines] = useState([]);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    if (!f.customerName.trim()) return;
    await addOrder({
      ...f,
      quoteCents: Math.round((parseFloat(f.quote) || 0) * 100),
      bulkLines: f.productType === 'bulk-apparel' ? bulkLines : [],
    });
    setF(BLANK);
    setBulkLines([]);
    onDone?.();
  };
  return (
    <form onSubmit={submit} className="mt-2 grid grid-cols-2 gap-2 rounded-xl border border-[#E8E2D8] bg-[#FAF8F4] p-3 text-sm sm:grid-cols-3">
      <input aria-label="Customer name" required placeholder="Customer name" className="rounded border border-[#E8E2D8] bg-white px-2 py-1" value={f.customerName} onChange={set('customerName')} />
      <input aria-label="Contact" placeholder="DM handle / email" className="rounded border border-[#E8E2D8] bg-white px-2 py-1" value={f.contactValue} onChange={set('contactValue')} />
      <select aria-label="Channel" className="rounded border border-[#E8E2D8] bg-white px-2 py-1" value={f.channel} onChange={set('channel')}>
        {ORDER_CHANNELS.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
      <select aria-label="Product" className="rounded border border-[#E8E2D8] bg-white px-2 py-1" value={f.productType} onChange={set('productType')}>
        {PRODUCT_TYPES.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
      </select>
      <input aria-label="Size or measurements" placeholder="Size / measurements" className="rounded border border-[#E8E2D8] bg-white px-2 py-1" value={f.sizeOrMeasurements} onChange={set('sizeOrMeasurements')} />
      <input aria-label="Fabric" placeholder="Fabric" className="rounded border border-[#E8E2D8] bg-white px-2 py-1" value={f.fabric} onChange={set('fabric')} />
      <input aria-label="Quote dollars" placeholder="Quote $ (materials included)" inputMode="decimal" className="rounded border border-[#E8E2D8] bg-white px-2 py-1" value={f.quote} onChange={set('quote')} />
      <select aria-label="Delivery" className="rounded border border-[#E8E2D8] bg-white px-2 py-1" value={f.delivery} onChange={set('delivery')}>
        <option value="ship">Ship</option>
        <option value="pickup">Local pickup</option>
      </select>
      <input aria-label="Description" placeholder="What they want, their words" className="col-span-2 rounded border border-[#E8E2D8] bg-white px-2 py-1 sm:col-span-1" value={f.description} onChange={set('description')} />
      {f.productType === 'bulk-apparel' && <BulkLineEditor lines={bulkLines} setLines={setBulkLines} />}
      <button type="submit" className="col-span-2 rounded-lg bg-[#B85838] px-3 py-1.5 font-semibold text-white sm:col-span-3">
        Add order
      </button>
    </form>
  );
}

// ---- Classes — sessions + paid-seat holds (cap 10 group / 1-on-1 2.5h) ------
const BLANK_SESSION = { format: 'group', project: '', dateIso: '', location: '', locationLat: null, locationLon: null, price: '' };

function SeatForm({ session, signups }) {
  const [name, setName] = useState('');
  const [method, setMethod] = useState('square');
  const gate = canBook(session, signups);
  if (!gate.ok) return <span className="text-xs text-[#5A5751]">{gate.reason}</span>;
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      <input aria-label="Student name" placeholder="Student name" className="rounded border border-[#E8E2D8] px-1.5 py-0.5 text-xs" value={name} onChange={(e) => setName(e.target.value)} />
      <select aria-label="Seat pay method" className="rounded border border-[#E8E2D8] bg-white px-1 py-0.5 text-xs" value={method} onChange={(e) => setMethod(e.target.value)}>
        {PAY_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
      </select>
      <button
        type="button"
        className="rounded-lg border border-[#5A6E3D] px-2 py-0.5 text-xs text-[#5A6E3D]"
        onClick={() => { if (name.trim()) { addPaidSignup(session, { studentName: name, method }); setName(''); } }}
      >
        ◉ Paid — hold seat
      </button>
    </span>
  );
}

function ClassesSection() {
  const { sessions, signups } = useMooreClasses();
  const [adding, setAdding] = useState(false);
  const [f, setF] = useState(BLANK_SESSION);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const spec = CLASS_FORMATS[f.format];
  const submit = async (e) => {
    e.preventDefault();
    if (!f.dateIso) return;
    await addSession({
      format: f.format, project: f.project, location: f.location,
      locationLat: f.locationLat, locationLon: f.locationLon,
      dateIso: new Date(f.dateIso).toISOString(),
      priceCents: f.price ? Math.round(parseFloat(f.price) * 100) : spec.priceCentsDefault,
    });
    setF(BLANK_SESSION);
    setAdding(false);
  };
  const upcoming = [...sessions].filter((s) => s && s.seed !== true).sort((a, b) => String(a.dateIso).localeCompare(String(b.dateIso)));
  return (
    <div className="mt-8">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#1A1815]" style={SERIF}>Sewing Classes</h2>
          <p className="text-xs text-[#5A5751]">Machines + materials provided — just show up and create. A seat is held when it&rsquo;s paid.</p>
        </div>
        <button type="button" className="rounded-lg border border-[#B85838] px-3 py-1.5 text-sm font-semibold text-[#B85838]" onClick={() => setAdding((v) => !v)}>
          {adding ? 'Close' : '+ Schedule class'}
        </button>
      </div>
      {adding && (
        <form onSubmit={submit} className="mt-2 grid grid-cols-2 gap-2 rounded-xl border border-[#E8E2D8] bg-[#FAF8F4] p-3 text-sm sm:grid-cols-3">
          <select aria-label="Class format" className="rounded border border-[#E8E2D8] bg-white px-2 py-1" value={f.format} onChange={set('format')}>
            {Object.entries(CLASS_FORMATS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <input aria-label="Class project" placeholder="This session's project" className="rounded border border-[#E8E2D8] bg-white px-2 py-1" value={f.project} onChange={set('project')} />
          <input aria-label="Class date" type="datetime-local" className="rounded border border-[#E8E2D8] bg-white px-2 py-1" value={f.dateIso} onChange={set('dateIso')} />
          <AddressField
            ariaLabel="Class location"
            placeholder="Location — type the address"
            value={f.location}
            onChange={(v) => setF((cur) => ({ ...cur, location: v, locationLat: null, locationLon: null }))}
            onPick={(loc) => setF((cur) => ({ ...cur, location: loc.label, locationLat: loc.lat, locationLon: loc.lon }))}
          />
          <input aria-label="Class price dollars" placeholder={`Price $ (default ${(spec.priceCentsDefault / 100).toFixed(0)})`} inputMode="decimal" className="rounded border border-[#E8E2D8] bg-white px-2 py-1" value={f.price} onChange={set('price')} />
          <button type="submit" className="rounded-lg bg-[#B85838] px-3 py-1.5 font-semibold text-white">Schedule</button>
        </form>
      )}
      {upcoming.length === 0 ? (
        <div className="mt-3 rounded-xl border border-dashed border-[#E8E2D8] p-4 text-center text-sm text-[#5A5751]">
          No classes scheduled yet — dates are set about a month ahead so people can book their seat.
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          {upcoming.map((s) => {
            const left = seatsLeft(s, signups);
            const roster = signups.filter((x) => x.sessionId === s.id && x.paidAt);
            return (
              <div key={s.id} className="rounded-xl border border-[#E8E2D8] bg-white p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold text-[#1A1815]" style={SERIF}>
                      {CLASS_FORMATS[s.format]?.label || s.format}{s.project ? ` — ${s.project}` : ''}
                    </div>
                    <div className="text-xs text-[#5A5751]">
                      {s.dateIso ? new Date(s.dateIso).toLocaleString() : 'date TBD'}
                      {s.location ? ` · ${s.location}` : ''} · {fmt$(s.priceCents)}
                      {s.format === 'one-on-one' ? ` · ${CLASS_FORMATS['one-on-one'].durationHours}h session` : ''}
                      {osmLink(s.locationLat, s.locationLon) && (
                        <> · <a className="underline" href={osmLink(s.locationLat, s.locationLon)} target="_blank" rel="noreferrer">map</a></>
                      )}
                    </div>
                    {roster.length > 0 && (
                      <div className="mt-1 text-xs text-[#1A1815]">Paid seats: {roster.map((r) => r.studentName).join(', ')}</div>
                    )}
                  </div>
                  <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs ${left > 0 ? 'text-[#5A6E3D] border-[#5A6E3D]' : 'text-[#B85838] border-[#B85838]'}`}>
                    {left > 0 ? `${left} of ${s.seatCap} seats left` : 'Full — every seat paid'}
                  </span>
                </div>
                <div className="mt-2 text-xs">
                  <SeatForm session={s} signups={signups} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---- Materials — on hand + spend, the cost input to margin ------------------
const BLANK_ITEM = { name: '', category: 'fabric', qty: '', unit: 'yards', cost: '' };

function MaterialsSection() {
  const items = useMooreInventory();
  const [adding, setAdding] = useState(false);
  const [f, setF] = useState(BLANK_ITEM);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const real = items.filter((i) => i && i.seed !== true);
  const value = inventoryValueCents(real);
  const submit = async (e) => {
    e.preventDefault();
    if (!f.name.trim()) return;
    await addInventoryItem({
      name: f.name, category: f.category, unit: f.unit,
      qty: parseFloat(f.qty) || 0,
      unitCostCents: Math.round((parseFloat(f.cost) || 0) * 100),
    });
    setF(BLANK_ITEM);
    setAdding(false);
  };
  return (
    <div className="mt-8">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#1A1815]" style={SERIF}>Materials</h2>
          <p className="text-xs text-[#5A5751]">
            On hand: {real.length ? `${real.length} items · ${fmt$(value)} value` : 'nothing tracked yet'} — real spend feeds the margin above.
          </p>
        </div>
        <button type="button" className="rounded-lg border border-[#B85838] px-3 py-1.5 text-sm font-semibold text-[#B85838]" onClick={() => setAdding((v) => !v)}>
          {adding ? 'Close' : '+ Material'}
        </button>
      </div>
      {adding && (
        <form onSubmit={submit} className="mt-2 grid grid-cols-2 gap-2 rounded-xl border border-[#E8E2D8] bg-[#FAF8F4] p-3 text-sm sm:grid-cols-5">
          <input aria-label="Material name" required placeholder="Material" className="rounded border border-[#E8E2D8] bg-white px-2 py-1" value={f.name} onChange={set('name')} />
          <select aria-label="Material category" className="rounded border border-[#E8E2D8] bg-white px-2 py-1" value={f.category} onChange={set('category')}>
            {INVENTORY_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input aria-label="Material quantity" placeholder="Qty" inputMode="decimal" className="rounded border border-[#E8E2D8] bg-white px-2 py-1" value={f.qty} onChange={set('qty')} />
          <input aria-label="Material unit" placeholder="Unit (yards)" className="rounded border border-[#E8E2D8] bg-white px-2 py-1" value={f.unit} onChange={set('unit')} />
          <input aria-label="Material unit cost" placeholder="Cost $/unit" inputMode="decimal" className="rounded border border-[#E8E2D8] bg-white px-2 py-1" value={f.cost} onChange={set('cost')} />
          <button type="submit" className="col-span-2 rounded-lg bg-[#B85838] px-3 py-1.5 font-semibold text-white sm:col-span-5">Add material</button>
        </form>
      )}
      {real.length > 0 && (
        <div className="mt-2 space-y-1.5">
          {real.map((i) => (
            <div key={i.id} className="flex items-center justify-between rounded-xl border border-[#E8E2D8] bg-white px-3 py-2 text-sm">
              <span className="text-[#1A1815]">
                <strong>{i.name}</strong> <span className="text-[#5A5751]">· {i.category} · {i.qty} {i.unit} · {fmt$(i.unitCostCents)}/{i.unit}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <button type="button" aria-label={`Use one ${i.unit} of ${i.name}`} className="rounded-lg border border-[#5A5751] px-2 py-0.5 text-xs text-[#5A5751]" onClick={() => adjustInventoryQty(i, -1)}>−1</button>
                <button type="button" aria-label={`Add one ${i.unit} of ${i.name}`} className="rounded-lg border border-[#5A6E3D] px-2 py-0.5 text-xs text-[#5A6E3D]" onClick={() => adjustInventoryQty(i, 1)}>+1</button>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---- KPIs + the revenue-goal planner (her data, her goal) --------------------
function KpiSection({ orders }) {
  const { sessions, signups } = useMooreClasses();
  const [goal, setGoal] = useState('');
  const os = useMemo(() => orderStats(orders), [orders]);
  const cs = useMemo(() => classStats(sessions, signups), [sessions, signups]);
  const plan = useMemo(
    () => revenueGoalPlan(Math.round((parseFloat(goal) || 0) * 100), { orders, sessions, signups }),
    [goal, orders, sessions, signups]
  );
  const money = (c) => (c ? fmt$(c) : '—');
  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold text-[#1A1815]" style={SERIF}>The numbers</h2>
      <p className="text-xs text-[#5A5751]">Every figure is computed from real orders, classes, and changes — nothing painted.</p>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <KpiTile label="Order revenue" value={money(os.revenueCents)} />
        <KpiTile label="Class revenue" value={money(cs.revenueCents)} />
        <KpiTile label="Repeat rate" value={os.repeatRatePct == null ? '—' : `${os.repeatRatePct}%`} />
        <KpiTile label="Change orders" value={os.changeOrders} />
      </div>
      {(Object.keys(os.byChannel).length > 0 || cs.sessions > 0) && (
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {Object.keys(os.byChannel).length > 0 && (
            <div className="rounded-xl border border-[#E8E2D8] bg-white p-3 text-sm">
              <div className="text-xs font-semibold uppercase tracking-wide text-[#5A5751]">Revenue by channel</div>
              {Object.entries(os.byChannel).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
                <div key={k} className="mt-1 flex justify-between text-[#1A1815]"><span>{k}</span><span>{fmt$(v)}</span></div>
              ))}
            </div>
          )}
          {cs.sessions > 0 && (
            <div className="rounded-xl border border-[#E8E2D8] bg-white p-3 text-sm">
              <div className="text-xs font-semibold uppercase tracking-wide text-[#5A5751]">Classes</div>
              <div className="mt-1 flex justify-between text-[#1A1815]"><span>Group</span><span>{money(cs.groupRevenueCents)}</span></div>
              <div className="flex justify-between text-[#1A1815]"><span>One-on-one</span><span>{money(cs.oneOnOneRevenueCents)}</span></div>
              <div className="flex justify-between text-[#1A1815]"><span>Seat fill</span><span>{cs.fillRatePct == null ? '—' : `${cs.fillRatePct}%`}</span></div>
            </div>
          )}
        </div>
      )}
      <div className="mt-3 rounded-xl border border-[#E8E2D8] bg-[#FAF8F4] p-3">
        <label className="text-sm font-semibold text-[#1A1815]" style={SERIF}>
          What do you want to make?
          <input aria-label="Revenue goal dollars" placeholder="Goal $" inputMode="decimal" className="ml-2 w-28 rounded border border-[#E8E2D8] bg-white px-2 py-1 text-sm font-normal" value={goal} onChange={(e) => setGoal(e.target.value)} />
        </label>
        <div className="mt-2 text-sm text-[#1A1815]">
          {plan.hasHistory && plan.goalCents > 0 ? (
            <>
              {plan.lanes.map((l) => (
                <div key={l.lane} className="flex justify-between">
                  <span>{l.lane} <span className="text-xs text-[#5A5751]">({l.evidence})</span></span>
                  <span>{l.unitsToGoal} to goal · {fmt$(l.perUnitCents)} each</span>
                </div>
              ))}
              <p className="mt-1 text-xs text-[#5A5751]">{plan.note}</p>
            </>
          ) : (
            <span className="text-xs text-[#5A5751]">{plan.note}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MooreDivahs() {
  const orders = useMooreOrders();
  const [adding, setAdding] = useState(false);
  const real = useMemo(() => orders.filter((o) => o && !isSeedOrder(o)), [orders]);
  const stats = useMemo(() => orderStats(real), [real]);
  const byStage = useMemo(() => {
    const m = new Map();
    for (const s of ORDER_STAGE_ORDER) m.set(s, []);
    for (const o of real) m.get(orderStageMeta(o.stage) === orderStageMeta('inquiry') && !ORDER_STAGE_ORDER.includes(o.stage) ? 'inquiry' : o.stage)?.push(o);
    return m;
  }, [real]);

  // Sliding section tabs (Darrell 2026-07-04 "sliding tabs for all tabs";
  // 2026-07-07 "no more down scrolling to see a surface with KPIs"): the brand
  // header, the + New order intake, and the KPI strip stay PINNED above the
  // strip; the four stacked blocks — the order board, classes, materials, and
  // the numbers/goal planner — each become one swipe-tab instead of a long
  // scroll. Blocks moved verbatim; each section still tells the truth when
  // empty (no dead-end panels).
  const sections = [
    {
      id: 'orders',
      label: 'Orders',
      icon: 'pin',
      render: () => (real.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-[#E8E2D8] p-6 text-center text-sm text-[#5A5751]">
          No orders yet — tap <strong>+ New order</strong> when the next DM lands.
          Every number above stays honest: it moves only when a real order does.
        </div>
      ) : (
        ORDER_STAGE_ORDER.map((stage) => {
          const list = byStage.get(stage) || [];
          if (!list.length) return null;
          const meta = orderStageMeta(stage);
          return (
            <div key={stage} className="mt-4">
              <div className={`mb-1 text-xs font-semibold uppercase tracking-wide ${GROUP_TEXT[meta.group]}`}>
                {meta.symbol} {meta.label} · {list.length}
              </div>
              <div className="space-y-2">
                {list.map((o) => <OrderCard key={o.id} order={o} />)}
              </div>
            </div>
          );
        })
      )),
    },
    { id: 'classes', label: 'Classes', icon: 'calendar', render: () => <ClassesSection /> },
    { id: 'materials', label: 'Materials', icon: 'tools', render: () => <MaterialsSection /> },
    { id: 'numbers', label: 'The numbers', icon: 'chart', render: () => <KpiSection orders={real} /> },
  ];

  return (
    <div className="mx-auto max-w-3xl px-3 pb-24">
      <div className="mt-3 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1815]" style={SERIF}>{MOORE_BRAND.label}</h1>
          <p className="text-xs text-[#5A5751]">{MOORE_BRAND.tagline} · {MOORE_BRAND.email}</p>
        </div>
        <button type="button" className="rounded-lg bg-[#B85838] px-3 py-1.5 text-sm font-semibold text-white" onClick={() => setAdding((v) => !v)}>
          {adding ? 'Close' : '+ New order'}
        </button>
      </div>
      {adding && <AddOrderForm onDone={() => setAdding(false)} />}

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <KpiTile label="Paid orders" value={stats.paidOrders} />
        <KpiTile label="Revenue" value={fmt$(stats.revenueCents || null)} />
        <KpiTile label="Avg order" value={fmt$(stats.avgOrderCents)} />
        <KpiTile label="Margin" value={stats.paidOrders ? fmt$(stats.marginCents) : '—'} />
      </div>

      <div className="mt-4">
        <SectionTabs sections={sections} ariaLabel="Moore Divahs sections" idBase="moore" defaultId="orders" />
      </div>
    </div>
  );
}
