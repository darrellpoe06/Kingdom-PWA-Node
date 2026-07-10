// =============================================================================
// choir-words — a STARTING POINT of words for each song, from the recording
// =============================================================================
// "We also don't have the words for each one so the choir can have a starting
// point." (Darrell, 2026-07-10.) The songs the worship-song harvester drafted
// carry a title and a "Heard in the recording" quote, but no words — and the
// choir needs a lyric sheet to rehearse from.
//
// The starting point DERIVES from the same live transcript rows every other
// harvest reads (video_transcripts via sermon-library-sync — one source, many
// harvests, DR-0134's recipe): find where the song happens in the transcript
// (the harvester's own heard-quote anchors it; the title is the fallback), take
// the run of words that follows, and hand it to the director as an AUTO-DRAFT
// clearly labeled for trimming — the transcript hears ad-libs, repeats, and the
// congregation, so the draft is a quarry, not a finished sheet (DR-0076: it
// never pretends to be verified lyrics).
//
// Pure + dependency-free — every path unit-tested in choir-words.test.js.

export const DRAFT_WORDS_HEADER =
  '[Auto-draft from the service recording — trim to the words the choir sings, then delete this line]';

// The harvester writes: `Heard in the recording: "…"` into the song's notes.
// Pull that quote back out so it can anchor the transcript search.
export function extractHeardQuote(notes) {
  if (!notes || typeof notes !== 'string') return null;
  const m = notes.match(/Heard in the recording:\s*["“]([^"”]{8,})["”]/i);
  return m ? m[1].trim() : null;
}

const norm = (s) => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();

// Find the anchor position of the song inside the transcript. The heard-quote
// (the harvester's own evidence) wins; the title is the fallback. Null = the
// song can't be located — the caller says so honestly instead of guessing.
export function findSongAnchor(transcriptText, { heardQuote, title } = {}) {
  const text = norm(transcriptText);
  if (!text) return null;
  const probe = (needle) => {
    const n = norm(needle);
    if (n.length < 8) return -1;
    // Try the full needle, then its first 40 chars (transcripts drift on tails).
    let i = text.indexOf(n);
    if (i < 0 && n.length > 40) i = text.indexOf(n.slice(0, 40));
    return i;
  };
  if (heardQuote) {
    const i = probe(heardQuote);
    if (i >= 0) return { index: i, anchor: 'heard' };
  }
  if (title) {
    const i = probe(title);
    if (i >= 0) return { index: i, anchor: 'title' };
  }
  return null;
}

// Soft-wrap a run of transcript words into readable lyric-sheet lines (~56
// chars at word boundaries) so the draft reads like verses, not a wall.
export function wrapAsLines(text, width = 56) {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const w of words) {
    if (line && (line.length + 1 + w.length) > width) { lines.push(line); line = w; }
    else line = line ? `${line} ${w}` : w;
  }
  if (line) lines.push(line);
  return lines.join('\n');
}

/**
 * Build the draft words for a song from its service transcript.
 * @returns {{ ok: boolean, reason?: string, draft?: string, anchor?: string }}
 *   ok:false reasons — 'no-transcript' (row not loaded yet: the NAS trickle
 *   loader fills these), 'not-found' (the song can't be located in the text).
 */
export function draftWordsFromTranscript({ transcriptText, heardQuote, title, windowChars = 1400 } = {}) {
  if (!transcriptText || !String(transcriptText).trim()) return { ok: false, reason: 'no-transcript' };
  const hit = findSongAnchor(transcriptText, { heardQuote, title });
  if (!hit) return { ok: false, reason: 'not-found' };
  const text = norm(transcriptText);
  const slice = text.slice(hit.index, Math.min(text.length, hit.index + windowChars));
  return {
    ok: true,
    anchor: hit.anchor,
    draft: `${DRAFT_WORDS_HEADER}\n\n${wrapAsLines(slice)}${hit.index + windowChars < text.length ? '\n…' : ''}`,
  };
}
