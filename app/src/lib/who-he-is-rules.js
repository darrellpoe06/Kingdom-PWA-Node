// =============================================================================
// who-he-is-rules — the WRITTEN rule behind "Who He Is: the Whole Word"
// =============================================================================
// Darrell, 2026-09-29, reacting to L196: "We needed a lesson wide curriculum
// with all!!!!!!!!!!!!!!!!! No matter if He was there or not!!!!!! Clarity
// clarification of where when what how timeless timelines and Who He Is!!!!!!"
// And before it: "Lesson with all outside of the 4 gospels, so we have all of
// them in our curriculum... Those verses tell about Him too. We just kept the
// rule the same all the way through."
//
// This file is the RULE, written down so the curriculum is never curated by
// taste (DR-0675). scripts/who-he-is-generate.mjs reads the KJV corpus
// (app/public/bible/kjv) through these tables and writes
// app/src/lib/who-he-is-data.json. Every count the app shows comes from that
// data; nothing here is a count. Where a table is a JUDGMENT rather than a
// mechanical test, every row carries its reason, so the judgment is visible and
// can be overruled one row at a time.
//
// FOUR WAYS A PASSAGE COMES IN (the inclusion rule):
//   A. WHOLE BOOKS THAT SAY THEY ARE ABOUT HIM. Matthew, Mark, Luke, John and
//      Revelation say in their own words that the whole book is His (the basis
//      verse for each is below). Every scene of those five books is in, whether
//      or not a title stands in the verse.
//   B. HIS NAMES AND TITLES. Everywhere else in the New Testament, a verse that
//      names Him by a title in NAME_LEXICON brings in its passage.
//   C. THE OLD TESTAMENT THE NEW QUOTES OF HIM. An Old Testament verse the New
//      Testament quotes, found by the method in QUOTE_METHOD, and applied to
//      Him (APPLIES judgments), plus the quotations the method cannot see
//      because the KJV renders the two Testaments from different languages
//      (QUOTE_SUPPLEMENT, each row naming the New Testament verse).
//   D. THE OLD TESTAMENT THE NEW SAYS PICTURED HIM OR HELD HIM. An Old
//      Testament event the New Testament itself names as speaking of Him,
//      picturing Him, or having Him in it (TYPE_TABLE, each row citing the
//      New Testament verse that says so).
// And what the rule does NOT reach is named, not dropped: EDGE_TABLE lists the
// Old Testament passages widely read of Him that no New Testament verse quotes
// or names, each with its nearest New Testament tie, held for the Governor's
// word (re-review dated in DR-0675).
//
// TYPOGRAPHY (CLAUDE.md): Yahweh in our voice; He / His / Him capitalized for
// the Godhead; the adversary never capitalized. Quoted Scripture is fetched
// verbatim by the generator and never typed here.
// =============================================================================

// ---- The timeline: eras in the Word's own order ---------------------------
// Each era carries a marker verse (fetched verbatim by the generator). Where a
// book is not dated by the Word, the entry says so in when.note.
export const ERAS = Object.freeze([
  { id: 'before-time', order: 1, label: 'Before time', marker: 'John 17:24', plain: 'Before the world was made. He was with the Father.' },
  { id: 'creation', order: 2, label: 'Creation and the first days', marker: 'John 1:3', plain: 'The world is made, and the first families live (Genesis 1 to 11).' },
  { id: 'patriarchs', order: 3, label: 'Abraham, Isaac and Jacob', marker: 'Galatians 3:16', plain: 'Yahweh calls Abraham and makes the promise to him and his seed (Genesis 12 to 50).' },
  { id: 'moses', order: 4, label: 'Moses and the wilderness', marker: 'John 1:17', plain: 'Israel comes out of Egypt, receives the law, and walks in the wilderness (Exodus to Deuteronomy).' },
  { id: 'the-land', order: 5, label: 'The land and the judges', marker: 'Hebrews 4:8', plain: 'Israel goes into the land, and judges lead them (Joshua, Judges, Ruth).' },
  { id: 'kings', order: 6, label: 'The kings and the psalms', marker: 'Acts 13:22', plain: 'Israel has kings; David sings the psalms (1 Samuel to 2 Chronicles, Psalms, the books of wisdom).' },
  { id: 'prophets', order: 7, label: 'The prophets', marker: 'Hebrews 1:1', plain: 'Yahweh speaks by the prophets, before and after the exile (Isaiah to Malachi, Ezra, Nehemiah, Esther).' },
  { id: 'incarnation', order: 8, label: 'He comes in the flesh', marker: 'Galatians 4:4', plain: 'He is conceived, born, and grows up (Matthew 1 to 2, Luke 1 to 2).' },
  { id: 'ministry', order: 9, label: 'His ministry', marker: 'Luke 3:23', plain: 'He preaches, heals and teaches, from His baptism to the week of the cross.' },
  { id: 'cross', order: 10, label: 'The cross', marker: '1 Corinthians 15:3', plain: 'The last supper, the garden, the trials, the cross and the tomb.' },
  { id: 'resurrection', order: 11, label: 'He is risen', marker: '1 Corinthians 15:4', plain: 'He rises the third day and is seen for forty days.' },
  { id: 'ascension', order: 12, label: 'He goes up into heaven', marker: 'Acts 1:9', plain: 'He is taken up and sits at the right hand of Yahweh.' },
  { id: 'church', order: 13, label: 'The church', marker: 'Acts 1:8', plain: 'The Holy Spirit comes, and the witnesses carry His name (Acts, the letters, Revelation as written).' },
  { id: 'the-end', order: 14, label: 'He comes again', marker: 'Acts 1:11', plain: 'He returns, and He judges.' },
  { id: 'forever', order: 15, label: 'For ever', marker: 'Revelation 11:15', plain: 'He reigns for ever and ever.' },
]);

// ---- Rule A: the books that say they are about Him ------------------------
export const WHOLE_BOOKS = Object.freeze([
  { book: 'Matthew', basis: 'Matthew 1:1', reason: 'The book opens by naming its subject: the generation of Jesus Christ.' },
  { book: 'Mark', basis: 'Mark 1:1', reason: 'The book opens by naming its subject: the gospel of Jesus Christ, the Son of God.' },
  { book: 'Luke', basis: 'Acts 1:1', reason: 'The same writer calls this his former treatise, of all that Jesus began both to do and teach.' },
  { book: 'John', basis: 'John 20:31', reason: 'The book says why it was written: that ye might believe that Jesus is the Christ, the Son of God.' },
  { book: 'Revelation', basis: 'Revelation 1:1', reason: 'The book opens by naming itself: the Revelation of Jesus Christ.' },
]);

// ---- Rule B: His names and titles -----------------------------------------
// Case-sensitive patterns over New Testament verses. Old Testament uses of a
// title come in ONLY where the New Testament itself gives Him that title (see
// OT_TITLE_VERSES), never because the word looks the same.
export const NAME_LEXICON = Object.freeze([
  { title: 'Jesus', pattern: '\\bJesus\\b', reason: 'His name, given by the angel (Matthew 1:21).' },
  { title: 'Christ', pattern: '\\bChrist\\b', reason: 'The Anointed One; the Greek of Messiah (John 1:41).' },
  { title: 'the Lamb', pattern: '\\bLamb\\b', reason: 'John names Him the Lamb of God (John 1:29); the KJV capitalizes Lamb only for Him in the New Testament.' },
  { title: 'the Son of God', pattern: 'Son of God', reason: 'His title from Gabriel onward (Luke 1:35).' },
  { title: 'the Son of man', pattern: 'Son of man', reason: 'The title He used of Himself most often (Matthew 8:20).' },
  { title: 'the Son', pattern: '\\b(?:his|my|the|thy|own|beloved|dear) Son\\b', reason: 'The KJV capitalizes Son for Him; the possessive guard leaves out the vocative Son, which is spoken to men.' },
  { title: 'Messias', pattern: '\\bMessias\\b', reason: 'The Messiah, interpreted as the Christ (John 1:41; 4:25).' },
  { title: 'Emmanuel', pattern: '\\bEmmanuel\\b', reason: 'God with us (Matthew 1:23).' },
  { title: 'the Holy One of God', pattern: 'Holy One of God|the Holy One and the Just', reason: 'Named so by the unclean spirit (Mark 1:24) and by Peter (Acts 3:14).' },
  { title: 'the Word', pattern: '^(?!)$', reason: 'John names Him the Word; the verses are listed in WORD_VERSES because the same word also means the Scriptures.' },
]);

// The verses where the Word is His name (Logos), not the Scriptures.
export const WORD_VERSES = Object.freeze([
  'John 1:1', 'John 1:14', '1 John 1:1', '1 John 5:7', 'Revelation 19:13',
]);

// Verses where "the Lord" is Him by the passage's own words, with no title in
// the verse. [ref, reason].
export const LORD_VERSES = Object.freeze([
  ['Acts 22:18', 'He tells Paul, "they will not receive thy testimony concerning me" (Acts 22:18), and Paul answers of "them that believed on thee" (Acts 22:19).'],
  ['Acts 23:11', 'The Lord stood by Paul and said, "as thou hast testified of me in Jerusalem, so must thou bear witness also at Rome" (Acts 23:11).'],
]);

// Verses where a lexicon word does NOT refer to Him. Named, never silent.
export const NAME_EXCLUSIONS = Object.freeze([
  { ref: 'Acts 7:45', reason: 'Jesus here is Joshua, who brought the tabernacle into the land.' },
  { ref: 'Hebrews 4:8', reason: 'Jesus here is Joshua, who did not give them rest.' },
  { ref: 'Colossians 4:11', reason: 'Jesus, which is called Justus, is a fellow worker of Paul.' },
]);

// Old Testament verses whose title the New Testament gives Him by name.
export const OT_TITLE_VERSES = Object.freeze([
  { refs: ['Isaiah 7:14', 'Isaiah 8:8'], title: 'Immanuel', basis: 'Matthew 1:23', reason: 'Matthew gives Him this name, "which being interpreted is, God with us" (Matthew 1:23); Isaiah 8:8 calls the land His.' },
  { refs: ['Daniel 9:25', 'Daniel 9:26'], title: 'Messiah', basis: 'John 1:41', reason: 'The New Testament gives Him the title Messias, the Christ; these are the only verses where the KJV Old Testament uses the word Messiah.' },
]);

// ---- Scenes: how a book is cut into passages ------------------------------
// A new scene begins at a chapter's first verse, or at a verse that opens as
// narrative (SCENE_OPEN) AND names a movement or a time in its first two
// clauses (SCENE_MOVE). A piece shorter than SCENE_MIN verses joins the one
// before it. Revelation cuts at the seer's own transitions (VISION_OPEN).
// Where this mechanical cut is plainly wrong, SCENE_JOINS mends it, each with
// its reason.
export const SCENE_OPEN = '^(?:And|Now|Then|After|When|In|On|The same|But when|And when|And it came|And after|And straightway|And again|And forthwith|Afterward|Therefore when|So when|And immediately)\\b';
export const SCENE_MOVE = '\\b(?:departed|went (?:up|down|out|forth|into|over|thence|about|through|away|on)|came (?:down|up|into|unto|to|out|again|from)|entered(?: into)?|passed (?:over|by|through)|was come (?:into|to|down|up|out)|were come (?:into|to|out|over)|withdrew|arose, and|the (?:next|same|third|morrow|first) day|after (?:these|this|six|two|three|many|a few) (?:things|days|sayings)|in the morning|when (?:the )?even(?:ing)? was come|at that time|in those days|it came to pass|on (?:the|a|another) sabbath|at even|the day following|two days|six days before|was come to|drew nigh (?:unto|to)|sat at meat|as he (?:sat|went|passed|walked)|as they (?:went|departed|came|were eating)|seeing the multitudes|when the sabbath was past)\\b';
export const VISION_OPEN = '^(?:And I saw|And I beheld|And I looked|After this I looked|After these things I (?:saw|heard|looked)|And after these things I|And there appeared|And there was war|And I heard a (?:great )?voice|And the seventh angel|And the (?:first|second|third|fourth|fifth|sixth) (?:angel|poured))\\b';
export const SCENE_MIN = 3;
// A piece shorter than SCENE_MIN is usually a scene's opening line (He went
// unto the mount of Olives, John 8:1), so it joins the piece AFTER it in the
// same chapter; only when there is none does it join the piece before.

// Mechanical cuts that fall inside one telling. [first ref of the piece to
// join to the piece before it, reason].
export const SCENE_JOINS = Object.freeze([
  ['Matthew 20:6', 'Inside the parable of the labourers in the vineyard.'],
  ['Matthew 21:30', 'Inside the parable of the two sons.'],
  ['Matthew 24:19', 'Inside His answer on the mount of Olives.'],
  ['Matthew 25:7', 'Inside the parable of the ten virgins.'],
  ['Matthew 26:44', 'Still in the garden of Gethsemane.'],
  ['Matthew 26:73', 'Still Peter in the palace, the same night.'],
  ['Matthew 27:53', 'The graves opened at His death (27:52); the sentence runs on.'],
  ['Matthew 8:32', 'The same encounter with the men possessed with devils.'],
  ['Matthew 14:29', 'The same night on the water: He bids Peter come.'],
  ['Luke 10:35', 'Inside the parable of the good Samaritan.'],
  ['Luke 15:17', 'Inside the parable of the prodigal son.'],
  ['Luke 15:20', 'Inside the parable of the prodigal son.'],
  ['Luke 15:25', 'Inside the parable of the prodigal son.'],
  ['Luke 16:22', 'Inside the account of the rich man and Lazarus.'],
  ['Luke 19:15', 'Inside the parable of the pounds.'],
  ['Mark 9:1', 'The same saying: the chapter break falls inside His words (Mark 8:38).'],
  ['Mark 9:7', 'The same scene on the mountain: the cloud and the voice.'],
  ['Mark 9:21', 'The same healing of the father’s son.'],
  ['Acts 2:18', 'Inside Peter’s quotation of Joel; in those days is Joel’s phrase.'],
  ['Acts 7:23', 'Inside Stephen’s speech to the council (7:2-53).'],
  ['Acts 7:26', 'Inside Stephen’s speech to the council (7:2-53).'],
  ['Acts 7:41', 'Inside Stephen’s speech; in those days is his phrase.'],
]);

// In the letters a passage runs on from a title verse while the next verse
// still speaks of Him by pronoun, or speaks TO Him (Hebrews 1:8-12, Unto the
// Son he saith, Thy throne... Thou, Lord... thou remainest). Limit, named: a
// pronoun can belong to someone else, so a passage may run a verse or two
// long; it never crosses a chapter.
export const CARRY_PRONOUNS = '\\b(?:he|him|his|himself|whom|who|thou|thee|thy|thine)\\b';

// The key verse shown for a passage: each title counts `title`, each phrase
// that says what He is counts `saysWeight`, and a greeting line loses
// `greetingPenalty`, so "Paul, an apostle of Jesus Christ" does not stand for
// a chapter that says who Christ is.
export const KEY_VERSE = Object.freeze({
  title: 10,
  says: '\\b(?:I am|is the|was the|art the|is our|is Lord|is come|is risen|is before|is the head|is the image|firstborn|begotten|the brightness|by him|in him|the same yesterday|for ever|right hand|died|rose|raised|blood|cross|Lord of|King of|Saviour|mediator|high priest)\\b',
  saysWeight: 3,
  greeting: '\\b(?:apostle of|servant of|prisoner of|Grace be|grace be|Grace to|grace to|Grace, mercy)\\b',
  greetingPenalty: 25,
});

// ---- Rule C: the Old Testament the New Testament quotes -------------------
// The method, stated so anyone can run it again:
//   1. A New Testament verse is a quotation candidate when it, or one of the
//      two verses before it in the same chapter, carries a quotation formula
//      (FORMULA), or when it shares at least FREE_SHARED content words with an
//      Old Testament verse at a ratio of FREE_RATIO and the public-domain
//      cross-reference data (openbible.info / Treasury of Scripture Knowledge,
//      app/public/bible/xref) ranks the link at FREE_VOTES or more.
//   2. Its Old Testament partners come ONLY from that cross-reference data;
//      each partner must share content words with the New Testament verse
//      (FORMULA_SHARED at FORMULA_RATIO, or FORMULA_SHARED_TIGHT at
//      FORMULA_RATIO_TIGHT).
//   3. Only the best partner is kept (most shared words, then most votes),
//      with its neighbours in the same chapter within NEIGHBOUR verses.
// LIMITS, named honestly: the KJV translators rendered the New Testament from
// Greek and the Old from Hebrew, so a quotation can share few English words
// with its source (Matthew 8:17 and Isaiah 53:4 share almost none). Those are
// what QUOTE_SUPPLEMENT is for. The method also finds allusions; APPLIES sorts
// what is said of Him from what is not.
export const QUOTE_METHOD = Object.freeze({
  FORMULA: 'fulfilled|it is written|as it is written|written in the|the scripture|scriptures|spoken (?:by|of) the (?:prophet|Lord)|spake by|by the prophet|Esaias|Jeremy|Jeremias|Daniel the prophet|David (?:himself )?(?:saith|said|speaketh|calleth)|David in spirit|call him|Moses (?:wrote|said|saith|truly said|describeth)|the prophet|he saith|saith he|said he|which was spoken|have ye not read|did ye never read|is it not written|in the law|in the psalms|psalm|the Holy Ghost (?:saith|by the mouth)|saith the Lord|And again|as he saith|according to the scriptures|the prophets|written of him|this day is this scripture|that is to say|being interpreted',
  FORMULA_SHARED: 3, FORMULA_RATIO: 0.3,
  FORMULA_SHARED_TIGHT: 2, FORMULA_RATIO_TIGHT: 0.5,
  FREE_SHARED: 4, FREE_RATIO: 0.45, FREE_VOTES: 10,
  NEIGHBOUR: 3,
  OT_UNIT_GAP: 3,
  STOPWORDS: 'the and of to in that he unto for i is his a be they shall them it not with which ye all their was thou him me my thy thee but have as from by are this will were upon hath when then there so out we you her or an on at up what who whom also even said saith one no man men let into these those shalt us our your hast before after over any every do did done if yet should would may might come came went go day days lord god thing things am art how now saying behold',
});

// Quotations the method cannot see, each named by the New Testament verse
// that makes it. [NT ref, OT refs, how the NT applies it].
export const QUOTE_SUPPLEMENT = Object.freeze([
  ['Matthew 27:46', ['Psalms 22:1'], 'He cries the psalm’s first line from the cross.'],
  ['Mark 15:34', ['Psalms 22:1'], 'He cries the psalm’s first line from the cross.'],
  ['John 19:36', ['Exodus 12:46', 'Numbers 9:12', 'Psalms 34:20'], 'John says the unbroken bones fulfilled the scripture.'],
  ['John 19:37', ['Zechariah 12:10'], 'John says the pierced side fulfilled another scripture.'],
  ['Hebrews 10:5', ['Psalms 40:6', 'Psalms 40:7', 'Psalms 40:8'], 'Hebrews says He spoke these words when He came into the world.'],
  ['Hebrews 2:6', ['Psalms 8:4', 'Psalms 8:5', 'Psalms 8:6'], 'Hebrews applies the psalm to Jesus, made a little lower than the angels (2:9).'],
  ['Hebrews 1:5', ['2 Samuel 7:14'], 'Hebrews applies the promise made to David’s son to the Son: "I will be to him a Father" (Hebrews 1:5).'],
  ['Matthew 8:17', ['Isaiah 53:4'], 'Matthew says His healing fulfilled Esaias.'],
  ['Luke 22:37', ['Isaiah 53:12'], 'He says this scripture must be accomplished in Him.'],
  ['1 Peter 2:22', ['Isaiah 53:9'], 'Peter applies it to Christ, who did no sin.'],
  ['Galatians 3:16', ['Genesis 22:18'], 'Paul says the seed of the promise is Christ.'],
  ['Luke 1:32', ['Isaiah 9:6', 'Isaiah 9:7'], 'Gabriel gives Him the throne of David and a kingdom with no end, the words of Isaiah 9:7.'],
  ['Matthew 26:64', ['Daniel 7:13', 'Daniel 7:14'], 'He says the Son of man will come in the clouds of heaven, Daniel’s vision.'],
  ['Acts 2:30', ['2 Samuel 7:12', 'Psalms 132:11'], 'Peter says David knew that Yahweh had sworn with an oath to raise up Christ to sit on David’s throne (Acts 2:30).'],
  ['Acts 13:34', ['Isaiah 55:3'], 'Paul applies the sure mercies of David to the raising of Jesus.'],
  ['Romans 15:12', ['Isaiah 11:1', 'Isaiah 11:10'], 'Paul quotes the root of Jesse; the root is the rod and Branch of 11:1 (Revelation 5:5 calls Him the Root of David).'],
  ['Acts 3:22', ['Deuteronomy 18:15', 'Deuteronomy 18:18', 'Deuteronomy 18:19'], 'Peter says Moses spoke of Him: "A prophet shall the Lord your God raise up unto you of your brethren, like unto me" (Acts 3:22).'],
  ['Luke 3:6', ['Isaiah 40:5'], 'Luke quotes Esaias: "all flesh shall see the salvation of God" (Luke 3:6).'],
  ['John 15:25', ['Psalms 69:4', 'Psalms 35:19'], 'He says they hated Him without a cause, that the word written in their law might be fulfilled.'],
  ['Hebrews 2:13', ['Isaiah 8:17', 'Isaiah 8:18'], 'Hebrews puts the words in His mouth: "I will put my trust in him" (Hebrews 2:13).'],
  ['John 7:42', ['Micah 5:2'], 'The crowd names the scripture: "Christ cometh of the seed of David, and out of the town of Bethlehem" (John 7:42).'],
  ['Matthew 21:9', ['Psalms 118:25', 'Psalms 118:26'], 'The multitudes cry "Hosanna to the Son of David: Blessed is he that cometh in the name of the Lord" (Matthew 21:9).'],
  ['Hebrews 1:6', ['Psalms 97:7'], 'When He brings the firstbegotten into the world: "let all the angels of God worship him" (Hebrews 1:6).'],
  ['Hebrews 1:11', ['Psalms 102:26', 'Psalms 102:27'], 'Hebrews says it unto the Son: "They shall perish; but thou remainest" (Hebrews 1:11).'],
  ['1 Peter 2:24', ['Isaiah 53:5'], 'Peter says Christ bare our sins: "by whose stripes ye were healed" (1 Peter 2:24).'],
  ['1 Peter 2:25', ['Isaiah 53:6'], 'Peter says ye were as sheep going astray, now returned to the Shepherd.'],
  ['Matthew 12:21', ['Isaiah 42:4'], 'Matthew ends the quotation: "in his name shall the Gentiles trust" (Matthew 12:21).'],
  ['Revelation 1:7', ['Zechariah 12:10'], 'Every eye shall see Him, and they also which pierced Him.'],
  ['Revelation 1:17', ['Isaiah 44:6', 'Isaiah 48:12'], 'He says of Himself what Yahweh says in Isaiah: "I am the first and the last" (Revelation 1:17).'],
  ['Revelation 19:15', ['Psalms 2:9'], 'He shall rule them with a rod of iron.'],
  ['Revelation 12:5', ['Psalms 2:9'], 'The man child who was to rule all nations with a rod of iron.'],
  ['John 19:28', ['Psalms 69:21'], 'That the scripture might be fulfilled, saith, I thirst.'],
  ['Philippians 2:10', ['Isaiah 45:23'], 'At the name of Jesus every knee should bow, and every tongue confess that Jesus Christ is Lord.'],
  ['Hebrews 10:37', ['Habakkuk 2:3'], 'He that shall come will come, and will not tarry.'],
  ['Ephesians 2:17', ['Isaiah 57:19'], 'He came and preached peace to you which were afar off, and to them that were nigh.'],
  ['Matthew 21:16', ['Psalms 8:2'], 'He answers the chief priests with it when the children cry Hosanna to Him.'],
  ['Luke 23:46', ['Psalms 31:5'], 'His last word from the cross: "Father, into thy hands I commend my spirit" (Luke 23:46).'],
  ['Matthew 27:43', ['Psalms 22:8'], 'The mockers at the cross say the psalm’s words of Him: "He trusted in God; let him deliver him now" (Matthew 27:43).'],
  ['Matthew 2:23', [], '"He shall be called a Nazarene" (Matthew 2:23): Matthew names the prophets without a single verse to match; recorded so the absence is visible.'],
]);

// Judgments on method-found pairs: does the New Testament apply the quoted
// words to Him? The DEFAULT is decided by rule (a fulfillment formula, or a
// title of His, in the quoting verse or the verse before it); every row here
// overrides the default and says why. key: 'NT ref|OT ref'.
export const APPLIES = Object.freeze({
  'Matthew 2:6|Micah 5:2': ['yes', "Matthew says the Governor out of Bethlehem is the Christ (2:4-6)."],
  'Matthew 2:18|Jeremiah 31:15': ['no', "Fulfilled at His birth, but the words are of Rachel and the mothers of Bethlehem, not of Him."],
  'Matthew 3:3|Isaiah 40:3': ['yes', 'John prepares "the way of the Lord" (Matthew 3:3); Isaiah calls Him "our God" (Isaiah 40:3), and the way is His.'],
  'Matthew 4:4|Deuteronomy 8:3': ['no', "He answers the tempter with it; the words are about every man living by the word."],
  'Matthew 4:6|Psalms 91:12': ['no', "The tempter quotes it at Him; the Word does not apply it to Him here."],
  'Matthew 4:16|Isaiah 9:2': ['yes', "Matthew says the great light in Galilee fulfilled Esaias (4:14-16)."],
  'Matthew 11:10|Malachi 3:1': ['yes', "He says John is the messenger who prepares His way (Matthew 11:10)."],
  'Matthew 12:20|Isaiah 42:3': ['yes', "The same quotation as Isaiah 42:1: Matthew says it was fulfilled in Him (12:17-21)."],
  'Matthew 13:14|Isaiah 6:9': ['no', "The words are about the people’s hearing, not about Him."],
  'Matthew 13:14|Isaiah 6:10': ['no', "The words are about the people’s hearing, not about Him."],
  'Matthew 13:15|Isaiah 6:10': ['no', "The words are about the people’s hearing, not about Him."],
  'Matthew 20:22|Jeremiah 25:28': ['no', "Shared words (the cup) found the match; He does not quote Jeremiah."],
  'Matthew 21:13|Jeremiah 7:11': ['no', "The words are about the house and the people who robbed it, not about Him."],
  'Matthew 22:37|Deuteronomy 6:5': ['no', "The great commandment; the words are not about Him."],
  'Matthew 22:44|Psalms 110:1': ['yes', "He asks how David in spirit calls the Christ Lord (Matthew 22:43-45)."],
  'Matthew 23:39|Psalms 118:26': ['yes', 'He says, "Ye shall not see me henceforth, till ye shall say, Blessed is he that cometh in the name of the Lord" (Matthew 23:39).'],
  'Matthew 24:24|Deuteronomy 13:1': ['no', "The words are about false prophets."],
  'Matthew 24:35|Isaiah 51:6': ['no', "An echo found by shared words; the verse does not quote Isaiah."],
  'Matthew 26:15|Zechariah 11:12': ['yes', "The thirty pieces covenanted for Him are the goodly price Zechariah names (Matthew 26:15; 27:9)."],
  'Matthew 27:34|Psalms 69:21': ['yes', "The gall and vinegar given Him on the cross; John says it fulfilled the scripture (John 19:28-29)."],
  'Matthew 27:48|Psalms 69:21': ['yes', "The vinegar given Him on the cross (John 19:28-29)."],
  'Mark 1:3|Isaiah 40:3': ['yes', "The way of the Lord that John prepares is His way (Mark 1:3)."],
  'Mark 8:18|Jeremiah 5:21': ['no', "He rebukes His disciples in Jeremiah’s words; the words are not about Him."],
  'Mark 12:10|Psalms 118:22': ['yes', "He applies the rejected stone to Himself (Mark 12:10-11)."],
  'Mark 12:11|Psalms 118:23': ['yes', "He applies the rejected stone to Himself (Mark 12:10-11)."],
  'Mark 15:24|Psalms 22:18': ['yes', "His garments parted by lot at the cross (Mark 15:24; John 19:24)."],
  'Mark 15:36|Psalms 69:21': ['yes', "The vinegar given Him on the cross (John 19:28-29)."],
  'Luke 1:31|Isaiah 7:14': ['yes', "Gabriel’s words to Mary are Isaiah’s sign: conceive, bring forth a son, call His name (Luke 1:31)."],
  'Luke 3:4|Isaiah 40:3': ['yes', "The way of the Lord that John prepares is His way (Luke 3:4)."],
  'Luke 3:5|Isaiah 40:4': ['yes', "The same quotation, Luke 3:4-6."],
  'Luke 4:10|Psalms 91:11': ['no', "The tempter quotes it at Him; the Word does not apply it to Him here."],
  'Luke 4:18|Isaiah 61:1': ['yes', 'He reads it in the synagogue and says, "This day is this scripture fulfilled in your ears" (Luke 4:21).'],
  'Luke 4:19|Isaiah 61:2': ['yes', "He reads it and says it is fulfilled in their ears (Luke 4:19-21)."],
  'Luke 7:27|Malachi 3:1': ['yes', "He says John is the messenger who prepares His way (Luke 7:27)."],
  'Luke 11:31|1 Kings 10:4': ['no', "The verse is about the queen of Sheba and Solomon; He is the greater than Solomon, but the verse is not about Him."],
  'Luke 20:17|Psalms 118:22': ['yes', "He applies the rejected stone to Himself (Luke 20:17)."],
  'Luke 20:43|Psalms 110:1': ['yes', "The same quotation of Psalm 110:1, Luke 20:42-43."],
  'Luke 21:25|Isaiah 51:15': ['no', "Shared words found the match; He does not quote Isaiah."],
  'Luke 21:33|Isaiah 51:6': ['no', "An echo found by shared words; the verse does not quote Isaiah."],
  'John 1:23|Isaiah 40:3': ['yes', "John the Baptist says he is the voice that prepares His way (John 1:23)."],
  'John 2:17|Psalms 69:9': ['yes', "His disciples remembered it of Him when He cleansed the temple (John 2:17)."],
  'John 6:6|Deuteronomy 8:16': ['no', "Shared words found the match; the verse does not quote Deuteronomy."],
  'John 6:31|Psalms 78:24': ['yes', "He answers that the true bread from heaven is Himself (John 6:32-35)."],
  'John 7:38|Ezekiel 47:9': ['no', "The rivers of living water are the Spirit in believers (John 7:39); the match is by shared words."],
  'John 7:42|1 Samuel 16:4': ['no', "The crowd names Bethlehem; the shared words found Samuel’s visit. Micah 5:2 and 2 Samuel 7:12 are the scriptures meant."],
  'John 15:25|Psalms 109:3': ['no', "The quotation is Psalm 69:4 and 35:19; the shared words found 109:3."],
  'John 16:20|Jeremiah 31:13': ['no', "An echo found by shared words; the verse does not quote Jeremiah."],
  'Acts 2:17|Joel 2:28': ['no', 'The words are about the Spirit poured out, not about Him.'],
  'Acts 2:21|Joel 2:32': ['yes', "Peter preaches it and names the Lord as Jesus (Acts 2:21, 36); Paul says the same in Romans 10:9-13."],
  'Acts 2:25|Psalms 16:8': ['yes', "Peter says David speaketh concerning Him (Acts 2:25)."],
  'Acts 2:26|Psalms 16:9': ['yes', "Peter says David speaketh concerning Him (Acts 2:25-26)."],
  'Acts 2:27|Psalms 16:10': ['yes', "Peter says David spoke of the resurrection of Christ (Acts 2:27, 31)."],
  'Acts 2:34|Psalms 110:1': ['yes', "Peter says David is not ascended; the Lord at the right hand is Jesus (Acts 2:34-36)."],
  'Acts 2:36|Ezekiel 34:30': ['no', "Shared words found the match; Peter does not quote Ezekiel."],
  'Acts 3:22|Deuteronomy 18:15': ['yes', "Peter says Moses spoke of Him: a prophet like unto me (Acts 3:22)."],
  'Acts 3:22|Deuteronomy 18:18': ['yes', "Peter says Moses spoke of Him (Acts 3:22)."],
  'Acts 3:25|Genesis 22:18': ['yes', "Peter says Yahweh raised up His Son Jesus to bless them, the seed of Abraham (Acts 3:25-26)."],
  'Acts 4:25|Psalms 2:1': ['yes', "The church prays it of the rulers gathered against His holy child Jesus (Acts 4:25-27)."],
  'Acts 7:37|Deuteronomy 18:15': ['yes', "Stephen names Moses’ promised prophet (Acts 7:37)."],
  'Acts 7:37|Deuteronomy 18:18': ['yes', "Stephen names Moses’ promised prophet (Acts 7:37)."],
  'Acts 8:32|Isaiah 53:7': ['yes', "Philip began at this scripture and preached unto him Jesus (Acts 8:32-35)."],
  'Acts 8:33|Isaiah 53:8': ['yes', "Philip preached Jesus from it (Acts 8:33-35)."],
  'Acts 13:35|Psalms 16:10': ['yes', "Paul says the Holy One who saw no corruption is Jesus (Acts 13:35-37)."],
  'Romans 1:17|Habakkuk 2:4': ['no', "The words are about the just living by faith, not about Him."],
  'Romans 8:36|Psalms 44:22': ['no', "The words are about believers suffering for His sake."],
  'Romans 9:33|Isaiah 8:14': ['yes', "Paul says the stone laid in Sion is the One to believe on (Romans 9:33; 10:11)."],
  'Romans 10:13|Joel 2:32': ['yes', "Paul says the Lord called upon is the Lord Jesus (Romans 10:9-13)."],
  'Romans 10:16|Isaiah 53:1': ['yes', "The report is of Him (Romans 10:16; John 12:38)."],
  'Romans 13:9|Exodus 20:16': ['no', "The commandments; the words are not about Him."],
  'Romans 13:9|Exodus 20:14': ['no', "The commandments; the words are not about Him."],
  'Romans 15:12|Isaiah 11:10': ['yes', "Paul says the root of Jesse who reigns over the Gentiles is the hope of the Gentiles (Romans 15:12)."],
  '1 Corinthians 1:31|Jeremiah 9:24': ['no', "The words are about where a man should glory."],
  '1 Corinthians 15:27|Psalms 8:6': ['yes', "Paul says all things are put under Christ’s feet (1 Corinthians 15:23-27)."],
  '1 Corinthians 15:28|Psalms 18:47': ['no', "Shared words found the match; Paul does not quote this psalm."],
  '2 Corinthians 10:7|1 Samuel 16:7': ['no', "Shared words found the match; Paul does not quote Samuel."],
  'Galatians 5:14|Leviticus 19:18': ['no', 'The commandment to love the neighbour; not about Him.'],
  'Ephesians 5:14|Isaiah 26:19': ['no', "The words call the sleeper to wake; Christ gives the light, but the verse is not a quotation of Isaiah."],
  'Colossians 3:16|Deuteronomy 6:6': ['no', "Shared words found the match; Paul does not quote Deuteronomy."],
  'Hebrews 1:10|Psalms 102:25': ['yes', 'Hebrews says it unto the Son: "Thou, Lord, in the beginning hast laid the foundation of the earth" (Hebrews 1:10).'],
  'Hebrews 1:13|Psalms 110:1': ['yes', "Hebrews says it to the Son and not to any angel (1:13)."],
  'Hebrews 2:7|Psalms 8:5': ['yes', "Hebrews applies it to Jesus, made a little lower than the angels (2:7-9)."],
  'Hebrews 2:12|Psalms 22:22': ['yes', 'Hebrews puts the words in His mouth: "I will declare thy name unto my brethren" (Hebrews 2:12).'],
  'Hebrews 7:1|Genesis 14:18': ['yes', "Hebrews says Melchisedec was made like unto the Son of God (7:1-3)."],
  'Hebrews 7:17|Psalms 110:4': ['yes', "Hebrews says it of Him, a priest for ever (7:17)."],
  'Hebrews 7:21|Psalms 110:4': ['yes', "Hebrews says the oath was sworn to Him (7:21)."],
  'Hebrews 10:7|Psalms 40:7': ['yes', "Hebrews says He spoke it when He came into the world (10:5-7)."],
  'Hebrews 10:11|Daniel 11:31': ['no', "Shared words found the match; Hebrews does not quote Daniel."],
  'Hebrews 10:30|Deuteronomy 32:35': ['no', "The words are about vengeance belonging to Yahweh."],
  'Hebrews 13:11|Leviticus 16:27': ['yes', "Hebrews says the bodies burned without the camp picture Jesus suffering without the gate (13:11-12)."],
  'James 2:23|Genesis 15:6': ['no', "The words are about Abraham’s faith."],
  '1 Peter 2:7|Psalms 118:22': ['yes', "Peter says the rejected stone is precious to them that believe (1 Peter 2:7)."],
  '1 Peter 2:8|Isaiah 8:14': ['yes', "Peter says the stone of stumbling is the same stone (1 Peter 2:8)."],
  'Revelation 3:7|Isaiah 22:22': ['yes', "He says of Himself that He hath the key of David (Revelation 3:7)."],
  'Revelation 6:12|Joel 2:31': ['no', "The words are about signs in the heavens."],
  'Revelation 12:12|Psalms 96:11': ['no', "The words are about the heavens rejoicing."],
  'Revelation 14:2|Ezekiel 43:2': ['no', "The voice here is from heaven among the harpers; the match is by shared words."],
  'Revelation 15:4|Psalms 86:9': ['no', 'The song is addressed to the "Lord God Almighty" (Revelation 15:3); the verse does not name the Lamb as its subject.'],
  'Revelation 15:8|Exodus 40:35': ['no', "The words are about the smoke of glory filling the temple."],
  'Revelation 19:11|Psalms 50:6': ['no', "Shared words found the match; John does not quote the psalm."],
  'John 3:29|Isaiah 62:5': ['no', 'An echo found by shared words (the bridegroom); John does not quote Isaiah.'],
});

// ---- Rule D: the New Testament names the event -----------------------------
// [OT refs, NT basis, how, present, reason]
export const TYPE_TABLE = Object.freeze([
  { refs: ['Numbers 21:8', 'Numbers 21:9'], basis: 'John 3:14', how: 'type', present: 'no', reason: 'He says the serpent lifted up in the wilderness pictures the Son of man lifted up.' },
  { refs: ['Numbers 21:5', 'Numbers 21:6'], basis: '1 Corinthians 10:9', how: 'narration', present: 'pre-incarnate', reason: 'Paul says those who spoke against Yahweh in the wilderness tempted Christ.' },
  { refs: ['Exodus 17:6'], basis: '1 Corinthians 10:4', how: 'narration', present: 'pre-incarnate', reason: 'Paul says the Rock that followed them was Christ.' },
  { refs: ['Numbers 20:11'], basis: '1 Corinthians 10:4', how: 'narration', present: 'pre-incarnate', reason: 'The second water from the rock; Paul says that Rock was Christ.' },
  { refs: ['Exodus 16:4', 'Exodus 16:15'], basis: 'John 6:32', how: 'type', present: 'no', reason: 'He says Moses gave not that bread from heaven; His Father gives the true bread, and He is that bread (6:35).' },
  { refs: ['Exodus 12:3', 'Exodus 12:5', 'Exodus 12:6', 'Exodus 12:7', 'Exodus 12:13'], basis: '1 Corinthians 5:7', how: 'type', present: 'no', reason: 'Paul says Christ our passover is sacrificed for us.' },
  { refs: ['Jonah 1:17'], basis: 'Matthew 12:40', how: 'type', present: 'no', reason: 'He says Jonas three days in the whale pictures the Son of man three days in the earth.' },
  { refs: ['Genesis 14:18', 'Genesis 14:19', 'Genesis 14:20'], basis: 'Hebrews 7:3', how: 'type', present: 'no', reason: 'Hebrews says Melchisedec was made like unto the Son of God.' },
  { refs: ['Genesis 28:12'], basis: 'John 1:51', how: 'type', present: 'no', reason: 'He says the angels will ascend and descend upon the Son of man, Jacob’s ladder.' },
  { refs: ['Isaiah 6:1', 'Isaiah 6:3', 'Isaiah 6:5'], basis: 'John 12:41', how: 'vision', present: 'pre-incarnate', reason: 'John says Isaiah saw His glory, and spake of Him.' },
  { refs: ['Genesis 2:7'], basis: 'Romans 5:14', how: 'type', present: 'no', reason: 'Paul says Adam is the figure of Him that was to come (and the last Adam, 1 Corinthians 15:45).' },
  { refs: ['Leviticus 16:15', 'Leviticus 16:16'], basis: 'Hebrews 9:12', how: 'type', present: 'no', reason: 'Hebrews says the high priest’s yearly entry pictures Christ entering once by His own blood.' },
  { refs: ['Leviticus 16:27'], basis: 'Hebrews 13:12', how: 'type', present: 'no', reason: 'Hebrews says the bodies burned without the camp picture Jesus suffering without the gate.' },
]);

// ---- The rule's edge: named, never silent ---------------------------------
// Old Testament passages widely read of Him that no New Testament verse
// quotes, applies, or names. Held for the Governor's word, each with the
// nearest New Testament tie. They are shown, and counted separately.
export const EDGE_TABLE = Object.freeze([
  { refs: ['Genesis 3:15'], tie: ['Galatians 4:4', 'Hebrews 2:14', 'Romans 16:20'], reason: 'The seed of the woman who bruises the serpent’s head. The New Testament echoes it but does not quote or name it.' },
  { refs: ['Genesis 49:10'], tie: ['Revelation 5:5'], reason: 'Shiloh and the sceptre of Judah. Revelation names Him the Lion of the tribe of Juda but does not quote the verse.' },
  { refs: ['Numbers 24:17'], tie: ['Revelation 22:16', 'Matthew 2:2'], reason: 'A Star out of Jacob. He calls Himself the bright and morning star; the verse is not quoted.' },
  { refs: ['Job 19:25', 'Job 19:26', 'Job 19:27'], tie: [], reason: 'I know that my redeemer liveth. No New Testament verse quotes or names it.' },
  { refs: ['Psalms 24:7', 'Psalms 24:8', 'Psalms 24:9', 'Psalms 24:10'], tie: ['1 Corinthians 2:8'], reason: 'The King of glory. Paul calls Him the Lord of glory; the psalm is not quoted.' },
  { refs: ['Proverbs 30:4'], tie: ['John 3:13'], reason: 'What is His son’s name? He says no man hath ascended up to heaven but He that came down; the verse is not quoted.' },
  { refs: ['Isaiah 7:15', 'Isaiah 7:16'], tie: [], reason: 'The verses after Immanuel’s name. The rule takes Isaiah 7:14 by Matthew 1:23 and stops there.' },
  { refs: ['Jeremiah 23:5', 'Jeremiah 23:6'], tie: ['1 Corinthians 1:30'], reason: 'The righteous Branch, THE LORD OUR RIGHTEOUSNESS. No New Testament verse quotes it.' },
  { refs: ['Jeremiah 33:15', 'Jeremiah 33:16'], tie: [], reason: 'The Branch of righteousness grows up unto David. No New Testament verse quotes it.' },
  { refs: ['Ezekiel 34:23', 'Ezekiel 34:24'], tie: ['John 10:11'], reason: 'One shepherd, My servant David. He calls Himself the good shepherd; the verse is not quoted.' },
  { refs: ['Daniel 3:25'], tie: [], reason: 'The fourth in the fire, like the Son of God. No New Testament verse names it.' },
  { refs: ['Micah 5:4'], tie: [], reason: 'He shall stand and feed in the strength of the LORD. Matthew quotes 5:2; the rule stops at what is quoted.' },
  { refs: ['Haggai 2:7'], tie: [], reason: 'The desire of all nations. No New Testament verse quotes it.' },
  { refs: ['Zechariah 3:8'], tie: [], reason: 'My servant the BRANCH. No New Testament verse quotes it.' },
  { refs: ['Zechariah 6:12', 'Zechariah 6:13'], tie: ['Hebrews 8:1'], reason: 'The man "whose name is The BRANCH" (Zechariah 6:12), "a priest upon his throne" (Zechariah 6:13). Hebrews speaks of the priest on the throne but does not quote the verse.' },
  { refs: ['Zechariah 14:4'], tie: ['Acts 1:11', 'Acts 1:12'], reason: 'His feet on the mount of Olives. He went up from Olivet and will come in like manner; the verse is not quoted.' },
  { refs: ['Malachi 4:2'], tie: ['Luke 1:78'], reason: 'The Sun of righteousness with healing in His wings. Zacharias speaks of the dayspring from on high; the verse is not quoted.' },
  { refs: ['Genesis 18:1', 'Genesis 18:2'], tie: ['John 8:56'], reason: 'Yahweh appeared to Abraham. He says Abraham rejoiced to see His day, but names no passage.' },
  { refs: ['Proverbs 8:22', 'Proverbs 8:23', 'Proverbs 8:30'], tie: [], reason: 'Wisdom set up from everlasting. No New Testament verse names this chapter; held for the elders.' },
]);

// ---- Where, when, how: the tables the generator reads ---------------------
// Place names the Gospels and Acts use. "where" for a scene lists the ones the
// passage itself names, in the order named. It says "named in the passage":
// a place named in speech may not be where the speaker stood.
export const PLACES = Object.freeze([
  'Bethlehem', 'Nazareth', 'Galilee', 'Capernaum', 'Jerusalem', 'the temple', 'Jordan', 'the wilderness',
  'Judaea', 'Samaria', 'Sychar', 'Cana', 'Bethany', 'Bethphage', 'the mount of Olives', 'Gethsemane',
  'Golgotha', 'Calvary', 'Emmaus', 'Jericho', 'Caesarea Philippi', 'Caesarea', 'Tyre', 'Sidon',
  'Decapolis', 'Gadarenes', 'Gergesenes', 'Gennesaret', 'Bethsaida', 'Chorazin', 'Nain', 'Egypt',
  'Magdala', 'the sea of Galilee', 'the sea of Tiberias', 'Bethabara', 'Aenon', 'Siloam', 'Bethesda',
  'Solomon’s porch', 'Damascus', 'Antioch', 'Iconium', 'Lystra', 'Derbe', 'Philippi', 'Thessalonica',
  'Berea', 'Athens', 'Corinth', 'Ephesus', 'Troas', 'Miletus', 'Rome', 'Cyprus', 'Crete', 'Melita',
  'Gaza', 'Azotus', 'Lydda', 'Joppa', 'Patmos', 'the synagogue', 'a mountain', 'the judgment hall',
  'the sepulchre', 'the high priest’s palace', 'the garden',
]);

// When a Gospel or Acts passage happened. [book, from 'c:v', to 'c:v', era].
export const NARRATIVE_ERAS = Object.freeze([
  ['Matthew', '1:1', '2:23', 'incarnation'], ['Matthew', '3:1', '25:46', 'ministry'], ['Matthew', '26:1', '27:66', 'cross'], ['Matthew', '28:1', '28:20', 'resurrection'],
  ['Mark', '1:1', '13:37', 'ministry'], ['Mark', '14:1', '15:47', 'cross'], ['Mark', '16:1', '16:18', 'resurrection'], ['Mark', '16:19', '16:20', 'ascension'],
  ['Luke', '1:1', '2:52', 'incarnation'], ['Luke', '3:1', '21:38', 'ministry'], ['Luke', '22:1', '23:56', 'cross'], ['Luke', '24:1', '24:49', 'resurrection'], ['Luke', '24:50', '24:53', 'ascension'],
  ['John', '1:1', '1:5', 'before-time'], ['John', '1:6', '1:18', 'incarnation'], ['John', '1:19', '12:50', 'ministry'], ['John', '13:1', '19:42', 'cross'], ['John', '20:1', '21:25', 'resurrection'],
  ['Acts', '1:1', '1:8', 'resurrection'], ['Acts', '1:9', '1:11', 'ascension'], ['Acts', '1:12', '28:31', 'church'],
]);

// Forced cuts (a scene must begin here). Most are era boundaries above, so an
// era never changes inside one passage; the rest open a scene the Word marks
// plainly but the movement test cannot see.
export const FORCED_CUTS = Object.freeze([
  'John 1:6', 'John 1:19', 'Mark 16:19', 'Luke 24:50', 'Acts 1:9', 'Acts 1:12', 'Luke 3:1',
  'Luke 1:26', // And in the sixth month the angel Gabriel was sent: the annunciation.
  'Luke 1:57', // Now Elisabeth's full time came: the birth of John.
  'Mark 9:2', // And after six days: the transfiguration begins; Mark 9:1 closes the saying before it.
  'Matthew 20:17', // And Jesus going up to Jerusalem took the twelve apart: a new scene after the parable.
]);

// When the Old Testament books sit, and who spoke them. [book, era, by, to,
// basis ref, place, note]. The basis verse is the book's own statement.
export const OT_BOOKS = Object.freeze({
  Genesis: { era: 'by-chapter', how: 'narration', by: 'the book of Moses', basis: 'Mark 12:26', place: '', note: '' },
  Exodus: { era: 'moses', how: 'narration', by: 'the book of Moses', basis: 'Mark 12:26', place: 'Egypt and the wilderness', note: '' },
  Leviticus: { era: 'moses', how: 'law', by: 'Moses', basis: 'Leviticus 1:1', place: 'the tabernacle in the wilderness', note: '' },
  Numbers: { era: 'moses', how: 'narration', by: 'the book of Moses', basis: 'Numbers 1:1', place: 'the wilderness of Sinai and after', note: '' },
  Deuteronomy: { era: 'moses', how: 'prophecy', by: 'Moses', basis: 'Deuteronomy 1:1', place: 'on this side Jordan in the wilderness', note: '' },
  Joshua: { era: 'the-land', how: 'narration', by: '', basis: 'Joshua 1:1', place: 'the land', note: '' },
  Judges: { era: 'the-land', how: 'narration', by: '', basis: 'Judges 1:1', place: 'the land', note: '' },
  Ruth: { era: 'the-land', how: 'narration', by: '', basis: 'Ruth 1:1', place: 'Bethlehemjudah and Moab', note: '' },
  '1 Samuel': { era: 'kings', how: 'narration', by: '', basis: '1 Samuel 1:1', place: 'Israel', note: '' },
  '2 Samuel': { era: 'kings', how: 'prophecy', by: 'Nathan the prophet, to David', basis: '2 Samuel 7:4', place: 'Jerusalem', note: '' },
  '1 Kings': { era: 'kings', how: 'narration', by: '', basis: '1 Kings 1:1', place: 'Israel', note: '' },
  '2 Kings': { era: 'kings', how: 'narration', by: '', basis: '2 Kings 1:1', place: 'Israel and Judah', note: '' },
  '1 Chronicles': { era: 'kings', how: 'narration', by: '', basis: '1 Chronicles 1:1', place: 'Israel', note: '' },
  '2 Chronicles': { era: 'kings', how: 'narration', by: '', basis: '2 Chronicles 1:1', place: 'Judah', note: '' },
  Ezra: { era: 'prophets', how: 'narration', by: '', basis: 'Ezra 1:1', place: 'Jerusalem after the exile', note: '' },
  Nehemiah: { era: 'prophets', how: 'narration', by: 'Nehemiah', basis: 'Nehemiah 1:1', place: 'Jerusalem after the exile', note: '' },
  Esther: { era: 'prophets', how: 'narration', by: '', basis: 'Esther 1:1', place: 'Shushan', note: '' },
  Job: { era: 'patriarchs', how: 'poetry', by: '', basis: 'Job 1:1', place: 'the land of Uz', note: 'The Word does not date Job; it is placed with the patriarchs by the book’s order only.' },
  Psalms: { era: 'kings', how: 'song', by: '', basis: '', place: '', note: 'The psalm is not dated in the verse; it sits with the psalms of the kings.' },
  Proverbs: { era: 'kings', how: 'wisdom', by: 'Solomon', basis: 'Proverbs 1:1', place: 'Jerusalem', note: '' },
  Ecclesiastes: { era: 'kings', how: 'wisdom', by: 'the Preacher, the son of David', basis: 'Ecclesiastes 1:1', place: 'Jerusalem', note: '' },
  'Song of Solomon': { era: 'kings', how: 'song', by: 'Solomon', basis: 'Song of Solomon 1:1', place: '', note: '' },
  Isaiah: { era: 'prophets', how: 'prophecy', by: 'Isaiah the son of Amoz, concerning Judah and Jerusalem', basis: 'Isaiah 1:1', place: 'Judah and Jerusalem', note: 'In the days of Uzziah, Jotham, Ahaz and Hezekiah (Isaiah 1:1).' },
  Jeremiah: { era: 'prophets', how: 'prophecy', by: 'Jeremiah, to Judah', basis: 'Jeremiah 1:1', place: 'Judah', note: 'From the days of Josiah to the carrying away of Jerusalem (Jeremiah 1:2-3).' },
  Lamentations: { era: 'prophets', how: 'song', by: '', basis: 'Lamentations 1:1', place: 'Jerusalem', note: '' },
  Ezekiel: { era: 'prophets', how: 'prophecy', by: 'Ezekiel the priest, among the captives', basis: 'Ezekiel 1:3', place: 'by the river Chebar, in the land of the Chaldeans', note: 'In the captivity (Ezekiel 1:2).' },
  Daniel: { era: 'prophets', how: 'vision', by: 'Daniel', basis: 'Daniel 7:1', place: 'Babylon', note: 'In the reign of Belshazzar and after (Daniel 7:1; 9:1).' },
  Hosea: { era: 'prophets', how: 'prophecy', by: 'Hosea, to Israel', basis: 'Hosea 1:1', place: 'Israel', note: '' },
  Joel: { era: 'prophets', how: 'prophecy', by: 'Joel', basis: 'Joel 1:1', place: 'Judah', note: 'The Word does not date Joel’s prophecy.' },
  Amos: { era: 'prophets', how: 'prophecy', by: 'Amos, concerning Israel', basis: 'Amos 1:1', place: 'Israel', note: '' },
  Obadiah: { era: 'prophets', how: 'prophecy', by: 'Obadiah, concerning Edom', basis: 'Obadiah 1:1', place: '', note: 'The Word does not date Obadiah’s vision.' },
  Jonah: { era: 'prophets', how: 'narration', by: '', basis: 'Jonah 1:1', place: 'the sea, and Nineveh', note: '' },
  Micah: { era: 'prophets', how: 'prophecy', by: 'Micah, concerning Samaria and Jerusalem', basis: 'Micah 1:1', place: 'Judah', note: '' },
  Nahum: { era: 'prophets', how: 'prophecy', by: 'Nahum, concerning Nineveh', basis: 'Nahum 1:1', place: '', note: '' },
  Habakkuk: { era: 'prophets', how: 'prophecy', by: 'Habakkuk the prophet', basis: 'Habakkuk 1:1', place: '', note: 'The Word does not date Habakkuk’s burden.' },
  Zephaniah: { era: 'prophets', how: 'prophecy', by: 'Zephaniah, in the days of Josiah', basis: 'Zephaniah 1:1', place: 'Judah', note: '' },
  Haggai: { era: 'prophets', how: 'prophecy', by: 'Haggai, to Zerubbabel and Joshua', basis: 'Haggai 1:1', place: 'Jerusalem after the exile', note: '' },
  Zechariah: { era: 'prophets', how: 'prophecy', by: 'Zechariah the son of Berechiah', basis: 'Zechariah 1:1', place: 'Jerusalem after the exile', note: 'In the second year of Darius (Zechariah 1:1).' },
  Malachi: { era: 'prophets', how: 'prophecy', by: 'Malachi, to Israel', basis: 'Malachi 1:1', place: 'Israel', note: 'The Word does not date Malachi; it is the last of the prophets in the book’s order.' },
});
export const GENESIS_ERAS = Object.freeze([[1, 11, 'creation'], [12, 50, 'patriarchs']]);

// Letters: who wrote, to whom, and the verse that says so.
export const LETTERS = Object.freeze({
  Romans: { by: 'Paul', to: 'the saints at Rome', basis: 'Romans 1:7' },
  '1 Corinthians': { by: 'Paul', to: 'the church at Corinth', basis: '1 Corinthians 1:2' },
  '2 Corinthians': { by: 'Paul', to: 'the church at Corinth, with the saints in Achaia', basis: '2 Corinthians 1:1' },
  Galatians: { by: 'Paul', to: 'the churches of Galatia', basis: 'Galatians 1:2' },
  Ephesians: { by: 'Paul', to: 'the saints at Ephesus', basis: 'Ephesians 1:1' },
  Philippians: { by: 'Paul and Timotheus', to: 'the saints at Philippi', basis: 'Philippians 1:1' },
  Colossians: { by: 'Paul', to: 'the saints at Colosse', basis: 'Colossians 1:2' },
  '1 Thessalonians': { by: 'Paul, Silvanus and Timotheus', to: 'the church of the Thessalonians', basis: '1 Thessalonians 1:1' },
  '2 Thessalonians': { by: 'Paul, Silvanus and Timotheus', to: 'the church of the Thessalonians', basis: '2 Thessalonians 1:1' },
  '1 Timothy': { by: 'Paul', to: 'Timothy', basis: '1 Timothy 1:2' },
  '2 Timothy': { by: 'Paul', to: 'Timothy', basis: '2 Timothy 1:2' },
  Titus: { by: 'Paul', to: 'Titus', basis: 'Titus 1:4' },
  Philemon: { by: 'Paul, a prisoner of Jesus Christ', to: 'Philemon and the church in his house', basis: 'Philemon 1:1' },
  Hebrews: { by: 'a writer the letter does not name', to: 'the brethren', basis: 'Hebrews 13:22' },
  James: { by: 'James', to: 'the twelve tribes scattered abroad', basis: 'James 1:1' },
  '1 Peter': { by: 'Peter', to: 'the strangers scattered through Pontus, Galatia, Cappadocia, Asia and Bithynia', basis: '1 Peter 1:1' },
  '2 Peter': { by: 'Simon Peter', to: 'them that have obtained like precious faith', basis: '2 Peter 1:1' },
  '1 John': { by: 'a witness who says he heard, saw and handled Him', to: 'my little children', basis: '1 John 1:1' },
  '2 John': { by: 'the elder', to: 'the elect lady and her children', basis: '2 John 1:1' },
  '3 John': { by: 'the elder', to: 'Gaius', basis: '3 John 1:1' },
  Jude: { by: 'Jude, the brother of James', to: 'them that are called', basis: 'Jude 1:1' },
});

// Revelation: shown to John in the isle of Patmos (Revelation 1:1, 1:9).
export const REVELATION_HOW = Object.freeze({ by: 'Jesus Christ, by His angel, to His servant John', basis: 'Revelation 1:1', place: 'the isle that is called Patmos, in the Spirit', placeBasis: 'Revelation 1:9' });

// Where He points the reader in time. A passage "points to" an era when its
// own words name that era. Checked on the passage text, era by era.
export const POINTS_TO = Object.freeze({
  'before-time': 'before the foundation of the world|before the world (?:began|was)|from the beginning of the world|In the beginning was the Word|before all things|Before Abraham was|from everlasting',
  creation: 'all things were made by him|by him were all things created|made the worlds|laid the foundation of the earth|created all things|the world was made by him',
  incarnation: 'made flesh|made of a woman|born of a woman|a virgin|seed of David according to the flesh|(?:came|come) in the flesh|manifest in the flesh|in the likeness of men|form of a servant|came into the world|come into the world',
  cross: '\\bcross\\b|crucified|crucify|\\bblood\\b|\\bslain\\b|suffered|on the tree|offering of the body|gave himself|died for',
  resurrection: 'rose again|is risen|raised (?:him|up|from)|resurrection|rose from the dead|the firstborn from the dead|first begotten of the dead|alive for evermore|rise again',
  ascension: 'right hand of (?:God|power|the Majesty|the throne)|on the right hand|ascended|received up|taken up|gone into heaven|entered into heaven|passed into the heavens|far above all heavens',
  'the-end': 'coming of (?:our|the) Lord|day of (?:the Lord|Christ|Jesus Christ|our Lord)|his appearing|appearing of|Son of man (?:shall )?com(?:e|ing)|come again|judge the quick and the dead|judgment seat of Christ|in the clouds|with clouds|till he come|until he come|the last day|end of the world|descend from heaven|day of judgment|I come quickly',
  forever: 'for ever|for evermore|everlasting|eternal|world without end|no end|new heaven|new Jerusalem',
});

// Presence: in the scene in person, seen or heard (yes); not in the scene
// (no); or in it before He came in the flesh (pre-incarnate). Defaults by
// kind, then these per-passage judgments, each with its reason.
// [first ref of the passage, present, detail, reason]
export const PRESENCE = Object.freeze([
  ['Luke 1:1', 'no', 'not yet conceived', 'The preface and Zacharias and Elisabeth; He is not yet conceived.'],
  ['Luke 1:8', 'no', 'not yet conceived', 'Gabriel speaks to Zacharias in the temple; He is not yet conceived.'],
  ['Luke 1:26', 'no', 'not yet conceived', 'Gabriel tells Mary she shall conceive (1:31); the conceiving is still to come.'],
  ['Luke 1:39', 'yes', 'in His mother’s womb', 'Elisabeth says, "blessed is the fruit of thy womb" (Luke 1:42). He is there, unborn.'],
  ['Luke 1:57', 'no', 'not in the scene', 'The birth and naming of John; Zacharias prophesies of Him.'],
  ['Luke 3:1', 'no', 'not in the scene', 'Yahweh’s word comes to John in the wilderness; He has not yet come to the Jordan.'],
  ['Mark 6:12', 'no', 'not in the scene', 'The twelve preach, and Herod hears of Him; He is not in these verses.'],
  ['Matthew 27:62', 'no', 'in the sepulchre', 'The chief priests seal the stone; He lies in the tomb.'],
  ['Matthew 28:1', 'no', 'risen, not yet seen', 'The angel says, "He is not here: for he is risen" (Matthew 28:6).'],
  ['Mark 16:1', 'no', 'risen, not yet seen', 'The women find the stone rolled away; the young man says, He is risen; He is not here (16:6).'],
  ['Luke 24:1', 'no', 'risen, not yet seen', 'They found not the body of the Lord Jesus (24:3).'],
  ['Luke 24:4', 'no', 'risen, not yet seen', 'Why seek ye the living among the dead? He is not here, but is risen (24:5-6).'],
  ['John 20:1', 'no', 'risen, not yet seen', 'The stone taken away; Peter and the other disciple find the linen clothes.'],
  ['John 11:55', 'no', 'not in the scene', 'They sought for Jesus at the feast; He is not there.'],
  ['Acts 7:1', 'yes', 'seen standing at the right hand', 'Stephen saw "the Son of man standing on the right hand of God" (Acts 7:56).'],
  ['Acts 9:1', 'yes', 'He spoke from heaven', 'I am Jesus whom thou persecutest (9:5), and He speaks to Ananias in a vision (9:10-16).'],
  ['Acts 22:17', 'yes', 'seen in a trance', 'Paul saw Him saying unto him, Make haste (22:18).'],
  ['Acts 23:1', 'yes', 'He stood by Paul', 'The night following the Lord stood by him (23:11).'],
]);

// Two Gospel passages are parallels (the same event told twice) when they
// share at least this many five-word runs of the same words.
export const PARALLEL_MIN_SHARED = 4;
// ...and those runs are at least this share of the shorter passage's runs, so
// two long discourses that share a stock phrase are not called one event.
export const PARALLEL_MIN_SHARE = 0.08;
