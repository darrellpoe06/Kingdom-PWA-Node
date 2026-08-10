// =============================================================================
// healthy-living-course — the 3rd-Dimension Witness, carried into Learn as a
// self-paced series, DERIVED from the witness data (never re-typed)
// =============================================================================
// Darrell 2026-08-10, holding the 3rd-Dimension Witness room on his phone: "is
// this inside the Learn space too? if not make these lessons from our data or a
// series for Healthy Living... data driven course/s."
//
// It was NOT in Learn. The witness room (Church → Eternal Algorithms →
// 3rd-Dimension Witness) held twelve cited works — fasting and meal timing,
// sleep, learning, the setback/dopamine loop, and the women's-physiology
// counter-witness — each one already bound to the Scripture that said it first.
// Learn carried none of it. This module closes that: ONE lesson per witness
// source, built from `lib/third-witness.js` at build time, so a source added to
// the witness room joins this series on the next build and the two can never
// disagree (DR-0121 — no static data; the same law the Eternal Algorithms
// processing courses ride).
//
// THE RULES OF THE WITNESS ROOM COME WITH IT — they are not restated here as
// decoration, they are enforced in the projection below and pinned in
// healthy-living-course.test.js:
//   • WORD FIRST (DR-0127): every lesson opens with the Scripture references
//     and the Word's own claim; the cited science follows as a witness. The
//     course DECLARES its own lead (3 John 1:2; 1 Corinthians 6:19-20) rather
//     than borrowing whichever lesson happens to sit first.
//   • EVERY EXPERT CITED (Romans 13:7 — honour to whom honour is due): the
//     expert, credential, work and the place IN the work ride on every claim.
//     No anonymous "studies show."
//   • EVERY VERSE VERBATIM (DR-0076): references resolve through witnessVerse →
//     the verified KJV corpus. Nothing here quotes Scripture from memory.
//   • PASTORAL, NOT CLINICAL (the TLC bright line): this helps the Body see; it
//     does not diagnose or treat. The care note rides EVERY lesson at EVERY
//     level, and the data's own counter-witness (fasting is often wrong for
//     active and midlife women — Sims, Haver) is carried, never dropped.
//
// Pure + deterministic: every function takes its data as an argument and
// defaults to the live catalog.
// =============================================================================
import { WITNESS_SOURCES, WITNESS_TAGLINE, witnessVerse } from './third-witness.js';
import { progressSummaryFor, exportCurriculumMarkdownFor } from './church-classes.js';

// The care frame, in the witness room's own posture. It rides every lesson and
// every level — a health series in a church cannot carry one without it.
export const HEALTHY_LIVING_CARE_NOTE = 'This room helps the Body see; it does not diagnose or treat. Talk to your physician before changing how you eat, fast, or sleep — and the counter-witness in this series is part of the witness: for many active and midlife women, fuelling well beats a long fast. It is never one-size.';

/** "Dr. Andrew Huberman, Neuroscientist — The Science of Learning & Memory" */
export function citeOf(source) {
  const s = (source && source.source) || {};
  const who = [s.expert, s.credential].filter(Boolean).join(', ');
  return [who, s.work].filter(Boolean).join(' — ');
}

/** Every Scripture reference this witness source binds itself to, in order. */
export function refsOf(source) {
  const seen = new Set();
  const out = [];
  for (const p of (source && source.pairs) || []) {
    for (const r of p.refs || []) {
      if (!seen.has(r)) { seen.add(r); out.push(r); }
    }
  }
  return out;
}

// =============================================================================
// THE WHOLE, NOT THE FRAGMENT (Darrell 2026-08-10)
// =============================================================================
// "Each course is designed to be clarification of the same information multiple
// ways based on the Lord's perspectives... these courses or lessons should be
// more complete whole... bring all the other close relevant integrated
// understanding from research so users see Yahweh's Glory!!! So we give Him
// praise for how He made us." And: "integrated systems to an integrated Body
// then Kingdom... Integrated timelines." And the boundary: "scientific concepts
// and research only goes so far... the rest must come from Yahweh... How our
// thoughts and other sovereign-mesh human controls are really His Work... He
// sees our interbeing... science can't do this... only Faith." And the
// confession: "We need the actual Yahweh Who Is Was And Is To Come!!!"
//
// What was wrong: each lesson stood ALONE. Twelve cited works, each a fragment,
// none of them told the reader that the fast, the sleep, the setback and the
// learning are FOUR VIEWS OF ONE BODY that one Maker made — so a reader could
// finish a lesson informed and never once be brought to praise. That is the
// opposite of the point.
//
// Every lesson now closes with three movements, in this order:
//   1. THE SAME BODY — the other witnesses in this room that stand on the SAME
//      Scripture as this one, named and linked. Derived from the data (shared
//      references), never a hand-kept list, so the web grows as the room grows.
//   2. WHERE THE WITNESS ENDS — the honest boundary. What a study can measure,
//      and what it cannot touch: the knitting-together, the interbeing, the
//      why. Named with His own words, not implied.
//   3. PRAISE — the doxology the whole thing exists for, and the confession of
//      the actual Yahweh: "which is, and which was, and which is to come."
//
// Every verse below is VERBATIM from the repo's own KJV (gated in
// healthy-living-integration.test.js — change one word and the build fails).
// =============================================================================

/** Other witnesses in the room standing on the SAME Scripture as this one. */
export function relatedWitnesses(source, sources = WITNESS_SOURCES) {
  const mine = new Set(refsOf(source));
  if (!mine.size) return [];
  return (sources || [])
    .filter((s) => s && s.id !== source.id)
    .map((s) => ({ source: s, shared: refsOf(s).filter((r) => mine.has(r)) }))
    .filter((x) => x.shared.length > 0);
}

/** The integration movement: one body, one Maker, one Kingdom. */
export function sameBodyBlock(source, sources = WITNESS_SOURCES) {
  const related = relatedWitnesses(source, sources);
  const lines = [
    'THE SAME BODY — this is not a separate tip.',
    'Every witness in this room is describing ONE body, made by One Maker: "And he is before all things, and by him all things consist" (Colossians 1:17). The fast, the sleep, the setback, the learning — four views of the same handiwork, which is why the same verse keeps turning up under different studies. And the pattern does not stop at your skin: "For as the body is one, and hath many members, and all the members of that one body, being many, are one body: so also is Christ" (1 Corinthians 12:12) — integrated systems, then an integrated Body, then the Kingdom. What He built into your cells He built into His people: "And whether one member suffer, all the members suffer with it; or one member be honoured, all the members rejoice with it" (1 Corinthians 12:26).',
  ];
  if (related.length) {
    lines.push(`Standing on the same Scripture as this one, in this room: ${related
      .map((r) => `${r.source.topic} (${r.shared.join(' · ')})`)
      .join('; ')}. Read them together — the agreement is the point.`);
  } else {
    lines.push('No other witness in this room yet stands on this one\u2019s Scripture. That is an honest gap in the room, not a claim that this truth stands alone.');
  }
  return lines.join('\n\n');
}

/** The honest boundary — where measurement stops and Yahweh does not. */
export const WITNESS_BOUNDARY = [
  'WHERE THE WITNESS ENDS AND YAHWEH BEGINS.',
  'Everything cited above is a measurement, and measurement has an edge. A study can time a fast, count a sleep cycle, and watch a brain light up. It cannot see the knitting-together: "For thou hast possessed my reins: thou hast covered me in my mother\u2019s womb" (Psalm 139:13). It cannot weigh the inward parts: "Who hath put wisdom in the inward parts? or who hath given understanding to the heart?" (Job 38:36). It cannot reach the whole from end to end \u2014 "he hath set the world in their heart, so that no man can find out the work that God maketh from the beginning to the end" (Ecclesiastes 3:11). And it cannot hold the life that holds you: "For in him we live, and move, and have our being" (Acts 17:28).',
  'So we take the data as far as data goes and no further: "The secret things belong unto the LORD our God: but those things which are revealed belong unto us and to our children for ever" (Deuteronomy 29:29). What is revealed, we work. What is secret, we trust: "Trust in the LORD with all thine heart; and lean not unto thine own understanding" (Proverbs 3:5), "For as the heavens are higher than the earth, so are my ways higher than your ways, and my thoughts than your thoughts" (Isaiah 55:9). The rest is not a gap in the research to be filled later; it is His \u2014 and it is reached by faith, not by instrument.',
].join('\n\n');

/**
 * HIS WILL IS BEING DONE — and the way through (Darrell 2026-08-10: "His Will
 * Is being done... period... we have to suffer through it... He gives us the
 * Way through the process... as the devil reviews who he can devour based on
 * Yahweh's principals").
 *
 * This is the movement that keeps a health room honest. Every study above
 * describes a lever a person can pull; none of them can promise an outcome, and
 * a room that implies otherwise leaves the sick believer holding a verdict on
 * their own faith. So the lesson says plainly: His will is what is being done,
 * suffering is passed THROUGH rather than avoided, the way through is given,
 * and the adversary operates only inside limits Yahweh sets — he is a reviewer
 * looking for an opening, never a rival authority.
 *
 * Typographic Theology: in OUR voice the adversary is never capitalized; inside
 * a quotation the KJV is reproduced exactly as written, untouched.
 */
export const HIS_WILL_AND_THE_WAY_THROUGH = [
  'HIS WILL IS BEING DONE \u2014 AND HE GIVES THE WAY THROUGH.',
  'None of the science above is a promise. A protocol is a lever, not a guarantee, and the outcome is not ours to decree: "Thy kingdom come. Thy will be done in earth, as it is in heaven" (Matthew 6:10). His will is being done \u2014 and part of that will is that we pass THROUGH things rather than around them: "In the world ye shall have tribulation: but be of good cheer; I have overcome the world" (John 16:33). So a body that does everything right and still suffers is not a body that failed to believe correctly. It is a body in a fallen world, held by a Father who has not left the room: "And we know that all things work together for good to them that love God, to them who are the called according to his purpose" (Romans 8:28).',
  'And the way through is GIVEN, every time: "There hath no temptation taken you but such as is common to man: but God is faithful, who will not suffer you to be tempted above that ye are able; but will with the temptation also make a way to escape, that ye may be able to bear it" (1 Corinthians 10:13). The suffering has an end and a purpose: "after that ye have suffered a while, make you perfect, stablish, strengthen, settle you" (1 Peter 5:10).',
  'Know also who is watching for an opening, and how small his leash is: the adversary reviews us for what he can devour \u2014 "Be sober, be vigilant; because your adversary the devil, as a roaring lion, walketh about, seeking whom he may devour" (1 Peter 5:8) \u2014 and he reviews by Yahweh\u2019s own principles, because he cannot move outside them. He had to ask about Job, and was answered with a limit: "Behold, all that he hath is in thy power; only upon himself put not forth thine hand" (Job 1:12), then "Behold, he is in thine hand; but save his life" (Job 2:6). He had to ask about Peter, and the prayer went ahead of him: "Simon, Simon, behold, Satan hath desired to have you, that he may sift you as wheat: But I have prayed for thee, that thy faith fail not" (Luke 22:31-32). That is the whole posture of this room: steward the body with the best witness we have, resist the accuser \u2014 "Whom resist stedfast in the faith" (1 Peter 5:9) \u2014 and leave the verdict with the One whose will is actually being done.',
].join('\n\n');

/**
 * STILL DYING — AND THE BODY THAT IS PROMISED (Darrell 2026-08-10: "Slowly
 * dying because of the lack of Knowledge... He promised we would die in the
 * garden of eden... still dying... and waiting for the new body after the first
 * death").
 *
 * This is the movement that tells a health room the truth about itself. Every
 * study here can slow a decline; not one can stop it, and a room that lets a
 * reader believe otherwise has lied to them kindly. It also names WHY the room
 * exists: people are being destroyed for lack of knowledge — so the knowledge
 * is given freely — while the hope is not a longer tent but a promised body.
 */
export const STILL_DYING_AND_THE_PROMISE = [
  'WHY THIS ROOM EXISTS, AND WHAT IT CANNOT DO.',
  'It exists because of this: "My people are destroyed for lack of knowledge" (Hosea 4:6). People are dying slowly of things nobody told them \u2014 so the knowledge is put here, cited, free, and plain. That is the whole reason the witnesses were gathered.',
  'And it cannot do this: it cannot stop the dying. He said it in the garden \u2014 "in the day that thou eatest thereof thou shalt surely die" (Genesis 2:17) \u2014 and the sentence has been running ever since: "for dust thou art, and unto dust shalt thou return" (Genesis 3:19), "And as it is appointed unto men once to die, but after this the judgment" (Hebrews 9:27). So every protocol above is care of a tent, not a cure for mortality: "For we know that if our earthly house of this tabernacle were dissolved, we have a building of God, an house not made with hands, eternal in the heavens" (2 Corinthians 5:1). Steward the tent well; do not mistake it for the house.',
  'What we are actually waiting for is a NEW BODY, after the first death: "even we ourselves groan within ourselves, waiting for the adoption, to wit, the redemption of our body" (Romans 8:23); "For this corruptible must put on incorruption, and this mortal must put on immortality" (1 Corinthians 15:53); and then \u2014 "there shall be no more death, neither sorrow, nor crying, neither shall there be any more pain: for the former things are passed away" (Revelation 21:4). Until that day the arithmetic is exactly as Paul wrote it: "though our outward man perish, yet the inward man is renewed day by day" (2 Corinthians 4:16). Feed the outward man wisely. Feed the inward man daily. Only one of them is being renewed.',
].join('\n\n');

/** The doxology every lesson closes with. */
export const PRAISE_CLOSE = [
  'PRAISE HIM FOR HOW HE MADE YOU.',
  'This is why the study is here at all: "I will praise thee; for I am fearfully and wonderfully made: marvellous are thy works; and that my soul knoweth right well" (Psalm 139:14). Every mechanism above is His workmanship being described by people who did not make it. Give Him the praise for it.',
  'And know Who is being praised \u2014 the actual Yahweh, not a force and not an idea: "I am Alpha and Omega, the beginning and the ending, saith the Lord, which is, and which was, and which is to come, the Almighty" (Revelation 1:8).',
].join('\n\n');

// One Learn lesson from one witness source. The Word leads each pair; the cited
// claim follows it. Nothing is invented: every sentence below is either the
// data's own text or the fixed frame this module owns.
export function moduleFromWitness(source) {
  const refs = refsOf(source);
  const cite = citeOf(source);
  const pairs = (source.pairs || []).filter(Boolean);

  const wordFirstBlock = (p) => {
    const r = (p.refs || []).join(' · ');
    const where = p.cite ? `, ${p.cite}` : '';
    return `The Word — ${r}: ${p.bridge}\n\nThe 3rd-dimension witness (${cite}${where}): ${p.claim}`;
  };

  const whole = [sameBodyBlock(source), WITNESS_BOUNDARY, HIS_WILL_AND_THE_WAY_THROUGH, STILL_DYING_AND_THE_PROMISE, PRAISE_CLOSE].join('\n\n');

  const standard = [
    ...pairs.map(wordFirstBlock),
    whole,
    HEALTHY_LIVING_CARE_NOTE,
  ].join('\n\n');

  return {
    id: `hl-${source.id}`,
    title: source.topic,
    // WORD FIRST: the references and His claim open the lesson; the witness and
    // its summary come after, plainly labelled as the 3rd dimension.
    bigIdea: `${refs.join(' · ')} — the Word says it first. The cited witness (${cite}) describes the frame Yahweh made: ${source.summary}`,
    lesson: standard,
    levels: {
      standard,
      // Teen — the shortest true read: what the Word says, one line of who
      // said the science, and the care note. Depth selection over the same
      // sentences, never a re-worded doctrine (the Eternal Algorithms rule).
      teen: [
        ...pairs.map((p) => `${(p.refs || []).join(' · ')} — ${p.bridge}`),
        `Who says the science: ${cite}.`,
        whole,
        HEALTHY_LIVING_CARE_NOTE,
      ].join('\n\n'),
      // Senior — the whole depth: the Word, the claim, where in the work, and
      // the source's own summary of what it found.
      senior: [
        ...pairs.map(wordFirstBlock),
        `The work in full: ${cite}. ${source.summary}`,
        whole,
        HEALTHY_LIVING_CARE_NOTE,
      ].join('\n\n'),
    },
    inApp: 'Open Church → Eternal Algorithms → 3rd-Dimension Witness and read this source with every verse verbatim. Then take ONE change to your own week — a meal time, a bedtime, a first small step after a setback — and bring it to your physician before you change anything medical.',
    anchor: { ref: refs.join(' · '), theme: source.topic },
    launch: { view: 'church', churchView: 'eternal-algorithms' },
    care: HEALTHY_LIVING_CARE_NOTE,
    // The three closing movements, also carried as parts so a surface can
    // render them separately without re-deriving them.
    integration: {
      sameBody: sameBodyBlock(source),
      related: relatedWitnesses(source).map((r) => ({ id: r.source.id, topic: r.source.topic, shared: r.shared })),
      boundary: WITNESS_BOUNDARY,
      hisWill: HIS_WILL_AND_THE_WAY_THROUGH,
      stillDying: STILL_DYING_AND_THE_PROMISE,
      praise: PRAISE_CLOSE,
    },
  };
}

export const HEALTHY_LIVING_SESSION_FLOW = [
  { minutes: 5, name: 'The Word first — read every verse verbatim' },
  { minutes: 10, name: 'The witness — the cited claim and where it sits in the work' },
  { minutes: 10, name: 'The bridge — how the Word said it first' },
  { minutes: 5, name: 'The counter-witness — where it is not one-size' },
  { minutes: 5, name: 'One change to carry, and who to ask before you make it' },
];

export const HEALTHY_LIVING_META = {
  key: 'healthy-living',
  title: 'Healthy Living — the 3rd-Dimension Witness',
  audience: 'the whole Body and the whole house — anyone stewarding the body Yahweh gave them, at any age, with their physician in the loop',
  tagline: WITNESS_TAGLINE,
  format: 'Self-paced · one cited witness at a time · the Word first, then the science',
  cadenceDays: 7,
  // Derived, never typed (DR-0121): the series is exactly as long as the
  // witness room is deep.
  weeks: WITNESS_SOURCES.length,
  handsOnLabel: 'Take it to the room',
  unit: { noun: 'lesson', nounPlural: 'lessons', cap: 'Lesson', selfPaced: true, sessionLabel: 'How to work one witness (alone or as a house)' },
  // WORD-FIRST, DECLARED (DR-0127 / DR-0282). Health material is charged
  // enough that the opening frame must be chosen for the space rather than
  // inherited from whichever witness sits first. Both texts are VERBATIM from
  // the repo's verified KJV corpus (gated in healthy-living-course.test.js —
  // change one word and the build fails).
  wordFirst: {
    ref: '3 John 1:2; 1 Corinthians 6:19-20',
    frame: 'Yahweh sets the order before any expert speaks: "Beloved, I wish above all things that thou mayest prosper and be in health, even as thy soul prospereth." — He wants you well, body AND soul, and He names the soul as the measure. And whose body it is: "What? know ye not that your body is the temple of the Holy Ghost which is in you, which ye have of God, and ye are not your own? For ye are bought with a price: therefore glorify God in your body, and in your spirit, which are God’s." Health here is stewardship of what He bought, not self-improvement. The science below is a witness to the frame He made; His Word governs it.',
  },
  care: HEALTHY_LIVING_CARE_NOTE,
};

/** The schedule: one row per witness source, in the room's own order. */
export function buildHealthyLivingSchedule(sources = WITNESS_SOURCES) {
  return (sources || []).map((s, i) => ({
    ...moduleFromWitness(s),
    week: i + 1,
    date: null,
    weekday: null,
  }));
}

export function healthyLivingProgressSummary(progress = {}, sources = WITNESS_SOURCES) {
  return progressSummaryFor(buildHealthyLivingSchedule(sources), progress);
}

export function exportHealthyLivingCurriculumMarkdown(sources = WITNESS_SOURCES) {
  return exportCurriculumMarkdownFor({
    meta: HEALTHY_LIVING_META,
    modules: buildHealthyLivingSchedule(sources),
    sessionFlow: HEALTHY_LIVING_SESSION_FLOW,
  });
}

/**
 * Every Scripture reference this series will show, deduped — the list the
 * verse-integrity gate walks so a lesson can never cite a verse the verified
 * corpus does not hold.
 */
export function healthyLivingRefs(sources = WITNESS_SOURCES) {
  const seen = new Set();
  for (const s of sources || []) for (const r of refsOf(s)) seen.add(r);
  return [...seen];
}

/** Refs that do NOT resolve verbatim in the corpus. Empty is the passing state. */
export function unresolvedHealthyLivingRefs(sources = WITNESS_SOURCES, resolve = witnessVerse) {
  return healthyLivingRefs(sources).filter((r) => !String(resolve(r) || '').trim());
}

export const HEALTHY_LIVING_INTEREST_TAG = '[Healthy Living]';
export const HEALTHY_LIVING_HELPER_TAG = '[Healthy Living helper]';

export const HEALTHY_LIVING_TUTOR_META = {
  name: 'Healthy Living — the 3rd-Dimension Witness',
  blurb: 'Ask about any cited source in this series — what the expert actually said, where in the work, and the Scripture it is bound to. Ari will not diagnose or prescribe; medical decisions belong with your physician.',
};
