// =============================================================================
// Words you can see become what you tick, in one press (DR-1200)
// =============================================================================
// Darrell, 2026-10-21: "we can say create and have a check box for what is
// possible then it will create." The pure plan and the rendered row, with the
// roads faked at their seams (the lesson door, the build queue, Research).
import { describe, it, expect, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { CREATE_TARGETS, defaultTargets, createProblem, createFromWords, createdLine } from '../lib/create-from-words.js';
import CreateFromWords from '../components/CreateFromWords.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const roads = () => {
  const sent = [];
  return {
    sent,
    relay: async ({ body, tags, source }) => { sent.push({ road: 'inbox', body, tags, source }); return { ok: true, id: `r${sent.length}` }; },
    poetech: async ({ body }) => { sent.push({ road: 'build', body }); return { relayed: true, filed: true }; },
  };
};

describe('the plan', () => {
  it('three roads, a lesson\'s words start ticked as a lesson, and Create says why it waits', () => {
    expect(CREATE_TARGETS.map((t) => t.id)).toEqual(['lesson', 'build', 'research']);
    expect(defaultTargets('lesson')).toEqual(['lesson']);
    expect(defaultTargets('poetech')).toEqual([]);
    expect(createProblem('', ['lesson'])).toMatch(/no words/);
    expect(createProblem('words', [])).toBe('Tick at least one to create.');
    expect(createProblem('words', ['research'])).toBe('');
  });
  it('one row per box ticked, down the roads that already exist, with no name tag on a lesson', async () => {
    const r = roads();
    const out = await createFromWords({ body: '  The Maya and the corn men.  ', targets: ['research', 'lesson', 'build'], relay: r.relay, poetech: r.poetech });
    expect(out.map((x) => [x.id, x.ok])).toEqual([['lesson', true], ['build', true], ['research', true]]);
    expect(r.sent).toEqual([
      { road: 'inbox', body: 'The Maya and the corn men.', tags: ['lesson'], source: 'your-prompts-create' },
      { road: 'build', body: 'The Maya and the corn men.' },
      { road: 'inbox', body: 'The Maya and the corn men.', tags: ['research'], source: 'your-prompts-create' },
    ]);
  });
  it('a road that refuses never stops the next, and the line says which took it', async () => {
    const out = await createFromWords({
      body: 'x', targets: ['lesson', 'research'],
      relay: async ({ tags }) => (tags[0] === 'lesson' ? { ok: false, reason: 'signed-out' } : { ok: true }),
      poetech: async () => ({}),
    });
    expect(createdLine(out)).toBe('Sent as research. Not sent as a lesson (signed-out); the words are still here to try again.');
    expect(createdLine([{ id: 'lesson', ok: true }, { id: 'build', ok: true }])).toBe('Sent as a lesson and a build for PoeTech.');
  });
});

describe('the row on screen', () => {
  let container; let root;
  afterEach(() => { act(() => root.unmount()); container.remove(); });
  const mount = (props) => {
    container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
    act(() => root.render(React.createElement(CreateFromWords, props)));
  };
  const q = (sel) => container.querySelector(sel);

  it('PROVEN TO CATCH: tick, press Create once, and the words go; nothing ticked, Create waits and says why', async () => {
    const r = roads();
    mount({ body: 'The corn men could see too far.', destination: 'lesson', idBase: 'c', deps: { relay: r.relay, poetech: r.poetech } });
    expect(q('[data-testid="c-lesson"]').checked).toBe(true);
    expect(q('[data-testid="c-go"]').disabled).toBe(false);
    await act(async () => { q('[data-testid="c-research"]').click(); });
    await act(async () => { q('[data-testid="c-go"]').click(); });
    for (let i = 0; i < 4; i += 1) await act(async () => { await Promise.resolve(); });
    expect(r.sent.map((x) => x.tags ? x.tags[0] : x.road)).toEqual(['lesson', 'research']);
    expect(q('[data-testid="c-said"]').textContent).toBe('Sent as a lesson and research.');
    await act(async () => { q('[data-testid="c-lesson"]').click(); q('[data-testid="c-research"]').click(); });
    expect(q('[data-testid="c-go"]').disabled).toBe(true);
  });
  it('every box is a labelled checkbox, and Create carries the focus ring and the touch floor', () => {
    mount({ body: 'x', idBase: 'c' });
    expect(container.querySelectorAll('input[type="checkbox"]')).toHaveLength(3);
    for (const l of container.querySelectorAll('label')) expect(l.textContent.length).toBeGreaterThan(0);
    expect(q('[data-testid="c-go"]').className).toMatch(/focus:outline/);
    expect(q('[data-testid="c-go"]').className).toMatch(/min-h-\[44px\]/);
    expect(q('[data-testid="c-why"]').textContent).toBe('Tick at least one to create.');
  });
});
