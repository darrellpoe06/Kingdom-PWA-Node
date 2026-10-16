// =============================================================================
// giving-statement-source — the giving book feeds the contribution statement
// =============================================================================
// DR-1064 built the IRS Pub 1771 statement (`giving-statement.js`) and shipped
// it with NO CALLER. The church's record of what it received already exists --
// `church_giving_claims` (migration 0214, "the office keeps its own book of
// what the church received") -- so the church had both halves and could not
// issue a single statement. This is the bridge, and it is where the decisions
// that could HARM a giver live.
//
// THREE RULES, each one a way a well-meaning office does real damage:
//
// 1. ONLY A HUMAN-CONFIRMED ATTRIBUTION MAY BE PRINTED FOR A NAMED MEMBER.
//    A claim carries `parishionerId` as soon as the matcher PROPOSES a member
//    (match_basis records how it was proposed -- "provenance, not proof", in
//    0214's own words), and `confirmedBy` is null until a person agreed. An
//    unconfirmed proposal on a tax document attributes one person's money to
//    another. Excluded, counted, and said out loud -- never silently dropped,
//    because a member who gave $900 and is handed $600 must be told why.
//
// 2. THE DONOR'S DEDUCTION IS WHAT THEY GAVE, NOT WHAT ARRIVED. A claim holds
//    gross, fee and net; the processor's fee is the CHURCH's cost of accepting
//    the gift, not a reduction of the gift. So the statement is built from
//    `grossCents`. Using net would understate every electronic giver's year.
//
// 3. A REFUND IS SHOWN, NOT HIDDEN. A reversed gift is a negative claim in the
//    book. It stays on the statement as a negative line so the total is what
//    the person actually gave and the arithmetic can be followed -- quietly
//    dropping it would overstate the year, which is the dangerous direction.
//
// PURE. No fetch, no clock, no store. The caller brings the claims.
import { buildStatement, titheTaxNote, ANONYMOUS_NOTICE } from './giving-statement.js';

/** How a statement names where its rows came from. */
export const BASIS = Object.freeze({
  member: 'member',   // confirmed by a person, attributed to a member account
  sender: 'sender',   // the name the processor printed, nobody matched to an account
});

export const UNCONFIRMED_NOTICE =
  'Gifts the matcher only PROPOSED for this person are left off: nobody has confirmed them, and a proposal on a tax document attributes one person’s money to another. Confirm the giver in the review queue and issue again.';

export const SENDER_BASIS_NOTICE =
  'This is built from the name the payment processor printed on the gift, not from a member account. It is the right document for a giver nobody has matched yet — check the name is the person asking before you hand it over.';

export const GROSS_NOT_NET_NOTICE =
  'Each gift is shown as the amount given, before the processor’s fee. The fee is the church’s cost of accepting the gift, not a reduction of the gift.';

const str = (v) => String(v == null ? '' : v).trim();

/**
 * Pure. The claims that belong on ONE person's statement, with the proposals
 * that do not — and the count of what was held back.
 *
 * Exactly one of `parishionerId` / `giverName` selects the person.
 *
 * @param {Array<object>} claims rows as `fromClaimRow` returns them
 * @returns {{basis: string, rows: object[], heldBack: number, heldBackCents: number}}
 */
export function claimsForGiver(claims = [], { parishionerId = null, giverName = null } = {}) {
  const id = str(parishionerId);
  const name = str(giverName);
  const all = Array.isArray(claims) ? claims : [];

  if (id) {
    const mine = all.filter((c) => str(c && c.parishionerId) === id);
    // RULE 1. A proposal is not a fact.
    const rows = mine.filter((c) => !!str(c.confirmedBy));
    const held = mine.filter((c) => !str(c.confirmedBy));
    return {
      basis: BASIS.member,
      rows,
      heldBack: held.length,
      heldBackCents: held.reduce((t, c) => t + (Number(c.grossCents) || 0), 0),
    };
  }

  if (name) {
    // The processor's own name on the gift. Matching is exact after trimming:
    // a fuzzy match here would quietly merge two people with similar names on
    // a tax document, and the book deliberately never rewrites giver_name.
    const rows = all.filter((c) => str(c && c.giverName) === name);
    return { basis: BASIS.sender, rows, heldBack: 0, heldBackCents: 0 };
  }

  return { basis: BASIS.sender, rows: [], heldBack: 0, heldBackCents: 0 };
}

/**
 * Pure. One claim row -> the gift shape `giving-statement.js` normalizes.
 *
 * `methodByBatch` turns a batch id into how the money came in ('cashapp'),
 * which is the batch's own `source`. Unknown stays empty rather than guessing.
 */
export function giftFromClaim(claim = {}, methodByBatch = {}) {
  return {
    id: claim.id || claim.slug || '',
    date: str(claim.givenOn).slice(0, 10),
    fund: str(claim.fund),
    method: str(methodByBatch[claim.batchId] || ''),
    amountCents: Number(claim.grossCents) || 0,   // RULE 2: gross, never net
    // The book records money that arrived through a processor, so there is no
    // non-cash gift in it and nothing to describe. A donated piano is entered
    // by hand elsewhere; this bridge never invents a description, and
    // `normalizeGift` treats a row with an amount as cash regardless.
    nonCashDescription: '',
    goodsValueCents: 0,
  };
}

/**
 * Pure. The whole job: a person, a year, and the book -> a statement or an
 * honest refusal, with the notices that make the number readable.
 *
 * Returns `buildStatement`'s own result, with `source` attached in both cases
 * so a refusal can still say "and 3 proposed gifts were held back" -- which is
 * the single most likely reason a member's year looks short.
 */
export function statementFromClaims({
  claims = [], church = {}, member = {}, year, issuedOn,
  parishionerId = null, giverName = null, batches = [],
} = {}) {
  const methodByBatch = Object.fromEntries(
    (Array.isArray(batches) ? batches : [])
      .filter((b) => b && b.id)
      .map((b) => [b.id, str(b.source)]),
  );
  const picked = claimsForGiver(claims, { parishionerId, giverName });
  const gifts = picked.rows.map((c) => giftFromClaim(c, methodByBatch));
  const res = buildStatement({ church, member, gifts, year, issuedOn });

  const notices = [GROSS_NOT_NET_NOTICE];
  if (picked.heldBack > 0) notices.unshift(UNCONFIRMED_NOTICE);
  if (picked.basis === BASIS.sender) notices.unshift(SENDER_BASIS_NOTICE);

  return {
    ...res,
    source: {
      basis: picked.basis,
      counted: gifts.length,
      heldBack: picked.heldBack,
      heldBackCents: picked.heldBackCents,
      notices,
    },
  };
}

// ---------------------------------------------------------------------------
// The document that is actually handed over
// ---------------------------------------------------------------------------

const money = (cents) => `$${(Math.round(Number(cents) || 0) / 100).toFixed(2)}`;

/**
 * Pure. The statement as the plain text a member keeps with their tax papers.
 *
 * WHAT MUST BE IN IT, or it is not an acknowledgment at all (IRS Pub 1771):
 * the church's name, the giver's name, the amount of each cash gift with its
 * date, a DESCRIPTION (never a value) of any non-cash gift, and the
 * goods-or-services statement. Every one is written from the statement object
 * rather than retyped here, so a change to the rules changes one place.
 *
 * It also carries what the office knows and the member would otherwise have to
 * ask for: gifts held back as unconfirmed, gifts given anonymously, and the
 * plain tax teaching -- which never promises a benefit.
 *
 * @param {object} statement `buildStatement(...).statement`
 * @param {object} [source]  `statementFromClaims(...).source`
 */
export function statementToText(statement = {}, source = null) {
  const s = statement || {};
  const L = [];
  L.push(String(s.issuer && s.issuer.name ? s.issuer.name : '').trim());
  if (s.issuer && s.issuer.address) L.push(s.issuer.address);
  if (s.issuer && s.issuer.ein) L.push(`EIN ${s.issuer.ein}`);
  L.push('');
  L.push(`ANNUAL CONTRIBUTION STATEMENT — ${s.year}`);
  L.push('');
  L.push(`Giver: ${(s.member && s.member.name) || ''}`);
  if (s.member && s.member.address) L.push(`        ${s.member.address}`);
  if (s.issuedOn) L.push(`Issued: ${s.issuedOn}`);
  L.push('');

  const cash = (s.gifts || []).filter((g) => !g.isNonCash);
  if (cash.length) {
    L.push('GIFTS RECEIVED');
    for (const g of cash) {
      const bits = [g.date, money(g.amountCents)];
      if (g.fund) bits.push(g.fund);
      if (g.method) bits.push(g.method);
      L.push(`  ${bits.join('  ')}`);
    }
    L.push(`  ${'-'.repeat(28)}`);
    L.push(`  Total  ${s.total}`);
    if (s.deductibleCents !== s.totalCents) L.push(`  Deductible portion  ${s.deductible}`);
    L.push('');
  }

  // Pub 1771: described, NEVER valued. The church putting a number on a
  // donated piano is the church certifying a figure it did not verify.
  if ((s.nonCashDescriptions || []).length) {
    L.push('GIFTS OTHER THAN MONEY — described, not valued');
    for (const n of s.nonCashDescriptions) L.push(`  ${n.date}  ${n.description}`);
    L.push('  The church describes what it received. What it was worth is the giver’s to establish.');
    L.push('');
  }

  if (s.goodsStatement) { L.push(s.goodsStatement); L.push(''); }

  if (Number(s.anonymousCount) > 0) {
    L.push(`${s.anonymousCount} gift${s.anonymousCount === 1 ? '' : 's'} given anonymously ${s.anonymousCount === 1 ? 'is' : 'are'} in the church’s records and not on this statement. ${ANONYMOUS_NOTICE}`);
    L.push('');
  }

  if (source && Number(source.heldBack) > 0) {
    L.push(`${source.heldBack} further gift${source.heldBack === 1 ? '' : 's'} totalling ${money(source.heldBackCents)} ${source.heldBack === 1 ? 'is' : 'are'} in the book under a name nobody has confirmed as yours, so ${source.heldBack === 1 ? 'it is' : 'they are'} not counted above. ${UNCONFIRMED_NOTICE}`);
    L.push('');
  }

  for (const w of (s.warnings || [])) L.push(`NOTE: ${w}`);
  if ((s.warnings || []).length) L.push('');

  L.push(titheTaxNote(s));
  L.push('');
  if (s.provenance) L.push(s.provenance);
  return L.join('\n');
}
