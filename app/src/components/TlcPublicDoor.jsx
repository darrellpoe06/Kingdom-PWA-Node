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
import { TLC_INSURANCE, TLC_BRAND, TLC_SERVICES } from '../lib/tlc-practice.js';
import { useTlcRoster } from '../lib/tlc-roster.js';
import { TLC_DOOR_BRAND, TLC_SHARE_URL } from '../lib/tlc-door.js';
import { onAuthChange } from '../lib/supabase.js';
import { useInstanceRole, canManageTeam } from '../lib/instance-role.js';
import AppShareQR from './AppShareQR.jsx';
import PasswordAuth from './PasswordAuth.jsx';
import HeaderAuthButton from './HeaderAuthButton.jsx';
import SectionTabs from './SectionTabs.jsx';
import TlcAssistant from './TlcAssistant.jsx';
import { useTextSize } from '../lib/text-size.js';
import { THEME_CSS, THEMES, readThemePref, saveThemePref } from '../lib/theme-css.js';
import { useAutoHideHeader } from '../lib/use-auto-hide-header.js';
import { readHeaderCollapsed, writeHeaderCollapsed, nextCollapsed } from '../lib/header-hideaway.js';
import { TextSizeEscapeHatch } from './TextSizeControl.jsx';
import UiIcon from './UiIcon.jsx';
import { readOnboardTokenFromUrl } from '../lib/tlc-onboarding.js';
import { parseTlcLessonLink, resolveTlcLesson } from '../lib/tlc-lesson-links.js';
import { parseJobsLink } from '../lib/tlc-hiring.js';
import { JoinTheTeam } from './TlcHiring.jsx';
import TlcOnboardingForm from './TlcOnboardingForm.jsx';
import TlcOnboarding from './TlcOnboarding.jsx';
import TlcTeamResources from './TlcTeamResources.jsx';
import { PracticeLearn } from './PracticeLearn.jsx';
import { Practice } from './Practice.jsx';
import { useTlcOfficeData, addInquiry, updateInquiry, deleteInquiry, addLead, updateLead, deleteLead } from '../lib/tlc-office-data.js';
import { myPacketStatus } from '../lib/tlc-onboarding-sync.js';
import { TLC_APP_PATH } from '../lib/tlc-onboarding.js';

// A colleague arriving on Christina's one-time link (?onboard=TOKEN, DR-0344):
// signed out, they meet a sign-in / create-login card that says what the link
// is for; signed in, the intake packet itself. The client booking page is
// never shown under an invite — the person came to join the team, not to book.
function OnboardingDoor({ token, signedIn }) {
  return (
    <main className="w-full px-4 sm:px-6 py-6 space-y-4">
      <section className="bg-white border border-[#1A1815] p-4">
        <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#B85838] font-semibold mb-1">Join the clinical team</div>
        <h2 className="text-xl mb-1" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>You have been invited to onboard with TLC Therapy Solutions.</h2>
        <p className="text-sm text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
          {signedIn
            ? 'Work through each section at your pace; your answers save as you go. Submit when it is complete.'
            : 'Create a login (or sign in if you already have one) so your packet is yours to come back to. Then the intake opens right here.'}
        </p>
      </section>
      {signedIn
        ? <>
            <TlcOnboardingForm token={token} />
            <p className="text-xs text-[#5A5751]">Once your packet is approved, the TLC app opens your Training and Team sections: <a href={`${TLC_APP_PATH}?tlc=1`} className="underline text-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]">open the TLC app</a>.</p>
          </>
        : <div className="border border-[#E8E4DC] bg-white p-3 sm:w-96"><PasswordAuth mode="signup" embedded brand={{ name: 'TLC Therapy Solutions', eyebrow: 'TLC Therapy Solutions' }} /></div>}
    </main>
  );
}

// The client-facing booking page (the sendable front door a prospect meets).
function ClientDoor() {
  const team = useTlcRoster(); // seed cards + approved colleagues (DR-0344)
  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
      {/* Match a Preferred Provider — FIRST (Darrell: "the first thing we see"). */}
      <section>
        <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#B85838] font-semibold mb-1">Clinical Team</div>
        <h2 className="text-2xl mb-4" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600, letterSpacing: '-0.02em' }}>Match a Preferred Provider</h2>
        {/* ts-grid-collapse: one readable column at Largest/Big Print — two
            clipped columns is not large print (index.css, 2026-08-05). */}
        <div className="ts-grid-collapse grid grid-cols-1 sm:grid-cols-2 gap-3">
          {team.map((t) => (
            <a
              key={t.name}
              href={t.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white border border-[#E8E4DC] p-3 flex items-start gap-3 hover:border-[#B85838] transition-colors focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]"
            >
              {t.photo
                ? <img src={t.photo} alt={t.name} loading="lazy" width="72" height="72" className="w-[72px] h-[72px] object-cover bg-[#E8E4DC] flex-shrink-0" />
                : <div aria-hidden="true" className="w-[72px] h-[72px] bg-[#E8E4DC] flex-shrink-0" />}
              <div className="min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="text-sm min-w-0 break-words" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{t.name}</h3>
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
        <div className="ts-grid-collapse grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {TLC_SERVICES.map((s) => (
            <div key={s.name} className="bg-white border border-[#E8E4DC] p-3 hover:border-[#B85838] transition-colors">
              <div className="flex items-baseline justify-between gap-2 mb-1">
                <h3 className="text-sm min-w-0 break-words" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{s.name}</h3>
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
  // Captured ONCE at first render, before nav-history rewrites the URL (the
  // same rule the ?tlc=1 door context follows). Non-empty = a colleague
  // arriving on Christina's onboarding link (DR-0344).
  const [onboardToken] = useState(() => readOnboardTokenFromUrl());
  // A LESSON SERVED BY LINK (Darrell 2026-09-10: "a link to serve the lessons
  // like the Love Corner App does... so people can taste and see"). Read ONCE
  // at first render, resolved against the mounted curriculum; a stale link is
  // null and the door opens normally. Signed out it is served as a taste on
  // the door; signed in it opens Training on that lesson.
  const [deepLink] = useState(() => resolveTlcLesson(parseTlcLessonLink(
    (typeof window !== 'undefined' && window.location && window.location.search) || '',
  )));
  const [activeTab, setActiveTab] = useState(deepLink ? 'training' : 'find');
  // The website's careers link lands on Join the team (DR-0350).
  const [jobsLink] = useState(() => parseJobsLink((typeof window !== 'undefined' && window.location && window.location.search) || ''));
  // THE VISITOR'S SLIDER (Darrell 2026-09-10: "The lessons should be on
  // another tab for those who are not signed in... we like the sliders"):
  // signed out, the door is the same one-row slider as signed in — Find your
  // therapist · Learn (the client lessons, free to read; a shared lesson lands
  // here) · Join the team (the open positions). A link picks the tab.
  const [visitorTab, setVisitorTab] = useState(deepLink ? 'learn' : jobsLink.jobs ? 'jobs' : 'find');
  const visitorSections = [
    { id: 'find', label: 'Find your therapist', icon: 'users', render: () => <ClientDoor /> },
    // "Maybe a mental skill building place tab" (Darrell 2026-09-10).
    { id: 'learn', label: 'Mental skills', icon: 'bookOpen', render: () => <div className="pt-3 pb-6"><PracticeLearn email="" isStaff={false} deepLink={deepLink} guest onFindTherapist={() => setVisitorTab('find')} /></div> },
    { id: 'jobs', label: 'Join the team', icon: 'pencil', render: () => <div className="pt-3 pb-6"><JoinTheTeam lead={jobsLink.jobs} jobId={jobsLink.jobId} /></div> },
  ]; // the one slider, controlled so Team can send you to a sister tab
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
  // The header HIDEAWAY (the PoeTech shell's own control of the top space):
  // tucked away or shown per device, the same key the shell writes, so one
  // choice follows the reader between shells.
  const [headerCollapsed, setHeaderCollapsed] = useState(() => readHeaderCollapsed());
  const toggleHeaderChrome = () => setHeaderCollapsed((prev) => { const next = nextCollapsed(prev); writeHeaderCollapsed(next); return next; });
  const loginOpen = showLogin && !signedIn;

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
  const [sessionEmail, setSessionEmail] = useState('');
  const [sessionUserId, setSessionUserId] = useState(null);
  const [colleague, setColleague] = useState(null); // the signed-in person's own intake packet, if any
  useEffect(() => onAuthChange((s) => { setSignedIn(!!s); setSessionEmail(s?.user?.email || ''); setSessionUserId(s?.user?.id || null); if (s) myPacketStatus().then(setColleague); else setColleague(null); }), []);


  // The signed-in person's REAL role, from the database (DR-0271 / DR-0220 P3)
  // — never a hardcoded grant. An owner/admin/member of their space operates
  // their office workspace; a granted 'assistant' operates Christina's shared
  // one (TlcAssistant resolves that itself); RLS is the wall underneath either
  // way, so this prop is presentation, not security (DR-0074).
  const roleState = useInstanceRole();
  const operatorRole = ['owner', 'admin', 'member'].includes(roleState.role || '');
  // An approved colleague is staff for the TLC Learn space (the therapist +
  // training audiences) even before any membership grant — their packet says so.
  const staff = operatorRole || (colleague && colleague.status === 'approved');
  // The office's own records (Darrell 2026-09-10: "there are tabs inside the
  // PoeTech App that are not inside the TLC Therapy Solutions App?!"): the
  // SAME inquiries + leads rows the PoeTech TLC tab edits, read through the
  // standalone office store — never the family books store. Staff only.
  const office = useTlcOfficeData();
  const roster = useTlcRoster();
  const providers = roster.map((t, i) => ({ id: t.id || `seed-${i}`, name: t.name, direction: 'outbound' }));
  const officeSection = (id, label, icon, section) => (staff ? [{ id, label, icon, render: () => (
    <div className="pt-3"><Practice inquiries={office.inquiries} contractors={providers} addInquiry={addInquiry} updateInquiry={updateInquiry} deleteInquiry={deleteInquiry} practiceLeads={office.practiceLeads} addLead={addLead} updateLead={updateLead} deleteLead={deleteLead} email={sessionEmail} isStaff section={section} /></div>
  ) }] : []);
  // ONE slider, side by side, no second row (Darrell 2026-09-10).
  const sections = [
    { id: 'find', label: 'Find your therapist', icon: 'users', render: () => <ClientDoor /> },
    ...officeSection('inquiries', 'Inquiries', 'phone', 'inquiries'),
    ...officeSection('growth', 'Client Growth', 'chart', 'growth'),
    ...officeSection('revenue', 'Revenue', 'coins', 'revenue'),
    // The TLC Learn space (PracticeLearn) — TLC's own, not the church Learn
    // space (Darrell 2026-09-10). Clients see psychoeducation; staff see the
    // therapist + training audiences with the session scripts and courses.
    { id: 'training', label: 'Training', icon: 'bookOpen', render: () => <div className="pt-3"><PracticeLearn email={sessionEmail} isStaff={!!staff} deepLink={deepLink} /></div> },
    { id: 'team', label: 'Team', icon: 'book', render: () => <TlcTeamResources staff={!!staff} onOpen={(id) => setActiveTab(id)} roleState={roleState} userId={sessionUserId} /> },
    { id: 'assistant', label: 'Assistant', icon: 'chat', render: () => <TlcAssistant isGovernor={operatorRole} /> },
    // The office owner/admin brings colleagues on board from the TLC app
    // itself (DR-0344); the panel re-checks the role from the database.
    ...(canManageTeam(roleState) ? [{ id: 'onboarding', label: 'Onboarding', icon: 'pencil', render: () => <TlcOnboarding /> }] : []),
  ];

  return (
    <div data-theme={theme === 'cream' ? undefined : theme} className="min-h-screen overflow-x-clip bg-[#FAF8F4] text-[#1A1815]">
      <style>{THEME_CSS}</style>
      {/* THE TOP SPACE, controlled like PoeTech's header (Darrell 2026-09-10:
          "want to have the control of the top space like PoeTech for the
          Header"). Two layers, both the platform's own primitives:
            1. The COMPACT BAR — brand name (the h1), Book, Staff log in / Log
               out, and the hideaway chevron. Always present.
            2. The HIDEAWAY — tagline, blurb, comfort controls, Learn more and
               Share · QR, the QR card. The chevron tucks it away per device
               (lib/header-hideaway.js, the SAME key PoeTech's shell uses, so
               one choice follows the reader between shells) and brings it back.
          Sticky + auto-hide on top of that (the collapsing bar): the whole
          header slides up as you read down and back the instant you scroll up.
          When the login form is open it stays pinned and never collapses, so it
          cannot vanish mid-type. */}
      {/* ts-safe-sticky: at big text sizes the header caps to the viewport and
          scrolls within itself, so the size controls (the escape hatch back to
          Normal) are ALWAYS reachable — a reader can never be trapped in big
          text (2026-08-05 incident; measured by chrome-layout-probe in BOTH
          header states). Collapsed above Normal, TextSizeEscapeHatch keeps the
          way out on screen exactly as the PoeTech shell does. */}
      <header
        className={`ts-safe-sticky sticky top-0 z-40 bg-white border-b-2 border-[#1A1815] transition-transform duration-300 will-change-transform ${headerHidden && !loginOpen ? '-translate-y-full' : 'translate-y-0'}`}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          {/* 1 · the compact bar */}
          <div className="flex items-center justify-between gap-2 py-2.5 sm:py-3">
            {/* The brand is CHROME: .ts-chrome-region caps it (font + box) so
                raising text size grows the BODY copy, never the wordmark. The
                name never cuts off mid-word (whitespace-nowrap + truncate). */}
            <div className="min-w-0 ts-chrome-region">
              <h1 className="text-lg sm:text-xl leading-none whitespace-nowrap truncate" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600, letterSpacing: '-0.02em' }}>{TLC_DOOR_BRAND.name}</h1>
            </div>
            <div className="shrink-0 flex items-center gap-1.5 sm:gap-2 ts-chrome-region">
              {/* Book stays in the bar: for a client it is THE action, reachable
                  from every scroll position. */}
              <a href={TLC_BRAND.bookingUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-2 bg-[#B85838] text-white text-[0.625rem] font-semibold uppercase tracking-wider hover:bg-[#1A1815] transition-colors whitespace-nowrap focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]">
                Book
              </a>
              {/* Staff log in / out — lets TLC staff sign in from the door itself,
                  before or without installing (Darrell's ask). */}
              {/* USER PHOTO (Darrell 2026-09-10: "User photo for all apps
                  especially this one"): signed in, the bar wears the person's
                  picture (or their initials with "+ photo" until they add one);
                  tapping it opens My profile — picture, name — the same one
                  every app reads (DR-0342). Log out rides with it. */}
              {signedIn ? (
                <HeaderAuthButton />
              ) : (
                <button type="button" onClick={() => setShowLogin((v) => !v)} aria-expanded={showLogin} className="text-[0.625rem] uppercase tracking-wider px-3 py-2 border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white font-semibold whitespace-nowrap focus:outline focus:outline-2 focus:outline-[#B85838]">
                  Staff log in
                </button>
              )}
              {/* The hideaway chevron — UP to tuck the top space away, DOWN to
                  bring it back; the choice persists per device. No hover FILL:
                  on a touch screen hover sticks after a tap, and a filled box
                  with a same-tone icon read as an empty cream square on the
                  midnight theme (Darrell's tablet, 2026-09-10). Ink on the bar,
                  rust on hover, in every theme. */}
              <button
                type="button"
                onClick={toggleHeaderChrome}
                aria-expanded={!headerCollapsed}
                aria-label={headerCollapsed ? 'Show the full header (tagline, comfort controls, share)' : 'Hide the top space — keep only the bar for more room'}
                title={headerCollapsed ? 'Show the full header' : 'Hide the top space (keep the bar)'}
                className="shrink-0 min-h-[2.25rem] min-w-[2.25rem] flex items-center justify-center border border-[#1A1815] bg-transparent text-[#1A1815] hover:border-[#B85838] hover:text-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]"
              >
                <UiIcon name={headerCollapsed ? 'chevronDown' : 'chevronUp'} className="text-base" />
                <span className="sr-only">{headerCollapsed ? 'Show header' : 'Hide header'}</span>
              </button>
            </div>
          </div>

          {/* 2 · the hideaway: the door's welcome, tucked away on demand */}
          {!headerCollapsed && (
            <div className="pb-4 sm:pb-5">
              {/* Display tagline + blurb are chrome too (2026-08-05): un-capped
                  they filled a phone screen at Big Print and pushed the size
                  controls out of reach. The CONTENT below the header scales fully. */}
              <div className="ts-chrome-region">
                <p className="text-2xl sm:text-3xl mb-1.5 leading-tight" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600, letterSpacing: '-0.02em' }}>{TLC_DOOR_BRAND.tagline}</p>
                <p className="text-sm sm:text-base text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>{TLC_DOOR_BRAND.blurb}</p>
              </div>

              {/* Comfort controls — theme + text size, the platform staples. Same
                  shared libs (theme-css / text-size) the whole PoeTech app uses.
                  ts-chrome-region: chrome must not compound with its own setting;
                  ts-escape-hatch: pinned on screen at big sizes (index.css). */}
              <div className="mt-3 flex flex-wrap items-center gap-1.5 ts-chrome-region ts-escape-hatch bg-white" role="group" aria-label="Comfort controls">
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
                    className={`min-h-[2.25rem] min-w-[2.25rem] rounded border px-1.5 text-xs focus:outline focus:outline-2 focus:outline-[#B85838] ${sizeKey === s.key ? 'border-[#B85838] text-[#B85838] font-semibold' : 'border-[#E8E2D8] text-[#5A5751]'}`}
                    onClick={() => setSizeKey(s.key)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              <div className="mt-3 flex flex-wrap gap-2.5 ts-chrome-region">
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
            </div>
          )}

          {/* The login form opens right on the door — no download needed. It
              shows in BOTH header states: a tucked-away top space never hides
              the way in. */}
          {loginOpen && (
            <div className="mb-4 max-w-sm border border-[#E8E4DC] bg-[#FAF8F4] p-3">
              <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] mb-2">TLC staff sign in</div>
              <PasswordAuth mode="signin" embedded onSignedIn={() => { setShowLogin(false); }} />
            </div>
          )}
        </div>
        {/* Collapsed above Normal: the text-size way out stays on screen. */}
        <TextSizeEscapeHatch collapsed={headerCollapsed} />
      </header>

      {/* Signed-in staff get the office menu (Find + Assistant); a client gets
          just the booking page. */}
      {onboardToken ? (
        <OnboardingDoor token={onboardToken} signedIn={signedIn} />
      ) : signedIn ? (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-4">
          <SectionTabs sections={sections} ariaLabel="TLC app sections" idBase="tlc-app" defaultId="find" activeId={activeTab} onActiveChange={setActiveTab} />
        </div>
      ) : (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-4">
          <SectionTabs sections={visitorSections} ariaLabel="TLC door sections" idBase="tlc-door" defaultId="find" activeId={visitorTab} onActiveChange={setVisitorTab} />
        </div>
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
