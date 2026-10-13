// =============================================================================
// reading-source — "Show the text": open the page a reading comes from
// =============================================================================
// Darrell 2026-09-24, on his Fold, after leaving a lesson that kept reading:
// "Also need to be able to go back to the reading page to see the text when I
// want or any user!!!!!!!"
//
// The reader lives in the app shell and plays on every tab (DR-0633); the TEXT
// lives on its own page. The reader knows WHAT it is reading (the read
// target's owner, and the sentence). The page that knows HOW to open itself at
// a sentence is the surface that owns it: the Learn landing opens a lesson at a
// saved sentence and highlights it. So the surface registers an opener here,
// and the reader asks. There is one landing, never a second copy.
//
// openReadingSource(owner, sentence) returns true when some opener took it.
// =============================================================================

const openers = new Set();

/**
 * A surface that can open a reading registers here. `fn({ owner, sentence })`
 * returns true when it recognized the owner and is opening it.
 * Returns the unregister function.
 */
export function registerReadingOpener(fn) {
  if (typeof fn !== 'function') return () => {};
  openers.add(fn);
  return () => openers.delete(fn);
}

/** Ask the surfaces to open the page this reading comes from. */
export function openReadingSource(owner, sentence = 0) {
  if (!owner) return false;
  for (const fn of [...openers]) {
    try { if (fn({ owner: String(owner), sentence: Math.max(0, Number(sentence) || 0) })) return true; } catch (_) { /* the next opener may know it */ }
  }
  return false;
}

/** Tests only. */
export function _resetReadingOpenersForTests() { openers.clear(); }
