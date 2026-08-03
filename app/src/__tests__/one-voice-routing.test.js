// one-voice-routing — the shared router under every input surface.
// "Same system under the hood, just starting on the page of Note": the
// surface sets the default; the WORDS pull the route anywhere in the system.
import { describe, it, expect } from 'vitest';
import { suggestDestination, destinationsFor, DESTINATIONS, SUGGEST_MAX_CHARS, composeNoteText } from '../lib/one-voice-routing.js';

describe('suggestDestination', () => {
  it('church surface defaults spiritual, but dev talk routes to PoeTech', () => {
    expect(suggestDestination('Please pray for Sister Mae', 'prayer')).toBe('prayer');
    // Darrell's exact scenario: on the church page, they start talking about
    // development and the PoeTech pipeline — program processes begin.
    expect(suggestDestination('The app should show giving statements for the development pipeline', 'prayer')).toBe('poetech');
  });

  it('notes surface defaults private, but words pull the route anywhere', () => {
    expect(suggestDestination('Just thinking about the week ahead', 'private')).toBe('private');
    expect(suggestDestination('The kitchen faucet is leaking again', 'private')).toBe('work');
    expect(suggestDestination('I think I need counseling for my anxiety', 'private')).toBe('counseling');
    expect(suggestDestination('Question for the Bishop about Sunday sermon', 'private')).toBe('pastor');
    expect(suggestDestination('I can volunteer with the media team', 'private')).toBe('serve');
    expect(suggestDestination('pray for our family', 'private')).toBe('prayer');
  });

  it('counseling outranks work when both appear (the person before the pipe)', () => {
    expect(suggestDestination('need counseling after the flood repair stress', 'private')).toBe('counseling');
  });

  it('empty text returns the surface default', () => {
    expect(suggestDestination('', 'private')).toBe('private');
    expect(suggestDestination('   ', 'prayer')).toBe('prayer');
  });

  // 2026-08-03 incident: a 29k-character dictated conference-review session was
  // silently rerouted to 'work' — and filed as a maintenance incident instead of
  // a note — because the word "paint" appeared once, mid-meeting. A keyword is a
  // signal in a short message and noise in a long dictation.
  it('a LONG dictation stays on the surface default even when keywords appear', () => {
    const longDictation = 'we talked about the assembly and the committee '.repeat(12)
      + 'get all that paint and everything else out of the sanctuary';
    expect(longDictation.length).toBeGreaterThan(SUGGEST_MAX_CHARS);
    expect(suggestDestination(longDictation, 'private')).toBe('private');
    // The same words SHORT still route — the guard is about length, not keywords.
    expect(suggestDestination('get all that paint out of the sanctuary', 'private')).toBe('work');
  });

  it('suggestions are clamped to the destinations the surface offers', () => {
    const notesKeys = destinationsFor('notes').map(d => d.key);
    // 'conference' has no chip on Notes — suggesting it would select an
    // invisible route, so the rule is skipped and the default stands.
    expect(suggestDestination('assembly registration question', 'private', notesKeys)).toBe('private');
    // A destination the surface DOES offer still routes normally.
    expect(suggestDestination('the kitchen faucet is leaking again', 'private', notesKeys)).toBe('work');
  });
});

describe('composeNoteText — the typed label becomes the note title', () => {
  it('prepends the label as a title line; empty label leaves the text alone', () => {
    expect(composeNoteText('we reviewed the assembly', 'Conference Review and Future Plans'))
      .toBe('Conference Review and Future Plans\n\nwe reviewed the assembly');
    expect(composeNoteText('we reviewed the assembly', '')).toBe('we reviewed the assembly');
    expect(composeNoteText('we reviewed the assembly', '   ')).toBe('we reviewed the assembly');
  });
});

describe('destinationsFor', () => {
  it('church gets every door except private; notes gets every door except conference', () => {
    const church = destinationsFor('church').map(d => d.key);
    const notes = destinationsFor('notes').map(d => d.key);
    expect(church).not.toContain('private');
    expect(church).toContain('conference');
    expect(church).toContain('poetech');
    expect(church).toContain('counseling');
    expect(notes).toContain('private');
    expect(notes).not.toContain('conference');
    expect(notes).toContain('work');
    expect(notes.length + church.length).toBe(DESTINATIONS.length * 2 - 2);
  });
});
