# Security audit + hotfix — 2026-05-28 evening

**Triggered by Darrell, 2026-05-28:** "Other people can't really use that yet, it'll have our business information out in public won't it?"

He's right. Audit + immediate fixes below.

## What was exposed before this hotfix

When poetech.us went live earlier this evening, any visitor hitting the bare URL received the PWA with `SEED_DATA` as the initial state. That seed contains:

- **Real entity names:** Personal (Darrell + Christina), Poe Properties LLC, PoeTech LLC, TLC Therapy Solutions LLC
- **Account names + fragments:** Chase Personal Checking ...8168, Chase Personal Checking 2 ...3322, AMEX Darrell ...DP, Chase Freedom, Chase Sapphire, Poe Props Operating, PoeTech Operating, 1st Mid CC Business ...6281, TLC Operating
- **Balances:** including consumer-debt totals ~$62K, credit-card balances, salary actuals
- **Employer:** UIUC (Darrell), State of IL (Christina)
- **Rental property addresses** in Champaign IL (11 specific addresses with rent + mortgage details)
- **Salary amounts:** monthly figures for both spouses
- **Tax structure:** joint-1040 + LLC details

This is PII + sensitive financial info publicly visible at https://poetech.us today. Real exposure.

## Hotfix shipped in this push

**Three changes:**

1. **First-time-landing visitors get demo data, not SEED_DATA.** The `useState` initializer for `data` now checks for the first-time-landing condition (bare URL, no saved profile, no landing-seen flag) and uses `DEMO_DATA_FAMILY_OF_4` instead of `SEED_DATA`. Even if the picker overlay is bypassed or fails to render, the underlying state is sanitized sample data.

2. **Profile picker hidden during first-time landing.** The persona-picker overlay (welcome screen) was rendering ON TOP of the profile picker (Darrell/Christina/Family) — two overlays at once. Now the profile picker condition includes `!isFirstTimeLanding` so it's suppressed during the public landing flow. Profile picker only fires for returning users who have explicitly opted out of demo mode.

3. **"Start your own setup →" button removed; replaced with "Sign up for early access."** The old CTA navigated to `/` which loaded the real app with SEED_DATA. New CTA is a `mailto:darrellpoe06@gmail.com` waitlist link — captures interest without exposing data. The other button changed from "Just show me the family one" to "See the family sample →" for clearer framing.

After this push, poetech.us is safe to share publicly. Demo mode for all unauthenticated visitors; real app stays gated by `poe-current-profile` localStorage (basically just Darrell's machines today).

## Other known security gaps — queue for post-vacation

Per the audit, NOT fixed in this hotfix but acknowledged:

### Gap 1 — Tailscale Funnel endpoints have no auth

`https://poetech.tail5a2f35.ts.net/webhook/*` is publicly reachable from anywhere on the internet. Endpoints currently exposed:

| Endpoint | Method | Sensitivity |
|---|---|---|
| `/webhook/imported-transactions` | GET | High — returns 2020 bank transactions |
| `/webhook/briefing` | GET | High — returns Synology Chat thoughts (Darrell's private notes) |
| `/webhook/mark-noise` | POST | Medium — modifies reconcile state |
| `/webhook/thought` | POST | Medium — drops thoughts into Darrell's inbox |
| `/webhook/thought-ack` | POST | Low — marks thoughts read |
| `/webhook/agent-fire` | POST | Medium — triggers Foundation Agent on demand |
| `/webhook/ask-gemini` | POST | Has TLC firewall — non-clinical only |
| `/webhook/mark-noise` | POST | Medium — modifies financial state |

The Funnel URL is per-tailnet random (poetech.tail5a2f35.ts.net) and not advertised, but anyone Darrell shares it with — or anyone enumerating tail5a2f35.ts.net subdomains, or anyone with the URL leaking in logs — can hit these endpoints without authentication.

**Fix:** add a bearer-token check to every webhook code node. Pattern lives in workflow 17 (Gemini gateway) already. One pass through workflows 18, 19, 23, 26, 27 to add: `if (input.headers['authorization'] !== 'Bearer ' + process.env.WEBHOOK_AUTH_TOKEN) return [{ json: { error: 'unauthorized' } }];`

Then PWA must send the same Bearer token on every call. Token stored in Vercel env var `VITE_N8N_WEBHOOK_TOKEN` (build-time).

Effort: 2-3 hours. Should ship before Funnel URL is shared with anyone other than Darrell's own devices.

### Gap 2 — No rate limiting

Anyone can hit `/webhook/thought` in a loop to spam Darrell's inbox or `/webhook/agent-fire` to burn CPU on the NAS. n8n supports rate limiting via reverse-proxy or via a workflow-internal counter.

**Fix:** add a simple per-IP rate limiter in front of the Funnel. Caddy or nginx reverse proxy + cloudflare-like throttling, OR a workflow that tracks request counts per source and drops requests over threshold.

Effort: 1 day. Lower urgency than auth.

### Gap 3 — ntfy topics are guessable

Topics `poetech-health` and `poetech-foundation` would expose alerts to anyone who knows the topic name. ntfy supports access control via auth users + tokens.

**Fix:** ntfy auth with username/password OR per-topic access tokens. Topic name doesn't have to be obvious.

Effort: ½ day.

### Gap 4 — SEED_DATA still in the bundle

Even after this hotfix, `SEED_DATA` is bundled into the JS that's served to every browser. Anyone inspecting the bundle can read it.

**Fix:** sanitize SEED_DATA itself. Replace business names with generic placeholders ("Business A", "Family Household"), replace account fragments with random digits, replace addresses with city-only references. Keep the shape, replace the substance.

Effort: 1-2 hours. Should accompany the Layer B PIN auth ship.

### Gap 5 — No HTTPS Strict Transport Security

The PWA serves over HTTPS but doesn't enforce it via HSTS header. A man-in-the-middle attacker on first connection could downgrade.

**Fix:** add `Strict-Transport-Security: max-age=31536000; includeSubDomains` to vercel.json headers.

Effort: 5 min. Worth doing whenever the next vercel.json edit happens.

### Gap 6 — Public GitHub repo

`github.com/darrellpoe06/Kingdom-PWA-Node` is public. Anyone can read the code, see the foundation principles, find the endpoints, see the architecture. Not a leak in itself (no secrets are committed), but it's a roadmap for attackers.

**Fix:** make the repo private. Lose the implicit "anyone can fork and contribute" angle, gain operational security. Trade-off.

Effort: 1 click. Decide post-vacation.

## Foundation security workstream — proposed governance item

Bundle gaps 1-3 + 5 into a coherent "Foundation security pass" workstream. Estimated 1 week of focused work. Output:

- Bearer-token auth on all Funnel endpoints
- Rate limiting at the Funnel ingress
- ntfy auth + non-obvious topic names
- HSTS + other PWA security headers
- SEED_DATA sanitization

Gap 4 (Layer B PIN auth + sanitized seed) is its own track, already documented in `2026-05-28-brief-multi-user-profiles.md`.

Gap 6 (public/private repo) is a Governor decision; no work needed beyond the decision.

## Commit batch for this hotfix

```
cd C:\Users\dpoe\Kingdom-PWA-Node
git add app/src/poe-financial-mvp-v28.jsx docs/99-session-notes/2026-05-28-security-audit-and-hotfix.md
git commit -m "Security hotfix: first-time visitors to poetech.us no longer see SEED_DATA. Profile picker suppressed during landing. Start-your-own-setup CTA replaced with waitlist mailto. Audit of other gaps documented for post-vacation security workstream."
git push
```
