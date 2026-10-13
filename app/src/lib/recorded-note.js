// =============================================================================
// recorded-note — record a conversation on the Notes box and keep it, with its
// words, every time (DR-0624)
// =============================================================================
// Darrell, 2026-09-24: "I tried to record a conversation with me and a friend
// like a meeting note taker and it would not even save the note... it shows
// like it's recording however at the end there are not text in the text box."
//
// What failed: the Speak button is the browser's speech engine. It writes
// only words it is sure of, it is not built for two people in a room, and on
// an Android phone during a call it hears nothing at all (the call owns the
// microphone). When it wrote nothing, the box stayed empty and Save had
// nothing to save. The recording was never kept, so nothing could be recovered.
//
// The road now, where THE AUDIO IS THE SOURCE OF TRUTH:
//   1. One tap confirms everyone agreed to be recorded (Illinois is an
//      all-party consent state, 720 ILCS 5/14; the scribe's consent shape).
//   2. The Notes box records audio (the scribe's chunked recorder: wake lock,
//      the 3-hour self-stop), and watches the level so a microphone that
//      gives silence is SAID, never shown as "recording".
//   3. On Stop the note is saved AT ONCE under Your thoughts, marked
//      "Transcribing", and the audio is kept on this phone until it is sent.
//   4. The audio goes to the private lesson-audio bucket under the person's
//      own folder (0229), and one agent_inbox row tagged note + voice asks
//      the NAS rider (infra/nas-lesson-voice, the same one that writes spoken
//      lessons) for the words.
//   5. The rider writes the words to <audio path>.txt in the SAME owner-only
//      folder (never into agent_inbox, which the whole household can read)
//      and files a proof row tagged note + voice-transcript + of:<row id>.
//   6. This module sees the proof row, reads the words, fills the note, and
//      removes the .txt. The person sees the words in the note.
//
// Everything that touches the network takes its I/O as arguments, so the whole
// road is proven in tests without one.
// =============================================================================
import { useEffect, useRef } from 'react';
import { sendRecording, LESSON_AUDIO_BUCKET, formatClock } from './lesson-voice.js';
import { buildConsent, SCRIBE_MAX_DURATION_MIN } from './workflow-scribe.js';
import supabaseClient from './supabase.js';
import { relayThought } from './agent-inbox-sync.js';

export const NOTE_RECORDING_BUCKET = LESSON_AUDIO_BUCKET;
export const NOTE_RECORDING_MAX_SECONDS = SCRIBE_MAX_DURATION_MIN * 60;
export const NOTE_RECORDING_MAX_BYTES = 50 * 1024 * 1024; // the storage upload ceiling (FILE_SIZE_LIMIT)
// 32 kbit/s Opus is clear speech for Whisper, and three hours of it is ~43 MB,
// inside the 50 MB ceiling.
export const NOTE_RECORDING_BITRATE = 32000;
// Processing off, gain on: a person across the table stays audible, and a
// microphone that is taken away reads as true zeros instead of "quiet".
export const NOTE_RECORDING_AUDIO = { echoCancellation: false, noiseSuppression: false, autoGainControl: true };
export const CONSENT_STATEMENT = 'Everyone here agreed to be recorded.';
export const SYNC_INTERVAL_MS = 45000;

/** The consent record kept with the note: the scribe's shape plus when and why. */
export function recordingConsent(nowIso) {
  return {
    ...buildConsent([{ name: 'Everyone here', consented: true }]),
    statement: CONSENT_STATEMENT,
    at: String(nowIso || ''),
    law: 'Illinois all-party consent (720 ILCS 5/14)',
  };
}

export function noteVoiceTags(path, noteId) {
  return ['note', 'voice', `audio:${path}`, `note:${noteId}`, 'consent:all-agreed'];
}

export function noteRecordingBody(seconds) {
  return `A recorded conversation (${formatClock(seconds)}) kept as a private note. The words come back to the note from Whisper on our own machines.`;
}

/** The first line of the saved note. The words are added under it. */
export function recordedNoteText({ startedAtIso, seconds }) {
  let when = '';
  try {
    const d = new Date(startedAtIso);
    if (!Number.isNaN(d.getTime())) when = d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  } catch (_) { when = ''; }
  return `Recorded conversation${when ? ` · ${when}` : ''} · ${formatClock(seconds)}`;
}

/** The words, added under whatever the note holds now (it may have been edited). */
export function fillNoteText(existing, words) {
  const a = String(existing || '').trim();
  const b = String(words || '').trim();
  if (!b) return a;
  return a ? `${a}\n\n${b}` : b;
}

/**
 * The words of an Action Queue item, kept whole as a private note, with one
 * line saying where they came from (2026-09-24: spoken words filed as a work
 * order). Every word is kept; nothing is trimmed.
 */
export function incidentNoteText(item) {
  const words = String((item && item.description) || '').trim();
  const when = String((item && (item.createdAt || item.date)) || '').slice(0, 10);
  return `From the Action Queue${when ? ` (filed there ${when})` : ''}\n\n${words}`;
}

/** Why a recording cannot be sent, or ''. */
export function noteRecordingProblem({ blob, seconds }) {
  if (!blob || !blob.size) return 'Nothing was recorded.';
  if ((Number(seconds) || 0) > NOTE_RECORDING_MAX_SECONDS + 60) return 'The recording is longer than 3 hours.';
  if (blob.size > NOTE_RECORDING_MAX_BYTES) return 'The recording is larger than 50 MB, so it is kept on this phone and not sent.';
  return '';
}

export async function sendNoteRecording({ blob, seconds, noteId, supabase, relay, nowMs = Date.now(), suffix }) {
  const problem = noteRecordingProblem({ blob, seconds });
  if (problem) return { ok: false, reason: problem, path: '', id: null };
  return sendRecording({
    blob, body: noteRecordingBody(seconds), tagsFor: (path) => noteVoiceTags(path, noteId),
    source: 'notes-recording', supabase, relay, nowMs, suffix,
  });
}

/**
 * Ask whether the words for a sent recording are back. Returns
 * { state: 'done', text, rung } | { state: 'failed', reason } | { state: 'waiting' }.
 * Never throws: an unreadable answer is 'waiting', and the next check asks again.
 */
export async function checkNoteTranscript({ voice, supabase }) {
  const id = voice && voice.inboxId;
  const path = voice && voice.path;
  if (!id || !path) return { state: 'waiting' };
  try {
    const { data: done } = await supabase.from('agent_inbox').select('id,body,tags')
      .contains('tags', JSON.stringify(['voice-transcript', `of:${id}`])).limit(1);
    if (done && done.length) {
      const bucket = supabase.storage.from(NOTE_RECORDING_BUCKET);
      const { data: file, error } = await bucket.download(`${path}.txt`);
      if (error || !file) return { state: 'waiting' };
      const text = typeof file === 'string' ? file : await file.text();
      const rungTag = (done[0].tags || []).find((t) => typeof t === 'string' && t.startsWith('whisper:')) || '';
      return { state: 'done', text, rung: rungName(rungTag.slice('whisper:'.length)) };
    }
    const { data: failed } = await supabase.from('agent_inbox').select('id,body,tags')
      .contains('tags', JSON.stringify(['voice-failed', `of:${id}`])).limit(1);
    if (failed && failed.length) return { state: 'failed', reason: plainFailure(failed[0].body) };
  } catch (_) { /* waiting */ }
  return { state: 'waiting' };
}

export function rungName(key) {
  if (key === 'tlcmediadpt') return 'the tower';
  if (key === 'nas-cpu') return 'the home server';
  return key ? key : 'our own machines';
}

function plainFailure(body) {
  const b = String(body || '');
  if (/no Whisper rung answered/i.test(b)) return 'the computers that write the words were switched off. The recording is kept and is tried again when one is back.';
  if (/empty-transcript|no words/i.test(b)) return 'no words could be heard in the recording.';
  return 'the words could not be written yet. The recording is kept and tried again.';
}

/** One plain line for a note's recording, as the person sees it. */
export function voiceStatusLine(voice) {
  if (!voice) return '';
  switch (voice.status) {
    case 'uploading': return 'Saving the recording…';
    case 'transcribing': return 'Transcribing… the words appear here when they are written. You can leave this page.';
    case 'not-sent': return `The recording is kept on this phone but not sent yet (${voice.reason || 'no connection'}). It is sent again by itself; you can also tap Send again.`;
    case 'failed': return `No words yet: ${voice.reason || 'the words could not be written yet.'}`;
    case 'done': return `Transcribed by Whisper on ${voice.rung || 'our own machines'}.`;
    default: return '';
  }
}

export const PENDING_STATUSES = ['uploading', 'not-sent', 'transcribing', 'failed'];

// --- keeping the audio on this phone until it is sent ------------------------

/** An IndexedDB keeper for recordings not yet sent. Every call is wrapped; it never throws. */
export function makeAudioKeeper(idb = (typeof indexedDB !== 'undefined' ? indexedDB : null)) {
  const open = () => new Promise((resolve) => {
    if (!idb) return resolve(null);
    try {
      const req = idb.open('poetech-recordings', 1);
      req.onupgradeneeded = () => { try { req.result.createObjectStore('audio'); } catch (_) { /* exists */ } };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch (_) { resolve(null); }
  });
  const run = async (mode, fn) => {
    const db = await open();
    if (!db) return null;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction('audio', mode);
        const req = fn(tx.objectStore('audio'));
        req.onsuccess = () => resolve(req.result === undefined ? true : req.result);
        req.onerror = () => resolve(null);
      } catch (_) { resolve(null); }
    });
  };
  return {
    put: (id, blob) => run('readwrite', (s) => s.put(blob, id)),
    get: (id) => run('readonly', (s) => s.get(id)),
    del: (id) => run('readwrite', (s) => s.delete(id)),
  };
}

let defaultKeeper = null;
export function audioKeeper() {
  if (!defaultKeeper) defaultKeeper = makeAudioKeeper();
  return defaultKeeper;
}

export function defaultSyncDeps() {
  return { supabase: supabaseClient, relay: relayThought, keeper: audioKeeper() };
}

// --- the sync that brings the words back into the note -----------------------

/**
 * One pass over the notes: resend what was not sent, and fill what came back.
 * Pure over its arguments; returns what it did.
 */
export async function syncRecordedNotes({ notes, patchNote, supabase, relay, keeper, nowMs = Date.now() }) {
  const did = [];
  for (const n of notes || []) {
    const v = n && n.voice;
    if (!v || !PENDING_STATUSES.includes(v.status)) continue;
    const staleUpload = v.status === 'uploading' && (nowMs - Date.parse(v.recordedAt || 0)) > 5 * 60 * 1000;
    if (v.status === 'not-sent' || staleUpload) {
      const blob = keeper ? await keeper.get(n.id) : null;
      if (!blob || !blob.size) continue;
      const res = await sendNoteRecording({ blob, seconds: v.seconds, noteId: n.id, supabase, relay, nowMs });
      if (res.ok) {
        patchNote(n.id, { voice: { status: 'transcribing', inboxId: res.id, path: res.path, reason: '' } });
        if (keeper) await keeper.del(n.id);
        did.push({ id: n.id, sent: true });
      } else {
        patchNote(n.id, { voice: { status: 'not-sent', reason: res.reason } });
        did.push({ id: n.id, sent: false, reason: res.reason });
      }
      continue;
    }
    if (v.status === 'transcribing' || v.status === 'failed') {
      const got = await checkNoteTranscript({ voice: v, supabase });
      if (got.state === 'done') {
        patchNote(n.id, { text: fillNoteText(n.text, got.text), voice: { status: 'done', rung: got.rung, transcribedAt: new Date(nowMs).toISOString(), reason: '' } });
        try { await supabase.storage.from(NOTE_RECORDING_BUCKET).remove([`${v.path}.txt`]); } catch (_) { /* the owner can still read it; harmless */ }
        did.push({ id: n.id, filled: true });
      } else if (got.state === 'failed' && v.status !== 'failed') {
        patchNote(n.id, { voice: { status: 'failed', reason: got.reason } });
        did.push({ id: n.id, failed: true });
      }
    }
  }
  return did;
}

/**
 * useRecordedNoteSync — while any note waits on its recording, check every
 * SYNC_INTERVAL_MS and whenever the page comes back into view.
 */
export function useRecordedNoteSync({ notes, patchNote, deps = null, intervalMs = SYNC_INTERVAL_MS }) {
  const notesRef = useRef(notes);
  notesRef.current = notes;
  const depsRef = useRef(deps);
  depsRef.current = deps;
  // The monolith makes a new patchNote every render; a ref keeps one timer.
  const patchRef = useRef(patchNote);
  patchRef.current = patchNote;
  const canPatch = typeof patchNote === 'function';
  const waiting = (notes || []).some((n) => n && n.voice && PENDING_STATUSES.includes(n.voice.status));
  useEffect(() => {
    if (!waiting || !canPatch) return undefined;
    let busy = false;
    const tick = async () => {
      if (busy) return;
      busy = true;
      try {
        const d = depsRef.current || defaultSyncDeps();
        await syncRecordedNotes({ notes: notesRef.current, patchNote: (...a) => patchRef.current(...a), ...d });
      } catch (_) { /* the next tick asks again */ } finally { busy = false; }
    };
    tick();
    const t = setInterval(tick, intervalMs);
    const onVis = () => { if (typeof document !== 'undefined' && document.visibilityState === 'visible') tick(); };
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', onVis);
    return () => {
      clearInterval(t);
      if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', onVis);
    };
  }, [waiting, canPatch, intervalMs]);
}
