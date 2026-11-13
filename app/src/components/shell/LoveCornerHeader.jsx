// =============================================================================
// LoveCornerHeader — the one compact header of the Love Corner door (DR-1483)
// =============================================================================
// Darrell, 2026-11-13: "the top portion of the application still looks like
// the original website... one beautiful, professionally designed mobile app."
// His picture set the order: MENU on the left; the official logo, the name,
// "The Church of the Living God" and "Where Love Lives" in the brand; SEARCH,
// the notification BELL and the member's PICTURE on the right. Nothing the old
// header did is gone; each control has a new place (the audit's checklist,
// docs/99-session-notes/2026-11-13-the-love-corner-shell-redesign-audit-and-previews.md §4a):
//   menu (≡)   → AllFeaturesSheet: every church tab in its group, Personalize,
//                Help, Share / Install, build information
//   search     → the same sheet with its filter open: tabs and courses
//   bell       → the existing ArrivalsBell (same count, same panel)
//   picture    → ProfileMenu: profile, My Church, notifications, subscription,
//                contact, give, share, install, appearance, help, log out
//   signed out → "Sign in", the existing AuthModal
// Below the bar, from `sm` up, the church sub-tab strip stays (TabScroll, the
// same list the dock and the sheet draw, DR-0677); on a phone the dock and the
// sheet carry it. Mounted by the shell ONLY on the church door
// (churchDoorOnly); the family app's header is untouched.
//
// Self-contained session + profile read, as HeaderAuthButton does, so the
// frozen shell mounts it in one line. Every read is guarded: a profile that
// cannot be read is initials, never a thrown header.
import React, { useEffect, useRef, useState } from 'react';
import { onAuthChange } from '../../lib/supabase.js';
import { loadMyProfile } from '../../lib/profiles-sync.js';
import { LOVE_CORNER_BRAND } from '../../lib/church-own-door.js';
import { LOVE_CORNER_ASSETS } from '../lovecorner/LoveCornerHome.jsx';
import ArrivalsBell from '../ArrivalsBell.jsx';
import AuthModal from '../AuthModal.jsx';
import { ProfileAvatar } from '../ProfileCard.jsx';
import { headerName } from '../HeaderAuthButton.jsx';
import { TabScroll } from '../shared.jsx';
import { ProfileMenu, AllFeaturesSheet } from './LoveCornerMenus.jsx';
import PersonalizeSheet from './PersonalizeSheet.jsx';

export const LOVE_CORNER_TAGLINE = 'Where Love Lives';
const FOCUS = 'focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#CFA63C]';

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <circle cx="11" cy="11" r="6" />
      <path d="M20 20l-4.3-4.3" />
    </svg>
  );
}

/** The sub-tab strip, from `sm` up: the same gated list the dock draws (DR-0677). */
export function ChurchTabStrip({ churchTabs = [], churchView, setChurchView }) {
  if (!Array.isArray(churchTabs) || churchTabs.length === 0) return null;
  return (
    <div className="lch-strip hidden sm:block" data-testid="lch-strip">
      <TabScroll chrome className="px-1 sm:px-6 lg:px-8">
        {churchTabs.map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setChurchView && setChurchView(id)}
            aria-current={churchView === id ? 'page' : undefined}
            className={`lch-strip-tab ${churchView === id ? 'lch-strip-tab-on' : ''} ${FOCUS}`}
            data-testid={`lch-strip-tab-${id}`}
          >
            {label}
          </button>
        ))}
      </TabScroll>
    </div>
  );
}

export default function LoveCornerHeader({
  churchTabs = [],
  churchView = 'home',
  setChurchView = null,
  view = 'church',
  booksView = null,
  setView = null,
  setBooksView = null,
  church = null,
  isFamilyMember = false,
  isOffice = false,
  canAdmin = false,
  theme = null,
  setTheme = null,
}) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sheet, setSheet] = useState(null); // null | 'all' | 'search'
  const [personalizeOpen, setPersonalizeOpen] = useState(false);
  const bellRef = useRef(null);
  const avatarRef = useRef(null);

  useEffect(() => onAuthChange((s) => setSession(s)), []);
  const signedIn = !!(session && session.user);
  useEffect(() => {
    if (!signedIn) {
      setProfile(null);
      return undefined;
    }
    let alive = true;
    Promise.resolve()
      .then(() => loadMyProfile())
      .then((p) => {
        if (alive) setProfile(p || null);
      })
      .catch(() => {
        if (alive) setProfile(null);
      });
    return () => {
      alive = false;
    };
  }, [signedIn, menuOpen]);

  const name = headerName(profile, session);
  const openNotifications = () => {
    setMenuOpen(false);
    const btn = bellRef.current && bellRef.current.querySelector('button');
    if (btn) btn.click();
  };
  const go = (id) => {
    setSheet(null);
    setMenuOpen(false);
    if (setChurchView) setChurchView(id);
  };

  return (
    <header className="lch ts-safe-sticky sticky z-20 print:hidden" style={{ top: 'var(--lwb-h, 0px)' }} data-read-skip data-testid="lovecorner-header">
      <div className="lch-bar">
        <button
          type="button"
          onClick={() => setSheet('all')}
          className={`lch-ic ${FOCUS}`}
          aria-label="Menu: all features"
          aria-haspopup="dialog"
          aria-expanded={sheet === 'all'}
          data-testid="lch-menu"
        >
          <MenuIcon />
        </button>
        <button type="button" onClick={() => go('home')} className={`lch-brand ${FOCUS}`} aria-label={`${LOVE_CORNER_BRAND.name} home`} data-testid="lch-brand">
          <img src={LOVE_CORNER_ASSETS.logo} width="36" height="36" alt="" className="lch-logo" />
          <span className="lch-words">
            <span className="lch-name">{LOVE_CORNER_BRAND.name}</span>
            <span className="lch-eyebrow">{LOVE_CORNER_BRAND.eyebrow}</span>
            <span className="lch-tag">{LOVE_CORNER_TAGLINE}</span>
          </span>
        </button>
        <div className="lch-right">
          <button
            type="button"
            onClick={() => setSheet('search')}
            className={`lch-ic ${FOCUS}`}
            aria-label="Search tabs and courses"
            aria-haspopup="dialog"
            aria-expanded={sheet === 'search'}
            data-testid="lch-search"
          >
            <SearchIcon />
          </button>
          <span ref={bellRef} className="lch-bell" data-testid="lch-bell">
            <ArrivalsBell />
          </span>
          {signedIn ? (
            <button
              ref={avatarRef}
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className={`lch-avatar ${FOCUS}`}
              aria-label={`${name}: my profile and account`}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              data-testid="lch-avatar"
            >
              <ProfileAvatar profile={profile || { displayName: name }} size={36} />
            </button>
          ) : (
            <button type="button" onClick={() => setLoginOpen(true)} className={`lch-signin ${FOCUS}`} data-testid="lch-signin">
              Sign in
            </button>
          )}
        </div>
      </div>
      <ChurchTabStrip churchTabs={churchTabs} churchView={churchView} setChurchView={setChurchView} />
      {menuOpen && (
        <ProfileMenu
          name={name}
          profile={profile}
          session={session}
          church={church}
          isOffice={isOffice}
          canAdmin={canAdmin}
          anchorRef={avatarRef}
          onClose={() => setMenuOpen(false)}
          onGo={go}
          onNotifications={openNotifications}
          onSubscription={() => {
            setMenuOpen(false);
            if (setView) setView('about');
          }}
          onAdmin={() => {
            setMenuOpen(false);
            if (setView) setView('admin');
          }}
          onPersonalize={() => {
            setMenuOpen(false);
            setPersonalizeOpen(true);
          }}
          onAll={() => {
            setMenuOpen(false);
            setSheet('all');
          }}
        />
      )}
      <AllFeaturesSheet
        open={sheet !== null}
        searchFirst={sheet === 'search'}
        onClose={() => setSheet(null)}
        churchTabs={churchTabs}
        churchView={churchView}
        onGo={go}
        church={church}
        view={view}
        booksView={booksView}
        setView={setView}
        setChurchView={setChurchView}
        setBooksView={setBooksView}
        isFamilyMember={isFamilyMember}
        onPersonalize={() => {
          setSheet(null);
          setPersonalizeOpen(true);
        }}
        theme={theme}
      />
      <PersonalizeSheet open={personalizeOpen} onClose={() => setPersonalizeOpen(false)} theme={theme} setTheme={setTheme} isOwner={isFamilyMember} />
      <AuthModal open={loginOpen} onClose={() => setLoginOpen(false)} onSignedIn={() => setLoginOpen(false)} mode="signup" />
    </header>
  );
}
