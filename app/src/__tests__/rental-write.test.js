// =============================================================================
// One door, two tabs, one change — the bridge, gated
// =============================================================================
// Darrell, 2026-08-28: "I edited the addresses in property and they did not
// update Real Estate.... fix it! perpetually.... obviously..."
//
// READ, not guessed. There are two functions named updateRental:
//   poe-financial-mvp-v28.jsx  → the device list, then uploads
//   modules/properties/cloud.js → the Postgres row, by UUID
// Neither told the other, so the same door showed two different addresses
// depending on which tab was open.
//
// "Perpetually" is what these are for: the bridge is a module both sides call,
// and the last block asserts the wiring at both ends so the next person to add
// a rental write cannot quietly skip it.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  RENTAL_CHANGED, CLOUD_TO_LOCAL, cloudPatchToLocal,
  announceRentalChange, onRentalChange, applyRentalChange, localPatchToCloud,
} from '../lib/rental-write.js';

// A minimal event target, so these never depend on a DOM being present.
function bus() {
  const listeners = new Map();
  return {
    addEventListener: (t, fn) => { listeners.set(fn, t); },
    // Real signature is (type, fn) — a first draft took only (fn) and made the
    // unsubscribe test fail against a module that was behaving correctly.
    removeEventListener: (t, fn) => { listeners.delete(fn); },
    dispatchEvent: (e) => { for (const [fn, t] of listeners) if (t === e.type) fn(e); return true; },
    count: () => listeners.size,
  };
}

describe('the two vocabularies are translated, not assumed', () => {
  it('maps the columns a door edit actually writes', () => {
    // These are the exact keys EditRental's buildEdit produces (its field list
    // names cloud columns), so this is the real traffic, not a sample.
    expect(cloudPatchToLocal({
      display_name: '1513 Holly Hill',
      address: '1513 Holly Hill',
      unit: 'Apt 2',
      city: 'Danville',
      state: 'IL',
      monthly_rent: '1150',
    })).toEqual({
      name: '1513 Holly Hill',
      address: '1513 Holly Hill',
      unitLabel: 'Apt 2',
      city: 'Danville',
      state: 'IL',
      rent: 1150,
    });
  });

  it('DROPS a column the device list has no field for', () => {
    // listed_at / showcase_order / address_visibility are cloud-only. Passing
    // them through would put a column name where a field belongs and corrupt
    // the record the portfolio maths reads.
    expect(cloudPatchToLocal({ listed_at: '2026-08-01', showcase_order: 10, address_visibility: 'public' }))
      .toEqual({});
  });

  it('turns a cleared cloud field into an empty string, not the word null', () => {
    expect(cloudPatchToLocal({ city: null }).city).toBe('');
    expect(cloudPatchToLocal({ tenant_name: undefined }).tenantName).toBe('');
  });

  it('makes a number a number, and an unreadable one zero rather than NaN', () => {
    expect(cloudPatchToLocal({ monthly_rent: '900' }).rent).toBe(900);
    expect(cloudPatchToLocal({ monthly_rent: 'lots' }).rent).toBe(0);
  });

  it('carries the structure fields 0160 added', () => {
    for (const col of ['building_label', 'room_label', 'rentable_level']) {
      expect(CLOUD_TO_LOCAL[col], col).toBeTruthy();
    }
  });
});

describe('the news reaches the other tab', () => {
  it('announces a patch and delivers it to a listener', () => {
    const b = bus();
    const seen = [];
    onRentalChange((d) => seen.push(d), b);
    announceRentalChange({ slug: 'r-1513hh', uuid: 'u-1', patch: { display_name: '1513 Holly Hill' } }, b);
    expect(RENTAL_CHANGED).toBe('poe-rental-changed');
    expect(seen).toHaveLength(1);
    expect(seen[0].patch).toEqual({ name: '1513 Holly Hill' });
    expect(seen[0].slug).toBe('r-1513hh');
    expect(seen[0].uuid).toBe('u-1');
  });

  it('carries BOTH keys, because the two tabs key on different ones', () => {
    const b = bus();
    let got = null;
    onRentalChange((d) => { got = d; }, b);
    announceRentalChange({ slug: 's', uuid: 'u', patch: { address: 'x' } }, b);
    expect(got.slug).toBe('s');
    expect(got.uuid).toBe('u');
  });

  it('says nothing when the patch has nothing the device list understands', () => {
    const b = bus();
    const seen = [];
    onRentalChange((d) => seen.push(d), b);
    const res = announceRentalChange({ uuid: 'u', patch: { showcase_order: 20 } }, b);
    expect(res.ok).toBe(false);
    expect(res.reason).toBe('nothing-to-announce');
    expect(seen).toHaveLength(0);
  });

  it('refuses to announce a change it cannot key to a door', () => {
    expect(announceRentalChange({ patch: { address: 'x' } }, bus()).ok).toBe(false);
  });

  it('unsubscribes cleanly', () => {
    const b = bus();
    const off = onRentalChange(() => {}, b);
    expect(b.count()).toBe(1);
    off();
    expect(b.count()).toBe(0);
  });

  it('one throwing listener never stops the others', () => {
    const b = bus();
    const seen = [];
    onRentalChange(() => { throw new Error('boom'); }, b);
    onRentalChange(() => seen.push(1), b);
    announceRentalChange({ uuid: 'u', patch: { address: 'x' } }, b);
    expect(seen).toHaveLength(1);
  });

  it('never throws when there is no bus at all', () => {
    expect(() => announceRentalChange({ uuid: 'u', patch: { address: 'x' } }, null)).not.toThrow();
    expect(() => onRentalChange(() => {}, null)).not.toThrow();
  });
});

describe('the change lands on the right row', () => {
  const list = [
    { id: 'r-1513hh', remoteUuid: 'u-1', name: '1513 HH', address: '1513 HH' },
    { id: 'r-440ss', remoteUuid: 'u-2', name: '440 SS' },
    { id: 'r-new', name: 'Never synced' },      // no remoteUuid yet
  ];

  it('matches on the uuid when the door has synced', () => {
    const next = applyRentalChange(list, { uuid: 'u-1', patch: { name: '1513 Holly Hill' } });
    expect(next[0].name).toBe('1513 Holly Hill');
    expect(next[1]).toBe(list[1]);              // untouched rows keep identity
  });

  it('matches on the slug for a door that has never synced', () => {
    const next = applyRentalChange(list, { slug: 'r-new', patch: { name: 'Named at last' } });
    expect(next[2].name).toBe('Named at last');
  });

  it('keeps every other field on the row it patches', () => {
    const next = applyRentalChange(list, { uuid: 'u-1', patch: { name: 'X' } });
    expect(next[0].address).toBe('1513 HH');
    expect(next[0].remoteUuid).toBe('u-1');
  });

  it('returns the SAME array when nothing matched, so no needless re-render', () => {
    expect(applyRentalChange(list, { uuid: 'nobody', patch: { name: 'X' } })).toBe(list);
    expect(applyRentalChange(list, { uuid: 'u-1', patch: {} })).toBe(list);
  });

  it('survives a junk row in the list', () => {
    expect(() => applyRentalChange([null, undefined, ...list], { uuid: 'u-1', patch: { name: 'X' } })).not.toThrow();
  });
});

describe('the local→cloud mapping kept its exact behaviour when it moved', () => {
  // CHARACTERIZATION (DR-0076 §5). These 22 lines lived inside the monolith's
  // updateRental. Moving them is only safe if the behaviour is pinned first —
  // "better" is measured against verified reality, not memory.

  it('writes NOTHING for a key the caller did not mention', () => {
    // The whole contract: an absent key must not become a null column and blank
    // a value in the cloud that the caller never touched.
    expect(localPatchToCloud({ name: 'X' })).toEqual({ display_name: 'X' });
    expect(localPatchToCloud({})).toEqual({});
  });

  it('falls back to null — not empty string — on the nullable text fields', () => {
    expect(localPatchToCloud({ city: '' }).city).toBeNull();
    expect(localPatchToCloud({ state: '' }).state).toBeNull();
    expect(localPatchToCloud({ zip: '' }).zip).toBeNull();
    expect(localPatchToCloud({ tenantName: '' }).tenant_name).toBeNull();
    expect(localPatchToCloud({ entityId: '' }).entity_slug).toBeNull();
    expect(localPatchToCloud({ purchaseDate: '' }).purchase_date).toBeNull();
  });

  it('passes name, address and notes through untouched, empty string included', () => {
    // These are NOT null-coerced, and were not before the move: a landlord
    // clearing the notes means an empty note, not an absent one.
    expect(localPatchToCloud({ name: '' }).display_name).toBe('');
    expect(localPatchToCloud({ address: '' }).address).toBe('');
    expect(localPatchToCloud({ notes: '' }).notes).toBe('');
  });

  it('coerces every money field with parseFloat, zero on junk', () => {
    expect(localPatchToCloud({ rent: '1150' }).monthly_rent).toBe(1150);
    expect(localPatchToCloud({ actual: '900.50' }).rent_actual).toBe(900.5);
    expect(localPatchToCloud({ purchasePrice: 'x' }).purchase_price).toBe(0);
    expect(localPatchToCloud({ estimatedValue: null }).current_market_value).toBe(0);
  });

  it('expands the mortgage object into its four columns, together', () => {
    expect(localPatchToCloud({ mortgage: { balance: '100', rate: '6.5', monthlyPI: '800', escrow: '200' } }))
      .toEqual({
        mortgage_balance: 100, mortgage_rate: 6.5,
        mortgage_payment: 800, mortgage_escrow: 200,
      });
  });

  it('writes all four mortgage columns even when the object is partial', () => {
    // Prior behaviour, preserved deliberately: the block wrote all four or none.
    const p = localPatchToCloud({ mortgage: { balance: 5 } });
    expect(Object.keys(p).sort()).toEqual([
      'mortgage_balance', 'mortgage_escrow', 'mortgage_payment', 'mortgage_rate',
    ]);
    expect(p.mortgage_rate).toBe(0);
  });

  it('normalises status and property type through the same vocab guards', () => {
    // toRemoteStatus / toRemotePropertyType — garbage must never reach a column.
    expect(localPatchToCloud({ status: 'not-a-status' }).status).toBe('paying');
    expect(localPatchToCloud({ propertyType: 'nonsense' }).property_type).toBe('single-family');
    expect(localPatchToCloud({ status: 'vacant' }).status).toBe('vacant');
  });

  it('survives a missing mortgage sub-object without throwing', () => {
    expect(() => localPatchToCloud({ mortgage: null })).not.toThrow();
  });
});

describe('both ends are actually wired — the part that makes it perpetual', () => {
  const read = (p) => readFileSync(join(process.cwd(), p), 'utf8');
  const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

  it('the Properties save announces after a successful write', () => {
    const s = strip(read('src/modules/properties/PropertiesApp.jsx'));
    const fn = s.slice(s.indexOf('const editRental'), s.indexOf('const postRentToBooks'));
    expect(fn).toContain('announceRentalChange');
  });

  it('and ONLY after a successful write', () => {
    // Telling the other tab about a write that did not land is how the two
    // stores would drift the other way — a phantom edit that outlives its own
    // failure. This is the one ordering that matters in that function.
    const s = strip(read('src/modules/properties/PropertiesApp.jsx'));
    const fn = s.slice(s.indexOf('const editRental'), s.indexOf('const postRentToBooks'));
    expect(fn).toMatch(/if \(res\.ok\)[\s\S]*announceRentalChange/);
  });

  it('the Real Estate list listens and applies', () => {
    // The monolith calls the hook; the hook does the listening. Both halves are
    // asserted, because either one missing breaks the same journey.
    expect(strip(read('src/poe-financial-mvp-v28.jsx'))).toContain('useRentalBridge(setData)');
    const hook = strip(read('src/lib/use-rental-bridge.js'));
    expect(hook).toContain('onRentalChange(');
    expect(hook).toContain('applyRentalChange(');
  });

  it('the listener does NOT re-upload what the other tab already wrote', () => {
    // The cloud row is already written by the announcer. Uploading from here
    // would race that write with an older copy of the same door.
    const hook = strip(read('src/lib/use-rental-bridge.js'));
    expect(hook).not.toContain('rentalsSync');
    expect(hook).not.toContain('upload');
  });

  it('keeps the monolith to ONE line, because that file is budget-frozen', () => {
    // The first draft put the effect inline and the budget guard caught it at
    // +22 over. That guard is right: a module the monolith calls is the fix.
    const s = strip(read('src/poe-financial-mvp-v28.jsx'));
    expect(s).not.toContain('onRentalChange(');
    expect(s).not.toContain('applyRentalChange(');
  });
});
