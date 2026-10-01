// @vitest-environment jsdom
// =============================================================================
// Features never vanish by accident (DR-0726)
// =============================================================================
// Darrell 2026-10-01: "Are we making sure we're not losing features
// accidentally?" Measured that day: ~6,000 tests, lint, the guards, the chrome
// layout probe and surface-audit, and not one of them asked whether every
// user-facing control still EXISTS. Seven open PRs were reshaping the same
// reader surfaces; a control could drop when one restructured a panel and
// another merged on top, or when a builder "moved" a control and lost it.
//
// This renders each guarded surface the way the existing render tests do
// (church-learn-render, learn-lesson-space, reader-resume-and-step-picker,
// tts-control-chrome-cap, books-upload-every-tab), walks it through the
// states a person reaches (lesson opened, guide started, panel opened,
// reading, minimized, mini-player), and finds every control registered in
// lib/feature-registry.json. A miss fails with the plain list:
//   "Missing: Give (footer bar), Copy link (lesson header)".
// A feature leaves only by moving its entry to `removed` with a
// removedBecause line and a DR reference.
//
// PROVEN-TO-CATCH: the last describe deletes a real control from a real render
// and requires the gate's own walk to name it.
// =============================================================================
import { describe, it, expect, vi, afterEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// jsdom has no speech engine; the reader renders only when supported. The mock
// reports a ready reader with two voices and the NAS voice, so every control
// the panel CAN show is on screen (voice select, Download).
const voice = { isReading: false, isPaused: false };
vi.mock('../lib/use-read-aloud.js', () => ({
  useReadAloud: () => ({
    supported: true, isReading: voice.isReading, isPaused: voice.isPaused, rate: 1,
    read: () => {}, pause: () => {}, resume: () => {}, stop: () => {}, claimAudio: () => {}, setRate: () => {},
    segmentIndex: 0, deviceRead: true, setSkipHandlers: () => {}, cloudProgress: 0,
    usesNasVoice: true, saveForListening: async () => ({}), offline: null,
    catalog: [
      { id: 'sys', label: 'System voice', group: 'Default', usable: true },
      { id: 'dp', label: 'Darrell Poe', group: 'Your voices', usable: true, ai: true },
    ],
    voiceId: 'sys', setVoiceId: () => {}, currentItem: { id: 'sys', ai: false },
  }),
}));

const { default: REGISTRY } = await import('../lib/feature-registry.json');
const { findFeature, findInSource, registryProblems, missingReport } = await import('../lib/feature-presence.js');
const { default: ChurchLearn } = await import('../components/ChurchLearn.jsx');
const { default: TTSControl } = await import('../components/TTSControl.jsx');
const { default: TextSizeControl, TextSizeEscapeHatch } = await import('../components/TextSizeControl.jsx');
const { default: HeaderAuthButton } = await import('../components/HeaderAuthButton.jsx');
const { default: ReadingVoiceControl } = await import('../components/ReadingVoiceControl.jsx');
const { default: HelpButton } = await import('../components/HelpButton.jsx');
const { default: ArrivalsBell } = await import('../components/ArrivalsBell.jsx');
const { default: ContactsImport } = await import('../components/ContactsImport.jsx');
const { FeedbackPromotePanel } = await import('../components/FeedbackCenter.jsx');
const { default: TopNavRow } = await import('../components/TopNavRow.jsx');
const { ChurchGiveHeaderButton } = await import('../components/ChurchGiving.jsx');
const { default: ChromeDock } = await import('../components/ChromeDock.jsx');
const { BooksUploadButton, BooksUploadMount } = await import('../components/BooksUploadButton.jsx');
const { buildCatalogCourseDescriptors } = await import('../lib/learn-catalog.js');
const { _resetScreenAwakeForTests } = await import('../lib/screen-awake.js');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const HERE = dirname(fileURLToPath(import.meta.url));
const SHELL = readFileSync(join(HERE, '..', 'poe-financial-mvp-v28.jsx'), 'utf8');
const DECISIONS = join(HERE, '..', '..', '..', 'docs', 'decisions');

// --- mounting -----------------------------------------------------------------
const mounted = [];
function mount(el) {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  act(() => root.render(el));
  mounted.push({ root, host });
  return { host, root };
}
function unmountAll() {
  while (mounted.length) {
    const { root, host } = mounted.pop();
    try { act(() => root.unmount()); } catch { /* already gone */ }
    host.remove();
  }
  document.body.innerHTML = '';
}
afterEach(() => { unmountAll(); voice.isReading = false; voice.isPaused = false; try { localStorage.clear(); } catch { /* ignore */ } });

const settle = (ms = 30) => act(async () => { await new Promise((r) => setTimeout(r, ms)); });
const click = (el) => act(() => { el.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
const button = (root, re) => [...root.querySelectorAll('button')].find((b) => re.test((b.textContent || '').replace(/\s+/g, ' ').trim()));
function choose(select, value) {
  act(() => {
    Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set.call(select, value);
    select.dispatchEvent(new Event('change', { bubbles: true }));
  });
}

const learnProps = () => ({
  extraCourses: buildCatalogCourseDescriptors(),
  progress: {}, toggleModule: () => {}, quizState: {}, recordQuiz: () => {},
  learnLevel: 'auto', setLearnLevel: () => {}, ageBand: 'adult', setAgeBand: () => {},
});

// The lesson every lesson-level walk opens: a real Living Lessons lesson.
const LESSON_TITLE = /Bodybuilding Christ/;
function openLesson(host) {
  const sel = host.querySelector('#learn-course-pick');
  if (sel && sel.value !== 'living-lessons') choose(sel, 'living-lessons');
  const row = [...host.querySelectorAll('button')].find((b) => LESSON_TITLE.test(b.textContent || '') && /^L\d+ · /.test((b.textContent || '').trim()));
  if (!row) throw new Error('the lesson row to open was not found');
  click(row);
}
async function startGuide(host) {
  const start = button(host, /^Start this lesson/);
  if (!start) throw new Error('"Start this lesson" was not found');
  click(start);
  await settle();
}

// --- the walks: each calls look(root) in every state a person reaches ---------
// `look` records what it finds; a control counts as present if it is found in
// ANY state of its surface (the Pause button exists only while reading).
const WALKS = {
  'learn-lists': async (look) => {
    const { host } = mount(createElement(ChurchLearn, learnProps()));
    look(host);
    choose(host.querySelector('[data-testid="learn-course-sort"]'), 'latest');
    look(host);
  },
  'lesson-header': async (look, { sabotage } = {}) => {
    const { host } = mount(createElement(ChurchLearn, learnProps()));
    openLesson(host);
    if (sabotage) sabotage(host);
    look(host);
  },
  'lesson-reader': async (look) => {
    const { host } = mount(createElement(ChurchLearn, learnProps()));
    openLesson(host);
    await startGuide(host);
    look(host);
  },
  'read-aloud': async (look) => {
    // A real lesson registers the real read target (level row, Download).
    // A Wake Lock, so "Keep screen on" renders (a browser without one gets the
    // plain hint instead); a fresh manager, because an earlier walk built one.
    Object.defineProperty(navigator, 'wakeLock', { value: { request: async () => ({ release: async () => {}, addEventListener() {} }) }, configurable: true });
    _resetScreenAwakeForTests();
    const lesson = mount(createElement(ChurchLearn, learnProps()));
    openLesson(lesson.host);
    await startGuide(lesson.host);
    const panel = mount(createElement(TTSControl, { view: 'church', churchView: 'learn' }));
    const p = panel.host;
    look(p); // closed: the read-aloud button
    click(p.querySelector('button[aria-label$="read-aloud controls"]'));
    await settle();
    look(p); // open, at rest
    const startAt = p.querySelector('[data-testid="reader-start-at-open"]');
    if (startAt) { click(startAt); await settle(400); look(p); }
    // Reading: the panel's Pause / Stop / Smaller.
    voice.isReading = true;
    act(() => panel.root.render(createElement(TTSControl, { view: 'church', churchView: 'learn', key: 'reading' })));
    click(p.querySelector('button[aria-label$="read-aloud controls"]'));
    await settle();
    look(p);
    const smaller = p.querySelector('button[aria-label^="Collapse to the reading pill"]');
    if (smaller) { click(smaller); await settle(); look(p); }
    // The mini-player: reading, panel put away.
    act(() => panel.root.render(createElement(TTSControl, { view: 'church', churchView: 'learn', key: 'mini' })));
    await settle();
    look(p);
  },
  'app-header': async (look) => {
    const { host } = mount(createElement('div', null,
      createElement(ChurchGiveHeaderButton, { church: {}, floaterPresent: true }),
      createElement(HeaderAuthButton),
      createElement(HelpButton, { variant: 'header', view: 'church', churchView: 'learn', booksView: 'accounts', setView: () => {}, setChurchView: () => {}, setBooksView: () => {} }),
      createElement(ArrivalsBell),
      createElement(TextSizeControl, { variant: 'header' }),
      createElement(ReadingVoiceControl, { variant: 'header' }),
      // The header tucked away: the chevron, back / forward, and the way back out of big text.
      createElement(TopNavRow, {
        collapsed: true, onToggleHeader: () => {}, brandName: 'The Love Corner', brandTagline: 'The Church of the Living God',
        hatch: createElement(TextSizeEscapeHatch, { collapsed: true, onShowHeader: () => {} }),
      }, createElement('button', { type: 'button' }, 'Learn')),
    ));
    await settle();
    look(host);
  },
  'app-footer': async (look) => {
    // DR-0716: the floaters became ONE bottom bar (components/ChromeDock.jsx):
    // Feedback, Give (Church only), the network dot, Top, A-/A+, the controls
    // fold and the reader's slot. Give is mounted here as the Church view does.
    // Two states a person reaches: a deep page outside the reader (Feedback,
    // Give, More, Top inline), and inside the reader (the reading-comfort row:
    // the controls fold and A-/A+; comfort-bar.js follows data-lesson-space).
    const root = document.documentElement;
    const scrollWas = Object.getOwnPropertyDescriptor(window, 'scrollY');
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 5000 });
    try {
      const dock = () => createElement(ChromeDock, { onFeedback: () => {}, feedbackOpen: false, church: {}, showGive: true });
      const a = mount(dock());
      await settle();
      look(a.host);
      unmountAll();
      root.setAttribute('data-lesson-space', 'open');
      const b = mount(dock());
      await settle();
      look(b.host);
    } finally {
      root.removeAttribute('data-lesson-space');
      if (scrollWas) Object.defineProperty(window, 'scrollY', scrollWas); else Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 });
    }
  },
  books: async (look) => {
    const { host } = mount(createElement('div', null,
      createElement(BooksUploadButton),
      createElement(BooksUploadMount, { hint: 'transactions', data: { accounts: [], entities: [] }, demo: true }),
    ));
    look(host);
    click(host.querySelector('[data-testid="books-upload-button"]'));
    for (let i = 0; i < 80 && !document.querySelector('[data-testid="books-upload-panel"]'); i++) await settle(25);
    look(document.body);
  },
  messages: async (look) => {
    // A phone that has the Contact Picker, so the pick button renders too; then
    // a real .vcf goes through the file door so the preview's controls exist.
    const nav = { contacts: { select: async () => [], getProperties: async () => ['name', 'tel', 'email'] } };
    const { host } = mount(createElement(ContactsImport, { roster: [], nav }));
    look(host);
    const input = host.querySelector('[data-testid="contacts-upload-vcf"]');
    const file = new File(['BEGIN:VCARD\r\nVERSION:3.0\r\nFN:Sister Ann\r\nTEL;TYPE=CELL:217-555-0101\r\nEND:VCARD\r\n'], 'contacts.vcf', { type: 'text/vcard' });
    Object.defineProperty(input, 'files', { value: [file], configurable: true });
    act(() => { input.dispatchEvent(new Event('change', { bubbles: true })); });
    for (let i = 0; i < 80 && !host.querySelector('[data-testid="contacts-import-preview"]'); i++) await settle(25);
    look(host);
  },
  'feedback-queue': async (look) => {
    // A steward's focused note that carries a picture (DR-0742).
    const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
    const feedback = [{ id: 'fq1', createdAt: '2026-10-01T05:00:00Z', whatsNot: 'the give button is under the bar', area: 'church', screenshots: [png] }];
    const { host } = mount(createElement(FeedbackPromotePanel, { feedback, addProject() {}, addIncident() {}, deleteFeedback() {} }));
    await settle();
    look(host);
  },
};

/** Walk one surface; return the registered features that were never found. */
async function missingOn(surface, features, opts) {
  const want = features.filter((f) => f.surface === surface);
  const found = new Set();
  const look = (root) => {
    for (const f of want) {
      if (found.has(f.id)) continue;
      const hit = f.find.source ? findInSource(SHELL, f.find) : findFeature(root, f.find);
      if (hit) found.add(f.id);
    }
  };
  await WALKS[surface](look, opts);
  unmountAll();
  return want.filter((f) => !found.has(f.id));
}

// --- the gate -------------------------------------------------------------------
describe('the feature registry is sound', () => {
  it('every entry has an id, a plain name, a known surface and one way to find it', () => {
    expect(registryProblems(REGISTRY)).toEqual([]);
  });

  it('every surface in the registry has a walk, and every walk has entries', () => {
    for (const s of Object.keys(REGISTRY.surfaces)) expect(WALKS[s], `no walk renders surface "${s}"`).toBeTypeOf('function');
    for (const s of Object.keys(WALKS)) expect(REGISTRY.features.some((f) => f.surface === s), `walk "${s}" guards nothing`).toBe(true);
  });

  it('a removed feature names a Decision Record that exists', () => {
    const files = readdirSync(DECISIONS);
    for (const f of REGISTRY.removed) {
      expect(files.some((n) => n.startsWith(`${f.dr}-`)), `${f.id}: ${f.dr} has no file in docs/decisions`).toBe(true);
    }
  });

  it('the decision behind this gate is on file', () => {
    expect(existsSync(DECISIONS)).toBe(true);
    expect(readdirSync(DECISIONS).some((n) => n.startsWith('DR-0726-'))).toBe(true);
  });
});

describe('every registered feature is still on its surface', () => {
  for (const [surface, meta] of Object.entries(REGISTRY.surfaces)) {
    it(`${meta.name}: nothing registered has vanished`, async () => {
      const missing = await missingOn(surface, REGISTRY.features);
      expect(missingReport(missing, REGISTRY.surfaces)).toBe('');
    }, 60000);
  }
});

describe('PROVEN-TO-CATCH: a control deleted from a real render is named', () => {
  it('removing Copy link from the lesson header fails with its plain name', async () => {
    const missing = await missingOn('lesson-header', REGISTRY.features, {
      sabotage: (host) => {
        // Every instance: a feature is present while any copy of it is.
        const all = [...host.querySelectorAll('button')].filter((b) => (b.textContent || '').trim() === 'Copy link');
        expect(all.length, 'the control to delete must exist first').toBeGreaterThan(0);
        for (const el of all) el.remove();
      },
    });
    expect(missingReport(missing, REGISTRY.surfaces)).toBe('Missing: Copy link (lesson header)');
  }, 60000);

  it('the report lists several misses across surfaces in plain words', () => {
    const fake = [
      { id: 'a', name: 'Give', surface: 'app-footer' },
      { id: 'b', name: 'Copy link', surface: 'lesson-header' },
    ];
    expect(missingReport(fake, REGISTRY.surfaces)).toBe('Missing: Give (footer bar), Copy link (lesson header)');
  });

  it('a removal without removedBecause and a DR is refused', () => {
    const live = REGISTRY.features[0];
    const bad = { ...REGISTRY, features: REGISTRY.features.slice(1), removed: [{ ...live }] };
    const problems = registryProblems(bad);
    expect(problems).toContain(`${live.id} was removed without a removedBecause line.`);
    expect(problems).toContain(`${live.id} was removed without a DR reference (dr: "DR-####").`);
    const ok = { ...REGISTRY, features: REGISTRY.features.slice(1), removed: [{ ...live, removedBecause: 'Replaced by X.', dr: 'DR-0726' }] };
    expect(registryProblems(ok)).toEqual([]);
  });

  it('a source pin that no longer matches the shell is reported', () => {
    expect(findInSource(SHELL, { source: '<ChromeDock ' })).toBe(true);
    expect(findInSource(SHELL.replace('<ChromeDock ', ''), { source: '<ChromeDock ' })).toBe(false);
  });
});
