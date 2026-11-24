// isLearnStudioOn: the native app shell has NO address bar (Darrell's wife,
// 2026-11-24: "I still see the original design ... without requiring computer
// access"), so a ?learnStudio=1 query string can never reach it. The owner's
// device must default ON with no URL at all, while every other member still
// defaults off until the owner explicitly turns it on. An explicit choice
// (URL or remembered) always wins over the default, either direction.
import { describe, it, expect } from 'vitest';
import { isLearnStudioOn } from '../lib/learn-presentation/presentation.js';

function fakeStorage(initial = {}) {
  const m = new Map(Object.entries(initial));
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, v) };
}

describe('isLearnStudioOn: owner default, explicit choice always wins', () => {
  it('stays off with no URL and no remembered choice, when no default is given (back-compat)', () => {
    expect(isLearnStudioOn({ search: '', storage: fakeStorage() })).toBe(false);
  });

  it('defaults ON for the owner (isGovernor) with no URL at all -- the native-app case', () => {
    expect(isLearnStudioOn({ search: '', storage: fakeStorage(), defaultOn: true })).toBe(true);
  });

  it('a non-owner device still defaults off even when asked', () => {
    expect(isLearnStudioOn({ search: '', storage: fakeStorage(), defaultOn: false })).toBe(false);
  });

  it('an explicit ?learnStudio=0 turns it off even for the owner, and is remembered', () => {
    const storage = fakeStorage();
    expect(isLearnStudioOn({ search: '?learnStudio=0', storage, defaultOn: true })).toBe(false);
    expect(isLearnStudioOn({ search: '', storage, defaultOn: true })).toBe(false);
  });

  it('an explicit ?learnStudio=1 turns it on for anyone, and is remembered', () => {
    const storage = fakeStorage();
    expect(isLearnStudioOn({ search: '?learnStudio=1', storage, defaultOn: false })).toBe(true);
    expect(isLearnStudioOn({ search: '', storage, defaultOn: false })).toBe(true);
  });

  it('a remembered OFF choice beats the owner default (she turned it off once, it stays off)', () => {
    expect(isLearnStudioOn({ search: '', storage: fakeStorage({ 'poe-learn-studio': '0' }), defaultOn: true })).toBe(false);
  });

  it('a remembered ON choice persists without the default', () => {
    expect(isLearnStudioOn({ search: '', storage: fakeStorage({ 'poe-learn-studio': '1' }), defaultOn: false })).toBe(true);
  });
});
