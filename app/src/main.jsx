import React from 'react';
import ReactDOM from 'react-dom/client';
import { storage } from './shims/storage.js';
import './index.css';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import { wireUpdates, startUpdateChecks } from './lib/sw-update.js';
import { wireChunkHeal } from './lib/chunk-reload-heal.js';
import { showBootFallback } from './lib/boot-fallback.js';
import { installGlobalErrorCapture } from './lib/error-journal.js';
import { initTextSize } from './lib/text-size.js';
import { wireDatePickerTap } from './lib/date-picker-tap.js';

window.storage = storage;

// Self-heal a stale-deploy lazy-chunk 404 (e.g. opening the Voice tab after a newer
// deploy replaced its chunk hash): on a failed dynamic import, recover once to the
// current shell instead of stranding the tab. No-op unless a chunk actually fails.
// Wired before the dynamic imports below so the listener is live when they run.
wireChunkHeal(window);

// Record every uncaught error + unhandled rejection to the device-local error
// journal (DR-0092) — the failure stays visible to the steward on the Quality &
// Throughput board instead of dying as one console line. Watching only; the
// handlers can never throw. Wired first so boot-time failures are captured too.
installGlobalErrorCapture(window);

// Large-print accessibility (WCAG 1.4.4): apply the per-device text-size choice
// BEFORE React paints, so there is no flash of default text that then jumps.
// Runs for the full app AND every standalone boot below — the conference page a
// senior opens is already large if they set it large. See lib/text-size.js.
initTextSize();

// Tap a date field → the CALENDAR opens right away (no segment typing). One
// delegated listener covers every date/datetime field on every surface and
// every standalone boot, current and future. See lib/date-picker-tap.js.
wireDatePickerTap();

// Lightweight boots by URL param (outside the full app):
//   ?join=1     — the public "get the app / I'm having trouble" capture. A shareable
//                 link Darrell can text to church folks who are struggling to install.
//   ?invites=1  — the admin invite list (Darrell + Christina only; RLS-gated).
//   ?register=1 — the public, no-login CONFERENCE registration. A leader texts this
//                 to the congregation; anyone registers in seconds, no account.
//   ?audience=1 — the projected class screen the presenter pops onto the projector.
//   ?output=1   — the NDI-ready PROGRAM OUTPUT screen OBS ingests as a Browser Source
//                 (DistroAV republishes it as an NDI source on the church LAN). Useful
//                 standalone via params, e.g. ?output=1&kind=scripture&ref=John%203:16.
//                 ?key=1 / a lower-third payload renders transparent for switcher keying.
//   ?teach=1    — the presenter view standalone (a quick entry / fallback to the
//                 in-app Governor button). The full PWA never loads in these modes —
//                 the heavy app (and its supabase/auth init) is dynamically imported
//                 ONLY for the normal branch, so the projected window students see
//                 stays a lean, no-auth slide renderer.
//   ?login=1    — the simple email+password "create your profile / sign in" page,
//                 standalone. A building block + a verifiable surface; the access
//                 gate below wires it as the primary in-app sign-in.
//   ?request-space=1 — the public, no-login "request a space" form for COMMUNITY
//                 use of the campuses (funerals / weddings / gatherings).
//   ?room=CODE  — "Game Night" multiplayer: the shared-screen game room. The big
//                 screen opens ?room=CODE&board=1 (board + host); phones scan the
//                 QR it shows and open ?room=CODE (a player's controller). A lean
//                 boot like the others — the full PWA never loads here.
const __params = new URLSearchParams(window.location.search);
const __standalone = __params.get('join') === '1' || __params.get('invites') === '1'
  || __params.get('register') === '1' || __params.get('audience') === '1'
  || __params.get('output') === '1'
  || __params.get('teach') === '1' || __params.get('login') === '1'
  || __params.get('request-space') === '1'
  || __params.get('share') === '1'
  || __params.get('moore') === '1'
  || !!__params.get('room')
  || __params.get('oauth_popup') === '1';
const __root = ReactDOM.createRoot(document.getElementById('root'));
if (__params.get('oauth_popup') === '1') {
  // We ARE the Google sign-in popup (see lib/oauth-popup.js). The session was
  // parsed out of the URL fragment by supabase on import; tell the opener and
  // close. The full PWA never loads here — this window exists only to complete
  // OAuth and vanish, so the user keeps their place in the opener tab.
  __root.render(
    <React.StrictMode>
      <div className="min-h-screen flex items-center justify-center p-6 text-center" style={{ fontFamily: '"Fraunces", serif' }} aria-live="polite">
        <p className="text-sm text-[#5A5751]">Signing you in… you can close this window.</p>
      </div>
    </React.StrictMode>
  );
  import('./lib/oauth-popup.js').then(({ completeOAuthPopup }) => { completeOAuthPopup(); }).catch(() => {});
} else if (__params.get('join') === '1') {
  // Each standalone boot dynamically imports ONLY its own component so the
  // always-loaded entry chunk (index.js) no longer carries every boot surface
  // (and the supabase/auth client several of them pull). This realizes the
  // design stated below: supabase/auth init loads for the normal branch (the
  // monolith) — not on every visit via an eagerly-imported boot. See header.
  import('./components/AppInterestCapture.jsx').then(({ default: AppInterestCapture }) => {
    __root.render(<React.StrictMode><ErrorBoundary><div className="min-h-screen p-4 sm:p-8"><AppInterestCapture source="join-link" /></div></ErrorBoundary></React.StrictMode>);
  }).catch((err) => { console.warn('join boot failed:', err); showBootFallback(document.getElementById('root'), { error: err }); });
} else if (__params.get('invites') === '1') {
  import('./components/AppInterestAdmin.jsx').then(({ default: AppInterestAdmin }) => {
    __root.render(<React.StrictMode><ErrorBoundary><AppInterestAdmin /></ErrorBoundary></React.StrictMode>);
  });
} else if (__params.get('register') === '1') {
  import('./components/ConferenceRegister.jsx').then(({ default: ConferenceRegister }) => {
    __root.render(<React.StrictMode><ErrorBoundary><ConferenceRegister /></ErrorBoundary></React.StrictMode>);
  });
} else if (__params.get('audience') === '1') {
  import('./components/AudienceWindow.jsx').then(({ default: AudienceWindow }) => {
    __root.render(<React.StrictMode><ErrorBoundary><AudienceWindow /></ErrorBoundary></React.StrictMode>);
  });
} else if (__params.get('output') === '1') {
  // NDI-ready program output: OBS ingests this as a Browser Source; DistroAV
  // republishes it as an NDI source on the church LAN. Lazy-imported like every
  // boot so the entry chunk stays lean. See lib/ndi-output.js for the contract.
  import('./components/NdiProgramOutput.jsx').then(({ default: NdiProgramOutput }) => {
    __root.render(<React.StrictMode><ErrorBoundary><NdiProgramOutput /></ErrorBoundary></React.StrictMode>);
  });
} else if (__params.get('teach') === '1') {
  // Standalone presenter (fallback to the in-app Governor button, which passes the
  // confirmed date). It can't read app state, so an optional ?start=YYYY-MM-DD lets
  // the real cohort date ride the URL; absent that it falls back to the published
  // proposal. The in-app button remains the authoritative entry.
  const __start = __params.get('start') || undefined;
  import('./components/TeachMode.jsx').then(({ default: TeachMode }) => {
    __root.render(<React.StrictMode><ErrorBoundary><TeachMode cohortStart={__start} onClose={() => window.close()} /></ErrorBoundary></React.StrictMode>);
  });
} else if (__params.get('login') === '1') {
  import('./components/PasswordAuth.jsx').then(({ default: PasswordAuth }) => {
    __root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <div className="min-h-screen flex items-start justify-center p-6 sm:p-12">
            <PasswordAuth onSignedIn={() => { window.location.search = ''; }} />
          </div>
        </ErrorBoundary>
      </React.StrictMode>
    );
  }).catch((err) => { console.warn('login boot failed:', err); showBootFallback(document.getElementById('root'), { error: err }); });
} else if (__params.get('request-space') === '1') {
  import('./components/VenueRequest.jsx').then(({ default: VenueRequest }) => {
    __root.render(<React.StrictMode><ErrorBoundary><VenueRequest /></ErrorBoundary></React.StrictMode>);
  });
} else if (__params.get('share') === '1') {
  // Full-screen "scan to get the app" poster for a projector/screen — a whole
  // room scans one big QR. No account/data/auth; only displays the join URL.
  import('./components/SharePoster.jsx').then(({ default: SharePoster }) => {
    __root.render(<React.StrictMode><ErrorBoundary><SharePoster /></ErrorBoundary></React.StrictMode>);
  }).catch((err) => { console.warn('share boot failed:', err); showBootFallback(document.getElementById('root'), { error: err }); });
} else if (__params.get('moore') === '1') {
  // The Moore Divahs public door — the branded family-of-businesses app Shay
  // shows clients (Darrell 2026-07-07). Her brand first; PoeTech + the family
  // businesses behind it. Public faces only; captures ride forced-safe RPCs
  // with source='moore-divahs-app'. Lean boot like the others.
  import('./components/MooreDoor.jsx').then(({ default: MooreDoor }) => {
    __root.render(<React.StrictMode><ErrorBoundary><MooreDoor /></ErrorBoundary></React.StrictMode>);
  }).catch((err) => { console.warn('moore boot failed:', err); showBootFallback(document.getElementById('root'), { error: err }); });
} else if (__params.get('room')) {
  // "Game Night" multiplayer room. GameRoom reads ?room / ?board off the URL and
  // renders the big-screen board (host) or a phone controller. Lazy-imported so
  // the entry chunk stays lean; supabase loads here for the realtime channel, but
  // the heavy monolith never does.
  import('./components/games/GameRoom.jsx').then(({ default: GameRoom }) => {
    __root.render(<React.StrictMode><ErrorBoundary><GameRoom /></ErrorBoundary></React.StrictMode>);
  });
} else {
  // Conference funnel: a registrant who chose "create an account" via Google was
  // redirected away and lands back HERE (the OAuth redirect strips ?register=1).
  // Claim their parked conference registration as soon as a session is available,
  // so the one-time attendee's registration carries into their new app membership.
  // No-op when nothing is parked. Self-contained; does not touch the monolith.
  import('./lib/conference-link.js').then(({ wirePendingConferenceLink }) => { wirePendingConferenceLink(); }).catch(() => {});

  // Full app, dynamically imported so the lightweight capture/admin/present boots
  // above never pull the entire PWA (+ its supabase/auth init) they don't need.
  import('./poe-financial-mvp-v28.jsx').then(({ default: PoeFinancialSystem }) => {
    __root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <PoeFinancialSystem />
        </ErrorBoundary>
      </React.StrictMode>
    );
  }).catch((err) => {
    // The main bundle failed to load (a skewed/partial deploy the chunk-heal
    // couldn't recover). React never mounted, so there is no ErrorBoundary —
    // show the plain-DOM retry screen instead of a blank white page. The
    // chunk-heal may still reload underneath us; whichever lands first wins.
    console.warn('PoeTech main bundle failed to boot:', err);
    showBootFallback(document.getElementById('root'), { error: err });
  });
}

// PWA service worker — registration + zero-click auto-update. The lifecycle
// wiring (skip-waiting the new worker, reload exactly once on a real controller
// swap, never on first-install claim, surface the UpdatePrompt banner) lives in
// lib/sw-update.js so it can be locked by an exhaustive node-env test. See that
// file's header for the root-cause writeup of the "Reload to update did nothing"
// bug. window.__pwaReg keeps the registration handle for the banner's late mount.
// Skipped in every standalone boot — a zero-click update reload must not interrupt
// someone mid-form (?join), wipe the admin's place (?invites), drop a registrant
// (?register), or fire a controller-swap reload inside the projector / presenter
// window during a live class (?audience / ?teach). Those windows opt out entirely.
if (!__standalone && 'serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      window.__pwaReg = reg;
      wireUpdates(reg, navigator, window);
      startUpdateChecks(reg, window, navigator);
    } catch (err) {
      console.warn('Service worker registration failed:', err);
    }
  });
}
