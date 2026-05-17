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

// PWA: register the service worker once the page has loaded so it doesn't
// compete with first paint. The SW makes the app installable on Android
// Chrome / Edge and offline-capable on first revisit.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('Service worker registration failed:', err);
    });
  });
}
