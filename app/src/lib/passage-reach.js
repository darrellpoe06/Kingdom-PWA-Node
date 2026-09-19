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
export const PASSAGES_THAT_MUST_REACH = Object.freeze([
  {
    ref: 'Genesis 29:17',
    subject: 'outward looks against real worth',
    minLessons: 2,
    why: 'Jacob chose by sight and Yahweh answered by opening the unchosen sister’s womb; the line of the King ran through her. Belongs wherever this school discusses being picked, ranked or passed over.',
  },
  {
    ref: 'Genesis 24:14',
    subject: 'character proved where nobody is watching',
    minLessons: 2,
    why: 'The servant’s sign was a costly kindness, not a look. Belongs wherever qualification, choosing, or being evaluated is taught.',
  },
  {
    ref: 'Ruth 3:11',
    subject: 'a reputation the whole city already knows',
    minLessons: 2,
    why: 'Boaz reports a fact the town settled by watching her, not a compliment. Belongs wherever the meek and quiet spirit, virtue or reputation is taught.',
  },
  {
    ref: 'Leviticus 19:15',
    subject: 'justice with no thumb on either side of the scale',
    minLessons: 8,
    why: 'Forbids favouring the poor as firmly as favouring the mighty, in one verse. The guard that stops any justice teaching in this school becoming a faction\u2019s banner, so it belongs in every just-weight and just-judge lesson.',
  },
  {
    ref: 'Ephesians 6:9',
    subject: 'the master is told he has a Master',
    minLessons: 3,
    why: 'The half of the servant passage that is left off when the first half is quoted at the person underneath. Belongs wherever service, employment, authority or the bondservant is taught.',
  },
  {
    ref: 'Job 31:1',
    subject: 'a covenant with your eyes',
    minLessons: 1,
    why: 'The concrete discipline behind every lesson on lust, the flesh and guarding the gate of the eye. Floor is 1 until a host lesson with real band headroom is authored — re-review: 2026-10-19.',
  },
  {
    ref: 'Luke 4:19',
    subject: 'the acceptable year of the Lord',
    minLessons: 1,
    why: 'The line this house stopped one short of, three separate times, while quoting Luke 4:18 (L188 / DR-0541). Floor is 1 today; it rises as the jubilee subject is taught again — re-review: 2026-12-19.',
  },
  {
    ref: 'Leviticus 25:9',
    subject: 'the jubilee trumpet sounds on the day of atonement',
    minLessons: 1,
    why: 'Settles the atonement-before-justice order from the verse rather than from a teacher. Floor is 1 today — re-review: 2026-12-19.',
  },
]);

/** How many of `modules` carry each declared passage, and which ones. */
export function measureReach(modules, passages = PASSAGES_THAT_MUST_REACH) {
  return passages.map((p) => {
    const carriedBy = (modules || [])
      .filter((m) => JSON.stringify(m).includes(p.ref))
      .map((m) => m.id);
    return { ...p, carriedBy, reach: carriedBy.length };
  });
}

/** Declared passages whose reach has fallen below the floor they committed to. */
export function passagesBelowFloor(modules, passages = PASSAGES_THAT_MUST_REACH) {
  return measureReach(modules, passages)
    .filter((r) => r.reach < r.minLessons)
    .map((r) => `${r.ref} reaches ${r.reach} lesson(s), floor is ${r.minLessons} — ${r.subject}`);
}
