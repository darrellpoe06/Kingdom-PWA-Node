// =============================================================================
// household-insights — what the household's own record tells it (DR-0357)
// =============================================================================
// Darrell 2026-09-11: "a process for analytics and services to be created based
// on the information; workflows are added to become MVPs until we are
// systematizing our lives... a hardened system that produces the best way to
// build processes that enables families to gain insights and understanding of
// their own interests and needs."
//
// This is the first link of that chain, and it is deliberately the DUMBEST
// one: every finding here is arithmetic over rows the household itself wrote.
// No model, no inference, no guess. That is not a limitation to fix later —
// it is the rule the chain is built on (DETERMINISTIC-FIRST): a thing a
// calculation can say is never handed to a model, and a model is only reached
// for where no calculation can.
//
// THE SHAPE OF A FINDING follows the Behavioral Mirror, which until now was
// doctrine with no code behind it:
//   DATA       — the rows read, named, countable
//   TRUTH      — what the rows say, stated plainly
//   IDENTITY   — never a verdict on the people; a statement about the record
//   INVITATION — the next action, which must exist
//
// THE HONESTY CONTRACT (DR-0249, DR-0076):
//   * A finding with no rows behind it is not produced. Silence beats a
//     painted number.
//   * Every finding carries `basis` — the exact keys or ids it read — so any
//     claim can be opened.
//   * Nothing here is sent anywhere. It is computed in the app, from this
//     household's own record, for this household.
//
// Pure: no React, no network, no clock of its own (pass `today`).
// =============================================================================
import { HOUSEHOLD_SECTIONS, HOUSEHOLD_HELPS, normalizeHousehold, householdProgress } from './household-intake.js';
import { VAULT_CATEGORIES, expiringSoon, shelfSummary } from './family-vault.js';

/**
 * The ladder every workflow climbs. This is the PROCESS, as data, so a
 * household can see where each of its own workflows actually stands instead of
 * being told it is "in progress".
 */
export const WORKFLOW_LADDER = Object.freeze([
  { id: 'noticed', label: 'Noticed', means: 'The household named it — a friction, a repeated question, a thing that keeps costing time.' },
  { id: 'described', label: 'Described', means: 'What it SHOULD do is written down, with the real rows it would read and write.' },
  { id: 'mvp', label: 'MVP', means: 'It runs end to end on real data for this household, by hand where it must be, and it is used at least once.' },
  { id: 'systematized', label: 'Systematized', means: 'It runs on its own rhythm with its brakes on — a budget, a lock, and a way to stop it — and the household stopped thinking about it.' },
  { id: 'hardened', label: 'Hardened', means: 'Its failures are gates that catch them, its numbers are measured not claimed, and it has survived a month of real use without a hand on it.' },
]);

export const LADDER_IDS = Object.freeze(WORKFLOW_LADDER.map((s) => s.id));

const isEmpty = (v) => (Array.isArray(v) ? v.length === 0 : v === null || v === undefined || String(v).trim() === '');

/** The keys each "help with" choice actually depends on — what makes the help possible. */
export const HELP_DEPENDS_ON = Object.freeze({
  money: ['incomeKinds', 'payCadence', 'bankName', 'givingPractice', 'emergencyFundGoal', 'debtSnapshot', 'taxFiling'],
  property: ['homeTenure', 'housingPayment', 'homeInsurer', 'homeSystemsNote', 'ownsRentalDoors'],
  projects: ['oneYearGoal', 'biggestFriction'],
  rhythms: ['sabbathDay', 'familyMeetingDay', 'devotionTime', 'schoolRhythm'],
  study: ['studyTrack', 'devotionTime', 'churchHome'],
  health: ['healthInsurer', 'emergencyContact', 'foodApproach', 'movementRhythm'],
  work: ['workToday', 'ownsBusiness', 'skillsToMonetize', 'contractorsUsed'],
  legacy: ['taxFiling', 'homeTenure'],
});

function finding(id, title, { data, truth, invitation, basis, weight = 1 }) {
  return Object.freeze({ id, title, data, truth, invitation, basis: Object.freeze([...basis]), weight });
}

/**
 * Everything the household's own rows can honestly say.
 * @param {object} input
 * @param {object} input.record     the household record (raw or normalized)
 * @param {Array}  input.documents  rows from the shelf
 * @param {string} [input.today]    ISO date, for the expiry window
 * @returns {{ ok, findings, coverage, shelf, unavailable }}
 */
export function householdInsights({ record = null, documents = [], today = null } = {}) {
  const r = normalizeHousehold(record);
  const rows = Array.isArray(documents) ? documents : [];
  const coverage = householdProgress(r);
  const shelf = shelfSummary(rows);
  const findings = [];

  // Nothing written yet: say exactly that, and invite the first act. This is
  // the "no rows" case, answered honestly rather than with an empty dashboard.
  if (coverage.done === 0 && rows.length === 0) {
    return {
      ok: false,
      unavailable: 'Nothing has been written down yet, so there is nothing true to say. Answer the household record and the first findings appear here — each one showing the rows it came from.',
      findings: [], coverage, shelf,
    };
  }

  // ── 1. The record's own coverage ─────────────────────────────────────────
  const thin = HOUSEHOLD_SECTIONS
    .map((s) => {
      const answerable = s.fields.filter((f) => f.type !== 'acknowledgment');
      const answered = answerable.filter((f) => !isEmpty(r[f.key])).length;
      return { id: s.id, title: s.title, answered, total: answerable.length };
    })
    .filter((s) => s.total > 0 && s.answered === 0);
  findings.push(finding('coverage', 'How much of the record stands', {
    data: `${coverage.done} of ${coverage.total} questions answered${thin.length ? `; ${thin.length} section${thin.length === 1 ? '' : 's'} untouched` : ''}`,
    truth: thin.length
      ? `The parts still empty are ${thin.map((s) => s.title).join(', ')}. Anything the app says about those is guesswork, so it says nothing.`
      : 'Every section has something in it, so every finding below rests on real answers.',
    invitation: thin.length ? `Open ${thin[0].title} and answer what you can.` : 'Keep it current as things change.',
    basis: ['household_records.record'],
  }));

  // ── 2. What you asked for, against what you have given us ────────────────
  const wants = Array.isArray(r.helpWith) ? r.helpWith : [];
  if (wants.length) {
    for (const want of wants) {
      const deps = HELP_DEPENDS_ON[want] || [];
      if (!deps.length) continue;
      const have = deps.filter((k) => !isEmpty(r[k]));
      const missing = deps.filter((k) => isEmpty(r[k]));
      const label = (HOUSEHOLD_HELPS.find((h) => h.id === want) || {}).label || want;
      findings.push(finding(`want-${want}`, label, {
        data: `${have.length} of ${deps.length} of the answers this depends on are in`,
        truth: missing.length === 0
          ? 'Everything this needs is answered. What is shown about it is real.'
          : `Without ${missing.map((k) => fieldLabel(k)).join(', ')}, this can only show part of the picture.`,
        invitation: missing.length === 0 ? 'Nothing needed here.' : `Answer ${fieldLabel(missing[0])}.`,
        basis: deps.map((k) => `household_records.record.${k}`),
        weight: missing.length ? 3 : 1,
      }));
    }
  } else if (coverage.done > 0) {
    findings.push(finding('no-direction', 'What you want this to carry', {
      data: 'no answer yet',
      truth: 'Until the household says what it wants carried, the app is guessing which surfaces matter.',
      invitation: 'Answer “What we want this app to carry for us”.',
      basis: ['household_records.record.helpWith'],
      weight: 4,
    }));
  }

  // ── 3. The rhythms the calendar can actually protect ─────────────────────
  if (!isEmpty(r.sabbathDay)) {
    findings.push(finding('sabbath', 'The day of rest', {
      data: `${r.sabbathDay} is named`,
      truth: 'A named day is a day the app can keep clear instead of filling.',
      invitation: `Nothing is scheduled into ${r.sabbathDay}.`,
      basis: ['household_records.record.sabbathDay'],
    }));
  }

  // ── 4. The shelf ─────────────────────────────────────────────────────────
  if (rows.length) {
    const soon = expiringSoon(rows, 60, today || undefined);
    if (soon.length) {
      findings.push(finding('expiring', 'Papers about to run out', {
        data: `${soon.length} document${soon.length === 1 ? '' : 's'} expiring within 60 days`,
        truth: `${soon[0].label} runs out ${soon[0].expiresOn}.`,
        invitation: 'Renew it, then update the date on the shelf.',
        basis: soon.map((d) => `family_documents.${d.id}`),
        weight: 5,
      }));
    }
    const emptyShelves = shelf.byCategory.filter((c) => c.total === 0);
    if (emptyShelves.length && emptyShelves.length < VAULT_CATEGORIES.length) {
      findings.push(finding('shelf-gaps', 'Shelves with nothing on them', {
        data: `${shelf.total} document${shelf.total === 1 ? '' : 's'} filed; ${emptyShelves.length} shelf${emptyShelves.length === 1 ? '' : 'ves'} empty`,
        truth: `Nothing is filed under ${emptyShelves.slice(0, 3).map((c) => c.label).join(', ')}${emptyShelves.length > 3 ? ` and ${emptyShelves.length - 3} more` : ''}. An empty shelf is not a problem by itself — it is only a place the household has not needed yet.`,
        invitation: `If the papers exist, file them or record where they are under ${emptyShelves[0].label}.`,
        basis: ['family_documents'],
      }));
    }
  }

  // ── 5. The covenant ──────────────────────────────────────────────────────
  const cov = (r.acknowledgments && r.acknowledgments.householdCovenant) || null;
  if (cov && cov.agreed && cov.signature) {
    findings.push(finding('covenant', 'The covenant', {
      data: `signed by ${cov.signature}${cov.signedOn ? ` on ${cov.signedOn}` : ''}`,
      truth: 'The terms this record is kept on are agreed and stamped.',
      invitation: 'Read it again any time; it is on the household record.',
      basis: ['household_records.record.acknowledgments.householdCovenant'],
    }));
  } else if (coverage.done > 0) {
    findings.push(finding('covenant-unsigned', 'The covenant is not signed', {
      data: 'no signature on file',
      truth: 'The household has written a record but has not agreed the terms it is kept on.',
      invitation: 'Read the Household Covenant and sign it at the bottom.',
      basis: ['household_records.record.acknowledgments.householdCovenant'],
      weight: 4,
    }));
  }

  findings.sort((a, b) => b.weight - a.weight);
  return { ok: findings.length > 0, findings, coverage, shelf, unavailable: '' };
}

function fieldLabel(key) {
  for (const s of HOUSEHOLD_SECTIONS) {
    const f = s.fields.find((x) => x.key === key);
    if (f) return f.label;
  }
  return key;
}

/**
 * The workflows this household's own answers make obvious. Each is a CANDIDATE
 * at the bottom of the ladder — named by the household, not invented for it —
 * and rises only when the household says it has.
 */
export function workflowCandidates({ record = null } = {}) {
  const r = normalizeHousehold(record);
  const out = [];
  if (!isEmpty(r.biggestFriction)) {
    out.push({ id: 'friction', stage: 'noticed', title: 'The thing that costs the most', said: String(r.biggestFriction).trim(), from: 'household_records.record.biggestFriction' });
  }
  if (!isEmpty(r.oneYearGoal)) {
    out.push({ id: 'goal', stage: 'noticed', title: 'Where we want to be in a year', said: String(r.oneYearGoal).trim(), from: 'household_records.record.oneYearGoal' });
  }
  if (!isEmpty(r.wantToLearn)) {
    out.push({ id: 'learn', stage: 'noticed', title: 'What we want to learn', said: String(r.wantToLearn).trim(), from: 'household_records.record.wantToLearn' });
  }
  return out;
}
