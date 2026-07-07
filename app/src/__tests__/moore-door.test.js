// @vitest-environment node
// moore-door + the moore ONE-CRM config — pinned (DR-0076 / DR-0081).
// The pricing shown to the Quad Cities is REAL (the in-app tier ladder) or
// absent (custom quote) — never invented; the moore pipeline is CONFIG on the
// one CRM backbone, and its capture forces the safe shape.
import { describe, it, expect } from 'vitest';
import { DOOR_TABS, POETECH_TIERS, PRICE_OUT_NEEDS, priceOut, DOOR_SOURCE, buildReorderNote } from '../lib/moore-door.js';
import { getBusiness, getPipeline, attributeSource, validateCapture, canOutreach } from '../lib/crm-engine.js';

describe('the door registry', () => {
  it('Moore Divahs is the FIRST tab, and PoeTech + the family businesses follow', () => {
    expect(DOOR_TABS[0].id).toBe('moore');
    const ids = DOOR_TABS.map((t) => t.id);
    expect(ids).toContain('practice');
    expect(ids).toContain('church');
    expect(ids).toContain('poetech');
  });
});

describe('pricing — real numbers only', () => {
  it('mirrors the in-app tier ladder exactly (foundation 0 → business 249)', () => {
    const byKey = Object.fromEntries(POETECH_TIERS.map((t) => [t.key, t.monthly]));
    expect(byKey).toEqual({ 'foundation': 0, 'poetech-plus': 39, 'family': 89, 'premium': 149, 'business': 249 });
  });
  it('price-out picks the lowest tier that covers every selected need', () => {
    expect(priceOut(['personal']).tier).toBe('foundation');
    expect(priceOut(['personal', 'family']).tier).toBe('family');
    expect(priceOut(['household', 'business']).tier).toBe('business');
    expect(priceOut(['household', 'business']).monthly).toBe(249);
  });
  it('a branded-app ask flags custom quote — never an invented build price', () => {
    const q = priceOut(['branded']);
    expect(q.customQuote).toBe(true);
    expect(q.note).toContain('custom quote');
    // and no need in the registry carries a made-up build dollar figure
    for (const n of PRICE_OUT_NEEDS) expect(n.buildPrice).toBeUndefined();
  });
  it('empty selection prices nothing (no painted number)', () => {
    expect(priceOut([]).tier).toBeNull();
    expect(priceOut([]).monthly).toBeNull();
  });
});

describe('one-click reorder — a past order becomes the next inquiry note', () => {
  it('carries what they had made and the prior order reference', () => {
    const note = buildReorderNote({ slug: 'mo-abc', description: 'Two teal scrub caps', product_type: 'scrub-cap' });
    expect(note).toBe('Order this again: Two teal scrub caps (prior order mo-abc)');
  });
  it('falls back to the product type when the description is empty', () => {
    expect(buildReorderNote({ slug: 'mo-x', description: '', product_type: 'custom-shoes' })).toContain('custom-shoes');
    expect(buildReorderNote(null)).toBe('');
  });
});

describe('the My-Orders lane (0087) — clients read THEIR OWN rows, never anon', () => {
  // Text-level pin on the migration contract (proven-to-catch: loosening the
  // lane — an anon grant, or dropping the uid/email guard — fails this).
  const fs = require('node:fs');
  const path = require('node:path');
  const sql = fs.readFileSync(path.join(__dirname, '../../../infra/supabase/migrations-auto/0087-moore-my-orders.sql'), 'utf8');
  it('read-own policies exist and are keyed to auth.uid()', () => {
    expect(sql).toMatch(/custom_orders_read_own[\s\S]*?customer_user_id = auth\.uid\(\)/);
    expect(sql).toMatch(/class_signups_read_own[\s\S]*?customer_user_id = auth\.uid\(\)/);
  });
  it('the RPCs require a signed-in caller and match only uid or own email', () => {
    expect(sql).toMatch(/auth\.uid\(\) IS NOT NULL/);
    expect(sql).toMatch(/lower\(o\.contact_value\) = lower\(auth\.email\(\)\)/);
  });
  it('anon can NEVER execute the history reads', () => {
    expect(sql).toMatch(/REVOKE EXECUTE ON FUNCTION public\.my_moore_orders\(\) FROM anon/);
    expect(sql).toMatch(/REVOKE EXECUTE ON FUNCTION public\.my_moore_class_seats\(\) FROM anon/);
    expect(sql).not.toMatch(/GRANT EXECUTE ON FUNCTION public\.my_moore_orders\(\) TO anon/);
  });
  it('the customer read exposes no steward-cost fields', () => {
    const fn = sql.slice(sql.indexOf('FUNCTION public.my_moore_orders'), sql.indexOf('FUNCTION public.my_moore_class_seats'));
    expect(fn).not.toContain('materials_cents');
    expect(fn).not.toContain('change_orders');
    expect(fn).not.toContain('inspo_notes');
  });
});

describe('moore rides the ONE CRM (DR-0081 — config, not a fork)', () => {
  it('business + pipeline are registered on the shared engine', () => {
    expect(getBusiness('moore')).toBeTruthy();
    expect(getBusiness('moore').label).toBe('Moore Divahs');
    const p = getPipeline('moore-orders');
    expect(p).toBeTruthy();
    expect(p.business).toBe('moore');
    expect(p.stages[0]).toBe('new');
  });
  it('the union source attributes cleanly', () => {
    expect(attributeSource('moore-divahs-app')).toBe('moore-divahs-app');
    expect(attributeSource('tiktok')).toBe('tiktok');
    expect(attributeSource('whats-going-on-qc')).toBe('whats-going-on-qc');
    expect(DOOR_SOURCE).toBe('moore-divahs-app');
  });
  it('anon capture is forced safe: first stage, source attributed, card fields stripped', () => {
    const res = validateCapture('moore-orders', {
      name: 'QC Customer', contactMethod: 'email', contactValue: 'c@example.com',
      source: 'moore-divahs-app', notes: 'two scrub caps',
      cardNumber: '4111-smuggled', stage: 'booked',
      consentOutreachOk: true, consentChannels: ['email'],
    }, { now: '2026-07-07T12:00:00.000Z', id: 'lead-test' });
    expect(res.ok).toBe(true);
    expect(res.lead.stage).toBe('new');                    // can never self-advance
    expect(res.lead.source).toBe('moore-divahs-app');      // the union data point
    expect(JSON.stringify(res.lead)).not.toContain('4111');
    expect(canOutreach(res.lead, 'email')).toBe(true);      // recorded consent, right channel
  });
});
