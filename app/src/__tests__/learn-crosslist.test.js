// =============================================================================
// A.I. understanding is gathered from the whole curriculum, credited once
// =============================================================================
// Darrell 2026-09-16: "Most people want Ai understanding built in their
// curriculum" and "can we use cross-referenced lessons that get credited
// either way." DR-0447 fixed the A.I. department's COUNT; this is the second
// half — the nine A.I. lessons the curriculum teaches elsewhere, gathered on
// the department's shelf as POINTERS, so the lesson keeps exactly one home and
// therefore exactly one credit.
//
// The checks that matter are the ones a future edit will trip: a renamed
// lesson id (the shelf would render a row that opens nothing), a lesson
// cross-listed into the department it already lives in (the same lesson
// counted twice), and the program totals moving (a copy, not a pointer).
import { describe, it, expect } from 'vitest';
import {
  CROSS_LISTINGS, crossListingsFor, crossListedDepartments, resolveCrossListed,
  missingCrossListings, selfListedCrossListings, crossListedCount,
  COURSE_CROSS_LISTINGS, HOME_ONLY, coursesWithNoShelfDeclaration,
} from '../lib/learn-crosslist.js';
import { LEARN_CATALOG, catalogCategory, buildCatalogCourseDescriptors } from '../lib/learn-catalog.js';
import { buildLessonIndex, courseLessonCount, learnDepartments } from '../lib/learn-organize.js';
import { buildEternalProcessingCourses } from '../lib/eternal-algorithms-course.js';

// The whole mounted catalog, as the church door assembles it: every registered
// course (the component-wired youth course included, via the registry) plus
// the Eternal-Algorithms family.
const courses = [
  ...LEARN_CATALOG.map((e) => ({ key: e.key, meta: e.meta, schedule: e.buildScheduleRows() })),
  ...buildEternalProcessingCourses(),
];
const index = buildLessonIndex(courses);

describe('every cross-listed lesson is a real, mounted lesson', () => {
  it('names nothing the catalog does not carry', () => {
    // A renamed or removed lesson id fails HERE, with the line to fix, instead
    // of rendering a row that opens nothing.
    expect(missingCrossListings(index)).toEqual([]);
  });

  it('resolves every declaration to its real title and home course', () => {
    const rows = resolveCrossListed('A.I. The Way', index);
    expect(rows).toHaveLength(crossListedCount('A.I. The Way'));
    for (const r of rows) {
      expect(r.title, `${r.lessonId} resolved with no title`).toBeTruthy();
      expect(r.courseTitle).toBeTruthy();
      expect(r.unitLabel).toBeTruthy();
      expect(r.why).toBeTruthy();
    }
  });

  it('reads the title from the lesson rather than a copy of it', () => {
    const tower = resolveCrossListed('A.I. The Way', index)
      .find((r) => r.lessonId.startsWith('ll34-'));
    const live = index.find((r) => r.lessonId === tower.lessonId);
    expect(tower.title).toBe(live.title);
    expect(tower.courseTitle).toBe(live.courseTitle);
  });
});

describe('a pointer, never a copy', () => {
  it('cross-lists no lesson into the department it already lives in', () => {
    expect(selfListedCrossListings((key) => catalogCategory(key) || '')).toEqual([]);
  });

  it('draws from courses outside the department, in two other departments', () => {
    const from = [...new Set(crossListingsFor('A.I. The Way').map((c) => c.courseKey))];
    expect(from.length).toBeGreaterThan(1);
    const depts = [...new Set(from.map((k) => catalogCategory(k)))];
    expect(depts).not.toContain('A.I. The Way');
    expect(depts.length).toBeGreaterThan(1);
  });

  it('leaves the program totals exactly where they were', () => {
    // The department shelf grows; the catalog does not. 29 courses / 532
    // lessons, measured 2026-09-18.
    //
    // WHY THIS PIN MOVED, because a pin that moves silently is worthless. It
    // read 25 / 487 (measured 2026-09-16). A genuinely NEW course was added on
    // 2026-09-17 — the Business department's rent-to-own slice, 8 lessons
    // (DR-0454) — which legitimately raises both numbers. It moved again the
    // same day for the Development slice, another 8 real lessons. That is the
    // ONLY reason this pin may ever move: real content entering the catalog.
    // It moved to 27 / 504 on 2026-09-17 for L165 ("I Always Had Love",
    // DR-0456) — a real LESSON added to an existing course, so the course
    // count is unchanged at 27 while the lesson total rises by exactly one.
    // That case was not spelled out when this comment was written and is
    // written in now: a new course moves both numbers, a new lesson in an
    // existing course moves only the second, and nothing else may move either.
    // It moved again to 27 / 505 the same day for L166 ("Life Is
    // Disrespectful, So Think On These Things", DR-0457) — a second real
    // lesson into the same existing course — and to 27 / 506 for L167 ("Be a G
    // About It", DR-0459), a third. It moved to 27 / 507 for L168 ("The King
    // Through the Warrior's Lens", DR-0461), a fourth — same course, same
    // reason, course count untouched. And to 27 / 508 for L169 ("Pour It Out",
    // DR-0462), a fifth. And to 27 / 509 for L170 ("Through the Eyes of the
    // People Closest to Him", DR-0463), a sixth.
    //
    // And to 27 / 510 for L171 ("Trend It Against the Shoreline", DR-0466), a
    // seventh — same existing course, so the course count stays at 27 and only
    // the lesson total moves, exactly as the rule above spells out.
    //
    // And to 27 / 511 for L172 ("The Spirit of Your Mind", DR-0468), an
    // eighth — same existing course again, so only the lesson total moves.
    //
    // And to 27 / 512 for L173 ("Humility Is the Strength", DR-0470), a ninth
    // — same existing course, so only the lesson total moves.
    //
    // And to 29 / 532 on 2026-09-18 for TWO genuinely new courses (DR-0471):
    // Project Management: Count the Cost and Software Project Management:
    // Prove It, 10 real lessons each, opening a new Project Management
    // department. Both numbers move because both courses are real content —
    // the first course-count move since the Development slice, and the rule
    // above is unchanged: a new course moves both, a new lesson in an existing
    // course moves only the second, and nothing else may move either.
    //
    // (Housekeeping done in the same pass: the sentence below had been cut in
    // half by two earlier inserts landing inside it — it read "...is
    // unaffected: a" and then resumed nine paragraphs later at "cross-listing
    // is a POINTER". Rejoined, because a record nobody can read is not a
    // record. Nothing about the check changed.)
    //
    // And to 29 / 533 on 2026-09-18 for L174 ("The Levels of Disrespect, and
    // the Gap Between What He Means and What We Say", DR-0482) — a real lesson
    // added to an existing course, so the COURSE count is unchanged at 29 and
    // only the lesson total moves by exactly one, which is the shape the rule
    // above spells out for that case.
    //
    // And to 29 / 534 on 2026-09-18 for L175 ("True Love Starts With an Act and
    // a Sound Mind, and Feelings Come After the Test", DR-0483) — again a real
    // lesson into an existing course, so only the lesson total moves.
    //
    // And to 29 / 535 on 2026-09-18 for L176 ("Faith Is the Substance and the
    // Evidence, and He Made Me Then Died for Me", DR-0492) — a real lesson into
    // an existing course, so the course count holds at 29 and only the lesson
    // total moves by exactly one.
    //
    // And to 29 / 536 on 2026-09-18 for L177 ("Two Minds, and the One You Feed
    // Is the One That Runs You", DR-0495) — spoken into the channel and marked
    // a lesson the same day; again a real lesson into an existing course, so
    // only the lesson total moves.
    //
    // And to 29 / 537 on 2026-09-18 for L178 ("Terms Change, Not the Need",
    // DR-0496) — a real lesson into an existing course, so the course count
    // holds at 29 and only the lesson total moves by exactly one.
    //
    // And to 30 / 545 on 2026-09-18 for the REAL ESTATE department's first
    // course ("Why Owned Property Is a Principle", DR-0500) — a genuinely new
    // course with eight lessons, so BOTH pins move: the course count by one and
    // the lesson total by eight. It also opens a new department, which is the
    // case this test most needs to keep honest, because a new shelf is exactly
    // where a cross-listing would be tempted to double-count.
    //
    // And to 31 / 553 on 2026-09-18 for the Real Estate CAPSTONE ("Management
    // Is Stewardship", DR-0501) — the other end Darrell named, again a real
    // course of eight lessons, so both pins move again. It joins the EXISTING
    // Real Estate shelf rather than opening a second one, which the course's
    // own test pins directly.
    //
    // And to 32 / 561 on 2026-09-18 for the Real Estate department's third
    // course ("Buying: Price, Terms and the Count to Finish", DR-0504) — the
    // first one BETWEEN the two ends. Again both pins move, and again it joins
    // the existing Real Estate shelf rather than opening a fourth department,
    // which its own test pins directly.
    //
    // And to 33 / 571 on 2026-09-18 for the department's FOURTH course
    // ("Leasing and Tenant Selection", DR-0505) — the person-facing side of
    // the trade. Both pins move for its eight lessons, and it joins the same
    // Real Estate shelf, which its own test pins directly.
    //
    // And to 34 / 579 on 2026-09-18 for the department's FIFTH course
    // ("Maintenance, Repairs and the Trades", DR-0508) — the building itself.
    // Both pins move for its eight lessons, same Real Estate shelf.
    //
    // And to 35 / 587 on 2026-09-18 for the department's SIXTH course
    // ("Partnerships: Who You Build With", DR-0510) — the person standing next
    // to you when you sign, and the first course to ship benefits AND stories
    // from its first commit (DR-0509).
    //
    // And to 36 / 595 on 2026-09-18 for the department's SEVENTH course
    // ("Financing: The Debt You Sign and the Lender You Face", DR-0513) — the
    // money behind every other course in the department.
    //
    // And to 37 / 603 on 2026-09-18 for its EIGHTH course ("Taxes and Records:
    // What You Owe and What You Can Show", DR-0515) — what the authorities take
    // and what an owner can actually prove.
    //
    // And to 37 / 604 on 2026-09-19 for L179 ("Heartfelt: The Heart Is the
    // Deep Mind", DR-0518) — a real lesson into an existing course, so the
    // course count holds at 37 and only the lesson total moves by one.
    //
    // And to 38 / 612 on 2026-09-19 for the Banking course (DR-0522) — eight
    // new lessons in a NEW course, so both numbers move: the course count by
    // one and the lesson total by eight. Darrell named the gap in four words,
    // "Banking courses etc...", in the same breath as the plain-words work.
    //
    // The pins then moved to 40 / 628 for the Insurance and Risk course
    // (DR-0523) and the Inspections course (DR-0525) — eight lessons each, on
    // the same Real Estate shelf — and those two bumps landed without a note
    // here, which is recorded now rather than quietly carried forward.
    //
    // And to 41 / 636 on 2026-09-19 for the Evictions course (DR-0527) — eight
    // new lessons in a NEW course, course count by one and lesson total by
    // eight, Real Estate shelf again. Course eleven of that department.
    //
    // And to 42 / 644 on 2026-09-19 for the Appraisal course (DR-0528) — eight
    // new lessons in a NEW course, Real Estate shelf, course twelve of that
    // department. Both numbers move again, by one and by eight.
    //
    // What this test exists to catch has NOT changed and is unaffected: a
    // cross-listing is a POINTER, so putting a lesson on another department's
    // shelf must never add a course or a lesson to these totals. If a
    // cross-listing ever inflates them, this fails — and the numbers above are
    // the catalog's own, so the check still has teeth after the bump.
    // And to 42 / 645 on 2026-09-19 for L180 ("He Sings", DR-0530) — Darrell's
    // own spoken teaching, a real lesson into the existing Living Lessons
    // course, so the course count stays at 42 and only the lesson total moves,
    // exactly as the rule above spells out.
    // And to 42 / 646 on 2026-09-19 for L181 ("Run It Through the Word",
    // DR-0532) — Darrell's spoken teaching from his wife's choir rehearsal,
    // another real lesson into the existing Living Lessons course, so again
    // only the lesson total moves.
    // And to 42 / 653 on 2026-09-19 when the concurrent branch merged again:
    // main's own L185 (Knowledge Was Never the Savior) landed first, so our
    // L185-L187 each moved up one per DR-0052 and one more real lesson joined
    // the existing Living Lessons course -- again only the lesson total moves.
    // And to 42 / 652 on 2026-09-19 for L187 (“The Acceptable Year and the Whole
    // Counsel”, DR-0541) — Darrell’s two shouts over the Tony Evans interview,
    // another real lesson into the existing Living Lessons course —
    // And to 42 / 651 on 2026-09-19 for L186 ("The Unreasonable Standard", DR-0539) —
    // and to 42 / 650 the same day for L185 ("Glory to Glory", DR-0537) —
    // and to 42 / 649 the same day when the concurrent branch merged: main's own
    // L180 (He Giveth Thee Power to Get Wealth) joined L181-L183 and L184
    // (He Sings, renumbered from 180 per DR-0052) —
    // and to 42 / 647 the same day for L182 ("Two Witnesses", DR-0533) —
    // built from a debate Darrell sent; again a real lesson into the existing
    // Living Lessons course, so only the lesson total moves.
    // And to 42 / 650 on 2026-09-19 for L185 ("Knowledge Was Never the Savior")
    // -- Darrell's spoken teaching on gnosticism plus his own question about
    // the jealousy of Yahweh, a real lesson into the existing Living Lessons
    // course, so the course count holds at 42 and only the lesson total moves.
    // And to 42 / 654 on 2026-09-19 for L189 (“Follow the Leader — the
    // Shepherd of Our Souls”, DR-0546) — Darrell spoke this one in pieces
    // across an evening and then named it himself; again a real lesson into
    // the existing Living Lessons course, so the course count holds at 42 and
    // only the lesson total moves.
    // And to 43 / 662 on 2026-09-19 when the STOCK MARKET department opened
    // (Darrell: "Stock Market courses to explore and explain the world of
    // stock and bonds and countries that trade and how investment works world
    // wide."). Its first course, stocks, is 8 lessons and is the first course
    // to add a whole DEPARTMENT rather than a shelf, so both numbers move —
    // 42 to 43 and 654 to 662. DR-0548.
    // And to 44 / 670 on 2026-09-20 for the Stock Market department's SECOND
    // course, bonds (8 lessons, DR-0549) — the department stops being a shelf
    // with a grand name and becomes a department with more than one course in
    // it, which its own test now pins.
    // And to 45 / 678 on 2026-09-20 for the department's THIRD course, world-market
    // (8 lessons, DR-0553) — the "countries that trade" half of the sentence
    // the first two courses did not answer, since each of them was about an
    // instrument held by a person rather than the system it sits inside.
    // And to 46 / 686 on 2026-09-20 for the department's FOURTH and final
    // course, investing (8 lessons, DR-0554) — which completes the four
    // Darrell named in one sentence, and is the only one of them about a
    // DECISION rather than a piece of machinery.
    // And to 46 / 687 on 2026-09-22 for World Issues issue 17 (biology walks
    // back the selfish gene) — an issue added to an existing track, so the
    // course count does not move and only the lesson total does.
    // And to 47 / 695 on 2026-09-23 when the HISTORY department opened
    // (Darrell: "We need history to reflect actual history... Build the
    // History department"). Its first course, history-truth, is 8 lessons and
    // is a whole new DEPARTMENT, so both numbers move — 46 to 47 and 687 to
    // 695. DR-0572.
    // And to 47 / 696 on 2026-09-23 for L190 ("Were the Parables Real? — the
    // One Who Made the Ages Told Them") — Darrell's question, answered from
    // the Word only; a real lesson into the existing Living Lessons course,
    // so the course count holds at 47 and only the lesson total moves.
    // And to 48 / 704 on 2026-09-23 for the HISTORY department's second
    // course, historical-research-1619 (8 lessons, DR-0590) — the craft of
    // research taught Word-first on one case, so both numbers move.
    // And to 49 / 712 on 2026-09-23 for the BUSINESS department's second
    // course, business-research-wars (8 lessons, DR-0594) — Darrell: "use the
    // podcast business wars as context for our business courses... Word first
    // research 1 institution level" — so both numbers move.
    // And to 49 / 713 on 2026-09-24 for the ninth lesson of business-research-wars
    // (br9-follow-the-oil, DR-0602) — Darrell: "Tie all the money tied to oil and
    // how that impacts the economy worldwide" — a lesson into an existing course,
    // so the course count holds at 49 and only the lesson total moves.
    expect(courses).toHaveLength(49);
    expect(courses.reduce((t, c) => t + courseLessonCount(c), 0)).toBe(713);
    const depts = learnDepartments(courses);
    expect(depts.reduce((t, d) => t + d.lessons, 0)).toBe(713);
  });

  it('and the totals move ONLY for a real course — a cross-listing adds nothing', () => {
    // Proven rather than asserted: sum the department shelves WITH every
    // cross-listing in force, and it must equal the plain catalog total. This
    // is the property the pin above is protecting, measured directly, so the
    // protection survives any future re-pinning.
    const catalogLessons = courses.reduce((t, c) => t + courseLessonCount(c), 0);
    const shelfLessons = learnDepartments(courses).reduce((t, d) => t + d.lessons, 0);
    expect(shelfLessons, 'a cross-listing has duplicated a lesson into the totals').toBe(catalogLessons);
    expect(CROSS_LISTINGS.length, 'there should be cross-listings in force for this to mean anything').toBeGreaterThan(0);
  });

  it('every declared department is a real department of the catalog', () => {
    const labels = new Set(learnDepartments(courses).map((d) => d.label));
    for (const d of crossListedDepartments()) expect(labels.has(d)).toBe(true);
  });

  it('declares no lesson twice', () => {
    const keys = CROSS_LISTINGS.map((c) => `${c.department}::${c.courseKey}::${c.lessonId}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('every declaration carries its reason', () => {
    for (const c of CROSS_LISTINGS) {
      expect(c.why, `${c.lessonId} has no stated reason`).toBeTruthy();
      expect(c.why.length).toBeGreaterThan(20);
    }
  });
});

describe('the shelf answers a real question', () => {
  it('gathers more A.I. lessons than the department teaches in one course', () => {
    const rows = resolveCrossListed('A.I. The Way', index);
    expect(rows.length).toBeGreaterThanOrEqual(9);
  });

  it('is empty for a department that declares none, and never throws', () => {
    expect(crossListingsFor('Mathematics')).toEqual([]);
    expect(resolveCrossListed('Mathematics', index)).toEqual([]);
    expect(resolveCrossListed('', index)).toEqual([]);
    expect(resolveCrossListed(null, null)).toEqual([]);
  });

  it('every cross-listed lesson is reachable in its home course', () => {
    // The pointer must land: the home course is mounted and holds that lesson.
    const mounted = new Map(courses.map((c) => [c.key, c]));
    for (const c of CROSS_LISTINGS) {
      const home = mounted.get(c.courseKey);
      expect(home, `${c.courseKey} is not mounted`).toBeTruthy();
      expect(home.schedule.some((m) => m && m.id === c.lessonId),
        `${c.lessonId} is not in ${c.courseKey}`).toBe(true);
    }
  });

  it('the harness the render gate uses carries them too', () => {
    // buildCatalogCourseDescriptors is what the catalog render gate clicks
    // through; a cross-listed lesson must exist there as well, or the gate and
    // the shelf disagree about what is mounted.
    const harness = buildLessonIndex(buildCatalogCourseDescriptors().map((c) => ({ ...c, key: c.meta.key })));
    const ids = new Set(harness.map((r) => r.lessonId));
    for (const c of CROSS_LISTINGS) {
      if (c.courseKey === 'ai') continue; // component-wired; absent from this harness by design
      expect(ids.has(c.lessonId), `${c.lessonId} missing from the render harness`).toBe(true);
    }
  });
});

describe('the History shelf gathers what the curriculum already taught (DR-0575)', () => {
  // Darrell 2026-09-23, the evening the department opened: "History section
  // doesn't have any of the historical events we currently have... why not?!"
  // The department held its one course; the curriculum had been teaching dated
  // history for months in five other courses. Reproduced here as the shape of
  // the shelf: it must draw from OUTSIDE the department, from several courses,
  // and every row must be a real, mounted lesson with a measured reason.
  const rows = resolveCrossListed('History', index);

  it('gathers the historical events the curriculum already teaches — seventeen, measured', () => {
    expect(rows.length).toBeGreaterThanOrEqual(17);
    expect(rows).toHaveLength(crossListedCount('History'));
  });

  it('draws them from at least five courses in two other departments (the Word’s, and Stewardship)', () => {
    const from = [...new Set(rows.map((r) => r.courseKey))];
    expect(from.length).toBeGreaterThanOrEqual(5);
    expect(from).not.toContain('history-truth');
    const depts = [...new Set(from.map((k) => catalogCategory(k)))];
    expect(depts).not.toContain('History');
    expect(depts).toEqual(expect.arrayContaining(['The Word & The Way', 'Kingdom Life & Stewardship']));
  });

  it('the events he named are on the shelf: the porters, Greenwood, the 1965 Act, Evanston, the engineered barriers', () => {
    const ids = rows.map((r) => r.lessonId);
    expect(ids.some((id) => id.startsWith('ll135-'))).toBe(true);
    expect(ids).toContain('econ7-build-institutions');
    expect(ids).toContain('wi-tuition-and-the-1965-act');
    expect(ids).toContain('wi-evanston-reparations-and-equal-protection');
    expect(ids).toContain('econ5-the-real-barriers');
  });

  it('every reason states what was measured, so the shelf is data, not taste', () => {
    for (const c of crossListingsFor('History')) {
      expect(c.why, `${c.lessonId} does not say what was measured`).toMatch(/\(measured: /);
    }
  });

  it('the department line says how many more lessons it gathers', () => {
    const dept = learnDepartments(courses).find((d) => d.label === 'History');
    expect(dept).toBeTruthy();
    expect(crossListedCount(dept.label)).toBe(rows.length);
  });
});

describe('every course says SOMETHING about its shelves — the gap Darrell found', () => {
  // Darrell, 2026-09-19, opening the Business picker: "We need to review the
  // Ways we update our systems and don't when we have features added!!!!!!!!!
  // Why isn't Banking in this list already?!!!!!"
  //
  // It was not, because COURSE_CROSS_LISTINGS is hand-kept and Banking shipped
  // after the list was written. Measured that day: 22 of 36 mounted courses had
  // no entry at all. Five of them plainly belonged in Business and were added;
  // the rest declare that home is their only shelf. This gate is the half that
  // stops it recurring -- a course must be in ONE of the two lists, so the
  // decision happens when the course is added rather than being discovered in
  // a dropdown months later.
  it('no mounted course is silent about where it belongs', () => {
    const keys = LEARN_CATALOG.map((c) => c.key);
    expect(keys.length, 'no courses mounted — this check would prove nothing').toBeGreaterThan(30);
    expect(
      coursesWithNoShelfDeclaration(keys),
      'these courses mounted with no cross-listing and no home-only declaration — '
      + 'decide which shelf each belongs on rather than leaving it silent',
    ).toEqual([]);
  });

  it('PROVEN-TO-CATCH: an undeclared course is reported', () => {
    // The control. If a fabricated key does not come back, the check above is
    // passing for the wrong reason.
    expect(coursesWithNoShelfDeclaration(['a-course-nobody-declared'])).toEqual(['a-course-nobody-declared']);
  });

  it('a course is never in BOTH lists — home-only and cross-listed are exclusive', () => {
    const crossed = new Set(COURSE_CROSS_LISTINGS.map((c) => c.courseKey));
    const both = HOME_ONLY.filter((k) => crossed.has(k));
    expect(both, 'a course cannot be home-only and cross-listed at once').toEqual([]);
  });

  it('Banking specifically serves Business now, with a reason a reader can read', () => {
    const row = COURSE_CROSS_LISTINGS.find((c) => c.courseKey === 'banking' && c.department === 'Business');
    expect(row, 'Banking is still missing from Business').toBeTruthy();
    expect(row.why.length, 'a cross-listing must say WHY it serves that department').toBeGreaterThan(30);
  });
});
