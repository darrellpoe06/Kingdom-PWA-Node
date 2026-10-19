// @vitest-environment jsdom
// =============================================================================
// A shut panel tells a signed-in person what they DO hold
// =============================================================================
// Darrell, 2026-10-19: "he gets access... we want them to learn by doing or
// helping and or witnessing our businesses."
//
// THE DEFECT, measured in the tree: the steward-only panels end their locked
// message with "Sign in with a steward account to enter" / "Sign in with a
// family/governor account". That was written when the only reader who could
// meet a shut panel was signed OUT. DR-1107 wired authority to the database
// role, so the readers who meet them now are signed IN — a son at 'child', a
// daughter at 'member' — and to them the sentence is false.
//
// It is the same miss LockedSurface's own header names about the five white
// boxes it replaced: "for somebody already signed in it is simply wrong."
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// The component reads the role through useInstanceRole, which calls Supabase.
// Stub the seam, not the rule: the standing it derives is the real one.
let ROLE_STATE = { instanceId: null, instanceSlug: null, instanceType: null, role: null, loaded: true };
vi.mock('../lib/instance-role.js', () => ({
  useInstanceRole: () => ROLE_STATE,
  fetchInstanceRole: async () => ROLE_STATE,
  governsHere: () => false,
  isAssistantRole: () => false,
  canManageTeam: () => false,
}));

const { default: StandingNote, spaceNameFromSlug } = await import('../components/StandingNote.jsx');

let host; let root;
beforeEach(() => { host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); ROLE_STATE = { ...ROLE_STATE, role: null, instanceSlug: null }; });

const render = (props = {}) => { act(() => root.render(<StandingNote {...props} />)); return host.textContent || ''; };

describe('the son is told where he stands, not told to sign in', () => {
  it('a child reads his standing and the household by name', () => {
    ROLE_STATE = { ...ROLE_STATE, role: 'child', instanceSlug: 'poe-family' };
    const text = render({ fallback: 'Sign in with a steward account to enter.' });
    expect(text).toContain('witnessing Poe Family');
    expect(text).toContain('the money stays with the stewards');
    expect(text).not.toContain('Sign in');
  });

  it('it never says denied, forbidden, not allowed or no access', () => {
    for (const role of ['child', 'member', 'successor', 'viewer', 'assistant', 'specialist']) {
      ROLE_STATE = { ...ROLE_STATE, role, instanceSlug: 'poe-family' };
      const text = render({ fallback: 'Sign in.' });
      expect(text, `${role}`).not.toMatch(/denied|forbidden|not allowed|no access/i);
      expect(text, `${role} must be told something`).not.toBe('');
    }
  });

  it('a daughter at member is told she helps, and who can open this one', () => {
    ROLE_STATE = { ...ROLE_STATE, role: 'member', instanceSlug: 'poe-family' };
    const text = render();
    expect(text).toContain('You help in Poe Family');
    expect(text).toContain('Role & stewards');
  });

  it('a witness is told to ask, which is the guardian decision DR-0094 keeps', () => {
    ROLE_STATE = { ...ROLE_STATE, role: 'child', instanceSlug: 'poe-family' };
    expect(render()).toContain('Ask a steward to place you here');
  });
});

describe('it claims nothing about a reader it has not identified', () => {
  it('no role read -> the panel own sign-in sentence, unchanged', () => {
    ROLE_STATE = { ...ROLE_STATE, role: null };
    expect(render({ fallback: 'Sign in with a steward account to enter.' }))
      .toBe('Sign in with a steward account to enter.');
  });

  it('no role and no fallback -> nothing at all, never a guess', () => {
    ROLE_STATE = { ...ROLE_STATE, role: null };
    expect(render()).toBe('');
  });

  it('a governor reading a locked panel gets no standing noise', () => {
    for (const role of ['owner', 'admin']) {
      ROLE_STATE = { ...ROLE_STATE, role, instanceSlug: 'poe-family' };
      expect(render({ fallback: 'Sign in.' }), role).toBe('');
    }
  });

  it('an unknown slug says "this space" rather than inventing a household name', () => {
    ROLE_STATE = { ...ROLE_STATE, role: 'child', instanceSlug: null };
    const text = render();
    expect(text).toContain('this space');
    expect(spaceNameFromSlug(null)).toBe('');
    expect(spaceNameFromSlug('poe-properties')).toBe('Poe Properties');
  });
});

describe('the panels that can now be met by a signed-in family member carry it', () => {
  const read = (f) => readFileSync(join(import.meta.dirname, '..', 'components', f), 'utf8');

  it('Admin and Relationships no longer END on a sign-in instruction', () => {
    // The sentence is kept — as the FALLBACK, for a reader we cannot identify.
    // What must be gone is it being the last word to a signed-in son.
    for (const f of ['AdminConsole.jsx', 'Relationships.jsx']) {
      const src = read(f);
      expect(src, `${f} must mount the standing note`).toMatch(/<StandingNote/);
      expect(src, `${f} must keep the old sentence only as a fallback`)
        .toMatch(/<StandingNote[^>]*fallback="[^"]*Sign in/);
    }
  });

  it('the Center carries it too, where there was no instruction to fix at all', () => {
    expect(read('CommandServeCenter.jsx')).toMatch(/<StandingNote/);
  });

  it('PROVEN-TO-CATCH: a panel that states the instruction OUTSIDE a fallback fails', () => {
    // The shape this case rejects is the pre-change one: the sign-in sentence
    // sitting in the panel's own prose, where a signed-in reader meets it.
    const regressed = read('AdminConsole.jsx').replace(
      /<StandingNote[^>]*\/>/,
      '<p>Sign in with a steward account to enter.</p>'
    );
    expect(/<StandingNote[^>]*fallback="[^"]*Sign in/.test(regressed)).toBe(false);
    expect(/<p>Sign in with a steward account/.test(regressed)).toBe(true);
  });
});

describe('what this does NOT touch, and why — so it is a decision, not a drift', () => {
  it('the panels still gated on MEMBERSHIP are left alone, correctly', () => {
    // Forecast (isOwner) and Scribe (isSteward) are handed isFamilyMember by
    // the shell, so only a NON-family reader meets their locked box — and for
    // that reader "sign in with a family account" is true. Their correct gate
    // is books-visibility rather than governorship (a 'member' reads the books
    // under 0082, so gating Forecast on governor would be STRICTER than RLS,
    // which DR-1106 forbids: the model mirrors the wall, it does not invent
    // one). That is a decision about what a daughter and a son see, which
    // DR-0094 keeps with the guardian. `re-review: 2026-10-26`.
    const shell = readFileSync(join(import.meta.dirname, '..', 'poe-financial-mvp-v28.jsx'), 'utf8');
    expect(shell).toMatch(/<WorkflowScribe isSteward=\{isFamilyMember\} \/>/);
    expect(shell).toMatch(/<Forecast data=\{data\} currentDate=\{currentDate\} isOwner=\{isFamilyMember\} \/>/);
  });
});
