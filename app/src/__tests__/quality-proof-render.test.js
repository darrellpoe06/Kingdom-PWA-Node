// Render smoke test for the Quality / Proof panel. Proves the component actually
// mounts and surfaces the REAL build-time manifest (gates, loops, measured
// contrast) and the REAL review registry as JSX -- not just that the pure logic
// is correct. The build defines (__QUALITY_PROOF__ / __UIUX_REVIEWS__) only
// exist in a vite build, so we inject the real values (from the same manifest
// builder + the real REVIEWS.md) onto globalThis BEFORE importing the component,
// exactly as the bundle would. fetchOps' useEffect does not run under
// renderToStaticMarkup, so this stays network-free.
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { buildQualityManifest } from '../../../scripts/quality-manifest.mjs';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

// Re-parse REVIEWS.md the same way vite.config does (kept tiny + local so the
// test owns its own real input rather than depending on the build).
function parseReviews() {
  const raw = readFileSync(join(REPO_ROOT, 'docs/reviews/REVIEWS.md'), 'utf8');
  const section = (raw.split(/^##\s+Records\b.*$/m)[1] || raw);
  const blocks = section.split(/^###\s+/m).slice(1);
  const field = (b, l) => { const m = b.match(new RegExp(`\\*\\*${l}:\\*\\*\\s*([^\\n]+)`, 'i')); return m ? m[1].trim() : ''; };
  const items = blocks.map((b) => {
    const head = (b.split('\n')[0] || '').trim();
    const [idPart, ...rest] = head.split('·');
    return { id: (idPart || '').trim(), title: rest.join('·').trim(), date: field(b, 'Date'), surface: field(b, 'Surface'), type: field(b, 'Type').toLowerCase(), status: field(b, 'Status').toLowerCase(), findings: field(b, 'Findings'), source: field(b, 'Source') };
  }).filter((it) => /^REV-\d+/.test(it.id));
  return { ok: items.length > 0, count: items.length, items };
}

// The panel is now THIRD-ROW sub-tabbed (Darrell 2026-07-05: no more long
// scroll) and only the active sub-panel mounts — so each section is rendered
// via its defaultSection and asserted in ITS OWN markup, exactly what a user
// opening that chip sees.
let render;
let html; // the default view (gates)
beforeAll(async () => {
  globalThis.__QUALITY_PROOF__ = buildQualityManifest();
  globalThis.__UIUX_REVIEWS__ = parseReviews();
  globalThis.__BUILD_SHA__ = 'dev';
  const mod = await import('../components/QualityProof.jsx');
  render = (defaultSection) => renderToStaticMarkup(createElement(mod.default, defaultSection ? { defaultSection } : {}));
  html = render();
});

describe('QualityProof renders the real proof + reviews (sub-tabbed)', () => {
  it('renders without throwing, shows the header + every sub-tab chip', () => {
    expect(html).toContain('Quality / Proof');
    for (const label of ['Break-it gates', 'Closed loops', 'Accessibility', 'Interconnect', 'Reviews']) {
      expect(html, `missing sub-tab ${label}`).toContain(label);
    }
  });
  it('surfaces real adversarial gate rows from the manifest (default panel)', () => {
    expect(html).toContain('Per-theme WCAG 2.1 AA contrast');
    expect(html).toContain('DB authenticated-grant guard');
  });
  it('surfaces real closed-loop rows from the manifest', () => {
    const h = render('loops');
    expect(h).toContain('Choir save loop');
    expect(h).toContain('Orchestration-outcome loop');
  });
  it('surfaces the measured contrast result (the real themes)', () => {
    const h = render('contrast');
    expect(h).toMatch(/WCAG 2\.1 AA contrast/);
    expect(h).toContain('sapphire');
  });
  it('surfaces real review records from the registry', () => {
    // The panel renders each record's title + source (not the REV- id).
    const h = render('reviews');
    expect(h).toContain('Machine-readable build-freshness marker');
    expect(h).toContain('source: scripts/contrast-guard.mjs');
    expect(h).toContain('addressed');
  });
  it('points at the live local-LLM review panel (no duplication)', () => {
    expect(render('reviews')).toMatch(/Local-LLM/i);
  });
});
