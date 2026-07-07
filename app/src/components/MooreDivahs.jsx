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
  changeOrderFee, orderStats, bulkPickList, isSeedOrder,
} from '../lib/moore-divahs.js';
import { useMooreOrders, addOrder, advanceOrder, payOrder, recordChangeOrder, patchOrder } from '../lib/use-moore-orders.js';

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

function AddOrderForm({ onDone }) {
  const [f, setF] = useState(BLANK);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    if (!f.customerName.trim()) return;
    await addOrder({ ...f, quoteCents: Math.round((parseFloat(f.quote) || 0) * 100) });
    setF(BLANK);
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
      <button type="submit" className="col-span-2 rounded-lg bg-[#B85838] px-3 py-1.5 font-semibold text-white sm:col-span-3">
        Add order
      </button>
    </form>
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

      {real.length === 0 ? (
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
      )}
    </div>
  );
}
