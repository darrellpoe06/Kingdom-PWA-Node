// @vitest-environment node
// =============================================================================
// The office documents live INSIDE the TLC app (DR-0344, 2026-09-10):
// Darrell, on seeing Drive links on the Team section — "I want this built into
// the App!" / "why would you use Google?! fix it build the whole process
// workflows!" Pins: both agreements as data with their sections; the Finding
// Peace chapters as client lessons with every verse verbatim against the app's
// own KJV corpus; the TLCTS Launch tracker as data with progress; the
// document registry with NO outbound url; and migration 0188's guards.
// DR-0076 §3 — each pin was seen to fail against the pre-fix source.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { TLC_CONTRACTOR_AGREEMENT, TLC_CONFIDENTIALITY_AGREEMENT, TLC_AGREEMENTS, agreementByKey } from '../lib/tlc-agreements.js';
import { FINDING_PEACE_CHAPTERS, FINDING_PEACE_VERSES, FINDING_PEACE_SOURCE, findingPeaceModules } from '../lib/tlc-finding-peace.js';
import { LAUNCH_TASKS, LAUNCH_PHASES, LAUNCH_STATUSES, launchTasksByPhase, launchProgress, normalizeStatus } from '../lib/tlc-launch-plan.js';
import { TLC_OFFICE_DOCUMENTS, TLC_HANDBOOK } from '../lib/tlc-handbook.js';
import { TLC_LESSON_TRACKS, isEngineRenderable } from '../lib/tlc-lessons.js';
import { SECTIONS } from '../lib/tlc-onboarding.js';

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = join(here, '../../..');
const KJV = join(here, '../../public/bible/kjv');
const src = (rel) => readFileSync(join(ROOT, rel), 'utf8');

// "1 Corinthians 13:4" → 1Corinthians.json; "Psalms 46:10" → Psalms.json.
function corpusVerse(ref) {
  const m = ref.match(/^(\d?\s?[A-Za-z]+)\s+(\d+):(\d+)$/);
  expect(m, `unparseable ref ${ref}`).toBeTruthy();
  const file = m[1].replace(/\s+/g, '');
  const data = JSON.parse(readFileSync(join(KJV, `${file}.json`), 'utf8'));
  const chapter = data.chapters[Number(m[2]) - 1];
  const verses = chapter.verses || chapter;
  const v = verses[Number(m[3]) - 1];
  return typeof v === 'string' ? v : v.text;
}

describe('the two agreements are data in the app, read where they are signed', () => {
  it('each carries its title, an effective date, a preamble, and numbered sections with text', () => {
    for (const a of [TLC_CONTRACTOR_AGREEMENT, TLC_CONFIDENTIALITY_AGREEMENT]) {
      expect(a.title).toMatch(/Agreement/);
      expect(a.effective).toMatch(/2025/);
      expect(a.preamble.length).toBeGreaterThan(40);
      expect(a.sections.length).toBeGreaterThanOrEqual(8);
      a.sections.forEach((s, i) => {
        expect(s.n).toBe(i + 1);
        expect(s.title.length).toBeGreaterThan(0);
        expect((s.text || '').length + (s.items || []).join('').length).toBeGreaterThan(0);
      });
    }
    expect(TLC_CONTRACTOR_AGREEMENT.sections).toHaveLength(11);
    expect(TLC_CONFIDENTIALITY_AGREEMENT.sections).toHaveLength(8);
  });
  it('the agreement keys are the intake’s acknowledgment keys, so the reader opens the right text at the signature', () => {
    const ack = SECTIONS.find((s) => s.id === 'agreements');
    expect(ack, 'agreements section').toBeTruthy();
    const keys = ack.fields.map((f) => f.key);
    for (const k of Object.keys(TLC_AGREEMENTS)) expect(keys, `acknowledgment ${k}`).toContain(k);
    expect(agreementByKey('contractorAgreement')).toBe(TLC_CONTRACTOR_AGREEMENT);
    expect(agreementByKey('confidentiality')).toBe(TLC_CONFIDENTIALITY_AGREEMENT);
    expect(agreementByKey('policies')).toBeNull();
  });
  it('the office is named and the adversary never capitalised (typography, CLAUDE.md)', () => {
    const text = JSON.stringify(TLC_AGREEMENTS);
    expect(text).toContain('TLC Therapy Solutions');
    expect(text).not.toMatch(/\bSatan\b|\bDevil\b|\bLucifer\b/);
  });
});

describe('Finding Peace — Christina’s eleven chapters are client lessons in the app', () => {
  it('eleven chapters, each with three reading levels, verses, and a quiz', () => {
    expect(FINDING_PEACE_CHAPTERS).toHaveLength(11);
    for (const c of FINDING_PEACE_CHAPTERS) {
      expect(c.id).toMatch(/^fp\d+-/);
      expect(c.child.length).toBeGreaterThan(30);
      expect(c.teen.length).toBeGreaterThan(30);
      expect(c.standard.length).toBeGreaterThan(200);
      expect(c.verses.length).toBeGreaterThan(0);
      expect(c.quiz.length).toBeGreaterThanOrEqual(2);
      for (const ref of c.verses) {
        expect(FINDING_PEACE_VERSES[ref], `${c.id} cites ${ref} without text`).toBeTruthy();
        // DR-0345: the plain level carries no verse; her chapter (the Word rendering) carries each verbatim.
        expect(c.standard, `${c.id} plain quotes ${ref}`).not.toContain(FINDING_PEACE_VERSES[ref]);
        expect(c.word.reflection, `${c.id} Word lacks ${ref}`).toContain(FINDING_PEACE_VERSES[ref]);
      }
    }
    expect(FINDING_PEACE_SOURCE.author).toMatch(/Christina Poe/);
  });
  it('every verse it quotes matches the app’s KJV corpus word for word (DR-0076 — never from memory)', () => {
    for (const [ref, text] of Object.entries(FINDING_PEACE_VERSES)) expect(corpusVerse(ref), ref).toBe(text);
  });
  it('the modules ride the client track on the existing lesson engine, after the third-witness lessons', () => {
    const mods = findingPeaceModules();
    expect(mods).toHaveLength(11);
    for (const m of mods) {
      expect(isEngineRenderable(m), m.id).toBe(true);
      expect(m.levels.senior).toBe(m.levels.standard);
      expect(m.title).toMatch(/^Finding Peace · /);
      expect(m.origin).toBe('tlc-authored');
    }
    const ids = TLC_LESSON_TRACKS.client.modules.map((m) => m.id);
    for (const m of mods) expect(ids, m.id).toContain(m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('the TLCTS Launch tracker is a live board, not a sheet', () => {
  it('the sheet’s rows, one key each, in its five phases, first row already done', () => {
    expect(LAUNCH_TASKS).toHaveLength(15);
    expect(new Set(LAUNCH_TASKS.map((t) => t.key)).size).toBe(15);
    for (const t of LAUNCH_TASKS) {
      expect(LAUNCH_PHASES).toContain(t.phase);
      expect(LAUNCH_STATUSES).toContain(t.seedStatus);
      expect(t.owner.length).toBeGreaterThan(0);
    }
    expect(LAUNCH_TASKS[0].seedStatus).toBe('done');
    expect(launchTasksByPhase().map((p) => p.phase)).toEqual(LAUNCH_PHASES);
    expect(launchTasksByPhase().flatMap((p) => p.tasks)).toHaveLength(15);
  });
  it('progress is measured from the office’s saved statuses over the seed, and unknown statuses fall to todo', () => {
    expect(launchProgress()).toMatchObject({ done: 1, total: 15, pct: 7 });
    const all = Object.fromEntries(LAUNCH_TASKS.map((t) => [t.key, 'done']));
    expect(launchProgress(all)).toMatchObject({ done: 15, total: 15, pct: 100 });
    expect(launchProgress({ 'website-therapist-pages': 'todo' }).done).toBe(0);
    expect(normalizeStatus('bogus')).toBe('todo');
    expect(normalizeStatus('in-progress')).toBe('in-progress');
    const byPhase = launchTasksByPhase({ 'marketing-social-pages': 'in-progress' });
    expect(byPhase.find((p) => p.phase === 'Marketing').tasks.find((t) => t.key === 'marketing-social-pages').status).toBe('in-progress');
  });
});

describe('the handbook opens at 1 (Darrell: "where is number 1?")', () => {
  it('eight numbered sections in order, section 1 carrying welcome, mission, vision, what we provide, contractor status', () => {
    const titles = TLC_HANDBOOK.sections.map((s) => s.title);
    expect(titles.map((t) => t.split('.')[0])).toEqual(['1', '2', '3', '4', '5', '6', '7', '8']);
    expect(titles[0]).toBe('1. Introduction');
    expect(TLC_HANDBOOK.sections[0].items.map((i) => i.label)).toEqual(['Welcome', 'Mission', 'Vision', 'What we provide', 'Independent contractor status']);
    expect(TLC_HANDBOOK.sections[0].items[1].text).toBe(TLC_HANDBOOK.mission);
    // both readers render the sections, so neither can skip 1
    for (const f of ['app/src/components/TlcTeamResources.jsx', 'app/src/components/TlcAgreementReader.jsx']) expect(src(f)).toMatch(/TLC_HANDBOOK\.sections\.map/);
  });
});

describe('no document links out of the app', () => {
  it('the office document registry names an in-app tab for every document and carries no url', () => {
    expect(TLC_OFFICE_DOCUMENTS.length).toBeGreaterThanOrEqual(6);
    for (const d of TLC_OFFICE_DOCUMENTS) {
      expect(typeof d.inApp, d.id).toBe('string'); expect(d.inApp.length).toBeGreaterThan(0);
      expect(['team', 'training', 'onboarding']).toContain(d.tab);
      expect(d.url).toBeUndefined();
      expect(JSON.stringify(d)).not.toMatch(/google\.com/);
    }
  });
  it('the Team section, the intake form, and the office panel render no Google/Drive href', () => {
    for (const f of ['app/src/components/TlcTeamResources.jsx', 'app/src/components/TlcOnboardingForm.jsx', 'app/src/components/TlcOnboarding.jsx', 'app/src/components/TlcAgreementReader.jsx', 'app/src/components/TlcLaunchBoard.jsx']) {
      const code = src(f).split('\n').filter((l) => !l.trim().startsWith('//')).join('\n');
      expect(code, f).not.toMatch(/docs\.google|drive\.google|formUrl|handbookUrl|AgreementUrl|docUrl/);
    }
  });
  it('the Team section reads the handbook and both agreements in place and routes Training / Onboarding on the slider', () => {
    const code = src('app/src/components/TlcTeamResources.jsx');
    expect(code).toMatch(/AgreementBody/);
    expect(code).toMatch(/TLC_CONTRACTOR_AGREEMENT/);
    expect(code).toMatch(/TLC_CONFIDENTIALITY_AGREEMENT/);
    expect(code).toMatch(/TlcLaunchBoard/);
    expect(code).toMatch(/go\('training'\)/);
    expect(code).toMatch(/go\('onboarding'\)/);
    expect(code).not.toMatch(/target="_blank"/);
  });
  it('the intake’s acknowledgment opens the document in the app before the signature', () => {
    const code = src('app/src/components/TlcOnboardingForm.jsx');
    expect(code).toMatch(/TlcAgreementReader/);
    expect(code).toMatch(/agreementByKey\(field\.key\)/);
  });
});

describe('migration 0188 — tlc_office_tasks (the board’s rows)', () => {
  const sql = src('infra/supabase/migrations-auto/0188-tlc-office-tasks-the-launch-board-lives-in-the-app.sql');
  it('is instance-scoped, RLS on, unique per office task, with the status check', () => {
    expect(sql).toMatch(/create table if not exists public\.tlc_office_tasks/i);
    expect(sql).toMatch(/enable row level security/i);
    expect(sql).toMatch(/unique\s*\(\s*instance_id\s*,\s*office_id\s*,\s*task_key\s*\)/i);
    expect(sql).toMatch(/status\s+text[^,]*check\s*\(\s*status\s+in\s*\(\s*'todo'\s*,\s*'in-progress'\s*,\s*'done'\s*\)\s*\)/i);
  });
  it('every role guard is null-safe and the overlays are re-run at the end', () => {
    expect(sql).toMatch(/coalesce\(public\.user_role_in_instance\(instance_id\), ''\)/);
    expect(sql).not.toMatch(/(?<!coalesce\()public\.user_role_in_instance\(instance_id\)\s+(not\s+)?in\s*\(/i);
    expect(sql).toMatch(/select public\.apply_assistant_scope_overlay\(\);/i);
    expect(sql).toMatch(/select public\.apply_viewer_readonly_overlay\(\);/i);
    expect(sql.lastIndexOf('apply_viewer_readonly_overlay')).toBeGreaterThan(sql.toLowerCase().lastIndexOf('create policy'));
  });
});
