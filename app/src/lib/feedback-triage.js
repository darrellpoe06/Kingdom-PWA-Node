// =============================================================================
// feedback-triage — deterministic AUTO-EVALUATION of a feedback item
// =============================================================================
// The gap this closes (concern seed-feedback-auto-eval): a submitted feedback
// note used to just sit "awaiting evaluation" until a human read it by hand.
// Now every item is evaluated the instant it reaches the board — categorized,
// given a severity, routed to an area, and paired with a concrete suggested
// next step — so it LANDS ACTIONABLE, not on a pile.
//
// Pure + keyword-based ON PURPOSE (NO LLM): it is always-on, instant, offline,
// idempotent, and unit-testable (DR-0076 — make truth cheap to verify). It never
// waits on a model and can never run away (no brakes needed). A human still sets
// the real solution/target on the board; this gives them a triaged starting
// point instead of a blank "awaiting evaluation".
//
// evaluateFeedback(item) -> {
//   category, categoryLabel, severity, severityLabel, priorityRank (0=worst),
//   isNoise, routeArea, suggestedAction
// }
// =============================================================================

export const SEVERITY = {
  critical: { rank: 0, label: 'Critical' },
  high:     { rank: 1, label: 'High' },
  normal:   { rank: 2, label: 'Normal' },
  low:      { rank: 3, label: 'Low' },
  noise:    { rank: 4, label: 'Telemetry' },
};

// Ordered rules — FIRST match wins (most severe / most specific first). Each rule
// names a category, the severity it implies, the area it routes to, and the next
// step we'd take. `test` runs against the lowercased feedback text.
const RULES = [
  {
    category: 'telemetry-noise', label: 'Telemetry noise', severity: 'noise', area: 'Feedback / Learn',
    test: (t) => /\[learn engagement\]|\bsignal=|\bband=/.test(t),
    action: 'Machine telemetry, not human feedback — route to the engagement store and filter it out of triage (concern seed-fb-engagement-pollutes-feedback).',
  },
  {
    category: 'data-loss', label: 'Data loss', severity: 'critical', area: 'Data integrity',
    test: (t) => /disappear|\blost\b|\bgone\b|did ?n'?t ?save|does ?n'?t ?save|won'?t ?save|not ?sav(e|ed|ing)|discard|deleted|wiped|erased|vanish/.test(t),
    action: 'Reproduce the save/persist path, fix it, and verify the entry survives a reload. A correctness bug, not polish — treat as urgent.',
  },
  {
    category: 'privacy-tenancy', label: 'Privacy / tenancy', severity: 'critical', area: 'Privacy / Tenancy',
    test: (t) => /not my|is ?n'?t mine|someone ?else|other ?people|wrong ?name|mixed ?up|compromised|another (person|user|account)|see(ing)? .*(other|someone)/.test(t),
    action: 'Verify isolation with a real second-account login (RLS no-leak gate). Confirm no foreign name/number appears; drop any seed/sample bleed.',
  },
  {
    category: 'auth', label: 'Sign-in', severity: 'critical', area: 'Auth / Sign-in',
    test: (t) => /can'?t ?(log ?in|sign ?in)|cannot ?(log|sign)|unable to (log|sign)|signed ?out|logged ?out|log ?out|session expired|token|password|magic ?link/.test(t),
    action: 'Diagnose first (do not guess): reproduce the sign-in failure, check the service-worker / auth-token / session-refresh path, then fix.',
  },
  {
    category: 'broken', label: 'Broken / bug', severity: 'high', area: 'Bug',
    test: (t) => /broken|does ?n'?t ?work|not ?working|doesn'?t ?load|won'?t ?load|white ?screen|crash|frozen|froze|\bstuck\b|\berror\b|\bbug\b|glitch|can'?t ?(open|click|tap|add|load|use|access)/.test(t),
    action: 'Reproduce and characterize the break first, fix it, then verify live in the running app.',
  },
  {
    category: 'accessibility', label: 'Accessibility', severity: 'high', area: 'Accessibility',
    test: (t) => /contrast|can'?t ?read|hard ?to ?(see|read)|too ?small|text ?size|font ?size|legib|unreadable|color ?(is|too|blind)/.test(t),
    action: 'Check the per-theme contrast guard + text-size primitive; fix the rendered ratio/size and re-verify against the WCAG AA bar.',
  },
  {
    category: 'feature-request', label: 'Feature request', severity: 'normal', area: 'Feature request',
    test: (t) => /(would|i'?d) ?like|can ?you ?(add|make|build)|please ?add|it ?should|wish|feature|request|suggest|\bidea\b|ability ?to|want (to|a|the|more|it)|add (a|an|the|more)|be ?able ?to/.test(t),
    action: 'Scope as a feature and review by use in the user’s hands; set a target on the board.',
  },
  {
    category: 'question', label: 'Question', severity: 'normal', area: 'Help / Clarity',
    test: (t) => /\?$|how ?(do|can|to)|what ?(does|is|are)|where ?(is|do|can)|why ?(is|does|can'?t|are)/.test(t),
    action: 'Answer in-app (contextual help / clarity affordance) so the next person with the same question is unblocked.',
  },
  {
    category: 'praise', label: 'Praise', severity: 'low', area: 'Praise',
    test: (t) => /\blove\b|\bgreat\b|awesome|thank|nice ?work|good ?job|excellent|amazing|beautiful|well ?done|👍|❤|🙏/.test(t),
    action: 'Acknowledge and feed the content flywheel (proven resonance → marketing).',
  },
];

const DEFAULT_RULE = {
  category: 'uncategorized', label: 'Needs review', severity: 'normal', area: 'Feedback',
  action: 'No clear category from the text — review with Darrell and set a disposition.',
};

const IMAGE_RULE = {
  category: 'needs-image-review', label: 'Needs image review', severity: 'normal', area: 'Feedback',
  action: 'Screenshot-only with no usable text — review the attached image with Darrell, then classify (concern seed-fb-unlabeled-screenshots).',
};

// feedbackText — the single human-readable body for a feedback item, from
// whichever shape it arrives in: the remote/prototype `text`/`feedback_text`,
// OR the FeedbackModal's structured fields (whatsWorking / whatsNot / whatsMissing).
// Mirrors the composer in feedback-sync so a LOCALLY-submitted item is recognized
// on the board immediately — not only after it round-trips through the cloud.
export function feedbackText(item = {}) {
  if (item.text) return item.text;
  if (item.feedback_text) return item.feedback_text;
  const parts = [];
  if (item.whatsWorking) parts.push(item.whatsWorking);
  if (item.whatsNot) parts.push(item.whatsNot);
  if (item.whatsMissing) parts.push(item.whatsMissing);
  return parts.join(' · ');
}

function screenshotCount(item) {
  if (Array.isArray(item.screenshots)) return item.screenshots.length;
  if (typeof item.screenshotCount === 'number') return item.screenshotCount;
  if (item.hasScreenshot) return 1;
  return item.screenshot ? 1 : 0;
}

export function evaluateFeedback(item = {}) {
  const text = String(feedbackText(item) || '').trim();
  const lower = text.toLowerCase();
  // A few feedback rows are screenshot-only or carry no usable text ("[bug]",
  // "what does this image mean") — they cannot be dispositioned from text alone.
  const usableText = lower && !/^\[?\s*bug\s*\]?$/.test(lower) && lower !== 'what does this image mean' && lower !== 'what does this mean';
  let rule;
  if (!usableText && screenshotCount(item) > 0) {
    rule = IMAGE_RULE;
  } else {
    rule = RULES.find((r) => r.test(lower)) || DEFAULT_RULE;
  }
  const sev = SEVERITY[rule.severity] || SEVERITY.normal;
  // Route to the user's named tab/area when present and specific; else the
  // category's home area. (Generic "Feedback"/"Other" defer to the category.)
  const rawArea = item.currentView || item.which_tab || item.area || '';
  const genericArea = !rawArea || /^(feedback|other|app|general)$/i.test(rawArea);
  const routeArea = genericArea ? rule.area : rawArea;
  return {
    category: rule.category,
    categoryLabel: rule.label,
    severity: rule.severity,
    severityLabel: sev.label,
    priorityRank: sev.rank,
    isNoise: rule.severity === 'noise',
    routeArea,
    suggestedAction: rule.action,
  };
}
