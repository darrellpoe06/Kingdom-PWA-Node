// assistant-access — the owner's per-1099-assistant checkbox store. Proven-to-
// catch: adding/removing an assistant, checking a grantable surface, and the
// no-leak guarantee that a locked wall can NEVER be written on here.
import { describe, it, expect, beforeEach } from 'vitest';
import {
  LS_KEY, readAssistants, addAssistant, removeAssistant, toggleCap,
} from '../lib/use-assistant-access.js';

// Each test starts from a clean store (the module singleton persists to
// localStorage; clear it and reset any rows a prior test added).
beforeEach(() => {
  try { localStorage.removeItem(LS_KEY); } catch { /* ignore */ }
  for (const a of readAssistants().slice()) removeAssistant(a.id);
});

describe('assistant-access — checkboxes for what each 1099 assistant is allowed', () => {
  it('adds an assistant with an empty config (nothing granted by default)', () => {
    const a = addAssistant('Sample Assistant');
    expect(a).toBeTruthy();
    expect(a.config).toEqual({});
    expect(readAssistants().map((x) => x.name)).toContain('Sample Assistant');
  });
  it('ignores a blank name', () => {
    expect(addAssistant('   ')).toBeNull();
    expect(readAssistants()).toHaveLength(0);
  });
  it('checks + unchecks a grantable work surface for one assistant', () => {
    const a = addAssistant('A');
    toggleCap(a.id, 'referrals.manage');
    expect(readAssistants().find((x) => x.id === a.id).config['referrals.manage']).toBe('allow');
    toggleCap(a.id, 'referrals.manage'); // uncheck
    expect(readAssistants().find((x) => x.id === a.id).config['referrals.manage']).toBeUndefined();
  });
  it('NO-LEAK: a locked wall can never be checked on here', () => {
    const a = addAssistant('A');
    for (const wall of ['finance.view', 'finance.manage', 'portfolio.view', 'family.manage', 'ops.oversight']) {
      toggleCap(a.id, wall); // no-op — not grantable
      expect(readAssistants().find((x) => x.id === a.id).config[wall]).toBeUndefined();
    }
  });
  it('removes an assistant', () => {
    const a = addAssistant('Gone');
    removeAssistant(a.id);
    expect(readAssistants().find((x) => x.id === a.id)).toBeUndefined();
  });
  it('keeps each assistant’s checkboxes independent', () => {
    const a = addAssistant('A');
    const b = addAssistant('B');
    toggleCap(a.id, 'crm.assigned');
    expect(readAssistants().find((x) => x.id === a.id).config['crm.assigned']).toBe('allow');
    expect(readAssistants().find((x) => x.id === b.id).config['crm.assigned']).toBeUndefined();
  });
});
