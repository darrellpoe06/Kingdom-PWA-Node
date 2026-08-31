// =============================================================================
// health-program — the GENERIC program engine (pure, deterministic, reusable)
// =============================================================================
// Darrell 2026-08-30: "Do not hard-code the entire application specifically to
// 202 to 150. The Road to 150 program should be the first program/template using
// the underlying system." So this file knows nothing about 202, 150, or 26 weeks.
// It takes a PROGRAM (lib/road-to-150-program.js is the first one) and the user's
// own entries, and answers the questions the surfaces ask.
//
// THE ONE RULE THIS FILE EXISTS TO HOLD (Darrell, same brief, stated three times):
//
//     PLANNED and ACTUAL are separate. Actual never overwrites planned.
//
// Structurally, not by convention: a program's planned values live on the frozen
// template and are never passed to a setter; every "actual" reading is computed
// from the user's own entry list. A function here either reads the plan or reads
// the entries -- the two are never merged into one mutable record.
//
// SAFETY (Darrell's explicit language rule): the weekly figures are PLANNING
// TARGETS, never predictions. Nothing here returns "expected", "guaranteed", or
// "should have lost", and no function reduces a calorie target because a weigh-in
// came in above plan. deltaPhrase() is the single place difference-from-target is
// put into words, so the neutral phrasing cannot drift surface to surface.
//
// Pure: every function takes its data as arguments; no clock, no storage, no
// React. `today` is always injected so the tests are deterministic.
// =============================================================================

// ── dates ────────────────────────────────────────────────────────────────────

/** 'YYYY-MM-DD' for a Date, in LOCAL time (a program day is a calendar day). */
export function toDayKey(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Parse 'YYYY-MM-DD' as a LOCAL midnight Date (never UTC-shifted). */
export function fromDayKey(key) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(key || ''));
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Whole days from dayKey a to dayKey b (b - a). null if either is unparseable. */
export function daysBetween(aKey, bKey) {
  const a = fromDayKey(aKey);
  const b = fromDayKey(bKey);
  if (!a || !b) return null;
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

/** The dayKey `n` days after a dayKey. */
export function addDays(key, n) {
  const d = fromDayKey(key);
  if (!d) return null;
  d.setDate(d.getDate() + n);
  return toDayKey(d);
}

// ── program shape ────────────────────────────────────────────────────────────

/**
 * Which program week a date falls in. Week 1 is the FIRST week (days 0-6 from
 * the start date), matching how the roadmap is numbered for the user.
 * Before the start date -> 0. After the last week -> weeks + 1 (past the end).
 */
export function weekForDay(program, dayKey) {
  const start = program?.startDate;
  const n = daysBetween(start, dayKey);
  if (n == null) return null;
  if (n < 0) return 0;
  const week = Math.floor(n / 7) + 1;
  return week > (program.weeks || 0) ? (program.weeks || 0) + 1 : week;
}

/** The first and last dayKey of a program week (1-based). */
export function weekRange(program, week) {
  const start = program?.startDate;
  if (!start || !Number.isFinite(week) || week < 1) return null;
  const from = addDays(start, (week - 1) * 7);
  return from ? { from, to: addDays(from, 6) } : null;
}

/** The planned target weight for a week, from the roadmap. null if off-plan. */
export function targetWeightFor(program, week) {
  const row = (program?.weeklyTargets || []).find((t) => t.week === week);
  return row ? row.targetWeightLb : null;
}

/**
 * Planned cumulative loss by the END of a week -- startWeight minus that week's
 * target. This is the "Target Running Loss" the dashboard shows.
 */
export function targetRunningLoss(program, week) {
  const target = targetWeightFor(program, week);
  if (target == null) return null;
  return round1((program.startWeightLb || 0) - target);
}

// ── weigh-ins (ACTUAL) ───────────────────────────────────────────────────────

/**
 * A real, recorded number -- not null, not '', not a blank field. Number(null)
 * and Number('') are both 0, so a bare Number.isFinite() check would silently
 * turn "not weighed yet" into "weighed 0 lb": the exact planned-for-actual
 * substitution this module exists to prevent (caught by its own test).
 */
function isRecordedNumber(v) {
  if (v == null || v === '') return false;
  return Number.isFinite(Number(v));
}

/** Sort weigh-ins oldest-first; drop anything without a usable date + weight. */
export function sortWeighIns(entries) {
  return (entries || [])
    .filter((e) => e && fromDayKey(e.day) && isRecordedNumber(e.weightLb))
    .slice()
    .sort((a, b) => (a.day < b.day ? -1 : a.day > b.day ? 1 : 0));
}

/** The most recent weigh-in on or before a day. null when none exists yet. */
export function latestWeighIn(entries, onOrBeforeDay = null) {
  const sorted = sortWeighIns(entries);
  const eligible = onOrBeforeDay ? sorted.filter((e) => e.day <= onOrBeforeDay) : sorted;
  return eligible.length ? eligible[eligible.length - 1] : null;
}

/** The weigh-in recorded within a given program week, if any (the last one). */
export function weighInForWeek(program, entries, week) {
  const range = weekRange(program, week);
  if (!range) return null;
  const inWeek = sortWeighIns(entries).filter((e) => e.day >= range.from && e.day <= range.to);
  return inWeek.length ? inWeek[inWeek.length - 1] : null;
}

// ── the dashboard reading ────────────────────────────────────────────────────

/**
 * Everything the dashboard shows, in one honest object. Every ACTUAL field is
 * null when the user has not recorded the thing yet -- never 0, never the
 * planned value standing in for a real one (DR-0076: a painted number on a
 * trust-bearing surface is worse than none).
 */
export function programProgress(program, weighIns, todayKey) {
  const start = Number(program?.startWeightLb) || 0;
  const goal = Number(program?.goalWeightLb) || 0;
  const week = weekForDay(program, todayKey);
  const latest = latestWeighIn(weighIns, todayKey);
  const current = latest ? Number(latest.weightLb) : null;

  const totalToLose = round1(start - goal);
  const actualRunningLoss = current == null ? null : round1(start - current);
  const remaining = current == null ? null : round1(current - goal);

  // Percent of the goal covered so far. Clamped to 0..100 for the progress bar;
  // a gain reads 0% rather than a negative bar, and the real numbers stay visible
  // beside it. null while there is no weigh-in at all.
  const pctComplete = actualRunningLoss == null || totalToLose <= 0
    ? null
    : clamp(round1((actualRunningLoss / totalToLose) * 100), 0, 100);

  const inProgram = week >= 1 && week <= (program?.weeks || 0);
  const targetWeight = inProgram ? targetWeightFor(program, week) : null;
  const targetLoss = inProgram ? targetRunningLoss(program, week) : null;

  return {
    week,
    inProgram,
    startWeightLb: start,
    goalWeightLb: goal,
    totalToLoseLb: totalToLose,
    currentWeightLb: current,
    latestWeighInDay: latest ? latest.day : null,
    targetWeightLb: targetWeight,
    targetRunningLossLb: targetLoss,
    actualRunningLossLb: actualRunningLoss,
    remainingLb: remaining,
    pctComplete,
    // Positive = above this week's target, negative = below it. null when either
    // side is missing. The SIGN is data; the WORDS come from deltaPhrase().
    deltaFromTargetLb: (current == null || targetWeight == null)
      ? null
      : round1(current - targetWeight),
  };
}

/**
 * The ONE place a difference from target becomes words.
 *
 * Darrell: 'Do NOT shame the user for being above target. Use neutral language
 * such as "2.4 lb from this week's target" rather than "You are behind."'
 * Every surface calls this instead of composing its own sentence, so the rule
 * holds in one place and is pinned by one test.
 */
export function deltaPhrase(deltaLb) {
  if (deltaLb == null || !Number.isFinite(deltaLb)) return null;
  const d = round1(Math.abs(deltaLb));
  if (d === 0) return 'On this week’s target';
  return `${d} lb from this week’s target`;
}

// ── water (ACTUAL vs GOAL) ───────────────────────────────────────────────────

/**
 * Water actually drunk on a day. Entries are timestamped and never deleted by a
 * day rollover -- "reset the daily total automatically at the beginning of each
 * new day while preserving historical entries" is achieved by FILTERING history
 * per day, not by clearing anything.
 */
export function waterTotalFor(entries, dayKey) {
  return (entries || [])
    .filter((e) => e && e.day === dayKey && isRecordedNumber(e.oz))
    .reduce((sum, e) => sum + Number(e.oz), 0);
}

/** Water reading for a day: actual vs the program's goal. */
export function waterProgress(program, entries, dayKey) {
  const goal = Number(program?.waterGoalOz) || 0;
  const actual = waterTotalFor(entries, dayKey);
  return {
    goalOz: goal,
    actualOz: actual,
    remainingOz: Math.max(0, round1(goal - actual)),
    pct: goal > 0 ? clamp(round1((actual / goal) * 100), 0, 100) : null,
    met: goal > 0 && actual >= goal,
  };
}

// ── the roadmap (for the graph + the weeks list) ──────────────────────────────

/**
 * Every week of the program with its PLANNED target beside the ACTUAL weigh-in
 * (null where none was recorded). This is the graph's data and the week list's
 * data -- one derivation, so the two can never disagree.
 */
export function roadmap(program, weighIns) {
  const prevActual = { value: null };
  return (program?.weeklyTargets || []).map((row) => {
    const entry = weighInForWeek(program, weighIns, row.week);
    const actual = entry ? Number(entry.weightLb) : null;
    const range = weekRange(program, row.week);
    const weeklyChange = (actual != null && prevActual.value != null)
      ? round1(actual - prevActual.value)
      : null;
    if (actual != null) prevActual.value = actual;
    return {
      week: row.week,
      from: range ? range.from : null,
      to: range ? range.to : null,
      targetWeightLb: row.targetWeightLb,
      actualWeightLb: actual,
      weighInDay: entry ? entry.day : null,
      targetRunningLossLb: targetRunningLoss(program, row.week),
      actualRunningLossLb: actual == null ? null : round1((program.startWeightLb || 0) - actual),
      weeklyChangeLb: weeklyChange,
      deltaFromTargetLb: actual == null ? null : round1(actual - row.targetWeightLb),
    };
  });
}

// ── helpers ──────────────────────────────────────────────────────────────────

export function round1(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return null;
  // Nudge off the binary-float boundary so 0.15 -> 0.2, not 0.1.
  return Math.round((v + Number.EPSILON) * 10) / 10;
}

function clamp(n, lo, hi) {
  return Math.min(hi, Math.max(lo, n));
}

// canSeeHealthTab — should the nav show the program tab at all?
//
// The DOOR, not the data. 0162 already scopes every row to created_by =
// auth.uid(), so no one can read another person's weigh-ins. That is not the
// same question as whether the tab belongs in their nav: an ungated entry puts
// "Road to 150" in front of every signed-in user -- church members, COLG,
// self-serve -- as a weight-loss tab that is not theirs and never will be.
//
// So the tab is EARNED BY REAL STATE, the same enrollment the surface itself
// renders (DR-0061 -- a surface is a live view of real state, and its entry
// point should be too): a steward, who can start a program, or anyone actually
// enrolled in one. That generalises unchanged to the brief's admin-creates-
// programs-for-other-users future -- their tab appears when their program does,
// with no gate to rewrite.
export function canSeeHealthTab(isSteward, programs) {
  if (isSteward) return true;
  return (programs || []).some((p) => p && p.active !== false);
}
