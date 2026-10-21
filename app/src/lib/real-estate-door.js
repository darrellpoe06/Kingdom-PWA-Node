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
 * @param {Date|string} args.today  the day to judge a due date against
 * @param {object} args.photoCounts per-rental photo totals the caller already
 *                                  holds (the NAS chat-channel archive), keyed
 *                                  by rental id; a door missing from it falls
 *                                  back to the photos on its own record
 */
export function doorState({ rentals = [], entities = [], paidRollup = null, incidents = [], snowball = null, today = null, photoCounts = null } = {}) {
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
  // TWO CELLS WERE SAYING NOTHING (DR-1178). Measured on Darrell's own live
  // portfolio, 2026-10-21: the door drew "Rent a month $11,700 · 11 of 12
  // entered" and "Still owed $0 · 0 of 12 entered" — both honest — beside
  // "Mortgage a month $950" and "Left after the note $10,750" with NO sub-line
  // at all, on a P&I column carrying one figure in twelve. Both numbers were
  // arithmetically correct and both read as complete, which is the under-claim
  // half of DR-0076 in reverse: a partial sum wearing a full sum's clothes.
  //
  // So the note column is counted like the other two, and the DERIVED cell
  // inherits the weaker of the two columns it subtracts — because a difference
  // is only as complete as its least complete side. When either side is
  // partial it says which, in words, rather than implying a surplus the rows
  // do not support.
  const net = p.monthlyRent - p.monthlyPI;
  const netMissing = Math.max(Number(p.missingRent) || 0, Number(p.missingPI) || 0);
  const holds = [
    { key: 'rent', label: 'Rent a month', value: p.monthlyRent, sub: counted(p.missingRent), tone: 'green' },
    { key: 'pi', label: 'Mortgage a month', value: p.monthlyPI, sub: counted(p.missingPI), tone: 'ink' },
    { key: 'net', label: 'Left after the note', value: net, sub: netMissing > 0 ? `rent and notes are not all entered — ${p.portfolioCount - netMissing} of ${p.portfolioCount} carry both` : null, tone: net < 0 ? 'rust' : 'green' },
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
    service: serviceRecord({ own, incidents, today, photoCounts }),
  };
}

// --- the level of service, off the record ------------------------------------
// Darrell, 2026-10-21: "If a potential tenant uses the app they will be able to
// see the level of services that were provided by us."
//
// So this is a TRUST figure, and a trust figure is the last place a painted
// number belongs (DR-0061 P15). Every one of these is counted off a row that
// already exists:
//
//   · answered / typical days — data.incidents, the ones whose linkedTo.type is
//     'rental'. `date` is the day it was opened, `resolvedAt` the day the app
//     stamped when someone marked it resolved. An incident missing either date
//     is EXCLUDED from the timing and counted in `unmeasured`, so the typical
//     figure is never an average over rows that could not be measured.
//   · still open, and whether each is inside the window its own urgency band
//     set (`dueDate`), judged against the day handed in — never a clock read
//     inside this pure function.
//   · photos / maintenance entries / rooms / systems / notes — the six stores a
//     property record keeps (lib/property-record-counts.js STORES). Photos use
//     the caller's live count where it has one (the NAS chat-channel archive,
//     which is what a person actually sees), and the record's own otherwise.
//
// A portfolio that has not logged anything yet gets `known: false` and says so.
// Nothing here is estimated, rounded up, or carried over from a demo row.
const MEDIAN = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  if (!s.length) return null;
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
};
const asDay = (v) => {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(String(v).slice(0, 10));
  return Number.isFinite(d.getTime()) ? Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) : null;
};
const DAY = 86400000;

export function serviceRecord({ own = [], incidents = [], today = null, photoCounts = null } = {}) {
  const ownIds = new Set(own.map((r) => r.id));
  const mine = (Array.isArray(incidents) ? incidents : [])
    .filter((i) => i && i.linkedTo && i.linkedTo.type === 'rental' && ownIds.has(i.linkedTo.id));
  const resolved = mine.filter((i) => i.status === 'resolved');
  const open = mine.filter((i) => i.status !== 'resolved');

  // Only an incident carrying BOTH a day opened and a day resolved can be timed.
  const spans = [];
  for (const i of resolved) {
    const from = asDay(i.date);
    const to = asDay(i.resolvedAt);
    if (from == null || to == null || to < from) continue;
    spans.push(Math.round((to - from) / DAY));
  }
  const now = asDay(today);
  const overdue = now == null ? null : open.filter((i) => { const d = asDay(i.dueDate); return d != null && d < now; }).length;

  // What the records themselves hold, across every door.
  const store = { photos: 0, maintenance: 0, notes: 0, rooms: 0, systems: 0, conversations: 0 };
  const len = (v) => (Array.isArray(v) ? v.length : 0);
  for (const r of own) {
    const live = photoCounts && Number.isFinite(Number(photoCounts[r.id])) ? Number(photoCounts[r.id]) : null;
    store.photos += live != null ? live : len(r.photos);
    store.maintenance += len(r.maintenanceLog);
    store.notes += len(r.unitNotes);
    store.rooms += len(r.rooms);
    store.systems += len(r.equipment);
    store.conversations += len(r.conversationLog);
  }
  const filed = store.photos + store.maintenance + store.notes + store.rooms + store.systems + store.conversations;

  return {
    known: mine.length > 0 || filed > 0,
    answered: resolved.length,
    openNow: open.length,
    overdue,
    typicalDays: MEDIAN(spans),
    measured: spans.length,
    unmeasured: resolved.length - spans.length,
    ...store,
    filed,
  };
}

export default doorState;
