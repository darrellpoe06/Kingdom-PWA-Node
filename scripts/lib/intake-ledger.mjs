// =============================================================================
// intake-ledger — the decision ledger for node-side intake work (DR-0622)
// =============================================================================
// The app reads the ledger at build time as __DR_LEDGER__ (app/vite.config.js
// readDecisionLedger). The runner-side census and the fix queue need the same
// "already decided" answers without booting vite, so this reads the same files
// into the same shape the categorizer uses: { id, title, status, decision }.
// The decision text comes from lib/decision-chain.js chainOf (the record's own
// "Decision" family of headings), the same mapper the in-app chain uses.
// =============================================================================
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { chainOf } from '../../app/src/lib/decision-chain.js';

function meta(raw) {
  const out = {};
  const m = /^---\n([\s\S]*?)\n---/.exec(raw);
  if (m) {
    for (const line of m[1].split('\n')) {
      const mm = /^([A-Za-z_-]+):\s*(.*)$/.exec(line);
      if (mm) out[mm[1]] = mm[2].trim();
    }
    return out;
  }
  const h1 = /^#\s+(DR-\d{4})\s*[—-]\s*(.+)$/m.exec(raw);
  if (h1) { out.id = h1[1]; out.title = h1[2].trim(); }
  for (const mm of raw.matchAll(/^-\s+\*\*([A-Za-z-]+):\*\*\s*(.+)$/gm)) {
    if (mm[1].toLowerCase() === 'status') out.status = mm[2].trim();
  }
  return out;
}

export function readLedger(dir) {
  const items = [];
  for (const f of readdirSync(dir)) {
    const fm = /^DR-(\d{4})-.+\.md$/.exec(f);
    if (!fm) continue;
    let raw = readFileSync(join(dir, f), 'utf8').replace(/\r\n/g, '\n');
    if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
    const m = meta(raw);
    const ch = chainOf(raw, { max: 1400, withText: true });
    items.push({
      id: m.id || `DR-${fm[1]}`,
      num: parseInt(fm[1], 10),
      title: m.title || '',
      status: String(m.status || '').toLowerCase(),
      decision: ch.decision ? ch.decision.text : '',
    });
  }
  items.sort((a, b) => b.num - a.num);
  return { ok: items.length > 0, count: items.length, items };
}
