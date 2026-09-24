// =============================================================================
// The paste-in intake (DR-0610): every signal proven-to-catch and
// proven-quiet, the quote carried as evidence, the source the database allows,
// the board reading what the intake writes, and the panel writing only what a
// person ticks.
// =============================================================================
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  extractCandidates, candidateToConcern, findDate, findOwner, findWaitsOn, findDecision, parseLine,
  MAX_INTAKE_CHARS, INTAKE_KINDS,
} from '../lib/decision-intake.js';
import { deriveDecisionIntelligence } from '../lib/decision-intelligence.js';
import DecisionIntake from '../components/DecisionIntake.jsx';

const HERE = dirname(fileURLToPath(import.meta.url));
const NOW = Date.parse('2026-09-24T12:00:00Z'); // a Thursday

const TRANSCRIPT = `WEBVTT

1
00:00:01.000 --> 00:00:04.000
<v Sam Reed>We are waiting on the county permit before framing can start.</v>

2
00:00:05.000 --> 00:00:09.000
<v Ana Cruz>I will send the revised budget by Friday.</v>

3
00:00:10.000 --> 00:00:12.000
<v Sam Reed>Good morning everyone, thanks for joining.</v>

4
00:00:13.000 --> 00:00:18.000
<v Ana Cruz>We need a decision on the roofing vendor. The roof bid is still stalled with no response.</v>

5
00:00:19.000 --> 00:00:22.000
<v Sam Reed>The go-live on 10/15 is at risk if the permit slips.</v>
`;

describe('what a line is (the furniture comes off)', () => {
  it('drops cues and timestamps, reads voice tags and speaker labels, never a field label', () => {
    expect(parseLine('00:00:01.000 --> 00:00:04.000')).toBeNull();
    expect(parseLine('WEBVTT')).toBeNull();
    expect(parseLine('<v Sam Reed>hello there</v>')).toEqual({ speaker: 'Sam Reed', text: 'hello there' });
    expect(parseLine('[10:32] Ana: the roof is late')).toEqual({ speaker: 'Ana', text: 'the roof is late' });
    expect(parseLine('- Owner: Sam')).toEqual({ speaker: '', text: 'Owner: Sam' });
    expect(parseLine('  • Risk: permit may slip')).toEqual({ speaker: '', text: 'Risk: permit may slip' });
  });
});

describe('each signal is proven-to-catch and proven-quiet', () => {
  const one = (s) => extractCandidates(s, { nowMs: NOW }).candidates;
  it.each([
    ['dependency', 'Framing is blocked by the county permit.'],
    ['decision', 'We need a decision on the roofing vendor.'],
    ['escalation', 'The roof bid has stalled.'],
    ['timeline', 'The launch is behind schedule.'],
    ['risk', 'There is a risk the donor pulls out.'],
    ['action', 'Action item: call the inspector.'],
  ])('%s catches "%s"', (key, line) => {
    const c = one(line);
    expect(c).toHaveLength(1);
    expect(c[0].primary).toBe(key);
  });
  it('a greeting, a thank-you and small talk propose nothing', () => {
    const r = extractCandidates('Good morning everyone.\nThanks for joining.\nThe weather is nice today.', { nowMs: NOW });
    expect(r.ok).toBe(true);
    expect(r.candidates).toHaveLength(0);
    expect(r.quiet).toBe(3);
  });
});

describe('the fields a candidate carries', () => {
  it('dates: ISO, US, month name, weekday against the clock; nonsense is no date', () => {
    expect(findDate('due 2026-10-15', NOW)).toBe('2026-10-15');
    expect(findDate('go-live 10/15', NOW)).toBe('2026-10-15');
    expect(findDate('by 1/10', NOW)).toBe('2027-01-10');
    expect(findDate('by Oct 3rd', NOW)).toBe('2026-10-03');
    expect(findDate('send it by Friday', NOW)).toBe('2026-09-25');
    expect(findDate('by Thursday', NOW)).toBe('2026-10-01');
    expect(findDate('on 2/30', NOW)).toBe('');
    expect(findDate('no date here', NOW)).toBe('');
  });
  it('owners: labelled, assigned, mentioned, parenthesised, named first, or the speaker saying I will', () => {
    expect(findOwner('Owner: Sam Reed')).toBe('Sam Reed');
    expect(findOwner('Budget assigned to Ana')).toBe('Ana');
    expect(findOwner('@jlee please check the permit')).toBe('jlee');
    expect(findOwner('Send the budget (Ana Cruz)')).toBe('Ana Cruz');
    expect(findOwner('Marcus will call the inspector')).toBe('Marcus');
    expect(findOwner('I will send it Friday', 'Ana Cruz')).toBe('Ana Cruz');
    // proven-quiet: a pronoun or "the team" is not an owner
    expect(findOwner('We will send it Friday')).toBe('');
    expect(findOwner('The team to review')).toBe('');
    expect(findOwner('I will send it Friday')).toBe('');
  });
  it('dependency and decision words are captured as said', () => {
    expect(findWaitsOn('We are waiting on the county permit before framing can start.')).toBe('the county permit before framing can start');
    expect(findDecision('We need a decision on the roofing vendor.')).toBe('the roofing vendor');
  });
});

describe('a real transcript', () => {
  const r = extractCandidates(TRANSCRIPT, { kind: 'transcript', nowMs: NOW });
  it('finds the five things said and skips the greeting', () => {
    expect(r.ok).toBe(true);
    const texts = r.candidates.map((c) => c.text);
    expect(texts).toHaveLength(5);
    expect(texts.join(' ')).not.toMatch(/Good morning/);
  });
  it('each candidate quotes its own line and speaker', () => {
    const permit = r.candidates.find((c) => /county permit/.test(c.text));
    expect(permit.speaker).toBe('Sam Reed');
    expect(permit.line).toBe(5);
    expect(permit.quote).toContain('waiting on the county permit');
    expect(permit.waitsOn).toMatch(/county permit/);
    const budget = r.candidates.find((c) => /budget/.test(c.text));
    expect(budget.owner).toBe('Ana Cruz');
    expect(budget.targetDate).toBe('2026-09-25');
    const golive = r.candidates.find((c) => /go-live/.test(c.text));
    expect(golive.targetDate).toBe('2026-10-15');
  });
  it('the same worry said twice is one candidate that counts both', () => {
    const twice = extractCandidates('Risk: the permit may slip.\nAgain, risk the permit may slip.', { nowMs: NOW });
    expect(twice.candidates).toHaveLength(1);
    expect(twice.candidates[0].count).toBe(2);
    expect(twice.candidates[0].lines).toEqual([1, 2]);
  });
  it('same paste, same clock, same answer', () => {
    expect(extractCandidates(TRANSCRIPT, { kind: 'transcript', nowMs: NOW })).toEqual(r);
  });
  it('an empty or oversized paste says why, never an empty success', () => {
    expect(extractCandidates('   ', { nowMs: NOW }).ok).toBe(false);
    const big = extractCandidates('x'.repeat(MAX_INTAKE_CHARS + 1), { nowMs: NOW });
    expect(big.ok).toBe(false);
    expect(big.reason).toMatch(/in parts/);
  });
});

describe('what the approved row carries', () => {
  const r = extractCandidates(TRANSCRIPT, { kind: 'transcript', nowMs: NOW });
  const permit = r.candidates.find((c) => /county permit/.test(c.text));
  const row = candidateToConcern(permit, { kind: 'transcript', label: 'Weekly sync', area: 'Building fund', pastedAt: '2026-09-24T12:00:00.000Z' });
  it('quotes the words as evidence, names where and which line', () => {
    expect(row.evidence).toContain('Sam Reed: “We are waiting on the county permit');
    expect(row.evidence).toContain('Meeting transcript · Weekly sync, line 5');
    expect(row.area).toBe('Building fund');
    expect(row.status).toBe('open');
    expect(row.links.intake).toMatchObject({ kind: 'transcript', label: 'Weekly sync', line: 5 });
    expect(row.links.waits_on).toMatch(/county permit/);
  });
  it('uses a source the live database allows (concerns_source_check: manual, feedback)', () => {
    const mig = readFileSync(join(HERE, '..', '..', '..', 'infra', 'supabase', 'migrations-auto', '0039-concerns-board.sql'), 'utf8');
    expect(mig).toMatch(/CHECK \(source IN \('manual','feedback'\)\)/);
    expect(['manual', 'feedback']).toContain(row.source);
  });
  it('the board reads what the intake wrote: a named dependency, an ownership gap, a decision', () => {
    const rows = r.candidates.map((c, i) => ({ id: `cn-${i}`, ...candidateToConcern(c, { kind: 'transcript', pastedAt: '' }), updatedAt: '2026-09-24' }));
    const di = deriveDecisionIntelligence({ concerns: rows, nowMs: NOW });
    expect(di.dependencies.some((d) => /county permit/.test(d.waitsOnTitle))).toBe(true);
    expect(di.ownershipGaps.some((g) => /county permit/.test(g.title))).toBe(true);
    expect(di.decisionsRequired.some((d) => /roofing vendor/.test(d.decision))).toBe(true);
    expect(di.timelineThreats.some((t) => /budget/.test(t.title))).toBe(true);
  });
  it('proven-quiet: a row with no waits_on adds no text dependency', () => {
    const di = deriveDecisionIntelligence({ concerns: [{ id: 'a', concern: 'plain', status: 'open', links: {} }], nowMs: NOW });
    expect(di.dependencies).toHaveLength(0);
  });
});

describe('the panel writes only what a person ticks', () => {
  it('finds, lets the reader tick one, and adds exactly that one', () => {
    const addConcern = vi.fn();
    render(<DecisionIntake addConcern={addConcern} nowMs={NOW} />);
    fireEvent.change(screen.getByTestId('intake-text'), { target: { value: TRANSCRIPT } });
    fireEvent.click(screen.getByTestId('intake-find'));
    const items = screen.getAllByTestId('intake-candidate');
    expect(items).toHaveLength(5);
    expect(screen.getByTestId('intake-add').disabled).toBe(true);
    fireEvent.click(screen.getAllByTestId('intake-pick')[1]);
    fireEvent.change(screen.getAllByTestId('intake-owner')[1], { target: { value: 'Ana' } });
    fireEvent.click(screen.getByTestId('intake-add'));
    expect(addConcern).toHaveBeenCalledTimes(1);
    const row = addConcern.mock.calls[0][0];
    expect(row.concern).toMatch(/revised budget/);
    expect(row.owner).toBe('Ana');
    expect(row.source).toBe('manual');
    expect(screen.getByTestId('intake-said').textContent).toMatch(/Added 1 row/);
    // The pasted text is gone after the add: nothing kept beyond the rows.
    expect(screen.getByTestId('intake-text').value).toBe('');
  });
  it('says why when there is nothing to read', () => {
    render(<DecisionIntake addConcern={vi.fn()} nowMs={NOW} />);
    fireEvent.change(screen.getByTestId('intake-text'), { target: { value: 'Good morning.' } });
    fireEvent.click(screen.getByTestId('intake-find'));
    expect(screen.getByTestId('intake-result').textContent).toMatch(/No line names/);
  });
  it('offers no import from an outside ticket or board system (PoeTech owns those)', () => {
    expect(INTAKE_KINDS.map((k) => k.key)).not.toContain('tickets');
  });
  it('is mounted on Projects → Governance above the board', () => {
    const src = readFileSync(join(HERE, '..', 'components', 'Projects.jsx'), 'utf8');
    expect(src.indexOf('<DecisionIntake addConcern={addConcern} />')).toBeGreaterThan(-1);
    expect(src.indexOf('<DecisionIntake')).toBeLessThan(src.indexOf('<DecisionIntelligence concerns'));
  });
});
