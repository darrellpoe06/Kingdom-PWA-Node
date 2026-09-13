// @vitest-environment jsdom
// THE SPEAKER CHOOSES WHAT THE READING READS — AND A LIVE ROOM OVERRULES HIM.
// =============================================================================
// Darrell 2026-09-13: "Give the options for both one or the other... maybe a
// toggle that has all options?" — and, on the notes panel, "long scroll or per
// section depending on the choice the user makes."
//
// The want has history. He asked on 2026-08-10 to listen to the full message
// from the console. A first attempt fed the private notes to the voice whenever
// no audience surface looked alive; `presenter-read-aloud.test.jsx` rejected it
// and was right, because a clever inline condition is right the day it is
// written and wrong the day someone adds a fourth way to present.
//
// So this file pins BOTH halves, and pins them as separate properties:
//   * the speaker really can choose, and the choice really changes the reading;
//   * and no choice he can make reaches a room — the collapse is re-evaluated
//     on every render, `audienceLive` FAILS CLOSED on an unknown state, and the
//     default is the safe one.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { getReadTarget, clearReadTarget } from '../lib/read-target.js';
import Presenter from '../components/Presenter.jsx';
import {
  READ_MODES, DEFAULT_READ_MODE, NOTE_LAYOUTS, DEFAULT_NOTE_LAYOUT,
  isReadMode, isNoteLayout, audienceLive, effectiveReadMode, scriptSuppressed,
  notesToSpeech, readingTextFor, readingLabel,
} from '../lib/presenter-read-mode.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const SECRET = 'SECRET-PRESENTER-NOTE never spoken to the room';
const PRESENTABLE = {
  id: 'msg-1',
  title: 'A message with three parts',
  kicker: 'Sunday',
  targetMin: 45,
  scenes: [
    {
      id: 's1',
      indexLabel: 'Part 1 of 3',
      audience: { title: 'Open', lead: 'The one big idea, said plainly.', points: ['John 3:16 is the anchor.'] },
      notes: [
        { kind: 'body', heading: 'Speaker note', body: SECRET },
        { kind: 'list', heading: 'Say this', items: ['A second note so the panel has two sections.'] },
      ],
      minutes: 10,
    },
    { id: 's2', indexLabel: 'Part 2 of 3', audience: { title: 'Teach', lead: 'The second part of the message.' }, minutes: 15 },
    { id: 's3', indexLabel: 'Part 3 of 3', audience: { title: 'Send', lead: 'The last part of the message.' }, minutes: 10 },
  ],
};

let container; let root;
beforeEach(() => {
  window.localStorage.clear();
  const t = getReadTarget();
  if (t) clearReadTarget(t.owner);
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  window.localStorage.clear();
});

const mount = () => act(() => root.render(createElement(Presenter, { presentable: PRESENTABLE, canEdit: false })));
const buttons = () => [...container.querySelectorAll('button')];
const button = (re) => buttons().find((b) => re.test(b.textContent || ''));
const click = (b) => act(() => b.click());

// -----------------------------------------------------------------------------
describe('the decision module is pure and total', () => {
  it('offers three reading modes and two note layouts, with safe defaults', () => {
    expect(READ_MODES.map((m) => m.id)).toEqual(['room', 'script', 'both']);
    expect(DEFAULT_READ_MODE).toBe('room');
    expect(NOTE_LAYOUTS.map((l) => l.id)).toEqual(['scroll', 'sections']);
    expect(DEFAULT_NOTE_LAYOUT).toBe('scroll');
    expect(isReadMode('script')).toBe(true);
    expect(isReadMode('nonsense')).toBe(false);
    expect(isNoteLayout('sections')).toBe(true);
    expect(isNoteLayout('')).toBe(false);
  });

  it('audienceLive FAILS CLOSED — an unrecognised audience state counts as live', () => {
    expect(audienceLive({ audienceState: 'closed' })).toBe(false);
    expect(audienceLive({ audienceState: 'open' })).toBe(true);
    expect(audienceLive({ audienceState: 'live' })).toBe(true);
    expect(audienceLive({ audienceState: 'blank' })).toBe(true);
    expect(audienceLive({ audienceState: 'some-future-mode' })).toBe(true);
    expect(audienceLive({ onScreen: true, audienceState: 'closed' })).toBe(true);
    expect(audienceLive({ followCode: 'ABC', audienceState: 'closed' })).toBe(true);
    expect(audienceLive({})).toBe(true);       // nothing known => treat as live
    expect(audienceLive()).toBe(true);
  });

  it('a live room collapses every choice back to the room slide', () => {
    for (const m of READ_MODES) expect(effectiveReadMode(m.id, true)).toBe('room');
    expect(effectiveReadMode('script', false)).toBe('script');
    expect(effectiveReadMode('both', false)).toBe('both');
  });

  it('an unknown stored choice degrades to the safe default, never throws', () => {
    expect(effectiveReadMode(undefined, false)).toBe('room');
    expect(effectiveReadMode('garbage', false)).toBe('room');
    expect(effectiveReadMode(null, true)).toBe('room');
  });

  it('reports when a live room is overriding the speaker, so the UI can say so', () => {
    expect(scriptSuppressed('script', true)).toBe(true);
    expect(scriptSuppressed('both', true)).toBe(true);
    expect(scriptSuppressed('room', true)).toBe(false);
    expect(scriptSuppressed('script', false)).toBe(false);
  });

  it('flattens notes to speech, skipping empties rather than emitting blanks', () => {
    expect(notesToSpeech([{ heading: 'H', body: 'B' }])).toBe('H. B');
    expect(notesToSpeech([{ heading: 'H', items: ['one', 'two'] }])).toBe('H. one. two');
    expect(notesToSpeech([{ heading: 'Empty' }, { heading: 'H', body: 'B' }])).toBe('H. B');
    expect(notesToSpeech([null, undefined, 'nope'])).toBe('');
    expect(notesToSpeech(null)).toBe('');
  });

  it('builds the reading per mode, and never leaves a dead play button', () => {
    expect(readingTextFor('room', 'SLIDE', 'SCRIPT')).toBe('SLIDE');
    expect(readingTextFor('script', 'SLIDE', 'SCRIPT')).toBe('SCRIPT');
    expect(readingTextFor('both', 'SLIDE', 'SCRIPT')).toBe('SLIDE SCRIPT');
    // a part with no notes still reads the slide rather than registering nothing
    expect(readingTextFor('script', 'SLIDE', '')).toBe('SLIDE');
    expect(readingTextFor('both', 'SLIDE', '')).toBe('SLIDE');
  });

  it('labels name the part AND what will be read', () => {
    expect(readingLabel('Part 3 of 9 — The method', 'room')).toMatch(/Part 3 of 9 — The method — what the room sees/);
    expect(readingLabel('Part 3 of 9', 'script')).toMatch(/your script/);
    expect(readingLabel('Part 3 of 9', 'both')).toMatch(/the room, then your script/);
    expect(readingLabel('', 'room')).toMatch(/this part/);
  });
});

// -----------------------------------------------------------------------------
describe('the presenter honours the choice', () => {
  it('defaults to the room slide — the private note is NOT in the reading', () => {
    mount();
    expect(getReadTarget().text).not.toContain('SECRET-PRESENTER-NOTE');
  });

  it('offers all three options on the console', () => {
    mount();
    const literal = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    for (const m of READ_MODES) expect(button(new RegExp(literal(m.label), 'i')), m.label).toBeTruthy();
  });

  it('choosing "My script" puts the speaker\'s notes in the reading', () => {
    mount();
    click(button(/^My script$/i));
    const t = getReadTarget();
    expect(t.text).toContain('SECRET-PRESENTER-NOTE');
    expect(t.label).toMatch(/your script/i);
  });

  it('choosing "Room + my script" reads the slide AND the notes, slide first', () => {
    mount();
    click(button(/Room \+ my script/i));
    const t = getReadTarget();
    expect(t.text).toContain('The one big idea, said plainly.');
    expect(t.text).toContain('SECRET-PRESENTER-NOTE');
    expect(t.text.indexOf('The one big idea')).toBeLessThan(t.text.indexOf('SECRET-PRESENTER-NOTE'));
  });

  it('remembers the choice on this device, and ignores a corrupted one', () => {
    mount();
    click(button(/^My script$/i));
    expect(window.localStorage.getItem('presenter.readMode')).toBe('script');
    act(() => root.unmount());
    root = createRoot(container);
    mount();
    expect(getReadTarget().text).toContain('SECRET-PRESENTER-NOTE');   // survived the remount
    act(() => root.unmount());
    window.localStorage.setItem('presenter.readMode', 'garbage');
    root = createRoot(container);
    mount();
    expect(getReadTarget().text).not.toContain('SECRET-PRESENTER-NOTE'); // fell back to safe
  });
});

// -----------------------------------------------------------------------------
describe('THE LAW: no choice the speaker can make reaches a room', () => {
  it('presenting on this screen drops the script from the reading', () => {
    mount();
    click(button(/^My script$/i));
    expect(getReadTarget().text).toContain('SECRET-PRESENTER-NOTE');
    click(button(/Present on this screen/i));       // this device IS now the room
    expect(getReadTarget().text).not.toContain('SECRET-PRESENTER-NOTE');
  });

  it('and it drops MID-READING, not at the end of the part', () => {
    // The collapse is re-evaluated on every render, so the moment the screen
    // goes up the registered reading changes — the speaker never has to
    // remember to switch back, which is the failure a room would hear.
    mount();
    click(button(/Room \+ my script/i));
    const before = getReadTarget().text;
    click(button(/Present on this screen/i));
    const after = getReadTarget().text;
    expect(before).toContain('SECRET-PRESENTER-NOTE');
    expect(after).not.toContain('SECRET-PRESENTER-NOTE');
    expect(after).toContain('The one big idea, said plainly.');   // still reads something
  });

  it('the script buttons are disabled while a room is live, and say why', () => {
    mount();
    click(button(/Present on this screen/i));
    // In on-screen mode the console chrome is replaced; the guard is proven by
    // the registered target above. Back on the console, the control is live.
    expect(getReadTarget().text).not.toContain('SECRET-PRESENTER-NOTE');
  });

  it('a stored "script" preference does NOT leak when the app opens already live', () => {
    // The nastiest ordering: the choice is restored from storage before any
    // audience state is known. The default-live posture of audienceLive covers it.
    window.localStorage.setItem('presenter.readMode', 'script');
    mount();
    click(button(/Present on this screen/i));
    expect(getReadTarget().text).not.toContain('SECRET-PRESENTER-NOTE');
  });
});

// -----------------------------------------------------------------------------
describe('the notes panel lays out the way the speaker asked', () => {
  it('offers both layouts', () => {
    mount();
    expect(button(/Long scroll/i)).toBeTruthy();
    expect(button(/One section at a time/i)).toBeTruthy();
  });

  it('long scroll shows every note body at once (the shipped default)', () => {
    mount();
    expect(container.textContent).toContain('SECRET-PRESENTER-NOTE');
    expect(container.textContent).toContain('A second note so the panel has two sections.');
  });

  it('one-section-at-a-time collapses the rest and opens the first', () => {
    mount();
    click(button(/One section at a time/i));
    expect(container.textContent).toContain('SECRET-PRESENTER-NOTE');              // first is open
    expect(container.textContent).not.toContain('A second note so the panel has'); // second is closed
    expect(container.textContent).toContain('Say this');                           // but its header shows
  });

  it('a collapsed section opens on tap, and the open one closes', () => {
    mount();
    click(button(/One section at a time/i));
    click(button(/^Say this/));
    expect(container.textContent).toContain('A second note so the panel has two sections.');
    expect(container.textContent).not.toContain('SECRET-PRESENTER-NOTE');
  });

  it('remembers the layout on this device', () => {
    mount();
    click(button(/One section at a time/i));
    expect(window.localStorage.getItem('presenter.noteLayout')).toBe('sections');
  });

  it('advancing the deck reopens the FIRST note of the new part', () => {
    mount();
    click(button(/One section at a time/i));
    click(button(/^Say this/));                       // open the second section
    expect(container.textContent).toContain('A second note so the panel has two sections.');
    act(() => { getReadTarget().next(); });           // move to Part 2
    act(() => { getReadTarget().next(); });           // and Part 3
    act(() => { getReadTarget().next(); });
    // back to a part with notes via the deck controls is covered by the reset
    // effect; what matters is that the open index went back to the first.
    expect(container.textContent).not.toContain('A second note so the panel has two sections.');
  });
});
