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
import { TLC_DOOR_BRAND, TLC_INSTALL_MANIFEST } from '../lib/tlc-door.js';
import supabase, { onAuthChange } from '../lib/supabase.js';
import PasswordAuth from './PasswordAuth.jsx';
import SectionTabs from './SectionTabs.jsx';
import TlcAssistant from './TlcAssistant.jsx';

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

  // Make this an APP, not a website: swap the document's manifest + title so
  // "Add to Home Screen" installs "TLC Therapy" standalone (its own icon).
  useEffect(() => {
    const prevTitle = document.title;
    document.title = `${TLC_BRAND.name} — ${TLC_BRAND.tagline}`;
    let link = document.querySelector('link[rel="manifest"]');
    const prevHref = link ? link.getAttribute('href') : null;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'manifest';
      document.head.appendChild(link);
    }
    link.href = TLC_INSTALL_MANIFEST;
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    const prevTheme = themeMeta ? themeMeta.getAttribute('content') : null;
    if (themeMeta) themeMeta.setAttribute('content', '#1A1815');
    return () => {
      document.title = prevTitle;
      if (prevHref) link.href = prevHref;
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
    <div className="min-h-screen bg-[#FAF8F4] text-[#1A1815]">
      {/* Header — the TLC brand + the staff login menu. No PoeTech chrome. */}
      <header className="bg-white border-b-2 border-[#1A1815]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#B85838] font-semibold mb-1">{TLC_DOOR_BRAND.name}</div>
              <h1 className="text-3xl sm:text-4xl mb-2" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600, letterSpacing: '-0.02em' }}>{TLC_DOOR_BRAND.tagline}</h1>
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

          <div className="mt-4 flex flex-wrap gap-2.5">
            <a href={TLC_BRAND.bookingUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-4 py-2.5 bg-[#B85838] text-white text-sm font-semibold uppercase tracking-wider hover:bg-[#1A1815] transition-colors focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]">
              Book an appointment
            </a>
            <a href={TLC_BRAND.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-4 py-2.5 border border-[#1A1815] text-sm font-semibold uppercase tracking-wider hover:border-[#B85838] hover:text-[#B85838] transition-colors focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]">
              Learn more
            </a>
          </div>

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
