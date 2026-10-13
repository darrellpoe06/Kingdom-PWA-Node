// =============================================================================
// purpose — what PoeTech designs, in the Governor's declared words (DR-0607)
// =============================================================================
// Darrell, 2026-09-24: "PoeTech App should be Designing repeatable governance
// systems that help organizations recognize patterns, surface risks, and make
// better decisions without depending on one person's institutional knowledge."
//
// This is the ONE place that sentence lives in the app. The About page's
// Mission section and the OpsBoard (the governance surface) read it from here;
// no component hardcodes it, so the words on every surface are the words in
// the decision record, and the pin in repeatable-governance-purpose.test.jsx
// holds the three together (lib, record, surface).
//
// The Word behind it, fetched verbatim from the in-repo KJV: counsel that does
// not rest on one head, and a record written so that others can run on it.
// "Where no counsel is, the people fall: but in the multitude of counsellors
// there is safety" (Proverbs 11:14). "Write the vision, and make it plain upon
// tables, that he may run that readeth it" (Habakkuk 2:2). "woe to him that is
// alone when he falleth; for he hath not another to help him up"
// (Ecclesiastes 4:10).
// =============================================================================

export const REPEATABLE_GOVERNANCE = Object.freeze({
  id: 'repeatable-governance',
  // The declared purpose, rendered for meaning from his words (DR-0331) and
  // spoken in our voice: PoeTech is the subject, present tense.
  statement:
    'PoeTech designs repeatable governance systems that help organizations recognize patterns, surface risks, and make better decisions without depending on one person’s institutional knowledge.',
  // The three verbs, so a surface can show the purpose as a checklist of what
  // any governance surface in the app must do.
  verbs: Object.freeze([
    { key: 'patterns', does: 'recognize patterns' },
    { key: 'risks', does: 'surface risks' },
    { key: 'decisions', does: 'make better decisions' },
  ]),
  // The condition every one of them carries.
  without: 'without depending on one person’s institutional knowledge',
  declaredOn: '2026-09-24',
  declaredBy: 'Darrell',
  record: 'DR-0607',
  // Verbatim KJV; referenced, never paraphrased (DR-0076 / SCRIPTURE-REFERENCE-STANDARD).
  word: Object.freeze([
    { ref: 'Proverbs 11:14', text: 'Where no counsel is, the people fall: but in the multitude of counsellors there is safety.' },
    { ref: 'Habakkuk 2:2', text: 'And the LORD answered me, and said, Write the vision, and make it plain upon tables, that he may run that readeth it.' },
    { ref: 'Ecclesiastes 4:10', text: 'For if they fall, the one will lift up his fellow: but woe to him that is alone when he falleth; for he hath not another to help him up.' },
  ]),
});

/** The purpose as one line for a header or a caption. */
export function purposeLine() {
  return REPEATABLE_GOVERNANCE.statement;
}
