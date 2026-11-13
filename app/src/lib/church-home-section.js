// =============================================================================
// church-home-section — ask the Church home to show one of its sections
// =============================================================================
// The redesigned homepage (components/lovecorner/LoveCornerHome.jsx) and the
// phone's bottom bar both need to open the Church home ON a section: Watch →
// Worship, Prayer → Prayer, Events → Times. The home's sections are a
// SectionTabs strip inside ChurchHome; the shell only knows `churchView`. The
// same shape as lib/floating-player.js: one small store, a request, a
// subscription. ChurchHome subscribes and drives its strip in controlled mode;
// nothing here reaches the DOM.
const listeners = new Set();
let pending = null;

/** Ask the Church home to show `sectionId` ('worship' | 'speak' | 'prayer' | 'give' | 'times' | 'about'). */
export function requestChurchHomeSection(sectionId) {
  pending = sectionId ? String(sectionId) : null;
  for (const fn of [...listeners]) {
    try {
      fn(pending);
    } catch {
      /* a listener's error never blocks the rest */
    }
  }
}

/** The last request not yet consumed (so a home that mounts AFTER the tap still honors it). */
export function takePendingChurchHomeSection() {
  const p = pending;
  pending = null;
  return p;
}

export function subscribeChurchHomeSection(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// THE HOME SAYS WHICH SECTION IS OPEN (DR-1484). The request above is one-way;
// the phone's bar also needs to know what the home is SHOWING, so Watch lights
// on Worship and Events on Service times, and Home yields to them. ChurchHome
// publishes its open section while mounted; the dock reads it. Null when no
// Church home is on screen.
const current = { id: null };
const watchers = new Set();
export function publishChurchHomeSection(sectionId) {
  const next = sectionId ? String(sectionId) : null;
  if (current.id === next) return;
  current.id = next;
  for (const fn of [...watchers]) {
    try {
      fn(next);
    } catch {
      /* a watcher's error never blocks the rest */
    }
  }
}
export function readChurchHomeSection() {
  return current.id;
}
export function subscribeCurrentChurchHomeSection(fn) {
  watchers.add(fn);
  return () => watchers.delete(fn);
}
