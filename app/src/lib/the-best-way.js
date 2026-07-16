// =============================================================================
// the-best-way — "Yahweh's Best Way: Preferred vs Accepted vs Natural vs Against"
// =============================================================================
// Darrell 2026-07-15: "all lessons from the biblical scriptures that incorporate
// the Best Way -- Yahweh['s] preferred vs accepted vs natural vs against --
// comprehensive review." A Scripture framework that reads a life-domain through
// FOUR tiers of God's will, so a reader can always find the BEST Way and see
// honestly where a lesser way is merely permitted.
//
// THE FOUR TIERS -- and Scripture gives three of them in one verse. "prove what
// is that good, and acceptable, and perfect, will of God" (Romans 12:2):
//   • PREFERRED -- His BEST / perfect will; what He most desires ("perfect").
//     "from the beginning it was not so" (Matthew 19:8).
//   • ACCEPTED  -- what He PERMITS as a concession to human weakness; allowed,
//     not His best ("acceptable"; "Moses ... suffered you ... for the hardness
//     of your hearts", Matthew 19:8).
//   • NATURAL   -- the created order / general revelation; how He built things to
//     work ("good"; "the invisible things of him ... clearly seen", Romans 1:20).
//   • AGAINST   -- what He opposes, forbids, or hates.
//
// This is the DATA SPINE a "Best Way" study/lesson and any surface read from --
// one source (DR-0079). It is a GROWING catalog (domains are added as the house
// teaches more), not a claim to be exhaustive.
//
// VERIFICATION (DR-0076): every `anchor.text` is KJV VERBATIM from
// app/public/bible/kjv, guarded by the-best-way.test.js. WORD-FIRST (DR-0098):
// it teaches the tiers from Scripture's own usage; where a domain has genuinely
// contested edges, that is named and left to the SME (Darrell / Bishop Gwin),
// not settled here. It ships like any content and is reviewed LIVE on production
// (DR-0104).
// =============================================================================

// The master frame -- the verse that names three of the four tiers at once, and
// the clearest preferred-vs-accepted contrast in the Gospels.
export const BEST_WAY_FRAME = Object.freeze([
  { ref: 'Romans 12:2', text: 'And be not conformed to this world: but be ye transformed by the renewing of your mind, that ye may prove what is that good, and acceptable, and perfect, will of God.' },
  { ref: 'Matthew 19:8', text: 'He saith unto them, Moses because of the hardness of your hearts suffered you to put away your wives: but from the beginning it was not so.' },
]);

// The tier order, best -> worst, so a surface can always render in this sequence.
export const BEST_WAY_TIERS = Object.freeze(['preferred', 'accepted', 'natural', 'against']);

export const BEST_WAY_TIER_LABEL = Object.freeze({
  preferred: 'Preferred — His best',
  accepted: 'Accepted — permitted',
  natural: 'Natural — the created order',
  against: 'Against — what He opposes',
});

// Each domain reads one area of life through the four tiers. A tier = a plain
// summary + KJV-verbatim anchors.
export const BEST_WAY_DOMAINS = Object.freeze([
  {
    id: 'marriage',
    title: 'Marriage & Divorce',
    question: 'What is Yahweh’s best for the joining of a man and a woman?',
    tiers: {
      preferred: {
        summary: 'One flesh, for life -- a man leaves, cleaves, and the two become one; what God joined, let no man put asunder. "From the beginning it was not so" that they part.',
        anchors: [
          { ref: 'Genesis 2:24', text: 'Therefore shall a man leave his father and his mother, and shall cleave unto his wife: and they shall be one flesh.' },
          { ref: 'Matthew 19:4-6', text: 'And he answered and said unto them, Have ye not read, that he which made them at the beginning made them male and female, And said, For this cause shall a man leave father and mother, and shall cleave to his wife: and they twain shall be one flesh? Wherefore they are no more twain, but one flesh. What therefore God hath joined together, let not man put asunder.' },
        ],
      },
      accepted: {
        summary: 'Divorce was PERMITTED -- a bill of divorcement -- but only "because of the hardness of your hearts," a concession to human weakness, never the best.',
        anchors: [
          { ref: 'Deuteronomy 24:1', text: 'When a man hath taken a wife, and married her, and it come to pass that she find no favour in his eyes, because he hath found some uncleanness in her: then let him write her a bill of divorcement, and give it in her hand, and send her out of his house.' },
          { ref: 'Matthew 19:8', text: 'He saith unto them, Moses because of the hardness of your hearts suffered you to put away your wives: but from the beginning it was not so.' },
        ],
      },
      natural: {
        summary: 'The created order it rests on: God made humanity male and female, to leave, cleave, and become one -- marriage is written into how He made us.',
        anchors: [
          { ref: 'Genesis 1:27', text: 'So God created man in his own image, in the image of God created he him; male and female created he them.' },
        ],
      },
      against: {
        summary: 'Treachery in the covenant: He "hateth putting away" done wrongfully and the violence and faithlessness that break the one flesh.',
        anchors: [
          { ref: 'Malachi 2:16', text: 'For the LORD, the God of Israel, saith that he hateth putting away: for one covereth violence with his garment, saith the LORD of hosts: therefore take heed to your spirit, that ye deal not treacherously.' },
        ],
      },
    },
  },
  {
    id: 'leadership',
    title: 'Who Rules -- Yahweh or a King',
    question: 'Who did Yahweh want as Israel’s king?',
    tiers: {
      preferred: {
        summary: 'Yahweh Himself as King. When Israel demanded a human king, He named it plainly: "they have rejected me, that I should not reign over them."',
        anchors: [
          { ref: '1 Samuel 8:7', text: 'And the LORD said unto Samuel, Hearken unto the voice of the people in all that they say unto thee: for they have not rejected thee, but they have rejected me, that I should not reign over them.' },
          { ref: '1 Samuel 12:12', text: 'And when ye saw that Nahash the king of the children of Ammon came against you, ye said unto me, Nay; but a king shall reign over us: when the LORD your God was your king.' },
        ],
      },
      accepted: {
        summary: 'He PERMITTED the king they insisted on -- "hearken unto their voice" -- but with a solemn warning about what that king would cost them. Allowed, not preferred.',
        anchors: [
          { ref: '1 Samuel 8:9', text: 'Now therefore hearken unto their voice: howbeit yet protest solemnly unto them, and shew them the manner of the king that shall reign over them.' },
        ],
      },
      natural: {
        summary: 'Ordered authority is part of how He built the world; "the powers that be are ordained of God" -- government itself is not the rebellion, rejecting HIS reign was.',
        anchors: [
          { ref: 'Romans 13:1', text: 'Let every soul be subject unto the higher powers. For there is no power but of God: the powers that be are ordained of God.' },
        ],
      },
      against: {
        summary: 'The heart under the demand: rejecting Yahweh as King -- trading His direct reign for a ruler like the nations around them.',
        anchors: [
          { ref: '1 Samuel 8:7', text: 'And the LORD said unto Samuel, Hearken unto the voice of the people in all that they say unto thee: for they have not rejected thee, but they have rejected me, that I should not reign over them.' },
        ],
      },
    },
  },
  {
    id: 'worship',
    title: 'Sacrifice or Obedience',
    question: 'What does Yahweh most want from His people’s worship?',
    tiers: {
      preferred: {
        summary: 'To OBEY, to love mercy, to know Him and walk humbly -- "to obey is better than sacrifice"; "I desired mercy, and not sacrifice."',
        anchors: [
          { ref: '1 Samuel 15:22', text: 'And Samuel said, Hath the LORD as great delight in burnt offerings and sacrifices, as in obeying the voice of the LORD? Behold, to obey is better than sacrifice, and to hearken than the fat of rams.' },
          { ref: 'Hosea 6:6', text: 'For I desired mercy, and not sacrifice; and the knowledge of God more than burnt offerings.' },
          { ref: 'Micah 6:8', text: 'He hath shewed thee, O man, what is good; and what doth the LORD require of thee, but to do justly, and to love mercy, and to walk humbly with thy God?' },
        ],
      },
      accepted: {
        summary: 'The sacrifices and offerings He Himself commanded were real and accepted -- but as the servant of obedience, never a substitute for it.',
        anchors: [
          { ref: 'Micah 6:8', text: 'He hath shewed thee, O man, what is good; and what doth the LORD require of thee, but to do justly, and to love mercy, and to walk humbly with thy God?' },
        ],
      },
      natural: {
        summary: 'Even without the Law, creation itself testifies of Him -- "the invisible things of him ... clearly seen" -- so all are "without excuse" to honour Him.',
        anchors: [
          { ref: 'Romans 1:20', text: 'For the invisible things of him from the creation of the world are clearly seen, being understood by the things that are made, even his eternal power and Godhead; so that they are without excuse:' },
        ],
      },
      against: {
        summary: 'Ritual without obedience -- a multitude of sacrifices from a disobedient heart -- He rejects: "to what purpose is the multitude of your sacrifices unto me?"',
        anchors: [
          { ref: 'Isaiah 1:11', text: 'To what purpose is the multitude of your sacrifices unto me? saith the LORD: I am full of the burnt offerings of rams, and the fat of fed beasts; and I delight not in the blood of bullocks, or of lambs, or of he goats.' },
        ],
      },
    },
  },
  {
    id: 'food',
    title: 'What We Eat',
    question: 'What is Yahweh’s Way with food?',
    tiers: {
      preferred: {
        summary: 'At the beginning He gave the seed-bearing herb and fruit -- the original provision, before the flood.',
        anchors: [
          { ref: 'Genesis 1:29', text: 'And God said, Behold, I have given you every herb bearing seed, which is upon the face of all the earth, and every tree, in the which is the fruit of a tree yielding seed; to you it shall be for meat.' },
        ],
      },
      accepted: {
        summary: 'After the flood He GAVE every moving thing for food; "every creature of God is good, and nothing to be refused, if it be received with thanksgiving." Liberty, held with gratitude -- and without judging one another over it.',
        anchors: [
          { ref: 'Genesis 9:3', text: 'Every moving thing that liveth shall be meat for you; even as the green herb have I given you all things.' },
          { ref: '1 Timothy 4:4', text: 'For every creature of God is good, and nothing to be refused, if it be received with thanksgiving:' },
          { ref: 'Romans 14:3', text: 'Let not him that eateth despise him that eateth not; and let not him which eateth not judge him that eateth: for God hath received him.' },
        ],
      },
      natural: {
        summary: 'The body He made needs food, and His creation supplies it -- eating is part of the natural order, received as His provision.',
        anchors: [
          { ref: 'Genesis 9:3', text: 'Every moving thing that liveth shall be meat for you; even as the green herb have I given you all things.' },
        ],
      },
      against: {
        summary: 'Gluttony and drunkenness -- appetite without restraint -- He warns against: "the drunkard and the glutton shall come to poverty."',
        anchors: [
          { ref: 'Proverbs 23:20-21', text: 'Be not among winebibbers; among riotous eaters of flesh: For the drunkard and the glutton shall come to poverty: and drowsiness shall clothe a man with rags.' },
        ],
      },
    },
  },
  {
    id: 'wealth',
    title: 'Money & Provision',
    question: 'What is Yahweh’s best Way with wealth?',
    tiers: {
      preferred: {
        summary: 'Seek FIRST the kingdom of God and His righteousness, and the rest is added -- His kingdom first, provision follows.',
        anchors: [
          { ref: 'Matthew 6:33', text: 'But seek ye first the kingdom of God, and his righteousness; and all these things shall be added unto you.' },
        ],
      },
      accepted: {
        summary: 'Wealth honestly held is not condemned -- it is He who "giveth thee power to get wealth," to establish His covenant. Provision is accepted as a stewardship under Him.',
        anchors: [
          { ref: 'Deuteronomy 8:18', text: 'But thou shalt remember the LORD thy God: for it is he that giveth thee power to get wealth, that he may establish his covenant which he sware unto thy fathers, as it is this day.' },
        ],
      },
      natural: {
        summary: 'Work and provision are the natural order He set -- "if any would not work, neither should he eat." Labour feeds the body by design.',
        anchors: [
          { ref: '2 Thessalonians 3:10', text: 'For even when we were with you, this we commanded you, that if any would not work, neither should he eat.' },
        ],
      },
      against: {
        summary: 'The LOVE of money -- serving mammon instead of God -- He sets against: "the love of money is the root of all evil"; "ye cannot serve God and mammon."',
        anchors: [
          { ref: '1 Timothy 6:10', text: 'For the love of money is the root of all evil: which while some coveted after, they have erred from the faith, and pierced themselves through with many sorrows.' },
          { ref: 'Matthew 6:24', text: 'No man can serve two masters: for either he will hate the one, and love the other; or else he will hold to the one, and despise the other. Ye cannot serve God and mammon.' },
        ],
      },
    },
  },
  {
    id: 'speech',
    title: 'How We Speak',
    question: 'What is Yahweh’s best Way with the tongue?',
    tiers: {
      preferred: {
        summary: 'Speech that builds and ministers grace -- "that which is good to the use of edifying, that it may minister grace unto the hearers," always with grace, seasoned with salt.',
        anchors: [
          { ref: 'Ephesians 4:29', text: 'Let no corrupt communication proceed out of your mouth, but that which is good to the use of edifying, that it may minister grace unto the hearers.' },
          { ref: 'Colossians 4:6', text: 'Let your speech be alway with grace, seasoned with salt, that ye may know how ye ought to answer every man.' },
        ],
      },
      accepted: {
        summary: 'A fitting, gracious answer "to every man" -- honest, plain speech in season is welcomed, so long as it edifies and carries grace.',
        anchors: [
          { ref: 'Colossians 4:6', text: 'Let your speech be alway with grace, seasoned with salt, that ye may know how ye ought to answer every man.' },
        ],
      },
      natural: {
        summary: 'The tongue reveals the heart by nature -- "out of the abundance of the heart the mouth speaketh." Speech is the outflow of what is within.',
        anchors: [
          { ref: 'Matthew 12:34', text: 'O generation of vipers, how can ye, being evil, speak good things? for out of the abundance of the heart the mouth speaketh.' },
        ],
      },
      against: {
        summary: 'Corrupt speech, and specifically what "the LORD hate[s]" -- a lying tongue, a false witness, and sowing discord among brethren.',
        anchors: [
          { ref: 'Ephesians 4:29', text: 'Let no corrupt communication proceed out of your mouth, but that which is good to the use of edifying, that it may minister grace unto the hearers.' },
          { ref: 'Proverbs 6:16-19', text: 'These six things doth the LORD hate: yea, seven are an abomination unto him: A proud look, a lying tongue, and hands that shed innocent blood, An heart that deviseth wicked imaginations, feet that be swift in running to mischief, A false witness that speaketh lies, and he that soweth discord among brethren.' },
        ],
      },
    },
  },
]);

// ---------------------------------------------------------------------------
// Helpers -- pure, unit-testable, thin surfaces.
// ---------------------------------------------------------------------------

/** All domains. */
export function listDomains() {
  return BEST_WAY_DOMAINS.slice();
}

/** One domain by id, or null. */
export function getDomain(id) {
  return BEST_WAY_DOMAINS.find((d) => d.id === id) || null;
}

/** A domain's tiers, always best -> worst (preferred, accepted, natural, against). */
export function tiersInOrder(domain) {
  if (!domain || !domain.tiers) return [];
  return BEST_WAY_TIERS.map((key) => ({ key, label: BEST_WAY_TIER_LABEL[key], ...domain.tiers[key] }));
}

/** Every anchor across the frame + all domains (for the verbatim guard). */
export function allBestWayAnchors() {
  const out = [...BEST_WAY_FRAME];
  for (const d of BEST_WAY_DOMAINS) {
    for (const key of BEST_WAY_TIERS) out.push(...d.tiers[key].anchors);
  }
  return out;
}
