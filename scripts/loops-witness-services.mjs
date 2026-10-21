// =============================================================================
// loops-witness-services — one loop's last run, decided in ONE testable place
// (DR-1152)
// =============================================================================
// WHY THIS IS A FILE AND NOT SIX LINES INSIDE A WORKFLOW. DR-1151 put this
// mapping inline in `loops-health.yml`'s github-script step, where the only
// thing a test could do was grep its source text — and a source-text assertion
// survives the break it is supposed to catch (DR-1147's third defect). The
// first live witness proved the cost: the inline version read
// `Number(e.ledger_age_s)`, that witness writes `None` for a loop that HAS no
// ledger, `Number(null)` is 0, and 0 is finite and >= 0 — so six of ten loops
// published `its own ledger, 0s old` and a timestamp of "now" for a ledger that
// does not exist. A FABRICATED MEASUREMENT WEARING FALSE PROVENANCE, which is
// the one thing the census road exists to prevent.
//
// So the rule lives here, as a pure function, with `now` injected:
//
//   * a loop's OWN ledger wins when its age is a real number ABOVE zero — it is
//     that loop's own file, and the better evidence.
//   * the services-sync clock is the fallback, and ONLY for a loop whose last
//     run that cycle was `ok`.
//   * anything else gets NO timestamp and says why — the census then reads it
//     as unknown, never as "never" and never as a run.
//
// `age > 0` rather than `>= 0` on purpose: a ledger written in the same second
// as the read cannot be told apart from the absent case, and the honest answer
// to "I cannot tell" is the fallback, not a guess.
// =============================================================================

/** Is this a usable ledger age in seconds, and not a null wearing a zero? */
export function ledgerAge(entry) {
  const v = entry && entry.ledger_age_s;
  if (typeof v !== 'number' || !Number.isFinite(v) || v <= 0) return null;
  return v;
}

/**
 * The per-loop services map the fleet census reads.
 * @param witness loops-health's own `witness` object ({ clock, loops })
 * @param now     injected milliseconds, so a test can pin the arithmetic
 */
export function servicesFromWitness(witness, { now = Date.now() } = {}) {
  const w = witness || {};
  const clock = w.clock || {};
  const loops = (w.loops && typeof w.loops === 'object') ? w.loops : {};
  const out = {};
  for (const [name, e] of Object.entries(loops)) {
    const age = ledgerAge(e);
    const verdict = (e && e.last_run) || 'unknown';
    if (age !== null) {
      out[name] = {
        last_run_at: new Date(now - age * 1000).toISOString(),
        from: `its own ledger, ${age}s old`,
        verdict,
      };
    } else if (verdict === 'ok' && clock.last_run_at) {
      out[name] = {
        last_run_at: clock.last_run_at,
        from: 'the services-sync cycle it last ran ok in',
        verdict,
      };
    } else {
      out[name] = {
        last_run_at: null,
        from: `no timestamp available (last run ${verdict})`,
        verdict,
      };
    }
  }
  return out;
}
