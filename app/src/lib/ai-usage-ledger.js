// =============================================================================
// ai-usage-ledger — what the AI cost, per task, and what the same work would
// have cost without it (DR-1347, DR-1330 D8)
// =============================================================================
// The slide's project-results table (task · credits · cost · weeks without AI
// · time with AI), kept honest: wall clock from commit timestamps, tokens and
// dollars only where a meter exists (null and SAID otherwise), the estimate
// without AI labelled an estimate. This module binds the committed file; the
// rules live in ai-usage-ledger-rules.js so the CLI guard shares them.
import LEDGER from './ai-usage-ledger.json';
import { validateLedger as validate, ledgeredDrs as covered, rollup as roll } from './ai-usage-ledger-rules.js';

export { FIRST_LEDGERED_DR, validateEntry } from './ai-usage-ledger-rules.js';
export function loadAiUsageLedger() {
  return LEDGER;
}
export function validateLedger(ledger = LEDGER) {
  return validate(ledger);
}
export function ledgeredDrs(ledger = LEDGER) {
  return covered(ledger);
}
export function rollup(ledger = LEDGER) {
  return roll(ledger);
}
