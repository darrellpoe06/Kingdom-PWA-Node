// demo-data.js — the family-unit SAMPLE/DEMO persona datasets + picker copy,
// extracted from the frozen monolith 2026-07-06 (DR-0078 freeze; the shell may
// only shrink). buildDemoPersonas RECEIVES SEED_DATA as an argument, so this
// module never imports back from the shell — there is no import cycle and
// SEED_DATA stays defined in the shell exactly as before. The shell calls
// buildDemoPersonas(SEED_DATA) where SEED_DATA is in scope.
//
// =============================================================================
// DEMO DATA — public-facing showcase loaded via ?demo=family URL param.
//
// Posture: this is a stewardship app. The demo speaks for itself by showing
// what "providing for the people in your care" looks like with the books open.
// The Big Picture, Books, and Debts tabs render with realistic-but-modest
// family numbers — paycheck, rent, groceries, a buffer fund growing, a couple
// of debts being chipped down — so a viewer immediately sees: "I could
// actually use this for my household."
//
// What the demo deliberately shows:
//   · Joint household (one entity, no business complexity) — accessible to
//     anyone, not just multi-LLC owners.
//   · Modest accounts: checking, savings, a single credit card, an auto loan.
//   · 3 weeks of transactions with realistic descriptions + categories.
//   · A Buffer Fund 72% funded — the "this is what it means to be ready
//     before the 1st" story.
//   · Recurring obligations pre-mapped so projection figures aren't blank.
//   · Two debts on snowball so the Debts tab tells a payoff story.
//
// Demo mode also: disables localStorage saves, suppresses n8n ingest fetches,
// skips the profile picker, and surfaces a header banner explaining the demo
// and offering "start your own" CTA.
// =============================================================================

export function buildDemoPersonas(SEED_DATA) {
const DEMO_DATA_FAMILY_OF_4 = {
  ...SEED_DATA,
  meta: { ...SEED_DATA.meta, lastUpdated: '2026-05-28', monthOfData: 'May 2026', bufferTarget: 6000, bufferCurrent: 6000, releaseLabel: 'Sample · Family of 4' },
  entities: [
    { id: 'e-family', name: 'The Reeves Family', type: 'personal', notes: 'Two parents, two kids in school', visibleTo: ['darrell', 'christina', 'family'] }
  ],
  accounts: [
    // Thriving picture (SEED-DATA-AS-ASPIRATION): buffer fully funded, savings
    // built, the Visa paid down to almost nothing, the auto loan more than half
    // gone. This is a household that USES the system and is winning with it.
    { id: 'a-checking', entityId: 'e-family', name: 'Main Checking', institution: 'First National', type: 'checking', fragment: '...4521', balance: 3850, isPrimary: true },
    { id: 'a-savings',  entityId: 'e-family', name: 'Family Savings', institution: 'First National', type: 'savings',  fragment: '...8819', balance: 18000 },
    { id: 'a-cc-1',     entityId: 'e-family', name: 'Visa Rewards',   institution: 'Capital One',     type: 'credit',   fragment: '...3344', balance: -420 },
    { id: 'a-auto',     entityId: 'e-family', name: 'Auto Loan',      institution: 'Credit Union',    type: 'loan',     fragment: '...1290', balance: -4200 },
  ],
  transactions: [
    { id: 'dt-1',  date: '2026-05-01', accountId: 'a-checking', amount: -1800, description: 'May rent',                    category: 'household' },
    { id: 'dt-2',  date: '2026-05-01', accountId: 'a-checking', amount: 3200,  description: 'Paycheck',                    category: 'salary' },
    { id: 'dt-3',  date: '2026-05-03', accountId: 'a-checking', amount: -180,  description: 'Aldi · weekly groceries',     category: 'groceries' },
    { id: 'dt-4',  date: '2026-05-05', accountId: 'a-cc-1',     amount: -55,   description: 'Shell · gas',                 category: 'fuel' },
    { id: 'dt-5',  date: '2026-05-06', accountId: 'a-checking', amount: -150,  description: 'State Farm · auto',           category: 'insurance' },
    { id: 'dt-6',  date: '2026-05-08', accountId: 'a-checking', amount: -220,  description: 'ComEd + Ameren · utilities',  category: 'utilities' },
    { id: 'dt-7',  date: '2026-05-10', accountId: 'a-checking', amount: -89,   description: 'Xfinity · internet',          category: 'utilities' },
    { id: 'dt-8',  date: '2026-05-12', accountId: 'a-cc-1',     amount: -42,   description: 'Date night dinner',           category: 'dining' },
    { id: 'dt-9',  date: '2026-05-15', accountId: 'a-checking', amount: 1400,  description: 'Spouse · part-time income',   category: 'salary' },
    { id: 'dt-10', date: '2026-05-15', accountId: 'a-checking', amount: 3200,  description: 'Paycheck',                    category: 'salary' },
    { id: 'dt-11', date: '2026-05-15', accountId: 'a-checking', amount: -200,  description: 'Church giving · tithe',       category: 'charitable' },
    { id: 'dt-12', date: '2026-05-16', accountId: 'a-checking', amount: -340,  description: 'Auto loan payment',           category: 'debt-payment' },
    { id: 'dt-13', date: '2026-05-17', accountId: 'a-cc-1',     amount: -85,   description: 'Aldi · weekly groceries',     category: 'groceries' },
    { id: 'dt-14', date: '2026-05-20', accountId: 'a-checking', amount: -500,  description: 'Visa payment',                category: 'debt-payment' },
    { id: 'dt-15', date: '2026-05-22', accountId: 'a-cc-1',     amount: -130,  description: 'Kids · clothes + supplies',   category: 'household' },
    { id: 'dt-16', date: '2026-05-25', accountId: 'a-checking', amount: -65,   description: 'Phone bill',                  category: 'utilities' },
    { id: 'dt-17', date: '2026-05-27', accountId: 'a-savings',  amount: 250,   description: 'Buffer fund · monthly add',   category: 'transfer' },
    // Upcoming projections (future-dated rows surface in Big Picture / Tx upcoming view)
    { id: 'dt-18', date: '2026-06-01', accountId: 'a-checking', amount: -1800, description: 'June rent',                   category: 'household' },
    { id: 'dt-19', date: '2026-06-01', accountId: 'a-checking', amount: 3200,  description: 'Paycheck',                    category: 'salary' },
    { id: 'dt-20', date: '2026-06-06', accountId: 'a-checking', amount: -150,  description: 'State Farm · auto',           category: 'insurance' },
    { id: 'dt-21', date: '2026-06-10', accountId: 'a-checking', amount: -340,  description: 'Auto loan payment',           category: 'debt-payment' },
    { id: 'dt-22', date: '2026-06-15', accountId: 'a-checking', amount: -200,  description: 'Church giving · tithe',       category: 'charitable' },
  ],
  contractors1099: [],
  taxCalendar: [],
  recurringObligations: [
    { id: 'ro-rent',      name: 'Rent',                       amount: 1800, frequency: 'monthly', nextDue: '2026-06-01', entityId: 'e-family', category: 'household',  enabled: true },
    { id: 'ro-utilities', name: 'Electric + gas',             amount: 220,  frequency: 'monthly', nextDue: '2026-06-08', entityId: 'e-family', category: 'utilities',  enabled: true },
    { id: 'ro-internet',  name: 'Internet',                   amount: 89,   frequency: 'monthly', nextDue: '2026-06-10', entityId: 'e-family', category: 'utilities',  enabled: true },
    { id: 'ro-phone',     name: 'Phone',                      amount: 65,   frequency: 'monthly', nextDue: '2026-06-25', entityId: 'e-family', category: 'utilities',  enabled: true },
    { id: 'ro-insurance', name: 'Auto insurance',             amount: 150,  frequency: 'monthly', nextDue: '2026-06-06', entityId: 'e-family', category: 'insurance',  enabled: true },
    { id: 'ro-giving',    name: 'Tithe & charitable giving',  amount: 200,  frequency: 'monthly', nextDue: '2026-06-15', entityId: 'e-family', category: 'charitable', enabled: true },
  ],
  incidents: [],
  scopes: [],
  events: [],
  projects: [],
  subscriptions: [],
  feedback: [],
  welcomeDismissed: false,
  checkoutIntents: [],
  userTier: 'foundation',
  inquiries: [],
  moduleInterest: {},
  inflows: {
    salaries: [
      { id: 'sal-1', who: 'You',    source: 'Primary salary',    expected: 3200, actual: 3200, entityId: 'e-family' },
      { id: 'sal-2', who: 'Spouse', source: 'Part-time income',  expected: 1400, actual: 1400, entityId: 'e-family' },
    ],
    rentals: [],
  },
  outflows: { rentalMortgages: 0, propertyUtilities: 0, household: 1800, debtService: 1500, charitableGiving: 200 },
  debts: [
    { id: 'd-cc-1',  entityId: 'e-family', name: 'Visa',      balance: 420,  rate: 22.99, minPayment: 75,  payoffType: 'snowball' },
    { id: 'd-auto',  entityId: 'e-family', name: 'Auto Loan', balance: 4200, rate: 6.50,  minPayment: 340, payoffType: 'snowball' },
  ],
  opportunities: [],
  capexItems: [],
  watchlist: ['spy.us', 'qqq.us'],
  prayerRequests: [],
  skillProfiles: [],
  // Sanitized 2026-05-28 evening — these top-level fields were leaking
  // through from SEED_DATA because they weren't overridden. The viewer would
  // see the family's real church name + address visible in the dim background
  // behind the welcome modal. Per the SEED-DATA-AS-ASPIRATION foundation,
  // demo data must contain NO real personal information.
  church: {
    name: 'Your home church',
    nickname: '',
    site: '',
    address: '',
    phone: '',
    officeHours: '',
    contactEmail: '',
    services: [],
    media: {},
    links: {},
    tagline: 'Where your family worships and serves',
    verse: { ref: 'Psalm 1:1', text: 'Blessed is the man who walks not in the counsel of the wicked.' },
  },
  voiceOps: {
    apiUrl: '',
    apiToken: '',
    rates: { perCallMinute: 0.0085, perTranscriptMinute: 0.05, perNumberMonthly: 1.15 },
    numbersConfigured: 0,
    budgetAlertMonthly: 30,
  },
  pressureMappings: { ...SEED_DATA.pressureMappings },
};

// -----------------------------------------------------------------------------
// DEMO · SEPARATED CO-PARENTS
// Two households, one shared child. Coordinating expenses + child support
// without conflict, while preserving privacy from each other. The deep
// scenario: "We don't agree on much, but we both love the kid; can this
// system give us a fair shared truth?" Yes. Per-household entities, the
// child's costs roll up across both. Anxiety-clarity: every shared expense
// has an agreed-upon split, a due date, and a paid/unpaid flag.
// -----------------------------------------------------------------------------
const DEMO_DATA_SEPARATED = {
  ...SEED_DATA,
  meta: { ...SEED_DATA.meta, lastUpdated: '2026-05-28', monthOfData: 'May 2026', bufferTarget: 2000, bufferCurrent: 2000, releaseLabel: 'Sample · Separated co-parents' },
  entities: [
    { id: 'e-mom',    name: 'Maya (mom)',         type: 'personal', notes: 'Custodial parent · 60% time',       visibleTo: ['darrell', 'christina', 'family'] },
    { id: 'e-dad',    name: 'Jordan (dad)',       type: 'personal', notes: 'Non-custodial parent · 40% time',   visibleTo: ['darrell', 'christina', 'family'] },
    { id: 'e-shared', name: 'Shared · for Avery', type: 'personal', notes: 'Child expenses split per agreement', visibleTo: ['darrell', 'christina', 'family'] },
  ],
  accounts: [
    { id: 'a-mom-chk',   entityId: 'e-mom',    name: 'Mom · Checking',   institution: 'Chase',  type: 'checking', fragment: '...2201', balance: 3200, isPrimary: true },
    { id: 'a-mom-sav',   entityId: 'e-mom',    name: 'Mom · Savings',    institution: 'Chase',  type: 'savings',  fragment: '...8870', balance: 9200 },
    { id: 'a-dad-chk',   entityId: 'e-dad',    name: 'Dad · Checking',   institution: 'BofA',   type: 'checking', fragment: '...9912', balance: 3200, isPrimary: true },
    { id: 'a-dad-sav',   entityId: 'e-dad',    name: 'Dad · Savings',    institution: 'BofA',   type: 'savings',  fragment: '...9920', balance: 6400 },
    { id: 'a-dad-cc',    entityId: 'e-dad',    name: 'Dad · Credit',     institution: 'Capital One', type: 'credit', fragment: '...4490', balance: -260 },
    { id: 'a-shared',    entityId: 'e-shared', name: 'Shared · Avery',   institution: 'Ally',   type: 'savings',  fragment: '...5031', balance: 1600, notes: 'For agreed split expenses' },
  ],
  transactions: [
    { id: 'st-1',  date: '2026-05-01', accountId: 'a-mom-chk', amount: 2400, description: 'Mom · paycheck',                          category: 'salary' },
    { id: 'st-2',  date: '2026-05-01', accountId: 'a-mom-chk', amount: -1450, description: 'Rent (mom\'s household)',                category: 'household' },
    { id: 'st-3',  date: '2026-05-03', accountId: 'a-shared',  amount: 450, description: 'Child support · dad → shared',             category: 'transfer' },
    { id: 'st-4',  date: '2026-05-04', accountId: 'a-shared',  amount: -185, description: 'Avery soccer fees (split agreement)',     category: 'household' },
    { id: 'st-5',  date: '2026-05-05', accountId: 'a-mom-chk', amount: -135, description: 'Aldi groceries',                          category: 'groceries' },
    { id: 'st-6',  date: '2026-05-06', accountId: 'a-dad-chk', amount: 1900, description: 'Dad · paycheck',                          category: 'salary' },
    { id: 'st-7',  date: '2026-05-06', accountId: 'a-dad-chk', amount: -1100, description: 'Apt rent (dad\'s household)',            category: 'household' },
    { id: 'st-8',  date: '2026-05-08', accountId: 'a-shared',  amount: -240, description: 'Avery doctor · co-pay (split 50/50)',     category: 'medical' },
    { id: 'st-9',  date: '2026-05-10', accountId: 'a-dad-cc',  amount: -45, description: 'Dad · gas',                                category: 'fuel' },
    { id: 'st-10', date: '2026-05-12', accountId: 'a-mom-chk', amount: -210, description: 'Utilities (mom)',                         category: 'utilities' },
    { id: 'st-11', date: '2026-05-15', accountId: 'a-mom-chk', amount: 2400, description: 'Mom · paycheck',                          category: 'salary' },
    { id: 'st-12', date: '2026-05-15', accountId: 'a-shared',  amount: -120, description: 'Avery school clothes (split)',            category: 'household' },
    { id: 'st-13', date: '2026-05-18', accountId: 'a-dad-chk', amount: -150, description: 'Dad · auto insurance',                    category: 'insurance' },
    { id: 'st-14', date: '2026-05-20', accountId: 'a-dad-chk', amount: 1900, description: 'Dad · paycheck',                          category: 'salary' },
    { id: 'st-15', date: '2026-05-22', accountId: 'a-shared',  amount: 200, description: 'Dad → shared · extra agreed contribution', category: 'transfer' },
    { id: 'st-16', date: '2026-05-25', accountId: 'a-mom-chk', amount: -190, description: 'Aldi groceries',                          category: 'groceries' },
    { id: 'st-19', date: '2026-05-14', accountId: 'a-mom-chk', amount: -240, description: 'Tithe · home church (mom)',               category: 'charitable' },
    { id: 'st-20', date: '2026-05-13', accountId: 'a-dad-chk', amount: -190, description: 'Tithe · home church (dad)',               category: 'charitable' },
    { id: 'st-17', date: '2026-06-01', accountId: 'a-shared',  amount: 450, description: 'Child support · dad → shared (upcoming)',  category: 'transfer' },
    { id: 'st-18', date: '2026-06-04', accountId: 'a-shared',  amount: -300, description: 'Avery summer camp deposit',               category: 'household' },
  ],
  contractors1099: [], taxCalendar: [], scopes: [], events: [], projects: [], subscriptions: [], feedback: [], checkoutIntents: [], inquiries: [], opportunities: [], capexItems: [], prayerRequests: [], skillProfiles: [],
  recurringObligations: [
    { id: 'ro-mom-rent',     name: 'Rent (mom)',                   amount: 1450, frequency: 'monthly', nextDue: '2026-06-01', entityId: 'e-mom',    category: 'household',  enabled: true },
    { id: 'ro-dad-rent',     name: 'Apt rent (dad)',               amount: 1100, frequency: 'monthly', nextDue: '2026-06-06', entityId: 'e-dad',    category: 'household',  enabled: true },
    { id: 'ro-child-support',name: 'Child support · dad → shared', amount: 450,  frequency: 'monthly', nextDue: '2026-06-01', entityId: 'e-shared', category: 'transfer',   enabled: true },
    { id: 'ro-avery-care',   name: 'Avery · childcare + activities', amount: 380, frequency: 'monthly', nextDue: '2026-06-10', entityId: 'e-shared', category: 'household',  enabled: true },
  ],
  incidents: [],
  welcomeDismissed: false,
  userTier: 'foundation',
  moduleInterest: {},
  inflows: {
    salaries: [
      { id: 'sal-mom', who: 'Maya',   source: 'Primary salary',  expected: 2400, actual: 2400, entityId: 'e-mom' },
      { id: 'sal-dad', who: 'Jordan', source: 'Primary salary',  expected: 1900, actual: 1900, entityId: 'e-dad' },
    ],
    rentals: [],
  },
  outflows: { rentalMortgages: 0, propertyUtilities: 0, household: 2550, debtService: 40, charitableGiving: 430 },
  debts: [
    { id: 'd-dad-cc', entityId: 'e-dad', name: 'Capital One', balance: 260, rate: 21.99, minPayment: 40, payoffType: 'snowball' },
  ],
  watchlist: ['spy.us'],
  church: { name: 'Your home church', nickname: '', site: '', address: '', phone: '', officeHours: '', contactEmail: '', services: [], media: {}, links: {}, tagline: 'Where your family worships and serves', verse: { ref: 'Psalm 1:1', text: 'Blessed is the man who walks not in the counsel of the wicked.' } },
  voiceOps: { apiUrl: '', apiToken: '', rates: { perCallMinute: 0.0085, perTranscriptMinute: 0.05, perNumberMonthly: 1.15 }, numbersConfigured: 0, budgetAlertMonthly: 30 },
  pressureMappings: { ...SEED_DATA.pressureMappings },
};

// -----------------------------------------------------------------------------
// DEMO · SOLO PROFESSIONAL
// Therapist / lawyer / consultant working alone. Personal income mixed with
// business revenue, but kept clearly separate. The audience: "I run my own
// practice. Can this system show me both sides without me drowning in
// QuickBooks?" Personal household + one professional business entity. The
// business has a 1099 contractor income flow (representative of a junior
// associate, a clinical supervisee, a paralegal), recurring CEU/license fees,
// and clean monthly distributions to the personal household.
// -----------------------------------------------------------------------------
const DEMO_DATA_PROFESSIONAL = {
  ...SEED_DATA,
  meta: { ...SEED_DATA.meta, lastUpdated: '2026-05-28', monthOfData: 'May 2026', bufferTarget: 5000, bufferCurrent: 5000, releaseLabel: 'Sample · Solo professional' },
  entities: [
    { id: 'e-pers',     name: 'Sam (personal)',     type: 'personal', notes: 'Solo household',                           visibleTo: ['darrell', 'christina', 'family'] },
    { id: 'e-practice', name: 'Sam · Practice LLC', type: 'business', notes: 'Therapist / lawyer / consultant practice', visibleTo: ['darrell', 'christina'] },
  ],
  accounts: [
    { id: 'a-pers-chk',  entityId: 'e-pers',     name: 'Personal Checking',  institution: 'Chase',         type: 'checking', fragment: '...7711', balance: 6200, isPrimary: true },
    { id: 'a-pers-sav',  entityId: 'e-pers',     name: 'Personal Savings',   institution: 'Chase',         type: 'savings',  fragment: '...3320', balance: 24000 },
    { id: 'a-pract-op',  entityId: 'e-practice', name: 'Practice Operating', institution: 'Local CU',      type: 'checking', fragment: '...4490', balance: 14500, isPrimary: true },
    { id: 'a-pract-tax', entityId: 'e-practice', name: 'Practice · Tax Set-aside', institution: 'Local CU', type: 'savings', fragment: '...4495', balance: 13600 },
    { id: 'a-pers-cc',   entityId: 'e-pers',     name: 'Personal Visa',      institution: 'Capital One',   type: 'credit',   fragment: '...8821', balance: -300 },
  ],
  transactions: [
    { id: 'pt-1',  date: '2026-05-01', accountId: 'a-pract-op',  amount: 4200, description: 'Client retainer · Smith family',           category: 'business' },
    { id: 'pt-2',  date: '2026-05-02', accountId: 'a-pract-op',  amount: -2200, description: 'Contractor pay · junior associate',       category: 'professional' },
    { id: 'pt-3',  date: '2026-05-03', accountId: 'a-pract-op',  amount: -185, description: 'Office rent · suite share',                category: 'professional' },
    { id: 'pt-4',  date: '2026-05-05', accountId: 'a-pract-op',  amount: -120, description: 'Malpractice insurance',                    category: 'insurance' },
    { id: 'pt-5',  date: '2026-05-06', accountId: 'a-pract-tax', amount: 1400, description: 'Quarterly tax set-aside',                  category: 'transfer' },
    { id: 'pt-6',  date: '2026-05-08', accountId: 'a-pract-op',  amount: 3800, description: 'Client retainer · Lopez',                  category: 'business' },
    { id: 'pt-7',  date: '2026-05-10', accountId: 'a-pract-op',  amount: -3500, description: 'Owner draw → personal checking',          category: 'transfer' },
    { id: 'pt-8',  date: '2026-05-10', accountId: 'a-pers-chk',  amount: 3500, description: 'Owner draw from practice',                 category: 'salary' },
    { id: 'pt-9',  date: '2026-05-12', accountId: 'a-pers-chk',  amount: -1650, description: 'Rent (personal)',                         category: 'household' },
    { id: 'pt-10', date: '2026-05-13', accountId: 'a-pers-chk',  amount: -190, description: 'Whole Foods groceries',                   category: 'groceries' },
    { id: 'pt-11', date: '2026-05-15', accountId: 'a-pers-cc',   amount: -55, description: 'Gas + coffee',                              category: 'fuel' },
    { id: 'pt-12', date: '2026-05-16', accountId: 'a-pract-op',  amount: 2400, description: 'Client retainer · Beth M.',                category: 'business' },
    { id: 'pt-13', date: '2026-05-18', accountId: 'a-pract-op',  amount: -240, description: 'CEU course · annual',                      category: 'professional' },
    { id: 'pt-14', date: '2026-05-20', accountId: 'a-pers-chk',  amount: -400, description: 'Visa payment',                             category: 'debt-payment' },
    { id: 'pt-15', date: '2026-05-22', accountId: 'a-pract-op',  amount: -350, description: 'Software · practice management',          category: 'subscription' },
    { id: 'pt-16', date: '2026-05-25', accountId: 'a-pers-chk',  amount: -200, description: 'Tithe · home church',                      category: 'charitable' },
    { id: 'pt-17', date: '2026-05-28', accountId: 'a-pers-sav',  amount: 600, description: 'Personal savings · monthly',                category: 'transfer' },
    { id: 'pt-18', date: '2026-06-01', accountId: 'a-pract-op',  amount: 4200, description: 'Client retainer · Smith family (upcoming)', category: 'business' },
    { id: 'pt-19', date: '2026-06-02', accountId: 'a-pract-op',  amount: -2200, description: 'Contractor pay (upcoming)',               category: 'professional' },
  ],
  contractors1099: [
    { id: 'pk1', direction: 'outbound', entityId: 'e-practice', name: 'Jordan (junior associate)', role: 'Contracted hours @ 25/hr', ytdPaid: 11000, monthly: 2200, status: 'active' },
  ],
  taxCalendar: [
    { id: 'tx-q2', month: 6, day: 15, name: 'Q2 estimated tax', desc: 'Self-employment quarterly estimated tax', entityIds: ['e-practice'], applies: true },
  ],
  scopes: [], events: [], projects: [], subscriptions: [], feedback: [], checkoutIntents: [], inquiries: [], opportunities: [], capexItems: [], prayerRequests: [], skillProfiles: [],
  recurringObligations: [
    { id: 'ro-office',     name: 'Office suite share',     amount: 185,  frequency: 'monthly', nextDue: '2026-06-03', entityId: 'e-practice', category: 'professional', enabled: true },
    { id: 'ro-malpractice',name: 'Malpractice insurance',  amount: 120,  frequency: 'monthly', nextDue: '2026-06-05', entityId: 'e-practice', category: 'insurance',    enabled: true },
    { id: 'ro-software',   name: 'Practice mgmt software', amount: 350,  frequency: 'monthly', nextDue: '2026-06-22', entityId: 'e-practice', category: 'subscription', enabled: true },
    { id: 'ro-rent',       name: 'Rent (personal)',        amount: 1650, frequency: 'monthly', nextDue: '2026-06-12', entityId: 'e-pers',     category: 'household',    enabled: true },
    { id: 'ro-ceu',        name: 'CEUs · annual budget',   amount: 1200, frequency: 'annual',  nextDue: '2026-11-01', entityId: 'e-practice', category: 'professional', enabled: true },
    { id: 'ro-license',    name: 'License renewal',        amount: 350,  frequency: 'biennial',nextDue: '2027-08-15', entityId: 'e-practice', category: 'professional', enabled: true },
  ],
  incidents: [],
  welcomeDismissed: false,
  userTier: 'foundation',
  moduleInterest: {},
  inflows: {
    salaries: [
      { id: 'sal-pers', who: 'Sam',      source: 'Owner draw (from practice)', expected: 3500, actual: 3500, entityId: 'e-pers' },
      { id: 'sal-prac', who: 'Practice', source: 'Client retainers',           expected: 10000, actual: 10400, entityId: 'e-practice' },
    ],
    rentals: [],
  },
  outflows: { rentalMortgages: 0, propertyUtilities: 0, household: 1650, debtService: 400, charitableGiving: 200 },
  debts: [
    { id: 'd-pers-cc', entityId: 'e-pers', name: 'Visa', balance: 300, rate: 19.99, minPayment: 60, payoffType: 'snowball' },
  ],
  watchlist: ['spy.us', 'vt.us'],
  church: { name: 'Your home church', nickname: '', site: '', address: '', phone: '', officeHours: '', contactEmail: '', services: [], media: {}, links: {}, tagline: 'Where your family worships and serves', verse: { ref: 'Psalm 1:1', text: 'Blessed is the man who walks not in the counsel of the wicked.' } },
  voiceOps: { apiUrl: '', apiToken: '', rates: { perCallMinute: 0.0085, perTranscriptMinute: 0.05, perNumberMonthly: 1.15 }, numbersConfigured: 0, budgetAlertMonthly: 30 },
  pressureMappings: { ...SEED_DATA.pressureMappings },
};

// -----------------------------------------------------------------------------
// DEMO · LANDLORD (3 doors)
// Small landlord with 3 rental units + a personal household. The deep
// scenario: "I want to know per-property cash flow without spreadsheets, and
// I want to see when a tenant goes late without finding out from a missed
// deposit." Per-property accounts are stubbed; rental income lives in
// inflows.rentals with a status field so the late one shows up red.
// -----------------------------------------------------------------------------
const DEMO_DATA_LANDLORD = {
  ...SEED_DATA,
  meta: { ...SEED_DATA.meta, lastUpdated: '2026-05-28', monthOfData: 'May 2026', bufferTarget: 4000, bufferCurrent: 4000, releaseLabel: 'Sample · Landlord (3 doors)' },
  entities: [
    { id: 'e-pers',  name: 'The Reynolds household', type: 'personal', notes: 'Joint household',  visibleTo: ['darrell', 'christina', 'family'] },
    { id: 'e-props', name: 'Reynolds Properties LLC', type: 'business', notes: '3 rental doors', visibleTo: ['darrell'] },
  ],
  accounts: [
    { id: 'a-pers-chk',  entityId: 'e-pers',  name: 'Personal Checking',     institution: 'Chase',   type: 'checking', fragment: '...4421', balance: 5200, isPrimary: true },
    { id: 'a-pers-sav',  entityId: 'e-pers',  name: 'Personal Savings',      institution: 'Chase',   type: 'savings',  fragment: '...9990', balance: 14000 },
    { id: 'a-props-op',  entityId: 'e-props', name: 'Properties Operating',  institution: 'Local CU', type: 'checking', fragment: '...3318', balance: 12800, isPrimary: true },
    { id: 'a-props-res', entityId: 'e-props', name: 'Properties · Capex Reserve', institution: 'Local CU', type: 'savings', fragment: '...3320', balance: 22000 },
    { id: 'a-pers-cc',   entityId: 'e-pers',  name: 'Visa',                  institution: 'Capital One', type: 'credit', fragment: '...7711', balance: -300 },
  ],
  transactions: [
    { id: 'lt-1',  date: '2026-05-01', accountId: 'a-props-op', amount: 1200, description: 'Rent · Unit A (Hill St)',         category: 'rental-income' },
    { id: 'lt-2',  date: '2026-05-01', accountId: 'a-props-op', amount: 1050, description: 'Rent · Unit B (Park Ave)',        category: 'rental-income' },
    { id: 'lt-3',  date: '2026-05-02', accountId: 'a-props-op', amount: -680, description: 'Mortgage · Hill St',              category: 'debt-payment' },
    { id: 'lt-4',  date: '2026-05-02', accountId: 'a-props-op', amount: -540, description: 'Mortgage · Park Ave',             category: 'debt-payment' },
    { id: 'lt-5',  date: '2026-05-05', accountId: 'a-props-op', amount: -185, description: 'Plumber · Unit B sink leak',      category: 'household' },
    { id: 'lt-6',  date: '2026-05-06', accountId: 'a-pers-chk', amount: 2900, description: 'Day-job paycheck',                category: 'salary' },
    { id: 'lt-7',  date: '2026-05-07', accountId: 'a-props-op', amount: -120, description: 'Property insurance · Hill St',    category: 'insurance' },
    { id: 'lt-8',  date: '2026-05-10', accountId: 'a-pers-chk', amount: -1700, description: 'Personal mortgage',              category: 'household' },
    { id: 'lt-9',  date: '2026-05-12', accountId: 'a-pers-chk', amount: -210, description: 'Aldi groceries',                  category: 'groceries' },
    { id: 'lt-10', date: '2026-05-15', accountId: 'a-pers-chk', amount: 2900, description: 'Day-job paycheck',                category: 'salary' },
    { id: 'lt-11', date: '2026-05-15', accountId: 'a-pers-chk', amount: -250, description: 'Tithe',                           category: 'charitable' },
    { id: 'lt-12', date: '2026-05-16', accountId: 'a-props-op', amount: -380, description: 'Property mgmt software annual',   category: 'subscription' },
    { id: 'lt-13', date: '2026-05-18', accountId: 'a-props-op', amount: -560, description: 'Mortgage · Cedar (3rd unit)',     category: 'debt-payment' },
    { id: 'lt-14', date: '2026-05-22', accountId: 'a-props-op', amount: -55, description: 'Tenant background check',          category: 'professional' },
    { id: 'lt-15', date: '2026-05-25', accountId: 'a-props-res', amount: 500, description: 'Capex reserve monthly contribution', category: 'transfer' },
    { id: 'lt-16', date: '2026-06-01', accountId: 'a-props-op', amount: 1200, description: 'Rent · Unit A (upcoming)',        category: 'rental-income' },
    { id: 'lt-17', date: '2026-06-01', accountId: 'a-props-op', amount: 1050, description: 'Rent · Unit B (upcoming)',        category: 'rental-income' },
    { id: 'lt-18', date: '2026-06-01', accountId: 'a-props-op', amount: 0,    description: 'Rent · Unit C (Cedar) — UNPAID',  category: 'rental-income' },
  ],
  contractors1099: [], taxCalendar: [], scopes: [], events: [], projects: [], subscriptions: [], feedback: [], checkoutIntents: [], inquiries: [], opportunities: [], capexItems: [], prayerRequests: [], skillProfiles: [],
  recurringObligations: [
    { id: 'ro-mort-1', name: 'Mortgage · Hill St',    amount: 680,  frequency: 'monthly', nextDue: '2026-06-02', entityId: 'e-props', category: 'debt-payment', enabled: true },
    { id: 'ro-mort-2', name: 'Mortgage · Park Ave',   amount: 540,  frequency: 'monthly', nextDue: '2026-06-02', entityId: 'e-props', category: 'debt-payment', enabled: true },
    { id: 'ro-mort-3', name: 'Mortgage · Cedar',      amount: 560,  frequency: 'monthly', nextDue: '2026-06-18', entityId: 'e-props', category: 'debt-payment', enabled: true },
    { id: 'ro-mort-h', name: 'Personal mortgage',     amount: 1700, frequency: 'monthly', nextDue: '2026-06-10', entityId: 'e-pers',  category: 'household',    enabled: true },
    { id: 'ro-ins',    name: 'Property insurance',    amount: 240,  frequency: 'monthly', nextDue: '2026-06-07', entityId: 'e-props', category: 'insurance',    enabled: true },
  ],
  incidents: [
    { id: 'lin-late', date: '2026-06-01', amount: 950, category: 'tenant', entityId: 'e-props', description: 'Unit C (Cedar) tenant has not paid June rent', urgency: 'incident', status: 'open', dueDate: '2026-06-05' },
  ],
  welcomeDismissed: false,
  userTier: 'foundation',
  moduleInterest: {},
  inflows: {
    salaries: [
      { id: 'sal-day', who: 'Owner', source: 'Day-job salary', expected: 5800, actual: 5800, entityId: 'e-pers' },
    ],
    rentals: [
      { id: 'rl-a', name: 'Unit A · Hill St',   address: '210 Hill St',   city: 'Cedar Heights', state: 'IL', tenantName: '', rent: 1200, actual: 1200, status: 'paying', entityId: 'e-props', mortgage: { balance: 95000, rate: 6.5, monthlyPI: 680, escrow: 175, estimated: true } },
      { id: 'rl-b', name: 'Unit B · Park Ave',  address: '88 Park Ave',   city: 'Cedar Heights', state: 'IL', tenantName: '', rent: 1050, actual: 1050, status: 'paying', entityId: 'e-props', mortgage: { balance: 70000, rate: 6.5, monthlyPI: 540, escrow: 140, estimated: true } },
      { id: 'rl-c', name: 'Unit C · Cedar',     address: '1402 Cedar',    city: 'Cedar Heights', state: 'IL', tenantName: '', rent: 950,  actual: 0,    status: 'late',   entityId: 'e-props', mortgage: { balance: 80000, rate: 6.5, monthlyPI: 560, escrow: 150, estimated: true } },
    ],
  },
  outflows: { rentalMortgages: 1780, propertyUtilities: 200, household: 1700, debtService: 1780, charitableGiving: 250 },
  debts: [
    { id: 'd-cc-r', entityId: 'e-pers', name: 'Visa', balance: 300, rate: 21.99, minPayment: 65, payoffType: 'snowball' },
  ],
  watchlist: ['spy.us', 'iyr.us'],
  church: { name: 'Your home church', nickname: '', site: '', address: '', phone: '', officeHours: '', contactEmail: '', services: [], media: {}, links: {}, tagline: 'Where your family worships and serves', verse: { ref: 'Psalm 1:1', text: 'Blessed is the man who walks not in the counsel of the wicked.' } },
  voiceOps: { apiUrl: '', apiToken: '', rates: { perCallMinute: 0.0085, perTranscriptMinute: 0.05, perNumberMonthly: 1.15 }, numbersConfigured: 0, budgetAlertMonthly: 30 },
  pressureMappings: { ...SEED_DATA.pressureMappings },
};

// =============================================================================
// FAMILY-UNIT SAMPLE SET (added 2026-07-06, per Darrell: "various versions of
// seed data depending on their type of family units and a picker... give a
// better picture of a THRIVING family operation because they use the PoeTech
// App"). Each of these is the SAME framework with a different family shape, and
// every one models the aspirational picture the SEED-DATA-AS-ASPIRATION
// foundation requires: steady income, a fully-funded buffer, debt visibly being
// chipped down toward zero, consistent tithe, growing savings. None is fantasy-
// rich — they are real, reachable stewardship pictures that make a visitor want
// to get there. Balances are made intentional (not painted, DR-0076): each cash
// account carries an `openingBalance` set so `opening + settled ledger = the
// displayed "now"`, the exact discipline SEED_DATA uses. The demo anchor date is
// 2026-05-15, so transactions on/before it are settled and June rows are the
// upcoming forecast. The `demo-personas-thriving` test is the proven-to-catch
// gate that fails if any of these ever reads "broke."
// -----------------------------------------------------------------------------

// DEMO · SINGLE (starting out) — one income, disciplined, building. Emergency
// fund funded, Roth started, the only debt a student loan being crushed.
const DEMO_DATA_FAMILY_OF_1 = {
  ...SEED_DATA,
  meta: { ...SEED_DATA.meta, lastUpdated: '2026-05-28', monthOfData: 'May 2026', bufferTarget: 3000, bufferCurrent: 3000, releaseLabel: 'Sample · Single (starting out)' },
  entities: [
    { id: 'e-solo', name: 'Riley (single)', type: 'personal', notes: 'One income, one household', visibleTo: ['darrell', 'christina', 'family'] },
  ],
  accounts: [
    { id: 'a-solo-chk',  entityId: 'e-solo', name: 'Checking',       institution: 'Ally',        type: 'checking',   fragment: '...5012', balance: 3400, openingBalance: 2075, isPrimary: true },
    { id: 'a-solo-em',   entityId: 'e-solo', name: 'Emergency Fund', institution: 'Ally',        type: 'savings',    fragment: '...5019', balance: 9600, openingBalance: 9200 },
    { id: 'a-solo-roth', entityId: 'e-solo', name: 'Roth IRA',       institution: 'Fidelity',    type: 'investment', fragment: '...7744', balance: 7200, openingBalance: 6900 },
    { id: 'a-solo-cc',   entityId: 'e-solo', name: 'Cash-back Card', institution: 'Capital One', type: 'credit',     fragment: '...3390', balance: -180, openingBalance: -75 },
  ],
  transactions: [
    { id: 'f1t-1',  date: '2026-05-01', accountId: 'a-solo-chk',  amount: 2050,  description: 'Paycheck',                  category: 'salary' },
    { id: 'f1t-2',  date: '2026-05-01', accountId: 'a-solo-chk',  amount: -1200, description: 'Rent',                      category: 'household' },
    { id: 'f1t-3',  date: '2026-05-04', accountId: 'a-solo-chk',  amount: -120,  description: 'Aldi · groceries',         category: 'groceries' },
    { id: 'f1t-4',  date: '2026-05-05', accountId: 'a-solo-cc',   amount: -60,   description: 'Gas',                       category: 'fuel' },
    { id: 'f1t-5',  date: '2026-05-06', accountId: 'a-solo-chk',  amount: -95,   description: 'Utilities',                category: 'utilities' },
    { id: 'f1t-6',  date: '2026-05-08', accountId: 'a-solo-chk',  amount: -400,  description: '→ Emergency Fund',     category: 'transfer' },
    { id: 'f1t-7',  date: '2026-05-08', accountId: 'a-solo-em',   amount: 400,   description: 'Emergency fund · monthly', category: 'transfer' },
    { id: 'f1t-8',  date: '2026-05-10', accountId: 'a-solo-chk',  amount: -250,  description: 'Student loan payment',     category: 'debt-payment' },
    { id: 'f1t-9',  date: '2026-05-11', accountId: 'a-solo-cc',   amount: -45,   description: 'Dinner out',               category: 'dining' },
    { id: 'f1t-10', date: '2026-05-12', accountId: 'a-solo-chk',  amount: -300,  description: '→ Roth IRA',          category: 'transfer' },
    { id: 'f1t-11', date: '2026-05-12', accountId: 'a-solo-roth', amount: 300,   description: 'Roth IRA · monthly',       category: 'transfer' },
    { id: 'f1t-12', date: '2026-05-14', accountId: 'a-solo-chk',  amount: -410,  description: 'Tithe · home church',      category: 'charitable' },
    { id: 'f1t-13', date: '2026-05-15', accountId: 'a-solo-chk',  amount: 2050,  description: 'Paycheck',                  category: 'salary' },
    { id: 'f1t-14', date: '2026-06-01', accountId: 'a-solo-chk',  amount: 2050,  description: 'Paycheck (upcoming)',      category: 'salary' },
    { id: 'f1t-15', date: '2026-06-01', accountId: 'a-solo-chk',  amount: -1200, description: 'Rent (upcoming)',          category: 'household' },
  ],
  contractors1099: [], taxCalendar: [], scopes: [], events: [], projects: [], subscriptions: [], feedback: [], checkoutIntents: [], inquiries: [], opportunities: [], capexItems: [], prayerRequests: [], skillProfiles: [],
  recurringObligations: [
    { id: 'f1-ro-rent',  name: 'Rent',         amount: 1200, frequency: 'monthly', nextDue: '2026-06-01', entityId: 'e-solo', category: 'household',     enabled: true },
    { id: 'f1-ro-util',  name: 'Utilities',    amount: 95,   frequency: 'monthly', nextDue: '2026-06-06', entityId: 'e-solo', category: 'utilities',     enabled: true },
    { id: 'f1-ro-loan',  name: 'Student loan', amount: 250,  frequency: 'monthly', nextDue: '2026-06-10', entityId: 'e-solo', category: 'debt-payment',  enabled: true },
    { id: 'f1-ro-tithe', name: 'Tithe',        amount: 410,  frequency: 'monthly', nextDue: '2026-06-14', entityId: 'e-solo', category: 'charitable',    enabled: true },
  ],
  incidents: [], welcomeDismissed: false, userTier: 'foundation', moduleInterest: {},
  inflows: {
    salaries: [{ id: 'f1-sal', who: 'Riley', source: 'Salary', expected: 4100, actual: 4100, entityId: 'e-solo' }],
    rentals: [],
  },
  outflows: { rentalMortgages: 0, propertyUtilities: 0, household: 1200, debtService: 250, charitableGiving: 410 },
  debts: [
    { id: 'f1-d-loan', entityId: 'e-solo', name: 'Student Loan', balance: 2400, rate: 4.5, minPayment: 250, payoffType: 'snowball' },
  ],
  watchlist: ['spy.us', 'vti.us'],
  church: { name: 'Your home church', nickname: '', site: '', address: '', phone: '', officeHours: '', contactEmail: '', services: [], media: {}, links: {}, tagline: 'Where your family worships and serves', verse: { ref: 'Psalm 1:1', text: 'Blessed is the man who walks not in the counsel of the wicked.' } },
  voiceOps: { apiUrl: '', apiToken: '', rates: { perCallMinute: 0.0085, perTranscriptMinute: 0.05, perNumberMonthly: 1.15 }, numbersConfigured: 0, budgetAlertMonthly: 30 },
  pressureMappings: { ...SEED_DATA.pressureMappings },
};

// DEMO · COUPLE (no kids yet) — two incomes pulling one direction. House down-
// payment fund growing, emergency fund funded, one car loan shrinking.
const DEMO_DATA_FAMILY_OF_2 = {
  ...SEED_DATA,
  meta: { ...SEED_DATA.meta, lastUpdated: '2026-05-28', monthOfData: 'May 2026', bufferTarget: 5000, bufferCurrent: 5000, releaseLabel: 'Sample · Couple (no kids yet)' },
  entities: [
    { id: 'e-couple', name: 'The Bennett household', type: 'personal', notes: 'Two incomes, shared goals', visibleTo: ['darrell', 'christina', 'family'] },
  ],
  accounts: [
    { id: 'a-cpl-chk',  entityId: 'e-couple', name: 'Joint Checking',     institution: 'Chase',   type: 'checking', fragment: '...6120', balance: 7200,  openingBalance: 3920,  isPrimary: true },
    { id: 'a-cpl-sav',  entityId: 'e-couple', name: 'House Down-payment',  institution: 'Chase',   type: 'savings',  fragment: '...6127', balance: 21000, openingBalance: 20200 },
    { id: 'a-cpl-em',   entityId: 'e-couple', name: 'Emergency Fund',      institution: 'Ally',    type: 'savings',  fragment: '...4408', balance: 12000, openingBalance: 11500 },
    { id: 'a-cpl-cc',   entityId: 'e-couple', name: 'Rewards Card',        institution: 'Amex',    type: 'credit',   fragment: '...2031', balance: -520,  openingBalance: -395 },
    { id: 'a-cpl-auto', entityId: 'e-couple', name: 'Auto Loan',           institution: 'Credit Union', type: 'loan', fragment: '...9910', balance: -6800, openingBalance: -7200 },
  ],
  transactions: [
    { id: 'f2t-1',  date: '2026-05-01', accountId: 'a-cpl-chk',  amount: 4300,  description: 'Partner A · paycheck',    category: 'salary' },
    { id: 'f2t-2',  date: '2026-05-01', accountId: 'a-cpl-chk',  amount: -1900, description: 'Rent',                    category: 'household' },
    { id: 'f2t-3',  date: '2026-05-03', accountId: 'a-cpl-chk',  amount: 3900,  description: 'Partner B · paycheck',    category: 'salary' },
    { id: 'f2t-4',  date: '2026-05-05', accountId: 'a-cpl-chk',  amount: -260,  description: 'Groceries',              category: 'groceries' },
    { id: 'f2t-5',  date: '2026-05-06', accountId: 'a-cpl-cc',   amount: -70,   description: 'Gas',                     category: 'fuel' },
    { id: 'f2t-6',  date: '2026-05-07', accountId: 'a-cpl-chk',  amount: -240,  description: 'Utilities',              category: 'utilities' },
    { id: 'f2t-7',  date: '2026-05-09', accountId: 'a-cpl-chk',  amount: -800,  description: '→ House fund',       category: 'transfer' },
    { id: 'f2t-8',  date: '2026-05-09', accountId: 'a-cpl-sav',  amount: 800,   description: 'House down-payment · monthly', category: 'transfer' },
    { id: 'f2t-9',  date: '2026-05-10', accountId: 'a-cpl-chk',  amount: -400,  description: 'Auto loan payment',      category: 'debt-payment' },
    { id: 'f2t-10', date: '2026-05-10', accountId: 'a-cpl-auto', amount: 400,   description: 'Auto loan · principal',  category: 'debt-payment' },
    { id: 'f2t-11', date: '2026-05-11', accountId: 'a-cpl-cc',   amount: -55,   description: 'Date night',             category: 'dining' },
    { id: 'f2t-12', date: '2026-05-12', accountId: 'a-cpl-chk',  amount: -500,  description: '→ Emergency Fund',   category: 'transfer' },
    { id: 'f2t-13', date: '2026-05-12', accountId: 'a-cpl-em',   amount: 500,   description: 'Emergency fund · monthly', category: 'transfer' },
    { id: 'f2t-14', date: '2026-05-14', accountId: 'a-cpl-chk',  amount: -820,  description: 'Tithe · home church',    category: 'charitable' },
    { id: 'f2t-15', date: '2026-06-01', accountId: 'a-cpl-chk',  amount: 4300,  description: 'Partner A · paycheck (upcoming)', category: 'salary' },
    { id: 'f2t-16', date: '2026-06-03', accountId: 'a-cpl-chk',  amount: 3900,  description: 'Partner B · paycheck (upcoming)', category: 'salary' },
  ],
  contractors1099: [], taxCalendar: [], scopes: [], events: [], projects: [], subscriptions: [], feedback: [], checkoutIntents: [], inquiries: [], opportunities: [], capexItems: [], prayerRequests: [], skillProfiles: [],
  recurringObligations: [
    { id: 'f2-ro-rent',  name: 'Rent',           amount: 1900, frequency: 'monthly', nextDue: '2026-06-01', entityId: 'e-couple', category: 'household',    enabled: true },
    { id: 'f2-ro-util',  name: 'Utilities',      amount: 240,  frequency: 'monthly', nextDue: '2026-06-07', entityId: 'e-couple', category: 'utilities',    enabled: true },
    { id: 'f2-ro-auto',  name: 'Auto loan',      amount: 400,  frequency: 'monthly', nextDue: '2026-06-10', entityId: 'e-couple', category: 'debt-payment', enabled: true },
    { id: 'f2-ro-tithe', name: 'Tithe',          amount: 820,  frequency: 'monthly', nextDue: '2026-06-14', entityId: 'e-couple', category: 'charitable',   enabled: true },
  ],
  incidents: [], welcomeDismissed: false, userTier: 'foundation', moduleInterest: {},
  inflows: {
    salaries: [
      { id: 'f2-sal-a', who: 'Partner A', source: 'Salary', expected: 4300, actual: 4300, entityId: 'e-couple' },
      { id: 'f2-sal-b', who: 'Partner B', source: 'Salary', expected: 3900, actual: 3900, entityId: 'e-couple' },
    ],
    rentals: [],
  },
  outflows: { rentalMortgages: 0, propertyUtilities: 0, household: 1900, debtService: 445, charitableGiving: 820 },
  debts: [
    { id: 'f2-d-auto', entityId: 'e-couple', name: 'Auto Loan', balance: 6800, rate: 5.9,   minPayment: 400, payoffType: 'snowball' },
    { id: 'f2-d-cc',   entityId: 'e-couple', name: 'Rewards Card', balance: 520, rate: 20.99, minPayment: 45, payoffType: 'snowball' },
  ],
  watchlist: ['spy.us', 'qqq.us'],
  church: { name: 'Your home church', nickname: '', site: '', address: '', phone: '', officeHours: '', contactEmail: '', services: [], media: {}, links: {}, tagline: 'Where your family worships and serves', verse: { ref: 'Psalm 1:1', text: 'Blessed is the man who walks not in the counsel of the wicked.' } },
  voiceOps: { apiUrl: '', apiToken: '', rates: { perCallMinute: 0.0085, perTranscriptMinute: 0.05, perNumberMonthly: 1.15 }, numbersConfigured: 0, budgetAlertMonthly: 30 },
  pressureMappings: { ...SEED_DATA.pressureMappings },
};

// DEMO · NEW PARENTS (family of 3) — first child, childcare added, still
// disciplined. Buffer funded, 529 college fund started, small debts on track.
const DEMO_DATA_FAMILY_OF_3 = {
  ...SEED_DATA,
  meta: { ...SEED_DATA.meta, lastUpdated: '2026-05-28', monthOfData: 'May 2026', bufferTarget: 4000, bufferCurrent: 4000, releaseLabel: 'Sample · New parents (family of 3)' },
  entities: [
    { id: 'e-fam3', name: 'The Okafor family', type: 'personal', notes: 'Two parents, one baby', visibleTo: ['darrell', 'christina', 'family'] },
  ],
  accounts: [
    { id: 'a-f3-chk',  entityId: 'e-fam3', name: 'Main Checking',  institution: 'First National', type: 'checking', fragment: '...3010', balance: 5400,  openingBalance: 2820,  isPrimary: true },
    { id: 'a-f3-sav',  entityId: 'e-fam3', name: 'Family Savings', institution: 'First National', type: 'savings',  fragment: '...3017', balance: 15000, openingBalance: 14600 },
    { id: 'a-f3-529',  entityId: 'e-fam3', name: '529 College Fund', institution: 'Vanguard',     type: 'investment', fragment: '...8820', balance: 3200,  openingBalance: 3050 },
    { id: 'a-f3-cc',   entityId: 'e-fam3', name: 'Visa',           institution: 'Capital One',    type: 'credit',   fragment: '...4415', balance: -380,  openingBalance: -225 },
    { id: 'a-f3-auto', entityId: 'e-fam3', name: 'Auto Loan',      institution: 'Credit Union',   type: 'loan',     fragment: '...7130', balance: -5600, openingBalance: -5950 },
  ],
  transactions: [
    { id: 'f3t-1',  date: '2026-05-01', accountId: 'a-f3-chk',  amount: 4200,  description: 'Parent A · paycheck',   category: 'salary' },
    { id: 'f3t-2',  date: '2026-05-01', accountId: 'a-f3-chk',  amount: -1750, description: 'Mortgage',              category: 'household' },
    { id: 'f3t-3',  date: '2026-05-03', accountId: 'a-f3-chk',  amount: 3100,  description: 'Parent B · paycheck',   category: 'salary' },
    { id: 'f3t-4',  date: '2026-05-04', accountId: 'a-f3-chk',  amount: -900,  description: 'Childcare',            category: 'household' },
    { id: 'f3t-5',  date: '2026-05-05', accountId: 'a-f3-cc',   amount: -60,   description: 'Gas',                  category: 'fuel' },
    { id: 'f3t-6',  date: '2026-05-06', accountId: 'a-f3-chk',  amount: -230,  description: 'Groceries',            category: 'groceries' },
    { id: 'f3t-7',  date: '2026-05-08', accountId: 'a-f3-chk',  amount: -210,  description: 'Utilities',            category: 'utilities' },
    { id: 'f3t-8',  date: '2026-05-09', accountId: 'a-f3-chk',  amount: -400,  description: '→ Family Savings', category: 'transfer' },
    { id: 'f3t-9',  date: '2026-05-09', accountId: 'a-f3-sav',  amount: 400,   description: 'Savings · monthly',    category: 'transfer' },
    { id: 'f3t-10', date: '2026-05-10', accountId: 'a-f3-chk',  amount: -350,  description: 'Auto loan payment',    category: 'debt-payment' },
    { id: 'f3t-11', date: '2026-05-10', accountId: 'a-f3-auto', amount: 350,   description: 'Auto loan · principal', category: 'debt-payment' },
    { id: 'f3t-12', date: '2026-05-11', accountId: 'a-f3-chk',  amount: -150,  description: '→ 529 College Fund', category: 'transfer' },
    { id: 'f3t-13', date: '2026-05-11', accountId: 'a-f3-529',  amount: 150,   description: '529 · monthly',        category: 'transfer' },
    { id: 'f3t-14', date: '2026-05-12', accountId: 'a-f3-cc',   amount: -55,   description: 'Pharmacy',             category: 'medical' },
    { id: 'f3t-15', date: '2026-05-13', accountId: 'a-f3-cc',   amount: -40,   description: 'Baby supplies',        category: 'household' },
    { id: 'f3t-16', date: '2026-05-14', accountId: 'a-f3-chk',  amount: -730,  description: 'Tithe · home church',  category: 'charitable' },
    { id: 'f3t-17', date: '2026-06-01', accountId: 'a-f3-chk',  amount: 4200,  description: 'Parent A · paycheck (upcoming)', category: 'salary' },
    { id: 'f3t-18', date: '2026-06-03', accountId: 'a-f3-chk',  amount: 3100,  description: 'Parent B · paycheck (upcoming)', category: 'salary' },
  ],
  contractors1099: [], taxCalendar: [], scopes: [], events: [], projects: [], subscriptions: [], feedback: [], checkoutIntents: [], inquiries: [], opportunities: [], capexItems: [], prayerRequests: [], skillProfiles: [],
  recurringObligations: [
    { id: 'f3-ro-mort',  name: 'Mortgage',   amount: 1750, frequency: 'monthly', nextDue: '2026-06-01', entityId: 'e-fam3', category: 'household',    enabled: true },
    { id: 'f3-ro-care',  name: 'Childcare',  amount: 900,  frequency: 'monthly', nextDue: '2026-06-04', entityId: 'e-fam3', category: 'household',    enabled: true },
    { id: 'f3-ro-auto',  name: 'Auto loan',  amount: 350,  frequency: 'monthly', nextDue: '2026-06-10', entityId: 'e-fam3', category: 'debt-payment', enabled: true },
    { id: 'f3-ro-tithe', name: 'Tithe',      amount: 730,  frequency: 'monthly', nextDue: '2026-06-14', entityId: 'e-fam3', category: 'charitable',   enabled: true },
  ],
  incidents: [], welcomeDismissed: false, userTier: 'foundation', moduleInterest: {},
  inflows: {
    salaries: [
      { id: 'f3-sal-a', who: 'Parent A', source: 'Salary', expected: 4200, actual: 4200, entityId: 'e-fam3' },
      { id: 'f3-sal-b', who: 'Parent B', source: 'Salary', expected: 3100, actual: 3100, entityId: 'e-fam3' },
    ],
    rentals: [],
  },
  outflows: { rentalMortgages: 0, propertyUtilities: 0, household: 1750, debtService: 390, charitableGiving: 730 },
  debts: [
    { id: 'f3-d-auto', entityId: 'e-fam3', name: 'Auto Loan', balance: 5600, rate: 6.25, minPayment: 350, payoffType: 'snowball' },
    { id: 'f3-d-cc',   entityId: 'e-fam3', name: 'Visa',      balance: 380,  rate: 22.0, minPayment: 40,  payoffType: 'snowball' },
  ],
  watchlist: ['spy.us', 'vti.us'],
  church: { name: 'Your home church', nickname: '', site: '', address: '', phone: '', officeHours: '', contactEmail: '', services: [], media: {}, links: {}, tagline: 'Where your family worships and serves', verse: { ref: 'Psalm 1:1', text: 'Blessed is the man who walks not in the counsel of the wicked.' } },
  voiceOps: { apiUrl: '', apiToken: '', rates: { perCallMinute: 0.0085, perTranscriptMinute: 0.05, perNumberMonthly: 1.15 }, numbersConfigured: 0, budgetAlertMonthly: 30 },
  pressureMappings: { ...SEED_DATA.pressureMappings },
};

// DEMO · FAMILY OF 5 — three kids, busier rhythm, same clarity. Buffer funded,
// 529s growing for three, the minivan loan shrinking, tithe steady.
const DEMO_DATA_FAMILY_OF_5 = {
  ...SEED_DATA,
  meta: { ...SEED_DATA.meta, lastUpdated: '2026-05-28', monthOfData: 'May 2026', bufferTarget: 6000, bufferCurrent: 6000, releaseLabel: 'Sample · Family of 5' },
  entities: [
    { id: 'e-fam5', name: 'The Marsh family', type: 'personal', notes: 'Two parents, three kids', visibleTo: ['darrell', 'christina', 'family'] },
  ],
  accounts: [
    { id: 'a-f5-chk',  entityId: 'e-fam5', name: 'Main Checking',    institution: 'First National', type: 'checking', fragment: '...5010', balance: 6800,  openingBalance: 3760,  isPrimary: true },
    { id: 'a-f5-sav',  entityId: 'e-fam5', name: 'Family Savings',   institution: 'First National', type: 'savings',  fragment: '...5017', balance: 19000, openingBalance: 18400 },
    { id: 'a-f5-529',  entityId: 'e-fam5', name: '529 College Funds', institution: 'Vanguard',      type: 'investment', fragment: '...9930', balance: 9500,  openingBalance: 9200 },
    { id: 'a-f5-cc',   entityId: 'e-fam5', name: 'Visa',             institution: 'Capital One',    type: 'credit',   fragment: '...6612', balance: -640,  openingBalance: -400 },
    { id: 'a-f5-auto', entityId: 'e-fam5', name: 'Minivan Loan',     institution: 'Credit Union',   type: 'loan',     fragment: '...4420', balance: -9200, openingBalance: -9720 },
  ],
  transactions: [
    { id: 'f5t-1',  date: '2026-05-01', accountId: 'a-f5-chk',  amount: 4800,  description: 'Parent A · paycheck',   category: 'salary' },
    { id: 'f5t-2',  date: '2026-05-01', accountId: 'a-f5-chk',  amount: -2100, description: 'Mortgage',              category: 'household' },
    { id: 'f5t-3',  date: '2026-05-03', accountId: 'a-f5-chk',  amount: 3600,  description: 'Parent B · paycheck',   category: 'salary' },
    { id: 'f5t-4',  date: '2026-05-04', accountId: 'a-f5-chk',  amount: -420,  description: 'Groceries · family of 5', category: 'groceries' },
    { id: 'f5t-5',  date: '2026-05-05', accountId: 'a-f5-cc',   amount: -90,   description: 'Gas',                  category: 'fuel' },
    { id: 'f5t-6',  date: '2026-05-06', accountId: 'a-f5-chk',  amount: -320,  description: 'Utilities',            category: 'utilities' },
    { id: 'f5t-7',  date: '2026-05-08', accountId: 'a-f5-chk',  amount: -260,  description: 'Kids · activities',    category: 'household' },
    { id: 'f5t-8',  date: '2026-05-09', accountId: 'a-f5-chk',  amount: -600,  description: '→ Family Savings', category: 'transfer' },
    { id: 'f5t-9',  date: '2026-05-09', accountId: 'a-f5-sav',  amount: 600,   description: 'Savings · monthly',    category: 'transfer' },
    { id: 'f5t-10', date: '2026-05-10', accountId: 'a-f5-chk',  amount: -520,  description: 'Minivan payment',      category: 'debt-payment' },
    { id: 'f5t-11', date: '2026-05-10', accountId: 'a-f5-auto', amount: 520,   description: 'Minivan loan · principal', category: 'debt-payment' },
    { id: 'f5t-12', date: '2026-05-11', accountId: 'a-f5-chk',  amount: -300,  description: '→ 529 College Funds', category: 'transfer' },
    { id: 'f5t-13', date: '2026-05-11', accountId: 'a-f5-529',  amount: 300,   description: '529 · monthly',        category: 'transfer' },
    { id: 'f5t-14', date: '2026-05-12', accountId: 'a-f5-cc',   amount: -80,   description: 'Household supplies',   category: 'household' },
    { id: 'f5t-15', date: '2026-05-13', accountId: 'a-f5-cc',   amount: -70,   description: 'School lunches',       category: 'household' },
    { id: 'f5t-16', date: '2026-05-14', accountId: 'a-f5-chk',  amount: -840,  description: 'Tithe · home church',  category: 'charitable' },
    { id: 'f5t-17', date: '2026-06-01', accountId: 'a-f5-chk',  amount: 4800,  description: 'Parent A · paycheck (upcoming)', category: 'salary' },
    { id: 'f5t-18', date: '2026-06-03', accountId: 'a-f5-chk',  amount: 3600,  description: 'Parent B · paycheck (upcoming)', category: 'salary' },
  ],
  contractors1099: [], taxCalendar: [], scopes: [], events: [], projects: [], subscriptions: [], feedback: [], checkoutIntents: [], inquiries: [], opportunities: [], capexItems: [], prayerRequests: [], skillProfiles: [],
  recurringObligations: [
    { id: 'f5-ro-mort',  name: 'Mortgage',      amount: 2100, frequency: 'monthly', nextDue: '2026-06-01', entityId: 'e-fam5', category: 'household',    enabled: true },
    { id: 'f5-ro-util',  name: 'Utilities',     amount: 320,  frequency: 'monthly', nextDue: '2026-06-06', entityId: 'e-fam5', category: 'utilities',    enabled: true },
    { id: 'f5-ro-auto',  name: 'Minivan loan',  amount: 520,  frequency: 'monthly', nextDue: '2026-06-10', entityId: 'e-fam5', category: 'debt-payment', enabled: true },
    { id: 'f5-ro-tithe', name: 'Tithe',         amount: 840,  frequency: 'monthly', nextDue: '2026-06-14', entityId: 'e-fam5', category: 'charitable',   enabled: true },
  ],
  incidents: [], welcomeDismissed: false, userTier: 'foundation', moduleInterest: {},
  inflows: {
    salaries: [
      { id: 'f5-sal-a', who: 'Parent A', source: 'Salary', expected: 4800, actual: 4800, entityId: 'e-fam5' },
      { id: 'f5-sal-b', who: 'Parent B', source: 'Salary', expected: 3600, actual: 3600, entityId: 'e-fam5' },
    ],
    rentals: [],
  },
  outflows: { rentalMortgages: 0, propertyUtilities: 0, household: 2100, debtService: 575, charitableGiving: 840 },
  debts: [
    { id: 'f5-d-auto', entityId: 'e-fam5', name: 'Minivan Loan', balance: 9200, rate: 6.0,  minPayment: 520, payoffType: 'snowball' },
    { id: 'f5-d-cc',   entityId: 'e-fam5', name: 'Visa',         balance: 640,  rate: 21.5, minPayment: 55,  payoffType: 'snowball' },
  ],
  watchlist: ['spy.us', 'qqq.us'],
  church: { name: 'Your home church', nickname: '', site: '', address: '', phone: '', officeHours: '', contactEmail: '', services: [], media: {}, links: {}, tagline: 'Where your family worships and serves', verse: { ref: 'Psalm 1:1', text: 'Blessed is the man who walks not in the counsel of the wicked.' } },
  voiceOps: { apiUrl: '', apiToken: '', rates: { perCallMinute: 0.0085, perTranscriptMinute: 0.05, perNumberMonthly: 1.15 }, numbersConfigured: 0, budgetAlertMonthly: 30 },
  pressureMappings: { ...SEED_DATA.pressureMappings },
};

// DEMO · LARGE HOUSEHOLD (7) — two parents, five kids. A real load carried well:
// strong combined income plus side income, buffer funded, 529s and savings
// growing, the big van loan shrinking, generous tithe.
const DEMO_DATA_FAMILY_OF_7 = {
  ...SEED_DATA,
  meta: { ...SEED_DATA.meta, lastUpdated: '2026-05-28', monthOfData: 'May 2026', bufferTarget: 8000, bufferCurrent: 8000, releaseLabel: 'Sample · Large household (7)' },
  entities: [
    { id: 'e-fam7', name: 'The Adeyemi household', type: 'personal', notes: 'Two parents, five kids', visibleTo: ['darrell', 'christina', 'family'] },
  ],
  accounts: [
    { id: 'a-f7-chk',  entityId: 'e-fam7', name: 'Main Checking',    institution: 'First National', type: 'checking', fragment: '...7010', balance: 8400,   openingBalance: 5080,   isPrimary: true },
    { id: 'a-f7-sav',  entityId: 'e-fam7', name: 'Family Savings',   institution: 'First National', type: 'savings',  fragment: '...7017', balance: 24000,  openingBalance: 23200 },
    { id: 'a-f7-529',  entityId: 'e-fam7', name: '529 College Funds', institution: 'Vanguard',      type: 'investment', fragment: '...1140', balance: 14000,  openingBalance: 13600 },
    { id: 'a-f7-cc',   entityId: 'e-fam7', name: 'Visa',             institution: 'Capital One',    type: 'credit',   fragment: '...8813', balance: -820,   openingBalance: -520 },
    { id: 'a-f7-auto', entityId: 'e-fam7', name: 'Van Loan',         institution: 'Credit Union',   type: 'loan',     fragment: '...5530', balance: -12500, openingBalance: -13140 },
  ],
  transactions: [
    { id: 'f7t-1',  date: '2026-05-01', accountId: 'a-f7-chk',  amount: 5200,  description: 'Parent A · paycheck',   category: 'salary' },
    { id: 'f7t-2',  date: '2026-05-01', accountId: 'a-f7-chk',  amount: -2600, description: 'Mortgage',              category: 'household' },
    { id: 'f7t-3',  date: '2026-05-03', accountId: 'a-f7-chk',  amount: 3800,  description: 'Parent B · paycheck',   category: 'salary' },
    { id: 'f7t-4',  date: '2026-05-05', accountId: 'a-f7-chk',  amount: 1200,  description: 'Side income',           category: 'salary' },
    { id: 'f7t-5',  date: '2026-05-04', accountId: 'a-f7-chk',  amount: -620,  description: 'Groceries · large household', category: 'groceries' },
    { id: 'f7t-6',  date: '2026-05-06', accountId: 'a-f7-chk',  amount: -420,  description: 'Utilities',            category: 'utilities' },
    { id: 'f7t-7',  date: '2026-05-08', accountId: 'a-f7-chk',  amount: -380,  description: 'Kids · activities (5)', category: 'household' },
    { id: 'f7t-8',  date: '2026-05-09', accountId: 'a-f7-chk',  amount: -800,  description: '→ Family Savings', category: 'transfer' },
    { id: 'f7t-9',  date: '2026-05-09', accountId: 'a-f7-sav',  amount: 800,   description: 'Savings · monthly',    category: 'transfer' },
    { id: 'f7t-10', date: '2026-05-10', accountId: 'a-f7-chk',  amount: -640,  description: 'Van payment',          category: 'debt-payment' },
    { id: 'f7t-11', date: '2026-05-10', accountId: 'a-f7-auto', amount: 640,   description: 'Van loan · principal', category: 'debt-payment' },
    { id: 'f7t-12', date: '2026-05-11', accountId: 'a-f7-chk',  amount: -400,  description: '→ 529 College Funds', category: 'transfer' },
    { id: 'f7t-13', date: '2026-05-11', accountId: 'a-f7-529',  amount: 400,   description: '529 · monthly',        category: 'transfer' },
    { id: 'f7t-14', date: '2026-05-12', accountId: 'a-f7-cc',   amount: -110,  description: 'Household supplies',   category: 'household' },
    { id: 'f7t-15', date: '2026-05-12', accountId: 'a-f7-cc',   amount: -100,  description: 'Gas',                  category: 'fuel' },
    { id: 'f7t-16', date: '2026-05-13', accountId: 'a-f7-cc',   amount: -90,   description: 'School supplies',      category: 'household' },
    { id: 'f7t-17', date: '2026-05-14', accountId: 'a-f7-chk',  amount: -1020, description: 'Tithe · home church',  category: 'charitable' },
    { id: 'f7t-18', date: '2026-06-01', accountId: 'a-f7-chk',  amount: 5200,  description: 'Parent A · paycheck (upcoming)', category: 'salary' },
    { id: 'f7t-19', date: '2026-06-03', accountId: 'a-f7-chk',  amount: 3800,  description: 'Parent B · paycheck (upcoming)', category: 'salary' },
  ],
  contractors1099: [], taxCalendar: [], scopes: [], events: [], projects: [], subscriptions: [], feedback: [], checkoutIntents: [], inquiries: [], opportunities: [], capexItems: [], prayerRequests: [], skillProfiles: [],
  recurringObligations: [
    { id: 'f7-ro-mort',  name: 'Mortgage',   amount: 2600, frequency: 'monthly', nextDue: '2026-06-01', entityId: 'e-fam7', category: 'household',    enabled: true },
    { id: 'f7-ro-util',  name: 'Utilities',  amount: 420,  frequency: 'monthly', nextDue: '2026-06-06', entityId: 'e-fam7', category: 'utilities',    enabled: true },
    { id: 'f7-ro-auto',  name: 'Van loan',   amount: 640,  frequency: 'monthly', nextDue: '2026-06-10', entityId: 'e-fam7', category: 'debt-payment', enabled: true },
    { id: 'f7-ro-tithe', name: 'Tithe',      amount: 1020, frequency: 'monthly', nextDue: '2026-06-14', entityId: 'e-fam7', category: 'charitable',   enabled: true },
  ],
  incidents: [], welcomeDismissed: false, userTier: 'foundation', moduleInterest: {},
  inflows: {
    salaries: [
      { id: 'f7-sal-a', who: 'Parent A', source: 'Salary',      expected: 5200, actual: 5200, entityId: 'e-fam7' },
      { id: 'f7-sal-b', who: 'Parent B', source: 'Salary',      expected: 3800, actual: 3800, entityId: 'e-fam7' },
      { id: 'f7-sal-s', who: 'Parent A', source: 'Side income', expected: 1200, actual: 1200, entityId: 'e-fam7' },
    ],
    rentals: [],
  },
  outflows: { rentalMortgages: 0, propertyUtilities: 0, household: 2600, debtService: 710, charitableGiving: 1020 },
  debts: [
    { id: 'f7-d-auto', entityId: 'e-fam7', name: 'Van Loan', balance: 12500, rate: 6.5,  minPayment: 640, payoffType: 'snowball' },
    { id: 'f7-d-cc',   entityId: 'e-fam7', name: 'Visa',     balance: 820,   rate: 21.0, minPayment: 70,  payoffType: 'snowball' },
  ],
  watchlist: ['spy.us', 'vti.us'],
  church: { name: 'Your home church', nickname: '', site: '', address: '', phone: '', officeHours: '', contactEmail: '', services: [], media: {}, links: {}, tagline: 'Where your family worships and serves', verse: { ref: 'Psalm 1:1', text: 'Blessed is the man who walks not in the counsel of the wicked.' } },
  voiceOps: { apiUrl: '', apiToken: '', rates: { perCallMinute: 0.0085, perTranscriptMinute: 0.05, perNumberMonthly: 1.15 }, numbersConfigured: 0, budgetAlertMonthly: 30 },
  pressureMappings: { ...SEED_DATA.pressureMappings },
};

  return {
    'family-of-1': DEMO_DATA_FAMILY_OF_1,
    'family-of-2': DEMO_DATA_FAMILY_OF_2,
    'family-of-3': DEMO_DATA_FAMILY_OF_3,
    'family-of-4': DEMO_DATA_FAMILY_OF_4,
    'family-of-5': DEMO_DATA_FAMILY_OF_5,
    'family-of-7': DEMO_DATA_FAMILY_OF_7,
    'separated': DEMO_DATA_SEPARATED,
    'professional': DEMO_DATA_PROFESSIONAL,
    'landlord': DEMO_DATA_LANDLORD,
  };
}

export const DEMO_PERSONA_META = {
  'family-of-1': {
    free: true,
    label: 'For singles starting out',
    headline: 'One income, one budget, no guessing.',
    summary: 'One household, one income, simple books.',
    audience: 'Single adults building their first real financial footing.',
    pitch: 'One income, handled with discipline: rent covered, emergency fund funded, Roth started, the student loan getting crushed, tithe steady. Every subscription and "where did it go" is on the screen, not in your head.',
    vision: 'The financial backbone is here today. As modules ship, the same books widen — never another app to learn.',
  },
  'family-of-2': {
    free: true,
    label: 'For couples (no kids yet)',
    headline: 'Two incomes pulling in one direction.',
    summary: 'Two incomes, shared books, joint goals.',
    audience: 'Couples combining finances and saving toward a first home.',
    pitch: 'Two incomes, one plan. The house down-payment fund grows every month, the emergency fund is full, the car loan is shrinking, and who-paid-what is a number, not a feeling. The 1st is calm.',
    vision: 'Shared per-profile views work today. Cross-device co-auth for two logins on one ledger is in build.',
  },
  'family-of-3': {
    free: true,
    label: 'For new parents',
    headline: 'First child without losing track of the rest.',
    summary: 'Two parents, one baby, fresh discipline.',
    audience: 'New parents absorbing childcare costs without losing ground.',
    pitch: 'Childcare landed and the books still balance. Buffer funded, the 529 started the month the baby came home, debts on track, tithe steady. The new line items are tracked the day they start — nothing slips.',
    vision: 'The financial core is here. Childcare + benefits coordination surfaces layer on as the modules ship.',
  },
  'family-of-4': {
    free: true,
    label: 'For your family',
    headline: 'Know what\'s covered before the 1st — without guessing.',
    summary: 'Two parents, two kids in school.',
    audience: 'Married couples with school-age children.',
    pitch: 'Every dollar in one place. Bills, paycheck, tithe, groceries, debt down to almost nothing, savings growing. On every screen the system tells you what to do, when, why, and how. The 1st stops being a scramble.',
    vision: 'Multi-device per-profile views shipped — a parent, a parent, and a "Family" rollup all work today. Anonymous in-app specialist messaging is in design.',
  },
  'family-of-5': {
    free: true,
    label: 'For families of 5+',
    headline: 'Three kids, busier rhythm — same clarity.',
    summary: 'Two parents, three kids, a fuller calendar.',
    audience: 'Larger families keeping every kid\'s costs visible.',
    pitch: 'More mouths, more dates, same four questions answered on every screen. Buffer funded, 529s growing for three, the minivan loan shrinking, tithe steady. Every kid\'s costs visible, nothing slips.',
    vision: 'Per-profile family views work today. Per-kid activity + cost tracking deepens as the Home Command module ships.',
  },
  'family-of-7': {
    free: true,
    label: 'For large households',
    headline: 'Big family, big load, lifted by the system.',
    summary: 'Two parents, five kids, a real load carried well.',
    audience: 'Large households coordinating complex schedules and budgets.',
    pitch: 'A genuinely big load, carried well: strong combined income plus side income, buffer funded, savings and 529s growing, the big van loan shrinking, generous tithe. The load is real; the record keeps it honest.',
    vision: 'Scaled family views work today. Multi-earner + older-kids sub-profiles layer on as the modules ship.',
  },
  'separated': {
    free: true,
    label: 'For co-parents apart',
    headline: 'A fair shared truth so money stops being the fight.',
    summary: 'Two households, one shared child.',
    audience: 'Co-parents who don\'t live together but co-fund the kids.',
    pitch: 'Each household sees its own books. The shared-child entity rolls up costs both sides agreed to split, with paid/unpaid plain on the screen. He didn\'t show up for the exchange? The timestamp is in the log. She says you missed a payment? The receipt\'s right there. You don\'t have to argue about it in front of the kids — the system shows the truth.',
    vision: 'Today this is two profiles on one device. Cross-household sync (two phones, two logins, one shared-child ledger) is the next build. Anonymous coordinated counseling sits in the same workstream.',
  },
  'professional': {
    free: false,
    label: 'For solo practice owners',
    headline: 'Practice clean, personal clean, tax set-aside running.',
    summary: 'Therapist, lawyer, or consultant running their own practice.',
    audience: 'Solo practitioners juggling personal income with practice revenue.',
    pitch: 'No more "which money is whose." Owner draw clean. Quarterly tax set aside. CEUs and license renewals on the calendar so they never sneak up. Your books match what the IRS thinks they should be.',
    vision: 'Today this is the financial backbone. Practice intake funnel + contractor 1099 management surfaces are in build. The marketplace that connects you to peer practitioners is roadmap.',
  },
  'landlord': {
    free: false,
    label: 'For landlords',
    headline: 'Know on the 1st — not at month-end when a deposit comes up short.',
    summary: 'Small landlord juggling rentals + a personal household.',
    audience: 'Owner-operators with 1-10 rental units.',
    pitch: 'Per-property cash flow without spreadsheets. Late tenants flagged on the 1st. Mortgage timing protected. Capex reserve auto-funded. The portfolio runs itself; you decide.',
    vision: 'Today the rental tracking is here. Tenant portal + lease-doc workflow + maintenance request flow are in build. Specialist access (attorney, accountant, property manager) is roadmap.',
  },
};

