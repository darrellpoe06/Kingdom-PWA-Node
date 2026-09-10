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
import { createRoot } from 'react-dom/client';
import TlcPublicDoor from '../components/TlcPublicDoor.jsx';
import { TLC_TEAM, TLC_BRAND } from '../lib/tlc-practice.js';
import { allTracks } from '../lib/tlc-lessons.js';
import { allCourses } from '../lib/tlc-training-library.js';
import { tlcLessonQuery } from '../lib/tlc-lesson-links.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

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
    // The staff-login control IS present — the menu Darrell asked for, so staff
    // can log in from the door (before/without installing). The Assistant itself
    // stays gated behind sign-in, so it is NOT rendered for a signed-out client.
    const buttons = Array.from(container.querySelectorAll('button')).map((b) => (b.textContent || '').toLowerCase());
    expect(buttons.some((t) => t.includes('log in')), 'no staff login control on the door').toBe(true);
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
    expect(buttons.some((x) => x.includes('log in')), 'staff login left the bar').toBe(true);
    const shown = header.querySelector('button[aria-label^="Show the full header"]');
    expect(shown.getAttribute('aria-expanded')).toBe('false');
    // the choice persists per device under the SAME key the PoeTech shell uses
    expect(localStorage.getItem('poe-header-collapsed')).toBe('1');
    // and comes back
    await act(async () => { shown.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    expect(header.textContent).toContain(TLC_BRAND.blurb);
    expect(localStorage.getItem('poe-header-collapsed')).toBe('0');
    // the staff login form is pinned open in the bar even when the top space is tucked away
    const login = Array.from(header.querySelectorAll('button')).find((b) => /staff log in/i.test(b.textContent));
    await act(async () => { login.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    await act(async () => { header.querySelector('button[aria-label^="Hide the top space"]').dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    expect(header.textContent).toContain('TLC staff sign in');
    try { localStorage.removeItem('poe-header-collapsed'); } catch { /* no storage */ }
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
    // the booking door is one tap away, on its own tab
    await act(async () => { tabs[0].dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    text = container.textContent;
    expect(text).toContain('Match a Preferred Provider');
    expect(text).not.toContain('Shared with you');
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
