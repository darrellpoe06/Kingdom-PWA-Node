// =============================================================================
// eternal-algorithms-studies — the PUBLIC "Eternal Algorithms" study series
// =============================================================================
// Darrell's frame (2026-07-01): Yahweh's word is decision-logic. His conditional
// (if / then) truths ARE the eternal algorithms of Information, Intelligence, and
// Decision-making we are meant to return to. Yahweh created Eternal Intelligence;
// humans made AI; the aim is getting back to His decision-logic. "His technology
// is beyond our comprehension." The if/then structure of His word IS an algorithm
// — a decision rule — and running it (doing what He says, because you agree once
// you understand) is the proof of real agreement; NOT doing it is the output
// proving your true input differs from your stated one.
//
// This is a SERIES container (entry #1 = Conditional Truth; room for #2+), aimed
// at ANYONE for honest self-examination (church + the kids), Word-first,
// undivided, non-denominational. It is PUBLIC — a sibling to Church > Learn /
// Scripture, NOT the circle-gated Darrell's Study. (Distinct from the private
// "frameworks & outcomes" Eternal Algorithms LIBRARY inside Study; same core
// idea — Scripture as eternal decision-logic — different audience + purpose.)
//
// POSTURE (binding, from Darrell):
//   1. WORD IS PRIMARY + the ARBITER of clarity. Every point anchors in Scripture;
//      if something seems off we clarify it FROM the Word. Scripture corrects the
//      content, never the reverse.
//   2. Mercy AND accountability, together.
//   3. Humble-seeking — "we're all still piecing together the Truth" (Pilate asked
//      "What is truth?" with Truth standing before him, John 18:38). Expand the
//      theology; do not close it dogmatically.
//   4. Reverent, not reduced.
//
// SCRIPTURE / LICENSE: this module carries only REFERENCES + our own teaching
// prose. Verse TEXT is rendered in-app from the public-domain layer (lib/
// scriptures.js kjvText) — copyrighted translations (ESV) are cited + linked
// (readOnline), never reproduced (bible-editions.js; DR-0076). Every game-deck
// ref resolves in the KJV set — a test guards it (proven-to-catch).
//
// SOVEREIGNTY: the teaching is code-shipped (deterministic seed content). The
// reader's own self-examination RESPONSES are device-local per identity
// (localStorage), never sent to the cloud, never mined (DATA-AS-EMPOWERMENT).
// All transforms are PURE; the only I/O is load/save, which fail soft.
// =============================================================================
import { CATEGORIES } from './games/generations.js';
import { emptyScores, applyEffects, computeTotals } from './games/engine.js';

export const STORE_VERSION = 1;
const KEY_PREFIX = 'poetech.eastudy.v1';

// A minimal engine `def` so the in-study belief-vs-action round scores on the
// SAME eight Yahweh axes (and weights) as the Generations game — reuse, not a
// second scoring system.
export const AXES = CATEGORIES;
const SCORER_DEF = { categories: CATEGORIES };

// --- The series ---------------------------------------------------------------
export const SERIES = Object.freeze({
  id: 'eternal-algorithms',
  title: 'Eternal Algorithms',
  kicker: "Yahweh's word is decision-logic",
  banner:
    "His conditional (if / then) truths are the eternal algorithms of Information, Intelligence, and " +
    "Decision-making we are meant to return to. Yahweh created Eternal Intelligence; we made AI; the aim " +
    "is getting back to His decision-logic. His technology is beyond our comprehension.",
  posture:
    "Word-first and undivided. Scripture is the arbiter — if something seems off, we clarify it from the " +
    "Word, not the other way around. Held in mercy AND accountability. And held humbly: we are all still " +
    "piecing together the Truth. Pilate asked “What is truth?” with Truth standing in front of him " +
    "(John 18:38). So we expand, we don’t close the door.",
});

// --- Study #1: Conditional Truth ---------------------------------------------
// Each section: plain (the inline, two-tier top layer) + deep (the "go deeper"
// layer) + anchors (references; ESV cited, KJV rendered in-app). primaryRef is
// the verse whose public-domain text the section shows first.
const CONDITIONAL_TRUTH = Object.freeze({
  id: 'conditional-truth',
  number: 1,
  title: 'Conditional Truth',
  subtitle: 'If / then — and the gap between what we say we believe and what we do',
  intro:
    "Yahweh’s words are truth in a way you either DO or you don’t. They are conditional — if / then. " +
    "Once you truly understand His perspective and agree with it, you simply do what He says, because you " +
    "agree. If you don’t do it, you don’t actually agree yet — even if your mouth says you do. This " +
    "study is a mirror for that gap, held in mercy and in truth.",
  sections: [
    {
      id: 'algorithm',
      heading: 'The if / then is a decision rule',
      plain:
        "An algorithm is a decision rule: given an input, it produces an output. Yahweh’s word runs the " +
        "same way. He sets it out plainly as if / then — a blessing if you obey, a curse if you don’t — " +
        "and tells us to choose. The rule is not hidden; it is spoken.",
      deep:
        "Deuteronomy states the algorithm twice, in the open: “See, I am setting before you today a " +
        "blessing and a curse” (Deut 11:26-28), and “I have set before you life and death, blessing and " +
        "curse. Therefore choose life” (Deut 30:19). This is decision-logic: the condition (obey / turn " +
        "away) determines the outcome (life / death). Yahweh created that logic; it is His, and it is " +
        "eternal — the same in both dimensions. Our machines only imitate, at a distance, what He authored.",
      primaryRef: 'Deuteronomy 30:19',
      anchors: [
        { ref: 'Deuteronomy 11:26-28', translation: 'ESV' },
        { ref: 'Deuteronomy 30:19', translation: 'ESV' },
      ],
    },
    {
      id: 'run-it',
      heading: 'Running the algorithm = agreement proven by action',
      plain:
        "“If you love me, you will keep my commandments” (John 14:15). Doing what He says IS running the " +
        "algorithm. Real agreement moves. When you understand His perspective and agree, obedience is not a " +
        "second step you strain toward — it is simply what agreement does.",
      deep:
        "Jesus asks it plainly: “Why do you call me ‘Lord, Lord,’ and not do what I tell you?” " +
        "(Luke 6:46). And: “Not everyone who says to me ‘Lord, Lord’ … but the one who does the will " +
        "of my Father” (Matt 7:21). James makes it the whole command: “be doers of the word, and not " +
        "hearers only, deceiving yourselves” (James 1:22). Hearing is input; doing is the output that shows " +
        "the input was real.",
      primaryRef: 'John 14:15',
      anchors: [
        { ref: 'John 14:15', translation: 'ESV' },
        { ref: 'Luke 6:46', translation: 'ESV' },
        { ref: 'Matthew 7:21', translation: 'KJV' },
        { ref: 'James 1:22', translation: 'ESV' },
      ],
    },
    {
      id: 'the-gap',
      heading: 'Not doing it = the output proving your true input differs',
      plain:
        "Here is the mirror. The mind can state one input — “I believe this” — while the life computes " +
        "another. Your actions reveal your real input. When what you do does not match what you say, the do " +
        "is telling the truth about what you actually believe. This is not condemnation; it is information.",
      deep:
        "James names the failure mode exactly: the hearer-only is like a man who looks at his face in a " +
        "mirror “and at once forgets what he was like” (James 1:23-24). Self-examination is looking " +
        "without forgetting. Paul makes it a command, not a mood: “Examine yourselves, to see whether you " +
        "are in the faith. Test yourselves” (2 Cor 13:5). The gap is meant to be seen, named, and closed — " +
        "not hidden.",
      primaryRef: '2 Corinthians 13:5',
      anchors: [
        { ref: 'James 1:23-24', translation: 'ESV' },
        { ref: '2 Corinthians 13:5', translation: 'ESV' },
      ],
    },
    {
      id: 'mercy-accountability',
      heading: 'Mercy AND accountability — both, not one',
      plain:
        "There is real grace for the gap. Research on the brain finds the deciding-apparatus — the " +
        "prefrontal cortex — is still maturing into the mid-twenties. So a young person’s stated belief " +
        "outrunning their action is, in part, an instrument still being finished. Yahweh knows our frame. " +
        "And still — we are accountable. Mercy does not cancel accountability; it carries us toward it.",
      deep:
        "The mercy is His own posture: “As a father shows compassion to his children, so the Lord shows " +
        "compassion to those who fear him. For he knows our frame; he remembers that we are dust” " +
        "(Ps 103:13-14). The accountability is just as real: each of us gives an account (2 Cor 5:10; the " +
        "measure in Matt 25 is what was DONE). Both are true at once. The historical grounding: Arain M, et " +
        "al., “Maturation of the adolescent brain,” Neuropsychiatr Dis Treat. 2013;9:449-461 — “the " +
        "brain undergoes a ‘rewiring’ process that is not complete until approximately 25 years of age … " +
        "refers specifically to the development of the prefrontal cortex.” Grace for the maturing; truth " +
        "for the whole life.",
      primaryRef: 'Psalm 103:13-14',
      anchors: [
        { ref: 'Psalm 103:13-14', translation: 'KJV' },
        { ref: '2 Corinthians 5:10', translation: 'ESV' },
      ],
      citation:
        'Arain M, Haque M, Johal L, Mathur P, Nel W, Rais A, Sandhu R, Sharma S. ' +
        '"Maturation of the adolescent brain." Neuropsychiatr Dis Treat. 2013;9:449-461.',
    },
    {
      id: 'humble-seeking',
      heading: 'Held humbly — we are still piecing together the Truth',
      plain:
        "We hold all of this humbly. Pilate looked at Truth Himself and asked “What is truth?” " +
        "(John 18:38) — the answer was standing in front of him. We can miss it while looking right at it. " +
        "So this study expands the Word; it does not close the door and call it finished. The Word is the " +
        "arbiter; we keep coming back to it.",
      deep:
        "“Everyone who is of the truth listens to my voice” (John 18:37). Truth is a Person before it is " +
        "a proposition; the posture toward it is a listening one. Undivided and non-denominational: the Body " +
        "is not ours to split, and the Word is senior to any tradition. Where we are unsure, we say so, and " +
        "we go back to Scripture rather than settle it by preference. Expand, don’t close.",
      primaryRef: 'John 18:38',
      anchors: [
        { ref: 'John 18:37', translation: 'ESV' },
        { ref: 'John 18:38', translation: 'ESV' },
      ],
    },
  ],
  // The interactive self-examination. Each item is a conditional truth from the
  // Word, run as a personal check: the Word, a stated-input question, an action
  // probe (honest recall), and a mirror held in mercy + accountability. Each
  // maps to one belief-vs-action card in the game (gameLens = Yahweh's framing).
  selfExam: [
    {
      id: 'love-obeys',
      wordRef: 'John 14:15',
      prompt: 'Do you agree, now that you understand it, that love for Him shows as keeping His word?',
      probe: 'The last time His word crossed your own preference, what did you actually do?',
      mirror:
        'If love kept the word, the algorithm ran. If preference won, that is information, not condemnation ' +
        '— name it and bring it back. He knows your frame (Ps 103:13-14).',
      gameLens: 'Love is proven in the keeping, not the saying (John 14:15).',
    },
    {
      id: 'doer-not-hearer',
      wordRef: 'James 1:22',
      prompt: 'Do you agree you are meant to be a doer of the word, not a hearer only?',
      probe: 'Name one word you clearly heard recently and did NOT do.',
      mirror:
        'The hearer-only forgets the mirror (James 1:23-24). Looking without forgetting is the work — the ' +
        'gap named is the gap half-closed.',
      gameLens: 'Hearing is input; doing is the output that proves it (James 1:22).',
    },
    {
      id: 'lord-lord',
      wordRef: 'Luke 6:46',
      prompt: 'Where do you call Him Lord?',
      probe: 'Where do you call Him Lord but not do the thing He has said?',
      mirror:
        '"Why do you call me Lord, Lord, and not do what I tell you?" (Luke 6:46). Not to shame — to invite. ' +
        'The mouth and the hands can be reconciled.',
      gameLens: 'Calling Him Lord and not doing it is a stated input the output contradicts (Luke 6:46).',
    },
    {
      id: 'choose-life',
      wordRef: 'Deuteronomy 30:19',
      prompt: 'Do you agree the choice is really set before you — life or death, blessing or curse?',
      probe: 'The last fork where you knew the life-path, which did you choose?',
      mirror:
        '"Therefore choose life" (Deut 30:19). The next fork is still open. The algorithm is not fate — it ' +
        'is a choice He keeps setting before you.',
      gameLens: 'The if/then is a live choice, set before you today (Deut 30:19).',
    },
    {
      id: 'examine',
      wordRef: '2 Corinthians 13:5',
      prompt: 'Are you willing to examine yourself honestly here?',
      probe: 'Name one mirror-truth about yourself you keep forgetting the moment you walk away.',
      mirror:
        '"Examine yourselves … test yourselves" (2 Cor 13:5). The willingness to look is itself the first ' +
        'obedience. Christ is in you — that is the ground you stand on to look.',
      gameLens: 'The examined life is the doer’s life; the unexamined one forgets (2 Cor 13:5).',
    },
  ],
  about: {
    what:
      'Eternal Algorithms is a study series: Yahweh’s if/then truths read as His eternal decision-logic. ' +
      'Entry #1, Conditional Truth, is about the gap between what we say we believe and what we do — held ' +
      'in mercy and accountability, for honest self-examination.',
    where:
      'The teaching is Scripture-anchored (ESV cited; public-domain KJV text shown in-app). Your own ' +
      'self-examination answers stay on this device only — never sent to the cloud, never mined.',
    how:
      'Read the teaching (tap any point to go deeper), then answer the self-examination honestly. Your ' +
      'answers build a belief-vs-action round you can take into the Generations game — alone or with your ' +
      'family / team.',
    helpTopic: 'church:eternal-algorithms',
  },
});

export const STUDIES = Object.freeze([CONDITIONAL_TRUTH]);

export function listStudies() {
  return STUDIES;
}
export function getStudy(id) {
  return STUDIES.find((s) => s.id === id) || null;
}

// Every Scripture reference the study carries (section anchors + self-exam words)
// — used by the test that guards each game-deck ref resolves to real KJV text.
export function allScriptureRefs(study) {
  const s = study || {};
  const refs = [];
  for (const sec of s.sections || []) {
    if (sec.primaryRef) refs.push(sec.primaryRef);
    for (const a of sec.anchors || []) if (a && a.ref) refs.push(a.ref);
  }
  for (const item of s.selfExam || []) if (item.wordRef) refs.push(item.wordRef);
  return [...new Set(refs)];
}

// --- Published algorithms -> game deck (Darrell 2026-07-03: "All eternal
// algorithms going into the game so they can be further aware of the Word.
// Real study is fun and exploration.") ----------------------------------------
// Every framework PUBLISHED from the family forge becomes a playable card on
// the SAME eight Yahweh axes (no second scoring system). The three choices
// mirror the belief-vs-action triple, framed for a framework: RUN it this week
// (doing-the-word, the redemption choice), ADMIRE it and change nothing
// (hearers-not-doers, James 1:22), or TEACH it to someone (the Word multiplied
// — family/souls/service). Input shape = fetchPublishedAlgorithms() entries;
// pure + total, so an empty forge yields an empty deck, never a painted card.
export function algorithmsToGameCards(published = []) {
  return (Array.isArray(published) ? published : [])
    .filter((alg) => alg && alg.name)
    .map((alg) => ({
      id: `eaforge-${alg.id}`,
      type: 'card',
      title: alg.name,
      body: alg.outcome
        ? `The outcome you win with it: ${alg.outcome}${alg.threeD ? ` — In practice: ${alg.threeD}` : ''}`
        : (alg.threeD || alg.name),
      lens: alg.fourD || `An eternal algorithm — it runs the same in the eternal and in this-world life (Ecclesiastes 3:14).`,
      scripture: { ref: String(alg.scripture || '').split(';')[0].trim() || undefined },
      choices: [
        {
          label: 'Run the algorithm this week',
          body: 'Pick one real place it applies and do it — the Word done, not admired.',
          effects: { faith: 2, wisdom: 1, provision: 1 },
          redemption: true,
        },
        {
          label: 'Admire it and change nothing',
          body: 'A hearer only — the framework stays on the shelf (James 1:22).',
          effects: { faith: -1, wisdom: -1 },
        },
        {
          label: 'Teach it to someone this week',
          body: 'The Word multiplied — walk someone through the framework and its Scripture.',
          effects: { family: 1, souls: 2, service: 1 },
        },
      ],
    }));
}

// --- Study -> game deck (the belief-vs-action hook) --------------------------
// Turns the study's self-examination items into a Generations-compatible deck
// (see lib/games/generations.js LIFE_DECK shape). Each card carries a Scripture
// REFERENCE only (resolved to text by games/scripture-link.js), a `lens` (the
// game's voice on Yahweh's perspective), and three choices whose `effects` score
// on the eight Yahweh axes: doing-the-word is the Kingdom-forward, redemption
// choice; restating-the-belief-to-match-inaction is the self-deception choice;
// taking-it-to-the-Body is the accountable, communal choice. `responses` (a map
// keyed by item id) optionally personalizes the card body; it is never required.
export function studyToGameCards(study, responses = {}) {
  const s = study || {};
  const r = responses && typeof responses === 'object' ? responses : {};
  return (s.selfExam || []).map((item) => {
    const answered = r[item.id] && String(r[item.id].probe || '').trim();
    return {
      id: `eastudy-${s.id}-${item.id}`,
      type: 'card',
      title: 'Belief vs. action',
      body: answered
        ? `You wrote: “${String(r[item.id].probe).trim()}” — ${item.prompt}`
        : item.probe,
      lens: item.gameLens,
      scripture: { ref: item.wordRef },
      choices: [
        {
          label: 'I do the word — close the gap',
          body: 'Agreement proven by action. The algorithm runs.',
          effects: { faith: 2, wisdom: 1, peace: 1 },
          redemption: true,
        },
        {
          label: 'I restate the belief to match what I already do',
          body: 'The stated input bends to the output — self-deception, not agreement (James 1:22).',
          effects: { faith: -1, wisdom: -1, peace: -1 },
        },
        {
          label: 'I take it to the Body — be accountable together',
          body: 'Named in company, carried together — mercy and accountability at once.',
          effects: { family: 1, souls: 1, service: 1 },
        },
      ],
    };
  });
}

// A pure scorer for the in-study solo round, reusing the SAME axes + weights as
// the Generations engine (no second scoring system). `choiceByCard` maps card id
// -> chosen choice index. Returns { scores, totals } where totals.weighted is the
// Kingdom-weighted legacy number (faith/family/souls weigh most; Matt 6:33).
export function scoreRound(cards, choiceByCard = {}) {
  let scores = emptyScores(SCORER_DEF);
  for (const card of cards || []) {
    const idx = choiceByCard[card.id];
    const choice = (card.choices || [])[idx];
    if (choice) scores = applyEffects(SCORER_DEF, scores, choice.effects);
  }
  return { scores, totals: computeTotals(SCORER_DEF, { scores }) };
}

// --- device-local persistence for the reader's own answers (fail-soft) -------
export function respKey(email) {
  const id = String(email || 'anon').trim().toLowerCase();
  return `${KEY_PREFIX}:${id}`;
}
function safeStorage() {
  try {
    if (typeof localStorage === 'undefined' || !localStorage) return null;
    return localStorage;
  } catch { return null; }
}
export function loadResponses(email) {
  const ls = safeStorage();
  if (!ls) return {};
  try {
    const raw = ls.getItem(respKey(email));
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch { return {}; }
}
export function saveResponses(email, responses) {
  const ls = safeStorage();
  if (!ls) return false;
  try {
    ls.setItem(respKey(email), JSON.stringify(responses || {}));
    return true;
  } catch { return false; }
}
