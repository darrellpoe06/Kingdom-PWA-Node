// =============================================================================
// food-lookup — ask a real nutrition database, never guess
// =============================================================================
// Darrell 2026-08-31: "I want it to find it from some data base online and give
// me the calories and protein in each food source I write."
//
// THE ONE RULE. This module returns a number ONLY when a database actually
// returned one. There is no fallback estimate, no "about 200 calories", no model
// guess. A lookup that fails returns found:false and the surface asks him to
// type it — which is a small annoyance, where a fabricated calorie count would
// silently corrupt a weight-loss log for weeks (DR-0076).
//
// WHY OPEN FOOD FACTS. It needs no API key, so nothing secret ships in a browser
// bundle, and it serves CORS, so the PWA can call it directly with no proxy. The
// trade is that it is strongest on branded/packaged items and thinner on generic
// ones — which is exactly why a miss must read as a miss rather than a zero.
//
// HONESTLY UNVERIFIED, AND SAID SO. The sandbox this was written in cannot reach
// any external host (the agent proxy refuses CONNECT with 403), so the LIVE
// endpoint was never called during development. The response HANDLING below is
// fully tested against recorded shapes, and every failure path — offline, HTTP
// error, malformed body, missing nutriments — resolves to found:false rather
// than throwing or inventing. First real use is the first live proof.
//
// Per 100 g is what the database returns; the caller decides the serving. We do
// NOT scale to a guessed portion size — "6 inch sandwich" is not 100 g and
// pretending otherwise would be inventing a number by arithmetic.
// =============================================================================

const ENDPOINT = 'https://world.openfoodfacts.org/cgi/search.pl';
const TIMEOUT_MS = 6000;

/** Pull calories + protein per 100 g out of one Open Food Facts product. */
export function readNutriments(product) {
  const n = (product && product.nutriments) || {};
  const kcal = n['energy-kcal_100g'] ?? n.energy_kcal_100g ?? null;
  const protein = n.proteins_100g ?? n.proteins ?? null;
  const num = (v) => (v == null || v === '' || !Number.isFinite(Number(v)) ? null : Math.round(Number(v) * 10) / 10);
  return { calories: num(kcal), proteinG: num(protein) };
}

/**
 * Turn an Open Food Facts search body into a result.
 * Exported separately from the fetch so the SHAPE handling is testable without
 * a network — the half that can be proven is proven.
 */
export function pickResult(body, query) {
  const products = (body && body.products) || [];
  for (const p of products) {
    const { calories, proteinG } = readNutriments(p);
    // A product with no usable number is not an answer. Keep looking.
    if (calories == null && proteinG == null) continue;
    return {
      found: true,
      query,
      name: (p.product_name || '').trim() || query,
      calories,
      proteinG,
      per: '100 g',
      source: 'Open Food Facts',
      sourceId: p.code || null,
    };
  }
  return { found: false, query, reason: products.length ? 'no-nutrition' : 'no-match', source: 'Open Food Facts' };
}

/**
 * Look one food up. Never throws, never invents.
 * @returns {Promise<{found:boolean, calories?:number|null, proteinG?:number|null, ...}>}
 */
export async function lookupFood(query, { fetchImpl = null, signal = null } = {}) {
  const q = String(query || '').trim();
  if (!q) return { found: false, query: q, reason: 'empty' };

  const doFetch = fetchImpl || (typeof fetch === 'function' ? fetch : null);
  if (!doFetch) return { found: false, query: q, reason: 'no-fetch' };

  const url = `${ENDPOINT}?search_terms=${encodeURIComponent(q)}`
    + '&search_simple=1&action=process&json=1&page_size=5'
    + '&fields=code,product_name,nutriments';

  // Own timeout so a hanging network cannot freeze the log behind it.
  const controller = typeof AbortController === 'function' ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), TIMEOUT_MS) : null;
  try {
    const res = await doFetch(url, { signal: signal || (controller ? controller.signal : undefined) });
    if (!res || !res.ok) return { found: false, query: q, reason: `http-${res ? res.status : 'none'}` };
    const body = await res.json();
    return pickResult(body, q);
  } catch (e) {
    // Offline, blocked, aborted, malformed JSON — all the same answer: we do not
    // know, so we say we do not know.
    return { found: false, query: q, reason: (e && e.name === 'AbortError') ? 'timeout' : 'unreachable' };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Look up only the items that are still unknown after the remembered library
 * has had its say. The library always wins — it is the person's own confirmed
 * value, and a stranger's database does not get to overwrite it.
 */
export async function fillUnknowns(resolved, opts = {}) {
  const out = [];
  for (const row of resolved || []) {
    if (!row || row.known) { out.push(row); continue; }
    const hit = await lookupFood(row.name, opts);
    out.push(hit.found
      ? { ...row, calories: hit.calories, proteinG: hit.proteinG,
          known: true, source: hit.source, per: hit.per, lookupName: hit.name }
      : { ...row, lookupFailed: hit.reason });
  }
  return out;
}
