import { describe, it, expect } from 'vitest';
import {
  STATE_RULESETS, DEFAULT_STATE, listStates, getRuleset, rulesetCredentials,
  ceTopicOptions, mandatedTopic, GENERAL_TOPIC, makeCeEntry,
  topicDueAtRenewal, topicAppliesToCredential, applicableRequirement,
  cycleWindow, ceProgress, totalCeHours, CE_AS_OF, CE_IL_SOURCES,
} from '../lib/ceu-tracker.js';

const NOW = '2026-06-29T00:00:00.000Z'; // mid-cycle for Dec 1 2025 – Nov 30 2027

describe('multi-state ruleset architecture', () => {
  it('Illinois ships as the active/default ruleset', () => {
    expect(DEFAULT_STATE).toBe('IL');
    expect(getRuleset('IL').state).toBe('IL');
    // Unknown state falls back to the default (Illinois), never throws.
    expect(getRuleset('ZZ').state).toBe('IL');
  });

  it('a state is configurable DATA: every key the engine reads is on the ruleset', () => {
    const il = STATE_RULESETS.IL;
    expect(il.totalHours).toBe(30);
    expect(il.cycleMonths).toBe(24);
    expect(il.renewal.month).toBe(11);
    expect(il.renewal.day).toBe(30);
    expect(il.renewal.yearParity).toBe('odd');
    expect(il.firstRenewalExempt).toBe(true);
    expect(il.approvedProviderRule.numberFormat).toBe('159.xxxxxx');
    expect(Array.isArray(il.mandatedTopics)).toBe(true);
  });

  it('a NEW state plugs in with no engine change (proves extensibility)', () => {
    // Model a minimal hypothetical state ruleset and run the SAME engine over it.
    const fakeWI = {
      state: 'WI', stateName: 'Wisconsin', credentials: ['LCSW'],
      totalHours: 30, cycleMonths: 24,
      renewal: { month: 2, day: 28, yearParity: 'even' },
      firstRenewalExempt: false,
      approvedProviderRule: { required: false },
      mandatedTopics: [{ key: 'ethics', label: 'Ethics', hours: 4, appliesTo: ['LCSW'], cadence: 'every-cycle', countsTowardTotal: true }],
    };
    const prog = ceProgress([], fakeWI, { credential: 'LCSW', renewalNumber: 2, now: NOW });
    expect(prog.totalRequired).toBe(30);
    expect(prog.perTopic[0].label).toBe('Ethics');
    expect(prog.perTopic[0].required).toBe(4);
    // Even-year parity → Feb 28 of an even year, in the future of NOW (2026).
    expect(prog.renewalDate.startsWith('2028-02-28')).toBe(true);
  });

  it('listStates surfaces the confirmed flag (IL not yet SME-ratified)', () => {
    const il = listStates().find((s) => s.state === 'IL');
    expect(il.confirmed).toBe(false);
    expect(rulesetCredentials(getRuleset('IL'))).toEqual(['LSW', 'LCSW']);
  });
});

describe('Illinois CE figures (research-grounded, cited)', () => {
  it('30 hours per 2-year cycle, expiring Nov 30 of an ODD year', () => {
    const cycle = cycleWindow(getRuleset('IL'), NOW);
    expect(cycle.renewalDate.startsWith('2027-11-30')).toBe(true); // odd year, not 2026
    // cycle start is 24 months before → Nov 30 2025
    expect(cycle.cycleStart.startsWith('2025-11-30')).toBe(true);
    expect(cycle.daysUntilRenewal).toBeGreaterThan(0);
  });

  it('carries the mandated topic minimums verified from IDFPR sources', () => {
    const byKey = Object.fromEntries(STATE_RULESETS.IL.mandatedTopics.map((t) => [t.key, t]));
    expect(byKey.ethics.hours).toBe(3);
    expect(byKey['cultural-competence'].hours).toBe(3);
    expect(byKey['sexual-harassment'].hours).toBe(1);
    expect(byKey['implicit-bias'].hours).toBe(1);
    expect(byKey.alzheimers.hours).toBe(1);
    expect(byKey['clinical-supervision'].hours).toBe(6);
  });

  it('every mandated topic cites a source (no uncited figure ships)', () => {
    for (const t of STATE_RULESETS.IL.mandatedTopics) {
      expect(typeof t.source).toBe('string');
      expect(t.source.length).toBeGreaterThan(0);
    }
    expect(CE_IL_SOURCES.length).toBeGreaterThanOrEqual(4);
    expect(CE_AS_OF).toBe('2026-06-29');
  });

  it('the ruleset is flagged SME-unconfirmed until Christina ratifies', () => {
    expect(STATE_RULESETS.IL.confirmed).toBe(false);
    // The uncertain figures carry an explicit smeConfirm note.
    const sh = mandatedTopic(getRuleset('IL'), 'sexual-harassment');
    expect(sh.smeConfirm).toBeTruthy();
  });
});

describe('credential scoping', () => {
  it('clinical-supervision is LCSW-only — an LSW never sees it', () => {
    const lswTopics = ceTopicOptions(getRuleset('IL'), 'LSW').map((t) => t.key);
    expect(lswTopics).not.toContain('clinical-supervision');
    const lcswTopics = ceTopicOptions(getRuleset('IL'), 'LCSW').map((t) => t.key);
    expect(lcswTopics).toContain('clinical-supervision');
  });

  it('topic options always lead with General CE', () => {
    expect(ceTopicOptions(getRuleset('IL'), 'LCSW')[0].key).toBe(GENERAL_TOPIC);
  });

  it('topicAppliesToCredential: empty appliesTo means all', () => {
    expect(topicAppliesToCredential({ appliesTo: [] }, 'LSW')).toBe(true);
    expect(topicAppliesToCredential({ appliesTo: ['LCSW'] }, 'LSW')).toBe(false);
  });
});

describe('cadence (periodic mandated topics modeled as data)', () => {
  it('every-cycle is always due', () => {
    expect(topicDueAtRenewal('every-cycle', 2)).toBe(true);
    expect(topicDueAtRenewal('every-cycle', 5)).toBe(true);
  });
  it('one-time-at-second is due only at the second renewal', () => {
    expect(topicDueAtRenewal('one-time-at-second', 1)).toBe(false);
    expect(topicDueAtRenewal('one-time-at-second', 2)).toBe(true);
    expect(topicDueAtRenewal('one-time-at-second', 3)).toBe(false);
  });
  it('everyCycles:3 from renewal 2 → due at 2, 5, 8 (Alzheimer cadence)', () => {
    const c = { everyCycles: 3, fromRenewal: 2 };
    expect(topicDueAtRenewal(c, 1)).toBe(false);
    expect(topicDueAtRenewal(c, 2)).toBe(true);
    expect(topicDueAtRenewal(c, 3)).toBe(false);
    expect(topicDueAtRenewal(c, 5)).toBe(true);
    expect(topicDueAtRenewal(c, 8)).toBe(true);
  });
});

describe('first-renewal exemption', () => {
  it('renewal #1 requires zero CE and reports exempt', () => {
    const req = applicableRequirement(getRuleset('IL'), { credential: 'LCSW', renewalNumber: 1 });
    expect(req.exempt).toBe(true);
    expect(req.totalHours).toBe(0);
    const prog = ceProgress([], getRuleset('IL'), { credential: 'LCSW', renewalNumber: 1, now: NOW });
    expect(prog.exempt).toBe(true);
    expect(prog.complete).toBe(true);   // nothing required → satisfied
    expect(prog.totalPct).toBe(100);
    expect(prog.perTopic.length).toBe(0); // no topics due during the exempt renewal
  });
});

describe('progress is DERIVED from real entries', () => {
  const il = getRuleset('IL');
  const entries = [
    makeCeEntry({ id: 'a', date: '2026-03-01', hours: 3, topic: 'ethics', provider: 'NASW-IL', approvalNumber: '159.001540' }),
    makeCeEntry({ id: 'b', date: '2026-03-02', hours: 3, topic: 'cultural-competence' }),
    makeCeEntry({ id: 'c', date: '2026-03-03', hours: 1, topic: 'sexual-harassment' }),
    makeCeEntry({ id: 'd', date: '2026-03-04', hours: 10, topic: GENERAL_TOPIC }),
  ];

  it('totals all in-cycle hours and tracks each mandated topic', () => {
    const p = ceProgress(entries, il, { credential: 'LCSW', renewalNumber: 2, now: NOW });
    expect(p.totalLogged).toBe(17);          // 3+3+1+10
    expect(p.totalRequired).toBe(30);
    expect(p.totalRemaining).toBe(13);
    const ethics = p.perTopic.find((t) => t.key === 'ethics');
    expect(ethics.logged).toBe(3);
    expect(ethics.met).toBe(true);
    const cs = p.perTopic.find((t) => t.key === 'clinical-supervision');
    expect(cs.logged).toBe(0);
    expect(cs.met).toBe(false);              // 6 hrs not yet logged
    expect(p.complete).toBe(false);          // total < 30 and topics unmet
  });

  it('a mandated-topic hour ALSO counts toward the 30 total (no double-spend penalty)', () => {
    const p = ceProgress(entries, il, { credential: 'LCSW', renewalNumber: 2, now: NOW });
    // ethics 3h appears in both the ethics topic AND the 17h total
    expect(p.perTopic.find((t) => t.key === 'ethics').logged).toBe(3);
    expect(p.totalLogged).toBe(17);
  });

  it('hours OUTSIDE the cycle window are excluded from the total', () => {
    const stale = [...entries, makeCeEntry({ id: 'old', date: '2024-01-01', hours: 20, topic: GENERAL_TOPIC })];
    const p = ceProgress(stale, il, { credential: 'LCSW', renewalNumber: 2, now: NOW });
    expect(p.entriesTotal).toBe(5);
    expect(p.entriesInCycle).toBe(4);        // the 2024 entry is before cycle start
    expect(p.totalLogged).toBe(17);          // stale 20h NOT counted
  });

  it('a fully-satisfied LCSW cycle reports complete', () => {
    const full = [
      makeCeEntry({ date: '2026-05-01', hours: 3, topic: 'ethics' }),
      makeCeEntry({ date: '2026-05-02', hours: 3, topic: 'cultural-competence' }),
      makeCeEntry({ date: '2026-05-03', hours: 1, topic: 'sexual-harassment' }),
      makeCeEntry({ date: '2026-05-04', hours: 1, topic: 'implicit-bias' }),
      makeCeEntry({ date: '2026-05-05', hours: 1, topic: 'alzheimers' }),
      makeCeEntry({ date: '2026-05-06', hours: 6, topic: 'clinical-supervision' }),
      makeCeEntry({ date: '2026-05-07', hours: 15, topic: GENERAL_TOPIC }),
    ];
    const p = ceProgress(full, il, { credential: 'LCSW', renewalNumber: 2, now: NOW });
    expect(p.totalLogged).toBe(30);
    expect(p.allTopicsMet).toBe(true);
    expect(p.complete).toBe(true);
    expect(p.totalPct).toBe(100);
  });

  it('an LSW at renewal 2 has no clinical-supervision requirement', () => {
    const p = ceProgress(entries, il, { credential: 'LSW', renewalNumber: 2, now: NOW });
    expect(p.perTopic.find((t) => t.key === 'clinical-supervision')).toBeUndefined();
  });
});

describe('entry factory + helpers', () => {
  it('makeCeEntry defaults topic to general and clamps hours', () => {
    const e = makeCeEntry({ hours: -5 });
    expect(e.topic).toBe(GENERAL_TOPIC);
    expect(e.hours).toBe(0);
    expect(e.provider).toBe('');
  });
  it('approval number is carried as plain metadata', () => {
    const e = makeCeEntry({ approvalNumber: '159.001540' });
    expect(e.approvalNumber).toBe('159.001540');
  });
  it('totalCeHours sums every entry regardless of cycle', () => {
    expect(totalCeHours([{ hours: 2 }, { hours: 3.5 }])).toBe(5.5);
  });
});

describe('cycleWindow edge cases', () => {
  it('returns null fields (and counts all entries) when now is missing', () => {
    const c = cycleWindow(getRuleset('IL'), null);
    expect(c.renewalDate).toBeNull();
    // with no window, ceProgress counts all entries
    const p = ceProgress([makeCeEntry({ date: '2020-01-01', hours: 5, topic: GENERAL_TOPIC })], getRuleset('IL'), { now: null });
    expect(p.totalLogged).toBe(5);
  });
});
