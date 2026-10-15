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
// THE HERITAGE FINISH (DR-1046 Phase 3, Christina 2026-10-15): the same
// records, wearing the reference image — a welcome banner, six colored
// navigation cards, Today's Focus and My Goals, Quick Actions as colored icon
// tiles, and two cards the reference adds: Recent Messages and Recent
// Activity. Both read records: Recent Messages hears the page's single DM
// watcher (the unread count and the newest unread sender it already
// broadcasts), Recent Activity is lib/home-activity.js over incidents,
// projects, notes, photos, goals and finished focus items. Opt-in still: the
// Current View is one tap away and the default is untouched (Tier C waits on
// Darrell, DR-1046 §8).
//
// COLORS ARE CLASSES, NEVER INLINE. contrast-guard reads the theme CSS as the
// single source of truth and an inline hex cannot be remapped per theme, which
// is how a midnight-blue accent once rendered 2.84:1 on black. Every surface
// here uses the palette classes the rest of the cockpit uses, so this view
// inherits the theme the reader already chose and stays inside the contrast
// gate — including at Big Print, where the chrome must not grow (DR-0438).
// The six tile fills and the hero's gold caption are literal tokens with
// midnight twins in lib/theme-css.js.
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
import { recentActivity, agoLabel } from '../lib/home-activity.js';
import HomeHero from './shell/HomeHero.jsx';
import UiIcon from './UiIcon.jsx';

const CARD = 'bg-white border border-[#E8E4DC] rounded-2xl p-4';
const MUTED = 'text-[#5A5751]';
const FOCUS_RING = 'focus:outline focus:outline-2 focus:outline-[#B85838]';
const CHIP = 'border border-[#E8E4DC] px-2.5 py-1 rounded-full text-[0.625rem] uppercase tracking-wider min-h-[36px]';

// The six tiles' fills and icons, keyed by the tile's key (lib/life-hub.js).
// Fills are the theme's own tokens (forest, navy, deep teal, gold-text,
// charcoal, terracotta); white reads on each at 5.2:1 or better, measured.
const TILE_STYLE = {
  bigPicture: { fill: 'bg-[#1F3A2E]', icon: 'chart' },
  learn:      { fill: 'bg-[#1B2A4A]', icon: 'bookOpen' },
  messages:   { fill: 'bg-[#1C3F38]', icon: 'chat' },
  realEstate: { fill: 'bg-[#8A6510]', icon: 'home' },
  projects:   { fill: 'bg-[#2B2F2D]', icon: 'folder' },
  tlc:        { fill: 'bg-[#9E4A2A]', icon: 'heart' },
};
const ACTION_STYLE = {
  focus: { fill: 'bg-[#1F3A2E]', icon: 'check' },
  goal: { fill: 'bg-[#1B2A4A]', icon: 'pin' },
  message: { fill: 'bg-[#8A6510]', icon: 'chat' },
  lesson: { fill: 'bg-[#9E4A2A]', icon: 'bookOpen' },
  addProject: { fill: 'bg-[#1F3A2E]', icon: 'folder' },
  property: { fill: 'bg-[#1C3F38]', icon: 'home' },
  money: { fill: 'bg-[#2B2F2D]', icon: 'coins' },
  photo: { fill: 'bg-[#8A6510]', icon: 'eye' },
};
const ACTIVITY_ICON = { incident: 'alert', project: 'folder', note: 'dove', photo: 'eye', goal: 'pin', focus: 'check' };

export default function LifeHub({ data = {}, setData = null, setView = null, setChurchView = null, setBooksView = null, welcomeName = '' }) {
  const { density } = useHomePrefs();
  const [unread, setUnread] = useState(0);
  const [newest, setNewest] = useState(null);
  const [focusText, setFocusText] = useState('');
  const [goalText, setGoalText] = useState('');
  const [goalBy, setGoalBy] = useState('');

  // The page's single DM watcher tells every surface that needs to know.
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const onUnread = (e) => {
      const n = Number(e?.detail?.next);
      setUnread(Number.isFinite(n) && n > 0 ? Math.floor(n) : 0);
      setNewest(e?.detail?.newest && e.detail.newest.senderName ? e.detail.newest : null);
    };
    window.addEventListener(DM_UNREAD_EVENT, onUnread);
    return () => window.removeEventListener(DM_UNREAD_EVENT, onUnread);
  }, []);

  const tiles = useMemo(() => hubTiles(data, { unread }), [data, unread]);
  const actions = useMemo(() => actionsFor(density), [density]);
  const activity = useMemo(() => recentActivity(data, { limit: 5 }), [data]);
  const focusList = data.dailyFocus || [];
  const todays = focusForDay(focusList);
  const progress = focusProgress(focusList);
  const goals = data.goals || [];

  const write = (key, fn) => { if (setData) setData((d) => ({ ...d, [key]: fn(d[key] || []) })); };
  const go = (view, churchView) => {
    if (!view || !setView) return;
    setView(view);
    if (churchView && setChurchView) setChurchView(churchView);
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
  const openMessages = () => go('messages', null);

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
              className={`${CHIP} ${FOCUS_RING} ${density === d ? 'border-[#1A1815] bg-white' : ''}`}
            >
              {d}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setHomeView('current')}
            className={`${CHIP} border-[#1A1815] ${FOCUS_RING}`}
          >
            Current View
          </button>
        </div>
      </header>

      <HomeHero name={welcomeName} />

      {/* THE SIX TILES. Two columns at 360px, three from sm up, six from lg —
          the text gets the width and the chrome never does (DR-0410 / DR-0438). */}
      <nav aria-label="Life Hub" className="ts-grid-collapse grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {tiles.map((t) => {
          const st = TILE_STYLE[t.key] || { fill: 'bg-[#1F3A2E]', icon: 'folder' };
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => go(t.view, t.churchView)}
              className={`relative rounded-2xl ${st.fill} text-white p-3 min-h-[6.25rem] flex flex-col items-center justify-center text-center gap-1 shadow-sm hover:opacity-95 ${FOCUS_RING}`}
            >
              <span aria-hidden="true" className="text-[1.5rem] leading-none mb-1"><UiIcon name={st.icon} /></span>
              <span className="text-sm font-semibold leading-tight" style={{ fontFamily: '"Fraunces", serif' }}>{t.label}</span>
              <span className="block text-[0.625rem] opacity-85">{t.sub}</span>
              {/* A real count from a record. Above zero it is news and wears
                  terracotta; a real zero is honest but not an alert, so it
                  sits quietly in the tile's own ink. */}
              {hasRealCount(t) && (
                <span className={`absolute top-2 right-2 min-w-[1.25rem] h-5 px-1.5 rounded-full text-[0.625rem] font-semibold grid place-items-center ${t.count > 0 ? 'bg-[#9E4A2A] text-white' : 'border border-white/40 text-white/80'}`} aria-label={`${t.count} on record`}>{t.count}</span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="ts-grid-collapse grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* RECENT MESSAGES — what the single DM watcher has told this page, and
            nothing more: the unread count and the newest unread sender. The
            three chips are the Messages surface's own three tabs; each opens
            Messages, where the threads live. No preview is invented. */}
        <section aria-labelledby="hub-messages-h" className={CARD} data-testid="hub-messages">
          <div className="flex items-baseline justify-between gap-2">
            <h3 id="hub-messages-h" className="text-sm font-semibold flex items-center gap-2"><span aria-hidden="true" className="text-[#5A6E3D]"><UiIcon name="chat" /></span>Recent Messages</h3>
            <button type="button" onClick={openMessages} className={`text-[0.625rem] uppercase tracking-wider text-[#2A5A8E] font-semibold ${FOCUS_RING}`}>View all →</button>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {['Direct', 'Groups', 'Voicemail'].map((k) => (
              <button key={k} type="button" onClick={openMessages} className={`${CHIP} ${FOCUS_RING} ${k === 'Direct' ? 'bg-[#E8E4DC] border-[#1A1815]' : ''}`}>{k}</button>
            ))}
          </div>
          <div className="mt-3 text-sm" data-testid="hub-messages-body">
            {unread > 0 ? (
              <button type="button" onClick={openMessages} className={`w-full text-left flex items-center gap-3 ${FOCUS_RING}`}>
                <span aria-hidden="true" className="w-8 h-8 rounded-full bg-[#E8E4DC] text-[#1A1815] grid place-items-center font-semibold" style={{ fontFamily: '"Fraunces", serif' }}>{(newest && newest.senderName ? newest.senderName : '?').slice(0, 1).toUpperCase()}</span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold truncate">{newest && newest.senderName ? newest.senderName : 'New message'}</span>
                  <span className={`block text-xs ${MUTED}`}>{unread === 1 ? '1 unread message' : `${unread} unread messages`}{newest && newest.at ? ` · ${agoLabel(newest.at)}` : ''}</span>
                </span>
                <span aria-hidden="true" className="w-2 h-2 rounded-full bg-[#2A5A8E]" />
              </button>
            ) : (
              <p className={`text-xs ${MUTED}`}>Nothing unread. Open Messages to read or write to the family.</p>
            )}
          </div>
        </section>

        {/* TODAY'S FOCUS + MY GOALS — real records (lib/daily-focus.js). */}
        <section aria-labelledby="hub-focus-h" className={CARD}>
          <div className="flex items-baseline justify-between gap-2">
            <h3 id="hub-focus-h" className="text-sm font-semibold flex items-center gap-2"><span aria-hidden="true" className="text-[#5A6E3D]"><UiIcon name="check" /></span>Today&apos;s Focus</h3>
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

          {/* MY GOALS — also a real record, and deliberately WITHOUT a typed
              percentage. A number a person types about their own progress is as
              invented as the checklist this replaces, so a goal shows days and
              linked work, never a self-reported 60%. */}
          <h3 id="hub-goals-h" className="mt-4 text-sm font-semibold flex items-center gap-2"><span aria-hidden="true" className="text-[#5A6E3D]"><UiIcon name="pin" /></span>My Goals</h3>
          <ul className="mt-2 space-y-1" aria-labelledby="hub-goals-h">
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
        <section aria-labelledby="hub-actions-h" className={CARD}>
          <h3 id="hub-actions-h" className="text-sm font-semibold flex items-center gap-2"><span aria-hidden="true" className="text-[#5A6E3D]"><UiIcon name="sparkle" /></span>Quick Actions</h3>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {actions.map((a) => {
              const st = ACTION_STYLE[a.key] || { fill: 'bg-[#1F3A2E]', icon: 'folder' };
              return (
                <button
                  key={a.key}
                  type="button"
                  onClick={() => {
                    if (a.view) return go(a.view, a.churchView);
                    const id = a.key === 'focus' ? 'hub-focus-new' : 'hub-goal-new';
                    try { document.getElementById(id)?.focus(); } catch { /* non-browser */ }
                    return undefined;
                  }}
                  className={`flex flex-col items-center gap-1.5 text-center text-[0.625rem] leading-tight min-h-[36px] ${FOCUS_RING}`}
                >
                  <span aria-hidden="true" className={`w-10 h-10 rounded-xl grid place-items-center text-white text-[1.125rem] ${st.fill}`}><UiIcon name={st.icon} /></span>
                  <span>{a.label}</span>
                </button>
              );
            })}
          </div>

          {/* RECENT ACTIVITY — lib/home-activity.js over the records. Empty is
              said plainly; nothing is painted. */}
          <h3 id="hub-activity-h" className="mt-4 text-sm font-semibold flex items-center gap-2"><span aria-hidden="true" className="text-[#5A6E3D]"><UiIcon name="calendar" /></span>Recent Activity</h3>
          <ul className="mt-2 space-y-1.5" aria-labelledby="hub-activity-h" data-testid="hub-activity">
            {activity.map((e) => (
              <li key={e.id}>
                <button type="button" onClick={() => go(e.view, null)} className={`w-full text-left flex items-start gap-2 ${FOCUS_RING}`}>
                  <span aria-hidden="true" className="mt-0.5 w-6 h-6 rounded-md border border-[#E8E4DC] grid place-items-center text-[#5A6E3D] text-[0.75rem] shrink-0"><UiIcon name={ACTIVITY_ICON[e.kind] || 'folder'} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-semibold truncate">{e.title}</span>
                    {e.sub && <span className={`block text-[0.625rem] ${MUTED} truncate`}>{e.sub}</span>}
                  </span>
                  <span className={`text-[0.625rem] ${MUTED} whitespace-nowrap`}>{agoLabel(e.at)}</span>
                </button>
              </li>
            ))}
            {activity.length === 0 && <li className={`text-xs ${MUTED}`}>Nothing recorded yet. Incidents, projects, notes, photos, goals and finished focus items show here as they happen.</li>}
          </ul>
        </section>
      </div>
    </div>
  );
}
