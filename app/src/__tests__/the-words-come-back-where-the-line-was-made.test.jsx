// =============================================================================
// THE WORDS COME BACK WHERE THE LINE WAS MADE (DR-1139)
// =============================================================================
// Darrell 2026-10-20, a screenshot of Your prompts: six rows reading "Spoken
// lesson, 28:24 (the words come back from Whisper)" from 09-30 to 10-09, and
// "Not working...". Measured on the live database (voice-intake-health run
// 39479627269): every one of those recordings HAS its transcript, written by
// Whisper on the NAS CPU. The words landed under Your lessons; the row that
// made the promise never changed. These cases pin the join and the row.
import { describe, it, expect, afterEach } from 'vitest';
import React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { wordsForPrompt, spokenLessonClock, anySpokenLine, MATCH_WINDOW_MS } from '../lib/prompt-words.js';
import { lessonItems } from '../lib/lesson-inbox.js';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { USE_PROMPT_EVENT, sortPrompts, promptType, promptTypes, boxAfter } from '../lib/saved-prompts.js';
import { spokenLessonLine } from '../components/OneVoiceInput.jsx';
import PromptHistory from '../components/PromptHistory.jsx';

// The real shapes: the recorder's line, and the rows the NAS road writes.
const LINE = spokenLessonLine(28 * 60 + 24);
const RECORDING = { id: 'rec-2824', body: 'Lesson. A spoken lesson (28:24); the words arrive as a transcript from Whisper on our own machines.', tags: ['lesson', 'voice', 'audio:x/y.webm'], created_at: '2026-10-06T21:05:13Z', created_by: 'u1' };
const TRANSCRIPT = { id: 't-2824', body: 'whisper:nas-cpu small\n\nFor about a decade the prevailing account has placed the first organisms at the vents.', tags: ['lesson', 'voice-transcript', 'of:rec-2824', 'whisper:nas-cpu'], created_at: '2026-10-06T21:56:04Z', created_by: 'u1' };
const OTHER_DAY = { id: 'rec-old', body: 'Lesson. A spoken lesson (28:24); the words arrive as a transcript from Whisper on our own machines.', tags: ['lesson', 'voice'], created_at: '2026-09-30T19:02:42Z', created_by: 'u1' };
const PROMPT = { id: 'p1', body: LINE, title: null, destination: 'lesson', kept: true, use_count: 1, last_used_at: '2026-10-06T21:05:20Z', created_at: '2026-10-06T21:05:20Z' };

describe('the join: a prompt line and the recording it stands for', () => {
  it('reads the clock out of the recorder’s line and nothing else', () => {
    expect(spokenLessonClock(LINE)).toBe('28:24');
    expect(spokenLessonClock('Spoken lesson, 2:16 (the words come back from Whisper)')).toBe('2:16');
    expect(spokenLessonClock('lesson I want to make sure there’s a lesson')).toBe('');
    expect(anySpokenLine([{ body: 'typed' }, { body: LINE }])).toBe(true);
    expect(anySpokenLine([{ body: 'typed' }])).toBe(false);
  });
  it('a typed prompt is not a spoken line: null, so the row shows nothing extra', () => {
    expect(wordsForPrompt({ body: 'Who invented the car?', created_at: '2026-10-06T21:05:20Z' }, lessonItems([RECORDING, TRANSCRIPT]))).toBeNull();
  });
  it('the 28:24 line finds ITS recording by clock and time, and the words it was promised', () => {
    const w = wordsForPrompt(PROMPT, lessonItems([OTHER_DAY, RECORDING, TRANSCRIPT]));
    expect(w.state).toBe('written');
    expect(w.item.id).toBe('rec-2824');
    expect(w.words).toBe('For about a decade the prevailing account has placed the first organisms at the vents.');
    expect(w.at).toBe('2026-10-06T21:56:04Z');
    expect(w.rung).toBe('the NAS CPU');
  });
  it('the same clock on another day is not this recording', () => {
    const w = wordsForPrompt({ ...PROMPT, created_at: '2026-09-30T19:02:50Z' }, lessonItems([RECORDING, TRANSCRIPT, OTHER_DAY]));
    expect(w.item.id).toBe('rec-old');
    expect(w.state).toBe('waiting');
  });
  it('a different clock, or a recording outside the window, is unmatched and says so', () => {
    expect(wordsForPrompt({ ...PROMPT, body: spokenLessonLine(136) }, lessonItems([RECORDING, TRANSCRIPT])).state).toBe('unmatched');
    const far = { ...RECORDING, created_at: new Date(Date.parse(PROMPT.created_at) + MATCH_WINDOW_MS + 60000).toISOString() };
    expect(wordsForPrompt(PROMPT, lessonItems([far])).state).toBe('unmatched');
  });
  it('a failure is reported with its reason; a recording with no answer yet is waiting', () => {
    const failed = { id: 'f', body: 'no Whisper answered in 3 attempts', tags: ['lesson', 'voice-failed', 'of:rec-2824'], created_at: '2026-10-06T22:00:00Z', created_by: 'u1' };
    const w = wordsForPrompt(PROMPT, lessonItems([RECORDING, failed]));
    expect(w.state).toBe('failed');
    expect(w.why).toMatch(/no Whisper answered/);
    expect(wordsForPrompt(PROMPT, lessonItems([RECORDING])).state).toBe('waiting');
  });
});

describe('the row says where the words are', () => {
  let container; let root;
  afterEach(() => { if (root) act(() => root.unmount()); if (container) container.remove(); root = null; container = null; });
  const mount = async (rows, lessons) => {
    const q = { select: () => q, order: () => q, limit: async () => ({ data: rows, error: null }) };
    const deps = { supabase: { from: () => q }, lessons: async () => lessons };
    container = document.createElement('div'); document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => { root.render(<PromptHistory deps={deps} />); });
    await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
    return container;
  };
  it('a spoken line whose words came back says so, shows them on request, and puts the WORDS in the box, not the line', async () => {
    const c = await mount([PROMPT], { ok: true, items: lessonItems([RECORDING, TRANSCRIPT]) });
    const note = c.querySelector('[data-testid="prompt-words"]');
    expect(note.getAttribute('data-state')).toBe('written');
    expect(note.textContent).toMatch(/The words came back .* written by Whisper on the NAS CPU/);
    expect(c.querySelector('[data-testid="prompt-words-text"]')).toBeNull();
    await act(async () => { c.querySelector('[data-testid="prompt-words-show"]').dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    expect(c.querySelector('[data-testid="prompt-words-text"]').textContent).toMatch(/^For about a decade/);
    const got = [];
    const onUse = (e) => got.push(e.detail);
    window.addEventListener(USE_PROMPT_EVENT, onUse);
    await act(async () => { c.querySelector('[data-testid="prompt-words-use"]').dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    window.removeEventListener(USE_PROMPT_EVENT, onUse);
    expect(got.length).toBe(1);
    expect(JSON.stringify(got[0])).toMatch(/For about a decade/);
    expect(JSON.stringify(got[0])).not.toMatch(/come back from Whisper/);
  });
  it('a line still waiting, and one with no recording on record, each say exactly that', async () => {
    const c = await mount([PROMPT, { ...PROMPT, id: 'p2', body: spokenLessonLine(136), created_at: '2026-10-09T08:51:00Z', last_used_at: '2026-10-09T08:51:00Z' }], { ok: true, items: lessonItems([RECORDING]) });
    const notes = [...c.querySelectorAll('[data-testid="prompt-words"]')].map((n) => n.getAttribute('data-state'));
    expect(notes.sort()).toEqual(['unmatched', 'waiting']);
  });
  it('the rows are read through the standard sub-tabs, one type at a time, All first, and "By type" sorts the All view (DR-0116)', async () => {
    const rows = [
      PROMPT,
      { ...PROMPT, id: 'p2', body: 'Please pray for my brother', destination: 'prayer', created_at: '2026-10-07T09:00:00Z', last_used_at: '2026-10-07T09:00:00Z' },
      { ...PROMPT, id: 'p3', body: 'Fix the door report', destination: 'poetech', created_at: '2026-10-08T09:00:00Z', last_used_at: '2026-10-08T09:00:00Z' },
      { ...PROMPT, id: 'p4', body: 'A thought I kept', destination: null, created_at: '2026-10-09T09:00:00Z', last_used_at: '2026-10-09T09:00:00Z' },
    ];
    const c = await mount(rows, { ok: true, items: [] });
    const tabs = [...c.querySelectorAll('[role="tab"]')].map((t) => t.textContent.trim());
    expect(tabs[0]).toBe('All · 4');
    expect(tabs.slice(1).sort()).toEqual(['Lesson · 1', 'PoeTech · 1', 'Prayer · 1', 'Saved · 1']);
    expect(c.querySelectorAll('[data-testid="prompt-row"]').length).toBe(4);
    const prayer = [...c.querySelectorAll('[role="tab"]')].find((t) => t.textContent.startsWith('Prayer'));
    await act(async () => { prayer.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    const shown = [...c.querySelectorAll('[data-testid="prompt-row"]')];
    expect(shown.length).toBe(1);
    expect(shown[0].textContent).toMatch(/pray for my brother/);
    expect(sortPrompts(rows, 'type').map((r) => promptType(r))).toEqual(['lesson', 'poetech', 'prayer', 'saved']);
    expect(promptTypes(rows).map((t) => t.key)).toEqual(['lesson', 'poetech', 'prayer', 'saved']);
  });
  it('the words go anywhere, one or several: "Add to the box" gathers under what the box holds, and the box appends instead of replacing', async () => {
    // the pure rule the box applies
    expect(boxAfter('', 'first', 'append')).toBe('first');
    expect(boxAfter('first', 'second', 'append')).toBe('first\n\nsecond');
    expect(boxAfter('first  \n', 'second', 'append')).toBe('first\n\nsecond');
    expect(boxAfter('first', 'second', 'replace')).toBe('second');
    expect(boxAfter('first', '', 'append')).toBe('first');
    // the rows send the gathering move as such
    const c = await mount([PROMPT], { ok: true, items: lessonItems([RECORDING, TRANSCRIPT]) });
    const got = [];
    const onUse = (e) => got.push(e.detail);
    window.addEventListener(USE_PROMPT_EVENT, onUse);
    await act(async () => { c.querySelector('[data-testid="prompt-add"]').dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    await act(async () => { c.querySelector('[data-testid="prompt-words-add"]').dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    await act(async () => { c.querySelector('[data-testid="prompt-use"]').dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    window.removeEventListener(USE_PROMPT_EVENT, onUse);
    expect(got.map((d) => d.mode)).toEqual(['append', 'append', 'replace']);
    expect(got[1].body).toMatch(/^For about a decade/);
    // and the box honours it: the handler applies boxAfter with the event's mode
    const box = readFileSync(join(process.cwd(), 'src', 'components', 'OneVoiceInput.jsx'), 'utf8');
    expect(box).toMatch(/setText\(\(cur\) => boxAfter\(cur, body, mode\)\)/);
    expect(box).toMatch(/const mode = e\?\.detail\?\.mode === 'append' \? 'append' : 'replace'/);
    const inbox = readFileSync(join(process.cwd(), 'src', 'components', 'LessonInbox.jsx'), 'utf8');
    expect(inbox).toMatch(/data-testid="lesson-words-add-to-box" onClick=\{\(\) => addToBox\(words\)\}/);
  });
  it('a typed prompt gets no note, and a list with no spoken line never asks for the lessons', async () => {
    let asked = 0;
    const q = { select: () => q, order: () => q, limit: async () => ({ data: [{ ...PROMPT, body: 'Who invented the car?' }], error: null }) };
    container = document.createElement('div'); document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => { root.render(<PromptHistory deps={{ supabase: { from: () => q }, lessons: async () => { asked += 1; return { ok: true, items: [] }; } }} />); });
    await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
    expect(container.querySelector('[data-testid="prompt-words"]')).toBeNull();
    expect(asked).toBe(0);
  });
});
