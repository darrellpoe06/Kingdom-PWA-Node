// =============================================================================
// curriculum-diversity -- the living diversity MAP (DR-0215 §5)
// =============================================================================
// Darrell 2026-07-21: "make sure we are diversified in our curriculum/s" -- and
// the concrete worry, "not all long solemn deep-dives." DR-0215 §5 makes
// diversity a STANDING requirement across topic, format, AND tone, "documented
// as an ongoing map." This module IS that map, computed from the REAL modules
// (never a painted number -- Reality-Trace / DR-0076): it measures the actual
// spread so the mix can be SEEN, not asserted.
//
// Pure + deterministic (no Date/Math.random). Given the module array it returns
// a real reading of tone / topic / length / format, so a facilitator or Governor
// can watch the curriculum stay varied over time.
// =============================================================================

const wc = (s) => String(s || '').trim().split(/\s+/).filter(Boolean).length;
const SPOKEN_WPM = 140;

// Book of a "Book C:V" reference -> normalized key ("1 Corinthians" -> "1Corinthians").
function anchorBook(ref) {
  const m = String(ref || '').match(/^((?:\d\s?)?[A-Za-z]+)/);
  return m ? m[1].replace(/\s+/g, '') : null;
}

// A lesson's spoken teaching length in minutes, and the bucket it falls in.
export const LENGTH_BUCKETS = ['<10', '10-15', '15-20', '20-25', '>25'];
function lengthBucket(min) {
  if (min < 10) return '<10';
  if (min < 15) return '10-15';
  if (min < 20) return '15-20';
  if (min < 25) return '20-25';
  return '>25';
}

/**
 * Measure the real diversity of a curriculum.
 * @param modules  the lesson module array (each { anchor, lesson, stories, inApp, media, hardware, rpe, quiz })
 * @returns {
 *   lessonCount,
 *   tone:   { light, solemn, storyCount, balanced },   // balanced = neither register > 70% of stories
 *   kind:   { parable, testimony },
 *   topic:  { distinctBooks, top: [[book,count],...], concentration }, // concentration = top book's share
 *   length: { buckets: {'<10':n,...}, longestMinutes, allShort },
 *   format: { inApp, media, hardware, rpe, quiz, uniform }, // uniform = every lesson shares one interaction shape
 *   flags:  [ '...human-readable diversity notes...' ],
 * }
 */
export function measureDiversity(modules) {
  const mods = Array.isArray(modules) ? modules : [];
  const tone = { light: 0, solemn: 0 };
  const kind = { parable: 0, testimony: 0 };
  const books = {};
  const buckets = Object.fromEntries(LENGTH_BUCKETS.map((b) => [b, 0]));
  const format = { inApp: 0, media: 0, hardware: 0, rpe: 0, quiz: 0 };
  let storyCount = 0;
  let longestMinutes = 0;

  for (const m of mods) {
    if (m.inApp) format.inApp++;
    if (Array.isArray(m.media) && m.media.length) format.media++;
    if (Array.isArray(m.hardware) && m.hardware.length) format.hardware++;
    if (m.rpe && (m.rpe.research || m.rpe.plan || m.rpe.execute)) format.rpe++;
    if (m.quiz && Array.isArray(m.quiz.questions) && m.quiz.questions.length) format.quiz++;

    for (const s of (Array.isArray(m.stories) ? m.stories : [])) {
      storyCount++;
      if (s.tone === 'light' || s.tone === 'solemn') tone[s.tone]++;
      if (s.kind === 'parable' || s.kind === 'testimony') kind[s.kind]++;
    }

    const min = wc(m.lesson) / SPOKEN_WPM;
    if (min > longestMinutes) longestMinutes = min;
    buckets[lengthBucket(min)]++;

    const b = anchorBook(m.anchor && m.anchor.ref);
    if (b) books[b] = (books[b] || 0) + 1;
  }

  const bookArr = Object.entries(books).sort((a, b) => b[1] - a[1]);
  const distinctBooks = bookArr.length;
  const topShare = mods.length ? (bookArr[0] ? bookArr[0][1] / mods.length : 0) : 0;

  const tonedStories = tone.light + tone.solemn;
  const dominantToneShare = tonedStories ? Math.max(tone.light, tone.solemn) / tonedStories : 0;
  const balanced = dominantToneShare <= 0.7;

  const shortCount = buckets['<10'] + buckets['10-15'];
  const allShort = mods.length > 0 && shortCount === mods.length;

  // "uniform" format = every lesson carries the SAME interaction shape (all in-app,
  // none with media/hardware/hands-on). By-design for a teaching series, but worth
  // seeing.
  const interactionShapes = [format.media, format.hardware, format.rpe].filter((n) => n > 0).length;
  const uniform = mods.length > 0 && format.inApp === mods.length && interactionShapes === 0;

  const flags = [];
  if (!balanced) {
    flags.push(`Tone skewed: ${Math.round(dominantToneShare * 100)}% of stories are one register (aim for a lighter/solemn mix).`);
  } else {
    flags.push(`Tone balanced: ${tone.light} light / ${tone.solemn} solemn.`);
  }
  if (topShare > 0.35) {
    flags.push(`Topic concentrated: ${Math.round(topShare * 100)}% of anchors are one book.`);
  } else {
    flags.push(`Topic spread across ${distinctBooks} books.`);
  }
  if (allShort) {
    flags.push('Every lesson is short; consider a deeper session for variety.');
  }
  if (uniform) {
    flags.push('Format uniform (all in-app teaching) — expected for a teaching series; add media/hands-on only where it truly serves.');
  }

  return {
    lessonCount: mods.length,
    tone: { ...tone, storyCount, balanced, dominantToneShare: +dominantToneShare.toFixed(3) },
    kind,
    topic: { distinctBooks, top: bookArr.slice(0, 8), concentration: +topShare.toFixed(3) },
    length: { buckets, longestMinutes: +longestMinutes.toFixed(1), allShort },
    format: { ...format, uniform },
    flags,
  };
}
