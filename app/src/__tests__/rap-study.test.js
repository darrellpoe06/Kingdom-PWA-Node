// @vitest-environment node
//
// RAP Bible Study — the interactive handout (rap-study.js). Proves the outline is
// faithful to the paper, the device-local reflection store round-trips per
// identity, and the harvest resolver reports HONEST state (awaiting -> ingested
// -> attached) — never a painted attachment (DR-0076).
import { describe, it, expect, beforeEach } from 'vitest';
import {
  RAP_STUDY, studyById, reflectionsKey,
  loadStore, saveStore, reflectionFor, setPointText, setGeneralText,
  reflectionProgress, resolveStudyHarvest,
} from '../lib/rap-study.js';

// A minimal in-memory localStorage so the fail-soft load/save exercise for real.
function installStorage() {
  const map = new Map();
  globalThis.localStorage = {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => { map.set(k, String(v)); },
    removeItem: (k) => { map.delete(k); },
    clear: () => map.clear(),
  };
  return map;
}

describe('the outline is faithful to the printed handout', () => {
  it('carries the church, dates, teacher, theme, and exactly five points', () => {
    expect(RAP_STUDY.church).toBe('Church of the Living God');
    expect(RAP_STUDY.theme).toBe('Elijah');
    expect(RAP_STUDY.handoutDate).toBe('2026-07-01');
    expect(RAP_STUDY.pointsFrom).toBe('2026-06-28');
    expect(RAP_STUDY.teacher).toBe('Pastor Ken McCray');
    expect(RAP_STUDY.seniorBishop).toBe('Senior Bishop Lloyd E. Gwin');
    expect(RAP_STUDY.points).toHaveLength(5);
    expect(RAP_STUDY.points.map((p) => p.title)).toEqual([
      'Elijah is standing before Ahab',
      'God sustains Elijah',
      'Elijah stand before Ahab again',
      'Elijah is replaced',
      'Elijah is taken to heaven by a whirlwind',
    ]);
  });

  it('links the two handout Scriptures with verbatim KJV text', () => {
    const refs = RAP_STUDY.scriptures.map((s) => s.ref);
    expect(refs).toEqual(['Isaiah 61:7', '2 Kings 2:9-10']);
    for (const s of RAP_STUDY.scriptures) {
      expect(s.translation).toBe('KJV');
      expect(s.text.length).toBeGreaterThan(20);
    }
    // Anchor the verbatim text so a silent edit that corrupts Scripture fails.
    expect(RAP_STUDY.scriptures[0].text).toMatch(/^For your shame ye shall have double/);
    expect(RAP_STUDY.scriptures[1].text).toMatch(/double portion of thy spirit be upon me/);
  });

  it('records the harvest lane the study attaches to', () => {
    expect(RAP_STUDY.harvestMatch.laneId).toBe('local_4d62ae64');
    expect(RAP_STUDY.harvestMatch.serviceDate).toBe('2026-07-01');
  });

  it('is resolvable by id', () => {
    expect(studyById(RAP_STUDY.id)).toBe(RAP_STUDY);
    expect(studyById('nope')).toBeNull();
  });
});

describe('reflections are per-identity, device-local, and round-trip', () => {
  beforeEach(() => installStorage());

  it('keys the store by the lowercased email', () => {
    expect(reflectionsKey('Darrell@Poe.US')).toBe('poetech.rapstudy.v1:darrell@poe.us');
    expect(reflectionsKey(null)).toBe('poetech.rapstudy.v1:anon');
  });

  it('saves a point reflection and reads it back for the same identity', () => {
    let store = loadStore('a@b.co');
    expect(reflectionFor(store, RAP_STUDY.id).points.p1).toBeUndefined();
    store = setPointText(store, RAP_STUDY.id, 'p1', 'Elijah stood alone but not alone.', '2026-07-01T18:00:00Z');
    saveStore('a@b.co', store);
    const reloaded = loadStore('a@b.co');
    expect(reflectionFor(reloaded, RAP_STUDY.id).points.p1).toBe('Elijah stood alone but not alone.');
    expect(reflectionFor(reloaded, RAP_STUDY.id).updatedAt).toBe('2026-07-01T18:00:00Z');
  });

  it('never commingles two identities on one device', () => {
    let a = setPointText(loadStore('a@b.co'), RAP_STUDY.id, 'p1', 'mine', '2026-07-01T00:00:00Z');
    saveStore('a@b.co', a);
    const b = loadStore('other@x.co');
    expect(reflectionFor(b, RAP_STUDY.id).points.p1).toBeUndefined();
  });

  it('defaults visibility to private and counts written points honestly', () => {
    let store = loadStore('a@b.co');
    store = setPointText(store, RAP_STUDY.id, 'p1', 'one', '2026-07-01T00:00:00Z');
    store = setPointText(store, RAP_STUDY.id, 'p3', 'three', '2026-07-01T00:00:00Z');
    store = setGeneralText(store, RAP_STUDY.id, 'overall', '2026-07-01T00:00:00Z');
    const r = reflectionFor(store, RAP_STUDY.id);
    expect(r.visibility).toBe('private');
    expect(r.general).toBe('overall');
    expect(reflectionProgress(r, RAP_STUDY)).toEqual({ filled: 2, total: 5, pct: 40 });
  });

  it('clearing a point removes it (empty is not a written point)', () => {
    let store = setPointText(loadStore('a@b.co'), RAP_STUDY.id, 'p1', 'x', '2026-07-01T00:00:00Z');
    store = setPointText(store, RAP_STUDY.id, 'p1', '', '2026-07-01T00:01:00Z');
    expect(reflectionFor(store, RAP_STUDY.id).points.p1).toBeUndefined();
    expect(reflectionProgress(reflectionFor(store, RAP_STUDY.id), RAP_STUDY).filled).toBe(0);
  });
});

describe('the harvest resolver reports honest state', () => {
  it('is AWAITING when nothing is ingested for the study date', () => {
    const r = resolveStudyHarvest(RAP_STUDY, { rows: [] });
    expect(r.status).toBe('awaiting');
    expect(r.video).toBeNull();
    expect(r.laneId).toBe('local_4d62ae64');
  });

  it('is INGESTED when the video exists on the date but has no transcript', () => {
    const rows = [{
      videoId: 'vidA', serviceDate: '2026-07-01', serviceType: 'wednesday', title: 'RAP study',
      harvests: { sermon: { status: 'complete' }, transcript: { status: 'none' } },
    }];
    const r = resolveStudyHarvest(RAP_STUDY, { rows });
    expect(r.status).toBe('ingested');
    expect(r.video.videoId).toBe('vidA');
  });

  it('is ATTACHED with mined Scripture + lessons once a transcript lands', () => {
    const rows = [{
      videoId: 'vidA', serviceDate: '2026-07-01', serviceType: 'wednesday', title: 'RAP study',
      harvests: {
        transcript: { status: 'complete' },
        scripture: { status: 'complete', refs: ['1 Kings 17:1', '2 Kings 2:11'] },
        lessons: { status: 'partial', refs: ['God sustains those He sends'] },
      },
    }];
    const transcripts = { vidA: { text: 'Elijah said unto Ahab, As the Lord God of Israel liveth... (full transcript here)' } };
    const r = resolveStudyHarvest(RAP_STUDY, { rows, transcripts });
    expect(r.status).toBe('attached');
    expect(r.scriptures).toEqual(['1 Kings 17:1', '2 Kings 2:11']);
    expect(r.lessons).toEqual(['God sustains those He sends']);
    expect(r.transcriptText).toMatch(/Elijah said unto Ahab/);
  });

  it('prefers the Bible-study recording and is deterministic on ties', () => {
    const rows = [
      { videoId: 'vSun', serviceDate: '2026-07-01', serviceType: 'sunday', title: 'Sunday service', harvests: { transcript: { status: 'none' } } },
      { videoId: 'vWed', serviceDate: '2026-07-01', serviceType: 'wednesday', title: 'Bible study', harvests: { transcript: { status: 'none' } } },
    ];
    const r = resolveStudyHarvest(RAP_STUDY, { rows });
    expect(r.video.videoId).toBe('vWed');
  });

  it('honors an explicit videoId over the date match when set', () => {
    const study = { ...RAP_STUDY, harvestMatch: { ...RAP_STUDY.harvestMatch, videoId: 'pinned' } };
    const rows = [
      { videoId: 'other', serviceDate: '2026-07-01', serviceType: 'wednesday', harvests: { transcript: { status: 'complete' } } },
      { videoId: 'pinned', serviceDate: '2026-06-30', serviceType: 'wednesday', harvests: { transcript: { status: 'complete' } } },
    ];
    const r = resolveStudyHarvest(study, { rows });
    expect(r.video.videoId).toBe('pinned');
  });
});
