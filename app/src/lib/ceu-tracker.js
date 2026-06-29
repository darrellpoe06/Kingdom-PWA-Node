// =============================================================================
// ceu-tracker — post-license CONTINUING-EDUCATION (CE/CEU) renewal tracker
// =============================================================================
// Declared by Darrell 2026-06-29: "Illinois continuing education units (CEUs) for
// MSW based on laws — and eventually other states based on their laws."
//
// THIS IS DISTINCT FROM THE SUPERVISED-HOURS LEDGER. lib/practice-academy.js tracks
// PRE-LICENSURE supervised clinical experience on the MSW → LCSW path. This module
// tracks POST-LICENSE CONTINUING EDUCATION a licensed social worker must complete to
// RENEW the license each cycle. Same Practice training system, two different ledgers.
//
// MULTI-STATE BY ARCHITECTURE. Each state's CE law is modeled as CONFIGURABLE DATA — a
// ruleset: total hours, cycle length, renewal date, mandated topics + their hours, the
// approved-provider rule. Illinois ships now as the active/default ruleset. Other
// states plug in later by ADDING a ruleset to STATE_RULESETS — no engine rebuild. The
// tracker reads whichever state's ruleset is active.
//
// RESEARCH-GROUNDED, SME-RATIFIED (DR-0076 verification doctrine). The Illinois values
// below come from primary IDFPR / Illinois Administrative Code sources (cited inline,
// as-of 2026-06-29). They are flagged `confirmed: false` until Christina (LCSW) ratifies
// the exact specifics — values are research-grounded, NOT fabricated, and the open
// questions are named in `smeConfirm`. See CE_IL_SOURCES.
//
// HOURS ARE TRACKED; the provider/approval is just metadata. The approved-provider rule
// is stated ONCE, neutrally, as a data field (approvedProviderRule) — not moralized.
//
// PURE + DETERMINISTIC: callers pass `now` (ISO). No Date.now() / Math.random() that
// would make a total un-reproducible. Totals are DERIVED from the licensee's own logged
// entries, never painted.
// =============================================================================

// The as-of date for every figure in this file. Surfaced in-app so a stale ruleset is
// visible, not silent (the IDFPR rules are revised periodically).
export const CE_AS_OF = '2026-06-29';

// Primary sources for the Illinois ruleset (cited so any value is traceable).
export const CE_IL_SOURCES = [
  { label: 'IDFPR CE Fact Sheet — LSW & LCSW (rev. 7/24)', url: 'https://idfpr.illinois.gov/content/dam/soi/en/web/idfpr/forms/dpr/ce-sw.pdf' },
  { label: '68 Ill. Adm. Code 1470.95 — Continuing Education (social work)', url: 'https://www.ilga.gov/commission/jcar/admincode/068/068014700000950R.html' },
  { label: '68 Ill. Adm. Code 1470 — full Part (renewal / expiration)', url: 'https://www.ilga.gov/agencies/JCAR/EntirePart?titlepart=06801470' },
  { label: '68 Ill. Adm. Code 1130.400 — Sexual Harassment Prevention (eff. June 1, 2026)', url: 'https://www.ilga.gov/commission/jcar/admincode/068/068011300E04000R.html' },
  { label: 'IDFPR Continuing Education (cross-profession topics)', url: 'https://idfpr.illinois.gov/dpr/continuing-education.html' },
  { label: 'IDFPR Social Work CE Sponsor Application (f1620sw, 5/24)', url: 'https://idfpr.illinois.gov/content/dam/soi/en/web/idfpr/renewals/apply/forms/f1620sw.pdf' },
];

// The general (non-mandated) topic bucket — ordinary CE hours that count toward the
// total but not toward any specific mandated minimum.
export const GENERAL_TOPIC = 'general';

// ---------------------------------------------------------------------------
// CADENCE — how often a mandated topic is due, modeled as data so periodic
// requirements (e.g. "once every 3 renewals") need no special-case code.
//   'every-cycle'         — required every renewal cycle.
//   'one-time-at-second'  — a one-time requirement satisfied at the second renewal.
//   { everyCycles, fromRenewal } — required at `fromRenewal`, then every N cycles.
// ---------------------------------------------------------------------------
export function topicDueAtRenewal(cadence, renewalNumber) {
  const n = Number(renewalNumber) || 0;
  if (cadence === 'every-cycle' || cadence == null) return true;
  if (cadence === 'one-time-at-second') return n === 2;
  if (cadence && typeof cadence === 'object' && cadence.everyCycles) {
    const from = Number(cadence.fromRenewal) || 2;
    return n >= from && (n - from) % Number(cadence.everyCycles) === 0;
  }
  return true;
}

export function topicAppliesToCredential(topic, credential) {
  if (!topic) return false;
  const applies = topic.appliesTo;
  if (!applies || !applies.length) return true;
  return applies.includes(credential);
}

// ===========================================================================
// STATE RULESETS — the configurable-data heart of the multi-state architecture.
// Add a state by adding a key here; the engine reads it unchanged.
// ===========================================================================
export const STATE_RULESETS = {
  IL: {
    state: 'IL',
    stateName: 'Illinois',
    label: 'Illinois — IDFPR',
    agency: 'IDFPR (Illinois Dept. of Financial & Professional Regulation)',
    credentials: ['LSW', 'LCSW'],
    totalHours: 30,                // CE contact hours per renewal cycle
    cycleMonths: 24,              // 2-year cycle
    hourEqualsMinutes: 50,        // 1 CE hour = 50 minutes (68 IAC 1470.95)
    renewal: {
      month: 11, day: 30,         // November 30
      yearParity: 'odd',          // of each ODD-numbered year (NOT even)
      note: 'Illinois LSW/LCSW licenses expire November 30 of each odd-numbered year; the current cycle runs Dec 1, 2025 – Nov 30, 2027.',
    },
    firstRenewalExempt: true,
    firstRenewalNote: 'No CE is required for the FIRST renewal of an Illinois license (68 Ill. Adm. Code 1470.95(a)(7)). The 30-hour requirement begins at the second renewal.',
    // The approved-provider rule — stated once, neutrally, as a tracked data field.
    approvedProviderRule: {
      required: true,
      label: 'IDFPR-approved Social Work CE sponsor',
      numberFormat: '159.xxxxxx',
      note: 'In Illinois, CE must be earned from an IDFPR-approved Social Work CE sponsor; the sponsor approval number has the form 159.xxxxxx. Recorded here as metadata on each activity.',
    },
    // Mandated topics counted WITHIN the 30 hours (per the IDFPR CE-SW fact sheet).
    mandatedTopics: [
      {
        key: 'ethics', label: 'Social Work Practice Ethics', hours: 3,
        appliesTo: ['LSW', 'LCSW'], cadence: 'every-cycle', countsTowardTotal: true,
        source: '68 Ill. Adm. Code 1470.95',
        note: 'At least 3 of the 30 hours in the ethical practice of social work.',
      },
      {
        key: 'cultural-competence', label: 'Cultural Competence', hours: 3,
        appliesTo: ['LSW', 'LCSW'], cadence: 'every-cycle', countsTowardTotal: true,
        source: '68 Ill. Adm. Code 1470.95 (cultural competency add per P.A. 103-0531, renewals on/after Jan 1, 2025)',
        note: 'At least 3 of the 30 hours in cultural competence in the practice of social work.',
      },
      {
        key: 'sexual-harassment', label: 'Sexual Harassment Prevention', hours: 1,
        appliesTo: ['LSW', 'LCSW'], cadence: 'every-cycle', countsTowardTotal: true,
        source: '68 Ill. Adm. Code 1130.400 (amended eff. June 1, 2026)',
        note: '1 hour of sexual harassment prevention training each renewal cycle.',
        smeConfirm: 'Confirm the social-work figure is 1 hour (a 2-hour SW-specific floor was referenced in one source — verify against the current IDFPR fact sheet).',
      },
      {
        key: 'implicit-bias', label: 'Implicit Bias Awareness', hours: 1,
        appliesTo: ['LSW', 'LCSW'], cadence: 'every-cycle', countsTowardTotal: true,
        source: '20 ILCS 2105/2105-15.7 (eff. Jan 1, 2023)',
        note: '1 hour of implicit bias awareness training per renewal period.',
      },
      {
        key: 'alzheimers', label: "Alzheimer's Disease & Other Dementias", hours: 1,
        appliesTo: ['LSW', 'LCSW'], cadence: { everyCycles: 3, fromRenewal: 2 }, countsTowardTotal: true,
        source: 'IDFPR CE-SW fact sheet (per 20 ILCS 2105 dementia-training mandate)',
        note: '1 hour once every 3 renewal periods (from the second renewal).',
        smeConfirm: 'Confirm the exact trigger: once every 3 cycles from the second renewal, and which licensees (e.g. those serving adults) it applies to.',
      },
      {
        key: 'clinical-supervision', label: 'Clinical Supervision Training (one-time)', hours: 6,
        appliesTo: ['LCSW'], cadence: 'one-time-at-second', countsTowardTotal: true,
        source: 'IDFPR CE-SW fact sheet; 68 Ill. Adm. Code 1470.95',
        note: 'LCSW only — a one-time 6 hours of clinical supervision training, due at the second renewal (new to the 2025–2027 cycle).',
        smeConfirm: 'Confirm timing (one-time at second renewal) and whether the 6 hours count toward the 30 total or are additive.',
      },
    ],
    confirmed: false,             // ← Christina (LCSW) ratifies exact specifics
    asOf: CE_AS_OF,
    sources: CE_IL_SOURCES,
    smeNote: 'Research-grounded from primary IDFPR / Illinois Administrative Code sources (as of 2026-06-29). Christina (LCSW) confirms the exact current figures; flagged items carry a smeConfirm note.',
  },
};

export const DEFAULT_STATE = 'IL';

export function listStates() {
  return Object.values(STATE_RULESETS).map((r) => ({ state: r.state, stateName: r.stateName, label: r.label, confirmed: !!r.confirmed }));
}

export function getRuleset(state) {
  return STATE_RULESETS[state] || STATE_RULESETS[DEFAULT_STATE];
}

export function rulesetCredentials(ruleset) {
  return (ruleset && ruleset.credentials) || ['LCSW'];
}

// ---------------------------------------------------------------------------
// Topic options for the log form — 'General CE' plus the state's mandated topics
// that apply to the chosen credential. Pure; order is stable.
// ---------------------------------------------------------------------------
export function ceTopicOptions(ruleset, credential = 'LCSW') {
  const general = { key: GENERAL_TOPIC, label: 'General CE (counts toward total)', hours: 0 };
  const mandated = (ruleset && ruleset.mandatedTopics ? ruleset.mandatedTopics : [])
    .filter((t) => topicAppliesToCredential(t, credential))
    .map((t) => ({ key: t.key, label: t.label, hours: t.hours }));
  return [general, ...mandated];
}

export function mandatedTopic(ruleset, key) {
  return (ruleset && ruleset.mandatedTopics || []).find((t) => t.key === key) || null;
}

// ===========================================================================
// CE ACTIVITY ENTRY — one logged continuing-education activity. Pure factory.
// ===========================================================================
export function makeCeEntry(partial = {}) {
  const p = partial || {};
  return {
    id: p.id || `ce-${Math.random().toString(36).slice(2, 9)}`,
    date: p.date || null,                                   // ISO date the CE was completed
    hours: Math.max(0, Number(p.hours) || 0),
    topic: p.topic || GENERAL_TOPIC,                        // GENERAL_TOPIC or a mandated-topic key
    title: p.title || '',                                   // course / activity title
    provider: p.provider || '',                             // CE sponsor name (metadata)
    approvalNumber: p.approvalNumber || '',                 // sponsor approval # e.g. 159.xxxxxx (metadata)
    credential: p.credential || '',                         // LSW / LCSW the hours apply to
    note: p.note || '',
    learnerEmail: p.learnerEmail || '',
    createdAt: p.createdAt || null,
  };
}

// ---------------------------------------------------------------------------
// CYCLE WINDOW — derive the next renewal date and the cycle start from the
// ruleset + `now`. Pure date math (UTC, parity-aware). Returns null fields when
// `now` is missing/invalid so callers can fall back to counting all entries.
// ---------------------------------------------------------------------------
function parityOk(year, parity) {
  if (parity === 'odd') return year % 2 === 1;
  if (parity === 'even') return year % 2 === 0;
  return true; // 'annual' / unspecified
}

export function cycleWindow(ruleset, nowISO) {
  const r = ruleset && ruleset.renewal;
  const now = nowISO ? new Date(nowISO) : null;
  if (!r || !now || isNaN(now.getTime())) {
    return { renewalDate: null, cycleStart: null, daysUntilRenewal: null };
  }
  const makeDate = (y) => new Date(Date.UTC(y, (r.month || 12) - 1, r.day || 30, 23, 59, 59));
  let year = now.getUTCFullYear();
  let renewal = makeDate(year);
  // Advance to the first renewal date that is >= now AND matches the year parity.
  let guard = 0;
  while ((renewal.getTime() < now.getTime() || !parityOk(year, r.yearParity)) && guard < 12) {
    year += 1; renewal = makeDate(year); guard += 1;
  }
  const cycleMonths = Number(ruleset.cycleMonths) || 24;
  const cycleStart = new Date(renewal.getTime());
  cycleStart.setUTCMonth(cycleStart.getUTCMonth() - cycleMonths);
  const daysUntilRenewal = Math.round((renewal.getTime() - now.getTime()) / 86400000);
  return {
    renewalDate: renewal.toISOString(),
    cycleStart: cycleStart.toISOString(),
    daysUntilRenewal,
  };
}

function withinCycle(dateISO, cycle) {
  if (!cycle || !cycle.cycleStart || !cycle.renewalDate) return true; // no window → count all
  if (!dateISO) return false;
  const d = new Date(dateISO).getTime();
  if (isNaN(d)) return false;
  return d >= new Date(cycle.cycleStart).getTime() && d <= new Date(cycle.renewalDate).getTime();
}

// ---------------------------------------------------------------------------
// The requirement IN FORCE for a given credential + renewal number. Handles the
// first-renewal exemption and per-topic cadence. Pure.
// ---------------------------------------------------------------------------
export function applicableRequirement(ruleset, { credential = 'LCSW', renewalNumber = 2 } = {}) {
  const exempt = !!ruleset.firstRenewalExempt && Number(renewalNumber) <= 1;
  const totalHours = exempt ? 0 : (Number(ruleset.totalHours) || 0);
  const topics = (ruleset.mandatedTopics || [])
    .filter((t) => topicAppliesToCredential(t, credential))
    .map((t) => ({ ...t, due: !exempt && topicDueAtRenewal(t.cadence, renewalNumber) }));
  return { exempt, totalHours, topics };
}

// ===========================================================================
// PROGRESS — the real, derived readout. Total hours toward the cycle requirement,
// plus per-mandated-topic progress, plus the renewal countdown. Pure.
// ===========================================================================
export function ceProgress(entries, ruleset, { credential = 'LCSW', renewalNumber = 2, now = null } = {}) {
  const rs = ruleset || getRuleset(DEFAULT_STATE);
  const req = applicableRequirement(rs, { credential, renewalNumber });
  const cycle = cycleWindow(rs, now);

  const all = Array.isArray(entries) ? entries : [];
  const inCycle = all.filter((e) => withinCycle(e.date, cycle));
  const totalLogged = round2(inCycle.reduce((t, e) => t + (Number(e.hours) || 0), 0));

  const perTopic = req.topics
    .filter((t) => t.due)
    .map((t) => {
      const logged = round2(inCycle
        .filter((e) => e.topic === t.key)
        .reduce((s, e) => s + (Number(e.hours) || 0), 0));
      return {
        key: t.key, label: t.label, required: t.hours, logged,
        remaining: Math.max(0, round2(t.hours - logged)), met: logged >= t.hours,
        source: t.source || null, note: t.note || null, smeConfirm: t.smeConfirm || null,
      };
    });

  const totalRequired = req.totalHours;
  const totalRemaining = Math.max(0, round2(totalRequired - totalLogged));
  const totalPct = totalRequired > 0
    ? Math.min(100, Math.round((totalLogged / totalRequired) * 100))
    : (req.exempt ? 100 : 0);
  const allTopicsMet = perTopic.every((t) => t.met);
  const complete = req.exempt ? true : (totalLogged >= totalRequired && allTopicsMet);

  return {
    state: rs.state,
    credential,
    renewalNumber: Number(renewalNumber) || 0,
    exempt: req.exempt,
    totalLogged,
    totalRequired,
    totalRemaining,
    totalPct,
    perTopic,
    allTopicsMet,
    complete,
    entriesInCycle: inCycle.length,
    entriesTotal: all.length,
    renewalDate: cycle.renewalDate,
    cycleStart: cycle.cycleStart,
    daysUntilRenewal: cycle.daysUntilRenewal,
    approvedProviderRule: rs.approvedProviderRule || null,
    confirmed: !!rs.confirmed,
    asOf: rs.asOf || CE_AS_OF,
  };
}

function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

// Sum of every logged CE hour (cycle-agnostic) — for a simple all-time tally.
export function totalCeHours(entries) {
  return round2((entries || []).reduce((t, e) => t + (Number(e.hours) || 0), 0));
}
