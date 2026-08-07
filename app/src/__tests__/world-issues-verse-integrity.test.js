// @vitest-environment node
// =============================================================================
// world-issues-verse-integrity — the verse-verbatim gate for the World Issues
// track (DR-0076: fetch verbatim, never from memory; DR-0259: gate-the-class).
// =============================================================================
// The Godhead Study catalog has had this protection since it shipped
// (fetch-godhead-verses.mjs + godhead-study.test.js); World Issues quoted
// Scripture inline with NO machine check that the quoted words match the
// actual KJV text — a "looked-fine-but-wasn't" class waiting to bite. This
// gate closes it for the prison-industrial-complex issue (the first authored
// under the gate) by asserting every quoted fragment below appears VERBATIM
// in the repo's own KJV (app/public/bible/kjv). New issues add their
// (ref, fragment) pairs here as part of authoring.
//
// Proven-to-catch: mutate any word of a fragment (or point a ref at the wrong
// verse) and the test fails naming the fragment. A fragment is an exact
// substring of the cited verse text — elisions are represented by SPLITTING
// into multiple fragments, never by paraphrase.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { WORLD_ISSUES, WORLD_ISSUES_META } from '../lib/world-issues-class.js';

const KJV_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'public', 'bible', 'kjv');

function kjvVerse(book, chapter, verse) {
  const data = JSON.parse(readFileSync(join(KJV_DIR, `${book}.json`), 'utf8'));
  return data.chapters[chapter - 1][verse - 1];
}

// Every Scripture fragment the prison-industrial-complex issue quotes, with
// the verse it cites. Multi-verse quotes list one entry per verse; elided
// quotes ("A... B") list each side as its own fragment.
const PRISON_ISSUE_QUOTES = [
  { ref: 'Exodus 21:16', book: 'Exodus', ch: 21, v: 16, fragments: [
    'he that stealeth a man, and selleth him, or if he be found in his hand, he shall surely be put to death',
  ] },
  { ref: 'Exodus 22:1', book: 'Exodus', ch: 22, v: 1, fragments: [
    'he shall restore five oxen for an ox, and four sheep for a sheep',
  ] },
  { ref: 'Leviticus 25:10', book: 'Leviticus', ch: 25, v: 10, fragments: [
    'proclaim liberty throughout all the land unto all the inhabitants thereof',
  ] },
  { ref: 'Deuteronomy 16:20', book: 'Deuteronomy', ch: 16, v: 20, fragments: [
    'That which is altogether just shalt thou follow',
  ] },
  { ref: 'Proverbs 17:15', book: 'Proverbs', ch: 17, v: 15, fragments: [
    'He that justifieth the wicked, and he that condemneth the just, even they both are abomination to the LORD',
  ] },
  { ref: 'Proverbs 22:22', book: 'Proverbs', ch: 22, v: 22, fragments: [
    'Rob not the poor, because he is poor',
  ] },
  { ref: 'Proverbs 22:23', book: 'Proverbs', ch: 22, v: 23, fragments: [
    'For the LORD will plead their cause, and spoil the soul of those that spoiled them',
  ] },
  { ref: 'Ecclesiastes 5:8', book: 'Ecclesiastes', ch: 5, v: 8, fragments: [
    'If thou seest the oppression of the poor, and violent perverting of judgment and justice in a province, marvel not at the matter: for he that is higher than the highest regardeth',
  ] },
  { ref: 'Ecclesiastes 12:14', book: 'Ecclesiastes', ch: 12, v: 14, fragments: [
    'God shall bring every work into judgment, with every secret thing',
  ] },
  { ref: 'Isaiah 10:1', book: 'Isaiah', ch: 10, v: 1, fragments: [
    'Woe unto them that decree unrighteous decrees, and that write grievousness which they have prescribed',
  ] },
  { ref: 'Isaiah 10:2', book: 'Isaiah', ch: 10, v: 2, fragments: [
    'To turn aside the needy from judgment, and to take away the right from the poor of my people',
  ] },
  { ref: 'Isaiah 58:6', book: 'Isaiah', ch: 58, v: 6, fragments: [
    'to loose the bands of wickedness',
    'and to let the oppressed go free',
  ] },
  { ref: 'Isaiah 61:1', book: 'Isaiah', ch: 61, v: 1, fragments: [
    'to proclaim liberty to the captives, and the opening of the prison to them that are bound',
  ] },
  { ref: 'Jeremiah 22:13', book: 'Jeremiah', ch: 22, v: 13, fragments: [
    'Woe unto him that buildeth his house by unrighteousness',
    'that useth his neighbour’s service without wages',
  ] },
  { ref: 'Amos 2:6', book: 'Amos', ch: 2, v: 6, fragments: [
    'they sold the righteous for silver, and the poor for a pair of shoes',
  ] },
  { ref: 'Micah 3:11', book: 'Micah', ch: 3, v: 11, fragments: [
    'The heads thereof judge for reward',
  ] },
  { ref: 'Matthew 25:36', book: 'Matthew', ch: 25, v: 36, fragments: [
    'I was in prison, and ye came unto me',
  ] },
  { ref: 'Luke 19:8', book: 'Luke', ch: 19, v: 8, fragments: [
    'I restore him fourfold',
  ] },
  { ref: 'Romans 13:4', book: 'Romans', ch: 13, v: 4, fragments: [
    'he beareth not the sword in vain: for he is the minister of God, a revenger to execute wrath upon him that doeth evil',
  ] },
  { ref: 'Ephesians 4:28', book: 'Ephesians', ch: 4, v: 28, fragments: [
    'let him labour',
    'that he may have to give to him that needeth',
  ] },
  { ref: 'Hebrews 13:3', book: 'Hebrews', ch: 13, v: 3, fragments: [
    'Remember them that are in bonds, as bound with them',
  ] },
  // The Kingdom-freedom layer (Darrell 2026-08-04 follow-up word: freedom for
  // the captives of sin and death).
  { ref: 'John 8:34', book: 'John', ch: 8, v: 34, fragments: [
    'Whosoever committeth sin is the servant of sin',
  ] },
  { ref: 'John 8:36', book: 'John', ch: 8, v: 36, fragments: [
    'If the Son therefore shall make you free, ye shall be free indeed',
  ] },
  { ref: '2 Timothy 2:26', book: '2Timothy', ch: 2, v: 26, fragments: [
    'taken captive by him at his will',
  ] },
  { ref: 'Hebrews 2:14', book: 'Hebrews', ch: 2, v: 14, fragments: [
    'that through death he might destroy him that had the power of death',
  ] },
  { ref: 'Hebrews 2:15', book: 'Hebrews', ch: 2, v: 15, fragments: [
    'all their lifetime subject to bondage',
  ] },
  { ref: 'Romans 8:2', book: 'Romans', ch: 8, v: 2, fragments: [
    'the law of the Spirit of life in Christ Jesus hath made me free from the law of sin and death',
  ] },
  { ref: 'Romans 6:23', book: 'Romans', ch: 6, v: 23, fragments: [
    'For the wages of sin is death; but the gift of God is eternal life through Jesus Christ our Lord',
  ] },
  { ref: 'Colossians 1:13', book: 'Colossians', ch: 1, v: 13, fragments: [
    'hath delivered us from the power of darkness, and hath translated us into the kingdom of his dear Son',
  ] },
  { ref: '1 Corinthians 15:55', book: '1Corinthians', ch: 15, v: 55, fragments: [
    'O death, where is thy sting? O grave, where is thy victory?',
  ] },
  { ref: '1 Corinthians 15:57', book: '1Corinthians', ch: 15, v: 57, fragments: [
    'thanks be to God, which giveth us the victory through our Lord Jesus Christ',
  ] },
  { ref: 'Ephesians 4:8', book: 'Ephesians', ch: 4, v: 8, fragments: [
    'led captivity captive',
  ] },
  { ref: 'Revelation 1:18', book: 'Revelation', ch: 1, v: 18, fragments: [
    'the keys of hell and of death',
  ] },
  { ref: 'Galatians 5:1', book: 'Galatians', ch: 5, v: 1, fragments: [
    'Stand fast therefore in the liberty wherewith Christ hath made us free',
  ] },
  // The Kingdoms-war layer (Darrell 2026-08-04: the 3D operational friction is
  // the surface of the war of Kingdoms — Light vs darkness, over humans and
  // souls, Eternal Peace vs Death; the deficit is Knowledge; and the war is
  // engineered macro and micro on both sides of the spectrum).
  { ref: 'Ephesians 6:12', book: 'Ephesians', ch: 6, v: 12, fragments: [
    'For we wrestle not against flesh and blood, but against principalities, against powers, against the rulers of the darkness of this world, against spiritual wickedness in high places',
  ] },
  { ref: 'John 1:5', book: 'John', ch: 1, v: 5, fragments: [
    'the light shineth in darkness; and the darkness comprehended it not',
  ] },
  { ref: '2 Corinthians 4:4', book: '2Corinthians', ch: 4, v: 4, fragments: [
    'the god of this world hath blinded the minds of them which believe not',
    'the god of this world hath blinded the minds',
  ] },
  { ref: '2 Corinthians 4:6', book: '2Corinthians', ch: 4, v: 6, fragments: [
    'God, who commanded the light to shine out of darkness, hath shined in our hearts, to give the light of the knowledge of the glory of God in the face of Jesus Christ',
    'in our hearts',
  ] },
  { ref: '1 Peter 2:9', book: '1Peter', ch: 2, v: 9, fragments: [
    'out of darkness into his marvellous light',
  ] },
  { ref: 'Acts 26:18', book: 'Acts', ch: 26, v: 18, fragments: [
    'from darkness to light',
  ] },
  { ref: 'Romans 8:6', book: 'Romans', ch: 8, v: 6, fragments: [
    'to be carnally minded is death; but to be spiritually minded is life and peace',
  ] },
  { ref: 'Isaiah 9:7', book: 'Isaiah', ch: 9, v: 7, fragments: [
    'Of the increase of his government and peace there shall be no end',
  ] },
  { ref: 'Hosea 4:6', book: 'Hosea', ch: 4, v: 6, fragments: [
    'My people are destroyed for lack of knowledge',
  ] },
  { ref: 'John 17:3', book: 'John', ch: 17, v: 3, fragments: [
    'And this is life eternal, that they might know thee the only true God, and Jesus Christ, whom thou hast sent',
    'this is life eternal, that they might know thee',
  ] },
  { ref: '2 Corinthians 10:4', book: '2Corinthians', ch: 10, v: 4, fragments: [
    'the weapons of our warfare are not carnal, but mighty through God to the pulling down of strong holds',
  ] },
  { ref: '2 Corinthians 10:5', book: '2Corinthians', ch: 10, v: 5, fragments: [
    'bringing into captivity every thought to the obedience of Christ',
    'bringing into captivity every thought',
  ] },
  { ref: 'Deuteronomy 30:19', book: 'Deuteronomy', ch: 30, v: 19, fragments: [
    'choose life, that both thou and thy seed may live',
  ] },
  { ref: 'Joshua 24:15', book: 'Joshua', ch: 24, v: 15, fragments: [
    'as for me and my house, we will serve the LORD',
  ] },
  { ref: 'Psalm 127:1', book: 'Psalms', ch: 127, v: 1, fragments: [
    'Except the LORD build the house, they labour in vain that build it',
  ] },
  { ref: 'Romans 12:2', book: 'Romans', ch: 12, v: 2, fragments: [
    'be ye transformed by the renewing of your mind',
  ] },
  { ref: 'Deuteronomy 6:7', book: 'Deuteronomy', ch: 6, v: 7, fragments: [
    'thou shalt teach them diligently unto thy children, and shalt talk of them when thou sittest in thine house',
  ] },
  // The sovereignty-and-fruits layer (Darrell 2026-08-04: Yahweh's Will is
  // ultimately done; the tree of good-and-evil still fruits in our systems;
  // the familiar evil fruit wars against the faithfulness of the Good Fruit).
  { ref: 'Isaiah 46:10', book: 'Isaiah', ch: 46, v: 10, fragments: [
    'My counsel shall stand, and I will do all my pleasure',
  ] },
  { ref: 'Matthew 6:10', book: 'Matthew', ch: 6, v: 10, fragments: [
    'Thy kingdom come. Thy will be done in earth, as it is in heaven',
  ] },
  { ref: 'Genesis 50:20', book: 'Genesis', ch: 50, v: 20, fragments: [
    'ye thought evil against me; but God meant it unto good',
  ] },
  { ref: 'Genesis 2:9', book: 'Genesis', ch: 2, v: 9, fragments: [
    'the tree of knowledge of good and evil',
  ] },
  { ref: 'Matthew 7:17', book: 'Matthew', ch: 7, v: 17, fragments: [
    'Even so every good tree bringeth forth good fruit; but a corrupt tree bringeth forth evil fruit',
  ] },
  { ref: 'Matthew 7:20', book: 'Matthew', ch: 7, v: 20, fragments: [
    'Wherefore by their fruits ye shall know them',
  ] },
  { ref: 'Galatians 5:22', book: 'Galatians', ch: 5, v: 22, fragments: [
    'the fruit of the Spirit is love, joy, peace, longsuffering, gentleness, goodness, faith',
  ] },
  { ref: 'Matthew 13:30', book: 'Matthew', ch: 13, v: 30, fragments: [
    'Let both grow together until the harvest',
  ] },
  // The actions-locate-you capstone (Darrell 2026-08-04: actions say where you
  // are — building one Kingdom or the other, Lordship proven in deed, every
  // way and means Eternally Recognized and recorded by Yahweh Himself).
  { ref: 'Matthew 7:21', book: 'Matthew', ch: 7, v: 21, fragments: [
    'Not every one that saith unto me, Lord, Lord, shall enter into the kingdom of heaven; but he that doeth the will of my Father which is in heaven',
  ] },
  { ref: 'Luke 6:46', book: 'Luke', ch: 6, v: 46, fragments: [
    'why call ye me, Lord, Lord, and do not the things which I say?',
  ] },
  { ref: 'James 1:22', book: 'James', ch: 1, v: 22, fragments: [
    'be ye doers of the word, and not hearers only, deceiving your own selves',
  ] },
  { ref: 'James 2:18', book: 'James', ch: 2, v: 18, fragments: [
    'I will shew thee my faith by my works',
  ] },
  { ref: '1 John 3:18', book: '1John', ch: 3, v: 18, fragments: [
    'let us not love in word, neither in tongue; but in deed and in truth',
  ] },
  { ref: 'Colossians 3:17', book: 'Colossians', ch: 3, v: 17, fragments: [
    'whatsoever ye do in word or deed, do all in the name of the Lord Jesus',
  ] },
  { ref: 'Colossians 3:23', book: 'Colossians', ch: 3, v: 23, fragments: [
    'heartily, as to the Lord, and not unto men',
  ] },
  { ref: 'Malachi 3:16', book: 'Malachi', ch: 3, v: 16, fragments: [
    'the LORD hearkened, and heard it, and a book of remembrance was written before him',
  ] },
  { ref: 'Revelation 20:12', book: 'Revelation', ch: 20, v: 12, fragments: [
    'the books were opened',
    'and the dead were judged out of those things which were written in the books, according to their works',
  ] },
  { ref: 'Matthew 16:27', book: 'Matthew', ch: 16, v: 27, fragments: [
    'he shall reward every man according to his works',
  ] },
  { ref: 'Hebrews 6:10', book: 'Hebrews', ch: 6, v: 10, fragments: [
    'God is not unrighteous to forget your work and labour of love',
  ] },
  { ref: 'Revelation 14:13', book: 'Revelation', ch: 14, v: 13, fragments: [
    'rest from their labours; and their works do follow them',
  ] },
  // The what-is-in-man coda (Darrell 2026-08-04: no one needed to tell Jesus
  // what is in man; the Word's diagnosis out-explains every rival frame).
  { ref: 'John 2:25', book: 'John', ch: 2, v: 25, fragments: [
    'needed not that any should testify of man: for he knew what was in man',
  ] },
  { ref: 'Jeremiah 17:9', book: 'Jeremiah', ch: 17, v: 9, fragments: [
    'The heart is deceitful above all things, and desperately wicked: who can know it?',
  ] },
  { ref: 'Jeremiah 17:10', book: 'Jeremiah', ch: 17, v: 10, fragments: [
    'I the LORD search the heart',
    'according to his ways, and according to the fruit of his doings',
  ] },
  { ref: 'Mark 7:21', book: 'Mark', ch: 7, v: 21, fragments: [
    'from within, out of the heart of men, proceed evil thoughts',
  ] },
  { ref: 'Genesis 8:21', book: 'Genesis', ch: 8, v: 21, fragments: [
    'the imagination of man’s heart is evil from his youth',
  ] },
  // The explorer's posture (Darrell 2026-08-04: "I'm exploring whats in man
  // and need Jesus to explain it to me").
  { ref: 'Psalm 139:23', book: 'Psalms', ch: 139, v: 23, fragments: [
    'Search me, O God, and know my heart: try me, and know my thoughts',
  ] },
  { ref: 'Psalm 139:24', book: 'Psalms', ch: 139, v: 24, fragments: [
    'And see if there be any wicked way in me, and lead me in the way everlasting',
  ] },
  { ref: 'Luke 24:45', book: 'Luke', ch: 24, v: 45, fragments: [
    'Then opened he their understanding, that they might understand the scriptures',
  ] },
  { ref: 'John 16:13', book: 'John', ch: 16, v: 13, fragments: [
    'will guide you into all truth',
  ] },
  { ref: 'James 1:5', book: 'James', ch: 1, v: 5, fragments: [
    'If any of you lack wisdom, let him ask of God, that giveth to all men liberally, and upbraideth not; and it shall be given him',
  ] },
  // The Words-over-every-voice close (Darrell 2026-08-04: "so I read the
  // Words Jesus left more than I do any other Voice").
  { ref: 'John 6:63', book: 'John', ch: 6, v: 63, fragments: [
    'the words that I speak unto you, they are spirit, and they are life',
  ] },
  { ref: 'John 6:68', book: 'John', ch: 6, v: 68, fragments: [
    'Lord, to whom shall we go? thou hast the words of eternal life',
  ] },
  { ref: 'Matthew 24:35', book: 'Matthew', ch: 24, v: 35, fragments: [
    'Heaven and earth shall pass away, but my words shall not pass away',
  ] },
  { ref: 'John 10:27', book: 'John', ch: 10, v: 27, fragments: [
    'My sheep hear my voice, and I know them, and they follow me',
  ] },
  { ref: 'Colossians 3:16', book: 'Colossians', ch: 3, v: 16, fragments: [
    'Let the word of Christ dwell in you richly in all wisdom',
  ] },
  // The whole-Bible-is-Him seal (Darrell 2026-08-04: "the whole Bible Is
  // Him... all eternal data is a sovereign-mesh Knowledge Network And Kingdom
  // Operating Systems").
  { ref: 'John 5:39', book: 'John', ch: 5, v: 39, fragments: [
    'Search the scriptures',
    'they are they which testify of me',
  ] },
  { ref: 'Luke 24:27', book: 'Luke', ch: 24, v: 27, fragments: [
    'beginning at Moses and all the prophets, he expounded unto them in all the scriptures the things concerning himself',
  ] },
  { ref: 'John 1:1', book: 'John', ch: 1, v: 1, fragments: [
    'In the beginning was the Word, and the Word was with God, and the Word was God',
  ] },
  { ref: 'John 1:14', book: 'John', ch: 1, v: 14, fragments: [
    'the Word was made flesh, and dwelt among us',
  ] },
  { ref: 'Revelation 19:13', book: 'Revelation', ch: 19, v: 13, fragments: [
    'his name is called The Word of God',
  ] },
  { ref: 'Hebrews 11:3', book: 'Hebrews', ch: 11, v: 3, fragments: [
    'Through faith we understand that the worlds were framed by the word of God',
  ] },
  { ref: 'Hebrews 1:3', book: 'Hebrews', ch: 1, v: 3, fragments: [
    'upholding all things by the word of his power',
  ] },
  { ref: 'Colossians 1:17', book: 'Colossians', ch: 1, v: 17, fragments: [
    'and by him all things consist',
  ] },
];

// The TRACK-LEVEL Word-first lead (DR-0127) — Yahweh's frame opens the
// knowledge space before any issue's material. Quoted verbatim like every
// other Scripture in the track.
const WORD_FIRST_QUOTES = [
  { ref: '1 Thessalonians 5:21', book: '1Thessalonians', ch: 5, v: 21, fragments: [
    'Prove all things; hold fast that which is good',
  ] },
  { ref: 'Proverbs 18:13', book: 'Proverbs', ch: 18, v: 13, fragments: [
    'He that answereth a matter before he heareth it, it is folly and shame unto him',
  ] },
];

describe('the track opens with Yahweh\'s frame, quoted verbatim (DR-0127 + DR-0076)', () => {
  it('declares a Word-first lead rather than falling through to an issue anchor', () => {
    // Before this, wordFirstLead() derived the track's opening from the FIRST
    // issue's anchor — so the app's most charged knowledge space opened under a
    // Musk-lesson anchor instead of His frame for weighing a claim at all.
    expect(WORLD_ISSUES_META.wordFirst?.ref).toBeTruthy();
    expect(WORLD_ISSUES_META.wordFirst?.frame).toBeTruthy();
  });

  it('every word quoted in the lead is an exact substring of the cited KJV verse', () => {
    const norm = (s) => s.replace(/[’‘]/g, "'").replace(/\s+/g, ' ');
    const failures = [];
    for (const q of WORD_FIRST_QUOTES) {
      const text = kjvVerse(q.book, q.ch, q.v);
      for (const frag of q.fragments) {
        if (!norm(text).includes(norm(frag))) {
          failures.push(`${q.ref}: fragment not found verbatim — "${frag}" (verse reads: "${text}")`);
        }
      }
      if (!norm(WORLD_ISSUES_META.wordFirst.ref).includes(norm(q.ref))) {
        failures.push(`${q.ref}: quoted in the lead but not cited in wordFirst.ref`);
      }
      for (const frag of q.fragments) {
        if (!norm(WORLD_ISSUES_META.wordFirst.frame).includes(norm(frag))) {
          failures.push(`${q.ref}: cited but its words do not appear in the lead — "${frag}"`);
        }
      }
    }
    expect(failures).toEqual([]);
  });
});

describe('the prison-industrial-complex issue quotes the KJV verbatim (DR-0076)', () => {
  const issue = WORLD_ISSUES.find((i) => i.id === 'wi-prison-industrial-complex');

  it('the issue is published in the track', () => {
    expect(issue).toBeTruthy();
  });

  it('every quoted fragment is an exact substring of the cited KJV verse', () => {
    const failures = [];
    for (const q of PRISON_ISSUE_QUOTES) {
      const text = kjvVerse(q.book, q.ch, q.v);
      for (const frag of q.fragments) {
        // The issue's prose uses typographic apostrophes; the KJV files do too —
        // compare with both normalized so punctuation style never masks a
        // wording mismatch (wording is what the gate protects).
        const norm = (s) => s.replace(/[’‘]/g, "'").replace(/\s+/g, ' ');
        if (!norm(text).includes(norm(frag))) {
          failures.push(`${q.ref}: fragment not found verbatim — "${frag}" (verse reads: "${text}")`);
        }
      }
    }
    expect(failures).toEqual([]);
  });

  it('every fragment actually appears in the issue content (the gate covers real quotes, not a stale list)', () => {
    const blob = JSON.stringify(issue);
    const norm = (s) => s.replace(/[’‘]/g, "'");
    const missing = PRISON_ISSUE_QUOTES.flatMap((q) =>
      q.fragments.filter((frag) => !norm(blob).includes(norm(frag))).map((frag) => `${q.ref}: "${frag}"`));
    expect(missing).toEqual([]);
  });
});
