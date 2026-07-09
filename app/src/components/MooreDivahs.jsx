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
import React, { useEffect, useMemo, useState } from 'react';
import {
  MOORE_BRAND, ORDER_STAGE_ORDER, orderStageMeta, nextOrderStage, orderClock,
  PRODUCT_TYPES, ORDER_CHANNELS, PAY_METHODS, CHANGE_BANDS, CHANGE_REASONS,
  changeOrderFee, orderStats, bulkPickList, bulkTotals, isSeedOrder, BULK_CUTS,
  CLASS_FORMATS, seatsLeft, canBook, oneOnOneSlotIssue,
  INVENTORY_CATEGORIES, inventoryValueCents, classStats, revenueGoalPlan,
} from '../lib/moore-divahs.js';
import { useMooreOrders, addOrder, advanceOrder, payOrder, recordChangeOrder, patchOrder } from '../lib/use-moore-orders.js';
import { useMooreClasses, addSession, addPaidSignup } from '../lib/use-moore-classes.js';
import { useMooreInventory, addInventoryItem, adjustInventoryQty } from '../lib/use-moore-inventory.js';
import AddressField, { osmLink } from './AddressField.jsx';
import SectionTabs from './SectionTabs.jsx';
import { fetchMessages, sendMessage, groupThreads } from '../lib/business-messages.js';
import { fetchShowcase, showcaseImageUrl, sortPieces, addPiece, setPin, removePiece, updatePiece, priceInputToCents } from '../lib/showcase.js';
import { parseBackfillLines, customersCsv, ordersCsv } from '../lib/moore-backfill.js';
import { QRCodeSVG } from 'qrcode.react';
import { MOORE_SHARE_URL, MOORE_SHARE_URL_DISPLAY } from '../lib/moore-door.js';

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
  const [slotErr, setSlotErr] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    if (!f.dateIso) return;
    // Her window, enforced at scheduling: one-on-ones land Mon-Fri, 9 AM-1 PM.
    const issue = f.format === 'one-on-one' ? oneOnOneSlotIssue(f.dateIso) : null;
    if (issue) { setSlotErr(issue); return; }
    setSlotErr('');
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
          {slotErr && <p className="col-span-2 text-xs text-[#B85838] sm:col-span-3">{slotErr}</p>}
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

// ---- Backfill + export — history in, her data out (task 19) ------------------
function download(filename, text) {
  try {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv' }));
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  } catch { /* jsdom / blocked download */ }
}

function BackfillSection({ orders }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const preview = useMemo(() => parseBackfillLines(text), [text]);
  const runImport = async () => {
    setImporting(true);
    let added = 0;
    for (const row of preview.rows) { await addOrder(row); added += 1; }
    setImporting(false);
    setResult({ added, problems: preview.problems.length });
    setText('');
  };
  return (
    <div className="mt-8">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#1A1815]" style={SERIF}>History &amp; exports</h2>
          <p className="text-xs text-[#5A5751]">Paste your past customers once — every line becomes a real record. And your data is always yours: one tap exports it.</p>
        </div>
        <span className="flex gap-2">
          <button type="button" className="rounded-lg border border-[#5A6E3D] px-2.5 py-1.5 text-xs font-semibold text-[#5A6E3D]" onClick={() => download('moore-divahs-customers.csv', customersCsv(orders))}>Export customers</button>
          <button type="button" className="rounded-lg border border-[#5A6E3D] px-2.5 py-1.5 text-xs font-semibold text-[#5A6E3D]" onClick={() => download('moore-divahs-orders.csv', ordersCsv(orders))}>Export orders</button>
          <button type="button" className="rounded-lg border border-[#B85838] px-2.5 py-1.5 text-xs font-semibold text-[#B85838]" onClick={() => setOpen((v) => !v)}>{open ? 'Close' : '+ Backfill history'}</button>
        </span>
      </div>
      {open && (
        <div className="mt-2 rounded-xl border border-[#E8E2D8] bg-[#FAF8F4] p-3">
          <p className="text-xs text-[#5A5751]">
            One line per past order: <strong>Name, contact, what they bought, when, $amount</strong> — only name + item required.
            Example: <em>Dana, @dana_sews, two teal scrub caps, 2026-03, $60</em>. Amounts you give are recorded as paid history; nothing is invented.
          </p>
          <textarea aria-label="Backfill lines" rows={5} className="mt-2 w-full rounded border border-[#E8E2D8] bg-white p-2 text-sm" value={text} onChange={(e) => setText(e.target.value)} />
          <div className="mt-1 flex items-center gap-3 text-xs">
            <span className="text-[#5A6E3D]">{preview.rows.length} ready</span>
            {preview.problems.length > 0 && <span className="text-[#B85838]">{preview.problems.length} lines need a fix: {preview.problems[0].why}</span>}
            <button type="button" disabled={!preview.rows.length || importing} className="rounded-lg bg-[#B85838] px-3 py-1 font-semibold text-white disabled:opacity-50" onClick={runImport}>
              {importing ? 'Importing…' : `Import ${preview.rows.length}`}
            </button>
          </div>
          {result && <p className="mt-1 text-xs text-[#5A6E3D]">✓ {result.added} historical orders added{result.problems ? ` · ${result.problems} lines skipped` : ''}. They feed your customer list, repeat rate, and exports.</p>}
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

// ---- Messages — Shay's inbox: every customer thread, one board (0091) -------
function MessagesSection() {
  const [state, setState] = useState({ phase: 'loading', rows: [] });
  const [openThread, setOpenThread] = useState(null);
  const [draft, setDraft] = useState('');
  const load = () => fetchMessages('moore-divahs').then((r) => setState({ phase: r.ok ? 'ready' : 'signed-out', rows: r.rows }));
  useEffect(() => { load(); }, []);
  const threads = useMemo(() => groupThreads(state.rows), [state.rows]);
  const current = threads.find((t) => t.customerUserId === openThread) || null;
  const reply = async (e) => {
    e.preventDefault();
    if (!draft.trim() || !current) return;
    const r = await sendMessage('moore-divahs', draft, current.customerUserId);
    if (r.ok) { setDraft(''); load(); }
  };
  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold text-[#1A1815]" style={SERIF}>Messages</h2>
      <p className="text-xs text-[#5A5751]">Every customer conversation, one board — no more digging through five inboxes.</p>
      {state.phase === 'loading' ? null : threads.length === 0 ? (
        <div className="mt-2 rounded-xl border border-dashed border-[#E8E2D8] p-4 text-center text-sm text-[#5A5751]">
          No customer messages yet — when someone writes from your app, the thread lands here.
        </div>
      ) : (
        <div className="mt-2 space-y-1.5">
          {threads.map((t) => (
            <div key={t.customerUserId} className="rounded-xl border border-[#E8E2D8] bg-white p-2">
              <button type="button" className="flex w-full items-center justify-between text-left text-sm" onClick={() => setOpenThread(openThread === t.customerUserId ? null : t.customerUserId)}>
                <span className="text-[#1A1815]">
                  <strong>Customer {String(t.customerUserId).slice(0, 8)}</strong>
                  <span className="text-[#5A5751]"> · {t.messages.length} messages · {t.last ? new Date(t.lastAt).toLocaleString() : ''}</span>
                </span>
                {t.unansweredFromCustomer && <span className="rounded-full border border-[#B85838] px-2 py-0.5 text-xs text-[#B85838]">needs reply</span>}
              </button>
              {openThread === t.customerUserId && (
                <div className="mt-2">
                  <div className="max-h-56 space-y-1.5 overflow-y-auto rounded-lg border border-[#E8E2D8] bg-[#FAF8F4] p-2">
                    {t.messages.map((m, i) => (
                      <div key={i} className={`max-w-[85%] rounded-lg px-2 py-1 text-sm ${m.sender === 'steward' ? 'ml-auto border border-[#5A6E3D]' : 'border border-[#E8E2D8]'} text-[#1A1815]`}>
                        <span className="block text-xs text-[#5A5751]">{m.sender === 'steward' ? 'You' : 'Customer'} · {new Date(m.created_at).toLocaleString()}</span>
                        {m.body}
                      </div>
                    ))}
                  </div>
                  <form onSubmit={reply} className="mt-2 flex gap-2">
                    <input aria-label="Reply to customer" placeholder="Reply…" className="flex-1 rounded border border-[#E8E2D8] bg-white px-2 py-1.5 text-sm" value={draft} onChange={(e) => setDraft(e.target.value)} />
                    <button type="submit" className="rounded-lg bg-[#B85838] px-3 py-1.5 text-sm font-semibold text-white">Send</button>
                  </form>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---- Share your app — the QR Shay shows from her phone or sends -------------
// Customers scan (or tap the sent link) → the her-name entry page → her door,
// installable under HER name (manifest-moore). When they sign in, their orders
// and class seats follow them onto their phone (the 0087 read-own lane) — the
// "keep their history" half of the ask (Darrell 2026-07-07).
function ShareAppSection() {
  const [copied, setCopied] = useState(false);
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(MOORE_SHARE_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard blocked — the visible URL is still typeable */ }
  };
  const send = () => {
    navigator.share({ title: 'Moore Divahs', text: 'Get the Moore Divahs app — custom clothing, scrub caps, custom shoes, sewing classes.', url: MOORE_SHARE_URL }).catch(() => { /* user closed the share sheet */ });
  };
  return (
    <div className="mt-6">
      <h2 className="text-xl font-bold text-[#1A1815]" style={SERIF}>Share your app</h2>
      <p className="text-sm text-[#5A5751]">
        Hold this up or send the link — a customer scans it and gets YOUR app.
        When they sign in, their orders and class seats stay with them on their phone.
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-4 rounded-xl border border-[#E8E2D8] bg-white p-4">
        <div className="rounded-lg bg-white p-2">
          <QRCodeSVG value={MOORE_SHARE_URL} size={148} marginSize={2} title="QR code for the Moore Divahs app" />
        </div>
        <div className="min-w-[10rem] flex-1 space-y-2 text-sm">
          <div className="font-semibold text-[#1A1815]" style={SERIF}>{MOORE_SHARE_URL_DISPLAY}</div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={copy} className="rounded-lg border border-[#B85838] px-3 py-1.5 font-semibold text-[#B85838]" aria-live="polite">
              {copied ? '✓ Copied' : 'Copy link'}
            </button>
            {canShare && (
              <button type="button" onClick={send} className="rounded-lg border border-[#5A5751] px-3 py-1.5 text-[#5A5751]">
                Send…
              </button>
            )}
          </div>
          <p className="text-xs text-[#5A5751]">Scanning opens Moore Divahs; &ldquo;Add to home screen&rdquo; installs it under your name.</p>
        </div>
      </div>
    </div>
  );
}

// ---- Gallery manager — she uploads her historical pieces when ready (0092) --
// Edit-in-place for an existing piece (Shay 2026-07-08: pricing had no spot
// and old pieces needed delete-and-re-add — this is the fix). Prefills the
// current values so saving without touching a field never loses anything.
function PieceEditor({ piece, onDone }) {
  const [e, setE] = useState({
    title: piece.title || '',
    description: piece.description || '',
    price: piece.price_cents != null ? (piece.price_cents / 100).toFixed(2).replace(/\.00$/, '') : '',
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const save = async () => {
    setBusy(true); setErr('');
    const r = await updatePiece({
      instanceSlug: 'moore-divahs', slug: piece.slug, title: e.title,
      description: e.description, priceCents: priceInputToCents(e.price),
    });
    setBusy(false);
    if (!r.ok) { setErr('Could not save — try again in a moment.'); return; }
    onDone();
  };
  return (
    <div className="mt-1 space-y-1">
      <input aria-label="Edit piece title" className="w-full rounded border border-[#E8E2D8] bg-white px-2 py-1" value={e.title} onChange={(ev) => setE({ ...e, title: ev.target.value })} />
      <input aria-label="Edit piece description" placeholder="A line about it" className="w-full rounded border border-[#E8E2D8] bg-white px-2 py-1" value={e.description} onChange={(ev) => setE({ ...e, description: ev.target.value })} />
      <input aria-label="Edit piece price dollars" placeholder="Price $ (blank = no price shown)" inputMode="decimal" className="w-full rounded border border-[#E8E2D8] bg-white px-2 py-1" value={e.price} onChange={(ev) => setE({ ...e, price: ev.target.value })} />
      <div className="flex gap-1.5">
        <button type="button" disabled={busy} className="rounded bg-[#5A6E3D] px-2 py-1 font-semibold text-white" onClick={save}>{busy ? 'Saving…' : 'Save'}</button>
        <button type="button" className="rounded border border-[#E8E2D8] px-2 py-1 text-[#5A5751]" onClick={onDone}>Cancel</button>
      </div>
      {err && <p className="text-[#B85838]">{err}</p>}
    </div>
  );
}

function GalleryManager() {
  const [pieces, setPieces] = useState([]);
  const [f, setF] = useState({ title: '', description: '', productType: 'custom-clothing', file: null, price: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [editing, setEditing] = useState(null); // slug being edited
  const load = () => fetchShowcase('moore-divahs').then((r) => setPieces(sortPieces(r.pieces)));
  useEffect(() => { load(); }, []);
  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    const r = await addPiece({ instanceSlug: 'moore-divahs', title: f.title, description: f.description, productType: f.productType, file: f.file, priceCents: priceInputToCents(f.price) });
    setBusy(false);
    if (!r.ok) { setErr(r.error === 'title-and-image-required' ? 'A title and an image are both needed.' : `Upload failed: ${r.error}`); return; }
    setF({ title: '', description: '', productType: 'custom-clothing', file: null, price: '' });
    load();
  };
  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold text-[#1A1815]" style={SERIF}>Gallery</h2>
      <p className="text-xs text-[#5A5751]">Your showcased pieces greet every customer who opens your app. Pin favorites to the top; each piece carries an &ldquo;order inspired by this&rdquo; button. Add a price and it shows on the piece — edit any piece anytime, no re-upload.</p>
      <form onSubmit={submit} className="mt-2 grid grid-cols-2 gap-2 rounded-xl border border-[#E8E2D8] bg-[#FAF8F4] p-3 text-sm sm:grid-cols-4">
        <input aria-label="Piece title" required placeholder="Piece title" className="rounded border border-[#E8E2D8] bg-white px-2 py-1" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
        <select aria-label="Piece type" className="rounded border border-[#E8E2D8] bg-white px-2 py-1" value={f.productType} onChange={(e) => setF({ ...f, productType: e.target.value })}>
          {PRODUCT_TYPES.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
        </select>
        <input aria-label="Piece image" type="file" accept="image/*" className="text-xs" onChange={(e) => setF({ ...f, file: e.target.files?.[0] || null })} />
        <input aria-label="Piece price dollars" placeholder="Price $ (optional)" inputMode="decimal" className="rounded border border-[#E8E2D8] bg-white px-2 py-1" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} />
        <input aria-label="Piece description" placeholder="A line about it (optional)" className="col-span-2 rounded border border-[#E8E2D8] bg-white px-2 py-1 sm:col-span-4" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
        <button type="submit" disabled={busy} className="col-span-2 rounded-lg bg-[#B85838] px-3 py-1.5 font-semibold text-white sm:col-span-4">{busy ? 'Uploading…' : '+ Add to gallery'}</button>
        {err && <p className="col-span-2 text-xs text-[#B85838] sm:col-span-4">{err}</p>}
      </form>
      {pieces.length > 0 && (
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {pieces.map((p) => (
            <div key={p.slug} className="rounded-xl border border-[#E8E2D8] bg-white p-2 text-xs">
              {showcaseImageUrl(p.image_path) && <img src={showcaseImageUrl(p.image_path)} alt={p.title} loading="lazy" className="aspect-square w-full rounded-lg object-cover" />}
              {editing === p.slug ? (
                <PieceEditor piece={p} onDone={() => { setEditing(null); load(); }} />
              ) : (
                <>
                  <div className="mt-1 font-semibold text-[#1A1815]">{p.title}{p.pinned ? ' ✦' : ''}</div>
                  {p.price_cents != null && <div className="text-[#5A6E3D]">${(p.price_cents / 100).toFixed(2).replace(/\.00$/, '')}</div>}
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    <button type="button" className="rounded border border-[#2A5A8E] px-1.5 py-0.5 text-[#2A5A8E]" onClick={() => setEditing(p.slug)}>Edit</button>
                    <button type="button" className="rounded border border-[#5A6E3D] px-1.5 py-0.5 text-[#5A6E3D]" onClick={() => setPin('moore-divahs', p.slug, !p.pinned).then(load)}>{p.pinned ? 'Unpin' : 'Pin ✦'}</button>
                    <button type="button" className="rounded border border-[#5A5751] px-1.5 py-0.5 text-[#5A5751]" onClick={() => { if (confirm(`Remove "${p.title}" from the gallery?`)) removePiece('moore-divahs', p.slug).then(load); }}>Remove</button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
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
    { id: 'messages', label: 'Messages', icon: 'chat', render: () => <MessagesSection /> },
    { id: 'share', label: 'Share the app', icon: 'link', render: () => <ShareAppSection /> },
    { id: 'gallery', label: 'Gallery', icon: 'palette', render: () => <GalleryManager /> },
    { id: 'materials', label: 'Materials', icon: 'tools', render: () => <MaterialsSection /> },
    { id: 'backfill', label: 'History & export', icon: 'pencil', render: () => <BackfillSection orders={real} /> },
    { id: 'numbers', label: 'The numbers', icon: 'chart', render: () => <KpiSection orders={real} /> },
  ];

  return (
    <div className="mx-auto max-w-3xl px-3 pb-24">
      <div className="mt-3 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1815]" style={SERIF}>{MOORE_BRAND.label}</h1>
          <p className="text-xs text-[#5A5751]">{MOORE_BRAND.tagline}</p>
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
