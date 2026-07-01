# Runbook — serving the sovereign NAS PWA at poetech.us

**Status:** the sovereign deployment is LIVE today at
`https://poetech.tail5a2f35.ts.net:8443/poetech-app/` (Tailscale Funnel → NAS
Caddy). That URL is **additive** — it does not touch poetech.us or the existing
Vercel deployment. This runbook is the follow-on to also reach the NAS app at a
clean **poetech.us** address. It is a *cutover decision* (it would move the front
door off Vercel), so it is flagged his-hand and not done automatically.

The `:8443` in the Funnel URL is the only rough edge of today's URL (Tailscale
Funnel's public ports are 443/8443/10000, and n8n already holds 443). A custom
domain removes the port and the `.ts.net` host.

---

## Option A — Cloudflare Tunnel (recommended)

No router port-forward, no DDNS, no exposed home IP, free, automatic TLS.

**His-hand (one-time):**
1. At **register.com**, point `poetech.us` nameservers at Cloudflare (Cloudflare
   onboarding lists the two NS records). DNS-only move; ~the standard propagation
   wait.
2. Create/!log into a **Cloudflare** account, add the `poetech.us` zone.
3. Decide the cutover: `poetech.us` currently resolves to Vercel. Moving NS to
   Cloudflare means Cloudflare serves DNS for the whole zone — keep any other
   records (mail, etc.) mirrored during setup.

**Agent-drivable once Cloudflare has the zone + an API token:**
4. Install `cloudflared` on the NAS (Container Manager image
   `cloudflare/cloudflared`), create a named tunnel, and route
   `app.poetech.us` (or apex) → `http://poetech-web:80` (the Caddy container) or
   `http://172.17.0.1:8088`.
5. Add the `connect-src`/`frame-ancestors` origin to the CSP if the hostname
   changes (the Caddyfile CSP uses `'self'`, so a same-origin host needs no CSP
   edit — only cross-origin additions would).
6. Supabase: add `https://app.poetech.us/poetech-app/` to the Auth redirect
   allowlist (see Auth note below).

---

## Option B — Home port-forward + Let's Encrypt (Caddy auto-TLS)

More moving parts; exposes the home IP.

**His-hand:**
1. On the **UniFi** router, port-forward TCP **80** and **443** → `192.168.1.26`
   (the NAS). Caddy must own those ports (today it serves :8088 only — this would
   add a second site block on :80/:443 with a real domain so Caddy can fetch a
   Let's Encrypt cert).
2. Set up **DDNS** (UniFi has a built-in DDNS client, or Cloudflare DNS + a
   cron updater) so `poetech.us` always points at the home WAN IP.
3. At register.com, set `poetech.us` A record → the DDNS hostname / WAN IP.

**Agent-drivable:**
4. Add a `poetech.us { ... }` site block to the Caddyfile with `auto_https`
   ON (remove the `auto_https off` global for that site) so Caddy obtains and
   renews the cert automatically. Keep the existing `:80` (LAN) block for
   same-LAN HTTP access.

---

## Auth note (applies to BOTH options, and to today's `:8443` URL)

Supabase magic-link / Google OAuth redirect back to a URL on its **allowlist**
(Site URL is pinned to `poetech.us/poetech-app/`). A **new** sign-in started from
any other origin (the `:8443` Funnel URL, or `app.poetech.us`) will bounce the
user to `poetech.us` after auth unless that origin is added to the Supabase Auth
**Redirect URLs** allowlist. This is a 1-minute dashboard change (Supabase →
Authentication → URL Configuration → Redirect URLs). Until then, the sovereign
URL renders fully and works for an already-signed-in session, but fresh
redirect-based sign-in completes on poetech.us, not the NAS URL.

---

## What is on the NAS today (reversible)

- Container **`poetech-web`** (caddy:2-alpine), host `:8088` → container `:80`,
  `--restart unless-stopped`. Mounts `/volume1/PoeTech/caddy/Caddyfile` and
  `/volume1/PoeTech/caddy/site` (read-only). Remove with
  `docker rm -f poetech-web` (n8n/ollama/ntfy untouched).
- Tailscale Funnel **:8443** → `localhost:8088`. Disable with
  `tailscale funnel --https=8443 off` (the n8n :443 funnel is independent).
- Build/deploy: `/volume1/PoeTech/scripts/deploy-pwa.sh`.
- App env: `/volume1/PoeTech/repos/Kingdom-PWA-Node/app/.env.local` (gitignored).
