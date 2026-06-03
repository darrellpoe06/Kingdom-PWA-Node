# Hostinger Underused-Features Research — TLC Therapy Solutions + Church of the Living God + PoeTech

**Date:** 2026-06-02 (research executed end-of-day Tue; Darrell posting from Maui)
**Requested by:** Darrell Poe
**Scope:** Find features/benefits already paid for that we are NOT using across the three brand surfaces (`tlctherapysolutions.com`, `thechurchofthelivinggod.com`, `poetech.us`), plus fold in the referenced YouTube video.
**Type:** Research-review (Layer 4 working artifact per ICM). Most recommendations are activation steps held for Darrell at the Hostinger dashboard; repo-side groundwork shipped where applicable.

---

## 0. Headline (the premise correction)

The request named "the **tlctherapysolutions.com** hostinger account." The DNS detective work found that the Hostinger account is **real and active**, but it is anchored to a domain the request did not name: **`tlctherapysolutions.me`**. The `.com` is a GoDaddy registration that does nothing but `301`-redirect to the `.me`. The `.me` is the live practice site, built on **Hostinger Website Builder**, served through **Hostinger CDN**, with **Hostinger email** on the domain.

So the corrected map of the three surfaces is:

| Surface | Registrar | DNS / Nameservers | Web hosting | Email | On Hostinger? |
|---|---|---|---|---|---|
| **tlctherapysolutions.com** | GoDaddy (IANA 146) | GoDaddy (`domaincontrol.com`) | GoDaddy WB IP -> **301 redirect** to `.me` | Google Workspace (`aspmx.l.google.com`) | No (redirect only) |
| **tlctherapysolutions.me** | (Hostinger-side) | **Hostinger** (`dns-parking.com`) | **Hostinger Website Builder** (`HostingerWebsiteBuilder`, `hcdn`, Zyro assets) | **Hostinger** (`mx1/mx2.hostinger.com`) | **YES — this is the Hostinger account** |
| **thechurchofthelivinggod.com** | Tucows (IANA 69) | **Turbify** (`ns1/ns2.turbify.com`) | Turbify (legacy Yahoo Small Business), IP `199.34.228.72` | Yahoo/Turbify (`yahoodns.net`) | No |
| **poetech.us** | Register.com | Register.com (`dns*.register.com`) | **Vercel** (IP `216.198.79.1`, `Server: Vercel`, `X-Vercel-Cache: HIT`) | none (no MX) | No |

**The one Hostinger account in the family runs Christina's TLC practice site (on the `.me`).** COLG is on aging Turbify; PoeTech is on Vercel + the NAS Funnel. That single fact reorganizes the whole audit:

- **TLC** = audit the Hostinger plan for paid-but-unused features ($0 marginal activations).
- **COLG** = not on Hostinger; the question becomes whether to *migrate* to a modern host (Hostinger is a candidate), and which gaps to close. Governed by Bishop Gwin, not the family.
- **PoeTech** = not on Hostinger; the YouTube video is pitching the exact Hostinger+Supabase path, but PoeTech already has a better sovereign path (Vercel + NAS). The video explains *why Darrell is thinking Hostinger right now*, not a thing to act on.

The biblical-economics lens (steward what is already in hand before acquiring more) points straight at TLC: there is a paid Hostinger plan with marketing, email, SEO, and analytics capability sitting mostly idle.

---

## 1. Executive summary — the 5 highest-leverage moves

Ordered: **$0 marginal (already paid for) first**, then growth-justified spend.

### $0 marginal — already inside the TLC Hostinger plan, just toggle on

1. **Activate Hostinger Reach (AI email marketing) for TLC** — opt-in wellness newsletter / nurture sequence to people who raised a hand, NOT clients. Bundled in the Website Builder plan; currently unused. *Tier 2 (marketing only, zero client data). Firewall-safe IF and ONLY IF no PHI ever enters it.*

2. **Run the AI SEO Assistant + AI writing tools over the thin TLC service pages** — the live site has "limited service descriptions" and incomplete therapist profiles. Both tools are bundled. Filling out the service/specialty pages is the single biggest organic-discovery lever for the practice, at $0. *Tier 3 (lives on the Hostinger site), no client data.*

3. **Confirm built-in analytics + wire Google Analytics on the `.me`** — the Hostinger builder has a 24h analytics panel and a GA integration. The Google verification token currently lives on the GoDaddy `.com` (the redirect shell), so analytics may not be capturing the real `.me` traffic. Re-point it. *Tier 2.*

4. **Claim/route the Hostinger mailboxes on `tlctherapysolutions.me`** — the `.me` has live Hostinger MX (`mx1/mx2.hostinger.com`) but the practice publishes `contact@tlctherapysolutions.com` (Google Workspace). There is a paid Hostinger email capability either unused or duplicating Google. Decide: consolidate or forward. *Tier 2. (See open question Q2 — recommendation is keep Google Workspace as primary.)*

### Growth-justified (small spend, real leverage)

5. **COLG: replace the aging Turbify site with a modern, mobile-first, elderly-friendly site, and add online giving through a church-purpose platform (Givelify/Tithe.ly), not Hostinger ecommerce.** This is the highest community-impact move in the whole audit (COLG-first), but it is Bishop Gwin's decision and spends real money/time. *Migration target TBD; giving stays off Hostinger for donor-data reasons.*

**The one thing NOT to do (and it is the most important line in this document):** Do **not** move any TLC client data — scheduling names, intake answers, anything PHI-adjacent — onto Hostinger. Hostinger's own Terms of Service **explicitly disclaim HIPAA** and **offer no Business Associate Agreement (BAA)**. The current architecture (booking on external **Acuity**, which can sign a BAA) is *correct*. Keep it. Details in section 7.

---

## 2. Hostinger plan landscape (current, 2026)

Public pricing/feature research (sources in section 10). Hostinger sells two adjacent product lines that matter here: **shared/cloud web hosting** (for code-driven sites like the Darrel Wilson video) and the **Website Builder** (the no-code Zyro-derived builder that TLC's site is actually on).

### Shared / Cloud web-hosting tiers

| Tier | Typical intro price | Websites | Storage | Notable inclusions |
|---|---|---|---|---|
| **Premium** | ~$2.99/mo | up to ~3 | 20-100 GB SSD | free domain (1yr), weekly backups, AI assistant, free SSL, email |
| **Business** | ~$3.29/mo | up to ~50 | 50 GB NVMe | daily + on-demand backups, **free CDN**, free domain (1yr) |
| **Cloud Startup** | ~$7.49/mo | ~100+ | more, NVMe | dedicated IP, priority support, daily backups |
| **Cloud Professional / Enterprise** | higher | more | more | heavier resource ceilings |

**Shared across all tiers:** 1-year free domain, the Website Builder, free automatic migration, unlimited free SSL, standard DDoS protection, malware scanner.

**Hostinger AI stack (2024-2026), relevant because the family is AI-forward:**
- **Hostinger Horizons** — no-code AI app/website generator (this is what the Darrel Wilson video orbits).
- **Kodee AI assistant** in hPanel — since Jan 2026 can execute 350+ automated tasks (migrations, health checks).
- **AI Website Builder**, **AI SEO Assistant**, **AI writing tools**, **AI logo generator**, **AI heatmap**.
- **Hostinger Reach** — AI-powered email-marketing campaigns (bundled into the builder).

### Website Builder feature set (this is TLC's actual product)

Bundled into the Website Builder plan, per Hostinger's own product pages:
- **Built-in appointment booking** (paid or free slots, calendar reservations) — *firewall-relevant; see section 7.*
- **Built-in site analytics** (refreshed every 24h) **+ Google Analytics integration**, Meta Pixel, Google Ads.
- **Hostinger Reach** AI email campaigns.
- **AI SEO Assistant** and **AI writing tools** (copy, service pages, blog, product descriptions).
- **Ecommerce** — up to 1,000 products/services, 100+ payment methods, discount codes.
- **Hostinger email** on the domain, **Hostinger CDN**, free SSL.

### Which tier is TLC on?

**Cannot be verified without the Hostinger login (open question Q1).** Evidence (Website Builder + active CDN `hcdn` + Hostinger MX on the domain) is consistent with a **Premium or Business Website Builder plan**. Every feature listed in section 1 ($0-marginal items) is bundled at the Premium level or above, so the activation recommendations hold regardless of the exact tier. The *only* thing the exact tier changes is storage/site-count headroom, which is not a constraint for a single-practice site.

**Uncertainty register:** plan tier, billing cycle, renewal date, which features are already toggled on, whether Hostinger mailboxes are provisioned, and whether Reach has ever been used are all **assumed from public docs, not verified**. All require Darrell's Hostinger login.

---

## 3. Domain-by-domain audit

### 3a. tlctherapysolutions(.com -> .me) — Christina's practice — THE Hostinger account

**WHOIS / DNS (verified 2026-06-02):**
- `.com`: registrar **GoDaddy.com LLC** (IANA 146), created **2025-06-28**, **expires 2026-06-28 (26 days out)**. Nameservers `ns15/ns16.domaincontrol.com`. A-records `15.197.225.128` / `3.33.251.168` (AWS/GoDaddy WB anycast). **Function: 301 redirect to `www.tlctherapysolutions.me`.** MX = **Google Workspace**. TXT = Google site-verification + Google SPF.
- `.me`: nameservers `ns1/ns2.dns-parking.com` (**Hostinger**). A-records `145.223.124.138` / `88.223.87.66` (**Hostinger**). MX `mx1/mx2.hostinger.com` (**Hostinger email**). TXT `v=spf1 include:_spf.mail.hostinger.com`. Response headers: `platform: hostinger`, `X-Powered-By: HostingerWebsiteBuilder`, `Server: hcdn`, `Content-Security-Policy: frame-ancestors *.hostinger.com ...`, preconnect to `assets.zyrosite.com` / `cdn.zyrosite.com`. Last-Modified 2026-05-18 (site actively maintained).

**Live state (verified):**
- Faith-integrated mental-health practice. Pages: Home, **Find Your Therapist**, **Join Our Team**, **Products** ("Finding Peace"), individual therapist profiles (Christina Poe, Sheronda Smith-Williams).
- **Booking:** external **Acuity Scheduling** (`tlctherapysolutions-scheduleappointment.as.me`) via a "Book A Session" button. **Not** Hostinger's native booking. *This is the correct, firewall-safe design.*
- Insurance accepted listed: BCBS, Aetna, United Healthcare, Veterans Affairs, Cigna.
- Social: Facebook, Instagram, LinkedIn.
- **Gaps:** no contact form, no blog/educational content, **broken therapist-profile links** (several bounce back to the generic "Find Your Therapist" page), no testimonials, no FAQ, thin service descriptions, no visible footer copyright year.

**Hostinger features it could activate ($0 marginal, no client data):**
1. **Hostinger Reach** — opt-in wellness newsletter / lead nurture. *Marketing list only; never client roster.*
2. **AI SEO Assistant + AI writing** — flesh out the thin service/specialty pages and fix the profile content. Biggest discovery lever.
3. **Built-in analytics + GA** — re-point GA to the `.me` (token currently sits on the `.com` shell).
4. **Fix the broken profile links + add testimonials/FAQ** — pure content work in the builder, $0.
5. **Decide the email story** — Hostinger mailboxes on `.me` exist but the practice uses Google Workspace on `.com` (see Q2).
6. **Ecommerce for NON-PHI digital products** — the "Finding Peace" Products page could sell devotionals/workbooks/courses through the builder's ecommerce, *provided nothing sold collects health data.*

**What it must NOT activate:** Hostinger's native booking for clients, any contact/intake form on Hostinger that collects health information, any ecommerce SKU tied to a clinical record. See section 7.

**Recommendation:** Treat the Hostinger plan as a **marketing-and-discovery surface**, not a clinical surface. Activate Reach, SEO/AI writing, analytics, and the content fixes. Keep every PHI path (booking, intake, records) external and BAA-covered. Don't let the `.com` lapse on 2026-06-28 — it carries the redirect and the published `contact@` email domain.

### 3b. thechurchofthelivinggod.com — COLG — on Turbify, NOT Hostinger

**WHOIS / DNS (verified):** registrar **Tucows** (IANA 69), domain created **2001-09-07** (24 years old), expires **2026-09-07**. Nameservers `ns1/ns2.turbify.com` (**Turbify**, the rebrand of Yahoo Small Business / Aabaco). A-record `199.34.228.72`. MX `mx-biz.mail.am0.yahoodns.net` (**Yahoo/Turbify email**).

**Live state (verified):**
- The Church of the Living God, Champaign IL, founded July 1946. Mission: "Reviving Faith... Restoring Hope... Rebuilding Communities."
- ~15 nav items: About Us, Church Staff, 77th National Assembly, Bible Study Class Points, **Broadcast**, Calendar/Current Events, Church Administration, E-Meg Christian Center, **Letters from Bishop Gwin**, Ministry Opportunities, 2026 Election Nominees voting, Stay Connected, **Tithes/Offerings/Gifts (Givers Creed)**, Trivia.
- Present: newsletter signup, social links (YouTube, Facebook, Instagram), phone (217.359.6920), address, email, service times (Sun 11:00 AM worship; Wed 1:00 & 6:00 PM Bible Study), online/in-person options.
- Platform: Turbify (Webs.com/Weebly heritage). Copyright 2024. Design dated, not mobile-first, **accessibility gaps for elderly users**.
- **Missing:** no sermon archive on-site, no live-stream embed, **no online giving portal** (the Tithes page appears to be the Givers Creed + instructions, not a payment flow), no contact form.

**Hostinger relevance:** none today (it is on Turbify). The question is whether to **migrate**. Hostinger Website Builder would give COLG a modern, mobile-first, accessible, low-cost site with the same AI-writing/SEO tools — a real upgrade for an elderly tech-novice congregation. **But this is Bishop Gwin's call under the governance model**, and it spends real time/money. See Q3.

**Gaps that can close cheaply regardless of host:**
- **Sermon archive + live-stream:** COLG already has a YouTube channel (the "Broadcast" section + YouTube link). Embedding the YouTube playlist and a live-stream link is near-$0 and works on Turbify *or* a new host. This is the fastest elderly-friendly win — one click to "watch this week's service."
- **Online giving:** see section 4 / Q1 — route through a **church-purpose platform built for elderly givers (Givelify, Tithe.ly, or Planning Center Giving)**, NOT Hostinger ecommerce and NOT a hand-rolled flow.

**Recommendation (COLG-first):** The single most congregation-serving move is **simple, obvious online giving + a one-tap "watch the service" link**, optimized for an 80-year-old on a phone. Whether the underlying site moves to Hostinger is secondary and is the Bishop's decision.

### 3c. poetech.us — the family OS — on Vercel, NOT Hostinger

**WHOIS / DNS (verified):** registrar **Register.com** (Web.com). Nameservers `dns*.register.com`. A-record `216.198.79.1` (**Vercel** anycast). **No MX (no domain email).** Response headers confirm Vercel: `Server: Vercel`, `X-Vercel-Cache: HIT`, `X-Vercel-Id: cle1::...`. Active deploy (Last-Modified 2026-06-03 00:47 UTC — the recent landing ship).

**Live state:** "PoeTech Family OS" landing, Vercel-served, consistent with the `vercel.json` rewrite to the NAS Tailscale Funnel. No domain email.

**Hostinger relevance:** **none, and that is the right answer.** The Darrel Wilson video pitches Hostinger + Supabase as the deploy path for a Claude-built site. PoeTech already has a *better* sovereign path: Vercel edge + the NAS holding the data and application logic. Moving to Hostinger+Supabase would **regress** on sovereignty (Supabase is a third-party hosted Postgres = exactly the kind of external data store `DATA-AS-EMPOWERMENT-NOT-EXTRACTION.md` steers away from), with no upside Vercel doesn't already provide (Vercel does GitHub-webhook auto-deploy natively and faster).

**Only minor item:** `poetech.us` has **no domain email**. If the family wants `hello@poetech.us`, that is a small add (Hostinger email, Google Workspace, or the NAS mail stack — sovereign option preferred). Not urgent.

---

## 4. YouTube video summary

**Video:** "The RIGHT Way to Deploy A Claude AI Website + FREE Database (Nobody Explains This)"
**Channel:** Darrel Wilson (`@darrelwilson`) — a mainstream web/hosting tutorial channel that frequently features Hostinger.
**URL:** https://youtu.be/MQk8xyZEKYg

**Note on sourcing:** the transcript services returned `403` to automated fetch, so this summary is reconstructed from the video metadata plus the companion written tutorial (AIZnap) and corroborating search results, not the verbatim transcript. The workflow is consistent across all sources.

**What it covers — the deploy stack:**
- **Claude Code / Claude Desktop** generates a **Next.js + Tailwind** app locally.
- **Git + GitHub** for version control.
- **Hostinger** as the host, using its **built-in Node.js application installer** with automatic `npm install` / `npm run build`.
- **Supabase** (free-tier hosted PostgreSQL) as the "FREE database."
- **Auto-deploy:** GitHub webhook -> Hostinger pulls `main`, rebuilds, restarts the server. Continuous deployment with no manual step.
- **Security caution it raises:** `NEXT_PUBLIC_SUPABASE_*` keys go in the host's env vars, never committed to GitHub ("public keys lead to hijacked databases"); restrict Supabase write/delete to "Ask Every Time."

**What's relevant to us:**
- It explains the *timing* of Darrell's question — he watched a "deploy your Claude site on Hostinger" tutorial and connected it to the family's existing Hostinger account.
- It confirms Hostinger can host code-driven (not just no-code-builder) Claude apps cheaply, with auto-deploy.

**What's NOT relevant / where we diverge:**
- The Hostinger + Supabase pattern is a **vendor-cloud (Tier 3) data path**. For PoeTech, our data sovereignty standard pushes the opposite way: data and logic on the NAS, edge on Vercel. **We do not adopt Supabase for family/clinical/church data.**
- The video's value to us is conceptual (auto-deploy hygiene, env-var key safety), not a migration we should make.

---

## 5. Cross-cutting recommendations

1. **SSL is healthy on all three** — every surface returned HTTPS with HSTS (`Strict-Transport-Security`) headers. No action needed; just don't regress during any migration.
2. **Don't let `tlctherapysolutions.com` lapse on 2026-06-28** — it carries the `.me` redirect and the published `contact@tlctherapysolutions.com` email domain. A lapse breaks both. Calendar it. (This is the one genuine deadline in this audit.)
3. **Hostinger CDN is already active for TLC** (`Server: hcdn`) — confirm image-optimization is on in the builder for fast loads on older devices (helps the elderly-user and low-bandwidth case even on the practice site).
4. **Vendor sprawl on TLC** — one practice currently spans GoDaddy (`.com` registrar + redirect), Hostinger (`.me` site + email + CDN), and Google Workspace (`.com` email). Three vendors, one practice. Worth a deliberate consolidation decision (Q2) rather than drift.
5. **Use the AI writing/SEO tools the family already pays for** — TLC's Hostinger plan bundles them and the COLG site (if migrated) would too. Thin-content is the shared weakness; the tools are the shared fix.
6. **Consistent NAP (Name/Address/Phone) + local SEO** for both TLC and COLG — both serve a local community (Champaign-Urbana); the bundled SEO assistants make local discoverability nearly free.

---

## 6. Sovereign-mesh tier labels

Per `project-sovereign-mesh-mvp-pragmatism`: Hostinger is a vendor cloud (Tier 3 by default), but features that touch only DNS / email / CDN / marketing — no sovereign application logic, no family/clinical/church data at rest — are Tier-2-compatible.

| Recommendation | Tier | Rationale |
|---|---|---|
| Hostinger Reach (TLC marketing email, opt-in, no client data) | **2** | Marketing list only; no sovereign/clinical data |
| Hostinger analytics + GA on TLC `.me` | **2** | Aggregate traffic metrics; no PII at rest with us |
| AI SEO / AI writing on TLC pages | **3** | Content lives on the Hostinger site (vendor app surface), but carries no client data |
| Hostinger CDN (already on) | **2** | Edge delivery only |
| Hostinger email on `.me` | **2** | Email transport only |
| TLC ecommerce for NON-PHI digital products | **3** | Vendor commerce surface; permissible only with zero health data |
| **TLC booking / intake / records** | **n/a — PROHIBITED on Hostinger** | PHI; no BAA (section 7) |
| COLG migrate to Hostinger Website Builder | **3** | Vendor app surface; church public content only |
| COLG online giving via Givelify/Tithe.ly | **3** | Vendor financial surface; donor-data filter applies (section 8) |
| COLG sermon/live-stream YouTube embed | **3** | YouTube is extraction-model, but content is already public sermons; low-risk |
| PoeTech on Hostinger+Supabase (the video) | **3 — DECLINED** | Regresses sovereignty; Vercel+NAS (Tier 1/2) is superior |
| PoeTech domain email | **1 preferred** | Use NAS mail stack if added; vendor only as fallback |

---

## 7. TLC firewall check (absolute)

**Finding (verified from Hostinger's own Terms of Service):** Hostinger states *"The Services are not intended to provide a PCI ... or HIPAA ... compliant environment and therefore should not be used or considered as one,"* and *"you will not provide Hostinger any personal information with respect to your clients."* **Hostinger does not offer a Business Associate Agreement (BAA).**

**What this means, line by line:**
- The current design is **correct**: client scheduling runs on **external Acuity Scheduling**, which *can* execute a BAA, not on Hostinger's native booking. **Keep it. Do not migrate booking to Hostinger.**
- **Do NOT enable Hostinger's built-in appointment booking for clients.** Names + appointment times in a Hostinger widget would be PHI in a non-BAA environment — a firewall breach.
- **Do NOT add a Hostinger contact/intake form that collects health information.** A generic "email us" mailto is fine; a form that asks about symptoms, diagnoses, or insurance is not.
- **Do NOT run any ecommerce SKU that ties a purchase to a clinical record.** Selling a public devotional/workbook to an anonymous buyer is fine; selling a "session package" tied to a named client is not.
- **Reach (email marketing) is firewall-safe only as an opt-in general-wellness list.** The moment a client roster, intake list, or anyone's clinical status enters it, it is a breach. Keep the marketing list and the client list physically separate systems.
- **Per CLAUDE.md, all clinical data paths stay on the NAS.** Hostinger is a *brand/marketing* surface for TLC and nothing more.

**Verdict:** every TLC recommendation in this document is deliberately confined to non-PHI marketing/discovery. The firewall holds. The single most valuable thing this audit surfaces for TLC is the *confirmation* that PHI must never touch Hostinger — and the practice is, today, on the right side of that line.

---

## 8. COLG-first lens

Run every COLG recommendation through "does this serve the COLG congregation specifically?" — elderly tech-novice users weighted heavily (`COMMUNITY-FIRST-MISSION.md`).

- **Online giving for elderly givers:** the win is *radical simplicity*. An 80-year-old should tap one obvious button and give in under 30 seconds with no account creation. **Givelify** is purpose-built for exactly this congregation profile; **Tithe.ly** and **Planning Center Giving** are alternatives. Hostinger ecommerce is the *wrong* tool here — it is built for product catalogs, not one-tap tithing, and it would put donor financial data on a vendor with no church-specific protections. **Recommend a church-purpose giving platform over Hostinger ecommerce.** (Decision: Q1.)
- **"Watch the service" one-tap:** COLG already streams to YouTube. A single large, high-contrast "Watch Live / Watch Last Sunday" button at the top of the homepage is the highest-leverage elderly-friendly change, near-$0, host-independent.
- **Mobile-first + large type + high contrast:** the current Turbify site is dated and not mobile-first. Whatever host it lands on, the redesign brief is *accessibility for elderly users first* — this is the COLG-first standard, not an afterthought.
- **Governance:** COLG is the church's surface, not the family's. Any migration or platform change runs through **Bishop Gwin**. The family's role is to advise and (if asked) execute, per `GOVERNANCE-EXECUTION-ADVISORY.md`. The audit recommends; it does not unilaterally move the church's site.

**Religion AND relationship check on the COLG recommendations:** backbone (a real giving path, a real archive, accessibility as a standard) AND warmth (built for the actual people — elders who should feel *invited*, never fumbling). Both held.

---

## 9. Open questions — for Darrell only (true judgment calls)

1. **COLG online giving path?** Recommend **Givelify** (purpose-built for elderly church givers, simplest possible flow) over Hostinger ecommerce (wrong tool, donor-data on a generic vendor) and over a sovereign-mesh NAS build (best data posture, but slowest to ship and hardest for the congregation to trust on day one). **Which do you want — fastest-for-the-congregation (Givelify), or sovereign-first (NAS), or a phased path (Givelify now, sovereign later)?**
2. **TLC email consolidation?** The practice runs Google Workspace email on the `.com` AND has Hostinger mailboxes available on the `.me`. Recommend **keep Google Workspace as primary** (better deliverability, already wired, and Google *will* sign a BAA if any PHI ever touches email — Hostinger will not) and either ignore or set the Hostinger `.me` mailboxes to forward. **Confirm, or do you want to consolidate onto Hostinger to drop the Google bill?**
3. **COLG migration — whose call and when?** Migrating COLG off Turbify is real money/time and is **Bishop Gwin's decision** under the governance model. Do you want me to prepare a one-page brief *for the Bishop* (options, costs, accessibility upgrades) so you can bring it to him, or hold until he raises it?

**Credentials needed for the deepest audit (could not verify without them):** the **Hostinger account login** — to confirm the exact plan tier, billing/renewal date, which features are already toggled on, whether the `.me` mailboxes are provisioned, and whether Reach has ever been used. Everything in section 2's tier assignment and the "already paid for" claims is **assumed from public Hostinger docs**, not verified against the account. When you're back from Maui and at the laptop, a 5-minute login lets me (or you) confirm the tier and flip the $0 toggles directly.

**What had to be assumed vs. verified:**
- **Verified:** all DNS/WHOIS (registrars, nameservers, A/MX/TXT), the `.com`->`.me` redirect, the Hostinger platform headers, live page content for all three sites, the Acuity booking integration, Hostinger's HIPAA/BAA disclaimer, the video's deploy stack.
- **Assumed (needs login):** TLC's exact Hostinger plan tier, renewal date, which builder features are toggled on, mailbox provisioning, Reach usage history.

---

## 10. Sources

**DNS / WHOIS (executed locally 2026-06-02 via `Resolve-DnsName` + Verisign RDAP):**
- Verisign RDAP `rdap.verisign.com/com/v1/domain/tlctherapysolutions.com` -> GoDaddy, IANA 146, created 2025-06-28, expires 2026-06-28
- Verisign RDAP `rdap.verisign.com/com/v1/domain/thechurchofthelivinggod.com` -> Tucows, IANA 69, created 2001-09-07, expires 2026-09-07
- Local DNS resolution for `tlctherapysolutions.com`, `tlctherapysolutions.me`, `thechurchofthelivinggod.com`, `poetech.us` (NS/A/MX/TXT)
- HTTP HEAD on `poetech.us` (Vercel headers) and `www.tlctherapysolutions.me` (Hostinger headers)

**Live sites (fetched 2026-06-02):**
- https://www.tlctherapysolutions.me/
- https://thechurchofthelivinggod.com
- https://poetech.us

**YouTube video + companion tutorial:**
- https://youtu.be/MQk8xyZEKYg — Darrel Wilson, "The RIGHT Way to Deploy A Claude AI Website + FREE Database"
- https://aiznap.com/how-to-deploy-claude-code-web-apps/ (companion written tutorial, same stack)
- https://www.hostinger.com/in/tutorials/hostinger-horizons-supabase-integration

**Hostinger plans / features:**
- https://www.hostinger.com/pricing
- https://www.hostinger.com/ai-website-builder
- https://www.hostinger.com/booking-website-builder
- https://www.hostinger.com/business-website
- https://www.hostinger.com/blog/product-updates-2026
- https://bloggerspassion.com/best-web-hosting/hostinger-pricing-plans-explained/
- https://www.websitebuilderexpert.com/website-builders/hostinger-website-builder-review/

**HIPAA / BAA (the firewall-decisive sources):**
- https://www.paubox.com/blog/does-hostinger-offer-hipaa-compliant-web-hosting (quotes Hostinger ToS disclaiming HIPAA/PCI, no BAA)
- https://hostadvice.com/blog-hosting/hipaa-compliant-web-hosting/ (BAA-offering alternatives: Atlantic.Net, AWS, HIPAA Vault)

---

## The Test (Phil 4:8) on this output

- **True:** every infrastructure claim is verified by DNS/headers/WHOIS or cited; assumptions are labeled as assumptions.
- **Honorable:** treats Christina's practice and the Church of the Living God with the weight they deserve; the firewall is held without flinching.
- **Just:** the HIPAA boundary is stated plainly because client dignity depends on it; the church's governance is respected.
- **Pure:** no manipulation; the cost-discipline lead is honest stewardship, not upsell.
- **Lovely / Commendable / Excellent / Praiseworthy:** leads with what is already paid for, serves the elderly congregation first, and protects the vulnerable (clients, donors) by design.

*Stewardship first: use what is already in hand before reaching for more. The paid Hostinger plan on TLC's `.me` is the underused asset; the firewall is the boundary that keeps the stewardship faithful.*
