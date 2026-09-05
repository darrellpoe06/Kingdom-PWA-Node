// @vitest-environment node
// =============================================================================
// A lesson session note must name the MODULE it documents
// =============================================================================
// MEASURED FIRST (DR-0076 §5 — characterize before you change), 2026-09-05.
//
// The catalog's numbering is already sound and already gated: the
// lesson-number collision gate proves every number is claimed at most once and
// that no NEW gap opens. That gate passes. So the thing worth fixing is not the
// catalog — it is the WRITTEN RECORD that points into it.
//
// What the measurement actually found: two session notes are both named
// `...living-lesson-l119-...` (abstention, and equipped-to-win), and SIX of the
// eight lesson notes name no module id at all. So "see L119" does not resolve —
// a reader cannot tell which module a note documents, and the note filename is
// the only handle they have. The module whose note is titled L119
// (equipped-to-win) is `ll124-…` in the catalog, which is exactly the kind of
// silent drift a written L-number invites.
//
// THIS IS A RATCHET, not a retro-fix — the same shape the collision gate uses
// for its historical numbering gap. The six existing notes are RECORDED here
// rather than rewritten: they are somebody else's record of their own session,
// and editing history to satisfy a new gate would be the worse trade. Every
// note added from now on must carry a `**Module id:**` line whose id exists in
// the live catalog, so the mapping is never again a guess.
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const NOTES = join(HERE, '..', '..', '..', 'docs', '99-session-notes');

// Recorded, not blessed: the notes that predate this gate. Adding a name here
// is not a way to opt out — a NEW note must carry its module id.
const PREDATING = new Set([
  '2026-09-02-living-lesson-l115-meek-and-quiet-strength.md',
  '2026-09-02-living-lesson-l116-the-thirty-day-experiment.md',
  '2026-09-03-living-lesson-l117-no-two-children-same-house.md',
  '2026-09-03-living-lesson-l119-abstention.md',
  '2026-09-03-living-lesson-l119-equipped-to-win.md',
  '2026-09-03-living-lesson-l120-it-is-written.md',
]);

const noteFiles = readdirSync(NOTES).filter((f) => /living-lesson.*\.md$/.test(f));
const body = (f) => readFileSync(join(NOTES, f), 'utf8');
const moduleIdIn = (text) => (text.match(/\*\*Module id:\*\*\s*`?(ll[0-9]+-[a-z0-9-]+)`?/) || [])[1] || null;

describe('the measurement this gate is built on', () => {
  it('there ARE lesson notes to check', () => {
    expect(noteFiles.length).toBeGreaterThan(0);
  });

  it('the recorded predating set is real — every name in it exists on disk', () => {
    for (const f of PREDATING) {
      expect(noteFiles, `recorded as predating but not on disk: ${f}`).toContain(f);
    }
  });

  it('the historical ambiguity is real and is why this gate exists', () => {
    // Two notes claim L119 in their filename. That is the defect, stated as a
    // fact rather than as a worry.
    const l119 = noteFiles.filter((f) => /living-lesson-l119-/.test(f));
    expect(l119.length).toBeGreaterThan(1);
  });
});

describe('every NEW lesson note names the module it documents', () => {
  const current = noteFiles.filter((f) => !PREDATING.has(f));

  it('there is at least one note held to the new rule', () => {
    expect(current.length).toBeGreaterThan(0);
  });

  for (const f of current) {
    it(`${f} carries a Module id that exists in the live catalog`, () => {
      const id = moduleIdIn(body(f));
      expect(id, `${f} must carry a "**Module id:** \`ll…\`" line so "see L-nn" resolves`).toBeTruthy();
      expect(
        LIVING_LESSONS_MODULES.some((m) => m.id === id),
        `${f} names module "${id}", which is not in the catalog`,
      ).toBe(true);
    });
  }
});

describe('PROVEN-TO-CATCH — the gate fails on the shapes it exists to stop', () => {
  it('a note with no Module id line is caught', () => {
    expect(moduleIdIn('# A lesson\n\n**Date:** 2026-09-06\n\nSome prose.')).toBe(null);
  });

  it('a note naming a module that is not in the catalog is caught', () => {
    const id = moduleIdIn('**Module id:** `ll999-a-lesson-that-does-not-exist`');
    expect(id).toBe('ll999-a-lesson-that-does-not-exist');
    expect(LIVING_LESSONS_MODULES.some((m) => m.id === id)).toBe(false);
  });

  it('a real note is accepted — the gate is not merely strict', () => {
    const id = moduleIdIn('**Module id:** `' + LIVING_LESSONS_MODULES[0].id + '`');
    expect(LIVING_LESSONS_MODULES.some((m) => m.id === id)).toBe(true);
  });
});
