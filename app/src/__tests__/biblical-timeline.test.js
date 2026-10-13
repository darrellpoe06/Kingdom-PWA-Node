// Verification harness for the biblical-timeline spine (DR-0076). The timeline
// is doctrinally load-bearing, so this test is the brake: every anchor.text must
// be KJV VERBATIM (reconstructed from app/public/bible/kjv, not trusted), every
// `lessons` id must resolve to a REAL Living Lesson, and the relationship arc /
// phase / you-are-here invariants must hold. Proven-to-catch: mistype a verse or
// point at a dead lesson id and this fails.
import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import {
  TIMELINE_EPOCHS, TIMELINE_FRAME_ANCHORS, RELATIONSHIP_ARC,
  listEpochs, getEpoch, currentEpoch, epochsByPhase, allAnchoredLessonIds, epochsForLesson,
} from '../lib/biblical-timeline.js';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';

// --- KJV verbatim reconstruction (same source the lessons are fetched from) ---
const BOOK_FILE = (book) => (book === 'Psalm' ? 'Psalms' : book).replace(/\s+/g, '');
function kjv(ref) {
  // "Book C:V", "Book C:V-V", or single-chapter "Book V" / "Book V-V" (e.g. Jude 6).
  let m = ref.match(/^(.+?)\s+(\d+):(\d+)(?:-(\d+))?$/);
  if (!m) {
    const s = ref.match(/^(.+?)\s+(\d+)(?:-(\d+))?$/);
    if (!s) throw new Error(`unparseable ref: ${ref}`);
    m = [s[0], s[1], '1', s[2], s[3]];
  }
  const [, book, chap, a, b] = m;
  const data = JSON.parse(readFileSync(`public/bible/kjv/${BOOK_FILE(book)}.json`, 'utf8'));
  const verses = data.chapters[Number(chap) - 1];
  const start = Number(a);
  const end = b ? Number(b) : start;
  return verses.slice(start - 1, end).join(' ');
}

const allAnchors = () => [
  ...TIMELINE_FRAME_ANCHORS,
  ...TIMELINE_EPOCHS.flatMap((e) => e.anchors),
];

describe('biblical-timeline — every anchor is KJV verbatim (DR-0076)', () => {
  for (const a of allAnchors()) {
    it(`${a.ref} matches the KJV text exactly`, () => {
      expect(a.text).toBe(kjv(a.ref));
    });
  }
});

describe('biblical-timeline — every anchored lesson id is real', () => {
  const realIds = new Set(LIVING_LESSONS_MODULES.map((m) => m.id));
  it('resolves every lessons[] id to a Living Lesson (no dead refs)', () => {
    for (const e of TIMELINE_EPOCHS) {
      for (const id of e.lessons || []) {
        expect(realIds.has(id), `epoch "${e.id}" points at missing lesson "${id}"`).toBe(true);
      }
    }
  });
  it('anchors L29 (the Unseen Realm / nations) at both Babel and the Church Age', () => {
    expect(epochsForLesson('ll29-the-unseen-realm-and-the-nations')).toEqual(
      expect.arrayContaining(['babel', 'church-age']),
    );
  });
});

describe('biblical-timeline — structure invariants', () => {
  it('orders are 1..N, contiguous and unique', () => {
    const orders = TIMELINE_EPOCHS.map((e) => e.order).sort((a, b) => a - b);
    expect(orders).toEqual(orders.map((_, i) => i + 1));
  });
  it('listEpochs returns them sorted by order', () => {
    expect(listEpochs().map((e) => e.order)).toEqual([...TIMELINE_EPOCHS].map((e) => e.order).sort((a, b) => a - b));
  });
  it('phases are before -> during -> end, in that block order', () => {
    const phases = listEpochs().map((e) => e.phase);
    const firstDuring = phases.indexOf('during');
    const firstEnd = phases.indexOf('end');
    expect(phases[0]).toBe('before');
    expect(firstDuring).toBeGreaterThan(0);
    expect(firstEnd).toBeGreaterThan(firstDuring);
    // no phase reappears after the next has begun
    expect(phases.slice(firstEnd).every((p) => p === 'end')).toBe(true);
  });
  it('exactly one epoch is "you are here", and it is the Church Age', () => {
    const here = TIMELINE_EPOCHS.filter((e) => e.youAreHere === true);
    expect(here).toHaveLength(1);
    expect(currentEpoch().id).toBe('church-age');
  });
  it('every relationship.state is a known state in the arc', () => {
    for (const e of TIMELINE_EPOCHS) {
      expect(RELATIONSHIP_ARC).toContain(e.relationship.state);
    }
  });
  it('the arc opens purposed/fellowship and closes consummated', () => {
    const states = listEpochs().map((e) => e.relationship.state);
    expect(states[0]).toBe('purposed');
    expect(states.at(-1)).toBe('consummated');
  });
  it('every epoch has a summary and at least one anchor', () => {
    for (const e of TIMELINE_EPOCHS) {
      expect(typeof e.summary).toBe('string');
      expect(e.summary.length).toBeGreaterThan(20);
      expect(e.anchors.length).toBeGreaterThan(0);
    }
  });
});

describe('biblical-timeline — "all possibilities" blocks are honest (DR-0098/DR-0100)', () => {
  const withPoss = TIMELINE_EPOCHS.filter((e) => e.possibilities);
  it('the debated epochs carry a possibilities block (creation, genesis-6, babel, the-return)', () => {
    expect(withPoss.map((e) => e.id).sort()).toEqual(['babel', 'creation', 'genesis-6', 'the-return']);
  });
  it('every possibility states a plumb line, competing views, an open note, a confidence, and an SME/source', () => {
    for (const e of withPoss) {
      for (const p of e.possibilities) {
        expect(p.plumbLine, `${e.id}: plumbLine`).toBeTruthy();
        expect(Array.isArray(p.views) && p.views.length >= 2, `${e.id}: >=2 views`).toBe(true);
        expect(p.open, `${e.id}: open`).toBeTruthy();
        expect(p.confidence, `${e.id}: confidence`).toBeTruthy();
        expect(p.source, `${e.id}: source`).toBeTruthy();
      }
    }
  });
});

describe('biblical-timeline — helpers', () => {
  it('getEpoch resolves and misses correctly', () => {
    expect(getEpoch('babel').era).toMatch(/Babel/);
    expect(getEpoch('nope')).toBe(null);
  });
  it('allAnchoredLessonIds is deduped and non-empty', () => {
    const ids = allAnchoredLessonIds();
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBeGreaterThan(10);
  });
  it('epochsByPhase returns the three timeframes in order', () => {
    expect(epochsByPhase().map((g) => g.phase)).toEqual(['before', 'during', 'end']);
    expect(epochsByPhase().every((g) => g.epochs.length > 0)).toBe(true);
  });
});
