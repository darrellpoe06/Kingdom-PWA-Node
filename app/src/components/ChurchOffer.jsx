// =============================================================================
// ChurchOffer — the church card on the paid ladder, and the options above any
// tier (DR-1144, numbers from DR-1128)
// =============================================================================
// Darrell, 2026-10-20, looking at the Paid tiers page: "I need the prices for
// church and other options like surveillance..." The card reads the one
// church price from the cost-to-serve model; the options strip says each
// option's price, what it rests on, and whether it can be had today.
// =============================================================================
import React from 'react';
import { PricingTier } from './shared.jsx';
import { CHURCH_TIER, CHURCH_OPTIONS, optionPriceLabel, churchMonthlyDollars } from '../lib/church-offer.js';

export function ChurchCard({ onChoose }) {
  return (
    <div data-testid="church-card">
      <PricingTier
        name={CHURCH_TIER.name}
        tagline={CHURCH_TIER.tagline}
        bestFor={CHURCH_TIER.bestFor}
        monthly={churchMonthlyDollars()}
        pricePrefix={CHURCH_TIER.pricePrefix}
        replaces={CHURCH_TIER.replaces}
        availableNow={[...CHURCH_TIER.includes]}
        business
        onChoose={onChoose}
      />
      <ul className="mt-2 text-[0.7rem] leading-snug text-[#5A5751] space-y-1" data-testid="church-terms">
        {CHURCH_TIER.terms.map((t) => <li key={t} className="flex gap-2"><span className="shrink-0">·</span><span>{t}</span></li>)}
      </ul>
    </div>
  );
}

export function ChurchOptions() {
  return (
    <section className="mt-6" data-testid="tier-options" aria-labelledby="tier-options-heading">
      <div id="tier-options-heading" className="text-[0.625rem] uppercase tracking-[0.3em] text-[#5A5751] font-semibold mb-2">Options · above any tier, each a fixed written amount</div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {CHURCH_OPTIONS.map((o) => (
          <div key={o.key} className="bg-white border border-[#1A1815] p-4" data-testid={`tier-option-${o.key}`}>
            <div className="flex items-baseline justify-between gap-2 flex-wrap">
              <h4 className="text-base" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{o.name}</h4>
              <div className="text-sm font-semibold" style={{ fontFamily: '"Fraunces", serif' }}>{optionPriceLabel(o)}</div>
            </div>
            <div className="text-[0.625rem] uppercase tracking-[0.15em] text-[#5A5751] mt-0.5">
              for {o.forWhom.join(' · ')}{o.available ? ' · available now' : ' · ships next'}
            </div>
            <p className="text-xs text-[#1A1815] mt-2">{o.what}</p>
            {!o.available && o.availableWhen && (
              <p className="text-xs text-[#B85838] mt-1">Not sold yet: {o.availableWhen}.</p>
            )}
            <p className="text-[0.7rem] text-[#5A5751] mt-2"><span className="uppercase tracking-[0.15em] text-[0.625rem] font-semibold">Rests on </span>{o.basis}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default ChurchCard;
