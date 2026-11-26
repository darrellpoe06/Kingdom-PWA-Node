// =============================================================================
// LearnDoor — the shell's single, safe entry to the discovery page
// =============================================================================
// The shell renders its existing Learn element and hands it here. This returns that SAME element untouched whenever the
// discovery page should not (or cannot) show: a link that names a course or lesson, a device that turned it off
// (localStorage poe-learn-discover = '0', or ?discover=0), or if the discovery chunk fails to load or crashes. Learn
// is therefore always one render away; the discovery page can never take it down. The page loads lazily, so the app's
// first paint does not carry its index.
// =============================================================================
import React, { Suspense } from 'react';

const Entry = React.lazy(() => import('./LearnDiscoverEntry.jsx'));

export const DISCOVER_OFF_KEY = 'poe-learn-discover';

export function discoveryWanted(search = typeof window !== 'undefined' ? window.location.search : '', store = null) {
  try {
    const q = new URLSearchParams(search || '');
    if (q.get('lesson') || q.get('course')) return false; // a link to an exact place goes straight to Learn, as it always did
    if (q.get('discover') === '0') return false;
  } catch {
    return false;
  }
  try {
    const s = store || (typeof window !== 'undefined' ? window.localStorage : null);
    if (s && s.getItem(DISCOVER_OFF_KEY) === '0') return false;
  } catch {
    /* no storage: the page shows */
  }
  return true;
}

class Guard extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error) {
    console.error('Learning Zone discovery failed; showing Learn.', error);
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export default function LearnDoor({ learn, search, store = null }) {
  if (!discoveryWanted(search, store)) return learn;
  return (
    <Guard fallback={learn}>
      <Suspense
        fallback={
          <div role="status" aria-live="polite" className="py-16 text-center text-sm opacity-60">
            Loading...
          </div>
        }
      >
        <Entry renderLearn={() => learn} />
      </Suspense>
    </Guard>
  );
}

/** For the shell: the discovery door for the Learn view, any other view untouched. */
export function withLearnDoor(churchView, learnElement) {
  return churchView === 'learn' ? <LearnDoor learn={learnElement} /> : learnElement;
}
