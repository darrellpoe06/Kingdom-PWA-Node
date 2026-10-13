// @vitest-environment node
//
// council-chamber-launch — "Open the Council Chamber" must open the CHAMBER
// (DR-0142). Darrell 2026-07-10: "Council Chamber goes to the video for church
// latest instead of the chamber." The chamber is the church home's SPEAK
// section (the one-voice input, DR-0131); a launch target that names the
// chamber must carry churchSection:'speak', or the learner lands on the
// Worship video. Pinned STRUCTURALLY: any lesson whose in-app activity
// mentions the Council Chamber / "our own A.I." must launch into the speak
// section — a future lesson that forgets fails the build, not the learner.
import { describe, it, expect } from 'vitest';
import { MODULES as AI_CLASS } from '../lib/church-classes.js';
import { launchLabel } from '../components/ChurchLearn.jsx';
import { AI_LEGAL_BLUEPRINT_MODULES } from '../lib/ai-legal-blueprint-class.js';
import { BROADCAST_MODULES } from '../lib/broadcast-class.js';
import { SOVEREIGN_AI_MODULES } from '../lib/sovereign-ai-class.js';
import { SOURCE_KINDS } from '../lib/book-engine.js';

const CHAMBER_RE = /council chamber|our own a\.?i\.?\b/i;

const allModules = [
  ...AI_CLASS.map((m) => ({ ...m, course: 'church-classes' })),
  ...AI_LEGAL_BLUEPRINT_MODULES.map((m) => ({ ...m, course: 'ai-legal' })),
  ...BROADCAST_MODULES.map((m) => ({ ...m, course: 'broadcast' })),
  ...SOVEREIGN_AI_MODULES.map((m) => ({ ...m, course: 'sovereign-ai' })),
];

describe('every chamber-intent lesson launches INTO the chamber (speak section)', () => {
  const chamberLessons = allModules.filter((m) => m.launch && CHAMBER_RE.test(m.inApp || ''));
  it('the sweep actually finds the known chamber lessons (not vacuous)', () => {
    expect(chamberLessons.length).toBeGreaterThanOrEqual(4);
  });
  it.each(chamberLessons.map((m) => [m.course, m.id || m.title, m]))(
    '%s / %s carries churchSection "speak"',
    (_c, _id, m) => {
      expect(m.launch).toMatchObject({ view: 'church', churchView: 'home', churchSection: 'speak' });
    },
  );
});

describe('non-chamber launches keep the Worship default (a stream lesson wants the stream)', () => {
  it('the OBS switching lesson opens plain church home (worship)', () => {
    const obs = BROADCAST_MODULES.find((m) => /scene|switch/i.test(m.title || '') && m.launch);
    if (obs) expect(obs.launch.churchSection).toBeUndefined();
  });
});

describe('a testimony is spoken into the chamber', () => {
  it('the book-engine testimony target opens the speak section', () => {
    expect(SOURCE_KINDS.testimony).toMatchObject({ view: 'church', churchView: 'home', churchSection: 'speak' });
  });
});

describe('launchLabel says what the door actually is', () => {
  it('chamber label ONLY with the speak section; plain home reads as home', () => {
    expect(launchLabel({ view: 'church', churchView: 'home', churchSection: 'speak' })).toBe('Open the Council Chamber');
    expect(launchLabel({ view: 'church', churchView: 'home' })).toBe('Open the church home');
    expect(launchLabel(null)).toBeNull();
  });
});
