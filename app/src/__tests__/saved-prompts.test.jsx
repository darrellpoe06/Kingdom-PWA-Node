// =============================================================================
// Your prompts (DR-0615): dated, sortable, searchable for similar ones,
// reusable in one tap, private to the author, remembered automatically only
// for lessons and PoeTech requests.
// =============================================================================
import { describe, it, expect, vi, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  sortPrompts, searchPrompts, dateText, rememberPrompt, listPrompts, sendPromptToBox,
  USE_PROMPT_EVENT, AUTO_REMEMBERED, SORTS,
} from '../lib/saved-prompts.js';
import PromptHistory from '../components/PromptHistory.jsx';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..', '..');
const read = (...p) => readFileSync(join(ROOT, ...p), 'utf8');

const P = [
  { id: 'a', body: 'Lesson. What are the keys of hell and death?', destination: 'lesson', kept: false, use_count: 1, last_used_at: '2026-09-24T15:00:00Z', created_at: '2026-09-24T15:00:00Z' },
  { id: 'b', body: 'Build phase 1 of the decision intelligence layer', destination: 'poetech', kept: true, use_count: 4, last_used_at: '2026-09-24T12:00:00Z', created_at: '2026-09-20T09:00:00Z' },
  { id: 'c', body: 'Lesson. Didn\'t Jesus tell Pilate He was from eternity?', destination: 'lesson', kept: false, use_count: 2, last_used_at: '2026-09-23T10:00:00Z', created_at: '2026-09-22T10:00:00Z' },
];

describe('dated and sortable', () => {
  it('offers five sorts and each orders as named', () => {
    expect(SORTS.map((s) => s.key)).toEqual(['recent', 'oldest', 'used', 'kept', 'az']);
    expect(sortPrompts(P, 'recent').map((p) => p.id)).toEqual(['a', 'b', 'c']);
    expect(sortPrompts(P, 'oldest').map((p) => p.id)).toEqual(['b', 'c', 'a']);
    expect(sortPrompts(P, 'used').map((p) => p.id)).toEqual(['b', 'c', 'a']);
    expect(sortPrompts(P, 'kept')[0].id).toBe('b');
    expect(sortPrompts(P, 'az').map((p) => p.id)).toEqual(['b', 'c', 'a']);
  });
  it('never reorders the caller\'s list in place', () => {
    const copy = [...P];
    sortPrompts(copy, 'az');
    expect(copy.map((p) => p.id)).toEqual(['a', 'b', 'c']);
  });
  it('dates read year-month-day hour:minute; an unknown date is blank, never a fake', () => {
    expect(dateText('2026-09-24T15:04:00')).toBe('2026-09-24 15:04');
    expect(dateText('')).toBe('');
    expect(dateText('not a date')).toBe('');
  });
});

describe('search finds the same OR similar prompts', () => {
  it('an exact phrase ranks first; shared words bring the similar ones', () => {
    const r = searchPrompts(P, 'keys of hell');
    expect(r[0].id).toBe('a');
    expect(searchPrompts(P, 'what did Jesus tell Pilate').map((p) => p.id)).toEqual(['c']);
    expect(searchPrompts(P, 'lesson').map((p) => p.id).sort()).toEqual(['a', 'c']);
  });
  it('proven-quiet: no shared word, no match; empty search returns everything', () => {
    expect(searchPrompts(P, 'mortgage escrow')).toEqual([]);
    expect(searchPrompts(P, '  ')).toHaveLength(3);
  });
});

describe('remembering and reading', () => {
  const fake = ({ uid = 'u1', error = null, rows = [] } = {}) => {
    const calls = { rpc: [] };
    const q = { select: () => q, order: () => q, limit: async () => ({ data: rows, error }) };
    return {
      calls,
      auth: { getSession: async () => ({ data: { session: uid ? { user: { id: uid } } : null } }) },
      rpc: async (fn, args) => { calls.rpc.push({ fn, args }); return { error }; },
      from: () => q,
    };
  };
  it('remembers through remember_prompt, which counts a repeat instead of copying it', async () => {
    const sb = fake();
    expect(await rememberPrompt({ supabase: sb, getInstanceId: async () => 'inst', body: '  Lesson. x  ', destination: 'lesson' })).toEqual({ ok: true, reason: '' });
    expect(sb.calls.rpc[0]).toEqual({ fn: 'remember_prompt', args: { p_instance: 'inst', p_body: 'Lesson. x', p_destination: 'lesson', p_keep: false } });
    const sql = read('infra', 'supabase', 'migrations-auto', '0232-your-prompts-are-kept-dated-and-yours-alone.sql');
    expect(sql).toMatch(/ON CONFLICT \(created_by, body_sha\) DO UPDATE\s+SET use_count\s+= saved_prompts\.use_count \+ 1/);
  });
  it('signed out or empty remembers nothing', async () => {
    const sb = fake({ uid: null });
    expect((await rememberPrompt({ supabase: sb, getInstanceId: async () => 'i', body: 'x' })).reason).toBe('signed-out');
    expect((await rememberPrompt({ supabase: sb, getInstanceId: async () => 'i', body: '   ' })).reason).toBe('empty');
    expect(sb.calls.rpc).toHaveLength(0);
  });
  it('a refused read says why', async () => {
    expect(await listPrompts({ supabase: fake({ error: { message: 'denied' } }) })).toEqual({ ok: false, rows: [], reason: 'denied' });
  });
  it('only lessons and PoeTech requests are remembered on their own', () => {
    expect(AUTO_REMEMBERED).toEqual(['lesson', 'poetech']);
    const src = read('app', 'src', 'components', 'OneVoiceInput.jsx');
    expect(src).toMatch(/if \(AUTO_REMEMBERED\.includes\(route\)\) remember\(t, route, false\);/);
    expect(src).toMatch(/data-testid="save-as-prompt"/);
  });
  it('the table is private to its author, proven in the RLS matrix', () => {
    const sql = read('infra', 'supabase', 'migrations-auto', '0232-your-prompts-are-kept-dated-and-yours-alone.sql');
    expect((sql.match(/created_by = auth\.uid\(\) AND user_in_instance\(instance_id\)/g) || []).length).toBe(5);
    expect(sql).toMatch(/SECURITY INVOKER/);
    expect(read('infra', 'supabase', 'tests', '0232-saved-prompts-smoke.sql')).toMatch(/LEAK: another member of the same instance read/);
    expect(read('.github', 'workflows', 'rls-isolation.yml')).toMatch(/smokes: "0232-saved-prompts-smoke\.sql"/);
  });
});

describe('the history on screen', () => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  let container = null;
  let root = null;
  afterEach(() => { if (root) act(() => root.unmount()); if (container) container.remove(); root = null; container = null; });
  const mount = async (rows, extra = {}) => {
    const q = { select: () => q, order: () => q, limit: async () => ({ data: rows, error: null }) };
    const deps = { supabase: { from: () => q, ...extra } };
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => { root.render(<PromptHistory deps={deps} />); });
  };

  it('lists every prompt dated, with its use count, newest first', async () => {
    await mount(P);
    const rows = container.querySelectorAll('[data-testid="prompt-row"]');
    expect(rows).toHaveLength(3);
    expect(rows[0].textContent).toMatch(/keys of hell/);
    expect(rows[1].textContent).toMatch(/used 4 times, first 2026-09-20/);
    expect(container.textContent).toMatch(/Your prompts · 3/);
  });
  it('sorting and searching change what shows', async () => {
    await mount(P);
    const sort = container.querySelector('[data-testid="prompt-sort"]');
    await act(async () => {
      sort.value = 'oldest';
      sort.dispatchEvent(new Event('change', { bubbles: true }));
    });
    expect(container.querySelectorAll('[data-testid="prompt-row"]')[0].textContent).toMatch(/decision intelligence/);
    const search = container.querySelector('[data-testid="prompt-search"]');
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    await act(async () => {
      setter.call(search, 'Pilate eternity');
      search.dispatchEvent(new Event('input', { bubbles: true }));
    });
    expect(container.querySelectorAll('[data-testid="prompt-row"]')).toHaveLength(1);
  });
  it('"Put it in the box" hands the prompt back to the box', async () => {
    await mount(P);
    const heard = vi.fn();
    window.addEventListener(USE_PROMPT_EVENT, heard);
    await act(async () => { container.querySelector('[data-testid="prompt-use"]').dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    window.removeEventListener(USE_PROMPT_EVENT, heard);
    expect(heard.mock.calls[0][0].detail.body).toMatch(/keys of hell/);
    expect(sendPromptToBox('x', null)).toBe(false);
  });
  it('the box listens, and the Thinking Space shows the history', () => {
    expect(read('app', 'src', 'components', 'OneVoiceInput.jsx')).toMatch(/window\.addEventListener\(USE_PROMPT_EVENT, onUse\)/);
    expect(read('app', 'src', 'components', 'ThinkingSpace.jsx')).toMatch(/<PromptHistory refreshKey=\{promptsSeen\} \/>/);
  });
});
