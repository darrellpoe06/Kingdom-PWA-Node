// =============================================================================
// collection-review -- every hand-picked lesson collection has a written rule, a
// measurement, and a judgment for every lesson the measurement flags (DR-1675)
// =============================================================================
// Darrell 2026-11-26: "Can we make sure to review and make better decisions on
// these types of sorts and collection of lessons?" Lessons carry no topic tags,
// so a collection (Relationships) is a list of lesson ids picked by reading. A
// list picked from memory came out at 19 lessons when the catalog held far more.
// So: a measurement over each lesson's FULL text flags every strong candidate,
// and a gate fails the build while any flagged lesson is unjudged -- it must be
// IN a section or OUT with its reason. A new lesson can never silently miss.
// =============================================================================

// Words that mean people in relationship with each other (not "child of God",
// "home" or "roles", which flagged money and data lessons in the first scan).
const RELATIONSHIP_WORDS =
  /\b(marriage|marriages|married|marry|husbands?|wives|wife|spouses?|parents?|parenting|siblings?|friends?|friendship|forgive|forgiven|forgiveness|forgiving|reconcile|reconciled|reconciliation|one another|each other|in-laws?|neighbou?rs?)\b/gi;

/** Relationship words per 1,000 words of the lesson's own text (title, big idea, lesson). 0 for a short lesson. */
export function relationshipDensity(lesson) {
  const t = [lesson && lesson.title, lesson && lesson.bigIdea, lesson && lesson.lesson].filter((x) => typeof x === 'string').join(' ');
  const words = (t.match(/\S+/g) || []).length;
  if (words < 300) return 0;
  return Math.round(((t.match(RELATIONSHIP_WORDS) || []).length / words) * 10000) / 10;
}

/** A lesson at or above this many relationship words per 1,000 must be judged (in a section, or out with a reason). */
export const RELATIONSHIP_FLAG = 6;

/**
 * Flagged lessons judged OUT of Relationships, each with its reason (read 2026-11-26). A lesson moves
 * IN by moving its id into RELATIONSHIP_GROUPS and out of here; the gate keeps the two apart.
 */
export const RELATIONSHIP_REVIEWED_OUT = Object.freeze({
  'ea-gh-rock-house': 'building on the words of Jesus (Matthew 7:24-27), a foundation lesson, not a relationship between people',
  'ea-gh-abide-fruit': 'abiding in Jesus (John 15:5, 7), the vine and the branches, not a relationship between people',
  'wk5-ai-that-serves':
    'an AI course lesson on using the tool to serve others; it mentions elders and grandparents, but teaches the tool, not the relationship',
  'ea-gh-confess-cleanse': 'forgiveness from Yahweh (1 John 1:9), not between people',
  'ea-gh-friendship-world-enmity': 'friendship with the world system, not with people',
  'rto7-covenant-over-contract': 'a business course: covenant with customers and documents',
  'bank4-the-signature-for-somebody-else': "money: surety for another person's debt",
  'sov75-safely-a-tool-and-not-a-friend': 'A.I. safety: a tool is not a friend',
  'lil7-adam-and-eve-made-loved-and-the-first-promise': "a children's creation and promise story",
  'tax7-restore-it-in-the-principal-and-add-the-fifth': 'taxes and records: restitution',
  'ea-gh-more-than-conquerors': 'doctrine: nothing separates us from His love',
  'll161-one-source-of-truth-his-voice-in-his-word-be-still-be-engrafted-build-each-other': 'mostly the Word as the one source of truth',
  'ea-gh-fruit-no-law': 'the fruit of the Spirit as character',
  'll306-the-path-of-the-just-shineth': 'endurance with the Word',
  'prop7-the-tenant-is-a-neighbour-and-the-wage-cannot-wait': 'a property course: tenants and wages',
  'legacy5-heir-under-governors': 'estate law: an heir under governors',
  'aib5-real-world-scenarios': 'A.I. legal course scenarios',
  'ea-gh-without-me-nothing': 'abiding in Him as the source',
  'car5-the-electric-car-came-early': 'history of invention',
  'll13-a-sound-mind': 'mental stewardship',
  'll234-will-we-have-angel-like-experiences-after-death-like-the-angels-in-some-ways-never-angels-and-like-him': 'the life to come',
  'ea-gh-name-that-saves': 'the Name of Jesus and salvation',
});
