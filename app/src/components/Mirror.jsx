// Mirror — the Behavioral Mirror primitive
//
// Spec: docs/00-foundations/_root/BEHAVIORAL-MIRROR.md
// "When reality reflects something back about your behavior — a result,
//  a pattern, a consequence, a word of correction, a number on a page —
//  it moves through four stages. This is the operational form of the
//  Behavioral Mirror."
//
//      DATA  →  TRUTH  →  IDENTITY  →  INVITATION
//
// Compound-component API. The IDENTITY block is visually anchored
// (inverted treatment) and structurally never collapsible: a person of
// The Way receives correction FROM a settled identity, not AS a referendum
// on identity. Section order is fixed by the renderer to enforce the
// sequence regardless of child order.
//
// Usage:
//   <Mirror>
//     <Mirror.Data>...numbers, charts, facts...</Mirror.Data>
//     <Mirror.Truth>...Scripture + honest reading...</Mirror.Truth>
//     <Mirror.Identity>...who you are in Christ...</Mirror.Identity>
//     <Mirror.Invitation>...specific next step...</Mirror.Invitation>
//   </Mirror>

import React, { Children, isValidElement } from 'react';

// -----------------------------------------------------------------------------
// Internal section components — tagged so the renderer can find them in any
// child order and render them in the canonical order regardless.
// -----------------------------------------------------------------------------

function MirrorData({ children }) {
  return children;
}
MirrorData.__mirrorSection = 'data';

function MirrorTruth({ children }) {
  return children;
}
MirrorTruth.__mirrorSection = 'truth';

function MirrorIdentity({ children }) {
  return children;
}
MirrorIdentity.__mirrorSection = 'identity';

function MirrorInvitation({ children }) {
  return children;
}
MirrorInvitation.__mirrorSection = 'invitation';

// -----------------------------------------------------------------------------
// Section frame — shared chrome for DATA, TRUTH, INVITATION.
// IDENTITY uses its own frame below (inverted, anchored).
// -----------------------------------------------------------------------------

function Frame({ eyebrow, accent, children }) {
  return (
    <section className="border border-[#E8E4DC] bg-white p-4 sm:p-5">
      <div
        className="text-[10px] uppercase tracking-[0.25em] font-semibold mb-3"
        style={{ color: accent || '#5A5751' }}
      >
        {eyebrow}
      </div>
      <div
        className="text-base leading-relaxed text-[#1A1815]"
        style={{ fontFamily: '"Fraunces", serif' }}
      >
        {children}
      </div>
    </section>
  );
}

function IdentityFrame({ children }) {
  return (
    <section
      className="bg-[#1A1815] text-white p-4 sm:p-5 border-2 border-[#1A1815]"
      aria-label="Identity (anchored in Christ — not a referendum on the data)"
    >
      <div className="flex items-baseline justify-between gap-2 flex-wrap mb-3">
        <div className="text-[10px] uppercase tracking-[0.3em] text-[#FAF8F4] font-semibold">
          Identity · Anchored
        </div>
        <div
          className="text-[9px] uppercase tracking-wider text-[#FAF8F4] opacity-70"
          style={{ fontFamily: '"JetBrains Mono", monospace' }}
        >
          2 Cor 5:20
        </div>
      </div>
      <div
        className="text-base sm:text-lg leading-relaxed"
        style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}
      >
        {children}
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// Mirror — main component. Walks children, sorts into the canonical sequence,
// renders in fixed order. Missing sections render a TODO placeholder rather
// than silently skip — the four-section discipline is binding.
// -----------------------------------------------------------------------------

function MissingSectionPlaceholder({ name }) {
  return (
    <div
      className="border border-dashed border-[#B85838] bg-[#FAF8F4] p-3 text-xs text-[#B85838]"
      role="alert"
    >
      <strong>Mirror is incomplete:</strong> the {name.toUpperCase()} section is
      missing. Per BEHAVIORAL-MIRROR.md the four-section sequence is required
      wherever the system reflects user data back.
    </div>
  );
}

export default function Mirror({ children }) {
  const sections = { data: null, truth: null, identity: null, invitation: null };

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    const tag = child.type && child.type.__mirrorSection;
    if (tag && tag in sections) {
      sections[tag] = child;
    }
  });

  return (
    <article
      className="space-y-3"
      aria-label="Behavioral Mirror: data, truth, identity, invitation"
    >
      <Frame eyebrow="Data · The reflection" accent="#5A5751">
        {sections.data || <MissingSectionPlaceholder name="data" />}
      </Frame>

      <Frame eyebrow="Truth · Measured against Scripture" accent="#B85838">
        {sections.truth || <MissingSectionPlaceholder name="truth" />}
      </Frame>

      <IdentityFrame>
        {sections.identity || (
          <MissingSectionPlaceholder name="identity" />
        )}
      </IdentityFrame>

      <Frame eyebrow="Invitation · The next step" accent="#5A6E3D">
        {sections.invitation || (
          <MissingSectionPlaceholder name="invitation" />
        )}
      </Frame>
    </article>
  );
}

// Attach subcomponents for the compound API.
Mirror.Data = MirrorData;
Mirror.Truth = MirrorTruth;
Mirror.Identity = MirrorIdentity;
Mirror.Invitation = MirrorInvitation;
