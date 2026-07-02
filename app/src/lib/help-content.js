// =============================================================================
// help-content — the ONE registry of in-app contextual help + the user roadmap
// =============================================================================
// Darrell, 2026-06-29: "I can't tell what the users' experience is or will be —
// we need roadmaps for users to know, or click HELP and get an understanding of
// that tab or tool. Discrete but informative and helpful."
//
// This module is the single source of truth for WHAT every surface's help says.
// One canonical primitive per axis (DR-0079): every "?" affordance in the app
// reads from here, so help is consistent and no surface ships a one-off blurb.
//
// THE SHAPE OF GOOD HELP (Anxiety-Clarity Principle, docs/00-foundations):
//   anxiety is informational at root — people don't know what to do. Every help
//   entry answers WHAT this is, HOW to use it, and WHY it matters (and WHEN where
//   it helps). It is DISCRETE: a short summary first, an optional "more" for the
//   reader who wants depth — never a wall of text in the face of someone who just
//   wanted a hint.
//
// TIED TO ARI (lib/ari.js): the help speaks in Ari's plain, on-task voice — the
// A.I. explaining the surface you're looking at. Per Ari's posture it stays
// clear and never preachy; faith-area help (Scripture, Study, The Word) holds
// the Typographic Theology (God references capitalized; the adversary never).
//
// VERIFICATION (DR-0076): every entry below is grounded in a REAL surface that
// ships today (the nav in poe-financial-mvp-v28.jsx + the surface registry in
// surfaces.js). The test in __tests__/help-content.test.js fails the build if
// any registered nav id is missing help, if any help entry is empty/TODO, or if
// a roadmap step points at a view that does not exist — so "no empty help" is a
// machine-checked promise, not a hope.
// =============================================================================

import { ARI } from './ari.js';
import { ANCHOR_PRINCIPLES } from './anchor-principles.js';

// Ari's name, surfaced so help UIs attribute the explanation to the one A.I.
// identity rather than re-deriving copy. The lead line a help sheet shows above
// the explanation — plain and warm, in Ari's voice, never preachy.
export const HELP_VOICE_NAME = ARI.name;
export function ariHelpLead() {
  return `${ARI.name}, the Black Lion — here it is in plain words.`;
}

// -----------------------------------------------------------------------------
// THE REGISTRY. Keyed by the surface's nav id. Top-level views key by their
// `view` id (e.g. 'forecast'); church/books sub-surfaces key as
// 'church:<churchView>' / 'books:<booksView>'. Each entry:
//   title : the surface's plain name (what the tab is called)
//   tag   : a one-line "what is this" for the help button's tooltip/preview
//   what  : 2-3 plain sentences — what this surface IS and does
//   how   : ordered, concrete steps — how to actually use it
//   why   : why it matters / what it's for (the payoff)
//   when  : (optional) when you'd reach for it
//   more  : (optional) a deeper paragraph for the reader who taps "more"
//   section: the roadmap section this surface belongs to (see ROADMAP)
// -----------------------------------------------------------------------------
export const HELP = {
  // ── Money ────────────────────────────────────────────────────────────────
  overview: {
    title: 'Big Picture',
    tag: 'Your whole financial life on one screen.',
    what: 'The Big Picture is your home base. It pulls your real numbers — cash on hand, what is coming in, what is owed, and what is coming up — into one calm view so you always know where you stand without opening a spreadsheet.',
    how: [
      'Read it top to bottom: the headline numbers first, then upcoming events and anything flagged for attention.',
      'Tap any number that looks off to trace where it came from.',
      'Use the quick actions to jump straight to Books, Real Estate, or Projects when something needs a closer look.',
    ],
    why: 'When you can see the whole board at a glance, the worry quiets down — you are not guessing, you are looking at what is actually true.',
    when: 'Start here each time you open the app to take the temperature of everything.',
    section: 'money',
  },
  books: {
    title: 'Books',
    tag: 'The ledger: accounts, transactions, debts, and the calendar.',
    what: 'Books is the financial system of record — your entities, accounts, transactions, debts, subscriptions, 1099 contractors, and the money calendar all live here. Balances are derived from the real transaction ledger, not typed in by hand, so they stay honest.',
    how: [
      'Use the sub-tabs across the top to move between Accounts, Transactions, Debts, and the Calendar.',
      'Add or edit a transaction and the balances that depend on it update themselves.',
      'Open the Calendar to see recurring bills and one-time events laid out by date.',
    ],
    why: 'This is the source of truth every other money view reads from. Keep it current and the Big Picture, Forecast, and reports all stay trustworthy.',
    section: 'money',
  },
  'books:entities': {
    title: 'Entities',
    tag: 'The households and businesses you keep books for.',
    what: 'Entities are the separate "books" you keep — the family, a rental LLC, a practice, a side business. Each one rolls up its own accounts, income, and obligations so money never gets blended by accident.',
    how: [
      'Pick an entity to focus the whole Books view on just its numbers.',
      'Add a new entity when a business or property needs its own clean set of books.',
      'Watch each entity\'s roll-up to see how that piece is doing on its own.',
    ],
    why: 'Keeping entities separate is what makes taxes, ownership, and "how is this business actually doing" answerable instead of a guess.',
    section: 'money',
  },
  'books:accounts': {
    title: 'Accounts',
    tag: 'Bank and cash accounts, with balances derived from the ledger.',
    what: 'Accounts lists your bank and cash accounts. Each balance is computed from its opening figure plus every settled transaction — so the number you see is the number the ledger supports, not a stale entry.',
    how: [
      'Add an account with its opening balance once; transactions do the rest.',
      'Set a buffer target to track how much of your safety cushion is funded.',
      'Flag an account as legal/reserve to keep set-aside money out of "spendable".',
    ],
    why: 'Honest account balances are the foundation of every other number — this is where "how much do we actually have" gets answered.',
    section: 'money',
  },
  'books:debts': {
    title: 'Debts',
    tag: 'What is really owed, with a payoff (snowball) plan.',
    what: 'Debts is a live view of what you actually owe — it pulls your credit and loan accounts (like the Line of Credit) and your rental mortgages straight from your real data. It builds a payoff plan, can order debts smallest-first (the snowball), and shows how a little extra each month shortens the road to free.',
    how: [
      'Total Debt fills in automatically from your credit/loan accounts and rental mortgages — nothing to type.',
      'For a payoff date, each debt needs its rate and minimum payment; a debt missing those shows "Add terms" instead of a fake finish date.',
      'Set an extra-payment amount to see the payoff date move; switch the sort to compare snowball order against highest-rate-first.',
    ],
    why: 'Debt is the weight that limits choices. Showing the REAL balances (never a hollow "$0 / debt-free") and an honest finish line turns vague dread into a path you can walk.',
    more: 'Because it reads live accounts, the debt view can never drift from reality. It also refuses to project a payoff it cannot honestly compute — if a balance has no rate or minimum yet, it shows the real amount owed and asks you to add the terms rather than inventing a date.',
    section: 'money',
  },
  'books:transactions': {
    title: 'Transactions',
    tag: 'The living record of money in and out — sort, filter, evaluate.',
    what: 'Transactions is the line-by-line ledger of money moving in and out, and the home of two work views: History (every cleared row) and Evaluate (the real picture). Every balance in the app is built from these entries.',
    how: [
      'In History, click any column header to sort (date, amount, account, payee, category), and use the bar to filter by account, date range, or text.',
      'Open a row to set or fix its category; the deterministic classifier fills most in for you, and your edits stick.',
      'Switch to the Evaluate sub-tab to see how many rows are categorized vs still need review, each account\'s derived balance, and income vs outflow by category.',
    ],
    why: 'This is the ground truth of your finances. Sort and filter to find anything fast; categorize so the Evaluate picture — and every forecast downstream — is real.',
    section: 'money',
  },
  'books:imported': {
    title: 'Imported',
    tag: 'The bank data imported into your ledger — deterministic, always loads.',
    what: 'Imported is a read-only view of the bank transactions that have been imported into your ledger. It reads straight from your synced app database — no outside workflow to reach — so it always loads and never shows a "could not connect" error. The underlying data is refreshed by a plain, deterministic job on your own NAS.',
    how: [
      'Browse the imported rows; filter by account or date, or search a payee.',
      'The 30-day in/out and counts are computed live from the ledger.',
      'To categorize or edit a row, use the Transactions tab (History) — Imported is the read-only mirror.',
    ],
    why: 'A dependable, sovereign view of what came in from the bank — grounded in your own data, not a fragile connection to an outside service.',
    section: 'money',
  },
  'books:cart': {
    title: 'Subscriptions',
    tag: 'Recurring subscriptions and what they cost you.',
    what: 'Subscriptions tracks the recurring charges you pay — the small monthly bleeds that add up. It keeps them visible so nothing renews in the dark.',
    how: [
      'Add each subscription with its amount and cycle.',
      'Tie it to the entity that pays for it.',
      'Review the list periodically and cut what you no longer use.',
    ],
    why: 'Recurring charges are the easiest money to lose track of. Seeing them all in one place is how you stop paying for what you forgot.',
    section: 'money',
  },
  'books:k1099': {
    title: '1099 Contractors',
    tag: 'The independent workers you pay, for clean tax time.',
    what: 'The 1099 tab tracks the independent contractors you pay across the year, with the totals you need when tax forms come due.',
    how: [
      'Add each contractor and the entity that pays them.',
      'Let their payments accumulate as you record transactions.',
      'Pull the year-end totals when it is time to issue forms.',
    ],
    why: 'Reconstructing contractor pay in January is painful. Tracking it as you go makes tax season a lookup instead of a scramble.',
    section: 'money',
  },
  'books:calendar': {
    title: 'Money Calendar',
    tag: 'Bills, income, and events laid out by date.',
    what: 'The Calendar lays your recurring bills, expected income, and one-time money events out across the dates they land — so a tight week never surprises you.',
    how: [
      'Add recurring items (rent, payroll, loan payments) once and they repeat.',
      'Drop in one-time events as they come up.',
      'Scan ahead to spot the weeks where outflow stacks up.',
    ],
    why: 'Cash-flow trouble is almost always a timing problem. Seeing the month ahead is how you steer around the tight spots before they hit.',
    section: 'money',
  },
  'books:legal': {
    title: 'Legal',
    tag: 'Legal and reserve set-asides, kept separate.',
    what: 'The Legal tab is where accounts and funds you have set aside for legal or reserve purposes are marked and kept distinct from everyday spendable money.',
    how: [
      'Mark an account as legal/reserve to fence it off.',
      'Watch the set-aside total so the cushion stays funded.',
      'Keep this money out of day-to-day decisions on purpose.',
    ],
    why: 'Money you have promised to a purpose should not look spendable. Fencing it off protects the plan from a tempting Tuesday.',
    section: 'money',
  },
  forecast: {
    title: 'Forecast',
    tag: 'Where the money is headed — projections, not promises.',
    what: 'Forecast projects your cash flow forward from your real numbers and lets you test scenarios — best, base, and worst case, plus the effect of a new property, a tier change, or a capital move. Everything here is a projection, not a promise.',
    how: [
      'Read the base projection first — the straight line from where you are now.',
      'Switch scenarios to see best and worst bounds around it.',
      'Add a what-if (a property, a hire, a big purchase) and watch the line bend.',
      'Compare projected against actual over time to see how reality tracked the plan.',
    ],
    why: 'Decisions live in the future. Seeing the likely shape of the next months — and the range around it — lets you choose with eyes open instead of hoping.',
    when: 'Reach for it before any big money decision, and monthly to check projected against actual.',
    section: 'money',
  },
  budget: {
    title: 'Goals & guidance',
    tag: 'Set a target; get the plan and the proactive warnings.',
    what: 'The goal-driven budget engine. Set a goal — "save $6,000 by December" or "pay off the card" — and it plans from your real income and upcoming bills: what to set aside each month, whether you are on or off track, and when the goal lands. It also watches your categorized spending and warns before an overspend, telling you the reason ("hold this — insurance is due", "you are covered here").',
    how: [
      'Add a goal with a target amount and a date (pay-off goals track the live debt balance).',
      'Read the monthly set-aside and the on/off-track status — competing goals share your free cash, so the plan is honest.',
      'Scan Proactive guidance for act-now and heads-up signals, each with its reason.',
      'Check Category vs plan for anything running hot this month, and Down the pipeline for bills to save ahead for.',
    ],
    why: 'A budget you look at once a month is a scorecard; a budget that warns you before the overspend is a coach. This is planning guidance on your own numbers — not investment advice, and no money moves here.',
    when: 'Set goals once, then glance at the guidance whenever a spend decision comes up.',
    section: 'money',
  },
  markets: {
    title: 'Markets',
    tag: 'A simple watchlist for the symbols you follow.',
    what: 'Markets is a lightweight watchlist for the stocks or symbols you want to keep an eye on — quotes at a glance, no day-trading theatrics.',
    how: [
      'Add a symbol to your watchlist.',
      'Glance at the list to track what you care about.',
      'Remove what you no longer follow.',
    ],
    why: 'A short, intentional watchlist keeps you informed without pulling you into the noise of a full trading platform.',
    section: 'money',
  },
  rentals: {
    title: 'Real Estate',
    tag: 'Your properties: leases, tenants, upkeep, and returns.',
    what: 'Real Estate is the home for your rental properties — leases, tenants, equipment, rooms, maintenance, and the math on what each property actually returns.',
    how: [
      'Open a property to see its lease, tenant, and upkeep in one place.',
      'Log maintenance and equipment so nothing falls through.',
      'Use the evaluator and snowball math to judge a property\'s real return.',
    ],
    why: 'Property is a business, not just an asset. Tracking it like one is the difference between a rental that builds wealth and one that quietly drains it.',
    section: 'business',
  },

  // ── Run the business ───────────────────────────────────────────────────────
  inbound: {
    title: 'Inbound',
    tag: 'Calls, messages, and inquiries turned into action.',
    what: 'Inbound is where calls, messages, and inquiries come in and become something you can act on — a new project, a logged incident, or a lead to follow up.',
    how: [
      'Review incoming items as they arrive.',
      'Turn each one into the right next step — a project, an incident, or an inquiry.',
      'Configure how voice and message intake is handled.',
    ],
    why: 'Opportunities and problems both arrive as messages. A single intake that routes them to the right place is how nothing important slips through.',
    section: 'business',
  },
  projects: {
    title: 'Projects',
    tag: 'Active work, managed from start to done.',
    what: 'Projects is the management hub for active work. Each project moves through real stages derived from its status, keeps a lifecycle trail, and carries inline discussions so the thinking lives with the work.',
    how: [
      'Open a project to see its stage, history, and discussion.',
      'Update its status and the stage follows automatically.',
      'Archive finished work so the active list stays focused.',
    ],
    why: 'Work that is tracked gets finished; work that lives in your head gets dropped. This keeps every effort visible until it is truly done.',
    section: 'business',
  },
  'projects:boards': (() => {
    // Reads from the single anchor-principles record — store once, read everywhere.
    const ap = ANCHOR_PRINCIPLES['anchor-aggregator-life-corpus'];
    const purposeProse = ap
      ? ap.purposes
          .map((p, i) => `(${i + 1}) ${p.label}: ${p.body}`)
          .join(' ')
      : '';
    return {
      title: 'Boards — self-tracking roadmaps',
      tag: 'Honest statuses, real queue — not painted green.',
      what: 'Boards are the self-tracking work roadmaps inside Projects. Each item carries a verified-honest status — blocked means blocked, done means end-to-end verified on real data — and a driver category (NAS-runnable / needs-LLM / needs-a-human-decision) so the pipeline knows what to advance even when the vendor AI is offline.',
      how: [
        'Browse groups to see the full queue in dependency order.',
        'Status is verified-honest (DR-0076): nothing is fake-green. Check what is blocked before assuming it is in progress.',
        'The NAS heartbeat reads the same manifest on every cycle and logs what it can run now vs what needs a credential or LLM session.',
      ],
      why: ap ? ap.oneliner : 'We track work inside the app so nothing lives only in a vendor tool the family does not own.',
      more: ap
        ? `Declared by ${ap.author} on ${ap.date}: "${ap.verbatim}" The five bound purposes: ${purposeProse} ${ap.scripture}`
        : undefined,
      section: 'business',
    };
  })(),
  practice: {
    title: 'Practice',
    tag: 'Operations and client growth for a practice.',
    what: 'Practice is the operations surface for a service practice — the place to run client-facing work and grow the client base with a guided, ethical acquisition flow.',
    how: [
      'Use the operations tools to run the day-to-day of the practice.',
      'Open Client Growth to work the acquisition stages.',
      'Keep outbound on the approve-first track so nothing goes out unreviewed.',
    ],
    why: 'A practice lives or dies on steady, ethical client flow. Structure turns "hope someone calls" into a repeatable pipeline.',
    section: 'business',
  },
  opportunities: {
    title: 'Dev/Ops',
    tag: 'The builder/operator workspace for the platform itself.',
    what: 'Dev/Ops is the problem-solving workspace — where the system itself is built, observed, and improved. It is the Dev/Ops half of the input-to-output surface, paired with the listening Council Chamber.',
    how: [
      'Bring a problem or build request here and work it through.',
      'Watch the operational signals the platform exposes.',
      'Hand structured work off to the right surface.',
    ],
    why: 'The tools that run the family also run themselves here. Keeping that work in the open is how the platform stays trustworthy and improvable.',
    section: 'business',
  },
  crm: {
    title: 'CRM',
    tag: 'One shared, consent-respecting acquisition backbone.',
    what: 'CRM is the single relationship engine every funnel rides on — businesses, pipelines, and follow-up in one place, with a consent gate and draft-only outreach so nothing goes out without your say.',
    how: [
      'See live inquiries and leads federated from across the app.',
      'Move a lead along its pipeline as the relationship grows.',
      'Review draft follow-ups and approve what should actually send.',
    ],
    why: 'Relationships are the real asset of any business. One honest backbone — that asks consent and never auto-blasts — protects them while it grows them.',
    section: 'business',
  },
  relationships: {
    title: 'Relationships',
    tag: 'Who can do what — by the relationship between two people.',
    what: 'Relationships is where access stops being "is someone signed in" and becomes what the relationship grants. It models three relationships — guardian and child, family, and landlord and tenant — with an explicit can/can\'t matrix, and it is where you set the parts that are yours to set.',
    how: [
      'Open Matrix to see, live from the model, exactly what each role can and cannot do.',
      'In Guardian & Child, set what a child can do — child-safe by default, with outbound and sensitive actions locked or ask-first.',
      'In Landlord & Tenant, run the rent roll, maintenance, rent records (no money moves), notices, and messages — each side scoped to its own.',
    ],
    why: 'A child should do age-appropriate things and not spend money; a tenant should see their unit and not your portfolio. Making the relationship the unit of permission keeps that true by design, not by hope.',
    section: 'business',
  },
  inventory: {
    title: 'Inventory',
    tag: 'A real inventory system of record (derived on-hand).',
    what: 'Inventory is a genuine inventory-control system: on-hand quantities are derived from an append-only ledger of movements, so the count is always provable rather than typed over.',
    how: [
      'Add items and record movements (received, used, adjusted) as they happen.',
      'Read the derived on-hand — it reflects the full movement history.',
      'Run counts to reconcile reality against the ledger.',
    ],
    why: 'Inventory you cannot trust is worse than none. A movement ledger means every count traces to something that actually happened.',
    section: 'business',
  },
  center: {
    title: 'Command, Control & Serve',
    tag: 'The steward\'s seat — see, command, control, serve.',
    what: 'The Center is the steward\'s cockpit: it composes the platform\'s real operating surfaces — the ops board, quality proof, orchestration, and the conflict loop — under four postures: See, Command, Control, Serve. It is braked by design (it reads and decides; it never runs off-leash).',
    how: [
      'Start in See to read the live state of the system.',
      'Move to Command and Control to direct work.',
      'Use Serve to act for the family and community.',
    ],
    why: 'A complex system needs one seat to govern it from. This is where the human stays in charge — with the receipts in front of them.',
    section: 'business',
  },
  admin: {
    title: 'Admin',
    tag: 'Quiet utility surface for switching to the sovereign hosts.',
    what: 'Admin is a quiet utility page, not a marketing surface. It shows how to reach the family\'s own sovereign hosts (the NAS over Tailscale or the local network) and lists the internal surfaces that run there.',
    how: [
      'Open it from the footer link or the ?view=admin address.',
      'On the public site it shows the Tailscale/LAN addresses to switch to.',
      'On the internal network it lists the live internal surfaces.',
    ],
    why: 'The serious internal tools live on the family\'s own hardware. This is the quiet door to them — access is the network itself, not a password here.',
    section: 'business',
  },

  // ── Capture & create ───────────────────────────────────────────────────────
  notes: {
    title: 'Notes',
    tag: 'Capture a thought before it slips away.',
    what: 'Notes is the quick-capture space — the thinking space where a thought, an idea, or something you want to hold onto gets written down before it is lost.',
    how: [
      'Jot the thought the moment you have it.',
      'Come back later to sort, keep, or carry it into Study or Create.',
      'Keep it light — capture first, organize second.',
    ],
    why: 'The mind is for having ideas, not holding them. Capturing freely is the first step of the capture-reflect-create flow.',
    section: 'create',
  },
  study: {
    title: 'Study',
    tag: 'A private space to sit with the Word and reflect.',
    what: 'Study is a private reflection space for the study circle — a place to sit with Scripture and the Word, work through deep reflections, and distill them into plain, lasting takeaways. It honors the whole Godhead — Yahweh the Father, Jesus the Son, and the Holy Spirit — even-handedly.',
    how: [
      'Bring a passage or a question and reflect on it here.',
      'Use the connections to follow a theme across Scripture.',
      'Finalize a deep reflection into a plain, keepable form.',
    ],
    why: 'Reflection that is captured becomes formation. This is where time with the Word turns into something you carry, not just a moment that passed.',
    section: 'create',
  },
  create: {
    title: 'Create',
    tag: 'Make a document or image, right in the app.',
    what: 'Create is a document and image workspace built into the app — write a document or compose an image and export it (PNG/JPG), all offline and dependency-free. It is the "produce" end of capture → reflect → create.',
    how: [
      'Pick a workspace type and start composing.',
      'Lay out text and images on the canvas.',
      'Export to an image file when it is ready to share.',
    ],
    why: 'Ideas become useful when they take a shareable shape. Making them here keeps the whole flow — from a Note to a finished piece — inside one tool you own.',
    section: 'create',
  },
  voice: {
    title: 'Voice',
    tag: 'Listen to anything, in a voice you choose.',
    what: 'Voice lets you listen to text read aloud in a chosen voice — a free system voice today, with consent-gated personal (cloned) voices as a subscriber feature. It will never present a stand-in as a real cloned timbre, and never clones a voice without consent.',
    how: [
      'Pick a voice from the picker.',
      'Send text to be read aloud and listen.',
      'Enroll a personal voice only with the speaker\'s own consent.',
    ],
    why: 'Hearing the words opens the app to people who would rather listen than read — the "hear" half of seeing and hearing, built for every age and ability.',
    section: 'create',
  },
  library: {
    title: 'Library',
    tag: 'Books built from the house\'s own writing, with a reader.',
    what: 'Library holds books assembled from the household\'s own corpus, with an in-app reader whose chapters link back into the live app. Reading is open to every signed-in user; the build Studio is family-gated.',
    how: [
      'Open a book and read it in the built-in reader.',
      'Follow a chapter\'s links back to the live surfaces it references.',
      'If you have Studio access, assemble new books from the corpus.',
    ],
    why: 'The family\'s own thinking, gathered into books that point back at the working app, turns scattered writing into a library that teaches the system.',
    section: 'create',
  },
  recipes: {
    title: "Chef's Corner",
    tag: 'Recipes, scaled and converted — start with Chef Mario\'s.',
    what: "Chef's Corner is the recipe surface, starting with the Poe Family Vegan Recipes by Chef Mario. It scales servings, converts between metric and American units honestly, and can even read a recipe from a photo. Your own added recipes are saved privately.",
    how: [
      'Open a recipe and set the number of servings — the amounts rescale.',
      'Switch units between metric and American as you like.',
      'Add your own recipe, or import one from a photo.',
    ],
    why: 'Good food is part of a good life. A recipe that scales and converts itself takes the friction out of cooking for however many are at the table.',
    section: 'create',
  },

  // ── Church & worship ───────────────────────────────────────────────────────
  church: {
    title: 'Church',
    tag: 'The home for worship, service, and church life.',
    what: 'Church is the gathering place for everything the congregation does together — worship and the order of service, the choir, the Word, Scripture, learning, conferences, and community venues. Its sub-tabs run across the top.',
    how: [
      'Use the sub-tabs to move between Choir, Order of Service, The Word, Scripture, Learn, and more.',
      'The home view holds prayer requests and the church\'s shared voice.',
      'Staff tools (Harvest, Video Wall, Observation) appear for church staff.',
    ],
    why: 'A church runs on many moving parts. Gathering them in one place — built for an elderly, tech-novice congregation first — is how the work of worship stays simple to do.',
    section: 'church',
  },
  'church:home': {
    title: 'Church Home',
    tag: 'Prayer requests and the church\'s shared voice.',
    what: 'The Church home view is the front door of church life — where prayer requests are raised and carried, and where the congregation\'s shared voice and notices live.',
    how: [
      'Add a prayer request and mark it as it is prayed and sent.',
      'Add to the church\'s shared voice.',
      'Move into a sub-tab for choir, the Word, or learning.',
    ],
    why: 'Prayer and a shared voice are the heartbeat of a congregation. Keeping them at the front keeps the people, not just the programs, at the center.',
    section: 'church',
  },
  'church:engagement': {
    title: 'Engagement',
    tag: 'How the congregation is connecting and taking part.',
    what: 'Engagement shows how the congregation is connecting and participating — a read on who is taking part so leaders can shepherd, not just broadcast.',
    how: [
      'Review the engagement signals the surface gathers.',
      'Notice who may be drifting and reach out.',
      'Use it to plan what the body actually needs next.',
    ],
    why: 'Shepherding starts with knowing the flock. Seeing engagement helps leaders care for people by name instead of guessing at a crowd.',
    section: 'church',
  },
  'church:choir': {
    title: 'Choir',
    tag: 'The songbook, renditions, and how the choir has sung.',
    what: 'Choir is the music surface — a searchable songbook cross-referenced to Scripture and theme, the renditions of each song (the different ways the choir has sung it), and keyboardist notes on key and arrangement.',
    how: [
      'Search the songbook by Scripture or theme and add a song to a service.',
      'Open a song to see its renditions and how it was sung before.',
      'Read the keyboardist notes for key and arrangement help.',
    ],
    why: 'A choir\'s repertoire is hard-won knowledge. Capturing it — songs, renditions, and how-to-play — means it is never lost when memories fade or singers move on.',
    section: 'church',
  },
  'church:program': {
    title: 'Order of Service',
    tag: 'One master order of worship, shared to every team.',
    what: 'Order of Service is the single master plan for a Sunday. From that one order, each team — choir, pulpit, music, media, ushers, hospitality — gets its own derived view, and the closing loop reconciles what was planned against what actually happened.',
    how: [
      'Build the master order for the service.',
      'Each team reads its own slice, derived automatically.',
      'After the service, reconcile actual against planned to learn for next time.',
    ],
    why: 'When every team works from one source, the service flows. Reconciling afterward turns each Sunday into a better blueprint for the next.',
    section: 'church',
  },
  'church:pulpit': {
    title: 'The Word',
    tag: 'Sermons and messages, by speaker, kept and searchable.',
    what: 'The Word is where sermons and messages live — attributed to a real speaker (one canonical identity, not loose spellings), kept and made searchable so a message preached once can be found and revisited.',
    how: [
      'Browse messages by speaker or topic.',
      'Open one to read or present it.',
      'Follow a message\'s lineage when it is re-preached.',
    ],
    why: 'The preaching is the heart of the gathering. Keeping it — well-attributed and findable — lets the Word keep working long after Sunday.',
    section: 'church',
  },
  'church:scripture': {
    title: 'Scripture',
    tag: 'A themed Scripture library, read through His love.',
    what: 'Scripture is a themed library of passages backing the spiritual life of the app — grouped by theme, read through the lens of His perspective and His love, with grace and truth held together and no condemnation. Public-domain translations are shown verbatim; others are linked.',
    how: [
      'Browse by theme to find passages that speak to a need.',
      'Open a passage to read it and follow its cross-references.',
      'Use it as the backbone for Study and for Learn.',
    ],
    why: 'The Word is the source of answers. A library that fetches the real text — never invented or paraphrased without saying so — keeps that source trustworthy.',
    section: 'church',
  },
  'church:learn': {
    title: 'Learn',
    tag: 'Self-paced courses that teach how to think, not what to conclude.',
    what: 'Learn is the teaching engine — courses and lessons that run through one paced arc (open, teach, engage, apply, send-off). It includes a discernment track that teaches how to think through a charged claim, with every side labeled and sourced.',
    how: [
      'Pick a course or lesson and move through it at your own pace.',
      'Engage with the practice and reflection steps, not just the reading.',
      'Carry the apply step into real life — that is where it lands.',
    ],
    why: 'Formation, not just information. Teaching the how of thinking — fairly, with sources — equips people to walk wisely instead of just handing them a conclusion.',
    section: 'church',
  },
  'church:eternal-algorithms': {
    title: 'Eternal Algorithms',
    tag: "Yahweh's if/then truths as decision-logic — studies for honest self-examination.",
    what: 'A public study series that reads Yahweh\'s conditional (if/then) truths as His eternal decision-logic. Entry #1, Conditional Truth, is about the gap between what we say we believe and what we actually do. Every point is anchored in Scripture (the Word is the arbiter), held in both mercy and accountability, and open-handed — we are still piecing together the Truth.',
    how: [
      'Read the teaching — tap "Go deeper" on any point to see the fuller treatment and the Scripture behind it.',
      'Answer the self-examination honestly; your answers stay on your device only, never sent anywhere.',
      'Run the belief-vs-action round — each choice is scored on the same eight Yahweh axes the Generations game uses — solo or in a family / team Game Night.',
    ],
    why: 'Doing the word, not just hearing it, is the proof of real agreement (James 1:22). A mirror held in grace and truth helps a person close the distance between profession and action — for the soul, and for the Kingdom.',
    section: 'church',
  },
  'church:conference': {
    title: 'Conference',
    tag: 'Register for and run a conference event.',
    what: 'Conference handles a conference end to end — open registration without a login, an optional account on-ramp that links the signup to the app, and a day-of variance view comparing who was anticipated against who actually came.',
    how: [
      'Share the open registration so anyone can sign up.',
      'On the day, use check-in to mark arrivals.',
      'Read the variance view to see no-show rate, meals served, and rooms used.',
    ],
    why: 'Events are expensive to run blind. Knowing anticipated-vs-actual turns guesswork about food, space, and follow-up into numbers you can plan on.',
    section: 'church',
  },
  'church:events': {
    title: 'Venues',
    tag: 'Community use of the campuses — no double-booking.',
    what: 'Venues manages community use of the church campuses — funerals, weddings, and gatherings — with a no-double-book engine, clear responsibilities, and the real revenue each booking brings.',
    how: [
      'Request or schedule a campus for an event.',
      'The engine blocks conflicts so two events never collide.',
      'Track responsibilities and the revenue for each booking.',
    ],
    why: 'The buildings are a gift to the community and a real resource. Booking them cleanly serves the neighborhood without chaos or collisions.',
    section: 'church',
  },
  'church:harvest': {
    title: 'Harvest',
    tag: 'No service recording lost — every video fans out.',
    what: 'Harvest is the coverage ledger that makes sure no service recording is wasted. From one transcript a single recording fans out into sermon, songs, lessons, Scripture, testimony, and more — and the ledger flags anything that was missed.',
    how: [
      'Watch the ledger for recordings that have been harvested.',
      'Spot orphans — recordings whose pieces have not been pulled yet.',
      'Confirm coverage so the value of each Sunday is fully captured.',
    ],
    why: 'Every recording is seed. Harvesting all of it — and proving none was dropped — multiplies one service into a week of nourishment.',
    section: 'church',
  },
  'church:videowall': {
    title: 'Video Wall',
    tag: 'Drive the sanctuary screens from the app.',
    what: 'Video Wall is the staff surface for driving what the sanctuary screens show — lyrics, Scripture, and lower-thirds — sent out over the church network to the displays.',
    how: [
      'Choose what the wall should show.',
      'Push lyrics or Scripture live during worship.',
      'Keep the screens in step with the order of service.',
    ],
    why: 'What the room sees shapes the worship. Driving it from the same app that holds the songs and the order keeps the screens true to the plan.',
    section: 'church',
  },
  'church:observe': {
    title: 'Observation',
    tag: 'A steward space for watching church operations.',
    what: 'Observation is a staff-only space for watching how church operations are running — a quiet read on the systems behind the gathering.',
    how: [
      'Open it as church staff to see the operational read.',
      'Watch for anything that needs attention.',
      'Act through the right surface when something is off.',
    ],
    why: 'Smooth Sundays are built on systems no one in the pew sees. A place to watch them keeps the unseen work healthy.',
    section: 'church',
  },

  // ── Pricing / front door ───────────────────────────────────────────────────
  about: {
    title: 'About',
    tag: 'What PoeTech is, who it serves, and the plans.',
    what: 'About is the front door — what PoeTech is, the community-first mission behind it, and the plans available. It is where you can see pricing and subscribe, and where the modules being built (and how to vote on what comes next) are laid out.',
    how: [
      'Read the mission and what the platform stands for.',
      'Compare the plans and what each unlocks.',
      'Vote on the modules you most want built next.',
    ],
    why: 'Knowing what a tool is for — and who it is built to serve — is the start of trusting it. This page answers that before you commit a thing.',
    section: 'start',
  },
};

// -----------------------------------------------------------------------------
// THE USER ROADMAP — the "what is the experience" overview + first-run tour.
// Major sections of the app, each a short journey: where to start, what each
// stop is for, and how the pieces connect. The walkthrough and the "how this
// works" overview both render from this. Each step's `to` navigates the app.
// -----------------------------------------------------------------------------
export const ROADMAP = [
  {
    key: 'start',
    title: 'Start here',
    blurb: 'PoeTech is your family operating system — money, church, business, and the things you make, all in one place you own. Here is the lay of the land.',
    steps: [
      { label: 'Big Picture', to: { view: 'overview' }, why: 'Your home base — the whole picture at a glance.' },
      { label: 'About & plans', to: { view: 'about' }, why: 'What this is, who it serves, and what each plan unlocks.' },
    ],
  },
  {
    key: 'money',
    title: 'Your money',
    blurb: 'See where you stand, keep an honest ledger, and look ahead. Each view reads from the one below it, so the numbers stay true top to bottom.',
    steps: [
      { label: 'Big Picture', to: { view: 'overview' }, why: 'The temperature of everything in one screen.' },
      { label: 'Books', to: { view: 'books' }, why: 'The ledger of record — accounts, transactions, debts, calendar.' },
      { label: 'Forecast', to: { view: 'forecast' }, why: 'Where the money is headed, with what-if scenarios.' },
      { label: 'Markets', to: { view: 'markets' }, why: 'A simple watchlist for symbols you follow.' },
    ],
  },
  {
    key: 'church',
    title: 'Church & worship',
    blurb: 'Everything the congregation does together — built first for an elderly, tech-novice church, so it stays simple. Plan the service, keep the music and the Word, and learn.',
    steps: [
      { label: 'Church home', to: { view: 'church', churchView: 'home' }, why: 'Prayer requests and the church\'s shared voice.' },
      { label: 'Order of Service', to: { view: 'church', churchView: 'program' }, why: 'One master plan, shared to every team.' },
      { label: 'Choir', to: { view: 'church', churchView: 'choir' }, why: 'Songbook, renditions, and how the choir has sung.' },
      { label: 'The Word', to: { view: 'church', churchView: 'pulpit' }, why: 'Sermons kept and searchable, by speaker.' },
      { label: 'Scripture', to: { view: 'church', churchView: 'scripture' }, why: 'A themed library, read through His love.' },
      { label: 'Learn', to: { view: 'church', churchView: 'learn' }, why: 'Self-paced courses that teach how to think.' },
    ],
  },
  {
    key: 'create',
    title: 'Capture & create',
    blurb: 'A simple flow from a fleeting thought to a finished piece: capture it, reflect on it, make something, and hear it read back.',
    steps: [
      { label: 'Notes', to: { view: 'notes' }, why: 'Capture a thought before it slips away.' },
      { label: 'Study', to: { view: 'study' }, why: 'Sit with the Word and distill your reflections.' },
      { label: 'Create', to: { view: 'create' }, why: 'Make a document or image and export it.' },
      { label: 'Voice', to: { view: 'voice' }, why: 'Listen to anything in a voice you choose.' },
      { label: 'Library', to: { view: 'library' }, why: 'Books built from the house\'s own writing.' },
      { label: "Chef's Corner", to: { view: 'recipes' }, why: 'Recipes that scale and convert themselves.' },
    ],
  },
  {
    key: 'business',
    title: 'Run the business',
    blurb: 'Turn inbound into action, manage the work, grow relationships honestly, and keep operations provable — with a steward\'s seat over it all.',
    steps: [
      { label: 'Inbound', to: { view: 'inbound' }, why: 'Calls and messages turned into next steps.' },
      { label: 'Projects', to: { view: 'projects' }, why: 'Active work managed from start to done.' },
      { label: 'Real Estate', to: { view: 'rentals' }, why: 'Properties run like the business they are.' },
      { label: 'CRM', to: { view: 'crm' }, why: 'One consent-respecting acquisition backbone.' },
      { label: 'Inventory', to: { view: 'inventory' }, why: 'A real system of record with a movement ledger.' },
    ],
  },
];

// Map of roadmap section key -> its title, for help sheets that show "part of".
export const SECTION_TITLE = Object.fromEntries(ROADMAP.map((s) => [s.key, s.title]));

// -----------------------------------------------------------------------------
// RESOLVERS — turn the app's current view state into the right help key/entry.
// -----------------------------------------------------------------------------

/**
 * The help key for the surface the user is currently on.
 * @param {{view?: string, churchView?: string, booksView?: string}} ctx
 * @returns {string|null} a key into HELP, or null if none is registered
 */
export function helpKeyFor(ctx = {}) {
  const { view, churchView, booksView } = ctx;
  if (view === 'church') {
    if (churchView) {
      const k = `church:${churchView}`;
      if (HELP[k]) return k;
    }
    return 'church';
  }
  if (view === 'books') {
    if (booksView) {
      const k = `books:${booksView}`;
      if (HELP[k]) return k;
    }
    return 'books';
  }
  return view && HELP[view] ? view : null;
}

/**
 * The help ENTRY for a key, or for the current view context.
 * @param {string | {view?: string, churchView?: string, booksView?: string}} arg
 * @returns {object|null}
 */
export function helpFor(arg) {
  if (!arg) return null;
  if (typeof arg === 'string') return HELP[arg] || null;
  const key = helpKeyFor(arg);
  return key ? HELP[key] : null;
}

// Every registered help key, for tests and for any "index of help" surface.
export const HELP_KEYS = Object.keys(HELP);
