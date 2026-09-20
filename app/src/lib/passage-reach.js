// =============================================================================
// passage-reach — a passage this house taught on purpose must REACH the places
// its subject is discussed
// =============================================================================
// Darrell 2026-09-19, after L183 taught four passages that had been at zero:
//
//   "Genesis 29:17, Genesis 24, Job 31:1 and Ruth 3:11 were all at zero lessons
//    — Make sure it's not that way anymore... make sure its everywhere it's
//    discussion so it can be more fully comprehensive understanding based on
//    more Word... make sense?"
//
// The failure he is naming is not "a verse is missing". It is a verse taught
// ONCE, in the lesson that introduced it, and never carried to the other
// lessons already discussing the same subject — so a reader who arrives by the
// other door never meets it. L188 found the same shape in this house's own
// work from the other direction: Luke 4:18 was quoted three times and Luke 4:19
// zero times, for 186 lessons.
//
// WHY A DECLARED REGISTRY AND NOT A BLANKET RULE. "Every verse must appear in
// at least two lessons" would be false: most verses legitimately appear once,
// and a gate that demands otherwise would push authors to sprinkle Scripture
// where it does not belong — the mechanical sweep this house forbids. So the
// obligation is DECLARED, per passage, with the reason written down. Adding a
// row is a deliberate act that says: this passage carries weight beyond the
// lesson that introduced it.
//
// WHY THE FLOOR IS A FLOOR AND NOT A TARGET. `minLessons` may only be met or
// exceeded. It is not a quota to hit and stop at — DR-0075 expects these to
// keep spreading as the subject is taught again, and the test asserts >=, so a
// passage reaching further never fails.
//
// HOW A PLACEMENT IS MADE (2026-09-19, the method that survived measurement):
// the passage is written into the adult lesson AND every age band of the host
// lesson, in that band's own words. Adding to the adult text alone raises the
// denominator the band-fullness floors are measured against and can push a
// healthy band under its floor; adding to every band raises numerator and
// denominator together, so the shares hold or IMPROVE. Measured on the first
// three placements: ll123's child went 0.65 -> 0.67 and its teen 0.66 -> 0.67.
// Never place into a lesson already carrying full-levels debt (ll9's youth band
// is missing entirely, ll21's bands are all far under floor) — that deepens
// recorded debt instead of paying it.
//
// AND THE PLACEMENT MUST CLEAR THE HOST LESSON'S OWN BAND RULES, not only the
// corpus-wide gates (2026-09-19, caught by ll123's verse test on the first
// full run). ll123's child band is deliberately authored WITHOUT marriage or
// contract weight for a six-year-old, and guards that with a banned-word
// check; a child insertion opening "looking for a wife for his master's son"
// tripped it. Subject fit chooses the host; the host's own guards still govern
// what each band may say. De-frame the band text -- never loosen the guard to
// make a placement fit.
//
// A BAND WITH NO HEADING STRUCTURE IS APPENDED, NEVER SKIPPED (2026-09-19,
// tranche two). The insert-before-the-final-heading rule needs a heading to
// aim at; five bands across ll111, ll144 and ll145 have none. The first run
// SKIPPED them while the adult text still grew, which pushed ll111's youth
// and teen and ll145's teen UNDER the full-levels floor -- the precise
// regression this method exists to prevent, produced by the method itself.
// A band that cannot take the passage in the preferred position must still
// take it, or the placement is not finished.
// A FLOOR THE INTRODUCING LESSON SATISFIES BY ITSELF IS GREEN BY CONSTRUCTION
// (2026-09-19, DR-0547). Darrell, looking at L188's own point 7 on his phone:
// "Did we fix this so this is throughout the lessons we speak on it?!!!!!!!!!!!"
// The measured answer was NO -- and the gate built that same day said yes,
// because `minLessons: 1` on Luke 4:19 was met by ll188, the lesson that
// introduced it. The count was right; the floor was a lie. A gate that always
// passes is itself a lie (DR-0076 s3), and this house built one.
//
// So every row now declares `introducedBy`, the lesson that first taught the
// passage, and `reach` is joined by `beyond` -- the reach EXCLUDING that
// lesson. `passagesStrandedInTheirIntroduction` fails on beyond === 0, which
// is the defect stated directly rather than approximated by a number.
//
// A ROW MAY STILL BE PARKED, but only the way DR-0075 permits anything to be
// parked: `strandedUntil` is a DATE, and it is the promise the placement gets
// made. No date, no parking -- the row fails until the passage leaves the
// lesson that introduced it. Job 31:1 is parked to 2026-10-19 because the
// hosts discussing its subject all carry full-levels debt today, and placing
// into those deepens debt instead of paying it.

export const PASSAGES_THAT_MUST_REACH = Object.freeze([
  {
    ref: 'Genesis 29:17',
    subject: 'outward looks against real worth',
    introducedBy: 'll183-',
    minLessons: 2,
    why: 'Jacob chose by sight and Yahweh answered by opening the unchosen sister’s womb; the line of the King ran through her. Belongs wherever this school discusses being picked, ranked or passed over.',
  },
  {
    ref: 'Genesis 24:14',
    subject: 'character proved where nobody is watching',
    introducedBy: 'll183-',
    minLessons: 2,
    why: 'The servant’s sign was a costly kindness, not a look. Belongs wherever qualification, choosing, or being evaluated is taught.',
  },
  {
    ref: 'Ruth 3:11',
    subject: 'a reputation the whole city already knows',
    introducedBy: 'll183-',
    minLessons: 2,
    why: 'Boaz reports a fact the town settled by watching her, not a compliment. Belongs wherever the meek and quiet spirit, virtue or reputation is taught.',
  },
  {
    ref: 'Leviticus 19:15',
    subject: 'justice with no thumb on either side of the scale',
    introducedBy: 'll37-',
    minLessons: 8,
    why: 'Forbids favouring the poor as firmly as favouring the mighty, in one verse. The guard that stops any justice teaching in this school becoming a faction\u2019s banner, so it belongs in every just-weight and just-judge lesson.',
  },
  {
    ref: 'Ephesians 6:9',
    subject: 'the master is told he has a Master',
    introducedBy: 'll114-',
    minLessons: 3,
    why: 'The half of the servant passage that is left off when the first half is quoted at the person underneath. Belongs wherever service, employment, authority or the bondservant is taught.',
  },
  {
    ref: 'Job 31:1',
    subject: 'a covenant with your eyes',
    introducedBy: 'll183-',
    minLessons: 1,
    strandedUntil: '2026-10-19',
    why: 'The concrete discipline behind every lesson on lust, the flesh and guarding the gate of the eye. STRANDED in the lesson that introduced it: every lesson discussing its subject carries full-levels debt today, and placing into those deepens debt instead of paying it. Parked with a date, not with a floor of 1 — re-review: 2026-10-19.',
  },
  {
    ref: 'Luke 4:19',
    subject: 'the acceptable year of the Lord',
    introducedBy: 'll188-',
    minLessons: 2,
    why: 'The line this house stopped one short of, three separate times, while quoting Luke 4:18 (L188 / DR-0541). DISCHARGED 2026-09-19 into ll86, where every one of the five versions read the Nazareth synagogue scene, quoted Luke 4:18 and stopped exactly there — the paragraph finishing the sentence it was already in the middle of.',
  },
  {
    ref: 'Leviticus 25:9',
    subject: 'the jubilee trumpet sounds on the day of atonement',
    introducedBy: 'll188-',
    minLessons: 2,
    why: 'Settles the atonement-before-liberty order from the verse rather than from a teacher. DISCHARGED 2026-09-19 into ll133, whose subject IS the day of atonement and the two goats — the calendar\u2019s own footnote to the pattern that lesson already teaches.',
  },
  {
    ref: 'Luke 4:20',
    subject: 'He closed the book, gave it back, and sat down',
    introducedBy: 'll188-',
    minLessons: 2,
    why: 'The beat between the reading and the claim. Without it the Nazareth scene has no silence in it, and the sentence He says next lands as commentary rather than as a man sitting down in front of a room that is staring at Him.',
  },
  {
    ref: 'Luke 4:21',
    subject: 'this day is this scripture fulfilled in your ears',
    introducedBy: 'll188-',
    minLessons: 2,
    why: 'The King stating His own mission in His own mouth and dating it to that day. This is the verse the whole Nazareth scene exists to deliver, and a house that quotes 4:18 and stops never reaches it.',
  },
  {
    ref: 'Isaiah 61:2',
    subject: 'the acceptable year of the LORD, in the prophet He was reading from',
    introducedBy: 'll188-',
    minLessons: 2,
    why: 'The source He was reading aloud. Carrying Luke 4:19 without it leaves the reader unable to see that the acceptable year was written centuries earlier and that He was claiming a text, not coining a phrase.',
  },
]);

/**
 * How many of `modules` carry each declared passage, and which ones.
 *
 * `reach` is the raw count. `beyond` is the count EXCLUDING the lesson that
 * introduced the passage, and it is the honest number: a passage sitting only
 * in its own introduction has reached nobody who came by another door.
 */
export function measureReach(modules, passages = PASSAGES_THAT_MUST_REACH) {
  return passages.map((p) => {
    const carriedBy = (modules || [])
      .filter((m) => JSON.stringify(m).includes(p.ref))
      .map((m) => m.id);
    const elsewhere = p.introducedBy
      ? carriedBy.filter((id) => !String(id).startsWith(p.introducedBy))
      : carriedBy;
    return { ...p, carriedBy, reach: carriedBy.length, beyond: elsewhere.length };
  });
}

/** Declared passages whose reach has fallen below the floor they committed to. */
export function passagesBelowFloor(modules, passages = PASSAGES_THAT_MUST_REACH) {
  return measureReach(modules, passages)
    .filter((r) => r.reach < r.minLessons)
    .map((r) => `${r.ref} reaches ${r.reach} lesson(s), floor is ${r.minLessons} — ${r.subject}`);
}

/**
 * Declared passages that never left the lesson that introduced them.
 *
 * This is the check `passagesBelowFloor` could not make. A floor of 1 is met
 * by the introducing lesson alone, so the count read green while the defect —
 * taught once, never carried — was exactly as Darrell described it. A row may
 * be parked only with `strandedUntil`, a DATE that is the promise the
 * placement gets made (DR-0075); a row with no date and no reach beyond its
 * own introduction FAILS.
 */
export function passagesStrandedInTheirIntroduction(
  modules, passages = PASSAGES_THAT_MUST_REACH, today = new Date(),
) {
  return measureReach(modules, passages)
    .filter((r) => r.introducedBy && r.beyond === 0)
    .filter((r) => !r.strandedUntil || new Date(r.strandedUntil) < today)
    .map((r) => (r.strandedUntil
      ? `${r.ref} is still stranded in ${r.introducedBy} and its parking expired ${r.strandedUntil} — ${r.subject}`
      : `${r.ref} reaches only ${r.introducedBy}, the lesson that introduced it — ${r.subject}`));
}

/** Rows parked with a date, for the re-review sweep to pick up. */
export function parkedPassages(passages = PASSAGES_THAT_MUST_REACH) {
  return passages.filter((p) => p.strandedUntil)
    .map((p) => ({ ref: p.ref, reReview: p.strandedUntil, why: p.why }));
}
