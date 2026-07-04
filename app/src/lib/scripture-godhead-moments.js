// =============================================================================
// scripture-godhead-moments — SEE the Godhead working together (Darrell 2026-07-04:
// "we should be able to see when the GodHead is working together and speaking to
// each other... in the beginning Let there be Light and there was Light... Jesus
// is the Light of the World, the Spirit and the Father right from the beginning
// verses... can we get that deep into the meat of the scriptures?").
//
// This surfaces the passages where the Father, the Son (the Word / the Light), and
// the Holy Spirit are present and at work as ONE — starting in the very first
// verses. It reads the Word THROUGH the Word (DR-0098: we teach, we don't debate):
// Genesis 1 read through John 1, John 8:12, Colossians 1, Hebrews 1 — Scripture's
// own testimony that the Word framed the worlds and IS the Light.
//
// HONEST (DR-0076): no fabrication. Every anchor is a real reference that resolves
// in the shipped KJV; the teaching only says what these verses say. The Word is
// capitalized as the frame (DR-0097); the Godhead names are honored.
// =============================================================================

// The three Persons, each borrowing its color from the voices palette so the
// Godhead panel and the red-letter code speak one language: the Son wears red
// (the Blood — DR-0099), the Father gold, the Spirit living-water teal.
export const PERSONS = [
  { key: 'father', voice: 'father', label: 'The Father' },
  { key: 'son', voice: 'jesus', label: 'The Son — the Word' },
  { key: 'spirit', voice: 'spirit', label: 'The Holy Spirit' },
];

// A "moment": a passage (book + chapter) where the Godhead works together, with
// each Person's role in it and the VERIFIED anchor verses that show it. `verses`
// is the range within the chapter the moment speaks to (for the reader to place
// it). Each role's `refs` are single, resolvable references (ranges live in the
// prose so verification stays exact).
export const GODHEAD_MOMENTS = [
  {
    id: 'creation-beginning',
    book: 'Genesis', chapter: 1, verses: [1, 5],
    title: 'In the beginning — the Godhead creates as One',
    lead: 'From the first verses the whole Godhead is at work together — one God. The Father speaks; He speaks by His Word, the Son, through whom all things are made and who is Himself the Light; and the Spirit moves over the deep.',
    roles: [
      {
        person: 'father', role: 'speaks creation into being',
        note: '“And God said, Let there be light: and there was light.” The Father speaks, and it is so.',
        refs: ['Genesis 1:3'],
      },
      {
        person: 'son', role: 'the Word, and the Light itself',
        note: 'The Father speaks BY His Word: “In the beginning was the Word… All things were made by Him” (John 1:1-3); “by Him were all things created… and by Him all things consist” (Colossians 1:16-17); “by whom also He made the worlds” (Hebrews 1:2). And the light that answers is the Son Himself — “I am the light of the world” (John 8:12); “In Him was life; and the life was the light of men” (John 1:4).',
        refs: ['John 1:1', 'John 1:3', 'John 1:4', 'John 8:12', 'Colossians 1:16', 'Colossians 1:17', 'Hebrews 1:2'],
      },
      {
        person: 'spirit', role: 'moves upon the waters',
        note: '“And the Spirit of God moved upon the face of the waters.” The Spirit broods over the deep before the first word of light.',
        refs: ['Genesis 1:2'],
      },
    ],
  },
  {
    id: 'baptism-jordan',
    book: 'Matthew', chapter: 3, verses: [16, 17],
    title: 'At the Jordan — all three, at once',
    lead: 'At the baptism of Jesus the whole Godhead is shown together in one moment: the Son in the water, the Spirit descending, the Father’s voice from heaven.',
    roles: [
      { person: 'son', role: 'the beloved Son, baptized', note: '“And Jesus, when He was baptized, went up straightway out of the water.”', refs: ['Matthew 3:16'] },
      { person: 'spirit', role: 'descends like a dove', note: '“He saw the Spirit of God descending like a dove, and lighting upon Him.”', refs: ['Matthew 3:16'] },
      { person: 'father', role: 'speaks from heaven', note: '“And lo a voice from heaven, saying, This is My beloved Son, in whom I am well pleased.”', refs: ['Matthew 3:17'] },
    ],
  },
  {
    id: 'great-commission',
    book: 'Matthew', chapter: 28, verses: [19, 19],
    title: 'The Name — Father, Son, and Holy Ghost',
    lead: 'The three Persons are named together as the one Name into which the nations are baptized.',
    roles: [
      { person: 'father', role: 'named first', note: '“…baptizing them in the name of the Father, and of the Son, and of the Holy Ghost.”', refs: ['Matthew 28:19'] },
      { person: 'son', role: 'named with the Father', note: 'One Name — “the Father, and of the Son.”', refs: ['Matthew 28:19'] },
      { person: 'spirit', role: 'named with them', note: 'One Name — “and of the Holy Ghost.”', refs: ['Matthew 28:19'] },
    ],
  },
];

const KNOWN_PERSON = new Set(PERSONS.map((p) => p.key));

// The moments that belong to a given book + chapter (usually one, sometimes none).
export function momentsForChapter(book, chapter) {
  return GODHEAD_MOMENTS.filter((m) => m.book === book && m.chapter === Number(chapter));
}

export function getMoment(id) {
  return GODHEAD_MOMENTS.find((m) => m.id === id) || null;
}

// The display descriptor for a Person key (label + the voice-color key).
export function personOf(key) {
  return PERSONS.find((p) => p.key === key) || null;
}

// Every anchor reference across all moments (deduped) — the set a test walks to
// prove nothing points at a verse that isn't there.
export function allMomentRefs() {
  const seen = new Set();
  const out = [];
  for (const m of GODHEAD_MOMENTS) {
    for (const r of m.roles) {
      if (!KNOWN_PERSON.has(r.person)) continue;
      for (const ref of r.refs) if (!seen.has(ref)) { seen.add(ref); out.push(ref); }
    }
  }
  return out;
}

export const GODHEAD_SOURCE = {
  name: 'The Godhead together',
  basis: 'Scripture read through Scripture (Genesis 1 through John 1, John 8, Colossians 1, Hebrews 1)',
  note: 'Taught, not debated (DR-0098); every anchor verified verbatim against the shipped KJV (DR-0076).',
};
