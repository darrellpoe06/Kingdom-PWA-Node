// @vitest-environment node
// =============================================================================
// The lesson is a WHOLE — one body, an honest boundary, His will, and praise
// =============================================================================
// Darrell 2026-08-10, across one sitting:
//   "Each course is designed to be clarification of the same information
//    multiple ways based on the Lord's perspectives... these courses or lessons
//    should be more complete whole... bring all the other close relevant
//    integrated understanding from research so users see Yahweh's Glory!!! So
//    we give Him Praise for how He made us."
//   "integrated systems to an integrated Body then Kingdom..."
//   "scientific concepts and research only goes so far... the rest must come
//    from Yahweh... He sees our interbeing... science can't do this... only
//    Faith."
//   "We need the actual Yahweh Who Is Was And Is To Come!!!"
//   "His Will Is being done... period... we have to suffer through it... He
//    gives us the Way through the process... as the devil reviews who he can
//    devour based on Yahweh's principals."
//
// Each lesson was a fragment: one cited work, standing alone, ending in
// information. A reader could finish it fully informed and never once be
// brought to praise — the opposite of the point. These pin the four closing
// movements onto EVERY lesson at EVERY level, and hold every verse they quote
// verbatim against the repo's own KJV (DR-0076: fetch it, never write it from
// memory — mutate one word here and the build fails).
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { WITNESS_SOURCES } from '../lib/third-witness.js';
import {
  buildHealthyLivingSchedule, relatedWitnesses, sameBodyBlock,
  WITNESS_BOUNDARY, HIS_WILL_AND_THE_WAY_THROUGH, STILL_DYING_AND_THE_PROMISE, PRAISE_CLOSE,
} from '../lib/healthy-living-course.js';

const KJV_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'public', 'bible', 'kjv');
const kjvVerse = (book, ch, v) => JSON.parse(readFileSync(join(KJV_DIR, `${book}.json`), 'utf8')).chapters[ch - 1][v - 1];
const norm = (s) => s.replace(/[’‘]/g, "'").replace(/\s+/g, ' ');

// Every fragment the four movements quote, with the verse it cites.
const INTEGRATION_QUOTES = [
  { ref: 'Colossians 1:17', book: 'Colossians', ch: 1, v: 17, fragments: ['And he is before all things, and by him all things consist'] },
  { ref: '1 Corinthians 12:12', book: '1Corinthians', ch: 12, v: 12, fragments: ['For as the body is one, and hath many members, and all the members of that one body, being many, are one body: so also is Christ'] },
  { ref: '1 Corinthians 12:26', book: '1Corinthians', ch: 12, v: 26, fragments: ['And whether one member suffer, all the members suffer with it; or one member be honoured, all the members rejoice with it'] },
  { ref: 'Psalm 139:13', book: 'Psalms', ch: 139, v: 13, fragments: ['For thou hast possessed my reins: thou hast covered me in my mother’s womb'] },
  { ref: 'Psalm 139:14', book: 'Psalms', ch: 139, v: 14, fragments: ['I will praise thee; for I am fearfully and wonderfully made: marvellous are thy works; and that my soul knoweth right well'] },
  { ref: 'Job 38:36', book: 'Job', ch: 38, v: 36, fragments: ['Who hath put wisdom in the inward parts? or who hath given understanding to the heart?'] },
  { ref: 'Ecclesiastes 3:11', book: 'Ecclesiastes', ch: 3, v: 11, fragments: ['he hath set the world in their heart, so that no man can find out the work that God maketh from the beginning to the end'] },
  { ref: 'Acts 17:28', book: 'Acts', ch: 17, v: 28, fragments: ['For in him we live, and move, and have our being'] },
  { ref: 'Deuteronomy 29:29', book: 'Deuteronomy', ch: 29, v: 29, fragments: ['The secret things belong unto the LORD our God: but those things which are revealed belong unto us and to our children for ever'] },
  { ref: 'Proverbs 3:5', book: 'Proverbs', ch: 3, v: 5, fragments: ['Trust in the LORD with all thine heart; and lean not unto thine own understanding'] },
  { ref: 'Isaiah 55:9', book: 'Isaiah', ch: 55, v: 9, fragments: ['For as the heavens are higher than the earth, so are my ways higher than your ways, and my thoughts than your thoughts'] },
  { ref: 'Revelation 1:8', book: 'Revelation', ch: 1, v: 8, fragments: ['I am Alpha and Omega, the beginning and the ending, saith the Lord, which is, and which was, and which is to come, the Almighty'] },
  { ref: 'Matthew 6:10', book: 'Matthew', ch: 6, v: 10, fragments: ['Thy kingdom come. Thy will be done in earth, as it is in heaven'] },
  { ref: 'John 16:33', book: 'John', ch: 16, v: 33, fragments: ['In the world ye shall have tribulation: but be of good cheer; I have overcome the world'] },
  { ref: 'Romans 8:28', book: 'Romans', ch: 8, v: 28, fragments: ['And we know that all things work together for good to them that love God, to them who are the called according to his purpose'] },
  { ref: '1 Corinthians 10:13', book: '1Corinthians', ch: 10, v: 13, fragments: ['There hath no temptation taken you but such as is common to man: but God is faithful, who will not suffer you to be tempted above that ye are able; but will with the temptation also make a way to escape, that ye may be able to bear it'] },
  { ref: '1 Peter 5:8', book: '1Peter', ch: 5, v: 8, fragments: ['Be sober, be vigilant; because your adversary the devil, as a roaring lion, walketh about, seeking whom he may devour'] },
  { ref: '1 Peter 5:9', book: '1Peter', ch: 5, v: 9, fragments: ['Whom resist stedfast in the faith'] },
  { ref: '1 Peter 5:10', book: '1Peter', ch: 5, v: 10, fragments: ['after that ye have suffered a while, make you perfect, stablish, strengthen, settle you'] },
  { ref: 'Job 1:12', book: 'Job', ch: 1, v: 12, fragments: ['Behold, all that he hath is in thy power; only upon himself put not forth thine hand'] },
  { ref: 'Job 2:6', book: 'Job', ch: 2, v: 6, fragments: ['Behold, he is in thine hand; but save his life'] },
  { ref: 'Luke 22:31', book: 'Luke', ch: 22, v: 31, fragments: ['Simon, Simon, behold, satan hath desired to have you, that he may sift you as wheat'] },
  { ref: 'Luke 22:32', book: 'Luke', ch: 22, v: 32, fragments: ['But I have prayed for thee, that thy faith fail not'] },
  { ref: 'Hosea 4:6', book: 'Hosea', ch: 4, v: 6, fragments: ['My people are destroyed for lack of knowledge'] },
  { ref: 'Genesis 2:17', book: 'Genesis', ch: 2, v: 17, fragments: ['in the day that thou eatest thereof thou shalt surely die'] },
  { ref: 'Genesis 3:19', book: 'Genesis', ch: 3, v: 19, fragments: ['for dust thou art, and unto dust shalt thou return'] },
  { ref: 'Hebrews 9:27', book: 'Hebrews', ch: 9, v: 27, fragments: ['And as it is appointed unto men once to die, but after this the judgment'] },
  { ref: '2 Corinthians 5:1', book: '2Corinthians', ch: 5, v: 1, fragments: ['For we know that if our earthly house of this tabernacle were dissolved, we have a building of God, an house not made with hands, eternal in the heavens'] },
  { ref: 'Romans 8:23', book: 'Romans', ch: 8, v: 23, fragments: ['even we ourselves groan within ourselves, waiting for the adoption, to wit, the redemption of our body'] },
  { ref: '1 Corinthians 15:53', book: '1Corinthians', ch: 15, v: 53, fragments: ['For this corruptible must put on incorruption, and this mortal must put on immortality'] },
  { ref: 'Revelation 21:4', book: 'Revelation', ch: 21, v: 4, fragments: ['there shall be no more death, neither sorrow, nor crying, neither shall there be any more pain: for the former things are passed away'] },
  { ref: '2 Corinthians 4:16', book: '2Corinthians', ch: 4, v: 16, fragments: ['though our outward man perish, yet the inward man is renewed day by day'] },
];

const schedule = buildHealthyLivingSchedule();


describe('every verse in the closing movements is VERBATIM (DR-0076)', () => {
  it('each fragment is an exact substring of the KJV verse it cites', () => {
    const failures = [];
    for (const q of INTEGRATION_QUOTES) {
      const text = kjvVerse(q.book, q.ch, q.v);
      for (const frag of q.fragments) {
        if (!norm(text).includes(norm(frag))) {
          failures.push(`${q.ref}: not verbatim — "${frag}" (verse reads: "${text}")`);
        }
      }
    }
    expect(failures).toEqual([]);
  });

  it('each fragment actually appears in a lesson (no stale gate list)', () => {
    const blob = norm(JSON.stringify(schedule[0]));
    const missing = INTEGRATION_QUOTES.flatMap((q) =>
      q.fragments.filter((frag) => !blob.includes(norm(frag))).map((frag) => `${q.ref}: "${frag}"`));
    expect(missing).toEqual([]);
  });

  it('PROVEN-TO-CATCH: one altered word in a quoted verse fails the check', () => {
    const tampered = norm(PRAISE_CLOSE).replace('fearfully and wonderfully made', 'wonderfully and fearfully made');
    const real = norm(kjvVerse('Psalms', 139, 14));
    expect(tampered.includes(real)).toBe(false);
  });
});

describe('every lesson closes as a WHOLE, at every level', () => {
  it('all four movements ride every lesson: same body, the boundary, His will, and praise', () => {
    for (const m of schedule) {
      for (const level of ['standard', 'teen', 'senior']) {
        expect(m.levels[level]).toContain('THE SAME BODY');
        expect(m.levels[level]).toContain('WHERE THE WITNESS ENDS AND YAHWEH BEGINS');
        expect(m.levels[level]).toContain('HIS WILL IS BEING DONE');
        expect(m.levels[level]).toContain('WHY THIS ROOM EXISTS, AND WHAT IT CANNOT DO');
        expect(m.levels[level]).toContain('PRAISE HIM FOR HOW HE MADE YOU');
      }
    }
  });

  it('the movements are carried as parts too, for any surface that wants them', () => {
    for (const m of schedule) {
      expect(m.integration.boundary).toBe(WITNESS_BOUNDARY);
      expect(m.integration.hisWill).toBe(HIS_WILL_AND_THE_WAY_THROUGH);
      expect(m.integration.stillDying).toBe(STILL_DYING_AND_THE_PROMISE);
      expect(m.integration.praise).toBe(PRAISE_CLOSE);
      expect(typeof m.integration.sameBody).toBe('string');
    }
  });

  it('praise names the ACTUAL Yahweh — which is, and which was, and which is to come', () => {
    expect(PRAISE_CLOSE).toContain('which is, and which was, and which is to come, the Almighty');
  });

  it('the boundary says plainly that measurement has an edge and the rest is His', () => {
    expect(WITNESS_BOUNDARY).toMatch(/measurement has an edge/i);
    expect(WITNESS_BOUNDARY).toMatch(/reached by faith, not by instrument/i);
  });

  it('His-will names the suffering honestly and never blames the sufferer’s belief', () => {
    expect(HIS_WILL_AND_THE_WAY_THROUGH).toMatch(/not a body that failed to believe correctly/i);
    expect(HIS_WILL_AND_THE_WAY_THROUGH).toMatch(/way through is GIVEN/i);
  });

  it('the room says plainly what it cannot do — it slows a decline, it does not stop the dying', () => {
    expect(STILL_DYING_AND_THE_PROMISE).toMatch(/it cannot stop the dying/i);
    expect(STILL_DYING_AND_THE_PROMISE).toMatch(/care of a tent, not a cure for mortality/i);
    expect(STILL_DYING_AND_THE_PROMISE).toMatch(/NEW BODY, after the first death/);
    expect(STILL_DYING_AND_THE_PROMISE).toContain('My people are destroyed for lack of knowledge');
  });

  it('the adversary is never capitalized in our own voice (Typographic Theology)', () => {
    // Quotation is exempt: the KJV's own "satan" inside a quoted verse is
    // reproduced exactly. What is checked here is OUR prose.
    const ours = HIS_WILL_AND_THE_WAY_THROUGH.split('"').filter((_, i) => i % 2 === 0).join(' ');
    expect(ours).not.toMatch(/\bSatan\b/);
    expect(ours).not.toMatch(/\bThe Devil\b/);
    expect(ours).toMatch(/the adversary/);
  });
});

describe('the integration is DERIVED from the room, not hand-kept', () => {
  it('witnesses are linked by the Scripture they actually share', () => {
    const withKin = WITNESS_SOURCES.filter((s) => relatedWitnesses(s).length > 0);
    expect(withKin.length).toBeGreaterThan(0);
    for (const s of withKin) {
      for (const r of relatedWitnesses(s)) {
        expect(r.shared.length).toBeGreaterThan(0);
        expect(r.source.id).not.toBe(s.id);
      }
    }
  });

  it('a witness with no shared Scripture says so honestly instead of claiming kin', () => {
    const lonely = { id: 'w3-lonely', topic: 'A lone witness', source: { expert: 'E', credential: 'C', work: 'W' }, summary: 'S',
      pairs: [{ id: 'p', claim: 'C', cite: '1:00', refs: ['Habakkuk 2:2'], bridge: 'B' }] };
    const block = sameBodyBlock(lonely, [lonely]);
    expect(block).toMatch(/honest gap in the room/i);
  });

  it('the same-body block names the integration all the way up: body → Body → Kingdom', () => {
    const block = sameBodyBlock(WITNESS_SOURCES[0]);
    expect(block).toMatch(/integrated systems, then an integrated Body, then the Kingdom/i);
    expect(block).toContain('by him all things consist');
  });
});
