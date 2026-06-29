// =============================================================================
// choir corpus harvest — build the HISTORICAL library from the services we
// already have (Darrell 2026-06-25: one source, two harvests; reuse, don't
// re-fetch). The same service videos ingested for sermons (choir_sermons) carry
// the choir songs; attributeToCorpus links each extracted song to its real
// service (reusing that service's video link + date) so it lands as a rendition,
// and repertoireCoverage gives an HONEST "swept X of N services" readout.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { attributeToCorpus, repertoireCoverage, selectNewArchiveSongs } from '../lib/choir-archive.js';
import { selectNewSermonImports } from '../lib/choir-sync.js';
import { archiveRowToInsert } from '../lib/choir-songbook-sync.js';

// The services we ALREADY hold (choir_sermons shapes).
const services = [
  { videoId: 'vidA', youtubeUrl: 'https://youtu.be/vidA', serviceDate: '2026-05-10', serviceType: 'sunday' },
  { videoId: 'vidB', youtubeUrl: 'https://www.youtube.com/watch?v=vidB', serviceDate: '2026-05-17', serviceType: 'sunday' },
];

// Extracted songs: one knows its video, one knows only its date, one is unknown.
const extracted = [
  { title: 'Total Praise', titleKey: 'total praise', videoId: 'vidA', confidence: 'high', needsReview: false },
  { title: 'Way Maker', titleKey: 'way maker', serviceDate: '2026-05-17', confidence: 'med', needsReview: true },
  { title: 'A New Song', titleKey: 'a new song', confidence: 'low', needsReview: true },
];

describe('attributeToCorpus — reuse the existing service videos (no re-fetch)', () => {
  const { rows, scope } = attributeToCorpus(extracted, services);

  it('links a song to its service by video_id and INHERITS that service video + date', () => {
    expect(rows[0]).toMatchObject({
      title: 'Total Praise', videoId: 'vidA',
      youtubeUrl: 'https://youtu.be/vidA', serviceDate: '2026-05-10', serviceType: 'sunday',
      fromService: true,
    });
  });

  it('links by service DATE when the song carries no video_id, inheriting the held video', () => {
    expect(rows[1]).toMatchObject({
      title: 'Way Maker', videoId: 'vidB',
      youtubeUrl: 'https://www.youtube.com/watch?v=vidB', serviceDate: '2026-05-17', fromService: true,
    });
  });

  it('FAITHFUL: a song that matches no held service is KEPT but flagged unlinked (never dropped, never faked)', () => {
    expect(rows[2]).toMatchObject({ title: 'A New Song', fromService: false });
    expect(scope).toMatchObject({ services: 2, matched: 2, unmatched: 1, unmatchedTitles: ['A New Song'] });
  });

  it('a linked, attributed row still maps to a valid choir_songs insert (persist shape holds)', () => {
    const row = archiveRowToInsert({ tenantId: 't', userId: 'u' }, rows[0]);
    expect(row).toMatchObject({ video_id: 'vidA', youtube_url: 'https://youtu.be/vidA', service_date: '2026-05-10', source: 'archive' });
  });
});

describe('repertoireCoverage — honest "swept X of N services"', () => {
  it('counts the distinct held services that have at least one harvested song', () => {
    const songs = [{ videoId: 'vidA', serviceDate: '2026-05-10' }, { videoId: 'vidB', serviceDate: '2026-05-17' }];
    expect(repertoireCoverage(services, songs)).toEqual({ totalServices: 2, coveredServices: 2, pendingServices: 0 });
  });

  it('PROVEN-TO-CATCH: a partial sweep reads as partial (never painted complete)', () => {
    const songs = [{ videoId: 'vidA', serviceDate: '2026-05-10' }];
    expect(repertoireCoverage(services, songs)).toEqual({ totalServices: 2, coveredServices: 1, pendingServices: 1 });
  });

  it('no songs yet → 0 covered, all pending', () => {
    expect(repertoireCoverage(services, [])).toEqual({ totalServices: 2, coveredServices: 0, pendingServices: 2 });
  });
});

describe('idempotent re-sweep — re-importing the same service adds nothing new', () => {
  it('attributed rows dedup by (video_id, title) so a re-run is safe (reload-safe)', () => {
    const { rows } = attributeToCorpus(extracted, services);
    const existing = rows.filter((r) => r.fromService).map((r) => ({ videoId: r.videoId, title: r.title }));
    expect(selectNewArchiveSongs(rows, existing).map((r) => r.title)).toEqual(['A New Song']); // only the unlinked-new one
  });
});

describe('corpus depth — paginated sermon import dedups across pages', () => {
  it('concatenated pages + already-imported ids yield only the genuinely new services', () => {
    const page1 = [{ videoId: 'v1', title: '5 - 10 - 2026 Bishop Lloyd E. Gwin Bible Study "X"' }];
    const page2 = [
      { videoId: 'v1', title: 'dup of page 1' },                                   // dup across pages
      { videoId: 'v2', title: '5 - 17 - 2026 Bishop Lloyd E. Gwin Bible Study "Y"' },
    ];
    const fresh = selectNewSermonImports([...page1, ...page2], ['v0-already-have']);
    expect(fresh.map((r) => r.videoId)).toEqual(['v1', 'v2']);
  });
});
