// =============================================================================
// church-insights — what the congregation's own answers tell the church
// =============================================================================
// Darrell 2026-09-11: "a process for analytics and services to be created based
// on the information; workflows are added to become MVP's until we are
// systematizing our users lives and training our church LLMs based on the
// business needs of our specific church family needs."
//
// This is the first link of that chain for the Love Corner, and — exactly as
// the household's version is — it is deliberately the DUMBEST one. Every
// finding here is ARITHMETIC over rows the congregation itself wrote. No model,
// no inference, no guess. DR-0357 decision 8 makes that the rule the chain is
// built on, not a stage to grow out of: what a calculation can say is never
// handed to a model. (And on training a model on a congregant's record at all,
// DR-0357 records that no decision authorizing it exists — so nothing here
// prepares a corpus, and the covenant promises that absence in words.)
//
// WHAT A CHURCH MAY COUNT, AND WHAT IT MAY NOT
//
// Every finding below had to pass the same test the intake did: does the church
// actually ACT on this, and can it be said without turning the roll into a file
// on a person? So:
//
//   * NO GIVING ANALYTICS. Not "we chose not to" — the rows cannot hold an
//     amount (migration 0209 refuses it twice), so there is nothing to compute.
//   * NO PRAYER CONTENT, EVER, not even aggregated. This counts that requests
//     exist and who they were pointed at; it never reads one. A request aimed
//     at the pastor alone does not become a statistic.
//   * NO PER-PERSON RANKING. Nothing here scores a member, sorts them by
//     engagement, or flags anyone as drifting. Attendance and standing are not
//     a grade (the covenant says so; this file obeys it).
//   * NO NAMES IN AN AGGREGATE. The counts are counts. The office already has
//     the roll for the one place names belong.
//
// What is LEFT is the genuinely useful part, and it is mostly operational: how
// many need a ride and to which service, whether anyone offered to drive, who
// asked for the new-member welcome, which ministries people offered to serve in
// — and, the sharpest one, WHICH MINISTRIES PEOPLE VOLUNTEERED FOR THAT THE APP
// HAS NO PAGE FOR. That is the church band finding, generalized: the
// congregation telling the build team what to build next, in numbers.
//
// Pure: no React, no network, no clock of its own (pass `today`).
// =============================================================================
import { CHURCH_MEMBER_SECTIONS, normalizeMemberRecord, memberProgress } from './church-member-intake.js';
import { CHURCH_MINISTRIES, ministryById } from './church-ministries.js';
import { serviceSlots } from './bus-ministry.js';

const isEmpty = (v) => (Array.isArray(v) ? v.length === 0 : v === null || v === undefined || String(v).trim() === '');

function finding(id, title, { data, truth, invitation, basis, weight = 1 }) {
  return Object.freeze({ id, title, data, truth, invitation, basis: Object.freeze([...basis]), weight });
}

/**
 * Everything the congregation's own rows can honestly say.
 * @param {object}  input
 * @param {Array}   input.records  member records (the office roll, or one person's)
 * @param {object}  [input.church] the church record, for its real services
 * @returns {{ ok, findings, roll, unavailable }}
 */
export function churchInsights({ records = [], church = null } = {}) {
  const rows = (Array.isArray(records) ? records : [])
    .filter(Boolean)
    .map((r) => normalizeMemberRecord(r, church));
  const findings = [];
  const roll = { people: rows.length };

  // No rows, no findings. Silence beats a painted number (DR-0061).
  if (rows.length === 0) {
    return {
      ok: false,
      unavailable: 'Nobody has filled in a member record yet, so there is nothing true to say. As people answer, the findings appear here — each one showing the rows it came from.',
      findings: [], roll,
    };
  }

  // ── 1. How much of the roll actually stands ──────────────────────────────
  const progresses = rows.map((r) => memberProgress(r, church));
  const answered = progresses.reduce((n, p) => n + p.done, 0);
  const possible = progresses.reduce((n, p) => n + p.total, 0);
  const barelyStarted = progresses.filter((p) => p.done <= 3).length;
  roll.answeredPct = possible ? Math.round((answered / possible) * 100) : 0;
  findings.push(finding('coverage', 'How much of the roll stands', {
    data: `${rows.length} record${rows.length === 1 ? '' : 's'}, ${roll.answeredPct}% of questions answered${barelyStarted ? `; ${barelyStarted} barely started` : ''}`,
    truth: barelyStarted
      ? `${barelyStarted} ${barelyStarted === 1 ? 'person has' : 'people have'} given little more than a name, so anything below rests on the rest.`
      : 'Every record carries real answers, so the counts below are real.',
    invitation: barelyStarted ? 'The welcome is the natural moment to finish a record — not a reminder email.' : 'Keep it current as people change.',
    basis: ['church_member_records.record'],
  }));

  // ── 2. Rides: the bus ministry's actual question ──────────────────────────
  const needRide = rows.filter((r) => r.needsRide === true);
  const drivers = rows.filter((r) => r.canDrive === true);
  if (needRide.length || drivers.length) {
    const accessible = needRide.filter((r) => r.accessibleNeeded === true).length;
    findings.push(finding('rides', 'Rides asked for, and people offering to drive', {
      data: `${needRide.length} asking for a ride · ${drivers.length} offering to drive${accessible ? ` · ${accessible} needing the accessibility van` : ''}`,
      truth: drivers.length === 0 && needRide.length > 0
        ? 'People have asked for a ride and nobody has offered to drive. That is a gap the schedule cannot close by itself.'
        : needRide.length > drivers.length
          ? 'More people need a ride than have offered to drive.'
          : 'There are at least as many offers to drive as there are riders asking.',
      invitation: needRide.length === 0
        ? 'Nothing to arrange yet.'
        : 'Open Bus Ministry and put these on a run.',
      basis: ['church_member_records.record.needsRide', 'church_member_records.record.canDrive', 'church_member_records.record.accessibleNeeded'],
      weight: needRide.length > drivers.length ? 5 : 2,
    }));

    // Which SERVICE the rides are for — Sunday and Wednesday are different runs.
    const slots = serviceSlots(church);
    const byService = slots.map((s) => ({
      slot: s,
      n: needRide.filter((r) => Array.isArray(r.rideServices) && r.rideServices.includes(s.id)).length,
    })).filter((x) => x.n > 0);
    if (byService.length) {
      findings.push(finding('rides-by-service', 'Which services the rides are for', {
        data: byService.map((x) => `${x.slot.dayLabel} ${x.slot.time}: ${x.n}`).join(' · '),
        truth: byService.length === 1
          ? `Every ride asked for so far is for ${byService[0].slot.dayLabel} ${byService[0].slot.time}.`
          : 'The rides are spread across more than one service, so one run does not cover them.',
        invitation: 'Assign a driver per run on the Schedule tab.',
        basis: ['church_member_records.record.rideServices'],
        weight: 3,
      }));
    }
  }

  // ── 3. THE CHURCH BAND FINDING, generalized ──────────────────────────────
  // People offered to serve in a ministry the app has no page for. This is the
  // congregation telling the build team what to build next, in numbers.
  const offers = new Map();
  for (const r of rows) {
    for (const id of (Array.isArray(r.servingInterest) ? r.servingInterest : [])) {
      offers.set(id, (offers.get(id) || 0) + 1);
    }
  }
  const realMinistryOffers = [...offers.entries()]
    .filter(([id]) => ministryById(id))
    .sort((a, b) => b[1] - a[1]);
  if (realMinistryOffers.length) {
    findings.push(finding('serving', 'Where people offered to serve', {
      data: realMinistryOffers.map(([id, n]) => `${ministryById(id).name}: ${n}`).join(' · '),
      truth: 'These are offers, not assignments. Nobody here has been contacted by the app.',
      invitation: `Give ${ministryById(realMinistryOffers[0][0]).name} its list — the lead reaches out, not the app.`,
      basis: ['church_member_records.record.servingInterest'],
      weight: 3,
    }));

    const noPage = realMinistryOffers.filter(([id]) => !ministryById(id).surface);
    if (noPage.length) {
      const total = noPage.reduce((n, [, c]) => n + c, 0);
      findings.push(finding('serving-no-page', 'Ministries people volunteered for that have no page yet', {
        data: noPage.map(([id, n]) => `${ministryById(id).name}: ${n}`).join(' · '),
        truth: `${total} offer${total === 1 ? '' : 's'} landed on ${noPage.length} ministr${noPage.length === 1 ? 'y' : 'ies'} the app cannot yet hold. The interest is real and the surface is not.`,
        invitation: `Build ${ministryById(noPage[0][0]).name} next — this is the congregation saying which one.`,
        basis: ['church_member_records.record.servingInterest', 'church-ministries.surface'],
        weight: 6,
      }));
    }
  }

  // ── 4. The welcome queue (Darrell's second pilot) ────────────────────────
  const wantWelcome = rows.filter((r) => r.newMemberWelcome === true).length;
  const newish = rows.filter((r) => /New member|Visiting/i.test(String(r.standing || ''))).length;
  if (wantWelcome || newish) {
    findings.push(finding('welcome', 'Who is waiting on a welcome', {
      data: `${wantWelcome} asked for the welcome · ${newish} new or visiting`,
      truth: wantWelcome === 0
        ? 'Nobody has asked for the welcome yet, so nobody is waiting on one.'
        : `${wantWelcome} ${wantWelcome === 1 ? 'person is' : 'people are'} waiting on a card and what comes next.`,
      invitation: wantWelcome ? 'Send the welcome — the roll has the names and the addresses.' : 'Nothing owed here.',
      basis: ['church_member_records.record.newMemberWelcome', 'church_member_records.record.standing'],
      weight: wantWelcome ? 4 : 1,
    }));
  }

  // ── 5. Which doors actually reach people ─────────────────────────────────
  const doors = new Map();
  for (const r of rows) {
    const d = String(r.howYouFoundUs || '').trim();
    if (d) doors.set(d, (doors.get(d) || 0) + 1);
  }
  if (doors.size) {
    const sorted = [...doors.entries()].sort((a, b) => b[1] - a[1]);
    findings.push(finding('doors', 'How people found the Love Corner', {
      data: sorted.map(([d, n]) => `${d}: ${n}`).join(' · '),
      truth: `The door that brought the most people is "${sorted[0][0]}".`,
      invitation: 'Put effort where people are actually coming from.',
      basis: ['church_member_records.record.howYouFoundUs'],
      weight: 2,
    }));
  }

  // ── 6. Prayer: COUNTED, never read ───────────────────────────────────────
  // The audience a person chose is a fact about routing, not about them. The
  // request itself is never touched here — not summarized, not themed, not
  // counted by topic. A request aimed at the pastor alone is not a statistic.
  const withRequest = rows.filter((r) => !isEmpty(r.prayerRequest));
  if (withRequest.length) {
    const pastorOnly = withRequest.filter((r) => String(r.prayerShareable || '') === 'Only the pastor').length;
    findings.push(finding('prayer', 'Requests waiting, and who they were entrusted to', {
      data: `${withRequest.length} request${withRequest.length === 1 ? '' : 's'} · ${pastorOnly} for the pastor alone`,
      truth: 'Counted only. Nothing here reads a request, themes one, or carries one past the audience the person chose.',
      invitation: pastorOnly ? 'The pastor-only requests are visible to the pastor and to no one else, including this page.' : 'The prayer team can see the ones pointed at them.',
      basis: ['church_member_records.record.prayerShareable'],
      weight: 4,
    }));
  }

  // ── 7. Access needs — the ushers' actual work ────────────────────────────
  const access = rows.filter((r) => !isEmpty(r.accessNeeds)).length;
  if (access) {
    findings.push(finding('access', 'People who named something that would make it easier to be here', {
      data: `${access} named a need`,
      truth: 'Seating, hearing, a ramp, large print. Logistics the ushers can act on, never a medical record.',
      invitation: 'The roll carries what each person said; give it to the usher board.',
      basis: ['church_member_records.record.accessNeeds'],
      weight: 4,
    }));
  }

  findings.sort((a, b) => b.weight - a.weight);
  return { ok: findings.length > 0, findings, roll, unavailable: '' };
}

/** Keys this file must never compute over, mirrored by a test. */
export const NEVER_COMPUTED = Object.freeze([
  'givingAmount', 'givingTotal', 'income', 'prayerRequest', 'diagnosis', 'ssn',
]);

export function memberFieldLabel(key) {
  for (const s of CHURCH_MEMBER_SECTIONS) {
    const f = s.fields.find((x) => x.key === key);
    if (f) return f.label;
  }
  return key;
}

/** Every ministry the congregation has offered to serve, with nowhere to go. */
export function ministriesAwaitingASurface(records = [], church = null) {
  const rows = (Array.isArray(records) ? records : []).filter(Boolean).map((r) => normalizeMemberRecord(r, church));
  const counts = new Map();
  for (const r of rows) {
    for (const id of (Array.isArray(r.servingInterest) ? r.servingInterest : [])) {
      const m = ministryById(id);
      if (m && !m.surface) counts.set(id, (counts.get(id) || 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([id, offers]) => ({ id, name: ministryById(id).name, offers }))
    .sort((a, b) => b.offers - a.offers || a.name.localeCompare(b.name));
}

export { CHURCH_MINISTRIES };
