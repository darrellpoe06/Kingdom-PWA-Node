// referral-ops — proven-to-catch tests. Guards the referral database's real
// derivations (nothing painted), the NO-PHI boundary, the daily/weekly roll-ups,
// the geographic + category taxonomy, and the inbound-learns-outbound signal.
import { describe, it, expect } from 'vitest';
import {
  makeOrg, makePost, validateOrg, REFERRAL_CATEGORIES, GEO_CIRCLES,
  categoryForDay, orgStats, followUpsDue, dailyReport, weeklyProgress, networkGoal,
  topConvertingSources, CONTENT_THEMES, WEEKLY_TARGETS, DAILY_ROTATION,
  ARI_AUTOMATION_PATH, OUTBOUND_CONSTRAINTS, NO_PHI_NOTE, mergeSeed, SEED_ORGS,
} from '../lib/referral-ops.js';

const NOW = '2026-07-13T18:00:00.000Z'; // a Monday
const org = (over = {}) => makeOrg({ organization: 'Sample Office', categoryId: 'medical', circle: 'Champaign-Urbana', ...over }, { now: NOW });

describe('referral-ops — the referral SOURCE model (NO PHI)', () => {
  it('states the no-PHI boundary: referral sources, never clients', () => {
    expect(NO_PHI_NOTE).toMatch(/never clients/i);
    expect(NO_PHI_NOTE).toMatch(/protected health information/i);
  });
  it('an org normalizes to the full spreadsheet schema + validates on name/category', () => {
    const o = org({ email: 'a@b.com', flyerSent: true });
    expect(o.organization).toBe('Sample Office');
    expect(o.outcomeId).toBe('none');
    expect(o.clientsReferred).toBe(0);
    expect(validateOrg({ organization: '', categoryId: 'medical' }).ok).toBe(false);
    expect(validateOrg({ organization: 'X', categoryId: 'nope' }).ok).toBe(false);
    expect(validateOrg({ organization: 'X', categoryId: 'medical' }).ok).toBe(true);
  });
});

describe('referral-ops — the taxonomy + geographic circles', () => {
  it('has the five referral-source categories, each with search ideas', () => {
    expect(REFERRAL_CATEGORIES.map((c) => c.id)).toEqual(['medical', 'education', 'community', 'business', 'legal']);
    for (const c of REFERRAL_CATEGORIES) expect(c.searches.length).toBeGreaterThan(0);
  });
  it('builds in circles — Champaign-Urbana is first', () => {
    expect(GEO_CIRCLES[0].name).toBe('Champaign-Urbana');
    expect(GEO_CIRCLES[0].order).toBe(0);
  });
  it('rotates one category a day; Monday is medical', () => {
    expect(DAILY_ROTATION[1]).toBe('medical');
    expect(categoryForDay(NOW).id).toBe('medical'); // NOW is a Monday
  });
});

describe('referral-ops — derived roll-ups (real records, nothing painted)', () => {
  const orgs = [
    org({ id: 'a', addedIso: NOW, emailedOn: NOW, outcomeId: 'interested', circle: 'Champaign-Urbana' }),
    org({ id: 'b', addedIso: NOW, calledOn: NOW, outcomeId: 'call-back', followUpOn: '2026-07-01T00:00:00.000Z', circle: 'Danville' }),
    org({ id: 'c', addedIso: '2026-06-01T00:00:00.000Z', outcomeId: 'none', flyerSent: true }),
  ];
  it('orgStats counts totals, by category, by circle, flyers, and warm leads', () => {
    const s = orgStats(orgs);
    expect(s.total).toBe(3);
    expect(s.byCircle['Champaign-Urbana']).toBe(2);
    expect(s.byCircle.Danville).toBe(1);
    expect(s.flyersSent).toBe(1);
    expect(s.interested).toBe(1); // only the 'interested' one is a "good" outcome
  });
  it('the daily report counts only TODAY’s real activity', () => {
    const r = dailyReport(orgs, [makePost({ createdIso: NOW })], NOW);
    expect(r.contactsAdded).toBe(2);  // a + b added today; c was June
    expect(r.emailsSent).toBe(1);
    expect(r.callsMade).toBe(1);
    expect(r.postsCreated).toBe(1);
  });
  it('follow-ups due surfaces only past-due, still-open contacts', () => {
    const due = followUpsDue(orgs, NOW);
    expect(due.map((o) => o.id)).toEqual(['b']); // b's follow-up is overdue + open
  });
  it('weekly progress measures actuals against the target minimums', () => {
    const w = weeklyProgress(orgs, [], NOW);
    expect(w.contacts.n).toBe(2);
    expect(w.contacts.min).toBe(WEEKLY_TARGETS.contacts.min);
    expect(w.emails.n).toBe(1);
  });
  it('network goal tracks toward the 2,500 floor', () => {
    expect(networkGoal(orgs).total).toBe(3);
    expect(networkGoal(orgs).low).toBe(2500);
  });
});

describe('referral-ops — inbound learns outbound (attribution)', () => {
  it('ranks the sources that actually refer clients, and rolls up by category', () => {
    const orgs = [
      org({ id: 'x', categoryId: 'community', clientsReferred: 5 }),
      org({ id: 'y', categoryId: 'medical', clientsReferred: 2 }),
      org({ id: 'z', categoryId: 'medical', clientsReferred: 0 }),
    ];
    const t = topConvertingSources(orgs);
    expect(t.totalReferred).toBe(7);
    expect(t.sources[0].id).toBe('x');          // most-converting first
    expect(t.byCategory.community).toBe(5);
    expect(t.byCategory.medical).toBe(2);
  });
  it('the automation path is staged, and only stage 1 is built', () => {
    expect(ARI_AUTOMATION_PATH[0].built).toBe(true);
    expect(ARI_AUTOMATION_PATH.slice(1).every((s) => !s.built)).toBe(true);
    expect(ARI_AUTOMATION_PATH).toHaveLength(4);
  });
  it('the real constraints are external (law, deliverability, verification, human, attribution, licensure)', () => {
    const ids = OUTBOUND_CONSTRAINTS.map((c) => c.id);
    expect(ids).toContain('compliance');
    expect(ids).toContain('deliverability');
    expect(ids).toContain('verification');
    expect(ids).toContain('human-touch');
  });
});

describe('referral-ops — content + seed integrity', () => {
  it('carries the seven weekly content themes', () => {
    expect(CONTENT_THEMES).toHaveLength(7);
    expect(CONTENT_THEMES[0].theme).toBe('Mental Health Monday');
  });
  it('seed orgs are seed-prefixed and merge as baseline (user rows win)', () => {
    expect(SEED_ORGS.every((o) => o.id.startsWith('seed-'))).toBe(true);
    const merged = mergeSeed([{ id: 'seed-org-01', organization: 'Edited' }], SEED_ORGS);
    expect(merged.find((o) => o.id === 'seed-org-01').organization).toBe('Edited');
    expect(merged).toHaveLength(SEED_ORGS.length);
  });
  it('the seed renders a real derived network with real attribution', () => {
    const s = orgStats(SEED_ORGS);
    expect(s.total).toBe(SEED_ORGS.length);
    expect(topConvertingSources(SEED_ORGS).totalReferred).toBeGreaterThan(0);
  });
});
