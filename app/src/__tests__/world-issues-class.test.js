// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  WORLD_ISSUES, WORLD_ISSUES_META, WORLD_ISSUES_SESSION_FLOW,
  buildWorldIssuesSchedule, worldIssuesProgressSummary, exportWorldIssuesCurriculumMarkdown,
  auditWorldIssues, resolveWorldIssuesCohort, WORLD_ISSUES_TUTOR_META,
} from '../lib/world-issues-class.js';
import { buildDiscernmentModules, auditIssue, lintLatestNotOnlyInstitutions, LATEST_SINCE } from '../lib/discernment-track.js';
import LATEST_BASELINE from '../lib/world-issues-latest-baseline.json';

describe('the published World Issues track passes every safeguard (the gate)', () => {
  it('every issue audits clean — no error-severity violations', () => {
    const results = auditWorldIssues();
    const failed = results.filter((r) => !r.ok);
    // Surface WHAT failed if this ever breaks, so the gate is actionable.
    expect(failed.flatMap((r) => r.errors.map((e) => `${r.id}: ${e.code} — ${e.message}`))).toEqual([]);
    expect(results.every((r) => r.ok)).toBe(true);
  });
});

describe('the Musk worked example — built to the constraints', () => {
  const musk = WORLD_ISSUES.find((i) => i.id === 'wi-musk-creator-critique');

  it('exists and targets a named real public figure (strict safeguard on)', () => {
    expect(musk).toBeTruthy();
    expect(musk.subject.isNamedRealPerson).toBe(true);
    expect(musk.subject.name).toBe('Elon Musk');
  });

  it('labels EVERY claim and attributes it to the creator — none asserted as a verdict', () => {
    expect(musk.claims.length).toBeGreaterThan(0);
    musk.claims.forEach((c) => {
      expect(['allegation', 'claim', 'opinion', 'call-to-action']).toContain(c.label);
      expect(c.attribution).toMatch(/creator|DAT BOY WILL/i);
    });
  });

  it('carries the boycott ONLY as the creator\'s labeled call-to-action, never the lesson\'s directive', () => {
    const boycott = musk.claims.find((c) => /boycott/i.test(c.text));
    expect(boycott).toBeTruthy();
    expect(boycott.label).toBe('call-to-action');
    expect(boycott.attribution).toBeTruthy();
  });

  it('every documented fact carries a source WITH an as-of date', () => {
    expect(musk.verifiable.length).toBeGreaterThan(0);
    musk.verifiable.forEach((v) => {
      expect(v.sources.length).toBeGreaterThan(0);
      v.sources.forEach((s) => {
        expect(s.title).toBeTruthy();
        expect(s.asOf).toMatch(/^\d{4}-\d{2}-\d{2}$/); // a real ISO date, not a vibe
      });
    });
  });

  it('separates documented fact from interpretation (both present)', () => {
    expect(musk.verifiable.some((v) => v.status === 'documented')).toBe(true);
    expect(musk.interpretation.length).toBeGreaterThan(0);
    // The "is a racist" conclusion is modeled AS interpretation, not stated as fact.
    expect(musk.interpretation.some((n) => /heart|intent|interpretation/i.test(n.statement))).toBe(true);
  });

  it('steelmans at least three perspectives (evenhanded)', () => {
    const steelmanned = musk.perspectives.filter((p) => p.steelman && p.label);
    expect(steelmanned.length).toBeGreaterThanOrEqual(3);
  });

  it('applies the believer\'s lens with a grace-note and a stewardship/empowerment theme', () => {
    expect(musk.lens.graceNote).toMatch(/condemn|image of God|verdict/i);
    expect(musk.lens.stewardship).toMatch(/build|steward|empower|community/i);
    expect(musk.lens.fourD.scripture).toBeTruthy();
  });

  it('provides an age-appropriate child rendering free of charged terms', () => {
    expect(musk.levels.child).toBeTruthy();
    const low = musk.levels.child.toLowerCase();
    ['racist', 'nazi', 'genocide', 'hitler'].forEach((term) => expect(low).not.toContain(term));
  });

  it('states ACCOUNTABILITY plainly on the two courts — never implied (Darrell 2026-07-08)', () => {
    for (const issue of WORLD_ISSUES) {
      const acct = issue.lens.accountability;
      expect(acct?.statement, `${issue.id} must state accountability`).toBeTruthy();
      expect(acct.scripture).toMatch(/Ecclesiastes 12:14/);
    }
    // The named-person case carries the full doctrine: the eternal court holds
    // what man's court dismissed or never prosecuted, restitution is owed, and
    // hiding or minimizing another's wrong is itself in the record.
    const a = musk.lens.accountability.statement;
    expect(a).toMatch(/eternal court/i);
    expect(a).toMatch(/restitution/i);
    expect(a).toMatch(/never prosecutes|never prosecuted/i);
    expect(a).toMatch(/Leviticus 5:1/);
    expect(a).toMatch(/Proverbs 17:15/);
  });
  it('quizzes the SKILL, not a verdict on the person', () => {
    expect(musk.quiz.questions.length).toBeGreaterThanOrEqual(3);
    musk.quiz.questions.forEach((q) => {
      expect(typeof q.answer).toBe('number');
      expect(q.options[q.answer]).toBeTruthy();
    });
  });
});

describe('rides the shared Learn engine (self-paced, no fork)', () => {
  it('meta declares the self-paced unit label', () => {
    expect(WORLD_ISSUES_META.unit.selfPaced).toBe(true);
    expect(WORLD_ISSUES_META.unit.cap).toBe('Issue');
  });

  it('builds a numbered, date-less schedule of Learn modules', () => {
    const sched = buildWorldIssuesSchedule();
    expect(sched.length).toBe(WORLD_ISSUES.length);
    expect(sched[0].week).toBe(1);
    expect(sched[0].date).toBeNull();
    // each row is a real Learn module with an anchor + bigIdea + the structured issue
    expect(sched[0].anchor.ref).toBeTruthy();
    expect(sched[0].bigIdea).toBeTruthy();
    expect(sched[0].issue).toBeTruthy();
  });

  it('projects issues into modules that ChurchLearn can render', () => {
    const modules = buildDiscernmentModules(WORLD_ISSUES);
    modules.forEach((m) => {
      expect(m.id).toBeTruthy();
      expect(m.title).toBeTruthy();
      expect(m.anchor.ref).toBeTruthy();
      expect(m.facilitator.discussionPrompts.length).toBeGreaterThan(0);
    });
  });

  it('counts real progress', () => {
    const summary = worldIssuesProgressSummary({ 'wi-musk-creator-critique': true });
    expect(summary).toMatchObject({ done: 1, total: WORLD_ISSUES.length });
  });

  it('exports printable curriculum markdown', () => {
    const md = exportWorldIssuesCurriculumMarkdown();
    expect(md).toContain(WORLD_ISSUES_META.title);
    expect(md).toContain('Issue 1');
  });

  it('resolves a self-paced cohort (no date, not confirmed)', () => {
    expect(resolveWorldIssuesCohort()).toMatchObject({ startDate: null, confirmed: false });
  });

  it('ships a discernment-coach tutor meta that refuses to deliver a verdict', () => {
    expect(WORLD_ISSUES_TUTOR_META.posture).toMatch(/never.*verdict|belongs to God/i);
    expect(WORLD_ISSUES_TUTOR_META.posture).toMatch(/steelman/i);
  });
});

describe('session flow mirrors the five discernment stages', () => {
  it('has five stages', () => {
    expect(WORLD_ISSUES_SESSION_FLOW.length).toBe(5);
    expect(WORLD_ISSUES_SESSION_FLOW.map((s) => s.name).join(' ')).toMatch(/claim/i);
  });
});

// ---------------------------------------------------------------------------
// PROVEN-TO-CATCH: the shape that blanked the whole curriculum (2026-08-14).
// Issue 10 shipped lens.threeD as { practical: '...' } instead of a string.
// The publish audit passed it (truthy), the verse-integrity gate passed it, and
// the ONLY thing that caught it was a render test in another file — reporting
// "expected '' to match /(Issue)\s*1/", which names the symptom, not the cause.
// React throws on an object child and the entire World Issues curriculum
// rendered EMPTY. Renderability is part of correctness, so the audit checks it.
describe('lens fields that are rendered must be strings (the blank-curriculum class)', () => {
  const base = () => JSON.parse(JSON.stringify(WORLD_ISSUES.find((i) => i.id === 'wi-victorious-emotions')));

  it('CATCHES lens.threeD handed in as an object — the exact 2026-08-14 break', () => {
    const bad = base();
    bad.lens.threeD = { practical: 'text that React cannot render' };
    const codes = auditIssue(bad).violations.map((v) => v.code);
    expect(codes).toContain('lens/threeD-not-a-string');
  });

  it('CATCHES an object grace note and an object stewardship too', () => {
    for (const key of ['graceNote', 'stewardship']) {
      const bad = base();
      bad.lens[key] = { text: 'nope' };
      expect(auditIssue(bad).violations.map((v) => v.code)).toContain(`lens/${key}-not-a-string`);
    }
  });

  it('CATCHES a non-string fourD.deepSource (fourD is the one lens field that IS an object)', () => {
    const bad = base();
    bad.lens.fourD.deepSource = { text: 'nope' };
    expect(auditIssue(bad).violations.map((v) => v.code)).toContain('lens/fourD-deepSource-not-a-string');
  });

  it('the real published issues all pass the shape check', () => {
    for (const issue of WORLD_ISSUES) {
      const shape = auditIssue(issue).violations.filter((v) => v.code.startsWith('lens/'));
      expect(shape, `${issue.id} has a non-renderable lens field`).toEqual([]);
    }
  });

  it('does not cry wolf on a correct string lens', () => {
    expect(auditIssue(base()).violations.filter((v) => v.code.startsWith('lens/'))).toEqual([]);
  });
});

describe('the source names who made it, never what they believe (2026-10-22)', () => {
  const campus = WORLD_ISSUES.find((i) => i.id === 'wi-the-way-was-45-minutes-long');
  it('issue 21 names its creator from the record, with no label on his faith', () => {
    expect(campus.source.creator).toBe('Monte Mader (@montemader), who made the reel');
    expect(auditIssue(campus).errors.filter((e) => e.code === 'source/faith-label')).toEqual([]);
  });
  it('PROVEN TO CATCH: the line that shipped is refused', () => {
    const shipped = { ...campus, source: { ...campus.source, creator: 'Monte Mader (@montemader), a creator who posts on deconstruction, exvangelical and current-events subjects' } };
    expect(auditIssue(shipped).errors.map((e) => e.code)).toContain('source/faith-label');
  });
  it('the source line reads as a sentence for every issue (no possessive glued onto a clause)', () => {
    const lesson = buildDiscernmentModules([campus])[0].lesson;
    expect(lesson).toContain('THE SOURCE. From Monte Mader (@montemader), who made the reel: a short-form video');
    expect(lesson).not.toMatch(/reel's a short-form/);
  });
});

describe('one lesson, Word first (2026-10-22: "two lessons in one... What happened to the pattern")', () => {
  const campus = WORLD_ISSUES.find((i) => i.id === 'wi-the-way-was-45-minutes-long');
  const mods = buildDiscernmentModules(WORLD_ISSUES);
  const REF = /\b(?:Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Isaiah|Proverbs|Haggai|Psalms?|Matthew|John|Romans|Hebrews|Revelation|Ecclesiastes|Samuel) \d+:\d+/;

  it('every issue audits clean on the new rule, and issue 21 opens its Word section with the Word', () => {
    WORLD_ISSUES.forEach((i) => expect(auditIssue(i).errors.filter((e) => /^(word-first|one-lesson)\//.test(e.code)), i.id).toEqual([]));
    expect(campus.lens.fourD.deepSource.startsWith('WORD FIRST — YAHWEH MEASURED THE ROADS.')).toBe(true);
  });
  it('PROVEN TO CATCH: a Word section that opens with where it came from and what the checking found', () => {
    const preamble = 'WHERE THIS CAME FROM. Darrell sent an Instagram reel into the app with one word on it. '.repeat(8);
    const late = { ...campus, lens: { ...campus.lens, fourD: { ...campus.lens.fourD, deepSource: preamble + campus.lens.fourD.deepSource } } };
    expect(auditIssue(late).errors.map((e) => e.code)).toContain('word-first/late');
  });
  it('PROVEN TO CATCH: a Word section that retells the checks the stages already give', () => {
    const twice = { ...campus, lens: { ...campus.lens, fourD: { ...campus.lens.fourD, deepSource: `${campus.lens.fourD.deepSource}\n\n${campus.claims[0].text}` } } };
    expect(auditIssue(twice).errors.map((e) => e.code)).toContain('one-lesson/retold');
  });
  it('the adult reads the Word first, in every issue, and issue 21 tells each claim once', () => {
    mods.forEach((m) => expect(m.lesson.startsWith('WORD FIRST'), m.id).toBe(true));
    const adult = mods.find((m) => m.id === campus.id).lesson;
    expect(adult).not.toMatch(/WHAT THE CHECKING FOUND/);
    // The Word section, the source and Stage 1 tell each claim once (Stages 2 and 3 may quote one on purpose).
    const told = adult.slice(0, adult.indexOf('STAGE 2 —'));
    campus.claims.forEach((c) => expect(told.split(c.text.slice(10, 45)).length - 1, c.id).toBe(1));
  });
  it('each age version of issue 21 reaches the Word before the first claim it checks, with no machinery in it', () => {
    for (const band of ['child', 'youth', 'teen', 'senior']) {
      const t = campus.levels[band];
      const word = t.search(REF);
      const claim = t.search(/UT Arlington|Texas|Tarrant|Union Square/);
      expect(word, band).toBeGreaterThan(-1);
      if (claim > -1) expect(word, band).toBeLessThan(claim);
      expect(t, band).not.toMatch(/\bNAS\b|Whisper|the row (itself )?records/);
    }
  });
});

// THE NEWEST WORD, NOT ONLY THE INSTITUTIONS' (2026-10-27). Darrell, on World
// Issues 22: "World issues did not have the latest information... just the
// latest in institutions... which are usually behind the main stream... like we
// don't take epstein seriously anymore and the institutions are trustworthy
// when historical events say otherwise for Africa Americans." The lint holds a
// lesson to a dated latest section with at least one word from the field, and
// holds every documented fact to two publishers or the record itself. Proven
// to catch below; the 21 earlier issues are held by a baseline that only
// shrinks.
describe('the newest word, not only the institutions’ (2026-10-27)', () => {
  const seal = WORLD_ISSUES.find((i) => i.id === 'wi-the-broken-seal-and-the-sure-foundation');
  const codes = (issue) => lintLatestNotOnlyInstitutions(issue).map((v) => `${v.code}:${v.severity}`);
  const fresh = (over = {}) => ({
    ...seal,
    source: { ...seal.source, asOf: LATEST_SINCE },
    ...over,
  });

  it('lesson 22 carries the newest word from the field and audits clean', () => {
    expect(codes(seal)).toEqual([]);
    expect(auditIssue(seal).ok).toBe(true);
  });

  it('CATCHES a new lesson with no dated latest section', () => {
    expect(codes(fresh({ latest: undefined }))).toEqual(['latest/missing:error']);
    expect(codes(fresh({ latest: { asOf: '2026-10-27', items: [] } }))).toEqual(['latest/missing:error']);
    expect(auditIssue(fresh({ latest: undefined })).ok).toBe(false);
  });

  it('CATCHES a latest section that stands only on institutions', () => {
    const only = { asOf: '2026-10-27', items: [{ said: 'The agency confirmed the flaw in its weekly bulletin.', by: 'the agency', standing: 'institution', asOf: '2026-10-27' }] };
    expect(codes(fresh({ latest: only }))).toEqual(['latest/only-institutions:error']);
  });

  it('CATCHES a documented fact that rests on one publisher’s word, and accepts two publishers or the record itself', () => {
    const oneWord = { id: 'f-x', statement: 'A thing happened.', status: 'documented', sources: [{ title: 't', publisher: 'One Office', asOf: '2026-10-27' }] };
    expect(codes(fresh({ verifiable: [...seal.verifiable, oneWord] }))).toEqual(['documented/one-word:error']);
    const two = { ...oneWord, sources: [...oneWord.sources, { title: 't2', publisher: 'A Second Desk', asOf: '2026-10-27' }] };
    expect(codes(fresh({ verifiable: [...seal.verifiable, two] }))).toEqual([]);
    const primary = { ...oneWord, sources: [{ ...oneWord.sources[0], primary: true }] };
    expect(codes(fresh({ verifiable: [...seal.verifiable, primary] }))).toEqual([]);
  });

  it('an earlier lesson gets warnings, never errors, so the published track still audits clean', () => {
    const older = fresh({ source: { ...seal.source, asOf: '2026-09-01' }, latest: undefined });
    expect(codes(older)).toEqual(['latest/missing:warn']);
    expect(auditIssue(older).ok).toBe(true);
  });

  it('a lesson that already carries a latest section is held whole, whatever its date', () => {
    const dated = fresh({ source: { ...seal.source, asOf: '2026-09-01' }, latest: { asOf: '2026-09-01', items: [{ said: 'Only the office spoke, and it spoke late.', by: 'the office', standing: 'institution', asOf: '2026-09-01' }] } });
    expect(codes(dated)).toEqual(['latest/only-institutions:error']);
  });

  it('the baseline of earlier issues only shrinks (an issue brought up to the rule leaves it)', () => {
    const now = {};
    for (const i of WORLD_ISSUES) {
      const c = lintLatestNotOnlyInstitutions(i).map((v) => v.code).sort();
      if (c.length) now[i.id] = c;
    }
    const grew = Object.entries(now).filter(([id, c]) => c.length > (LATEST_BASELINE[id] || []).length).map(([id]) => id);
    expect(grew, 'an issue carries MORE latest/documented warnings than the baseline allows').toEqual([]);
    const stale = Object.keys(LATEST_BASELINE).filter((id) => !now[id] || now[id].length < LATEST_BASELINE[id].length);
    expect(stale, 'now cleaner than the baseline, shrink world-issues-latest-baseline.json:\n' + stale.join('\n')).toEqual([]);
    expect(now['wi-the-broken-seal-and-the-sure-foundation']).toBeUndefined();
  });
});
