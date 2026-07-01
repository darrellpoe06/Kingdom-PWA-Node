import { describe, it, expect } from 'vitest';
import {
  NOT_LEGAL_ADVICE,
  SMALL_ESTATE_THRESHOLD,
  INSTRUMENTS,
  instrumentById,
  classifyEntityHolding,
  buildAssetInventory,
  liabilitiesFor,
  suggestInstrument,
  assetMapRows,
  planStatusFor,
  gapAnalysis,
  buildAttorneyPackage,
  buildAttorneyQuestions,
  renderAttorneyPackageText,
} from '../lib/family-succession.js';

// A small, live-shaped `data` fixture mirroring the real multi-entity structure:
// a personal entity (natural person) + an LLC that holds real estate, plus a
// personally-held home, cash accounts, and a debt.
const DATA = {
  entities: [
    { id: 'e-personal', name: 'Personal (Family)', type: 'personal' },
    { id: 'e-props', name: 'Poe Properties LLC', type: 'business' },
    { id: 'e-tech', name: 'PoeTech LLC', type: 'business' },
  ],
  accounts: [
    { id: 'a-check', entityId: 'e-personal', name: 'Personal Checking', type: 'checking', balance: 5000, openingBalance: 5000 },
    { id: 'a-cc', entityId: 'e-personal', name: 'Card J', type: 'credit', balance: -2000, openingBalance: -2000 },
    { id: 'a-op', entityId: 'e-props', name: 'Props Operating', type: 'checking', balance: 1000, openingBalance: 1000 },
  ],
  transactions: [
    { id: 't1', date: '2000-01-01', accountId: 'a-check', amount: 250 }, // cleared → derived 5250
  ],
  debts: [
    { id: 'd1', name: 'HELOC', balance: 52000, entityId: 'e-personal' },
  ],
  inflows: {
    rentals: [
      // LLC-held rental → TODI must be BLOCKED
      { id: 'r1', name: '805 N Prospect', address: '805 N Prospect', city: 'Champaign', state: 'IL', status: 'paying', entityId: 'e-props', mortgage: { balance: 90000, estimated: true } },
      // personally-held home → TODI eligible
      { id: 'home', name: '2111 Talans Dr', address: '2111 Talans Dr', city: 'Champaign', state: 'IL', status: 'owner-occupied', propertyType: 'primary-home', entityId: 'e-personal', mortgage: { balance: 0, estimated: true } },
    ],
  },
};

const ASOF = new Date('2020-06-01');

describe('constants + registry', () => {
  it('carries an honest, non-empty not-legal-advice disclaimer', () => {
    expect(NOT_LEGAL_ADVICE).toMatch(/not legal advice/i);
    expect(NOT_LEGAL_ADVICE).toMatch(/Illinois/);
  });

  it('stores the small-estate threshold as a dated, sourced value ($150k, 2025)', () => {
    expect(SMALL_ESTATE_THRESHOLD.amount).toBe(150000);
    expect(SMALL_ESTATE_THRESHOLD.effective).toBe('2025-08-15');
    expect(SMALL_ESTATE_THRESHOLD.transfersRealEstate).toBe(false);
    expect(SMALL_ESTATE_THRESHOLD.statute).toMatch(/755 ILCS 5\/25-1/);
  });

  it('every instrument is cited (statute + source url) and verified', () => {
    for (const i of INSTRUMENTS) {
      expect(i.statute, `${i.id} statute`).toBeTruthy();
      expect(i.sourceUrl, `${i.id} url`).toMatch(/^https?:\/\//);
      expect(i.summary.length, `${i.id} summary`).toBeGreaterThan(30);
      expect(Array.isArray(i.attorneyConfirm) && i.attorneyConfirm.length, `${i.id} attorneyConfirm`).toBeTruthy();
      expect(i.verified).toBe(true);
    }
  });

  it('includes the five core Illinois instruments', () => {
    expect(instrumentById.todi).toBeTruthy();
    expect(instrumentById.trust).toBeTruthy();
    expect(instrumentById.llc_succession).toBeTruthy();
    expect(instrumentById.pod).toBeTruthy();
    expect(instrumentById.tod).toBeTruthy();
  });
});

describe('classifyEntityHolding', () => {
  it('personal entity → personal; business entity → entity; unknown → entity', () => {
    expect(classifyEntityHolding({ type: 'personal' })).toBe('personal');
    expect(classifyEntityHolding({ type: 'business' })).toBe('entity');
    expect(classifyEntityHolding(null)).toBe('entity');
  });
});

describe('buildAssetInventory', () => {
  const rows = buildAssetInventory(DATA, ASOF);

  it('derives real property, cash accounts, and one interest per business entity', () => {
    const classes = rows.map((r) => r.assetClass);
    expect(classes.filter((c) => c === 'real_property').length).toBe(2);
    expect(classes.filter((c) => c === 'bank_account').length).toBe(2); // 2 checking (not the credit card)
    expect(classes.filter((c) => c === 'business_interest').length).toBe(2); // 2 LLCs
  });

  it('reads DERIVED account balance, never the painted literal', () => {
    const check = rows.find((r) => r.assetId === 'acct:a-check');
    expect(check.value).toBe(5250); // 5000 opening + 250 cleared tx
    expect(check.valueKnown).toBe(true);
  });

  it('flags unknown values instead of fabricating them', () => {
    const interest = rows.find((r) => r.assetId === 'entity:e-props');
    expect(interest.value).toBeNull();
    expect(interest.valueKnown).toBe(false);
    const prop = rows.find((r) => r.assetId === 'prop:r1');
    expect(prop.value).toBeNull(); // no market value supplied → not invented
    expect(prop.valueEstimated).toBe(true); // mortgage was estimated
  });

  it('marks LLC-held property as entity-held and personal home as personal', () => {
    expect(rows.find((r) => r.assetId === 'prop:r1').heldBy).toBe('entity');
    expect(rows.find((r) => r.assetId === 'prop:home').heldBy).toBe('personal');
  });
});

describe('suggestInstrument — the legal correctness core', () => {
  const rows = buildAssetInventory(DATA, ASOF);
  const llcProp = rows.find((r) => r.assetId === 'prop:r1');
  const homeProp = rows.find((r) => r.assetId === 'prop:home');

  it('BLOCKS TODI for LLC-held real property (755 ILCS 27/5) — proven-to-catch', () => {
    const s = suggestInstrument(llcProp);
    expect(s.primary).toBe('llc_succession');
    expect(s.primary).not.toBe('todi');
    const blockedIds = s.blocked.map((b) => b.id);
    expect(blockedIds).toContain('todi');
    expect(s.blocked.find((b) => b.id === 'todi').reason).toMatch(/755 ILCS 27\/5|individual/i);
  });

  it('SUGGESTS TODI for personally-held real property', () => {
    const s = suggestInstrument(homeProp);
    expect(s.primary).toBe('todi');
    expect(s.blocked).toHaveLength(0);
  });

  it('suggests POD for bank accounts, LLC succession for business interests', () => {
    const acct = rows.find((r) => r.assetClass === 'bank_account');
    expect(suggestInstrument(acct).primary).toBe('pod');
    const interest = rows.find((r) => r.assetClass === 'business_interest');
    expect(suggestInstrument(interest).primary).toBe('llc_succession');
  });

  it('every suggestion is advisory', () => {
    for (const r of rows) expect(suggestInstrument(r).advisory).toBe(true);
  });
});

describe('planStatusFor + gapAnalysis', () => {
  it('classifies planned / partial / unplanned', () => {
    expect(planStatusFor({ beneficiary: 'A', instrument: 'todi' })).toBe('planned');
    expect(planStatusFor({ beneficiary: 'A', instrument: '' })).toBe('partial');
    expect(planStatusFor({ beneficiary: '', instrument: '' })).toBe('unplanned');
  });

  it('flags exposure and highlights real property with no instrument as probate risk', () => {
    const plan = { 'prop:home': { beneficiary: 'Daughter', instrument: 'todi' } };
    const rows = assetMapRows(DATA, plan, ASOF);
    const g = gapAnalysis(rows);
    expect(g.total).toBe(6);
    expect(g.counts.planned).toBe(1);
    expect(g.exposure.length).toBe(5);
    // the LLC-held property (unplanned) is real property → probate risk
    expect(g.probateRisk.some((r) => r.assetId === 'prop:r1')).toBe(true);
    // the planned home is NOT in probate risk
    expect(g.probateRisk.some((r) => r.assetId === 'prop:home')).toBe(false);
    expect(g.coverage).toBe(Math.round((1 / 6) * 100));
  });
});

describe('liabilitiesFor', () => {
  it('lists debts and credit balances as context', () => {
    const libs = liabilitiesFor(DATA, ASOF);
    expect(libs.some((l) => l.label === 'HELOC' && l.balance === 52000)).toBe(true);
    expect(libs.some((l) => l.kind === 'credit' && l.balance === -2000)).toBe(true);
  });
});

describe('buildAttorneyPackage + render', () => {
  const plan = {
    'prop:home': { beneficiary: 'Daughter', instrument: 'todi', status: 'discussed', notes: 'record before death' },
  };
  const pkg = buildAttorneyPackage(DATA, plan, { generatedAt: '2026-06-30', familyName: 'Poe', asOf: '2020-06-01' });

  it('groups assets by entity and carries the disclaimer + small-estate value', () => {
    expect(pkg.disclaimer).toBe(NOT_LEGAL_ADVICE);
    expect(pkg.state).toBe('Illinois');
    expect(Object.keys(pkg.assetsByEntity).length).toBeGreaterThan(0);
    expect(pkg.smallEstate.amount).toBe(150000);
  });

  it('derives attorney questions from the actual plan (LLC-held property + silent agreements)', () => {
    const qs = buildAttorneyQuestions(pkg.assets);
    expect(qs.join(' ')).toMatch(/LLC-held/);
    expect(qs.join(' ')).toMatch(/operating agreement/i);
  });

  it('renders a copy-out package that names the disclaimer and the blocked-TODI note', () => {
    const txt = renderAttorneyPackageText(pkg);
    expect(txt).toMatch(/Attorney Package/);
    expect(txt).toMatch(/not legal advice/i);
    expect(txt).toMatch(/805 N Prospect/);
    expect(txt).toMatch(/membership-interest level|755 ILCS 27\/5/);
  });
});
