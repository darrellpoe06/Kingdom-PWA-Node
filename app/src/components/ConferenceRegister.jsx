// =============================================================================
// ConferenceRegister — PoeTech's OUTWARD FACE to the community (the ?register=1 page)
// =============================================================================
// This is not a utility form — it is marketing + support + services, "from PoeTech
// to the community." A leader texts this link to the congregation; for many it is
// the FIRST thing they ever see of PoeTech. So it carries the brand and leads with
// VALUE the community feels (the Assembly invitation + what registering does for
// them), with the easy open registration RIGHT THERE — instant, no account, no gate.
//
// Progressive disclosure (Mars Hill pattern): the value/service is the front door;
// the deeper "what is this app / who is PoeTech" identity is ONE CLICK IN (the
// About panel), never a barrier. The OPTIONAL account on-ramp (after a successful
// register) carries an attendee onward into the rest of the platform: attendee ->
// served member.
//
// SUPPORT: built for non-technical / elderly congregants — WCAG 2.1 AA (#1A1815
// body, #5A5751 secondary, #B85838 accent, all >=4.5:1 on white), >=44px targets,
// and a SectionBoundary so a form hiccup degrades to a small recoverable card while
// the branded page around it stays up. The app-wide ErrorBoundary wraps this too.
import React, { useState } from 'react';
import { CONFERENCE_IDENTITY } from '../lib/conference-identity.js';
import ConferenceRegisterForm from './ConferenceRegisterForm.jsx';
import SectionBoundary from './SectionBoundary.jsx';
import TextSizeControl from './TextSizeControl.jsx';

// One value point in the "what registering does for you" strip. Icon is decorative.
function ValuePoint({ icon, title, children }) {
  return (
    <li className="flex items-start gap-2.5">
      <span aria-hidden="true" className="text-base leading-6">{icon}</span>
      <span className="text-[0.8125rem] text-[#1A1815] leading-6" style={{ fontFamily: '"Fraunces", serif' }}>
        <span className="font-semibold">{title}</span> {children}
      </span>
    </li>
  );
}

export default function ConferenceRegister() {
  const conf = CONFERENCE_IDENTITY;
  const [aboutOpen, setAboutOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#FAF8F4] p-4 sm:p-8">
      <div className="max-w-md mx-auto">
        {/* Large-print FIRST, before anything to read (WCAG 1.4.4). This is the
            page seniors open from a texted link — give them the "make it bigger"
            control up top. The boot already applied any saved choice; this lets
            them set it here, no account needed, and it sticks on their device. */}
        <TextSizeControl variant="panel" className="mb-4" />
        {/* Header + form share ONE white card so the terracotta eyebrow meets
            WCAG AA (4.56:1 on white; it falls to 4.41 on the cream page bg). */}
        <div className="bg-white border border-[#1A1815] p-5 sm:p-6">
          {/* VALUE-FORWARD HERO — lead with the invitation the community feels, not
              the word "Register." The host is named (it IS their church's Assembly),
              but the deeper platform identity lives one click in (About, below). */}
          <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#B85838] font-semibold">✦ You’re invited</div>
          <p className="text-[0.6875rem] text-[#5A5751] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>{conf.host}</p>
          <h1 className="text-2xl sm:text-3xl mt-1 text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{conf.name}</h1>
          {conf.theme && <p className="text-sm text-[#5A6E3D] font-semibold mt-1" style={{ fontFamily: '"Fraunces", serif' }}>“{conf.theme}”</p>}
          <p className="text-xs text-[#5A5751] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>
            {conf.location}{conf.dates ? ` · ${conf.dates}` : ''}
          </p>
          <p className="text-sm text-[#1A1815] mt-4 mb-4 leading-relaxed" style={{ fontFamily: '"Fraunces", serif' }}>
            Come for worship, teaching, and fellowship with the whole assembly. Reserve your place below — it takes a moment, no account needed, and we’ll save your seat and plan meals around you.
          </p>

          {/* THE EASY FRONT DOOR — instant, no gate. Wrapped so a hiccup degrades to
              a recoverable card without taking down the brand/value around it. */}
          <SectionBoundary name="Registration">
            <ConferenceRegisterForm conferenceName={conf.name} source="public-link" />
          </SectionBoundary>
        </div>

        {/* VALUE STRIP — the first service delivered, made tangible. Reassures a
            non-technical registrant that signing up actually does something for them. */}
        <div className="bg-white border border-[#E8E4DC] border-t-0 p-5 sm:p-6">
          <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#5A5751] font-semibold mb-2">When you register</div>
          <ul className="space-y-2">
            <ValuePoint icon="🪑" title="Your seat is saved.">We plan seating for everyone who lets us know they’re coming.</ValuePoint>
            <ValuePoint icon="🍽️" title="Meals around you.">Tell us your meal preference or allergy once — catering plans for it.</ValuePoint>
            <ValuePoint icon="🔔" title="Stay in the loop.">Leave a way to reach you and we’ll send Assembly updates — never spam, never sold.</ValuePoint>
          </ul>
        </div>

        {/* PROGRESSIVE DISCLOSURE — the deeper identity is ONE CLICK IN, not the
            front door. What this app is, who PoeTech is, and the serve-not-extract
            promise — for the curious, never as a gate. */}
        <div className="bg-white border border-[#E8E4DC] border-t-0 p-5 sm:p-6">
          <button
            type="button"
            onClick={() => setAboutOpen((v) => !v)}
            aria-expanded={aboutOpen}
            aria-controls="about-poetech"
            className="w-full flex items-center justify-between gap-2 text-left text-sm font-semibold text-[#1A1815] min-h-[44px] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]"
            style={{ fontFamily: '"Fraunces", serif' }}
          >
            <span>What is this app? · About PoeTech</span>
            <span aria-hidden="true" className="text-[#B85838] text-lg leading-none">{aboutOpen ? '−' : '+'}</span>
          </button>
          <div id="about-poetech" hidden={!aboutOpen} className="mt-3 space-y-3">
            <p className="text-[0.8125rem] text-[#1A1815] leading-relaxed" style={{ fontFamily: '"Fraunces", serif' }}>
              This registration is part of <span className="font-semibold">PoeTech</span> — a platform built for {conf.host} and our community. The Assembly is just the start: the free app brings the conference, church resources, and a way to stay connected together in one place.
            </p>
            <p className="text-[0.8125rem] text-[#1A1815] leading-relaxed" style={{ fontFamily: '"Fraunces", serif' }}>
              We build to <span className="font-semibold">serve the community, not to extract from it</span>: your information stays with the church — never sold, never shared, never used for ads. You decide what you share.
            </p>
            <p className="text-[0.75rem] text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
              After you register, you’ll be offered an optional free account — totally up to you. Either way, you’re registered.
            </p>
          </div>
        </div>

        <p className="text-[0.6875rem] text-[#5A5751] mt-4" style={{ fontFamily: '"Fraunces", serif' }}>
          Questions? Reach a church leader. Built and powered by PoeTech for {conf.host} — from PoeTech to our community.
        </p>
      </div>
    </div>
  );
}
