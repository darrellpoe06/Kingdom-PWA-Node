// =============================================================================
// A 200 IS NOT AN ANSWER — ON ANY ROAD, NOT JUST THE ONE IT WAS MEASURED ON
// =============================================================================
// DR-1000 (2026-10-13) fixed ONE probe. Its own closing line said what it had
// not done, and set a date for it:
//
//   `re-review: 2026-10-20` — ... whether any OTHER sovereign surface's
//   readiness probe trusts a bare 200. This fix covers the one road it was
//   measured on; the same shape may sit on the other ten the outage listed.
//
// This file is that re-review, paid as a gate instead of a reading. Every
// same-origin sovereign road in this app is a Cloudflare Pages Function. When
// no Function runs — the outage open since 2026-10-09 (#2057), which
// site-health reports as "NO PAGES FUNCTION IS RUNNING" — the path falls
// through to the SPA and the browser is handed the app's own index.html:
// HTTP 200, content-type text/html. `resp.ok` is then TRUE on every road at
// once. A probe that reads only the status answers "ready" while the whole
// house is dark, which is the painted checkmark DR-0076 forbids.
//
// It is not a hypothetical on either side of the wire. Measured, recorded,
// twice already: GET /voice/health answered 200 with n8n's EDITOR PAGE for
// three days (voice-service.js:144-151), and Cloudflare's HTML 1016 page once
// streamed through the funnel proxy into supabase-js and printed itself as a
// profile status line (app/functions/_lib/funnel-proxy.js). Two different
// strangers, both answering 200 in the server's place.
//
// So the gate hands EVERY probe the two answers a stranger gives, and demands
// the same verdict from all of them: not ready. One fake response, nine
// probes, seven roads. A new sovereign road that trusts a bare 200 fails here
// before it ever reaches the live site.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { checkMediaService } from '../lib/media-backup.js';
import { CHAT_BRIDGE_TOKEN_KEY, fetchListingPhoto } from '../lib/nas-photos.js';
import { probeVoiceService, resetVoiceServiceHealthForTests } from '../lib/voice-service.js';
import { probeAvatarHealth } from '../lib/avatar-service.js';
import { fetchStreamHealth } from '../lib/cameras.js';
import { fetchWaysBrain } from '../lib/ways-brain.js';
import { askTutor } from '../lib/class-tutor.js';
import { analyzeSkills } from '../lib/skill-analytics.js';
import { nasOcr } from '../lib/books-intake-read.js';
import { MODULES } from '../lib/church-classes.js';

// The app's own shell, as the browser really receives it when no Function ran:
// a 200, text/html, and a `json()` that REJECTS the way the platform's does.
const SPA_SHELL = [
  '<!doctype html>',
  '<html lang="en"><head><meta charset="utf-8" /><title>PoeTech</title></head>',
  '<body><div id="root"></div><script type="module" src="/assets/index-A1b2C3.js"></script></body>',
  '</html>',
  '',
].join('\n');

function spaShell200() {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: { get: (h) => (/^content-type$/i.test(String(h)) ? 'text/html; charset=utf-8' : null) },
    text: async () => SPA_SHELL,
    json: async () => { throw new SyntaxError('Unexpected token \'<\', "<!doctype "... is not valid JSON'); },
    blob: async () => ({ size: SPA_SHELL.length, type: 'text/html' }),
  };
}

// The subtler stranger: a 200 whose body DOES parse as JSON, but which no
// sovereign server in this house ever wrote. The literal shape is the funnel
// proxy's own error body (funnel-proxy.js:98-105) — chosen because it exists
// in this repository rather than being imagined. The proxy sends it at 502,
// where `!resp.ok` already stops it; the point of the case is the probe's own
// guard, which must demand its server's shape and not merely "some JSON", so
// that the day any edge, cache or misrouted road hands this body back at 200
// the answer is still the truth.
function foreignJson200() {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: { get: (h) => (/^content-type$/i.test(String(h)) ? 'application/json' : null) },
    text: async () => '{"error":"ways proxy upstream unreachable"}',
    json: async () => ({ error: 'ways proxy upstream unreachable', detail: 'fetch failed' }),
    blob: async () => ({ size: 44, type: 'application/json' }),
  };
}

const TXNS = [
  { date: '2026-01-05', amount: 4200, description: 'ACME CORP PAYROLL' },
  { date: '2026-01-06', amount: -420, description: 'First Fruits tithe — Church' },
];

const realFetch = globalThis.fetch;
beforeEach(() => {
  try { localStorage.clear(); localStorage.setItem(CHAT_BRIDGE_TOKEN_KEY, 'family-key-for-the-test'); } catch { /* node env */ }
  resetVoiceServiceHealthForTests();
  import.meta.env.VITE_VOICE_SERVICE_URL = 'https://voice.example/';
  import.meta.env.VITE_AVATAR_SERVICE_URL = 'https://avatar.example/';
});
afterEach(() => {
  globalThis.fetch = realFetch;
  delete import.meta.env.VITE_VOICE_SERVICE_URL;
  delete import.meta.env.VITE_AVATAR_SERVICE_URL;
  resetVoiceServiceHealthForTests();
  vi.unstubAllGlobals();
});

// Every probe, with the road it rides and how it must report a stranger's
// answer. `run` is handed the fake response factory; each entry returns the
// ONE boolean this road's reader cares about: did the probe claim ready?
const PROBES = [
  {
    name: 'checkMediaService',
    road: '/nas-photos (the photo and video server)',
    async claimedReady(fake) {
      globalThis.fetch = async () => fake();
      return (await checkMediaService()) === 'ready';
    },
  },
  {
    name: 'fetchListingPhoto',
    road: '/nas-photos (one listing picture)',
    async claimedReady(fake) {
      globalThis.fetch = async () => fake();
      return (await fetchListingPhoto('apt2', 'photo-1')).ok === true;
    },
  },
  {
    name: 'probeVoiceService',
    road: '/voice/health (the voice studio)',
    async claimedReady(fake) {
      globalThis.fetch = async () => fake();
      return (await probeVoiceService({ force: true })) === 'up';
    },
  },
  {
    name: 'probeAvatarHealth',
    road: 'the likeness studio /health',
    async claimedReady(fake) {
      const r = await probeAvatarHealth({ fetchImpl: async () => fake() });
      return r.ok === true || r.ready === true;
    },
  },
  {
    name: 'fetchStreamHealth',
    road: '/cams/streams/health (the camera forwarder)',
    async claimedReady(fake) {
      return (await fetchStreamHealth('token', async () => fake())).ok === true;
    },
  },
  {
    name: 'fetchWaysBrain',
    road: '/ways/brain.json (the sovereign Ways parser)',
    async claimedReady(fake) {
      const b = await fetchWaysBrain({ fetchImpl: async () => fake() });
      return b.ok === true || b.live === true;
    },
  },
  {
    name: 'askTutor',
    road: '/llm/chat (the class tutor)',
    async claimedReady(fake) {
      globalThis.fetch = async () => fake();
      return (await askTutor(MODULES[0], [{ role: 'user', content: 'hello' }])).ok === true;
    },
  },
  {
    name: 'analyzeSkills',
    road: '/llm/chat (the money-skill read)',
    async claimedReady(fake) {
      globalThis.fetch = async () => fake();
      return (await analyzeSkills(TXNS)).ok === true;
    },
  },
  {
    name: 'nasOcr',
    road: 'the NAS books OCR road',
    async claimedReady(fake) {
      const blob = typeof Blob !== 'undefined' ? new Blob(['x'], { type: 'image/png' }) : { size: 1, type: 'image/png' };
      return (await nasOcr(blob, { fetcher: async () => fake(), name: 'page.png' })).ok === true;
    },
  },
];

describe('the SPA shell answering 200 is not the server answering', () => {
  it('covers every sovereign readiness probe in the app, by name', () => {
    // A roster, so a road added without a case here is visible. When a new
    // sovereign probe lands, it belongs in PROBES — that is the whole point
    // of the file, and the count is the reminder.
    expect(PROBES.map((p) => p.name).sort()).toEqual([
      'analyzeSkills', 'askTutor', 'checkMediaService', 'fetchListingPhoto',
      'fetchStreamHealth', 'fetchWaysBrain', 'nasOcr', 'probeAvatarHealth',
      'probeVoiceService',
    ]);
    expect(new Set(PROBES.map((p) => p.road)).size).toBe(PROBES.length);
  });

  for (const probe of PROBES) {
    it(`${probe.name} reports NOT ready when ${probe.road} hands back the app's own index.html at 200`, async () => {
      expect(await probe.claimedReady(spaShell200)).toBe(false);
    });
  }
});

describe('a 200 carrying JSON nobody in this house wrote is not the server either', () => {
  for (const probe of PROBES) {
    it(`${probe.name} reports NOT ready when ${probe.road} answers 200 with a stranger's JSON`, async () => {
      expect(await probe.claimedReady(foreignJson200)).toBe(false);
    });
  }
});

describe('the probes still say YES to their own server', () => {
  // The mirror case, and the reason it is here: a gate that only ever
  // expects `false` passes if a probe is broken into answering "never
  // ready", which would be a different lie (DR-0076 §3 — a gate that cannot
  // tell the two apart proves nothing). So each road's real shape, as its
  // producer writes it, must still read as ready.
  it('checkMediaService: ready on photo_server.py\'s own { ok: true }', async () => {
    globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => ({ ok: true, bytes: 0 }) });
    expect(await checkMediaService()).toBe('ready');
  });

  it('probeVoiceService: up on the studio\'s own { ok: true }', async () => {
    globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => ({ ok: true }) });
    expect(await probeVoiceService({ force: true })).toBe('up');
  });

  it('fetchStreamHealth: ok on the forwarder\'s own summary() shape', async () => {
    // cams_forwarder.py's StreamHealth.summary(): sampled_at, interval_s,
    // cameras, events — read from the producer, not assumed.
    const r = await fetchStreamHealth('token', async () => ({
      ok: true,
      status: 200,
      json: async () => ({ sampled_at: 1760000000, interval_s: 15, cameras: { front: {} }, events: [] }),
    }));
    expect(r.ok).toBe(true);
    expect(r.intervalS).toBe(15);
  });

  it('fetchWaysBrain: live on ways_ingest.py\'s own ok + generated_at', async () => {
    // infra/nas-ways/ways_ingest.py:129-131 stamps both on every brain.
    const b = await fetchWaysBrain({
      fetchImpl: async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          ok: true,
          generated_at: '2026-10-19T00:00:00Z',
          principles: [{ id: 'THREE-BRAKES', summary: 'No timer automation without the brakes.', source: 'CLAUDE.md' }],
          counts: { principles: 1, decisions: 2, open_re_reviews: 0 },
        }),
      }),
    });
    expect(b.live).toBe(true);
    expect(b.principles).toHaveLength(1);
  });

  it('nasOcr: ok when the NAS returns real text', async () => {
    const blob = typeof Blob !== 'undefined' ? new Blob(['x'], { type: 'image/png' }) : { size: 1, type: 'image/png' };
    const r = await nasOcr(blob, { fetcher: async () => ({ ok: true, status: 200, json: async () => ({ text: 'INVOICE 2026' }) }), name: 'page.png' });
    expect(r).toEqual({ ok: true, text: 'INVOICE 2026' });
  });
});
