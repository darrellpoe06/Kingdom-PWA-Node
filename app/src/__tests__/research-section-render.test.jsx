// @vitest-environment jsdom
// =============================================================================
// The Research section as a person meets it (DR-1172)
// =============================================================================
// Copy and behaviour tested together (DR-0691). What this pins:
//   * the section is a REAL top-level surface, registered in surfaces.js, not an
//     ask box inside the Infra Plan;
//   * an item he sent that nothing has looked into says WAITING on screen — a
//     queue that reads as finished is how an item gets lost;
//   * the unverified sentence is on the answered item, in words, on screen;
//   * a read that FAILED says so and never draws an empty list (DR-0076);
//   * sending writes ONE agent_inbox row tagged `research`, through the same
//     writer the lessons use.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const store = { rows: [], error: null, session: { user: { id: 'u1', email: 'd@example.com' } }, sent: [] };

// The read seam: agent_inbox as the section actually queries it.
vi.mock('../lib/supabase.js', () => {
  const client = {
    auth: { getSession: async () => ({ data: { session: store.session } }) },
    from: () => ({
      select: () => ({
        or: () => ({
          eq: () => ({
            order: () => ({ limit: async () => ({ data: store.error ? null : store.rows, error: store.error }) }),
          }),
        }),
      }),
    }),
  };
  return { supabase: client, default: client };
});

// The write seam: relayThought, the writer the lesson lane uses.
vi.mock('../lib/agent-inbox-sync.js', () => ({
  relayThought: async (payload) => { store.sent.push(payload); return { ok: true, reason: '', id: 'new-row' }; },
  withBuildTag: (t) => t,
}));

// ResearchTry asks the road on mount; it is not what this file is about.
vi.mock('../components/ResearchTry.jsx', () => ({ default: () => createElement('div', null, 'ask box') }));

import ResearchSection from '../components/ResearchSection.jsx';
import { surfaceById } from '../surfaces.js';
import { UNVERIFIED_NOTE } from '../lib/research-items.js';

const row = (o) => ({ id: 'a', body: '', tags: [], created_at: '2026-10-21T06:00:00Z', created_by: 'u1', ...o });
// The road is dark in these tests: health is not what is being pinned, and a
// fetch that throws is the honest stand-in for a sandbox with no route to it.
const deadFetch = async () => { throw new Error('no route'); };

describe('the Research section is a surface of its own', () => {
  // THE SHELL STILL MOUNTS IT. feature-registry.json's `source` locators are
  // grepped against this same shell, but a new registry SURFACE also needs a
  // walk in the shared feature-presence harness, and that file mocks neither
  // the agent_inbox read nor the writer this section needs — adding a global
  // supabase mock there would reach the other eleven surfaces it guards. So the
  // mount is pinned HERE, where both seams are already mocked, with the same
  // effect: remove the Research view from the shell and this fails by name.
  // Why not the registry: see DR-1172. re-review: 2026-11-04.
  it('the shell mounts the Research view', () => {
    const shell = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'poe-financial-mvp-v28.jsx'), 'utf8');
    expect(shell).toContain('<ResearchSection stranger={reviewerStranger} /'); // handed the lens's stranger mode (DR-1240)
    expect(shell).toContain("view === 'research'");
    // and the route allow-list lets a deep link reach it
    expect(shell).toContain("'research'];");
  });

  it('is registered as a top-level view, signed-in, locked when not', () => {
    const s = surfaceById['research'];
    expect(s).toBeTruthy();
    expect(s.view).toBe('research');
    expect(s.nav).toBe('top');
    expect(s.sub).toBe(null);
    expect(s.requires).toBe('signed-in');
    expect(s.whenDenied).toBe('lock');
  });
});

describe('the Research section on screen', () => {
  let container; let root;
  beforeEach(() => {
    store.rows = []; store.error = null; store.sent = [];
    store.session = { user: { id: 'u1', email: 'd@example.com' } };
    container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
  });
  afterEach(() => { act(() => root.unmount()); container.remove(); });

  const render = async () => {
    await act(async () => { root.render(createElement(ResearchSection, { fetchImpl: deadFetch })); });
    await act(async () => {});
  };

  it('an item nothing has looked into says it is waiting', async () => {
    store.rows = [row({ id: 'r1', body: 'https://youtu.be/aQgXzVSjwWg', tags: ['research'] })];
    await render();
    const text = container.textContent;
    expect(text).toContain('Waiting to be looked into');
    expect(text).toContain('Nothing has looked into this yet');
    // It must NOT read as finished.
    expect(text).not.toContain('An answer came back');
  });

  it('an answered item carries the unverified sentence and its source', async () => {
    store.rows = [
      row({ id: 'r1', body: 'which of these can we run ourselves?', tags: ['research'] }),
      row({ id: 'c1', tags: ['research-answer', 'of:r1'], body: 'Four of the six already run here.\n\nSources:\nhttps://ok.example/a\n' }),
    ];
    await render();
    const text = container.textContent;
    expect(text).toContain('An answer came back');
    expect(text).toContain('Four of the six already run here.');
    // The sentence, in words, on the item itself.
    expect(text).toContain(UNVERIFIED_NOTE);
    const link = container.querySelector('a[href="https://ok.example/a"]');
    expect(link).toBeTruthy();
    expect(link.getAttribute('rel')).toContain('noopener');
  });

  it('an answered item draws its reading: what it is, the opportunities, the constraints, and where it lands (DR-1200)', async () => {
    store.rows = [
      row({ id: 'r1', body: 'https://mt27.org/msg/x We need this inside the Love Corner App each week.', tags: ['research', 'research-answered'] }),
      row({ id: 'c1', tags: ['research-answer', 'of:r1'], body: 'Unverified: x\n\n# Transcript\nThe weekly trivia.' }),
      row({ id: 'g1', tags: ['research-reading', 'of:r1'], body: 'Unverified: x\n\nReading:\nWhat it is: A weekly trivia message.\nOpportunities:\n- A Love Corner trivia week\nConstraints:\n- Who holds the rights\nNext step: Ask the sender.\nLands: love-corner\n' }),
    ];
    await render();
    expect(container.querySelector('[data-testid="research-reading-what"]').textContent).toBe('A weekly trivia message.');
    expect(container.querySelector('[data-testid="research-reading-opportunities"]').textContent).toContain('A Love Corner trivia week');
    expect(container.querySelector('[data-testid="research-reading-constraints"]').textContent).toContain('Who holds the rights');
    expect(container.querySelector('[data-testid="research-reading-lands"]').textContent).toBe('The Love Corner App');
    expect(container.querySelector('[data-testid="create-from-words"]'), 'no Create row on the answer').toBeTruthy();
  });

  it('an answered item with no reading yet says the reading is pending, never a raw dump as the last word', async () => {
    store.rows = [
      row({ id: 'r1', body: 'a question?', tags: ['research', 'research-answered'] }),
      row({ id: 'c1', tags: ['research-answer', 'of:r1'], body: 'Unverified: x\n\nThe answer.' }),
    ];
    await render();
    expect(container.querySelector('[data-testid="research-reading-pending"]').textContent).toMatch(/^Reading pending/);
  });

  it('a read that failed says so, and does not draw an empty list', async () => {
    store.error = { message: 'permission denied' };
    await render();
    const text = container.textContent;
    expect(text).toContain('permission denied');
    expect(text).toContain('it is unknown');
    expect(text).not.toContain('You have not sent anything to look into yet');
  });

  it('having sent nothing is said plainly, and is not the same words as a failed read', async () => {
    store.rows = [];
    await render();
    expect(container.textContent).toContain('You have not sent anything to look into yet');
  });

  it('a reachable road is NOT reported as answering (DR-1110: a 200 is not a ring)', async () => {
    // MEASURED 2026-10-21: /health 200 with both models named, while /ask has
    // answered 504 "no answer within 180s" since 2026-10-19 (incident #2255).
    // A surface that reads "live ... answering with X" on that is overclaiming.
    const okHealth = async () => ({ status: 200, json: async () => ({ ok: true, chat: 'qwen2.5:14b-instruct-q4_K_M', embedding: 'nomic-embed-text:latest' }) });
    await act(async () => { root.render(createElement(ResearchSection, { fetchImpl: okHealth })); });
    await act(async () => {});
    const text = container.textContent;
    expect(text).toContain('qwen2.5:14b-instruct-q4_K_M');
    expect(text).toContain('Reachable is not answering');
    expect(text).not.toContain('answering with');
  });

  it('sending writes one agent_inbox row tagged research', async () => {
    await render();
    const box = container.querySelector('#research-send');
    expect(box).toBeTruthy();
    // React tracks the node's value itself, so a bare `box.value = ...` is not
    // seen as a change. The native setter is how a real keystroke reaches state.
    const setValue = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
    await act(async () => {
      setValue.call(box, 'https://youtu.be/aQgXzVSjwWg');
      box.dispatchEvent(new Event('input', { bubbles: true }));
    });
    const form = box.closest('form');
    await act(async () => { form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); });
    await act(async () => {});
    expect(store.sent).toHaveLength(1);
    expect(store.sent[0].tags).toEqual(['research']);
    expect(store.sent[0].body).toBe('https://youtu.be/aQgXzVSjwWg');
    expect(store.sent[0].source).toBe('research-section');
  });
});
