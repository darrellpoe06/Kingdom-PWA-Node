// =============================================================================
// tv-where-to-watch — "where is this streaming?" for PoeTech TV Time (DR-1168).
//
// Darrell, 2026-10-21: "I want users to be able to connect their streaming
// platforms and the free ones YouTube channels explains... just an easy way to
// get it done through this tab."
//
// THE PREMISE WE DESIGNED AROUND, WITH ITS PROVENANCE MARKED.
//
// UNVERIFIED LEAD (not our measurement): that Netflix, Hulu, Max, Disney+ and
// Prime Video publish no consumer API for linking an account or reading a watch
// history. That was handed to this work as a premise and it is NOT something we
// confirmed — this build has no network route to any of those vendors (every
// host we tried answered CONNECT tunnel failed, response 403), so no claim about
// their API or embed policy is established fact here, and none should be repeated
// as one. If the lead is ever checked and proves wrong, that is a new capability
// to design, not a correction to this file's behaviour.
//
// WHAT WE ACTUALLY DID, which does not depend on the lead being true: we built
// nothing that needs an account on those services. A "Connect Netflix" button
// would be a control whose working we cannot demonstrate — a surface that looks
// finished and is not (DR-0381) — so it is not built, not stubbed, and nothing in
// this module's copy hints one is coming. What IS real, keyless and measured is
// the question the connect button was only ever a means to: WHERE IS IT ON.
//
// THE TWO HONEST LAYERS:
//
//   1. KNOWN — TVmaze records a `webChannel` for a show that streams: the real
//      streaming service, from a real provider response, keyless and already in
//      our pipeline. Until DR-1168, tv-catalog.js COLLAPSED webChannel into the
//      same string as `network` (the broadcaster), so "HBO" and "HBO Max" were
//      indistinguishable in the store and the value was rendered only as a grey
//      crumb in a `year · network · genre` join. The fact was in the data and
//      never on the surface. Now they are separate fields with separate meanings.
//
//   2. UNKNOWN — a title TVmaze has no webChannel for reads **unknown**, NEVER
//      "not available" (DR-0076: unknown is not a no). A broadcaster is reported
//      as a broadcaster; it is not promoted to a streaming claim it never made.
//
// AND, FOR EVERY TITLE EITHER WAY: a search route into each free ad-supported
// service, labeled as a SEARCH ("Look on Tubi"), never as availability. A search
// link makes no claim, so it cannot lie — and on a phone these are universal
// links, so the service's own app takes the tap when it is installed. That is the
// long tail the provider data will never cover.
//
// FREEVEE IS NOT IN THIS LIST, ON PURPOSE. Amazon shut Freevee down (announced
// November 2024, app offline by August 2025) and folded its catalogue into Prime
// Video under a "Watch for Free" label. Shipping a Freevee chip in October 2026
// would be a button to a service that no longer exists. Recorded in DR-1168.
//
// PURE. No I/O, no clock, no storage — every function here is a transform over
// arguments the caller supplies. The live lookup lives in tv-catalog.js
// (resolveWatch), the persistence in tv-time.js, the surface in TVTime.jsx.
// =============================================================================

// The free, ad-supported services a family can watch without paying anything.
//
// EVERY URL HERE WAS MEASURED, NONE WAS ASSUMED (DR-0076 §4). The cloud sandbox
// has no route to any of these hosts (CONNECT tunnel failed, response 403 on all
// of them), so a one-shot GitHub-runner probe fetched each candidate. Three
// rounds, and the probe earned its keep twice over — it caught a WRONG URL I had
// written from memory, and it killed a fourth service that no longer exists:
//
//   tubi   /search/<q>       200, and the page TITLE echoed the query, while a
//                            nonsense path on the same host 404s -> PROVEN
//   pluto  /en/search?q=<q>  200, body mentions the queried title, while a
//                            nonsense path served the home page -> PROVEN.
//                            NOTE: pluto's /en/search/<q> PATH form was my first
//                            guess and it SILENTLY IGNORES the query (it served
//                            the home page). The probe is the only reason that
//                            wrong URL is not in this file.
//   roku   (no search route) The Roku Channel is an old-style SPA: its home page
//                            is a 24KB shell with <meta name="fragment"> and
//                            ships NO /search href at all, so no search route
//                            could be verified. It gets a `browse` link to its
//                            verified home (200) instead of an invented search
//                            one — honest, still one tap to the free service.
//   freevee                  home 404s. Amazon announced Freevee's end in
//                            November 2024 and the app went offline by August
//                            2025, its catalogue folded into Prime Video under a
//                            "Watch for Free" label. NOT SHIPPED: in October 2026
//                            a Freevee chip is a button to a service that is gone.
//
// `kind` is how the surface labels the tap, and the distinction is the honesty:
//   'search' — this route really searches the service for the title.
//   'browse' — we could not verify a search route, so this opens the service and
//              the person searches there. The label says "Open", not "Look on".
// `search(q)` is still a function for both, so callers need no special case.
export const FREE_SERVICES = [
  {
    key: 'tubi',
    name: 'Tubi',
    kind: 'search',
    search: (q) => `https://tubitv.com/search/${encodeURIComponent(q)}`,
  },
  {
    key: 'pluto',
    name: 'Pluto TV',
    kind: 'search',
    // The `q` PARAM, never the path — measured.
    search: (q) => `https://pluto.tv/en/search?q=${encodeURIComponent(q)}`,
  },
  {
    key: 'roku',
    name: 'The Roku Channel',
    kind: 'browse',
    // The title is deliberately NOT interpolated: there is no verified route
    // that would honour it, and a url that pretends to carry a query it drops
    // is the quiet kind of lie this module exists to avoid.
    search: () => 'https://therokuchannel.roku.com/',
  },
];

const FREE_KEYS = new Set(FREE_SERVICES.map((s) => s.key));

// Service names, as a provider actually spells them, that ARE free + ad-supported.
// Used only to label a KNOWN webChannel as free — never to invent one. Compared
// on a normalized form so "Pluto TV", "pluto.tv" and "PlutoTV" all land.
const FREE_NAME_TO_KEY = {
  tubi: 'tubi',
  tubitv: 'tubi',
  plutotv: 'pluto',
  pluto: 'pluto',
  therokuchannel: 'roku',
  rokuchannel: 'roku',
  roku: 'roku',
  plex: 'plex',
  pluto_tv: 'pluto',
};

/** Pure. Fold a service name to a comparison key. */
export function serviceKey(name) {
  return String(name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Pure. Is this service name one of the free ad-supported ones? Returns the
 * FREE_SERVICES key, or '' when we do not know it to be free. An unrecognized
 * name is NOT called paid — it is simply not called free (DR-0076).
 */
export function freeServiceKeyFor(name) {
  return FREE_NAME_TO_KEY[serviceKey(name)] || '';
}

/**
 * Pure. The routes into every free service for one title. These are SEARCHES or
 * BROWSE links, never availability claims: a 'search' row opens that service's
 * own search for the title and the service answers; a 'browse' row opens the
 * service because no search route could be verified for it. Returns [] for a
 * blank title. Each row carries its `kind` so the surface can label the tap
 * truthfully rather than calling a browse link a search.
 */
export function freeSearchLinks(title) {
  const q = String(title || '').trim();
  if (!q) return [];
  return FREE_SERVICES.map((s) => ({
    key: s.key,
    name: s.name,
    kind: s.kind === 'search' ? 'search' : 'browse',
    url: s.search(q),
    free: true,
  }));
}

/**
 * Pure. The whole honest answer for one tracked item.
 *
 * `meta` is the stored catalog record (tv-time.js `custom[id]`): it may carry
 * `webChannel` (the streaming service, present once resolved), `network` (the
 * broadcaster or, on a store written before DR-1168, a COLLAPSED value whose
 * kind we cannot know), and `title`.
 *
 * Returns:
 *   {
 *     state: 'streaming' | 'broadcast-only' | 'unknown',
 *     service: ''|'Netflix',    // the streaming service, when known
 *     free: boolean,            // that service is free + ad-supported
 *     freeKey: ''|'tubi',       // its FREE_SERVICES key, when free
 *     network: ''|'HBO',        // the broadcaster, reported as a broadcaster
 *     resolvable: boolean,      // a live lookup could still answer this
 *     searches: [{key,name,url,free}],
 *     say: 'a sentence the surface can print verbatim',
 *   }
 *
 * THE RULE THIS ENCODES: `state` is 'unknown' whenever we have no streaming
 * answer. It is never 'none', never 'unavailable', and `say` never contains the
 * words "not available" — because we did not measure that, and a title we have
 * not checked is not a title that is gone.
 */
export function whereToWatch(meta) {
  const m = meta && typeof meta === 'object' ? meta : {};
  const title = String(m.title || '').trim();
  const service = String(m.webChannel || '').trim();
  const network = String(m.network || '').trim();
  const searches = freeSearchLinks(title);
  const freeKey = service ? freeServiceKeyFor(service) : '';

  if (service) {
    return {
      state: 'streaming',
      service,
      free: !!freeKey,
      freeKey,
      network,
      resolvable: false,
      searches,
      say: freeKey
        ? `Streaming free with ads on ${service}.`
        : `Streaming on ${service}.`,
    };
  }

  // No streaming answer. If a broadcaster is recorded AND the store is new
  // enough to have asked the streaming question separately, say so plainly:
  // this aired on a channel, and where it streams is a question we have not
  // answered yet. `hasOwnProperty` is the tell — a resolved record carries the
  // key even when the answer was empty.
  const asked = Object.prototype.hasOwnProperty.call(m, 'webChannel');
  if (network && asked) {
    return {
      state: 'broadcast-only',
      service: '',
      free: false,
      freeKey: '',
      network,
      resolvable: false,
      searches,
      say: `Aired on ${network}. Where it streams now is unknown — look on the free services below.`,
    };
  }

  // Not yet asked AND we have a title to ask about → a live lookup can answer it.
  const resolvable = !asked && !!title;
  return {
    state: 'unknown',
    service: '',
    free: false,
    freeKey: '',
    network,
    resolvable,
    searches,
    // The sentence is keyed to `resolvable`, not to `asked`: a record with no
    // title is un-asked but un-askable, and promising "until we check" beside no
    // check button would be a small untruth of exactly the kind this module is
    // for. Only a row that really offers the lookup says it is coming.
    say: resolvable
      ? 'Where this streams is unknown until we check.'
      : 'Where this streams is unknown — look on the free services below.',
  };
}

/**
 * Pure. Count how many tracked items have a KNOWN streaming answer, how many
 * are still unknown, and how many of the known ones are free. Drives the honest
 * header on the panel ("12 of 40 checked") — a measured number, never a painted
 * one (DR-0076 §4).
 */
export function watchCoverage(metas) {
  const rows = Array.isArray(metas) ? metas : [];
  let known = 0; let free = 0; let unknown = 0;
  for (const m of rows) {
    const w = whereToWatch(m);
    if (w.state === 'streaming') { known += 1; if (w.free) free += 1; } else unknown += 1;
  }
  return { total: rows.length, known, free, unknown };
}

/** Pure. Is `key` one of the free services we ship a route for? */
export function isFreeServiceKey(key) {
  return FREE_KEYS.has(String(key || ''));
}
