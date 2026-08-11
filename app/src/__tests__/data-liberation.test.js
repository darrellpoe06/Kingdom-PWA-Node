// =============================================================================
// data-liberation.test.js — PROVEN-TO-CATCH tests for GET YOUR DATA BACK
// (Darrell 2026-08-11: "I would like PoeTech App to have this ability for our
// users... getting their data from Google Amazon photo... all of the vendors").
//
// The tests that matter are the ones guarding the delete gate. Everything else
// in this module is a guide; canDelete() is the part that, if wrong, loses a
// family's photographs. So it is tested for what it REFUSES, not what it allows.
//
// The central defect being guarded is the PARTIAL EXPORT, read off Darrell's own
// real mail: 2019-02-10 "unable to export your archive to Box due to an internal
// error" and 2021-12-16 "we were unable to create a copy of all your files". A
// partial archive is BYTE-PERFECT — every byte that arrived is intact — so an
// integrity check alone passes it and the user deletes the originals. Integrity
// is not completeness.
// =============================================================================
import { describe, it, expect } from 'vitest';
import {
  VENDORS, STAGE, STAGE_ORDER, stageIndex, getVendor, vendorsByGroup,
  canDelete, nextStep, summarize,
} from '../lib/data-liberation.js';

describe('the delete gate — it must say NO by default', () => {
  it('refuses on undefined, null and junk rather than throwing or allowing', () => {
    for (const bad of [undefined, null, 'yes', 42, []]) {
      const gate = canDelete(bad);
      expect(gate.allowed).toBe(false);
      expect(gate.reasons.length).toBeGreaterThan(0);
    }
  });

  it('refuses an empty progress object (nothing done yet)', () => {
    expect(canDelete({}).allowed).toBe(false);
  });

  it('THE PARTIAL-EXPORT TRAP: refuses a byte-perfect copy whose count was never checked', () => {
    // This is the exact shape of the disaster: the archive verified intact,
    // the user feels safe, and half the library was never in the export.
    const gate = canDelete({
      stage: STAGE.VERIFIED,
      bytesVerified: true,
      completenessConfirmed: false,
    });
    expect(gate.allowed).toBe(false);
    expect(gate.reasons.join(' ')).toMatch(/partial export/i);
  });

  it('refuses a counted copy whose bytes were never verified', () => {
    const gate = canDelete({
      stage: STAGE.VERIFIED,
      bytesVerified: false,
      completenessConfirmed: true,
    });
    expect(gate.allowed).toBe(false);
    expect(gate.reasons.join(' ')).toMatch(/byte-integrity/i);
  });

  it('refuses when both proofs are present but the stage has not reached verified', () => {
    const gate = canDelete({
      stage: STAGE.LANDED,
      bytesVerified: true,
      completenessConfirmed: true,
    });
    expect(gate.allowed).toBe(false);
  });

  it('refuses truthy-but-not-true values (a string never counts as proof)', () => {
    const gate = canDelete({
      stage: STAGE.VERIFIED,
      bytesVerified: 'yes',
      completenessConfirmed: 1,
    });
    expect(gate.allowed).toBe(false);
  });

  it('ALLOWS only when verified AND bytes intact AND count confirmed', () => {
    const gate = canDelete({
      stage: STAGE.VERIFIED,
      bytesVerified: true,
      completenessConfirmed: true,
    });
    expect(gate.allowed).toBe(true);
    expect(gate.reasons).toEqual([]);
  });
});

describe('every vendor carries what the user needs to act and to check', () => {
  it('has a request URL, settings, the completeness check, and a named gotcha', () => {
    for (const v of VENDORS) {
      expect(v.id, `${v.name} id`).toBeTruthy();
      expect(v.requestUrl, `${v.name} requestUrl`).toMatch(/^https:\/\//);
      expect(v.manageUrl, `${v.name} manageUrl`).toMatch(/^https:\/\//);
      expect(v.settings.length, `${v.name} settings`).toBeGreaterThan(0);
      expect(v.gotcha, `${v.name} gotcha`).toBeTruthy();
      expect(v.completenessCheck, `${v.name} completenessCheck`).toBeTruthy();
      expect(v.completenessCheck.where, `${v.name} check.where`).toBeTruthy();
      expect(v.completenessCheck.compare, `${v.name} check.compare`).toBeTruthy();
      expect(v.completenessCheck.against, `${v.name} check.against`).toBeTruthy();
    }
  });

  it('is honest about provenance: a vendor is EITHER verified-with-evidence OR flagged confirm-on-page (DR-0076)', () => {
    for (const v of VENDORS) {
      const isVerified = Boolean(v.verified && typeof v.verified.how === 'string' && v.verified.how.length > 20);
      const isFlagged = v.confirmOnPage === true;
      expect(isVerified || isFlagged, `${v.name} must be verified with evidence or flagged confirmOnPage`).toBe(true);
      // Never both — that would be claiming and disclaiming the same fact.
      expect(isVerified && isFlagged, `${v.name} cannot be both verified and confirmOnPage`).toBe(false);
    }
  });

  it('never states an expiry number it did not verify', () => {
    for (const v of VENDORS) {
      if (typeof v.expiryDays === 'number') {
        expect(v.verified, `${v.name} states expiryDays=${v.expiryDays} so it must carry evidence`).toBeTruthy();
        expect(v.verified.at).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    }
  });

  it('carries the Google facts read off the real account on 2026-08-11', () => {
    const photos = getVendor('google-photos');
    expect(photos.expiryDays).toBe(7);
    expect(photos.verified.at).toBe('2026-08-11');
    // The date defect is the reason a plain unzip is worthless, so it must be
    // stated — but in words a first-timer can read. The technical wording moved
    // to gotchaTechnical (expert view only) when Darrell set the audience:
    // "kids elderly and all ages... even experts".
    expect(photos.gotcha).toMatch(/taken today instead of the day you took it/i);
    expect(photos.gotchaTechnical).toMatch(/sidecar/i);
    expect(photos.gotchaTechnical).toMatch(/photoTakenTime/);
    // Over-quota users must not be sent down the Drive delivery path.
    expect(photos.warnings.join(' ')).toMatch(/Add to Drive/);
  });

  it('carries the Ring 30-day window from the real Ring mail', () => {
    const ring = getVendor('ring');
    expect(ring.expiryDays).toBe(30);
    expect(ring.verified.how).toMatch(/30 days/);
  });

  it('keeps JARGON out of every user-facing gotcha (elderly, kids, all ages)', () => {
    const jargon = [/\bsidecar\b/i, /\bmbox\b/i, /\bsha256\b/i, /\bmtime\b/i, /\bJSONL\b/i, /\bphotoTakenTime\b/];
    for (const v of VENDORS) {
      for (const j of jargon) {
        expect(v.gotcha, `${v.name} gotcha must stay plain (${j})`).not.toMatch(j);
      }
    }
  });

  it('covers the vendors Darrell named plus the rest of the common set', () => {
    const ids = VENDORS.map((v) => v.id);
    expect(ids).toContain('google-photos');
    expect(ids).toContain('amazon-photos');
    expect(VENDORS.length).toBeGreaterThanOrEqual(8);
  });

  it('groups vendors so the Google ones travel together', () => {
    const groups = vendorsByGroup();
    expect(groups.get('Google').length).toBeGreaterThanOrEqual(3);
    expect(groups.get('Amazon').map((v) => v.id)).toContain('amazon-photos');
  });
});

describe('nextStep — always names a real action, never dead-ends', () => {
  it('returns an action for every stage, including unknown ones', () => {
    for (const stage of [...STAGE_ORDER, 'nonsense-stage', undefined]) {
      const step = nextStep('google-photos', { stage });
      expect(step, `stage ${stage}`).toBeTruthy();
      expect(step.action.length, `stage ${stage} action`).toBeGreaterThan(0);
      expect(step.detail.length, `stage ${stage} detail`).toBeGreaterThan(0);
    }
  });

  it('returns null for a vendor that does not exist rather than inventing one', () => {
    expect(nextStep('not-a-vendor', { stage: STAGE.READY })).toBe(null);
  });

  it('at READY it names the expiry, because that is what loses the data', () => {
    const step = nextStep('google-photos', { stage: STAGE.READY });
    expect(step.detail).toMatch(/expires/i);
    expect(step.detail).toMatch(/7 days/);
  });

  it('at VERIFIED-but-unproven it steers to finishing verification, NOT to deleting', () => {
    const step = nextStep('google-photos', {
      stage: STAGE.VERIFIED, bytesVerified: true, completenessConfirmed: false,
    });
    expect(step.action).toMatch(/finish verifying/i);
    expect(step.action).not.toMatch(/safe/i);
  });

  it('only says "safe to free the space" when the gate actually allows it', () => {
    const step = nextStep('google-photos', {
      stage: STAGE.VERIFIED, bytesVerified: true, completenessConfirmed: true,
    });
    expect(step.action).toMatch(/safe/i);
    // Emptying the trash is the step people miss when space does not free.
    expect(step.detail).toMatch(/trash/i);
  });
});

describe('summarize — counts real state only, never paints progress', () => {
  it('reports zero started for empty, null and junk input', () => {
    for (const bad of [{}, null, undefined, 'x']) {
      const s = summarize(bad);
      expect(s.started).toBe(0);
      expect(s.verified).toBe(0);
      expect(s.freed).toBe(0);
      expect(s.total).toBe(VENDORS.length);
    }
  });

  it('does not count a vendor sitting at not-started', () => {
    expect(summarize({ 'google-photos': { stage: STAGE.NOT_STARTED } }).started).toBe(0);
  });

  it('counts started, verified and freed independently', () => {
    const s = summarize({
      'google-photos': { stage: STAGE.BUILDING },
      'google-mail': { stage: STAGE.VERIFIED },
      'ring': { stage: STAGE.DELETED },
    });
    expect(s.started).toBe(3);
    expect(s.verified).toBe(2); // verified and deleted both cleared verification
    expect(s.freed).toBe(1);
  });
});

describe('stage ordering', () => {
  it('orders stages so progress can never silently skip backwards', () => {
    expect(stageIndex(STAGE.NOT_STARTED)).toBeLessThan(stageIndex(STAGE.READY));
    expect(stageIndex(STAGE.READY)).toBeLessThan(stageIndex(STAGE.VERIFIED));
    expect(stageIndex(STAGE.VERIFIED)).toBeLessThan(stageIndex(STAGE.DELETED));
  });

  it('treats an unknown stage as the beginning, not the end', () => {
    expect(stageIndex('garbage')).toBe(0);
  });
});
