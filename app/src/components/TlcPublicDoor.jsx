// =============================================================================
// TlcPublicDoor — the sendable, client-facing TLC Therapy Solutions app
// =============================================================================
// The focused app a prospective client meets when they open the TLC door
// (poetech.us/tlc → ?tlc=1). It boots straight into "Find your therapist": the
// clinical-team match + services + insurance + Book. It is deliberately a DEAD
// END toward everything operator/family — no nav, no PoeTech chrome, no
// dashboards, no books, no Intake/Assistant. The only outbound actions are the
// two real client actions: Book (Acuity) and Learn more (the live website).
//
// PRIVACY (the TLC bright line): renders ONLY tlc-practice.js — public marketing
// facts already on tlctherapysolutions.me. No props carry family/operator data;
// there is nothing here to leak. (Proven by tlc-door.test.js: the module imports
// no store, no auth, no family surface.)
// =============================================================================
import React from 'react';
import { TLC_TEAM, TLC_INSURANCE, TLC_BRAND, TLC_SERVICES } from '../lib/tlc-practice.js';
import { TLC_DOOR_BRAND } from '../lib/tlc-door.js';

export default function TlcPublicDoor() {
  return (
    <div className="min-h-screen bg-[#FAF8F4] text-[#1A1815]">
      {/* Header — the TLC brand a client meets. No PoeTech chrome. */}
      <header className="bg-white border-b-2 border-[#1A1815]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#B85838] font-semibold mb-1">{TLC_DOOR_BRAND.name}</div>
          <h1 className="text-3xl sm:text-4xl mb-2" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600, letterSpacing: '-0.02em' }}>{TLC_DOOR_BRAND.tagline}</h1>
          <p className="text-sm sm:text-base text-[#5A5751] max-w-prose" style={{ fontFamily: '"Fraunces", serif' }}>{TLC_DOOR_BRAND.blurb}</p>
          <div className="mt-4 flex flex-wrap gap-2.5">
            <a
              href={TLC_BRAND.bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2.5 bg-[#B85838] text-white text-sm font-semibold uppercase tracking-wider hover:bg-[#1A1815] transition-colors focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]"
            >
              Book an appointment
            </a>
            <a
              href={TLC_BRAND.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2.5 border border-[#1A1815] text-sm font-semibold uppercase tracking-wider hover:border-[#B85838] hover:text-[#B85838] transition-colors focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]"
            >
              Learn more
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        {/* Match a Preferred Provider — FIRST (Darrell: "the first thing we see"). */}
        <section>
          <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#B85838] font-semibold mb-1">Clinical Team</div>
          <h2 className="text-2xl mb-4" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600, letterSpacing: '-0.02em' }}>Match a Preferred Provider</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {TLC_TEAM.map((t) => (
              <a
                key={t.name}
                href={t.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white border border-[#E8E4DC] p-3 flex items-start gap-3 hover:border-[#B85838] transition-colors focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]"
              >
                <img
                  src={t.photo}
                  alt={t.name}
                  loading="lazy"
                  width="72"
                  height="72"
                  className="w-[72px] h-[72px] object-cover bg-[#E8E4DC] flex-shrink-0"
                />
                <div className="min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="text-sm" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{t.name}</h3>
                    <span className="text-[0.625rem] uppercase tracking-wider text-[#B85838] whitespace-nowrap">View →</span>
                  </div>
                  <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] mb-1">{t.role}</div>
                  <p className="text-xs leading-snug text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>{t.specialty}</p>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* Services — each books directly into Acuity. */}
        <section>
          <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#B85838] font-semibold mb-1">Therapy Services</div>
          <h2 className="text-2xl mb-4" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600, letterSpacing: '-0.02em' }}>All Options · Direct Online Intake</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {TLC_SERVICES.map((s) => (
              <div key={s.name} className="bg-white border border-[#E8E4DC] p-3 hover:border-[#B85838] transition-colors">
                <div className="flex items-baseline justify-between gap-2 mb-1">
                  <h3 className="text-sm" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{s.name}</h3>
                  <a href={TLC_BRAND.bookingUrl} target="_blank" rel="noopener noreferrer" className="text-[0.625rem] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815] whitespace-nowrap">Book →</a>
                </div>
                <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] mb-1">{s.desc}</div>
                <p className="text-xs leading-snug text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>{s.for}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Insurance accepted. */}
        <section className="bg-white border border-[#E8E4DC] p-4">
          <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#B85838] font-semibold mb-1.5">Insurance Accepted</div>
          <p className="text-sm text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>{TLC_INSURANCE}</p>
        </section>
      </main>

      <footer className="border-t border-[#E8E4DC] mt-4">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 text-center">
          <a href={TLC_BRAND.website} target="_blank" rel="noopener noreferrer" className="text-xs uppercase tracking-wider text-[#5A5751] hover:text-[#B85838] transition-colors">
            {TLC_BRAND.name} · tlctherapysolutions.me
          </a>
        </div>
      </footer>
    </div>
  );
}
