// =============================================================================
// TlcPublicDoor — the TLC Therapy Solutions app (client door + staff login)
// =============================================================================
// poetech.us/tlc → ?tlc=1. A prospective CLIENT meets "Find your therapist"
// (clinical-team match + services + insurance + Book). But TLC STAFF need to
// LOG IN from this door — before/without installing — and then reach the office
// (the Assistant + workspace). So the door carries a menu with a Staff log in
// (Darrell, repeatedly: "a menu so we can login before downloading"), mirroring
// the Moore door's Admin/User login. Signed-out = the client booking page only;
// signed-in staff = a menu with the Assistant. The install manifest swap stays
// so "Add to Home Screen" still installs "TLC Therapy" standalone.
//
// PRIVACY (the TLC bright line): the client view renders ONLY tlc-practice.js
// (public marketing facts). The Assistant tab renders only after a real login;
// RLS + the Assistant's own governor gate are the real enforcement.
// =============================================================================
import React, { useEffect, useState } from 'react';
import { TLC_TEAM, TLC_INSURANCE, TLC_BRAND, TLC_SERVICES } from '../lib/tlc-practice.js';
import { TLC_DOOR_BRAND, TLC_SHARE_URL } from '../lib/tlc-door.js';
import supabase, { onAuthChange } from '../lib/supabase.js';
import AppShareQR from './AppShareQR.jsx';
import PasswordAuth from './PasswordAuth.jsx';
import SectionTabs from './SectionTabs.jsx';
import TlcAssistant from './TlcAssistant.jsx';
import { useTextSize } from '../lib/text-size.js';
import { THEME_CSS, THEMES, readThemePref, saveThemePref } from '../lib/theme-css.js';
import { useAutoHideHeader } from '../lib/use-auto-hide-header.js';

// The client-facing booking page (the sendable front door a prospect meets).
function ClientDoor() {
  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
      {/* Match a Preferred Provider — FIRST (Darrell: "the first thing we see"). */}
      <section>
        <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#B85838] font-semibold mb-1">Clinical Team</div>
        <h2 className="text-2xl mb-4" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600, letterSpacing: '-0.02em' }}>Match a Preferred Provider</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TLC_TEAM.map((t) => (
            <a
              key={t.name}
              href={t.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white border border-[#E8E4DC] p-3 flex items-start gap-3 hover:border-[#B85838] transition-colors focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]"
            >
              <img
                src={t.photo}
                alt={t.name}
                loading="lazy"
                width="72"
                height="72"
                className="w-[72px] h-[72px] object-cover bg-[#E8E4DC] flex-shrink-0"
              />
              <div className="min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="text-sm" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{t.name}</h3>
                  <span className="text-[0.625rem] uppercase tracking-wider text-[#B85838] whitespace-nowrap">View →</span>
                </div>
                <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] mb-1">{t.role}</div>
                <p className="text-xs leading-snug text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>{t.specialty}</p>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Services — each books directly into Acuity. */}
      <section>
        <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#B85838] font-semibold mb-1">Therapy Services</div>
        <h2 className="text-2xl mb-4" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600, letterSpacing: '-0.02em' }}>All Options · Direct Online Intake</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {TLC_SERVICES.map((s) => (
            <div key={s.name} className="bg-white border border-[#E8E4DC] p-3 hover:border-[#B85838] transition-colors">
              <div className="flex items-baseline justify-between gap-2 mb-1">
                <h3 className="text-sm" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{s.name}</h3>
                <a href={TLC_BRAND.bookingUrl} target="_blank" rel="noopener noreferrer" className="text-[0.625rem] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815] whitespace-nowrap">Book →</a>
              </div>
              <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] mb-1">{s.desc}</div>
              <p className="text-xs leading-snug text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>{s.for}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Insurance accepted. */}
      <section className="bg-white border border-[#E8E4DC] p-4">
        <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#B85838] font-semibold mb-1.5">Insurance Accepted</div>
        <p className="text-sm text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>{TLC_INSURANCE}</p>
      </section>
    </main>
  );
}

export default function TlcPublicDoor() {
  const [signedIn, setSignedIn] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showShare, setShowShare] = useState(false);
  // Comfort controls — the SAME theme + text-size the whole PoeTech app uses
  // (shared libs; a per-device choice that follows the user between shells).
  // These are platform staples: every surface must be resizable + re-themeable.
  const [theme, setTheme] = useState(() => readThemePref('cream'));
  useEffect(() => { saveThemePref(theme); }, [theme]);
  const [sizeKey, setSizeKey, sizeSteps] = useTextSize();
  // The standard PoeTech collapsing top bar: the header drops up out of the way
  // while you read down the page, and comes back down the moment you scroll up.
  const headerHidden = useAutoHideHeader();

  // Title + theme-color carry TLC's brand while the door is mounted. The
  // manifest-link swap that used to live here is RETIRED (DR-0261/DR-0258):
  // install identity is a page-load property, and TLC's manifest now has its
  // own disjoint scope (/tlc/) linked STATICALLY by its served page
  // (app/tlc/app/index.html) — a runtime swap on a /poetech-app/ page would
  // make that page un-installable as anything (the linked manifest's scope
  // wouldn't contain the page).
  useEffect(() => {
    const prevTitle = document.title;
    document.title = `${TLC_BRAND.name} — ${TLC_BRAND.tagline}`;
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    const prevTheme = themeMeta ? themeMeta.getAttribute('content') : null;
    if (themeMeta) themeMeta.setAttribute('content', '#1A1815');
    return () => {
      document.title = prevTitle;
      if (themeMeta && prevTheme) themeMeta.setAttribute('content', prevTheme);
    };
  }, []);

  // Track sign-in so staff get the office menu; clients get the booking page.
  useEffect(() => onAuthChange((s) => setSignedIn(!!s)), []);

  const signOut = async () => { try { await supabase.auth.signOut(); } catch (e) { /* ignore */ } };

  const sections = [
    { id: 'find', label: 'Find your therapist', icon: 'users', render: () => <ClientDoor /> },
    { id: 'assistant', label: 'Assistant', icon: 'chat', render: () => <TlcAssistant isGovernor /> },
  ];

  return (
    <div data-theme={theme === 'cream' ? undefined : theme} className="min-h-screen bg-[#FAF8F4] text-[#1A1815]">
      <style>{THEME_CSS}</style>
      {/* Header — the TLC brand + the staff login menu. No PoeTech chrome.
          Sticky + auto-hide (the standard PoeTech collapsing bar): it slides up
          off-screen as you read down, and slides back the instant you scroll up.
          When the login form is open we keep it pinned so it can't vanish mid-type. */}
      <header
        className={`sticky top-0 z-40 bg-white border-b-2 border-[#1A1815] transition-transform duration-300 will-change-transform ${headerHidden && !(showLogin && !signedIn) ? '-translate-y-full' : 'translate-y-0'}`}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex items-start justify-between gap-3">
            <div>
              {/* Display TITLE is CHROME, not content: .ts-chrome-region caps it
                  (font + box) so raising text size grows the BODY copy, never the
                  big H1 — the PoeTech Standard (a giant H1 overran the screen).
                  The blurb stays outside the cap so it scales for low-vision. */}
              <div className="ts-chrome-region">
                <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#B85838] font-semibold mb-1">{TLC_DOOR_BRAND.name}</div>
                <h1 className="text-3xl sm:text-4xl mb-2" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600, letterSpacing: '-0.02em' }}>{TLC_DOOR_BRAND.tagline}</h1>
              </div>
              <p className="text-sm sm:text-base text-[#5A5751] max-w-prose" style={{ fontFamily: '"Fraunces", serif' }}>{TLC_DOOR_BRAND.blurb}</p>
            </div>
            {/* Staff log in / out — lets TLC staff sign in from the door itself,
                before or without installing (Darrell's ask). */}
            <div className="shrink-0">
              {signedIn ? (
                <button type="button" onClick={signOut} className="text-[0.625rem] uppercase tracking-wider px-3 py-2 border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white font-semibold whitespace-nowrap focus:outline focus:outline-2 focus:outline-[#B85838]">
                  Log out
                </button>
              ) : (
                <button type="button" onClick={() => setShowLogin((v) => !v)} aria-expanded={showLogin} className="text-[0.625rem] uppercase tracking-wider px-3 py-2 border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white font-semibold whitespace-nowrap focus:outline focus:outline-2 focus:outline-[#B85838]">
                  Staff log in
                </button>
              )}
            </div>
          </div>

          {/* Comfort controls — theme + text size, the platform staples. Same
              shared libs (theme-css / text-size) the whole PoeTech app uses. */}
          <div className="mt-4 flex flex-wrap items-center gap-1.5" role="group" aria-label="Comfort controls">
            {THEMES.map((t) => (
              <button
                key={t.key}
                type="button"
                aria-label={`${t.label} theme`}
                title={t.label}
                aria-pressed={theme === t.key}
                className="flex h-9 w-9 items-center justify-center rounded-full focus:outline focus:outline-2 focus:outline-[#B85838]"
                onClick={() => setTheme(t.key)}
              >
                <span
                  aria-hidden="true"
                  className={`h-5 w-5 rounded-full ${theme === t.key ? 'ring-2 ring-[#B85838] ring-offset-1' : 'opacity-70'}`}
                  style={{ backgroundColor: t.color, border: `1.5px solid ${t.border}`, display: 'inline-block' }}
                />
              </button>
            ))}
            <span className="mx-1 h-4 border-l border-[#E8E2D8]" aria-hidden="true" />
            {sizeSteps.map((s) => (
              <button
                key={s.key}
                type="button"
                aria-label={`Text size ${s.name}`}
                aria-pressed={sizeKey === s.key}
                className={`min-h-[36px] min-w-[36px] rounded border px-1.5 text-xs focus:outline focus:outline-2 focus:outline-[#B85838] ${sizeKey === s.key ? 'border-[#B85838] text-[#B85838] font-semibold' : 'border-[#E8E2D8] text-[#5A5751]'}`}
                onClick={() => setSizeKey(s.key)}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2.5">
            <a href={TLC_BRAND.bookingUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-4 py-2.5 bg-[#B85838] text-white text-sm font-semibold uppercase tracking-wider hover:bg-[#1A1815] transition-colors focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]">
              Book an appointment
            </a>
            <a href={TLC_BRAND.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-4 py-2.5 border border-[#1A1815] text-sm font-semibold uppercase tracking-wider hover:border-[#B85838] hover:text-[#B85838] transition-colors focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]">
              Learn more
            </a>
            {/* Show a scannable QR right on screen — for a screen-share or an
                in-person "point your phone at this" (Darrell 2026-07-14). It
                shares the way in; it never grants access. */}
            <button type="button" onClick={() => setShowShare((v) => !v)} aria-expanded={showShare} className="inline-flex items-center px-4 py-2.5 border border-[#1A1815] text-sm font-semibold uppercase tracking-wider hover:border-[#B85838] hover:text-[#B85838] transition-colors focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]">
              {showShare ? 'Hide QR' : 'Share · QR'}
            </button>
          </div>

          {/* The QR share card — encodes the TLC public door URL so anyone can
              scan it to open the TLC app (no long address to type). */}
          {showShare && (
            <div className="mt-4 max-w-xl">
              <AppShareQR
                url={TLC_SHARE_URL}
                shown="poetech.us/tlc"
                title="Share TLC Therapy Solutions"
                blurb="Point a phone camera at this code (or share your screen) to open the TLC Therapy Solutions app — no long address to type."
                ariaLabel="QR code to open the TLC Therapy Solutions app"
              />
            </div>
          )}

          {/* The login form opens right on the door — no download needed. */}
          {showLogin && !signedIn && (
            <div className="mt-4 max-w-sm border border-[#E8E4DC] bg-[#FAF8F4] p-3">
              <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] mb-2">TLC staff sign in</div>
              <PasswordAuth mode="signin" embedded onSignedIn={() => { setShowLogin(false); }} />
            </div>
          )}
        </div>
      </header>

      {/* Signed-in staff get the office menu (Find + Assistant); a client gets
          just the booking page. */}
      {signedIn ? (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-4">
          <SectionTabs sections={sections} ariaLabel="TLC app sections" idBase="tlc-app" defaultId="find" />
        </div>
      ) : (
        <ClientDoor />
      )}

      <footer className="border-t border-[#E8E4DC] mt-4">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 text-center">
          <a href={TLC_BRAND.website} target="_blank" rel="noopener noreferrer" className="text-xs uppercase tracking-wider text-[#5A5751] hover:text-[#B85838] transition-colors">
            {TLC_BRAND.name} · tlctherapysolutions.me
          </a>
        </div>
      </footer>
    </div>
  );
}
