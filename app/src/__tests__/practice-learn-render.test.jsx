// =============================================================================
// PracticeLearn — live render proof (Verification Doctrine: observe the REAL
// surface). Mounts the actual component in jsdom and reads the DOM, confirming the
// outcomes-led experience, the audience scoping, and the training-hours ledger
// actually render — and that a non-staff viewer never sees staff-gated audiences.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
// The assignment seam (DR-0345): captured, never the network.
const sent = { assigned: [], reviewed: [], removed: [] };
let forMe = [];
let mine = [];
vi.mock('../lib/tlc-assignments.js', async (orig) => {
  const real = await orig();
  return {
    ...real,
    assignLesson: async (args) => { const problems = real.validAssignment(args); if (problems.length) return { ok: false, reason: 'invalid', message: `Still needed: ${problems.join(', ')}.` }; sent.assigned.push(args); return { ok: true, row: { id: 'a1', ...args } }; },
    listMyAssignments: async () => ({ ok: true, rows: mine }),
    listAssignedToMe: async () => ({ ok: true, rows: forMe }),
    markReviewed: async (id, on) => { sent.reviewed.push({ id, on }); return { ok: true }; },
    removeAssignment: async (id) => { sent.removed.push(id); return { ok: true, removed: true }; },
  };
});
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import PracticeLearn from '../components/PracticeLearn.jsx';
import { __setBibleFetcher } from '../lib/bible-kjv.js';
import { __resetShowTheWord } from '../lib/show-the-word.js';
import { FINDING_PEACE_VERSES } from '../lib/tlc-finding-peace.js';

// The Word is read from the app's own corpus on disk (never typed into a lesson).
const here = dirname(fileURLToPath(import.meta.url));
const KJV_DIR = join(here, '../../public/bible');
__setBibleFetcher(async (url) => {
  const rel = String(url).replace(/^.*\/bible\//, '');
  const data = JSON.parse(readFileSync(join(KJV_DIR, rel), 'utf8'));
  // the loader reads chapters as arrays of verse text
  const chapters = data.chapters.map((ch) => (ch.verses ? ch.verses.map((v) => (typeof v === 'string' ? v : v.text)) : ch));
  return { ok: true, json: async () => ({ ...data, chapters }) };
});

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let container, root;

async function mount(props = {}) {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => {
    root = createRoot(container);
    root.render(createElement(PracticeLearn, { email: 'christina@example.com', isStaff: false, ...props }));
  });
}

beforeEach(() => { try { localStorage.clear(); } catch { /* no storage */ } __resetShowTheWord(); sent.assigned.length = 0; sent.reviewed.length = 0; sent.removed.length = 0; forMe = []; mine = []; });
const settle = () => act(async () => { for (let i = 0; i < 8; i += 1) await Promise.resolve(); });
const byText = (re, tag = 'button') => [...container.querySelectorAll(tag)].find((b) => re.test(b.textContent));
const setValue = async (el, value) => { const proto = el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype; await act(async () => { Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value); el.dispatchEvent(new Event('input', { bubbles: true })); }); };
// Training is areas on a second-row chip strip (Darrell 2026-09-10: "training
// tab is too deep... another tab slider for each section"); a reader taps an
// audience, then an area. These walk the surface the way the reader does.
const click = (el) => act(async () => { el.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
async function audience(re) { const b = [...container.querySelectorAll('button')].find((x) => re.test(x.textContent)); expect(b, `audience ${re}`).toBeTruthy(); await click(b); }
function chip(label) { return [...container.querySelectorAll('[role="tablist"][aria-label="Training areas"] [role="tab"]')].find((t) => t.textContent.trim() === label); }
async function area(label) { const t = chip(label); expect(t, `area ${label}`).toBeTruthy(); await click(t); }
const areas = () => [...container.querySelectorAll('[role="tablist"][aria-label="Training areas"] [role="tab"]')].map((t) => t.textContent.trim());
afterEach(() => {
  if (root) act(() => root.unmount());
  if (container) container.remove();
  root = container = null;
});

describe('PracticeLearn — the Practice-scoped Learn space', () => {
  it('leads with the lessons and reading support; every area is one chip away; no moralizing caveats', async () => {
    await mount();
    let text = container.textContent;
    expect(text).toContain('A Learn space that builds real skill');
    expect(text).toContain('Reading support');
    expect(text).toContain('Understanding & Coping'); // client track, the default area
    expect(text).toMatch(/not treatment or diagnosis/i);
    // The areas a signed-in client sees, side by side — nothing staff-only (For you is theirs).
    expect(areas()).toEqual(['Lessons', 'For you', 'What you’ll gain', 'Certificates']);
    expect(container.querySelectorAll('[role="tablist"]').length).toBe(1);
    await area('What you’ll gain');
    text = container.textContent;
    expect(text).toContain('Coping skills');
    expect(text).toContain('Skills you’ll build');
    await area('Certificates');
    expect(container.textContent).toMatch(/No certificate earned on this device yet/);
    // The old moralizing accreditation framing is gone.
    expect(container.textContent).not.toMatch(/NOT YET ACCREDITED/);
    expect(container.textContent).not.toMatch(/bright line/i);
  });

  it('PROVEN-TO-CATCH: a non-staff viewer sees NO clinician/training audience, ledger, or staff panels', async () => {
    await mount({ isStaff: false });
    const buttons = [...container.querySelectorAll('button')].map((b) => b.textContent.trim());
    expect(buttons.some((t) => /Therapists/.test(t))).toBe(false);
    expect(buttons.some((t) => /Training & Hours/.test(t))).toBe(false);
    const text = container.textContent;
    expect(text).not.toContain('Supervised hours ledger');
    expect(text).not.toContain('Certificate catalog');
    expect(text).not.toContain('Required trainings');
    expect(text).not.toContain('CEU renewal tracker');
  });

  it('a staff viewer on Training & Hours sees every area on the strip, and the supervised-hours ledger toward the IL pathway', async () => {
    await mount({ isStaff: true });
    await audience(/Training & Hours/);
    expect(areas()).toEqual(['Lessons', 'What you’ll gain', 'Course library', 'Training map', 'Pathways', 'Certificates', 'Assigned', 'Hours', 'CE renewal', 'Catalog & required']);
    await area('Hours');
    let text = container.textContent;
    expect(text).toContain('Supervised hours ledger');
    expect(text).toMatch(/Illinois supervised clinical experience/);
    // A real "Log hours" control exists.
    expect([...container.querySelectorAll('button')].some((b) => /Log hours/.test(b.textContent))).toBe(true);
    await area('Catalog & required');
    text = container.textContent;
    expect(text).toContain('Certificate catalog');
    expect(text).toContain('Required trainings');
  });

  it('a staff viewer on Training & Hours sees the CEU renewal tracker — distinct from the supervised-hours ledger, driven by the Illinois ruleset', async () => {
    await mount({ isStaff: true });
    await audience(/Training & Hours/);
    // The post-license CE tracker is its own area, separate from the supervised-hours ledger (its own area too).
    expect(areas()).toContain('Hours');
    await area('CE renewal');
    const text = container.textContent;
    expect(text).toContain('CEU renewal tracker');
    expect(text).not.toContain('Supervised hours ledger');
    // Reads the Illinois ruleset: total hours, renewal countdown, mandated topics.
    expect(text).toMatch(/Illinois/);
    expect(text).toContain('of 30');                      // 30 CE hours required
    expect(text).toContain('Days to renew');
    expect(text).toContain('Social Work Practice Ethics'); // a mandated topic
    expect(text).toContain('Cultural Competence');
    // The approved-provider rule is surfaced once, as a neutral data field.
    expect(text).toMatch(/159\.xxxxxx/);
    // SME-confirm honesty is visible (not yet ratified by Christina).
    expect(text).toMatch(/SME/);
    // A real "Log CE activity" control exists.
    expect([...container.querySelectorAll('button')].some((b) => /Log CE activity/.test(b.textContent))).toBe(true);
  });

  it('the CEU tracker honors the first-renewal exemption when renewal # is set to 1st', async () => {
    await mount({ isStaff: true });
    await audience(/Training & Hours/);
    await area('CE renewal');
    // Find the "Renewal #" select and choose 1st (newly licensed).
    const selects = [...container.querySelectorAll('select')];
    const renewalSelect = selects.find((s) => [...s.options].some((o) => /newly licensed/i.test(o.textContent)));
    expect(renewalSelect).toBeTruthy();
    await act(async () => {
      renewalSelect.value = '1';
      renewalSelect.dispatchEvent(new Event('change', { bubbles: true }));
    });
    const text = container.textContent;
    expect(text).toMatch(/No CE required for the first renewal/i);
  });

  it('staff can switch to Therapists and see the clinician track + hours ledger', async () => {
    await mount({ isStaff: true });
    await audience(/Therapists$/);
    expect(container.textContent).toContain('Clinician CE & onboarding');
    await area('Hours');
    expect(container.textContent).toContain('Supervised hours ledger');
  });

  it('staff on Training & Hours sees the built-out course library + the multi-year plan', async () => {
    await mount({ isStaff: true });
    await audience(/Training & Hours/);
    await area('Course library');
    let text = container.textContent;
    // The course library renders, grouped by the clinical fields.
    expect(text).toContain('Course library');
    expect(text).toMatch(/Assessment & diagnosis/);
    expect(text).toMatch(/Crisis & risk/);
    // The Training map lays the courses across the state's own window (Darrell:
    // "laid out over the 24 month period the state expects").
    await area('Training map');
    text = container.textContent;
    expect(text).toContain('Training map');
    expect(text).toMatch(/IL LCSW window · 24 months minimum · 104 weeks/);
    expect(text).toMatch(/Year 1 · Month 1/);
    expect(text).toMatch(/Week 1/);
    expect(text).toMatch(/only hours earned from an IDFPR-approved sponsor count/);
    expect(text).not.toContain('Multi-year training plan');
    expect(text).not.toMatch(/to author next\s*hours/i);
    await area('Course library');
    // Christina's SME gate is present (Agree / Disagree).
    const buttons = [...container.querySelectorAll('button')].map((b) => b.textContent);
    expect(buttons.some((t) => /Agree \(approve\)/.test(t))).toBe(true);
    expect(buttons.some((t) => /Disagree \(send back\)/.test(t))).toBe(true);
  });

  it('PROVEN-TO-CATCH: a non-staff viewer never sees the course library or the SME gate', async () => {
    await mount({ isStaff: false });
    const text = container.textContent;
    expect(text).not.toContain('Course library');
    expect(text).not.toContain('Training map');
    const buttons = [...container.querySelectorAll('button')].map((b) => b.textContent);
    expect(buttons.some((t) => /Agree \(approve\)/.test(t))).toBe(false);
  });

  it('staff see the four-strand spine (Yahweh-centred) and the multi-track / UIUC panel', async () => {
    await mount({ isStaff: true });
    await audience(/Training & Hours/);
    await area('Course library');
    let text = container.textContent;
    // Four-strand spine, with Yahweh's perspective & Will at the centre.
    expect(text).toContain('four-strand spine');
    expect(text).toMatch(/Yahweh’s perspective/);
    // The audiences/tracks panel with grounded hours + SME-confirm honesty — the Pathways area.
    await area('Pathways');
    text = container.textContent;
    expect(text).toContain('Who this serves');
    expect(text).toMatch(/MSW student/);
    expect(text).toMatch(/supervised clinical/i);
    expect(text).toMatch(/SME-confirm pending/);
    // UIUC pipeline + the Christiana connection.
    expect(text).toMatch(/UIUC student pipeline/);
    expect(text).toContain('Christiana Poe');
  });
});

describe('two renderings, the Illinois lesson, and scheduling a lesson (DR-0345)', () => {
  it('a client lesson is plain by default; "Show the Word" opens the verses verbatim from the corpus on one click; the Illinois lesson has no Word button', async () => {
    await mount({ email: 'client@example.com' });
    await settle();
    await click(byText(/Finding Peace · Finding Peace: Psalms, Prayer, and the Pursuit of Serenity/));
    await settle();
    await click(byText(/Next part/));
    await settle();
    let text = container.textContent;
    expect(text).toContain('worry box');
    expect(text).not.toContain(FINDING_PEACE_VERSES['Psalms 46:10']);
    // back to the anchor: the Word drops down INSIDE the lesson, closed by default
    await click(byText(/Previous part/));
    await settle();
    const fold = byText(/The Word on this lesson/);
    expect(fold).toBeTruthy();
    expect(fold.getAttribute('aria-expanded')).toBe('false');
    await click(fold);
    await settle();
    await settle();
    text = container.textContent;
    expect(text).toContain('sharper than any two-edged sword');
    expect(text).toContain(FINDING_PEACE_VERSES['Psalms 46:10']);
    expect(text).toContain(FINDING_PEACE_VERSES['Psalms 55:22']);
    expect(byText(/The Word on this lesson/).getAttribute('aria-expanded')).toBe('true');
    // the page-wide switch opens every fold too (DR-0341): flip it on, then the fold reads open
    await click(fold);
    await settle();
    expect(byText(/The Word on this lesson/).getAttribute('aria-expanded')).toBe('false');
    await click(byText(/^Show the Word — open every verse on this page/));
    await settle();
    expect(byText(/The Word on this lesson/).getAttribute('aria-expanded')).toBe('true');
  });
  it('a library lesson’s Word is the course’s Yahweh strand, verbatim from the corpus; the closing Illinois lesson teaches the state’s rules with its sources and no Word button', async () => {
    await mount({ isStaff: true, email: 'christina@example.com' });
    await audience(/Training & Hours/);
    await area('Course library');
    await click(byText(/Biopsychosocial Assessment — the whole person/));
    await settle();
    await click(byText(/^○?\s*The three domains$|The three domains/));
    await settle();
    // the full lesson: the six parts, paced; the review block for Christina under the course
    let text = container.textContent;
    expect(text).toContain('For Christina to evaluate');
    expect(text).toContain('Known understanding');
    expect(text).toContain('Questions for Christina');
    expect(text).toContain('The TLC workflow, as steps');
    expect(text).toMatch(/Engel, 1977/);
    await click(byText(/The Word on this lesson/));
    await settle();
    await settle();
    text = container.textContent;
    expect(text).toMatch(/Yahweh made and knows the WHOLE person/);
    expect(text).toContain('1 Thessalonians 5:23');
    expect(text).toMatch(/spirit and soul and body be preserved blameless/);
    await click(byText(/Illinois: policy, program and procedure/));
    await settle();
    await click(byText(/Next part/));
    await settle();
    text = container.textContent;
    expect(text).toMatch(/What Illinois requires: Thirty hours of continuing education/);
    expect(text).toMatch(/Mandated reporting of child abuse and neglect/);
    expect(text).toMatch(/Illinois rules as of 2026-09-10/);
    expect(text).toMatch(/68 Ill\. Adm\. Code 1470\.95/);
    // the Illinois lesson is open now and carries no Word drop-down of its own
    expect(byText(/The Word on this lesson/)).toBeUndefined();
  });
  it('a therapist schedules a lesson for a client from the lesson itself; it goes through the seam once, validated on the device', async () => {
    await mount({ isStaff: true, email: 'christina@example.com' });
    await settle();
    expect(areas()).toContain('Assigned');
    await click(byText(/What anxiety is/));
    await settle();
    await click(byText(/^Assign to a client$/));
    await settle();
    const email = container.querySelector('input[type="email"]');
    await setValue(email, 'Client@Example.com');
    await setValue(container.querySelector('input[type="date"]'), '2026-09-17');
    await click(byText(/^Schedule this lesson$/));
    await settle();
    expect(sent.assigned).toHaveLength(1);
    expect(sent.assigned[0]).toMatchObject({ clientEmail: 'Client@Example.com', lesson: { id: 'cl1-what-is-anxiety', title: 'What anxiety is (and what it isn’t)' }, dueOn: '2026-09-17', track: 'client-psychoeducation' });
    expect(container.textContent).toMatch(/Scheduled for client@example.com · due 2026-09-17/);
  });
  it('the client sees it under For you, opens it onto Lessons with that lesson open, and marks it reviewed through the seam', async () => {
    forMe = [{ id: 'a1', lesson_id: 'cl2-grounding-skills', lesson_title: 'Two grounding skills you can use today', client_email: 'client@example.com', therapist_email: 'christina@example.com', due_on: '2026-09-17', note: 'Try the breathing before bed.', status: 'assigned' }];
    await mount({ email: 'client@example.com' });
    await settle();
    expect(areas()).toContain('For you · 1');
    await area('For you · 1');
    let text = container.textContent;
    expect(text).toContain('lessons to review before your next session');
    expect(text).toContain('Two grounding skills you can use today');
    expect(text).toContain('Review by 2026-09-17');
    expect(text).toContain('Try the breathing before bed.');
    await click(byText(/^Open lesson$/));
    await settle();
    expect(chip('Lessons').getAttribute('aria-selected')).toBe('true');
    const open = [...container.querySelectorAll('[aria-expanded="true"]')].map((b) => b.textContent);
    expect(open.some((t) => /Two grounding skills/.test(t))).toBe(true);
    await area('For you · 1');
    await click(byText(/^Mark reviewed$/));
    await settle();
    expect(sent.reviewed).toEqual([{ id: 'a1', on: true }]);
  });
  it('a non-staff reader never sees Assign to a client', async () => {
    await mount({ email: 'client@example.com' });
    await settle();
    await click(byText(/What anxiety is/));
    await settle();
    expect(byText(/Assign to a client/)).toBeUndefined();
    expect(areas()).not.toContain('Assigned');
  });
});

describe('share a lesson outside the app (Darrell 2026-09-10: "a link to serve the lessons like the Love Corner App does")', () => {
  it('every lesson, track and course hands a link to the device’s own share sheet — the link opens exactly that lesson on the TLC door', async () => {
    const shared = [];
    const orig = navigator.share;
    Object.defineProperty(navigator, 'share', { configurable: true, writable: true, value: async (p) => { shared.push(p); } });
    try {
      await mount({ isStaff: true, email: 'christina@example.com' });
      await audience(/Training & Hours/);
      await area('Course library');
      await click(byText(/Biopsychosocial Assessment — the whole person/));
      await settle();
      await click(byText(/Share this course/));
      await settle();
      expect(shared.length).toBe(1);
      expect(shared[0].title).toBe('Biopsychosocial Assessment — the whole person');
      expect(shared[0].url).toMatch(/^https:\/\/poetech\.us\/tlc\/app\/\?tlc=1&course=tl-assessment-and-diagnosis-biopsychosocial-assessment-the-whole-person$/);
      expect(shared[0].text).toContain('3 lessons, free to read');
      expect(shared[0].text).toContain('TLC Therapy Solutions');
      await click(byText(/^○?\s*The three domains$|The three domains/));
      await settle();
      await click(byText(/Share this lesson/));
      await settle();
      expect(shared.length).toBe(2);
      expect(shared[1].title).toBe('The three domains');
      expect(shared[1].url).toContain('&lesson=');
      expect(shared[1].url).toContain('course=tl-assessment-and-diagnosis-biopsychosocial-assessment-the-whole-person');
      expect(shared[1].text).toContain('Biopsychosocial Assessment — the whole person, TLC Therapy Solutions');
      expect(byText(/Shared ✓/)).toBeTruthy();
      // shared plain: no word flag; open the Word, share again: word=1 rides along
      expect(shared[1].url).not.toContain('word=');
      await click(byText(/The Word on this lesson/));
      await settle();
      // the button reads "Shared ✓" for 1.6s after a share; let it settle back
      await act(async () => { await new Promise((r) => setTimeout(r, 1700)); });
      await click(byText(/Share this lesson/));
      await settle();
      expect(shared.length).toBe(3);
      expect(shared[2].url).toMatch(/&word=1$/);
    } finally {
      Object.defineProperty(navigator, 'share', { configurable: true, writable: true, value: orig });
    }
  });
});
