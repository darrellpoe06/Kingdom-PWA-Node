// =============================================================================
// LifeHub — Christina's home view, opt-in, wired to real records
// =============================================================================
// The structure and the counts come from lib/life-hub.js; the choice to see
// this screen at all comes from lib/home-view-prefs.js and defaults to OFF, so
// nobody's front door changes unless they pick it. Everything here is rendered
// from records this app already holds, and a tile with no record shows no
// number (DR-0061 — a painted number on the family's front screen is worse
// than none).
//
// COLORS ARE CLASSES, NEVER INLINE. contrast-guard reads the theme CSS as the
// single source of truth and an inline hex cannot be remapped per theme, which
// is how a midnight-blue accent once rendered 2.84:1 on black. Every surface
// here uses the palette classes the rest of the cockpit uses, so this view
// inherits the theme the reader already chose and stays inside the contrast
// gate — including at Big Print, where the chrome must not grow (DR-0438).
//
// THE UNREAD COUNT IS THE WATCHER'S, NOT OURS. lib/dm-notify.js owns the only
// direct-message subscription in the page on purpose (a second one would mean a
// second realtime channel over the same rows), and it broadcasts every change
// as DM_UNREAD_EVENT. This view listens and shows nothing until it hears — so
// the badge is late rather than invented, which is the right way round. A
// literal 4 sat on the Messages tile in the mockup; that number is exactly what
// this refuses to draw.
import React, { useEffect, useMemo, useState } from 'react';
import { hubTiles, actionsFor, hasRealCount } from '../lib/life-hub.js';
import { useHomePrefs, setHomeView, setHubDensity, HUB_DENSITIES } from '../lib/home-view-prefs.js';
import { DM_UNREAD_EVENT } from '../lib/notify-readiness.js';
import {
  focusForDay, focusProgress, addFocusItem, toggleFocusItem, removeFocusItem,
  addGoal, daysUntil, GOAL_STATUSES,
} from '../lib/daily-focus.js';

const CARD = 'bg-white border border-[#E8E4DC] p-3';
const MUTED = 'text-[#5A5751]';
const FOCUS_RING = 'focus:outline focus:outline-2 focus:outline-[#B85838]';

export default function LifeHub({ data = {}, setData = null, setView = null, setChurchView = null, setBooksView = null }) {
  const { density } = useHomePrefs();
  const [unread, setUnread] = useState(0);
  const [focusText, setFocusText] = useState('');
  const [goalText, setGoalText] = useState('');
  const [goalBy, setGoalBy] = useState('');

  // The page's single DM watcher tells every surface that needs to know.
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const onUnread = (e) => {
      const n = Number(e?.detail?.next);
      setUnread(Number.isFinite(n) && n > 0 ? Math.floor(n) : 0);
    };
    window.addEventListener(DM_UNREAD_EVENT, onUnread);
    return () => window.removeEventListener(DM_UNREAD_EVENT, onUnread);
  }, []);

  const tiles = useMemo(() => hubTiles(data, { unread }), [data, unread]);
  const actions = useMemo(() => actionsFor(density), [density]);
  const focusList = data.dailyFocus || [];
  const todays = focusForDay(focusList);
  const progress = focusProgress(focusList);
  const goals = (data.goals || []).filter((g) => g && g.status !== 'released');

  const go = (view, churchView) => {
    if (!view || typeof setView !== 'function') return;
    setView(view);
    if (churchView && typeof setChurchView === 'function') setChurchView(churchView);
    if (view === 'books' && typeof setBooksView === 'function') setBooksView('accounts');
    try { window.scrollTo({ top: 0 }); } catch { /* non-browser */ }
  };

  // Writes go through the pure functions in daily-focus.js, applied to the
  // world the host lends us. The logic is in the module; the host only holds
  // the setter, which is why this view can exist without growing the frozen
  // shell by a single line.
  const write = (key, next) => {
    if (typeof setData !== 'function') return;
    setData((d) => ({ ...d, [key]: next(d[key] || []) }));
  };

  const submitFocus = (e) => {
    e.preventDefault();
    const t = focusText.trim();
    if (!t) return;
    write('dailyFocus', (list) => addFocusItem(list, t));
    setFocusText('');
  };

  const submitGoal = (e) => {
    e.preventDefault();
    const t = goalText.trim();
    if (!t) return;
    write('goals', (list) => addGoal(list, { title: t, targetDate: goalBy || null }));
    setGoalText('');
    setGoalBy('');
  };

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Life Hub</h2>
          <p className={`text-xs ${MUTED}`}>Everything in one place. Your own view — the Current View is still there.</p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Chrome stays chrome: fixed text-[0.625rem] so it does not grow with
              the reader's text size (DR-0438), and it wraps rather than
              widening the row on a 360px phone. */}
          {HUB_DENSITIES.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setHubDensity(d)}
              aria-pressed={density === d}
              className={`border px-2 py-1 text-[0.625rem] uppercase tracking-wider min-h-[36px] ${FOCUS_RING} ${density === d ? 'border-[#1A1815] bg-white' : 'border-[#E8E4DC]'}`}
            >
              {d}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setHomeView('current')}
            className={`border border-[#1A1815] px-2 py-1 text-[0.625rem] uppercase tracking-wider min-h-[36px] ${FOCUS_RING}`}
          >
            Current View
          </button>
        </div>
      </header>

      {/* THE SIX TILES. Two columns at 360px, three from sm up — the text gets
          the width and the chrome never does (DR-0410 / DR-0438). */}
      <nav aria-label="Life Hub" className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {tiles.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => go(t.view, t.churchView)}
            className={`${CARD} text-left hover:bg-[#FAF8F4] ${FOCUS_RING}`}
          >
            <span className="flex items-baseline justify-between gap-2">
              <span className="text-sm font-semibold">{t.label}</span>
              {hasRealCount(t) && (
                <span className="text-xs border border-[#5A6E3D] text-[#5A6E3D] px-1.5" aria-label={`${t.count} on record`}>{t.count}</span>
              )}
            </span>
            <span className={`block text-[0.625rem] ${MUTED}`}>{t.sub}</span>
          </button>
        ))}
      </nav>

      {/* TODAY'S FOCUS — a real record (lib/daily-focus.js), written here for
          the first time. Before this view it existed in code and was reachable
          from nowhere in the app. */}
      <section aria-labelledby="hub-focus-h" className={CARD}>
        <div className="flex items-baseline justify-between gap-2">
          <h3 id="hub-focus-h" className="text-sm font-semibold">Today&apos;s Focus</h3>
          {todays.length > 0 && (
            <span className={`text-[0.625rem] ${MUTED}`}>{progress.done} of {progress.total} done</span>
          )}
        </div>
        <ul className="mt-2 space-y-1">
          {todays.map((f) => (
            <li key={f.id} className="flex items-start gap-2">
              <input
                id={`focus-${f.id}`}
                type="checkbox"
                checked={!!f.done}
                onChange={() => write('dailyFocus', (list) => toggleFocusItem(list, f.id))}
                className={`mt-0.5 ${FOCUS_RING}`}
              />
              <label htmlFor={`focus-${f.id}`} className={`text-sm ${f.done ? MUTED : ''}`}>{f.label}</label>
              <button
                type="button"
                onClick={() => write('dailyFocus', (list) => removeFocusItem(list, f.id))}
                aria-label={`Remove ${f.label}`}
                className={`ml-auto text-[0.625rem] ${MUTED} ${FOCUS_RING}`}
              >
                Remove
              </button>
            </li>
          ))}
          {todays.length === 0 && <li className={`text-xs ${MUTED}`}>Nothing yet for today.</li>}
        </ul>
        <form onSubmit={submitFocus} className="mt-2 flex flex-wrap gap-2">
          <label htmlFor="hub-focus-new" className="sr-only">Add to today&apos;s focus</label>
          <input
            id="hub-focus-new"
            value={focusText}
            onChange={(e) => setFocusText(e.target.value)}
            placeholder="One thing that matters today"
            className={`flex-1 min-w-0 border border-[#E8E4DC] bg-white p-2 text-sm ${FOCUS_RING}`}
          />
          <button type="submit" className={`border border-[#1A1815] px-3 py-2 text-[0.625rem] uppercase tracking-wider min-h-[36px] ${FOCUS_RING}`}>Add</button>
        </form>
      </section>

      {/* MY GOALS — also a real record, and deliberately WITHOUT a typed
          percentage. A number a person types about their own progress is as
          invented as the checklist this replaces, so a goal shows days and
          linked work, never a self-reported 60%. */}
      <section aria-labelledby="hub-goals-h" className={CARD}>
        <h3 id="hub-goals-h" className="text-sm font-semibold">My Goals</h3>
        <ul className="mt-2 space-y-1">
          {goals.map((g) => {
            const days = daysUntil(g);
            return (
              <li key={g.id} className="flex items-baseline justify-between gap-2">
                <span className="text-sm">{g.title}</span>
                <span className={`text-[0.625rem] ${MUTED}`}>
                  {GOAL_STATUSES.includes(g.status) ? g.status : 'open'}
                  {typeof days === 'number' ? ` · ${days} day${days === 1 ? '' : 's'}` : ''}
                </span>
              </li>
            );
          })}
          {goals.length === 0 && <li className={`text-xs ${MUTED}`}>No goals set yet.</li>}
        </ul>
        <form onSubmit={submitGoal} className="mt-2 flex flex-wrap gap-2">
          <label htmlFor="hub-goal-new" className="sr-only">Add a goal</label>
          <input
            id="hub-goal-new"
            value={goalText}
            onChange={(e) => setGoalText(e.target.value)}
            placeholder="Something you are working toward"
            className={`flex-1 min-w-0 border border-[#E8E4DC] bg-white p-2 text-sm ${FOCUS_RING}`}
          />
          <label htmlFor="hub-goal-by" className="sr-only">Target date</label>
          <input
            id="hub-goal-by"
            type="date"
            value={goalBy}
            onChange={(e) => setGoalBy(e.target.value)}
            className={`border border-[#E8E4DC] bg-white p-2 text-sm ${FOCUS_RING}`}
          />
          <button type="submit" className={`border border-[#1A1815] px-3 py-2 text-[0.625rem] uppercase tracking-wider min-h-[36px] ${FOCUS_RING}`}>Set</button>
        </form>
      </section>

      {/* QUICK ACTIONS — four, six or eight, which is the one thing her three
          mockups genuinely disagree about. Every one lands somewhere real; the
          two that have no destination scroll to the record on this page. */}
      <section aria-labelledby="hub-actions-h">
        <h3 id="hub-actions-h" className={`text-[0.625rem] uppercase tracking-wider ${MUTED}`}>Quick Actions</h3>
        <div className="mt-1.5 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {actions.map((a) => (
            <button
              key={a.key}
              type="button"
              onClick={() => {
                if (a.view) return go(a.view, a.churchView);
                const id = a.key === 'focus' ? 'hub-focus-new' : 'hub-goal-new';
                try { document.getElementById(id)?.focus(); } catch { /* non-browser */ }
                return undefined;
              }}
              className={`${CARD} text-left text-sm hover:bg-[#FAF8F4] ${FOCUS_RING}`}
            >
              {a.label}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
