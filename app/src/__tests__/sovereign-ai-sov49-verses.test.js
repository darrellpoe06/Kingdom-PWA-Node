// @vitest-environment node
// =============================================================================
// sov49 — every verse it stands on is the KJV corpus on disk, verbatim
// =============================================================================
// Darrell forwarded a ByteByteGo issue into the app on 2026-09-28 from his
// university address with one word above it: "Lessons." Its subject was "AI
// Agents Can Think. Now They Can Pay." — a deep dive on an HTTP-level design in
// which a software agent buys a service with no person in the transaction.
//
// THE GROUND WAS CHOSEN BY MEASUREMENT, and this test pins the reason. Counted
// in sovereign-ai-class.js BEFORE a word was written, the obvious lesson from
// that article was already taught five times over: the delegated key with a
// spending cap, an expiry and a recipient list is week 19 (the servant under
// authority who keeps the guardrails), week 29 (the agent that went past the
// bound) and week 31 (whose errand does your agent carry); who owns the rails
// is week 13, which already names Revelation 13:16-17 in its spine; paying a
// worker the same day is week 42; a price that answers the same every time is
// weeks 17 and 37; how many witnesses establish a matter is week 45.
//
// What was FREE, counted rather than guessed at, across all 48 prior weeks:
// Genesis 23 (any verse) 0, "Machpelah" 0, "Ephron" 0, Ruth 4 0, "Boaz" 0,
// Jeremiah 32 0, "Hanameel" 0, Luke 19:8 0, "Zacchaeus" 0, Mark 12:41-44 0,
// "two mites" 0, Matthew 10:29-30 0, 2 Samuel 24:24 0, "Araunah" 0,
// Isaiah 55:1 0, Psalms 49:7-8 0, 1 Corinthians 6:20 0, Acts 20:28 0,
// Revelation 5:9 0, "bought with a price" 0, Proverbs 20:14 0, Proverbs 22:1 0.
// So the untaught seam is THE NAMED, SPOKEN, WITNESSED, RECORDED PURCHASE —
// which is exactly what the article's own confession says disappears ("payment
// is no longer a form of identification"; "there is nobody to contact after the
// transaction is done") — and the spine is Genesis 23 + Ruth 4 + Jeremiah 32 +
// Luke 19 + Mark 12 + 2 Samuel 24:24 + the purchase with a Name on it.
//
// WHAT THIS PINS BEYOND THE THIRTY-SEVEN VERSES:
//   * the curly apostrophe, because sov47 shipped "watchman's" for the corpus's
//     "watchman’s" three times in three files before a checker caught it. This
//     lesson quotes Ruth 4:9 ("Elimelech’s", "Chilion’s"), Jeremiah 32:9 and
//     32:12 ("uncle’s") and 1 Corinthians 6:20 ("God’s"), so it is exposed to
//     exactly that defect.
//   * the DR-0210 bright line in BOTH directions: "Yahweh" in OUR prose, and
//     "God" / "the LORD" ONLY ever inside a quotation. Ruth 4:11, Jeremiah
//     32:14, 2 Samuel 24:24, Isaiah 55:1, Psalms 49:7, 1 Corinthians 6:20,
//     Acts 20:28, John 1:29, John 3:16 and Hebrews 1:8 all carry "God" or "the
//     LORD" inside the quotation, which is exactly where they stay. The first
//     draft of the tenth movement had "unto Yahweh of that which doth cost me
//     nothing" — a substitution into a near-quote of 2 Samuel 24:24 — and it
//     was rewritten before this file existed. That is the defect this test is
//     for.
//   * that the lesson body is not a band wearing a second label (the sov48
//     defect: a first draft read 0.995 against its own teen band).
//   * that the modules array has no HOLE in it, the `},,` defect sov48's splice
//     left behind.
//   * that TALK ABOUT IT TOGETHER sends the reader all three ways on the lesson
//     AND on every single band (DR-0795), by the directions' literal text —
//     because a reader reads ONE band.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SOVEREIGN_AI_MODULES } from '../lib/sovereign-ai-class.js';
import { hasAllThree, placesMissingDirections, hasAllThreeEverywhere, missingDirections } from '../lib/talk-together.js';

const CORPUS = join(process.cwd(), 'public', 'bible', 'kjv');

/** The verse exactly as the corpus on disk has it. No normalisation. */
function corpusText(ref) {
  const m = /^(.+?)\s+(\d+):(\d+)$/.exec(ref.trim());
  const book = m[1].trim().replace(/^Psalm$/i, 'Psalms').replace(/\s+/g, '');
  const data = JSON.parse(readFileSync(join(CORPUS, `${book}.json`), 'utf8'));
  return data.chapters[Number(m[2]) - 1][Number(m[3]) - 1];
}

const PINNED = {
  'Genesis 23:13': 'And he spake unto Ephron in the audience of the people of the land, saying, But if thou wilt give it, I pray thee, hear me: I will give thee money for the field; take it of me, and I will bury my dead there.',
  'Genesis 23:16': 'And Abraham hearkened unto Ephron; and Abraham weighed to Ephron the silver, which he had named in the audience of the sons of Heth, four hundred shekels of silver, current money with the merchant.',
  'Genesis 23:17': 'And the field of Ephron, which was in Machpelah, which was before Mamre, the field, and the cave which was therein, and all the trees that were in the field, that were in all the borders round about, were made sure',
  'Genesis 23:18': 'Unto Abraham for a possession in the presence of the children of Heth, before all that went in at the gate of his city.',
  'Genesis 23:20': 'And the field, and the cave that is therein, were made sure unto Abraham for a possession of a buryingplace by the sons of Heth.',
  'Ruth 4:9': 'And Boaz said unto the elders, and unto all the people, Ye are witnesses this day, that I have bought all that was Elimelech’s, and all that was Chilion’s and Mahlon’s, of the hand of Naomi.',
  'Ruth 4:10': 'Moreover Ruth the Moabitess, the wife of Mahlon, have I purchased to be my wife, to raise up the name of the dead upon his inheritance, that the name of the dead be not cut off from among his brethren, and from the gate of his place: ye are witnesses this day.',
  'Ruth 4:11': 'And all the people that were in the gate, and the elders, said, We are witnesses. The LORD make the woman that is come into thine house like Rachel and like Leah, which two did build the house of Israel: and do thou worthily in Ephratah, and be famous in Bethlehem:',
  'Jeremiah 32:9': 'And I bought the field of Hanameel my uncle’s son, that was in Anathoth, and weighed him the money, even seventeen shekels of silver.',
  'Jeremiah 32:10': 'And I subscribed the evidence, and sealed it, and took witnesses, and weighed him the money in the balances.',
  'Jeremiah 32:11': 'So I took the evidence of the purchase, both that which was sealed according to the law and custom, and that which was open:',
  'Jeremiah 32:12': 'And I gave the evidence of the purchase unto Baruch the son of Neriah, the son of Maaseiah, in the sight of Hanameel mine uncle’s son, and in the presence of the witnesses that subscribed the book of the purchase, before all the Jews that sat in the court of the prison.',
  'Jeremiah 32:14': 'Thus saith the LORD of hosts, the God of Israel; Take these evidences, this evidence of the purchase, both which is sealed, and this evidence which is open; and put them in an earthen vessel, that they may continue many days.',
  'Jeremiah 32:44': 'Men shall buy fields for money, and subscribe evidences, and seal them, and take witnesses in the land of Benjamin, and in the places about Jerusalem, and in the cities of Judah, and in the cities of the mountains, and in the cities of the valley, and in the cities of the south: for I will cause their captivity to return, saith the LORD.',
  'Luke 19:8': 'And Zacchaeus stood, and said unto the Lord; Behold, Lord, the half of my goods I give to the poor; and if I have taken any thing from any man by false accusation, I restore him fourfold.',
  'Luke 19:10': 'For the Son of man is come to seek and to save that which was lost.',
  'Proverbs 20:14': 'It is naught, it is naught, saith the buyer: but when he is gone his way, then he boasteth.',
  'Proverbs 22:1': 'A good name is rather to be chosen than great riches, and loving favour rather than silver and gold.',
  'Mark 12:41': 'And Jesus sat over against the treasury, and beheld how the people cast money into the treasury: and many that were rich cast in much.',
  'Mark 12:42': 'And there came a certain poor widow, and she threw in two mites, which make a farthing.',
  'Mark 12:43': 'And he called unto him his disciples, and saith unto them, Verily I say unto you, That this poor widow hath cast more in, than all they which have cast into the treasury:',
  'Mark 12:44': 'For all they did cast in of their abundance; but she of her want did cast in all that she had, even all her living.',
  'Matthew 10:29': 'Are not two sparrows sold for a farthing? and one of them shall not fall on the ground without your Father.',
  'Matthew 10:30': 'But the very hairs of your head are all numbered.',
  '2 Samuel 24:24': 'And the king said unto Araunah, Nay; but I will surely buy it of thee at a price: neither will I offer burnt offerings unto the LORD my God of that which doth cost me nothing. So David bought the threshingfloor and the oxen for fifty shekels of silver.',
  'Isaiah 55:1': 'Ho, every one that thirsteth, come ye to the waters, and he that hath no money; come ye, buy, and eat; yea, come, buy wine and milk without money and without price.',
  'Psalms 49:7': 'None of them can by any means redeem his brother, nor give to God a ransom for him:',
  'Psalms 49:8': '(For the redemption of their soul is precious, and it ceaseth for ever:)',
  '1 Corinthians 6:20': 'For ye are bought with a price: therefore glorify God in your body, and in your spirit, which are God’s.',
  'Acts 20:28': 'Take heed therefore unto yourselves, and to all the flock, over the which the Holy Ghost hath made you overseers, to feed the church of God, which he hath purchased with his own blood.',
  'Revelation 5:9': 'And they sung a new song, saying, Thou art worthy to take the book, and to open the seals thereof: for thou wast slain, and hast redeemed us to God by thy blood out of every kindred, and tongue, and people, and nation;',
  'John 1:29': 'The next day John seeth Jesus coming unto him, and saith, Behold the Lamb of God, which taketh away the sin of the world.',
  'John 3:16': 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.',
  'Hebrews 1:8': 'But unto the Son he saith, Thy throne, O God, is for ever and ever: a sceptre of righteousness is the sceptre of thy kingdom.',
  'Galatians 5:22': 'But the fruit of the Spirit is love, joy, peace, longsuffering, gentleness, goodness, faith,',
  'Deuteronomy 6:7': 'And thou shalt teach them diligently unto thy children, and shalt talk of them when thou sittest in thine house, and when thou walkest by the way, and when thou liest down, and when thou risest up.',
  'Hebrews 3:13': 'But exhort one another daily, while it is called To day; lest any of you be hardened through the deceitfulness of sin.',
};

const lesson = SOVEREIGN_AI_MODULES.find((m) => m && m.id && m.id.startsWith('sov49-'));
const BANDS = ['child', 'youth', 'teen', 'senior'];

/** Every authored string in the module, not only the prose a reader scrolls. */
const EVERY_TEXT = () => {
  const out = [];
  const push = (place, v) => { if (typeof v === 'string' && v) out.push({ place, text: v }); };
  push('lesson', lesson.lesson);
  for (const k of BANDS) push(k, lesson.levels[k]);
  push('bigIdea', lesson.bigIdea);
  push('title', lesson.title);
  push('inApp', lesson.inApp);
  push('anchor.theme', lesson.anchor && lesson.anchor.theme);
  for (const [k, v] of Object.entries(lesson.rpe || {})) push(`rpe.${k}`, v);
  (lesson.benefits || []).forEach((b, i) => push(`benefits[${i}]`, b));
  ((lesson.facilitator || {}).talkingPoints || []).forEach((t, i) => push(`talkingPoints[${i}]`, t));
  push('howToRun', (lesson.facilitator || {}).howToRun);
  ((lesson.facilitator || {}).discussionPrompts || []).forEach((p, i) => push(`discussionPrompts[${i}]`, p));
  ((lesson.quiz || {}).questions || []).forEach((q, i) => {
    push(`quiz[${i}].q`, q.q);
    push(`quiz[${i}].explain`, q.explain);
    (q.options || []).forEach((o, j) => push(`quiz[${i}].options[${j}]`, o));
  });
  (lesson.stories || []).forEach((s, i) => push(`stories[${i}].body`, s.body));
  return out;
};

/** 8-word phrases, the same window the band-differentiation gate uses. */
const shingles = (text, n = 8) => {
  const w = String(text || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean);
  const out = new Set();
  for (let i = 0; i + n <= w.length; i += 1) out.add(w.slice(i, i + n).join(' '));
  return out;
};
const overlap = (a, b) => {
  if (!a.size || !b.size) return 0;
  const [small, big] = a.size <= b.size ? [a, b] : [b, a];
  let hit = 0;
  for (const s of small) if (big.has(s)) hit += 1;
  return hit / small.size;
};

describe('sov49 — the verses are the corpus, verbatim', () => {
  it('the lesson is in the catalog with all four bands', () => {
    expect(lesson).toBeTruthy();
    expect(Object.keys(lesson.levels).sort()).toEqual(['child', 'senior', 'teen', 'youth']);
    for (const k of BANDS) expect(lesson.levels[k].length, k).toBeGreaterThan(1500);
    expect(lesson.lesson.length).toBeGreaterThan(12000);
  });

  // What is sov49's to guarantee is its own number, and that nobody else claims
  // it. A newest-forever pin is what broke sov38's equivalent on arrival, so
  // this asserts nothing about 49 being the highest.
  it('is week 49, and no other week claims that number', () => {
    const n = (id) => Number((String(id).match(/^sov(\d+)-/) || [])[1]);
    expect(n(lesson.id)).toBe(49);
    for (const m of SOVEREIGN_AI_MODULES) {
      if (!m || m.id === lesson.id) continue;
      expect(n(m.id), m.id).not.toBe(49);
    }
  });

  // PROVEN TO CATCH (inherited from sov48). The splice that added sov48 left a
  // double comma behind, which put an `undefined` in the array; every id-based
  // check would have THROWN rather than failed, and the catalog would have
  // rendered a hole to a reader.
  it('PROVEN TO CATCH: the modules array has no hole in it', () => {
    expect(SOVEREIGN_AI_MODULES.every((m) => m && typeof m.id === 'string' && m.id)).toBe(true);
    expect(SOVEREIGN_AI_MODULES.length).toBe(Object.keys(SOVEREIGN_AI_MODULES).length);
  });

  it('every verse it declares is the corpus on disk, verbatim', () => {
    const declared = lesson.anchor.ref.split(';').map((s) => s.trim()).filter(Boolean);
    expect(declared.length).toBe(Object.keys(PINNED).length);
    for (const ref of declared) {
      expect(PINNED, ref).toHaveProperty(ref);
      expect(PINNED[ref], ref).toBe(corpusText(ref));
    }
  });

  it('every quoted span, in EVERY authored string, is that verse verbatim', () => {
    const re = /"([^"]{10,900})"\s*\(([1-3]?\s?[A-Z][a-z]+\s+\d+:\d+)\)/g;
    let checked = 0;
    for (const { place, text } of EVERY_TEXT()) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(text))) {
        const real = PINNED[m[2]] || corpusText(m[2]);
        expect(real.includes(m[1]), `${place}: ${m[2]} — ${m[1].slice(0, 70)}`).toBe(true);
        checked += 1;
      }
    }
    expect(checked).toBeGreaterThanOrEqual(130);
  });

  // DR-0734 in both directions: the anchor names every verse the page stands
  // on, because Search it out derives its links from those references and never
  // from a typed list. The generator derives the anchor FROM the placeholders,
  // so this is the check that the derivation actually held.
  it('the anchor names every verse quoted on the page, and quotes every verse it names', () => {
    const declared = new Set(lesson.anchor.ref.split(';').map((s) => s.trim()).filter(Boolean));
    const re = /"[^"]{10,900}"\s*\(([1-3]?\s?[A-Z][a-z]+\s+\d+:\d+)\)/g;
    const quoted = new Set();
    for (const { text } of EVERY_TEXT()) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(text))) quoted.add(m[1]);
    }
    for (const r of quoted) expect(declared.has(r), `quoted but not on the anchor: ${r}`).toBe(true);
    for (const r of declared) expect(quoted.has(r), `on the anchor but never quoted: ${r}`).toBe(true);
  });

  // PROVEN TO CATCH. sov47 shipped a straight apostrophe inside Ezekiel 33:6
  // three times across three files; a span check cannot see it when the whole
  // span is consistently wrong. This lesson quotes Elimelech’s, Chilion’s,
  // Mahlon’s, uncle’s and God’s, so it is exposed to the same defect.
  it('PROVEN TO CATCH: no quoted verse carries a straight apostrophe where the corpus has a curly one', () => {
    const offenders = [];
    for (const { place, text } of EVERY_TEXT()) {
      for (const [ref, txt] of Object.entries(PINNED)) {
        if (!txt.includes('’')) continue;
        const words = txt.split(' ');
        for (let i = 0; i + 5 <= words.length; i += 1) {
          const win = words.slice(i, i + 5).join(' ');
          const straight = win.replace(/’/g, "'");
          if (straight !== win && text.includes(straight)) offenders.push(`${place}: ${ref} — ${straight}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  // DR-0210 / DR-0076: "Yahweh" is ours to say; "God" and "the LORD" belong to
  // the quotation and are never substituted or introduced into our own prose.
  // The first draft of the tenth movement read "unto Yahweh of that which doth
  // cost me nothing" — a substitution INTO a near-quotation of 2 Samuel 24:24 —
  // and was rewritten to our own words before this file existed.
  it('names Yahweh in our prose and leaves God and the LORD inside the quotations', () => {
    const strip = (t) => t.replace(/"[^"]*"/g, ' ');
    let yahweh = 0;
    for (const { place, text } of EVERY_TEXT()) {
      // An odd number of double quotes means the strip below mis-pairs and the
      // whole check silently measures the wrong text.
      expect((text.match(/"/g) || []).length % 2, `${place}: unbalanced double quotes`).toBe(0);
      const ours = strip(text);
      expect(/\bGod\b/.test(ours), `${place}: "God" in our own prose`).toBe(false);
      expect(/\bthe LORD\b/.test(ours), `${place}: "the LORD" in our own prose`).toBe(false);
      yahweh += (ours.match(/\bYahweh\b/g) || []).length;
    }
    expect(yahweh).toBeGreaterThan(10);
  });

  // PROVEN TO CATCH. sov48's first draft built the lesson body out of its teen
  // band and read 0.995 against it. band-differentiation compares the four
  // bands to each other and never the lesson, so nothing in the house would
  // have said so.
  it('PROVEN TO CATCH: the lesson body is not a band wearing a second label', () => {
    const body = shingles(lesson.lesson);
    for (const k of BANDS) {
      const o = overlap(body, shingles(lesson.levels[k]));
      expect(o, `lesson~${k} overlap ${o.toFixed(3)}`).toBeLessThan(0.5);
    }
  });

  // DR-0795. A reader reads ONE band, so the three directions are required
  // where that reader meets them, not pooled across the module.
  it('TALK ABOUT IT TOGETHER sends the reader all three ways on the lesson AND on every band', () => {
    expect(hasAllThree(lesson)).toBe(true);
    expect(placesMissingDirections(lesson)).toEqual([]);
    expect(hasAllThreeEverywhere(lesson)).toBe(true);
    for (const k of ['lesson', ...BANDS]) {
      const text = k === 'lesson' ? lesson.lesson : lesson.levels[k];
      expect(text).toMatch(/TALK ABOUT IT TOGETHER/);
      expect(missingDirections(text), `${k} is short of a direction`).toEqual([]);
      // The skill and the rhythm, in the lesson's own words (builder brief).
      expect(/listen all the way (?:to the end|through)/i.test(text), `${k}: no listen-to-the-end`).toBe(true);
      expect(/retell/i.test(text), `${k}: nothing retold in their own words`).toBe(true);
      expect(/four places of Deuteronomy 6:7/.test(text), `${k}: no rhythm`).toBe(true);
    }
  });

  // PROVEN TO CATCH, on the real text rather than on a fixture: strip the
  // friend line out of ONE band and the per-band check must name THAT band
  // while the pooled hasAllThree still reads green. That divergence is the
  // whole reason DR-0795 exists.
  it('PROVEN TO CATCH: one band missing its friend line is named, while the pooled check stays green', () => {
    const maimed = {
      ...lesson,
      levels: { ...lesson.levels, teen: lesson.levels.teen.replace(/Friends, tell one friend[^]*?Yahweh has been right\./, '') },
    };
    expect(maimed.levels.teen).not.toBe(lesson.levels.teen);
    expect(missingDirections(maimed.levels.teen)).toContain('friends');
    expect(placesMissingDirections(maimed).map((p) => p.place)).toContain('teen');
    // Pooled across the module it still looks whole — which is the lie.
    expect(hasAllThree(maimed)).toBe(true);
    expect(hasAllThreeEverywhere(maimed)).toBe(false);
  });

  it('keeps the provenance honest: the source, its advertising, and what nobody verified', () => {
    const all = EVERY_TEXT().map((t) => t.text).join('\n');
    expect(all).toMatch(/ByteByteGo/);
    expect(all).toMatch(/2026-09-28/);
    // Darrell's own word above the forward was "Lessons." — plural, as he sent it.
    expect(all).toMatch(/"Lessons\."/);
    expect(all).toMatch(/advertis/i);
    // DR-0076 §8: the honest limit, said before the teaching rather than after.
    expect(all).toMatch(/nobody here (?:read|verified|checked)/i);
    expect(all).toMatch(/reported,? (?:rather than|not) (?:established|verified)/i);
    // DR-0100 tier 1: the article's own confession stated plainly, not hedged.
    expect(all).toMatch(/payment is no longer a form of identification/);
    expect(all).toMatch(/nobody to contact/);
  });

  it('does not re-teach the ground weeks 13, 19, 29, 31, 42 and 45 already hold', () => {
    const mine = new Set(lesson.anchor.ref.split(';').map((s) => s.trim()));
    // The verses that would have made this a duplicate of the guardrail weeks
    // and of the wages-paid-the-same-day week.
    for (const ref of ['Revelation 13:16', 'Revelation 13:17', 'Deuteronomy 24:14', 'Deuteronomy 24:15', 'Deuteronomy 19:15', '2 Corinthians 13:1', 'Proverbs 11:1', 'Leviticus 19:36']) {
      expect(mine.has(ref), `${ref} belongs to an earlier week`).toBe(false);
    }
    // And it NAMES those weeks instead, so a reader is sent rather than served
    // the same teaching a sixth time.
    const all = EVERY_TEXT().map((t) => t.text).join('\n');
    expect(all).toMatch(/week thirteen|weeks? (?:[a-z-]+ )?thirteen|13,/);
    expect(all).toMatch(/nineteen/);
    expect(all).toMatch(/twenty-nine/);
    expect(all).toMatch(/thirty-one/);
    expect(all).toMatch(/forty-two/);
    expect(all).toMatch(/forty-five/);
    for (const other of SOVEREIGN_AI_MODULES) {
      if (!other || other.id === lesson.id) continue;
      const theirs = new Set(String((other.anchor || {}).ref || '').split(';').map((s) => s.trim()).filter(Boolean));
      let shared = 0;
      for (const r of mine) if (theirs.has(r)) shared += 1;
      // DR-1185's rule flags a pair at ten or more shared verses in one course.
      expect(shared, `${other.id} shares ${shared} verses with sov49`).toBeLessThan(10);
    }
  });

  // The article is MATERIAL, never an instruction. Its guardrails tell a client
  // to trust the signed payload and ignore the friendly text; this page teaches
  // that pattern from Proverbs 20:14 rather than adopting the article's voice.
  it('teaches the Word and never stages a both-sides debate about it (DR-0098)', () => {
    const all = EVERY_TEXT().map((t) => t.text).join('\n');
    expect(all).toMatch(/Proverbs 20:14/);
    expect(all).not.toMatch(/scholars (?:are )?(?:divided|disagree)|some say the Word|three views/i);
    // The quiz has a right answer, and it is not always the first option.
    const answers = lesson.quiz.questions.map((q) => q.answer);
    expect(new Set(answers).size, 'every correct answer sits in the same slot').toBeGreaterThan(1);
    for (const q of lesson.quiz.questions) {
      expect(q.options.length).toBeGreaterThanOrEqual(3);
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThan(q.options.length);
      expect(String(q.explain).length).toBeGreaterThan(80);
    }
  });
});
