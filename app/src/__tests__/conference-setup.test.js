// conference-setup — the setup checklist / config skeleton logic. Proves it reads
// REAL state (known facts -> done; blanks -> todo with no fabricated value) and
// computes honest progress. Pairs with the setup RUNBOOK + DR-0076 (measure).
import { describe, it, expect } from 'vitest';
import { conferenceSetupSteps, setupProgress } from '../lib/conference-setup.js';

const byKey = (steps, k) => steps.find((s) => s.key === k);

describe('conferenceSetupSteps — known facts done, blanks explicit', () => {
  it('marks an empty conference: name/dates/schedule TODO, no fabricated values', () => {
    const steps = conferenceSetupSteps({ conference: null, venues: [], rooms: [], sessions: [], registrations: [] });
    expect(byKey(steps, 'name').status).toBe('todo');
    expect(byKey(steps, 'dates').status).toBe('todo');
    expect(byKey(steps, 'dates').value).toBe('— not set —');   // never invented
    expect(byKey(steps, 'schedule').status).toBe('todo');
    expect(byKey(steps, 'venue').status).toBe('todo');
  });

  it('marks the seeded KNOWN facts (South Campus + rooms) as done', () => {
    const steps = conferenceSetupSteps({
      conference: { name: '77th National Assembly', theme: 'Reviving Faith', datesLabel: '' },
      venues: [{ name: 'South Campus Event Center', address: '1109 N 4th Street, Champaign, IL', status: 'active' }],
      rooms: [
        { name: 'Main Sanctuary', capacity: 600, useTypes: ['service'], status: 'active' },
        { name: 'Bathrooms', capacity: null, useTypes: ['facility'], status: 'active' },
      ],
      sessions: [], registrations: [],
    });
    expect(byKey(steps, 'name').status).toBe('done');
    expect(byKey(steps, 'theme').status).toBe('done');
    expect(byKey(steps, 'venue').status).toBe('done');
    expect(byKey(steps, 'venue').value).toMatch(/South Campus/);
    // Rooms present + the only capacity-less room is a non-bookable facility -> done.
    expect(byKey(steps, 'rooms').status).toBe('done');
    // Dates still blank even though name/theme are set.
    expect(byKey(steps, 'dates').status).toBe('todo');
  });

  it('flags rooms PARTIAL when a bookable room has no seat count', () => {
    const steps = conferenceSetupSteps({
      conference: { name: 'X' },
      venues: [{ name: 'South Campus Event Center', status: 'active' }],
      rooms: [
        { name: 'Main Sanctuary', capacity: null, useTypes: ['service'], status: 'active' }, // bookable, no cap
        { name: 'Kitchen', capacity: null, useTypes: ['food'], status: 'active' },            // bookable, no cap
        { name: 'Bathrooms', capacity: null, useTypes: ['facility'], status: 'active' },      // facility, ignored
      ],
      sessions: [], registrations: [],
    });
    const rooms = byKey(steps, 'rooms');
    expect(rooms.status).toBe('partial');
    expect(rooms.hint).toMatch(/Main Sanctuary/);
    expect(rooms.hint).toMatch(/Kitchen/);
    expect(rooms.hint).not.toMatch(/Bathrooms/);
  });

  it('marks schedule done once sessions exist', () => {
    const steps = conferenceSetupSteps({ conference: { name: 'X' }, sessions: [{ title: 'Evening Worship', status: 'active' }] });
    expect(byKey(steps, 'schedule').status).toBe('done');
    expect(byKey(steps, 'schedule').value).toMatch(/1 session/);
  });

  it('reports a real attendee head count (party sizes summed, cancelled excluded)', () => {
    const steps = conferenceSetupSteps({
      conference: { name: 'X' },
      registrations: [{ partySize: 2, status: 'new' }, { partySize: 1, status: 'confirmed' }, { partySize: 5, status: 'cancelled' }],
    });
    expect(byKey(steps, 'attendees').value).toMatch(/3 registered/);
  });

  it('meals + registration are informational/ready (no fake setup step)', () => {
    const steps = conferenceSetupSteps({ conference: { name: 'X' } });
    expect(byKey(steps, 'meals').status).toBe('info');
    expect(byKey(steps, 'registration').status).toBe('done');
  });
});

describe('setupProgress — honest progress over actionable steps only', () => {
  it('excludes info steps and lists what remains', () => {
    const steps = conferenceSetupSteps({
      conference: { name: '77th National Assembly', theme: 'Reviving Faith', datesLabel: '' },
      venues: [{ name: 'South Campus Event Center', status: 'active' }],
      rooms: [{ name: 'Main Sanctuary', capacity: 600, useTypes: ['service'], status: 'active' }],
      sessions: [], registrations: [],
    });
    const p = setupProgress(steps);
    expect(p.total).toBeGreaterThan(0);
    expect(p.complete).toBe(false);
    expect(p.remaining).toContain('Dates');
    expect(p.remaining).toContain('Schedule (sessions)');
    // name/theme/venue/rooms are done; meals/registration/attendees are not counted.
    expect(p.done).toBeGreaterThanOrEqual(4);
  });

  it('is complete when every actionable step is done', () => {
    const steps = conferenceSetupSteps({
      conference: { name: 'A', theme: 'T', datesLabel: 'July 2026' },
      venues: [{ name: 'South Campus Event Center', status: 'active' }],
      rooms: [{ name: 'Main Sanctuary', capacity: 600, useTypes: ['service'], status: 'active' }],
      sessions: [{ title: 'Worship', status: 'active' }],
      registrations: [],
    });
    expect(setupProgress(steps).complete).toBe(true);
  });
});
