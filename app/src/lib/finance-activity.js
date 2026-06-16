// =============================================================================
// finance-activity — the budget picture, driven by financial documents arriving
// =============================================================================
// Darrell 2026-06-16: "It should be based on WHEN something that is a financial
// document — anything that comes into the system from her emails — by sourcing her
// emails for the financial emails from chase etc."
//
// wf14b sources Christina's inbox for finance senders (chase/bofa/...) every 10 min
// and writes them to /data/finance-events; wf18 serves them to the app as
// `ingestData.gmail_events` (+ bank `transactions`). This pure helper turns that
// REAL incoming stream into a budget picture: the latest document and its source,
// and the in/out totals over a recent window. Nothing here is painted — an empty
// stream yields a null lastDocAt (the honest "nothing has arrived yet").
//
// Grounds: DR-0061 (a surface is a live view of real flow), DR-0076 (measure the
// real artifact, don't claim). Pure + deterministic so it's testable and the
// local-LLM orchestrator can run it headless.
// =============================================================================

export function toMs(v) {
  if (v == null || v === '') return null;
  const t = Date.parse(v);
  return Number.isNaN(t) ? null : t;
}

// Friendly institution name from a sender address. Falls back to the bare domain
// so an unknown sender is shown honestly, never dropped.
const SENDER_MAP = [
  [/chase\.com/i, 'Chase'],
  [/(bofa|bankofamerica)\.com/i, 'Bank of America'],
  [/wellsfargo\.com/i, 'Wells Fargo'],
  [/capitalone\.com/i, 'Capital One'],
  [/usaa\.com/i, 'USAA'],
  [/citi(bank)?\.com/i, 'Citi'],
  [/discover\.com/i, 'Discover'],
  [/(amex|americanexpress)\.com/i, 'American Express'],
  [/paypal\.com/i, 'PayPal'],
  [/venmo\.com/i, 'Venmo'],
  [/cashapp\.com/i, 'Cash App'],
  [/intuit|quickbooks|quicken/i, 'Intuit'],
];

export function institutionFromSender(from) {
  const s = String(from || '');
  for (const [re, name] of SENDER_MAP) { if (re.test(s)) return name; }
  const m = s.match(/@([a-z0-9.-]+)/i);
  return m ? m[1].replace(/\.(com|net|org)$/i, '') : (s || 'Unknown');
}

// Normalize a gmail event or a bank transaction into one comparable shape.
function normalize(ingestData) {
  const out = [];
  for (const e of (ingestData?.gmail_events || [])) {
    const at = toMs(e?.internal_date) ?? toMs(e?.captured_at);
    out.push({ at, amount: typeof e?.amount === 'number' ? e.amount : null, direction: e?.direction || null, source: institutionFromSender(e?.from), label: e?.subject || '', kind: 'email' });
  }
  for (const t of (ingestData?.transactions || [])) {
    const at = toMs(t?.date) ?? toMs(t?.posted_at) ?? toMs(t?.internal_date);
    const amount = typeof t?.amount === 'number' ? t.amount : null;
    out.push({ at, amount, direction: t?.direction || (amount != null ? (amount < 0 ? 'out' : 'in') : null), source: t?.institution || institutionFromSender(t?.from), label: t?.description || t?.subject || '', kind: 'bank' });
  }
  return out.filter((x) => x.at != null);
}

// The budget picture from what has actually arrived. `windowDays` bounds the
// in/out totals to a recent period so the picture reflects current flow.
export function summarizeFinancialActivity(ingestData, nowMs, windowDays = 30) {
  const events = normalize(ingestData).sort((a, b) => b.at - a.at);
  if (events.length === 0) {
    return { lastDocAt: null, lastDocAgoDays: null, lastSource: null, count: 0, recentIn: 0, recentOut: 0, windowDays };
  }
  const latest = events[0];
  const cutoff = nowMs - windowDays * 86400000;
  let recentIn = 0, recentOut = 0;
  for (const e of events) {
    if (e.at < cutoff || e.amount == null) continue;
    const mag = Math.abs(e.amount);
    if (e.direction === 'out') recentOut += mag;
    else if (e.direction === 'in') recentIn += mag;
    else if (e.amount < 0) recentOut += mag; else recentIn += mag;
  }
  return {
    lastDocAt: new Date(latest.at).toISOString(),
    lastDocAgoDays: Math.max(0, Math.floor((nowMs - latest.at) / 86400000)),
    lastSource: latest.source,
    count: events.length,
    recentIn: Math.round(recentIn),
    recentOut: Math.round(recentOut),
    windowDays,
  };
}

// Just the timestamp of the most recent financial document (ms), or null. Used to
// drive the financial loop's freshness: the loop is "updating" WHEN a real
// financial document arrives, not on a manual stamp.
export function latestFinancialDocMs(ingestData) {
  const events = normalize(ingestData);
  return events.length ? Math.max(...events.map((e) => e.at)) : null;
}
