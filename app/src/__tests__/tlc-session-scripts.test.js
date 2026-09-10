// @vitest-environment node
// =============================================================================
// Christina's session scripts in the TLC training library (DR-0344): six
// courses, her structure, four strands each, every verse verbatim against the
// app's own KJV corpus, and the handbook carried as data. DR-0076 §3.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { SESSION_SCRIPT_COURSES, SCRIPT_VERSES, SESSION_SCRIPTS_SOURCE } from '../lib/tlc-session-scripts.js';
import { allCourses, getCourse, TRAINING_FIELDS } from '../lib/tlc-training-library.js';
import { hasFourStrands, courseStrands } from '../lib/tlc-course-strands.js';
import { TLC_HANDBOOK, TLC_OFFICE_DOCUMENTS } from '../lib/tlc-handbook.js';

const here = dirname(fileURLToPath(import.meta.url));
const KJV = join(here, '../../public/bible/kjv');
const BOOK_FILE = { Mark: 'Mark', Proverbs: 'Proverbs', Ephesians: 'Ephesians', Colossians: 'Colossians', Psalms: 'Psalms', Galatians: 'Galatians', Jeremiah: 'Jeremiah' };
function corpusVerse(ref) {
  const m = ref.match(/^(\d?\s?[A-Za-z]+)\s+(\d+):(\d+)$/);
  const book = BOOK_FILE[m[1]];
  const data = JSON.parse(readFileSync(join(KJV, `${book}.json`), 'utf8'));
  const chapter = data.chapters[Number(m[2]) - 1];
  const verses = chapter.verses || chapter;
  const v = verses[Number(m[3]) - 1];
  return typeof v === 'string' ? v : v.text;
}

describe('the six session scripts are in the library, in her structure', () => {
  it('six courses, each from the Drive training notes, each in a real field', () => {
    expect(SESSION_SCRIPT_COURSES).toHaveLength(6);
    for (const c of SESSION_SCRIPT_COURSES) {
      expect(TRAINING_FIELDS).toContain(c.field);
      expect(c.origin).toBe('tlc-authored');
      expect(c.source.teacher).toBe('Christina Poe, LCSW');
      expect(c.source.url).toBe(SESSION_SCRIPTS_SOURCE.url);
      expect(c.modules.length).toBeGreaterThanOrEqual(3);
      expect(c.preTest.questions.length).toBeGreaterThan(0);
      expect(c.postTest.questions.length).toBeGreaterThanOrEqual(3);
    }
  });
  it('every one is registered in the library, validated:false like every course (Christina ratifies in-app)', () => {
    for (const c of SESSION_SCRIPT_COURSES) {
      const lib = getCourse(c.id);
      expect(lib, `${c.id} not in library`).toBeTruthy();
      expect(lib.validated).toBe(false);
      expect(lib.trainingHours).toBeGreaterThan(0);
    }
    expect(allCourses().filter((c) => c.origin === 'tlc-authored')).toHaveLength(6);
  });
  it('each keeps her four-part shape: opening/goal, exploring, practice/strategies, wrap-up with key training notes', () => {
    for (const c of SESSION_SCRIPT_COURSES) {
      const prose = c.modules.map((m) => m.levels.standard).join(' ');
      expect(prose).toMatch(/what brings you in/i);
      expect(prose).toMatch(/Key training notes for therapists-in-training/);
      expect(c.modules[c.modules.length - 1].levels.standard).toMatch(/Wrap up|Wrapping|Close every session/i);
    }
  });
  it('the ids are namespaced and unique across the whole library', () => {
    const ids = allCourses().map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const c of SESSION_SCRIPT_COURSES) expect(c.id).toMatch(/^tl-script-/);
  });
  it('every script course carries all four strands with Yahweh at the centre and a Scripture anchor', () => {
    for (const c of SESSION_SCRIPT_COURSES) {
      const lib = getCourse(c.id);
      expect(hasFourStrands(lib), `${c.id} lacks a strand`).toBe(true);
      const s = courseStrands(lib);
      expect(s.yahweh.anchors.length).toBeGreaterThan(0);
      expect(s.yahweh.principle).toMatch(/Yahweh/);
    }
  });
});

describe('the Word, verbatim (DR-0076)', () => {
  it('every verse the scripts quote matches the app’s KJV corpus word for word', () => {
    for (const [ref, text] of Object.entries(SCRIPT_VERSES)) {
      expect(corpusVerse(ref), ref).toBe(text);
    }
  });
  it('every strand anchor is a verse the corpus holds, and each quoted verse appears in the prose with its KJV badge', () => {
    for (const c of SESSION_SCRIPT_COURSES) {
      for (const ref of c.strands.yahweh.anchors) expect(() => corpusVerse(ref), ref).not.toThrow();
    }
    const prose = SESSION_SCRIPT_COURSES.flatMap((c) => c.modules.map((m) => m.levels.standard)).join('\n');
    for (const ref of ['Mark 1:35', 'Ephesians 4:26', 'Proverbs 15:1', 'Colossians 3:23', 'Proverbs 31:25']) {
      expect(prose).toContain(`${ref} (KJV): "${SCRIPT_VERSES[ref]}"`);
    }
  });
  it('no modern-rendering misquote survives: the NKJV-style anger line is not presented as the verse', () => {
    const prose = SESSION_SCRIPT_COURSES.flatMap((c) => c.modules.map((m) => m.levels.standard)).join('\n');
    expect(prose).not.toMatch(/"Be angry, and do not sin/);
  });
});

describe('the handbook and the office documents, as data', () => {
  it('carries the seven policy sections of the Drive handbook with its own text', () => {
    expect(TLC_HANDBOOK.sections.map((s) => s.id)).toEqual(['standards', 'clinical', 'scheduling', 'billing', 'communication', 'compliance', 'termination']);
    for (const s of TLC_HANDBOOK.sections) for (const it of s.items) expect(it.text.length).toBeGreaterThan(20);
    expect(TLC_HANDBOOK.mission).toMatch(/faith-informed therapy/);
    expect(TLC_HANDBOOK.services).toContain('Clinical supervision for pre-licensed therapists');
  });
  it('names every systems document the Drive sweep found, each carried IN the app — no url (Darrell: "why would you use Google?!")', () => {
    const ids = TLC_OFFICE_DOCUMENTS.map((d) => d.id);
    for (const id of ['handbook', 'contractor-agreement', 'confidentiality', 'training-notes', 'intake-form', 'launch', 'finding-peace']) expect(ids).toContain(id);
    for (const d of TLC_OFFICE_DOCUMENTS) { expect(d.url).toBeUndefined(); expect(d.inApp.length).toBeGreaterThan(5); expect(['team', 'training', 'onboarding']).toContain(d.tab); }
  });
});
