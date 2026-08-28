// =============================================================================
// lease-template — the actual contract, not a summary of one
// =============================================================================
// Darrell, 2026-08-28: "I need usable documents... obviously... not just fake
// data... preloaded with the default contract we will use unless we update it."
//
// He is right and the criticism is exact. What the Documents tab produced for a
// lease was TEN LINES — property, tenant, term, rent, deposit, and a sentence
// about the app. That is a cover sheet. Nobody can sign it, so the tab could
// never do the job it exists for.
//
// WHAT THIS IS. The default residential lease, as structured clauses with merge
// fields, preloaded so a door with a tenancy produces a document a person can
// actually read end to end. It is DATA, not prose baked into a function, so it
// can be edited and replaced — "unless we update it" is the requirement, and an
// override stored per instance (0157) beats this default whenever one exists.
//
// WHAT IT IS NOT, said plainly and kept on the face of every draft: this is a
// starting template, not advice, and not a substitute for the family's own
// counsel. Two disciplines keep it honest:
//
//   1. NO STATUTORY NUMBER IS WRITTEN HERE FROM MEMORY. Deposit deadlines,
//      interest, entry notice and cure periods are `{{legal:...}}` tokens that
//      resolve through jurisdictions.js — which returns a NAMED BLANK carrying
//      its citation until a human verifies it for that state and city. A lease
//      that prints "[Days to return a security deposit — confirm against 765
//      ILCS 710]" is useful; one that prints a number I recalled is a liability.
//      Champaign and Danville each layer over Illinois, and the registry knows
//      that even where the value is still unverified.
//
//   2. THE REAL SIGNED LEASE OUTRANKS THIS. Drive holds "Leonard Morris Lease
//      2022-23.pdf" — the family's own executed lease. It is a nine-page SCAN
//      with no extractable text, so its clauses could not be read into here.
//      The moment a readable copy exists it replaces this default wholesale
//      through the same override path; nothing here is precious.
// =============================================================================

/** Bumped whenever the default body changes, so a draft can name what it came from. */
export const TEMPLATE_VERSION = '2026-08-28.1';

export const TEMPLATE_STATUS = Object.freeze({
  id: 'lease-whole-unit',
  version: TEMPLATE_VERSION,
  source: 'PoeTech default — drafted for Illinois residential tenancies',
  reviewed: false,          // flipped only when counsel has actually reviewed it
  note: 'A starting template, not legal advice. Every statutory period in it is a citation to confirm, not a number to trust. Counsel reviews before anyone signs.',
});

/**
 * The default lease. `{{token}}` is a merge field; `{{legal:id}}` resolves
 * through the jurisdiction registry and prints a cited blank when unverified.
 *
 * Ordered the way a person reads a lease: who and what first, money second,
 * living in it third, ending it last.
 */
export const DEFAULT_LEASE = Object.freeze([
  {
    heading: '1. The parties and the property',
    clauses: [
      'This Residential Lease is made between {{landlord}} ("Landlord") and {{tenant}} ("Tenant").',
      'Landlord leases to Tenant the residential premises at {{property}} ("the Premises"), together with the fixtures and appliances in it at move-in, which are listed in the Move-In Condition Report attached to this lease and made part of it.',
      'Only Tenant and the people named in this lease may occupy the Premises as their residence. Anyone staying longer than {{guestDays}} consecutive days must be added to this lease in writing first.',
    ],
  },
  {
    heading: '2. Term',
    clauses: [
      'The term begins on {{leaseStart}} and ends on {{leaseEnd}}.',
      'If Tenant stays past the end date with Landlord’s written consent and no new lease is signed, the tenancy continues month to month on these same terms, ending when either party gives the other written notice of at least one full rental period.',
      'Staying past the end date WITHOUT consent is a holdover, and Landlord may pursue the remedies the law allows.',
    ],
  },
  {
    heading: '3. Rent',
    clauses: [
      'Rent is {{rent}} per month, due in full on the {{rentDueDay}} of each month, without Landlord having to ask.',
      'Rent is paid to Poe Properties by the method agreed in writing. The Poe Properties app RECORDS what was paid and when; it does not move money and never holds a card or an account number.',
      'A payment that arrives after the due date is late. Any late fee must be stated here and must not exceed what the law allows: {{lateFee}}.',
      'A payment returned unpaid by the bank is treated as rent not paid, plus any bank charge actually incurred.',
      'If the term starts or ends mid-month, that month’s rent is prorated by the day.',
    ],
  },
  {
    heading: '4. Security deposit',
    clauses: [
      'Tenant pays a security deposit of {{deposit}} before taking possession. It is not rent and may not be used by Tenant as the last month’s rent.',
      'The deposit secures unpaid rent and damage beyond ordinary wear and tear. It does not cover ordinary wear.',
      'After the tenancy ends, Landlord returns the deposit, less any lawful deductions, within {{legal:deposit-return-days}}.',
      'Where an itemized statement of deductions is required, Landlord provides it within {{legal:deposit-itemization-days}}, with the paid receipts or estimates the law requires.',
      'Interest on the deposit, where owed: {{legal:deposit-interest}}.',
      'The Move-In and Move-Out Condition Reports, with their photographs, are the record this accounting is made from. Both are kept in the app and are available to Tenant.',
    ],
  },
  {
    heading: '5. Utilities and services',
    clauses: [
      'Tenant pays for and puts in Tenant’s own name: {{tenantUtilities}}.',
      'Landlord pays for: {{landlordUtilities}}.',
      'Tenant does not let a service Tenant is responsible for be shut off during the term, because heat, water and power failing in a dwelling is a habitability matter and not only a billing one.',
    ],
  },
  {
    heading: '6. Condition, use and care',
    clauses: [
      'Landlord delivers the Premises in a condition fit to live in and keeps the structure, roof, plumbing, electrical, heating and any appliance supplied by Landlord in working repair.',
      'Tenant keeps the Premises clean and sanitary, disposes of rubbish properly, uses the plumbing, electrical and heating as intended, and does not deliberately or negligently damage anything.',
      'Tenant does not make alterations, paint, or change locks without Landlord’s written consent. Any lock change consented to must be given to Landlord in a working key the same day.',
      'Tenant does not use the Premises for anything unlawful, and does not create a nuisance for neighbours.',
    ],
  },
  {
    heading: '7. Repairs and how they are reported',
    clauses: [
      'Tenant reports anything broken through the Poe Properties app, where Tenant can watch the work order to done and read every message and date on it. A report by text or phone is also accepted and is entered on the same record.',
      'Landlord responds to an emergency — no heat, no water, no power, a failure that makes the home unsafe — as fast as it can be got to, and to everything else within a reasonable time.',
      'Tenant reports a leak, a smell of gas, a failing smoke or carbon monoxide alarm, or water where water should not be, IMMEDIATELY. Damage that grows because it went unreported is Tenant’s.',
    ],
  },
  {
    heading: '8. Entry by Landlord',
    clauses: [
      'Landlord may enter to inspect, repair, show the unit, or in an emergency.',
      'Except in an emergency, Landlord gives Tenant advance notice of {{legal:entry-notice-hours}} and enters at a reasonable hour.',
      'Every entry is recorded in the app with its date, reason and who entered, so the record exists for both sides.',
    ],
  },
  {
    heading: '9. Safety devices',
    clauses: [
      'Landlord provides working smoke alarms and, where a fuel-burning appliance or attached garage is present, working carbon monoxide alarms.',
      'Tenant tests them, does not disable or remove them, and reports a failure at once. Replacing a battery Tenant can reach is Tenant’s; a failed device is Landlord’s.',
    ],
  },
  {
    heading: '10. Pets',
    clauses: [
      'Pets: {{pets}}.',
      'An assistance animal required by a person with a disability is not a pet, is not charged a pet fee, and is handled as the law requires.',
    ],
  },
  {
    heading: '11. Insurance',
    clauses: [
      'Landlord insures the building. Landlord does NOT insure Tenant’s belongings.',
      'Tenant is strongly encouraged to carry renter’s insurance. Where this lease requires it, the requirement is stated here: {{rentersInsurance}}.',
    ],
  },
  {
    heading: '12. Assignment and subletting',
    clauses: [
      'Tenant does not assign this lease or sublet the Premises, in whole or in part, including through any short-stay platform, without Landlord’s written consent.',
    ],
  },
  {
    heading: '13. If Tenant does not keep this lease',
    clauses: [
      'If rent is unpaid, Landlord gives written notice and the cure period the law requires: {{legal:late-rent-cure-days}}. A notice under this lease is a plain, dated statement of what is owed — never a threat.',
      'For a breach other than rent, Landlord gives written notice describing it and a reasonable time to fix it, unless the law provides otherwise.',
      'Landlord does not lock Tenant out, remove Tenant’s belongings, or shut off a utility to force Tenant to leave. Possession is recovered only through the court process the law provides.',
      'Landlord takes no action against Tenant for reporting a code violation, requesting a repair, or exercising a legal right.',
    ],
  },
  {
    heading: '14. Ending the tenancy and moving out',
    clauses: [
      'At the end of the term Tenant returns the Premises broom-clean and in the condition it was received, ordinary wear and tear excepted, and returns every key and remote.',
      'Landlord and Tenant walk the unit together at move-out where practical, and the Move-Out Condition Report with its photographs is made the same day.',
      'Tenant gives Landlord a forwarding address in writing so the deposit accounting can be delivered.',
    ],
  },
  {
    heading: '15. Disclosures',
    clauses: [
      'The disclosures this lease must carry, and which are attached to and made part of it: {{legal:lease-disclosures}}.',
      'For any dwelling built before 1978, the federal lead-based paint disclosure and the EPA pamphlet are attached and acknowledged separately, as federal law requires.',
    ],
  },
  {
    heading: '16. The whole agreement',
    clauses: [
      'This lease, with its attached condition report and disclosures, is the entire agreement. Nothing said before it is part of it.',
      'A change is only effective in writing, signed by both.',
      'If any part of this lease is held unenforceable, the rest stays in force.',
      'Landlord not enforcing a term once does not waive it.',
    ],
  },
  {
    heading: '17. Signatures',
    clauses: [
      'Landlord: {{landlord}}   Date: ______________',
      'Tenant: {{tenant}}   Date: ______________',
      'Tenant acknowledges receiving a copy of this lease, the condition report, and every disclosure named in it.',
    ],
  },
]);

/** Every merge field the default body uses, so a caller can see what it must supply. */
export const MERGE_FIELDS = Object.freeze([
  'landlord', 'tenant', 'property', 'leaseStart', 'leaseEnd', 'rent', 'rentDueDay',
  'lateFee', 'deposit', 'guestDays', 'tenantUtilities', 'landlordUtilities',
  'pets', 'rentersInsurance',
]);

const TOKEN = /\{\{\s*([a-zA-Z][\w-]*(?::[a-z-]+)?)\s*\}\}/g;

/**
 * Fill one clause. `value(name)` supplies a merge field, `legal(id)` supplies a
 * statutory value. Either may return null, and a null becomes a NAMED BLANK —
 * never an invented value, and never a silently empty sentence (DR-0076 §8).
 * Returns the text plus every blank it left, so the caller can list what the
 * draft still needs before it is signable.
 */
export function fillClause(clause, { value, legal } = {}) {
  const blanks = [];
  const text = String(clause).replace(TOKEN, (_m, token) => {
    if (token.startsWith('legal:')) {
      const id = token.slice(6);
      const got = legal ? legal(id) : null;
      if (got && got.text) {
        if (got.blank) blanks.push(got.blank);
        return got.text;
      }
      blanks.push(id);
      return `[${id}]`;
    }
    const v = value ? value(token) : null;
    if (v === null || v === undefined || String(v).trim() === '') {
      blanks.push(token);
      return `[${token}]`;
    }
    return String(v);
  });
  return { text, blanks };
}

/**
 * Render the whole lease. Returns the lines a document is built from and every
 * blank still in it — a draft that knows what it is missing is the difference
 * between a document and a form somebody has to proofread.
 */
export function renderLease(template = DEFAULT_LEASE, io = {}) {
  const lines = [];
  const blanks = [];
  for (const section of template) {
    lines.push(section.heading, '');
    for (const clause of section.clauses) {
      const out = fillClause(clause, io);
      lines.push(out.text);
      for (const b of out.blanks) if (!blanks.includes(b)) blanks.push(b);
    }
    lines.push('');
  }
  return { lines, blanks };
}

/**
 * The body in force for an instance: its own saved override if it has one, the
 * default otherwise. "Preloaded with the default contract we will use unless we
 * update it" is exactly this shape — the default is a starting point that never
 * silently overwrites a decision somebody made.
 */
export function leaseInForce(override) {
  if (Array.isArray(override) && override.length > 0) {
    return { template: override, source: 'saved', version: null };
  }
  if (override && Array.isArray(override.body) && override.body.length > 0) {
    return { template: override.body, source: 'saved', version: override.version || null };
  }
  return { template: DEFAULT_LEASE, source: 'default', version: TEMPLATE_VERSION };
}
