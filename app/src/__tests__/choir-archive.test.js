// =============================================================================
// choir-archive — archive-sourced repertoire tests (proven-to-catch).
// The choir's past songs come from the church archive faithfully: the pipeline's
// repertoire.json and song lists/chapters in YouTube descriptions. Everything
// uncertain is flagged for review; nothing is guessed into existence.
// =============================================================================
import { describe, it, expect } from 'vitest';
import {
  parseRepertoireJson, parseDescriptionSongs, buildArchiveSongsFromChannel, selectNewArchiveSongs, songFromClipTitle,
} from '../lib/choir-archive.js';

describe('parseRepertoireJson — the pipeline handoff -> Songbook rows', () => {
  const json = {
    songs: [
      { title: 'Total Praise', video_id: 'vid1', start_seconds: 750, service_date: '2026-05-10', confidence: 'high', source_quote: 'they sang Total Praise' },
      { title: 'Way Maker', video_id: 'vid2', confidence: 'med' },
      { video_id: 'vid3' }, // no title -> dropped
    ],
    unclear: ['Was the 3rd song Goodness of God?'],
  };
  it('maps fields and builds a watch URL from the video id', () => {
    const { rows } = parseRepertoireJson(json);
    expect(rows[0]).toMatchObject({
      title: 'Total Praise', titleKey: 'total praise', videoId: 'vid1',
      startSeconds: 750, serviceDate: '2026-05-10', source: 'archive', confidence: 'high',
      youtubeUrl: 'https://www.youtube.com/watch?v=vid1',
    });
  });
  it('PROVEN-TO-CATCH: only HIGH confidence skips review; everything else needs review', () => {
    const { rows } = parseRepertoireJson(json);
    expect(rows.find((r) => r.titleKey === 'total praise').needsReview).toBe(false);
    expect(rows.find((r) => r.titleKey === 'way maker').needsReview).toBe(true);
  });
  it('drops a song with no title (never seeds an unnamed song)', () => {
    expect(parseRepertoireJson(json).rows).toHaveLength(2);
  });
  it('surfaces the unclear list for the team to confirm', () => {
    expect(parseRepertoireJson(json).unclear).toEqual(['Was the 3rd song Goodness of God?']);
  });
});

describe('parseDescriptionSongs — real YouTube metadata, conservative', () => {
  it('reads chapter lines "mm:ss Title" with the timestamp', () => {
    const songs = parseDescriptionSongs('12:30 Total Praise\n18:05 Way Maker');
    expect(songs).toEqual([
      { title: 'Total Praise', startSeconds: 750 },
      { title: 'Way Maker', startSeconds: 1085 },
    ]);
  });
  it('reads an explicit "Songs:" list block', () => {
    const songs = parseDescriptionSongs('Welcome to service\n\nSongs:\n- Goodness of God\n- Total Praise\n\nPastor: BG');
    expect(songs.map((s) => s.title)).toEqual(expect.arrayContaining(['Goodness of God', 'Total Praise']));
  });
  it('PROVEN-TO-CATCH: drops service-structure lines (sermon/offering), not songs', () => {
    const songs = parseDescriptionSongs('5:00 Welcome\n10:00 Offering\n42:00 Sermon\n20:00 Total Praise');
    expect(songs.map((s) => s.title)).toEqual(['Total Praise']);
  });
  it('empty description yields nothing (no fabrication)', () => {
    expect(parseDescriptionSongs('')).toEqual([]);
    expect(parseDescriptionSongs('Just a normal description with no songs.')).toEqual([]);
  });
});

describe('songFromClipTitle — recover the song from a single-song clip title', () => {
  it('strips a channel segment + boilerplate', () => {
    expect(songFromClipTitle('Total Praise | COLG Mass Choir')).toBe('Total Praise');
    expect(songFromClipTitle('COLG Mass Choir - Way Maker (Live)')).toBe('Way Maker');
  });
  it('PROVEN-TO-CATCH: a dated full-service / structure title is not a song', () => {
    expect(songFromClipTitle('Sunday Morning Worship Service')).toBe(null); // all boilerplate
    expect(songFromClipTitle('Sermon: Walking In Faith')).toBe(null);       // structure word
    expect(songFromClipTitle('5-10-2026')).toBe(null);                      // a date
  });
  it('returns null for empty / too-short leftovers', () => {
    expect(songFromClipTitle('')).toBe(null);
    expect(songFromClipTitle('Choir')).toBe(null);
  });
});

describe('buildArchiveSongsFromChannel — every channel-derived song needs review', () => {
  it('builds archive rows flagged needs_review with low confidence (from a service description)', () => {
    const rows = buildArchiveSongsFromChannel([
      { videoId: 'v1', title: 'Sunday Service 5-10-26', description: '12:30 Total Praise', serviceDate: '2026-05-10', serviceType: 'sunday' },
    ]);
    expect(rows[0]).toMatchObject({ title: 'Total Praise', videoId: 'v1', source: 'archive', confidence: 'low', needsReview: true, serviceDate: '2026-05-10' });
  });
  it('falls back to the clip TITLE when a non-service video has no description songs', () => {
    const rows = buildArchiveSongsFromChannel([
      { videoId: 'v2', title: 'Goodness of God | COLG Choir', description: '', serviceDate: null, serviceType: 'sunday' },
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ title: 'Goodness of God', videoId: 'v2', needsReview: true });
  });
  it('PROVEN-TO-CATCH: a dated service does NOT use its title as a song (setlist wins, no false seed)', () => {
    const rows = buildArchiveSongsFromChannel([
      { videoId: 'v3', title: 'Sunday Service 6-1-26', description: 'no songs listed here', serviceDate: '2026-06-01', serviceType: 'sunday' },
    ]);
    expect(rows).toHaveLength(0);
  });
});

describe('selectNewArchiveSongs — idempotent re-seed (dedup by video + title)', () => {
  const rows = [
    { titleKey: 'total praise', videoId: 'v1' },
    { titleKey: 'way maker', videoId: 'v1' },
  ];
  it('drops rows that already exist', () => {
    const existing = [{ videoId: 'v1', title: 'Total Praise' }];
    expect(selectNewArchiveSongs(rows, existing).map((r) => r.titleKey)).toEqual(['way maker']);
  });
  it('PROVEN-TO-CATCH: same video + same title is one row, not duplicated', () => {
    const dupes = [{ titleKey: 'total praise', videoId: 'v1' }, { titleKey: 'total praise', videoId: 'v1' }];
    expect(selectNewArchiveSongs(dupes, [])).toHaveLength(1);
  });
});
