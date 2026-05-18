# PoeTech Family OS · Glossary

Plain-language definitions for everything in the app. Alphabetical. Tap-friendly for SME review.

> **Capitalization rule** (per `CLAUDE.md`): Yahweh / Jesus / Holy Spirit / Father / Son are always capitalized including pronouns. lucifer / satan / the devil / the adversary are never capitalized as proper names. This glossary follows the rule.

---

## A

**Action Queue** — The triage panel at the top of Big Picture. Lists every open Change, Incident, and active Project from across the app so you don't have to bounce between tabs to see "what's on fire today." Click any row to jump to the source. Tap **+ Add item** to create one manually with the urgency rules shown inline.

**Accounts** (Books → Accounts) — Every checking, savings, cash, investment, credit-card, and loan account you've added. Grouped by entity. Bank accounts are visually primary (the cash you can spend); credit and loans are secondary (debt you owe).

**Action items** — Generic term for any open Change, Incident, or Project. See ITSM Urgency below.

**API token (PWA_API_TOKEN)** — A long random string the PWA uses to authenticate to the Cloudflare Worker backend (Voice Ops / Phase 1). Stored locally on each device. Never committed to git, never sent to PoeTech central.

**Assignment / Owned-by** *(planned round 13)* — Which family member is responsible for an open Action Queue item.

**Audit log** *(planned multi-tenant)* — A record of every meaningful state change (subscription tier change, module enable/disable, tenant resolved, etc.). For compliance + decision history.

## B

**BAA (Business Associate Agreement)** — HIPAA contract required between a covered entity (e.g., a therapy practice) and any vendor that handles Protected Health Information. Twilio and Cloudflare offer BAAs only on Enterprise tiers; this is why TLC routes are isolated from Phase 1 Voice Ops.

**Big Picture** — The home tab. Shows the Action Queue, Capacity meter, cross-reference strip, hero metrics (net cash flow, debt-free date, rentals-paid-off date), entity strip, pressure slider, money date packet, upcoming events.

**Books** — Multi-entity bookkeeping. Sub-tabs: Entities, Accounts, Transactions, Calendar, Cart, 1099.

**Buffer Fund** — A liquid reserve set aside to time mortgage payments before the 1st of each month. Lives in Books → Accounts. Target editable; current balance is a slider for fast updates. Spec source: the original Poe Family Financial Control System v1 → "single highest-ROI move you can make."

## C

**Capacity meter** — Family-wide hrs/wk math. Sum of all active projects' `hoursPerWeek` vs. sum of all skill profiles' available hours. Green <80% (healthy), amber 80–100% (tight), rust >100% (over-committed). New projects past the line get parked as TBD by default. See Capacity Guard.

**Capacity Guard** — The check that runs before any new project is auto-created (from Dev/Ops "Wrap me with the tech," from Action Queue "+ Add item," from Tenant-as-Project escalation). If the new project would push family over 80% capacity, prompts to add as TBD instead.

**Capex / Capital Spend** — Tools, equipment, hardware the household or businesses plan to buy. Lives in Projects → Inventory & Capital Forecast. Each item can link to a project, an entity, an account that pays, and a target purchase date. Open items feed the 12-month forecast.

**Change** (ITSM urgency band) — Something is broken **NOW**. Same-day due. Symbol: ⚡. Routes to Incidents with `urgency='change'`.

**Church (tab)** — Home-church tab. Surfaces service times, broadcast/social, tithes link, ministry openings from thechurchofthelivinggod.com. Local prayer-request log with optional mailto-send.

**Cloudflare D1** — Free Cloudflare-managed SQLite-compatible database. Hosts Voice Ops voicemail records. 5 GB free, 5M reads/day free.

**Cloudflare Worker** — Free Cloudflare serverless function. Hosts the Voice Ops backend that Twilio webhooks post to and the PWA Inbound tab fetches from.

**CORS proxy** — A public service that re-fetches a third-party URL and adds the `Access-Control-Allow-Origin` header so the browser accepts the response. Used in Markets tab because Stooq doesn't send browser-friendly CORS headers directly. Falls back through corsproxy.io → allorigins.win.

**Cross-reference strip** — The five-cell row on Big Picture (Property work · Equipment · Leases · Capex open · Watchlist). Each cell jumps to the source tab when clicked.

## D

**Debts** — Tab. Consumer and business debt with avalanche / snowball / cash-flow side-by-side strategy comparison.

**Dev/Ops** — Tab. Personalized entrepreneurial-options engine. Skill profiles → matched options from the ~46-entry library → "Wrap me with the tech" CTA (Premium) that auto-creates a Project + Scope + Capex item.

**Dueteronomy 14:22-29 tithe pattern** — Background financial discipline encoded in the Foundation tier's free-forever stance.

## E

**Entity** — A separate set of books. Default seeded: Personal (household), Poe Properties LLC, PoeTech LLC, TLC Therapy Solutions LLC. Each account, debt, and rental belongs to exactly one entity.

**Equipment inventory** — Per-property mechanical inventory (HVAC, water heater, appliances, etc.) with make/model/serial/install/warranty fields. Lives in Real Estate → Records → Equipment.

**Excellence Standard** — Foundation document. Religion AND relationship — backbone + warmth. See `/docs/00-foundations/_root/EXCELLENCE-STANDARD.md`.

## F

**Feedback Log** — Tab? No — section inside About. Every submitted feedback note with its status, internal PoeTech notes, and reply to the user. The customer-service-score loop.

**Foundation tier** — Free forever. Big Picture, Books (2-entity cap), Debts, Markets (5-ticker cap), Church, Dev/Ops (1 option/profile + view-only services), Real Estate read-only preview.

## G

**Glacier** — Theme inspired by One UI's visual language. Cool blue-tinted surface, larger rounded corners (22px+), pill-style buttons, blue accent. No brand affiliation.

**Glossary** — This file.

## H

**HIPAA** — Health Insurance Portability and Accountability Act. The reason TLC voicemails never flow through Phase 1 Voice Ops — PHI requires BAAs from every vendor that touches the data. TLC stays on Christina's separate setup until Phase 3.

**Home Command** — Planned module. IoT sensor integration, F&S-level alarms, seasonal maintenance calendar. Not in current MVP.

## I

**Incident** (ITSM urgency band) — Something that needs resolution within ~3 days. Symbol: ! . The default urgency when adding an Action Queue item.

**Inbound** *(📞 tab)* — Voicemails from Twilio routed via the Voice Ops Cloudflare Worker. Per row: line, caller, transcript, audio playback, three convert buttons (Incident / Practice Inquiry / Project). TLC NEVER routes here.

**Inquiry** (Practice) — A pre-intake contact from a prospective client. Captured in Practice tab. Source-attributed (referral / church / FB / etc.). No PHI. Once they book a session, the relationship moves to Acuity.

**Instance config** *(planned Phase 1 multi-instance)* — `data.instance = { brandName, instanceType, accentColor, enabledModules, welcomeMessage }`. Lets each customer (family, biz, church) brand their own copy of the app.

**ITSM** — Information Technology Service Management. The Change / Incident / Project urgency taxonomy borrowed from ITSM and applied to family operations.

## L

**Lease (per property)** — Lease start, end, monthly rent, deposit, late-fee policy, signed-doc URL. Lives in Real Estate → Records → Lease & Tenant.

**Loved Ones tier** — First 100 founding families. Free PoeTech+ for life. Locked even when prices rise.

## M

**Maintenance log** — Per-property timestamped repair history with photos, vendor, cost, urgency band. Lives in Real Estate → Records → Maintenance.

**Markets** — Tab. Free stock/ETF/crypto watchlist powered by Stooq via corsproxy.io.

**Materials-paid-by** — Scope-form field that drives Payment Terms. Contractor-supplies → 50/50. Owner-supplies → pay full at completion (or 20% start fee).

**MetricCell** — The standard small-tile UI component. Label + value + optional subhead + optional rust/green accent.

**Midnight** — Theme: pure black OLED-friendly dark mode. Default.

**Module** — A major capability domain (Financial OS, Home Command, Practice Operations, Education, Tutors, Elder Care, Markets, Church, etc.). Each tier unlocks more modules.

## P

**Payment Terms** — Free-text field on every Scope of Work agreement. Auto-suggested by the Materials-paid-by picker; user can edit.

**Practice** — Tab. Pre-intake inquiry tracking for TLC (or any clinical practice). No PHI.

**Pressure slider** — Big Picture control. 1 (loose) → 10 (sprint). Models how aggressively the family attacks consumer debt + closes the rent gap. Drives the years-to-debt-free projection.

**Project** (ITSM urgency band) — Multi-day planned work. Symbol: ◆. Routes to the Projects tab. Capacity check applies before auto-create.

**Project Inventory** (Projects → Inventory · Capital Forecast) — Capex items with target purchase dates, 12-month forecast, and per-item savings prompts.

## R

**Real Estate** — Tab. 11 doors of Poe Properties (or however many the user has). Per property: lease, tenant, equipment, rooms, maintenance, conversations, evaluator (cap rate / DSCR / 1% / GRM), market valuation lookup, snowball math.

**Rentals snowball** — The 7-year payoff strategy. Sort by smallest balance / highest rate / best cash flow.

**Rooms & Needed Work** — Per-property room-by-room work tracker (Plumbing → Sink → needs-work, etc.). Replaces the original Real Estate App spec's room-level item list.

## S

**Scope (of Work)** — A contractor agreement. Templates: Property Contractor, Service Engagement, Clinical Contractor, Custom. Includes materials-paid-by + auto-suggested payment terms.

**Skill profile** — Per family member: skills (comma-tags), hours/week available, monthly income, location, tech comfort. Feeds the Dev/Ops options matcher AND the Capacity meter.

**Snow** — Theme inspired by iOS visual language. Off-white surface (#F2F2F7), pure-white cards with subtle shadows, 12px corners, near-black text. No brand affiliation.

**Snowball (debt)** — Sort by smallest balance first → momentum-driven payoff.

**Snowball (rentals)** — Apply extra monthly cash to the rental mortgage that pays off first; cascade frees up P&I for the next.

**Stooq** — Free public market data provider (stooq.com). Routed through corsproxy.io because Stooq doesn't send browser CORS headers.

## T

**TBD (project status)** — Parking lot for projects the family can't currently staff. Doesn't count toward Capacity meter. Can be promoted to `planning` via the Promote button when bandwidth opens up.

**Tenant Not Paying** — Rust-bordered card on a property's row when its status is `late`. Three urgency buttons: Change / Incident / Project. One tap opens the right kind of issue, linked back to the property.

**Tier (subscription)** — Foundation (free) · PoeTech+ ($39) · Family ($89) · Premium ($149) · Business ($249). Plus special tiers: Loved Ones (free for life, first 100), Community (sponsored), Community Partners (mission-aligned orgs).

**Tier switcher** — Dropdown in header (next to Subscribe). Lets the family + SMEs preview any tier without paying. Persisted on device.

**Twilio** — Phone-number + voicemail-transcription provider. Phase 1 Voice Ops.

## U

**Urgency** — See Change / Incident / Project.

## V

**Voice Ops** — Backend (Cloudflare Worker + D1) that receives Twilio voicemails on Poe Properties + PoeTech lines, exposes them to the PWA's 📞 Inbound tab. TLC isolated.

## W

**Watchlist** — Markets tab. Stooq symbols the family is tracking.

**WCAG 2.1 AA** — Accessibility standard. ≥4.5:1 contrast for body text, ≥3:1 for UI. Every new surface in this app holds it.

**Wrap me with the tech** — Dev/Ops CTA on Premium tier. One tap on an opportunity card → auto-creates a Project + Scope + Capex item with the opportunity context.
