// =============================================================================
// daily-focus — Today's Focus and My Goals as REAL records
// =============================================================================
// Darrell 2026-09-17, relaying three home-view mockups from his wife Christina
// ("options she would like to see as views for the app"), and approving these
// two when the reality-trace found nothing behind them: every other tile in her
// views maps onto a feature that already exists, but "Today's Focus" and
// "MY GOALS" had NO record anywhere in the app — no todaysFocus, no dailyFocus,
// no focusItems, no goals. They would have shipped as invented checkboxes on
// the family's front screen, which is the painted-number defect DR-0061 exists
// to stop, on the surface where it would cost the most trust.
//
// WHY A LIB AND NOT INLINE IN THE HOST. The first version of this lived as five
// closures inside poe-financial-mvp-v28.jsx, next to addProject. That worked and
// was wrong twice over: it added logic to a 5,000-line file that already carries
// too much, and it could not be tested without rendering the whole application.
// As pure functions over the world object they are checkable directly, which is
// the only way the day-boundary rule below gets honestly proven.
//
// THEY RIDE THE SNAPSHOT, and that was VERIFIED rather than assumed:
// snapshot-sync.js:72 deletes the table-synced, private and photo keys and
// persists everything else, so a new collection on `data` is carried without a
// migration or a new table. Reading that mattered — a collection that silently
// fails to persist is this repository's own recurring injury (the lease-sync
// report: thirteen doors, zero rows, and nothing said a word).
//
// NO PAINTED PROGRESS. A goal here carries no typed percentage. A number a
// person types about their own progress is exactly as invented as the checklist
// this module exists to replace, so a goal shows no percentage until real linked
// work reports one. Saying nothing is honest; saying "60%" is not.

// THE COLLECTIONS ARE NOT DECLARED IN THE SHELL, and that is deliberate. The
// first version added `dailyFocus: []` and `goals: []` to EMPTY_WORLD with a
// comment, and the monolith-budget guard refused it: the shell is FROZEN to
// bug-fixes only (DR-0078 cutover) and new capability belongs in a module.
// The guard was right. Every reader below guards with `|| []`, and
// snapshot-sync persists whatever keys are present on `data`, so a collection
// created on its first write needs no declaration in a 5,355-line file that is
// trying to shrink. The world's shape for these two records is documented
// HERE, beside the logic, which is where a reader actually looks — the same
// trim the budget note documents a dozen times over.
export const DAILY_FOCUS_KEYS = ['dailyFocus', 'goals'];

/** The empty shape, for a caller that wants to seed or reset explicitly. */
export const EMPTY_FOCUS_WORLD = { dailyFocus: [], goals: [] };

const rid = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

/** The local calendar day, as YYYY-MM-DD. */
export function today(now = new Date()) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ---------------------------------------------------------------------------
// Today's Focus
// ---------------------------------------------------------------------------

/**
 * A new focus item, or null when there is nothing to write. An empty submit
 * must never mint a row — a blank intention on the front screen is worse than
 * an empty list, because it looks like the feature is broken.
 */
export function newFocusItem(text, now = new Date()) {
  const label = String(text == null ? '' : text).trim();
  if (!label) return null;
  return {
    id: rid('fo'),
    label,
    done: false,
    // THE DAY IT BELONGS TO. Without this, "Today's Focus" means "whatever is
    // still in the list", so yesterday's intentions quietly become today's and
    // the card lies by omission every morning. With it, the question has a real
    // answer and the past is kept rather than recycled.
    day: today(now),
    createdAt: now.toISOString(),
  };
}

export function addFocusItem(list, text, now = new Date()) {
  const item = newFocusItem(text, now);
  return item ? [...(list || []), item] : (list || []);
}

export function toggleFocusItem(list, id, now = new Date()) {
  return (list || []).map((f) => (f.id === id
    ? { ...f, done: !f.done, doneAt: f.done ? null : now.toISOString() }
    : f));
}

export function removeFocusItem(list, id) {
  return (list || []).filter((f) => f.id !== id);
}

/** Only the items belonging to the given day — the card's actual contents. */
export function focusForDay(list, day = today()) {
  return (list || []).filter((f) => f && f.day === day);
}

/**
 * Done and total FOR THAT DAY, measured from the rows. Never a stored count:
 * a tally kept beside the rows is a second source of truth and drifts from them
 * the first time a row is removed.
 */
export function focusProgress(list, day = today()) {
  const items = focusForDay(list, day);
  return { done: items.filter((f) => f.done).length, total: items.length };
}

/**
 * Yesterday's unfinished intentions, so they can be OFFERED rather than
 * silently carried. The person decides whether it is still today's business;
 * the app does not decide for them.
 */
export function unfinishedBefore(list, day = today()) {
  return (list || []).filter((f) => f && !f.done && f.day && f.day < day);
}

// ---------------------------------------------------------------------------
// My Goals
// ---------------------------------------------------------------------------

export function newGoal(input, now = new Date()) {
  const title = String((input && input.title) || '').trim();
  if (!title) return null;
  return {
    id: rid('go'),
    title,
    why: String((input && input.why) || '').trim(),
    targetDate: (input && input.targetDate) || null,
    status: (input && input.status) || 'open',
    createdAt: now.toISOString(),
  };
}

export function addGoal(list, input, now = new Date()) {
  const goal = newGoal(input, now);
  return goal ? [...(list || []), goal] : (list || []);
}

export function updateGoal(list, id, patch) {
  return (list || []).map((g) => (g.id === id ? { ...g, ...patch } : g));
}

export const GOAL_STATUSES = ['open', 'active', 'reached', 'released'];

/**
 * Days remaining until a goal's target, or null when it has none. Null is a
 * real answer and renders as nothing; a goal without a date must not be shown
 * an invented deadline.
 */
export function daysUntil(goal, now = new Date()) {
  if (!goal || !goal.targetDate) return null;
  const t = Date.parse(`${goal.targetDate}T00:00:00`);
  if (Number.isNaN(t)) return null;
  const start = Date.parse(`${today(now)}T00:00:00`);
  return Math.round((t - start) / 86400000);
}

/**
 * A goal's progress, and it is DELIBERATELY not a number of its own. It counts
 * only real linked work — focus items that name the goal — and returns null
 * when nothing links, so the surface shows no percentage rather than a
 * comfortable one.
 */
export function goalProgress(goal, focusList) {
  if (!goal) return null;
  const linked = (focusList || []).filter((f) => f && f.goalId === goal.id);
  if (!linked.length) return null;
  const done = linked.filter((f) => f.done).length;
  return { done, total: linked.length, pct: Math.round((done / linked.length) * 100) };
}
