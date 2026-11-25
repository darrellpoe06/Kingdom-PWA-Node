// @vitest-environment jsdom
// =============================================================================
// Institute studio — the approved redesign (2026-11-25), owner-device preview.
// Pins: the flag stays off for everyone but the owner device (or an explicit
// opt-in); the banner carries BG's original photo and his official title; every
// dashboard number comes from the student's own rows (never painted); Continue
// reads the device's saved places; every existing section still mounts beneath
// and the tiles open them; the classic view returns on one press.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import ChurchInstitute from '../components/ChurchInstitute.jsx';
import { COLG_DEFAULT_CHURCH } from '../lib/default-church.js';
import {
  isInstituteStudioOn,
  studentStats,
  continueItems,
  nextUpCourse,
  firstName,
  instituteCourseKeys,
  INSTITUTE_STUDIO_FLAG_KEY,
  courseCovers,
  shippedSrcSet,
} from '../lib/institute-studio.js';
import { recordPlace } from '../lib/learn-resume.js';
import { INSTITUTE_META } from '../lib/church-institute.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const I = '00000000-0000-4000-b000-000000010325';
const U = '00000000-0000-4000-a000-0000000b0325';
const E = '00000000-0000-4000-c000-000000000001';
const flush = () =>
  act(async () => {
    for (let i = 0; i < 6; i += 1) await Promise.resolve();
  });

/** A seam that answers like the database would once the office has opened enrollment. */
function fakeSync(over = {}) {
  const state = {
    settings: { instance_id: I, exemption_status: 'confirmed', enrollment_open: true, attendance_floor: 2 },
    mine: [],
    roll: [],
    creds: [],
  };
  const s = {
    state,
    readInstituteSettings: vi.fn(async () => ({ ok: true, settings: state.settings })),
    saveInstituteSettings: vi.fn(async (_i, patch) => {
      state.settings = { ...state.settings, ...patch };
      return { ok: true, settings: state.settings };
    }),
    readMyEnrollments: vi.fn(async () => ({ ok: true, enrollments: state.mine })),
    applyToProgram: vi.fn(async (_i, { programKey, programTitle, courseKeys }) => {
      const row = {
        id: E,
        program_key: programKey,
        program_title: programTitle,
        course_keys: courseKeys,
        status: 'applied',
        applied_at: '2026-11-13T00:00:00Z',
        user_id: U,
      };
      state.mine = [row];
      state.roll = [row];
      return { ok: true, enrollment: row };
    }),
    withdrawMyEnrollment: vi.fn(async () => {
      state.mine = state.mine.map((e) => ({ ...e, status: 'withdrawn' }));
      return { ok: true, enrollment: state.mine[0] };
    }),
    readInstituteRoll: vi.fn(async () => ({ ok: true, roll: state.roll })),
    setEnrollmentStatus: vi.fn(async () => ({ ok: true })),
    readAttendance: vi.fn(async () => ({ ok: true, attendance: [] })),
    markAttendance: vi.fn(async () => ({ ok: true })),
    readCompletion: vi.fn(async () => ({
      ok: true,
      completion: { complete: false, status: 'applied', present: 1, floor: 2, coursesMissing: ['church-offices'] },
    })),
    issueCredential: vi.fn(async () => ({ ok: true })),
    readMyCredentials: vi.fn(async () => ({ ok: true, credentials: state.creds })),
    verifyCredential: vi.fn(async (code) =>
      String(code).trim().toUpperCase() === 'ABCDEF0123'
        ? { ok: true, found: { holderName: 'Applicant A', programTitle: 'Ministry Leadership', credentialNo: '2026-0001', issuedAt: '2026-11-13T00:00:00Z' } }
        : { ok: true, found: null }
    ),
    instituteSentence: (a) => (a && !a.ok ? a.message || 'no' : ''),
    ...over,
  };
  return s;
}

let container, root;
beforeEach(() => {
  window.localStorage.clear();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  window.localStorage.clear();
});
const mount = (props = {}) => act(() => root.render(createElement(ChurchInstitute, { church: COLG_DEFAULT_CHURCH, ...props })));
const q = (id) => container.querySelector(`[data-testid="${id}"]`);
const click = (el) => act(() => el.dispatchEvent(new MouseEvent('click', { bubbles: true })));
const activeTab = () => [...container.querySelectorAll('[role="tab"]')].find((t) => t.getAttribute('aria-selected') === 'true');

const mem = () => {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)) };
};

describe('the studio flag', () => {
  it('is off by default, on for the owner device, and a URL opt-in/out is remembered', () => {
    expect(isInstituteStudioOn({ search: '', storage: mem() })).toBe(false);
    expect(isInstituteStudioOn({ search: '', storage: mem(), defaultOn: true })).toBe(true);
    const s = mem();
    expect(isInstituteStudioOn({ search: '?instituteStudio=0', storage: s, defaultOn: true })).toBe(false);
    expect(isInstituteStudioOn({ search: '', storage: s, defaultOn: true })).toBe(false);
    expect(isInstituteStudioOn({ search: '?instituteStudio=1', storage: s })).toBe(true);
    expect(s.getItem(INSTITUTE_STUDIO_FLAG_KEY)).toBe('1');
  });
  it('a public (non-owner) visitor still gets the classic Institute, unchanged', () => {
    mount();
    expect(q('institute-studio')).toBeNull();
    expect(container.textContent).toContain('About the Institute');
  });
});

describe("the dashboard numbers are the student's own rows", () => {
  const mine = [
    {
      id: 'a',
      status: 'accepted',
      course_keys: ['church-offices', 'handed-forward'],
      program_key: 'ministry-leadership',
      program_title: 'Ministry Leadership',
    },
    { id: 'b', status: 'completed', course_keys: ['little-learners'], program_key: 'christian-education', program_title: 'Christian Education' },
    { id: 'c', status: 'withdrawn', course_keys: ['who-he-is'] },
  ];
  const standing = { a: { complete: false, coursesMissing: ['church-offices'] }, b: { complete: true, coursesMissing: [] } };
  it('counts enrolled (not withdrawn), completed, certificates, and progress = required passed / required', () => {
    expect(studentStats({ mine, standing, creds: [{ id: 1 }] })).toEqual({ enrolled: 2, completed: 1, certificates: 1, progress: 67, required: 3, passed: 2 });
  });
  it('no enrollment or no server read → progress is null, never a painted number', () => {
    expect(studentStats({}).progress).toBeNull();
    expect(studentStats({ mine, standing: {} }).progress).toBeNull();
  });
  it('Next Up is the required course the student still has to pass, else the first unstarted course', () => {
    expect(nextUpCourse({ mine, standing }).courseKey).toBe('church-offices');
    const n = nextUpCourse({ startedKeys: new Set(['who-he-is']) });
    expect(n.courseKey).toBe('made-in-time');
    expect(n.why).toBe('start');
  });
  it('Continue keeps only Institute courses, newest first, with the reached share', () => {
    const places = [
      { courseKey: 'stocks', lessonId: 'x1', at: 3 },
      { courseKey: 'living-lessons', lessonId: 'll1', at: 2 },
    ];
    const out = continueItems(places, { reached: () => 0.75, lookup: () => ({ title: 'T' }) });
    expect(out.map((g) => [g.lessonId, g.percent, g.title])).toEqual([['ll1', 75, 'T']]);
    expect(instituteCourseKeys().has('stocks')).toBe(false);
  });
  it('a first name only when a real name is known', () => {
    expect(firstName('Christina Poe')).toBe('Christina');
    expect(firstName('someone@example.com')).toBeNull();
    expect(firstName('')).toBeNull();
  });
});

describe('the studio on the owner device', () => {
  it("shows BG's original photo, his official title and the motto, and the honest empty states", () => {
    mount({ studioDefaultOn: true });
    expect(q('institute-studio')).toBeTruthy();
    const img = q('institute-studio-leader').querySelector('img');
    expect(img.getAttribute('src')).toMatch(/lovecorner\/bishop-lloyd-e-gwin-800\.jpg$/);
    const leader = q('institute-studio-leader').textContent;
    expect(leader).toContain('Senior Bishop Lloyd E. Gwin');
    expect(leader).toContain('Founder & Chancellor');
    expect(leader).toContain('TLC Theological Institute');
    expect(q('institute-studio-motto').textContent).toBe(INSTITUTE_META.tagline);
    expect(q('institute-studio-hello').textContent).toBe('Welcome');
    expect(q('institute-studio-progress').textContent).toContain('Sign in to see it');
    expect(q('institute-studio-continue-empty')).toBeTruthy();
    // the disclosure still renders, in the About tab beneath
    expect(container.textContent).toContain('does not claim accreditation');
    expect(container.textContent).not.toMatch(/\baccredited\b/i);
  });
  it('program cards carry the real registered course counts and open the filtered catalog', () => {
    mount({ studioDefaultOn: true });
    const n = q('institute-studio-program-count-ministry-leadership').textContent;
    const classic = q('institute-program-count-ministry-leadership').textContent;
    expect(classic).toContain(n.split(' ')[0]);
    click(q('institute-studio-program-ministry-leadership'));
    expect(activeTab().textContent.trim()).toBe('Courses');
    expect(q('institute-course-filter-ministry-leadership').getAttribute('aria-pressed')).toBe('true');
  });
  it('every tile opens its existing section; Resources exists only in the studio', () => {
    mount({ studioDefaultOn: true });
    const want = {
      courses: 'Courses',
      enrollment: 'Enrollment',
      certificates: 'Certificates',
      students: 'Students',
      announcements: 'Announcements',
      resources: 'Resources',
    };
    for (const [id, label] of Object.entries(want)) {
      click(q(`institute-studio-tile-${id}`));
      expect(activeTab().textContent.trim()).toBe(label);
    }
    expect(q('institute-resources')).toBeTruthy();
  });
  it('a signed-in student sees their own counts, progress and Next Up from the seam', async () => {
    const sync = fakeSync();
    sync.state.mine = [
      {
        id: E,
        program_key: 'ministry-leadership',
        program_title: 'Ministry Leadership',
        course_keys: ['church-offices', 'handed-forward'],
        status: 'accepted',
        user_id: U,
      },
    ];
    sync.state.creds = [];
    mount({ studioDefaultOn: true, instanceId: I, myUserId: U, studentName: 'Christina', sync });
    await flush();
    expect(q('institute-studio-hello').textContent).toBe('Welcome back, Christina');
    expect(q('institute-studio-stat-enrolled').textContent).toContain('1');
    expect(q('institute-studio-stat-completed').textContent).toContain('0');
    expect(q('institute-studio-stat-certificates').textContent).toContain('0');
    expect(q('institute-studio-progress').querySelector('[role="progressbar"]').getAttribute('aria-valuenow')).toBe('50');
    expect(q('institute-studio-next').textContent).toContain('Required for Ministry Leadership');
  });
  it("Continue Learning reads the device's saved place in an Institute course", () => {
    recordPlace({ courseKey: 'living-lessons', lessonId: 'll1-the-perfect-yahweh-expects', stage: 1, step: 1 });
    mount({ studioDefaultOn: true });
    expect(q('institute-studio-continue-empty')).toBeNull();
    expect(q('institute-studio-continue-ll1-the-perfect-yahweh-expects')).toBeTruthy();
  });
  // Darrell 2026-11-25: "No need to go back to the other view... why is that an option?"
  it('offers no way back to the classic view on the page; only the ?instituteStudio=0 address switch turns it off', () => {
    mount({ studioDefaultOn: true });
    expect(q('institute-studio-leave')).toBeNull();
    expect(container.textContent).not.toMatch(/classic Institute/i);
    expect(isInstituteStudioOn({ search: '?instituteStudio=0', storage: mem(), defaultOn: true })).toBe(false);
  });
});

describe('program courses as photographic cards (Darrell 2026-11-25: "vibrant, not a bunch of links")', () => {
  it('courseCovers takes one image per course; review art only in preview, never a title', () => {
    const records = [
      {
        courseKey: 'who-he-is',
        status: 'review',
        displayTitle: 'X',
        image: { src: 'learn-thumbs/a/w1280.webp', srcSet: { webp: 'learn-thumbs/a/w640.webp 640w' } },
      },
      { courseKey: 'who-he-is', status: 'review', image: { src: 'learn-thumbs/b/w1280.webp' } },
      { courseKey: 'made-in-time', status: 'published', image: { src: 'learn-thumbs/c/w1280.webp' } },
      { courseKey: 'living-lessons', status: 'review' },
    ];
    const preview = courseCovers(records, { preview: true });
    expect(preview.get('who-he-is')).toEqual({ src: 'learn-thumbs/a/w1280.webp', srcSet: 'learn-thumbs/a/w640.webp 640w' });
    expect(preview.has('living-lessons')).toBe(false);
    expect([...courseCovers(records).keys()]).toEqual(['made-in-time']);
  });
  it('in the studio a program drop-down shows cards, each opening its course, Required first-class', () => {
    mount({ studioDefaultOn: true });
    expect(q('institute-program-cards-biblical-studies')).toBeTruthy();
    expect(q('institute-program-courses-biblical-studies')).toBeNull();
    const card = q('institute-program-cards-biblical-studies-who-he-is');
    expect(card.getAttribute('href')).toContain('who-he-is');
    expect(card.textContent).toContain('Required for the certificate');
    expect(card.querySelector('img')).toBeTruthy(); // program photograph until the lesson art loads
    expect(q('institute-program-cards-biblical-studies-who-he-is-go').textContent).toBe('Start course →');
  });
  it('a course begun on this device invites Continue, not Start', () => {
    recordPlace({ courseKey: 'who-he-is', lessonId: 'whi1', stage: 1, step: 0 });
    mount({ studioDefaultOn: true });
    expect(q('institute-program-cards-biblical-studies-who-he-is-go').textContent).toBe('Continue →');
  });
  it('the Courses tab shows the same cards in the studio, and the classic list everywhere else', () => {
    mount({ studioDefaultOn: true });
    click(q('institute-studio-tile-courses'));
    expect(q('institute-course-cards-ministry-leadership')).toBeTruthy();
    act(() => root.unmount());
    root = createRoot(container);
    window.localStorage.clear();
    mount();
    const t = [...container.querySelectorAll('[role="tab"]')].find((b) => (b.textContent || '').trim() === 'Courses');
    click(t);
    expect(q('institute-course-cards-ministry-leadership')).toBeNull();
    expect(q('institute-courses-ministry-leadership')).toBeTruthy();
  });
});

// Darrell 2026-11-25, from the live preview: "Buttons don't go anywhere for anything on this screen."
describe('every button on the studio home takes the reader somewhere', () => {
  let scrolled;
  let raf;
  beforeEach(() => {
    scrolled = [];
    raf = window.requestAnimationFrame;
    window.requestAnimationFrame = (fn) => {
      fn();
      return 0;
    };
    Element.prototype.scrollIntoView = function scrollIntoView() {
      scrolled.push(this.getAttribute('data-testid'));
    };
  });
  afterEach(() => {
    window.requestAnimationFrame = raf;
    delete Element.prototype.scrollIntoView;
  });
  it('Explore Programs, Enroll Today and every tile open their section AND scroll the reader to it', () => {
    mount({ studioDefaultOn: true });
    const want = [
      ['institute-studio-explore', 'About'],
      ['institute-studio-enroll', 'Enrollment'],
      ['institute-studio-tile-certificates', 'Certificates'],
      ['institute-studio-tile-resources', 'Resources'],
    ];
    for (const [id, label] of want) {
      scrolled.length = 0;
      click(q(id));
      expect(activeTab().textContent.trim()).toBe(label);
      expect(scrolled).toEqual(['institute-sections']);
    }
  });
  it('the six feature items are buttons: each opens a real section, a filtered catalog, or Learn', () => {
    const setChurchView = vi.fn();
    mount({ studioDefaultOn: true, setChurchView });
    const feats = [...container.querySelectorAll('.is-feats button')];
    expect(feats.length).toBe(6);
    click(q('institute-studio-feat-bookOpen'));
    expect(activeTab().textContent.trim()).toBe('Courses');
    expect(q('institute-course-filter-biblical-studies').getAttribute('aria-pressed')).toBe('true');
    click(q('institute-studio-feat-users'));
    expect(q('institute-course-filter-ministry-leadership').getAttribute('aria-pressed')).toBe('true');
    click(q('institute-studio-feat-sparkle'));
    expect(activeTab().textContent.trim()).toBe('Certificates');
    click(q('institute-studio-feat-monitor'));
    expect(activeTab().textContent.trim()).toBe('Resources');
    click(q('institute-studio-feat-calendar'));
    expect(setChurchView).toHaveBeenLastCalledWith('learn');
  });
  it('the three counters are buttons too: Enrolled, Completed and Certificates open where those live', () => {
    mount({ studioDefaultOn: true });
    click(q('institute-studio-stat-enrolled'));
    expect(activeTab().textContent.trim()).toBe('Enrollment');
    click(q('institute-studio-stat-completed'));
    expect(activeTab().textContent.trim()).toBe('Students');
    click(q('institute-studio-stat-certificates'));
    expect(activeTab().textContent.trim()).toBe('Certificates');
    expect(scrolled.at(-1)).toBe('institute-sections');
  });
});

// Darrell 2026-11-25, with a screenshot of broken pictures on the course cards: "Do we have thumbnails?"
describe('a course card only asks for pictures that are shipped', () => {
  it('drops the listed sizes that have no file (320 and 1920) and keeps 640 and 1280', () => {
    const listed = 'learn-thumbs/a/b/w1920.webp 1920w, learn-thumbs/a/b/w1280.webp 1280w, learn-thumbs/a/b/w640.webp 640w, learn-thumbs/a/b/w320.webp 320w';
    expect(shippedSrcSet(listed)).toBe('learn-thumbs/a/b/w1280.webp 1280w, learn-thumbs/a/b/w640.webp 640w');
    expect(shippedSrcSet('')).toBe('');
    expect(
      courseCovers([{ courseKey: 'k', status: 'review', image: { src: 'learn-thumbs/a/b/w1280.webp', srcSet: { webp: listed } } }], { preview: true }).get('k')
        .srcSet
    ).not.toMatch(/1920|w320/);
  });
  it('every size a REAL record is given is a file that exists in public/learn-thumbs', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const records = (await import('../lib/learn-presentation/presentation-records.json')).default.records;
    const covers = courseCovers(records, { preview: true });
    expect(covers.size).toBeGreaterThan(10);
    const missing = [];
    for (const [key, c] of covers) {
      for (const f of [
        c.src,
        ...c.srcSet
          .split(', ')
          .filter(Boolean)
          .map((x) => x.split(' ')[0]),
      ]) {
        if (!fs.existsSync(path.resolve(__dirname, '../../public', f))) missing.push(`${key}: ${f}`);
      }
    }
    expect(missing).toEqual([]);
  });
  it('a picture that still fails falls back once to the program photograph', () => {
    mount({ studioDefaultOn: true });
    const img = q('institute-program-cards-biblical-studies-who-he-is').querySelector('img');
    act(() => img.dispatchEvent(new Event('error')));
    expect(img.getAttribute('src')).toMatch(/learn-thumbs\/topics\/faith\/w640\.webp$/);
    expect(img.hasAttribute('srcset')).toBe(false);
  });
});

// Darrell 2026-11-25: "Should be open by default... the Program button... looks better."
describe('programs open with their course cards showing', () => {
  it('in the studio every program is open on arrival, and the reader can still fold one away', () => {
    mount({ studioDefaultOn: true });
    for (const key of ['biblical-studies', 'ministry-leadership', 'christian-education']) {
      expect(q(`institute-program-more-${key}`).open).toBe(true);
    }
    const first = q('institute-program-more-biblical-studies');
    first.open = false;
    click(q('institute-studio-tile-certificates'));
    click(q('institute-studio-explore'));
    expect(q('institute-program-more-ministry-leadership').open).toBe(true);
  });
  it('outside the studio the programs stay folded, as before', () => {
    mount();
    expect(q('institute-program-more-biblical-studies').open).toBe(false);
  });
});
