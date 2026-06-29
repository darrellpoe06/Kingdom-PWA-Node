import { describe, it, expect } from 'vitest';
import {
  roleLabel, scopeLabel, daysAgo, relativeTime,
  summarize, countByRole, groupByScope, newVsReturning,
  activityRollup, buildFreshness, membersWithoutPresence, pendingInvites,
} from '../lib/access-metrics.js';

// Fixed clock for determinism.
const NOW = Date.parse('2026-06-29T12:00:00Z');
const iso = (daysBack) => new Date(NOW - daysBack * 86400000).toISOString();

const INSTANCES = [
  { id: 'inst-fam', slug: 'poe-family', displayName: 'Poe Family', instanceType: 'family' },
  { id: 'inst-colg', slug: 'colg', displayName: 'Church of the Living God', instanceType: 'church' },
];

const MEMBERS = [
  { id: 'm1', instanceId: 'inst-fam', userId: 'u-darrell', role: 'owner', displayName: 'Darrell', title: 'Founder', joinedAt: iso(400) },
  { id: 'm2', instanceId: 'inst-fam', userId: 'u-christina', role: 'admin', displayName: 'Christina', joinedAt: iso(390) },
  { id: 'm3', instanceId: 'inst-colg', userId: 'u-darrell', role: 'owner', displayName: 'Darrell', joinedAt: iso(300) },
  { id: 'm4', instanceId: 'inst-colg', userId: 'u-bg', role: 'admin', displayName: 'Bishop Gwin', joinedAt: iso(10) },
  { id: 'm5', instanceId: 'inst-colg', userId: 'u-vol', role: 'member', displayName: 'Volunteer', joinedAt: iso(2) },
];

describe('role + scope labels (servant-king vocabulary)', () => {
  it('maps DB roles to servant-king labels', () => {
    expect(roleLabel('owner')).toBe('Owner');
    expect(roleLabel('admin')).toBe('Steward-Admin');
    expect(roleLabel('specialist')).toBe('Builder');
    expect(roleLabel('member')).toBe('Member');
    expect(roleLabel('viewer')).toBe('User');
    expect(roleLabel('weird')).toBe('weird'); // unknown passes through
  });
  it('maps instance types to business/ministry labels', () => {
    expect(scopeLabel('family')).toBe('Family circle');
    expect(scopeLabel('church')).toBe('Church');
    expect(scopeLabel('therapy-practice')).toBe('TLC / Practice');
  });
});

describe('time helpers (nowMs injected)', () => {
  it('computes whole days ago', () => {
    expect(daysAgo(iso(3), NOW)).toBe(3);
    expect(daysAgo(null, NOW)).toBeNull();
    expect(daysAgo('not-a-date', NOW)).toBeNull();
  });
  it('renders relative time', () => {
    expect(relativeTime(iso(0), NOW)).toBe('today');
    expect(relativeTime(iso(1), NOW)).toBe('yesterday');
    expect(relativeTime(iso(3), NOW)).toBe('3d ago');
    expect(relativeTime(iso(14), NOW)).toBe('2w ago');
    expect(relativeTime(null, NOW)).toBe('unknown');
  });
});

describe('summarize — unique people vs memberships', () => {
  it('counts a person in two instances once', () => {
    const s = summarize(MEMBERS);
    expect(s.totalPeople).toBe(4);       // darrell, christina, bg, vol
    expect(s.totalMemberships).toBe(5);  // darrell counted twice as membership
  });
  it('handles empty input', () => {
    expect(summarize([])).toEqual({ totalPeople: 0, totalMemberships: 0 });
  });
});

describe('countByRole — by highest role per person, servant-king order', () => {
  it('dedupes to highest role and orders by rank', () => {
    const r = countByRole(MEMBERS);
    // darrell=owner, christina=admin, bg=admin, vol=member
    expect(r).toEqual([
      { role: 'owner', label: 'Owner', count: 1 },
      { role: 'admin', label: 'Steward-Admin', count: 2 },
      { role: 'member', label: 'Member', count: 1 },
    ]);
  });
});

describe('groupByScope — roster grouped by instance', () => {
  it('groups members under their instance with scope label', () => {
    const g = groupByScope(MEMBERS, INSTANCES);
    const colg = g.find((x) => x.instanceId === 'inst-colg');
    const fam = g.find((x) => x.instanceId === 'inst-fam');
    expect(colg.count).toBe(3);
    expect(colg.scopeLabel).toBe('Church');
    expect(fam.scopeLabel).toBe('Family circle');
    // largest circle first
    expect(g[0].instanceId).toBe('inst-colg');
    // members sorted by role rank (owner first)
    expect(colg.members[0].role).toBe('owner');
  });
});

describe('newVsReturning', () => {
  it('splits by earliest join within window', () => {
    const r = newVsReturning(MEMBERS, NOW, 30);
    // bg joined 10d ago, vol 2d ago => new; darrell+christina older => returning
    expect(r.newCount).toBe(2);
    expect(r.returningCount).toBe(2);
  });
});

describe('activityRollup — from presence heartbeats', () => {
  const PRESENCE = [
    { instanceId: 'inst-fam', userId: 'u-darrell', lastSeenAt: iso(0) },   // active
    { instanceId: 'inst-colg', userId: 'u-darrell', lastSeenAt: iso(20) }, // older dup, ignored
    { instanceId: 'inst-colg', userId: 'u-bg', lastSeenAt: iso(15) },      // idle
    { instanceId: 'inst-colg', userId: 'u-vol', lastSeenAt: iso(45) },     // dormant
  ];
  it('classifies by most-recent heartbeat per person', () => {
    const a = activityRollup(PRESENCE, NOW);
    expect(a.reporting).toBe(3);
    expect(a.active).toBe(1);   // darrell (today)
    expect(a.idle).toBe(1);     // bg (15d)
    expect(a.dormant).toBe(1);  // vol (45d)
  });
  it('handles no presence', () => {
    expect(activityRollup([], NOW)).toMatchObject({ active: 0, idle: 0, dormant: 0, reporting: 0 });
  });
});

describe('buildFreshness — rollout management', () => {
  const PRESENCE = [
    { userId: 'u-darrell', displayName: 'Darrell', buildSha: 'aaa1111', buildTime: iso(1), lastSeenAt: iso(0) },
    { userId: 'u-bg', displayName: 'Bishop Gwin', buildSha: 'old0000', buildTime: iso(10), lastSeenAt: iso(3) },
    { userId: 'u-vol', displayName: 'Volunteer', buildSha: 'aaa1111', buildTime: iso(1), lastSeenAt: iso(2) },
  ];
  it('picks the newest build as latest and classifies each person', () => {
    const f = buildFreshness(PRESENCE);
    expect(f.latestSha).toBe('aaa1111');
    expect(f.onLatestCount).toBe(2);  // darrell + vol
    expect(f.behindCount).toBe(1);    // bg on old0000
    expect(f.behind[0].displayName).toBe('Bishop Gwin');
  });
  it('empty presence yields no latest', () => {
    expect(buildFreshness([])).toMatchObject({ latestSha: null, onLatestCount: 0, behindCount: 0, reporting: 0 });
  });
});

describe('membersWithoutPresence — honest unknowns', () => {
  it('lists people with a membership but no heartbeat', () => {
    const presence = [{ userId: 'u-darrell' }];
    const out = membersWithoutPresence(MEMBERS, presence);
    const ids = out.map((m) => m.userId).sort();
    expect(ids).toEqual(['u-bg', 'u-christina', 'u-vol']);
  });
});

describe('pendingInvites', () => {
  it('keeps only invited status, newest first', () => {
    const invites = [
      { id: 'i1', displayName: 'Alice', type: 'volunteer', inviteStatus: 'invited', invitedAt: iso(5) },
      { id: 'i2', displayName: 'Bob', type: 'parishioner', inviteStatus: 'accepted', invitedAt: iso(9) },
      { id: 'i3', displayName: 'Carol', type: 'donor', inviteStatus: 'invited', invitedAt: iso(1) },
    ];
    const p = pendingInvites(invites);
    expect(p.map((x) => x.displayName)).toEqual(['Carol', 'Alice']); // newest first, accepted dropped
  });
});
