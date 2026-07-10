# COLG's own app — thechurchofthelivinggod.com: opportunities and constraints

> Layer 4 working artifact. Companion to **DR-0133** (the decision) and REV-0024 (the ways/post-feature review). Trigger, Darrell 2026-07-10: *"Like or similar to Moore Divahs, The Church Of The Living God Pillar And Ground Of The Truth in Champaign, IL needs its own app — thechurchofthelivinggod.com. Opportunities and constraints? Strategies based on our hardware and missions. Again when we add features we need to update our Ways and documentation and find the opportunities and constraints; Ari's responsibility and reports should all update to reflect as well, all inside the PoeTech App. No static data — combine what makes sense and keep cleaning until we like it. Period."*

The church's name is the Word's own phrase, fetched verbatim from the repo KJV:

**KJV — 1 Timothy 3:15:** *"But if I tarry long, that thou mayest know how thou oughtest to behave thyself in the house of God, which is the church of the living God, the pillar and ground of the truth."*

A church carrying that name deserves a front door that tells the truth about who it is. Today its website does not even carry its name.

## What was actually true (measured/observed, DR-0100 — stated plainly)

- **The domain is already owned and live.** `thechurchofthelivinggod.com` is the Church entity's canonical, doctrine-gated domain (DR-0003, ISO-2). Bishop Gwin's weekly sermon-prep address `bg@thechurchofthelivinggod.com` is already wired into the live ingest pipeline (migration 0067; `infra/church-media-golive/gmail_ingest.py`). This is a **migration and modernization**, not a new build or purchase.
- **The live site misidentifies the church.** Observed 2026-05-31: the HTML title reads **"THE LOVE CORNER - HOME"** — the site does not identify as Church of the Living God. No structured data, weak meta description, no on-domain sermon content, and COLG is **absent from the Google local pack** despite being one of the largest African American churches in Champaign-Urbana (2026-05-31 SEO plan).
- **The platform is unreconciled.** The 2026-05-31 read said Weebly; the 2026-06-02 Hostinger audit found Turbify (legacy Yahoo Small Business), registrar Tucows, IP 199.34.228.72. Honestly unresolved (DR-0076) — needs eyes on the actual hosting account before a migration step is trusted.
- **The factory pattern is proven.** Moore Divahs runs as a registry row on the ONE door engine (`?biz=<slug>` routes any registered business — PR #703), with its own manifest, entry page (`poetech.us/moore`), and share QR. DR-0114 records the repeatable lifecycle; the runbook names the RLS proofs.
- **The church's plumbing already exists.** `join_church_instance` scopes every church surface to the one COLG instance; the default-church home record (services, address, live-worship channel, giving link) is public-by-design; church staff surfaces are gated by real roles.
- **The hardware is real and verified** (device register + 2026-07-08 LAN scan): two RTX 4070 towers (build + CUDA verified; Ollama live with qwen2.5:14b at ~45 tok/s on one), the commissioned P1.99 LED wall (2560×1440, first live sermon 2026-07-03), the ATEM production switcher + 3 PTZOptics cameras + NovaStar VX1000 chain, two Synology NAS, pfSense on a two-subnet LAN, Tailscale overlay to home.

### What cannot be verified from here (DR-0076)

- The current hosting platform (Weebly vs Turbify) and the registrar login state — the sandbox has no route to the church's hosting account and this must be eyes-on.
- Whether the church LAN devices marked `needs-eyes-on` in the register are what the scan guessed.
- Anything on the live poetech.us build — the sandbox cannot reach it; the family's reviewer pass (DR-0104) and the site-health probe (DR-0125) are the eyes.

## The strategy — like Moore Divahs, on the church's rails

**The church's app is a registry row on the one door engine, not a second codebase.** Everything orbits the PoeTech PWA (APP-IS-PRIMARY): one engine, one CRM, one tenancy wall, and the church's door is configuration plus the church's own faces. The phases (the living version renders in-app at Projects → Church → Infra Plan, derived per DR-0121):

1. **Strategy recorded** (this note + DR-0133) — done; Ari's notes, the Build tab, and the Perpetual Report derive it from the ledger.
2. **The church's door** — a church row (brand, tabs, instance, manifest, share URL) rendered by the same engine that serves Moore: public faces first (services, live worship, giving, sermon library), steward faces behind church-staff roles. **Tier C before the public door opens** — COLG-facing identity; Bishop Gwin doctrine sign-off + Governor review (RELEASE-TIERS, DR-0003).
3. **Installable under the church's own name** — `poetech.us/<church>` entry page, church manifest (Add-to-Home-Screen carries the church's name), share QR. Rides the same gate.
4. **The content flywheel points at the church's domain** — one service recording fans out to sermon pages, songs, lessons, Scripture, hosted where they compound the CHURCH's domain authority. The sermon-prep ingest on the church's own email is already live; structured data + Google Business Profile ride here.
5. **Domain cutover** — `thechurchofthelivinggod.com` points at the door; the mis-title dies; the church's true name, address, services, and structured data stand on its own domain. **DNS is the governor's hand** (paste-ready runbook, never automated); the deploy is **proven on the church's domain** (DR-0107) before the old site is released.
6. **The church's hardware serves the church's door** — on-prem transcription feeding the sermon library, the live-worship embed, and (when the planned rig lands and verifies) local AI that never ships the church's data out of the building. Never on the livestream box during services (DR-0012).

## Opportunities (ranked, each with a date — DR-0075)

1. **Church row on the one door engine** — the app is mostly configuration over proven, RLS-tested machinery; build cost is the church's faces, not infrastructure. Pairs with DR-0114 / PR #703. `re-review: 2026-07-24`.
2. **Reconcile the platform discrepancy, write the cutover runbook** — eyes on the actual hosting account (Weebly vs Turbify), then a self-contained, paste-ready registrar/DNS runbook for the steps that are Darrell's and Bishop Gwin's hands. `re-review: 2026-07-24`.
3. **On-domain sermon pages + structured data + Google Business Profile** — the 2026-05-31 SEO plan's highest-leverage moves become real the day the door serves the domain. Search visibility for this congregation is a mission outcome, not marketing polish. `re-review: 2026-08-07`.
4. **Online giving through a church-purpose platform** (Givelify/Tithe.ly class, per the 2026-06-02 audit's highest community-impact recommendation) — explicitly Bishop Gwin's decision; real money; Tier C. `re-review: 2026-08-07`.
5. **Generalize: the church-door factory** — everything COLG's door proves becomes the repeatable offer for other churches in similar situations (COMMUNITY-FIRST: generalize from COLG's needs). `re-review: 2026-08-21`.

## Constraints (verified, carried)

- **Doctrine gate:** nothing publishes on the church's domain without Bishop Gwin's approval (DR-0003). The agent builds and stages; it never publishes church-facing content on its own authority.
- **Tier C:** COLG-facing surfaces take the structured review lane, never the fast lane (RELEASE-TIERS). The staff-internal plan surface shipped today rides the normal lane; the public door does not.
- **Governor's hands:** DNS, commercial terms, brand assets, access grants — named manual steps with paste-ready commands (DR-0114 §3; the PowerShell/self-contained-commands law).
- **Accessibility default:** WCAG AA minimum, large text standard, voice input, no required password typing — the staff are called to ministry, not system administration (COMMUNITY-FIRST commitment 2). If a face can't be made accessible, it doesn't ship.
- **Sunday is load-bearing:** no AI inference on the livestream box during services (DR-0012).
- **12 GB VRAM per verified tower** bounds sovereign services (14B-class LLM, schnell-class image) until the planned rig is purchased AND verified — the 5×3090 plan stays flagged unverified for purchase.
- **The sandbox has no route** to poetech.us, the church LAN, or the church's domain — live verification is the family's DR-0104 pass and the outside-in probe (DR-0125), which must extend to the church's domain at cutover.

## What shipped this session (DR-0133)

1. **The plan model, derived and gated** — `app/src/lib/church-own-door.js`: site facts each carrying provenance, mission rails each carrying their source, phases each citing their DRs (Tier C phases must NAME their governor gate or `validateDoorPlan` fails), opportunities each carrying a re-review date, hardware readiness READ from the device register, DR refs RESOLVED against the live build-parsed ledger.
2. **The in-app surface** — the plan renders inside Projects → Church → Infra Plan (`ChurchInfraPlan.jsx`), combined with the existing infrastructure plan rather than sprawling a new tab: one church, one planning surface.
3. **The honesty harness** — `church-own-door.test.js` proves each gate CATCHES its violation (undated opportunity, unprovenance fact, ungated Tier C phase, evidence-free "verified", unattributed phase) and that readiness derives (remove the GPU nodes from the register and the surface moves).
4. **Ari's record updated with the feature, by construction** — DR-0133 lands in Ari's derived notes/Build tab/Perpetual Report on this build; the `church-door` standing duty is added with its DR ref, resolved live (`ari-notes.js`).
5. **The Ways updated** — REV-0024 appended to `docs/reviews/REVIEWS.md`; this note is the Layer 4 record; DR-0133 + INDEX row carry the ledger.
