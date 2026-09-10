// TlcPublicDoor render — proves the sendable client door actually mounts a
// working screen: it leads with "Match a Preferred Provider" (Darrell: "the
// first thing we see"), lists the real clinical team + insurance + a Book
// action, and shows NOTHING operator (no inquiry queue, no Intake, no Assistant,
// no nav). Uses the repo's react-dom/client + act convention (no @testing-lib).
import { describe, it, expect, afterEach, vi } from 'vitest';
// The office store reads the network on start; a signed-out door never shows it.
vi.mock('../lib/tlc-assignments.js', async (orig) => ({ ...(await orig()), listMyAssignments: async () => ({ ok: true, rows: [] }), listAssignedToMe: async () => ({ ok: true, rows: [] }) }));
vi.mock('../lib/tlc-office-data.js', async (orig) => ({ ...(await orig()), useTlcOfficeData: () => ({ inquiries: [], practiceLeads: [], loaded: true, signedIn: false }), startTlcOfficeData: async () => ({}) }));
vi.mock('../lib/tlc-roster.js', async (orig) => { const real = await orig(); return { ...real, fetchPublicRoster: async () => [] }; });
import { createElement, act } from 'react';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRoot } from 'react-dom/client';
import TlcPublicDoor from '../components/TlcPublicDoor.jsx';
import { TLC_TEAM, TLC_BRAND } from '../lib/tlc-practice.js';
import { allTracks } from '../lib/tlc-lessons.js';
import { allCourses } from '../lib/tlc-training-library.js';
import { tlcLessonQuery } from '../lib/tlc-lesson-links.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const here = dirname(fileURLToPath(import.meta.url));

let container, root;
async function mount() {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => {
    root = createRoot(container);
    root.render(createElement(TlcPublicDoor));
  });
}
afterEach(() => {
  if (root) act(() => root.unmount());
  if (container) container.remove();
  root = container = null;
});

describe('TlcPublicDoor — the sendable client door', () => {
  it('leads with Match a Preferred Provider + the real clinical team', async () => {
    await mount();
    const text = container.textContent;
    expect(text).toContain('Match a Preferred Provider');
    expect(text).toContain('Christina Poe, LCSW');
    // every clinician on the public roster is rendered
    for (const t of TLC_TEAM) expect(text, `missing ${t.name}`).toContain(t.name);
    // the provider match heading comes BEFORE the services heading (first thing)
    expect(text.indexOf('Match a Preferred Provider')).toBeLessThan(text.indexOf('All Options'));
  });

  it('offers the two real client actions — Book (Acuity) and Learn more', async () => {
    await mount();
    const hrefs = Array.from(container.querySelectorAll('a')).map((a) => a.getAttribute('href'));
    expect(hrefs).toContain(TLC_BRAND.bookingUrl);
    expect(hrefs).toContain(TLC_BRAND.website);
    // all outbound links are new-tab + rel-safe (no in-app operator navigation)
    for (const a of container.querySelectorAll('a')) {
      expect(a.getAttribute('target')).toBe('_blank');
      expect(a.getAttribute('rel') || '').toContain('noopener');
    }
  });

  it('shows insurance accepted', async () => {
    await mount();
    expect(container.textContent).toContain('Insurance Accepted');
    expect(container.textContent).toContain('Blue Cross Blue Shield');
  });

  it('signed-out: client door + a staff LOGIN menu, but no operator data', async () => {
    await mount();
    const text = container.textContent;
    // No operator DATA leaks to a signed-out client (intake queue, dashboards).
    for (const bad of ['Pre-Intake Inquiry', 'Big Picture', 'Dev/Ops', 'Client Growth']) {
      expect(text, `operator surface leaked: "${bad}"`).not.toContain(bad);
    }
    // The sign-in control IS present — for staff AND clients (Darrell 2026-09-10:
    // "A client should be able to create an account"); the entry it opens carries
    // its own create-a-profile switch. The Assistant itself
    // stays gated behind sign-in, so it is NOT rendered for a signed-out client.
    const buttons = Array.from(container.querySelectorAll('button')).map((b) => (b.textContent || '').toLowerCase());
    expect(buttons.some((t) => t.includes('sign in')), 'no sign-in control on the door').toBe(true);
  });

  it('controls its top space like the PoeTech header: a compact bar always, the welcome tucked away by the chevron per device (2026-09-10)', async () => {
    try { localStorage.removeItem('poe-header-collapsed'); } catch { /* no storage */ }
    await mount();
    const header = container.querySelector('header');
    expect(header).toBeTruthy();
    expect(header.className).toContain('ts-safe-sticky');
    // the bar: the brand as the h1, Book, the staff login, the chevron
    expect(header.querySelector('h1').textContent).toBe(TLC_BRAND.name);
    const chevron = header.querySelector('button[aria-label^="Hide the top space"]');
    expect(chevron, 'no hideaway chevron').toBeTruthy();
    expect(chevron.getAttribute('aria-expanded')).toBe('true');
    expect(header.textContent).toContain(TLC_BRAND.tagline);
    expect(header.textContent).toContain(TLC_BRAND.blurb);
    expect(header.querySelector('[aria-label="Comfort controls"]')).toBeTruthy();
    // tuck it away: the welcome, comfort controls and share leave; the bar stays
    await act(async () => { chevron.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    expect(header.textContent).not.toContain(TLC_BRAND.blurb);
    expect(header.querySelector('[aria-label="Comfort controls"]')).toBeNull();
    expect(header.querySelector('h1').textContent).toBe(TLC_BRAND.name);
    const hrefs = Array.from(header.querySelectorAll('a')).map((a) => a.getAttribute('href'));
    expect(hrefs, 'Book left the bar').toContain(TLC_BRAND.bookingUrl);
    const buttons = Array.from(header.querySelectorAll('button')).map((b) => (b.textContent || '').toLowerCase());
    expect(buttons.some((x) => x.includes('sign in')), 'sign in left the bar').toBe(true);
    const shown = header.querySelector('button[aria-label^="Show the full header"]');
    expect(shown.getAttribute('aria-expanded')).toBe('false');
    // the choice persists per device under the SAME key the PoeTech shell uses
    expect(localStorage.getItem('poe-header-collapsed')).toBe('1');
    // and comes back
    await act(async () => { shown.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    expect(header.textContent).toContain(TLC_BRAND.blurb);
    expect(localStorage.getItem('poe-header-collapsed')).toBe('0');
    // the sign-in form is pinned open in the bar even when the top space is tucked away
    const login = Array.from(header.querySelectorAll('button')).find((b) => /^sign in$/i.test(b.textContent.trim()));
    await act(async () => { login.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    await act(async () => { header.querySelector('button[aria-label^="Hide the top space"]').dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    expect(header.textContent).toContain('Clients and staff sign in here');
    try { localStorage.removeItem('poe-header-collapsed'); } catch { /* no storage */ }
  });
});

describe('the reader on every tab of the door (Darrell 2026-09-10, on Team: "we want the reader function to be added")', () => {
  it('one main wraps whatever the door shows, so the read-aloud reads the content and never the bar; the door mounts the single reader and the lessons surface inside it does not mount a second', async () => {
    await mount();
    const mains = container.querySelectorAll('main');
    expect(mains.length).toBe(1);
    expect(mains[0].textContent).toContain('Match a Preferred Provider');
    expect(container.querySelector('header').closest('main')).toBeNull();
    const src = readFileSync(join(here, '../components/TlcPublicDoor.jsx'), 'utf8');
    expect(src).toMatch(/<\/main>\s*\n\s*\{\/\* The single floating read-aloud control for the whole door/);
    expect((src.match(/readAloud=\{false\}/g) || []).length).toBe(2);
    const pl = readFileSync(join(here, '../components/PracticeLearn.jsx'), 'utf8');
    expect(pl).toContain('{readAloud && <TTSControl />}');
  });
});

describe('a client creates an account from the door (Darrell 2026-09-10: "A client should be able to create an account!!!! that\u2019s the point")', () => {
  const setSearch = (search) => window.history.replaceState({}, '', `${window.location.pathname}${search}`);
  afterEach(() => setSearch(''));
  const click = (el) => act(async () => { el.dispatchEvent(new MouseEvent('click', { bubbles: true })); });

  it('the bar\u2019s Sign in opens the TLC-branded entry with its own create-a-profile switch; it is for clients and staff alike', async () => {
    await mount();
    const bar = Array.from(container.querySelectorAll('header button')).find((b) => /Sign in/.test(b.textContent));
    expect(bar.getAttribute('aria-label')).toBe('Sign in or create an account');
    expect(container.textContent).not.toContain('Staff log in');
    await click(bar);
    const header = container.querySelector('header');
    expect(header.textContent).toContain('Clients and staff sign in here');
    expect(header.textContent).toContain('New here? Create a profile');
    expect(header.textContent).toContain('TLC Therapy Solutions');
  });

  it('under a lesson served by link, Create an account opens the same entry straight on sign-up', async () => {
    const track = allTracks().find((t) => t.key === 'client-psychoeducation');
    const m = track.modules[0];
    setSearch(tlcLessonQuery({ courseId: track.key, lessonId: m.id }));
    await mount();
    expect(container.textContent).toContain('An account keeps your place here and brings you the lessons your therapist assigns.');
    const create = Array.from(container.querySelectorAll('button')).find((b) => /^Create an account$/.test(b.textContent.trim()));
    expect(create, 'no Create an account under the lesson').toBeTruthy();
    await click(create);
    const header = container.querySelector('header');
    expect(header.textContent).toContain('Create your account');
    expect(header.textContent).toContain('Clients keep their place in Mental skills');
    expect(header.textContent).toContain('Already have a profile? Sign in');
  });
});

describe('a lesson served by link — taste and see (Darrell 2026-09-10)', () => {
  const setSearch = (search) => window.history.replaceState({}, '', `${window.location.pathname}${search}`);
  afterEach(() => setSearch(''));
  const OPERATOR = ['Hours', 'CE renewal', 'SME review', 'Who is learning', 'For Christina to evaluate', 'Assign to a client', 'Awaiting review', 'Pre-Intake Inquiry', 'Big Picture'];

  it('signed out, a client-track link serves that one lesson, open, above the booking door — and nothing of the office', async () => {
    const track = allTracks().find((t) => t.key === 'client-psychoeducation');
    const m = track.modules[0];
    setSearch(tlcLessonQuery({ courseId: track.key, lessonId: m.id }));
    await mount();
    let text = container.textContent;
    // the link lands on the Learn tab of the visitor's slider (Darrell: "The
    // lessons should be on another tab for those who are not signed in")
    const tabs = Array.from(container.querySelectorAll('[role="tablist"][aria-label="TLC door sections"] [role="tab"]'));
    expect(tabs.map((t) => t.textContent.trim())).toEqual(['Find your therapist', 'Mental skills', 'Join the team']);
    expect(tabs[1].getAttribute('aria-selected')).toBe('true');
    expect(text).toContain('Shared with you');
    expect(text).toMatch(/taste and see/);
    expect(text).toContain(track.title);
    expect(text).toContain(m.title);
    expect(text).toContain(m.bigIdea);
    for (const bad of OPERATOR) expect(text, `leaked to a visitor: "${bad}"`).not.toContain(bad);
    // every lesson can be handed on again
    expect(Array.from(container.querySelectorAll('button')).some((b) => /share this lesson/i.test(b.textContent))).toBe(true);
    // the therapist first (Darrell: "shouldn't over shadow the therapist... good flow"):
    // no Learn banner above a linked lesson, and under it the way to the people and to a booking
    expect(text).not.toContain('A Learn space that builds real skill');
    expect(text).toContain('The next step is a person');
    expect(Array.from(container.querySelectorAll('a')).some((a) => a.getAttribute('href') === TLC_BRAND.bookingUrl && /Book an appointment/.test(a.textContent))).toBe(true);
    const meet = Array.from(container.querySelectorAll('button')).find((b) => /Meet the therapists/.test(b.textContent));
    await act(async () => { meet.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    text = container.textContent;
    expect(text).toContain('Match a Preferred Provider');
    expect(text).not.toContain('Shared with you');
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
  });

  it('signed out, a library-course link serves the course with that lesson open — the internal review stays inside', async () => {
    const course = allCourses().find((c) => c.review);
    const m = course.modules[0];
    setSearch(tlcLessonQuery({ courseId: course.id, lessonId: m.id }));
    await mount();
    const text = container.textContent;
    expect(text).toContain('Shared with you');
    expect(text).toContain(course.title);
    expect(text).toContain(m.bigIdea);
    for (const bad of OPERATOR) expect(text, `leaked to a visitor: "${bad}"`).not.toContain(bad);
  });

  it('a link shared with the Word open serves the lesson with its Word open, verbatim; shared plain, it opens plain', async () => {
    const track = allTracks().find((t) => t.key === 'client-psychoeducation');
    const m = track.modules.find((x) => x.word && x.word.verses && x.word.verses.length) || track.modules[0];
    setSearch(tlcLessonQuery({ courseId: track.key, lessonId: m.id, word: true }));
    await mount();
    await act(async () => { await new Promise((r) => setTimeout(r, 30)); });
    const fold = Array.from(container.querySelectorAll('button')).find((b) => /The Word on this lesson/.test(b.textContent));
    expect(fold, 'the lesson has a Word fold').toBeTruthy();
    expect(fold.getAttribute('aria-expanded')).toBe('true');
    expect(container.textContent).toMatch(/sharper than any two-edged sword/);
    act(() => root.unmount()); container.remove(); root = container = null;
    setSearch(tlcLessonQuery({ courseId: track.key, lessonId: m.id }));
    await mount();
    const fold2 = Array.from(container.querySelectorAll('button')).find((b) => /The Word on this lesson/.test(b.textContent));
    expect(fold2.getAttribute('aria-expanded')).toBe('false');
    expect(container.textContent).not.toMatch(/sharper than any two-edged sword/);
  });

  it('a stale link opens the door normally', async () => {
    setSearch('?tlc=1&course=gone&lesson=gone');
    await mount();
    expect(container.textContent).not.toContain('Shared with you');
    expect(container.textContent).toContain('Match a Preferred Provider');
  });

  it('signed out, the Learn tab serves the client lessons free to read, with none of the office', async () => {
    await mount();
    const learn = Array.from(container.querySelectorAll('[role="tablist"][aria-label="TLC door sections"] [role="tab"]')).find((t) => /^Mental skills$/.test(t.textContent.trim()));
    await act(async () => { learn.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    const text = container.textContent;
    expect(text).toContain('A mental skill building place');
    expect(text).toContain('Understanding is the principal thing');
    expect(text).toContain('Proverbs 4:7');
    expect(text).toContain('Free to read, any hour, with or without the Word');
    expect(text).toContain('Understanding & Coping');
    expect(text).toContain('What to expect & support resources');
    for (const bad of OPERATOR) expect(text, `leaked to a visitor: "${bad}"`).not.toContain(bad);
    expect(container.querySelectorAll('[role="tablist"]').length, 'one slider, no areas strip for a visitor').toBe(1);
    // 24/7 (Darrell: "information about subjects available 24/7"): a subject finder over every client lesson
    expect(text).toContain('Free to read, any hour');
    const finder = container.querySelector('input[aria-label="Find a subject"]');
    await act(async () => {
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(finder, 'anxiety');
      finder.dispatchEvent(new Event('input', { bubbles: true }));
    });
    const after = container.textContent;
    expect(after).toMatch(/\d+ lessons? on “anxiety”/);
    expect(after).toContain('What anxiety is');
    expect(after).not.toContain('Two grounding skills');
  });
});
