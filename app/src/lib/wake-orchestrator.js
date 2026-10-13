// =============================================================================
// wake-orchestrator.js — pure shapers for the in-app wake-orchestrator cockpit
// =============================================================================
// The NAS runs the engine (the portable bundle's scheduler + the host router);
// the app is the COCKPIT. This module turns the live feed from the NAS
// (GET /wake-orchestrator, served by the sovereign Python engine — DR-0218) into
// the views the cockpit renders: brake status, the handoff log, scheduled wakes,
// vendor summons, the event reel. ALL real data bound to actual orchestrator
// state — never a painted status (Reality-Trace P15/P16, Verification Doctrine
// DR-0076). When the feed isn't connected the cockpit shows "not connected", not
// a guess. Status colors come from the ONE shared palette (lib/kpi-status.js).
//
// Engine: infra/ai-orchestrator/portable/ (scheduler) + scripts/wake-router.mjs
//         (router) + the handoff contract (portable/handoff/HANDOFF-CONTRACT.md).

// Normalize the live feed body into a safe, fully-defaulted shape. Never throws;
// a null / error / malformed body returns ok:false so the cockpit degrades to
// "not connected" instead of rendering fabricated state.
export function normalizeWakeState(json) {
  if (!json || typeof json !== 'object' || json.ok === false) {
    return { ok: false, error: (json && json.error) || 'unavailable' };
  }
  const b = (json.brakes && typeof json.brakes === 'object') ? json.brakes : {};
  const bud = (b.budget && typeof b.budget === 'object') ? b.budget : {};
  const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

  const brakes = {
    killSwitch: String(b.kill_switch || b.killSwitch || 'engaged').toLowerCase() === 'clear' ? 'clear' : 'engaged',
    armed: b.armed === true,
    wakeSummon: (b.wake_summon === true) || (b.wakeSummon === true),
    concurrencyLock: String(b.concurrency_lock || b.concurrencyLock || 'free').toLowerCase() === 'held' ? 'held' : 'free',
    budget: {
      perTaskUsd: num(bud.per_task_usd ?? bud.perTaskUsd),
      dailyUsd: num(bud.daily_usd ?? bud.dailyUsd),
      spentUsd: num(bud.spent_usd ?? bud.spentUsd),
      remainingUsd: num(bud.remaining_usd ?? bud.remainingUsd),
    },
  };

  const handoffs = (Array.isArray(json.handoffs) ? json.handoffs : []).map((h) => ({
    id: String((h && h.id) || '(unnamed)'),
    lane: String((h && h.lane) || ''),
    task: String((h && h.task) || ''),
    issuedBy: String((h && (h.issued_by || h.issuedBy)) || ''),
    suggestedVendor: String((h && (h.suggested_vendor || h.suggestedVendor)) || 'auto'),
    wakeAtLabel: wakeAtLabel(h && h.wake_at),
    due: (h && h.due) === true,
    dueReason: String((h && (h.due_reason || h.dueReason)) || ''),
  }));

  const summons = (Array.isArray(json.summons) ? json.summons : []).map((s) => ({
    ts: String((s && s.ts) || ''),
    lane: String((s && s.lane) || ''),
    vendor: String((s && s.vendor) || ''),
    model: String((s && s.model) || ''),
    route: String((s && s.route) || ''),
    costUsd: num(s && (s.cost_usd ?? s.costUsd)),
  }));

  const events = (Array.isArray(json.events) ? json.events : []).map((e) => ({
    ts: String((e && e.ts) || ''),
    event: String((e && e.event) || ''),
    detail: String((e && e.detail) || ''),
  }));

  return {
    ok: true,
    generatedAt: json.generated_at || json.generatedAt || null,
    selfDriveImplemented: json.self_drive_implemented === true || json.selfDriveImplemented === true,
    brakes,
    handoffs,
    scheduledWakes: handoffs.filter((h) => h.wakeAtLabel && h.wakeAtLabel !== '—'),
    summons,
    events,
  };
}

// Human label for a wake_at object (display only — the engine owns due-logic).
export function wakeAtLabel(w) {
  if (!w || typeof w !== 'object') return '—';
  if (w.at) return `at ${String(w.at).replace('T', ' ').replace(/:\d\dZ$/, 'Z')}`;
  if (w.after_seconds || w.afterSeconds) return `+${w.after_seconds || w.afterSeconds}s after handoff`;
  if (w.condition) return `when ${w.condition}`;
  return '—';
}

// Overall cockpit KPI. Inert (any brake holding) is the SAFE default and reads
// good/idle; fully live (armed + summon-consented + clear) reads attention
// because autonomous spend is happening and is worth watching; a budget breach
// is a problem. Not connected is honest idle, never a misleading green.
export function wakeOrchestratorKpi(phase, data) {
  if (phase === 'loading') return { status: 'idle', label: 'Checking' };
  if (phase !== 'ok' || !data || !data.ok) return { status: 'idle', label: 'Not connected' };
  const { brakes } = data;
  const budget = budgetStatus(brakes.budget);
  if (budget.status === 'problem') return { status: 'problem', label: 'Budget exceeded' };
  const live = brakes.killSwitch === 'clear' && brakes.armed && brakes.wakeSummon;
  if (live) return { status: 'attention', label: 'ARMED — summon live' };
  if (brakes.killSwitch === 'engaged') return { status: 'good', label: 'Inert (kill-switch engaged)' };
  return { status: 'good', label: 'Disarmed (safe)' };
}

// Budget brake status from real spend vs ceiling. Unset ceiling => idle (a
// missing brake, no autonomous spend possible). >= daily => problem (refuse).
// >= 80% => attention. Else good. Returns a pct for the cap-used readout.
export function budgetStatus(budget) {
  const b = budget || {};
  const daily = Number(b.dailyUsd) || 0;
  const spent = Number(b.spentUsd) || 0;
  if (daily <= 0) return { status: 'idle', label: 'No budget set', pct: 0 };
  const pct = Math.min(100, Math.round((spent / daily) * 100));
  if (spent >= daily) return { status: 'problem', label: `Over cap ($${spent.toFixed(2)}/$${daily.toFixed(2)})`, pct };
  if (pct >= 80) return { status: 'attention', label: `${pct}% of daily cap`, pct };
  return { status: 'good', label: `${pct}% of daily cap`, pct };
}

// One row per brake for the status grid. Green = the safe / nominal state; amber
// = a gate is OPEN (moving toward autonomous operation — pay attention); the dots
// communicate the literal brake STATE, paired with text (never color-alone).
export function brakeRows(brakes) {
  const b = brakes || {};
  const budget = budgetStatus(b.budget || {});
  return [
    {
      key: 'kill_switch',
      label: 'Kill-switch',
      status: b.killSwitch === 'engaged' ? 'good' : 'attention',
      detail: b.killSwitch === 'engaged' ? 'Engaged — inert (safe default)' : 'Disengaged',
    },
    {
      key: 'arm',
      label: 'Arm flag',
      status: b.armed ? 'attention' : 'good',
      detail: b.armed ? 'Armed' : 'Disarmed (safe)',
    },
    {
      key: 'wake_summon',
      label: 'Wake-summon consent',
      status: b.wakeSummon ? 'attention' : 'good',
      detail: b.wakeSummon ? 'Consented — vendors can be summoned' : 'Not consented (safe)',
    },
    {
      key: 'budget',
      label: 'Budget cap',
      status: budget.status,
      detail: budget.label,
    },
    {
      key: 'concurrency',
      label: 'Concurrency lock',
      status: b.concurrencyLock === 'held' ? 'attention' : 'good',
      detail: b.concurrencyLock === 'held' ? 'Held — a run is in progress' : 'Free',
    },
  ];
}

// The control actions the cockpit can POST, with the human-facing confirmation
// copy. Panic-class actions (kill, disarm, wake-disarm) move TOWARD safe and need
// no confirm; arming actions move toward autonomous operation and require it.
export const CONTROL_ACTIONS = {
  kill: { label: 'Panic stop (kill-switch ON)', confirm: false, toward: 'safe' },
  unkill: { label: 'Disengage kill-switch', confirm: true, toward: 'live' },
  arm: { label: 'Arm standby', confirm: true, toward: 'live' },
  disarm: { label: 'Disarm', confirm: false, toward: 'safe' },
  'wake-arm': { label: 'Consent to vendor-summon', confirm: true, toward: 'live' },
  'wake-disarm': { label: 'Withdraw summon consent', confirm: false, toward: 'safe' },
};
