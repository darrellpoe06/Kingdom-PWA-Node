// @vitest-environment node
// =============================================================================
// The witness must ask the way the app asks (DR-1054)
// =============================================================================
// On 2026-10-15 Darrell met the same 15-second failure three times in one hour
// — the Choir tab, My Record, the harvest ledger — while site-health's backend
// step read `backend auth: HTTP 200` on his exact build (run 38811322129,
// served ef26a33).
//
// Both sentences were true, because they are different sentences. That step is
// a GET, from a datacenter, with NO Origin header. The app is a browser on a
// phone making cross-origin POSTs to the absolute Funnel origin the 2026-10-09
// repoint moved it to — an origin whose throttle that repoint accepted
// knowingly, in writing, as a risk that "may begin firing under real family
// load." A GET with no Origin cannot exercise it. So the instrument has only
// ever measured that the road answers a probe.
//
// These cases feed the verdict each real failure shape and REQUIRE the
// finding. A witness that cannot be shown to catch is the thing it exists to
// prevent (DR-0076 §3).
import { describe, it, expect } from 'vitest';
import { appShapeVerdict, NOT_MEASURED } from '../../../scripts/app-shape-verdict.mjs';

const healthy = { pre: '200', allow: 'https://poetech.us', post: '400', bytes: 112 };

describe('a working road passes, and only a working road', () => {
  it('the real healthy answer — a 400 with a JSON error body and CORS', () => {
    // A deliberately wrong credential at an unroutable address. 400 + a body
    // is the auth road working exactly as it should.
    const v = appShapeVerdict(healthy);
    expect(v).toEqual({ ok: true, kind: 'answered', reason: '' });
  });

  it('a wildcard allow-origin is still CORS', () => {
    expect(appShapeVerdict({ ...healthy, allow: '*' }).ok).toBe(true);
  });

  it('a 200 with a body passes too — the code is not what decides', () => {
    expect(appShapeVerdict({ ...healthy, post: '200', bytes: 900 }).ok).toBe(true);
  });
});

describe('PROVEN-TO-CATCH: the three shapes that actually happened', () => {
  it('NO ANSWER — the 15-second timeouts of 2026-10-15', () => {
    const v = appShapeVerdict({ ...healthy, post: '000', bytes: 0 });
    expect(v.ok).toBe(false);
    expect(v.kind).toBe('no-answer');
    // The reason must name why the GET above disagreed, or the next person
    // reads "backend 200" and closes the ticket.
    expect(v.reason).toMatch(/a GET is not a sign-in/i);
  });

  it('EMPTY BODY — the exact failure #2057 opened on', () => {
    // "a POST to the app's own auth road returned an EMPTY BODY twice. The
    // browser calls .json() on that and fails with 'Unexpected end of JSON
    // input', so nobody can sign in."
    const v = appShapeVerdict({ ...healthy, post: '200', bytes: 0 });
    expect(v.ok).toBe(false);
    expect(v.kind).toBe('empty-body');
    expect(v.reason).toMatch(/Unexpected end of JSON input/);
    // AND THE WHOLE POINT: an ordinary HTTP code. A probe reading only the
    // code calls this healthy.
    expect(v.reason).toMatch(/HTTP 200 with 0 bytes/);
  });

  it('NO CORS — the browser refuses before the request leaves the phone', () => {
    const v = appShapeVerdict({ ...healthy, allow: '' });
    expect(v.ok).toBe(false);
    expect(v.kind).toBe('no-cors');
    expect(v.reason).toMatch(/never heard about/i);
  });

  it('a whitespace-only allow header is no allow header', () => {
    expect(appShapeVerdict({ ...healthy, allow: '   ' }).kind).toBe('no-cors');
  });
});

describe('unknown is never up (DR-0076)', () => {
  it('a measurement that did not happen is a finding, not a pass', () => {
    const v = appShapeVerdict({ pre: NOT_MEASURED, allow: '', post: NOT_MEASURED, bytes: '0' });
    expect(v.ok).toBe(false);
    expect(v.kind).toBe('not-measured');
    expect(v.reason).toMatch(/Unknown is never up/i);
  });

  it('called with nothing at all, it does not pass', () => {
    expect(appShapeVerdict().ok).toBe(false);
    expect(appShapeVerdict({}).ok).toBe(false);
  });

  it('a non-numeric byte count reads as zero, never as "probably fine"', () => {
    expect(appShapeVerdict({ ...healthy, bytes: 'nonsense' }).kind).toBe('empty-body');
    expect(appShapeVerdict({ ...healthy, bytes: undefined }).kind).toBe('empty-body');
  });
});

describe('the order of the findings', () => {
  // A road that did not answer tells you nothing about its CORS headers, so
  // reporting the shallower fault would send somebody to fix the wrong thing.
  it('no-answer outranks empty-body and no-cors', () => {
    expect(appShapeVerdict({ pre: '000', allow: '', post: '000', bytes: 0 }).kind).toBe('no-answer');
  });

  it('empty-body outranks no-cors', () => {
    expect(appShapeVerdict({ pre: '200', allow: '', post: '200', bytes: 0 }).kind).toBe('empty-body');
  });
});

describe('what the reason says to the person reading the incident', () => {
  it('every failure names the road it asked', () => {
    for (const m of [
      { ...healthy, post: '000' },
      { ...healthy, bytes: 0 },
      { ...healthy, allow: '' },
    ]) {
      const v = appShapeVerdict({ ...m, url: 'https://poetech.tail5a2f35.ts.net/sb/auth/v1/token' });
      expect(v.reason).toContain('poetech.tail5a2f35.ts.net/sb/auth/v1/token');
    }
  });

  it('no failure reason is empty, and no pass carries one', () => {
    expect(appShapeVerdict({ ...healthy, post: '000' }).reason.length).toBeGreaterThan(60);
    expect(appShapeVerdict(healthy).reason).toBe('');
  });
});
