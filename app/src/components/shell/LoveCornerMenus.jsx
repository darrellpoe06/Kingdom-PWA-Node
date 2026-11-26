// =============================================================================
// LoveCornerMenus — the profile menu and the All Features sheet (DR-1483)
// =============================================================================
// Every row here is an EXISTING function reached by its existing handler; this
// file adds no system. ProfileMenu is the list under the member's picture
// (Screen 1b of the approved previews); AllFeaturesSheet is the ≡ menu: every
// church tab the shell gated for this reader, grouped exactly as the dock's
// More sheet groups them (lib/church-tabs.jsx churchTabGroups, DR-0677), a
// filter that also finds courses, then Personalize, Help, Share / Install and
// the build line. The sheet is the app's own Modal (focus trap, Escape, focus
// return), so a keyboard and a screen reader get the same door as a finger.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Modal from '../Modal.jsx';
import AccountMenu from './AccountMenu.jsx';
import MyProfile from '../MyProfile.jsx';
import HelpButton from '../HelpButton.jsx';
import AppDoorControls from '../AppDoorControls.jsx';
import { ChurchGivePanel } from '../ChurchGiving.jsx';
import UiIcon from '../UiIcon.jsx';
import { signOut } from '../../lib/supabase.js';
import { churchTabGroups, CHURCH_TAB_ICONS } from '../../lib/church-tabs.jsx';
import { requestChurchHomeSection } from '../../lib/church-home-section.js';
import { LEARN_CATALOG } from '../../lib/learn-catalog.js';
import { lessonUrl } from '../../lib/lesson-links.js';
import { motionBehavior } from '../../lib/gentle-motion.js';

const FOCUS = 'focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#CFA63C]';

/** Pure. Courses whose title or department contains the query; never throws on a bad entry. */
export function searchCourses(query, catalog = LEARN_CATALOG) {
  const q = String(query || '')
    .trim()
    .toLowerCase();
  if (!q) return [];
  const out = [];
  for (const c of catalog || []) {
    try {
      const title = String((c && c.meta && c.meta.title) || '');
      const dept = String((c && c.meta && c.meta.category) || '');
      if (title.toLowerCase().includes(q) || dept.toLowerCase().includes(q)) out.push({ key: c.key, title, dept, course: c });
    } catch (_) {
      /* a broken entry is not a result */
    }
  }
  return out.slice(0, 12);
}

/** Pure. Tabs whose label or id contains the query. */
export function searchTabs(query, churchTabs = []) {
  const q = String(query || '')
    .trim()
    .toLowerCase();
  if (!q) return [];
  return (churchTabs || []).filter(([id, label]) => String(label).toLowerCase().includes(q) || String(id).toLowerCase().includes(q));
}

export function ProfileMenu({
  theme = null,
  name,
  profile,
  session,
  church,
  isOffice,
  canAdmin,
  anchorRef,
  onClose,
  onGo,
  onNotifications,
  onSubscription,
  onAdmin,
  onMessages,
  onPersonalize,
  onAll,
}) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [giveOpen, setGiveOpen] = useState(false);
  const email = session && session.user && session.user.email;
  const who = isOffice ? 'Church office' : 'Member';
  // The rows as data, drawn by the shared frame (AccountMenu, DR-1600): the
  // PoeTech door's picture uses the same frame with its own rows.
  const rows = [
    { key: 'profile', label: 'My Profile', onSelect: () => setProfileOpen(true) },
    { key: 'church', label: 'My Church', chip: isOffice ? 'office' : null, onSelect: () => onGo('my-record') },
    { key: 'notifications', label: 'Notifications', onSelect: onNotifications },
    { key: 'subscription', label: 'Subscription', chipMuted: 'PoeTech+', onSelect: onSubscription },
    // TWO ROWS, EACH GOING WHERE IT SAYS (DR-1579). One row named
    // "Messages / Contact" opened the church's About section and no
    // messages at all (Darrell 2026-11-18: "Messages and contacts
    // don't work"). Messages is the app's own Messages surface, which
    // this door already carries (the bell's message arrivals land on
    // it); Contact the church is the About section, where the
    // address, the phone and the office are.
    { key: 'messages', label: 'Messages', onSelect: onMessages },
    {
      key: 'contact',
      label: 'Contact the church',
      onSelect: () => {
        requestChurchHomeSection('about');
        onGo('home');
      },
    },
    { key: 'give', label: 'Give', onSelect: () => setGiveOpen(true) },
    { key: 'all', label: 'Share Our App · Install · Help', onSelect: onAll },
    { key: 'personalize', label: 'Appearance & Accessibility', onSelect: onPersonalize },
    ...(canAdmin ? [{ key: 'admin', label: 'Admin', onSelect: onAdmin }] : []),
    {
      key: 'logout',
      label: 'Log Out',
      out: true,
      onSelect: () => {
        try {
          signOut();
        } catch (_) {
          /* ignore */
        }
        onClose();
      },
    },
  ];
  return (
    <>
      <AccountMenu
        name={name}
        who={who}
        email={email}
        rows={rows}
        anchorRef={anchorRef}
        onClose={onClose}
        hold={profileOpen || giveOpen}
        look="lovecorner"
        floating
        theme={theme}
        testid="lch-profile-menu"
        rowTestid={(key) => `lch-menu-${key}`}
      />
      <Modal
        open={profileOpen}
        onClose={() => {
          setProfileOpen(false);
          onClose();
        }}
        label="My profile"
      >
        <div className="p-4 bg-white text-[#1A1815]">
          <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] font-semibold mb-2">
            My profile · picture, name, house, ministries, testimony
          </div>
          <MyProfile initialName={name} />
        </div>
      </Modal>
      {giveOpen && (
        <ChurchGivePanel
          church={church}
          onClose={() => {
            setGiveOpen(false);
            onClose();
          }}
        />
      )}
    </>
  );
}

export function AllFeaturesSheet({
  open,
  onClose,
  searchFirst = false,
  churchTabs = [],
  churchView,
  onGo,
  church,
  view,
  booksView,
  setView,
  setChurchView,
  setBooksView,
  isFamilyMember = false,
  onPersonalize,
  onFeedback = null,
  theme = null,
}) {
  const [q, setQ] = useState('');
  const inputRef = useRef(null);
  useEffect(() => {
    if (!open) setQ('');
  }, [open]);
  const groups = useMemo(() => churchTabGroups(churchTabs), [churchTabs]);
  const tabHits = searchTabs(q, churchTabs);
  const courseHits = searchCourses(q);
  const build = typeof __BUILD_SHA__ !== 'undefined' ? String(__BUILD_SHA__).slice(0, 7) : '';
  return (
    <Modal open={open} onClose={onClose} label="All features" maxWidthClass="max-w-md" initialFocusRef={searchFirst ? inputRef : null} variant="sheet" theme={theme}>
      <div className="lch-sheet" data-theme={theme || undefined} data-testid="lch-all-features">
        <label className="lch-search">
          <span className="sr-only">Search tabs and courses</span>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search tabs and courses"
            className="lch-input"
            data-testid="lch-search-input"
            autoComplete="off"
          />
        </label>
        {q.trim() ? (
          <div className="lch-results" data-testid="lch-search-results">
            {tabHits.length === 0 && courseHits.length === 0 && <p className="lch-empty">Nothing by that name. Try a tab, a ministry or a course.</p>}
            {tabHits.map(([id, label]) => (
              <button key={`t-${id}`} type="button" onClick={() => onGo(id)} className={`lch-result ${FOCUS}`} data-testid={`lch-hit-tab-${id}`}>
                <span className="lch-result-kind">Tab</span>
                {label}
              </button>
            ))}
            {courseHits.map((c) => (
              <a
                key={`c-${c.key}`}
                href={lessonUrl({ courseKey: c.key, course: c.course })}
                className={`lch-result ${FOCUS}`}
                data-testid={`lch-hit-course-${c.key}`}
              >
                <span className="lch-result-kind">Course</span>
                {c.title}
                <small>{c.dept}</small>
              </a>
            ))}
          </div>
        ) : (
          <>
            {groups.map((g) => (
              <section key={g.key} className="lch-group" aria-labelledby={`lch-g-${g.key}`} data-testid={`lch-group-${g.key}`}>
                <h3 id={`lch-g-${g.key}`} className="lch-group-h">
                  {g.label}
                </h3>
                <div className="lch-grid">
                  {g.items.map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => onGo(id)}
                      aria-current={churchView === id ? 'page' : undefined}
                      className={`lch-tile ${churchView === id ? 'lch-tile-on' : ''} ${FOCUS}`}
                      data-testid={`lch-tab-${id}`}
                    >
                      <UiIcon name={CHURCH_TAB_ICONS[id] || 'home'} />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </section>
            ))}
            <section className="lch-group" aria-labelledby="lch-g-this">
              <h3 id="lch-g-this" className="lch-group-h">
                This app
              </h3>
              <div className="lch-row">
                <button type="button" onClick={onPersonalize} className={`lch-pill ${FOCUS}`} data-testid="lch-personalize">
                  🎨 Personalize My App
                </button>
                {onFeedback && (
                  <button type="button" onClick={onFeedback} className={`lch-pill ${FOCUS}`} data-testid="lch-feedback">
                    Send feedback: what works, what does not
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    try {
                      window.scrollTo({ top: 0, behavior: motionBehavior() });
                    } catch (_) {
                      /* no window */
                    }
                  }}
                  className={`lch-pill ${FOCUS}`}
                  data-testid="lch-top"
                >
                  Back to top
                </button>
                <HelpButton
                  variant="header"
                  view={view}
                  churchView={churchView}
                  booksView={booksView}
                  setView={setView}
                  setChurchView={setChurchView}
                  setBooksView={setBooksView}
                  isOwner={isFamilyMember}
                />
                <AppDoorControls church />
              </div>
              {build && (
                <p className="lch-build" data-testid="lch-build">
                  build {build}
                </p>
              )}
            </section>
          </>
        )}
      </div>
    </Modal>
  );
}
