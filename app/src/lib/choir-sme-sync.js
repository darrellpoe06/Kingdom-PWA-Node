// =============================================================================
// choir-sme-sync — Supabase I/O for the keyboardist's SME notes (choir_sme_notes,
// migration 0042). Pairs with the pure parse/attach logic in choir-sme-notes.js.
// =============================================================================
// The director imports the SME video pipeline's knowledge.json (reviewed, not
// autonomous), confirms each note is faithful to what Christian taught, and the
// confirmed knowledge rides on the Songbook song (its key, arrangement, how to
// play it). Writes are owner/admin (RLS); reads are any choir member.
// =============================================================================
import supabase from './supabase.js';
import { churchInstanceId } from './church-instance.js';
import { parseKnowledgeJson, toSmeNoteShape } from './choir-sme-notes.js';

async function currentSession() {
  const { data } = await supabase.auth.getSession();
  return data.session ?? null;
}

async function writeContext(displayName) {
  const session = await currentSession();
  if (!session) return { error: 'signed-out' };
  const tenantId = await churchInstanceId(displayName);
  if (!tenantId) return { error: 'no-church' };
  return { tenantId, userId: session.user.id };
}

export function subscribeSmeNotes(onChange) {
  let channel = null;
  let cancelled = false;
  (async () => {
    const session = await currentSession();
    if (!session || cancelled) return;
    const fetchAll = async () => {
      const { data, error } = await supabase.from('choir_sme_notes').select('*');
      if (error) { console.warn('[choir-sme] notes fetch failed:', error); return null; }
      return (data || []).map(toSmeNoteShape);
    };
    const initial = await fetchAll();
    if (initial && !cancelled) onChange(initial);
    channel = supabase
      .channel('choir_sme_notes-stream')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'choir_sme_notes' }, () => {
        fetchAll().then((rows) => { if (rows && !cancelled) onChange(rows); });
      })
      .subscribe();
  })();
  return function unsubscribe() {
    cancelled = true;
    if (channel) supabase.removeChannel(channel);
  };
}

// Import the pipeline's knowledge.json as status='extracted' rows for review.
// `meta` carries provenance (sourceVideo, sourceRun, extractedAt). Returns the
// parsed `unclear` list so the surface can show what to confirm with Christian.
export async function importKnowledgeJson(jsonText, meta = {}, displayName) {
  let parsed;
  try { parsed = parseKnowledgeJson(jsonText, meta); }
  catch (e) { return { skipped: 'bad-json', error: e }; }
  if (!parsed.notes.length) return { skipped: 'empty', unclear: parsed.unclear };
  const ctx = await writeContext(displayName);
  if (ctx.error) return { skipped: ctx.error };
  const rows = parsed.notes.map((n) => ({
    instance_id: ctx.tenantId,
    created_by: ctx.userId,
    kind: n.kind,
    title_key: n.titleKey,
    title_display: n.titleDisplay,
    topic: n.topic,
    sme_name: n.smeName,
    sme_role: n.smeRole,
    song_key: n.songKey,
    arrangement: n.arrangement,
    how_to_play: n.howToPlay,
    guidance: n.guidance,
    confidence: n.confidence,
    source_quote: n.sourceQuote,
    source_video: n.sourceVideo,
    source_run: n.sourceRun,
    extracted_at: n.extractedAt,
    status: 'extracted',
  }));
  const { error } = await supabase.from('choir_sme_notes').insert(rows);
  return error ? { skipped: 'insert-error', error } : { saved: true, count: rows.length, unclear: parsed.unclear };
}

// Confirm (status='reviewed') or archive an SME note. Owner/admin (RLS).
export async function reviewSmeNote(id, status, displayName) {
  if (!['reviewed', 'extracted', 'archived'].includes(status)) return { skipped: 'bad-status' };
  const ctx = await writeContext(displayName);
  if (ctx.error) return { skipped: ctx.error };
  const patch = status === 'reviewed'
    ? { status, reviewed_by: ctx.userId, reviewed_at: new Date().toISOString() }
    : { status };
  const { error } = await supabase.from('choir_sme_notes').update(patch).eq('id', id);
  return error ? { skipped: 'update-error', error } : { saved: true };
}

export async function deleteSmeNote(id) {
  const { error } = await supabase.from('choir_sme_notes').delete().eq('id', id);
  return error ? { skipped: 'delete-error', error } : { deleted: true };
}
