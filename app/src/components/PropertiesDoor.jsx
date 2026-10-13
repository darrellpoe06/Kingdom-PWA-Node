// =============================================================================
// PropertiesDoor — the Poe Properties App's own front door (/properties/app/)
// =============================================================================
// Darrell, 2026-08-26: "1099 workers and tenants and their families will use the
// Poe Properties App ... Both Apps should be able to work together or separate."
//
// This is the LEAN boot for that app: sign in, then the properties module. It
// never imports the PoeTech monolith — a tenant opening this door downloads a
// property-management app, not a family finance platform, and sees nothing of
// the books because there is nothing of the books in the bundle OR in the RLS
// (the two agree, which is the point — DR-0060).
//
// It is the same MODULE the PoeTech app mounts. One library, two doors: no
// second copy of the logic and no second store, so both faces are always on the
// same rows (Darrell: "keeping both with latest Synced data").
// =============================================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import supabase, { resolveInitialSession, readPersistedSession, signOut } from '../lib/supabase.js';
import PasswordAuth from './PasswordAuth.jsx';
import PropertiesApp from '../modules/properties/PropertiesApp.jsx';
import Cameras from './Cameras.jsx';
import { POE_PROPERTIES } from '../modules/properties/config.js';
import { DOORS, doorSession, leaveDoor, enterDoor, enterAllDoors } from '../lib/door-session.js';
import { WHO_OPTIONS } from '../modules/properties/model.js';
import { readApplyTarget, resolveScan } from '../modules/properties/apply-link.js';
import { readReportToken } from '../modules/properties/guest-report.js';
import { GuestReportPage } from '../modules/properties/GuestReport.jsx';
import { loadPublicVacancies, submitApplication } from '../modules/properties/cloud.js';
import { VacancyCard } from '../modules/properties/Storefront.jsx';
import { areaOf } from '../modules/properties/area.js';
import { APPLICATION_SECTIONS, validateApplication } from '../modules/properties/intake.js';
// WHAT AN APPLICANT IS OWED IN WRITING (DR-0357): the criteria every
// application is judged by and the fair-housing commitment it is read under.
// Read live where the reader's instance can be resolved (a signed-in
// landlord); the originals the code ships otherwise, which is what an
// anonymous applicant sees until the office saves its own words.
import { originalProduct } from '../lib/product-forms.js';
import { readProductForms } from '../lib/product-forms-sync.js';
// THE TENANTS' VERSION OF POETECH (DR-0827): the same chrome the PoeTech shell
// and the TLC door carry, from the same shared libs, so a tenant or a 1099
// worker gets the platform staples here too: the five themes, text size and
// its escape hatch, the hideaway top space, the install button, the share QR,
// read-aloud, and the post-update toast. No PoeTech monolith is imported.
import { THEME_CSS, THEMES, useThemePref } from '../lib/theme-css.js';
import { useTextSize } from '../lib/text-size.js';
import { motionBehavior } from '../lib/gentle-motion.js';
import { useAutoHideHeader } from '../lib/use-auto-hide-header.js';
import { readHeaderCollapsed, writeHeaderCollapsed, nextCollapsed } from '../lib/header-hideaway.js';
import { TextSizeEscapeHatch } from './TextSizeControl.jsx';
import InstallAppButton from './InstallAppButton.jsx';
import AppShareQR from './AppShareQR.jsx';
import TTSControl from './TTSControl.jsx';
import { UpdatePrompt } from './PwaPrompts.jsx';
import UiIcon from './UiIcon.jsx';
import AccessibilityNote from './AccessibilityNote.jsx';
import { WELCOME_CSS, PoePropertiesMark, WelcomeHero, PortalCards, DoorFooter, cardCopy } from './PoePropertiesWelcome.jsx';

// The focus ring the door's own buttons carry (UX-PATTERNS 2g.1), in the brand
// red. A literal here, not an import: the ui-standards guard resolves a
// className's constant only within the file that uses it.
const FOCUS_RING = 'focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#E00000]';

/** The door's own address, the one a tenant shares or scans (DR-0258 scope). */
export const PROPERTIES_SHARE_URL = 'https://poetech.us/properties/app/';

const { brand } = POE_PROPERTIES;
const serif = { fontFamily: '"Fraunces", Georgia, serif' };

/**
 * What the page may truthfully say about addresses, from what it lists:
 * every card holding its street -> shared when you apply; any card showing
 * its street -> say so, never the opposite.
 */
export function addressPromise(vacancies = []) {
  const list = Array.isArray(vacancies) ? vacancies : [];
  const shown = list.filter((v) => v && (v.address_shown === undefined || v.address_shown === true)).length;
  if (shown === 0) return 'The exact address is given by a person, not published here.';
  if (shown === list.length) return 'The owner has chosen to show these addresses.';
  return 'Some places show their address by the owner\u2019s choice; the rest share it when you apply.';
}

export default function PropertiesDoor() {
  const [session, setSession] = useState(undefined); // undefined = still checking

  useEffect(() => {
    let on = true;
    // A TIMEOUT IS NOT A SIGN-OUT (fixed 2026-08-28, from Darrell's screenshots).
    //
    // This door used to race getSession() against a 5s deadline and render
    // SIGNED OUT if the deadline won. getSession() takes a CROSS-TAB auth lock,
    // so with the PoeTech app open in another tab the lock is contended and the
    // deadline wins routinely — and a signed-in landlord with twelve doors was
    // shown "Who are you?", the applicant picker built for a stranger. He read
    // it, correctly, as having been logged out.
    //
    // The deadline was right; the ANSWER was wrong. "I could not find out in
    // time" is not "there is no session" (DR-0076 §8 — unknown is never a
    // value), and here the unknown was rendered as the most alarming possible
    // value: your account is gone.
    //
    // resolveInitialSession is the primitive the monolith already used for this
    // exact hang (readPersistedSession + reconcile; see auth-boot-gate-hang
    // tests). It reads the persisted session SYNCHRONOUSLY from localStorage —
    // no lock, no network, cannot hang — emits it at once, then reconciles with
    // getSession() when it eventually resolves. The fix was already in the repo
    // and this door did not reuse it, which is the P26 class.
    //
    // Showing the app optimistically is safe: RLS is the real gate (DR-0060), so
    // a stale token reads nothing and the auth listener corrects within a beat.
    // The failure it removes is the opposite and far worse — a landlord being
    // told he is a stranger to his own property records.
    resolveInitialSession(
      (s) => { if (on) setSession(s ?? null); },
      { getSession: () => supabase.auth.getSession(), readStored: () => readPersistedSession() },
    );
    setLeft(doorSession(DOORS.properties, { any: true }).left);
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => { if (on) setSession(s || null); });
    return () => { on = false; sub?.subscription?.unsubscribe?.(); };
  }, []);

  // LEAVING THIS DOOR LEAVES THIS DOOR (Darrell, 2026-08-28: "login to each
  // separate and together etc... not dependent"). Both apps are one origin and
  // therefore one Supabase session, so the old Sign out revoked it and threw him
  // out of PoeTech too. The separation is at the door, not the token — copying
  // the session into a second storage key would race supabase's rotating
  // refresh token and cause random logouts, which is the disease, not the cure.
  const [left, setLeft] = useState(() => false);
  const guestToken = useMemo(
    () => (typeof window === 'undefined' ? null : readReportToken(window.location.search)),
    [],
  );
  const view = doorSession(DOORS.properties, session || null);
  const shown = left ? null : view.session;

  // The platform staples (DR-0827), the same keys the PoeTech shell writes, so
  // one choice follows a person between the apps on the same phone.
  // ONE CHOICE, EVERY SURFACE (DR-0878). Darrell, 2026-10-10: "can't change
  // the color of the system using the reader controller... fix it".
  //
  // This door used to hold its OWN copy of the theme — useState(readThemePref)
  // plus an effect that saved it — and never subscribed to the shared
  // preference. The reader's color picker calls setThemePref, which publishes
  // to every subscriber, and this door was not one: it had read the value once
  // at mount and had no way to learn it had changed. So the picker genuinely
  // set the preference, the preference was genuinely saved, and the screen the
  // reader was looking at never repainted. The PoeTech shell
  // (the monolith) used useThemePref and therefore worked, which
  // is exactly why this read as "the reader can't change the system" rather
  // than "the picker is broken" — it depended on which door you were standing
  // in. useThemePref both subscribes and saves, so the effect goes with it.
  const [theme, setTheme] = useThemePref('cream');
  const [sizeKey, setSizeKey, sizeSteps] = useTextSize();
  const headerHidden = useAutoHideHeader();
  const [headerCollapsed, setHeaderCollapsed] = useState(() => readHeaderCollapsed());
  const toggleHeaderChrome = () => setHeaderCollapsed((prev) => { const next = nextCollapsed(prev); writeHeaderCollapsed(next); return next; });
  const [showShare, setShowShare] = useState(false);

  return (
    <div data-theme={theme === 'cream' ? undefined : theme} className="pp-door min-h-screen overflow-x-clip flex flex-col text-[#1A1815]">
      <style>{THEME_CSS}</style>
      {/* The front page's own look (2026-10-13, Darrell's mock-up): the red /
          black / gold palette as custom properties, remapped for midnight, and
          the self-hosted headline face. Presentation only; see the file. */}
      <style>{WELCOME_CSS}</style>
      {/* The top space, controlled like PoeTech's header: a compact bar that
          is always present, and a hideaway (tagline, comfort controls, install,
          share) the chevron tucks away per device. Sticky and auto-hiding on
          top of that. ts-safe-sticky keeps the size controls reachable at big
          text (DR-0276). */}
      <header
        className={`pp-header ts-safe-sticky sticky top-0 z-40 transition-transform duration-300 will-change-transform ${headerHidden ? '-translate-y-full' : 'translate-y-0'}`}
        data-testid="properties-door-header"
      >
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-2 py-2.5 sm:py-3">
            <div className="min-w-0 ts-chrome-region pp-lockup">
              {/* The roof mark + wordmark from the mock-up: "Poe" red,
                  "Properties" black, PROPERTY MANAGEMENT between gold rules.
                  The h1's text stays exactly the brand label. */}
              <PoePropertiesMark />
              <div className="min-w-0">
                <h1 className="pp-wordmark text-xl sm:text-2xl">
                  <span className="pp-red">Poe</span> Properties
                </h1>
                <p className="pp-strap">Property Management</p>
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-1.5 sm:gap-2 ts-chrome-region">
              {shown && (
                <>
                  <button
                    type="button"
                    className="text-[0.625rem] uppercase tracking-wider underline text-[#5A5751] whitespace-nowrap focus:outline focus:outline-2 focus:outline-[#B85838]"
                    // Leaves THIS door only. Never calls supabase.auth.signOut(), so
                    // the PoeTech app on the same phone keeps its sign-in.
                    onClick={() => { leaveDoor(DOORS.properties); setLeft(true); }}
                  >Sign out of Poe Properties</button>
                  <button
                    type="button"
                    className="text-[0.625rem] uppercase tracking-wider underline text-[#8A867E] focus:outline focus:outline-2 focus:outline-[#B85838]"
                    // The real one. signOut() from lib/supabase (not
                    // supabase.auth.signOut) opens the deliberate-sign-out window, so
                    // the transient-logout guard does not "recover" it back in.
                    onClick={() => { enterAllDoors(); signOut().then(() => window.location.reload()); }}
                  >everywhere</button>
                </>
              )}
              <button
                type="button"
                onClick={toggleHeaderChrome}
                aria-expanded={!headerCollapsed}
                aria-label={headerCollapsed ? 'Show the full header (tagline, comfort controls, install, share)' : 'Hide the top space — keep only the bar for more room'}
                title={headerCollapsed ? 'Show the full header' : 'Hide the top space (keep the bar)'}
                data-testid="properties-door-hideaway"
                className="shrink-0 min-h-[2.25rem] min-w-[2.25rem] flex items-center justify-center border border-[#1A1815] bg-transparent text-[#1A1815] hover:border-[#B85838] hover:text-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]"
              >
                <UiIcon name={headerCollapsed ? 'chevronDown' : 'chevronUp'} className="text-base" />
                <span className="sr-only">{headerCollapsed ? 'Show header' : 'Hide header'}</span>
              </button>
            </div>
          </div>

          {!headerCollapsed && (
            <div className="pb-3 sm:pb-4">
              <p className="text-xs sm:text-sm text-[#5A5751] ts-chrome-region" style={serif}>{brand.tagline}</p>
              {/* Comfort controls: theme + text size, the platform staples, from
                  the same libs the whole PoeTech app uses. */}
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5 ts-chrome-region ts-escape-hatch bg-white" role="group" aria-label="Comfort controls" data-testid="properties-door-comfort">
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
                {sizeSteps.map((st) => (
                  <button
                    key={st.key}
                    type="button"
                    aria-label={`Text size ${st.name}`}
                    aria-pressed={sizeKey === st.key}
                    className={`min-h-[2.25rem] min-w-[2.25rem] rounded border px-1.5 text-xs focus:outline focus:outline-2 focus:outline-[#B85838] ${sizeKey === st.key ? 'border-[#B85838] text-[#B85838] font-semibold' : 'border-[#E8E2D8] text-[#5A5751]'}`}
                    onClick={() => setSizeKey(st.key)}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
              <div className="mt-2.5 flex flex-wrap items-center gap-2 ts-chrome-region">
                {/* Install on this phone: the browser's own dialog where it has
                    one, the exact steps for this phone otherwise; hides itself
                    once installed. The door has its own manifest and scope. */}
                <InstallAppButton />
                <button
                  type="button"
                  onClick={() => setShowShare((v) => !v)}
                  aria-expanded={showShare}
                  data-testid="properties-door-share"
                  className="inline-flex items-center px-3 py-2 border border-[#1A1815] text-[0.625rem] font-semibold uppercase tracking-wider hover:border-[#B85838] hover:text-[#B85838] transition-colors focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]"
                >
                  {showShare ? 'Hide QR' : 'Share · QR'}
                </button>
              </div>
              {showShare && (
                <div className="mt-3 inline-block">
                  <AppShareQR
                    url={PROPERTIES_SHARE_URL}
                    shown="poetech.us/properties/app"
                    title="Share Poe Properties"
                    blurb="Point a phone camera at this code (or share your screen) to open the Poe Properties app — no long address to type. It shares the way in; it never grants access."
                    ariaLabel="QR code to open the Poe Properties app"
                  />
                </div>
              )}
            </div>
          )}
        </div>
        <TextSizeEscapeHatch collapsed={headerCollapsed} onShowHeader={toggleHeaderChrome} />
      </header>

      <main className="w-full flex-1 p-3 sm:p-4 lg:px-8">
        {/* A GUEST'S CARD (DR-0898). A code scanned inside a short stay opens
            the report form, signed in or not: the guest came to say what is
            wrong, and nothing about a session changes what they may do. */}
        {guestToken ? <GuestReportPage token={guestToken} /> : (<>
        {session === undefined && (
          <p className="text-xs text-[#5A5751] p-2" style={serif}>Checking your sign-in…</p>
        )}
        {session !== undefined && !shown && (
          <SignedOutDoor
            left={left}
            onReturn={() => { enterDoor(DOORS.properties); setLeft(false); }}
          />
        )}
        {shown && <PropertiesApp surface="door" renderCameras={() => <Cameras />} />}
        </>)}
      </main>

      {/* What the app holds itself to, where renters and guests are (DR-0998);
          above the band, so the band keeps its exact wording. */}
      <div className="px-4 pb-4 flex justify-center"><AccessibilityNote /></div>
      {/* POE PROPERTIES · POWERED BY POETECH -- the black band, on every
          screen size, with the exact wording Darrell asked for. */}
      <DoorFooter />
      {/* Read aloud, on every page, in the person's one chosen voice; renders
          nothing where the device has no speech. */}
      <TTSControl />
      {/* The slim acknowledgement after an update reload; never a nag. */}
      <UpdatePrompt />
    </div>
  );
}

/**
 * The door with NO account (Darrell, 2026-08-26: "Ask who they are landlord
 * tenant or applicant... others?" and "See options without a user account").
 *
 * It used to say one thing — "a landlord invites you" — which is a dead end for
 * the person most likely to open a property app first: someone looking for a
 * place. Now it asks, and the one answer that needs no account (looking for a
 * place) is served immediately from the listed vacancies.
 */
function SignedOutDoor({ left = false, onReturn } = {}) {
  // A QR on a vacant unit lands here with ?apply=<rental id>. Someone who
  // scanned a code at a property has already answered "who are you" — they are
  // asking about that unit — so the who-picker is skipped rather than made into
  // a toll gate in front of the thing they came for.
  const scanned = useMemo(
    () => (typeof window === 'undefined' ? null : readApplyTarget(window.location.search)),
    [],
  );
  const [who, setWho] = useState(scanned ? 'applicant' : null);
  const [wantsAuth, setWantsAuth] = useState(false);
  const [vacancies, setVacancies] = useState(null);   // null = not asked yet

  useEffect(() => {
    if (who !== 'applicant' || vacancies !== null) return;
    let on = true;
    loadPublicVacancies().then((r) => { if (on) setVacancies(r.ok ? r.vacancies : []); });
    return () => { on = false; };
  }, [who, vacancies]);

  // The vacancies list is the authority on whether a scanned card is still
  // good: public_vacancies already refuses a door that is unadvertised or
  // occupied, so a card left in a window after the unit was taken degrades to
  // the truth instead of opening an application for something gone.
  const scan = useMemo(
    () => resolveScan(scanned, vacancies || []),
    [scanned, vacancies],
  );

  // THE CARD'S APPLY OPENS THE APPLICATION (DR-0902). Darrell, 2026-10-10:
  // "The image has an apply button that should open the application!!! It does
  // not do that currently!!!" It did not, because it was a link out to
  // /properties/?apply=<id> and that hop dropped the id. The form is already
  // on this page, so the card asks for it directly: name the unit, open the
  // form, and put it where the eye is. `pick` is a counter rather than a
  // boolean so tapping Apply on a SECOND card re-scrolls and re-selects
  // instead of doing nothing because the form is already open.
  const [picked, setPicked] = useState({ id: '', pick: 0 });
  const applyFor = useCallback((rentalId) => {
    setPicked((p) => ({ id: String(rentalId || ''), pick: p.pick + 1 }));
  }, []);

  const chosen = WHO_OPTIONS.find((w) => w.id === who) || null;
  const back = () => { setWho(null); setWantsAuth(false); };

  if (!chosen) {
    return (
      <div className="pp-welcome">
        {/* You LEFT this door — you were not thrown out of it, and your PoeTech
            sign-in is untouched. Saying so is the difference between a door you
            closed and an account that vanished; the second reading is what the
            2026-08-28 screenshots showed and it is alarming for no reason. The
            notice renders ONLY when `left` is true: "You're signed out on this
            device. Your PoeTech sign-in is still active -- this door only forgot you."
            with the "Come back in" action (PoePropertiesWelcome.jsx). */}
        <WelcomeHero left={left} onReturn={onReturn} />
        {/* The six portals are WHO_OPTIONS, unchanged: same ids, same
            needsAccount, same handler (setWho). Only the look is new. */}
        <PortalCards options={WHO_OPTIONS} onPick={setWho} />
      </div>
    );
  }

  if (chosen.id === 'applicant') {
    return (
      <div className="pp-step">
        {/* The vacancies step wears the front page's look (2026-10-13): the
            same white panel, serif title, red kicker and red pill. What it
            lists and how Apply works are unchanged. */}
        <button type="button" onClick={() => setWho(null)} className={`pp-back ${FOCUS_RING}`}>← Back</button>
        <div className="pp-panel" data-testid="vacancies-panel">
        <span className="pp-kicker">{cardCopy(chosen).title}</span>
        <h2 className="pp-panel-title">
          {scan.matched ? `${scan.unit.label}${scan.unit.unit ? ` · ${scan.unit.unit}` : ''}` : 'Available now'}
        </h2>
        {scanned && vacancies !== null && !scan.matched && (
          <p className="pp-panel-note">{scan.reason}</p>
        )}
        {vacancies === null && <p className="pp-panel-note">Checking…</p>}
        {vacancies !== null && vacancies.length === 0 && (
          <p className="pp-panel-note">
            Nothing is listed right now. Only units the landlord has listed appear here — an empty unit is never advertised automatically.
          </p>
        )}
        {/* THE SAME SHELF THE PoeTech TAB SHOWS. One storefront, both doors
            (Storefront.jsx) — a renter sees the same cards whichever way they
            arrived, with the unit's own listing photographs, and there is no
            second copy of the layout to drift. "like the MooreDivahs App has
            except this is places to live... without an account" (Darrell). */}
        {(vacancies || []).length > 0 && (
          <ul className="pp-shelf grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(vacancies || []).map((v) => (
              <VacancyCard
                key={v.id}
                unit={{
                  id: String(v.id),
                  rentalId: v.id,
                  label: String(v.label || '').trim(),
                  where: [v.city, v.state].filter(Boolean).join(', '),
                  unit: String(v.unit || '').trim(),
                  rent: Number(v.rent) > 0 ? Number(v.rent) : null,
                  beds: Number(v.bedrooms) > 0 ? Number(v.bedrooms) : null,
                  baths: Number(v.bathrooms) > 0 ? Number(v.bathrooms) : null,
                  offering: String(v.offering || 'long-term'),
                  nightly: Number(v.nightly_rate) > 0 ? Number(v.nightly_rate) : null,
                  // ANY CADENCE (DR-1003): NULL from the database is "not
                  // offered that way", and stays null here, never 0.
                  weekly: Number(v.weekly_rate) > 0 ? Number(v.weekly_rate) : null,
                  biweekly: Number(v.biweekly_rate) > 0 ? Number(v.biweekly_rate) : null,
                  buildingNote: String(v.building_note || '').trim() || null,
                  note: String(v.note || '').trim(),
                  addressShown: v.address_shown === undefined ? true : Boolean(v.address_shown),
                  area: areaOf(v),
                  street: String(v.street || '').trim(),
                  city: String(v.city || '').trim(),
                  state: String(v.state || '').trim(),
                  nearby: Array.isArray(v.nearby) ? v.nearby : [],
                  // WHAT IS ACTUALLY BEING RENTED (DR-0952). A bed or a room
                  // in a shared home is not a one-bedroom apartment, and the
                  // card said it was.
                  sharedHome: Boolean(v.shared_home),
                  rentableLevel: String(v.rentable_level || '') || null,
                  // Three states, not two: true, false, and NOT YET SAID.
                  // undefined/null must stay null so the card says nothing
                  // rather than inventing an answer.
                  utilities: v.utilities_included === null || v.utilities_included === undefined
                    ? null : Boolean(v.utilities_included),
                }}
                onApply={applyFor}
              />
            ))}
          </ul>
        )}
        {/* The page's own sentence follows the doors it lists (0158 / DR-0932
            addendum, Darrell 2026-10-10: "the address shows while it says it
            will not show... fix it"). It used to promise "not published here"
            unconditionally while a door set to show its street showed it. */}
        <p className="pp-panel-note" data-testid="address-promise">
          {addressPromise(vacancies || [])}
        </p>
        </div>
        <BeforeYouApply />
        <ApplyForm
          vacancies={vacancies || []}
          preselect={picked.id || (scan.matched ? scan.unit.id : '')}
          openFor={picked.pick}
          openOnLoad={scan.matched}
        />
      </div>
    );
  }

  // Signing in is a door you TAKE, not a gate you pass (Darrell: "only if they
  // want or need to log in to the app"). So this says what is behind it and
  // waits — the form appears when the person asks for it.
  return (
    <>
      <div className="pp-step">
        {/* The sign-in step wears the front page's look (2026-10-13): the
            portal's own title from the card, the same panel, the red pill. The
            form and what happens after a sign-in are unchanged. */}
        <button type="button" onClick={back} className={`pp-back ${FOCUS_RING}`}>← Back</button>
        <div className="pp-panel" data-testid="sign-in-panel">
          <span className="pp-kicker">Sign in</span>
          <h2 className="pp-panel-title">{cardCopy(chosen).title}</h2>
          <p className="pp-panel-lead">{chosen.blurb}</p>
          <p className="pp-panel-note">
            Your place is tied to the email address <strong>or the cell phone number</strong> your landlord used to invite you — that
            is how the app knows which one is yours. Nothing to set up.
          </p>
          {!wantsAuth && (
            <button
              type="button" onClick={() => setWantsAuth(true)}
              className={`pp-btn mt-5 ${FOCUS_RING}`}
            >Sign in / create a profile</button>
          )}
        </div>
      {wantsAuth && (
        <div className="pp-panel pp-auth">
          {/* SIGNING IN COMES BACK THROUGH THE DOOR (DR-0954).
              Christina, 2026-10-11, relayed by Darrell: "When I sign in as
              then I click on I live here. I then go to the other sign in page
              and it is a loop as it goes straight to these 3 pages over and
              over."

              It was a loop, and this line was the whole of it. Leaving this
              door writes a per-door flag (leaveDoor), and doorSession then
              hides the session until that flag is cleared. enterDoor clears
              it, and its own docstring says it is "called whenever a sign-in
              succeeds at that door" — this call site never called it. So she
              signed in SUCCESSFULLY, reloaded, the flag was still there, the
              door still believed she had left, and it showed her "You signed
              out of Poe Properties" and "Who are you?" again. Picking "I live
              here" took her back to this form, for ever.

              The only escape was the small "Come back in" link on the banner,
              which is the one control that did call enterDoor — and nobody
              who has just signed in has any reason to look for a way to come
              back in.

              Reloading is kept: the shell reads the session at mount in
              several places and a reload is the honest way to re-read them
              all. The flag is simply cleared FIRST, which is the order the
              rest of this file already uses (see onReturn above). */}
          <PasswordAuth
            mode="signin" embedded startWith="email" brand={{ name: brand.label, eyebrow: brand.label }}
            onSignedIn={() => { enterDoor(DOORS.properties); window.location.reload(); }}
          />
        </div>
      )}
      </div>
    </>
  );
}

/**
 * The two pages an applicant reads BEFORE the form: what this office looks at,
 * and how it chooses. DR-0101 requires the criteria be documented and
 * consistent and the decision carry its reason; this is where the applicant
 * gets to read them first. Folded shut by default so the door stays a door.
 */
function BeforeYouApply() {
  const [forms, setForms] = useState(() => originalProduct('properties'));
  const [openKey, setOpenKey] = useState('');
  useEffect(() => {
    let alive = true;
    readProductForms('properties').then((res) => { if (alive && res.ok) setForms(res.resolved); });
    return () => { alive = false; };
  }, []);
  const pages = ['rental-criteria', 'fair-housing'].map((k) => ({ key: k, entry: forms[k] })).filter((p) => p.entry && p.entry.doc);
  if (!pages.length) return null;
  return (
    <div className="pp-fold">
      <p className="pp-kicker">Before you apply</p>
      {pages.map(({ key, entry }) => {
        const open = openKey === key;
        return (
          <div key={key} className="pp-fold-row">
            <button
              type="button" onClick={() => setOpenKey(open ? '' : key)} aria-expanded={open}
              className={`pp-fold-open min-h-[44px] ${FOCUS_RING}`}
            >
              <span>{entry.doc.title}</span>
              <span>{open ? 'hide' : 'read'}</span>
            </button>
            {open && (
              <div className="pp-fold-body">
                <p>{entry.doc.preamble}</p>
                {entry.doc.sections.map((sec) => (
                  <section key={sec.n}>
                    <h4>{sec.n}. {sec.title}</h4>
                    {sec.text && <p>{sec.text}</p>}
                    {sec.items && <ul>{sec.items.map((it) => <li key={it}>{it}</li>)}</ul>}
                    {sec.after && <p>{sec.after}</p>}
                  </section>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * The application, filled by someone with NO account. Renders the family's own
 * form (intake.js, read from their Drive) — app-collected fields only, so an
 * SSN is never even asked for here. Submitting needs no sign-in; an account is
 * OFFERED afterward, never required, because the application is the point.
 */
/**
 * `openFor` — a COUNTER, not a flag. Each increment means "someone just asked
 * to apply for `preselect`": open, select it, and scroll here (DR-0902).
 *
 * THE THIRD DEFECT IN THIS JOURNEY, and the quietest. Even when the unit id
 * DID survive — a scan that worked — this form still rendered its own
 * "Apply — no account needed" button and waited. The comment below has said
 * since the code was written that preselecting "is the whole point of the
 * code", and then the person who scanned a card ON the door of the unit they
 * want had to tap Apply anyway. That is the same extra tap Darrell named on
 * the lessons: "users have to click again!!! Why?"
 *
 * A counter rather than a boolean because the second tap matters: a person
 * comparing two units taps Apply on one card, then on another. With a boolean
 * the form is already open and nothing visibly happens — the selection would
 * change silently, under a form they are no longer looking at.
 */
function ApplyForm({ vacancies, preselect = '', openFor = 0, openOnLoad = false }) {
  const [open, setOpen] = useState(openFor > 0 || openOnLoad);
  const [values, setValues] = useState({});
  // A scan already said which unit. Preselecting it is the whole point of the
  // code — otherwise the person picks their own door out of a list they did not
  // need to see.
  const [unit, setUnit] = useState(preselect);
  const box = React.useRef(null);

  // A SCAN OPENS, A TAP OPENS AND SCROLLS (DR-0902, corrected by its own test).
  // These are two different events and the first version conflated them. A
  // scan's unit only resolves once the vacancies list arrives, which is a
  // second or so AFTER paint -- so driving the scroll from it yanked the view
  // out from under someone who was reading the photos. A delayed, unasked-for
  // jump is the jarring thing this guard exists to avoid. Opening the form is
  // still right on a scan: that person is standing at the unit's door.
  useEffect(() => {
    if (openOnLoad) setOpen(true);
  }, [openOnLoad]);

  // THE SCANNED UNIT ARRIVES LATE, AND HAS TO LAND IN THE PICKER. `unit` is
  // seeded from `preselect` at first render, and at first render a scan has
  // resolved to nothing yet — public_vacancies is the authority on whether the
  // card is still good, and it has not answered. So the form opened with the
  // picker EMPTY, which is the exact failure preselect exists to prevent: the
  // person who scanned that unit's own door picks it out of a list again.
  // Only fills an untouched picker, so a choice already made is never
  // overwritten underneath someone.
  useEffect(() => {
    if (preselect) setUnit((u) => (u || preselect));
  }, [preselect]);

  // Open AND SCROLL on every ASK — a deliberate tap, where the form may be
  // far below what the person is looking at.
  const asked = React.useRef(openFor);
  useEffect(() => {
    if (openFor === asked.current) return;
    asked.current = openFor;
    if (openFor <= 0) return;
    setOpen(true);
    if (preselect) setUnit(preselect);
    // Next frame: the form has to exist before it can be scrolled to.
    if (typeof window !== 'undefined' && window.requestAnimationFrame) {
      window.requestAnimationFrame(() => {
        try {
          if (box.current && box.current.scrollIntoView) {
            box.current.scrollIntoView({ behavior: motionBehavior(), block: 'start' });
          }
        } catch { /* a view that cannot scroll is still a usable form */ }
      });
    }
  }, [openFor, preselect]);
  const [sent, setSent] = useState(null);
  const set = (key) => (e) => setValues((p) => ({ ...p, [key]: e.target.value }));

  if (!open) {
    return (
      <button
        type="button" onClick={() => setOpen(true)}
        className={`pp-btn mt-4 ${FOCUS_RING}`}
      >Apply — no account needed</button>
    );
  }
  if (sent) {
    return (
      <div className="pp-panel mt-4">
        <p className="pp-panel-lead">{sent}</p>
        <p className="pp-panel-note">
          You do not need an account for us to read this. If you want one — to follow your application and, once you are approved,
          to reach your unit — you can make one any time from this page.
        </p>
      </div>
    );
  }

  const check = validateApplication(values);
  const name = `${values['applicant.firstName'] || ''} ${values['applicant.lastName'] || ''}`.trim();

  return (
    <div className="pp-panel pp-form mt-4" ref={box} data-testid="apply-form">
      <span className="pp-kicker">Apply</span>
      <p className="pp-panel-note" style={{ marginTop: 0, marginBottom: '1rem' }}>
        Every adult 18 or older fills out their own. We never ask for a Social Security number here — if screening needs one,
        a person asks you directly.
      </p>
      {vacancies.length > 0 && (
        <select value={unit} onChange={(e) => setUnit(e.target.value)} aria-label="Which unit" className="mb-4">
          <option value="">Which unit are you applying for?</option>
          {vacancies.map((v) => <option key={v.id} value={v.id}>{v.label}{v.unit ? ` · ${v.unit}` : ''}</option>)}
        </select>
      )}
      {APPLICATION_SECTIONS.map((section) => {
        const fields = section.fields.filter((f) => f.collect === 'app');
        if (!fields.length) return null;
        return (
          <fieldset key={section.id} className="mb-3">
            <legend>{section.title}</legend>
            {section.note && <p className="pp-panel-note" style={{ marginTop: 0, marginBottom: '.6rem' }}>{section.note}</p>}
            {fields.map((f) => {
              const key = `${section.id}.${f.id}`;
              return (
                <label key={key}>
                  {f.label}{f.required ? ' *' : ''}
                  {f.type === 'yesno' ? (
                    <select value={values[key] || ''} onChange={set(key)}>
                      <option value="">—</option><option value="no">No</option><option value="yes">Yes</option>
                    </select>
                  ) : (
                    <input
                      value={values[key] || ''} onChange={set(key)}
                      type={f.type === 'date' ? 'date' : f.type === 'email' ? 'email' : f.type === 'tel' ? 'tel' : 'text'}
                    />
                  )}
                  {f.help && <span className="pp-help">{f.help}</span>}
                </label>
              );
            })}
          </fieldset>
        );
      })}
      <button
        type="button" disabled={!check.ok || !name}
        onClick={async () => {
          const res = await submitApplication({
            rentalId: unit || null, name,
            email: values['applicant.email'], phone: values['applicant.cellPhone'], answers: values,
          });
          setSent(res.ok
            ? 'Your application is in. Someone will reach out about the next step.'
            : `That did not send (${res.reason}). Nothing was lost — try again, or call us.`);
        }}
        className={`pp-btn ${FOCUS_RING}`}
      >Send my application</button>
      {!check.ok && check.missing.length > 0 && (
        <p className="pp-panel-note">Still needed: {check.missing.length} required field{check.missing.length === 1 ? '' : 's'}.</p>
      )}
    </div>
  );
}
