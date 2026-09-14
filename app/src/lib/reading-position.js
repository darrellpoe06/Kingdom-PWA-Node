// reading-position.js — the shared READING-POSITION / RESUME primitive.
//
// "the user should start reading wherever they are reading from inside the
//  PoeTech app — not have to start from the top — start from the
//  highlighted/cursor etc." (Darrell, 2026-06-25.)
//
// One primitive, every reading surface (the book Reader, The Word, Scripture,
// lessons, long docs): persist where the reader was, and on return resume
// EXACTLY there — never the top. The SAME scroll-anchor mechanism also powers
// the font-size whiplash fix (text-size.js): capture the element the reader is
// looking at, let layout change, restore it to the same spot.
//
// DESIGN:
//   - A position is anchored to a STABLE element id (`data-reading-anchor="..."`)
//     when the surface marks its sections, with a plain scrollY fallback. Anchors
//     survive re-render + font changes; scrollY survives anything.
//   - Persistence is per-user, per-surface, per-item, device-local (the same
//     fail-soft localStorage pattern as text-size / study-space). Cross-device
//     sync is a documented fast-follow (snapshot-sync), not needed to resume.
//   - Pure helpers (testable, no DOM) + a thin DOM layer (guarded, no-ops in
//     SSR/tests) + one React hook surfaces consume.
//
// Coordinates WITH nav-history.js (which restores window.scrollY per nav state):
// that handles page-to-page; this handles within-a-long-item, element-level, and
// across sessions. Different keys, complementary — they do not fight.

import { useCallback, useEffect, useRef, useState } from 'react';

export const READING_ATTR = 'data-reading-anchor';

// Spread onto a section element to make it a stable resume anchor:
//   <section {...anchorProps(`ch-${id}`)}>
export function anchorProps(id) {
  return id ? { [READING_ATTR]: String(id) } : {};
}

// --- pure persistence (localStorage map; fails soft) ------------------------

const asNum = (v, d = 0) => (Number.isFinite(v) ? v : d);
function safeStore(store) {
  try {
    if (store) return store;
    return (typeof localStorage !== 'undefined' && localStorage) ? localStorage : null;
  } catch { return null; }
}
export function posMapKey(userKey) { return `poe-reading-pos.${String(userKey || 'anon').toLowerCase()}`; }
export function entryKey(surface, itemId) { return `${surface || 'surface'}::${itemId || 'item'}`; }

export function normalizePos(raw = {}) {
  return {
    anchorId: typeof raw.anchorId === 'string' && raw.anchorId ? raw.anchorId : null,
    top: asNum(raw.top, 0),
    scrollY: asNum(raw.scrollY, 0),
    at: asNum(raw.at, 0),
  };
}

// Keep the map bounded — newest `at` wins, oldest pruned. Pure + testable.
export function prunePositions(map, cap = 60) {
  const entries = Object.entries(map || {});
  if (entries.length <= cap) return { ...map };
  entries.sort((a, b) => asNum(b[1]?.at) - asNum(a[1]?.at));
  return Object.fromEntries(entries.slice(0, cap));
}

export function loadPositions(userKey, store) {
  const ls = safeStore(store);
  if (!ls) return {};
  try {
    const raw = ls.getItem(posMapKey(userKey));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch { return {}; }
}

export function getPosition(userKey, surface, itemId, store) {
  const map = loadPositions(userKey, store);
  const hit = map[entryKey(surface, itemId)];
  return hit ? normalizePos(hit) : null;
}

export function savePosition(userKey, surface, itemId, pos, store, cap = 60) {
  const ls = safeStore(store);
  if (!ls) return { skipped: 'no-storage' };
  try {
    const map = loadPositions(userKey, store);
    map[entryKey(surface, itemId)] = normalizePos(pos);
    ls.setItem(posMapKey(userKey), JSON.stringify(prunePositions(map, cap)));
    return { saved: true };
  } catch (e) { return { skipped: 'write-error', error: e }; }
}

export function clearPosition(userKey, surface, itemId, store) {
  const ls = safeStore(store);
  if (!ls) return;
  try {
    const map = loadPositions(userKey, store);
    delete map[entryKey(surface, itemId)];
    ls.setItem(posMapKey(userKey), JSON.stringify(map));
  } catch { /* fail soft */ }
}

// --- pure scroll math (the anchor mechanism's core) -------------------------

// How far to scroll so an element returns to where it was after a layout change.
export function anchorDelta(prevTop, currTop) { return asNum(currTop) - asNum(prevTop); }

// The window.scrollY that puts the anchored element back at `savedTop` from the
// viewport top, given where it sits now (`currentRectTop`) and the current
// scrollY. Pure so the resume + font-fix math is regression-guarded.
export function resumeScrollY(currentScrollY, currentRectTop, savedTop) {
  return Math.max(0, asNum(currentScrollY) + (asNum(currentRectTop) - asNum(savedTop)));
}

export function resumeLabel(pos, nowMs = 0) {
  if (!pos || (!pos.anchorId && !pos.scrollY)) return null;
  const ago = asNum(nowMs) - asNum(pos.at);
  if (!pos.at || ago < 0) return 'Continue where you left off';
  const min = Math.floor(ago / 60000);
  if (min < 1) return 'Continue where you left off';
  if (min < 60) return `Continue where you left off (${min} min ago)`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `Continue where you left off (${hr} hr ago)`;
  const d = Math.floor(hr / 24);
  return `Continue where you left off (${d} day${d === 1 ? '' : 's'} ago)`;
}

// --- DOM layer (guarded; no-ops without a window/document) ------------------

function win(w) { return w || (typeof window !== 'undefined' ? window : null); }
function doc(d) { return d || (typeof document !== 'undefined' ? document : null); }

// The element the reader is currently looking at: the [data-reading-anchor]
// section straddling/closest below the top of the viewport, else whatever is
// painted at the top of the viewport (works on un-instrumented surfaces too —
// which is why the font fix is app-wide without touching every paragraph).
export function topVisibleAnchor(d, w) {
  const D = doc(d); const W = win(w);
  if (!D || !W) return null;
  try {
    const marked = Array.from(D.querySelectorAll(`[${READING_ATTR}]`));
    let best = null;
    for (const el of marked) {
      const r = el.getBoundingClientRect();
      if (r.bottom <= 0) continue;                 // scrolled past
      // prefer the marked section whose top is nearest to (and not far below) 0
      if (!best || (r.top <= best.top + 0.5)) {
        if (r.top <= (W.innerHeight || 0) * 0.6) best = { el, top: r.top };
      }
    }
    if (best) return { el: best.el, id: best.el.getAttribute(READING_ATTR), top: best.top };
    // fallback: the element painted at the top of the viewport
    const cx = Math.floor((W.innerWidth || 320) / 2);
    const probe = D.elementFromPoint(cx, 8);
    if (probe) {
      const marker = probe.closest ? probe.closest(`[${READING_ATTR}]`) : null;
      const el = marker || probe;
      return { el, id: el.getAttribute ? el.getAttribute(READING_ATTR) : null, top: el.getBoundingClientRect().top };
    }
  } catch { /* fall through */ }
  return null;
}

// Capture a live token for the synchronous font-resize case (holds the element
// ref so it survives the reflow).
export function captureAnchor(d, w) {
  const token = topVisibleAnchor(d, w);
  return token ? { el: token.el, id: token.id, top: token.top } : null;
}

// Restore a captured token after layout changed: scroll so the same element is
// back at the same viewport offset. Returns true if it scrolled.
export function applyAnchor(token, w) {
  const W = win(w);
  if (!W || !token || !token.el) return false;
  try {
    const currTop = token.el.getBoundingClientRect().top;
    const delta = anchorDelta(token.top, currTop);
    if (delta) W.scrollBy(0, delta);
    return true;
  } catch { return false; }
}

// Snapshot the current reading position for persistence (serializable).
export function currentReadingPos(d, w) {
  const W = win(w);
  const token = topVisibleAnchor(d, w);
  const scrollY = W ? (W.scrollY || W.pageYOffset || 0) : 0;
  return normalizePos({
    anchorId: token ? token.id : null,
    top: token ? token.top : 0,
    scrollY,
    at: Date.now(),
  });
}

// Restore a saved position (cross-session): align the saved anchor element to
// its saved offset, else fall back to the saved scrollY. Returns true if it ran.
export function restorePosition(pos, d, w) {
  const D = doc(d); const W = win(w);
  if (!W || !pos) return false;
  try {
    if (pos.anchorId && D) {
      const el = D.querySelector(`[${READING_ATTR}="${cssEscape(pos.anchorId)}"]`);
      if (el) {
        const rectTop = el.getBoundingClientRect().top;
        W.scrollTo(0, resumeScrollY(W.scrollY || 0, rectTop, pos.top));
        return true;
      }
    }
    W.scrollTo(0, Math.max(0, asNum(pos.scrollY)));
    return true;
  } catch { return false; }
}

function cssEscape(s) {
  if (typeof CSS !== 'undefined' && CSS.escape) return CSS.escape(s);
  return String(s).replace(/["\\\]]/g, '\\$&');
}

// --- the React hook surfaces consume ----------------------------------------

// useReadingResume — wire a long reading surface for resume in ~3 lines:
//   const { hasResume, resume, dismiss } = useReadingResume({ userKey, surface, itemId });
// Marks the reader's sections with anchorProps(...) for element-level precision;
// without anchors it still resumes by scrollY. Auto-restores on open; offers a
// "continue" affordance via hasResume/resume.
export function useReadingResume({ userKey, surface, itemId, enabled = true, autoRestore = true, store } = {}) {
  const [hasResume, setHasResume] = useState(false);
  const savedRef = useRef(null);
  const debounceRef = useRef(null);

  const persistNow = useCallback(() => {
    if (!enabled || !itemId) return;
    try { savePosition(userKey, surface, itemId, currentReadingPos(), store); } catch { /* soft */ }
  }, [enabled, userKey, surface, itemId, store]);

  // Load saved position when the item changes; auto-restore after layout.
  useEffect(() => {
    if (!enabled || !itemId) { setHasResume(false); return undefined; }
    const pos = getPosition(userKey, surface, itemId, store);
    savedRef.current = pos;
    const meaningful = !!(pos && (pos.anchorId || pos.scrollY > 4));
    setHasResume(meaningful);
    let raf1 = 0; let raf2 = 0;
    if (meaningful && autoRestore && typeof window !== 'undefined') {
      // two frames: let the surface paint its content before we scroll to it
      raf1 = window.requestAnimationFrame(() => {
        raf2 = window.requestAnimationFrame(() => { restorePosition(pos); });
      });
    }
    return () => {
      if (typeof window !== 'undefined') {
        if (raf1) window.cancelAnimationFrame(raf1);
        if (raf2) window.cancelAnimationFrame(raf2);
      }
    };
  }, [enabled, userKey, surface, itemId, autoRestore, store]);

  // Save on scroll (debounced), on hide, and on unmount.
  useEffect(() => {
    if (!enabled || !itemId || typeof window === 'undefined') return undefined;
    const onScroll = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(persistNow, 400);
    };
    const onHide = () => { if (document.visibilityState === 'hidden') persistNow(); };
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('beforeunload', persistNow);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('beforeunload', persistNow);
      persistNow();
    };
  }, [enabled, itemId, persistNow]);

  const resume = useCallback(() => {
    if (savedRef.current) restorePosition(savedRef.current);
    setHasResume(false);
  }, []);
  const dismiss = useCallback(() => setHasResume(false), []);

  return { hasResume, resume, dismiss, label: resumeLabel(savedRef.current, Date.now()) };
}
