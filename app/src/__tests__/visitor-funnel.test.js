// @vitest-environment node
// =============================================================================
// The visitor stage DR-0008 decided and nobody built (DR-1070)
// =============================================================================
// Darrell, 2026-10-16: "Can we use Google Analytics to analyze our apps or build
// our own? Opportunities and constraints... DRs based..."
//
// The cases below are weighted at the ways an analytics surface LIES, which is
// a different list from the ways it is merely wrong:
//   1. CALLING REQUESTS PEOPLE. Cloudflare counts requests; a reload is two.
//   2. INVENTING A JOIN. Paths and agents are separate aggregations, so "human
//      visits to the church door" is a number the data cannot support.
//   3. SHOWING ZERO WHEN THE ANSWER IS UNKNOWN (DR-1053's whole lesson).
//   4. COUNTING THE APP'S OWN PLUMBING as if it were somebody arriving.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DOORS, doorOf, doorTraffic, trafficMix, doorFunnel, funnelUnavailable,
  REQUESTS_ARE_NOT_PEOPLE, BOT_SHARE_IS_SITE_WIDE, NOTHING_IS_COLLECTED,
} from '../lib/visitor-funnel.js';
import { agentKind } from '../lib/edge-guard.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = (p) => readFileSync(join(HERE, '..', p), 'utf8');

describe('NOTHING NEW IS COLLECTED — the whole design, asserted', () => {
  it('the module neither fetches, stores, nor imports a client', () => {
    // If this ever gains a write, the covenant sentence members SIGN is the
    // thing at stake: "never sold, never sent to an employer, a lender or an
    // advertiser" (DR-1064). The cheapest guard is that this file stays pure.
    const mod = src('lib/visitor-funnel.js');
    expect(mod).not.toMatch(/from '\.\/supabase\.js'/);
    expect(mod).not.toMatch(/\.insert\(|\.upsert\(|fetch\(|localStorage|document\./);
    expect(mod, 'a clock makes a pure function untestable').not.toMatch(/Date\.now\(|new Date\(/);
  });

  it('no third-party analytics is reachable from the app at all', () => {
    // The measurement that opened this record: zero trackers today. If one is
    // ever pasted into the shell or the page, this is what says so.
    //
    // COMMENTS STRIPPED: this module's own header NAMES the trackers that do
    // not exist, and the first version of this check matched that prose --
    // the third self-match this week (unknown-is-not-a-no-guard, DR-1060's
    // #B01E1E, now this). A check that fails on its own documentation is
    // unkeepable, so it reads the CODE.
    const strip = (t) => t.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');
    for (const f of ['poe-financial-mvp-v28.jsx', 'lib/visitor-funnel.js']) {
      const code = strip(src(f));
      expect(code, `${f}: the stripper blanked the file`).toMatch(/\w/);
      expect(code).not.toMatch(/googletagmanager|gtag\(|google-analytics|GA_MEASUREMENT|posthog|mixpanel|segment\.io|amplitude/i);
    }
  });
});

describe('a request is not a person, and the surface must say so', () => {
  it('the limits are sentences, not a comment nobody renders', () => {
    expect(REQUESTS_ARE_NOT_PEOPLE).toMatch(/not people/i);
    expect(REQUESTS_ARE_NOT_PEOPLE).toMatch(/reloading twice counts twice/i);
    expect(BOT_SHARE_IS_SITE_WIDE).toMatch(/whole site/i);
    expect(NOTHING_IS_COLLECTED).toMatch(/No tracker, no cookie, no beacon/i);
  });

  it('every funnel carries its limits with it', () => {
    const f = doorFunnel('lovecorner', { traffic: [{ path: '/lovecorner', count: 10 }] });
    expect(f.limits).toContain(REQUESTS_ARE_NOT_PEOPLE);
    expect(f.limits).toContain(NOTHING_IS_COLLECTED);
  });

  it('it never divides requests by people to invent a conversion rate', () => {
    const f = doorFunnel('lovecorner', { traffic: [{ path: '/lovecorner', count: 100 }], members: 4 });
    expect(f.requests).toBe(100);
    expect(f.members).toBe(4);
    expect(Object.keys(f)).not.toContain('rate');
    expect(Object.keys(f)).not.toContain('conversion');
    expect(f.note).toMatch(/100 requests at the door; 4 signed in/);
  });
});

describe('doorOf — who arrived where', () => {
  it('sends each public path to its own door', () => {
    expect(doorOf('/lovecorner')).toBe('lovecorner');
    expect(doorOf('/lovecorner/give')).toBe('lovecorner');
    expect(doorOf('/colg')).toBe('lovecorner');
    expect(doorOf('/tlc')).toBe('tlc');
    expect(doorOf('/therapy/intake')).toBe('tlc');
    expect(doorOf('/properties/moore')).toBe('properties');
    expect(doorOf('/')).toBe('poetech');
  });

  it('THE APP LOADING ITSELF IS NOT SOMEBODY ARRIVING', () => {
    // Counting /assets and the service worker as visits would inflate every
    // door by the size of the bundle, which is the most flattering lie an
    // analytics surface can tell.
    for (const p of ['/assets/index-abc.js', '/sw.js', '/manifest.webmanifest', '/favicon.ico',
      '/icons/192.png', '/edge/traffic', '/sb/auth/v1/token', '/robots.txt']) {
      expect(doorOf(p), `${p} was counted as an arrival`).toBe(null);
    }
  });

  it('nonsense is not a door', () => {
    for (const p of ['', null, undefined, 'lovecorner', 'https://elsewhere/x']) {
      expect(doorOf(p)).toBe(null);
    }
  });

  it('a longer prefix wins over the catch-all', () => {
    // '/' is last in DOORS on purpose; if it were first it would swallow /tlc.
    expect(DOORS[DOORS.length - 1].prefixes).toContain('/');
    expect(doorOf('/tlc')).not.toBe('poetech');
  });
});

describe('doorTraffic — the arrival count per door', () => {
  const paths = [
    { path: '/lovecorner', count: 120 },
    { path: '/lovecorner/give', count: 30 },
    { path: '/tlc', count: 45 },
    { path: '/', count: 60 },
    { path: '/assets/index-abc.js', count: 9000 },   // plumbing, must not count
    { path: '/sw.js', count: 400 },
  ];

  it('adds a door’s own paths together and keeps plumbing out', () => {
    const { doors, plumbing } = doorTraffic(paths);
    const by = Object.fromEntries(doors.map((d) => [d.id, d.requests]));
    expect(by.lovecorner).toBe(150);
    expect(by.tlc).toBe(45);
    expect(by.poetech).toBe(60);
    expect(plumbing, 'the bundle leaked into a door').toBe(9400);
  });

  it('every door is listed even at zero, biggest first', () => {
    const { doors } = doorTraffic(paths);
    expect(doors.map((d) => d.id)).toEqual(['lovecorner', 'poetech', 'tlc', 'properties']);
    expect(doors.find((d) => d.id === 'properties').requests).toBe(0);
  });

  it('an empty read is zeros, not a crash', () => {
    expect(doorTraffic([]).doors.every((d) => d.requests === 0)).toBe(true);
    expect(doorTraffic().plumbing).toBe(0);
  });
});

describe('botShare — and the join it refuses to invent', () => {
  it('uses the Edge Guard’s OWN classifier, and keeps ITS distinctions', () => {
    // agentKind is more precise than "bot or not": Googlebot is 'a search
    // engine', GPTBot is 'an AI crawler', curl is 'our witness'. My first
    // version tested the KIND string for /bot|script/ and so counted a search
    // engine as a person. The classifier was right; the bucket was wrong.
    const agents = [
      { agent: 'Mozilla/5.0 (Linux; Android 10; K) Chrome/155', count: 70 },
      { agent: 'python-requests/2.31', count: 20 },
      { agent: 'Googlebot/2.1', count: 10 },
      { agent: 'GPTBot/1.0', count: 5 },
      { agent: 'curl/8.5.0', count: 40 },
    ];
    const m = trafficMix(agents, agentKind);
    expect(m.total).toBe(145);
    expect(m.browser, 'a search engine or crawler was counted as a person').toBe(70);
    expect(m.nonHuman).toBe(35);          // python-requests + Googlebot + GPTBot
    expect(m.ourWitness, 'our own probes inflated the visitor count').toBe(40);
    expect(m.unknown).toBe(0);
  });

  it('OUR OWN WITNESSES ARE NEVER VISITORS — site-health hits the site forever', () => {
    const m = trafficMix([{ agent: 'curl/8.5.0', count: 999 }], agentKind);
    expect(m.browser).toBe(0);
    expect(m.ourWitness).toBe(999);
  });

  it('unknown is its own bucket, never folded into either side', () => {
    const m = trafficMix([{ agent: '', count: 7 }], agentKind);
    expect(m.unknown).toBe(7);
    expect(m.browser).toBe(0);
    expect(m.nonHuman).toBe(0);
  });

  it('THE SHARE IS SITE-WIDE AND SAYS SO — there is no per-door bot number', () => {
    // Cloudflare returns paths and agents as independent aggregations. A
    // "human visits to the church door" figure would be a fabricated join.
    expect(BOT_SHARE_IS_SITE_WIDE).toMatch(/cannot be split per door/i);
    const f = doorFunnel('lovecorner', { traffic: [{ path: '/lovecorner', count: 10 }] });
    expect(Object.keys(f)).not.toContain('bots');
    expect(Object.keys(f)).not.toContain('humans');
  });

  it('no agents is an honest zero, not a divide by zero', () => {
    expect(trafficMix([], agentKind)).toEqual({ browser: 0, ourWitness: 0, nonHuman: 0, unknown: 0, total: 0 });
  });
});

describe('unknown is not zero (DR-1053, applied here)', () => {
  it('a refused edge road produces a sentence, never a 0', () => {
    const msg = funnelUnavailable({ ok: false, reason: 'no-road', message: 'The Edge Guard road is not open on this site yet.' });
    expect(msg).toMatch(/not open on this site yet/);
  });

  it('a road that answered produces no excuse', () => {
    expect(funnelUnavailable({ ok: true })).toBe('');
    expect(funnelUnavailable(null)).toBe('');
  });

  it('a door with no member figure says so instead of printing 0', () => {
    const f = doorFunnel('tlc', { traffic: [{ path: '/tlc', count: 12 }] });
    expect(f.members, 'absent members rendered as zero').toBe(null);
    expect(f.note).toMatch(/not available for this door yet/);
  });

  it('an unknown door is null, not an empty funnel that looks real', () => {
    expect(doorFunnel('nope', { traffic: [] })).toBe(null);
  });
});
