// =============================================================================
// hero-slides — the branded door's big picture advertises the REAL apartments
// =============================================================================
// Darrell, 2026-10-27: "The Poe Properties App does not advertise the images
// in the carousel of pictures... fix it."
//
// The hero frame on the Poe Properties door (the picture beside "Welcome to
// Poe Properties", under the signed-out card) held one stock-looking
// photograph of a lit front entry. The homes being advertised have their own
// pictures, already open to a stranger through the public listing road
// (0290, DR-1016). These are the pure decisions: which pictures become slides,
// in what order, what each slide is called, and when the stock photograph
// stands in — and WHY, said out loud rather than silently.
//
// NEVER THE STREET (DR-0933). A slide is titled by the home's name, and a name
// that carries the street the family chose to show (DR-0977) is replaced by
// the town on the hero: the big picture advertises the place, the card below
// says the rest.

export const HERO_MAX_SLIDES = 12;

/** The slide's title: the home's name, never its street. */
export function slideTitle(unit) {
  if (!unit) return '';
  const label = String(unit.label || '').trim();
  const street = String(unit.street || '').trim();
  if (street && label.toLowerCase().includes(street.toLowerCase())) return String(unit.where || unit.city || 'A place to live').trim();
  return label || String(unit.where || 'A place to live').trim();
}

/**
 * The slides, in the owners' order: the first picture of every door, then the
 * second of every door, and so on, so a visitor meets every advertised home
 * before the second room of any one of them. `lists` maps a door id to its
 * picture list (public_vacancy_photo_list rows, bytes not carried).
 */
export function heroSlides(units = [], lists = {}, { max = HERO_MAX_SLIDES } = {}) {
  const out = [];
  const doors = (Array.isArray(units) ? units : []).filter((u) => u && u.rentalId && Array.isArray(lists[u.rentalId]) && lists[u.rentalId].length);
  const deepest = doors.reduce((n, u) => Math.max(n, lists[u.rentalId].length), 0);
  for (let k = 0; k < deepest && out.length < max; k += 1) {
    for (const u of doors) {
      const row = lists[u.rentalId][k];
      if (!row || !row.id) continue;
      out.push({
        key: `${u.rentalId}:${row.id}`,
        rentalId: u.rentalId,
        photoId: row.id,
        title: slideTitle(u),
        caption: String(row.caption || '').trim(),
        alt: `${String(row.caption || '').trim() || 'A picture'} — ${slideTitle(u)}`,
        storagePath: row.storage_path || null,
      });
      if (out.length >= max) break;
    }
  }
  return out;
}

/**
 * Why the stock photograph is standing in, in one plain line — or '' when the
 * real pictures are up. Never silent: "the read failed", "nothing advertised",
 * "no pictures on the advertised doors" and "still reading" are four different
 * truths, and each is said.
 */
export function heroFallbackWhy({ read = 'loading', why = '', units = [], lists = {}, listsRead = 'loading' } = {}) {
  if (read === 'failed') return why || 'Read failed: public_vacancies';
  if (read === 'loading') return 'Reading what is open…';
  if (!units.length) return 'Nothing is advertised right now — the entryway stands in.';
  if (heroSlides(units, lists).length) return '';
  if (listsRead === 'loading') return 'Reading the pictures…';
  if (listsRead === 'failed') return 'Read failed: public_vacancy_photo_list — the entryway stands in.';
  return 'The advertised doors have no pictures yet — the entryway stands in.';
}
