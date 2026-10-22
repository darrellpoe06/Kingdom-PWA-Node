// =============================================================================
// /geocode?q=ADDRESS — where an address is, asked for only when a map is (DR-0977)
// =============================================================================
// Darrell, 2026-10-12: "Why would I ever need to add a Google maps link when
// you can do that as a standard for any address we add?!!!!!" and "I only want
// a map when I want it... don't want to spend time or data for the map if not
// required or requested."
//
// So nothing calls this until somebody taps "Show on map". It answers one
// point for one address, from:
//   1. the US Census Bureau geocoder (public, no key, no account), then
//   2. OpenStreetMap's Nominatim (public, no key; its policy asks for an
//      identifying User-Agent and light use, which one tap per map is),
// and says plainly when neither found it. Same-origin, so the page needs no
// new CSP host and the address goes to these two services and nowhere else.
// Every call to them is bounded by a timeout; a slow service is a "not found
// just now", never a hung screen.
// =============================================================================

export const CENSUS = 'https://geocoding.geo.census.gov/geocoder/locations/onelineaddress';
export const NOMINATIM = 'https://nominatim.openstreetmap.org/search';
export const UA = 'PoeTech-Properties/1.0 (+https://poetech.us)';
export const TIMEOUT_MS = 6000;

/** The address as it will be asked for, or '' when it is not one worth asking. */
export function cleanQuery(q) {
  const s = String(q || '').replace(/\s+/g, ' ').trim();
  if (s.length < 5 || s.length > 200 || !/[a-z]/i.test(s)) return '';
  return s;
}

const isPoint = (lat, lng) => Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 85 && Math.abs(lng) <= 180;

async function getJson(url, fetchImpl, timeoutMs, headers = {}) {
  const res = await fetchImpl(url, { headers: { accept: 'application/json', ...headers }, signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/** Census: result.addressMatches[0].coordinates is {x: longitude, y: latitude}. */
export function fromCensus(body) {
  const m = body?.result?.addressMatches?.[0];
  const lat = Number(m?.coordinates?.y); const lng = Number(m?.coordinates?.x);
  return isPoint(lat, lng) ? { lat, lng, matched: String(m.matchedAddress || ''), source: 'census' } : null;
}

/**
 * Nominatim: [{lat: "40.1", lon: "-88.2", display_name, address: {...}}].
 * With addressdetails the answer also carries its PARTS, so a door's address
 * can be completed from what was matched (DR-1209); without them it is a point.
 */
export function fromNominatim(body) {
  const m = Array.isArray(body) ? body[0] : null;
  const lat = Number(m?.lat); const lng = Number(m?.lon);
  if (!isPoint(lat, lng)) return null;
  const a = (m && m.address) || {};
  const parts = a.house_number && a.road
    ? { number: String(a.house_number), street: String(a.road), city: String(a.city || a.town || a.village || a.hamlet || ''), state: String(a.state || ''), zip: String(a.postcode || '') }
    : null;
  return { lat, lng, matched: String(m.display_name || ''), source: 'openstreetmap', ...(parts ? { parts } : {}) };
}

/** {ok:true, lat, lng, matched, source} or {ok:false, reason}. Never throws. */
export async function geocode(q, { fetchImpl = fetch, timeoutMs = TIMEOUT_MS } = {}) {
  const query = cleanQuery(q);
  if (!query) return { ok: false, reason: 'not an address' };
  const tried = [];
  try {
    const u = `${CENSUS}?${new URLSearchParams({ address: query, benchmark: 'Public_AR_Current', format: 'json' })}`;
    const hit = fromCensus(await getJson(u, fetchImpl, timeoutMs));
    if (hit) return { ok: true, ...hit };
    tried.push('census: no match');
  } catch (e) { tried.push(`census: ${e.message}`); }
  try {
    const u = `${NOMINATIM}?${new URLSearchParams({ q: query, format: 'jsonv2', limit: '1', countrycodes: 'us', addressdetails: '1' })}`;
    const hit = fromNominatim(await getJson(u, fetchImpl, timeoutMs, { 'user-agent': UA }));
    if (hit) return { ok: true, ...hit };
    tried.push('openstreetmap: no match');
  } catch (e) { tried.push(`openstreetmap: ${e.message}`); }
  return { ok: false, reason: tried.join('; ') };
}

/** The Response for a request URL; fetchImpl is the harness's seam. */
export async function geocodeResponse(requestUrl, fetchImpl = fetch) {
  const q = new URL(requestUrl).searchParams.get('q');
  const out = await geocode(q, { fetchImpl });
  return new Response(JSON.stringify(out), {
    status: out.ok ? 200 : (out.reason === 'not an address' ? 400 : 404),
    headers: {
      'content-type': 'application/json; charset=utf-8',
      // An address does not move: a found point is cached for a week.
      'cache-control': out.ok ? 'public, max-age=604800' : 'no-store',
    },
  });
}

export async function onRequestGet(context) {
  return geocodeResponse(context.request.url);
}
