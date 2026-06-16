import React from 'react';
import ReactDOM from 'react-dom/client';
import { storage } from './shims/storage.js';
import './index.css';
import AppInterestCapture from './components/AppInterestCapture.jsx';
import AppInterestAdmin from './components/AppInterestAdmin.jsx';
import ConferenceRegister from './components/ConferenceRegister.jsx';
import AudienceWindow from './components/AudienceWindow.jsx';
import TeachMode from './components/TeachMode.jsx';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import { wireUpdates, startUpdateChecks } from './lib/sw-update.js';

window.storage = storage;

// Lightweight boots by URL param (outside the full app):
//   ?join=1     — the public "get the app / I'm having trouble" capture. A shareable
//                 link Darrell can text to church folks who are struggling to install.
//   ?invites=1  — the admin invite list (Darrell + Christina only; RLS-gated).
//   ?register=1 — the public, no-login CONFERENCE registration. A leader texts this
//                 to the congregation; anyone registers in seconds, no account.
//   ?audience=1 — the projected class screen the presenter pops onto the projector.
//   ?teach=1    — the presenter view standalone (a quick entry / fallback to the
//                 in-app Governor button). The full PWA never loads in these modes.
const __params = new URLSearchParams(window.location.search);
const __standalone = __params.get('join') === '1' || __params.get('invites') === '1'
  || __params.get('register') === '1' || __params.get('audience') === '1'
  || __params.get('teach') === '1';
const __root = ReactDOM.createRoot(document.getElementById('root'));
if (__params.get('join') === '1') {
  __root.render(<React.StrictMode><ErrorBoundary><div className="min-h-screen p-4 sm:p-8"><AppInterestCapture source="join-link" /></div></ErrorBoundary></React.StrictMode>);
} else if (__params.get('invites') === '1') {
  __root.render(<React.StrictMode><ErrorBoundary><AppInterestAdmin /></ErrorBoundary></React.StrictMode>);
} else if (__params.get('register') === '1') {
  __root.render(<React.StrictMode><ErrorBoundary><ConferenceRegister /></ErrorBoundary></React.StrictMode>);
} else if (__params.get('audience') === '1') {
  __root.render(<React.StrictMode><ErrorBoundary><AudienceWindow /></ErrorBoundary></React.StrictMode>);
} else if (__params.get('teach') === '1') {
  __root.render(<React.StrictMode><ErrorBoundary><TeachMode onClose={() => window.close()} /></ErrorBoundary></React.StrictMode>);
} else {
  // Full app, dynamically imported so the lightweight capture/admin boots above
  // never pull the entire PWA (+ its supabase/auth init) they don't need.
  import('./poe-financial-mvp-v28.jsx').then(({ default: PoeFinancialSystem }) => {
    __root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <PoeFinancialSystem />
        </ErrorBoundary>
      </React.StrictMode>
    );
  });
}

// PWA service worker — registration + zero-click auto-update. The lifecycle
// wiring (skip-waiting the new worker, reload exactly once on a real controller
// swap, never on first-install claim, surface the UpdatePrompt banner) lives in
// lib/sw-update.js so it can be locked by an exhaustive node-env test. See that
// file's header for the root-cause writeup of the "Reload to update did nothing"
// bug. window.__pwaReg keeps the registration handle for the banner's late mount.
// Skipped in the standalone capture/admin boots — a zero-click update reload must
// not interrupt someone mid-form (?join) or wipe the admin's place (?invites).
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
