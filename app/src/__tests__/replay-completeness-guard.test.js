// @vitest-environment node
//
// replay-completeness-guard — PROVEN-TO-CATCH (DR-0076 §3) for the 2026-09-06
// sovereign-replay inversion (DR-0331).
//
// The defect: success was decided by comparing a ledger COUNT to a file COUNT.
// Renaming an already-applied migration leaves a stale ledger row, so the
// counts diverge and the lane reports "the app's database is BEHIND the repo"
// about a database that is completely up to date. A count can be wrong in both
// directions; the question it stands in for cannot.
//
// The first block below feeds the guard the REAL line as it stood in the repo
// and requires the finding — that is what makes this a witness rather than a
// green tick.
import { describe, it, expect } from 'vitest';
import { findings, guard, stripShellComments } from '../../../scripts/replay-completeness-guard.mjs';

// The success condition exactly as it was before the fix.
const DEFECTIVE = `
TOTAL=$(( $(ls "$MIG_DIR"/*.sql 2>/dev/null | wc -l | tr -d ' ') + 1 ))
DONE_NOW=$(PSQL -t -A -c "SELECT count(*) FROM public._sovereign_replay;" | tr -d ' ')
echo "replay: applied $APPLIED this run, ledger $DONE_NOW/$TOTAL, frontier: $FRONTIER"
[ "$DONE_NOW" = "$TOTAL" ] && exit 0
exit 1
`;

describe('replay completeness guard', () => {
  it('CATCHES the real pre-fix success condition', () => {
    const found = findings(DEFECTIVE).map((f) => f.rule);
    expect(found).toContain('count-equality-success');
    expect(found).toContain('no-per-file-completeness-check');
  });

  it('CATCHES the -eq spelling and a renamed counter variable', () => {
    expect(findings('[ "$LEDGER_ROWS" -eq "$EXPECTED_TOTAL" ] && exit 0').map((f) => f.rule))
      .toContain('count-equality-success');
  });

  it('CATCHES a rewrite that drops the count but still never checks per file', () => {
    const vacuous = 'echo "replay done"\nexit 0\n';
    expect(findings(vacuous).map((f) => f.rule)).toContain('no-per-file-completeness-check');
  });

  it('does NOT flag the defective line when it appears only in a COMMENT', () => {
    // The fixed script quotes the old condition in its own explanation, so the
    // next reader understands what was wrong. Prose must not read as code.
    const commented = `
# This used to be \`[ "$DONE_NOW" = "$TOTAL" ]\`, which is a proxy.
for F in $(ls "$MIG_DIR"/*.sql | sort); do
  IN=$(PSQL -t -A -c "SELECT 1 FROM public._sovereign_replay WHERE fname='$B';")
  if [ "$IN" != "1" ]; then MISSING=$((MISSING + 1)); fi
done
`;
    expect(findings(commented)).toEqual([]);
    expect(stripShellComments('# a\nreal\n')).toBe('\nreal\n');
  });

  it('the REAL script passes — success is decided per file', () => {
    expect(guard()).toEqual([]);
  });
});
