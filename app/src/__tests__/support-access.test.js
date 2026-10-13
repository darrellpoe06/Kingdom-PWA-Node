// Tests for the Governed Support Door client helpers (DR-0223). The pure guards
// here MIRROR the 0114 server allowlist/capability rules — if they drift, the UI
// would offer a grant the RPC rejects (or hide a valid one). PHI is never offered.
import { describe, it, expect } from 'vitest';
import { SUPPORTABLE_TYPES, isSupportableType, canReceiveBreakglass, BREAKGLASS_ROLES } from '../lib/support-access.js';

describe('isSupportableType — mirrors the 0114 PHI-exclusion allowlist', () => {
  it('accepts the operational, non-PHI types', () => {
    for (const t of SUPPORTABLE_TYPES) expect(isSupportableType(t)).toBe(true);
    expect(isSupportableType('TRANSACTION')).toBe(true); // case-insensitive
  });
  it('rejects clinical/PHI and anything unknown (fail closed)', () => {
    for (const t of ['confession', 'tlc_session', 'phi', 'clinical_note', 'secret', '', null, undefined]) {
      expect(isSupportableType(t)).toBe(false);
    }
  });
});

describe('canReceiveBreakglass — only capability-holding roles', () => {
  it('owner and specialist can receive; nobody else', () => {
    expect(BREAKGLASS_ROLES).toEqual(['owner', 'specialist']);
    expect(canReceiveBreakglass('owner')).toBe(true);
    expect(canReceiveBreakglass('specialist')).toBe(true);
    for (const r of ['admin', 'member', 'viewer', 'child', 'assistant', '', null]) {
      expect(canReceiveBreakglass(r)).toBe(false);
    }
  });
});
