// @vitest-environment node
//
// infra-transport-guard — proven-to-catch (DR-0076 §3 / DR-0250): the witness
// the 2026-07-30 outage lacked. A transport-mutating script MUST cite the
// recorded baseline; one that doesn't turns the build RED.
import { describe, it, expect } from 'vitest';
import { scriptPasses, transportFindings } from '../../../scripts/infra-transport-guard.mjs';

describe('infra-transport-guard', () => {
  it('FAILS a script that mutates the funnel without citing RECORDED-STATE (the 2026-07-30 command)', () => {
    const bad = '#!/bin/sh\ntailscale serve --bg --set-path /mcp http://127.0.0.1:8795\n';
    expect(scriptPasses(bad)).toBe(false);
    const badFunnel = '#!/bin/sh\ntailscale funnel --bg http://127.0.0.1:5678\n';
    expect(scriptPasses(badFunnel)).toBe(false);
  });
  it('PASSES the same command when the script cites the baseline', () => {
    const good = '#!/bin/sh\n# RECORDED-STATE: infra/nas-transport/RECORDED-STATE.md\ntailscale funnel --bg --set-path /mcp http://127.0.0.1:8795\n';
    expect(scriptPasses(good)).toBe(true);
  });
  it('does NOT flag a mere comment mention of tailscale serve/funnel', () => {
    const commentOnly = '#!/bin/sh\n# note: tailscale funnel is the public transport\necho hi\n';
    expect(scriptPasses(commentOnly)).toBe(true);
  });
  it('the REAL repo passes — every transport-mutating script cites the baseline', () => {
    expect(transportFindings()).toEqual([]);
  });
});
