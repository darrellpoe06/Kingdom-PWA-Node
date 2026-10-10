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
    <div data-theme={theme === 'cream' ? undefined : theme} className="min-h-screen overflow-x-clip bg-[#FAF8F4] text-[#1A1815]">
      <style>{THEME_CSS}</style>
      {/* The top space, controlled like PoeTech's header: a compact bar that
          is always present, and a hideaway (tagline, comfort controls, install,
          share) the chevron tucks away per device. Sticky and auto-hiding on
          top of that. ts-safe-sticky keeps the size controls reachable at big
          text (DR-0276). */}
      <header
        className={`ts-safe-sticky sticky top-0 z-40 bg-white border-b-2 transition-transform duration-300 will-change-transform ${headerHidden ? '-translate-y-full' : 'translate-y-0'}`}
        style={{ borderColor: brand.accent }}
        data-testid="properties-door-header"
      >
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-2 py-2.5 sm:py-3">
            <div className="min-w-0 ts-chrome-region">
              <h1 className="text-lg sm:text-xl leading-none whitespace-nowrap truncate" style={{ ...serif, fontWeight: 600, letterSpacing: '-0.02em', color: brand.accent }}>{brand.label}</h1>
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

      <main className="w-full p-3 sm:p-4 lg:px-8">
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

      <footer className="px-4 py-6 text-center">
        <p className="text-[0.625rem] uppercase tracking-[0.2em] text-[#8A867E]">Poe Properties · powered by PoeTech</p>
      </footer>
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
      <div className="bg-white border border-[#E8E4DC] p-4">
        {/* You LEFT this door — you were not thrown out of it, and your PoeTech
            sign-in is untouched. Saying so is the difference between a door you
            closed and an account that vanished; the second reading is what the
            2026-08-28 screenshots showed and it is alarming for no reason. */}
        {left && (
          <div className="mb-3 border-l-2 pl-3" style={{ borderColor: brand.accent }}>
            <p className="text-[0.8125rem] text-[#1A1815] leading-relaxed">
              You signed out of Poe Properties on this device. Your PoeTech sign-in is still
              active — this door only forgot you.
            </p>
            <button
              type="button"
              className="mt-1 text-[0.625rem] uppercase tracking-wider underline"
              style={{ color: brand.accent }}
              onClick={() => onReturn?.()}
            >Come back in</button>
          </div>
        )}
        <h2 className="text-lg text-[#1A1815] mb-1" style={serif}>Who are you?</h2>
        <p className="text-xs text-[#5A5751] mb-3" style={serif}>
          Pick the one that fits. Only the first needs no account.
        </p>
        <div className="grid sm:grid-cols-2 gap-2">
          {WHO_OPTIONS.map((w) => (
            <button
              key={w.id} type="button" onClick={() => setWho(w.id)}
              className="text-left border border-[#E8E4DC] p-3 hover:border-[#2F5D50] focus:outline focus:outline-2 focus:outline-[#2F5D50]"
            >
              <div className="text-sm text-[#1A1815]" style={serif}>{w.label}</div>
              <div className="text-xs text-[#5A5751]" style={serif}>{w.blurb}</div>
              {!w.needsAccount && (
                <div className="text-[0.625rem] uppercase tracking-wider mt-1" style={{ color: brand.accent }}>No account needed</div>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (chosen.id === 'applicant') {
    return (
      <div className="bg-white border border-[#E8E4DC] p-4">
        <button type="button" onClick={() => setWho(null)} className="text-[0.625rem] uppercase tracking-wider underline text-[#5A5751] mb-2">← Back</button>
        <h2 className="text-lg text-[#1A1815] mb-1" style={serif}>
          {scan.matched ? `${scan.unit.label}${scan.unit.unit ? ` · ${scan.unit.unit}` : ''}` : 'Available now'}
        </h2>
        {scanned && vacancies !== null && !scan.matched && (
          <p className="text-xs text-[#5A5751] mb-2" style={serif}>{scan.reason}</p>
        )}
        {vacancies === null && <p className="text-xs text-[#5A5751]" style={serif}>Checking…</p>}
        {vacancies !== null && vacancies.length === 0 && (
          <p className="text-xs text-[#5A5751]" style={serif}>
            Nothing is listed right now. Only units the landlord has listed appear here — an empty unit is never advertised automatically.
          </p>
        )}
        {/* THE SAME SHELF THE PoeTech TAB SHOWS. One storefront, both doors
            (Storefront.jsx) — a renter sees the same cards whichever way they
            arrived, with the unit's own listing photographs, and there is no
            second copy of the layout to drift. "like the MooreDivahs App has
            except this is places to live... without an account" (Darrell). */}
        {(vacancies || []).length > 0 && (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
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
                  note: String(v.note || '').trim(),
                  addressShown: v.address_shown === undefined ? true : Boolean(v.address_shown),
                  area: areaOf(v),
                  nearby: Array.isArray(v.nearby) ? v.nearby : [],
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
        <p className="text-xs text-[#5A5751] mt-3 mb-2" style={serif} data-testid="address-promise">
          {addressPromise(vacancies || [])}
        </p>
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
      <div className="bg-white border border-[#E8E4DC] p-4 mb-3">
        <button type="button" onClick={back} className="text-[0.625rem] uppercase tracking-wider underline text-[#5A5751] mb-2">← Back</button>
        <p className="text-sm text-[#1A1815] mb-1" style={serif}>{chosen.blurb}</p>
        <p className="text-xs text-[#5A5751] mb-3" style={serif}>
          Your place is tied to the email address <strong>or the cell phone number</strong> your landlord used to invite you — that
          is how the app knows which one is yours. Nothing to set up.
        </p>
        {!wantsAuth && (
          <button
            type="button" onClick={() => setWantsAuth(true)}
            className="text-[0.625rem] uppercase tracking-wider px-3 py-2 border bg-[#2F5D50] text-white border-[#2F5D50] focus:outline focus:outline-2 focus:outline-[#2F5D50]"
          >Sign in / create a profile</button>
        )}
      </div>
      {wantsAuth && (
        <div className="mx-auto w-full sm:w-2/3 lg:w-1/3">
          <PasswordAuth mode="signin" embedded startWith="email" onSignedIn={() => window.location.reload()} />
        </div>
      )}
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
    <div className="border border-[#E8E4DC] p-3 mb-3">
      <p className="text-[0.625rem] uppercase tracking-[0.25em] font-semibold mb-2" style={{ color: brand.accent }}>Before you apply</p>
      {pages.map(({ key, entry }) => {
        const open = openKey === key;
        return (
          <div key={key} className="border-t border-[#F0ECE4] first:border-t-0 py-1">
            <button
              type="button" onClick={() => setOpenKey(open ? '' : key)} aria-expanded={open}
              className="w-full min-h-[36px] flex items-center justify-between gap-2 text-left text-sm text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#2F5D50]"
              style={serif}
            >
              <span>{entry.doc.title}</span>
              <span className="text-[0.625rem] uppercase tracking-wider text-[#8A867E]">{open ? 'hide' : 'read'}</span>
            </button>
            {open && (
              <div className="space-y-2 text-xs text-[#1A1815] leading-relaxed pb-2" style={serif}>
                <p className="text-[#5A5751]">{entry.doc.preamble}</p>
                {entry.doc.sections.map((sec) => (
                  <section key={sec.n}>
                    <h4 className="font-semibold">{sec.n}. {sec.title}</h4>
                    {sec.text && <p>{sec.text}</p>}
                    {sec.items && <ul className="list-disc pl-4">{sec.items.map((it) => <li key={it}>{it}</li>)}</ul>}
                    {sec.after && <p className="text-[#5A5751]">{sec.after}</p>}
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
        className="text-[0.625rem] uppercase tracking-wider px-3 py-2 border bg-[#2F5D50] text-white border-[#2F5D50] focus:outline focus:outline-2 focus:outline-[#2F5D50]"
      >Apply — no account needed</button>
    );
  }
  if (sent) {
    return (
      <div className="border border-[#E8E4DC] p-3">
        <p className="text-sm text-[#1A1815]" style={serif}>{sent}</p>
        <p className="text-xs text-[#5A5751] mt-1" style={serif}>
          You do not need an account for us to read this. If you want one — to follow your application and, once you are approved,
          to reach your unit — you can make one any time from this page.
        </p>
      </div>
    );
  }

  const check = validateApplication(values);
  const name = `${values['applicant.firstName'] || ''} ${values['applicant.lastName'] || ''}`.trim();

  return (
    <div className="border border-[#E8E4DC] p-3" ref={box} data-testid="apply-form">
      <p className="text-xs text-[#5A5751] mb-2" style={serif}>
        Every adult 18 or older fills out their own. We never ask for a Social Security number here — if screening needs one,
        a person asks you directly.
      </p>
      {vacancies.length > 0 && (
        <select value={unit} onChange={(e) => setUnit(e.target.value)} aria-label="Which unit"
          className="text-xs border border-[#E8E4DC] px-2 py-2 bg-white mb-2 w-full" style={serif}>
          <option value="">Which unit are you applying for?</option>
          {vacancies.map((v) => <option key={v.id} value={v.id}>{v.label}{v.unit ? ` · ${v.unit}` : ''}</option>)}
        </select>
      )}
      {APPLICATION_SECTIONS.map((section) => {
        const fields = section.fields.filter((f) => f.collect === 'app');
        if (!fields.length) return null;
        return (
          <fieldset key={section.id} className="mb-3">
            <legend className="text-[0.625rem] uppercase tracking-[0.25em] font-semibold" style={{ color: brand.accent }}>{section.title}</legend>
            {section.note && <p className="text-xs text-[#5A5751] mb-1" style={serif}>{section.note}</p>}
            {fields.map((f) => {
              const key = `${section.id}.${f.id}`;
              return (
                <label key={key} className="block text-xs text-[#5A5751] mb-2" style={serif}>
                  {f.label}{f.required ? ' *' : ''}
                  {f.type === 'yesno' ? (
                    <select value={values[key] || ''} onChange={set(key)} className="w-full text-sm border border-[#E8E4DC] px-2 py-2 bg-white">
                      <option value="">—</option><option value="no">No</option><option value="yes">Yes</option>
                    </select>
                  ) : (
                    <input
                      value={values[key] || ''} onChange={set(key)}
                      type={f.type === 'date' ? 'date' : f.type === 'email' ? 'email' : f.type === 'tel' ? 'tel' : 'text'}
                      className="w-full text-sm border border-[#E8E4DC] px-2 py-2"
                    />
                  )}
                  {f.help && <span className="text-[0.625rem] text-[#8A867E]">{f.help}</span>}
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
        className={`text-[0.625rem] uppercase tracking-wider px-3 py-2 border ${check.ok && name ? 'bg-[#2F5D50] text-white border-[#2F5D50]' : 'opacity-40 border-[#E8E4DC]'}`}
      >Send my application</button>
      {!check.ok && check.missing.length > 0 && (
        <p className="text-[0.625rem] text-[#8A867E] mt-1">Still needed: {check.missing.length} required field{check.missing.length === 1 ? '' : 's'}.</p>
      )}
    </div>
  );
}
