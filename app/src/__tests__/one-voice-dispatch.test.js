// @vitest-environment node
//
// Characterization test for the OneVoiceInput dispatch (PR #154 consolidation).
// When ChurchOneVoice.send() + ThinkingSpace.save() were merged into one
// component, the risk was a SILENT behavior change — a route quietly landing
// somewhere different than before. This pins the routing→action matrix for BOTH
// surfaces to exactly what the two originals did, so "consolidated" is PROVEN
// behavior-preserving, not assumed (the quality-bar point: verify what the code
// is designed to do, don't iterate on expectation).
import { describe, it, expect } from 'vitest';
import { planDispatch } from '../lib/one-voice-routing.js';

// The CHURCH surface passed: prayer, conference, poetech, incident, inquiry,
// churchVoice — and NO note handler; saveNoteOnCounseling = false.
const CHURCH = { poetech: true, prayer: true, churchVoice: true, conference: true, incident: true, inquiry: true, note: false };
// The NOTES surface passed: note, poetech, prayer, churchVoice, incident,
// inquiry — and NO conference; saveNoteOnCounseling = true.
const NOTES = { poetech: true, prayer: true, churchVoice: true, conference: false, incident: true, inquiry: true, note: true };

describe('planDispatch — CHURCH surface matrix (== old ChurchOneVoice.send())', () => {
  const plan = (route) => planDispatch(route, CHURCH, false);
  it('prayer → prayer list', () => expect(plan('prayer').action).toBe('prayer'));
  it('conference → Assembly feedback', () => expect(plan('conference').action).toBe('conference'));
  it('poetech → build inbox', () => expect(plan('poetech').action).toBe('poetech'));
  it('work → Action Queue incident', () => expect(plan('work').action).toBe('work'));
  it('pastor → pastoral voice note', () => expect(plan('pastor').action).toBe('pastor'));
  it('serve → serving voice note', () => expect(plan('serve').action).toBe('serve'));
  it('counseling → inquiry, and does NOT keep a private note (church kept none)', () => {
    const p = plan('counseling');
    expect(p.action).toBe('counseling');
    expect(p.savesPrivateNote).toBe(false);
  });
  it('an unhandled/general route → a general voice note (church has no private note)', () => {
    expect(plan('private').action).toBe('fallback-voice');
    expect(plan('something-else').action).toBe('fallback-voice');
  });
});

describe('planDispatch — NOTES surface matrix (== old ThinkingSpace.save())', () => {
  const plan = (route) => planDispatch(route, NOTES, true);
  it('private → a private device-local note', () => {
    const p = plan('private');
    expect(p.action).toBe('private');
    expect(p.savesPrivateNote).toBe(true);
  });
  it('poetech / prayer / pastor / serve / work route the same as church', () => {
    expect(plan('poetech').action).toBe('poetech');
    expect(plan('prayer').action).toBe('prayer');
    expect(plan('pastor').action).toBe('pastor');
    expect(plan('serve').action).toBe('serve');
    expect(plan('work').action).toBe('work');
  });
  it('counseling → inquiry AND ALSO keeps the private note (the notes-surface behavior)', () => {
    const p = plan('counseling');
    expect(p.action).toBe('counseling');
    expect(p.savesPrivateNote).toBe(true);
  });
  it('conference (not offered on notes) falls back to a private note, not a dropped message', () => {
    expect(plan('conference').action).toBe('fallback-note');
  });
  it('any unhandled route falls back to a private note (nothing is silently lost)', () => {
    expect(plan('whatever').action).toBe('fallback-note');
  });
});

describe('planDispatch — a route whose handler is absent never silently no-ops', () => {
  it('with NO handlers at all, returns action:none + no confirmation (caller shows nothing)', () => {
    const p = planDispatch('prayer', {}, false);
    expect(p.action).toBe('none');
    expect(p.confirmationKey).toBe(null);
  });
  it('confirmation key always matches the action taken', () => {
    expect(planDispatch('prayer', CHURCH, false).confirmationKey).toBe('prayer');
    expect(planDispatch('private', NOTES, true).confirmationKey).toBe('private');
    expect(planDispatch('conference', NOTES, true).confirmationKey).toBe('private'); // fallback note
  });
});
