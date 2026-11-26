// =============================================================================
// learn-presentation/presentation — the doorway in front of a lesson, never
// the lesson (Learn redesign, Phase 2)
// =============================================================================
// A presentation record sits BESIDE a lesson, keyed by its existing id:
//   { lessonId, courseKey, originalTitleAtApproval, displayTitle,
//     thumbHeadline, promoDescription, visual:{prompt,alt}, image, status,
//     featured }
// Rules this module enforces in code:
//   • Nothing here writes to a lesson. Every function reads; the lesson rows
//     can be deep-frozen and every call still works (tested).
//   • The ORIGINAL title is always the lesson's own `title`, read live. The
//     record's copy (`originalTitleAtApproval`) is only a drift check: if the
//     author retitles a lesson after a display title was approved, the record
//     is STALE and the lesson shows its original title until re-reviewed.
//   • A lesson with no usable record presents as it always has (its own
//     title). Missing presentation never hides a lesson.
//   • Popularity is never invented: there is no view, like or rating field,
//     and "Trending" is not offered without real engagement data.
// =============================================================================

import seed from './presentation-seed.json';
import { courseDepartment, departmentCode, lessonVersions } from '../learn-organize.js';
import { placeReached } from '../learn-resume.js';
import { closestToFinished } from '../lesson-progress.js';
import { lessonDuration, spokenMinutes, formatDuration } from '../course-duration.js';

/**
 * The flag: an explicit ?learnStudio=1/0 always wins and is remembered,
 * on any device, forever (web or native). With no explicit choice ever
 * made, `defaultOn` decides -- ChurchLearn passes the SAME isGovernor
 * signal that already gates every other owner-only panel in this file,
 * so the owner sees the preview on first open with no URL at all (the
 * native app shell has no address bar to type one into), while every
 * other member defaults off until the owner explicitly turns it on.
 */
export const STUDIO_FLAG_KEY = 'poe-learn-studio';
export function isLearnStudioOn({ search = null, storage = null, defaultOn = false } = {}) {
  let store = storage;
  try {
    if (!store && typeof window !== 'undefined') store = window.localStorage;
  } catch {
    store = null;
  }
  try {
    const q = search != null ? search : typeof window !== 'undefined' && window.location ? window.location.search : '';
    const v = new URLSearchParams(q || '').get('learnStudio');
    if (v === '1' || v === '0') {
      try {
        store && store.setItem(STUDIO_FLAG_KEY, v);
      } catch {
        /* no storage */
      }
      return v === '1';
    }
  } catch {
    /* no URL */
  }
  try {
    const remembered = store && store.getItem(STUDIO_FLAG_KEY);
    if (remembered === '1' || remembered === '0') return remembered === '1';
  } catch {
    /* no storage */
  }
  return defaultOn;
}

/** Statuses a learner may see. Draft and review stay in the admin dashboard. */
export const VISIBLE_STATUSES = Object.freeze(['approved', 'published']);

export function presentationIndex(records = seed.records) {
  const map = new Map();
  for (const r of Array.isArray(records) ? records : []) if (r && r.lessonId) map.set(r.lessonId, r);
  return map;
}

/**
 * How one lesson is presented. `preview` lets the prototype (and the admin
 * review screen) show records still in review; a learner build passes false.
 */
export function presentLesson(lesson, course, index, { preview = false, lite = false } = {}) {
  if (!lesson || !lesson.id) return null;
  const original = typeof lesson.title === 'string' ? lesson.title : '';
  const rec = index && index.get(lesson.id);
  const visible = !!rec && (preview || VISIBLE_STATUSES.includes(rec.status));
  const stale = !!rec && rec.originalTitleAtApproval !== original;
  const usable = visible && !stale && typeof rec.displayTitle === 'string' && rec.displayTitle.trim();
  const courseKey = (course && (course.key || (course.meta && course.meta.key))) || null;
  return {
    lessonId: lesson.id,
    courseKey,
    courseTitle: (course && course.meta && course.meta.title) || courseKey || '',
    department: course ? courseDepartment(course) : '',
    originalTitle: original,
    displayTitle: usable ? rec.displayTitle : original,
    thumbHeadline: usable ? rec.thumbHeadline || '' : '',
    promoDescription: usable ? rec.promoDescription || '' : '',
    image: usable && rec.image && rec.image.src ? rec.image : null,
    imageAlt: usable && rec.visual ? rec.visual.alt || '' : '',
    hasPresentation: !!usable,
    stale,
    status: rec ? rec.status : null,
    featured: !!(usable && rec.featured),
    featuredOrder: usable && rec.featured ? Number(rec.featuredOrder) || 99 : null,
    code: course ? `${departmentCode(courseDepartment(course))}${lessonNumber(lesson, course) ?? ''}` : '',
    number: lessonNumber(lesson, course),
    // `lite` skips the costly reads (spoken length, age-version measurement) for
    // lessons that are only counted or filtered, never drawn: measured 2026-11-24
    // at ~600ms per home render / per search keystroke over 994 lessons without it.
    duration: lite ? null : measured(lesson, 'duration', listenDuration),
    versions: lite ? [] : measured(lesson, 'versions', lessonVersions),
    hasVideo: lite ? false : measured(lesson, 'hasVideo', hasRealVideo),
  };
}

/**
 * A catalog SNAPSHOT (catalogSnapshot below) carries the three measurements the
 * doorway draws, taken by these same functions on the real lesson; a live lesson
 * is measured live. Same numbers either way, never invented.
 */
function measured(lesson, key, measure) {
  const m = lesson && lesson.presentedMeasure;
  return m && Object.prototype.hasOwnProperty.call(m, key) ? m[key] : measure(lesson);
}

/**
 * The catalog as the doorway needs it: every course and lesson id, title and date,
 * with the measurements pre-taken, and no lesson text (a 994-lesson catalog is ~40 MB
 * of text; this is what a page that only SHOWS the doorway has to carry).
 */
export function catalogSnapshot(courses) {
  return (Array.isArray(courses) ? courses : []).map((c) => ({
    key: c.key,
    meta: c.meta,
    schedule: (c.schedule || []).map((l) => ({
      id: l.id,
      title: l.title,
      ...(typeof l.added === 'string' ? { added: l.added } : {}),
      presentedMeasure: { duration: listenDuration(l), versions: lessonVersions(l), hasVideo: hasRealVideo(l) },
    })),
  }));
}

/** Upgrade a lite row to the full presentation (only for what is drawn). */
const full = (x, index, preview) => ({ ...x, p: presentLesson(x.lesson, x.course, index, { preview }) });

/** The lesson number a reader knows: the number in its id (ll338 → 338), else its place in the course. */
export function lessonNumber(lesson, course) {
  const m = /^[a-z]+(\d+)-/i.exec(String((lesson && lesson.id) || ''));
  if (m) return Number(m[1]);
  const list = (course && course.schedule) || [];
  const i = list.findIndex((x) => x && x.id === lesson.id);
  return i >= 0 ? i + 1 : null;
}

/** Spoken length at 1×, from the words the reader actually hears. Null when unknown. */
export function listenDuration(lesson) {
  try {
    const words = lessonDuration(lesson).spokenWords;
    return words > 0 ? formatDuration(spokenMinutes(words, 1)) : null;
  } catch {
    return null;
  }
}

/** A lesson is labeled as video only when it carries a playable video source. */
export function hasRealVideo(lesson) {
  const media = Array.isArray(lesson && lesson.media) ? lesson.media : [];
  return media.some((m) => m && /^(video|youtube)$/i.test(String(m.type || '')) && (m.src || m.url || m.youtubeId));
}

/** Every mounted lesson with its course, in authored order. */
export function allLessons(courses) {
  const out = [];
  for (const c of Array.isArray(courses) ? courses : []) for (const l of c.schedule || []) if (l && l.id) out.push({ lesson: l, course: c });
  return out;
}

/**
 * Find and present ONE lesson anywhere in the full catalog, by id -- not only
 * among a home screen's curated picks (discover/featured/shelves), which a
 * link or an "open lesson X" request must not be limited to. Returns the same
 * { lesson, course, p } shape studioHome's lists use, or null.
 */
export function findPresentedLesson(courses, index, lessonId, { preview = false } = {}) {
  if (!lessonId) return null;
  const hit = allLessons(courses).find((x) => x.lesson.id === lessonId);
  if (!hit) return null;
  const p = presentLesson(hit.lesson, hit.course, index, { preview });
  if (!p) return null;
  return { ...hit, p };
}

// Discovery shelves group DEPARTMENTS; they never reorganize courses (spec §7).
// A department not listed here still appears in Explore by Topic.
export const SHELVES = Object.freeze([
  { id: 'faith', label: 'Grow Your Faith', departments: ['Living Lessons', 'The Word & The Way', 'The Eternal Algorithms'] },
  { id: 'wealth', label: 'Finance & Wealth', departments: ['Stock Market', 'Kingdom Life & Stewardship'] },
  { id: 'real-estate', label: 'Real Estate', departments: ['Real Estate'] },
  { id: 'business', label: 'Business & Leadership', departments: ['Business', 'Project Management'] },
  { id: 'tech', label: 'A.I. & Technology', departments: ['A.I. The Way', 'Development', 'Serve the House'] },
  { id: 'discover', label: 'History & Mathematics', departments: ['History', 'Mathematics'] },
]);

/**
 * RELATIONSHIPS, IN ONE PLACE (Darrell 2026-11-26: "We need the relationships lessons in one
 * place... my wife says ladies will want those most"), SORTED BY ITS DEFINITION (DR-1694).
 * Relationships here means relating in every direction, to Yahweh, within yourself, and to
 * every person, measured by the fruit of the Spirit:
 * docs/00-foundations/_root/RELATIONSHIPS-RELATING-IN-EVERY-DIRECTION.md. Every one of the
 * 996 mounted lessons was read against that standard; each id below appears, with its reason,
 * in docs/99-session-notes/2026-11-26-relationships-shelf-audit.md, and
 * relationships-shelf-audit.test.js fails the build if the two ever disagree. The lessons the
 * definition was written for come first, then six groups in reading order.
 */
export const RELATIONSHIP_LESSONS = Object.freeze([
  // The lessons this definition was written for (L344, L345).
  'll344-how-relating-works-every-direction-measured-by-the-fruit-of',
  'll345-the-mirror-your-relationship-with-everything-you-touch',
  // With Yahweh (93).
  'ea-gh-inside-love',
  'll74-church-hurt-the-counterfeit-comfort-and-the-blood',
  'll14-ten-healed-one-whole',
  'll17-taste-and-see',
  'll26-how-the-king-knows-his-kings',
  'll27-the-god-who-documents-his-grief',
  'll30-the-whole-story-yahweh-and-humanity',
  'll38-become-the-message-tactics-to-essence',
  'll54-the-same-word-different-soil-the-parable-of-the-sower',
  'll56-the-person-of-the-holy-spirit-seek-the-deliverer-not-deliverance',
  'll58-the-wind-you-can-hear-perceiving-the-holy-spirit',
  'll68-out-of-the-way-consecration-and-the-broken-bread',
  'll72-the-berean-foundation',
  'll85-the-kings-code-sheep-hear-goats-of-the-world-lost',
  'll87-two-ways-two-wisdoms-how-the-word-makes-whole',
  'll88-four-soils-heart-conditions-and-the-kings-eternal-program',
  'll92-yahweh-standardized-love-obedience-deeds-thoughts-and-the-temple-kingdom',
  'll93-come-let-us-reason-truth-in-any-language-the-mind-rewired-real',
  'll96-doers-of-the-word-competence-by-doing-and-the-minds-tactics-daily',
  'll104-study-your-ways-how-yahweh-weighs-love-the-deterministic-standard-two-ways-and-the-word',
  'll105-doing-the-word-rewires-you-daily-intake-the-deep-heart-and-experiential-over-theoretical',
  'll107-what-the-word-gives-love-truth-light-knowledge-and-how-we-receive-it-vs-the-enemy',
  'll109-how-we-know-yahwehs-love-taste-see-hear-touch-experienced-at-every-age',
  'll116-the-thirty-day-experiment-action-produces-information-and-the-grace-that-met-a-pretender',
  'll129-you-have-a-destiny-the-giver-the-window-covenant-authority-the-heart-of-flesh-and-the-me-that-has-to-die',
  'll138-exercised-senses-why-perception-is-grown-not-withheld-the-tests-that-train-the-eye-and-what-comes-after-your-ways-align-with-the-word',
  'll146-he-said-it-first-what-it-sounds-like-when-yahweh-tells-you-how-he-feels',
  'll159-we-are-all-children-of-yahweh-no-matter-how-old-for-ever-children-to-him',
  'll161-one-source-of-truth-his-voice-in-his-word-be-still-be-engrafted-build-each-other',
  'll174-the-levels-of-disrespect-and-the-gap-between-what-he-means-and-what-we-say',
  'll176-faith-is-the-substance-and-the-evidence-and-he-made-me-then-died-for-me',
  'll181-run-it-through-the-word-the-two-minds-and-the-song-she-could-not-sing',
  'll184-he-sings-yahweh-over-you-jesus-in-the-midst-of-you',
  'll189-follow-the-leader-the-shepherd-of-our-souls',
  'll216-a-life-full-of-everything-yahweh-is-always-good-consistency-is-the-key-and-his-will-is-that-you-prosper-as-your-soul-prospers',
  'll218-do-not-switch-up-on-his-way-yahwehs-principles-documented-no-offense-taken-and-letting-him-win-so-we-win',
  'll219-prudence-and-leaning-not-on-our-own-understanding-his-knowledge-is-the-highest-authority-in-every-dimension',
  'll227-read-the-word-for-the-spirit-do-the-word-for-the-skill-not-to-say-i-got-you-but-to-become-better-his-way-and-then-do-his-way',
  'll229-the-word-is-spirit-and-life-what-it-means-in-his-own-words',
  'll246-doing-the-word-comes-first-and-our-live-situations-are-bread',
  'll248-his-ways-are-higher-so-he-gives-the-bread',
  'll249-nothing-of-myself-the-way-is-the-word-and-it-works-every-time',
  'll250-they-which-do-hunger-shall-be-filled-and-the-critical-path',
  'll252-this-life-is-the-curriculum-made-to-be-his-temple',
  'll258-he-gave-us-everything-we-need-until-we-want-what-he-wants',
  'll299-read-with-the-heart',
  'll311-every-man-presseth-into-it',
  'll325-god-is-able',
  'll329-what-mean-these-stones',
  'll333-heavenly-cheat-codes-life-his-way',
  'll336-the-lie-the-fear-and-the-last-adam',
  'mit5-those-who-know-their-god',
  'mit15-hide-the-word-in-your-heart',
  'fin8-he-frankly-forgave-them-both',
  'ea-gh-choose-life',
  'ea-gh-obedience-blessing',
  'ea-gh-humble-heal',
  'ea-gh-taste-and-see',
  'ea-gh-trust-paths',
  'ea-gh-blessed-tree',
  'ea-gh-delight-desires',
  'ea-gh-wait-renew',
  'ea-gh-secret-place',
  'ea-gh-give-heart',
  'ea-gh-searched-and-known',
  'ea-gh-own-your-faith',
  'ea-gh-furnace',
  'ea-gh-potter-shepherd',
  'ea-gh-return-return',
  'ea-gh-seek-first',
  'ea-gh-ask-seek-knock',
  'ea-gh-rock-house',
  'ea-gh-abide-fruit',
  'ea-gh-stand-on-word',
  'ea-gh-sheep-voice',
  'ea-gh-closet',
  'ea-gh-no-guile-figtree',
  'ea-gh-not-my-will-but-thine',
  'ea-gh-see-father-in-son',
  'ea-gh-he-already-knew',
  'ea-gh-without-me-nothing',
  'ea-gh-spirit-bears-witness-with',
  'ea-gh-resist-flee',
  'ea-gh-more-than-conquerors',
  'ea-gh-confess-cleanse',
  'ea-gh-handling-word-deceitfully',
  'ea-gh-friendship-world-enmity',
  'ea-gh-jesus-i-know-who-are-ye',
  'ea-gh-presence-is-the-liberty',
  'ea-gh-submit-then-resist',
  'ea-gh-keep-yourself-by-the-word',
  'ea-gh-door-sup',
  'ea-gh-word-of-testimony',
  // Within yourself and your emotions (120).
  'll115-meek-and-quiet-strength-the-ornament-of-great-price-and-why-jael-is-not-the-blueprint',
  'wk4-ai-for-school',
  'wk7-guard-heart-time',
  'sov74-with-all-thy-getting-get-understanding',
  'll1-the-perfect-yahweh-expects',
  'll2-the-energy-you-were-given',
  'll5-take-no-thought-for-tomorrow',
  'll6-think-on-these-things',
  'll7-let-peace-be-the-umpire',
  'll9-the-lord-looks-on-the-heart',
  'll10-strength-and-honour-are-her-clothing',
  'll11-fearfully-and-wonderfully-made',
  'll13-a-sound-mind',
  'll18-the-flinch-comes-first',
  'll25-the-threshold-and-the-two-patterns',
  'll36-fruit-root-and-the-empty-house',
  'll43-the-war-is-for-the-mind',
  'll47-navigating-the-age-faith-critical-thinking-identity',
  'll49-mastery-without-manipulation-lifes-task-envy-sober-mind',
  'll50-the-mind-of-christ-thinking-yahwehs-thoughts-proven-in-works',
  'll52-how-a-lie-gets-wired-in-neuroplasticity-memory-and-the-mind-of-christ',
  'll53-the-emotional-cycles-of-brain-and-body-stewarding-feeling-by-the-renewed-mind',
  'll62-the-age-of-counterfeits-meekness-over-manipulation',
  'll64-as-thy-soul-prospereth-spirit-soul-and-the-will',
  'll77-the-king-over-the-children-of-pride',
  'll78-the-snare-of-the-fear-of-man',
  'll80-the-four-warnings-of-a-hardening-heart',
  'll83-keep-thy-heart-the-conditions-of-growth',
  'll102-bold-as-a-lion-boldness-from-righteousness-not-bravado-no-fear',
  'll113-the-spirit-is-willing-but-the-flesh-is-weak-telling-them-apart-ruling-your-spirit-and-yahwehs-long-work',
  'll119-abstention-if-i-am-an-option-do-not-pick-me-and-the-choosing-settled-before-there-was-a-list',
  'll124-equipped-to-win-the-hour-you-are-losing-the-word-again-and-the-man-who-did-not-want-the-job',
  'll126-feelings-are-fruit-not-root-belief-the-renewed-mind-and-declarations-bounded-by-his-word',
  'll128-the-prudent-man-studies-systematic-analysis-the-ways-that-protect-and-seeing-him-while-blind',
  'll131-joy-is-not-happiness-three-days-one-strength-and-the-word-as-the-code-that-runs-each-of-them',
  'll152-crying-because-of-all-the-dying-slow-and-vicious-but-yahweh',
  'll156-teach-yourself-anything-qualitative-and-quantitative-analysis-loving-yahweh-while-you-do-it',
  'll160-pride-is-not-worth-him-and-is-ego-pride-or-something-else',
  'll162-do-not-take-a-death-so-personal-that-you-undermine-your-way-home-let-him-be-him',
  'll165-i-always-had-love-gratitude-measured-against-a-real-lack-and-suffering-with-him-before-reigning-with-him',
  'll166-life-is-disrespectful-so-think-on-these-things-self-against-the-servant-king-and-the-one-who-bought-you-twice',
  'll171-trend-it-against-the-shoreline-points-setpoints-and-the-trends-of-our-lives',
  'll172-the-spirit-of-your-mind-dust-breath-and-the-one-who-inhabits-eternity',
  'll173-humility-is-the-strength-no-shame-and-feelings-that-arrive-late',
  'll177-two-minds-and-the-one-you-feed-is-the-one-that-runs-you',
  'll179-heartfelt-the-heart-is-the-deep-mind-and-what-heartfelt-actually-claims',
  'll187-the-unreasonable-standard-and-the-honest-error-log',
  'll193-what-it-costs-to-keep-your-soul-the-morsel-the-son-the-snare-and-the-finished-work',
  'll197-think-soberly-overlooked-promoted-by-him-and-the-hands-that-build-the-house',
  'll198-the-goldilocks-zone-of-curiosity-what-he-hides-the-gap-he-shows-and-the-question-that-matters',
  'll206-kings-who-search-it-out-the-word-sets-the-mind-for-eternal-growth-the-joy-of-the-lord-is-strength-the-godhead-all-agree',
  'll209-the-step-and-the-wait-the-work-of-your-hands-yahweh-promotes-and-the-wait-is-his',
  'll217-the-holy-spirit-brings-a-sound-mind-not-confusion-his-clarity-the-eyes-of-the-heart-and-the-word-as-the-only-source',
  'll220-every-thought-captured-and-tested-his-word-written-inside-and-read-daily-for-the-gaps',
  'll224-accountability-every-soul-answers-to-yahweh-man-woman-and-child-at-every-level',
  'll226-the-mind-of-christ-is-our-identity-sound-minds-the-whole-armour-and-the-kingdom-ways-every-nation-is-going-into',
  'll237-his-knowledge-is-the-highest-and-the-standard',
  'll242-shyness-can-be-pride-the-omitted-term-and-the-hidden-talent',
  'll247-your-ways-show-your-god-know-yourself-in-number-and-in-kind',
  'll254-laziness-is-a-character-matter-the-four-domains-and-the-five-marks-of-the-sluggard',
  'll271-let-yahweh-defend-me',
  'll272-study-to-know-his-thoughts',
  'll276-integrity-is-the-only-thing-that-makes-you-rich',
  'll279-soul-searching',
  'll292-the-word-is-our-mirror',
  'll293-one-thing-is-needful',
  'll297-precept-upon-precept',
  'll298-what-programs-you',
  'll305-search-me-and-know-my-heart',
  'll307-love-walks-with-you-on-the-training-ground',
  'll330-he-healeth-the-broken-in-heart',
  'll332-give-me-this-mountain',
  'll334-this-i-recall-to-my-mind',
  'mit1-the-design-in-time',
  'mit3-how-the-enemy-imports-strategy',
  'mit4-the-renewed-mind',
  'mit6-effort-attention-and-rest',
  'mit7-systems-over-willpower',
  'mit8-deep-over-busy',
  'mit9-power-into-knowledge',
  'mit10-wired-to-survive',
  'mit11-the-attention-war',
  'mit12-predictive-brain-body-budget',
  'mit13-the-reward-is-in-the-race',
  'mit14-the-mind-is-a-servant-not-a-god',
  'mit16-doers-not-hearers-only',
  'mit17-beholding-him-the-mind-rewired',
  'mit18-think-about-your-thinking',
  'hl-w3-setback-neuroscience',
  'hl-w3-fasting-as-discipline',
  'hl-w3-sleep-memory',
  'hl-w3-learning-mastery',
  'pm18-what-is-that-in-thine-hand',
  'spm9-the-retrospective-that-is-not-a-blame-meeting',
  'wi-victorious-emotions',
  'ea-gh-joy-untakeable',
  'ea-gh-joy-three-days',
  'ea-gh-made-in-his-image',
  'ea-gh-shapen-iniquity',
  'ea-gh-meek-inherit',
  'ea-gh-pride-fall',
  'ea-gh-honour-kings',
  'ea-gh-mind-of-christ-in-the-hidden-part',
  'ea-gh-known-before-formed',
  'ea-gh-word-written-on-the-heart',
  'ea-gh-enemy-injects-thoughts',
  'ea-gh-thief-targets-identity',
  'ea-gh-pray-for-protection',
  'ea-gh-whole-spirit-soul-body',
  'ea-gh-die-daily',
  'ea-gh-renew-mind',
  'ea-gh-higher-priority',
  'ea-gh-good-fight-exercise',
  'ea-gh-humble-exalt',
  'ea-gh-tested-soul',
  'ea-gh-testing-not-temptation',
  'ea-gh-all-things-work-together',
  'ea-gh-fruit-no-law',
  'ea-gh-not-bondage-again',
  'ea-gh-conviction-vs-condemnation',
  // Marriage (8).
  'll230-competence-before-submission-the-study-skills-and-doing-skills-of-a-wife-and-a-husband-with-the-word-answering-first',
  'll231-does-yahweh-rank-a-wife-over-a-woman-covenant-the-proverbs-31-woman-and-the-order-with-the-word-answering-first',
  'll122-does-she-feel-like-your-favorite-person-preferring-one-another-and-the-first-works',
  'll114-what-makes-having-you-better-covenant-not-contract-and-the-value-a-paycheck-cannot-cover',
  'll121-know-your-own-post-her-provision-her-guard-and-the-beam-in-the-pointing-eye',
  'll123-would-you-sign-that-contract-the-answer-the-qualification-and-the-manner-that-forfeited-it',
  'll319-what-the-trust-could-not-keep',
  'll183-realign-my-eyes-your-type-was-trained',
  // Family and children (22).
  'll46-ye-fathers-provoke-to-good-works',
  'ea-gh-house-serve',
  'ea-gh-train-child',
  'll282-the-greater-work',
  'll294-a-prophet-in-his-own-house',
  'ea-gh-break-generational',
  'll154-why-do-we-have-to-pay-for-our-fathers-sins-we-dont-and-it-needs-what-we-do-here',
  'ea-gh-father-fatherless',
  'legacy6-hand-it-forward',
  'll117-no-two-children-grow-up-in-the-same-house-why-siblings-differ-and-the-one-parent-who-is-the-same',
  'll313-children-are-a-heritage-when-the-school-closes-the-house',
  'll100-guard-the-little-ones-children-the-millstone-and-mastery-over-the-tools',
  'll205-talk-about-it-together-parents-children-friends-until-we-see-yahweh-has-been-right',
  'll120-it-is-written-keep-the-policy-in-your-pocket-advocacy-from-the-written-word-and-a-just-weight',
  'll273-they-called-long-life-a-problem',
  'll295-the-bleating-of-the-sheep',
  'll301-old-men-dream-young-men-see',
  'succ1-mission-not-map',
  'succ3-new-builder-new-work',
  'succ4-cross-what-we-could-not',
  'succ5-double-portion-hand-it-forward',
  'legacy5-heir-under-governors',
  // Friendship, church and neighbour (39).
  'll157-what-is-love-in-depth-and-in-range-action-based-word-first',
  'll167-be-a-g-about-it-execute-the-fourteen-love-verbs-high-or-low-because-it-is-not-about-how-you-feel',
  'll175-true-love-starts-with-an-act-and-a-sound-mind-and-feelings-come-after-the-test',
  'll82-love-fulfils-the-law-wake-up-and-get-dressed',
  'll15-seasoned-with-salt',
  'wk5-ai-that-serves',
  'll3-bodybuilding-christ',
  'll4-dying-to-live',
  'll12-if-one-member-suffers',
  'll21-hidden-vs-known',
  'll32-salt-light-and-anchor-the-church-in-the-city',
  'll42-keep-the-adversary-out-of-the-music',
  'll44-safe-to-speak-psychological-safety',
  'll45-give-honour-where-it-is-due-recognition-and-equity',
  'll51-the-mind-of-christ-situationally-how-scripture-addresses-each-person',
  'll149-cultural-competency-the-same-word-in-three-mouths-and-the-man-nobody-believed',
  'll253-benefiters-or-underminers-of-the-eternal-kingdom',
  'll256-the-lords-release-is-for-a-neighbor-loving-a-mixed-multitude-the-way-he-means',
  'll284-credit-where-credit-is-due',
  'll296-willing-and-obedient',
  'll302-a-standard-for-every-age',
  'll315-of-one-blood',
  'rto6-customer-service-white-glove-in-someones-home',
  'pm15-sat-where-they-sat-the-oldest-forward-deployed-pattern',
  'lease1-ye-know-the-heart-of-a-stranger',
  'lease2-the-gold-ring-and-the-vile-raiment',
  'lease3-hear-it-before-you-answer-it',
  'evic7-jobs-own-oath',
  'ea-gh-told-before-he-came',
  'ea-gh-throne-established',
  'ea-gh-peace-peace',
  'ea-gh-measure-measured',
  'ea-gh-feed-sheep',
  'ea-gh-strengthen-your-brethren',
  'ea-gh-kenosis',
  'ea-gh-seated-heavenly',
  'ea-gh-assembling',
  'ea-gh-vacate-the-seat',
  'ea-gh-god-not-colorblind',
  // Conflict and forgiveness (19).
  'ea-gh-forgive-forgiven',
  'ea-gh-vengeance-his',
  'ea-gh-soft-answer',
  'll16-rule-your-spirit-repair-the-bond',
  'll291-fruits-meet-for-repentance',
  'll151-the-tongue-death-and-life-in-a-little-member-and-the-knowledge-that-governs-it',
  'ea-gh-truth-love',
  'll141-separate-and-connect-working-through-issues-studying-to-be-approved-tempted-versus-tried-and-how-we-handle-each-other-and-enemies',
  'll192-two-hours-became-six-the-pattern-the-yea-the-inspection-and-the-faithful-man',
  'll199-faith-in-good-faith-no-false-witness-the-real-question-and-the-word-that-answers',
  'll277-look-at-the-record',
  'll306-the-path-of-the-just-shineth',
  'lease7-go-and-tell-him-between-thee-and-him-alone',
  'lease8-as-much-as-lieth-in-you',
  'part5-let-there-be-no-strife-separate-thyself',
  'part6-the-contention-was-so-sharp',
  'tax7-restore-it-in-the-principal-and-add-the-fifth',
  'evic6-took-him-by-the-throat',
  'ea-gh-admit-wrong-to-grow',
]);

/** The Relationships shelf: each listed lesson from the mounted catalog, in the list's order. Pure. */
export function relationshipShelf(courses, index, { preview = false } = {}) {
  const at = new Map(allLessons(courses).map((x) => [x.lesson.id, x]));
  return RELATIONSHIP_LESSONS.map((id) => at.get(id))
    .filter(Boolean)
    .map((x) => full(x, index, preview))
    .filter((x) => x.p);
}

/** The Explore-by-Topic shelf a department belongs to (its approved cover art). */
export function shelfForDepartment(department) {
  const s = SHELVES.find((x) => x.departments.includes(department));
  return s ? s.id : null;
}

/**
 * The headline on a TEMPORARY cover (a lesson still waiting for its own picture):
 * the record's own headline when it has one; else the title's main clause when it
 * is short; else the course title; else the first four words. Never invented copy.
 */
export function interimHeadline(p) {
  if (!p) return '';
  if (p.thumbHeadline) return p.thumbHeadline;
  const words = (t) =>
    String(t || '')
      .trim()
      .split(/\s+/)
      .filter(Boolean);
  const main = words(String(p.displayTitle || p.originalTitle || '').split(/\s[—–-]\s|[:—–(]/)[0]);
  if (main.length && main.length <= 6) return main.join(' ');
  const course = words(p.courseTitle);
  if (course.length && course.length <= 5) return course.join(' ');
  return main.slice(0, 4).join(' ');
}

/** The home page, derived from the mounted catalog, the device's places and the record index. */
export function studioHome(courses, index, { places = [], allPlaces = null, progress = {}, preview = false } = {}) {
  const lessons = allLessons(courses).map(({ lesson, course }) => ({ lesson, course, p: presentLesson(lesson, course, index, { preview, lite: true }) }));
  const presented = lessons.filter((x) => x.p.hasPresentation).map((x) => full(x, index, preview));
  const byId = new Map(lessons.map((x) => [`${x.p.courseKey}::${x.p.lessonId}`, x]));
  const featuredAll = presented.filter((x) => x.p.featured).sort((a, b) => a.p.featuredOrder - b.p.featuredOrder);
  const featured = featuredAll[0] || null;
  const continueLearning = (Array.isArray(places) ? places : [])
    .map((pl) => {
      const x = byId.get(`${pl.courseKey}::${pl.lessonId}`);
      return x ? { ...full(x, index, preview), reached: placeReached(pl) } : null;
    })
    .filter(Boolean)
    .slice(0, 12);
  // CLOSEST TO FINISHED (DR-1684): every lesson begun and measured, short of
  // the end, furthest along first -- from every saved place, not only the
  // ones with a step to continue, so a lesson read in the Experience counts.
  const closest = closestToFinished(Array.isArray(allPlaces) ? allPlaces : places)
    .map(({ place, progress: pr }) => {
      const x = byId.get(`${place.courseKey}::${place.lessonId}`);
      return x ? { ...full(x, index, preview), reached: pr.fraction } : null;
    })
    .filter(Boolean)
    .slice(0, 12);
  const recentlyAdded = presented
    .filter((x) => typeof x.lesson.added === 'string')
    .sort((a, b) => (b.lesson.added > a.lesson.added ? 1 : b.lesson.added < a.lesson.added ? -1 : 0))
    .slice(0, 12);
  const shelves = SHELVES.map((s) => ({ ...s, items: presented.filter((x) => s.departments.includes(x.p.department)) })).filter((s) => s.items.length);
  const deptMap = new Map();
  for (const x of lessons) {
    const d = x.p.department;
    if (!deptMap.has(d)) deptMap.set(d, { label: d, courses: new Set(), lessons: 0 });
    const e = deptMap.get(d);
    e.courses.add(x.p.courseKey);
    e.lessons += 1;
  }
  const topics = [...deptMap.values()].map((d) => ({ label: d.label, courses: d.courses.size, lessons: d.lessons })).sort((a, b) => b.lessons - a.lessons);
  const completed = Object.keys(progress || {}).filter((k) => progress[k]).length;
  return {
    featured,
    featuredAll,
    continueLearning,
    closestToFinished: closest,
    // No engagement data is mounted in Learn, so no "Trending" row is offered
    // (spec §7: never fabricate popularity). This row is labeled for what it is.
    discover: presented.filter((x) => !x.p.featured).slice(0, 12),
    recentlyAdded,
    shelves,
    relationships: relationshipShelf(courses, index, { preview }),
    topics,
    totals: { lessons: lessons.length, presented: presented.length, completed },
  };
}

/** Lessons whose display title, headline, description or original title match. Original titles always match. */
export function searchPresented(courses, index, query, { preview = false } = {}) {
  const q = String(query || '')
    .trim()
    .toLowerCase();
  if (!q) return [];
  return allLessons(courses)
    .map(({ lesson, course }) => ({ lesson, course, p: presentLesson(lesson, course, index, { preview, lite: true }) }))
    .filter(({ p }) =>
      [p.originalTitle, p.displayTitle, p.thumbHeadline, p.promoDescription, p.courseTitle, p.department, p.number != null ? String(p.number) : ''].some((s) =>
        String(s || '')
          .toLowerCase()
          .includes(q)
      )
    )
    .slice(0, 200)
    .map((x) => full(x, index, preview));
}
