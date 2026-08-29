// =============================================================================
// confirm-action — the one primitive a destructive button goes through
// =============================================================================
// Darrell, 2026-08-29: "solutions?!!!!!!!!!!" — quoting the recorded refusal to
// gate destructive-confirm because 37 of 68 destructive buttons confirm in a
// PARENT no static scan can see.
//
// The refusal named a limit of SCANNING. This is the fix for the limit itself
// (DR-0131: fix the one primitive): when destruction routes through ONE named
// function, "does it confirm?" stops being a question about someone's parent
// component and becomes a question about one import — which a static gate CAN
// answer. The scan that could not resolve a prop callback resolves this.
//
// MEASURED before writing (DR-0314): six live buttons destroyed records with no
// confirmation anywhere in their chain — recipe (cloud row included), song
// idea (cloud), budget goal (cloud), calendar event / recurring / incident.
// Each was found by the gate this primitive unlocks, and each now goes through
// here. That is the standard proving itself on the day it was written down.
//
// FAIL-SAFE BY DESIGN: if no confirm dialog exists to ask (a headless render,
// a stripped environment), the action does NOT run. For destruction, silently
// proceeding is the wrong default in every case.
// =============================================================================

/**
 * Wrap a destructive action so it asks first.
 *
 *   <button onClick={confirmThen('Delete this recipe?', onDelete)}>
 *
 * `ask` is injectable for tests; it defaults to window.confirm. The wrapped
 * handler passes its arguments (including the click event) through untouched
 * and returns the action's own return value, so async callers still get their
 * promise.
 */
export function confirmThen(message, action, ask) {
  return (...args) => {
    if (typeof action !== 'function') return undefined;
    const dialog = ask
      || (typeof window !== 'undefined' && typeof window.confirm === 'function'
        ? window.confirm.bind(window)
        : null);
    if (!dialog) return undefined;          // no way to ask = no destruction
    if (!dialog(message)) return undefined; // the person said no
    return action(...args);
  };
}
