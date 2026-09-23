// =============================================================================
// sw-door-scope — the worker is registered AT THE DOOR, so the phone credits
// the app, not the browser
// =============================================================================
// Darrell, 2026-09-23, two screenshots of his Fold: the shade shows
//
//     Chrome · poetech...  8:04 AM
//     mrspoe06 sent you a message
//     In TLC Therapy Solutions. Open the app to read it.
//
// and the dock below it shows the PoeTech "P" icon with NO count while
// Messages carries a 1, a folder a 3, a third app an 11. "See PoeTech App at
// the bottom of the screen without a notification on it?!!!!!!! Why not?!"
//
// MEASURED FIRST, before a line was written (DR-0076):
//
//   1. The notification is attributed to CHROME. Android prints the app that
//      posted it; a notification posted by an installed web app carries that
//      app's name and icon. This one says Chrome, so the OS never handed it
//      to the PoeTech app at all, and a count on an icon can only come from
//      notifications the OS credits to that app.
//   2. `navigator.setAppBadge` — the API both dm-notify.js and sw.js call to
//      put a number on the icon — is NOT implemented on Android. MDN
//      browser-compat-data 8.1.2, api.Navigator.setAppBadge:
//        chrome_android: version_added false
//        samsunginternet_android: version_added false
//        webview_android: version_added false
//      (Chrome desktop 81, Safari iOS 16.4 for home-screen apps.) So on the
//      phone in the photo those two calls are no-ops, and the ONLY road to a
//      number on the "P" is (1): the OS must credit the notification to the
//      installed app.
//   3. main.jsx registered `/sw.js` with no scope, i.e. at the origin root
//      `/`. Every installable door's manifest declares a NARROWER scope
//      (`/poetech-app/`, `/lovecorner/app/`, `/tlc/`, ...). An installed web
//      app is credited with a notification when the service-worker
//      registration that shows it lies INSIDE the app's scope. A registration
//      at `/` lies inside none of them, so no door was ever credited — for a
//      family message, a church message, or this one. That is the whole gap,
//      and it is structural: it does not depend on which door the message
//      belongs to.
//
// THE CHANGE. The worker file stays `/sw.js` (one worker, one cache, one
// DOOR_PATHS list); it is registered with `scope` set to the door the page
// booted as — the same fact app-doors.js already answers for notifications
// and feedback. A page under `/poetech-app/` registers `{ scope:
// '/poetech-app/' }`, the church door `{ scope: '/lovecorner/app/' }`, and so
// on. That registration IS inside the installed app's scope, so the OS
// credits the notification to the app, the shade prints the app's name, and
// Samsung's launcher counts it on the icon. Pushes are per registration, so a
// device that already opted in under the root registration is MIGRATED: its
// subscription is re-created on the door registration with the same server
// key, its row is updated by endpoint (the same rotation the browser itself
// performs, which the sender already handles), and the root registration is
// then unsubscribed and unregistered so one phone never buzzes twice.
//
// PURE where it can be: `swScopeFor` decides the scope from a path; the
// migration takes the navigator and a row-updater as arguments, so the whole
// sequence is testable without a browser. Every failure path is a RESULT,
// never a throw — a phone that cannot migrate keeps its old registration and
// keeps being notified the old way; it is never left with nothing.
// =============================================================================

import { DOORS } from './app-doors.js';

/** The registration scope for the page at `pathname`: its door's path when
 *  the page is inside one, else the root (the pre-2026-09-23 behaviour, kept
 *  for any page served outside every door so it is never left uncontrolled). */
export function swScopeFor(pathname) {
  const p = String(pathname || '');
  let best = '';
  for (const d of DOORS) {
    if (p.indexOf(d.path) === 0 && d.path.length > best.length) best = d.path;
  }
  return best || '/';
}

/** True when `scope` (an absolute URL or a path) is the origin root — the
 *  legacy registration this module retires. */
export function isRootScope(scope, origin) {
  const s = String(scope || '');
  if (s === '/' ) return true;
  return !!origin && (s === origin + '/' || s === origin);
}

/**
 * Register the worker at the door's scope, then retire a root registration
 * left by earlier builds — carrying its push subscription across first.
 *
 * @param {object} opts
 * @param {Navigator} opts.navigator   the page's navigator (serviceWorker on it)
 * @param {Location}  opts.location    the page's location (pathname, origin)
 * @param {(fromEndpoint: string, sub: PushSubscription) => Promise<{ok:boolean, error?:string}>} [opts.moveRow]
 *        updates the device's push_subscriptions row from the old endpoint to
 *        the new subscription (endpoint + keys). Absent, the browser side still
 *        migrates and the row is left for the next opt-in / prune.
 * @returns {Promise<{ registration: ServiceWorkerRegistration|null, scope: string, migrated: {sub:boolean,row:boolean,unregistered:boolean, reason?:string}|null, error?: string }>}
 */
export async function registerDoorWorker({ navigator: nav, location, moveRow = null } = {}) {
  const sw = nav && nav.serviceWorker;
  const scope = swScopeFor(location && location.pathname);
  if (!sw || typeof sw.register !== 'function') return { registration: null, scope, migrated: null, error: 'no-service-worker' };

  let registration;
  try {
    registration = await sw.register('/sw.js', { scope });
  } catch (err) {
    return { registration: null, scope, migrated: null, error: String(err && err.message ? err.message : err) };
  }
  if (scope === '/') return { registration, scope, migrated: null };

  const migrated = await retireRootRegistration({ sw, registration, origin: location && location.origin, moveRow });
  return { registration, scope, migrated };
}

/**
 * Find a registration at the origin root, carry its push subscription to
 * `registration`, then unsubscribe and unregister it. Idempotent: with no root
 * registration it returns { reason: 'none' } and touches nothing.
 */
export async function retireRootRegistration({ sw, registration, origin, moveRow = null } = {}) {
  const out = { sub: false, row: false, unregistered: false };
  let regs;
  try {
    regs = typeof sw.getRegistrations === 'function' ? await sw.getRegistrations() : [];
  } catch {
    return { ...out, reason: 'list-failed' };
  }
  const root = (regs || []).find((r) => r && r !== registration && isRootScope(r.scope, origin));
  if (!root) return { ...out, reason: 'none' };

  const oldSub = await root.pushManager?.getSubscription?.().catch?.(() => null) ?? null;

  if (oldSub) {
    // The SAME server key: the sender signs with the private half of exactly
    // this pair, so the new subscription must be made against the same public
    // half or every send to it is rejected.
    const key = oldSub.options?.applicationServerKey || undefined;
    let newSub;
    try {
      newSub = await registration.pushManager.getSubscription();
      if (!newSub) {
        newSub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: key,
        });
      }
    } catch {
      // Cannot re-create the subscription on the door: keep the old one alive.
      // The person is still reachable the old way; nothing is torn down.
      return { ...out, reason: 'resubscribe-failed' };
    }
    out.sub = true;
    if (typeof moveRow === 'function') {
      try {
        const r = await moveRow(oldSub.endpoint, newSub);
        out.row = !!(r && r.ok);
      } catch { out.row = false; }
    }
    if (!out.row && typeof moveRow === 'function') {
      // The server still points at the OLD endpoint. Tearing the old
      // subscription down now would silence the phone until the next opt-in,
      // so leave both alive; the next boot retries the move.
      return { ...out, reason: 'row-move-failed' };
    }
    try { await oldSub.unsubscribe(); } catch { /* endpoint dies with the registration */ }
  }
  try {
    out.unregistered = !!(await root.unregister());
  } catch { out.unregistered = false; }
  return { ...out, reason: oldSub ? 'moved' : 'no-subscription' };
}

/**
 * The row move as a supabase call: the device's row is keyed by endpoint
 * (unique, 0170) and the update is allowed by the row's own owner policy
 * (push_subscriptions_update: auth.uid() = user_id). Pure over the client it
 * is handed, so the sequence above can be tested with a fake.
 */
export function rowMoverFor(supabase) {
  return async (fromEndpoint, sub) => {
    const json = typeof sub.toJSON === 'function' ? sub.toJSON() : sub;
    const keys = json.keys || {};
    if (!json.endpoint || !keys.p256dh || !keys.auth) return { ok: false, error: 'new subscription is incomplete' };
    // Signed out, RLS matches no row and the update reports "0 rows, no
    // error" — which would read as success and tear the old subscription
    // down while the server still points at it. So the session is checked
    // first, and the move is retried on the next signed-in boot instead.
    const { data: auth } = await supabase.auth.getSession();
    if (!auth || !auth.session) return { ok: false, error: 'not-signed-in' };
    const { data, error } = await supabase
      .from('push_subscriptions')
      .update({ endpoint: json.endpoint, p256dh: keys.p256dh, auth: keys.auth, last_seen_at: new Date().toISOString() })
      .eq('endpoint', fromEndpoint)
      .select('endpoint');
    if (error) return { ok: false, error: error.message };
    // Zero rows while signed in: the old endpoint was never saved (a
    // subscribe whose save failed). Nothing to move; the door subscription
    // is offered for saving by the readiness card as usual.
    return { ok: true, moved: Array.isArray(data) ? data.length : 0 };
  };
}
