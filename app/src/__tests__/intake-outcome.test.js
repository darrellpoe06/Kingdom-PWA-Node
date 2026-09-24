// =============================================================================
// Every intake is carried to an outcome the ecosystem communicates (DR-0625,
// building DR-0621 item 3a). Every categorizer rule and every receipt state is
// pinned here, each one proven to catch (the wrong input lands elsewhere) and
// proven quiet (the right input is not over-claimed).
// =============================================================================
import { describe, it, expect } from 'vitest';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  categorizeIntake, outcomeFor, deliveryWindow, matchDecision, matchHistory, noteParts, basisLine,
  plainReason, tokensOf, categoryCounts, ownerRoleFor, humanDuration, DECIDED_MATCH, FIX_MAX_CHARS,
  CATEGORY_ORDER, INTAKE_CATEGORIES, WINDOW_MIN_SAMPLES,
} from '../lib/intake-outcome.js';
import { readLedger } from '../../../scripts/lib/intake-ledger.mjs';
import { censusOf, renderCensus } from '../../../scripts/intake-census.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REAL_LEDGER = readLedger(join(HERE, '..', '..', '..', 'docs', 'decisions'));
const cat = (text, o = {}) => categorizeIntake({ id: 'n1', text, ...o }, { ledger: o.ledger || null, history: o.history || [] });

// A fixture ledger: one accepted decision about the feedback email, one
// superseded one that must never answer, one proposed one that must never
// answer, and a body of unrelated accepted records so word rarity means what it
// means in the real ledger (a one-record ledger makes every word common).
const FILLER = ['choir schedule rehearsal', 'bus ministry routes drivers', 'books ledger accounts', 'harvest transcripts captions', 'voice studio enrolment consent', 'rentals leases tenants', 'giving statements deposits', 'kitchen inventory counts', 'scripture library themes', 'site health probe uptime', 'tax ingest documents', 'forecast scenarios cash', 'members roster standing', 'video wall budget', 'decision readouts board', 'prompt history private', 'nas loops budget lock', 'store packaging signing', 'lesson intake folders', 'church conference assembly']
  .map((t, i) => ({ id: `DR-07${String(i).padStart(2, '0')}`, title: `The ${t} decision`, status: 'accepted', decision: `The ${t} work is kept as decided for the house.` }));
const LEDGER = {
  ok: true,
  items: [
    ...FILLER,
    { id: 'DR-0900', title: 'Feedback receipts stay in the app, no email transport for feedback', status: 'accepted', decision: 'The app does not send email about feedback. The receipt code and the in-app status are the reference, because the app has no mail transport.' },
    { id: 'DR-0800', title: 'Feedback receipts by email transport', status: 'superseded', decision: 'Send email receipts for feedback through a mail transport.' },
    { id: 'DR-0850', title: 'Feedback email transport receipts proposal', status: 'proposed', decision: 'Maybe send feedback email receipts through a transport.' },
  ],
};

describe('the note is read in its own words', () => {
  it('splits a composed body into working / not working / missing / tags / rating', () => {
    const p = noteParts({ text: 'Working: the choir tab | Not working: the heading says Scedule | Missing: a search | [copy, idea]' });
    expect(p).toMatchObject({ working: 'the choir tab', not: 'the heading says Scedule', missing: 'a search', tags: ['copy', 'idea'] });
    expect(noteParts({ text: 'Rated: love' }).rating).toBe('love');
    expect(noteParts({ whatsNot: 'x', whatsMissing: 'y', categories: ['bug'] })).toMatchObject({ not: 'x', missing: 'y', tags: ['bug'] });
  });
  it('the form’s own "Not working:" label never makes a note a bug (the defect this caught)', () => {
    expect(cat('Not working: the heading on the choir schedule says Scedule').category).toBe('fix');
  });
  it('tokens drop stopwords and short words and stem plurals', () => {
    expect([...tokensOf('The receipts and the codes')].sort()).toEqual(['code', 'receipt']);
  });
});

describe('the categories, rule by rule', () => {
  it('machine telemetry is a signal, not a person’s note', () => {
    const c = cat('[Learn engagement] band=adult signal=started course=x');
    expect(c.category).toBe('signal');
    expect(basisLine(c)).toMatch(/telemetry/i);
  });
  it('a steward’s decline with a reason is "already decided" in the steward’s words', () => {
    const c = cat('Missing: a dark theme please', { triageStatus: 'declined', triageNotes: 'Themes are fixed at five for legibility.' });
    expect(c).toMatchObject({ category: 'decided', basis: { kind: 'steward', reason: 'Themes are fixed at five for legibility.' } });
  });
  it('a decline WITHOUT a reason is not an answer and does not become "decided"', () => {
    expect(cat('Missing: a dark theme please with more colors', { triageStatus: 'declined' }).category).not.toBe('decided');
  });
  it('needs-info asks for the steward’s one thing', () => {
    expect(cat('Not working: the page is odd today', { triageStatus: 'needs-info', triageNotes: 'Which page?' })).toMatchObject({ category: 'ask', basis: { ask: 'Which page?' } });
  });
  it('a reply to an outcome always goes to a person', () => {
    const c = cat('Not working: this is still wrong for me', { replyTo: 'n0', ledger: LEDGER });
    expect(c).toMatchObject({ category: 'work', basis: { kind: 'reply', replyTo: 'n0' } });
  });
  it('a picture with no words asks for a sentence; a rating alone is thanks or an ask', () => {
    expect(cat('', { hasScreenshot: true, screenshotCount: 1 })).toMatchObject({ category: 'ask', basis: { kind: 'no-text' } });
    expect(cat('Rated: love').category).toBe('thanks');
    expect(cat('Rated: rough').category).toBe('ask');
  });
  it('praise in the working box alone is thanks', () => {
    expect(cat('Working: love the church tab').category).toBe('thanks');
  });
  it('fewer than three words asks for one more detail', () => {
    expect(cat('Not working: hmm')).toMatchObject({ category: 'ask', basis: { kind: 'too-short' } });
  });
  it('in-progress / promoted / reviewed / fixed are already on the board', () => {
    for (const s of ['in-progress', 'promoted', 'reviewed', 'fixed']) {
      expect(cat('Not working: the calendar misses a Sunday', { triageStatus: s }).category).toBe('work');
    }
  });
});

describe('low-hanging fruit: the allowlist and its bright lines', () => {
  it('wording, a wrong label, and legibility are fixable, each with its scope', () => {
    expect(cat('Not working: there is a typo on the bus ministry page title')).toMatchObject({ category: 'fix', basis: { rule: 'wording', scope: 'copy' } });
    expect(cat('Not working: the heading on the choir schedule says Scedule')).toMatchObject({ category: 'fix', basis: { rule: 'label', scope: 'copy' } });
    expect(cat('Not working: text is too small on the bus page')).toMatchObject({ category: 'fix', basis: { rule: 'legibility', scope: 'style' } });
  });
  it('the "copy" category chip alone makes it wording, unless it is also marked a bug', () => {
    expect(cat('Not working: the sentence at the top of choir week | [copy]').category).toBe('fix');
    expect(cat('Not working: the sentence at the top of choir week | [copy, bug]').category).not.toBe('fix');
  });
  it('PROVEN TO CATCH: money, sign-in, data and the Word are never auto-fixed, however small', () => {
    for (const t of [
      'Not working: typo on the Give button',
      'Not working: typo on the sign in screen',
      'Not working: the wording on the donation receipt',
      'Not working: a typo in the verse on the Scripture tab',
      'Not working: the label says Yahweh wrong on the home page',
      'Not working: typo in the password reset heading',
    ]) {
      expect(cat(t).category, t).not.toBe('fix');
    }
  });
  it('PROVEN TO CATCH: a serious class (data loss, sign-in, privacy, broken) is never low-hanging', () => {
    expect(cat('Not working: my notes disappeared and the typo is still there').category).toBe('work');
    expect(cat('Not working: the page is broken and the wording is off').category).toBe('work');
  });
  it(`a long note (over ${FIX_MAX_CHARS} characters) is not low-hanging`, () => {
    expect(cat(`Not working: typo ${'and more words '.repeat(40)}`).category).not.toBe('fix');
  });
});

describe('already decided: the ledger match cites the record and its reason', () => {
  it('matches an accepted record and cites its id, title and first sentence of the decision', () => {
    const c = cat('Missing: please send an email receipt for my feedback through a mail transport', { ledger: LEDGER });
    expect(c.category).toBe('decided');
    expect(c.basis).toMatchObject({ kind: 'ledger', dr: 'DR-0900' });
    expect(c.basis.reason).toBe('The app does not send email about feedback.');
    expect(basisLine(c)).toMatch(/DR-0900/);
  });
  it('PROVEN TO CATCH: a superseded or proposed record never answers', () => {
    const only = { ok: true, items: LEDGER.items.filter((i) => i.id !== 'DR-0900') };
    expect(cat('Missing: please send an email receipt for my feedback through a mail transport', { ledger: only }).category).toBe('work');
  });
  it('PROVEN TO CATCH: a bug report is never answered with "already decided"', () => {
    expect(cat('Not working: the feedback email receipt transport is broken', { ledger: LEDGER }).category).toBe('work');
  });
  it('PROVEN QUIET: too few shared words do not match', () => {
    expect(matchDecision('email me please', LEDGER)).toBeNull();
    expect(matchDecision('the choir schedule needs a search box for songs', LEDGER)).toBeNull();
  });
  it('the thresholds are what the tests assume', () => {
    expect(DECIDED_MATCH).toMatchObject({ minShared: 4, minRareShared: 3, minCoverage: 0.6, minTitleShared: 2 });
  });
  it('a newer record on the same subject governs the one it amends (the REAL ledger: DR-0248 over DR-0110)', () => {
    const m = matchDecision('the kill switch should be back on the deterministic automation loops', REAL_LEDGER);
    expect(m && m.id).toBe('DR-0248');
  });
  it('the real ledger is read, and records without a decision cannot answer', () => {
    expect(REAL_LEDGER.count).toBeGreaterThan(500);
    expect(REAL_LEDGER.items.some((i) => i.decision)).toBe(true);
  });
  it('plainReason gives the first full sentence, never a painted summary', () => {
    expect(plainReason('1. The app keeps it. More words follow here.')).toBe('The app keeps it. More words follow here.');
    expect(plainReason('The house does not send email about feedback. Second sentence.')).toBe('The house does not send email about feedback.');
    expect(plainReason('')).toBe('');
  });
});

describe('already decided: a steward’s earlier word on the same thing', () => {
  const earlier = { id: 'e1', text: 'Missing: a purple theme for the choir pages', triageStatus: 'declined', triageNotes: 'Five themes, chosen for legibility.' };
  it('a close match to an earlier declined note is decided, with that reason', () => {
    const c = cat('Missing: a purple theme for the choir pages please', { history: [earlier] });
    expect(c).toMatchObject({ category: 'decided', basis: { kind: 'history', earlierId: 'e1', reason: 'Five themes, chosen for legibility.' } });
  });
  it('a close match to an earlier FIXED note is work (it came back), never decided', () => {
    const c = cat('Missing: a purple theme for the choir pages please', { history: [{ ...earlier, triageStatus: 'fixed' }] });
    expect(c).toMatchObject({ category: 'work', basis: { kind: 'history', earlierStatus: 'fixed' } });
  });
  it('PROVEN QUIET: a different note does not match, and a note never matches itself', () => {
    expect(matchHistory('the bus route map is empty on Sunday', [earlier])).toBeNull();
    expect(matchHistory('Missing: a purple theme for the choir pages', [earlier], 'e1')).toBeNull();
  });
});

describe('real work, and unknown stays unknown', () => {
  it('a recognized class is work with its rule', () => {
    expect(cat('Not working: my transactions disappeared after reload')).toMatchObject({ category: 'work', basis: { kind: 'rule', rule: 'data-loss' } });
  });
  it('an unrecognized note is work, said as unknown, never guessed', () => {
    const c = cat('Missing: a percentage canary rollout for deployments');
    expect(c).toMatchObject({ category: 'work', basis: { kind: 'unknown' } });
    expect(basisLine(c)).toBe('No rule matched; a person reads it.');
  });
  it('the owner is a role, from the area', () => {
    expect(ownerRoleFor('work', 'church-bus')).toMatch(/church office/);
    expect(ownerRoleFor('work', 'tlc')).toMatch(/TLC office/);
    expect(ownerRoleFor('work', 'books')).toMatch(/PoeTech stewards/);
    expect(ownerRoleFor('fix', 'x')).toMatch(/agent/);
  });
});

describe('the window is measured, never invented', () => {
  const merge = (h, branch = 'claude/x') => ({ branch, createdAt: '2026-09-24T00:00:00Z', mergedAt: new Date(Date.parse('2026-09-24T00:00:00Z') + h * 3600000).toISOString() });
  it(`fewer than ${WINDOW_MIN_SAMPLES} samples = no window, said plainly`, () => {
    const w = deliveryWindow({ merges: [merge(1), merge(2)] });
    expect(w.ok).toBe(false);
    expect(w.text).toMatch(/too few/);
  });
  it('the lane median and 90th percentile come from the merged changes and are named as lane time', () => {
    const w = deliveryWindow({ merges: [0.2, 0.4, 0.5, 0.6, 1, 2].map((h) => merge(h)) });
    expect(w).toMatchObject({ ok: true, measure: 'lane', n: 6 });
    expect(w.p50Hours).toBeCloseTo(0.55, 5);
    expect(w.text).toMatch(/Once a change for it is opened/);
    expect(w.text).toMatch(/33 minutes/);
  });
  it('system fixes use their own record once there are enough of them', () => {
    const own = [1, 1, 1, 1, 1].map((h) => merge(h, 'claude/intake-fix-abc'));
    const w = deliveryWindow({ merges: [...own, merge(10), merge(10)], cls: 'fix' });
    expect(w.n).toBe(5);
    expect(w.text).toMatch(/system fixes/);
  });
  it('intake-to-outcome wins when there are enough notes that reached an outcome', () => {
    const outcomes = [2, 4, 6, 8, 10].map((h) => ({ category: 'work', submittedAt: '2026-09-01T00:00:00Z', outcomeAt: new Date(Date.parse('2026-09-01T00:00:00Z') + h * 3600000).toISOString() }));
    const w = deliveryWindow({ merges: [], outcomes, cls: 'work' });
    expect(w).toMatchObject({ ok: true, measure: 'intake-to-outcome', n: 5 });
    expect(w.text).toMatch(/median of 6 hours/);
  });
  it('humanDuration says minutes, hours and days plainly', () => {
    expect(humanDuration(0.44)).toBe('26 minutes');
    expect(humanDuration(1)).toBe('1 hour');
    expect(humanDuration(72)).toBe('3 days');
    expect(humanDuration(NaN)).toBe('unknown');
  });
});

describe('what the sender reads, state by state', () => {
  const merges = [0.2, 0.4, 0.5, 0.6, 1].map((h) => ({ branch: 'claude/x', createdAt: '2026-09-24T00:00:00Z', mergedAt: new Date(Date.parse('2026-09-24T00:00:00Z') + h * 3600000).toISOString() }));
  const out = (item, o = {}) => outcomeFor(item, categorizeIntake(item, { ledger: o.ledger || null }), { delivery: { merges }, fix: o.fix || null });
  it('fixed says what changed and the record', () => {
    const o = out({ id: 'a', text: 'Not working: typo on the bus page', triageStatus: 'fixed', outcomeNote: 'The bus page title is spelled right.', outcomeRef: '#1800' });
    expect(o).toMatchObject({ key: 'fixed', label: 'Fixed', detail: 'What changed: The bus page title is spelled right.', ref: '#1800' });
  });
  it('a merged fix-queue row reads fixed with its pull request', () => {
    const o = out({ id: 'a', text: 'Not working: typo on the bus page' }, { fix: { status: 'merged', prNumber: 1801, prTitle: 'Bus page title spelled right' } });
    expect(o).toMatchObject({ key: 'fixed', detail: 'What changed: Bus page title spelled right', ref: '#1801' });
  });
  it('already decided gives the plain reason and the record cited', () => {
    const o = out({ id: 'a', text: 'Missing: please send an email receipt for my feedback through a mail transport' }, { ledger: LEDGER });
    expect(o).toMatchObject({ key: 'decided', reason: 'The app does not send email about feedback.' });
    expect(o.cite).toMatch(/^DR-0900 — Feedback receipts stay in the app/);
    expect(o.detail).toMatch(/reply and a person will read it/);
  });
  it('on the board gives the owner role and a measured window', () => {
    const o = out({ id: 'a', text: 'Not working: my transactions disappeared after reload', which_tab: 'books' });
    expect(o).toMatchObject({ key: 'on-board', label: 'On the board' });
    expect(o.owner).toMatch(/PoeTech stewards/);
    expect(o.window).toMatch(/measured over the last 5 merged/);
  });
  it('being worked on when a steward picked it up', () => {
    expect(out({ id: 'a', text: 'Not working: the calendar skips Sunday', triageStatus: 'in-progress' }).key).toBe('working');
  });
  it('asked for one thing names the one thing', () => {
    expect(out({ id: 'a', text: 'Not working: hmm' })).toMatchObject({ key: 'needs-info', detail: 'A little more: where in the app, and what happened?' });
  });
  it('low-hanging fruit says the system is fixing it, then that the fix is in review', () => {
    expect(out({ id: 'a', text: 'Not working: typo on the bus page title' })).toMatchObject({ key: 'fixing', label: 'Being fixed by the system' });
    expect(out({ id: 'a', text: 'Not working: typo on the bus page title' }, { fix: { status: 'opened', prNumber: 9 } })).toMatchObject({ key: 'fixing', label: 'Fix in review' });
  });
  it('a failed system fix is carried by a person, and the sender is told so', () => {
    const o = out({ id: 'a', text: 'Not working: typo on the bus page title' }, { fix: { status: 'failed' } });
    expect(o).toMatchObject({ key: 'on-board', category: 'work' });
    expect(o.detail).toMatch(/did not pass the checks/);
  });
  it('thanks, and telemetry is never shown as a note', () => {
    expect(out({ id: 'a', text: 'Rated: love' }).key).toBe('thanks');
    expect(out({ id: 'a', text: '[Learn engagement] band=adult signal=started' })).toMatchObject({ key: 'signal', replyable: false });
  });
});

describe('the counts and the census', () => {
  it('categoryCounts carries every category, zero included', () => {
    expect(Object.keys(categoryCounts([]))).toEqual(CATEGORY_ORDER);
    expect(Object.keys(INTAKE_CATEGORIES)).toEqual(CATEGORY_ORDER);
  });
  it('the census counts rows by category and never prints a whole note', () => {
    const long = `Not working: typo on the bus page title and someone@example.com wrote it ${'x'.repeat(120)}`;
    const c = censusOf({ feedback: [
      { id: '11111111-1111-4111-8111-111111111111', submitted_at: '2026-09-01T00:00:00Z', feedback_text: long, triage_status: 'new' },
      { id: '22222222-2222-4222-8222-222222222222', submitted_at: '2026-09-02T00:00:00Z', feedback_text: '[Learn engagement] band=adult signal=started', triage_status: 'new' },
      { id: '33333333-3333-4333-8333-333333333333', submitted_at: '2026-09-03T00:00:00Z', feedback_text: 'Missing: please send an email receipt for my feedback through a mail transport', triage_status: 'new' },
    ], door: [{ id: 'd1', body: 'the doors are locked on Sunday morning', status: 'new' }] }, LEDGER);
    expect(c.counts).toMatchObject({ fix: 1, signal: 1, decided: 1 });
    expect(c.doorCounts.work).toBe(1);
    const text = renderCensus(c);
    expect(text).toMatch(/feedback rows read: 3/);
    expect(text).not.toMatch(/someone@example\.com/);
    expect(text).not.toMatch(/x{100}/);
    expect(text).toMatch(/DR-0900/);
  });
});
