// =============================================================================
// confirm-action — the one door destruction goes through (DR-0315)
// =============================================================================
// Six live buttons destroyed records — several with their cloud rows — without
// asking. The primitive these tests pin is what the ui-standards gate now
// requires of every new destructive button, so its edges matter: a wrapped
// action must run ONLY on a yes, pass its arguments through untouched, and
// refuse to destroy when there is no way to ask.
// =============================================================================
import { describe, it, expect, vi } from 'vitest';
import { confirmThen } from '../lib/confirm-action.js';

describe('confirmThen', () => {
  it('runs the action when the person says yes, with arguments intact', () => {
    const action = vi.fn((a, b) => a + b);
    const ask = vi.fn(() => true);
    const wrapped = confirmThen('Sure?', action, ask);
    expect(wrapped(2, 3)).toBe(5);
    expect(ask).toHaveBeenCalledWith('Sure?');
    expect(action).toHaveBeenCalledWith(2, 3);
  });

  it('does NOT run the action when the person says no', () => {
    const action = vi.fn();
    const wrapped = confirmThen('Sure?', action, () => false);
    expect(wrapped()).toBeUndefined();
    expect(action).not.toHaveBeenCalled();
  });

  it('asks BEFORE running — never after', () => {
    const order = [];
    const wrapped = confirmThen('Sure?',
      () => order.push('acted'),
      () => { order.push('asked'); return true; });
    wrapped();
    expect(order).toEqual(['asked', 'acted']);
  });

  it('returns the action\'s own value, so async callers keep their promise', async () => {
    const wrapped = confirmThen('Sure?', async () => 'done', () => true);
    await expect(wrapped()).resolves.toBe('done');
  });

  it('tolerates a null action — the ChefCorner shape, where onDelete can be absent', () => {
    // <button onClick={confirmThen('...', onDelete)}> renders even when
    // onDelete is null; clicking must be a no-op, not a crash.
    const wrapped = confirmThen('Sure?', null, () => true);
    expect(() => wrapped()).not.toThrow();
    expect(wrapped()).toBeUndefined();
  });

  it('falls back to window.confirm when no ask is injected', () => {
    const spy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const action = vi.fn();
    confirmThen('Sure?', action)();
    expect(spy).toHaveBeenCalledWith('Sure?');
    expect(action).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('FAIL-SAFE: with no way to ask, destruction does not proceed', () => {
    const original = window.confirm;
    window.confirm = undefined; // an environment with no usable dialog
    try {
      const action = vi.fn();
      confirmThen('Sure?', action)();
      expect(action).not.toHaveBeenCalled();
    } finally {
      window.confirm = original;
    }
  });
});
