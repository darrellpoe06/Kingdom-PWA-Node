// =============================================================================
// anchor-principles — single source of truth for the foundational WHY records
// =============================================================================
// Binding principles declared by Darrell: the purpose statements that explain
// WHY a domain of work exists, beyond what any ticket or board status shows.
// These are stored once here and consumed by help-content.js (DEPTH on demand)
// and ariSystemPrompt (so Ari answers from the actual declared purpose, not
// from training-data guesses). They are NOT surfaced as walls of text on the
// main surface — the blurb on each board card is the light presence; tapping
// "?" reveals the full anchor.
//
// Shape per entry:
//   id        : stable slug, matches boardSlugs where applicable
//   title     : short plain title for the anchor
//   oneliner  : one sentence for the help entry's `why` field (light presence)
//   verbatim  : the exact statement as Darrell declared it
//   author    : who declared it
//   date      : ISO date declared
//   purposes  : the bound sub-purposes (label + body each)
//   boardSlugs: which board(s) this anchors
//   scripture : optional grounding verse (ESV, cited per SCRIPTURE-REFERENCE-STANDARD)
//   section   : which app section this lives in
// =============================================================================

export const ANCHOR_PRINCIPLES = Object.freeze({
  'anchor-aggregator-life-corpus': {
    id: 'anchor-aggregator-life-corpus',
    title: 'Why: data aggregation, life corpus, and multi-generational stewardship',
    oneliner:
      'We aggregate life data to deepen relationships, raise up the next generation of stewards, and build the multi-generational foundation Yahweh intends.',
    verbatim:
      'We will use the following types of situations to improve the quality of our relationship with each other and not need to be on anything else from the technology stack — helping to teach my children to take over my businesses, and with legal protection and education and documentation foundation on technology and family operating systems, for multi-generational wellness purposes as Yahweh desires.',
    author: 'Darrell',
    date: '2026-07-03',
    purposes: Object.freeze([
      {
        id: 'relationship-quality',
        label: 'Relationship quality first',
        body: 'Every dataset, every adapter, every captured moment serves the people — not the platform. We capture life to make the relationships richer, not to make the system more impressive.',
      },
      {
        id: 'platform-sovereignty',
        label: 'Platform sovereignty — not needing to be on anything else',
        body: 'We build so the family does not need to be on anything else from the technology stack. The platform is sovereign: owned data, owned infrastructure, owned narrative. Nothing extracted, nothing sold.',
      },
      {
        id: 'succession',
        label: 'Succession — teaching the children to take over the businesses',
        body: "The life corpus, the business records, the documented systems: all of it is curriculum. Darrell's children inherit not just assets but the context, the operating knowledge, and the guardianship of what was built. A next-generation steward view is not a nice-to-have; it is the purpose.",
      },
      {
        id: 'legal-foundation',
        label: 'Foundation of legal protection, education, and documentation',
        body: 'Documentation of technology and family operating systems is legal infrastructure. The records protect the family in disputes, in succession, in tax, in estate. Education baked into the platform means the next generation is not starting from zero.',
      },
      {
        id: 'multigenerational-wellness',
        label: 'Multi-generational wellness as Yahweh desires',
        body: 'The north star is not a KPI. It is multi-generational wellness — financial, relational, spiritual, physical, educational — as Yahweh desires for this family. Every surface, every adapter, every record is evaluated against this: does it make the next generation more whole?',
      },
    ]),
    boardSlugs: ['board-aggregator-harvest'],
    scripture:
      'Proverbs 13:22 (ESV) — "A good man leaves an inheritance to his children\'s children."',
    section: 'business',
  },
});

/**
 * Look up an anchor principle by its id.
 * @param {string} id
 * @returns {object|null}
 */
export function anchorFor(id) {
  return ANCHOR_PRINCIPLES[id] ?? null;
}

/**
 * Find the anchor principle (if any) that governs a given board slug.
 * @param {string} boardSlug
 * @returns {object|null}
 */
export function anchorForBoard(boardSlug) {
  return (
    Object.values(ANCHOR_PRINCIPLES).find(
      (p) => Array.isArray(p.boardSlugs) && p.boardSlugs.includes(boardSlug)
    ) ?? null
  );
}

/**
 * Build a compact context block for Ari's system prompt. Omit when irrelevant.
 * @param {string} principleId
 * @returns {string}
 */
export function ariAnchorContext(principleId) {
  const p = anchorFor(principleId);
  if (!p) return '';
  const purposeLines = p.purposes
    .map((pu, i) => `  ${i + 1}. ${pu.label}: ${pu.body}`)
    .join('\n');
  return [
    `ANCHOR PRINCIPLE — ${p.title}`,
    `Declared by ${p.author} on ${p.date}.`,
    `Verbatim: "${p.verbatim}"`,
    `The five bound purposes:`,
    purposeLines,
    p.scripture ? `Scripture anchor: ${p.scripture}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

export const ANCHOR_PRINCIPLES_LIST = Object.values(ANCHOR_PRINCIPLES);
