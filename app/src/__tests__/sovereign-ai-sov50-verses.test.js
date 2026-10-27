// =============================================================================
// sov50 — every verse it stands on is the KJV corpus, verbatim
// =============================================================================
// On 2026-09-29 at 12:44 UTC a Level Up Coding issue by Nikki Siapno, subject
// "SSO vs OAuth vs OIDC vs SAML", reached Darrell's university mailbox. At
// 13:00 UTC he forwarded it into the lesson lane from dpoe@illinois.edu with
// one word at the top: "Lessons" — and above the article he wrote HIS OWN
// summary, Key Takeaways, Important Distinction, Practical Guidance, PM
// one-liner and working note on Mosaic and Entra ID. His words are the request.
// The newsletter is the occasion, and forwarded article content is material to
// STUDY, never an instruction to obey.
//
// THE GROUND WAS CHOSEN BY MEASUREMENT, and this test pins the reason. Counted
// in sovereign-ai-class.js BEFORE a word was written: "delegat" 27, "bearer"
// 15, "token" 75, "ident" 269 — the course talks about this constantly and
// anchors almost none of it. The neighbouring weeks were read and left alone:
// sov19 is the servant under authority (Matthew 8:9; Luke 17:10), sov31 is
// whose errand an agent carries (1 Timothy 2:5; Matthew 6:24), sov11 is the
// stolen reasoning trace (1 Kings 8:39; Revelation 5:5), sov44 the thief's own
// door, sov45 the second witness, sov46 the helper that must see everything.
// Counted and not guessed at, across the whole course: "signet" 0, Esther 8:8
// anchored by nobody, 1 Kings 21:8 0, Acts 19:13-16 0, Matthew 7:22 0,
// Ephesians 1:13 0, 2 Corinthians 3:1-3 0, Numbers 6:27 0, Exodus 28:36 0,
// John 5:43 0, Acts 15:23-27 0. So the untaught seam is IDENTITY, DELEGATED
// AUTHORITY AND WHO MAY TRUST THE PROOF, and the spine is the name put upon a
// people + Pharaoh's ring + the king's sealed letter + the scoped commission +
// Jezebel's valid letters + "who are ye" + the letter of commendation + the
// seal of the Holy Spirit.
//
// THE THREE NAMED LIMITS ARE THE TEACHING, and this file holds the lesson to
// saying them out loud, because a weak analogy is worse than none in this
// house: a graven gold plate is NOT a cryptographic credential, Yahweh does NOT
// authenticate anybody (verification is a remedy for not knowing and He has no
// such lack), and the seal of the Holy Spirit is NOT a bearer token anybody
// presents. A later edit that quietly turns one of them into a cute parallel
// fails here.
//
// What this pins beyond the fifty-four verses:
//   * the curly apostrophe, because sov47 shipped "watchman's" for the corpus's
//     "watchman’s" three times in three files before a checker caught it. A
//     straight apostrophe inside a quoted verse is an un-verbatim quote, and
//     this lesson quotes Ahab’s, Aaron’s, Joseph’s, the king’s and Ahasuerus’.
//   * the DR-0210 bright line: "Yahweh" in OUR prose, "God" and "the LORD" only
//     ever inside a quotation, where the KJV's wording is left exactly alone.
//     Eleven of these verses carry one or the other inside the quotation.
//   * that the lesson body is not a band wearing a second label (the sov48
//     defect: a first draft read 0.995 against its own teen band).
//   * that the modules array has no HOLE in it (the sov48 defect: a splice left
//     "},," behind and put an `undefined` in the catalog). This lesson's own
//     first splice produced the OPPOSITE break — main's array ends "}\n];" with
//     no trailing comma, so appending "block," produced "}\n  {" and a parse
//     error — which is why scripts/sov50-fill.mjs measures the tail instead of
//     copying an earlier script's assumption.
//   * the three talk-together directions BY THEIR LITERAL TEXT on the lesson
//     AND on each band separately (DR-0795), with the per-band check proven to
//     catch a band that is short while the pooled module still reads green.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SOVEREIGN_AI_MODULES } from '../lib/sovereign-ai-class.js';
import { hasAllThree, placesMissingDirections, hasAllThreeEverywhere } from '../lib/talk-together.js';
import { formatLessonText } from '../lib/lesson-format.js';

const CORPUS = join(process.cwd(), 'public', 'bible', 'kjv');

/** The verse exactly as the corpus on disk has it. No normalisation. */
function corpusText(ref) {
  const m = /^(.+?)\s+(\d+):(\d+)$/.exec(ref.trim());
  const book = m[1].trim().replace(/^Psalm$/i, 'Psalms').replace(/\s+/g, '');
  const data = JSON.parse(readFileSync(join(CORPUS, `${book}.json`), 'utf8'));
  return data.chapters[Number(m[2]) - 1][Number(m[3]) - 1];
}

const PINNED = {
  'Isaiah 43:1': "But now thus saith the LORD that created thee, O Jacob, and he that formed thee, O Israel, Fear not: for I have redeemed thee, I have called thee by thy name; thou art mine.",
  '2 Timothy 2:19': "Nevertheless the foundation of God standeth sure, having this seal, The Lord knoweth them that are his. And, Let every one that nameth the name of Christ depart from iniquity.",
  'Exodus 28:36': "And thou shalt make a plate of pure gold, and grave upon it, like the engravings of a signet, HOLINESS TO THE LORD.",
  'Exodus 28:38': "And it shall be upon Aaron’s forehead, that Aaron may bear the iniquity of the holy things, which the children of Israel shall hallow in all their holy gifts; and it shall be always upon his forehead, that they may be accepted before the LORD.",
  'Revelation 3:12': "Him that overcometh will I make a pillar in the temple of my God, and he shall go no more out: and I will write upon him the name of my God, and the name of the city of my God, which is new Jerusalem, which cometh down out of heaven from my God: and I will write upon him my new name.",
  'Proverbs 22:1': "A good name is rather to be chosen than great riches, and loving favour rather than silver and gold.",
  'Genesis 41:41': "And Pharaoh said unto Joseph, See, I have set thee over all the land of Egypt.",
  'Genesis 41:42': "And Pharaoh took off his ring from his hand, and put it upon Joseph’s hand, and arrayed him in vestures of fine linen, and put a gold chain about his neck;",
  'Genesis 41:44': "And Pharaoh said unto Joseph, I am Pharaoh, and without thee shall no man lift up his hand or foot in all the land of Egypt.",
  'Esther 8:8': "Write ye also for the Jews, as it liketh you, in the king’s name, and seal it with the king’s ring: for the writing which is written in the king’s name, and sealed with the king’s ring, may no man reverse.",
  'Esther 8:10': "And he wrote in the king Ahasuerus’ name, and sealed it with the king’s ring, and sent letters by posts on horseback, and riders on mules, camels, and young dromedaries:",
  'Matthew 10:1': "And when he had called unto him his twelve disciples, he gave them power against unclean spirits, to cast them out, and to heal all manner of sickness and all manner of disease.",
  'Matthew 10:5': "These twelve Jesus sent forth, and commanded them, saying, Go not into the way of the Gentiles, and into any city of the Samaritans enter ye not:",
  'Luke 10:19': "Behold, I give unto you power to tread on serpents and scorpions, and over all the power of the enemy: and nothing shall by any means hurt you.",
  'Matthew 28:18': "And Jesus came and spake unto them, saying, All power is given unto me in heaven and in earth.",
  'Matthew 28:19': "Go ye therefore, and teach all nations, baptizing them in the name of the Father, and of the Son, and of the Holy Ghost:",
  'Acts 15:24': "Forasmuch as we have heard, that certain which went out from us have troubled you with words, subverting your souls, saying, Ye must be circumcised, and keep the law: to whom we gave no such commandment:",
  '1 Kings 21:8': "So she wrote letters in Ahab’s name, and sealed them with his seal, and sent the letters unto the elders and to the nobles that were in his city, dwelling with Naboth.",
  '1 Kings 21:9': "And she wrote in the letters, saying, Proclaim a fast, and set Naboth on high among the people:",
  '1 Kings 21:11': "And the men of his city, even the elders and the nobles who were the inhabitants in his city, did as Jezebel had sent unto them, and as it was written in the letters which she had sent unto them.",
  'Acts 19:13': "Then certain of the vagabond Jews, exorcists, took upon them to call over them which had evil spirits the name of the Lord Jesus, saying, We adjure you by Jesus whom Paul preacheth.",
  'Acts 19:15': "And the evil spirit answered and said, Jesus I know, and Paul I know; but who are ye?",
  'Matthew 7:23': "And then will I profess unto them, I never knew you: depart from me, ye that work iniquity.",
  'Romans 16:1': "I commend unto you Phebe our sister, which is a servant of the church which is at Cenchrea:",
  'Romans 16:2': "That ye receive her in the Lord, as becometh saints, and that ye assist her in whatsoever business she hath need of you: for she hath been a succourer of many, and of myself also.",
  'Acts 15:27': "We have sent therefore Judas and Silas, who shall also tell you the same things by mouth.",
  'Ephesians 1:13': "In whom ye also trusted, after that ye heard the word of truth, the gospel of your salvation: in whom also after that ye believed, ye were sealed with that holy Spirit of promise,",
  'John 1:29': "The next day John seeth Jesus coming unto him, and saith, Behold the Lamb of God, which taketh away the sin of the world.",
  'John 3:16': "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.",
  'Hebrews 1:8': "But unto the Son he saith, Thy throne, O God, is for ever and ever: a sceptre of righteousness is the sceptre of thy kingdom.",
  'John 5:43': "I am come in my Father’s name, and ye receive me not: if another shall come in his own name, him ye will receive.",
  'Numbers 6:27': "And they shall put my name upon the children of Israel; and I will bless them.",
  'Jeremiah 29:21': "Thus saith the LORD of hosts, the God of Israel, of Ahab the son of Kolaiah, and of Zedekiah the son of Maaseiah, which prophesy a lie unto you in my name; Behold, I will deliver them into the hand of Nebuchadrezzar king of Babylon; and he shall slay them before your eyes;",
  'Matthew 7:22': "Many will say to me in that day, Lord, Lord, have we not prophesied in thy name? and in thy name have cast out devils? and in thy name done many wonderful works?",
  '2 Corinthians 3:1': "Do we begin again to commend ourselves? or need we, as some others, epistles of commendation to you, or letters of commendation from you?",
  'Acts 18:27': "And when he was disposed to pass into Achaia, the brethren wrote, exhorting the disciples to receive him: who, when he was come, helped them much which had believed through grace:",
  'Nehemiah 2:7': "Moreover I said unto the king, If it please the king, let letters be given me to the governors beyond the river, that they may convey me over till I come into Judah;",
  'Nehemiah 2:9': "Then I came to the governors beyond the river, and gave them the king’s letters. Now the king had sent captains of the army and horsemen with me.",
  'Acts 9:2': "And desired of him letters to Damascus to the synagogues, that if he found any of this way, whether they were men or women, he might bring them bound unto Jerusalem.",
  'Acts 15:23': "And they wrote letters by them after this manner; The apostles and elders and brethren send greeting unto the brethren which are of the Gentiles in Antioch and Syria and Cilicia:",
  '2 Corinthians 3:2': "Ye are our epistle written in our hearts, known and read of all men:",
  '2 Corinthians 3:3': "Forasmuch as ye are manifestly declared to be the epistle of Christ ministered by us, written not with ink, but with the Spirit of the living God; not in tables of stone, but in fleshy tables of the heart.",
  '2 Corinthians 1:22': "Who hath also sealed us, and given the earnest of the Spirit in our hearts.",
  'Philippians 2:9': "Wherefore God also hath highly exalted him, and given him a name which is above every name:",
  'Philippians 2:10': "That at the name of Jesus every knee should bow, of things in heaven, and things in earth, and things under the earth;",
  'Acts 4:7': "And when they had set them in the midst, they asked, By what power, or by what name, have ye done this?",
  'Acts 4:10': "Be it known unto you all, and to all the people of Israel, that by the name of Jesus Christ of Nazareth, whom ye crucified, whom God raised from the dead, even by him doth this man stand here before you whole.",
  'Colossians 3:17': "And whatsoever ye do in word or deed, do all in the name of the Lord Jesus, giving thanks to God and the Father by him.",
  'Mark 6:7': "And he called unto him the twelve, and began to send them forth by two and two; and gave them power over unclean spirits;",
  'Acts 19:16': "And the man in whom the evil spirit was leaped on them, and overcame them, and prevailed against them, so that they fled out of that house naked and wounded.",
  'Philippians 2:11': "And that every tongue should confess that Jesus Christ is Lord, to the glory of God the Father.",
  'Galatians 5:22': "But the fruit of the Spirit is love, joy, peace, longsuffering, gentleness, goodness, faith,",
  'Deuteronomy 6:7': "And thou shalt teach them diligently unto thy children, and shalt talk of them when thou sittest in thine house, and when thou walkest by the way, and when thou liest down, and when thou risest up.",
  'Hebrews 3:13': "But exhort one another daily, while it is called To day; lest any of you be hardened through the deceitfulness of sin.",
};

const lesson = SOVEREIGN_AI_MODULES.find((m) => m && m.id && m.id.startsWith('sov50-'));

/** Every authored string in the module, not only the prose a reader scrolls. */
const EVERY_TEXT = () => {
  const out = [];
  const push = (place, v) => { if (typeof v === 'string' && v) out.push({ place, text: v }); };
  push('lesson', lesson.lesson);
  for (const k of ['child', 'youth', 'teen', 'senior']) push(k, lesson.levels[k]);
  push('bigIdea', lesson.bigIdea);
  push('inApp', lesson.inApp);
  push('anchor.theme', lesson.anchor && lesson.anchor.theme);
  for (const [k, v] of Object.entries(lesson.rpe || {})) push(`rpe.${k}`, v);
  (lesson.benefits || []).forEach((b, i) => push(`benefits[${i}]`, b));
  ((lesson.facilitator || {}).talkingPoints || []).forEach((t, i) => push(`talkingPoints[${i}]`, t));
  push('howToRun', (lesson.facilitator || {}).howToRun);
  ((lesson.facilitator || {}).discussionPrompts || []).forEach((p, i) => push(`discussionPrompts[${i}]`, p));
  ((lesson.quiz || {}).questions || []).forEach((q, i) => {
    push(`quiz[${i}].q`, q.q); push(`quiz[${i}].explain`, q.explain);
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

describe('sov50 — the verses are the corpus, verbatim', () => {
  it('the lesson is in the catalog with all four bands', () => {
    expect(lesson).toBeTruthy();
    expect(Object.keys(lesson.levels).sort()).toEqual(['child', 'senior', 'teen', 'youth']);
    for (const k of ['child', 'youth', 'teen', 'senior']) {
      expect(lesson.levels[k].length, k).toBeGreaterThan(1500);
    }
  });

  // What is sov50's to guarantee is its own number, and that nobody else claims
  // it. Week 49 was being written on a parallel branch, so this asserts nothing
  // about 50 being the highest — a newest-forever pin is what broke sov38's
  // equivalent on arrival.
  it('is week 50, and no other week claims that number', () => {
    const n = (id) => Number((String(id).match(/^sov(\d+)-/) || [])[1]);
    expect(n(lesson.id)).toBe(50);
    for (const m of SOVEREIGN_AI_MODULES) {
      if (!m || m.id === lesson.id) continue;
      expect(n(m.id), m.id).not.toBe(50);
    }
  });

  // PROVEN TO CATCH. sov48's splice left a double comma behind and put an
  // `undefined` in the array; this lesson's first splice produced the opposite
  // break, a missing comma and a parse error, because main's array ends with no
  // trailing comma. Either way a reader gets a hole, so the shape is pinned.
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
    expect(checked).toBeGreaterThanOrEqual(230);
  });

  // PROVEN TO CATCH. sov47 shipped a straight apostrophe inside Ezekiel 33:6
  // three times across three files; a span check cannot see it when the whole
  // span is consistently wrong. This lesson quotes five possessives.
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
    // And the pins themselves really do carry curly apostrophes, or the check
    // above would be theatre that can never fail.
    expect(Object.values(PINNED).filter((t) => t.includes('’')).length).toBeGreaterThanOrEqual(5);
  });

  // DR-0210 / DR-0076: "Yahweh" is ours to say; "God" and "the LORD" belong to
  // the quotation and are never substituted or introduced into our own prose.
  // Isaiah 43:1, Exodus 28:36, Exodus 28:38, 2 Timothy 2:19, Philippians 2:11,
  // John 1:29, John 3:16 and Hebrews 1:8 all carry one or the other inside the
  // quotation, which is exactly where it stays.
  it('names Yahweh in our prose and leaves God and the LORD inside the quotations', () => {
    const strip = (t) => t.replace(/"[^"]*"/g, ' ');
    let yahweh = 0;
    for (const { place, text } of EVERY_TEXT()) {
      const ours = strip(text);
      expect(/\bGod\b/.test(ours), `${place}: "God" in our own prose`).toBe(false);
      expect(/\bthe LORD\b/.test(ours), `${place}: "the LORD" in our own prose`).toBe(false);
      expect(/\b(Satan|Lucifer|The devil|The Adversary|The Accuser|Baal)\b/.test(ours), `${place}: the adversary capitalised`).toBe(false);
      yahweh += (ours.match(/\bYahweh\b/g) || []).length;
    }
    expect(yahweh).toBeGreaterThan(20);
    // The bright line only means something if the quotations really do carry
    // the words our prose refuses: never substituted, never swept.
    const quoted = EVERY_TEXT().map((t) => t.text).join('\n');
    expect(quoted).toMatch(/the LORD that created thee/);
    expect(quoted).toMatch(/HOLINESS TO THE LORD/);
  });

  // PROVEN TO CATCH. sov48's first draft built the lesson body out of its teen
  // band and read 0.995 against it; band-differentiation compares the four
  // bands to each other and never the lesson, so nothing in the house would
  // have said so. This lesson's own first draft read 0.611 at teen and the teen
  // band was rewritten in its own register because of this check.
  it('PROVEN TO CATCH: the lesson body is not a band wearing a second label', () => {
    const body = shingles(lesson.lesson);
    for (const k of ['child', 'youth', 'teen', 'senior']) {
      const o = overlap(body, shingles(lesson.levels[k]));
      expect(o, `lesson~${k} overlap ${o.toFixed(3)}`).toBeLessThan(0.5);
    }
  });

  // THE L178 DEFECT CLASS, and the reason it is here rather than in a comment:
  // course-four-bands-group-a.test.js runs this check, but its sovereign-ai
  // PARTIAL list holds only ten weeks, so nothing in the house would have run
  // it on sov50. It was run by hand once and then written down, because a
  // verification that lives in a session is not machinery (DR-0239).
  it('the reader is served every word: the renderer drops nothing from any band', () => {
    for (const place of ['child', 'youth', 'teen', 'senior', 'lesson']) {
      const text = place === 'lesson' ? lesson.lesson : lesson.levels[place];
      const flat = JSON.stringify(formatLessonText(text)).replace(/[^A-Za-z’' ]/g, ' ');
      const missing = (text.match(/[A-Za-z’']{4,}/g) || []).filter((w) => !flat.includes(w));
      expect(missing, `${place}: the renderer dropped ${missing.length} word(s)`).toEqual([]);
    }
  });

  // THE THREE DIRECTIONS, EVERYWHERE A READER READS (DR-0733 / DR-0795). The
  // pooled check is not enough, so the literal text is asserted on the lesson
  // and on each band, and the per-band instrument is proven to catch a band
  // that is short while the pooled one still reads green.
  describe('talk about it together — all three directions, in every place', () => {
    const PLACES = ['lesson', 'child', 'youth', 'teen', 'senior'];
    const textAt = (p) => (p === 'lesson' ? lesson.lesson : lesson.levels[p]);

    it('every place carries the close, the skill and the rhythm in the lesson\'s own words', () => {
      for (const p of PLACES) {
        const t = textAt(p);
        expect(t, `${p}: no TALK ABOUT IT TOGETHER`).toMatch(/TALK ABOUT IT TOGETHER/);
        expect(t, `${p}: no listening step`).toMatch(/listen all the way/i);
        expect(t, `${p}: no retell step`).toMatch(/retell/i);
        expect(t, `${p}: no Deuteronomy 6:7 rhythm`).toMatch(/four places of Deuteronomy 6:7/);
        expect(t, `${p}: no friend this week`).toMatch(/one friend this week/i);
        expect(t, `${p}: no aim`).toMatch(/until we see that Yahweh has been right/);
      }
    });

    it('every place sends the reader parents to children, children to parents, and friend to friend', () => {
      expect(hasAllThree(lesson)).toBe(true);
      expect(placesMissingDirections(lesson)).toEqual([]);
      expect(hasAllThreeEverywhere(lesson)).toBe(true);
    });

    it('PROVEN TO CATCH: stripping ONE band\'s friend line leaves the pooled check green and is still named', () => {
      const broken = {
        ...lesson,
        levels: { ...lesson.levels, teen: lesson.levels.teen.replace(/Friends, tell one friend this week[^]*?Yahweh has been right\./, '') },
      };
      // The friend line really was removed from that band, and only that band.
      expect(broken.levels.teen).not.toEqual(lesson.levels.teen);
      // Pooled: still green, because the other bands still carry a friend line.
      expect(hasAllThree(broken)).toBe(true);
      // Per band: caught, and the band is named.
      expect(hasAllThreeEverywhere(broken)).toBe(false);
      const short = placesMissingDirections(broken);
      expect(short.map((s) => s.place)).toEqual(['teen']);
      expect(short[0].missing).toContain('friends');
    });

    it('growth is measured the Word\'s way, qualitative and quantitative, never imported', () => {
      const all = `${lesson.lesson}\n${lesson.levels.teen}`;
      expect(all).toMatch(/the fruit of the Spirit is love/);
      expect(all).toMatch(/talk of them when thou sittest in thine house/);
      expect(all).toMatch(/exhort one another daily/);
    });
  });

  // The three limits are the judgment this subject needed. If a later edit
  // smooths one of them into a tidy parallel, the lesson has lost the thing it
  // was written to say.
  it('says out loud where the comparison with the Word STOPS, all three times', () => {
    const all = EVERY_TEXT().map((t) => t.text).join('\n');
    expect(all, 'the plate is not a credential').toMatch(/not a cryptographic credential/);
    expect(all, 'a weak analogy is refused by name').toMatch(/weak (analogy|comparison|story) is worse than no/i);
    expect(all, 'Yahweh does not authenticate').toMatch(/remedy for not knowing/);
    expect(all, 'the seal is not a bearer token').toMatch(/not a bearer token/);
    expect(all, 'validation proves the issuer only').toMatch(/can never prove that what (the thing|it) asks is (righteous|right)/i);
  });

  it('keeps the provenance honest: his words, the newsletter, the advertising, and what nobody verified', () => {
    const all = EVERY_TEXT().map((t) => t.text).join('\n');
    expect(all, 'the newsletter is named').toMatch(/Level Up Coding/);
    expect(all, 'its author is named').toMatch(/Nikki Siapno/);
    expect(all, 'the forward marker is quoted').toMatch(/Lessons/);
    expect(all, 'HIS words are named as the request').toMatch(/his own summary/i);
    expect(all, 'the sponsored segment is disclosed').toMatch(/advertisement/i);
    expect(all, 'the unread specifications are disclosed').toMatch(/(published )?specifications/i);
    expect(all, 'Mosaic is named as unknown to this page').toMatch(/Mosaic/);
    // And the absence that was worth reporting: the source carried no
    // lowercase-only term in capitals, so there was no conflict to carry through.
    expect(all).toMatch(/capitalised any name of the adversary/);
  });

  it('does not re-teach the ground sov19, sov31, sov44, sov45 and sov46 already hold', () => {
    const mine = new Set(lesson.anchor.ref.split(';').map((s) => s.trim()));
    // The verses that would have made this a second copy of the servant under
    // authority (sov19) or of whose errand an agent carries (sov31).
    expect(mine.has('Matthew 8:9')).toBe(false);
    expect(mine.has('Luke 17:10')).toBe(false);
    expect(mine.has('1 Timothy 2:5')).toBe(false);
    expect(mine.has('Matthew 6:24')).toBe(false);
    // And it NAMES those weeks instead, so a reader is sent rather than served
    // the same teaching again.
    const all = EVERY_TEXT().map((t) => t.text).join('\n');
    expect(all).toMatch(/week nineteen/);
    expect(all).toMatch(/week thirty-one/);
    expect(all).toMatch(/week forty-six/);
    for (const other of SOVEREIGN_AI_MODULES) {
      if (!other || other.id === lesson.id) continue;
      const theirs = new Set(String((other.anchor || {}).ref || '').split(';').map((s) => s.trim()).filter(Boolean));
      let shared = 0;
      for (const r of mine) if (theirs.has(r)) shared += 1;
      // DR-1185's rule flags a pair at ten or more shared verses in one course.
      expect(shared, `${other.id} shares ${shared} verses with sov50`).toBeLessThan(10);
    }
  });
});
