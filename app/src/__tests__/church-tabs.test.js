// =============================================================================
// church-tabs — THE PRESERVATION GATE of the Love Corner redesign (2026-11-12)
// =============================================================================
// The brief: "Do not eliminate existing tabs or merge their underlying
// functionality." The sub-tab list moved out of the shell into
// lib/church-tabs.jsx so the strip, the phone's bar and its More sheet draw
// ONE list (DR-0677). This test pins that list against nav-history's
// VALID_CHURCH_SUBS and the surface registry: drop or rename a tab anywhere
// and this goes red (proven-to-catch below).
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { churchSubTabs, churchTabGroups, CHURCH_TAB_GROUPS, CHURCH_TAB_WORDS, CHURCH_TAB_ICONS, CHURCH_BOTTOM_NAV } from '../lib/church-tabs.jsx';
import { VALID_CHURCH_SUBS } from '../lib/nav-history.js';
import { SURFACES } from '../surfaces.js';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..');
const ids = (pairs) => pairs.map(([id]) => id);
const FULL = { signedIn: true, reviewerMode: false, officeRole: 'owner', isChurchStaff: true };

// Reached from Learn, not from the strip (as before the redesign).
const NOT_ON_STRIP = ['eternal-algorithms'];

describe('every Church sub-tab survives the redesign', () => {
  it('a full viewer (signed in, office, staff) sees EVERY valid sub except the ones Learn opens', () => {
    const got = ids(churchSubTabs(FULL));
    const want = VALID_CHURCH_SUBS.filter((s) => !NOT_ON_STRIP.includes(s));
    expect([...got].sort()).toEqual([...want].sort());
    expect(new Set(got).size).toBe(got.length);
  });
  it('the public viewer sees the public tabs and none of the gated ones', () => {
    const got = ids(churchSubTabs({}));
    expect(got).toEqual(['home', 'ministries', 'pulpit', 'scripture', 'engagement', 'choir', 'bus', 'program', 'learn', 'institute', 'conference', 'events', 'projects']);
    for (const gated of ['my-record', 'access', 'members', 'giving-book', 'harvest', 'videowall', 'devices', 'infra-plan', 'observe']) expect(got).not.toContain(gated);
  });
  it('the gates still gate: signed-in adds the member tabs; office adds the Giving Book; reviewer mode hides it; staff adds the office tools', () => {
    expect(ids(churchSubTabs({ signedIn: true }))).toEqual(expect.arrayContaining(['my-record', 'access', 'members']));
    expect(ids(churchSubTabs({ signedIn: true, officeRole: 'admin' }))).toContain('giving-book');
    expect(ids(churchSubTabs({ signedIn: true, officeRole: 'admin', reviewerMode: true }))).not.toContain('giving-book');
    expect(ids(churchSubTabs({ isChurchStaff: true }))).toEqual(expect.arrayContaining(['harvest', 'videowall', 'devices', 'infra-plan', 'observe']));
  });
  it('every sub-tab the list can show is a registered surface the shell mounts', () => {
    const subs = new Set(SURFACES.filter((s) => s.nav === 'church').map((s) => s.sub));
    for (const id of ids(churchSubTabs(FULL))) expect(subs, id).toContain(id);
  });
  it('the shell draws the strip AND the phone bar from this one list', () => {
    const shell = readFileSync(join(SRC, 'poe-financial-mvp-v28.jsx'), 'utf8');
    expect((shell.match(/churchSubTabs\(\{/g) || []).length).toBe(2);
    expect(shell).not.toMatch(/\[\['home','Church'\]/);
  });
  it('PROVEN-TO-CATCH: a list missing one valid sub fails the full-viewer check', () => {
    const got = ids(churchSubTabs(FULL)).filter((id) => id !== 'choir');
    const want = VALID_CHURCH_SUBS.filter((s) => !NOT_ON_STRIP.includes(s));
    expect([...got].sort()).not.toEqual([...want].sort());
  });
});

describe('the phone groups every tab, names every tab, and the bar opens real subs', () => {
  it('every id in every group is a valid sub, and no valid sub is missing from the groups', () => {
    const grouped = CHURCH_TAB_GROUPS.flatMap((g) => g.ids);
    for (const id of grouped) expect(VALID_CHURCH_SUBS, id).toContain(id);
    for (const id of VALID_CHURCH_SUBS) expect(grouped, id).toContain(id);
    expect(new Set(grouped).size).toBe(grouped.length);
  });
  it('churchTabGroups keeps every pair exactly once and drops empty groups', () => {
    const pairs = churchSubTabs({});
    const groups = churchTabGroups(pairs);
    const flat = groups.flatMap((g) => g.items.map(([id]) => id));
    expect([...flat].sort()).toEqual([...ids(pairs)].sort());
    expect(groups.map((g) => g.key)).toEqual(['worship', 'ministries', 'learning', 'campus']);
    expect(groups[2].items).toEqual([['learn', 'Learn'], ['institute', 'TLC Theological Institute']]);
  });
  it('an id the groups do not know is never hidden: it lands in the first group', () => {
    const groups = churchTabGroups([['home', 'Church'], ['brand-new', 'Brand New']]);
    expect(groups[0].items.map(([id]) => id)).toContain('brand-new');
  });
  it('every valid sub has plain words and an icon', () => {
    for (const id of VALID_CHURCH_SUBS) { expect(CHURCH_TAB_WORDS[id], id).toBeTruthy(); expect(CHURCH_TAB_ICONS[id], id).toBeTruthy(); }
    expect(CHURCH_TAB_WORDS.events).toBe('Campus Rentals');
  });
  it('the bottom bar is Home · Watch · Word, each a valid sub; Watch opens the Worship section', () => {
    expect(CHURCH_BOTTOM_NAV.map((t) => t.words)).toEqual(['Home', 'Watch', 'Word']);
    for (const t of CHURCH_BOTTOM_NAV) expect(VALID_CHURCH_SUBS).toContain(t.churchView);
    expect(CHURCH_BOTTOM_NAV[1]).toMatchObject({ churchView: 'home', section: 'worship' });
  });
});
