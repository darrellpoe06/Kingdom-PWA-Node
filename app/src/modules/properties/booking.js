// =============================================================================
// booking — the nights of a short-stay door (DR-0930, migration 0269)
// =============================================================================
// Darrell, 2026-10-10: "Calendar for booking the apartment?", "With blackout
// dates for already booked...", "Short term rentals need another form...".
//
// Pure date work for the calendar: a night is the date you sleep there
// (check-in inclusive, check-out exclusive — the out day is free for the next
// guest). Dates are 'YYYY-MM-DD' strings in local time; nothing here reads a
// clock except through the `today` argument, so it is tested exactly.
// =============================================================================

/** The longest stay a guest may ask for on their own (0269; the family may enter longer). */
export const GUEST_MAX_NIGHTS = 29;

const pad = (n) => String(n).padStart(2, '0');
export const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromIso = (s) => { const [y, m, d] = String(s).split('-').map(Number); return new Date(y, m - 1, d); };
export const addDays = (s, n) => { const d = fromIso(s); d.setDate(d.getDate() + n); return iso(d); };

/** Whole nights between check-in and check-out. */
export function nightsBetween(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0;
  return Math.round((fromIso(checkOut) - fromIso(checkIn)) / 86400000);
}

/** Every taken night, from the public calendar's ranges. */
export function takenNights(ranges = []) {
  const out = new Set();
  for (const r of Array.isArray(ranges) ? ranges : []) {
    const from = r.taken_from || r.check_in;
    const to = r.taken_to || r.check_out;
    if (!from || !to) continue;
    for (let d = from; d < to; d = addDays(d, 1)) out.add(d);
  }
  return out;
}

/** The days of a month as a grid of weeks (Sunday first); null pads the edges. */
export function monthGrid(year, month /* 0-11 */) {
  const first = new Date(year, month, 1);
  const days = new Date(year, month + 1, 0).getDate();
  const cells = Array(first.getDay()).fill(null);
  for (let d = 1; d <= days; d += 1) cells.push(iso(new Date(year, month, d)));
  while (cells.length % 7) cells.push(null);
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

/**
 * Check a guest's ask before it is sent (the database checks again).
 * Returns { ok, errors, nights, total }.
 */
export function checkStayAsk({ checkIn, checkOut, taken = new Set(), today, guests, name, phone, email, is21, rules, rate = null }) {
  const errors = {};
  const nights = nightsBetween(checkIn, checkOut);
  if (!checkIn || !checkOut) errors.dates = 'Pick the night you arrive and the day you leave.';
  else if (checkIn < today) errors.dates = 'That first night has passed.';
  else if (nights < 1) errors.dates = 'The day you leave comes after the night you arrive.';
  else if (nights > GUEST_MAX_NIGHTS) errors.dates = `Stays booked here are up to ${GUEST_MAX_NIGHTS} nights. For longer, apply for a lease or message us.`;
  else {
    for (let d = checkIn; d < checkOut; d = addDays(d, 1)) {
      if (taken.has(d)) { errors.dates = `The night of ${d} is already taken.`; break; }
    }
  }
  if (!(Number(guests) >= 1)) errors.guests = 'How many people are staying?';
  if (!String(name || '').trim()) errors.name = 'Your name, as on your ID.';
  if (!String(phone || '').trim() && !String(email || '').trim()) errors.contact = 'A phone or an email so we can confirm.';
  if (!is21) errors.is21 = 'The lead guest must be 21 or older.';
  if (!rules) errors.rules = 'Please accept the house rules.';
  const r = Number(rate);
  return { ok: Object.keys(errors).length === 0, errors, nights, total: r > 0 && nights > 0 ? Math.round(r * nights * 100) / 100 : null };
}

/** The house rules a guest accepts when asking (shown in full on the form). */
export const HOUSE_RULES = Object.freeze([
  'No parties or events. Quiet hours 10 pm to 7 am.',
  'No smoking or vaping inside.',
  'Only the guests named on the stay sleep here.',
  'Cameras are outside only (porch and entry); none inside.',
  'Check-in from 3 pm; check-out by 11 am.',
  'Damage beyond normal wear is charged with photos and an itemized list.',
]);

/** Split a door's calendar rows into what the family acts on. */
export function stayBook(rows = [], today) {
  const list = Array.isArray(rows) ? rows : [];
  const by = (a, b) => String(a.check_in).localeCompare(String(b.check_in));
  return {
    asks: list.filter((r) => r.kind === 'stay' && r.status === 'requested').sort(by),
    upcoming: list.filter((r) => r.status === 'confirmed' && r.check_out >= today).sort(by),
    past: list.filter((r) => r.status === 'confirmed' && r.check_out < today).sort(by).reverse(),
    closed: list.filter((r) => ['declined', 'cancelled'].includes(r.status)),
  };
}
