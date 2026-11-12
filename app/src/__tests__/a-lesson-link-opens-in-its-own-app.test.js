// @vitest-environment jsdom
// =============================================================================
// a-lesson-link-opens-in-its-own-app — the lesson chooses the door (DR-1428)
// =============================================================================
// Darrell 2026-11-11, holding a shared L301 link that said "The Love Corner"
// and opened /poetech-app/: "Why do links to lessons go to PoeTech and not
// Love Corner?", then: "Or does it depend on what the lesson is about?...
// spiritual lessons for Love Corner you need PoeTech for Business... Ai...
// other etc... still Word first."
//
// The link used to take the SHARER's page path, so one lesson opened in either
// app depending on who sent it. Now the course's department picks the app, the
// share message names that same app, and a signed-out visitor still opens it.
// =============================================================================
import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { LEARN_CATALOG } from '../lib/learn-catalog.js';
import { courseDepartment } from '../lib/learn-organize.js';
import { LOVE_CORNER_DEPARTMENTS, LESSON_DOORS, lessonDoorFor, lessonUrl, lessonSharePayload } from '../lib/lesson-links.js';
import { isPublicChurchRoute, wearsChurchBrand } from '../lib/access-gate.js';
import { isPoeTechLessonLink } from '../lib/learn-catalog.js';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import PoeTechShowcase, { showcaseHref } from '../components/PoeTechShowcase.jsx';
import { DOORS } from '../lib/app-doors.js';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';
import { SPIRITUAL_DEPARTMENTS, lessonAccess } from '../lib/learn-access-tiers.js';

const ORIGIN = 'https://poetech.us';
const SRC = join(process.cwd(), 'src');
const courses = LEARN_CATALOG.map((c) => ({ key: c.key || c.meta?.key, meta: c.meta }));
const byKey = (k) => courses.find((c) => c.key === k);
const L301 = LIVING_LESSONS_MODULES.find((m) => m.id === 'll301-old-men-dream-young-men-see');

afterEach(() => window.history.replaceState(null, '', '/'));

describe('the department chooses the app', () => {
  it('the spiritual and church-serving departments open in the Love Corner; business, A.I. and the rest open in PoeTech', () => {
    const lc = courses.filter((c) => lessonDoorFor(c).key === 'lovecorner').map((c) => courseDepartment(c));
    const pt = courses.filter((c) => lessonDoorFor(c).key === 'poetech').map((c) => courseDepartment(c));
    for (const d of ['Living Lessons', 'The Word & The Way', 'Kingdom Life & Stewardship', 'Serve the House']) expect(lc, d).toContain(d);
    for (const d of ['A.I. The Way', 'Business', 'Real Estate', 'Stock Market', 'Project Management', 'Development', 'Mathematics', 'History']) {
      expect(pt, d).toContain(d);
      expect(lc, d).not.toContain(d);
    }
    expect(lc.length + pt.length).toBe(courses.length);
  });

  it('every Love Corner department names a real department, so a renamed one cannot silently fall to PoeTech', () => {
    const live = new Set(courses.map((c) => courseDepartment(c)));
    live.add('The Eternal Algorithms'); // the deep-processing study mounts outside LEARN_CATALOG
    for (const d of LOVE_CORNER_DEPARTMENTS) expect(live.has(d), d).toBe(true);
  });

  it('the Love Corner departments are exactly the spiritual departments the access rule frees (DR-1428)', () => {
    expect([...LOVE_CORNER_DEPARTMENTS].sort()).toEqual([...SPIRITUAL_DEPARTMENTS].sort());
  });

  it('both doors are real, registered doors, and the Love Corner page exists', () => {
    const paths = DOORS.map((d) => d.path);
    expect(paths).toContain(LESSON_DOORS.lovecorner.path);
    expect(paths).toContain(LESSON_DOORS.poetech.path);
    expect(existsSync(join(process.cwd(), 'lovecorner', 'app', 'index.html'))).toBe(true);
  });
});

describe('the link is the lesson’s, never the sharer’s page', () => {
  it('L301, shared from inside PoeTech, opens in the Love Corner', () => {
    expect(L301).toBeTruthy();
    window.history.replaceState(null, '', '/poetech-app/?view=church&sub=learn');
    const url = lessonUrl({ courseKey: 'living-lessons', lessonId: L301.id, course: byKey('living-lessons'), origin: ORIGIN });
    expect(url).toBe(`${ORIGIN}/lovecorner/app/?view=church&sub=learn&course=living-lessons&lesson=${L301.id}`);
  });

  it('a Business lesson, shared from inside the Love Corner, opens in PoeTech', () => {
    window.history.replaceState(null, '', '/lovecorner/app/?view=church&sub=learn');
    const url = lessonUrl({ courseKey: 'rent-to-own-business', lessonId: 'x', course: byKey('rent-to-own-business'), origin: ORIGIN });
    expect(url.startsWith(`${ORIGIN}/poetech-app/?`)).toBe(true);
  });

  it('PROVEN TO CATCH: without the course, the link falls back to the sharer’s page, which is the bug Darrell held', () => {
    window.history.replaceState(null, '', '/poetech-app/?view=church&sub=learn');
    const url = lessonUrl({ courseKey: 'living-lessons', lessonId: L301.id, origin: ORIGIN });
    expect(url.startsWith(`${ORIGIN}/poetech-app/?`)).toBe(true);
  });

  it('a signed-out visitor opens it on either door: the public rule reads the query, not the path', () => {
    for (const course of [byKey('living-lessons'), byKey('rent-to-own-business')]) {
      const url = new URL(lessonUrl({ courseKey: course.key, lessonId: 'x', course, origin: ORIGIN }));
      expect(isPublicChurchRoute(url.search), course.key).toBe(true);
    }
  });
});

describe('the message names the app the link opens', () => {
  it('a Love Corner lesson says The Love Corner, a PoeTech lesson says PoeTech, and every lesson is still free to read', () => {
    const lc = byKey('living-lessons');
    const pt = byKey('rent-to-own-business');
    const a = lessonSharePayload(L301, {
      url: lessonUrl({ courseKey: lc.key, lessonId: L301.id, course: lc, origin: ORIGIN }),
      courseTitle: 'Living Lessons from the Word',
      brand: lessonDoorFor(lc).brand,
    });
    const b = lessonSharePayload(
      { title: 'A business lesson', bigIdea: 'Work as unto the Lord.' },
      { url: lessonUrl({ courseKey: pt.key, lessonId: 'x', course: pt, origin: ORIGIN }), courseTitle: 'Business', brand: lessonDoorFor(pt).brand }
    );
    expect(a.text).toMatch(/Living Lessons from the Word · The Love Corner/);
    expect(a.text).toMatch(/\/lovecorner\/app\/\?/);
    expect(b.text).toMatch(/Business · PoeTech/);
    expect(b.text).toMatch(/\/poetech-app\/\?/);
    for (const t of [a.text, b.text]) expect(t).toMatch(/open the link, no account needed/);
  });
});

describe('the surfaces that build lesson links pass the lesson’s door', () => {
  it('ChurchLearn hands every lesson and course link its course, and names the door in the share', () => {
    const src = readFileSync(join(SRC, 'components', 'ChurchLearn.jsx'), 'utf8');
    const calls = src.match(/lessonUrl\(\{[^}]*\}\)/g) || [];
    expect(calls.length).toBeGreaterThanOrEqual(6);
    expect(calls.filter((c) => !/\bcourse\b/.test(c.replace(/courseKey/g, '')))).toEqual([]);
    expect(src).toMatch(/brand: lessonDoorFor\(course\)\.brand/);
  });

  it('the Healthy Living witnesses, a Word & The Way course, open in the Love Corner', () => {
    expect(courseDepartment(byKey('healthy-living'))).toBe('The Word & The Way');
    const src = readFileSync(join(SRC, 'components', 'EternalAlgorithmsStudy.jsx'), 'utf8');
    // the calls carry a template literal (`hl-${src.id}`), so count lines, not brace pairs
    const calls = src.split('\n').filter((l) => l.includes('lessonUrl({ courseKey: HEALTHY_LIVING_META.key'));
    expect(calls.length).toBe(3);
    for (const c of calls) expect(c).toMatch(/path: LESSON_DOORS\.lovecorner\.path/);
  });
});

describe('a signed-out visitor sees the app the lesson belongs to (DR-1428)', () => {
  it('a PoeTech-subject link is known as one; a spiritual, unknown or course-less link stays the church’s', () => {
    expect(isPoeTechLessonLink('?view=church&sub=learn&course=rent-to-own-business&lesson=x')).toBe(true);
    expect(isPoeTechLessonLink('?view=church&sub=learn&course=living-lessons&lesson=ll301-old-men-dream-young-men-see')).toBe(false);
    expect(isPoeTechLessonLink('?view=church&sub=learn&course=no-such-course')).toBe(false);
    expect(isPoeTechLessonLink('?view=church&sub=learn')).toBe(false);
  });

  it('PROVEN TO CATCH: the open church link alone would dress a business lesson as the Love Corner; the PoeTech check takes it off', () => {
    const search = '?view=church&sub=learn&course=rent-to-own-business&lesson=x';
    const route = isPublicChurchRoute(search);
    expect(wearsChurchBrand({ signedIn: false, route })).toBe(true);
    expect(wearsChurchBrand({ signedIn: false, route: route && !isPoeTechLessonLink(search) })).toBe(false);
  });

  it('the shell captures it once at boot and uses it for the brand and both welcome cards, never for the open door', () => {
    const shell = readFileSync(join(SRC, 'poe-financial-mvp-v28.jsx'), 'utf8');
    expect(shell).toMatch(/const \[churchBrandRoute, poetechLessonLink\] = useState\(\(\) => \[isPublicChurchRoute\(\), isPoeTechLessonLink\(\)\]\)\[0\];/);
    expect(shell).toMatch(/route: churchBrandRoute && !poetechLessonLink \}\)/);
    expect((shell.match(/churchBrandRoute && !poetechLessonLink && <PublicWelcome/g) || []).length).toBe(2);
    expect(shell).toMatch(/isChurchLinkVisit\(\{ route: churchBrandRoute, view \}\)/);
  });
});

describe('inside the Love Corner, a PoeTech subject points home (DR-1428)', () => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const biz = () => byKey('rent-to-own-business');
  const ll = () => byKey('living-lessons');

  it('the card appears only in the Love Corner app and only on a PoeTech subject, linking the same course in PoeTech', () => {
    const lc = { pathname: '/lovecorner/app/', search: '', origin: ORIGIN };
    expect(showcaseHref(biz(), lc)).toBe(`${ORIGIN}/poetech-app/?view=church&sub=learn&course=rent-to-own-business`);
    expect(showcaseHref(ll(), lc)).toBeNull();
    expect(showcaseHref(biz(), { pathname: '/poetech-app/', search: '', origin: ORIGIN })).toBeNull();
  });

  it('renders on the Love Corner path, says what is true today, and never claims a lock', () => {
    window.history.replaceState(null, '', '/lovecorner/app/?view=church&sub=learn');
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    act(() => root.render(createElement(PoeTechShowcase, { course: biz() })));
    const card = host.querySelector('[data-testid="poetech-showcase"]');
    expect(card).toBeTruthy();
    expect(card.textContent).toMatch(/here in both apps, the Love Corner and PoeTech/);
    expect(card.textContent).toMatch(/child level of every lesson and the whole first lesson are free to everyone/);
    expect(card.textContent).toMatch(/in whichever app you read/);
    expect(card.textContent).not.toMatch(/lives in the PoeTech app/);
    expect(card.textContent).toMatch(/PoeTech\+ \(\$39\/mo\)/);
    expect(card.textContent).not.toMatch(/locked|unlock|paywall/i);
    expect(host.querySelector('[data-testid="poetech-showcase-link"]').getAttribute('href')).toMatch(
      /\/poetech-app\/\?view=church&sub=learn&course=rent-to-own-business$/
    );
    act(() => root.render(createElement(PoeTechShowcase, { course: ll() })));
    expect(host.querySelector('[data-testid="poetech-showcase"]')).toBeNull();
    act(() => root.unmount());
    host.remove();
  });

  it('DR-1432: in PoeTech the same card carries the way to PoeTech+, without the link to itself', () => {
    window.history.replaceState(null, '', '/poetech-app/?view=church&sub=learn');
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    act(() => root.render(createElement(PoeTechShowcase, { course: biz() })));
    const card = host.querySelector('[data-testid="poetech-showcase"]');
    expect(card).toBeTruthy();
    expect(card.textContent).toMatch(/whole first lesson of this course are free to everyone/);
    expect(card.textContent).toMatch(/PoeTech\+ \(\$39\/mo\)/);
    expect(host.querySelector('[data-testid="poetech-showcase-link"]')).toBeNull();
    act(() => root.render(createElement(PoeTechShowcase, { course: ll() })));
    expect(host.querySelector('[data-testid="poetech-showcase"]')).toBeNull();
    act(() => root.unmount());
    host.remove();
  });

  it('ChurchLearn renders it under the course header', () => {
    const src = readFileSync(join(SRC, 'components', 'ChurchLearn.jsx'), 'utf8');
    expect(src).toMatch(/<PoeTechShowcase course=\{active\} \/>/);
  });
});

// DR-1430 (Darrell 2026-11-12): "I want the ability to get lessons to be in
// both still... access is what is paid for... for certain lessons."
describe('every lesson is in both apps; access, not the app, is what is paid for (DR-1430)', () => {
  it('the Learn catalog is never filtered by app: ChurchLearn reads no door, and only the showcase card does', () => {
    const src = readFileSync(join(SRC, 'components', 'ChurchLearn.jsx'), 'utf8');
    expect(src).not.toMatch(/currentDoor|from '\.\.\/lib\/app-doors\.js'|churchDoorOnly/);
  });

  it('access is decided by the lesson and the level, the same in either app', () => {
    const d = courseDepartment(byKey('rent-to-own-business'));
    const at = (path) => {
      window.history.replaceState(null, '', path);
      return ['child', 'teen'].map((band) => lessonAccess({ department: d, band, lessonIndex: 3 }).free);
    };
    expect(at('/lovecorner/app/?view=church&sub=learn')).toEqual(at('/poetech-app/?view=church&sub=learn'));
    expect(lessonAccess.length).toBeLessThanOrEqual(1); // one object argument, and no app in it
  });
});
