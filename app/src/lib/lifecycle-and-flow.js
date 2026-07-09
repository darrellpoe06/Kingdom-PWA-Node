// =============================================================================
// lifecycle-and-flow — pure item-lifecycle, auto-link, pressure + debt math
// =============================================================================
// Extracted verbatim from the monolith (poe-financial-mvp-v28.jsx) as part of
// the hybrid-modular reduction (DR-0078). Pure functions only - no React, no
// storage. The monolith re-exports these so existing importers are untouched.
import { monthLabel } from './format.js';

// =============================================================================
// Lifecycle & Handoff helpers — per /docs/00-foundations/_root/LIFECYCLE-AND-HANDOFF.md
// Every status change on a trackable entity (incident / project / inquiry /
// feedback / capex / inbound) writes a lifecycle log entry. Net effect: when a
// new handler picks up an item, they see what was done, by whom, when, and why.
// No verbal handoff required — the system IS the handoff.
//
// Data shape attached to each entity:
//   item.lifecycle = {
//     phase: 'in-progress',          // current state (mirrors item.status)
//     openedAt: '2026-05-18T...',    // when this item was first created
//     closedAt: null | '2026-...',   // set when item reaches a terminal phase
//     log: [
//       { at, fromPhase, toPhase, by, note },
//       ...
//     ]
//   }
// =============================================================================
export const LIFECYCLE_TERMINAL_PHASES = new Set([
  'resolved', 'closed', 'complete', 'completed', 'shipped',
  'declined', 'wont-fix', 'archived', 'converted', 'handled', 'discarded'
]);

// Pure function. Returns a NEW item with the lifecycle log appended, phase
// updated, and openedAt/closedAt timestamps set. Safe to call repeatedly — if
// the phase didn't actually change AND a log entry already exists, it's a no-op
// so the log doesn't get polluted by save buttons that don't change status.
export function appendLifecycleLog(item, toPhase, by = 'user', note = '') {
  const at = new Date().toISOString();
  const fromPhase = item.status || (item.lifecycle && item.lifecycle.phase) || null;
  const existingLog = (item.lifecycle && Array.isArray(item.lifecycle.log)) ? item.lifecycle.log : [];
  if (fromPhase === toPhase && existingLog.length > 0) return item;
  const openedAt = (item.lifecycle && item.lifecycle.openedAt) || item.createdAt || item.receivedAt || at;
  const isTerminal = LIFECYCLE_TERMINAL_PHASES.has(toPhase);
  return {
    ...item,
    status: toPhase,
    lifecycle: {
      phase: toPhase,
      openedAt,
      closedAt: isTerminal ? at : null,
      log: [...existingLog, { at, fromPhase, toPhase, by, note }],
    },
  };
}

// For records that pre-date the lifecycle pattern: synthesize a one-entry log
// from current status. Idempotent — returns the item unchanged if a lifecycle
// already exists. Used inline at display time so we never bulk-rewrite stored
// data on load (which would be risky).
export function ensureLifecycle(item, by = 'system') {
  if (item && item.lifecycle && Array.isArray(item.lifecycle.log)) return item;
  if (!item) return item;
  const phase = item.status || 'new';
  const at = item.createdAt || item.receivedAt || new Date().toISOString();
  const isTerminal = LIFECYCLE_TERMINAL_PHASES.has(phase);
  return {
    ...item,
    status: phase,
    lifecycle: {
      phase,
      openedAt: at,
      closedAt: isTerminal ? (item.resolvedAt || item.closedAt || at) : null,
      log: [{ at, fromPhase: null, toPhase: phase, by, note: 'created' }],
    },
  };
}
export function frequencyToMonthly(amount, frequency) { switch (frequency) { case 'monthly': return amount; case 'quarterly': return amount / 3; case 'semi-annual': return amount / 6; case 'annual': return amount / 12; case 'biennial': return amount / 24; default: return 0; } }

// =============================================================================
// CONNECTED-CONTEXT helpers (r36) — per /docs/00-foundations/_root/CONNECTED-CONTEXT.md
// Every entity carries links: [] — bidirectional connections to other entities.
// Append-only by design; manual links and auto-matched links share the shape.
// =============================================================================
export function makeLink({ toEntityType, toEntityId, kind = 'related', source = 'auto', by = 'system', note = '' }) {
  return {
    id: `l-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    toEntityType, toEntityId, kind, source, by, note,
    at: new Date().toISOString(),
  };
}
// Preparatory scaffolding for CONNECTED-CONTEXT tasks #88-#90 — exported so
// the pending UI work can import directly rather than duplicate. Not yet
// consumed in the monolith; ESLint sees the export as the use.
export function ensureLinks(item) {
  if (!item) return item;
  if (Array.isArray(item.links)) return item;
  return { ...item, links: [] };
}
// Pure auto-link matcher per CONNECTED-CONTEXT Pattern 2. Returns top-N matches
// of a given entity type for a new item. Matching strategy varies per type.
// Preparatory scaffolding for CONNECTED-CONTEXT tasks #88-#90 — exported.
export function findRelatedAuto(newItem, entityType, allData, maxResults = 10) {
  if (!newItem) return [];
  const matches = [];
  // Property-scoped: incidents mentioning the same property id. Reads the
  // canonical `linkedTo: { type, id }` shape used by every addIncident call
  // site (BigPicture Action Queue, Rentals tenant-late, Inbound convert).
  if (entityType === 'incident' && newItem.linkedTo?.type === 'rental' && newItem.linkedTo?.id) {
    (allData.incidents || []).forEach(i => {
      if (i.id !== newItem.id && i.linkedTo?.type === 'rental' && i.linkedTo?.id === newItem.linkedTo.id) {
        matches.push({ toEntityType: 'incident', toEntityId: i.id, kind: 'same-property' });
      }
    });
  }
  // Same-caller voicemails
  if (entityType === 'inbound' && newItem.caller) {
    (allData.inbound || []).forEach(c => {
      if (c.id !== newItem.id && c.caller === newItem.caller) {
        matches.push({ toEntityType: 'inbound', toEntityId: c.id, kind: 'same-caller' });
      }
    });
  }
  // Same-source inquiries
  if (entityType === 'inquiry' && newItem.source) {
    (allData.inquiries || []).forEach(i => {
      if (i.id !== newItem.id && i.source === newItem.source) {
        matches.push({ toEntityType: 'inquiry', toEntityId: i.id, kind: 'same-source' });
      }
    });
  }
  // Same-view feedback
  if (entityType === 'feedback' && newItem.currentView) {
    (allData.feedback || []).forEach(f => {
      if (f.id !== newItem.id && f.currentView === newItem.currentView) {
        matches.push({ toEntityType: 'feedback', toEntityId: f.id, kind: 'same-view' });
      }
    });
  }
  // Sort newest-first (heuristic: longer IDs include later timestamps from Date.now())
  return matches.slice(0, maxResults).map(m => makeLink({ ...m, source: 'auto', by: 'system' }));
}

// =============================================================================
// ECOSYSTEM-PARTICIPANTS (r36) — externalProfile shape attached to
// contractors and rentals. No portal UI yet (Phase 3a); data shape lays the
// foundation so existing records get the field for free.
// =============================================================================
// Preparatory scaffolding for ECOSYSTEM-PARTICIPANTS tasks #115-#118 — exported.
export function ensureExternalProfile(item, type) {
  if (!item) return item;
  if (item.externalProfile && typeof item.externalProfile === 'object') return item;
  const defaultPerms = {
    contractor: ['view-assigned-projects', 'view-own-payments-ytd', 'submit-status-update', 'message-project-owner'],
    tenant:     ['view-own-lease', 'view-own-rent-history', 'submit-maintenance-request', 'message-landlord'],
  };
  return {
    ...item,
    externalProfile: {
      name: item.name || (item.tenantName || ''),
      email: item.email || (item.tenantEmail || ''),
      phone: item.phone || (item.tenantPhone || ''),
      permissions: defaultPerms[type] || [],
      inviteStatus: 'not-invited',
      invitedAt: null,
      invitedBy: null,
      acceptedAt: null,
      lastSeenAt: null,
      notes: '',
    },
  };
}
export function eventDateTime(event) {
  const time = event.time || (event.allDay ? '09:00' : '12:00');
  return new Date(`${event.date}T${time}`);
}

// Pressure -> real monthly money toward debt. Pure + exported so it is testable
// and the local-LLM orchestrator can run it headless. EVERY input is real:
// netCashFlow + rentGap are derived from the user's data; the discretionary lever
// is a % of the user's REAL flexible spend (outflows.household), never a flat
// assumed $2000; the tithe (charitableGiving) is never part of the cut base; and
// reserves are deducted before anything is called "available."
export function computePressure(map, totals, outflows = {}, reservesMonthly = 0) {
  const rentCapture = (map.rentGapClosure / 100) * (totals.rentGap || 0);
  const discretionaryBase = outflows.household || 0;
  const discretionaryGain = (map.discretionaryCut / 100) * discretionaryBase;
  const grossAvailable = (totals.netCashFlow || 0) + rentCapture + discretionaryGain;
  return {
    ...map, discretionaryBase, rentCapture, discretionaryGain, grossAvailable,
    reservesDeducted: reservesMonthly,
    extraAvailable: Math.max(0, grossAvailable - reservesMonthly),
  };
}

// 2026-07-05 financial-math audit fix: the extra pool is NO LONGER reduced by
// minimum payments. The caller's `extraAvailable` (computePressure) starts from
// netCashFlow, whose outflows already include debtService — the budget that
// funds the minimums — so netting minimums out of the pool again double-counted
// them and pushed the headline debt-free date out past the Debt Snowball tab's
// for the SAME debts. Semantics now match projectDebtSnowball (avalanche order):
// minimums always paid (funded by debtService), the full extra pool attacks the
// highest-rate debt, and a cleared debt's freed minimum cascades into the pool.
export function projectDebt(debts, monthlyExtraAvailable, currentDate, maxMonths = 240) {
  let activeDebts = debts.filter((d) => !d.leaveAlone).map((d) => ({ ...d, currentBalance: d.balance, clearedAtMonth: null }));
  const projection = []; let totalInterestPaid = 0; let freedMinimums = 0;
  for (let m = 1; m <= maxMonths; m++) {
    activeDebts.forEach((d) => { if (d.currentBalance > 0 && d.rate > 0) { const interest = d.currentBalance * (d.rate / 100 / 12); d.currentBalance += interest; totalInterestPaid += interest; } });
    activeDebts.forEach((d) => { if (d.currentBalance > 0) { const pay = Math.min(d.minPayment, d.currentBalance); d.currentBalance -= pay; if (d.currentBalance <= 0.01 && !d.clearedAtMonth) { d.clearedAtMonth = m; d.currentBalance = 0; freedMinimums += d.minPayment; } } });
    // Pool AFTER the minimums pass so a same-month-cleared debt's freed minimum
    // joins this month's attack — the exact ordering projectDebtSnowball uses.
    let pool = monthlyExtraAvailable + freedMinimums;
    let safety = 0;
    while (pool > 0.01 && safety < 100) { safety++; const target = activeDebts.filter((d) => d.currentBalance > 0).sort((a, b) => b.rate - a.rate)[0]; if (!target) break; const pay = Math.min(pool, target.currentBalance); target.currentBalance -= pay; pool -= pay; if (target.currentBalance <= 0.01) { target.clearedAtMonth = m; target.currentBalance = 0; freedMinimums += target.minPayment; } }
    const totalBalance = activeDebts.reduce((s, d) => s + Math.max(d.currentBalance, 0), 0);
    projection.push({ monthOffset: m, label: monthLabel(currentDate, m), debtBalance: Math.round(totalBalance) });
    if (totalBalance <= 1) break;
  }
  return { projection, debtFreeMonth: projection.length, debtFreeYears: projection.length / 12, debtFreeDate: monthLabel(currentDate, projection.length), totalInterestPaid: Math.round(totalInterestPaid) };
}

// v12: Debt snowball with sort strategy and cascade tracking — mirrors rental snowball architecture
export function projectDebtSnowball(debts, monthlyExtra, sortOrder, currentDate, maxMonths = 360) {
  let active = debts.filter(d => !d.leaveAlone).map(d => ({ id: d.id, name: d.name, rate: d.rate, minPayment: d.minPayment, originalBalance: d.balance, currentBalance: d.balance, clearedAtMonth: null, interestPaid: 0, flag: d.flag, entityId: d.entityId }));

  function sortQueue(list) {
    return [...list].filter(d => d.currentBalance > 0).sort((a, b) => {
      if (sortOrder === 'snowball') return a.currentBalance - b.currentBalance; // smallest balance first (momentum)
      if (sortOrder === 'avalanche') return b.rate - a.rate; // highest rate first (math optimum)
      if (sortOrder === 'hybrid') {
        // Clear anything under $1500 first (psychological wins), then avalanche
        const aSmall = a.currentBalance < 1500;
        const bSmall = b.currentBalance < 1500;
        if (aSmall && !bSmall) return -1;
        if (!aSmall && bSmall) return 1;
        if (aSmall && bSmall) return a.currentBalance - b.currentBalance;
        return b.rate - a.rate;
      }
      return a.currentBalance - b.currentBalance;
    });
  }

  let freedFromSnowball = 0;
  const monthlyHistory = [];

  for (let m = 1; m <= maxMonths; m++) {
    // Accrue interest
    active.forEach(d => { if (d.currentBalance > 0 && d.rate > 0) { const interest = d.currentBalance * (d.rate / 100 / 12); d.currentBalance += interest; d.interestPaid += interest; } });

    // Pay minimums
    active.forEach(d => {
      if (d.currentBalance > 0) {
        const pay = Math.min(d.minPayment, d.currentBalance);
        d.currentBalance -= pay;
        if (d.currentBalance <= 0.01 && !d.clearedAtMonth) {
          d.clearedAtMonth = m;
          d.currentBalance = 0;
          freedFromSnowball += d.minPayment;
        }
      }
    });

    // Apply extra + freed snowball to target debt per sort order
    let pool = monthlyExtra + freedFromSnowball;
    let safety = 0;
    while (pool > 0.01 && safety < 100) {
      safety++;
      const queue = sortQueue(active);
      if (queue.length === 0) break;
      const target = queue[0];
      const pay = Math.min(pool, target.currentBalance);
      target.currentBalance -= pay;
      pool -= pay;
      if (target.currentBalance <= 0.01) {
        target.clearedAtMonth = m;
        target.currentBalance = 0;
        freedFromSnowball += target.minPayment;
      }
    }

    const totalBalance = active.reduce((s, d) => s + Math.max(d.currentBalance, 0), 0);
    monthlyHistory.push({ monthOffset: m, label: monthLabel(currentDate, m), totalBalance: Math.round(totalBalance) });
    if (totalBalance <= 1) break;
  }

  return {
    monthlyHistory,
    allClearedMonth: monthlyHistory.length,
    allClearedYears: monthlyHistory.length / 12,
    allClearedDate: monthLabel(currentDate, monthlyHistory.length),
    activeDebts: active,
    totalInterest: Math.round(active.reduce((s, d) => s + d.interestPaid, 0)),
    finalFreedCashFlow: Math.round(freedFromSnowball),
  };
}

// v12: Minimum-only baseline for interest-saved comparison
export function projectDebtMinimumOnly(debts, currentDate, maxMonths = 600) {
  let active = debts.filter(d => !d.leaveAlone).map(d => ({ id: d.id, currentBalance: d.balance, originalBalance: d.balance, rate: d.rate, minPayment: d.minPayment, clearedAtMonth: null, interestPaid: 0, stuck: false }));

  for (let m = 1; m <= maxMonths; m++) {
    active.forEach(d => {
      if (d.currentBalance > 0 && !d.stuck) {
        const interest = d.currentBalance * (d.rate / 100 / 12);
        d.currentBalance += interest;
        d.interestPaid += interest;
        const pay = Math.min(d.minPayment, d.currentBalance);
        d.currentBalance -= pay;
        // If min payment isn't even covering interest, mark as stuck (will never pay off at this rate)
        if (pay <= interest * 1.01 && d.currentBalance > d.originalBalance * 0.99) {
          d.stuck = true;
        }
        if (d.currentBalance <= 0.01 && !d.clearedAtMonth) { d.clearedAtMonth = m; d.currentBalance = 0; }
      }
    });
    const allCleared = active.every(d => d.currentBalance <= 0.01 || d.stuck);
    if (allCleared) break;
  }

  const stuckDebts = active.filter(d => d.stuck);
  const totalInterest = Math.round(active.reduce((s, d) => s + d.interestPaid, 0));
  const longestPayoff = Math.max(...active.filter(d => d.clearedAtMonth).map(d => d.clearedAtMonth), 0);
  return { totalInterest, longestPayoff, stuckDebts, allCleared: stuckDebts.length === 0 };
}


export function projectRentalSnowball(rentals, monthlyExtra, sortOrder, currentDate, maxMonths = 240) {
  let active = rentals.map(r => ({ id: r.id, name: r.name, rent: r.rent, currentBalance: r.mortgage.balance, originalBalance: r.mortgage.balance, rate: r.mortgage.rate, monthlyPI: r.mortgage.monthlyPI, escrow: r.mortgage.escrow, clearedAtMonth: null, interestPaid: 0 }));
  function sortQueue(list) { return [...list].filter(r => r.currentBalance > 0).sort((a, b) => { if (sortOrder === 'smallest-balance') return a.currentBalance - b.currentBalance; if (sortOrder === 'highest-rate') return b.rate - a.rate; if (sortOrder === 'best-cashflow') return (b.rent - b.monthlyPI - b.escrow) - (a.rent - a.monthlyPI - a.escrow); return a.currentBalance - b.currentBalance; }); }
  const monthlyHistory = []; let freedFromSnowball = 0;
  for (let m = 1; m <= maxMonths; m++) {
    active.forEach(r => { if (r.currentBalance > 0) { const interest = r.currentBalance * (r.rate / 100 / 12); r.currentBalance += interest; r.interestPaid += interest; } });
    active.forEach(r => { if (r.currentBalance > 0) { const pay = Math.min(r.monthlyPI, r.currentBalance); r.currentBalance -= pay; if (r.currentBalance <= 0.01 && !r.clearedAtMonth) { r.clearedAtMonth = m; r.currentBalance = 0; freedFromSnowball += r.monthlyPI; } } });
    let pool = monthlyExtra + freedFromSnowball; let safety = 0;
    while (pool > 0.01 && safety < 50) { safety++; const queue = sortQueue(active); if (queue.length === 0) break; const target = queue[0]; const pay = Math.min(pool, target.currentBalance); target.currentBalance -= pay; pool -= pay; if (target.currentBalance <= 0.01) { target.clearedAtMonth = m; target.currentBalance = 0; freedFromSnowball += target.monthlyPI; } }
    const totalBalance = active.reduce((s, r) => s + Math.max(r.currentBalance, 0), 0);
    monthlyHistory.push({ monthOffset: m, label: monthLabel(currentDate, m), totalBalance: Math.round(totalBalance) });
    if (totalBalance <= 1) break;
  }
  return { monthlyHistory, allClearedMonth: monthlyHistory.length, allClearedYears: monthlyHistory.length / 12, allClearedDate: monthLabel(currentDate, monthlyHistory.length), activeProperties: active, totalInterest: Math.round(active.reduce((s, r) => s + r.interestPaid, 0)), finalFreedCashFlow: Math.round(freedFromSnowball) };
}

// 2026-07-05 financial-math audit fix: an unreachable target no longer returns
// the $50k/mo search ceiling as if it were an answer. The result carries the
// number AND whether the target is achievable inside the search bound, so the
// 7-year surface can say "not reachable" instead of painting a fabricated
// figure (DR-0076 — honest uncertainty over a confident wrong number).
export function findExtraForTarget(rentals, targetYears, currentDate) {
  const CAP = 50000;
  // Achievability check first: if even the cap can't clear the portfolio in
  // time, say so plainly rather than returning the cap.
  const atCap = projectRentalSnowball(rentals, CAP, 'smallest-balance', currentDate, targetYears * 12 + 24);
  if (atCap.allClearedYears > targetYears) return { extra: null, achievable: false, cap: CAP };
  let lo = 0, hi = CAP, bestExtra = hi;
  for (let i = 0; i < 30; i++) { const mid = (lo + hi) / 2; const result = projectRentalSnowball(rentals, mid, 'smallest-balance', currentDate, targetYears * 12 + 24); if (result.allClearedYears <= targetYears) { bestExtra = mid; hi = mid; } else { lo = mid; } if (hi - lo < 50) break; }
  return { extra: Math.ceil(bestExtra), achievable: true, cap: CAP };
}

