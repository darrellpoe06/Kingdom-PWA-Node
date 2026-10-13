// =============================================================================
// lesson-context — what a World-Issues lesson CAN do, and what it CANNOT,
//                  stated BEFORE the reader starts it
// =============================================================================
// THE GAP THIS CLOSES. Darrell, 2026-09-22, reading issue 17's Stage 3:
//
//   "We quote none of them verbatim from the recording... This is a gap in our
//    lessons... we need to be able to have full context before lessons....
//    opportunities and constraints?"
//
// He is right, and the gap was structural rather than an oversight in one
// lesson. Three things were true of every issue in the catalog:
//
//   1. THE LIMITS WERE BURIED IN PROSE. `source.note` is the only place a
//      lesson's provenance limits live. On issue 17 that note is ~2,400
//      characters of continuous prose, rendered as one small grey paragraph.
//      A limit a reader has to mine out of a paragraph is a limit that does not
//      reach him.
//   2. NOTHING COUNTED THE LESSON'S OWN SHAPE. How much of this is documented?
//      How much is disputed? How much is inference? Those numbers were sitting
//      in the arrays, exact and free, and were never told to anyone.
//
// ONE THING I FIRST GOT WRONG AND CHECKED. I was about to record here that
// `issue.skill` renders nowhere. It does render: buildDiscernmentModule maps it
// to `module.bigIdea` (discernment-track.js) and ChurchLearn draws that as "The
// big idea" above the stages. So this module returns `skill` for callers and
// tests, and the panel deliberately does NOT reprint it — the reader already
// has it, one heading up, and a duplicate would be noise on the very surface
// this exists to unclutter.
//
// SO: a measured "before you begin" — opportunities and constraints, each one
// traceable. This is DR-0076 applied to the lesson's self-description: the
// counts are COUNTED from the issue's own arrays, never estimated and never
// written by hand, so they cannot drift from the lesson they describe. The one
// thing a count cannot know — how the source was obtained, and what that costs
// the reader — is an AUTHORED field (`issue.limits`), and when a lesson has not
// stated it, this module SAYS SO rather than leaving the silence to read as
// "no limits" (DR-0076 §8: unknown never reads as fine).
//
// Pure. No React, no DOM, no I/O.
// =============================================================================

const arr = (v) => (Array.isArray(v) ? v : []);
const str = (v) => (typeof v === 'string' ? v.trim() : '');

// Human-readable plural, because "1 facts" is the kind of small lie that makes
// a reader trust the big numbers less.
function n(count, one, many) {
  return `${count} ${count === 1 ? one : many}`;
}

/**
 * countShape — the lesson's own dimensions, measured from its arrays.
 * Every field here is a COUNT of real entries. Nothing is authored, nothing is
 * estimated, and none of it can disagree with the lesson it came from.
 */
export function countShape(issue) {
  const i = issue && typeof issue === 'object' ? issue : {};
  const verifiable = arr(i.verifiable);
  const sources = verifiable.flatMap((v) => arr(v.sources));
  const levels = i.levels && typeof i.levels === 'object' ? Object.keys(i.levels) : [];
  const quiz = i.quiz && typeof i.quiz === 'object' ? i.quiz : null;
  const quizQuestions = quiz ? arr(quiz.questions).length : 0;

  return {
    claims: arr(i.claims).length,
    verifiable: verifiable.length,
    documented: verifiable.filter((v) => v.status === 'documented').length,
    partlyDocumented: verifiable.filter((v) => v.status === 'partly-documented').length,
    disputed: verifiable.filter((v) => v.status === 'disputed').length,
    interpretation: arr(i.interpretation).length,
    perspectives: arr(i.perspectives).length,
    sources: sources.length,
    sourcesLinked: sources.filter((s) => str(s.url)).length,
    sourcesUnlinked: sources.filter((s) => !str(s.url)).length,
    levels: levels.length,
    levelNames: levels,
    prompts: arr(i.reflection?.prompts).length,
    benefits: arr(i.lens?.benefits).length,
    quizQuestions,
    authoredLimits: arr(i.limits).length,
  };
}

/**
 * lessonContext — the "before you begin" block.
 *
 * Returns { skill, counts, opportunities[], constraints[] } where each entry is
 *   { id, text, basis }
 * and `basis` names WHERE the line came from, which is the whole point:
 *   'counted'    — computed from the issue's arrays this run
 *   'authored'   — written by the lesson's author (issue.skill, issue.limits)
 *   'structural' — true of every lesson of this class by construction
 *
 * A reader never sees `basis`. A test does, and so does anyone auditing whether
 * this panel is describing the lesson or flattering it.
 */
export function lessonContext(issue) {
  const i = issue && typeof issue === 'object' ? issue : {};
  const c = countShape(i);
  const opportunities = [];
  const constraints = [];

  // ---- OPPORTUNITIES -------------------------------------------------------
  const skill = str(i.skill);

  if (c.documented > 0) {
    const linked = c.sourcesLinked > 0
      ? `, carrying ${n(c.sourcesLinked, 'dated source you can open yourself', 'dated sources you can open yourself')}`
      : '';
    opportunities.push({
      id: 'opp-documented',
      basis: 'counted',
      text: `${n(c.documented, 'fact is', 'facts are')} stated as DOCUMENTED${linked}. You are not asked to take them on our word.`,
    });
  }
  if (c.interpretation > 0) {
    opportunities.push({
      id: 'opp-separation',
      basis: 'counted',
      text: `${n(c.interpretation, 'statement is', 'statements are')} marked as INFERENCE and kept in a separate list, so you can tell reasoning from fact at a glance instead of having to untangle them.`,
    });
  }
  if (c.perspectives > 0) {
    opportunities.push({
      id: 'opp-perspectives',
      basis: 'counted',
      text: `${n(c.perspectives, 'perspective is', 'perspectives are')} written at their strongest BEFORE any of them is weighed — including the ones this house disagrees with.`,
    });
  }
  if (str(i.lens?.fourD?.deepSource) || str(i.lens?.fourD?.scripture)) {
    opportunities.push({
      id: 'opp-word-first',
      basis: 'structural',
      text: 'The Word is read FIRST and is not asked to wait for the evidence. What Yahweh said about this stands whether or not the reporting holds up.',
    });
  }
  if (c.levels > 1) {
    opportunities.push({
      id: 'opp-levels',
      basis: 'counted',
      text: `Written at ${n(c.levels, 'reading level', 'reading levels')} (${c.levelNames.join(', ')}), so the same lesson can be taken by a child and by a seasoned believer.`,
    });
  }
  if (c.quizQuestions > 0) {
    opportunities.push({
      id: 'opp-quiz',
      basis: 'counted',
      text: `${n(c.quizQuestions, 'check question', 'check questions')} at the end, so you can find out whether it landed rather than assume it did.`,
    });
  }

  // ---- CONSTRAINTS ---------------------------------------------------------
  // The counted ones first, because they are exact.
  const unsettled = c.disputed + c.partlyDocumented;
  if (unsettled > 0) {
    const parts = [];
    if (c.disputed > 0) parts.push(n(c.disputed, 'is DISPUTED', 'are DISPUTED'));
    if (c.partlyDocumented > 0) parts.push(n(c.partlyDocumented, 'is PARTLY DOCUMENTED', 'are PARTLY DOCUMENTED'));
    constraints.push({
      id: 'con-unsettled',
      basis: 'counted',
      text: `Of ${n(c.verifiable, 'item', 'items')} in the evidence list, ${parts.join(' and ')}. This lesson does not settle those, and it will not pretend to.`,
    });
  }
  if (c.interpretation > 0) {
    constraints.push({
      id: 'con-inference',
      basis: 'counted',
      text: `${n(c.interpretation, 'statement is', 'statements are')} inference rather than fact. Every one of them could be wrong without a single documented fact being wrong.`,
    });
  }
  if (c.sourcesUnlinked > 0) {
    constraints.push({
      id: 'con-unlinked',
      basis: 'counted',
      text: `${n(c.sourcesUnlinked, 'source is', 'sources are')} named but not linked, so you cannot open ${c.sourcesUnlinked === 1 ? 'it' : 'them'} from this page — you would have to go and find ${c.sourcesUnlinked === 1 ? 'it' : 'them'}.`,
    });
  }
  if (i.subject?.isNamedRealPerson) {
    constraints.push({
      id: 'con-not-a-verdict',
      basis: 'structural',
      text: 'This names living people. It weighs what was said and done; it is not a verdict on anyone, and nothing here judges a soul.',
    });
  }

  // Then the authored ones — how the source was obtained, and what that costs.
  // A count cannot know this, so it is never guessed.
  const authored = arr(i.limits).filter((l) => str(l?.text) || str(l));
  authored.forEach((l, idx) => {
    constraints.push({
      id: str(l?.id) || `con-authored-${idx}`,
      basis: 'authored',
      text: str(l?.text) || str(l),
    });
  });
  if (authored.length === 0) {
    // The silence is reported rather than left to read as "there are none".
    constraints.push({
      id: 'con-limits-unstated',
      basis: 'structural',
      text: 'This lesson has not stated its source limits separately yet — how the source was obtained, and what that does and does not let us say, is only in the provenance note above. Read that note before you lean on anything here.',
    });
  }

  return { skill, counts: c, opportunities, constraints };
}

export default lessonContext;
