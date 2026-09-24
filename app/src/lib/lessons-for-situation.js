// =============================================================================
// lessons-for-situation — the lessons already written from the Word, for what
// a person just said (DR-0630)
// =============================================================================
// Darrell 2026-09-24, looking at the Speak box with the Lesson chip chosen:
// "Would the lesson tab give users lessons for their own situations based on
// the Word first?" Before this, a member who spoke their situation was told
// "Heard as a lesson" and got nothing back: the reader Routine turns only
// Darrell's rows into new lessons (DR-0608, DR-0312).
//
// This answers with what ALREADY exists. It writes no doctrine and calls no
// model: it ranks the published, Word-first lessons (the Living Lessons, and
// every self-paced course lesson that carries a title, a summary and anchor
// verses) against the person's own words, and returns the best three with the
// reason each one matched.
//
// Two ways a lesson earns a place:
//   1. THE SITUATION VOCABULARY below. Each entry is a set of everyday phrases
//      ("fired", "lost my job", "laid off") joined to the lessons that were
//      READ and found to teach that situation. A lesson is listed under a
//      situation only when its own big idea and anchor say so; nothing is
//      linked by title alone.
//   2. THE LESSON'S OWN WORDS. A content word the person used that appears in
//      a lesson's title (strong) or its big idea and anchor theme (weak).
//
// A weak match is never painted as a strong one: a lesson must reach
// MIN_SCORE to be returned, and a lesson that only shares words with the text
// must share at least two distinct ones. Nothing reaching the bar means the
// surface says so plainly and offers the whole shelf instead.
//
// Pure and deterministic: no network, no randomness, no clock. The same words
// give the same answer every time, in catalog order when scores tie.
import { buildSelfPacedDescriptors } from './learn-catalog.js';
import { lessonQuery } from './lesson-links.js';

export const LIVING_LESSONS_KEY = 'living-lessons';

// Weights by position in a situation's lesson list (first = the lesson that
// speaks to it most directly). Every listed lesson clears the bar on its own:
// being listed at all is a reviewed decision, not a guess.
const SITUATION_WEIGHTS = [12, 10, 8, 7];
// Each extra phrase from the same situation adds a little confidence.
const EXTRA_PHRASE_BONUS = 2;
const TITLE_WORD = 3;
const BODY_WORD = 1;
const BODY_WORD_CAP = 3;
export const MIN_SCORE = 6;
export const MAX_RESULTS = 3;

// "course/lessonId", or a bare Living Lessons id.
const ll = (id) => `${LIVING_LESSONS_KEY}/${id}`;

// THE SITUATION VOCABULARY. Phrases are matched on whole words against the
// person's text after it is lower-cased and stripped of punctuation. Every id
// here is pinned by a test to exist in the published catalog.
export const SITUATIONS = [
  {
    key: 'broken-word',
    label: 'a promise not kept, the yea and the nay',
    phrases: [
      'broken promise', 'broke a promise', 'broke his promise', 'broke her promise', 'broke their promise',
      'broke his word', 'broke her word', 'broke their word', 'did not keep his word', 'didnt keep his word',
      'went back on', 'lied to me', 'lied to us', 'betrayed', 'betrayal', 'backstabbed',
      'contractor', 'ran over', 'ran long', 'took six hours', 'said two hours', 'said it would take',
      'not what we agreed', 'what we agreed', 'we agreed', 'built something else', 'did something else',
      'did not do what', 'didnt do what', 'half done', 'never showed up',
    ],
    lessons: [
      ll('ll192-two-hours-became-six-the-pattern-the-yea-the-inspection-and-the-faithful-man'),
      ll('ll141-separate-and-connect-working-through-issues-studying-to-be-approved-tempted-versus-tried-and-how-we-handle-each-other-and-enemies'),
      ll('ll16-rule-your-spirit-repair-the-bond'),
    ],
  },
  {
    key: 'anger',
    label: 'anger, and ruling your own spirit',
    phrases: [
      'angry', 'anger', 'mad at', 'so mad', 'temper', 'lost my temper', 'lost my cool', 'yelled', 'yelling',
      'yell at', 'screamed', 'screaming', 'rage', 'furious', 'blew up', 'snapped at', 'resentment', 'resent',
      'bitter', 'bitterness', 'frustrated', 'irritated',
    ],
    lessons: [
      ll('ll16-rule-your-spirit-repair-the-bond'),
      ll('ll18-the-flinch-comes-first'),
      ll('ll113-the-spirit-is-willing-but-the-flesh-is-weak-telling-them-apart-ruling-your-spirit-and-yahwehs-long-work'),
    ],
  },
  {
    key: 'job-lost',
    label: 'work, provision and trust',
    phrases: [
      'fired', 'got fired', 'laid off', 'layoff', 'layoffs', 'lost my job', 'lost our job', 'lost his job',
      'lost her job', 'let go from', 'unemployed', 'out of work', 'no job', 'job loss', 'terminated',
      'looking for work', 'looking for a job', 'cant find work', 'cant find a job',
    ],
    lessons: [
      ll('ll5-take-no-thought-for-tomorrow'),
      ll('ll48-world-class-as-unto-the-lord-work-ownership-resilience'),
      ll('ll180-he-giveth-thee-power-to-get-wealth'),
      ll('ll69-faithful-over-a-few-things-stewardship-and-increase'),
    ],
  },
  {
    key: 'work-unfair',
    label: 'honour at work, and a just weight',
    phrases: [
      'passed over', 'overlooked', 'no credit', 'took credit', 'took the credit', 'not promoted',
      'didnt get the promotion', 'did not get the promotion', 'moved the goalposts', 'moving the goalposts',
      'underpaid', 'not recognized', 'unappreciated',
    ],
    lessons: [
      ll('ll45-give-honour-where-it-is-due-recognition-and-equity'),
      ll('ll134-divers-weights-when-the-question-keeps-moving-the-record-that-stands-and-the-better-assignment'),
      ll('ll166-life-is-disrespectful-so-think-on-these-things-self-against-the-servant-king-and-the-one-who-bought-you-twice'),
    ],
  },
  {
    key: 'debt',
    label: 'debt, bills and stewardship',
    phrases: [
      'debt', 'debts', 'in debt', 'bills', 'pay the bills', 'cant pay', 'can not pay', 'cannot pay', 'owe',
      'i owe', 'we owe', 'owed', 'loan', 'loans', 'credit card', 'credit cards', 'behind on rent',
      'behind on payments', 'collections', 'creditor', 'creditors', 'bankrupt', 'bankruptcy', 'im broke', 'i am broke', 'we are broke', 'flat broke',
      'mortgage', 'repossessed', 'late payment', 'late payments',
    ],
    lessons: [
      'financing-debt/fin5-what-hast-thou-in-the-house',
      'financing-debt/fin4-the-wicked-borroweth-and-payeth-not-again',
      ll('ll69-faithful-over-a-few-things-stewardship-and-increase'),
      ll('ll143-yahwehs-will-be-done-on-earth-the-guaranteed-outcome-the-release-and-the-system-we-can-build'),
    ],
  },
  {
    key: 'money',
    label: 'money and stewardship',
    phrases: [
      'money', 'finances', 'financial', 'budget', 'stewardship', 'wealth', 'paycheck', 'income', 'poverty',
      'saving', 'savings', 'provide for my family', 'provision',
    ],
    lessons: [
      ll('ll69-faithful-over-a-few-things-stewardship-and-increase'),
      ll('ll180-he-giveth-thee-power-to-get-wealth'),
      ll('ll143-yahwehs-will-be-done-on-earth-the-guaranteed-outcome-the-release-and-the-system-we-can-build'),
    ],
  },
  {
    key: 'grief',
    label: 'grief, death and the hope older than it',
    phrases: [
      'died', 'dying', 'death', 'passed away', 'passed on', 'funeral', 'grief', 'grieving', 'mourning',
      'miscarriage', 'lost my mother', 'lost my father', 'lost my mom', 'lost my dad', 'lost my husband',
      'lost my wife', 'lost my son', 'lost my daughter', 'lost my brother', 'lost my sister',
      'lost my baby', 'lost my friend', 'lost my grandmother', 'lost my grandfather', 'buried',
    ],
    lessons: [
      ll('ll162-do-not-take-a-death-so-personal-that-you-undermine-your-way-home-let-him-be-him'),
      ll('ll27-the-god-who-documents-his-grief'),
      ll('ll152-crying-because-of-all-the-dying-slow-and-vicious-but-yahweh'),
      ll('ll8-not-by-might-a-new-body-coming'),
    ],
  },
  {
    key: 'marriage',
    label: 'marriage, covenant and preferring one another',
    phrases: [
      'marriage', 'married', 'my wife', 'my husband', 'my spouse', 'spouse', 'divorce', 'divorced',
      'separated', 'separation', 'wedding', 'fiance', 'fiancee',
    ],
    lessons: [
      ll('ll122-does-she-feel-like-your-favorite-person-preferring-one-another-and-the-first-works'),
      ll('ll114-what-makes-having-you-better-covenant-not-contract-and-the-value-a-paycheck-cannot-cover'),
      ll('ll123-would-you-sign-that-contract-the-answer-the-qualification-and-the-manner-that-forfeited-it'),
    ],
  },
  {
    key: 'fear',
    label: 'fear, worry and a sound mind',
    phrases: [
      'afraid', 'scared', 'fear', 'fearful', 'anxious', 'anxiety', 'worried', 'worry', 'worrying', 'panic',
      'panicking', 'panic attack', 'stressed', 'stress', 'nervous', 'dread', 'terrified', 'cant sleep',
    ],
    lessons: [
      ll('ll5-take-no-thought-for-tomorrow'),
      ll('ll13-a-sound-mind'),
      ll('ll2-the-energy-you-were-given'),
    ],
  },
  {
    key: 'fear-of-people',
    label: 'the fear of man',
    phrases: [
      'shy', 'shyness', 'rejected', 'rejection', 'what people think', 'what they think of me', 'judged',
      'embarrassed', 'awkward', 'people pleaser', 'people pleasing',
    ],
    lessons: [
      ll('ll78-the-snare-of-the-fear-of-man'),
      ll('ll1-the-perfect-yahweh-expects'),
    ],
  },
  {
    key: 'shame',
    label: 'falling short, shame and being made whole',
    phrases: [
      'not good enough', 'failure', 'failed', 'i failed', 'a failure', 'messed up', 'mistake', 'mistakes',
      'ashamed', 'shame', 'have to be perfect', 'be perfect', 'perfectionist', 'perfectionism', 'never enough', 'worthless',
    ],
    lessons: [
      ll('ll1-the-perfect-yahweh-expects'),
      ll('ll173-humility-is-the-strength-no-shame-and-feelings-that-arrive-late'),
      ll('ll74-church-hurt-the-counterfeit-comfort-and-the-blood'),
    ],
  },
  {
    key: 'guilt',
    label: 'sin, confession and forgiveness',
    phrases: [
      'guilt', 'guilty', 'forgive me', 'forgiven', 'forgiveness', 'can i be forgiven', 'i sinned', 'sinned',
      'my sin', 'my sins', 'repent', 'confess',
    ],
    lessons: [
      ll('ll148-remember-is-a-verb-what-the-word-says-about-his-knowing-his-withholding-and-the-sea'),
      ll('ll89-the-most-hated-verse-wilful-sin-the-one-sacrifice-the-advocate'),
      ll('ll74-church-hurt-the-counterfeit-comfort-and-the-blood'),
    ],
  },
  {
    key: 'church-hurt',
    label: 'church hurt',
    phrases: ['church hurt', 'hurt by the church', 'hypocrites', 'hypocrite', 'left the church', 'hurt at church'],
    lessons: [ll('ll74-church-hurt-the-counterfeit-comfort-and-the-blood')],
  },
  {
    key: 'children',
    label: 'children, parenting and the Father who is the same to each',
    phrases: [
      'my kids', 'my kid', 'my children', 'my child', 'my son', 'my daughter', 'my teenager', 'my teen',
      'parenting', 'raising my', 'siblings', 'my boys', 'my girls', 'my twins',
    ],
    lessons: [
      ll('ll46-ye-fathers-provoke-to-good-works'),
      ll('ll117-no-two-children-grow-up-in-the-same-house-why-siblings-differ-and-the-one-parent-who-is-the-same'),
      ll('ll100-guard-the-little-ones-children-the-millstone-and-mastery-over-the-tools'),
    ],
  },
  {
    key: 'sickness',
    label: 'sickness, the body and the whole person',
    phrases: [
      'sick', 'sickness', 'illness', 'ill', 'diagnosis', 'diagnosed', 'cancer', 'surgery', 'hospital',
      'chronic pain', 'in pain', 'disease', 'healing', 'heal me',
    ],
    lessons: [
      ll('ll14-ten-healed-one-whole'),
      ll('ll8-not-by-might-a-new-body-coming'),
      ll('ll2-the-energy-you-were-given'),
    ],
  },
  {
    key: 'memory',
    label: 'memory and a sound mind',
    phrases: ['dementia', 'alzheimers', 'memory loss', 'forgetting things', 'losing my memory'],
    lessons: [ll('ll13-a-sound-mind')],
  },
  {
    key: 'lonely',
    label: 'being alone, and being known',
    phrases: ['lonely', 'loneliness', 'alone', 'isolated', 'no friends', 'nobody cares', 'no one cares', 'by myself'],
    lessons: [
      ll('ll21-hidden-vs-known'),
      ll('ll12-if-one-member-suffers'),
    ],
  },
  {
    key: 'pride',
    label: 'pride',
    phrases: ['pride', 'prideful', 'arrogant', 'arrogance', 'ego', 'my ego'],
    lessons: [
      ll('ll160-pride-is-not-worth-him-and-is-ego-pride-or-something-else'),
      ll('ll77-the-king-over-the-children-of-pride'),
    ],
  },
  {
    key: 'words',
    label: 'the tongue, and words seasoned with salt',
    phrases: [
      'gossip', 'gossiping', 'said something hurtful', 'hurtful words', 'my words', 'my mouth', 'my tongue',
      'cussed', 'cursing', 'talked about me', 'lies about me', 'slander',
    ],
    lessons: [
      ll('ll151-the-tongue-death-and-life-in-a-little-member-and-the-knowledge-that-governs-it'),
      ll('ll15-seasoned-with-salt'),
    ],
  },
  {
    key: 'conflict',
    label: 'a hard conversation, worked out The Way',
    phrases: [
      'argument', 'argued', 'arguing', 'fight', 'fighting', 'fought', 'conflict', 'disagreement',
      'hard conversation', 'difficult conversation', 'confront', 'not speaking', 'falling out',
    ],
    lessons: [
      ll('ll16-rule-your-spirit-repair-the-bond'),
      ll('ll141-separate-and-connect-working-through-issues-studying-to-be-approved-tempted-versus-tried-and-how-we-handle-each-other-and-enemies'),
      ll('ll15-seasoned-with-salt'),
    ],
  },
  {
    key: 'temptation',
    label: 'temptation, the flesh and retrained eyes',
    phrases: [
      'lust', 'porn', 'pornography', 'tempted', 'temptation', 'addicted', 'addiction', 'cant stop',
      'relapse', 'relapsed',
    ],
    lessons: [
      ll('ll183-realign-my-eyes-your-type-was-trained'),
      ll('ll113-the-spirit-is-willing-but-the-flesh-is-weak-telling-them-apart-ruling-your-spirit-and-yahwehs-long-work'),
      ll('ll43-the-war-is-for-the-mind'),
    ],
  },
  {
    key: 'generational',
    label: 'the fathers’ sins and the bloodline',
    phrases: ['generational curse', 'generational curses', 'family curse', 'bloodline', 'my fathers sins', 'runs in my family', 'runs in the family'],
    lessons: [ll('ll154-why-do-we-have-to-pay-for-our-fathers-sins-we-dont-and-it-needs-what-we-do-here')],
  },
  {
    key: 'sadness',
    label: 'sorrow, feelings and joy that is strength',
    phrases: ['sad', 'sadness', 'depressed', 'depression', 'hopeless', 'feeling down', 'no joy', 'heavy heart', 'numb'],
    lessons: [
      ll('ll131-joy-is-not-happiness-three-days-one-strength-and-the-word-as-the-code-that-runs-each-of-them'),
      ll('ll126-feelings-are-fruit-not-root-belief-the-renewed-mind-and-declarations-bounded-by-his-word'),
      ll('ll53-the-emotional-cycles-of-brain-and-body-stewarding-feeling-by-the-renewed-mind'),
    ],
  },
  {
    key: 'thoughts',
    label: 'the thoughts you think on',
    phrases: ['overthinking', 'overthink', 'negative thoughts', 'intrusive thoughts', 'my thoughts', 'my mind', 'racing thoughts', 'cant stop thinking', 'lies in my head'],
    lessons: [
      ll('ll6-think-on-these-things'),
      ll('ll43-the-war-is-for-the-mind'),
      ll('ll52-how-a-lie-gets-wired-in-neuroplasticity-memory-and-the-mind-of-christ'),
    ],
  },
  {
    key: 'tired',
    label: 'weariness and rest',
    phrases: ['tired', 'exhausted', 'worn out', 'burned out', 'burnt out', 'burnout', 'weary', 'no energy', 'drained'],
    lessons: [ll('ll2-the-energy-you-were-given')],
  },
  {
    key: 'disrespect',
    label: 'being disrespected',
    phrases: ['disrespected', 'disrespect', 'disrespectful', 'insulted', 'humiliated', 'treated me like', 'looked down on'],
    lessons: [
      ll('ll166-life-is-disrespectful-so-think-on-these-things-self-against-the-servant-king-and-the-one-who-bought-you-twice'),
      ll('ll16-rule-your-spirit-repair-the-bond'),
    ],
  },
  {
    key: 'doubt',
    label: 'doubt, and testing whether it is true',
    phrases: ['doubt', 'doubting', 'doubts', 'is god real', 'is yahweh real', 'is it true', 'dont believe', 'do not believe', 'losing my faith', 'lost my faith'],
    lessons: [
      ll('ll116-the-thirty-day-experiment-action-produces-information-and-the-grace-that-met-a-pretender'),
      ll('ll41-truth-with-a-capital-t'),
      ll('ll17-taste-and-see'),
    ],
  },
  {
    key: 'transition',
    label: 'a season of transition',
    phrases: ['new job', 'moving to', 'we are moving', 'we moved', 'relocating', 'transition', 'new season', 'starting over', 'new role', 'promotion', 'retired', 'retirement'],
    lessons: [ll('ll25-the-threshold-and-the-two-patterns')],
  },
];

// Words too common to say anything about a situation.
const STOP = new Set(`
about above after again against all also always among another any anything are around back because been before
being below between both but came can cannot come could did does doing done down during each even ever every
from further get gets getting going gone good got had has have having her here hers herself him himself his how
into its itself just know knew like made make many more most much must myself need never next not now off once
only other our ours ourselves out over own really same said say says see seem she should since some something
still such take tell than that the their theirs them themselves then there these they thing things think this
those though through thus today told too under until upon very want was way ways well went were what when where
which while who whom whose why will with without would yes yet you your yours yourself yourselves
lord god yahweh jesus word words lesson lessons bible scripture scriptures pray prayer amen please thank thanks
help people person someone somebody everyone everybody time times day days year years life live lives
last night week weeks month months yesterday tonight morning keep kept away passed long little great
feel feels felt maybe sure right left hard trying tried stop start started first second
`.split(/\s+/).filter(Boolean));

/** Lower-case, drop apostrophes (so "can't" reads "cant"), turn every other
 *  non-letter/number into a space, collapse. */
export function normalizeWords(text) {
  return ` ${String(text || '').toLowerCase()
    .replace(/[‘’'`]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()} `;
}

function contentTokens(norm) {
  const seen = new Set();
  const out = [];
  for (const t of norm.split(' ')) {
    if (t.length < 4 || STOP.has(t) || /^\d+$/.test(t) || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

function wordSet(text) {
  return new Set(normalizeWords(text).split(' ').filter(Boolean));
}

function splitRefs(ref) {
  return String(ref || '').split(/\s*[;·]\s*/).map((s) => s.trim()).filter(Boolean);
}

// ---------------------------------------------------------------------------
// The corpus: every published lesson that carries a title, a summary (big
// idea) and anchor verses. Built once per course list and cached.
// ---------------------------------------------------------------------------
const INDEX_CACHE = new WeakMap();
let DEFAULT_COURSES = null;

/** The courses the Speak box ranks: every self-paced course in the Learn
 *  catalog (Living Lessons first), exactly as Learn mounts them. */
export function defaultLessonCourses() {
  if (!DEFAULT_COURSES) {
    DEFAULT_COURSES = buildSelfPacedDescriptors().map((d) => ({ key: d.meta.key, meta: d.meta, schedule: d.schedule }));
  }
  return DEFAULT_COURSES;
}

export function buildSituationIndex(courses) {
  if (courses && INDEX_CACHE.has(courses)) return INDEX_CACHE.get(courses);
  const entries = [];
  const byKey = new Map();
  for (const c of (Array.isArray(courses) ? courses : [])) {
    const courseKey = c && (c.key || c.meta?.key);
    if (!courseKey) continue;
    for (const m of (c.schedule || c.modules || [])) {
      if (!m || !m.id || !m.title || !m.bigIdea || !m.anchor || !m.anchor.ref) continue;
      const entry = {
        order: entries.length,
        courseKey,
        courseTitle: String(c.meta?.title || courseKey),
        lessonId: m.id,
        title: String(m.title),
        refs: splitRefs(m.anchor.ref),
        titleWords: wordSet(m.title),
        bodyWords: wordSet(`${m.bigIdea} ${m.anchor.theme || ''} ${m.anchor.text || ''}`),
      };
      entries.push(entry);
      byKey.set(`${courseKey}/${m.id}`, entry);
    }
  }
  const index = { entries, byKey };
  if (courses) INDEX_CACHE.set(courses, index);
  return index;
}

/** Which vocabulary phrases the text uses, per situation. */
export function situationsIn(text) {
  const norm = normalizeWords(text);
  const hits = [];
  for (const s of SITUATIONS) {
    const found = s.phrases.filter((p) => norm.includes(` ${p} `));
    // "fired" inside "got fired" is one thing said, not two.
    const matched = found.filter((p) => !found.some((q) => q !== p && ` ${q} `.includes(` ${p} `)));
    if (matched.length) hits.push({ situation: s, matched });
  }
  return hits;
}

/**
 * Rank the existing Word-first lessons for a person's words.
 * Returns at most MAX_RESULTS entries, each clearing MIN_SCORE:
 *   { courseKey, courseTitle, lessonId, title, refs, why: { phrases, themes, words }, score, href }
 * An empty array means nothing speaks to these words closely enough.
 */
export function lessonsForSituation(text, { courses = null, limit = MAX_RESULTS } = {}) {
  const norm = normalizeWords(text);
  if (!norm.trim()) return [];
  const index = buildSituationIndex(courses || defaultLessonCourses());
  const scores = new Map(); // key -> { entry, score, phrases:Set, themes:[], words:Set, curated }
  const slot = (entry) => {
    const k = `${entry.courseKey}/${entry.lessonId}`;
    if (!scores.has(k)) scores.set(k, { entry, score: 0, phrases: new Set(), themes: [], words: new Set(), curated: false });
    return scores.get(k);
  };

  for (const { situation, matched } of situationsIn(text)) {
    situation.lessons.forEach((key, i) => {
      const entry = index.byKey.get(key);
      if (!entry) return; // a course not mounted in this corpus
      const s = slot(entry);
      s.score += (SITUATION_WEIGHTS[i] ?? SITUATION_WEIGHTS[SITUATION_WEIGHTS.length - 1])
        + EXTRA_PHRASE_BONUS * (matched.length - 1);
      s.curated = true;
      matched.forEach((p) => s.phrases.add(p));
      if (!s.themes.includes(situation.label)) s.themes.push(situation.label);
    });
  }

  const tokens = contentTokens(norm);
  if (tokens.length) {
    for (const entry of index.entries) {
      let add = 0;
      let body = 0;
      const words = [];
      for (const t of tokens) {
        if (entry.titleWords.has(t)) { add += TITLE_WORD; words.push(t); }
        else if (t.length >= 5 && entry.bodyWords.has(t) && body < BODY_WORD_CAP) { add += BODY_WORD; body++; words.push(t); }
      }
      if (!add) continue;
      const s = slot(entry);
      s.score += add;
      words.forEach((w) => s.words.add(w));
    }
  }

  const passing = [];
  for (const s of scores.values()) {
    if (s.score < MIN_SCORE) continue;
    // Shared words alone must be more than one coincidence.
    if (!s.curated && s.words.size < 2) continue;
    passing.push(s);
  }
  passing.sort((a, b) => (b.score - a.score) || (a.entry.order - b.entry.order));
  return passing.slice(0, limit).map((s) => ({
    courseKey: s.entry.courseKey,
    courseTitle: s.entry.courseTitle,
    lessonId: s.entry.lessonId,
    title: s.entry.title,
    refs: s.entry.refs.slice(),
    why: { phrases: [...s.phrases], themes: s.themes.slice(), words: [...s.words] },
    score: s.score,
    href: lessonQuery({ courseKey: s.entry.courseKey, lessonId: s.entry.lessonId }),
  }));
}

/** One plain line saying why a lesson was offered. */
export function whyLine(result) {
  const said = [...(result?.why?.phrases || []), ...(result?.why?.words || [])];
  const uniq = [...new Set(said)].slice(0, 4).map((w) => `“${w}”`);
  const themes = result?.why?.themes || [];
  if (!uniq.length) return '';
  return themes.length ? `You said ${uniq.join(', ')}: ${themes.join('; ')}.` : `You said ${uniq.join(', ')}.`;
}

/** Where "Browse Living Lessons" goes when nothing matches. */
export const BROWSE_LIVING_LESSONS_HREF = lessonQuery({ courseKey: LIVING_LESSONS_KEY });
