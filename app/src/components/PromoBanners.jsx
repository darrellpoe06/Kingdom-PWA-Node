// =============================================================================
// PromoBanners — the Foundation-tier advisement & support banners, extracted
// from the monolith shell (hybrid-modular cutover, Stage 3: peel self-contained
// sections into modules). All three are self-contained, depending only on React
// hooks + their props — no shell closure, no module-level monolith state. Moved
// verbatim (DR-0076 characterize-before-change); render tests pin behavior.
//
//   • SalesFooterBanner — rotating PoeTech Services pitch. Hidden on the
//     overview dashboard (which has the family advisement banner). Exported for
//     the pending About/Opportunities re-wire (MVP-1-HARDENING-PLAN step 2.3).
//   • TherapyReminder   — always-visible TLC mental-health support footer, shown
//     to every tier (free + paid). Single message, single purpose.
//   • AdvisementBanner  — editorial rotation of family ministries & businesses
//     (COLG, TLC, Poe Properties …) shown to Foundation (free) tier only.
// =============================================================================
import React, { useState, useEffect } from 'react';
import { FAMILY_MINISTRIES, tlcClinicianLine, tlcInsurersLine, poePropertiesLine } from '../lib/family-ministries.js';

// =============================================================================
// Preparatory scaffolding — per MVP-1-HARDENING-PLAN.md step 2.3 this re-wires
// onto About + Opportunities (selectively, not every working tab). Exported so
// the pending re-wire can import it.
export function SalesFooterBanner({ currentView, setView }) {
  const [index, setIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  const pitches = [
    { headline: '6 weeks, not 6 months.', detail: 'Want this velocity for your project? Faster + better than the big team because we\'re intimate.', cta: 'See three ways to work together' },
    { headline: 'Pay us to get done now.', detail: 'Hourly · Retainer · Equity-shadow. Operators who ship, not consultants who slide-deck.', cta: 'View PoeTech Services →' },
    { headline: 'Dev/ops AND business.', detail: 'Rare combination. We understand your stack and your P&L. Same call, same person, same week.', cta: 'See what we can build →' },
    { headline: 'Built to run lean.', detail: 'Lower price reflects lower overhead, not lower quality. No partner-track hours, no junior handoffs.', cta: 'Get a quote →' },
    { headline: 'Intimate by design.', detail: 'You talk to the people doing the work. No account managers. No telephone game. The person you call codes.', cta: 'Start a conversation →' },
    { headline: 'Pre-seed founders welcome.', detail: 'Need a thinking partner more than a contractor? Equity-shadow engagements available — senior team energy at sustainable rates.', cta: 'Founder mode → ' },
  ];

  useEffect(() => {
    const interval = setInterval(() => setIndex(i => (i + 1) % pitches.length), 10000);
    return () => clearInterval(interval);
  }, [pitches.length]);

  // Hide on dashboard — that page has the family advisement banner already
  // CRITICAL: this conditional return MUST be AFTER all hooks (Rules of Hooks)
  if (currentView === 'overview' || dismissed) return null;

  const p = pitches[index];

  const handleClick = (e) => {
    e.preventDefault();
    if (setView) setView('opportunities');
  };

  return (
    <section className="mt-10 mb-2">
      <div className="bg-white border border-[#B85838] hover:border-[#1A1815] transition-colors">
        <div className="px-3 py-1 border-b border-[#E8E4DC] flex items-baseline justify-between gap-2">
          <div className="text-[9px] uppercase tracking-[0.25em] text-[#5A5751]">⌾ PoeTech Services · Built lean, priced fair</div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {pitches.map((_, i) => (
                <button key={i} onClick={() => setIndex(i)} aria-label={`Show pitch ${i + 1}`} className={`w-1 h-1 rounded-full transition-all ${i === index ? 'bg-[#B85838] w-2' : 'bg-[#E8E4DC]'}`}></button>
              ))}
            </div>
            <button type="button" onClick={() => setDismissed(true)} aria-label="Dismiss" className="text-[9px] uppercase tracking-wider text-[#5A5751] hover:text-[#1A1815]">×</button>
          </div>
        </div>
        <a href="#" onClick={handleClick} className="block px-3 py-3 hover:bg-[#FAF8F4] transition-colors">
          <div className="flex items-baseline justify-between gap-3 flex-wrap">
            <div className="flex-1 min-w-0">
              <h4 className="text-sm sm:text-base mb-0.5" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600, letterSpacing: '-0.01em' }}>{p.headline}</h4>
              <p className="text-xs text-[#5A5751] leading-snug" style={{ fontFamily: '"Fraunces", serif' }}>{p.detail}</p>
            </div>
            <div className="text-[10px] uppercase tracking-wider text-[#B85838] font-semibold shrink-0">{p.cta}</div>
          </div>
        </a>
      </div>
    </section>
  );
}


// Shows COLG + TLC + family businesses on Foundation (free) tier
// Paid tiers won't see this (per sponsorship ethics policy)
// =============================================================================
// TherapyReminder — always-visible mental-health support footer.
// Shown to every tier (free + paid) at the bottom of every page except Debts
// and Practice. The reasoning: family-stress is real, talking to someone
// matters, and this is too important to gate behind a subscription. Distinct
// from the editorial AdvisementBanner rotation — single message, single
// purpose: "help is here when you need it."
export function TherapyReminder() {
  return (
    <section className="bg-white border-l-4 border border-[#E8E4DC] mt-6 print:hidden" style={{ borderLeftColor: '#5A6E3D' }}>
      <a href="https://tlctherapysolutions-scheduleappointment.as.me/" target="_blank" rel="noopener noreferrer" className="block p-4 hover:bg-[#FAF8F4] transition-colors">
        <div className="flex items-baseline justify-between gap-3 flex-wrap mb-1">
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#5A6E3D] font-semibold">🌿 Need someone to talk to?</div>
          <div className="text-[10px] uppercase tracking-wider text-[#5A5751]">For every family · every tier</div>
        </div>
        <h3 className="text-base sm:text-lg mb-1" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600, letterSpacing: '-0.01em' }}>TLC Therapy Solutions · Real solutions for real life</h3>
        <p className="text-sm mb-1" style={{ fontFamily: '"Fraunces", serif' }}>
          Money stress. Family stress. Marriage stress. Grief. Parenting hard seasons. You don't have to carry it alone — and you don't have to wait until it's a crisis to reach out.
        </p>
        <p className="text-xs text-[#5A5751] mb-2" style={{ fontFamily: '"Fraunces", serif' }}>
          Faith-integrated therapy · {tlcClinicianLine()} · {tlcInsurersLine().replace('Accepts', 'accepts')} · {FAMILY_MINISTRIES.tlc.modes}.
        </p>
        <div className="text-[10px] uppercase tracking-wider font-semibold text-[#5A6E3D]">Book a session →</div>
      </a>
    </section>
  );
}

export function AdvisementBanner() {
  const [index, setIndex] = useState(0);
  const advisements = [
    {
      brand: FAMILY_MINISTRIES.colg.name,
      tagline: 'RESET! Reviving Faith · Restoring Hope · Rebuilding Communities',
      detail: `${FAMILY_MINISTRIES.colg.schedule} · ${FAMILY_MINISTRIES.colg.address}`,
      cta: 'Visit thechurchofthelivinggod.com',
      url: FAMILY_MINISTRIES.colg.siteUrl,
      tag: 'Faith Community',
      accent: '#B85838',
    },
    {
      brand: FAMILY_MINISTRIES.tlc.name,
      tagline: FAMILY_MINISTRIES.tlc.tagline,
      detail: `Online & in-person · ${tlcInsurersLine()} · ${tlcClinicianLine()}`,
      cta: 'Book a Session →',
      url: FAMILY_MINISTRIES.tlc.bookingUrl,
      tag: 'Mental Health',
      accent: '#5A6E3D',
    },
    {
      brand: 'COLG · YouTube Live',
      tagline: 'Worship from anywhere · The Love Corner experience',
      detail: 'Sunday service streams live · Subscribe to be notified',
      cta: 'Watch on YouTube →',
      url: FAMILY_MINISTRIES.colg.youtubeUrl,
      tag: 'Live Worship',
      accent: '#B85838',
    },
    {
      brand: FAMILY_MINISTRIES.poeProperties.name,
      tagline: FAMILY_MINISTRIES.poeProperties.tagline,
      detail: poePropertiesLine(),
      cta: 'Inquire about availability',
      url: FAMILY_MINISTRIES.poeProperties.contact,
      tag: 'Housing',
      accent: '#5A6E3D',
    },
    {
      brand: `COLG · ${FAMILY_MINISTRIES.assembly.name}`,
      tagline: 'Annual gathering · Faith, fellowship, growth',
      detail: 'Find dates and registration on the church site',
      cta: 'Learn more →',
      url: FAMILY_MINISTRIES.assembly.infoUrl,
      tag: 'Event',
      accent: '#B85838',
    },
    {
      brand: 'COLG · Bible Reading Challenge 2026',
      tagline: 'Read through with the church · Discussion guides included',
      detail: 'Wednesday Bible Study 1PM & 6PM · Join in-person or online',
      cta: 'See the reading plan →',
      url: 'https://www.thechurchofthelivinggod.com/bible-reading-challenge-2026.html',
      tag: 'Discipleship',
      accent: '#B85838',
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => setIndex(i => (i + 1) % advisements.length), 8000);
    return () => clearInterval(interval);
  }, [advisements.length]);

  const a = advisements[index];

  return (
    <section className="bg-white border border-[#E8E4DC]">
      <div className="px-3 py-1 border-b border-[#E8E4DC] flex items-baseline justify-between gap-2 flex-wrap">
        <div className="text-[9px] uppercase tracking-[0.25em] text-[#5A5751]">⌾ Advisement · Family Ministries & Solutions</div>
        <div className="flex items-center gap-1">
          {advisements.map((_, i) => (
            <button key={i} onClick={() => setIndex(i)} aria-label={`Show advisement ${i + 1}`} className={`w-1.5 h-1.5 rounded-full transition-all ${i === index ? 'bg-[#1A1815] w-3' : 'bg-[#E8E4DC]'}`}></button>
          ))}
        </div>
      </div>
      <a href={a.url} target="_blank" rel="noopener noreferrer" className="block p-4 hover:bg-[#FAF8F4] transition-colors">
        <div className="flex items-baseline justify-between gap-3 mb-1 flex-wrap">
          <div className="text-[10px] uppercase tracking-[0.25em] font-semibold" style={{ color: a.accent }}>{a.tag}</div>
          <div className="text-[10px] uppercase tracking-wider text-[#5A5751]">{index + 1} of {advisements.length}</div>
        </div>
        <h3 className="text-base sm:text-lg mb-1" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600, letterSpacing: '-0.01em' }}>{a.brand}</h3>
        <p className="text-sm mb-1" style={{ fontFamily: '"Fraunces", serif', fontStyle: 'italic' }}>{a.tagline}</p>
        <p className="text-xs text-[#5A5751] mb-2" style={{ fontFamily: '"Fraunces", serif' }}>{a.detail}</p>
        <div className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: a.accent }}>{a.cta} →</div>
      </a>
      <div className="px-3 py-1.5 border-t border-[#E8E4DC] text-[9px] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>
        Foundation tier · Family ministries & businesses are highlighted to all free users. Paid tiers don't see this.
      </div>
    </section>
  );
}
