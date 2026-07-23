// =============================================================================
// app-store — the PoeTech family's OWN app store record (Darrell 2026-07-23)
// =============================================================================
// "Let's put the installation and instructions inside the PoeTech App build and
// others so we all can do that like our own app store." The four apps of the
// build family, each with BOTH install paths:
//   · PWA — open the app's own link, Chrome menu → Install (the web path);
//   · Android package — the real .apk the TWA lane builds (DR-0227: four
//     packages, own task/icon/resume; immune to the shared-scope wall), served
//     from the repo's rolling `android-latest` release so the links below are
//     stable and public (no GitHub sign-in needed to download).
// Every field mirrors the REAL brand records (manifests, entry pages, DR-0227
// matrix) — nothing invented; renaming a brand updates here with its record.
export const APK_RELEASE_BASE = 'https://github.com/darrellpoe06/Kingdom-PWA-Node/releases/download/android-latest';

export const APP_STORE = [
  {
    key: 'poetech', name: 'PoeTech Family OS', short: 'PoeTech',
    blurb: 'Life, Soul & Money — the family operating system. Books, Debts, Real Estate, Church, Learn, and every module in one app.',
    icon: '/icon-192.png',
    webUrl: 'https://poetech.us',
    apk: `${APK_RELEASE_BASE}/poetech.apk`,
    packageId: 'us.poetech.app',
  },
  {
    key: 'lovecorner', name: 'The Love Corner', short: 'Love Corner',
    blurb: "The Church of the Living God's own app — live worship, The Word archive, Scripture study, choir, and giving.",
    icon: '/lovecorner-icon-192.png',
    webUrl: 'https://poetech.us/thelovecorner',
    apk: `${APK_RELEASE_BASE}/lovecorner.apk`,
    packageId: 'us.poetech.lovecorner',
  },
  {
    key: 'tlc', name: 'TLC Therapy Solutions', short: 'TLC Therapy',
    blurb: 'Faith-integrated therapy — real solutions for real life. Reach the practice and start the conversation.',
    icon: '/tlc-icon-192.png',
    webUrl: 'https://poetech.us/tlc',
    apk: `${APK_RELEASE_BASE}/tlc.apk`,
    packageId: 'us.poetech.tlc',
  },
  {
    key: 'moore', name: 'Moore Divahs', short: 'Moore Divahs',
    blurb: 'Custom clothing, scrub caps, custom shoes, and sewing classes — order and keep your history under her own name.',
    icon: '/moore-icon-192.png',
    webUrl: 'https://poetech.us/moore',
    apk: `${APK_RELEASE_BASE}/moore.apk`,
    packageId: 'us.poetech.moore',
  },
];

// The two install paths, as plain steps anyone can follow (ANXIETY-CLARITY:
// what / how, no jargon). The Android-package path is the one that always
// lands each app SEPARATELY in the phone's Apps section (DR-0227).
export const INSTALL_STEPS = {
  web: [
    'Open the app link in Chrome (or Samsung Internet).',
    'Tap the browser menu (⋮) → "Add to Home screen" / "Install app."',
    'The app lands on your home screen under its own name.',
  ],
  apk: [
    'Tap "Download Android app" below — the .apk downloads to the phone.',
    'Open the downloaded file and allow the install when the phone asks.',
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
};
