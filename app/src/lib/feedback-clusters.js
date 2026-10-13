// =============================================================================
// feedback-clusters — the LOW-HANGING-FRUIT board: how many people said the
// same thing, and what that means for what we fix first.
// =============================================================================
// Declared by Darrell 2026-09-11, demonstrating the app to the Church of the
// Living God leadership, explaining why feedback goes in the app instead of
// into fifty separate conversations:
//
//   "When you're running a big operation, there's all these issues that come
//    in. You do not want to be sending back 'what's wrong, what's wrong' —
//    you got fifty people you gotta talk to. I don't want that. We got fifty
//    feedback things, we can look through a list and go, oh, that's what they
//    talking about. And then it may be ten people saying the same thing.
//    There may be twenty people saying the exact same issue. So when we fix
//    that issue, that shows us our low hanging fruit... There's two people
//    that got this issue — we gotta fix that. Or two people, but guess what,
//    that's gonna make a bigger problem. That's a higher priority even though
//    they'll has two issues."
//
// Two rules live in that quote and both are encoded below:
//   1. VOLUME COUNTS. Twenty people reporting one thing outranks twenty
//      separate one-off notes — it is one fix that clears twenty complaints.
//   2. SEVERITY OUTRANKS VOLUME. Two people hitting something that "makes a
//      bigger problem" beats twenty people hitting a nit. Severity is the
//      multiplier, reporter count is the multiplicand.
//
// `evaluateFeedback` (lib/feedback-triage) already gives each item a severity.
// This module is the layer above it: it decides which items are THE SAME
// COMPLAINT, counts the distinct people behind each, and ranks the result.
//
// Pure + deterministic ON PURPOSE (NO LLM), for the same reasons feedback-triage
// is: always-on, instant, offline, idempotent, unit-testable (DR-0076). A human
// still decides what actually gets built; this hands them the ordered list
// instead of a pile of fifty cards.
//
//   clusterFeedback(items)  -> ranked [{ signature, label, area, count,
//                                        reporters, severity, severityLabel,
//                                        score, items, firstSeen, lastSeen }]
//   summarizeClusters(cls)  -> { total, clustered, duplicateRate, topLabel }
// =============================================================================

import { evaluateFeedback, feedbackText, SEVERITY } from './feedback-triage.js';

// Severity is the MULTIPLIER on reporter count, so "two people with a critical"
// (2 x 100 = 200) outranks "twenty people with a nit" (20 x 5 = 100), while
// twenty normals (100) still outrank two normals (10). This is Darrell's rule
// stated as arithmetic, not as a vibe.
export const SEVERITY_WEIGHT = {
  critical: 100,
  high: 25,
  normal: 5,
  low: 1,
  noise: 0,
};

// Words that carry no complaint-identity. Two people describing the same broken
// thing rarely use the same filler, so filler must not keep their reports apart.
const STOPWORDS = new Set([
  'a', 'an', 'and', 'the', 'is', 'it', 'its', 'to', 'of', 'in', 'on', 'at', 'for',
  'with', 'this', 'that', 'these', 'those', 'i', 'im', 'ive', 'my', 'me', 'we',
  'our', 'you', 'your', 'they', 'them', 'their', 'be', 'been', 'was', 'were',
  'are', 'am', 'do', 'does', 'did', 'have', 'has', 'had', 'but', 'or', 'so',
  'if', 'when', 'then', 'there', 'here', 'just', 'really', 'very', 'kinda',
  'sorta', 'like', 'also', 'too', 'get', 'got', 'up', 'out', 'from', 'as',
  'about', 'would', 'could', 'should', 'can', 'will', 'because',
]);

// Light suffix folding so "buttons"/"button" and "loading"/"loads"/"load" land
// in one cluster. Deliberately crude — a real stemmer is a dependency we do not
// need, and over-folding would merge complaints that are genuinely different.
function fold(word) {
  let w = word;
  if (w.length > 4 && w.endsWith('ing')) w = w.slice(0, -3);
  else if (w.length > 4 && w.endsWith('ed')) w = w.slice(0, -2);
  else if (w.length > 3 && w.endsWith('es')) w = w.slice(0, -2);
  else if (w.length > 3 && w.endsWith('s')) w = w.slice(0, -1);
  return w;
}

// A handful of the ways people say the same thing in a church pew. Folded to one
// token so "doesn't work", "isn't working" and "broken" cluster together.
const PHRASES = [
  [/\b(does ?n'?t|do ?n'?t|did ?n'?t|is ?n'?t|was ?n'?t|wo ?n'?t|ca ?n'?t|cannot|not) ?(work|working|works|load|loading|loads|open|opening|show|showing|save|saving)\b/g, ' broken '],
  [/\bnot working\b/g, ' broken '],
  [/\bwhite screen\b/g, ' broken '],
  [/\blog ?in\b|\bsign ?in\b|\blogin\b|\bsignin\b/g, ' signin '],
  [/\bsign ?up\b/g, ' signup '],
  [/\btoo small\b|\bhard to read\b|\bcan ?n?'?t read\b/g, ' unreadable '],
];

// normalizeComplaint — the SIGNATURE of a complaint: what is left after the
// noise. Two reports with the same signature are the same issue for our
// purposes. Order-insensitive (tokens are sorted) so "the give button is broken"
// and "broken give button" match.
export function normalizeComplaint(text) {
  let t = String(text || '').toLowerCase();
  for (const [re, sub] of PHRASES) t = t.replace(re, sub);
  const tokens = t
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map(fold)
    .filter((w) => w.length > 1 && !STOPWORDS.has(w));
  // De-duplicate within one report so a rant that repeats "broken" five times
  // does not out-weigh a calm report of the same thing.
  return Array.from(new Set(tokens)).sort().join(' ');
}

// Who reported this — a person, not a row. Two notes from the same person about
// the same thing are ONE voice, not two; the count has to mean "people".
function reporterOf(item) {
  return (
    item.userId || item.user_id || item.displayName || item.display_name ||
    item.deviceLabel || item.device_label || `row:${item.id}`
  );
}

function whenOf(item) {
  return item.createdAt || item.submittedAt || item.submitted_at || null;
}

// The clearest sentence in the cluster stands as its label — the longest report
// usually carries the most detail, which is what a triager wants to read first.
function labelFor(bodies) {
  return bodies.slice().sort((a, b) => b.length - a.length)[0] || '';
}

// clusterFeedback — group, count the PEOPLE, rank. Telemetry noise is excluded
// (weight 0 would rank it last anyway, but it should not appear on a board a
// human is reading as "what people are telling us").
export function clusterFeedback(items = []) {
  const groups = new Map();

  for (const item of items || []) {
    if (!item) continue;
    const body = feedbackText(item);
    if (!body) continue;
    const evaluation = evaluateFeedback(item);
    if (evaluation.isNoise) continue;

    // The area is part of identity: "it's broken" on Giving and "it's broken"
    // on the Bus schedule are two different fixes, not one cluster of two.
    const signature = normalizeComplaint(body);
    if (!signature) continue;
    const key = `${evaluation.routeArea}::${signature}`;

    let g = groups.get(key);
    if (!g) {
      g = {
        signature, area: evaluation.routeArea, items: [], bodies: [],
        reporters: new Set(), worstRank: SEVERITY.low.rank, severity: 'low',
        firstSeen: null, lastSeen: null, suggestedAction: evaluation.suggestedAction,
      };
      groups.set(key, g);
    }
    g.items.push(item);
    g.bodies.push(body);
    g.reporters.add(reporterOf(item));
    // The cluster is as severe as its worst member — one person describing the
    // data loss under a pile of "it's weird" reports sets the priority.
    if (evaluation.priorityRank < g.worstRank) {
      g.worstRank = evaluation.priorityRank;
      g.severity = evaluation.severity;
      g.suggestedAction = evaluation.suggestedAction;
    }
    const when = whenOf(item);
    if (when) {
      if (!g.firstSeen || String(when) < String(g.firstSeen)) g.firstSeen = when;
      if (!g.lastSeen || String(when) > String(g.lastSeen)) g.lastSeen = when;
    }
  }

  return Array.from(groups.values())
    .map((g) => {
      const count = g.reporters.size;
      const weight = SEVERITY_WEIGHT[g.severity] ?? SEVERITY_WEIGHT.normal;
      return {
        signature: g.signature,
        label: labelFor(g.bodies),
        area: g.area,
        count,
        reports: g.items.length,
        reporters: Array.from(g.reporters),
        severity: g.severity,
        severityLabel: (SEVERITY[g.severity] || SEVERITY.normal).label,
        suggestedAction: g.suggestedAction,
        score: weight * count,
        items: g.items,
        firstSeen: g.firstSeen,
        lastSeen: g.lastSeen,
      };
    })
    // Highest score first. Ties break on raw head-count, then on the label so
    // the order is stable run to run (a board that reshuffles itself is a board
    // nobody trusts).
    .sort((a, b) => b.score - a.score || b.count - a.count || a.label.localeCompare(b.label));
}

// summarizeClusters — the one line above the board: how much of the pile is
// actually repeats. `duplicateRate` is the share of reports that are the second
// or later voice on something already reported — the number that says how much
// answering-everyone-individually was costing.
export function summarizeClusters(clusters = []) {
  const list = clusters || [];
  const reports = list.reduce((n, c) => n + c.reports, 0);
  const distinct = list.length;
  const repeated = list.filter((c) => c.count > 1);
  return {
    total: reports,
    issues: distinct,
    repeatedIssues: repeated.length,
    duplicateRate: reports > 0 ? Math.round(((reports - distinct) / reports) * 100) : 0,
    topLabel: list.length ? list[0].label : '',
    topCount: list.length ? list[0].count : 0,
  };
}
