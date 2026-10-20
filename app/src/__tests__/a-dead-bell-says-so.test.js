// =============================================================================
// A dead bell says so (DR-0970)
// =============================================================================
// The family's phone alarm has been dark, and the detector reported it as rung.
//
// MEASURED, from site-health run 38141832465 at 2026-10-11T13:06:25Z — its own
// final line, captured verbatim:
//
//   {"code":404,"message":"The requested webhook \"POST ops-announce\" is not
//    registered.","hint":"The workflow must be active for a production URL..."}
//
// The old guard was:
//
//   curl -sS -X POST "$RELAY/webhook/ops-announce" ... \
//     || echo "::warning::announce relay unreachable"
//
// `curl -sS` WITHOUT `-f` EXITS 0 ON A 404, so that `||` could never fire on
// the one failure that was actually happening. An unregistered, renamed,
// revoked or 500-ing webhook was indistinguishable from a bell that rang.
//
// These cases pin the distinction the old code could not make.
import { describe, it, expect, vi } from 'vitest';
import { classifyBellResponse, ledgerLine, ring, RELAY_URL } from '../../../scripts/ops-announce.mjs';

// The exact body the relay returned, so this is not a paraphrase of the bug.
const REAL_404 = JSON.stringify({
  code: 404,
  message: 'The requested webhook "POST ops-announce" is not registered.',
  hint: 'The workflow must be active for a production URL to run successfully.',
});

describe('classifyBellResponse — the measured failure', () => {
  it('PROVEN-TO-CATCH: the real 404 is a DEAD bell, not a rung one', () => {
    const r = classifyBellResponse({ code: 404, body: REAL_404 });
    expect(r.rang, 'a 404 was counted as a bell that rang — the original defect').toBe(false);
    expect(r.dead).toBe(true);
    expect(r.reason).toMatch(/NOT REGISTERED/);
    expect(r.reason, 'the reason must name the fix: the n8n workflow is not ACTIVE').toMatch(/not ACTIVE/);
  });

  it('it says plainly that alarms raised meanwhile reach nobody', () => {
    // The cost, stated on the surface a human reads, not inferred.
    expect(classifyBellResponse({ code: 404, body: REAL_404 }).reason).toMatch(/reaches nobody/i);
  });

  it('a 404 without that body is still dead, and now names the MOUNT (DR-1047)', () => {
    // RE-PINNED 2026-10-15. This asserted /webhook path is wrong/, which was
    // true while the road was n8n's. After the cut-over a bare 404 on the
    // sovereign road means one specific thing: tailscale is serving nothing at
    // /announce, so the service can be `active` on 127.0.0.1:8796 and still be
    // unreachable. That is the built-correct-never-connected class that cost
    // /nas-photos seven weeks, /taxes seven weeks and /scribe eighteen days,
    // so the reason must name the mount and the one command that fixes it --
    // a reader who gets this line should not have to go diagnose it.
    const r = classifyBellResponse({ code: 404, body: 'Not Found' });
    expect(r.rang).toBe(false);
    expect(r.dead).toBe(true);
    expect(r.reason).not.toMatch(/NOT REGISTERED/);
    expect(r.reason).toMatch(/nothing is mounted at \/announce/);
    expect(r.reason).toMatch(/127\.0\.0\.1:8796/);
    expect(r.reason).toMatch(/funnel --bg --set-path \/announce/);
  });

  it('the n8n branch still fires on n8n’s own words, and only on them', () => {
    // The history is real and the body shape is exact, so that branch stays.
    // Proven-to-catch in BOTH directions: n8n's wording takes the n8n reason,
    // anything else takes the mount reason. If these ever cross, one of the
    // two causes is being reported as the other.
    expect(classifyBellResponse({ code: 404, body: REAL_404 }).reason).toMatch(/NOT REGISTERED/);
    expect(classifyBellResponse({ code: 404, body: REAL_404 }).reason).not.toMatch(/nothing is mounted/);
    expect(classifyBellResponse({ code: 404, body: '{}' }).reason).not.toMatch(/NOT REGISTERED/);
  });

  it('the caller points at the sovereign road, not the n8n root (DR-1047)', () => {
    // The cut-over itself, pinned: the n8n hop is gone from the live path, and
    // the full spelling is what tailscale's mount-point stripping expects.
    expect(RELAY_URL).toBe('https://poetech.tail5a2f35.ts.net/announce/ops-announce');
    expect(RELAY_URL).not.toMatch(/\/webhook\//);
  });
});

describe('classifyBellResponse — every other answer', () => {
  it('2xx is the only thing that counts as rung', () => {
    for (const code of [200, 201, 202, 204, 299]) {
      expect(classifyBellResponse({ code }).rang, `HTTP ${code} should ring`).toBe(true);
    }
  });

  it('UNKNOWN IS NOT RUNG: nothing outside 2xx gets the benefit of the doubt', () => {
    for (const code of [0, 301, 302, 400, 401, 403, 404, 418, 429, 500, 502, 503]) {
      expect(classifyBellResponse({ code }).rang, `HTTP ${code} must not read as rung`).toBe(false);
    }
  });

  it('a refused token is named as a token problem, not a missing webhook', () => {
    expect(classifyBellResponse({ code: 401 }).reason).toMatch(/refused the token/);
    expect(classifyBellResponse({ code: 403 }).reason).toMatch(/refused the token/);
  });

  it('a 5xx is the relay failing, and a 0 is no answer at all', () => {
    expect(classifyBellResponse({ code: 503 }).reason).toMatch(/relay failed \(HTTP 503\)/);
    expect(classifyBellResponse({ code: 0 }).reason).toMatch(/no answer at all/);
  });

  it('a real connection failure is reported as such, on one line', () => {
    const r = classifyBellResponse({ transportError: 'connect ETIMEDOUT\nstack line\nmore' });
    expect(r.dead).toBe(true);
    expect(r.reason).toMatch(/could not be reached/);
    expect(r.reason.split('\n')).toHaveLength(1);
  });

  it('a redirect is not an acceptance', () => {
    expect(classifyBellResponse({ code: 302 }).reason).toMatch(/not an acceptance/);
  });

  it('an unexplained answer carries WHAT THE RELAY SAID, on one line, capped (site-health run 39487383850 said only "HTTP 400")', () => {
    const r = classifyBellResponse({ code: 400, body: '{"ok": false,\n  "error": "bad json"}' });
    expect(r.dead).toBe(true);
    expect(r.reason).toBe('the announce relay answered HTTP 400, which is not an acceptance (it said: {"ok": false, "error": "bad json"})');
    expect(r.reason.split('\n')).toHaveLength(1);
    const long = classifyBellResponse({ code: 400, body: 'x'.repeat(1000) });
    expect(long.reason.length).toBeLessThan(260);
    expect(classifyBellResponse({ code: 400 }).reason).toBe('the announce relay answered HTTP 400, which is not an acceptance.');
  });
});

describe('ledgerLine — the record a human actually reads', () => {
  it('a dead bell produces a line for the incident ledger', () => {
    const r = classifyBellResponse({ code: 404, body: REAL_404 });
    const line = ledgerLine(r, 'https://example/run/1');
    expect(line).toMatch(/phone alarm did not ring/i);
    expect(line).toMatch(/https:\/\/example\/run\/1/);
  });

  it('a bell that rang produces nothing — no noise on a working day', () => {
    expect(ledgerLine(classifyBellResponse({ code: 200 }))).toBe('');
  });
});

describe('ring — the thin shell around the decision', () => {
  it('no token attempted is NOT a dead bell, because nothing was tried', () => {
    // A missing bearer is a configuration state, not a broken relay; calling
    // it dead would put a false alarm on the ledger every run.
    return ring({ title: 't', message: 'm', token: '' }).then((r) => {
      expect(r.rang).toBe(false);
      expect(r.dead).toBe(false);
      expect(r.reason).toMatch(/no announce bearer is configured/);
    });
  });

  it('PROVEN-TO-CATCH: a 404 from the relay comes back dead, through the real path', async () => {
    const fetchImpl = vi.fn(async () => ({ status: 404, text: async () => REAL_404 }));
    const r = await ring({ title: 't', message: 'm', token: 'secret-token', fetchImpl });
    expect(r.rang).toBe(false);
    expect(r.dead).toBe(true);
    expect(fetchImpl).toHaveBeenCalledOnce();
    expect(fetchImpl.mock.calls[0][0]).toBe(RELAY_URL);
  });

  it('THE TOKEN IS NEVER IN THE REASON, so a log can never leak it', async () => {
    const token = 'super-secret-bearer-value';
    for (const status of [200, 401, 404, 500]) {
      const fetchImpl = async () => ({ status, text: async () => REAL_404 });
      const r = await ring({ title: 't', message: 'm', token, fetchImpl });
      expect(r.reason, `HTTP ${status} leaked the bearer into its reason`).not.toContain(token);
    }
  });

  it('it sends the bearer in a header and the payload as JSON', async () => {
    const fetchImpl = vi.fn(async () => ({ status: 200, text: async () => 'ok' }));
    await ring({ title: 'down', message: 'the site', url: 'u', priority: '5', token: 'tok', fetchImpl });
    const [, init] = fetchImpl.mock.calls[0];
    expect(init.headers.Authorization).toBe('Bearer tok');
    expect(JSON.parse(init.body)).toEqual({ title: 'down', message: 'the site', url: 'u', priority: '5' });
  });

  // A 200 IS NOT A RING (DR-1110): the sovereign relay answers 200 with
  // {ok, delivered, detail} even when ntfy refused or was unreachable.
  it('a 200 that says delivered:false is a dead bell, with ntfy\'s own reason', () => {
    const r = classifyBellResponse({ code: 200, body: JSON.stringify({ ok: true, delivered: false, detail: 'ntfy unreachable: Name or service not known' }) });
    expect(r.rang).toBe(false);
    expect(r.dead).toBe(true);
    expect(r.reason).toMatch(/ntfy did not deliver it \(ntfy unreachable: Name or service not known\)/);
    expect(ledgerLine(r)).toMatch(/did not ring/);
  });
  it('a 200 that says delivered:true, or carries no JSON, still rings', () => {
    expect(classifyBellResponse({ code: 200, body: JSON.stringify({ ok: true, delivered: true, detail: 'ntfy HTTP 200' }) }).rang).toBe(true);
    expect(classifyBellResponse({ code: 200, body: 'ok' }).rang).toBe(true);
    expect(classifyBellResponse({ code: 204 }).rang).toBe(true);
  });
  it('a throwing fetch is a dead bell, never an exception out of ring()', async () => {
    const r = await ring({ title: 't', message: 'm', token: 'tok', fetchImpl: async () => { throw new Error('getaddrinfo ENOTFOUND'); } });
    expect(r.dead).toBe(true);
    expect(r.reason).toMatch(/could not be reached/);
  });
});
