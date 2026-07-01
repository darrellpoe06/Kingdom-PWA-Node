// board-handoff — the least-human ownership default + the two-way push/handoff
// record (declared by Darrell 2026-07-01). Proven-to-catch (DR-0076): each test
// would fail if the rule regressed — the three money items must be AI-owned, the
// AI must speak ONE name (Ari), a push must reassign AND leave a trail, and the
// seed self-heal must correct a backwards owner without overriding a real push.
import { describe, it, expect } from 'vitest';
import {
  AI_OWNER, normalizeOwner, isAiOwner, HANDOFF_TARGETS,
  makeHandoff, appendHistory, taskHistory, canonicalSeedOwner,
  seedTasksForBoard, seedTaskSlug, SEED_BOARDS,
} from '../lib/board.js';

describe('normalizeOwner — the AI speaks one name', () => {
  it('folds legacy AI labels to Ari', () => {
    for (const legacy of ['Claude', 'claude', 'AI', 'ai', 'assistant', 'System-AI']) {
      expect(normalizeOwner(legacy)).toBe(AI_OWNER);
    }
  });
  it('leaves human owners and trims blanks', () => {
    expect(normalizeOwner('Darrell')).toBe('Darrell');
    expect(normalizeOwner('  Christina ')).toBe('Christina');
    expect(normalizeOwner('')).toBeNull();
    expect(normalizeOwner(null)).toBeNull();
  });
  it('isAiOwner is true for Ari and every legacy label, false for a human', () => {
    expect(isAiOwner('Ari')).toBe(true);
    expect(isAiOwner('Claude')).toBe(true);
    expect(isAiOwner('Darrell')).toBe(false);
    expect(isAiOwner(null)).toBe(false);
  });
});

describe('least-human default — the three money items are AI work, not Darrell', () => {
  const fin = seedTasksForBoard('board-financial-loops');
  const byKey = (k) => fin.find((r) => r.slug === seedTaskSlug('board-financial-loops', k));

  it('bank import, categorize, and debts are owned by Ari', () => {
    expect(byKey('fin-import').owner).toBe(AI_OWNER);
    expect(byKey('fin-categorize').owner).toBe(AI_OWNER);
    expect(byKey('fin-debts').owner).toBe(AI_OWNER);
  });
  it('no financial-loops item is owned by a human by default (all are system-doable)', () => {
    for (const r of fin) expect(isAiOwner(r.owner)).toBe(true);
  });
  it('no seed item anywhere still carries the legacy "Claude" label', () => {
    for (const spec of SEED_BOARDS) {
      for (const r of seedTasksForBoard(spec.slug)) {
        expect(r.owner === 'Claude').toBe(false);
      }
    }
  });
  it('genuinely-human items stay with the human (succession map/docs = Darrell)', () => {
    const suc = seedTasksForBoard('board-succession');
    const map = suc.find((r) => r.slug === seedTaskSlug('board-succession', 'suc-map'));
    const docs = suc.find((r) => r.slug === seedTaskSlug('board-succession', 'suc-docs'));
    expect(map.owner).toBe('Darrell');
    expect(docs.owner).toBe('Darrell');
    // …and the AI-built surface is Ari's.
    const surface = suc.find((r) => r.slug === seedTaskSlug('board-succession', 'suc-surface'));
    expect(surface.owner).toBe(AI_OWNER);
  });
});

describe('canonicalSeedOwner — self-heal targets', () => {
  it('resolves the least-human owner for a seed item from its slug', () => {
    expect(canonicalSeedOwner('board-financial-loops', seedTaskSlug('board-financial-loops', 'fin-import'))).toBe(AI_OWNER);
    expect(canonicalSeedOwner('board-succession', seedTaskSlug('board-succession', 'suc-map'))).toBe('Darrell');
  });
  it('returns undefined for a non-seed slug or unknown board', () => {
    expect(canonicalSeedOwner('board-financial-loops', 'bt-financial-loops-abc123')).toBeUndefined();
    expect(canonicalSeedOwner('nope', seedTaskSlug('nope', 'x'))).toBeUndefined();
  });
});

describe('handoff record — a push reassigns AND leaves a trail', () => {
  it('makeHandoff normalizes the destination note and captures who/when', () => {
    const e = makeHandoff({ at: '2026-07-01T12:00:00Z', from: 'Ari', to: 'Darrell', by: 'darrell', note: '  needs your Gmail creds  ' });
    expect(e.from).toBe('Ari');
    expect(e.to).toBe('Darrell');
    expect(e.by).toBe('darrell');
    expect(e.note).toBe('needs your Gmail creds');
    expect(e.kind).toBe('handoff');
    expect(e.at).toBe('2026-07-01T12:00:00Z');
  });
  it('appendHistory is immutable and preserves other link fields', () => {
    const links = { project_slug: 'x', history: [{ to: 'Ari' }] };
    const next = appendHistory(links, { to: 'Darrell' });
    expect(next.project_slug).toBe('x');           // other link data untouched
    expect(next.history.length).toBe(2);
    expect(links.history.length).toBe(1);          // original not mutated
    expect(next.history[1].to).toBe('Darrell');
  });
  it('taskHistory reads links.history and defaults to []', () => {
    expect(taskHistory({ links: { history: [{ to: 'Ari' }] } })).toHaveLength(1);
    expect(taskHistory({ links: {} })).toEqual([]);
    expect(taskHistory({})).toEqual([]);
  });
  // proven-to-catch: a push must both change owner and log the reason.
  it('simulated round-trip: Darrell pushes to Ari, Ari pushes back — both logged', () => {
    let task = { owner: 'Darrell', links: {} };
    // Darrell -> Ari
    let entry = makeHandoff({ at: '2026-07-01T10:00:00Z', from: normalizeOwner(task.owner), to: 'Ari', by: 'darrell', note: 'this is system work' });
    task = { ...task, owner: 'Ari', links: appendHistory(task.links, entry) };
    // Ari -> Darrell
    entry = makeHandoff({ at: '2026-07-01T11:00:00Z', from: normalizeOwner(task.owner), to: 'Darrell', by: 'Ari', note: 'need your decision' });
    task = { ...task, owner: 'Darrell', links: appendHistory(task.links, entry) };

    expect(task.owner).toBe('Darrell');
    const h = taskHistory(task);
    expect(h.map((e) => `${e.from}->${e.to}`)).toEqual(['Darrell->Ari', 'Ari->Darrell']);
    expect(h[0].note).toBe('this is system work');
  });
});

describe('handoff targets — the two-way channel', () => {
  it('offers Ari and Darrell as the two principals', () => {
    expect(HANDOFF_TARGETS.map((t) => t.value)).toEqual([AI_OWNER, 'Darrell']);
  });
});
