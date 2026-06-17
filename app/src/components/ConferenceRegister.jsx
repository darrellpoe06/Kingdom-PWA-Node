// =============================================================================
// ConferenceRegister — the standalone, shareable, no-login registration page
// =============================================================================
// Booted by ?register=1 (main.jsx), exactly like the ?join help page. A leader
// texts the link to the congregation; anyone opens it on their phone and registers
// in seconds — no account, no install required. Self-contained + lightweight (it
// does NOT pull the full PWA). Branded with the COLG Assembly identity.
import React from 'react';
import { CONFERENCE_IDENTITY } from '../lib/conference-identity.js';
import ConferenceRegisterForm from './ConferenceRegisterForm.jsx';

export default function ConferenceRegister() {
  const conf = CONFERENCE_IDENTITY;
  return (
    <div className="min-h-screen bg-[#FAF8F4] p-4 sm:p-8">
      <div className="max-w-md mx-auto">
        {/* Header + form share ONE white card so the terracotta eyebrow meets
            WCAG AA (4.56:1 on white; it falls to 4.41 on the cream page bg). */}
        <div className="bg-white border border-[#1A1815] p-5 sm:p-6">
          <div className="text-[10px] uppercase tracking-[0.3em] text-[#B85838] font-semibold">⛪ Register · {conf.host}</div>
          <h1 className="text-2xl sm:text-3xl mt-1 text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{conf.name}</h1>
          {conf.theme && <p className="text-sm text-[#5A6E3D] font-semibold mt-1" style={{ fontFamily: '"Fraunces", serif' }}>“{conf.theme}”</p>}
          <p className="text-xs text-[#5A5751] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>
            {conf.location}{conf.dates ? ` · ${conf.dates}` : ''}
          </p>
          <p className="text-sm text-[#1A1815] mt-4 mb-4" style={{ fontFamily: '"Fraunces", serif' }}>
            Let us know you’re coming so we can plan seating and meals. It only takes a moment — no account needed.
          </p>
          <ConferenceRegisterForm conferenceName={conf.name} source="public-link" />
        </div>
        <p className="text-[11px] text-[#5A5751] mt-4" style={{ fontFamily: '"Fraunces", serif' }}>
          Questions? Reach a church leader. Powered by PoeTech for {conf.host}.
        </p>
      </div>
    </div>
  );
}
