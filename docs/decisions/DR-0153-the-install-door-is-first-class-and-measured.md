# DR-0153 — The install door is first-class and measured: one tap on every tab, Chrome's own verdict on the ledger, the right steps for the device in hand

- **Status:** accepted
- **Tier:** A shipped through the lane (documented fixes + an observation instrument; no schema, no money)
- **Scope:** `components/InstallAppButton.jsx` (header, every tab), `components/AppInterestCapture.jsx` (?join=1 one-tap), `lib/install-help.js` (platform detection incl. the Fold desktop-posture case), `lib/install-app.js` (the shared one-shot capture, pre-existing), `scripts/install-health.mjs` + `.github/workflows/install-health.yml` (the instrument), incident #722 (the deploy-window diagnosis)
- **Date:** 2026-07-10
- **Principles:** ANXIETY-CLARITY (the scared parent gets a button, not homework), REALITY-TRACE, VERIFICATION-DOCTRINE, PERPETUAL-IMPROVEMENT, APP-IS-PRIMARY, NO-STATIC-DATA

## Directive

Darrell, 2026-07-10, at full volume: *"I can't download the PoeTech app why!!… it should be easy why can't I just push a button… users are also going to have this problem!"* Then, placing the control: *"Add it to the space that is on each tab top space."* Then, when the steps his phone was handed were a computer's: *"your solutions keep failing for me… we need a sustainable solution."*

## What was found (measured) and what shipped

1. **The site was installable all along — the button was missing.** `install-health` (new instrument: headless Chrome on a runner asks `Page.getInstallabilityErrors` + fetches every install-critical artifact) measured ZERO site-side errors. The failure was ours: the one-tap wire existed but no surface used it. Shipped: the **?join=1 page leads with a real install button** (PR #732) and the **header carries "Install app" on every tab** (PR #733) — native dialog when the browser allows, exact device steps when it doesn't, gone once installed. Render tests pin every state.
2. **His blank screen was a real outage class, not user error:** during each deploy, poetech.us serves the new shell before its assets are reachable — missing chunks answer as the SPA fallback HTML and zero JavaScript runs (~7–12 min windows, twice measured 2026-07-10). Diagnosed with evidence on incident #722; the durable-fix decision (asset-404 vs zone cache purge) carries `re-review: 2026-07-12`.
3. **The steps must match the device in hand:** his Fold's Chrome runs a desktop-shaped UA, so `detectPlatform` called his phone a computer and handed him address-bar instructions his screen doesn't have. Fixed: a touch screen on a desktop-shaped Linux UA (or UA-CH `mobile`) classifies android; the android steps now name the scrollable menu path AND the already-installed tell ("if the menu says Open PoeTech, it's already on this phone — check the app drawer").
4. **Chrome's discretion is the residual constraint** — it may withhold the one-tap event on any device (installed-already, posture, heuristics). That residue is exactly why the sovereign package lane exists: **DR-0152** is the sustainable answer; this DR makes the browser door as good as a browser door can be.

## Opportunities and constraints (routed)

- **Opportunity:** the install button could show *why* the one-tap is unavailable when it knows (already installed vs never offered) — one honest sentence above the steps. `re-review: 2026-07-24`.
- **Opportunity:** install-health could join site-health's cadence (currently dispatch-only) once its false-positive surface is proven quiet. `re-review: 2026-07-24`.
- **Constraint (held):** `beforeinstallprompt` is one-shot and discretionary; no surface may promise the native dialog unconditionally — every install control falls back to steps, never a dead end.

## Supersedes / pairs

Pairs with DR-0152 (the store/package lane), DR-0125 (the runner is the eye — install-health is its installability sibling), DR-0139 (boots-is-the-bar; the blank-window diagnosis rode its instrument), LESSONS 2026-07-10 entry. No supersession.
