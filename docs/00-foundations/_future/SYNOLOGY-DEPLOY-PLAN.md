# Synology DS1621xs · Family-Test Deploy Plan

> Status: **Draft, 2026-05-23.** First working pass at hosting the PoeTech Family OS PWA and a real database on Darrell's Synology DS1621xs so Christina and the kids can install on any device, use the app, and submit feedback that collects in one shared place. Aligned with the binding principle in `PROJECT-FRAMEWORK.md` §1 — open-source, portable, vendor-independent.

---

## 1. What this plan delivers

A single canonical URL — reachable on the home LAN and from outside the house — that:

- Serves the latest commit of the React PWA on every refresh.
- Backs every family member's install with a real Postgres database, so the same data is consistent across Darrell's laptop, Christina's laptop, both phones, and any other device that installs the PWA.
- Sends in-app feedback to a shared destination so Darrell and Claude can both see it.
- Stays on Darrell's hardware. No vendor lock-in. No external account required to use it.

When this is done, Darrell uninstalls the 17 old PoeTech Family OS PWAs (or leaves them alone — they're orphaned but harmless), then each family member installs ONE PWA from the new URL on each of their devices.

---

## 2. Two reachable URLs (both kept)

- **Home LAN:** `https://192.168.1.26:5001/...` and a new entry behind the reverse proxy (see §5). Fast inside the house, never leaves the network.
- **Outside the house:** `https://192-168-1-26.poetech.direct.quickconnect.to:5001/...` and a new reverse-proxy entry. Synology already provides a valid TLS cert via QuickConnect.

The PWA install bonds to the URL it was installed against. Family installs against the **outside-the-house URL** so the same install works at home and away (avoiding mixed-network drama).

---

## 3. Stack

Three containers managed by Container Manager (DSM 7.2+'s rebranded Docker package), one reverse proxy entry, and the existing Synology TLS certificate.

1. **Static web container** — `nginx:alpine` serving the React `dist/` build from a Synology shared folder. Reverse-proxied as `https://app.poetech.direct.quickconnect.to/`.
2. **Supabase self-hosted** — the official Supabase Docker Compose bundle (Postgres + GoTrue auth + PostgREST API + Realtime + Storage). Reverse-proxied as `https://db.poetech.direct.quickconnect.to/` (Studio admin) and `https://api.poetech.direct.quickconnect.to/` (the PostgREST API that the React app calls).
3. **Optional: `watchtower`** — for auto-updating container images on a schedule.

Why Supabase specifically: open-source (MIT/Apache), self-hostable Docker compose, gives us Postgres + magic-link email auth + row-level security in one bundle. If we later want to migrate off, the data is plain Postgres — no proprietary format.

---

## 4. What we need on DSM (verify before we run anything)

Open Package Center on Your DSM and confirm the following are installed. If any are missing, install them — they're all free, official, and one-click.

- **Container Manager** (DSM 7.2+) — runs all three containers above. (On DSM 7.1, the older "Docker" package is the equivalent.)
- **Web Station** — not strictly required for this plan (we use an nginx container instead), but nice to have if we later want simpler static hosting.
- **Synology Reverse Proxy** is built into Control Panel → Login Portal → Advanced → Reverse Proxy. Nothing to install. We just add three rules.

Also confirm:

- The Synology has a directory we can write builds into. A new shared folder named `poetech-app` works well — that's where the React `dist/` lands.
- Port 443 is reachable from outside via QuickConnect (it already is, since DSM is at `:5001` over QuickConnect).
- The Synology system account `root` has Docker permissions (it does, by default).

---

## 5. Reverse-proxy rules (Control Panel → Login Portal → Advanced → Reverse Proxy)

Three rules, each one mapping a subdomain on `*.poetech.direct.quickconnect.to` to a local container port.

| Source                                                          | Destination                  |
|-----------------------------------------------------------------|------------------------------|
| `https://app.poetech.direct.quickconnect.to` (443)              | `http://localhost:8080` (nginx container)        |
| `https://api.poetech.direct.quickconnect.to` (443)              | `http://localhost:8000` (Supabase API gateway)   |
| `https://db.poetech.direct.quickconnect.to` (443)               | `http://localhost:3000` (Supabase Studio admin)  |

Synology auto-generates valid TLS certs for `*.poetech.direct.quickconnect.to` via Let's Encrypt — no manual cert management.

---

## 6. Build and deploy loop

Two paths, ordered by how soon they ship:

**v0 — manual, today.** Darrell runs `npm run build` on his laptop, then drags the resulting `app/dist/` folder over SMB into the Synology `poetech-app` shared folder. The nginx container serves it. Whenever a new commit lands and he wants the family to see it, repeat.

**v1 — automatic, next.** A GitHub Action triggered on push to `main`:
1. Runs `npm run build` in CI.
2. SSHes to the Synology over Tailscale or a long-lived deploy key.
3. Rsyncs the `dist/` into the shared folder.
4. Nothing else — nginx picks up the new files immediately.

(v1 keeps the binding principle intact: GitHub is the source-of-truth, but the actual running app is on Darrell's hardware. GitHub is opt-in convenience, not a required runtime.)

---

## 7. Schema for the database

Already drafted from the `app/src/shims/storage.js` inventory done 2026-05-23 (see the Layer-2 task in the working spine). Tables, one per logical entity in the localStorage blob: `entities`, `accounts`, `transactions`, `debts`, `rentals`, `projects`, `scopes`, `events`, `contractors_1099`, `inquiries`, `feedback`, `skill_profiles`, `capex_items`, `incidents`, etc. Each table gets a `family_id` column and a row-level-security policy: *"a row is visible only to members of the family it belongs to."* Family membership comes from a `family_members` join table linking Supabase auth users to family IDs.

The Counseling sub-tab stays per-device — its PIN + AES-GCM design is intentionally device-local and is NOT migrated to the database.

The `feedback` table is the family-wide collection point for the in-app Feedback button → modal. Every entry includes who submitted it, which device, which tab, what they typed.

---

## 8. What only Darrell can do (no surprises)

These four steps are physically gated behind Darrell's Synology login and his Synology account; Claude cannot do them.

1. **Confirm Container Manager is installed** on DSM (or install it from Package Center).
2. **Create the `poetech-app` shared folder.** Control Panel → Shared Folder → Create.
3. **Add the three Reverse Proxy rules** in §5.
4. **Approve Synology auto-generating Let's Encrypt certs** for the three new subdomains (a checkbox during reverse-proxy setup).

After those four, Claude can drive the rest from the Container Manager UI via the Claude-in-Chrome extension (deploying the nginx + Supabase containers, configuring environment variables, walking through the first auth signup, etc.).

---

## 9. Family install pattern (the actual answer to "everyone can use it")

Once the URL is live:

1. **Darrell's laptop** — open Chrome to `https://app.poetech.direct.quickconnect.to/`, click the "Install" icon in the address bar, get one PoeTech Family OS icon.
2. **Christina's laptop** — same.
3. **Both phones (Android/iOS)** — open Chrome/Safari to the same URL, "Add to Home Screen" / "Install app".
4. **Christiana and the twins' devices** — same. (Age-appropriate UX is a future task; for now the app works on any device.)
5. Everyone signs in with magic-link email — no passwords typed by anyone, ever. Each family member's account is linked to the Poe family via the `family_members` table, so all see the same data.

---

## 10. Migration path from the 17 orphaned PWAs

Once the canonical URL is live and Darrell has confirmed it loads correctly, the old 17 PWAs are obsolete. Two options:

- **Lazy:** Leave them alone. They're cosmetic clutter in the Start menu, not blocking anything. Delete the desktop shortcuts only.
- **Clean:** Open `chrome://apps` in Chrome, right-click each PoeTech Family OS card, "Remove from Chrome", confirm. Takes ~30 seconds per app, ~9 minutes total. Claude can drive this via the Claude-in-Chrome extension once the extension is connected.

---

## 11. Open questions for Darrell (one place to find them)

- Does Container Manager show up in Your Package Center, or do You see "Docker" (the older name)? Both work; the UI is slightly different.
- Is `poetech-app` an acceptable name for the shared folder, or do You want a different name?
- Do You want me to drive the Synology DSM via Claude-in-Chrome (faster, You watch), or walk You through with screenshots and tooltips (slower, You learn the muscle memory)?
- Magic-link auth means every family member needs an email address. Christiana has one. The twins (10yo) — do they have their own email yet, or should we use a parent-managed alias (e.g., `twins-alex@poefamily.local`)?

---

*This document supersedes the earlier "Layer 1 = Vercel" thinking. Vercel is no longer in the plan because Synology hosting matches the binding open-source + portable + vendor-independent principle directly. See `PROJECT-FRAMEWORK.md` §1.*
