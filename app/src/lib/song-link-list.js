// =============================================================================
// song-link-list — a link TO a list is not a song (DR-1061)
// =============================================================================
// Darrell, 2026-10-16, looking at Choir → Songs: **"Does pasting a link with a
// list of songs add them to the app like the others that work
// comprehensively?"** — then: **"Fix it..."**
//
// THE HONEST ANSWER TO HIS QUESTION WAS NO, AND IT FAILED QUIETLY. Paste a
// Google Sheet link, or a YouTube playlist link, into "Paste a list" and
// parseSongList sees ONE line with ONE url, so one idea is inserted — titled
// "YouTube song" for a playlist, or the raw link for a Sheet. The box says
// "1 song detected", the insert succeeds, and the person walks away believing
// forty songs arrived. Same family as DR-1053 and DR-1058: the app reporting
// success for a thing that did not happen.
//
// A LINK TO A LIST AND A LINK TO A SONG ARE DIFFERENT KINDS, and the paste box
// could not tell them apart. This file is that distinction, and the address of
// the readable copy behind each kind:
//
//   youtube-playlist  list=PL… — read through the YouTube Data API road this
//                     app ALREADY has and already proves (importSermonsFromChannel
//                     walks ~850 videos with it). Needs VITE_YOUTUBE_API_KEY.
//   google-sheet      /spreadsheets/d/<id>/… -> /export?format=csv
//   google-doc        /document/d/<id>/…     -> /export?format=txt
//   plain-file        a url ending .csv/.tsv/.txt/.md
//   song              anything else — ONE song, which is what it always was.
//
// WHAT THIS CANNOT PROMISE, said here rather than discovered by Christina:
// a browser can only read a cross-site address when that site allows it, and
// Google serves a private document to a signed-in SESSION, which a fetch from
// poetech.us does not carry. So a sheet that is not shared "anyone with the
// link" CANNOT be read this way, and neither can one that is shared but whose
// export endpoint declines the cross-origin read. The surface therefore TRIES,
// and when the browser refuses it says the one thing that always works — the
// file road (DR-1061): download it and upload it, which reads Excel, CSV, PDF
// and a photograph of a page, on the family's own NAS, with no Google account
// involved at all. Never a silent failure, and never a fabricated success.
import { songsFromDocument } from './song-list-import.js';
import { parseSongList } from './song-workshop-sync.js';

const SHEET_RE = /docs\.google\.com\/spreadsheets\/d\/(?:e\/)?([A-Za-z0-9_-]{10,})/i;
const DOC_RE = /docs\.google\.com\/document\/d\/(?:e\/)?([A-Za-z0-9_-]{10,})/i;
const PLAYLIST_RE = /[?&]list=([A-Za-z0-9_-]{10,})/i;
const PLAIN_RE = /\.(csv|tsv|txt|md)(?:[?#]|$)/i;

/** Pure. The first http(s) url in a blob of text, or ''. */
export function firstUrl(text) {
  const m = String(text || '').match(/https?:\/\/[^\s<>"')\]]+/);
  return m ? m[0] : '';
}

/**
 * Pure. Classify a pasted link.
 *
 * @returns {{kind: string, id?: string, readUrl?: string, label: string}}
 *   kind 'song' means it is NOT a list — the existing one-line path handles it.
 */
export function classifyLink(url) {
  const u = String(url || '').trim();
  if (!u) return { kind: 'song', label: 'a song' };

  // A playlist is checked FIRST: a watch url can carry both v= and list=, and a
  // link someone copied off a playlist page is meant as the playlist.
  const pl = u.match(PLAYLIST_RE);
  if (pl && /youtube\.com|youtu\.be/i.test(u)) {
    return { kind: 'youtube-playlist', id: pl[1], label: 'a YouTube playlist' };
  }
  const sheet = u.match(SHEET_RE);
  if (sheet) {
    return {
      kind: 'google-sheet',
      id: sheet[1],
      readUrl: `https://docs.google.com/spreadsheets/d/${sheet[1]}/export?format=csv`,
      label: 'a Google Sheet',
    };
  }
  const doc = u.match(DOC_RE);
  if (doc) {
    return {
      kind: 'google-doc',
      id: doc[1],
      readUrl: `https://docs.google.com/document/d/${doc[1]}/export?format=txt`,
      label: 'a Google Doc',
    };
  }
  if (PLAIN_RE.test(u)) return { kind: 'plain-file', readUrl: u, label: 'a list file' };
  return { kind: 'song', label: 'a song' };
}

/**
 * Pure. Is this whole paste nothing but ONE link to a list?
 *
 * Deliberately narrow: a paste that is a real list of songs WITH a stray
 * document link in it is still a list of songs, and must keep going down the
 * path it always took. Only the "I pasted the address of my list" case is
 * diverted, because only that case is the one that silently added one row.
 */
export function looksLikeListLink(text) {
  const lines = String(text || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length !== 1) return null;
  const url = firstUrl(lines[0]);
  if (!url || url !== lines[0]) return null;      // a title beside a link is a song
  const c = classifyLink(url);
  return c.kind === 'song' ? null : { ...c, url };
}

/** The YouTube road this app already walks. Injectable so tests never call out. */
async function ytPlaylistTitles(id, key, { fetchImpl, maxPages = 10 } = {}) {
  const f = fetchImpl || (typeof fetch === 'function' ? fetch : null);
  if (!f) throw new Error('no fetch');
  const out = [];
  let pageToken = '';
  for (let page = 0; page < maxPages; page += 1) {
    const q = `playlistItems?part=snippet&maxResults=50&playlistId=${encodeURIComponent(id)}`
      + (pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : '')
      + `&key=${encodeURIComponent(key)}`;
    const res = await f(`https://www.googleapis.com/youtube/v3/${q}`);
    if (!res || !res.ok) throw new Error(`playlist ${res ? res.status : 'no-response'}`);
    const json = await res.json();
    for (const it of json.items || []) {
      const title = it?.snippet?.title || '';
      const vid = it?.snippet?.resourceId?.videoId || '';
      // YouTube keeps removed entries in the playlist under these exact titles.
      if (!title || /^(Private|Deleted) video$/i.test(title)) continue;
      out.push(vid ? `${title} https://www.youtube.com/watch?v=${vid}` : title);
    }
    pageToken = json.nextPageToken || '';
    if (!pageToken) break;
  }
  return out;
}

/**
 * Read a list that lives behind a link. Returns a THREE-valued answer, never a
 * bare null — the reason is what the surface has to say out loud (DR-1053).
 *
 * @returns {{ok: true, songs: Array, via: string}}
 *        | {ok: false, reason: 'not-a-list'|'no-key'|'unreadable'|'empty', detail?: string}
 */
export async function readListBehindLink(text, deps = {}) {
  const target = looksLikeListLink(text);
  if (!target) return { ok: false, reason: 'not-a-list' };

  if (target.kind === 'youtube-playlist') {
    const key = deps.youtubeKey
      || (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_YOUTUBE_API_KEY)
      || '';
    if (!key) return { ok: false, reason: 'no-key', kind: target.kind };
    try {
      const lines = await ytPlaylistTitles(target.id, key, deps);
      const songs = parseSongList(lines.join('\n'));
      return songs.length
        ? { ok: true, songs, via: 'youtube-playlist' }
        : { ok: false, reason: 'empty', kind: target.kind };
    } catch (e) {
      return { ok: false, reason: 'unreadable', kind: target.kind, detail: String(e && e.message || e) };
    }
  }

  const f = deps.fetchImpl || (typeof fetch === 'function' ? fetch : null);
  if (!f) return { ok: false, reason: 'unreadable', kind: target.kind };
  try {
    const res = await f(target.readUrl, { redirect: 'follow' });
    if (!res || !res.ok) {
      return { ok: false, reason: 'unreadable', kind: target.kind, detail: `HTTP ${res ? res.status : '?'}` };
    }
    const body = await res.text();
    // A document that is NOT shared comes back as Google's sign-in page, which
    // is perfectly valid HTML and would otherwise be parsed into "songs" named
    // after its markup. That is the fabricated-success case; refuse it.
    if (/^\s*<(?:!doctype|html)/i.test(body) || /accounts\.google\.com/i.test(body.slice(0, 2000))) {
      return { ok: false, reason: 'unreadable', kind: target.kind, detail: 'not-shared' };
    }
    const songs = songsFromDocument(body);
    return songs.length
      ? { ok: true, songs, via: target.kind }
      : { ok: false, reason: 'empty', kind: target.kind };
  } catch (e) {
    return { ok: false, reason: 'unreadable', kind: target.kind, detail: String(e && e.message || e) };
  }
}

/** Pure. What to say for every refusal — each one ends in a road that works. */
export function linkFailureMessage(res) {
  if (!res || res.ok) return '';
  const FILE_ROAD = 'Download it (in Google: File → Download → CSV, Excel or Plain text) and use "Upload a list" below — that reads it here on our own equipment, with no Google sign-in involved.';
  if (res.reason === 'no-key') {
    return 'Reading a YouTube playlist needs the YouTube key, which this build does not carry. Open the playlist, copy the song names, and paste them one per line.';
  }
  if (res.reason === 'empty') {
    return res.kind === 'youtube-playlist'
      ? 'That playlist opened, but no playable videos were in it.'
      : `That opened, but no song titles were found in it. A column headed “Song” or “Title”, or one song per line, is what this looks for. ${FILE_ROAD}`;
  }
  if (res.reason === 'unreadable') {
    if (res.detail === 'not-shared') {
      return `That document is not shared, so the app was handed a sign-in page instead of the list. Either set it to “Anyone with the link can view” and try again, or: ${FILE_ROAD}`;
    }
    return `The app could not read that link from here — a browser can only read another site's file when that site allows it. ${FILE_ROAD}`;
  }
  return '';
}
