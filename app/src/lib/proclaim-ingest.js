// =============================================================================
// proclaim-ingest — one PROCLAIM email -> the two rows The Word reads.
// =============================================================================
// The glue that closes the weekly loop: an email's SUBJECT/filename (metadata:
// date, title, scripture, speaker — proclaim-email.js) + its .docx TEXT (BG's
// numbered points + scriptures — prep-outline.js) become the choir_sermons row
// (the message) and the sermon_prep row (his outline). The auto-pull (n8n, from
// bg@thechurchofthelivinggod.com) extracts the .docx text and calls this; an
// in-app steward import can call it too. Pure + deterministic (DR-0076): no
// Supabase, no Date.now — the caller passes the church instance id; every field
// traces to real email text; nothing is invented.
//
// GROUND TRUTH (source:'email', needs_review:false): BG authored it, so it
// outranks any transcript-derived draft (precedence prep > harvest > transcript).
// Ships as status:'draft' — leadership publishes it into the public library.
// =============================================================================
import { parseProclaimSubject } from './proclaim-email.js';
import { parsePrepOutline } from './prep-outline.js';

const BG_DEFAULT = 'Bishop Lloyd E. Gwin';

// Sunday / Wednesday from a date-only ISO (UTC midnight => stable weekday). COLG
// preaches Sunday + Wednesday Bible Study; anything else reads 'service'.
function serviceTypeFor(iso) {
  if (!iso) return 'service';
  const t = Date.parse(`${iso}T00:00:00Z`);
  if (!Number.isFinite(t)) return 'service';
  const day = new Date(t).getUTCDay(); // 0 Sun … 6 Sat
  if (day === 0) return 'sunday';
  if (day === 3) return 'wednesday';
  return 'service';
}

const dedupeRefs = (list) => Array.from(new Set((list || []).map((r) => String(r || '').trim()).filter(Boolean)));

/**
 * proclaimToRows(subjectOrFilename, docxText, { instanceId, videoId?, youtubeUrl? })
 *   -> { sermon, prep, meta }
 * `sermon` / `prep` are insert-ready row objects (snake_case columns) minus the
 * ids the DB/caller mints; `prep` links to the sermon by the caller after insert.
 */
export function proclaimToRows(subjectOrFilename, docxText, opts = {}) {
  const instanceId = opts.instanceId || null;
  const meta = parseProclaimSubject(subjectOrFilename);
  const prep = parsePrepOutline(String(docxText || ''), { subject: String(subjectOrFilename || '') });

  // Scriptures = the subject's headline ref + every ref in the document, deduped.
  const scriptures = dedupeRefs([meta.scriptureRef, ...(prep.scriptures || [])]);

  const sermon = {
    instance_id: instanceId,
    title: meta.title || prep.theme || null,
    speaker: meta.speaker || BG_DEFAULT,
    scripture_ref: meta.scriptureRef || (scriptures[0] || null),
    service_date: meta.serviceDate || null,
    service_type: serviceTypeFor(meta.serviceDate),
    source: 'email',
    status: 'draft', // leadership publishes into the public library
  };

  const prepRow = {
    instance_id: instanceId,
    // sermon_id set by the caller once the sermon row exists.
    points: prep.points || [],
    scriptures,
    theme: prep.theme || meta.title || null,
    source: 'email',      // GROUND TRUTH — outranks harvest/transcript
    needs_review: false,  // BG authored it
  };

  return { sermon, prep: prepRow, meta };
}

export default proclaimToRows;
