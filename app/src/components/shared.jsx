// Shared presentational components — extracted from poe-financial-mvp-v28.jsx (r19)
// to end the chronic truncation problem caused by editing the 9,700-line monolith.
// These are small, stateless, rarely-changed components used across many tabs.
// See /docs/01-architecture/* for the long-term split plan.
import React, { useState } from 'react';

function MarketCard({ title, need, have }) {
  return (
    <div className="bg-white border border-[#1A1815] p-4">
      <h4 className="text-sm mb-1.5" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{title}</h4>
      <div className="text-[10px] uppercase tracking-[0.2em] text-[#B85838] font-medium mt-2">Need</div>
      <p className="text-xs leading-relaxed mb-2" style={{ fontFamily: '"Fraunces", serif' }}>{need}</p>
      <div className="text-[10px] uppercase tracking-[0.2em] text-[#5A6E3D] font-medium">What PoeTech has today</div>
      <p className="text-xs leading-relaxed" style={{ fontFamily: '"Fraunces", serif' }}>{have}</p>
    </div>
  );
}

function PricingTier({ name, tagline, monthly, annual, features, replaces, highlight, community, business, onChoose }) {
  const borderClass = highlight ? 'border-[#5A6E3D] border-2' : community ? 'border-[#B85838] border-2' : business ? 'border-[#1A1815] border-2' : 'border-[#1A1815]';
  const isFree = monthly === '0';
  const buttonLabel = isFree ? 'Claim it →' : 'Subscribe →';
  const buttonColor = highlight ? 'bg-[#5A6E3D] hover:bg-[#1A1815]' : community ? 'bg-[#B85838] hover:bg-[#1A1815]' : business ? 'bg-[#1A1815] hover:bg-[#B85838]' : 'bg-[#1A1815] hover:bg-[#B85838]';
  return (
    <div className={`bg-white border ${borderClass} p-5`}>
      <div className="flex items-baseline justify-between gap-3 mb-2 flex-wrap">
        <div>
          <h3 className="text-xl" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{name}</h3>
          <div className="text-xs text-[#5A5751] mt-0.5">{tagline}</div>
        </div>
        <div className="text-right shrink-0">
          {monthly === '0' ? (
            <div className="text-2xl text-[#5A6E3D]" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>Free</div>
          ) : (
            <>
              <div className="text-2xl" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>${monthly}<span className="text-sm text-[#5A5751]">/mo</span></div>
              <div className="text-xs text-[#5A5751]">or ${annual}/yr</div>
            </>
          )}
        </div>
      </div>
      {replaces && (
        <div className="mb-3 px-3 py-2 bg-[#FAF8F4] border-l-2 border-[#5A6E3D]">
          <div className="text-[10px] uppercase tracking-[0.2em] text-[#5A6E3D] font-medium mb-0.5">Replaces</div>
          <div className="text-xs" style={{ fontFamily: '"Fraunces", serif' }}>{replaces}</div>
        </div>
      )}
      <ul className="text-xs text-[#1A1815] space-y-1 mt-3">
        {features.map((f, i) => <li key={i} className="flex gap-2"><span className={highlight ? 'text-[#5A6E3D]' : business ? 'text-[#1A1815]' : 'text-[#B85838]'}>·</span><span>{f}</span></li>)}
      </ul>
      {onChoose && (
        <button onClick={() => onChoose({ name, tagline, monthly, annual, features, replaces })} className={`mt-4 w-full text-white text-xs uppercase tracking-wider py-2.5 font-semibold ${buttonColor}`}>{buttonLabel}</button>
      )}
    </div>
  );
}

function CommunityPriorities({ moduleInterest }) {
  const interests = Object.entries(moduleInterest || {}).map(([key, val]) => {
    const priority = typeof val === 'object' ? val?.priority : 'nice';
    const pts = priority === 'critical' ? 5 : priority === 'important' ? 3 : 1;
    return { key, priority, pts };
  });
  if (interests.length === 0) return null;
  const totalPts = interests.reduce((s, i) => s + i.pts, 0);
  const labels = {
    'home-command': 'Home Command Center',
    'health-wellness': 'Health & Wellness',
    'marketplace': 'PoeTech Marketplace',
    'practice-ops': 'Practice Operations',
    'marketing-growth': 'Marketing & Growth',
    'education': 'Education · Literacy Justice',
    'tutors': 'PoeTech Tutors · Educator Marketplace',
    'elder-care-coord': 'Elder Care Coordination',
    'elder-marketplace': 'Elder Care · 1099 Marketplace',
    'home-legacy': 'Home Legacy Program',
    'spiritual': 'Spiritual Life',
  };
  return (
    <div className="bg-white border border-[#B85838] p-4 mb-4">
      <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] font-medium mb-2">Your Priority Votes · {totalPts} total points</div>
      <div className="space-y-1.5">
        {interests.sort((a,b) => b.pts - a.pts).map(i => {
          const pct = (i.pts / 5) * 100;
          return (
            <div key={i.key}>
              <div className="flex justify-between text-xs mb-0.5">
                <span style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{labels[i.key] || i.key}</span>
                <span className="text-[#5A5751] uppercase tracking-wider text-[10px]">{i.priority} · {i.pts}pt</span>
              </div>
              <div className="h-1 bg-[#E8E4DC]"><div className="h-full bg-[#B85838]" style={{ width: `${pct}%` }}></div></div>
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-[#5A5751] italic mt-2" style={{ fontFamily: '"Fraunces", serif' }}>
        When this is multiplied across thousands of families, the highest-weighted modules get built first. Your vote is real input on the roadmap.
      </p>
    </div>
  );
}

function ModuleCard({ moduleKey, status, title, repo, desc, features, moduleInterest, toggleModuleInterest }) {
  const [showPriority, setShowPriority] = useState(false);
  const s = { active: { label: 'Active', border: 'border-[#1A1815]', tag: 'text-[#5A6E3D]' }, planned: { label: 'Planned', border: 'border-[#E8E4DC]', tag: 'text-[#B85838]' }, vision: { label: 'Vision', border: 'border-[#E8E4DC] border-dashed', tag: 'text-[#5A5751]' } }[status];
  const interest = moduleKey && moduleInterest ? moduleInterest[moduleKey] : null;
  // Support both old format (string) and new format (object)
  const isInterested = !!interest;
  const interestPriority = typeof interest === 'object' ? interest?.priority : (interest ? 'nice' : null);
  const interestDate = typeof interest === 'object' ? interest?.signedAt : interest;
  const canSignal = status !== 'active' && moduleKey && toggleModuleInterest;

  const priorities = [
    { key: 'nice',      label: 'Nice to have',    pts: '1pt', emoji: '✓' },
    { key: 'important', label: 'Important to me', pts: '3pts', emoji: '⭐' },
    { key: 'critical',  label: 'Critical · build first', pts: '5pts', emoji: '⭐⭐' },
  ];
  const priorityInfo = priorities.find(p => p.key === interestPriority);

  return (
    <div className={`bg-white border ${s.border} p-5`}>
      <div className="flex items-baseline justify-between mb-1 gap-3">
        <span className={`text-[10px] uppercase tracking-[0.2em] font-medium shrink-0 ${s.tag}`}>{s.label}</span>
      </div>
      {repo && <div className="text-[10px] uppercase tracking-wider text-[#5A5751] mb-2">{repo}</div>}
      <p className="text-sm leading-relaxed mb-3" style={{ fontFamily: '"Fraunces", serif' }}>{desc}</p>
      <ul className="text-xs text-[#5A5751] space-y-1 mb-3">
        {features.map((f, i) => (<li key={i} className="flex gap-2"><span className="text-[#B85838]">·</span><span>{f}</span></li>))}
      </ul>
      {canSignal && (
        <div className="mt-3 pt-3 border-t border-[#E8E4DC]">
          {isInterested ? (
            <div className="space-y-1.5">
              <button onClick={() => toggleModuleInterest(moduleKey, null)} className="w-full text-xs uppercase tracking-wider py-2 border border-[#5A6E3D] text-[#5A6E3D] hover:bg-[#FAF8F4]">
                {priorityInfo?.emoji || '✓'} On the list · {priorityInfo?.label || 'interested'} · since {interestDate ? new Date(interestDate).toLocaleDateString() : 'recently'}
              </button>
              <div className="flex gap-1 text-[10px] uppercase tracking-wider">
                {priorities.filter(p => p.key !== interestPriority).map(p => (
                  <button key={p.key} onClick={() => toggleModuleInterest(moduleKey, p.key)} className="px-1.5 py-1 text-[#5A5751] hover:text-[#B85838]">{p.emoji} {p.label}</button>
                ))}
              </div>
            </div>
          ) : showPriority ? (
            <div className="space-y-1.5">
              <div className="text-[10px] uppercase tracking-wider text-[#5A5751] mb-1">How important is this to your family?</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
                {priorities.map(p => (
                  <button key={p.key} onClick={() => { toggleModuleInterest(moduleKey, p.key); setShowPriority(false); }} className="text-xs px-2 py-2 border border-[#B85838] text-[#B85838] hover:bg-[#FAF8F4] hover:text-[#1A1815] text-left">
                    <div>{p.emoji} {p.label}</div>
                    <div className="text-[9px] uppercase tracking-wider text-[#5A5751]">{p.pts} priority weight</div>
                  </button>
                ))}
              </div>
              <button onClick={() => setShowPriority(false)} className="text-[10px] uppercase tracking-wider text-[#5A5751] hover:text-[#1A1815]">× Cancel</button>
            </div>
          ) : (
            <button onClick={() => setShowPriority(true)} className="w-full text-xs uppercase tracking-wider py-2 border border-[#B85838] text-[#B85838] hover:bg-[#FAF8F4] hover:text-[#1A1815]">
              🔔 Notify me · vote on priority
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function SectionTitle({ children, eyebrow }) {
  return (
    <div className="mb-5 pb-3 border-b-2 border-[#1A1815] section-title-wrapper">
      {eyebrow && <div className="text-[10px] uppercase tracking-[0.3em] text-[#B85838] mb-1.5 font-semibold">{eyebrow}</div>}
      <h2 className="text-2xl sm:text-3xl leading-tight section-title-text" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600, letterSpacing: '-0.02em' }}>{children}</h2>
    </div>
  );
}

function MetricCell({ label, value, sub, accent, small }) {
  const valueColor = accent === 'green' ? 'text-[#5A6E3D]' : accent === 'rust' ? 'text-[#B85838]' : 'text-[#1A1815]';
  return (<div className="bg-[#FAF8F4] p-2.5 sm:p-3"><div className="text-[9px] uppercase tracking-[0.15em] text-[#5A5751] mb-1 leading-tight">{label}</div><div className={`${small ? 'text-base sm:text-lg' : 'text-xl sm:text-2xl'} ${valueColor} leading-tight`} style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{value}</div>{sub && <div className="text-[9px] uppercase tracking-wider text-[#5A5751] mt-0.5 leading-tight">{sub}</div>}</div>);
}

// Named exports — main file imports these explicitly.
export { MarketCard, PricingTier, CommunityPriorities, ModuleCard, SectionTitle, MetricCell };
