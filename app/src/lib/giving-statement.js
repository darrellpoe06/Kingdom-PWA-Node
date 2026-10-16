// =============================================================================
// giving-statement — the church-issued contribution statement (DR-1064)
// =============================================================================
// Darrell, 2026-10-16, with the membership agreement open on "it holds no
// giving amount and no giving total":
//
//   "The church has will need to have recorded records for giving for tax
//    purposes..."
//
// HE IS RIGHT, AND THE GAP IS EXACT. Three giving roads already exist in this
// app, and NOT ONE of them is the document a member needs at tax time —
// both of the two that come close say so themselves, in their own words:
//
//   giving-records.js   the GIVER'S OWN ledger, owner-only, grounded in
//                       Matthew 6:3-4. Its required provenance line reads:
//                       "The church's official contribution statement comes
//                       from the church office."
//   giving-reports.js   the OFFICE'S working record, assembled from the
//                       church's Cash App history. Its own line reads: "a
//                       working record for the church office — NOT a
//                       church-issued tax statement."
//   church-member-intake  the MEMBER RECORD, which holds no giving figure at
//                       all, deliberately and correctly.
//
// So one road points at the office, the other says it is not the office's
// document, and the document itself was never built. That is the whole finding:
// not a wrong promise, a missing record.
//
// AND THE PROMISE IS NOT IN CONFLICT — it was only AMBIGUOUS. "This record
// holds no giving amount" is true and must stay true: giving never appears on a
// member card, so nobody reading the roll can see what anyone gives (Matthew
// 6:3-4 again, carried in the schema rather than in a policy). What it must not
// be read to mean is "the church keeps no record of your giving", because the
// church must keep one and the member needs it. The agreement now says which
// record it is speaking about, and says the statement exists.
//
// WHAT THE RULES ACTUALLY REQUIRE — stated plainly, because established fact is
// stated plainly (DR-0100), with the source named rather than remembered:
// IRS Publication 1771, "Charitable Contributions — Substantiation and
// Disclosure Requirements".
//
//   * A donor cannot claim a deduction for a single contribution of $250 OR
//     MORE without a CONTEMPORANEOUS WRITTEN ACKNOWLEDGMENT from the church.
//     "Contemporaneous" means in the donor's hands by the earlier of the date
//     they file or the due date including extensions — so a statement issued in
//     January is in time and one issued in June may not be.
//   * The acknowledgment must carry: the ORGANIZATION'S NAME, the AMOUNT of
//     cash contributed, a DESCRIPTION (but NOT a value) of any non-cash
//     contribution, and EITHER a statement that NO GOODS OR SERVICES were
//     provided in return, OR a description and good-faith estimate of their
//     value.
//   * A QUID PRO QUO contribution over $75 — a payment partly for goods or
//     services, such as a banquet ticket — needs a written disclosure telling
//     the donor that only the excess over the value received is deductible.
//
// The church's own accountant signs off on the form the church issues; this
// file builds it and REFUSES to build one it cannot stand behind. A statement
// that is missing a required element is worse than no statement, because the
// member relies on it and finds out at an audit.
//
// MONEY IS NEVER A FLOAT, exactly as giving-records.js holds it: integer cents
// all the way through, so a year's total cannot drift by a half-penny across
// three hundred gifts.
//
// Pure: no React, no network, no clock of its own — every "today" is passed in.
import { formatMoney } from './giving-records.js';

// -----------------------------------------------------------------------------
// ANONYMOUS GIVING, AND THE ONE THING IT COSTS (Darrell, 2026-10-16: "they can
// also give anonymous... however we need to know all possible data")
// -----------------------------------------------------------------------------
// Both halves of that are kept, and they do not fight: the church records every
// gift it receives, because it must — and a giver may still choose that their
// NAME is not attached to theirs.
//
// WHAT AN ANONYMOUS GIFT COSTS IS NOT A POLICY WE CHOSE, and it must be said
// BEFORE the choice rather than discovered in January: an acknowledgment has to
// name the donor, so a gift the church cannot attribute cannot be
// substantiated. Anonymous is a real and honourable option — Matthew 6:3-4 is
// the reason it exists here at all — and it is a trade, so the trade is stated.
export const ANONYMOUS_NOTICE =
  'You can give without your name attached. The church still records the gift — it has to — but it will not be on your contribution statement, because a statement has to name who gave. If you want it to count at tax time, give it under your name; if you would rather it be between you and Yahweh, give it anonymously. Both are honourable.';

/** Pure. An anonymous gift is recorded, and is honestly excluded from a statement. */
export const isAnonymous = (row = {}) => !!(row.anonymous ?? row.is_anonymous);

/** IRS Pub 1771 thresholds, named rather than typed as bare numbers downstream. */
export const WRITTEN_ACK_THRESHOLD_CENTS = 25000;   // $250 — a single contribution
export const QUID_PRO_QUO_THRESHOLD_CENTS = 7500;   // $75  — payment partly for goods

/** The required disclosure when nothing was given in return. Pub 1771's wording. */
export const NO_GOODS_STATEMENT =
  'No goods or services were provided by the church in return for these contributions, other than intangible religious benefits.';

/** What the statement says about itself. A document that overstates itself is a trap. */
export const STATEMENT_PROVENANCE =
  'Issued by the church from its own records of gifts received. Keep it with your tax papers. The church does not give tax advice — your preparer decides what is deductible.';

const cents = (v) => (Number.isFinite(v) ? Math.round(v) : 0);
const sum = (rows, pick) => rows.reduce((t, r) => t + cents(pick(r)), 0);

/**
 * Pure. Everything a lawful statement needs about the issuing church, checked
 * BEFORE a statement is built rather than discovered as a blank on the page.
 *
 * @returns {{ok: true} | {ok: false, missing: string[], message: string}}
 */
export function checkIssuer(church = {}) {
  const missing = [];
  if (!String(church.legalName || church.name || '').trim()) missing.push('the church’s legal name');
  if (!String(church.addressLine || church.address || '').trim()) missing.push('the church’s address');
  // The EIN is NOT required on the acknowledgment by Pub 1771 — it is required
  // by every preparer who will ever look at it, and leaving it off invites the
  // member to come back for a second copy. Warned, not refused.
  return missing.length
    ? {
      ok: false,
      missing,
      message: `This statement cannot be issued yet: ${missing.join(' and ')} ${missing.length > 1 ? 'are' : 'is'} not on file. Add it in the church's own details, then issue again.`,
    }
    : { ok: true };
}

/**
 * Pure. One gift row, normalized, with its own substantiation facts attached.
 *
 * A row is NON-CASH when it carries a description instead of an amount. Pub
 * 1771 is explicit that the church describes such a gift and does NOT value it
 * — valuing a donated car or a piano for a member is the church putting its
 * name to a number it did not verify, which is precisely the thing that goes
 * wrong at an audit.
 */
export function normalizeGift(row = {}) {
  const amount = cents(row.amountCents ?? row.amount_cents);
  const description = String(row.nonCashDescription || row.non_cash_description || '').trim();
  const goodsValue = cents(row.goodsValueCents ?? row.goods_value_cents);
  const isNonCash = !amount && !!description;
  return {
    id: row.id || row.slug || '',
    date: String(row.date || row.givenOn || row.given_on || '').slice(0, 10),
    fund: String(row.fund || '').trim(),
    method: String(row.method || '').trim(),
    amountCents: isNonCash ? 0 : amount,
    nonCashDescription: isNonCash ? description : '',
    isNonCash,
    goodsValueCents: goodsValue,
    // Pub 1771: a payment partly for goods or services, over $75, carries a
    // disclosure that only the EXCESS over what was received is deductible.
    isQuidProQuo: goodsValue > 0 && amount > QUID_PRO_QUO_THRESHOLD_CENTS,
    deductibleCents: goodsValue > 0 ? Math.max(0, amount - goodsValue) : amount,
    needsWrittenAck: amount >= WRITTEN_ACK_THRESHOLD_CENTS,
  };
}

/**
 * Pure. Build one member's annual contribution statement.
 *
 * It REFUSES rather than issuing something it cannot stand behind, because a
 * statement missing a required element is worse than no statement: the member
 * relies on it and finds out at an audit.
 *
 * @returns {{ok: true, statement: object} | {ok: false, reason: string, message: string}}
 */
export function buildStatement({ church = {}, member = {}, gifts = [], year, issuedOn } = {}) {
  const issuer = checkIssuer(church);
  if (!issuer.ok) return { ok: false, reason: 'issuer-incomplete', message: issuer.message, missing: issuer.missing };

  const y = Number(year);
  if (!Number.isInteger(y) || y < 1900 || y > 2200) {
    return { ok: false, reason: 'bad-year', message: 'Choose the tax year this statement covers.' };
  }
  if (!String(member.name || '').trim()) {
    return { ok: false, reason: 'no-member-name', message: 'A contribution statement must name the giver. This record has no name on it.' };
  }

  const inYear = gifts.filter((g) => String(g.date || g.givenOn || g.given_on || '').slice(0, 4) === String(y));
  // Recorded by the church, and deliberately NOT on this statement: a document
  // that cannot name who gave cannot substantiate anything. Counted so the
  // office can say so out loud rather than the member wondering what is missing.
  const anonymousCount = inYear.filter(isAnonymous).length;
  const rows = inYear.filter((g) => !isAnonymous(g)).map(normalizeGift)
    .sort((a, b) => a.date.localeCompare(b.date) || String(a.id).localeCompare(String(b.id)));

  if (!rows.length) {
    return {
      ok: false,
      reason: anonymousCount ? 'only-anonymous' : 'no-gifts',
      anonymousCount,
      message: anonymousCount
        ? `${anonymousCount} gift${anonymousCount === 1 ? '' : 's'} from ${member.name} in ${y} ${anonymousCount === 1 ? 'was' : 'were'} given anonymously. The church has them in its records; a statement cannot carry them, because a statement has to name who gave.`
        : `No gifts are recorded for ${member.name} in ${y}. Nothing is issued for an empty year — a statement reading $0 reads like a denial.`,
    };
  }

  const cash = rows.filter((g) => !g.isNonCash);
  const nonCash = rows.filter((g) => g.isNonCash);
  const totalCents = sum(cash, (g) => g.amountCents);
  const deductibleCents = sum(cash, (g) => g.deductibleCents);
  const quidProQuo = rows.filter((g) => g.isQuidProQuo);
  const overThreshold = rows.filter((g) => g.needsWrittenAck);

  return {
    ok: true,
    statement: {
      issuer: {
        name: String(church.legalName || church.name).trim(),
        address: String(church.addressLine || church.address).trim(),
        ein: String(church.ein || '').trim(),
      },
      member: { name: String(member.name).trim(), address: String(member.addressLine || member.address || '').trim() },
      year: y,
      issuedOn: String(issuedOn || '').slice(0, 10),
      gifts: rows,
      totalCents,
      total: formatMoney(totalCents),
      deductibleCents,
      deductible: formatMoney(deductibleCents),
      // The two Pub 1771 disclosures, decided from the data rather than pasted
      // on every statement regardless of what happened.
      goodsStatement: quidProQuo.length ? quidProQuoDisclosure(quidProQuo) : NO_GOODS_STATEMENT,
      nonCashDescriptions: nonCash.map((g) => ({ date: g.date, description: g.nonCashDescription })),
      countOverThreshold: overThreshold.length,
      anonymousCount,
      provenance: STATEMENT_PROVENANCE,
      warnings: statementWarnings({ church, rows, nonCash, anonymousCount }),
    },
  };
}

/** Pure. The disclosure for gifts that bought something, naming each one. */
export function quidProQuoDisclosure(rows = []) {
  const lines = rows.map((g) => `${g.date}: ${formatMoney(g.amountCents)} paid, ${formatMoney(g.goodsValueCents)} received in goods or services, ${formatMoney(g.deductibleCents)} deductible.`);
  return `Part of some of these payments was for goods or services received, so only the amount paid ABOVE their value is deductible. ${lines.join(' ')}`;
}

/**
 * Pure. What the OFFICE should know before sending it — surfaced to the person
 * issuing it, never buried, and never silently "fixed".
 */
export function statementWarnings({ church = {}, rows = [], nonCash = [], anonymousCount = 0 } = {}) {
  const out = [];
  if (anonymousCount) {
    out.push(`${anonymousCount} gift${anonymousCount === 1 ? ' was' : 's were'} given anonymously and ${anonymousCount === 1 ? 'is' : 'are'} NOT on this statement. The church has them; a statement has to name who gave. Say so when you send it, so the total is not read as a mistake.`);
  }
  if (!String(church.ein || '').trim()) {
    out.push('No EIN is on file for the church. The statement is still valid without it, but most preparers will ask, so the member may come back for a second copy.');
  }
  if (nonCash.length) {
    out.push(`${nonCash.length} non-cash gift${nonCash.length === 1 ? ' is' : 's are'} described but NOT valued, which is correct — the giver, not the church, places a value on a donated item.`);
  }
  const undated = rows.filter((g) => !/^\d{4}-\d{2}-\d{2}$/.test(g.date));
  if (undated.length) out.push(`${undated.length} gift${undated.length === 1 ? ' has' : 's have'} no usable date and cannot be placed in a tax year.`);
  return out;
}

/**
 * Pure. Is the statement in the member's hands in time to be used?
 *
 * Pub 1771: contemporaneous means by the EARLIER of the date the donor files
 * and the filing due date. The church cannot know when a member files, so the
 * honest answer is about the due date, and it says which one it is answering.
 */
export function contemporaneousCheck(year, issuedOn) {
  const y = Number(year);
  const d = String(issuedOn || '').slice(0, 10);
  if (!Number.isInteger(y) || !/^\d{4}-\d{2}-\d{2}$/.test(d)) return { ok: false, reason: 'unknown', message: '' };
  // The ordinary individual due date for tax year Y is April 15 of Y+1.
  const due = `${y + 1}-04-15`;
  if (d <= due) {
    return { ok: true, message: `Issued ${d}, in time for the ${y} filing due date (${due}) — provided the member had not already filed.` };
  }
  return {
    ok: false,
    reason: 'late',
    message: `Issued ${d}, AFTER the ordinary ${y} due date of ${due}. A member who already filed cannot use this to substantiate a gift of $${WRITTEN_ACK_THRESHOLD_CENTS / 100} or more. Send next year's by the end of January.`,
  };
}

// -----------------------------------------------------------------------------
// WHAT THE TITHE ACTUALLY DOES AT TAX TIME (Darrell, 2026-10-16: "make sure
// people know the tax benefits of their church tithe")
// -----------------------------------------------------------------------------
// This is where it would be easy to do harm by being encouraging. The flat
// sentence a congregation usually hears — "your tithe is a tax deduction" — is
// NOT true for most people, and the people it is least true for are the ones
// least able to absorb the surprise.
//
// THE FACT, PLAINLY (DR-0100 tier 1): a gift to a church is deductible ONLY if
// you ITEMIZE. You itemize when all your itemized deductions ADDED TOGETHER
// come to more than the standard deduction for your filing status. Since the
// standard deduction was roughly doubled in 2018, most households take it, and
// for those households the tithe changes the tax bill by nothing at all.
//
// WHAT IS GENUINELY OPEN, flagged NARROWLY rather than smeared over the topic
// (DR-0100 tier 2): the exact figures change every single year, and the rules
// for people who do NOT itemize have moved more than once. So NO DOLLAR FIGURE
// IS PRINTED HERE. A number typed into this file from memory would be read off
// a church surface by a family making a real decision, and a stale one is worse
// than none — this teaches the TEST and names who holds the current number.
// (`re-review: 2027-01-15` — source the filing year's figures and surface them
// from a dated record rather than prose.)
//
// AND THE ORDER MATTERS, which is the part only this platform will say: the
// deduction is real and it is SECOND. "Take heed that ye do not your alms
// before men, to be seen of them: otherwise ye have no reward of your Father
// which is in heaven" (Matthew 6:1, KJV); "Every man according as he purposeth
// in his heart, so let him give; not grudgingly, or of necessity: for God
// loveth a cheerful giver" (2 Corinthians 9:7, KJV). Nobody tithes for the
// write-off. Knowing what the law allows is stewardship; making it the reason
// is something else. Both are said, in that order, and neither is debated.
export const TITHE_TAX_TEACHING = {
  headline: 'What your giving does at tax time — honestly',
  theTest:
    'A gift to the church is deductible only if you ITEMIZE. You itemize when all your itemized deductions added together — giving, mortgage interest, state and local taxes, large medical costs — come to MORE than the standard deduction for how you file. If they do not, you take the standard deduction, and your giving does not change your tax bill.',
  theHonestPart:
    'Since 2018 the standard deduction has been high enough that most households take it. So for many families here, the tithe is not a write-off — and anyone who told you otherwise did you no favour. Knowing which side of that line you are on is worth ten minutes with whoever does your taxes.',
  whatNeverChanges:
    'Keep the statement either way. If you do itemize, you need it — a single gift of $250 or more cannot be claimed without a written acknowledgment from the church. If you do not itemize this year, you may next year, and the record is already made.',
  theOrder: {
    ref: 'Matthew 6:1; 2 Corinthians 9:7',
    translation: 'KJV',
    text: 'Take heed that ye do not your alms before men, to be seen of them: otherwise ye have no reward of your Father which is in heaven. … Every man according as he purposeth in his heart, so let him give; not grudgingly, or of necessity: for God loveth a cheerful giver.',
    note: 'The deduction is real, and it is second. Nobody tithes for the write-off; knowing what the law allows is stewardship, making it the reason is not.',
  },
  whoDecides:
    'The church does not give tax advice and does not know your return. The figures change every year — your preparer has this year’s.',
};

/**
 * Pure. The sentence a member sees on their own statement, shaped by what is
 * actually on it. Never promises a benefit, never withholds the fact.
 */
export function titheTaxNote(statement = {}) {
  const over = Number(statement.countOverThreshold || 0);
  const base = TITHE_TAX_TEACHING.theTest;
  if (!over) return `${base} ${TITHE_TAX_TEACHING.whatNeverChanges}`;
  return `${base} ${over} of your gifts this year ${over === 1 ? 'was' : 'were'} $250 or more, and a gift that size cannot be claimed at all without this statement — so keep it whether or not you itemize. ${TITHE_TAX_TEACHING.whoDecides}`;
}
