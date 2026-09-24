// Label layer for the unit of curriculum. The four weekly cohort courses set no
// `meta.unit`, so this returns the original "week"/"Week"/"weeks" wording and the
// cohort framing — byte-for-byte unchanged. A self-paced lesson series (Living
// Lessons) sets meta.unit to relabel rows as "Lesson(s)" and drop the cohort clock.
// Lifted out of ChurchLearn.jsx (DR-0623) so the Continue offers name a lesson
// exactly as its course does, from ONE definition.
export function unitLabels(meta) {
  const u = (meta && meta.unit) || {};
  return {
    noun: u.noun || 'week',          // "this {noun}"
    plural: u.nounPlural || 'weeks',  // "The N {plural}"
    cap: u.cap || 'Week',             // "{cap} N · title"
    selfPaced: !!u.selfPaced,
    sessionLabel: u.sessionLabel || 'How to run the 75 minutes',
  };
}
