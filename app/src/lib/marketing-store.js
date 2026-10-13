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
import { APP_STORE } from './app-store.js';

// The app count is DERIVED, never typed. It read "Four apps" on the live About
// page on 2026-08-28 while the store shelf below it rendered FIVE cards — Poe
// Properties had been added to APP_STORE (DR-0313) and the marketing claim beside
// it stayed at the number somebody typed in July. A claim that cannot update is
// a claim that will eventually lie (DR-0076 §4: measure, don't claim), and this
// one is on the front door. Adding a sixth app now moves this sentence by itself.
const COUNT_WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];
export const appCountWord = (n = APP_STORE.length) =>
  (Number.isInteger(n) && n >= 0 && n < COUNT_WORDS.length ? COUNT_WORDS[n] : String(n));
export const storeShelfClaim = (apps = APP_STORE) => ({
  fact: `${appCountWord(apps.length)} apps in our own store — no gatekeeper`,
  source: 'the App Store shelves (APP_STORE, published to the android-latest release)',
});

export const STORE_IDENTITY = {
  status: 'public',
  approvedBy: 'Darrell + family review, 2026-07-23',
  kicker: 'AI Productivity Systems',
  tagline: 'For Us. By Us.',
  line: 'Built by a family, for the families and churches mainstream tech overlooked — sovereign, serving, and proving itself on every build.',
  claims: [
    // MEASURED, not remembered: 8,784 tests across 733 files, `npx vitest run`
    // in app/, 2026-08-28. It read "6,400+" until then — true, but a third
    // short, which under-claims a real thing the family built (DR-0100: speak
    // established fact; under-claiming is as much a failure of truth as
    // over-claiming). Re-measure with the same command when this is revisited.
    // re-review: 2026-11-28
    { fact: '8,700+ automated checks gate every release', source: 'the CI suite (vitest run count, measured 2026-08-28)' },
    storeShelfClaim(),
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
