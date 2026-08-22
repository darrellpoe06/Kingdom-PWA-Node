// =============================================================================
// dm-notify — new-message awareness beyond the Messages tab (2026-08-22)
// =============================================================================
// Darrell: "do the users get notifications?" Measured: they did not — the only
// signal was the unread badge inside the Messages tab itself. This module is
// the first layer of the cure, everything the BROWSER can do without a push
// server: a "(N)" unread badge on the tab title, and a real browser
// Notification when a message arrives while the app is off-screen (permission
// asked only on a user gesture, in the Messages surface). The second layer —
// true phone push with the app fully closed (Web Push: VAPID keys minted on
// the NAS, a service-worker push handler, a sovereign sender) — is staged
// work; this layer ships today and degrades honestly where Notification
// doesn't exist.
//
// Occurrence-first here too: the underlying subscription's realtime stream is
// the trigger when healthy; a slow hidden-tab heartbeat (60s) is the net so a
// sick stream can't silence the doorbell entirely.

import { onAuthChange } from './supabase.js';
import { subscribeDirectMessages, unreadDmCount } from './direct-messages-sync.js';

const HIDDEN_HEARTBEAT_MS = 60000;

// Pure: should a Notification fire, and what does the title badge read?
// notify only when the unread count GREW while the app is hidden and the
// reader has granted permission — never on shrink, never while they watch.
export function notifyDecision(prevUnread, nextUnread, { hidden = false, permission = 'denied' } = {}) {
  return {
    notify: nextUnread > prevUnread && hidden && permission === 'granted',
    titleBadge: nextUnread > 0 ? `(${nextUnread}) ` : '',
  };
}

// Prefix the document title with the badge, restoring the clean base title
// when the badge clears. Idempotent; remembers the base on first touch.
export function applyTitleBadge(doc, badge) {
  if (!doc) return;
  if (doc.__ptBaseTitle == null) doc.__ptBaseTitle = String(doc.title || '').replace(/^\(\d+\) /, '');
  doc.title = `${badge}${doc.__ptBaseTitle}`;
}

// Start the app-wide watcher. Safe anywhere: no-ops without a window, follows
// sign-in/sign-out, and returns a stop function.
export function startDmNotifications(win = typeof window !== 'undefined' ? window : undefined) {
  if (!win) return () => {};
  let stopSub = null;
  let hiddenTimer = null;
  let prev = 0;
  const teardown = () => {
    if (stopSub) { try { stopSub(); } catch { /* noop */ } stopSub = null; }
    if (hiddenTimer) { clearInterval(hiddenTimer); hiddenTimer = null; }
  };
  const offAuth = onAuthChange((session) => {
    teardown();
    prev = 0;
    if (!session) { applyTitleBadge(win.document, ''); return; }
    stopSub = subscribeDirectMessages((rows) => {
      const next = unreadDmCount(rows);
      const d = notifyDecision(prev, next, {
        hidden: win.document?.visibilityState === 'hidden',
        permission: (win.Notification && win.Notification.permission) || 'denied',
      });
      applyTitleBadge(win.document, d.titleBadge);
      if (d.notify) {
        try {
          const n = new win.Notification('PoeTech — new message', {
            body: next === 1 ? 'You have 1 unread message.' : `You have ${next} unread messages.`,
            tag: 'poetech-dm',
          });
          n.onclick = () => { try { win.focus(); } catch { /* noop */ } };
        } catch { /* Notification constructor can throw in odd contexts — never break the app */ }
      }
      prev = next;
    });
    // The shared heartbeat deliberately sleeps while the app is hidden; the
    // doorbell is FOR the hidden state, so it rings on its own slow clock.
    hiddenTimer = setInterval(() => {
      if (win.document?.visibilityState === 'hidden') stopSub?.refresh?.();
    }, HIDDEN_HEARTBEAT_MS);
  });
  return () => { teardown(); if (typeof offAuth === 'function') offAuth(); };
}

// The user-gesture half: ask for permission (only ever from a click).
// Returns the resulting permission string, honestly 'denied' when the
// browser has no Notification at all.
export async function requestDmNotificationPermission(win = typeof window !== 'undefined' ? window : undefined) {
  const N = win && win.Notification;
  if (!N || typeof N.requestPermission !== 'function') return 'denied';
  try { return await N.requestPermission(); } catch { return 'denied'; }
}
