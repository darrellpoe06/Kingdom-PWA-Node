// =============================================================================
// games/heritage.js — the REAL foundation under "our games"
// =============================================================================
// Declared by Darrell, 2026-07-07, photos spoken into the app as build input
// (SPOKEN-TEACHINGS rule): "Can you use my photos for the games foundational
// data... these are photos from turnkey days and an image of the place that is
// now torn down. My uncles and aunts who covered me and loved me and my family
// except K'Shawna my oldest daughter."
//
// The Generations game teaches that a life is measured by what is passed on.
// These photos are why that isn't theory: the Turnkey housing that held those
// days (the place itself is torn down — the covering it held still stands),
// the soldiers who covered this family, and the family that covering carried.
// Real photos, real people, the game's actual foundation — not seed data, not
// stock art (SEED-DATA-AS-ASPIRATION governs demo data; this is deliberate,
// owner-declared heritage content).
//
// Scripture references resolve through lib/games/scripture-link.js to verbatim
// KJV text (DR-0076; appended by scripts/append-heritage-verses.mjs from the
// in-repo public-domain KJV — never typed from memory).
//
// Faithfulness note: the dedication is Darrell's own naming. Individual faces
// are NOT labeled per photo — he has not assigned names to faces here, and this
// module must never guess a family member's identity (dignity is a binding
// rule). If he supplies per-photo names, add them as a `people` list per entry.
// =============================================================================

export const HERITAGE = {
  id: 'poe-family-foundation',
  eyebrow: 'The real foundation',
  title: 'A goodly heritage',
  // Darrell's words, kept as the collection's dedication.
  dedication:
    'My uncles and aunts, who covered me and loved me and my family — and K’Shawna, my oldest daughter.',
  scripture: 'Psalm 16:6',
  photos: [
    {
      id: 'turnkey-housing',
      src: '/games/heritage/turnkey-housing.jpg',
      alt: 'Sepia aerial rendering of the Turnkey housing development, framed — rows of townhomes along curved streets among trees',
      title: 'The Turnkey days',
      caption:
        'The place that held those days is torn down now. The buildings fell; the covering built in them still stands.',
      scripture: 'Psalm 127:1',
    },
    {
      id: 'raised-by-soldiers',
      src: '/games/heritage/raised-by-soldiers.jpg',
      alt: 'Six military portraits in uniform before the flag — the family’s soldiers across the generations',
      title: 'Raised and loved by soldiers',
      caption:
        'The generation that covered this family — they served, they loved, and they passed it on.',
      scripture: 'Psalm 145:4',
    },
    {
      id: 'family-today',
      src: '/games/heritage/family-today.jpg',
      alt: 'The family together on the water, smiling in the sun',
      title: 'The generation it was for',
      caption:
        'What the covering carried forward — the inheritance is walking, not stored.',
      scripture: 'Proverbs 13:22',
    },
  ],
};

// Convenience: the photos list (stable order — the story reads left to right:
// the place, the coverers, the covered).
export function heritagePhotos() {
  return HERITAGE.photos;
}
