// dispatch helpers — the job text a 1099 worker receives must be complete
// (what / where / how bad / when due) and the sms:/tel: links must be valid
// cross-platform. See lib/dispatch.js header for the loop this serves.
import { describe, it, expect } from 'vitest';
import { buildDispatchMessage, smsHref, telHref, normalizePhone } from '../lib/dispatch.js';

describe('buildDispatchMessage', () => {
  const args = {
    propertyName: '240 Cedar Ln Apt 4',
    address: '240 Cedar Ln Apt 4',
    city: 'Cedar Heights',
    state: 'IL',
    zip: '61820',
    description: 'Furnace died, no heat',
    category: 'hvac',
    urgencyLabel: 'Broken now — same-day',
    dueDate: '2026-06-10',
    notes: 'Tenant home after 4pm',
  };

  it('carries what, where, priority, due date, and notes', () => {
    const msg = buildDispatchMessage(args);
    expect(msg).toContain('240 Cedar Ln Apt 4, Cedar Heights, IL, 61820');
    expect(msg).toContain('hvac — Furnace died, no heat');
    expect(msg).toContain('Broken now — same-day (due 2026-06-10)');
    expect(msg).toContain('Notes: Tenant home after 4pm');
    expect(msg).toContain('Reply YES to confirm');
  });

  it('omits empty sections instead of printing blanks', () => {
    const msg = buildDispatchMessage({ propertyName: '99 Verify Ln', description: 'Fix the gate' });
    expect(msg).toContain('Work order — 99 Verify Ln');
    expect(msg).toContain('Job: Fix the gate');
    expect(msg).not.toContain('Priority:');
    expect(msg).not.toContain('Notes:');
    expect(msg).not.toMatch(/Where: *\n/);
  });

  it('falls back to due date alone when no urgency label', () => {
    const msg = buildDispatchMessage({ propertyName: 'X', description: 'Y', dueDate: '2026-07-01' });
    expect(msg).toContain('Due: 2026-07-01');
  });
});

describe('phone link builders', () => {
  it('normalizes formatted phone numbers', () => {
    expect(normalizePhone('(217) 555-0142')).toBe('2175550142');
    expect(normalizePhone('+1 217-555-0142')).toBe('+12175550142');
    expect(normalizePhone('')).toBe('');
  });

  it('builds tel: and sms: hrefs, empty when no phone', () => {
    expect(telHref('(217) 555-0142')).toBe('tel:2175550142');
    expect(telHref('')).toBe('');
    expect(smsHref('', 'body')).toBe('');
    const sms = smsHref('217-555-0142', 'Work order — line 1\nline 2');
    expect(sms.startsWith('sms:2175550142?&body=')).toBe(true);
    expect(sms).toContain(encodeURIComponent('Work order — line 1\nline 2'));
  });
});
