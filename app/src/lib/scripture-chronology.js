// =============================================================================
// scripture-chronology — the YEARS, from the beginning of known time to
// Revelation, taken from the Word's own numbers
// =============================================================================
// Darrell 2026-08-10, on the timeline: "upgrade the timeline make them more
// independent and indepth", "or timelines are not rigorous enough...",
// "Give each year and data we know from those years....", "starting from the
// beginning of known time... until Revelation".
//
// What was wrong: the timeline carried ERAS and anchors but no NUMBERS. It could
// say "before the flood" and never say WHEN, so a reader could not check
// anything and the surface asked to be believed rather than verified — the exact
// posture DR-0076 exists to remove.
//
// WHAT THIS IS. Scripture states a great many explicit figures — begetting ages,
// lifespans, reign-years, sojournings, captivities. This module carries those
// figures WITH the verse that states each one, KJV-verbatim from the in-repo
// corpus, and computes the running "year from creation" (Anno Mundi) spine from
// them. Nothing here is remembered; every number is attached to the text that
// says it, and the test re-derives both the quotes and the arithmetic.
//
// THE THREE HONESTY RULES THIS MODULE OBEYS (DR-0076 / DR-0100 / DR-0281):
//
//   1. STATED vs COMPUTED are never blurred. `kind: 'stated'` means the verse
//      says that number. `kind: 'computed'` means WE added the stated numbers
//      up. An AM year is always computed — no verse says "Anno Mundi 1656" —
//      and the surface must say so rather than implying chapter and verse.
//
//   2. NO ABSOLUTE BC DATES. Scripture does not date creation, the flood, or
//      Abraham on any modern calendar. Popular BC dates come from correlating
//      this internal chronology with external king-lists, which is a
//      RECONSTRUCTION, not revelation. We give the Word's internal years and
//      say plainly where the Word stops.
//
//   3. GENUINE FORKS ARE NAMED, NOT SILENTLY RESOLVED. Where the text admits
//      two readings that change the arithmetic, both are carried with what each
//      rests on (see FORKS). Picking one quietly would let a computed number
//      masquerade as certainty — and the 400/430 fork is the very collapse
//      DR-0281's guard was built to catch.
// =============================================================================

// ---------------------------------------------------------------------------
// The two genealogical chains. Each link carries the age AT the begetting and
// the verse that states it, so the arithmetic below is auditable link by link.
// ---------------------------------------------------------------------------

/** Adam -> Noah (Genesis 5). `age` = the father's age when the son was born. */
export const GENESIS_5_CHAIN = Object.freeze([
  { father: 'Adam', son: 'Seth', age: 130, ref: 'Genesis 5:3', text: 'And Adam lived an hundred and thirty years, and begat a son in his own likeness, after his image; and called his name Seth:' },
  { father: 'Seth', son: 'Enos', age: 105, ref: 'Genesis 5:6', text: 'And Seth lived an hundred and five years, and begat Enos:' },
  { father: 'Enos', son: 'Cainan', age: 90, ref: 'Genesis 5:9', text: 'And Enos lived ninety years, and begat Cainan:' },
  { father: 'Cainan', son: 'Mahalaleel', age: 70, ref: 'Genesis 5:12', text: 'And Cainan lived seventy years, and begat Mahalaleel:' },
  { father: 'Mahalaleel', son: 'Jared', age: 65, ref: 'Genesis 5:15', text: 'And Mahalaleel lived sixty and five years, and begat Jared:' },
  { father: 'Jared', son: 'Enoch', age: 162, ref: 'Genesis 5:18', text: 'And Jared lived an hundred sixty and two years, and he begat Enoch:' },
  { father: 'Enoch', son: 'Methuselah', age: 65, ref: 'Genesis 5:21', text: 'And Enoch lived sixty and five years, and begat Methuselah:' },
  { father: 'Methuselah', son: 'Lamech', age: 187, ref: 'Genesis 5:25', text: 'And Methuselah lived an hundred eighty and seven years, and begat Lamech:' },
  { father: 'Lamech', son: 'Noah', age: 182, ref: 'Genesis 5:28', text: 'And Lamech lived an hundred eighty and two years, and begat a son:' },
]);

/** Shem -> Terah (Genesis 11). Shem's link is measured from the FLOOD, not
 *  from creation, because the text times it that way ("two years after the
 *  flood") — a detail that silently shifts the whole post-flood spine if missed. */
export const GENESIS_11_CHAIN = Object.freeze([
  { father: 'Shem', son: 'Arphaxad', age: 100, fromFlood: 2, ref: 'Genesis 11:10', text: 'These are the generations of Shem: Shem was an hundred years old, and begat Arphaxad two years after the flood:' },
  { father: 'Arphaxad', son: 'Salah', age: 35, ref: 'Genesis 11:12', text: 'And Arphaxad lived five and thirty years, and begat Salah:' },
  { father: 'Salah', son: 'Eber', age: 30, ref: 'Genesis 11:14', text: 'And Salah lived thirty years, and begat Eber:' },
  { father: 'Eber', son: 'Peleg', age: 34, ref: 'Genesis 11:16', text: 'And Eber lived four and thirty years, and begat Peleg:' },
  { father: 'Peleg', son: 'Reu', age: 30, ref: 'Genesis 11:18', text: 'And Peleg lived thirty years, and begat Reu:' },
  { father: 'Reu', son: 'Serug', age: 32, ref: 'Genesis 11:20', text: 'And Reu lived two and thirty years, and begat Serug:' },
  { father: 'Serug', son: 'Nahor', age: 30, ref: 'Genesis 11:22', text: 'And Serug lived thirty years, and begat Nahor:' },
  { father: 'Nahor', son: 'Terah', age: 29, ref: 'Genesis 11:24', text: 'And Nahor lived nine and twenty years, and begat Terah:' },
]);

/** Noah's age when the flood came — the hinge that joins the two chains. */
export const FLOOD_AT_NOAHS_AGE = Object.freeze({
  age: 600, ref: 'Genesis 7:6', text: 'And Noah was six hundred years old when the flood of waters was upon the earth.',
});

/**
 * The running year-from-creation spine, COMPUTED from the chains above.
 * Adam's creation is year 0 by convention (no verse assigns it a number), so
 * every entry answers "how many years after Adam" — and each carries the verse
 * whose figure moved the counter, so any link can be checked on its own.
 */
export function annoMundiSpine() {
  const out = [];
  let year = 0;
  out.push({ am: 0, event: 'Adam — the beginning of the counted record', kind: 'anchor', ref: 'Genesis 5:3', note: 'Year 0 is a CONVENTION for counting, not a date Scripture assigns.' });
  for (const link of GENESIS_5_CHAIN) {
    year += link.age;
    out.push({ am: year, event: `${link.son} born (${link.father} was ${link.age})`, kind: 'computed', ref: link.ref });
  }
  const flood = year + FLOOD_AT_NOAHS_AGE.age;
  out.push({ am: flood, event: 'The flood — Noah was 600', kind: 'computed', ref: FLOOD_AT_NOAHS_AGE.ref });
  let post = flood;
  for (const link of GENESIS_11_CHAIN) {
    post = link.fromFlood != null ? flood + link.fromFlood : post + link.age;
    out.push({ am: post, event: `${link.son} born (${link.father} was ${link.age})`, kind: 'computed', ref: link.ref });
  }
  return out;
}

/** The year of the flood, from creation — computed, used by several surfaces. */
export function floodYearAM() {
  return GENESIS_5_CHAIN.reduce((n, l) => n + l.age, 0) + FLOOD_AT_NOAHS_AGE.age;
}

// ---------------------------------------------------------------------------
// The figures Scripture states OUTRIGHT, epoch by epoch, to the end of the Book.
// `kind: 'stated'` throughout — these are the verses' own numbers.
// ---------------------------------------------------------------------------
export const CHRONOLOGY_MARKERS = Object.freeze([
  // ---- Creation & the early world ----
  { id: 'adam-lifespan', epochId: 'creation', label: 'Adam lived 930 years', figure: '930 years', kind: 'stated', ref: 'Genesis 5:5', text: 'And all the days that Adam lived were nine hundred and thirty years: and he died.' },
  { id: 'methuselah', epochId: 'genesis-6', label: 'Methuselah — the longest life recorded', figure: '969 years', kind: 'stated', ref: 'Genesis 5:27', text: 'And all the days of Methuselah were nine hundred sixty and nine years: and he died.' },
  { id: 'the-120', epochId: 'genesis-6', label: 'The 120-year notice before the flood', figure: '120 years', kind: 'stated', ref: 'Genesis 6:3', text: 'And the LORD said, My spirit shall not always strive with man, for that he also is flesh: yet his days shall be an hundred and twenty years.' },
  { id: 'flood-day', epochId: 'genesis-6', label: 'The flood dated to the DAY', figure: 'Noah’s 600th year, 2nd month, 17th day', kind: 'stated', ref: 'Genesis 7:11', text: 'In the six hundredth year of Noah’s life, in the second month, the seventeenth day of the month, the same day were all the fountains of the great deep broken up, and the windows of heaven were opened.' },
  { id: 'flood-dry', epochId: 'genesis-6', label: 'The ground dry — one year and ten days later', figure: '601st year, 1st month, 1st day', kind: 'stated', ref: 'Genesis 8:13', text: 'And it came to pass in the six hundredth and first year, in the first month, the first day of the month, the waters were dried up from off the earth: and Noah removed the covering of the ark, and looked, and, behold, the face of the ground was dry.' },
  { id: 'noah-lifespan', epochId: 'genesis-6', label: 'Noah lived 950 years', figure: '950 years', kind: 'stated', ref: 'Genesis 9:29', text: 'And all the days of Noah were nine hundred and fifty years: and he died.' },

  // ---- Babel & the patriarchs ----
  { id: 'terah-abram', epochId: 'babel', label: 'Terah 70 when Abram, Nahor and Haran are named', figure: '70 years', kind: 'stated', ref: 'Genesis 11:26', text: 'And Terah lived seventy years, and begat Abram, Nahor, and Haran.' },
  { id: 'terah-death', epochId: 'babel', label: 'Terah died at 205, in Haran', figure: '205 years', kind: 'stated', ref: 'Genesis 11:32', text: 'And the days of Terah were two hundred and five years: and Terah died in Haran.' },
  { id: 'abram-call', epochId: 'israel', label: 'Abram leaves Haran at 75', figure: '75 years old', kind: 'stated', ref: 'Genesis 12:4', text: 'So Abram departed, as the LORD had spoken unto him; and Lot went with him: and Abram was seventy and five years old when he departed out of Haran.' },
  { id: 'isaac-born', epochId: 'israel', label: 'Isaac born — Abraham is 100', figure: '100 years old', kind: 'stated', ref: 'Genesis 21:5', text: 'And Abraham was an hundred years old, when his son Isaac was born unto him.' },
  { id: 'jacob-born', epochId: 'israel', label: 'Jacob and Esau born — Isaac is 60', figure: '60 years old', kind: 'stated', ref: 'Genesis 25:26', text: 'And after that came his brother out, and his hand took hold on Esau’s heel; and his name was called Jacob: and Isaac was threescore years old when she bare them.' },
  { id: 'jacob-egypt', epochId: 'israel', label: 'Jacob enters Egypt at 130', figure: '130 years', kind: 'stated', ref: 'Genesis 47:9', text: 'And Jacob said unto Pharaoh, The days of the years of my pilgrimage are an hundred and thirty years: few and evil have the days of the years of my life been, and have not attained unto the days of the years of the life of my fathers in the days of their pilgrimage.' },
  { id: 'joseph-death', epochId: 'israel', label: 'Joseph dies at 110', figure: '110 years', kind: 'stated', ref: 'Genesis 50:26', text: 'So Joseph died, being an hundred and ten years old: and they embalmed him, and he was put in a coffin in Egypt.' },

  // ---- Egypt, exodus, wilderness, temple ----
  { id: 'sojourning-430', epochId: 'israel', label: 'The SOJOURNING — 430 years', figure: '430 years', kind: 'stated', ref: 'Exodus 12:40', text: 'Now the sojourning of the children of Israel, who dwelt in Egypt, was four hundred and thirty years.' },
  { id: 'affliction-400', epochId: 'israel', label: 'The AFFLICTION — 400 years', figure: '400 years', kind: 'stated', ref: 'Genesis 15:13', text: 'And he said unto Abram, Know of a surety that thy seed shall be a stranger in a land that is not theirs, and shall serve them; and they shall afflict them four hundred years;' },
  { id: 'moses-80', epochId: 'israel', label: 'Moses is 80 before Pharaoh', figure: '80 years old', kind: 'stated', ref: 'Exodus 7:7', text: 'And Moses was fourscore years old, and Aaron fourscore and three years old, when they spake unto Pharaoh.' },
  { id: 'wilderness-40', epochId: 'israel', label: 'Forty years in the wilderness', figure: '40 years', kind: 'stated', ref: 'Numbers 32:13', text: 'And the LORD’s anger was kindled against Israel, and he made them wander in the wilderness forty years, until all the generation, that had done evil in the sight of the LORD, was consumed.' },
  { id: 'moses-120', epochId: 'israel', label: 'Moses dies at 120', figure: '120 years', kind: 'stated', ref: 'Deuteronomy 34:7', text: 'And Moses was an hundred and twenty years old when he died: his eye was not dim, nor his natural force abated.' },
  { id: 'temple-480', epochId: 'israel', label: 'The temple begun — 480 years after the exodus', figure: '480 years', kind: 'stated', ref: '1 Kings 6:1', text: 'And it came to pass in the four hundred and eightieth year after the children of Israel were come out of the land of Egypt, in the fourth year of Solomon’s reign over Israel, in the month Zif, which is the second month, that he began to build the house of the LORD.' },

  // ---- Captivity & the prophetic clock ----
  { id: 'captivity-70', epochId: 'israel', label: 'Seventy years of captivity foretold', figure: '70 years', kind: 'stated', ref: 'Jeremiah 25:11', text: 'And this whole land shall be a desolation, and an astonishment; and these nations shall serve the king of Babylon seventy years.' },
  { id: 'daniel-reads', epochId: 'israel', label: 'Daniel reads the 70 years and prays', figure: '70 years', kind: 'stated', ref: 'Daniel 9:2', text: 'In the first year of his reign I Daniel understood by books the number of the years, whereof the word of the LORD came to Jeremiah the prophet, that he would accomplish seventy years in the desolations of Jerusalem.' },
  { id: 'jerusalem-falls', epochId: 'israel', label: 'Jerusalem falls — dated by a named king’s regnal year', figure: '19th year of Nebuchadnezzar', kind: 'stated', ref: '2 Kings 25:8', text: 'And in the fifth month, on the seventh day of the month, which is the nineteenth year of king Nebuchadnezzar king of Babylon, came Nebuzaradan, captain of the guard, a servant of the king of Babylon, unto Jerusalem:' },
  { id: 'seventy-weeks', epochId: 'israel', label: 'The seventy weeks determined', figure: '70 weeks (7 + 62 to Messiah the Prince)', kind: 'stated', ref: 'Daniel 9:25', text: 'Know therefore and understand, that from the going forth of the commandment to restore and to build Jerusalem unto the Messiah the Prince shall be seven weeks, and threescore and two weeks: the street shall be built again, and the wall, even in troublous times.' },

  // ---- Christ ----
  { id: 'tiberius-15', epochId: 'christ', label: 'The one imperial year the Word names', figure: '15th year of Tiberius Caesar', kind: 'stated', ref: 'Luke 3:1', text: 'Now in the fifteenth year of the reign of Tiberius Caesar, Pontius Pilate being governor of Judaea, and Herod being tetrarch of Galilee, and his brother Philip tetrarch of Ituraea and of the region of Trachonitis, and Lysanias the tetrarch of Abilene,' },
  { id: 'jesus-30', epochId: 'christ', label: 'Jesus begins at about thirty', figure: 'about 30 years', kind: 'stated', ref: 'Luke 3:23', text: 'And Jesus himself began to be about thirty years of age, being (as was supposed) the son of Joseph, which was the son of Heli,' },
  { id: 'forty-days', epochId: 'christ', label: 'Forty days between resurrection and ascension', figure: '40 days', kind: 'stated', ref: 'Acts 1:3', text: 'To whom also he shewed himself alive after his passion by many infallible proofs, being seen of them forty days, and speaking of the things pertaining to the kingdom of God:' },

  // ---- The church age and the end: DURATIONS, never dates ----
  { id: 'not-for-you', epochId: 'church-age', label: 'The length of this age is withheld on purpose', figure: 'not given', kind: 'stated', ref: 'Acts 1:7', text: 'And he said unto them, It is not for you to know the times or the seasons, which the Father hath put in his own power.' },
  { id: 'no-man-knows', epochId: 'the-return', label: 'The day and hour are known to the Father only', figure: 'not given', kind: 'stated', ref: 'Matthew 24:36', text: 'But of that day and hour knoweth no man, no, not the angels of heaven, but my Father only.' },
  { id: 'twelve-sixty', epochId: 'the-return', label: 'The witnesses prophesy 1,260 days', figure: '1,260 days', kind: 'stated', ref: 'Revelation 11:3', text: 'And I will give power unto my two witnesses, and they shall prophesy a thousand two hundred and threescore days, clothed in sackcloth.' },
  { id: 'forty-two-months', epochId: 'the-return', label: 'Authority given for 42 months', figure: '42 months', kind: 'stated', ref: 'Revelation 13:5', text: 'And there was given unto him a mouth speaking great things and blasphemies; and power was given unto him to continue forty and two months.' },
  { id: 'thousand-years', epochId: 'eternity', label: 'They reigned with Christ a thousand years', figure: '1,000 years', kind: 'stated', ref: 'Revelation 20:4', text: 'And I saw thrones, and they sat upon them, and judgment was given unto them: and I saw the souls of them that were beheaded for the witness of Jesus, and for the word of God, and which had not worshipped the beast, neither his image, neither had received his mark upon their foreheads, or in their hands; and they lived and reigned with Christ a thousand years.' },
  { id: 'all-things-new', epochId: 'eternity', label: 'The counting ends — all things new', figure: 'no duration given', kind: 'stated', ref: 'Revelation 21:5', text: 'And he that sat upon the throne said, Behold, I make all things new. And he said unto me, Write: for these words are true and faithful.' },
]);

// ---------------------------------------------------------------------------
// The forks: where the text genuinely admits two readings that change the sum.
// Named, never silently resolved (DR-0281 (c) — do not assert a sequence the
// text does not assert).
// ---------------------------------------------------------------------------
export const FORKS = Object.freeze([
  {
    id: 'terah-abram-birth',
    question: 'How old was Terah when ABRAM was born — and therefore where does Abram sit on the line?',
    sides: [
      { reading: 'Terah was 70', restsOn: 'Genesis 11:26 lists Abram first: "And Terah lived seventy years, and begat Abram, Nahor, and Haran."' },
      { reading: 'Terah was 130', restsOn: 'Genesis 11:32 (Terah died at 205) with Genesis 12:4 (Abram left Haran at 75) and Acts 7:4 (he removed "when his father was dead") — 205 minus 75 puts Abram’s birth in Terah’s 130th year, making the Genesis 11:26 list an order of prominence, not of birth.' },
    ],
    effect: 'The two readings move Abram — and everything measured from him — by 60 years. The surface therefore gives the spine only to Terah and stops, rather than printing one figure as if the matter were closed.',
  },
  {
    id: 'four-hundred-vs-four-thirty',
    question: 'Egypt: is it 400 years or 430?',
    sides: [
      { reading: '400 = the AFFLICTION', restsOn: 'Genesis 15:13, "they shall afflict them four hundred years", restated by Stephen in Acts 7:6, "entreat them evil four hundred years".' },
      { reading: '430 = the SOJOURNING', restsOn: 'Exodus 12:40, "the sojourning of the children of Israel, who dwelt in Egypt, was four hundred and thirty years" — the same 430 Paul measures from the confirmed promise to the law in Galatians 3:17.' },
    ],
    effect: 'These are TWO CLOCKS measuring TWO DIFFERENT THINGS, not a contradiction and not a rounding. Both are kept exactly. Collapsing them into one number — announcing 400 and "hitting" 430 — is the precise error DR-0281 was written to stop.',
  },
]);

// ---------------------------------------------------------------------------
// The honest boundary of the whole instrument.
// ---------------------------------------------------------------------------
export const CHRONOLOGY_LIMITS = Object.freeze({
  noAbsoluteDates: 'Scripture assigns no BC/AD date to creation, the flood, or Abraham. Every familiar "4004 BC"-style figure is a RECONSTRUCTION that ties this internal chronology to external king-lists — useful, but not revelation, and never presented here as though the Word said it.',
  computedNotQuoted: 'Every "year from creation" on this page is ARITHMETIC on stated figures, not a quotation. No verse says "Anno Mundi 1656." The stated numbers are quoted; the running totals are labeled computed.',
  gapsAreReal: 'The spine runs cleanly to Terah. After the patriarchs the record continues in reign-years across Kings and Chronicles with co-regencies and overlaps that Scripture does not resolve for us, so this module carries the STATED figures of that stretch without pretending to a continuous total.',
  theEndIsUndated: 'From the church age onward the Word gives DURATIONS (1,260 days; 42 months; 1,000 years) and withholds DATES — deliberately: "It is not for you to know the times or the seasons" (Acts 1:7); "of that day and hour knoweth no man" (Matthew 24:36). A timeline that produced an end-date would be less rigorous than the Book it claims to follow, not more.',
});

/** The stated markers belonging to one epoch, in listed order. */
export function markersForEpoch(epochId) {
  return CHRONOLOGY_MARKERS.filter((m) => m.epochId === epochId);
}

/** Every distinct reference this module quotes — used by the verbatim gate. */
export function allChronologyQuotes() {
  return [
    ...GENESIS_5_CHAIN.map(({ ref, text }) => ({ ref, text })),
    ...GENESIS_11_CHAIN.map(({ ref, text }) => ({ ref, text })),
    { ref: FLOOD_AT_NOAHS_AGE.ref, text: FLOOD_AT_NOAHS_AGE.text },
    ...CHRONOLOGY_MARKERS.map(({ ref, text }) => ({ ref, text })),
  ];
}
