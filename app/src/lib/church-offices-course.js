// =============================================================================
// church-offices-course — "The Functions of the House: every office, from the Word"
// =============================================================================
// Darrell 2026-07-23 (spoken directive): "a course where we are understanding
// the functions and the levels in the church for the titles like deacons,
// elders... why they are, who they are, where their names came from exactly,
// where they are in the bible, how many times they've said it in the bible,
// all those qualitative and quantitative analysis of each function so we can
// know how to put together what we're gonna do now in our world as inside
// these functions."
//
// THE METHOD (DR-0076 / DR-0098 / DR-0100):
//   · QUANTITATIVE: every "how many times" below is MEASURED from the whole
//     KJV corpus this app hosts (app/public/bible/kjv — fetched verbatim),
//     word-boundary counts including plurals and KJV variants. The test
//     RE-MEASURES from the corpus and fails if these numbers ever drift from
//     the text (church-offices-course.test.js) — counted, never remembered.
//   · QUALITATIVE: the Word explains the Word — each office is taught from
//     Scripture's own usage (references + themes; verse text is read in the
//     app's own Bible, never quoted here from memory). Where the text is
//     silent or a name is not used, the course says so plainly.
//   · Name origins are stated as standard linguistic fact (the Greek terms
//     behind the KJV English), named as such — not doctrine, not invented.

import { progressSummaryFor, exportCurriculumMarkdownFor } from './church-classes.js';

// MEASURED from the in-app KJV corpus 2026-07-23 (whole-word, incl. plurals +
// KJV variants noted). The integrity test re-counts these from the corpus.
export const OFFICE_COUNTS = Object.freeze({
  deacon:     { pattern: 'deacons?',                total: 5,   nt: 5,   variants: 'deacon, deacons' },
  elder:      { pattern: 'elders?',                 total: 199, nt: 69,  variants: 'elder, elders' },
  bishop:     { pattern: 'bishops?|bishoprick',     total: 6,   nt: 6,   variants: 'bishop, bishops, bishoprick' },
  overseer:   { pattern: 'overseers?|oversight',    total: 24,  nt: 2,   variants: 'overseer, overseers, oversight' },
  pastor:     { pattern: 'pastors?',                total: 9,   nt: 1,   variants: 'pastor, pastors' },
  shepherd:   { pattern: 'shepherds?',              total: 83,  nt: 18,  variants: 'shepherd, shepherds' },
  apostle:    { pattern: 'apostles?|apostleship',   total: 83,  nt: 83,  variants: 'apostle, apostles, apostleship' },
  prophet:    { pattern: 'prophets?|prophetess',    total: 490, nt: 163, variants: 'prophet, prophets, prophetess' },
  evangelist: { pattern: 'evangelists?',            total: 3,   nt: 3,   variants: 'evangelist, evangelists' },
  saint:      { pattern: 'saints?',                 total: 101, nt: 62,  variants: 'saint, saints' },
});

const counted = (k) => {
  const c = OFFICE_COUNTS[k];
  return `${c.total} times in the whole KJV (${c.nt} in the New Testament; counting ${c.variants})`;
};

export const CHURCH_OFFICES_META = {
  key: 'church-offices',
  title: 'The Functions of the House: every office, from the Word',
  audience: 'Church of the Living God leaders, staff, and every member who wants to know what the titles really mean',
  tagline: 'Deacon, elder, bishop, pastor, apostle, prophet, evangelist — who they are, where each name comes from, every place the Word uses it (counted from the text, not from memory), and how the functions shape what we build now.',
  cadenceDays: 7,
  weeks: 7, // keep in step with CHURCH_OFFICES_MODULES.length (asserted in the test)
  handsOnLabel: 'Open the Word',
  unit: {
    noun: 'lesson', nounPlural: 'lessons', cap: 'Lesson', selfPaced: true,
    sessionLabel: 'How to study it (alone, or as a leadership group)',
    countNoun: 'lesson',
  },
  footer: '_Every count in this course is MEASURED from the complete KJV this app hosts — the numbers are re-verified against the text by the app\'s own integrity checks, never quoted from memory (DR-0076). The Word explains the Word (DR-0098): read every referenced passage in the app\'s Bible as you go. Where Scripture is silent, this course says so and stops — we never invent beyond the text._',
};

export const CHURCH_OFFICES_SESSION_FLOW = [
  { minutes: 3, name: 'Pray + read the anchor — the offices serve the Body, not the reverse' },
  { minutes: 7, name: 'The name, its origin, and the measured numbers' },
  { minutes: 12, name: 'Open the Word — read the passages where the office lives' },
  { minutes: 8, name: 'The function today — what this means for our house now' },
];
export const CHURCH_OFFICES_SESSION_MINUTES = CHURCH_OFFICES_SESSION_FLOW.reduce((t, s) => t + s.minutes, 0);

export const CHURCH_OFFICES_MODULES = [
  {
    id: 'co1-names-and-numbers',
    title: 'How to study an office — names, numbers, and the whole counsel',
    bigIdea: 'Every church title is a WORD before it is a position — and words can be studied with rigor. This course studies each office the same four-step way: (1) the NAME and where it came from (the Greek or Hebrew term behind the KJV English); (2) the NUMBERS — every appearance counted from the complete KJV this app hosts, so "how many times" is measured, never guessed; (3) the PASSAGES — reading every place the office lives, letting the Word explain the Word; (4) the FUNCTION — what the office DOES, which always outranks what the office is CALLED. Titles can drift with culture; functions are written.',
    inApp: 'Open the Bible in this app (Scripture tab) and search a word you think you know — try "deacon." Notice how few or many places it appears, and where. That act — reading every appearance instead of assuming — is the whole method of this course.',
    anchor: {
      ref: 'Acts 17:11; 2 Timothy 2:15',
      theme: 'The Bereans were counted noble for searching the Scriptures daily to see whether the things spoken were so — and the workman is approved by rightly dividing the word of truth. Studying the offices from the text itself, counted and read, is that nobility applied to how we order the house.',
    },
    benefits: [
      'You gain a repeatable method — name, numbers, passages, function — for ANY biblical study, not just offices.',
      'You stop inheriting definitions from culture and start reading them from the text.',
      'The counts are real: measured from the whole KJV in this very app, and machine-re-verified.',
      'Leadership conversations change: "the Word uses this word 5 times — let\'s read all 5" ends arguments that opinions start.',
    ],
    levels: {
      teen: 'Church titles like "deacon" and "elder" are words in the Bible before they are jobs at church. This course studies them like a detective: What does the name literally mean? How many times does the Bible actually use it? (This app has the whole KJV inside it, so we COUNTED — the numbers in these lessons come from the real text, not somebody\'s memory.) Then we read the actual places it shows up, and only then decide what the job should look like today. Word first, title second.',
      senior: 'The method is a disciplined word study per office: etymology of the underlying term (e.g. Greek diakonos, presbyteros, episkopos), exhaustive occurrence data measured from the hosted KJV corpus (whole-word matches including plurals and KJV variants, with totals and New Testament splits stated per office and re-verified programmatically), a read-through of the governing passages (the pastoral epistles\' qualification lists, Acts\' narrative institutions, 1 Peter 5\'s charge), and a function-over-title synthesis. The interpretive rule throughout is Scripture\'s own usage over tradition\'s usage — where the text equates two titles (as it does elders and bishops) we say so; where it is silent (deaconess as an office, titles as ranks) we say that too and stop.',
    },
    quiz: {
      questions: [
        {
          q: 'Where do the "how many times in the Bible" numbers in this course come from?',
          options: [
            'A commentary\'s estimates',
            'Measured word-counts from the complete KJV hosted inside this app, re-verified by the app\'s own checks',
            'The teacher\'s memory',
          ],
          answer: 1,
          explain: 'The app hosts the whole KJV; the counts are computed from that text, and an integrity check re-counts them so they can never silently drift.',
        },
      ],
    },
  },
  {
    id: 'co2-deacon',
    title: 'Deacon — the servant with sleeves rolled up',
    bigIdea: `The English "deacon" carries over the Greek DIAKONOS — literally a servant, one who waits on tables and attends to needs; the same word family the New Testament uses for everyday "ministry" and "ministering." The TITLE appears ${counted('deacon')} — Philippians 1:1 greets the bishops and deacons; 1 Timothy 3:8-13 gives the qualifications. The FUNCTION is older than the title: Acts 6:1-6 shows the church setting apart seven men "full of the Holy Ghost and wisdom" to serve tables so the apostles could give themselves to prayer and the Word — and the text there uses the VERB (serve) without ever calling the seven "deacons." The office is organized service: practical care, handled with such character that 1 Timothy 3 demands nearly the same holiness of a table-server as of an overseer.`,
    inApp: 'In the app\'s Bible, read all five occurrences: Philippians 1:1, then 1 Timothy 3:8, 10, 12, 13. Then read Acts 6:1-6 and notice the title is absent while the function is everywhere. Ask: who in our house is already doing Acts 6 work without the name?',
    anchor: {
      ref: 'Acts 6:2-4; 1 Timothy 3:8-13; Mark 10:43-45',
      theme: 'The office is born so the Word and prayer are never crowded out by the serving of tables — and its dignity flows from the Lord Himself, who came not to be ministered unto, but to minister. Service is not the bottom rung of the house; it is the shape of the house\'s Lord.',
    },
    benefits: [
      'You can name the office\'s whole biblical footprint — five occurrences, two passages — and read it in ten minutes.',
      'You see the function (organized practical service) as distinct from, and older than, the title.',
      'The qualification list becomes usable: grave, not double-tongued, not greedy, proven first — a real rubric for appointing.',
      'Serving roles in our house gain their true honor: Mark 10 makes the servant the greatest.',
    ],
    levels: {
      teen: 'Deacon comes from a Greek word that basically means "servant" — someone who waits tables. The Bible only uses the title 5 times (we counted — Philippians 1:1 and four times in 1 Timothy 3). But the JOB shows up big in Acts 6: the church picked seven trusted, Spirit-filled people to run the daily food program so the apostles could stay on prayer and preaching. That is what a deacon is: the organized, trustworthy doer of the practical stuff — and the Bible demands serious character for it, because serving IS leadership in God\'s house.',
      senior: 'DIAKONOS and its cognates (diakonia, diakoneo) span the New Testament far beyond the 5 titled occurrences — the same word family renders "ministry" and "minister" in dozens of places, which is why the office must be read as formalized service rather than junior governance. Acts 6:1-6 is the etiological narrative (the Seven, chosen for being full of the Spirit and wisdom, hands laid on them) though the noun is absent there — honest exegesis notes that. 1 Timothy 3:8-13 is the office\'s charter: character qualifications paralleling the overseer\'s (minus teaching), a proving period ("let these also first be proved"), household credibility, and the promise that those who serve well purchase "a good degree, and great boldness in the faith." Romans 16:1 applies the term to Phebe ("a servant of the church") — whether that is the office or the general word the text does not settle, and neither do we.',
    },
    quiz: {
      questions: [
        {
          q: 'How many times does the KJV use the title "deacon(s)" — and where?',
          options: [
            'Dozens of times, all over both testaments',
            '5 times — Philippians 1:1 and 1 Timothy 3 — with the FUNCTION shown (untitled) in Acts 6',
            'Only once',
          ],
          answer: 1,
          explain: 'Measured from the corpus: 5 occurrences. The office\'s story (Acts 6) never uses the noun — function before title.',
        },
        {
          q: 'What is the deacon\'s core function?',
          options: [
            'Ruling the congregation and correcting doctrine',
            'Organized, trustworthy practical service — so prayer and the Word are never crowded out',
            'Leading worship',
          ],
          answer: 1,
          explain: 'Acts 6 draws the line: the Seven serve tables so the apostles keep to prayer and the ministry of the Word.',
        },
      ],
    },
  },
  {
    id: 'co3-elder',
    title: 'Elder — maturity that shepherds',
    bigIdea: `"Elder" translates the Greek PRESBYTEROS — literally the older, the senior — and it is the most used office word in the Book: ${counted('elder')}. The trail runs through BOTH testaments: the elders of Israel stand with Moses centuries before the church exists, and the church simply continues the pattern — Paul ordains elders in every church (Acts 14:23), calls for the elders of Ephesus (Acts 20:17), tells Titus to ordain elders in every city (Titus 1:5). Elders come plural, are appointed not self-made, rule well and labor in word and doctrine (1 Timothy 5:17), pray for the sick (James 5:14), and shepherd willingly, not for filthy lucre, as examples rather than lords (1 Peter 5:1-3). The office is proven maturity given responsibility for souls.`,
    inApp: 'Read Acts 20:17-38 in the app — Paul\'s farewell to the Ephesian elders — and mark verse 28 for the next lesson. Then 1 Peter 5:1-4. Ask: which men among us already carry proven maturity the Body leans on?',
    anchor: {
      ref: 'Titus 1:5; 1 Peter 5:1-4; 1 Timothy 5:17',
      theme: 'Elders are set in place so that what is wanting is set in order — shepherds who feed the flock willingly and receive, from the chief Shepherd, a crown that does not fade. Authority in the house is real, plural, appointed, and accountable to the Shepherd above every shepherd.',
    },
    benefits: [
      'You see the office\'s deep roots: 199 measured occurrences reaching back to Israel — the church did not invent eldership, it inherited it.',
      'The pattern becomes visible: plural, appointed, qualified (Titus 1:6-9), ruling and teaching.',
      'You can distinguish the elder\'s WHO (proven maturity) from the elder\'s WHAT (shepherding oversight) — and check both in our house.',
      '1 Peter 5\'s three "not... but" pairs (not by constraint / not for money / not as lords) become the standing character test for anyone over the flock.',
    ],
    levels: {
      teen: 'Elder literally means "older one" — but in the Bible it is about proven maturity, not just birthdays. It is the most common leadership word in Scripture: 199 times (we counted), starting way back with the elders of Israel in Moses\' day. In the church, elders always come as a TEAM (plural), they are appointed (someone lays hands on them — you do not appoint yourself), and their job is shepherding: watching over people\'s souls, teaching, praying for the sick, setting the example. Peter gives the three rules: do it willingly, not for money, and never as a bully.',
      senior: 'PRESBYTEROS gives us "presbytery" (1 Timothy 4:14 — the body of elders that laid hands on Timothy). The 199 measured occurrences split roughly 130 OT / 69 NT: the OT elders (of Israel, of the city, at the gate) establish eldership as covenant-community governance long before Pentecost, which is why the church adopts the term without ever pausing to define it — the readers knew. The NT charter passages: appointment (Acts 14:23; Titus 1:5), qualifications (Titus 1:6-9, paralleling 1 Timothy 3\'s overseer list — the next lesson explains why they parallel), function (ruling + laboring in word and doctrine, 1 Timothy 5:17, with double honor and protection against unverified accusation, 5:19), pastoral practice (James 5:14), and posture (1 Peter 5:1-4, where Peter styles himself "also an elder"). Revelation\'s twenty-four elders around the throne carry the term into the heavenlies — the office\'s dignity is not merely administrative.',
    },
    quiz: {
      questions: [
        {
          q: 'Which is TRUE of biblical eldership?',
          options: [
            'It first appears in the New Testament',
            'It is plural, appointed, and rooted all the way back in the elders of Israel — 199 measured occurrences across both testaments',
            'Any willing volunteer is automatically an elder',
          ],
          answer: 1,
          explain: 'The church inherited eldership from Israel\'s pattern; the NT adds appointment and qualification, and elders are consistently plural.',
        },
      ],
    },
  },
  {
    id: 'co4-bishop-overseer',
    title: 'Bishop / Overseer — the same shepherding office, seen from its work',
    bigIdea: `"Bishop" is the KJV's rendering of the Greek EPISKOPOS — epi (over) + skopos (watcher): an over-seer, one who watches over. The title appears ${counted('bishop')}, with the related "overseer/oversight" measured at ${OFFICE_COUNTS.overseer.total} occurrences (mostly Old Testament work-overseers; ${OFFICE_COUNTS.overseer.nt} in the New Testament). Here is what the TEXT ITSELF does with the word: in Acts 20 Paul calls the ELDERS of Ephesus (v17) and tells them the Holy Ghost has made them OVERSEERS to FEED (shepherd) the church (v28) — elder, bishop, and shepherd land on the SAME MEN in one passage. Titus 1 does it again: ordain elders (v5)... for a bishop must be blameless (v7). In Scripture's own usage, elder and bishop are one office — elder names the MAN (his maturity), bishop names the WORK (his watching). 1 Timothy 3:1-7 gives the office's full qualification list, and 1 Peter 2:25 crowns the word: Jesus Himself is "the Shepherd and Bishop of your souls."`,
    inApp: 'Read the equation with your own eyes in the app\'s Bible: Acts 20:17 next to Acts 20:28, then Titus 1:5 next to Titus 1:7. Then read 1 Timothy 3:1-7 slowly — it is the most complete leadership character list in the Book.',
    anchor: {
      ref: 'Acts 20:28; 1 Timothy 3:1-7; 1 Peter 2:25',
      theme: 'The overseers are placed by the Holy Ghost to feed the church which He purchased with His own blood — and the pattern for every overseer is the Bishop of souls Himself. Oversight is blood-bought responsibility exercised under the true Overseer, never rank for its own sake.',
    },
    benefits: [
      'You can show, from the text alone, how elder and bishop relate — ending a centuries-old confusion with two open Bibles.',
      'The literal meaning (over-watcher) keeps the office honest: it is defined by watching care, not by elevation.',
      '1 Timothy 3:1-7 becomes the house\'s standing leadership rubric — fifteen concrete character tests.',
      'However a church structures its titles today, you know what the Word requires of anyone who oversees.',
    ],
    levels: {
      teen: 'Bishop sounds like a high rank, but the Greek word just means "overseer" — someone who watches over people to keep them safe and fed, like a lifeguard for souls. The Bible uses the title only 6 times (counted). And here is the cool part: the Bible uses "elder" and "bishop" for the SAME people — in Acts 20 the elders are told God made them overseers; in Titus 1 Paul says ordain elders... because a bishop must be blameless. Same job: elder describes the person (mature), bishop describes the work (watching over). And 1 Peter 2:25 says Jesus is the Bishop of YOUR soul — He is watching over you.',
      senior: 'EPISKOPOS occurrences: Acts 20:28; Philippians 1:1; 1 Timothy 3:1-2 (with "the office of a bishop," episkope); Titus 1:7; 1 Peter 2:25 (of Christ); plus Acts 1:20\'s "bishoprick" (episkope, quoting Psalm 109:8 of Judas\' vacated charge). The interchange with presbyteros (Acts 20:17/28; Titus 1:5/7; and 1 Peter 5:1-2 where elders are exhorted to take the OVERSIGHT, episkopeo) is the textual basis for reading one office with two names in the NT era — the later development of a separate monarchical episcopate is church history, not New Testament text, and this course teaches the text. The 1 Timothy 3:1-7 list rewards slow study: blameless, one wife, vigilant, sober, hospitable, apt to teach, not given to wine, no striker, not greedy, patient, not a brawler, not covetous, ruling his own house well, not a novice, well reported by outsiders — character and household credibility dominate; only "apt to teach" is a skill.',
    },
    quiz: {
      questions: [
        {
          q: 'How does the New Testament itself relate "elder" and "bishop"?',
          options: [
            'They are two ranks — bishop above elder',
            'The same men are called both (Acts 20:17,28; Titus 1:5,7) — elder names the maturity, bishop/overseer names the watching work',
            'Bishops appear only in the Old Testament',
          ],
          answer: 1,
          explain: 'The text lands both titles on the same people in the same passages. That is the Word\'s own usage, read directly.',
        },
        {
          q: 'Who does 1 Peter 2:25 call "the Shepherd and Bishop of your souls"?',
          options: ['Peter', 'Jesus', 'The elders of Ephesus'],
          answer: 1,
          explain: 'The Lord Himself carries the title — every human overseer works under the true Overseer.',
        },
      ],
    },
  },
  {
    id: 'co5-pastor-shepherd',
    title: 'Pastor / Shepherd — the feeding heart of the office',
    bigIdea: `Surprise of the whole study: the title modern church culture uses most, the Word uses least. "Pastor(s)" appears ${counted('pastor')} — and all but ONE are in Jeremiah, where God confronts the failed shepherds of Israel. The single New Testament occurrence is Ephesians 4:11 ("and some, pastors and teachers"). But the WORD behind it — shepherd, Greek POIMEN — fills the Book: measured at ${OFFICE_COUNTS.shepherd.total} occurrences, from Abel keeping sheep to David's Psalm 23 to Jesus the Good Shepherd (John 10:11) and the Chief Shepherd (1 Peter 5:4). And the VERB is the elder's job description: FEED the flock (Acts 20:28; 1 Peter 5:2; John 21:15-17). Pastoring is not a third office above deacon and elder — it is the shepherding FUNCTION the elders carry: feeding, guarding, seeking the strayed, under the Chief Shepherd.`,
    inApp: 'In the app\'s Bible, read Ephesians 4:11 (the one NT "pastors"), then Jeremiah 23:1-4 (what God requires of shepherds and what He thinks of failed ones), then John 10:11-15. Ask: is our shepherding measured by feeding — or by title?',
    anchor: {
      ref: 'Ephesians 4:11-13; Jeremiah 23:1-4; John 10:11',
      theme: 'The gifts — including pastors — are given FOR the perfecting of the saints and the edifying of the Body; and the Good Shepherd gives His life for the sheep. Shepherding is measured in fed, guarded, gathered sheep — never in the shepherd\'s platform.',
    },
    benefits: [
      'You learn the real proportions: 1 NT "pastors" vs a Book full of shepherds — the function towers over the title.',
      'Jeremiah 23 gives the accountability side: shepherds answer to God for scattered sheep.',
      'John 21 ("Feed my sheep," three times) turns love for Jesus into the job description.',
      'Our house can evaluate shepherding by its biblical outputs — fed, protected, sought-after people.',
    ],
    levels: {
      teen: 'Fun fact that changes everything: the word "pastor" only appears 9 times in the whole KJV — and 8 of those are in Jeremiah, where God is MAD at bad shepherds. Only ONE New Testament verse says "pastors" (Ephesians 4:11). But "shepherd"? 83 times. David was one. Psalm 23 calls God one. Jesus calls Himself the GOOD Shepherd who dies for the sheep. So a pastor is not a boss title — it is a shepherd\'s job: feed the people, protect the people, go find the one who wandered off. Jesus asked Peter three times, "Do you love me?" and the instruction each time was: feed my sheep.',
      senior: 'POIMEN appears 18 times in the NT (measured within the 83 total "shepherd" occurrences), applied to Christ far more than to church officers; the Ephesians 4:11 "pastors and teachers" (one article governing both nouns) is the sole nominal use for the church function. The verb poimaino carries the office\'s content: John 21:16 (Peter\'s recommissioning), Acts 20:28 and 1 Peter 5:2 (the elders\' charge — the same passages where elder = overseer, completing the triangle: elder/bishop/shepherd are one man\'s maturity, watch, and feeding). Jeremiah 23 and Ezekiel 34 are the prophetic indictment of shepherds who feed themselves — the Old Testament\'s standing warning over every pulpit. The Chief Shepherd (archipoimen, 1 Peter 5:4) is a measured hapax — one occurrence — reserving the supremacy of the role for Christ alone.',
    },
    quiz: {
      questions: [
        {
          q: 'How many times does the New Testament use the title "pastors" for church leaders?',
          options: ['Over 100 times', 'Once — Ephesians 4:11; the FUNCTION (shepherding/feeding) is what fills the Book', 'Never'],
          answer: 1,
          explain: 'Measured: 9 KJV occurrences total, 8 of them Jeremiah\'s indictment of failed shepherds; Ephesians 4:11 is the one church-office use. The verb — feed the flock — is everywhere.',
        },
      ],
    },
  },
  {
    id: 'co6-fivefold-and-body',
    title: 'Apostles, prophets, evangelists — the gifts that equip the saints',
    bigIdea: `Ephesians 4:11-13 lists the equipping gifts: apostles, prophets, evangelists, pastors and teachers — given "for the perfecting of the SAINTS, for the work of the ministry." The measured numbers tell the story of each: APOSTLE (Greek apostolos, "one sent forth") — ${counted('apostle')}, entirely New Testament, anchored in the Twelve chosen by the Lord (Luke 6:13) and tested thereafter (Revelation 2:2 praises testing false apostles). PROPHET — the giant of the study at ${counted('prophet')}, spanning the whole Book, one who speaks FOR God; the NT church weighs prophecy rather than swallowing it (1 Corinthians 14:29; 1 Thessalonians 5:20-21). EVANGELIST (euangelistes, "bearer of good news") — rarest of all at ${counted('evangelist')}: Philip the evangelist (Acts 21:8), the Ephesians 4:11 gift, and Timothy told to DO the work of an evangelist (2 Timothy 4:5) — proving the function is assignable even where the title is scarce. And the target of all of it: the SAINTS (${counted('saint')}) — every believer, equipped for ministry. The offices exist to work themselves into the whole Body.`,
    inApp: 'Read Ephesians 4:11-16 in the app — slowly, to verse 16, where the WHOLE Body, every joint, does the increasing. Then Acts 21:8 and 2 Timothy 4:5 for the evangelist\'s tiny, mighty trail.',
    anchor: {
      ref: 'Ephesians 4:11-16; 1 Corinthians 12:27-28; 1 Thessalonians 5:20-21',
      theme: 'God set the gifts in the Body in order — and the Body is the point. Gifts equip saints; saints do the work of the ministry; the whole grows. Despise not prophesyings; prove all things; hold fast that which is good.',
    },
    benefits: [
      'You see each gift\'s real biblical footprint — from prophet\'s 490 to evangelist\'s 3 — and what that scale teaches.',
      'The purpose clause (perfecting the SAINTS for the work) reframes every office as equipment, not celebrity.',
      '2 Timothy 4:5 shows functions are assignable: Timothy must DO evangelist work regardless of title.',
      'The testing texts (Revelation 2:2; 1 Thessalonians 5:21) give the house its safety rail for big claims.',
    ],
    levels: {
      teen: 'Ephesians 4:11 lists five gifts God gave the church: apostles (sent-out founders — 83 mentions, all NT), prophets (God\'s spokespeople — 490 mentions, the biggest word in this whole study), evangelists (good-news carriers — only 3 mentions, the smallest!), pastors and teachers. But look WHY they exist: "for the perfecting of the SAINTS, for the work of the ministry." The gifts are coaches; the saints — that is you — are the team that plays. And the Bible says to TEST big claims: even the Ephesians got praised for testing people who claimed to be apostles and were not.',
      senior: 'Occurrence-scale is itself instructive: prophet\'s 490 (spanning Moses\' wish in Numbers 11:29 to the two witnesses of Revelation) marks speaking-for-God as the Book\'s dominant ministry word; apostle\'s 83 concentrate on the founding eyewitness circle plus Barnabas-class missionaries (Acts 14:14), with the office\'s credential language (2 Corinthians 12:12) and counterfeit-testing (2 Corinthians 11:13; Revelation 2:2) built in; evangelist\'s 3 prove that a thin nominal trail can still carry an assignable function (2 Timothy 4:5). The purpose grammar of Ephesians 4:12 (pros... eis... eis) cascades: gifts perfect saints, saints work the ministry, the ministry edifies the Body, until unity and measure-of-Christ maturity (v13) — with v16 placing growth in "that which every joint supplieth." 1 Corinthians 12:28\'s ordering ("first apostles, secondarily prophets, thirdly teachers, after that...") is sequence-of-foundation, read alongside Ephesians 2:20\'s foundation-of-apostles-and-prophets with Christ the chief corner stone.',
    },
    quiz: {
      questions: [
        {
          q: 'Per Ephesians 4:11-12, why are the gift-offices given?',
          options: [
            'To do all the ministry themselves while the church watches',
            'For the perfecting of the saints, FOR the work of the ministry — the whole Body does the work',
            'To hold ranks and titles',
          ],
          answer: 1,
          explain: 'The offices are equipment for the saints. Verse 16: the Body grows by that which EVERY joint supplies.',
        },
        {
          q: 'The title "evangelist" appears only 3 times — what does 2 Timothy 4:5 prove about that?',
          options: [
            'Evangelism ended with Philip',
            'The FUNCTION is assignable — Timothy is told to do the work of an evangelist regardless of title',
            'Only apostles may evangelize',
          ],
          answer: 1,
          explain: 'Thin title, wide function: do the work. That principle governs how our house assigns every function.',
        },
      ],
    },
  },
  {
    id: 'co7-our-house-now',
    title: 'Putting the functions to work — our world, our house, now',
    bigIdea: 'Now the synthesis Darrell named: "so we can know how to put together what we\'re gonna do now in our world as inside these functions." The study yields five working rules for ordering the house today. (1) FUNCTION OVER TITLE — the Word assigns work (serve, shepherd, oversee, equip, announce) more than ranks; build the org chart from the verbs. (2) CHARACTER IS THE LICENSE — 1 Timothy 3 and Titus 1 gate every office on tested character and household credibility; gifting never overrides it. (3) PLURALITY AND APPOINTMENT — elders come in teams and are set in place by others; nobody self-appoints. (4) EVERY OFFICE EQUIPS THE SAINTS — any structure where the officers do the ministry while members watch is upside-down by Ephesians 4. (5) HONEST SILENCE — where the Word gives no rank ladder or ceremony, we are free to organize wisely and forbidden to call our org chart "thus saith the Lord." With these, map our house: who is doing Acts 6 service? Who carries elder-maturity? Who watches? Who feeds? Who is sent out? Name the functions first; let titles follow truthfully.',
    inApp: 'As a leadership exercise: list our house\'s real roles on paper. Beside each, write the biblical FUNCTION it maps to (service / shepherding-oversight / equipping gift) and the qualification passage that governs it. Where a role maps to nothing, ask if it serves the saints\' equipping. Where a function has no one, that is the next appointment to pray over. Then bring the map into the app\'s Feedback as a requirement — so the house\'s structure and its tools grow together.',
    anchor: {
      ref: '1 Corinthians 14:40; 1 Corinthians 4:2; Ephesians 4:15-16',
      theme: 'All things done decently and in order; stewards found faithful; the Body growing up into Him who is the Head. Order in the house is not bureaucracy — it is love arranged so every joint can supply.',
    },
    benefits: [
      'A working method to map today\'s roles onto the Word\'s functions — deacon-service, elder-oversight, shepherd-feeding, equipping gifts.',
      'The qualification lists become the house\'s appointment rubric — character gates, proven first.',
      'Clarity on where Scripture binds us and where it leaves wisdom free — and the honesty to keep those separate.',
      'A house ordered by functions equips saints — the structure itself starts making disciples.',
    ],
    levels: {
      teen: 'Time to use it all. The Bible cares more about what leaders DO than what they are called: serve (deacon), watch over and feed (elder/bishop/shepherd — same team), equip everybody else (the Ephesians 4 gifts). So our church can make its map: What needs Acts-6-style organized serving? Who are our proven, mature watch-people? Who is feeding people the Word? Where the Bible gives a character list, we use it before giving anyone a role. And where the Bible is silent about exact structure — it often is — we get to organize wisely, but we do not pretend our chart came from heaven.',
      senior: 'The synthesis is a mapping discipline: enumerate the house\'s actual functions and offices, assign each to its biblical category (diakonia-service, presbyteral oversight with its shepherding content, equipping gifts), gate each with its governing qualification text, and mark clearly which structural choices are scriptural mandate versus sanctified pragmatics (meeting cadence, departmental design, title conventions — the Word\'s silence leaves these to wisdom under 1 Corinthians 14:40). Two audits fall out: a CHARACTER audit (are 1 Timothy 3 / Titus 1 gates actually applied at appointment, with proving periods?) and a DIRECTION-OF-MINISTRY audit (does each office measurably equip saints for ministry, per Ephesians 4:12, or absorb ministry into itself?). Revisit annually: functions are stable; the people carrying them, and the world they serve, are not.',
    },
    quiz: {
      questions: [
        {
          q: 'What is the first rule for ordering the house from this study?',
          options: [
            'Collect impressive titles',
            'Function over title — build from the Word\'s verbs (serve, shepherd, oversee, equip), then let titles follow truthfully',
            'Copy whatever the biggest church nearby does',
          ],
          answer: 1,
          explain: 'The Word assigns work more than rank. Name the functions, gate them with the character lists, and titles become honest labels.',
        },
        {
          q: 'Where the Word is silent about exact structure, what is our posture?',
          options: [
            'Invent a structure and call it biblical',
            'Organize wisely and freely — but never stamp our own chart as "thus saith the Lord"',
            'Refuse to organize at all',
          ],
          answer: 1,
          explain: 'Honest silence: bound where the text binds, free where it is silent, and truthful about which is which.',
        },
      ],
    },
  },
];

export const CHURCH_OFFICES_INTEREST_TAG = '[Church Offices interest]';
export const CHURCH_OFFICES_HELPER_TAG = '[Church Offices helper]';

export function buildChurchOfficesSchedule() {
  return CHURCH_OFFICES_MODULES.map((m, i) => ({ ...m, week: i + 1, date: null, weekday: null }));
}

export function churchOfficesProgressSummary(progress = {}) {
  return progressSummaryFor(CHURCH_OFFICES_MODULES, progress);
}

export function exportChurchOfficesCurriculumMarkdown() {
  return exportCurriculumMarkdownFor(
    { meta: CHURCH_OFFICES_META, sessionFlow: CHURCH_OFFICES_SESSION_FLOW, modules: CHURCH_OFFICES_MODULES },
    null,
  );
}

// Tutor course-meta — the solo guide teaches the offices FROM the Word with
// measured honesty: counts come from the corpus, verses are read in the app,
// silence is admitted, and man-made tradition is never sold as text.
export const CHURCH_OFFICES_TUTOR_META = {
  title: CHURCH_OFFICES_META.title,
  intro: 'You are a warm, Word-first teacher guiding one learner through "The Functions of the House" — the biblical offices (deacon, elder, bishop/overseer, pastor/shepherd, and the Ephesians 4 gifts), studied by name-origin, measured occurrence counts, the governing passages, and function-over-title synthesis.',
  posture: 'Teach the Word by the Word (DR-0098): explain each office from Scripture\'s own usage — including the text\'s own equation of elder/bishop/shepherd (Acts 20:17,28; Titus 1:5,7; 1 Peter 5:1-2) — and never stage human schools of thought as the authority over the text. The occurrence counts in this course are MEASURED from the KJV corpus this app hosts; cite them as measured, and if asked for a count outside the course, say it must be measured, not remembered. Cite Scripture by reference and send the learner to READ it in the app\'s own Bible; never quote a verse from memory or invent one (DR-0076). Where Scripture is silent (rank ladders, ceremonies, titles-as-hierarchy), say plainly that it is silent and stop — honest silence over invented certainty. Etymologies (diakonos, presbyteros, episkopos, poimen, apostolos, euangelistes) are standard linguistic fact; present them as such. Be pastoral and practical: the goal Darrell set is that the house can order what it does NOW inside these functions — function over title, character as the license, plurality and appointment, every office equipping the saints. You run on the church\'s own sovereign A.I.; you can be wrong — tell the learner to verify in the open Bible and with their leadership.',
};
