// =============================================================================
// Utilities are the family's to say, on every door (DR-1020)
// =============================================================================
// Darrell, 2026-10-14: "All utilities paid for the shared room tenants...
// single person renting a whole unit pays their own utilities... make sense?";
// "Currently... it may change in the future... however we eat that cost."
//
// Measured before this: utilities_included was written only by the co-living
// split (true on every room and bed) and NO editor could change it or say it on
// a whole unit, so a unit's card said nothing and a bed's could never change
// when the season does. Now the door editor carries it, three states; the card
// says the tenant pays their own; the share page says it too.
// =============================================================================
import React, { act } from 'react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import { DoorsBoard, utilitiesWord, utilitiesValue, rentalPatchOut, UTILITIES_WORDS } from '../modules/properties/DoorTabs.jsx';
import { describeListing } from '../../../scripts/listing-share-pages.mjs';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
beforeEach(() => { try { localStorage.setItem('poe-properties-view', 'list'); } catch { /* ignore */ } });
let mounted = [];
afterEach(() => {
  mounted.forEach(({ root, host }) => { act(() => root.unmount()); host.remove(); });
  mounted = [];
  try { localStorage.clear(); } catch { /* ignore */ }
});
function render(el) {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  act(() => root.render(el));
  mounted.push({ root, host });
  return host;
}
const buttons = (host) => [...host.querySelectorAll('button')];
const byText = (host, re) => buttons(host).find((b) => re.test(b.textContent));
const click = (b) => act(() => b.dispatchEvent(new MouseEvent('click', { bubbles: true })));
const choose = (sel, value) => act(() => {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
  setter.call(sel, value);
  sel.dispatchEvent(new Event('change', { bubbles: true }));
});

const UNIT = { id: 'u-apt2', slug: 'prospect-805-2', instance_id: 'i1', address: '805 North Prospect Avenue', unit: 'Apt 2', city: 'Champaign', state: 'Illinois', monthly_rent: '800.00' };
const BED = { ...UNIT, id: 'u-bed', slug: 'prospect-805-4a', unit: 'Apt 4 bed A', rentable_level: 'bed', utilities_included: true };

describe('three words, three states', () => {
  it('maps the column to a word and back, and unsaid stays unsaid', () => {
    expect(utilitiesWord(true)).toBe('all paid');
    expect(utilitiesWord(false)).toBe('tenant pays');
    expect(utilitiesWord(null)).toBe('');
    expect(utilitiesWord(undefined)).toBe('');
    expect(utilitiesValue('all paid')).toBe(true);
    expect(utilitiesValue('tenant pays')).toBe(false);
    expect(utilitiesValue('')).toBe(null);
    expect(utilitiesValue(null)).toBe(null);
  });
  it('the patch leaves the editor as the column, not the word', () => {
    expect(rentalPatchOut({ utilities: UTILITIES_WORDS.tenant, city: 'Champaign' })).toEqual({ utilities_included: false, city: 'Champaign' });
    expect(rentalPatchOut({ utilities: null })).toEqual({ utilities_included: null });
    expect(rentalPatchOut({ city: 'Champaign' })).toEqual({ city: 'Champaign' });
  });
});

describe('the door editor', () => {
  it('a whole unit can be made to say the tenant pays their own utilities', () => {
    const onEditRental = vi.fn();
    const host = render(<DoorsBoard rentals={[UNIT]} tenancies={[]} canManage onEditRental={onEditRental} />);
    click(byText(host, /Edit door/));
    const sel = host.querySelector('[data-testid="edit-utilities"]');
    expect(sel.value).toBe('');
    choose(sel, UTILITIES_WORDS.tenant);
    click(byText(host, /Save the change/));
    expect(onEditRental).toHaveBeenCalledTimes(1);
    const [id, patch, summary] = onEditRental.mock.calls[0];
    expect(id).toBe('u-apt2');
    expect(patch).toEqual({ utilities_included: false });
    expect(summary).toBe('Utilities: (blank) → tenant pays');
  });

  it('a bed made by the co-living split reads "all paid", and the season can change it', () => {
    const onEditRental = vi.fn();
    const host = render(<DoorsBoard rentals={[BED]} tenancies={[]} canManage onEditRental={onEditRental} />);
    click(byText(host, /Edit door/));
    const sel = host.querySelector('[data-testid="edit-utilities"]');
    expect(sel.value).toBe('all paid');
    expect(byText(host, /Nothing changed/).disabled).toBe(true);
    choose(sel, '');
    click(byText(host, /Save the change/));
    expect(onEditRental.mock.calls[0][1]).toEqual({ utilities_included: null });
    expect(onEditRental.mock.calls[0][2]).toBe('Utilities: all paid → (blank)');
  });
});

describe('the share page says it too', () => {
  const ROW = { city: 'Champaign', state: 'Illinois', rent: 800, offering: 'long-term', shared_home: false };
  it('all paid, tenant pays, or nothing', () => {
    expect(describeListing({ ...ROW, utilities_included: true })).toBe('Champaign, Illinois · $800/mo · All utilities paid');
    expect(describeListing({ ...ROW, utilities_included: false })).toBe('Champaign, Illinois · $800/mo · Tenant pays utilities');
    expect(describeListing({ ...ROW, utilities_included: null })).toBe('Champaign, Illinois · $800/mo');
  });
});
