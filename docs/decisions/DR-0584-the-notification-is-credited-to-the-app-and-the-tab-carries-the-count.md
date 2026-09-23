# DR-0584 — The notification is credited to the app, not the browser; the Messages tab carries the count; the collapsed header still names the door

- **Status:** accepted
- **Tier:** B (push plumbing on every installed phone; a migration of live push subscriptions; two chrome changes)
- **Type:** product + orchestration
- **Date:** 2026-09-23
- **Scope:** `app/src/lib/sw-door-scope.js` (new), `app/src/main.jsx` (registration), `app/public/sw.js` (header only), `app/src/components/shared.jsx` (`DmUnreadBadge`), `app/src/poe-financial-mvp-v28.jsx` (two existing lines; budget 5354 unchanged), `app/src/components/TextSizeControl.jsx` (`siteName`), `app/src/lib/development-class.js` (lesson 6 prose), tests `sw-door-scope.test.js`, `door-name-and-unread-count.test.jsx`
- **Principles:** VERIFICATION-DOCTRINE (DR-0076 — the cause is measured, the fix is proven-to-catch), REALITY-TRACE (DR-0061), SPEAK-ESTABLISHED-FACT (DR-0100), PERPETUAL-IMPROVEMENT (DR-0075), APP-IS-THE-PRIMARY-ARTIFACT (DR-0065)
- **Grounds:** Darrell 2026-09-23, three Fold screenshots in one sitting: *"Notice how the notifications go everywhere except on the app in my [dock] at the bottom with a 1 or 2 for notice of how many messages and that there is a new one"*; *"See PoeTech App at the bottom of the screen without a notification on it?!!!!!!! Why not?!!!!!!"*; *"Even though you see the actual prompt to go to one of the PoeTech App's... make sense?!"*; and, header tucked away on the church door: *"I believe we can still say the site's names when the header is hidden... still in the space available"*

## What was measured

| finding | evidence |
| --- | --- |
| the shade attributes the message notification to **Chrome**, not to PoeTech | screenshot: `Chrome · poetech…  8:04 AM · mrspo… · In TLC Therapy Solutions. Open the app to read it.` with the P avatar |
| the PoeTech icon in the dock carries **no count** while Messages, a folder and a third app carry 1 / 3 / 11 | screenshot, bottom dock |
| `navigator.setAppBadge` — what `lib/dm-notify.js` and `public/sw.js` call to badge the icon — is **not implemented on Android** | MDN browser-compat-data 8.1.2 (`@mdn/browser-compat-data`, fetched from the npm registry): `api.Navigator.setAppBadge` → `chrome_android: false`, `samsunginternet_android: false`, `webview_android: false`; Chrome desktop 81; Safari iOS 16.4 for home-screen apps |
| the worker was registered at the origin **root** | `app/src/main.jsx` (pre-change): `navigator.serviceWorker.register('/sw.js')` — no scope; `public/sw.js` header: "registers '/sw.js' at the DEFAULT scope '/'" |
| every installable door declares a **narrower** scope | `manifest.webmanifest` scope `/poetech-app/`; `manifest-tlc.webmanifest` scope `/tlc/`; DOORS in `app-doors.js` |
| the DM itself is not on hosted | `direct_messages` on hosted: 0 rows in 48 h — the writers moved to the box (DR-0442); the push was sent, the OS showed it under Chrome |

**The chain.** On Android a launcher count comes only from notifications the OS credits to the installed app, and the OS credits a notification to an installed web app only when the service-worker registration that shows it lies inside that app's manifest scope. A root registration lies inside none of the doors, so no message — family, church, therapy — was ever credited to any installed door, and the badge API that would have been the second road is a no-op on the phone in the photo. Both roads were closed; the shade said Chrome; the icon stayed blank. (The scope rule is Chrome's WebAPK notification delegation; this session could not fetch developer.chrome.com to quote it — egress blocked — so it is stated from the measured attribution above plus training knowledge, and the proof is the phone after deploy: the shade must say the app's name.)

## Decisions

1. **The one worker file is registered per door, at the door's scope.** `registerDoorWorker` (`lib/sw-door-scope.js`) registers `/sw.js` with `{ scope }` = the door the page booted in (`/poetech-app/`, `/lovecorner/app/`, `/tlc/app/`, …; the root only for a page outside every door, so nothing is left uncontrolled). The worker's handlers were already per-URL (DOOR_PATHS, DR-0444; FACE_SHELLS, #1405), so nothing in `sw.js` changes but its header.
2. **A root registration is retired without silencing the phone.** `retireRootRegistration` carries the root registration's push subscription to the door registration with the SAME `applicationServerKey`, moves the device's `push_subscriptions` row by endpoint (the row's own-owner UPDATE policy allows it; the same rotation the browser performs and the sender already handles), and only then unsubscribes and unregisters the root. If the row cannot be moved (signed out, network) or the door cannot subscribe, NOTHING is torn down — the old road keeps ringing and the next boot retries. Every branch is a result, never a throw; proven-to-catch in `sw-door-scope.test.js`.
3. **The Messages tab carries the count.** `DmUnreadBadge` (shared.jsx) listens to the one DM subscription the app-wide watcher owns (`DM_UNREAD_EVENT`, as LifeHub and AppAlerts already do), draws nothing until it has heard a real count, and rides the existing nav-entry line — the shell stays at 5354 lines.
4. **The collapsed header still names the door.** `TextSizeEscapeHatch` takes `siteName`; the shell passes the same value its wordmark shows (`churchBrand ? 'The Love Corner' : 'PoeTech'`), on the existing mount line.
5. **Lesson 6 of the development course stays true.** Its prose said the worker "registers at the root"; it now says it did, and why the root was retired, and its pin follows `registerDoorWorker`.

## What this does NOT claim

- The count on the icon will be the **number of notifications shown**, counted by Samsung's launcher (its "app icon badges" setting must be on for the app, as it is for the apps in the photo) — not the unread-DM count. The in-app count on the Messages tab is the unread-DM count.
- A message from a door the phone has NOT installed (a TLC thread on a phone with only PoeTech installed) is shown by the PoeTech door's worker and credited to PoeTech; tapping it opens `/tlc/app/…` per DR-0444. That is correct and said here so nobody reads it as drift.
- iOS is unaffected (setAppBadge there is real and stays).

## Verification after deploy (DR-0104 — the live push, on his phone)

1. Open the installed PoeTech app once (boot migrates the registration; the console line `Service worker registration failed` must NOT appear).
2. Have a family member send a DM. **Expected:** the shade shows **PoeTech** (or The Love Corner) as the app, with the app icon; the dock icon shows a count; the Messages tab shows the unread number; opening the thread clears it.
3. If the shade still says Chrome: the app in the dock is a plain shortcut, not an installed app — reinstall via Chrome's "Install app" from `poetech.us/poetech-app/`. `re-review: 2026-09-26` on this record either way.
