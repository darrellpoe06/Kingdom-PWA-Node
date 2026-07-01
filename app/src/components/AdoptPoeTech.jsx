// AdoptPoeTech — the in-app front door for friends adopting PoeTech for their
// own family, church, or business. Pure presentation over the onboarding libs;
// no main-file dependency, no new monolith lines. Rendered inside About.jsx.
//
// Style mirrors About's idiom on purpose (white cards, Fraunces serif, themed
// #hex text tokens, no emoji) so it inherits the same legibility posture.
import React, { useState } from 'react';
import {
  THE_OFFERING, ADOPTER_TYPES, ONBOARDING_JOURNEY, DECISIONS_PENDING,
} from '../lib/adopter-onboarding.js';
import { templateFor, templateSummary } from '../lib/adopter-templates.js';

const serif = { fontFamily: '"Fraunces", serif' };

function AdoptPoeTech() {
  const [pick, setPick] = useState('family');
  const summary = templateSummary(templateFor(pick));

  return (
    <section className="bg-white border-2 border-[#1A1815] p-5">
      <div className="text-xs uppercase tracking-[0.25em] text-[#B85838] mb-2 font-semibold">
        Bring it home · Adopt PoeTech
      </div>
      <h2 className="text-2xl sm:text-3xl mb-3 leading-tight" style={{ ...serif, fontWeight: 500 }}>
        {THE_OFFERING.headline}
      </h2>

      {/* WHO it's for */}
      <div className="grid sm:grid-cols-3 gap-3 mb-5">
        {ADOPTER_TYPES.map((t) => (
          <div key={t.key} className="border border-[#E8E4DC] p-3">
            <div className="text-sm font-semibold text-[#1A1815]" style={serif}>{t.label}</div>
            <div className="text-sm text-[#5A5751] leading-relaxed" style={serif}>{t.who}</div>
          </div>
        ))}
      </div>

      {/* WHAT you get */}
      <div className="text-xs uppercase tracking-[0.2em] text-[#B85838] mb-2 font-semibold">What you get</div>
      <ul className="mb-5 space-y-1.5">
        {THE_OFFERING.whatYouGet.map((line, i) => (
          <li key={i} className="text-sm text-[#1A1815] leading-relaxed pl-4 -indent-4" style={serif}>
            <span className="text-[#B85838]">— </span>{line}
          </li>
        ))}
      </ul>

      {/* The way in — free pathways */}
      <div className="text-xs uppercase tracking-[0.2em] text-[#B85838] mb-2 font-semibold">The way in</div>
      <div className="grid sm:grid-cols-2 gap-3 mb-5">
        {THE_OFFERING.freePathways.map((p) => (
          <div key={p.key} className="border border-[#E8E4DC] p-3">
            <div className="text-sm font-semibold text-[#1A1815]" style={serif}>{p.label}</div>
            <div className="text-sm text-[#5A5751] leading-relaxed" style={serif}>{p.detail}</div>
          </div>
        ))}
      </div>

      {/* Governance / trust IS the offer */}
      <div className="text-xs uppercase tracking-[0.2em] text-[#B85838] mb-2 font-semibold">Our promises to you</div>
      <div className="grid sm:grid-cols-2 gap-3 mb-5">
        {THE_OFFERING.trustPromises.map((p) => (
          <div key={p.key} className="border-l-2 border-[#5A6E3D] pl-3">
            <div className="text-sm font-semibold text-[#1A1815]" style={serif}>{p.label}</div>
            <div className="text-sm text-[#5A5751] leading-relaxed" style={serif}>{p.detail}</div>
          </div>
        ))}
      </div>

      {/* Your starter — live preview per adopter type */}
      <div className="text-xs uppercase tracking-[0.2em] text-[#B85838] mb-2 font-semibold">Your starter (never anyone else's data)</div>
      <div className="border border-[#E8E4DC] p-3 mb-5">
        <div className="flex flex-wrap gap-2 mb-3">
          {ADOPTER_TYPES.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setPick(t.key)}
              className={
                'text-xs uppercase tracking-wider px-3 py-1.5 border font-semibold focus:outline focus:outline-2 focus:outline-[#B85838] ' +
                (pick === t.key
                  ? 'border-[#1A1815] bg-[#1A1815] text-white'
                  : 'border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white')
              }
              aria-pressed={pick === t.key}
            >
              {t.label}
            </button>
          ))}
        </div>
        {summary && (
          <div>
            <p className="text-sm text-[#1A1815] leading-relaxed mb-2" style={serif}>
              <strong>{summary.label}.</strong> {summary.tagline}
            </p>
            <p className="text-sm text-[#5A5751] leading-relaxed mb-2" style={serif}>
              The system speaks up: <em>{summary.activeGuidance}</em>
            </p>
            <p className="text-sm text-[#5A6E3D] leading-relaxed" style={serif}>
              {summary.contract.privacy} You can keep it, edit it, or clear it — and the moment you add your own real data, the example steps aside.
            </p>
          </div>
        )}
      </div>

      {/* The guided journey */}
      <div className="text-xs uppercase tracking-[0.2em] text-[#B85838] mb-2 font-semibold">Productive in hours — the walk</div>
      <ol className="mb-5 space-y-3">
        {ONBOARDING_JOURNEY.map((step, i) => (
          <li key={step.id} className="border border-[#E8E4DC] p-3">
            <div className="text-sm font-semibold text-[#1A1815] mb-1" style={serif}>
              {i + 1}. {step.title}
            </div>
            <div className="text-sm text-[#5A5751] leading-relaxed" style={serif}>
              <strong className="text-[#1A1815]">What:</strong> {step.what}<br />
              <strong className="text-[#1A1815]">When:</strong> {step.when}<br />
              <strong className="text-[#1A1815]">Why:</strong> {step.why}
            </div>
          </li>
        ))}
      </ol>

      {/* Honest flags — what is still Darrell's call */}
      <div className="border-l-2 border-[#B85838] pl-3">
        <div className="text-sm font-semibold text-[#1A1815] mb-1" style={serif}>Still being decided</div>
        <ul className="space-y-1">
          {DECISIONS_PENDING.map((d, i) => (
            <li key={i} className="text-sm text-[#5A5751] leading-relaxed" style={serif}>— {d}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default AdoptPoeTech;
