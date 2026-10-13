// =============================================================================
// records — reading the family's OWN records into proposals (never assertions)
// =============================================================================
// Built 2026-08-27 from the real Champaign and Danville sources in Drive, after
// reading them by hand once: "Poe Properties - April. 2023.xlsx" and
// "- June 2023.xlsx" (per-door rent rolls and the mortgage tabs), and
// "OCTOBER 2025" (the bank ledger plus that month's rent projections).
//
// Three shapes actually turned up, and each lies in a different way:
//
//   RENT ROLL   — names a person and a rent. The most complete, and the oldest.
//   SECTION 8   — names the PROGRAM in the client column and never the
//                 household. Reading "Section 8" as a tenant's name would put a
//                 government programme on a lease.
//   LEDGER      — names whoever moved money. A bank counterparty is not a
//                 tenancy: the same person can pay for a relative, a worker can
//                 be reimbursed, and nothing in the line says which door.
//
// So nothing here writes a tenancy. Every reader returns a PROPOSAL carrying
// its provenance and, more importantly, what it could NOT determine. The
// landlord confirms; staging.js already refuses an unconfirmed draft.
//
// The other half is divergence(): a proposal held against the live door row,
// naming every conflict rather than overwriting. That is what surfaced the
// three real conflicts at 805 North Prospect — four rows with no unit labels,
// two apartments expecting rent against one row reading "paying", and three
// different purchase prices across three records.
// =============================================================================

/** The programme names that occupy a tenant-name column but name no household. */
export const NOT_A_PERSON = Object.freeze([
  'section 8', 'section8', 'housing authority', 'hud', 'voucher', 'hcv',
  'vacant', 'empty', 'n/a', 'na', 'none', 'unknown', 'tbd', 'deposit',
]);

/** True when a client-column value names a programme or a placeholder. */
export function namesAHousehold(value) {
  const v = String(value ?? '').trim().toLowerCase();
  if (v.length < 2) return false;
  return !NOT_A_PERSON.includes(v);
}

/** "$1,400" / "1,100" / 680 -> 1400 / 1100 / 680; anything else -> null. */
export function money(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const cleaned = String(value).replace(/[$,\s]/g, '');
  if (!/^-?\d+(\.\d+)?$/.test(cleaned)) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

/** "9/16", "10/03/2022", "11/2/22" -> ISO where the year is known, else null. */
export function recordDate(value, { assumeYear = null } = {}) {
  const raw = String(value ?? '').trim();
  const m = /^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/.exec(raw);
  if (!m) return null;
  const [, mm, dd, yy] = m;
  let year = yy ? Number(yy) : assumeYear;
  if (year === null || year === undefined) return null; // a bare 9/16 is not a date
  if (year < 100) year += 2000;
  const month = Number(mm);
  const day = Number(dd);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

const proposal = (kind, source, fields, unresolved) => ({
  kind,
  source,
  fields,
  unresolved,
  confirmed: false, // always. staging.js refuses to write an unconfirmed draft.
});

/**
 * A rent-roll row: { client, rent, rentPaid, datePaid }.
 * The one shape that can carry a household name — when the column holds one.
 */
export function fromRentRollRow(row = {}, { source = '', assumeYear = null } = {}) {
  const unresolved = [];
  const client = String(row.client ?? '').trim();
  const isPerson = namesAHousehold(client);
  if (!isPerson) {
    unresolved.push(
      client
        ? `the client column reads "${client}", which names a programme or placeholder, not a household`
        : 'the client column is empty — no household is named',
    );
  }
  const rent = money(row.rent);
  if (rent === null) unresolved.push('no contract rent on this row');
  const paid = money(row.rentPaid);
  const paidOn = recordDate(row.datePaid, { assumeYear });
  if (row.datePaid && paidOn === null) {
    unresolved.push(`the payment date "${row.datePaid}" carries no year — the year is not inferred`);
  }
  return proposal('rent-roll', source, {
    householdName: isPerson ? client : null,
    contractRent: rent,
    amountPaid: paid,
    paidOn,
  }, unresolved);
}

/**
 * A Section 8 row: { contractRent, programPaid, tenantPortion, datePaid }.
 * The household is structurally absent — that is the finding, not a gap to fill.
 */
export function fromSection8Row(row = {}, { source = '', assumeYear = null } = {}) {
  const unresolved = [
    'the household is not named anywhere on this row — the client column names the programme',
  ];
  const contractRent = money(row.contractRent);
  if (contractRent === null) unresolved.push('no contract rent on this row');
  const programPaid = money(row.programPaid);
  const tenantPortion = money(row.tenantPortion);
  const paidOn = recordDate(row.datePaid, { assumeYear });
  if (row.datePaid && paidOn === null) {
    unresolved.push(`the payment date "${row.datePaid}" carries no year — the year is not inferred`);
  }
  if (contractRent !== null && programPaid !== null && tenantPortion !== null) {
    const short = contractRent - programPaid - tenantPortion;
    // Worth surfacing: a voucher that under-pays the contract rent with no
    // tenant portion to cover it is a real gap, not a rounding artefact.
    if (Math.abs(short) >= 1) {
      unresolved.push(`programme paid ${programPaid} and tenant ${tenantPortion} against contract rent ${contractRent} — ${short > 0 ? 'short' : 'over'} by ${Math.abs(short)}`);
    }
  }
  return proposal('section-8', source, {
    householdName: null,
    contractRent,
    programPaid,
    tenantPortion,
    paidOn,
    subsidised: true,
  }, unresolved);
}

/**
 * A bank ledger line: "Zelle payment from MARCUS WARREN 26546734154".
 * Names a payer and nothing else. Never a tenancy on its own.
 */
export function fromLedgerLine(line = '', { source = '', amount = null, date = null } = {}) {
  const text = String(line);
  // Name words only. The reference that trails a Zelle line contains digits, so
  // stopping at the first token with one ends the name in the right place — a
  // surname in caps must not be mistaken for the start of a reference.
  const m = /(?:zelle payment from|cash app\*|payment from)\s+([A-Za-z][A-Za-z.'-]*(?:\s+[A-Za-z][A-Za-z.'-]*)*)/i.exec(text);
  const payer = m ? m[1].trim().replace(/\s+/g, ' ') : null;
  const unresolved = [
    'a bank counterparty is not a tenancy — the payer, the door and the term all need confirming',
    'this line names no door',
  ];
  if (!payer) unresolved.push('no payer name could be read from this line');
  return proposal('ledger', source, {
    payerName: payer,
    amount: money(amount),
    paidOn: date ?? null,
    rentalId: null, // deliberately never guessed
  }, unresolved);
}

/**
 * A projection line: "Apt. 1 – 805 Prospect", 630.
 * Carries a unit LABEL, which is only useful if the doors are labelled too.
 */
export function fromProjectionLine(label = '', amount = null, { source = '' } = {}) {
  const text = String(label);
  const unit = /apt\.?\s*([0-9a-z]+)/i.exec(text);
  const unresolved = ['a projection is an expectation, not a payment received'];
  if (!unit) unresolved.push('no apartment label in this line');
  return proposal('projection', source, {
    unitLabel: unit ? unit[1].toUpperCase() : null,
    expectedRent: money(amount),
  }, unresolved);
}

/**
 * Can a proposal carrying a unit label be attached to one of these door rows?
 * At 805 North Prospect the answer was no: four rows, every `unit` null. An
 * assignment there would be a coin toss wearing a record's clothes.
 */
export function assignmentIsSafe(unitLabel, doors = []) {
  const label = String(unitLabel ?? '').trim().toUpperCase();
  if (!label) return { safe: false, reason: 'the proposal carries no unit label' };
  const labelled = doors.filter((d) => String(d.unit ?? '').trim() !== '');
  if (labelled.length === 0) {
    return {
      safe: false,
      reason: `none of the ${doors.length} door(s) at this address carry a unit label, so "${label}" cannot be matched to one`,
    };
  }
  const hits = labelled.filter((d) => String(d.unit).trim().toUpperCase() === label);
  if (hits.length === 0) return { safe: false, reason: `no door is labelled "${label}"` };
  if (hits.length > 1) return { safe: false, reason: `${hits.length} doors are labelled "${label}"` };
  return { safe: true, rentalId: hits[0].id };
}

/**
 * Hold a proposal against the live door row and name every conflict. Nothing is
 * overwritten — a divergence is a question for the landlord, not a merge.
 */
export function divergence(proposalOrFields = {}, door = {}) {
  const f = proposalOrFields.fields ?? proposalOrFields;
  const out = [];
  const rent = f.contractRent ?? f.expectedRent ?? null;
  const liveRent = money(door.monthly_rent);
  if (rent !== null && liveRent !== null && liveRent !== 0 && Math.abs(rent - liveRent) >= 1) {
    out.push({ field: 'monthly_rent', record: rent, live: liveRent, note: 'the record and the door disagree on the rent' });
  }
  if (rent !== null && liveRent === 0) {
    out.push({ field: 'monthly_rent', record: rent, live: 0, note: 'the door carries no rent; the record has one' });
  }
  const name = f.householdName ?? null;
  const liveName = String(door.tenant_name ?? '').trim() || null;
  if (name && liveName && name.toLowerCase() !== liveName.toLowerCase()) {
    out.push({ field: 'tenant_name', record: name, live: liveName, note: 'a different household is named here' });
  }
  if (name && !liveName) {
    out.push({ field: 'tenant_name', record: name, live: null, note: 'the door names nobody; the record names a household' });
  }
  // "paying" with nothing behind it is the shape that made 805 look settled.
  if (door.status === 'paying' && rent === null && !name) {
    out.push({ field: 'status', record: null, live: 'paying', note: 'the door reads paying but this record supports neither a rent nor a household' });
  }
  if (door.status === 'unrented' && (f.amountPaid || f.programPaid || f.expectedRent)) {
    out.push({ field: 'status', record: 'money expected or received', live: 'unrented', note: 'the door reads unrented but the record shows money against it' });
  }
  return out;
}

/** Everything a batch could not determine — the landlord's actual worklist. */
export function openQuestions(proposals = []) {
  const seen = new Set();
  const out = [];
  for (const p of proposals) {
    for (const q of p.unresolved ?? []) {
      const key = `${p.kind}::${q}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ kind: p.kind, source: p.source, question: q });
    }
  }
  return out;
}
