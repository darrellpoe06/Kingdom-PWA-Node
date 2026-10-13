// =============================================================================
// lesson-voice — a lesson spoken as a recording, transcribed by Whisper on our
// own machines, and delivered to the lesson intake as words (DR-0611)
// =============================================================================
// Darrell, 2026-09-24: "can whisper work for us?" then "Go build the Whisper
// intake". The road, end to end, with no inbound door opened anywhere:
//
//   1. The Speak box records the lesson (MediaRecorder, the same hook voice
//      enrollment uses) and uploads the audio to the PRIVATE `lesson-audio`
//      bucket under the speaker's own folder (migration 0229; the folder IS
//      the access rule).
//   2. It files one agent_inbox row tagged lesson + voice + audio:<path>, so
//      the words that will come back have somewhere to belong.
//   3. The NAS loop `lesson-voice-transcribe` polls Supabase OUTBOUND (the
//      DR-0132 bus), downloads the audio, transcribes it with Whisper on the
//      tower (CPU Whisper on the NAS when the tower is dark), keeps the audio
//      on the NAS, files the transcript as a new agent_inbox row tagged lesson
//      + voice-transcript + of:<row id>, and deletes the cloud copy.
//   4. The lesson reader builds the lesson from the transcript row.
//
// Everything here is pure or takes its I/O as arguments, so the whole send is
// proven in tests without a network.
// =============================================================================

export const LESSON_AUDIO_BUCKET = 'lesson-audio';
export const MIN_LESSON_SECONDS = 3;
export const MAX_LESSON_SECONDS = 30 * 60;
export const MAX_LESSON_BYTES = 50 * 1024 * 1024;

export function extFor(mime) {
  const m = String(mime || '').toLowerCase();
  if (m.includes('mp4') || m.includes('aac') || m.includes('m4a')) return 'm4a';
  if (m.includes('ogg')) return 'ogg';
  if (m.includes('wav')) return 'wav';
  return 'webm';
}

/** `<uid>/<UTC stamp>-<suffix>.<ext>` — the first folder is the owner (the storage policy). */
export function lessonAudioPath(uid, nowMs, mime, suffix = '') {
  const u = String(uid || '').trim();
  if (!/^[0-9a-f-]{36}$/i.test(u)) return '';
  const d = new Date(Number.isFinite(nowMs) ? nowMs : 0);
  const stamp = d.toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
  const tail = String(suffix || '').replace(/[^a-z0-9]/gi, '').slice(0, 8) || 'v';
  return `${u}/${stamp}-${tail}.${extFor(mime)}`;
}

export function formatClock(seconds) {
  const s = Math.max(0, Math.floor(Number(seconds) || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** The inbox row's body: says what it is and that the words follow, plus any typed note. */
export function voiceLessonBody(note, seconds, kind = DEFAULT_RECORDING_KIND) {
  const typed = String(note || '').trim();
  const reading = normalizeRecordingKind(kind) === 'reading';
  const head = reading
    ? `Reading aloud. Someone reading a text out loud (${formatClock(seconds)}); the words arrive as a transcript from Whisper on our own machines. Recorded as a reading, so no lesson is built from it.`
    : `Lesson. A spoken lesson (${formatClock(seconds)}); the words arrive as a transcript from Whisper on our own machines.`;
  return typed ? `${head}\n\nTyped with it: ${typed}` : head;
}

export function voiceLessonTags(path) {
  return ['lesson', 'voice', `audio:${path}`];
}

// WHAT KIND OF RECORDING THIS IS, SAID AT RECORD TIME (DR-0810). DR-0768
// named the gap and dated it: a child's homework reading arrived as a lesson
// row, the NAS builder's gate refused it five times, and a human had to go
// tag it `not-a-lesson` by hand — "the recorder still offers no choice at
// record time between a teaching and a reading, so the next homework reading
// will arrive as a lesson row again and need the same verdict by hand."
//
// So the recorder asks, once, before Send. The row still rides the SAME road:
// it keeps `lesson` and `voice`, so Whisper still transcribes it and the words
// still come back to the person who read them. What changes is that a reading
// arrives already carrying the verdict DR-0768 built — `not-a-lesson` with its
// reason — so no builder tries to make a lesson of it and nobody has to go
// decide again what was already decided when the record button was pressed.

export const RECORDING_KINDS = Object.freeze(['teaching', 'reading']);
export const DEFAULT_RECORDING_KIND = 'teaching';

/** The words on the two buttons, and the one line under each. */
export const RECORDING_KIND_LABELS = Object.freeze({
  teaching: { label: 'A teaching', help: 'A word taught or spoken to build a lesson from.' },
  reading: { label: 'Reading aloud', help: 'Someone reading a text out loud. The words come back; no lesson is built.' },
});

export const READING_REASON = 'recorded as a reading aloud, not a teaching';

export function normalizeRecordingKind(kind) {
  return RECORDING_KINDS.includes(kind) ? kind : DEFAULT_RECORDING_KIND;
}

/**
 * The extra tags a kind adds. A teaching adds nothing — it is what the road
 * already assumed. A reading carries the DR-0768 verdict from the start.
 */
export function recordingKindTags(kind) {
  if (normalizeRecordingKind(kind) !== 'reading') return [];
  return ['reading-aloud', 'not-a-lesson', `not-a-lesson-reason:${READING_REASON}`];
}

/** True when a row's tags say a human already decided it is not a lesson. */
export function alreadyDecidedNotALesson(tags = []) {
  return (Array.isArray(tags) ? tags : []).some((t) => t === 'not-a-lesson');
}

/** Why a recording cannot be sent, or '' when it can. */
export function recordingProblem({ blob, seconds }) {
  if (!blob || !blob.size) return 'Nothing was recorded.';
  if ((Number(seconds) || 0) < MIN_LESSON_SECONDS) return `Record at least ${MIN_LESSON_SECONDS} seconds.`;
  if ((Number(seconds) || 0) > MAX_LESSON_SECONDS) return `A spoken lesson can run up to ${MAX_LESSON_SECONDS / 60} minutes; split a longer one in two.`;
  if (blob.size > MAX_LESSON_BYTES) return 'The recording is larger than 50 MB; split it in two.';
  return '';
}

/**
 * sendVoiceLesson — upload the audio, then file the inbox row. Returns
 * { ok, reason, path, id }. A failed upload files nothing; a failed row after
 * a good upload removes the uploaded audio, so no orphan waits in the bucket.
 */
export async function sendVoiceLesson({ blob, seconds, note = '', kind = DEFAULT_RECORDING_KIND, source = 'church-one-voice', supabase, relay, nowMs = Date.now(), suffix, extraTags = [] }) {
  const problem = recordingProblem({ blob, seconds });
  if (problem) return { ok: false, reason: problem, path: '', id: null };
  // The member's naming choice (DR-0639) rides the spoken lesson too: the same
  // notice sits above the one Send, so the same choice must reach the reader.
  const extra = Array.isArray(extraTags) ? extraTags.filter((t) => typeof t === 'string' && t) : [];
  // The kind chosen at record time rides with it (DR-0810).
  const kindTags = recordingKindTags(kind);
  return sendRecording({ blob, body: voiceLessonBody(note, seconds, kind), tagsFor: (path) => [...voiceLessonTags(path), ...extra, ...kindTags], source, supabase, relay, nowMs, suffix });
}

/**
 * sendRecording — the one upload-then-relay road every recording rides (a
 * spoken lesson, a recorded conversation, DR-0624). Same bucket, same owner
 * folder, same waiting-room rule; only the body and tags differ.
 */
export async function sendRecording({ blob, body, tagsFor, source, supabase, relay, nowMs = Date.now(), suffix }) {
  if (!blob || !blob.size) return { ok: false, reason: 'Nothing was recorded.', path: '', id: null };
  let uid;
  try {
    const { data } = await supabase.auth.getSession();
    uid = data?.session?.user?.id || null;
  } catch (_) { uid = null; }
  if (!uid) return { ok: false, reason: 'signed-out', path: '', id: null };
  const path = lessonAudioPath(uid, nowMs, blob.type, suffix || Math.random().toString(36).slice(2, 8));
  if (!path) return { ok: false, reason: 'no-account-id', path: '', id: null };
  const bucket = supabase.storage.from(LESSON_AUDIO_BUCKET);
  const up = await bucket.upload(path, blob, { contentType: blob.type || 'audio/webm', upsert: false });
  if (up && up.error) return { ok: false, reason: `upload: ${up.error.message || up.error}`, path: '', id: null };
  const res = await relay({ body, tags: tagsFor(path), source });
  if (!res || !res.ok) {
    try { await bucket.remove([path]); } catch (_) { /* best-effort cleanup */ }
    return { ok: false, reason: (res && res.reason) || 'relay-failed', path: '', id: null };
  }
  return { ok: true, reason: '', path, id: res.id || null };
}
