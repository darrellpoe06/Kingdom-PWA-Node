// =============================================================================
// learn-catalog — the ONE derived registry of every finished Learn course
// =============================================================================
// Darrell 2026-07-08 ("this is my 1000th time requesting this"): the Church →
// Learn tab must carry EVERY finished course in the PoeTech App — at least 40
// lessons — and the catalog must be DERIVED, never a hand-typed list that
// silently drops what was built (Kingdom Economics and Prophetic Voices were
// fully built on 2026-07-04 and never surfaced; that class of miss ends here).
//
// This registry is the single source of truth for WHAT finished courses exist.
// - The host (poe-financial-mvp-v28.jsx) builds its self-paced course
//   descriptors FROM this registry (buildSelfPacedDescriptors) — the cohort
//   courses keep their bespoke cohort wiring but are still REGISTERED here so
//   counting and completeness cover them.
// - learn-catalog-render.test.jsx clicks every registered course in a real
//   render and asserts the ≥ 40-lesson floor — a course that is built but not
//   surfaced, or that crashes on open, fails CI instead of production
//   (DR-0076 proven-to-catch; the 2026-07-08 "Living lessons break").
// - The lesson count shown in the Learn header derives from the live course
//   list at render time (no static number — DR-0121).
// =============================================================================

import { CLASS_META, SESSION_FLOW, buildSchedule, progressSummary, exportCurriculumMarkdown, CLASS_INTEREST_TAG } from './church-classes.js';
import { BROADCAST_META, BROADCAST_SESSION_FLOW, buildBroadcastSchedule, broadcastProgressSummary, exportBroadcastCurriculumMarkdown, BROADCAST_INTEREST_TAG, BROADCAST_HELPER_TAG, BROADCAST_TUTOR_META } from './broadcast-class.js';
import { INFRA_META, INFRA_SESSION_FLOW, buildInfraSchedule, infraProgressSummary, exportInfraCurriculumMarkdown, INFRA_INTEREST_TAG, INFRA_HELPER_TAG, INFRA_TUTOR_META } from './infrastructure-class.js';
import { SOVEREIGN_AI_META, SOVEREIGN_AI_SESSION_FLOW, buildSovereignAiSchedule, sovereignAiProgressSummary, exportSovereignAiCurriculumMarkdown, SOVEREIGN_AI_INTEREST_TAG, SOVEREIGN_AI_HELPER_TAG, SOVEREIGN_AI_TUTOR_META } from './sovereign-ai-class.js';
import { AI_LEGAL_BLUEPRINT_META, AI_LEGAL_BLUEPRINT_SESSION_FLOW, buildAiLegalBlueprintSchedule, aiLegalBlueprintProgressSummary, exportAiLegalBlueprintCurriculumMarkdown, AI_LEGAL_BLUEPRINT_INTEREST_TAG, AI_LEGAL_BLUEPRINT_HELPER_TAG, AI_LEGAL_BLUEPRINT_TUTOR_META } from './ai-legal-blueprint-class.js';
import { LIVING_LESSONS_META, LIVING_LESSONS_SESSION_FLOW, buildLivingLessonsSchedule, livingLessonsProgressSummary, exportLivingLessonsCurriculumMarkdown, LIVING_LESSONS_INTEREST_TAG, LIVING_LESSONS_HELPER_TAG, LIVING_LESSONS_TUTOR_META } from './living-lessons-class.js';
import { LITTLE_LEARNERS_META, LITTLE_LEARNERS_SESSION_FLOW, buildLittleLearnersSchedule, littleLearnersProgressSummary, exportLittleLearnersCurriculumMarkdown, LITTLE_LEARNERS_INTEREST_TAG, LITTLE_LEARNERS_HELPER_TAG, LITTLE_LEARNERS_TUTOR_META } from './little-learners-class.js';
import { MADE_IN_TIME_META, MADE_IN_TIME_SESSION_FLOW, buildMadeInTimeSchedule, madeInTimeProgressSummary, exportMadeInTimeCurriculumMarkdown, MADE_IN_TIME_INTEREST_TAG, MADE_IN_TIME_HELPER_TAG, MADE_IN_TIME_TUTOR_META } from './made-in-time-course.js';
import { SOUND_BOARD_META, SOUND_BOARD_SESSION_FLOW, buildSoundBoardSchedule, soundBoardProgressSummary, exportSoundBoardCurriculumMarkdown, SOUND_BOARD_INTEREST_TAG, SOUND_BOARD_HELPER_TAG, SOUND_BOARD_TUTOR_META } from './sound-board-class.js';
import { WORD_OUT_META, WORD_OUT_SESSION_FLOW, buildWordOutSchedule, wordOutProgressSummary, exportWordOutCurriculumMarkdown, WORD_OUT_INTEREST_TAG, WORD_OUT_HELPER_TAG, WORD_OUT_TUTOR_META } from './word-out-course.js';
import { CHURCH_OFFICES_META, CHURCH_OFFICES_SESSION_FLOW, buildChurchOfficesSchedule, churchOfficesProgressSummary, exportChurchOfficesCurriculumMarkdown, CHURCH_OFFICES_INTEREST_TAG, CHURCH_OFFICES_HELPER_TAG, CHURCH_OFFICES_TUTOR_META } from './church-offices-course.js';
import { WORLD_ISSUES_META, WORLD_ISSUES_SESSION_FLOW, buildWorldIssuesSchedule, worldIssuesProgressSummary, exportWorldIssuesCurriculumMarkdown, WORLD_ISSUES_INTEREST_TAG, WORLD_ISSUES_HELPER_TAG, WORLD_ISSUES_TUTOR_META } from './world-issues-class.js';
import { DATASYSTEMS_META, DATASYSTEMS_SESSION_FLOW, buildDatasystemsSchedule, datasystemsProgressSummary, exportDatasystemsCurriculumMarkdown, DATASYSTEMS_INTEREST_TAG, DATASYSTEMS_HELPER_TAG, DATASYSTEMS_TUTOR_META } from './datasystems-course.js';
import { SUCCESSION_META, SUCCESSION_SESSION_FLOW, buildSuccessionSchedule, successionProgressSummary, exportSuccessionCurriculumMarkdown, SUCCESSION_INTEREST_TAG, SUCCESSION_HELPER_TAG, SUCCESSION_TUTOR_META } from './succession-class.js';
import { ECON_META, ECON_SESSION_FLOW, buildEconSchedule, econProgressSummary, exportEconCurriculumMarkdown, ECON_INTEREST_TAG, ECON_HELPER_TAG, ECON_TUTOR_META } from './economics-class.js';
import { PV_META, PV_SESSION_FLOW, buildPvSchedule, pvProgressSummary, exportPvCurriculumMarkdown, PV_INTEREST_TAG, PV_HELPER_TAG, PV_TUTOR_META } from './prophetic-voices.js';
import { LEGACY_PROVISIONS_META, LEGACY_PROVISIONS_SESSION_FLOW, buildLegacyProvisionsSchedule, legacyProvisionsProgressSummary, exportLegacyProvisionsCurriculumMarkdown, LEGACY_PROVISIONS_INTEREST_TAG, LEGACY_PROVISIONS_HELPER_TAG, LEGACY_PROVISIONS_TUTOR_META } from './legacy-provisions-course.js';
import { PROPERTY_PRINCIPLE_META, PROPERTY_PRINCIPLE_SESSION_FLOW, buildPropertyPrincipleSchedule, propertyPrincipleProgressSummary, exportPropertyPrincipleCurriculumMarkdown, PROPERTY_PRINCIPLE_INTEREST_TAG, PROPERTY_PRINCIPLE_HELPER_TAG, PROPERTY_PRINCIPLE_TUTOR_META } from './property-principle-course.js';
import { HISTORY_META, HISTORY_SESSION_FLOW, buildHistorySchedule, historyProgressSummary, exportHistoryCurriculumMarkdown, HISTORY_INTEREST_TAG, HISTORY_HELPER_TAG, HISTORY_TUTOR_META } from './history-course.js';
import { HISTORICAL_RESEARCH_META, HISTORICAL_RESEARCH_SESSION_FLOW, buildHistoricalResearchSchedule, historicalResearchProgressSummary, exportHistoricalResearchCurriculumMarkdown, HISTORICAL_RESEARCH_INTEREST_TAG, HISTORICAL_RESEARCH_HELPER_TAG, HISTORICAL_RESEARCH_TUTOR_META } from './historical-research-course.js';
import { MANAGEMENT_STEWARDSHIP_META, MANAGEMENT_STEWARDSHIP_SESSION_FLOW, buildManagementStewardshipSchedule, managementStewardshipProgressSummary, exportManagementStewardshipCurriculumMarkdown, MANAGEMENT_STEWARDSHIP_INTEREST_TAG, MANAGEMENT_STEWARDSHIP_HELPER_TAG, MANAGEMENT_STEWARDSHIP_TUTOR_META } from './management-stewardship-course.js';
import { BUYING_TERMS_META, BUYING_TERMS_SESSION_FLOW, buildBuyingTermsSchedule, buyingTermsProgressSummary, exportBuyingTermsCurriculumMarkdown, BUYING_TERMS_INTEREST_TAG, BUYING_TERMS_HELPER_TAG, BUYING_TERMS_TUTOR_META } from './buying-terms-course.js';
import { LEASING_TENANTS_META, LEASING_TENANTS_SESSION_FLOW, buildLeasingTenantsSchedule, leasingTenantsProgressSummary, exportLeasingTenantsCurriculumMarkdown, LEASING_TENANTS_INTEREST_TAG, LEASING_TENANTS_HELPER_TAG, LEASING_TENANTS_TUTOR_META } from './leasing-tenants-course.js';
import { MAINTENANCE_TRADES_META, MAINTENANCE_TRADES_SESSION_FLOW, buildMaintenanceTradesSchedule, maintenanceTradesProgressSummary, exportMaintenanceTradesCurriculumMarkdown, MAINTENANCE_TRADES_INTEREST_TAG, MAINTENANCE_TRADES_HELPER_TAG, MAINTENANCE_TRADES_TUTOR_META } from './maintenance-trades-course.js';
import { PARTNERSHIPS_META, PARTNERSHIPS_SESSION_FLOW, buildPartnershipsSchedule, partnershipsProgressSummary, exportPartnershipsCurriculumMarkdown, PARTNERSHIPS_INTEREST_TAG, PARTNERSHIPS_HELPER_TAG, PARTNERSHIPS_TUTOR_META } from './partnerships-course.js';
import { FINANCING_DEBT_META, FINANCING_DEBT_SESSION_FLOW, buildFinancingDebtSchedule, financingDebtProgressSummary, exportFinancingDebtCurriculumMarkdown, FINANCING_DEBT_INTEREST_TAG, FINANCING_DEBT_HELPER_TAG, FINANCING_DEBT_TUTOR_META } from './financing-debt-course.js';
import { TAXES_RECORDS_META, TAXES_RECORDS_SESSION_FLOW, buildTaxesRecordsSchedule, taxesRecordsProgressSummary, exportTaxesRecordsCurriculumMarkdown, TAXES_RECORDS_INTEREST_TAG, TAXES_RECORDS_HELPER_TAG, TAXES_RECORDS_TUTOR_META } from './taxes-records-course.js';
import { BANKING_META, BANKING_SESSION_FLOW, buildBankingSchedule, bankingProgressSummary, exportBankingCurriculumMarkdown, BANKING_INTEREST_TAG, BANKING_HELPER_TAG, BANKING_TUTOR_META } from './banking-course.js';
import { STOCKS_META, STOCKS_SESSION_FLOW, buildStocksSchedule, stocksProgressSummary, exportStocksCurriculumMarkdown, STOCKS_INTEREST_TAG, STOCKS_HELPER_TAG, STOCKS_TUTOR_META } from './stocks-course.js';
import { BONDS_META, BONDS_SESSION_FLOW, buildBondsSchedule, bondsProgressSummary, exportBondsCurriculumMarkdown, BONDS_INTEREST_TAG, BONDS_HELPER_TAG, BONDS_TUTOR_META } from './bonds-course.js';
import { WORLD_MARKET_META, WORLD_MARKET_SESSION_FLOW, buildWorldMarketSchedule, worldMarketProgressSummary, exportWorldMarketCurriculumMarkdown, WORLD_MARKET_INTEREST_TAG, WORLD_MARKET_HELPER_TAG, WORLD_MARKET_TUTOR_META } from './world-market-course.js';
import { INVESTING_META, INVESTING_SESSION_FLOW, buildInvestingSchedule, investingProgressSummary, exportInvestingCurriculumMarkdown, INVESTING_INTEREST_TAG, INVESTING_HELPER_TAG, INVESTING_TUTOR_META } from './investing-course.js';
import { INSURANCE_RISK_META, INSURANCE_RISK_SESSION_FLOW, buildInsuranceRiskSchedule, insuranceRiskProgressSummary, exportInsuranceRiskCurriculumMarkdown, INSURANCE_RISK_INTEREST_TAG, INSURANCE_RISK_HELPER_TAG, INSURANCE_RISK_TUTOR_META } from './insurance-risk-course.js';
import { INSPECTIONS_META, INSPECTIONS_SESSION_FLOW, buildInspectionsSchedule, inspectionsProgressSummary, exportInspectionsCurriculumMarkdown, INSPECTIONS_INTEREST_TAG, INSPECTIONS_HELPER_TAG, INSPECTIONS_TUTOR_META } from './inspections-course.js';
import { EVICTIONS_META, EVICTIONS_SESSION_FLOW, buildEvictionsSchedule, evictionsProgressSummary, exportEvictionsCurriculumMarkdown, EVICTIONS_INTEREST_TAG, EVICTIONS_HELPER_TAG, EVICTIONS_TUTOR_META } from './evictions-course.js';
import { APPRAISAL_META, APPRAISAL_SESSION_FLOW, buildAppraisalSchedule, appraisalProgressSummary, exportAppraisalCurriculumMarkdown, APPRAISAL_INTEREST_TAG, APPRAISAL_HELPER_TAG, APPRAISAL_TUTOR_META } from './appraisal-course.js';
import { MATHEMATICS_META, MATHEMATICS_SESSION_FLOW, buildMathematicsSchedule, mathematicsProgressSummary, exportMathematicsCurriculumMarkdown, MATHEMATICS_INTEREST_TAG, MATHEMATICS_HELPER_TAG, MATHEMATICS_TUTOR_META } from './mathematics-class.js';
import { RTO_BUSINESS_META, RTO_BUSINESS_SESSION_FLOW, buildRtoBusinessSchedule, rtoBusinessProgressSummary, exportRtoBusinessCurriculumMarkdown, RTO_BUSINESS_INTEREST_TAG, RTO_BUSINESS_HELPER_TAG, RTO_BUSINESS_TUTOR_META } from './rent-to-own-business-class.js';
import { BUSINESS_RESEARCH_META, BUSINESS_RESEARCH_SESSION_FLOW, buildBusinessResearchSchedule, businessResearchProgressSummary, exportBusinessResearchCurriculumMarkdown, BUSINESS_RESEARCH_INTEREST_TAG, BUSINESS_RESEARCH_HELPER_TAG, BUSINESS_RESEARCH_TUTOR_META } from './business-research-course.js';
import { DEVELOPMENT_META, DEVELOPMENT_SESSION_FLOW, buildDevelopmentSchedule, developmentProgressSummary, exportDevelopmentCurriculumMarkdown, DEVELOPMENT_INTEREST_TAG, DEVELOPMENT_HELPER_TAG, DEVELOPMENT_TUTOR_META } from './development-class.js';
import { HEALTHY_LIVING_META, HEALTHY_LIVING_SESSION_FLOW, buildHealthyLivingSchedule, healthyLivingProgressSummary, exportHealthyLivingCurriculumMarkdown, HEALTHY_LIVING_INTEREST_TAG, HEALTHY_LIVING_HELPER_TAG, HEALTHY_LIVING_TUTOR_META } from './healthy-living-course.js';
import { PROJECT_MANAGEMENT_META, PROJECT_MANAGEMENT_SESSION_FLOW, buildProjectManagementSchedule, projectManagementProgressSummary, exportProjectManagementCurriculumMarkdown, PROJECT_MANAGEMENT_INTEREST_TAG, PROJECT_MANAGEMENT_HELPER_TAG, PROJECT_MANAGEMENT_TUTOR_META } from './project-management-course.js';
import { SOFTWARE_PM_META, SOFTWARE_PM_SESSION_FLOW, buildSoftwarePmSchedule, softwarePmProgressSummary, exportSoftwarePmCurriculumMarkdown, SOFTWARE_PM_INTEREST_TAG, SOFTWARE_PM_HELPER_TAG, SOFTWARE_PM_TUTOR_META } from './software-project-management-course.js';

// Every finished course, in picker order. `wiring: 'cohort'` = the host owns a
// bespoke cohort-dated descriptor; `wiring: 'self-paced'` = the descriptor is
// built HERE (buildSelfPacedDescriptors) and rides in via extraCourses.
export const LEARN_CATALOG = [
  {
    key: 'ai', wiring: 'component', unitCap: 'Week',
    meta: { ...CLASS_META, key: 'ai', category: 'A.I. The Way' }, sessionFlow: SESSION_FLOW,
    buildScheduleRows: () => buildSchedule(null), progressSummary: (p) => progressSummary(p),
    exportMarkdown: () => exportCurriculumMarkdown(null), downloadName: 'learning-ai-the-way-curriculum.md',
    interestTag: CLASS_INTEREST_TAG, helperTag: '[Class helper]', tutorCourseMeta: null,
  },
  {
    key: 'broadcast', wiring: 'cohort', unitCap: 'Week',
    meta: { ...BROADCAST_META, key: 'broadcast', category: 'Serve the House' }, sessionFlow: BROADCAST_SESSION_FLOW,
    buildScheduleRows: () => buildBroadcastSchedule(null), progressSummary: (p) => broadcastProgressSummary(p),
    exportMarkdown: () => exportBroadcastCurriculumMarkdown(null), downloadName: 'the-broadcast-how-it-all-works-curriculum.md',
    interestTag: BROADCAST_INTEREST_TAG, helperTag: BROADCAST_HELPER_TAG, tutorCourseMeta: BROADCAST_TUTOR_META,
  },
  {
    key: 'infrastructure', wiring: 'cohort', unitCap: 'Week',
    meta: { ...INFRA_META, key: 'infrastructure', category: 'Serve the House' }, sessionFlow: INFRA_SESSION_FLOW,
    buildScheduleRows: () => buildInfraSchedule(null), progressSummary: (p) => infraProgressSummary(p),
    exportMarkdown: () => exportInfraCurriculumMarkdown(null), downloadName: 'the-infrastructure-how-we-build-it-sovereign-curriculum.md',
    interestTag: INFRA_INTEREST_TAG, helperTag: INFRA_HELPER_TAG, tutorCourseMeta: INFRA_TUTOR_META,
  },
  {
    key: 'sovereign-ai', wiring: 'cohort', unitCap: 'Week',
    meta: { ...SOVEREIGN_AI_META, key: 'sovereign-ai', category: 'A.I. The Way' }, sessionFlow: SOVEREIGN_AI_SESSION_FLOW,
    buildScheduleRows: () => buildSovereignAiSchedule(null), progressSummary: (p) => sovereignAiProgressSummary(p),
    exportMarkdown: () => exportSovereignAiCurriculumMarkdown(null), downloadName: 'sovereign-ai-why-we-build-local-curriculum.md',
    interestTag: SOVEREIGN_AI_INTEREST_TAG, helperTag: SOVEREIGN_AI_HELPER_TAG, tutorCourseMeta: SOVEREIGN_AI_TUTOR_META,
  },
  {
    key: 'ai-legal-blueprint', wiring: 'cohort', unitCap: 'Week',
    meta: { ...AI_LEGAL_BLUEPRINT_META, key: 'ai-legal-blueprint', category: 'A.I. The Way' }, sessionFlow: AI_LEGAL_BLUEPRINT_SESSION_FLOW,
    buildScheduleRows: () => buildAiLegalBlueprintSchedule(null), progressSummary: (p) => aiLegalBlueprintProgressSummary(p),
    exportMarkdown: () => exportAiLegalBlueprintCurriculumMarkdown(null), downloadName: 'ai-legal-blueprint-what-never-to-tell-a-chatbot-curriculum.md',
    interestTag: AI_LEGAL_BLUEPRINT_INTEREST_TAG, helperTag: AI_LEGAL_BLUEPRINT_HELPER_TAG, tutorCourseMeta: AI_LEGAL_BLUEPRINT_TUTOR_META,
  },
  {
    key: 'living-lessons', wiring: 'self-paced', unitCap: 'Lesson',
    meta: { ...LIVING_LESSONS_META, key: 'living-lessons', category: 'The Word & The Way' }, sessionFlow: LIVING_LESSONS_SESSION_FLOW,
    buildScheduleRows: () => buildLivingLessonsSchedule(), progressSummary: (p) => livingLessonsProgressSummary(p),
    exportMarkdown: () => exportLivingLessonsCurriculumMarkdown(), downloadName: 'living-lessons-from-the-word.md',
    interestTag: LIVING_LESSONS_INTEREST_TAG, helperTag: LIVING_LESSONS_HELPER_TAG, tutorCourseMeta: LIVING_LESSONS_TUTOR_META,
    interestText: (who) => `${LIVING_LESSONS_INTEREST_TAG} ${who} wants more Living Lessons.`,
    interestCopy: {
      heading: 'Want more Living Lessons?',
      blurb: 'Tell Darrell which Word-first lessons would help you and your family most, and he’ll add them to the series. Read at your own pace, any time, at any age.',
      cta: 'I’d like more',
      sent: '✓ Sent — Darrell will see what you’re hungry for. The Word feeds the whole Body.',
    },
  },
  {
    // LITTLE LEARNERS (DR-0431; Darrell 2026-09-15): pre-K to school entry,
    // reading and counting FROM THE WORD, read aloud, checks redoable as a
    // game, Ari in child mode. Sits with the Word courses on purpose.
    key: 'little-learners', wiring: 'self-paced', unitCap: 'Lesson',
    meta: { ...LITTLE_LEARNERS_META, key: 'little-learners', category: 'The Word & The Way' }, sessionFlow: LITTLE_LEARNERS_SESSION_FLOW,
    buildScheduleRows: () => buildLittleLearnersSchedule(), progressSummary: (p) => littleLearnersProgressSummary(p),
    exportMarkdown: () => exportLittleLearnersCurriculumMarkdown(), downloadName: 'little-learners.md',
    interestTag: LITTLE_LEARNERS_INTEREST_TAG, helperTag: LITTLE_LEARNERS_HELPER_TAG, tutorCourseMeta: LITTLE_LEARNERS_TUTOR_META,
    interestText: (who) => `${LITTLE_LEARNERS_INTEREST_TAG} ${who} wants more Little Learners lessons.`,
    interestCopy: {
      heading: 'Want more Little Learners?',
      blurb: 'More letters, more numbers, more first words from the Word — tell Darrell what your little one is ready for next and he will add it. Read aloud, redo any check as a game, no grown-up needed.',
      cta: 'My little one wants more',
      sent: '✓ Sent — Darrell will see it. Train up a child in the way he should go.',
    },
  },
  {
    // MATHEMATICS (DR-0433; Darrell 2026-09-15: "add Mathematics as a Tab").
    // Its own department in the school (DR-0432): every number a lesson works
    // with is one the Word records, the working shown, the check redoable.
    key: 'mathematics', wiring: 'self-paced', unitCap: 'Lesson',
    meta: { ...MATHEMATICS_META, key: 'mathematics', category: 'Mathematics' }, sessionFlow: MATHEMATICS_SESSION_FLOW,
    buildScheduleRows: () => buildMathematicsSchedule(), progressSummary: (p) => mathematicsProgressSummary(p),
    exportMarkdown: () => exportMathematicsCurriculumMarkdown(), downloadName: 'mathematics-from-the-word.md',
    interestTag: MATHEMATICS_INTEREST_TAG, helperTag: MATHEMATICS_HELPER_TAG, tutorCourseMeta: MATHEMATICS_TUTOR_META,
    interestText: (who) => `${MATHEMATICS_INTEREST_TAG} ${who} wants more Mathematics lessons.`,
    interestCopy: {
      heading: 'Want more Mathematics?',
      blurb: 'Bigger numbers, ratio and proportion, the geometry of the temple, the statistics of the census — tell Darrell what you or your learner is ready for next and he will add it, every number from the Word, the working shown.',
      cta: 'I want more mathematics',
      sent: '✓ Sent — Darrell will see it. He telleth the number of the stars.',
    },
  },
  // BUSINESS — the department Darrell opened 2026-09-17 ("I would like to have
  // a whole business suite of courses"), founded on the rent-to-own operating
  // system he worked every seat of. The department name is the REGISTRY'S to
  // declare, never retyped by a descriptor (see catalogCategory below — the
  // 2026-09-16 phantom "General Studies" miss).
  {
    key: 'rent-to-own-business', wiring: 'self-paced', unitCap: 'Lesson',
    meta: { ...RTO_BUSINESS_META, key: 'rent-to-own-business', category: 'Business' }, sessionFlow: RTO_BUSINESS_SESSION_FLOW,
    buildScheduleRows: () => buildRtoBusinessSchedule(), progressSummary: (p) => rtoBusinessProgressSummary(p),
    exportMarkdown: () => exportRtoBusinessCurriculumMarkdown(), downloadName: 'rent-to-own-business-operating-systems.md',
    interestTag: RTO_BUSINESS_INTEREST_TAG, helperTag: RTO_BUSINESS_HELPER_TAG, tutorCourseMeta: RTO_BUSINESS_TUTOR_META,
    interestText: (who) => `${RTO_BUSINESS_INTEREST_TAG} ${who} wants more of the business suite.`,
    interestCopy: {
      heading: 'Want more of the business suite?',
      blurb: 'Slice 1 is the rent-to-own operating system — the seats, the model and the just weight, inventory control, sales, collections, customer service, covenant over contract, and marketing. Tell Darrell which part of running a business you need next and he will add it, taught from the floor with the Word above it.',
      cta: 'I want more business lessons',
      sent: '✓ Sent — Darrell will see it. Seest thou a man diligent in his business?',
    },
  },
  {
    // The Business department's second course (DR-0594): the CRAFT of business
    // research — eight Level-1 competencies — with Business Wars (Wondery) as
    // the case, Word first. Every verse verbatim; every voice on a listed
    // record host, probed on a runner before it was written in.
    key: 'business-research-wars', wiring: 'self-paced', unitCap: 'Lesson',
    meta: { ...BUSINESS_RESEARCH_META, key: 'business-research-wars', category: 'Business' }, sessionFlow: BUSINESS_RESEARCH_SESSION_FLOW,
    buildScheduleRows: () => buildBusinessResearchSchedule(null), progressSummary: (p) => businessResearchProgressSummary(p),
    exportMarkdown: () => exportBusinessResearchCurriculumMarkdown(null), downloadName: 'business-research-level-1-business-wars-as-the-case-curriculum.md',
    interestTag: BUSINESS_RESEARCH_INTEREST_TAG, helperTag: BUSINESS_RESEARCH_HELPER_TAG, tutorCourseMeta: BUSINESS_RESEARCH_TUTOR_META,
    interestText: (who) => `${BUSINESS_RESEARCH_INTEREST_TAG} ${who} wants a hand working a company, a filing or a rivalry through the eight competencies.`,
    interestCopy: {
      heading: 'Want a hand with a company of your own?',
      blurb: 'Tell Darrell you want help working the eight competencies on a real business — a claim to count the cost of, a filing to open, a second witness to find, a scene to sort from a document, a rivalry to weigh, a correction to trace, or the two-paragraph brief to write with its sources. Teaching, not a substitute for the record: every filing and page this course names can be read in full where it points, and you are meant to check it.',
      cta: 'I want help with mine',
      sent: '✓ Sent — Darrell will reach out. Count the cost; establish every word at the mouth of two or three witnesses.',
    },
  },
  // DEVELOPMENT — the second half of the 2026-09-17 directive ("and also uh,
  // development, those sorts of courses"), taught from THIS platform's own
  // construction so the app answers questions about how it was built without
  // its builder in the room ("so all questions can be answered without even
  // having to have a conversation with me").
  {
    key: 'development', wiring: 'self-paced', unitCap: 'Lesson',
    meta: { ...DEVELOPMENT_META, key: 'development', category: 'Development' }, sessionFlow: DEVELOPMENT_SESSION_FLOW,
    buildScheduleRows: () => buildDevelopmentSchedule(), progressSummary: (p) => developmentProgressSummary(p),
    exportMarkdown: () => exportDevelopmentCurriculumMarkdown(), downloadName: 'development-systems-that-tell-the-truth.md',
    interestTag: DEVELOPMENT_INTEREST_TAG, helperTag: DEVELOPMENT_HELPER_TAG, tutorCourseMeta: DEVELOPMENT_TUTOR_META,
    interestText: (who) => `${DEVELOPMENT_INTEREST_TAG} ${who} wants more development lessons.`,
    interestCopy: {
      heading: 'Want more Development?',
      blurb: 'Slice 1 is the discipline — counting the cost, tracing the real record, the plumbline, proving a gate catches, guarding anything that runs itself, the outage that taught the most, shrink-only debt, and the decision record. Tell Darrell which part of building you need next and he will add it, taught from real files with the Word above the craft.',
      cta: 'I want more development lessons',
      sent: '✓ Sent — Darrell will see it. Except the LORD build the house.',
    },
  },
  {
    key: 'made-in-time', wiring: 'self-paced', unitCap: 'Lesson',
    meta: { ...MADE_IN_TIME_META, key: 'made-in-time', category: 'The Word & The Way' }, sessionFlow: MADE_IN_TIME_SESSION_FLOW,
    buildScheduleRows: () => buildMadeInTimeSchedule(), progressSummary: (p) => madeInTimeProgressSummary(p),
    exportMarkdown: () => exportMadeInTimeCurriculumMarkdown(), downloadName: 'made-in-time.md',
    interestTag: MADE_IN_TIME_INTEREST_TAG, helperTag: MADE_IN_TIME_HELPER_TAG, tutorCourseMeta: MADE_IN_TIME_TUTOR_META,
    interestText: (who) => `${MADE_IN_TIME_INTEREST_TAG} ${who} wants more of Made in Time.`,
    interestCopy: {
      heading: 'Want more of this course?',
      blurb: 'Tell Darrell which ages, mind-and-brain questions, or spiritual-warfare topics to cover next, and he’ll add them — Word-first, with science as a witness, never over the Word.',
      cta: 'I’d like more',
      sent: '✓ Sent — Darrell will see what you’re hungry for.',
    },
  },
  {
    key: 'sound-board', wiring: 'self-paced', unitCap: 'Lesson',
    meta: { ...SOUND_BOARD_META, key: 'sound-board', category: 'Serve the House' }, sessionFlow: SOUND_BOARD_SESSION_FLOW,
    buildScheduleRows: () => buildSoundBoardSchedule(), progressSummary: (p) => soundBoardProgressSummary(p),
    exportMarkdown: () => exportSoundBoardCurriculumMarkdown(), downloadName: 'running-the-board-live-sound.md',
    interestTag: SOUND_BOARD_INTEREST_TAG, helperTag: SOUND_BOARD_HELPER_TAG, tutorCourseMeta: SOUND_BOARD_TUTOR_META,
    interestText: (who) => `${SOUND_BOARD_INTEREST_TAG} ${who} wants to learn to run the sound board.`,
    interestCopy: {
      heading: 'Want to learn the sound board?',
      blurb: 'Tell Darrell you want to train on live sound for worship and he’ll get you started with the sound engineer. Learn at your own pace, right at the board, at any experience level.',
      cta: 'I want to learn',
      sent: '✓ Sent — Darrell will get you on the sound team. We mix so the Word is heard.',
    },
  },
  {
    key: 'church-offices', wiring: 'self-paced', unitCap: 'Lesson',
    meta: { ...CHURCH_OFFICES_META, key: 'church-offices', category: 'The Word & The Way' }, sessionFlow: CHURCH_OFFICES_SESSION_FLOW,
    buildScheduleRows: () => buildChurchOfficesSchedule(), progressSummary: (p) => churchOfficesProgressSummary(p),
    exportMarkdown: () => exportChurchOfficesCurriculumMarkdown(), downloadName: 'the-functions-of-the-house.md',
    interestTag: CHURCH_OFFICES_INTEREST_TAG, helperTag: CHURCH_OFFICES_HELPER_TAG, tutorCourseMeta: CHURCH_OFFICES_TUTOR_META,
    interestText: (who) => `${CHURCH_OFFICES_INTEREST_TAG} ${who} wants The Functions of the House study.`,
    interestCopy: {
      heading: 'Want this study of the offices?',
      blurb: 'Deacons, elders, bishops, pastors, the Ephesians 4 gifts — who they are in the Word, with every count measured from the text. Tell Darrell you want it for yourself or your leadership group.',
      cta: 'I want this study',
      sent: '✓ Sent — Darrell will see it. Function over title; the Word explains the Word.',
    },
  },
  {
    key: 'word-out', wiring: 'self-paced', unitCap: 'Lesson',
    meta: { ...WORD_OUT_META, key: 'word-out', category: 'Serve the House' }, sessionFlow: WORD_OUT_SESSION_FLOW,
    buildScheduleRows: () => buildWordOutSchedule(), progressSummary: (p) => wordOutProgressSummary(p),
    exportMarkdown: () => exportWordOutCurriculumMarkdown(), downloadName: 'getting-the-word-out.md',
    interestTag: WORD_OUT_INTEREST_TAG, helperTag: WORD_OUT_HELPER_TAG, tutorCourseMeta: WORD_OUT_TUTOR_META,
    interestText: (who) => `${WORD_OUT_INTEREST_TAG} ${who} wants the Getting the Word Out staff training.`,
    interestCopy: {
      heading: 'Want this staff training?',
      blurb: 'Tell Darrell you want to learn the broadcast flow — one upload, everywhere — and how to ask for what you want built. Self-paced, plain words, at the real pages.',
      cta: 'I want to learn',
      sent: '✓ Sent — Darrell will see it. One upload, and the Word goes out.',
    },
  },
  {
    // DERIVED from the 3rd-Dimension Witness room (lib/third-witness.js): one
    // lesson per cited source, so the witness room and this series can never
    // disagree and a source added there joins here on the next build (DR-0121).
    key: 'healthy-living', wiring: 'self-paced', unitCap: 'Lesson',
    meta: { ...HEALTHY_LIVING_META, key: 'healthy-living', category: 'The Word & The Way' }, sessionFlow: HEALTHY_LIVING_SESSION_FLOW,
    buildScheduleRows: () => buildHealthyLivingSchedule(), progressSummary: (p) => healthyLivingProgressSummary(p),
    exportMarkdown: () => exportHealthyLivingCurriculumMarkdown(), downloadName: 'healthy-living-the-3rd-dimension-witness.md',
    interestTag: HEALTHY_LIVING_INTEREST_TAG, helperTag: HEALTHY_LIVING_HELPER_TAG, tutorCourseMeta: HEALTHY_LIVING_TUTOR_META,
    interestText: (who) => `${HEALTHY_LIVING_INTEREST_TAG} ${who} wants more Healthy Living witnesses.`,
    interestCopy: {
      heading: 'Want another witness?',
      blurb: 'Tell Darrell which health question you want cross-referenced with the Word — every expert cited, every verse verbatim, and the counter-witness kept in. Read at your own pace, at any age. Medical decisions stay with your physician.',
      cta: 'I’d like more',
      sent: '✓ Sent — Darrell will see what to cross-reference next. His Word governs; the science witnesses.',
    },
  },
  {
    key: 'project-management', wiring: 'self-paced', unitCap: 'Lesson',
    meta: { ...PROJECT_MANAGEMENT_META, key: 'project-management', category: 'Project Management' }, sessionFlow: PROJECT_MANAGEMENT_SESSION_FLOW,
    buildScheduleRows: () => buildProjectManagementSchedule(), progressSummary: (p) => projectManagementProgressSummary(p),
    exportMarkdown: () => exportProjectManagementCurriculumMarkdown(), downloadName: 'project-management-count-the-cost.md',
    interestTag: PROJECT_MANAGEMENT_INTEREST_TAG, helperTag: PROJECT_MANAGEMENT_HELPER_TAG, tutorCourseMeta: PROJECT_MANAGEMENT_TUTOR_META,
    interestText: (who) => `${PROJECT_MANAGEMENT_INTEREST_TAG} ${who} wants more Project Management lessons.`,
    interestCopy: {
      heading: 'Carrying a project right now?',
      blurb: 'Tell Darrell what you are building \u2014 a church renovation, a rehab, a property turn, a ministry launch \u2014 and which part is hardest. He said he would add more lessons once this began, and the hard part you name is what the next one is built from.',
      cta: 'I\u2019d like more',
      sent: '\u2713 Sent \u2014 Darrell will see which part is hardest. The Word gave the discipline first; the standard only named it.',
    },
  },
  {
    key: 'software-project-management', wiring: 'self-paced', unitCap: 'Lesson',
    meta: { ...SOFTWARE_PM_META, key: 'software-project-management', category: 'Project Management' }, sessionFlow: SOFTWARE_PM_SESSION_FLOW,
    buildScheduleRows: () => buildSoftwarePmSchedule(), progressSummary: (p) => softwarePmProgressSummary(p),
    exportMarkdown: () => exportSoftwarePmCurriculumMarkdown(), downloadName: 'software-project-management-prove-it.md',
    interestTag: SOFTWARE_PM_INTEREST_TAG, helperTag: SOFTWARE_PM_HELPER_TAG, tutorCourseMeta: SOFTWARE_PM_TUTOR_META,
    interestText: (who) => `${SOFTWARE_PM_INTEREST_TAG} ${who} wants more Software Project Management lessons.`,
    interestCopy: {
      heading: 'Shipping something, or answerable for it staying up?',
      blurb: 'Tell Darrell what broke, or what you cannot currently prove about your own system. This course is taught from this house\u2019s own recorded outages rather than invented ones, so a real failure you name can become the next lesson.',
      cta: 'I\u2019d like more',
      sent: '\u2713 Sent \u2014 Darrell will see it. A green pipeline is not a live site, and the next lesson may well be yours.',
    },
  },
  {
    key: 'world-issues', wiring: 'self-paced', unitCap: 'Issue',
    meta: { ...WORLD_ISSUES_META, key: 'world-issues', category: 'The Word & The Way' }, sessionFlow: WORLD_ISSUES_SESSION_FLOW,
    buildScheduleRows: () => buildWorldIssuesSchedule(), progressSummary: (p) => worldIssuesProgressSummary(p),
    exportMarkdown: () => exportWorldIssuesCurriculumMarkdown(), downloadName: 'thinking-it-through-world-issues-discernment.md',
    interestTag: WORLD_ISSUES_INTEREST_TAG, helperTag: WORLD_ISSUES_HELPER_TAG, tutorCourseMeta: WORLD_ISSUES_TUTOR_META,
    interestText: (who) => `${WORLD_ISSUES_INTEREST_TAG} ${who} wants more World Issues discernment lessons.`,
    interestCopy: {
      heading: 'Want more discernment lessons?',
      blurb: 'Tell Darrell which world issue you’d like thought through The Way — documented truth spoken plainly, every side heard fairly, and the Word’s justice, with the verdict on a soul left to God. Read at your own pace, at any age.',
      cta: 'I’d like more',
      sent: '✓ Sent — Darrell will see what to think through next. We speak truth and hold grace.',
    },
  },
  {
    key: 'datasystems', wiring: 'self-paced', unitCap: 'Module',
    meta: { ...DATASYSTEMS_META, key: 'datasystems', category: 'Serve the House' }, sessionFlow: DATASYSTEMS_SESSION_FLOW,
    buildScheduleRows: () => buildDatasystemsSchedule(), progressSummary: (p) => datasystemsProgressSummary(p),
    exportMarkdown: () => exportDatasystemsCurriculumMarkdown(), downloadName: 'poetech-data-systems-and-infrastructure.md',
    interestTag: DATASYSTEMS_INTEREST_TAG, helperTag: DATASYSTEMS_HELPER_TAG, tutorCourseMeta: DATASYSTEMS_TUTOR_META,
    interestText: (who) => `${DATASYSTEMS_INTEREST_TAG} ${who} wants to learn the PoeTech data systems and infrastructure.`,
    interestCopy: {
      heading: 'Want to learn the systems?',
      blurb: 'Tell Darrell you want to come up to speed on the PoeTech data systems and the church tech stack — how it works, the equipment, and the skills — and he’ll get you started. Self-paced, plain language, at any experience level.',
      cta: 'I want to learn',
      sent: '✓ Sent — Darrell will get you onboarded. We steward the systems so the Body is equipped.',
    },
  },
  {
    key: 'handed-forward', wiring: 'self-paced', unitCap: 'Week',
    meta: { ...SUCCESSION_META, key: 'handed-forward', category: 'Kingdom Life & Stewardship' }, sessionFlow: SUCCESSION_SESSION_FLOW,
    buildScheduleRows: () => buildSuccessionSchedule(null), progressSummary: (p) => successionProgressSummary(p),
    exportMarkdown: () => exportSuccessionCurriculumMarkdown(), downloadName: 'handed-forward-succession-curriculum.md',
    interestTag: SUCCESSION_INTEREST_TAG, helperTag: SUCCESSION_HELPER_TAG, tutorCourseMeta: SUCCESSION_TUTOR_META,
    interestText: (who) => `${SUCCESSION_INTEREST_TAG} ${who} wants to take the Handed Forward succession course.`,
    interestCopy: {
      heading: 'Being raised to take over?',
      blurb: 'Tell Darrell you want to take Handed Forward — the succession course for the next generation. We hand you the mission, not our path: know the God of your father, learn to read the real books, and build what we could not. Self-paced, at any age.',
      cta: 'I want to learn',
      sent: '✓ Sent — Darrell will see you’re in. We hand it forward.',
    },
  },
  {
    // REAL ESTATE, COURSE THREE — the transaction between the two ends.
    key: 'buying-terms', wiring: 'self-paced', unitCap: 'Lesson',
    meta: { ...BUYING_TERMS_META, key: 'buying-terms', category: 'Real Estate' }, sessionFlow: BUYING_TERMS_SESSION_FLOW,
    buildScheduleRows: () => buildBuyingTermsSchedule(null), progressSummary: (p) => buyingTermsProgressSummary(p),
    exportMarkdown: () => exportBuyingTermsCurriculumMarkdown(null), downloadName: 'buying-price-terms-and-the-count-to-finish-curriculum.md',
    interestTag: BUYING_TERMS_INTEREST_TAG, helperTag: BUYING_TERMS_HELPER_TAG, tutorCourseMeta: BUYING_TERMS_TUTOR_META,
    interestText: (who) => `${BUYING_TERMS_INTEREST_TAG} ${who} wants a hand working a real purchase by these principles.`,
    interestCopy: {
      heading: 'Working a real purchase?',
      blurb: 'Tell Darrell you want a hand applying these eight to a deal in front of you \u2014 the price paid openly, one standard in both directions, what is still unverified before the closing date, any guarantee your name would go on, and the reserve that decides whether the loan is a tool. The whole course is free and open right here; this is for a hand with yours. Teaching, not legal or financial advice.',
      cta: 'I want help with mine',
      sent: '\u2713 Sent \u2014 Darrell will reach out. The cleanest deal is rarely the friendliest one.',
    },
  },
  {
    // REAL ESTATE, COURSE FOUR — the part with a person on the other side of it.
    key: 'leasing-tenants', wiring: 'self-paced', unitCap: 'Lesson',
    meta: { ...LEASING_TENANTS_META, key: 'leasing-tenants', category: 'Real Estate' }, sessionFlow: LEASING_TENANTS_SESSION_FLOW,
    buildScheduleRows: () => buildLeasingTenantsSchedule(null), progressSummary: (p) => leasingTenantsProgressSummary(p),
    exportMarkdown: () => exportLeasingTenantsCurriculumMarkdown(null), downloadName: 'leasing-and-tenant-selection-curriculum.md',
    interestTag: LEASING_TENANTS_INTEREST_TAG, helperTag: LEASING_TENANTS_HELPER_TAG, tutorCourseMeta: LEASING_TENANTS_TUTOR_META,
    interestText: (who) => `${LEASING_TENANTS_INTEREST_TAG} ${who} wants a hand leasing a real door by these principles.`,
    interestCopy: {
      heading: 'Filling a real door?',
      blurb: 'Tell Darrell you want a hand applying these eight to the door in front of you \u2014 written criteria applied the same way to everyone, what you verify before you answer, the terms read aloud before anyone signs, what your deposit and late-fee terms actually cost the household, and the order you follow when it goes wrong. The whole course is free and open right here; this is for a hand with yours. Teaching, not legal advice.',
      cta: 'I want help with mine',
      sent: '\u2713 Sent \u2014 Darrell will reach out. Remember the position; refuse the seating chart.',
    },
  },
  {
    // REAL ESTATE, COURSE FIVE — the building itself, and who keeps it standing.
    key: 'maintenance-trades', wiring: 'self-paced', unitCap: 'Lesson',
    meta: { ...MAINTENANCE_TRADES_META, key: 'maintenance-trades', category: 'Real Estate' }, sessionFlow: MAINTENANCE_TRADES_SESSION_FLOW,
    buildScheduleRows: () => buildMaintenanceTradesSchedule(null), progressSummary: (p) => maintenanceTradesProgressSummary(p),
    exportMarkdown: () => exportMaintenanceTradesCurriculumMarkdown(null), downloadName: 'maintenance-repairs-and-the-trades-curriculum.md',
    interestTag: MAINTENANCE_TRADES_INTEREST_TAG, helperTag: MAINTENANCE_TRADES_HELPER_TAG, tutorCourseMeta: MAINTENANCE_TRADES_TUTOR_META,
    interestText: (who) => `${MAINTENANCE_TRADES_INTEREST_TAG} ${who} wants a hand maintaining a real building by these principles.`,
    interestCopy: {
      heading: 'Working on a real building?',
      blurb: 'Tell Darrell you want a hand applying these eight to the building in front of you \u2014 a real service interval with real dates, which covered defects still need tracing to their source, what one deferral has actually cost you all in, and how your trades would describe being paid by you. The whole course is free and open right here; this is for a hand with yours. Teaching, not legal or trade advice.',
      cta: 'I want help with mine',
      sent: '\u2713 Sent \u2014 Darrell will reach out. Maintain at the rate of decay.',
    },
  },
  {
    // REAL ESTATE, COURSE SIX — the person standing next to you when you sign.
    key: 'partnerships', wiring: 'self-paced', unitCap: 'Lesson',
    meta: { ...PARTNERSHIPS_META, key: 'partnerships', category: 'Real Estate' }, sessionFlow: PARTNERSHIPS_SESSION_FLOW,
    buildScheduleRows: () => buildPartnershipsSchedule(null), progressSummary: (p) => partnershipsProgressSummary(p),
    exportMarkdown: () => exportPartnershipsCurriculumMarkdown(null), downloadName: 'partnerships-who-you-build-with-curriculum.md',
    interestTag: PARTNERSHIPS_INTEREST_TAG, helperTag: PARTNERSHIPS_HELPER_TAG, tutorCourseMeta: PARTNERSHIPS_TUTOR_META,
    interestText: (who) => `${PARTNERSHIPS_INTEREST_TAG} ${who} wants a hand weighing a real partnership by these principles.`,
    interestCopy: {
      heading: 'About to sign with somebody?',
      blurb: 'Tell Darrell you want a hand applying these eight to the arrangement in front of you \u2014 the four blanks answered separately by both parties, whether this is a yoke or a transaction, the exit mechanism written while you can still be generous about it, and an honest read on whether there is a mind to work. The whole course is free and open right here; this is for a hand with yours. Teaching, not legal advice.',
      cta: 'I want help with mine',
      sent: '\u2713 Sent \u2014 Darrell will reach out. Agree first, then walk.',
    },
  },
  {
    // REAL ESTATE, COURSE SEVEN — the money behind every other course, and the party on the other end of it.
    key: 'financing-debt', wiring: 'self-paced', unitCap: 'Lesson',
    meta: { ...FINANCING_DEBT_META, key: 'financing-debt', category: 'Real Estate' }, sessionFlow: FINANCING_DEBT_SESSION_FLOW,
    buildScheduleRows: () => buildFinancingDebtSchedule(null), progressSummary: (p) => financingDebtProgressSummary(p),
    exportMarkdown: () => exportFinancingDebtCurriculumMarkdown(null), downloadName: 'financing-the-debt-you-sign-curriculum.md',
    interestTag: FINANCING_DEBT_INTEREST_TAG, helperTag: FINANCING_DEBT_HELPER_TAG, tutorCourseMeta: FINANCING_DEBT_TUTOR_META,
    interestText: (who) => `${FINANCING_DEBT_INTEREST_TAG} ${who} wants a hand reading a real note by these principles.`,
    interestCopy: {
      heading: 'Carrying a note, or about to sign one?',
      blurb: 'Tell Darrell you want a hand applying these eight to the financing in front of you \u2014 your position written as one sentence with real names, every date the note can change state with the notice beside it, the obligations you have quietly stopped intending to pay, and what is already in your house that could produce. The whole course is free and open right here; this is for a hand with yours. Teaching, not legal or financial advice.',
      cta: 'I want help with mine',
      sent: '\u2713 Sent \u2014 Darrell will reach out. Know your position, then work it.',
    },
  },
  {
    // REAL ESTATE, COURSE EIGHT — what the authorities take, and what you can prove.
    key: 'taxes-records', wiring: 'self-paced', unitCap: 'Lesson',
    meta: { ...TAXES_RECORDS_META, key: 'taxes-records', category: 'Real Estate' }, sessionFlow: TAXES_RECORDS_SESSION_FLOW,
    buildScheduleRows: () => buildTaxesRecordsSchedule(null), progressSummary: (p) => taxesRecordsProgressSummary(p),
    exportMarkdown: () => exportTaxesRecordsCurriculumMarkdown(null), downloadName: 'taxes-and-records-what-you-can-show-curriculum.md',
    interestTag: TAXES_RECORDS_INTEREST_TAG, helperTag: TAXES_RECORDS_HELPER_TAG, tutorCourseMeta: TAXES_RECORDS_TUTOR_META,
    interestText: (who) => `${TAXES_RECORDS_INTEREST_TAG} ${who} wants a hand on an assessment or a record they cannot produce.`,
    interestCopy: {
      heading: 'Paying an assessment you cannot explain?',
      blurb: 'Tell Darrell you want a hand applying these eight to your own papers — the three questions that judge a levy better than its rate, the itemised annual total almost nobody has assembled, the ten-minute drill on the document you would need first, and the one column that sends no notice. The whole course is free and open right here; this is for a hand with yours. Teaching, not tax or legal advice.',
      cta: 'I want help with mine',
      sent: '\u2713 Sent \u2014 Darrell will reach out. Know what you owe, and keep what you can show.',
    },
  },
  {
    // Darrell 2026-09-19: "Banking courses etc..." — named as a gap in the same
    // breath as the plain-words work (DR-0519), and the two belong together: a
    // person looking for this course is thinking the word BANK, not the word
    // stewardship. Filed under Kingdom Life & Stewardship beside Kingdom
    // Economics; no book-and-chapter is shared with any of that department's
    // other courses, which the course test checks rather than assumes.
    key: 'banking', wiring: 'self-paced', unitCap: 'Lesson',
    meta: { ...BANKING_META, key: 'banking', category: 'Kingdom Life & Stewardship' }, sessionFlow: BANKING_SESSION_FLOW,
    buildScheduleRows: () => buildBankingSchedule(null), progressSummary: (p) => bankingProgressSummary(p),
    exportMarkdown: () => exportBankingCurriculumMarkdown(null), downloadName: 'banking-what-the-bank-does-with-your-money-curriculum.md',
    interestTag: BANKING_INTEREST_TAG, helperTag: BANKING_HELPER_TAG, tutorCourseMeta: BANKING_TUTOR_META,
    interestText: (who) => `${BANKING_INTEREST_TAG} ${who} wants a hand on an account, a fee, or a debt that is getting away from them.`,
    interestCopy: {
      heading: 'Money getting away from you?',
      blurb: 'Tell Darrell you want a hand applying these eight to your own accounts \u2014 the two numbers on your statement nobody prints together, the signature you were asked for and can still refuse, the store you can start in a summer month, and the fee total almost nobody has ever added up. The whole course is free and open right here; this is for a hand with yours. Teaching, not financial or legal advice.',
      cta: 'I want help with mine',
      sent: '\u2713 Sent \u2014 Darrell will reach out. Know what it is for, and know what is holding you up.',
    },
  },
  {
    // COURSE ONE OF THE STOCK MARKET DEPARTMENT. Darrell 2026-09-19: "Stock
    // Market courses to explore and explain the world of stock and bonds and
    // countries that trade and how investment works world wide." Four courses
    // were planned: stocks, bonds, the world market, and how investing works.
    // This is the first, and it is deliberately the one that replaces a
    // picture -- the way Banking opens by replacing the drawer. The picture
    // here is that a share is a number on a screen. It is a piece of a
    // company, and every confusion downstream grows from forgetting it.
    //
    // Its own gates hold two lines: Matthew 25 is NOT presented as an
    // endorsement of equity investing (DR-0098), and no live figure is quoted
    // anywhere -- only dated rules and labelled arithmetic (DR-0076), because
    // a number printed in a lesson is wrong by the time it is read.
    key: 'stocks', wiring: 'self-paced', unitCap: 'Lesson',
    meta: { ...STOCKS_META, key: 'stocks', category: 'Stock Market' }, sessionFlow: STOCKS_SESSION_FLOW,
    buildScheduleRows: () => buildStocksSchedule(null), progressSummary: (p) => stocksProgressSummary(p),
    exportMarkdown: () => exportStocksCurriculumMarkdown(null), downloadName: 'stocks-what-you-actually-own-when-you-buy-a-share-curriculum.md',
    interestTag: STOCKS_INTEREST_TAG, helperTag: STOCKS_HELPER_TAG, tutorCourseMeta: STOCKS_TUTOR_META,
    interestText: (who) => `${STOCKS_INTEREST_TAG} ${who} wants a hand understanding shares, a pension statement, or something they already hold.`,
    interestCopy: {
      heading: 'Never had it explained?',
      blurb: 'Tell Darrell you want a hand working these eight through something real \u2014 the fact that your purchase gives the company nothing, the gap between a bid and an ask that nobody bills you for, the share count that tells you what no letter tells you, and the weighting behind every headline about the market. The whole course is free and open right here; this is for a hand with yours. No company, fund or product is named anywhere in it. Teaching, not financial advice.',
      cta: 'I want help understanding mine',
      sent: '\u2713 Sent \u2014 Darrell will reach out. Understand the machinery, then ask the question the screen never asks.',
    },
  },
  {
    // COURSE TWO OF THE STOCK MARKET DEPARTMENT. Course one answered STOCK;
    // this one answers BONDS, and it is the other half of a question course
    // one set up and deliberately left open: a shareholder is paid LAST and is
    // owed nothing, a bondholder is paid FIRST and is owed a specific sum on a
    // specific date. Everything else about the two instruments follows.
    //
    // Its hardest line is lesson eight. Deuteronomy 23:19-20 is habitually
    // quoted in halves and each half is used to prove the opposite of the
    // other; this course teaches BOTH clauses from the text, names what they
    // settle and what they do not, and refuses both over-reaches (DR-0098).
    key: 'bonds', wiring: 'self-paced', unitCap: 'Lesson',
    meta: { ...BONDS_META, key: 'bonds', category: 'Stock Market' }, sessionFlow: BONDS_SESSION_FLOW,
    buildScheduleRows: () => buildBondsSchedule(null), progressSummary: (p) => bondsProgressSummary(p),
    exportMarkdown: () => exportBondsCurriculumMarkdown(null), downloadName: 'bonds-lending-to-companies-and-to-countries-curriculum.md',
    interestTag: BONDS_INTEREST_TAG, helperTag: BONDS_HELPER_TAG, tutorCourseMeta: BONDS_TUTOR_META,
    interestText: (who) => `${BONDS_INTEREST_TAG} ${who} wants a hand with a debt, a pension holding, or something they were told was safe.`,
    interestCopy: {
      heading: 'Told it was safe?',
      blurb: 'Tell Darrell you want a hand working these eight through something real \u2014 the two different things the word safe gets used for, the fraction of a borrower\u2019s income already spoken for, the question that decides a country\u2019s debt, and the loss that happens with no letter and no announcement. The whole course is free and open right here; this is for a hand with yours. If you are the one in debt rather than the one lending, say so \u2014 lessons three and five are about what is happening to you. Teaching, not financial advice.',
      cta: 'I want help with mine',
      sent: '\u2713 Sent \u2014 Darrell will reach out. Know what you are owed, and know who is on the other side.',
    },
  },
  {
    // COURSE THREE OF THE STOCK MARKET DEPARTMENT. Courses one and two were
    // each about an INSTRUMENT held by a person -- a share, a bond. This one is
    // about the system those instruments sit inside, and it answers the half of
    // Darrell's sentence neither of them touched: countries that trade.
    //
    // Its hardest line is lesson three. "Trade deficit" is among the most
    // confidently misused phrases in public life and the confusion is not
    // partisan, it is arithmetic: a deficit is not a debt, nobody is owed
    // anything at the end of a year of one, and the money that went out came
    // back. Saying that plainly is not taking a side, and this course takes
    // none -- it names no country as a villain and none as a model, holds no
    // position on any live dispute, and quotes no figure, because balances and
    // rates move daily (DR-0098 / DR-0100).
    key: 'world-market', wiring: 'self-paced', unitCap: 'Lesson',
    meta: { ...WORLD_MARKET_META, key: 'world-market', category: 'Stock Market' }, sessionFlow: WORLD_MARKET_SESSION_FLOW,
    buildScheduleRows: () => buildWorldMarketSchedule(null), progressSummary: (p) => worldMarketProgressSummary(p),
    exportMarkdown: () => exportWorldMarketCurriculumMarkdown(null), downloadName: 'the-world-market-countries-that-trade-curriculum.md',
    interestTag: WORLD_MARKET_INTEREST_TAG, helperTag: WORLD_MARKET_HELPER_TAG, tutorCourseMeta: WORLD_MARKET_TUTOR_META,
    interestText: (who) => `${WORLD_MARKET_INTEREST_TAG} ${who} wants a hand with a headline, a price that moved, or a job that depends on something crossing a border.`,
    interestCopy: {
      heading: 'Heard the headline and did not know whether to worry?',
      blurb: 'Tell Darrell you want a hand working these eight through something real \u2014 the word deficit and what it actually means, why a falling currency helps some people at home and hurts others, what a central bank can and cannot do, and what closing a pipe costs the household standing next to the target. The whole course is free and open right here; this is for a hand with yours. If your own job or your own town is on the losing side of a trade, say so \u2014 lessons one and seven are about that, and nobody here will tell you the aggregate is positive. Teaching, not financial or policy advice.',
      cta: 'I want help understanding it',
      sent: '\u2713 Sent \u2014 Darrell will reach out. Know the machinery, and carry a just weight across the border.',
    },
  },
  {
    // COURSE FOUR OF THE STOCK MARKET DEPARTMENT, and the last quarter of the
    // sentence that opened it. Courses one to three taught MACHINERY -- what a
    // share is, what a bond is, what a deficit is -- and a reader handed those
    // is strictly better off. This one is about a DECISION, which is precisely
    // where teaching turns into telling somebody what to do with their money
    // without anybody noticing the step.
    //
    // So it is built to refuse that. Every lesson ends by handing the reader a
    // QUESTION for their own situation rather than an answer this house
    // supplies; no product, fund, company, platform, allocation or strategy is
    // named anywhere in it; no figure is quoted and no forecast is made. Its
    // last three lessons are whose money is it, what is it for, and how much is
    // enough -- which is why it is cross-listed onto the stewardship shelf as
    // firmly as onto the market one.
    key: 'investing', wiring: 'self-paced', unitCap: 'Lesson',
    meta: { ...INVESTING_META, key: 'investing', category: 'Stock Market' }, sessionFlow: INVESTING_SESSION_FLOW,
    buildScheduleRows: () => buildInvestingSchedule(null), progressSummary: (p) => investingProgressSummary(p),
    exportMarkdown: () => exportInvestingCurriculumMarkdown(null), downloadName: 'how-investing-actually-works-curriculum.md',
    interestTag: INVESTING_INTEREST_TAG, helperTag: INVESTING_HELPER_TAG, tutorCourseMeta: INVESTING_TUTOR_META,
    interestText: (who) => `${INVESTING_INTEREST_TAG} ${who} wants a hand working out what they are actually holding, what it costs, and what it is for.`,
    interestCopy: {
      heading: 'Told you ought to be investing?',
      blurb: 'Tell Darrell you want a hand working these eight through something real \u2014 the four different things the word risk gets used for, the charge you have probably never looked at, what time actually does, and the three questions that come before any product is named. The whole course is free and open right here; this is for a hand with yours. Nothing in it names a product, a fund or a strategy, nothing tells you what to buy, and nothing quotes a figure. If you finish it harder to sell to, including by us, it worked. Teaching, not financial advice.',
      cta: 'I want help understanding mine',
      sent: '\u2713 Sent \u2014 Darrell will reach out. Whose is it, what is it for, and by when.',
    },
  },
  {
    // COURSE TWELVE OF THE REAL ESTATE DEPARTMENT. Eleven courses covered the
    // ground, the stewardship, the transaction, the tenant, the building, the
    // partner, the lender, the record, the loss, the looking and the hardest
    // hour. This one covers the number every one of them runs on and none of
    // them examines: what a thing is actually worth, and who says so. Built on
    // Leviticus 27, which almost nobody teaches and which turns out to be a
    // complete valuation statute -- a published schedule with an
    // ability-to-pay override, a binding estimate by a disinterested valuer,
    // land priced by harvests remaining, a fixed fifth-part premium, an expiry
    // with no reversion, and the unit defined in the same chapter.
    key: 'appraisal', wiring: 'self-paced', unitCap: 'Lesson',
    meta: { ...APPRAISAL_META, key: 'appraisal', category: 'Real Estate' }, sessionFlow: APPRAISAL_SESSION_FLOW,
    buildScheduleRows: () => buildAppraisalSchedule(null), progressSummary: (p) => appraisalProgressSummary(p),
    exportMarkdown: () => exportAppraisalCurriculumMarkdown(null), downloadName: 'appraisal-what-a-thing-is-actually-worth-curriculum.md',
    interestTag: APPRAISAL_INTEREST_TAG, helperTag: APPRAISAL_HELPER_TAG, tutorCourseMeta: APPRAISAL_TUTOR_META,
    interestText: (who) => `${APPRAISAL_INTEREST_TAG} ${who} wants a hand reading a valuation \u2014 or thinks something of theirs was valued wrongly.`,
    interestCopy: {
      heading: 'Was that number straight?',
      blurb: 'Tell Darrell you want a hand applying these eight to a real valuation \u2014 publishing the number you currently set by feel, checking who made the estimate and what they stood to gain, pricing the years remaining rather than the thing, and writing one unit out in full so you can find out whether you have been arguing about price or about the measure. The whole course is free and open right here; this is for a hand with yours. Teaching, not appraisal, tax or investment advice \u2014 nothing here produces a number for your property, so hire somebody licensed in your own state.',
      cta: 'I want help with mine',
      sent: '\u2713 Sent \u2014 Darrell will reach out. And if you think something of yours was valued wrongly, start at lesson two and lesson five.',
    },
  },
  {
    // COURSE ELEVEN OF THE REAL ESTATE DEPARTMENT. Ten courses covered the
    // ground, the stewardship, the transaction, the tenant, the building, the
    // partner, the lender, the record, the loss and the looking. This one
    // covers the hardest hour any of them can produce: the day somebody in
    // your building cannot pay and you are the one holding the power. What
    // Scripture restrains, over and over, is the METHOD and the MEMORY of the
    // one with the power -- it never cancels the debt anywhere in this
    // material, which is the limit the course test pins in both directions.
    key: 'evictions', wiring: 'self-paced', unitCap: 'Lesson',
    meta: { ...EVICTIONS_META, key: 'evictions', category: 'Real Estate' }, sessionFlow: EVICTIONS_SESSION_FLOW,
    buildScheduleRows: () => buildEvictionsSchedule(null), progressSummary: (p) => evictionsProgressSummary(p),
    exportMarkdown: () => exportEvictionsCurriculumMarkdown(null), downloadName: 'evictions-handled-righteously-curriculum.md',
    interestTag: EVICTIONS_INTEREST_TAG, helperTag: EVICTIONS_HELPER_TAG, tutorCourseMeta: EVICTIONS_TUTOR_META,
    interestText: (who) => `${EVICTIONS_INTEREST_TAG} ${who} is holding a situation where somebody cannot pay \u2014 or is the one behind and frightened.`,
    interestCopy: {
      heading: 'Somebody cannot pay?',
      blurb: 'Tell Darrell you want a hand applying these eight to a real situation \u2014 standing outside the door rather than walking in, naming the millstone before anything is taken, writing the window at both ends before you need it, and listing what you are holding that is not yours. If you are the one behind and frightened, say so and start at lesson three and lesson eight. The whole course is free and open right here; this is for a hand with yours. Teaching, not legal advice \u2014 get somebody licensed in your own state before you act.',
      cta: 'I want help with mine',
      sent: '\u2713 Sent \u2014 Darrell will reach out. And if you are the one behind, start at lesson three, which is about what may not be done to you.',
    },
  },
  {
    // COURSE TEN OF THE REAL ESTATE DEPARTMENT. Nine courses covered the
    // ground, the stewardship, the transaction, the tenant, the building, the
    // partner, the lender, the record and the loss. This one covers the act
    // every one of them depends on and none of them teaches: LOOKING at a
    // thing properly before you are bound to it. Built on the complete staged
    // inspection in Leviticus 14 -- report, empty the house, look, wait, look
    // again, targeted repair, re-inspect, and a rule for when it comes down.
    key: 'inspections', wiring: 'self-paced', unitCap: 'Lesson',
    meta: { ...INSPECTIONS_META, key: 'inspections', category: 'Real Estate' }, sessionFlow: INSPECTIONS_SESSION_FLOW,
    buildScheduleRows: () => buildInspectionsSchedule(null), progressSummary: (p) => inspectionsProgressSummary(p),
    exportMarkdown: () => exportInspectionsCurriculumMarkdown(null), downloadName: 'inspections-what-you-look-at-before-you-sign-curriculum.md',
    interestTag: INSPECTIONS_INTEREST_TAG, helperTag: INSPECTIONS_HELPER_TAG, tutorCourseMeta: INSPECTIONS_TUTOR_META,
    interestText: (who) => `${INSPECTIONS_INTEREST_TAG} ${who} wants a hand looking at a building properly before signing, or has already signed and found something.`,
    interestCopy: {
      heading: 'About to sign for a building?',
      blurb: 'Tell Darrell you want a hand applying these eight to a real building \u2014 the seven steps Yahweh wrote into Leviticus 14, what to move out before anybody inspects, your own six answerable pairs, the one question worth scoping down to, and where to send your one specialist if you can only afford one. The whole course is free and open right here; this is for a hand with yours. Teaching, not inspection, legal or engineering advice \u2014 hire somebody licensed in your own state, and an engineer for anything structural.',
      cta: 'I want help with mine',
      sent: '\u2713 Sent \u2014 Darrell will reach out. And if you have already signed and already found something, start at lesson four and lesson eight.',
    },
  },
  {
    // COURSE NINE OF THE REAL ESTATE DEPARTMENT. Eight courses covered the
    // ground, the stewardship, the transaction, the tenant, the building, the
    // partner, the lender and the record. This one covers the thing every one
    // of them assumes and none of them handles: what happens when it goes
    // wrong, who bears the cost, and how a household decides in advance what
    // it cannot afford to lose. No book-and-chapter is shared with the other
    // courses of this department, which the course test checks rather than
    // assumes.
    key: 'insurance-risk', wiring: 'self-paced', unitCap: 'Lesson',
    meta: { ...INSURANCE_RISK_META, key: 'insurance-risk', category: 'Real Estate' }, sessionFlow: INSURANCE_RISK_SESSION_FLOW,
    buildScheduleRows: () => buildInsuranceRiskSchedule(null), progressSummary: (p) => insuranceRiskProgressSummary(p),
    exportMarkdown: () => exportInsuranceRiskCurriculumMarkdown(null), downloadName: 'insurance-and-risk-what-you-cannot-afford-to-lose-curriculum.md',
    interestTag: INSURANCE_RISK_INTEREST_TAG, helperTag: INSURANCE_RISK_HELPER_TAG, tutorCourseMeta: INSURANCE_RISK_TUTOR_META,
    interestText: (who) => `${INSURANCE_RISK_INTEREST_TAG} ${who} wants a hand reading their own cover, or is carrying a loss that already happened.`,
    interestCopy: {
      heading: 'Not sure what you are actually covered for?',
      blurb: 'Tell Darrell you want a hand applying these eight to your own situation — the hazards you already knew about, the sentence in your agreement that says who pays when nobody was at fault, the two numbers that belong on one line, and the names of the people a loss would actually reach. The whole course is free and open right here; this is for a hand with yours. Teaching, not insurance or legal advice — anything that turns on wording needs somebody licensed in your own state.',
      cta: 'I want help with mine',
      sent: '✓ Sent — Darrell will reach out. And if a loss has already happened, start at lesson four and lesson five.',
    },
  },
  {
    // THE CAPSTONE OF THE REAL ESTATE DEPARTMENT — the other end Darrell named.
    key: 'management-stewardship', wiring: 'self-paced', unitCap: 'Lesson',
    meta: { ...MANAGEMENT_STEWARDSHIP_META, key: 'management-stewardship', category: 'Real Estate' }, sessionFlow: MANAGEMENT_STEWARDSHIP_SESSION_FLOW,
    buildScheduleRows: () => buildManagementStewardshipSchedule(null), progressSummary: (p) => managementStewardshipProgressSummary(p),
    exportMarkdown: () => exportManagementStewardshipCurriculumMarkdown(null), downloadName: 'management-is-stewardship-curriculum.md',
    interestTag: MANAGEMENT_STEWARDSHIP_INTEREST_TAG, helperTag: MANAGEMENT_STEWARDSHIP_HELPER_TAG, tutorCourseMeta: MANAGEMENT_STEWARDSHIP_TUTOR_META,
    interestText: (who) => `${MANAGEMENT_STEWARDSHIP_INTEREST_TAG} ${who} wants help holding the management standard on real property.`,
    interestCopy: {
      heading: 'Want a hand holding this standard?',
      blurb: 'Tell Darrell you want help running property the way this course teaches it \u2014 the record an owner could pick up, the hazards with dates on them, the response times measured rather than remembered, and the lawful charges you are willing to justify out loud. The whole course is free and open right here; this is for a hand with yours. Teaching, not legal or financial advice.',
      cta: 'I want help with mine',
      sent: '\u2713 Sent \u2014 Darrell will reach out. Faithful is the measurement, and it is taken at the least.',
    },
  },
  {
    // COURSE ONE OF THE REAL ESTATE DEPARTMENT. The category string is what
    // creates the department (learn-organize.js derives departments from each
    // course's meta.category), so no new machinery is needed for the shelf --
    // only real courses to stand on it.
    key: 'property-principle', wiring: 'self-paced', unitCap: 'Lesson',
    meta: { ...PROPERTY_PRINCIPLE_META, key: 'property-principle', category: 'Real Estate' }, sessionFlow: PROPERTY_PRINCIPLE_SESSION_FLOW,
    buildScheduleRows: () => buildPropertyPrincipleSchedule(null), progressSummary: (p) => propertyPrincipleProgressSummary(p),
    exportMarkdown: () => exportPropertyPrincipleCurriculumMarkdown(null), downloadName: 'why-owned-property-is-a-principle-curriculum.md',
    interestTag: PROPERTY_PRINCIPLE_INTEREST_TAG, helperTag: PROPERTY_PRINCIPLE_HELPER_TAG, tutorCourseMeta: PROPERTY_PRINCIPLE_TUTOR_META,
    interestText: (who) => `${PROPERTY_PRINCIPLE_INTEREST_TAG} ${who} wants to work the property principles on their own ground.`,
    interestCopy: {
      heading: 'Working this on your own property?',
      blurb: 'Tell Darrell you want a hand applying the eight principles to a place you own, rent, or manage \u2014 the real boundary, the honest term, the records in one place, the wage paid before sundown, and a successor who is actually being taught. The whole course is free and open right here; this is for a hand with yours. Teaching, not legal or financial advice.',
      cta: 'I want help with mine',
      sent: '\u2713 Sent \u2014 Darrell will reach out. He kept the title; we hold the use.',
    },
  },
  {
    // COURSE ONE OF THE HISTORY DEPARTMENT (Darrell 2026-09-22: "We need
    // history to reflect actual history... Courses on Historical Truth Light
    // from Yahweh's perspectives... American Historical accuracy from the
    // beginning... least of these and fatherless and widows narratives... two
    // or more gather together there He will be in the midst"). Measured before
    // it was built: ten departments, none of them History; no course taught
    // American history at all. The category string opens the department
    // (learn-organize.js derives departments from meta.category).
    key: 'history-truth', wiring: 'self-paced', unitCap: 'Lesson',
    meta: { ...HISTORY_META, key: 'history-truth', category: 'History' }, sessionFlow: HISTORY_SESSION_FLOW,
    buildScheduleRows: () => buildHistorySchedule(null), progressSummary: (p) => historyProgressSummary(p),
    exportMarkdown: () => exportHistoryCurriculumMarkdown(null), downloadName: 'historical-truth-american-history-in-the-light-of-the-word-curriculum.md',
    interestTag: HISTORY_INTEREST_TAG, helperTag: HISTORY_HELPER_TAG, tutorCourseMeta: HISTORY_TUTOR_META,
    interestText: (who) => `${HISTORY_INTEREST_TAG} ${who} wants a hand reading history under the Word, or has a family record to work through.`,
    interestCopy: {
      heading: 'Want a hand with your own family’s history?',
      blurb: 'Tell Darrell you want help working the eight moves on a real record — the elder to ask, the decade to measure by the fatherless, the widow and the stranger, the title to trace, the one name to find, the second weight in your own state, the gleaning field in your own town, and the two or three witnesses to gather at your table. Teaching, not a substitute for the record: every date here points to the census, the statute, the treaty or the testimony it came from, and you are meant to check it.',
      cta: 'I want help with mine',
      sent: '✓ Sent — Darrell will reach out. The Word is true from the beginning; the record is read under it.',
    },
  },
  {
    // COURSE TWO OF THE HISTORY DEPARTMENT (Darrell 2026-09-23: "Let's use the
    // 1619 project as a history or historical research 1 level competencies
    // based on those professors work... Word first research and then Lessons
    // as our Ways and documentation mandated"). The craft, taught on one case:
    // eight Level-1 competencies, every verse verbatim, every historical voice
    // verified against its source on a runner before it was written in.
    key: 'historical-research-1619', wiring: 'self-paced', unitCap: 'Lesson',
    meta: { ...HISTORICAL_RESEARCH_META, key: 'historical-research-1619', category: 'History' }, sessionFlow: HISTORICAL_RESEARCH_SESSION_FLOW,
    buildScheduleRows: () => buildHistoricalResearchSchedule(null), progressSummary: (p) => historicalResearchProgressSummary(p),
    exportMarkdown: () => exportHistoricalResearchCurriculumMarkdown(null), downloadName: 'historical-research-level-1-the-1619-project-as-the-case-curriculum.md',
    interestTag: HISTORICAL_RESEARCH_INTEREST_TAG, helperTag: HISTORICAL_RESEARCH_HELPER_TAG, tutorCourseMeta: HISTORICAL_RESEARCH_TUTOR_META,
    interestText: (who) => `${HISTORICAL_RESEARCH_INTEREST_TAG} ${who} wants a hand working a claim, a document or a dispute through the eight competencies.`,
    interestCopy: {
      heading: 'Want a hand with a claim of your own?',
      blurb: 'Tell Darrell you want help working the eight competencies on a real case — a claim to sort, a record to find, a second witness to hunt, a dispute to table, a correction to trace, or the two paragraphs to write with their sources. Teaching, not a substitute for the record: every document this course names can be read in full where it points, and you are meant to check it.',
      cta: 'I want help with mine',
      sent: '✓ Sent — Darrell will reach out. Prove all things; establish every word at the mouth of two or three witnesses.',
    },
  },
  {
    key: 'legacy-provisions', wiring: 'self-paced', unitCap: 'Lesson',
    meta: { ...LEGACY_PROVISIONS_META, key: 'legacy-provisions', category: 'Kingdom Life & Stewardship' }, sessionFlow: LEGACY_PROVISIONS_SESSION_FLOW,
    buildScheduleRows: () => buildLegacyProvisionsSchedule(null), progressSummary: (p) => legacyProvisionsProgressSummary(p),
    exportMarkdown: () => exportLegacyProvisionsCurriculumMarkdown(null), downloadName: 'secure-the-legacy-provisions-curriculum.md',
    interestTag: LEGACY_PROVISIONS_INTEREST_TAG, helperTag: LEGACY_PROVISIONS_HELPER_TAG, tutorCourseMeta: LEGACY_PROVISIONS_TUTOR_META,
    interestText: (who) => `${LEGACY_PROVISIONS_INTEREST_TAG} ${who} wants help setting up the three provisions for their own house.`,
    interestCopy: {
      heading: 'Want the provisions for your own house?',
      blurb: 'Tell Darrell you want to work the three provisions for your family — the constitution the trust points at, the spendthrift wall, and produce-before-you-take. The whole course is free and open right here; this is for a hand with your own. Teaching, not legal advice — your attorney drafts the instrument.',
      cta: 'I want help with mine',
      sent: '✓ Sent — Darrell will reach out. Principles travel with the money, or the money leaves.',
    },
  },
  {
    key: 'kingdom-economics', wiring: 'self-paced', unitCap: 'Session',
    meta: { ...ECON_META, key: 'kingdom-economics', category: 'Kingdom Life & Stewardship' }, sessionFlow: ECON_SESSION_FLOW,
    buildScheduleRows: () => buildEconSchedule(null), progressSummary: (p) => econProgressSummary(p),
    exportMarkdown: () => exportEconCurriculumMarkdown(null), downloadName: 'kingdom-economics-curriculum.md',
    interestTag: ECON_INTEREST_TAG, helperTag: ECON_HELPER_TAG, tutorCourseMeta: ECON_TUTOR_META,
    interestText: (who) => `${ECON_INTEREST_TAG} ${who} wants to take the Kingdom Economics course.`,
    interestCopy: {
      heading: 'Want to learn Kingdom Economics?',
      blurb: 'Tell Darrell you want to take Kingdom Economics — the soul prospers first, the documented truth is told whole, and the Body builds ownership together. Self-paced or as a class, at every age.',
      cta: 'I want to learn',
      sent: '✓ Sent — Darrell will see you’re in. Prosper as your soul prospers.',
    },
  },
  {
    key: 'prophetic-voices', wiring: 'self-paced', unitCap: 'Voice',
    meta: { ...PV_META, key: 'prophetic-voices', category: 'The Word & The Way' }, sessionFlow: PV_SESSION_FLOW,
    buildScheduleRows: () => buildPvSchedule(null), progressSummary: (p) => pvProgressSummary(p),
    exportMarkdown: () => exportPvCurriculumMarkdown(null), downloadName: 'prophetic-voices-study.md',
    interestTag: PV_INTEREST_TAG, helperTag: PV_HELPER_TAG, tutorCourseMeta: PV_TUTOR_META,
    interestText: (who) => `${PV_INTEREST_TAG} ${who} wants to take the Prophetic Voices study.`,
    interestCopy: {
      heading: 'Ready to hear the Body’s own prophets?',
      blurb: 'Tell Darrell you want the Prophetic Voices study — the record of the Body’s own witnesses who named the truth at cost, cited to their real work and weighed by the Word. Self-paced, one voice at a time.',
      cta: 'I want the record',
      sent: '✓ Sent — Darrell will see you’re in. We keep the record of the ones who told the truth.',
    },
  },
];

// Derived catalog totals — courses and finished lessons. This is the number the
// Learn header shows and the ≥ 40-lesson floor is asserted against. Never a
// hand-typed count (DR-0121).
export function learnCatalogSummary() {
  const lessons = LEARN_CATALOG.reduce((t, c) => t + c.buildScheduleRows().length, 0);
  return { courses: LEARN_CATALOG.length, lessons };
}

// THE DEPARTMENT IS THE REGISTRY'S TO DECLARE — a descriptor may never retype it.
// ===========================================================================
// Measured 2026-09-16 on the live church door: the A.I. The Way department read
// "AW · 1 course · 8 lessons" while THREE A.I. courses are registered here
// (ai:8, sovereign-ai:21, ai-legal-blueprint:6 = 35 lessons), and a phantom
// "General Studies" department held four courses that all declare a real
// category above. Cause: the cohort-wired descriptors are assembled in the host
// as `meta: { ...SOVEREIGN_AI_META, key: 'sovereign-ai' }` — the key is carried,
// the registry's `category` is not, so courseDepartment() fell through to its
// General Studies default and the whole A.I. shelf looked like one small class.
// The category was never missing from the registry; it was dropped in transit.
//
// So the merge is a function, not a literal: every mounted descriptor builds its
// meta HERE, from this registry, and cannot drop what it does not retype
// (DR-0149, DR-0121). A key with no entry keeps whatever the meta carries rather
// than inventing a department — never painted.
export function catalogCategory(key) {
  const entry = LEARN_CATALOG.find((c) => c.key === key);
  return (entry && entry.meta && entry.meta.category) || null;
}

/** A mounted course's meta: its own, plus the key and the department the registry declares. */
export function catalogMeta(key, meta = null) {
  const category = catalogCategory(key);
  const base = { ...(meta || {}), key };
  return category ? { ...base, category } : base;
}

// The helper tag for a course key — replaces the host's hand-typed ternary
// chain so a course added to the catalog is automatically covered.
export function helperTagForCourse(courseKey) {
  const entry = LEARN_CATALOG.find((c) => c.key === courseKey);
  return (entry && entry.helperTag) || '[Class helper]';
}

// Build the SELF-PACED course descriptors for the Learn tab from the registry.
// `submitInterestFor(entry)` returns the descriptor's submitInterest (or null);
// `rosterFor(entry)` returns the Governor roster (or null). Cohort courses keep
// their bespoke host descriptors — but they are registered above so counting
// and the render gate cover them.
export function buildSelfPacedDescriptors({ submitInterestFor = null, rosterFor = null, engagementByAge = null } = {}) {
  return LEARN_CATALOG.filter((e) => e.wiring === 'self-paced').map((e) => ({
    meta: e.meta,
    sessionFlow: e.sessionFlow,
    schedule: e.buildScheduleRows(),
    cohortStart: null,
    cohortConfirmed: false,
    setCohortStart: null,
    confirmCohort: null,
    progressSummary: e.progressSummary,
    exportMarkdown: e.exportMarkdown,
    downloadName: e.downloadName,
    submitInterest: submitInterestFor ? submitInterestFor(e) : null,
    roster: rosterFor ? rosterFor(e) : null,
    interestCopy: e.interestCopy,
    tutorCourseMeta: e.tutorCourseMeta,
    engagementByAge,
  }));
}

// Test/harness helper — descriptors for EVERY registered course except the
// component-owned youth A.I. course (ChurchLearn always mounts that itself), so
// a render gate can click through the whole catalog.
export function buildCatalogCourseDescriptors() {
  return LEARN_CATALOG.filter((e) => e.wiring !== 'component').map((e) => ({
    meta: e.meta,
    sessionFlow: e.sessionFlow,
    schedule: e.buildScheduleRows(),
    cohortStart: null,
    cohortConfirmed: false,
    setCohortStart: null,
    confirmCohort: null,
    progressSummary: e.progressSummary,
    exportMarkdown: e.exportMarkdown,
    downloadName: e.downloadName,
    submitInterest: null,
    roster: null,
    interestCopy: e.interestCopy || null,
    tutorCourseMeta: e.tutorCourseMeta,
    engagementByAge: null,
  }));
}
