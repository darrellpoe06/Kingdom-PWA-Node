// =============================================================================
// choir-sme-notes — the keyboardist's captured knowledge, linked per song.
// =============================================================================
// PURE logic for Christian (COLG choir keyboardist) SME notes: parse the SME
// video pipeline's knowledge.json handoff, attach per-song key/arrangement/
// how-to-play onto Songbook entities, and surface general guidance + orphans
// (notes whose song isn't in the repertoire yet). I/O lives in choir-sme-sync.js.
//
// HANDOFF CONTRACT (consume the pipeline's output as-is — coordinate, no fork):
//   infra/nas-sme-pipeline/choir-knowledge-json-prompt.md emits knowledge.json:
//   { sme:{name,role},
//     songs:[{title,key_label,arrangement,note,confidence,source_quote}],
//     general_guidance:[{topic,guidance,source_quote}],
//     unclear:[ "..." ] }
//   Faithful: a field Christian didn't state stays null; nothing is invented.
//   Extracted notes import as status='extracted' (unconfirmed) — a steward
//   reviews before they ride on the song (Verification Doctrine).
// =============================================================================
import { normalizeTitle } from './choir-songbook.js';

const cap = (s, n) => (s == null ? null : String(s).trim().slice(0, n) || null);
const okConfidence = (c) => (['high', 'med', 'low'].includes(c) ? c : null);

// Parse the pipeline's knowledge.json (object or JSON string) into rows ready to
// insert + the SME identity + the unclear list. Tolerant: bad/missing fields
// become null (never fabricated); a malformed string throws once, caught by the
// caller. `meta` carries provenance (sourceVideo, sourceRun, extractedAt).
export function parseKnowledgeJson(input, meta = {}) {
  const json = typeof input === 'string' ? JSON.parse(input) : (input || {});
  const sme = json.sme && typeof json.sme === 'object' ? json.sme : {};
  const smeName = cap(sme.name, 120) || 'Christian';
  const smeRole = cap(sme.role, 120) || 'choir keyboardist';
  const prov = {
    smeName, smeRole,
    sourceVideo: cap(meta.sourceVideo, 300),
    sourceRun: cap(meta.sourceRun, 300),
    extractedAt: meta.extractedAt || null,
  };
  const notes = [];
  for (const s of Array.isArray(json.songs) ? json.songs : []) {
    const title = cap(s && s.title, 200);
    if (!title) continue; // a song note with no title can't link — skip, don't guess
    notes.push({
      kind: 'song',
      titleDisplay: title,
      titleKey: normalizeTitle(title),
      topic: null,
      songKey: cap(s.key_label, 40),
      arrangement: cap(s.arrangement, 120),
      howToPlay: cap(s.note, 2000),
      guidance: null,
      confidence: okConfidence(s.confidence),
      sourceQuote: cap(s.source_quote, 2000),
      ...prov,
    });
  }
  for (const g of Array.isArray(json.general_guidance) ? json.general_guidance : []) {
    const guidance = cap(g && g.guidance, 2000);
    if (!guidance) continue;
    notes.push({
      kind: 'guidance',
      titleDisplay: null, titleKey: null,
      topic: cap(g.topic, 200),
      songKey: null, arrangement: null, howToPlay: null,
      guidance,
      confidence: null,
      sourceQuote: cap(g.source_quote, 2000),
      ...prov,
    });
  }
  const unclear = (Array.isArray(json.unclear) ? json.unclear : [])
    .map((u) => cap(u, 500)).filter(Boolean);
  return { sme: { name: smeName, role: smeRole }, notes, unclear };
}

// DB row -> shape.
export function toSmeNoteShape(row) {
  return {
    id: row.id,
    kind: row.kind ?? 'song',
    titleKey: row.title_key ?? null,
    titleDisplay: row.title_display ?? null,
    topic: row.topic ?? null,
    smeName: row.sme_name ?? 'Christian',
    smeRole: row.sme_role ?? 'choir keyboardist',
    songKey: row.song_key ?? null,
    arrangement: row.arrangement ?? null,
    howToPlay: row.how_to_play ?? null,
    guidance: row.guidance ?? null,
    confidence: row.confidence ?? null,
    sourceQuote: row.source_quote ?? null,
    sourceVideo: row.source_video ?? null,
    sourceRun: row.source_run ?? null,
    extractedAt: row.extracted_at ?? null,
    status: row.status ?? 'extracted',
    createdAt: row.created_at ?? null,
  };
}

const CONF_RANK = { high: 3, med: 2, low: 1 };

// Pick the single best note for a song from several candidates: reviewed beats
// extracted, then higher confidence, then most recent.
export function bestSmeNote(notes) {
  const ranked = (notes || []).slice().sort((a, b) => {
    const r = (b.status === 'reviewed' ? 1 : 0) - (a.status === 'reviewed' ? 1 : 0);
    if (r) return r;
    const c = (CONF_RANK[b.confidence] || 0) - (CONF_RANK[a.confidence] || 0);
    if (c) return c;
    return String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
  });
  return ranked[0] || null;
}

// Attach the best per-song SME note onto each Songbook entity as `entry.sme`.
// By default only REVIEWED notes ride on the song (the choir sees confirmed
// knowledge); pass includeExtracted to also surface unconfirmed ones (the
// director's review view). Never mutates input — returns new entries.
export function attachSmeNotes(songbook, smeNotes, { includeExtracted = false } = {}) {
  const byTitle = new Map();
  for (const n of smeNotes || []) {
    if (n.kind !== 'song' || !n.titleKey || n.status === 'archived') continue;
    if (!includeExtracted && n.status !== 'reviewed') continue;
    if (!byTitle.has(n.titleKey)) byTitle.set(n.titleKey, []);
    byTitle.get(n.titleKey).push(n);
  }
  return (songbook || []).map((entry) => {
    const note = bestSmeNote(byTitle.get(entry.titleKey));
    return note ? { ...entry, sme: note } : entry;
  });
}

// General (not-per-song) guidance for the choir, newest first. Reviewed first.
export function generalGuidance(smeNotes, { includeExtracted = false } = {}) {
  return (smeNotes || [])
    .filter((n) => n.kind === 'guidance' && n.status !== 'archived')
    .filter((n) => includeExtracted || n.status === 'reviewed')
    .sort((a, b) =>
      (b.status === 'reviewed' ? 1 : 0) - (a.status === 'reviewed' ? 1 : 0) ||
      String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
}

// SME song-notes whose song isn't in the repertoire yet (no matching title_key).
// The review surface shows these as "no matching song yet — add the song or fix
// the title" rather than silently dropping the keyboardist's work.
export function orphanSmeNotes(smeNotes, songbook) {
  const have = new Set((songbook || []).map((s) => s.titleKey));
  return (smeNotes || []).filter((n) => n.kind === 'song' && n.titleKey && !have.has(n.titleKey) && n.status !== 'archived');
}

// Notes still awaiting a steward's confirmation (the director's review queue).
export function pendingSmeNotes(smeNotes) {
  return (smeNotes || []).filter((n) => n.status === 'extracted');
}
