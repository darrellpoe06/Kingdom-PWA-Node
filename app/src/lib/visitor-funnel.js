// =============================================================================
// visitor-funnel — the stage DR-0008 decided and nobody built (DR-1070)
// =============================================================================
// Darrell, 2026-10-16: "Can we use Google Analytics to analyze our apps or build
// our own? Opportunities and constraints... DRs based..."
//
// THE FIRST HALF IS ALREADY DECIDED, so this does not re-open it. DR-0008
// (2026-06-09, accepted): "self-hosted, privacy-respecting analytics (NOT
// Google Analytics) -- cookieless, data on the NAS -- per entity", grounded in
// NO-DATA-SALE, SOVEREIGN-FIRST and TLC-FIREWALL.
//
// WHAT WAS MEASURED, 2026-10-16:
//   * NO third-party tracker exists. index.html carries zero gtag / GA / Meta /
//     Segment / PostHog / Mixpanel. The one grep hit was `skill-analytics.js`.
//   * We DID build our own: 10 libs, usage_events on the sovereign Supabase,
//     governor-aggregate only, each person can delete their own trail (0073).
//   * DR-0008's named engines (Plausible / Umami / Matomo / GoatCounter) were
//     NEVER installed -- not in infra/, not a NAS rider.
//   * AND THE GAP: recordView() returns false with no session, so we count
//     MEMBERS and which tabs they open, and NOBODY who has not signed in.
//     DR-0008's funnel begins at "visitor"; the visitor stage never existed.
//     Four months open, nothing flagged it.
//
// WHY THIS COLLECTS NOTHING. The obvious build is a visitor table and a
// cookieless beacon. It is the wrong build, because the Edge Guard (DR-1067)
// already reads Cloudflare's OWN logs through the app's /edge road --
// getTraffic() returns paths, agents, networks, addresses and countries that
// Cloudflare records as the CDN whether we look or not. Deriving the funnel
// from that adds NO collection, NO beacon, NO cookie, NO new row about a
// person, and nothing of ours to leak. A table would have been a fourth place
// storing something about people who never signed anything.
//
// THAT MATTERS BEYOND TASTE. The covenant a member signs says the church's
// records are "never sold, never sent to an employer, a lender or an
// advertiser, never used to decide who is welcome, or ever used to train
// anything" (DR-1064). Google is an advertiser. And TLC is a therapy practice,
// where DR-0008 already binds ZERO PHI and no client-level tracking.
//
// EVERY FUNCTION HERE IS PURE. The caller passes the payload; nothing fetches,
// nothing stores, no clock of its own.

/**
 * The doors, by the path a visitor actually arrives on. Order matters: the
 * FIRST match wins, so a longer prefix is listed before a shorter one and '/'
 * is last or it would swallow everything.
 */
export const DOORS = Object.freeze([
  { id: 'lovecorner', label: 'The Love Corner', prefixes: ['/lovecorner', '/colg', '/church'] },
  { id: 'tlc', label: 'TLC Therapy Solutions', prefixes: ['/tlc', '/therapy'] },
  { id: 'properties', label: 'Poe Properties', prefixes: ['/properties', '/moore'] },
  { id: 'poetech', label: 'PoeTech (the family app)', prefixes: ['/'] },
]);

/** Paths that are the app loading itself, not a person arriving somewhere. */
const PLUMBING = /^\/(assets|icons|sw\.js|manifest|favicon|robots|apple-touch|_|edge|sb|n8n|api|taxes|voice|cams|nas-photos|openers|llm|reviews|ways|scribe)/i;

/** Pure. Which door does this path belong to? null when it is plumbing. */
export function doorOf(path) {
  const p = String(path || '').trim();
  if (!p || !p.startsWith('/')) return null;
  if (PLUMBING.test(p)) return null;
  for (const d of DOORS) {
    for (const prefix of d.prefixes) {
      if (prefix === '/') { if (p === '/' || !p.slice(1).includes('/')) return d.id; continue; }
      if (p === prefix || p.startsWith(`${prefix}/`) || p.startsWith(`${prefix}?`)) return d.id;
    }
  }
  return 'poetech';
}

/**
 * Pure. Cloudflare's path rows -> requests per door, plumbing excluded.
 *
 * @param {Array<{path: string, count: number}>} paths
 * @returns {Array<{id, label, requests}>} every door, newest-irrelevant, biggest first
 */
export function doorTraffic(paths = []) {
  const totals = Object.fromEntries(DOORS.map((d) => [d.id, 0]));
  let plumbing = 0;
  for (const row of paths) {
    const n = Number(row && row.count) || 0;
    const id = doorOf(row && row.path);
    if (!id) { plumbing += n; continue; }
    totals[id] += n;
  }
  const doors = DOORS.map((d) => ({ id: d.id, label: d.label, requests: totals[d.id] }))
    .sort((a, b) => b.requests - a.requests || a.id.localeCompare(b.id));
  return { doors, plumbing };
}

/**
 * Pure. Split the requests by WHAT MADE THEM, using the Edge Guard's own
 * agentKind so this file never grows a second, drifting idea of a bot.
 *
 * FOUR BUCKETS, not two, because agentKind is more precise than "bot or not"
 * and collapsing it would throw away the distinctions that matter:
 *   browser     — plausibly a person
 *   ourWitness  — curl from a GitHub runner, site-health, our own probes.
 *                 COUNTING OUR OWN INSTRUMENTS AS VISITORS is the most
 *                 flattering lie this surface could tell, and site-health
 *                 alone hits the site on a schedule forever.
 *   nonHuman    — a search engine, an AI crawler, a headless browser, a script
 *   unknown     — agentKind said so; it is NOT silently added to either side
 *
 * `browser` is a CEILING on people, never a headcount (REQUESTS_ARE_NOT_PEOPLE).
 */
export function trafficMix(agents = [], classify) {
  const kind = typeof classify === 'function' ? classify : () => 'unknown';
  const out = { browser: 0, ourWitness: 0, nonHuman: 0, unknown: 0, total: 0 };
  for (const row of agents) {
    const n = Number(row && row.count) || 0;
    out.total += n;
    const k = String(kind(row && row.agent) || 'unknown');
    if (/^our witness/i.test(k)) out.ourWitness += n;
    else if (/^a browser$/i.test(k)) out.browser += n;
    else if (/^unknown$/i.test(k)) out.unknown += n;
    else out.nonHuman += n;                 // search engine, AI crawler, headless, bot/script
  }
  return out;
}

// ---------------------------------------------------------------------------
// THE LIMITS, stated as values so a surface cannot render this as more than it is
// ---------------------------------------------------------------------------

/**
 * A REQUEST IS NOT A PERSON. Cloudflare counts requests: one visitor reloading
 * twice is two, a prefetch is one, and a service worker revalidating is one.
 * This number is a floor on attention and a ceiling on people, and it is never
 * labelled "visitors" on a surface.
 */
export const REQUESTS_ARE_NOT_PEOPLE =
  'Counted requests, not people. One person reloading twice counts twice, and a prefetch counts once — read it as interest, never as a headcount.';

/**
 * PATHS AND AGENTS ARE SEPARATE AGGREGATIONS. The Edge Guard asks Cloudflare
 * for the top paths and the top agents as two independent groupings, so there
 * is NO row saying "this agent hit this path". The bot share is therefore
 * site-wide and CANNOT be attributed to one door, and any surface that showed
 * "human visits to the church door" would be inventing a join that the data
 * does not contain.
 */
export const BOT_SHARE_IS_SITE_WIDE =
  'The bot share is for the whole site. Cloudflare returns paths and agents as separate lists, so it cannot be split per door without inventing a link that is not in the data.';

/** Nothing here is collected about anyone. Said on the surface, not just here. */
export const NOTHING_IS_COLLECTED =
  'Read from Cloudflare’s own records of serving the site. No tracker, no cookie, no beacon, and nothing stored by us about anyone who has not signed in.';

/**
 * Pure. The funnel for one door: arrival (from the edge) beside the members we
 * already count (from usage_events). Deliberately NOT a conversion rate --
 * dividing requests by people would be a fabricated number, and the two sides
 * are measured by different instruments over different windows.
 *
 * @returns {{door, label, requests, members, note, limits: string[]}}
 */
export function doorFunnel(doorId, { traffic = [], members = null } = {}) {
  const d = DOORS.find((x) => x.id === doorId);
  if (!d) return null;
  const row = doorTraffic(traffic).doors.find((x) => x.id === doorId);
  const requests = row ? row.requests : 0;
  const haveMembers = Number.isFinite(members);
  return {
    door: d.id,
    label: d.label,
    requests,
    members: haveMembers ? members : null,
    note: haveMembers
      ? `${requests} requests at the door; ${members} signed in and used the app.`
      : `${requests} requests at the door. The signed-in side is not available for this door yet.`,
    limits: [REQUESTS_ARE_NOT_PEOPLE, NOTHING_IS_COLLECTED],
  };
}

/** Pure. Is the edge road even answering? An honest empty beats a zero. */
export function funnelUnavailable(res) {
  if (res && res.ok === false) {
    return res.message || 'The edge road did not answer, so the visitor side is unknown — not zero.';
  }
  return '';
}
