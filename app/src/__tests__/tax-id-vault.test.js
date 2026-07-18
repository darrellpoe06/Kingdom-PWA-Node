// @vitest-environment jsdom
//
// tax-id-vault + contractor sync — the SOVEREIGN guarantee (Darrell 2026-07-18:
// "Only saves to the cellphone or the backup NAS... we store no [sensitive]
// data"). Proven-to-catch: the FULL taxpayer id NEVER enters the cloud sync
// payload; only the last 4 + type + W-9 flag do. The full id lives on-device only.
import { describe, it, expect, beforeEach } from 'vitest';
import {
  lastFour, maskedLabel, setFullTaxId, getFullTaxId, hasFullTaxId,
  clearFullTaxId, exportForBackup, importFromBackup,
} from '../lib/tax-id-vault.js';
import { contractorColumns } from '../lib/contractors-sync.js';

beforeEach(() => { try { localStorage.clear(); } catch { /* ignore */ } });

describe('lastFour — only the last 4 digits ever leave the device', () => {
  it('strips formatting and returns the last 4', () => {
    expect(lastFour('12-3456789')).toBe('6789');
    expect(lastFour('123 45 6789')).toBe('6789');
    expect(lastFour('6789')).toBe('6789');
  });
  it('is safe on blank/short input', () => {
    expect(lastFour('')).toBe('');
    expect(lastFour(null)).toBe('');
    expect(lastFour('12')).toBe('12');
  });
});

describe('the on-device vault holds the full id; the cloud never does', () => {
  it('setFullTaxId stores the full id on-device and returns ONLY the last 4', () => {
    const last4 = setFullTaxId('k1', '12-3456789', { type: 'ein' });
    expect(last4).toBe('6789');
    expect(getFullTaxId('k1')).toBe('123456789'); // full, on this device
    expect(hasFullTaxId('k1')).toBe(true);
  });
  it('CRITICAL: the synced payload carries last-4 + type + flag — NEVER the full id', () => {
    setFullTaxId('k1', '123-45-6789', { type: 'ssn' });
    const synced = contractorColumns({
      id: 'k1', name: 'Isaiah', legalName: 'Isaiah Ramos', mailingAddress: '1 Main St',
      taxIdType: 'ssn', taxIdLast4: lastFour('123-45-6789'), w9OnFile: true,
    });
    const blob = JSON.stringify(synced);
    expect(blob).not.toContain('123456789');   // the full id must NOT be in the cloud payload
    expect(blob).not.toContain('123-45-6789');
    expect(synced.tax_id_last4).toBe('6789');   // only the last 4
    expect(synced.tax_id_type).toBe('ssn');
    expect(synced.w9_on_file).toBe(true);
    expect(synced.legal_name).toBe('Isaiah Ramos');
  });
  it('a full id accidentally placed in taxIdLast4 is truncated to 4 digits on sync (defense-in-depth)', () => {
    const synced = contractorColumns({ id: 'k1', name: 'x', taxIdLast4: '123456789' });
    expect(synced.tax_id_last4).toBe('6789');
    expect(synced.tax_id_last4.length).toBeLessThanOrEqual(4);
  });
  it('blank id clears the on-device entry (nothing lingers)', () => {
    setFullTaxId('k1', '123456789');
    setFullTaxId('k1', '');
    expect(getFullTaxId('k1')).toBe('');
    expect(hasFullTaxId('k1')).toBe(false);
  });
});

describe('NAS backup — the only sanctioned way the full ids leave the device', () => {
  it('exportForBackup returns the vault; importFromBackup restores it on another device', () => {
    setFullTaxId('k1', '111223333', { type: 'ssn' });
    setFullTaxId('k2', '99-8887777', { type: 'ein' });
    const backup = exportForBackup();
    localStorage.clear();                       // simulate a fresh device
    expect(getFullTaxId('k1')).toBe('');
    const added = importFromBackup(backup);
    expect(added).toBe(2);
    expect(getFullTaxId('k1')).toBe('111223333');
  });
  it('restore never clobbers a fresher local id (device wins on conflict)', () => {
    setFullTaxId('k1', '111223333');
    const added = importFromBackup({ k1: { full: '000000000' } });
    expect(added).toBe(0);
    expect(getFullTaxId('k1')).toBe('111223333');
  });
});

describe('maskedLabel — display never shows the full id', () => {
  it('shows type + last 4 only', () => {
    expect(maskedLabel('ein', '6789')).toBe('EIN ····6789');
    expect(maskedLabel('ssn', '6789')).toBe('SSN ····6789');
    expect(maskedLabel('ein', '')).toBe('EIN — not on file');
  });
});
