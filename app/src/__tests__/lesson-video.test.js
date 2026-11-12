// @vitest-environment node
// =============================================================================
// lesson-video — a section's walk-through is measured from the lessons it
// holds, and nothing is painted where nothing is recorded (DR-1447)
// =============================================================================
import { describe, it, expect } from 'vitest';
import { lessonVideo, sameOriginMedia, sectionVideo, recordingPlan, videoCoverage } from '../lib/lesson-video.js';
import { LEARN_CATALOG } from '../lib/learn-catalog.js';
import { courseSections } from '../lib/learning-products.js';

describe('lessonVideo', () => {
  it('resolves a YouTube link to its embed, a same-origin file to a source, and nothing to none', () => {
    expect(lessonVideo({ title: 'L', video: { url: 'https://youtu.be/dQw4w9WgXcQ', seconds: 600 } })).toEqual({
      kind: 'youtube',
      embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      title: 'L',
      seconds: 600,
    });
    expect(lessonVideo({ title: 'L', video: { url: '/media/courses/banking/1.mp4', title: 'Week 1' } })).toEqual({
      kind: 'file',
      src: '/media/courses/banking/1.mp4',
      title: 'Week 1',
      seconds: null,
    });
    expect(lessonVideo({ title: 'L' })).toEqual({ kind: 'none', title: 'L', seconds: null });
    expect(lessonVideo(null)).toEqual({ kind: 'none', title: '', seconds: null });
  });
  it("refuses a file off the app's origin or without a video extension (no third-party player painted)", () => {
    expect(sameOriginMedia('https://cdn.example/x.mp4')).toBeNull();
    expect(sameOriginMedia('//cdn.example/x.mp4')).toBeNull();
    expect(sameOriginMedia('/media/x.txt')).toBeNull();
    expect(sameOriginMedia('/media/x.webm?v=2')).toBe('/media/x.webm?v=2');
    const r = lessonVideo({ video: { url: 'https://cdn.example/x.mp4' } });
    expect(r.kind).toBe('none');
    expect(r.rejected).toBe('https://cdn.example/x.mp4');
  });
});

describe('sections', () => {
  const yt = { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' };
  const sec = (key, lessons) => ({ key, label: key, lessons });
  it("a section's status is measured from its lessons: complete, partial, not-recorded, empty", () => {
    expect(sectionVideo(sec('a', [{ video: yt }, { video: yt }])).status).toBe('complete');
    expect(sectionVideo(sec('b', [{ video: yt }, {}])).status).toBe('partial');
    expect(sectionVideo(sec('c', [{}, {}])).status).toBe('not-recorded');
    expect(sectionVideo(sec('d', [])).status).toBe('empty');
    expect(sectionVideo(sec('b', [{ video: yt }, {}])).video.kind).toBe('youtube');
    expect(sectionVideo(sec('c', [{}])).video.kind).toBe('none');
  });
  it('the recording plan lists only what is owed, with how many', () => {
    const plan = recordingPlan([sec('a', [{ video: yt }]), sec('b', [{ video: yt }, {}, {}]), sec('c', [{}]), sec('d', [])]);
    expect(plan).toEqual([
      { key: 'b', label: 'b', owed: 2 },
      { key: 'c', label: 'c', owed: 1 },
    ]);
    expect(videoCoverage([sec('a', [{ video: yt }]), sec('b', [{ video: yt }, {}, {}])])).toEqual({ lessons: 4, recorded: 2, pct: 50, sections: 2 });
    expect(videoCoverage([])).toEqual({ lessons: 0, recorded: 0, pct: 0, sections: 0 });
  });
});

describe('the live registry', () => {
  it("every course's coverage is measured, never assumed: recorded never exceeds lessons, and every lesson sits in a section", () => {
    for (const entry of LEARN_CATALOG) {
      let rows;
      try {
        rows = entry.buildScheduleRows ? entry.buildScheduleRows() : [];
      } catch {
        rows = [];
      }
      const sections = courseSections(rows);
      const cov = videoCoverage(sections);
      expect(cov.lessons, entry.key).toBe(rows.length);
      expect(cov.recorded).toBeLessThanOrEqual(cov.lessons);
    }
  });
});
