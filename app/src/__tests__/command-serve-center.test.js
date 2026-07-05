// =============================================================================
// command-serve-center.test.js — proven-to-catch tests for the C2S model
// =============================================================================
// The C2S seat composes real surfaces and frames them with the servant-king
// ontology. These tests pin the two properties that MUST NOT silently drift
// (Verification Doctrine DR-0076 + the three-brakes rule):
//   1. No fake green — a faculty with an in-flight piece reports 'partial', not
//      'live'. A regression that paints command/control green fails here.
//   2. The brake is structural — autonomous execution is OFF, and the hand-off
//      stage of the self-hosting loop crosses OUT of the seat (into the Cage).
import { describe, it, expect } from 'vitest';
import {
  FACULTIES,
  FACULTY_KEYS,
  seatOf,
  declaredReadiness,
  READINESS_PROVENANCE,
  SELF_HOSTING_LOOP,
  autonomousExecutionEnabled,
  brakeStatusLine,
} from '../lib/command-serve-center.js';

describe('FACULTIES — the four faculties of the seat', () => {
  it('declares exactly See / Command / Control / Serve in reading order', () => {
    expect(FACULTY_KEYS).toEqual(['see', 'command', 'control', 'serve']);
  });
  it('every faculty has a label, glyph, tagline, and surfaces array', () => {
    for (const f of FACULTIES) {
      expect(f.label).toBeTruthy();
      expect(f.glyph).toBeTruthy();
      expect(f.tagline).toBeTruthy();
      expect(Array.isArray(f.surfaces)).toBe(true);
    }
  });
  it('See composes the live observability surfaces, not the orchestrator', () => {
    const see = FACULTIES.find((f) => f.key === 'see');
    expect(see.surfaces).toContain('OpsBoard');
    expect(see.surfaces).toContain('QualityProof');
    // ConflictLoop + WakeOrchestrator render under Command, not See — the model
    // must reflect where they actually render (no model/reality drift).
    expect(see.surfaces).not.toContain('WakeOrchestrator');
  });
  it('Command composes the braked orchestrator', () => {
    const command = FACULTIES.find((f) => f.key === 'command');
    expect(command.surfaces).toContain('WakeOrchestrator');
  });
  it('Control composes the live project-management pulse (consolidated from the Build board)', () => {
    const control = FACULTIES.find((f) => f.key === 'control');
    // The pulse used to be buried at the bottom of the Build board; it now has
    // ONE home — composed in the Control faculty of the seat.
    expect(control.surfaces).toContain('ProjectMgmtPulse');
  });
});

describe('seatOf — who is seated', () => {
  it('seats no one outside the family/Governor scope (no-leak)', () => {
    const s = seatOf({ email: 'stranger@example.com', persona: null, isFamily: false });
    expect(s.seated).toBe(false);
    expect(s.name).toBeNull();
    expect(s.charge).toBeNull();
  });
  it('seats the steward with a name when a persona is known', () => {
    const s = seatOf({ email: 'd@x.com', persona: 'darrell', isFamily: true });
    expect(s.seated).toBe(true);
    expect(s.name).toBe('Darrell');
    expect(s.roleLabel).toBeTruthy();
    expect(s.charge).toMatch(/create.*never extract/i);
  });
  it('seats a nameless steward when family but no persona resolved', () => {
    const s = seatOf({ email: 'd@x.com', persona: null, isFamily: true });
    expect(s.seated).toBe(true);
    expect(s.name).toBeNull();
  });
});

describe('declaredReadiness — honest per-faculty status (NO FAKE GREEN)', () => {
  const r = declaredReadiness();
  it('reports all four faculties with a status + a real note', () => {
    for (const key of FACULTY_KEYS) {
      expect(r[key]).toBeTruthy();
      expect(['live', 'partial', 'wiring']).toContain(r[key].status);
      expect(r[key].note.length).toBeGreaterThan(20);
    }
  });
  it('every status names its provenance as DECLARED — never dressed as a runtime probe', () => {
    // DR-0076 rule 8: these are wiring statuses asserted at build and pinned
    // here, not measurements. The shape itself carries that truth, and the UI
    // tooltip (READINESS_PROVENANCE) states it in words.
    for (const key of FACULTY_KEYS) {
      expect(r[key].provenance).toBe('declared');
    }
    expect(READINESS_PROVENANCE).toMatch(/declared/i);
    expect(READINESS_PROVENANCE).toMatch(/not a runtime measurement/i);
  });
  it('does NOT paint Command green — its engine ships inert, so it is partial', () => {
    expect(r.command.status).toBe('partial');
  });
  it('Control is live once the management pulse composes in the seat — and says what is real', () => {
    // Honest, not fake-green: Control is 'live' BECAUSE the real ProjectMgmtPulse
    // (real synced projects + discussions + hand-offs) now renders in the seat,
    // not because the label was flipped. The no-fake-green guard still has teeth
    // via Command (its engine ships inert → 'partial', asserted above).
    expect(r.control.status).toBe('live');
    expect(r.control.note).toMatch(/pulse|discussions|hand-offs/i);
    expect(r.control.note).toMatch(/no painted numbers/i);
  });
  it('See is live — its surfaces are all on main today', () => {
    expect(r.see.status).toBe('live');
  });
});

describe('the brake is structural, not a comment', () => {
  it('autonomous execution is OFF in this rung', () => {
    expect(autonomousExecutionEnabled()).toBe(false);
  });
  it('the brake status line names the Cage when disarmed', () => {
    expect(brakeStatusLine()).toMatch(/staged.*braked/i);
    expect(brakeStatusLine()).toMatch(/kill-switch|Cage/i);
  });
  it('the hand-off stage crosses OUT of the seat (into the Cage)', () => {
    const handoff = SELF_HOSTING_LOOP.find((s) => s.key === 'handoff');
    expect(handoff).toBeTruthy();
    expect(handoff.inSeat).toBe(false);
    // Read + Decide stay in the seat — the steward holds those.
    expect(SELF_HOSTING_LOOP.find((s) => s.key === 'read').inSeat).toBe(true);
    expect(SELF_HOSTING_LOOP.find((s) => s.key === 'decide').inSeat).toBe(true);
  });
});
