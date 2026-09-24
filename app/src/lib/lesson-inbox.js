// =============================================================================
// lesson-inbox — the speaker's own receipt for every lesson they sent
// (DR-0622: every workflow's output seeds the next; the sender sees it close)
// =============================================================================
// A lesson sent from the app (typed, or spoken and written down by Whisper on
// our own machines, DR-0611) lands in agent_inbox. The NAS job transcribes the
// spoken ones and carries every lesson row to where the cloud lesson reader
// can see it, tagging the original `mirrored` (DR-0614). Until this module,
// nothing in the app read those rows back: the speaker was told "Sent" and
// then saw nothing, not even the words Whisper wrote. This reads them back.
//
// The states, each one a fact in the row's own tags (never inferred):
//   waiting  — a spoken lesson Whisper has not written down yet
//   written  — its transcript row exists (tags voice-transcript + of:<id>)
//   failed   — the transcriber gave up and said why (voice-failed + of:<id>)
//   sent     — a typed lesson, filed
//   reader   — the row (or its transcript) was carried to the lesson reader
//              (tag `mirrored`)
// Pure except fetchMyLessons, which takes the Supabase client as an argument.
// =============================================================================

const has = (row, t) => Array.isArray(row && row.tags) && row.tags.includes(t);
const ofTag = (row) => (Array.isArray(row && row.tags) ? (row.tags.find((t) => String(t).startsWith('of:')) || '').slice(3) : '');

export const LESSON_STATES = Object.freeze({
  waiting: 'Waiting for Whisper to write it down',
  written: 'Written down by Whisper',
  failed: 'Could not be written down',
  sent: 'Received',
});

/** Rows → one item per lesson the person sent, newest first. */
export function lessonItems(rows) {
  const list = Array.isArray(rows) ? rows : [];
  const children = new Map();
  for (const r of list) {
    const of = ofTag(r);
    if (of && (has(r, 'voice-transcript') || has(r, 'voice-failed'))) children.set(`${of}:${has(r, 'voice-failed') ? 'failed' : 'transcript'}`, r);
  }
  const items = [];
  for (const r of list) {
    if (!has(r, 'lesson') || has(r, 'voice-transcript') || has(r, 'voice-failed')) continue;
    const spoken = has(r, 'voice');
    const transcript = children.get(`${r.id}:transcript`) || null;
    const failure = children.get(`${r.id}:failed`) || null;
    const state = !spoken ? 'sent' : transcript ? 'written' : failure ? 'failed' : 'waiting';
    const carried = has(r, 'mirrored') || has(transcript, 'mirrored') || has(failure, 'mirrored');
    items.push({
      id: r.id,
      createdAt: r.created_at || '',
      spoken,
      state,
      label: LESSON_STATES[state],
      body: String(r.body || ''),
      words: transcript ? String(transcript.body || '') : '',
      why: failure ? String(failure.body || '') : '',
      withReader: carried,
    });
  }
  return items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

/** The signed-in person's own lesson rows. { ok, items, reason }. */
export async function fetchMyLessons({ supabase, limit = 100 } = {}) {
  try {
    const { data: sess } = await supabase.auth.getSession();
    const uid = sess?.session?.user?.id || null;
    if (!uid) return { ok: false, items: [], reason: 'signed-out' };
    const { data, error } = await supabase
      .from('agent_inbox')
      .select('id, body, tags, created_at')
      .contains('tags', ['lesson'])
      .eq('created_by', uid)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) return { ok: false, items: [], reason: error.message };
    return { ok: true, items: lessonItems(data || []), reason: '' };
  } catch (e) {
    return { ok: false, items: [], reason: e?.message || 'unknown' };
  }
}

// The transcript row's body starts with a header line naming the rung and the
// model; the words follow it. Show the words, not the header, when present.
export function transcriptWords(body) {
  const s = String(body || '');
  const i = s.indexOf('\n\n');
  return i >= 0 ? s.slice(i + 2).trim() : s.trim();
}
// "voice-transcript" is the tag the NAS job writes on a transcript row.
export const TRANSCRIPT_TAG = 'voice-transcript';
