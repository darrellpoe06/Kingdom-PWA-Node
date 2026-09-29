// @vitest-environment jsdom
// =============================================================================
// Tower parity panel (DR-0671)
// =============================================================================
// Darrell 2026-09-29: "claude needs to create the specific algorithmic fixes for
// our workflows to work on the towers". The panel shows what the NAS parity
// loop measured, read over a fake database that answers like migration 0242:
// the Governor reads the four tables, anyone else reads nothing; Hold goes
// through set_lesson_parity_hold and a held ready writer stays 'ready'.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

const DB = vi.hoisted(() => {
  const state = { gov: true, rpc: [], tables: {} };
  const q = (table) => {
    const api = {
      select: () => api, order: () => api,
      limit: async () => api.then((r) => r),
      then: (res) => Promise.resolve(state.gov ? { data: state.tables[table] || [], error: null } : { data: [], error: null }).then(res),
    };
    return api;
  };
  const supabase = {
    from: (t) => q(t),
    rpc: async (fn, args) => {
      state.rpc.push([fn, args]);
      if (!state.gov) return { data: null, error: { message: 'set_lesson_parity_hold: only the Governor holds a promotion' } };
      const p = state.tables.lesson_parity_promotion.find((x) => x.writer_family === args.p_writer_family && x.model_label === args.p_model_label);
      p.held = args.p_hold;
      p.status = p.ready && !p.held ? 'primary' : p.ready ? 'ready' : 'reference-only';
      return { data: { status: p.status, held: p.held }, error: null };
    },
  };
  return { state, supabase };
});
vi.mock('../lib/supabase.js', () => ({ default: DB.supabase }));

import TowerParity from '../components/TowerParity.jsx';
import { writerSeries, openGapClasses, consensusView, GAP_LABELS } from '../lib/tower-parity.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function seed() {
  const p = (i, score, passed, gaps) => ({
    id: `p${i}`, teaching_row_id: `t${i}`, lesson_id: `ll-${i}`, version_id: `o${i}`, writer: 'ollama', writer_family: 'ollama',
    model_label: 'tower-a', parity_score: score, passed, gap_classes: gaps, version_created_at: `2026-09-29T10:0${i}:00Z`, measured_at: '2026-09-29T11:00:00Z',
  });
  DB.state.tables = {
    lesson_parity: [p(1, 0.81, false, ['missing-verse-retrieval', 'quiz-count']), p(2, 0.88, false, ['missing-verse-retrieval']), p(3, 0.97, true, [])],
    lesson_crossref: [{
      build_id: 'b3', teaching_row_id: 't3', lesson_id: 'll-3',
      versions: [{ id: 'c3', writer: 'claude' }, { id: 'o3', writer: 'ollama' }, { id: 'g3', writer: 'gemini' }],
      matrix: [{ a: 'c3', b: 'o3', aWriter: 'claude', bWriter: 'ollama', verses: 0.8, movements: 0.9, structure: 1, gates: 1, quizAnswers: 0.75 }],
      consensus: { eligible: 2, verses: { all: [{ verse: 'Deuteronomy 8:18' }], most: [], some: [], one: [] }, themes: { all: [], most: [], some: [], one: [] } },
      insights: [{ kind: 'verse', item: 'Proverbs 29:18', writer: 'gemini' }],
      excluded: [{ writer: 'ollama', why: 'verse gate failed' }],
    }],
    lesson_parity_fixes: [{ id: 'f1', gap_class: 'missing-verse-retrieval', writer_family: 'ollama', status: 'pushed', pr_url: 'https://github.com/x/pull/1' }],
    lesson_parity_promotion: [{ writer_family: 'ollama', model_label: 'tower-a', tower: true, streak: 14, required_n: 14, threshold: 0.95, ready: true, status: 'primary', held: false }],
  };
  DB.state.rpc = [];
  DB.state.gov = true;
}

let host;
async function mount(el) {
  host = document.createElement('div');
  document.body.appendChild(host);
  await act(async () => { createRoot(host).render(el); });
  await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
}
const $ = (s) => host.querySelector(s);
const $$ = (s) => [...host.querySelectorAll(s)];

describe('the Tower parity panel', () => {
  beforeEach(seed);

  it('shows each tower writer, its latest parity, the streak and the status', async () => {
    await mount(<TowerParity signedIn />);
    const tile = $('[data-testid="parity-writer"][data-writer="ollama/tower-a"]');
    expect(tile).toBeTruthy();
    expect(tile.querySelector('[data-testid="parity-latest"]').textContent).toMatch(/^97/);
    expect(tile.querySelector('[data-testid="parity-promotion"]').textContent).toMatch(/14 of 14 in a row at 95/);
    expect(tile.querySelector('[data-testid="parity-promotion"]').getAttribute('data-status')).toBe('primary');
    expect(tile.querySelectorAll('[data-testid="parity-history"] tbody tr').length).toBe(3);
  });

  it('names the open gaps, the fixes shipped, the matrix and the consensus', async () => {
    await mount(<TowerParity signedIn />);
    expect($('[data-gap="missing-verse-retrieval"]').textContent).toMatch(/2 of the last 3/);
    expect($('[data-testid="parity-fixes"] [data-status="pushed"]').textContent).toMatch(/pushed as a PR/);
    expect($$('[data-testid="parity-matrix"] tbody tr').length).toBe(1);
    expect($('[data-testid="parity-consensus"]').textContent).toMatch(/Deuteronomy 8:18/);
    expect($('[data-testid="parity-insights"]').textContent).toMatch(/candidate insights, not errors/);
    expect($('[data-testid="parity-excluded"]').textContent).toMatch(/verse gate failed/);
  });

  it('Hold keeps a ready writer at ready; release makes it primary', async () => {
    await mount(<TowerParity signedIn />);
    await act(async () => { $('[data-testid="parity-hold"]').dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
    expect(DB.state.rpc[0]).toEqual(['set_lesson_parity_hold', { p_writer_family: 'ollama', p_model_label: 'tower-a', p_hold: true }]);
    expect($('[data-testid="parity-promotion"]').getAttribute('data-status')).toBe('ready');
    expect($('[data-testid="parity-hold"]').textContent).toBe('Release hold');
  });

  it('a non-Governor reads nothing, and is told why', async () => {
    DB.state.gov = false;
    await mount(<TowerParity signedIn />);
    expect($$('[data-testid="parity-writer"]').length).toBe(0);
    expect($('[data-testid="tower-parity-empty"]')).toBeTruthy();
  });

  it('signed out, it does not read at all', async () => {
    await mount(<TowerParity signedIn={false} />);
    expect($('[data-testid="tower-parity-closed"]').textContent).toMatch(/signed-out/);
  });
});

describe('the pure shaping', () => {
  beforeEach(seed);
  it('series are oldest first; gap classes most frequent first with plain words', () => {
    const s = writerSeries(DB.state.tables.lesson_parity);
    expect(s[0].points.map((p) => p.score)).toEqual([0.81, 0.88, 0.97]);
    const g = openGapClasses(DB.state.tables.lesson_parity);
    expect(g[0]).toMatchObject({ gapClass: 'missing-verse-retrieval', count: 2, label: GAP_LABELS['missing-verse-retrieval'] });
  });
  it('the consensus view', () => {
    const c = consensusView(DB.state.tables.lesson_crossref[0]);
    expect(c.versesAgreed).toEqual(['Deuteronomy 8:18']);
    expect(c.insights[0].writer).toBe('gemini');
  });
  it('every gap class the Python names has a plain label here', () => {
    const src = readFileSync(join(REPO, 'infra/nas-lesson-parity/parity_core.py'), 'utf8');
    const block = src.slice(src.indexOf('GAP_CLASSES = {'), src.indexOf('}', src.indexOf('GAP_CLASSES = {')));
    const classes = [...block.matchAll(/^\s+"([a-z-]+)":/gm)].map((m) => m[1]);
    expect(classes.length).toBeGreaterThan(10);
    for (const c of classes) expect(GAP_LABELS[c], c).toBeTruthy();
  });
  it('Projects → Decisions renders the panel for the Governor', () => {
    const p = readFileSync(join(REPO, 'app/src/components/Projects.jsx'), 'utf8');
    expect(p).toMatch(/<TowerParity signedIn=\{!!currentUserId\} \/>/);
  });
});
