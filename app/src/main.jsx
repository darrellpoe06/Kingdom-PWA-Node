import React from 'react';
import ReactDOM from 'react-dom/client';
import { storage } from './shims/storage.js';
import './index.css';
import PoeFinancialSystem from './poe-financial-mvp-v28.jsx';

window.storage = storage;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <PoeFinancialSystem />
  </React.StrictMode>
);

// PWA service worker — registration + zero-click auto-update.
// - Registers /sw.js on window load so first paint isn't delayed.
// - When a new SW finishes installing (or one is already waiting on first
//   load), immediately posts SKIP_WAITING so it takes over without a tap.
//   The controllerchange listener then performs a one-time reload so the
//   browser picks up the fresh asset bundle.
// - The 'poetech:update-available' custom event still dispatches so the
//   UpdatePrompt banner remains a visible fallback for any edge case
//   where SKIP_WAITING fails or is suppressed.
// - window.__pwaReg keeps the registration handle for the banner's late-mount
//   safety check.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      window.__pwaReg = reg;

      // Tell the SW to take over now; the controllerchange handler reloads.
      const activateNow = (sw) => {
        try { sw.postMessage({ type: 'SKIP_WAITING' }); } catch (_) { /* noop */ }
      };

      // Case 1: a new SW was already waiting when the page loaded.
      if (reg.waiting && navigator.serviceWorker.controller) {
        window.dispatchEvent(new CustomEvent('poetech:update-available', { detail: { reg } }));
        activateNow(reg.waiting);
      }

      // Case 2: a new SW becomes available during this session.
      reg.addEventListener('updatefound', () => {
        const installing = reg.installing;
        if (!installing) return;
        installing.addEventListener('statechange', () => {
          if (installing.state === 'installed' && navigator.serviceWorker.controller) {
            window.dispatchEvent(new CustomEvent('poetech:update-available', { detail: { reg } }));
            activateNow(installing);
          }
        });
      });

      // When a new SW takes control, reload exactly once to load fresh assets.
      let reloaded = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (reloaded) return;
        reloaded = true;
        window.location.reload();
      });
    } catch (err) {
      console.warn('Service worker registration failed:', err);
    }
  });
}
