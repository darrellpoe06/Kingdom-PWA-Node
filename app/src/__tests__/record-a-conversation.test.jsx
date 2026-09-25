// @vitest-environment jsdom
// =============================================================================
// Record a conversation and keep it (DR-0624). Darrell, 2026-09-24: "I tried to
// record a conversation with me and a friend like a meeting note taker and it
// would not even save the note... it shows like it's recording however at the
// end there are not text in the text box."
//
// Proven on the real surface (the Notes tab's Thinking Space, with its real
// recorder hook), with only the browser and the network faked:
//   record -> Stop -> a saved note marked Transcribing -> the words fill it;
//   a microphone that gives silence (a phone call holds it) is SAID;
//   a dictation session with no final words never leaves a silently empty box
//   (the original defect, proven-to-catch).
// @testing-library is not installed: createRoot + act, as the repo does.
// =============================================================================
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { act, useState } from 'react';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRoot } from 'react-dom/client';

const UID = 'f13843f2-742b-4f8a-82af-7ecfbdc536ec';

// --- the network, faked: one store the rider and the app both see ------------
const H = vi.hoisted(() => {
  const state = { inbox: [], objects: {}, removed: [], relayed: [], signedIn: true };
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
    auth: { getSession: async () => ({ data: { session: state.signedIn ? { user: { id: 'f13843f2-742b-4f8a-82af-7ecfbdc536ec' } } : null } }) },
    rpc: async () => ({ data: null, error: null }),
    from: (table) => chain((q) => {
      if (table !== 'agent_inbox') return { data: [], error: null };
      const c = q.calls.find((x) => x[0] === 'contains');
      const want = c ? JSON.parse(c[2]) : [];
      return { data: state.inbox.filter((r) => want.every((t) => r.tags.includes(t))), error: null };
    }),
    storage: {
      from: () => ({
        upload: async (path, blob) => { state.objects[path] = blob; return { error: null }; },
        download: async (path) => (path in state.objects
          ? { data: { text: async () => String(state.objects[path]) }, error: null }
          : { data: null, error: { message: 'not found' } }),
        remove: async (paths) => { paths.forEach((p) => { delete state.objects[p]; state.removed.push(p); }); return { error: null }; },
      }),
    },
  };
  const relay = async ({ body, tags, source }) => {
    if (!state.signedIn) return { ok: false, reason: 'signed-out', id: null };
    const id = `inbox-${state.inbox.length + 1}`;
    state.inbox.push({ id, body, tags, source });
    state.relayed.push({ id, body, tags, source });
    return { ok: true, reason: '', id };
  };
  return { state, supabase, relay };
});
vi.mock('../lib/supabase.js', () => ({ default: H.supabase }));
vi.mock('../lib/agent-inbox-sync.js', () => ({ relayThought: (...a) => H.relay(...a) }));

import { ThinkingSpace } from '../components/ThinkingSpace.jsx';
import ConversationRecorder, { plainSendReason } from '../components/ConversationRecorder.jsx';
import OneVoiceInput from '../components/OneVoiceInput.jsx';
import {
  noteVoiceTags, recordingConsent, recordedNoteText, fillNoteText, noteRecordingProblem,
  sendNoteRecording, checkNoteTranscript, syncRecordedNotes, voiceStatusLine, incidentNoteText,
  NOTE_RECORDING_AUDIO, NOTE_RECORDING_BITRATE,
} from '../lib/recorded-note.js';
import { silenceMessage, peakLevel, explainMicError, SILENCE_WARN_SECONDS } from '../lib/workflow-scribe.js';
import { sessionOutcome, extractInterimTranscript, explainVoiceError } from '../lib/voice-dictation.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// --- the browser, faked: a microphone, a recorder, a level meter -------------
const MIC = { level: 0.2, refuse: null, lastConstraints: null, lastOpts: null };
class FakeMediaRecorder {
  static isTypeSupported() { return true; }
  constructor(stream, opts) { this.stream = stream; this.mimeType = 'audio/webm;codecs=opus'; this.state = 'inactive'; MIC.lastOpts = opts; }
  start() { this.state = 'recording'; }
  stop() {
    this.state = 'inactive';
    this.ondataavailable && this.ondataavailable({ data: new Blob(['a'.repeat(4096)], { type: 'audio/webm' }) });
    this.onstop && this.onstop();
  }
}
class FakeAudioContext {
  createAnalyser() { return { fftSize: 2048, getFloatTimeDomainData(buf) { buf.fill(MIC.level); } }; }
  createMediaStreamSource() { return { connect() {} }; }
  close() {}
}
function installBrowser() {
  window.MediaRecorder = FakeMediaRecorder;
  window.AudioContext = FakeAudioContext;
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: {
      getUserMedia: async (c) => {
        MIC.lastConstraints = c;
        if (MIC.refuse) { const e = new Error('refused'); e.name = MIC.refuse; throw e; }
        return { getTracks: () => [{ stop() {} }], getVideoTracks: () => [] };
      },
    },
  });
}
function removeBrowser() {
  delete window.MediaRecorder;
  delete window.AudioContext;
  delete navigator.mediaDevices;
  delete window.SpeechRecognition;
  delete window.webkitSpeechRecognition;
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
const allById = (id) => [...container.querySelectorAll(`[data-testid="${id}"]`)];
async function click(node) {
  await act(async () => { node.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
}
async function seconds(n) {
  for (let i = 0; i < n; i += 1) {
    await act(async () => { vi.advanceTimersByTime(1000); });
  }
}
async function flush() {
  for (let i = 0; i < 6; i += 1) await act(async () => { await Promise.resolve(); });
}

// The Notes tab: the monolith's addNote / patchNote over real state.
function NotesTab({ spy }) {
  const [notes, setNotes] = useState([]);
  const addNote = (text, extra = null) => {
    const id = (extra && extra.id) || `nt-${notes.length + 1}`;
    setNotes((ns) => [...ns, { id, text, createdAt: new Date().toISOString(), ...(extra && extra.voice ? { voice: extra.voice } : {}) }]);
    spy.added.push({ text, extra });
    return id;
  };
  const patchNote = (id, patch) => {
    spy.patched.push({ id, patch });
    setNotes((ns) => ns.map((n) => (n.id === id ? { ...n, ...patch, ...(patch.voice ? { voice: { ...(n.voice || {}), ...patch.voice } } : {}) } : n)));
  };
  spy.notes = notes;
  return <ThinkingSpace notes={notes} addNote={addNote} patchNote={patchNote} recordingDeps={{ supabase: H.supabase, relay: H.relay, keeper: null }} />;
}

beforeEach(() => {
  H.state.inbox = []; H.state.objects = {}; H.state.removed = []; H.state.relayed = []; H.state.signedIn = true;
  MIC.level = 0.2; MIC.refuse = null; MIC.lastConstraints = null; MIC.lastOpts = null;
  localStorage.clear();
  installBrowser();
});
afterEach(async () => {
  if (root) await act(async () => root.unmount());
  if (container) container.remove();
  root = null; container = null;
  vi.useRealTimers();
  removeBrowser();
});

// The NAS rider's part of the road, as it behaves on the live database: it
// writes the words beside the audio in the owner's folder and files a proof
// row (infra/nas-lesson-voice/lesson_voice_transcribe.py, proven in Python).
function riderTranscribes(words, rung = 'nas-cpu') {
  const row = H.state.inbox.find((r) => r.tags.includes('voice') && r.tags.includes('note'));
  const path = row.tags.find((t) => t.startsWith('audio:')).slice('audio:'.length);
  H.state.objects[`${path}.txt`] = words;
  H.state.inbox.push({ id: 'proof-1', body: 'Recorded note transcribed: 9 words', tags: ['note', 'voice-transcript', `of:${row.id}`, `whisper:${rung}`] });
  return { row, path };
}

describe('record a conversation on the Notes tab: saved on Stop, the words fill the note', () => {
  it('record -> consent -> Stop -> a saved note marked Transcribing -> the transcript fills it', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'setTimeout', 'clearTimeout', 'Date'] });
    vi.setSystemTime(new Date('2026-09-24T19:05:00Z'));
    const spy = { added: [], patched: [], notes: [] };
    await render(<NotesTab spy={spy} />);

    // The Record button is on the Notes box, where "Listen to the whole thing" was.
    await click(byId('record-conversation'));
    // One tap of consent, and the phone-call truth is said before recording.
    expect(byId('record-consent').textContent).toMatch(/everyone in the conversation has to agree/i);
    expect(byId('record-consent').textContent).toMatch(/phone call on this same phone cannot be recorded/i);
    await click(byId('consent-start'));
    await flush();
    expect(MIC.lastConstraints.audio).toEqual(NOTE_RECORDING_AUDIO);
    expect(MIC.lastOpts.audioBitsPerSecond).toBe(NOTE_RECORDING_BITRATE);
    expect(byId('record-stop')).toBeTruthy();

    await seconds(7);
    expect(byId('record-clock').textContent).toBe('0:07');
    expect(byId('record-hearing').textContent).toMatch(/hearing sound/);
    expect(byId('record-silence')).toBeNull();

    await click(byId('record-stop'));
    await flush();

    // SAVED AT ONCE: the note exists under Your thoughts, marked, with consent.
    expect(spy.added).toHaveLength(1);
    expect(spy.added[0].text).toMatch(/^Recorded conversation · Sep 24, .* · 0:07$/);
    expect(spy.added[0].extra.voice.consent.allConsented).toBe(true);
    expect(spy.added[0].extra.voice.consent.statement).toBe('Everyone here agreed to be recorded.');
    expect(byId('record-saved').textContent).toMatch(/Saved under Your thoughts\. Transcribing/);
    expect(container.textContent).toMatch(/Your thoughts · 1/);

    // Uploaded to the owner's own folder and asked for the words.
    const asked = H.state.relayed[0];
    expect(asked.tags).toEqual(expect.arrayContaining(['note', 'voice', 'consent:all-agreed', `note:${spy.added[0].extra.id}`]));
    const audioTag = asked.tags.find((t) => t.startsWith('audio:'));
    expect(audioTag.startsWith(`audio:${UID}/`)).toBe(true);
    expect(asked.body).not.toMatch(/lesson/i);
    expect(byId('note-voice-status').textContent).toMatch(/^Transcribing…/);

    // The NAS writes the words; the next check fills the note.
    const { path } = riderTranscribes('We agreed to meet Tuesday about the roof and the budget.');
    await act(async () => { vi.advanceTimersByTime(45000); });
    await flush();
    const note = spy.notes[0];
    expect(note.text).toMatch(/^Recorded conversation · .*\n\nWe agreed to meet Tuesday about the roof and the budget\.$/);
    expect(note.voice.status).toBe('done');
    expect(byId('note-voice-status').textContent).toBe('Transcribed by Whisper on the home server.');
    expect(container.textContent).toMatch(/We agreed to meet Tuesday about the roof/);
    expect(container.textContent).toMatch(/Everyone here agreed to be recorded · Sep 24/);
    // The words' waiting copy is removed once they are in the note.
    expect(H.state.removed).toContain(`${path}.txt`);
  });

  it('a silent microphone (a phone call holds it) is SAID, never shown as recording', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'setTimeout', 'clearTimeout'] });
    MIC.level = 0; // Android hands a page true zeros while a call holds the mic
    const spy = { added: [], patched: [], notes: [] };
    await render(<NotesTab spy={spy} />);
    await click(byId('record-conversation'));
    await click(byId('consent-start'));
    await flush();
    await seconds(SILENCE_WARN_SECONDS - 1);
    expect(byId('record-silence')).toBeNull();
    await seconds(1);
    expect(byId('record-silence').textContent).toMatch(/isn't letting the app hear the microphone — a phone call may be using it/);
    expect(byId('record-silence').getAttribute('role')).toBe('alert');
    expect(byId('record-hearing')).toBeNull();
    // Stop still saves: the recording is never discarded for having no words.
    await click(byId('record-stop'));
    await flush();
    expect(spy.added).toHaveLength(1);
    expect(spy.added[0].extra.voice.silent).toBe(true);
    expect(byId('record-saved').textContent).toMatch(/gave only silence/);
  });

  it('PROVEN-TO-CATCH: the meter is what speaks — with sound, no warning; with zeros, the warning', () => {
    expect(silenceMessage({ silentSeconds: SILENCE_WARN_SECONDS - 1 })).toBe('');
    expect(silenceMessage({ silentSeconds: SILENCE_WARN_SECONDS })).toMatch(/phone call/);
    expect(peakLevel(new Float32Array(8))).toBe(0);
    expect(peakLevel(Float32Array.from([0, -0.3, 0.1]))).toBeCloseTo(0.3);
  });

  it('a refused microphone is said in words (NotReadableError is a phone call)', async () => {
    MIC.refuse = 'NotReadableError';
    await render(<NotesTab spy={{ added: [], patched: [], notes: [] }} />);
    await click(byId('record-conversation'));
    await click(byId('consent-start'));
    await flush();
    expect(byId('record-error').textContent).toMatch(/phone call or another app is using it/);
    expect(byId('record-stop')).toBeNull();
    expect(explainMicError({ name: 'NotAllowedError' })).toMatch(/permission is off/);
  });

  it('a failed upload keeps the note and says Send again; it is never lost', async () => {
    H.state.signedIn = false;
    const spy = { added: [], patched: [], notes: [] };
    await render(<NotesTab spy={spy} />);
    await click(byId('record-conversation'));
    await click(byId('consent-start'));
    await flush();
    await click(byId('record-stop'));
    await flush();
    expect(spy.added).toHaveLength(1);
    expect(spy.notes[0].voice.status).toBe('not-sent');
    expect(byId('note-voice-status').textContent).toMatch(/kept on this phone but not sent yet \(you are signed out\)/);
    expect(byId('note-voice-send-again')).toBeTruthy();
  });
});

describe('the Speak button: words live, and never a silently empty box', () => {
  class FakeRecognition {
    constructor() { FakeRecognition.last = this; }
    start() {}
    stop() { this.onend && this.onend(); }
  }
  const result = (text, isFinal) => { const r = [{ transcript: text }]; r.isFinal = isFinal; return r; };

  beforeEach(() => { window.SpeechRecognition = FakeRecognition; });

  it('PROVEN-TO-CATCH (the 2026-09-24 defect): a session with no final words says so and offers Record', async () => {
    const addNote = vi.fn();
    await render(<OneVoiceInput surface="notes" submitLabel="Save" addNote={addNote} />);
    const speak = [...container.querySelectorAll('button')].find((b) => /Speak/.test(b.textContent));
    await click(speak);
    // What the phone did: it started, maybe heard noise, and wrote nothing.
    await act(async () => { FakeRecognition.last.onresult({ resultIndex: 0, results: [result('um', false)] }); });
    const stop = [...container.querySelectorAll('button')].find((b) => /Stop/.test(b.textContent));
    await click(stop);
    expect(byId('one-voice-text').value).toBe('');
    const said = byId('dictation-no-words');
    expect(said).toBeTruthy();
    expect(said.textContent).toMatch(/The phone heard no words, so nothing was written and nothing was saved/);
    expect(addNote).not.toHaveBeenCalled();
    // One tap moves to recording, which always keeps the audio.
    await click(byId('record-instead'));
    expect(byId('record-consent')).toBeTruthy();
  });

  it('interim words show in the box while speaking; finals are kept', async () => {
    await render(<OneVoiceInput surface="notes" submitLabel="Save" addNote={vi.fn()} />);
    const speak = [...container.querySelectorAll('button')].find((b) => /Speak/.test(b.textContent));
    await click(speak);
    await act(async () => { FakeRecognition.last.onresult({ resultIndex: 0, results: [result('hello there', false)] }); });
    expect(byId('one-voice-text').value).toBe('hello there');
    await act(async () => { FakeRecognition.last.onresult({ resultIndex: 0, results: [result('hello there friend', true)] }); });
    expect(byId('one-voice-text').value).toBe('hello there friend');
    const stop = [...container.querySelectorAll('button')].find((b) => /Stop/.test(b.textContent));
    await click(stop);
    expect(byId('dictation-no-words')).toBeNull();
  });

  it('PROVEN-TO-CATCH (the Action Queue screenshot): spoken words that say "paint" stay a private note, never a work order', async () => {
    const addNote = vi.fn();
    const addIncident = vi.fn();
    await render(<OneVoiceInput surface="notes" submitLabel="Save" addNote={addNote} addIncident={addIncident} />);
    const speak = [...container.querySelectorAll('button')].find((b) => /Speak/.test(b.textContent));
    await click(speak);
    await act(async () => { FakeRecognition.last.onresult({ resultIndex: 0, results: [result('get all that paint and everything else out of the sanctuary', true)] }); });
    const stop = [...container.querySelectorAll('button')].find((b) => /Stop/.test(b.textContent));
    await click(stop);
    // The chip did not move: Private is still the chosen destination.
    const privateChip = [...container.querySelectorAll('button')].find((b) => /Private/i.test(b.textContent) && b.getAttribute('aria-pressed') !== null);
    expect(privateChip.getAttribute('aria-pressed')).toBe('true');
    const save = [...container.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Save');
    await click(save);
    expect(addIncident).not.toHaveBeenCalled();
    expect(addNote).toHaveBeenCalledWith('get all that paint and everything else out of the sanctuary');
  });

  it('typed words may still suggest (the suggestion is for typing, not for speech)', () => {
    const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'components', 'OneVoiceInput.jsx'), 'utf8');
    expect(src).toMatch(/onTranscript: \(t\) => setText\(/);
    expect(src).toMatch(/onChange=\{e => onText\(e\.target\.value\)\}/);
  });

  it('nothing heard for a while is said instead of "listening"', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    await render(<OneVoiceInput surface="notes" submitLabel="Save" addNote={vi.fn()} />);
    const speak = [...container.querySelectorAll('button')].find((b) => /Speak/.test(b.textContent));
    await click(speak);
    expect(byId('dictation-nothing-heard')).toBeNull();
    await act(async () => { vi.advanceTimersByTime(8000); });
    expect(byId('dictation-nothing-heard').textContent).toMatch(/Not hearing anything yet/);
    expect(container.textContent).not.toMatch(/listening…/);
  });

  it('the engine errors are plain words', () => {
    expect(explainVoiceError('audio-capture')).toMatch(/phone call/);
    expect(explainVoiceError('not-allowed')).toMatch(/permission is off/);
    expect(sessionOutcome({ ran: true, finalWords: 0 })).toBe('no-words');
    expect(sessionOutcome({ ran: true, finalWords: 3 })).toBe('words');
    expect(extractInterimTranscript({ resultIndex: 0, results: [result('a', true), result('b', false)] })).toBe('b');
  });

  it('a surface that keeps no notes keeps "Listen to the whole thing" (combined, not duplicated)', async () => {
    await render(<OneVoiceInput surface="church" />);
    expect(byId('listen-whole-thing')).toBeTruthy();
    expect(byId('record-conversation')).toBeNull();
  });

  it('the Notes box offers Record in its place', async () => {
    await render(<OneVoiceInput surface="notes" addNote={vi.fn()} />);
    expect(byId('record-conversation')).toBeTruthy();
    expect(byId('listen-whole-thing')).toBeNull();
    expect(allById('record-conversation')).toHaveLength(1);
  });
});

describe('the pure road (lib/recorded-note.js)', () => {
  const blob = (size = 2048) => ({ size, type: 'audio/webm' });

  it('tags ask for the words and carry consent; no lesson tag', () => {
    expect(noteVoiceTags('u/a.webm', 'nt-1')).toEqual(['note', 'voice', 'audio:u/a.webm', 'note:nt-1', 'consent:all-agreed']);
    const c = recordingConsent('2026-09-24T19:00:00Z');
    expect(c.allConsented).toBe(true);
    expect(c.law).toMatch(/720 ILCS 5\/14/);
  });

  it('the note text and the fill', () => {
    expect(recordedNoteText({ startedAtIso: 'bad', seconds: 75 })).toBe('Recorded conversation · 1:15');
    expect(fillNoteText('Head', 'words')).toBe('Head\n\nwords');
    expect(fillNoteText('Head', '  ')).toBe('Head');
  });

  it('size and length limits are said, not silently refused', () => {
    expect(noteRecordingProblem({ blob: null, seconds: 5 })).toMatch(/Nothing/);
    expect(noteRecordingProblem({ blob: blob(51 * 1024 * 1024), seconds: 5 })).toMatch(/kept on this phone/);
    expect(noteRecordingProblem({ blob: blob(), seconds: 3 * 3600 + 120 })).toMatch(/3 hours/);
    expect(noteRecordingProblem({ blob: blob(), seconds: 2 })).toBe('');
  });

  it('sendNoteRecording uploads then files one row', async () => {
    const res = await sendNoteRecording({ blob: blob(), seconds: 30, noteId: 'nt-9', supabase: H.supabase, relay: H.relay, nowMs: Date.parse('2026-09-24T19:00:00Z'), suffix: 'ab' });
    expect(res.ok).toBe(true);
    expect(res.path).toBe(`${UID}/20260924T190000Z-ab.webm`);
    expect(Object.keys(H.state.objects)).toEqual([res.path]);
    expect(H.state.relayed[0].source).toBe('notes-recording');
  });

  it('checkNoteTranscript: waiting, failed, done', async () => {
    const voice = { inboxId: 'inbox-7', path: `${UID}/x.webm` };
    expect((await checkNoteTranscript({ voice, supabase: H.supabase })).state).toBe('waiting');
    H.state.inbox.push({ id: 'f', body: 'no Whisper rung answered -- dark', tags: ['note', 'voice-failed', 'of:inbox-7'] });
    const failed = await checkNoteTranscript({ voice, supabase: H.supabase });
    expect(failed.state).toBe('failed');
    expect(failed.reason).toMatch(/switched off.*tried again/);
    H.state.inbox.push({ id: 't', body: 'x', tags: ['note', 'voice-transcript', 'of:inbox-7', 'whisper:tlcmediadpt'] });
    H.state.objects[`${UID}/x.webm.txt`] = 'the words';
    expect(await checkNoteTranscript({ voice, supabase: H.supabase })).toEqual({ state: 'done', text: 'the words', rung: 'the tower' });
  });

  it('a not-sent recording is sent again from this phone', async () => {
    const kept = { [`nt-5`]: blob() };
    const keeper = { get: async (id) => kept[id], del: async (id) => { delete kept[id]; } };
    const patches = [];
    const did = await syncRecordedNotes({
      notes: [{ id: 'nt-5', text: 'Recorded conversation', voice: { status: 'not-sent', seconds: 30 } }],
      patchNote: (id, p) => patches.push({ id, p }), supabase: H.supabase, relay: H.relay, keeper,
    });
    expect(did[0].sent).toBe(true);
    expect(patches[0].p.voice.status).toBe('transcribing');
    expect(kept['nt-5']).toBeUndefined();
  });

  it('an Action Queue item that was really spoken words becomes a private note, every word kept', () => {
    const words = 'or do in person Q&A and it is open to anyone like Bible topics';
    expect(incidentNoteText({ description: words, createdAt: '2026-08-03T12:00:00Z' })).toBe(`From the Action Queue (filed there 2026-08-03)\n\n${words}`);
    const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'components', 'BigPictureDashboard.jsx'), 'utf8');
    expect(src).toMatch(/data-testid="incident-to-note"/);
    expect(src).toMatch(/addNote\(incidentNoteText\(sourceItem\)\); if \(resolveIncident\) resolveIncident\(q\.id\);/);
    const shell = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'poe-financial-mvp-v28.jsx'), 'utf8');
    expect(shell).toMatch(/<Home [^\n]*addNote=\{addNote\}/);
  });

  it('status lines are plain words', () => {
    expect(voiceStatusLine({ status: 'transcribing' })).toMatch(/^Transcribing…/);
    expect(voiceStatusLine({ status: 'done', rung: 'the tower' })).toBe('Transcribed by Whisper on the tower.');
    expect(plainSendReason('signed-out')).toBe('you are signed out');
  });
});

describe('ConversationRecorder with an injected recorder', () => {
  it('Stop saves before any network call returns', async () => {
    const addNote = vi.fn();
    let release;
    const slowSend = { supabase: H.supabase, relay: () => new Promise((r) => { release = r; }) };
    const rec = { micSupported: true, recording: false, seconds: 0, result: null, errorMessage: '', silentSeconds: 0, heardSound: true, start: vi.fn(async () => ({ ok: true })), stop: vi.fn() };
    await render(<ConversationRecorder addNote={addNote} recorder={rec} deps={slowSend} keeper={{ put: async () => true, del: async () => true }} />);
    await click(byId('record-conversation'));
    await click(byId('consent-start'));
    expect(rec.start.mock.calls[0][0].consent.allConsented).toBe(true);
    const done = { ...rec, recording: false, result: { blob: { size: 999, type: 'audio/webm' }, manifest: { seconds: 12, startedAt: '2026-09-24T19:00:00Z', consent: { allConsented: true } }, measured: true, heardSound: true } };
    await act(async () => { root.render(<ConversationRecorder addNote={addNote} recorder={done} deps={slowSend} keeper={{ put: async () => true, del: async () => true }} />); });
    await flush();
    expect(addNote).toHaveBeenCalledTimes(1);
    expect(addNote.mock.calls[0][1].voice.status).toBe('uploading');
    expect(release).toBeTypeOf('function'); // the relay is still waiting; the note is already saved
    release({ ok: true, id: 'x' });
  });
});
