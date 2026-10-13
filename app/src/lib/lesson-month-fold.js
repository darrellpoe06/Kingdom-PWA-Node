// =============================================================================
// lesson-month-fold — the months of a lesson list fold, each on its own, and
// the month you are in stays at the top of the scroll
// =============================================================================
// Darrell, 2026-10-01, with the Church > The Word list open on his phone:
// "Allow the months to be condensed to get to other months faster and to see
// the count of lessons each month if they are all collapsed... Allow them to
// work independently and depending on each section separate so all options
// are available." And: "keep the date and the count at the top of the scroll
// until the month is out of the picture and bring that month's data then keep
// it at the top."
//
// So: a month heading is a fold a person can close and open, one month at a
// time (or all at once), and a folded month still shows its count so the list
// reads as a table of contents. The heading itself is sticky inside the
// scrolling list (components/ChurchLearn.jsx), so the month you are reading
// stays pinned until the next month's heading pushes it off.
//
// WHAT THIS DOES NOT TOUCH. The Word's division headings in the "By the Word's
// divisions" order stay labels, never folds (Darrell 2026-09-24: "I do like
// the lessons sections say what they should be associated with... just felt
// locked out of the flow"). Only the MONTH headings fold.
//
// Pure over injected storage so a test needs no browser. Folds are remembered
// per course on this device, the same way the order pick is (lesson-order.js).

export const FOLD_STORE = 'poetech.lessonMonthFold.v1';

function safeStorage(storage) {
  if (storage) return storage;
  try { if (typeof window !== 'undefined' && window.localStorage) return window.localStorage; } catch { /* privacy mode */ }
  return null;
}

/** The month-heading keys of an item list (headings carry `heading.key`
 *  starting with "month-"). Division headings are never included. */
export function monthKeys(items) {
  const out = [];
  for (const it of Array.isArray(items) ? items : []) {
    if (it && it.heading && typeof it.heading.key === 'string' && it.heading.key.indexOf('month-') === 0 && !it.heading.lessons) out.push(it.heading.key);
  }
  return out;
}

/** The folded month keys remembered for a course on this device. */
export function rememberedFolds(courseKey, storage) {
  const st = safeStorage(storage);
  if (!st) return new Set();
  try {
    const all = JSON.parse(st.getItem(FOLD_STORE) || '{}');
    const v = all && typeof all === 'object' ? all[courseKey] : null;
    return new Set(Array.isArray(v) ? v.filter((k) => typeof k === 'string') : []);
  } catch { return new Set(); }
}

export function rememberFolds(courseKey, folded, storage) {
  const st = safeStorage(storage);
  if (!st) return;
  try {
    const all = JSON.parse(st.getItem(FOLD_STORE) || '{}');
    const next = all && typeof all === 'object' ? all : {};
    next[courseKey] = [...(folded || [])];
    st.setItem(FOLD_STORE, JSON.stringify(next));
  } catch { /* the fold holds for this visit only */ }
}

/** Toggle one month; returns a NEW set (state-friendly). */
export function toggleFold(folded, key) {
  const next = new Set(folded || []);
  if (next.has(key)) next.delete(key); else next.add(key);
  return next;
}

/** Every month folded (a table of contents), or none. */
export function foldAll(items) { return new Set(monthKeys(items)); }
export function openAll() { return new Set(); }

/** The rows to render: each month heading carries `folded`, and the lessons
 *  under a folded month are left out. Division headings pass through. */
export function visibleItems(items, folded) {
  const f = folded || new Set();
  const out = [];
  let hide = false;
  for (const it of Array.isArray(items) ? items : []) {
    if (it && it.heading) {
      const isMonth = typeof it.heading.key === 'string' && it.heading.key.indexOf('month-') === 0 && !it.heading.lessons;
      hide = isMonth && f.has(it.heading.key);
      out.push(isMonth ? { heading: { ...it.heading, folded: hide } } : it);
      continue;
    }
    if (!hide) out.push(it);
  }
  return out;
}

/** What the fold-all control should offer: when every month is folded, "Open
 *  all"; otherwise "Fold all". Null when the list has no months to fold. */
export function foldAllOffer(items, folded) {
  const keys = monthKeys(items);
  if (keys.length < 2) return null;
  const allFolded = keys.every((k) => folded && folded.has(k));
  return allFolded
    ? { action: 'open', label: `Open all ${keys.length} months` }
    : { action: 'fold', label: `Fold all ${keys.length} months` };
}
