// =============================================================================
// torah-patterns — EVERY VISIBLE PATTERN of the Godhead relationships, and of
// the enemies opposed, across the first five books. The map, so we can SEE.
// =============================================================================
// Darrell, 2026-09-08, after L132 shipped: "Are there more patterns in the
// first 5 books... we want ALL of the visible patterns of these relationships
// so we can See!!!!" — and, sharpening the standard a moment later: "Rigorous
// analysis."
//
// L132 taught ONE line through the Torah. This is the MAP: the patterns sorted
// into families, each one carrying who of the Godhead is visibly acting, which
// enemy is in view, and the verses that show it. The point is sight — a reader
// should be able to look at the whole first five books at once and see the
// shape.
//
// THE RIGOUR THIS MODULE IS BUILT ON, and the reason it can be trusted:
//
//   1. TWO TIERS, NEVER BLURRED. Every pattern declares a `basis`:
//        'named' — the text itself uses the words (e.g. "the Spirit of God"
//                  in Genesis 1:2). Nothing is being read in.
//        'shown' — the text displays the pattern without the later label (e.g.
//                  the Angel who speaks as Yahweh, is called God, and receives
//                  worship). We say WHAT THE TEXT DOES, and our identification
//                  is carried separately in `confession`, marked as ours.
//      A 'shown' pattern without a confession line, or a 'named' pattern that
//      smuggles one in, fails the gate. This is DR-0076 §8 (provenance and
//      honest uncertainty) made structural instead of promised.
//
//   2. NOTHING OUTSIDE THE FIRST FIVE BOOKS. Every ref is Genesis to
//      Deuteronomy. The gate proves it, and proves each ref resolves to
//      verbatim KJV in the in-repo corpus (app/public/bible/kjv/).
//
//   3. BOOKS ARE DERIVED, NEVER TYPED. booksOf() reads the refs. A hand-typed
//      book list is exactly the painted-number class DR-0121 forbids, and it
//      would drift the moment a ref changed.
//
//   4. WHERE THE TEXT IS RETICENT, WE STOP (DR-0098). Genesis 6 names the sons
//      of God without explaining them; the pattern says so in `reticence`
//      rather than filling the silence with a school of thought.
//
// PURE: no React, no network. TorahPatternMap.jsx renders it; the gate in
// __tests__/torah-patterns.test.js proves every claim above.
// =============================================================================

// The five books, in order. Used to derive coverage and to reject any ref that
// wanders outside the span Darrell set.
export const TORAH_BOOKS = ['Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy'];

// The Persons, as the map tracks them. `id` is what a pattern lists in
// `persons`; the label is what the surface prints.
export const PERSONS = [
  { id: 'father', label: 'the Father', blurb: 'Yahweh purposing, speaking, judging, covenanting, seeking.' },
  { id: 'son',    label: 'the Son',    blurb: 'The One who is sent and seen — the promised Seed, the Angel who carries the Name, the Man who is met face to face.' },
  { id: 'spirit', label: 'the Holy Spirit', blurb: 'Moving, striving, filling, resting, coming upon — named as the Spirit of God in the Torah itself.' },
];

// The pattern families. Order is the order the map presents them: who Yahweh
// is, then how He works, then who is opposed, then the campaigns where all of
// it runs at once.
export const FAMILIES = [
  { id: 'plural',        label: 'Yahweh speaks as Us',        blurb: 'The places where the one Yahweh speaks of Himself in the plural, or acts as more than one and is still one.' },
  { id: 'spirit',        label: 'The Spirit in the Torah',    blurb: 'Every place the first five books name the Spirit of God at work — He is not a later arrival.' },
  { id: 'likeness',      label: 'The likeness is self-giving', blurb: 'What Yahweh meant by like Us — asked by Darrell mid-build. The image is borne by a many who are one, it passes father-to-son, and it looks like laying yourself down for someone else.' },
  { id: 'visible-one',   label: 'The One who is seen',        blurb: 'The figure who appears, speaks as Yahweh, is called God, and is looked at by people who then say they should have died and did not.' },
  { id: 'word',          label: 'The Word that does',         blurb: 'Speaking and doing as one act — Yahweh says it and it exists.' },
  { id: 'seed',          label: 'The Coming One promised',    blurb: 'The Seed, the Sceptre, the Star, the Prophet — announced long before there is a throne to sit on.' },
  { id: 'substitution',  label: 'Something dies in the place of someone', blurb: 'The covering pattern: a life given so a guilty party is covered, from the garden to the tabernacle.' },
  { id: 'mediator',      label: 'Someone stands between',     blurb: 'A man placing himself between wrath and a people — and Yahweh honouring it every time.' },
  { id: 'enemy-roll',    label: 'The enemies, named',         blurb: 'Who the Torah says is opposed — plainly, without drama and without guesswork.' },
  { id: 'enemy-method',  label: 'How the enemy works',        blurb: 'The recorded technique: the question, the lie, the counterfeit, the seduction.' },
  { id: 'knowing',       label: 'Knowing Yahweh did not prevent it', blurb: 'Darrell, mid-build: the most competent beings were tricked — or they were not tricked and are just as evil. The Torah answers by distinguishing the cases, and the more direct the access, the less it calls it deception.' },
  { id: 'joint',         label: 'All of it running at once',  blurb: 'Campaigns where the Father, the Son and the Spirit are each visibly at work against a named enemy in the same account.' },
];

// TORAH_PATTERNS — the map. Each entry: what family it belongs to, which
// Persons are visibly at work, which enemy is in view, the refs that show it,
// and `shows` — what the TEXT states, in plain words. `confession` appears only
// where basis is 'shown', and is explicitly ours. `reticence` marks a place the
// text stays silent and so do we.
export const TORAH_PATTERNS = [
  // ── Yahweh speaks as Us ───────────────────────────────────────────────────
  {
    id: 'tp-us-make-man', family: 'plural', basis: 'named',
    name: 'Let us make man in our image',
    persons: ['father', 'son', 'spirit'], enemy: null,
    refs: ['Genesis 1:26'],
    shows: 'Yahweh speaks of Himself in the plural — us, our — while the account has been describing one Creator throughout. The plural is in the sentence itself, not in a commentary on it.',
  },
  {
    id: 'tp-us-one-of-us', family: 'plural', basis: 'named',
    name: 'The man is become as one of us',
    persons: ['father', 'son', 'spirit'], enemy: 'serpent',
    refs: ['Genesis 3:22'],
    shows: 'The plural is said a SECOND time, after the fall, so it cannot be dismissed as a single odd phrase. Two witnesses inside three chapters.',
  },
  {
    id: 'tp-us-go-down-babel', family: 'plural', basis: 'named',
    name: 'Let us go down at Babel',
    persons: ['father', 'son', 'spirit'], enemy: 'babel',
    refs: ['Genesis 11:7', 'Genesis 11:4'],
    shows: 'A third time, and this one is an action taken against a rebellion: the builders say let us make us a name, and Yahweh answers let us go down. The counterfeit us is met by the real one.',
  },
  {
    id: 'tp-lord-from-the-lord', family: 'plural', basis: 'shown',
    name: 'The LORD rained from the LORD out of heaven',
    persons: ['father', 'son'], enemy: null,
    refs: ['Genesis 19:24'],
    shows: 'One verse names the LORD twice, as two: the LORD rained brimstone and fire FROM THE LORD out of heaven. One acting on the earth, one in heaven, and the text calls both the LORD.',
    confession: 'We read the One on the earth as the Son — the same One who walks in the garden, wrestles at the ford, and stands in the way with a drawn sword. The text gives us two called the LORD; the identification is our confession, not a claim the verse makes.',
  },
  {
    id: 'tp-one-lord', family: 'plural', basis: 'named',
    name: 'The LORD our God is one LORD',
    persons: ['father', 'son', 'spirit'], enemy: 'other-gods',
    refs: ['Deuteronomy 6:4', 'Deuteronomy 4:35'],
    shows: 'The same Torah that speaks in the plural insists on ONE. Both are held together without embarrassment: there is none else beside Him, and He says us. The map keeps both, because the text does.',
  },

  // ── The Spirit in the Torah ───────────────────────────────────────────────
  {
    id: 'tp-spirit-moved', family: 'spirit', basis: 'named',
    name: 'The Spirit moved upon the face of the waters',
    persons: ['spirit'], enemy: null,
    refs: ['Genesis 1:2'],
    shows: 'The Holy Spirit is named in the SECOND verse of the Bible — before light, before land, before man. Whatever else is argued about Him, His presence at the start is stated.',
  },
  {
    id: 'tp-spirit-strives', family: 'spirit', basis: 'named',
    name: 'My spirit shall not always strive with man',
    persons: ['spirit'], enemy: 'corruption',
    refs: ['Genesis 6:3', 'Genesis 6:5'],
    shows: 'The Spirit is already contending inside human hearts, and there is a limit to how long He will be resisted. Conviction is a Genesis doctrine.',
  },
  {
    id: 'tp-spirit-in-joseph', family: 'spirit', basis: 'named',
    name: 'A man in whom the Spirit of God is',
    persons: ['spirit'], enemy: null,
    refs: ['Genesis 41:38'],
    shows: 'A pagan king is the one who says it about Joseph. The Spirit in a person is visible enough from the outside that an unbeliever names it.',
  },
  {
    id: 'tp-spirit-fills-craftsman', family: 'spirit', basis: 'named',
    name: 'Filled with the spirit of God — in workmanship',
    persons: ['spirit'], enemy: null,
    refs: ['Exodus 31:3', 'Exodus 35:31'],
    shows: 'The first person the Torah says is FILLED with the Spirit is a craftsman, and the filling is wisdom, understanding, knowledge and all manner of workmanship. Skilled work is Spirit-work.',
  },
  {
    id: 'tp-spirit-on-seventy', family: 'spirit', basis: 'named',
    name: 'The Spirit taken from one and put on seventy',
    persons: ['father', 'spirit'], enemy: null,
    refs: ['Numbers 11:17', 'Numbers 11:25', 'Numbers 11:29'],
    shows: 'Yahweh takes of the Spirit on Moses and puts Him on seventy elders so the burden is shared — and Moses answers the complaint about it by wishing the Spirit were on ALL Yahweh’s people. The desire for a poured-out Spirit is spoken in the Torah.',
  },
  {
    id: 'tp-spirit-on-balaam', family: 'spirit', basis: 'named',
    name: 'The Spirit came upon a hired prophet',
    persons: ['spirit'], enemy: 'balaam',
    refs: ['Numbers 24:2', 'Numbers 24:17'],
    shows: 'A man paid to curse Israel has the Spirit of God come upon him, and what comes out is blessing and the Star out of Jacob. The Spirit overrules a hostile mouth and turns the weapon into prophecy.',
  },
  {
    id: 'tp-spirit-in-joshua', family: 'spirit', basis: 'named',
    name: 'A man in whom is the spirit',
    persons: ['father', 'spirit'], enemy: null,
    refs: ['Numbers 27:18', 'Deuteronomy 34:9'],
    shows: 'Succession is decided by the Spirit, not by lineage: the successor is chosen because the spirit is in him, and he is full of the spirit of wisdom when hands are laid on him.',
  },

  // ── The likeness is self-giving ───────────────────────────────────────────
  // Darrell, 2026-09-08, mid-build: "what did Yahweh mean like Us... give their
  // lives for Love?!!!" The Torah answers it three ways, and every one of them
  // lands where the question landed. This family exists because he asked it.
  {
    id: 'tp-likeness-plural-bearer', family: 'likeness', basis: 'named',
    name: 'The image is borne by a many who are one',
    persons: ['father', 'son', 'spirit'], enemy: null,
    refs: ['Genesis 1:27', 'Genesis 2:24'],
    shows: 'The image is stated of THEM, plural, in the same breath as his own image — male and female created he them — and the next chapter says the two shall be one flesh. A likeness of the Us is not a solitary thing; it is a communion that is one.',
  },
  {
    id: 'tp-likeness-father-to-son', family: 'likeness', basis: 'named',
    name: 'Likeness is what a father passes to a son',
    persons: ['father'], enemy: null,
    refs: ['Genesis 5:3', 'Genesis 1:26'],
    shows: 'The Torah reuses the exact image-and-likeness pair for a human father and his son: Adam begat a son in his own likeness, after his image. So our likeness in Genesis 1:26 is FAMILY language — Yahweh is making children who carry the family resemblance, not statues that resemble a shape.',
  },
  {
    id: 'tp-likeness-yahweh-loves-first', family: 'likeness', basis: 'named',
    name: 'He loved them because He loved them — not because they earned it',
    persons: ['father'], enemy: null,
    refs: ['Deuteronomy 7:7', 'Deuteronomy 7:8', 'Deuteronomy 10:18'],
    shows: 'Yahweh states His own motive and removes every merit from it: not because ye were more in number, for ye were the fewest — but because the LORD loved you. And the love is practical, not sentimental: He loves the stranger by giving him food and raiment.',
  },
  {
    id: 'tp-likeness-commanded-love', family: 'likeness', basis: 'named',
    name: 'The likeness is commanded as love — of Yahweh, neighbour and stranger',
    persons: ['father'], enemy: null,
    refs: ['Deuteronomy 6:5', 'Leviticus 19:18', 'Leviticus 19:34'],
    shows: 'Love Yahweh with all thine heart, and thy soul, and thy might; love thy neighbour as thyself; and love the stranger as thyself, for ye were strangers. All three are in the first five books, and each closes with I am the LORD — the command is grounded in who He is, which is the definition of a likeness.',
  },
  {
    id: 'tp-likeness-judah-instead-of-the-lad', family: 'likeness', basis: 'shown',
    name: 'Judah offers himself in the place of his brother',
    persons: ['father'], enemy: null,
    refs: ['Genesis 44:33', 'Genesis 44:34', 'Genesis 49:10'],
    shows: 'Judah asks to be kept as a slave so the boy can go free — let thy servant abide instead of the lad — and his stated reason is his father’s grief. A man volunteering to take the place of the condemned, for love of the father and the brother.',
    confession: 'We read this as the clearest human picture of the likeness in the Torah, and note what the text does next: the sceptre is given to JUDAH, and the King comes from the tribe of the man who offered himself instead. The text sets the two side by side; joining them is our reading, and we say so.',
  },
  {
    id: 'tp-likeness-moses-blot-me-out', family: 'likeness', basis: 'named',
    name: 'Blot me out of thy book — a mediator offering his own name',
    persons: ['father'], enemy: 'golden-calf',
    refs: ['Exodus 32:32', 'Exodus 32:11'],
    shows: 'Moses does not ask to be spared from a guilty people; he asks to be destroyed with them, or instead of them. This is what the likeness looks like under pressure — and Yahweh does not rebuke him for it.',
  },
  {
    id: 'tp-likeness-aaron-between', family: 'likeness', basis: 'named',
    name: 'He stood between the dead and the living',
    persons: ['father'], enemy: 'plague',
    refs: ['Numbers 16:48', 'Numbers 25:11'],
    shows: 'Aaron runs INTO a plague with a censer and puts his own body in the gap, and the plague is stayed. Phinehas turns wrath away by standing in the breach. Yahweh honours the one who steps between, every time it happens in these books.',
  },
  {
    id: 'tp-likeness-yahweh-covers-first', family: 'likeness', basis: 'named',
    name: 'Yahweh Himself pays first, in the garden',
    persons: ['father'], enemy: 'serpent',
    refs: ['Genesis 3:21', 'Genesis 22:8'],
    shows: 'Before any human is asked to give anything, Yahweh covers two guilty people at the cost of a life and clothes them with His own hands — and later says He will provide Himself a lamb, and does. The self-giving in the likeness is His before it is ever ours.',
  },

  // ── The One who is seen ───────────────────────────────────────────────────
  {
    id: 'tp-seen-hagar', family: 'visible-one', basis: 'shown',
    name: 'Thou God seest me — the runaway slave girl',
    persons: ['son'], enemy: null,
    refs: ['Genesis 16:7', 'Genesis 16:13'],
    shows: 'The angel of the LORD finds Hagar in the wilderness, and she calls the name of the LORD THAT SPAKE UNTO HER — she addresses the speaker as the LORD Himself. The first person in Scripture to give Yahweh a name is a foreign slave woman.',
    confession: 'We read the One who is called the angel of the LORD and then answered to as the LORD as the Son. The text supplies both descriptions of the same figure; the identification is our confession.',
  },
  {
    id: 'tp-seen-moriah', family: 'visible-one', basis: 'shown',
    name: 'The angel of the LORD stops the knife',
    persons: ['son'], enemy: null,
    refs: ['Genesis 22:11', 'Genesis 22:14'],
    shows: 'The one who calls out of heaven is the angel of the LORD, and the place is named for what will be SEEN in the mount of the LORD.',
    confession: 'We read the Angel who provides the substitute on Moriah as the Son, who would later be the substitute on the same ground. The text names the Angel and names the mountain; joining them is our reading.',
  },
  {
    id: 'tp-seen-bethel', family: 'visible-one', basis: 'shown',
    name: 'The angel says I am the God of Bethel',
    persons: ['son'], enemy: null,
    refs: ['Genesis 31:11', 'Genesis 31:13', 'Genesis 28:12'],
    shows: 'The angel of God speaks in a dream and identifies Himself in the first person as I AM THE GOD OF BETHEL. The messenger claims the identity of the One who sent messengers.',
    confession: 'We read the Angel who speaks as God, and who stands at the top of the ladder joining heaven and earth, as the Son.',
  },
  {
    id: 'tp-seen-peniel', family: 'visible-one', basis: 'shown',
    name: 'A Man wrestles until daybreak and is called God',
    persons: ['son'], enemy: null,
    refs: ['Genesis 32:24', 'Genesis 32:30'],
    shows: 'The text says a MAN wrestled with him, and Jacob afterwards says he has seen God face to face and his life is preserved. A man to the touch; God to the one who touched Him; and the survival is remarked on as remarkable.',
    confession: 'We read the Man at the ford as the Son — the one Person of the Godhead a human being can grapple with and live.',
  },
  {
    id: 'tp-seen-angel-redeemed', family: 'visible-one', basis: 'shown',
    name: 'The Angel which redeemed me from all evil',
    persons: ['son'], enemy: 'evil',
    refs: ['Genesis 48:16'],
    shows: 'A dying Jacob blesses his grandsons and asks THE ANGEL WHICH REDEEMED ME to bless them — assigning to the Angel the work of redemption and the authority to bless.',
    confession: 'We read the redeeming Angel Jacob blesses by as the Son. The word redeemed is the text’s; the identification is ours.',
  },
  {
    id: 'tp-seen-burning-bush', family: 'visible-one', basis: 'shown',
    name: 'The Angel in the flame who says I AM',
    persons: ['father', 'son'], enemy: null,
    refs: ['Exodus 3:2', 'Exodus 3:6', 'Exodus 3:14'],
    shows: 'The angel of the LORD appears in the flame; the voice from the same bush says I am the God of thy father, and Moses hides his face because he is afraid to look upon God — then gives the name I AM THAT I AM. Angel, and God, and the Name, in one scene.',
    confession: 'We read the One in the flame who bears the Name as the Son. The text gives the Angel and the Name in the same bush; the identification is our confession.',
  },
  {
    id: 'tp-seen-name-is-in-him', family: 'visible-one', basis: 'named',
    name: 'My name is in him',
    persons: ['father', 'son'], enemy: null,
    refs: ['Exodus 23:20', 'Exodus 23:21'],
    shows: 'Yahweh sends an Angel before the people and says three things about Him that are said of no created servant: obey His voice, provoke Him not, HE WILL NOT PARDON YOUR TRANSGRESSIONS — and the reason given is MY NAME IS IN HIM. The power to withhold pardon and the indwelling Name are stated outright.',
  },
  {
    id: 'tp-seen-face-to-face', family: 'visible-one', basis: 'named',
    name: 'The LORD spake unto Moses face to face',
    persons: ['father', 'son'], enemy: null,
    refs: ['Exodus 33:11', 'Exodus 14:19'],
    shows: 'Yahweh speaks to Moses face to face, as a man speaketh unto his friend — and it is the angel of God who goes before the camp and then moves behind it to stand between Israel and Egypt.',
  },
  {
    id: 'tp-seen-drawn-sword', family: 'visible-one', basis: 'named',
    name: 'The angel of the LORD standing in the way, sword drawn',
    persons: ['son'], enemy: 'balaam',
    refs: ['Numbers 22:31', 'Numbers 24:2'],
    shows: 'The Angel physically blocks a prophet hired to curse Israel, and the man falls on his face. Then the Spirit comes on the same man and blessing comes out instead. The Son blocks, the Spirit turns the mouth.',
  },

  // ── The Word that does ────────────────────────────────────────────────────
  {
    id: 'tp-word-and-god-said', family: 'word', basis: 'named',
    name: 'And God said — and it was so',
    persons: ['father', 'son'], enemy: null,
    refs: ['Genesis 1:3', 'Genesis 1:1'],
    shows: 'The mechanism of creation is speech. Yahweh says it and the thing exists; the speaking IS the doing. Nothing is built with hands in Genesis 1.',
  },
  {
    id: 'tp-word-i-am', family: 'word', basis: 'named',
    name: 'I AM THAT I AM — the Name that is a sentence',
    persons: ['father'], enemy: 'gods-of-egypt',
    refs: ['Exodus 3:14', 'Exodus 15:11'],
    shows: 'Yahweh answers the question of His name with a statement of self-existence, and then the song after the sea asks who is like unto thee among the gods. The Name itself is the argument against every rival.',
  },

  // ── The Coming One promised ───────────────────────────────────────────────
  {
    id: 'tp-seed-of-the-woman', family: 'seed', basis: 'named',
    name: 'Her Seed shall bruise thy head',
    persons: ['father', 'son'], enemy: 'serpent',
    refs: ['Genesis 3:15'],
    shows: 'Yahweh declares the enmity Himself, names a Seed OF THE WOMAN, and states the two injuries: a crushed head for the enemy, a bruised heel for the Seed. The rescue is announced to the adversary as his sentence.',
  },
  {
    id: 'tp-seed-all-families', family: 'seed', basis: 'named',
    name: 'In thee shall all families of the earth be blessed',
    persons: ['father'], enemy: null,
    refs: ['Genesis 12:3'],
    shows: 'One man is chosen so that ALL families are reached. Election in the Torah aims outward at the nations; it is never a wall.',
  },
  {
    id: 'tp-seed-shiloh', family: 'seed', basis: 'named',
    name: 'Until Shiloh come',
    persons: ['son'], enemy: null,
    refs: ['Genesis 49:10', 'Genesis 49:24'],
    shows: 'The sceptre is fixed to Judah until Shiloh comes and the gathering of the people is to Him — spoken while Israel is still a family in tents with no throne, no land and no king.',
  },
  {
    id: 'tp-seed-star-and-sceptre', family: 'seed', basis: 'named',
    name: 'A Star out of Jacob, a Sceptre out of Israel',
    persons: ['son', 'spirit'], enemy: 'balaam',
    refs: ['Numbers 24:17', 'Numbers 24:2'],
    shows: 'The prophecy of the coming King is delivered through the mouth of a man hired to curse, with the Spirit of God upon him. Yahweh takes the enemy’s own instrument and publishes the Messiah through it.',
  },
  {
    id: 'tp-seed-prophet-like-moses', family: 'seed', basis: 'named',
    name: 'A Prophet like unto me — unto him ye shall hearken',
    persons: ['father', 'son'], enemy: 'false-prophets',
    refs: ['Deuteronomy 18:15', 'Deuteronomy 18:12'],
    shows: 'In the SAME passage that forbids divination and every occult practice, Yahweh gives the alternative: a Prophet He will raise up, to whom the people shall hearken. The prohibition and the provision are one paragraph — He removes the counterfeit by supplying the real thing.',
  },

  // ── Something dies in the place of someone ────────────────────────────────
  {
    id: 'tp-sub-coats-of-skins', family: 'substitution', basis: 'named',
    name: 'Coats of skins — the first death',
    persons: ['father'], enemy: 'serpent',
    refs: ['Genesis 3:21', 'Genesis 3:24'],
    shows: 'Leaves are replaced by skins, which requires a death, and Yahweh does the making and the clothing Himself. The garden is then closed with a guard set TO KEEP the way of the tree of life — guarded, not destroyed.',
  },
  {
    id: 'tp-sub-firstlings', family: 'substitution', basis: 'named',
    name: 'The firstlings, and blood that speaks',
    persons: ['father'], enemy: null,
    refs: ['Genesis 4:4', 'Genesis 4:10', 'Genesis 8:20'],
    shows: 'The accepted offering has blood in it; spilled blood cries from the ground; and after the flood the first thing built is an altar. Blood is never silent in the Torah.',
  },
  {
    id: 'tp-sub-ram-instead', family: 'substitution', basis: 'named',
    name: 'A ram in the stead of his son',
    persons: ['father', 'son'], enemy: null,
    refs: ['Genesis 22:2', 'Genesis 22:8', 'Genesis 22:13'],
    shows: 'A father, an only son whom he loves, the son carrying the wood, a promise that Yahweh will provide Himself a lamb — and a ram offered IN THE STEAD OF the son. The words in the stead of are the text’s own.',
  },
  {
    id: 'tp-sub-passover-blood', family: 'substitution', basis: 'named',
    name: 'When I see the blood, I will pass over you',
    persons: ['father'], enemy: 'gods-of-egypt',
    refs: ['Exodus 12:13', 'Exodus 12:12', 'Exodus 13:13'],
    shows: 'On the night the gods of Egypt are judged, a household is spared by a mark of blood — and the same chapter establishes that a firstling is redeemed with a lamb. Judgement on the powers, and a covering for the family, in one night.',
  },
  {
    id: 'tp-sub-hand-on-the-head', family: 'substitution', basis: 'named',
    name: 'His hand upon the head — and it is accepted FOR him',
    persons: ['father'], enemy: null,
    refs: ['Leviticus 1:4', 'Leviticus 17:11', 'Exodus 29:38'],
    shows: 'The worshipper lays his hand on the animal’s head and it is accepted FOR HIM to make atonement — transfer stated as plainly as it can be. The reason is given outright: it is the blood that maketh an atonement for the soul. And a lamb is offered morning and evening, continually.',
  },
  {
    id: 'tp-sub-two-goats', family: 'substitution', basis: 'named',
    name: 'Two goats — one killed, one carries it away',
    persons: ['father'], enemy: null,
    refs: ['Leviticus 16:8', 'Leviticus 16:10', 'Leviticus 16:22'],
    shows: 'One lot for the LORD and one for the scapegoat; the living goat is presented before Yahweh to make atonement, then bears upon him ALL their iniquities into a land not inhabited. Two goats are needed because one act has two halves — a death, and a removal.',
  },
  {
    id: 'tp-sub-lifted-up', family: 'substitution', basis: 'named',
    name: 'The serpent lifted on a pole — look and live',
    persons: ['father'], enemy: 'serpent',
    refs: ['Numbers 21:8', 'Numbers 21:9', 'Deuteronomy 21:23'],
    shows: 'The thing that was killing them is put on a pole, and everyone who LOOKS lives. No work is prescribed — only looking. And the Torah elsewhere states that he that is hanged is accursed of God, which is what makes the pole the strangest possible place to find life.',
  },

  // ── Someone stands between ────────────────────────────────────────────────
  {
    id: 'tp-med-abraham-bargains', family: 'mediator', basis: 'named',
    name: 'Wilt thou also destroy the righteous with the wicked?',
    persons: ['father'], enemy: null,
    refs: ['Genesis 18:23', 'Genesis 18:1'],
    shows: 'Yahweh appears to Abraham, and Abraham draws near to argue for a city that is not his. Yahweh does not silence him; He answers every round. Intercession is welcomed, not tolerated.',
  },
  {
    id: 'tp-med-moses-stands', family: 'mediator', basis: 'named',
    name: 'Moses besought the LORD — and offered his own name',
    persons: ['father'], enemy: 'golden-calf',
    refs: ['Exodus 32:11', 'Exodus 32:32', 'Numbers 14:19', 'Deuteronomy 9:18'],
    shows: 'Moses argues Yahweh’s own reputation and covenant back to Him, asks pardon on the ground of mercy, offers to be blotted out instead, and lies before Yahweh forty days for a people who had just betrayed him. The pattern repeats across three books.',
  },
  {
    id: 'tp-med-held-up-hands', family: 'mediator', basis: 'named',
    name: 'When Moses held up his hand, Israel prevailed',
    persons: ['father'], enemy: 'amalek',
    refs: ['Exodus 17:11'],
    shows: 'The battle below tracks the hands above. The outcome of a real fight is tied to sustained intercession, and the text says it without hedging.',
  },
  {
    id: 'tp-med-stood-between', family: 'mediator', basis: 'named',
    name: 'He stood between the dead and the living',
    persons: ['father'], enemy: 'plague',
    refs: ['Numbers 16:48', 'Numbers 25:11'],
    shows: 'A priest runs into a plague and the plague stops where he stands. Phinehas turns wrath away in the same book. Yahweh consistently honours the body placed in the gap.',
  },

  // ── The enemies, named ────────────────────────────────────────────────────
  {
    id: 'tp-enemy-serpent', family: 'enemy-roll', basis: 'named',
    name: 'The serpent — subtil, and a creature',
    persons: [], enemy: 'serpent',
    refs: ['Genesis 3:1'],
    shows: 'He is introduced as MORE SUBTIL than any beast of the field WHICH THE LORD GOD HAD MADE. Not strong; subtil. And made — a creature, never a rival power.',
  },
  {
    id: 'tp-enemy-sons-of-god', family: 'enemy-roll', basis: 'named',
    name: 'The sons of God, and the giants',
    persons: [], enemy: 'sons-of-god',
    refs: ['Genesis 6:2', 'Genesis 6:4', 'Genesis 6:5'],
    shows: 'The text names the sons of God, the daughters of men, and giants in the earth in those days, and reports the result: every imagination of the thoughts of his heart was only evil continually.',
    reticence: 'The Torah names them and does not explain them. This map stays where the text stays: we record what is written and do not fill the silence with a school of thought (DR-0098).',
  },
  {
    id: 'tp-enemy-babel', family: 'enemy-roll', basis: 'named',
    name: 'Babel — let us make us a name',
    persons: [], enemy: 'babel',
    refs: ['Genesis 11:4', 'Genesis 11:7'],
    shows: 'The rebellion is a counterfeit of the Us: humanity says let us make us a NAME, upward, instead of receiving one. Yahweh answers with His own let us go down.',
  },
  {
    id: 'tp-enemy-strange-gods', family: 'enemy-roll', basis: 'named',
    name: 'Strange gods carried in the household baggage',
    persons: [], enemy: 'other-gods',
    refs: ['Genesis 35:2', 'Exodus 20:3', 'Deuteronomy 32:16'],
    shows: 'The patriarch has to tell his own household to put away the strange gods that are AMONG YOU. The first commandment addresses the same problem, and Deuteronomy says they provoked Him to jealousy with strange gods. Idolatry in these books is an inside problem before it is an outside one.',
  },
  {
    id: 'tp-enemy-gods-of-egypt', family: 'enemy-roll', basis: 'named',
    name: 'Against all the gods of Egypt I will execute judgment',
    persons: ['father'], enemy: 'gods-of-egypt',
    refs: ['Exodus 12:12', 'Exodus 15:11'],
    shows: 'The plagues are stated to be a legal action against named defendants — the gods of Egypt — not merely a rescue of slaves. The song afterwards asks who is like unto thee among the gods.',
  },
  {
    id: 'tp-enemy-enchantments', family: 'enemy-roll', basis: 'named',
    name: 'The magicians did in like manner — until they could not',
    persons: ['father'], enemy: 'enchantments',
    refs: ['Exodus 7:11', 'Exodus 7:12', 'Exodus 8:19'],
    shows: 'The counterfeit power is real enough to imitate for a while — and Aaron’s rod swallows theirs, then they hit a ceiling in public and say THIS IS THE FINGER OF GOD. Scripture forbids these arts rather than mocking them, and then shows their limit.',
  },
  {
    id: 'tp-enemy-golden-calf', family: 'enemy-roll', basis: 'named',
    name: 'The calf — a false god wearing the true rescue',
    persons: [], enemy: 'golden-calf',
    refs: ['Exodus 32:4'],
    shows: 'The lie is not that a god exists but that THIS is the one who brought you up out of Egypt. The counterfeit claims credit for the real deliverance — the most dangerous form the idol takes.',
  },
  {
    id: 'tp-enemy-devils-molech', family: 'enemy-roll', basis: 'named',
    name: 'Devils, molech, and the children',
    persons: [], enemy: 'devils',
    refs: ['Leviticus 17:7', 'Leviticus 18:21', 'Deuteronomy 32:17'],
    shows: 'The Torah says sacrifices were offered UNTO DEVILS, forbids passing seed through the fire to molech, and closes with the verdict: they sacrificed unto devils, not to God; to gods whom they knew not. Plain naming, no drama.',
  },
  {
    id: 'tp-enemy-familiar-spirits', family: 'enemy-roll', basis: 'named',
    name: 'Familiar spirits, and the whole forbidden list',
    persons: ['father'], enemy: 'divination',
    refs: ['Leviticus 19:31', 'Leviticus 20:27', 'Deuteronomy 18:10', 'Deuteronomy 18:12'],
    shows: 'The prohibition is repeated across three books and the reason is given: all that do these things are an abomination unto the LORD, and it is BECAUSE of these that the nations are driven out. The practice, not the people, is what condemns.',
  },
  {
    id: 'tp-enemy-baalpeor', family: 'enemy-roll', basis: 'named',
    name: 'baalpeor — taken by seduction, not by war',
    persons: [], enemy: 'baalpeor',
    refs: ['Numbers 25:3', 'Numbers 25:11'],
    shows: 'What an army and a hired prophet could not do, an invitation did: Israel JOINED HIMSELF unto baalpeor. The defeat that lands is the one that arrives as fellowship.',
  },
  {
    id: 'tp-enemy-host-of-heaven', family: 'enemy-roll', basis: 'named',
    name: 'The host of heaven, divided unto the nations',
    persons: ['father'], enemy: 'host-of-heaven',
    refs: ['Deuteronomy 4:19', 'Deuteronomy 32:8'],
    shows: 'Israel is warned not to be driven to worship the sun, moon and stars WHICH THE LORD THY GOD HATH DIVIDED UNTO ALL NATIONS — and the song says the most High divided to the nations their inheritance. The text states an arrangement over the nations and warns Israel out of it.',
    reticence: 'The Torah states the division and the warning without spelling out the mechanism. We record both statements and stop there.',
  },

  // ── How the enemy works ───────────────────────────────────────────────────
  {
    id: 'tp-method-question', family: 'enemy-method', basis: 'named',
    name: 'Move one — a question about the Word',
    persons: [], enemy: 'serpent',
    refs: ['Genesis 3:1'],
    shows: 'Yea, hath God said. He does not deny that Yahweh exists or spoke; he makes the hearer unsure of WHAT was spoken, and quietly enlarges the restriction while asking.',
  },
  {
    id: 'tp-method-contradiction', family: 'enemy-method', basis: 'named',
    name: 'Move two — the flat contradiction',
    persons: [], enemy: 'serpent',
    refs: ['Genesis 3:4'],
    shows: 'Ye shall not surely die — the first lie in Scripture, and it is a direct reversal of a sentence Yahweh had already spoken. The denial is always of the CONSEQUENCE.',
  },
  {
    id: 'tp-method-promotion', family: 'enemy-method', basis: 'named',
    name: 'Move three — the promotion',
    persons: [], enemy: 'serpent',
    refs: ['Genesis 3:5'],
    shows: 'Ye shall be as gods — an upgrade you are supposedly being kept from. The bait is never presented as a loss; it is always presented as advancement.',
  },
  {
    id: 'tp-method-counterfeit', family: 'enemy-method', basis: 'named',
    name: 'The counterfeit that imitates the real work',
    persons: [], enemy: 'enchantments',
    refs: ['Exodus 7:11', 'Exodus 7:12', 'Exodus 32:4'],
    shows: 'The magicians duplicate the sign; the calf claims the credit for the exodus. The enemy’s preferred shape in these books is not opposition but IMITATION — near enough to be mistaken for the real thing.',
  },
  {
    id: 'tp-method-false-prophet', family: 'enemy-method', basis: 'named',
    name: 'A sign that comes true, from a mouth that leads away',
    persons: [], enemy: 'false-prophets',
    refs: ['Deuteronomy 13:1', 'Deuteronomy 18:12'],
    shows: 'The Torah addresses the hard case directly: a prophet who GIVES a sign or wonder — and the test is not whether the sign works but where the mouth leads. Power is never treated as proof.',
  },
  {
    id: 'tp-method-seduction', family: 'enemy-method', basis: 'named',
    name: 'The invitation that succeeds where the curse failed',
    persons: [], enemy: 'baalpeor',
    refs: ['Numbers 25:3', 'Numbers 22:31'],
    shows: 'The Angel blocks the hired curse with a drawn sword and it fails completely. Then an invitation to a meal and a bed does what the curse could not. Frontal attack fails; fellowship works.',
  },

  // ── Knowing Yahweh did not prevent it ─────────────────────────────────────
  // Darrell, 2026-09-08, mid-build: "the most competent beings got tricked by
  // this guy and they believe there is another Way other than the Words
  // Ways... and they know Yahweh" — then, correcting himself a moment later:
  // "Or they didn't get tricked they are just as evil..."
  //
  // The Torah answers by DISTINGUISHING, and the distinction runs one way: the
  // less access a party had, the more the text names deception; the more access
  // they had, the more it records plain choice. The second message is what the
  // record supports for the well-informed.
  {
    id: 'tp-knowing-eve-beguiled', family: 'knowing', basis: 'named',
    name: 'The one with least access is the one the text calls beguiled',
    persons: ['father'], enemy: 'serpent',
    refs: ['Genesis 3:13', 'Genesis 3:1'],
    shows: 'Eve says the serpent BEGUILED me, and Yahweh does not correct the account. Deception is named exactly once at the start, and it is named for the party who had the word secondhand.',
  },
  {
    id: 'tp-knowing-adam-hearkened', family: 'knowing', basis: 'named',
    name: 'The one who heard the command himself is not called deceived',
    persons: ['father'], enemy: 'serpent',
    refs: ['Genesis 3:17'],
    shows: 'To Adam the reason given is BECAUSE THOU HAST HEARKENED UNTO THE VOICE OF THY WIFE, and hast eaten of the tree OF WHICH I COMMANDED THEE. No beguiling is alleged. He had the command directly, and the charge is listening and eating.',
  },
  {
    id: 'tp-knowing-serpent-knew', family: 'knowing', basis: 'shown',
    name: 'The deceiver was not himself deceived',
    persons: [], enemy: 'serpent',
    refs: ['Genesis 3:1', 'Genesis 3:4'],
    shows: 'His opening line quotes what Yahweh said accurately enough to twist it, and his second flatly reverses a sentence Yahweh had spoken. Nothing in the account suggests he was mistaken about the content.',
    confession: 'We read this as knowing misrepresentation rather than error — he had the word and traded on it. The text records what he said; calling it knowing is our reading of it.',
  },
  {
    id: 'tp-knowing-sons-chose', family: 'knowing', basis: 'named',
    name: 'They saw, and they took, and they chose',
    persons: [], enemy: 'sons-of-god',
    refs: ['Genesis 6:2', 'Genesis 6:4'],
    shows: 'The verbs are all volitional: SAW that they were fair, and they TOOK them wives of all which they CHOSE. No deception appears anywhere in the sentence. Whatever these beings were, the record gives them sight and choice, not a trick.',
    reticence: 'The Torah names them and does not explain them, and it does not say what they had been told. We record the verbs it uses and stop.',
  },
  {
    id: 'tp-knowing-balaam-told-plainly', family: 'knowing', basis: 'named',
    name: 'Balaam — told plainly, and he went back to ask again',
    persons: ['father', 'son', 'spirit'], enemy: 'balaam',
    refs: ['Numbers 22:12', 'Numbers 22:19', 'Numbers 22:31', 'Numbers 24:2', 'Numbers 31:16'],
    shows: 'This is the sharpest case in the five books. Yahweh tells him outright: thou shalt not go, thou shalt not curse, FOR THEY ARE BLESSED. He then asks again. He sees the Angel with the drawn sword and falls on his face. The Spirit of God comes upon him and he prophesies the Star out of Jacob. And afterwards it is BY THE COUNSEL OF BALAAM that Israel is brought down at Peor — he engineered by seduction the ruin he had been forbidden to curse. Direct speech from Yahweh, a visible Angel, and the Spirit Himself did not prevent it.',
  },
  {
    id: 'tp-knowing-strange-fire', family: 'knowing', basis: 'named',
    name: 'Priests who invented a variation He commanded not',
    persons: ['father'], enemy: null,
    refs: ['Leviticus 10:1', 'Leviticus 10:2'],
    shows: 'Nadab and Abihu are Aaron’s own sons, serving at the tabernacle, and they offer strange fire before the LORD, WHICH HE COMMANDED THEM NOT. The offence is not ignorance of the pattern; it is a variation on a pattern they knew.',
  },
  {
    id: 'tp-knowing-korah-near', family: 'knowing', basis: 'named',
    name: 'Nearness itself became the platform for the grab',
    persons: ['father'], enemy: null,
    refs: ['Numbers 16:9', 'Numbers 16:10', 'Numbers 16:48'],
    shows: 'The charge to Korah is that Yahweh had SEPARATED them and BROUGHT THEM NEAR to Himself — and the question is seek ye the priesthood also? The rebellion comes from inside the group with the most access, not from the outside.',
  },
  {
    id: 'tp-knowing-signs-not-enough', family: 'knowing', basis: 'named',
    name: 'All the signs I have shewed among them — and still not believing',
    persons: ['father'], enemy: null,
    refs: ['Numbers 14:11', 'Deuteronomy 29:2', 'Deuteronomy 29:4'],
    shows: 'Yahweh Himself asks how long will it be ere they believe me, FOR ALL THE SIGNS WHICH I HAVE SHEWED AMONG THEM. Moses says ye have seen all that the LORD did BEFORE YOUR EYES — and then adds the line that stops this from becoming a simple lecture: YET THE LORD HATH NOT GIVEN YOU AN HEART TO PERCEIVE. Seeing and perceiving are not the same faculty, and the second is His to give.',
    reticence: 'The Torah holds both halves — full evidence, and a heart not yet given — without resolving the tension for us. We hold both and do not settle it either.',
  },
  {
    id: 'tp-knowing-another-way', family: 'knowing', basis: 'named',
    name: 'The belief that there is another way than His way',
    persons: ['father'], enemy: 'false-prophets',
    refs: ['Deuteronomy 13:1', 'Deuteronomy 32:17', 'Exodus 32:4'],
    shows: 'The Torah keeps naming the same appeal: a sign or a wonder from a mouth that leads elsewhere; NEW GODS THAT CAME NEWLY UP, whom your fathers feared not; and a calf that claims credit for the real rescue. The pull is never toward nothing — it is always toward another way that looks like a way.',
  },

  // ── All of it running at once ─────────────────────────────────────────────
  // The campaigns Darrell asked to SEE: the Father, the Son and the Spirit each
  // visibly at work against a named enemy inside one account.
  {
    id: 'tp-joint-garden', family: 'joint', basis: 'shown',
    name: 'The garden — the whole war opened and sentenced',
    persons: ['father', 'son', 'spirit'], enemy: 'serpent',
    refs: ['Genesis 1:2', 'Genesis 1:26', 'Genesis 3:8', 'Genesis 3:9', 'Genesis 3:15', 'Genesis 3:21'],
    shows: 'The Spirit moves before light; the Godhead says us; a voice WALKS in the garden and calls Where art thou; the enmity is declared and the Seed promised; and a covering is made at the cost of a life. All of it in three chapters, with the enemy present for the sentence.',
    confession: 'We read the One whose voice walks in the garden as the Son. The walking voice is the text’s; the identification is ours.',
  },
  {
    id: 'tp-joint-exodus', family: 'joint', basis: 'named',
    name: 'The exodus — judgement on the gods, an Angel in front, a Spirit for the work',
    persons: ['father', 'son', 'spirit'], enemy: 'gods-of-egypt',
    refs: ['Exodus 12:12', 'Exodus 12:13', 'Exodus 14:19', 'Exodus 14:14', 'Exodus 23:21', 'Exodus 31:3'],
    shows: 'The Father executes judgment against all the gods of Egypt and fights while the people hold their peace; the Angel of God goes before the camp and then moves BEHIND it to stand between Israel and the pursuer, and carries the Name; and the Spirit fills the craftsman who builds the place where Yahweh will dwell among them. Blood covers a household through the whole of it.',
  },
  {
    id: 'tp-joint-wilderness-burden', family: 'joint', basis: 'named',
    name: 'The wilderness — the burden shared and the successor chosen',
    persons: ['father', 'spirit'], enemy: null,
    refs: ['Numbers 11:17', 'Numbers 11:25', 'Numbers 11:29', 'Numbers 27:18'],
    shows: 'Yahweh comes down and takes of the Spirit that is on one man and puts Him on seventy, so the load is carried together — and the next leader is identified by the Spirit being in him. Leadership in the Torah is distributed by the Spirit.',
  },
  {
    id: 'tp-joint-balaam', family: 'joint', basis: 'named',
    name: 'Balaam — the Son blocks the road, the Spirit turns the mouth',
    persons: ['father', 'son', 'spirit'], enemy: 'balaam',
    refs: ['Numbers 22:31', 'Numbers 24:2', 'Numbers 24:17', 'Numbers 25:3'],
    shows: 'The Angel of the LORD stands in the way with a drawn sword and the hired prophet falls on his face; then the Spirit of God comes upon him and blessing comes out, including the Star and the Sceptre. The attempted curse becomes a published prophecy of the King — and the campaign is only won later, by seduction rather than by force.',
  },
  {
    id: 'tp-joint-golden-calf', family: 'joint', basis: 'named',
    name: 'The calf — a counterfeit answered by a mediator who offers himself',
    persons: ['father'], enemy: 'golden-calf',
    refs: ['Exodus 32:4', 'Exodus 32:11', 'Exodus 32:32', 'Deuteronomy 9:18'],
    shows: 'The counterfeit claims credit for the real deliverance; the mediator argues Yahweh’s own covenant back to Him, offers to be blotted out instead of the people, and lies before Yahweh forty days. The likeness of the self-giving Godhead shows up in the man standing between.',
  },
];

// --- Derivations ------------------------------------------------------------
// Everything the surface shows is COMPUTED from TORAH_PATTERNS. Nothing about
// coverage is hand-typed, so a count can never drift from the patterns under it
// (DR-0121: no static data on a surface whose value is trust).

const REF_RE = /^(.+?)\s+(\d+):(\d+)$/;

/** The book named by a ref, or null if it does not parse. */
export function bookOfRef(ref) {
  const m = REF_RE.exec(String(ref || '').trim());
  return m ? m[1].trim() : null;
}

/** The books a pattern touches, DERIVED from its refs and kept in Torah order. */
export function booksOf(pattern) {
  const seen = new Set((pattern?.refs || []).map(bookOfRef).filter(Boolean));
  return TORAH_BOOKS.filter((b) => seen.has(b));
}

/** Every ref in the map, flattened — the gate verifies each one verbatim. */
export function allRefs() {
  return TORAH_PATTERNS.flatMap((p) => p.refs || []);
}

/** Patterns in one family, in declaration order. */
export function patternsInFamily(familyId) {
  return TORAH_PATTERNS.filter((p) => p.family === familyId);
}

/** Families that actually carry patterns, each with its count — no empty rows. */
export function familyCoverage() {
  return FAMILIES
    .map((f) => ({ ...f, count: patternsInFamily(f.id).length }))
    .filter((f) => f.count > 0);
}

/** For each of the five books: how many patterns cite it. Derived from refs. */
export function bookCoverage() {
  return TORAH_BOOKS.map((book) => ({
    book,
    count: TORAH_PATTERNS.filter((p) => booksOf(p).includes(book)).length,
  }));
}

/** For each Person: how many patterns show them visibly at work. */
export function personCoverage() {
  return PERSONS.map((person) => ({
    ...person,
    count: TORAH_PATTERNS.filter((p) => (p.persons || []).includes(person.id)).length,
  }));
}

/**
 * The patterns where MORE THAN ONE Person is visibly at work in the same
 * account — the relationships Darrell asked to see, rather than three separate
 * lists that never touch.
 */
export function jointPatterns(minPersons = 2) {
  return TORAH_PATTERNS.filter((p) => (p.persons || []).length >= minPersons);
}

/** The patterns where ALL THREE are at work together. */
export function allThreePatterns() {
  return jointPatterns(3);
}

/**
 * The enemy roll: every distinct enemy the map names, with the patterns that
 * name it. Derived, so an enemy cannot appear in a list without a pattern.
 */
export function enemyRoll() {
  const byEnemy = new Map();
  for (const p of TORAH_PATTERNS) {
    if (!p.enemy) continue;
    if (!byEnemy.has(p.enemy)) byEnemy.set(p.enemy, []);
    byEnemy.get(p.enemy).push(p);
  }
  return [...byEnemy.entries()]
    .map(([enemy, patterns]) => ({
      enemy,
      count: patterns.length,
      refs: [...new Set(patterns.flatMap((p) => p.refs))],
    }))
    .sort((a, b) => b.count - a.count || a.enemy.localeCompare(b.enemy));
}

/** Patterns whose basis is 'shown' — where our reading is stated as ours. */
export function confessedPatterns() {
  return TORAH_PATTERNS.filter((p) => p.basis === 'shown');
}

/** Patterns that record a place the text is silent and we stop with it. */
export function reticentPatterns() {
  return TORAH_PATTERNS.filter((p) => p.reticence);
}

/** The headline numbers, all derived. */
export function mapSummary() {
  return {
    patterns: TORAH_PATTERNS.length,
    families: familyCoverage().length,
    refs: new Set(allRefs()).size,
    books: TORAH_BOOKS.length,
    named: TORAH_PATTERNS.filter((p) => p.basis === 'named').length,
    shown: confessedPatterns().length,
    joint: jointPatterns().length,
    allThree: allThreePatterns().length,
    enemies: enemyRoll().length,
  };
}
