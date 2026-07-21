// =============================================================================
// story-library -- the testimony-first Story Library (Layer 2 curation spine)
// =============================================================================
// Darrell 2026-07-21: "keep a running record of potential stories that users
// begin to become a curator for because they fit the Word... I have personal
// stories that fit better than anything I've heard... never lie call a parable
// and testimony whatever they actually are."
//
// The AI parables shipped first (living-lessons-class.js stories[]) for training
// and as the pattern to learn from. This module is where a user CURATES: they
// capture a story that fits a verse, a steward reviews it, and it is promoted
// into a lesson's stories[] in the SAME shape the curriculum already renders.
//
// The heart of it is the never-lie truth-label gate (validateSubmission), the
// exact rule the curriculum's promotion test enforces (lesson-flow.test.js):
//   - kind is exactly 'parable' or 'testimony' -- never a fiction called true;
//   - a TESTIMONY claims a real, lived event, so it MUST carry attribution
//     (source) AND explicit consent to share. A PARABLE claims nothing real, so
//     it needs neither. "cant fix users from lying" -- but we can refuse to let
//     an UNattributed, UNconsented claim ride as a true account.
//
// Persistence mirrors feedback-sync: a local draft store means nothing is ever
// lost while signed out, and a best-effort Supabase mirror (table
// story_library_submissions, migration 0109, RLS-walled) carries it across
// devices and into the shared steward queue once signed in.
// =============================================================================

// supabase is imported LAZILY (inside the async mirror functions only) so that
// importing this module's PURE logic (validate/normalize/drafts) never pulls the
// browser-only supabase client -- which touches window.localStorage at load and
// would crash a node-environment test that transitively imports this file.
async function getSupabase() {
  const mod = await import('./supabase.js');
  return mod.default;
}

export const STORY_KINDS = ['parable', 'testimony'];
export const STORY_TONES = ['light', 'solemn'];
export const STORY_STATUSES = ['draft', 'submitted', 'reviewed', 'promoted', 'declined'];

// Minimum body length. A story is a scene, not a sentence -- short enough to
// keep the bar low for a first draft, long enough to reject an empty stub.
export const MIN_BODY_WORDS = 25;

const LS_KEY = 'poe-story-library-drafts-v1';

const wordCount = (s) => String(s || '').trim().split(/\s+/).filter(Boolean).length;
const nonEmpty = (s) => typeof s === 'string' && s.trim().length > 0;

/**
 * The never-lie truth-label gate. Returns { ok, errors } -- errors is an array
 * of human-readable strings, empty when ok. This is the single source of truth
 * for "is this submission honestly labeled and complete enough to promote", and
 * it is the same rule the curriculum's story gate applies.
 *
 * @param sub { kind, tone, title, body, verse, source?, consent? }
 */
export function validateSubmission(sub) {
  const errors = [];
  const s = sub || {};

  if (!STORY_KINDS.includes(s.kind)) {
    errors.push('Kind must be exactly "parable" or "testimony" -- call it what it truly is.');
  }
  if (s.tone != null && !STORY_TONES.includes(s.tone)) {
    errors.push('Tone, when set, must be "light" or "solemn".');
  }
  if (!nonEmpty(s.title)) errors.push('A title is required.');
  if (!nonEmpty(s.verse)) errors.push('A verse reference the story serves is required.');
  if (!nonEmpty(s.body)) {
    errors.push('A story body is required.');
  } else if (wordCount(s.body) < MIN_BODY_WORDS) {
    errors.push(`The story is too short (${wordCount(s.body)} words; at least ${MIN_BODY_WORDS}).`);
  }

  // A testimony CLAIMS a real, lived event. It may only ride as true when it is
  // attributed AND its teller has consented to share it. A parable claims
  // nothing real, so it carries no such burden.
  if (s.kind === 'testimony') {
    if (!nonEmpty(s.source)) {
      errors.push('A testimony must be attributed (who lived it) -- a real account is never anonymous-as-fact.');
    }
    if (s.consent !== true) {
      errors.push('A testimony needs explicit consent to share before it can be published.');
    }
  }

  return { ok: errors.length === 0, errors };
}

/** True when a submission is complete + honestly labeled enough to promote. */
export function canPromote(sub) {
  return validateSubmission(sub).ok;
}

/**
 * Produce the exact lesson `stories[]` element shape the curriculum renders.
 * Only defined for a submission that passes the gate. `source` is carried ONLY
 * for a testimony (a parable never fabricates attribution).
 */
export function normalizeForPromotion(sub) {
  const v = validateSubmission(sub);
  if (!v.ok) {
    throw new Error('normalizeForPromotion: submission is not promotable: ' + v.errors.join(' '));
  }
  const out = {
    kind: sub.kind,
    tone: STORY_TONES.includes(sub.tone) ? sub.tone : 'light',
    title: sub.title.trim(),
    body: sub.body.trim(),
    verse: sub.verse.trim(),
  };
  if (sub.kind === 'testimony') out.source = sub.source.trim();
  return out;
}

// ---------------------------------------------------------------------------
// Local draft store -- nothing is lost while signed out (feedback-sync pattern).
// ---------------------------------------------------------------------------

function readLS() {
  try {
    const raw = (typeof localStorage !== 'undefined') ? localStorage.getItem(LS_KEY) : null;
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}
function writeLS(arr) {
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(LS_KEY, JSON.stringify(arr));
  } catch { /* best-effort */ }
}

/** A stable local id that does not depend on Date.now/Math.random being present. */
function localId(sub) {
  const basis = `${sub.kind || '?'}|${(sub.title || '').trim()}|${(sub.verse || '').trim()}`;
  let h = 0;
  for (let i = 0; i < basis.length; i++) { h = (h * 31 + basis.charCodeAt(i)) | 0; }
  return 'sl-' + (h >>> 0).toString(36);
}

/** List local drafts (newest first by insertion order kept in the array tail). */
export function listDrafts() {
  return readLS().slice().reverse();
}

/** Save (upsert by id/local-id) a draft locally. Returns the stored draft. */
export function saveDraft(sub) {
  const arr = readLS();
  const id = sub.id || localId(sub);
  const draft = { ...sub, id, status: sub.status || 'draft' };
  const idx = arr.findIndex((d) => d.id === id);
  if (idx >= 0) arr[idx] = draft; else arr.push(draft);
  writeLS(arr);
  return draft;
}

/** Remove a local draft by id. */
export function removeDraft(id) {
  writeLS(readLS().filter((d) => d.id !== id));
}

// ---------------------------------------------------------------------------
// Supabase mirror -- best-effort, shaped for table story_library_submissions.
// Every path no-ops gracefully signed out; the local draft store already holds
// the content, so nothing is ever lost.
// ---------------------------------------------------------------------------

async function currentSession() {
  const supabase = await getSupabase();
  const { data } = await supabase.auth.getSession();
  return data.session ?? null;
}

async function ensureInstance(displayName) {
  const supabase = await getSupabase();
  const { data, error } = await supabase.rpc('join_default_instance', {
    display_name_in: displayName ?? null,
  });
  if (error) throw error;
  return data; // instance_id
}

/**
 * Submit a story to the shared curation queue. Enforces the truth-label gate
 * BEFORE any write. Best-effort: returns { skipped } signed out or on error,
 * never throws for the caller (the local draft is the durable copy).
 */
export async function submitStory(sub, meta = {}) {
  const gate = validateSubmission(sub);
  if (!gate.ok) return { skipped: 'invalid', errors: gate.errors };

  const session = await currentSession();
  if (!session) return { skipped: 'signed-out' };

  let instanceId;
  try {
    instanceId = await ensureInstance(meta.displayName);
  } catch (e) {
    console.warn('[story-library] instance setup failed:', e);
    return { skipped: 'no-instance', error: e };
  }

  const row = {
    instance_id: instanceId,
    kind: sub.kind,
    tone: STORY_TONES.includes(sub.tone) ? sub.tone : 'light',
    title: sub.title.trim(),
    body: sub.body.trim(),
    verse: sub.verse.trim(),
    source: sub.kind === 'testimony' ? sub.source.trim() : (nonEmpty(sub.source) ? sub.source.trim() : null),
    consent: sub.kind === 'testimony' ? true : !!sub.consent,
    target_lesson_id: nonEmpty(sub.target_lesson_id) ? sub.target_lesson_id : null,
    status: 'submitted',
    submitted_by: session.user.id,
    submitted_name: meta.displayName || session.user.email?.split('@')[0] || 'Member',
  };

  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('story_library_submissions')
    .insert(row)
    .select()
    .single();
  if (error) {
    console.warn('[story-library] submit failed:', error);
    return { skipped: 'insert-error', error };
  }
  return { ok: true, row: data };
}

/**
 * Pull the shared curation queue + listen for changes. onRemote(rows) fires
 * with the current array each time it changes. Returns an unsubscribe fn.
 * No-op signed out.
 */
export function subscribeSubmissions(onRemote) {
  let channel = null;
  let sb = null;
  let cancelled = false;

  (async () => {
    const session = await currentSession();
    if (!session || cancelled) return;
    sb = await getSupabase();

    const pull = async () => {
      const { data, error } = await sb
        .from('story_library_submissions')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && !cancelled) onRemote(data || []);
    };
    await pull();

    channel = sb
      .channel('story-library-submissions')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'story_library_submissions' },
        pull)
      .subscribe();
  })();

  return () => {
    cancelled = true;
    if (channel && sb) sb.removeChannel(channel);
  };
}

/** Steward action: record a review verdict (reviewed | declined) with notes. */
export async function reviewSubmission(id, { status, notes } = {}) {
  const session = await currentSession();
  if (!session) return { skipped: 'signed-out' };
  if (!['reviewed', 'declined'].includes(status)) return { skipped: 'bad-status' };

  // reviewed_at is intentionally left for the caller/server; we avoid Date.now()
  // so this module stays deterministic (no wall-clock dependency).
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('story_library_submissions')
    .update({ status, review_notes: notes ?? null, reviewed_by: session.user.id })
    .eq('id', id)
    .select()
    .single();
  if (error) {
    console.warn('[story-library] review failed:', error);
    return { skipped: 'update-error', error };
  }
  return { ok: true, row: data };
}

/**
 * Steward action: promote a submission into a lesson's stories[]. This module
 * returns the promotable story object + marks the row promoted; the actual
 * splice into living-lessons-class.js is a governed content change (a PR), not
 * a runtime table write -- the curriculum stays a reviewed, versioned artifact.
 */
export async function promoteSubmission(id, sub) {
  const story = normalizeForPromotion(sub); // throws if not promotable -- caller guards
  const session = await currentSession();
  if (!session) return { skipped: 'signed-out', story };

  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('story_library_submissions')
    .update({ status: 'promoted', reviewed_by: session.user.id })
    .eq('id', id)
    .select()
    .single();
  if (error) {
    console.warn('[story-library] promote mark failed:', error);
    return { skipped: 'update-error', error, story };
  }
  return { ok: true, row: data, story };
}
