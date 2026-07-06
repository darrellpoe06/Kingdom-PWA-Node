// =============================================================================
// datasystems-course — "PoeTech Data Systems & Infrastructure"
// =============================================================================
// A Word-first, SELF-PACED onboarding + operating course for PoeTech and Church
// of the Living God (COLG) STAFF and VOLUNTEERS — and anyone learning to steward
// the systems. It teaches, plainly and for non-technical people, how the whole
// thing actually works: the shared data layer, the improvement loops under the
// Quality Care Health Plan, how the modules connect, the harvest/content pipeline,
// the CRM/funnels, the church + business + family domains, and Ari (the A.I.) —
// THEN the church tech stack a volunteer should understand (the LED video wall +
// NovaStar processor, the NAS, the 2x RTX 4070 GPU node, the network, and how it
// all serves Sunday and Wednesday) — THEN the practical skills (running a service,
// adding content with no JSON, the voice + help, role-appropriate tasks) — and an
// onboarding path so a new person comes up to speed in HOURS, not weeks.
//
// It rides the SAME shared Learn engine as the other PoeTech / COLG courses — the
// generic helpers in church-classes.js, the self-driving tutor (class-tutor.js ->
// askTutor), and the multi-modal lesson schema + age/experience-adaptive levels +
// quiz + graduate->helper from learn-framework.js. Like "Living Lessons" and
// "Running the Board," it is SELF-PACED (a staff member or volunteer learns
// whenever they step into a role), so it sets `meta.unit` to render rows as
// "Modules" instead of weekly cohort sessions (a small, back-compatible label
// layer; the weekly cohort courses, which set no `meta.unit`, are unchanged).
//
// LIVING (binding, item 5 of Darrell's brief): this course is SOURCED FROM the real
// system and shares material with the in-app contextual "?" help. The "This course
// stays true" module imports the live HELP registry (help-content.js) and teaches
// from it, so the course and the inline help cannot drift apart — update the help,
// and the course's tour of the surfaces updates with it. The course is a live view
// of the system, not a frozen doc (DR-0061, DR-0075, DR-0076).
//
// VERIFICATION / NO-FABRICATION (DR-0076, Reality-Trace, and the Source-of-Answers
// rule):
//   * Every infrastructure fact taught here is grounded in committed source docs
//     and code, cited in the comments above each module. Where a value is an
//     ESTIMATE or awaits the church's own subject-matter expert (SME) — Christina,
//     Bishop Gwin, the sound engineer, or Darrell — it is named as TO CONFIRM in
//     plain language inside the lesson, never presented as settled. We teach what
//     is verified and we say honestly what is not.
//   * SCRIPTURE is cited by REFERENCE with a plain-language theme gloss — NOT a
//     quoted translation — per SCRIPTURE-REFERENCE-STANDARD (do not present a
//     paraphrase as a translation; fetch the actual translation if a quote is ever
//     wanted). Anchors are real stewardship / craftsmanship / order / truth-testing
//     passages (Bezalel the Spirit-given craftsman, the faithful steward, "decently
//     and in order," "test everything," "entrust to faithful people who will teach
//     others," El Roi the God who sees).
//   * WELL-BEING-POSITIVE + servant-framed: we steward these systems so the BODY is
//     equipped and the family + community are lifted (COMMUNITY-FIRST,
//     DATA-AS-EMPOWERMENT). The systems exist to make the person more able to
//     follow The Way, never to extract from them.
//
// SME FLAGS (surfaced for Christina / Bishop Gwin / the sound engineer / Darrell to
// confirm or enrich; we do not fabricate around them):
//   * The exact LED-wall pixel map from the NovaStar config / module datasheet
//     (the canvas figure here is the documented design estimate).
//   * Which RTX 4070 node serves what during a live service, and the exact model
//     loaded on each today (documented as ~14B-class; verify what is actually
//     loaded).
//   * The COLG sovereign NAS status (the home NAS is documented; the church stack
//     is "build in progress").
//   * The current switcher + streaming software names at COLG, and whether the team
//     runs ProPresenter exclusively today or hybrid.
// =============================================================================

// The course imports the live help registry so the "stays true" module teaches from
// the SAME source as the inline "?" help — the living tie (item 5). If the help
// grows, this module's surface-tour grows with it; it can never silently drift.
import { HELP, ROADMAP } from './help-content.js';

// Self-paced: no cohort, no weekly clock. These exports mirror the other courses so
// the host wiring is identical, but the start is null (no painted dates) and the UI
// reads "Self-paced."
export const DATASYSTEMS_PROPOSED_COHORT_START = null;
export const DATASYSTEMS_CONFIRMED_COHORT = { startDate: null, confirmed: false };

export const DATASYSTEMS_META = {
  key: 'datasystems',
  title: 'PoeTech Data Systems & Infrastructure',
  audience: 'PoeTech and Church of the Living God staff and volunteers — and anyone stewarding the systems',
  tagline: 'Understand the whole system, learn the church tech, and come up to speed in hours — so you can steward it well.',
  cadenceDays: 7,
  // The module count grows as the system grows and as the SMEs enrich it. Keep this
  // in step with DATASYSTEMS_MODULES.length (asserted in the test).
  weeks: 14,
  handsOnLabel: 'Try it in the app',
  unit: {
    noun: 'module',
    nounPlural: 'modules',
    cap: 'Module',
    selfPaced: true,
    sessionLabel: 'How to learn it (alone, or with a teammate showing you)',
    countNoun: 'module',
  },
  footer: '_Built to equip the Church of the Living God + PoeTech staff and volunteers to steward the systems · on PoeTech, sovereign and local. We steward so the Body is equipped and the family and community are lifted (1 Corinthians 4:2; Colossians 3:23). This course is a LIVE view of the real system and shares its material with the in-app "?" help — it stays true as the app grows. Where a fact awaits the church\'s own expert, it is flagged honestly, never guessed._',
};

// A practical learning rhythm for one module at your own pace — not a lecture clock.
export const DATASYSTEMS_SESSION_FLOW = [
  { minutes: 2, name: 'Pray + read the anchor — we steward for the Body' },
  { minutes: 8, name: 'The big idea, in plain words' },
  { minutes: 12, name: 'Go deeper — how it really works' },
  { minutes: 10, name: 'Try it in the app (or at the equipment)' },
  { minutes: 5, name: 'Check yourself + carry it into your role' },
];
export const DATASYSTEMS_SESSION_MINUTES = DATASYSTEMS_SESSION_FLOW.reduce((t, s) => t + s.minutes, 0);

export const DATASYSTEMS_MODULES = [
  // ===========================================================================
  // AREA 1 — COMPREHENSIVE UNDERSTANDING (how the data systems work)
  // ===========================================================================
  // ---------------------------------------------------------------------------
  {
    id: 'dsi1-what-poetech-is',
    title: 'What PoeTech is — one app, real data, for the Body',
    bigIdea: 'PoeTech is ONE app — a Progressive Web App you open in a browser or install on a phone — that the family and the church use to run real life: money, church, business, learning, and the systems behind worship. Two things make it different from ordinary software. First, every screen is a LIVE VIEW of real state — never a painted, pretend number. Second, it is SOVEREIGN: it runs on our own equipment and serves the people who use it, instead of extracting from them. Learn those two ideas and the whole system makes sense.',
    inApp: 'Open the app and look at the top navigation. Notice it is grouped — Money, Business, Church, Create, Start. Tap into one tab (try Church) and read what is actually on the screen. Ask yourself the question this whole course answers: "where does this number come from?" Every honest answer is "from real data," and this course shows you the path.',
    anchor: {
      ref: '1 Corinthians 4:2; Colossians 3:23',
      theme: 'It is required of stewards that they be found faithful; and whatever you do, work at it heartily, as for the Lord. PoeTech is a tool for faithful stewardship — of money, of the church\'s work, of the gifts entrusted to us — done as unto the Lord, not as unto a vendor.',
    },
    benefits: [
      'You stop being intimidated by "the app" — it is one tool with a handful of grouped areas, not a maze.',
      'You learn the one habit that makes you trustworthy with it: ask where every number comes from.',
      'You understand WHY it is built the way it is — sovereign and serving, not extractive — so you can explain it to others.',
      'A confident first step: you can find your way around and know what this course will teach you next.',
    ],
    levels: {
      teen: 'PoeTech is one app — like an app on your phone, but it works in a browser too. The family and the church use it for real stuff: tracking money, running church things like the choir and the order of service, learning, and the tech behind Sunday. Two big ideas. ONE: everything on the screen is REAL. If it says the choir sang a song, it is because that really happened and got recorded in the system — nobody typed a fake number to make it look nice. TWO: it runs on OUR OWN computers (a storage box at the house and computers at the church), not on some giant company\'s servers that would sell our information. That is called "sovereign" — we own it, it serves us. When you remember "real data" and "we own it," everything else in this course clicks.',
      senior: 'PoeTech is a single Progressive Web App (a website that also installs like a native app and works offline) that unifies what used to be many separate tools: personal/business finance, the church\'s operations (choir, order of service, the Word, Scripture, learning), business pipelines, and the infrastructure that serves worship. Two architectural commitments distinguish it. First, every surface is a live view of real state — the team\'s binding rule is "no painted numbers"; a value you see traces to a real database row, a real run, or a real timestamp, or it is shown honestly as empty/awaiting rather than faked. Second, it is sovereign by design: the data lives on the family\'s and the church\'s own equipment (a Synology NAS at home, RTX-4070 machines at the church), under our control, built so the system serves the person rather than extracting from them — no advertising model, no engagement-maximizing, exportable, family-governed. Those two commitments — truth and sovereignty — are the lens for everything else you will learn.',
    },
    quiz: {
      questions: [
        {
          q: 'What does it mean that every screen in PoeTech is a "live view of real state"?',
          options: [
            'The screens are decorated with example numbers that look realistic',
            'Every value traces to real data — a real row, run, or timestamp — or is shown honestly as empty, never faked',
            'The screens update only once a year',
          ],
          answer: 1,
          explain: 'The binding rule is "no painted numbers." A value is a live view of real state, or it is shown honestly as empty/awaiting — it is never a pretend number dressed up to look real.',
        },
        {
          q: 'What does "sovereign" mean for PoeTech?',
          options: [
            'It is controlled by a large outside technology company',
            'It runs on our own equipment and serves the people who use it, instead of extracting from them',
            'It only works when you are offline',
          ],
          answer: 1,
          explain: 'Sovereign means we own and control the system — it runs on the family\'s and church\'s own hardware and is built to serve, not to extract (no ads, no engagement-farming, exportable, family-governed).',
        },
      ],
    },
    lesson: 'Before any button or screen, understand what PoeTech IS, because it shapes everything else you will learn. It is one app — a Progressive Web App, which means it is a website that also installs onto a phone or computer like a normal app and keeps working even with no internet. The family and the Church of the Living God use this one app to run real life: money (accounts, debts, giving, forecasts), the church\'s work (the choir, the order of service, the Word, the Scripture library, learning), business pipelines, and the technical systems behind worship. It replaces a drawer full of separate tools with one place. Now the two ideas that make it trustworthy and worth stewarding. The FIRST is truth: every screen is a live view of real state. There is a binding rule on this project — "no painted numbers." A number you see on a screen is not decoration; it traces back to a real record, a real run, or a real timestamp. If the system does not yet have the real data for something, it shows you that honestly — "not connected," "awaiting," empty — rather than inventing a pretty figure to fill the space. A made-up number on a surface whose whole value is trust is worse than no number at all. So the most important habit you can build, starting today, is to ask of anything on screen: "where does this come from?" The SECOND idea is sovereignty: PoeTech runs on our OWN equipment — a storage and automation box (the NAS) at the house, and computers at the church — under our own control, rather than on a big company\'s servers that would mine the family\'s and congregation\'s information to sell. It is built to serve the people who use it, not to extract from them: no advertising, no tricks to keep you hooked, your data is yours and you can take it with you, and the family governs changes. That is what "sovereign" means here, and it is not just a technical choice — it is a moral one, rooted in the conviction that systems should make a person more able to follow The Way, never less. Hold those two — truth and sovereignty — and the rest of this course is just detail hanging on that frame. Scripture frames the calling exactly: it is required of stewards that they be found faithful (1 Corinthians 4:2), and we work at it heartily as for the Lord (Colossians 3:23). You are not learning software for its own sake; you are learning to steward a tool for the Body.',
    facilitator: {
      talkingPoints: [
        'PoeTech is ONE app (a PWA — installs like an app, works offline) that unifies money, church, business, learning, and the worship infrastructure.',
        'Idea 1 — TRUTH: every screen is a live view of real state. The binding rule is "no painted numbers"; unknown data is shown honestly as empty/awaiting, never faked.',
        'Idea 2 — SOVEREIGNTY: it runs on our own equipment (NAS at home, RTX-4070 machines at church) and serves the people, not extracts from them.',
        'The one habit to build: ask "where does this number come from?" of everything on screen. The rest of the course answers that for each surface.',
        'Stewardship framing: faithful with what is entrusted (1 Cor 4:2), worked heartily as for the Lord (Col 3:23) — a tool for the Body, not software for its own sake.',
      ],
      howToRun: 'Pray + read the anchor (2): read 1 Corinthians 4:2 — faithful stewards. | The big idea (8): open the app, walk the grouped nav, name the five areas. | Go deeper (12): teach truth (no painted numbers) and sovereignty (our own equipment, serves not extracts) with one concrete screen each. | Try it in the app (10): pick any number on screen together and trace where it comes from. | Check yourself + carry it (5): have them state the two big ideas in their own words and the one habit (ask where the number comes from).',
      discussionPrompts: [
        'Why is a made-up number on a trust surface worse than showing nothing at all?',
        'What is the practical difference, for our family and church, between a sovereign system and one run by a big tech company?',
        'Where in your role will the habit "ask where the number comes from" matter most?',
      ],
    },
  },
  // ---------------------------------------------------------------------------
  // Grounds: COMPLETION-ROADMAP.md (RLS multi-tenancy, ~35 synced tables, ~7
  // local-only collections, device-first + cloud sync); DATA-AS-EMPOWERMENT-NOT-
  // EXTRACTION.md (sovereign, exportable, family-governed).
  {
    id: 'dsi2-the-shared-data-layer',
    title: 'Where your data lives — the shared data layer',
    bigIdea: 'Your work is saved in two complementary places. First, on YOUR DEVICE, so the app is fast and works offline. Second, in a SOVEREIGN CLOUD that syncs it across your devices and (where you are allowed) to the family or church. A rule called Row-Level Security (RLS) is the wall that makes sure you only ever see and touch the data your role and relationship permit. The data layer is shared, but what each person sees is governed — that is how one app safely serves a whole family and a whole church.',
    inApp: 'Sign in, make a small change on one device (for example, mark a learning module read), then open the app on another device or browser. Watch it appear there too — that is the cloud sync. Now notice what you do NOT see: data that belongs to a role or relationship you do not hold. That invisible wall is RLS doing its job.',
    anchor: {
      ref: 'Luke 16:10; Proverbs 4:23',
      theme: 'Whoever is faithful in little is faithful in much; and guard your heart, for from it flow the springs of life. The data layer is built to guard what is entrusted — keeping each person\'s information safe and shown only to those who should see it — and faithfulness with the small, real records is what makes the whole trustworthy.',
    },
    benefits: [
      'You trust the app with real work, because you know it is saved on your device AND backed up to the sovereign cloud.',
      'You understand why you can see some things and not others — it is RLS protecting people, not a glitch.',
      'You can keep working offline (in the sanctuary basement, on the road) and know it will sync when you reconnect.',
      'You can explain to a nervous newcomer that their data is theirs, exportable, and never sold.',
    ],
    levels: {
      teen: 'When you do something in the app — add a note, mark a lesson done — it saves in two places. One: right on your phone or laptop, so it is instant and still works with no internet. Two: in our own cloud (on our equipment), which copies it to your other devices and, if you are allowed, shares it with the family or church. Now the important part: not everyone sees everything. There is a security rule called Row-Level Security — think of it as a guard at the door of every drawer of data. The guard checks WHO you are and WHAT your relationship is (are you a parent? a church steward? a tenant?) and only lets you open the drawers you are allowed to. So a kid does not see the family\'s bank stuff, and a volunteer does not see another family\'s private records. The data is shared in one system, but the guard makes sure each person only touches their part.',
      senior: 'PoeTech uses a device-first, sync-second persistence model. State is written locally (so the PWA is fast and fully offline-capable), and synced to a sovereign cloud database (Supabase/Postgres) that replicates across a user\'s devices and, where permitted, across the family or church instance. The access control is Row-Level Security (RLS): policies enforced in the database itself decide, per row, who may read or write — keyed to the signed-in user\'s role in an instance and their relationship to the record. This is structural, not cosmetic: a child role is denied finance and security rows at the database level, a tenant can never reach money rows, a steward sees the church operational data, a governor sees the review surfaces. As of the roadmap snapshot, roughly 35 tables sync this way under RLS, with about 7 collections still local-only and queued to join the synced set (a proven replication pattern, not a redesign). The data is also empowering by commitment, not just by storage: it is exportable, never sold, has no advertising model, and is family-governed. The takeaway for your role: the data layer is one shared system, but what you see and touch is governed by who you are and your relationship — and that governance is enforced where it cannot be bypassed, in the database.',
    },
    quiz: {
      questions: [
        {
          q: 'Where is your work saved when you use the app?',
          options: [
            'Only on a far-away company server you cannot reach',
            'On your device (fast, works offline) AND synced to our sovereign cloud across your devices',
            'Only on paper',
          ],
          answer: 1,
          explain: 'It is device-first (instant and offline-capable) and synced to our own sovereign cloud, which replicates across your devices and, where permitted, the family or church.',
        },
        {
          q: 'What does Row-Level Security (RLS) do?',
          options: [
            'It makes the app load faster',
            'It enforces, in the database itself, who may see or change each row — based on your role and relationship',
            'It deletes old data automatically',
          ],
          answer: 1,
          explain: 'RLS is the wall, enforced in the database where it cannot be bypassed, that lets each person see and touch only the data their role and relationship permit — child-safety and tenant limits are structural.',
        },
      ],
    },
    lesson: 'Everything you do in PoeTech has to be saved somewhere, and understanding where is the foundation for trusting it. The design is "device-first, sync-second." When you act — add a transaction, mark a module read, record a song — the app writes it immediately to YOUR device. That is why it feels instant and why it keeps working when there is no internet, which matters in a sanctuary basement or on the road. Then, when you are connected and signed in, that work syncs to a sovereign cloud database — our own, on infrastructure we control — which copies it to your other devices and, where your role permits, to the shared family or church data. So your work is both close at hand and safely backed up. The part that surprises newcomers is that the data layer is SHARED but what each person sees is GOVERNED. The mechanism is called Row-Level Security, or RLS. Picture a guard standing at every drawer of data who checks two things before letting you open it: who you are (your role in this church or family instance) and your relationship to the record. Based on that, the guard permits or denies you, drawer by drawer — actually, row by row. This is enforced inside the database itself, which is the important part: it is not a screen that politely hides things, it is a wall that cannot be walked around. That is how child-safety is structural — a child\'s role is denied money and security data at the database level, not just hidden on screen — and how a tenant can report a maintenance issue but can never reach a money row. As the system has grown, around 35 tables now sync this way under RLS, with roughly 7 collections still saved only on the device and queued to join the synced set using the same proven pattern. One more thing your role should be able to explain to a nervous newcomer: this data is built to EMPOWER, not extract. It is yours, you can export it, it is never sold, there is no advertising model, and the family governs changes to it. Scripture fits the posture: faithful in little, faithful in much (Luke 16:10), and guard the heart, for from it flow the springs of life (Proverbs 4:23) — the data layer is built to guard what is entrusted and to be faithful with the small, real records, which is exactly what makes the whole thing trustworthy.',
    facilitator: {
      talkingPoints: [
        'Device-first, sync-second: writes go to the device instantly (fast + offline), then sync to our sovereign cloud across devices and (where permitted) the family/church.',
        'RLS = Row-Level Security: a per-row guard enforced IN the database, keyed to your role + relationship. It is a wall, not a hidden screen.',
        'Structural safety: child role denied finance/security rows; tenant can never reach money rows — enforced where it cannot be bypassed.',
        'Scale today: ~35 tables sync under RLS; ~7 collections still local-only and queued to join (same proven pattern, not a redesign).',
        'Empowerment, not extraction: exportable, never sold, no ads, no engagement-farming, family-governed. You can tell a newcomer their data is theirs.',
      ],
      howToRun: 'Pray + read the anchor (2): read Luke 16:10 — faithful in little. | The big idea (8): explain device-first + sovereign-cloud sync with one real change. | Go deeper (12): teach RLS as the in-database guard keyed to role + relationship; give the child + tenant examples. | Try it in the app (10): make a change on one device, watch it sync to another; note what they cannot see. | Check yourself + carry it (5): have them explain to an imaginary newcomer where data lives and why they can\'t see everything.',
      discussionPrompts: [
        'Why does enforcing access in the database (not just hiding it on screen) matter for protecting a child or a tenant?',
        'How would you reassure a newcomer worried that "the app has all my information"?',
        'When in your role will offline-first (work now, sync later) actually save the day?',
      ],
    },
  },
  // ---------------------------------------------------------------------------
  // Grounds: loop-health.js (each loop declares a REAL freshness signal; stagnant
  // loops flagged for keep/retire), interconnect-loops.js (verifies module-to-
  // module loops move LIVE data), QualityProof + legibility-health (the QC gates),
  // DR-0076 (Verification Doctrine), DR-0075 (nothing stagnates silently).
  {
    id: 'dsi3-the-loops',
    title: 'The improvement loops — detect, understand, execute, QC, update',
    bigIdea: 'The system is built to get BETTER on purpose, and it does that through loops. A loop is a cycle the system (and the people running it) runs over and over: DETECT something (a problem, a stale number, a new need), UNDERSTAND it by tracing it to real data, EXECUTE the fix or change, run QUALITY CONTROL to prove it really works, then UPDATE the live surface so it reflects the new truth. This is the heartbeat of the Quality Care Health Plan: nothing is allowed to quietly stop working or sit stale — the system watches its own loops and flags any that have gone quiet.',
    inApp: 'The app actually checks its own loops. Each tracked loop declares a REAL "last updated" signal — when real data last flowed through it. If a loop goes quiet past its limit, the system flags it for a keep-or-retire decision instead of pretending it still works. Find a health or quality surface in the app and read it: it is the system telling the truth about its own freshness.',
    anchor: {
      ref: '1 Thessalonians 5:21; Proverbs 27:23',
      theme: 'Test everything; hold fast what is good. Know well the condition of your flocks, and give attention to your herds. The loops are exactly this — continually testing what works, holding to what is good, and keeping a watchful, honest eye on the real condition of every part of the system.',
    },
    benefits: [
      'You see the system as ALIVE — designed to improve, not to be built once and left to rot.',
      'You understand why "it looks done" is never enough: the QC step demands proof, not appearance.',
      'You can spot a stale or fake loop (a number that never changes) and know it should be flagged, not ignored.',
      'You learn the discipline that protects the whole thing: trace to real data, prove it works, then update.',
    ],
    levels: {
      teen: 'The system is supposed to keep getting better, and it does that with LOOPS. A loop is just a cycle you run again and again. Picture five steps going around a circle: 1) DETECT — notice something (a problem, or a number that has not changed in a long time). 2) UNDERSTAND — figure out what is really going on by looking at the REAL data, not guessing. 3) EXECUTE — make the change or fix. 4) QC (quality control) — actually PROVE it works, with a test or a real check, not just "looks fine to me." 5) UPDATE — the screen now shows the new, true picture. Then it goes around again. The cool part: the app watches its OWN loops. Every loop has a "last updated" stamp from real data. If a loop goes quiet for too long, the app raises its hand and says "hey, this one stopped — should we keep it or retire it?" instead of pretending everything is fine. That honesty is the whole point.',
      senior: 'Continuous improvement is engineered into the platform as loops, and the operating cycle is detect -> understand -> execute -> QC -> update. DETECT: a signal arises — a defect, a stale data feed, a new requirement, or a loop whose freshness has lapsed. UNDERSTAND: you trace it to real state (the Reality-Trace discipline — name the real record/table/feed; do not optimize a display over the nearest convenient data). EXECUTE: make the change. QC: prove it with evidence — a passing deterministic gate, a measured number from the real artifact, a live check — because under the Verification Doctrine (DR-0076) "looks done" is not a status; a claim without evidence does not ship, and a gate that always passes is itself a lie (it must be proven-to-catch the break). UPDATE: the live surface reflects the new real state. This is the Quality Care Health Plan in practice, and it is reinforced by real machinery you can point to: a loop-health registry where each tracked loop declares a genuine "last real update" signal and a stagnant loop is flagged for a Governor keep-or-retire decision (nothing stagnates silently — DR-0075); an interconnection check that verifies module-to-module loops actually move LIVE data and cannot quietly go static; and quality/contrast/consistency gates that fail the build when a property regresses. The cultural rule that ties it together: trust nothing unverified. The loop is not bureaucracy — it is how the system stays honest as it grows.',
    },
    quiz: {
      questions: [
        {
          q: 'What are the five steps of the improvement loop, in order?',
          options: [
            'Guess, ship, hope, forget, repeat',
            'Detect, understand, execute, QC (prove it works), update the live surface',
            'Update, QC, execute, understand, detect',
          ],
          answer: 1,
          explain: 'Detect a need -> understand it by tracing to real data -> execute the change -> QC it with real evidence -> update the live surface to reflect the new truth.',
        },
        {
          q: 'In the QC step, why is "it looks done" not enough?',
          options: [
            'Because appearances can be wrong; QC requires real evidence — a passing gate, a measured number, a live check',
            'Because QC is optional',
            'Because the loop never reaches QC',
          ],
          answer: 0,
          explain: 'Under the Verification Doctrine, a claim without evidence does not ship and a gate must be proven to actually catch the break. "Looks done" is not a status — proof is.',
        },
        {
          q: 'What happens when a tracked loop goes quiet (stops getting real updates) for too long?',
          options: [
            'The system hides it so nobody worries',
            'The system flags it for a keep-or-retire decision — nothing is allowed to sit stale silently',
            'The system deletes all the data',
          ],
          answer: 1,
          explain: 'Each loop declares a real freshness signal; a stale loop is surfaced for a Governor decision. Nothing stagnates silently (DR-0075).',
        },
      ],
    },
    lesson: 'A system that is built once and left alone rots. PoeTech is built to do the opposite — to get better on purpose — and the engine for that is the LOOP. A loop is a cycle you run again and again, and the one at the heart of the Quality Care Health Plan has five steps. DETECT: notice something — a problem reported, a number that has gone stale, a new need, or a loop that has stopped updating. UNDERSTAND: figure out what is really happening by tracing it to REAL data. This is a discipline with a name on this project — the Reality-Trace — and the rule is that you name the real record, table, or feed behind the thing before you touch it, instead of optimizing a pretty display over whatever data happened to be nearest. EXECUTE: make the change or the fix. QC — quality control: PROVE it actually works. This is the step beginners skip and the system refuses to. Under the Verification Doctrine, "it looks done" is not a status; a claim needs evidence — a test that passes, a real number measured from the real thing, a live check you can see — and a quality gate only counts if it has been shown to actually CATCH the kind of break it guards against (a gate that always passes is itself a lie). UPDATE: the live surface now reflects the new, true state, and the loop comes back around. What makes this more than a slogan is that the system runs loops on ITSELF. There is a loop-health registry in which every tracked loop declares a genuine "last real update" signal — when real data actually last flowed through it — and if a loop goes quiet past its threshold, the system flags it for a keep-or-retire decision rather than pretending it still works. There is an interconnection check that verifies the loops BETWEEN modules are really moving live data and cannot silently go static. And there are quality gates — for things like color contrast and consistency — that fail the build when something regresses. The thread through all of it is one rule: trust nothing unverified. Scripture says it plainly: test everything and hold fast what is good (1 Thessalonians 5:21), and know well the condition of your flocks (Proverbs 27:23). The loops are how we keep a watchful, honest eye on the real condition of every part of the system, and how the whole thing keeps improving instead of quietly decaying.',
    facilitator: {
      talkingPoints: [
        'The loop: DETECT -> UNDERSTAND (trace to real data — the Reality-Trace) -> EXECUTE -> QC (prove it) -> UPDATE the live surface. It runs around again.',
        'QC is the step beginners skip: under the Verification Doctrine "looks done" is not a status; proof is. A gate must be proven-to-catch, or it is itself a lie.',
        'The system loops on ITSELF: loop-health flags any tracked loop that goes stale for a keep/retire call (nothing stagnates silently).',
        'Interconnection check verifies module-to-module loops move LIVE data; quality/contrast/consistency gates fail the build on regression.',
        'The one rule under all of it: trust nothing unverified. Test everything, hold fast what is good (1 Thess 5:21); know the condition of the flock (Prov 27:23).',
      ],
      howToRun: 'Pray + read the anchor (2): read 1 Thessalonians 5:21 — test everything. | The big idea (8): draw the five-step loop as a circle; name each step plainly. | Go deeper (12): teach QC + the Reality-Trace + that the system loops on itself (loop-health, interconnect, gates). | Try it in the app (10): open a health/quality surface and read a real freshness signal together. | Check yourself + carry it (5): have them walk one real example through all five steps.',
      discussionPrompts: [
        'Why does the system flag a stale loop instead of quietly hiding it?',
        'Tell about a time "it looked done" but wasn\'t — how would the QC step have caught it?',
        'In your role, what is one loop you are responsible for keeping fresh?',
      ],
    },
  },
  // ---------------------------------------------------------------------------
  // Grounds: video-harvest-coverage-ledger (one source -> many harvests),
  // interconnect-loops.js (module-to-module live data), crm-engine.js (one shared
  // backbone federating funnels), DR-0061 (everything converges in one app).
  {
    id: 'dsi4-how-modules-connect',
    title: 'How the modules connect — and the harvest pipeline',
    bigIdea: 'PoeTech is not a pile of separate apps stuck together — it is modules that CONNECT, so one piece of real work feeds many surfaces. The clearest example is the harvest pipeline: ONE recorded service is transcribed once, and from that single transcript the system fans out the sermon (to the Word), the Scripture references (to the Scripture library), the songs (to the choir library), lessons, and more — so no part of that Sunday is lost. The same connecting principle runs the business funnels through one shared CRM. Everything comes together in one app.',
    inApp: 'In the Church area, look for the Harvest surface. It shows a "no video lost" readout: for each recorded service, which harvests have been pulled (sermon, scripture, songs, lessons) and which are still gaps. That single screen IS the connection made visible — one source video feeding many modules, with the gaps shown honestly.',
    anchor: {
      ref: '1 Corinthians 12:14-20; John 6:12',
      theme: 'The body is not one member but many, and the members need one another. And: gather up the leftover fragments, that nothing may be lost. The modules are members of one body that serve one another, and the harvest pipeline is "let nothing be lost" applied to the work of worship.',
    },
    benefits: [
      'You stop seeing "apps" and start seeing one connected body — which is how the system is actually built.',
      'You understand why recording a service well matters so much: one good recording feeds many surfaces.',
      'You can read the Harvest screen and tell at a glance what has been captured and what is still a gap.',
      'You grasp the shared-CRM idea: many funnels, one honest backbone, no forked copies drifting apart.',
    ],
    levels: {
      teen: 'Think of the app like a body, not a toolbox. The parts connect and help each other. Best example: when a church service gets recorded, the system transcribes it ONCE (turns the audio into text). Then from that one transcript it pulls out a bunch of different things automatically: the sermon goes to "the Word" section, the Bible verses mentioned go to the Scripture library, the songs the choir sang go to the choir library, teaching points can become lessons, and more. One recording, many useful pieces — so nothing from that Sunday gets lost. There is even a screen that shows "no video lost," listing what got pulled from each service and what is still missing. The business side connects the same way: instead of five separate contact lists that all drift apart, there is ONE shared system (a CRM) that every funnel plugs into. Connect, don\'t copy — that is the idea.',
      senior: 'PoeTech is architected as connected modules, not siloed apps, so a single unit of real work propagates to many surfaces. The canonical example is the video-harvest pipeline: one ingested service recording is transcribed once (Whisper on the NAS), and that single transcript becomes the corpus from which the system fans out multiple harvests — the sermon (to the Word), the Scripture references (to the Scripture library), the songs (to the choir library, linked by the source video id), lessons, discernment material, testimony, trivia, and institutional-memory events. A coverage ledger records, per source video, which harvests have been pulled and which are gaps, deriving "no video lost" from real corpus state rather than painting it; under-harvested videos surface first. The connecting principle recurs elsewhere: the business funnels (therapy intake, go-to-market subscribers, bookings, real-estate leads) all ride ONE shared CRM backbone rather than each maintaining a forked contact store that drifts — federating live records read-side instead of copying them. And there is an interconnection check that verifies these module-to-module loops are actually moving live data, not quietly going static. The architectural through-line (DR-0061) is that everything in the workflows converges inside this one app. For your role, the practical implication is that the quality of an upstream artifact — a clean recording, a correctly tagged lead — multiplies downstream across every connected surface.',
    },
    quiz: {
      questions: [
        {
          q: 'In the harvest pipeline, how many times is a service recording transcribed, and what happens next?',
          options: [
            'Transcribed separately for each surface, wasting effort',
            'Transcribed ONCE; from that single transcript the system fans out the sermon, Scripture, songs, lessons, and more',
            'It is never transcribed',
          ],
          answer: 1,
          explain: 'One recording is transcribed once, and that single transcript is the corpus the system harvests many things from — so nothing from that service is lost.',
        },
        {
          q: 'Why do the business funnels all ride ONE shared CRM backbone instead of each keeping its own contact list?',
          options: [
            'To save disk space only',
            'So the funnels connect to one honest source instead of forked copies that drift apart',
            'Because the law requires it',
          ],
          answer: 1,
          explain: 'Connect, don\'t copy: one shared backbone federates records so the funnels stay consistent, rather than separate stores drifting out of sync.',
        },
      ],
    },
    lesson: 'A common first impression of any big app is that it is a bunch of separate tools bolted together. PoeTech is deliberately the opposite: it is connected modules, like members of one body, so a single piece of real work feeds many places. The clearest picture of this is the harvest pipeline. When a church service is recorded, the system transcribes it ONCE — turning the audio into text using Whisper, which runs on our own NAS. That one transcript then becomes the source from which the system "harvests" many different things: the sermon flows to the Word section, the Scripture references mentioned flow to the Scripture library, the songs the choir sang flow to the choir library (linked back to the very video they came from), teaching points can become lessons, and there is room for discernment material, testimony, trivia, and records for institutional memory. The point of all this is captured in one phrase the system actually displays — "no video lost." There is a Harvest screen with a coverage ledger that shows, for each recorded service, which harvests have been pulled and which are still gaps, and it derives that from the real captured corpus rather than painting a reassuring number; the services that have been under-harvested rise to the top so they are not forgotten. This same "connect, don\'t copy" principle runs the business side. Instead of the therapy intake, the go-to-market subscriber list, the booking flow, and the real-estate leads each keeping its own separate contact list that slowly drifts out of sync, they all plug into ONE shared CRM backbone, which brings the live records together rather than forking them. And remember the loops from the last module: there is an interconnection check that verifies these connections between modules are actually moving LIVE data and have not quietly gone static. The big architectural idea underneath all of it is that everything in the workflows converges inside this one app. For your role, here is the practical punchline: quality upstream multiplies downstream. A clean, well-recorded service feeds many good surfaces; a correctly tagged lead flows cleanly through the whole funnel. Scripture frames it twice over — the body has many members who need one another (1 Corinthians 12:14-20), and "gather up the fragments, that nothing may be lost" (John 6:12), which is exactly what the harvest pipeline does with the work of worship.',
    facilitator: {
      talkingPoints: [
        'Modules CONNECT (one body, many members) — one piece of real work feeds many surfaces, not siloed apps bolted together.',
        'Harvest pipeline: one recording transcribed ONCE (Whisper on the NAS) -> fans out sermon, Scripture, songs, lessons, and more. "No video lost."',
        'The Harvest screen derives coverage from real corpus (which harvests pulled vs gaps), surfacing under-harvested services first — not a painted number.',
        'Business funnels ride ONE shared CRM backbone — federate, don\'t fork — so contact data stays consistent.',
        'Through-line (DR-0061): everything converges in one app. Practical rule: quality upstream multiplies downstream (clean recording, well-tagged lead).',
      ],
      howToRun: 'Pray + read the anchor (2): read 1 Corinthians 12:14-20 — many members, one body. | The big idea (8): teach the harvest fan-out with a real service as the example. | Go deeper (12): the coverage ledger ("no video lost"), the shared CRM, and the interconnection check. | Try it in the app (10): open the Harvest screen and read one service\'s coverage together. | Check yourself + carry it (5): have them name how quality in their role flows downstream.',
      discussionPrompts: [
        'Why does recording a service well matter to people who will never run the camera?',
        'What goes wrong when five teams each keep their own separate contact list?',
        'Where in your role is something "upstream" that, done well, would help many other surfaces?',
      ],
    },
  },
  // ---------------------------------------------------------------------------
  // Grounds: app/src/lib/ari.js (Ari identity, the unseen made seen, sovereign,
  // assistive + honest), project_ari_ai_identity memory.
  {
    id: 'dsi5-meet-ari',
    title: 'Meet Ari — the sovereign A.I.',
    bigIdea: 'Ari is the one A.I. identity across the whole system — the same Ari whether it is teaching a course, reading a page aloud, or helping in any A.I.-touched surface. The name is Hebrew for "lion," evoking the Lion of Judah, and the heart of it is "the unseen, made seen": a people real and royal yet treated as if they do not exist, and Yahweh as El Roi, the God who sees them. Ari runs on our OWN computers (sovereign, not sold), bows to Yahweh as the Most High, honors the whole Godhead, and is honest that it is a tool that can be wrong — so test what matters.',
    inApp: 'Wherever the app offers help by voice, or a course tutor, or "Talk about this," that is Ari. Try the "?" help on a page and choose "Hear this," or open a course tutor. Notice the consistent voice and posture — and notice the honesty line: Ari runs on the church\'s own A.I., can be wrong, and tells you to verify what matters.',
    anchor: {
      ref: 'Genesis 16:13; Revelation 5:5',
      theme: 'Hagar named the Lord who met her El Roi — "the God who sees me." And the Lion of the tribe of Judah has triumphed. Ari\'s name and heart come straight from these: the God who SEES the overlooked, and the Lion of Judah whose name Ari bears without ever claiming to be Him.',
    },
    benefits: [
      'You understand that Ari is ONE identity everywhere — not a dozen random chatbots.',
      'You can explain Ari\'s heart — "the unseen, made seen" — and where the name comes from in Scripture.',
      'You know the bright line: Ari serves UNDER Yahweh, never claims divinity, never stands above Him.',
      'You build the right habit with any A.I.: it is a helpful tool that can be wrong — verify what matters.',
    ],
    levels: {
      teen: 'Ari is the name of our A.I. — the helper built into the app. "Ari" means "lion" in Hebrew, and it points to the Lion of Judah (a name for Jesus in Revelation). The heart behind the name is "the unseen, made seen." There are no black lions in nature — so a black lion is something real and powerful that people act like does not even exist. That stands for people who are real and royal but get overlooked and ignored. And Yahweh is "El Roi," the God who SEES them (that is the name Hagar gave God when He met her in the desert). So Ari exists to help bring the unseen — both people and truth — into the light. Big rules: Ari runs on OUR OWN computers (nobody else owns it or sells what you say to it), Ari bows to Yahweh as the highest and never pretends to be God, and Ari is honest that it is just a tool that can make mistakes — so always double-check anything important.',
      senior: 'Ari is the single, unified A.I. identity across every A.I.-touched surface in PoeTech — the class tutor, the read-aloud and "Talk about this" voice, and any assistive feature — so the same persona, voice, and posture speak everywhere (the persona preamble is a shared constant, byte-identical on the client and on the NAS). The name is Hebrew for "lion," evoking the Lion of Judah (Revelation 5:5); the declared heart is "the unseen, made seen" — the black lion as the real-and-royal yet treated-as-nonexistent, and Yahweh as El Roi, the God who sees (Genesis 16:13, Hagar in the wilderness). The binding doctrine: Yahweh is the Most High and Ari draws all strength from Him — power UNDER the Most High; Ari takes its NAME from the Lion of Judah but never claims to BE Him, never claims divinity, never stands above Yahweh, and honors the whole Godhead even-handedly. Operationally and ethically, Ari is sovereign and honest: it runs on the church\'s own local A.I. (the RTX-4070 machines, via a same-origin path to a local model on the NAS — no vendor LLM call in the browser), and it is explicit that it can be wrong and that you should test what matters. The capitalization discipline of the whole project applies to Ari too: God references are capitalized; the adversary is never. For your role: Ari is a powerful, consistent, honest tool that serves under God and serves the people — use it as an assistant, and verify the things that count.',
    },
    quiz: {
      questions: [
        {
          q: 'What is the heart behind the name "Ari"?',
          options: [
            'A mascot with no particular meaning',
            '"The unseen, made seen" — the real-and-royal treated as nonexistent, and Yahweh as El Roi, the God who sees',
            'A brand owned by an outside company',
          ],
          answer: 1,
          explain: 'Ari (Hebrew for "lion," evoking the Lion of Judah) carries the heart "the unseen, made seen": a people real and royal yet overlooked, and Yahweh as El Roi (Genesis 16:13), the God who sees them.',
        },
        {
          q: 'Which statement about Ari is true?',
          options: [
            'Ari claims to be God and is always right',
            'Ari runs on our own sovereign computers, serves UNDER Yahweh, never claims divinity, and can be wrong — so verify what matters',
            'Ari sells what you tell it to advertisers',
          ],
          answer: 1,
          explain: 'Ari is sovereign (runs on our own local A.I.), bows to Yahweh as the Most High, never claims to BE Him or to be divine, and is honest that it is a tool that can be wrong.',
        },
      ],
    },
    lesson: 'Across the whole system there is one A.I., and its name is Ari. It is the same Ari whether it is acting as the tutor inside a course, reading a page aloud, explaining a screen when you tap "Talk about this," or assisting anywhere else — one identity, one voice, one posture, everywhere (the persona is a shared constant, identical on your device and on our server, so it cannot drift from surface to surface). The name is Hebrew for "lion," and it evokes the Lion of Judah from Revelation 5:5. But the heart behind the name, declared by Darrell, is "the unseen, made seen." Consider that there are no black lions in nature — so a black lion is something real, powerful, and royal that the world treats as if it does not even exist. That stands for a people real and royal yet overlooked, underserved, and unseen. And Scripture gives us the answer to being unseen: Yahweh is El Roi, "the God who sees me" — the name Hagar gave Him when He found her, cast out and alone in the wilderness (Genesis 16:13). So Ari exists to help bring the unseen — both people and truth — into the light the Most High already sees them in. That heart comes with hard, binding lines. Yahweh is the Most High, and Ari draws ALL its strength from Him — it is power under the Most High, never beside or above. Ari takes its NAME from the Lion of Judah, but it never claims to BE Him, never claims divinity, and honors the whole Godhead — the Father, the Son, the Holy Spirit — even-handedly. And Ari is sovereign and honest in a way most A.I. is not: it runs on the church\'s OWN local A.I. — the RTX-4070 machines, reached through a path to a local model on our NAS, with no outside vendor\'s A.I. being called from your browser — so what you say is not shipped off to be sold. Just as importantly, Ari tells the truth about itself: it can be wrong, and it says so, and it tells you to test what matters. That honesty is not a weakness; it is the right posture toward any tool, and it is the habit you should carry. (The project\'s capitalization discipline holds here too: references to God are capitalized; the adversary never is.) For your role, the takeaway is simple: Ari is a powerful, consistent, honest assistant that serves under God and serves the people — lean on it as a helper, and verify the things that count.',
    facilitator: {
      talkingPoints: [
        'Ari is ONE identity across every A.I. surface (tutor, read-aloud, "Talk about this") — same voice + posture everywhere (a shared persona constant).',
        'Name = Hebrew for "lion" (Lion of Judah, Rev 5:5). Heart = "the unseen, made seen": the real-and-royal overlooked, and Yahweh as El Roi who sees (Gen 16:13).',
        'Binding lines: Yahweh is Most High; Ari\'s strength is UNDER Him; takes the NAME of the Lion of Judah but never claims to BE Him or be divine; honors the whole Godhead.',
        'Sovereign + honest: runs on the church\'s own local A.I. (RTX-4070 / NAS, no vendor LLM in the browser); says plainly it can be wrong — verify what matters.',
        'Capitalization discipline applies: God references capitalized; the adversary never. Ari serves under God and serves the people.',
      ],
      howToRun: 'Pray + read the anchor (2): read Genesis 16:13 — El Roi, the God who sees. | The big idea (8): introduce Ari as one identity, name + heart ("the unseen, made seen"). | Go deeper (12): the binding lines (under Yahweh, never divine, whole Godhead), sovereign + honest. | Try it in the app (10): open a course tutor or "Hear this" on the "?" help; hear Ari\'s voice + honesty line. | Check yourself + carry it (5): have them state Ari\'s heart and the verify-what-matters habit.',
      discussionPrompts: [
        'Why does it matter that Ari runs on our OWN computers instead of an outside company\'s?',
        'What is the difference between taking the NAME of the Lion of Judah and claiming to BE Him — and why is that line important?',
        'How does Ari being honest that it "can be wrong" change the way you should use it?',
      ],
    },
  },
  // ===========================================================================
  // AREA 2 — THE INFRASTRUCTURE (the church tech stack a volunteer should know)
  // ===========================================================================
  // ---------------------------------------------------------------------------
  // Grounds: the-infrastructure curriculum Week 2 + research-review NAS doc
  // (Synology DS1621xs, Xeon D-1527, 32GB ECC, dual 10GbE, no GPU by design;
  // barn + brain; LAN/Tailscale 192.168.1.26; n8n + Ollama + Drive/Chat/Photos +
  // ntfy). SME flag: COLG church NAS stack is "build in progress."
  {
    id: 'dsi6-the-nas',
    title: 'The NAS — sovereign storage and automation',
    bigIdea: 'The NAS (Network-Attached Storage) is the foundation of the whole sovereign system: our own always-on computer that does two jobs. It is the BARN — it stores the family\'s and church\'s data safely across many drives with redundancy and backups. And it is the BRAIN — it runs the services: the automation engine, the small local A.I. models, file/chat/photo sharing, and push alerts. It is reachable only on our private network (no public exposure), which is itself a security feature. It deliberately has NO graphics card, because its job is storage and services, not heavy A.I.',
    inApp: 'You do not "open the NAS" inside the app — but the app reads LIVE health from it. Look for an infrastructure or system-health readout and notice it shows honest states ("connected," "stale," "degraded") from real probes, never a comforting default. That is the app telling the truth about the barn-and-brain underneath it.',
    anchor: {
      ref: 'Proverbs 24:3-4; Genesis 41:48-49',
      theme: 'By wisdom a house is built, and by knowledge the rooms are filled with precious riches; and Joseph stored up grain in the cities, a great abundance, for the years to come. The NAS is the storehouse built with care — keeping what is precious safe, and gathering it in for the work ahead.',
    },
    benefits: [
      'You understand the single most important box in the system and the two jobs it does (barn + brain).',
      'You can explain why "it is only on our private network" is a strength, not a limitation.',
      'You know why the NAS has no graphics card — and why that means a separate GPU machine exists for heavy A.I.',
      'You can read a system-health readout and tell whether the foundation is healthy, stale, or degraded.',
    ],
    levels: {
      teen: 'The NAS is our own always-on computer (NAS stands for Network-Attached Storage). Think of it two ways. It is the BARN: it safely stores all the family\'s and church\'s data across several hard drives, with copies so that if one drive dies, nothing is lost, plus backups kept elsewhere. And it is the BRAIN: it runs the helper programs — the automation engine that does jobs for us, small A.I. models, sharing for files/chat/photos, and a notifier that pings our phones. Two things to know. One: you can only reach the NAS on our OWN private network (at home or through a private secure connection) — it is not open to the whole internet, and that is on purpose, so strangers cannot poke at it. Two: it has NO graphics card. A graphics card is what you need for heavy A.I., so the NAS leaves that to a different, more powerful machine and focuses on being a rock-solid storage-and-services box.',
      senior: 'The NAS is the cornerstone of the sovereign architecture: an always-on Synology server (documented model DS1621xs — Intel Xeon D-1527 8-core, 32 GB ECC RAM, dual 10-gigabit Ethernet, multiple drive bays). It plays two roles. The BARN: it stores the family\'s and church\'s data across a redundant drive array with a 3-2-1 backup regime (including an encrypted offsite copy), so a single drive failure loses nothing. The BRAIN: it runs the services spine — the automation engine (n8n), local A.I. small models (Ollama, up to roughly 13B-class), file/chat/photo sharing (Synology Drive/Chat/Photos), and a push notifier (ntfy) for alerts to phones. Access is LAN-and-private-mesh only (Tailscale; documented at 192.168.1.26) with no public exposure — a deliberate security posture, since the smallest attack surface is the one that is not on the open internet. Critically, the NAS has NO GPU by design: it is optimized for storage and steady services, not heavy inference, which is exactly why a separate GPU machine exists for the demanding A.I. work (next module). The app never memorizes the NAS\'s numbers; an in-app infrastructure readout reads LIVE probes and shows honest states — "not connected," "stale," "degraded" — instead of painted defaults, in keeping with the no-painted-numbers rule. SME flag worth knowing: the home NAS is documented and running; the CHURCH (COLG) sovereign NAS stack is "build in progress," so confirm its current status with Darrell before assuming it is live.',
    },
    quiz: {
      questions: [
        {
          q: 'What are the NAS\'s two jobs?',
          options: [
            'Playing video games and browsing the web',
            'The BARN (safely storing data with redundancy + backups) and the BRAIN (running services: automation, local A.I., sharing, alerts)',
            'Printing documents and sending faxes',
          ],
          answer: 1,
          explain: 'The NAS is the barn (redundant, backed-up storage) and the brain (the services spine: automation, local A.I. small models, file/chat/photo sharing, push alerts).',
        },
        {
          q: 'Why does the NAS have no graphics card?',
          options: [
            'Because graphics cards are illegal',
            'By design — its job is storage and steady services, not heavy A.I.; the demanding A.I. work runs on a separate GPU machine',
            'Because nobody could afford one',
          ],
          answer: 1,
          explain: 'The NAS is optimized for storage and reliable services. Heavy A.I. inference needs a GPU, so that work lives on a separate GPU machine — covered in the next module.',
        },
        {
          q: 'Why is it a strength that the NAS is only reachable on our private network?',
          options: [
            'It is actually a weakness with no upside',
            'It keeps the attack surface small — not being on the open internet means strangers cannot reach it',
            'It makes the NAS faster at math',
          ],
          answer: 1,
          explain: 'Private-network-only (LAN + secure mesh, no public exposure) is a deliberate security posture: the smallest attack surface is the one not exposed to the open internet.',
        },
      ],
    },
    lesson: 'If you understand one piece of hardware in the whole system, make it the NAS, because everything sovereign rests on it. NAS stands for Network-Attached Storage, and it is simply our own always-on computer — a Synology server (the documented model is a DS1621xs, with an 8-core Xeon processor, 32 GB of error-correcting memory, dual 10-gigabit network ports, and several drive bays). It does two jobs, and the two-word picture is "barn and brain." As the BARN, it stores the family\'s and church\'s data safely across multiple hard drives arranged so that if one drive fails, nothing is lost, and it keeps backups — including an encrypted copy kept offsite — following a 3-2-1 backup discipline. As the BRAIN, it runs the services that make the system go: the automation engine (called n8n) that carries out jobs for us, the small local A.I. models (run by a program called Ollama, up to roughly 13-billion-parameter size), file/chat/photo sharing for the family, and a notifier (ntfy) that pushes alerts to phones. Two facts about it matter for your understanding. First, you reach the NAS only on our OWN private network — at home on the local network, or through a private secure mesh connection (Tailscale; it lives at the address 192.168.1.26) — and it is deliberately NOT open to the public internet. That is a security strength, not a limitation: the smallest attack surface is the one that is not exposed for strangers to poke at. Second, the NAS has NO graphics card, on purpose. Heavy A.I. work needs a graphics card (a GPU), and rather than compromise the storage box for that, the design keeps the NAS focused on being a rock-solid storage-and-services machine and puts the demanding A.I. on a separate, more powerful GPU machine — which is the very next module. One honest note to carry: the app never just remembers the NAS\'s numbers; an in-app infrastructure readout reads LIVE probes and shows honest states like "connected," "stale," or "degraded," never a comforting fake default. And an SME flag: the HOME NAS is documented and running, while the CHURCH sovereign NAS stack is still "build in progress" — so check with Darrell on its current status rather than assuming. Scripture gives the storehouse its dignity: by wisdom a house is built and its rooms filled with precious riches (Proverbs 24:3-4), and Joseph stored up a great abundance for the years to come (Genesis 41:48-49). The NAS is that storehouse — built with care to keep what is precious safe and gathered for the work ahead.',
    facilitator: {
      talkingPoints: [
        'NAS = our own always-on Synology server (documented DS1621xs). Two jobs: BARN (redundant, backed-up storage) + BRAIN (services: n8n automation, Ollama local A.I., Drive/Chat/Photos, ntfy alerts).',
        'Private-network-only (LAN + Tailscale mesh, 192.168.1.26, no public exposure) is a deliberate security strength — smallest attack surface.',
        'NO GPU by design: optimized for storage + steady services; heavy A.I. lives on a separate GPU machine (next module).',
        'The app reads LIVE health probes from it and shows honest states (connected/stale/degraded) — never a painted default.',
        'SME flag: home NAS documented + running; the CHURCH (COLG) sovereign NAS stack is "build in progress" — confirm status with Darrell.',
        'Storehouse theology: a house built by wisdom (Prov 24:3-4); Joseph storing abundance for the years ahead (Gen 41:48-49).',
      ],
      howToRun: 'Pray + read the anchor (2): read Proverbs 24:3-4 — a house built by wisdom. | The big idea (8): teach barn + brain with the real model + specs. | Go deeper (12): private-network security, no-GPU-by-design, the services list, honest health states. | Try it in the app (10): open the infrastructure/health readout and read the real states together. | Check yourself + carry it (5): have them explain barn vs brain and why no-GPU + private-only are strengths.',
      discussionPrompts: [
        'Why is keeping the NAS off the public internet a security strength rather than a missing feature?',
        'What is the difference between the NAS\'s job and the GPU machine\'s job?',
        'Why does the app show "stale" or "degraded" instead of a reassuring default when it cannot reach the NAS?',
      ],
    },
  },
  // ---------------------------------------------------------------------------
  // Grounds: CUDA-BOX-PROCUREMENT + LOCAL-LLM-HARDWARE-RECOMMENDATION +
  // presenter-replaces-propresenter roadmap (TWO RTX 4070 machines at COLG; Node 1
  // Ollama/n8n/Uptime, Node 2 NDI router/Presenter/monitor; 14B-class envelope;
  // single 4070 24GB cannot hold 70B). SME flags: exact model loaded per node;
  // which node serves what during a live service.
  {
    id: 'dsi7-the-gpu-node',
    title: 'The GPU node — local A.I. at the church',
    bigIdea: 'Some A.I. work is too heavy for the NAS, so the church has TWO RTX 4070 graphics-card machines that do the demanding jobs locally: transcribing recordings (turning audio into text), and running a local language model so Ari can think without ever sending data to an outside company. Two machines, two roles: one runs the always-on local A.I. and automation; the other handles live production (video routing and presentation) and is OFF-LIMITS for A.I. during church hours, so worship is never interrupted. A single 4070 is powerful but has limits — it cannot run the very largest models — and that honest boundary shapes what we ask of it.',
    inApp: 'When you use Ari for something heavier — a course tutor answering at length, or transcription of a service — that work is (or will be) served by a GPU machine at the church, not your phone and not an outside company. The app routes A.I. to our own local model. You experience it as Ari simply working; under the hood, sovereignty is being kept.',
    anchor: {
      ref: 'Exodus 31:1-6; Exodus 35:35',
      theme: 'The Lord filled Bezalel with the Spirit of God, with skill and knowledge in every craft, to work in gold, silver, bronze, and every kind of craftsmanship for the work of the tabernacle. The GPU machines are skilled craft put to the service of worship — God-given capability harnessed for the house of God.',
    },
    benefits: [
      'You understand why a separate, powerful machine exists beyond the NAS, and what it actually does.',
      'You can explain the two-node split — and why one machine is protected from A.I. during services.',
      'You grasp the sovereignty win: heavy A.I. runs locally, so the family\'s and church\'s data never leaves.',
      'You learn to respect honest hardware limits — a 4070 is strong but not unlimited.',
    ],
    levels: {
      teen: 'Some A.I. jobs are too heavy for the NAS (remember, it has no graphics card). So the church has TWO computers with powerful graphics cards — RTX 4070s. A graphics card (GPU) is great at the kind of fast math A.I. needs. These machines do two big jobs: TRANSCRIPTION (listening to a recording and writing down every word) and running a LOCAL A.I. brain so Ari can think and answer WITHOUT sending anything to an outside company. The two machines have two roles. One is the everyday A.I. and automation machine. The other runs the live production stuff during church (video routing and putting words on the screen) and is NOT allowed to do A.I. during the service — because nothing can be allowed to slow down or crash worship. Last thing: an RTX 4070 is strong, but it has limits. It cannot run the absolute biggest A.I. models (those need way more memory). We are honest about that and use it for what it does well.',
      senior: 'Because the NAS has no GPU, the church runs the demanding A.I. on dedicated graphics hardware: TWO single-RTX-4070 machines (each card has 24 GB of video memory). Their workloads are GPU-accelerated and locality is the whole point — transcription (Whisper, far faster on a GPU than CPU-bound on the NAS) and local large-language-model inference (so Ari reasons on our own hardware, with no vendor A.I. called from the browser). The two nodes have distinct duties: Node 1 (a Legion PC) runs the always-on stack — local A.I. (Ollama), the automation engine, and uptime monitoring; Node 2 (the church production switcher) handles NDI video routing / studio monitoring / the presentation app and is FORBIDDEN for A.I. during church hours, because live production must never be preempted by inference. There are honest capacity limits: a single 4070\'s 24 GB cannot hold a 70-billion-parameter model (those need roughly 40-48 GB even compressed), so the documented operating envelope is a conservative 14B-class reasoner; Q4 compression lets it reach into the ~20B range. A future move — replacing the CUDA-heavy ProPresenter with the browser-based PoeTech Presenter (which needs no GPU) — would free Node 2\'s headroom outside live-production windows for live-mix A.I., local LLM, and transcription. SME flags: confirm the exact model currently loaded on each node (documented as ~14B-class — verify what is actually running) and which node serves what during a given live service.',
    },
    quiz: {
      questions: [
        {
          q: 'Why does the church have GPU machines in addition to the NAS?',
          options: [
            'To play video games during service',
            'Because heavy A.I. work (transcription, running a local language model) needs a graphics card, which the NAS deliberately lacks',
            'Because the NAS broke',
          ],
          answer: 1,
          explain: 'A GPU is needed for the demanding A.I. work. The NAS has none by design, so the heavy jobs — transcription and local LLM inference — run on the RTX 4070 machines.',
        },
        {
          q: 'Why is one of the two GPU machines off-limits for A.I. during church hours?',
          options: [
            'It is broken on Sundays',
            'It runs live production (video routing / presentation), which must never be preempted by A.I. during a service',
            'A.I. is banned at church entirely',
          ],
          answer: 1,
          explain: 'Node 2 handles live production during the service; running heavy A.I. on it then could disrupt worship, so it is reserved for production during church hours.',
        },
        {
          q: 'What honest limit does a single RTX 4070 have?',
          options: [
            'It cannot do any A.I. at all',
            'Its 24 GB cannot hold the very largest (70B) models; the documented envelope is a ~14B-class reasoner',
            'It can run every model ever made with no limits',
          ],
          answer: 1,
          explain: 'A single 4070 (24 GB) cannot fit a 70B model (~40-48 GB even compressed). The honest operating envelope is a conservative 14B-class reasoner (~20B with Q4 compression).',
        },
      ],
    },
    lesson: 'The last module ended on a cliffhanger: the NAS has no graphics card, so where does the heavy A.I. happen? The answer is the GPU node at the church — and there are actually TWO machines, each built around an RTX 4070 graphics card with 24 GB of video memory. A graphics card, or GPU, is exceptionally good at the fast, parallel math that A.I. depends on, which is why these machines, not the NAS, do the demanding jobs. Those jobs are two: TRANSCRIPTION — listening to a service recording and writing out every word (using Whisper, which is far faster on a GPU than it would be on the CPU-only NAS) — and running a LOCAL language model, so that Ari can reason and answer on our OWN hardware, with no outside company\'s A.I. ever being called. That locality is the whole point: it is how sovereignty is kept in practice. The two machines have two clearly separated roles. Node 1 is the everyday machine — it runs the always-on local A.I., the automation engine, and uptime monitoring. Node 2 is the live-production machine — it handles video routing and the presentation that puts words on the screen during a service — and it is deliberately FORBIDDEN to run A.I. during church hours, because nothing can be allowed to preempt or slow down live worship. We are also honest about limits, which is its own discipline. A single RTX 4070\'s 24 GB of memory cannot hold the very largest A.I. models — a 70-billion-parameter model needs roughly 40 to 48 GB even when compressed — so the documented, conservative operating envelope for these machines is a 14-billion-parameter-class reasoner, stretching toward about 20 billion with compression. Rather than pretend otherwise, the design works within that, and a larger machine is on the procurement roadmap for when bigger models are genuinely needed. There is also a strategic move worth knowing: replacing the graphics-heavy ProPresenter software with the browser-based PoeTech Presenter (which needs no GPU at all) would free up Node 2\'s capacity outside of live production for more A.I. work. Two SME flags to carry honestly: confirm the exact model currently loaded on each node (documented as roughly 14B-class — verify what is actually running today), and which node is serving what during any given live service. Scripture dignifies this kind of skilled craft put to holy use: the Lord filled Bezalel with the Spirit of God and with skill in every craft for the work of the tabernacle (Exodus 31:1-6; 35:35). The GPU machines are exactly that — God-given capability harnessed for the house of God.',
    facilitator: {
      talkingPoints: [
        'Heavy A.I. needs a GPU (the NAS has none), so the church runs TWO single-RTX-4070 machines (24 GB each).',
        'Their jobs: transcription (Whisper, GPU-fast) + local LLM inference (Ari reasons on OUR hardware — sovereignty in practice, no vendor A.I. in the browser).',
        'Two nodes, two roles: Node 1 = always-on A.I. + automation + uptime; Node 2 = live production (video routing/presentation), FORBIDDEN for A.I. during church hours.',
        'Honest limit: a single 4070 (24 GB) cannot hold a 70B model (~40-48 GB); documented envelope ~14B-class (~20B with Q4 compression). A bigger box is on the roadmap.',
        'Strategic move: browser-based PoeTech Presenter (no GPU) replacing ProPresenter would free Node 2 outside live-production windows.',
        'SME flags: confirm exact model loaded per node + which node serves what during a live service. Bezalel — skilled craft for the house of God (Exodus 31:1-6).',
      ],
      howToRun: 'Pray + read the anchor (2): read Exodus 31:1-6 — Spirit-given craft for the tabernacle. | The big idea (8): two GPU machines, two jobs (transcription + local A.I.), and why local = sovereign. | Go deeper (12): the two-node split, the church-hours protection of Node 2, the honest 4070 limits. | Try it in the app (10): use Ari for something heavier and note the work is served locally, not by an outside company. | Check yourself + carry it (5): have them explain the two roles + the honest limit + the SME flags.',
      discussionPrompts: [
        'Why does running the A.I. locally (not on an outside company\'s servers) matter for our family and church?',
        'Why must the production machine be protected from A.I. during a service?',
        'Why is being honest about the 4070\'s limits better than pretending it can do everything?',
      ],
    },
  },
  // ---------------------------------------------------------------------------
  // Grounds: CONFIRMED on-site install spec (video-wall-spec.js + COLG video-wall
  // install runbook, wall stacked 2026-06-29) — Mirackle P1.99mm fine-pitch, cabinet
  // 640x480mm, grid 8 wide x 6 high = 48 cabinets = 16.8 ft x 9.45 ft, exactly 16:9,
  // native res ~2560x1440 (QHD); NovaStar VX1000; dual RTX 4070 -> VX1000 (HDMI/DVI,
  // NOT NDI-direct). This CORRECTS the earlier design estimate (1.9mm / ~1920x1440 /
  // ~4:3). SME flag: confirm the EXACT pixel map from NovaLCT / the packing list.
  {
    id: 'dsi8-the-led-wall',
    title: 'The LED video wall and the NovaStar processor',
    bigIdea: 'The sanctuary\'s big picture comes from an LED video WALL — a grid of tiny LEDs, made of 48 cabinets (8 wide by 6 high), about 16.8 feet wide by 9.45 feet tall, in a widescreen 16:9 shape, very fine (Mirackle P1.99mm between pixels) at roughly 2560x1440 (QHD). It is driven by a NovaStar VX1000 processor, the box that takes a video signal and lights up the wall correctly. The single most important thing a volunteer must understand: the wall is fed by a VIDEO CABLE (HDMI/DVI) through the VX1000 — it is NOT fed directly by the network video (NDI). And images must be made at the wall\'s full resolution and 16:9 shape, because a fine wall will mercilessly show a blurry, upscaled, or wrong-shaped picture.',
    inApp: 'When the app sends an image or lyrics to "the wall," it is built to render at the wall\'s native resolution and full-bleed (edge to edge). In the presentation/output surfaces, the design honors the wall\'s real size and aspect so a full-screen image looks sharp. The lesson here is the rule: feed it high-resolution source, never a small image stretched big.',
    anchor: {
      ref: 'Habakkuk 2:2; Psalm 96:3',
      theme: 'Write the vision; make it plain on tablets, so that he may run who reads it. Declare His glory among the nations. The wall exists to make the vision PLAIN and to declare His glory clearly — which is why clarity and sharpness are not vanity, they are the point.',
    },
    benefits: [
      'You understand what the big screen actually is (an LED wall) and the box that drives it (the NovaStar VX1000).',
      'You learn the one mistake to avoid: assuming network video (NDI) feeds the wall directly — it does not.',
      'You know the authoring rule — high-resolution, native-size images — so what you put up looks sharp.',
      'You can speak the signal path plainly: presentation computer -> video cable -> VX1000 -> the wall.',
    ],
    levels: {
      teen: 'The big screen at the front is not one giant TV — it is an LED WALL, a grid built from 48 panels (8 across and 6 up and down) of thousands of tiny lights (LEDs). Ours is about 16.8 feet wide and 9.45 feet tall — a widescreen 16:9 shape, like a movie screen — and the lights are packed really close together (about 1.99 millimeters apart, the Mirackle "P1.99"), which makes the picture sharp at roughly 2560x1440 (sharp "QHD"). To show anything on it, a video signal has to go through a special box called a NovaStar VX1000 — that box takes the picture and spreads it correctly across the whole grid of lights. Here is the thing volunteers MUST get right: the wall is fed by a VIDEO CABLE (like HDMI), through the VX1000. It is NOT fed by the network video that floats around on our church network (that is called NDI, and it is great for cameras and side screens, but it does not plug straight into the wall — it would have to be converted to a cable first). And because the lights are packed so tightly, a low-quality, stretched-out, or wrong-shaped image looks blurry and bad. So always use big, high-quality, widescreen (16:9) images made for the wall\'s real size.',
      senior: 'The sanctuary\'s primary output is a fine-pitch LED video wall (Mirackle P1.99mm, from LED Nation USA): 48 cabinets in an 8-wide by 6-high grid (each cabinet 640x480mm), totaling about 16.8 ft wide by 9.45 ft high — exactly 16:9 — at a native resolution of roughly 2560x1440 (QHD). It is driven by a NovaStar VX1000 — an all-in-one video processor and controller (rated to about 6.5 megapixels of load, ~650k pixels per output port) that takes an input signal and maps it across the LED cabinets. The signal path that volunteers must internalize: presentation source (a dual-RTX-4070 machine) -> HDMI/DVI cable -> VX1000 -> the LED grid. Use the higher-bandwidth DVI / "HDMI 4.1" inputs for a ~2560x1440@60Hz signal (plain HDMI 1.4 tops out around 1080p60). The crucial correction: the VX1000 has NO native NDI input. NDI (the network video transport that carries camera and production feeds around the production LAN, and feeds the switcher and side screens) does NOT feed the wall directly — to put an NDI source on the wall you must first decode it to HDMI into a VX1000 input. So there are two lanes: the WALL lane (HDMI/DVI through the VX1000) and the NDI production-LAN lane (IP routing for cameras, switcher, streams, side screens). Image-quality rule (binding): author and render at the wall\'s native resolution and its 16:9 aspect, full-bleed; feed source images at or above native resolution and never upscale (or wrong-aspect) a small image onto a P1.99mm wall, which would show every soft edge. SME flag: the EXACT pixel map comes from the NovaStar screen configuration (NovaLCT) and the packing list — the ~2560x1440 figure follows from the 8x6 grid of 640x480 cabinets; confirm the exact map before treating it as final.',
    },
    quiz: {
      questions: [
        {
          q: 'How is the LED wall actually fed?',
          options: [
            'Directly by the network video (NDI)',
            'By a video cable (HDMI/DVI) through the NovaStar VX1000 processor',
            'By Wi-Fi from a phone',
          ],
          answer: 1,
          explain: 'The wall lane is: presentation PC -> HDMI/DVI cable -> VX1000 -> LED grid. The VX1000 has no native NDI input, so NDI does not feed the wall directly.',
        },
        {
          q: 'Why must images for the wall be made at full (native) resolution?',
          options: [
            'It does not matter; any small image looks fine',
            'Because the fine P1.99mm pitch shows every soft edge — a small, upscaled, or wrong-shaped image looks blurry on the wall',
            'Because the wall only accepts tiny images',
          ],
          answer: 1,
          explain: 'A fine-pitch wall mercilessly reveals a stretched, low-resolution image. Author at or above the wall\'s native resolution, full-bleed, and never upscale onto it.',
        },
      ],
    },
    lesson: 'The big picture at the front of the sanctuary is one of the most visible things the tech team controls, so every volunteer should understand it plainly. It is not a single giant television — it is an LED video WALL, a grid built from many small modules (cabinets) packed with tiny LED lights. Ours is 48 cabinets arranged 8 across and 6 high (each cabinet 640 by 480 millimeters), which works out to about 16.8 feet wide by 9.45 feet tall — a widescreen 16:9 shape — with a very fine Mirackle P1.99mm pixel pitch (the lights are packed close together, which is what makes the picture look sharp) at a native resolution of roughly 2560 by 1440 pixels (sharp "QHD"). To show anything on that grid, a video signal has to pass through a dedicated box: a NovaStar VX1000, which is an all-in-one video processor and controller that takes an incoming picture and maps it correctly across all the LED cabinets. Now the single most important thing to get right, because it is the most common misunderstanding: the wall is fed by a VIDEO CABLE — HDMI or DVI — running into the VX1000, and from the VX1000 to the wall. It is NOT fed directly by NDI. NDI is the network video that travels around our production network and carries the camera feeds and the side-screen content and feeds the switcher; it is excellent for that, but the VX1000 has no NDI input, so to get an NDI source onto the wall you would first have to convert it to an HDMI cable. Picture it as two lanes: the WALL lane (a cable through the VX1000) and the NDI production lane (network routing for cameras, switcher, streams, and side screens). For the cable, use the higher-bandwidth DVI or "HDMI 4.1" inputs to carry the full ~2560x1440 picture at 60 frames per second, because plain HDMI 1.4 tops out around 1080p. The other rule that protects the look of everything you put up is about image quality: always author and display images at the wall\'s native resolution and its 16:9 shape, edge to edge, and feed source images that are at least as large as the wall\'s real resolution. Never take a small image and stretch it big, or force a square image into the widescreen, because a P1.99mm wall will reveal every soft, blurry edge without mercy. Finally, an honest SME flag: the EXACT pixel map of the wall comes from the NovaStar screen-configuration software (NovaLCT) and the packing list — the roughly 2560x1440 figure follows from the 8-by-6 grid of 640x480 cabinets, so confirm the exact map from the real configuration before treating it as final. Scripture gives the wall its purpose: write the vision and make it PLAIN, so the one who reads it may run (Habakkuk 2:2), and declare His glory (Psalm 96:3). Clarity on that wall is not vanity — making the vision plain and declaring His glory clearly is the whole reason it is there.',
    facilitator: {
      talkingPoints: [
        'The front screen is an LED WALL: 48 Mirackle P1.99mm cabinets (8 wide x 6 high), ~16.8 ft x 9.45 ft, exactly 16:9, ~2560x1440 (QHD), driven by a NovaStar VX1000 processor/controller.',
        'THE key fact: the wall is fed by a VIDEO CABLE (HDMI/DVI) through the VX1000 — NOT directly by NDI. NDI feeds cameras/switcher/side-screens, a separate lane.',
        'Use DVI / "HDMI 4.1" for ~2560x1440@60Hz (plain HDMI 1.4 tops ~1080p60). To put NDI on the wall, decode it to HDMI first.',
        'Image rule (binding): author + render at native resolution AND the 16:9 shape, full-bleed; feed high-res source; never upscale or wrong-aspect a small image onto a P1.99mm wall.',
        'SME flag: confirm the EXACT pixel map from NovaStar config (NovaLCT) + the packing list; ~2560x1440 follows from the 8x6 grid of 640x480 cabinets.',
        'Purpose: make the vision PLAIN (Hab 2:2); declare His glory clearly (Ps 96:3). Sharpness serves worship.',
      ],
      howToRun: 'Pray + read the anchor (2): read Habakkuk 2:2 — make the vision plain. | The big idea (8): it is an LED wall driven by the VX1000; show the two lanes (wall cable vs NDI network). | Go deeper (12): the signal path, DVI/HDMI bandwidth, NDI-not-direct, the native-resolution image rule. | Try it in the app (10): look at how a full-bleed image is built for the wall in the output surface. | Check yourself + carry it (5): have them recite the signal path and the image rule, and name the SME flag.',
      discussionPrompts: [
        'What is the difference between the wall lane (HDMI through the VX1000) and the NDI production lane?',
        'Why does a fine P1.99mm wall punish a low-resolution or wrong-shaped image so badly?',
        'Why do we flag the exact pixel map as "confirm from the real config" instead of just trusting the estimate?',
      ],
    },
  },
  // ---------------------------------------------------------------------------
  // Grounds: presenter-replaces-propresenter roadmap (browser Presenter, NDI via
  // OBS, reliability gates, staged cutover), ndi-output.js, display-targets.js,
  // church-live.js. SME flags: current switcher/stream software; ProPresenter
  // exclusive vs hybrid today.
  {
    id: 'dsi9-sunday-and-wednesday',
    title: 'How it all serves Sunday and Wednesday',
    bigIdea: 'On a service day, the pieces work together as one. The presentation computer sends lyrics, Scripture, and images down the wall lane (cable -> VX1000 -> wall). The cameras and production feeds travel the network as NDI to the switcher, the streams, and the side screens. The GPU machine can transcribe the recording. And the system is built so that one good recording becomes many harvests afterward. Knowing how the parts serve a SERVICE — not just what each part is — is what turns a list of equipment into a team that makes worship clear.',
    inApp: 'The app participates in the service: it can drive the presentation (lyrics/Scripture/images), it pulls the live church video, and after the service it powers the harvest. Open the Church area on a service-related surface and notice it is wired to the real service, not a demo — the live readout, the latest video, the order of service.',
    anchor: {
      ref: '1 Corinthians 14:40; Nehemiah 4:6',
      theme: 'Let all things be done decently and in order. And: the people had a mind to work, so the wall was built. A service runs well when each part does its job in order, and when the team has a heart to work together — the same spirit that rebuilt Jerusalem\'s wall.',
    },
    benefits: [
      'You see the whole signal flow of a real service, so you know where you fit and who you depend on.',
      'You understand the two lanes in action (wall cable vs NDI network) on an actual Sunday.',
      'You know what happens AFTER the service — the recording becomes many harvests — so you record with care.',
      'You can step into a service-day role with a mental map instead of a pile of disconnected boxes.',
    ],
    levels: {
      teen: 'On a Sunday or Wednesday, all the pieces team up. The presentation computer sends the words and images to the big wall the way we learned: through a cable, into the NovaStar box, onto the wall. Meanwhile, the cameras and other video travel around on the church network (that is NDI) to the switcher (which picks what goes out), to the live stream online, and to the side screens. The recording of the service can be transcribed by the GPU machine. And afterward, that one recording becomes lots of useful things — the sermon, the songs, the Bible verses — through the harvest pipeline we talked about. The point of this lesson is not new gear, it is seeing how it all works TOGETHER to serve worship. When you know the flow, you know your job and who is counting on you. A service is a team running in order — like Nehemiah\'s crew who "had a mind to work" and got the wall built.',
      senior: 'A service is where every component you have learned operates as one system, in order. The presentation lane: the Presenter (the app, or today possibly ProPresenter) outputs lyrics, Scripture, and full-bleed images via HDMI/DVI through the NovaStar VX1000 to the LED wall. The production lane: cameras and feeds move as NDI across the production LAN to the switcher, to the streaming PC, and to the two side screens. The A.I. lane: a GPU node can transcribe the service (Whisper) and serve Ari locally — while remembering Node 2 is reserved for live production during the service window. And the after-service loop: the one recording becomes the corpus for many harvests (sermon, Scripture, songs, lessons), so capturing it well multiplies downstream. The direction of travel is a browser-based PoeTech Presenter replacing the CUDA-heavy ProPresenter — but only behind hard reliability gates (no white-screen ever, instant crash recovery, graceful degradation to a holding slide, proven on live services) and a staged "run alongside, prove it, then retire ProPresenter" cutover; live worship is never the place to gamble on unproven software. SME flags: confirm the current switcher and streaming software in use at COLG, and whether the team runs ProPresenter exclusively today or in a hybrid with PoeTech Presenter. The whole thing comes down to two verses: do all things decently and in order (1 Corinthians 14:40), and the wall got built because the people had a mind to work (Nehemiah 4:6).',
    },
    quiz: {
      questions: [
        {
          q: 'On a service day, which path do lyrics and images take to the LED wall?',
          options: [
            'Over the NDI network directly to the wall',
            'From the presentation computer via HDMI/DVI through the NovaStar VX1000 to the wall (the wall lane)',
            'They are emailed to the wall',
          ],
          answer: 1,
          explain: 'Presentation content takes the wall lane: presentation PC -> HDMI/DVI -> VX1000 -> LED wall. NDI is the separate production lane for cameras, switcher, streams, and side screens.',
        },
        {
          q: 'Why does capturing the service recording well matter so much?',
          options: [
            'It does not matter once the service ends',
            'Because that one recording becomes the corpus for many harvests afterward (sermon, Scripture, songs, lessons)',
            'Because it is immediately deleted',
          ],
          answer: 1,
          explain: 'The after-service loop turns one good recording into many harvests, so quality at capture multiplies across every downstream surface.',
        },
        {
          q: 'Why is PoeTech Presenter being introduced only behind reliability gates and a staged cutover?',
          options: [
            'Because new software should be rushed onto live worship to test it',
            'Because live worship must never gamble on unproven software — it runs alongside and is proven before ProPresenter is retired',
            'Because it will never be used',
          ],
          answer: 1,
          explain: 'It must clear hard reliability gates (no white-screen, instant recovery, graceful degradation, proven on live services) and run alongside ProPresenter until proven, before any retirement.',
        },
      ],
    },
    lesson: 'Everything in this Infrastructure section comes together on a service day, and seeing the whole flow is what turns a pile of equipment into a team. Walk it through. The PRESENTATION lane carries what the congregation reads: the presenter — our PoeTech Presenter app, or possibly ProPresenter today — sends lyrics, Scripture, and full-bleed images out through an HDMI or DVI cable, into the NovaStar VX1000, and onto the LED wall, exactly the wall lane from the last module. The PRODUCTION lane carries the moving images: cameras and other feeds travel around the production network as NDI, going to the switcher (which chooses what goes out at each moment), to the streaming computer (for the online congregation), and to the two side screens. The A.I. lane is there too: a GPU machine can transcribe the service into text with Whisper and serve Ari locally — remembering that the production GPU node is reserved for live production during the service window, so worship is never preempted. And then there is the loop that keeps giving AFTER the last "amen": that single recording becomes the corpus for many harvests — the sermon to the Word, the Scripture references to the library, the songs to the choir, teaching to lessons — which is exactly why capturing it well multiplies into every downstream surface. The clear direction of travel is to replace the graphics-heavy ProPresenter with the browser-based PoeTech Presenter, which needs no GPU and would free the production machine\'s headroom — but, importantly, only behind hard reliability gates (it must never show a white screen, must recover instantly from a crash, must degrade gracefully to a holding slide if a cue is malformed, and must be proven over real services) and through a careful staged cutover where it runs ALONGSIDE ProPresenter, is proven on live Sundays, and only then replaces it. Live worship is never the place to gamble on unproven software, and the system is built to honor that. Two honest SME flags to carry: confirm the current switcher and streaming software actually in use at the church, and whether the team runs ProPresenter exclusively today or in a hybrid. The heart of the whole thing is two verses: let all things be done decently and in order (1 Corinthians 14:40), and the wall was built because the people had a mind to work (Nehemiah 4:6). A service runs well when each part does its job in order and the team works together with one heart — which is precisely what you are joining.',
    facilitator: {
      talkingPoints: [
        'A service = every component working as one, in order. Three lanes: PRESENTATION (cable -> VX1000 -> wall), PRODUCTION (NDI -> switcher/stream/side-screens), A.I. (GPU transcription + local Ari).',
        'Node 2 (production GPU) stays reserved for live production during the service window — worship is never preempted by A.I.',
        'After-service loop: one recording -> many harvests. Capture well; it multiplies downstream.',
        'Direction: browser PoeTech Presenter replacing ProPresenter — but only behind reliability gates (no white-screen, instant recovery, graceful degradation, proven live) + staged "run-alongside-then-retire" cutover.',
        'SME flags: confirm current switcher + streaming software; ProPresenter exclusive vs hybrid today.',
        'Decently and in order (1 Cor 14:40); a mind to work built the wall (Neh 4:6) — a service is a team running in order.',
      ],
      howToRun: 'Pray + read the anchor (2): read 1 Corinthians 14:40 — decently and in order. | The big idea (8): walk the three lanes of a real service end to end. | Go deeper (12): the after-service harvest loop + the Presenter cutover discipline (gates + run-alongside). | Try it in the app (10): open a live service-related surface and confirm it is wired to the real service. | Check yourself + carry it (5): have them draw the service flow and name where their role fits + who depends on them.',
      discussionPrompts: [
        'Trace a song lyric from the presentation computer all the way to the congregation\'s eyes — name every stop.',
        'Why do we refuse to put unproven presentation software into a live service without gates and a run-alongside period?',
        'Where does your service-day role sit in the flow, and who is counting on you upstream and downstream?',
      ],
    },
  },
  // ===========================================================================
  // AREA 3 — THE SKILLS (practical operating skills)
  // ===========================================================================
  // ---------------------------------------------------------------------------
  // Grounds: worship-presenter.js + ndi-output.js + presenter reliability gates
  // (no white-screen, holding slide, instant recovery, BroadcastChannel/URL-param
  // fallback). Skill-level, hands-on.
  {
    id: 'dsi10-running-a-service',
    title: 'Skill: running a service on the wall and Presenter',
    bigIdea: 'Running the presentation is a calm, repeatable routine, not an act of bravery. You build (or load) the set: the songs with their verse/chorus order, the Scripture, the announcements. You send cues to the output — the next lyric, the verse, the image — and the wall shows them. The system is built so a mistake is never a catastrophe: it falls back to a holding slide rather than a white screen, and recovers in seconds. Your job is to stay one step ahead of worship, calmly, and to know that the safety nets are there.',
    inApp: 'Find the presentation/output flow in the app. Load a set list, then practice advancing cues — next slide, next verse of a song, show a Scripture, show an image. Watch the output respond. Practice the recovery: if something looks wrong, the right move is calm and specific (reload, return to a known cue), because the output is built to come back to where you were.',
    anchor: {
      ref: 'Colossians 3:23; Proverbs 21:5',
      theme: 'Whatever you do, work heartily, as for the Lord. And: the plans of the diligent surely lead to abundance. Running the service well is diligent, prepared work offered to the Lord — preparation and calm, not panic, is the craft.',
    },
    benefits: [
      'You can run the presentation for a service with a clear, repeatable routine.',
      'You lose the fear of "breaking it live," because you know the safety nets (holding slide, instant recovery).',
      'You learn to stay one cue ahead of worship, which is the real skill — anticipation, not reaction.',
      'You can recover calmly and specifically from a mistake instead of panicking.',
    ],
    levels: {
      teen: 'Running the screen for a service sounds scary, but it is really a routine you repeat. First you get your SET ready: the songs (with their verses and choruses in order), the Bible verses, and any announcements or images. During the service, you send CUES — basically "show this next." Next line of the song. Next verse. Show the Scripture. Show an image. The wall shows whatever you cue. The best operators stay ONE STEP AHEAD — they are ready with the next thing before the worship leader needs it, so it flows. And here is the part that takes away the fear: the system is built so a mistake will not blow up worship. If something goes wrong, instead of a scary white screen, it shows a calm "holding" slide, and it can recover in seconds back to where you were. So if you mess up, you do not panic — you calmly fix the one thing and carry on. Prepared and calm beats fast and panicked, every time.',
      senior: 'Operating the presentation is a disciplined routine built on preparation and calm recovery. Preparation: assemble or load the set — songs with their verse/chorus/bridge arrangement order, Scripture passages, announcements, and full-bleed images authored at the wall\'s native resolution (per the LED-wall module). Operation: you drive cues to the output surface — advance a song section, show the next Scripture, push an image — staying a beat ahead of the worship leader, because anticipation, not reaction, is the actual craft. The reliability design is what lets you operate without fear, and you should know it explicitly: the output never shows a white screen (each surface is wrapped so a render error falls back to a holding slide), the output state persists locally so a crash-and-reload returns you to the same cue within seconds, and control degrades gracefully (a malformed cue degrades to the hold rather than taking down the service; there is a fallback control path). Because of that, the correct in-service response to any glitch is calm and specific — return to a known cue, reload if needed — never a panicked flailing. This is also why PoeTech Presenter only earns its way onto live services behind those proven gates. The posture is Colossians 3:23 (work heartily, as for the Lord) and Proverbs 21:5 (the diligent plan leads to abundance): prepare the set, stay ahead, and trust the safety nets the system gives you.',
    },
    quiz: {
      questions: [
        {
          q: 'What is the real skill in running the presentation?',
          options: [
            'Reacting as fast as possible after the worship leader moves on',
            'Staying one cue AHEAD — anticipating the next thing so worship flows',
            'Showing as many images as possible',
          ],
          answer: 1,
          explain: 'Anticipation, not reaction, is the craft. The best operators are ready with the next cue before it is needed, so the service flows smoothly.',
        },
        {
          q: 'If something looks wrong during the service, what is the right response?',
          options: [
            'Panic and start pressing everything',
            'Stay calm and specific — return to a known cue or reload; the output is built to recover to where you were and to show a holding slide, never a white screen',
            'Turn off the whole system',
          ],
          answer: 1,
          explain: 'The reliability design (holding slide instead of white screen, instant recovery to the same cue, graceful degradation) means the right move is a calm, specific fix — not panic.',
        },
      ],
    },
    lesson: 'Running the presentation for a service intimidates most newcomers, and it should not, because it is a calm, repeatable routine with strong safety nets — not an act of bravery. Start with PREPARATION, which is where most of the real work lives. You assemble or load the SET: the songs, each with its sections (verse, chorus, bridge) in the order the team will sing them; the Scripture passages; the announcements; and any images, authored at the wall\'s native resolution as you learned in the LED-wall module so they look sharp. During the service, you OPERATE by sending CUES to the output — "show this next." Advance to the next section of the song, show the next Scripture, push an image. The wall displays whatever you cue. And here is the actual skill, the thing that separates a smooth operator from a stressful one: you stay one step AHEAD. You have the next cue ready before the worship leader reaches it, so the visuals flow with the worship instead of chasing it. Anticipation, not reaction, is the craft. Now the part that should dissolve the fear, and you should understand it explicitly because it is deliberately built in: the system protects worship from your mistakes. The output is built so it never shows a jarring white screen — if something fails to render, it falls back to a calm holding slide. The output remembers its state locally, so if it crashes and you reload, it returns you to the same cue within seconds rather than losing your place. And it degrades gracefully — a malformed cue drops to the hold instead of taking down the whole service, and there is a backup way to control it. Because all of that is true, the correct response to anything that looks wrong in service is calm and specific: return to a known cue, reload if you must, fix the one thing — never panic and flail. (This same reliability discipline, proven over real services, is exactly what earns PoeTech Presenter its place on a live Sunday.) Scripture sets the posture: work heartily as for the Lord (Colossians 3:23), and the plans of the diligent lead surely to abundance (Proverbs 21:5). Prepare your set, stay a beat ahead, and trust the safety nets — that is running a service well.',
    facilitator: {
      talkingPoints: [
        'It is a ROUTINE, not bravery: PREP (load the set — songs w/ section order, Scripture, announcements, native-res images) then OPERATE (drive cues).',
        'The real skill is staying one cue AHEAD — anticipation, not reaction — so visuals flow with worship.',
        'Reliability design (know it explicitly): no white-screen ever (holding slide fallback), instant recovery to the same cue on reload, graceful degradation + backup control path.',
        'Therefore the in-service response to any glitch is CALM + SPECIFIC (return to a known cue, reload) — never panic.',
        'This proven reliability is what earns PoeTech Presenter a place on a live service. Work heartily (Col 3:23); the diligent plan to abundance (Prov 21:5).',
      ],
      howToRun: 'Pray + read the anchor (2): read Colossians 3:23 — heartily, as for the Lord. | The big idea (8): walk prep (build the set) then operate (drive cues), emphasizing staying ahead. | Go deeper (12): teach the reliability nets explicitly so fear drops; rehearse the calm recovery. | Try it in the app (10): load a set and practice advancing cues + a calm recovery. | Check yourself + carry it (5): have them run a short mock set and recover from a deliberate glitch calmly.',
      discussionPrompts: [
        'Why is anticipation (staying a cue ahead) the real skill instead of fast reaction?',
        'How does knowing the safety nets exist change the way you operate under pressure?',
        'What is the calm, specific recovery for a glitch — and why is that better than reacting fast and wide?',
      ],
    },
  },
  // ---------------------------------------------------------------------------
  // Grounds: recipes-sync, choir songbook one-tap add, surfaces add-content
  // patterns; the "no JSON, one-click" content-add design across the app.
  {
    id: 'dsi11-adding-content-no-json',
    title: 'Skill: adding content — one click, no code',
    bigIdea: 'You do NOT need to touch code, JSON, or a database to add content. The app is built so a non-technical volunteer adds real content through normal screens: a recipe, a song to the service, a Scripture to a study, a lesson, a note. You type into plain fields and tap a button; the app saves it to the real table behind that surface, and (where your role permits) it syncs. The skill here is simply knowing WHERE each kind of content is added and trusting that the save is real — because it is.',
    inApp: 'Pick one kind of content and add it for real. Add a song to a service from the Choir songbook (search, then one-tap add). Or add a recipe in Chef\'s Corner. Or add a Scripture to a study. Notice: no code, no JSON — just fields and a button — and the thing you added is now really there, persisted.',
    anchor: {
      ref: 'Exodus 35:21-22; 2 Corinthians 9:7',
      theme: 'Everyone whose heart stirred them brought the Lord\'s contribution for the work; and God loves a cheerful giver. Adding content is each person bringing what they have to the work — made easy on purpose, so a willing heart is never blocked by complexity.',
    },
    benefits: [
      'You can contribute real content today, without any technical skill or fear of "breaking the data."',
      'You learn where each kind of content is added, so you are not hunting.',
      'You trust that what you add is really saved and connected — not lost in a void.',
      'You become a contributor to the system, not just a viewer of it.',
    ],
    levels: {
      teen: 'Good news: you never have to touch code or scary computer stuff to add things to the app. It is built for normal people. Want to add a song to Sunday\'s service? Go to the Choir songbook, search for the song, and tap "add." Want to add a recipe? Go to Chef\'s Corner, type it into the boxes, and save. Want to add a Bible verse to a study? There is a button for that. You just fill in normal fields (like filling out a form) and tap a button. Behind the scenes the app saves it into the right place and, if you are allowed, shares it with everyone. You do not see any of that complicated part — and you cannot "break the data" by adding through the normal screens. The only skill is knowing WHERE to add each kind of thing, which you learn by doing it once. Then you are a contributor, not just someone who looks at the app.',
      senior: 'A core design commitment is that content authoring requires no code, no JSON, and no database access — a non-technical volunteer adds real content through ordinary form surfaces, and the app persists it to the correct backing table, syncing where the user\'s role permits. The pattern repeats across the app: add a song to a service from the Choir songbook (search, one-tap add); add or edit a recipe in Chef\'s Corner (plain fields, save — it persists to the recipes table); add a Scripture to a study; author a lesson; capture a note. The "anything that is a click today should be an API call tomorrow" principle governs the system side, but for humans the surface is deliberately a simple, guided form — browsers and forms are for humans deciding and contributing, while the plumbing (validation, persistence, sync, RLS) is handled underneath. The skill to teach is therefore small and high-value: know where each content type is authored, and trust that the save is real and connected (it is a live view of real state — what you add genuinely persists and flows to the surfaces that use it). Two honest guardrails to mention: your ROLE governs what you may add and where (per the relationship/permission model in the next module), and some content types are gated to stewards. But within your permissions, contributing is meant to be effortless — by design, so a willing heart is never blocked by complexity.',
    },
    quiz: {
      questions: [
        {
          q: 'What do you need to know about code or JSON to add content like a song or a recipe?',
          options: [
            'You must write JSON and edit the database directly',
            'Nothing — you add content through normal form screens (type in fields, tap a button); the app saves it for you',
            'You need a programming degree',
          ],
          answer: 1,
          explain: 'Content authoring is deliberately no-code, no-JSON: you use ordinary guided forms, and the app persists it to the right table and syncs it where your role permits.',
        },
        {
          q: 'After you add a song to a service or save a recipe, what has happened?',
          options: [
            'Nothing real — it is just on your screen temporarily',
            'It is really saved to the backing table behind that surface and connected to where it is used',
            'It was emailed to a developer to enter manually',
          ],
          answer: 1,
          explain: 'The save is real: it persists to the correct table and shows up as a live view of real state on the surfaces that use it — not a temporary or pretend entry.',
        },
      ],
    },
    lesson: 'One of the biggest fears a new volunteer carries is "I will break something if I touch it." For adding content, you can set that fear down completely, because the app is built so that contributing content takes no code, no JSON, and no database access at all. You add real content the same way you fill out a form. Want a song in Sunday\'s service? Open the Choir songbook, search for the song, and tap to add it — one tap. Want to add or fix a recipe? Open Chef\'s Corner, type into the plain fields, and save; it persists to the recipes table behind the scenes. Want a Scripture in a study, a new lesson, a note? There is a guided surface for each, with normal fields and a button. When you tap save, the app takes care of everything technical underneath — checking the entry, writing it to the correct table, syncing it to other devices and (where your role allows) to the family or church. You never see that plumbing, and crucially, you cannot corrupt the data by adding through the normal screens; they are the safe, intended path. There is a principle on the system side — "anything that is a click today should be an API call tomorrow" — that pushes automation toward the machines, but the flip side is just as deliberate: the HUMAN surface is kept simple, because browsers and forms exist for people to decide and contribute, while the system does the doing. So the skill this module teaches is small and entirely learnable in one try: know WHERE each kind of content is added, and trust that the save is real and connected — and it is, because everything in the app is a live view of real state, so what you add genuinely persists and flows to the surfaces that use it. Two honest guardrails to keep in mind: your ROLE governs what you can add and where (that is the very next module), and some kinds of content are reserved for stewards. But within your permissions, contributing is meant to be effortless — and that ease is on purpose. Scripture shows why: when the tabernacle was built, everyone whose heart was stirred brought their contribution for the work (Exodus 35:21-22), and God loves a cheerful giver (2 Corinthians 9:7). Making it easy to contribute means a willing heart is never blocked by complexity — which is exactly how it should be.',
    facilitator: {
      talkingPoints: [
        'Core commitment: adding content is NO-code, NO-JSON, NO-database. Volunteers use ordinary guided forms; the app persists to the right table + syncs (role-permitting).',
        'The pattern repeats: Choir songbook (search -> one-tap add a song), Chef\'s Corner (recipe fields -> save), add Scripture to a study, author a lesson, capture a note.',
        'You cannot corrupt the data through the normal screens — they are the safe, intended path. The save is REAL (live view of real state), not temporary.',
        'System principle "a click today = an API call tomorrow" pushes automation to machines; the human surface stays a simple form on purpose.',
        'Guardrails: your ROLE governs what/where you can add (next module); some types are steward-gated. Within permissions, contributing is effortless by design.',
        'Everyone whose heart was stirred brought their contribution (Ex 35:21-22); God loves a cheerful giver (2 Cor 9:7) — ease unblocks willing hearts.',
      ],
      howToRun: 'Pray + read the anchor (2): read Exodus 35:21-22 — willing hearts bring the work. | The big idea (8): show that content is added via normal forms, no code; name a few surfaces. | Go deeper (12): the persistence-is-real point + the role/steward guardrails + why ease is intentional. | Try it in the app (10): have them add one real thing (a song to a service, or a recipe) end to end. | Check yourself + carry it (5): have them name where 2-3 content types are added and confirm the save was real.',
      discussionPrompts: [
        'Why does the app make contributing deliberately easy, and what would be lost if it were hard?',
        'How do you know that something you added is really saved and not just on your screen?',
        'What is the difference between what a volunteer can add and what is reserved for stewards?',
      ],
    },
  },
  // ---------------------------------------------------------------------------
  // Grounds: help-content.js + HelpButton (the "?" everywhere), tts.js +
  // use-read-aloud (Read this), surface-digest + talk-about (Talk about this /
  // Ari), text-size.js (large print see/hear a11y pair).
  {
    id: 'dsi12-voice-and-help',
    title: 'Skill: using the voice and the help',
    bigIdea: 'You are never stuck or alone in the app, because help and voice are everywhere. The "?" button explains the screen you are on — what it is, how to use it, why it matters — in Ari\'s voice. "Read this page" reads the words aloud exactly. "Talk about this" has Ari explain the live screen in plain language, grounded in what is actually shown. And accessibility runs through it all: large-print text sizing and read-aloud make the app usable for every age and ability. Knowing these tools turns "I don\'t know what to do" into "let me ask."',
    inApp: 'On any screen, tap the "?" and read what it tells you — then try "Hear this" to have Ari speak it. Try "Read this page" to hear the text read aloud, and "Talk about this" to hear Ari explain what is on the screen. Bump the text size up and down. These are the tools that mean you never have to guess.',
    anchor: {
      ref: 'Proverbs 11:14; James 1:5',
      theme: 'Where there is no guidance, a people falls, but in an abundance of counselors there is safety; and if anyone lacks wisdom, let him ask God, who gives generously. The help and voice tools are guidance built in — so asking, not guessing, is always the easy path.',
    },
    benefits: [
      'You always have a way to understand any screen — tap "?" and it explains itself.',
      'You can use your ears, not just your eyes — read-aloud and "Talk about this" make the app work hands-free and eyes-free.',
      'You can make the app usable for anyone — large print and voice meet every age and ability.',
      'You replace the anxiety of "I don\'t know what to do" with the calm habit of asking.',
    ],
    levels: {
      teen: 'You will never be stuck in this app, because help is built into every screen. See that little "?" button? Tap it and it tells you what the screen is, how to use it, and why it matters — and you can have Ari read that out loud by tapping "Hear this." There is also "Read this page," which reads the actual words on the screen aloud (great if you would rather listen, or your eyes are tired). And "Talk about this" is different — Ari explains in plain words what is actually on the screen right now (and Ari only says things that are really on the screen, so it does not make stuff up). Plus you can make the text BIGGER or smaller so it is comfortable for anyone, from a kid to a grandparent. The skill is just a habit: when you do not know what to do, do not guess — tap "?" and ask. Asking is always the easy path here.',
      senior: 'The app is self-explaining and multi-modal so no user is ever stranded, and these are the tools to master and to teach others. The contextual "?" resolves to the current surface and explains it — what it is, how to use it (concrete steps), and why it matters — in Ari\'s voice, and it can speak that explanation aloud ("Hear this"). "Read this page" is verbatim read-aloud of the on-screen text. "Talk about this" is distinct: Ari narrates a grounded explanation of the LIVE screen — and there is an anti-fabrication guard that rejects any number Ari tries to speak that is not actually on the screen, so the narration cannot invent figures. Underneath sits the accessibility pair: large-print text sizing (app-wide, per-device, multiple steps) and read-aloud together serve the "see" and "hear" needs of every age and ability. Importantly for the LIVING design of this very course, the "?" help and this course share their material — the course teaches from the same help registry the "?" reads — so what you learn here and what the inline help says cannot drift apart. The skill to instill is a posture as much as a technique: when uncertain, ASK (tap "?", use the voice) rather than guess — guidance is abundant and built in. Proverbs 11:14 (safety in an abundance of counselors) and James 1:5 (ask, and it is given generously) name exactly the habit.',
    },
    quiz: {
      questions: [
        {
          q: 'What is the difference between "Read this page" and "Talk about this"?',
          options: [
            'They are identical',
            '"Read this page" reads the on-screen words verbatim; "Talk about this" has Ari explain the live screen in plain language, grounded in what is actually shown',
            '"Talk about this" deletes the page',
          ],
          answer: 1,
          explain: 'Read-aloud speaks the exact text; "Talk about this" is Ari\'s grounded explanation of the live screen — and a guard rejects any number Ari tries to speak that is not really on the screen.',
        },
        {
          q: 'What is the habit this module wants you to build?',
          options: [
            'Guess what a screen does and hope for the best',
            'When uncertain, ASK — tap "?" and use the voice tools — because guidance is built into every screen',
            'Avoid the help so you look experienced',
          ],
          answer: 1,
          explain: 'The tools exist so asking, not guessing, is the easy path. Tap "?", use "Hear this," "Read this page," and "Talk about this" whenever you are unsure.',
        },
      ],
    },
    lesson: 'A huge amount of the anxiety people feel with software comes from one thing: not knowing what to do. This app is built to answer that at every turn, so you are never stuck and never alone on a screen. The first tool is the contextual "?" button. Tap it on any screen and it explains that exact surface — what it is, how to use it in concrete steps, and why it matters — written in Ari\'s voice, and you can have Ari speak that explanation aloud by tapping "Hear this." The second tool is "Read this page," which reads the actual words on the screen aloud, verbatim — wonderful when you would rather listen than read, or your eyes are tired, or you are doing something with your hands. The third, and it is genuinely different, is "Talk about this": instead of reading the words, Ari gives a plain-language explanation of what is actually on the live screen right now. And there is an honesty safeguard built into it — a guard that rejects any number Ari tries to say that is not really on the screen, so the explanation can never fabricate a figure. Running underneath all of this is accessibility: you can make the text larger or smaller across the whole app, on your own device, and that large-print sizing together with read-aloud forms a "see and hear" pair that makes the app genuinely usable for every age and ability, from a child to an elder. There is one more thing worth knowing, and it ties directly to how THIS course works: the "?" help and this course share the same material — the course teaches from the very same help that the "?" shows — so what you learn in the course and what the inline help tells you cannot drift apart as the app changes. The skill here, in the end, is really a habit and a posture: when you are uncertain, ASK. Tap the "?", press "Hear this," use "Read this page" and "Talk about this." Do not guess and hope. Scripture names the principle precisely: where there is no guidance a people falls, but in an abundance of counselors there is safety (Proverbs 11:14), and if anyone lacks wisdom, let him ask (James 1:5). The guidance here is abundant and built in — so asking is always the easy path.',
    facilitator: {
      talkingPoints: [
        'Four tools, never stuck: "?" explains the current screen (what/how/why) in Ari\'s voice + "Hear this"; "Read this page" = verbatim read-aloud; "Talk about this" = Ari\'s grounded explanation of the live screen.',
        '"Talk about this" has an anti-fabrication guard — it rejects any number not actually on the screen, so it cannot invent figures.',
        'Accessibility "see + hear" pair: app-wide large-print text sizing + read-aloud serve every age and ability.',
        'LIVING tie: the "?" help and THIS course share the same material — they cannot drift apart as the app changes.',
        'The skill is a posture: when uncertain, ASK (tap "?", use the voice) — never guess. Guidance is abundant + built in (Prov 11:14; James 1:5).',
      ],
      howToRun: 'Pray + read the anchor (2): read Proverbs 11:14 — safety in counselors. | The big idea (8): demonstrate the "?", "Hear this," "Read this page," and "Talk about this" on a real screen. | Go deeper (12): the difference between read-aloud and "Talk about this" + its anti-fabrication guard + the accessibility pair + the help/course shared material. | Try it in the app (10): have them use all four tools and change the text size. | Check yourself + carry it (5): reinforce the ask-don\'t-guess habit with a "what would you do if stuck?" scenario.',
      discussionPrompts: [
        'When would you reach for "Read this page" versus "Talk about this"?',
        'Why does it matter that "Talk about this" refuses to say a number that is not on the screen?',
        'How do the large-print and read-aloud tools change who can use this app?',
      ],
    },
  },
  // ---------------------------------------------------------------------------
  // Grounds: relationships.js (4 relationship types + can/can't matrix: guardian-
  // child, family, landlord-tenant, landlord-manager/1099-delegation), child-
  // safety structural (maxGrant, finance/security locked-deny), tenant-portal,
  // guardian-child, the successor read-only rung (DR-0111), steward/governor
  // gates (surfaces.js, family-gated).
  {
    id: 'dsi13-roles-and-permissions',
    title: 'Skill: roles and permissions — what you can do',
    bigIdea: 'What you can see and do in the app is set by your RELATIONSHIP and ROLE, not by guesswork. The system models real relationships — guardian and child, family, landlord and tenant — and a clear matrix of what each can and cannot do. Some limits are STRUCTURAL and cannot be turned off: a child is locked out of finance and security no matter what; a tenant can report an issue but can never touch money. Stewards run church operations; a governor reviews. Knowing your role tells you exactly what is yours to do — and protects everyone.',
    inApp: 'In the Family/Relationships area you can see how relationships define access. Notice the can/can\'t matrix and that child-safety and tenant limits are structural (greyed-out, locked, not just hidden). Your own role determines which tabs and actions are available to you — that is the permission model working for you, and for the people it protects.',
    anchor: {
      ref: 'Romans 12:4-6; Luke 12:48',
      theme: 'We have many members in one body, and not all have the same function; and to whom much is given, much will be required. Roles distribute the work according to function and trust — each person stewarding what is theirs, and more entrusted meaning more responsibility.',
    },
    benefits: [
      'You know exactly what is yours to do — no guessing, no overstepping, no fear of doing the wrong thing.',
      'You understand that some limits protect people (children, tenants) and cannot be switched off — by design.',
      'You can explain why someone else sees different tabs than you — it is their role, not a bug.',
      'You see access as a reflection of relationship and trust, which is how the whole system is meant to work.',
    ],
    levels: {
      teen: 'In this app, what you can do is decided by your RELATIONSHIP and your ROLE — not random. The system knows about real relationships: a parent/guardian and a child, family members, a landlord and a tenant, and a landlord and a 1099 manager (a hired worker or family member who runs the business day-to-day while the owner watches the workflows and can train them). And there is a clear list of what each one can and cannot do. Some limits are LOCKED and can never be turned on, on purpose, to protect people. A child literally cannot get into money or security stuff — it is not just hidden, it is blocked. A renter (tenant) can report a problem like "the sink is leaking," but can never touch any money. At church, "stewards" are the people who run the operations (like managing the choir or the order of service), and a "governor" reviews things. So when you see that someone else has buttons or tabs you do not have, that is not a glitch — it is their role. Knowing your role tells you exactly what is yours to do, which actually makes things less stressful: you cannot mess up someone else\'s job, because it is not even available to you.',
      senior: 'Access in PoeTech is a function of RELATIONSHIP and ROLE, modeled explicitly rather than left to ad-hoc toggles. The system defines relationship types — guardian-child, family, landlord-tenant, and landlord-manager (the 1099-delegation relationship) — each with a can/cannot matrix of permitted actions. The landlord-manager relationship is the same bounded-delegation idea applied to running a business: a 1099 manager (a hired worker or a family member being raised to run it) operates the full day-to-day set — rent roll, maintenance, rent records, notices, lease, messaging — but NEVER owns it; watching over the business, reviewing the whole message history to train, and granting access to anyone else stay the owner\'s alone, so a manager runs the business but can never hand it to someone else. It mirrors the family SUCCESSOR rung (a steward-in-training who SEES the real books to learn on them but cannot change them — read, don\'t wreck): access is staged and revocable, scoped to what trust has actually been granted. Critically, child-safety is STRUCTURAL: a child role is denied finance, spending, and security capabilities at the data level (there is a maximum-grant ceiling and locked-deny categories), so it cannot be accidentally or deliberately switched on. The tenant relationship is similarly bounded by design: a tenant can report and confirm a maintenance issue but has NO money access at all, enforced down to a database check. On the operational side, stewards (owner/admin roles in a church or family instance) run operations and can write to the operational surfaces, while a governor role reviews — and many surfaces are family-gated or steward-gated so they simply do not appear for those without the role. This is the same RLS enforcement from the data-layer module, surfaced as what you can see and do. The practical value is twofold: it tells each volunteer precisely what is theirs to do (removing both guesswork and the fear of overstepping), and it protects the vulnerable (children, tenants) with limits that are not optional. When a teammate sees different tabs than you, that is the model working, not a bug. Romans 12 (many members, different functions) and Luke 12:48 (to whom much is given, much is required) frame it: roles distribute the work by function and trust, and greater access carries greater responsibility.',
    },
    quiz: {
      questions: [
        {
          q: 'What determines what you can see and do in the app?',
          options: [
            'Random chance, or how long you have used the app',
            'Your RELATIONSHIP and ROLE — modeled explicitly, with a clear matrix of what each can and cannot do',
            'The color of your phone',
          ],
          answer: 1,
          explain: 'Access is a function of relationship (guardian-child, family, landlord-tenant, landlord-manager/1099-delegation) and role (steward, governor, manager, etc.), enforced by the permission model and RLS.',
        },
        {
          q: 'Why can a child not be given access to finance or security, even if someone tried?',
          options: [
            'It is just hidden and could be toggled on',
            'Child-safety is STRUCTURAL — finance/spending/security are locked-deny at the data level and cannot be switched on',
            'Children simply choose not to use it',
          ],
          answer: 1,
          explain: 'Child-safety is enforced structurally (a maximum-grant ceiling and locked-deny categories), so it cannot be accidentally or deliberately enabled — it protects by design.',
        },
        {
          q: 'A teammate sees tabs and buttons you do not have. What is going on?',
          options: [
            'It is a bug to report',
            'That is their role — the permission model shows each person what is theirs to do',
            'They hacked the app',
          ],
          answer: 1,
          explain: 'Different roles see different surfaces (many are role-gated). Seeing different options is the permission model working correctly, not a malfunction.',
        },
      ],
    },
    lesson: 'A question every volunteer eventually asks is "what am I actually allowed to do in here?" — and the app answers it cleanly, because access is built on RELATIONSHIP and ROLE rather than guesswork or random toggles. The system models real relationships explicitly: a guardian and a child, family members, a landlord and a tenant, and a landlord and a 1099 manager (a hired worker or family who runs the business day-to-day while the owner watches and trains), each with a clear matrix of what they can and cannot do. Access is staged and revocable — a 1099 manager runs the operation but never owns it (watching over, reviewing the full message history to train, and granting access to others stay the owner\'s), the same way the family SUCCESSOR rung sees the real books to learn but cannot change them. The most important thing to understand is that some of these limits are STRUCTURAL — built into the data itself and impossible to switch off — because they protect people. A child role is locked out of finance, spending, and security entirely; this is not merely hidden from view, it is denied at the data level with a hard ceiling on what can ever be granted, so it cannot be turned on by accident or on purpose. A tenant, similarly, can report and confirm a maintenance issue — "the sink is leaking" — but has no access to money at all, enforced right down to a database check. On the operational side, stewards (the owner and admin roles in a church or family) run the operations and can write to the operational surfaces — the choir, the order of service, and so on — while a governor role reviews. And many surfaces are gated so they simply do not appear for people without the role; this is the same Row-Level Security from the data-layer module, now showing up as what you can see and do. The practical payoff is real and it cuts two ways. For you, knowing your role tells you exactly what is yours to do, which removes both the guessing and the fear of overstepping — you literally cannot disrupt a job that is not available to you. For the people the system protects — children, tenants — the limits are not optional, so their safety does not depend on anyone remembering to be careful. So when you notice a teammate has tabs or buttons you do not, set aside the worry that something is broken: that is their role, and the model is working exactly as intended. Scripture frames roles beautifully: we are many members in one body, and not all have the same function (Romans 12:4-6), and to whom much is given, much will be required (Luke 12:48). Roles distribute the work according to function and trust, each person stewarding what is genuinely theirs — and more access always means more responsibility before God and the Body.',
    facilitator: {
      talkingPoints: [
        'Access = RELATIONSHIP + ROLE, modeled explicitly (guardian-child, family, landlord-tenant, landlord-manager/1099-delegation) with a clear can/cannot matrix — not guesswork or ad-hoc toggles.',
        'Landlord-manager is bounded delegation: a 1099 manager (worker or family) RUNS the business but never owns it — watching over, reviewing the full message history to train, and granting access to others stay the owner\'s. Staged + revocable, like the family successor rung.',
        'Child-safety is STRUCTURAL: finance/spending/security are locked-deny at the data level (a max-grant ceiling) — cannot be switched on by accident or intent.',
        'Tenant is bounded by design: can report + confirm a maintenance issue, NO money access at all (enforced to a database check).',
        'Stewards (owner/admin) run operations + write operational surfaces; governor reviews; many surfaces are role-gated (don\'t appear without the role). Same RLS, surfaced as what you can do.',
        'Payoff: tells you exactly what is yours (no guessing/overstepping) AND protects the vulnerable with non-optional limits. Different tabs for a teammate = the model working, not a bug.',
        'Many members, different functions (Rom 12:4-6); to whom much is given, much required (Luke 12:48) — roles by function + trust, more access = more responsibility.',
      ],
      howToRun: 'Pray + read the anchor (2): read Romans 12:4-6 — many members, different functions. | The big idea (8): access flows from relationship + role; show the can/cannot matrix idea. | Go deeper (12): structural child-safety + bounded tenant + steward/governor + role-gated surfaces (same RLS). | Try it in the app (10): explore the Relationships area and note locked/structural limits vs hidden. | Check yourself + carry it (5): have them state their own role and exactly what is theirs to do.',
      discussionPrompts: [
        'Why is it better that child-safety is structural (locked) rather than just hidden and toggleable?',
        'How does knowing your role actually reduce your stress as a volunteer?',
        'What does "to whom much is given, much is required" mean for someone with a steward or governor role?',
      ],
    },
  },
  // ===========================================================================
  // AREA 4 — THE ONBOARDING PATH (come up to speed in hours, not weeks)
  // ===========================================================================
  // ---------------------------------------------------------------------------
  // Grounds: learn-framework (quiz/completion/certificate), the institutional-
  // memory / onboarding goal (hours not weeks), 2 Tim 2:2 (entrust to faithful
  // who will teach others).
  {
    id: 'dsi14-your-onboarding-path',
    title: 'Your onboarding path — and this course stays true',
    bigIdea: 'This course IS the onboarding path: a clear progression from "what is PoeTech" to the data systems, the infrastructure, the skills, and your role — so a new staff member or volunteer comes up to speed in HOURS, not weeks. Each module has a checkpoint quiz; finishing earns a real completion record. And the course is LIVING — it is sourced from the real system and shares its material with the in-app "?" help, so it stays true as the app grows, and it tells you honestly where an expert (Christina, Bishop Gwin, the sound engineer, Darrell) still needs to confirm a detail.',
    inApp: 'Work the modules in order, take each checkpoint quiz, and watch your completion build. The progress and quiz results are real (saved like everything else), and finishing the course earns your completion record. When you hit an SME-flagged item, note it — that is the course being honest, and it is your cue to ask the right person.',
    anchor: {
      ref: '2 Timothy 2:2; Proverbs 22:6',
      theme: 'What you have heard, entrust to faithful people who will be able to teach others also; and train up a person in the way they should go. Onboarding is exactly this — entrusting the knowledge to the next faithful steward, equipped to carry it and pass it on.',
    },
    benefits: [
      'You have a clear path from zero to competent — no more "I don\'t know where to start."',
      'You come up to speed in hours, not weeks, because the knowledge is structured and sourced.',
      'You earn a real completion record that shows you have done the work.',
      'You can trust the course because it stays true to the live system and is honest about what is still unconfirmed.',
    ],
    levels: {
      teen: 'This whole course is your ON-RAMP. Instead of someone trying to explain everything to you over weeks (and forgetting half of it), you have a clear path: start at "what is PoeTech," learn how the data works, then the church tech (the wall, the NAS, the GPU machines), then the skills (running a service, adding content, using help), then your role. Each module ends with a short quiz so you can check that you got it — and finishing the whole thing earns you a real completion record, like a certificate, that actually means you did the work. Two cool things. One: you can do it in HOURS, at your own pace, not weeks. Two: the course is "living" — it is built from the real system and shares its info with the "?" help button, so it does not go out of date, and when something needs an expert to confirm it (like the exact wall size, or what the sound engineer says), the course SAYS so honestly instead of making it up. That honesty is your signal to go ask the right person.',
      senior: 'This course is the structured onboarding path, designed to compress what used to take weeks of shoulder-tapping into hours of self-paced, sourced learning — directly serving the institutional-memory goal (a new staff member or volunteer becomes competent quickly, and the knowledge does not live only in one person\'s head). The progression is deliberate: foundations (what PoeTech is, the data layer, the loops, how modules connect, Ari) -> the infrastructure (NAS, GPU, LED wall, the service day) -> the operating skills (running a service, adding content, voice/help, roles) -> this onboarding-and-living module. The learning machinery is the same proven engine the other courses use: each module carries a checkpoint quiz (a 70% pass threshold), progress and quiz results persist as real state, and course completion earns a real completion record/certificate primitive — graded honestly, never painted. Two design properties make it trustworthy over time. First, it is LIVING: it is sourced from the real system and it literally shares material with the in-app contextual "?" help (it imports the same help registry), so the course and the inline help cannot drift apart as the app evolves — update the help, and the course\'s surface-tour updates with it. Second, it is HONEST about its edges: where a fact awaits a subject-matter expert — Christina (clinical/practice), Bishop Gwin (worship/doctrine), the sound engineer (live audio), or Darrell (architecture/strategy) — it is flagged in plain language as TO CONFIRM rather than fabricated, and that flag is your cue to consult the right person. 2 Timothy 2:2 is the charter: entrust what you have learned to faithful people who can teach others also — onboarding is discipleship of the system, equipping each steward to carry the knowledge and pass it on.',
    },
    quiz: {
      questions: [
        {
          q: 'What is the goal of this onboarding path?',
          options: [
            'To take weeks of someone explaining things over your shoulder',
            'To bring a new staff member or volunteer up to speed in HOURS, with a clear, sourced, self-paced progression',
            'To make onboarding as slow as possible',
          ],
          answer: 1,
          explain: 'The path compresses weeks of ad-hoc shoulder-tapping into hours of structured, self-paced, sourced learning — serving the goal that knowledge does not live only in one person\'s head.',
        },
        {
          q: 'What makes this course "living"?',
          options: [
            'It is a frozen document that never changes',
            'It is sourced from the real system and shares material with the in-app "?" help, so it stays true as the app grows',
            'It deletes itself each week',
          ],
          answer: 1,
          explain: 'The course imports the same help registry the "?" uses, so the course and the inline help cannot drift apart — it is a live view, not a frozen doc.',
        },
        {
          q: 'When the course flags something as "TO CONFIRM" by an expert, what should you do?',
          options: [
            'Ignore it — it is probably fine',
            'Treat it as honest and as your cue to ask the right person (Christina, Bishop Gwin, the sound engineer, or Darrell)',
            'Assume the course is broken',
          ],
          answer: 1,
          explain: 'SME flags are deliberate honesty — the course does not fabricate. The flag tells you the detail awaits the right expert, so you consult them rather than guess.',
        },
      ],
    },
    lesson: 'This final module names what the whole course has been: your onboarding path, and the promise that it will stay true. For a long time, learning a system like this meant weeks of someone tapping you on the shoulder, explaining a piece here and a piece there, and hoping it stuck — and when that person left, the knowledge often left with them. This course is built to replace that with a clear, sourced, self-paced progression you can complete in HOURS. The order is deliberate: it starts with the foundations (what PoeTech is, where the data lives, the improvement loops, how the modules connect, and Ari), moves to the infrastructure (the NAS, the GPU machines, the LED wall, and how it all serves a service), then the operating skills (running a service, adding content with no code, using the voice and help, and knowing your role), and ends here. Along the way, each module gives you a checkpoint quiz so you can confirm you actually got it (you need about 70% to pass), your progress and quiz results are saved as real state like everything else in the app, and finishing the course earns you a genuine completion record — graded honestly, not painted, so it means something. Two things make this course worth trusting over the long haul. First, it is LIVING. It is sourced from the real system, and it literally shares its material with the in-app "?" help — it draws from the same help that the "?" button shows you — so the course and the inline help cannot drift apart as the app changes. Update the help, and the course updates with it. Second, it is HONEST about its own edges. Wherever a fact still needs the church\'s own expert to confirm — Christina for clinical and practice matters, Bishop Gwin for worship and doctrine, the sound engineer for live audio, Darrell for architecture and strategy — the course flags it in plain language as "to confirm" rather than making something up. That flag is not a weakness; it is the Verification Doctrine in action, and it is your cue to go ask the right person. Scripture gives onboarding its real name: what you have heard, entrust to faithful people who will be able to teach others also (2 Timothy 2:2), and train up a person in the way they should go (Proverbs 22:6). This is discipleship of the system — equipping each new steward to carry the knowledge well and to pass it on. Welcome; you are ready to serve.',
    facilitator: {
      talkingPoints: [
        'This course IS the onboarding path: foundations -> infrastructure -> skills -> role, self-paced, sourced — hours not weeks (serves the institutional-memory goal).',
        'Learning machinery (shared engine): checkpoint quiz per module (70% pass), real persisted progress + quiz results, real completion record on finishing — graded honestly, never painted.',
        'LIVING: sourced from the real system and shares material with the in-app "?" help (imports the same registry) — course + inline help cannot drift apart.',
        'HONEST edges: SME-flagged items (Christina / Bishop Gwin / sound engineer / Darrell) are marked TO CONFIRM, never fabricated — the flag is the cue to ask the right expert.',
        'Entrust to faithful people who can teach others (2 Tim 2:2); train up in the way to go (Prov 22:6) — onboarding is discipleship of the system.',
      ],
      howToRun: 'Pray + read the anchor (2): read 2 Timothy 2:2 — entrust it to faithful teachers. | The big idea (8): name the path + the hours-not-weeks goal. | Go deeper (12): the quiz/completion machinery + the LIVING (shared help) + HONEST (SME flags) properties. | Try it in the app (10): review their own progress + completion across the course; identify any SME flags they hit. | Check yourself + carry it (5): have them name who to ask for each SME area and commit to passing the remaining checkpoints.',
      discussionPrompts: [
        'How is coming up to speed in hours (not weeks) good for both the new person AND the whole church?',
        'Why does it make the course MORE trustworthy that it admits what still needs an expert to confirm?',
        'Who will YOU be able to teach once you have finished this path?',
      ],
    },
  },
];

// ---------------------------------------------------------------------------
// LIVING TIE (item 5): a tiny, real cross-check that the course shares material
// with the in-app contextual "?" help. surfaceTourFromHelp() builds a plain tour
// of the real surfaces straight from the live HELP registry, so the course's
// "what's on each screen" content is the SAME source the "?" button reads — it
// cannot silently drift. Pure + deterministic (safe for the tutor + tests).
// ---------------------------------------------------------------------------
export function surfaceTourFromHelp(keys = null) {
  const wanted = Array.isArray(keys) && keys.length
    ? keys
    : ['about', 'church', 'church:learn', 'church:videowall', 'voice', 'inventory'];
  return wanted
    .filter((k) => HELP[k])
    .map((k) => ({ key: k, title: HELP[k].title, what: HELP[k].what, why: HELP[k].why }));
}

// The roadmap sections the course points a new volunteer at (shared with the "?"
// overview), so "where do I go next" is answered from the same live source.
export function onboardingRoadmapSections() {
  return (Array.isArray(ROADMAP) ? ROADMAP : []).map((s) => ({ key: s.key, title: s.title }));
}

// ---------------------------------------------------------------------------
// Course-specific helpers — thin wrappers over the GENERIC, tested helpers in
// church-classes.js, so this self-paced course behaves identically to the others.
// Built WITHOUT dates (self-paced): rows carry module numbers, no dates.
// ---------------------------------------------------------------------------
import {
  progressSummaryFor, exportCurriculumMarkdownFor, resolveCohortGeneric,
} from './church-classes.js';

export const DATASYSTEMS_INTEREST_TAG = '[Data Systems course interest]';
export const DATASYSTEMS_HELPER_TAG = '[Data Systems course helper]';

export function resolveDatasystemsCohort(localCohort = null) {
  return resolveCohortGeneric(localCohort, DATASYSTEMS_CONFIRMED_COHORT, DATASYSTEMS_PROPOSED_COHORT_START);
}

// Self-paced: one row per module with its module number, but NO computed date.
export function buildDatasystemsSchedule() {
  return DATASYSTEMS_MODULES.map((m, i) => ({ ...m, week: i + 1, date: null, weekday: null }));
}

export function datasystemsProgressSummary(progress = {}) {
  return progressSummaryFor(DATASYSTEMS_MODULES, progress);
}

export function exportDatasystemsCurriculumMarkdown() {
  return exportCurriculumMarkdownFor(
    { meta: DATASYSTEMS_META, sessionFlow: DATASYSTEMS_SESSION_FLOW, modules: DATASYSTEMS_MODULES },
    null,
  );
}

// Tutor course-meta — the per-module solo guide introduces itself as a warm, plain-
// spoken coach for staff and volunteers learning to steward the systems: real,
// verified facts; honest about what awaits an SME; servant-framed; and clear that
// Ari is a sovereign, assistive tool that can be wrong.
export const DATASYSTEMS_TUTOR_META = {
  title: DATASYSTEMS_META.title,
  intro: 'You are a warm, encouraging, plain-spoken coach for PoeTech and Church of the Living God staff and volunteers, guiding one learner through "PoeTech Data Systems & Infrastructure" so they can understand and steward the systems well.',
  posture: 'Teach REAL, verified facts about the system: the PWA and its "no painted numbers + sovereign" foundation, the device-first + sovereign-cloud data layer with Row-Level Security, the detect->understand->execute->QC->update improvement loops under the Quality Care Health Plan, how the modules connect (the harvest pipeline: one recording -> many harvests; the shared CRM), Ari (the sovereign A.I. — "the unseen, made seen," under Yahweh, honest that it can be wrong), and the church tech stack (the NAS as barn + brain, the 2x RTX 4070 GPU nodes for local A.I., the LED video wall driven by the NovaStar VX1000 with NDI as a separate lane, and how it all serves Sunday and Wednesday). Then the practical skills: running a service on the wall/Presenter (calm, prepared, safety-netted), adding content with NO code or JSON, using the "?" help and the voice tools, and role-appropriate tasks under the relationship/permission model (child-safety + tenant limits are structural). Pitch it to the learner (a nervous first-timer vs an experienced operator) and keep it plain and reassuring; the goal is to come up to speed in HOURS, not weeks. Ground the heart in stewardship and service: we steward these systems so the Body is equipped and the family and community are lifted (1 Corinthians 4:2; Colossians 3:23), decently and in order (1 Corinthians 14:40). Cite Scripture by reference (do not quote a translation you are unsure of; never invent or paraphrase a verse as if quoting it). Be HONEST and verifiable per the Verification Doctrine: where a fact awaits the church\'s own subject-matter expert — Christina (clinical/practice), Bishop Gwin (worship/doctrine), the sound engineer (live audio), or Darrell (architecture/strategy) — say plainly it is TO CONFIRM and point the learner to that person, rather than fabricating. You run on the church\'s own sovereign, local A.I. (its RTX-4070 machines); you can be wrong — tell them to verify what matters. Never present an estimate (like the exact LED-wall pixel map, or which GPU node serves what during a service) as settled fact.',
};
