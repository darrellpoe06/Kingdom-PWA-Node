# Security Posture Review — Public Forms & App Hardening

**Date:** 2026-06-17
**Author:** Claude (advisory), for Darrell (governor)
**Trigger:** Conference-critical hardening ahead of the July 77th National Assembly. The
open `?register=1` registration is a PUBLIC, anonymous form launching to a 500+ person
community — the #1 attack surface. Darrell: *"strip html tags and other web form issues
of being exploited; review security positions and opportunities and constraints."*
**Scope of this pass:** the two open, anonymous write surfaces (conference registration,
app-interest), plus app-wide HTTP security headers. Authenticated surfaces (feedback,
church/choir/etc.) are tenant- + RLS-gated and out of this pass's primary scope.
**Verification:** every claim below is backed by a passing test, a measurement on the
real artifact, or is explicitly flagged as unverified (DR-0076).

---

## 1. Current position — what is already strong (verified)

| Area | State | Evidence |
|---|---|---|
| SQL injection | **Not reachable.** All DB access goes through supabase-js / PostgREST (parameterized). No raw SQL string-building anywhere in the client. | grep of `lib/*.js`: only `.from(table).insert/select/update` calls. |
| Anonymous read-back leak | **Closed.** The public registration table has anon `INSERT` only; **no** anon `SELECT` policy, so a registrant can never read the roll back. Instance is forced by a `SECURITY DEFINER` trigger (client can't misroute a row). | `conference-public-registration-security.test.js` (proven-to-catch), `conference-register-closed-loop.test.js`, migration 0027. |
| XSS render path | **Escaped by default.** React escapes every interpolated value; there is **no** `dangerouslySetInnerHTML` in the codebase. The only `innerHTML` is a static `<select>` reset in a TTS helper (no user data). | grep audit; `public-form-xss-closed-loop.test.jsx` renders a raw `<script>` string and asserts no `<script>` element is created. |
| Account-link RPCs | Bounded `SECURITY DEFINER` (`claim_*` sets the row to the caller only, on unclaimed rows only; `get_my_*` filters to `auth.uid()`). EXECUTE revoked from anon. | migration 0032 + `conference-link-guard`. |
| Auth | Multi-point (>=2-of-3) sign-in; RLS is the real gate, not UI. | migration 0022, `multi-point-auth.test.js`. |

**Bottom line going in:** the data-isolation walls were already sound. The gaps were at
the *input* edge (no length/again-structure limits) and the *transport* edge (no security
headers / CSP).

---

## 2. What this pass hardened (all verified by passing gates)

1. **HTML-tag + control-char stripping at the data layer** — new `lib/sanitize-input.js`
   strips HTML tag structure, HTML comments, and control / zero-width / **bidi-override
   (Trojan-Source)** characters from every public-form field, then normalizes whitespace.
   This is *defense-in-depth behind* React's escaping (keeps the stored value inert for any
   non-escaping consumer — a CSV export, a chat post, an email). A lone `<` / `>` is
   **preserved** so legitimate input ("weighs < 200 lbs") is never mangled.
   *Gate:* `sanitize-input.test.js` (proven-to-catch each hostile shape).

2. **Length caps — client AND server.**
   - Client: `cleanField` hard-caps each field; inputs carry native `maxLength`.
   - **Server (the enforceable control):** migration **0033** adds `CHECK` constraints on
     every text column of both `conference_public_registrations` and `app_interest`, plus
     `party_size BETWEEN 1 AND 99`. **This is the real control** — client validation is
     irrelevant to an attacker who POSTs straight to PostgREST with the bundled anon key.
     Constraints are added `NOT VALID` so the live table apply is fast and can never fail
     on existing rows, while enforcing on every new write.
   *Gate:* `public-form-caps-guard.test.js` proves the constraints exist AND that the DB
   caps **agree with** the client `FIELD_CAPS` (no silent drift), proven-to-catch.

3. **Bot/spam defense without a CAPTCHA** (Darrell's constraint: invisible + frictionless
   for elderly / non-technical congregants):
   - **Honeypot** (already present) — an off-screen field bots fill, humans never see.
   - **Timing trap** (new) — a submit faster than a human could read + type (<1.2s) is
     swallowed as a fake success, giving a bot no signal to tune against. Tuned LOW so it
     never catches a real person, even a leader registering a second guest quickly.
   - Both live in one shared, tested helper (`looksLikeBot`).
   *Gate:* `sanitize-input.test.js` (honeypot caught, fast-submit caught, human allowed).

4. **HTTP security headers (app-wide, `app/vercel.json`):** Content-Security-Policy,
   `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`,
   `Permissions-Policy` (denies geolocation/payment/usb + Google Topics/FLoC tracking),
   and HSTS. The CSP locks the real XSS execution lever — `script-src 'self'
   https://unpkg.com` with **no** `'unsafe-inline'` / `'unsafe-eval'` — which is correct
   because the built `index.html` has **zero inline scripts** (verified on the real
   artifact). It also blocks clickjacking (`frame-ancestors 'none'`), `object-src 'none'`,
   `base-uri 'self'`, and allows exactly the origins the app uses (YouTube live-stream
   iframe, Supabase REST+realtime, OpenStreetMap tiles, NAS images).
   *Gate:* `security-headers-guard.test.js`, proven-to-catch (a `script-src` regaining
   `'unsafe-inline'`, a dropped `frame-ancestors`, or a removed CSP all FAIL the build).

5. **Closed-loop proof** (the conference attack surface end-to-end): a `<script>` /
   `<img onerror>` / bidi payload submitted as a registration is **neutralized before
   storage**, renders **inert** through React, the **no-leak** contract still holds, and a
   **normal registration still persists** end-to-end. *Gate:* `public-form-xss-closed-loop.test.jsx`.

**Test status:** 969/969 tests pass (97 files); production build succeeds. CSP `script-src`
correctness verified against the real built `index.html` (no inline scripts).

---

## 3. Opportunities (lean into these — they are the moat)

- **Sovereignty is a security feature.** The data lives in infrastructure the family
  controls (and is moving to home hardware, per the DB-home decision). No third-party
  ad-tech, no data broker, no engagement-surveillance — the structural difference from
  extractive mainstream tech *is* the competitive moat (DATA-AS-EMPOWERMENT).
- **RLS no-leak is proven, not asserted.** The proven-to-catch RLS gates are exactly the
  kind of evidence that the accessibility-law-compliance product line sells: *prove it,
  don't claim it.* Security-as-trust is a value proposition, not just a cost.
- **Multi-point auth already exceeds the bar** most small orgs hit. Layering device +
  PIN + identity is a differentiator for the church/community market.
- **One shared input primitive** (`sanitize-input.js`) means every future public form
  inherits the same hardening for free — the cost of the next secure form is near zero.

## 4. Constraints (honest about the limits)

- **The public form is, by design, an open door.** It must accept anonymous writes from a
  500-person community on shared networks. That bounds what we can do without hurting the
  exact people we serve (see the per-IP note below).
- **Small team, pre-revenue security ops.** There is no SOC, no on-call, no WAF subscription.
  Defenses must be *self-operating* (DB constraints, RLS, gates that fail the build) rather
  than *monitored*.
- **Invisible-only anti-abuse.** No CAPTCHA, no friction (elderly/non-technical users). That
  rules out the strongest off-the-shelf bot defenses; we rely on honeypot + timing + DB caps
  + cleanup-after-the-fact.
- **Vendor dependencies.** Supabase (auth, RLS, PostgREST) and Vercel (hosting, headers,
  edge). A misconfig or outage on either is a shared-fate risk. The CF Pages migration
  (gated off) partially diversifies hosting.
- **Email rate limit.** Supabase caps auth emails (~2/hr); the on-ramp routes email sign-up
  around it via Google-primary, but a flood of email sign-ups would hit the wall.

---

## 5. Prioritized fix list (honest, with the unverified flagged)

### P0 — do before / at conference launch
- [x] DB length + range `CHECK` constraints on both public tables (migration 0033). **Done; gated.**
- [x] HTML-tag / control-char stripping + caps on every public field. **Done; gated.**
- [x] Honeypot + timing trap on both public forms. **Done; gated.**
- [x] CSP + security headers. **Done; gated.**
- [ ] **Apply migration 0033 to the live cloud** on merge (`gh workflow run db-migrate.yml`
      and verify the run — do NOT trust "merged" = "applied"; the db-migrate trigger gap
      has bitten before). *Owner: whoever merges.*
- [ ] **CSP runtime verification (UNVERIFIED locally).** Vercel applies response headers
      only on a real deploy — the local dev server does not, so the CSP could not be
      runtime-tested in this pass. On first preview deploy, open the register page + the
      church live-stream + maps + sign-in and watch the browser console for `Content
      Security Policy` violations. The directives were reasoned against the actual origins
      the app uses, and `script-src` was verified against the built artifact, but the live
      behavior is not yet observed. *Sized re-review: at first Vercel preview deploy.*

### P1 — soon after
- [ ] **Per-IP / edge rate limiting is DEFERRED — with a specific reason.** Naive per-IP
      limiting is *actively harmful here*: a 500-person congregation registering en masse on
      shared church/home Wi-Fi sits behind one NAT'd public IP, so a per-IP cap would block
      the legitimate rush — the primary use case. The right form is an edge function (Vercel
      / Supabase) with a per-device token + adaptive limits, NOT a per-IP counter, and NOT a
      CAPTCHA. Until then the backstops are: DB caps bound per-row damage, honeypot+timing
      stop cheap bots, the roll is owner/admin deletable, and the anon key can be rotated if
      abused. *Sized re-review: 2026-08-01 (post-conference), or immediately if abuse is observed.*
- [ ] Tighten CSP `connect-src` from `https: wss:` to the explicit Supabase + tile origins
      once the live origin list is confirmed by monitoring. (Broad now to guarantee no
      breakage; `script-src` — the real XSS lever — is already tight.) *Sized re-review: 2026-08-01.*
- [ ] Add an abuse-monitoring readout (registration insert-rate, sudden spikes) to the
      organizer/Governor surface so a flood is *seen*, since it can't be *prevented* without
      friction. *Sized re-review: 2026-08-01.*

### P2 — hygiene
- [ ] Extend the same `sanitize-input` cleaning to authenticated free-text writes (feedback,
      choir, etc.) — lower risk (tenant-gated) but cheap now that the primitive exists.
- [ ] Consider HSTS `preload` once all `poetech.us` subdomains are confirmed HTTPS-only
      (currently `includeSubDomains` without `preload` — preload is hard to reverse).

---

## 6. The honest uncertainty (DR-0076 §8)

- **CSP live behavior is not yet observed** — see P0. This is the single biggest "looks
  right but unverified" item; it is flagged, not papered over.
- **Client cleaning is UX + hygiene, not a control** against a determined attacker who skips
  our JS. The DB `CHECK` constraints (0033) are the enforceable server-side cap; the client
  layer exists for clean data and a good experience, and the code + this review say so plainly.
- The timing trap and honeypot stop *cheap, high-volume* bots, not a *targeted* attacker
  scripting PostgREST directly. That residual is bounded by the DB caps and is named, not hidden.
