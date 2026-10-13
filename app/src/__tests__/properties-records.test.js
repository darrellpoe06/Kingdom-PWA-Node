// =============================================================================
// records — held against the shapes the family's own files actually carry
// =============================================================================
// The row shapes here are the real ones read out of Drive on 2026-08-27. The
// PEOPLE are not: no tenant name belongs in a git repository, so every personal
// name below is invented. The Section 8 row needs no such care — its whole
// point is that it names nobody.
// =============================================================================
import { describe, it, expect } from 'vitest';
import {
  namesAHousehold,
  money,
  recordDate,
  fromRentRollRow,
  fromSection8Row,
  fromLedgerLine,
  fromProjectionLine,
  assignmentIsSafe,
  divergence,
  openQuestions,
} from '../modules/properties/records.js';

describe('reading the columns', () => {
  it('reads the sheet money formats', () => {
    expect(money('$1,400')).toBe(1400);
    expect(money('1,100')).toBe(1100);
    expect(money('$680.00')).toBe(680);
    expect(money(650)).toBe(650);
  });

  it('refuses a value that is not money rather than coercing it to zero', () => {
    expect(money('Section 8')).toBeNull();
    expect(money('')).toBeNull();
    expect(money(undefined)).toBeNull();
    expect(money('$1,4OO')).toBeNull(); // letter O, the classic scan slip
  });

  it('dates a payment only when the year is actually written down', () => {
    expect(recordDate('10/03/2022')).toBe('2022-10-03');
    expect(recordDate('11/2/22')).toBe('2022-11-02');
    expect(recordDate('9/16')).toBeNull(); // the sheet's bare form
    expect(recordDate('9/16', { assumeYear: 2022 })).toBe('2022-09-16');
    expect(recordDate('13/40/2022')).toBeNull();
  });

  it('knows a programme name is not a household', () => {
    expect(namesAHousehold('Section 8')).toBe(false);
    expect(namesAHousehold('  SECTION8 ')).toBe(false);
    expect(namesAHousehold('Deposit')).toBe(false);
    expect(namesAHousehold('')).toBe(false);
    expect(namesAHousehold('Jordan Ellery')).toBe(true);
  });
});

describe('a rent-roll row', () => {
  const source = 'Poe Properties - April. 2023.xlsx';

  it('takes the household, the rent and the payment', () => {
    const p = fromRentRollRow(
      { client: 'Jordan Ellery', rent: '$550', rentPaid: '$550.00', datePaid: '7/13' },
      { source, assumeYear: 2022 },
    );
    expect(p.fields.householdName).toBe('Jordan Ellery');
    expect(p.fields.contractRent).toBe(550);
    expect(p.fields.amountPaid).toBe(550);
    expect(p.fields.paidOn).toBe('2022-07-13');
    expect(p.confirmed).toBe(false);
  });

  it('never returns a confirmed proposal, whatever the row says', () => {
    const p = fromRentRollRow({ client: 'Jordan Ellery', rent: 550, confirmed: true }, { source });
    expect(p.confirmed).toBe(false);
  });

  it('refuses to read a programme name as a household', () => {
    const p = fromRentRollRow({ client: 'Section 8', rent: '$680' }, { source });
    expect(p.fields.householdName).toBeNull();
    expect(p.unresolved.join(' ')).toMatch(/programme or placeholder/);
  });

  it('says a bare date has no year rather than assuming one', () => {
    const p = fromRentRollRow({ client: 'Jordan Ellery', rent: 550, datePaid: '7/13' }, { source });
    expect(p.fields.paidOn).toBeNull();
    expect(p.unresolved.join(' ')).toMatch(/carries no year/);
  });
});

describe('a Section 8 row — the shape at 1003 Koehn', () => {
  const source = 'Poe Properties - April. 2023.xlsx, tab "1003 KOEHN"';

  it('reads the real 11/02/2022 row and names no household', () => {
    const p = fromSection8Row(
      { contractRent: '$680', programPaid: '$680.00', tenantPortion: '$0.00', datePaid: '11/02/22' },
      { source },
    );
    expect(p.fields.contractRent).toBe(680);
    expect(p.fields.programPaid).toBe(680);
    expect(p.fields.tenantPortion).toBe(0);
    expect(p.fields.paidOn).toBe('2022-11-02');
    expect(p.fields.householdName).toBeNull();
    expect(p.fields.subsidised).toBe(true);
    expect(p.unresolved[0]).toMatch(/not named anywhere/);
  });

  it('flags the 9/16 row where the voucher paid $646 against $680 with no tenant portion', () => {
    const p = fromSection8Row(
      { contractRent: '$680', programPaid: '$646.00', tenantPortion: '$0.00', datePaid: '9/16' },
      { source, assumeYear: 2022 },
    );
    expect(p.fields.paidOn).toBe('2022-09-16');
    expect(p.unresolved.join(' ')).toMatch(/short by 34/);
  });

  it('stays quiet when programme plus tenant meets the contract rent', () => {
    const p = fromSection8Row({ contractRent: 680, programPaid: 600, tenantPortion: 80 });
    expect(p.unresolved.join(' ')).not.toMatch(/short by|over by/);
  });
});

describe('a bank ledger line', () => {
  it('reads the payer out of a Zelle line and refuses to place them', () => {
    const p = fromLedgerLine('Zelle payment from AVERY LINDQUIST 26546734154', {
      source: 'OCTOBER 2025', amount: '$ 650.00 ', date: '2025-10-10',
    });
    expect(p.fields.payerName).toBe('AVERY LINDQUIST');
    expect(p.fields.amount).toBe(650);
    expect(p.fields.rentalId).toBeNull();
    expect(p.unresolved.join(' ')).toMatch(/not a tenancy/);
    expect(p.unresolved.join(' ')).toMatch(/names no door/);
  });

  it('still refuses to place a payer even when the amount matches a known rent', () => {
    // The real trap: $650 in the ledger and $650 expected at Apt. 2. An amount
    // coincidence is not a match, and the reader must not quietly make it one.
    const p = fromLedgerLine('Zelle payment from AVERY LINDQUIST 265467', { amount: 650 });
    expect(p.fields.rentalId).toBeNull();
    expect(p.confirmed).toBe(false);
  });

  it('says so when no name can be read', () => {
    const p = fromLedgerLine('REAL TIME TRANSFER RECD FROM ABA/CONTR BNK-021000021');
    expect(p.fields.payerName).toBeNull();
    expect(p.unresolved.join(' ')).toMatch(/no payer name/);
  });
});

describe('a projection line', () => {
  it('reads the apartment label and the figure', () => {
    const p = fromProjectionLine('Apt. 1 - 805 Prospect', 630, { source: 'OCTOBER 2025' });
    expect(p.fields.unitLabel).toBe('1');
    expect(p.fields.expectedRent).toBe(630);
    expect(p.unresolved.join(' ')).toMatch(/not a payment received/);
  });

  it('says so when there is no apartment in the line', () => {
    expect(fromProjectionLine('805 Prospect', 3000).unresolved.join(' ')).toMatch(/no apartment label/);
  });
});

describe('assigning a unit — the 805 North Prospect problem', () => {
  // The four real rows: same address, every unit null.
  const unlabelled = [
    { id: 'a', unit: null }, { id: 'b', unit: null },
    { id: 'c', unit: null }, { id: 'd', unit: null },
  ];

  it('refuses to place Apt. 1 when no door carries a label', () => {
    const r = assignmentIsSafe('1', unlabelled);
    expect(r.safe).toBe(false);
    expect(r.reason).toMatch(/none of the 4 door\(s\)/);
    expect(r.rentalId).toBeUndefined();
  });

  it('places it once the landlord has labelled the doors', () => {
    const labelled = [{ id: 'a', unit: '1' }, { id: 'b', unit: '2' }];
    expect(assignmentIsSafe('1', labelled)).toEqual({ safe: true, rentalId: 'a' });
  });

  it('refuses when two doors claim the same label', () => {
    const dup = [{ id: 'a', unit: '1' }, { id: 'b', unit: '1' }];
    expect(assignmentIsSafe('1', dup).safe).toBe(false);
  });

  it('refuses when nothing is labelled that way', () => {
    expect(assignmentIsSafe('3', [{ id: 'a', unit: '1' }]).safe).toBe(false);
  });

  it('refuses a proposal with no label at all', () => {
    expect(assignmentIsSafe(null, [{ id: 'a', unit: '1' }]).safe).toBe(false);
  });
});

describe('divergence — naming the conflict instead of overwriting', () => {
  it('catches the door that reads paying with nothing behind it', () => {
    // 805 North Prospect: status "paying", rent 0.00, tenant_name null.
    const door = { status: 'paying', monthly_rent: '0.00', tenant_name: null };
    const d = divergence(fromLedgerLine('Zelle payment from AVERY LINDQUIST 2654'), door);
    expect(d.some((x) => x.field === 'status')).toBe(true);
  });

  it('catches an unrented door that money is moving against', () => {
    const door = { status: 'unrented', monthly_rent: '0.00', tenant_name: null };
    const d = divergence(fromProjectionLine('Apt. 2 - 805 Prospect', 650), door);
    expect(d.find((x) => x.field === 'status').note).toMatch(/unrented but the record shows money/);
  });

  it('catches a rent the door does not carry', () => {
    const door = { status: 'paying', monthly_rent: '0.00', tenant_name: null };
    const d = divergence(fromSection8Row({ contractRent: 680, programPaid: 680, tenantPortion: 0 }), door);
    expect(d.find((x) => x.field === 'monthly_rent')).toMatchObject({ record: 680, live: 0 });
  });

  it('catches two different households on the same door', () => {
    const door = { status: 'paying', monthly_rent: '550.00', tenant_name: 'Rowan Fitch' };
    const d = divergence(fromRentRollRow({ client: 'Jordan Ellery', rent: 550 }), door);
    expect(d.find((x) => x.field === 'tenant_name').note).toMatch(/different household/);
  });

  it('is silent when the record and the door already agree', () => {
    const door = { status: 'paying', monthly_rent: '550.00', tenant_name: 'Jordan Ellery' };
    expect(divergence(fromRentRollRow({ client: 'Jordan Ellery', rent: '$550' }), door)).toEqual([]);
  });

  it('does not call a rounding difference a conflict', () => {
    const door = { status: 'paying', monthly_rent: '680.00', tenant_name: null };
    expect(divergence({ contractRent: 680.4 }, door)).toEqual([]);
  });
});

describe('the landlord worklist', () => {
  it('gathers what the batch could not determine, without repeating itself', () => {
    const batch = [
      fromSection8Row({ contractRent: 680, programPaid: 680, tenantPortion: 0 }, { source: 'apr-2023' }),
      fromSection8Row({ contractRent: 680, programPaid: 680, tenantPortion: 0 }, { source: 'apr-2023' }),
      fromLedgerLine('Zelle payment from AVERY LINDQUIST 2654', { source: 'oct-2025' }),
    ];
    const qs = openQuestions(batch);
    expect(qs.filter((q) => q.kind === 'section-8')).toHaveLength(1);
    expect(qs.some((q) => q.question.match(/not a tenancy/))).toBe(true);
  });

  it('is empty for a batch with nothing outstanding', () => {
    expect(openQuestions([{ kind: 'x', source: 'y', unresolved: [] }])).toEqual([]);
  });
});
