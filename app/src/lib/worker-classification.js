// =============================================================================
// worker-classification — the safety layer for 1099 relationships.
// =============================================================================
// Darrell 2026-07-18: "How does the 1099 relationship actually work and how
// should it work and be safe... family members can be the 1099 worker...
// allow outsiders to help families as outside 1099 workers... 1099 workers for
// the church." This is the DATA-side honesty the platform exists for
// (DR-0100): state the ESTABLISHED tax facts plainly, flag the fact-specific
// part NARROWLY, and never gaslight a real misclassification risk into "who
// knows." Every number here is a VERIFIED current-year figure with its source,
// not a remembered one (DR-0076); the app already carries "VERIFY WITH LICENSED
// PROFESSIONALS", and these advisories make that specific instead of generic.
//
// PURE + DETERMINISTIC: no I/O, no dates from the clock (the tax YEAR is passed
// in, never read from Date.now — same input, same output, testable).
//
// SOURCES (fetched 2026-07-18):
//   - 1099-NEC threshold raised $600 -> $2,000 for 2026 by the One Big
//     Beautiful Bill Act (payments on/after 2026-01-01; inflation-indexed from
//     2027). $600 still applies to 2025 and prior. (IRS Pub 1099; tax1099.)
//   - Household employee ("nanny tax"): $3,000 cash wages to one worker in 2026
//     triggers Social Security/Medicare (up from $2,800 in 2025); $1,000 in any
//     calendar quarter triggers FUTA. Household workers get a W-2 + Schedule H,
//     NOT a 1099. (IRS Pub 926; IRS Topic 756.)
// =============================================================================

// The 1099-NEC reporting threshold BY TAX YEAR. A business must file a
// 1099-NEC when it pays a non-employee at or above this in the course of a
// trade or business. Purely personal payments never trigger it.
export const NEC_THRESHOLD_BY_YEAR = { 2024: 600, 2025: 600, 2026: 2000 };
// Post-2026 the figure is inflation-indexed; until we verify each year's exact
// number we fall back to the last KNOWN value and mark it approximate, rather
// than invent a precise figure (DR-0076).
export const NEC_THRESHOLD_LATEST_KNOWN = { year: 2026, amount: 2000 };

// The household-employment triggers for 2026 (see sources above). Named so the
// advisory can quote a real number instead of a vague "a few thousand."
export const HOUSEHOLD_FICA_TRIGGER_2026 = 3000; // cash wages to one worker / yr
export const HOUSEHOLD_FUTA_TRIGGER = 1000;      // cash wages in any one quarter

// Resolve the NEC threshold for a tax year, honestly flagging when the figure
// is an approximation (a future year we have not verified).
export function necThresholdForYear(year) {
  const y = Number(year);
  if (NEC_THRESHOLD_BY_YEAR[y] != null) {
    return { amount: NEC_THRESHOLD_BY_YEAR[y], year: y, approximate: false };
  }
  // Unknown future year: use the latest known + say so.
  return {
    amount: NEC_THRESHOLD_LATEST_KNOWN.amount,
    year: y || NEC_THRESHOLD_LATEST_KNOWN.year,
    approximate: y > NEC_THRESHOLD_LATEST_KNOWN.year,
  };
}

// Given what a contractor has been paid year-to-date, where do they sit
// relative to the filing threshold? 'crossed' = a 1099-NEC is now required;
// 'approaching' = within 80% (start collecting the W-9 now); 'clear' = under.
// Returns null for inbound/received relationships (they don't drive OUR filing).
export function necThresholdStatus(ytdPaid, year = NEC_THRESHOLD_LATEST_KNOWN.year) {
  const paid = Number(ytdPaid);
  if (!isFinite(paid) || paid <= 0) {
    const t = necThresholdForYear(year);
    return { status: 'clear', threshold: t.amount, year: t.year, approximate: t.approximate, paid: 0, remaining: t.amount };
  }
  const t = necThresholdForYear(year);
  const remaining = Math.max(0, t.amount - paid);
  let status = 'clear';
  if (paid >= t.amount) status = 'crossed';
  else if (paid >= t.amount * 0.8) status = 'approaching';
  return { status, threshold: t.amount, year: t.year, approximate: t.approximate, paid, remaining };
}

// One-line, plain-language read of the threshold status for a card.
export function necThresholdLabel(ytdPaid, year) {
  const s = necThresholdStatus(ytdPaid, year);
  const amt = `$${s.threshold.toLocaleString()}${s.approximate ? '+' : ''}`;
  if (s.status === 'crossed') {
    return { tone: 'due', text: `Crossed the ${amt} 1099-NEC threshold (${s.year}) — file a 1099-NEC. Make sure you have their W-9.` };
  }
  if (s.status === 'approaching') {
    return { tone: 'caution', text: `Approaching the ${amt} 1099-NEC threshold (${s.year}) — collect their W-9 now so you can file if they cross it.` };
  }
  return { tone: 'ok', text: `Under the ${amt} 1099-NEC threshold (${s.year}) so far — no filing required yet.` };
}

// ACCESS is isolation-by-default. Darrell 2026-07-18: "All 1099 should have
// isolation UNLESS they are the tax accountant who's working on our taxes."
// So every kind's safe default is 'scoped' (the RLS 1099-Assistant wall:
// finances/forecast/portfolio/family/TLC locked OFF) — the ONE exception is the
// tax accountant, who by the nature of the job must READ the books. Even that
// is least-privilege: read-only, finances + tax documents only, time-boxed to
// the engagement, revocable — never TLC/health/family-personal, never write.
export const ACCESS_MODES = {
  scoped: 'Isolated — only their own work orders; finances and family are walled off (RLS).',
  'finance-read': 'Read-only view of the books + tax documents for tax prep; time-boxed and revocable; no write, no TLC/family-personal.',
};

// The default (and safest) access for a kind. Everyone is isolated except the
// tax accountant. Callers may tighten, never silently loosen.
export function defaultAccessForKind(kind) {
  return kind === 'accountant' ? 'finance-read' : 'scoped';
}

// The KINDS of 1099 relationship the family/church actually has. The kind
// changes the TAX TREATMENT and the safe-access DEFAULT, so it is captured
// once and drives the advisory. `defaultAccess` pairs with the RLS-scoped 1099
// Assistant wall (Relationships): outsiders start tightest.
export const WORKER_KINDS = [
  {
    id: 'business',
    label: 'Business contractor',
    hint: 'Independent — own business, own tools, other clients (e.g. an HVAC or plumbing pro for a rental).',
    defaultAccess: 'scoped',
  },
  {
    id: 'family',
    label: 'Family helper',
    hint: 'A relative helping the family or the family business.',
    defaultAccess: 'scoped',
  },
  {
    id: 'household',
    label: 'Household / in-home care',
    hint: 'Works in or around a home under your direction — caregiver, housekeeper, nanny (e.g. helping an elder who lives alone).',
    defaultAccess: 'scoped',
  },
  {
    id: 'church',
    label: 'Church contractor',
    hint: 'Paid by the church for a service — guest speaker, musician, sound tech, cleaner.',
    defaultAccess: 'scoped',
  },
  {
    id: 'clergy',
    label: 'Clergy / minister',
    hint: 'A pastor or minister — a special dual tax status, not a simple 1099.',
    defaultAccess: 'scoped',
  },
  {
    id: 'accountant',
    label: 'Tax accountant / preparer',
    hint: 'Prepares or files your taxes — the ONE role that reads the books. Read-only, tax scope, time-boxed.',
    defaultAccess: 'finance-read',
  },
];

export const WORKER_KIND_IDS = WORKER_KINDS.map(k => k.id);

export function isWorkerKind(id) {
  return WORKER_KIND_IDS.includes(id);
}

// The heart of the safety layer: given a kind (and optionally the YTD paid +
// year), return the honest advisory. tone: 'ok' | 'caution' | 'warn'. `verify`
// means "this is fact-specific — confirm with a CPA for the real arrangement"
// (DR-0100 tier 2), and is NEVER used to dodge a plain fact (tier 1) or to
// gaslight a real risk. Text is plain-language for a scared, non-expert reader
// (ANXIETY-CLARITY): it says what / why / what to do next.
export function classificationAdvisory(kind, { ytdPaid = 0, year = NEC_THRESHOLD_LATEST_KNOWN.year } = {}) {
  const thr = necThresholdForYear(year);
  const amt = `$${thr.amount.toLocaleString()}${thr.approximate ? '+' : ''}`;
  switch (kind) {
    case 'household':
      return {
        tone: 'warn',
        verify: true,
        headline: 'This may be a household EMPLOYEE — not a 1099 contractor.',
        detail: `Someone who works in or around a home under your direction (a caregiver, housekeeper, or nanny) is usually a household EMPLOYEE, not an independent contractor. For ${year} that means a W-2 and Schedule H (the "nanny tax") — Social Security/Medicare kick in at $${HOUSEHOLD_FICA_TRIGGER_2026.toLocaleString()} paid to one person, and federal unemployment at $${HOUSEHOLD_FUTA_TRIGGER.toLocaleString()} in any quarter. Genuinely independent help (their own schedule, own tools, several clients, or agency-employed) can still be a contractor. It's fact-specific — confirm the arrangement with a CPA before you 1099 them.`,
      };
    case 'clergy':
      return {
        tone: 'warn',
        verify: true,
        headline: 'Clergy have a special dual tax status — not a simple 1099.',
        detail: 'A pastor or minister is generally an EMPLOYEE for income tax (a W-2) but SELF-EMPLOYED for Social Security/Medicare (SECA), with a housing allowance on top. A "love offering" or honorarium to a guest minister is generally taxable income to them. Do not treat a pastor as a plain 1099 contractor — confirm the setup with a CPA who knows clergy tax.',
      };
    case 'family': {
      const base = 'Keeping the work in the family is good — just get the category right. If a relative runs their own business and serves others too, a 1099 is fine. If they work ONLY for you, under your direction, the IRS may treat them as an employee, not a contractor. And purely personal help (not for a business) is not a 1099 at all. Family-employment has special rules (for example, a child under 18 in a parent-owned sole-proprietorship is exempt from Social Security/Medicare) — confirm your specific case with a CPA.';
      return { tone: 'caution', verify: true, headline: 'Family helper — confirm contractor vs. employee.', detail: base };
    }
    case 'church':
      return {
        tone: 'caution',
        verify: false,
        headline: 'Church contractor — the church still files a 1099.',
        detail: `A church is a business for this purpose: it must issue a 1099-NEC to a paid contractor (guest speaker, musician, sound tech, cleaner) at or above ${amt} for ${year}. Being a nonprofit does not exempt it from filing. Collect a W-9 up front. (A pastor/minister is different — mark them "Clergy".)`,
      };
    case 'accountant':
      return {
        tone: 'caution',
        verify: false,
        headline: 'Tax accountant — the ONE role that reads the books.',
        detail: `Every other 1099 worker is walled off from your finances; the tax preparer is the exception, because reading the records is the job. Keep it least-privilege anyway: give READ-ONLY access to the books + tax documents, time-boxed to this filing and revocable, and never TLC, health, or family-personal. The safest hand-off is to EXPORT the year's records to them rather than give a standing login — but for a recurring accountant a scoped read role is fine. Either way the year has to be fully captured in Books first. (Note: a CPA firm that is a corporation is generally exempt from receiving a 1099; a sole-proprietor preparer you pay in your business is not. Confirm with them.)`,
      };
    case 'business':
    default:
      return {
        tone: 'ok',
        verify: false,
        headline: 'Business contractor — the standard 1099 case.',
        detail: `File a 1099-NEC if you pay them ${amt} or more for ${year} in the course of your business. Get their W-9 (legal name + taxpayer ID) BEFORE you pay, so you can actually file. Keep how/when the work is done up to them — that independence is what makes them a contractor and not an employee.`,
      };
  }
}
