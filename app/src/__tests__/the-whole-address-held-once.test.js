// @vitest-environment node
// =============================================================================
// THE WHOLE ADDRESS, HELD ONCE, THE SAME ON BOTH DOORS (DR-0997)
// =============================================================================
// Darrell, 2026-10-13: "why don't the addresses reflect each record... they
// all should be in sync", "Drop down with addresses... instead of letting
// someone else mistyped", "Hold the whole address so everyone can see the
// correct pattern for each property". The shapes below are HIS records as
// the Real Estate tab showed them that day and as DR-0967 measured them.
import { describe, it, expect } from 'vitest';
import {
  parseAddress, splitUnit, formatAddress, formatBuilding, addressNeeds, repairAddress,
  buildingOptions, pickedBuilding, isState, zipOf,
} from '../modules/properties/address.js';

describe('one line read into parts, never a guessed town', () => {
  it('the whole address in one field (the Real Estate shape)', () => {
    expect(parseAddress('1508 Williamsburg, Champaign, IL, 61821')).toEqual({
      address: '1508 Williamsburg', unit: '', city: 'Champaign', state: 'IL', zip: '61821', number: '1508',
    });
    expect(parseAddress('1213 Koehn Dr, Danville, IL')).toMatchObject({ address: '1213 Koehn Dr', city: 'Danville', state: 'IL', zip: '' });
    expect(parseAddress('805 North Prospect Avenue, Champaign, Illinois 61820')).toMatchObject({ city: 'Champaign', state: 'Illinois', zip: '61820' });
  });

  it('no town anywhere stays no town: "709 Commercial St, IL" is any town\'s Commercial Street', () => {
    const p = parseAddress('709 Commercial St, IL');
    expect(p).toMatchObject({ address: '709 Commercial St', city: '', state: 'IL' });
    expect(addressNeeds(p)).toEqual(['the town']);
  });

  it('a unit riding in the street is folded out (DR-0967\'s two beds)', () => {
    expect(splitUnit('805 North Prospect Avenue Apt 4')).toEqual({ street: '805 North Prospect Avenue', unit: 'Apt 4' });
    expect(splitUnit('805 North Prospect Avenue, #3')).toEqual({ street: '805 North Prospect Avenue', unit: '#3' });
    expect(splitUnit('805 North Prospect Avenue')).toEqual({ street: '805 North Prospect Avenue', unit: '' });
    expect(parseAddress('805 North Prospect Avenue Apt 4, Champaign, IL')).toMatchObject({ address: '805 North Prospect Avenue', unit: 'Apt 4', city: 'Champaign' });
    expect(parseAddress('805 North Prospect Avenue, Apt 2, Champaign, IL 61820')).toMatchObject({ address: '805 North Prospect Avenue', unit: 'Apt 2', city: 'Champaign', zip: '61820' });
  });

  it('states and zips are recognised, nothing else is', () => {
    expect(isState('IL')).toBe(true); expect(isState('Illinois')).toBe(true); expect(isState('Champaign')).toBe(false);
    expect(zipOf('61821')).toBe('61821'); expect(zipOf('61821-1234')).toBe('61821'); expect(zipOf('6182')).toBe('');
  });
});

describe('one line printed the same everywhere', () => {
  it('street, unit, town, state zip', () => {
    expect(formatAddress({ address: '805 North Prospect Avenue', unit: 'Apt 2', city: 'Champaign', state: 'Illinois', zip: '61820' }))
      .toBe('805 North Prospect Avenue, Apt 2, Champaign, Illinois 61820');
    expect(formatAddress({ address: '709 Commercial St', state: 'IL' })).toBe('709 Commercial St, IL');
    expect(formatBuilding({ address: '805 North Prospect Avenue', unit: 'Apt 2', city: 'Champaign', state: 'IL' })).toBe('805 North Prospect Avenue, Champaign, IL');
  });

  it('what is missing is said in words', () => {
    expect(addressNeeds({ address: '', city: '', state: '' })).toEqual(['the street', 'the town', 'the state']);
    expect(addressNeeds({ address: 'Oak Street', city: 'Danville', state: 'IL' })).toEqual(['the house number']);
    expect(addressNeeds({ address: '12 Oak Street', city: 'Danville', state: 'IL' })).toEqual([]);
  });
});

describe('the one-time repair fills blanks and never overwrites', () => {
  it('splits a whole-line address into its parts, with a trace', () => {
    const r = repairAddress({ address: '1508 Williamsburg, Champaign, IL, 61821', city: '', state: '', zip: '', unit: '' });
    expect(r.patch).toEqual({ address: '1508 Williamsburg', city: 'Champaign', state: 'IL', zip: '61821' });
    expect(r.summary).toContain('was "1508 Williamsburg, Champaign, IL, 61821"');
  });

  it('a set part is never overwritten; only the blanks are filled', () => {
    const r = repairAddress({ address: '1213 Koehn Dr, Danville, IL', city: 'Danville', state: 'Illinois', zip: '61832' });
    expect(r.patch).toEqual({ address: '1213 Koehn Dr' });
  });

  it('PROVEN-TO-CATCH: a line with no town is left alone rather than half-repaired', () => {
    expect(repairAddress({ address: '709 Commercial St, IL', city: '', state: '' })).toBeNull();
  });

  it('a unit in the street is folded out when the unit field is blank, and left when it is set', () => {
    expect(repairAddress({ address: '805 North Prospect Avenue Apt 4', unit: '', city: 'Champaign', state: 'IL' }).patch).toEqual({ address: '805 North Prospect Avenue', unit: 'Apt 4' });
    expect(repairAddress({ address: '805 North Prospect Avenue Apt 4', unit: 'Bed B', city: 'Champaign', state: 'IL' })).toBeNull();
  });

  it('an address already in its parts needs nothing', () => {
    expect(repairAddress({ address: '805 North Prospect Avenue', unit: 'Apt 2', city: 'Champaign', state: 'IL' })).toBeNull();
    expect(repairAddress({ address: '', city: '' })).toBeNull();
  });
});

describe('the dropdown of known buildings', () => {
  const doors = [
    { address: '805 North Prospect Avenue', unit: 'Apt 2', city: 'Champaign', state: 'IL', zip: '61820' },
    { address: '805 North Prospect Avenue Apt 4', unit: 'Apt 4', city: 'Champaign', state: 'IL', zip: '61820' },
    { address: '1213 Koehn Dr', city: 'Danville', state: 'IL' },
    { address: '', city: 'Nowhere' },
  ];
  it('one entry per building, the unit folded out, sorted', () => {
    const o = buildingOptions(doors);
    expect(o.map((x) => x.label)).toEqual(['1213 Koehn Dr, Danville, IL', '805 North Prospect Avenue, Champaign, IL 61820']);
    expect(o[1]).toMatchObject({ address: '805 North Prospect Avenue', city: 'Champaign', state: 'IL', zip: '61820' });
  });
  it('a pick fills the parts; new text is a new building', () => {
    const o = buildingOptions(doors);
    expect(pickedBuilding('805 north prospect avenue, champaign, il 61820', o)).toMatchObject({ city: 'Champaign' });
    expect(pickedBuilding('12 Oak Street, Danville, IL', o)).toBeNull();
  });
});
