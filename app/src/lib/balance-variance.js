// =============================================================================
// balance-variance — never a big swing without a data-driven reason (DR pending)
// =============================================================================
// Darrell (2026-07-18): "Always have a data driven reason for more or less than
// $500 in the over each account and then over all so we notice major changes
// easily." A material move in an account's balance — or across all accounts — must
// never be a bare number the family has to go dig into. This decomposes a period's
// net change PER ACCOUNT (and overall) into its biggest DRIVERS (grouped by payee),
// so any swing past the materiality threshold arrives already explained: "Chase is
// down $1,240 this month — driven by RENT -$800, BLUE CROSS -$412."
//
// The threshold is $500 by default (Darrell's number) and configurable. Per
// account, every real balance move counts (a transfer genuinely changes ONE
// account's balance). Overall, internal transfers are excluded — money moving
// between our own accounts is neither money in nor out (the same convention as
// lib/imported-view.js totals()), so the overall figure reflects true external
// flow. Pure + deterministic; the caller scopes it to its own RLS'd ledger.
// =============================================================================

import { payeeKey } from './categorize.js';

const MATERIAL_DEFAULT = 500;

function dateMs(t) {
  const s = t && (t.date ?? t.posted);
  if (!s) return null;
  const str = String(s);
  const ms = Date.parse(str.length === 10 ? str + 'T00:00:00' : str);
  return Number.isNaN(ms) ? null : ms;
}

function isTransfer(t) {
  return t && (t.isTransfer === true || t.category === 'transfer');
}

// Group a set of txns by payee into signed drivers, biggest |amount| first, so
// the top N explain most of the net. A blank payee collects under its raw
// description (or '—'). Returns [{ label, amount, count }].
function driversByPayee(txns) {
  const map = new Map();
  for (const t of txns) {
    const raw = String(t.description || t.desc || '').trim();
    const key = payeeKey(raw) || raw.toLowerCase() || '—';
    const label = raw || '—';
    const amt = Number(t.amount) || 0;
    const cur = map.get(key) || { label, amount: 0, count: 0 };
    cur.amount += amt;
    cur.count += 1;
    // Keep the most representative label (first non-empty wins, stable).
    if (!cur.label || cur.label === '—') cur.label = label;
    map.set(key, cur);
  }
  return [...map.values()]
    .map((d) => ({ ...d, amount: Math.round(d.amount * 100) / 100 }))
    .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount) || b.count - a.count);
}

// accountVariance(transactions, accountId, sinceMs, untilMs, opts) -> {
//   accountId, in, out, net, count, material (|net| >= threshold), drivers }.
// `sinceMs`/`untilMs` are an inclusive window; null bounds are open. Drivers are
// the top `maxDrivers` payee groups explaining the net (signed). Pure.
export function accountVariance(transactions, accountId, sinceMs, untilMs, opts = {}) {
  const threshold = opts.threshold ?? MATERIAL_DEFAULT;
  const maxDrivers = opts.maxDrivers ?? 3;
  const rows = (transactions || []).filter((t) => {
    if (!t || t.accountId !== accountId) return false;
    const ms = dateMs(t);
    if (sinceMs != null && (ms == null || ms < sinceMs)) return false;
    if (untilMs != null && (ms == null || ms > untilMs)) return false;
    return true;
  });
  let inflow = 0, outflow = 0;
  for (const t of rows) {
    const amt = Number(t.amount) || 0;
    if (amt < 0) outflow += Math.abs(amt); else inflow += amt;
  }
  const net = Math.round((inflow - outflow) * 100) / 100;
  const allDrivers = driversByPayee(rows);
  return {
    accountId,
    in: Math.round(inflow * 100) / 100,
    out: Math.round(outflow * 100) / 100,
    net,
    count: rows.length,
    material: Math.abs(net) >= threshold,
    drivers: allDrivers.slice(0, maxDrivers),
  };
}

// varianceReport(transactions, accounts, opts) -> { threshold, accounts:
// [{...accountVariance, name}], overall: { in, out, net, count, material,
// drivers }, materialCount }. `accounts` may be [{id,name}]; window + threshold in
// opts (sinceMs, untilMs, threshold, maxDrivers). Overall EXCLUDES internal
// transfers (true external flow). Accounts are sorted biggest-|net|-first so the
// movers surface at the top. Pure + deterministic.
export function varianceReport(transactions, accounts = [], opts = {}) {
  const threshold = opts.threshold ?? MATERIAL_DEFAULT;
  const { sinceMs = null, untilMs = null, maxDrivers = 3 } = opts;
  const perAccount = (accounts || []).map((a) => {
    const v = accountVariance(transactions, a.id, sinceMs, untilMs, { threshold, maxDrivers });
    return { ...v, name: a.name || a.id };
  }).sort((x, y) => Math.abs(y.net) - Math.abs(x.net));

  // Overall: external flow only (drop internal transfers), across ALL accounts.
  const external = (transactions || []).filter((t) => {
    if (!t || isTransfer(t)) return false;
    const ms = dateMs(t);
    if (sinceMs != null && (ms == null || ms < sinceMs)) return false;
    if (untilMs != null && (ms == null || ms > untilMs)) return false;
    return true;
  });
  let oin = 0, oout = 0;
  for (const t of external) {
    const amt = Number(t.amount) || 0;
    if (amt < 0) oout += Math.abs(amt); else oin += amt;
  }
  const onet = Math.round((oin - oout) * 100) / 100;
  const overall = {
    in: Math.round(oin * 100) / 100,
    out: Math.round(oout * 100) / 100,
    net: onet,
    count: external.length,
    material: Math.abs(onet) >= threshold,
    drivers: driversByPayee(external).slice(0, maxDrivers),
  };

  return {
    threshold,
    accounts: perAccount,
    overall,
    materialCount: perAccount.filter((a) => a.material).length + (overall.material ? 1 : 0),
  };
}
