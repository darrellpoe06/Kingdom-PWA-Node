# Runbook — PERMANENT cutover: poetech.us served from the NAS via Cloudflare Tunnel

**Goal.** Move the front door of `poetech.us` off Vercel and onto the sovereign
NAS deployment, fronted by the Cloudflare edge: clean apex domain, valid TLS, no
port number, home IP hidden, and Cloudflare's global network absorbing scale
before traffic ever reaches the house. No router port-forward, no DDNS, no
exposed WAN IP. **Vercel stays warm and untouched until DNS flips**, so rollback
is always one nameserver change away.

This reuses the Caddy container already on the NAS as the tunnel origin. It does
**not** disturb Caddy, n8n, Ollama, ntfy, or the Tailscale Funnel — cloudflared
is added alongside as a new container.

---

## Architecture (what connects to what)

```
  Browser ──HTTPS──> Cloudflare edge ──encrypted tunnel──> cloudflared (NAS) ──HTTP──> Caddy :8088 ──> PWA + /n8n proxy
   (poetech.us)        (TLS here)         (outbound only)      (container)         (172.17.0.1:8088)
```

- TLS is terminated at the Cloudflare edge (free, auto-renewed). The tunnel
  between Cloudflare and the NAS is an **outbound-only** encrypted connection —
  nothing is opened on the home router, the WAN IP is never published.
- cloudflared on the NAS hands requests to the existing **Caddy** container
  (`poetech-web`, host port **:8088**). Caddy serves the PWA at `/poetech-app/`,
  redirects `/` → `/poetech-app/`, and proxies `/n8n/*` to n8n same-origin —
  exactly as it does today over the Tailscale Funnel.
- **Scale / bandwidth benefit:** Cloudflare's edge sits in front. Static assets
  are cached and served from Cloudflare's CDN, DDoS protection is automatic, and
  the home uplink only carries cache-miss origin pulls — not every visitor.

### Exact tunnel origin (the value Darrell sets in the dashboard, Step D)

```
http://172.17.0.1:8088
```

`172.17.0.1` is the Docker bridge gateway = the NAS host, so a bridge-network
cloudflared container reaches the host's published Caddy port 8088. This is the
**same host-gateway pattern already proven in production** by the Caddyfile's
n8n proxy (`172.17.0.1:5678`). Verified live: `172.17.0.1:8088/poetech-app/`
returns **HTTP 200** from inside a bridge container; `localhost:8088/` returns
**302 → /poetech-app/**, `/poetech-app/` returns **200**, `/n8n/` returns **200**.

> Alternative (only if the bridge path ever fails): run cloudflared with
> `--network host` and set the dashboard service to `http://localhost:8088`.
> Both were verified reachable; the bridge form is the default because it
> matches the existing, battle-tested Caddy→n8n path.

---

## NAS-side state — DONE (agent-driven, no Cloudflare account needed)

These are already in place on the NAS (`192.168.1.26`):

- [x] `cloudflared` image pulled: `cloudflare/cloudflared:latest`, **version
      2026.6.1**. Confirmed with `cloudflared --version`.
- [x] Origin reachability verified end-to-end (200s above).
- [x] Token-runner staged: `/volume1/PoeTech/scripts/cloudflared-up.sh`. When
      Darrell provides the tunnel token, the agent runs:
      ```
      sudo /volume1/PoeTech/scripts/cloudflared-up.sh <TUNNEL_TOKEN>
      ```
      which starts the container with `--restart unless-stopped` (durable across
      reboots) running `tunnel --no-autoupdate run --token <TOKEN>`.

The dashboard-managed (token) tunnel model is used on purpose: Darrell creates
the tunnel and its public-hostname routing in the Cloudflare Zero Trust
dashboard; the NAS just runs `cloudflared` with the token. The routing
(`poetech.us` → `http://172.17.0.1:8088`) and DNS live in Cloudflare, so there's
no local config file to drift, and the route can be changed from the dashboard.

---

## HIS-HAND runbook — Cloudflare account steps, in order

> **Legend.** **[HIS ACCOUNT]** = only Darrell can do it (Cloudflare /
> register.com login). **[AGENT/NAS]** = the agent runs it on the NAS the moment
> the prerequisite (the token) arrives.
>
> `poetech.us` DNS is **currently at register.com**, not Cloudflare. The move is
> a nameserver delegation. Do the steps in order; do **not** start cloudflared
> publicly routing until the tunnel exists (Step C/D).

### Step A — Add poetech.us to Cloudflare and VERIFY imported DNS  **[HIS ACCOUNT]**

1. Go to **https://dash.cloudflare.com** → log in (or create a free account).
2. Click **Add a site** (or **+ Add** → **Existing domain**). Enter `poetech.us`.
3. Choose the **Free** plan. Continue.
4. Cloudflare scans and imports the current DNS records from register.com.
   **STOP and verify this list before continuing** — this is the most important
   safety check of the whole cutover:
   - **MX records** (email): if poetech.us receives email, confirm every MX row
     and any related `TXT` SPF/DKIM/DMARC records were imported. **Missing MX =
     broken email** after the nameserver flip.
   - Any existing `A` / `CNAME` / `TXT` records (the current Vercel record, any
     verification TXTs, etc.). Leave the existing Vercel record in place for now
     — it is the rollback path.
   - If anything is missing, **add it manually** in Cloudflare DNS now, before
     Step B. Take a screenshot of the imported list for your records.
5. Cloudflare shows you **2 assigned nameservers** (e.g.
   `something.ns.cloudflare.com`). **Copy both.** Do not click "Done / Check
   nameservers" yet.

### Step B — Repoint nameservers at register.com  **[HIS ACCOUNT]**

1. **FIRST, save the rollback values.** Log into **register.com** → domain list
   → **poetech.us** → DNS / Nameservers. **Write down (or screenshot) the
   current 4 register.com nameservers** before changing anything. These are your
   rollback. (They are typically `dns1.registrar-servers.com` … or
   `ns1.register.com` …-style hostnames — record the exact 4 you see.)
2. Change the nameservers to the **2 Cloudflare nameservers** from Step A.5.
   Remove the old register.com ones. Save.
3. Back in Cloudflare, click **Done, check nameservers**. Propagation is
   typically **a few minutes to a few hours** (registrar TTL dependent; allow up
   to 24h worst case). Cloudflare emails you when the zone is **Active**.
   - During propagation, poetech.us still resolves via whichever nameserver a
     given resolver has cached — Vercel keeps serving until the flip completes.
     No outage window if the imported records (Step A) are correct.

### Step C — Create the tunnel and copy the token  **[HIS ACCOUNT]**

1. In Cloudflare dash → **Zero Trust** (left sidebar; first time it asks you to
   pick a team name — any name, Free plan).
2. **Networks → Tunnels → Create a tunnel**.
3. Connector type: **Cloudflared**. Click **Next**.
4. Name it **`poetech-nas`**. **Save tunnel**.
5. The install screen appears. **You do NOT install anything** — the agent
   already pulled cloudflared on the NAS. Just **copy the token**: it's the long
   string after `--token` in the displayed `cloudflared ... run --token eyJ...`
   command. **Paste that token to me (the agent).** It's a secret — treat it
   like a password.
   - The agent then runs `sudo /volume1/PoeTech/scripts/cloudflared-up.sh <token>`
     on the NAS. Within ~10 seconds the tunnel shows **HEALTHY / Connected** in
     the dashboard.

### Step D — Add the public hostnames (CF auto-creates DNS)  **[HIS ACCOUNT]**

> Do this once the agent confirms the connector is **HEALTHY** (after Step C).

1. On the `poetech-nas` tunnel → **Public Hostname** tab → **Add a public
   hostname**.
2. Apex entry:
   - **Subdomain:** *(leave blank)*
   - **Domain:** `poetech.us`
   - **Path:** *(leave blank)*
   - **Service → Type:** `HTTP`
   - **Service → URL:** `172.17.0.1:8088`
   - Save. Cloudflare **auto-creates the proxied DNS record** for `poetech.us`.
3. **Add a public hostname** again for `www`:
   - **Subdomain:** `www`
   - **Domain:** `poetech.us`
   - **Service → Type:** `HTTP`, **URL:** `172.17.0.1:8088`
   - Save.
4. (If a leftover Vercel `A`/`CNAME` for the apex or `www` still exists in
   Cloudflare DNS and conflicts with the tunnel's auto-created record, Cloudflare
   will warn — delete the old Vercel record so the tunnel record wins. This is
   the actual cutover moment.)

### Step E — Verify  **[HIS ACCOUNT + AGENT]**

1. Open **https://poetech.us** in a fresh/incognito tab → it should **302 to
   `https://poetech.us/poetech-app/`** and load the working PWA.
2. Confirm the **padlock / valid TLS** (Cloudflare-issued cert, no warning).
3. Confirm a `/n8n` call works (the app's n8n-backed features load) — same-origin
   proxy through Caddy. The agent can curl `https://poetech.us/n8n/` and confirm
   the app surfaces.
4. **Supabase auth allowlist (1-minute dashboard change):** Supabase →
   Authentication → URL Configuration. Site URL is already
   `poetech.us/poetech-app/` so apex sign-in works. No change needed for the
   apex; only add `https://www.poetech.us/poetech-app/` to **Redirect URLs** if
   `www` should support fresh magic-link / OAuth sign-in.

---

## ROLLBACK — at every step

The whole design keeps Vercel warm, so rollback is fast at any point:

- **After Step A only (site added, NS not changed):** nothing is live; just don't
  do Step B. Zero impact.
- **After Step B (NS changed) — the big one:** at **register.com**, set the
  nameservers **back to the 4 original register.com nameservers you saved in
  Step B.1**. DNS reverts to register.com → Vercel resolves again. (Propagation
  applies on the way back too.)
- **After Step C/D (tunnel routing live):** two independent levers —
  - In Cloudflare DNS, **pause/delete the tunnel's `poetech.us` record** (or set
    it back to the Vercel target) to instantly route the apex away from the NAS
    while keeping Cloudflare as DNS host.
  - Or stop the NAS connector: `sudo docker stop cloudflared` (Caddy, n8n,
    Ollama, ntfy, Funnel all keep running — cloudflared is additive).
- **Vercel** is never touched by this runbook. It keeps building and serving
  until DNS points away from it, and resumes serving the instant DNS points back.

---

## Who does what — summary

| Step | Who | Action |
|------|-----|--------|
| (pre) | **AGENT/NAS** ✅ done | Pulled `cloudflared` 2026.6.1, verified origin 200s, staged token-runner |
| A | **HIS ACCOUNT** | Add poetech.us to Cloudflare (Free); **verify imported DNS incl. MX**; copy 2 CF nameservers |
| B | **HIS ACCOUNT** | **Save old 4 register.com NS (rollback)**; set NS to Cloudflare's 2; wait for propagation |
| C | **HIS ACCOUNT** | Zero Trust → Tunnels → create `poetech-nas` → **copy token → give to agent** |
| (C) | **AGENT/NAS** | `sudo /volume1/PoeTech/scripts/cloudflared-up.sh <token>` → connector HEALTHY |
| D | **HIS ACCOUNT** | Add Public Hostname `poetech.us` (+`www`) → service `http://172.17.0.1:8088`; delete conflicting Vercel records |
| E | **HIS ACCOUNT + AGENT** | Verify https://poetech.us loads PWA + /n8n + valid TLS; (opt) add `www` to Supabase Redirect URLs |

---

## What is on the NAS (all reversible, none of it disturbed)

- `poetech-web` (caddy:2-alpine), host `:8088` → container `:80`,
  `--restart unless-stopped`. The tunnel origin.
- `n8n` (:5678), `ollama` (:11434), `ntfy` (:8081) — untouched.
- Tailscale Funnel `:8443` → `localhost:8088` — independent, stays as the
  internal/sovereign URL.
- **NEW:** `cloudflared` container (added in Step C), `--restart unless-stopped`,
  outbound-only, token-driven. Stop/remove with `sudo docker rm -f cloudflared`.
- Token-runner: `/volume1/PoeTech/scripts/cloudflared-up.sh`.
