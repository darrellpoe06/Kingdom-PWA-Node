// =============================================================================
// prophetic-voices — "Prophetic Voices: The Body's Own on America's Sins & the
// Church's Account"
// =============================================================================
// A PoeTech / COLG study catalog of Black preachers and teachers who named
// America's sins and the American Church's complicity — plainly, at cost —
// while the mainstream and evangelical worlds largely looked past them (declared
// by Darrell 2026-07-04). Companion to the Kingdom Economics course
// (economics-class.js), which cites these voices in its accountability module.
//
// WHY THIS EXISTS: these are the Body's OWN prophetic witnesses. The pattern is
// old — "a prophet is not without honour, save in his own country" (Matthew
// 13:57), and Stephen was killed for naming his nation's sin to its leaders'
// faces (Acts 7:52). The one who names a people's sin draws backlash, and so is
// overlooked; that is precisely why the record must be kept. This study holds
// the voice, cites the work, and cross-references the Word — it does not endorse
// every teaching of every voice (some range into esoteric subjects); it points
// the learner to the primary source to engage with discernment (the Test).
//
// VERIFICATION / SOURCES (DR-0076): every voice carries real sources with an
// as-of date (ministry, works, identifying facts). Where a comparative or
// characterizing claim is the declarer's framing rather than an independently
// verified fact, it is labeled as such — honest uncertainty is stated, not
// papered over. Scripture is anchored by REFERENCE + a plain-language theme
// gloss (SCRIPTURE-REFERENCE-STANDARD), never a quoted translation.
// =============================================================================

export const PV_PROPOSED_COHORT_START = null;
export const PV_CONFIRMED_COHORT = { startDate: null, confirmed: false };

export const PV_META = {
  key: 'prophetic-voices',
  title: 'Prophetic Voices: The Body’s Own on America’s Sins & the Church’s Account',
  audience: 'the whole Body — those ready to hear the Body’s own prophets who named the nation’s and the Church’s sins at cost, and were overlooked for it',
  tagline: 'A prophet is not without honour, save in his own country. Keep the record of the ones who told the truth.',
  format: 'Self-paced · one voice at a time · listen to the primary source, weigh it by the Word (the Test)',
  cadenceDays: 7,
  weeks: 5,
  handsOnLabel: 'Hands-on: hear the primary source',
  blurb: 'The Body’s own overlooked voices — preachers who named America’s sins and the Church’s complicity (Dr. Frederick K.C. Price, Pastor Stephen Darby), and scientists/scholars who recovered the truth of Nile Valley civilization against imperial revisionism (Dr. Cheikh Anta Diop, Dr. Théophile Obenga, Dr. Chancellor Williams). Each voice is cited to its real work and cross-referenced with the Word; the study holds the record and points you to the source to weigh with discernment (the Test). Yahweh is the Light of Truth.',
  footer: '_Compiled by Darrell Poe · The Church of the Living God + PoeTech. We keep the record of the Body’s own prophets — cited, not endorsed wholesale — and we weigh every teaching by the Word (the Test). Honour to whom honour is due (Romans 13:7)._',
};

export const PV_SESSION_FLOW = [
  { minutes: 5, name: 'Prayer + the anchor' },
  { minutes: 10, name: 'Who this voice is' },
  { minutes: 25, name: 'Hear the primary source' },
  { minutes: 20, name: 'Weigh it by the Word (the Test)' },
  { minutes: 15, name: 'Discussion + what it means for us' },
];
export const PV_SESSION_MINUTES = PV_SESSION_FLOW.reduce((t, s) => t + s.minutes, 0); // 75

export const PV_MODULES = [
  {
    id: 'pv-price',
    title: 'Dr. Frederick K.C. Price — "Race, Religion & Racism" (1997)',
    voice: { name: 'Dr. Frederick K.C. Price', ministry: 'Founder, Crenshaw Christian Center (Los Angeles); the FaithDome', era: '1997 series; b. 1932, d. 2021' },
    bigIdea: 'In 1997 Dr. Frederick K.C. Price — a nationally known Word-of-Faith pastor — turned his platform to name the American Church’s complicity in racism and slavery, plainly and fearlessly, in the series "Race, Religion & Racism." His thesis: "Slavery could never have existed without the consent of the Church," and God favors no race over another.',
    inApp: 'Hear or read the primary source (the series / the books), then bring it to the Word: does Scripture bear out that God favors no people over another, and that the Church is accountable for whom it served?',
    anchor: { ref: 'Acts 10:34-35; Galatians 3:28; James 2:1', theme: 'God is no respecter of persons — in every nation those who fear Him are accepted; there is neither Jew nor Greek, all one in Christ; do not hold the faith with respect of persons. Price’s thesis stands on the Word: God favors no race, and partiality in His house is sin.' },
    sources: [
      { claim: 'Dr. Frederick K.C. Price (founder, Crenshaw Christian Center, Los Angeles) released the 1997 teaching series "Race, Religion & Racism," charging the American Church with siding with evil rather than the Word — "Slavery could never have existed without the consent of the Church."', title: 'Race, Religion & Racism (1997 series; Vol. 1 "A Bold Encounter With Division in the Church"; Vol. 2 "Perverting the Gospel to Subjugate a People")', publisher: 'Dr. Frederick K.C. Price / Crenshaw Christian Center (ISBN 1883798361 / 1883798485)', url: 'https://youtu.be/Nx44eoRK8z8', asOf: '2026-07-04' },
      { claim: 'Biographical: Frederick K.C. Price, founder of Crenshaw Christian Center and the FaithDome, prominent Word-of-Faith teacher, 1932-2021.', title: 'Frederick K. C. Price', publisher: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Frederick_K._C._Price', asOf: '2026-07-04' },
    ],
    levels: {
      child: 'A long time ago a very famous preacher named Dr. Price got up in front of everybody and said a brave, hard truth: that some churches long ago HELPED slavery happen instead of stopping it — and that God does not love one color of people more than another. He loves everyone the same. It was brave to say, and it was true. Your job: say the truth Dr. Price taught — "God favors ___ people the same."',
      senior: 'Dr. Frederick K.C. Price (1932-2021), founder of Crenshaw Christian Center and its FaithDome in Los Angeles, was one of the most prominent Word-of-Faith teachers in America when, in 1997, he devoted a major series — "Race, Religion & Racism" — to the American Church’s complicity in racism and slavery. His central charge, "Slavery could never have existed without the consent of the Church," is not merely provocative; it rests squarely on Scripture. God "is no respecter of persons: but in every nation he that feareth him... is accepted" (Acts 10:34-35); in Christ "there is neither Jew nor Greek... all one" (Galatians 3:28); and to "have the faith of our Lord Jesus Christ... with respect of persons" is named sin (James 2:1). Price’s significance for this study is that he had everything to lose — a large, mixed national audience — and named it anyway. That is the prophetic posture: the truth told at cost, from inside the house.',
    },
    quiz: {
      questions: [
        { q: 'What was Dr. Price’s central charge in "Race, Religion & Racism"?', options: ['The Church was innocent', 'The American Church consented to slavery — "Slavery could never have existed without the consent of the Church" — and God favors no race', 'Race does not exist'], answer: 1, explain: 'His thesis, grounded in Acts 10:34-35 / Galatians 3:28 — God is no respecter of persons; the Church is accountable.' },
        { q: 'What makes Price a "prophetic voice" here?', options: ['He said what was popular', 'He named the truth at cost, from inside a large national platform he could have lost', 'He avoided the topic'], answer: 1, explain: 'The prophetic posture: truth told at cost, from inside the house.' },
      ],
    },
    lesson: 'The first voice in this record is Dr. Frederick K.C. Price. By 1997 he was one of the best-known Word-of-Faith pastors in America — founder of Crenshaw Christian Center and its FaithDome in Los Angeles, a large and racially mixed national audience. He had, in worldly terms, everything to lose by making enemies. And that is exactly the year he turned his platform to a subject most of his peers would not touch: the American Church’s own complicity in racism and slavery. The series was called "Race, Religion & Racism," and its charge was blunt — the American Church "sided with evil rather than the Word of God," and "Slavery could never have existed without the consent of the Church." That is not reckless rhetoric; it is a claim that rests on the plainest teaching of Scripture. Peter learned it by vision and said it aloud: "God is no respecter of persons: but in every nation he that feareth him, and worketh righteousness, is accepted with him" (Acts 10:34-35). Paul said the wall is down: "there is neither Jew nor Greek... for ye are all one in Christ Jesus" (Galatians 3:28). And James named partiality in the assembly as sin outright: do not hold "the faith of our Lord Jesus Christ... with respect of persons" (James 2:1). If God favors no race, then a Church that blessed the subjugation of a race betrayed its own Lord — which is precisely Price’s point. He is placed first in this study because he models the prophetic posture the whole record is about: the truth told plainly, from inside the house, at cost. Hear the primary source, and weigh it by the Word.',
    facilitator: {
      talkingPoints: [
        'Dr. Frederick K.C. Price (1932-2021), Crenshaw Christian Center / FaithDome, LA — a major national platform.',
        '1997 "Race, Religion & Racism": the American Church sided with evil over the Word — "Slavery could never have existed without the consent of the Church."',
        'Grounded in Scripture: God is no respecter of persons (Acts 10:34-35); one in Christ (Galatians 3:28); partiality is sin (James 2:1).',
        'The prophetic posture: truth at cost, from inside the house — he had a mixed national audience to lose, and spoke anyway.',
      ],
      howToRun: 'Prayer + the anchor (5): pray; read Acts 10:34-35. | Who this voice is (10): Price’s platform and why the 1997 series was costly. | Hear the primary source (25): watch/read a segment of the series. | Weigh it by the Word (20): test the thesis against Acts 10 / Galatians 3 / James 2. | Discussion (15): what does it mean that a Church can betray its own Lord by partiality?',
      discussionPrompts: [
        'Why did it cost Price something to say this, and why say it anyway?',
        'How do Acts 10:34-35 and James 2:1 ground his charge?',
        'What is our responsibility now that we have heard it?',
      ],
    },
  },
  {
    id: 'pv-darby',
    title: 'Pastor Stephen Darby — identity, the Church’s account, and the unseen realm',
    voice: { name: 'Pastor Stephen Darby', ministry: 'Stephen Darby Ministries / Destined Ministries (Louisville, KY; est. 2003)', era: 'b. — , d. early 2021; ~346K-subscriber teaching archive, 611+ messages' },
    bigIdea: 'Pastor Stephen Darby taught boldly across subjects most pulpits avoided: Black identity in Scripture and America’s account (Who Are We?, Negroland, They Jacked Us, The Black Gatekeepers, The False Christianity Movement), the church itself (Zion vs Rome), and the unseen / multidimensional realm (The Christ Frequency, CERN, Return of the Nephilim). He named hard things and drew backlash — the reason, Darrell notes, his voice was overlooked while the mainstream later heard others.',
    inApp: 'Hear the primary source on the Stephen Darby Ministries channel, then weigh each teaching by the Word (the Test) — this study holds the record of the voice; it does not endorse every teaching. Bring discernment, not blank acceptance or blanket dismissal.',
    anchor: { ref: 'Acts 7:51-53; Matthew 13:57; Amos 7:10-13', theme: 'Stephen named his nation’s and its leaders’ sins to their faces and was killed for it; a prophet is not without honour save in his own country; Amaziah told Amos to flee and stop prophesying against the land. The one who names a people’s sin draws backlash and is sent away — which is why the record must be kept.' },
    sources: [
      { claim: 'Stephen Darby Ministries (Destined Ministries), founded 2003 in Louisville, KY; Pastor Stephen Darby taught racial identity in Scripture, church history/structure ("Zion vs Rome"), and the unseen realm; he passed away in early 2021.', title: 'Stephen Darby Ministries — official ministry', publisher: 'stephendarbyministries.com', url: 'https://www.stephendarbyministries.com/', asOf: '2026-07-04' },
      { claim: 'The Stephen Darby Ministries YouTube channel (@sldskd88) hosts ~346K subscribers and 611+ archived messages, including "Zion vs Rome," "Who Are We?," "Negroland," "They Jacked Us," "The Black Gatekeepers," "The False Christianity Movement," "The Christ Frequency," "CERN: The End," and "Return of the Nephilim."', title: 'Stephen Darby Ministries (@sldskd88) — teaching archive', publisher: 'YouTube (channel provided by Darrell; verified by channel page)', url: 'https://youtube.com/@sldskd88', asOf: '2026-07-04' },
    ],
    honestNote: 'Verified: Darby’s ministry, its founding and location, his death (early 2021), and his teaching titles/themes (via the ministry site and the channel page). NOT independently verified and carried as Darrell’s framing: the comparison that he "said what Michael Kaiser said ~15 years before," and the characterization that the evangelical/African-American church overlooked him specifically for naming America’s sins / fear of backlash. Some of Darby’s subjects (frequencies, CERN, Nephilim) are esoteric — presented here as his topics for the learner to weigh with discernment (the Test), not endorsed.',
    levels: {
      child: 'Pastor Stephen Darby was a bold teacher who talked about brave, hard things a lot of preachers were scared to say — about who God’s people really are in the Bible, about ways America hurt Black people, and about the unseen spirit world. Because he said hard truths, some people did not like it, so many did not listen to him — even though lots of people did (his lessons have been watched millions of times). We can listen to what he taught and always check it against God’s Word. Your job: name one reason a truth-teller sometimes gets ignored.',
      senior: 'Pastor Stephen Darby (Stephen Darby Ministries / Destined Ministries, Louisville, founded 2003; d. early 2021) built a large teaching archive — around 346,000 subscribers and more than 600 messages — precisely by going where most pulpits would not. His subjects cluster in three streams. First, IDENTITY and the nation’s account: "Who Are We?," "Negroland," "They Jacked Us," "The Black Gatekeepers" — Black identity in Scripture and how America treated a people. Second, the CHURCH itself: "Zion vs Rome" (the modern church as "Roman"/institutional versus "Zion"/Hebraic and Spirit-led) and "The False Christianity Movement" — a critique that rhymes with Price’s charge that the Church served the wrong master. Third, the UNSEEN / MULTIDIMENSIONAL realm — "The Christ Frequency," "CERN: The End," "Return of the Nephilim" — the space Darrell notes is "also Darby’s space," and which connects to the dimensional framing the platform already uses (the 3rd/4th-dimension witness). This study keeps two disciplines. Verification: his ministry, dates, and teaching titles are sourced; the comparison to other teachers heard "15 years later," and the claim that he was overlooked specifically for fear of backlash, are carried as Darrell’s framing, not asserted fact. And discernment: some subjects are esoteric and contested, so the study holds the RECORD of the voice and sends the learner to the primary source to weigh by the Word (the Test) — neither swallowing everything nor dismissing the man. The prophetic frame is Acts 7: Stephen, whose name Darby bears, recited his nation’s history and named its leaders’ sin to their faces — "ye do always resist the Holy Ghost" — and they killed him for it. The one who names the sin is resisted, sent away (Amos 7), left without honour at home (Matthew 13:57). That is why the record is kept.',
    },
    quiz: {
      questions: [
        { q: 'What are the three streams of Darby’s teaching named here?', options: ['Only prosperity', 'Identity & the nation’s account; the Church itself; and the unseen/multidimensional realm', 'Only music'], answer: 1, explain: 'Who Are We?/Negroland (identity), Zion vs Rome/False Christianity (the Church), Christ Frequency/CERN/Nephilim (the unseen).' },
        { q: 'How does this study ask us to receive a voice like Darby?', options: ['Swallow every teaching without question', 'Keep the record and WEIGH each teaching by the Word (the Test) — neither blank acceptance nor blanket dismissal', 'Dismiss him entirely'], answer: 1, explain: 'Hold the voice, cite the work, test it by Scripture — discernment, not extremes.' },
        { q: 'What is the prophetic pattern behind his being overlooked?', options: ['Prophets are always celebrated at home', 'The one who names a people’s sin draws backlash and is sent away — Stephen (Acts 7), Amos (Amos 7), "no honour in his own country" (Matthew 13:57)', 'It had no biblical parallel'], answer: 1, explain: 'Naming a nation’s sin has always cost the messenger — which is why the record must be kept.' },
      ],
    },
    lesson: 'The second voice in this record is Pastor Stephen Darby, and there is a fitting providence in the name, because Stephen in the book of Acts is the one who stood before his nation’s leaders, recited their own history, named their sin to their faces — "ye do always resist the Holy Ghost... which of the prophets have not your fathers persecuted?" — and was stoned to death for it (Acts 7:51-53). That is the pattern this whole study is about, and Pastor Darby fits it. From Louisville, Kentucky, through Stephen Darby Ministries (Destined Ministries), founded in 2003, he built one of the larger Black teaching archives online — around 346,000 subscribers and more than six hundred messages — by teaching precisely the subjects most pulpits avoid. His work runs in three streams. The first is identity and the nation’s account: messages like "Who Are We?," "Negroland," "They Jacked Us," and "The Black Gatekeepers" deal with Black identity in Scripture and how America treated a people. The second is the Church itself: "Zion vs Rome" argues that much of the modern church is more "Roman" — institutional, controlled — than "Zion," Hebraic and Spirit-led, and "The False Christianity Movement" sharpens the point — a critique that rhymes directly with Dr. Price’s charge that the Church served the wrong master. The third stream is the unseen, multidimensional realm — "The Christ Frequency," "CERN: The End," "Return of the Nephilim" — which Darrell notes is "also Darby’s space," and which connects to the dimensional framing this platform already uses in its 3rd- and 4th-dimension witness. Two disciplines govern how we hold him. The first is verification: his ministry, his dates, and his teaching titles are sourced and real, but the comparison that he said what other teachers were praised for "fifteen years later," and the claim that he was overlooked specifically out of fear of backlash, are carried honestly as Darrell’s framing — a reasonable read of the pattern, not something we assert as proven. The second is discernment: some of Darby’s subjects are esoteric and genuinely contested, so this study does NOT endorse every teaching. It keeps the record of the voice and sends you to the primary source to weigh each message by the Word — the same Test the whole platform runs — neither swallowing everything nor dismissing the man who said hard, true things at cost. Because the one who names a people’s sin has always been resisted and sent away — Stephen killed, Amos told to flee (Amos 7:10-13), the prophet left "without honour... in his own country" (Matthew 13:57) — and that is exactly why the record must be kept.',
    facilitator: {
      talkingPoints: [
        'Stephen Darby Ministries / Destined Ministries (Louisville, est. 2003; d. early 2021) — ~346K subscribers, 611+ messages.',
        'Three streams: identity + the nation’s account (Who Are We?, Negroland, They Jacked Us, Black Gatekeepers); the Church (Zion vs Rome, The False Christianity Movement); the unseen/multidimensional realm (Christ Frequency, CERN, Nephilim — "also Darby’s space").',
        'Verified: ministry, dates, titles. Darrell’s framing (not asserted): the "15 years earlier / overlooked for backlash" comparison. Esoteric topics = presented for discernment, not endorsed.',
        'Receive by the Test: keep the record, weigh each teaching by the Word — neither blank acceptance nor blanket dismissal.',
        'Prophetic frame: Stephen (Acts 7), Amos (Amos 7), "no honour in his own country" (Matthew 13:57) — naming a nation’s sin costs the messenger.',
      ],
      howToRun: 'Prayer + the anchor (5): pray; read Acts 7:51-53. | Who this voice is (10): Darby’s ministry and his three teaching streams. | Hear the primary source (25): watch a message from the channel. | Weigh it by the Word (20): run the Test — what holds, what to leave, what to study further. | Discussion (15): why is discernment (not extremes) the right way to receive a bold voice?',
      discussionPrompts: [
        'Why does naming a nation’s sin so often cost the messenger their honour at home?',
        'How do we keep the record of a voice without endorsing everything he taught?',
        'Where does Darby’s critique of the Church rhyme with Dr. Price’s?',
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // THE SCIENTISTS WHO WEREN'T HEARD (Darrell 2026-07-04: "Add these as
  // scientists who also wasn't heard"). The Nile Valley scholars whose evidence
  // was marginalized by a Eurocentric mainstream that, as the archive image
  // frames it, altered and hid the record — "the 4th Beast's work" (Daniel 7).
  // Same disciplines as the preachers above: cite the scholar and the work,
  // hold the record, and WEIGH the specifics with discernment (some of the
  // data they marshaled is genuinely debated; the honestNote labels it). Yahweh
  // is the Light of Truth at the center of the record (Psalm 43:3).
  // ---------------------------------------------------------------------------
  {
    id: 'pv-diop',
    title: 'Dr. Cheikh Anta Diop — the scientist who put Kemet back in Africa',
    voice: { name: 'Dr. Cheikh Anta Diop', ministry: 'Senegalese physicist, historian, egyptologist; founder of the radiocarbon-dating lab at IFAN, Dakar', era: '1923-1986; the 1974 UNESCO Cairo Symposium' },
    bigIdea: 'Dr. Cheikh Anta Diop — trained in physics and chemistry in Paris — brought SCIENTIFIC methods to a question the Eurocentric mainstream had answered by assumption: was ancient Kemet (Egypt) a Black African civilization, continuous with the rest of Africa? At the 1974 UNESCO Cairo Symposium, he and Théophile Obenga stood almost alone defending the African thesis with evidence — and were largely marginalized for it.',
    inApp: 'Hear/read the primary source (Diop’s "The African Origin of Civilization"), then weigh it: which parts are documented method, which are his argued conclusions, and what does the Word say about a record that was altered coming to light?',
    anchor: { ref: 'Daniel 7:25; Luke 8:17; Psalm 43:3', theme: 'The fourth beast would "think to change times and laws"; nothing is secret that shall not be made manifest; O send out Thy light and Thy truth. Records were altered and hidden, but the truth is brought to light — and Yahweh is the Light of Truth the scholarship serves.' },
    sources: [
      { claim: 'Cheikh Anta Diop (1923-1986), Senegalese polymath trained in physics/chemistry in Paris, argued ancient Egypt was a Black African civilization with deep continuity to sub-Saharan Africa; at the 1974 UNESCO Cairo Symposium only Diop and Théophile Obenga held this view against the other participants.', title: 'Cheikh Anta Diop', publisher: 'Wikipedia (and the UNESCO General History of Africa, Vol. II)', url: 'https://en.wikipedia.org/wiki/Cheikh_Anta_Diop', asOf: '2026-07-04' },
    ],
    honestNote: 'Verified: Diop’s identity, training, the African-origin thesis, and the 1974 Cairo Symposium record. His methods (osteological measurement, a melanin-dosage test on mummy skin, population-continuity mapping) are documented as HIS methods; several specific conclusions (exact cranial figures, melanin-as-adaptation claims) are genuinely debated in the field. This study cites the scholar and holds the record; it does not present every contested data point as settled science — weigh it (the Test).',
    levels: {
      child: 'A long time ago, most schoolbooks said the great pyramid-builders of Egypt were not African — but they never really checked. A brilliant scientist named Dr. Diop, from Senegal, DID check, using real science. He said, "Let’s look at the evidence." He argued Egypt was a Black African civilization, part of the rest of Africa. Powerful people did not want to hear it, so they mostly ignored him. But checking the truth is good and brave. Your job: say what Dr. Diop wanted everyone to do with the evidence — "look and ___."',
      senior: 'Cheikh Anta Diop (1923-1986) was a rare thing: a scientist equally at home in a Paris physics lab and in African history, who insisted the question of Kemet’s identity be settled by EVIDENCE rather than assumption. He built West Africa’s first radiocarbon-dating laboratory in Dakar and brought osteology, a melanin-dosage test on mummy samples, and linguistic and cultural continuity mapping to bear on his thesis: ancient Egypt was a Black African civilization, and the Nile Valley is to Africa what Greece is to Europe — a source, not a foreign island. At the 1974 UNESCO Symposium in Cairo on "The Peopling of Ancient Egypt," he and Théophile Obenga were essentially the only two defending the African thesis, and the field largely closed ranks against them. Two disciplines govern how we hold him. Verification: his identity, methods, and the Symposium record are documented; several specific conclusions are debated, and we say so. And the biblical frame the archive names: the fourth beast would "think to change times and laws" (Daniel 7:25) — power rewrites the record — but "nothing is secret, that shall not be made manifest" (Luke 8:17), because Yahweh is the One who sends out His light and His truth (Psalm 43:3). Diop is here as a scientist who was not heard — and whose central claim, that Africa’s own record is foundational and not inferior, keeps coming back to light.',
    },
    quiz: {
      questions: [
        { q: 'What did Diop bring to the question of Kemet’s identity that the mainstream had not?', options: ['Only opinion', 'Scientific method and evidence (radiocarbon lab, osteology, continuity mapping) instead of assumption', 'Nothing new'], answer: 1, explain: 'A physicist by training, he insisted the question be settled by evidence — and was marginalized for it.' },
        { q: 'How does this study hold Diop’s specific data claims?', options: ['As settled science, all of it', 'Cite the scholar and the record; weigh the contested specifics with discernment (the Test)', 'Dismiss him entirely'], answer: 1, explain: 'Verified core + honest note on debated specifics — neither swallow nor dismiss.' },
      ],
    },
    lesson: 'The first scientist in this record is Dr. Cheikh Anta Diop, and his significance is that he refused to let a huge historical question be decided by assumption when it could be tested. Born in Senegal in 1923, trained in physics and chemistry in Paris, he built West Africa’s first radiocarbon-dating laboratory in Dakar and turned the tools of science on a claim the Eurocentric mainstream had simply presumed: that ancient Egypt — Kemet — was somehow not really African. Diop marshaled osteological measurement, a melanin-dosage test he ran on samples of mummy skin, and painstaking mapping of linguistic and cultural continuity to argue the opposite — that Kemet was a Black African civilization, and that "ancient Egypt is to Africa and African peoples as Greece is to Europe and European people": a source, not a foreign island. In 1974, at the UNESCO Symposium in Cairo on the peopling of ancient Egypt, he and the linguist Théophile Obenga stood almost entirely alone defending that thesis before a room that largely closed against them. We hold him with two disciplines. First, verification: his identity, his methods, and the Symposium record are documented facts, while several of his specific conclusions — exact cranial figures, particular claims about melanin — are genuinely debated in the field, and we say so plainly rather than dress an argument as a proof. Second, the frame the archive image itself names from Scripture: Daniel saw a fourth beast that would "think to change times and laws" (Daniel 7:25) — the very picture of a power rewriting and hiding the record — and against it stands the promise that "nothing is secret, that shall not be made manifest; neither any thing hid, that shall not be known" (Luke 8:17), because the Source of the record is the One to whom the psalmist prays, "O send out thy light and thy truth" (Psalm 43:3). Diop belongs in this study as a scientist who was not heard — and whose core insistence, that the African record is foundational and welcomes scrutiny rather than fearing it, keeps returning to the light.',
    facilitator: {
      talkingPoints: [
        'Diop (1923-1986): physicist/historian; built West Africa’s first radiocarbon lab; brought SCIENCE to the question of Kemet’s identity.',
        'Thesis: Kemet was a Black African civilization, continuous with Africa — "Egypt is to Africa as Greece is to Europe."',
        '1974 UNESCO Cairo Symposium: he and Obenga defended it almost alone and were marginalized.',
        'Verified core + honest note: specific data (cranial figures, melanin claims) is debated — cite the scholar, weigh the specifics (the Test).',
        'Frame: Daniel 7:25 (the beast changes the record) vs Luke 8:17 (nothing hidden stays hidden); Yahweh the Light of Truth (Psalm 43:3).',
      ],
      howToRun: 'Prayer + the anchor (5): pray; read Daniel 7:25 and Psalm 43:3. | Who this voice is (10): Diop the scientist, and the Cairo Symposium. | Hear the primary source (25): a segment of "The African Origin of Civilization." | Weigh it by the Word (20): separate documented method from argued conclusion; apply the Test. | Discussion (15): why does a record that was altered still come to light?',
      discussionPrompts: [
        'Why does it matter that Diop used science, not just argument?',
        'How do we honor a scholar’s courage while weighing his contested claims?',
        'What does Daniel 7:25 vs Luke 8:17 say about suppressed truth?',
      ],
    },
  },
  {
    id: 'pv-obenga',
    title: 'Dr. Théophile Obenga — the tongue that carried the truth',
    voice: { name: 'Dr. Théophile Obenga', ministry: 'Congolese linguist, egyptologist, historian; co-defender of the African-origin thesis', era: 'b. 1936; the 1974 UNESCO Cairo Symposium; longtime professor (incl. San Francisco State)' },
    bigIdea: 'Dr. Théophile Obenga carried Diop’s work into LANGUAGE, arguing a deep genetic kinship between ancient Egyptian and the languages of Africa — that the tongue itself preserves the continuity the record-keepers tried to sever. He was the second scholar standing with Diop at Cairo in 1974, and like Diop was largely unheard by the mainstream.',
    inApp: 'Hear/read Obenga’s linguistic work; weigh the method (systematic sound-and-meaning correspondences) against the caution that historical linguistics is contested terrain — and consider what Scripture says about the endurance of truth in the word.',
    anchor: { ref: 'Proverbs 12:19; Psalm 43:3; Luke 8:17', theme: 'The lip of truth shall be established for ever, but a lying tongue is but for a moment; O send out Thy light and Thy truth; nothing hid shall not be known. Truth carried in the tongue endures; the lie is momentary — and Yahweh sends out the light of truth.' },
    sources: [
      { claim: 'Théophile Obenga (b. 1936), Congolese linguist and egyptologist, argued a genetic/typological kinship between ancient Egyptian and Black African languages ("Negro-Egyptian"), and with Cheikh Anta Diop defended the African-origin thesis at the 1974 UNESCO Cairo Symposium.', title: 'Théophile Obenga / Conceptions of History: Cheikh Anta Diop and Theophile Obenga', publisher: 'Gale Literature Resource Center; UNESCO Cairo Symposium record', url: 'https://en.wikipedia.org/wiki/Th%C3%A9ophile_Obenga', asOf: '2026-07-04' },
    ],
    honestNote: 'Verified: Obenga’s identity, his linguistic-continuity project with Diop, and their stand at the 1974 Cairo Symposium. His "Negro-Egyptian" language-family proposal is a serious scholarly argument that remains contested within mainstream historical linguistics — cited here as his method and claim, held with discernment, not presented as settled consensus.',
    levels: {
      child: 'Dr. Obenga was a language detective. He looked at the very old Egyptian language and the languages of Africa and found they matched in deep ways — like family members who share the same last name. That was his way of showing Egypt belonged to Africa. He stood next to Dr. Diop when almost no one else would. Your job: what did Dr. Obenga study to find the family connection — the ___ (what people speak)?',
      senior: 'Théophile Obenga (b. 1936), a Congolese scholar of language and history, took the continuity thesis into linguistics — arguing that ancient Egyptian is genetically related to the languages of Black Africa (a grouping he called "Negro-Egyptian"), demonstrated through systematic correspondences of sound, symbol, and meaning across words like KMT (the black land → Kemet), NTR (divine being → Neter), and MAA (truth/justice → Maa), and through the evolution of script. His point was that the TONGUE preserves a kinship that record-alterers could not fully erase — you can rewrite a chronology on a wall, but the deep structure of a living language testifies against you. With Diop, he was one of only two defending this at the 1974 Cairo Symposium, and like Diop he was largely unheard. Held with discernment: his "Negro-Egyptian" proposal is a real, serious argument that remains contested in mainstream historical linguistics; we cite it as his method and claim, not as settled consensus. The biblical frame fits the tool: "the lip of truth shall be established for ever: but a lying tongue is but for a moment" (Proverbs 12:19). Truth carried in the tongue endures; the imposed lie is momentary — and the Source of that enduring truth is the God to whom we say, "send out thy light and thy truth" (Psalm 43:3).',
    },
    quiz: {
      questions: [
        { q: 'What field did Obenga use to defend the continuity thesis?', options: ['Astronomy', 'Linguistics — systematic kinship between ancient Egyptian and African languages', 'Chemistry'], answer: 1, explain: 'He argued a "Negro-Egyptian" language relationship — the tongue preserves the continuity.' },
        { q: 'How is his "Negro-Egyptian" proposal held here?', options: ['As settled consensus', 'As a serious, contested scholarly argument — cited as his method, weighed with discernment', 'As nonsense'], answer: 1, explain: 'Real argument, genuinely debated; cite and weigh (the Test).' },
      ],
    },
    lesson: 'The second scientist who was not heard is Dr. Théophile Obenga, and his instrument was language. Born in the Congo in 1936, a scholar of linguistics, egyptology, and history, Obenga took Diop’s continuity thesis into the deep structure of the tongue itself. His argument was that ancient Egyptian is genetically kin to the languages of Black Africa — a family he named "Negro-Egyptian" — and he tried to show it not by slogans but by systematic correspondences of sound, symbol, and meaning: KMT, the black land, becoming Kemet; NTR, a divine being, becoming Neter; MAA, truth and justice, carried across the centuries; and the visible evolution of the script from hieroglyph to hieratic to demotic and beyond. His deeper point was profound: a ruler can chisel a false chronology onto a wall, but the living architecture of a language testifies against the forger, because you cannot easily fake the deep kinship of tongues. Standing beside Diop, Obenga was the second of only two scholars defending this thesis at the 1974 UNESCO Symposium in Cairo, and like Diop he was largely shut out. We hold him with the same discernment: his "Negro-Egyptian" proposal is a serious, argued position that remains genuinely contested within mainstream historical linguistics, and we present it as his method and claim rather than as settled consensus. Yet the tool itself preaches, for Scripture says "the lip of truth shall be established for ever: but a lying tongue is but for a moment" (Proverbs 12:19). The imposed lie is momentary; the truth carried in the tongue endures — and its Source is the God to whom the psalmist cries, "O send out thy light and thy truth: let them lead me" (Psalm 43:3). Obenga is here because the truth he pursued in the word is the kind that outlasts the ones who tried to bury it.',
    facilitator: {
      talkingPoints: [
        'Obenga (b. 1936): Congolese linguist; carried the continuity thesis into LANGUAGE ("Negro-Egyptian" kinship).',
        'Method: systematic sound/symbol/meaning correspondences (KMT→Kemet, NTR→Neter, MAA→Maa) + script evolution.',
        'The point: the deep structure of a living tongue testifies against a forged record.',
        'Second of two defending the thesis at Cairo 1974; largely unheard. His proposal is contested — cite + weigh (the Test).',
        'Frame: Proverbs 12:19 — the lip of truth is established for ever, the lie is momentary; Psalm 43:3 — send out Thy light and truth.',
      ],
      howToRun: 'Prayer + the anchor (5): pray; read Proverbs 12:19. | Who this voice is (10): Obenga and the linguistic project. | Hear the primary source (25): a segment of his linguistic teaching. | Weigh it by the Word (20): method vs contested consensus; the Test. | Discussion (15): how does language outlast a forged record?',
      discussionPrompts: [
        'Why is a living language hard to falsify — and what does that testify to?',
        'How do we cite a contested scholarly claim honestly?',
        'What does "the lip of truth established for ever" mean for suppressed history?',
      ],
    },
  },
  {
    id: 'pv-williams',
    title: 'Dr. Chancellor Williams — the destruction, and the knowledge to rebuild',
    voice: { name: 'Dr. Chancellor Williams', ministry: 'American sociologist and historian; Howard University; author of "The Destruction of Black Civilization"', era: '1893-1992; magnum opus published 1971/1974 after 16 years of research' },
    bigIdea: 'Dr. Chancellor Williams spent sixteen years researching across Africa to write "The Destruction of Black Civilization," shifting the story from what Europeans and others did IN Africa to the Africans themselves — and naming a hard internal lesson alongside the external one: disunity and division were as destructive as invasion. Unity is strength; division is vulnerability.',
    inApp: 'Read "The Destruction of Black Civilization"; weigh both halves of his thesis — external disruption AND internal division — against the Word’s teaching that a people perish for lack of knowledge and a house divided cannot stand.',
    anchor: { ref: 'Hosea 4:6; Mark 3:25; Proverbs 23:23', theme: 'My people are destroyed for lack of knowledge; a house divided against itself cannot stand; buy the truth, and sell it not. Destruction came through lost knowledge and division — so recover the knowledge, refuse the division, and pay any price for the truth.' },
    sources: [
      { claim: 'Chancellor Williams (1893-1992), American sociologist and historian at Howard University, wrote "The Destruction of Black Civilization: Great Issues of a Race from 4500 B.C. to 2000 A.D." (1971/1974) after ~16 years of research, refocusing African history on Africans themselves and analyzing both external disruption and internal disunity.', title: 'The Destruction of Black Civilization / Chancellor Williams', publisher: 'Third World Press; Wikipedia', url: 'https://en.wikipedia.org/wiki/Chancellor_Williams', asOf: '2026-07-04' },
    ],
    levels: {
      child: 'Dr. Williams was a historian who spent SIXTEEN years studying to write a big book about the rise and fall of great African civilizations. He taught two hard truths: enemies from outside hurt them, but fighting among themselves hurt them too. His lesson: when people stick together they are STRONG, and when they split apart they get weak. Your job: finish his rule — "Unity is strength, division is ___."',
      senior: 'Chancellor Williams (1893-1992), a sociologist and historian at Howard University, gave sixteen years of research and travel across Africa to "The Destruction of Black Civilization" (1971), and its method was itself a correction: he shifted the focus from what Arabs and Europeans did in Africa to the Africans themselves — "a history of blacks that is a history of blacks." His analysis carried two edges, and the honesty of the second is what makes him prophetic rather than merely aggrieved. The first edge is external: invasion and disruption. The second, harder edge is internal: DISUNITY — the fragmentation that made a people vulnerable and that no external enemy could have exploited had it not been there. His law is blunt: unity is strength, division is vulnerability. That is not a grievance; it is a mirror, and it lands on the Body of Christ as squarely as on any nation. Scripture says it three ways at once: "my people are destroyed for lack of knowledge" (Hosea 4:6) — recover the knowledge; "if a house be divided against itself, that house cannot stand" (Mark 3:25) — refuse the division; and "buy the truth, and sell it not" (Proverbs 23:23) — pay any price for the record and never trade it away. Williams is here as a scholar who was largely unheard by the mainstream, and whose double lesson — external destruction AND internal division — is exactly the knowledge a people needs to rebuild.',
    },
    quiz: {
      questions: [
        { q: 'What TWO causes of destruction did Williams name?', options: ['Only outside enemies', 'External disruption/invasion AND internal disunity/division', 'Only bad weather'], answer: 1, explain: 'His prophetic honesty: the internal division, not only the external enemy. Unity strength; division vulnerability.' },
        { q: 'Which Scriptures frame his double lesson?', options: ['None', 'Hosea 4:6 (destroyed for lack of knowledge) + Mark 3:25 (a house divided cannot stand)', 'Only genealogies'], answer: 1, explain: 'Recover the knowledge; refuse the division; buy the truth (Proverbs 23:23).' },
      ],
    },
    lesson: 'The third scientist who was not heard is Dr. Chancellor Williams, and his gift to this study is a hard, healing honesty. A sociologist and historian at Howard University, born in 1893, Williams poured sixteen years of research and travel across Africa into "The Destruction of Black Civilization," published in 1971. Its method was already a correction: instead of telling African history as the story of what Arabs and Europeans did in Africa, he told it as the story of the Africans themselves — in his words, "a history of blacks that is a history of blacks." But the reason he belongs among the prophetic voices, and not merely the aggrieved ones, is the second edge of his analysis. Williams named two causes of destruction, and he refused to hide the harder one. The first was external: invasion, disruption, the enemy at the gate. The second was internal: disunity — the fragmentation that made a people vulnerable, that no outside power could have exploited if it had not already been there. His law is stated plainly on the archive itself: unity is strength, division is vulnerability. That is not a complaint aimed outward; it is a mirror held up to a people — and it convicts the Body of Christ as directly as any nation, for we are the ones told we are one body with many members. Scripture says his lesson three ways in one breath: "my people are destroyed for lack of knowledge" (Hosea 4:6) — so recover the knowledge that was hidden; "if a house be divided against itself, that house cannot stand" (Mark 3:25) — so refuse the division that destroys from within; and "buy the truth, and sell it not" (Proverbs 23:23) — so pay whatever it costs for the true record, and never trade it away for comfort. Williams was largely unheard by the mainstream in his lifetime, but the double knowledge he recovered — that destruction comes from without AND from within — is precisely the knowledge a people needs if it means to rebuild and not simply to mourn.',
    facilitator: {
      talkingPoints: [
        'Williams (1893-1992): Howard University historian; 16 years of research → "The Destruction of Black Civilization" (1971).',
        'Method correction: African history centered on Africans themselves — "a history of blacks that is a history of blacks."',
        'Two causes of destruction — external invasion AND internal DISUNITY. Unity strength; division vulnerability. A mirror, not only a grievance.',
        'Frame: Hosea 4:6 (destroyed for lack of knowledge) + Mark 3:25 (a house divided cannot stand) + Proverbs 23:23 (buy the truth, sell it not).',
        'Convicts the Body directly (one body, many members) — the knowledge needed to rebuild, not just to mourn.',
      ],
      howToRun: 'Prayer + the anchor (5): pray; read Hosea 4:6 and Mark 3:25. | Who this voice is (10): Williams and his 16-year work. | Hear/read the primary source (25): a portion of "The Destruction of Black Civilization." | Weigh it by the Word (20): both edges — external and internal — and what rebuilding requires. | Discussion (15): where does the "division is vulnerability" mirror land on us?',
      discussionPrompts: [
        'Why is naming the internal division (not only the external enemy) the mark of a true prophet?',
        'How does "a house divided cannot stand" apply to the Body of Christ today?',
        'What knowledge must be recovered for a people to rebuild rather than mourn?',
      ],
    },
  },
];

// ---------------------------------------------------------------------------
// Helpers — thin wrappers over the GENERIC, tested helpers in church-classes.js.
// ---------------------------------------------------------------------------
import {
  buildScheduleFor, progressSummaryFor, exportCurriculumMarkdownFor, resolveCohortGeneric,
} from './church-classes.js';

export const PV_INTEREST_TAG = '[Prophetic Voices study interest]';

export function resolvePvCohort(localCohort = null) {
  return resolveCohortGeneric(localCohort, PV_CONFIRMED_COHORT, PV_PROPOSED_COHORT_START);
}
export function buildPvSchedule(startISO) {
  return buildScheduleFor(PV_MODULES, startISO, PV_META.cadenceDays);
}
export function pvProgressSummary(progress = {}) {
  return progressSummaryFor(PV_MODULES, progress);
}
export function exportPvCurriculumMarkdown(startISO = null) {
  return exportCurriculumMarkdownFor(
    { meta: PV_META, sessionFlow: PV_SESSION_FLOW, modules: PV_MODULES },
    startISO,
  );
}

// Every documented source across the study, flattened (DR-0076 verification).
export function pvSources() {
  return PV_MODULES.flatMap((m) => (m.sources || []).map((s) => ({ moduleId: m.id, ...s })));
}
