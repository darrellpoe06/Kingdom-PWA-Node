// =============================================================================
// one-voice-surfaces — per-surface CONFIG for the one master input box
// =============================================================================
// The OneVoiceInput component is the shared "say it once, route it" primitive.
// Everything that differs PER SURFACE — the default route, the framing border,
// the source tag, and the confirmation tone — is pure data, pulled out here so
// it is (a) testable in a node env without rendering React, and (b) EXTENSIBLE
// by a caller: a new surface (a Study capture, an Engagement thread, a cockpit
// "issue a directive" box) can adopt the one primitive by passing its own
// `surfaceConfig`, without editing the component. This mirrors why planDispatch
// was pulled into one-voice-routing.js: keep "what the input is configured to
// do" as a table you can pin with a test, not behavior buried in a component.
//
// Adding a surface does NOT change the two built-ins (church, notes): a caller
// that passes nothing gets exactly SURFACES[surface]. That invariant is what
// the consolidation (PR #154) characterization test protects, and what this
// extraction preserves byte-for-byte.

export const SURFACES = {
  church: {
    defaultRoute: 'prayer',
    borderCls: 'border-[#B85838]',
    sourceTag: 'church-one-voice',
    sourceLabel: 'from Church One Voice',
    inquiryFrom: '(from church)',
    counselingNote: 'Requested counseling via Church One Voice. Their words stay private — TLC connects directly.',
    saveNoteOnCounseling: false,
    confirmations: {
      prayer:     '🙏 On the prayer list. The church is standing with you.',
      conference: '🎪 Received for the Assembly — it goes straight onto the build list.',
      poetech:    '💡 PoeTech heard you — program processes and procedures begin. It’s on the build inbox.',
      work:       '🛠 On the Action Queue as a work order — it can dispatch to a worker from Big Picture.',
      counseling: '💚 The practice knows you’d like to talk — your words stayed private here. Reaching out took courage.',
      serve:      '🤝 Leadership will see your serving hands — thank you.',
      pastor:     '⛪ A note to the pastors — received.',
      voice:      '💬 Heard and kept. Thank you for your voice.',
    },
  },
  notes: {
    defaultRoute: 'private',
    borderCls: 'border-[#1A1815]',
    sourceTag: 'thinking-space',
    sourceLabel: 'from Thinking Space',
    inquiryFrom: '(from notes)',
    counselingNote: 'Requested counseling via Thinking Space. Their words stay private on their device — TLC connects directly.',
    saveNoteOnCounseling: true,
    confirmations: {
      poetech:    '💡 PoeTech heard you — it’s on the build inbox. You shape what gets built.',
      prayer:     '🙏 On the prayer list. The church is standing with you.',
      pastor:     '⛪ A note to the pastors — they’ll see it on the Church tab.',
      serve:      '🤝 Leadership will see your serving hands — thank you.',
      work:       '🛠 On the Action Queue as a work order — dispatch it to a worker from Big Picture.',
      counseling: '💚 The practice knows you’d like to talk — your words stayed private here, for you to share with them directly. Reaching out took courage.',
      private:    '📓 Kept — private to you. Come back to it anytime.',
    },
  },
};

// resolveSurface — the PURE resolution of a surface's config, given the built-in
// `surface` name and an optional caller `override`. When override is absent the
// built-in config is returned UNCHANGED (the byte-identical invariant). When an
// override is given, it merges OVER the base (falling back to the church base
// for an unknown surface name), and `confirmations` deep-merge so a caller can
// supply just the tones it cares about and inherit the rest. This is the seam
// that lets a new surface reuse the one input primitive without touching it.
export function resolveSurface(surface, override) {
  const base = SURFACES[surface] || SURFACES.church;
  if (!override) return base;
  return {
    ...base,
    ...override,
    confirmations: { ...(base.confirmations || {}), ...(override.confirmations || {}) },
  };
}
