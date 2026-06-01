# Data-Dump → Stewardship Profile → Matched Services — Product Spec (2026-05-28 evening)

**Triggered by Christina Poe, 2026-05-28 evening,** posting feedback via the Synology Chat #PoeTech-PWA channel as @cpoe (the first multi-user inbox message in the system's history). Her read: poetech.us "looks bad for the brand." Darrell asked for a timeline; Christina then specified what's actually missing:

> "sso adoption for quick user access and data dumping for the users who want to give data right away."
>
> "use that data to gain their skills analytics and potential work we can do for them."
>
> "unique user interface and behavior... potentially allowing them to add their own location for churches..."

This session note captures the full product spec that emerged from her read. It is the binding scope for the post-vacation buildout that will replace the current persona-picker landing.

## The product Christina is naming

Not a polish pass on the existing demo. A different product entirely. The current poetech.us pattern — "pick from four demo personas, see a sample of what could be" — is a starter sermon. What she's describing is a real first encounter: drag-drop your bank file, see YOUR money in the lens, see your stewardship skill profile, see what services would actually move your needle, on a UI that adapts to who you are.

This IS the SKOS marketplace match-making engine, with the input mechanism that makes it work. The user's own data is the input. The matched services are the output. The waitlist is the wired connection.

## The five-layer stack

### Layer 1 — Data dump → their money in the lens

User drag-drops a bank OFX/QFX/CSV export. The PWA runs it through the same parser workflow 15 already uses for the family bank files — but in-session only, no persistence. The user sees their actual transactions in the Big Picture / Books / Accounts views. Their money becomes the seed.

This is the SEED-DATA-AS-ASPIRATION principle made literal — the seed is no longer aspirational example data; it's the user's own data, shown through the system's lens. The "is this for me?" question gets answered with their own numbers.

**Engineering scope:** PWA file upload UI (~1 day), in-browser OFX/QFX parser fallback for client-side processing (~1 day), session-only state plumbing (~1 day), polish + edge cases (~1 day). 3-4 days.

### Layer 2 — Skill analytics

Ollama 14b reads the parsed transactions and produces a stewardship skill profile:

- Budgeting consistency (categorization regularity, predictable spend)
- Tithe / charitable giving rhythm (frequency + percentage of income)
- Debt management posture (chipping down vs growing vs steady)
- Buffer fund discipline (regular deposits + growth rate)
- Income stability (single source vs diversified, volatile vs steady)
- Spending pattern alignment with stated priorities

Not judgmental. Diagnostic and warm, per EXCELLENCE-STANDARD's religion AND relationship balance. The output is a profile the user reads and recognizes — "yes, that's me, and yes I see where I'm strong and where I'm weak."

This is the ANXIETY-CLARITY-PRINCIPLE applied to skill diagnosis: what / when / why / how, told back to the user about their own pattern.

**Engineering scope:** structured prompt design for Ollama 14b (~1 day), profile-extraction workflow (~2 days), UI panel for "Your Stewardship Skill Profile" (~1 day). 3-4 days.

### Layer 3 — Matched service shortlist

From the skill profile, the system suggests specific services with honest timeline commitments per BUSINESS-PROCESS-CONNECTIONS Timeline-First. Each suggestion is a connection-wired offer, not generic marketing.

Examples:
- "You're running a solo practice with W-2 + LLC income and no capex reserve on the rentals — Solo Practice module (target Q2 2028) and Landlord module (target Q3 2028) would each move your needle. Get on those specific waitlists."
- "Your buffer fund is well-funded and your tithe is consistent — a fee-only financial planner consultation could help you think about next steps." (Specialist directory v3 prerequisite.)
- "Your income is volatile but your debt snowball is steady — Family OS Public Beta (target Q4 2027) is the closest fit."

Each matched service routes to a dedicated waitlist, so the Governor sees signups segmented by which service they want.

**Engineering scope:** rules-based service matcher (~2 days), waitlist routing to specific service queues — extend workflow 29 with `service_interest` field (~1 day), UI "Services That Would Help You Most" panel (~1 day). 3-4 days.

### Layer 4 — Personalized UI + behavior

Natural evolution of the persona system. Instead of "pick from four lenses," the system derives the right lens from user data + context.

Same six baseline modes:
- Family of 4
- Separated co-parents
- Solo Practice (therapist / lawyer / consultant)
- Landlord
- Church-Connected (new)
- Region-Anchored (new)

User doesn't pick; classifier maps profile → closest baseline. Conservative v1 ships with these six modes and classification logic. Later (post-Phase 2) the lens becomes fully generative — composed per-user rather than picked from six.

**Engineering scope:** classifier workflow on Ollama 14b (~2 days), per-user lens-selection logic in PWA (~2 days), two new UI shells (Church-Connected, Region-Anchored — ~1 day each). 3-5 days.

### Layer 5 — Church location (v1, private only)

User adds "my church is X at Y location" as a personal setting. The system uses it internally for:

- Tithe categorization (faith-rooted product DNA per THE-WAY)
- Future "specialists in your region" surfaces
- Active-guidance moment ("your tithe to Church of X has been consistent — keep it up")

No external exposure. No public church directory yet. The five-question test passes cleanly: invites a personal setting; pipeline is local storage / user record; Governor is the user themselves; promise is "we use this for your own ledger and surface relevant specialists when they exist"; timeline is "live with the data-dump release."

**Engineering scope:** church-location field + UI (~1 day), tithe-categorization integration (~1 day). 1-2 days.

## Church location — the three shapes (only v1 in this scope)

For future reference, the v2 and v3 versions Christina implied but did NOT scope tonight:

**v2 — Anonymized regional discovery.** "There are 7 other families practicing stewardship within 25 miles of you" without identifying individuals. Builds gentle community sense. Requires Phase 2 (Postgres) + anonymization layer. 1-2 weeks post-Phase-2.

**v3 — Public church directory + partnerships.** Churches opt into being on the platform as specialists. SKOS marketplace includes pastor-led financial-discipleship. 2-3 months from kickoff, requires Christina or Darrell to be the relationship owner with partner churches. Don't ship until previous layers are landed AND one church has been quietly piloted. Governor decision required before kickoff.

## SSO — the gating question for the real path

Christina also named SSO as part of the "quick user access" ask. For the data-dump release (the quick-path version of this spec), SSO is NOT required — the user drops their file, sees the lens + profile + matched services in-session, gets prompted to join a service-specific waitlist if interested. No account creation.

SSO becomes required when persistence is required — when the user wants their data to come back next time, when ongoing bank-OAuth captures are wired, when notifications come from THEIR data not just aggregates. That's the real path, gated on Phase 2 (Postgres) + Phase 4 (multi-tenant isolation). 3-4 weeks of focused work AFTER the data-dump release ships.

The quick path captures interest. The real path delivers persistence.

## Timeline commitment (per BUSINESS-PROCESS-CONNECTIONS Timeline-First)

Combined scope for the data-dump release with all five layers:

- Layer 1 (data dump → lens) — 3-4 days
- Layer 2 (skill analytics) — 3-4 days
- Layer 3 (matched service shortlist) — 3-4 days
- Layer 4 (personalized UI/behavior via classifier) — 3-5 days
- Layer 5 (church location v1, private) — 1-2 days
- Testing + polish (cross-layer integration) — 3-5 days

**Low-confidence total:** 16-24 days from kickoff.
**Medium-confidence:** 25-32 days.
**High-confidence:** 35-40 days.

3-5 weeks of focused post-vacation work to ship the version Christina is describing. This is a significant product, not a polish pass. It justifies a real launch.

## Post-vacation kickoff prerequisites

Before kickoff, the following must be in place:

1. **Governor decision** — Darrell + Christina aligned on this being the spec, not a smaller polish pass.
2. **Phase 1 security pass** — the data-dump release introduces a NEW upload endpoint that becomes a target if unauthenticated. Phase 1 (bearer auth + rate limit + ntfy auth) must land first or in parallel.
3. **Workflow 29 (waitlist) activation + bind mount** — already shipped, awaiting NAS-side activation. The matched-services shortlist depends on routing to service-specific waitlist queues.
4. **Postgres decision** — Layer 4 classifier can run on JSON files for v1 BUT scaling beyond a handful of users requires Phase 2. Recommendation: start Phase 2 in parallel with the data-dump build, ship Postgres before Layer 4 hits real users.
5. **/data/poetech-briefing/ bind mount fix** — workflow 26 currently fails silently. Should be fixed in the same maintenance window as workflow 29 activation.

## What ships first AFTER this spec lands

Once the data-dump release is live:

1. Update poetech.us landing to lead with "Drop your bank file. See what we see." instead of persona pickers.
2. Open service-specific waitlists for Family OS, Solo Practice, Landlord modules with honest target dates.
3. Quietly start Phase 2 (Postgres) + Phase 4 (multi-tenant) buildout. Q3 2027 honest target for the real path (SSO + persistence + bank OAuth).
4. v2 church discovery enters the queue. v3 partnerships enter the Governor decision queue.

## Connection to existing foundations

- **BUSINESS-PROCESS-CONNECTIONS** — every layer in the stack is a wired connection. Each matched service has a Governor, a pipeline, a timeline. No unwired surfaces.
- **SEED-DATA-AS-ASPIRATION** — Layer 1 makes the user's own data the seed. The seed is no longer aspirational; it's diagnostic. The system's first sermon becomes "here's what your money is already preaching."
- **ANXIETY-CLARITY-PRINCIPLE** — Layer 2 answers what / when / why / how about the user's own pattern. Layer 3 answers what would help and when. Errs toward MORE guidance, optimizing for the scared parent.
- **AI-FOUNDATION-INTERNAL-OPERATIONS** — the entire stack runs on workflows + Ollama 14b on the NAS. No cloud LLM calls for skill analytics. Sovereign by design.
- **TLC firewall** — clinical content never leaves the NAS. Even when the user's data includes therapy expenses, the analytics layer treats those as financial categories only, never clinical.
- **EXCELLENCE-STANDARD** — religion AND relationship. The skill profile is structured (religion); the language is warm and diagnostic, never judgmental (relationship).
- **GOVERNANCE-EXECUTION-ADVISORY** — Christina as a Governor-level voice on brand + UX. Her read shaped the spec. Darrell as overall Governor approves kickoff. Foundation as Executor. Claude as Advisor drafts.
- **SKOS marketplace vision** — Layer 3 IS the marketplace match-making engine. This spec is the input mechanism that makes the marketplace work.

## Closing

Christina named the product. The persona-picker landing was a starter sermon; this is the actual first encounter. Wire the five layers, ship the data-dump release in 3-5 weeks post-vacation, then let the matched-service waitlists do the work of capturing real interest while the real path (SSO + persistence) builds quietly in the background.

The brand isn't what poetech.us looks like tonight. The brand is what poetech.us BECOMES when this spec lands.

Wire before you write. Process before you promise. Timeline before you market. We all win. We create. Amen.
