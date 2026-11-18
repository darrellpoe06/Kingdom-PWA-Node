// =============================================================================
// surface-claims — every promise a page makes, with the evidence that keeps it
// true. Ari's "Promise truth" review reads this on every pass.
// =============================================================================
// Darrell 2026-11-18, after the persona tiles were found selling features that
// did not run ("Fix the tiles to be accurate!!!!! ... unless we can make happen
// what's on the tiles") and: "Ari should be on every page validation efforts
// for each page and or text isn't good enough for successful solutions
// required... fix it too."
//
// The gap it closes: surface-audit (scripts/surface-audit.mjs) walks every page
// for STRUCTURE (static tiles, dead ends), and Ari's review reads the RECORDS
// (boards, concerns, data). Nothing asked whether the WORDS on a page are true:
// "Capex reserve auto-funded" shipped with no capex funding anywhere in the code.
//
// Shape: one entry per page that makes promises.
//   { surface, label, claims: [{ id, text, check(ctx) -> evidence-or-false }],
//     retracted: [{ re, why }] }
// - claims: each concrete promise and the check that proves it from REAL state
//   (here the sample datasets the page shows). A failing check is a broken
//   promise — Ari reports it as a bug with the claim text as evidence.
// - retracted: phrases pulled because the feature is not built. They may not
//   creep back into the page's copy; when the feature ships, the phrase is
//   removed here in the same PR, with a new claim + check added above.
// Coverage is honest: Ari also counts the app's pages that have NO entry here
// yet. That count is the worklist toward "on every page", never hidden.
//
// PURE. Proven-to-catch in __tests__/persona-tile-claims.test.js.
// =============================================================================
import { buildDemoPersonas, DEMO_PERSONA_META, DEMO_PICKER_INTRO } from './demo-data.js';

const txt = (d, re) => (d.transactions || []).filter((t) => re.test(t.description || ''));
const acct = (d, re) => (d.accounts || []).filter((a) => re.test(a.name || ''));
const n = (xs) => xs.length;

// Every sample account reconciles: opening balance + settled transactions = balance.
function unreconciled(personas) {
  const bad = [];
  for (const [key, d] of Object.entries(personas)) {
    for (const a of d.accounts || []) {
      if (typeof a.openingBalance !== 'number') continue;
      const sum = (d.transactions || [])
        .filter((t) => t.accountId === a.id && !/\(upcoming\)/.test(t.description || '') && t.date <= '2026-05-31')
        .reduce((s, t) => s + t.amount, 0);
      if (Math.round((a.openingBalance + sum) * 100) / 100 !== a.balance) bad.push(`${key} · ${a.name}`);
    }
  }
  return bad;
}

export const SURFACE_CLAIMS = [
  {
    surface: 'front-door-picker',
    label: 'Front door · "Which life is closest to yours?" persona tiles',
    claims: [
      {
        id: 'samples-reconcile',
        text: 'The working samples run the real system on sample numbers',
        check: (c) => {
          const bad = unreconciled(c.personas);
          return bad.length ? false : 'every sample account reconciles (opening + transactions = balance)';
        },
      },
      {
        id: 'f1-basics',
        text: 'Singles: rent covered, emergency fund funded, Roth started, student loan, tithe steady',
        check: ({ personas: { 'family-of-1': d } }) =>
          n(txt(d, /^Rent/)) && acct(d, /Emergency/)[0]?.balance > 0 && n(acct(d, /Roth/)) && d.debts.some((x) => /Student/.test(x.name)) && n(txt(d, /Tithe/))
            ? 'rent, emergency fund, Roth, student loan and tithe rows present'
            : false,
      },
      {
        id: 'f1-subscriptions',
        text: 'Singles: every subscription is on the screen',
        check: ({ personas: { 'family-of-1': d } }) =>
          d.subscriptions.length && d.subscriptions.every((s) => n(txt(d, new RegExp(s.name))))
            ? `${d.subscriptions.length} subscriptions, each a real charge on the record (Books → Cart)`
            : false,
      },
      {
        id: 'f2-house-fund',
        text: 'Couples: house down-payment fund grows every month; both paychecks on one record',
        check: ({ personas: { 'family-of-2': d } }) =>
          n(txt(d, /House down-payment · monthly/)) && n(txt(d, /Partner A · paycheck$/)) && n(txt(d, /Partner B · paycheck$/))
            ? "monthly house-fund transfer + both partners' paychecks"
            : false,
      },
      {
        id: 'f3-childcare-529',
        text: 'New parents: childcare tracked, 529 started',
        check: ({ personas: { 'family-of-3': d } }) => (n(txt(d, /[Cc]hildcare|[Dd]aycare/)) && n(acct(d, /529/)) ? 'childcare rows + a 529 account' : false),
      },
      {
        id: 'f5-per-kid',
        text: "Families of 5+: a 529 for each of the three; each kid's activities on their own line",
        check: ({ personas: { 'family-of-5': d } }) => {
          const a = acct(d, /^529 · /);
          const ok = a.length === 3 && a.every((x) => n(txt(d, new RegExp(`^${x.name.split('·')[1].trim().split(' ')[0]} · `))));
          return ok ? '3 per-child 529 accounts, each child with their own activity line' : false;
        },
      },
      {
        id: 'sep-receipts',
        text: 'Co-parents: split costs recorded, the receipt attached',
        check: ({ personas: { separated: d } }) => {
          const split = d.transactions.filter((t) => t.accountId === 'a-shared' && t.amount < 0 && t.date <= '2026-05-31');
          return split.length && split.every((t) => t.receipt && t.receipt.src) ? `${split.length} paid split costs, every one with a receipt` : false;
        },
      },
      {
        id: 'pro-books',
        text: 'Solo practice: separate books, tax set-aside + quarterly dates, CEU + license on the calendar',
        check: ({ personas: { professional: d } }) =>
          new Set(d.entities.map((e) => e.type)).size > 1 &&
          n(acct(d, /Tax Set-aside/)) &&
          d.taxCalendar.some((t) => /estimated tax/i.test(t.name)) &&
          d.recurringObligations.some((o) => /CEU/.test(o.name)) &&
          d.recurringObligations.some((o) => /License/.test(o.name))
            ? 'practice + household entities, set-aside account, Q2 estimated-tax date, CEU + license obligations'
            : false,
      },
      {
        id: 'landlord-doors',
        text: "Landlords: each property's rent beside its mortgage; a late tenant stays flagged",
        check: ({ personas: { landlord: d } }) =>
          (d.inflows.rentals || []).length && d.inflows.rentals.some((r) => r.status === 'late')
            ? `${d.inflows.rentals.length} doors, one flagged late`
            : false,
      },
    ],
    retracted: [
      { re: /who-paid-what is a number/i, why: 'per-partner settle-up not built' },
      { re: /on every screen/i, why: 'the what/when/why/how line is on the forecast only' },
      { re: /every kid's costs visible/i, why: 'per-kid cost rollup not built' },
      { re: /timestamp is in the log/i, why: 'co-parent exchange log not built' },
      { re: /agreed to split/i, why: 'split-percentage model not built' },
      { re: /owner draw clean/i, why: 'owner-draw classification not built' },
      { re: /match what the IRS/i, why: 'ledger vs. filed-return check not built' },
      { re: /flagged on the 1st/i, why: 'automatic late detection not built' },
      { re: /auto-funded/i, why: 'capex reserve funding not built' },
      { re: /runs itself/i, why: 'nothing runs the portfolio unattended' },
      { re: /real data right now/i, why: 'the tiles run sample data' },
    ],
    // The words Ari reads on this page: every tile's headline + pitch + the intro line.
    copy: () => [DEMO_PICKER_INTRO, ...Object.values(DEMO_PERSONA_META).map((m) => `${m.headline} ${m.pitch}`)],
  },
];

/** Default context: the sample datasets the picker shows. */
export function claimsContext() {
  return { personas: buildDemoPersonas({ meta: {}, pressureMappings: {} }) };
}

/**
 * Check every registered page promise. Returns
 *   { results: [{ surface, id, text, ok, evidence }], retractedHits: [{ surface, why, text }] }
 */
export function checkSurfaceClaims(ctx = claimsContext(), registry = SURFACE_CLAIMS) {
  const results = [];
  const retractedHits = [];
  for (const s of registry) {
    for (const c of s.claims) {
      let evidence;
      try {
        evidence = c.check(ctx);
      } catch {
        evidence = false;
      }
      results.push({ surface: s.surface, id: c.id, text: c.text, ok: !!evidence, evidence: evidence || null });
    }
    const words = typeof s.copy === 'function' ? s.copy() : [];
    for (const r of s.retracted || []) {
      const hit = words.find((w) => r.re.test(w));
      if (hit) retractedHits.push({ surface: s.surface, why: r.why, text: hit });
    }
  }
  return { results, retractedHits };
}

/**
 * Ari's "Promise truth" dimension. `surfaceIds` = the app's page ids (from
 * surfaces.js, passed in so this stays pure); pages with no entry here are the
 * honest coverage worklist.
 */
export function reviewClaims({ surfaceIds = null, ctx, registry = SURFACE_CLAIMS } = {}) {
  const { results, retractedHits } = checkSurfaceClaims(ctx || claimsContext(), registry);
  const findings = [];
  for (const r of results.filter((x) => !x.ok)) {
    findings.push({
      dimension: 'claims',
      severity: 'bug',
      title: `Broken promise on ${r.surface}: "${r.text}"`,
      evidence: `The check for claim ${r.id} found nothing behind it`,
      action: 'Make it true (build or seed it), or move the line into the page\'s "vision · in build" note',
      surface: r.surface,
      claim: r.id,
    });
  }
  for (const h of retractedHits) {
    findings.push({
      dimension: 'claims',
      severity: 'bug',
      title: `Unbuilt promise back on ${h.surface}`,
      evidence: `"${h.text.slice(0, 140)}" — ${h.why}`,
      action: 'Remove the line, or ship the feature and retire the phrase in surface-claims.js',
      surface: h.surface,
    });
  }
  const covered = new Set(registry.map((s) => s.surface));
  const ids = Array.isArray(surfaceIds) ? surfaceIds : null;
  const uncovered = ids ? ids.filter((id) => !covered.has(id)) : [];
  if (ids && uncovered.length) {
    findings.push({
      dimension: 'claims',
      severity: 'warning',
      title: `${uncovered.length} of ${ids.length} pages have no promise check yet`,
      evidence: `Unchecked: ${uncovered.slice(0, 12).join(', ')}${uncovered.length > 12 ? ', …' : ''}`,
      action: "Register each page's promises in lib/surface-claims.js with the check that proves them",
      count: uncovered.length,
    });
  }
  return {
    key: 'claims',
    findings,
    metrics: {
      claims: results.length,
      kept: results.filter((r) => r.ok).length,
      broken: results.filter((r) => !r.ok).length,
      retractedHits: retractedHits.length,
      pagesChecked: covered.size,
      pagesUnchecked: ids ? uncovered.length : null,
    },
  };
}
