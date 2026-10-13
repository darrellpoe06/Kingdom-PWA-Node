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
  it('carries the member\u2019s naming choice on the spoken lesson (DR-0639)', async () => {
    const sb = fakeSupabase();
    const relay = vi.fn(async () => ({ ok: true, id: 'row-1' }));
    await sendVoiceLesson({ blob: blob(), seconds: 40, supabase: sb, relay, nowMs: NOW, suffix: 'x1', extraTags: ['lesson-name-ok', 'lesson-name:Sister Mae'] });
    expect(relay.mock.calls[0][0].tags).toEqual(['lesson', 'voice', `audio:${UID}/20260924T153000Z-x1.webm`, 'lesson-name-ok', 'lesson-name:Sister Mae']);
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

describe('the recorder on the Speak box (DR-0636: it records; the box sends)', () => {
  const rec = (over = {}) => ({
    micSupported: true, recording: false, seconds: 0, result: null, errorMessage: '',
    silentSeconds: 0, heardSound: false, bytes: 0, level: 0,
    start: vi.fn(async () => ({ ok: true })), stop: vi.fn(), ...over,
  });

  it('Record asks for a one-second timeslice, the level meter and the lesson constraints', async () => {
    const r1 = rec();
    render(<VoiceLessonRecorder recorder={r1} />);
    await click(byId('voice-lesson-record'));
    expect(r1.start.mock.calls[0][0]).toMatchObject({ kind: 'meeting', timesliceMs: 1000, measureLevel: true });
    expect(r1.start.mock.calls[0][0].consent.allConsented).toBe(true);
  });

  it('while recording: Stop, the clock, a live level bar and the bytes captured', async () => {
    const r2 = rec({ recording: true, seconds: 12, heardSound: true, bytes: 48 * 1024, level: 0.2 });
    render(<VoiceLessonRecorder recorder={r2} />);
    expect(byId('voice-lesson-clock').textContent).toMatch(/0:12/);
    expect(byId('voice-lesson-bytes').textContent).toMatch(/Hearing you\. 48 KB captured/);
    expect(byId('voice-lesson-level').style.width).toBe('50%');
    expect(byId('voice-lesson-silence')).toBeNull();
    await click(byId('voice-lesson-stop'));
    expect(r2.stop).toHaveBeenCalled();
  });

  it('PROVEN-TO-CATCH ("Never recorded"): 3 s with no bytes is said, with the cause and Start again', () => {
    render(<VoiceLessonRecorder recorder={rec({ recording: true, seconds: 3, bytes: 0 })} />);
    expect(byId('voice-lesson-silence').textContent).toMatch(/isn't giving the app any sound — a phone call, another app, or the Speak button may be holding the microphone/);
    expect(byId('voice-lesson-restart')).toBeTruthy();
  });

  it('PROVEN-TO-CATCH: 3 s of digital silence is said too; 2 s is not yet', () => {
    const { rerender } = render(<VoiceLessonRecorder recorder={rec({ recording: true, seconds: 2, bytes: 4000, silentSeconds: 2 })} />);
    expect(byId('voice-lesson-silence')).toBeNull();
    rerender(<VoiceLessonRecorder recorder={rec({ recording: true, seconds: 3, bytes: 6000, silentSeconds: 3 })} />);
    expect(byId('voice-lesson-silence').textContent).toMatch(/phone call may be using it/);
  });

  it('on stop the take goes to the box with its verdict; an empty take is never ready to send', async () => {
    const onTake = vi.fn();
    const r = rec();
    const { rerender } = render(<VoiceLessonRecorder recorder={r} onTake={onTake} />);
    await click(byId('voice-lesson-record'));
    rerender(<VoiceLessonRecorder recorder={rec({ result: { blob: { size: 0 }, manifest: { seconds: 22 }, measured: true, heardSound: false } })} onTake={onTake} />);
    const take = onTake.mock.calls.at(-1)[0];
    expect(take.seconds).toBe(22);
    expect(take.verdict.ok).toBe(false);
    expect(take.verdict.reason).toMatch(/^Nothing was recorded — the phone gave the app no sound at all/);
  });

  it('a take with audio has playback; an empty one says "Nothing was recorded" and offers no playback', () => {
    const { rerender } = render(<VoiceLessonRecorder recorder={rec()} take={{ blob: blob(), url: 'blob:x', seconds: 22, verdict: { ok: true } }} />);
    expect(byId('voice-lesson-playback')).toBeTruthy();
    expect(byId('voice-lesson-nothing')).toBeNull();
    rerender(<VoiceLessonRecorder recorder={rec()} take={{ blob: { size: 0 }, url: '', seconds: 22, verdict: { ok: false, reason: 'Nothing was recorded — silence.' } }} />);
    expect(byId('voice-lesson-playback')).toBeNull();
    expect(byId('voice-lesson-nothing').textContent).toBe('Nothing was recorded — silence.');
  });

  it('there is no second send button inside the recorder', () => {
    render(<VoiceLessonRecorder recorder={rec()} take={{ blob: blob(), url: 'blob:x', seconds: 22, verdict: { ok: true } }} />);
    expect(byId('voice-lesson-send')).toBeNull();
  });

  it('stops itself at the cap', () => {
    const r = rec({ recording: true, seconds: MAX_LESSON_SECONDS, bytes: 1, heardSound: true });
    render(<VoiceLessonRecorder recorder={r} />);
    expect(r.stop).toHaveBeenCalled();
  });

  it('says so plainly where the browser cannot record', () => {
    render(<VoiceLessonRecorder recorder={rec({ micSupported: false })} />);
    expect(byId('voice-lesson-unsupported')).toBeTruthy();
  });

  it('appears on the Speak box only under the Lesson chip (source pin)', () => {
    const src = readFileSync(join(HERE, '..', 'components', 'OneVoiceInput.jsx'), 'utf8');
    expect(src).toMatch(/\{route === 'lesson' && \(\n\s*<VoiceLessonRecorder/);
  });
});
