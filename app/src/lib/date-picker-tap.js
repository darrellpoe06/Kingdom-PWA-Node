// =============================================================================
// date-picker-tap — tap a date field, get the CALENDAR (Darrell 2026-07-07)
// =============================================================================
// "The month day year should show a calendar when you click it right away so we
// can pick a date instead of typing it out." Native date inputs only open
// their picker from the tiny icon; the field itself makes you type segments.
// This wires ONE delegated listener at the document level so EVERY date /
// datetime-local / month / time field in the app — current and future, any
// surface, any boot — opens its native picker on focus or click. Typing still
// works (the picker is additive; Esc dismisses it), keyboard users keep full
// control, and browsers without showPicker() are a silent no-op.
// Pure DOM; no React, no network. Returns an unwire function for tests.
// =============================================================================

const PICKER_TYPES = new Set(['date', 'datetime-local', 'month', 'time', 'week']);

function openPickerFor(el) {
  if (!el || el.tagName !== 'INPUT') return;
  if (!PICKER_TYPES.has(el.type)) return;
  if (el.disabled || el.readOnly) return;
  try {
    if (typeof el.showPicker === 'function') el.showPicker();
  } catch {
    // NotAllowedError (no user activation) or unsupported — typing still works.
  }
}

export function wireDatePickerTap(doc = typeof document !== 'undefined' ? document : null) {
  if (!doc) return () => {};
  // focusin bubbles (focus does not) → one listener covers every current and
  // future input. click covers re-opening on an already-focused field.
  const onFocusIn = (e) => openPickerFor(e.target);
  const onClick = (e) => openPickerFor(e.target);
  doc.addEventListener('focusin', onFocusIn);
  doc.addEventListener('click', onClick);
  return () => {
    doc.removeEventListener('focusin', onFocusIn);
    doc.removeEventListener('click', onClick);
  };
}
