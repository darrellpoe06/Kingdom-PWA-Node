// =============================================================================
// biblical-timeline — "The Whole Story: Yahweh and Humanity, before time to the
// end of time"
// =============================================================================
// The redemptive record read as ONE RELATIONSHIP across all time (declared by
// Darrell, 2026-07-15: "Yahweh and humans[’] relationship before, during and end
// of time"). The spine every timeline surface, the master lesson (Living Lessons
// L30), and the timeline game read from -- one source, surfaced in the app (the
// app is the primary artifact). The through-line THE-ROOT already names: Yahweh
// walked with humanity in the garden in the cool of the day (Genesis 3:8), and
// the end of the story is the same picture -- "the tabernacle of God is with men"
// (Revelation 21:3). Original intent and final destination are ONE image. The
// arc between them is the relationship: FELLOWSHIP -> BROKEN -> PURSUED ->
// RESTORED -> CONSUMMATED.
//
// THREE TIMEFRAMES (Darrell’s frame): BEFORE time (purposed in love), DURING
// time (the biblical record), and the END of time (the return + eternity). A
// "you are here" marker sits on the CHURCH AGE -- where we actually stand in the
// Word’s own timeline.
//
// "ALL POSSIBILITIES," THE HOUSE’S OWN WAY (Darrell: "explain all possibilities
// ... from the Word[’s] perspectives"). Where believers genuinely differ, an
// epoch carries a `possibilities` block built the way THE-ROOT-POSITIONS-AND-
// INQUIRY.md builds them: the PLUMB LINE (what Scripture states plainly -- high
// confidence), the VIEWS (competing readings, presented fairly, with how tightly
// each ties to the text), what stays OPEN, and a CONFIDENCE level -- always
// pointing to the SME source. This is NOT the model improvising theology: it
// mirrors the house’s already-stated positions and DEFERS contested doctrine to
// the SME (Darrell / Bishop Gwin), never asserting past the text (DR-0098 teach-
// don’t-debate; DR-0100 three-tier honesty; ARI-PERSONA doctrine-is-SME-owned).
//
// VERIFICATION (DR-0076): every `anchor.text` is KJV VERBATIM from
// app/public/bible/kjv (fetched, not produced from memory), guarded by
// biblical-timeline.test.js. Every `lessons` entry is a REAL Living Lesson id
// (the test proves each resolves) so the timeline "ties in all the other lessons
// in their respective places" without a dead reference.
//
// DOCTRINALLY SUBSTANTIVE + COLG-FACING -> Tier C (RELEASE-TIERS): this ships for
// Bishop Gwin’s review (held), not straight to production.
// =============================================================================

// The overarching frame: Yahweh Himself spans the whole line -- the same before,
// during, and after time. Read every epoch under these.
export const TIMELINE_FRAME_ANCHORS = Object.freeze([
  { ref: 'Revelation 1:8', text: 'I am Alpha and Omega, the beginning and the ending, saith the Lord, which is, and which was, and which is to come, the Almighty.' },
  { ref: 'Isaiah 46:9-10', text: 'Remember the former things of old: for I am God, and there is none else; I am God, and there is none like me, Declaring the end from the beginning, and from ancient times the things that are not yet done, saying, My counsel shall stand, and I will do all my pleasure:' },
  { ref: 'Psalm 90:2', text: 'Before the mountains were brought forth, or ever thou hadst formed the earth and the world, even from everlasting to everlasting, thou art God.' },
  { ref: 'Hebrews 13:8', text: 'Jesus Christ the same yesterday, and to day, and for ever.' },
]);

// The five states of the one relationship, in order -- the arc the epochs trace.
export const RELATIONSHIP_ARC = Object.freeze([
  'purposed', 'fellowship', 'broken', 'pursued', 'restored', 'consummated',
]);

// Each epoch: where it sits (phase/order), the state of the Yahweh<->humanity
// relationship there, KJV-verbatim anchors, the Living Lessons that live there,
// and -- where believers differ -- an honest `possibilities` block.
export const TIMELINE_EPOCHS = Object.freeze([
  // ---- BEFORE TIME ----------------------------------------------------------
  {
    id: 'before-time',
    order: 1,
    phase: 'before',
    era: 'Before Time',
    when: 'Eternity past -- before the foundation of the world',
    relationship: { state: 'purposed', line: 'Before we existed, He purposed us in love -- the relationship was chosen before there was a world to hold it.' },
    summary: 'Yahweh is, from everlasting. Within the Godhead the Word was with God (John 1:1); the unseen realm was created through Him (Colossians 1:16); and humanity was chosen in Him "before the foundation of the world" (Ephesians 1:4). The relationship did not begin in the garden -- it began in His heart before time.',
    anchors: [
      { ref: 'John 1:1-3', text: 'In the beginning was the Word, and the Word was with God, and the Word was God. The same was in the beginning with God. All things were made by him; and without him was not any thing made that was made.' },
      { ref: 'Ephesians 1:4', text: 'According as he hath chosen us in him before the foundation of the world, that we should be holy and without blame before him in love:' },
      { ref: 'Titus 1:2', text: 'In hope of eternal life, which God, that cannot lie, promised before the world began;' },
      { ref: 'Colossians 1:16-17', text: 'For by him were all things created, that are in heaven, and that are in earth, visible and invisible, whether they be thrones, or dominions, or principalities, or powers: all things were created by him, and for him: And he is before all things, and by him all things consist.' },
      { ref: 'Revelation 13:8', text: 'And all that dwell upon the earth shall worship him, whose names are not written in the book of life of the Lamb slain from the foundation of the world.' },
    ],
    lessons: ['ll26-how-the-king-knows-his-kings'],
  },
  // ---- DURING TIME ----------------------------------------------------------
  {
    id: 'creation',
    order: 2,
    phase: 'during',
    era: 'Creation & the Garden',
    when: 'In the beginning -- the world made, humanity formed',
    relationship: { state: 'fellowship', line: 'Unbroken fellowship: He walked with them in the garden in the cool of the day (Genesis 3:8). This is the original intent.' },
    summary: 'God creates, and calls it "very good." The human is made to be the dwelling of Yahweh -- a temple (1 Corinthians 3:16) -- and He walks with them. This is the picture the whole story is working back toward.',
    anchors: [
      { ref: 'Genesis 1:1', text: 'In the beginning God created the heaven and the earth.' },
      { ref: 'Genesis 1:31', text: 'And God saw every thing that he had made, and, behold, it was very good. And the evening and the morning were the sixth day.' },
    ],
    lessons: ['ll1-the-perfect-yahweh-expects', 'll11-fearfully-and-wonderfully-made', 'll2-the-energy-you-were-given'],
    possibilities: [
      {
        question: 'How long ago, and over how long, did creation happen?',
        plumbLine: 'What Scripture states plainly: "In the beginning God created the heaven and the earth" (Genesis 1:1), and it was "very good" (Genesis 1:31). THAT God created, and that it was good, is not in question.',
        views: [
          { view: 'Young creation (ordinary days)', tie: 'reads the "days" of Genesis 1 as ordinary days.' },
          { view: 'Old creation (day-age / framework / gap)', tie: 'reads the "days" as ages or as a literary frame; appeals to "one day is with the Lord as a thousand years" (2 Peter 3:8).' },
        ],
        open: 'The AGE of the earth and the length of the "days" is where sincere believers differ. The Word does not make the timetable the point.',
        confidence: 'High that God created and it was good; the timetable is held open and left to the SME.',
        source: 'SME (Darrell / Bishop Gwin); see THE-ROOT-POSITIONS-AND-INQUIRY.md on distinguishing what Scripture states from what we reason on top of it.',
      },
    ],
  },
  {
    id: 'the-fall',
    order: 3,
    phase: 'during',
    era: 'The Fall (the first rebellion)',
    when: 'Eden -- the estrangement',
    relationship: { state: 'broken', line: 'The fellowship is broken. Humanity hides; death enters. Yet the first word after the break is a promise of rescue.' },
    summary: 'The serpent’s deception, humanity’s rebellion, and the sentence of estrangement and death (Genesis 3). But inside the very curse is the first gospel: the seed of the woman will bruise the serpent’s head (Genesis 3:15). The rescue is announced the moment the break happens.',
    anchors: [
      { ref: 'Genesis 3:15', text: 'And I will put enmity between thee and the woman, and between thy seed and her seed; it shall bruise thy head, and thou shalt bruise his heel.' },
    ],
    lessons: ['ll18-the-flinch-comes-first', 'll19-not-ignorant-of-his-devices'],
  },
  {
    id: 'genesis-6',
    order: 4,
    phase: 'during',
    era: 'The Sons of God (the second rebellion)',
    when: 'Before the flood',
    relationship: { state: 'broken', line: 'The corruption deepens -- a rebellion out of the unseen realm, and the world grows violent before the flood.' },
    summary: 'The "sons of God" of Genesis 6 and the nephilim -- a supernatural rebellion the New Testament looks back on as angels who "left their proper dwelling" (Jude 6; 2 Peter 2:4). The house reads "sons of God" by its own biblical usage -- as in Job 1:6 and 38:7, divine beings of the heavenly court.',
    anchors: [
      { ref: 'Genesis 6:1-2', text: 'And it came to pass, when men began to multiply on the face of the earth, and daughters were born unto them, That the sons of God saw the daughters of men that they were fair; and they took them wives of all which they chose.' },
      { ref: 'Job 38:7', text: 'When the morning stars sang together, and all the sons of God shouted for joy?' },
      { ref: 'Jude 6', text: 'And the angels which kept not their first estate, but left their own habitation, he hath reserved in everlasting chains under darkness unto the judgment of the great day.' },
    ],
    lessons: ['ll29-the-unseen-realm-and-the-nations'],
    possibilities: [
      {
        question: 'Who are the "sons of God" of Genesis 6?',
        plumbLine: 'The house’s stated position (THE-ROOT-POSITIONS, Position 2, held with HIGH confidence): they are DIVINE BEINGS connected to the divine council -- the same phrase (bene ha’elohim) means divine beings of the heavenly court everywhere else it is used (Job 1:6; 2:1; 38:7), the ancient Septuagint renders it "angels of God," and Jude 6 / 2 Peter 2:4 tie sinning angels to the flood.',
        views: [
          { view: 'Divine beings (the house’s position)', tie: 'strongest tie to the text -- the lexical usage, the ancient reading, and the Jude/2 Peter linkage.' },
          { view: 'Sethite (godly line of Seth)', tie: 'weaker -- must give the phrase a meaning it has nowhere else, and does not account for the nephilim or the Jude/2 Peter linkage.' },
          { view: 'Pure myth / allegory', tie: 'weak by the house’s standard, which treats the unseen realm as Scripture treats it: real, not allegory.' },
        ],
        open: 'The precise cross-linkages (how the council, the Genesis 6 beings, and the "principalities and powers" wire together, and the timeline of the angelic fall) stay open. The classic "dead nephilim became demons" mechanism comes from 1 Enoch and is pending the house’s formal canon decision (THE-CANON.md).',
        confidence: 'High that the sons of God are divine beings; the further mechanisms are a working model pending the SME and the canon decision.',
        source: 'THE-ROOT-POSITIONS-AND-INQUIRY.md, Positions 2 & 3 (SME: Darrell / Bishop Gwin).',
      },
    ],
  },
  {
    id: 'babel',
    order: 5,
    phase: 'during',
    era: 'Babel (the third rebellion)',
    when: 'Genesis 11 -- the nations scattered',
    relationship: { state: 'broken', line: 'The nations are scattered and disinherited; Yahweh keeps one people, Israel, as His own portion -- the beachhead for getting all of them back.' },
    summary: 'Humanity’s proud rebellion at the tower, and God’s scattering of the nations (Genesis 11). Deuteronomy 32:8-9 ties it together: the Most High divided the nations their inheritance and kept Israel as "the LORD’s portion." The rest of the story is Him going after the scattered nations to bring them home.',
    anchors: [
      { ref: 'Genesis 11:8-9', text: 'So the LORD scattered them abroad from thence upon the face of all the earth: and they left off to build the city. Therefore is the name of it called Babel; because the LORD did there confound the language of all the earth: and from thence did the LORD scatter them abroad upon the face of all the earth.' },
      { ref: 'Deuteronomy 32:8-9', text: 'When the Most High divided to the nations their inheritance, when he separated the sons of Adam, he set the bounds of the people according to the number of the children of Israel. For the LORD’s portion is his people; Jacob is the lot of his inheritance.' },
    ],
    lessons: ['ll29-the-unseen-realm-and-the-nations'],
    possibilities: [
      {
        question: 'Deuteronomy 32:8 -- "children of Israel" or "sons of God"?',
        plumbLine: 'Not in dispute: God scattered the nations at Babel, apportioned them, and kept Israel as His own portion (Deuteronomy 32:9; 4:19-20).',
        views: [
          { view: 'KJV / Masoretic: "according to the number of the children of Israel"', tie: 'our primary translation.' },
          { view: 'Dead Sea Scrolls / Septuagint: "sons of God"', tie: 'the older manuscript reading, and the linchpin of the divine-allotment framework.' },
        ],
        open: 'Which reading governs the doctrine of the nations’ allotment is a manuscript question named plainly, not hidden -- and left to the SME.',
        confidence: 'High on what is not in dispute; the manuscript question is left open to the SME (Darrell / Bishop Gwin).',
        source: 'DR-0098 (name the debate to educate past it, by the Word); SME.',
      },
    ],
  },
  {
    id: 'israel',
    order: 6,
    phase: 'during',
    era: 'Israel -- the Covenant People',
    when: 'Abraham, the Law, the Prophets',
    relationship: { state: 'pursued', line: 'Yahweh pursues the relationship back -- covenanting with a people, "I will be their God," and promising through them that all nations would be blessed.' },
    summary: 'Through Abraham the plan was always all-nations-wide: "In thee shall all nations be blessed" (Galatians 3:8). Yahweh gives the Law, raises the prophets, and keeps covenant with a people who will carry His name toward the whole scattered world.',
    anchors: [
      { ref: 'Galatians 3:8', text: 'And the scripture, foreseeing that God would justify the heathen through faith, preached before the gospel unto Abraham, saying, In thee shall all nations be blessed.' },
      { ref: 'Deuteronomy 4:20', text: 'But the LORD hath taken you, and brought you forth out of the iron furnace, even out of Egypt, to be unto him a people of inheritance, as ye are this day.' },
    ],
    lessons: ['ll9-the-lord-looks-on-the-heart', 'll10-strength-and-honour-are-her-clothing', 'll8-not-by-might-a-new-body-coming'],
  },
  {
    id: 'christ',
    order: 7,
    phase: 'during',
    era: 'Christ -- God With Us',
    when: 'The fulness of the time',
    relationship: { state: 'restored', line: 'The relationship is restored at the deepest point: God becomes flesh and dwells among us, the head of the serpent is bruised, and the way back is opened.' },
    summary: 'In "the fulness of the time" God sent forth His Son (Galatians 4:4); the Word was made flesh and dwelt among us (John 1:14); He died for our sins and rose again (1 Corinthians 15:3-4) -- the promised seed of Genesis 3:15 crushing the serpent’s head. God with us; the temple veil torn; the way home reopened.',
    anchors: [
      { ref: 'Galatians 4:4-5', text: 'But when the fulness of the time was come, God sent forth his Son, made of a woman, made under the law, To redeem them that were under the law, that we might receive the adoption of sons.' },
      { ref: 'John 1:14', text: 'And the Word was made flesh, and dwelt among us, (and we beheld his glory, the glory as of the only begotten of the Father,) full of grace and truth.' },
      { ref: '1 Corinthians 15:3-4', text: 'For I delivered unto you first of all that which I also received, how that Christ died for our sins according to the scriptures; And that he was buried, and that he rose again the third day according to the scriptures:' },
    ],
    lessons: ['ll24-yahweh-is-the-only-way', 'll3-bodybuilding-christ', 'll4-dying-to-live', 'll14-ten-healed-one-whole'],
  },
  {
    id: 'church-age',
    order: 8,
    phase: 'during',
    era: 'The Church Age -- the Spirit Dwelling In Us',
    when: 'Pentecost to now',
    relationship: { state: 'restored', line: 'The relationship goes INSIDE: the Spirit dwells in the temple of the believer, and the scattered nations are being regathered, person by person. WE ARE HERE.' },
    summary: 'At Pentecost the tongues that divided at Babel begin to gather -- devout men "out of every nation under heaven" hear each in his own language (Acts 2:5-6). The Spirit now dwells IN the human temple (1 Corinthians 3:16), and the mission runs to the ends of the earth (Acts 1:8; Matthew 24:14) under a patient, longsuffering delay (2 Peter 3:9). This is where we stand on the line.',
    anchors: [
      { ref: 'Acts 2:5-6', text: 'And there were dwelling at Jerusalem Jews, devout men, out of every nation under heaven. Now when this was noised abroad, the multitude came together, and were confounded, because that every man heard them speak in his own language.' },
      { ref: 'Acts 1:8', text: 'But ye shall receive power, after that the Holy Ghost is come upon you: and ye shall be witnesses unto me both in Jerusalem, and in all Judaea, and in Samaria, and unto the uttermost part of the earth.' },
      { ref: '2 Peter 3:9', text: 'The Lord is not slack concerning his promise, as some men count slackness; but is longsuffering to us-ward, not willing that any should perish, but that all should come to repentance.' },
      { ref: 'Matthew 24:14', text: 'And this gospel of the kingdom shall be preached in all the world for a witness unto all nations; and then shall the end come.' },
    ],
    lessons: [
      'll28-prove-all-things', 'll29-the-unseen-realm-and-the-nations', 'll15-seasoned-with-salt',
      'll16-rule-your-spirit-repair-the-bond', 'll5-take-no-thought-for-tomorrow',
      'll6-think-on-these-things', 'll7-let-peace-be-the-umpire', 'll13-a-sound-mind',
      'll12-if-one-member-suffers', 'll17-taste-and-see', 'll20-the-ladder-and-the-door',
      'll21-hidden-vs-known', 'll25-the-threshold-and-the-two-patterns', 'll27-the-god-who-documents-his-grief',
    ],
    youAreHere: true,
  },
  // ---- END OF TIME ----------------------------------------------------------
  {
    id: 'the-return',
    order: 9,
    phase: 'end',
    era: 'The Blessed Hope -- He Comes Again',
    when: 'The end of the age',
    relationship: { state: 'consummated', line: 'The relationship is brought to its appointed end: the same Jesus who left returns, and the dead in Christ rise to meet Him.' },
    summary: 'The "blessed hope" -- the glorious appearing (Titus 2:13); the same Jesus who ascended "shall so come in like manner" (Acts 1:11); the Lord descends and the dead in Christ rise (1 Thessalonians 4:16-17); the gospel reaches all nations, and "then shall the end come" (Matthew 24:14).',
    anchors: [
      { ref: 'Titus 2:13', text: 'Looking for that blessed hope, and the glorious appearing of the great God and our Saviour Jesus Christ;' },
      { ref: 'Acts 1:11', text: 'Which also said, Ye men of Galilee, why stand ye gazing up into heaven? this same Jesus, which is taken up from you into heaven, shall so come in like manner as ye have seen him go into heaven.' },
      { ref: '1 Thessalonians 4:16-17', text: 'For the Lord himself shall descend from heaven with a shout, with the voice of the archangel, and with the trump of God: and the dead in Christ shall rise first: Then we which are alive and remain shall be caught up together with them in the clouds, to meet the Lord in the air: and so shall we ever be with the Lord.' },
    ],
    lessons: ['ll23-the-blessed-hope', 'll22-goshen-and-the-watch'],
    possibilities: [
      {
        question: 'WHEN, and in what order, does the end unfold?',
        plumbLine: 'Not in dispute: Jesus WILL return, bodily and visibly ("this same Jesus... shall so come in like manner," Acts 1:11); the dead in Christ will rise (1 Thessalonians 4:16-17); and He told us the timetable is not ours to know -- "it is not for you to know the times or the seasons" (Acts 1:7).',
        views: [
          { view: 'Premillennial (pre- / mid- / post-tribulation)', tie: 'a literal thousand-year reign after the return; differs on the timing of the gathering relative to tribulation.' },
          { view: 'Amillennial', tie: 'reads the thousand years symbolically of the present reign of Christ.' },
          { view: 'Postmillennial', tie: 'the gospel advances until the age is brought to its close and then He returns.' },
        ],
        open: 'The SCHEDULE and the sequence -- the millennium, the timing of the gathering -- is exactly what "not for you to know the times" (Acts 1:7) leaves open. The house teaches the certainty (He returns) and holds the schedule loosely, leaving it to the SME.',
        confidence: 'High that He returns bodily and the dead rise; the schedule is deliberately held open (Acts 1:7) and left to the SME (Darrell / Bishop Gwin).',
        source: 'SME; DR-0098 / DR-0100 (state the established, name the views, do not overclaim the timetable).',
      },
    ],
  },
  {
    id: 'eternity',
    order: 10,
    phase: 'end',
    era: 'Eternity -- the Dwelling of God With Man',
    when: 'The new heaven and the new earth',
    relationship: { state: 'consummated', line: 'The relationship is complete: "the tabernacle of God is with men" -- the garden picture restored and surpassed, tears wiped, God all in all. Face to face, forever.' },
    summary: 'A new heaven and a new earth, and the promise the whole story bent toward: "the tabernacle of God is with men, and he will dwell with them... and God himself shall be with them" (Revelation 21:3); every tear wiped (21:4); "God may be all in all" (1 Corinthians 15:28); the disinherited nations His at last (Psalm 82:8). Original intent (Genesis 3:8) and final destination are one image.',
    anchors: [
      { ref: 'Revelation 21:3-4', text: 'And I heard a great voice out of heaven saying, Behold, the tabernacle of God is with men, and he will dwell with them, and they shall be his people, and God himself shall be with them, and be their God. And God shall wipe away all tears from their eyes; and there shall be no more death, neither sorrow, nor crying, neither shall there be any more pain: for the former things are passed away.' },
      { ref: '1 Corinthians 15:28', text: 'And when all things shall be subdued unto him, then shall the Son also himself be subject unto him that put all things under him, that God may be all in all.' },
      { ref: 'Revelation 22:13', text: 'I am Alpha and Omega, the beginning and the end, the first and the last.' },
      { ref: 'Psalm 82:8', text: 'Arise, O God, judge the earth: for thou shalt inherit all nations.' },
    ],
    lessons: ['ll27-the-god-who-documents-his-grief'],
  },
]);

// ---------------------------------------------------------------------------
// Helpers -- pure, so they are unit-testable and the surfaces stay thin.
// ---------------------------------------------------------------------------

/** Epochs in timeline order. */
export function listEpochs() {
  return TIMELINE_EPOCHS.slice().sort((a, b) => a.order - b.order);
}

/** One epoch by id, or null. */
export function getEpoch(id) {
  return TIMELINE_EPOCHS.find((e) => e.id === id) || null;
}

/** The epoch we currently stand in (the single youAreHere epoch). */
export function currentEpoch() {
  return TIMELINE_EPOCHS.find((e) => e.youAreHere === true) || null;
}

/** The three timeframes, each with its epochs, in order. */
export function epochsByPhase() {
  const order = ['before', 'during', 'end'];
  return order.map((phase) => ({
    phase,
    epochs: listEpochs().filter((e) => e.phase === phase),
  }));
}

/** Every Living Lesson id anchored anywhere on the timeline (deduped). */
export function allAnchoredLessonIds() {
  const seen = new Set();
  for (const e of TIMELINE_EPOCHS) for (const id of e.lessons || []) seen.add(id);
  return [...seen];
}

/** The epoch(s) a given lesson id is anchored to (a lesson may sit in more than one). */
export function epochsForLesson(lessonId) {
  return TIMELINE_EPOCHS.filter((e) => (e.lessons || []).includes(lessonId)).map((e) => e.id);
}
