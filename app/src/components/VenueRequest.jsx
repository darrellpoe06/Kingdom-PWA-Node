// =============================================================================
// VenueRequest — the standalone, shareable, no-login "request a space" page
// =============================================================================
// Booted by ?request-space=1 (main.jsx), exactly like the ?register and ?join
// pages. A leader texts the link to anyone in the community who wants to use the
// church's campuses — funeral, wedding, gathering — and they request it on their
// phone in a minute, no account, no install. Self-contained + lightweight (it does
// NOT pull the full PWA). Branded with the church identity.
import React from 'react';
import VenueRequestForm from './VenueRequestForm.jsx';
import { CAMPUSES } from '../lib/venue-rental.js';

export default function VenueRequest() {
  return (
    <div className="min-h-screen bg-[#FAF8F4] p-4 sm:p-8">
      <div className="max-w-md mx-auto">
        {/* Header + form share ONE white card so the terracotta eyebrow meets
            WCAG AA (4.56:1 on white; it falls to 4.41 on the cream page bg). */}
        <div className="bg-white border border-[#1A1815] p-5 sm:p-6">
          <div className="text-[10px] uppercase tracking-[0.3em] text-[#B85838] font-semibold">⛪ Request a Space</div>
          <h1 className="text-2xl sm:text-3xl mt-1 text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>Use our campuses</h1>
          <p className="text-sm text-[#5A5751] mt-2" style={{ fontFamily: '"Fraunces", serif' }}>
            The Church of the Living God opens its two campuses to the community for funerals, weddings, and gatherings:
          </p>
          <ul className="text-sm text-[#1A1815] mt-2 mb-4 space-y-1" style={{ fontFamily: '"Fraunces", serif' }}>
            {CAMPUSES.map((c) => (
              <li key={c.id}><span className="font-semibold">{c.name}</span> <span className="text-[#5A5751]">— {c.blurb}</span></li>
            ))}
          </ul>
          <VenueRequestForm source="public-link" />
        </div>
        <p className="text-[11px] text-[#5A5751] mt-4" style={{ fontFamily: '"Fraunces", serif' }}>
          Questions? Reach a church leader or the office. Powered by PoeTech for The Church of the Living God.
        </p>
      </div>
    </div>
  );
}
