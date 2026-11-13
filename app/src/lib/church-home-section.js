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
  const id = sectionId ? String(sectionId) : null;
  pending = id;
  const live = [...listeners];
  for (const fn of live) {
    try {
      fn(id);
    } catch {
      /* a listener's error never blocks the rest */
    }
  }
  // A LIVE LISTENER *IS* THE CONSUMPTION (DR-1499). `pending` exists for the
  // home that mounts AFTER the tap; a home that was already listening has
  // handled it, so holding the value makes it a STALE request that replays on
  // the next mount — the reader presses Watch, wanders to Learn, comes back,
  // and the page opens on Worship because of a tap two screens ago. Harmless
  // enough to hide while nothing moved; it surfaced the moment a requested
  // section began scrolling the reader to it.
  if (live.length) pending = null;
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
