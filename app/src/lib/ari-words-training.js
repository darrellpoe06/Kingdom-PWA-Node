// =============================================================================
// ari-words-training — Ari learns the words by the choir's own corrections
// =============================================================================
// "Use one of the final versions from the choir to see the difference so Ari
// can be trained to tease out the words for songs as they sing and after."
// (Darrell, 2026-07-10.) The training loop is CORRECTION PAIRS, fully derived
// (DR-0121 — nothing stored twice, nothing hand-kept):
//
//   draft  = what Ari teased out of the service transcript (choir-words.js)
//   final  = the sheet the choir confirmed after trimming
//   diff   = the measurable difference — Ari's current skill, as a number
//
// The pair needs no new storage: a confirmed song keeps its final lyrics, and
// the draft is RE-DERIVED from the same transcript on demand (same inputs →
// same draft). Every sheet the choir confirms grows the corpus; the metrics
// below turn each confirmation into a lesson Ari can be measured — and later
// tuned — against. This is the same expertise engine the platform will point
// at UI/UX findings, quality controls, and self-healing fixes: the correction
// IS the curriculum (routed in the DR).
//
// Pure + dependency-light (imports only sibling pure modules) — every path
// unit-tested in ari-words-training.test.js.
import { DRAFT_WORDS_HEADER, draftWordsFromTranscript, extractHeardQuote } from './choir-words.js';

// An auto-draft still carries its header line; a CONFIRMED sheet had it
// trimmed away (the header itself instructs that). This is the honest
// draft-vs-final boundary — no flag column, the text testifies.
export function isAutoDraft(lyrics) {
  return typeof lyrics === 'string' && lyrics.includes(DRAFT_WORDS_HEADER);
}

const tokens = (s) => String(s || '')
  .toLowerCase()
  .replace(/\[[^\]]*\]/g, ' ')       // drop bracketed stage notes / the header
  .replace(/[^a-z0-9' ]+/g, ' ')
  .split(/\s+/)
  .filter((w) => w.length > 1);

// Measure the difference between Ari's draft and the choir's final sheet.
// Token-multiset overlap (order-insensitive — choruses repeat):
//   keptOfFinal: how much of the FINAL came from the draft (Ari's recall)
//   keptOfDraft: how much of the DRAFT survived the trim (Ari's precision)
export function wordsDiff(draft, final) {
  const d = tokens(draft);
  const f = tokens(final);
  if (!d.length || !f.length) return { comparable: false };
  const counts = new Map();
  for (const w of d) counts.set(w, (counts.get(w) || 0) + 1);
  let overlap = 0;
  for (const w of f) {
    const c = counts.get(w) || 0;
    if (c > 0) { overlap += 1; counts.set(w, c - 1); }
  }
  return {
    comparable: true,
    draftWords: d.length,
    finalWords: f.length,
    keptOfFinal: Math.round((overlap / f.length) * 100),
    keptOfDraft: Math.round((overlap / d.length) * 100),
  };
}

// Build the live calibration corpus from the real song rows + the real
// transcripts: every song whose sheet the choir CONFIRMED (final lyrics, no
// draft header) and whose service transcript is loaded becomes one example —
// the draft re-derived, the final held against it, the difference measured.
// Returns { examples, confirmedSheets, awaitingTranscript } — honest counts,
// never a padded list.
export function calibrationExamples(songs, transcriptsByVideo) {
  const out = { examples: [], confirmedSheets: 0, awaitingTranscript: 0 };
  for (const song of Array.isArray(songs) ? songs : []) {
    if (!song || !song.lyrics || isAutoDraft(song.lyrics)) continue;
    out.confirmedSheets += 1;
    const t = song.videoId && transcriptsByVideo ? transcriptsByVideo[song.videoId] : null;
    if (!t || !t.text) { out.awaitingTranscript += 1; continue; }
    const drafted = draftWordsFromTranscript({
      transcriptText: t.text,
      heardQuote: extractHeardQuote(song.notes),
      title: song.title,
    });
    if (!drafted.ok) continue;
    const diff = wordsDiff(drafted.draft, song.lyrics);
    if (!diff.comparable) continue;
    out.examples.push({ songId: song.id, title: song.title, anchor: drafted.anchor, ...diff });
  }
  return out;
}

// One-line skill readout for a report surface: measured, or honestly empty.
export function calibrationSummaryLine({ examples = [], confirmedSheets = 0 } = {}) {
  if (!examples.length) {
    return confirmedSheets > 0
      ? `${confirmedSheets} confirmed sheet${confirmedSheets === 1 ? '' : 's'} — awaiting transcripts to measure Ari's drafts against.`
      : 'No confirmed sheets yet — Ari trains from the first sheet the choir trims and confirms.';
  }
  const avgRecall = Math.round(examples.reduce((t, e) => t + e.keptOfFinal, 0) / examples.length);
  const avgPrecision = Math.round(examples.reduce((t, e) => t + e.keptOfDraft, 0) / examples.length);
  return `${examples.length} confirmed pair${examples.length === 1 ? '' : 's'} measured — Ari's drafts carried ${avgRecall}% of the final words; ${avgPrecision}% of each draft survived the choir's trim.`;
}
