// properties/readiness — the door's guest-ready checklist, as an engine.
// Every assertion here is about REAL state: what the template says, what the
// rows say, and what the two together mean. Nothing is seeded, so "no row" has
// to read correctly — that is the first thing proven.
import { describe, it, expect } from 'vitest';
import {
  READINESS_SECTIONS, BEDROOM_TASKS, READY_STATUS_ORDER,
  readinessBoardSlug, isReadinessBoard, readinessSlug, bedroomsOf, costOf,
  normalizeReadyStatus, templateFor, readinessTally, readinessBoard,
  rowForTask, patchForTask, buildCustomTask,
} from '../modules/properties/readiness.js';
import { isProgramBoard, boardsFromTasks } from '../lib/board.js';

const SLUG = readinessBoardSlug('1003-koehn');
const ROOMS = [
  { id: 'r1', name: 'Front bedroom', kind: 'bedroom' },
  { id: 'r2', name: 'Back bedroom', kind: 'bedroom' },
  { id: 'r3', name: 'Kitchen', kind: 'kitchen' },
  { id: 'r4', name: 'Old bedroom', kind: 'bedroom', archived_at: '2026-01-01' },
];

const row = (task, over = {}) => ({
  slug: task.slug, boardSlug: SLUG, boardTitle: 'door', title: task.title,
  status: 'not-started', group: task.group, sortRank: task.sortRank,
  notes: null, links: { readiness: { section: task.sectionId } }, ...over,
});

describe('the template', () => {
  it('carries the nine areas the checklist was asked for', () => {
    expect(READINESS_SECTIONS.map((s) => s.id)).toEqual([
      'construction', 'kitchen', 'bedrooms', 'bathroom', 'living',
      'supplies', 'safety', 'walkthrough', 'listing',
    ]);
  });

  it('holds 165 fixed tasks plus 16 per bedroom', () => {
    const fixed = READINESS_SECTIONS.filter((s) => !s.perBedroom)
      .reduce((n, s) => n + s.tasks.length, 0);
    expect(fixed).toBe(165);
    expect(BEDROOM_TASKS.length).toBe(16);
  });

  it('expands bedrooms against the door’s REAL rooms, live ones only', () => {
    expect(bedroomsOf(ROOMS).map((b) => b.name)).toEqual(['Front bedroom', 'Back bedroom']);
    expect(templateFor(SLUG, ROOMS).length).toBe(165 + 32);
  });

  it('paints no bedroom when none is recorded — the section is simply empty', () => {
    expect(templateFor(SLUG, []).length).toBe(165);
    const board = readinessBoard(SLUG, [], []);
    expect(board.sections.find((s) => s.id === 'bedrooms').tasks).toEqual([]);
  });

  it('gives every task a slug that carries its door', () => {
    const slugs = templateFor(SLUG, ROOMS).map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs.every((s) => s.startsWith('airbnb-ready:1003-koehn:'))).toBe(true);
    expect(readinessSlug(SLUG, 'kitchen:0')).toBe('airbnb-ready:1003-koehn:kitchen:0');
  });
});

describe('reading the door with no rows at all', () => {
  const board = readinessBoard(SLUG, [], ROOMS);

  it('reads every task as Not Started, because that is what it is', () => {
    expect(board.tasks.every((t) => t.status === 'not-started' && t.row === null)).toBe(true);
    expect(board.tally).toMatchObject({ total: 197, done: 0, left: 197, pct: 0, cost: 0 });
  });

  it('still groups bedrooms by their real names', () => {
    const beds = board.sections.find((s) => s.id === 'bedrooms');
    expect(beds.groups.map((g) => g.name)).toEqual(['Front bedroom', 'Back bedroom']);
    expect(beds.groups[0].tasks.length).toBe(16);
  });
});

describe('reading the door with real rows', () => {
  const tpl = templateFor(SLUG, ROOMS);
  const kitchen = tpl.filter((t) => t.sectionId === 'kitchen');

  it('counts done, in-progress and remaining cost from the rows', () => {
    const rows = [
      row(kitchen[0], { status: 'done' }),
      row(kitchen[1], { status: 'done' }),
      row(kitchen[2], { status: 'in-progress', links: { readiness: { section: 'kitchen', cost: 450 } } }),
      row(kitchen[3], { links: { readiness: { section: 'kitchen', cost: 1250 } } }),
    ];
    const board = readinessBoard(SLUG, rows, ROOMS);
    expect(board.tally).toMatchObject({ done: 2, started: 1, cost: 1700 });
    expect(board.sections.find((s) => s.id === 'kitchen').tally.done).toBe(2);
  });

  it('never counts the cost of something already finished', () => {
    const rows = [row(kitchen[0], { status: 'done', links: { readiness: { section: 'kitchen', cost: 900 } } })];
    expect(readinessBoard(SLUG, rows, ROOMS).tally.cost).toBe(0);
  });

  it('reads a blocked row as started, not as untouched', () => {
    expect(normalizeReadyStatus('blocked')).toBe('in-progress');
    expect(normalizeReadyStatus('nonsense')).toBe('not-started');
    expect(READY_STATUS_ORDER).toEqual(['not-started', 'in-progress', 'done']);
  });

  it('ignores a nonsense cost instead of showing one', () => {
    expect(costOf({ links: { readiness: { cost: -5 } } })).toBeNull();
    expect(costOf({ links: { readiness: { cost: 'free' } } })).toBeNull();
    expect(costOf(null)).toBeNull();
    expect(costOf({ links: { readiness: { cost: 42 } } })).toBe(42);
  });

  it('takes the row’s title and note over the template’s', () => {
    const rows = [row(kitchen[0], { title: 'Refrigerator (counter-depth)', notes: 'Lowes #4471' })];
    const t = readinessBoard(SLUG, rows, ROOMS).tasks.find((x) => x.slug === kitchen[0].slug);
    expect(t.title).toBe('Refrigerator (counter-depth)');
    expect(t.note).toBe('Lowes #4471');
  });

  it('drops a task the landlord removed, and keeps one he added', () => {
    const rows = [
      row(kitchen[0], { links: { readiness: { section: 'kitchen', removed: true } } }),
      { slug: `${SLUG}:x:abc`, boardSlug: SLUG, title: 'Blender', status: 'not-started',
        group: 'Kitchen', notes: null, sortRank: 900, links: { readiness: { section: 'kitchen', custom: true } } },
    ];
    const board = readinessBoard(SLUG, rows, ROOMS);
    const titles = board.sections.find((s) => s.id === 'kitchen').tasks.map((t) => t.title);
    expect(titles).not.toContain('Refrigerator');
    expect(titles).toContain('Blender');
    expect(board.tally.total).toBe(197);
  });

  it('never reads another door’s rows', () => {
    const other = { ...row(kitchen[0], { status: 'done' }), boardSlug: readinessBoardSlug('805-prospect') };
    expect(readinessBoard(SLUG, [other], ROOMS).tally.done).toBe(0);
  });
});

describe('what gets written', () => {
  const task = templateFor(SLUG, ROOMS).find((t) => t.sectionId === 'kitchen');
  const merged = { ...task, row: null, status: 'not-started', note: '', cost: null, custom: false };

  it('writes a full row the first time a task is touched', () => {
    const r = rowForTask(merged, SLUG, '1003 Koehn', { status: 'in-progress', cost: 450 });
    expect(r).toMatchObject({ slug: task.slug, boardSlug: SLUG, boardTitle: '1003 Koehn', status: 'in-progress' });
    expect(r.links.readiness).toEqual({ section: 'kitchen', cost: 450 });
  });

  it('patches an existing row without losing what else links holds', () => {
    const withHistory = { ...merged, row: { links: { history: [{ kind: 'handoff' }], readiness: { section: 'kitchen', cost: 450 } } } };
    const patch = patchForTask(withHistory, { cost: 600, note: 'ordered' });
    expect(patch.links.history).toEqual([{ kind: 'handoff' }]);
    expect(patch.links.readiness.cost).toBe(600);
    expect(patch.notes).toBe('ordered');
  });

  it('clears a cost rather than storing a null one', () => {
    const withCost = { ...merged, row: { links: { readiness: { section: 'kitchen', cost: 450 } } } };
    expect(patchForTask(withCost, { cost: null }).links.readiness.cost).toBeUndefined();
  });

  it('records a removal as a mark, so the template cannot put it back', () => {
    expect(patchForTask(merged, { removed: true }).links.readiness.removed).toBe(true);
    expect(patchForTask({ ...merged, row: { links: { readiness: { removed: true } } } }, { removed: false })
      .links.readiness.removed).toBeUndefined();
  });

  it('refuses to build an empty task', () => {
    expect(buildCustomTask(SLUG, 'kitchen', 'Kitchen', '   ')).toBeNull();
    const built = buildCustomTask(SLUG, 'kitchen', 'Kitchen', '  Blender ');
    expect(built.title).toBe('Blender');
    expect(built.custom).toBe(true);
    expect(built.slug.startsWith(`${SLUG}:x:`)).toBe(true);
  });
});

describe('a door’s checklist stays out of the Projects hub', () => {
  it('is not a program board', () => {
    expect(isReadinessBoard(SLUG)).toBe(true);
    expect(isProgramBoard(SLUG)).toBe(false);
    expect(isProgramBoard('board-modular-cutover')).toBe(true);
  });

  // PROVEN-TO-CATCH: drop the filter in boardsFromTasks and this fails.
  it('never appears in the derived board list', () => {
    const tasks = [
      { boardSlug: SLUG, boardTitle: '1003 Koehn', status: 'done' },
      { boardSlug: 'board-church-infra', boardTitle: 'Church infra', status: 'done' },
    ];
    expect(boardsFromTasks(tasks).map((b) => b.slug)).toEqual(['board-church-infra']);
  });
});

describe('the tally', () => {
  it('rounds honestly and survives an empty list', () => {
    expect(readinessTally([])).toMatchObject({ total: 0, pct: 0, left: 0 });
    expect(readinessTally([{ status: 'done' }, { status: 'not-started' }, { status: 'not-started' }]).pct).toBe(33);
  });
});
