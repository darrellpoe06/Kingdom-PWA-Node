// lib/format.js — shared display-formatting primitives (CORE).
//
// These currency/date formatters were defined inline in the monolith shell and
// used by it AND by feature surfaces (e.g. the booksView transactions table).
// Per DR-0078 §4.1 the design system + shared primitives are CORE: a feature
// must reuse them, never re-roll them and never reach back into the shell to get
// them (the boundary gate forbids importing the monolith). Lifting them into a
// core lib lets the shell and every feature module import the SAME formatter
// from one place — boundary-clean and consistent (one app, DR-0061).
//
// Pure functions, no side effects. Moved verbatim from the monolith (behavior
// pinned by the existing transaction/figure tests — characterize-before-change,
// DR-0076 §5).

// Whole-dollar currency, locale-grouped. `—` for null/non-finite.
export const fmt = (n) =>
  n == null || !isFinite(n) ? '—' : `${n < 0 ? '-' : ''}$${Math.abs(Math.round(n)).toLocaleString()}`;

// Compact currency (k / M / B) for tight cells. `—` for null/non-finite.
export const fmtCompact = (n) => {
  if (n == null || !isFinite(n)) return '—';
  const a = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (a >= 1000000000) return `${sign}$${(a / 1000000000).toFixed(2)}B`;
  if (a >= 1000000) return `${sign}$${(a / 1000000).toFixed(1)}M`;
  if (a >= 1000) return `${sign}$${Math.round(a / 1000)}k`;
  return `${sign}$${Math.round(a)}`;
};

export const MONTHS_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// "Mar '26"-style month label, `offset` months from `d`.
export function monthLabel(d, offset) {
  const x = new Date(d.getFullYear(), d.getMonth() + offset, 1);
  return `${MONTHS_ABBR[x.getMonth()]} '${String(x.getFullYear()).slice(2)}`;
}
