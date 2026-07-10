// =============================================================================
// ai-legal-blueprint-class — "AI Legal Blueprint: What Never to Tell a Chatbot"
// =============================================================================
// A short, plain-language Learn course for EVERYONE — family, congregants, kids,
// and seniors — on what information you must NOT paste into a vendor/consumer AI
// chatbot (ChatGPT, Gemini, Microsoft Copilot, the free Claude app, etc.) and
// WHY. It is the privacy/legal companion to "Sovereign A.I.: Why We Build Local"
// (lane local_837725a8): that course teaches WHY we run A.I. on iron we own; this
// course teaches WHY that matters for YOUR sensitive data when you reach for a
// stranger's chatbot. They cross-link; they do not duplicate — this one is the
// "don't hand it over" rule, that one is the "here is the safe place to do it."
//
// SAME SHARED FRAMEWORK as the other COLG/PoeTech courses (NOT a one-off): the
// generic helpers in church-classes.js (computed schedule, real progress, markdown
// export, cohort propagation), the self-driving tutor (class-tutor.js -> askTutor),
// and the multi-modal lesson schema + skill-level branching + quiz/assessment +
// graduate->helper from learn-framework.js. It is AGE-ADAPTIVE: because the
// audience explicitly includes children and non-technical seniors, EVERY module
// carries `levels.child`, `levels.teen`, and `levels.senior` so the SAME truth
// renders age-right (learn-framework AGE_BANDS), and every module runs the shared
// Research -> Plan -> Execute primitive (`rpe`).
//
// VERIFICATION / NO-FABRICATION (DR-0076): the legal + vendor-policy substance is
// drawn from current (2024-2026) sources — vendor data-usage policies and reported
// court actions — and is framed as CURRENT-AS-OF, never timeless, because this is
// the fastest-moving area of the topic. Specific retention numbers and policy
// details are taught as "check the live policy" facts, not memorized constants.
// Real incidents are named only where reported by reputable sources (the 2023
// Samsung source-code leak; Italy's 2023 ChatGPT ban + later fine, with the honest
// note that the fine was reportedly annulled on procedure; the U.S. court order in
// the New York Times v. OpenAI case requiring preservation of chat logs).
//
// HONEST CAVEAT (carried in the content itself): this course is EDUCATIONAL and
// INFORMATIONAL — it is NOT legal advice. For a specific situation, consult a
// licensed attorney. Scripture is cited by REFERENCE + a plain-language theme
// gloss, never a quoted translation (SCRIPTURE-REFERENCE-STANDARD).
//
// Grounds: DATA-AS-EMPOWERMENT-NOT-EXTRACTION (the sovereign moat), COMMUNITY-
// FIRST-MISSION (protecting an elderly, tech-novice congregation), QUALITY-OF-LIFE
// (peace of mind is the outcome), and the app-is-primary default (the hands-on tie
// to our own sovereign A.I. surface — the safe place to do sensitive work).
// =============================================================================

import {
  buildScheduleFor, progressSummaryFor, exportCurriculumMarkdownFor, resolveCohortGeneric,
} from './church-classes.js';

// Proposed start for Cohort 1 — a Saturday (the build/teach rhythm), the week
// after the Sovereign A.I. course's proposed start. Governor-editable in-app
// (data.aiLegalBlueprintCohort.startDate); the UI shows the true weekday so a
// non-Saturday is caught honestly. Stays "proposed" until Darrell confirms.
export const AI_LEGAL_BLUEPRINT_PROPOSED_COHORT_START = '2026-08-08';

// PUBLISHED cohort — what every learner on every deployed build sees. Until
// Darrell locks the date this stays { confirmed:false } and the UI reads
// "proposed." Set confirmed:true (and startDate if it moved) and the next deploy
// propagates it (same publish model as the other courses).
export const AI_LEGAL_BLUEPRINT_CONFIRMED_COHORT = {
  startDate: '2026-08-08',
  confirmed: false,
};

export const AI_LEGAL_BLUEPRINT_META = {
  key: 'ai-legal-blueprint',
  title: 'AI Legal Blueprint: What Never to Tell a Chatbot',
  audience: 'everyone — family, congregants, kids, and seniors who use ChatGPT, Gemini, Copilot, or any A.I. chatbot',
  tagline: 'If you would not put it on a billboard, do not paste it into a chatbot.',
  format: '6 sessions · ~60 min each (paced to your age) · plain language, hands-on, no legal jargon',
  cadenceDays: 7,
  weeks: 6,
  handsOnLabel: 'Try it in the app',
  footer: '_Taught by Darrell Poe · The Church of the Living God + the Poe family · built on PoeTech. EDUCATIONAL, not legal advice — for your situation, ask a licensed attorney. We run our A.I. on machines we own so your sensitive data never has to leave home._',
};

// The 60-minute session shape — the SAME muscle memory as every other course.
export const AI_LEGAL_BLUEPRINT_SESSION_FLOW = [
  { minutes: 5, name: 'Prayer + the anchor' },
  { minutes: 10, name: 'Recap last week' },
  { minutes: 15, name: 'Teach the big idea' },
  { minutes: 15, name: 'Try it in the app' },
  { minutes: 10, name: 'Discussion' },
  { minutes: 5, name: 'Send-off + solo task' },
];
export const AI_LEGAL_BLUEPRINT_SESSION_MINUTES = AI_LEGAL_BLUEPRINT_SESSION_FLOW.reduce((t, s) => t + s.minutes, 0); // 60

// Each module mirrors the other courses' shape: a learner-plain `bigIdea`, a deep
// `lesson`, age `levels` (child/teen/senior depth of the same truth), the shared
// `rpe` (Research -> Plan -> Execute), a real `inApp` activity (with a `launch`
// deep link where a real surface exists), a `quiz`, and a Scripture `anchor`
// (reference + theme gloss, never a quoted verse).
export const AI_LEGAL_BLUEPRINT_MODULES = [
  // ---------------------------------------------------------------------------
  {
    id: 'aib1-the-one-rule',
    title: 'The one rule — it is a stranger’s computer',
    bigIdea: 'A vendor chatbot (ChatGPT, Gemini, Copilot, the free Claude app) is not your friend and it is not private. It runs on a company’s computers far away. What you type can be stored, read by a human reviewer, and used to train the model — and as courts have shown, it can be kept even after you press delete. So the whole course fits in one rule: if you would not be okay seeing it on a billboard, do not paste it into a chatbot.',
    inApp: 'Open our own A.I. (the Council Chamber / input center) and notice the reminder that it runs on OUR machine. Then picture the difference: when you type into a vendor chatbot, your words leave your house; when you type into ours, they do not.',
    anchor: { ref: 'Luke 12:2–3; Proverbs 22:3', theme: 'What is whispered in secret can be shouted from the rooftops; the prudent see danger and take refuge. Treat anything you type into a stranger’s system as something that could be made public.' },
    launch: { view: 'church', churchView: 'home', churchSection: 'speak' },
    rpe: {
      research: 'Name the chatbots you (or your family) actually use, and ask: whose computer does each one run on?',
      plan: 'Decide your personal billboard test — "would I be fine if this showed up in public?"',
      execute: 'For one thing you nearly typed into a chatbot this week, run the billboard test before sending it.',
    },
    levels: {
      child: 'A chatbot like ChatGPT lives on a big company’s computer far, far away — not on your computer, and not at our house. When you type something to it, your words travel all the way there, and the company can keep them. So here is the one big rule for this whole class: if you would not want it on a giant sign by the road for everyone to read, do not type it to a chatbot. Pretend a stranger is reading over your shoulder — because one might be.',
      teen: 'Here is the thing nobody tells you: a chatbot is a stranger’s computer. ChatGPT, Gemini, Copilot, the free Claude app — they all run on a company’s servers, not yours. What you type can be saved, a human reviewer might read a sample of it, and it can be used to train the next version of the A.I. And "delete" does not always mean gone — courts have ordered companies to keep chats people thought were erased. So the whole class is one rule: if you would not put it on a billboard, do not paste it into a chatbot. That is not fear — that is just being smart about where your words go.',
      senior: 'The mental model that protects you is simple and accurate: a consumer chatbot is a third party, not a confidant. Your input is transmitted off your device to the provider’s servers, where — under the consumer terms most people never read — it may be retained, sampled for human review, and used to improve (train) the model unless you have actively opted out. Even deletion is not a guarantee: in the New York Times v. OpenAI litigation a U.S. court ordered the provider to PRESERVE chat logs, including ones users had deleted, which would normally have been purged. None of this makes the tools bad; it makes them PUBLIC-by-default for anything sensitive. The disciplined posture is the billboard test — would I accept this exact text being stored on someone else’s server, possibly read by a human, possibly used to train a model, and possibly produced in a future court case? If not, it does not go in. Everything else in this course is the detailed application of that one rule.',
    },
    quiz: {
      questions: [
        { q: 'Where does a vendor chatbot like ChatGPT actually run?', options: ['On your own phone, privately', 'On a company’s computers far away, where your words can be stored', 'Nowhere — it forgets instantly'], answer: 1, explain: 'It is a stranger’s computer. Your words leave your device and the company can keep them — that is the whole reason for the rule.' },
        { q: 'What is the one rule of this whole course?', options: ['Type as fast as you can', 'If you would not put it on a billboard, do not paste it into a chatbot', 'Always trust the answer'], answer: 1, explain: 'The billboard test: treat anything you type into a vendor chatbot as something that could become public.' },
        { q: 'Does pressing "delete" guarantee the chat is gone?', options: ['Yes, always', 'No — companies have been ordered by courts to keep "deleted" chats', 'Only on weekends'], answer: 1, explain: 'In the New York Times v. OpenAI case a court ordered logs preserved, including deleted ones. Delete is not erase.' },
      ],
    },
    lesson: 'Start with the picture that protects you for the rest of your life: a vendor chatbot is a stranger’s computer. ChatGPT, Gemini, Microsoft Copilot, the free Claude app — none of them run on your phone or in your house. They run on a company’s servers far away, and when you type into them, your words travel there. Under the consumer terms almost nobody reads, those words can be stored, a human reviewer can read a sample of them, and they can be used to train the next version of the A.I. unless you have gone out of your way to turn that off. And here is the part that surprises people most: pressing delete does not guarantee the words are gone. In the lawsuit between the New York Times and OpenAI, a U.S. court ordered the company to PRESERVE chat logs — including chats users had deleted — that would normally have been thrown away. So the honest way to treat a chatbot is as PUBLIC-by-default for anything sensitive. That is not a reason to fear the tools; they are genuinely useful for ordinary, non-private work. It is a reason to be deliberate. The whole course comes down to one rule you can teach a child: if you would not be okay seeing it on a billboard by the highway, do not paste it into a chatbot. Jesus warned that what is whispered in secret can be shouted from the rooftops (Luke 12:2-3), and Proverbs says the prudent see danger coming and take refuge while the simple walk on and pay the price (Proverbs 22:3). Wisdom here is not anxiety — it is simply knowing where your words go before you send them.',
    facilitator: {
      talkingPoints: [
        'A vendor chatbot is a STRANGER’S COMPUTER — your words leave your device and the company can keep them.',
        'Default reality: inputs may be stored, sampled for human review, and used to train the model unless you opt out.',
        '"Delete" is not "erase" — the NYT v. OpenAI court ordered deleted chats preserved. Treat sensitive input as public.',
        'The one rule for the whole course: the billboard test — would I be fine seeing this in public?',
        'This is wisdom, not fear (Luke 12:2-3; Proverbs 22:3) — know where your words go before you send them.',
      ],
      howToRun: 'Prayer + the anchor (5): open in prayer; read Luke 12:2-3 — what is whispered can be shouted. | Recap last week (10): first session — instead, go around: name one chatbot you have used and what you asked it. | Teach the big idea (15): a chatbot is a stranger’s computer; stored / reviewed / trained-on; delete is not erase; the billboard test. | Try it in the app (15): open our own A.I.; notice it runs on our machine; contrast with a vendor chatbot where words leave the house. | Discussion (10): what is something you would NEVER want on a billboard? | Send-off + solo task (5): solo task — catch yourself once this week before pasting, and run the billboard test.',
      discussionPrompts: [
        'What surprised you most — that chats are stored, that humans may read them, or that delete is not erase?',
        'What is one thing you have typed into a chatbot that you would not want on a billboard?',
        'Why is "a stranger’s computer" a more honest picture than "a private assistant"?',
      ],
    },
  },
  // ---------------------------------------------------------------------------
  {
    id: 'aib2-do-not-share-list',
    title: 'The DO-NOT-SHARE list — the cheat-sheet',
    bigIdea: 'There are nine plain categories you keep OUT of a vendor chatbot: (1) who you are — full name with address or birth date; (2) ID numbers — Social Security, driver’s license, passport; (3) money — bank account, card, and routing numbers; (4) health — diagnoses, medications, a person’s medical details; (5) passwords, keys, and codes; (6) work secrets — confidential, employer, or proprietary information; (7) anything from a lawyer; (8) other people’s private information without their permission; (9) children’s information. Memorize the list; it is the whole cheat-sheet.',
    inApp: 'Open the curriculum export and keep the nine-item list handy. Read it out loud once — naming each category is how it sticks.',
    anchor: { ref: 'Proverbs 11:13; Proverbs 4:23', theme: 'A gossip betrays a confidence, but a trustworthy person keeps a secret; guard your heart, for everything flows from it. Keeping the list is keeping a trust — your own and other people’s.' },
    rpe: {
      research: 'Walk the nine categories and find one real example of each in your own life.',
      plan: 'Mark which ones you are most likely to slip up on (money and other people’s info catch most people).',
      execute: 'Write the nine-item list somewhere you will see it before you next use a chatbot.',
    },
    levels: {
      child: 'Here is a list of things you NEVER tell a chatbot — like a list of things you never tell a stranger. (1) Your full name with where you live. (2) Special numbers like a Social Security number. (3) Money numbers — bank or card numbers. (4) Health stuff — who is sick and what is wrong. (5) Passwords. (6) Secrets from a grown-up’s work. (7) Anything a lawyer said. (8) Other people’s private things. (9) Anything about other kids. If something is on this list, you stop and ask a trusted grown-up first.',
      teen: 'This is the cheat-sheet — screenshot it. Keep these nine OUT of any vendor chatbot: (1) who you are — full name plus address or birthday; (2) ID numbers — SSN, driver’s license, passport; (3) money — bank account, card, routing numbers; (4) health — diagnoses, meds, anyone’s medical details; (5) passwords, API keys, login codes; (6) work secrets — confidential or company info, source code; (7) anything from a lawyer; (8) other people’s private info without their okay; (9) any kid’s personal info. Two that trip people up: money (do not paste a bank statement to "help me budget") and OTHER people’s info (your friend’s details are not yours to share). When in doubt, it is on the list.',
      senior: 'The DO-NOT-SHARE list, with the reason each one earns its place. (1) Personal identifiers — a name tied to an address or date of birth is regulated personal information. (2) Government IDs — Social Security, driver’s license, passport numbers sit in the heightened "sensitive" tier of privacy law. (3) Financial account data — account, card, and routing numbers are exactly the class breach-law and card-industry rules exist to protect. (4) Health information — diagnoses, medications, a family member’s condition; a consumer chatbot is not a HIPAA-covered place for it (next sessions). (5) Secrets — passwords, API keys, tokens; if you paste one, treat it as compromised and change it. (6) Proprietary or employer information — confidential documents, customer lists, source code; this is the famous corporate-leak category. (7) Attorney-client material — sharing it with a third party can forfeit the privilege that protects it. (8) Other people’s personal data without consent — you are disclosing THEIR regulated information, not yours. (9) Minors’ data — children’s information carries the strongest legal protection of all. The discipline is recognition: if what you are about to paste fits any of the nine, you stop, and you redact, use a protected tool, or use our own sovereign A.I. — the subject of the final session.',
    },
    quiz: {
      questions: [
        { q: 'Which of these belongs on the DO-NOT-SHARE list?', options: ['A recipe for bread', 'A bank account or card number', 'A question about the weather'], answer: 1, explain: 'Money numbers (account, card, routing) are category 3 — never paste them into a vendor chatbot.' },
        { q: 'Your friend tells you their private medical news. Can you paste it into a chatbot to "get advice"?', options: ['Yes, it is just advice', 'No — it is someone else’s private info AND health info, two categories at once', 'Only if you remove their name'], answer: 1, explain: 'It hits category 8 (other people’s info without consent) and category 4 (health). Removing a name alone is often not enough.' },
        { q: 'You accidentally pasted a password into a chatbot. What now?', options: ['Nothing, it is fine', 'Treat it as compromised and change (rotate) it', 'Just delete the chat'], answer: 1, explain: 'A pasted secret should be considered exposed. Deleting the chat does not undo it — change the password.' },
      ],
    },
    lesson: 'This session is the cheat-sheet, and it is worth memorizing because the rest of the course simply explains why each item is on it. Keep these nine categories OUT of any vendor chatbot. First, who you are: your full name tied to your address or date of birth — that combination is regulated personal information. Second, ID numbers: Social Security, driver’s license, and passport numbers, which the law treats as especially sensitive. Third, money: bank account numbers, card numbers, and routing numbers — do not paste a statement to "help me budget." Fourth, health: diagnoses, medications, and anyone’s medical details, including a prayer-request that names what someone is sick with. Fifth, secrets: passwords, API keys, and login codes — and if you ever do paste one, assume it is now exposed and change it. Sixth, work secrets: confidential documents, employer or customer information, and source code — this is the category that has made headlines. Seventh, anything from a lawyer, because handing privileged material to an outside company can strip away the protection that made it private. Eighth, other people’s information without their permission — your friend’s details, a member’s information, a tenant’s file are theirs, not yours to share. Ninth, children’s information, which carries the strongest legal protection of all. Two categories catch good people most often: money, because budgeting help feels harmless, and OTHER people’s information, because we share about others without thinking of it as their private data. Proverbs says a gossip betrays a confidence but a trustworthy person keeps a secret (Proverbs 11:13), and to guard the heart because everything flows from it (Proverbs 4:23). Keeping this list is keeping a trust — your own, and your neighbor’s.',
    facilitator: {
      talkingPoints: [
        'The nine: (1) name+address/DOB, (2) SSN/ID numbers, (3) bank/card/routing, (4) health, (5) passwords/keys, (6) work secrets, (7) lawyer material, (8) others’ info, (9) kids’ info.',
        'Two that trip up good people: MONEY ("help me budget") and OTHER PEOPLE’S info (a friend’s details are not yours).',
        'If you paste a secret, it is compromised — change it; deleting the chat does not undo it.',
        'Removing a name is often NOT enough — combinations can still identify a person (more next session).',
        'Keeping the list is keeping a trust (Proverbs 11:13; 4:23) — your own and your neighbor’s.',
      ],
      howToRun: 'Prayer + the anchor (5): pray; read Proverbs 11:13 — the trustworthy keep a confidence. | Recap last week (10): a learner restates the one rule (the billboard test). | Teach the big idea (15): walk the nine categories slowly, one real example each; flag money + others’ info as the common slips. | Try it in the app (15): open the curriculum export; each learner reads the nine-item list aloud and notes their riskiest one. | Discussion (10): which category had you never thought of as "private"? | Send-off + solo task (5): solo task — write the nine-item list where you will see it before your next chatbot use.',
      discussionPrompts: [
        'Which of the nine had you never considered off-limits before?',
        'Why is removing just a name often not enough to make health or personal info safe?',
        'When is sharing about another person actually sharing THEIR private data?',
      ],
    },
  },
  // ---------------------------------------------------------------------------
  {
    id: 'aib3-how-the-machine-remembers',
    title: 'Why it is risky — how the machine remembers',
    bigIdea: 'The risk is not imaginary; it is how these systems work. By default, consumer chatbots may STORE what you type, let a human REVIEW a sample, and use your words to TRAIN the model. Turning training off usually stops only FUTURE use — it does not erase what was already kept, and short "abuse-monitoring" holds still apply. The big difference is the TIER: free/consumer is the leaky one; enterprise, business, and API tiers can offer no-training and even zero-retention. Know which one you are in.',
    inApp: 'Open our own A.I. and read the on-screen promise in your own words: it runs on our machine and we do not sell your data. That is the opposite of the consumer-chatbot default — and the reason we built it.',
    anchor: { ref: 'Proverbs 14:15; Luke 14:28', theme: 'The prudent give thought to their steps; count the cost before you build. Knowing what a tool does with your words is counting the cost before you trust it.' },
    rpe: {
      research: 'For one chatbot you use, find its data or privacy settings and read what it says it does with your chats.',
      plan: 'Decide whether you are on a free/consumer tier or a business/enterprise one — they are governed very differently.',
      execute: 'Turn off chat history / "help improve the model" where the option exists — and remember that off is not erase.',
    },
    levels: {
      child: 'Why is a chatbot risky? Because it has a really good memory and it is not yours. When you type to it, the company can keep your words, a worker might read some of them to check the robot, and your words can help teach the next robot. There is sometimes a switch that says "stop using my chats" — but it only stops NEW ones; the old ones may already be saved. Our A.I. at home is different: it lives on OUR computer, and we never sell what you say. That is why we built our own.',
      teen: 'The risk is baked into how these work. Three things happen by default on consumer chatbots: your text gets STORED, a human reviewer might READ a sample of it, and your words can be used to TRAIN the next model. Most apps have a setting to opt out of training — turn it ON (well, off) — but know the catch: opting out usually stops only FUTURE training; it does not delete what is already saved, and a short safety-hold on your data still applies. The biggest lever is the TIER you are on. Free and personal accounts are the leaky default. Business, school, enterprise, and developer (API) tiers can promise no-training and even "zero data retention." Same brand name, totally different rules — so know which one you are actually using.',
      senior: 'Understanding the mechanism is what turns a vague worry into precise judgment. Three default behaviors on consumer tiers: retention (your inputs are stored), human review (a sample may be read by people to improve quality and safety), and training (your content may be used to improve the model). Each major provider now offers an opt-out of training on consumer plans, but two honest caveats hold across all of them: opting out generally affects only FUTURE use, not data already retained, and a short abuse-monitoring retention window typically remains even then. The decisive variable is the TIER. Consumer/free plans are the permissive default. Enterprise, business, education, and API tiers are governed by different terms that commonly include no-training-on-your-data commitments, contractual data-processing terms, and in some cases zero-data-retention. For regulated data there is a further line: a Business Associate Agreement (for health information) or equivalent contract exists only on those higher tiers, never on consumer ones. The exact numbers — retention days, what a given setting does — move quickly, so this is a "check the live policy" fact, not a memorized constant. The practical takeaway is durable even as the numbers change: on a consumer tier assume stored + maybe-reviewed + maybe-trained; reserve sensitive work for a properly-contracted tier or, better, for an A.I. that never leaves your own hardware.',
    },
    quiz: {
      questions: [
        { q: 'By default, what can a consumer chatbot do with what you type?', options: ['Nothing — it is always private', 'Store it, let a human review a sample, and use it to train the model', 'Mail it back to you'], answer: 1, explain: 'Stored, possibly human-reviewed, possibly used for training is the consumer default — unless you opt out, and even then with limits.' },
        { q: 'If you turn OFF "use my chats to improve the model," what happens?', options: ['Everything you ever typed is instantly erased', 'It usually stops only FUTURE use; already-saved data is not necessarily deleted', 'Your account is closed'], answer: 1, explain: 'Opting out generally affects future training only; a short retention hold often still applies. Off is not erase.' },
        { q: 'What is the biggest factor in how your data is treated?', options: ['The color of the app', 'The TIER — free/consumer vs business/enterprise/API', 'How fast you type'], answer: 1, explain: 'Same brand, different rules: enterprise/API tiers can offer no-training and zero-retention that consumer tiers do not.' },
      ],
    },
    lesson: 'The risk in this course is not a rumor — it is simply how the systems are built, so understanding the mechanism turns a vague worry into clear judgment. On consumer chatbots, three things happen by default. Your input is RETAINED — stored on the provider’s servers. A sample may be subject to HUMAN REVIEW, where real people read conversations to check and improve quality and safety. And your content may be used to TRAIN the next version of the model. Every major provider now lets you opt out of training on a personal plan, and you should turn that off — but carry two honest caveats with you. First, opting out generally stops only FUTURE use; it does not promise to delete what was already kept. Second, a short "abuse-monitoring" retention window typically remains even after you opt out. The single biggest factor, though, is the TIER you are on. Free and personal accounts are the permissive default this whole course is about. Business, school, enterprise, and developer (API) tiers are governed by different terms — they commonly promise not to train on your data, add real data-processing contracts, and sometimes offer zero data retention; and only on those higher tiers can you get the contract (a Business Associate Agreement) that health information legally requires. Same brand on the door, very different rules inside. One more piece of honesty: the exact figures — how many days, what a given toggle does — change quickly, so treat them as "check the live policy" facts rather than something to memorize. The durable lesson survives every policy change: on a consumer tier, assume your words are stored, maybe read, and maybe used to train; keep sensitive work for a properly-contracted tier, or better, for an A.I. that never leaves your own hardware. The prudent give thought to their steps (Proverbs 14:15) and count the cost before they build (Luke 14:28) — knowing what a tool does with your words is exactly that.',
    facilitator: {
      talkingPoints: [
        'Three consumer defaults: RETAINED (stored), HUMAN-REVIEWED (sampled), TRAINED-ON (improves the model).',
        'Opt-out of training: do it — but it usually stops only FUTURE use, and a short retention hold still applies. Off is not erase.',
        'The decisive lever is the TIER: free/consumer is leaky; enterprise/business/education/API can offer no-training + zero-retention.',
        'Only higher tiers offer the contract regulated data needs (a BAA for health info) — never consumer.',
        'Exact numbers move fast — teach "check the live policy," not memorized constants (DR-0076). Proverbs 14:15; Luke 14:28.',
      ],
      howToRun: 'Prayer + the anchor (5): pray; read Luke 14:28 — count the cost. | Recap last week (10): a learner names three items from the DO-NOT-SHARE list. | Teach the big idea (15): retained / reviewed / trained; the opt-out caveats; tiers; the "check the live policy" honesty. | Try it in the app (15): each learner opens a chatbot’s data settings and reads what it claims to do; then reads our own "we do not sell your data" promise. | Discussion (10): why is "off is not erase" the part people miss? | Send-off + solo task (5): solo task — turn off chat history / model-training on one tool you use.',
      discussionPrompts: [
        'Which of the three defaults — stored, reviewed, trained-on — bothers you most, and why?',
        'Why does the TIER matter more than the brand?',
        'What does it change to know that "delete" and "opt out" are not the same as "erased"?',
      ],
    },
  },
  // ---------------------------------------------------------------------------
  {
    id: 'aib4-the-law-plain',
    title: 'Why it is risky — the law, in plain words (not legal advice)',
    bigIdea: 'Pasting regulated data into a consumer chatbot can break protections you assumed you had. Health info is not HIPAA-covered there (no contract). A lawyer’s material can lose its privilege. A company secret can lose its trade-secret status. Privacy laws (in the U.S. and Europe) treat your inputs as regulated data. And the headlines are real: engineers leaked source code into ChatGPT (2023); a regulator banned and fined it. IMPORTANT: this is educational, not legal advice — for your situation, ask a licensed attorney.',
    inApp: 'Read the curriculum’s plain-language legal summary. The point is not to make you a lawyer — it is to make you pause before pasting anything from the DO-NOT-SHARE list.',
    anchor: { ref: 'Proverbs 13:16; Romans 13:1', theme: 'The wise act with knowledge; be subject to the governing authorities. Respecting the law that protects people’s data is part of loving your neighbor.' },
    rpe: {
      research: 'For one category on the DO-NOT-SHARE list, find which protection it loses if pasted into a consumer chatbot.',
      plan: 'Decide who in your world handles regulated data (health, students, clients) and most needs this.',
      execute: 'Share the one-line warning with that person — and remind them (and yourself) this is not legal advice.',
    },
    levels: {
      child: 'There are rules — real laws — that keep people’s private things safe, like doctor secrets and school records. When you put those things into a chatbot, you can accidentally break the shield that was protecting them. Grown-ups have laws about this. One time, workers at a big company put secret work into ChatGPT and got in big trouble. The lesson: the private stuff has rules around it, and a chatbot does not follow those rules — so we keep the private stuff out. (And if it is a serious question, a grown-up asks a real lawyer.)',
      teen: 'Here is why the list is not just "good manners" — it is law. Health info: a consumer chatbot is NOT a HIPAA-protected place, and the company will not sign the contract that would make it one. A lawyer’s advice: telling a third party (the A.I. company) can WAIVE the privilege that kept it secret. Company secrets: a "trade secret" only stays protected if you keep it secret — paste it into a public tool and you can lose that protection. Privacy laws in California and Europe treat what you type as regulated data. And it is not hypothetical: in 2023, Samsung engineers pasted source code into ChatGPT and the company banned it; Italy temporarily banned ChatGPT and later fined the maker (that fine was reportedly thrown out later on a technicality). One honest note your teachers will not skip: this is education, NOT legal advice — real situations need a real attorney.',
      senior: 'A plain map of the legal terrain — offered as education, explicitly NOT as legal advice; consult a licensed attorney for any real matter. HIPAA: it protects health information only when a covered entity or its business associate handles it under a Business Associate Agreement; consumer chatbots are not business associates and will not sign a BAA for consumer tiers, so pasting protected health information there falls outside HIPAA’s safeguards entirely. Attorney-client privilege and work product: privilege depends on confidentiality, and disclosing privileged material to a third party — the A.I. vendor — can waive it; at least one 2026 court has examined a chatbot’s privacy terms and found no reasonable expectation of confidentiality. Trade secrets and NDAs: trade-secret status requires "reasonable measures" to keep information secret, and voluntarily feeding it into a public tool can forfeit that status. Privacy statutes: California’s CCPA/CPRA places identifiers, financial, health, and similar data in a heightened "sensitive" tier; Europe’s GDPR requires a lawful basis to process personal data; FERPA governs student education records. Real incidents anchor it: in 2023 Samsung engineers pasted proprietary source code into ChatGPT, prompting a corporate ban echoed across other firms; Italy’s regulator temporarily banned ChatGPT in 2023 and later issued a fine (reportedly annulled afterward on procedural grounds — a detail worth stating honestly). The throughline: the protections people assume travel WITH their data do not survive a paste into a third-party consumer tool — and the careful response is to verify against current law and counsel, not memory.',
    },
    quiz: {
      questions: [
        { q: 'Is a consumer chatbot a HIPAA-safe place for health information?', options: ['Yes, all A.I. is HIPAA-safe', 'No — it is not a business associate and will not sign the required contract (BAA) on consumer tiers', 'Only if you ask nicely'], answer: 1, explain: 'HIPAA protection needs a covered entity/BAA. Consumer chatbots are neither, so pasted health info falls outside its safeguards.' },
        { q: 'What can happen to a lawyer’s privileged advice if you paste it into a chatbot?', options: ['It becomes more private', 'You can WAIVE the privilege by disclosing it to a third party', 'Nothing changes'], answer: 1, explain: 'Privilege depends on confidentiality; disclosing to the A.I. vendor (a third party) can waive the protection.' },
        { q: 'What is the honest caveat this whole session carries?', options: ['It is the final legal word', 'It is educational, NOT legal advice — ask a licensed attorney for your situation', 'It only applies in Europe'], answer: 1, explain: 'This is general education. Real situations need a real, licensed attorney.' },
      ],
    },
    lesson: 'This session explains WHY the list matters in law — and it opens with the caveat it will close with: this is educational, not legal advice, and any real situation calls for a licensed attorney. With that said, here is the plain map. Health information: HIPAA only protects it when a covered entity, or a business associate under a signed Business Associate Agreement, handles it. A consumer chatbot is neither and will not sign that contract on a consumer plan, so pasting protected health information there sits entirely outside HIPAA’s safeguards. A lawyer’s material: attorney-client privilege depends on keeping the communication confidential, and disclosing it to a third party — the A.I. vendor — can waive the very privilege that protected it; a 2026 court has already looked at a chatbot’s privacy terms and found a user had no reasonable expectation of confidentiality. Company secrets: information keeps "trade secret" status only when you take reasonable measures to keep it secret, so voluntarily pasting it into a public tool can forfeit that protection and may breach an NDA. Privacy laws treat your inputs as regulated data: California’s CCPA/CPRA puts identifiers, financial, and health data in a heightened "sensitive" tier; Europe’s GDPR requires a lawful basis to process personal data; and FERPA protects student records. And the headlines are not hypothetical. In 2023, Samsung engineers pasted proprietary source code into ChatGPT, and the company banned the tool — a move echoed by other major firms. Italy’s privacy regulator temporarily banned ChatGPT in 2023 and later issued a multimillion-euro fine, which was reportedly annulled afterward on procedural grounds — a detail we state plainly rather than overclaim. The throughline is simple: the protections you assume travel with your data do not survive a paste into a third-party consumer tool. The wise act with knowledge (Proverbs 13:16), and honoring the laws that protect people (Romans 13:1) is part of loving a neighbor — and when the stakes are real, the wise also ask a real lawyer.',
    facilitator: {
      talkingPoints: [
        'HIPAA: consumer chatbots are not business associates and will not sign a BAA — pasted health info is outside HIPAA entirely.',
        'Attorney-client privilege can be WAIVED by disclosing to the A.I. vendor; trade-secret status can be FORFEITED by pasting into a public tool.',
        'Privacy laws treat inputs as regulated: CCPA/CPRA (sensitive tier), GDPR (lawful basis), FERPA (student records).',
        'Real incidents: 2023 Samsung source-code leak + ban; Italy’s 2023 ChatGPT ban + later fine (reportedly annulled on procedure — say so honestly).',
        'CARRY THE CAVEAT: educational, NOT legal advice — real matters need a licensed attorney. Proverbs 13:16; Romans 13:1.',
      ],
      howToRun: 'Prayer + the anchor (5): pray; read Proverbs 13:16 — the wise act with knowledge. | Recap last week (10): a learner explains "off is not erase" and tiers. | Teach the big idea (15): HIPAA / privilege / trade secret / privacy laws in plain words; the Samsung + Italy incidents; the not-legal-advice caveat, twice. | Try it in the app (15): read the plain-language legal summary; each learner names which protection their riskiest category would lose. | Discussion (10): which protection did you assume followed your data automatically? | Send-off + solo task (5): solo task — warn one person who handles regulated data, and tell them to ask a lawyer for specifics.',
      discussionPrompts: [
        'Which protection surprised you that it does NOT follow your data into a chatbot?',
        'Why does telling a third party (the A.I. company) break privilege or trade-secret status?',
        'How do we take the law seriously while being honest that this is not legal advice?',
      ],
    },
  },
  // ---------------------------------------------------------------------------
  {
    id: 'aib5-real-world-scenarios',
    title: 'Real-world scenarios — would you paste this?',
    bigIdea: 'The rule gets real in everyday moments. A church helper wants A.I. to write a get-well card and types the member’s diagnosis. A teen pastes a friend’s full name and address to win an argument. Someone pastes a bank statement to "help me budget." A volunteer pastes the church directory to make a thank-you list. An employee pastes a work file with a customer’s details. Each one feels harmless. Each one is on the list. The skill is to STOP, then redact, use a protected tool, or use our own sovereign A.I.',
    inApp: 'Take three real tasks you actually do and sort them out loud: safe to paste as-is, needs redacting first, or must stay on our own A.I. Confirm the private ones never go to a vendor.',
    anchor: { ref: 'Proverbs 27:12; James 1:5', theme: 'The prudent see danger and take cover; if anyone lacks wisdom, let him ask God, who gives generously. Wisdom is pausing in the ordinary moment to ask "should this go in?"' },
    rpe: {
      research: 'List five real things you have asked (or wanted to ask) a chatbot to help with.',
      plan: 'Sort each into safe-as-is, redact-first, or sovereign-only.',
      execute: 'Do the next one the safe way — redact it, or run it on our own A.I.',
    },
    levels: {
      child: 'Let us play "would you paste this?" A helper at church wants the robot to write a nice card for someone who is sick — but should they type what the person is sick WITH? (No — that is health info.) A kid wants to type a friend’s name and address to win an argument — okay or not? (Not okay — that is someone else’s private info.) Someone wants help with money and types their bank number — yes or no? (No!) The trick is to STOP and check the list first. If it is private, we take the secret part out, or we use our OWN A.I. at home.',
      teen: 'Let us run real ones. (1) A church volunteer asks ChatGPT to write a get-well card and types "Sister Jackson, 78, just diagnosed with..." — STOP: that is someone else’s health info. Fix: write it generically, no name, no diagnosis. (2) You paste a friend’s full name + address to settle an argument — STOP: others’ info, and if they are a minor, worse. Fix: do not. (3) "Help me budget" + a pasted bank statement — STOP: financial data. Fix: remove the numbers, or use our A.I. (4) A volunteer pastes the church directory to make a thank-you list — STOP: that is everyone’s private info at once. Fix: do it without the file, or on our box. (5) An employee pastes a work file with a customer’s details into a chatbot to summarize it — STOP: employer + customer data (this is the Samsung mistake). Fix: a work-approved tool only. The pattern is always the same: STOP, then redact, protect, or go sovereign.',
      senior: 'Judgment is built by rehearsing the ordinary cases before they happen. Case one: a ministry helper drafts a get-well note and types a member’s name and diagnosis — this is another person’s health information; the fix is to compose it generically, with no identifying or medical detail, or to use our own A.I. Case two: a young person pastes a peer’s full name and address — others’ personal data, and if the peer is a minor it carries the strongest protection; the fix is simply not to. Case three: "help me budget," with a pasted statement — financial account data; the fix is to remove the numbers and ask the general question, or to keep it on hardware we own. Case four: a volunteer pastes the church directory to generate a thank-you list — that is the regulated personal data of the entire congregation in one action; the fix is to do the task without uploading the roster, or to run it on our sovereign A.I. where it never leaves. Case five: an employee pastes an internal document containing a customer’s details to get a summary — employer-confidential plus another party’s data, the exact shape of the well-known 2023 corporate leak; the fix is a work-sanctioned, contractually-protected tool, never a personal chatbot. Notice the common structure: each feels harmless and time-saving, each maps to the DO-NOT-SHARE list, and each has the same three escape hatches — redact to a de-identified version, move to a properly-contracted tier, or use the A.I. that runs on our own iron. The reflex this course builds is the half-second pause: before pasting, ask "is any of this on the list?" — and if anyone lacks that wisdom in the moment, James says to ask God, who gives it generously.',
    },
    quiz: {
      questions: [
        { q: 'A helper wants A.I. to write a get-well card. What is the safe move?', options: ['Type the person’s name and exact diagnosis', 'Write it generically — no name, no medical detail — or use our own A.I.', 'Paste their whole medical history'], answer: 1, explain: 'A name + diagnosis is someone else’s health info. Keep it generic, or use the sovereign A.I. that never leaves home.' },
        { q: 'A volunteer wants to paste the church directory to make a thank-you list. Okay?', options: ['Yes, it saves time', 'No — that is the whole congregation’s private data at once; do it without the file or on our own A.I.', 'Only on Sundays'], answer: 1, explain: 'Uploading a roster exposes everyone’s regulated personal data in one action. Do the task without it, or keep it sovereign.' },
        { q: 'What is the common pattern across every scenario?', options: ['Paste fast, ask later', 'STOP, then redact, use a protected tool, or use our own sovereign A.I.', 'Email it instead'], answer: 1, explain: 'Each case feels harmless, maps to the list, and has the same three fixes: redact, protect, or go sovereign.' },
      ],
    },
    lesson: 'The rule only protects you if it shows up in the ordinary moment, so this session rehearses real cases until the pause becomes a reflex. Picture a ministry helper drafting a get-well card who types the member’s name and exact diagnosis into ChatGPT — it feels kind, but it is another person’s health information; the safe version is generic, with no name and no medical detail, or written on our own A.I. Picture a young person pasting a friend’s full name and address to settle an argument — that is someone else’s personal data, and if the friend is a minor it carries the strongest protection of all; the safe version is simply not to. Picture "help me budget" with a bank statement pasted in — that is financial account data; the safe version removes the numbers and asks the general question, or keeps the whole task on hardware we own. Picture a volunteer pasting the church directory to generate a thank-you list — in one action that exposes the entire congregation’s regulated personal data; the safe version does the task without uploading the roster, or runs it on our sovereign A.I. where nothing leaves. And picture an employee pasting an internal file with a customer’s details into a chatbot for a quick summary — that is employer-confidential information plus another party’s data, the exact shape of the famous 2023 corporate leak; the safe version is a work-approved, contractually-protected tool, never a personal account. The structure is identical every time: it feels harmless, it maps to the DO-NOT-SHARE list, and it has the same three escape hatches — redact it to a de-identified version, move it to a properly-contracted tier, or use the A.I. that runs on our own iron. The prudent see danger and take cover while the simple keep walking (Proverbs 27:12); and when wisdom runs short in the moment, James says to ask God, who gives generously (James 1:5). The whole skill is the half-second pause before the paste.',
    facilitator: {
      talkingPoints: [
        'Five real cases: get-well card with a diagnosis; a friend’s name+address; "help me budget" + statement; pasting the church directory; a work file with customer data.',
        'Each feels harmless, each maps to the DO-NOT-SHARE list — that is exactly why a STOP reflex matters.',
        'Same three fixes every time: REDACT to de-identified, move to a PROTECTED/contracted tier, or use our SOVEREIGN A.I.',
        'The directory case is the sleeper: one upload exposes the whole congregation’s data.',
        'Build the half-second pause before pasting (Proverbs 27:12; James 1:5).',
      ],
      howToRun: 'Prayer + the anchor (5): pray; read Proverbs 27:12 — the prudent take cover. | Recap last week (10): a learner names a protection that does not follow data into a chatbot. | Teach the big idea (15): walk all five scenarios; for each, name the category and the safe fix. | Try it in the app (15): learners sort three of their OWN real tasks into safe-as-is / redact-first / sovereign-only. | Discussion (10): which scenario have you (or someone you know) almost done? | Send-off + solo task (5): solo task — do your next chatbot task the safe way, and tell one person about the directory trap.',
      discussionPrompts: [
        'Which scenario felt the most "but that seems harmless" to you?',
        'Why is pasting a directory or roster worse than it first appears?',
        'When is redacting enough, and when do you need to go fully sovereign?',
      ],
    },
  },
  // ---------------------------------------------------------------------------
  {
    id: 'aib6-safe-use-blueprint-sovereign',
    title: 'The safe-use blueprint — and the sovereign answer',
    bigIdea: 'Here is the whole blueprint on one card. Redact before you paste (names to "Person A," numbers to "XXXX"). Never paste live secrets — and if you did, change them. Match the tool to the sensitivity: public and general is fine on any chatbot; regulated or confidential needs a contracted tier — or best of all, an A.I. that never leaves your own hardware. That last line is exactly why PoeTech runs SOVEREIGN, local A.I.: your sensitive data stays on machines you own. You own this lesson when you can teach the one rule to one person.',
    inApp: 'Open our own A.I. and do one real sensitive task on it that you would never do on a vendor chatbot — a family or ministry note with real details. Feel the difference: it never left the house.',
    anchor: { ref: 'Matthew 10:16; 2 Timothy 2:2', theme: 'Be wise as serpents and innocent as doves; entrust what you have learned to faithful people who can teach others. Wisdom plus the safe place, handed on.' },
    launch: { view: 'church', churchView: 'home', churchSection: 'speak' },
    rpe: {
      research: 'Pick the one idea from this course that changed how you will use A.I.',
      plan: 'Write its plain, one-sentence version a newcomer could remember.',
      execute: 'Teach it to one person this week — and put your name forward to help teach the next cohort.',
    },
    levels: {
      child: 'Here is the whole blueprint, simple: (1) Take out the private parts before you type (use "Person A" instead of a name). (2) Never type passwords — and if you did, change them. (3) For private things, use our OWN A.I. at home, because it never sends your words away. That is why we built our own A.I.: so your secrets stay YOUR secrets, in our house, on our computer. The last step is the best one: teach the one rule — "if you would not put it on a billboard, do not paste it into a chatbot" — to one person you love.',
      teen: 'The whole course on one card. (1) REDACT before you paste: names become "Person A," numbers become "XXXX," ask the general version of your question. (2) NEVER paste live secrets (passwords, keys) — and if you slipped, change them. (3) MATCH the tool to the sensitivity: public/general stuff is fine on any chatbot; regulated or confidential stuff needs a business/enterprise tier with the right contract — or best of all, an A.I. that runs on hardware you own and never sends your words anywhere. (4) Turn off chat history/training, and remember off is not erase. That third point is the big one and it is why PoeTech builds SOVEREIGN, local A.I.: for the family’s and church’s truly private stuff, our model runs on our own NAS, so there is no stranger’s server, no human reviewer, no training on your words. Want to go deeper on the why? That is the companion course, "Sovereign A.I.: Why We Build Local." You truly own THIS course when you can teach the one rule to one person.',
      senior: 'The blueprint, and the structural answer underneath it. First, redaction: de-identify before you paste — replace names, account numbers, and dates with placeholders, and remember that combinations can re-identify a person, so generalize rather than merely deleting a single field. Second, secrets: never paste live credentials, and treat any you did paste as compromised and rotate them. Third, right-sizing the tool to the sensitivity: genuinely public, hypothetical, or de-identified work is fine on a consumer chatbot; regulated or confidential work belongs on an enterprise/API tier with the proper contract — a no-training, ideally zero-retention agreement, and a Business Associate Agreement where health information is involved — or, best of all, on an A.I. that never leaves hardware you own. Fourth, configure what you do use: turn off history and model-training, while remembering that off is not erase. The fourth point is where this course meets the mission. Every "why" in the earlier sessions — retention, human review, training, the loss of HIPAA protection or privilege or trade-secret status, the regulator actions — has the SAME structural cure: if the data never leaves your premises, there is no third party to retain it, review it, train on it, or to whom any protection is waived. That is precisely why PoeTech runs sovereign, local A.I.: for the family’s and the congregation’s sensitive work, the model runs on our own NAS, and the data stays home. The companion course, "Sovereign A.I.: Why We Build Local," develops that architecture in full; this course is its front door. And the final discipline is multiplication — you own this material when you can teach it, so Paul’s charge to entrust what you have learned to faithful people who can teach others (2 Timothy 2:2) is the assignment. Be wise as serpents and innocent as doves (Matthew 10:16): shrewd about where data goes, gentle in protecting your neighbor’s.',
    },
    quiz: {
      questions: [
        { q: 'What is the first step before pasting something borderline?', options: ['Paste it and hope', 'Redact it — names to "Person A," numbers to "XXXX," ask the general version', 'Make the text bigger'], answer: 1, explain: 'De-identify first; and remember combinations can still identify someone, so generalize rather than just deleting one field.' },
        { q: 'Why does PoeTech run sovereign, local A.I.?', options: ['Because it is trendy', 'So sensitive data never leaves hardware we own — no third party to store, review, train on, or waive protections to', 'To make it slower'], answer: 1, explain: 'The local model removes the third party entirely, which is the single structural cure for every risk in this course.' },
        { q: 'How do you prove you truly own this lesson?', options: ['By keeping it to yourself', 'By teaching the one rule simply to one person', 'By finishing first'], answer: 1, explain: 'Mastery shows in teaching it plainly (2 Timothy 2:2). Builders raise builders; protectors raise protectors.' },
      ],
    },
    lesson: 'This is the commissioning, and it fits on a single card. Step one, redact before you paste: turn names into "Person A," account and card numbers into "XXXX," and ask the general version of your question — and because combinations of details can still identify a person, generalize rather than merely deleting one field. Step two, never paste live secrets; if you already did, treat them as exposed and change them. Step three, match the tool to the sensitivity: genuinely public, hypothetical, or de-identified work is perfectly fine on a consumer chatbot, but regulated or confidential work belongs on an enterprise or API tier with the right contract — a no-training and ideally zero-retention agreement, plus a Business Associate Agreement wherever health information is involved — or, best of all, on an A.I. that never leaves hardware you own. Step four, configure what you do use: turn off chat history and model-training, while remembering that off is not the same as erased. That third step is where this whole course meets our mission. Look back at every "why" we covered — retention, human review, training on your words, the loss of HIPAA protection, the waiver of a lawyer’s privilege, the forfeit of a trade secret, the regulator actions — and notice they all have the SAME structural cure. If the data never leaves your premises, there is no third party to store it, no reviewer to read it, no model trained on it, and no one to whom any protection is waived. That is exactly why PoeTech runs sovereign, local A.I.: for the family’s and the congregation’s sensitive work, the model runs on our own NAS, and the data stays home. Its companion course, "Sovereign A.I.: Why We Build Local," develops that architecture in full; this course is its front door — the "what never to hand over," paired with "here is the safe place to do it." And the last discipline is multiplication: you own this material the moment you can teach it, so the assignment is Paul’s charge to Timothy — entrust what you have learned to faithful people who will teach others also (2 Timothy 2:2). Be wise as serpents and innocent as doves (Matthew 10:16): shrewd about where your data goes, and gentle in guarding your neighbor’s. (And the standing caveat remains: this is education, not legal advice — for your situation, ask a licensed attorney.)',
    facilitator: {
      talkingPoints: [
        'The blueprint card: (1) REDACT before pasting, (2) never paste live SECRETS (rotate if you did), (3) MATCH tool to sensitivity, (4) turn off history/training (off is not erase).',
        'The sovereign answer: a local A.I. removes the third party entirely — the single structural cure for every "why" in the course.',
        'That is why PoeTech runs sovereign/local A.I.: sensitive family + church work stays on our own NAS. Companion: "Sovereign A.I.: Why We Build Local."',
        'Multiplication: you own it when you can teach the one rule to one person (2 Timothy 2:2).',
        'Carry the caveat to the end: educational, NOT legal advice. Matthew 10:16 — wise and gentle.',
      ],
      howToRun: 'Prayer + the anchor (5): pray; read Matthew 10:16 — wise as serpents, innocent as doves. | Recap last week (10): a learner names the three fixes (redact / protect / sovereign). | Teach the big idea (15): the four-step blueprint; the structural cure (data that never leaves); the PoeTech sovereign tie-in + companion course. | Try it in the app (15): each learner does one real sensitive task on our own A.I. that they would never do on a vendor chatbot. | Discussion (10): which idea from this course will you actually change a habit over? | Send-off + solo task (5): commission them — teach the one rule to one person and put your name on the next-cohort helper list.',
      discussionPrompts: [
        'Which of the four blueprint steps will be hardest for you to remember in the moment?',
        'How does "the data never leaves" cure ALL of the earlier risks at once?',
        'Who is the one person you will teach the billboard rule to this week?',
      ],
    },
  },
];

// ---------------------------------------------------------------------------
// Course-specific helpers — thin wrappers over the GENERIC, tested helpers in
// church-classes.js, so this course behaves identically to the other courses.
// ---------------------------------------------------------------------------

// Distinct interest + helper tags so the Governor's roster tells these sign-ups apart.
export const AI_LEGAL_BLUEPRINT_INTEREST_TAG = '[AI Legal Blueprint class interest]';
export const AI_LEGAL_BLUEPRINT_HELPER_TAG = '[AI Legal Blueprint class helper]';

export function resolveAiLegalBlueprintCohort(localCohort = null) {
  return resolveCohortGeneric(localCohort, AI_LEGAL_BLUEPRINT_CONFIRMED_COHORT, AI_LEGAL_BLUEPRINT_PROPOSED_COHORT_START);
}

export function buildAiLegalBlueprintSchedule(startISO) {
  return buildScheduleFor(AI_LEGAL_BLUEPRINT_MODULES, startISO, AI_LEGAL_BLUEPRINT_META.cadenceDays);
}

export function aiLegalBlueprintProgressSummary(progress = {}) {
  return progressSummaryFor(AI_LEGAL_BLUEPRINT_MODULES, progress);
}

export function exportAiLegalBlueprintCurriculumMarkdown(startISO = null) {
  return exportCurriculumMarkdownFor(
    { meta: AI_LEGAL_BLUEPRINT_META, sessionFlow: AI_LEGAL_BLUEPRINT_SESSION_FLOW, modules: AI_LEGAL_BLUEPRINT_MODULES },
    startISO,
  );
}

// The tutor course-meta this class passes to askTutor so the per-week solo guide
// introduces itself as the AI-Legal-Blueprint course — keeping the test-and-verify
// discipline, the not-legal-advice caveat, and the steward's posture, age-aware.
export const AI_LEGAL_BLUEPRINT_TUTOR_META = {
  title: AI_LEGAL_BLUEPRINT_META.title,
  intro: 'You are a patient, plain-spoken tutor for a family + church course called "AI Legal Blueprint: What Never to Tell a Chatbot."',
  posture: 'Guide ONE learner — who may be a child, a teen, an adult, or a non-technical senior — to understand what information they must NOT paste into a vendor/consumer A.I. chatbot (full names with address/DOB, government IDs, financial account numbers, health info, passwords/keys, work/confidential/proprietary data, attorney material, other people’s data without consent, and children’s data) and WHY (retention, human review, training on inputs, and the loss of protections like HIPAA, attorney-client privilege, and trade-secret status; consumer vs enterprise/API tiers). Match your pace and words to their age; use the one rule (the billboard test) often. Be HONEST that laws and vendor policies change fast, so tell them to verify a specific number against the live policy rather than trusting it, and ALWAYS state that this is educational, NOT legal advice — for a specific situation they should consult a licensed attorney. Point them to the sovereign answer: our own local A.I. keeps sensitive data on hardware we own, which is why PoeTech builds it (companion course: "Sovereign A.I.: Why We Build Local"). Always remind them to TEST what any A.I. tells them.',
};
