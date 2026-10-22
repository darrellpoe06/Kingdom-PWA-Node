// @vitest-environment jsdom
// =============================================================================
// A building's work order, from the call to the close, with its workers and
// its result (DR-1216)
// =============================================================================
// Darrell, 2026-10-22: "805 N Prospect Ave Champaign IL the building... not one
// of the apartments... we need work done in the foyer... and other basement
// activities... how do we add a work order from scratch", "Also seeing all
// workers outstanding and just a place to review the results", "There is only
// 4 apartments in the building", "We were splitting apt 4", "Our projects tab
// has work orders", "This need better quality and more clear quality control
// and visuals", "We want the best sustainable solutions!!!". The 805 fixture
// mirrors the live shape building-probe measured (five door records, one with
// the building label, "Apt 4" twice); the words are made up.
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildingsOf, buildingRecordGaps, splitHalfLabel, groupDoorsByBuilding } from '../lib/building-group.js';
import {
  newWorkOrder, fromIncident, triageQueue, workersBoard, resultsToReview, progressOf, ageOf,
  requiresResult, closingChecks, actionsFor, isPropertyBoardTask,
} from '../lib/work-order-triage.js';
import WorkOrderTriage from '../components/WorkOrderTriage.jsx';
import BuildingTools from '../components/BuildingTools.jsx';

const HERE = dirname(fileURLToPath(import.meta.url));
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let container; let root;
afterEach(() => { if (root) act(() => root.unmount()); if (container) container.remove(); root = container = null; });
async function mount(el, props) {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => { root = createRoot(container); root.render(createElement(el, props)); });
  for (let i = 0; i < 4; i += 1) await act(async () => { await Promise.resolve(); });
}
const q = (id) => container.querySelector(`[data-testid="${id}"]`);
const qa = (id) => [...container.querySelectorAll(`[data-testid="${id}"]`)];
const click = async (el) => { await act(async () => { el.click(); }); for (let i = 0; i < 3; i += 1) await act(async () => { await Promise.resolve(); }); };
const setValue = async (el, value) => {
  const proto = el.tagName === 'SELECT' ? HTMLSelectElement.prototype : el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  await act(async () => {
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value);
    el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
  });
};
const noCloud = async () => ({ ok: true, requests: [], docs: [], events: [], notes: [], unreadable: [] });
const noTasks = () => [];

// The live shape (building-probe, 2026-10-22), with made-up names.
const BLDG = 'Fixture Bldg 805';
const DOORS = [
  { id: 'd1', address: '805 Fixture Ave', building: BLDG, unitLabel: 'Apt 1', name: '805 Fixture Ave Apt 1', status: 'paying' },
  { id: 'd2', address: '805 Fixture Ave', unitLabel: 'Apt 2', name: '805 Fixture Ave', status: 'unrented' },
  { id: 'd3', address: '805 Fixture Ave', unitLabel: 'Apt 3', name: '805 Fixture Ave Apt 3', status: 'paying' },
  { id: 'd4', address: '805 Fixture Ave', unitLabel: 'Apt 4', name: 'Fixture four', status: 'paying' },
  { id: 'd5', address: '805 Fixture Ave', unitLabel: 'Apt 4', name: 'Fixture four too', status: 'unrented' },
  { id: 'x1', address: '9 Other St', name: '9 Other St', status: 'paying' },
];
const incident = (id, extra = {}) => ({
  id, createdAt: '2026-10-01T10:00:00Z', category: 'maintenance', urgency: 'incident', status: 'open', description: `fixture job ${id}`,
  lifecycle: { phase: 'open', log: [{ at: '2026-10-01T10:00:00Z', fromPhase: null, toPhase: 'open', note: 'created' }] }, ...extra,
});

describe('the building is one building, read from its own doors', () => {
  it('PROVEN TO CATCH: five door records with ONE building label still read as one building (the 805 regression)', () => {
    const b = buildingsOf(DOORS);
    expect(b).toHaveLength(1);
    expect(b[0]).toMatchObject({ key: BLDG });
    expect(b[0].doors.map((d) => d.id)).toEqual(['d1', 'd2', 'd3', 'd4', 'd5']);
    expect(groupDoorsByBuilding(DOORS).filter((e) => e.type === 'single').map((e) => e.rental.id)).toEqual(['x1']);
  });
  it('two different building labels at one address are not guessed together', () => {
    const complex = [
      { id: 'a', address: '1 Court', building: 'North' }, { id: 'b', address: '1 Court', building: 'North' },
      { id: 'c', address: '1 Court', building: 'South' }, { id: 'd', address: '1 Court' },
    ];
    const keys = groupDoorsByBuilding(complex).map((e) => (e.type === 'building' ? e.key : `single:${e.rental.id}`));
    expect(keys).toEqual(['North', 'single:c', 'single:d']);
  });
  it('counts apartments by unit label, and names what the record is missing', () => {
    const g = buildingRecordGaps(buildingsOf(DOORS)[0].doors, BLDG);
    expect(g).toMatchObject({ apartments: 4, records: 5 });
    expect(g.missingLabel.map((d) => d.id)).toEqual(['d2', 'd3', 'd4', 'd5']);
    expect(g.duplicates.map((d) => [d.label, d.doors.length])).toEqual([['Apt 4', 2]]);
    expect(splitHalfLabel('Apt 4')).toBe('Apt 4B');
    expect(splitHalfLabel('Apt 4B')).toBe('Apt 4C');
  });
});

describe('a new work order, from scratch', () => {
  it('a building\'s work links to the building, with the part of the building first', () => {
    const { item } = newWorkOrder({ where: { kind: 'building', key: BLDG }, area: 'Foyer and entry', words: 'replace the light', urgency: 'change' });
    expect(item).toMatchObject({ description: 'Foyer and entry: replace the light', linkedTo: { type: 'building', id: BLDG }, urgency: 'change', status: 'open', category: 'maintenance', entityId: 'e-poeprops' });
    expect(fromIncident({ ...item, id: 'n1' }).door).toBe(`${BLDG} (the building)`);
  });
  it('one apartment\'s work links to that door', () => {
    expect(newWorkOrder({ where: { kind: 'door', id: 'd3' }, words: 'drip' }).item.linkedTo).toEqual({ type: 'rental', id: 'd3' });
  });
  it('PROVEN TO CATCH: no words, no work order', () => {
    expect(newWorkOrder({ where: { kind: 'building', key: BLDG }, words: '  ' })).toEqual({ error: 'Say what needs doing first.' });
  });
  it('the triage form files it through addIncident and opens it in the queue', async () => {
    const addIncident = vi.fn(() => 'in-new');
    await mount(WorkOrderTriage, { incidents: [], rentals: DOORS, addIncident, load: noCloud, useTasks: noTasks });
    await click(q('work-order-new'));
    expect(q('work-order-new-form').querySelector('#wo-new-where').value).toBe(`b:${BLDG}`);
    await setValue(container.querySelector('#wo-new-area'), 'Basement');
    await setValue(container.querySelector('#wo-new-words'), 'clear the floor drain');
    await click(q('work-order-new-save'));
    expect(addIncident).toHaveBeenCalledWith(expect.objectContaining({ description: 'Basement: clear the floor drain', linkedTo: { type: 'building', id: BLDG } }));
    expect(q('work-order-last').textContent).toMatch(/^Saved: Basement: clear the floor drain/);
  });
  it('PROVEN TO CATCH: with no building to lead with, nothing is filed until the person picks where', async () => {
    const addIncident = vi.fn(() => 'in-x');
    await mount(WorkOrderTriage, { incidents: [], rentals: [DOORS[5]], addIncident, load: noCloud, useTasks: noTasks });
    await click(q('work-order-new'));
    expect(container.querySelector('#wo-new-where').value).toBe('');
    await setValue(container.querySelector('#wo-new-words'), 'fixture job');
    await click(q('work-order-new-save'));
    expect(addIncident).not.toHaveBeenCalled();
    expect(q('work-order-new-error').textContent).toBe('Pick where the work is first.');
    await setValue(container.querySelector('#wo-new-where'), 'd:x1');
    await click(q('work-order-new-save'));
    expect(addIncident).toHaveBeenCalledWith(expect.objectContaining({ linkedTo: { type: 'rental', id: 'x1' } }));
  });
});

describe('every worker\'s open work, and the results to review', () => {
  const crew = (status) => ({ dispatch: { assignments: [{ id: 'a1', name: 'Fixture Worker', status, contractorId: 'c1' }] } });
  const q1 = triageQueue({ incidents: [incident('i1', crew('assigned')), incident('i2', crew('done')), incident('i3')] });
  it('a worker\'s open work is every open work order their name is on, with their own piece', () => {
    const board = workersBoard(q1, [{ name: 'Fixture Worker' }, { name: 'Idle Fixture' }]);
    expect(board.busy).toHaveLength(1);
    expect(board.busy[0]).toMatchObject({ name: 'Fixture Worker', doneOpen: 1 });
    expect(board.busy[0].open.map((o) => o.w.key)).toEqual(['inc-i1', 'inc-i2']);
    expect(board.idle).toEqual(['Idle Fixture']);
  });
  it('a result waits on review when the workers finished and the work order is still open', () => {
    expect(resultsToReview(q1).waiting.map((w) => w.key)).toEqual(['inc-i2']);
  });
  it('the views say so on the card', async () => {
    await mount(WorkOrderTriage, { incidents: [incident('i1', crew('assigned')), incident('i2', crew('done'))], load: noCloud, useTasks: noTasks });
    expect(q('work-order-view-review').textContent).toBe('To review · 1');
    await click(q('work-order-view-workers'));
    expect(q('work-order-worker').textContent).toMatch(/Fixture Worker.*1 to do · 1 done, waiting on your review/);
    await click(q('work-order-view-review'));
    expect(qa('work-order')).toHaveLength(1);
  });
  it('send it back reopens the worker\'s part and logs why', async () => {
    const updateIncident = vi.fn();
    const onReopen = vi.fn();
    await mount(WorkOrderTriage, { incidents: [incident('i2', crew('done'))], updateIncident, workerOps: { onReopen }, load: noCloud, useTasks: noTasks });
    await click(q('work-order').querySelector('button'));
    await click(q('work-order-send-back'));
    expect(onReopen).toHaveBeenCalledWith('i2', 'a1');
    expect(updateIncident).toHaveBeenCalledWith('i2', { _logNote: 'Sent back to the worker from the triage review' });
  });
});

describe('quality control you can see', () => {
  it('the track is read from the record: came in, worker on it, work done, checked and closed', () => {
    const w = fromIncident(incident('i9', { dispatch: { assignments: [{ id: 'a', name: 'W', status: 'done' }] } }));
    expect(progressOf(w).map((s) => s.done)).toEqual([true, true, true, false]);
    expect(progressOf(fromIncident(incident('i8'))).map((s) => s.done)).toEqual([true, false, false, false]);
  });
  it('PROVEN TO CATCH: an open work order past its due date says so', () => {
    const w = fromIncident(incident('i7', { dueDate: '2026-10-03' }));
    expect(ageOf(w, Date.parse('2026-10-10T12:00:00Z'))).toMatchObject({ days: 9, overdue: true, label: 'open 9 days · past due' });
    expect(ageOf(w, Date.parse('2026-10-03T12:00:00Z')).overdue).toBe(false);
  });
  it('a close names what is unchecked before it happens', () => {
    const checks = closingChecks(fromIncident(incident('i6', { dispatch: { assignments: [{ id: 'a', name: 'W', status: 'assigned' }] } })));
    expect(checks[0]).toEqual({ ok: false, text: 'Not every worker has marked their part done (W).' });
    expect(requiresResult('resolved') && requiresResult('done') && !requiresResult('in-progress')).toBe(true);
  });
  it('PROVEN TO CATCH: Resolve never closes without the result in words, and the result is kept', async () => {
    const updateIncident = vi.fn();
    await mount(WorkOrderTriage, { incidents: [incident('i1')], updateIncident, load: noCloud, useTasks: noTasks });
    await click(q('work-order').querySelector('button'));
    await click(q('work-order-move-resolved'));
    expect(q('work-order-checks').textContent).toMatch(/No worker was put on this work order/);
    expect(q('work-order-close-go').disabled).toBe(true);
    await click(q('work-order-close-go'));
    expect(updateIncident).not.toHaveBeenCalled();
    await setValue(q('work-order-close').querySelector('textarea'), 'swapped the fixture');
    await click(q('work-order-close-go'));
    expect(updateIncident).toHaveBeenCalledWith('i1', expect.objectContaining({ status: 'resolved', _note: 'Resolve: swapped the fixture' }));
  });
  it('a Poe Properties close writes the result to its record first, then moves it', async () => {
    const order = [];
    const requestOps = { setStatus: vi.fn(async () => { order.push('status'); return { ok: true }; }), assign: vi.fn(), note: vi.fn(async (r, body) => { order.push(body); return { ok: true }; }) };
    const load = async () => ({ ok: true, requests: [{ id: 'r1', status: 'in-progress', title: 'fixture leak', created_at: '2026-10-01T00:00:00Z' }], docs: [], events: [], notes: [], unreadable: [] });
    await mount(WorkOrderTriage, { incidents: [], requestOps, load, useTasks: noTasks });
    await click(q('work-order').querySelector('button'));
    await click(q('work-order-move-resolved'));
    await setValue(q('work-order-close').querySelector('textarea'), 'new trap');
    await click(q('work-order-close-go'));
    expect(order).toEqual(['Result: new trap', 'status']);
  });
});

describe('the gaps walked out of the procedure', () => {
  const closedBy = (note) => incident('ic', { status: 'resolved', lifecycle: { phase: 'resolved', log: [
    { at: '2026-10-01T10:00:00Z', fromPhase: null, toPhase: 'open', note: 'created' },
    { at: '2026-10-02T10:00:00Z', fromPhase: 'open', toPhase: 'resolved', note },
  ] } });
  it('PROVEN TO CATCH: a close from the one-tap Resolve elsewhere reads as closed with no result written', () => {
    const bare = fromIncident(closedBy('Marked resolved'));
    expect(bare.resultWritten).toBe(false);
    expect(progressOf(bare)[3]).toMatchObject({ label: 'No result', warn: true });
    expect(fromIncident(closedBy('Resolve: swapped the fixture')).resultWritten).toBe(true);
  });
  it('the review list shows it, so it is seen and not buried', async () => {
    await mount(WorkOrderTriage, { incidents: [{ ...closedBy('Marked resolved'), dispatch: { assignments: [{ id: 'a', name: 'W', status: 'done' }] } }], load: noCloud, useTasks: noTasks });
    await click(q('work-order-view-review'));
    expect(q('work-order-tone').textContent).toBe('No result written');
  });
  it('a worker with a phone on record can be texted the job; nothing is sent on its own', async () => {
    const w = incident('it', { description: 'Basement: clear the drain', linkedTo: { type: 'building', id: BLDG }, dispatch: { assignments: [{ id: 'a1', name: 'Fixture Worker', status: 'assigned', contractorId: 'c1' }] } });
    await mount(WorkOrderTriage, { incidents: [w], contractors: [{ id: 'c1', name: 'Fixture Worker', phone: '(217) 555-0100' }], updateIncident: vi.fn(), load: noCloud, useTasks: noTasks });
    await click(q('work-order').querySelector('button'));
    const link = q('work-order-text').querySelector('a');
    expect(link.textContent).toBe('Text the job to Fixture Worker');
    expect(link.getAttribute('href')).toBe(`sms:2175550100?&body=${encodeURIComponent(`Work order #1 at ${BLDG} (the building): Basement: clear the drain`)}`);
  });
});

describe('the Projects boards\' property work is in the same queue', () => {
  const task = (slug, extra = {}) => ({ slug, id: slug, boardSlug: 'airbnb-ready:d2', boardTitle: '805', title: `fixture item ${slug}`, group: 'Construction & Repairs', status: 'not-started', owner: null, notes: null, links: {}, createdAt: '2026-09-12T00:00:00Z', ...extra });
  it('only a property board joins; a program board stays on Projects', () => {
    expect(isPropertyBoardTask(task('t1'))).toBe(true);
    expect(isPropertyBoardTask(task('t2', { boardSlug: 'board-moore-divahs' }))).toBe(false);
    const queue = triageQueue({ tasks: [task('t1'), task('t2', { boardSlug: 'board-moore-divahs' }), task('t3', { status: 'done' })], doorLabelOf: ({ localId }) => (localId === 'd2' ? 'Fixture Apt 2' : '') });
    expect(queue.open.map((w) => [w.key, w.door, w.title])).toEqual([['task-t1', 'Fixture Apt 2', 'Construction & Repairs: fixture item t1']]);
    expect(queue.closed.map((w) => w.key)).toEqual(['task-t3']);
    expect(actionsFor(queue.open[0]).moves.map((m) => m.to)).toEqual(['in-progress', 'done']);
  });
  it('PROVEN TO CATCH: a board item\'s Done carries its result into its notes, through the board\'s own store', async () => {
    const patch = vi.fn();
    const tasks = [task('t1')];
    await mount(WorkOrderTriage, { incidents: [], rentals: DOORS, load: noCloud, useTasks: () => tasks, taskOps: { patch }, contractors: [{ id: 'c1', name: 'Fixture Worker' }] });
    await click(q('work-order').querySelector('button'));
    await setValue(container.querySelector('#wo-worker-task-t1'), 'c1');
    await click(q('work-order-assign'));
    expect(patch).toHaveBeenCalledWith(tasks[0], { owner: 'Fixture Worker' });
    await click(q('work-order-move-done'));
    await setValue(q('work-order-close').querySelector('textarea'), 'patched and painted');
    await click(q('work-order-close-go'));
    expect(patch).toHaveBeenLastCalledWith(tasks[0], { status: 'done', notes: 'Result: patched and painted' });
  });
});

describe('the building\'s own strip in Real Estate', () => {
  const entry = groupDoorsByBuilding(DOORS).find((e) => e.type === 'building');
  it('writes the building name on the doors missing it, and names the split half apart', async () => {
    const updateRental = vi.fn();
    await mount(BuildingTools, { entry, incidents: [], addIncident: vi.fn(), updateRental });
    expect(q('building-count').textContent).toBe('5 doors · 2 named Apt 4 · 0 open building work orders');
    await click(q('building-fill-go'));
    expect(updateRental.mock.calls.map((c) => c[0])).toEqual(['d2', 'd3', 'd4', 'd5']);
    expect(updateRental).toHaveBeenCalledWith('d2', { building: BLDG });
    updateRental.mockClear();
    expect(q('building-split-half').querySelector('input').value).toBe('Apt 4B');
    await click(q('building-split-save'));
    expect(updateRental).toHaveBeenCalledWith('d5', { unitLabel: 'Apt 4B', name: '805 Fixture Ave Apt 4B' });
  });
  it('lists the building\'s open work and files a new one for a part of it', async () => {
    const addIncident = vi.fn();
    const open = incident('ib', { description: 'Hallways and stairs: fixture rail', linkedTo: { type: 'building', id: BLDG } });
    await mount(BuildingTools, { entry, incidents: [open, incident('ir', { linkedTo: { type: 'rental', id: 'd3' } })], addIncident, updateRental: vi.fn() });
    expect(q('building-work-orders').textContent).toContain('Hallways and stairs: fixture rail');
    expect(q('building-count').textContent).toMatch(/1 open building work order$/);
    await click(q('building-work-order-new'));
    await setValue(container.querySelector('#bt-words-Fixture-Bldg-805'), 'seal the floor');
    await setValue(container.querySelector('#bt-area-Fixture-Bldg-805'), 'Basement');
    await click(q('building-work-order-save'));
    expect(addIncident).toHaveBeenCalledWith(expect.objectContaining({ description: 'Basement: seal the floor', linkedTo: { type: 'building', id: BLDG } }));
  });
  it('is mounted under every building header, with the shell\'s writers', () => {
    const src = readFileSync(join(HERE, '..', 'components', 'Rentals.jsx'), 'utf8');
    expect(src).toContain('<BuildingTools entry={e} incidents={incidents} addIncident={addIncident} updateRental={updateRental} readOnly={readOnly} />');
  });
});

describe('Projects is a menu of pages, not a long scroll', () => {
  const src = readFileSync(join(HERE, '..', 'components', 'Projects.jsx'), 'utf8');
  it('four areas, each with its own row of pages, and Work orders is one of them', () => {
    for (const g of ["id: 'work'", "id: 'voices'", "id: 'reviews'", "id: 'build'"]) expect(src, g).toContain(g);
    expect(src).toContain("['work-orders', 'Work orders',");
    expect(src).toMatch(/id === 'work-orders' && \(\s*<WorkOrderTriage incidents=\{incidents\} rentals=\{rentals\} contractors=\{contractors\} \{\.\.\.\(workOrderOps \|\| \{\}\)\} \/>/);
    expect(src).toMatch(/<SectionTabs\s+variant="sub"/);
  });
  it('PROVEN TO CATCH: the stats, the forecast, the phase walk and the list are each their own page', () => {
    expect(src).toContain("{part === 'list' && scoped.length > 0 && (");
    expect(src).toContain("{part === 'workload' && scoped.length > 0 && (");
    expect(src).toContain("{part === 'phases' && <BoardsOnTimeline tasks={boardTasks} projects={scoped} />}");
    expect(src).not.toMatch(/\n\s*<BoardsOnTimeline tasks=\{boardTasks\} projects=\{scoped\} \/>\n/);
    expect(src).not.toContain('See your whole life at once.');
  });
  it('the shell hands Projects the work-order writers on its existing mount line', () => {
    const line = readFileSync(join(HERE, '..', 'poe-financial-mvp-v28.jsx'), 'utf8').split('\n').find((l) => l.includes('<ProjectsWrapper '));
    expect(line).toContain('workOrderOps={{ updateIncident, addIncident, workerOps, movers: { poetech: sendNoteToPoeTech, pastor: addChurchVoice, prayer: addPrayerRequest, private: addNote } }}');
  });
});
