# DR-0152 — Store doors: Play + App Store opportunities and constraints, and the sovereign Android package

- **Status:** accepted
- **Tier:** B for the in-repo lane (packaging workflow, readiness surface — soaks on the branch preview); **Tier C for every outward step** (store accounts, real listing, signing-key custody, money — Governor-gated, per RELEASE-TIERS)
- **Scope:** `store/` (the packaging runbook + templates, pre-existing), `.github/workflows/android-package.yml` (new, dispatch-only), `app/src/lib/store-distribution.js` + the Build board card (readiness derived from real config), `app/src/lib/ari-notes.js` (standing duty)
- **Date:** 2026-07-10
- **Principles:** COMMUNITY-FIRST (the store is where church folks already look), DATA-EMPOWERMENT (a signed package we control is a door we own), VERIFICATION-DOCTRINE (readiness is derived, never painted), APP-IS-PRIMARY, NO-STATIC-DATA, DECISION-RECORDS

## Directive

Christina, 2026-07-10 (via Darrell): *"add the app to the Android Play Store and Apple [App Store]… opportunities… and constraints."* And Darrell, same session, after Chrome's install offer failed him again on his own Fold: *"We need a sustainable solution for chrome to let me download this app period."* The two asks are ONE lane: the store listing and the Chrome-independent install both ride the same artifact — a real Android app package (TWA) built from the live PWA.

## The verified ground

- The PWA is installable — measured, not assumed: the `install-health` instrument (DR-0153) asks Chrome directly and reports zero site-side errors. But **Chrome's install offer is discretionary**: it withholds `beforeinstallprompt` on devices where it believes the app is installed, in tablet/desktop postures, and by engagement heuristics. A person Chrome refuses has NO one-tap, only menu steps. That is not a sustainable front door for the family or COLG's elders.
- Prior work already staged the packaging lane: `store/README.md` (PWABuilder + Bubblewrap runbook), `store/twa-manifest.template.json` (packageId `us.poetech.app`, prefilled from the live manifest), `store/assetlinks.template.json` (Digital Asset Links, fingerprint pending). Nothing auto-publishes; submission is account-gated by design.

## Decision — three doors, in order

1. **The sovereign package (now, in-repo).** A dispatch-only CI workflow builds the Android package (TWA via Bubblewrap) from the live manifest and attaches the `.apk`/`.aab` as a run artifact. CI-signed with a per-run debug key at first — good for family sideload testing; NOT the Play key. This is the Chrome-independent install: a real file, downloaded and installed like any app, no browser discretion involved.
2. **Google Play (next, Governor steps).** Opportunities: the store is the ONLY place many people look ("if it's not in the store it isn't real"); one-tap trusted install + auto-updates; COLG can be told "search PoeTech on Play." Constraints, all Darrell-side, none technical: a Play Console account (**$25 one-time**); a **permanent signing keystore** (generated once, backed up like a title deed — losing it means the listing can never be updated; packageId `us.poetech.app` is permanent after first upload); the real `assetlinks.json` goes live at `app/public/.well-known/` only with the real SHA-256 (an invalid one is worse than none — held rule); store listing assets (screenshots, privacy policy URL, data-safety form — DATA-EMPOWERMENT already answers it: no ads, no sale, family-owned).
3. **Apple App Store (after, eyes open).** Opportunities: the iPhone half of the family/church gets a store door; Safari's Add-to-Home-Screen friction (the #1 install failure, 2026-06-16) stops being the only iOS path. Constraints, stated plainly (DR-0100): **$99/year**; **a Mac is required to build + submit** (none in the house — a macOS CI runner is the likely bridge); **Apple guideline 4.2 rejects thin web wrappers** — the iOS build must carry native value (push notifications are the strongest candidate) and a review round-trip must be budgeted; yearly renewal is a recurring cost against QUALITY-OF-LIFE, not a default.

## Opportunities and constraints (routed)

- **Opportunity:** Play internal-testing track as the family's own update channel (signed, auto-updating, still unlisted publicly). `re-review: 2026-07-24`.
- **Opportunity:** push notifications ride the TWA package once it exists — the Apple-4.2 answer and a real family feature (service reminders, prayer-list updates). `re-review: 2026-08-07`.
- **Opportunity:** the store listing page doubles as the public front door copy (BUSINESS-PROCESS-CONNECTIONS four-question test applies before it ships). `re-review: 2026-08-07`.
- **Constraint (held):** the CI debug key is NOT the release key — Play's keystore is generated once, offline, and custodied by Darrell (backed up in two places) before the first upload. The workflow refuses to pretend otherwise: its artifact is labeled sideload-testing.
- **Constraint (held):** no store submission, account purchase, or assetlinks publication happens from an agent lane — every outward step is a named Governor action (Tier C).
- **Constraint (held):** iOS is sequenced AFTER Play ships value — the Mac + $99/yr + 4.2 risk is not paid until the Android door has proven the demand (Proverbs 24:27 — prepare the field first).

## Supersedes / pairs

Pairs with DR-0153 (the browser install door this backstops), `store/README.md` (the runbook this activates), DR-0104 (the live-production review pass covers the installed package too), COMMUNITY-FIRST-MISSION (COLG's elders are store-first users). No supersession.
