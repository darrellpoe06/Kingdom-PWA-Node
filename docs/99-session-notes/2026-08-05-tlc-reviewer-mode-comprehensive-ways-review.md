# 2026-08-05 — Reviewer mode for the TLC Therapy Solutions app: comprehensive review of the Ways, documentation, and procedures

**Asked by:** Darrell — *"How do we use reviewer mode for the TLC Therapy Solutions App? Comprehensive review of our Ways and documentation and procedures."*
**Joined live by:** Christina (mrspoe06), from her own device in reviewer mode — her screenshots are the journey-walk evidence, and her two directives during the pass ("this is what it's showing when my assistant logs in"; "I want to be able to define anyone in the app as an assistant") are answered below.
**Registry record:** REV-0239 · **Decision record:** DR-0275 · **Standard applied:** DR-0239 / `COMPREHENSIVE-REVIEW-STANDARD.md` (all seven dimensions ran — the record is this note).

---

## The answer of record — how to use reviewer mode for TLC

TLC Therapy Solutions is **three surfaces of one app**, and reviewer mode applies differently to each:

| TLC surface | Who meets it | How to review it |
|---|---|---|
| **Client door** — `poetech.us/tlc/` (`?tlc=1`) | prospective clients, no account | **No lens needed.** The door is public and byte-identical for everyone. Review it signed-out (or incognito). Reviewer mode neither changes nor gates it. |
| **Assistant workspace** — staff sign-in on the door, or `?view=tlc-assistant` | Christina + granted assistants | **Reviewer mode is NOT this lens.** A real granted assistant is force-routed here at sign-in, nav filtered to Assistant / Messages / About (`poe-financial-mvp-v28.jsx:1229`). To see it exactly as the assistant does, use the assistant's own signed-in account. |
| **Operator tab** — `?view=tlc` (Practice / Intake / Assistant) | family / Governor / business tier | **Reviewer mode's job here is proving ABSENCE:** enter the lens and confirm the TLC tab and Admin vanish for an outside user; exit and confirm they return. |

**The lens itself (DR-0104, `app/src/lib/reviewer-mode.jsx`):**

1. **Enter:** Admin → Actions → **"Review as a user"** (preview-then-execute). The app reloads and boots the exact signed-in **non-family** user path: empty world, foundation tier, sanitized names, no steward tabs.
2. **While on:** strictly narrowing — the flag can only hide privilege, never grant it. Every write path to the steward's real books, profile, and cloud snapshot is suppressed (each point source-pinned in `reviewer-mode.test.js`, proven-to-catch). RLS remains the real data gate (DR-0060). Honest boundary: deliberate submissions (feedback, module entries) still land in your own account.
3. **Exit:** the pinned dark strip's **"Exit reviewer mode →"** — now present on **every** shell path including the `/tlc/` door (closed this session; it was missing there). The strip also carries the Recent-reviews peek so the written review is one tap away.
4. **The flag is per-device and sticky.** It survives sign-out, sign-in, and navigation until Exit is tapped. See Christina triage below.

---

## Christina triage (live, this session)

- **"This is what it's showing when my assistant logs in."** The screenshot's top banner says REVIEWER MODE: that device has the per-device lens on, so ANY account on it meets the narrowed generic-user world — Practice paywalled at Premium, no Assistant workspace, no TLC tab. **Tap "Exit reviewer mode →" at the top of the screen; the app reloads to the real view.** After exiting: a *granted* assistant signing in as themselves is auto-routed to the Assistant workspace. If they still see the generic paywalled view with the lens off, their grant isn't confirmed yet (flow below).
- **"I want to be able to define anyone in the app as an assistant."** This is shipped (DR-0271) and it is yours: **TLC tab → Assistant → Team access** → type ANY email → "Create invite link" → send it however you like → they open it and sign in → they appear under "Waiting for your confirmation" → tap **Confirm access**. Revoke any time from the same panel. Verified live this session: your account (mrspoe06) holds DB role `admin` on the office instances, which is exactly the role the panel requires. Note: the panel is invisible while reviewer mode is on (the lens hides all privilege — by design), which is why it looked absent on that device.
- **What her screenshot caught** (the DR-0104 pass doing its job): three dev controls in the user-identical view — closed this session, below.

---

## The seven dimensions (DR-0239)

**1. SHOULD/ARE spec-conformance (DR-0219).**
SHOULD: DR-0104 (`docs/decisions/DR-0104-review-the-live-production-push-as-a-user.md:21-29`) — always-available steward lens, strictly narrowing, family reviews every production push on the live build. ARE: traced end-to-end — flag → boot narrowing → write suppression → banner/exit → test pins (`reviewer-mode.jsx`, shell wiring, `reviewer-mode.test.js` 3-layer suite). CONFORMS, with three divergences (gaps 1–3 below), all closed.

**2. JOURNEY WALKS.** Walked: steward-enters-lens (Darrell's fold, screenshots 8:59/9:00 — banner, exit, ReviewsPeek all correct on the live build); steward-in-lens-navigates-to-TLC-door (Exit strip missing — gap 1); Christina's device (9:02 — dev controls visible — gap 4; Practice tier wall correct for an outside user); assistant-signs-in (traced in source: force-route + nav filter at `:1229`/`:4362`; grant flow DR-0271); prospective-client-opens-door (public, no lens involved; content greenlight remains Christina's per `app/public/tlc/index.html`).

**3. SURFACE-SAYS-TRUTH.** Banner copy ("Your family books, profile, and cloud snapshot are untouched") matches the traced suppression points — true. Admin action preview copy ("reloads once… still lands in your own account") — true. ReviewsPeek implicitly claimed "recent" while showing stale records — FALSE (gap 2, closed). "DEV PREVIEW — SWITCH TIER" visible to a real user says the tier wall is optional — FALSE surface (gap 4, closed).

**4. FORM-FACTOR, MEASURED.** The changed chrome (banner strip on the door path) rides the standing CI layout probe (`scripts/chrome-layout-probe.mjs`, 360/768/1440) on this push — the sandbox has no route to poetech.us, so the on-device half is the standing DR-0104 live pass the family is already running (their three screenshots are this dimension's live evidence at tablet width; banner, strip, and exit all painted and reachable).

**5. DELIVERY-CONTEXT + DR-0108 capability re-sync.** The whole team's reach was used, not just the sandbox's: Christina's phone screenshots (the eye the sandbox lacks), the DR-0260 Supabase read channel (her `admin` role verified in the live DB, not assumed), the lane (auto-open-pr → gates → auto-merge). No "can't" was accepted un-challenged; the one true can't (sandbox cannot browse poetech.us) is covered by the runner probe + the family's own live pass.

**6. FINDINGS ARE A WORK QUEUE — two states only.**
DONE this session, with evidence:
1. `/tlc/` door lost the Exit affordance while lensed → ReviewerModeBanner now mounts in the door early-return; both mounts pinned by count (`reviewer-mode.test.js`).
2. ReviewsPeek showed stale records (position-order on a two-convention file; REV-0219–0230 never surfaced) → Date-ordered with id tie-break; proven-to-catch fixture (`reviews-peek.test.jsx`).
3. Eight double-minted REV ids (0088/0089/0159/0160/0174/0175/0176/0218) → renumbered to REV-0231–0238 (the first-in-time holder keeps the id); every external reference updated same commit (`ChurchGiving.jsx`, shell comment, two render tests, DR-0121 ×4, DR-0240, DR-0259, INDEX.md); convention declared in the registry header.
4. TierSwitcher + UpgradePrompt dev-row + footer Reset-to-seed visible to real users (tier-wall hop; seed-overwrite hazard) → all three gated `isFamilyMember || isAnyDemoMode` (demo stays: a sales affordance for prospects exploring the sample); source-pinned.
CARRIED, by name, with dates:
- "View as my assistant" preview lens (reviewer mode is a generic-user lens only) — `re-review: 2026-08-12`.
- Sticky per-device flag on shared devices (auto-exit-on-account-change only if the confusion recurs; the always-visible banner is the current affordance) — `re-review: 2026-08-12`.

**7. GATE-THE-CLASS.** New machinery, each proven-to-catch: `reviews-registry-guard.test.js` (duplicate/malformed id, unparseable date — the double-mint class is now a red build); ReviewsPeek out-of-order fixture (the position-order class); reviewer-mode.test.js pins for the door-strip count and the three dev-control gates (the ungated forms asserted ABSENT). Verification: the 8 affected test files run green locally (118 tests); the full suite + build ride the lane's required gates on this PR.

---

## Renumber map (for anyone holding an old reference)

| Old (double-minted) | Now | Record |
|---|---|---|
| REV-0088 (2nd) | REV-0231 | token invite + guardian re-confirm |
| REV-0089 (2nd) | REV-0232 | Living Lesson L37 |
| REV-0159 (top block) | REV-0233 | the re-ask relapse |
| REV-0160 (top block) | REV-0234 | Trust but Verify — external research |
| REV-0174 (top block) | REV-0235 | dark-theme chips + FEEDBACK pill |
| REV-0175 (top block) | REV-0236 | the watcher's first drive |
| REV-0176 (top block) | REV-0237 | the 60-minute check-in correction |
| REV-0218 (2nd) | REV-0238 | the still screen |

First-in-time holders keep their ids (REV-0088/0089 first pair; body REV-0159/0160/0174/0175/0176; REV-0218 install review — the one DR-0259 and the ari-guard fixtures cite).
