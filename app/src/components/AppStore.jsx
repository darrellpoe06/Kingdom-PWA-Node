// =============================================================================
// AppStore — the PoeTech App Store (Darrell 2026-07-23: "Our own App Store")
// =============================================================================
// The family of apps, installed FROM the app — every brand, both install
// paths, plain instructions (ANXIETY-CLARITY: what/when/why/how). The Android
// packages are OUR builds from OUR lane (DR-0227 four-brand matrix), served
// from the rolling release the lane publishes — our store, our shelves.
// Mounted on About (install identity's home) and safe anywhere.
import React, { useState } from 'react';
import { APP_STORE, INSTALL_STEPS } from '../lib/app-store.js';
import { STORE_IDENTITY_DRAFT } from '../lib/marketing-store.js';

export default function AppStore({ showIdentityDraft = false }) {
  const [open, setOpen] = useState(null); // key of the app whose steps are open
  return (
    <section className="bg-white border-2 border-[#1A1815] p-4 sm:p-6">
      {/* DRAFT identity — FAMILY REVIEW ONLY (Tier C front-door gate, DR-0229):
          renders for stewards so the family reviews the real thing; goes
          public on Darrell's word, never by default. */}
      {showIdentityDraft && (
        <div className="mb-4 border-2 border-dashed border-[#B85838] p-3">
          <div className="text-[0.5625rem] uppercase tracking-[0.25em] text-[#B85838] font-semibold">DRAFT · Tier C family review — not public</div>
          <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#5A5751] mt-2">{STORE_IDENTITY_DRAFT.kicker}</div>
          <div className="text-2xl text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif', fontWeight: 700 }}>{STORE_IDENTITY_DRAFT.tagline}</div>
          <p className="text-xs text-[#1A1815] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>{STORE_IDENTITY_DRAFT.line}</p>
          <ul className="mt-2 space-y-0.5">
            {STORE_IDENTITY_DRAFT.claims.map((c, i) => (
              <li key={i} className="text-[0.6875rem] text-[#1A1815]">✓ {c.fact} <span className="text-[#5A5751]">— {c.source}</span></li>
            ))}
          </ul>
        </div>
      )}
      <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] font-semibold">The PoeTech App Store</div>
      <h2 className="text-xl mt-1 mb-1 text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>
        Every app in the family — installed from right here
      </h2>
      <p className="text-xs text-[#5A5751] mb-3" style={{ fontFamily: '"Fraunces", serif' }}>
        Each installs as its <strong>own app</strong> with its own icon. The <strong>Android app</strong> button is the sure path — it always lands separately in your Apps section. The web link works on any phone or computer.
      </p>
      <div className="grid sm:grid-cols-2 gap-3">
        {APP_STORE.map((a) => (
          <div key={a.key} className="border border-[#E8E4DC] p-3">
            <div className="flex items-center gap-3">
              <img src={a.icon} alt="" className="w-12 h-12 shrink-0" loading="lazy" />
              <div className="min-w-0">
                <div className="text-sm text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{a.name}</div>
                <div className="text-[0.6875rem] text-[#5A5751] leading-snug">{a.blurb}</div>
              </div>
            </div>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <a href={a.apk} className="text-[0.6875rem] uppercase tracking-wider px-3 py-2 min-h-[36px] inline-flex items-center bg-[#B85838] text-white font-semibold hover:bg-[#1A1815] focus:outline focus:outline-2 focus:outline-[#1A1815]">
                ⇩ Download Android app
              </a>
              <a href={a.webUrl} target="_blank" rel="noreferrer" className="text-[0.6875rem] uppercase tracking-wider px-3 py-2 min-h-[36px] inline-flex items-center border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white focus:outline focus:outline-2 focus:outline-[#B85838]">
                Open on the web
              </a>
              <button type="button" onClick={() => setOpen(open === a.key ? null : a.key)}
                className="text-[0.6875rem] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]"
                aria-expanded={open === a.key}>
                {open === a.key ? '− Hide steps' : '? How to install'}
              </button>
            </div>
            {open === a.key && (
              <div className="mt-2 text-[0.6875rem] text-[#1A1815] space-y-2" style={{ fontFamily: '"Fraunces", serif' }}>
                <div>
                  <div className="font-semibold text-[#B85838] uppercase tracking-wider text-[0.5625rem]">Android app (the sure path)</div>
                  <ol className="list-decimal ml-4 mt-0.5 space-y-0.5">{INSTALL_STEPS.apk.map((s, i) => <li key={i}>{s}</li>)}</ol>
                </div>
                <div>
                  <div className="font-semibold text-[#5A5751] uppercase tracking-wider text-[0.5625rem]">Android / computer (web install)</div>
                  <ol className="list-decimal ml-4 mt-0.5 space-y-0.5">{INSTALL_STEPS.web.map((s, i) => <li key={i}>{s}</li>)}</ol>
                </div>
                <div>
                  <div className="font-semibold text-[#5A5751] uppercase tracking-wider text-[0.5625rem]">iPhone / iPad</div>
                  <ol className="list-decimal ml-4 mt-0.5 space-y-0.5">{INSTALL_STEPS.ios.map((s, i) => <li key={i}>{s}</li>)}</ol>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      <p className="mt-3 text-[0.625rem] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>
        Our apps, our store: the Android packages are built by our own lane and published to our rolling release — no app-store gatekeeper between the family and the work. (Testing keys today; Play-store signing is the Governor's custody step, DR-0152.)
      </p>
    </section>
  );
}
