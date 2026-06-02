// DevOps · Opportunities engine — extracted from monolith (r35) per
// MODULAR-EXTENSIBILITY.md. Helpers/constants passed as props to keep
// monolith-side data ownership (OPPORTUNITY_LIBRARY lives there).
import React, { useState } from 'react';
import { SectionTitle, MetricCell } from './shared.jsx';

const fmt = (n) => n == null || !isFinite(n) ? '—' : `${n < 0 ? '-' : ''}$${Math.abs(Math.round(n)).toLocaleString()}`;
const fmtCompact = (n) => { if (n == null || !isFinite(n)) return '—'; const a = Math.abs(n); const sign = n < 0 ? '-' : ''; if (a >= 1000000000) return `${sign}$${(a/1000000000).toFixed(2)}B`; if (a >= 1000000) return `${sign}$${(a/1000000).toFixed(1)}M`; if (a >= 1000) return `${sign}$${Math.round(a/1000)}k`; return `${sign}$${Math.round(a)}`; };

function Opportunities({ opportunities, totals, skillProfiles = [], addSkillProfile, updateSkillProfile, deleteSkillProfile, userTier, addProject, addScope, addCapexItem, setView, projects = [], OPPORTUNITY_LIBRARY = [], matchOpportunities, capacityDecisionForNewProject, tierMeets = () => false, TIER_LABEL = {} }) {
  const grouped = opportunities.reduce((acc, o) => { (acc[o.person] = acc[o.person] || []).push(o); return acc; }, {});

  // Tier-gated count of opportunities shown per profile.
  const optionsPerProfile = (() => {
    if (tierMeets(userTier, 'family')) return 6;       // full library access
    if (tierMeets(userTier, 'poetech-plus')) return 3;
    return 1;                                            // Foundation tease
  })();
  const canWrap = tierMeets(userTier, 'premium');

  // Skill profile editor
  const blankProfile = () => ({ name: '', skills: '', hoursPerWeek: 0, monthlyIncome: 0, location: '', techComfort: 3, notes: '' });
  const [profileForm, setProfileForm] = useState(blankProfile());
  const [editingProfileId, setEditingProfileId] = useState(null);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const startAddProfile = () => { setProfileForm(blankProfile()); setEditingProfileId(null); setShowProfileForm(true); };
  const startEditProfile = (p) => { setProfileForm({ ...p }); setEditingProfileId(p.id); setShowProfileForm(true); };
  const cancelProfile = () => { setShowProfileForm(false); setEditingProfileId(null); };
  const submitProfile = () => {
    if (!profileForm.name) { alert('Profile name is required.'); return; }
    if (editingProfileId) updateSkillProfile && updateSkillProfile(editingProfileId, profileForm);
    else addSkillProfile && addSkillProfile(profileForm);
    cancelProfile();
  };
  const fieldCls = 'w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838]';
  const labelCls = 'text-[9px] uppercase tracking-wider text-[#5A5751]';

  // Wrap-me-with-the-tech handler — auto-create Project + Scope from an opportunity.
  // Round 11: capacity check first. If adding this project would push the family
  // over their available hours/week, prompt to park as TBD instead of stacking
  // another commitment they can't actually do.
  const wrapWithTech = (op, profile) => {
    if (!canWrap) { alert(`The "Wrap me with the tech" handoff unlocks at ${TIER_LABEL['premium']}. See pricing tiers in About.`); return; }
    const decision = capacityDecisionForNewProject(projects, skillProfiles, op.hoursPerWeek, {
      label: `"${op.title}" (${op.hoursPerWeek} hrs/wk)`,
    });
    if (decision.decision === 'cancel') return;
    const projectStatus = decision.decision === 'add-tbd' ? 'tbd' : 'planning';
    const today = new Date(); const isoToday = today.toISOString().slice(0, 10);
    const endIso = new Date(today.getTime() + 30 * 86400000).toISOString().slice(0, 10);
    const projectTitle = `${profile.name} · ${op.title}${projectStatus === 'tbd' ? ' (TBD)' : ''}`;
    addProject && addProject({
      title: projectTitle,
      startDate: isoToday,
      endDate: endIso,
      status: projectStatus,
      domain: 'business-poetech',
      description: `Auto-created from Dev/Ops opportunity matcher.${projectStatus === 'tbd' ? '\n\n⚐ TBD · parked because the family is already at or near capacity. Promote to Active from Projects tab when bandwidth opens up.' : ''}\n\nOpportunity: ${op.title} (${op.category})\nSkill tags: ${op.skillTags.join(', ')}\nTypical earnings: $${op.earningsLow}–$${op.earningsHigh}/mo · ${op.hoursPerWeek} hrs/wk\nStartup cost: $${op.startupCost} · time to first dollar: ${op.timeToFirstDollar}\n\nExample to model: ${op.example}\n\nPoeTech wraps you with: ${op.techStack}`,
      hoursPerWeek: op.hoursPerWeek,
      entityId: 'e-personal',
      contractorIds: [],
      conversationLog: [],
    });
    addScope && addScope({
      templateType: 'service',
      templateName: 'Service Engagement',
      title: `Build kit · ${op.title}`,
      entityId: 'e-personal',
      projectId: '', // user can link to the new project after the auto-created project gets its id
      contractorName: '', contractorEmail: '', contractorPhone: '',
      scopeOfWork: `Build the tech stack to wrap ${profile.name} into the "${op.title}" path.\n\nWhat PoeTech delivers: ${op.techStack}`,
      deliverables: '',
      materials: '',
      schedule: `Discovery within 1 week. Build target: ${endIso}.`,
      paymentTerms: '',
      acceptanceCriteria: '',
      requirements: '',
      warranty: '',
    });
    if (op.startupCost > 0 && addCapexItem) {
      addCapexItem({
        category: 'Tools', name: `Startup kit · ${op.title}`, description: `Initial equipment / setup for ${op.title}`,
        link: '', priority: 2, cost: op.startupCost, neededBy: 'Soon', status: 'planned', notes: `Linked to Dev/Ops opportunity. Typical first-dollar timing: ${op.timeToFirstDollar}.`,
        entityId: 'e-personal', module: '', projectId: '',
        purchaseTargetDate: endIso, locationId: '', purchasedFromAccountId: '',
        make: '', model: '', serial: '',
      });
    }
    alert(`Created a project "${projectTitle}" + a draft scope. Open the Projects tab to refine details.`);
    if (setView) setView('projects');
  };

  return (
    <div className="space-y-10">
      {/* HERO — orient the user */}
      <section className="bg-white border border-[#1A1815] p-5 sm:p-6">
        <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] mb-1 font-medium">Dev/Ops · Your Entrepreneurial Options</div>
        <h2 className="text-2xl sm:text-3xl" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600, letterSpacing: '-0.02em' }}>Your skills · what's working for people like you · how PoeTech wraps it.</h2>
        <p className="text-sm leading-relaxed mt-2 text-[#5A5751] max-w-prose" style={{ fontFamily: '"Fraunces", serif' }}>
          Add the skills, hours, and situation of each person in your household. We match them against curated entrepreneurial paths that real people run today, with what PoeTech can build to wrap that path in tech. <strong>You're seeing {optionsPerProfile} option{optionsPerProfile === 1 ? '' : 's'} per person at your tier.</strong>
        </p>
      </section>

      {/* SKILL PROFILES — editor */}
      <section aria-labelledby="profiles-h">
        <div className="flex items-baseline justify-between mb-2 pb-2 border-b border-[#1A1815] gap-2 flex-wrap">
          <h3 id="profiles-h" className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751]">My Skills &amp; Situation · {skillProfiles.length} {skillProfiles.length === 1 ? 'profile' : 'profiles'}</h3>
          <button type="button" onClick={() => showProfileForm ? cancelProfile() : startAddProfile()} className="text-[10px] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]">{showProfileForm ? '× Cancel' : '+ Add a profile'}</button>
        </div>
        {showProfileForm && (
          <div className="bg-white border border-[#B85838] p-3 mb-3 space-y-2">
            <div className="text-[10px] uppercase tracking-[0.2em] text-[#B85838] font-medium">{editingProfileId ? 'Edit profile' : 'New profile'}</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div><label htmlFor="sp-name" className={labelCls}>Name</label><input id="sp-name" className={fieldCls} value={profileForm.name} onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} /></div>
              <div><label htmlFor="sp-loc" className={labelCls}>Location (city, state)</label><input id="sp-loc" className={fieldCls} value={profileForm.location} onChange={e => setProfileForm({ ...profileForm, location: e.target.value })} /></div>
              <div><label htmlFor="sp-tech" className={labelCls}>Tech comfort (1–5)</label><input id="sp-tech" type="number" min="1" max="5" className={fieldCls} value={profileForm.techComfort} onChange={e => setProfileForm({ ...profileForm, techComfort: parseInt(e.target.value) || 3 })} /></div>
            </div>
            <div><label htmlFor="sp-skills" className={labelCls}>Skills (comma-separated tags)</label><textarea id="sp-skills" rows="2" className={fieldCls} placeholder="e.g., carpentry, plumbing, spanish, sales, teaching" value={profileForm.skills} onChange={e => setProfileForm({ ...profileForm, skills: e.target.value })} /></div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div><label htmlFor="sp-hours" className={labelCls}>Hours/week available</label><input id="sp-hours" type="number" min="0" max="80" className={fieldCls} value={profileForm.hoursPerWeek} onChange={e => setProfileForm({ ...profileForm, hoursPerWeek: parseInt(e.target.value) || 0 })} /></div>
              <div><label htmlFor="sp-income" className={labelCls}>Current monthly income</label><input id="sp-income" type="number" min="0" className={fieldCls} value={profileForm.monthlyIncome} onChange={e => setProfileForm({ ...profileForm, monthlyIncome: parseInt(e.target.value) || 0 })} /></div>
            </div>
            <div><label htmlFor="sp-notes" className={labelCls}>Notes</label><input id="sp-notes" className={fieldCls} value={profileForm.notes} onChange={e => setProfileForm({ ...profileForm, notes: e.target.value })} /></div>
            <button type="button" onClick={submitProfile} className="w-full bg-[#1A1815] text-white py-2 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]">{editingProfileId ? 'Save Changes' : 'Save Profile'}</button>
          </div>
        )}
        {skillProfiles.length === 0 ? (
          <p className="text-xs text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>No profiles yet — add one above to see personalized options.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {skillProfiles.map(p => (
              <div key={p.id} className="bg-white border border-[#E8E4DC] p-3">
                <div className="flex items-baseline justify-between gap-2 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{p.name}</div>
                    <div className="text-[10px] uppercase tracking-wider text-[#5A5751]">{p.hoursPerWeek}h/wk · {fmt(p.monthlyIncome)}/mo · tech {p.techComfort}/5{p.location ? ` · ${p.location}` : ''}</div>
                    {p.skills && <div className="text-xs text-[#5A5751] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>{p.skills}</div>}
                    {p.notes && <div className="text-[11px] text-[#5A5751] italic mt-1" style={{ fontFamily: '"Fraunces", serif' }}>{p.notes}</div>}
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <button type="button" onClick={() => startEditProfile(p)} className="text-xs uppercase tracking-wider text-[#5A5751] hover:text-[#1A1815] hover:bg-[#FAF8F4] border border-transparent hover:border-[#1A1815] px-3 py-1.5 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">Edit</button>
                  <span aria-hidden="true" className="h-5 w-px bg-[#E8E4DC] ml-auto" />
                  <button type="button" onClick={() => { if (confirm(`Delete profile "${p.name}"? Personalized options for them will disappear.`)) deleteSkillProfile && deleteSkillProfile(p.id); }} className="text-xs uppercase tracking-wider text-[#5A5751] hover:text-[#B85838] hover:bg-[#FAF8F4] border border-transparent hover:border-[#B85838] px-3 py-1.5 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* PERSONALIZED OPTIONS PER PROFILE */}
      <section aria-labelledby="options-h">
        <h3 id="options-h" className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751] mb-2 pb-2 border-b border-[#1A1815]">Personalized Options · top {optionsPerProfile} per profile</h3>
        {skillProfiles.length === 0 && <p className="text-sm text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>Add a profile above to unlock matched options.</p>}
        <div className="space-y-6">
          {skillProfiles.map(profile => {
            const matches = matchOpportunities(profile, OPPORTUNITY_LIBRARY).slice(0, optionsPerProfile);
            return (
              <div key={profile.id}>
                <h4 className="text-sm mb-2" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{profile.name}</h4>
                {matches.length === 0 ? (
                  <p className="text-xs text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>No matches yet. Add more skill tags to {profile.name}'s profile (e.g., "teaching, music, real estate").</p>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {matches.map(op => (
                      <article key={op.id} className="bg-white border border-[#1A1815] p-4">
                        <div className="flex items-baseline justify-between gap-2 flex-wrap mb-1">
                          <div>
                            <div className="text-[10px] uppercase tracking-wider text-[#B85838] font-semibold">{op.category}</div>
                            <h5 className="text-base" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{op.title}</h5>
                          </div>
                          <div className="text-right">
                            <div className="text-base" style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{fmt(op.earningsLow)}–{fmt(op.earningsHigh)}<span className="text-xs text-[#5A5751]">/mo</span></div>
                            <div className="text-[10px] uppercase tracking-wider text-[#5A5751]">{op.hoursPerWeek}h/wk · startup {fmt(op.startupCost)}</div>
                          </div>
                        </div>
                        <div className="text-[10px] uppercase tracking-wider text-[#5A5751] mb-2">first dollar: {op.timeToFirstDollar}</div>
                        <p className="text-sm text-[#5A5751] leading-snug mb-2" style={{ fontFamily: '"Fraunces", serif' }}><strong>Example:</strong> {op.example}</p>
                        <p className="text-xs leading-snug bg-[#FAF8F4] border border-[#E8E4DC] p-2" style={{ fontFamily: '"Fraunces", serif' }}>🛠 {op.techStack}</p>
                        <div className="flex items-center gap-2 mt-3 flex-wrap">
                          <button type="button" onClick={() => wrapWithTech(op, profile)} disabled={!canWrap} className={`text-xs uppercase tracking-wider px-3 py-2 font-semibold focus:outline focus:outline-2 focus:outline-[#B85838] ${canWrap ? 'bg-[#1A1815] text-white hover:bg-[#B85838]' : 'bg-[#E8E4DC] text-[#5A5751] cursor-not-allowed'}`} title={canWrap ? 'Auto-create a project + scope + capex item' : `Unlocks at ${TIER_LABEL['premium']}`}>
                            {canWrap ? '🛠 Wrap me with the tech →' : `🔒 Wrap me (unlocks at ${TIER_LABEL['premium']})`}
                          </button>
                          <span className="text-[10px] uppercase tracking-wider text-[#5A5751]">matched on: {op.skillTags.slice(0, 3).join(' · ')}</span>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <p className="text-[10px] text-[#5A5751] italic mt-4 max-w-prose" style={{ fontFamily: '"Fraunces", serif' }}>
          Examples are composites drawn from public reporting and industry surveys, not specific individuals. Earnings ranges reflect typical solo / small-team operators in the US; your mileage will vary by region, hours, and time invested.
        </p>
      </section>

      {/* MY ACTIVE PIPELINE — kept from prior version */}
      <section aria-labelledby="pipeline-h">
        <SectionTitle eyebrow="Pipeline">My Active Pipeline · Near-term opportunities</SectionTitle>
        <p id="pipeline-h" className="text-sm text-[#5A5751] leading-relaxed max-w-prose mb-3" style={{ fontFamily: '"Fraunces", serif' }}>
          What's actively in motion this year. Each row compounds into the household projection. Active conversations get priority.
        </p>
        {Object.entries(grouped).map(([person, items]) => (
          <section key={person} className="mb-4">
            <h3 className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751] mb-2">{person}</h3>
            <div className="bg-white border border-[#1A1815]">
              {items.map((o, i) => (
                <div key={o.id} className={`p-4 ${i < items.length - 1 ? 'border-b border-[#E8E4DC]' : ''} ${o.flag ? 'bg-[#FAF8F4]' : ''}`}>
                  <div className="flex justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{o.what}</span>
                        {o.flag && <span className="text-[10px] uppercase tracking-wider text-[#B85838] font-medium">⚠ Priority</span>}
                      </div>
                      <div className="text-xs text-[#5A5751]">{o.skill} · {o.status}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-lg" style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{fmt(o.monthly)}</div>
                      <div className="text-[10px] uppercase tracking-wider text-[#5A5751]">/ mo</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </section>

      {/* DEMOTED — was the lead, now the answer to "I picked one, who builds it?" */}
      <section className="bg-[#FAF8F4] border border-[#1A1815] p-4 sm:p-5">
        <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] font-semibold mb-1">Picked one? Here's how PoeTech wraps it.</div>
        <p className="text-sm text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
          The four engagement models below are how PoeTech actually builds the technology around an option you pick — from a Saturday hobbyist setup up through full enterprise transformation.
        </p>
      </section>
      <PoeTechServicesPortfolio />
      <PoeTechProjections />
      <LowHangingFruit />
      <PoeTechDifferentiation />
    </div>
  );
}

// =============================================================================
// Dev/Ops presentational siblings — moved from poe-financial-mvp-v28.jsx (r40)
// per MODULAR-EXTENSIBILITY.md. All four were referenced by <Opportunities/>
// at the bottom of the tab but their definitions were left in the monolith
// during r35, throwing ReferenceError at runtime on the Dev/Ops tab.
// =============================================================================

function PoeTechDifferentiation() {
  const moats = [
    {
      kind: 'Structural',
      title: 'Faith-integrated framework',
      detail: 'Cannot be replicated by VC-backed competitors. Worldview is woven through every module — Original Business Systems, debt-freedom theology, Sabbath rest. A bigger competitor would have to fundamentally re-architect to copy this, and would alienate their existing market doing so.',
      strength: 'Strong'
    },
    {
      kind: 'Structural',
      title: 'Local-first architecture',
      detail: 'Data stays on the user\'s device. No cloud lock-in, no surveillance capitalism, no compliance debt at the platform level. Reverses the SaaS norm. Larger SaaS companies are architecturally cloud-first — they can\'t pivot without losing their margin model.',
      strength: 'Strong'
    },
    {
      kind: 'Structural',
      title: 'Sponsored Community tier',
      detail: '100% of sponsorship revenue funds free Community tier for families in need. Cannot be done by VC-backed companies who must return capital. Inverts the typical SaaS incentive — generosity is the business model, not a side feature.',
      strength: 'Strong'
    },
    {
      kind: 'Authenticity',
      title: 'Vertical integration with real businesses',
      detail: 'Vertical integration with real family-owned businesses across real estate (multi-property rental management), a multi-clinician faith-integrated counseling practice, and active church ministry operations. Every workflow tested on actual family businesses before it ships. Competitors would need to start parallel businesses to match this provenance.',
      strength: 'Strong'
    },
    {
      kind: 'Authenticity',
      title: 'Family-owned · No external capital',
      detail: 'No board pressure to extract value, no exit timeline. Long-term horizon (5-10 years to scale). Patient builders, not stock-option engineers. Customers feel this in every product decision — no growth hacks, no dark patterns, no urgency manipulation.',
      strength: 'Medium-Strong'
    },
    {
      kind: 'Market',
      title: 'Underserved-markets focus',
      detail: '10 specific populations: adult children caring for aging parents · kinship caregivers · foster families · reentry/formerly incarcerated · single-parent small business owners · small Black-owned contractors · independent farmers · small churches · IEP families · direct-care workers. Broad SaaS won\'t target these. Few competitors can credibly serve them.',
      strength: 'Medium-Strong'
    },
    {
      kind: 'Economic',
      title: 'Replaces $400-1000/mo of SaaS stack',
      detail: 'Business tier ($249) replaces: QuickBooks ($30-90) + CRM ($30-50) + project management ($20-30) + practice management ($75-150) + property tracking ($50-100) + scheduling ($14-29) + accounting consult ($50-200) + spreadsheet sprawl ($0 but real cost). Real math, real value, easy to explain.',
      strength: 'Medium-Strong'
    },
    {
      kind: 'Bundled',
      title: 'Unified across life and work',
      detail: 'Financial + Practice + Projects + Spiritual + Community in one tool. Most competitors do ONE domain well (Stessa for rentals, QuickBooks for books, Practice Better for clinics). PoeTech is the only platform organized around a family rather than a function.',
      strength: 'Medium'
    },
  ];

  const competitiveLandscape = [
    { competitor: 'YNAB', segment: 'Personal budget', overlap: 'Financial only · no faith · no business · no community · cloud-only', price: '$14.99/mo' },
    { competitor: 'QuickBooks', segment: 'Small business accounting', overlap: 'Books only · enterprise-feel · no family integration', price: '$30-90/mo' },
    { competitor: 'Stessa', segment: 'Rental properties', overlap: 'Rentals only · no consumer debt · no practice · no spiritual', price: '$0-30/mo' },
    { competitor: 'Notion / Airtable', segment: 'General-purpose', overlap: 'Build-your-own · no opinionated framework · no faith · no community', price: '$10-40/mo' },
    { competitor: 'Practice Better / SimplePractice', segment: 'Clinical practice', overlap: 'Practice ops only · no family financial · HIPAA-heavy', price: '$50-150/mo' },
    { competitor: 'Faith-integrated SaaS', segment: '(direct competitor)', overlap: 'None identified at the family-OS layer', price: 'N/A' },
  ];

  return (
    <section>
      <SectionTitle eyebrow="Differentiation">Why $249 Holds · The Moats</SectionTitle>
      <p className="text-sm text-[#5A5751] leading-relaxed max-w-prose mb-4" style={{ fontFamily: '"Fraunces", serif' }}>
        The honest answer to "why wouldn't a bigger competitor undercut us?" — they can't, structurally. The moats below are not marketing claims; they're architectural and economic facts that competitors would have to fundamentally rebuild to match. Some take years and capital changes that VC-backed companies can't make.
      </p>

      <div className="space-y-2 mb-6">
        {moats.map((m, i) => (
          <div key={i} className="bg-white border border-[#E8E4DC] p-4 hover:border-[#1A1815] transition-colors">
            <div className="flex items-baseline justify-between gap-2 mb-1 flex-wrap">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] font-semibold">{m.kind}</span>
                <h4 className="text-base" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{m.title}</h4>
              </div>
              <span className={`text-[10px] uppercase tracking-wider font-semibold ${m.strength === 'Strong' ? 'text-[#5A6E3D]' : 'text-[#5A5751]'}`}>{m.strength}</span>
            </div>
            <p className="text-sm text-[#5A5751] leading-relaxed" style={{ fontFamily: '"Fraunces", serif' }}>{m.detail}</p>
          </div>
        ))}
      </div>

      <h3 className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751] mb-3 pb-2 border-b border-[#1A1815]">Competitive Landscape</h3>
      <div className="bg-white border border-[#1A1815]">
        <div className="grid grid-cols-12 gap-2 p-3 border-b-2 border-[#1A1815] text-[10px] uppercase tracking-wider text-[#5A5751] bg-[#FAF8F4]">
          <div className="col-span-3">Competitor</div>
          <div className="col-span-3">Segment</div>
          <div className="col-span-4">What overlaps · what doesn't</div>
          <div className="col-span-2 text-right">Pricing</div>
        </div>
        {competitiveLandscape.map((c, i) => (
          <div key={i} className={`grid grid-cols-12 gap-2 p-3 text-xs ${i < competitiveLandscape.length - 1 ? 'border-b border-[#E8E4DC]' : ''}`} style={{ fontFamily: '"Fraunces", serif' }}>
            <div className="col-span-3" style={{ fontWeight: 600 }}>{c.competitor}</div>
            <div className="col-span-3 text-[#5A5751]">{c.segment}</div>
            <div className="col-span-4 text-[#5A5751]">{c.overlap}</div>
            <div className="col-span-2 text-right" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{c.price}</div>
          </div>
        ))}
      </div>
      <p className="text-xs text-[#5A5751] italic mt-3" style={{ fontFamily: '"Fraunces", serif' }}>
        <strong>Bottom line:</strong> there is no direct competitor at the family-OS layer with faith integration. The closest peers each do ONE domain well — none integrate financial + clinical + rental + project + community + spiritual into a single sovereign tool for a family-led household and business. We are genuinely first to this combination, and structural moats make it expensive for any competitor to follow.
      </p>
    </section>
  );
}

function LowHangingFruit() {
  const opportunities = [
    {
      name: 'TLC Group Therapy Cohorts',
      effort: 'Low',
      revenue: '$10-18K/yr',
      window: 'Quarter 1',
      who: 'Practice partner',
      detail: 'Group therapy is already listed on partner practice sites. Run 4-6 cohorts/year, 6-8 weeks each, 6-8 participants. At $200-400 total per participant, each cohort = $2-3K. Higher margin than 1:1. Real clinical impact at scale.',
    },
    {
      name: 'Partner Church Faith + Finance Workshop',
      effort: 'Low',
      revenue: '$5-15K/yr',
      window: 'Quarter 1-2',
      who: 'Founder',
      detail: 'Operators already teaching at a partner church. Quarterly workshop series on faith-integrated stewardship. Love offering $25-50 × 20-50 attendees × 4 events/yr. Also drives Loved Ones tier sign-ups and warm market for PoeTech.',
    },
    {
      name: 'Affiliate revenue from tools we recommend',
      effort: 'Very low',
      revenue: '$100-500/mo passive',
      window: 'Immediate',
      who: 'Setup once',
      detail: 'Acuity, Stripe, Cloudflare, KDP, hosting providers — all have affiliate programs. We recommend them anyway. Sign up, get unique links, use in product + briefs. $0 work after setup. Recurring passively.',
    },
    {
      name: 'PoeTech Stewardship Newsletter',
      effort: 'Medium (weekly)',
      revenue: '$500-2K/mo within 6mo',
      window: 'Quarter 2',
      who: 'Darrell',
      detail: 'Repurpose strategic briefs into weekly Substack/Beehiiv content. Faith + finance + family-led business. Build free audience first. Add paid tier ($5-10/mo) when 1K+ subscribers. Drives platform discovery.',
    },
    {
      name: 'Pre-Marital Bundle (Counseling + Finance partners)',
      effort: 'Medium',
      revenue: '$1-3K/mo',
      window: 'Quarter 2',
      who: 'Both',
      detail: '6-session package: couples counseling (Wellness Counseling partner) + financial planning (PoeTech founder) + faith curriculum + planning workbook. $499-999 one-time. 2-3 couples/month from partner church referrals + counseling pipeline. Unique combined offering.',
    },
    {
      name: 'MSW Supervision Hours',
      effort: 'Low (within Christina\'s practice)',
      revenue: '$1-5K/mo',
      window: 'Quarter 1',
      who: 'Lead clinician (or senior contractors)',
      detail: 'New LCSWs need 100+ supervision hours from senior clinicians. Lead clinician supervises 2-4 supervisees at $75-150/hr × 4-8 hrs/wk. Adjacent revenue to existing clinical practice. Helps grow the partner practice team simultaneously.',
    },
    {
      name: 'Scope Template Downloads',
      effort: 'Very low (one-time productize)',
      revenue: '$200-2K/mo passive',
      window: 'Quarter 2',
      who: 'Setup once',
      detail: 'Productize the contractor scope templates as standalone PDF downloads. $19-49 each. Sold to non-subscribers who want the document without the app. Gumroad or PoeTech Bookstore. Drives subscription upgrades.',
    },
    {
      name: 'Small Landlord Tier ($99/mo)',
      effort: 'Low (already built)',
      revenue: 'Fills gap between $89-$149',
      window: 'Phase 5 (with billing)',
      who: 'Product',
      detail: 'Add a $99/mo "Small Landlord" tier between Family and Premium. For people with 1-5 rentals who need property tracking but not full business features. PoeTech\'s Rentals + Books + Projects modules without Practice. Captures landlords who find the Premium tier overshoots.',
    },
  ];

  const totalLow = opportunities.reduce((s, o) => {
    const match = o.revenue.match(/\$([\d.]+)-([\d.]+)K?/);
    if (!match) return s;
    const low = parseFloat(match[1]) * (o.revenue.includes('K') ? 1000 : 1);
    return s + (o.revenue.includes('/mo') ? low * 12 : low);
  }, 0);

  return (
    <section>
      <SectionTitle eyebrow="Low-Hanging Fruit">Revenue Not Yet On The Radar</SectionTitle>
      <p className="text-sm text-[#5A5751] leading-relaxed max-w-prose mb-4" style={{ fontFamily: '"Fraunces", serif' }}>
        Eight near-term revenue streams using existing assets — partner clinical practice, partner church teaching access, scope templates, content. Most require setup once and produce recurring revenue. Conservative aggregate: <strong>~${(totalLow/1000).toFixed(0)}K-${(totalLow * 2 / 1000).toFixed(0)}K Year 1</strong> beyond the subscription business.
      </p>
      <div className="space-y-2">
        {opportunities.map((o, i) => (
          <div key={i} className="bg-white border border-[#E8E4DC] p-4 hover:border-[#5A6E3D] transition-colors">
            <div className="flex items-baseline justify-between gap-2 mb-1 flex-wrap">
              <h4 className="text-base" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{o.name}</h4>
              <div className="text-base text-[#5A6E3D]" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{o.revenue}</div>
            </div>
            <div className="flex items-baseline gap-3 mb-2 flex-wrap text-[10px] uppercase tracking-wider">
              <span className="text-[#5A5751]"><span className="text-[#B85838] font-semibold">Effort:</span> {o.effort}</span>
              <span className="text-[#5A5751]"><span className="text-[#B85838] font-semibold">Window:</span> {o.window}</span>
              <span className="text-[#5A5751]"><span className="text-[#B85838] font-semibold">Who:</span> {o.who}</span>
            </div>
            <p className="text-sm text-[#5A5751] leading-relaxed" style={{ fontFamily: '"Fraunces", serif' }}>{o.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function PoeTechServicesPortfolio() {
  const models = [
    {
      name: 'Hourly · Per Project',
      tagline: 'Pay for time. Walk away with a deliverable.',
      pricing: '$150–$300/hr · $5K–$25K typical project',
      best: 'For individuals or organizations with a specific build need and budget. Defined scope, fixed timeline, clean handoff.',
      includes: ['Situational analysis · technical feasibility','Build the thing (web, mobile, integrations)','Documentation for handoff','30 days of support after delivery'],
      forWho: 'Churches building event registration. Small businesses needing custom tools. Independent practitioners (like Christina) wanting workflow automation.',
      color: 'border-[#1A1815]',
    },
    {
      name: 'Retainer · Ongoing Access',
      tagline: 'A trained technologist team you can see and talk to. For a fee that\'s worth it.',
      pricing: '$2K–$5K/mo · 6-month minimum',
      best: 'For founders with an idea and some background who need a thinking partner. Strategic + tactical access. Hand-holding without hand-outs.',
      includes: ['Weekly strategy session','Continuous build progress','Direct access to Darrell + team','Tools & systems setup','Personal touch — relational, not transactional'],
      forWho: 'The warm prospects you mentioned — people with business + some tech background but not enough to build alone. They need someone to see and talk to.',
      color: 'border-[#B85838]',
    },
    {
      name: 'Revenue Share · 1099 Partnership',
      tagline: 'Equity-like stake in the resulting business. We build together. Split the profits.',
      pricing: '20%–49% ownership (negotiable based on lift)',
      best: 'For founders whose idea is strong but capital is short. We do situational analysis, build, and grow it together. Aligned incentives — PoeTech wins when you win.',
      includes: ['All Retainer features','Full situational analysis + market research','Full build · ongoing iteration','Strategic operations support','PoeTech holds 1099 ownership stake in resulting LLC','Profits split per agreed structure'],
      forWho: 'Founders who would otherwise have to dilute themselves into venture capital. The Yahweh-approves alternative: keep ownership in the community, not Sand Hill Road.',
      color: 'border-[#5A6E3D]',
    },
    {
      name: 'Enterprise · Transformation',
      tagline: 'For big businesses tired of $5M-per-year, 5-year BigCo engagements ($25M total). Pay us what the work is worth.',
      pricing: '$50K–$5M projects · $25K–$75K/mo retainers · $400–$800/hr senior rate',
      best: 'For mid-large companies who need major build, integration, or transformation work — where compressed delivery and senior depth matter more than headcount. Premium pricing reflects compressed time AND saving you from a relationship with money-pit consulting firms.',
      includes: ['Senior architect on every call · no junior delegation','Compressed delivery — 6 months where BigCo quotes 18+','Modern stack expertise (not legacy Java/SOAP shops)','Direct executive relationship · no account-management layer','Outcome-based scoping — fixed milestones, not endless billable hours','Knowledge transfer · your team owns it after handoff'],
      forWho: 'CTOs, CIOs, COOs facing the standard BigCo offer: $5M per year × 5 years = $25M, delivered slowly with a fraction of the promised value. Our model inverts that math. Pay us $3M for ~2 months of compressed senior work and walk away with $5M of delivered value — saving $22M AND four-and-a-half years on the same problem. Pricing scales from focused $50K interventions to full $5M transformations. Fair because it reflects time saved AND value delivered.',
      color: 'border-[#1A1815]',
    },
  ];

  return (
    <section>
      <SectionTitle eyebrow="PoeTech Services">Four Ways to Work Together</SectionTitle>
      <p className="text-sm text-[#5A5751] leading-relaxed max-w-prose mb-4" style={{ fontFamily: '"Fraunces", serif' }}>
        PoeTech-the-product (Family OS app) compounds over years. PoeTech-the-services pays the bills this month and the next, and seeds business systems for organizations and individuals who have ideas but need a trained team to bring them to life. <strong>You see us. You talk to us. The personal touch is the point.</strong>
      </p>

      {/* v27: Why Hire Us — direct positioning callout */}
      <div className="bg-white border-2 border-[#B85838] p-5 sm:p-6 mb-5">
        <div className="text-[10px] uppercase tracking-[0.3em] text-[#B85838] font-semibold mb-2">Why Hire Us · Not Them</div>
        <h3 className="text-2xl sm:text-3xl mb-3" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600, letterSpacing: '-0.02em' }}>
          Faster and better than the big team because it's intimate.
        </h3>
        <p className="text-base leading-relaxed mb-3" style={{ fontFamily: '"Fraunces", serif' }}>
          We only take on so many projects at a time. That focus is the point — not a limitation. We get done faster and have more impact because we're <strong>built to run lean</strong>, and it's reflected in the price.
        </p>
        <div className="bg-[#FAF8F4] border border-[#1A1815] p-4 my-4">
          <p className="text-base leading-relaxed" style={{ fontFamily: '"Fraunces", serif' }}>
            <strong>Do you want to meet for 6 months to get what we can get done in 6 weeks?</strong>
          </p>
          <p className="text-sm text-[#5A5751] mt-2" style={{ fontFamily: '"Fraunces", serif' }}>
            Oh, and we have hands-on experience in the dev/ops <em>and</em> business worlds. Not just consultants. Not just engineers. <strong>Operators who ship.</strong>
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="bg-[#FAF8F4] p-3">
            <div className="text-[10px] uppercase tracking-[0.2em] text-[#5A6E3D] font-semibold mb-1">Intimate</div>
            <p className="text-xs leading-snug" style={{ fontFamily: '"Fraunces", serif' }}>You talk to the people doing the work. No account managers, no offshore handoffs, no game of telephone.</p>
          </div>
          <div className="bg-[#FAF8F4] p-3">
            <div className="text-[10px] uppercase tracking-[0.2em] text-[#5A6E3D] font-semibold mb-1">Lean</div>
            <p className="text-xs leading-snug" style={{ fontFamily: '"Fraunces", serif' }}>No bloat. No process for process's sake. Lower price reflects lower overhead, not lower quality.</p>
          </div>
          <div className="bg-[#FAF8F4] p-3">
            <div className="text-[10px] uppercase tracking-[0.2em] text-[#5A6E3D] font-semibold mb-1">Both Sides</div>
            <p className="text-xs leading-snug" style={{ fontFamily: '"Fraunces", serif' }}>Hands-on dev/ops AND business. We understand both your stack and your P&L. Rare combination.</p>
          </div>
        </div>
        <div className="border-t border-[#1A1815] pt-3">
          <p className="text-xl text-center" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600, letterSpacing: '-0.01em' }}>
            <span className="text-[#B85838]">Pay us to get done now.</span>
          </p>
        </div>
      </div>

      {/* v29: Pricing Philosophy — Dual Track */}
      <div className="bg-white border-2 border-[#5A6E3D] p-5 sm:p-6 mb-5">
        <div className="text-[10px] uppercase tracking-[0.3em] text-[#5A6E3D] font-semibold mb-2">Pricing Philosophy · Two Tracks</div>
        <h3 className="text-xl sm:text-2xl mb-3" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600, letterSpacing: '-0.02em' }}>
          Fair pricing both ways. Not slave wages. Not extortion.
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div className="bg-[#FAF8F4] border border-[#5A6E3D] p-4">
            <div className="text-[10px] uppercase tracking-[0.2em] text-[#5A6E3D] font-semibold mb-1">Family · Small Business · Founders</div>
            <p className="text-sm mb-2" style={{ fontFamily: '"Fraunces", serif' }}>
              Accessible by design. Foundation tier free forever. Loved Ones free PoeTech+ for life (first 100 partner-church families). Subscriptions $39–$249/mo. Community tier free for families in need (sponsor-funded).
            </p>
            <p className="text-xs text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>
              No one is priced out of stewardship.
            </p>
          </div>
          <div className="bg-[#FAF8F4] border border-[#1A1815] p-4">
            <div className="text-[10px] uppercase tracking-[0.2em] text-[#1A1815] font-semibold mb-1">Enterprise · Big Business with Budget</div>
            <p className="text-sm mb-2" style={{ fontFamily: '"Fraunces", serif' }}>
              Premium pricing for compressed delivery. $50K–$5M projects. $25K–$75K/mo retainers. $400–$800/hr senior rates. Pay us $3M for ~2 months of senior, focused work and walk with $5M of delivered value — vs <strong>$5M per year × 5 years = $25M</strong> from a BigCo for less.
            </p>
            <p className="text-xs text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>
              We save you from a relationship with money pits.
            </p>
          </div>
        </div>
        <p className="text-sm leading-relaxed" style={{ fontFamily: '"Fraunces", serif' }}>
          <strong>The principle:</strong> low prices for those who genuinely need accessible tools. High-ticket pricing for those who have good money and would otherwise pay 10x more for less work over 5x more time. <strong>Our prices are fit for both of us to do well.</strong> Not extractive. Not exploitative. Aligned.
        </p>
      </div>

      <div className="space-y-3">
        {models.map((m, i) => (
          <div key={i} className={`bg-white border-2 ${m.color} p-5`}>
            <div className="flex items-baseline justify-between gap-3 mb-1 flex-wrap">
              <h3 className="text-lg" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{m.name}</h3>
              <span className="text-[11px] uppercase tracking-[0.15em] text-[#5A5751] font-medium">{m.pricing}</span>
            </div>
            <p className="text-sm italic text-[#5A5751] mb-3" style={{ fontFamily: '"Fraunces", serif' }}>"{m.tagline}"</p>
            <p className="text-sm mb-3" style={{ fontFamily: '"Fraunces", serif' }}>{m.best}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-[#B85838] mb-1 font-medium">Includes</div>
                <ul className="text-xs text-[#5A5751] space-y-1">
                  {m.includes.map((f, j) => <li key={j} className="flex gap-2"><span className="text-[#B85838]">·</span><span>{f}</span></li>)}
                </ul>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-[#B85838] mb-1 font-medium">For Who</div>
                <p className="text-xs text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>{m.forWho}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Annual revenue scenarios */}
      <div className="bg-white border border-[#1A1815] p-5 mt-4">
        <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] font-medium mb-2">Year-Ahead Visibility · PoeTech Services Revenue</div>
        <p className="text-sm leading-relaxed mb-3" style={{ fontFamily: '"Fraunces", serif' }}>
          What this looks like over 12 months as a portfolio mix:
        </p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-1.5 border-b border-[#E8E4DC]">
            <span style={{ fontFamily: '"Fraunces", serif' }}>2 Retainer clients × $3K/mo × 12mo</span>
            <span style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 600 }} className="text-[#5A6E3D]">$72K</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-[#E8E4DC]">
            <span style={{ fontFamily: '"Fraunces", serif' }}>4 Project engagements × $15K average</span>
            <span style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 600 }} className="text-[#5A6E3D]">$60K</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-[#E8E4DC]">
            <span style={{ fontFamily: '"Fraunces", serif' }}>1 Revenue share engagement · profit split</span>
            <span style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 600 }} className="text-[#5A6E3D]">$0–$50K+ (varies)</span>
          </div>
          <div className="flex justify-between py-2 font-medium">
            <span style={{ fontFamily: '"Fraunces", serif' }}>Year 1 total potential</span>
            <span className="text-lg text-[#5A6E3D]" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>$132K–$180K+</span>
          </div>
        </div>
        <p className="text-xs text-[#5A5751] italic mt-3" style={{ fontFamily: '"Fraunces", serif' }}>
          This is the bridge from where the Poes are today to where PoeTech-the-product reaches scale. Services revenue covers operations and funds the build for the family OS without diluting ownership. Patient capital, compounded.
        </p>
      </div>

      {/* Collaboration call-out */}
      <div className="bg-white border-2 border-dashed border-[#B85838] p-5 mt-4">
        <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] font-medium mb-2">⚡ Active Conversations</div>
        <p className="text-sm leading-relaxed" style={{ fontFamily: '"Fraunces", serif' }}>
          Two warm prospects are already interested — each with business background and some tech experience, both looking for the personal touch PoeTech offers. Treat them as Project or Retainer engagements first; convert to Revenue Share when fit becomes obvious. See "Active This Year" below for the entries.
        </p>
      </div>
    </section>
  );
}

function PoeTechProjections() {
  const [foundationPct, setFoundationPct] = useState(55);
  const [plusPct, setPlusPct] = useState(22);
  const [familyPct, setFamilyPct] = useState(13);
  const [premiumPct, setPremiumPct] = useState(6);
  const [businessPct, setBusinessPct] = useState(2);

  const tierPrices = { foundation: 0, plus: 39, family: 89, premium: 149, business: 249 };
  const arpuMonthly = (foundationPct * 0 + plusPct * tierPrices.plus + familyPct * tierPrices.family + premiumPct * tierPrices.premium + businessPct * tierPrices.business) / 100;
  const arpuAnnual = arpuMonthly * 12;
  const payingPct = plusPct + familyPct + premiumPct + businessPct;
  const totalPct = foundationPct + plusPct + familyPct + premiumPct + businessPct;

  const milestones = [
    { customers: 100,       year: 1,  context: 'Warm market · Loved Ones tier · Church + family network', poeFamily: 'Still paying down personal debt' },
    { customers: 1000,      year: 2,  context: 'Word of mouth from first 100 · early product-led growth', poeFamily: 'Consumer debt-free path clearly working' },
    { customers: 10000,     year: 4,  context: 'Crossed into mainstream awareness · Marketing module live', poeFamily: '~7 of 11 rentals paid off · Real income from PoeTech' },
    { customers: 100000,    year: 7,  context: 'Calendly was here at year 7 · PoeTech hardware DTC viable', poeFamily: 'All rentals owned free · Compounding from PoeTech equity' },
    { customers: 1000000,   year: 10, context: 'Major SaaS scale · Mission-level impact across families', poeFamily: 'Generational wealth · Full Sabbath rest possible' },
  ];

  return (
    <section>
      <SectionTitle eyebrow="PoeTech Business">Projections · The Invisible View</SectionTitle>
      <p className="text-sm text-[#5A5751] leading-relaxed max-w-prose mb-4" style={{ fontFamily: '"Fraunces", serif' }}>
        What's currently invisible: the revenue PoeTech generates as it reaches more families. Below: customer milestone projections with realistic time horizons, and what they unlock for the Poe family and every family using the platform. <strong>This is for all families who own their own data — multiple paths to succeed, multiple ways to be fruitful.</strong>
      </p>

      <div className="bg-white border border-[#1A1815] p-5 mb-4">
        <div className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751] mb-3">Customer Tier Mix · Current Pricing</div>
        <div className="space-y-2.5">
          <TierSlider label="Foundation (free)" value={foundationPct} setValue={setFoundationPct} price={0} />
          <TierSlider label="PoeTech+ ($39/mo)" value={plusPct} setValue={setPlusPct} price={39} />
          <TierSlider label="Family ($89/mo)" value={familyPct} setValue={setFamilyPct} price={89} />
          <TierSlider label="Premium ($149/mo)" value={premiumPct} setValue={setPremiumPct} price={149} />
          <TierSlider label="Business ($249/mo)" value={businessPct} setValue={setBusinessPct} price={249} />
        </div>
        <div className="mt-4 pt-4 border-t border-[#E8E4DC] grid grid-cols-3 gap-px bg-[#E8E4DC] border border-[#E8E4DC]">
          <MetricCell label="Blended ARPU" value={`$${arpuMonthly.toFixed(2)}`} sub="per customer/mo" small />
          <MetricCell label="Annual ARPU" value={`$${arpuAnnual.toFixed(0)}`} sub="per customer/yr" small />
          <MetricCell label="Paying %" value={`${payingPct}%`} sub={totalPct < 100 ? `${100-totalPct}% free` : 'of customers'} small accent="green" />
        </div>
        <p className="text-[10px] text-[#5A5751] italic mt-2" style={{ fontFamily: '"Fraunces", serif' }}>
          Industry-typical freemium SaaS: 5-15% paying conversion. Calendly's free→paid is ~3%. The remaining {totalPct < 100 ? (100-totalPct) : 0}% is Loved Ones + Community tiers (free, sponsored).
        </p>
      </div>

      <div className="bg-white border border-[#1A1815]">
        <div className="grid grid-cols-12 gap-2 p-3 border-b-2 border-[#1A1815] text-[10px] uppercase tracking-wider text-[#5A5751] bg-[#FAF8F4]">
          <div className="col-span-3">Milestone</div>
          <div className="col-span-2 text-right">MRR</div>
          <div className="col-span-2 text-right">ARR</div>
          <div className="col-span-1 text-right">Year</div>
          <div className="col-span-4">Context</div>
        </div>
        {milestones.map((m, i) => {
          const mrr = m.customers * arpuMonthly;
          const arr = mrr * 12;
          return (
            <div key={m.customers} className={`p-3 ${i < milestones.length - 1 ? 'border-b border-[#E8E4DC]' : ''}`}>
              <div className="grid grid-cols-12 gap-2 items-baseline">
                <div className="col-span-3">
                  <div className="text-base sm:text-lg" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{m.customers.toLocaleString()}</div>
                  <div className="text-[10px] uppercase tracking-wider text-[#5A5751]">families</div>
                </div>
                <div className="col-span-2 text-right">
                  <div style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 500 }}>{fmtCompact(mrr)}</div>
                  <div className="text-[10px] uppercase tracking-wider text-[#5A5751]">/mo</div>
                </div>
                <div className="col-span-2 text-right">
                  <div className="text-[#5A6E3D]" style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 500 }}>{fmtCompact(arr)}</div>
                  <div className="text-[10px] uppercase tracking-wider text-[#5A5751]">/yr</div>
                </div>
                <div className="col-span-1 text-right">
                  <div style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>Y{m.year}</div>
                </div>
                <div className="col-span-4">
                  <div className="text-xs text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>{m.context}</div>
                  <div className="text-[10px] text-[#B85838] mt-0.5 italic">Poe family: {m.poeFamily}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white border border-[#1A1815] p-5 mt-4">
        <div className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751] mb-2">Comparable Trajectories</div>
        <div className="space-y-2 text-sm" style={{ fontFamily: '"Fraunces", serif' }}>
          <div className="flex justify-between gap-3">
            <span><strong>Calendly</strong> · Tope Awotona</span>
            <span className="text-[#5A5751] text-xs">$200K → $3B valuation in 8 years · bootstrapped</span>
          </div>
          <div className="flex justify-between gap-3">
            <span><strong>SimplePractice</strong> · Founded 2012</span>
            <span className="text-[#5A5751] text-xs">2 people → $1.5B exit in 9 years · clinical SaaS</span>
          </div>
          <div className="flex justify-between gap-3">
            <span><strong>Notion</strong> · Founded 2013</span>
            <span className="text-[#5A5751] text-xs">PLG → $10B valuation in 8 years · family-adjacent</span>
          </div>
        </div>
        <p className="text-xs text-[#5A5751] italic mt-3" style={{ fontFamily: '"Fraunces", serif' }}>
          Compounding patience is the pattern. None of these were overnight successes. The bootstrapped path — Awotona's playbook — retains ownership and respects the Yahweh-approves filter.
        </p>
      </div>

      <div className="bg-white border border-[#1A1815] p-5 mt-4">
        <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] mb-2 font-medium">Multiple Paths to Be Fruitful</div>
        <h3 className="text-lg mb-2" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>What every family on PoeTech can do</h3>
        <p className="text-sm leading-relaxed mb-3" style={{ fontFamily: '"Fraunces", serif' }}>
          Each PoeTech subscriber owns their data and gets the tools that compound their stewardship. The same patterns work for any family — not just ours.
        </p>
        <ul className="text-sm space-y-1.5 text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>
          <li className="flex gap-2"><span className="text-[#B85838]">·</span><span><strong>Debt freedom</strong> via avalanche + pressure slider — typical family saves $5K-$50K in interest</span></li>
          <li className="flex gap-2"><span className="text-[#B85838]">·</span><span><strong>Rental snowball</strong> for landlords — 7-year payoff target with cascading freed cash flow</span></li>
          <li className="flex gap-2"><span className="text-[#B85838]">·</span><span><strong>Practice Operations</strong> for small business owners — inquiry capture, source attribution, conversion tracking</span></li>
          <li className="flex gap-2"><span className="text-[#B85838]">·</span><span><strong>Scope of Work mediation</strong> — fair contractor agreements protect both sides</span></li>
          <li className="flex gap-2"><span className="text-[#B85838]">·</span><span><strong>Marketplace participation</strong> (future) — earn from vendor positions or refer business</span></li>
          <li className="flex gap-2"><span className="text-[#B85838]">·</span><span><strong>Hardware DTC</strong> (future) — IoT sensors with PoeTech-controlled data pipeline</span></li>
          <li className="flex gap-2"><span className="text-[#B85838]">·</span><span><strong>Education tracking</strong> for kids — apprenticeship curricula, goal-setting, progress</span></li>
          <li className="flex gap-2"><span className="text-[#B85838]">·</span><span><strong>Generational wealth path</strong> — own your data, own your assets, own your future</span></li>
        </ul>
      </div>
    </section>
  );
}

function TierSlider({ label, value, setValue, price }) {
  return (
    <div>
      <div className="flex justify-between items-baseline text-xs mb-1">
        <span style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{label}</span>
        <span className="text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{value}%</span>
      </div>
      <input type="range" min="0" max="100" step="1" value={value} onChange={e => setValue(parseInt(e.target.value))} className="w-full accent-[#B85838]" />
    </div>
  );
}

export { Opportunities };
export default Opportunities;
