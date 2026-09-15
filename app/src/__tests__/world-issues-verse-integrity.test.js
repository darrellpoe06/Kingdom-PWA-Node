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

// Issue 8 — the two-aftermaths lesson. Every fragment its own voice quotes.
const TWO_AFTERMATHS_QUOTES = [
  { ref: 'Deuteronomy 25:13', book: 'Deuteronomy', ch: 25, v: 13, fragments: [
    'Thou shalt not have in thy bag divers weights, a great and a small',
  ] },
  { ref: 'Deuteronomy 25:15', book: 'Deuteronomy', ch: 25, v: 15, fragments: [
    'But thou shalt have a perfect and just weight',
    'a perfect and just measure shalt thou have',
  ] },
  { ref: 'Deuteronomy 25:16', book: 'Deuteronomy', ch: 25, v: 16, fragments: [
    'For all that do such things, and all that do unrighteously, are an abomination unto the LORD thy God',
  ] },
  { ref: 'Matthew 7:2', book: 'Matthew', ch: 7, v: 2, fragments: [
    'with what measure ye mete, it shall be measured to you again',
  ] },
  { ref: '1 Kings 21:3', book: '1Kings', ch: 21, v: 3, fragments: [
    'The LORD forbid it me, that I should give the inheritance of my fathers unto thee',
  ] },
  { ref: '1 Kings 21:19', book: '1Kings', ch: 21, v: 19, fragments: [
    'Hast thou killed, and also taken possession?',
  ] },
  { ref: 'Micah 2:2', book: 'Micah', ch: 2, v: 2, fragments: [
    'they covet fields, and take them by violence; and houses, and take them away: so they oppress a man and his house, even a man and his heritage',
  ] },
  { ref: 'Isaiah 10:1', book: 'Isaiah', ch: 10, v: 1, fragments: [
    'Woe unto them that decree unrighteous decrees',
  ] },
  { ref: 'Exodus 1:10', book: 'Exodus', ch: 1, v: 10, fragments: [
    'Come on, let us deal wisely with them',
  ] },
  { ref: 'Jeremiah 6:14', book: 'Jeremiah', ch: 6, v: 14, fragments: [
    'They have healed also the hurt of the daughter of my people slightly, saying, Peace, peace; when there is no peace',
  ] },
  { ref: 'Exodus 23:1', book: 'Exodus', ch: 23, v: 1, fragments: [
    'Thou shalt not raise a false report: put not thine hand with the wicked to be an unrighteous witness',
  ] },
  { ref: 'Proverbs 6:19', book: 'Proverbs', ch: 6, v: 19, fragments: [
    'false witness that speaketh lies, and he that soweth discord among brethren',
  ] },
  { ref: 'Ezekiel 34:4', book: 'Ezekiel', ch: 34, v: 4, fragments: [
    'The diseased have ye not strengthened, neither have ye healed that which was sick, neither have ye bound up that which was broken, neither have ye brought again that which was driven away, neither have ye sought that which was lost; but with force and with cruelty have ye ruled them',
  ] },
  { ref: 'Ezekiel 34:15', book: 'Ezekiel', ch: 34, v: 15, fragments: [
    'I will feed my flock, and I will cause them to lie down',
  ] },
  { ref: 'Isaiah 9:6', book: 'Isaiah', ch: 9, v: 6, fragments: [
    'For unto us a child is born, unto us a son is given: and the government shall be upon his shoulder: and his name shall be called Wonderful, Counsellor, The mighty God, The everlasting Father, The Prince of Peace',
    'the government shall be upon his shoulder',
  ] },
  { ref: 'Isaiah 9:7', book: 'Isaiah', ch: 9, v: 7, fragments: [
    'to order it, and to establish it with judgment and with justice',
    'The zeal of the LORD of hosts will perform this',
  ] },
  { ref: 'Revelation 11:15', book: 'Revelation', ch: 11, v: 15, fragments: [
    'The kingdoms of this world are become the kingdoms of our Lord, and of his Christ; and he shall reign for ever and ever',
  ] },
  { ref: 'Daniel 2:44', book: 'Daniel', ch: 2, v: 44, fragments: [
    'shall never be destroyed',
  ] },
  // Jesus IS — the present-tense reign (Darrell 2026-08-07: "Jesus IS!!!!!").
  { ref: 'John 8:58', book: 'John', ch: 8, v: 58, fragments: [
    'Before Abraham was, I am',
  ] },
  { ref: 'Exodus 3:14', book: 'Exodus', ch: 3, v: 14, fragments: [
    'I AM THAT I AM',
  ] },
  { ref: 'Revelation 1:8', book: 'Revelation', ch: 1, v: 8, fragments: [
    'which is, and which was, and which is to come, the Almighty',
  ] },
  { ref: 'Hebrews 13:8', book: 'Hebrews', ch: 13, v: 8, fragments: [
    'the same yesterday, and to day, and for ever',
  ] },
  { ref: 'Matthew 28:18', book: 'Matthew', ch: 28, v: 18, fragments: [
    'All power is given unto me in heaven and in earth',
  ] },
  { ref: 'Colossians 1:16', book: 'Colossians', ch: 1, v: 16, fragments: [
    'whether they be thrones, or dominions, or principalities, or powers: all things were created by him, and for him',
  ] },
  { ref: 'Colossians 1:17', book: 'Colossians', ch: 1, v: 17, fragments: [
    'And he is before all things, and by him all things consist',
  ] },
  // The biblical project-management timelines (Darrell 2026-08-07).
  { ref: 'Genesis 15:13', book: 'Genesis', ch: 15, v: 13, fragments: [
    'thy seed shall be a stranger in a land that is not theirs, and shall serve them; and they shall afflict them four hundred years',
  ] },
  { ref: 'Genesis 15:14', book: 'Genesis', ch: 15, v: 14, fragments: [
    'afterward shall they come out with great substance',
  ] },
  { ref: 'Genesis 15:16', book: 'Genesis', ch: 15, v: 16, fragments: [
    'the fourth generation',
  ] },
  { ref: 'Exodus 12:41', book: 'Exodus', ch: 12, v: 41, fragments: [
    'And it came to pass at the end of the four hundred and thirty years, even the selfsame day it came to pass, that all the hosts of the LORD went out from the land of Egypt',
  ] },
  { ref: 'Exodus 2:24', book: 'Exodus', ch: 2, v: 24, fragments: [
    'God heard their groaning, and God remembered his covenant',
  ] },
  { ref: 'Jeremiah 25:11', book: 'Jeremiah', ch: 25, v: 11, fragments: [
    'these nations shall serve the king of Babylon seventy years',
  ] },
  { ref: 'Jeremiah 29:10', book: 'Jeremiah', ch: 29, v: 10, fragments: [
    'after seventy years be accomplished at Babylon I will visit you, and perform my good word toward you, in causing you to return to this place',
  ] },
  { ref: 'Daniel 9:2', book: 'Daniel', ch: 9, v: 2, fragments: [
    'that he would accomplish seventy years in the desolations of Jerusalem',
  ] },
  { ref: 'Deuteronomy 15:1', book: 'Deuteronomy', ch: 15, v: 1, fragments: [
    'At the end of every seven years thou shalt make a release',
  ] },
  { ref: 'Galatians 4:4', book: 'Galatians', ch: 4, v: 4, fragments: [
    'when the fulness of the time was come, God sent forth his Son',
  ] },
  { ref: 'Habakkuk 2:3', book: 'Habakkuk', ch: 2, v: 3, fragments: [
    'For the vision is yet for an appointed time, but at the end it shall speak, and not lie: though it tarry, wait for it; because it will surely come, it will not tarry',
  ] },
  { ref: 'Acts 1:7', book: 'Acts', ch: 1, v: 7, fragments: [
    'It is not for you to know the times or the seasons, which the Father hath put in his own power',
  ] },
  // metanoia — the framework correction (Darrell 2026-08-07).
  { ref: 'Matthew 4:17', book: 'Matthew', ch: 4, v: 17, fragments: [
    'Repent: for the kingdom of heaven is at hand',
  ] },
  { ref: 'Romans 12:2', book: 'Romans', ch: 12, v: 2, fragments: [
    'be not conformed to this world: but be ye transformed by the renewing of your mind',
  ] },
  { ref: '2 Corinthians 10:5', book: '2Corinthians', ch: 10, v: 5, fragments: [
    'bringing into captivity every thought to the obedience of Christ',
  ] },
  { ref: 'Isaiah 55:8', book: 'Isaiah', ch: 55, v: 8, fragments: [
    'my thoughts are not your thoughts, neither are your ways my ways, saith the LORD',
  ] },
  // The lesson checks its OWN numbers: 400 (affliction) vs 430 (sojourning).
  { ref: 'Acts 7:6', book: 'Acts', ch: 7, v: 6, fragments: [
    'they should bring them into bondage, and entreat them evil four hundred years',
  ] },
  { ref: 'Exodus 12:40', book: 'Exodus', ch: 12, v: 40, fragments: [
    'Now the sojourning of the children of Israel, who dwelt in Egypt, was four hundred and thirty years',
  ] },
  { ref: 'Galatians 3:17', book: 'Galatians', ch: 3, v: 17, fragments: [
    'the law, which was four hundred and thirty years after',
  ] },
  // What the Godhead expects (Darrell 2026-08-07).
  { ref: 'Micah 6:8', book: 'Micah', ch: 6, v: 8, fragments: [
    'He hath shewed thee, O man, what is good; and what doth the LORD require of thee, but to do justly, and to love mercy, and to walk humbly with thy God?',
  ] },
  { ref: 'Deuteronomy 10:12', book: 'Deuteronomy', ch: 10, v: 12, fragments: [
    'what doth the LORD thy God require of thee, but to fear the LORD thy God, to walk in all his ways, and to love him, and to serve the LORD thy God with all thy heart and with all thy soul',
  ] },
  { ref: 'Zechariah 7:9', book: 'Zechariah', ch: 7, v: 9, fragments: [
    'Execute true judgment, and shew mercy and compassions every man to his brother',
  ] },
  { ref: 'Zechariah 7:10', book: 'Zechariah', ch: 7, v: 10, fragments: [
    'And oppress not the widow, nor the fatherless, the stranger, nor the poor; and let none of you imagine evil against his brother in your heart',
    'let none of you imagine evil against his brother in your heart',
  ] },
  { ref: 'Matthew 22:37', book: 'Matthew', ch: 22, v: 37, fragments: [
    'Thou shalt love the Lord thy God with all thy heart, and with all thy soul, and with all thy mind',
  ] },
  { ref: 'Matthew 22:39', book: 'Matthew', ch: 22, v: 39, fragments: [
    'And the second is like unto it, Thou shalt love thy neighbour as thyself',
  ] },
  { ref: 'John 14:15', book: 'John', ch: 14, v: 15, fragments: [
    'If ye love me, keep my commandments',
  ] },
  { ref: 'Matthew 25:40', book: 'Matthew', ch: 25, v: 40, fragments: [
    'Inasmuch as ye have done it unto one of the least of these my brethren, ye have done it unto me',
  ] },
  { ref: 'Galatians 5:22', book: 'Galatians', ch: 5, v: 22, fragments: [
    'the fruit of the Spirit is love, joy, peace, longsuffering, gentleness, goodness, faith',
  ] },
  { ref: 'Galatians 5:23', book: 'Galatians', ch: 5, v: 23, fragments: [
    'Meekness, temperance',
  ] },
  { ref: 'Romans 8:14', book: 'Romans', ch: 8, v: 14, fragments: [
    'as many as are led by the Spirit of God, they are the sons of God',
  ] },
  { ref: 'Ephesians 4:30', book: 'Ephesians', ch: 4, v: 30, fragments: [
    'grieve not the holy Spirit of God, whereby ye are sealed unto the day of redemption',
  ] },
  { ref: 'Hosea 6:6', book: 'Hosea', ch: 6, v: 6, fragments: [
    'I desired mercy, and not sacrifice; and the knowledge of God more than burnt offerings',
  ] },
  { ref: '1 Samuel 15:22', book: '1Samuel', ch: 15, v: 22, fragments: [
    'to obey is better than sacrifice',
  ] },
  { ref: '1 John 3:18', book: '1John', ch: 3, v: 18, fragments: [
    'let us not love in word, neither in tongue; but in deed and in truth',
  ] },
  { ref: 'John 4:24', book: 'John', ch: 4, v: 24, fragments: [
    'is a Spirit: and they that worship him must worship him in spirit and in truth',
  ] },
  // What we expect of governments, and what we do while enduring (Darrell 2026-08-07).
  { ref: 'Romans 13:3', book: 'Romans', ch: 13, v: 3, fragments: [
    'rulers are not a terror to good works, but to the evil',
  ] },
  { ref: 'Romans 13:4', book: 'Romans', ch: 13, v: 4, fragments: [
    'he is the minister of God to thee for good',
    'he beareth not the sword in vain: for he is the minister of God, a revenger to execute wrath upon him that doeth evil',
  ] },
  { ref: 'Jeremiah 22:3', book: 'Jeremiah', ch: 22, v: 3, fragments: [
    'Execute ye judgment and righteousness, and deliver the spoiled out of the hand of the oppressor: and do no wrong, do no violence to the stranger, the fatherless, nor the widow, neither shed innocent blood',
  ] },
  { ref: 'Proverbs 29:2', book: 'Proverbs', ch: 29, v: 2, fragments: [
    'When the righteous are in authority, the people rejoice: but when the wicked beareth rule, the people mourn',
  ] },
  { ref: 'Daniel 4:17', book: 'Daniel', ch: 4, v: 17, fragments: [
    'the most High ruleth in the kingdom of men, and giveth it to whomsoever he will, and setteth up over it the basest of men',
  ] },
  { ref: 'Acts 5:29', book: 'Acts', ch: 5, v: 29, fragments: [
    'We ought to obey God rather than men',
  ] },
  { ref: '1 Peter 2:17', book: '1Peter', ch: 2, v: 17, fragments: [
    'Honour all men. Love the brotherhood. Fear God. Honour the king',
  ] },
  { ref: '1 Timothy 2:1', book: '1Timothy', ch: 2, v: 1, fragments: [
    'supplications, prayers, intercessions, and giving of thanks, be made for all men',
  ] },
  { ref: '1 Timothy 2:2', book: '1Timothy', ch: 2, v: 2, fragments: [
    'For kings, and for all that are in authority; that we may lead a quiet and peaceable life',
  ] },
  { ref: 'Jeremiah 29:5', book: 'Jeremiah', ch: 29, v: 5, fragments: [
    'Build ye houses, and dwell in them; and plant gardens, and eat the fruit of them',
  ] },
  { ref: 'Jeremiah 29:6', book: 'Jeremiah', ch: 29, v: 6, fragments: [
    'Take ye wives, and beget sons and daughters',
    'that ye may be increased there, and not diminished',
  ] },
  { ref: 'Jeremiah 29:7', book: 'Jeremiah', ch: 29, v: 7, fragments: [
    'And seek the peace of the city whither I have caused you to be carried away captives, and pray unto the LORD for it: for in the peace thereof shall ye have peace',
  ] },
  { ref: 'Daniel 1:8', book: 'Daniel', ch: 1, v: 8, fragments: [
    'purposed in his heart that he would not defile himself',
  ] },
  { ref: 'Romans 12:19', book: 'Romans', ch: 12, v: 19, fragments: [
    'avenge not yourselves, but rather give place unto wrath: for it is written, Vengeance is mine; I will repay, saith the Lord',
  ] },
  { ref: 'Romans 12:21', book: 'Romans', ch: 12, v: 21, fragments: [
    'Be not overcome of evil, but overcome evil with good',
  ] },
  { ref: 'Galatians 6:9', book: 'Galatians', ch: 6, v: 9, fragments: [
    'let us not be weary in well doing: for in due season we shall reap, if we faint not',
  ] },
  { ref: 'Isaiah 40:31', book: 'Isaiah', ch: 40, v: 31, fragments: [
    'they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint',
  ] },
  { ref: 'Psalm 27:14', book: 'Psalms', ch: 27, v: 14, fragments: [
    'Wait on the LORD: be of good courage, and he shall strengthen thine heart: wait, I say, on the LORD',
  ] },
  { ref: 'Genesis 50:20', book: 'Genesis', ch: 50, v: 20, fragments: [
    'ye thought evil against me; but God meant it unto good, to bring to pass, as it is this day, to save much people alive',
  ] },
  // Yahweh's good vs man's good, His evil vs man's evil, and the heart we
  // cannot inspect ourselves (Darrell 2026-08-09).
  { ref: 'Genesis 1:31', book: 'Genesis', ch: 1, v: 31, fragments: [
    'And God saw every thing that he had made, and, behold, it was very good',
  ] },
  { ref: 'James 1:17', book: 'James', ch: 1, v: 17, fragments: [
    'Every good gift and every perfect gift is from above, and cometh down from the Father of lights',
  ] },
  { ref: 'Mark 10:18', book: 'Mark', ch: 10, v: 18, fragments: [
    'Why callest thou me good? there is none good but one, that is, God',
  ] },
  { ref: 'Proverbs 14:12', book: 'Proverbs', ch: 14, v: 12, fragments: [
    'There is a way which seemeth right unto a man, but the end thereof are the ways of death',
  ] },
  { ref: 'Proverbs 16:2', book: 'Proverbs', ch: 16, v: 2, fragments: [
    'All the ways of a man are clean in his own eyes; but the LORD weigheth the spirits',
  ] },
  { ref: 'Proverbs 21:2', book: 'Proverbs', ch: 21, v: 2, fragments: [
    'Every way of a man is right in his own eyes: but the LORD pondereth the hearts',
  ] },
  { ref: 'Isaiah 64:6', book: 'Isaiah', ch: 64, v: 6, fragments: [
    'all our righteousnesses are as filthy rags',
  ] },
  { ref: 'Romans 3:12', book: 'Romans', ch: 3, v: 12, fragments: [
    'there is none that doeth good, no, not one',
  ] },
  { ref: 'Isaiah 5:20', book: 'Isaiah', ch: 5, v: 20, fragments: [
    'Woe unto them that call evil good, and good evil; that put darkness for light, and light for darkness; that put bitter for sweet, and sweet for bitter!',
    'Woe unto them that call evil good, and good evil',
  ] },
  { ref: 'Matthew 15:19', book: 'Matthew', ch: 15, v: 19, fragments: [
    'For out of the heart proceed evil thoughts, murders, adulteries, fornications, thefts, false witness, blasphemies',
  ] },
  { ref: 'Jeremiah 17:9', book: 'Jeremiah', ch: 17, v: 9, fragments: [
    'The heart is deceitful above all things, and desperately wicked: who can know it?',
  ] },
  { ref: 'Jeremiah 17:10', book: 'Jeremiah', ch: 17, v: 10, fragments: [
    'I the LORD search the heart, I try the reins, even to give every man according to his ways',
  ] },
  { ref: 'Romans 7:18', book: 'Romans', ch: 7, v: 18, fragments: [
    'For I know that in me (that is, in my flesh,) dwelleth no good thing',
  ] },
  { ref: 'Romans 7:19', book: 'Romans', ch: 7, v: 19, fragments: [
    'For the good that I would I do not: but the evil which I would not, that I do',
  ] },
  { ref: 'Hebrews 4:12', book: 'Hebrews', ch: 4, v: 12, fragments: [
    'For the word of God is quick, and powerful, and sharper than any twoedged sword, piercing even to the dividing asunder of soul and spirit, and of the joints and marrow, and is a discerner of the thoughts and intents of the heart',
  ] },
  { ref: 'Hebrews 4:13', book: 'Hebrews', ch: 4, v: 13, fragments: [
    'all things are naked and opened unto the eyes of him with whom we have to do',
  ] },
  { ref: '1 Samuel 16:7', book: '1Samuel', ch: 16, v: 7, fragments: [
    'the LORD seeth not as man seeth; for man looketh on the outward appearance, but the LORD looketh on the heart',
  ] },
  { ref: 'Psalm 139:23', book: 'Psalms', ch: 139, v: 23, fragments: [
    'Search me, O God, and know my heart: try me, and know my thoughts',
  ] },
  { ref: 'Psalm 139:24', book: 'Psalms', ch: 139, v: 24, fragments: [
    'And see if there be any wicked way in me, and lead me in the way everlasting',
  ] },
  // Carnal mind vs spiritual mind, the ladder, and spiritual authority
  // (Darrell 2026-08-09). Reinforces THE-ROOT.md's own section.
  { ref: 'Romans 8:5', book: 'Romans', ch: 8, v: 5, fragments: [
    'For they that are after the flesh do mind the things of the flesh; but they that are after the Spirit the things of the Spirit',
  ] },
  { ref: 'Romans 8:7', book: 'Romans', ch: 8, v: 7, fragments: [
    'Because the carnal mind is enmity against God: for it is not subject to the law of God, neither indeed can be',
  ] },
  { ref: '1 Corinthians 2:14', book: '1Corinthians', ch: 2, v: 14, fragments: [
    'But the natural man receiveth not the things of the Spirit of God: for they are foolishness unto him: neither can he know them, because they are spiritually discerned',
  ] },
  { ref: '1 Corinthians 2:15', book: '1Corinthians', ch: 2, v: 15, fragments: [
    'But he that is spiritual judgeth all things',
  ] },
  { ref: '1 Corinthians 2:16', book: '1Corinthians', ch: 2, v: 16, fragments: [
    'But we have the mind of Christ',
  ] },
  { ref: '1 Corinthians 2:12', book: '1Corinthians', ch: 2, v: 12, fragments: [
    'Now we have received, not the spirit of the world, but the spirit which is of God; that we might know the things that are freely given to us of God',
  ] },
  { ref: 'John 16:13', book: 'John', ch: 16, v: 13, fragments: [
    'he will guide you into all truth',
  ] },
  { ref: 'Proverbs 9:10', book: 'Proverbs', ch: 9, v: 10, fragments: [
    'The fear of the LORD is the beginning of wisdom: and the knowledge of the holy is understanding',
  ] },
  { ref: 'Proverbs 4:7', book: 'Proverbs', ch: 4, v: 7, fragments: [
    'Wisdom is the principal thing; therefore get wisdom: and with all thy getting get understanding',
  ] },
  { ref: 'Ephesians 1:18', book: 'Ephesians', ch: 1, v: 18, fragments: [
    'The eyes of your understanding being enlightened',
  ] },
  { ref: 'Colossians 1:9', book: 'Colossians', ch: 1, v: 9, fragments: [
    'filled with the knowledge of his will in all wisdom and spiritual understanding',
  ] },
  { ref: 'Hebrews 5:14', book: 'Hebrews', ch: 5, v: 14, fragments: [
    'But strong meat belongeth to them that are of full age, even those who by reason of use have their senses exercised to discern both good and evil',
  ] },
  { ref: '2 Corinthians 10:3', book: '2Corinthians', ch: 10, v: 3, fragments: [
    'For though we walk in the flesh, we do not war after the flesh',
  ] },
  { ref: 'Luke 10:19', book: 'Luke', ch: 10, v: 19, fragments: [
    'Behold, I give unto you power to tread on serpents and scorpions, and over all the power of the enemy',
  ] },
  { ref: '2 Timothy 1:7', book: '2Timothy', ch: 1, v: 7, fragments: [
    'God hath not given us the spirit of fear; but of power, and of love, and of a sound mind',
  ] },
  { ref: 'Galatians 5:16', book: 'Galatians', ch: 5, v: 16, fragments: [
    'Walk in the Spirit, and ye shall not fulfil the lust of the flesh',
  ] },
  { ref: 'Galatians 5:20', book: 'Galatians', ch: 5, v: 20, fragments: [
    'hatred, variance, emulations, wrath, strife, seditions, heresies',
  ] },
  { ref: 'James 3:14', book: 'James', ch: 3, v: 14, fragments: [
    'if ye have bitter envying and strife in your hearts, glory not, and lie not against the truth',
  ] },
  { ref: 'James 3:15', book: 'James', ch: 3, v: 15, fragments: [
    'This wisdom descendeth not from above, but is earthly, sensual, devilish',
  ] },
  { ref: 'James 3:17', book: 'James', ch: 3, v: 17, fragments: [
    'But the wisdom that is from above is first pure, then peaceable, gentle, and easy to be intreated, full of mercy and good fruits, without partiality, and without hypocrisy',
  ] },
  { ref: 'Genesis 12:3', book: 'Genesis', ch: 12, v: 3, fragments: [
    'I will bless them that bless thee, and curse him that curseth thee',
  ] },
  { ref: 'Romans 11:18', book: 'Romans', ch: 11, v: 18, fragments: [
    'Boast not against the branches',
  ] },
  { ref: 'Acts 17:26', book: 'Acts', ch: 17, v: 26, fragments: [
    'hath made of one blood all nations of men',
  ] },
  { ref: 'Leviticus 25:10', book: 'Leviticus', ch: 25, v: 10, fragments: [
    'ye shall return every man unto his possession',
  ] },
  { ref: 'Leviticus 25:23', book: 'Leviticus', ch: 25, v: 23, fragments: [
    'The land shall not be sold for ever: for the land is mine',
    'ye are strangers and sojourners with me',
  ] },
  { ref: 'Numbers 27:4', book: 'Numbers', ch: 27, v: 4, fragments: [
    'Why should the name of our father be done away from among his family',
  ] },
  { ref: 'Numbers 27:7', book: 'Numbers', ch: 27, v: 7, fragments: [
    'The daughters of Zelophehad speak right',
  ] },
  { ref: 'James 5:4', book: 'James', ch: 5, v: 4, fragments: [
    'which is of you kept back by fraud, crieth: and the cries of them which have reaped are entered into the ears of the Lord of sabaoth',
  ] },
  { ref: 'Deuteronomy 29:29', book: 'Deuteronomy', ch: 29, v: 29, fragments: [
    'The secret things belong unto the LORD our God: but those things which are revealed belong unto us and to our children for ever, that we may do all the words of this law',
  ] },
  { ref: '1 Corinthians 13:9', book: '1Corinthians', ch: 13, v: 9, fragments: [
    'For we know in part, and we prophesy in part',
  ] },
  { ref: '1 Corinthians 13:12', book: '1Corinthians', ch: 13, v: 12, fragments: [
    'For now we see through a glass, darkly; but then face to face',
  ] },
  { ref: 'Deuteronomy 8:2', book: 'Deuteronomy', ch: 8, v: 2, fragments: [
    'thou shalt remember all the way which the LORD thy God led thee these forty years in the wilderness, to humble thee, and to prove thee, to know what was in thine heart',
  ] },
  { ref: 'Hebrews 11:13', book: 'Hebrews', ch: 11, v: 13, fragments: [
    'confessed that they were strangers and pilgrims on the earth',
  ] },
  { ref: 'Proverbs 3:5', book: 'Proverbs', ch: 3, v: 5, fragments: [
    'Trust in the LORD with all thine heart; and lean not unto thine own understanding',
  ] },
  { ref: '2 Corinthians 5:7', book: '2Corinthians', ch: 5, v: 7, fragments: [
    'For we walk by faith, not by sight',
  ] },
  { ref: 'Philippians 3:12', book: 'Philippians', ch: 3, v: 12, fragments: [
    'Not as though I had already attained',
  ] },
];

describe('the two-aftermaths issue quotes the KJV verbatim (DR-0076)', () => {
  const issue = WORLD_ISSUES.find((i) => i.id === 'wi-historical-trauma-two-aftermaths');

  it('the issue is published in the track', () => {
    expect(issue).toBeTruthy();
  });

  it('every quoted fragment is an exact substring of the cited KJV verse', () => {
    const norm = (s) => s.replace(/[’‘]/g, "'").replace(/\s+/g, ' ');
    const failures = [];
    for (const q of TWO_AFTERMATHS_QUOTES) {
      const text = kjvVerse(q.book, q.ch, q.v);
      for (const frag of q.fragments) {
        if (!norm(text).includes(norm(frag))) {
          failures.push(`${q.ref}: fragment not found verbatim — "${frag}" (verse reads: "${text}")`);
        }
      }
    }
    expect(failures).toEqual([]);
  });

  it('every fragment actually appears in the issue content (no stale list)', () => {
    const blob = JSON.stringify(issue);
    const norm = (s) => s.replace(/[’‘]/g, "'");
    const missing = TWO_AFTERMATHS_QUOTES.flatMap((q) =>
      q.fragments.filter((frag) => !norm(blob).includes(norm(frag))).map((frag) => `${q.ref}: "${frag}"`));
    expect(missing).toEqual([]);
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

// Every Scripture fragment the Law-of-Assumption issue quotes (authored under
// this gate, 2026-08-10). This lesson's whole argument turns on reading the
// SECOND HALF of Isaiah 46:10, so a drifted quotation here would not be a
// blemish — it would dismantle the case (DR-0281: the reasoning across verses
// is as accountable as the quotation).
const LAW_OF_ASSUMPTION_QUOTES = [
  { ref: 'Isaiah 46:9', book: 'Isaiah', ch: 46, v: 9, fragments: [
    'Remember the former things of old: for I am God, and there is none else; I am God, and there is none like me',
  ] },
  { ref: 'Isaiah 46:10', book: 'Isaiah', ch: 46, v: 10, fragments: [
    'Declaring the end from the beginning, and from ancient times the things that are not yet done, saying, My counsel shall stand, and I will do all my pleasure',
    'My counsel shall stand, and I will do all my pleasure',
  ] },
  { ref: 'Isaiah 45:5', book: 'Isaiah', ch: 45, v: 5, fragments: [
    'I am the LORD, and there is none else, there is no God beside me',
  ] },
  { ref: 'Genesis 3:5', book: 'Genesis', ch: 3, v: 5, fragments: [
    'ye shall be as gods',
  ] },
  { ref: 'Romans 1:25', book: 'Romans', ch: 1, v: 25, fragments: [
    'worshipped and served the creature more than the Creator',
  ] },
  { ref: 'Colossians 2:8', book: 'Colossians', ch: 2, v: 8, fragments: [
    'Beware lest any man spoil you through philosophy and vain deceit, after the tradition of men, after the rudiments of the world, and not after Christ',
    'Beware lest any man spoil you through philosophy and vain deceit',
    'and not after Christ',
  ] },
  { ref: 'Philippians 4:6', book: 'Philippians', ch: 4, v: 6, fragments: [
    'Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God',
    'in every thing by prayer and supplication with thanksgiving let your requests be made known unto God',
  ] },
  { ref: '1 John 5:14', book: '1John', ch: 5, v: 14, fragments: [
    'if we ask any thing according to his will, he heareth us',
  ] },
  { ref: 'Mark 11:22', book: 'Mark', ch: 11, v: 22, fragments: [
    'Have faith in God',
  ] },
  { ref: 'Mark 11:24', book: 'Mark', ch: 11, v: 24, fragments: [
    'What things soever ye desire, when ye pray, believe that ye receive them, and ye shall have them',
  ] },
  { ref: 'James 4:14', book: 'James', ch: 4, v: 14, fragments: [
    'ye know not what shall be on the morrow',
  ] },
  { ref: 'James 4:15', book: 'James', ch: 4, v: 15, fragments: [
    'ye ought to say, If the Lord will, we shall live, and do this, or that',
    'If the Lord will',
  ] },
  { ref: 'Proverbs 16:9', book: 'Proverbs', ch: 16, v: 9, fragments: [
    'A man\u2019s heart deviseth his way: but the LORD directeth his steps',
  ] },
  { ref: 'Matthew 6:33', book: 'Matthew', ch: 6, v: 33, fragments: [
    'But seek ye first the kingdom of God, and his righteousness; and all these things shall be added unto you',
  ] },
  { ref: 'Hebrews 11:1', book: 'Hebrews', ch: 11, v: 1, fragments: [
    'the substance of things hoped for, the evidence of things not seen',
  ] },
  { ref: '2 Corinthians 10:5', book: '2Corinthians', ch: 10, v: 5, fragments: [
    'Casting down imaginations',
    'bringing into captivity every thought to the obedience of Christ',
  ] },
  { ref: 'Ecclesiastes 12:14', book: 'Ecclesiastes', ch: 12, v: 14, fragments: [
    'God shall bring every work into judgment, with every secret thing',
  ] },
];

describe('the Law-of-Assumption issue quotes the KJV verbatim (DR-0076 / DR-0281)', () => {
  const issue = WORLD_ISSUES.find((i) => i.id === 'wi-law-of-assumption');

  it('the issue is published in the track', () => {
    expect(issue).toBeTruthy();
  });

  it('every quoted fragment is an exact substring of the cited KJV verse', () => {
    const norm = (s) => s.replace(/[\u2019\u2018]/g, "'").replace(/\s+/g, ' ');
    const failures = [];
    for (const q of LAW_OF_ASSUMPTION_QUOTES) {
      const text = kjvVerse(q.book, q.ch, q.v);
      for (const frag of q.fragments) {
        if (!norm(text).includes(norm(frag))) {
          failures.push(`${q.ref}: fragment not found verbatim \u2014 "${frag}" (verse reads: "${text}")`);
        }
      }
    }
    expect(failures).toEqual([]);
  });

  it('every fragment actually appears in the issue content (no stale list)', () => {
    const blob = JSON.stringify(issue);
    const norm = (s) => s.replace(/[\u2019\u2018]/g, "'");
    const missing = LAW_OF_ASSUMPTION_QUOTES.flatMap((q) =>
      q.fragments.filter((frag) => !norm(blob).includes(norm(frag))).map((frag) => `${q.ref}: "${frag}"`));
    expect(missing).toEqual([]);
  });

  it('the SECOND half of Isaiah 46:10 is present \u2014 the half the teaching drops', () => {
    const blob = JSON.stringify(issue);
    expect(blob).toContain('My counsel shall stand, and I will do all my pleasure');
  });
});

// =============================================================================
// ISSUE 10 — "Victorious Emotions" (identity / emotions / frequencies / angels)
// =============================================================================
// DR-0288 requires every fragment VERBATIM against the repo's own KJV, with a
// proven-to-catch tamper. Without these pins the issue would ride the suite
// green while quoting from memory — which is the exact failure the gate exists
// for, and it was vacuous for this issue until these were added.
const VICTORIOUS_EMOTIONS_QUOTES = [
  { ref: '2 Corinthians 5:17', book: '2Corinthians', ch: 5, v: 17, fragments: ['he is a new creature: old things are passed away'] },
  { ref: 'Colossians 1:27', book: 'Colossians', ch: 1, v: 27, fragments: ['Christ in you, the hope of glory'] },
  { ref: '1 Corinthians 6:19', book: '1Corinthians', ch: 6, v: 19, fragments: ['your body is the temple of the Holy Ghost which is in you'] },
  { ref: '1 John 3:2', book: '1John', ch: 3, v: 2, fragments: ['now are we the sons of God'] },
  { ref: 'Romans 12:2', book: 'Romans', ch: 12, v: 2, fragments: ['be ye transformed by the renewing of your mind'] },
  { ref: 'Proverbs 4:23', book: 'Proverbs', ch: 4, v: 23, fragments: ['Keep thy heart with all diligence; for out of it are the issues of life'] },
  { ref: 'Luke 6:45', book: 'Luke', ch: 6, v: 45, fragments: ['for of the abundance of the heart his mouth speaketh'] },
  { ref: 'Jeremiah 17:9', book: 'Jeremiah', ch: 17, v: 9, fragments: ['The heart is deceitful above all things, and desperately wicked'] },
  { ref: 'Psalm 42:11', book: 'Psalms', ch: 42, v: 11, fragments: ['Why art thou cast down, O my soul?'] },
  { ref: 'Hebrews 1:14', book: 'Hebrews', ch: 1, v: 14, fragments: ['ministering spirits, sent forth to minister'] },
  { ref: 'Colossians 2:18', book: 'Colossians', ch: 2, v: 18, fragments: ['worshipping of angels, intruding into those things which he hath not seen'] },
  { ref: 'Revelation 22:9', book: 'Revelation', ch: 22, v: 9, fragments: ['See thou do it not'] },
  { ref: 'Genesis 3:5', book: 'Genesis', ch: 3, v: 5, fragments: ['ye shall be as gods, knowing good and evil'] },
  { ref: 'Isaiah 14:14', book: 'Isaiah', ch: 14, v: 14, fragments: ['I will be like the most High'] },
  { ref: 'John 15:5', book: 'John', ch: 15, v: 5, fragments: ['without me ye can do nothing'] },
  { ref: 'Matthew 5:14', book: 'Matthew', ch: 5, v: 14, fragments: ['Ye are the light of the world'] },
  { ref: 'John 8:12', book: 'John', ch: 8, v: 12, fragments: ['I am the light of the world'] },
  { ref: 'Ephesians 6:17', book: 'Ephesians', ch: 6, v: 17, fragments: ['the sword of the Spirit, which is the word of God'] },
  { ref: 'Philippians 4:6', book: 'Philippians', ch: 4, v: 6, fragments: ['let your requests be made known unto God'] },
  { ref: 'Hebrews 4:16', book: 'Hebrews', ch: 4, v: 16, fragments: ['come boldly unto the throne of grace'] },
  { ref: 'Psalm 62:8', book: 'Psalms', ch: 62, v: 8, fragments: ['pour out your heart before him'] },
  { ref: '2 Corinthians 12:9', book: '2Corinthians', ch: 12, v: 9, fragments: ['My grace is sufficient for thee: for my strength is made perfect in weakness'] },
  { ref: '1 Timothy 5:23', book: '1Timothy', ch: 5, v: 23, fragments: ['use a little wine for thy stomach'] },
  { ref: '2 Timothy 4:20', book: '2Timothy', ch: 4, v: 20, fragments: ['Trophimus have I left at Miletum sick'] },
  { ref: 'Philippians 2:27', book: 'Philippians', ch: 2, v: 27, fragments: ['was sick nigh unto death: but God had mercy on him'] },
  { ref: '2 Corinthians 4:16', book: '2Corinthians', ch: 4, v: 16, fragments: ['though our outward man perish, yet the inward man is renewed day by day'] },
  { ref: '2 Corinthians 5:1', book: '2Corinthians', ch: 5, v: 1, fragments: ['if our earthly house of this tabernacle were dissolved'] },
  { ref: 'Genesis 3:19', book: 'Genesis', ch: 3, v: 19, fragments: ['dust thou art, and unto dust shalt thou return'] },
  { ref: 'Hebrews 9:27', book: 'Hebrews', ch: 9, v: 27, fragments: ['it is appointed unto men once to die'] },
  { ref: 'Psalm 77:11', book: 'Psalms', ch: 77, v: 11, fragments: ['I will remember the works of the LORD'] },
  { ref: '1 Samuel 16:23', book: '1Samuel', ch: 16, v: 23, fragments: ['so Saul was refreshed, and was well'] },
  { ref: 'Isaiah 26:3', book: 'Isaiah', ch: 26, v: 3, fragments: ['Thou wilt keep him in perfect peace, whose mind is stayed on thee'] },
  { ref: '1 John 4:1', book: '1John', ch: 4, v: 1, fragments: ['try the spirits whether they are of God'] },
  { ref: 'James 3:1', book: 'James', ch: 3, v: 1, fragments: ['be not many masters, knowing that we shall receive the greater condemnation'] },
  { ref: 'Ecclesiastes 12:14', book: 'Ecclesiastes', ch: 12, v: 14, fragments: ['God shall bring every work into judgment, with every secret thing'] },
  { ref: 'Acts 17:11', book: 'Acts', ch: 17, v: 11, fragments: ['searched the scriptures daily, whether those things were so'] },
  { ref: 'Galatians 6:1', book: 'Galatians', ch: 6, v: 1, fragments: ['restore such an one in the spirit of meekness'] },
];

describe('Issue 10 — Victorious Emotions: every fragment verbatim from the repo KJV', () => {
  const issue = WORLD_ISSUES.find((i) => i.id === 'wi-victorious-emotions');

  it('the issue is published in the track', () => {
    expect(issue).toBeTruthy();
  });

  it('every quoted fragment is an exact substring of the cited KJV verse', () => {
    const norm = (s) => s.replace(/[’‘]/g, "'").replace(/\s+/g, ' ');
    const failures = [];
    for (const q of VICTORIOUS_EMOTIONS_QUOTES) {
      const text = kjvVerse(q.book, q.ch, q.v);
      for (const frag of q.fragments) {
        if (!norm(text).includes(norm(frag))) {
          failures.push(`${q.ref}: NOT VERBATIM — "${frag}" (verse reads: "${text}")`);
        }
      }
    }
    expect(failures).toEqual([]);
  });

  it('every fragment actually appears in the issue content (no stale list)', () => {
    const blob = JSON.stringify(issue);
    const norm = (s) => s.replace(/[’‘]/g, "'");
    const missing = VICTORIOUS_EMOTIONS_QUOTES.flatMap((q) =>
      q.fragments.filter((frag) => !norm(blob).includes(norm(frag))).map((frag) => `${q.ref}: "${frag}"`));
    expect(missing).toEqual([]);
  });

  // PROVEN-TO-CATCH: a single word altered must fail. Without this, the block
  // above proves only that the list agrees with itself.
  it('CATCHES a one-word tamper in a pinned verse', () => {
    const norm = (s) => s.replace(/[’‘]/g, "'").replace(/\s+/g, ' ');
    const real = kjvVerse('Genesis', 3, 5);
    const tampered = 'ye shall be as angels, knowing good and evil';
    expect(norm(real).includes(norm(tampered))).toBe(false);
    expect(norm(real).includes(norm('ye shall be as gods, knowing good and evil'))).toBe(true);
  });

  // The pastoral load-bearing pin: Paul's own sick companions are the Word's
  // answer to spirit-sustains-body, so they must be present, not paraphrased.
  it('keeps the apostolic counter-witness the body claim rests on', () => {
    const blob = JSON.stringify(issue);
    expect(blob).toContain('Trophimus have I left at Miletum sick');
    expect(blob).toContain('My grace is sufficient for thee');
    expect(blob).toContain('though our outward man perish');
    expect(blob).toContain('was sick nigh unto death');
  });

  // The grace note is a GATE requirement (DR-0288), not decoration.
  it('carries a grace note that condemns no one', () => {
    expect(issue.lens.graceNote).toBeTruthy();
    expect(issue.lens.graceNote).toMatch(/No condemnation/i);
  });
});

// =============================================================================
// ISSUE 11 — "College was free until 1965" (wi-tuition-and-the-1965-act).
// Darrell pasted the transcript as build input on 2026-09-15. Every fragment
// below was fetched from the repo KJV at authoring time; a drift fails here.
// =============================================================================
const TUITION_1965_QUOTES = [
  { ref: 'Proverbs 22:7', book: 'Proverbs', ch: 22, v: 7, fragments: ['The rich ruleth over the poor, and the borrower is servant to the lender.'] },
  { ref: 'Exodus 22:25', book: 'Exodus', ch: 22, v: 25, fragments: ['If thou lend money to any of my people that is poor by thee, thou shalt not be to him as an usurer, neither shalt thou lay upon him usury.'] },
  { ref: 'Deuteronomy 15:1', book: 'Deuteronomy', ch: 15, v: 1, fragments: ['At the end of every seven years thou shalt make a release.'] },
  { ref: 'Deuteronomy 15:2', book: 'Deuteronomy', ch: 15, v: 2, fragments: ['Every creditor that lendeth ought unto his neighbour shall release it; he shall not exact it of his neighbour, or of his brother; because it is called the LORD’s release.'] },
  { ref: 'Leviticus 25:10', book: 'Leviticus', ch: 25, v: 10, fragments: ['proclaim liberty throughout all the land unto all the inhabitants thereof'] },
  { ref: 'Proverbs 11:1', book: 'Proverbs', ch: 11, v: 1, fragments: ['A false balance is abomination to the LORD: but a just weight is his delight.'] },
  { ref: 'Leviticus 19:15', book: 'Leviticus', ch: 19, v: 15, fragments: ['thou shalt not respect the person of the poor, nor honor the person of the mighty'] },
  { ref: 'Deuteronomy 1:17', book: 'Deuteronomy', ch: 1, v: 17, fragments: ['ye shall hear the small as well as the great'] },
  { ref: 'Acts 10:34', book: 'Acts', ch: 10, v: 34, fragments: ['God is no respecter of persons'] },
  { ref: 'Galatians 3:28', book: 'Galatians', ch: 3, v: 28, fragments: ['ye are all one in Christ Jesus'] },
  { ref: 'Isaiah 10:1', book: 'Isaiah', ch: 10, v: 1, fragments: ['Woe unto them that decree unrighteous decrees, and that write grievousness which they have prescribed'] },
  { ref: 'Isaiah 10:2', book: 'Isaiah', ch: 10, v: 2, fragments: ['To turn aside the needy from judgment, and to take away the right from the poor of my people'] },
  { ref: 'Matthew 23:4', book: 'Matthew', ch: 23, v: 4, fragments: ['they bind heavy burdens and grievous to be borne, and lay them on men’s shoulders'] },
  { ref: 'Nehemiah 5:1', book: 'Nehemiah', ch: 5, v: 1, fragments: ['there was a great cry of the people'] },
  { ref: 'Nehemiah 5:3', book: 'Nehemiah', ch: 5, v: 3, fragments: ['We have mortgaged our lands, vineyards, and houses'] },
  { ref: 'Nehemiah 5:5', book: 'Nehemiah', ch: 5, v: 5, fragments: ['we bring into bondage our sons and our daughters to be servants', 'neither is it in our power to redeem them'] },
  { ref: 'Nehemiah 5:7', book: 'Nehemiah', ch: 5, v: 7, fragments: ['Ye exact usury, every one of his brother'] },
  { ref: 'Nehemiah 5:11', book: 'Nehemiah', ch: 5, v: 11, fragments: ['Restore, I pray you, to them, even this day, their lands, their vineyards, their oliveyards, and their houses'] },
  { ref: 'Nehemiah 5:12', book: 'Nehemiah', ch: 5, v: 12, fragments: ['We will restore them, and will require nothing of them'] },
  { ref: '1 Thessalonians 5:21', book: '1Thessalonians', ch: 5, v: 21, fragments: ['Prove all things; hold fast that which is good.'] },
  { ref: 'Proverbs 18:13', book: 'Proverbs', ch: 18, v: 13, fragments: ['He that answereth a matter before he heareth it, it is folly and shame unto him.'] },
  { ref: 'Proverbs 18:17', book: 'Proverbs', ch: 18, v: 17, fragments: ['He that is first in his own cause seemeth just; but his neighbour cometh and searcheth him.'] },
  { ref: 'Matthew 7:20', book: 'Matthew', ch: 7, v: 20, fragments: ['by their fruits ye shall know them'] },
  { ref: 'Romans 13:8', book: 'Romans', ch: 13, v: 8, fragments: ['Owe no man any thing, but to love one another'] },
  { ref: 'James 5:4', book: 'James', ch: 5, v: 4, fragments: ['crieth: and the cries of them which have reaped are entered into the ears of the Lord of sabaoth'] },
  { ref: 'Proverbs 14:31', book: 'Proverbs', ch: 14, v: 31, fragments: ['He that oppresseth the poor reproacheth his Maker'] },
  { ref: 'Amos 5:12', book: 'Amos', ch: 5, v: 12, fragments: ['turn aside the poor in the gate from their right'] },
  { ref: 'Proverbs 22:22', book: 'Proverbs', ch: 22, v: 22, fragments: ['Rob not the poor, because he is poor'] },
  { ref: 'Proverbs 22:23', book: 'Proverbs', ch: 22, v: 23, fragments: ['the LORD will plead their cause'] },
  { ref: 'Psalms 82:3', book: 'Psalms', ch: 82, v: 3, fragments: ['Defend the poor and fatherless: do justice to the afflicted and needy.'] },
  { ref: 'Micah 6:8', book: 'Micah', ch: 6, v: 8, fragments: ['to do justly, and to love mercy, and to walk humbly with thy God'] },
];

describe('Issue 11 — College and the 1965 Act: every fragment verbatim from the repo KJV', () => {
  const issue = WORLD_ISSUES.find((i) => i.id === 'wi-tuition-and-the-1965-act');
  const norm = (s) => s.replace(/[’‘]/g, "'").replace(/\s+/g, ' ');

  it('the issue is published', () => {
    expect(issue).toBeTruthy();
  });

  it('every quoted fragment is a verbatim substring of the cited KJV verse', () => {
    const failures = [];
    for (const q of TUITION_1965_QUOTES) {
      const text = kjvVerse(q.book, q.ch, q.v);
      for (const frag of q.fragments) {
        if (!norm(text).includes(norm(frag))) {
          failures.push(`${q.ref}: NOT VERBATIM — "${frag}" (verse reads: "${text}")`);
        }
      }
    }
    expect(failures).toEqual([]);
  });

  it('every fragment actually appears in the issue content (no stale list)', () => {
    const blob = norm(JSON.stringify(issue));
    const missing = TUITION_1965_QUOTES.flatMap((q) =>
      q.fragments.filter((frag) => !blob.includes(norm(frag))).map((frag) => `${q.ref}: "${frag}"`));
    expect(missing).toEqual([]);
  });

  // PROVEN-TO-CATCH: a one-word tamper in the load-bearing verse must fail.
  it('CATCHES a one-word tamper in a pinned verse', () => {
    const real = kjvVerse('Proverbs', 22, 7);
    expect(norm(real).includes(norm('the borrower is master to the lender'))).toBe(false);
    expect(norm(real).includes(norm('the borrower is servant to the lender'))).toBe(true);
  });

  // DR-0100's three tiers are load-bearing: the documented 312% is stated as
  // fact, the causal claim is carried as the creator's interpretation, and the
  // fruit is judged by the Word regardless of motive.
  it('states the documented plainly and labels the causal claim as opinion', () => {
    const c = issue.claims.find((x) => x.id === 'c-causation');
    expect(c.label).toBe('opinion');
    expect(issue.claims.find((x) => x.id === 'c-312-percent').note).toMatch(/matches the NCES/);
    expect(issue.verifiable.find((v) => v.id === 'f-tuition-growth').status).toBe('documented');
    expect(issue.verifiable.find((v) => v.id === 'f-drivers-debated').status).toBe('partly-documented');
  });

  it('Nehemiah 5 is the template and release is the remedy — Word first, fruit judged regardless of motive', () => {
    const blob = JSON.stringify(issue);
    expect(issue.lens.fourD.deepSource.indexOf('WORD FIRST')).toBe(0);
    expect(blob).toContain('NEHEMIAH 5 IS THE TEMPLATE');
    expect(blob).toContain('release and restoration');
    expect(issue.lens.accountability.scripture).toMatch(/Ecclesiastes 12:14/);
  });

  it('carries a grace note that condemns no one', () => {
    expect(issue.lens.graceNote).toMatch(/No condemnation/i);
  });
});


// =============================================================================
// ISSUE 12 — The EPA unwinds the power-plant carbon rules
// (wi-epa-power-plant-carbon-rules-2026). Darrell forwarded the Morning Brew
// lead and the NPR Up First bullet as build input on 2026-09-15. Every fragment
// below was fetched from the repo KJV at authoring time; a drift fails here.
// =============================================================================
const EPA_POWER_PLANT_QUOTES = [
  { ref: 'Psalms 24:1', book: 'Psalms', ch: 24, v: 1, fragments: ['The earth is the LORD’s, and the fulness thereof; the world, and they that dwell therein.', 'The earth is the LORD’s, and the fulness thereof', 'The earth is the LORD’s'] },
  { ref: 'Leviticus 25:23', book: 'Leviticus', ch: 25, v: 23, fragments: ['The land shall not be sold for ever: for the land is mine; for ye are strangers and sojourners with me.'] },
  { ref: 'Psalms 50:10', book: 'Psalms', ch: 50, v: 10, fragments: ['For every beast of the forest is mine, and the cattle upon a thousand hills.'] },
  { ref: 'Genesis 1:28', book: 'Genesis', ch: 1, v: 28, fragments: ['replenish the earth, and subdue it', 'have dominion', 'Be fruitful, and multiply'] },
  { ref: 'Psalms 115:16', book: 'Psalms', ch: 115, v: 16, fragments: ['the earth hath he given to the children of men'] },
  { ref: 'Genesis 2:15', book: 'Genesis', ch: 2, v: 15, fragments: ['And the LORD God took the man, and put him into the garden of Eden to dress it and to keep it.', 'to dress it and to keep it'] },
  { ref: '1 Corinthians 4:2', book: '1Corinthians', ch: 4, v: 2, fragments: ['it is required in stewards, that a man be found faithful.'] },
  { ref: 'Numbers 35:33', book: 'Numbers', ch: 35, v: 33, fragments: ['So ye shall not pollute the land wherein ye are'] },
  { ref: 'Numbers 35:34', book: 'Numbers', ch: 35, v: 34, fragments: ['Defile not therefore the land which ye shall inhabit, wherein I dwell'] },
  { ref: 'Exodus 23:11', book: 'Exodus', ch: 23, v: 11, fragments: ['But the seventh year thou shalt let it rest and lie still; that the poor of thy people may eat'] },
  { ref: 'Leviticus 25:4', book: 'Leviticus', ch: 25, v: 4, fragments: ['But in the seventh year shall be a sabbath of rest unto the land, a sabbath for the LORD'] },
  { ref: 'Deuteronomy 20:19', book: 'Deuteronomy', ch: 20, v: 19, fragments: ['thou shalt not destroy the trees thereof by forcing an axe against them', 'for the tree of the field is man’s life'] },
  { ref: 'Deuteronomy 11:12', book: 'Deuteronomy', ch: 11, v: 12, fragments: ['A land which the LORD thy God careth for: the eyes of the LORD thy God are always upon it'] },
  { ref: 'Jeremiah 2:7', book: 'Jeremiah', ch: 2, v: 7, fragments: ['but when ye entered, ye defiled my land, and made mine heritage an abomination'] },
  { ref: 'Isaiah 24:5', book: 'Isaiah', ch: 24, v: 5, fragments: ['The earth also is defiled under the inhabitants thereof'] },
  { ref: 'Hosea 4:3', book: 'Hosea', ch: 4, v: 3, fragments: ['Therefore shall the land mourn, and every one that dwelleth therein shall languish, with the beasts of the field, and with the fowls of heaven'] },
  { ref: 'Revelation 11:18', book: 'Revelation', ch: 11, v: 18, fragments: ['and shouldest destroy them which destroy the earth', 'destroy the earth'] },
  { ref: 'Proverbs 12:10', book: 'Proverbs', ch: 12, v: 10, fragments: ['A righteous man regardeth the life of his beast: but the tender mercies of the wicked are cruel.'] },
  { ref: 'Deuteronomy 25:4', book: 'Deuteronomy', ch: 25, v: 4, fragments: ['Thou shalt not muzzle the ox when he treadeth out the corn.'] },
  { ref: 'Deuteronomy 22:6', book: 'Deuteronomy', ch: 22, v: 6, fragments: ['thou shalt not take the dam with the young'] },
  { ref: 'Deuteronomy 22:7', book: 'Deuteronomy', ch: 22, v: 7, fragments: ['But thou shalt in any wise let the dam go, and take the young to thee; that it may be well with thee, and that thou mayest prolong thy days.'] },
  { ref: 'Job 12:10', book: 'Job', ch: 12, v: 10, fragments: ['In whose hand is the soul of every living thing, and the breath of all mankind.'] },
  { ref: 'Romans 1:25', book: 'Romans', ch: 1, v: 25, fragments: ['worshipped and served the creature more than the Creator'] },
  { ref: 'Romans 1:20', book: 'Romans', ch: 1, v: 20, fragments: ['the invisible things of him from the creation of the world are clearly seen, being understood by the things that are made'] },
  { ref: 'Colossians 1:16', book: 'Colossians', ch: 1, v: 16, fragments: ['all things were created by him, and for him'] },
  { ref: 'Colossians 1:17', book: 'Colossians', ch: 1, v: 17, fragments: ['by him all things consist.'] },
  { ref: 'Genesis 9:3', book: 'Genesis', ch: 9, v: 3, fragments: ['Every moving thing that liveth shall be meat for you'] },
  { ref: '1 Timothy 4:4', book: '1Timothy', ch: 4, v: 4, fragments: ['For every creature of God is good, and nothing to be refused, if it be received with thanksgiving'] },
  { ref: 'Proverbs 11:1', book: 'Proverbs', ch: 11, v: 1, fragments: ['A false balance is abomination to the LORD: but a just weight is his delight.', 'A false balance is abomination to the LORD'] },
  { ref: 'Proverbs 20:23', book: 'Proverbs', ch: 20, v: 23, fragments: ['Divers weights are an abomination unto the LORD; and a false balance is not good.'] },
  { ref: 'Proverbs 16:11', book: 'Proverbs', ch: 16, v: 11, fragments: ['A just weight and balance are the LORD’s: all the weights of the bag are his work.'] },
  { ref: '1 Thessalonians 5:21', book: '1Thessalonians', ch: 5, v: 21, fragments: ['Prove all things; hold fast that which is good.'] },
  { ref: 'Proverbs 18:13', book: 'Proverbs', ch: 18, v: 13, fragments: ['He that answereth a matter before he heareth it, it is folly and shame unto him.'] },
  { ref: 'Proverbs 18:17', book: 'Proverbs', ch: 18, v: 17, fragments: ['He that is first in his own cause seemeth just; but his neighbour cometh and searcheth him.'] },
  { ref: 'Isaiah 10:1', book: 'Isaiah', ch: 10, v: 1, fragments: ['Woe unto them that decree unrighteous decrees, and that write grievousness which they have prescribed', 'Woe unto them that decree unrighteous decrees'] },
  { ref: 'Isaiah 10:2', book: 'Isaiah', ch: 10, v: 2, fragments: ['To turn aside the needy from judgment, and to take away the right from the poor of my people', 'the poor of my people'] },
  { ref: 'Proverbs 29:7', book: 'Proverbs', ch: 29, v: 7, fragments: ['The righteous considereth the cause of the poor: but the wicked regardeth not to know it.'] },
  { ref: 'Proverbs 14:31', book: 'Proverbs', ch: 14, v: 31, fragments: ['He that oppresseth the poor reproacheth his Maker'] },
  { ref: 'Matthew 7:20', book: 'Matthew', ch: 7, v: 20, fragments: ['by their fruits ye shall know them'] },
  { ref: '1 Timothy 2:1', book: '1Timothy', ch: 2, v: 1, fragments: ['supplications, prayers, intercessions, and giving of thanks, be made for all men'] },
  { ref: '1 Timothy 2:2', book: '1Timothy', ch: 2, v: 2, fragments: ['For kings, and for all that are in authority; that we may lead a quiet and peaceable life in all godliness and honesty.', 'For kings, and for all that are in authority'] },
  { ref: 'Proverbs 31:8', book: 'Proverbs', ch: 31, v: 8, fragments: ['Open thy mouth for the dumb in the cause of all such as are appointed to destruction.', 'Open thy mouth for the dumb'] },
  { ref: 'Proverbs 31:9', book: 'Proverbs', ch: 31, v: 9, fragments: ['Open thy mouth, judge righteously, and plead the cause of the poor and needy.'] },
  { ref: 'Ecclesiastes 12:14', book: 'Ecclesiastes', ch: 12, v: 14, fragments: ['God shall bring every work into judgment, with every secret thing, whether it be good, or whether it be evil.'] },
  { ref: 'Deuteronomy 22:8', book: 'Deuteronomy', ch: 22, v: 8, fragments: ['thou shalt make a battlement for thy roof, that thou bring not blood upon thine house'] },
  { ref: 'Micah 6:8', book: 'Micah', ch: 6, v: 8, fragments: ['to do justly, and to love mercy, and to walk humbly with thy God'] },
  { ref: 'Isaiah 1:17', book: 'Isaiah', ch: 1, v: 17, fragments: ['Learn to do well; seek judgment, relieve the oppressed'] },
  { ref: 'Galatians 6:7', book: 'Galatians', ch: 6, v: 7, fragments: ['God is not mocked: for whatsoever a man soweth, that shall he also reap'] },
  { ref: 'Revelation 20:12', book: 'Revelation', ch: 20, v: 12, fragments: ['the books were opened'] },
  { ref: 'Proverbs 22:3', book: 'Proverbs', ch: 22, v: 3, fragments: ['A prudent man foreseeth the evil, and hideth himself'] },
  { ref: 'Jeremiah 29:7', book: 'Jeremiah', ch: 29, v: 7, fragments: ['the peace of the city'] },
  { ref: 'Matthew 25:40', book: 'Matthew', ch: 25, v: 40, fragments: ['the least of these'] },
];

describe('Issue 12 — The EPA and the power-plant carbon rules: every fragment verbatim from the repo KJV', () => {
  const issue = WORLD_ISSUES.find((i) => i.id === 'wi-epa-power-plant-carbon-rules-2026');
  const norm = (s) => s.replace(/[’‘]/g, "'").replace(/\s+/g, ' ');

  it('the issue is published', () => {
    expect(issue).toBeTruthy();
  });

  it('every quoted fragment is a verbatim substring of the cited KJV verse', () => {
    const failures = [];
    for (const q of EPA_POWER_PLANT_QUOTES) {
      const text = kjvVerse(q.book, q.ch, q.v);
      for (const frag of q.fragments) {
        if (!norm(text).includes(norm(frag))) {
          failures.push(`${q.ref}: NOT VERBATIM — "${frag}" (verse reads: "${text}")`);
        }
      }
    }
    expect(failures).toEqual([]);
  });

  it('every fragment actually appears in the issue content (no stale list)', () => {
    const blob = norm(JSON.stringify(issue));
    const missing = EPA_POWER_PLANT_QUOTES.flatMap((q) =>
      q.fragments.filter((frag) => !blob.includes(norm(frag))).map((frag) => `${q.ref}: "${frag}"`));
    expect(missing).toEqual([]);
  });

  // PROVEN-TO-CATCH: a one-word tamper in the load-bearing verse must fail.
  it('CATCHES a one-word tamper in a pinned verse', () => {
    const real = kjvVerse('Genesis', 2, 15);
    expect(norm(real).includes(norm('to use it and to keep it'))).toBe(false);
    expect(norm(real).includes(norm('to dress it and to keep it'))).toBe(true);
    const psalm = kjvVerse('Psalms', 24, 1);
    expect(norm(psalm).includes(norm('The earth is ours'))).toBe(false);
    expect(norm(psalm).includes(norm('The earth is the LORD’s'))).toBe(true);
  });

  // DR-0100's three tiers are load-bearing: the repeal and the agency's own
  // $310B projection are stated as documented; coal-smoke damage is stated as
  // documented (Tier 1); the AP 30,000 is carried as a modeled projection
  // (partly-documented, flagged narrowly, never dismissed); the newsletter's
  // "coincide with data centers" framing is labeled opinion.
  it('states the documented plainly, carries the modeled as modeled, and labels the framing as opinion', () => {
    expect(issue.claims.find((x) => x.id === 'c-data-centers').label).toBe('opinion');
    expect(issue.claims.find((x) => x.id === 'c-300b').label).toBe('claim');
    expect(issue.claims.find((x) => x.id === 'c-30k').note).toMatch(/WHOLE slate/);
    expect(issue.verifiable.find((v) => v.id === 'f-repeal').status).toBe('documented');
    expect(issue.verifiable.find((v) => v.id === 'f-coal-smoke-damage').status).toBe('documented');
    expect(issue.verifiable.find((v) => v.id === 'f-ap-projection').status).toBe('partly-documented');
    expect(issue.verifiable.find((v) => v.id === 'f-ap-projection').note).toMatch(/never "no one knows/);
  });

  it('the Word corrects BOTH over-reaches — dominion is stewardship, and the creation is not God', () => {
    const blob = JSON.stringify(issue);
    expect(issue.lens.fourD.deepSource.indexOf('WORD FIRST')).toBe(0);
    expect(blob).toContain('DOMINION IS STEWARDSHIP, NOT LICENSE');
    expect(blob).toContain('BUT THE CREATION IS NOT GOD');
    expect(blob).toContain('THE JUST WEIGHT HAS TWO PANS');
    expect(blob).toContain('THE POOR BREATHE THE SMOKE FIRST');
    expect(issue.lens.accountability.scripture).toMatch(/Ecclesiastes 12:14/);
    expect(issue.lens.anchor.ref).toBe('Genesis 2:15; Psalms 24:1');
  });

  it('carries a grace note that condemns no one and commands prayer for rulers', () => {
    expect(issue.lens.graceNote).toMatch(/No condemnation/i);
    expect(issue.lens.fourD.scripture).toMatch(/1 Timothy 2:1-2/);
    expect(issue.perspectives.length).toBeGreaterThanOrEqual(3);
  });
});


// =============================================================================
// ISSUE 16 — The trades are hiring (wi-the-trades-are-hiring-2026).
// Darrell forwarded the 2026-09-15 Morning Brew bullet as build input
// ("Lesson."). Every fragment below was fetched from the repo KJV at authoring
// time; a drift fails here.
// =============================================================================
const TRADES_HIRING_QUOTES = [
  { ref: 'Genesis 2:15', book: 'Genesis', ch: 2, v: 15, fragments: ['And the LORD God took the man, and put him into the garden of Eden to dress it and to keep it.', 'to dress it and to keep it'] },
  { ref: 'Genesis 3:19', book: 'Genesis', ch: 3, v: 19, fragments: ['In the sweat of thy face shalt thou eat bread'] },
  { ref: 'Exodus 31:2', book: 'Exodus', ch: 31, v: 2, fragments: ['See, I have called by name Bezaleel'] },
  { ref: 'Exodus 31:3', book: 'Exodus', ch: 31, v: 3, fragments: ['And I have filled him with the spirit of God, in wisdom, and in understanding, and in knowledge, and in all manner of workmanship', 'I have filled him with the spirit of God'] },
  { ref: 'Exodus 31:4', book: 'Exodus', ch: 31, v: 4, fragments: ['to work in gold, and in silver, and in brass'] },
  { ref: 'Exodus 31:5', book: 'Exodus', ch: 31, v: 5, fragments: ['in cutting of stones, to set them, and in carving of timber'] },
  { ref: 'Exodus 35:34', book: 'Exodus', ch: 35, v: 34, fragments: ['he hath put in his heart that he may teach'] },
  { ref: 'Exodus 35:35', book: 'Exodus', ch: 35, v: 35, fragments: ['Them hath he filled with wisdom of heart, to work all manner of work'] },
  { ref: 'Mark 6:3', book: 'Mark', ch: 6, v: 3, fragments: ['Is not this the carpenter, the son of Mary', 'the carpenter'] },
  { ref: 'Matthew 13:55', book: 'Matthew', ch: 13, v: 55, fragments: ['Is not this the carpenter’s son?'] },
  { ref: 'Acts 22:3', book: 'Acts', ch: 22, v: 3, fragments: ['brought up in this city at the feet of Gamaliel'] },
  { ref: 'Acts 18:3', book: 'Acts', ch: 18, v: 3, fragments: ['because he was of the same craft, he abode with them, and wrought: for by their occupation they were tentmakers'] },
  { ref: 'Acts 20:34', book: 'Acts', ch: 20, v: 34, fragments: ['these hands have ministered unto my necessities, and to them that were with me'] },
  { ref: '1 Thessalonians 4:11', book: '1Thessalonians', ch: 4, v: 11, fragments: ['to do your own business, and to work with your own hands, as we commanded you', 'work with your own hands'] },
  { ref: '1 Thessalonians 4:12', book: '1Thessalonians', ch: 4, v: 12, fragments: ['That ye may walk honestly toward them that are without, and that ye may have lack of nothing.'] },
  { ref: '2 Thessalonians 3:10', book: '2Thessalonians', ch: 3, v: 10, fragments: ['if any would not work, neither should he eat', 'would not work'] },
  { ref: '2 Thessalonians 3:11', book: '2Thessalonians', ch: 3, v: 11, fragments: ['working not at all, but are busybodies'] },
  { ref: '2 Thessalonians 3:12', book: '2Thessalonians', ch: 3, v: 12, fragments: ['that with quietness they work, and eat their own bread'] },
  { ref: 'Ephesians 4:28', book: 'Ephesians', ch: 4, v: 28, fragments: ['let him labour, working with his hands the thing which is good, that he may have to give to him that needeth'] },
  { ref: 'Proverbs 14:23', book: 'Proverbs', ch: 14, v: 23, fragments: ['In all labour there is profit: but the talk of the lips tendeth only to penury.'] },
  { ref: 'Ecclesiastes 9:10', book: 'Ecclesiastes', ch: 9, v: 10, fragments: ['Whatsoever thy hand findeth to do, do it with thy might'] },
  { ref: 'Proverbs 22:29', book: 'Proverbs', ch: 22, v: 29, fragments: ['Seest thou a man diligent in his business? he shall stand before kings; he shall not stand before mean men.', 'Seest thou a man diligent in his business? he shall stand before kings', 'shall stand before kings'] },
  { ref: 'Luke 10:7', book: 'Luke', ch: 10, v: 7, fragments: ['the labourer is worthy of his hire', 'worthy of his hire'] },
  { ref: '1 Timothy 5:18', book: '1Timothy', ch: 5, v: 18, fragments: ['The labourer is worthy of his reward.'] },
  { ref: 'Leviticus 19:13', book: 'Leviticus', ch: 19, v: 13, fragments: ['the wages of him that is hired shall not abide with thee all night until the morning', 'shall not abide with thee all night'] },
  { ref: 'Deuteronomy 24:15', book: 'Deuteronomy', ch: 24, v: 15, fragments: ['At his day thou shalt give him his hire, neither shall the sun go down upon it', 'neither shall the sun go down upon it'] },
  { ref: 'James 5:4', book: 'James', ch: 5, v: 4, fragments: ['the hire of the labourers who have reaped down your fields, which is of you kept back by fraud, crieth'] },
  { ref: 'Luke 14:28', book: 'Luke', ch: 14, v: 28, fragments: ['sitteth not down first, and counteth the cost, whether he have sufficient to finish it?', 'sitteth not down first, and counteth the cost'] },
  { ref: 'Proverbs 24:27', book: 'Proverbs', ch: 24, v: 27, fragments: ['Prepare thy work without, and make it fit for thyself in the field; and afterwards build thine house.', 'Prepare thy work without'] },
  { ref: 'Romans 13:8', book: 'Romans', ch: 13, v: 8, fragments: ['Owe no man any thing, but to love one another'] },
  { ref: 'Proverbs 22:7', book: 'Proverbs', ch: 22, v: 7, fragments: ['the borrower is servant to the lender'] },
  { ref: 'Proverbs 4:7', book: 'Proverbs', ch: 4, v: 7, fragments: ['Wisdom is the principal thing; therefore get wisdom: and with all thy getting get understanding.', 'Wisdom is the principal thing; therefore get wisdom', 'get wisdom'] },
  { ref: '1 Corinthians 12:21', book: '1Corinthians', ch: 12, v: 21, fragments: ['the eye cannot say unto the hand, I have no need of thee'] },
  { ref: '1 Corinthians 12:22', book: '1Corinthians', ch: 12, v: 22, fragments: ['those members of the body, which seem to be more feeble, are necessary'] },
  { ref: '1 Corinthians 12:18', book: '1Corinthians', ch: 12, v: 18, fragments: ['now hath God set the members every one of them in the body, as it hath pleased him'] },
  { ref: '1 Thessalonians 5:21', book: '1Thessalonians', ch: 5, v: 21, fragments: ['Prove all things; hold fast that which is good.'] },
  { ref: 'Proverbs 18:13', book: 'Proverbs', ch: 18, v: 13, fragments: ['He that answereth a matter before he heareth it, it is folly and shame unto him.'] },
  { ref: 'Proverbs 18:17', book: 'Proverbs', ch: 18, v: 17, fragments: ['He that is first in his own cause seemeth just; but his neighbour cometh and searcheth him.'] },
  { ref: 'Matthew 7:20', book: 'Matthew', ch: 7, v: 20, fragments: ['by their fruits ye shall know them'] },
  { ref: 'Proverbs 6:6', book: 'Proverbs', ch: 6, v: 6, fragments: ['Go to the ant, thou sluggard; consider her ways, and be wise'] },
  { ref: 'Proverbs 6:8', book: 'Proverbs', ch: 6, v: 8, fragments: ['Provideth her meat in the summer, and gathereth her food in the harvest.'] },
  { ref: 'Proverbs 6:10', book: 'Proverbs', ch: 6, v: 10, fragments: ['Yet a little sleep, a little slumber, a little folding of the hands to sleep'] },
  { ref: 'Proverbs 6:11', book: 'Proverbs', ch: 6, v: 11, fragments: ['So shall thy poverty come as one that travelleth, and thy want as an armed man.'] },
  { ref: 'Colossians 3:23', book: 'Colossians', ch: 3, v: 23, fragments: ['whatsoever ye do, do it heartily, as to the Lord, and not unto men', 'do it heartily, as to the Lord', 'as to the Lord'] },
  { ref: 'Colossians 3:24', book: 'Colossians', ch: 3, v: 24, fragments: ['for ye serve the Lord Christ'] },
  { ref: 'Ecclesiastes 12:14', book: 'Ecclesiastes', ch: 12, v: 14, fragments: ['For God shall bring every work into judgment, with every secret thing, whether it be good, or whether it be evil.'] },
  { ref: 'Proverbs 11:1', book: 'Proverbs', ch: 11, v: 1, fragments: ['a just weight is his delight'] },
  { ref: 'Proverbs 22:6', book: 'Proverbs', ch: 22, v: 6, fragments: ['Train up a child in the way he should go: and when he is old, he will not depart from it.'] },
  { ref: 'Deuteronomy 8:18', book: 'Deuteronomy', ch: 8, v: 18, fragments: ['it is he that giveth thee power to get wealth'] },
  { ref: 'Galatians 6:7', book: 'Galatians', ch: 6, v: 7, fragments: ['God is not mocked: for whatsoever a man soweth, that shall he also reap'] },
];

describe('Issue 16 — The trades are hiring: every fragment verbatim from the repo KJV', () => {
  const issue = WORLD_ISSUES.find((i) => i.id === 'wi-the-trades-are-hiring-2026');
  const norm = (s) => s.replace(/[’‘]/g, "'").replace(/\s+/g, ' ');

  it('the issue is published', () => {
    expect(issue).toBeTruthy();
  });

  it('every quoted fragment is a verbatim substring of the cited KJV verse', () => {
    const failures = [];
    for (const q of TRADES_HIRING_QUOTES) {
      const text = kjvVerse(q.book, q.ch, q.v);
      for (const frag of q.fragments) {
        if (!norm(text).includes(norm(frag))) {
          failures.push(`${q.ref}: NOT VERBATIM — "${frag}" (verse reads: "${text}")`);
        }
      }
    }
    expect(failures).toEqual([]);
  });

  it('every fragment actually appears in the issue content (no stale list)', () => {
    const blob = norm(JSON.stringify(issue));
    const missing = TRADES_HIRING_QUOTES.flatMap((q) =>
      q.fragments.filter((frag) => !blob.includes(norm(frag))).map((frag) => `${q.ref}: "${frag}"`));
    expect(missing).toEqual([]);
  });

  // PROVEN-TO-CATCH: a one-word tamper in the load-bearing verse must fail.
  it('CATCHES a one-word tamper in a pinned verse', () => {
    const real = kjvVerse('Genesis', 2, 15);
    expect(norm(real).includes(norm('to dress it and to sell it'))).toBe(false);
    expect(norm(real).includes(norm('to dress it and to keep it'))).toBe(true);
    const kings = kjvVerse('Proverbs', 22, 29);
    expect(norm(kings).includes(norm('he shall stand before princes'))).toBe(false);
    expect(norm(kings).includes(norm('he shall stand before kings'))).toBe(true);
  });

  // DR-0100's three tiers are load-bearing: the Burning Glass finding and the
  // 2.7% vs 4.7% are DOCUMENTED and said plainly; the AI share is PARTLY
  // documented and flagged narrowly; the two slogans are carried as OPINION so
  // the Word can correct both while the data under them stands.
  it('states the documented plainly, keeps the AI share open, and labels the two slogans as opinion', () => {
    expect(issue.claims.find((x) => x.id === 'c-two-slogans').label).toBe('opinion');
    expect(issue.claims.find((x) => x.id === 'c-best-market').label).toBe('claim');
    expect(issue.verifiable.find((v) => v.id === 'f-bgi-wsj').status).toBe('documented');
    expect(issue.verifiable.find((v) => v.id === 'f-bls-august').status).toBe('documented');
    expect(issue.verifiable.find((v) => v.id === 'f-illinois-cost').status).toBe('documented');
    expect(issue.verifiable.find((v) => v.id === 'f-ai-link').status).toBe('partly-documented');
    expect(issue.claims.find((x) => x.id === 'c-degree-still-lower').note).toMatch(/4\.4%/);
    for (const v of issue.verifiable) {
      for (const s of v.sources) expect(s.asOf).toBe('2026-09-15');
    }
  });

  it('Word first — work before the fall, the craftsman filled, the carpenter and the tentmaker, the laborer paid, both slogans corrected', () => {
    const blob = JSON.stringify(issue);
    expect(issue.lens.fourD.deepSource.indexOf('WORD FIRST')).toBe(0);
    expect(blob).toContain('THE WORD HONORS THE CRAFTSMAN BY NAME');
    expect(blob).toContain('THE LORD HIMSELF WORKED WITH HIS HANDS');
    expect(blob).toContain('THE WORD PAYS THE LABORER, ON TIME');
    expect(blob).toContain('NOW THE WORD CORRECTS THE TWO SLOGANS');
    expect(issue.lens.accountability.scripture).toMatch(/Ecclesiastes 12:14/);
    expect(issue.lens.benefits.some((b) => /Ecclesiastes 12:14|ETERNAL court/.test(b))).toBe(true);
    expect(issue.perspectives.length).toBeGreaterThanOrEqual(4);
  });

  it('carries a grace note that condemns no one', () => {
    expect(issue.lens.graceNote).toMatch(/No condemnation/i);
  });
});


// =============================================================================
// ISSUE 13 — The Supreme Court leaves the mail-in rules alone
// (wi-scotus-mail-in-voting-2026). Darrell forwarded the Morning Brew and NPR
// Up First items as build input on 2026-09-15. Every fragment below was fetched
// from the repo KJV at authoring time; a drift fails here.
// =============================================================================
const SCOTUS_MAIL_IN_QUOTES = [
  { ref: 'Leviticus 19:35', book: 'Leviticus', ch: 19, v: 35, fragments: ['Ye shall do no unrighteousness in judgment, in meteyard, in weight, or in measure.'] },
  { ref: 'Leviticus 19:36', book: 'Leviticus', ch: 19, v: 36, fragments: ['Just balances, just weights, a just ephah, and a just hin, shall ye have: I am the LORD your God, which brought you out of the land of Egypt.'] },
  { ref: 'Proverbs 16:11', book: 'Proverbs', ch: 16, v: 11, fragments: ['A just weight and balance are the LORD’s: all the weights of the bag are his work.'] },
  { ref: 'Proverbs 11:1', book: 'Proverbs', ch: 11, v: 1, fragments: ['A false balance is abomination to the LORD: but a just weight is his delight.'] },
  { ref: 'Proverbs 20:10', book: 'Proverbs', ch: 20, v: 10, fragments: ['Divers weights, and divers measures, both of them are alike abomination to the LORD.'] },
  { ref: 'Deuteronomy 16:18', book: 'Deuteronomy', ch: 16, v: 18, fragments: ['Judges and officers shalt thou make thee in all thy gates', 'they shall judge the people with just judgment.'] },
  { ref: 'Deuteronomy 16:19', book: 'Deuteronomy', ch: 16, v: 19, fragments: ['Thou shalt not wrest judgment; thou shalt not respect persons, neither take a gift: for a gift doth blind the eyes of the wise, and pervert the words of the righteous.'] },
  { ref: 'Deuteronomy 16:20', book: 'Deuteronomy', ch: 16, v: 20, fragments: ['That which is altogether just shalt thou follow'] },
  { ref: 'Deuteronomy 1:17', book: 'Deuteronomy', ch: 1, v: 17, fragments: ['Ye shall not respect persons in judgment; but ye shall hear the small as well as the great; ye shall not be afraid of the face of man; for the judgment is God’s'] },
  { ref: 'Exodus 23:8', book: 'Exodus', ch: 23, v: 8, fragments: ['And thou shalt take no gift: for the gift blindeth the wise, and perverteth the words of the righteous.'] },
  { ref: 'Exodus 23:2', book: 'Exodus', ch: 23, v: 2, fragments: ['Thou shalt not follow a multitude to do evil; neither shalt thou speak in a cause to decline after many to wrest judgment'] },
  { ref: '2 Chronicles 19:6', book: '2Chronicles', ch: 19, v: 6, fragments: ['Take heed what ye do: for ye judge not for man, but for the LORD, who is with you in the judgment.'] },
  { ref: 'Romans 13:1', book: 'Romans', ch: 13, v: 1, fragments: ['Let every soul be subject unto the higher powers. For there is no power but of God: the powers that be are ordained of God.'] },
  { ref: 'Romans 13:4', book: 'Romans', ch: 13, v: 4, fragments: ['For he is the minister of God to thee for good.'] },
  { ref: '1 Peter 2:13', book: '1Peter', ch: 2, v: 13, fragments: ['Submit yourselves to every ordinance of man for the Lord’s sake: whether it be to the king, as supreme;'] },
  { ref: '1 Peter 2:14', book: '1Peter', ch: 2, v: 14, fragments: ['Or unto governors, as unto them that are sent by him for the punishment of evildoers, and for the praise of them that do well.'] },
  { ref: '1 Timothy 2:1', book: '1Timothy', ch: 2, v: 1, fragments: ['I exhort therefore, that, first of all, supplications, prayers, intercessions, and giving of thanks, be made for all men;'] },
  { ref: '1 Timothy 2:2', book: '1Timothy', ch: 2, v: 2, fragments: ['For kings, and for all that are in authority; that we may lead a quiet and peaceable life in all godliness and honesty.'] },
  { ref: 'Matthew 22:21', book: 'Matthew', ch: 22, v: 21, fragments: ['Render therefore unto Caesar the things which are Caesar’s; and unto God the things that are God’s.'] },
  { ref: 'Proverbs 16:33', book: 'Proverbs', ch: 16, v: 33, fragments: ['The lot is cast into the lap; but the whole disposing thereof is of the LORD.', 'the whole disposing thereof is of the LORD.'] },
  { ref: 'Proverbs 21:1', book: 'Proverbs', ch: 21, v: 1, fragments: ['The king’s heart is in the hand of the LORD, as the rivers of water: he turneth it whithersoever he will.'] },
  { ref: 'Psalms 75:7', book: 'Psalms', ch: 75, v: 7, fragments: ['But God is the judge: he putteth down one, and setteth up another.'] },
  { ref: 'Matthew 7:20', book: 'Matthew', ch: 7, v: 20, fragments: ['Wherefore by their fruits ye shall know them.'] },
  { ref: 'Proverbs 29:2', book: 'Proverbs', ch: 29, v: 2, fragments: ['When the righteous are in authority, the people rejoice: but when the wicked beareth rule, the people mourn.'] },
  { ref: 'Ecclesiastes 12:14', book: 'Ecclesiastes', ch: 12, v: 14, fragments: ['For God shall bring every work into judgment, with every secret thing, whether it be good, or whether it be evil.', 'God shall bring every work into judgment, with every secret thing'] },
  { ref: '1 Thessalonians 5:21', book: '1Thessalonians', ch: 5, v: 21, fragments: ['Prove all things; hold fast that which is good.'] },
  { ref: 'Proverbs 18:13', book: 'Proverbs', ch: 18, v: 13, fragments: ['He that answereth a matter before he heareth it, it is folly and shame unto him.'] },
  { ref: 'Proverbs 18:17', book: 'Proverbs', ch: 18, v: 17, fragments: ['He that is first in his own cause seemeth just; but his neighbour cometh and searcheth him.'] },
  { ref: 'Exodus 20:16', book: 'Exodus', ch: 20, v: 16, fragments: ['Thou shalt not bear false witness against thy neighbour.'] },
  { ref: 'Proverbs 19:5', book: 'Proverbs', ch: 19, v: 5, fragments: ['A false witness shall not be unpunished, and he that speaketh lies shall not escape.'] },
  { ref: 'Zechariah 8:16', book: 'Zechariah', ch: 8, v: 16, fragments: ['Speak ye every man the truth to his neighbour; execute the judgment of truth and peace in your gates'] },
  { ref: 'Proverbs 17:15', book: 'Proverbs', ch: 17, v: 15, fragments: ['He that justifieth the wicked, and he that condemneth the just, even they both are abomination to the LORD.'] },
  { ref: 'Proverbs 12:22', book: 'Proverbs', ch: 12, v: 22, fragments: ['Lying lips are abomination to the LORD: but they that deal truly are his delight.'] },
  { ref: 'Galatians 6:7', book: 'Galatians', ch: 6, v: 7, fragments: ['God is not mocked'] },
];

describe('Issue 13 — The Supreme Court and the mail-in rules: every fragment verbatim from the repo KJV', () => {
  const issue = WORLD_ISSUES.find((i) => i.id === 'wi-scotus-mail-in-voting-2026');
  const norm = (s) => s.replace(/[’‘]/g, "'").replace(/\s+/g, ' ');

  it('the issue is published', () => {
    expect(issue).toBeTruthy();
  });

  it('every quoted fragment is a verbatim substring of the cited KJV verse', () => {
    const failures = [];
    for (const q of SCOTUS_MAIL_IN_QUOTES) {
      const text = kjvVerse(q.book, q.ch, q.v);
      for (const frag of q.fragments) {
        if (!norm(text).includes(norm(frag))) {
          failures.push(`${q.ref}: NOT VERBATIM — "${frag}" (verse reads: "${text}")`);
        }
      }
    }
    expect(failures).toEqual([]);
  });

  it('every fragment actually appears in the issue content (no stale list)', () => {
    const blob = norm(JSON.stringify(issue));
    const missing = SCOTUS_MAIL_IN_QUOTES.flatMap((q) =>
      q.fragments.filter((frag) => !blob.includes(norm(frag))).map((frag) => `${q.ref}: "${frag}"`));
    expect(missing).toEqual([]);
  });

  // PROVEN-TO-CATCH: a one-word tamper in the anchor verse must fail.
  it('CATCHES a one-word tamper in a pinned verse', () => {
    const real = kjvVerse('Proverbs', 16, 11);
    expect(norm(real).includes(norm('A just weight and balance are the king’s'))).toBe(false);
    expect(norm(real).includes(norm('A just weight and balance are the LORD’s'))).toBe(true);
  });

  // DR-0100's three tiers are load-bearing: the procedural record is stated
  // as documented, the government's fraud characterization is carried as
  // opinion, the fraud RECORD is partly-documented (cases real, rate small,
  // "widespread" unproven), and the voter directive is a labeled call-to-action.
  it('states the procedural record plainly and labels the claims by tier', () => {
    expect(issue.claims.find((x) => x.id === 'c-admin-fraud').label).toBe('opinion');
    expect(issue.claims.find((x) => x.id === 'c-npr-check-deadlines').label).toBe('call-to-action');
    expect(issue.claims.find((x) => x.id === 'c-rebuffed').label).toBe('claim');
    expect(issue.verifiable.find((v) => v.id === 'f-scotus-order').status).toBe('documented');
    expect(issue.verifiable.find((v) => v.id === 'f-lower-courts').status).toBe('documented');
    expect(issue.verifiable.find((v) => v.id === 'f-fraud-record').status).toBe('partly-documented');
    expect(issue.verifiable.find((v) => v.id === 'f-fraud-record').statement).toMatch(/four in ten million/);
    // The merits are marked open, not decided.
    expect(issue.interpretation.find((n) => n.id === 'n-not-the-merits').statement).toMatch(/merits remain open/);
  });

  it('the just weight is the frame — Word first, both edges named, the two courts held', () => {
    const blob = JSON.stringify(issue);
    expect(issue.lens.fourD.deepSource.indexOf('WORD FIRST')).toBe(0);
    expect(blob).toContain('SO IN THIS CASE');
    expect(blob).toContain('every lawful vote');
    expect(blob).toContain('no unlawful one');
    expect(issue.lens.accountability.scripture).toMatch(/Ecclesiastes 12:14/);
    expect(issue.lens.anchor.ref).toMatch(/Proverbs 16:11/);
  });

  it('carries a grace note that condemns no one — named justices and officials included', () => {
    expect(issue.lens.graceNote).toMatch(/No condemnation/i);
    expect(issue.lens.graceNote).toMatch(/Alito/);
    expect(issue.lens.graceNote).toMatch(/Talwani/);
  });

  it('the child rendering carries no charged election vocabulary', () => {
    expect(issue.levels.child).not.toMatch(/fraud|steal|stolen|rig/i);
  });
});
