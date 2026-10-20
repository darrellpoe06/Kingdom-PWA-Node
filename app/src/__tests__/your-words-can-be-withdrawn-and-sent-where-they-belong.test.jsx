// =============================================================================
// YOUR WORDS CAN BE WITHDRAWN, AND SENT WHERE THEY BELONG (DR-1137)
// =============================================================================
// Darrell 2026-10-20: "Do we have the ability to send our words anywhere after
// collected???! We need that in case it goes to the wrong location or we may
// want to create a lesson from a situation or few" — "just to make sure... it
// goes to the correct location... for processing". These cases pin the move:
// the rule (withdrawable), the mark on the row, the road, the one database
// door (withdraw_my_inbox_row), the box event with a door chosen, the control
// on both surfaces, and the riders' and the sweep's exclusions.
import { describe, it, expect, afterEach } from 'vitest';
import React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { withdrawable, withdrawnMark, withdrawMyWords, moveMyWords, MOVE_ROUTES, BUILT_TAGS } from '../lib/withdraw-my-words.js';
import { lessonItems } from '../lib/lesson-inbox.js';
import { deriveLessonPipeline } from '../lib/lesson-pipeline.js';
import { USE_PROMPT_EVENT, sendPromptToBox } from '../lib/saved-prompts.js';
import MoveMyWords from '../components/MoveMyWords.jsx';

const REPO = join(process.cwd(), '..');
const SRC = (rel) => readFileSync(join(REPO, rel), 'utf8');
const U = 'u-writer';
const spoken = (id, extra = []) => ({ id, body: 'Lesson. A spoken lesson (28:24)', tags: ['lesson', 'voice', `audio:${U}/${id}.webm`, ...extra], created_at: '2026-10-06T21:05:13Z', created_by: U });
const transcript = (id, of, extra = []) => ({ id, body: 'whisper:nas-cpu small\n\nThe words Whisper wrote.', tags: ['lesson', 'voice-transcript', `of:${of}`, 'whisper:nas-cpu', ...extra], created_at: '2026-10-06T21:56:04Z', created_by: U });
const typed = (id, extra = []) => ({ id, body: 'Lesson. Be ye doers of the word.', tags: ['lesson', ...extra], created_at: '2026-10-07T09:00:00Z', created_by: U });

describe('the rule and the mark', () => {
  it('withdrawnMark reads the tag and the LATEST stamp, withdrawn or restored', () => {
    expect(withdrawnMark(['lesson', 'withdrawn', 'withdrawn@2026-10-20T19:00:00Z'])).toEqual({ withdrawn: true, at: '2026-10-20T19:00:00Z' });
    expect(withdrawnMark(['lesson', 'withdrawn@2026-10-20T19:00:00Z', 'restored@2026-10-20T19:30:00Z'])).toEqual({ withdrawn: false, at: '2026-10-20T19:30:00Z' });
    expect(withdrawnMark(['lesson', 'restored@2026-10-20T19:30:00Z', 'withdrawn', 'withdrawn@2026-10-20T20:00:00Z'])).toEqual({ withdrawn: true, at: '2026-10-20T20:00:00Z' });
    expect(withdrawnMark(['lesson'])).toEqual({ withdrawn: false, at: '' });
    expect(withdrawnMark(null)).toEqual({ withdrawn: false, at: '' });
  });
  it('withdrawable: a waiting, written, failed or typed row is; a built, building, published or awaiting-review one is not (the same wall 0304 keeps)', () => {
    const [waiting] = lessonItems([spoken('a')]);
    const [written] = lessonItems([spoken('b'), transcript('bt', 'b')]);
    const [sent] = lessonItems([typed('c')]);
    expect(withdrawable(waiting)).toBe(true);
    expect(withdrawable(written)).toBe(true);
    expect(withdrawable(sent)).toBe(true);
    for (const t of BUILT_TAGS) expect(withdrawable(lessonItems([typed('d', [t])])[0])).toBe(false);
    // The builder's progress may sit on the transcript, not the root: still not withdrawable.
    expect(withdrawable(lessonItems([spoken('e'), transcript('et', 'e', ['lesson-captured'])])[0])).toBe(false);
    expect(withdrawable(lessonItems([typed('f', ['lesson-published', 'lesson-id:ll900'])])[0])).toBe(false);
    expect(withdrawable(null)).toBe(false);
  });
  it('lessonItems carries withdrawn and its time from the ROOT row; the words still come', () => {
    const [it1] = lessonItems([spoken('g', ['withdrawn', 'withdrawn@2026-10-20T19:00:00Z']), transcript('gt', 'g', ['withdrawn', 'withdrawn@2026-10-20T19:00:00Z'])]);
    expect(it1.withdrawn).toBe(true);
    expect(it1.withdrawnAt).toBe('2026-10-20T19:00:00Z');
    expect(it1.state).toBe('written');
    expect(it1.words).toContain('The words Whisper wrote.');
    const [it2] = lessonItems([typed('h')]);
    expect(it2.withdrawn).toBe(false);
    expect(it2.withdrawnAt).toBe('');
  });
  it('the road stops at a withdrawn row and says so; a captured row is never read as withdrawn', () => {
    const [it1] = lessonItems([spoken('i', ['withdrawn', 'withdrawn@2026-10-20T19:00:00Z']), transcript('it', 'i', ['withdrawn'])]);
    const road = deriveLessonPipeline(it1, { owner: true, catalog: [] });
    const building = road.stages.find((s) => s.key === 'building');
    expect(building.status).toBe('stopped');
    expect(building.line).toMatch(/^Withdrawn by you/);
    expect(building.at).toBe('2026-10-20T19:00:00Z');
    const [it2] = lessonItems([typed('j', ['withdrawn', 'lesson-captured'])]);
    expect(deriveLessonPipeline(it2, { owner: true, catalog: [] }).stages.find((s) => s.key === 'building').status).toBe('done');
  });
});

describe('the one database door', () => {
  const client = (answer) => {
    const calls = [];
    return { calls, supabase: { rpc: async (name, args) => { calls.push([name, args]); return typeof answer === 'function' ? answer() : answer; } } };
  };
  it('withdraws and restores through withdraw_my_inbox_row with the row id and the undo flag, nothing else', async () => {
    const c = client({ data: { id: 'g', withdrawn: true, changed: true, rows: 2 }, error: null });
    const r = await withdrawMyWords({ supabase: c.supabase, id: 'g' });
    expect(r).toEqual({ ok: true, withdrawn: true, changed: true, reason: '' });
    expect(c.calls).toEqual([['withdraw_my_inbox_row', { p_id: 'g', p_undo: false }]]);
    await withdrawMyWords({ supabase: c.supabase, id: 'g', undo: true });
    expect(c.calls[1]).toEqual(['withdraw_my_inbox_row', { p_id: 'g', p_undo: true }]);
  });
  it('says plainly when the database refuses (not yours), has not taken 0304 yet, or there is no client', async () => {
    expect((await withdrawMyWords({ supabase: client({ data: null, error: { code: '42501', message: 'withdraw_my_inbox_row: only the person who wrote it may withdraw it' } }).supabase, id: 'g' })).reason).toBe('not-yours');
    expect((await withdrawMyWords({ supabase: client({ data: null, error: { code: 'PGRST202', message: 'Could not find the function public.withdraw_my_inbox_row(p_id, p_undo) in the schema cache' } }).supabase, id: 'g' })).reason).toBe('not-available-yet');
    expect((await withdrawMyWords({ supabase: client({ data: null, error: { code: 'P0001', message: 'withdraw_my_inbox_row: a lesson is already built or being decided from this one; it is not withdrawn here' } }).supabase, id: 'g' })).reason).toMatch(/^a lesson is already built/);
    expect((await withdrawMyWords({ supabase: client(() => { throw new Error('offline'); }).supabase, id: 'g' })).reason).toBe('offline');
    expect((await withdrawMyWords({ supabase: null, id: 'g' })).reason).toBe('no-client');
    expect((await withdrawMyWords({ supabase: client({}).supabase, id: '' })).reason).toBe('no-client');
  });
});

describe('the box with a door already chosen', () => {
  const heard = () => { const got = []; const on = (e) => got.push(e.detail); window.addEventListener(USE_PROMPT_EVENT, on); return { got, off: () => window.removeEventListener(USE_PROMPT_EVENT, on) }; };
  it('sendPromptToBox carries a route only when one is given', () => {
    const h = heard();
    sendPromptToBox('the words', window, { route: 'prayer' });
    sendPromptToBox('the words', window);
    h.off();
    expect(h.got).toEqual([{ body: 'the words', mode: 'replace', route: 'prayer' }, { body: 'the words', mode: 'replace' }]);
  });
  it('moveMyWords sends the words, replacing, to a door that is not the lesson door; nothing on empty words or the lesson door', () => {
    const h = heard();
    expect(moveMyWords({ words: '  the situation  ', route: 'poetech' })).toBe(true);
    expect(moveMyWords({ words: '', route: 'poetech' })).toBe(false);
    expect(moveMyWords({ words: 'x', route: 'lesson' })).toBe(false);
    expect(moveMyWords({ words: 'x', route: 'nowhere' })).toBe(false);
    h.off();
    expect(h.got).toEqual([{ body: 'the situation', mode: 'replace', route: 'poetech' }]);
    expect(MOVE_ROUTES.map((r) => r.key)).not.toContain('lesson');
    expect(MOVE_ROUTES.map((r) => r.key)).toEqual(expect.arrayContaining(['poetech', 'prayer', 'private', 'work']));
  });
  it('the box sets its chip to the chosen door and counts it as the person’s choice', () => {
    const box = SRC('app/src/components/OneVoiceInput.jsx');
    expect(box).toContain("const wanted = String(e?.detail?.route || '');");
    expect(box).toContain('if (wanted && DESTS.some((d) => d.key === wanted)) { setRoute(wanted); setTouchedRoute(true); return; }');
  });
});

describe('the control on the row', () => {
  let root; let container;
  afterEach(async () => { if (root) await act(async () => root.unmount()); if (container) container.remove(); root = null; container = null; });
  const mount = async (item, words, answer) => {
    const calls = []; const changed = [];
    const supabase = { rpc: async (name, args) => { calls.push([name, args]); return answer; } };
    container = document.createElement('div'); document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => { root.render(<MoveMyWords item={item} words={words} deps={{ supabase }} onChanged={() => changed.push(1)} />); });
    return { c: container, calls, changed };
  };
  const click = async (el) => { await act(async () => { el.dispatchEvent(new MouseEvent('click', { bubbles: true })); await new Promise((r) => setTimeout(r, 0)); }); };
  it('a row still at the lesson door offers Withdraw and Move; Withdraw calls the door with undo=false and tells the screen to re-read', async () => {
    const [item] = lessonItems([spoken('k'), transcript('kt', 'k')]);
    const { c, calls, changed } = await mount(item, 'The words Whisper wrote.', { data: { withdrawn: true, changed: true }, error: null });
    expect(c.querySelector('[data-testid="move-my-words"]').getAttribute('data-withdrawn')).toBe('false');
    expect(c.querySelector('[data-testid="words-restore"]')).toBeNull();
    await click(c.querySelector('[data-testid="words-withdraw"]'));
    expect(calls).toEqual([['withdraw_my_inbox_row', { p_id: 'k', p_undo: false }]]);
    expect(changed.length).toBe(1);
    expect(c.querySelector('[data-testid="move-said"]').textContent).toMatch(/^Withdrawn: nothing is built from it/);
  });
  it('a withdrawn row says so with its time and offers Restore, which calls the door with undo=true', async () => {
    const [item] = lessonItems([spoken('l', ['withdrawn', 'withdrawn@2026-10-20T19:00:00Z'])]);
    const { c, calls } = await mount(item, '', { data: { withdrawn: false, changed: true }, error: null });
    expect(c.querySelector('[data-testid="words-withdrawn"]').textContent).toMatch(/^Withdrawn .*nothing is built from it\. Its words still come back/);
    expect(c.querySelector('[data-testid="words-withdraw"]')).toBeNull();
    await click(c.querySelector('[data-testid="words-restore"]'));
    expect(calls).toEqual([['withdraw_my_inbox_row', { p_id: 'l', p_undo: true }]]);
    expect(c.querySelector('[data-testid="move-said"]').textContent).toMatch(/^Restored/);
  });
  it('Move withdraws first, then puts the words in the box with the chosen door (PoeTech by default, any other on choice)', async () => {
    const [item] = lessonItems([spoken('m'), transcript('mt', 'm')]);
    const got = []; const on = (e) => got.push(e.detail); window.addEventListener(USE_PROMPT_EVENT, on);
    const { c, calls } = await mount(item, 'The words Whisper wrote.', { data: { withdrawn: true, changed: true }, error: null });
    await click(c.querySelector('[data-testid="words-move"]'));
    expect(calls).toEqual([['withdraw_my_inbox_row', { p_id: 'm', p_undo: false }]]);
    expect(got).toEqual([{ body: 'The words Whisper wrote.', mode: 'replace', route: 'poetech' }]);
    expect(c.querySelector('[data-testid="move-said"]').textContent).toMatch(/PoeTech chosen\. Read them, then press Send\.$/);
    const sel = c.querySelector('[data-testid="move-route"]');
    await act(async () => { sel.value = 'prayer'; sel.dispatchEvent(new Event('change', { bubbles: true })); });
    await click(c.querySelector('[data-testid="words-move"]'));
    expect(got[1].route).toBe('prayer');
    window.removeEventListener(USE_PROMPT_EVENT, on);
  });
  it('when the door refuses, nothing is moved and the reason is said; a row already built offers nothing to withdraw', async () => {
    const [item] = lessonItems([spoken('n'), transcript('nt', 'n')]);
    const got = []; const on = (e) => got.push(e.detail); window.addEventListener(USE_PROMPT_EVENT, on);
    const { c, changed } = await mount(item, 'words', { data: null, error: { code: 'PGRST202', message: 'Could not find the function public.withdraw_my_inbox_row in the schema cache' } });
    await click(c.querySelector('[data-testid="words-move"]'));
    window.removeEventListener(USE_PROMPT_EVENT, on);
    expect(got).toEqual([]);
    expect(changed.length).toBe(0);
    expect(c.querySelector('[data-testid="move-said"]').textContent).toMatch(/has not taken this move yet \(migration 0304\)/);
    const [built] = lessonItems([typed('o', ['lesson-captured'])]);
    const { c: c2 } = await mount(built, 'words', { data: null, error: null });
    expect(c2.querySelector('[data-testid="words-not-withdrawable"]')).not.toBeNull();
    expect(c2.querySelector('[data-testid="words-withdraw"]')).toBeNull();
    expect(c2.querySelector('[data-testid="words-move"]')).toBeNull();
  });
  it('both surfaces carry the control: every Your lessons row, and the spoken-lesson rows of Your prompts', () => {
    expect(SRC('app/src/components/LessonInbox.jsx')).toContain('<MoveMyWords item={it} words={it.spoken ? words : it.body.replace(/^Lesson\\.\\s*/, \'\')} deps={{ supabase: deps.supabase }} onChanged={load} />');
    const ph = SRC('app/src/components/PromptHistory.jsx');
    expect(ph).toContain('const mover = w.item ? <MoveMyWords item={w.item} words={w.words}');
    expect((ph.match(/\{mover\}/g) || []).length).toBe(3);
  });
});

describe('nothing builds from a withdrawn row, anywhere on the road', () => {
  it('the NAS lesson builder refuses it by name and its two selects exclude it; the bell does not count it', () => {
    const py = SRC('infra/nas-lesson-builder/lesson_builder.py');
    expect(py).toMatch(/if "withdrawn" in tags:\s*\n(\s*#.*\n)*\s*return False, "withdrawn by its person"/);
    expect(py).toContain(`AND NOT tags @> '[\\"withdrawn\\"]'::jsonb ORDER BY created_at ASC`);
    expect(py).toContain(`AND NOT (tags ? 'withdrawn') `);
    expect(py).toContain('and "awaiting-review" not in tags and "withdrawn" not in tags)');
  });
  it('the voice rider still writes the words and carries the tag onto the transcript and the failure report', () => {
    const py = SRC('infra/nas-lesson-voice/lesson_voice_transcribe.py');
    expect(py).toContain('def carried_tags_of(tags):');
    expect(py).toContain('+ naming_tags_of(row.get("tags")) + carried_tags_of(row.get("tags")),');
    expect(py).toContain('tags = ["lesson", "voice-failed", f"of:{rid}"] + carried_tags_of(row.get("tags"))');
  });
  it('the waiting list, the sweep and the one door are in the SQL, with the walls 0304 names', () => {
    expect(SRC('scripts/lesson-inbox-waiting.sql')).toMatch(/AND NOT \(tags \? 'withdrawn'\)/);
    const mig = SRC('infra/supabase/migrations-auto/0304-your-words-can-be-withdrawn-and-sent-where-they-belong.sql');
    expect(mig).toContain('CREATE OR REPLACE FUNCTION public.withdraw_my_inbox_row(p_id uuid, p_undo boolean DEFAULT false)');
    expect(mig).toContain('REVOKE ALL ON FUNCTION public.withdraw_my_inbox_row(uuid, boolean) FROM PUBLIC;');
    expect(mig).toContain('GRANT EXECUTE ON FUNCTION public.withdraw_my_inbox_row(uuid, boolean) TO authenticated;');
    expect(mig).toContain('IF v_row.created_by IS DISTINCT FROM auth.uid()');
    expect(mig).toContain("IF v_row.tags ?| array['lesson-captured', 'lesson-building', 'lesson-published', 'awaiting-review'] THEN");
    expect(mig).toContain("AND NOT (a.tags ? 'withdrawn')");
    expect(mig).toContain("AND NOT (a.tags ? 'not-a-lesson')");
    expect(mig).toContain("a.tags ? ('of:' || p_id::text)");
  });
  it('CI proves the walls on a real PostgreSQL and the required aggregator waits for it', () => {
    const ci = SRC('.github/workflows/ci.yml');
    expect(ci).toContain('  withdraw-walls:\n');
    expect(ci).toContain('infra/supabase/tests/0304-withdraw-my-words-smoke.sql');
    expect(ci).toContain("grep -q 'WITHDRAW MY WORDS SMOKE: PASS'");
    expect(ci).toMatch(/needs: \[guards, vitest[^\]]*withdraw-walls\]/);
    expect(SRC('infra/supabase/tests/0304-withdraw-my-words-smoke.sql')).toContain("RAISE NOTICE 'WITHDRAW MY WORDS SMOKE: PASS';");
  });
});
