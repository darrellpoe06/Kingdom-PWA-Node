// =============================================================================
// accounts-dedupe — collapse duplicate "Add as debt" stray accounts in a list
// =============================================================================
// The 2026-08-04 Debts bug left the same card added many times: the suggestion
// panel's dedupe missed an already-added card (lib/debt-payments.js, fixed) and
// the cloud round-trip erased the treatAsDebt declaration (0129, fixed), so
// each re-tap uploaded ANOTHER bare $0 credit account — 24 stray rows for 8
// real cards. Migration 0129 consolidated the cloud; this is the same rule at
// the accounts MERGE point (the dedupeEntitiesByName pattern), so a device
// whose localStorage still holds pre-cleanup strays renders ONE row per card
// instead of a duplicated Debts tab, without any destructive local pass.
//
// Scope is deliberately narrow — only rows in the stray CLASS are collapsible:
//   · hand-added slug ('a-<epoch millis>' — the addAccount id pattern; imported
//     and seeded accounts use word slugs and are never touched), AND
//   · credit/loan-or-declared type, AND
//   · zero balance (an account with a real owed balance is never dropped).
// Within each (entityId + cleaned name) group, every non-stray is kept; of the
// strays, ONE survives — preferring a row that carries the debt declaration
// (treatAsDebt), then one that reached the cloud (remoteUuid), then list order
// (fetchAll orders created_at ascending, so first = earliest, matching 0129's
// keeper choice). List order is preserved. Pure; pinned by accounts-dedupe.test.
// =============================================================================
import { payeeKey } from './categorize.js';

const STRAY_SLUG_RE = /^a-\d+$/;

const isStray = (a) => !!a
  && STRAY_SLUG_RE.test(String(a.id || ''))
  && (a.type === 'credit' || a.type === 'loan' || a.treatAsDebt === true)
  && Math.abs(Number(a.balance) || 0) < 0.005;

const keyOf = (a) => `${a.entityId ?? ''}|${payeeKey(a.name || '') || String(a.name || '').trim().toLowerCase()}`;

export function dedupeDebtAccountStrays(list) {
  const items = list || [];
  // Per (entity + cleaned name) group: note whether a REAL (non-stray) account
  // exists, and choose the surviving stray — preferring the declaration, then a
  // cloud-backed row, then earliest (list order = created order).
  const groups = new Map(); // key -> { real: bool, keeper: stray|null }
  const score = (x) => (x.treatAsDebt === true ? 2 : 0) + (x.remoteUuid ? 1 : 0);
  for (const a of items) {
    if (!a) continue;
    const key = keyOf(a);
    let g = groups.get(key);
    if (!g) { g = { real: false, keeper: null }; groups.set(key, g); }
    if (!isStray(a)) { g.real = true; continue; }
    if (!g.keeper || score(a) > score(g.keeper)) g.keeper = a;
  }
  return items.filter((a) => {
    if (!a) return false;
    if (!isStray(a)) return true;
    const g = groups.get(keyOf(a));
    // A stray next to a REAL same-name account is residue of the double-add
    // loop — the real account IS the debt; the $0 shell drops. Otherwise the
    // single chosen keeper survives and its duplicates drop.
    return !g.real && g.keeper === a;
  });
}
