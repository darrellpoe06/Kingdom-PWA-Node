// =============================================================================
// lyrics-accuracy — are the words ON THE WALL the words that were actually SUNG?
// =============================================================================
// Darrell 2026-09-20: "the YouTube videos are supposed to be getting the songs
// lyrics and making sure they are accurate on the screen."
//
// THE GAP THIS CLOSES, found by reality-trace before a line was written. The
// chain from a service recording to a stanza on the wall was already whole:
//   video_transcripts (YouTube auto-captions, NAS trickle)
//     -> choir-words.js draftWordsFromTranscript()  [auto-draft, labelled]
//     -> the director confirms                       [a final sheet]
//     -> ndi-output.js lyricProgram()                [the stanza on the wall]
// And ari-words-training.js measures a DRAFT against a FINAL -- how good Ari's
// first pass was. NOTHING measured the finished words against WHAT WAS SUNG.
// So a sheet could be confirmed once, drift, or be transcribed from somebody
// else's recording of the song, and every instrument in the house would report
// green while the congregation read lines nobody sang.
//
// THE ASYMMETRY THAT GOVERNS THE WHOLE MODULE, and the reason this is not just
// wordsDiff pointed at a transcript. The two failures are NOT equal:
//
//   ON THE WALL, NOT HEARD  -- the congregation is reading words that were not
//                              sung. This is the failure that matters. It puts
//                              text in front of the room on our authority that
//                              the recording does not support.
//   HEARD, NOT ON THE WALL  -- the choir sang something the sheet does not
//                              carry: an ad-lib, a repeat, a vamp, a spoken
//                              exhortation between lines. This is ORDINARY and
//                              is very often exactly right (choir-renditions.js
//                              already treats ad-libs as real and reviewable).
//
// Reporting one number would blend a serious fault into a normal one. So the
// two are measured and returned SEPARATELY, and only the first drives the
// verdict.
//
// DESCRIPTIVE, NEVER PRESCRIPTIVE (the binding rule from choir-renditions.js,
// Darrell 2026-06-24). This module NEVER rewrites a sheet and never proposes
// replacement words. It reports which stored lines were not heard in this
// rendition and hands that to a human. The choir stays free to sing it however
// the Spirit leads; an auto-corrector would quietly make the record prescribe.
//
// HONEST BY CONSTRUCTION (DR-0076). No transcript -> 'no-transcript'. Song not
// locatable in the transcript -> 'not-found'. An empty sheet -> 'no-words'.
// Each is a stated non-answer, never a padded score. A caption transcript is
// itself imperfect -- it mishears, it drops, it runs words together -- so a
// low score is ALWAYS a flag for review and NEVER a finding that the sheet is
// wrong. That distinction is written into the verdict names on purpose.
// =============================================================================
import { findSongAnchor } from './choir-words.js';

/** Words a comparison ignores: too common to carry evidence either way. */
const NOISE = new Set(['the', 'and', 'you', 'for', 'that', 'this', 'with', 'are', 'was', 'his', 'her', 'she', 'him', 'they', 'but', 'not', 'all', 'from', 'have', 'has', 'will', 'can', 'our', 'your', 'its', 'been', 'were', 'them', 'their']);

const tokens = (s) => String(s || '')
  .toLowerCase()
  .replace(/\[[^\]]*\]/g, ' ')        // drop bracketed stage notes / the auto-draft header
  .replace(/[^a-z0-9' ]+/g, ' ')
  .split(/\s+/)
  .filter((w) => w.length > 1);

/** Content words only — what a match can honestly be built on. */
export function contentWords(s) {
  return tokens(s).filter((w) => !NOISE.has(w));
}

/** The slice of transcript this rendition actually occupies. */
export function renditionWindow(transcriptText, { heardQuote, title, windowChars = 1800 } = {}) {
  const hit = findSongAnchor(transcriptText, { heardQuote, title });
  if (!hit) return null;
  const text = String(transcriptText || '');
  // Reach a little BEFORE the anchor: the heard quote is usually a line from
  // partway in, and the opening lines sit ahead of it.
  const start = Math.max(0, hit.index - Math.floor(windowChars / 3));
  return { text: text.slice(start, start + windowChars), anchor: hit.anchor, index: hit.index };
}

export const VERDICT = {
  NO_TRANSCRIPT: 'no-transcript',
  NO_WORDS: 'no-words',
  NOT_FOUND: 'not-found',
  MATCHED: 'matched',
  REVIEW: 'needs-review',
};

/**
 * Compare a song's STORED words against the transcript of one rendition.
 *
 * Returns, always: { verdict, heardShare, unheardLines, extraHeard, checked }.
 * `unheardLines` is the actionable half — stored lines whose content words do
 * not appear in what was sung. `extraHeard` is reported for interest only and
 * never lowers the verdict (see the asymmetry note above).
 */
export function lyricsAgainstRendition(words, transcriptText, opts = {}) {
  const { heardQuote, title, reviewBelow = 60 } = opts;
  const base = { verdict: VERDICT.NO_TRANSCRIPT, heardShare: null, unheardLines: [], extraHeard: [], checked: 0 };
  if (!String(transcriptText || '').trim()) return base;
  const lines = String(words || '')
    .split('\n')
    .map((l) => l.replace(/\[[^\]]*\]/g, '').trim())
    .filter((l) => contentWords(l).length > 0);
  if (!lines.length) return { ...base, verdict: VERDICT.NO_WORDS };

  const win = renditionWindow(transcriptText, { heardQuote, title });
  if (!win) return { ...base, verdict: VERDICT.NOT_FOUND };

  const heard = new Set(contentWords(win.text));
  const unheardLines = [];
  let matchedLines = 0;
  for (const line of lines) {
    const cw = contentWords(line);
    const hits = cw.filter((w) => heard.has(w)).length;
    // A line counts as heard when MOST of its content words were sung. A
    // single shared word is a coincidence, not a match.
    if (hits * 2 >= cw.length) matchedLines += 1;
    else unheardLines.push({ line, matched: hits, of: cw.length });
  }
  const heardShare = Math.round((matchedLines / lines.length) * 100);

  // What was sung that the sheet does not carry — ad-libs, repeats, spoken
  // exhortation. Reported, never penalised.
  const onWall = new Set(lines.flatMap((l) => contentWords(l)));
  const extraHeard = [...new Set(contentWords(win.text))].filter((w) => !onWall.has(w));

  return {
    verdict: heardShare >= reviewBelow ? VERDICT.MATCHED : VERDICT.REVIEW,
    heardShare,
    unheardLines,
    extraHeard,
    checked: lines.length,
    anchor: win.anchor,
  };
}

/** One honest line a steward can read, for every verdict. */
export function accuracyLine(result) {
  const r = result || {};
  switch (r.verdict) {
    case VERDICT.NO_TRANSCRIPT: return 'No transcript for this rendition yet — nothing to check the words against.';
    case VERDICT.NO_WORDS: return 'No words stored for this song yet.';
    case VERDICT.NOT_FOUND: return 'This song was not located in the service transcript — the words were not checked.';
    case VERDICT.MATCHED: return `${r.heardShare}% of the stored lines were heard in this rendition${r.unheardLines.length ? ` · ${r.unheardLines.length} to look at` : ''}.`;
    case VERDICT.REVIEW: return `Only ${r.heardShare}% of the stored lines were heard in this rendition — ${r.unheardLines.length} line(s) for a human to review. A caption transcript mishears; this flags the sheet for a look, it does not say the sheet is wrong.`;
    default: return 'Not checked.';
  }
}

/** Songs whose stored words did not match the rendition — the review queue. */
export function songsNeedingWordReview(rows = [], transcriptsByVideo = {}) {
  const out = [];
  for (const row of rows) {
    if (!row || !row.title) continue;
    const t = transcriptsByVideo[row.videoId || row.youtubeId];
    const r = lyricsAgainstRendition(row.words, t, { heardQuote: row.heardQuote, title: row.title });
    if (r.verdict === VERDICT.REVIEW) out.push({ title: row.title, date: row.serviceDate || null, ...r });
  }
  return out.sort((a, b) => a.heardShare - b.heardShare);
}
