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
