// =============================================================================
// A spoken lesson (DR-0611): the path is the owner's own folder, the send
// uploads THEN files the row, a failed row removes the upload, a signed-out
// send files nothing, and the Speak box offers the recorder only under the
// Lesson chip.
// =============================================================================
import { describe, it, expect, vi, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  lessonAudioPath, extFor, voiceLessonBody, voiceLessonTags, recordingProblem, sendVoiceLesson,
  LESSON_AUDIO_BUCKET, MAX_LESSON_SECONDS,
} from '../lib/lesson-voice.js';
import VoiceLessonRecorder from '../components/VoiceLessonRecorder.jsx';

const HERE = dirname(fileURLToPath(import.meta.url));
const UID = 'f13843f2-742b-4f8a-82af-7ecfbdc536ec';
const NOW = Date.parse('2026-09-24T15:30:00Z');
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let container = null;
let root = null;
function render(el) {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root.render(el));
  return { rerender: (e) => act(() => root.render(e)) };
}
const byId = (id) => container.querySelector(`[data-testid="${id}"]`);
async function click(node) {
  await act(async () => { node.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
}
afterEach(() => {
  if (root) act(() => root.unmount());
  if (container) container.remove();
  root = null; container = null;
});

const blob = (size = 2048, type = 'audio/webm') => ({ size, type });

function fakeSupabase({ uid = UID, uploadError = null } = {}) {
  const calls = { upload: [], remove: [] };
  return {
    calls,
    auth: { getSession: async () => ({ data: { session: uid ? { user: { id: uid } } : null } }) },
    storage: {
      from: (b) => ({
        upload: async (path, body, opts) => { calls.upload.push({ b, path, opts }); return { error: uploadError }; },
        remove: async (paths) => { calls.remove.push({ b, paths }); return { error: null }; },
      }),
    },
  };
}

describe('the path is the access rule', () => {
  it('starts with the owner id, carries a UTC stamp and the right extension', () => {
    expect(lessonAudioPath(UID, NOW, 'audio/webm;codecs=opus', 'ab12')).toBe(`${UID}/20260924T153000Z-ab12.webm`);
    expect(extFor('audio/mp4')).toBe('m4a');
    expect(extFor('audio/ogg')).toBe('ogg');
  });
  it('refuses a missing or malformed owner id (no folder, no upload)', () => {
    expect(lessonAudioPath('', NOW, 'audio/webm')).toBe('');
    expect(lessonAudioPath('../etc', NOW, 'audio/webm')).toBe('');
  });
  it('the migration makes the bucket private and the first folder the owner', () => {
    const sql = readFileSync(join(HERE, '..', '..', '..', 'infra', 'supabase', 'migrations-auto', '0229-a-spoken-lesson-waits-in-its-speakers-own-folder.sql'), 'utf8');
    expect(sql).toMatch(/VALUES \('lesson-audio', 'lesson-audio', false\)/);
    expect((sql.match(/\(storage\.foldername\(name\)\)\[1\] = auth\.uid\(\)::text/g) || []).length).toBe(3);
    expect(sql).not.toMatch(/TO anon/);
    expect(LESSON_AUDIO_BUCKET).toBe('lesson-audio');
  });
});

describe('the row the loop answers', () => {
  it('is tagged lesson + voice + the audio path, and says the words follow', () => {
    expect(voiceLessonTags('u/a.webm')).toEqual(['lesson', 'voice', 'audio:u/a.webm']);
    expect(voiceLessonBody('', 75)).toMatch(/^Lesson\. A spoken lesson \(1:15\)/);
    expect(voiceLessonBody('keys of hell', 75)).toMatch(/Typed with it: keys of hell/);
  });
  it('a recording too short, too long or empty cannot be sent, and says why', () => {
    expect(recordingProblem({ blob: null, seconds: 10 })).toMatch(/Nothing/);
    expect(recordingProblem({ blob: blob(), seconds: 1 })).toMatch(/at least/);
    expect(recordingProblem({ blob: blob(), seconds: MAX_LESSON_SECONDS + 1 })).toMatch(/split/);
    expect(recordingProblem({ blob: blob(), seconds: 30 })).toBe('');
  });
});

describe('the send', () => {
  it('uploads to the owner folder, THEN files the row', async () => {
    const sb = fakeSupabase();
    const relay = vi.fn(async () => ({ ok: true, id: 'row-1' }));
    const r = await sendVoiceLesson({ blob: blob(), seconds: 40, supabase: sb, relay, nowMs: NOW, suffix: 'x1' });
    expect(r.ok).toBe(true);
    expect(sb.calls.upload[0].b).toBe('lesson-audio');
    expect(sb.calls.upload[0].path.startsWith(`${UID}/`)).toBe(true);
    expect(relay.mock.calls[0][0].tags).toEqual(['lesson', 'voice', `audio:${UID}/20260924T153000Z-x1.webm`]);
  });
  it('signed out: nothing uploaded, nothing filed', async () => {
    const sb = fakeSupabase({ uid: null });
    const relay = vi.fn();
    const r = await sendVoiceLesson({ blob: blob(), seconds: 40, supabase: sb, relay, nowMs: NOW });
    expect(r).toMatchObject({ ok: false, reason: 'signed-out' });
    expect(sb.calls.upload).toHaveLength(0);
    expect(relay).not.toHaveBeenCalled();
  });
  it('a refused upload files no row', async () => {
    const sb = fakeSupabase({ uploadError: { message: 'denied' } });
    const relay = vi.fn();
    const r = await sendVoiceLesson({ blob: blob(), seconds: 40, supabase: sb, relay, nowMs: NOW });
    expect(r.reason).toMatch(/upload: denied/);
    expect(relay).not.toHaveBeenCalled();
  });
  it('a refused row removes the uploaded audio (no orphan waits in the bucket)', async () => {
    const sb = fakeSupabase();
    const relay = vi.fn(async () => ({ ok: false, reason: 'rls' }));
    const r = await sendVoiceLesson({ blob: blob(), seconds: 40, supabase: sb, relay, nowMs: NOW, suffix: 'z' });
    expect(r).toMatchObject({ ok: false, reason: 'rls' });
    expect(sb.calls.remove[0].paths).toEqual([`${UID}/20260924T153000Z-z.webm`]);
  });
});

describe('the recorder on the Speak box', () => {
  const rec = (over = {}) => ({ supported: true, recording: false, seconds: 0, blob: null, url: '', error: '', start: vi.fn(), stop: vi.fn(), reset: vi.fn(), ...over });

  it('offers Record, then Stop while recording', async () => {
    const r1 = rec();
    const { rerender } = render(<VoiceLessonRecorder recorder={r1} />);
    await click(byId('voice-lesson-record'));
    expect(r1.start).toHaveBeenCalled();
    const r2 = rec({ recording: true, seconds: 12 });
    rerender(<VoiceLessonRecorder recorder={r2} />);
    expect(byId('voice-lesson-clock').textContent).toMatch(/0:12/);
    await click(byId('voice-lesson-stop'));
    expect(r2.stop).toHaveBeenCalled();
  });

  it('stops itself at the cap', () => {
    const r = rec({ recording: true, seconds: MAX_LESSON_SECONDS });
    render(<VoiceLessonRecorder recorder={r} />);
    expect(r.stop).toHaveBeenCalled();
  });

  it('sends with the typed words and says it was sent', async () => {
    const r = rec({ blob: blob(), seconds: 40, url: 'blob:x' });
    const send = vi.fn(async () => ({ ok: true }));
    render(<VoiceLessonRecorder recorder={r} note="keys of hell and death" source="church-one-voice" send={send} deps={{ supabase: {}, relay: () => {} }} />);
    await click(byId('voice-lesson-send'));
    expect(byId('voice-lesson-status').textContent).toMatch(/Sent/);
    expect(send.mock.calls[0][0]).toMatchObject({ seconds: 40, note: 'keys of hell and death', source: 'church-one-voice' });
    expect(r.reset).toHaveBeenCalled();
  });

  it('a failed send says why and keeps the recording', async () => {
    const r = rec({ blob: blob(), seconds: 40 });
    const send = vi.fn(async () => ({ ok: false, reason: 'signed-out' }));
    render(<VoiceLessonRecorder recorder={r} send={send} deps={{ supabase: {}, relay: () => {} }} />);
    await click(byId('voice-lesson-send'));
    expect(byId('voice-lesson-status').textContent).toMatch(/Not sent \(signed-out\)/);
    expect(r.reset).not.toHaveBeenCalled();
  });

  it('says so plainly where the browser cannot record', () => {
    render(<VoiceLessonRecorder recorder={rec({ supported: false })} />);
    expect(byId('voice-lesson-unsupported')).toBeTruthy();
  });

  it('appears on the Speak box only under the Lesson chip (source pin)', () => {
    const src = readFileSync(join(HERE, '..', 'components', 'OneVoiceInput.jsx'), 'utf8');
    expect(src).toMatch(/\{route === 'lesson' && <VoiceLessonRecorder note=\{text\} source=\{cfg\.sourceTag\} \/>\}/);
  });
});
