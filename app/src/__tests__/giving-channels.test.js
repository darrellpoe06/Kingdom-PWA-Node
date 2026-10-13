// @vitest-environment node
//
// GIVING_CHANNELS — the church's REAL published giving channels (DR-0136),
// decoded verbatim from its own GIVE ONLINE slide. The rules: every channel is
// a real https URL with provenance and a plain-words "how" (accessibility —
// the elderly member knows what the tap does), the Zelle token is the church's
// own domain identity, and the never-invent-a-URL doctrine still holds in
// resolveGiveDestination.
import { describe, it, expect } from 'vitest';
import { GIVING_CHANNELS, resolveGiveDestination } from '../lib/giving.js';

describe('the four published channels', () => {
  it('carries exactly the four slide channels in slide order', () => {
    expect(GIVING_CHANNELS.map((c) => c.id)).toEqual(['zelle', 'cashapp', 'givelify', 'paypal']);
  });
  it('every channel is a real https URL with label, display, how, and provenance', () => {
    for (const c of GIVING_CHANNELS) {
      expect(c.url).toMatch(/^https:\/\//);
      for (const k of ['label', 'display', 'how', 'provenance']) {
        expect(String(c[k] || '').length, `${c.id}.${k}`).toBeGreaterThan(0);
      }
      expect(c.provenance).toContain('GIVE ONLINE slide');
    }
  });
  it('the Zelle token is the church’s own domain identity (decoded from the QR payload)', () => {
    const z = GIVING_CHANNELS.find((c) => c.id === 'zelle');
    expect(z.display).toBe('info@thechurchofthelivinggod.com');
    // The base64 payload in the URL really carries that token — decode and check.
    const b64 = new URL(z.url).searchParams.get('data');
    const payload = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
    expect(payload.token).toBe('info@thechurchofthelivinggod.com');
    expect(payload.name).toContain('CHURCH OF THE LIVING GOD');
  });
  it('Cash App is the church’s cashtag; Givelify is the church’s own Champaign page', () => {
    expect(GIVING_CHANNELS.find((c) => c.id === 'cashapp').url).toContain('cash.app/$TheLoveCorner');
    expect(GIVING_CHANNELS.find((c) => c.id === 'givelify').url).toContain('church-of-the-living-god-champaign-il');
  });
});

describe('the doctrine holds', () => {
  it('resolveGiveDestination still never invents a URL', () => {
    expect(resolveGiveDestination(null).url).toBeNull();
    expect(resolveGiveDestination({}).url).toBeNull();
  });
});
