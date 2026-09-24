// =============================================================================
// worked-case — one actual claim, processed with the data (DR-0601).
// =============================================================================
// Darrell 2026-09-24: "we need more substance and clarity by showing
// historical experiences, events and situations that had risk, opportunities
// and constraints etc... economics of each for students to See How" — and
// "Humans behave behind closed doors and now in the light of day... the
// biblical scriptures also explain the same thing about us human beings."
// The gate lives in history-course.js (historyWorkedCaseFaults); this file is
// the one flat rendering of a case for read-aloud, share and print.
// =============================================================================

/** The case as one plain text: the same words the screen shows, in order. */
export function workedCaseText(c) {
  if (!c || typeof c !== 'object') return '';
  const out = [];
  if (c.claim) out.push(`The claim: “${c.claim.words}” — ${c.claim.by}.${c.claim.source?.title ? ` (${c.claim.source.title})` : ''}`);
  if (c.event) out.push(`The event, ${c.event.year}: ${c.event.what}`);
  if (c.closedDoors) {
    out.push(`Behind closed doors: ${c.closedDoors.hidden}`);
    out.push(`In the light of day: ${c.closedDoors.light}`);
    if (c.closedDoors.verse) out.push(`The Word on it: ${c.closedDoors.verse}`);
    if (c.closedDoors.heart) out.push(`Why we do it: ${c.closedDoors.heart}`);
  }
  if (c.risk) out.push(`Risk: ${c.risk}`);
  if (c.opportunity) out.push(`Opportunity: ${c.opportunity}`);
  if (c.constraint) out.push(`Constraint: ${c.constraint}`);
  for (const e of Array.isArray(c.economics) ? c.economics : []) out.push(`${e.figure} — ${e.meaning} (Record: ${e.record})`);
  (Array.isArray(c.steps) ? c.steps : []).forEach((s, i) => out.push(`${i + 1}. ${s}`));
  if (c.settled) out.push(`Settled: ${c.settled}`);
  if (c.stillOpen) out.push(`Still open: ${c.stillOpen}`);
  return out.join('\n');
}
