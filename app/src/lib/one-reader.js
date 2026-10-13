// =============================================================================
// one-reader — only ONE read-aloud control on the screen at a time (DR-0718)
// =============================================================================
// Darrell 2026-10-01 sent a screenshot of the READ ALOUD panel with its Text
// size, Colors, Follow along and Speed sections drawn two and three times,
// stacked over each other. Each section exists once in TTSControl, so one
// reader cannot draw it twice; two readers can. Measured in the code: the app
// mounts its reader for every view (poe-financial-mvp-v28.jsx), and the
// Practice "Learn" tab mounts PracticeLearn, whose own reader is on by default
// (PracticeLearn.jsx `readAloud = true`), so that tab carried TWO readers,
// fixed to the same corner, each with its own panel, its own audio session
// and its own answer to a Play request. The TLC door did the same.
//
// The rule now: every reader registers here, and only the one with the
// highest priority (the app-level reader, which is handed the view) renders;
// ties go to the reader that registered first. A reader that is not the one
// renders nothing and holds nothing. When the chosen one unmounts, the next
// takes over. Pure module state with a subscribe, so it tests without React.
// =============================================================================

let seq = 0;
const entries = new Map(); // id -> { priority, order }
const subs = new Set();
let chosen = null;

const pick = () => {
  let best = null;
  for (const [id, e] of entries) {
    if (!best || e.priority > best.e.priority || (e.priority === best.e.priority && e.order < best.e.order)) best = { id, e };
  }
  return best ? best.id : null;
};
const emit = () => {
  const next = pick();
  if (next === chosen) return;
  chosen = next;
  for (const fn of [...subs]) { try { fn(); } catch (_) { /* one listener never stops the rest */ } }
};

/** A new reader id. */
export function newReaderId() { seq += 1; return `reader-${seq}`; }

/** Register a reader; returns the function that unregisters it. */
export function registerReader(id, priority = 0) {
  seq += 1;
  entries.set(id, { priority: Number(priority) || 0, order: seq });
  emit();
  return () => { entries.delete(id); emit(); };
}

/** The reader that renders now (null before any registered). */
export function chosenReader() { return chosen; }

/** May this reader render? Before any reader registers, every one may. */
export function mayRender(id) { return chosen === null || chosen === id; }

export function subscribeReaders(fn) { subs.add(fn); return () => subs.delete(fn); }

/** How many readers are registered (tests and the layout probe). */
export function readerCount() { return entries.size; }

/** Tests only. */
export function _resetReadersForTests() { entries.clear(); subs.clear(); chosen = null; }
