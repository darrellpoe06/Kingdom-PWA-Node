// =============================================================================
// agent-brakes — the three brakes as importable, PROVEN primitives (DR-0225)
// =============================================================================
// "Ari should ... have a team or teams of agents supporting systems while Ari
// makes sure they are effectively working for our good." (Darrell 2026-07-23.)
// And DR-0225: the three brakes are ENGINEERING DELIVERABLES built into the
// same work and proven-to-catch in CI — never a permission conversation.
//
// This is the shared brake kit every current and future runner (an agent-team
// spawner, a watcher, the wake-orchestrator, a cron loop) imports instead of
// re-inventing. Nothing in this file schedules anything — importing it is
// inert by construction; a runner only gains a brake by CALLING it. That is
// "ship inactive, brakes in" as code.
//
//   1. BUDGET       — a ceiling per run (tokens / turns / wall-clock). A run
//                     that reaches any ceiling is exceeded and terminates;
//                     it does not continue. (P10.)
//   2. CONCURRENCY  — single-instance lock. A new fire that finds a prior run
//                     still fresh SKIPS; it does not stack. A crashed run's
//                     stale lock is reclaimable, so a wreck never wedges the
//                     lane shut forever. (P10.)
//   3. KILL-SWITCH  — dead-man's switch. On a missed heartbeat or an explicit
//                     trip it PAUSES and NEVER auto-resumes — resuming takes
//                     an explicit human/governor reset. (P10/P11: it never
//                     auto-continues into a runaway.)
//
// Pure + deterministic: nowMs is injected everywhere and state lives in an
// injected `store` (any {getItem,setItem,removeItem} — localStorage-shaped —
// or a plain object via memoryStore()), so every brake is provable in vitest
// (agent-brakes.test.js pins each one CATCHING its runaway — DR-0076 §3).
// =============================================================================

// A minimal in-memory store for runners without localStorage (tests, node).
export function memoryStore() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)); },
    removeItem: (k) => { m.delete(k); },
  };
}

const readJson = (store, key) => {
  try {
    const raw = store.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
};
const writeJson = (store, key, val) => { store.setItem(key, JSON.stringify(val)); };

// ---- 1. BUDGET --------------------------------------------------------------
// createBudget({ maxUnits, maxTurns, maxWallMs, nowMs }) — count units (tokens,
// items, dollars — the runner's own metric) and turns against hard ceilings.
// `exceeded()` is the termination signal: the runner MUST stop when it's true.
export function createBudget({ maxUnits = Infinity, maxTurns = Infinity, maxWallMs = Infinity, nowMs = 0 } = {}) {
  let units = 0;
  let turns = 0;
  const startedMs = nowMs;
  const state = (atMs) => ({
    units, turns,
    elapsedMs: (atMs != null ? atMs : startedMs) - startedMs,
    maxUnits, maxTurns, maxWallMs,
  });
  return {
    spend(u = 0) { units += Math.max(0, Number(u) || 0); return units; },
    turn() { turns += 1; return turns; },
    exceeded(atMs) {
      const s = state(atMs);
      if (s.units >= maxUnits) return { exceeded: true, brake: 'budget', reason: `unit ceiling reached (${s.units}/${maxUnits})` };
      if (s.turns >= maxTurns) return { exceeded: true, brake: 'budget', reason: `turn ceiling reached (${s.turns}/${maxTurns})` };
      if (s.elapsedMs >= maxWallMs) return { exceeded: true, brake: 'budget', reason: `wall-clock ceiling reached (${s.elapsedMs}ms/${maxWallMs}ms)` };
      return { exceeded: false };
    },
    snapshot: state,
  };
}

// ---- 2. CONCURRENCY LOCK ----------------------------------------------------
// acquireLock(store, name, { nowMs, staleMs, holder }) — single-instance. A
// fresh existing lock => { acquired:false, skip:true } (the new fire SKIPS —
// it never stacks). A lock older than staleMs is treated as a crashed run and
// reclaimed. releaseLock() when the run completes.
export function acquireLock(store, name, { nowMs = 0, staleMs = 30 * 60000, holder = 'run' } = {}) {
  const key = `brake-lock:${name}`;
  const cur = readJson(store, key);
  if (cur && typeof cur.atMs === 'number' && (nowMs - cur.atMs) < staleMs) {
    return { acquired: false, skip: true, brake: 'lock', reason: `prior run (${cur.holder || 'unknown'}) still holds the lock (${nowMs - cur.atMs}ms old < ${staleMs}ms)` };
  }
  writeJson(store, key, { holder, atMs: nowMs });
  return { acquired: true, skip: false, reclaimed: !!cur };
}
export function releaseLock(store, name) { store.removeItem(`brake-lock:${name}`); }

// ---- 3. KILL-SWITCH ---------------------------------------------------------
// killSwitch(store, name, { nowMs, missedMs }) — the dead-man's switch.
//   beat()    — the run's heartbeat; call it on real progress.
//   check()   — { paused, reason }: paused when explicitly tripped OR when the
//               last beat is older than missedMs. Once paused it STAYS paused.
//   trip(why) — explicit pause (overrun, repeated failure, a human's hand).
//   reset(by) — the ONLY way back: an explicit, attributed reset. Never
//               automatic (P11 — it never auto-continues into a runaway).
export function killSwitch(store, name, { nowMs = 0, missedMs = 15 * 60000 } = {}) {
  const key = `brake-kill:${name}`;
  const read = () => readJson(store, key) || { lastBeatMs: null, paused: false, reason: null };
  return {
    beat(atMs = nowMs) {
      const s = read();
      if (s.paused) return { paused: true, reason: s.reason }; // a beat never revives a paused switch
      writeJson(store, key, { ...s, lastBeatMs: atMs });
      return { paused: false };
    },
    check(atMs = nowMs) {
      const s = read();
      if (s.paused) return { paused: true, brake: 'kill-switch', reason: s.reason || 'explicitly tripped' };
      if (s.lastBeatMs != null && (atMs - s.lastBeatMs) >= missedMs) {
        const reason = `missed heartbeat (${atMs - s.lastBeatMs}ms >= ${missedMs}ms)`;
        writeJson(store, key, { ...s, paused: true, reason }); // sticky: pausing persists
        return { paused: true, brake: 'kill-switch', reason };
      }
      return { paused: false };
    },
    trip(why = 'tripped') {
      const s = read();
      writeJson(store, key, { ...s, paused: true, reason: why });
      return { paused: true, reason: why };
    },
    reset(by = 'governor', atMs = nowMs) {
      writeJson(store, key, { lastBeatMs: atMs, paused: false, reason: null, resetBy: by, resetAtMs: atMs });
      return { paused: false, resetBy: by };
    },
  };
}

// ---- Fleet oversight --------------------------------------------------------
// fleetOversight({ workflows }) — Ari "makes sure they are effectively working
// for our good": the standing-automation fleet, each member with its REAL
// measured state and its brake coverage. Honesty rules (DR-0076):
//   · members come from the build-measured workflow registry (nothing typed);
//   · brake coverage is TRUE only when a member is registered in
//     BRAKE_DECLARATIONS below — a registry that starts from the code that
//     actually imports this kit. Coverage is never assumed; an ACTIVE member
//     with no declared brakes is a named warning (the P10 class), which today
//     honestly fires on the legacy n8n webhooks the Ways are retiring.
export const BRAKE_DECLARATIONS = Object.freeze({
  // name (registry file or agent id) -> { budget, lock, kill, note }
  // Grows ONLY as real code wires this kit (or a workflow's own proven brakes
  // are recorded with evidence). Empty entries are never invented.
  'review-watcher': {
    budget: true, lock: true, kill: true,
    note: 'lib/review-watcher.js runs every pass through this kit — kill-switch checked first, single-instance lock (concurrent fire skips), item+wall-clock budget, repeated-failure auto-trip. Proven-to-catch in review-watcher.test.js. Ships inactive; the scheduled runner activates on a watched proof (DR-0225).',
  },
});

export function fleetOversight({ workflows = [], agents = [], declarations = BRAKE_DECLARATIONS } = {}) {
  // App-native agents (watchers/runners built in this codebase) self-describe:
  // each carries its own braked/why/active flags IN CODE beside the
  // implementation, so the record can't drift from the thing it describes.
  const native = (Array.isArray(agents) ? agents : []).filter((a) => a && a.id).map((a) => ({
    id: a.id, name: a.name || a.id, kind: a.kind || 'app-agent',
    active: a.active === true,
    webhooks: 0,
    braked: a.braked === true, brakes: declarations[a.id] || null,
    why: a.why || null, whyRecorded: !!(a.why && String(a.why).trim()),
  }));
  const members = native.concat((Array.isArray(workflows) ? workflows : []).filter((w) => w && w.file).map((w) => {
    const decl = declarations[w.file] || declarations[w.name] || null;
    const braked = !!(decl && decl.budget && decl.lock && decl.kill);
    // INTENTION: the recorded why (DR-0158 — the paired README's first
    // paragraph, measured at build). Ari's contextual understanding of a
    // member IS this record — consistent because it is read, never invented.
    const why = typeof w.why === 'string' ? w.why.trim() : '';
    return {
      id: w.file, name: w.name || w.file, kind: 'n8n-workflow',
      active: w.active === true,
      webhooks: Array.isArray(w.webhooks) ? w.webhooks.length : 0,
      braked, brakes: decl || null,
      why: why || null, whyRecorded: why.length > 0,
    };
  }));
  const activeUnbraked = members.filter((m) => m.active && !m.braked);
  // Active members whose PURPOSE is unrecorded: Ari cannot judge "working for
  // our good" without the intention on record — a named expertise gap
  // (DR-0158), each closed by pairing a README beside the export.
  const activeNoWhy = members.filter((m) => m.active && !m.whyRecorded);
  return {
    members,
    counts: {
      total: members.length,
      active: members.filter((m) => m.active).length,
      braked: members.filter((m) => m.braked).length,
      activeUnbraked: activeUnbraked.length,
      whyRecorded: members.filter((m) => m.whyRecorded).length,
      activeNoWhy: activeNoWhy.length,
    },
    activeUnbraked,
    activeNoWhy,
  };
}
