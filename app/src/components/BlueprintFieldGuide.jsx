// BlueprintFieldGuide — the in-app "How PoeTech is built" explainer. It turns the
// PoeTech Family OS Blueprint (the sovereign-ecosystem story: the five
// commitments, the five ICM context layers, and the two-door access model) into
// a native, clean-text surface a first-time family / COLG reader can walk.
//
// Placed as a tab inside About.jsx (mounted like <AdoptPoeTech />) so it adds no
// new top-level nav and no new monolith lines. Style mirrors About's idiom on
// purpose — white cards, Fraunces serif, themed #hex tokens, no emoji — so it
// inherits the same legibility posture (DR-0116 front-door legibility).
//
// All copy is static and rebuilt native from the source material — the NotebookLM
// deck art is AI-generated and its rendered text carries artifacts, so nothing is
// copied through verbatim (DR-0076: no AI-slop text on a trust surface). This
// guide is intentionally verse-light: it points to the Word as the ground without
// quoting chapter-and-verse, so it makes no scripture claim that would need
// verbatim verification. The deeper doctrinal study lives in the Spiritual Life
// surfaces, where verses are fetched and verified.
import React from 'react';
import { SectionTitle } from './shared.jsx';
import SectionTabs from './SectionTabs.jsx';

const serif = { fontFamily: '"Fraunces", serif' };

// The five commitments — the distilled "sovereign ecosystem for Kingdom
// stewardship" summary. Voiced as a promise TO the family, with the builder
// mechanic named underneath as the proof (the same spine as About's How-it-works).
const COMMITMENTS = [
  {
    t: 'Clarity, so anxiety lifts',
    d: 'Anxiety is usually not knowing what to do. Every screen answers four plain questions — what do I do, when, why does it matter, and how do I actually do it — so the fog lifts before it can settle.',
    k: 'every surface answers what · when · why · how',
  },
  {
    t: 'Sovereignty over your own data',
    d: 'The private, heavy parts run on hardware your family owns, at home. Your data and the AI that serves it stay within the household — not rented out to a cloud that mines it.',
    k: 'runs local on family-owned hardware',
  },
  {
    t: 'A composable spine',
    d: 'Real flexibility comes from discipline, not looseness: one shared data model and single-responsibility modules with strict, versioned seams. Any one piece can be improved without breaking another.',
    k: 'strict contracts at the seams, freedom inside',
  },
  {
    t: 'A 90-day trial with zero lockout',
    d: 'A new account gets 90 days of full access. When the trial ends it reverts to a permanent free tier — it never locks you out and never holds your data hostage. The counter is server-side, visible, and honest.',
    k: 'reverts to forever-free, never locked out',
  },
  {
    t: 'AI that runs the house — inside a cage',
    d: 'The AI Foundation does the operating work — deployments, workflows, the busywork — so a person is only asked when real judgment is needed. It may classify and propose freely, but it may never build, buy, or change data without the Cage and its three brakes: a budget, a single-instance lock, and a kill-switch.',
    k: 'the system proposes · the human governs · then it builds',
  },
];

// The five ICM context layers — the "filesystem is the orchestration" idea, said
// plainly. Grounded in this repo's own CLAUDE.md (Layer 0) and docs layering.
const LAYERS = [
  { n: '0', t: 'Identity', d: 'The global binding rules the system loads first, every time — the operating baseline it never drifts from.' },
  { n: '1', t: 'Routing', d: 'Points the system to the right workspace for the work in front of it.' },
  { n: '2', t: 'Contract', d: 'The specific rules and limits for a single task or stage.' },
  { n: '3', t: 'Reference', d: 'The authoritative foundations — the worldview and system documents read before anything substantial is written.' },
  { n: '4', t: 'Working', d: 'The living record: session notes, decision records, and active audits — how the system remembers.' },
];

// The two-door access model (One Deliberate Path). Path A = instant, no-login
// shareable spaces; Path B = durable, isolated account-backed instances.
const DOORS = [
  {
    tag: 'Path A',
    t: 'Instant entry — no login',
    d: 'Enter a functional space instantly from a QR code or link — a projector QR for a room full of people, an emailed family link, a self-service link. No account, no sign-up, zero friction. Made for the moment, then gone.',
  },
  {
    tag: 'Path B',
    t: 'Durable, isolated ownership',
    d: 'A permanent account for a family or organization, walled off from every other by strict isolation — the wall is in the database itself, not just the screen. Pastoral, clinical, and business data never commingle, which is exactly what lets one platform safely serve many.',
  },
];

function BlueprintFieldGuide() {
  return (
    <section>
      <SectionTitle>How PoeTech is built</SectionTitle>
      <p className="text-sm text-[#5A5751] leading-relaxed mb-3" style={serif}>
        Under the surfaces you use every day is one deliberate design: a <strong>sovereign ecosystem for Kingdom stewardship</strong> — built on discipline, operated in freedom, and grounded in the Word. Here is the shape of it, in plain terms, so you can see why it can be trusted with your family.
      </p>
      <SectionTabs
        variant="sub"
        idBase="about-blueprint"
        ariaLabel="How it's built"
        defaultId="commitments"
        sections={[
          {
            id: 'commitments',
            label: 'Five commitments',
            icon: 'check',
            render: () => (
              <div className="space-y-3">
                <p className="text-sm text-[#5A5751] leading-relaxed" style={serif}>
                  Five commitments hold the whole system together. Each is a promise to you, with the builder mechanic named as the proof.
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {COMMITMENTS.map((it, i) => (
                    <div key={i} className="bg-[#FAF8F4] border border-[#E8E4DC] p-4">
                      <div className="text-[0.625rem] uppercase tracking-[0.2em] text-[#B85838] font-semibold">{it.t}</div>
                      <p className="text-sm text-[#1A1815] mt-1.5 leading-relaxed" style={serif}>{it.d}</p>
                      <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] mt-2 pt-2 border-t border-[#E8E4DC]">The proof · {it.k}</div>
                    </div>
                  ))}
                </div>
              </div>
            ),
          },
          {
            id: 'layers',
            label: 'Five layers',
            icon: 'sliders',
            render: () => (
              <div className="space-y-3">
                <p className="text-sm text-[#5A5751] leading-relaxed" style={serif}>
                  The system does not rely on a complicated middleman to stay organized — the structure lives in the files themselves, in five layers the AI reads in order. It keeps the system human-legible and resilient to memory loss: the important rules are on disk, not in a model's fleeting attention.
                </p>
                <div className="space-y-2">
                  {LAYERS.map((it) => (
                    <div key={it.n} className="flex gap-3 items-start bg-[#FAF8F4] border border-[#E8E4DC] p-3">
                      <div className="shrink-0 w-8 text-center text-[#B85838]" style={{ ...serif, fontWeight: 600 }}>{it.n}</div>
                      <div>
                        <div className="text-sm text-[#1A1815]" style={{ ...serif, fontWeight: 600 }}>Layer {it.n} · {it.t}</div>
                        <p className="text-sm text-[#5A5751] leading-relaxed mt-0.5" style={serif}>{it.d}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ),
          },
          {
            id: 'doors',
            label: 'Two doors',
            icon: 'lock',
            render: () => (
              <div className="space-y-3">
                <p className="text-sm text-[#5A5751] leading-relaxed" style={serif}>
                  There is one deliberate path in, with two doors — instant entry for the moment, and durable, isolated ownership for the long haul.
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {DOORS.map((it, i) => (
                    <div key={i} className="bg-[#FAF8F4] border border-[#E8E4DC] p-4">
                      <div className="text-[0.625rem] uppercase tracking-[0.2em] text-[#B85838] font-semibold">{it.tag}</div>
                      <div className="text-sm text-[#1A1815] mt-0.5" style={{ ...serif, fontWeight: 600 }}>{it.t}</div>
                      <p className="text-sm text-[#5A5751] mt-1.5 leading-relaxed" style={serif}>{it.d}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-[#5A5751] italic leading-relaxed" style={serif}>
                  It is not a tool you finish; it is a tool you live with — and it keeps getting better as your family uses it.
                </p>
              </div>
            ),
          },
        ]}
      />
    </section>
  );
}

export default BlueprintFieldGuide;
