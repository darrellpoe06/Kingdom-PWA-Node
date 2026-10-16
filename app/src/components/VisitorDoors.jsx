// =============================================================================
// VisitorDoors — the visitor stage, on the screen a steward actually reads
// =============================================================================
// DR-1070 derived the visitor stage from Cloudflare's own records and shipped it
// as a pure library with nobody looking at it. A number nobody can see is not a
// measurement, so this is the surface half (DR-0061 reality-trace step 3: the
// surface the user actually uses).
//
// REALITY-TRACE, before the code:
//   1. REAL DATA — `getTraffic(24)` on the app's own /edge road (DR-1067), which
//      returns what Cloudflare recorded while serving the site: `paths` and
//      `agents` as two independent aggregations. Nothing here is collected by
//      us: no tracker, no cookie, no beacon, no new row about anybody.
//   2. END TO END — the same road the Bots & blocks chip beside this one already
//      reads live in the signed-in app, not a demo path.
//   3. THE SURFACE — Admin → Users & usage, as a chip in the third row of tabs,
//      beside "Bots & blocks" and "What's used". The visitor side belongs next
//      to the signed-in side; it is the stage BEFORE it.
//   4. ASSUMPTION STATED — paths and agents cannot be joined, so the mix is
//      SITE-WIDE and is never drawn per door. doorFunnel()'s member side is not
//      used here: `usage_events` is not aggregated per door, and inventing that
//      split would be the painted number DR-0061 forbids.
//
// Every number on this screen comes from the payload. The limits are rendered
// from the library's own strings rather than retyped, so the words on the screen
// cannot drift from the words the library is tested against.
import React, { useState, useEffect, useCallback } from 'react';
import { getTraffic, agentKind, compactCount } from '../lib/edge-guard.js';
import {
  doorTraffic, trafficMix, funnelUnavailable,
  REQUESTS_ARE_NOT_PEOPLE, BOT_SHARE_IS_SITE_WIDE, NOTHING_IS_COLLECTED,
} from '../lib/visitor-funnel.js';

const sectionH = 'text-[0.625rem] uppercase tracking-[0.25em] text-[#5A5751] font-semibold';
const note = 'text-[0.6875rem] text-[#5A5751] leading-relaxed';
// A keyboard user has to be able to see where they are. Same ring the Edge
// Guard beside this surface uses, so the two chips feel like one thing.
const RING = 'focus:outline focus:outline-2 focus:outline-[#B85838]';

/** One door's bar. `share` is of the doors' own total, never of all requests. */
function DoorRow({ label, requests, share }) {
  return (
    <div className="px-2.5 py-1.5">
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="text-[0.8125rem] text-[#1A1815] truncate">{label}</span>
        <span className="text-[0.6875rem] text-[#5A5751] shrink-0">{compactCount(requests)} requests</span>
      </div>
      <div className="h-2 border border-[#E8E4DC]" aria-hidden="true">
        <div className="h-full bg-[#5A6E3D]" style={{ width: `${Math.round(share * 100)}%` }} />
      </div>
    </div>
  );
}

/** The site-wide mix. Four buckets, because our own witnesses are not visitors. */
function MixRow({ mix }) {
  if (!mix || !mix.total) return null;
  const pct = (n) => `${Math.round((n / mix.total) * 100)}%`;
  const parts = [
    ['Browsers', mix.browser, 'plausibly people — a ceiling, never a headcount'],
    ['Our own witnesses', mix.ourWitness, 'site-health and the runners that watch the site for us'],
    ['Crawlers, scripts, AI', mix.nonHuman, 'search engines, AI crawlers, headless browsers, scripts'],
    ['Unknown', mix.unknown, 'the agent did not say — counted on neither side'],
  ];
  return (
    <div className="border border-[#E8E4DC] divide-y divide-[#F2EEE6]" data-testid="visitor-mix">
      {parts.map(([label, n, why]) => (
        <div key={label} className="px-2.5 py-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[0.8125rem] text-[#1A1815]">{label}</span>
            <span className="text-[0.6875rem] text-[#5A5751] shrink-0">{compactCount(n)} · {pct(n)}</span>
          </div>
          <p className="text-[0.625rem] text-[#8A857C] leading-relaxed">{why}</p>
        </div>
      ))}
    </div>
  );
}

export default function VisitorDoors() {
  const [res, setRes] = useState(undefined);   // undefined loading, then the payload
  const load = useCallback(async () => {
    setRes(undefined);
    setRes(await getTraffic(24));
  }, []);
  useEffect(() => { load(); }, [load]);

  // UNKNOWN IS NEVER ZERO. If the edge road does not answer, the visitor side is
  // unknown and says so; drawing zeros would read as "nobody came" (DR-0076).
  const unavailable = res === undefined ? '' : funnelUnavailable(res);
  const paths = (res && Array.isArray(res.paths)) ? res.paths : [];
  const agents = (res && Array.isArray(res.agents)) ? res.agents : [];
  const { doors, plumbing } = doorTraffic(paths);
  const mix = trafficMix(agents, agentKind);
  const doorTotal = doors.reduce((a, d) => a + d.requests, 0);

  return (
    <div className="space-y-3" data-testid="visitor-doors">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className={sectionH}>At the doors — the last 24 hours</div>
        <button type="button" onClick={load} className={`text-[0.625rem] uppercase tracking-wider text-[#5A5751] underline-offset-2 hover:underline ${RING}`} data-testid="visitor-refresh">
          {res === undefined ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      <p className={note}>{NOTHING_IS_COLLECTED}</p>

      {res === undefined ? (
        <p className="text-xs text-[#5A5751]" aria-live="polite">Asking the edge…</p>
      ) : unavailable ? (
        <p className={note + ' italic'} data-testid="visitor-unavailable">{unavailable}</p>
      ) : doorTotal === 0 ? (
        <p className={note + ' italic'}>No requests reached a door in the last 24 hours. That is the edge’s own answer, not an empty table of ours.</p>
      ) : (
        <>
          <div className="border border-[#E8E4DC] divide-y divide-[#F2EEE6]" data-testid="visitor-door-list">
            {doors.map((d) => (
              <DoorRow key={d.id} label={d.label} requests={d.requests} share={doorTotal ? d.requests / doorTotal : 0} />
            ))}
          </div>
          <p className={note}>{REQUESTS_ARE_NOT_PEOPLE}</p>
          {plumbing > 0 && (
            <p className="text-[0.625rem] text-[#8A857C] leading-relaxed">
              {compactCount(plumbing)} more requests were the app loading itself — assets, the service worker, the /edge and /sb roads — and are left out of the doors above.
            </p>
          )}

          <div className={sectionH + ' pt-1'}>What made the requests — the whole site</div>
          <MixRow mix={mix} />
          <p className={note}>{BOT_SHARE_IS_SITE_WIDE}</p>
        </>
      )}
    </div>
  );
}
