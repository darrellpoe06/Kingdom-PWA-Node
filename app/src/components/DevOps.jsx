// DevOps · Opportunities engine — extracted from monolith (r35) per
// MODULAR-EXTENSIBILITY.md. Helpers/constants passed as props to keep
// monolith-side data ownership (OPPORTUNITY_LIBRARY lives there).
import React, { useState } from 'react';
import { SectionTitle } from './shared.jsx';

const fmt = (n) => n == null || !isFinite(n) ? '—' : `${n < 0 ? '-' : ''}$${Math.abs(Math.round(n)).toLocaleString()}`;

function Opportunities({ opportunities, totals, skillProfiles = [], addSkillProfile, updateSkillProfile, deleteSkillProfile, userTier, addProject, addScope, addCapexItem, setView, projects = [], OPPORTUNITY_LIBRARY = [], matchOpportunities, capacityDecisionForNewProject, TIER_LABEL = {} }) {
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

export { Opportunities };
export default Opportunities;
