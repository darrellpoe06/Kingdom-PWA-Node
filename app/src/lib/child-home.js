// =============================================================================
// child-home — what a signed-in CHILD's home shows, computed from their real grants
// =============================================================================
// The pure decision core for the child's own experience (DR-0093 child session).
// A child home is NOT the family/business surface — it is the child-safe slice the
// guardian configured: the activities the guardian allowed, plus (only if the
// guardian granted "See family finances") the read-only books view in the mode the
// guardian chose, in the DR-0112 posture (provoke to good works, never to wrath).
//
// GROUNDED, NOT PAINTED (DR-0076 / reality-trace): every tile here is derived from
// the child's REAL capability config (the child_capabilities rows the guardian set,
// resolved through the same relationships.js model the roster writes) — never a
// hardcoded menu. The finances section unlocks ONLY on a real finance.view grant,
// and its numbers come from child-books-view over real books data. When the books
// data is not (yet) reachable by the child (the grant-gated read is DR-0093's next
// slice), the section reports itself as granted-but-not-yet-loaded — honest, never
// a fake.
//
// SEEING IS NOT SPENDING: this model surfaces only VIEW/DO capabilities the child
// holds; the acting locks (spend / security / outbound) live in relationships.js +
// RLS and are untouched here. Pure: no React, no I/O — importable by the child
// home component (once the session exists), by the guardian preview, and by vitest.
// =============================================================================

import { CAPABILITIES } from './relationships.js';
import { decideChildAction } from './guardian-child.js';
import { childBooksView, normalizeChildViewMode } from './child-books-view.js';

// The activities a child can hold, in the order they present on the home. Finance
// and the acting-locks are handled separately (finance = its own section; the
// locks never appear as activities). Outbound stays out of the home tiles.
const ACTIVITY_CAPS = ['learn.read', 'scripture.read', 'game.play', 'voice.listen', 'create.make', 'message.family', 'profile.edit'];

// One activity tile: the capability, its label, and the child's resolved verdict
// (allow / needs-approval / deny). 'deny' tiles are returned too so the caller can
// choose to show them locked or hide them — the model states the truth either way.
export function childActivities(config = {}) {
  return ACTIVITY_CAPS.map((cap) => {
    const d = decideChildAction(cap, config);
    return {
      capability: cap,
      label: CAPABILITIES[cap]?.label || cap,
      verdict: d.verdict,               // 'allow' | 'needs-approval' | 'deny'
      allowed: d.verdict === 'allow',
      needsApproval: d.verdict === 'needs-approval',
    };
  });
}

// The finances section of the child home. Unlocked ONLY on a real finance.view
// grant (allow OR ask-first). `financeData` is the real books; when absent (the
// child can't read them yet — DR-0093 grant-gated read), `view` is null and
// `pending` is true so the UI shows "your guardian turned this on" honestly rather
// than faking numbers. `mode` is the guardian's per-child choice (raw / teaching).
export function childFinancesSection(config = {}, { financeData = null, mode = 'teaching' } = {}) {
  const d = decideChildAction('finance.view', config);
  const unlocked = d.verdict === 'allow' || d.verdict === 'needs-approval';
  if (!unlocked) {
    return { unlocked: false, needsApproval: false, mode: null, view: null, pending: false };
  }
  const safeMode = normalizeChildViewMode(mode);
  const view = financeData ? childBooksView(financeData, { mode: safeMode }) : null;
  return {
    unlocked: true,
    needsApproval: d.verdict === 'needs-approval', // ask-first: guardian approves the peek
    mode: safeMode,
    view,                    // the real read-only books view, or null until reachable
    pending: !financeData,   // granted, but the books aren't loaded to the child yet
  };
}

// The whole child home model. Pure composition of the two sections above.
//   config      — the child's resolved capability config (from child_capabilities)
//   financeData — the real books (present only once the grant-gated read exists)
//   mode        — the guardian's per-child view mode ('teaching' | 'raw')
export function childHomeModel(config = {}, { financeData = null, mode = 'teaching' } = {}) {
  const activities = childActivities(config);
  return {
    activities,
    canDo: activities.filter((a) => a.allowed).map((a) => a.capability),
    finances: childFinancesSection(config, { financeData, mode }),
  };
}

// Convenience: is there anything at all for this child to do (so a brand-new child
// with an all-deny config shows an honest empty state, not a broken one)?
export function childHomeHasContent(model) {
  return (model?.canDo?.length || 0) > 0
    || !!(model?.finances?.unlocked)
    || (model?.activities || []).some((a) => a.needsApproval);
}
