// =============================================================================
// legacy-provisions-course — "Secure the Legacy: The Provisions That Hold"
// =============================================================================
// Darrell 2026-09-02, speaking three trust provisions into the app (the standing
// SPOKEN-TEACHINGS-ARE-BUILD-INPUT rule, CLAUDE.md 2026-07-03): the family trust
// carries (1) a reference to the family CONSTITUTION, (2) a SPENDTHRIFT
// provision, and (3) FORCED INCOME PRODUCTION baked in — beneficiaries do not
// merely take distributions, they learn to produce, build, invest, and contribute
// value back. He named the reason himself: "if you pass down money without
// passing down principles, there's a good chance the wealth disappears by the
// second or even third generation."
//
// WHY IT IS A FREE COURSE HERE. The teaching arrived as a funnel — a countdown
// timer over a "free masterclass" whose seat costs an email address and whose
// real product is the upsell. The substance is sound; the delivery is a toll
// booth on the thing a family most needs. PoeTech's answer is the substance with
// no toll booth: the whole teaching, in the app, free, age-adaptive, and paired
// with the WORKING SYSTEM (lib/family-trust.js) so a family does not merely hear
// about the provisions — it operates them.
//
// SAME SHARED FRAMEWORK as its sibling Learn courses (church-classes.js helpers,
// learn-framework age bands + quiz, class-tutor). Self-paced: no cohort dates.
// Age-adaptive: every lesson carries levels.child / levels.senior so a nine-year
// old heir and a grown successor each meet the SAME truth at the right depth —
// which is the point, since the whole doctrine here is that the principles must
// travel to the generation that will hold the money.
//
// PAIRS WITH (not a duplicate of) succession-class.js ("Handed Forward"). That
// course forms the HEIR — know the God of your father, read the real books.
// This one teaches the STRUCTURE the heir will inherit: the document, the wall
// around it, and the production requirement inside it. Heir, then instrument.
//
// NOT LEGAL ADVICE — stated in the material, not buried (DR-0076 honest
// uncertainty). Trust law is state-specific; a spendthrift clause does not defeat
// every creditor (child support, certain government claims and self-settled
// trusts are the standard exceptions), and only a licensed estate attorney in
// your own state drafts and executes the instrument. This course teaches what the
// provisions DO and how a family operates them; it never claims to be the deed.
//
// VERIFICATION (DR-0076 / SCRIPTURE-REFERENCE-STANDARD): every KJV fragment
// quoted below was fetched VERBATIM from the repository's public-domain KJV
// (app/public/bible/kjv/*.json) — no verse from memory, no paraphrase presented
// as a translation. legacy-provisions-course.test.js re-pins the exact fragments
// so a later edit cannot drift the text and still ship.
// =============================================================================

import {
  buildScheduleFor, progressSummaryFor, exportCurriculumMarkdownFor,
} from './church-classes.js';

// The honest boundary, carried on the meta so every surface that renders this
// course renders the limit with it — never a footnote a reader can miss.
export const LEGACY_PROVISIONS_CARE_NOTE =
  'Teaching, not legal advice. Trust law is state-specific and a spendthrift clause is strong but not absolute — child support, certain government claims, and a trust you fund for yourself are the usual exceptions. Use this course to know what to ask for and how to run it; have a licensed estate attorney in your own state draft and execute the instrument.';

export const LEGACY_PROVISIONS_META = {
  key: 'legacy-provisions',
  title: 'Secure the Legacy: The Provisions That Hold',
  audience: 'the whole house — the parents writing the trust and the children who will one day live under it, taught at every age',
  tagline: 'Money without principles does not survive the grandchildren. Write the principles into the instrument.',
  // WORD-FIRST, DECLARED (DR-0127 / DR-0282). Inheritance is charged material —
  // it opens under Yahweh's frame, chosen for this space, not inherited from
  // whichever lesson happens to sit first. Both texts are VERBATIM from the
  // repo's KJV and pinned in the course test.
  wordFirst: {
    ref: 'Proverbs 13:22; Ecclesiastes 5:13-14',
    frame: 'Yahweh sets the AIM three generations out — "A good man leaveth an inheritance to his children’s children" — so an estate that dies with the children never reached His target at all. And He names the failure mode before any planner does: "There is a sore evil which I have seen under the sun, namely, riches kept for the owners thereof to their hurt. But those riches perish by evil travail: and he begetteth a son, and there is nothing in his hand." Wealth that is only KEPT hurts its owner and arrives empty in the son’s hand. The provisions in this course are not clever lawyering; they are structure serving His aim.',
  },
  format: 'Self-paced · 7 lessons · read one a week or all in an afternoon · paced to your age',
  cadenceDays: 7,
  weeks: 7,
  handsOnLabel: 'Work it in the app',
  unit: {
    noun: 'lesson',
    nounPlural: 'lessons',
    cap: 'Lesson',
    selfPaced: true,
    sessionLabel: 'How to run it (family table or one-on-one)',
    countNoun: 'lesson',
  },
  blurb: 'The three provisions that decide whether an inheritance survives: the family constitution the trust POINTS AT (principles travel with the money, or the money leaves), the spendthrift provision (the wall against creditors, lawsuits, a bad deal, and the wrong marriage — because the asset is owned by the trust, not by the beneficiary personally), and forced income production (an heir who only takes is being trained to consume the thing they were given to steward). Free, in full, with the working system beside it — no seat to claim, no email to surrender, no upsell.',
  care: LEGACY_PROVISIONS_CARE_NOTE,
  footer: '_Taught by Darrell Poe · the Poe family + The Church of the Living God · built on PoeTech. The soul first, then the finances. We hand down principles WITH the money, we build a wall the wolves cannot cross, and we require the next hand to produce before it takes — then we teach your house to do the same. Teaching, not legal advice: your own attorney drafts the instrument._',
};

export const LEGACY_PROVISIONS_SESSION_FLOW = [
  { minutes: 5, name: 'Prayer + the anchor' },
  { minutes: 10, name: 'The provision in one sentence' },
  { minutes: 15, name: 'Teach it — what it does and what it does not do' },
  { minutes: 20, name: 'Work it in the app (the real family record)' },
  { minutes: 10, name: 'Family discussion' },
  { minutes: 5, name: 'Send-off + solo task' },
];
export const LEGACY_PROVISIONS_SESSION_MINUTES =
  LEGACY_PROVISIONS_SESSION_FLOW.reduce((t, s) => t + s.minutes, 0); // 65

export const LEGACY_PROVISIONS_MODULES = [
  {
    id: 'legacy1-why-it-vanishes',
    title: 'Why it vanishes by the third generation',
    bigIdea: 'Money handed down without principles handed down with it does not survive. The estate is not lost to taxes first — it is lost to a generation that received the balance and never received the way of thinking that produced it.',
    inApp: 'Open the Legacy Provisions system on the family plan. Read the family constitution articles our house has already written, and notice what is being handed down alongside every dollar: a mission, a standard, and a way of deciding.',
    anchor: { ref: 'Ecclesiastes 5:13-14; Proverbs 20:21; Luke 15:13', theme: 'Riches kept for their owners to their hurt, perishing so that a son is born into an empty hand; an inheritance gotten hastily whose end is not blessed; and a younger son in a far country wasting his substance. Yahweh diagnosed the generational wipeout long before any planner charted it — and the cure is never a bigger balance, it is a formed heir.' },
    levels: {
      child: 'Imagine someone gives you a big bag of money but never teaches you how money works. What happens? It is gone fast, and you feel worse than before, because now you also feel foolish. That is why our family does not just hand down money — we hand down HOW WE THINK about money first. The Bible tells a true story about a son who took his share, went far away, and wasted all of it (Luke 15:13). He had the money. He did not have the wisdom yet. Your job: name one money rule our family lives by, in your own words.',
      senior: 'The pattern has a name in every planning office — shirtsleeves to shirtsleeves in three generations — and it is not primarily a tax problem. Yahweh wrote the diagnosis first: "There is a sore evil which I have seen under the sun, namely, riches kept for the owners thereof to their hurt. But those riches perish by evil travail: and he begetteth a son, and there is nothing in his hand" (Ecclesiastes 5:13-14). Read what that verse actually indicts — riches KEPT, held rather than stewarded, hurting the holder and arriving empty in the next hand. Add the speed problem: "An inheritance may be gotten hastily at the beginning; but the end thereof shall not be blessed" (Proverbs 20:21), and the far-country problem: "the younger son gathered all together, and took his journey into a far country, and there wasted his substance with riotous living" (Luke 15:13). The prodigal did not fail because his father was poor; he failed because he received a balance without a formation. The three provisions in this course exist to make that transfer impossible to do carelessly: the constitution hands down the thinking, the spendthrift wall protects the asset from what the heir cannot yet see coming, and the production requirement forms the heir into someone who adds rather than only draws.',
    },
    quiz: {
      questions: [
        { q: 'What is the FIRST threat to generational wealth this course names?', options: ['Taxes', 'A generation that received the money without receiving the principles', 'Inflation'], answer: 1, explain: 'Darrell 2026-09-02: pass down money without passing down principles and the wealth likely disappears by the second or third generation.' },
        { q: 'What does Ecclesiastes 5:13-14 say happens to riches that are merely KEPT?', options: ['They multiply on their own', 'They are kept to the owners’ hurt, perish, and the son is born into an empty hand', 'They are always taxed away'], answer: 1, explain: 'Yahweh names the failure mode: hoarded wealth hurts the holder and arrives empty in the next hand.' },
      ],
    },
    lesson: 'Ask a family what threatens the money they are handing down and almost every one says taxes. Taxes are real, and a good structure answers them — but they are rarely what empties an estate. What empties an estate is a transfer of BALANCE without a transfer of FORMATION. Yahweh said so plainly, and long before the planning industry charted it: "There is a sore evil which I have seen under the sun, namely, riches kept for the owners thereof to their hurt. But those riches perish by evil travail: and he begetteth a son, and there is nothing in his hand" (Ecclesiastes 5:13-14). Two indictments sit in that sentence. First, riches KEPT — held, hoarded, guarded rather than stewarded — hurt the one holding them. Second, they perish in such a way that the next generation is born into an empty hand. Solomon adds the speed problem: "An inheritance may be gotten hastily at the beginning; but the end thereof shall not be blessed" (Proverbs 20:21). And Jesus tells the whole arc in one line about a son with a full share and an unformed heart: "the younger son gathered all together, and took his journey into a far country, and there wasted his substance with riotous living" (Luke 15:13). Notice what none of those texts blame. Not the size of the estate. Not the tax code. The failure is upstream of the money — it is in the heir, and in what the parent did or did not transfer alongside the account. So a family that is serious does two things at once: it forms the heir, and it structures the instrument so that formation is not optional. That is what the next three lessons are: three provisions, each answering a different way an inheritance is lost. The constitution answers "they never learned how we think." The spendthrift provision answers "someone else took it." The forced-production provision answers "they only ever drew from it." Yahweh set the aim three generations out — "A good man leaveth an inheritance to his children’s children" (Proverbs 13:22) — and an estate that dies with your children never reached His target, no matter how large it was on the day you signed.',
    facilitator: {
      talkingPoints: [
        'The first threat is not taxes — it is a transfer of balance without a transfer of formation.',
        'Ecclesiastes 5:13-14 names the exact failure: riches kept to the owner’s hurt, an empty hand in the next generation.',
        'Proverbs 20:21 — speed without formation ends unblessed; Luke 15:13 — a full share in an unformed hand.',
        'Proverbs 13:22 sets the target at the GRANDchildren, so an estate that dies with the children missed the aim.',
      ],
      howToRun: 'Prayer + anchor (5): pray; read Ecclesiastes 5:13-14. | The provision in a sentence (10): money without principles does not survive the grandchildren. | Teach (15): the three ways an inheritance is lost — never learned, taken by others, only drawn from. | Work it in the app (20): open the Legacy Provisions system and read our family constitution articles aloud. | Discussion (10): which of the three losses is the biggest risk for OUR house? | Send-off (5): solo task — write one money principle you would want to survive you.',
      discussionPrompts: [
        'Why does a bigger balance not solve the third-generation problem?',
        'What did the prodigal have, and what did he lack?',
        'What are we handing down right now besides money?',
      ],
    },
  },
  {
    id: 'legacy2-constitution',
    title: 'Provision One — the trust points at the family constitution',
    bigIdea: 'The trust references a private family constitution: our values, mission, standards, and expectations around wealth, business, investing, and legacy. The instrument moves the assets; the constitution moves the principles — and only one of those two survives a generation that never met you.',
    inApp: 'Open the Legacy Provisions system. Every article of our family constitution is written there, article by article, with the Scripture it stands on — and each heir can attest that they have read it. What is unattested shows as unattested; the surface never assumes it was read.',
    anchor: { ref: 'Deuteronomy 6:6-9; Joshua 24:15; Habakkuk 2:2', theme: 'The words go in the heart first, then are taught diligently to the children in every ordinary hour and written on the posts of the house; a head of house declares publicly whom his household will serve; and the vision is WRITTEN and made plain so the one who reads it can run with it. Yahweh’s own method for generational transfer is a written, taught, household-wide standard — which is exactly what a family constitution is.' },
    levels: {
      child: 'A constitution is the rulebook a family agrees to live by — what we believe, what we will not do, how we treat money, and what we are here for. Ours is written down so nobody has to guess, and so it still works when the people who wrote it are not in the room. Yahweh told parents to teach His words all day long — sitting at home, walking on the road, lying down, getting up — and even to write them on the doorposts of the house (Deuteronomy 6:7-9). Written down and talked about constantly. That is what our constitution is. Your job: read one article of it out loud with a grown-up and say it back in your own words.',
      senior: 'The family constitution is a private document — it is not filed, not public, and not the trust itself. The trust REFERENCES it, which is the whole design: the legal instrument moves assets, and the referenced constitution moves the thinking that is supposed to govern those assets. It states our values, our mission, our standards and expectations around wealth, business, investing, and legacy — so that a trustee reading the instrument, and an heir reading their obligations, both meet the family’s mind and not merely its balance sheet. This is Yahweh’s own transfer method, not a modern innovation. He commanded the words be in the parent’s heart first, then taught diligently in the ordinary hours of the day — "when thou sittest in thine house, and when thou walkest by the way, and when thou liest down, and when thou risest up" — and then physically written: "thou shalt write them upon the posts of thy house, and on thy gates" (Deuteronomy 6:6-9). He had Joshua make the household declaration explicit and public: "but as for me and my house, we will serve the LORD" (Joshua 24:15). And He gave the reason a vision must be WRITTEN rather than merely felt: "Write the vision, and make it plain upon tables, that he may run that readeth it" (Habakkuk 2:2). A principle you never wrote down cannot be inherited; it can only be remembered, and memory does not survive to the grandchildren. Write it plain, so the one who reads it can run.',
    },
    quiz: {
      questions: [
        { q: 'What is the relationship between the trust and the family constitution?', options: ['They are the same document', 'The trust REFERENCES the constitution — the instrument moves assets, the constitution carries the values, mission, and standards', 'The constitution replaces the trust'], answer: 1, explain: 'A private referenced document: principles travel with the assets instead of being lost with the founder.' },
        { q: 'What does Habakkuk 2:2 give as the reason to WRITE the vision?', options: ['So it can be framed', 'So that he may run that readeth it — a written, plain vision can be carried and acted on by whoever reads it', 'So it can be sold'], answer: 1, explain: 'An unwritten principle cannot be inherited; a plainly written one can be run with by the next reader.' },
      ],
    },
    lesson: 'The first provision costs nothing legally and decides almost everything practically: our trust references a family constitution. It is a private document — not filed anywhere, not public — that states our values, our mission, our standards, and our expectations around wealth, business, investing, and legacy. Why bother, when the trust already has legal force? Because the trust can only move assets. It cannot transmit judgment. A trustee who never met the founder, an heir born after the founder died, a spouse marrying into the family thirty years from now — each of them can read the instrument and learn exactly what they receive, and learn nothing whatsoever about why any of it was built or how this family decides. The constitution closes that gap, and Yahweh Himself set the pattern. His instruction for generational transfer was never "leave them a sum." It was: put the words in your own heart first, then "thou shalt teach them diligently unto thy children, and shalt talk of them when thou sittest in thine house, and when thou walkest by the way, and when thou liest down, and when thou risest up" — the ordinary hours, not a ceremony — and then make it physical and permanent: "thou shalt write them upon the posts of thy house, and on thy gates" (Deuteronomy 6:6-9). He had a head of household declare it out loud in front of everybody: "but as for me and my house, we will serve the LORD" (Joshua 24:15). And He gave the operational reason for writing rather than merely intending: "Write the vision, and make it plain upon tables, that he may run that readeth it" (Habakkuk 2:2). That last clause is the entire case for a family constitution. The point of writing it plainly is that someone who was not there can pick it up and RUN with it. An unwritten principle dies with the person who held it. A written one can be inherited, attested, taught to a child, handed to a trustee, and read aloud at a family table forty years from now. In our app, the constitution is not a PDF in a drawer — it is the first section of the Legacy Provisions system, article by article, each with the Scripture it stands on, and each heir attests to having read it. An article nobody has attested shows plainly as unattested, because a family that pretends its principles were received has already begun losing them.',
    facilitator: {
      talkingPoints: [
        'The trust moves assets; the referenced constitution moves values, mission, standards, and expectations.',
        'It is PRIVATE — not filed, not public — and it speaks to trustees and heirs who never met the founder.',
        'Deuteronomy 6:6-9 is the method: heart first, taught in ordinary hours, then written on the house.',
        'Habakkuk 2:2 gives the reason to write: so the one who READS it can run with it.',
      ],
      howToRun: 'Prayer + anchor (5): pray; read Deuteronomy 6:6-9. | The provision in a sentence (10): the trust points at a written family constitution. | Teach (15): what belongs in it — values, mission, standards for wealth, business, investing, legacy. | Work it in the app (20): read our articles; each heir attests to the ones they have read. | Discussion (10): which article is hardest to live, and why? | Send-off (5): solo task — draft one article you believe is missing.',
      discussionPrompts: [
        'What would a trustee who never met us learn about this family from the trust alone?',
        'Which of our articles would a stranger most misunderstand without the Scripture beside it?',
        'What is the difference between a rule we intend and a rule we have written?',
      ],
    },
  },
  {
    id: 'legacy3-spendthrift',
    title: 'Provision Two — the spendthrift provision: the wall around the inheritance',
    bigIdea: 'Because trust assets remain owned by the TRUST and not by the beneficiary personally, a spendthrift provision helps protect them from a beneficiary’s creditors, from lawsuits, from a ruinous business decision, and from division in certain divorce situations. It is the most important clause in the instrument for a reason: for most families the biggest threat is not taxes — it is loss to somebody else.',
    inApp: 'Open the spendthrift review in the Legacy Provisions system. It walks the real exposure questions for our house one at a time and records the honest answer — verified, exposed, or not yet reviewed. Nothing shows as protected because we assumed it; it shows protected only where the record says so.',
    anchor: { ref: 'Numbers 36:7; Leviticus 25:23; Proverbs 22:3', theme: 'Yahweh legislated a wall around the inheritance Himself — the inheritance shall not remove from tribe to tribe, and the land shall not be sold for ever because the land is His and we are sojourners on it — and He praised the prudent who foresees the evil and hides himself. A structure that prevents one generation from permanently alienating what was given is not distrust; it is His own design.' },
    levels: {
      child: 'A spendthrift provision is a wall. The family’s things stay owned by the TRUST — not by any one person — so if someone gets sued, or owes money, or makes a really bad deal, they cannot lose what belongs to the whole family. Yahweh did this too. When He gave the families of Israel their land, He made a law that the land could not be permanently sold away, "for the land is mine" (Leviticus 25:23), and that an inheritance could not move from one family to another (Numbers 36:7). He built a wall so one person could not lose forever what He gave to a whole family. Your job: name one thing our family owns that should never belong to just one person.',
      senior: 'Most families assume the great threat to generational wealth is taxes. Often it is not. It is lawsuits, creditors, a business decision that went badly, a divorce, or simply the wrong marriage — every one of them a route by which an asset leaves the family through a person rather than through a tax return. The spendthrift provision answers that class directly, and the mechanism is ownership: the assets remain owned by the trust, not by the beneficiary individually. A creditor can generally reach only what a debtor OWNS, so an interest the beneficiary cannot assign and cannot pledge is an interest a creditor has a much harder time attaching, and in many states a properly drafted third-party spendthrift trust also keeps those assets outside the marital estate that a divorce court divides. Be precise about the limits, because a clause oversold is a clause that fails when it is needed: spendthrift protection is generally strongest for a trust that someone ELSE funded for you, weaker or void for a trust you fund for yourself, and it does not defeat every claimant — child support and certain government claims commonly pierce it, and once a distribution is actually in the beneficiary’s hands it is theirs and reachable like any other property. That is exactly why this provision lives next to the other two: the wall protects the asset, and the constitution and the production requirement form the person who will one day receive distributions THROUGH the wall. Two further things are worth knowing, because they are where the protection actually lives. First, DISCRETION does more work than the clause: a creditor — even one of the exception creditors — generally cannot force a trustee to make a distribution the trustee is entitled to withhold, which is also why a discretionary interest is commonly treated in a divorce as a mere expectancy rather than a divisible asset. Second, the wall faces INWARD as well as outward: under the American rule from Claflin v. Claflin (1889), the beneficiaries cannot simply agree among themselves to end the trust where that would defeat a material purpose the settlor had — which is why a well-drafted instrument SAYS what its purposes are instead of leaving a court to guess. Yahweh built this pattern into the law of the land itself. He forbade permanent alienation — "The land shall not be sold for ever: for the land is mine; for ye are strangers and sojourners with me" (Leviticus 25:23) — and He forbade an inheritance moving out of the family that received it: "So shall not the inheritance of the children of Israel remove from tribe to tribe" (Numbers 36:7). And He commends the foresight that puts a wall up before the storm: "A prudent man foreseeth the evil, and hideth himself: but the simple pass on, and are punished" (Proverbs 22:3).',
    },
    quiz: {
      questions: [
        { q: 'Why does a spendthrift provision protect trust assets from a beneficiary’s creditors?', options: ['Because creditors are not allowed to sue families', 'Because the assets remain owned by the TRUST, not by the beneficiary individually', 'Because the trust is secret'], answer: 1, explain: 'Ownership is the mechanism: a creditor generally reaches what the debtor owns, and the beneficiary does not own the trust corpus.' },
        { q: 'What is the deeper source of the protection, beyond the clause itself?', options: ['Secrecy about the trust', 'DISCRETION — a creditor generally cannot compel a distribution the trustee may withhold', 'A large balance'], answer: 1, explain: 'Discretionary, not mandatory. It is also why a discretionary interest is often treated in divorce as an expectancy rather than a divisible asset.' },
        { q: 'Can the beneficiaries simply agree among themselves to end the trust?', options: ['Yes, if they all agree', 'Generally NO in the United States, where ending it would defeat a material purpose the settlor stated (the Claflin rule)', 'Only after ten years'], answer: 1, explain: 'The wall faces inward too — but only a material purpose the document actually STATES is one a court can protect.' },
        { q: 'Which of these is a real LIMIT on spendthrift protection?', options: ['It protects everything, always', 'It is generally weak or void for a trust you fund for yourself, and claims like child support commonly pierce it', 'It only works after ten years'], answer: 1, explain: 'Honest limits (DR-0076): self-settled trusts and certain claimants are the standard exceptions — and a distribution already received is reachable.' },
      ],
    },
    lesson: 'This is the clause most families should understand best and usually understand least. Start with the threat model, because the provision only makes sense against it. Ask a room what endangers a family’s wealth and you will hear "taxes." But walk through how estates actually leave families and you find a different list: a lawsuit against a beneficiary, creditors after a business failure, a divorce, a partnership signed without counsel, a marriage that should not have happened. Every one of those takes the asset through a PERSON. The spendthrift provision answers that class of loss, and its mechanism is ownership. The assets stay owned by the trust; the beneficiary holds a right to receive under the trust’s terms, not title to the property, and cannot assign or pledge that interest away. A creditor can generally reach what a debtor owns — so where the beneficiary does not own it, the creditor has a far harder path, and in many states a properly drafted trust funded by someone else also keeps those assets out of the marital estate a divorce court divides. Now the limits, stated plainly, because a family that oversells this clause will be shocked at exactly the wrong moment: protection is strongest when someone else funded the trust for you and is weak or void where you funded it for yourself; child support and certain government claims commonly pierce it; and a distribution that has actually been made and received is the beneficiary’s own property, exposed like anything else they own. Know that, and the provision is a wall in the right place rather than a promise in the wrong one. And know that Yahweh built exactly this kind of wall Himself, which is why we do not apologize for it. He forbade the permanent sale of the land: "The land shall not be sold for ever: for the land is mine; for ye are strangers and sojourners with me" (Leviticus 25:23) — the deepest reason of all, that it was never ultimately ours to lose. He forbade an inheritance leaving the family that received it: "So shall not the inheritance of the children of Israel remove from tribe to tribe: for every one of the children of Israel shall keep himself to the inheritance of the tribe of his fathers" (Numbers 36:7). And He commends the man who sees the danger coming and takes shelter before it lands: "A prudent man foreseeth the evil, and hideth himself: but the simple pass on, and are punished" (Proverbs 22:3). A wall is not an insult to the heir. It is love with foresight — protection from the wolves the heir cannot yet see, and from the version of themselves they have not yet met.',
    facilitator: {
      talkingPoints: [
        'The threat is usually not taxes — it is lawsuits, creditors, a bad deal, divorce, the wrong marriage.',
        'Mechanism: the assets stay owned by the TRUST, and the beneficiary cannot assign or pledge the interest.',
        'Honest limits: self-settled trusts, child support and certain government claims, and already-distributed funds.',
        'Leviticus 25:23 and Numbers 36:7 — Yahweh legislated a wall against permanent alienation of an inheritance.',
      ],
      howToRun: 'Prayer + anchor (5): pray; read Leviticus 25:23 and Numbers 36:7. | The provision in a sentence (10): the trust owns it, so a creditor of the heir has no title to reach. | Teach (15): the threat list, the mechanism, and the real limits — say the limits out loud. | Work it in the app (20): walk the spendthrift review and record honest answers for our house. | Discussion (10): which exposure on the list is nearest to us today? | Send-off (5): solo task — write down one question to bring to our attorney.',
      discussionPrompts: [
        'Why is ownership, not secrecy, the thing that protects the asset?',
        'Which limit of this clause surprised you most?',
        'How does Leviticus 25:23 change how you think about what we "own"?',
      ],
    },
  },
  {
    id: 'legacy4-forced-production',
    title: 'Provision Three — forced income production: produce before you take',
    bigIdea: 'The instrument requires that beneficiaries do not merely take distributions — they learn to produce, build, invest, and contribute value BACK into the trust. An heir who only ever draws is being trained to consume the very thing they were given to steward.',
    inApp: 'Open the production ledger in the Legacy Provisions system. Each heir’s contributions and each distribution are recorded as real entries, and the standing is computed from those entries — never assumed. With no entries yet the surface says exactly that: no record, not a passing score.',
    anchor: { ref: 'Matthew 25:26-27; Luke 19:13; Genesis 2:15; 2 Thessalonians 3:10', theme: 'The lord’s rebuke falls on the servant who merely preserved the sum — thou oughtest therefore to have put my money to the exchangers — while the charge to every servant is occupy till I come; the man was put in the garden to dress it and to keep it, and the working rule of the house is that if any would not work, neither should he eat. Yahweh never treats a holding as an achievement; He treats it as an assignment.' },
    levels: {
      child: 'In our family you do not just RECEIVE from what we built — you learn to ADD to it. Jesus told a story about a master who gave his servants money to work with. Two of them put it to work and made more. One buried his in the ground to keep it safe, and the master was angry with him — not because he lost it, but because he did nothing with it (Matthew 25:26-27). Yahweh gave the very first man a garden and told him "to dress it and to keep it" (Genesis 2:15) — a job, on day one, in paradise. Working is not a punishment; it is part of being made in His image. Your job: name one way you could add value to something our family owns this month.',
      senior: 'This is the provision that turns an inheritance from a pension into a stewardship. The requirement is simple to state and demanding to live: a beneficiary is not merely a recipient of distributions but a producer — expected to learn to build, to invest, to run something, and to contribute value back into the trust that carries them. Jesus put the standard in the sharpest possible terms in the parable of the talents. The servant who lost nothing, risked nothing, and simply returned the original sum received the harshest words in the story: "Thou wicked and slothful servant... Thou oughtest therefore to have put my money to the exchangers, and then at my coming I should have received mine own with usury" (Matthew 25:26-27). Preservation was not counted as faithfulness. The charge to every servant is active: "Occupy till I come" (Luke 19:13). And the dignity of work predates the fall entirely — before there was any curse, "the LORD God took the man, and put him into the garden of Eden to dress it and to keep it" (Genesis 2:15). Paul made it the plain house rule: "if any would not work, neither should he eat" (2 Thessalonians 3:10) — a rule about the unwilling, never about the unable, and the difference matters enormously when a real family applies it to a real heir who is sick, or studying, or raising small children. So the provision must be written with judgment: production counts in more forms than a paycheck (a business built, capital genuinely at work, labor given to a family asset, a skill developed to a standard, service that creates real value), the requirement flexes for genuine incapacity, and the record is kept honestly — which is why the app computes standing from actual recorded entries and reports NO RECORD rather than inventing a passing number when nothing has been entered.',
    },
    quiz: {
      questions: [
        { q: 'What does forced income production require of a beneficiary?', options: ['To take distributions on schedule', 'To learn to produce, build, invest, and contribute value BACK into the trust — not merely to take from it', 'To pay the trust interest'], answer: 1, explain: 'Darrell 2026-09-02: they do not just take distributions, they learn to produce and contribute value back.' },
        { q: 'Why was the third servant rebuked in Matthew 25:26-27?', options: ['He lost the money', 'He merely preserved the sum and put nothing to work — preservation was not counted as faithfulness', 'He gave it away'], answer: 1, explain: 'Thou oughtest therefore to have put my money to the exchangers. A holding is an assignment, not an achievement.' },
      ],
    },
    lesson: 'The third provision is the one that changes who the heir becomes. Written into the trust is a requirement that beneficiaries do not simply take distributions — they learn to produce, build, invest, and contribute value back into the trust itself. Consider what the alternative trains. An heir who receives on a schedule and produces nothing learns, over years, that money arrives without being made. That heir is being formed, gently and expensively, into a consumer of the exact thing they were handed to steward — and when the structure eventually reaches them without the discipline attached, the third-generation arithmetic finishes the job. Jesus said this harder than any planner would dare. In the parable of the talents, the servant who is condemned is not the one who lost money; he is the one who kept it perfectly safe and returned exactly what he was given: "Thou wicked and slothful servant... Thou oughtest therefore to have put my money to the exchangers, and then at my coming I should have received mine own with usury" (Matthew 25:26-27). Preservation was not faithfulness. The standing charge is active: "Occupy till I come" (Luke 19:13). And this is not a post-fall penalty — before there was a single curse in the world, "the LORD God took the man, and put him into the garden of Eden to dress it and to keep it" (Genesis 2:15). Work is original equipment. Paul kept it blunt for the house: "if any would not work, neither should he eat" (2 Thessalonians 3:10) — and read that carefully, because it addresses the UNWILLING, not the unable, a distinction any family applying this to a real heir must hold with both hands. So write the provision with judgment — and know that the shape you want has a name. Practitioners call it a PRINCIPLE trust: instead of a rigid formula, the settlor writes down the principles and values to be encouraged and leaves the trustee discretion to weigh each heir case by case. That is not softness; it is strength. A mechanical "earn a dollar, get a dollar" rule breaks on the first heir who is disabled, studying, raising small children, or serving without pay — and it can create exactly the fixed, non-discretionary right that weakens the spendthrift protection in the lesson before this one. Count production in the forms it truly takes: a business built, capital genuinely put to work, labor given to a family asset, a skill developed to a real standard, service that produces value someone else would have paid for. Flex it for genuine incapacity — illness, study, a season of raising small children — and say so in the document rather than leaving a trustee to guess. Keep the record honestly: in our app each contribution and each distribution is an actual entry, standing is computed from those entries, and when nothing has been entered the surface says NO RECORD rather than painting a passing score. A number nobody earned is worse than an empty column, because it teaches the heir that the requirement is theater. This provision is the one that makes the other two matter. The constitution tells the heir how we think; the spendthrift wall keeps the asset safe while they learn; and this requirement makes sure that what arrives at the end of the learning is a producer.',
    facilitator: {
      talkingPoints: [
        'The requirement: produce, build, invest, and contribute value back — not merely receive.',
        'Matthew 25:26-27 — the servant who only PRESERVED was the one rebuked.',
        'Genesis 2:15 — work is pre-fall and dignified; 2 Thessalonians 3:10 addresses the unwilling, not the unable.',
        'Count production honestly in all its real forms, and record NO RECORD rather than a painted score.',
      ],
      howToRun: 'Prayer + anchor (5): pray; read Matthew 25:26-27. | The provision in a sentence (10): produce before you take. | Teach (15): what counts as production, and how incapacity is handled without gutting the rule. | Work it in the app (20): enter this season’s real contributions and read each heir’s standing. | Discussion (10): what would each of us contribute back this year? | Send-off (5): solo task — name one thing you will build or improve, with a date.',
      discussionPrompts: [
        'Why is preserving the sum not counted as faithfulness in the parable?',
        'What forms of production should our family count that a paycheck would miss?',
        'How do we apply this to an heir who genuinely cannot work right now?',
      ],
    },
  },
  {
    id: 'legacy5-heir-under-governors',
    title: 'What it feels like to be the heir under governors',
    bigIdea: 'Every provision in the trust is felt by a real person as a restriction. Scripture says exactly that — the heir, while a child, differs nothing from a servant though he be lord of all — and it names the reason: tutors and governors until the time appointed of the father. Structure is not distrust; it is the appointed season before the handoff.',
    inApp: 'Read your own standing in the Legacy Provisions system: which constitution articles you have attested, what production is on record for you, and what the trust requires next. It is your own record, and it is honest about what is not there yet.',
    anchor: { ref: 'Galatians 4:1-2; Luke 16:10', theme: 'The heir, as long as he is a child, differeth nothing from a servant, though he be lord of all — but is under tutors and governors until the time appointed of the father; and he that is faithful in that which is least is faithful also in much. The restriction is temporary and purposeful, and faithfulness in the small season is what opens the large one.' },
    levels: {
      child: 'Sometimes rules feel like grown-ups do not trust you. But the Bible says something surprising: a child who will one day own EVERYTHING is treated like a servant while he is young, with teachers and helpers over him, until the day his father says he is ready (Galatians 4:1-2). He was always the heir. The rules were never about whether he was loved — they were about the season he was in. Jesus said whoever is faithful with a little bit is the one trusted with a lot (Luke 16:10). Your job: name one small thing you can be faithful with this week.',
      senior: 'If you are the heir, this is your lesson, and it is honest about how the provisions FEEL. A constitution you must attest to, a wall you cannot borrow against, a requirement to produce before you draw — from inside, that can read as suspicion. Scripture addresses the feeling directly and does not soften it: "Now I say, That the heir, as long as he is a child, differeth nothing from a servant, though he be lord of all; But is under tutors and governors until the time appointed of the father" (Galatians 4:1-2). Read every part of that. He is the heir — the title is never in question. He is lord of all — the estate is genuinely his. And he lives, for a season, under governors and with a servant’s constraints, until a time the FATHER appoints. Paul is not describing a father who doubts his son; he is describing a father who understands seasons. Jesus gives the mechanism by which the season advances: "He that is faithful in that which is least is faithful also in much: and he that is unjust in the least is unjust also in much" (Luke 16:10). The small trust is not a holding pattern, it is the proving ground — and it moves. So take the provisions as what they are: a father’s foresight around an inheritance that is already yours, protecting it from the wolves you cannot see yet and from the version of yourself you have not met, while you become the person who can carry it. And if you are the parent reading this: appoint the time. Galatians says the constraint ends at a time the father sets. A structure with no path to release is not stewardship, it is control — and it will be resented by exactly the heir you were trying to form.',
    },
    quiz: {
      questions: [
        { q: 'According to Galatians 4:1-2, why does the heir live under tutors and governors?', options: ['Because he is not really the heir', 'Because he is in a season — he is lord of all, and the constraint runs until the time appointed of the father', 'Because the estate is too small'], answer: 1, explain: 'The title is never in question; the season is. The restriction is temporary and purposeful.' },
        { q: 'What does Luke 16:10 add about how that season advances?', options: ['It never advances', 'He that is faithful in that which is least is faithful also in much — the small trust is the proving ground', 'It advances by age alone'], answer: 1, explain: 'Faithfulness in the least is what opens the much — the seat moves.' },
      ],
    },
    lesson: 'Provisions are written by parents and lived by children, and this lesson is for the one living them. From inside the structure, every provision can read as an accusation: the constitution implies you might not share our values, the spendthrift wall implies you might lose it, the production requirement implies you might be lazy. That reading is understandable, and Scripture answers it without pretending the constraint is not real. "Now I say, That the heir, as long as he is a child, differeth nothing from a servant, though he be lord of all; But is under tutors and governors until the time appointed of the father" (Galatians 4:1-2). Take the sentence apart. He IS the heir — that is settled and never argued. He is "lord of all" — the estate is genuinely his, present tense. And still, for a season, he lives under governors and looks from the outside indistinguishable from a servant. The constraint is not a verdict on his worth; it is a description of where he is in time. And it ENDS — "until the time appointed of the father." That clause is a promise, and it also puts a duty on the parent: appoint the time. A structure with no path to release stops being formation and becomes control, and it will produce exactly the resentful heir it was meant to prevent. Jesus names how the season advances: "He that is faithful in that which is least is faithful also in much: and he that is unjust in the least is unjust also in much" (Luke 16:10). The small responsibility is not storage; it is the proving ground, and it moves. So heir: read the provisions as a father’s foresight around an inheritance already yours — protection from the wolves you have not learned to see and from the version of yourself you have not yet met — and be faithful in the least, because that is the door. And parent: keep the promise Galatians makes. Name what release looks like, write it down, and hand it over when the time you appointed arrives.',
    facilitator: {
      talkingPoints: [
        'Galatians 4:1-2 — the heir is lord of all AND under governors; the season, not the title, is the constraint.',
        'The clause "until the time appointed of the father" puts a duty on the parent to APPOINT a time.',
        'Luke 16:10 — faithfulness in the least is the mechanism by which the season advances.',
        'A structure with no path to release becomes control and produces the resentment it meant to prevent.',
      ],
      howToRun: 'Prayer + anchor (5): pray; read Galatians 4:1-2. | The provision in a sentence (10): restriction is a season, not a verdict. | Teach (15): heir-side honesty — how each provision feels, and what Scripture answers. | Work it in the app (20): each heir reads their own standing and next requirement. | Discussion (10): what does release look like, concretely, for each heir? | Send-off (5): solo task — parents write one appointed milestone; heirs write one least-thing to be faithful in.',
      discussionPrompts: [
        'Which provision feels most like distrust, and what does Galatians 4 say to that feeling?',
        'What is the "time appointed" in our family, and have we written it down?',
        'What is the "least" you are being faithful in right now?',
      ],
    },
  },
  {
    id: 'legacy7-how-we-got-here',
    title: 'How we got here — the history that shaped these provisions',
    bigIdea: 'Every one of these tools was forged in a fight over one question: how far may one generation reach forward to bind the use of what it hands on? Knowing the fight is how you use the tool without being used by it — and Yahweh answered the question first, long before any court did.',
    inApp: 'Read the three provisions again with their dates in view. Each clause in the Legacy Provisions system is somebody’s answer to a real dispute — the Crusader who lost his land, the king who lost his fees, the scholar who said debts must be paid, the father who staged his son’s inheritance.',
    anchor: { ref: 'Ecclesiastes 1:9; Leviticus 25:23; Galatians 4:1-2', theme: 'There is no new thing under the sun; the land is not sold for ever because the land is His and we are sojourners on it; and the heir lives under governors only until the time appointed of the father. The oldest law already held both halves — a wall against permanent loss, and an end to the season.' },
    levels: {
      child: 'Almost a thousand years ago, men going away to war would leave their land with a friend they trusted, to look after it until they came home. Some of those friends refused to give the land back. So judges made a rule that the friend HAD to keep his promise — and that rule grew up into what we call a trust today. So the whole idea started because somebody broke a promise. But Yahweh had already made rules about family land long before that: the land could not be sold away forever, "for the land is mine" (Leviticus 25:23), and a family’s inheritance could not move to another family (Numbers 36:7). Your job: ask a grown-up what our family owns that we would never want to lose.',
      senior: 'A short history, because it explains every clause you have read. YAHWEH LEGISLATED FIRST. Before any of this, He forbade permanent alienation of the family land — "The land shall not be sold for ever: for the land is mine; for ye are strangers and sojourners with me" (Leviticus 25:23) — forbade an inheritance moving between families (Numbers 36:7), commanded the jubilee return, "ye shall return every man unto his possession, and ye shall return every man unto his family" (Leviticus 25:10), and built in a redemption right for a brother who fell on hard times: "if any of his kin come to redeem it, then shall he redeem that which his brother sold" (Leviticus 25:25). Jeremiah bought a field on exactly that right (Jeremiah 32:7). THE CRUSADES gave the common law its start: landowners leaving to fight transferred title to someone trusted, and many who returned found the trusted holder refused to hand it back — the Chancellor’s court enforced the arrangement, and the "use" was born from a betrayal. THE STATUTE OF USES (1535): Henry VIII pushed Parliament to abolish uses because they were costing the crown its feudal fees and the church its taxes; lawyers found the holes within a generation, courts held it did not reach a holder with ACTIVE duties, and those active holders came to be called trustees of a trust. Our institution exists in the shape a tax law pushed it into. NICHOLS v. EATON (U.S. 1875) recognized the spendthrift trust; BROADWAY NATIONAL BANK v. ADAMS (Mass. 1882) upheld a clause barring creditors from reaching income before payment. The greatest trusts scholar of that era, John Chipman Gray, fought it hard — he exalted "the duty of keeping one’s promises and paying one’s debts" and warned these trusts would perpetuate a privileged class. He lost, and admitted it in 1895: "State after State has given its adhesion to the new doctrine." His objection deserves an answer from how a family actually LIVES, which is what the constitution and the production requirement are for. CLAFLIN v. CLAFLIN (Mass. 1889): a father staged his son’s inheritance at 21, 25 and 30; the court held the delay was a material purpose and the son could not accelerate it — the rule that still keeps beneficiaries from agreeing to undo a trust. Then TAX drove the modern era: the 1986 generation-skipping transfer tax meant property could no longer pass down generations untaxed, and the state-by-state repeal of the Rule Against Perpetuities followed (South Dakota had already gone first in 1983), producing trusts that can last centuries. In 1997 Alaska passed the first domestic asset-protection statute expressly to compete with offshore jurisdictions, and Delaware followed the same year, both borrowing from Cook Islands and Isle of Man law. And the limits arrived too: courts have held that one state cannot bind another state’s courts, so a favorable trust state does not settle the matter for a family that lives elsewhere. Read the whole arc and the pattern is one contest, restated every century: how far may the dead hand reach? Our answer is not "as far as possible." It is Galatians 4:1-2 — as far as the SEASON requires, and the father names when it ends.',
    },
    quiz: {
      questions: [
        { q: 'What event is credited with starting the English trust?', options: ['The 1986 tax act', 'Crusaders leaving land with someone they trusted — and some of those holders refusing to give it back', 'The founding of the Bank of England'], answer: 1, explain: 'The institution begins with a betrayal of trust the courts of equity had to answer.' },
        { q: 'Why did the Statute of Uses (1535) fail to abolish the use?', options: ['Parliament repealed it', 'Courts held it did not reach a holder with ACTIVE duties — and those holders became "trustees"', 'Henry VIII changed his mind'], answer: 1, explain: 'The modern trust exists in the shape a tax statute pushed it into.' },
        { q: 'Who was Yahweh’s answer to permanent loss of a family inheritance?', options: ['A tax', 'His own law — the land not sold for ever, the inheritance not moved between families, the jubilee return, and a kinsman’s right of redemption', 'The courts of equity'], answer: 1, explain: 'Leviticus 25:23; Numbers 36:7; Leviticus 25:10, 25:25. The oldest wall is His.' },
      ],
    },
    lesson: 'This lesson is the one that keeps you from being used by the tools you have just learned. Every clause in this course was forged in a fight, and the fight is always the same one: how far may one generation reach forward to bind the use of what it hands on? Start where it truly starts. Yahweh answered that question in the law of the land itself, and He answered it on BOTH sides. A wall: "The land shall not be sold for ever: for the land is mine; for ye are strangers and sojourners with me" (Leviticus 25:23), and "So shall not the inheritance of the children of Israel remove from tribe to tribe" (Numbers 36:7). A release: "ye shall return every man unto his possession, and ye shall return every man unto his family" (Leviticus 25:10). And a way home for a brother who lost ground: "if any of his kin come to redeem it, then shall he redeem that which his brother sold" (Leviticus 25:25) — the right Jeremiah exercised when he was told "the right of redemption is thine to buy it" (Jeremiah 32:7). A wall that never opens is not His pattern; a wall plus a jubilee is. Then the common law’s own story, which begins with a broken promise. Men leaving on crusade transferred their land to someone they trusted; some of those holders refused to return it, and the Chancellor’s court enforced the arrangement in conscience. In 1535 Henry VIII pushed through the Statute of Uses because the arrangement was costing the crown its fees — and within a generation the lawyers had found the holes, courts held the statute did not reach a holder with active duties, and those active holders got a new name: trustees. In 1875 the United States Supreme Court blessed the spendthrift trust in Nichols v. Eaton; Massachusetts followed in 1882 in Broadway National Bank v. Adams. The most respected trusts scholar of the age, John Chipman Gray, opposed it in the strongest terms — he exalted "the duty of keeping one’s promises and paying one’s debts" and argued these trusts would build a privileged class insulated from its own obligations. He lost the argument and said so plainly in 1895: "State after State has given its adhesion to the new doctrine." We teach his objection because a family that cannot answer it should not be using the tool: the answer is not a better clause, it is a house that pays what it owes, gives off the top, and forms heirs who produce. In 1889 Claflin v. Claflin held that a father’s staged inheritance — 21, 25, 30 — expressed a material purpose the son could not simply override, and that rule still stands between an heir and an early exit. Then taxes rewrote the map: the 1986 generation-skipping transfer tax meant wealth could no longer pass down the generations untouched, and states began repealing the ancient Rule Against Perpetuities to attract long trusts, South Dakota having gone first in 1983. In 1997 Alaska wrote the first domestic asset-protection statute explicitly to win business back from offshore havens, and Delaware followed within the year, both drawing on Cook Islands and Isle of Man law. Courts have since made the limit clear: one state cannot bind another state’s courts, so where a family LIVES can matter as much as where its trust sits. Now read the arc as one thing. The Crusader wanted his land back. The king wanted his fees. Gray wanted debts paid. Claflin’s father wanted a son formed before he was funded. The states wanted the trust business. Every one of them was arguing about the reach of the dead hand — and Solomon already told us to expect the repetition: "The thing that hath been, it is that which shall be... and there is no new thing under the sun" (Ecclesiastes 1:9). So we answer the question deliberately rather than by default. Not as far as possible. As far as the season requires — "the heir, as long as he is a child, differeth nothing from a servant, though he be lord of all; But is under tutors and governors until the time appointed of the father" (Galatians 4:1-2) — and the father names the time it ends.',
    facilitator: {
      talkingPoints: [
        'One question runs through the whole history: how far may the dead hand reach?',
        'Yahweh answered first and answered BOTH ways — a wall (Leviticus 25:23; Numbers 36:7) and a jubilee release (Leviticus 25:10; 25:25).',
        'The trust begins with a betrayal (the Crusades) and takes its modern shape from a tax law (Statute of Uses, 1535).',
        'Teach Gray’s objection honestly — debts should be paid; the answer is how the family lives, not a cleverer clause.',
        'Claflin (1889) is why beneficiaries cannot simply agree to end a trust; 1986 tax law drove the perpetuities repeal; 1997 Alaska drove the asset-protection race.',
      ],
      howToRun: 'Prayer + anchor (5): pray; read Leviticus 25:23 and Galatians 4:1-2. | The provision in a sentence (10): every clause is somebody’s answer to an old fight. | Teach (15): walk the arc — jubilee, the Crusades, 1535, 1875-1889, 1986, 1997 — one sentence each. | Work it in the app (20): open each provision and name which historical fight it answers. | Discussion (10): is Gray right about us? What in how we live answers him? | Send-off (5): solo task — write one sentence on how far OUR family should reach forward.',
      discussionPrompts: [
        'What does it mean that the trust began with someone refusing to give the land back?',
        'Yahweh built a wall AND a jubilee. Does our plan have both?',
        'John Chipman Gray said these trusts let people escape paying what they owe. How does our house answer him?',
      ],
    },
  },
  {
    id: 'legacy6-hand-it-forward',
    title: 'Hand it forward — teach your own house',
    bigIdea: 'The teaching does not stop at our children. Yahweh established the testimony so that the generation to come would arise and declare it to THEIR children — a fourth generation in view from the first sentence. What we build here, a family that learns it here can build for their own house.',
    inApp: 'Export the family constitution and the provisions summary from the Legacy Provisions system. Another family can start from ours, replace our articles with their own, and run the same system for their house — inside this app, at no cost.',
    anchor: { ref: 'Psalms 78:5-6; 2 Timothy 2:2; Proverbs 13:22', theme: 'He established a testimony and commanded the fathers to make it known to their children, so that the generation to come might know and ARISE AND DECLARE THEM TO THEIR CHILDREN — four generations named in one breath; commit it to faithful ones able to teach others also; and a good man leaves an inheritance to his children’s children. The transfer is never meant to terminate in us.' },
    levels: {
      child: 'Everything you are learning here is not just for you — it is for the family you will have one day. Yahweh said He gave His teaching to fathers so they would tell their children, and so those children would grow up and tell THEIR children (Psalms 78:5-6). That is four generations in one sentence, and you are in the middle of it. Your job: teach one thing you learned in this course to someone younger than you.',
      senior: 'The final provision is not in the trust document at all — it is the reason the other three exist. Yahweh framed generational transfer as a chain with at least four links, stated in a single breath: "he established a testimony in Jacob, and appointed a law in Israel, which he commanded our fathers, that they should make them known to their children: That the generation to come might know them, even the children which should be born; who should arise and declare them to their children" (Psalms 78:5-6). Fathers teach children, so that children not yet born will one day ARISE AND DECLARE IT to children after them. Paul gives the same architecture for the church: "the things that thou hast heard of me among many witnesses, the same commit thou to faithful men, who shall be able to teach others also" (2 Timothy 2:2) — the deposit is handed to people specifically ABLE to hand it on again. And Solomon sets the financial aim at the same distance: "A good man leaveth an inheritance to his children’s children" (Proverbs 13:22). Grandchildren, not children. This is why the course is free and inside the app rather than behind a seat and an email address. The teaching came to our family as a funnel with a countdown timer; the substance was sound and the delivery put a toll booth in front of the one thing a family cannot afford to skip. So we built it in, whole, with the working system beside it — and any family here can export our constitution as a starting frame, replace every article with their own convictions, and run the same three provisions for their own house. That is the fourth link doing what Psalm 78 says it will do.',
    },
    quiz: {
      questions: [
        { q: 'How many generations does Psalms 78:5-6 hold in view at once?', options: ['One', 'At least four — fathers, their children, the generation to come, and the children those declare it to', 'Two'], answer: 1, explain: 'The transfer is explicitly designed not to terminate in the generation that receives it.' },
        { q: 'What does 2 Timothy 2:2 say about WHO the deposit is committed to?', options: ['Anyone who asks', 'Faithful men, who shall be able to teach others also — chosen for their ability to hand it on again', 'Only family'], answer: 1, explain: 'The criterion is the ability to pass it on — the chain is designed into the choice.' },
      ],
    },
    lesson: 'End where Yahweh starts: the transfer was never designed to stop with the people who receive it. "He established a testimony in Jacob, and appointed a law in Israel, which he commanded our fathers, that they should make them known to their children: That the generation to come might know them, even the children which should be born; who should arise and declare them to their children" (Psalms 78:5-6). Count the links — the fathers, their children, the generation yet to be born, and the children THOSE will declare it to. Four, in one breath, and the whole design is that each link arises and declares. Paul builds the church on the same architecture: "the things that thou hast heard of me among many witnesses, the same commit thou to faithful men, who shall be able to teach others also" (2 Timothy 2:2) — the deposit goes specifically to people able to hand it forward. And Solomon sets the money at the same distance as the teaching: "A good man leaveth an inheritance to his children’s children" (Proverbs 13:22). Grandchildren. Which means an estate plan aimed only at your children is aimed one generation short of the text. So here is the practical charge. Teach this at your own table — the constitution first, because principles are what actually travel; the spendthrift wall second, so the children understand a wall as love with foresight rather than suspicion; and the production requirement third, so the heir is being formed into someone who adds. Then hand the whole thing on. The system in this app exports: another family can take our constitution as a frame, replace every article with their own convictions and their own Scripture, and operate the same three provisions for their own house — free, with no seat to claim and no email to surrender. That is not generosity, it is obedience to Psalm 78. The generation to come is supposed to arise and declare it. We are just making sure they have something plain enough to run with (Habakkuk 2:2).',
    facilitator: {
      talkingPoints: [
        'Psalms 78:5-6 holds four generations in one sentence — the chain is the design.',
        '2 Timothy 2:2 — commit it to those ABLE to teach others also.',
        'Proverbs 13:22 aims the money at the grandchildren, so a two-generation plan is short by one.',
        'The system exports: another family adopts the frame and writes their own articles.',
      ],
      howToRun: 'Prayer + anchor (5): pray; read Psalms 78:5-6. | The provision in a sentence (10): the transfer does not terminate in us. | Teach (15): the four links, and what each generation owes the next. | Work it in the app (20): export the constitution and provisions; identify who we will teach it to. | Discussion (10): which family outside ours should have this? | Send-off (5): solo task — teach one lesson from this course to someone younger.',
      discussionPrompts: [
        'Who taught you what you know about money, and what did they leave out?',
        'Which of our articles would you keep if you were writing your own constitution?',
        'Who in our circle is one conversation away from starting theirs?',
      ],
    },
  },
];

// --- Shared-framework wrappers ----------------------------------------------
// Self-paced: no cohort start, so every row's date/weekday is null by design and
// the UI shows a lesson number instead of a fabricated calendar date (DR-0076).

export function buildLegacyProvisionsSchedule(startISO = null) {
  return buildScheduleFor(LEGACY_PROVISIONS_MODULES, startISO, LEGACY_PROVISIONS_META.cadenceDays);
}

export function legacyProvisionsProgressSummary(progress = {}) {
  return progressSummaryFor(LEGACY_PROVISIONS_MODULES, progress);
}

export function exportLegacyProvisionsCurriculumMarkdown(startISO = null) {
  return exportCurriculumMarkdownFor({
    meta: LEGACY_PROVISIONS_META,
    modules: buildLegacyProvisionsSchedule(startISO),
    sessionFlow: LEGACY_PROVISIONS_SESSION_FLOW,
  }, startISO);
}

/** Every Scripture reference this course cites, deduped — what the verse gate walks. */
export function legacyProvisionsRefs() {
  const seen = new Set();
  for (const m of LEGACY_PROVISIONS_MODULES) {
    for (const part of String(m.anchor?.ref || '').split(';')) {
      const ref = part.trim();
      if (ref) seen.add(ref);
    }
  }
  for (const part of String(LEGACY_PROVISIONS_META.wordFirst?.ref || '').split(';')) {
    const ref = part.trim();
    if (ref) seen.add(ref);
  }
  return [...seen];
}

export const LEGACY_PROVISIONS_INTEREST_TAG = '[Legacy Provisions]';
export const LEGACY_PROVISIONS_HELPER_TAG = '[Legacy Provisions helper]';

export const LEGACY_PROVISIONS_TUTOR_META = {
  key: 'legacy-provisions',
  name: LEGACY_PROVISIONS_META.title,
  title: LEGACY_PROVISIONS_META.title,
  posture: 'Teach the three provisions plainly and Word-first — the constitution the trust points at, the spendthrift wall, and the produce-before-you-take requirement. State the real limits of a spendthrift clause rather than overselling it, and never give legal advice: name what to ask a licensed estate attorney in the reader’s own state.',
  blurb: 'Ask anything about the three provisions — what each one does, what it does NOT do, and how our family operates it in the app. Teaching only; your attorney drafts the instrument.',
};
