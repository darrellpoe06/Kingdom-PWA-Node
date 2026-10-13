# DR-0570 — The local app carries the house's address: the native shell lane opens, and both lanes are kept

- **Status:** accepted
- **Tier:** B for the in-repo lane (a dispatch-only build, its own shelf, its own package ids — nothing the family installs today changes); **Tier C for every outward step** (a store listing, replacing the TWA under its id, a plugin that touches money or identity)
- **Type:** architecture
- **Date:** 2026-09-23
- **Scope:** `app/src/lib/native-shell.js` (new); `app/src/main.jsx` (installs the shell first; no service worker inside it); `app/vite.config.js` (`PT_NATIVE_SHELL=1` builds at base `/`); `app/native/brands.json` + `app/native/stage.mjs` (new); `.github/workflows/native-shell.yml` (new, dispatch-only); `app/package.json` (`@capacitor/{core,cli,android}` 8.5.2 as devDependencies); `app/.gitignore`; `app/src/__tests__/the-local-app-carries-the-house-address.test.js` (30 checks, new)
- **Principles:** APP-IS-PRIMARY (DR-0065), THREE-BRAKES, VERIFICATION-DOCTRINE (DR-0076), REALITY-TRACE (DR-0061), DR-0218 (zero-n8n; relative transports), DR-0258 (disjoint install scopes), DR-0236 (nothing waits)
- **Grounds:** Darrell 2026-09-22 — *"Why does the health matter?!!! Can't we build it to work independently?"* → *"Let's make it a feature of downloading the app?!"* → *"As a matter of fact all the bells and whistles come from a local download?"* → **"Let's do the native shell"** → **"Too!"** → **"Don't undermine what we have however let's invest time and energy in our own local app... makes the most sense"** → 2026-09-23: **"We don't have to pick either or... just need to plan for both"**

---

## The measured ground

1. **The Android app today is a TWA.** `.github/workflows/android-package.yml:7` — *"a REAL Android package (TWA via Bubblewrap) from the live manifest"* — five brands (`us.poetech.app`, `.lovecorner`, `.tlc`, `.properties`, `.moore`), signed with the store key held encrypted at `store/android.keystore.enc`, published to the rolling `android-latest` release, served in-app from `/store/apk/<brand>.apk`. A TWA opens **the live site** in a browser tab without chrome. It gives the phone **nothing the browser does not already give it** — which is exactly the wall the voice chain hit the same evening: the family bridge key is per-device, lives in `localStorage`, and there is no way for the site to provision it (DR-0569).
2. **No Capacitor, no native project, anywhere in the repo** before this record (`app/package.json` had no `@capacitor/*`; no `android/` directory).
3. **The web build is one layout seen from one door.** Vite builds at `base: '/poetech-app/'`; `dist/` is published at the **site root** and `_redirects` rewrites `/poetech-app/*` onto it (`app/public/_redirects`). The MPA faces (`lovecorner/app/`, `moore/app/`, `tlc/app/`, `properties/app/`) are their own served HTML at the root (DR-0258).
4. **The NAS is reached by same-origin routes** — `/n8n`, `/voice`, `/api/*`, `/llm/chat`, `/nas-photos`, `/ways`, `/store/apk`, `/scribe`, `/reviews`, `/sb`, `/poetech-app/taxes` — answered by Cloudflare Pages Functions under `app/functions/`. The constants are relative on purpose (DR-0218; the absolute Funnel URL throttles cross-origin). Supabase is **already absolute**: `VITE_SUPABASE_URL = https://poetech.us/sb` (`auth-providers.js:75`).
5. **Capacitor's local server**, read from source (`@capacitor/android … WebViewLocalServer.java:425`): an extension-less path is routed to the **root** `index.html` (html5mode), never to a folder's. `native-bridge.js:469–481`: with `CapacitorHttp` enabled, `window.fetch` is patched so a URL under the local server passes to the real fetch and **any other URL goes through native HTTP** — no browser origin check.
6. **`dist/` is 46 MB** (assets 28 MB, the KJV corpus 16 MB). One copy in the package; a second copy for the `/poetech-app/` prefix would have doubled it, which is why the native build is at base `/` rather than staged twice.

## Decision — two lanes, both whole

**Neither lane replaces the other.** The TWA lane is untouched: same workflow, same shelf, same ids, same in-app store buttons. The native lane is built **beside** it under its own ids (`<twa id>.native`) and its own shelf (`android-native-latest`), so both can be installed on one phone while the local app soaks. Cutting the TWA over to the native app under the original id is a **separate, dated decision** (below) — not a side effect of this one.

The native lane:

- **Builds the SAME app** with `PT_NATIVE_SHELL=1 npm run build` → base `/`. The env unset is the web build, byte-for-byte. The base is used in exactly two places in `vite.config.js` so the two builds cannot drift.
- **Stages one brand** (`native/stage.mjs <brand>`): copies `dist/` to `native/www/<brand>/`, and for a brand that does not start at `/` injects one line into the root `index.html` that sends the **bare first load only** (root path, no query) to the brand's own served HTML — named as a **file**, because of fact 5. Writes `capacitor.config.json` with `CapacitorHttp` on and `androidScheme: https` (the bridge key and the voice sample stay on a secure origin, as on the web).
- **Carries the house's address** (`src/lib/native-shell.js`): inside the shell — decided by the runtime the shell injects (`window.Capacitor.isNativePlatform()`), never a build flag — `window.fetch` is wrapped so every same-origin house route is re-homed to `https://poetech.us` before it leaves; local files never match and reach the device's own server. The modules keep saying `/n8n`; the shell knows where the house is. The route list is compared to `app/functions/` on disk **in both directions** by the test, so a Pages Function added tomorrow that the shell cannot reach fails today.
- **Registers no service worker** inside the shell — the shell *is* the offline shell.
- **Proves what it built**: `aapt2 dump badging` on the real APK must show the brand's `.native` id and the run-number version before anything is published.

## Why this shape and not the two others

- **Not `server.url` (remote content in a Capacitor WebView).** That is the TWA in a different coat — the bundle would still come from the site, and "all the bells and whistles come from a local download" would be false.
- **Not a rewrite of the ten transport constants to absolute URLs.** It would touch ten modules and their pins for a property only the shell needs, and it would re-open the DR-0218 question on the web. One wrapper at boot, on the shell only, leaves the web exactly as it was.

## What is NOT claimed

- **No APK has been built by this lane yet.** The scaffold was exercised locally end-to-end short of Gradle (build at base `/` → stage → `cap add android` → `cap sync`; the bundle landed at `android/app/src/main/assets/public/index.html`, `applicationId "us.poetech.lovecorner.native"`), and the sandbox has no Android SDK. The first `native-shell.yml` run is the proof; until it is green this record says *scaffolded*, not *shipping*.
- **No native capability is added yet.** Phase 1 is the shell proving it runs the app from the device. The first plugin is the reason the lane exists — see the queue.
- **iOS is not built.** Capacitor generates an iOS project the same way, but building it needs a Mac and an Apple account (DR-0152's known blocker). Planned, not pretended.
- **Google sign-in in an embedded WebView** is refused by Google; email / password and magic link are unaffected. A Browser-plugin + deep-link route is a phase-2 item.
- **Web push does not exist in an Android WebView**; notifications inside the shell need FCM (a phase-2 plugin). The web stack's `isSupported` checks already degrade honestly.

## The queue (same lane, dated)

1. **Run the lane; read the shelf.** Dispatch `native-shell.yml`, install one brand beside its TWA on Darrell's phone, and record: boots from the device, a NAS route answers from inside the shell, both apps coexist. `re-review: 2026-09-25`.
2. **Surface it in the app.** The PoeTech App Store (`app-store.js`) offers the TWA packages; a "local app (beta)" door appears there **only once the shelf holds a real package** — an in-app button to a 404 is the defect the shelf gate exists to catch. Same session as item 1's green run. `re-review: 2026-09-25`.
3. **The first native capability: the bridge key provisioned by the shell.** The per-device key is the link the evening's chain was missing (DR-0569 limit 1). The shell can hold it in native secure storage and hand it to the WebView origin, provisioned from a signed-in family device by QR or link — the thing the browser cannot do. `re-review: 2026-10-01`.
4. **Local voice.** Whisper / the voice studio on the device (Darrell: *"Python using the voice recording as the algorithm on the device?"*) — a native plugin, sized after item 3. `re-review: 2026-10-08`.
5. **Cut-over decision.** Whether the native app takes the TWA's id (installs as an *update* over it under the same store key) or stays beside it — decided on the soak's evidence, never by default. `re-review: 2026-10-15`.
6. **The sw-version-stamp plugin reads `dist/sw.js` by a fixed path** and throws under any other `--outDir` (found while proving the build). Harmless to both lanes (both use `dist`); a one-line `outDir` read when next touched. `re-review: 2026-10-15`.

> **Amended 2026-09-23 (DR-0571):** the id suffix written above as `<twa id>.native` shipped, ran once, and failed on all five brands — `native` is a Java keyword and an Android namespace is a Java package. The suffix is **`.local`** (`us.poetech.app.local`, `us.poetech.lovecorner.local`, …); every other sentence in this record stands. The finding and the keyword pin are DR-0571's.

## Verification

- 30 new checks, green: the web untouched (no install without the runtime; base default; TWA workflow and shelf unmentioned; Capacitor never in `dependencies`); the fault reproduced (a relative route resolved from the device); every transport re-homed with its query; local files, absolute URLs and non-http schemes untouched; prefix vs file matching; `Request` and `URL` inputs; idempotent install; the route list equal to `app/functions/` both ways; main.jsx order and the service-worker skip; store / matrix / brands table equality; ids distinct, `.native`-suffixed, paired to the TWA id; every start page an existing HTML file; the door script's first-load-only rule and single injection; the three brakes and the verify-before-publish order in the workflow.
- Local proof short of Gradle, as stated above.
