// =============================================================================
// kids/narration — the recorded reading of a storybook page (DR-1527, J2/J3)
// =============================================================================
// Darrell, 2026-11-18: "Prepare the narration system for eight professionally
// recorded audio files, including synchronized text highlighting."
//
// A page's recording is a file under lovecorner/kids/narration/, named
// <book>-p<page>.<m4a|mp3|ogg|wav> (the production brief gives the names). It
// reads the verse word for word, a breath, then the guide's caption. The page
// plays it when it is on disk (the landed manifest says so) and falls back to
// the device reader when it is not. Highlighting follows CUES: the second at
// which each sentence starts, in narration-cues.json, keyed by the file. A
// recording without cues is highlighted by ESTIMATE (each sentence's share of
// the characters spread over the recording's length), and the page says so
// to nobody: it is a reasonable follow-along, not a claim of alignment. Cues
// are added once the recording is timed. Pure: no React, no I/O.
import landed from './landed.json';
import cues from './narration-cues.json';
import { segmentText } from '../tts.js';

export const NARRATION_DIR = 'narration/';
const AUDIO = ['m4a', 'mp3', 'ogg', 'wav'];

/** The recording a page has on disk, or null: `{ file, cues }`, the file relative to the kids folder. */
export function narrationFor(bookId, pageIndex, manifest = landed, cueTable = undefined) {
  const table = cueTable === undefined ? cues : cueTable;
  const n = Number(pageIndex) + 1;
  if (!bookId || !(n >= 1)) return null;
  for (const ext of AUDIO) {
    const file = `${NARRATION_DIR}${bookId}-p${n}.${ext}`;
    if (manifest && manifest.files && manifest.files[file]) {
      const c = table && table[file];
      return { file, cues: Array.isArray(c) && c.length ? c.map(Number) : null };
    }
  }
  return null;
}

/** The pages of a book that have a recording, by index. */
export function narratedPages(book, manifest = landed) {
  if (!book) return [];
  return book.pages.map((_, i) => i).filter((i) => !!narrationFor(book.id, i, manifest));
}

/** The sentences a recording reads, in order: the verse's, then the caption's. */
export function narrationSentences(verseText, caption) {
  const v = verseText ? segmentText(String(verseText)) : [];
  const c = caption ? segmentText(String(caption)) : [];
  return { verse: v, caption: c, all: v.concat(c) };
}

/**
 * Start times for sentences with no cues: each sentence's share of the
 * characters, spread over the recording's duration (seconds). The first
 * sentence starts at 0.
 */
export function estimateCues(sentences, duration) {
  const d = Number(duration);
  const list = sentences || [];
  if (!list.length || !(d > 0)) return list.map(() => 0);
  const total = list.reduce((s, t) => s + Math.max(1, String(t).length), 0);
  const out = [];
  let acc = 0;
  for (const t of list) {
    out.push((acc / total) * d);
    acc += Math.max(1, String(t).length);
  }
  return out;
}

/** Which sentence is being read at second `t`: the last cue at or before it; -1 before the first. */
export function sentenceAt(cueList, t) {
  const list = cueList || [];
  let idx = -1;
  for (let i = 0; i < list.length; i += 1) if (Number(t) + 1e-6 >= Number(list[i])) idx = i;
  return idx;
}
