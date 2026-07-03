// Render smoke test for the Quality & Throughput board (DR-0091). Proves the
// component mounts and surfaces the REAL build-time artifacts — the measured
// test census, the vitest-synced legibility scan, the committed audit findings,
// the parsed LESSONS principles — as JSX, and that a why-ref missing from the
// ledger is rendered as missing (never fabricated). Defines are injected onto
// globalThis exactly as the vite build would; the data-fetch useEffects don't
// run under renderToStaticMarkup, so this stays network-free.
import { describe, it, expect, beforeAll } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { buildTestCensus } from '../../../scripts/test-census.mjs';
import { buildLessonsManifest } from '../../../scripts/lessons-manifest.mjs';
import { legibilitySummaryLine } from '../lib/legibility-health.js';

const CENSUS = buildTestCensus();
const LESSONS = buildLessonsManifest();

// A minimal ledger carrying the ids the WHY registry cites — with one (DR-0083)
// deliberately ABSENT so the missing-ref honesty path renders too.
const LEDGER = {
  ok: true,
  count: 5,
  items: [
    { id: 'DR-0088', num: 88, title: 'App-first operations queue', date: '2026-07-03', status: 'accepted' },
    { id: 'DR-0086', num: 86, title: 'Proactive surface audit', date: '2026-07-01', status: 'accepted' },
    { id: 'DR-0084', num: 84, title: 'Self-applying resilient migration lane', date: '2026-07-01', status: 'accepted' },
    { id: 'DR-0076', num: 76, title: 'Verification Doctrine', date: '2026-06-15', status: 'accepted' },
    { id: 'DR-0075', num: 75, title: 'Perpetual improvement is the default', date: '2026-06-15', status: 'accepted' },
  ],
};

let html;
beforeAll(async () => {
  globalThis.__TEST_CENSUS__ = CENSUS;
  globalThis.__LESSONS_PRINCIPLES__ = LESSONS;
  globalThis.__DR_LEDGER__ = LEDGER;
  globalThis.__BUILD_SHA__ = 'dev';
  const mod = await import('../components/QualityThroughput.jsx');
  html = renderToStaticMarkup(createElement(mod.default));
});

describe('QualityThroughput renders the real measurements', () => {
  it('mounts with its section headers', () => {
    expect(html).toContain('Quality &amp; Throughput');
    expect(html).toContain('The numbers');
    expect(html).toContain('The why — the judgment layer');
  });
  it('shows the MEASURED test census (the real numbers, not a typed count)', () => {
    expect(html).toContain(`${CENSUS.callSites.toLocaleString()} test call sites in ${CENSUS.files} files`);
  });
  it('shows the real legibility scan line', () => {
    expect(html).toContain(legibilitySummaryLine().replace(/\((\d+) in repair\)/, '($1 in repair)'));
  });
  it('shows the surface-audit artifact with its source named', () => {
    expect(html).toContain('audit-findings.json');
    expect(html).toMatch(/open finding/);
  });
  it('names the live sources for the runtime metrics instead of painting values', () => {
    expect(html).toContain('ops_commands (DR-0088, realtime)');
    expect(html).toContain('schema_migrations_health()');
    expect(html).toContain('video_harvests');
  });
  it('renders the parsed LESSONS principles (the newest ids appear)', () => {
    const newest = LESSONS.principles[LESSONS.principles.length - 1];
    expect(html).toContain(`${newest.id}`);
    expect(html).toContain(String(LESSONS.principles.length));
  });
  it('resolves found why-refs from the ledger and flags the missing one honestly', () => {
    expect(html).toContain('DR-0088');
    expect(html).toContain('DR-0076');
    // DR-0083 (loops) is deliberately absent from the injected ledger:
    expect(html).toContain('DR-0083 — not in the ledger');
  });
});
