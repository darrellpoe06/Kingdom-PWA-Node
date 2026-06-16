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

let html;
beforeAll(async () => {
  globalThis.__QUALITY_PROOF__ = buildQualityManifest();
  globalThis.__UIUX_REVIEWS__ = parseReviews();
  globalThis.__BUILD_SHA__ = 'dev';
  const mod = await import('../components/QualityProof.jsx');
  html = renderToStaticMarkup(createElement(mod.default));
});

describe('QualityProof renders the real proof + reviews', () => {
  it('renders without throwing and shows the section headers', () => {
    expect(html).toContain('Quality / Proof');
    expect(html).toContain('Proof');
    expect(html).toContain('UI/UX Reviews');
  });
  it('surfaces real adversarial gate rows from the manifest', () => {
    expect(html).toContain('Per-theme WCAG 2.1 AA contrast');
    expect(html).toContain('DB authenticated-grant guard');
  });
  it('surfaces real closed-loop rows from the manifest', () => {
    expect(html).toContain('Choir save loop');
    expect(html).toContain('Orchestration-outcome loop');
  });
  it('surfaces the measured contrast result (the real themes)', () => {
    expect(html).toMatch(/WCAG 2\.1 AA contrast/);
    expect(html).toContain('sapphire');
  });
  it('surfaces real review records from the registry', () => {
    // The panel renders each record's title + source (not the REV- id).
    expect(html).toContain('Machine-readable build-freshness marker');
    expect(html).toContain('source: scripts/contrast-guard.mjs');
    expect(html).toContain('addressed');
  });
  it('points at the live local-LLM review panel (no duplication)', () => {
    expect(html).toMatch(/Local-LLM/i);
  });
});
