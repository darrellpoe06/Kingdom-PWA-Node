# Hostinger Activation Checklist

**FOR DARRELL AT THE HOSTINGER DASHBOARD (browser at the laptop).**
These are point-and-click steps in the Hostinger web dashboard / Website Builder editor for the **TLC Therapy Solutions** site. They are NOT shell commands. Do them when you are back at the laptop and logged into the Hostinger account that hosts `tlctherapysolutions.me`.

Companion research: `docs/99-session-notes/2026-06-02-hostinger-underused-features-research.md`.

---

## Before you start — the one hard rule

**Nothing on Hostinger may ever hold TLC client data.** Hostinger's own Terms of Service disclaim HIPAA and they will NOT sign a BAA. So as you click through these:
- Do NOT turn on Hostinger's built-in **booking/appointments** for clients (keep Acuity).
- Do NOT add any **contact/intake form** that asks about health, symptoms, diagnoses, or insurance.
- Do NOT sell anything that ties a purchase to a named client/clinical record.
Marketing, SEO content, analytics, and email-to-a-list-of-opt-ins only.

---

## Step 0 — Confirm the plan (5 min, answers our open questions)

1. Log in at https://hpanel.hostinger.com
2. Note the **plan name/tier** (Premium / Business / Cloud Startup, Website Builder vs web hosting).
3. Note the **billing cycle and next renewal date**.
4. Note whether **Hostinger email mailboxes** exist on `tlctherapysolutions.me` (Emails section).
5. Send those four facts back so the research note's "assumed" items can be marked "verified."

## Step 1 — Re-point analytics to the live `.me` ($0)

1. In the Website Builder editor for `tlctherapysolutions.me`: open **Settings -> Analytics** (or Marketing -> Analytics).
2. Confirm the **built-in analytics** panel is on (it refreshes every 24h).
3. Add/confirm the **Google Analytics** ID points at the `.me` site. (The Google verification token is currently sitting on the `.com` redirect shell, so live traffic on the `.me` may not be tracked.)

## Step 2 — Turn on Hostinger Reach for an opt-in wellness newsletter ($0)

1. In the dashboard, open **Hostinger Reach** (email marketing / "Reach").
2. Create a list named clearly for MARKETING ONLY (e.g. "TLC Wellness Newsletter - opt-in").
3. Add a newsletter signup block on the site that feeds this list.
4. **Do not import any client list into Reach. Ever.** This list is only people who opt in from the public site.

## Step 3 — Run the AI SEO Assistant + AI writing over the thin pages ($0)

1. In the editor, open **AI tools -> SEO Assistant**. Run it for the homepage and each service page.
2. Use **AI writing** to flesh out the thin service/specialty descriptions (no client data, general practice info only).
3. Fix the **broken therapist-profile links** (Christina Poe, Sheronda Smith-Williams, etc.) that currently bounce to the generic "Find Your Therapist" page.
4. Consider adding an **FAQ** and **testimonials** section (use only testimonials you have written permission to publish).

## Step 4 — Confirm CDN + image optimization is on ($0)

1. The site already serves through Hostinger CDN (`hcdn`). In **Settings -> Performance** (or Speed/Optimization), confirm **image optimization / compression** is enabled for fast loads on older phones.

## Step 5 — Email decision (see open question Q2)

- Recommendation: keep **Google Workspace** (`contact@tlctherapysolutions.com`) as primary email. If the Hostinger `.me` mailboxes are unused, either set them to forward to the Google inbox or leave them off. Decide before paying twice.

## Step 6 — Calendar the renewal (the one real deadline)

- `tlctherapysolutions.com` **expires 2026-06-28** (GoDaddy). It carries the redirect to the `.me` AND the published `contact@` email domain. **Do not let it lapse.** Turn on auto-renew at GoDaddy or renew manually before June 28.

---

## NOT on this checklist (deliberately held)

- **COLG (Church of the Living God):** on Turbify, not Hostinger. Any change is Bishop Gwin's decision. See research note section 8 + open question Q3.
- **PoeTech:** stays on Vercel + NAS. Do not move it to Hostinger/Supabase (the YouTube video's path) — it would regress sovereignty. See research note section 3c + 4.
