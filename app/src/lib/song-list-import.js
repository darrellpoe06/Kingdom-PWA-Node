// =============================================================================
// song-list-import — a document becomes song lines (DR-1061)
// =============================================================================
// Darrell, 2026-10-16: "Make sure this works with Google docs... Excel and
// other documents to pull lists of songs from Christina and the senior team
// members in choir and senior media team members... initially Christina and
// myself" — after "Make sure humans have to do nothing if possible".
//
// WE ALREADY HAD BOTH HALVES. This file is the seam between them, and nothing
// more:
//
//   lib/books-intake-read.js    readAnyFile(file) -> { text }. DR-0709's "one
//                               Books upload": Excel (.xlsx/.xlsm/.xlsb/.xls),
//                               CSV/TSV/TXT, a PDF through its text layer, and
//                               a PHOTO of a page through OCR — sovereign
//                               first, the family's own NAS before the device,
//                               and never a third-party cloud.
//   lib/song-workshop-sync.js   parseSongList(text) -> [{ title, url }], which
//                               already strips bullets, pulls a YouTube link
//                               out of "Title - https://youtu.be/…", and
//                               de-duplicates.
//
// So the choir surface was asking Christina to TYPE a list the same app could
// already read off a spreadsheet, a PDF or a photograph. That is the whole
// defect, and it is the fourth time this week the cure was one call site over.
//
// THE ONE THING NEITHER HALF DID: a spreadsheet arrives as CSV text, so a row
// reads `Total Praise,Richard Smallwood,B` and parseSongList would take the
// whole row as the title. This picks the song out of the row — by the header
// when the sheet has one, and by shape when it does not.
//
// GOOGLE DOCS AND SHEETS, honestly: this reads what Google EXPORTS. A Sheet
// downloads as .xlsx or .csv and a Doc as .pdf or .txt — all four already
// read. A Doc downloaded as .docx does NOT (no .docx reader exists in this
// app), and the surface says so rather than failing silently. Reaching into
// Drive directly would mean a new OAuth credential and a new external
// integration, which is a decision, not a detail.
import { parseSongList } from './song-workshop-sync.js';

/** Header cells that mean "the song is in this column". */
const SONG_HEADERS = [
  'song', 'songs', 'title', 'song title', 'track', 'hymn', 'selection',
  'music', 'song name', 'name of song',
];
/** Header cells that mean "the link is in this column". */
const LINK_HEADERS = ['link', 'links', 'url', 'youtube', 'video', 'recording'];

const norm = (s) => String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');

/** Split one line of delimited text into cells. Handles quoted commas. */
export function splitCells(line) {
  const s = String(line ?? '');
  if (s.includes('\t')) return s.split('\t').map((c) => c.trim());
  const out = []; let cur = ''; let q = false;
  for (let i = 0; i < s.length; i += 1) {
    const c = s[i];
    if (c === '"') { if (q && s[i + 1] === '"') { cur += '"'; i += 1; } else q = !q; continue; }
    if (c === ',' && !q) { out.push(cur.trim()); cur = ''; continue; }
    cur += c;
  }
  out.push(cur.trim());
  return out;
}

/**
 * Pure. Which columns hold the song and the link, from a header row.
 * Returns null when this row is not a header, so a list with no header is not
 * mistaken for one (and its first song is not eaten as a title).
 */
export function columnsFromHeader(line) {
  const cells = splitCells(line);
  if (cells.length < 2) return null;
  let song = -1; let link = -1;
  cells.forEach((c, i) => {
    const n = norm(c);
    if (song < 0 && SONG_HEADERS.includes(n)) song = i;
    if (link < 0 && LINK_HEADERS.includes(n)) link = i;
  });
  return song < 0 && link < 0 ? null : { song: song < 0 ? 0 : song, link };
}

const URLISH = /\bhttps?:\/\/|\b(?:www\.)?(?:youtube\.com|youtu\.be)\//i;

/**
 * Pure. One delimited row -> the one line parseSongList should see.
 *
 * With a known song column, take it (and append the link cell when there is
 * one). Without, take the first cell that carries words rather than a bare
 * number, a date or a URL — a sheet's first column is often `#` or a date, and
 * the title is the first thing a person would actually read.
 */
export function lineFromRow(line, cols = null) {
  const cells = splitCells(line);
  if (cells.length <= 1) return String(line ?? '').trim();
  if (cols) {
    const title = cells[cols.song] || '';
    const link = cols.link >= 0 ? (cells[cols.link] || '') : '';
    return [title, link].filter(Boolean).join(' ').trim();
  }
  const url = cells.find((c) => URLISH.test(c)) || '';
  const title = cells.find((c) => c && !URLISH.test(c) && !/^[\d\s./-]+$/.test(c)) || '';
  return [title, url].filter(Boolean).join(' ').trim();
}

/** Pure. Does this line look like a heading rather than a song? */
export function isNoiseLine(line) {
  const n = norm(line);
  if (!n) return true;
  if (/^[-=_*·•\s]+$/.test(n)) return true;                 // a rule
  if (SONG_HEADERS.includes(n) || LINK_HEADERS.includes(n)) return true;
  if (/^(songs?|song list|set list|setlist|repertoire|playlist)\s*[:-]?$/.test(n)) return true;
  if (/^page \d+( of \d+)?$/.test(n)) return true;          // a PDF footer
  return false;
}

/**
 * Pure. A whole document's text -> the lines the existing parser understands.
 * Exported so the extraction is a tested property, not a claim.
 */
export function linesFromDocument(text) {
  const raw = String(text || '').split(/\r?\n/);
  let cols = null;
  const out = [];
  for (const line of raw) {
    if (!line || !line.trim()) continue;
    if (cols === null) {
      const found = columnsFromHeader(line);
      if (found) { cols = found; continue; }               // the header is consumed, never a song
    }
    if (isNoiseLine(line)) continue;
    const one = lineFromRow(line, cols);
    if (one && !isNoiseLine(one)) out.push(one);
  }
  return out;
}

/**
 * Pure. A document's text -> de-duplicated songs, through the SAME parser the
 * paste box uses. One vocabulary, so a list typed in and a list uploaded can
 * never disagree about what a song is.
 */
export function songsFromDocument(text) {
  return parseSongList(linesFromDocument(text).join('\n'));
}

/** Pure. What to say when a file carried no songs — never a bare failure. */
export function emptyReason(file, text) {
  const name = String((file && file.name) || '').toLowerCase();
  if (/\.docx?$/.test(name)) {
    return 'Word and Google Doc .docx files are not read yet. In Google Docs choose File → Download → PDF or Plain text, or export a Sheet as CSV or Excel, and bring that.';
  }
  if (!String(text || '').trim()) {
    return 'Nothing readable came out of that file. If it is a scan or a photo, make sure the page is in focus and the whole list is in frame.';
  }
  return 'That file was read, but no song titles were found in it. A column headed “Song” or “Title”, or one song per line, is what this looks for.';
}
