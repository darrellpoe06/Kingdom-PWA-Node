// =============================================================================
// giving-donor-match — propose WHO a Cash App name is; never decide it
// =============================================================================
// A Cash App statement's sender column holds a display name the SENDER chose.
// It is not a person in the church directory, and the distance between those
// two facts is where a church's giving records get quietly wrong. The finance
// steward's whole concern in the 2026-09-11 meeting was this and nothing else:
//
//   "we get thousands of dollars... so applying it to the right person."
//
// Applying a $500 gift to the wrong member is not a rounding error. It is one
// person's year-end statement understated and another's overstated, and it is
// found -- if it is found -- months later by the person it was taken from.
//
// SO THIS MODULE PROPOSES AND STOPS. Every result carries `needsReview: true`
// and `decided: false`, every proposed match names the BASIS it was proposed on
// in words a steward can check, and a tie is reported as a tie rather than
// resolved by tiebreak. That is the discipline call-to-give.js already set for
// a detected cue (propose with needsReview, let the office confirm) applied to
// the one field where a wrong guess costs a real person.
//
// WHAT MAKES IT WORTH THE STEWARD'S TIME ANYWAY: confirmations are remembered.
// Once the office says "Bobby J." is a given member, that decision is an alias
// and every future month resolves it with no work. The file does the tedious
// part and asks about the genuinely ambiguous part -- which shrinks every
// month instead of repeating forever.
//
// Deterministic and pure. Storage is INJECTED (the alias map is passed in),
// the same shape bank-formats.js uses for remembered layouts: no window, no
// network, no hidden state, so the same statement always produces the same
// questions.
// =============================================================================

/** How a proposal was arrived at. Shown to the steward, never hidden. */
export const BASIS = {
  ALIAS: 'confirmed-before',
  EXACT: 'exact-name',
  PREFERRED: 'preferred-name',
  SWAPPED: 'name-order-reversed',
  ALL_TOKENS: 'every-name-word-matches',
  LAST_PLUS_INITIAL: 'last-name-and-first-initial',
};

export const CONFIDENCE = { HIGH: 'high', MEDIUM: 'medium', LOW: 'low', NONE: 'none' };

// Scores are ordinal, not probabilities. They exist to order candidates and to
// separate "ask about this" from "this is settled"; inventing a percentage
// would dress a string comparison up as a measurement.
const SCORE = {
  [BASIS.ALIAS]: 100,
  [BASIS.EXACT]: 90,
  [BASIS.PREFERRED]: 80,
  [BASIS.SWAPPED]: 70,
  [BASIS.ALL_TOKENS]: 60,
  [BASIS.LAST_PLUS_INITIAL]: 40,
};

// Strip what a display name carries that a directory never does: a $cashtag,
// emoji and pictographs, quotes, trailing punctuation, doubled spaces. Case
// and accents are folded so "JOSE" and "José" meet.
export function normalizeName(raw) {
  let s = String(raw == null ? '' : raw);
  try { s = s.normalize('NFD').replace(/[̀-ͯ]/g, ''); } catch { /* older engine: skip folding */ }
  return s
    .replace(/\$[A-Za-z0-9_]+/g, ' ')          // a cashtag is a handle, not a name
    .replace(/[^\p{L}\p{N}\s'-]+/gu, ' ')       // emoji, punctuation, symbols
    .replace(/\b(jr|sr|ii|iii|iv|md|phd|rev|pastor|bishop|dr|mr|mrs|ms|min|elder|deacon)\b\.?/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

const tokensOf = (raw) => normalizeName(raw).split(' ').filter(Boolean);

/**
 * Every basis on which a statement name could be this parishioner, best first.
 * Returns null when none applies -- an absent match, never a weak one.
 */
export function matchBasis(statementName, parishioner) {
  const a = tokensOf(statementName);
  if (!a.length) return null;
  const display = tokensOf(parishioner && parishioner.displayName);
  const preferred = tokensOf(parishioner && parishioner.preferredName);

  const joined = (t) => t.join(' ');
  if (display.length && joined(a) === joined(display)) return BASIS.EXACT;
  if (preferred.length && joined(a) === joined(preferred)) return BASIS.PREFERRED;

  // A directory reads "Last, First" and a phone reads "First Last" -- the same
  // person, written the other way round.
  if (display.length > 1 && joined(a) === display.slice().reverse().join(' ')) return BASIS.SWAPPED;

  // "Mary Ann Coleman" on the statement, "Mary Coleman" in the directory: every
  // directory word is present, so it is very likely her and still a proposal.
  if (display.length > 1 && display.every((w) => a.includes(w))) return BASIS.ALL_TOKENS;
  if (preferred.length > 1 && preferred.every((w) => a.includes(w))) return BASIS.ALL_TOKENS;

  // "Bobby J." / "B Johnson" -- surname plus a first initial. The weakest basis
  // offered, and offered precisely because it is the shape people actually use.
  if (display.length > 1 && a.length > 1) {
    const lastA = a[a.length - 1];
    const lastD = display[display.length - 1];
    if (lastA === lastD && a[0][0] === display[0][0]) return BASIS.LAST_PLUS_INITIAL;
    // The mirror: initial last, surname first.
    if (a[0] === lastD && a[a.length - 1][0] === display[0][0]) return BASIS.LAST_PLUS_INITIAL;
  }
  return null;
}

function confidenceFor(basis, ambiguous) {
  if (!basis) return CONFIDENCE.NONE;
  if (ambiguous) return CONFIDENCE.LOW; // a tie is never confident, whatever the basis
  if (basis === BASIS.ALIAS || basis === BASIS.EXACT) return CONFIDENCE.HIGH;
  if (basis === BASIS.PREFERRED || basis === BASIS.SWAPPED || basis === BASIS.ALL_TOKENS) return CONFIDENCE.MEDIUM;
  return CONFIDENCE.LOW;
}

/**
 * Propose who each distinct statement name might be.
 *
 * @param {string[]} names  the raw sender names off the statement
 * @param {object[]} parishioners  [{ id, displayName, preferredName? }]
 * @param {object} [aliases]  a confirmed map: normalized name -> parishioner id.
 *   This is the remembered half; see confirmAlias/aliasesFromDecisions.
 * @returns {object[]} one proposal per DISTINCT name, in first-seen order:
 *   { raw, normalized, candidates: [{ parishionerId, displayName, basis, score }],
 *     best, confidence, ambiguous, needsReview, decided }
 */
export function proposeDonorMatches(names = [], parishioners = [], aliases = {}) {
  const seen = new Map();
  for (const raw of names || []) {
    const key = normalizeName(raw);
    if (!key) continue;                 // an empty sender name is its own problem
    if (!seen.has(key)) seen.set(key, String(raw == null ? '' : raw).trim());
  }

  const people = (parishioners || []).filter((p) => p && p.id);
  const byId = new Map(people.map((p) => [String(p.id), p]));
  const out = [];

  for (const [key, raw] of seen) {
    const candidates = [];

    // A confirmed alias outranks every heuristic -- a person already said so.
    const aliasId = aliases && Object.prototype.hasOwnProperty.call(aliases, key) ? String(aliases[key]) : null;
    if (aliasId && byId.has(aliasId)) {
      const p = byId.get(aliasId);
      candidates.push({ parishionerId: String(p.id), displayName: p.displayName || '', basis: BASIS.ALIAS, score: SCORE[BASIS.ALIAS] });
    }

    for (const p of people) {
      if (aliasId && String(p.id) === aliasId) continue; // already added, higher
      const basis = matchBasis(raw, p);
      if (basis) candidates.push({ parishionerId: String(p.id), displayName: p.displayName || '', basis, score: SCORE[basis] });
    }

    candidates.sort((x, y) => y.score - x.score
      || String(x.displayName).localeCompare(String(y.displayName))
      || String(x.parishionerId).localeCompare(String(y.parishionerId)));

    const best = candidates.length ? candidates[0] : null;
    // Two different people matched equally well. That is a question, not a
    // coin toss -- report it and let the office answer.
    const ambiguous = candidates.length > 1 && candidates[1].score === candidates[0].score;

    out.push({
      raw,
      normalized: key,
      candidates,
      best,
      confidence: confidenceFor(best && best.basis, ambiguous),
      ambiguous,
      // ALWAYS true, including for a confirmed alias and an exact name. The
      // office owns this decision; this file only ever hands it a shortlist.
      needsReview: true,
      decided: false,
    });
  }
  return out;
}

/**
 * Attach proposals to claims, so a batch can be reviewed as gifts rather than
 * as a name list. Never writes parishionerId -- it writes a PROPOSAL beside
 * the claim, which a person promotes.
 */
export function attachProposals(claims = [], proposals = []) {
  const byName = new Map((proposals || []).map((p) => [p.normalized, p]));
  return (claims || []).map((c) => {
    const p = byName.get(normalizeName(c.giverName));
    return {
      ...c,
      proposal: p || null,
      proposedParishionerId: p && p.best && !p.ambiguous ? p.best.parishionerId : null,
      confidence: p ? p.confidence : CONFIDENCE.NONE,
    };
  });
}

/**
 * Record a confirmation: this statement name IS this parishioner. Returns a NEW
 * alias map (never mutates), so the caller decides what to persist.
 */
export function confirmAlias(aliases = {}, statementName, parishionerId) {
  const key = normalizeName(statementName);
  if (!key || !parishionerId) return { ...(aliases || {}) };
  return { ...(aliases || {}), [key]: String(parishionerId) };
}

/** Drop a confirmation that turned out to be wrong. */
export function forgetAlias(aliases = {}, statementName) {
  const key = normalizeName(statementName);
  const next = { ...(aliases || {}) };
  delete next[key];
  return next;
}

/**
 * What the steward still has to answer -- the whole point of remembering.
 * `settled` shrinks every month; `toReview` is the real remaining work.
 */
export function reviewQueue(proposals = []) {
  const list = proposals || [];
  const settled = list.filter((p) => p.best && p.best.basis === BASIS.ALIAS && !p.ambiguous);
  const unmatched = list.filter((p) => !p.best);
  const toReview = list.filter((p) => p.best && (p.ambiguous || p.best.basis !== BASIS.ALIAS));
  return {
    names: list.length,
    settled: settled.length,
    toReview: toReview.length,
    unmatched: unmatched.length,
    ambiguous: list.filter((p) => p.ambiguous).length,
    queue: toReview.concat(unmatched),
  };
}

export default {
  normalizeName, matchBasis, proposeDonorMatches, attachProposals,
  confirmAlias, forgetAlias, reviewQueue, BASIS, CONFIDENCE,
};
