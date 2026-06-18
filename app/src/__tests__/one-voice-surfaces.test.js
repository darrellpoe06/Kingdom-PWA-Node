// @vitest-environment node
//
// Characterization + extensibility test for the OneVoiceInput surface config.
// The per-surface config was extracted out of OneVoiceInput.jsx into the pure
// lib/one-voice-surfaces.js so it is testable here AND a new surface can adopt
// the one input primitive by passing `surfaceConfig` — without editing the
// component. Two things must hold:
//   1. The two built-in surfaces (church, notes) resolve UNCHANGED when no
//      override is passed — the byte-identical invariant the consolidation
//      (PR #154) depends on, now preserved across the extraction.
//   2. A custom surface override merges correctly and routes through the same
//      planDispatch matrix — proving convergence works for the next surface.
import { describe, it, expect } from 'vitest';
import { SURFACES, resolveSurface } from '../lib/one-voice-surfaces.js';
import { planDispatch } from '../lib/one-voice-routing.js';

describe('resolveSurface — built-in surfaces unchanged (no override)', () => {
  it('church resolves to exactly the church config', () => {
    expect(resolveSurface('church', null)).toBe(SURFACES.church);
  });
  it('notes resolves to exactly the notes config', () => {
    expect(resolveSurface('notes', null)).toBe(SURFACES.notes);
  });
  it('church keeps its known defaults (default route, no private note on counseling)', () => {
    const c = resolveSurface('church');
    expect(c.defaultRoute).toBe('prayer');
    expect(c.saveNoteOnCounseling).toBe(false);
    expect(c.sourceTag).toBe('church-one-voice');
  });
  it('notes keeps its known defaults (private default, keeps a private note on counseling)', () => {
    const n = resolveSurface('notes');
    expect(n.defaultRoute).toBe('private');
    expect(n.saveNoteOnCounseling).toBe(true);
    expect(n.sourceTag).toBe('thinking-space');
  });
  it('an unknown surface with no override falls back to the church base', () => {
    expect(resolveSurface('does-not-exist')).toBe(SURFACES.church);
  });
});

describe('resolveSurface — a NEW surface adopts the primitive via override', () => {
  // A hypothetical cockpit "issue a directive" surface: starts on poetech,
  // its own source tag, and only overrides the confirmations it cares about.
  const cockpit = resolveSurface('notes', {
    defaultRoute: 'poetech',
    sourceTag: 'cockpit-directive',
    confirmations: { poetech: '✅ Logged to the build inbox as a directive.' },
  });

  it('override fields win over the base', () => {
    expect(cockpit.defaultRoute).toBe('poetech');
    expect(cockpit.sourceTag).toBe('cockpit-directive');
  });
  it('confirmations deep-merge: overridden key replaced, untouched keys inherited', () => {
    expect(cockpit.confirmations.poetech).toBe('✅ Logged to the build inbox as a directive.');
    expect(cockpit.confirmations.private).toBe(SURFACES.notes.confirmations.private);
  });
  it('does NOT mutate the base config', () => {
    expect(SURFACES.notes.defaultRoute).toBe('private');
    expect(SURFACES.notes.sourceTag).toBe('thinking-space');
  });
  it('routes through the same planDispatch matrix — poetech lands on the build inbox', () => {
    const plan = planDispatch(cockpit.defaultRoute, { poetech: true, note: true }, false);
    expect(plan.action).toBe('poetech');
    expect(plan.confirmationKey).toBe('poetech');
  });
});
