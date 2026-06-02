// About component — extracted from poe-financial-mvp-v28.jsx (r21) to end
// remaining truncation. About was the file's tail and the chronic edit-victim.
// Receives VIEW_TIER_REQUIREMENTS as a prop so this module has no main-file dep.
import React, { useState } from 'react';
import { MarketCard, PricingTier, CommunityPriorities, ModuleCard, SectionTitle } from './shared.jsx';

// Patch the function signature to also accept VIEW_TIER_REQUIREMENTS as a prop.
function About({ moduleInterest, toggleModuleInterest, theme, setTheme, feedback = [], deleteFeedback, checkoutIntents = [], addCheckoutIntent, deleteCheckoutIntent, addProject, VIEW_TIER_REQUIREMENTS = {} }) {
  // v28+ MVP v1.5 round 3 — Capex / Tools list moved out of About; lives at the
  // bottom of the Projects tab as "Project Inventory & Capital Forecast".
  // v28+ Session C: checkout cart drawer state
  const [cartTier, setCartTier] = useState(null);
  const [cartBilling, setCartBilling] = useState('monthly');
  const [cartName, setCartName] = useState('');
  const [cartEmail, setCartEmail] = useState('');
  const [cartNotes, setCartNotes] = useState('');
  const [cartError, setCartError] = useState('');
  const openCart = (tier) => { setCartTier(tier); setCartBilling('monthly'); setCartName(''); setCartEmail(''); setCartNotes(''); setCartError(''); };
  const closeCart = () => setCartTier(null);
  // v28+ Auto-create a Project when someone submits the cart. Each tier gets a
  // sensible default onboarding timeline so the team knows what they're walking
  // into before the discovery call. User can edit start/end/hours later.
  const tierToProjectTemplate = (tier, customerName, customerEmail, action) => {
    const today = new Date(); const isoToday = today.toISOString().slice(0, 10);
    const tierName = tier.name || 'tier';
    const monthly = tier.monthly;
    const isSponsor = !!tier.isSponsor;
    let weeks = 1, hpw = 1, domain = 'business-poetech';
    if (isSponsor) { weeks = 3; hpw = 4; domain = 'business-poetech'; }
    else if (monthly === '0' && /Loved Ones/i.test(tierName)) { weeks = 2; hpw = 2; }
    else if (monthly === '0' && /Community/i.test(tierName))  { weeks = 2; hpw = 1; }
    else if (monthly === '0')                                  { weeks = 1; hpw = 1; } // Foundation
    else if (monthly === '39')                                 { weeks = 1; hpw = 1; } // PoeTech+
    else if (monthly === '89')                                 { weeks = 2; hpw = 2; } // Family
    else if (monthly === '149')                                { weeks = 3; hpw = 3; } // Premium
    else if (monthly === '249')                                { weeks = 5; hpw = 5; } // Business
    const end = new Date(today.getTime() + weeks * 7 * 86400000).toISOString().slice(0, 10);
    const actionLabel = action === 'sponsor' ? 'Sponsor' : action === 'claim' ? 'Claim' : 'Subscribe';
    return {
      title: `${actionLabel} · ${customerName} · ${tierName}`,
      startDate: isoToday,
      endDate: end,
      status: 'planning',
      domain,
      description: `Auto-created from About checkout. Customer email: ${customerEmail}. Tier: ${tierName}. ${isSponsor ? 'Sponsor flow - vetting runs in parallel; refund if vetting fails.' : monthly === '0' ? 'Free-tier onboarding - enable access and orient.' : `Paid tier onboarding (${weeks}-week target).`} Confirm timeline with customer on first call.`,
      hoursPerWeek: hpw,
      entityId: 'e-poetech',
      contractorIds: [],
      conversationLog: [],
    };
  };

  const submitCart = (action) => {
    if (!cartTier) return;
    if (!cartName || !cartEmail) { setCartError('Name and email are required so we can follow up.'); return; }
    setCartError('');
    const isFree = cartTier.monthly === '0';
    const isSponsor = !!cartTier.isSponsor;
    const billing = isSponsor ? 'annual' : (isFree ? 'free' : cartBilling);
    const price = isSponsor ? parseFloat(cartTier.annual) || 0
                : isFree ? 0
                : parseFloat(cartBilling === 'annual' ? cartTier.annual : cartTier.monthly) || 0;
    addCheckoutIntent({
      tierName: cartTier.name,
      tierTagline: cartTier.tagline,
      billing,
      price,
      name: cartName,
      email: cartEmail,
      notes: cartNotes,
      action, // 'subscribe' | 'claim' | 'sponsor'
      status: 'new',
    });
    // Mirror to Projects so the team has a tracked record + timeline before the call
    if (typeof addProject === 'function') {
      addProject(tierToProjectTemplate(cartTier, cartName, cartEmail, action));
    }
    // Open mailto so user can complete the handshake via email until Stripe is wired in
    const subject = isSponsor ? `Sponsor: ${cartTier.name}`
                  : isFree ? `Claim: ${cartTier.name}`
                  : `Subscribe: ${cartTier.name} (${cartBilling})`;
    const billingLine = isSponsor ? `Sponsorship: annual ($${price.toLocaleString()})`
                      : isFree ? 'Free tier - claiming access'
                      : `Billing: ${cartBilling} ($${price})`;
    const body = `Name: ${cartName}\nEmail: ${cartEmail}\nTier: ${cartTier.name}\n${billingLine}\n\nNotes:\n${cartNotes || '(none)'}`;
    const url = `mailto:contact@poetech.us?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    try { window.location.href = url; } catch (e) {}
    closeCart();
  };
  return (
    <div className="space-y-10 max-w-prose">
      <section>
        <SectionTitle>What you actually get</SectionTitle>
        <div className="bg-white border-2 border-[#1A1815] p-4 sm:p-5 mb-4">
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] mb-2 font-semibold">Why people switch</div>
          <p className="text-base leading-relaxed mb-3" style={{ fontFamily: '"Fraunces", serif' }}>
            Most home / small-business operators don't need another app. What they need is to <strong>stop giving out their personal phone number</strong> to contractors, tenants, clients, and donors — while still keeping the relationship working. PoeTech gives every relationship its own scoped channel: full context, full history, no personal-number exposure.
          </p>
          <p className="text-sm leading-relaxed text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
            Three reinforcing mechanics: <strong>privacy</strong> (the working relationship lives in a portal, not in your contacts), <strong>context preservation</strong> (every message, file, status change in one searchable timeline that survives device changes and handoffs), and <strong>network effects</strong> (every contractor or tenant who uses one PoeTech portal recognizes the next one — soft referrals at scale). The Financial Control core is free for every family; paid tiers unlock the ecosystem layer.
          </p>
        </div>
        <h3 className="text-lg mb-2" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>Tiers</h3>
        <p className="text-sm text-[#5A5751] leading-relaxed mb-4" style={{ fontFamily: '"Fraunces", serif' }}>
          The Financial Control System is free for every family. Paid tiers reflect the real value being delivered — each one replaces multiple existing SaaS subscriptions. PoeTech is priced like the premium platform it is, not like a hobby app. <strong>Free access at two layers</strong> for the work of justice: families served by partner orgs, and the mission-aligned orgs themselves.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Round 5 — Tier features rewritten to match the live tier-gating map.
              Every bullet here corresponds to something that's actually unlocked
              or capped at that tier in the running app (see VIEW_TIER_REQUIREMENTS). */}
          <PricingTier name="Foundation" tagline="Always free · core financial control" monthly="0" annual="0" replaces="YNAB, basic budget apps, free family planners — typically $50–$100/mo equivalent" features={['Big Picture dashboard + Action Queue (Changes / Incidents / Projects)','Books — entities · accounts · transactions · calendar · 1099 (cap: 2 entities)','Debts — avalanche + snowball strategies','Markets watchlist (cap: 5 tickers)','Church tab — always free for everyone','Dev/Ops tab — 1 personalized entrepreneurial option per profile · view-only PoeTech Services portfolio','Real Estate — read-only preview (sample property)','Event reminders (browser)','Local-first · device-only storage']} highlight onChoose={openCart} />
          <PricingTier name="PoeTech+" tagline="Tenant portal-ready · up to 3 properties · stop sharing your personal number" monthly="39" annual="390" replaces="$100–$200/mo equivalent: paid YNAB tier, Stessa (rentals), encrypted backup services" features={['Everything in Foundation','🔐 Tenant portals (when external auth ships) — each tenant logs in via emailed link, sees only their lease + rent history + maintenance requests, messages you through a scoped channel. Your personal phone stays private.','Real Estate — up to 3 properties (full edit: lease · tenant · equipment · rooms · maintenance · conversations · evaluator · map)','Unlimited entities in Books','Unlimited Markets watchlist','Dev/Ops — 3 personalized options per profile','Cross-device sync (opt-in cloud, when backend ships)','Encrypted cloud backup','Priority email support']} onChoose={openCart} />
          <PricingTier name="Family" tagline="Unlimited tenant portals · household-wide use · Projects + Legal Matters" monthly="89" annual="890" replaces="$200–$350/mo equivalent: Notion/Asana for family ops + rental SaaS + maintenance apps + tenant-portal SaaS ($30–80/mo standalone)" features={['Everything in PoeTech+','🔐 Unlimited tenant portals — every door gets its own scoped channel. The tenant at one address never sees the tenant at another.','🔒 Legal Matters tab — PIN + encrypted, with attorney-client privilege Y/N on every note (export tool strips privileged content before non-counsel sharing)','Real Estate — unlimited properties','Projects tab — multi-domain timeline + workload + per-project conversations','Dev/Ops — full opportunity library (6+ matched options per profile)','Home Command Center module (when launched)','Seasonal maintenance calendar · IoT sensor pairing (planned)','Multi-user household sharing (opt-in)']} onChoose={openCart} />
          <PricingTier name="Premium" tagline="Contractor + Client portals · solo professional · Scope tool · Wrap-me handoff" monthly="149" annual="1490" replaces="$400–$700/mo equivalent: Practice Better / SimplePractice ($75–$150), QuickBooks Self-Employed ($30), CRM ($30–50), project tools ($20–40), scheduling, scope/contract tools" features={['Everything in Family','🔐 Contractor portals — every 1099 sees their assigned projects, scope, materials policy, estimated timeline, their YTD pay. Uploads invoices, posts status, messages you — through a scoped channel, no personal numbers exchanged.','🔐 Client portals (Practice, non-PHI) — prospective clients see their intake status + next step + appointment summary. Reschedule (Acuity link) and message intake coordinator. HIPAA stays in Acuity.','Practice Operations tab — inquiry capture · source attribution · conversion tracking (non-PHI)','Dev/Ops — "Wrap me with the tech" CTA enabled (auto-create Project + Scope + Capex from any opportunity)','Scope-of-work agreements (full templates · materials-paid-by policy)','Project Inventory & Capital Forecast — 12-month outflow projection + savings prompts','Education / Tutors / Elder Care modules (when launched)','Marketplace access (when launched)','Spiritual Life · Godhead Study Platform (always free for every tier)']} onChoose={openCart} />
          <PricingTier name="PoeTech Business" tagline="Full ecosystem · multi-entity · multi-user · audit-grade" monthly="249" annual="2490" replaces="$700–$1,200/mo equivalent: QuickBooks multi-entity ($90+), full CRM, marketing stack, payroll integration, EHR-adjacent practice tools, audit/compliance software, tenant + contractor portal SaaS ($100–300/mo standalone)" features={['Everything in Premium','🔐 Unlimited external portals — tenants, contractors, clients, donors, parishioners, volunteers, customers. All scoped, all logged.','🔐 Audit-grade interaction log — every message, file, status change, payment, between any internal user and any external participant. Export for compliance, court, or board review.','Up to 10 entities tracked','Up to 5 staff / team users (when backend ships)','Advanced reporting + CSV/Excel bulk export','1099-NEC e-file integration','API access for custom integrations','Priority phone + Slack support','Quarterly strategy review with PoeTech Services','Eligible for revenue-share consulting partnership']} business onChoose={openCart} />
          <PricingTier name="Loved Ones · Founding Family" tagline="Free PoeTech+ upgrade for life · First 100 families through partner churches or by direct invitation" monthly="0" annual="0" replaces="Lifetime savings of ~$468/yr per family at current prices · more as prices rise" features={['Everything in Foundation','Cross-device sync (opt-in cloud)','Encrypted cloud backup','Multi-user household sharing','Locked in for life — even when prices change','First 100 families only · tier closes when filled','One month Family-tier credit per paying family you refer']} community onChoose={openCart} />
          <PricingTier name="Community · Families in Need" tagline="Free access for families · sponsored by paying subscribers" monthly="0" annual="0" features={['Available through partner Churches','And 501(c)(3) organizations serving the poor, elderly, fatherless','Verification through partner org · not the family','Full Foundation + PoeTech+ features','Designed to remove stigma — help comes from the community','Paying subscribers fund this tier transparently']} community onChoose={openCart} />
          <PricingTier name="Community Partners · Organizations" tagline="Free PoeTech for mission-aligned orgs that serve the underserved" monthly="0" annual="0" features={['Free for verified 501(c)(3) nonprofits + faith-based ministries','Serving: poor · elderly · fatherless · incarcerated/reentry · unhoused · disabled · mental health · literacy','Full PoeTech platform for the organization itself','Practice Operations for case management (no PHI)','Aggregate community-trend data for advocacy and grant applications','Custom data exports for board meetings, funders, and community awareness','Listed in PoeTech Community Partners directory','Verified annually · service area documented · mission alignment confirmed']} community onChoose={openCart} />
        </div>
        <p className="text-xs text-[#5A5751] italic mt-4" style={{ fontFamily: '"Fraunces", serif' }}>
          Annual pricing reflects ~17% savings (2 months free). Foundation is free forever — to generate the experience and the data that improves the system for every family. Loved Ones tier honors the warm-market relationships that make PoeTech viable: people who already know us, trust us, and pray for us. Their early adoption is the foundation everything else stands on — and their pricing is locked even as the broader pricing reflects the platform's growing value.
        </p>
      </section>

      {feedback.length > 0 && (
        <section className="bg-white border-2 border-[#B85838] p-5">
          <div className="text-[10px] uppercase tracking-[0.3em] text-[#B85838] mb-2 font-semibold">💬 Feedback Log · MVP Test</div>
          <h3 className="text-xl mb-3" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600, letterSpacing: '-0.02em' }}>What testers have shared ({feedback.length})</h3>
          <div className="space-y-3">
            {[...feedback].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map(f => (
              <div key={f.id} className="bg-[#FAF8F4] border border-[#E8E4DC] p-3">
                <div className="flex items-baseline justify-between gap-2 mb-1 flex-wrap">
                  <div className="text-[10px] uppercase tracking-wider">
                    <span className="font-semibold text-[#B85838]">{f.area}</span>
                    {f.rating && <span className="text-[#5A5751]"> · {f.rating}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{new Date(f.createdAt).toLocaleDateString()}</span>
                    <button type="button" onClick={() => { if (confirm('Delete this feedback?')) deleteFeedback(f.id); }} className="text-[9px] uppercase tracking-wider text-[#5A5751] hover:text-[#B85838]">×</button>
                  </div>
                </div>
                {f.whatsWorking && <div className="mb-1"><div className="text-[9px] uppercase tracking-wider text-[#5A6E3D] font-semibold">✓ Working</div><p className="text-xs" style={{ fontFamily: '"Fraunces", serif' }}>{f.whatsWorking}</p></div>}
                {f.whatsNot && <div className="mb-1"><div className="text-[9px] uppercase tracking-wider text-[#B85838] font-semibold">✗ Not working</div><p className="text-xs" style={{ fontFamily: '"Fraunces", serif' }}>{f.whatsNot}</p></div>}
                {f.whatsMissing && <div className="mb-1"><div className="text-[9px] uppercase tracking-wider text-[#B85838] font-semibold">+ Missing</div><p className="text-xs" style={{ fontFamily: '"Fraunces", serif' }}>{f.whatsMissing}</p></div>}
              </div>
            ))}
          </div>
        </section>
      )}
      <section className="bg-white border border-[#E8E4DC] p-4">
        <div className="text-[10px] uppercase tracking-[0.3em] text-[#B85838] mb-1 font-semibold">Appearance · Themes</div>
        <p className="text-sm leading-relaxed" style={{ fontFamily: '"Fraunces", serif' }}>
          Switch themes from the swatches in the header (top-right) anytime. Editorial cream is the default · five total themes including a true dark mode.
        </p>
      </section>
      <section>
        <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] mb-2">PoeTech LLC · poetech.us</div>
        <h2 className="text-3xl sm:text-4xl mb-4 leading-tight" style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>A stronghold for relationships with Yahweh.</h2>
        <p className="text-base leading-relaxed mb-4" style={{ fontFamily: '"Fraunces", serif' }}>
          PoeTech exists to help families be supported in their relationship with Yahweh — to make His voice easier to hear and easier to follow. The Family OS is the practical infrastructure: financial visibility, home stewardship, health awareness, scope-of-work fairness. Each module serves the larger mission.
        </p>
        <p className="text-base leading-relaxed mb-4" style={{ fontFamily: '"Fraunces", serif' }}>
          <strong>Built for every family that owns their own story.</strong> Multiple paths to succeed. Multiple ways to earn. Multiple ways to be fruitful. One platform that respects your data and amplifies your stewardship — not extracts from it.
        </p>
        <p className="text-sm leading-relaxed mb-4" style={{ fontFamily: '"Fraunces", serif' }}>
          <strong>Local-first by default.</strong> Your data stays on your devices. Cloud sync is opt-in for historical stability across devices. We do not sell or mine your family's data — that's foundational, not a feature.
        </p>
        <p className="text-sm text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>
          Projections, not promises. Better stewardship through technology — alongside qualified professionals and the church community, not replacing them.
        </p>
      </section>

      <section>
        <SectionTitle>Modules</SectionTitle>
        <p className="text-sm text-[#5A5751] leading-relaxed mb-3" style={{ fontFamily: '"Fraunces", serif' }}>
          Live modules ship to all subscribers. Planned and Vision modules accept early interest signals — tap <strong>Notify me · vote on priority</strong> to register and weigh in on what gets built next. The aggregate of family priority votes shapes the roadmap.
        </p>
        <CommunityPriorities moduleInterest={moduleInterest} />
        <div className="space-y-3">
          <ModuleCard moduleKey="financial" status="active" title="Financial Control System" desc="Multi-entity bookkeeping with debt avalanche, rental snowball, pressure slider, tax calendar, 1099 tracking, scope-of-work agreements, event reminders." features={['4-entity book separation','Debt avalanche · rental snowball','7-year Sabbath payoff goal','Tax & compliance calendar','Events with browser notifications','Scope of work templates & agreements','1099 tracking · both directions']} moduleInterest={moduleInterest} toggleModuleInterest={toggleModuleInterest} />
          <ModuleCard moduleKey="home-command" status="planned" title="Home Command Center" repo="poe-trust-command-center" desc="BAS-level intelligence for the residential home. Enterprise building-automation thinking applied to family stewardship." features={['IoT sensor integration','F&S-level alarms (leak, intrusion, HVAC failure)','Seasonal maintenance calendar','Floor plan mapping & inventory','Per-property dashboards']} moduleInterest={moduleInterest} toggleModuleInterest={toggleModuleInterest} />
          <ModuleCard moduleKey="health-wellness" status="planned" title="Health & Wellness · PoeTech-PWA" repo="poetech.us" desc="Public-facing health stewardship. IoT and sensor data for big-picture private health visibility." features={['IoT health data aggregation','Big-picture private health dashboard','Comprehensive measurement incl. water sensors','Facial recognition AI trained for Black families (NIST-documented accuracy gaps — opt-in correction)','Open-source where possible']} moduleInterest={moduleInterest} toggleModuleInterest={toggleModuleInterest} />
          <ModuleCard moduleKey="marketplace" status="vision" title="PoeTech Marketplace · Scope & Contractors" desc="Vendor marketplace where PoeTech mediates the scope agreement itself — protecting both customer and contractor from unfair disputes." features={['Vendor onboarding with paid positions','Scope-mediated agreements (the differentiator)','Reviews anchored to agreed scope','Trade-specific templates','Trust & safety verification']} moduleInterest={moduleInterest} toggleModuleInterest={toggleModuleInterest} />
          <ModuleCard moduleKey="practice-ops" status="active" title="Practice Operations · TLC" desc="Non-PHI tooling around Christina's clinical practice. Inquiry capture, source attribution, and pre-patient lead tracking — running in the app today. Acuity remains the system of record for client scheduling and intake." features={['Inquiry capture form (pre-patient, no PHI)','Status workflow: new → contacted → moved to Acuity','Source attribution (organic / FB / referral / church)','Conversion rate tracking','Per-provider routing (Christina + MSW contractors)','MSW contractor onboarding (uses scope tool)','Acuity API integration (planned)','Revenue-per-session reconciliation (planned)']} moduleInterest={moduleInterest} toggleModuleInterest={toggleModuleInterest} />
          <ModuleCard moduleKey="marketing-growth" status="vision" title="Marketing & Growth" desc="Help PoeTech subscribers grow their own ministry, practice, or business through integrated social media management, ad attribution, and SEO tools — all under the local-first privacy posture." features={['Facebook + Instagram (Meta) ads attribution','Google Ads tracking','Content calendar across social channels','Email + SMS campaigns (where lawful)','Google My Business + local SEO health','Lead source data into Practice Operations','Audience insights without surveillance capitalism']} moduleInterest={moduleInterest} toggleModuleInterest={toggleModuleInterest} />
          <ModuleCard moduleKey="education" status="vision" title="Education & Children · Literacy Justice" desc="&quot;From us for us&quot; — designed by Black families, for Black families. Children not reading proficiently by 3rd grade are 4-8x more likely to drop out of high school. 30-50% of incarcerated individuals have dyslexia (vs 5-15% general population). Technology can help break this pattern through early screening, dyslexia-aware design, and family-supervised AI literacy." features={['AI literacy curriculum for kids (age-appropriate prompt engineering, AI safety, fact-checking AI output)','Dyslexia-aware interface (OpenDyslexic / Lexend fonts, color overlays, line tracking)','Voice-to-text and text-to-speech throughout','Early literacy screening · intervention tracking before 3rd grade','Per-child reading proficiency dashboard','Apprenticeship curriculum tracking','Goal-setting & review cycles','Pricing: Family of 3: $19/mo · Family of 5+: $29/mo · Included in Premium tier']} moduleInterest={moduleInterest} toggleModuleInterest={toggleModuleInterest} />
          <ModuleCard moduleKey="tutors" status="vision" title="PoeTech Tutors · Educator Marketplace" desc="Credentialed teachers and school principals earn meaningful income teaching online — specifically serving parents who pulled their kids into homeschooling because of bullying, special needs, or simply because the local school wasn't the right fit. From us, for us. Real educators, real outcomes, real freedom for the parents." features={['Marketplace for vetted teachers and principals to list availability + rates','Booking + scheduling integrated with PoeTech calendar','Specializations: special needs, dyslexia support, IEP advocacy, college-prep, bullied-kids homeschool transitions','Curriculum alignment with state homeschool requirements','Per-student progress tracking shared with parents','Standard split: 80% to educator · 20% to PoeTech (platform fee)','Or: revenue-share partnership for teachers building a full online practice','Free marketplace access for Premium subscribers · session pricing set by educator','Community-tier families receive subsidized sessions through underwriting','Pre-launch interest welcome — vote on priority']} moduleInterest={moduleInterest} toggleModuleInterest={toggleModuleInterest} />
          <ModuleCard moduleKey="elder-care-coord" status="vision" title="Elder Care Coordination" desc="For adult children managing care for aging parents. The forgotten generation in family-tech — most platforms focus on the kids or the parents themselves, not the family member doing the coordination work. Built on the same calendar, scope, and practice operations primitives already shipping today." features={['Multi-generational household tracking','Caregiver scheduling and 1099 management (uses scope tool)','Appointment + medication reminder calendar','Document storage (Power of Attorney, advance directives, HIPAA releases)','Shared access for siblings managing care together','Aging-in-place property maintenance tracking','Financial visibility across parent + adult-child budgets','Connection to Elder Care Marketplace (caregivers, helpers)']} moduleInterest={moduleInterest} toggleModuleInterest={toggleModuleInterest} />
          <ModuleCard moduleKey="home-legacy" status="vision" title="Home Legacy Program · Family Properties extension" desc="Ethical purchase program for elderly homeowners who want certainty their home will be cared for after they pass — when family inheritance isn't a clean option. Not a marketplace. Not a flip. Relationship-based, attorney-required, family-involved when possible. This is genuinely sensitive territory; we approach it with deep care because Yahweh names the elderly as deserving particular care." features={['Years of relationship before any purchase conversation','Elderly homeowner ALWAYS has their own attorney (we pay if needed)','Family involvement required when family exists','Fair market value pricing · independently documented','Life estate option — they live there until death, paid up front or monthly','Property maintenance commitment baked into the agreement','No high-pressure sales · they walk if they want','Elder abuse prevention training for everyone involved','Transparent reporting of every transaction to a community advisory board','Alternative to probate sales and state escheat']} moduleInterest={moduleInterest} toggleModuleInterest={toggleModuleInterest} />
          <ModuleCard moduleKey="spiritual" status="vision" title="Spiritual Life · The Godhead Study Platform" desc="An interactive tool for studying The Godhead, original business systems from a biblical worldview, and the philosophy of technology in light of scripture. FREE for every family — Foundation tier and above. The PoeTech worldview, derived from biblical scriptures with algorithmic rigor, made interactive. A stronghold made visible in daily study." features={['FREE tier — included with every PoeTech subscription including Foundation','Interactive Godhead study (Father · Son · Holy Spirit · their unity and distinction)','Original Business Systems study — biblical economics, stewardship, the seven-year cycle, debt-jubilee patterns','Technology Study — philosophy of technology from a biblical worldview','Built-in Bookstore — digital download + Amazon physical order','📖 The Holy Spirit Integration Worldview (forthcoming) — the foundational text','📖 Clinical & community wisdom (forthcoming) — the complementary text','Family prayer journal · scripture study plans · ministry calendar','Algorithm-driven study paths · personalized scripture walks','Local-first study notes · device-only by default']} moduleInterest={moduleInterest} toggleModuleInterest={toggleModuleInterest} />
        </div>
      </section>

      {/* v28+ MVP v1.5 round 3 — Capex / Tools list moved to Projects tab.
          Lives at the bottom of Projects as "Project Inventory & Capital
          Forecast" because tools/equipment are most actionable next to the
          projects that need them. About no longer hosts the editor. */}

      <section>
        <SectionTitle>Markets We Serve · Underserved by Mainstream Tech</SectionTitle>
        <p className="text-sm text-[#5A5751] leading-relaxed mb-4" style={{ fontFamily: '"Fraunces", serif' }}>
          Most family-tech is built for one demographic: the affluent, single-business, two-parent household. Real families are more complex than that. PoeTech is built for the populations mainstream tech overlooks — and the existing platform already covers many of them today, no new modules required.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <MarketCard title="Adult children caring for aging parents" need="Coordinate caregivers, track appointments, manage finances across generations" have="Multi-entity books, calendar, reminders, scope-of-work — Premium tier" />
          <MarketCard title="Kinship caregivers (grandparents raising grandkids)" need="Document everything for agencies/courts, manage 1099 helpers, track therapy" have="Practice Operations, calendar, scope — Premium tier" />
          <MarketCard title="Foster families" need="Placement tracking, court dates, agency contacts, supplemental contractors" have="Practice Operations, calendar, scope" />
          <MarketCard title="Reentry / formerly incarcerated families" need="Financial rebuilding from zero, court dates, family reunification logistics" have="Foundation tier (free) — debt snowball is especially powerful here" />
          <MarketCard title="Single-parent small business owners" need="One platform vs juggling SaaS, lead tracking, tax preparation" have="Premium tier — replaces $400-$600/mo of SaaS" />
          <MarketCard title="Small Black-owned contractors & service providers" need="Multi-entity tracking, fair contractor agreements, lead source attribution" have="Premium + Scope tool · From us, for us" />
          <MarketCard title="Independent farmers & small homesteaders" need="Property + equipment + seasonal calendar + multiple income streams" have="Family tier covers this almost completely" />
          <MarketCard title="Small churches & ministries" need="Volunteer coordination, event tracking, member care, donation tracking" have="Calendar + Practice Operations workflow · Community Partner tier free" />
          <MarketCard title="Disability advocate / IEP families" need="Document management, multi-provider coordination, school + therapist + insurance" have="Calendar + Practice Operations + scope · Premium tier" />
          <MarketCard title="Direct-care workers & gig economy" need="Multi-source income tracking, mileage, quarterly tax planning" have="Foundation (free) + Premium for full features" />
        </div>
        <p className="text-xs text-[#5A5751] italic mt-4" style={{ fontFamily: '"Fraunces", serif' }}>
          The breadth of who PoeTech serves is also the breadth of who benefits from local-first data, non-predatory pricing, and a stronghold mission. Every market named above has been underserved by mainstream tech because they don't fit the &quot;single business owner, single household, single problem&quot; pattern. We were built for the actual texture of family life.
        </p>
      </section>


      <section className="bg-white border border-[#1A1815] p-5">
        <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] mb-2 font-medium">Community Partnership Model</div>
        <p className="text-sm leading-relaxed mb-2" style={{ fontFamily: '"Fraunces", serif' }}>
          PoeTech is free at two layers for the work of justice. <strong>Families in need</strong> — the poor, the elderly, the fatherless, those Yahweh names as deserving particular care — receive full access through partner churches and 501(c)(3)s the family already trusts. The verification and dignity-preserving handoff happens through the partner org, not from PoeTech.
        </p>
        <p className="text-sm leading-relaxed mb-2" style={{ fontFamily: '"Fraunces", serif' }}>
          <strong>The organizations themselves</strong> — mission-aligned nonprofits doing the actual work of serving these communities — get PoeTech free for their own operations, plus aggregate community-trend data to advocate, apply for grants, and keep all of us aware of what's happening on the ground.
        </p>
        <p className="text-sm leading-relaxed" style={{ fontFamily: '"Fraunces", serif' }}>
          Paying subscribers know transparently that their subscription funds both tiers. No charity badge appears on the recipient's app. No data-driven judgment of worthiness from PoeTech. The community gives. The community receives. The data infrastructure compounds the work.
        </p>
      </section>

      <section className="bg-white border border-[#1A1815] p-5">
        <div className="text-[10px] uppercase tracking-[0.3em] text-[#B85838] mb-2 font-semibold">PoeTech Bookstore · Forthcoming</div>
        <h3 className="text-xl mb-3" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600, letterSpacing: '-0.02em' }}>Original work. From us, for the families.</h3>
        <p className="text-sm leading-relaxed mb-4" style={{ fontFamily: '"Fraunces", serif' }}>
          The Spiritual Life module is free for every family — but inside it lives a bookstore for original works that fund the platform and propagate the worldview. Digital download for instant access · physical copies fulfilled through Amazon for those who want to hold the book.
        </p>
        <div className="space-y-3">
          <div className="bg-[#FAF8F4] border border-[#E8E4DC] p-4">
            <div className="flex items-baseline justify-between gap-3 flex-wrap mb-1">
              <h4 className="text-base" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>📖 The Holy Spirit Integration Worldview</h4>
              <span className="text-[10px] uppercase tracking-wider text-[#5A6E3D] font-medium">Forthcoming</span>
            </div>
            <div className="text-xs text-[#5A5751] mb-2">PoeTech foundation author (forthcoming)</div>
            <p className="text-sm leading-relaxed" style={{ fontFamily: '"Fraunces", serif' }}>
              The foundational text. A biblical-scripture-derived worldview applied with algorithmic rigor — covering The Godhead, original business systems (biblical economics, the seven-year cycle, debt-jubilee patterns), and the philosophy of technology. The intellectual spine of the Spiritual Life module.
            </p>
          </div>
          <div className="bg-[#FAF8F4] border border-[#E8E4DC] p-4">
            <div className="flex items-baseline justify-between gap-3 flex-wrap mb-1">
              <h4 className="text-base" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>📖 Clinical & Community Wisdom — Title TBD</h4>
              <span className="text-[10px] uppercase tracking-wider text-[#5A6E3D] font-medium">Forthcoming</span>
            </div>
            <div className="text-xs text-[#5A5751] mb-2">Wellness Counseling co-author (forthcoming), MSW</div>
            <p className="text-sm leading-relaxed" style={{ fontFamily: '"Fraunces", serif' }}>
              Clinical wisdom and community insight from twenty years of social work and faith-based therapy. The complementary text — bringing the worldview into the lived reality of family mental health, marriage, parenting, and community care.
            </p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-[#E8E4DC]">
          <div className="text-[10px] uppercase tracking-[0.2em] text-[#B85838] font-semibold mb-1">Distribution strategy</div>
          <ul className="text-xs space-y-1" style={{ fontFamily: '"Fraunces", serif' }}>
            <li className="flex gap-2"><span className="text-[#B85838]">·</span><span><strong>Digital download in-app</strong> — instant access for PoeTech families, payment through Stripe, file delivered to local device (local-first principle)</span></li>
            <li className="flex gap-2"><span className="text-[#B85838]">·</span><span><strong>Physical copies via Amazon KDP</strong> — print-on-demand fulfillment, widest distribution, no inventory risk · alternatives: IngramSpark for bookstores, BookBaby for premium options</span></li>
            <li className="flex gap-2"><span className="text-[#B85838]">·</span><span><strong>Best deal evaluation</strong> — KDP is industry standard (40-60% royalty on paperback, 70% on Kindle); IngramSpark gets into libraries and indie bookstores; BookBaby offers more royalty but higher upfront. The book is the priority; the distribution serves it.</span></li>
            <li className="flex gap-2"><span className="text-[#B85838]">·</span><span><strong>Family pricing</strong> — Loved Ones tier families get founding-pricing access · Community-tier families receive free digital copy through underwriting</span></li>
            <li className="flex gap-2"><span className="text-[#B85838]">·</span><span><strong>Interactive companion</strong> — the books are paired with study paths inside the Spiritual Life module, making the app itself the natural complement to reading</span></li>
          </ul>
        </div>
      </section>

      <section className="bg-white border border-[#1A1815] p-5">
        <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] mb-2 font-medium">Sponsorship & Advertising Ethics</div>
        <p className="text-sm leading-relaxed mb-3" style={{ fontFamily: '"Fraunces", serif' }}>
          PoeTech does not run programmatic advertising. We do not sell your data, share it with ad networks, or use behavioral targeting. Surveillance capitalism is the opposite of the stronghold this platform is meant to be.
        </p>
        <p className="text-sm leading-relaxed mb-3" style={{ fontFamily: '"Fraunces", serif' }}>
          <strong>What we do allow:</strong> Curated editorial sponsorship — like public radio underwriting. Vetted partners, fully disclosed, no behavioral targeting, no third-party tracking. Shown only on the free Foundation tier as a way to fund the Community tiers. Paying tiers see no sponsorship content.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-[#5A6E3D] mb-1 font-medium">Always allowed</div>
            <ul className="text-xs space-y-1" style={{ fontFamily: '"Fraunces", serif' }}>
              <li className="flex gap-2"><span className="text-[#5A6E3D]">✓</span><span>PoeTech upgrade prompts (internal)</span></li>
              <li className="flex gap-2"><span className="text-[#5A6E3D]">✓</span><span>Partner church & 501(c)(3) events</span></li>
              <li className="flex gap-2"><span className="text-[#5A6E3D]">✓</span><span>"PoeTech Picks" — vetted products + services we'd recommend to our own family</span></li>
              <li className="flex gap-2"><span className="text-[#5A6E3D]">✓</span><span>Educational sponsorships from credible institutions</span></li>
              <li className="flex gap-2"><span className="text-[#5A6E3D]">✓</span><span>Civic infrastructure (food banks, volunteer needs, community advocacy)</span></li>
            </ul>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-[#B85838] mb-1 font-medium">Never allowed</div>
            <ul className="text-xs space-y-1" style={{ fontFamily: '"Fraunces", serif' }}>
              <li className="flex gap-2"><span className="text-[#B85838]">✗</span><span>Behavioral targeting using your data</span></li>
              <li className="flex gap-2"><span className="text-[#B85838]">✗</span><span>Predatory financial products (payday loans, high-rate credit, sketchy investments)</span></li>
              <li className="flex gap-2"><span className="text-[#B85838]">✗</span><span>Programmatic / third-party ad networks</span></li>
              <li className="flex gap-2"><span className="text-[#B85838]">✗</span><span>Gambling, alcohol, tobacco, vice categories</span></li>
              <li className="flex gap-2"><span className="text-[#B85838]">✗</span><span>Anything PoeTech wouldn't recommend to its own family</span></li>
            </ul>
          </div>
        </div>
        <p className="text-xs text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>
          100% of sponsorship revenue funds the Community tier subscriptions. Transparent annual reporting: paying subscribers see what the underwriting funds. Sponsorship is part of the mission, not separate from it.
        </p>
      </section>

      <section className="bg-white border border-[#1A1815] p-5">
        <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] mb-2 font-medium">Sponsor Tiers · Limited Slots</div>
        <p className="text-sm leading-relaxed mb-4" style={{ fontFamily: '"Fraunces", serif' }}>
          Maximum 5-7 active sponsors at a time. Limited slots keep the platform trustworthy and the placements valuable. This is the opposite of programmatic ad networks — less here is better.
        </p>
        <div className="space-y-3">
          <div className="bg-[#FAF8F4] border border-[#1A1815] p-4">
            <div className="flex items-baseline justify-between gap-3 flex-wrap mb-1">
              <h4 className="text-lg" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>Foundation Sponsor</h4>
              <div className="text-xl" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>$25,000<span className="text-sm text-[#5A5751]">/yr</span></div>
            </div>
            <ul className="text-xs space-y-1" style={{ fontFamily: '"Fraunces", serif' }}>
              <li className="flex gap-2"><span className="text-[#B85838]">·</span><span>Featured "Brought to you by..." placement on Foundation tier</span></li>
              <li className="flex gap-2"><span className="text-[#B85838]">·</span><span>Prominent "PoeTech Picks" directory listing</span></li>
              <li className="flex gap-2"><span className="text-[#B85838]">·</span><span>Sponsor of a specific module's free-tier content</span></li>
              <li className="flex gap-2"><span className="text-[#B85838]">·</span><span>Quarterly newsletter co-branding</span></li>
              <li className="flex gap-2"><span className="text-[#B85838]">·</span><span>Maximum 2 active Foundation Sponsors at any time</span></li>
            </ul>
            <button type="button" onClick={() => openCart({ name: 'Foundation Sponsor', tagline: 'Featured placement · max 2 active', monthly: '25000', annual: '25000', features: ['Featured "Brought to you by..." placement on Foundation tier','Prominent "PoeTech Picks" directory listing','Sponsor of a specific module\'s free-tier content','Quarterly newsletter co-branding'], isSponsor: true })} className="mt-3 w-full bg-[#B85838] text-white text-xs uppercase tracking-wider py-2 font-semibold hover:bg-[#1A1815]">Sponsor · Pay first, vet in parallel →</button>
          </div>
          <div className="bg-[#FAF8F4] border border-[#1A1815] p-4">
            <div className="flex items-baseline justify-between gap-3 flex-wrap mb-1">
              <h4 className="text-lg" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>Module Sponsor</h4>
              <div className="text-xl" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>$10,000<span className="text-sm text-[#5A5751]">/yr</span></div>
            </div>
            <ul className="text-xs space-y-1" style={{ fontFamily: '"Fraunces", serif' }}>
              <li className="flex gap-2"><span className="text-[#B85838]">·</span><span>Standard placement on Foundation tier</span></li>
              <li className="flex gap-2"><span className="text-[#B85838]">·</span><span>Directory listing in "PoeTech Picks"</span></li>
              <li className="flex gap-2"><span className="text-[#B85838]">·</span><span>Annual co-branded educational content</span></li>
              <li className="flex gap-2"><span className="text-[#B85838]">·</span><span>Maximum 3 active Module Sponsors at any time</span></li>
            </ul>
            <button type="button" onClick={() => openCart({ name: 'Module Sponsor', tagline: 'Standard placement · max 3 active', monthly: '10000', annual: '10000', features: ['Standard placement on Foundation tier','Directory listing in "PoeTech Picks"','Annual co-branded educational content'], isSponsor: true })} className="mt-3 w-full bg-[#B85838] text-white text-xs uppercase tracking-wider py-2 font-semibold hover:bg-[#1A1815]">Sponsor · Pay first, vet in parallel →</button>
          </div>
          <div className="bg-[#FAF8F4] border border-[#1A1815] p-4">
            <div className="flex items-baseline justify-between gap-3 flex-wrap mb-1">
              <h4 className="text-lg" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>Directory Partner</h4>
              <div className="text-xl" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>$3,000<span className="text-sm text-[#5A5751]">/yr</span></div>
            </div>
            <ul className="text-xs space-y-1" style={{ fontFamily: '"Fraunces", serif' }}>
              <li className="flex gap-2"><span className="text-[#B85838]">·</span><span>"PoeTech Picks" directory listing</span></li>
              <li className="flex gap-2"><span className="text-[#B85838]">·</span><span>Annual mission-alignment review</span></li>
              <li className="flex gap-2"><span className="text-[#B85838]">·</span><span>Maximum 5 active Directory Partners</span></li>
            </ul>
            <button type="button" onClick={() => openCart({ name: 'Directory Partner', tagline: 'Directory listing · max 5 active', monthly: '3000', annual: '3000', features: ['"PoeTech Picks" directory listing','Annual mission-alignment review'], isSponsor: true })} className="mt-3 w-full bg-[#B85838] text-white text-xs uppercase tracking-wider py-2 font-semibold hover:bg-[#1A1815]">Sponsor · Pay first, vet in parallel →</button>
          </div>
        </div>
        <div className="mt-4 p-3 bg-[#FAF8F4] border-l-2 border-[#5A6E3D]">
          <div className="text-[10px] uppercase tracking-[0.2em] text-[#5A6E3D] font-medium mb-0.5">Revenue allocation</div>
          <p className="text-xs leading-relaxed" style={{ fontFamily: '"Fraunces", serif' }}>
            At full sponsor roster (~$80K-$150K/yr) this funds 200-500 Community-tier subscriptions. Transparent annual report shows every dollar.
          </p>
        </div>
      </section>

      <section className="bg-white border border-[#1A1815] p-5">
        <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] mb-2 font-medium">Vetting Framework · The PoeTech Standard</div>
        <p className="text-sm leading-relaxed mb-3" style={{ fontFamily: '"Fraunces", serif' }}>
          A potential sponsor must pass <strong>all eight criteria</strong>. Failing one means no. The decision committee (Darrell + Christina + trusted advisor) decides unanimously.
        </p>
        <div className="space-y-2 mb-4">
          {[
            { n: 1, title: 'Mission alignment', q: 'Does this company\'s mission align with stewardship, family stability, and dignity for the underserved?' },
            { n: 2, title: 'Business model integrity', q: 'How do they make money? Extractive economics (predatory lending dressed in good marketing) or genuine value creation?' },
            { n: 3, title: 'Customer treatment', q: 'BBB ratings · Google reviews · regulatory complaints · lawsuits · class actions.' },
            { n: 4, title: 'Yahweh-approves filter', q: 'No vice categories. Nothing PoeTech wouldn\'t recommend to its own family.' },
            { n: 5, title: 'Transparency', q: 'Clear pricing · clear terms of service · clear data practices · no buried fees.' },
            { n: 6, title: 'Regulatory compliance', q: 'Properly licensed and in good standing in every jurisdiction they operate.' },
            { n: 7, title: 'Ownership and leadership', q: 'Who actually owns and runs the company? Are they aligned, or is this a shell for someone else?' },
            { n: 8, title: 'Real conversation', q: 'Will their leadership get on a call and answer hard questions? If they won\'t, no.' },
          ].map(c => (
            <div key={c.n} className="flex gap-3 items-start">
              <div className="text-[#B85838] shrink-0 w-6 text-center" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{c.n}</div>
              <div>
                <div className="text-sm" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{c.title}</div>
                <div className="text-xs text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>{c.q}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="pt-3 border-t border-[#E8E4DC]">
          <div className="text-[10px] uppercase tracking-[0.2em] text-[#5A5751] font-medium mb-2">Vetting workflow</div>
          <ol className="text-xs text-[#5A5751] space-y-1" style={{ fontFamily: '"Fraunces", serif' }}>
            <li>1. Application submitted (online form)</li>
            <li>2. Initial review · 1 week · desk research</li>
            <li>3. Deep vetting · 2-4 weeks · customer references, regulatory check, leadership call</li>
            <li>4. Decision committee · <strong>unanimous required</strong></li>
            <li>5. 12-month contract · termination clause if mission alignment lapses</li>
            <li>6. Annual re-vetting · quarterly customer feedback check</li>
          </ol>
        </div>
      </section>

      <section className="bg-white border-2 border-[#B85838] p-5">
        <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] mb-2 font-medium">How Sponsorship Works · Pay First, Vet in Parallel</div>
        <p className="text-sm leading-relaxed mb-3" style={{ fontFamily: '"Fraunces", serif' }}>
          Pick a tier above and click <strong>Sponsor</strong>. Payment authorizes the slot reservation; vetting against the 8-criterion framework runs in parallel and typically completes in <strong>15 business days</strong>. If your sponsorship doesn't clear vetting, <strong>full refund within 5 business days</strong> — no questions, no friction. This protects both sides: you get a fast yes/no, and we keep the platform trustworthy.
        </p>
        <p className="text-sm leading-relaxed mb-3" style={{ fontFamily: '"Fraunces", serif' }}>
          Read the 8-criterion framework above and the never-allowed list before sponsoring — if your business doesn't fit, the vetting will return your money. Saves everyone time.
        </p>
        <p className="text-sm leading-relaxed" style={{ fontFamily: '"Fraunces", serif' }}>
          Questions before paying? Email <strong>contact@poetech.us</strong> with your mission, business model, ownership, regulatory status, and which tier you're considering. We'll respond within 3 business days. Limited slots — current opening status published quarterly.
        </p>
      </section>

      <section className="bg-white border border-[#1A1815] p-5">
        <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] mb-2 font-medium">The Integration Promise</div>
        <p className="text-sm leading-relaxed mb-2" style={{ fontFamily: '"Fraunces", serif' }}>
          Every module shares data with every other. When the home module detects an HVAC failure, the financial module sees the incident in the cash flow. When the health module measures stress, the financial module shows correlation with pressure. When the spiritual module marks a fast week, the financial module sees the grocery spend pattern.
        </p>
        <p className="text-sm leading-relaxed" style={{ fontFamily: '"Fraunces", serif' }}>
          One family. One picture. All the granular detail when you need it.
        </p>
      </section>

      {checkoutIntents.length > 0 && (
        <section className="bg-white border border-[#1A1815] p-5">
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] mb-2 font-medium">🛒 Checkout Intents · {checkoutIntents.length}</div>
          <h3 className="text-xl mb-3" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>Who's clicked Subscribe or Claim</h3>
          <div className="space-y-2">
            {checkoutIntents.slice().reverse().map(ci => (
              <div key={ci.id} className="border border-[#E8E4DC] p-3">
                <div className="flex items-baseline justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{ci.name} <span className="text-xs text-[#5A5751]">· {ci.email}</span></div>
                    <div className="text-xs text-[#5A5751] mt-0.5">
                      {ci.action === 'subscribe' ? 'Subscribe' : 'Claim'} · <strong>{ci.tierName}</strong> · {ci.billing === 'free' ? 'free' : `${ci.billing} ($${ci.price})`}
                    </div>
                    {ci.notes && <div className="text-[11px] text-[#5A5751] italic mt-1" style={{ fontFamily: '"Fraunces", serif' }}>{ci.notes}</div>}
                  </div>
                  <div className="flex items-baseline gap-2 shrink-0">
                    <div className="text-[10px] text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{new Date(ci.at).toLocaleDateString()}</div>
                    <button onClick={() => { if (confirm('Delete this checkout intent?')) deleteCheckoutIntent(ci.id); }} aria-label="Delete" className="text-sm text-[#5A5751] hover:text-[#B85838] hover:bg-[#FAF8F4] border border-transparent hover:border-[#B85838] px-3 py-1.5 min-h-[36px] min-w-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">×</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-[#5A5751] italic mt-3" style={{ fontFamily: '"Fraunces", serif' }}>
            Local-first capture. Email handshake is currently mailto - swap in a Stripe Payment Link in the cart drawer when ready.
          </p>
        </section>
      )}

      {cartTier && (
        <div className="fixed inset-0 z-50 bg-[#1A1815]/60 flex items-center justify-center p-4" onClick={closeCart}>
          <div className="bg-white border-2 border-[#1A1815] max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-[#1A1815] flex items-baseline justify-between gap-3 flex-wrap">
              <div>
                <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] font-semibold">🛒 Checkout</div>
                <h2 className="text-2xl mt-1" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{cartTier.name}</h2>
                <div className="text-xs text-[#5A5751] mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>{cartTier.tagline}</div>
              </div>
              <button onClick={closeCart} aria-label="Close" className="text-[10px] uppercase tracking-wider text-[#5A5751] hover:text-[#1A1815]">× Close</button>
            </div>

            <div className="p-5 space-y-4">
              {cartTier.isSponsor ? (
                <>
                  <div className="bg-[#FAF8F4] border-2 border-[#B85838] p-3">
                    <div className="flex items-baseline justify-between mb-2">
                      <div className="text-[10px] uppercase tracking-wider text-[#B85838] font-semibold">Annual sponsorship</div>
                      <div className="text-2xl" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>${(parseFloat(cartTier.annual) || 0).toLocaleString()}<span className="text-sm text-[#5A5751]">/yr</span></div>
                    </div>
                    <p className="text-xs leading-snug" style={{ fontFamily: '"Fraunces", serif' }}>
                      <strong>Pay first, vet after.</strong> Vetting against the 8 PoeTech criteria runs in parallel — typically 15 business days. If your sponsorship doesn't pass vetting, <strong>full refund within 5 business days</strong>. Limited slots; placement begins after vetting clears.
                    </p>
                  </div>
                </>
              ) : cartTier.monthly !== '0' ? (
                <>
                  <div>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => setCartBilling('monthly')} className={`p-3 text-left border ${cartBilling === 'monthly' ? 'border-[#1A1815] bg-[#1A1815] text-white' : 'border-[#E8E4DC] text-[#5A5751]'}`}>
                        <div className="text-[10px] uppercase tracking-wider opacity-75">Monthly</div>
                        <div className="text-xl mt-0.5" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>${cartTier.monthly}<span className="text-xs opacity-75">/mo</span></div>
                      </button>
                      <button onClick={() => setCartBilling('annual')} className={`p-3 text-left border ${cartBilling === 'annual' ? 'border-[#1A1815] bg-[#1A1815] text-white' : 'border-[#E8E4DC] text-[#5A5751]'}`}>
                        <div className="text-[10px] uppercase tracking-wider opacity-75">Annual · save ~17%</div>
                        <div className="text-xl mt-0.5" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>${cartTier.annual}<span className="text-xs opacity-75">/yr</span></div>
                      </button>
                    </div>
                  </div>
                  <div className="flex items-baseline justify-between pt-3 border-t border-[#E8E4DC]">
                    <div className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751]">Total today</div>
                    <div className="text-2xl" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>${cartBilling === 'annual' ? cartTier.annual : cartTier.monthly}<span className="text-sm text-[#5A5751]">{cartBilling === 'annual' ? '/yr' : '/mo'}</span></div>
                  </div>
                </>
              ) : (
                <div className="bg-[#FAF8F4] border border-[#5A6E3D] p-3">
                  <div className="text-[10px] uppercase tracking-wider text-[#5A6E3D] font-semibold">Free tier · no payment required</div>
                  <p className="text-xs mt-1" style={{ fontFamily: '"Fraunces", serif' }}>We'll confirm your eligibility and send access details. No card needed.</p>
                </div>
              )}

              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Name *</label>
                <input className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={cartName} onChange={e => setCartName(e.target.value)} placeholder="First Last" />
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Email *</label>
                <input type="email" className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={cartEmail} onChange={e => setCartEmail(e.target.value)} placeholder="you@example.com" />
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Notes (optional)</label>
                <textarea className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" rows="2" value={cartNotes} onChange={e => setCartNotes(e.target.value)} placeholder="Anything you want us to know (referral, timing, family size, questions)" />
              </div>

              {cartError && <div className="text-xs text-[#B85838] px-3 py-2 bg-[#FAF8F4] border border-[#B85838]" role="alert" style={{ fontFamily: '"Fraunces", serif' }}>{cartError}</div>}
              <button onClick={() => submitCart(cartTier.isSponsor ? 'sponsor' : cartTier.monthly === '0' ? 'claim' : 'subscribe')} className="w-full bg-[#1A1815] text-white py-3 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838]">
                {cartTier.isSponsor ? 'Sponsor · Pay now, vet in parallel' : cartTier.monthly === '0' ? 'Claim it · Send confirmation email' : 'Subscribe · Send confirmation email'}
              </button>
              <p className="text-[10px] text-[#5A5751] italic text-center" style={{ fontFamily: '"Fraunces", serif' }}>
                Opens your email client to finish the request. Logged locally in Checkout Intents below.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


export default About;
