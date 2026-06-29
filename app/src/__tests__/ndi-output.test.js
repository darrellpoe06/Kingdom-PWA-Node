// Tests for lib/ndi-output.js — the NDI-ready PROGRAM OUTPUT contract (the NDI
// low-hanging-fruit: PWA program -> OBS Browser Source -> DistroAV NDI -> screen,
// all church-LAN, free tooling, NO GPU).
//
// PROVEN-TO-CATCH (DR-0076 anti-theater): the load-bearing claims these guard are
//   (1) URL params actually map to the right payload kind (so the media team's
//       Browser Source URL renders the intended frame, not a blank/wrong one), and
//   (2) the routing map stays honestly NO-GPU + the browser-can't-emit-NDI note is
//       present (so the surface never implies a capability the browser lacks).
// Flip parseOutputParams to ignore `kind`, or drop the no-GPU/bridge facts, and a
// case below fails.
import { describe, it, expect } from 'vitest';
import {
  PROGRAM_CHANNEL,
  NDI_SOURCES,
  PROGRAM_FRAME,
  holdProgram,
  scriptureProgram,
  lyricProgram,
  lowerThird,
  slideProgram,
  parseOutputParams,
  wantsKey,
  programOutputUrl,
  NDI_ROUTING,
  NDI_BROWSER_NOTE,
} from '../lib/ndi-output.js';

describe('program payload builders', () => {
  it('holdProgram falls back to a non-empty title', () => {
    expect(holdProgram('').title).toBe('The Church of the Living God');
    expect(holdProgram('At the door').kind).toBe('hold');
  });

  it('scriptureProgram trims and carries ref/text/translation', () => {
    const p = scriptureProgram({ ref: ' John 3:16 ', text: '  For God so loved... ', translation: 'ESV' });
    expect(p).toEqual({ kind: 'scripture', ref: 'John 3:16', text: 'For God so loved...', translation: 'ESV' });
  });

  it('lyricProgram cleans lines (trim + drop blanks)', () => {
    const p = lyricProgram({ title: 'Amazing Grace', lines: [' how sweet ', '', '  the sound ', null] });
    expect(p.lines).toEqual(['how sweet', 'the sound']);
    expect(p.kind).toBe('lyric');
  });

  it('lowerThird defaults to keyed (transparent)', () => {
    expect(lowerThird({ name: 'Bishop Gwin', role: 'Senior Pastor' }).key).toBe(true);
    expect(lowerThird({ name: 'x', key: false }).key).toBe(false);
  });

  it('slideProgram is the generic catch-all envelope', () => {
    const p = slideProgram({ eyebrow: 'Week 1', title: 'The Way', body: 'idea', ref: 'Acts 9' });
    expect(p.kind).toBe('slide');
    expect(p.title).toBe('The Way');
  });
});

describe('parseOutputParams (the standalone Browser-Source URL path)', () => {
  const mk = (obj) => new URLSearchParams(obj);

  it('maps kind=scripture to a scripture payload', () => {
    const p = parseOutputParams(mk({ kind: 'scripture', ref: 'John 3:16', text: 'For God so loved...' }));
    expect(p.kind).toBe('scripture');
    expect(p.ref).toBe('John 3:16');
  });

  it('splits lyric lines on the pipe delimiter', () => {
    const p = parseOutputParams(mk({ kind: 'lyric', lines: 'line one|line two|line three' }));
    expect(p.lines).toEqual(['line one', 'line two', 'line three']);
  });

  it('maps lower-third and honors key=0 opt-out', () => {
    expect(parseOutputParams(mk({ kind: 'lower-third', name: 'BG' })).key).toBe(true);
    expect(parseOutputParams(mk({ kind: 'lower-third', name: 'BG', key: '0' })).key).toBe(false);
  });

  it('unknown kind with a title falls back to a hold (never blank-by-accident)', () => {
    expect(parseOutputParams(mk({ title: 'Welcome' }))).toEqual(holdProgram('Welcome'));
  });

  it('empty params yields null (route renders its own default hold)', () => {
    expect(parseOutputParams(mk({}))).toBeNull();
  });

  it('works with a plain object too (not just URLSearchParams)', () => {
    expect(parseOutputParams({ kind: 'hold', title: 'Hi' }).title).toBe('Hi');
  });
});

describe('wantsKey', () => {
  it('keyed only for keyed lower-thirds, or an explicit override', () => {
    expect(wantsKey(lowerThird({ name: 'x' }))).toBe(true);
    expect(wantsKey(lowerThird({ name: 'x', key: false }))).toBe(false);
    expect(wantsKey(scriptureProgram({ ref: 'x' }))).toBe(false);
    expect(wantsKey(scriptureProgram({ ref: 'x' }), true)).toBe(true);
    expect(wantsKey(null)).toBe(false);
  });
});

describe('programOutputUrl (what an OBS Browser Source points at)', () => {
  it('builds a same-origin ?output=1 URL, normalizing trailing slash + old query', () => {
    const url = programOutputUrl('https://poetech.tail5a2f35.ts.net:8443/poetech-app/?foo=bar');
    expect(url).toBe('https://poetech.tail5a2f35.ts.net:8443/poetech-app/?output=1');
  });

  it('adds key + kind + extra params', () => {
    const url = programOutputUrl('https://x/app', { key: true, kind: 'scripture', extra: { ref: 'John 3:16' } });
    expect(url).toContain('output=1');
    expect(url).toContain('key=1');
    expect(url).toContain('kind=scripture');
    expect(url).toContain('ref=John+3%3A16');
  });
});

describe('NDI routing map (sovereign, LAN, NO GPU) + honesty', () => {
  it('is explicitly sovereign, LAN, and GPU-free', () => {
    expect(NDI_ROUTING.sovereign).toBe(true);
    expect(NDI_ROUTING.lan).toBe(true);
    expect(NDI_ROUTING.gpu).toBe(false); // the LHF needs NO GPU box
  });

  it('names the three real hops: camera-in, pwa-in, receiver-out', () => {
    expect(NDI_ROUTING.hops.map((h) => h.id)).toEqual(['camera-in', 'pwa-in', 'receiver-out']);
  });

  it('the bridge + browser note state the browser cannot emit NDI on its own', () => {
    expect(NDI_ROUTING.bridge).toMatch(/DistroAV|obs-ndi/i);
    expect(NDI_BROWSER_NOTE).toMatch(/cannot send NDI/i);
    expect(NDI_BROWSER_NOTE).toMatch(/no GPU/i);
  });

  it('exposes stable NDI source names + a fixed 1080p frame + its own channel', () => {
    expect(NDI_SOURCES.program).toMatch(/POETECH/);
    expect(PROGRAM_FRAME).toEqual({ width: 1920, height: 1080 });
    expect(PROGRAM_CHANNEL).toBe('poetech-program-v1');
  });
});
