// =============================================================================
// voice-enroll — "Add my voice": a person adds their own voice, with their own
// consent, so a class recording puts their name beside their words (DR-0720)
// =============================================================================
// Darrell, 2026-10-01: "can we somehow validate people using only their voice
// so we can tag people who are speaking when we record?" and "Can you get my
// voice the same way?"
//
// THE ROAD (every step the person's own; nothing reaches a cloud company):
//   1. They read what is kept and tap to agree: give_voice_consent() writes
//      their own voice_enrollments row with the time (migration 0246).
//   2. They read Psalm 23 (KJV) aloud for about 25 seconds, on the same
//      recorder the spoken lessons use (lib/workflow-scribe.js).
//   3. sendVoiceSample() asks the database for their consent row FIRST and
//      uploads nothing without it; then it uploads the sample to their own
//      folder of the private lesson-audio bucket (0229, the lessons' own road)
//      and calls send_voice_sample(), which refuses without consent too.
//   4. The NAS (infra/nas-lesson-voice/voice_enroll.py) makes ONE voiceprint,
//      deletes the sample unless they chose to keep it, and writes back
//      "added" or why not. The voiceprint never leaves the NAS.
//   5. removeMyVoice() deletes the consent at once; the NAS stops naming the
//      voice from that moment and deletes the print on its next pass.
// =============================================================================
import { LESSON_AUDIO_BUCKET, lessonAudioPath } from './lesson-voice.js';

// Psalm 23, King James Version, VERBATIM from app/public/bible/kjv/Psalms.json
// (chapter 23, verses 1-6). voice-enroll.test.js compares it to that file.
export const VOICE_PASSAGE = Object.freeze({
  ref: 'Psalm 23:1-6',
  translation: 'KJV',
  verses: Object.freeze([
    'The LORD is my shepherd; I shall not want.',
    'He maketh me to lie down in green pastures: he leadeth me beside the still waters.',
    'He restoreth my soul: he leadeth me in the paths of righteousness for his name’s sake.',
    'Yea, though I walk through the valley of the shadow of death, I will fear no evil: for thou art with me; thy rod and thy staff they comfort me.',
    'Thou preparest a table before me in the presence of mine enemies: thou anointest my head with oil; my cup runneth over.',
    'Surely goodness and mercy shall follow me all the days of my life: and I will dwell in the house of the LORD for ever.',
  ]),
});

// The words a person agrees to. Stored with their consent row, word for word.
export const VOICE_CONSENT_POINTS = Object.freeze([
  'What is kept: a voice signature, which is a list of numbers made from your voice. It is not the recording, and it cannot be played back as your voice.',
  'Where: only on our own server at home (the NAS). It is never sent to a cloud company.',
  'What it is for: to put your name beside your words when a class is recorded in the app. Nothing else.',
  'The recording you make here is deleted as soon as the signature is made, unless you choose below to keep it.',
  'You can remove your voice at any time with Remove my voice. That deletes the signature and this consent.',
]);
export const VOICE_CONSENT_TEXT = `I agree to Add my voice. ${VOICE_CONSENT_POINTS.join(' ')}`;

export const MIN_SAMPLE_SECONDS = 15;
export const MAX_SAMPLE_SECONDS = 120;
export const MAX_SAMPLE_BYTES = 10 * 1024 * 1024;
export const HELD_LABELS = Object.freeze({ BG: 'Bishop Gwin', DP: 'Darrell Poe' });

/** "JM" from "jm " — two or three capital letters, or ''. Pure. */
export function normalizeLabel(s) {
  const t = String(s || '').trim().toUpperCase();
  return /^[A-Z]{2,3}$/.test(t) ? t : '';
}

/** Initials suggested from a name: "Jane Mercy" -> "JM". Pure. */
export function suggestLabel(name) {
  const parts = String(name || '').trim().split(/\s+/).filter((w) => /^[A-Za-z]/.test(w));
  if (!parts.length) return '';
  const letters = parts.length === 1 ? parts[0].slice(0, 2) : parts.slice(0, 3).map((w) => w[0]).join('');
  return normalizeLabel(letters);
}

/** Why a label cannot be used, or ''. Mirrors give_voice_consent(); the database decides. */
export function labelProblem(label, { isGovernor = false } = {}) {
  const l = normalizeLabel(label);
  if (!l) return 'Use two or three letters, like your initials (JM).';
  if (l === 'BG') return 'BG is held for Bishop Gwin. Choose other letters.';
  if (l === 'DP' && !isGovernor) return 'DP is held for Darrell Poe. Choose other letters.';
  return '';
}

/** Where a person's voice stands, in words, from their own row. Pure. */
export function voiceState(row) {
  if (!row) return { state: 'none', added: false, line: 'Your voice is not added. Class recordings show you as S1, S2 until it is.' };
  const added = !!row.enrolled_at;
  const label = row.label || '';
  const name = row.display_name ? ` (${row.display_name})` : '';
  if (row.status === 'sample-sent') {
    const wait = row.reason ? ` ${row.reason}` : ' Our home server makes the signature within about 15 minutes. Check back here.';
    return { state: 'waiting', added, line: `Your sample is sent.${wait}` };
  }
  if (row.status === 'refused') {
    return { state: 'refused', added, line: `Your voice was not added. ${row.reason || 'No reason was given.'}${added ? ` Your earlier signature still stands as ${label}.` : ''}` };
  }
  if (added) return { state: 'added', added, line: `Your voice is added. Class recordings show your words as ${label}${name}.` };
  return { state: 'consented', added, line: 'You agreed. Now read the psalm aloud and send it.' };
}

/** Why a sample cannot be sent, or ''. Pure. */
export function sampleProblem({ blob, seconds }) {
  if (!blob || !blob.size) return 'Nothing was recorded.';
  if ((Number(seconds) || 0) < MIN_SAMPLE_SECONDS) return `Read for at least ${MIN_SAMPLE_SECONDS} seconds; the whole psalm takes about 25.`;
  if ((Number(seconds) || 0) > MAX_SAMPLE_SECONDS) return `Keep it under ${MAX_SAMPLE_SECONDS / 60} minutes; the psalm is enough.`;
  if (blob.size > MAX_SAMPLE_BYTES) return 'The recording is larger than 10 MB. Record it again.';
  return '';
}

async function myUid(supabase) {
  try {
    const { data } = await supabase.auth.getSession();
    return data?.session?.user?.id || null;
  } catch (_) { return null; }
}

/** { ok, row, reason }: the person's own consent row (RLS returns only theirs). */
export async function loadMyVoice({ supabase }) {
  const uid = await myUid(supabase);
  if (!uid) return { ok: false, row: null, reason: 'signed-out' };
  try {
    const { data, error } = await supabase
      .from('voice_enrollments')
      .select('user_id,label,display_name,status,reason,consented_at,enrolled_at,keep_sample,sample_path,updated_at')
      .eq('user_id', uid)
      .maybeSingle();
    if (error) return { ok: false, row: null, reason: error.message || String(error) };
    return { ok: true, row: data || null, reason: '' };
  } catch (e) {
    return { ok: false, row: null, reason: (e && e.message) || 'unreadable' };
  }
}

/** The tap to agree. Writes the consent words and the time. */
export async function agreeToVoice({ supabase, label, displayName = '', keepSample = false, isGovernor = false }) {
  const problem = labelProblem(label, { isGovernor });
  if (problem) return { ok: false, reason: problem };
  const { data, error } = await supabase.rpc('give_voice_consent', {
    p_label: normalizeLabel(label), p_display_name: String(displayName || '').trim().slice(0, 80),
    p_consent_text: VOICE_CONSENT_TEXT, p_keep_sample: !!keepSample,
  });
  if (error) return { ok: false, reason: String(error.message || error).replace(/^give_voice_consent:\s*/, '') };
  return { ok: true, reason: '', result: data };
}

/**
 * sendVoiceSample — CONSENT FIRST: the database is asked for the person's own
 * consent row before anything is uploaded; with none, nothing leaves the
 * device. Then the sample goes to their own folder and send_voice_sample()
 * files it for the NAS; a refused filing removes the upload.
 */
export async function sendVoiceSample({ supabase, blob, seconds, nowMs = Date.now(), suffix }) {
  const mine = await loadMyVoice({ supabase });
  if (!mine.ok) return { ok: false, reason: mine.reason === 'signed-out' ? 'Sign in first.' : `Your consent could not be read (${mine.reason}).` };
  if (!mine.row) return { ok: false, reason: 'consent-required' };
  const problem = sampleProblem({ blob, seconds });
  if (problem) return { ok: false, reason: problem };
  const path = lessonAudioPath(mine.row.user_id, nowMs, blob.type, suffix || `voice${Math.random().toString(36).slice(2, 5)}`);
  if (!path) return { ok: false, reason: 'no-account-id' };
  const bucket = supabase.storage.from(LESSON_AUDIO_BUCKET);
  const up = await bucket.upload(path, blob, { contentType: blob.type || 'audio/webm', upsert: false });
  if (up && up.error) return { ok: false, reason: `upload: ${up.error.message || up.error}` };
  const { error } = await supabase.rpc('send_voice_sample', { p_path: path });
  if (error) {
    try { await bucket.remove([path]); } catch (_) { /* best-effort cleanup */ }
    return { ok: false, reason: String(error.message || error).replace(/^send_voice_sample:\s*/, '') };
  }
  return { ok: true, reason: '', path };
}

/** Remove my voice: the consent row goes now, with any sample still waiting. */
export async function removeMyVoice({ supabase }) {
  const { data, error } = await supabase.rpc('remove_my_voice');
  if (error) return { ok: false, reason: String(error.message || error) };
  const waiting = data && data.sample_path;
  if (waiting) {
    try { await supabase.storage.from(LESSON_AUDIO_BUCKET).remove([waiting]); } catch (_) { /* the NAS never uses it: no consent row */ }
  }
  return {
    ok: true,
    removed: !!(data && data.removed),
    line: data && data.removed
      ? `Your voice is removed. Your consent is deleted now, and our home server deletes your voice signature${data.label ? ` (${data.label})` : ''} on its next pass, within about 15 minutes. It is not used from this moment.`
      : 'There was no voice to remove.',
  };
}

/** The Governor's label list (never a vector, never a path); [] for anyone else. */
export async function loadVoiceLabels({ supabase }) {
  try {
    const { data, error } = await supabase.rpc('voice_enrollment_labels');
    if (error || !Array.isArray(data)) return [];
    return data;
  } catch (_) { return []; }
}
