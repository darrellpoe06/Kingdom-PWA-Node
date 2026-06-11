// =============================================================================
// BuildBoard — PoeTech building itself, in the open
// =============================================================================
// "All of the PoeTech app build should process through the PoeTech app so the
// work is transparent with estimated Go-Live Dates." (Darrell, 2026-06-10.)
// This is the build itself, shown to every user level: what's shipped, what's
// being built now, what's next with a target date, and what's deliberately
// gated on a decision. It is PLATFORM data (the same for everyone), so it
// lives here as a constant, not in a user's project list.
//
// Update this list as part of shipping — a project moves shipped/building/
// next as the work lands. Go-live dates are honest estimates, revised here.
import React, { useState } from 'react';

// status: 'shipped' | 'building' | 'next' | 'gated'
const ROADMAP = [
  // — Shipped —
  { id: 'sw-version', title: 'Deploy-freshness fix', what: 'Every deploy ships a fresh service worker so updates always reach you (no stale app).', status: 'shipped', when: '2026-06-10' },
  { id: 'rentals-sync', title: 'Real Estate cloud sync', what: 'Properties, rent, mortgage, status sync across your devices — your full numbers, not a flattened copy.', status: 'shipped', when: '2026-06-11' },
  { id: 'dispatch', title: 'Maintenance → worker dispatch', what: 'A repair need becomes a work order, assigns a 1099 worker, texts them the job in one tap, tracked to done.', status: 'shipped', when: '2026-06-11' },
  { id: 'room-memory', title: 'Room memory + tenant turnover', what: 'Per-room photos + notes that persist for every tenant; turnover gives the next tenant a clean slate, landlord keeps the records.', status: 'shipped', when: '2026-06-11' },
  { id: 'life-gallery', title: 'The Biggest Picture', what: 'Family / business / project hero photos on the home screen. Yours — never sold, never mined, never used to train.', status: 'shipped', when: '2026-06-11' },
  { id: 'history-bridge', title: 'Property-history import', what: 'Pull your property chat history into the right property, verified by you before anything is kept.', status: 'shipped', when: '2026-06-11' },

  { id: 'conference', title: 'Conference module (77th National Assembly)', what: 'The Assembly on the Church tab — details, schedule, RSVPs, serving signups, and a direct feedback line from Bishop Gwin that shapes what we build next.', status: 'shipped', when: '2026-06-11' },
  { id: 'one-voice', title: 'One Voice (Church tab)', what: 'One box for everything — prayer, the Assembly, serving, ideas. It suggests where your words go; you always have the last word.', status: 'shipped', when: '2026-06-11' },

  // — Building now —
  { id: 'build-board', title: 'Build-transparency board', what: 'This page — PoeTech building itself in the open, with go-live dates, visible to every user.', status: 'building', when: '2026-06-11' },
  { id: 'ratings', title: 'Ratings — workers and PoeTech itself', what: '1099 workers who advertise accept being rated; PoeTech is rated on feedback the same way — so we always improve, or show plainly why we won’t do something.', status: 'next', when: '2026-06-17' },
  { id: 'pipeline-insights', title: 'Pipeline & promotions insights', what: 'Inside the app: what’s possible to do next, where pipeline investment pays, which services and promotions fit — insight surfaces grounded in your real data.', status: 'next', when: '2026-07-01' },
  { id: 'photos-two-way', title: 'Photos both ways (phone ↔ NAS)', what: 'Browse what’s already on your NAS without filling the phone (live now for property photos); push new phone photos to a space you own next.', status: 'building', when: '2026-06-20' },
  { id: 'occupancy', title: 'Occupancy-revenue model', what: 'Per-room income potential, with the full opportunity always shown — so every vacant room markets itself.', status: 'building', when: '2026-06-20' },
  { id: 'photo-ingest', title: 'Bring property photos in', what: 'File your existing property photos to the right room — see each place transform over the years.', status: 'shipped', when: '2026-06-11' },

  // — Next —
  { id: 'dash-merge', title: 'Dashboard into Projects', what: 'One page that fits every level of user and learner — know anything about everything.', status: 'next', when: '2026-06-24' },
  { id: 'feedback-ai', title: 'Feedback → AI-reviewed follow-up', what: 'Your feedback routed to the right person with follow-up; the sequence gets better over time.', status: 'next', when: '2026-07-01' },
  { id: 'sovereign-photos', title: 'Sovereign photo backup', what: 'Photos backed up to a space you own (your NAS, or your private PoeTech space) — safe across any phone change.', status: 'next', when: '2026-07' },
  { id: 'referral', title: 'Share with people you trust', what: 'Share with real friends and family through your own space — not a public link an ad network indexes.', status: 'next', when: '2026-07-08' },
  { id: 'verticals', title: 'Expert seed data per field', what: 'Lawyers first — each profession sees what an expert in their field would actually need and project.', status: 'next', when: '2026-07-15' },
  { id: 'family-finance', title: 'Family finance together', what: 'Member-level views so the whole family can discuss money and business together — free at the family level.', status: 'next', when: '2026-07-29' },

  // — Gated on a decision (honest about why) —
  { id: 'hardware', title: 'Hardware advisory', what: 'Help you buy the right machine for your needs, set up by the 1099 team.', status: 'gated', when: 'after the funding-model decision (underwriting, never ads)' },
  { id: 'iot', title: 'Cameras / IoT module', what: 'Your Wyze + cameras in one place — family, landlord, business each see only their own.', status: 'gated', when: 'research first (2026-07-22); fairness + privacy review' },
  { id: 'vision-training', title: 'Melanin-accurate vision (opt-in)', what: 'Opt in to train vision that works accurately on every skin tone — default off, your choice.', status: 'gated', when: 'after consent design + legal review (Illinois BIPA)' },
];

const STATUS = {
  shipped:  { label: 'Shipped',  color: '#5A6E3D', symbol: '✓', blurb: 'Live now' },
  building: { label: 'Building',  color: '#B85838', symbol: '◐', blurb: 'In progress' },
  next:     { label: 'Next',      color: '#1A1815', symbol: '→', blurb: 'Planned' },
  gated:    { label: 'Gated',     color: '#5A5751', symbol: '⏸', blurb: 'Waiting on a decision' },
};
const ORDER = ['building', 'next', 'gated', 'shipped'];

export function BuildBoard() {
  const [openId, setOpenId] = useState(null);
  const shippedCount = ROADMAP.filter(r => r.status === 'shipped').length;
  return (
    <div className="space-y-4">
      <section className="bg-white border-2 border-[#1A1815] p-4 sm:p-5">
        <div className="text-[10px] uppercase tracking-[0.3em] text-[#B85838] font-semibold">🛠 PoeTech, Built in the Open</div>
        <p className="text-sm mt-1 text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>
          The work is transparent on purpose. Here is what we&apos;ve shipped, what we&apos;re building now, what&apos;s next with a target date, and what&apos;s waiting on a decision — so you can see exactly where PoeTech is going.
        </p>
        <div className="text-[10px] uppercase tracking-wider text-[#5A6E3D] font-semibold mt-2">✓ {shippedCount} shipped · {ROADMAP.filter(r => r.status === 'building').length} building · {ROADMAP.filter(r => r.status === 'next').length} next</div>
      </section>

      {ORDER.map(statusKey => {
        const items = ROADMAP.filter(r => r.status === statusKey);
        if (!items.length) return null;
        const s = STATUS[statusKey];
        return (
          <section key={statusKey}>
            <h3 className="text-[10px] uppercase tracking-[0.25em] font-semibold mb-2" style={{ color: s.color }}>
              <span aria-hidden="true" className="mr-1">{s.symbol}</span>{s.label} · {s.blurb} ({items.length})
            </h3>
            <div className="bg-white border border-[#1A1815]">
              {items.map((r, i) => (
                <div key={r.id} className={i < items.length - 1 ? 'border-b border-[#E8E4DC]' : ''}>
                  <button
                    type="button"
                    onClick={() => setOpenId(openId === r.id ? null : r.id)}
                    aria-expanded={openId === r.id}
                    className="w-full text-left p-3 hover:bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838]"
                  >
                    <div className="flex items-baseline justify-between gap-2 flex-wrap">
                      <span style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{r.title}</span>
                      <span className="text-[10px] uppercase tracking-wider" style={{ color: s.color, fontFamily: '"JetBrains Mono", monospace' }}>
                        {r.status === 'shipped' ? `shipped ${r.when}` : r.status === 'gated' ? 'gated' : `target ${r.when}`}
                      </span>
                    </div>
                    <p className="text-xs text-[#5A5751] mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>{r.what}</p>
                    {r.status === 'gated' && (
                      <p className="text-[10px] text-[#5A5751] italic mt-1" style={{ fontFamily: '"Fraunces", serif' }}>Waiting on: {r.when}</p>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </section>
        );
      })}
      <p className="text-[10px] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>
        Dates are honest estimates and move as we learn — that&apos;s the point of showing them. No blame, just build.
      </p>
    </div>
  );
}

export default BuildBoard;
