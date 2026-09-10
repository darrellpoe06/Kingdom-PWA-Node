// @vitest-environment node
// =============================================================================
// The curriculum in two renderings, the Illinois lesson on every training,
// the weekly plan, and the assignment seam (DR-0345, 2026-09-10). Darrell:
// "build two lessons one with the Word and the other without it so our
// curriculum is capable of working for all clients" / "on click for the Word
// versions" / "the 24 trainings for therapists to be for the week...
// comprehensive... latest... Illinois policy" / "Therapist should be able to
// schedule lessons for their clients." DR-0076 §3: each pin was seen to fail.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { parseRef } from '../lib/bible-kjv.js';
import { wordForModule, hasWord, plainIsPlain } from '../lib/lesson-word.js';
import { ILLINOIS_RULES, ILLINOIS_RULE_KEYS, ILLINOIS_SOURCES, ILLINOIS_POLICY_AS_OF, FIELD_TOPICS, illinoisTopicsFor, illinoisModuleFor, sourcesFor, illinoisRules } from '../lib/tlc-illinois-policy.js';
import { allCourses, TRAINING_FIELDS, getCourse } from '../lib/tlc-training-library.js';
import { buildWeeklyPlan, buildTrainingPlan, DEFAULT_PLAN_WEEKS } from '../lib/tlc-training-plan.js';
import { TLC_LESSON_TRACKS, isEngineRenderable } from '../lib/tlc-lessons.js';
import { FINDING_PEACE_CHAPTERS, FINDING_PEACE_VERSES } from '../lib/tlc-finding-peace.js';
import { STATE_RULESETS } from '../lib/ceu-tracker.js';
import { validAssignment, normalizeEmail, splitAssignments } from '../lib/tlc-assignments-core.js';

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = join(here, '../../..');
const KJV = join(here, '../../public/bible/kjv');
const src = (rel) => readFileSync(join(ROOT, rel), 'utf8');
const books = new Map();
function corpusHas(ref) {
  const p = parseRef(ref);
  if (!p) return `unparseable ${ref}`;
  if (!books.has(p.file)) books.set(p.file, JSON.parse(readFileSync(join(KJV, `${p.file}.json`), 'utf8')));
  const ch = books.get(p.file).chapters[p.chapter - 1];
  if (!ch) return `no chapter ${ref}`;
  const verses = ch.verses || ch;
  for (let v = p.v1; v <= p.v2; v += 1) if (verses[v - 1] == null) return `no verse ${ref}`;
  return true;
}

// Lessons where the Word is inside the author's own teaching (Christina's
// session scripts; the covenant-intimacy course written from Scripture): a
// plain rendering would rewrite her text, so they are therapist material
// with the Word inline, named here on purpose — never a silent skip.
const WORD_INLINE_BY_AUTHOR = (m) => /^tl-script-/.test(m.id) || /^tl-couple-desire-/.test(m.id);

describe('two renderings: plain by default, the Word on click', () => {
  const library = allCourses();
  it('every client lesson and every library lesson has a Word rendering, except the Illinois lesson (the state’s rule carries no Scripture)', () => {
    for (const m of TLC_LESSON_TRACKS.client.modules) expect(hasWord(m), m.id).toBe(true);
    for (const c of library) for (const m of c.modules) {
      if (m.illinois) expect(wordForModule(m, c), m.id).toBeNull();
      else expect(hasWord(m, c), `${c.id}/${m.id}`).toBe(true);
    }
  });
  it('every reference a Word rendering names exists in the app’s KJV corpus (loaded verbatim at read time — never typed)', () => {
    const refs = new Set();
    for (const m of TLC_LESSON_TRACKS.client.modules) for (const r of wordForModule(m).verses) refs.add(r);
    for (const c of library) for (const m of c.modules) { const w = wordForModule(m, c); if (w) for (const r of w.verses) refs.add(r); }
    expect(refs.size).toBeGreaterThan(60);
    for (const r of refs) expect(corpusHas(r), r).toBe(true);
  });
  it('the plain rendering is plain: no Scripture reference in any level of a client lesson or a library lesson (the author-inline set named)', () => {
    for (const m of TLC_LESSON_TRACKS.client.modules) expect(plainIsPlain(m), m.id).toBe(true);
    for (const c of library) for (const m of c.modules) {
      if (WORD_INLINE_BY_AUTHOR(m)) continue;
      expect(plainIsPlain(m), `${c.id}/${m.id}`).toBe(true);
    }
  });
  it('Finding Peace: the plain levels keep her practical tips and drop the verses; the Word rendering keeps her chapter with every verse verbatim', () => {
    for (const c of FINDING_PEACE_CHAPTERS) {
      expect(c.standard).toMatch(/Practical (tip|insight)/);
      for (const ref of c.verses) {
        expect(c.standard, `${c.id} plain quotes ${ref}`).not.toContain(FINDING_PEACE_VERSES[ref]);
        expect(c.word.reflection, `${c.id} Word lacks ${ref}`).toContain(FINDING_PEACE_VERSES[ref]);
      }
    }
    const mod = TLC_LESSON_TRACKS.client.modules.find((m) => m.id === 'fp1-psalms-prayer');
    expect(mod.word.verses).toEqual(['Psalms 46:10', 'Psalms 23:2', 'Psalms 55:22']);
    expect(mod.word.principle.length).toBeGreaterThan(20);
  });
  it('a library lesson’s Word rendering is its course’s own Yahweh strand, and the client lessons carry an authored one', () => {
    const c = getCourse('tl-assessment-and-diagnosis-biopsychosocial-assessment-the-whole-person');
    const w = wordForModule(c.modules[0], c);
    expect(w.source).toBe('course-strand');
    expect(w.verses).toContain('1 Thessalonians 5:23');
    expect(w.principle).toMatch(/Yahweh/);
    const cl = TLC_LESSON_TRACKS.client.modules.find((m) => m.id === 'cl1-what-is-anxiety');
    expect(wordForModule(cl).source).toBe('lesson');
    expect(wordForModule({ id: 'x', levels: { standard: 'plain' } })).toBeNull();
  });
});

describe('Illinois: policy, program and procedure on every training', () => {
  it('the registry: eleven rules, each with a citation, a requirement, a procedure, a real source, a quiz, dated, and never presented as verbatim statute', () => {
    expect(ILLINOIS_RULE_KEYS).toHaveLength(11);
    for (const k of ILLINOIS_RULE_KEYS) {
      const r = ILLINOIS_RULES[k];
      expect(r.cite, k).toMatch(/ILCS|Adm\. Code|988|CESSA/);
      expect(r.requires.length, k).toBeGreaterThan(150);
      expect(r.procedure.length, k).toBeGreaterThan(80);
      expect(r.sources.length, k).toBeGreaterThan(0);
      for (const s of r.sources) expect(ILLINOIS_SOURCES[s], `${k} source ${s}`).toBeTruthy();
      expect(r.quiz.options.length).toBe(3);
      expect(r.verbatim).toBe(false);
      expect(r.asOf).toBe(ILLINOIS_POLICY_AS_OF);
    }
    expect(ILLINOIS_POLICY_AS_OF).toBe('2026-09-10');
    expect(Object.keys(FIELD_TOPICS).sort()).toEqual([...TRAINING_FIELDS].sort());
  });
  it('the renewal rule agrees with the CE tracker’s Illinois ruleset (one truth, two surfaces)', () => {
    const il = STATE_RULESETS.IL;
    const r = ILLINOIS_RULES['ce-renewal'].requires;
    expect(r).toMatch(/Thirty hours/);
    expect(il.totalHours).toBe(30);
    for (const t of il.mandatedTopics) {
      const n = { 3: 'three', 1: 'one', 6: 'six' }[t.hours];
      expect(r.toLowerCase(), t.key).toContain(`${n} hour`);
    }
    expect(r).toMatch(/November 30, 2027/);
    expect(r).toMatch(/first renewal/);
  });
  it('every course in the library closes with the Illinois lesson for its field: the renewal rule plus its field’s rules, the rules’ own quiz, dated sources', () => {
    for (const c of allCourses()) {
      const il = c.modules[c.modules.length - 1];
      expect(il.illinois, c.id).toBeTruthy();
      expect(il.id).toBe(`${c.id}-illinois`);
      expect(il.illinois.keys[0]).toBe('ce-renewal');
      for (const k of FIELD_TOPICS[c.field]) expect(il.illinois.keys, `${c.id} ${k}`).toContain(k);
      expect(il.quiz.questions).toHaveLength(il.illinois.keys.length);
      expect(il.levels.standard).toMatch(/What Illinois requires/);
      expect(il.levels.standard).toMatch(/What we do at TLC/);
      expect(il.illinois.sources.length).toBeGreaterThan(0);
      expect(isEngineRenderable(il), c.id).toBe(true);
      expect(c.modules.filter((m) => m.illinois)).toHaveLength(1);
    }
    expect(illinoisTopicsFor({ field: 'Crisis & risk' })).toEqual(['ce-renewal', 'crisis', 'duty-to-warn', 'mandated-reporting']);
    expect(illinoisTopicsFor({ field: 'Crisis & risk', illinoisTopics: ['telehealth', 'bogus'] })).toContain('telehealth');
    expect(illinoisModuleFor({ id: 'x', field: 'no-such-field' }).illinois.keys).toEqual(['ce-renewal']);
    expect(sourcesFor(illinoisRules(['crisis', 'crisis'])).map((s) => s.label)).toHaveLength(2);
  });
  it('the facts the search verified are in the text: 3,000 hours, four a month, groups of five, twelve-and-older consent, eight sessions, 988, ANCRA retraining every three years', () => {
    const t = (k) => ILLINOIS_RULES[k].requires;
    expect(t('lcsw-licensure')).toMatch(/3,000 hours/);
    expect(t('lcsw-licensure')).toMatch(/four hours each month/);
    expect(t('lcsw-licensure')).toMatch(/no more than five/);
    expect(t('minor-consent')).toMatch(/twelve or older/);
    expect(t('minor-consent')).toMatch(/eight sessions of ninety minutes/);
    expect(t('crisis')).toMatch(/988/);
    expect(t('mandated-reporting')).toMatch(/every three years/);
    expect(t('telehealth')).toMatch(/licensed or otherwise authorized to practice in Illinois/);
    expect(ILLINOIS_RULES['mandated-reporting'].smeConfirm).toMatch(/hotline number is not carried here from memory/);
  });
});

describe('the weekly plan: one training a week', () => {
  const courses = allCourses();
  it('schedules every course once, one per week, rotating fields, with its Illinois lesson; the month plan is untouched', () => {
    const w = buildWeeklyPlan(courses, { weeks: courses.length, startISO: '2026-09-14' });
    expect(w.plan).toHaveLength(courses.length);
    expect(new Set(w.plan.map((x) => x.course.id)).size).toBe(courses.length);
    expect(w.summary.unscheduledCourses).toBe(0);
    expect(w.summary.openWeeks).toBe(0);
    expect(w.summary.withIllinois).toBe(courses.length);
    expect(w.summary.fields).toBe(TRAINING_FIELDS.length);
    expect(w.plan[0].label).toBe('Week 1 (week of Sep 14, 2026)');
    expect(w.plan[1].label).toBe('Week 2 (week of Sep 21, 2026)');
    expect(w.plan[0].field).not.toBe(w.plan[1].field);
    expect(DEFAULT_PLAN_WEEKS).toBe(24);
    expect(buildTrainingPlan(courses).hoursPerMonth).toBe(24);
  });
  it('an honest gap: more weeks than courses leaves open weeks, never a painted course', () => {
    const w = buildWeeklyPlan(courses.slice(0, 3), { weeks: 5 });
    expect(w.plan.filter((x) => x.open)).toHaveLength(2);
    expect(w.summary.scheduledCourses).toBe(3);
    expect(w.plan[4].course).toBeNull();
  });
});

describe('a therapist schedules a lesson for a client (0189 + the seam)', () => {
  const sql = src('infra/supabase/migrations-auto/0189-tlc-lesson-assignments-a-therapist-schedules-a-lesson-for-a-client.sql');
  it('the table is instance-scoped with RLS: the therapist on their own rows, the client by the email on their verified session, review fields only', () => {
    expect(sql).toMatch(/create table if not exists public\.tlc_lesson_assignments/i);
    expect(sql).toMatch(/enable row level security/i);
    expect(sql).toMatch(/therapist_id = auth\.uid\(\)/);
    expect(sql).toMatch(/client_email = lower\(coalesce\(auth\.jwt\(\) ->> 'email', ''\)\)/);
    expect(sql).toMatch(/coalesce\(public\.user_role_in_instance\(instance_id\), ''\) IN \('owner','admin','member'\)/);
    expect(sql).not.toMatch(/(?<!coalesce\()public\.user_role_in_instance\(instance_id\)\s+(not\s+)?in\s*\(/i);
    expect(sql).toMatch(/status IN \('assigned','reviewed'\)/);
    expect(sql).toMatch(/NEW\.client_email := OLD\.client_email/);
    expect(sql).toMatch(/select public\.apply_assistant_scope_overlay\(\);/i);
    expect(sql).toMatch(/select public\.apply_viewer_readonly_overlay\(\);/i);
  });
  it('the seam validates on the device before any write, normalises the address, and splits a client’s list', () => {
    expect(validAssignment({ clientEmail: 'Ann@Example.com', lesson: { id: 'cl1', title: 'x' } })).toEqual([]);
    expect(validAssignment({ clientEmail: 'nope', lesson: null, dueOn: '9/14', note: 'n'.repeat(501) })).toEqual(['a valid client email', 'a lesson', 'a due date as YYYY-MM-DD', 'a note under 500 characters']);
    expect(normalizeEmail('  Ann@Example.com ')).toBe('ann@example.com');
    const s = splitAssignments([{ id: 1, status: 'assigned' }, { id: 2, status: 'reviewed' }]);
    expect(s.due.map((r) => r.id)).toEqual([1]);
    expect(s.done.map((r) => r.id)).toEqual([2]);
  });
});
