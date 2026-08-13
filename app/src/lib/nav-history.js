// app/src/lib/nav-history.js — sovereign client-side navigation history (CORE).
//
// Real browser BACK / FORWARD for the PWA, without a router dependency.
//
// The app's primary navigation is three React state holders in the shell
// (view / booksView / churchView). Every top tab and every Books/Church sub-tab
// flows through that triple, so syncing the triple to window.history gives the
// DEVICE back button, in-app Back/Forward controls, and deep-links app-wide.
// Detail-level surfaces (modals, panels, expandable sub-views) layer ON TOP via
// the two composable primitives at the bottom — useHistoryToggle (boolean
// overlays) and useHistoryValue (a value that should revert on Back). Each
// primitive pushes exactly ONE history entry it owns and reacts only to its own
// marker, so Back steps through them one level at a time and they never collide.
//
// CORE module (lib/): feature modules MAY import it (e.g. Projects' subView via
// useHistoryValue); it imports no feature module and no shell. (DR-0076 boundary
// law — verified-not-claimed: the gate in scripts/module-boundary-guard.mjs
// allows feature -> core, forbids core -> feature / shell.)
//
// Pure helpers (serializeNav / parseNav / navKey) carry zero DOM dependency and
// are unit-tested directly; the hooks are proven by a render harness that
// navigates then fires popstate and asserts the prior view returns
// (src/__tests__/nav-history.test.jsx — the Verification-Doctrine proof).

import { useEffect, useRef, useState, useCallback } from 'react';

// ── pure location <-> URL helpers (no DOM; unit-testable) ───────────────────

// Top-level views that are real routes. This MIRRORS getInitialView()'s VALID
// list in the shell, and "mirrors" is load-bearing: when the two drifted, half
// the app's tabs were unknown to parseNav, so the seed's sameUrl check
// disagreed with the booted view and rewrote the URL on arrival — dropping
// every query param that is not view/sub/PRESERVED_PARAMS. Measured 2026-08-13
// while auditing DR-0296's own remainder: 15 of the shell's 30 views were
// missing here (tlc, voice, scribe, library, recipes, games, tvtime, advocacy,
// databack, messages, relationships, inventory, forecast, cohorts,
// tlc-assistant). The drift is now GUARDED — nav-history.test.jsx derives the
// shell's list from source and fails if these two ever disagree again.
export const VALID_VIEWS = [
  'overview', 'books', 'inbound', 'rentals', 'projects', 'practice', 'tlc',
  'opportunities', 'about', 'church', 'markets', 'notes', 'create', 'voice',
  'scribe', 'library', 'recipes', 'games', 'tvtime', 'advocacy', 'databack',
  'messages', 'admin', 'center', 'crm', 'relationships', 'inventory',
  'forecast', 'cohorts', 'tlc-assistant',
];

// Legacy church deep-links shipped as ?view=engagement|choir|pulpit|learn|...
// (pre-history-nav). parseNav keeps honoring them so old bookmarks/links work.
// This list must stay a SUPERSET of every alias the shell ever honored, because
// the shell now resolves its boot sub-tab through parseNav (initialChurchView
// below) — a name dropped from here would silently stop being a working link.
const CHURCH_ALIASES = [
  'engagement', 'choir', 'pulpit', 'learn', 'events',
  'scripture', 'bus', 'harvest', 'conference', 'program',
];

// Defaults the shell boots with; a location equal to default writes a clean URL.
const DEFAULT_VIEW = 'overview';
const DEFAULT_BOOKS = 'calendar';
const DEFAULT_CHURCH = 'home';

// Serialize a nav location -> query string ('' when fully default => clean home
// URL). Only the ACTIVE view's sub is written, so the URL never carries stale
// sub-state from a tab you've since left.
export function serializeNav(loc) {
  const sp = new URLSearchParams();
  const view = (loc && loc.view) || DEFAULT_VIEW;
  if (view !== DEFAULT_VIEW) sp.set('view', view);
  if (view === 'church' && loc && loc.churchView && loc.churchView !== DEFAULT_CHURCH) sp.set('sub', loc.churchView);
  if (view === 'books' && loc && loc.booksView && loc.booksView !== DEFAULT_BOOKS) sp.set('sub', loc.booksView);
  const s = sp.toString();
  return s ? `?${s}` : '';
}

// Parse a query string -> { view, booksView, churchView }. Tolerant: unknown
// views fall back to overview; church aliases resolve to the right sub.
export function parseNav(search) {
  const out = { view: DEFAULT_VIEW, booksView: DEFAULT_BOOKS, churchView: DEFAULT_CHURCH };
  try {
    const sp = new URLSearchParams(search || '');
    const v = (sp.get('view') || '').toLowerCase().trim();
    const sub = (sp.get('sub') || '').toLowerCase().trim();
    if (CHURCH_ALIASES.includes(v)) { out.view = 'church'; out.churchView = v; return out; }
    if (VALID_VIEWS.includes(v)) out.view = v;
    if (out.view === 'church' && sub) out.churchView = sub;
    if (out.view === 'books' && sub) out.booksView = sub;
  } catch (e) { /* malformed query -> defaults */ }
  return out;
}

// The Books sub-tabs that are real routes, in nav order. Mirrors the Books
// sub-nav id list in the shell; kept here beside VALID_VIEWS so a ?sub= deep-link
// resolves through ONE validated source. An unknown sub must fall back to the
// default, never route to a branch that renders nothing (the "blank Books tab"
// class this module exists to prevent).
export const VALID_BOOKS_SUBS = [
  'entities', 'accounts', 'debts', 'transactions', 'imported', 'cart', 'k1099', 'calendar', 'legal',
];

// initialBooksView — the Books sub-tab a URL deep-links to, validated. The shell
// boots booksView from THIS (getInitialBooksView), restoring the parity that view
// (getInitialView) and churchView (getInitialChurchView) already had: before, the
// shell hard-coded 'calendar' and ignored ?sub=, so ?view=books&sub=imported
// opened Calendar and the history seed then dropped the sub from the URL — the
// deep-link "didn't work at all." Only honored when view is books; an unknown or
// absent sub returns the default so no deep-link can route to a dead branch.
export function initialBooksView(search) {
  const { view, booksView } = parseNav(search);
  return view === 'books' && VALID_BOOKS_SUBS.includes(booksView) ? booksView : DEFAULT_BOOKS;
}

// The Church sub-tabs that are real routes. Mirrors the Church sub-nav id list
// in the shell (the staff-only ids are included on purpose: their render branches
// exist and do their OWN staff gating, so a deep-link resolves to a real branch
// and the gate — not to a blank screen).
export const VALID_CHURCH_SUBS = [
  'home', 'pulpit', 'scripture', 'engagement', 'choir', 'bus', 'program',
  'learn', 'eternal-algorithms', 'conference', 'events', 'projects',
  'harvest', 'videowall', 'devices', 'infra-plan', 'observe',
];

// initialChurchView — the Church sub-tab a URL deep-links to, validated.
//
// THE BUG THIS EXISTS TO KILL (Darrell 2026-08-13, opening a shared lesson link:
// "doesnt even take the user to the actual lessons.... Only to the live stream
// tab with the player open for nothing!!!"). The shell's getInitialChurchView
// read ONLY `?view=`, never `?sub=`. Every share link this app produces is
// `?view=church&sub=learn&course=…&lesson=…` — and because 'church' is not a
// sub-tab NAME, that boot resolved to 'home', the Worship tab, with the live
// player mounted over nothing. ChurchLearn's own deep-link reader was correct
// and was simply never reached: the lesson tests mounted ChurchLearn directly,
// so nothing in the suite ever walked the SHELL's routing decision. That is the
// gap (LESSONS P16 — verify the surface the user actually uses), and it is why
// this resolution now lives HERE, pure and asserted, with the shell delegating.
//
// Only honored when the view is church; an unknown or absent sub returns the
// default so no deep-link can route to a dead branch.
export function initialChurchView(search) {
  const { view, churchView } = parseNav(search);
  return view === 'church' && VALID_CHURCH_SUBS.includes(churchView) ? churchView : DEFAULT_CHURCH;
}

// Stable equality key — keys off the ACTIVE view's sub only, so switching tabs
// while an inactive tab retains its sub-state does not register a phantom change.
export function navKey(loc) {
  const view = (loc && loc.view) || DEFAULT_VIEW;
  const sub = view === 'church' ? ((loc && loc.churchView) || DEFAULT_CHURCH)
    : view === 'books' ? ((loc && loc.booksView) || DEFAULT_BOOKS)
    : '';
  return `${view}|${sub}`;
}

// ── the browser-history spine hook (used once, in the shell) ────────────────

// Door/context params that must SURVIVE in-app navigation. A door launch
// (?lovecorner=1 / ?moore=1 / ?tlc=1 / ?biz=slug) scopes the whole session;
// serializeNav writes only view/sub, so without this a door visitor's first
// tab-tap rewrote the URL bare and the NEXT reload booted as full PoeTech —
// while the reverse collision (a PoeTech reload booting as the church door off
// bare ?view=church) is fixed in church-own-door.js. Exported for tests.
//
// `demo` joined them 2026-08-13, and it is the most consequential of the set.
// The shell re-derives the persona from the URL on EVERY render
// (`const demoPersona = getDemoPersona()`, not a useState initializer), and
// `isAnyDemoMode` is the single flag the save effect opens with — "Demo +
// picker + reviewer never write to localStorage (or push snapshots)." So
// dropping `demo` from the URL did not merely change the address bar: the next
// render lost the persona, the suppression lifted, and the sample household's
// fabricated balances were free to be written into the user's real storage and
// pushed as a snapshot. One tab tap was enough. Proven in a live render harness
// before the fix (src/__tests__/demo-param-survives-nav.test.jsx).
//
// `join` is deliberately NOT here: it is a one-time claim token, read once into
// state by ClaimInviteBanner, and keeping it in the URL would leave an invite
// token sitting in every screenshot and shared link.
export const PRESERVED_PARAMS = ['lovecorner', 'moore', 'tlc', 'biz', 'demo'];

// Compose the full URL for a location, preserving the app's base path
// (/poetech-app/ on the NAS, / on Vercel) — serializeNav only owns the query —
// and carrying the door/context params through every push.
function urlFor(loc) {
  const path = (typeof window !== 'undefined' && window.location && window.location.pathname) || '/';
  const nav = serializeNav(loc);
  try {
    const cur = new URLSearchParams((typeof window !== 'undefined' && window.location && window.location.search) || '');
    const out = new URLSearchParams(nav ? nav.slice(1) : '');
    for (const p of PRESERVED_PARAMS) {
      const v = cur.get(p);
      if (v != null) out.set(p, v);
    }
    const s = out.toString();
    return path + (s ? `?${s}` : '');
  } catch (e) {
    return path + nav;
  }
}

// useBrowserHistoryNav — wires the shell's nav triple to window.history.
//
//   nav = { view, setView, booksView, setBooksView, churchView, setChurchView }
//
// Returns { canGoBack, canGoForward, goBack, goForward } for in-app controls.
// Idempotent under React StrictMode double-invoke (guarded by refs).
export function useBrowserHistoryNav(nav) {
  const { view, setView, booksView, setBooksView, churchView, setChurchView } = nav;

  const lastKeyRef = useRef(null);   // navKey of the entry currently shown
  const idxRef = useRef(0);          // our depth in the session history
  const maxIdxRef = useRef(0);       // deepest pushed -> tells us if Forward exists
  const seededRef = useRef(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);

  // Own scroll restoration so the browser doesn't fight our Back handling.
  useEffect(() => {
    try { if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual'; } catch (e) {}
  }, []);

  // Seed the initial entry ONCE so the first Back has a target and every
  // popstate carries a nav payload. Preserve an already-correct URL (don't
  // rewrite ?view=engagement -> ?view=church&sub=engagement on load).
  useEffect(() => {
    if (seededRef.current) return;
    seededRef.current = true;
    const loc = { view, booksView, churchView };
    lastKeyRef.current = navKey(loc);
    try {
      const st = window.history.state;
      const idx = st && typeof st.navIdx === 'number' ? st.navIdx : 0;
      idxRef.current = idx;
      maxIdxRef.current = idx;
      const sameUrl = navKey(parseNav(window.location.search)) === navKey(loc);
      const url = sameUrl ? (window.location.pathname + (window.location.search || '')) : urlFor(loc);
      window.history.replaceState({ nav: loc, navIdx: idx, scrollY: 0 }, '', url);
      setCanGoBack(idx > 0);
    } catch (e) { /* history unavailable -> nav still works, just no back stack */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Push a new entry whenever the shown location changes by genuine forward
  // navigation. Changes that came FROM a popstate restore set lastKeyRef first,
  // so this no-ops on them (guard #1) — no phantom entries, no loop.
  useEffect(() => {
    if (!seededRef.current) return;
    const loc = { view, booksView, churchView };
    const key = navKey(loc);
    if (key === lastKeyRef.current) return;
    lastKeyRef.current = key;
    const nextIdx = idxRef.current + 1;
    idxRef.current = nextIdx;
    maxIdxRef.current = nextIdx;   // a forward nav truncates any forward stack
    try {
      // Persist the scroll position of the page we're leaving onto its entry,
      // then push the new page at the top.
      const cur = window.history.state || {};
      const leavingY = window.scrollY || window.pageYOffset || 0;
      window.history.replaceState({ ...cur, scrollY: leavingY }, '');
      window.history.pushState({ nav: loc, navIdx: nextIdx, scrollY: 0 }, '', urlFor(loc));
    } catch (e) {}
    setCanGoBack(nextIdx > 0);
    setCanGoForward(false);
  }, [view, booksView, churchView]);

  // Apply a restored location on Back/Forward. Setting lastKeyRef BEFORE the
  // state setters means the push effect that follows sees no change and no-ops.
  useEffect(() => {
    const onPop = (e) => {
      const st = e.state;
      // An overlay/value entry (no .nav) is owned by a primitive below; ignore
      // it here and let that primitive handle it. The URL is unchanged for those
      // so parseNav would just echo the current view anyway.
      if (st && st._ovl) return;
      if (st && st._hv) return;
      const loc = (st && st.nav) || parseNav(window.location.search);
      const newIdx = st && typeof st.navIdx === 'number' ? st.navIdx : 0;
      lastKeyRef.current = navKey(loc);
      idxRef.current = newIdx;
      if (loc.view !== undefined) setView(loc.view);
      if (loc.view === 'books') setBooksView(loc.booksView || DEFAULT_BOOKS);
      if (loc.view === 'church') setChurchView(loc.churchView || DEFAULT_CHURCH);
      setCanGoBack(newIdx > 0);
      setCanGoForward(newIdx < maxIdxRef.current);
      const y = (st && typeof st.scrollY === 'number') ? st.scrollY : 0;
      // Restore a saved scroll position after the restored view paints. Skip the
      // y===0 case: there is nothing to restore, the prior page is already at top
      // (forward navs scroll to top), and it avoids a needless scrollTo.
      if (y > 0) {
        try { requestAnimationFrame(() => { try { window.scrollTo(0, y); } catch (e2) {} }); }
        catch (e3) { try { window.scrollTo(0, y); } catch (e4) {} }
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [setView, setBooksView, setChurchView]);

  const goBack = useCallback(() => { try { window.history.back(); } catch (e) {} }, []);
  const goForward = useCallback(() => { try { window.history.forward(); } catch (e) {} }, []);

  return { canGoBack, canGoForward, goBack, goForward };
}

// ── composable detail-level primitives ──────────────────────────────────────

// useHistoryToggle — make the browser/device Back button CLOSE a boolean overlay
// (modal, slide-over, expanded panel) instead of leaving the page. Pushes one
// entry when the overlay opens; Back pops it and closes; a programmatic close
// (an X button) pops its own entry so the stack stays balanced.
//
//   const [open, setOpen] = useState(false);
//   useHistoryToggle(open, () => setOpen(false), 'feedback');
export function useHistoryToggle(isOpen, close, key = 'overlay') {
  const pushedRef = useRef(false);

  useEffect(() => {
    if (isOpen && !pushedRef.current) {
      pushedRef.current = true;
      try { window.history.pushState({ _ovl: true, ovlKey: key }, ''); } catch (e) {}
    } else if (!isOpen && pushedRef.current) {
      // Closed programmatically — unwind our own entry.
      pushedRef.current = false;
      try { window.history.back(); } catch (e) {}
    }
  }, [isOpen, key]);

  useEffect(() => {
    const onPop = () => {
      if (pushedRef.current) {
        pushedRef.current = false;
        close();
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [close]);
}

// useHistoryValue — make Back REVERT a value to its base. For a sub-view that is
// not boolean (e.g. Projects list <-> scopes): going to a non-base value pushes
// an entry; Back returns to base. Restores an explicit value if Forward lands on
// one. Self-contained: owns only its `_hv` entries, so it composes with the
// spine and with other primitives.
//
//   const [subView, setSubView] = useState('list');
//   useHistoryValue(subView, setSubView, { base: 'list', key: 'projects-sub' });
export function useHistoryValue(value, setValue, opts = {}) {
  const base = opts.base !== undefined ? opts.base : '';
  const key = opts.key || 'hv';
  const pushedRef = useRef(false);

  useEffect(() => {
    if (value !== base && !pushedRef.current) {
      pushedRef.current = true;
      try { window.history.pushState({ _hv: true, hvKey: key, hvValue: value }, ''); } catch (e) {}
    } else if (value === base && pushedRef.current) {
      // Returned to base programmatically — unwind our entry.
      pushedRef.current = false;
      try { window.history.back(); } catch (e) {}
    }
  }, [value, base, key]);

  useEffect(() => {
    const onPop = (e) => {
      const st = e.state;
      if (st && st._hv && st.hvKey === key) {
        // Forward (or Back) landed on one of our value entries — restore it.
        pushedRef.current = true;
        setValue(st.hvValue);
      } else if (pushedRef.current) {
        // Back stepped off our entry -> return to base.
        pushedRef.current = false;
        setValue(base);
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [key, base, setValue]);
}
