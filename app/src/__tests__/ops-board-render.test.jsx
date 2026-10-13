// Render smoke test for the OpsBoard — proves the delivery-lane MODEL is
// documented in the app beside its live proof (DR-0103 / DR-0065), and that the
// doc renders independent of the live GitHub read (renderToStaticMarkup does not
// run the fetchOps useEffect, so this stays network-free). The live lane state
// itself (auto-merge armed / hold / merged SHAs) is exercised by the pure
// github-ops.test.js; here we pin the documentation a steward actually reads.
import { describe, it, expect, beforeAll } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

let html;
beforeAll(async () => {
  const mod = await import('../components/OpsBoard.jsx');
  html = renderToStaticMarkup(createElement(mod.default));
});

describe('OpsBoard documents the streamlined delivery loop (DR-0103)', () => {
  it('states the model: auto-merge on green gates = deploy, no manual merge', () => {
    expect(html).toContain('The delivery lane.');
    expect(html).toMatch(/auto-merges? the instant the gates pass/i);
    expect(html).toMatch(/merge = deploy/i);
  });
  it('names the two governor handles: the gate is the brake, hold parks a PR', () => {
    expect(html).toMatch(/gate is the brake/i);
    expect(html).toContain('hold');
  });
  it('cites the governing decision record (resolvable in the repo)', () => {
    expect(html).toContain('DR-0103');
    expect(html).toContain('DR-0103-streamlined-delivery-loop-agent-prs-auto-merge-on-green.md');
  });
  it('frames the live lane below as the proof of the model', () => {
    expect(html).toMatch(/live lane below is the proof/i);
  });
});
