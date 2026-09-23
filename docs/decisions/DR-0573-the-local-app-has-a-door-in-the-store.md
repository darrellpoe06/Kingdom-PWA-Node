# DR-0573 — The local app has a door in the store

- **Status:** accepted
- **Tier:** B (an in-app door to a package the family's own lane builds; sideload-testing, same posture as the TWA door)
- **Type:** feature
- **Date:** 2026-09-23
- **Scope:** `app/functions/store/apk/[brand].js` (`<brand>-local.apk` → the `android-native-latest` shelf; `shelfFor`); `app/src/lib/app-store.js` (`apkLocal`, `packageIdLocal`, `LOCAL_APP_NOTE`, `INSTALL_STEPS.local`); `app/src/components/AppStore.jsx` (the "Try the local app" button and its note); `.github/workflows/native-shell.yml` (the `shelf` gate job); `app/src/__tests__/the-local-app-has-a-door-in-the-store.test.js` (11 checks, new)
- **Principles:** APP-IS-PRIMARY (DR-0065), VERIFICATION-DOCTRINE (DR-0076 — a button exists only because the shelf was read), DR-0570 (both lanes are kept), DR-0313 (a store row is a promise), ANXIETY-CLARITY
- **Grounds:** DR-0570's queue item 2 — *"Surface it in the app… a 'local app (beta)' door appears there only once the shelf holds a real package — an in-app button to a 404 is the defect the shelf gate exists to catch."* The shelf was read on 2026-09-23 after `native-shell.yml` run 3 (`35805849172`): five of five packages present, each verified by `aapt2` in the lane, two downloaded and compared (distinct hashes, the bundle inside, the door script where `brands.json` puts it).

---

## What opened

The PoeTech App Store already offers each brand's **Android app** (the TWA package from `android-latest`) through the same-origin door `/store/apk/<brand>.apk`. It now offers, beside it, **the local app**: `/store/apk/<brand>-local.apk`, served by the same Pages Function from the native lane's own shelf `android-native-latest`, under the `<packageId>.local` id the lane builds — so both install on one phone.

One door, two shelves, one allowlist: the suffix chooses the shelf; the brand must still be one of the five; no user input reaches the upstream URL. An empty shelf still answers *"No Android package has been published… the site is fine"* rather than a gateway error (the 2026-08-28 lesson).

## What the surface says

The button reads **Try the local app**, and its note is three sentences — what, why, limit — because the reader decides before tapping:

- *What:* the whole app inside the package; it opens from the phone, not from the website.
- *Why:* installs beside the Android app under its own name, so you can try it without losing anything.
- *Limit:* new, sideload-testing; sign in with email and password; Google sign-in and notifications are not in it yet.

Nothing in that note is a promise the shelf has not kept, and the limit names the two things DR-0570 recorded as not built (a WebView refuses Google's OAuth; an Android WebView has no web push).

## The gate that keeps the promise

`native-shell.yml` now carries the same `shelf` job the TWA lane has: after every brand builds, it reads `android-native-latest` and fails the run if any brand the store lists has no `<brand>-native.apk` on it. A store that lists what it cannot deliver is the defect; a green build that leaves one missing is the lie.

## Verification

- 11 checks: the door serves both lanes through one allowlist and rejects `evil-local`, `-local`, a doubled suffix and a path; the local lane reads its own shelf and the TWA lane the original; a fetched local asset comes back as an APK with an exact length and `<brand>-local.apk` as its filename; an empty shelf says so; every store row's `apkLocal` walks through the door and its `packageIdLocal` equals the id `brands.json` builds *and* the TWA id plus `.local`; the shelf the door reads is the shelf the lane uploads to; the lane carries the gate; the rendered surface shows a local button for every brand pointing through the door **and** still shows the Android button for every brand (both lanes kept); the note carries what, why and limit.
- The existing store-door and store-render suites still pass unchanged — the TWA door's behaviour is byte-for-byte what it was.

## Limits, stated

1. **The phone has not been read yet.** DR-0570's item 1 is met on the build side and the shelf side; installing one local app beside its TWA on Darrell's phone, booting from the device, and a NAS route answering from inside the shell is still the next report. `re-review: 2026-09-25`.
2. **The local app carries no native capability yet** — it is the same app served from the device. The bridge key provisioned by the shell is the first plugin (DR-0570 item 3). `re-review: 2026-10-01`.
