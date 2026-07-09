// date-picker-tap — pinned: a date field opens its native calendar on focus
// (Darrell 2026-07-07: "show a calendar when you click it right away"), text
// fields and disabled/readonly fields never do, and unwiring stops it.
import { describe, it, expect, vi } from 'vitest';
import { wireDatePickerTap } from '../lib/date-picker-tap.js';

function makeInput(type, { disabled = false, readOnly = false } = {}) {
  const el = document.createElement('input');
  el.type = type;
  el.disabled = disabled;
  if (readOnly) el.readOnly = true;
  el.showPicker = vi.fn();
  document.body.appendChild(el);
  return el;
}
const focusIn = (el) => el.dispatchEvent(new window.FocusEvent('focusin', { bubbles: true }));
const click = (el) => el.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));

describe('date-picker-tap', () => {
  it('opens the picker on focus AND on click for every picker-typed input', () => {
    const unwire = wireDatePickerTap(document);
    for (const type of ['date', 'datetime-local', 'month', 'time']) {
      const el = makeInput(type);
      focusIn(el);
      expect(el.showPicker, type).toHaveBeenCalledTimes(1);
      click(el);
      expect(el.showPicker, type).toHaveBeenCalledTimes(2);
      el.remove();
    }
    unwire();
  });

  it('never fires for text inputs, disabled, or readonly fields', () => {
    const unwire = wireDatePickerTap(document);
    const text = makeInput('text');
    const disabled = makeInput('date', { disabled: true });
    const readonly = makeInput('date', { readOnly: true });
    [text, disabled, readonly].forEach((el) => { focusIn(el); click(el); });
    expect(text.showPicker).not.toHaveBeenCalled();
    expect(disabled.showPicker).not.toHaveBeenCalled();
    expect(readonly.showPicker).not.toHaveBeenCalled();
    [text, disabled, readonly].forEach((el) => el.remove());
    unwire();
  });

  it('a browser without showPicker is a silent no-op (typing still works)', () => {
    const unwire = wireDatePickerTap(document);
    const el = document.createElement('input');
    el.type = 'date';
    document.body.appendChild(el); // no showPicker defined
    expect(() => focusIn(el)).not.toThrow();
    el.remove();
    unwire();
  });

  it('unwire removes the listeners (proven-to-catch: a leak would keep firing)', () => {
    const unwire = wireDatePickerTap(document);
    unwire();
    const el = makeInput('date');
    focusIn(el);
    expect(el.showPicker).not.toHaveBeenCalled();
    el.remove();
  });

  it('no document is a safe no-op (SSR/node)', () => {
    expect(() => wireDatePickerTap(null)()).not.toThrow();
  });
});
