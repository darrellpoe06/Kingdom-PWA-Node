// @vitest-environment jsdom
// =============================================================================
// A spoken lesson records, the box's one Send sends it, and the words come back
// to the speaker (DR-0636). Darrell, 2026-09-24 4:41pm, on his Fold: the clock
// read 0:22 / 30:00, "Doesn't work!!!!!!", "Never recorded", "Can't push send
// because nothing populated in the text box... make sense?!!!", and "never saw
// anything any text... nothing".
//
// Proven on the real Speak box (church surface, Lesson chip) with the real
// recorder hook; only the browser and the network are faked. The fakes behave
// like the real things where it matters: the recorder hands audio over every
// timeslice, a muted microphone reads true zeros, and PostgREST refuses a
// jsonb filter that is not JSON.
// =============================================================================
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';

const ME = 'f13843f2-742b-4f8a-82af-7ecfbdc536ec';
const OTHER = '0b9a5c1e-1111-4222-8333-944455556666';

const H = vi.hoisted(() => {
  const state = { inbox: [], objects: {}, relayed: [], uid: 'f13843f2-742b-4f8a-82af-7ecfbdc536ec' };
  const chain = (resolve) => {
    const q = { calls: [] };
    const proxy = new Proxy({}, {
      get(_, prop) {
        if (prop === 'then') return (ok, bad) => Promise.resolve(resolve(q)).then(ok, bad);
        return (...args) => { q.calls.push([prop, ...args]); return proxy; };
      },
    });
    return proxy;
  };
  const supabase = {
    auth: { getSession: async () => ({ data: { session: state.uid ? { user: { id: state.uid } } : null } }) },
    rpc: async () => ({ data: null, error: null }),
    from: (table) => chain((q) => {
      if (table !== 'agent_inbox') return { data: [], error: null };
      let rows = state.inbox.slice();
      for (const c of q.calls) {
        if (c[0] === 'contains') {
          // PostgREST casts the value to jsonb: anything but JSON is refused.
          if (typeof c[2] !== 'string') return { data: null, error: { message: 'invalid input syntax for type json' } };
          const want = JSON.parse(c[2]);
          rows = rows.filter((r) => want.every((t) => r.tags.includes(t)));
        }
        if (c[0] === 'eq') rows = rows.filter((r) => r[c[1]] === c[2]);
      }
      return { data: rows, error: null };
    }),
    storage: { from: () => ({ upload: async (p, b) => { state.objects[p] = b; return { error: null }; }, remove: async () => ({ error: null }) }) },
  };
  const relay = async ({ body, tags, source }) => {
    const id = `row-${state.inbox.length + 1}`;
    const row = { id, body, tags, source, created_by: state.uid, created_at: new Date().toISOString() };
    state.inbox.push(row);
    state.relayed.push(row);
    return { ok: true, reason: '', id };
  };
  return { state, supabase, relay };
});
vi.mock('../lib/supabase.js', () => ({ default: H.supabase }));
vi.mock('../lib/agent-inbox-sync.js', () => ({ relayThought: (...a) => H.relay(...a) }));

import OneVoiceInput, { spokenLessonLine, isSpokenLessonLine } from '../components/OneVoiceInput.jsx';
import LessonInbox from '../components/LessonInbox.jsx';
import { fetchMyLessons } from '../lib/lesson-inbox.js';
import { liveSpeechSessions } from '../lib/voice-dictation.js';
import { takeVerdict, silenceMessage, formatBytes } from '../lib/workflow-scribe.js';
import { SYSTEM_FLOW } from '../../../scripts/system-flow-registry.mjs';
import { buildFlowGraph } from '../../../scripts/system-flow-graph.mjs';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// --- the browser: a recorder that hands audio over every timeslice ----------
const MIC = { level: 0.2 };
class FakeMediaRecorder {
  static isTypeSupported() { return true; }
  constructor(stream, opts) { this.mimeType = 'audio/webm;codecs=opus'; this.state = 'inactive'; this.opts = opts; }
  start(ms) {
    this.state = 'recording';
    this.timer = setInterval(() => {
      const size = MIC.level > 0 ? 4000 : 0; // a muted microphone gives the encoder nothing to say
      if (size) this.ondataavailable && this.ondataavailable({ data: new Blob(['a'.repeat(size)], { type: 'audio/webm' }) });
    }, ms || 1000);
  }
  stop() {
    clearInterval(this.timer);
    this.state = 'inactive';
    this.onstop && this.onstop();
  }
}
class FakeAudioContext {
  createAnalyser() { return { fftSize: 2048, getFloatTimeDomainData(buf) { buf.fill(MIC.level); } }; }
  createMediaStreamSource() { return { connect() {} }; }
  close() {}
}
class FakeRecognition {
  constructor() { FakeRecognition.last = this; this.stopped = 0; }
  start() {}
  stop() { this.stopped += 1; this.onend && this.onend(); }
}

let container = null;
let root = null;
async function render(el) {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => { root.render(el); });
}
const byId = (id) => container.querySelector(`[data-testid="${id}"]`);
const button = (re) => [...container.querySelectorAll('button')].find((b) => re.test(b.textContent));
async function click(node) { await act(async () => { node.dispatchEvent(new MouseEvent('click', { bubbles: true })); }); }
async function tick(n) { for (let i = 0; i < n; i += 1) await act(async () => { vi.advanceTimersByTime(1000); }); }
async function flush() { for (let i = 0; i < 6; i += 1) await act(async () => { await Promise.resolve(); }); }

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'setTimeout', 'clearTimeout'] });
  H.state.inbox = []; H.state.objects = {}; H.state.relayed = []; H.state.uid = ME;
  MIC.level = 0.2;
  localStorage.clear();
  window.MediaRecorder = FakeMediaRecorder;
  window.AudioContext = FakeAudioContext;
  window.URL.createObjectURL = () => 'blob:take';
  Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia: async () => ({ getTracks: () => [{ stop() {} }], getVideoTracks: () => [] }) } });
});
afterEach(async () => {
  if (root) await act(async () => root.unmount());
  if (container) container.remove();
  root = null; container = null;
  vi.useRealTimers();
  delete window.MediaRecorder; delete window.AudioContext; delete navigator.mediaDevices;
  delete window.SpeechRecognition;
});

async function openLesson() {
  await render(<OneVoiceInput surface="church" />);
  await click(button(/Lesson/i));
}

describe('one Send for a spoken lesson', () => {
  it('record → the box is never empty → Stop → the box holds the lesson → the main Send is enabled and sends it', async () => {
    await openLesson();
    const send = byId('one-voice-send');
    expect(send.disabled).toBe(true); // nothing yet
    await click(byId('voice-lesson-record'));
    await flush();
    await tick(4);
    // While recording the box SAYS so, and Send waits for Stop.
    expect(byId('one-voice-text').value).toBe('Recording your lesson… 0:04');
    expect(byId('one-voice-send').disabled).toBe(true);
    expect(byId('voice-lesson-bytes').textContent).toMatch(/Hearing you\. \d+ KB captured/);
    await click(byId('voice-lesson-stop'));
    await flush();
    // THE FIX: the box holds the lesson and the ONE Send is live.
    expect(byId('one-voice-text').value).toBe('Spoken lesson, 0:04 (the words come back from Whisper)');
    expect(byId('one-voice-send').disabled).toBe(false);
    expect(byId('one-voice-send').textContent).toBe('Send the lesson');
    expect(byId('voice-lesson-playback')).toBeTruthy();
    expect(byId('voice-lesson-send')).toBeNull(); // no second send
    await click(byId('one-voice-send'));
    await flush();
    const row = H.state.relayed[0];
    expect(row.tags.slice(0, 2)).toEqual(['lesson', 'voice']);
    expect(row.tags[2].startsWith(`audio:${ME}/`)).toBe(true);
    expect(Object.keys(H.state.objects)).toHaveLength(1);
    expect(container.textContent).toMatch(/Sent\. Whisper on our own machines writes the words/);
    expect(byId('one-voice-text').value).toBe('');
  });

  it('PROVEN-TO-CATCH (today\'s dead Send): the typed-words-only path would leave Send disabled after a spoken take', () => {
    // The old rule was `disabled={!text.trim()}` with nothing ever put in the
    // box by the recorder. The line the box now holds is non-empty by design.
    expect(spokenLessonLine(22)).toBe('Spoken lesson, 0:22 (the words come back from Whisper)');
    expect(spokenLessonLine(22).trim().length).toBeGreaterThan(0);
    expect(isSpokenLessonLine(spokenLessonLine(22))).toBe(true);
    expect(isSpokenLessonLine('keys of hell and death')).toBe(false);
  });

  it('a silent microphone: the alert shows in 3 s, and Stop says "Nothing was recorded" with no Send', async () => {
    MIC.level = 0;
    await openLesson();
    await click(byId('voice-lesson-record'));
    await flush();
    await tick(2);
    expect(byId('voice-lesson-silence')).toBeNull();
    await tick(1);
    expect(byId('voice-lesson-silence').textContent).toMatch(/isn't giving the app any sound/);
    await click(byId('voice-lesson-stop'));
    await flush();
    expect(byId('voice-lesson-nothing').textContent).toMatch(/^Nothing was recorded/);
    expect(byId('voice-lesson-playback')).toBeNull();
    expect(byId('one-voice-text').value).toBe('');
    expect(byId('one-voice-send').disabled).toBe(true);
    expect(H.state.relayed).toHaveLength(0);
  });

  it('typed words ride with the recording as the note', async () => {
    await openLesson();
    await click(byId('voice-lesson-record'));
    await flush();
    await tick(3);
    await click(byId('voice-lesson-stop'));
    await flush();
    const ta = byId('one-voice-text');
    await act(async () => {
      Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set.call(ta, 'The keys of hell and death');
      ta.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await click(byId('one-voice-send'));
    await flush();
    expect(H.state.relayed[0].body).toMatch(/Typed with it: The keys of hell and death/);
  });

  it('the Speak button\'s hold on the microphone is released before recording starts', async () => {
    window.SpeechRecognition = FakeRecognition;
    await openLesson();
    await click(button(/Speak/));
    expect(liveSpeechSessions()).toBe(1);
    await click(byId('voice-lesson-record'));
    await flush();
    expect(FakeRecognition.last.stopped).toBeGreaterThan(0);
    expect(liveSpeechSessions()).toBe(0);
  });
});

describe('the speaker sees what happened to the lesson', () => {
  const rows = () => [
    { id: 'v1', created_by: ME, body: 'Lesson. A spoken lesson (1:06)…', tags: ['lesson', 'voice', 'audio:x', 'voice-failed', 'voice-transcribed'], created_at: '2026-09-24T16:05:01Z' },
    { id: 'f1', created_by: ME, body: 'Lesson. A spoken lesson could not be transcribed after 3 tries. Last reason: no Whisper rung answered.', tags: ['lesson', 'voice-failed', 'of:v1'], created_at: '2026-09-24T17:13:47Z' },
    { id: 't1', created_by: ME, body: 'Lesson. A spoken lesson, transcribed by Whisper (small) on the NAS CPU, 1:07.\n\nThese are the words he said.', tags: ['lesson', 'voice-transcript', 'of:v1', 'whisper:nas-cpu'], created_at: '2026-09-24T21:33:39Z' },
    { id: 'o1', created_by: OTHER, body: 'Lesson. A spoken lesson (0:30)…', tags: ['lesson', 'voice', 'audio:y'], created_at: '2026-09-24T18:00:00Z' },
    { id: 'o2', created_by: OTHER, body: 'Lesson. transcribed\n\nAnother member\'s private words.', tags: ['lesson', 'voice-transcript', 'of:o1'], created_at: '2026-09-24T18:10:00Z' },
  ];

  it('PROVEN-TO-CATCH: a transcript that exists is SHOWN under the Lesson recorder (it was on no surface)', async () => {
    H.state.inbox = rows();
    await openLesson();
    await flush();
    expect(byId('lesson-inbox')).toBeTruthy();
    expect(byId('lesson-words').textContent).toBe('These are the words he said.');
    expect(container.textContent).toMatch(/Written down by Whisper/);
  });

  it('the jsonb filter is JSON; an array filter is refused, which is why nothing ever showed', async () => {
    H.state.inbox = rows();
    const r = await fetchMyLessons({ supabase: H.supabase });
    expect(r.ok).toBe(true);
    const bad = await H.supabase.from('agent_inbox').select('id').contains('tags', ['lesson']);
    expect(bad.error.message).toMatch(/invalid input syntax for type json/);
  });

  it('a member (not Darrell) sees only their own lessons, and Darrell only his', async () => {
    H.state.inbox = rows();
    H.state.uid = OTHER;
    const theirs = await fetchMyLessons({ supabase: H.supabase });
    expect(theirs.items.map((i) => i.id)).toEqual(['o1']);
    expect(theirs.items[0].words).toMatch(/Another member/);
    H.state.uid = ME;
    const mine = await fetchMyLessons({ supabase: H.supabase });
    expect(mine.items.map((i) => i.id)).toEqual(['v1']);
    expect(JSON.stringify(mine)).not.toMatch(/Another member/);
  });

  it('a failure is shown with its reason and what happens next', async () => {
    H.state.inbox = rows().filter((r) => r.id !== 't1');
    await render(<LessonInbox deps={{ supabase: H.supabase }} />);
    await flush();
    expect(byId('lesson-why').textContent).toMatch(/no Whisper rung answered/);
    expect(container.textContent).toMatch(/tried again by itself/);
  });

  it('the words go back to the box, and the spoken-lesson loop closes in the flow graph', async () => {
    H.state.inbox = rows();
    await openLesson();
    await flush();
    await click(byId('lesson-words-to-box'));
    expect(byId('one-voice-text').value).toBe('These are the words he said.');
    const loop = buildFlowGraph(SYSTEM_FLOW).loops.find((l) => l.id === 'spoken-lesson-loop');
    expect(loop.closed).toBe(true);
  });
});

describe('the pure pieces', () => {
  it('verdicts, the silence rule and the byte count', () => {
    expect(takeVerdict({ blob: { size: 0 } }).ok).toBe(false);
    expect(takeVerdict({ blob: { size: 10 }, measured: true, heardSound: false }).reason).toMatch(/only silence/);
    expect(takeVerdict({ blob: { size: 10 }, measured: true, heardSound: true }).ok).toBe(true);
    expect(silenceMessage({ silentSeconds: 0, warnAfter: 3, recordingSeconds: 3, bytes: 0 })).toMatch(/any sound/);
    expect(silenceMessage({ silentSeconds: 0, warnAfter: 3, recordingSeconds: 2, bytes: 0 })).toBe('');
    expect(formatBytes(48 * 1024)).toBe('48 KB');
  });
});
