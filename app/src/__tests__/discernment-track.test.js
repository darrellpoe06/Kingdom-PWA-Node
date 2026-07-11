// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  CLAIM_LABELS, CLAIM_LABEL_IDS, FACT_STATUS_IDS,
  normalizeIssue, buildDiscernmentModule, buildDiscernmentSchedule, discernmentProgressSummary,
  lintClaimsLabeled, lintSourcesCited, lintEvenhanded, lintNoOneSidedPersuasion, lintAgeAppropriate,
  auditIssue, auditAllIssues,
} from '../lib/discernment-track.js';

// A minimal, fully-VALID issue fixture (every safeguard satisfied). Each
// proven-to-catch test below BREAKS exactly one field and asserts the matching
// linter fires — so a green audit means something (DR-0076, anti-theater).
function validIssue(overrides = {}) {
  return {
    id: 'fixture-issue',
    title: 'A claim — how to think it through',
    skill: 'Separate documented fact from interpretation and weigh it in the light of Scripture.',
    subject: { name: 'A Public Figure', kind: 'public-figure', isNamedRealPerson: true },
    source: { creator: 'A Creator', medium: 'video', title: 'The Critique', asOf: '2026-06-25' },
    claims: [
      { id: 'c1', text: 'The figure did X.', label: 'allegation', attribution: 'A Creator (video)' },
      { id: 'c2', text: 'People should boycott.', label: 'call-to-action', attribution: 'A Creator (video)' },
    ],
    verifiable: [
      { id: 'f1', statement: 'A permit was filed.', status: 'documented', sources: [{ title: 'Agency record', publisher: 'County', asOf: '2025-07-02' }] },
    ],
    interpretation: [{ id: 'n1', statement: 'Therefore the figure is malicious — an inference, not a fact.' }],
    perspectives: [
      { id: 'v1', label: 'The critics', steelman: 'The strongest case the critics make is real and documented harm.' },
      { id: 'v2', label: 'The defenders', steelman: 'The strongest case the defenders make is lawful process and disputed motive.' },
    ],
    lens: {
      fourD: { deepSource: 'Scripture engages injustice with truth and grace.', scripture: 'Micah 6:8' },
      threeD: 'Care about the real people affected; do not let outrage own you.',
      benefits: ['Calm in a loud world', 'Sharper source-checking', 'Both courts: some judgment in this life, all of it in the eternal court after this life (Ecclesiastes 12:14; Hebrews 9:27).'],
      graceNote: 'Name a wrong without condemning a person made in God\'s image.',
      accountability: { statement: 'The wrongdoer owes confession and restitution; every dismissed or hidden thing still enters the eternal court.', scripture: 'Ecclesiastes 12:14; Numbers 5:7' },
      stewardship: 'Steward your attention and your dollar wisely.',
      anchor: { ref: 'Proverbs 18:17', theme: 'The one who states his case first seems right, until the other comes and examines him.' },
    },
    reflection: {
      prompts: ['What was documented vs interpreted?', 'Can you state the other side fairly?'],
      skill: 'Check the primary source before you believe or share.',
      practice: 'Find one primary source for one claim and write one sentence.',
    },
    levels: {
      child: 'Before you believe something big about a person, check who said it and whether it really happened. Be fair to everyone.',
      teen: 'Pull apart what is proven from what is just someone\'s opinion, and hear both sides before you decide.',
      senior: 'Weigh the claim against the record and against Scripture, with truth and grace.',
    },
    quiz: {
      questions: [
        { q: 'Is a labeled allegation the same as a proven verdict?', options: ['Yes', 'No — it must be checked'], answer: 1 },
      ],
    },
    ...overrides,
  };
}

describe('vocabulary', () => {
  it('exposes claim labels including call-to-action', () => {
    expect(CLAIM_LABEL_IDS).toEqual(expect.arrayContaining(['allegation', 'claim', 'opinion', 'call-to-action']));
    expect(CLAIM_LABELS.every((l) => l.label && l.hint)).toBe(true);
    expect(FACT_STATUS_IDS).toEqual(expect.arrayContaining(['documented', 'partly-documented', 'disputed']));
  });
});

describe('normalizeIssue', () => {
  it('fills defaults for a lean issue without throwing', () => {
    const n = normalizeIssue({ id: 'x' });
    expect(n.id).toBe('x');
    expect(Array.isArray(n.claims)).toBe(true);
    expect(Array.isArray(n.perspectives)).toBe(true);
    expect(n.lens.anchor.ref).toBe('');
    expect(n.subject.isNamedRealPerson).toBe(false);
  });
  it('does not mutate the input', () => {
    const input = { id: 'x', claims: [{ id: 'c' }] };
    const snapshot = JSON.stringify(input);
    normalizeIssue(input);
    expect(JSON.stringify(input)).toBe(snapshot);
  });
});

describe('a fully valid issue passes the gate', () => {
  it('auditIssue.ok === true with no errors', () => {
    const res = auditIssue(validIssue());
    expect(res.errors).toEqual([]);
    expect(res.ok).toBe(true);
  });
});

// -----------------------------------------------------------------------------
// PROVEN-TO-CATCH — each safeguard must FAIL on a deliberate break. A gate that
// always passes is itself a lie (DR-0076).
// -----------------------------------------------------------------------------
describe('safeguard: claims must be labeled + attributed (Stage 1)', () => {
  it('catches an unlabeled claim', () => {
    const v = lintClaimsLabeled(validIssue({ claims: [{ id: 'c1', text: 'X', label: '', attribution: 'A Creator' }] }));
    expect(v.some((e) => e.code === 'claims/unlabeled' && e.severity === 'error')).toBe(true);
  });
  it('catches an unattributed claim', () => {
    const v = lintClaimsLabeled(validIssue({ claims: [{ id: 'c1', text: 'X', label: 'claim', attribution: '' }] }));
    expect(v.some((e) => e.code === 'claims/unattributed')).toBe(true);
  });
  it('catches having no claims at all', () => {
    const v = lintClaimsLabeled(validIssue({ claims: [] }));
    expect(v.some((e) => e.code === 'claims/none')).toBe(true);
  });
});

describe('safeguard: facts must cite a dated source (Stage 2)', () => {
  it('catches a fact with no source', () => {
    const v = lintSourcesCited(validIssue({ verifiable: [{ id: 'f1', statement: 'X', status: 'documented', sources: [] }] }));
    expect(v.some((e) => e.code === 'facts/no-source' && e.severity === 'error')).toBe(true);
  });
  it('catches a source with no as-of date', () => {
    const v = lintSourcesCited(validIssue({ verifiable: [{ id: 'f1', statement: 'X', status: 'documented', sources: [{ title: 'Record', asOf: '' }] }] }));
    expect(v.some((e) => e.code === 'facts/source-no-asof')).toBe(true);
  });
  it('catches a fact with no documentation status', () => {
    const v = lintSourcesCited(validIssue({ verifiable: [{ id: 'f1', statement: 'X', status: '', sources: [{ title: 'Record', asOf: '2025-01-01' }] }] }));
    expect(v.some((e) => e.code === 'facts/no-status')).toBe(true);
  });
});

describe('safeguard: accountability stated plainly (the two courts)', () => {
  it('catches a named-person lesson with documented harm but NO accountability statement', () => {
    const issue = validIssue();
    issue.lens = { ...issue.lens, accountability: { statement: '', scripture: '' } };
    const res = auditIssue(issue);
    expect(res.ok).toBe(false);
    expect(res.errors.some((e) => e.code === 'accountability/missing')).toBe(true);
  });
  it('passes when accountability is stated', () => {
    expect(auditIssue(validIssue()).ok).toBe(true);
  });
});

describe('safeguard: the two courts are VISIBLE in the benefits (DR-0170)', () => {
  it('catches a documented-accountability lesson whose benefits never name the eternal court', () => {
    const issue = validIssue();
    issue.lens = { ...issue.lens, benefits: ['Calm in a loud world', 'Sharper source-checking'] };
    const res = auditIssue(issue);
    expect(res.ok).toBe(false);
    expect(res.errors.some((e) => e.code === 'accountability/eternal-court-not-in-benefits')).toBe(true);
  });
  it('passes when a benefit names both courts / the eternal reward', () => {
    expect(auditIssue(validIssue()).ok).toBe(true);
  });
  it('does NOT require it when the lesson has no documented harm (unless it is about that subject)', () => {
    const issue = validIssue();
    issue.verifiable = [{ id: 'f1', statement: 'An unproven claim.', status: 'disputed', sources: [{ title: 'x', publisher: 'y', asOf: '2025-01-01' }] }];
    issue.lens = { ...issue.lens, benefits: ['Calm in a loud world'] };
    const res = auditIssue(issue);
    expect(res.errors.some((e) => e.code === 'accountability/eternal-court-not-in-benefits')).toBe(false);
  });
});

describe('safeguard: evenhanded — >= 2 steelmanned perspectives (Stage 3)', () => {
  it('catches a one-sided lesson', () => {
    const v = lintEvenhanded(validIssue({ perspectives: [{ id: 'v1', label: 'One side', steelman: 'only this side' }] }));
    expect(v.some((e) => e.code === 'perspectives/too-few' && e.severity === 'error')).toBe(true);
  });
  it('catches a perspective listed without a steelman', () => {
    const v = lintEvenhanded(validIssue({
      perspectives: [
        { id: 'v1', label: 'A', steelman: 'strong A' },
        { id: 'v2', label: 'B', steelman: '' },
      ],
    }));
    expect(v.some((e) => e.code === 'perspectives/no-steelman')).toBe(true);
  });
});

describe('safeguard: no one-sided persuasion against a named person (Stage 4)', () => {
  it('catches a missing grace-note', () => {
    const iss = validIssue();
    iss.lens.graceNote = '';
    const v = lintNoOneSidedPersuasion(iss);
    expect(v.some((e) => e.code === 'persuasion/no-grace')).toBe(true);
  });
  it('catches a boycott directive in the lesson\'s OWN voice', () => {
    const iss = validIssue();
    iss.reflection.skill = 'You should boycott this person and cancel him.';
    const v = lintNoOneSidedPersuasion(iss);
    expect(v.some((e) => e.code === 'persuasion/directive' && e.severity === 'error')).toBe(true);
  });
  it('does NOT fire on a boycott CLAIM that is labeled + attributed (reported, not asserted)', () => {
    // The call-to-action lives only as a labeled creator claim — that is allowed.
    const v = lintNoOneSidedPersuasion(validIssue());
    expect(v.some((e) => e.code === 'persuasion/directive')).toBe(false);
  });
  it('does NOT fire when the lesson NEUTRALLY discusses a boycott (the noun, not the directive)', () => {
    // A discernment lesson must be able to reference the creator's boycott call
    // as one option among several without being flagged as adopting it.
    const iss = validIssue();
    iss.reflection.prompts = ['The creator calls for a boycott; others protest, others build alternatives. What would righteous engagement look like for you?'];
    const v = lintNoOneSidedPersuasion(iss);
    expect(v.some((e) => e.code === 'persuasion/directive')).toBe(false);
  });
  it('does not apply to non-named-person topics', () => {
    const v = lintNoOneSidedPersuasion(validIssue({ subject: { name: 'A topic', kind: 'topic', isNamedRealPerson: false }, lens: { ...validIssue().lens, graceNote: '' } }));
    expect(v).toEqual([]);
  });
});

describe('safeguard: age-appropriate (kids use the app)', () => {
  it('catches a missing child rendering', () => {
    const v = lintAgeAppropriate(validIssue({ levels: { teen: 'only teen' } }));
    expect(v.some((e) => e.code === 'age/no-child')).toBe(true);
  });
  it('catches charged terms in the child rendering', () => {
    const v = lintAgeAppropriate(validIssue({ levels: { child: 'This person is a racist and that is genocide.' } }));
    expect(v.some((e) => e.code === 'age/child-unsafe')).toBe(true);
  });
});

describe('auditIssue aggregates and fails on any error', () => {
  it('fails when any single safeguard is broken', () => {
    const res = auditIssue(validIssue({ perspectives: [{ id: 'v1', label: 'one', steelman: 'one' }] }));
    expect(res.ok).toBe(false);
    expect(res.errors.length).toBeGreaterThan(0);
  });
  it('auditAllIssues maps over a set', () => {
    const all = auditAllIssues([validIssue(), validIssue({ id: 'two' })]);
    expect(all).toHaveLength(2);
    expect(all.every((r) => r.ok)).toBe(true);
  });
});

// -----------------------------------------------------------------------------
// PROJECTION — the issue rides the shared Learn module shape (no fork).
// -----------------------------------------------------------------------------
describe('buildDiscernmentModule projects to the Learn module shape', () => {
  const m = buildDiscernmentModule(validIssue());
  it('produces the fields ChurchLearn renders', () => {
    expect(m.id).toBe('fixture-issue');
    expect(m.title).toBeTruthy();
    expect(m.bigIdea).toBeTruthy();
    expect(m.anchor.ref).toBe('Proverbs 18:17');
    expect(Array.isArray(m.benefits)).toBe(true);
    expect(m.facilitator.talkingPoints.length).toBeGreaterThan(0);
    expect(m.facilitator.discussionPrompts.length).toBeGreaterThan(0);
  });
  it('carries the structured issue for the five-stage renderer', () => {
    expect(m.issue).toBeTruthy();
    expect(m.issue.claims.every((c) => c.label && c.attribution)).toBe(true);
  });
  it('weaves all five stages into the facilitator lesson prose', () => {
    expect(m.lesson).toContain('STAGE 1');
    expect(m.lesson).toContain('STAGE 2');
    expect(m.lesson).toContain('STAGE 3');
    expect(m.lesson).toContain('STAGE 4');
    expect(m.lesson).toContain('STAGE 5');
  });
});

describe('self-paced schedule + progress', () => {
  it('numbers rows with no painted date', () => {
    const sched = buildDiscernmentSchedule([validIssue(), validIssue({ id: 'two' })]);
    expect(sched).toHaveLength(2);
    expect(sched[0].week).toBe(1);
    expect(sched[0].date).toBeNull();
  });
  it('counts real progress', () => {
    const summary = discernmentProgressSummary([validIssue(), validIssue({ id: 'two' })], { 'fixture-issue': true });
    expect(summary).toMatchObject({ done: 1, total: 2, pct: 50 });
  });
});
