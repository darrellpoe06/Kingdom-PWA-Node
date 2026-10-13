// =============================================================================
// app-store — the PoeTech family's OWN app store record (Darrell 2026-07-23)
// =============================================================================
// "Let's put the installation and instructions inside the PoeTech App build and
// others so we all can do that like our own app store." The apps of the
// build family (DR-0313 added Poe Properties as the fifth), each with BOTH install paths:
//   · PWA — open the app's own link, Chrome menu → Install (the web path);
//   · Android package — the real .apk the TWA lane builds (DR-0227: four
//     packages, own task/icon/resume; immune to the shared-scope wall), served
//     SAME-ORIGIN from our own door (/store/apk/<brand>.apk — the Pages
//     Function that buffers the rolling `android-latest` release asset with an
//     exact Content-Length). Measured 2026-07-23: the direct GitHub link's
//     redirect chain stranded Chrome-on-Android at 100% and the installer
//     never fired; one clean same-origin response is the perpetual fix.
// Every field mirrors the REAL brand records (manifests, entry pages, DR-0227
// matrix) — nothing invented; renaming a brand updates here with its record.
// The upstream shelf the same-origin door reads (kept exported as the source
// of truth the TWA lane publishes to).
export const APK_RELEASE_BASE = 'https://github.com/darrellpoe06/Kingdom-PWA-Node/releases/download/android-latest';
// The door the store links: our origin, no redirect chain, exact byte count.
export const APK_DOOR_BASE = '/store/apk';

// THE LOCAL APP'S DOOR (DR-0570 / DR-0573). Beside every TWA package there is
// now a LOCAL app: the same Vite app bundled INSIDE the package by
// native-shell.yml, under `<packageId>.local`, so both can be installed on
// one phone. Its door is `/store/apk/<brand>-local.apk`, served by the same
// Pages Function from its own shelf (`android-native-latest`). The button
// appears in the store only because the shelf holds a real package for every
// brand -- read from the shelf on 2026-09-23 (run 35805849172), five of five --
// and the door answers "not published yet" rather than a gateway error if a
// shelf is ever empty again.
export const APK_LOCAL_SUFFIX = '-local';

export const APP_STORE = [
  {
    key: 'poetech', name: 'PoeTech Family OS', short: 'PoeTech',
    blurb: 'Life, Soul & Money — the family operating system. Books, Debts, Real Estate, Church, Learn, and every module in one app.',
    icon: '/icon-192.png',
    webUrl: 'https://poetech.us',
    apk: `${APK_DOOR_BASE}/poetech.apk`,
    packageId: 'us.poetech.app',
    apkLocal: `${APK_DOOR_BASE}/poetech${APK_LOCAL_SUFFIX}.apk`,
    packageIdLocal: 'us.poetech.app.local',
  },
  {
    key: 'lovecorner', name: 'The Love Corner', short: 'Love Corner',
    blurb: "The Church of the Living God's own app — live worship, The Word archive, Scripture study, choir, and giving.",
    icon: '/lovecorner-icon-192.png',
    webUrl: 'https://poetech.us/thelovecorner',
    apk: `${APK_DOOR_BASE}/lovecorner.apk`,
    packageId: 'us.poetech.lovecorner',
    apkLocal: `${APK_DOOR_BASE}/lovecorner${APK_LOCAL_SUFFIX}.apk`,
    packageIdLocal: 'us.poetech.lovecorner.local',
  },
  {
    key: 'tlc', name: 'TLC Therapy Solutions', short: 'TLC Therapy',
    blurb: 'Faith-integrated therapy — real solutions for real life. Reach the practice and start the conversation.',
    icon: '/tlc-icon-192.png',
    webUrl: 'https://poetech.us/tlc',
    apk: `${APK_DOOR_BASE}/tlc.apk`,
    packageId: 'us.poetech.tlc',
    apkLocal: `${APK_DOOR_BASE}/tlc${APK_LOCAL_SUFFIX}.apk`,
    packageIdLocal: 'us.poetech.tlc.local',
  },
  {
    key: 'properties', name: 'Poe Properties', short: 'Poe Properties',
    blurb: 'For tenants, their families, and the 1099 workers who keep the place running \u2014 report what is broken, follow it to done, and keep every message and date in one place.',
    icon: '/properties-icon-192.png',
    webUrl: 'https://poetech.us/properties',
    apk: `${APK_DOOR_BASE}/properties.apk`,
    packageId: 'us.poetech.properties',
    apkLocal: `${APK_DOOR_BASE}/properties${APK_LOCAL_SUFFIX}.apk`,
    packageIdLocal: 'us.poetech.properties.local',
  },
  {
    key: 'moore', name: 'Moore Divahs', short: 'Moore Divahs',
    blurb: 'Custom clothing, scrub caps, custom shoes, and sewing classes — order and keep your history under her own name.',
    icon: '/moore-icon-192.png',
    webUrl: 'https://poetech.us/moore',
    apk: `${APK_DOOR_BASE}/moore.apk`,
    packageId: 'us.poetech.moore',
    apkLocal: `${APK_DOOR_BASE}/moore${APK_LOCAL_SUFFIX}.apk`,
    packageIdLocal: 'us.poetech.moore.local',
  },
];

// What the local app IS, in the words a person reads before tapping it. One
// sentence of what, one of why, one of the limit -- the shape ANXIETY-CLARITY
// asks for, and nothing here is a promise the shelf has not kept.
export const LOCAL_APP_NOTE = {
  what: 'The whole app inside the package \u2014 it opens from your phone, not from the website.',
  why: 'Installs beside the Android app under its own name, so you can try it without losing anything.',
  limit: 'New (sideload-testing): sign in with email and password; Google sign-in and notifications are not in it yet.',
};

// The two install paths, as plain steps anyone can follow (ANXIETY-CLARITY:
// what / how, no jargon). The Android-package path is the one that always
// lands each app SEPARATELY in the phone's Apps section (DR-0227).
export const INSTALL_STEPS = {
  // The LOCAL app (DR-0573): the same phone steps as the Android package, and
  // one sentence about what is different — it does not replace the other app.
  local: [
    'Tap "Try the local app" — the .apk downloads to the phone (it is bigger, about 20 MB, because the whole app is inside it).',
    'Install it the same way as the Android app: tap the finished download, allow this source the first time, and choose "Install anyway" past Play Protect.',
    'It appears in your Apps section as its own app, BESIDE the Android app — nothing is removed or replaced.',
    'Sign in with your email and password. Google sign-in and notifications are not in the local app yet.',
  ],
  web: [
    'Open the app link in Chrome (or Samsung Internet).',
    'Tap the browser menu (⋮) → "Add to Home screen" / "Install app."',
    'The app lands on your home screen under its own name.',
  ],
  // Measured on Darrell's Samsung 2026-07-23: the download can sit at
  // "Downloading…" even when every byte has arrived, and no install prompt
  // ever fires — the file is still in Downloads. The steps name the real
  // handles: the notification card, My Files → Downloads, and the one-time
  // "allow from this source" screen.
  apk: [
    'Tap "Download Android app" below — the .apk downloads to the phone.',
    'Pull down notifications and tap the finished .apk — OR open My Files → Downloads and tap it there. (If the notification sticks at "Downloading…" though the size shows complete, tap Pause then Resume, or just use My Files — the file is already there.)',
    'First time only: the phone says it "can\'t install unknown apps from this source" — tap Settings, allow it for your browser, then go back and tap Install.',
    'Google Play Protect will warn it "hasn\'t seen an app from this developer" — that\'s because our apps come from OUR store, not Google\'s. Tap "More details," then "Install anyway." (The big "Got it" button CANCELS the install.)',
    'If instead it says "App blocked to protect your device," tap "More details" on that screen too — a smaller "Install anyway" is behind it. If there is truly no "Install anyway": open the Play Store app → your picture (top right) → Play Protect → the gear icon → turn "Scan apps with Play Protect" off, install our app, then turn the scan back on. One-time step; your protection comes right back.',
    'The app appears in your Apps section — its own app, its own icon.',
  ],
  // iOS: no sideloading exists — Safari's Add to Home Screen IS the install,
  // and each brand link lands under its own name + apple-touch icon (all four
  // ship real 180px PNGs). A true App-Store iOS package is the dated Governor
  // step (Apple Developer Program + review — DR-0227 opportunities/constraints).
  ios: [
    'On iPhone/iPad: open the app link in Safari.',
    'Tap Share (the square with the up arrow) → "Add to Home Screen."',
    'The app lands on the home screen under its own name and icon.',
  ],
  // TELEVISIONS: the browser, NOT the .apk — and the reason differs by TV.
  //
  // FIRE TV runs Android, so our package WILL install and still not work, for
  // three reasons visible in store/twa-manifest.template.json: orientation is
  // `portrait-primary` (a portrait window on a 16:9 screen); Bubblewrap emits
  // no `android.software.leanback` feature and no LEANBACK_LAUNCHER intent
  // filter, so it never appears on the Fire TV home screen even once
  // installed; and the pages are built for touch. On top of that a TWA needs a
  // Custom Tabs provider implementing the TWA protocol, and Fire OS ships Silk
  // with no Play Store.
  //
  // SAMSUNG is not Android at all. Samsung TVs run TIZEN, which cannot execute
  // an Android package under any circumstance — so here sideloading is not a
  // bad idea, it is not a thing. Asked by Darrell 2026-09-20 ("Same on the
  // Samsung TV?") and the honest answer is that the question of the .apk does
  // not arise. Tizen ships an "Internet" app and no alternative browser can be
  // installed, so that one browser is the whole surface. Confirmed present in
  // 2026, but availability and menus vary by model and region — hence the
  // mirroring fallback rather than pretending every set has it.
  //
  // LG runs webOS, same shape as Samsung: built-in browser, no Android.
  //
  // What makes the browser route worth giving at all is lib/remote-navigation.js
  // — a D-pad arrives as ordinary arrow keydowns, and without spatial focus
  // movement and a visible focus ring these pages could not be driven from a
  // sofa on ANY of these sets.
  //
  // BOTH ON ONE SET is the common case (Darrell 2026-09-20: "I use both!") — a
  // stick plugged into a smart TV. It has a clear winner and the steps say so
  // rather than leaving someone to guess: Silk is a modern Chromium browser
  // that Amazon keeps current, while Tizen's Internet app cannot be replaced
  // (no Chrome or Firefox build exists for it) and is the weaker surface. Same
  // screen, better browser, so switch the input rather than fight the TV.
  tv: [
    'If you have a Fire Stick plugged into the TV, USE THE STICK — switch to that input. Silk is a far more capable browser than a smart TV\'s built-in one, and it is the one we can count on staying current.',
    'Fire TV / Fire Stick: open the Amazon Appstore, install Silk Browser (free), then go to poetech.us — or a brand address like poetech.us/lovecorner for the church.',
    'Samsung TV: open the Apps row and launch "Internet" (Samsung TVs run Tizen, not Android — an Android app cannot be installed on one at all). Go to poetech.us there.',
    'LG TV: open the "Web Browser" app from the launcher bar and go to poetech.us.',
    'Android TV / Google TV (NVIDIA Shield, Chromecast with Google TV, many Sony and TCL sets): install a browser from the Play Store, then go to poetech.us.',
    'ROKU: Roku has NO web browser at all — not a weak one, none, and none can be installed. It is the one device here that cannot open a website. Cast or mirror from your phone or tablet instead, and drive it from there.',
    'Apple TV: no browser either. Open the app on an iPhone or iPad and AirPlay it to the TV.',
    'On any of them: use the remote\'s arrows to move between things — the highlighted outline shows where you are — and the centre/OK button to choose. Save it to Bookmarks so it is one click next time.',
    'THE LOVE CORNER on a TV: go to poetech.us/lovecorner (poetech.us/thelovecorner and poetech.us/church land in the same place). It is the same app, so the remote drives it exactly the same way.',
    'Watching the service or a sermon on the big screen is the reason to be here at all — and that is the one job a Samsung or LG built-in browser is worst at, because video playback in those browsers is unreliable. For anything with video, use the Fire Stick.',
    'If your set has no browser at all (some models and regions ship without one): open the app on your phone and cast or mirror the screen to the TV instead.',
    'Do NOT sideload the Android package onto a television. On a Samsung or LG it cannot run at all. On a Fire TV it installs but is built portrait for a phone and never appears on the home screen. The browser is the working route today; a proper TV app is a separate build.',
  ],
};
