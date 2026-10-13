// @vitest-environment node
//
// payee-entity-learning — the app learns WHO a payment is for from the user's
// choices, with a confidence that grows as it's confirmed, and stops asking once
// it's confident (Christina's user-assisted learning workflow, 2026-07-18).
import { describe, it, expect } from 'vitest';
import {
  matchParty, needsPartyPrompt, learnParty, editParty, forgetParty, listParties,
  PARTY_AUTO_CONFIDENCE,
} from '../lib/payee-entity-learning.js';

const NOW = Date.parse('2026-07-18T12:00:00Z');

describe('learnParty + matchParty — learn once, recognize again', () => {
  it('learns a payee->party mapping and matches it exactly next time', () => {
    let rules = {};
    rules = learnParty(rules, { description: 'ISAIAH RAMOS PLUMBING 07/15', partyType: 'contractor', name: 'Isaiah Ramos' }, NOW);
    const m = matchParty(rules, 'ISAIAH RAMOS PLUMBING 08/02'); // different date tail, same payeeKey
    expect(m.kind).toBe('exact');
    expect(m.rule.partyType).toBe('contractor');
    expect(m.rule.name).toBe('Isaiah Ramos');
    expect(m.confidence).toBe(0.6); // first confirmation
  });

  it('raises confidence each time the same party is confirmed, capped below 1', () => {
    let rules = {};
    for (let i = 0; i < 5; i++) rules = learnParty(rules, { description: 'ACME SUPPLY CO', partyType: 'vendor' }, NOW);
    const m = matchParty(rules, 'ACME SUPPLY CO');
    expect(m.rule.count).toBe(5);
    expect(m.confidence).toBeGreaterThan(PARTY_AUTO_CONFIDENCE); // now auto-applies
    expect(m.confidence).toBeLessThan(1); // never claims full certainty
  });

  it('reclassifying to a DIFFERENT party type resets the confidence count', () => {
    let rules = {};
    rules = learnParty(rules, { description: 'JORDAN LEE', partyType: 'contractor' }, NOW);
    rules = learnParty(rules, { description: 'JORDAN LEE', partyType: 'contractor' }, NOW);
    rules = learnParty(rules, { description: 'JORDAN LEE', partyType: 'employee' }, NOW); // reclassified
    const m = matchParty(rules, 'JORDAN LEE');
    expect(m.rule.partyType).toBe('employee');
    expect(m.rule.count).toBe(1);
    expect(m.confidence).toBe(0.6);
  });
});

describe('similar (variant descriptor) matching', () => {
  it('applies a known payee to a NEW descriptor that contains its tokens, at reduced confidence', () => {
    let rules = {};
    for (let i = 0; i < 6; i++) rules = learnParty(rules, { description: 'CORNERSTONE ELECTRIC', partyType: 'vendor' }, NOW);
    // High exact confidence (>0.7), but a first-seen variant descriptor:
    const m = matchParty(rules, 'CORNERSTONE ELECTRIC LLC PAYMENT');
    expect(m.kind).toBe('similar');
    expect(m.confidence).toBeLessThanOrEqual(PARTY_AUTO_CONFIDENCE); // reduced -> still worth confirming
  });

  it('does not sweep on a single short token', () => {
    let rules = {};
    rules = learnParty(rules, { description: 'ABC', partyType: 'vendor' }, NOW); // one short token
    expect(matchParty(rules, 'ABC HARDWARE STORE')).toBe(null); // too generic to fuzzy-match
  });
});

describe('needsPartyPrompt — the trigger for "Who is this payment for?"', () => {
  it('prompts when unknown or low-confidence; stops once confident', () => {
    let rules = {};
    expect(needsPartyPrompt(rules, 'NEW UNKNOWN PAYEE')).toBe(true);
    rules = learnParty(rules, { description: 'NEW UNKNOWN PAYEE', partyType: 'vendor' }, NOW);
    expect(needsPartyPrompt(rules, 'NEW UNKNOWN PAYEE')).toBe(true); // 0.6 < 0.7 -> still confirm once more
    for (let i = 0; i < 3; i++) rules = learnParty(rules, { description: 'NEW UNKNOWN PAYEE', partyType: 'vendor' }, NOW);
    expect(needsPartyPrompt(rules, 'NEW UNKNOWN PAYEE')).toBe(false); // now confident -> auto
  });

  it('an unkeyable/blank descriptor is never prompted (nothing to learn)', () => {
    expect(needsPartyPrompt({}, '   ')).toBe(false);
  });
});

describe('edit / remove — the user stays in control', () => {
  it('edits a rule label without disturbing its confidence, and removes it', () => {
    let rules = learnParty({}, { description: 'MISLABELED PAYEE', partyType: 'vendor', name: 'Wrong' }, NOW);
    const key = Object.keys(rules)[0];
    rules = editParty(rules, key, { partyType: 'customer', name: 'Right Co' });
    expect(rules[key].partyType).toBe('customer');
    expect(rules[key].name).toBe('Right Co');
    expect(rules[key].confidence).toBe(0.6); // preserved — an edit is a correction, not a new vote
    rules = forgetParty(rules, key);
    expect(rules[key]).toBeUndefined();
  });

  it('listParties sorts most-confirmed first', () => {
    let rules = {};
    rules = learnParty(rules, { description: 'ONCE CO', partyType: 'vendor' }, NOW);
    for (let i = 0; i < 3; i++) rules = learnParty(rules, { description: 'OFTEN CO', partyType: 'vendor' }, NOW);
    const list = listParties(rules);
    expect(list[0].key).toContain('often');
    expect(list[0].count).toBe(3);
  });
});
