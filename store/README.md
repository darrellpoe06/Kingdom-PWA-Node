# Store packaging — get the PoeTech PWA into Google Play + the Apple App Store

The PoeTech app is a PWA at **https://poetech.us/poetech-app/**. Neither store
lets you list a bare "link to a PWA" — you publish an actual app package that
opens the PWA. This folder makes that turnkey: templates + an exact runbook. The
**install prompt on poetech.us already works** (Android one-tap install, iOS
Add-to-Home-Screen) — the stores are an *additional* front door for people who
only ever look in the stores.

> Nothing in here auto-publishes. Submission is account-gated and outward-facing
> — those steps are yours (your developer accounts, your signing keys). The files
> here remove every other step.

## TL;DR — recommended path: PWABuilder

[PWABuilder](https://www.pwabuilder.com/) (free, Microsoft) generates **both** an
Android (TWA) package and an iOS package straight from the live manifest URL —
no local Android/Xcode toolchain to hand-build.

1. Go to https://www.pwabuilder.com/ and enter `https://poetech.us/poetech-app/`.
2. **Android** → "Generate Package" → Android. Use the package id and labels in
   `twa-manifest.template.json`. Download the `.aab` **and** the generated
   `assetlinks.json` (it contains the real signing SHA-256).
3. Put the real `assetlinks.json` live (see "Digital Asset Links" below) — TWA
   will not run full-screen without it.
4. **iOS** → "Generate Package" → iOS. You get an Xcode project. **You need a Mac**
   to build + upload it (see the iOS note below — this is the one hard blocker).

## Costs + accounts (yours to set up)

| Store | One-time / yearly | Account | Extra requirement |
|-------|-------------------|---------|-------------------|
| Google Play | **$25 one-time** | [Play Console](https://play.google.com/console) | a signing keystore (PWABuilder/Bubblewrap makes one) |
| Apple App Store | **$99 / year** | [Apple Developer](https://developer.apple.com/) | **a Mac** to build + submit; Apple may reject a thin wrapper (guideline 4.2) |

## ⚠️ iOS reality (you're on Windows)

Building and submitting an iOS app **requires macOS + Xcode** (or Transporter).
You're on Windows 11, so the iOS path has a hard tooling dependency PWABuilder
can't remove. Real options:

- Borrow/rent a Mac (a Mac mini, MacStadium, or a macOS CI runner like the GitHub
  Actions `macos` runner) to build + upload the PWABuilder iOS package.
- Apple historically rejects thin web-view wrappers under **guideline 4.2
  ("minimum functionality")**. To pass, the iOS build should add native value
  (push notifications, share targets, offline) — PWABuilder's template includes
  some of this, but budget for a possible review round-trip.

Android (Play) has neither blocker — it's the faster win. Recommend shipping
Play first, iOS second once a Mac is in hand.

## Digital Asset Links (Android TWA — required)

A TWA only runs full-screen (no browser chrome) if the website proves it owns the
app. That proof is a file served at:

```
https://poetech.us/.well-known/assetlinks.json
```

1. Build the Android package (PWABuilder or Bubblewrap) — that step prints your
   signing cert **SHA-256 fingerprint**.
2. Copy `assetlinks.template.json` here to `app/public/.well-known/assetlinks.json`,
   replace `REPLACE_WITH_SHA256_FINGERPRINT` with the real value, and deploy.
   (Vercel serves `app/public/` at the site root, so it lands at the right URL.)
3. Verify: `curl https://poetech.us/.well-known/assetlinks.json` returns your file.

We deliberately do **not** ship a placeholder asset-links file live — an invalid
one is worse than none. It goes live only with the real fingerprint.

## Files here

- `twa-manifest.template.json` — Bubblewrap/TWA config (package id, name, colors,
  start url) prefilled from the live manifest. Use it if you run the Bubblewrap
  CLI instead of PWABuilder.
- `assetlinks.template.json` — Digital Asset Links template; fill the fingerprint,
  then copy to `app/public/.well-known/`.
- **`android.keystore.enc` — the signing identity. Read the next section.**

## The signing key: what it is, where custody lives, how to rotate

*Documented 2026-09-19. This file previously listed only the two templates and
said nothing about the keystore, which meant the custody model existed only in
a workflow comment. That gap is what this section closes.*

**What it is.** `android.keystore.enc` is the **real store signing key** for all
five brand packages — `us.poetech.app`, `us.poetech.lovecorner`, `us.poetech.tlc`,
`us.poetech.moore`, and Poe Properties. Not a throwaway debug key. Every package
the lane builds is signed with this one stable identity, which is what lets an
installed app update in place instead of forcing a uninstall/reinstall.

**How it got here.** Darrell, 2026-07-24: *"YOU do it."* The base64-paste ceremony
for handing a keystore to CI kept failing, and `ANDROID_STORE_KEYSTORE_PASS` was
the only secret that reliably landed. So `.github/workflows/android-package.yml`
(the `key:` job) generates the store key **once**, encrypts it with that
passphrase (AES-256-CBC, PBKDF2, salted), and commits the result here. Every
build since decrypts with the same secret and signs.

**Custody — you already hold it.** The key is recoverable from two things you
control: this repository and `ANDROID_STORE_KEYSTORE_PASS`. To pull a custody
copy for offline backup:

```
cd C:\Users\dpoe\Kingdom-PWA-Node
git pull origin main
openssl enc -d -aes-256-cbc -pbkdf2 -in store\android.keystore.enc -out %USERPROFILE%\poetech-android.keystore
```

Store that output somewhere durable and offline. **Losing both the passphrase
and every decrypted copy means the listing can never be updated again** — the
packageId is permanent after first upload, so the identity cannot be re-minted.
Treat the backup like a title deed (DR-0152).

**Rotation (DR-0232).** Delete `store/android.keystore.enc`, set a new
`ANDROID_STORE_KEYSTORE_PASS` secret, and dispatch the workflow — the `key:` job
re-bootstraps from scratch. **Only do this before the first Play upload.** After
a package is published, a new signing key is a different app to Android, so
rotation there requires Play App Signing key-rotation rather than this path.

**Standing consideration.** While the repository is public, the encrypted key is
publicly copyable and its confidentiality rests entirely on the strength of that
one passphrase. If the passphrase was hand-chosen rather than generated, rotate
it now (the step above is cheap pre-upload). Making the repository private
removes the exposure without requiring any rotation at all. Recorded as a
posture question in the DR-0152 drift note — `re-review: 2026-10-03`, or on any
visibility change, whichever comes first.

## Alternative: Bubblewrap CLI (Android only, no PWABuilder)

```bash
npm i -g @bubblewrap/cli
bubblewrap init --manifest=https://poetech.us/poetech-app/manifest.webmanifest
bubblewrap build      # prints the SHA-256 for assetlinks.json; outputs the .aab
```
Then upload the `.aab` to the Play Console and publish the asset-links file.
