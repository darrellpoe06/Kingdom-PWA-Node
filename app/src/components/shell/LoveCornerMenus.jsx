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
  onPersonalize,
  onAll,
}) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [giveOpen, setGiveOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    const onDown = (e) => {
      const inMenu = ref.current && ref.current.contains(e.target);
      const onAnchor = anchorRef && anchorRef.current && anchorRef.current.contains(e.target);
      if (!inMenu && !onAnchor && !profileOpen && !giveOpen) onClose();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
    };
  }, [onClose, anchorRef, profileOpen, giveOpen]);
  useEffect(() => {
    const first = ref.current && ref.current.querySelector('button');
    if (first) first.focus();
  }, []);
  const email = session && session.user && session.user.email;
  const who = isOffice ? 'Church office' : 'Member';
  const Row = ({ onClick, children, testid, out = false }) => (
    <li role="none">
      <button type="button" role="menuitem" onClick={onClick} className={`lch-menu-row ${out ? 'lch-menu-out' : ''} ${FOCUS}`} data-testid={testid}>
        {children}
      </button>
    </li>
  );
  return (
    <>
      <div ref={ref} className="lch-menu" role="menu" aria-label="My account" data-testid="lch-profile-menu">
        <div className="lch-menu-who">
          <b>{name}</b>
          <small>
            {who}
            {email ? ` · ${email}` : ''}
          </small>
        </div>
        <ul className="lch-menu-list">
          <Row onClick={() => setProfileOpen(true)} testid="lch-menu-profile">
            My Profile
          </Row>
          <Row onClick={() => onGo('my-record')} testid="lch-menu-church">
            My Church{isOffice && <span className="lch-chip">office</span>}
          </Row>
          <Row onClick={onNotifications} testid="lch-menu-notifications">
            Notifications
          </Row>
          <Row onClick={onSubscription} testid="lch-menu-subscription">
            Subscription <span className="lch-chip-muted">PoeTech+</span>
          </Row>
          <Row
            onClick={() => {
              requestChurchHomeSection('about');
              onGo('home');
            }}
            testid="lch-menu-contact"
          >
            Messages / Contact
          </Row>
          <Row onClick={() => setGiveOpen(true)} testid="lch-menu-give">
            Give
          </Row>
          <Row onClick={onAll} testid="lch-menu-all">
            Share Our App · Install · Help
          </Row>
          <Row onClick={onPersonalize} testid="lch-menu-personalize">
            Appearance &amp; Accessibility
          </Row>
          {canAdmin && (
            <Row onClick={onAdmin} testid="lch-menu-admin">
              Admin
            </Row>
          )}
          <Row
            out
            onClick={() => {
              try {
                signOut();
              } catch (_) {
                /* ignore */
              }
              onClose();
            }}
            testid="lch-menu-logout"
          >
            Log Out
          </Row>
        </ul>
      </div>
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
    <Modal open={open} onClose={onClose} label="All features" maxWidthClass="max-w-md" initialFocusRef={searchFirst ? inputRef : null}>
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
