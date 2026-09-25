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
export function voiceLessonBody(note, seconds) {
  const typed = String(note || '').trim();
  const head = `Lesson. A spoken lesson (${formatClock(seconds)}); the words arrive as a transcript from Whisper on our own machines.`;
  return typed ? `${head}\n\nTyped with it: ${typed}` : head;
}

export function voiceLessonTags(path) {
  return ['lesson', 'voice', `audio:${path}`];
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
export async function sendVoiceLesson({ blob, seconds, note = '', source = 'church-one-voice', supabase, relay, nowMs = Date.now(), suffix, extraTags = [] }) {
  const problem = recordingProblem({ blob, seconds });
  if (problem) return { ok: false, reason: problem, path: '', id: null };
  // The member's naming choice (DR-0639) rides the spoken lesson too: the same
  // notice sits above the one Send, so the same choice must reach the reader.
  const extra = Array.isArray(extraTags) ? extraTags.filter((t) => typeof t === 'string' && t) : [];
  return sendRecording({ blob, body: voiceLessonBody(note, seconds), tagsFor: (path) => [...voiceLessonTags(path), ...extra], source, supabase, relay, nowMs, suffix });
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
