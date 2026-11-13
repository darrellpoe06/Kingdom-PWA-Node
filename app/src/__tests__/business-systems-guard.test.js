// =============================================================================
// business-systems-guard.test — the completion gate is proven to CATCH (DR-0076 §3)
// =============================================================================
// Each check is fed the exact break class it exists to stop and must FAIL it;
// then the real repo scan must pass (the gate is green because reality is,
// never because the gate is theater).
import { describe, it, expect } from 'vitest';
import {
  drIdsOnDisk, drLedgerFindings, containmentFindings,
  N8N_ALLOWLIST, VENDOR_FORM_ALLOWLIST, scanRepo, allFindings,
} from '../../../scripts/business-systems-guard.mjs';
import { DERIVED_POINTER } from '../../../scripts/lib/decision-pointer.mjs';

describe('business-systems-guard — decisions-ledger integrity', () => {
  // The pointer is derived, never typed (DR-1477): one fixed sentence.
  const INDEX_OK = `| [DR-0233](x.md) | row |\n| [DR-0234](y.md) | row |\n\n${DERIVED_POINTER}`;

  it('parses DR ids from disk file names', () => {
    expect(drIdsOnDisk(['DR-0050-a.md', 'DR-0234-b.md', 'INDEX.md', 'README.md'])).toEqual([50, 234]);
  });

  it('CATCHES a decision file with no INDEX row (the DR-0234 recurrence, 2026-07-25)', () => {
    const findings = drLedgerFindings({ indexText: `| [DR-0233](x.md) |\n\n${DERIVED_POINTER}`, diskIds: [233, 234] });
    expect(findings.some((f) => f.includes('no row for DR-0234'))).toBe(true);
  });

  // The stale-pointer class (2026-07-23, again by 07-25) cannot recur: there is
  // no number in the line to go stale. What CAN recur is a branch typing one
  // back in, which is the line every record-adding branch used to conflict on.
  it('PROVEN TO CATCH: a branch typing a number back into the pointer (DR-1477)', () => {
    const typed = INDEX_OK.replace(DERIVED_POINTER, '**Next ID:** DR-0235. (DR-0234 = y.)');
    const findings = drLedgerFindings({ indexText: typed, diskIds: [233, 234] });
    expect(findings.some((f) => f.includes('derived, never typed'))).toBe(true);
    expect(drLedgerFindings({ indexText: INDEX_OK.replace(DERIVED_POINTER, ''), diskIds: [233, 234] }).some((f) => f.includes('missing its pointer'))).toBe(true);
    expect(drLedgerFindings({ indexText: `${INDEX_OK}\n${DERIVED_POINTER}`, diskIds: [233, 234] }).some((f) => f.includes('exactly one pointer'))).toBe(true);
  });

  it('passes a whole ledger', () => {
    expect(drLedgerFindings({ indexText: INDEX_OK, diskIds: [233, 234] })).toEqual([]);
  });

  it('ignores the documented pre-file numbering era (DR-0017..0049 have no files)', () => {
    // ids under the DR_FILE_FLOOR never demand rows; the floor-and-above id does.
    expect(drLedgerFindings({ indexText: `| [DR-0050](z.md) | row |\n\n${DERIVED_POINTER}`, diskIds: [17, 49, 50] })).toEqual([]);
  });
});

describe('business-systems-guard — retired-transport / vendor-endpoint containment', () => {
  it('CATCHES a NEW file reaching for the retired n8n transport', () => {
    const findings = containmentFindings({
      label: 'retired n8n transport',
      files: [...N8N_ALLOWLIST, 'app/src/lib/brand-new-feature.js'],
      allowlist: N8N_ALLOWLIST,
    });
    expect(findings).toHaveLength(1);
    expect(findings[0]).toContain('brand-new-feature.js');
  });

  it('CATCHES a NEW vendor form endpoint', () => {
    const findings = containmentFindings({
      label: 'vendor form endpoint',
      files: [...VENDOR_FORM_ALLOWLIST, 'app/src/components/NewLead.jsx'],
      allowlist: VENDOR_FORM_ALLOWLIST,
    });
    expect(findings).toHaveLength(1);
  });

  it('passes the pinned legacy sets unchanged', () => {
    expect(containmentFindings({ label: 'x', files: N8N_ALLOWLIST, allowlist: N8N_ALLOWLIST })).toEqual([]);
  });
});

describe('business-systems-guard — the REAL repo passes', () => {
  it('current reality is green (ledger whole, retired transports contained)', () => {
    const findings = allFindings(scanRepo());
    expect(findings).toEqual([]);
  });
});
