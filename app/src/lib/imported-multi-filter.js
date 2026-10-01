// =============================================================================
// imported-multi-filter — pick several account / category chips at once
// =============================================================================
// Darrell, 2026-09-30, on Books → Imported filtered to "Mortgage": "want to be
// able to choose multiple tabs and they add to the bottom together or
// separately... like mortgage and Mortgage 2111... currently I can only see them
// individually." (DR-0713)
//
// The rules, in one place and pure so they are pinned by a test:
//   · Within ONE chip row the picks combine as OR  (Mortgage OR Mortgage 2111).
//   · ACROSS rows they combine as AND              (these accounts AND these categories).
//   · An empty pick list means "all" for that row (the "All …" chip clears it).
//   · "Together" is one list with one set of totals. "Separately" cuts the SAME
//     rows into one section per picked chip. A row carries one category and one
//     account, so the sections partition the rows and their subtotals add up to
//     the Together total exactly. Categories split first when both rows hold
//     two or more picks; the account picks still filter every section.
//   · The selection is remembered per device (localStorage, fail-soft) and
//     written to the address bar so it can be bookmarked or shared.
// =============================================================================

/** Normalize a pick value (legacy single string, array, or nothing) to a clean list. */
export function normalizePicks(v) {
  if (Array.isArray(v)) return [...new Set(v.filter((x) => typeof x === 'string' && x))];
  if (typeof v === 'string' && v) return [v];
  return [];
}

/** Tap a chip: add it if absent, remove it if present. Returns a new list. */
export function togglePick(list, value) {
  const cur = normalizePicks(list);
  return cur.includes(value) ? cur.filter((x) => x !== value) : [...cur, value];
}

/** OR within a row, AND across rows. `row` is an imported-view row. */
export function rowMatchesPicks(row, { institutions, categories } = {}) {
  const accts = normalizePicks(institutions);
  const cats = normalizePicks(categories);
  if (accts.length && !accts.includes(row.institution)) return false;
  if (cats.length && !cats.includes(row.category || '')) return false;
  return true;
}

/**
 * Which row the Separately view splits on: 'category' when two or more
 * categories are picked, else 'account' when two or more accounts are, else
 * null (nothing to separate; Separately then reads the same as Together).
 */
export function splitDimension({ institutions, categories } = {}) {
  if (normalizePicks(categories).length >= 2) return 'category';
  if (normalizePicks(institutions).length >= 2) return 'account';
  return null;
}

/**
 * Cut `rows` into one section per picked chip on the split dimension, in the
 * order the chips were picked. Rows are assumed already filtered by the picks,
 * so every row lands in exactly one section.
 */
export function splitSections(rows, picks, labelFor = (_, v) => v) {
  const dim = splitDimension(picks);
  if (!dim) return [{ key: 'all', dim: null, value: null, label: 'All picks', rows: rows || [] }];
  const values = dim === 'category' ? normalizePicks(picks.categories) : normalizePicks(picks.institutions);
  const keyOf = dim === 'category' ? (r) => r.category || '' : (r) => r.institution;
  const buckets = new Map(values.map((v) => [v, []]));
  for (const r of rows || []) {
    const b = buckets.get(keyOf(r));
    if (b) b.push(r);
  }
  return values.map((v) => ({ key: `${dim}:${v}`, dim, value: v, label: labelFor(dim, v), rows: buckets.get(v) }));
}

// --- the address bar -----------------------------------------------------------
// Short, readable params. Values are joined with "|" (a category key or an
// account name never carries one) and URLSearchParams handles the escaping.
export const URL_PARAMS = { accounts: 'iacct', categories: 'icat', layout: 'ilayout' };
const SEP = '|';

/** Read picks + layout from a query string. Returns null when none are present. */
export function picksFromSearch(search) {
  let sp;
  try { sp = new URLSearchParams(search || ''); } catch { return null; }
  const has = Object.values(URL_PARAMS).some((k) => sp.has(k));
  if (!has) return null;
  const split = (k) => normalizePicks((sp.get(k) || '').split(SEP));
  return {
    institutions: split(URL_PARAMS.accounts),
    categories: split(URL_PARAMS.categories),
    layout: sp.get(URL_PARAMS.layout) === 'separate' ? 'separate' : 'together',
  };
}

/** Write picks + layout into a query string, keeping every other param. */
export function searchWithPicks(search, { institutions, categories, layout } = {}) {
  let sp;
  try { sp = new URLSearchParams(search || ''); } catch { sp = new URLSearchParams(); }
  const set = (k, list) => { const l = normalizePicks(list); if (l.length) sp.set(k, l.join(SEP)); else sp.delete(k); };
  set(URL_PARAMS.accounts, institutions);
  set(URL_PARAMS.categories, categories);
  if (layout === 'separate') sp.set(URL_PARAMS.layout, 'separate'); else sp.delete(URL_PARAMS.layout);
  const s = sp.toString();
  return s ? `?${s}` : '';
}

// --- this device -----------------------------------------------------------------
export const PICKS_STORAGE_KEY = 'poe-imported-picks';

export function loadStoredPicks(storage) {
  try {
    const st = storage || (typeof localStorage !== 'undefined' ? localStorage : null);
    const raw = st && st.getItem(PICKS_STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    return {
      institutions: normalizePicks(p.institutions),
      categories: normalizePicks(p.categories),
      layout: p.layout === 'separate' ? 'separate' : 'together',
    };
  } catch { return null; }
}

export function saveStoredPicks(picks, storage) {
  try {
    const st = storage || (typeof localStorage !== 'undefined' ? localStorage : null);
    if (!st) return;
    st.setItem(PICKS_STORAGE_KEY, JSON.stringify({
      institutions: normalizePicks(picks.institutions),
      categories: normalizePicks(picks.categories),
      layout: picks.layout === 'separate' ? 'separate' : 'together',
    }));
  } catch { /* private mode: the address bar still carries the selection */ }
}

/** First-load selection: the address bar wins (a shared link), then this device. */
export function initialPicks(search, storage) {
  return picksFromSearch(search) || loadStoredPicks(storage) || { institutions: [], categories: [], layout: 'together' };
}
