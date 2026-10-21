// =============================================================================
// real-estate-door — what the Real Estate tab says the moment it opens
// =============================================================================
// Darrell, on his phone at 01:35, 2026-10-21: "real estate needs a makeover
// too... it looks bland... boring..." and then, settling it himself, "Maybe
// makeover Real Estate tab and the we keep it."
//
// MEASURED FIRST, in a real Chromium against the built dist at 360px (the
// reality-trace DR-0061 requires): the Real Estate door opened on a 10px grey
// "PROPERTIES · N" label, a 10px "+ ADD PROPERTY" link, a second 10px
// "INCOME-PRODUCING · N" label, and then a stack of near-identical white
// cards. Not one figure about the portfolio itself was on the first screen.
//
// So the blandness was a DATA placement problem wearing a style problem's
// clothes. Every number a landlord opens this tab to see already existed in
// the component and was either ONE TAB OVER (Portfolio & payoff: door count,
// mortgage debt, monthly P&I, rent gap, this-month collected from the
// rent_payments ledger) or derivable from rows already in hand (which doors
// are late, vacant, in rehab; which have an open incident; which are still
// missing a figure). None of it met the family at the door.
//
// This module is the pure derivation behind that door band. The rows it reads
// are real (DR-0076 §4 — measure, never paint):
//   · rentals          — data.inflows.rentals, the Supabase `rentals` table
//                        synced by lib/rentals-sync.js (seed rows are replaced
//                        on a signed-in family device)
//   · entities         — data.entities, for the owning business's own name
//   · paidRollup       — lib/rent-portfolio-paid.js over the cloud `leases` +
//                        `rent_payments` tables: this month, received vs due
//   · incidents        — data.incidents, the ones pointed at a property
//   · snowball         — the payoff projection over the real mortgage rows
//
// HONEST WHEN IT DOES NOT KNOW. A portfolio with no synced lease has nothing
// to measure this month against, so `collected.known` is false and the band
// says WHY in its own words — it never paints a 0% that would read as "nobody
// paid." Unknown is never rendered as zero (DR-0076 §8).
//
// Pure in, pure out: no React, no I/O, no clock beyond what is handed in.
// Recorded as DR-1169.
// =============================================================================
import { derivePortfolio, isPersonalProp } from './rental-portfolio.js';

// The door's own words for a status that wants a person. Each key is a real
// value carried on a rental row (r.status) or a real relationship in the data,
// never a decorative tag: the count beside it is the rows that actually match.
export const ATTENTION_BANDS = [
  { key: 'late', label: 'behind on rent', tone: 'rust' },
  { key: 'vacant', label: 'empty', tone: 'rust' },
  { key: 'rehab', label: 'in rehab', tone: 'watch' },
  { key: 'incident', label: 'with an open issue', tone: 'watch' },
  { key: 'needsRent', label: 'with no rent entered', tone: 'muted' },
  { key: 'needsDebt', label: 'with no mortgage figure', tone: 'muted' },
];
const BAND_ORDER = Object.fromEntries(ATTENTION_BANDS.map((b, i) => [b.key, i]));

// A door is EMPTY when its own status says so. Both spellings the add form
// offers ('vacant' and 'unrented') mean the same thing to the person reading.
const isEmpty = (r) => r && (r.status === 'vacant' || r.status === 'unrented');

/**
 * Everything the Real Estate door shows, derived from the real rows.
 *
 * @param {object} args
 * @param {Array}  args.rentals     data.inflows.rentals
 * @param {Array}  args.entities    data.entities
 * @param {object} args.paidRollup  rent-portfolio-paid rollup (may be null)
 * @param {Array}  args.incidents   data.incidents
 * @param {object} args.snowball    the payoff projection (may be null)
 */
export function doorState({ rentals = [], entities = [], paidRollup = null, incidents = [], snowball = null } = {}) {
  const p = derivePortfolio(rentals, entities);
  const own = p.portfolioRentals;
  const ownIds = new Set(own.map((r) => r.id));

  // --- what needs a person, counted off the rows themselves -----------------
  const openIssueIds = new Set(
    (Array.isArray(incidents) ? incidents : [])
      .filter((i) => i && i.status !== 'resolved' && i.linkedTo && i.linkedTo.type === 'rental' && ownIds.has(i.linkedTo.id))
      .map((i) => i.linkedTo.id)
  );
  const buckets = {
    late: own.filter((r) => r.status === 'late'),
    vacant: own.filter(isEmpty),
    rehab: own.filter((r) => r.status === 'rehab'),
    incident: own.filter((r) => openIssueIds.has(r.id)),
    needsRent: own.filter((r) => !(Number(r.rent) > 0)),
    needsDebt: own.filter((r) => !(Number(r.mortgage && r.mortgage.balance) > 0)),
  };
  const attention = ATTENTION_BANDS
    .map((b) => ({ ...b, count: buckets[b.key].length, ids: buckets[b.key].map((r) => r.id) }))
    .filter((b) => b.count > 0)
    .sort((a, b) => BAND_ORDER[a.key] - BAND_ORDER[b.key]);

  // --- this month, against the lease ledger ---------------------------------
  // `doors` here is how many doors the ledger could speak for at all. Zero of
  // them means we know nothing this month, which is said plainly rather than
  // drawn as an empty bar.
  const roll = paidRollup && typeof paidRollup === 'object' ? paidRollup : null;
  const ledgerDoors = Number(roll && roll.doors) || 0;
  const collected = ledgerDoors > 0
    ? {
      known: true,
      received: Number(roll.received) || 0,
      expected: Number(roll.expected) || 0,
      percent: Number(roll.percent) || 0,
      doorsPaid: Number(roll.doorsPaid) || 0,
      doorsPartial: Number(roll.doorsPartial) || 0,
      doorsUnpaid: Number(roll.doorsUnpaid) || 0,
      doorsCounted: ledgerDoors,
      note: ledgerDoors < p.doorCount
        ? `${ledgerDoors} of ${p.doorCount} doors have a lease the ledger can read`
        : null,
    }
    : {
      known: false,
      received: 0, expected: 0, percent: 0,
      doorsPaid: 0, doorsPartial: 0, doorsUnpaid: 0, doorsCounted: 0,
      note: own.length === 0
        ? 'No property is on the books yet.'
        : 'No lease is synced yet, so this month has nothing to measure against. Open a door and start its lease to see rent land here.',
    };

  // --- what the portfolio holds ---------------------------------------------
  // Every figure is a sum of figures actually present on the rows; where rows
  // are missing one, the sub-line says how many are counted rather than
  // letting a blank pass as a zero.
  const counted = (missing) => (missing > 0 ? `${p.portfolioCount - missing} of ${p.portfolioCount} entered` : null);
  const holds = [
    { key: 'rent', label: 'Rent a month', value: p.monthlyRent, sub: counted(p.missingRent), tone: 'green' },
    { key: 'pi', label: 'Mortgage a month', value: p.monthlyPI, sub: null, tone: 'ink' },
    { key: 'net', label: 'Left after the note', value: p.monthlyRent - p.monthlyPI, sub: null, tone: (p.monthlyRent - p.monthlyPI) < 0 ? 'rust' : 'green' },
    { key: 'debt', label: 'Still owed', value: p.mortgageDebt, sub: counted(p.missingDebt), tone: 'rust' },
  ];

  // --- the payoff line, off the real mortgage rows --------------------------
  const years = snowball && Number.isFinite(Number(snowball.allClearedYears)) ? Number(snowball.allClearedYears) : null;
  const clear = years != null && years > 0 && p.mortgageDebt > 0
    ? { years, date: snowball.allClearedDate || null, bySeven: years <= 7 }
    : null;

  return {
    doors: p.doorCount,
    properties: p.portfolioCount,
    label: p.portfolioLabel,
    personal: (rentals || []).filter(isPersonalProp).length,
    collected,
    holds,
    attention,
    allClear: attention.length === 0 && own.length > 0,
    clear,
  };
}

export default doorState;
