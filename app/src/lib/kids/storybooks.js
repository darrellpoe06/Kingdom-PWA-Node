// =============================================================================
// kids/storybooks — the interactive Bible storybooks of the Kids Zone (DR-1508)
// =============================================================================
// Darrell, 2026-11-13: "Interactive Bible storybooks: rich illustrations,
// read-along narration, interactive reading, and comprehension activities."
//
// GROUNDED, NOT PAINTED (P15; DR-0076): a storybook is a list of REFERENCES.
// The page's words are the King James verse loaded at read time
// (lib/bible-kjv.js verseText), word for word, never retold. What is ours is
// the guide's caption beside the verse (checked by the voice gate), the
// picture's shot id (a render of the approved reference from the artwork
// brief; the surface shows a labeled slot until it lands), and the questions
// at the end, whose answers are words the storybook's own verses contain
// (kids-storybooks.test.js opens every verse in the in-repo KJV and proves
// it). Pure: no React, no I/O.

const page = (ref, shot, who, caption) => ({ ref, shot, who, caption });
const q = (question, options, answer, from) => ({ question, options, answer, from });

export const STORYBOOKS = Object.freeze([
  {
    id: 'jonah',
    title: 'Jonah and the Great Fish',
    scripture: 'Jonah 1–3',
    book: 'Jonah',
    chapter: 1,
    pages: [
      page('Jonah 1:1-3', 'jonah-1', 'girl', 'Yahweh told Jonah to go to Nineveh. Look which way Jonah is going! That is the wrong way.'),
      page('Jonah 1:4', 'jonah-2', 'boy', 'Hold on tight! Yahweh sent a great wind, and the sailors were afraid.'),
      page('Jonah 1:17', 'jonah-3', 'boy', 'Three days inside a fish! Yahweh had a plan for Jonah even there. Tap the words to hear them.'),
      page('Jonah 2:1', 'jonah-4', 'girl', 'Even inside the fish, Jonah could pray. Yahweh hears us anywhere.'),
      page('Jonah 2:10', 'jonah-5', 'girl', 'Safe on dry land! Yahweh told the fish what to do, and it did.'),
      page('Jonah 3:1-3', 'jonah-6', 'boy', 'This time Jonah went the right way. Nineveh was a very big city.'),
      page('Jonah 3:5', 'jonah-7', 'girl', 'The people listened and believed God. Even the king put on rough clothes to show he was sorry.'),
      page('Jonah 3:10', 'jonah-8', 'boy', 'Yahweh saw that they turned from doing wrong, and He showed them mercy. He is kind!'),
    ],
    questions: [
      q('Where did the LORD tell Jonah to go?', ['Nineveh, that great city', 'Tarshish, by ship', 'Back home to bed'], 0, 'Jonah 1:2'),
      q('How long was Jonah in the belly of the fish?', ['Three days and three nights', 'One afternoon', 'Forty days'], 0, 'Jonah 1:17'),
      q('What did the people of Nineveh do when Jonah preached?', ['The people believed God', 'They laughed at him', 'They built a boat'], 0, 'Jonah 3:5'),
    ],
  },
  {
    id: 'noah',
    title: 'Noah and the Door Yahweh Shut',
    scripture: 'Genesis 6–9',
    book: 'Genesis',
    chapter: 6,
    pages: [
      page('Genesis 6:8', 'noah-1', 'girl', 'Everyone else had forgotten Yahweh. But Noah found grace in His eyes.'),
      page('Genesis 6:14', 'noah-2', 'boy', 'Build a boat on dry land? Noah did exactly what Yahweh said, plank by plank.'),
      page('Genesis 6:22', 'noah-3', 'girl', 'All that God commanded, Noah did. Every single part.'),
      page('Genesis 7:7-9', 'noah-4', 'boy', 'Two by two! Count the animals going up the ramp with me.'),
      page('Genesis 7:16', 'noah-5', 'girl', 'Look who shut the door: not Noah. The LORD shut him in, so Noah was safe inside.'),
      page('Genesis 8:11', 'noah-6', 'boy', 'A dove came back with an olive leaf. The water was going down!'),
      page('Genesis 8:20', 'noah-7', 'girl', 'The first thing Noah did on dry ground was build an altar and thank Yahweh.'),
      page('Genesis 9:13', 'noah-8', 'boy', 'The bow in the cloud is a promise from Yahweh. Next time you see a rainbow, remember it!'),
    ],
    questions: [
      q('What did Noah find in the eyes of the LORD?', ['Grace', 'Gold', 'A map'], 0, 'Genesis 6:8'),
      q('Who shut the door of the ark?', ['The LORD shut him in', 'Noah shut it', 'The animals shut it'], 0, 'Genesis 7:16'),
      q('What did the dove bring back to Noah?', ['An olive leaf', 'A fish', 'A stone'], 0, 'Genesis 8:11'),
    ],
  },
  {
    id: 'david',
    title: 'David and the Giant',
    scripture: '1 Samuel 17',
    book: '1 Samuel',
    chapter: 17,
    pages: [
      page('1 Samuel 17:4', 'david-1', 'boy', 'Goliath was a champion, and he was very, very tall. Six cubits and a span!'),
      page('1 Samuel 17:33', 'david-2', 'girl', 'King Saul said David was too young. But David trusted Yahweh.'),
      page('1 Samuel 17:40', 'david-3', 'boy', 'No sword, no armor. Five smooth stones from the brook and a sling.'),
      page('1 Samuel 17:45', 'david-4', 'girl', 'Listen to what David said: he came in the name of the LORD of hosts!'),
      page('1 Samuel 17:49', 'david-5', 'boy', 'One stone. Right on target. Yahweh guided it.'),
      page('1 Samuel 17:50', 'david-6', 'girl', 'David won with a sling and a stone, because the battle was the LORD\'s.'),
      page('1 Samuel 17:52', 'david-7', 'boy', 'The whole army shouted and ran after the enemy. What a day!'),
      page('1 Samuel 18:1', 'david-8', 'girl', 'Jonathan loved David like his own soul. A true friend is a gift from Yahweh.'),
    ],
    questions: [
      q('What did David take out of the brook?', ['Five smooth stones', 'A sword', 'A fish'], 0, '1 Samuel 17:40'),
      q('In whose name did David come against Goliath?', ['The name of the LORD of hosts', 'His own name', 'King Saul\'s name'], 0, '1 Samuel 17:45'),
      q('What did David use to win?', ['A sling and a stone', 'A spear and a shield', 'A chariot'], 0, '1 Samuel 17:50'),
    ],
  },
]);

/** A storybook by id, or null. */
export function storybookById(id) {
  return STORYBOOKS.find((b) => b.id === id) || null;
}

/** Every line of our own voice in the storybooks, for the voice gate. */
export function storybookVoiceLines() {
  const out = [];
  for (const b of STORYBOOKS) {
    out.push({ where: `${b.id}:title`, text: b.title });
    b.pages.forEach((p, i) => out.push({ where: `${b.id}:page-${i + 1}`, text: p.caption }));
    b.questions.forEach((qq, i) => {
      out.push({ where: `${b.id}:q${i + 1}`, text: qq.question });
      qq.options.forEach((o, j) => out.push({ where: `${b.id}:q${i + 1}:option-${j + 1}`, text: o }));
    });
  }
  return out;
}

/** The content words of an answer (four letters or more), lowercased, for the proof. */
export function answerKeywords(option) {
  return String(option || '')
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 4);
}

/** Grade a tap on the last page. A wrong tap says "not yet", never "wrong". */
export function gradeStoryAnswer(question, pick) {
  const right = Number(pick) === question.answer;
  return { right, says: right ? 'Yes! That is what the Word says.' : 'Not yet. Look back at the page and try again.' };
}

/** Progress through a book, for the dots: pages read so far out of all. */
export function storyProgress(book, pageIndex) {
  const n = book ? book.pages.length : 0;
  const i = Math.max(0, Math.min(n, Number(pageIndex) || 0));
  return { read: i, total: n, done: n > 0 && i >= n };
}
