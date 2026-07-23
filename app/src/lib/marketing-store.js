// =============================================================================
// marketing-store — DRAFT: the App Store's marketing identity (DR-0229)
// =============================================================================
// "Can we market our App Store as AI Productivity Systems for US by us?"
// (Darrell 2026-07-23.) PUBLIC since 2026-07-23: the Tier-C front-door gate
// was opened the documented way — family review completed, then the
// Governor's word: "We reviewed with the family — go public." (DR-0229.)
//
// Every claim below is a MEASURED FACT with its source named (DR-0100: market
// established fact; DR-0228: the system's excellence, never our data).
export const STORE_IDENTITY = {
  status: 'public',
  approvedBy: 'Darrell + family review, 2026-07-23',
  kicker: 'AI Productivity Systems',
  tagline: 'For Us. By Us.',
  line: 'Built by a family, for the families and churches mainstream tech overlooked — sovereign, serving, and proving itself on every build.',
  claims: [
    { fact: '6,400+ automated checks gate every release', source: 'the CI suite (vitest run count)' },
    { fact: 'Four apps in our own store — no gatekeeper', source: 'the App Store shelves (android-latest release)' },
    { fact: 'Your data is yours: exportable, deletable, never sold, no ads', source: 'DATA-AS-EMPOWERMENT (foundation doc)' },
    { fact: 'The site is watched from outside every ~10 minutes', source: 'site-health.yml (the uptime witness)' },
    { fact: 'Speak your requirements into the app; reviewed work comes out', source: 'requirements-intake (DR-0121 item 10)' },
  ],
  // BUSINESS-PROCESS-CONNECTIONS four-question test (answered before shipping):
  fourQuestions: {
    invites: 'App installs; client builds (declared pricing, DR-0117); church/community onboarding.',
    pipeline: 'Installs → the store shelves; builds → requirements-intake → steward review → build boards; church → the Love Corner door.',
    governs: 'Darrell governs volume; the Foundation executes; capacity per opportunity-capacity.',
    promise: 'Serve-not-extract, sovereign data, God-explicit and winsome (DR-0188) — the Ways, visible.',
  },
};

// DRAFT: the consented outbound lane (MailerLite) — design only, wired later.
// Constraints bound in: opt-in ONLY (no pre-checked boxes, no dark patterns —
// DATA-AS-EMPOWERMENT), unsubscribe honored instantly, content = the measured
// facts + what shipped, never family/user data (DR-0228).
export const OUTBOUND_LANE_DRAFT = {
  status: 'design',
  consent: 'A visible, unchecked opt-in on About/the doors: "Send me what ships." Nothing else joins a list.',
  cadence: 'When something real ships — never a clock-driven drip.',
  content: 'What shipped + what it does for you; the App Store shelf; the build pipeline for hire.',
  tool: 'MailerLite (connected; wiring is its own increment behind this design).',
};
