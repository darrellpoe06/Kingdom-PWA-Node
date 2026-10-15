# Cloudflare support package — Pages Functions upload but never execute (#2057, day 6)

**Written 2026-10-15 for Darrell to paste into a Cloudflare support ticket.**
Everything below is measured from GitHub-hosted runners, not inferred. The
repository is `darrellpoe06/Kingdom-PWA-Node`; the Pages project is
`poetech-app`; the custom domain is `poetech.us`.

---

## Paste this into the ticket

> **Summary:** Since 2026-10-09, no Pages Function on our project has been
> invoked. Every deploy logs "Uploading Functions bundle" and succeeds, the
> static assets serve correctly and are current, but every Function route
> answers with the SPA shell (`text/html`) instead of running. This affects the
> custom domain, the `*.pages.dev` alias, and the per-deployment preview host
> simultaneously, so it is not DNS, not caching, and not a routing table we
> control.
>
> **Project:** poetech-app · **Custom domain:** poetech.us
>
> **Expected:** `GET https://poetech.us/automation-status` executes
> `functions/automation-status.js` and returns `application/json`.
>
> **Observed, every run since 2026-10-09:**
> ```
> GET https://poetech.us/automation-status
>   HTTP 200
>   content-type: text/html; charset=utf-8
>   body: <!DOCTYPE html> ... (the SPA index shell)
> ```
> Identical on `poetech-app.pages.dev` and on the per-deployment host.
>
> **What we have already ruled out, with measurements:**
> 1. **Not a stale deploy.** The served build hash equals `main` on every run
>    (most recent: `ef26a33` served, `ef26a33` on main). Assets are current.
> 2. **Not DNS or the custom domain.** All three hosts fail identically.
> 3. **Not an explicit routing table.** We added an explicit `_routes.json`;
>    behaviour did not change. (We also note a 200 on `/_routes.json` is
>    uninformative — a Pages SPA answers 200 with the shell on any unknown
>    path — so we are not claiming anything from that probe either way.)
> 4. **Not a build failure.** Deploys succeed and log the Functions bundle
>    upload.
> 5. **Not intermittent.** 6 consecutive days, every scheduled probe, no
>    successful Function invocation in that window.
>
> **What we need:** whether this project's Functions are disabled, quarantined,
> or failing to bind on your side, and what we must change to restore them.
>
> **Impact:** this is a church and family application. Every backend road is a
> Pages Function, so while this is true, sign-in, each member's own record, the
> choir roster, the harvest ledger, the cameras, the reading voice and the
> property photos are all unreachable for every user at once.

---

## Context for us, not for the ticket

**The temporary unlock is what the family is running on now.** Because every
Function is dark, `deploy-cloudflare-pages.yml` repoints the client at the
absolute Tailscale Funnel origin (`https://poetech.tail5a2f35.ts.net/sb`)
instead of same-origin `poetech.us/sb`. That is what keeps sign-in alive at
all. It carries a hazard the deploy file names out loud and accepted
knowingly on 2026-10-09:

> "The throttle is not firing right now. It may begin firing under real family
> load — that is the risk being accepted, knowingly, against a family that is
> locked out of its own app with meetings to keep."

**The witness cannot currently see that hazard.** `site-health.yml`'s backend
step is a single `GET {SB_URL}/auth/v1/health` with the anon key, from a
datacenter, **carrying no `Origin` header** — so it is not a cross-origin
request and it cannot exercise the Funnel's cross-origin throttle. The app
makes cross-origin POSTs from a phone. So `BACKEND_CODE: 200` means "the road
answers a probe", not "the app can use the road", and those are not the same
sentence. That gap is DR-1053's rule one layer down, at the instrument.

**Revert both the moment Functions run again:** the `/sb` repoint and the
`/cams`, `/voice-lite`, `/nas-photos` unlocks all have the same lifetime.
