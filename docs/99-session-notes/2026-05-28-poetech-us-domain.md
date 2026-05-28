# poetech.us — front door + DNS

## What ships in this push (code-side)

A first-time landing front door. When someone arrives at the bare URL (no query params, no saved profile, no "landing-seen" flag), they get the persona-picker page styled as a welcome — adapted copy that frames the system as "a family financial system built to lift the anxiety of providing." Four working sample tiles, nine vision-in-build tiles, plus the two CTAs ("Start your own setup →" and "Just show me the family one"). Any click sets a localStorage flag so returning visitors skip the front door and land in the app directly.

This works on the existing Vercel domain right now; it works the moment poetech.us points at the same Vercel project.

## What you do (DNS / Vercel — about 15 minutes)

Order matters. Do these in sequence.

### Step 1 — Add the domain in Vercel

1. Sign in to https://vercel.com/dashboard.
2. Open the kingdom-pwa-node project.
3. Settings → Domains → Add Domain.
4. Enter `poetech.us` and click Add. Repeat for `www.poetech.us`.
5. Vercel will show you the exact DNS records to create at your registrar. Copy them; the next step needs them.

Typically Vercel asks for:
- For the apex (poetech.us): an `A` record pointing to a Vercel IP (currently 76.76.21.21).
- For www: a `CNAME` record pointing to `cname.vercel-dns.com`.

Sometimes Vercel offers the "use Vercel nameservers" alternative — that's faster but gives Vercel full DNS control. Either works; the A + CNAME approach is more conservative if you ever want to add a separate mail service later.

### Step 2 — Find your registrar

The old site is on Weebly, but the DOMAIN itself might be registered at Weebly OR at a different registrar (GoDaddy, Namecheap, Google Domains / Squarespace, etc.). Find it:

- Search your email for "poetech.us" with terms like "renewal," "expiration," "domain," "transfer." The renewal sender is your registrar.
- Or visit https://lookup.icann.org and enter poetech.us — the "Registrar" field tells you who manages it.

Common cases:
- **If registered through Weebly:** log into Weebly → Domains → poetech.us → DNS Settings.
- **If at GoDaddy / Namecheap / Squarespace / etc.:** log into that registrar → DNS management for poetech.us.

### Step 3 — Add the DNS records Vercel gave you

In your registrar's DNS panel:
- Add (or update) the `A` record at `@` (the apex) to the IP Vercel specified.
- Add (or update) the `CNAME` record at `www` pointing to the value Vercel specified.
- Delete any existing `A` records at `@` that point to Weebly's IPs — those will conflict.
- Delete any old `CNAME` records at `www` that point to Weebly.

If your registrar uses "host" instead of "name," use `@` for the apex record's host.

### Step 4 — Wait + verify

DNS propagation is usually 5-30 minutes. Some registrars take longer. Vercel's domain panel will switch from "Invalid Configuration" to "Valid" once it sees the right records.

Once Vercel says Valid, it auto-issues a Let's Encrypt SSL certificate (about 30 more seconds). After that:
- https://poetech.us — your app
- https://www.poetech.us — same (Vercel redirects www → apex automatically if you set it up to)
- https://poetech.us/?demo=family-of-4 — family demo
- https://poetech.us/?demo=picker — pick a scenario menu

### Step 5 — Decommission the Weebly site (optional, post-DNS)

Once poetech.us serves from Vercel, the Weebly site is unreachable at that URL but it might still exist at `poetech.weebly.com`. You can leave it (harmless) or delete it from Weebly's dashboard.

## Email caveat

If you currently receive email at any `@poetech.us` address (you'd remember if you do), the DNS change can break it unless we preserve the `MX` records. From the Weebly site I don't see any indication of active email there — the Contact form likely routes to your gmail. But verify before deleting any old DNS records you don't recognize.

If you DO have @poetech.us email, ping me back and we'll preserve the MX records during the DNS update.

## What this URL structure enables

**Vacation conversation handles:**
- "poetech.us" — works for almost everyone; lands them on the front door
- "poetech.us/?demo=family-of-4" — for a parent
- "poetech.us/?demo=separated" — for a divorced friend coordinating with an ex
- "poetech.us/?demo=professional" — for a therapist, lawyer, consultant
- "poetech.us/?demo=landlord" — for a small landlord

**Post-vacation expansion paths** (these don't ship today; they're enabled by having the domain in place):
- poetech.us/for-families — dedicated audience landing page → demo
- poetech.us/for-business-owners — same
- poetech.us/for-specialists — invite therapists, lawyers, etc. to join the marketplace
- poetech.us/for-communities — invite churches, schools, co-ops
- poetech.us/waitlist — email capture, audience-tagged
- poetech.us/about — the Poe family story, credentials, mission
- poetech.us/vision — the manifesto

These can layer in over the next month or two without touching the PWA infrastructure.

## Commit batch

```
cd C:\Users\dpoe\Kingdom-PWA-Node
git add app/src/poe-financial-mvp-v28.jsx docs/99-session-notes/2026-05-28-poetech-us-domain.md
git commit -m "Front door: first-time bare-URL landing reuses persona picker as the new poetech.us welcome page. Setup notes for DNS + Vercel custom domain in vacation-runbook companion."
git push
```

Once that lands, the code is ready. Then you do steps 1-4 above and poetech.us serves the app within minutes.
