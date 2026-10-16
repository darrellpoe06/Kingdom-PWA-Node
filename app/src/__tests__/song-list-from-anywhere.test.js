// @vitest-environment node
// =============================================================================
// A song list arrives however Christina has it (DR-1061 + DR-1061)
// =============================================================================
// Darrell, 2026-10-16: **"Make sure this works with Google docs... Excel and
// other documents to pull lists of songs from Christina and the senior team
// members"** — and then, looking at the paste box: **"Does pasting a link with
// a list of songs add them to the app like the others that work
// comprehensively?"** ... **"Fix it..."**
//
// THE ANSWER WAS NO, AND IT LIED ABOUT IT. A Google Sheet link pasted into
// "Paste a list" became ONE song idea titled after the link, the box said
// "1 song detected", the insert succeeded. Forty songs did not arrive and
// nothing said so. The first describe below is that exact case.
import { describe, it, expect } from 'vitest';
import {
  splitCells, columnsFromHeader, lineFromRow, isNoiseLine, linesFromDocument,
  songsFromDocument, emptyReason,
} from '../lib/song-list-import.js';
import {
  firstUrl, classifyLink, looksLikeListLink, readListBehindLink, linkFailureMessage,
} from '../lib/song-link-list.js';
import { parseSongList } from '../lib/song-workshop-sync.js';

const SHEET = 'https://docs.google.com/spreadsheets/d/1pyARuAxQr_y75P1acl-RaKoDYjXgjeg5IIDyD4fmakA/edit#gid=0';
const DOC = 'https://docs.google.com/document/d/1V2UHQUAws0nLYfMW1VeBsCCI-GBq3BcjI-zLDXeWJk4/edit';
const PLAYLIST = 'https://www.youtube.com/playlist?list=PLabcdefghijk123456';

const okText = (body) => async () => ({ ok: true, status: 200, text: async () => body });
const httpFail = (status) => async () => ({ ok: false, status, text: async () => '' });

describe('THE DEFECT: a link to a list was counted as one song', () => {
  it('the OLD parser turns a Sheet link into a single bogus idea', () => {
    // Characterizing the real behavior before changing it (DR-0076 §5). This is
    // what Christina's paste produced, and why it looked like it worked.
    const old = parseSongList(SHEET);
    expect(old).toHaveLength(1);
    expect(old[0].url).toContain('docs.google.com');
  });

  it('...and the new classifier refuses to call it a song', () => {
    const got = looksLikeListLink(SHEET);
    expect(got, 'a Sheet link is still being treated as a song').toBeTruthy();
    expect(got.kind).toBe('google-sheet');
    expect(got.readUrl).toBe(
      'https://docs.google.com/spreadsheets/d/1pyARuAxQr_y75P1acl-RaKoDYjXgjeg5IIDyD4fmakA/export?format=csv',
    );
  });
});

describe('classifyLink', () => {
  it('knows a Sheet, a Doc, a playlist and a plain file apart', () => {
    expect(classifyLink(SHEET).kind).toBe('google-sheet');
    expect(classifyLink(DOC).kind).toBe('google-doc');
    expect(classifyLink(DOC).readUrl).toMatch(/\/export\?format=txt$/);
    expect(classifyLink(PLAYLIST).kind).toBe('youtube-playlist');
    expect(classifyLink('https://files.test/songs.csv').kind).toBe('plain-file');
  });

  it('a watch url carrying BOTH v= and list= is read as the playlist', () => {
    // Copying from a playlist page gives this shape, and the playlist is what
    // the person meant. A single video would lose 49 songs silently.
    const c = classifyLink('https://www.youtube.com/watch?v=abc12345678&list=PLabcdefghijk123456');
    expect(c.kind).toBe('youtube-playlist');
    expect(c.id).toBe('PLabcdefghijk123456');
  });

  it('an ordinary song link is still an ordinary song', () => {
    expect(classifyLink('https://youtu.be/abc12345678').kind).toBe('song');
    expect(looksLikeListLink('https://youtu.be/abc12345678')).toBe(null);
  });

  it('`list=` on a non-YouTube host is NOT a playlist', () => {
    expect(classifyLink('https://example.test/x?list=PLabcdefghijk123456').kind).toBe('song');
  });

  it('firstUrl finds a url in a line and stops at punctuation', () => {
    expect(firstUrl('Total Praise - https://youtu.be/abc123)')).toBe('https://youtu.be/abc123');
    expect(firstUrl('no link here')).toBe('');
  });
});

describe('looksLikeListLink is DELIBERATELY narrow', () => {
  it('a real list of songs that happens to contain a Sheet link keeps its old path', () => {
    // Diverting this would break the thing that already works. Only the "I
    // pasted the address of my list" case is diverted.
    const text = `Total Praise\n${SHEET}\nWay Maker`;
    expect(looksLikeListLink(text)).toBe(null);
    expect(parseSongList(text).length).toBe(3);
  });

  it('a title beside a link is a song, not a list', () => {
    expect(looksLikeListLink(`Our set list ${SHEET}`)).toBe(null);
  });

  it('whitespace around a lone link does not hide it', () => {
    expect(looksLikeListLink(`\n  ${SHEET}  \n`)?.kind).toBe('google-sheet');
  });
});

describe('reading the list behind the link', () => {
  it('a shared Sheet comes back as CSV and every row becomes a song', async () => {
    const csv = 'Song,Artist,Key\nTotal Praise,Richard Smallwood,B\nWay Maker,Sinach,E\n';
    const res = await readListBehindLink(SHEET, { fetchImpl: okText(csv) });
    expect(res.ok).toBe(true);
    expect(res.songs.map((s) => s.title)).toEqual(['Total Praise', 'Way Maker']);
  });

  it('A SIGN-IN PAGE IS NOT A SONG LIST — the fabricated-success case is refused', async () => {
    // An unshared document returns Google's login HTML with status 200. Parsed
    // naively it yields "songs" named after markup, and the person is told it
    // worked. This is the single most important case in this file.
    const html = '<!DOCTYPE html><html><head><title>Sign in</title></head><body>accounts.google.com</body></html>';
    const res = await readListBehindLink(SHEET, { fetchImpl: okText(html) });
    expect(res.ok).toBe(false);
    expect(res.detail).toBe('not-shared');
    expect(linkFailureMessage(res)).toMatch(/not shared/i);
    expect(linkFailureMessage(res)).toMatch(/Upload a list/i);   // ...and the road that works
  });

  it('a cross-origin refusal says so AND names the road that always works', async () => {
    const res = await readListBehindLink(SHEET, { fetchImpl: async () => { throw new TypeError('Failed to fetch'); } });
    expect(res.ok).toBe(false);
    expect(res.reason).toBe('unreadable');
    expect(linkFailureMessage(res)).toMatch(/Download it/i);
  });

  it('an HTTP error is a refusal, not an empty list', async () => {
    const res = await readListBehindLink(SHEET, { fetchImpl: httpFail(403) });
    expect(res.reason).toBe('unreadable');
    expect(res.detail).toBe('HTTP 403');
  });

  it('a playlist is read through the road this app already walks, and pages', async () => {
    const page = (n, next) => ({
      ok: true,
      status: 200,
      json: async () => ({
        items: [{ snippet: { title: `Song ${n}`, resourceId: { videoId: `vid${n}` } } }],
        nextPageToken: next,
      }),
    });
    const calls = [];
    const fetchImpl = async (u) => { calls.push(u); return calls.length === 1 ? page(1, 'TOK') : page(2, ''); };
    const res = await readListBehindLink(PLAYLIST, { fetchImpl, youtubeKey: 'k' });
    expect(res.ok).toBe(true);
    expect(res.songs.map((s) => s.title)).toEqual(['Song 1', 'Song 2']);
    expect(calls[1]).toContain('pageToken=TOK');
  });

  it('YouTube’s removed entries are dropped, never imported as songs', async () => {
    const fetchImpl = async () => ({
      ok: true,
      status: 200,
      json: async () => ({ items: [
        { snippet: { title: 'Private video', resourceId: { videoId: 'a' } } },
        { snippet: { title: 'Deleted video', resourceId: { videoId: 'b' } } },
        { snippet: { title: 'Total Praise', resourceId: { videoId: 'c' } } },
      ] }),
    });
    const res = await readListBehindLink(PLAYLIST, { fetchImpl, youtubeKey: 'k' });
    expect(res.songs.map((s) => s.title)).toEqual(['Total Praise']);
  });

  it('no YouTube key says exactly that, rather than failing as unreadable', async () => {
    const res = await readListBehindLink(PLAYLIST, { youtubeKey: '', fetchImpl: okText('') });
    expect(res.reason).toBe('no-key');
    expect(linkFailureMessage(res)).toMatch(/paste them one per line/i);
  });

  it('EVERY refusal produces a sentence — none of them is silence', () => {
    for (const r of [
      { ok: false, reason: 'no-key', kind: 'youtube-playlist' },
      { ok: false, reason: 'empty', kind: 'google-sheet' },
      { ok: false, reason: 'empty', kind: 'youtube-playlist' },
      { ok: false, reason: 'unreadable', kind: 'google-sheet' },
      { ok: false, reason: 'unreadable', kind: 'google-sheet', detail: 'not-shared' },
    ]) {
      expect(linkFailureMessage(r).length, `${r.reason}/${r.detail} says nothing`).toBeGreaterThan(30);
    }
  });
});

describe('a spreadsheet becomes songs (the file road, DR-1061)', () => {
  it('splitCells handles quoted commas and tabs', () => {
    expect(splitCells('"Smallwood, Richard",Total Praise')).toEqual(['Smallwood, Richard', 'Total Praise']);
    expect(splitCells('a\tb\tc')).toEqual(['a', 'b', 'c']);
    // RFC 4180: "" is an escaped quote only INSIDE a quoted field, which is
    // how Excel and Sheets actually write it.
    expect(splitCells('"say ""what"" now",x')).toEqual(['say "what" now', 'x']);
  });

  it('a header names the columns and is NEVER itself added as a song', () => {
    const cols = columnsFromHeader('No.,Song Title,Artist,Link');
    expect(cols).toEqual({ song: 1, link: 3 });
    const songs = songsFromDocument('No.,Song Title,Artist,Link\n1,Total Praise,Smallwood,https://youtu.be/abc123\n');
    expect(songs).toHaveLength(1);
    expect(songs[0]).toEqual({ title: 'Total Praise', url: 'https://youtu.be/abc123' });
  });

  it('a sheet with NO header does not lose its first song', () => {
    // columnsFromHeader returns null rather than guessing, precisely so the
    // first row is not eaten as a title.
    expect(columnsFromHeader('Total Praise,Smallwood,B')).toBe(null);
    const songs = songsFromDocument('Total Praise,Smallwood,B\nWay Maker,Sinach,E\n');
    expect(songs.map((s) => s.title)).toEqual(['Total Praise', 'Way Maker']);
  });

  it('a leading number or date column is skipped in favour of the words', () => {
    expect(lineFromRow('1,Total Praise,B')).toBe('Total Praise');
    expect(lineFromRow('2026-10-12,Way Maker,E')).toBe('Way Maker');
  });

  it('headings, rules and PDF footers are not songs', () => {
    for (const n of ['', '   ', '-----', 'Songs:', 'SET LIST', 'Page 2 of 4', 'Title']) {
      expect(isNoiseLine(n), `"${n}" was taken for a song`).toBe(true);
    }
    expect(isNoiseLine('Total Praise')).toBe(false);
  });

  it('a plain one-per-line list still works untouched', () => {
    expect(linesFromDocument('Total Praise\n\nWay Maker\n')).toEqual(['Total Praise', 'Way Maker']);
  });

  it('a .docx says what to do instead of failing in silence', () => {
    expect(emptyReason({ name: 'TLC Songs.docx' }, '')).toMatch(/Download .* PDF|File → Download/i);
    expect(emptyReason({ name: 'photo.jpg' }, '')).toMatch(/in focus/i);
    expect(emptyReason({ name: 'x.csv' }, 'words but no songs')).toMatch(/no song titles/i);
  });
});
