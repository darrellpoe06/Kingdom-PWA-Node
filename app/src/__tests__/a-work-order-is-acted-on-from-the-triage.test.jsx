// @vitest-environment jsdom
// =============================================================================
// A work order is acted on from the triage, end to end (DR-1215)
// =============================================================================
// Darrell, 2026-10-22, on a triage that only showed: "Fix it!!! Never wait!!!",
// "So I click it then what?!... Fix it end to end!!!", and on #4 (a recorded
// conversation filed as a work order): "That long text was for a feature and
// or requirements for the Ohio church... we should be able to move that to the
// place that makes sense for those notes!!!!" Fixtures below are made up.
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { actionsFor, fromIncident, fromRequest, MOVE_TARGETS } from '../lib/work-order-triage.js';
import WorkOrderTriage from '../components/WorkOrderTriage.jsx';

const HERE = dirname(fileURLToPath(import.meta.url));
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let container; let root;
afterEach(() => { if (root) act(() => root.unmount()); if (container) container.remove(); root = container = null; });
async function mount(props) {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => { root = createRoot(container); root.render(createElement(WorkOrderTriage, props)); });
  for (let i = 0; i < 4; i += 1) await act(async () => { await Promise.resolve(); });
}
const q = (id) => container.querySelector(`[data-testid="${id}"]`);
const click = async (el) => { await act(async () => { el.click(); }); for (let i = 0; i < 3; i += 1) await act(async () => { await Promise.resolve(); }); };
const choose = async (select, value) => {
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(select, value);
    select.dispatchEvent(new Event('change', { bubbles: true }));
  });
};
const type = async (input, value) => {
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
};

const LONG = 'or do in person Q&A for the fixture church\nline two of the requirements\n' + 'more words '.repeat(40);
const incident = (id, extra = {}) => ({
  id, createdAt: '2026-08-03T10:00:00Z', category: 'maintenance', urgency: 'incident', status: 'open', description: `fixture job ${id}`,
  lifecycle: { phase: 'open', log: [{ at: '2026-08-03T10:00:00Z', fromPhase: null, toPhase: 'open', note: 'created' }] }, ...extra,
});
const noCloud = async () => ({ ok: true, requests: [], docs: [], events: [], notes: [], unreadable: [] });

describe('what can be done next, by each store\'s own rules', () => {
  it('an open incident can be started, resolved, moved, given to a worker and noted; a closed one reopened', () => {
    const a = actionsFor(fromIncident(incident('i1')));
    expect(a.moves.map((m) => m.to)).toEqual(['in-progress', 'resolved']);
    expect(a).toMatchObject({ canAssign: true, canNote: true, canMove: true });
    expect(actionsFor(fromIncident(incident('i2', { status: 'resolved' }))).moves.map((m) => m.to)).toEqual(['open']);
  });
  it('PROVEN TO CATCH: a Poe Properties work order is only offered the moves its own machine allows', () => {
    const submitted = actionsFor(fromRequest({ id: 'r1', status: 'submitted', created_at: '2026-10-01T00:00:00Z' }));
    expect(submitted.moves.map((m) => m.to)).toEqual(['received', 'cancelled']);
    expect(submitted.moves.map((m) => m.to)).not.toContain('resolved');
    expect(actionsFor(fromRequest({ id: 'r2', status: 'resolved', created_at: '2026-10-01T00:00:00Z' })).moves).toEqual([]);
  });
  it('the places a thought can be moved to are the Thinking Space\'s own', () => {
    const routing = readFileSync(join(HERE, '..', 'lib', 'one-voice-routing.js'), 'utf8');
    for (const t of MOVE_TARGETS) expect(routing, t.key).toContain(`key: '${t.key}'`);
  });
});

describe('tap it, then act on it', () => {
  it('PROVEN TO CATCH: a whole recorded conversation is two lines in the queue and whole when opened', async () => {
    await mount({ incidents: [incident('i4', { description: LONG })], load: noCloud });
    expect(q('work-order-title').className).toContain('line-clamp-2');
    await click(q('work-order').querySelector('button'));
    expect(q('work-order-full').textContent).toContain('line two of the requirements');
  });
  it('Resolve writes through updateIncident with its note, and the card says so after the row leaves the open list', async () => {
    const updateIncident = vi.fn();
    await mount({ incidents: [incident('i1')], updateIncident, load: noCloud });
    await click(q('work-order').querySelector('button'));
    await click(q('work-order-move-resolved'));
    expect(updateIncident).toHaveBeenCalledWith('i1', expect.objectContaining({ status: 'resolved', _note: 'Resolve (from the triage)' }));
    expect(q('work-order-last').textContent).toBe('#1: Done: Resolve.');
  });
  it('Move it sends the words, whole, to where they belong, then closes the work order as converted', async () => {
    const updateIncident = vi.fn();
    const poetech = vi.fn();
    await mount({ incidents: [incident('i4', { description: LONG })], updateIncident, movers: { poetech, private: vi.fn() }, load: noCloud });
    await click(q('work-order').querySelector('button'));
    await choose(q('work-order-move').querySelector('select'), 'poetech');
    await click(q('work-order-move-go'));
    expect(poetech).toHaveBeenCalledWith(LONG.trim());
    expect(updateIncident).toHaveBeenCalledWith('i4', expect.objectContaining({ status: 'converted' }));
    expect(updateIncident.mock.calls[0][1]._note).toMatch(/Moved to PoeTech/);
    expect(q('work-order-last').textContent).toMatch(/^#1: Moved to PoeTech .*its words are kept/);
  });
  it('PROVEN TO CATCH: a move never closes the work order when the words had nowhere to go', async () => {
    const updateIncident = vi.fn();
    await mount({ incidents: [incident('i4')], updateIncident, movers: { poetech: () => { throw new Error('the directive could not be saved'); } }, load: noCloud });
    await click(q('work-order').querySelector('button'));
    await choose(q('work-order-move').querySelector('select'), 'poetech');
    await click(q('work-order-move-go'));
    expect(updateIncident).not.toHaveBeenCalled();
    expect(q('work-order-last').textContent).toMatch(/Not saved: the directive could not be saved/);
  });
  it('gives it to a worker through workerOps, and adds a note to its log', async () => {
    const updateIncident = vi.fn();
    const onAssign = vi.fn();
    await mount({ incidents: [incident('i1')], updateIncident, workerOps: { onAssign }, contractors: [{ id: 'c1', name: 'Fixture Worker' }], load: noCloud });
    await click(q('work-order').querySelector('button'));
    await choose(container.querySelector('#wo-worker-inc-i1'), 'c1');
    await click(q('work-order-assign'));
    expect(onAssign).toHaveBeenCalledWith('i1', expect.objectContaining({ name: 'Fixture Worker' }), 'contractor');
    await type(container.querySelector('#wo-note-inc-i1'), 'called the tenant');
    await act(async () => { container.querySelector('#wo-note-inc-i1').form.requestSubmit(); });
    expect(updateIncident).toHaveBeenCalledWith('i1', { _logNote: 'called the tenant' });
  });
  it('a Poe Properties work order moves through its own store, is re-read, and a refusal is said', async () => {
    let reads = 0;
    const load = async () => { reads += 1; return { ok: true, requests: [{ id: 'r1', status: 'submitted', title: 'fixture leak', created_at: '2026-10-01T00:00:00Z' }], docs: [], events: [], notes: [], unreadable: [] }; };
    const requestOps = { setStatus: vi.fn(async () => ({ ok: true })), assign: vi.fn(), note: vi.fn() };
    await mount({ incidents: [], requestOps, load });
    await click(q('work-order').querySelector('button'));
    await click(q('work-order-move-received'));
    expect(requestOps.setStatus).toHaveBeenCalledWith('r1', 'received');
    expect(reads).toBe(2);
    requestOps.setStatus.mockResolvedValueOnce({ ok: false, reason: 'write-failed', error: 'permission denied' });
    await click(q('work-order').querySelector('button'));
    await click(q('work-order').querySelector('button'));
    await click(q('work-order-move-cancelled'));
    expect(q('work-order-last').textContent).toMatch(/Not saved: permission denied/);
  });
});

describe('the road is wired to the stores, on both screens', () => {
  const read = (...p) => readFileSync(join(HERE, '..', ...p), 'utf8');
  it('the shell hands the home the writers, on its existing mount line', () => {
    const line = read('poe-financial-mvp-v28.jsx').split('\n').find((l) => l.includes("{view === 'overview' && <SectionBoundary name=\"Overview\"><Home "));
    for (const p of ['updateIncident={updateIncident}', 'sendToPoeTech={sendNoteToPoeTech}', 'addChurchVoice={addChurchVoice}', 'addPrayerRequest={addPrayerRequest}', 'workerOps={workerOps}', 'addNote={addNote}']) expect(line, p).toContain(p);
  });
  it('the Life Hub and Big Picture both pass them to the triage', () => {
    expect(read('components', 'BigPictureDashboard.jsx')).toMatch(/workOrderOps=\{\{ updateIncident: props\.updateIncident/);
    expect(read('components', 'BigPictureDashboard.jsx')).toMatch(/<WorkOrderTriage incidents=\{incidents\} rentals=\{rentals\} updateIncident=\{updateIncident\} workerOps=\{workerOps\}/);
    expect(read('components', 'LifeHub.jsx')).toMatch(/<WorkOrderTriage [^>]*\{\.\.\.\(workOrderOps \|\| \{\}\)\} \/>/);
  });
});
