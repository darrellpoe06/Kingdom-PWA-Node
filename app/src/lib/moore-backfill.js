// =============================================================================
// moore-backfill — her history in, her data out (task 19, Darrell 2026-07-07)
// =============================================================================
// IN: the 20-minute backfill. Shay scrolls her DMs once and pastes one line
// per past customer — "Name, contact, what they bought, when, $amount" (only
// name + item required). Each line becomes a real HISTORICAL order row
// (delivered stage — the 3-week clock never runs on done work). Dollars are
// recorded ONLY when she supplies them; we never invent revenue (DR-0076).
//
// OUT: one-tap CSV of customers and orders — her data is hers, exportable,
// no lock-in (DATA-AS-EMPOWERMENT).
// Pure module; the board wires it to addOrder and a download.
// =============================================================================
import { isSeedOrder } from './moore-divahs.js';

// "Name, @handle or email, what they bought[, when][, $amount]"
// Date accepts YYYY-MM, YYYY-MM-DD, or MM/YYYY. Amount accepts $120 / 120.
export function parseBackfillLines(text, { now = null } = {}) {
  const ts = now || new Date().toISOString();
  const rows = [];
  const problems = [];
  const lines = String(text || '').split('\n').map((l) => l.trim()).filter(Boolean);
  lines.forEach((line, i) => {
    const parts = line.split(',').map((p) => p.trim());
    if (parts.length < 2 || !parts[0]) {
      problems.push({ line: i + 1, text: line, why: 'Needs at least "Name, what they bought".' });
      return;
    }
    // Contact is optional: with 2 parts it's name + item; with 3+ the second
    // part is contact when it looks like one (@handle or an email).
    let name = parts[0], contact = '', rest = parts.slice(1);
    if (rest.length >= 2 && (/^@/.test(rest[0]) || rest[0].includes('@'))) {
      contact = rest[0];
      rest = rest.slice(1);
    }
    let createdAt = ts, quoteCents = 0, paidAt = null;
    const tail = [...rest];
    for (let k = tail.length - 1; k > 0 && k >= tail.length - 2; k--) {
      const t = tail[k];
      const money = /^\$?(\d+(?:\.\d{1,2})?)$/.exec(t);
      const ym = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(t) || null;
      const mdy = /^(\d{1,2})\/(\d{4})$/.exec(t) || null;
      if (money) { quoteCents = Math.round(parseFloat(money[1]) * 100); tail.splice(k, 1); continue; }
      if (ym) { createdAt = new Date(Date.UTC(+ym[1], +ym[2] - 1, ym[3] ? +ym[3] : 1)).toISOString(); tail.splice(k, 1); continue; }
      if (mdy) { createdAt = new Date(Date.UTC(+mdy[2], +mdy[1] - 1, 1)).toISOString(); tail.splice(k, 1); continue; }
    }
    const description = tail.join(', ').trim();
    if (!description) {
      problems.push({ line: i + 1, text: line, why: 'What did they buy? The item is required.' });
      return;
    }
    // A supplied amount is HER real number — record it as paid on the order's
    // date so revenue history is true. No amount = no invented dollars.
    if (quoteCents > 0) paidAt = createdAt;
    rows.push({
      customerName: name,
      contactValue: contact,
      description,
      stage: 'delivered',
      quoteCents,
      paidAt,
      createdAt,
      channel: 'other',
      notes: 'Backfilled history (pre-app order)',
      policyAccepted: true,
    });
  });
  return { rows, problems };
}

// ---- CSV out ----------------------------------------------------------------
function csvCell(v) {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
function csv(rows) {
  return rows.map((r) => r.map(csvCell).join(',')).join('\n') + '\n';
}

// One row per customer: name, contact, orders, first/last order, lifetime paid.
export function customersCsv(orders = []) {
  const real = (orders || []).filter((o) => o && !isSeedOrder(o));
  const by = new Map();
  for (const o of real) {
    const key = (o.customerName || '').trim().toLowerCase();
    if (!key) continue;
    const c = by.get(key) || { name: o.customerName, contact: o.contactValue || '', orders: 0, firstAt: o.createdAt, lastAt: o.createdAt, paidCents: 0 };
    c.orders += 1;
    if (o.contactValue && !c.contact) c.contact = o.contactValue;
    if (String(o.createdAt) < String(c.firstAt)) c.firstAt = o.createdAt;
    if (String(o.createdAt) > String(c.lastAt)) c.lastAt = o.createdAt;
    if (o.paidAt) c.paidCents += o.quoteCents || 0;
    by.set(key, c);
  }
  const rows = [['Customer', 'Contact', 'Orders', 'First order', 'Last order', 'Lifetime paid ($)']];
  for (const c of [...by.values()].sort((a, b) => b.paidCents - a.paidCents)) {
    rows.push([c.name, c.contact, c.orders, String(c.firstAt).slice(0, 10), String(c.lastAt).slice(0, 10), (c.paidCents / 100).toFixed(2)]);
  }
  return csv(rows);
}

export function ordersCsv(orders = []) {
  const real = (orders || []).filter((o) => o && !isSeedOrder(o));
  const rows = [['Date', 'Customer', 'Contact', 'Item', 'Stage', 'Quote ($)', 'Paid', 'Pay method', 'Delivery', 'Channel']];
  for (const o of [...real].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))) {
    rows.push([
      String(o.createdAt).slice(0, 10), o.customerName, o.contactValue || '', o.description || o.productType,
      o.stage, ((o.quoteCents || 0) / 100).toFixed(2), o.paidAt ? 'yes' : 'no', o.payMethod || '', o.delivery, o.channel,
    ]);
  }
  return csv(rows);
}
