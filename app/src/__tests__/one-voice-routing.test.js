// one-voice-routing — the shared router under every input surface.
// "Same system under the hood, just starting on the page of Note": the
// surface sets the default; the WORDS pull the route anywhere in the system.
import { describe, it, expect } from 'vitest';
import { suggestDestination, destinationsFor, DESTINATIONS } from '../lib/one-voice-routing.js';

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
