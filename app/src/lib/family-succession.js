// app/src/lib/family-succession.js
// -----------------------------------------------------------------------------
// Family Succession & Asset-Transfer PLANNING engine (pure, testable, no React).
//
// WHAT THIS IS: it DOCUMENTS, MODELS, and ORGANIZES a multi-entity family's
// succession plan — for each asset it maps  asset -> owning entity -> intended
// beneficiary -> the transfer INSTRUMENT that applies — flags any asset with no
// plan (probate/exposure risk), and produces an organized package an Illinois
// estate attorney can execute from.
//
// WHAT THIS IS NOT: it is NOT legal advice and it does NOT execute transfers.
// The actual TODI / trust / LLC / POD documents are drafted and filed by a
// licensed Illinois estate attorney. Every legal specific below is FACTUAL /
// educational, cited to the Illinois statute, and flagged ATTORNEY-CONFIRM.
//
// Reality-trace (DR-0061 / DR-0076): the asset inventory is DERIVED from the
// live `data` object (entities / rentals / accounts / debts) — never a hardcoded
// list. Account values read `deriveAccountBalances` (the single source of truth),
// never a painted literal. Values that are genuinely unknown are returned as
// null + flagged, never fabricated.
//
// Legal grounding (verified against ilga.gov primary text, 2026-06-30):
//   TODI  755 ILCS 27/    — Real Property Transfer on Death Instrument Act
//   Trust 760 ILCS 3/     — Illinois Trust Code (3/602: irrevocable by default)
//   LLC   805 ILCS 180/   — Illinois Limited Liability Company Act
//   POD   205 ILCS 625/   — Trust and Payable on Death Accounts Act
//   TOD   815 ILCS 10/    — Uniform TOD Security Registration Act
//   Probate 755 ILCS 5/25-1 (small estate) / 5/2-1 (intestacy) / 5/18-3 (claims)
// -----------------------------------------------------------------------------

import { deriveAccountBalances, CASH_TYPES } from './financial-engineering.js';

// The single, honest, non-moralizing disclaimer. Shown once on the surface and
// stamped into every exported attorney package.
export const NOT_LEGAL_ADVICE =
  'This is a planning and organizing tool — not legal advice. It documents your ' +
  'intentions and does not create or execute any transfer. The actual documents ' +
  '(a transfer on death instrument, trust, LLC operating-agreement terms, or ' +
  'beneficiary designations) must be drafted and filed by a licensed Illinois ' +
  'estate attorney, who confirms what applies to your specific titling and facts.';

// Illinois small-estate affidavit threshold — stored as a DATED, SOURCED value
// so it can be updated when the legislature changes it again (it just changed
// Aug 2025). Do not hardcode this figure elsewhere; read it from here.
export const SMALL_ESTATE_THRESHOLD = {
  amount: 150000,
  effective: '2025-08-15',
  excludes: 'motor vehicles registered with the Secretary of State',
  transfersRealEstate: false, // a small-estate affidavit NEVER transfers real estate
  statute: '755 ILCS 5/25-1',
  publicAct: 'P.A. 104-0346',
  sourceUrl: 'https://www.ilga.gov/documents/legislation/ilcs/documents/075500050K25-1.htm',
  note: 'Applies to deaths on or after Aug 15, 2025; earlier deaths use the prior $100,000 cap. Any summary showing $100,000 is out of date.',
};

// -----------------------------------------------------------------------------
// Asset classes — the vocabulary the mapping keys off. Purely descriptive.
// -----------------------------------------------------------------------------
export const ASSET_CLASSES = {
  real_property: { id: 'real_property', label: 'Real property' },
  business_interest: { id: 'business_interest', label: 'Business / LLC interest' },
  bank_account: { id: 'bank_account', label: 'Bank account' },
  brokerage_account: { id: 'brokerage_account', label: 'Brokerage / securities account' },
};

// -----------------------------------------------------------------------------
// INSTRUMENTS — the transfer-instrument reference registry. Every entry is
// factual + cited; `attorneyConfirm` lists the fact-specific parts a licensed
// Illinois attorney must confirm. `verified` = grounded against primary text.
// -----------------------------------------------------------------------------
export const INSTRUMENTS = [
  {
    id: 'todi',
    name: 'Transfer on Death Instrument (TODI)',
    shortName: 'TODI',
    statute: '755 ILCS 27/',
    sourceUrl: 'https://www.ilga.gov/Legislation/ILCS/Articles?ActID=3382&ChapterID=60',
    appliesTo: ['real_property'],
    verified: true,
    summary:
      'A recorded, deed-like document by which an INDIVIDUAL owner names who receives their real property automatically at death, without probate. The owner keeps full ownership and control while alive (can sell, mortgage, or revoke); it takes effect only at death. Since 2022 (P.A. 102-0068) it covers all Illinois real property, not just residential.',
    keyPoints: [
      'Must be RECORDED with the county recorder BEFORE the owner dies — an unrecorded TODI is ineffective (755 ILCS 27/40).',
      'Signed by the owner, attested by 2 credible witnesses, acknowledged before a notary (755 ILCS 27/45).',
      'Revocable ONLY by a later recorded TODI or a recorded revocation — never by a will and never by tearing it up (755 ILCS 27/55).',
      'The beneficiary takes the property subject to existing mortgages and liens (755 ILCS 27/65).',
      'CANNOT be used by an LLC or any entity — the Act limits "Owner" to an individual/natural person (755 ILCS 27/5). LLC-held real estate transfers at the membership-interest level instead.',
    ],
    attorneyConfirm: [
      'Whether a given property is titled personally (TODI-eligible) or in an LLC (not TODI-eligible) — mis-titling is a common trap.',
      'The exact recordable form, witnessing, and county recording for each property.',
    ],
  },
  {
    id: 'trust',
    name: 'Revocable living trust',
    shortName: 'Trust',
    statute: '760 ILCS 3/',
    sourceUrl: 'https://www.ilga.gov/legislation/ilcs/ilcs5.asp?ActID=4001&ChapterID=61',
    appliesTo: ['real_property', 'business_interest', 'bank_account', 'brokerage_account'],
    verified: true,
    summary:
      'A trust you create and control while alive, transfer assets into, and can change or undo while competent (typically serving as your own trustee). Assets titled in the trust are not part of the probate estate — they pass privately, without probate, under the trust’s terms. It can hold real property (by deed) and LLC membership interests (by assignment), and is paired with a pour-over will for anything left out.',
    keyPoints: [
      'Only assets actually RE-TITLED into the trust ("funding") avoid probate — an unfunded trust does nothing.',
      'Real estate is funded by recording a deed into the trust; an LLC interest by a written assignment (often needs the other members’ consent / operating-agreement compliance).',
      'ILLINOIS QUIRK: under 760 ILCS 3/602 a trust is IRREVOCABLE BY DEFAULT — it is revocable only because the drafting attorney expressly reserves that power. Do not assume revocability.',
      'A pour-over will directs stray assets into the trust at death (those may still pass through probate first).',
    ],
    attorneyConfirm: [
      'Whether a trust is the right instrument here and how to draft the express revocability reservation (760 ILCS 3/602).',
      'Whether each LLC operating agreement permits assigning the membership interest into the trust, and what consents are required.',
      'Exactly which assets to fund into the trust and the deeds/assignments needed.',
    ],
  },
  {
    id: 'llc_succession',
    name: 'LLC operating-agreement succession',
    shortName: 'LLC succession',
    statute: '805 ILCS 180/',
    sourceUrl: 'https://www.ilga.gov/legislation/ilcs/fulltext.asp?DocName=080501800K35-45',
    appliesTo: ['business_interest', 'real_property'],
    verified: true,
    summary:
      'When a member of an LLC dies, what passes is the MEMBERSHIP INTEREST, not the LLC’s underlying property (the LLC keeps owning its real estate uninterrupted). The operating agreement controls succession. If it is silent, Illinois defaults apply — and the defaults are narrow.',
    keyPoints: [
      'A member’s death dissociates the member (805 ILCS 180/35-45).',
      'DEFAULT (agreement silent): only the ECONOMIC / distributional interest passes to the estate; management and voting rights do NOT — the heir becomes a transferee, not a full member, unless the agreement says so or all other members consent (805 ILCS 180/30-10, 30-25).',
      'The operating agreement can and usually should specify who is admitted as a member on death, a buy-sell, or a transfer-on-death of the interest (805 ILCS 180/15-5).',
      'Single-member LLC: the representative can elect IN WRITING WITHIN ONE YEAR to continue the company and avoid dissolution (805 ILCS 180/35-1) — a time-sensitive deadline.',
    ],
    attorneyConfirm: [
      'MOST IMPORTANT: what EACH family LLC’s operating agreement actually says — the statutory defaults apply only where it is silent. The agreements must be read.',
      'Whether an heir receives management/voting rights or only economic rights.',
      'The one-year written continuation election for any single-member LLC.',
    ],
  },
  {
    id: 'pod',
    name: 'Payable-on-Death (POD) designation',
    shortName: 'POD',
    statute: '205 ILCS 625/',
    sourceUrl: 'https://www.ilga.gov/Legislation/ILCS/Articles?ActID=1194&ChapterID=20&Print=True',
    appliesTo: ['bank_account'],
    verified: true,
    summary:
      'A beneficiary named directly on a BANK account (checking, savings, CD) so it passes to that person at death outside probate, by contract. The owner keeps complete control while alive and can change or cancel it at any time without the beneficiary’s consent. A POD designation OVERRIDES the will for that account.',
    keyPoints: [
      'Set up on the bank’s own form — it is not part of the will or trust.',
      'An account with no beneficiary and no joint owner falls into the probate estate.',
      'Because it overrides the will AND the trust, uncoordinated designations can defeat the intended plan.',
    ],
    attorneyConfirm: [
      'Which accounts should carry a POD vs. be titled in a trust, and how designations coordinate with the overall plan.',
      'Entity-owned operating accounts (LLC/company) generally follow the entity’s succession, not a personal POD.',
      'Contingent- and minor-beneficiary handling.',
    ],
  },
  {
    id: 'tod',
    name: 'Transfer-on-Death (TOD) securities registration',
    shortName: 'TOD',
    statute: '815 ILCS 10/',
    sourceUrl: 'https://www.ilga.gov/Legislation/ILCS/Articles?ActID=2305&ChapterID=67&Print=True',
    appliesTo: ['brokerage_account'],
    verified: true,
    summary:
      'The brokerage/securities equivalent of a POD: a beneficiary registered on a stock, bond, or brokerage account so it passes outside probate at death. The owner keeps full control and can change or cancel it at any time. It overrides the will for that account.',
    keyPoints: [
      'Set up with the brokerage in beneficiary form.',
      'Overrides the will; coordinate with the trust and POD designations so nothing is defeated.',
    ],
    attorneyConfirm: [
      'Which accounts should carry a TOD vs. be titled in a trust.',
      'Contingent- and minor-beneficiary handling.',
    ],
  },
];

export const instrumentById = Object.fromEntries(INSTRUMENTS.map((i) => [i.id, i]));

// Plan status the surface tracks per asset (a real state, not legal status).
export const PLAN_STATUS = {
  idea: { id: 'idea', label: 'Idea', order: 0 },
  discussed: { id: 'discussed', label: 'Discussed with family', order: 1 },
  attorney: { id: 'attorney', label: 'With attorney', order: 2 },
  executed: { id: 'executed', label: 'Executed / filed', order: 3 },
};

// -----------------------------------------------------------------------------
// classifyEntityHolding — is the owning entity a natural person (personal) or a
// legal entity (LLC/company)? This drives whether a TODI is even available.
// -----------------------------------------------------------------------------
export function classifyEntityHolding(entity) {
  if (!entity) return 'entity'; // unknown owner → treat as entity (conservative: TODI not assumed)
  return entity.type === 'personal' ? 'personal' : 'entity';
}

// Gather rentals from both the synced top-level table and the seed inflows path,
// deduped by id (first occurrence wins). Real signed-in family data lives in one
// or the other depending on sync state — we never assume just one.
function gatherProperties(data) {
  const seen = new Set();
  const out = [];
  const push = (list) => {
    for (const p of list || []) {
      if (!p || !p.id || seen.has(p.id)) continue;
      seen.add(p.id);
      out.push(p);
    }
  };
  push(data?.rentals);
  push(data?.inflows?.rentals);
  return out;
}

// -----------------------------------------------------------------------------
// buildAssetInventory — DERIVE the transferable-asset rows from live `data`.
// Sources: real property (rentals + home), cash bank accounts, and each business
// entity (its membership interest). Values are real where known, null + flagged
// where unknown — never fabricated.
// -----------------------------------------------------------------------------
export function buildAssetInventory(data, asOf = new Date()) {
  const entities = data?.entities || [];
  const entityById = Object.fromEntries(entities.map((e) => [e.id, e]));
  const rows = [];

  // 1) Real property — from the rentals/home records.
  for (const p of gatherProperties(data)) {
    const entity = entityById[p.entityId];
    const heldBy = classifyEntityHolding(entity);
    const value = Number.isFinite(Number(p.value)) && Number(p.value) > 0 ? Number(p.value) : null;
    const mortgage = p.mortgage && Number.isFinite(Number(p.mortgage.balance)) ? Number(p.mortgage.balance) : null;
    rows.push({
      assetId: `prop:${p.id}`,
      label: p.name || p.address || p.id,
      sub: [p.city, p.state].filter(Boolean).join(', ') || null,
      assetClass: 'real_property',
      owningEntityId: p.entityId || null,
      owningEntityName: entity ? entity.name : (p.entityId || 'Unassigned'),
      heldBy,
      value,
      valueKnown: value != null,
      valueEstimated: !!(p.mortgage && p.mortgage.estimated),
      mortgageBalance: mortgage,
      meta: { propertyType: p.propertyType || null, status: p.status || null },
    });
  }

  // 2) Bank accounts — cash types only (credit accounts are liabilities, below).
  const balances = deriveAccountBalances(data, asOf);
  for (const a of data?.accounts || []) {
    if (!CASH_TYPES.includes(a.type)) continue;
    const entity = entityById[a.entityId];
    const heldBy = classifyEntityHolding(entity);
    const derived = balances[a.id];
    const isBrokerage = a.type === 'investment';
    rows.push({
      assetId: `acct:${a.id}`,
      label: a.name || a.id,
      sub: [entity ? entity.name : null, a.fragment].filter(Boolean).join(' · ') || null,
      assetClass: isBrokerage ? 'brokerage_account' : 'bank_account',
      owningEntityId: a.entityId || null,
      owningEntityName: entity ? entity.name : (a.entityId || 'Unassigned'),
      heldBy,
      value: derived != null ? derived : null,
      valueKnown: derived != null,
      valueEstimated: false,
      meta: { accountType: a.type },
    });
  }

  // 3) Business / LLC interests — one asset per business entity (the interest).
  for (const e of entities) {
    if (e.type !== 'business') continue;
    rows.push({
      assetId: `entity:${e.id}`,
      label: `${e.name}`,
      sub: 'Membership interest',
      assetClass: 'business_interest',
      owningEntityId: e.id,
      owningEntityName: e.name,
      heldBy: 'entity',
      value: null, // interest value is unknown without a valuation — never fabricate
      valueKnown: false,
      valueEstimated: false,
      meta: { entityType: e.type },
    });
  }

  return rows;
}

// -----------------------------------------------------------------------------
// liabilitiesFor — informational only. Debts + credit-card balances that attach
// to the estate / travel with assets (a TODI beneficiary takes subject to liens,
// 755 ILCS 27/65). Surfaced in the attorney package for a complete picture.
// -----------------------------------------------------------------------------
export function liabilitiesFor(data, asOf = new Date()) {
  const entities = data?.entities || [];
  const entityById = Object.fromEntries(entities.map((e) => [e.id, e]));
  const out = [];
  for (const d of data?.debts || []) {
    out.push({
      id: `debt:${d.id}`,
      label: d.name || d.id,
      balance: Number.isFinite(Number(d.balance)) ? Number(d.balance) : null,
      owningEntityName: entityById[d.entityId] ? entityById[d.entityId].name : (d.entityId || 'Unassigned'),
      kind: 'debt',
    });
  }
  const balances = deriveAccountBalances(data, asOf);
  for (const a of data?.accounts || []) {
    if (a.type !== 'credit') continue;
    const bal = balances[a.id];
    out.push({
      id: `acct:${a.id}`,
      label: a.name || a.id,
      balance: bal != null ? bal : null, // negative = owed
      owningEntityName: entityById[a.entityId] ? entityById[a.entityId].name : (a.entityId || 'Unassigned'),
      kind: 'credit',
    });
  }
  return out;
}

// -----------------------------------------------------------------------------
// suggestInstrument — the FACTUAL, educational mapping of which instrument
// typically applies to an asset given how it is held. Always advisory; every
// suggestion is subject to attorney confirmation. `blocked` names instruments
// that do NOT apply and why (e.g. TODI cannot be used on LLC-held property).
// -----------------------------------------------------------------------------
export function suggestInstrument(asset) {
  if (!asset) return { primary: null, alternatives: [], blocked: [], note: null, advisory: true };
  const cls = asset.assetClass;

  if (cls === 'real_property') {
    if (asset.heldBy === 'personal') {
      return {
        primary: 'todi',
        alternatives: ['trust'],
        blocked: [],
        note: 'Held personally — a TODI can name who receives it at death, or it can be deeded into a trust. Must be recorded before death.',
        advisory: true,
      };
    }
    return {
      primary: 'llc_succession',
      alternatives: ['trust'],
      blocked: [{
        id: 'todi',
        reason: 'TODI can only be executed by an individual owner (755 ILCS 27/5). This property is titled in an LLC, so it transfers at the membership-interest level — not by a TODI on the property.',
      }],
      note: 'Titled in an LLC — the LLC keeps owning the property; what passes at death is the LLC membership interest (via the operating agreement or by assigning the interest into a trust).',
      advisory: true,
    };
  }

  if (cls === 'business_interest') {
    return {
      primary: 'llc_succession',
      alternatives: ['trust'],
      blocked: [],
      note: 'The membership interest passes per the operating agreement; it can also be assigned into a trust (subject to the agreement’s consent terms).',
      advisory: true,
    };
  }

  if (cls === 'bank_account') {
    return {
      primary: 'pod',
      alternatives: ['trust'],
      blocked: [],
      note: asset.heldBy === 'entity'
        ? 'Entity-owned operating account — generally follows the LLC’s succession, not a personal POD. Confirm with the attorney.'
        : 'A POD beneficiary passes it outside probate; it can also be titled in a trust. A POD overrides the will.',
      advisory: true,
    };
  }

  if (cls === 'brokerage_account') {
    return {
      primary: 'tod',
      alternatives: ['trust'],
      blocked: [],
      note: 'A TOD registration passes it outside probate; it can also be titled in a trust. A TOD overrides the will.',
      advisory: true,
    };
  }

  return { primary: null, alternatives: [], blocked: [], note: null, advisory: true };
}

// -----------------------------------------------------------------------------
// assetMapRows — the core view: inventory + the user's plan overlay + the
// suggested instrument, one row per asset. `plan` is { [assetId]: {beneficiary,
// instrument, status, notes} }.
// -----------------------------------------------------------------------------
export function assetMapRows(data, plan = {}, asOf = new Date()) {
  return buildAssetInventory(data, asOf).map((asset) => {
    const p = plan[asset.assetId] || {};
    const suggestion = suggestInstrument(asset);
    const instrument = p.instrument || '';
    const beneficiary = p.beneficiary || '';
    return {
      ...asset,
      beneficiary,
      instrument,
      status: p.status || 'idea',
      notes: p.notes || '',
      suggestion,
      planStatus: planStatusFor({ beneficiary, instrument }),
    };
  });
}

// planStatusFor — a real derived status: does this asset have a plan yet?
export function planStatusFor(row) {
  const hasBen = !!(row && row.beneficiary && String(row.beneficiary).trim());
  const hasInst = !!(row && row.instrument && String(row.instrument).trim());
  if (hasBen && hasInst) return 'planned';
  if (hasBen || hasInst) return 'partial';
  return 'unplanned';
}

// -----------------------------------------------------------------------------
// gapAnalysis — the gap view. Flags every asset with no (or partial) transfer
// plan as exposure, and highlights real property with no instrument as the
// sharpest probate risk (real estate can never use a small-estate affidavit).
// -----------------------------------------------------------------------------
export function gapAnalysis(rows) {
  const planned = [];
  const partial = [];
  const unplanned = [];
  for (const r of rows) {
    if (r.planStatus === 'planned') planned.push(r);
    else if (r.planStatus === 'partial') partial.push(r);
    else unplanned.push(r);
  }
  const probateRisk = rows.filter(
    (r) => r.assetClass === 'real_property' && r.planStatus !== 'planned',
  );
  const total = rows.length;
  return {
    total,
    counts: { planned: planned.length, partial: partial.length, unplanned: unplanned.length },
    coverage: total ? Math.round((planned.length / total) * 100) : 0,
    planned,
    partial,
    unplanned,
    exposure: [...unplanned, ...partial],
    probateRisk,
  };
}

// -----------------------------------------------------------------------------
// buildAttorneyPackage — the organized, attorney-ready export. A structured
// object grouping assets by owning entity, with each asset's intended
// beneficiary + instrument + status + notes, the gap list, liabilities context,
// the source citations, and the not-legal-advice framing.
// -----------------------------------------------------------------------------
export function buildAttorneyPackage(data, plan = {}, meta = {}) {
  const generatedAt = meta.generatedAt || null; // caller stamps (no Date.now in lib)
  const rows = assetMapRows(data, plan, meta.asOf ? new Date(meta.asOf) : new Date());
  const gaps = gapAnalysis(rows);
  const entities = data?.entities || [];

  const byEntity = {};
  for (const r of rows) {
    const key = r.owningEntityName || 'Unassigned';
    (byEntity[key] = byEntity[key] || []).push(r);
  }

  const usedInstrumentIds = new Set();
  for (const r of rows) {
    if (r.instrument) usedInstrumentIds.add(r.instrument);
    if (r.suggestion && r.suggestion.primary) usedInstrumentIds.add(r.suggestion.primary);
  }

  return {
    generatedAt,
    disclaimer: NOT_LEGAL_ADVICE,
    family: meta.familyName || null,
    state: 'Illinois',
    entities: entities.map((e) => ({ id: e.id, name: e.name, type: e.type, notes: e.notes || null })),
    assetsByEntity: byEntity,
    assets: rows,
    gaps,
    liabilities: liabilitiesFor(data, meta.asOf ? new Date(meta.asOf) : new Date()),
    smallEstate: SMALL_ESTATE_THRESHOLD,
    instruments: INSTRUMENTS.filter((i) => usedInstrumentIds.has(i.id)),
    attorneyQuestions: buildAttorneyQuestions(rows),
  };
}

// The concrete "read this / confirm this" list for the attorney, derived from
// what is actually in the plan (not a generic checklist).
export function buildAttorneyQuestions(rows) {
  const qs = [];
  const llcHeldRealProp = rows.filter((r) => r.assetClass === 'real_property' && r.heldBy === 'entity');
  if (llcHeldRealProp.length) {
    qs.push(
      `Confirm succession for ${llcHeldRealProp.length} LLC-held propert${llcHeldRealProp.length === 1 ? 'y' : 'ies'}: these cannot use a TODI (755 ILCS 27/5) — confirm the operating-agreement / trust-assignment path for the membership interest.`,
    );
  }
  const personalRealProp = rows.filter((r) => r.assetClass === 'real_property' && r.heldBy === 'personal');
  if (personalRealProp.length) {
    qs.push(
      `Confirm TODI eligibility and recordable form for ${personalRealProp.length} personally-held propert${personalRealProp.length === 1 ? 'y' : 'ies'}.`,
    );
  }
  const businessInterests = rows.filter((r) => r.assetClass === 'business_interest');
  if (businessInterests.length) {
    qs.push(
      `Read the operating agreement for each of ${businessInterests.length} LLC${businessInterests.length === 1 ? '' : 's'} — the statutory defaults (805 ILCS 180/30-10, 30-25) apply only where the agreement is silent.`,
    );
  }
  const unplanned = rows.filter((r) => r.planStatus === 'unplanned');
  if (unplanned.length) {
    qs.push(`Address ${unplanned.length} asset${unplanned.length === 1 ? '' : 's'} with no transfer plan (probate exposure).`);
  }
  return qs;
}

// -----------------------------------------------------------------------------
// renderAttorneyPackageText — a plain-text / markdown rendering of the package
// for copy-out / download. Pure string builder.
// -----------------------------------------------------------------------------
export function renderAttorneyPackageText(pkg) {
  const L = [];
  L.push('# Family Succession Plan — Attorney Package');
  if (pkg.family) L.push(`Family: ${pkg.family}`);
  L.push(`State: ${pkg.state}`);
  if (pkg.generatedAt) L.push(`Prepared: ${pkg.generatedAt}`);
  L.push('');
  L.push(`> ${pkg.disclaimer}`);
  L.push('');

  L.push('## Entities');
  for (const e of pkg.entities) {
    L.push(`- ${e.name} (${e.type})${e.notes ? ` — ${e.notes}` : ''}`);
  }
  L.push('');

  L.push('## Assets, intended beneficiaries, and applicable instrument');
  for (const [entityName, assets] of Object.entries(pkg.assetsByEntity)) {
    L.push('');
    L.push(`### ${entityName}`);
    for (const a of assets) {
      const inst = a.instrument ? (instrumentById[a.instrument] ? instrumentById[a.instrument].shortName : a.instrument) : '(none chosen)';
      const suggested = a.suggestion && a.suggestion.primary ? instrumentById[a.suggestion.primary].shortName : '—';
      const val = a.valueKnown ? formatMoney(a.value) : 'value unknown';
      L.push(`- **${a.label}** — ${ASSET_CLASSES[a.assetClass] ? ASSET_CLASSES[a.assetClass].label : a.assetClass} · ${val}`);
      L.push(`  - Intended beneficiary: ${a.beneficiary || '(not set)'}`);
      L.push(`  - Instrument chosen: ${inst}  |  Suggested: ${suggested}  |  Status: ${(PLAN_STATUS[a.status] || {}).label || a.status}`);
      if (a.suggestion && a.suggestion.blocked && a.suggestion.blocked.length) {
        for (const b of a.suggestion.blocked) L.push(`  - Note: ${b.reason}`);
      }
      if (a.notes) L.push(`  - Notes: ${a.notes}`);
    }
  }
  L.push('');

  L.push('## Gaps / probate exposure');
  L.push(`- Coverage: ${pkg.gaps.coverage}% (${pkg.gaps.counts.planned}/${pkg.gaps.total} assets fully planned)`);
  if (pkg.gaps.exposure.length) {
    L.push('- Assets needing attention:');
    for (const a of pkg.gaps.exposure) L.push(`  - ${a.label} (${a.planStatus})`);
  } else {
    L.push('- Every asset has an intended beneficiary and instrument.');
  }
  if (pkg.gaps.probateRisk.length) {
    L.push(`- Real property with no instrument (real estate can NEVER use a small-estate affidavit — ${pkg.smallEstate.statute}):`);
    for (const a of pkg.gaps.probateRisk) L.push(`  - ${a.label}`);
  }
  L.push('');

  if (pkg.attorneyQuestions.length) {
    L.push('## For the attorney to confirm');
    for (const q of pkg.attorneyQuestions) L.push(`- ${q}`);
    L.push('');
  }

  L.push('## Instrument reference (Illinois — factual, cited)');
  for (const i of pkg.instruments) {
    L.push(`- **${i.name}** (${i.statute}): ${i.summary}`);
  }
  L.push('');
  L.push(`Small-estate affidavit threshold: ${formatMoney(pkg.smallEstate.amount)} (${pkg.smallEstate.statute}, ${pkg.smallEstate.publicAct}, eff. ${pkg.smallEstate.effective}); does not transfer real estate.`);
  L.push('');
  L.push(`_${pkg.disclaimer}_`);
  return L.join('\n');
}

function formatMoney(n) {
  if (n == null || !Number.isFinite(Number(n))) return '—';
  const v = Number(n);
  const sign = v < 0 ? '-' : '';
  return `${sign}$${Math.abs(Math.round(v)).toLocaleString('en-US')}`;
}
