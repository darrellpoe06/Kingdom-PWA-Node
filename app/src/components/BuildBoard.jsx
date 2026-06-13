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
  { id: 'thinking-space', title: 'Thinking Space (your diary)', what: 'A sovereign, private place to think and come back to your thoughts — examine them against the Test, and tell PoeTech what to build right from a note.', status: 'shipped', when: '2026-06-11' },

  // — Building now —
  { id: 'build-board', title: 'Build-transparency board', what: 'This page — PoeTech building itself in the open, with go-live dates, visible to every user.', status: 'building', when: '2026-06-11' },
  { id: 'ratings', title: 'Ratings — workers and PoeTech itself', what: '1099 workers who advertise accept being rated; PoeTech is rated on feedback the same way — so we always improve, or show plainly why we won’t do something.', status: 'next', when: '2026-06-17' },
  { id: 'pipeline-insights', title: 'Pipeline & promotions insights', what: 'Inside the app: what’s possible to do next, where pipeline investment pays, which services and promotions fit — insight surfaces grounded in your real data.', status: 'next', when: '2026-07-01' },
  { id: 'real-data-signedin', title: 'Your real bank + Gmail data when signed in', what: 'The import pipeline exists (download your statements → it reads them; Gmail cross-checks). Next: unlock it for a signed-in owner on the public site, carefully — it’s your most sensitive data.', status: 'next', when: '2026-06-24' },
  { id: 'bank-automation', title: 'Banking on autopilot (set up once, no human after)', what: 'Your bank emails statements → your own Gmail → your own NAS → verified ledger → the app. ACTIVATED under supervision 2026-06-11 — and the watched first run caught a real outage (expired Gmail credential, silently failing for hours). One reconnect heals the whole lane.', status: 'building', when: 'Gmail reconnect (1 min) + bank statement-emails on' },
  { id: 'reports-levels', title: 'Reports for every level of thinking', what: 'The same live truth, clarified differently — simple / standard / expert lenses on every report, so a child, a deacon, and a CPA all understand and decide from near-live data.', status: 'next', when: '2026-07-15' },
  { id: 'tenant-portal', title: 'Tenant logins (their own door)', what: 'A tenant signs in and sees ONLY their unit: their lease, their rent status, report-a-repair straight into the dispatch loop. The backend pipeline and privacy boundaries exist; the role-gated tenant surface is the build. Until then, tenants call or text — the landlord side records everything.', status: 'gated', when: 'after the family soak + merge — privacy review first (a tenant must never see the family’s books)' },
  { id: 'tlc-intake', title: 'Counseling intake for every TLC therapist', what: 'A client opens a therapist’s link, speaks once, and a clean intake lands with the right 1099 therapist — contact-level only; clinical records stay with the clinician. The counseling route shipped tonight; per-therapist routing is the last hop.', status: 'next', when: '2026-06-24' },
  { id: 'church-newsletter', title: 'Church newsletter on autopilot (with the Bishop’s yes)', what: 'A disciplined weekly draft built only from real church data — Assembly, schedule, serving, praise — held for Bishop Gwin’s one-tap approval before anything sends. The composing workflow pattern already runs daily for the build.', status: 'next', when: '2026-07-08' },
  { id: 'contractor-workspace', title: 'The handyman’s workspace (20 clients, organized)', what: 'The dispatch rails flipped to the worker’s side: my jobs today, my clients, my scopes, my invoices. Built for the tradesman who should prefer PoeTech because it runs his whole week.', status: 'next', when: '2026-07-15' },
  { id: 'sovereign-ai-diary', title: 'Your own AI in the Thinking Space', what: 'Talk a thought through with an AI that runs on your NAS — private, opt-in, never leaves your control. The diary is live now; this adds the conversation.', status: 'next', when: '2026-07-08' },
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
  const counts = Object.fromEntries(ORDER.map(k => [k, ROADMAP.filter(r => r.status === k).length]));
  // Default to the first stage that actually has items (Building first per
  // ORDER) so the tab opens on "what's happening now".
  const firstNonEmpty = ORDER.find(k => counts[k] > 0) || 'building';
  const [tab, setTab] = useState(firstNonEmpty);
  const s = STATUS[tab];
  const items = ROADMAP.filter(r => r.status === tab);
  return (
    <div className="space-y-4">
      <section className="bg-white border-2 border-[#1A1815] p-4 sm:p-5">
        <div className="text-[10px] uppercase tracking-[0.3em] text-[#B85838] font-semibold">🛠 PoeTech, Built in the Open</div>
        <p className="text-sm mt-1 text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>
          The work is transparent on purpose. Here is what we&apos;ve shipped, what we&apos;re building now, what&apos;s next with a target date, and what&apos;s waiting on a decision — so you can see exactly where PoeTech is going.
        </p>
        <div className="text-[10px] uppercase tracking-wider text-[#5A6E3D] font-semibold mt-2">✓ {counts.shipped} shipped · {counts.building} building · {counts.next} next</div>
      </section>

      {/* Stage sub-tabs — pick a stage and see just that short list, instead of
          one long scroll down the phone. */}
      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Build stages">
        {ORDER.map(k => {
          if (!counts[k]) return null;
          const st = STATUS[k];
          const active = tab === k;
          return (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => { setTab(k); setOpenId(null); }}
              className="text-xs uppercase tracking-wider px-3 py-1.5 border min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]"
              style={active ? { backgroundColor: st.color, color: 'white', borderColor: st.color } : { color: st.color, borderColor: st.color }}
            >
              <span aria-hidden="true" className="mr-1">{st.symbol}</span>{st.label} ({counts[k]})
            </button>
          );
        })}
      </div>

      <section>
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

      <p className="text-[10px] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>
        Dates are honest estimates and move as we learn — that&apos;s the point of showing them. No blame, just build.
      </p>
    </div>
  );
}

export default BuildBoard;
