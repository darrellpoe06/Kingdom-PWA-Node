import React, { useState, useEffect, useMemo, useRef, useCallback, Suspense } from 'react';
import { SectionTitle, MetricCell, TabScroll, NavControls } from './components/shared.jsx';
// Contextual help — the discrete "?" that explains the current tab/tool (Ari's
// voice) + the optional first-run roadmap tour. lib/help-content.js is the one
// help registry every surface reads from. Small + always-present chrome, so it
// rides the initial bundle rather than a lazy chunk.
import HelpButton from './components/HelpButton.jsx';
import HelpWalkthrough from './components/HelpWalkthrough.jsx';
import { UpdatePrompt, InstallPrompt } from './components/PwaPrompts.jsx';
import InstallAppButton from './components/InstallAppButton.jsx';
import { TherapyReminder, AdvisementBanner } from './components/PromoBanners.jsx';
import Calendar from './components/Calendar.jsx';
import BooksAccounts from './components/BooksAccounts.jsx';
import { REMINDER_OPTIONS } from './lib/calendar-shared.js';
import { fmt, monthLabel } from './lib/format.js';
import { recordError } from './lib/error-journal.js';
import { recordView } from './lib/usage-events.js';
// Sync failures must be SEEN: console for diagnosis + the error journal for the
// steward board (a 'saved' row that never reached the cloud is a trust break).
const syncWarn = (label, e) => { console.warn(label, e); try { recordError({ source: 'sync', kind: 'runtime', message: `${label}: ${(e && e.message) || e}` }); } catch (_) { /* watcher never throws */ } };
import { LegalPlaceholder } from './components/Legal.jsx';
import { BooksEntities } from './components/BooksEntities.jsx';
import { Debts } from './components/Debts.jsx';
import { Inbound } from './components/Inbound.jsx';
import { ProjectsWrapper } from './components/Projects.jsx';
import AuthBanner from './components/AuthBanner.jsx';
import PasswordAuth from './components/PasswordAuth.jsx';
import { accessState } from './lib/access-gate.js';
import { PROPOSED_COHORT_START, resolveCohort, CLASS_INTEREST_TAG, extractClassRoster } from './lib/church-classes.js';
import { COLG_DEFAULT_CHURCH } from './lib/default-church.js';
import { LOVE_CORNER_BRAND, isChurchDoorContext } from './lib/church-own-door.js';
import { isTlcDoorContext } from './lib/tlc-door.js';
import TlcPublicDoor from './components/TlcPublicDoor.jsx';
import {
  BROADCAST_META, BROADCAST_SESSION_FLOW, BROADCAST_PROPOSED_COHORT_START,
  BROADCAST_INTEREST_TAG, BROADCAST_TUTOR_META,
  buildBroadcastSchedule, broadcastProgressSummary, exportBroadcastCurriculumMarkdown,
  resolveBroadcastCohort, SOP_SEQUENCES, SOP_CAPTURE_PIPELINE,
} from './lib/broadcast-class.js';
import {
  INFRA_META, INFRA_SESSION_FLOW, INFRA_PROPOSED_COHORT_START,
  INFRA_INTEREST_TAG, INFRA_TUTOR_META,
  buildInfraSchedule, infraProgressSummary, exportInfraCurriculumMarkdown,
  resolveInfraCohort, INFRA_SOP_SEQUENCES,
} from './lib/infrastructure-class.js';
import {
  SOVEREIGN_AI_META, SOVEREIGN_AI_SESSION_FLOW, SOVEREIGN_AI_PROPOSED_COHORT_START,
  SOVEREIGN_AI_INTEREST_TAG, SOVEREIGN_AI_TUTOR_META,
  buildSovereignAiSchedule, sovereignAiProgressSummary, exportSovereignAiCurriculumMarkdown,
  resolveSovereignAiCohort,
} from './lib/sovereign-ai-class.js';
import {
  AI_LEGAL_BLUEPRINT_META, AI_LEGAL_BLUEPRINT_SESSION_FLOW, AI_LEGAL_BLUEPRINT_PROPOSED_COHORT_START,
  AI_LEGAL_BLUEPRINT_INTEREST_TAG, AI_LEGAL_BLUEPRINT_TUTOR_META,
  buildAiLegalBlueprintSchedule, aiLegalBlueprintProgressSummary, exportAiLegalBlueprintCurriculumMarkdown,
  resolveAiLegalBlueprintCohort,
} from './lib/ai-legal-blueprint-class.js';
// SELF-PACED Learn courses (Living Lessons, Running the Board, World Issues,
// Data Systems, Handed Forward, Kingdom Economics, Prophetic Voices) all derive
// from the ONE course registry — a finished course can never again be built but
// left unsurfaced (Darrell 2026-07-08; lib/learn-catalog.js).
import { buildSelfPacedDescriptors, helperTagForCourse } from './lib/learn-catalog.js';
import { helperInterestText } from './lib/learn-framework.js';
import { engagementFeedbackText, aggregateEngagementByAge } from './lib/learn-engagement.js';
import { latestFinancialDocMs } from './lib/finance-activity.js';
import PrivateGate from './components/PrivateGate.jsx';
import NetworkStatus from './components/NetworkStatus.jsx';
import TTSControl from './components/TTSControl.jsx';
import TextSizeControl from './components/TextSizeControl.jsx';
import ReadingVoiceControl from './components/ReadingVoiceControl.jsx';
import Imported from './components/Imported.jsx';
import { useBrowserHistoryNav, useHistoryToggle } from './lib/nav-history.js';
import { useIdleReveal } from './lib/use-idle-reveal.js';
import { isReviewerModeOn, ReviewerModeBanner } from './lib/reviewer-mode.jsx';
import { onAuthChange, signOut } from './lib/supabase.js';
import { ensureTenantMembership, uploadFeedback, subscribeFeedback } from './lib/feedback-sync.js';
import { reportPresence } from './lib/access-metrics-sync.js';
import { entitiesSync } from './lib/entities-sync.js';
import { accountsSync } from './lib/accounts-sync.js';
import { debtsSync } from './lib/debts-sync.js';
import { transactionsSync } from './lib/transactions-sync.js';
import { projectsSync, mergeRemoteProjects } from './lib/projects-sync.js';
import { discussionsSync, mergeRemoteDiscussions, DISCUSSION_COLUMN_OF } from './lib/discussions-sync.js';
import { workspacesSync, mergeRemoteWorkspaces, WORKSPACE_COLUMN_OF } from './lib/workspaces-sync.js';
import { recipesSync, mergeRemoteRecipes, RECIPE_COLUMN_OF } from './lib/recipes-sync.js';
import { inquiriesSync } from './lib/inquiries-sync.js';
import { practiceLeadsSync, mergeRemoteLeads, LEAD_COLUMN_OF } from './lib/practice-leads-sync.js';
import { rentalsSync, mergeRemoteRentals, toRemoteStatus, toRemotePropertyType } from './lib/rentals-sync.js';
import { incidentsSync, incidentColumns } from './lib/incidents-sync.js';
import { inventoryItemsSync, mergeRemoteInventoryItems, INVENTORY_ITEM_COLUMN_OF } from './lib/inventory-items-sync.js';
import { inventoryMovementsSync, mergeRemoteMovements } from './lib/inventory-movements-sync.js';
import { recordEventsSync, mergeRemoteRecordEvents } from './lib/record-events-sync.js';
import { kitchenCountsSync, mergeRemoteCounts } from './lib/kitchen-counts-sync.js';
import { kitchenCountLinesSync, mergeRemoteCountLines } from './lib/kitchen-count-lines-sync.js';
import { purchaseOrdersSync, mergeRemotePurchaseOrders } from './lib/purchase-orders-sync.js';
import { purchaseOrderLinesSync, mergeRemotePurchaseOrderLines } from './lib/purchase-order-lines-sync.js';
import { createKitchenDispatchers } from './lib/kitchen-dispatchers.js';
import { makeHistoryEvent } from './lib/record-history.js';
import { FreshnessDot } from './components/FreshnessDot.jsx';
import SelfServeWelcome from './components/SelfServeWelcome.jsx';
import PinGate from './components/PinGate.jsx';
import { decideAccess, decidePersonaSelect, shouldIssueDeviceTrust, isPersonaGated, NEXT_STEP } from './lib/multi-point-auth.js';
import { hasUserPin, setUserPin, verifyUserPin, listPersonaPins, verifyPersonaPin } from './lib/pin.js';
import { isDeviceTrusted, trustThisDevice, forgetLocalDeviceTrust } from './lib/device-trust.js';
import { isBiometricEnrolled, isPlatformAuthenticatorAvailable, enrollBiometric, unlockWithBiometric } from './lib/webauthn.js';
import { contractorsSync, contractorColumns } from './lib/contractors-sync.js';
import { concernsSync, mergeRemoteConcerns, CONCERN_COLUMN_OF } from './lib/concerns-sync.js';
// 2026-07-05 live-data rails (0077): the audited device-local collections gain
// the same fail-soft sync everything else rides. See lib/doc-sync.js + live-rails.js.
import { gameSavesSync, subscriptionsSync, skillProfilesSync, prayerRequestsSync, churchVoiceSync } from './lib/doc-sync.js';
import { uploadSymbol as uploadWatchlistSymbol, removeSymbol as removeWatchlistSymbolRemote } from './lib/watchlist-sync.js';
import { pushModuleInterest, clearModuleInterest } from './lib/module-interest-sync.js';
import { makeSyncedListCrud, wireLiveRails } from './lib/live-rails.js';
import { SEED_CONCERNS } from './lib/concerns.js';
import { buildDemoPersonas, DEMO_PERSONA_META } from './lib/demo-data.js';
import VerifyBalances from './components/VerifyBalances.jsx';
// Overview dashboard — statically imported (NOT registry/lazy): overview is the
// landing view, so it belongs in the main chunk (no loading flash on first paint).
import { BigPictureDashboard } from './components/BigPictureDashboard.jsx';
import { dueDateFor, OPPORTUNITY_LIBRARY, matchOpportunities, capacityDecisionForNewProject } from './lib/opportunity-capacity.js';
import { getAssignments, dispatchState, addAssignment, removeAssignment, markDone as markAssignmentDone, reopen as reopenAssignment, setPayout as setAssignmentPayout } from './lib/assignments.js';
import { ChurchGiveFloater } from './components/ChurchGiving.jsx';
import LiveWorshipBar from './components/LiveWorshipBar.jsx';
import SectionBoundary from './components/SectionBoundary.jsx';
import UiIcon from './components/UiIcon.jsx';
// Scroll-anchor primitive (same mechanism that powers reading-resume + the
// font-size whiplash fix): capture the content element the reader is looking at,
// let the sticky header change height, restore it to the same viewport spot — so
// collapsing/opening the header chrome never makes the page jump.
import { captureAnchor, applyAnchor } from './lib/reading-position.js';
import { readHeaderCollapsed, writeHeaderCollapsed, nextCollapsed } from './lib/header-hideaway.js';
import { FeedbackModal, FeedbackPromotePanel } from './components/FeedbackCenter.jsx';
// Lazy-loaded feature surfaces now mount through the surface-mount registry
// (the modular spine). Their `() => import(...)` loaders + nav metadata live in
// ONE place — app/src/surfaces.js (DR-0078 §4.3) — instead of 23 inline
// `const X = lazy(...)` lines that every new-surface PR collided on (choke-point
// C1). Same lazy components, same chunks; only the declaration site moved.
import {
  About, Contractors1099, Cart, Practice, CRM, Markets, Rentals, Opportunities,
  Engagement, Choir, ServiceProgram, ChurchLearn, ConferenceModule,
  EventCenterModule, ConferenceVariance, ChurchObservation, EventManagement, BusMinistry,
  Pulpit, ScriptureLibrary, CommandServeCenter, ChurchVideoWall, DeviceInventory, ChurchInfraPlan, ThinkingSpace,
  CreationWorkspace, VoiceStudio, Study, BooksTransactions, HarvestLedger, Library,
  Inventory, Forecast, AdminConsole, ChefCorner, Games, TVTime,
  EternalAlgorithmsStudy, ChurchHome, MooreDivahs, TlcAssistant, ChurchProjects, CohortPrograms, Relationships,
} from './surfaces.js';
import { unionPreservingLocal, getInstanceId } from './lib/table-sync.js';
import { THEME_CSS, readThemePref, saveThemePref } from './lib/theme-css.js';
import { mergeTransactionsPreferCloud } from './lib/txn-dedupe.js';
import { syncIdentityKey } from './lib/sync-identity.js';
import { fetchSnapshot, pushSnapshot, buildSnapshotPayload, mergeKeepingLocalRoomPhotos } from './lib/snapshot-sync.js';
import { computeReserves } from './lib/financial-calcs.js';
import { deriveAccountBalances, deriveEntityRollups, deriveDebts } from './lib/financial-engineering.js';
import { payeeKey, applyCategoryToPayee } from './lib/categorize.js';
import { runVerifiedLedgerSync } from './lib/verified-ledger-sync.js';
import { N8N_BASE } from './lib/n8n-base.js';

// =============================================================================
// SEED DATA — v7 adds events array
//
// SEED_DATA — SANITIZED ASPIRATIONAL FAMILY (2026-06-01).
//
// This is NOT real Poe family data. It models a generic well-stewarded
// family profile for public-demo visitors to poetech.us. Addresses, LLC
// names, creditor names, family member names, and dollar amounts are all
// composites designed to demonstrate good-credit, multi-generational,
// non-blood-family-collaboration stewardship patterns per the binding
// SEED-DATA-AS-ASPIRATION + DATA-AS-EMPOWERMENT foundation docs.
//
// Real Poe family data lives in the Poe-family-configured instance only,
// never the public default seed.
//
// Phase 2 (post-vacation, with full research-review per
// feedback-research-first): replace this single-persona aspirational
// seed with a good/better/best multi-persona system showing different
// maturity levels + non-blood-family collaboration models. See
// docs/00-foundations/_root/SEED-DATA-AS-ASPIRATION.md +
// agent/memory/project_seed_data_aspirational_families.md.
// =============================================================================

// COLG_DEFAULT_CHURCH moved to lib/default-church.js (2026-07-03, Church-module
// extraction): the shell seed below and components/ChurchHome.jsx read the same
// single record across the module boundary. Imported at the top of this file.

// =============================================================================
export const SEED_DATA = {
  meta: { lastUpdated: '2026-05-17', monthOfData: 'May 2026', bufferTarget: 5000, bufferCurrent: 0, appVersion: '28.1', releaseLabel: 'MVP v1.5', releaseNote: 'Real Estate ops (lease · tenant contact · equipment · rooms) + Buffer Fund widget + Capex list. WCAG 2.1 AA holds across new fields.', moduleSlug: 'financial', taxStructure: { filing: 'joint-1040', scheduleC: ['e-tlc', 'e-poetech'], scheduleE: ['e-poeprops'], sCorpElected: [], withholdingCoversFederal: true, withholdingCoversState: true, state: 'IL', county: 'Cedar Heights', propertyTaxEscrowed: true }},
  entities: [
    // Multi-user Layer A (2026-05-28) — `visibleTo` gates per-profile views.
    // Layer A is UX privacy (client-side filter); Layer B will add sovereign
    // auth via workflow 21 + session token. See
    // docs/99-session-notes/2026-05-28-brief-multi-user-profiles.md.
    // 'family' profile sees everything; 'guest' sees only personal totals.
    { id: 'e-personal', name: 'Personal (Adam + Naomi)', type: 'personal', notes: 'Joint household', visibleTo: ['darrell', 'christina', 'family'] },
    { id: 'e-poeprops', name: 'Steward Real Estate LLC', type: 'business', notes: '11 rental doors', visibleTo: ['darrell'] },
    { id: 'e-poetech',  name: 'Cornerstone Tech LLC', type: 'business', notes: 'Tech consulting & products', visibleTo: ['darrell'] },
    { id: 'e-tlc',      name: 'Wellness Counseling Practice LLC', type: 'business', notes: "Naomi's MSW practice", visibleTo: ['darrell', 'christina'] },
  ],
  accounts: [
    // `openingBalance` = the account's balance at the start of its transaction
    // ledger. The displayed "Right now" balance is DERIVED: openingBalance +
    // sum of that account's cleared (settled) transactions. See the derived-
    // balance block in the Books → Tx component. The seed openings are set so
    // the derived "now" matches the intended display on first load, then moves
    // as real entries clear. Chase ...8168 opens at -130.29 because its cleared
    // seed history nets +4,353.29 → derived now = 4,223. Accounts with no seed
    // transactions open at their balance (cleared sum = 0 → now = opening).
    { id: 'a-chase-pers-8168', entityId: 'e-personal', name: 'Personal Checking A', institution: 'Bank A', type: 'checking', fragment: '...8168', balance: 4223, openingBalance: -130.29 },
    { id: 'a-chase-pers-3322', entityId: 'e-personal', name: 'Personal Checking B', institution: 'Bank A', type: 'checking', fragment: '...3322', balance: 1200, openingBalance: 1200 },
    { id: 'a-cc-amex-dp', entityId: 'e-personal', name: 'Card J (Adam)', institution: 'Card J', type: 'credit', fragment: '...AD', balance: -19811, openingBalance: -19811 },
    { id: 'a-cc-chase-freedom', entityId: 'e-personal', name: 'Card F (Rewards)', institution: 'Bank A', type: 'credit', fragment: '', balance: -12992, openingBalance: -12992 },
    { id: 'a-cc-chase-sapph', entityId: 'e-personal', name: 'Card F (Travel)', institution: 'Bank A', type: 'credit', fragment: '', balance: -29948, openingBalance: -29948 },
    { id: 'a-poeprops-op', entityId: 'e-poeprops', name: 'Steward RE Operating', institution: 'TBD', type: 'checking', fragment: 'TBD', balance: 0, openingBalance: 0 },
    { id: 'a-poetech-op', entityId: 'e-poetech', name: 'Cornerstone Tech Operating', institution: 'TBD', type: 'checking', fragment: 'TBD', balance: 0, openingBalance: 0 },
    { id: 'a-poetech-cc', entityId: 'e-poetech', name: 'Business Card A', institution: 'Bank B', type: 'credit', fragment: '...6281', balance: -7308, openingBalance: -7308 },
    { id: 'a-tlc-op', entityId: 'e-tlc', name: 'Wellness Practice Operating', institution: 'TBD', type: 'checking', fragment: 'TBD', balance: 0, openingBalance: 0 },
  ],
  transactions: [
    // Older settled history (dated back ~75 days from the demo "today" of
    // 2026-05-15) so the trailing -30/-60/-90 actuals are REAL per-period sums
    // that differ by window instead of one repeated constant. These are part of
    // the ...8168 cleared ledger that derives its "Right now" balance.
    { id: 't-h90', date: '2026-03-05', accountId: 'a-chase-pers-8168', amount: -1450.00, description: 'Mortgage payment', category: 'housing' },
    { id: 't-h60', date: '2026-04-02', accountId: 'a-chase-pers-8168', amount: -842.17, description: 'Groceries + household', category: 'groceries' },
    { id: 't-h30', date: '2026-04-20', accountId: 'a-chase-pers-8168', amount: -520.00, description: 'Utilities (gas + electric)', category: 'utilities' },
    { id: 't1', date: '2026-05-01', accountId: 'a-chase-pers-8168', amount: 500.00, description: 'Online Transfer from CHK ...8168', category: 'transfer', isTransfer: true },
    { id: 't5', date: '2026-05-04', accountId: 'a-chase-pers-8168', amount: 1150.00, description: 'Zelle from TENANT A (rent)', category: 'rental-income', entityOverride: 'e-poeprops' },
    { id: 't7', date: '2026-05-06', accountId: 'a-chase-pers-8168', amount: 2099.93, description: 'Regional University Payroll', category: 'salary' },
    { id: 't11', date: '2026-05-14', accountId: 'a-chase-pers-8168', amount: 2865.53, description: 'State Payroll (Naomi)', category: 'salary' },
    { id: 't13', date: '2026-05-15', accountId: 'a-chase-pers-8168', amount: 550.00, description: 'Zelle from TENANT B (rent)', category: 'rental-income', entityOverride: 'e-poeprops' },
  ],
  contractors1099: [
    { id: 'k1', direction: 'outbound', entityId: 'e-tlc', name: 'MSW Contractor 1', role: 'Licensed clinical contractor', ytdPaid: 8400, monthly: 2800, status: 'active' },
    { id: 'k2', direction: 'outbound', entityId: 'e-tlc', name: 'MSW Contractor 2', role: 'Licensed clinical contractor', ytdPaid: 7200, monthly: 2400, status: 'active' },
    { id: 'k3', direction: 'outbound', entityId: 'e-tlc', name: 'MSW Contractor 3', role: 'Licensed clinical contractor', ytdPaid: 6300, monthly: 2100, status: 'active' },
    // Round 10 fix — pipeline figures realigned to the Enterprise positioning
    // ($25K-$75K/mo retainers, $400-$800/hr senior rate). Old conservative
    // placeholders ($1.5K, $800, $1K) were leftover from a "side gig" framing
    // that contradicted the rest of the Dev/Ops messaging.
    { id: 'k4', direction: 'inbound', entityId: 'e-poetech', name: 'Regional Enterprise Client A', role: 'Enterprise network architecture · OT-IT integration', ytdReceived: 0, monthlyExpected: 25000, status: 'pipeline' },
    { id: 'k5', direction: 'inbound', entityId: 'e-poetech', name: 'Mid-market churches · AV + streaming systems', role: 'Multi-site AV install + ongoing managed services retainer', ytdReceived: 0, monthlyExpected: 4500, status: 'pipeline' },
    { id: 'k6', direction: 'inbound', entityId: 'e-poetech', name: 'Regional University Facilities (1099)', role: 'BAS / Siemens controls consulting — senior architect rate', ytdReceived: 0, monthlyExpected: 12000, status: 'possible' },
  ],
  taxCalendar: [
    { id: 'tx-1099-nec', month: 1, day: 31, name: '1099-NEC issuance', desc: 'Issue 1099-NEC to all contractors paid ≥ $600', entityIds: ['e-tlc'], applies: true },
    { id: 'tx-1096-paper', month: 2, day: 28, name: '1096 paper transmittal', desc: 'IRS Form 1096 for paper 1099s', entityIds: ['e-tlc'], applies: true },
    { id: 'tx-1040', month: 4, day: 15, name: 'Form 1040 due', desc: 'Joint return with Schedule C × 2, Schedule E', entityIds: ['e-personal'], applies: true },
    { id: 'tx-il-llc', month: 4, day: 30, name: 'IL LLC annual reports', desc: 'Illinois Secretary of State — $75/yr × 3 LLCs', entityIds: ['e-poeprops','e-poetech','e-tlc'], applies: true, amount: 225 },
    { id: 'tx-yearend', month: 12, day: 31, name: 'Year-end tax planning', desc: 'Charitable timing, Section 179, HSA, retirement max', entityIds: ['e-personal','e-tlc','e-poetech'], applies: true },
  ],
  recurringObligations: [
    { id: 'ro-il-llc-3', name: 'Illinois LLC annual reports (3 LLCs)', amount: 225, frequency: 'annual', nextDue: '2026-08-01', entityId: 'e-poeprops', category: 'compliance', enabled: true },
    { id: 'ro-veh-reg-2', name: 'Vehicle registration (2 vehicles)', amount: 302, frequency: 'annual', nextDue: '2026-12-01', entityId: 'e-personal', category: 'vehicle', enabled: true },
    { id: 'ro-msw-license', name: 'Naomi MSW license renewal', amount: 208, frequency: 'biennial', nextDue: '2027-11-30', entityId: 'e-tlc', category: 'professional', enabled: true },
    { id: 'ro-ceu-msw', name: 'CEU costs (Naomi MSW)', amount: 500, frequency: 'annual', nextDue: '2026-11-01', entityId: 'e-tlc', category: 'professional', enabled: true },
    { id: 'ro-state-farm', name: 'State Farm — home + auto', amount: 823, frequency: 'monthly', nextDue: '2026-06-01', entityId: 'e-personal', category: 'insurance', enabled: true },
    // Personal bill-pay obligations attributed to the ...8168 bill-pay account
    // via `accountId` so they flow into that account's "after upcoming" card and
    // its forward 30/60/90 forecast. Spread across the three horizons (≤30d,
    // 30-60d, 60-90d) so the projected columns are genuinely different. The -65
    // Phone charge is the nearest, so +30d differs from "Right now" by exactly it.
    { id: 'ro-phone', name: 'Phone (family plan)', amount: 65, frequency: 'monthly', nextDue: '2026-06-01', entityId: 'e-personal', category: 'utilities', enabled: true, accountId: 'a-chase-pers-8168' },
    { id: 'ro-est-tax-q2', name: 'Estimated tax — Q2', amount: 1200, frequency: 'quarterly', nextDue: '2026-07-01', entityId: 'e-personal', category: 'tax', enabled: true, accountId: 'a-chase-pers-8168' },
    { id: 'ro-hoa', name: 'HOA dues (semi-annual)', amount: 410, frequency: 'semi-annual', nextDue: '2026-08-01', entityId: 'e-personal', category: 'housing', enabled: true, accountId: 'a-chase-pers-8168' },
  ],
  // Round 10 — incidents extended with ITSM urgency taxonomy. Old records
  // without these fields keep working; the storage migration backfills sane
  // defaults (status:'resolved' for past financial incidents, urgency:'incident').
  // Going forward, every issue created across the app (tenant not paying,
  // maintenance, prayer requests with action needed, etc.) flows through this
  // same shape so the Action Queue can show them in one consolidated view.
  incidents: [
    { id: 'in1', date: '2026-05-01', amount: 300.00, category: 'vehicle', entityId: 'e-personal', description: 'Local Towing Service', urgency: 'incident', status: 'resolved', dueDate: '2026-05-01', resolvedAt: '2026-05-01' },
    { id: 'in3', date: '2026-05-06', amount: 500.00, category: 'property', entityId: 'e-poeprops', description: 'Pest / wildlife control', urgency: 'incident', status: 'resolved', dueDate: '2026-05-09', resolvedAt: '2026-05-06' },
    { id: 'in5', date: '2026-05-13', amount: 363.00, category: 'medical', entityId: 'e-personal', description: 'Family orthodontics visit', urgency: 'incident', status: 'resolved', dueDate: '2026-05-16', resolvedAt: '2026-05-13' },
    // Active items so the Action Queue renders something meaningful on first load.
    { id: 'in-tenant-late', date: '2026-05-15', amount: 850.00, category: 'tenant', entityId: 'e-poeprops', description: 'Tenant at 1521 Oak Ave behind on rent', urgency: 'incident', status: 'open', dueDate: '2026-05-18', linkedTo: { type: 'rental', id: 'r3' } },
    { id: 'in-hvac-down', date: '2026-05-16', amount: 0, category: 'maintenance', entityId: 'e-poeprops', description: '240 Cedar Ln Apt 2 furnace blowing cold air', urgency: 'change', status: 'open', dueDate: '2026-05-16', linkedTo: { type: 'rental', id: 'r5' } },
  ],
  scopes: [
    // v28+ Example scope — visible in Projects > Scopes tab so users see what a
    // filled-out contractor agreement looks like before they write their first.
    {
      id: 'sc-example-roof-1521',
      templateType: 'property',
      templateName: 'Property Contractor',
      title: '1521 Oak Ave — Roof Replacement',
      entityId: 'e-poeprops',
      projectId: 'pr-example-4',
      contractorName: 'Sample Contractor',
      contractorEmail: 'sample@example-roofing.example',
      contractorPhone: '(555) 555-0119',
      scopeOfWork: 'Complete tear-off of existing 3-tab asphalt shingle roof at 1521 Oak Ave, Cedar Heights IL. Replace decking where needed (estimated 4 sheets). Install 30-year architectural shingles (manufacturer equivalent), new underlayment, ice & water shield on eaves and valleys, new pipe boots, new ridge vent, new drip edge. Haul off all debris. Final inspection walk with owner.',
      deliverables: '• Existing roof torn off to deck and disposed of\n• Replacement decking installed where rotted or soft\n• New underlayment + ice & water shield per code\n• 30-year architectural shingles installed manufacturer-spec\n• New pipe boots, ridge vent, drip edge\n• Site cleaned of nails, shingles, debris\n• Photos of each stage (decking, underlayment, finished)\n• Manufacturer warranty paperwork delivered to owner',
      materials: 'Contractor provides: shingles, underlayment, ice & water, drip edge, ridge vent, nails, pipe boots, dumpster, magnetic nail sweep.\nProperty owner provides: power and water access during work.\nAny decking replacement beyond 4 sheets billed at $65/sheet supplied + installed.',
      schedule: 'Start: 2026-06-09 (weather permitting). Substantial completion: 2026-06-12. Final walkthrough: 2026-06-13.',
      paymentTerms: '50% deposit ($4,400) on materials delivery. Balance ($4,400) within 7 days of acceptance walkthrough. Paid via 1099 (W-9 on file). Decking overage invoiced separately at completion.',
      acceptanceCriteria: 'No visible defects from ground. No exposed nails. Ridge vent installed straight. All penetrations sealed. Owner walks roof line with contractor and signs acceptance sheet. 1-day rain test before final payment is released.',
      requirements: '• Active Illinois roofing license\n• General liability insurance $1M+ (certificate on file)\n• Workers comp coverage for crew\n• W-9 on file before work starts\n• Tenant 48-hour written notice before start date',
      warranty: 'Labor: 5 years against installation defects. Materials: 30-year manufacturer warranty (CertainTeed). Free callbacks for the first 12 months for nail pops or any loose shingles.',
      terminationClause: '7 days written notice with cure opportunity. If terminated for cause after start, contractor paid pro-rata for completed materials and labor through termination date.',
      status: 'active',
      createdAt: '2026-05-20T14:00:00.000Z',
    },
  ],
  events: [], // v7: events array — user adds these
  projects: [
    { id: 'pr-example-1', title: 'Cornerstone Tech v1 Public Launch · Loved Ones cohort', startDate: '2026-05-16', endDate: '2026-09-30', status: 'active', domain: 'business-poetech', description: 'Foundation launch through Cornerstone Community Church. Onboard first 100 founding families. Validate pricing tiers and core Financial module.', hoursPerWeek: 20, entityId: 'e-poetech', createdAt: '2026-05-16T00:00:00.000Z' },
    { id: 'pr-example-2', title: 'Hannah college transition', startDate: '2026-05-16', endDate: '2026-08-25', status: 'active', domain: 'family', description: 'Visits, paperwork, dorm prep, financial aid coordination, the goodbye conversations that matter.', hoursPerWeek: 4, entityId: 'e-personal', createdAt: '2026-05-16T00:00:00.000Z' },
    { id: 'pr-example-3', title: 'Sponsor outreach Q3 — first cohort', startDate: '2026-06-01', endDate: '2026-08-31', status: 'planning', domain: 'business-poetech', description: 'Reach out to Tier B + C targets. Sign 1 Module Sponsor + 2 Directory Partners by Sept. Per sponsorship-ops brief.', hoursPerWeek: 5, entityId: 'e-poetech', createdAt: '2026-05-16T00:00:00.000Z' },
    { id: 'pr-example-4', title: '1521 Oak Ave — resolve LATE rent', startDate: '2026-05-16', endDate: '2026-06-15', status: 'ending-soon', domain: 'business-poeprops', description: 'Tenant conversation, payment plan or escalation per scope. Recover $850 gap or transition unit.', hoursPerWeek: 3, entityId: 'e-poeprops', createdAt: '2026-05-16T00:00:00.000Z' },
    { id: 'pr-example-5', title: 'Wellness Practice — add 1-2 MSW contractors', startDate: '2026-06-01', endDate: '2026-09-15', status: 'planning', domain: 'business-tlc', description: 'Recruit through Naomi\'s clinical network. New scope agreements. Onboard via Practice Operations. Each contractor = ~$2K/mo additional revenue.', hoursPerWeek: 4, entityId: 'e-tlc', createdAt: '2026-05-16T00:00:00.000Z' },
    { id: 'pr-example-6', title: 'Worldview teaching book · finish + publish', startDate: '2026-05-16', endDate: '2026-11-30', status: 'active', domain: 'business-poetech', description: 'Complete the book. Publishing submission. Print proof. Launch alongside Spiritual Life module.', hoursPerWeek: 6, entityId: 'e-poetech', createdAt: '2026-05-16T00:00:00.000Z' },
    // Real sovereign-hardware procurement projects (recorded 2026-06-23). BOM + verified links live in
    // docs/00-foundations/CUDA-BOX-PROCUREMENT-HOME-AND-CHURCH.md. Advisory only — Darrell places every order by hand.
    { id: 'pr-cuda-home-box', title: 'Sovereign CUDA dev box — HOME (1× RTX PRO 6000 96GB)', startDate: '2026-06-23', endDate: '2026-07-20', status: 'active', domain: 'business-poetech', description: 'Procure + stand up Darrell’s private local-LLM coding/dev box: 1× RTX PRO 6000 Blackwell 96GB workstation (runs 70B+ w/ headroom, CUDA media, OpenClaw-local). DIY (TRX50, ECC) ~$17.4–$20.7K or BIZON X3000 prebuilt ~$12–$14K. Buy-ready BOM + verified 2026-06-23 links: docs/00-foundations/CUDA-BOX-PROCUREMENT-HOME-AND-CHURCH.md §2. Ties to LOCAL-LLM-HARDWARE-RECOMMENDATION + DR-0014/DR-0053. Orders placed by hand this weekend.', hoursPerWeek: 6, entityId: 'e-poetech', createdAt: '2026-06-23T19:52:34.568Z', lifecycle: { phase: 'active', openedAt: '2026-06-23T19:52:34.568Z', closedAt: null, log: [{ at: '2026-06-23T19:52:34.568Z', fromPhase: null, toPhase: 'planning', by: 'darrell', note: 'BOM verified + recorded — see CUDA-BOX-PROCUREMENT-HOME-AND-CHURCH.md §2' }, { at: '2026-06-23T19:52:35.568Z', fromPhase: 'planning', toPhase: 'active', by: 'darrell', note: 'procuring this weekend — orders placed by Darrell’s hand (advisory makes no purchase)' }] } },
    { id: 'pr-cuda-colg-node', title: 'COLG media+AI node — CHURCH (2× RTX PRO 6000 = 192GB)', startDate: '2026-06-23', endDate: '2026-08-31', status: 'planning', domain: 'church', description: 'Procure the COLG sovereign media+AI node (128GB+ tier): 2× RTX PRO 6000 = 192GB. Drives Sanctuary LED video-wall media generation (Stable Diffusion/FLUX/ComfyUI), Whisper large-v3 transcription, local 70B/120B LLM, and concurrent congregant users. Recommended prebuilt BIZON X4000 ~$24–$28K (warrantied, validated); DIY reference ~$33–$41K. Buy-ready BOM + verified 2026-06-23 links: docs/00-foundations/CUDA-BOX-PROCUREMENT-HOME-AND-CHURCH.md §3. Physical front end = sanctuary-video-wall capital project (install started 2026-06-22); compute behind the NDI/CUDA pipeline. SCOPE DELTA: major step up from the ~$9k COLG NAS+camera build (DR-0050) — separate capital line; reconcile on the Video Wall capex surface before greenlight.', hoursPerWeek: 4, entityId: null, createdAt: '2026-06-23T19:52:34.568Z', lifecycle: { phase: 'planning', openedAt: '2026-06-23T19:52:34.568Z', closedAt: null, log: [{ at: '2026-06-23T19:52:34.568Z', fromPhase: null, toPhase: 'planning', by: 'darrell', note: '192GB node BOM verified + recorded; linked to sanctuary-video-wall + NDI/CUDA pipeline. Pending capex reconcile before greenlight (video-wall install gating note).' }] } },
  ], // v17/v22: project timelines with start/end dates — workload coordination · examples + real CUDA procurement records (2026-06-23)
  subscriptions: [], // v18: recurring monthly purchases · cart · subscription audit
  feedback: [], // v24: tester feedback collection · MVP
  welcomeDismissed: false, // v24: first-run welcome panel
  checkoutIntents: [], // v28+ Session C: cart intents (tier selected, action taken)
  userTier: 'foundation', // v28+ free entry tier; flips when a paid subscription is processed
  inquiries: [
    { id: 'inq-ex1', firstName: 'Sample R.', contactMethod: 'phone', phone: '(555) 555-0142', interestArea: 'individual', hasInsurance: 'Y', preferredProvider: 'Naomi (lead clinician)', bestTimeToCall: 'Weekday evenings', source: 'church', sourceDetail: 'Local church referral', notes: 'Seeking faith-integrated therapy, recommended by pastor.', status: 'new', receivedAt: '2026-05-14T14:30:00.000Z', statusHistory: [{ status: 'new', at: '2026-05-14T14:30:00.000Z' }] },
    { id: 'inq-ex2', firstName: 'Sample T.', contactMethod: 'email', email: 'jt****@example.com', interestArea: 'couples', hasInsurance: 'unsure', preferredProvider: 'any', bestTimeToCall: 'Lunch hour', source: 'google', sourceDetail: 'Searched faith-based therapy locally', notes: 'Wife and I both want to try counseling.', status: 'attempting-contact', receivedAt: '2026-05-13T09:15:00.000Z', statusHistory: [{ status: 'new', at: '2026-05-13T09:15:00.000Z' }, { status: 'attempting-contact', at: '2026-05-14T10:00:00.000Z' }] },
    { id: 'inq-ex3', firstName: 'Sample W.', contactMethod: 'phone', phone: '(555) 555-0189', interestArea: 'family', hasInsurance: 'Y', preferredProvider: 'Clinician A', bestTimeToCall: 'After 6pm', source: 'instagram', sourceDetail: 'Practice IG post', notes: 'Family conflict, three teens.', status: 'scheduled-intake', receivedAt: '2026-05-10T11:00:00.000Z', statusHistory: [{ status: 'new', at: '2026-05-10T11:00:00.000Z' }, { status: 'contacted', at: '2026-05-11T15:00:00.000Z' }, { status: 'scheduled-intake', at: '2026-05-12T14:00:00.000Z', notes: 'Intake scheduled in scheduling tool for 5/19' }] },
    { id: 'inq-ex4', firstName: 'Sample L.', contactMethod: 'phone', phone: '(555) 555-0201', interestArea: 'individual', hasInsurance: 'N', preferredProvider: 'any', bestTimeToCall: 'Morning', source: 'word-of-mouth', sourceDetail: 'Friend referral', notes: 'Self-pay, working through grief.', status: 'contacted', receivedAt: '2026-05-12T16:00:00.000Z', statusHistory: [{ status: 'new', at: '2026-05-12T16:00:00.000Z' }, { status: 'contacted', at: '2026-05-13T11:00:00.000Z' }] },
    { id: 'inq-ex5', firstName: 'Rev. K.', contactMethod: 'email', email: 'pastor****@example.org', interestArea: 'consultation', hasInsurance: 'unsure', preferredProvider: 'Naomi (lead clinician)', bestTimeToCall: 'Tuesdays', source: 'church', sourceDetail: 'Pastor at sister church', notes: 'Clinical consultation for congregant referrals.', status: 'scheduled-intake', receivedAt: '2026-05-08T13:00:00.000Z', statusHistory: [{ status: 'new', at: '2026-05-08T13:00:00.000Z' }, { status: 'contacted', at: '2026-05-09T10:00:00.000Z' }, { status: 'scheduled-intake', at: '2026-05-10T09:00:00.000Z' }] },
    { id: 'inq-ex6', firstName: 'Sample B.', contactMethod: 'phone', phone: '(555) 555-0234', interestArea: 'child', hasInsurance: 'Y', preferredProvider: 'Clinician B', bestTimeToCall: 'School hours', source: 'facebook', sourceDetail: 'Practice FB post about adolescent therapy', notes: '13yo daughter, anxiety + school refusal.', status: 'new', receivedAt: '2026-05-15T10:30:00.000Z', statusHistory: [{ status: 'new', at: '2026-05-15T10:30:00.000Z' }] },
    { id: 'inq-ex7', firstName: 'Sample S.', contactMethod: 'email', email: 'ws****@example.com', interestArea: 'individual', hasInsurance: 'Y', preferredProvider: 'any', bestTimeToCall: 'Anytime', source: 'website', sourceDetail: 'Practice contact form', notes: 'PTSD, Vet, prefer VA-accepting clinician.', status: 'scheduled-intake', receivedAt: '2026-05-09T08:00:00.000Z', statusHistory: [{ status: 'new', at: '2026-05-09T08:00:00.000Z' }, { status: 'contacted', at: '2026-05-09T14:00:00.000Z' }, { status: 'scheduled-intake', at: '2026-05-10T11:00:00.000Z' }] },
    { id: 'inq-ex8', firstName: 'Sample M.', contactMethod: 'phone', phone: '(555) 555-0267', interestArea: 'individual', hasInsurance: 'unsure', preferredProvider: 'Naomi (lead clinician)', bestTimeToCall: 'Lunch', source: 'church', sourceDetail: 'Local church women\'s ministry', notes: 'Marriage difficulty, considering separation.', status: 'declined', receivedAt: '2026-05-06T15:00:00.000Z', statusHistory: [{ status: 'new', at: '2026-05-06T15:00:00.000Z' }, { status: 'contacted', at: '2026-05-07T10:00:00.000Z' }, { status: 'declined', at: '2026-05-08T16:00:00.000Z', notes: 'Husband not ready to participate' }] },
  ], // v9/v23: practice inquiries — clinician logs these · examples show realistic pipeline
  moduleInterest: {}, // v10: family signals interest in upcoming modules { moduleKey: ISO timestamp }
  inflows: {
    salaries: [
      { id: 'd-uiuc', who: 'Adam', source: 'Regional University salary', expected: 4200, actual: 4200, entityId: 'e-personal' },
      { id: 'd-church', who: 'Adam', source: 'Church stipend', expected: 480, actual: 480, entityId: 'e-personal' },
      { id: 'c-state', who: 'Naomi', source: 'State (Guardianship)', expected: 5731, actual: 5731, entityId: 'e-personal' },
      { id: 'c-church', who: 'Naomi', source: 'Church stipend', expected: 436, actual: 436, entityId: 'e-personal' },
      { id: 'c-tlc', who: 'Naomi', source: 'Wellness Counseling Practice', expected: 2200, actual: 4283, entityId: 'e-tlc' },
    ],
    rentals: [
      { id: 'r1', name: '1402 Maple St', address: '1402 Maple St', city: 'Cedar Heights', state: 'IL', tenantName: '', rent: 1100, actual: 1100, status: 'paying', entityId: 'e-poeprops', mortgage: { balance: 88000, rate: 6.50, monthlyPI: 556, escrow: 180, estimated: true } },
      { id: 'r2', name: '1517 Oak Ave', address: '1517 Oak Ave', city: 'Cedar Heights', state: 'IL', tenantName: '', rent: 1100, actual: 1100, status: 'paying', entityId: 'e-poeprops', mortgage: { balance: 88000, rate: 6.50, monthlyPI: 556, escrow: 180, estimated: true } },
      { id: 'r3', name: '1521 Oak Ave', address: '1521 Oak Ave', city: 'Cedar Heights', state: 'IL', tenantName: '', rent: 1400, actual: 550, status: 'late', entityId: 'e-poeprops', mortgage: { balance: 110000, rate: 6.50, monthlyPI: 695, escrow: 220, estimated: true } },
      { id: 'r4', name: '240 Cedar Ln Apt 1', address: '240 Cedar Ln', building: '240 Cedar Ln', unitLabel: 'Apt 1', propertyType: 'multi-family', city: 'Cedar Heights', state: 'IL', tenantName: '', rent: 850, actual: 850, status: 'paying', entityId: 'e-poeprops', mortgage: { balance: 70000, rate: 6.50, monthlyPI: 442, escrow: 150, estimated: true } },
      { id: 'r5', name: '240 Cedar Ln Apt 2', address: '240 Cedar Ln', building: '240 Cedar Ln', unitLabel: 'Apt 2', propertyType: 'multi-family', city: 'Cedar Heights', state: 'IL', tenantName: '', rent: 950, actual: 950, status: 'paying', entityId: 'e-poeprops', mortgage: { balance: 70000, rate: 6.50, monthlyPI: 442, escrow: 150, estimated: true } },
      { id: 'r6', name: '240 Cedar Ln Apt 3', address: '240 Cedar Ln', building: '240 Cedar Ln', unitLabel: 'Apt 3', propertyType: 'multi-family', city: 'Cedar Heights', state: 'IL', tenantName: '', rent: 900, actual: 900, status: 'paying', entityId: 'e-poeprops', mortgage: { balance: 70000, rate: 6.50, monthlyPI: 442, escrow: 150, estimated: true } },
      { id: 'r7', name: '240 Cedar Ln Apt 4', address: '240 Cedar Ln', building: '240 Cedar Ln', unitLabel: 'Apt 4', propertyType: 'multi-family', city: 'Cedar Heights', state: 'IL', tenantName: '', rent: 1000, actual: 1000, status: 'paying', entityId: 'e-poeprops', mortgage: { balance: 70000, rate: 6.50, monthlyPI: 442, escrow: 150, estimated: true } },
      { id: 'r8', name: '312 Willow Ln', address: '312 Willow Ln', city: 'Cedar Heights', state: 'IL', tenantName: '', rent: 950, actual: 950, status: 'paying', entityId: 'e-poeprops', mortgage: { balance: 80000, rate: 6.50, monthlyPI: 506, escrow: 170, estimated: true } },
      { id: 'r9', name: '818 Birch St', address: '818 Birch St', city: 'Cedar Heights', state: 'IL', tenantName: '', rent: 1250, actual: 1250, status: 'paying', entityId: 'e-poeprops', mortgage: { balance: 100000, rate: 6.50, monthlyPI: 632, escrow: 200, estimated: true } },
      { id: 'r10', name: '821 Birch St', address: '821 Birch St', city: 'Cedar Heights', state: 'IL', tenantName: '', rent: 1200, actual: 1200, status: 'paying', entityId: 'e-poeprops', mortgage: { balance: 95000, rate: 6.50, monthlyPI: 600, escrow: 195, estimated: true } },
      { id: 'r11', name: '506 Main Commercial Bldg', address: '506 Main Commercial Bldg', city: 'Cedar Heights', state: 'IL', tenantName: '', rent: 1000, actual: 1000, status: 'paying', entityId: 'e-poeprops', mortgage: { balance: 80000, rate: 6.50, monthlyPI: 506, escrow: 170, estimated: true } },
      // v28+ Personal residence — primary home. Mortgage figures are placeholder PITI; edit in Real Estate.
      { id: 'home-talans', name: '1108 Sycamore Dr', address: '1108 Sycamore Dr', city: 'Cedar Heights', state: 'IL', zip: '', tenantName: '', propertyType: 'primary-home', rent: 0, actual: 0, status: 'owner-occupied', entityId: 'e-personal', mortgage: { balance: 0, rate: 0, monthlyPI: 2400, escrow: 223, estimated: true }, notes: 'Primary residence. Fill in mortgage balance + rate from your latest statement; PITI is roughly $2,623/mo.' },
    ],
  },
  outflows: { rentalMortgages: 7595, propertyUtilities: 2638, household: 2176, debtService: 8155, charitableGiving: 2700 },
  debts: [
    { id: 'd1', name: 'Card A', minPayment: 100, rate: 34.99, balance: 1563, entityId: 'e-personal' },
    { id: 'd2', name: 'Card B', minPayment: 30, rate: 30.0, balance: 967, entityId: 'e-personal' },
    { id: 'd3', name: 'Card C', minPayment: 60, rate: 27.0, balance: 558, entityId: 'e-personal' },
    { id: 'd4', name: 'Card D', minPayment: 34, rate: 27.0, balance: 956, entityId: 'e-personal' },
    { id: 'd5', name: 'Business Card A', minPayment: 224, rate: 25.49, balance: 7308, entityId: 'e-poetech' },
    { id: 'd6', name: 'Card E', minPayment: 86, rate: 24.74, balance: 1608, entityId: 'e-personal' },
    { id: 'd7', name: 'Personal Line A', minPayment: 300, rate: 22.3, balance: 13102, flag: 'ATTACK FIRST', entityId: 'e-personal' },
    { id: 'd8', name: 'Card F', minPayment: 285, rate: 22.0, balance: 9948, entityId: 'e-personal' },
    { id: 'd9', name: 'Card G', minPayment: 34, rate: 22.0, balance: 600, entityId: 'e-personal' },
    { id: 'd10', name: 'Card H', minPayment: 215, rate: 18.0, balance: 8961, entityId: 'e-personal' },
    { id: 'd11', name: 'Business Card B', minPayment: 86, rate: 18.0, balance: 2000, entityId: 'e-poetech' },
    { id: 'd12', name: 'Card I', minPayment: 85, rate: 18.0, balance: 1920, entityId: 'e-personal' },
    { id: 'd13', name: 'Personal Loan A', minPayment: 644, rate: 14.0, balance: 18000, entityId: 'e-personal' },
    { id: 'd14', name: 'HELOC', minPayment: 748, rate: 11.0, balance: 52000, entityId: 'e-personal' },
    { id: 'd15', name: 'Personal Loan B', minPayment: 603, rate: 10.0, balance: 18491, note: 'Ends 9/2028', entityId: 'e-personal' },
    { id: 'd16', name: 'Business Card C', minPayment: 124, rate: 9.99, balance: 3548, entityId: 'e-poetech' },
    { id: 'd17', name: 'Card J', minPayment: 24, rate: 9.99, balance: 558, entityId: 'e-personal' },
    { id: 'd18', name: 'Personal Loan C', minPayment: 169, rate: 8.0, balance: 5000, entityId: 'e-personal' },
    { id: 'd19', name: 'Auto Loan', minPayment: 772, rate: 7.25, balance: 40544, entityId: 'e-personal' },
    { id: 'd20', name: 'Solar Financing', minPayment: 485, rate: 2.0, balance: 102000, note: 'Leave alone — ends 2047', leaveAlone: true, entityId: 'e-personal' },
    { id: 'd21', name: 'Small Business Loan', minPayment: 100, rate: 1.0, balance: 9000, note: 'Leave alone — ends 2050', leaveAlone: true, entityId: 'e-poetech' },
    { id: 'd22', name: 'Family Loan (Auntie M)', minPayment: 250, rate: 0, balance: 3000, entityId: 'e-personal' },
    { id: 'd23', name: 'BNPL A', minPayment: 200, rate: 0, balance: 1056, entityId: 'e-personal' },
    { id: 'd24', name: '0-percent Promotional Loan', minPayment: 650, rate: 0, balance: 18813, note: '0% × 36 months', entityId: 'e-personal' },
    { id: 'd25', name: 'Business Card D', minPayment: 905, rate: 0, balance: 9000, entityId: 'e-poetech' },
    { id: 'd26', name: 'Business Card E', minPayment: 300, rate: 0, balance: 6000, entityId: 'e-poetech' },
  ],
  pressureMappings: {
    1: { discretionaryCut: 5, rentGapClosure: 10, stress: 'Loose', desc: 'Maintenance mode' },
    2: { discretionaryCut: 10, rentGapClosure: 15, stress: 'Easy', desc: 'Light pressure' },
    3: { discretionaryCut: 15, rentGapClosure: 20, stress: 'Mild', desc: 'Gentle progress' },
    4: { discretionaryCut: 20, rentGapClosure: 28, stress: 'Mild-Mod.', desc: 'Building momentum' },
    5: { discretionaryCut: 25, rentGapClosure: 35, stress: 'Moderate', desc: 'Sustainable discipline' },
    6: { discretionaryCut: 30, rentGapClosure: 45, stress: 'Moderate', desc: 'Real progress' },
    7: { discretionaryCut: 35, rentGapClosure: 55, stress: 'Mod-High', desc: 'Focused' },
    8: { discretionaryCut: 40, rentGapClosure: 65, stress: 'High', desc: 'Heads down' },
    9: { discretionaryCut: 45, rentGapClosure: 75, stress: 'High', desc: 'Intense' },
    10: { discretionaryCut: 50, rentGapClosure: 80, stress: '5-yr sprint', desc: 'Maximum discipline' },
  },
  // Round 10 fix — opportunity figures realigned to the published Dev/Ops tier
  // pricing. The original placeholders (e.g., Regional Enterprise Client at $1,500/mo
  // when Enterprise retainers are $25K-$75K/mo) made the pipeline look like a
  // side-gig instead of the senior-architect consulting practice the rest of
  // the page describes. Numbers below match the Services Portfolio bands:
  //   · Small Business retainer: $3K-$12K/mo
  //   · Enterprise retainer:     $25K-$75K/mo
  //   · Enterprise project rate: $400-$800/hr
  opportunities: [
    { id: 'o1', person: 'Family', skill: 'Property management', what: 'Self-manage 1521 Oak Ave turnover', monthly: 1400, hours: 0, status: 'Priority', flag: true },
    { id: 'o2', person: 'Family', skill: 'Rent collection', what: 'Recover 240 Cedar Ln Apt 3 (or evict/re-rent)', monthly: 350, hours: 0, status: 'Priority', flag: true },
    { id: 'o3', person: 'Adam', skill: 'Network / OT-IT', what: 'Cornerstone Tech client #1 (Regional Enterprise Client A) · enterprise network architecture retainer', monthly: 25000, hours: 10, status: 'Pipeline', flag: true },
    { id: 'o4', person: 'Adam', skill: 'PWA / React dev', what: 'Small-business PWA build contracts · $15K-$45K projects', monthly: 12000, hours: 15, status: 'Building' },
    { id: 'o5', person: 'Adam', skill: 'BAS / Siemens', what: 'Regional University Facilities consulting (1099) · senior architect rate', monthly: 12000, hours: 12, status: 'Possible' },
    { id: 'o6', person: 'Adam', skill: 'Church tech', what: 'Multi-site church AV install + ongoing managed services', monthly: 4500, hours: 8, status: 'Pipeline' },
    { id: 'o7', person: 'Naomi', skill: 'Therapy practice', what: 'Add 1-2 more MSW contractors', monthly: 2000, hours: 0, status: 'Decision' },
    { id: 'o8', person: 'Naomi', skill: 'Guardianship', what: 'Speaking / training (community)', monthly: 500, hours: 2, status: 'Possible' },
    { id: 'o9', person: 'Cornerstone Tech Services', skill: 'Consulting + build', what: 'Warm Prospect A · Small-business package · 6-month engagement', monthly: 8000, hours: 12, status: 'Active conversation', flag: true },
    { id: 'o10', person: 'Cornerstone Tech Services', skill: 'Consulting + build', what: 'Warm Prospect B · Small-business package · 6-month engagement', monthly: 8000, hours: 12, status: 'Active conversation', flag: true },
    { id: 'o11', person: 'Cornerstone Tech Services', skill: 'Revenue share build', what: 'Equity-split engagement on warm prospect business', monthly: 5000, hours: 12, status: 'Possible structure' },
    { id: 'o12', person: 'Family Educators', skill: 'K-12 teaching online', what: 'Principal Family Member A — online tutoring for homeschool families', monthly: 3000, hours: 10, status: 'Interested', flag: true },
    { id: 'o13', person: 'Family Educators', skill: 'K-12 teaching online', what: 'Principal Family Member B — online tutoring + curriculum support', monthly: 3000, hours: 10, status: 'Interested', flag: true },
    { id: 'o14', person: 'Family Educators', skill: 'Special-needs support', what: 'Specialized homeschool support for bullied / special-needs kids', monthly: 2000, hours: 8, status: 'Build', flag: true },
    { id: 'o15', person: 'Cornerstone Tech Services', skill: 'Elder care platform', what: 'Elder Care Coordination — adult children managing aging parents', monthly: 2500, hours: 6, status: 'Possible market' },
    { id: 'o16', person: 'Cornerstone Tech Services', skill: 'Caregiver marketplace', what: 'Elder Care 1099 caregiver platform — alternative marketplace', monthly: 4000, hours: 10, status: 'Vision · large market' },
    { id: 'o17', person: 'Steward Real Estate', skill: 'Ethical home acquisition', what: 'Home Legacy Program — purchase from elderly with no heirs (with attorney + integrity)', monthly: 0, hours: 4, status: 'Relationship building' },
  ],
  // v28+ MVP v1.5: Capex / Tools priority list — replaces the standalone
  // Darrell_Tech_Tools_Priority_List.xlsx. Lives in About > Capital Spend.
  //
  // FUTURE-MODULE HOOK: Each capex item carries an optional `entityId` (which
  // company/household pocket pays for it) and `module` slug (which future SKOS
  // module will surface and depend on it). Today both are optional. Once the
  // Home Command, Practice Ops, or Elder Care modules ship, they filter this
  // list by `module === 'home-command'` etc. so each module shows only its own
  // capex roadmap — without us having to migrate the data shape later.
  capexItems: [
    // FUTURE-MODULE HOOK round 3: each item now also carries an optional
    // `projectId` (link to a project that needs it) and `purchaseTargetDate`
    // (when it should be bought). Both feed the Project Inventory forecast and
    // the savings prompts on the Projects tab. Items without either still work
    // — they just aren't time-bucketed in the forecast.
    { id: 'cx1', category: 'Networking', name: 'UniFi Cloud Gateway Max (2TB)', description: 'All-in-one cloud gateway with 2TB storage for network management', link: 'https://store.ui.com/us/en/category/cloud-gateways-compact/collections/cloud-gateway-max/products/ucg-max-ns?linked-variant=uacc-ssd-2tb', priority: 1, cost: 479, neededBy: 'ASAP when funds ready', status: 'planned', notes: 'Better value vs $600 NVMe alone', entityId: 'e-personal', module: 'home-command', projectId: '', purchaseTargetDate: '2026-07-01' },
    { id: 'cx2', category: 'Home', name: 'Adjustable Bed Frame + Mattress Bundle', description: 'Comfort + sleep system upgrade', link: 'https://www.dreamcloudsleep.com/mattress-bundles/adjustable-frame-bundle', priority: 3, cost: 0, neededBy: 'Later', status: 'wishlist', notes: 'Not urgent but quality of life upgrade', entityId: 'e-personal', module: 'home-command', projectId: '', purchaseTargetDate: '' },
    { id: 'cx3', category: 'Tools', name: 'Klein Tools Scout Pro 3 Tester', description: 'Cable tester for RJ45, coax, PoE, mapping + diagnostics', link: '', priority: 2, cost: 250, neededBy: 'Soon', status: 'researching', notes: 'Important for IT/network troubleshooting', entityId: 'e-poetech', module: 'home-command', projectId: '', purchaseTargetDate: '2026-08-15' },
    { id: 'cx4', category: 'Storage', name: 'NVMe SSD (High-End)', description: 'Standalone NVMe storage (not needed if gateway purchased)', link: '', priority: 2, cost: 600, neededBy: 'Optional', status: 'on-hold', notes: 'Redundant if gateway purchased', entityId: 'e-personal', module: 'home-command', projectId: '', purchaseTargetDate: '' },
  ],
  // v28+ MVP v1.5: Markets watchlist — stock-ticker watchlist for the new
  // Markets tab. Pre-seeded with common indices so the panel renders something
  // useful on first load. Each entry is a Stooq symbol (e.g. 'spy.us', 'btcusd').
  watchlist: ['spy.us', 'qqq.us', 'dia.us', 'btcusd'],
  // v28+ MVP v1.5: Church tab config + parishioner data.
  // FUTURE-MODULE HOOK: the `spiritual` and future `ministry` modules read
  // from `data.church` so users can add multiple congregations later without
  // a schema migration. Today this is keyed to the family's home church.
  // Default church home = The Church of the Living God / The Love Corner (D21).
  // COLG is the Poe family's home church AND the platform's named first
  // community; the canonical public directory entry lives in
  // COLG_DEFAULT_CHURCH (lib/default-church.js) so every default surface stays in sync.
  church: COLG_DEFAULT_CHURCH,
  prayerRequests: [], // local prayer-request log; user controls send-out via mailto button
  // Round 14 — Voice Ops (Phase 1) — config for the Cloudflare Worker backend.
  // User fills in API endpoint + token on the 📞 Inbound tab; both saved locally
  // (encrypted at rest via the browser's IndexedDB). NEVER committed to git.
  voiceOps: {
    apiUrl: '',   // e.g., https://api.poetech.us  OR  https://poetech-voice-ops.your-sub.workers.dev
    apiToken: '', // PWA_API_TOKEN value from the Worker deploy
    // Rate card — multiplied against /usage/this-month counters to compute the
    // monthly cost panel. Edit if Twilio bumps prices.
    rates: {
      perCallMinute: 0.0085,
      perTranscriptMinute: 0.05,
      perNumberMonthly: 1.15,
    },
    numbersConfigured: 2, // Steward Real Estate + Cornerstone Tech in Phase 1
    budgetAlertMonthly: 30, // dollars — surface a warning at this threshold
  },
  // v28+ MVP v1.5 round 6 — Dev/Ops skill profiles. Each profile feeds the
  // opportunity matcher. Seeded from the existing `opportunities[]` so the
  // matcher renders something meaningful on first load.
  skillProfiles: [
    { id: 'sp-darrell',  name: 'Adam',  skills: 'network architecture, OT-IT, BAS, Siemens, PWA, React, javascript, church AV, streaming, real estate, property management', hoursPerWeek: 20, monthlyIncome: 4680, location: 'Cedar Heights, IL', techComfort: 5, notes: 'Cornerstone Tech LLC tech consulting · Steward Real Estate self-mgmt · Local church AV' },
    { id: 'sp-christina',name: 'Naomi',skills: 'therapy, clinical, LCSW, MSW, faith, christian counseling, music, choir, vocal, guardianship, social work', hoursPerWeek: 30, monthlyIncome: 6167, location: 'Cedar Heights, IL', techComfort: 3, notes: 'Wellness Counseling Practice LLC owner · Local church Choir Director' },
    { id: 'sp-twin-son', name: 'Caleb', skills: 'tech support, networking, teen, neighborhood, lawn care', hoursPerWeek: 4, monthlyIncome: 0, location: 'Cedar Heights, IL', techComfort: 4, notes: 'Apprenticeship in progress — Cable Scout curriculum + neighborhood route' },
    { id: 'sp-twin-dau', name: 'Esther', skills: 'teaching, tutoring, teen, community, pet sitting', hoursPerWeek: 4, monthlyIncome: 0, location: 'Cedar Heights, IL', techComfort: 3, notes: 'Discovering — possible tutoring + pet care' },
  ],
};

// =============================================================================
// EMPTY_WORLD — the starting instance for a SIGNED-IN, NON-family user.
//
// 2026-06-14: a non-family parishioner who signs up gets their OWN Supabase
// instance (RLS-scoped). On a public host with no saved snapshot yet, the
// hydration path used to fall back to SEED_DATA — the Poe-family seed (real
// business shape, addresses, debt structure). That contradicts the binding
// rule at the `isPublicHost()` seed gate: "the public domain never seeds from
// SEED_DATA." A new outside user must land on their own empty books, not the
// family's scaffolding and not the Reeves demo.
//
// Structurally complete (every key SEED_DATA has, so no consumer crashes) but
// emptied of all family-bearing data. Generic config that carries no PII —
// pressureMappings, the public market watchlist, the COLG public-directory
// default church, voiceOps rate card — is inherited from SEED_DATA via spread.
// remainderIsSeed(EMPTY_WORLD) is true, so this never publishes to the cloud
// until the user enters real data of their own (correct: empty scaffolding
// must not masquerade as a real snapshot).
// =============================================================================
export const EMPTY_WORLD = {
  ...SEED_DATA,
  meta: { ...SEED_DATA.meta, bufferCurrent: 0, taxStructure: { ...SEED_DATA.meta.taxStructure, scheduleC: [], scheduleE: [], sCorpElected: [] } },
  entities: [],
  accounts: [],
  transactions: [],
  contractors1099: [],
  taxCalendar: [],
  recurringObligations: [],
  incidents: [],
  scopes: [],
  events: [],
  projects: [],
  subscriptions: [],
  feedback: [],
  checkoutIntents: [],
  inquiries: [],
  moduleInterest: {},
  inflows: { salaries: [], rentals: [] },
  outflows: { rentalMortgages: 0, propertyUtilities: 0, household: 0, debtService: 0, charitableGiving: 0 },
  debts: [],
  opportunities: [],
  capexItems: [],
  prayerRequests: [],
  skillProfiles: [],
  userTier: 'foundation',
  welcomeDismissed: false,
};

// =============================================================================
// DEMO / SAMPLE persona datasets (the family-unit picker set) + DEMO_PERSONA_META
// live in ./lib/demo-data.js — extracted from this shell 2026-07-06 to honor the
// monolith freeze (DR-0078). They are built via buildDemoPersonas(SEED_DATA) just
// below, where SEED_DATA is in scope (the module takes it as an argument, so there
// is no back-import and no cycle). SEED_DATA itself is unchanged and stays here.
// =============================================================================

// SCOPE_TEMPLATES moved to ./components/Projects.jsx (r41).
// =============================================================================
// REMINDER OPTIONS — for event reminders
// =============================================================================

// v17: Projects · Timeline · Workload Coordination
// Round 11 — Added 'tbd' (to be decided). When auto-creating a project would
// push the family over their available hours/week, the new project lands here
// as a parking lot until capacity opens up or the user explicitly promotes it.
// TBD projects DON'T count toward workload forecast or Action Queue.
// PROJECT_STATUSES moved to ./components/Projects.jsx
// PROJECT_STATUSES_ACTIVE moved to ./lib/opportunity-capacity.js (2026-07-03).

// =============================================================================
// v28+ MVP v1.5 round 5 — TIER GATING
// Single source of truth for which subscription tier unlocks which view.
// Tiers (ordered cheapest → most expensive):
//   foundation < poetech-plus < family < premium < business
// Special tiers (community / sponsor / founding) inherit at least 'foundation'
// privileges; the inherits-as map promotes them to the tier they should match.
// Read-only preview: Real Estate is rendered with editing disabled and a
// single seed property when the user is on 'foundation' — gives a real feel
// of the value before paying without unlocking the full editor.
// =============================================================================
const TIER_ORDER = ['foundation', 'poetech-plus', 'family', 'premium', 'business'];
const TIER_LABEL = {
  'foundation':   'Foundation (free)',
  'poetech-plus': 'PoeTech+ ($39/mo)',
  // 2026-06-02 rename per tier-review (commits d3733f5 / 4cb55b9): "Family" read as
  // the default/for-everyone tier and bounced a single-adult beta user (Freddie) who
  // saw $89 as the headline price. "Household" keeps the warmth while dropping the
  // "this is the multi-person family tier" misread — it is the multi-module tier for
  // multi-entity households, landlords, or solo pros. Internal key stays 'family' so
  // TIER_ORDER, aliases, and all gating are untouched.
  'family':       'Household ($89/mo)',
  'premium':      'Premium ($149/mo)',
  'business':     'PoeTech Business ($249/mo)',
};
// Special tier names mapped to their effective standard tier for gating.
const TIER_ALIASES = {
  'loved-ones':       'poetech-plus', // Founding Family — free PoeTech+ for life
  'community':        'poetech-plus', // Sponsored Community tier
  'community-partner':'business',     // Mission-aligned 501(c)(3) — full features
};
const effectiveTier = (t) => TIER_ALIASES[t] || t || 'foundation';
// Comparator — true if user's effective tier meets or exceeds the required tier.
const tierMeets = (userTier, requiredTier) => {
  const u = TIER_ORDER.indexOf(effectiveTier(userTier));
  const r = TIER_ORDER.indexOf(requiredTier);
  return u >= 0 && r >= 0 && u >= r;
};
// Known family sign-in emails -> their profile. Module-level so BOTH the
// profile-mapping effect and the self-serve onboarding check read one source
// (DRY; avoids the two drifting apart).
const FAMILY_EMAIL_PROFILES = {
  'darrellpoe06@gmail.com': 'darrell',
  'mrspoe06@gmail.com': 'christina',
  'christina@tlctherapysolutions.com': 'christina',
  // Darrell Jr (2026-07-05): 'family' persona = household roll-up only, not the
  // PIN-gated business/practice views. Pairs with migration 0080.
  'darrellpoejr@gmail.com': 'family',
  // Add the twins' sign-in emails as they get accounts.
};
export const isFamilyEmail = (email) =>
  Object.prototype.hasOwnProperty.call(FAMILY_EMAIL_PROFILES, String(email || '').toLowerCase());

// Church staff (The Church of the Living God). DISTINCT from family/Governor:
// church staff get access to church STAFF-ONLY surfaces (e.g. the Observation
// board) and NOTHING else — no family data, no financials, no Governor powers,
// no real family names. Tenancy boundary stays intact (see DR-0074). Add staff
// emails here as they get accounts; an allowlist (not a domain match) keeps it
// auditable and avoids over-granting to anyone the church ever issues mail to.
export const CHURCH_STAFF_EMAILS = new Set([
  'bg@thechurchofthelivinggod.com', // Bishop Gwin
]);
export const isChurchStaffEmail = (email) =>
  CHURCH_STAFF_EMAILS.has(String(email || '').toLowerCase());

// Darrell's Study circle — the SMALLEST possible access set, by deliberate design
// (no-leak, sovereign, private). Exactly: Darrell (owner), Christina (family /
// one-flesh), and Bishop Gwin (king-priest). Built as an EXPLICIT union of the
// family allowlist + BG, NOT `isFamilyEmail || isChurchStaffEmail`, so that ever
// broadening church staff later does not silently widen this private space — the
// circle is revisited intentionally if it is ever to change. The Study surface +
// its device-local data are gated to this predicate; nothing here is public seed
// or reachable by the wider team.
export const STUDY_CIRCLE_EXTRA = new Set([
  'bg@thechurchofthelivinggod.com', // Bishop Gwin
]);
export const isStudyCircleEmail = (email) =>
  isFamilyEmail(email) || STUDY_CIRCLE_EXTRA.has(String(email || '').toLowerCase());

// The wf18 Imported family-PII gate (from #131), extracted as a pure predicate
// so the security property is directly testable and provably preserved: the
// single shared NAS webhook serving the family's bank/Gmail PII is only ever
// reachable when (1) not in any demo/picker state, (2) a profile is set, and
// (3) on a public host, a VERIFIED FAMILY EMAIL is signed in + hydrated. An
// outside (self-serve) signed-in user, an anonymous visitor, and every demo
// state are all denied; the internal/Tailscale device (not a public host) is
// unchanged. The multi-point auth work must NOT regress this — multi-point-auth
// gating is layered ON TOP of, never in place of, this guard.
export function isImportedAllowed({ isAnyDemoMode, currentProfile, isPublicHostVal, authSession, authHydrated }) {
  return !isAnyDemoMode && !!currentProfile
    && (!isPublicHostVal || !!(authSession && authHydrated && isFamilyEmail(authSession?.user?.email)));
}
const personaOf = (email) => FAMILY_EMAIL_PROFILES[String(email || '').toLowerCase()] || null;
// Unique family personas (Christina's two emails collapse to one), used as the
// project-assignment roster. Display name = title-cased persona key.
const FAMILY_MEMBERS = (() => {
  const seen = new Map();
  for (const persona of Object.values(FAMILY_EMAIL_PROFILES)) {
    if (!seen.has(persona)) seen.set(persona, { key: persona, name: persona.charAt(0).toUpperCase() + persona.slice(1) });
  }
  return [...seen.values()];
})();

// VIEW_TIER_REQUIREMENTS — each nav view's minimum tier.
// 'foundation' = free for everyone. Markets, Books, Big Picture, Debts, Church
// all live here. Real Estate is special — rendered as read-only preview at
// foundation, fully editable at poetech-plus+.
const VIEW_TIER_REQUIREMENTS = {
  overview:      'foundation',
  books:         'foundation',
  debts:         'foundation',
  rentals:       'foundation',   // preview mode below this tier; full edit at poetech-plus
  markets:       'foundation',
  church:        'foundation',   // free for everyone, always
  projects:      'family',
  practice:      'premium',
  // Round 13 — Dev/Ops opens to every tier. The tab itself IS an advertising
  // surface for PoeTech Services + the opportunity engine. Per-tier richness
  // stays gated:
  //   · Foundation: 1 personalized option per profile + view-only services portfolio
  //   · PoeTech+:   3 options per profile + unlimited Markets
  //   · Family:     6 options per profile (full library)
  //   · Premium:    "Wrap me with the tech" CTA enabled (auto-create Project + Scope)
  //   · Business:   Publish own opportunity entries (when shipped)
  opportunities: 'foundation',
  about:         'foundation',
};
// Real Estate full-edit unlock tier — used to render the preview vs full editor.
const RENTALS_FULL_EDIT_TIER = 'poetech-plus';
// Soft caps for the Foundation tier — values feature is visible but limited.
const FOUNDATION_CAPS = {
  maxEntities: 2,
  maxWatchlistTickers: 5,
  maxRentalsEditable: 0,  // none editable at Foundation (preview only)
  maxRentalsPreviewVisible: 1, // shows just one seed property as preview
};

// =============================================================================
// HELPERS
// =============================================================================

// UpgradePrompt — shown in place of a tab when the user's tier doesn't meet
// the requirement. Always tells the user the cheapest tier that unlocks it.
function UpgradePrompt({ viewLabel, requiredTier, currentTier, setView, setUserTier }) {
  const label = TIER_LABEL[requiredTier] || requiredTier;
  const isLogged = effectiveTier(currentTier);
  return (
    <div className="bg-white border-2 border-[#B85838] p-6 sm:p-8 max-w-2xl mx-auto">
      <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] font-semibold mb-2">Unlock {viewLabel}</div>
      <h2 className="text-2xl sm:text-3xl mb-3" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600, letterSpacing: '-0.02em' }}>This view unlocks at <span className="text-[#B85838]">{label}</span>.</h2>
      <p className="text-sm leading-relaxed text-[#5A5751] mb-4" style={{ fontFamily: '"Fraunces", serif' }}>
        You're currently on <strong>{TIER_LABEL[isLogged] || isLogged}</strong>. {viewLabel} is built for the situations that {label.split(' ')[0]} subscribers use most. See the pricing tiers in About — the upgrade pays for itself by replacing several SaaS tools you'd otherwise stack to get the same outcome.
      </p>
      <div className="flex gap-2 flex-wrap">
        <button type="button" onClick={() => setView('about')} className="bg-[#1A1815] text-white px-5 py-2.5 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]">See pricing tiers →</button>
        <button type="button" onClick={() => setView('overview')} className="border border-[#1A1815] px-5 py-2.5 text-xs uppercase tracking-wider hover:bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838]">← Back to Big Picture</button>
      </div>
      {/* Dev-only tier switcher — lets you preview what each tier looks like without paying. */}
      {setUserTier && (
        <div className="mt-5 pt-4 border-t border-[#E8E4DC]">
          <div className="text-[9px] uppercase tracking-wider text-[#5A5751] mb-1">Dev preview — switch tier</div>
          <div className="flex gap-1 flex-wrap">
            {TIER_ORDER.map(t => (
              <button key={t} type="button" onClick={() => setUserTier(t)} className={`text-[10px] uppercase tracking-wider px-2 py-1 border focus:outline focus:outline-2 focus:outline-[#B85838] ${effectiveTier(currentTier) === t ? 'bg-[#1A1815] text-white border-[#1A1815]' : 'border-[#E8E4DC] text-[#5A5751]'}`}>{t}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
// Shared display-formatting primitives (fmt/fmtCompact/MONTHS_ABBR/monthLabel)
// now live in core at lib/format.js — imported at the top of this file — so
// feature modules reuse the SAME formatter instead of reaching back into the
// shell to get them. Behavior unchanged.

// Lifecycle & Handoff + auto-link + pressure + debt-projection helpers moved to
// ./lib/lifecycle-and-flow.js (pure extraction; DR-0078). Re-exported here so
// existing importers of this module keep working unchanged.
export {
  frequencyToMonthly, ensureLinks, findRelatedAuto, ensureExternalProfile,
  computePressure, projectDebt, projectDebtSnowball, projectDebtMinimumOnly,
  projectRentalSnowball, findExtraForTarget,
} from './lib/lifecycle-and-flow.js';
import {
  LIFECYCLE_TERMINAL_PHASES, appendLifecycleLog, ensureLifecycle, eventDateTime,
  computePressure, projectDebt, projectDebtSnowball, projectDebtMinimumOnly,
  projectRentalSnowball, findExtraForTarget,
} from './lib/lifecycle-and-flow.js';

// =============================================================================
// MAIN APP
// =============================================================================
// v28+ MVP v1.5 round 7 — TierSwitcher: controlled dropdown that closes on
// outside click + selection, plus a 1.5s flash on the trigger when the tier
// changes so the user sees the action took effect.
function TierSwitcher({ userTier, setUserTier }) {
  const [open, setOpen] = useState(false);
  const [flash, setFlash] = useState(false);
  const wrapRef = useRef(null);
  const autoCloseRef = useRef(null);
  // Round 7 fix — auto-close after 6s of no interaction inside the dropdown.
  // Reset the timer on any pointer move or focus inside; long enough to pick
  // a tier, not so long that the panel sticks around forever.
  const armAutoClose = () => {
    clearTimeout(autoCloseRef.current);
    autoCloseRef.current = setTimeout(() => setOpen(false), 6000);
  };
  useEffect(() => {
    if (!open) { clearTimeout(autoCloseRef.current); return; }
    armAutoClose();
    const onClick = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('touchstart', onClick);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('touchstart', onClick);
      clearTimeout(autoCloseRef.current);
    };
  }, [open]);
  const pick = (t) => {
    setUserTier(t);
    setOpen(false);
    setFlash(true);
    setTimeout(() => setFlash(false), 1500);
  };
  const current = effectiveTier(userTier);
  // Round 14 fix — compact label on narrow screens (e.g., "Premium") and full
  // label with price on wide screens. Keeps the header from crowding the title.
  const fullLabel = TIER_LABEL[current] || 'Foundation (free)';
  const shortLabel = fullLabel.split(' (')[0]; // strip the "($X/mo)" suffix
  return (
    <div ref={wrapRef} className="relative">
      <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open} aria-haspopup="true" className={`text-[10px] uppercase tracking-wider px-2 py-1.5 border whitespace-nowrap focus:outline focus:outline-2 focus:outline-[#B85838] transition-colors ${flash ? 'bg-[#5A6E3D] text-white border-[#5A6E3D]' : 'border-[#5A5751] text-[#5A5751] hover:border-[#1A1815] hover:text-[#1A1815]'}`} title={`Tier preview · ${fullLabel} · switch to see locked / unlocked views`}>
        {flash ? '✓ Saved · ' : ''}
        <span className="hidden lg:inline">{fullLabel}</span>
        <span className="lg:hidden">{shortLabel}</span>
        {' '}{open ? '▴' : '▾'}
      </button>
      {open && (
        <div onMouseMove={armAutoClose} onTouchStart={armAutoClose} onFocus={armAutoClose} className="absolute right-0 mt-1 bg-white border border-[#1A1815] p-2 z-30 shadow-lg" style={{ minWidth: '220px' }}>
          <div className="text-[9px] uppercase tracking-wider text-[#5A5751] mb-1 px-1">Preview tier (dev) · closes in 6s</div>
          <div className="flex flex-col gap-1">
            {TIER_ORDER.map(t => (
              <button key={t} type="button" onClick={() => pick(t)} className={`text-[10px] uppercase tracking-wider px-2 py-2 text-left border focus:outline focus:outline-2 focus:outline-[#B85838] ${current === t ? 'bg-[#1A1815] text-white border-[#1A1815]' : 'border-[#E8E4DC] text-[#5A5751] hover:border-[#1A1815]'}`}>{TIER_LABEL[t]}</button>
            ))}
          </div>
          <div className="text-[9px] text-[#5A5751] italic mt-2 px-1">Persisted on this device. Real billing happens through About.</div>
        </div>
      )}
    </div>
  );
}

// Demo mode helper — reads ?demo=<persona> from the URL on initial load.
// Returns null for normal app loads. Special value 'picker' (also reached
// via a bare ?demo with no value) opens the persona picker landing instead
// of loading a specific persona.
//
// Stewardship posture: the demo isn't a sales funnel, it's a working sample
// that lets a potential user see the shape of where this is going — even
// while some of the deeper marketplace infrastructure (multi-household
// co-auth, anonymous specialist messaging) is still in build.
function getDemoPersona() {
  try {
    const sp = new URLSearchParams(window.location.search);
    if (!sp.has('demo')) return null;
    const p = (sp.get('demo') || '').toLowerCase().trim();
    // Bare `?demo` (no value) lands in the universal start: a family
    // financial system. The app then teaches the viewer as they explore.
    // The picker is reachable explicitly via `?demo=picker` for someone
    // who wants the audience-cut menu.
    if (!p) return 'family-of-4';
    if (p === 'picker') return 'picker';
    return ['family-of-1', 'family-of-2', 'family-of-3', 'family-of-4', 'family-of-5', 'family-of-7', 'separated', 'professional', 'landlord'].includes(p) ? p
      // Shipped-soon personas land on the picker so the URL stays honest.
      : ['community', 'church', 'lawyer', 'therapist'].includes(p) ? 'picker'
      // Legacy alias for the first-cut family demo.
      : p === 'family' ? 'family-of-4'
      : 'picker';
  } catch (e) { return null; }
}
// Build the demo/sample persona map from the extracted module, passing the
// in-scope SEED_DATA so the module needs no back-import (no cycle).
export const DEMO_DATA_BY_PERSONA = buildDemoPersonas(SEED_DATA);
// Named local kept so the boot fallback + reset paths (and the reviewer-mode
// source-pin test) read exactly as before the extraction.
const DEMO_DATA_FAMILY_OF_4 = DEMO_DATA_BY_PERSONA['family-of-4'];

// 2026-06-11 — every record id that exists ONLY in the demo datasets (ids the
// demo shares with SEED_DATA are excluded so real seeded records are never
// touched). Used to (a) never upload demo rows into a signed-in family's
// cloud instance, and (b) filter any demo rows that historically slipped in
// back OUT of cloud-loaded lists. This is the "fake Reeves family mixed with
// ours" guard.
const DEMO_ONLY_IDS = (() => {
  const collect = (node, ids) => {
    if (Array.isArray(node)) { node.forEach((n) => collect(n, ids)); return ids; }
    if (node && typeof node === 'object') {
      if (typeof node.id === 'string') ids.add(node.id);
      Object.values(node).forEach((v) => collect(v, ids));
    }
    return ids;
  };
  const demoIds = collect(DEMO_DATA_BY_PERSONA, new Set());
  const seedIds = collect(SEED_DATA, new Set());
  seedIds.forEach((id) => demoIds.delete(id));
  return demoIds;
})();
const notDemoRow = (x) => !(x && typeof x.id === 'string' && DEMO_ONLY_IDS.has(x.id));
// 2026-06-12 — id-based provenance can't catch HISTORICAL pollution: demo
// entities uploaded by pre-filter builds came back from the cloud with new
// UUIDs (or null slugs), so DEMO_ONLY_IDS never matches them ("Maya (mom)" /
// "The Reeves Family" rendering ON FILE next to the real entities). Names
// can catch them: any entity whose display name matches a demo persona
// entity is demo, whatever id it wears. Seed-shared names excluded, same as
// DEMO_ONLY_IDS. Belt to the Studio cleanup in
// infra/supabase/cleanup-2026-06-12-entity-pollution.sql (the real fix).
export const DEMO_ENTITY_NAMES = (() => {
  const collect = (d, out) => { ((d && d.entities) || []).forEach((e) => { if (e && typeof e.name === 'string') out.add(e.name.toLowerCase()); }); return out; };
  const demo = new Set();
  Object.values(DEMO_DATA_BY_PERSONA).forEach((d) => collect(d, demo));
  collect(SEED_DATA, new Set()).forEach((n) => demo.delete(n));
  return demo;
})();
export const notDemoEntityRow = (e) => notDemoRow(e) && !(e && typeof e.name === 'string' && DEMO_ENTITY_NAMES.has(e.name.toLowerCase()));

// Collapse duplicate cloud entities by display name (historical double
// uploads: one row with a slug, one without). Prefer the row carrying a
// slug — that's the one the app's FK references (entityId) point at — then
// the earliest created.
export const dedupeEntitiesByName = (list) => {
  const byName = new Map();
  for (const e of list || []) {
    const key = (e && typeof e.name === 'string') ? e.name.trim().toLowerCase() : `__noname-${byName.size}`;
    const prev = byName.get(key);
    if (!prev) { byName.set(key, e); continue; }
    const better = (e.id && !prev.id) ? e
      : (!e.id && prev.id) ? prev
      : (new Date(e.createdAt || 0) < new Date(prev.createdAt || 0) ? e : prev);
    byName.set(key, better);
  }
  return [...byName.values()];
};
// 2026-06-12 — SEED PROVENANCE (Darrell: "we have original data, why don't we
// know the difference?"). SEED_DATA rows are aspirational scaffolding, never
// the family's books. Two binding consequences, enforced in the sync effect:
//   1. Seed rows NEVER upload to the family's cloud tables. (Without this, a
//      fresh device that hydrated SEED and then completed VerifyBalances
//      pushed '240 Cedar Ln' incidents and 11 fictional doors into the real
//      instance next to the real data.)
//   2. Once the cloud has ANY real rows for a table, that table's local seed
//      rows are dropped from display — the family's truth replaces the
//      scaffolding instead of mixing with it.
// A family that wants to keep something from the seed picture recreates it
// as their own entry (new id); editing seed scaffolding in place is not a
// sync path.
export const SEED_IDS = (() => {
  const collect = (node, ids) => {
    if (Array.isArray(node)) { node.forEach((n) => collect(n, ids)); return ids; }
    if (node && typeof node === 'object') {
      if (typeof node.id === 'string') ids.add(node.id);
      Object.values(node).forEach((v) => collect(v, ids));
    }
    return ids;
  };
  return collect(SEED_DATA, new Set());
})();
// remainderIsSeed — true when the NON-table-synced remainder of `data` is
// still untouched seed scaffolding. Drives the v2.15 family-snapshot policy:
// a still-seed world always ADOPTS the family snapshot and never PUBLISHES
// one. Checks the id-bearing remainder lists; a row with an id outside
// SEED_IDS means the family has made this world their own. (Editing only a
// non-list field, e.g. church details, doesn't flip this — acceptable v1
// trade, documented in snapshot-sync.js.)
export const remainderIsSeed = (d) => {
  if (!d || typeof d !== 'object') return true;
  // Only NON-table-synced lists belong here: rentals/incidents/etc. fill
  // with real cloud rows via table sync, which must not flip a device whose
  // snapshot-remainder is still scaffolding into a publisher.
  // 0077 promoted skillProfiles/prayerRequests/churchVoice to table sync — per
  // the rule above they must no longer drive the snapshot-publish decision.
  const lists = [
    d.recurringObligations, d.taxCalendar, d.events, d.capexItems,
  ];
  for (const list of lists) {
    if (!Array.isArray(list)) continue;
    for (const row of list) {
      if (row && typeof row.id === 'string' && !SEED_IDS.has(row.id)) return false;
    }
  }
  return true;
};
export const notSeedRow = (x) => !(x && typeof x.id === 'string' && SEED_IDS.has(x.id));
// A signed-in user's REAL data is anything that has synced (carries a
// remoteUuid) OR that they entered themselves (not seed scaffolding, not demo).
// Pure local seed/demo — a SEED/DEMO id that never synced — is the aspirational
// sample (e.g. "240 Cedar Ln", "Card J (Adam)") that must not masquerade as a
// real signed-in account's data. isRealRow NEVER drops a synced row, so cleaning
// is local-only and can't touch the cloud. (Darrell 2026-06-13: "Not my rentals.")
export const isRealRow = (x) => !!(x && (x.remoteUuid || (notSeedRow(x) && notDemoRow(x))));
// Drop pure local seed/demo from every list in `data`, preserving synced + user
// rows. Used on a signed-in clean start so the account begins with the user's
// real cloud data + empty tables to fill, never the sample dataset.
export const stripSeedScaffolding = (d) => {
  const out = { ...d };
  for (const k of Object.keys(out)) {
    if (Array.isArray(out[k])) out[k] = out[k].filter(isRealRow);
  }
  if (out.inflows && Array.isArray(out.inflows.rentals)) {
    out.inflows = { ...out.inflows, rentals: out.inflows.rentals.filter(isRealRow) };
  }
  return out;
};
// Persona-specific welcome copy. Each entry describes the audience and the
// stewardship lens. The 'vision' line is honest about what's working today
// vs what's still being built (per Darrell 2026-05-28).
// Persona metadata — rewritten 2026-05-28 evening to lead with VALUE
// OUTCOME rather than persona description. Per Darrell: "The website options
// should explain this in a way that multiple users can understand the value
// of the PoeTech app right away." Each tile now opens with the change the
// user gets, not the demographic label.
//
// Structure per persona:
//   label    — short audience name shown on the tile
//   headline — one-line value promise (the lead)
//   summary  — concrete scenario in their own words
//   audience — who this is exactly
//   pitch    — what changes in their week when they use it
//   vision   — honest about what's working today vs in build

// Hostname gate — public domains (poetech.us, *.vercel.app, any host that's
// not localhost / Tailscale-internal) must NEVER unlock Imported PII surfaces
// regardless of localStorage state. Family accesses real data via Tailscale.
// Returns true on any "public" host; default is SAFE (treat unknown as public).
function isPublicHost() {
  try {
    if (typeof window === 'undefined') return true;
    const host = window.location.hostname || '';
    if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0') return false;
    if (host.startsWith('100.')) return false; // Tailscale CGNAT (100.64.0.0/10)
    if (host.endsWith('.ts.net')) return false; // Tailscale magic DNS
    if (host.endsWith('.local')) return false; // mDNS LAN
    if (/^192\.168\./.test(host)) return false; // RFC1918 LAN
    if (/^10\./.test(host)) return false; // RFC1918 LAN
    return true; // poetech.us, *.vercel.app, anything else = PUBLIC
  } catch (e) {
    return true; // Fail closed.
  }
}

// Initial view from the URL query. Supports deep-links like ?view=admin — the
// footer "Admin" link's shareable target (Darrell opens https://poetech.us/?view=admin
// on his phone to find the NAS dispatch-status URL). Unknown/absent param falls
// back to the normal overview boot.
function getInitialView() {
  try {
    if (typeof window === 'undefined') return 'overview';
    const sp = new URLSearchParams(window.location.search);
    const v = (sp.get('view') || '').toLowerCase().trim();
    // Engagement and Choir are sub-tabs under Church; those deep-links land on
    // the Church tab (the sub-tab is selected separately by getInitialChurchView).
    if (v === 'engagement' || v === 'choir' || v === 'pulpit' || v === 'events') return 'church';
    // The former Access tab was merged into Admin (one users report, 2026-07-04);
    // an old ?view=access deep-link lands on Admin rather than dead-ending.
    if (v === 'access') return 'admin';
    const VALID = ['overview','books','inbound','rentals','projects','practice','tlc','opportunities','about','church','markets','notes','create','voice','library','recipes','games','tvtime','admin','center','crm','relationships','inventory','forecast','cohorts','tlc-assistant'];
    return VALID.includes(v) ? v : 'overview';
  } catch (e) { return 'overview'; }
}

// Engagement lives under Church. A ?view=engagement deep-link selects the
// Engagement sub-tab; everything else defaults to the Church home sub-tab.
function getInitialChurchView() {
  try {
    if (typeof window === 'undefined') return 'home';
    const sp = new URLSearchParams(window.location.search);
    const v = (sp.get('view') || '').toLowerCase().trim();
    return v === 'engagement' ? 'engagement' : v === 'choir' ? 'choir' : v === 'pulpit' ? 'pulpit' : v === 'learn' ? 'learn' : v === 'events' ? 'events' : 'home';
  } catch (e) { return 'home'; }
}

// Admin — the real in-app backend control surface — now lives in its own module
// (components/AdminConsole.jsx, registered in surfaces.js). It replaced the old
// dead-end "list of NAS URLs to copy" surface with genuine, plain-language
// controls (People & Access, Data & Loops, System & Build, Internal Surfaces),
// each previewing consequential actions before a deliberate execute. Rendered by
// the `view === 'admin'` branch below, family/governor-gated with a no-leak nav.

export default function PoeFinancialSystem() {
  const demoPersona = getDemoPersona();
  const isPickerMode = demoPersona === 'picker';
  const isDemoMode = !!demoPersona && !isPickerMode;
  // Suppress storage/save/network either way — picker is also a "demo" state.
  const isAnyDemoMode = !!demoPersona;
  // Reviewer mode (lib/reviewer-mode.jsx) — the steward reviews this build exactly
  // as a signed-in user sees it. STRICTLY NARROWING: it only hides privilege, and
  // every write path to the steward's real data is suppressed while it is on.
  const reviewerMode = isReviewerModeOn();

  // First-time landing: when someone hits the bare URL (poetech.us with no
  // query params), no saved profile, no landing-seen flag — show the
  // audience-cut picker as a friendly front door. This is the marketing-
  // landing answer for the new poetech.us domain. Returning users with a
  // profile or the flag go straight to the app.
  const isFirstTimeLanding = (() => {
    try {
      if (isAnyDemoMode) return false;
      const sp = new URLSearchParams(window.location.search);
      if (sp.toString() !== '') return false;
      if (localStorage.getItem('poe-landing-seen')) return false;
      if (localStorage.getItem('poe-current-profile')) return false;
      return true;
    } catch (e) { return false; }
  })();
  const markLandingSeen = () => { try { localStorage.setItem('poe-landing-seen', '1'); } catch (e) {} };
  // In picker mode OR on first-time bare-URL landing, fall back to demo
  // family data so anything behind the picker overlay is also sample data —
  // never Darrell's seed entities. Until Multi-user Layer B PIN auth ships,
  // SEED_DATA must NEVER reach a viewer who hasn't established a saved
  // profile, because SEED_DATA contains real business names, account
  // fragments, balances, and addresses.
  const isFirstTimeLandingBoot = (() => {
    try {
      if (demoPersona) return false;
      const sp = new URLSearchParams(window.location.search);
      if (sp.toString() !== '') return false;
      if (localStorage.getItem('poe-landing-seen')) return false;
      if (localStorage.getItem('poe-current-profile')) return false;
      return true;
    } catch (e) { return false; }
  })();
  // 2026-06-03 SECURITY: on public host, NEVER seed from SEED_DATA (which has
  // the real Poe-family ops shape even when entity NAMES were anonymized — real
  // property addresses, real project titles, real business operations could
  // still surface in the Action Queue / Big Picture). The aspirational Reeves-
  // family DEMO_DATA_FAMILY_OF_4 is the only safe seed for the public domain.
  const [data, setData] = useState(
    (isPublicHost() || reviewerMode) ? DEMO_DATA_FAMILY_OF_4
      : isDemoMode ? DEMO_DATA_BY_PERSONA[demoPersona]
      : isPickerMode ? DEMO_DATA_FAMILY_OF_4
      : isFirstTimeLandingBoot ? DEMO_DATA_FAMILY_OF_4
      : SEED_DATA
  );
  const [pressure, setPressure] = useState(5);
  const [view, setView] = useState(getInitialView());
  // Church-door mode (DR-0174, Darrell 2026-07-12: "It should just be the church
  // app... no need to change the PoeTech App... isn't it built as modular?").
  // When the app was LAUNCHED via the church door (the installed Love Corner app
  // or /lovecorner → ?view=church), it presents as a focused CHURCH-ONLY app:
  // the top nav is scoped to the church (whose sub-nav already holds worship,
  // giving, prayer, and the Word — Godhead study, Scripture, The Word). PoeTech
  // itself is untouched. CAPTURED ONCE at first render (useState initializer),
  // BEFORE nav-history rewrites the URL — so a family member tapping the Church
  // tab inside full PoeTech (which sets ?view=church) is NOT scoped; only a real
  // church-door launch is. Pure signal in lib/church-own-door.js.
  const [churchDoorOnly] = useState(() => isChurchDoorContext());
  // TLC client door (Darrell 2026-07-13: "when will I be able to send a TLC
  // Therapy Solutions App out?"). When LAUNCHED via the TLC door (poetech.us/tlc
  // → ?tlc=1), the app presents as the focused, PUBLIC, client-facing TLC app —
  // "Find your therapist" (provider match + services + insurance + Book) and
  // nothing else. NOT the operator TLC tab (?view=tlc). Captured ONCE at first
  // render, before nav-history rewrites the URL. Pure signal in lib/tlc-door.js.
  const [tlcDoorOnly] = useState(() => isTlcDoorContext());
  // Measure how the app is used, to make it better (Darrell 2026-07-04). One
  // place captures every tab open (URL-driven + every nav button). Sovereign,
  // fail-soft, signed-out no-op, aggregate-only to the governor (usage-events).
  useEffect(() => { recordView(view); }, [view]);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const feedbackReveal = useIdleReveal(); // idle-dim + reveal-on-scroll (Pattern 2d)
  // DR-0059 Phase 2 — a NEW non-family signed-in user gets a named welcome once,
  // instead of falling through to the family persona picker. Presentational only.
  const [selfServeWelcomeDismissed, setSelfServeWelcomeDismissed] = useState(() => {
    try { return typeof window !== 'undefined' && !!window.localStorage.getItem('poe-selfserve-welcomed'); }
    catch (e) { return false; }
  });
  const dismissSelfServeWelcome = () => {
    try { window.localStorage.setItem('poe-selfserve-welcomed', '1'); } catch (e) { /* ignore */ }
    setSelfServeWelcomeDismissed(true);
  };
  const [booksView, setBooksView] = useState('calendar');
  const [churchView, setChurchView] = useState(getInitialChurchView());
  // TLC — the unified TLC Therapy Solutions workspace (Darrell 2026-07-13: "the
  // Whole TLC App... one single tab that holds all of it"). One office, three
  // views of the same office: Practice (operations + clinician roster), Intake
  // (Inbound), and Assistant (referral/outreach). Condenses the three separate
  // TLC surfaces into one entry; the individual routes stay valid for deep-links.
  const [tlcSub, setTlcSub] = useState('practice');
  // Which SECTION the church home opens on when a launch target names one —
  // the Council Chamber is the 'speak' section (DR-0142); null = Worship default.
  const [churchHomeSection, setChurchHomeSection] = useState(null);
  // Real browser BACK / FORWARD (lib/nav-history.js). Every top tab + Books/
  // Church sub-tab flows through this triple, so the device Back button, the
  // in-app NavControls, and deep-links all work app-wide without a router. The
  // hook owns window.history push/pop + scroll restoration; it is StrictMode-
  // safe (ref-guarded) and a no-op when window.history is unavailable.
  const navHistory = useBrowserHistoryNav({ view, setView, booksView, setBooksView, churchView, setChurchView });
  // The app-wide feedback modal is a true overlay — device/in-app Back should
  // CLOSE it, not leave the page. Stable close callback so the hook's listener
  // identity is stable across renders.
  const closeFeedback = useCallback(() => setFeedbackOpen(false), []);
  useHistoryToggle(feedbackOpen, closeFeedback, 'feedback');
  const [entityFilter, setEntityFilter] = useState('all');
  const [snowballSort, setSnowballSort] = useState('smallest-balance');
  const [snowballExtra, setSnowballExtra] = useState(2000);
  const [debtSnowballSort, setDebtSnowballSort] = useState('snowball');
  const [debtSnowballExtra, setDebtSnowballExtra] = useState(500);
  // Theme is per-device and SHARED with the business doors (lib/theme-css.js):
  // the choice made here follows the user to /moore and every future door.
  const [theme, setTheme] = useState(() => readThemePref('midnight'));
  useEffect(() => { saveThemePref(theme); }, [theme]);
  // One-click HEADER HIDEAWAY (Darrell 2026-06-29): collapse the top chrome —
  // date/time, build line, account/business/subscribe row, voice picker, font
  // controls, theme swatches, the Sample banner — to ALL the room for the
  // dashboard, while the TAB ROW stays pinned at the top so navigation never
  // moves. One tap reopens it. The preference is per-device (the same fail-soft
  // localStorage pattern as text-size + profile), so it stays however the user
  // left it. Default = open (the full header) for a familiar first impression.
  const [headerCollapsed, setHeaderCollapsed] = useState(() => readHeaderCollapsed());
  const toggleHeaderChrome = () => {
    // Reuse the scroll-anchor: pin the content the user is looking at, flip the
    // header height, restore the same spot after layout — no jump (DR-0075 feel).
    const token = (typeof window !== 'undefined') ? captureAnchor() : null;
    setHeaderCollapsed(prev => {
      const next = nextCollapsed(prev);
      writeHeaderCollapsed(next); // per-device, fail soft
      return next;
    });
    if (typeof window !== 'undefined' && token) {
      // two frames: let the header re-layout before we re-align the anchor
      window.requestAnimationFrame(() => window.requestAnimationFrame(() => { try { applyAnchor(token); } catch (e) { /* soft */ } }));
    }
  };
  const [notifPermission, setNotifPermission] = useState(typeof Notification !== 'undefined' ? Notification.permission : 'unsupported');
  // 2026-06-12 — persistence problems must be VISIBLE (PERPETUAL-PIPELINE-
  // HEALTH: no silent failure on the path the family's memories ride).
  // Set by the storage-quota catch and by cloud-sync upload failures;
  // rendered as a banner under AuthBanner. null = healthy.
  const [persistIssue, setPersistIssue] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const firedRemindersRef = useRef(new Set());
  // Real users get a REAL "today" — a person's debt-payoff projection, "months
  // until debt-free," payoff dates, and the default date on a new transaction must
  // be computed from the actual current date, never a frozen one (Darrell 2026-06-15:
  // "all reports are supposed to be dynamic from a user's personal data... not fake").
  // The ONLY place the old May-2026 anchor still belongs is the demo / picker, where
  // a stable date keeps the aspirational SAMPLE numbers from drifting between visits
  // (SEED-DATA-AS-ASPIRATION). So: anchor in demo, real today for everyone else.
  const currentDate = useMemo(() => (isAnyDemoMode ? new Date(2026, 4, 15) : new Date()), [isAnyDemoMode]);
  // D20b — Top-right header date is ALWAYS today, for EVERYONE, every mode
  // (Darrell's 2026-06-03 callout: it was showing the snapshot anchor "May '26").
  // 2026-07-08 recurrence (Darrell: "date is stale"): the date memo computed
  // ONCE at mount, so a PWA resumed the next day still showed yesterday's date
  // beside a live-ticking time. Date and time now BOTH derive from the same
  // ticking clock — the header date is the "system is alive RIGHT NOW" signal
  // and must reflect today across a suspended overnight session, every mode.
  // Light 20s interval (minute-resolution display, so per-second re-renders of
  // this large component are wasted); cleans up on unmount; renders in the
  // user's own timezone via native Intl, silent fallback if the platform lacks it.
  const [headerClockNow, setHeaderClockNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setHeaderClockNow(new Date()), 20000);
    return () => clearInterval(id);
  }, []);
  const headerDateLabel = useMemo(() => {
    try {
      return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(headerClockNow);
    } catch (e) {
      return monthLabel(headerClockNow, 0);
    }
  }, [headerClockNow]);
  const headerTimeLabel = useMemo(() => {
    try {
      return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(headerClockNow);
    } catch (e) {
      return '';
    }
  }, [headerClockNow]);

  // Layer 2 — cross-device feedback sync. Local feedback (data.feedback)
  // stays in localStorage; remote-authored feedback from other devices
  // lives in this separate state slice and gets merged into the array
  // passed to About.jsx. We deliberately do NOT mirror remote items into
  // data.feedback because the storage save effect would then persist
  // them to localStorage too, duplicating data.
  const [remoteFeedback, setRemoteFeedback] = useState([]);
  // 0077 — family-wide module-interest aggregate ({ [moduleKey]: { votes, points, latestAt } }).
  const [familyModuleInterest, setFamilyModuleInterest] = useState(null);
  const [authSession, setAuthSession] = useState(null);
  // True once the first auth check resolves (signed in OR out) — gates the
  // "no profile, no access" screen so it never flashes at a signed-in user.
  const [authChecked, setAuthChecked] = useState(false);
  // 2026-06-11 — true once the signed-in public-host hydration finished;
  // gates persistence so demo data can never overwrite the owner's snapshot.
  const [authHydrated, setAuthHydrated] = useState(false);
  const [showVerifyBalances, setShowVerifyBalances] = useState(false);

  // Multi-user Layer A (2026-05-28) — `currentProfile` gates which entities
  // the user sees. Stored separately from `data` so it doesn't pollute the
  // sync model; persists in localStorage so the picker only shows once.
  // Layer B (workflow 21 + session token) will add real auth on top. See
  // docs/99-session-notes/2026-05-28-brief-multi-user-profiles.md.
  const [currentProfile, setCurrentProfile] = useState(() => {
    if (isAnyDemoMode) return 'family'; // Demo + picker skip profile picker.
    if (isPublicHost() || reviewerMode) return null; // SECURITY: public host never reads saved profile; a reviewer boots the public flow.
    try { return localStorage.getItem('poe-current-profile') || null; }
    catch (e) { return null; }
  });
  const setProfile = (p) => {
    setCurrentProfile(p);
    // A reviewer's picks never touch this device's SAVED profile (state only).
    try { if (!reviewerMode) { if (p) localStorage.setItem('poe-current-profile', p); else localStorage.removeItem('poe-current-profile'); } }
    catch (e) {}
    // Reset entity filter when switching profiles so we never leave it
    // pointing at an entity the new profile can't see.
    setEntityFilter('all');
  };

  // ---------------------------------------------------------------------------
  // Multi-point auth (Phase 1, 2026-06-14) — the >= 2-of-3-points access gate.
  // P1 identity = signed in; P2 = this device is trusted; P3 = PIN verified.
  // The decision is computed by lib/multi-point-auth.js (decideAccess); these
  // are the signals that feed it. This is layered ABOVE the existing flow and
  // does NOT regress #131 — the self profile, EMPTY_WORLD, name-hiding, and the
  // wf18 family-email guard are all untouched. Enforced only for a SIGNED-IN
  // session on a PUBLIC host; the internal/Tailscale no-auth family device is
  // inside the trust boundary and is unchanged. Degrades to identity-only if the
  // PIN/device backend isn't reachable (no-lockout; e.g. preview before 0022).
  // ---------------------------------------------------------------------------
  const [mpDeviceTrusted, setMpDeviceTrusted] = useState(false);
  const [mpHasPin, setMpHasPin] = useState(false);
  const [mpBackendAvailable, setMpBackendAvailable] = useState(true);
  const [mpSignalsLoaded, setMpSignalsLoaded] = useState(false);
  // SESSION-scoped (sessionStorage) verified flag — NEVER the PIN itself, only a
  // boolean that this tab session has cleared the PIN. Cleared on sign-out.
  const [mpPinVerified, setMpPinVerified] = useState(false);
  const mpPinOkKey = (uid) => 'poe-pin-ok:' + String(uid || 'anon');
  // Biometric (fingerprint / Face via WebAuthn — lib/webauthn.js). A faster way
  // to satisfy the SAME human-presence point as the PIN, on a known device.
  // mpHasBiometric = a credential is enrolled on THIS device; mpBioSupported =
  // the device has a platform authenticator we could offer enrollment on;
  // mpBiometricVerified = this tab session unlocked via biometric (a verified
  // presence proof, session-scoped exactly like the PIN flag). The biometric
  // never leaves the device; we store only its public key + credential id.
  const [mpHasBiometric, setMpHasBiometric] = useState(false);
  const [mpBioSupported, setMpBioSupported] = useState(false);
  const [mpBiometricVerified, setMpBiometricVerified] = useState(false);
  const [bioOfferOpen, setBioOfferOpen] = useState(false); // post-grant enroll offer
  const mpBioOkKey = (uid) => 'poe-bio-ok:' + String(uid || 'anon');
  const mpBioOfferKey = (uid) => 'poe-bio-offered:' + String(uid || 'anon');
  // Persona-PIN (family shared-device picker gate) state.
  const [mpPersonasWithPin, setMpPersonasWithPin] = useState([]);
  const [mpInstanceId, setMpInstanceId] = useState(null);
  const [pendingPersona, setPendingPersona] = useState(null); // persona awaiting its PIN
  const [changePinOpen, setChangePinOpen] = useState(false);   // Security → Change PIN

  // 2026-06-12 fix ("why Adam, not Darrell?"): the sanitized display names
  // (Adam/Naomi) exist so PUBLIC visitors never see the family's real names.
  // 2026-06-14 hardening: a signed-in session alone is NOT enough — a NON-family
  // user who signs up also has an authSession, and must never see "Darrell"/
  // "Christina" as selectable buttons. Real names show only to a VERIFIED family
  // email; every other state (anonymous, demo, picker, outside signed-in user)
  // keeps the sanitized pair.
  const isFamilyMember = !reviewerMode && isFamilyEmail(authSession?.user?.email);
  // Church staff get the church staff-only surfaces (Observation) and nothing
  // more — never the family/Governor scope. Family are staff too (superset).
  const isChurchStaff = !reviewerMode && (isFamilyMember || isChurchStaffEmail(authSession?.user?.email));
  // The private Study circle (Darrell + Christina + BG). Gates both the nav entry
  // (so the wider team never sees it) and the view render (defense in depth).
  const isStudyCircle = !reviewerMode && isStudyCircleEmail(authSession?.user?.email);
  const PROFILES = [
    { id: 'darrell', name: isFamilyMember ? 'Darrell' : 'Adam', sub: 'full owner view', accent: '#1A1815' },
    { id: 'christina', name: isFamilyMember ? 'Christina' : 'Naomi', sub: 'personal + practice', accent: '#B85838' },
    { id: 'family', name: 'Family', sub: 'household roll-up only', accent: '#5A6E3D' },
  ];

  // Security gate for the Books -> Imported subview, which surfaces real bank +
  // Gmail PII from n8n workflow 18 (Chase payees, Zelle recipients, Cash App).
  // Until Multi-user Layer B PIN auth ships, the closest signal for "this is
  // the family on their own device viewing their own data" is an established
  // saved profile (poe-current-profile). It is null for every public /
  // incognito / returning-but-unauthenticated visitor to poetech.us, and
  // forced to a demo value in any ?demo / picker state.
  //
  // 2026-06-03 hardening: localStorage alone is defeatable on the owner's own
  // device (a non-incognito tab carries the saved profile, which would unlock
  // Imported on poetech.us itself). The PUBLIC DOMAIN must NEVER render real
  // PII regardless of localStorage state. Layered gate now requires ALL of:
  //   1. Host is NOT public (must be localhost / Tailscale-internal)
  //   2. NOT in any demo / picker state
  //   3. A saved profile exists
  // The family accesses real imported data via the Tailscale-internal URL only.
  // poetech.us / *.vercel.app are PUBLIC-FRONT-DOOR only — no PII ever.
  // 2026-06-11 (P14 pattern, applied deliberately to the MOST sensitive gate):
  // a signed-in, hydrated OWNER may see their own imported bank events on a
  // public host too — anonymous visitors and demo/picker states still never
  // do, and a saved profile is still required. The wf18 bearer is only ever
  // attached past this gate.
  // 2026-06-14: the wf18 Imported feed is a SINGLE shared NAS webhook serving
  // the FAMILY's bank/Gmail PII — it is NOT RLS-scoped per signed-in user. Now
  // that a non-family user gets a self-serve profile (so the picker no longer
  // traps them), a truthy currentProfile alone can no longer be the public-host
  // key, or an outsider would unlock the family's bank data. On a public host
  // the gate requires a VERIFIED family email; the internal/Tailscale family
  // device (no auth needed) is unchanged.
  const importedAllowed = isImportedAllowed({
    isAnyDemoMode: isAnyDemoMode || reviewerMode, currentProfile, isPublicHostVal: isPublicHost(), authSession, authHydrated,
  });

  // ---------------------------------------------------------------------------
  // Multi-point auth — compute the access decision and the gate handlers.
  // Enforced ONLY for a signed-in session on a public host after hydration +
  // signal load. (Internal/Tailscale family device has no authSession and is
  // unchanged; demo/anonymous never reach here.)
  // ---------------------------------------------------------------------------
  const mpEnforce = !!authSession && isPublicHost() && !isAnyDemoMode && authHydrated && mpSignalsLoaded;
  const accessDecision = decideAccess({
    identityPresent: !!authSession,
    deviceTrusted: mpDeviceTrusted,
    pinVerified: mpPinVerified,
    hasPin: mpHasPin,
    biometricVerified: mpBiometricVerified,
    hasBiometric: mpHasBiometric,
    backendAvailable: mpBackendAvailable,
  });
  // The presence gate renders for SET_PIN / ENTER_PIN / ENTER_BIOMETRIC. The PIN
  // gate IS the surface for all three (it carries the biometric button on top in
  // the ENTER cases), so the new step joins the same render condition.
  const showPinGate = mpEnforce
    && (accessDecision.nextStep === NEXT_STEP.SET_PIN
      || accessDecision.nextStep === NEXT_STEP.ENTER_PIN
      || accessDecision.nextStep === NEXT_STEP.ENTER_BIOMETRIC);

  const markPinVerified = () => {
    setMpPinVerified(true);
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(mpPinOkKey(authSession?.user?.id), String(new Date().toISOString()));
      }
    } catch (_) { /* sessionStorage unavailable */ }
  };
  const markBiometricVerified = () => {
    setMpBiometricVerified(true);
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(mpBioOkKey(authSession?.user?.id), String(new Date().toISOString()));
      }
    } catch (_) { /* sessionStorage unavailable */ }
  };
  // After a full multi-point login on an untrusted device, mint device trust so
  // next time only the PIN is needed (the fast path).
  const maybeTrustDevice = async () => {
    const after = decideAccess({ identityPresent: true, deviceTrusted: mpDeviceTrusted, pinVerified: true, hasPin: true, backendAvailable: mpBackendAvailable });
    if (shouldIssueDeviceTrust(after, mpDeviceTrusted)) {
      const t = await trustThisDevice(authSession?.user?.id);
      if (t.ok) setMpDeviceTrusted(true);
    }
  };
  const handleSetPin = async (pin) => {
    const r = await setUserPin(pin);
    if (r.ok) { setMpHasPin(true); markPinVerified(); await maybeTrustDevice(); maybeOfferBiometric(); }
    return r;
  };
  const handleEnterPin = async (pin) => {
    const r = await verifyUserPin(pin);
    if (r.ok) { markPinVerified(); await maybeTrustDevice(); maybeOfferBiometric(); }
    return r;
  };
  // Biometric fast-unlock: prompt the platform authenticator and, on a verified
  // assertion, mark presence + take the device-trust fast path. Any failure
  // (cancel / no match / unsupported) returns !ok and the gate keeps the PIN as
  // the fallback — biometric can never strand the user (no-lockout).
  const handleBiometricUnlock = async () => {
    const r = await unlockWithBiometric(authSession?.user?.id);
    if (r.ok) { markBiometricVerified(); await maybeTrustDevice(); }
    return r;
  };
  // After a successful PIN entry/set on a biometric-capable device that hasn't
  // enrolled yet, offer the one-tap unlock — once (we remember the offer so we
  // never nag). Opt-in: enrollment only runs on the user's explicit tap.
  const maybeOfferBiometric = () => {
    try {
      const uid = authSession?.user?.id;
      if (!mpBioSupported || mpHasBiometric) return;
      if (typeof localStorage !== 'undefined' && localStorage.getItem(mpBioOfferKey(uid))) return;
      setBioOfferOpen(true);
    } catch (_) { /* ignore */ }
  };
  const dismissBiometricOffer = () => {
    setBioOfferOpen(false);
    try {
      if (typeof localStorage !== 'undefined') localStorage.setItem(mpBioOfferKey(authSession?.user?.id), '1');
    } catch (_) { /* ignore */ }
  };
  const handleEnrollBiometric = async () => {
    const r = await enrollBiometric({
      userId: authSession?.user?.id,
      userName: authSession?.user?.email || 'PoeTech user',
      displayName: authSession?.user?.email || 'PoeTech user',
    });
    if (r.ok) { setMpHasBiometric(true); markBiometricVerified(); }
    dismissBiometricOffer();
    return r;
  };
  // No-lockout recovery: forget this device's local trust and sign out so the
  // user re-proves identity (email OTP / OAuth), then sets a new PIN. set_user_pin
  // is always allowed for the authenticated user, so identity is always a way back.
  const handleForgotPin = () => {
    try { forgetLocalDeviceTrust(authSession?.user?.id); } catch (_) { /* ignore */ }
    try {
      if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem(mpPinOkKey(authSession?.user?.id));
    } catch (_) { /* ignore */ }
    try { signOut(); } catch (_) { /* ignore */ }
  };

  // Family shared-device persona gate ("anyone taps Darrell" fix). Selecting a
  // real family persona (darrell/christina) requires that person's PIN when one
  // is set. No PIN set yet -> selection allowed (no-lockout); 'family' roll-up
  // and the sanitized personas (outside viewers) are never gated.
  const handlePersonaSelect = (p) => {
    const gated = isPersonaGated(p.id, isFamilyMember);
    if (!gated) { setProfile(p.id); return; }
    const decision = decidePersonaSelect({
      hasPersonaPin: mpPersonasWithPin.includes(p.id),
      personaPinVerified: false,
      backendAvailable: mpBackendAvailable && !!mpInstanceId,
    });
    if (decision.allowed) { setProfile(p.id); return; }
    setPendingPersona(p.id); // open the persona-PIN gate
  };

  // Demo welcome modal — only shown when ?demo=… is in the URL. Sets the
  // viewer's expectation about what they're looking at and what they can do,
  // then steps out of the way. Dismissing it shows the demo banner along the
  // top instead, which stays put until they close the tab.
  const [demoWelcomeOpen, setDemoWelcomeOpen] = useState(isDemoMode);

  // Waitlist intake modal — 2026-05-28 evening, vacation-mode pivot.
  // Originally pointed at n8n workflow 29 on the NAS, but that path requires
  // a bind mount we can't add before Darrell leaves for Hawaii. Switched to
  // formsubmit.co — they email darrellpoe06@gmail.com on every signup, zero
  // NAS dependency, works from anywhere. First time anyone signs up Darrell
  // will get a "confirm subscription" email from formsubmit; one click and
  // every subsequent signup flows to his Gmail inbox. Post-vacation we move
  // back to n8n once the bind mount + bearer auth land. Per Darrell:
  // "this is a once in a lifetime opportunity I might meet the person who
  // makes a good fit for our services. I want to prove our MVP."
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [waitlistForm, setWaitlistForm] = useState({ name: '', email: '', phone: '', interest: '', notes: '' });
  const [waitlistState, setWaitlistState] = useState({ submitting: false, success: false, error: null, id: null });
  const submitWaitlist = async () => {
    if (!waitlistForm.email || !waitlistForm.email.includes('@')) {
      setWaitlistState({ submitting: false, success: false, error: 'A valid email is required so we can reach you.', id: null });
      return;
    }
    setWaitlistState({ submitting: true, success: false, error: null, id: null });
    // Client-side id for the user-facing confirmation. formsubmit doesn't
    // return one of its own, but the user expects to see a confirmation ref.
    const localId = 'wl-' + new Date().toISOString().replace(/[:.]/g, '-') + '-' + Math.floor(Math.random() * 10000);
    try {
      const r = await fetch('https://formsubmit.co/ajax/darrellpoe06@gmail.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          _subject: 'PoeTech waitlist · new signup',
          _captcha: 'false',
          _template: 'table',
          confirmation_id: localId,
          name: waitlistForm.name || '(no name)',
          email: waitlistForm.email,
          phone: waitlistForm.phone || '(none)',
          interest: waitlistForm.interest || '(not specified)',
          notes: waitlistForm.notes || '(none)',
          source: 'poetech.us · picker',
          captured_at: new Date().toISOString(),
        })
      });
      const json = await r.json().catch(() => ({}));
      // formsubmit returns { success: 'true'|'false' OR true|false, message }.
      // Treat anything non-2xx OR success === 'false' as failure.
      const succeeded = r.ok && json.success !== 'false' && json.success !== false;
      if (!succeeded) {
        setWaitlistState({ submitting: false, success: false, error: (json.message || `Submission failed (HTTP ${r.status}). Please try again or email darrellpoe06@gmail.com.`), id: null });
        return;
      }
      setWaitlistState({ submitting: false, success: true, error: null, id: localId });
    } catch (e) {
      setWaitlistState({ submitting: false, success: false, error: `Could not reach the signup endpoint: ${e.message}. Please email darrellpoe06@gmail.com directly.`, id: null });
    }
  };

  // Data-dump release (Layers 1-3) — 2026-05-29. The five-layer spec's
  // user-facing entry. Drop a bank file, see your money in our lens, see
  // your stewardship skill profile, see matched services. Session-only;
  // nothing persists. Per data-dump-to-matched-services session note.
  // Wires to workflows 33 (data-upload) → 34 (skill-analytics) → 35
  // (matched-services). All sovereign on NAS via Ollama 14b.
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadStage, setUploadStage] = useState('idle'); // idle|parsing|parsed|analyzing|profile|matching|matched|error
  const [uploadResult, setUploadResult] = useState({ transactions: [], summary: null, format: '', profile: null, stats: null, matches: [], error: null });
  const resetUpload = () => {
    setUploadStage('idle');
    setUploadResult({ transactions: [], summary: null, format: '', profile: null, stats: null, matches: [], error: null });
  };
  const handleUploadFile = async (file) => {
    if (!file) return;
    const base = N8N_BASE;
    if (!base) {
      setUploadStage('error');
      setUploadResult(prev => ({ ...prev, error: 'Upload endpoint not configured. Set VITE_N8N_WEBHOOK_BASE.' }));
      return;
    }
    setUploadStage('parsing');
    setUploadResult(prev => ({ ...prev, error: null }));
    try {
      const text = await file.text();
      const ext = (file.name.split('.').pop() || '').toLowerCase();
      const format = (ext === 'qfx' || ext === 'ofx' || ext === 'csv') ? ext : 'auto';
      const r = await fetch(`${base.replace(/\/+$/, '')}/webhook/data-upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        mode: 'cors',
        body: JSON.stringify({ format, content: text, filename: file.name })
      });
      const json = await r.json().catch(() => ({}));
      if (!r.ok || json.ok === false) {
        setUploadStage('error');
        setUploadResult(prev => ({ ...prev, error: json.error || `Parse failed (HTTP ${r.status})` }));
        return;
      }
      setUploadStage('parsed');
      setUploadResult(prev => ({ ...prev, transactions: json.transactions || [], summary: json.summary || null, format: json.format_detected || format }));
    } catch (e) {
      setUploadStage('error');
      setUploadResult(prev => ({ ...prev, error: `Could not read file: ${e.message}` }));
    }
  };
  const runSkillAnalytics = async () => {
    const base = N8N_BASE;
    if (!base) return;
    setUploadStage('analyzing');
    try {
      const r = await fetch(`${base.replace(/\/+$/, '')}/webhook/skill-analytics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        mode: 'cors',
        body: JSON.stringify({ transactions: uploadResult.transactions })
      });
      const json = await r.json().catch(() => ({}));
      if (!r.ok || json.ok === false) {
        setUploadStage('error');
        setUploadResult(prev => ({ ...prev, error: json.error || `Analytics failed (HTTP ${r.status})` }));
        return;
      }
      setUploadStage('profile');
      setUploadResult(prev => ({ ...prev, profile: { diagnostic_summary: json.diagnostic_summary, strengths: json.strengths, gaps_to_consider: json.gaps_to_consider, profile: json.profile }, stats: json.stats }));
    } catch (e) {
      setUploadStage('error');
      setUploadResult(prev => ({ ...prev, error: `Analytics call failed: ${e.message}` }));
    }
  };
  const runMatchedServices = async () => {
    const base = N8N_BASE;
    if (!base) return;
    setUploadStage('matching');
    try {
      const r = await fetch(`${base.replace(/\/+$/, '')}/webhook/matched-services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        mode: 'cors',
        body: JSON.stringify({ profile: (uploadResult.profile && uploadResult.profile.profile) || {}, transactions: uploadResult.transactions, stats: uploadResult.stats || {} })
      });
      const json = await r.json().catch(() => ({}));
      if (!r.ok || json.ok === false) {
        setUploadStage('error');
        setUploadResult(prev => ({ ...prev, error: json.error || `Matching failed (HTTP ${r.status})` }));
        return;
      }
      setUploadStage('matched');
      setUploadResult(prev => ({ ...prev, matches: json.matches || [] }));
    } catch (e) {
      setUploadStage('error');
      setUploadResult(prev => ({ ...prev, error: `Matching call failed: ${e.message}` }));
    }
  };

  // Phase 2B.2 (2026-05-28) — top-level fetch of all ingested finance data
  // from n8n workflow 18. Lifted up from BooksTransactions + BooksAccounts
  // so the whole app shares one feed: Tx tab, Accounts tab, Big Picture
  // dashboard, future surfaces all read the same `ingestData` shape. One
  // network call per 5 minutes instead of three.
  //
  // Sovereign-loop: all data flows from /volume1/PoeTech/finance-events/
  // via the Tailscale Funnel URL set in VITE_N8N_WEBHOOK_BASE.
  //
  // ingestData shape: {
  //   transactions: [...], gmail_events: [...], bank_balances: {...},
  //   counts: {...}, served_at, meta: { loaded, error }
  // }
  // ingestData — the wf18/n8n "imported overlay" is RETIRED (2026-07-01). The
  // verified bank ledger now lives in data.transactions (synced from the DB via
  // transactionsSync), so the separate n8n fetch is superseded and removed: no
  // network call, no "could not reach workflow 18", no Funnel dependency. This
  // stays an empty, already-loaded overlay purely for backward-compatible props;
  // consumers (Books → Tx, Accounts, Big Picture, Imported) read data.transactions.
  const [ingestData] = useState({
    transactions: [], gmail_events: [], bank_balances: {},
    counts: { total_bank: 0, total_gmail: 0, status_counts: {}, institutions: [] },
    served_at: null,
    meta: { loaded: true, error: null }
  });

  // 2026-06-11 — the public-host gate is about ANONYMOUS visitors (the
  // 2026-06-03 leak was real ops data rendering to whoever opened poetech.us).
  // A SIGNED-IN owner is a different trust boundary: their own saved data on
  // their own device belongs to them. hydratedForAuthRef ensures the
  // signed-in hydration runs once per session.
  const hydratedForAuthRef = useRef(false);
  // v2.15 family snapshot (2026-06-12): pull-once-per-session gate + push
  // throttle. snapshotPulledRef must be true before ANY push — a fresh seed
  // device pulls (and applies) the family's real snapshot before it is ever
  // allowed to write one.
  const snapshotPulledRef = useRef(false);
  const lastSnapshotPushRef = useRef(0);

  // Pull the family snapshot once per signed-in session, after this device's
  // own load finished (public hosts: after the auth hydration; private hosts:
  // after the boot load). Apply policy (provenance-aware, in priority order):
  //   1. This device's remainder is still SEED scaffolding → ALWAYS adopt the
  //      family snapshot. (A seed device persists constantly, so naive
  //      "local is newer" timestamps would block the real world forever.)
  //   2. This device holds a REAL world and has never joined the snapshot
  //      (no marker) → adopt NOTHING; it becomes the source on next push.
  //   3. Joined before → adopt only a snapshot newer than the marker.
  // The payload contains no table-synced lists, no notes, no photo bytes
  // (snapshot-sync.js), so applying it cannot clobber those; matched rentals
  // additionally keep this device's room photos.
  useEffect(() => {
    if (!authSession || isAnyDemoMode || reviewerMode || snapshotPulledRef.current) return;
    const readyToPull = isPublicHost() ? authHydrated : loaded;
    if (!readyToPull) return;
    snapshotPulledRef.current = true;
    let cancelled = false;
    (async () => {
      try {
        const remote = await fetchSnapshot();
        if (cancelled || !remote || !remote.payload) return;
        const latest = (typeof window !== 'undefined' && window.__POETECH_LATEST_DATA__) || data;
        let marker = null;
        try { marker = localStorage.getItem('poe-snapshot-marker'); } catch (_) { /* no marker */ }
        const stillSeed = remainderIsSeed(latest);
        if (!stillSeed && !marker) return; // rule 2: a real un-joined world is protected
        if (!stillSeed && marker && new Date(remote.updatedAt) <= new Date(marker)) return; // rule 3
        try { localStorage.setItem('poe-snapshot-marker', remote.updatedAt); } catch (_) { /* non-fatal */ }
        const p = remote.payload;
        setData(d => {
          const snapData = p.data || {};
          const next = { ...d, ...snapData };
          if (snapData.inflows && Array.isArray(snapData.inflows.rentals)) {
            next.inflows = {
              ...snapData.inflows,
              rentals: mergeKeepingLocalRoomPhotos(d.inflows?.rentals || [], snapData.inflows.rentals),
            };
          }
          return next;
        });
        if (p.pressure != null) setPressure(p.pressure);
        if (p.snowballSort) setSnowballSort(p.snowballSort);
        if (p.snowballExtra != null) setSnowballExtra(p.snowballExtra);
        if (p.debtSnowballSort) setDebtSnowballSort(p.debtSnowballSort);
        if (p.debtSnowballExtra != null) setDebtSnowballExtra(p.debtSnowballExtra);
        if (p.theme) setTheme(p.theme);
      } catch (e) {
        syncWarn('[snapshot-sync] pull failed', e);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authSession, authHydrated, loaded]);
  useEffect(() => {
    if (isAnyDemoMode) { setLoaded(true); return; } // Demo + picker skip storage load entirely.
    // 2026-06-03 SECURITY: PUBLIC DOMAIN MUST NOT HYDRATE FROM LOCAL STORAGE
    // FOR ANONYMOUS VISITORS. The previous gate stopped the wf18 webhook fetch
    // but localStorage could still hydrate the entire app with the family's
    // REAL ops data on a non-incognito tab opened on poetech.us from the
    // family's own device — the Big Picture dashboard then surfaced real
    // entity names, property addresses, project titles to whatever tab was
    // open. On any public host (poetech.us, *.vercel.app), anonymous visitors
    // get the demo sample + no hydration. (Signed-in hydration is handled by
    // the auth effect below — 2026-06-11, "fake data mixed with ours" fix.)
    if (isPublicHost() || reviewerMode) {
      setData(DEMO_DATA_FAMILY_OF_4);
      setLoaded(true);
      return;
    }
    (async () => { await loadSavedSnapshot(); setLoaded(true); })();
    // Run-once boot hydration by design; isAnyDemoMode is URL-derived and
    // fixed for the page load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Loads this device's saved snapshot into state (defensive merge). Shared
  // by the mount-time load (private hosts) and the signed-in load on public
  // hosts: an authenticated owner gets their own data anywhere. Returns
  // true when a snapshot existed.
  // forUserId (optional): when the signed-in PUBLIC-HOST hydration calls
  // this, refuse a snapshot stamped with a DIFFERENT owner. 2026-06-12 fix:
  // the gate used to check that *a* session exists, not *whose* — on a
  // shared device (church kiosk) anyone signing in with any account would
  // hydrate the previous family's saved data. Legacy snapshots without an
  // owner stamp still load (and get stamped on next save). Private hosts
  // pass no forUserId — the device-trust model there is unchanged.
  const loadSavedSnapshot = async (forUserId = null) => {
      try {
        let saved = await window.storage.get('poe-financial-v28');
        if (saved && saved.value && forUserId) {
          try {
            const ownerCheck = JSON.parse(saved.value);
            if (ownerCheck.owner && ownerCheck.owner !== forUserId) return false;
          } catch (_) { /* unparseable → treated as not found below */ }
        }
        if (!saved || !saved.value) saved = await window.storage.get('poe-financial-v27');
        if (!saved || !saved.value) saved = await window.storage.get('poe-financial-v26');
        if (!saved || !saved.value) saved = await window.storage.get('poe-financial-v25');
        if (!saved || !saved.value) saved = await window.storage.get('poe-financial-v24');
        if (!saved || !saved.value) saved = await window.storage.get('poe-financial-v23');
        if (!saved || !saved.value) saved = await window.storage.get('poe-financial-v22');
        if (!saved || !saved.value) saved = await window.storage.get('poe-financial-v21');
        if (saved && saved.value) {
          const parsed = JSON.parse(saved.value);
          // v17: defensive merge — ensure all required fields exist even if saved data is from an older version
          if (parsed.data) setData(d => ({
            ...d,
            ...parsed.data,
            // Multi-user Layer A — backfill `visibleTo` on saved entities so
            // existing devices loading old data continue working. Defaults
            // match the seed: owner sees all, family-rollup includes business
            // entities, TLC is christina-only.
            entities: Array.isArray(parsed.data.entities)
              ? parsed.data.entities.map(e => ({
                  ...e,
                  visibleTo: Array.isArray(e.visibleTo) && e.visibleTo.length > 0
                    ? e.visibleTo
                    : (e.id === 'e-tlc' ? ['darrell', 'christina']
                       : e.id === 'e-personal' ? ['darrell', 'christina', 'family']
                       : ['darrell']),
                }))
              : (d.entities || []),
            events: Array.isArray(parsed.data.events) ? parsed.data.events : (d.events || []),
            projects: Array.isArray(parsed.data.projects) ? parsed.data.projects : (d.projects || []),
            subscriptions: Array.isArray(parsed.data.subscriptions) ? parsed.data.subscriptions : (d.subscriptions || []),
            feedback: Array.isArray(parsed.data.feedback) ? parsed.data.feedback : (d.feedback || []),
            welcomeDismissed: parsed.data.welcomeDismissed === true,
            moduleInterest: parsed.data.moduleInterest || d.moduleInterest || {},
            // Round 10 — backfill ITSM fields on old incidents that pre-date the taxonomy.
            incidents: Array.isArray(parsed.data.incidents)
              ? parsed.data.incidents.map(i => ({
                  urgency: 'incident',
                  status: i.status || 'resolved',
                  dueDate: i.dueDate || i.date || '',
                  ...i,
                }))
              : (d.incidents || []),
            recurringObligations: Array.isArray(parsed.data.recurringObligations) ? parsed.data.recurringObligations : (d.recurringObligations || []),
            scopes: Array.isArray(parsed.data.scopes) ? parsed.data.scopes : (d.scopes || []),
            // Concerns (0039) — the curated Concerns & Solutions rows. Hydrated
            // defensively so a concern added while signed-out survives a reload
            // (cloud sync covers the signed-in path on top of this).
            concerns: Array.isArray(parsed.data.concerns) ? parsed.data.concerns : (d.concerns || []),
            practiceInquiries: Array.isArray(parsed.data.practiceInquiries) ? parsed.data.practiceInquiries : (d.practiceInquiries || []),
            inquiries: Array.isArray(parsed.data.inquiries) ? parsed.data.inquiries : (d.inquiries || []),
            checkoutIntents: Array.isArray(parsed.data.checkoutIntents) ? parsed.data.checkoutIntents : (d.checkoutIntents || []),
            userTier: typeof parsed.data.userTier === 'string' ? parsed.data.userTier : (d.userTier || 'foundation'),
            // v28+ MVP v1.5: defensive merge for new collections so old saves still load.
            capexItems: Array.isArray(parsed.data.capexItems) ? parsed.data.capexItems : (d.capexItems || []),
            watchlist: Array.isArray(parsed.data.watchlist) ? parsed.data.watchlist : (d.watchlist || []),
            church: (parsed.data.church && typeof parsed.data.church === 'object') ? { ...d.church, ...parsed.data.church } : d.church,
            prayerRequests: Array.isArray(parsed.data.prayerRequests) ? parsed.data.prayerRequests : (d.prayerRequests || []),
            skillProfiles: Array.isArray(parsed.data.skillProfiles) ? parsed.data.skillProfiles : (d.skillProfiles || []),
            voiceOps: (parsed.data.voiceOps && typeof parsed.data.voiceOps === 'object') ? { ...d.voiceOps, ...parsed.data.voiceOps } : d.voiceOps,
          }));
          if (parsed.pressure != null) setPressure(parsed.pressure);
          if (parsed.snowballSort) setSnowballSort(parsed.snowballSort);
          if (parsed.snowballExtra != null) setSnowballExtra(parsed.snowballExtra);
          if (parsed.debtSnowballSort) setDebtSnowballSort(parsed.debtSnowballSort);
          if (parsed.debtSnowballExtra != null) setDebtSnowballExtra(parsed.debtSnowballExtra);
          if (parsed.theme) {
            // v19: migrate old theme keys to new
            const themeMigration = { 'grey': 'slate', 'blue': 'sapphire', 'pink': 'rose', 'dark': 'midnight', 'white': 'white' };
            setTheme(themeMigration[parsed.theme] || parsed.theme);
          }
        }
        return !!(saved && saved.value);
      } catch (e) { return false; }
  };

  // 2026-06-11 — signed-in hydration on public hosts ("fake data mixed with
  // ours" / "can't tell I'm logged in" fix): once authenticated on
  // poetech.us, this device's saved data loads for its owner; a fresh device
  // starts from the aspirational SEED instead of the Reeves demo. Anonymous
  // visitors still never hydrate (the 2026-06-03 leak gate stands).
  useEffect(() => {
    if (!authSession || hydratedForAuthRef.current) return;
    if ((!isPublicHost() && !reviewerMode) || isAnyDemoMode) return;
    hydratedForAuthRef.current = true;
    // A reviewer signs in as a fresh user: EMPTY_WORLD, never this device's
    // saved blob and never the family SEED — the exact non-family path below.
    if (reviewerMode) { setData(EMPTY_WORLD); setAuthHydrated(true); return; }
    const email = (authSession.user?.email || '').toLowerCase();
    loadSavedSnapshot(authSession.user?.id || null).then((found) => {
      // 2026-06-14: a fresh family member starts from their aspirational SEED;
      // a fresh NON-family user starts from their OWN empty books — NEVER
      // SEED_DATA (the Poe-family shape) on the public host (see EMPTY_WORLD
      // and the isPublicHost() seed gate).
      if (!found) setData(isFamilyEmail(email) ? SEED_DATA : EMPTY_WORLD);
      setAuthHydrated(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authSession]);

  // 2026-06-11 (P14 pattern, third instance of the same gate disease): the
  // boot-time profile read returns null on public hosts (correct for
  // anonymous visitors), which made the picker re-appear on every reload for
  // the SIGNED-IN family and kept currentProfile-gated surfaces (Imported)
  // hidden. Once the owner's hydration completes, load this device's saved
  // profile. Demo states keep their forced profile.
  useEffect(() => {
    if (!authSession || !authHydrated || currentProfile || isAnyDemoMode) return;
    // A reviewer gets the self-serve profile a signed-in outside user gets —
    // state only, never reading or writing this device's saved profile.
    if (reviewerMode) { setCurrentProfile('self'); return; }
    try {
      const saved = localStorage.getItem('poe-current-profile');
      if (saved) { setCurrentProfile(saved); return; }
    } catch (e) { /* localStorage unavailable — fall through to email map */ }
    // 2026-06-12 — identity follows the ACCOUNT, not the device: a signed-in
    // owner on a brand-new device shouldn't face the picker (or be greeted
    // as the sanitized persona). Known family emails (FAMILY_EMAIL_PROFILES,
    // module-level) map straight to their profile; unknown emails still get
    // the picker, and now also a self-serve welcome.
    const email = (authSession.user?.email || '').toLowerCase();
    const mapped = FAMILY_EMAIL_PROFILES[email];
    if (mapped) {
      setProfile(mapped);
      // 2026-06-13 — a signed-in family member is never tier-gated out of their
      // OWN family's data. Christina hit the Real Estate read-only preview and
      // read its upgrade banner as "you need a subscription." Recognized family
      // emails get full access (top tier) so every module is fully theirs.
      // Guarded so we don't churn data if they're already at the top.
      setData(d => (effectiveTier(d.userTier) === 'business'
        ? d
        : { ...d, userTier: 'business' }));
    } else {
      // 2026-06-14 — a SIGNED-IN, NON-family user (e.g. a parishioner) already
      // has their OWN account + instance. The Poe-family device picker
      // (Darrell / Christina / Family) is meaningless to them and was the only
      // option on screen — a full-screen lockout. Give them a self-serve
      // profile so the app renders their own data instead of trapping them.
      // 'self' is deliberately NOT in PROFILES (no extra picker button) and is
      // explicitly excluded from the wf18 family-PII gate above.
      setProfile('self');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authSession, authHydrated]);

  // 2026-06-13 — a signed-in FAMILY member is NEVER tier-gated out of their own
  // data, on its OWN effect. The grant used to live inside the profile-load
  // effect above, which early-returns once a profile is set (currentProfile
  // truthy) — so on reload the family-tier grant was skipped and the owner
  // stayed gated (Darrell: "How can I be logged in and still getting the
  // choose/unlock pages?"). This runs on every sign-in regardless of profile:
  // a recognized family email gets the top tier so every module is fully theirs.
  // The dev tier-switcher can still preview lower tiers within a session; a
  // reload restores full access. Idempotent (no churn when already at the top).
  useEffect(() => {
    if (!authSession || isAnyDemoMode || reviewerMode) return; // a reviewer stays at the user's real tier
    const email = (authSession.user?.email || '').toLowerCase();
    if (FAMILY_EMAIL_PROFILES[email]) {
      setData(d => (effectiveTier(d.userTier) === 'business' ? d : { ...d, userTier: 'business' }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authSession]);

  // ---------------------------------------------------------------------------
  // Multi-point auth — load the second-factor signals (P2 device trust, P3
  // has-PIN) on a real sign-in. Keyed on the STABLE user id (syncIdentityKey)
  // so the hourly TOKEN_REFRESHED churn doesn't re-fire it. Reads sessionStorage
  // for a same-session "PIN already cleared" flag so a reload inside the session
  // doesn't re-prompt. On sign-out, everything resets.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!authSession) {
      setMpSignalsLoaded(false); setMpDeviceTrusted(false); setMpHasPin(false);
      setMpBackendAvailable(true); setMpPinVerified(false);
      setMpHasBiometric(false); setMpBioSupported(false); setMpBiometricVerified(false);
      setBioOfferOpen(false);
      setMpPersonasWithPin([]); setMpInstanceId(null); setPendingPersona(null);
      return;
    }
    if (isAnyDemoMode) { setMpSignalsLoaded(true); return; }
    let cancelled = false;
    const uid = authSession.user?.id;
    try {
      if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(mpPinOkKey(uid))) {
        setMpPinVerified(true);
      }
      if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(mpBioOkKey(uid))) {
        setMpBiometricVerified(true);
      }
    } catch (_) { /* sessionStorage unavailable */ }
    // Biometric is device-local: enrollment is a localStorage credential record,
    // and "supported" asks the platform if a fingerprint/Face authenticator
    // exists. Both are best-effort and never block the gate.
    setMpHasBiometric(isBiometricEnrolled(uid));
    (async () => {
      const [h, d, bioOk] = await Promise.all([
        hasUserPin(), isDeviceTrusted(uid), isPlatformAuthenticatorAvailable(),
      ]);
      if (cancelled) return;
      setMpHasPin(h.hasPin);
      setMpDeviceTrusted(d.trusted);
      setMpBackendAvailable(h.backendAvailable && d.backendAvailable);
      setMpBioSupported(!!bioOk);
      setMpSignalsLoaded(true);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncIdentityKey(authSession)]);

  // Load the family persona-PIN list for the shared-device picker gate. Only
  // family members have the multi-persona picker; a self-serve user never does.
  useEffect(() => {
    if (!authSession || isAnyDemoMode) return;
    if (reviewerMode || !isFamilyEmail(authSession.user?.email)) { setMpPersonasWithPin([]); setMpInstanceId(null); return; }
    let cancelled = false;
    (async () => {
      let instId = null;
      try { instId = await getInstanceId(); } catch (_) { /* offline / no instance */ }
      if (cancelled || !instId) return;
      setMpInstanceId(instId);
      const { personas } = await listPersonaPins(instId);
      if (!cancelled) setMpPersonasWithPin(Array.isArray(personas) ? personas : []);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncIdentityKey(authSession)]);

  useEffect(() => {
    if (!loaded) return;
    if (isAnyDemoMode || reviewerMode) return; // Demo + picker + reviewer never write to localStorage (or push snapshots).
    // SECURITY (2026-06-03): the public domain never persists for ANONYMOUS
    // visitors. 2026-06-11: a signed-in owner persists on their own device —
    // but only AFTER their hydration completes, so a demo snapshot can never
    // overwrite their real saved data in the sign-in race window.
    if (isPublicHost() && !(authSession && authHydrated)) return;
    (async () => {
      try {
        // owner stamp (2026-06-12): binds this snapshot to the signed-in
        // account so a different account on a shared device can't hydrate it.
        // savedAt: lets the cloud-snapshot pull decide freshness (v2.15).
        await window.storage.set('poe-financial-v28', JSON.stringify({ owner: authSession?.user?.id || undefined, savedAt: new Date().toISOString(), data, pressure, snowballSort, snowballExtra, debtSnowballSort, debtSnowballExtra, theme }));
        setPersistIssue(prev => (prev && prev.kind === 'storage' ? null : prev));
        // v2.15 family snapshot push — the non-table-synced remainder follows
        // the account. Leading-edge throttle (15s). Two hard guards: the pull
        // must have completed (snapshotPulledRef), and a world whose remainder
        // is STILL SEED never publishes — scaffolding must never become the
        // family snapshot, no matter which device signs in first.
        if (authSession && !isAnyDemoMode && snapshotPulledRef.current
            && (!isPublicHost() || authHydrated)
            && !remainderIsSeed(data)
            && Date.now() - lastSnapshotPushRef.current > 15000) {
          lastSnapshotPushRef.current = Date.now();
          const pushedAt = new Date().toISOString();
          pushSnapshot(buildSnapshotPayload({ data, pressure, snowballSort, snowballExtra, debtSnowballSort, debtSnowballExtra, theme }))
            .then((res) => {
              if (res && res.pushed) {
                try { localStorage.setItem('poe-snapshot-marker', pushedAt); } catch (_) { /* non-fatal */ }
              }
            })
            .catch((e) => syncWarn('[snapshot-sync] push failed', e));
        }
      } catch (e) {
        console.error('Storage failed', e);
        // QuotaExceededError here means NOTHING is being saved anymore —
        // photos are usually the weight. Say so instead of losing a week
        // of entries silently (review finding, 2026-06-12).
        setPersistIssue({
          kind: 'storage',
          message: 'This device’s storage is full — changes are NOT being saved. Export or remove a few photos (Big Picture → photos), then make any small edit to retry.',
        });
      }
    })();
  }, [data, pressure, snowballSort, snowballExtra, debtSnowballSort, debtSnowballExtra, theme, loaded, isAnyDemoMode, reviewerMode, authSession, authHydrated]);

  // Layer 2 — auth + feedback sync wiring.
  // On every auth state change: tear down any prior subscriptions, then
  // if newly signed in, ensure tenant membership (calls our SECURITY
  // DEFINER join_default_tenant() RPC, idempotent), do initial-sync for
  // tables that don't need the verify-balances gate (entities only for
  // now — see memory/project_full-data-sync-next-priority), and subscribe
  // to inbound changes from other devices.
  //
  // Signed-out state clears the remote slice so users don't see stale
  // cross-device data.
  useEffect(() => {
    let unsubscribeFeedback = null;
    let unsubscribeEntities = null;
    const cleanupAuth = onAuthChange(async (session) => {
      if (unsubscribeFeedback) { unsubscribeFeedback(); unsubscribeFeedback = null; }
      if (unsubscribeEntities) { unsubscribeEntities(); unsubscribeEntities = null; }
      if (!session) {
        setRemoteFeedback([]);
        return;
      }
      try {
        await ensureTenantMembership();
      } catch (e) {
        syncWarn('[auth] tenant join failed', e);
        return;
      }
      // Access-governance heartbeat: this session reports the build it runs +
      // a last-seen stamp (build-freshness + activity for the steward's Access
      // surface). Privacy: build + heartbeat only — no behavior, no content.
      // Fire-and-forget; never blocks sign-in, never surfaces an error.
      reportPresence();
      unsubscribeFeedback = subscribeFeedback((items) => setRemoteFeedback(items));

      // Entities sync (no verify-gate needed — no load-bearing numbers).
      // Initial sync uploads any local entities not yet in Supabase, then
      // pulls the merged set. Realtime subscription keeps subsequent edits
      // from other devices flowing in.
      // 2026-06-11 — notDemoRow on BOTH directions (this block was missed in
      // the numeric-table sweep): the public-host mount puts the Reeves demo
      // in state before auth resolves, so the unfiltered upload pushed demo
      // entities into the family's cloud instance, and the unfiltered pull
      // rendered them back (Maya / Jordan / Avery / Reeves on a signed-in
      // device). Demo mode skips entities sync entirely — a working sample
      // must neither upload its props nor pull the family's real names.
      if (!isAnyDemoMode) {
        try {
          // notSeedRow (2026-06-12): seed entities ("Personal (Adam + Naomi)")
          // must never upload next to the family's real entities; once real
          // cloud entities exist, local seed entities drop from display.
          const localEntities = ((typeof window !== 'undefined' && window.__POETECH_LATEST_DATA__)
            ? (window.__POETECH_LATEST_DATA__.entities || [])
            : []).filter(notDemoRow).filter(notSeedRow);
          const result = await entitiesSync.initialSync(localEntities);
          if (result && result.merged) {
            setData(d => {
              // 2026-06-12 second pass: the polluted rows ALSO live in this
              // device's saved state, and the union re-added them from the
              // local side (non-UUID ids look like rows awaiting upload).
              // Filter BOTH sides; dedupe AFTER the union so a local copy
              // and its cloud twin collapse.
              const incoming = result.merged.filter(notDemoEntityRow);
              let current = (d.entities || []).filter(notDemoEntityRow);
              if (incoming.length) current = current.filter(notSeedRow);
              return { ...d, entities: dedupeEntitiesByName(unionPreservingLocal(current, incoming)) };
            });
          }
        } catch (e) {
          syncWarn('[auth] entities initial sync failed', e);
        }
        unsubscribeEntities = entitiesSync.subscribe((items) => {
          setData(d => {
            const incoming = items.filter(notDemoEntityRow);
            let current = (d.entities || []).filter(notDemoEntityRow);
            if (incoming.length) current = current.filter(notSeedRow);
            return { ...d, entities: dedupeEntitiesByName(unionPreservingLocal(current, incoming)) };
          });
        });
      }
    });
    return () => {
      cleanupAuth();
      if (unsubscribeFeedback) unsubscribeFeedback();
      if (unsubscribeEntities) unsubscribeEntities();
    };
    // isAnyDemoMode is URL-derived and constant for the page load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------------------------------------------------------
  // Numeric-table sync (accounts / debts / transactions / projects)
  // ---------------------------------------------------------------------------
  // Gated behind data.numericSyncVerifiedAt — set by VerifyBalances after the
  // user walks through their seed and confirms the starting numbers. Once
  // set, this effect runs initialSync (pushes any local rows not in Supabase
  // yet, returns merged list) and subscribes to realtime changes from other
  // devices. Per-CRUD uploads are wired into addAccount/updateAccount/etc.
  // below so individual edits propagate without waiting for re-sign-in.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let unsub = onAuthChange((session) => { setAuthSession(session); setAuthChecked(true); });
    return unsub;
  }, []);

  useEffect(() => {
    if (!authSession) {
      setShowVerifyBalances(false);
      return;
    }
    // 2026-06-11 — a working sample never asks you to verify: the wizard over
    // a ?demo= view listed sample entities as if they were the family's own.
    if (isAnyDemoMode) {
      setShowVerifyBalances(false);
      return;
    }
    if (!data.numericSyncVerifiedAt) {
      // A signed-in user whose numeric data is ENTIRELY seed scaffolding has
      // nothing real to verify — never show them a wizard full of sample
      // accounts/rentals (e.g. "240 Cedar Ln"). Open sync straight away and
      // strip the seed, leaving a clean slate: their real cloud rows (which
      // carry remoteUuid and are preserved) + empty tables to fill. A user who
      // HAS real numeric data still gets the verify walkthrough.
      // (Darrell 2026-06-13: "Not my rentals don't have 240 Cedar Ln.")
      const hasRealNumeric = []
        .concat(data.accounts || [], data.debts || [], data.transactions || [], data.projects || [], (data.inflows?.rentals || []))
        .some(isRealRow);
      if (!hasRealNumeric) {
        setShowVerifyBalances(false);
        setData(d => stripSeedScaffolding({ ...d, numericSyncVerifiedAt: new Date().toISOString() }));
        return;
      }
      setShowVerifyBalances(true);
      return;
    }
    setShowVerifyBalances(false);

    const cleanups = [];
    let cancelled = false;

    async function start() {
      const latest = (typeof window !== 'undefined' && window.__POETECH_LATEST_DATA__) || data;
      // 2026-06-11 — notDemoRow on every local list (demo rows must NEVER
      // upload into the family's cloud instance, e.g. signing in on a public
      // host while demo data is on screen) and on every cloud-loaded list
      // (any demo rows that historically slipped in stay invisible).
      // notDemoRow: demo rows never upload. notSeedRow (2026-06-12): seed
      // scaffolding never uploads either — see SEED_IDS above.
      const tables = [
        { sync: accountsSync,     key: 'accounts',     localList: (latest.accounts || []).filter(notDemoRow).filter(notSeedRow) },
        { sync: debtsSync,        key: 'debts',        localList: (latest.debts || []).filter(notDemoRow).filter(notSeedRow) },
        { sync: transactionsSync, key: 'transactions', localList: (latest.transactions || []).filter(notDemoRow).filter(notSeedRow), merge: mergeTransactionsPreferCloud },
        { sync: projectsSync,     key: 'projects',     localList: (latest.projects || []).filter(notDemoRow).filter(notSeedRow), merge: mergeRemoteProjects },
        // Discussions (0035) — the discuss-then-document records that drive
        // projects, pooled to the family instance the same proven way.
        { sync: discussionsSync,  key: 'discussions',  localList: (latest.discussions || []).filter(notDemoRow).filter(notSeedRow), merge: mergeRemoteDiscussions },
        // Concerns (0039) — the Concerns & Solutions board's curated rows, pooled
        // to the family instance the same proven way. (Seed-baseline + feedback
        // read-through are composed in the component, never persisted here.)
        { sync: concernsSync,     key: 'concerns',     localList: (latest.concerns || []).filter(notDemoRow).filter(notSeedRow), merge: mergeRemoteConcerns },
        // Creation Workspaces (0037) — composed documents/images, pooled to the
        // family instance the same proven way so a document opens on any device.
        { sync: workspacesSync,   key: 'workspaces',   localList: (latest.workspaces || []).filter(notDemoRow).filter(notSeedRow), merge: mergeRemoteWorkspaces },
        // Recipes (0052) — Chef's Corner recipes the family adds (the canonical
        // three ship as content; this carries everything added afterward), pooled
        // to the family instance the same proven way so a recipe opens on any device.
        { sync: recipesSync,      key: 'recipes',      localList: (latest.recipes || []).filter(notDemoRow).filter(notSeedRow), merge: mergeRemoteRecipes },
        { sync: inquiriesSync,    key: 'inquiries',    localList: (latest.inquiries || []).filter(notDemoRow).filter(notSeedRow) },
        // Practice leads (0045) — the client-acquisition (revenue agent team) CRM,
        // pooled to the family instance the same proven way.
        { sync: practiceLeadsSync, key: 'practiceLeads', localList: (latest.practiceLeads || []).filter(notDemoRow).filter(notSeedRow), merge: mergeRemoteLeads },
        // v2.13 — the QC record (work orders + dispatch + lifecycle trail)
        // and the shared 1099 worker roster pool to the family instance.
        { sync: incidentsSync,    key: 'incidents',       localList: (latest.incidents || []).filter(notDemoRow).filter(notSeedRow) },
        { sync: contractorsSync,  key: 'contractors1099', localList: (latest.contractors1099 || []).filter(notDemoRow).filter(notSeedRow) },
        // Systems of record (0052) — the inventory catalog + the two APPEND-ONLY
        // ledgers (stock movements, generic record-history events) pool to the
        // family instance the same proven way. The tables loop only ever calls
        // initialSync + subscribe, so the append-only contract is preserved (no
        // updateRow/deleteRow path runs for movements / record_events here).
        { sync: inventoryItemsSync,     key: 'inventoryItems',     localList: (latest.inventoryItems || []).filter(notDemoRow).filter(notSeedRow),     merge: mergeRemoteInventoryItems },
        { sync: inventoryMovementsSync, key: 'inventoryMovements', localList: (latest.inventoryMovements || []).filter(notDemoRow).filter(notSeedRow), merge: mergeRemoteMovements },
        { sync: recordEventsSync,       key: 'recordEvents',       localList: (latest.recordEvents || []).filter(notDemoRow).filter(notSeedRow),       merge: mergeRemoteRecordEvents },
        // Kitchen inventory counts (0053) — the count-session header + its lines
        // (the chef vertical on the 0052 base). Closing a count posts adjust
        // MOVEMENTS into inventoryMovements above, so these two are just working
        // session state synced the same proven way.
        { sync: kitchenCountsSync,     key: 'inventoryCounts',     localList: (latest.inventoryCounts || []).filter(notDemoRow).filter(notSeedRow),     merge: mergeRemoteCounts },
        { sync: kitchenCountLinesSync, key: 'inventoryCountLines', localList: (latest.inventoryCountLines || []).filter(notDemoRow).filter(notSeedRow), merge: mergeRemoteCountLines },
        // Purchasing (0054) — par-based reorder drafts the chef approves. The
        // header + line snapshots pool to the family instance the same proven way.
        { sync: purchaseOrdersSync,     key: 'purchaseOrders',     localList: (latest.purchaseOrders || []).filter(notDemoRow).filter(notSeedRow),     merge: mergeRemotePurchaseOrders },
        { sync: purchaseOrderLinesSync, key: 'purchaseOrderLines', localList: (latest.purchaseOrderLines || []).filter(notDemoRow).filter(notSeedRow), merge: mergeRemotePurchaseOrderLines },
        // Live-data rails (0077) — the audited device-local lists on the
        // jsonb-doc rail (lib/doc-sync.js); fail-soft until 0077 is applied.
        { sync: gameSavesSync,      key: 'gameSaves',      localList: (latest.gameSaves || []).filter(notDemoRow).filter(notSeedRow) },
        { sync: subscriptionsSync,  key: 'subscriptions',  localList: (latest.subscriptions || []).filter(notDemoRow).filter(notSeedRow) },
        { sync: skillProfilesSync,  key: 'skillProfiles',  localList: (latest.skillProfiles || []).filter(notDemoRow).filter(notSeedRow) },
        { sync: prayerRequestsSync, key: 'prayerRequests', localList: (latest.prayerRequests || []).filter(notDemoRow).filter(notSeedRow) },
        { sync: churchVoiceSync,    key: 'churchVoice',    localList: (latest.churchVoice || []).filter(notDemoRow).filter(notSeedRow) },
      ];
      for (const t of tables) {
        if (cancelled) return;
        try {
          const result = await t.sync.initialSync(t.localList);
          if (!cancelled && result && result.merged) {
            // 2026-06-12 data-loss fix: union, never wholesale-replace — a
            // locally-created row whose upload failed (or hasn't landed)
            // must survive the cloud list arriving. See unionPreservingLocal.
            // Seed purge: once the cloud holds real rows for this table, the
            // local seed scaffolding is dropped — truth replaces the picture.
            setData(d => {
              // 2026-06-24 RESURRECTION FIX — strip seed UNCONDITIONALLY. The old
              // `if (incoming.length)` guard left SEED_DATA scaffolding (dev-ticket
              // projects, sample incidents) in place whenever the cloud table was
              // empty — and since `data` re-inits to SEED_DATA on every boot, those
              // rows reappeared after the user deleted them. By the time this merge
              // runs the user is signed-in + verified, so seed must never show.
              // notSeedRow on `incoming` too: any legacy seed row that reached the
              // cloud (pre-2026-06-12, before localList filtering) stays hidden.
              const incoming = result.merged.filter(notDemoRow).filter(notSeedRow);
              const current = (d[t.key] || []).filter(notDemoRow).filter(notSeedRow);
              const mergeFn = t.merge || unionPreservingLocal;
              return { ...d, [t.key]: mergeFn(current, incoming) };
            });
            if (result.uploadFailures) {
              setPersistIssue({
                kind: 'sync',
                message: `${result.uploadFailures} ${t.key} item(s) could not reach the cloud — they are safe on this device and will retry on next sign-in.`,
              });
            }
          }
        } catch (e) {
          console.warn(`[${t.sync.remoteTable}-sync] initial sync failed`, e);
        }
        if (cancelled) return;
        const unsubscribe = t.sync.subscribe((items) => {
          setData(d => {
            // 2026-06-24 RESURRECTION FIX — strip seed unconditionally (see the
            // initialSync merge above for the full rationale). Without this, a
            // realtime refetch could re-surface seed scaffolding the user removed.
            const incoming = items.filter(notDemoRow).filter(notSeedRow);
            const current = (d[t.key] || []).filter(notDemoRow).filter(notSeedRow);
            const mergeFn = t.merge || unionPreservingLocal;
            return { ...d, [t.key]: mergeFn(current, incoming) };
          });
        });
        cleanups.push(unsubscribe);
      }

      // Rentals live nested under inflows.rentals and carry device-local
      // detail the v2.2 rentals table doesn't model (mortgage rate/P&I/escrow,
      // rooms, equipment, logs, rent/actual) — merge remote columns into the
      // local shape instead of replacing the list wholesale like the flat
      // tables above. See rentals-sync.js for the merge rules.
      if (cancelled) return;
      try {
        const result = await rentalsSync.initialSync((latest.inflows?.rentals || []).filter(notDemoRow).filter(notSeedRow));
        if (!cancelled && result && result.merged) {
          setData(d => {
            const incoming = result.merged.filter(notDemoRow);
            const current = (d.inflows?.rentals || []).filter(notDemoRow);
            return { ...d, inflows: { ...d.inflows, rentals: mergeRemoteRentals(incoming.length ? current.filter(notSeedRow) : current, incoming) } };
          });
        }
      } catch (e) {
        syncWarn('[rentals-sync] initial sync failed', e);
      }
      if (cancelled) return;
      cleanups.push(rentalsSync.subscribe((items) => {
        setData(d => {
          const incoming = items.filter(notDemoRow);
          const current = (d.inflows?.rentals || []).filter(notDemoRow);
          return { ...d, inflows: { ...d.inflows, rentals: mergeRemoteRentals(incoming.length ? current.filter(notSeedRow) : current, incoming) } };
        });
      }));

      // Live-data rails (0077) — watchlist (string set) + module interest
      // (keyed votes) don't fit the tables loop; lib/live-rails.js wires them.
      if (cancelled) return;
      const railCleanups = await wireLiveRails({ localWatchlist: latest.watchlist || [], localVotes: latest.moduleInterest || {}, setData, setFamilyModuleInterest, warn: syncWarn });
      if (cancelled) railCleanups.forEach(fn => { try { fn(); } catch (_) { /* already down */ } });
      else cleanups.push(...railCleanups);
    }
    start();

    return () => {
      cancelled = true;
      cleanups.forEach(fn => { try { fn && fn(); } catch (_) {} });
    };
    // `data` is read via the window stash (see below); isAnyDemoMode is
    // URL-derived and constant for the page load.
    // A3 (2026-06-13 review): key on the STABLE user id, not the authSession
    // object — TOKEN_REFRESHED (~hourly) hands back a fresh object with the same
    // user, and depending on the object re-ran a full initialSync + re-subscribe
    // storm every hour per device. syncIdentityKey collapses that to real
    // sign-in / sign-out / account-switch transitions.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncIdentityKey(authSession), data.numericSyncVerifiedAt]);

  // Stash the latest data on window so the auth effect (which has [] deps
  // and therefore captures only the initial closure) can read the current
  // local entities at sign-in time. Avoids putting `data` in deps which
  // would re-run the auth wiring on every change.
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__POETECH_LATEST_DATA__ = data;
    }
  }, [data]);

  // v7: Reminder checking loop — fires browser notifications for upcoming events
  useEffect(() => {
    if (notifPermission !== 'granted') return;
    const checkReminders = () => {
      const now = new Date();
      (data.events || []).filter(e => !e.completedAt).forEach(event => {
        const eDate = eventDateTime(event);
        (event.reminders || []).forEach(reminderKey => {
          const opt = REMINDER_OPTIONS.find(o => o.key === reminderKey);
          if (!opt) return;
          const reminderTime = new Date(eDate.getTime() - opt.offsetMinutes * 60000);
          const firedKey = `${event.id}-${reminderKey}`;
          // Fire if reminder time has passed but event hasn't, and we haven't fired this one
          if (now >= reminderTime && now <= eDate && !firedRemindersRef.current.has(firedKey)) {
            firedRemindersRef.current.add(firedKey);
            try {
              new Notification(`PoeTech reminder: ${event.title}`, {
                body: opt.label === 'At event time' ? `Happening now · ${event.description || event.category}` : `${opt.label} · ${event.description || event.category}`,
                tag: firedKey,
              });
            } catch (e) { console.warn('Notification failed', e); }
          }
        });
      });
    };
    checkReminders(); // run once on mount
    const interval = setInterval(checkReminders, 30000); // every 30s
    return () => clearInterval(interval);
  }, [notifPermission, data.events]);

  const requestNotificationPermission = async () => {
    if (typeof Notification === 'undefined') return;
    const result = await Notification.requestPermission();
    setNotifPermission(result);
  };

  // Data callbacks
  const addRecurring = (item) => setData(d => ({ ...d, recurringObligations: [...d.recurringObligations, { ...item, id: `ro-${Date.now()}`, enabled: true }] }));
  // Round 10 — addIncident now fills in ITSM defaults if caller omits them.
  // status defaults to 'open', urgency to 'incident', dueDate computed from urgency.
  // Incidents — every creation seeds a lifecycle log; every status change appends.
  // Returns the new incident id so callers (e.g. the maintenance-log work-order
  // button) can link their source record to it.
  const addIncident = (item) => {
    const id = `in-${Date.now()}`;
    const nowIso = new Date().toISOString();
    const initialStatus = item.status || 'open';
    const seeded = {
      urgency: 'incident',
      status: initialStatus,
      dueDate: dueDateFor(item.urgency || 'incident'),
      ...item,
      id,
      // date is rendered with .slice() in Calendar and the queue lists —
      // guarantee it like the other ITSM defaults (callers may omit it).
      date: item.date || nowIso.slice(0, 10),
      createdAt: item.createdAt || nowIso,
      lifecycle: {
        phase: initialStatus,
        openedAt: item.createdAt || nowIso,
        closedAt: LIFECYCLE_TERMINAL_PHASES.has(initialStatus) ? nowIso : null,
        log: [{ at: nowIso, fromPhase: null, toPhase: initialStatus, by: 'user', note: item._note || 'created' }],
      },
    };
    setData(d => ({ ...d, incidents: [...d.incidents, seeded] }));
    if (authSession && data.numericSyncVerifiedAt && !isAnyDemoMode) {
      // Stamp remoteUuid as soon as the insert lands so follow-on updates
      // (dispatch, resolve) reach the cloud row immediately.
      incidentsSync.upload(seeded).then((res) => {
        if (res && res.remoteId) {
          setData(d => ({ ...d, incidents: (d.incidents || []).map(i => i.id === id ? { ...i, remoteUuid: res.remoteId } : i) }));
        }
      }).catch(e => syncWarn('[incidents-sync] upload failed', e));
    }
    return id;
  };
  // Shared transition logic so the reducer and the cloud push compute the
  // identical next state (lifecycle log entries included).
  const applyIncidentUpdates = (incident, updates) => {
    const withLifecycle = ensureLifecycle(incident);
    // Multi-worker assignment ops — write the crew to incident.dispatch
    // (jsonb { assignments: [...] }) and log the QC trail. One reader
    // (getAssignments) means legacy single-worker rows self-heal on first edit.
    if (updates._assign) {
      const op = updates._assign;
      let list = getAssignments(withLifecycle);
      let note = '';
      if (op.kind === 'add') {
        const before = list.length;
        list = addAssignment(withLifecycle, op.contractor, { type: op.type });
        note = list.length > before ? `assigned to ${op.contractor?.name || 'worker'}` : `${op.contractor?.name || 'worker'} already on this work order`;
      } else if (op.kind === 'remove') {
        const a = list.find(x => x.id === op.assignmentId);
        list = removeAssignment(list, op.assignmentId);
        note = a ? `unassigned ${a.name}` : 'unassigned worker';
      } else if (op.kind === 'done') {
        const a = list.find(x => x.id === op.assignmentId);
        list = markAssignmentDone(list, op.assignmentId);
        note = a ? `${a.name} marked done` : 'worker marked done';
      } else if (op.kind === 'reopen') {
        const a = list.find(x => x.id === op.assignmentId);
        list = reopenAssignment(list, op.assignmentId);
        note = a ? `${a.name} reopened` : 'worker reopened';
      } else if (op.kind === 'payout') {
        list = setAssignmentPayout(list, op.assignmentId, op.payout);
        // Payout edits are frequent and finance-internal — no lifecycle log noise.
        note = '';
      }
      const nextLog = note
        ? [...(withLifecycle.lifecycle?.log || []), { at: new Date().toISOString(), fromPhase: withLifecycle.lifecycle?.phase || withLifecycle.status, toPhase: withLifecycle.lifecycle?.phase || withLifecycle.status, by: 'user', note }]
        : (withLifecycle.lifecycle?.log || []);
      return {
        ...withLifecycle,
        dispatch: dispatchState(list),
        lifecycle: { ...withLifecycle.lifecycle, log: nextLog },
      };
    }
    const merged = { ...withLifecycle, ...updates };
    // If status changed, route through appendLifecycleLog to write a log entry.
    if (updates.status && updates.status !== withLifecycle.status) {
      return appendLifecycleLog(merged, updates.status, updates._by || 'user', updates._note || '');
    }
    // Same-status audit note (e.g. "dispatched to X") — append a log entry
    // without a phase change, so the quality-control trail stays complete.
    if (updates._logNote) {
      const nowIso = new Date().toISOString();
      const phase = merged.lifecycle?.phase || merged.status;
      return {
        ...merged,
        lifecycle: {
          ...merged.lifecycle,
          log: [...(merged.lifecycle?.log || []), { at: nowIso, fromPhase: phase, toPhase: phase, by: updates._by || 'user', note: updates._logNote }],
        },
      };
    }
    return merged;
  };
  const updateIncident = (id, updates) => {
    // 2026-06-12 fix: the cloud push used to be computed from the CLOSURE's
    // data — two rapid updates (dispatch → resolve, or two log notes) pushed
    // a patch built on pre-first-update state, dropping the earlier lifecycle
    // log entry from the QC trail. Compute inside the updater so the push
    // always carries the post-update item. updateRow is a full-row PUT
    // (idempotent), so StrictMode's dev-only double-invoke is harmless.
    setData(d => {
      const next = (d.incidents || []).map(i => i.id !== id ? i : applyIncidentUpdates(i, updates));
      if (authSession && d.numericSyncVerifiedAt && !isAnyDemoMode) {
        const updated = next.find(i => i.id === id);
        if (updated && updated.remoteUuid) {
          incidentsSync.updateRow(updated.remoteUuid, incidentColumns(updated)).catch(e => syncWarn('[incidents-sync] update failed', e));
        }
      }
      return { ...d, incidents: next };
    });
  };
  const resolveIncident = (id) => updateIncident(id, { status: 'resolved', resolvedAt: new Date().toISOString().slice(0, 10), _note: 'Marked resolved' });
  // Dispatch — assign 1099 workers to an open incident (work order). A work
  // order carries a CREW: the assignment list lands on incident.dispatch
  // ({ assignments: [...] }) and every op writes a lifecycle log entry, so
  // who-was-sent / who-finished is part of the permanent QC record. Bundled
  // as workerOps so both surfaces (Action Queue + per-property Maintenance
  // Log) wire the same handlers.
  const assignWorker = (id, contractor, type) => updateIncident(id, { _assign: { kind: 'add', contractor, type } });
  const unassignWorker = (id, assignmentId) => updateIncident(id, { _assign: { kind: 'remove', assignmentId } });
  const markWorkerDone = (id, assignmentId) => updateIncident(id, { _assign: { kind: 'done', assignmentId } });
  const reopenWorker = (id, assignmentId) => updateIncident(id, { _assign: { kind: 'reopen', assignmentId } });
  const setWorkerPayout = (id, assignmentId, payout) => updateIncident(id, { _assign: { kind: 'payout', assignmentId, payout } });
  const workerOps = {
    onAssign: assignWorker,
    onUnassign: unassignWorker,
    onWorkerDone: markWorkerDone,
    onReopen: reopenWorker,
    onSetPayout: setWorkerPayout,
  };
  const addEvent = (item) => setData(d => ({ ...d, events: [...(d.events || []), { ...item, id: `ev-${Date.now()}`, createdAt: new Date().toISOString(), completedAt: null }] }));
  const completeEvent = (id) => setData(d => ({ ...d, events: (d.events || []).map(e => e.id === id ? { ...e, completedAt: new Date().toISOString() } : e) }));
  // Projects — same lifecycle pattern.
  const addProject = (item) => {
    const nowIso = new Date().toISOString();
    const initialStatus = item.status || 'planning';
    // Unique even within the same millisecond: a batch add (e.g. "Load 6
    // example projects" calls addProject in a synchronous forEach) otherwise
    // mints the SAME `pr-<Date.now()>` for every project, which collides React
    // keys AND makes edit/delete-by-id hit every twin at once. Same random-suffix
    // pattern the rest of the app uses for batch-created ids.
    const localId = `pr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const seeded = {
      ...item,
      // Mirror toRow's `item.title ?? ''` default so a project never carries a
      // null/undefined title into render (ProjectInventory's filter row calls
      // `.slice` on it). Keeps an explicit title; only fills the empty case.
      title: item.title ?? '',
      id: localId,
      createdAt: item.createdAt || nowIso,
      // Attribute the project to the signed-in user so it is "Mine" immediately
      // and the Mine/Everyone split reflects real ownership (isMine reads
      // createdBy). Null when signed out so demo/anonymous adds stay unattributed.
      createdBy: authSession?.user?.id || null,
      status: initialStatus,
      lifecycle: {
        phase: initialStatus,
        openedAt: item.createdAt || nowIso,
        closedAt: LIFECYCLE_TERMINAL_PHASES.has(initialStatus) ? nowIso : null,
        log: [{ at: nowIso, fromPhase: null, toPhase: initialStatus, by: 'user', note: item._note || 'created' }],
      },
    };
    setData(d => ({ ...d, projects: [...(d.projects || []), seeded] }));
    // Close the loop: push the new project to the cloud right away (not only when
    // it is later edited), so it flows to the family's other devices AND we
    // capture its remoteUuid — without which later edits/deletes never sync.
    // Fails soft: a failed upload leaves the local copy intact to retry on the
    // next full sync.
    if (authSession && data.numericSyncVerifiedAt && !isAnyDemoMode) {
      projectsSync.upload(seeded)
        .then(res => {
          if (res && res.uploaded && res.remoteId) {
            setData(d => ({ ...d, projects: (d.projects || []).map(p => (p.id === localId ? { ...p, remoteUuid: res.remoteId } : p)) }));
          }
        })
        .catch(e => syncWarn('[projects-sync] add upload failed', e));
    }
  };
  const updateProject = (id, updates) => setData(d => {
    const next = (d.projects || []).map(p => {
      if (p.id !== id) return p;
      const withLifecycle = ensureLifecycle(p);
      const merged = { ...withLifecycle, ...updates };
      if (updates.status && updates.status !== withLifecycle.status) {
        return appendLifecycleLog(merged, updates.status, updates._by || 'user', updates._note || '');
      }
      return merged;
    });
    // Cloud sync — persist EVERY editable column an edit can touch, not just the
    // inline priority/assignee/next/blocker fields. So a project edited on one
    // device — its title, dates, status, domain, description, weekly load —
    // shows up on the family's other devices instead of stalling until the next
    // sign-in. Scoped to the columns the projects table actually has (lifecycle
    // log + conversations stay local; no column for them), and fails soft: a
    // missing column or an offline edit never blocks the local save.
    if (authSession && d.numericSyncVerifiedAt && !isAnyDemoMode) {
      const updated = next.find(p => p.id === id);
      if (updated && updated.remoteUuid) {
        const COLUMN_OF = {
          title:            'title',
          startDate:        'start_date',
          endDate:          'end_date',
          status:           'status',
          domain:           'domain',
          description:      'description',
          entityId:         'entity_slug',
          priorityRank:     'priority_rank',
          assigneePersonas: 'assignee_personas',
          nextStep:         'next_step',
          blocker:          'blocker',
        };
        const patch = {};
        for (const [localKey, column] of Object.entries(COLUMN_OF)) {
          if (updates[localKey] !== undefined) patch[column] = updates[localKey];
        }
        if (updates.hoursPerWeek !== undefined) patch.hours_per_week = Number(updates.hoursPerWeek);
        // A1 (2026-06-13): sync the rich fields so they survive across devices.
        // lifecycle changes via appendLifecycleLog on a status change (not via
        // updates.lifecycle), so push the CURRENT lifecycle whenever it's present.
        if (updated.lifecycle !== undefined) patch.lifecycle = updated.lifecycle;
        if (updates.conversationLog !== undefined) patch.conversation_log = updates.conversationLog;
        if (updates.contractorIds !== undefined) patch.contractor_ids = updates.contractorIds;
        if (Object.keys(patch).length > 0) {
          projectsSync.updateRow(updated.remoteUuid, patch).catch(e => syncWarn('[projects-sync] project update failed', e));
        }
      }
    }
    return { ...d, projects: next };
  });
  const deleteProject = (id) => {
    if (authSession && data.numericSyncVerifiedAt && !isAnyDemoMode) {
      const local = (data.projects || []).find(p => p.id === id);
      if (local && local.remoteUuid) {
        projectsSync.deleteRow(local.remoteUuid).catch(e => syncWarn('[projects-sync] delete failed', e));
      }
    }
    setData(d => ({ ...d, projects: (d.projects || []).filter(p => p.id !== id) }));
  };

  // ---- Discussions (0035) — discuss-then-document records that drive projects.
  // Same optimistic-local-then-cloud pattern as addProject; fails soft on a sync
  // error so the device copy always survives. No seed/demo discussions exist (an
  // empty list is the honest starting state), so no SEED handling is needed.
  const addDiscussion = (item) => {
    const nowIso = new Date().toISOString();
    const localId = `dc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const seeded = { ...item, id: localId, createdAt: nowIso, createdBy: authSession?.user?.id || null };
    setData(d => ({ ...d, discussions: [...(d.discussions || []), seeded] }));
    if (authSession && data.numericSyncVerifiedAt && !isAnyDemoMode) {
      discussionsSync.upload(seeded)
        .then(res => {
          if (res && res.uploaded && res.remoteId) {
            setData(d => ({ ...d, discussions: (d.discussions || []).map(x => (x.id === localId ? { ...x, remoteUuid: res.remoteId } : x)) }));
          }
        })
        .catch(e => syncWarn('[discussions-sync] add upload failed', e));
    }
  };
  const updateDiscussion = (id, updates) => setData(d => {
    const next = (d.discussions || []).map(x => (x.id === id ? { ...x, ...updates } : x));
    if (authSession && d.numericSyncVerifiedAt && !isAnyDemoMode) {
      const updated = next.find(x => x.id === id);
      if (updated && updated.remoteUuid) {
        const patch = {};
        for (const [localKey, column] of Object.entries(DISCUSSION_COLUMN_OF)) {
          if (updates[localKey] !== undefined) patch[column] = updates[localKey];
        }
        if (Object.keys(patch).length > 0) {
          discussionsSync.updateRow(updated.remoteUuid, patch).catch(e => syncWarn('[discussions-sync] update failed', e));
        }
      }
    }
    return { ...d, discussions: next };
  });
  const deleteDiscussion = (id) => {
    if (authSession && data.numericSyncVerifiedAt && !isAnyDemoMode) {
      const local = (data.discussions || []).find(x => x.id === id);
      if (local && local.remoteUuid) {
        discussionsSync.deleteRow(local.remoteUuid).catch(e => syncWarn('[discussions-sync] delete failed', e));
      }
    }
    setData(d => ({ ...d, discussions: (d.discussions || []).filter(x => x.id !== id) }));
  };

  // ---- Concerns (0039) — the Concerns & Solutions board's curated rows. Same
  // optimistic-local-then-cloud pattern as addDiscussion; fails soft on a sync
  // error so the device copy always survives. The dated seed baseline and the
  // feedback read-through are composed in the component (lib/concerns.js), never
  // persisted into this table — only what the family adds here syncs.
  const addConcern = (item) => {
    const nowIso = new Date().toISOString();
    const localId = `cn-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const seeded = { ...item, id: localId, createdAt: nowIso, createdBy: authSession?.user?.id || null };
    setData(d => ({ ...d, concerns: [...(d.concerns || []), seeded] }));
    if (authSession && data.numericSyncVerifiedAt && !isAnyDemoMode) {
      concernsSync.upload(seeded)
        .then(res => {
          if (res && res.uploaded && res.remoteId) {
            setData(d => ({ ...d, concerns: (d.concerns || []).map(x => (x.id === localId ? { ...x, remoteUuid: res.remoteId } : x)) }));
          }
        })
        .catch(e => syncWarn('[concerns-sync] add upload failed', e));
    }
  };
  const updateConcern = (id, updates) => setData(d => {
    // A seed-baseline concern (id 'seed-...') has no DB row yet. The first edit
    // promotes it into the concerns table so the change persists + syncs; from
    // then on it updates by remoteUuid like any other row.
    const isSeed = typeof id === 'string' && id.startsWith('seed-');
    const existing = (d.concerns || []).find(x => x.id === id);
    if (isSeed && !existing) {
      // Promote: materialize the baseline seed (looked up from SEED_CONCERNS so
      // the NOT-NULL `concern` text is always present) as a real DB concern
      // carrying its edits. Keep the stable seed id so the component's de-dupe
      // (a DB row supersedes the same-id seed) hides the baseline copy.
      const base = SEED_CONCERNS.find(s => s.id === id) || {};
      const promoted = { ...base, id, createdAt: new Date().toISOString(), createdBy: authSession?.user?.id || null, source: 'manual', ...updates };
      if (authSession && d.numericSyncVerifiedAt && !isAnyDemoMode) {
        concernsSync.upload(promoted)
          .then(res => {
            if (res && res.uploaded && res.remoteId) {
              setData(dd => ({ ...dd, concerns: (dd.concerns || []).map(x => (x.id === id ? { ...x, remoteUuid: res.remoteId } : x)) }));
            }
          })
          .catch(e => syncWarn('[concerns-sync] seed-promote upload failed', e));
      }
      return { ...d, concerns: [...(d.concerns || []), promoted] };
    }
    const next = (d.concerns || []).map(x => (x.id === id ? { ...x, ...updates } : x));
    if (authSession && d.numericSyncVerifiedAt && !isAnyDemoMode) {
      const updated = next.find(x => x.id === id);
      if (updated && updated.remoteUuid) {
        const patch = {};
        for (const [localKey, column] of Object.entries(CONCERN_COLUMN_OF)) {
          if (updates[localKey] !== undefined) patch[column] = updates[localKey];
        }
        if (Object.keys(patch).length > 0) {
          concernsSync.updateRow(updated.remoteUuid, patch).catch(e => syncWarn('[concerns-sync] update failed', e));
        }
      }
    }
    return { ...d, concerns: next };
  });
  const deleteConcern = (id) => {
    if (authSession && data.numericSyncVerifiedAt && !isAnyDemoMode) {
      const local = (data.concerns || []).find(x => x.id === id);
      if (local && local.remoteUuid) {
        concernsSync.deleteRow(local.remoteUuid).catch(e => syncWarn('[concerns-sync] delete failed', e));
      }
    }
    setData(d => ({ ...d, concerns: (d.concerns || []).filter(x => x.id !== id) }));
  };

  // ---- Creation Workspaces (0037) — the in-app document / image creation space.
  // Same optimistic-local-then-cloud pattern as addDiscussion; fails soft on a
  // sync error so the device copy always survives. addWorkspace RETURNS the new
  // local id so the editor can switch from "new" to "editing this record".
  const addWorkspace = (item) => {
    const nowIso = new Date().toISOString();
    const localId = `ws-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const seeded = { ...item, id: localId, createdAt: nowIso, updatedAt: nowIso, createdBy: authSession?.user?.id || null };
    setData(d => ({ ...d, workspaces: [...(d.workspaces || []), seeded] }));
    if (authSession && data.numericSyncVerifiedAt && !isAnyDemoMode) {
      workspacesSync.upload(seeded)
        .then(res => {
          if (res && res.uploaded && res.remoteId) {
            setData(d => ({ ...d, workspaces: (d.workspaces || []).map(x => (x.id === localId ? { ...x, remoteUuid: res.remoteId } : x)) }));
          }
        })
        .catch(e => syncWarn('[workspaces-sync] add upload failed', e));
    }
    return localId;
  };
  const updateWorkspace = (id, updates) => setData(d => {
    const stamped = { ...updates, updatedAt: new Date().toISOString() };
    const next = (d.workspaces || []).map(x => (x.id === id ? { ...x, ...stamped } : x));
    if (authSession && d.numericSyncVerifiedAt && !isAnyDemoMode) {
      const updated = next.find(x => x.id === id);
      if (updated && updated.remoteUuid) {
        const patch = {};
        for (const [localKey, column] of Object.entries(WORKSPACE_COLUMN_OF)) {
          if (updates[localKey] !== undefined) patch[column] = updates[localKey];
        }
        if (Object.keys(patch).length > 0) {
          workspacesSync.updateRow(updated.remoteUuid, patch).catch(e => syncWarn('[workspaces-sync] update failed', e));
        }
      }
    }
    return { ...d, workspaces: next };
  });
  const deleteWorkspace = (id) => {
    if (authSession && data.numericSyncVerifiedAt && !isAnyDemoMode) {
      const local = (data.workspaces || []).find(x => x.id === id);
      if (local && local.remoteUuid) {
        workspacesSync.deleteRow(local.remoteUuid).catch(e => syncWarn('[workspaces-sync] delete failed', e));
      }
    }
    setData(d => ({ ...d, workspaces: (d.workspaces || []).filter(x => x.id !== id) }));
  };

  // ── Systems of record: shared immutable history + inventory ───────────────
  // recordHistoryEvent — append ONE record-history event (lib/record-history.js)
  // to the append-only log and sync it. The shared primitive behind both the
  // inventory item version-history AND Books transaction edit-history: a record
  // becomes a versioned living record because every change is captured here, never
  // overwritten. Best-effort: a failed cloud insert never blocks the local write
  // (the optimistic row stays on device and retries on next sign-in).
  const recordHistoryEvent = ({ recordKind, recordId, action, before, after, summary, meta }) => {
    const actor = authSession ? personaOf(authSession.user?.email) : null;
    const ev = makeHistoryEvent({
      id: `re-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      recordKind, recordId, action, actor,
      at: new Date().toISOString(), before: before || null, after: after || null,
      summary: summary || null, meta: meta || null,
    });
    setData(d => ({ ...d, recordEvents: [...(d.recordEvents || []), ev] }));
    if (authSession && data.numericSyncVerifiedAt && !isAnyDemoMode) {
      recordEventsSync.upload(ev).catch(e => syncWarn('[record-events-sync] upload failed', e));
    }
    return ev;
  };

  const addInventoryItem = (item) => {
    const nowIso = new Date().toISOString();
    const localId = `inv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const seeded = { ...item, id: localId, active: item.active !== false, createdAt: nowIso, updatedAt: nowIso, createdBy: authSession?.user?.id || null, authorPersona: authSession ? personaOf(authSession.user?.email) : null };
    setData(d => ({ ...d, inventoryItems: [...(d.inventoryItems || []), seeded] }));
    if (authSession && data.numericSyncVerifiedAt && !isAnyDemoMode) {
      inventoryItemsSync.upload(seeded)
        .then(res => {
          if (res && res.uploaded && res.remoteId) {
            setData(d => ({ ...d, inventoryItems: (d.inventoryItems || []).map(x => (x.id === localId ? { ...x, remoteUuid: res.remoteId } : x)) }));
          }
        })
        .catch(e => syncWarn('[inventory-items-sync] add upload failed', e));
    }
    recordHistoryEvent({ recordKind: 'inventory_item', recordId: localId, action: 'create', after: seeded, summary: `Item created: ${seeded.name}` });
    return localId;
  };

  const updateInventoryItem = (id, updates) => setData(d => {
    const before = (d.inventoryItems || []).find(x => x.id === id) || null;
    const stamped = { ...updates, updatedAt: new Date().toISOString() };
    const next = (d.inventoryItems || []).map(x => (x.id === id ? { ...x, ...stamped } : x));
    const after = next.find(x => x.id === id) || null;
    if (authSession && d.numericSyncVerifiedAt && !isAnyDemoMode) {
      if (after && after.remoteUuid) {
        const patch = {};
        for (const [localKey, column] of Object.entries(INVENTORY_ITEM_COLUMN_OF)) {
          if (updates[localKey] !== undefined) patch[column] = updates[localKey];
        }
        if (Object.keys(patch).length > 0) {
          inventoryItemsSync.updateRow(after.remoteUuid, patch).catch(e => syncWarn('[inventory-items-sync] update failed', e));
        }
      }
    }
    // Capture the edit as an immutable version (before/after diff is derived).
    recordHistoryEvent({ recordKind: 'inventory_item', recordId: id, action: 'update', before, after });
    return { ...d, inventoryItems: next };
  });

  // recordInventoryMovements — post one or more APPEND-ONLY stock movements
  // (a transfer is a balanced pair). Movements are never edited or deleted; this
  // is the immutable ledger on-hand derives from. Each leg gets a stable id +
  // actor + occurredAt, then syncs (insert-only).
  const recordInventoryMovements = (movs) => {
    const actor = authSession ? personaOf(authSession.user?.email) : null;
    const nowIso = new Date().toISOString();
    const stamped = (Array.isArray(movs) ? movs : [movs]).map((m, i) => ({
      ...m,
      id: m.id || `mv-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
      actor: m.actor || actor,
      occurredAt: m.occurredAt || nowIso,
      createdBy: authSession?.user?.id || null,
    }));
    setData(d => ({ ...d, inventoryMovements: [...(d.inventoryMovements || []), ...stamped] }));
    if (authSession && data.numericSyncVerifiedAt && !isAnyDemoMode) {
      for (const mv of stamped) {
        inventoryMovementsSync.upload(mv)
          .then(res => {
            if (res && res.uploaded && res.remoteId) {
              setData(d => ({ ...d, inventoryMovements: (d.inventoryMovements || []).map(x => (x.id === mv.id ? { ...x, remoteUuid: res.remoteId } : x)) }));
            }
          })
          .catch(e => syncWarn('[inventory-movements-sync] upload failed', e));
      }
    }
    return stamped.map(m => m.id);
  };

  // ---- Kitchen vertical dispatchers (counts 0053 + purchasing 0054) — EXTRACTED
  // to lib/kitchen-dispatchers.js so the shell stays frozen (DR-0078 cutover;
  // monolith-budget-guard). Same optimistic-local-then-cloud writers as before.
  // Counts close by posting adjust MOVEMENTS via recordInventoryMovements (above);
  // APPROVE-TO-PURCHASE lives in the surface (drafts derived live; the owner
  // approves/places — nothing here places an order or moves money).
  const {
    addInventoryCount, updateInventoryCount, addInventoryCountLine, updateInventoryCountLine,
    addPurchaseOrder, updatePurchaseOrder, addPurchaseOrderLine,
  } = createKitchenDispatchers({
    setData,
    userId: () => authSession?.user?.id || null,
    syncReady: () => !!(authSession && data.numericSyncVerifiedAt && !isAnyDemoMode),
  });

  // ---- Chef's Corner recipes (0052) — same optimistic-local-then-cloud pattern
  // as addWorkspace. The recipe object already carries its engine-shaped fields
  // (sectioned ingredients/steps, etc.) from makeRecipe; we only stamp the local
  // id + timestamps. addRecipe RETURNS the new local id so the UI can open the
  // saved recipe's detail view. Fails soft so the device copy always survives.
  const addRecipe = (item) => {
    const nowIso = new Date().toISOString();
    const localId = item?.id && /^recipe-/.test(item.id) ? `${item.id}-${Date.now().toString(36)}` : `recipe-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const seeded = { ...item, id: localId, dateAdded: item?.dateAdded || nowIso.slice(0, 10), createdAt: nowIso, updatedAt: nowIso, createdBy: authSession?.user?.id || null };
    setData(d => ({ ...d, recipes: [...(d.recipes || []), seeded] }));
    if (authSession && data.numericSyncVerifiedAt && !isAnyDemoMode) {
      recipesSync.upload(seeded)
        .then(res => {
          if (res && res.uploaded && res.remoteId) {
            setData(d => ({ ...d, recipes: (d.recipes || []).map(x => (x.id === localId ? { ...x, remoteUuid: res.remoteId } : x)) }));
          }
        })
        .catch(e => syncWarn('[recipes-sync] add upload failed', e));
    }
    return localId;
  };
  const updateRecipe = (id, updates) => setData(d => {
    const stamped = { ...updates, updatedAt: new Date().toISOString() };
    const next = (d.recipes || []).map(x => (x.id === id ? { ...x, ...stamped } : x));
    if (authSession && d.numericSyncVerifiedAt && !isAnyDemoMode) {
      const updated = next.find(x => x.id === id);
      if (updated && updated.remoteUuid) {
        const patch = {};
        for (const [localKey, column] of Object.entries(RECIPE_COLUMN_OF)) {
          if (updates[localKey] !== undefined) patch[column] = updates[localKey];
        }
        if (Object.keys(patch).length > 0) {
          recipesSync.updateRow(updated.remoteUuid, patch).catch(e => syncWarn('[recipes-sync] update failed', e));
        }
      }
    }
    return { ...d, recipes: next };
  });
  const deleteRecipe = (id) => {
    if (authSession && data.numericSyncVerifiedAt && !isAnyDemoMode) {
      const local = (data.recipes || []).find(x => x.id === id);
      if (local && local.remoteUuid) {
        recipesSync.deleteRow(local.remoteUuid).catch(e => syncWarn('[recipes-sync] delete failed', e));
      }
    }
    setData(d => ({ ...d, recipes: (d.recipes || []).filter(x => x.id !== id) }));
  };

  // ---- Games hub saves — local-first (the app data store is localStorage-backed
  // and instance-scoped). A game survives a reload and a not-signed-in child can
  // still play. addGameSave RETURNS the new local id so the hub can open it.
  // 0077 doc-rail CRUD (lib/live-rails.js) — add/update/remove with fail-soft
  // sync, factored once so the frozen shell stays thin (monolith-budget-guard).
  const railCrud = (sync, key, label) => makeSyncedListCrud({ sync, key, label, setData, getData: () => data, canSync: (d) => !!(authSession && (d || data).numericSyncVerifiedAt && !isAnyDemoMode), warn: syncWarn });
  const gameSavesCrud = railCrud(gameSavesSync, 'gameSaves', 'game-saves-sync');
  const addGameSave = (item) => gameSavesCrud.add({ ...item, id: `game-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` });
  const updateGameSave = gameSavesCrud.update;
  const deleteGameSave = gameSavesCrud.remove;

  // 0077 — the subscriptions audit is family money state (doc rail).
  const subscriptionsCrud = railCrud(subscriptionsSync, 'subscriptions', 'subscriptions-sync');
  const addSubscription = (item) => { subscriptionsCrud.add({ ...item, id: `sub-${Date.now()}`, createdAt: new Date().toISOString() }); };
  const updateSubscription = subscriptionsCrud.update;
  // r25 — 1099 contractor CRUD per EDITABLE-EVERYWHERE.md.
  // v2.13 — contractors sync to contractors_1099 so the worker roster (and
  // the phones one-tap dispatch depends on) is shared across the family.
  const addContractor = (item) => {
    const seeded = { ...item, id: `k-${Date.now()}` };
    setData(d => ({ ...d, contractors1099: [...(d.contractors1099 || []), seeded] }));
    if (authSession && data.numericSyncVerifiedAt && !isAnyDemoMode) {
      contractorsSync.upload(seeded).then((res) => {
        if (res && res.remoteId) {
          setData(d => ({ ...d, contractors1099: (d.contractors1099 || []).map(c => c.id === seeded.id ? { ...c, remoteUuid: res.remoteId } : c) }));
        }
      }).catch(e => syncWarn('[contractors-sync] upload failed', e));
    }
  };
  const updateContractor = (id, updates) => {
    // 2026-06-12 fix: same stale-closure push as updateIncident — see there.
    setData(d => {
      const next = (d.contractors1099 || []).map(c => c.id === id ? { ...c, ...updates } : c);
      if (authSession && d.numericSyncVerifiedAt && !isAnyDemoMode) {
        const updated = next.find(c => c.id === id);
        if (updated && updated.remoteUuid) {
          contractorsSync.updateRow(updated.remoteUuid, contractorColumns(updated)).catch(e => syncWarn('[contractors-sync] update failed', e));
        }
      }
      return { ...d, contractors1099: next };
    });
  };
  const deleteContractor = (id) => {
    if (authSession && data.numericSyncVerifiedAt && !isAnyDemoMode) {
      const current = (data.contractors1099 || []).find(c => c.id === id);
      if (current && current.remoteUuid) {
        contractorsSync.deleteRow(current.remoteUuid).catch(e => syncWarn('[contractors-sync] delete failed', e));
      }
    }
    setData(d => ({ ...d, contractors1099: (d.contractors1099 || []).filter(c => c.id !== id) }));
  };
  // r30 — Entity update (no delete: entities are referenced by accounts/debts/contractors/transactions; orphan risk).
  const updateEntity = (id, updates) => {
    setData(d => ({ ...d, entities: (d.entities || []).map(e => e.id === id ? { ...e, ...updates } : e) }));
    // Layer 2 sync — fire-and-forget push to Supabase. The local update
    // already landed via setData; if the remote update fails, the next
    // initial-sync on next sign-in will reconcile.
    const local = (data.entities || []).find(e => e.id === id);
    if (local && local.remoteUuid) {
      const patch = {};
      if (updates.name !== undefined) patch.display_name = updates.name;
      if (updates.type !== undefined) patch.entity_type = updates.type;
      if (updates.notes !== undefined) patch.notes = updates.notes;
      entitiesSync.updateRow(local.remoteUuid, patch).catch(e => syncWarn('[entities-sync] update failed', e));
    }
  };
  const deleteSubscription = subscriptionsCrud.remove;
  // Feedback — seeded with lifecycle so the new → reviewed → planned → shipped flow has an audit trail.
  // Layer 2: after the local setData, fire-and-forget uploadFeedback so
  // other signed-in family/church devices see it. Upload no-ops when
  // signed out, so the local-only path is unchanged for guest users.
  const addFeedback = (item) => {
    const nowIso = new Date().toISOString();
    const initialStatus = item.status || 'new';
    // Keep the base64 images OUT of localStorage (they would bloat the quota
    // and every device's snapshot). They ride to Supabase via uploadFeedback;
    // the local copy keeps only a marker + count. Tolerate the legacy single
    // `screenshot` field as well as the multi-image `screenshots` array.
    const { screenshot, screenshots, ...rest } = item;
    const imgs = Array.isArray(screenshots) ? screenshots : (screenshot ? [screenshot] : []);
    const seeded = {
      ...rest,
      hasScreenshot: imgs.length > 0,
      screenshotCount: imgs.length,
      id: `fb-${Date.now()}`,
      createdAt: nowIso,
      status: initialStatus,
      lifecycle: {
        phase: initialStatus,
        openedAt: nowIso,
        closedAt: LIFECYCLE_TERMINAL_PHASES.has(initialStatus) ? nowIso : null,
        log: [{ at: nowIso, fromPhase: null, toPhase: initialStatus, by: 'user', note: 'feedback submitted' }],
      },
    };
    setData(d => ({ ...d, feedback: [...(d.feedback || []), seeded] }));
    uploadFeedback(seeded, { activeTab: view, appVersion: data.meta?.appVersion, screenshots: imgs });
  };
  const deleteFeedback = (id) => setData(d => ({ ...d, feedback: (d.feedback || []).filter(f => f.id !== id) }));
  const dismissWelcome = () => setData(d => ({ ...d, welcomeDismissed: true }));
  const deleteRecurring = (id) => setData(d => ({ ...d, recurringObligations: d.recurringObligations.filter(r => r.id !== id) }));
  // r22 — Update affordances for Calendar rows (was delete-only). Per
  // IDENTITY-ROLES-AUDIT.md, every state change is attributable; lifecycle log
  // captures by/when. Recurring + event are sibling shapes; mirror the pattern.
  const updateRecurring = (id, updates) => setData(d => ({ ...d, recurringObligations: d.recurringObligations.map(r => r.id === id ? { ...r, ...updates } : r) }));
  const updateEvent = (id, updates) => setData(d => ({ ...d, events: (d.events || []).map(e => e.id === id ? { ...e, ...updates } : e) }));
  // 2026-06-24 RESURRECTION FIX — a real (synced) incident must be deleted from
  // the cloud too, else the realtime subscribe/initialSync merge (see the sync
  // effect) re-fetches the still-present row and unionPreservingLocal adds it
  // straight back on the next reload/refetch. This mirrors deleteProject /
  // deleteAccount, which were already correct; deleteIncident was the lone
  // local-only delete. Seed rows (no remoteUuid) skip the cloud call.
  const deleteIncident = (id) => {
    if (authSession && data.numericSyncVerifiedAt && !isAnyDemoMode) {
      const local = (data.incidents || []).find(i => i.id === id);
      if (local && local.remoteUuid) {
        incidentsSync.deleteRow(local.remoteUuid).catch(e => syncWarn('[incidents-sync] delete failed', e));
      }
    }
    setData(d => ({ ...d, incidents: (d.incidents || []).filter(i => i.id !== id) }));
  };
  const deleteEvent = (id) => setData(d => ({ ...d, events: (d.events || []).filter(e => e.id !== id) }));
  // v28+ Session A: Accounts CRUD
  const addAccount = (item) => {
    const seeded = { ...item, id: `a-${Date.now()}`, balance: parseFloat(item.balance) || 0, inLegal: !!item.inLegal };
    setData(d => ({ ...d, accounts: [...(d.accounts || []), seeded] }));
    if (authSession && data.numericSyncVerifiedAt && !isAnyDemoMode) {
      // Stamp remoteUuid as soon as the insert lands so follow-on edits/deletes
      // reach the cloud row immediately (else they silently no-op until a
      // realtime refetch backfills it). Matches the incidents pattern.
      accountsSync.upload(seeded).then((res) => {
        if (res && res.remoteId) setData(d => ({ ...d, accounts: (d.accounts || []).map(a => a.id === seeded.id ? { ...a, remoteUuid: res.remoteId } : a) }));
      }).catch(e => syncWarn('[accounts-sync] upload failed', e));
    }
  };
  // 2026-05-24 — Move-to-Legal toggle: flips inLegal on an account, which
  // removes it from cash totals and the Accounts tab and surfaces it in the
  // Legal tab. Reversible; Legal tab has a Restore button that calls back
  // through updateAccount with inLegal: false.
  const toggleAccountLegal = (id) => {
    const a = (data.accounts || []).find(x => x.id === id);
    if (!a) return;
    updateAccount(id, { inLegal: !a.inLegal });
  };
  const updateAccount = (id, updates) => {
    setData(d => ({ ...d, accounts: (d.accounts || []).map(a => a.id === id ? { ...a, ...updates, balance: updates.balance !== undefined ? parseFloat(updates.balance) || 0 : a.balance } : a) }));
    if (authSession && data.numericSyncVerifiedAt && !isAnyDemoMode) {
      const local = (data.accounts || []).find(a => a.id === id);
      if (local && local.remoteUuid) {
        const patch = {};
        if (updates.name !== undefined)        patch.display_name = updates.name;
        if (updates.institution !== undefined) patch.institution = updates.institution;
        if (updates.type !== undefined)        patch.account_type = updates.type;
        if (updates.fragment !== undefined)    patch.fragment = updates.fragment;
        if (updates.balance !== undefined)     patch.balance = parseFloat(updates.balance) || 0;
        if (updates.inLegal !== undefined)     patch.in_legal = !!updates.inLegal;
        if (updates.isPrimary !== undefined)   patch.is_primary = !!updates.isPrimary;
        if (updates.entityId !== undefined)    patch.entity_slug = updates.entityId;
        accountsSync.updateRow(local.remoteUuid, patch).catch(e => syncWarn('[accounts-sync] update failed', e));
      }
    }
  };
  const deleteAccount = (id) => {
    if (authSession && data.numericSyncVerifiedAt && !isAnyDemoMode) {
      const local = (data.accounts || []).find(a => a.id === id);
      if (local && local.remoteUuid) {
        accountsSync.deleteRow(local.remoteUuid).catch(e => syncWarn('[accounts-sync] delete failed', e));
      }
    }
    setData(d => ({ ...d, accounts: (d.accounts || []).filter(a => a.id !== id) }));
  };
  // v28+ Session A: Transactions CRUD
  const addTransaction = (item) => {
    // Keep a caller-provided STABLE id (verified-sync's `vl-<fitid>`) so it persists as the cloud slug -> idempotent; manual/CSV adds pass none.
    const seeded = { ...item, id: item.id || `t-${Date.now()}`, amount: parseFloat(item.amount) || 0 };
    setData(d => ({ ...d, transactions: [...(d.transactions || []), seeded] }));
    if (authSession && data.numericSyncVerifiedAt && !isAnyDemoMode) {
      transactionsSync.upload(seeded).then((res) => {
        if (res && res.remoteId) setData(d => ({ ...d, transactions: (d.transactions || []).map(t => t.id === seeded.id ? { ...t, remoteUuid: res.remoteId } : t) }));
      }).catch(e => syncWarn('[transactions-sync] upload failed', e));
    }
  };
  // Verified-ledger sync (DR-0083) — INACTIVE unless VITE_VERIFIED_LEDGER_URL is set (armed). Pulls the sovereign NAS verified ledger into the durable cloud ledger on sign-in: idempotent (FITID), fail-safe (unreachable=no-op), authenticated write (correct instance/RLS). The balance always derives from the durable ledger, never a live fetch.
  useEffect(() => {
    const url = import.meta.env.VITE_VERIFIED_LEDGER_URL;
    if (!url || !authSession || !isFamilyMember || !data.numericSyncVerifiedAt || isAnyDemoMode) return;
    runVerifiedLedgerSync({ url, accounts: data.accounts || [], transactions: data.transactions || [], addTransaction }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per sign-in, not per-txn (would re-loop)
  }, [authSession, isFamilyMember, data.numericSyncVerifiedAt]);
  const updateTransaction = (id, updates) => {
    // Books living record: capture the BEFORE snapshot so the edit becomes an
    // immutable, attributed version in record_events (lib/record-history.js) —
    // "what was this transaction before, who changed it, when." The edit itself
    // still mutates the live row (the current figure stays single-valued); the
    // history is the recoverable trail beside it.
    const before = (data.transactions || []).find(t => t.id === id) || null;
    const after = before ? { ...before, ...updates, amount: updates.amount !== undefined ? parseFloat(updates.amount) || 0 : before.amount } : null;
    setData(d => ({ ...d, transactions: (d.transactions || []).map(t => t.id === id ? { ...t, ...updates, amount: updates.amount !== undefined ? parseFloat(updates.amount) || 0 : t.amount } : t) }));
    if (authSession && data.numericSyncVerifiedAt && !isAnyDemoMode) {
      const local = (data.transactions || []).find(t => t.id === id);
      if (local && local.remoteUuid) {
        const patch = {};
        if (updates.date !== undefined)           patch.txn_date = updates.date;
        if (updates.accountId !== undefined)      patch.account_slug = updates.accountId;
        if (updates.entityOverride !== undefined) patch.entity_override_slug = updates.entityOverride;
        if (updates.amount !== undefined)         patch.amount = parseFloat(updates.amount) || 0;
        if (updates.description !== undefined)    patch.description = updates.description;
        if (updates.category !== undefined)       patch.category = updates.category;
        if (updates.isTransfer !== undefined)     patch.is_transfer = !!updates.isTransfer;
        if (updates.receipt !== undefined)        patch.receipt = updates.receipt;
        transactionsSync.updateRow(local.remoteUuid, patch).catch(e => syncWarn('[transactions-sync] update failed', e));
      }
    }
    if (before && after) recordHistoryEvent({ recordKind: 'transaction', recordId: id, action: 'update', before, after });
  };
  // recategorizePayee — LEARN + BACK-APPLY. When the user corrects a category,
  // record the payee->category rule (data.categoryRules, so future imports of
  // that payee auto-apply) AND re-label every existing transaction from the same
  // payee. One correction, applied everywhere; each changed row syncs. Returns
  // the number of rows changed so the caller can confirm.
  const recategorizePayee = (description, category) => {
    const key = payeeKey(description);
    if (!key) return 0;
    const changed = (data.transactions || []).filter(t => payeeKey(t.description) === key && t.category !== category);
    setData(d => ({
      ...d,
      categoryRules: { ...(d.categoryRules || {}), [key]: category },
      transactions: applyCategoryToPayee(d.transactions || [], key, category).transactions,
    }));
    if (authSession && data.numericSyncVerifiedAt && !isAnyDemoMode) {
      for (const t of changed) {
        if (t.remoteUuid) transactionsSync.updateRow(t.remoteUuid, { category }).catch(e => syncWarn('[transactions-sync] recategorize failed', e));
      }
    }
    for (const t of changed) {
      recordHistoryEvent({ recordKind: 'transaction', recordId: t.id, action: 'update', before: t, after: { ...t, category } });
    }
    return changed.length;
  };
  const deleteTransaction = (id) => {
    const before = (data.transactions || []).find(t => t.id === id) || null;
    if (authSession && data.numericSyncVerifiedAt && !isAnyDemoMode) {
      const local = (data.transactions || []).find(t => t.id === id);
      if (local && local.remoteUuid) {
        transactionsSync.deleteRow(local.remoteUuid).catch(e => syncWarn('[transactions-sync] delete failed', e));
      }
    }
    setData(d => ({ ...d, transactions: (d.transactions || []).filter(t => t.id !== id) }));
    // The deletion is recoverable: its `before` snapshot is preserved in the
    // append-only history (the row leaves the live ledger, not the record).
    if (before) recordHistoryEvent({ recordKind: 'transaction', recordId: id, action: 'delete', before, summary: `Transaction deleted: ${before.description || ''} ${before.amount}` });
  };
  // v28+ Rentals expansion: Rental property CRUD
  // 2026-06-10 — wired for cross-device sync (schema v2.2.2 rentals). Same gate
  // as accounts/debts/transactions: only push once VerifyBalances has run.
  // Only the top-level property columns travel; mortgage rate/P&I/escrow,
  // rooms, equipment, logs, and the lease/tenant/market sub-objects stay
  // device-local (leases + rent_payments sync is the follow-up).
  const addRental = (item) => {
    // Random suffix so rapid same-ms adds (restore-a-building's units loops
    // addRental) get distinct ids instead of colliding into one door.
    const seeded = { ...item, id: `r-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` };
    setData(d => ({ ...d, inflows: { ...d.inflows, rentals: [...(d.inflows.rentals || []), seeded] } }));
    if (authSession && data.numericSyncVerifiedAt && !isAnyDemoMode) {
      // Stamp remoteUuid as soon as the insert lands — without it, an edit or
      // delete in the window before the next realtime refresh can't reach the
      // remote row (a delete would even resurrect on the next merge).
      rentalsSync.upload(seeded).then((res) => {
        if (res && res.remoteId) {
          setData(d => ({ ...d, inflows: { ...d.inflows, rentals: (d.inflows.rentals || []).map(r => r.id === seeded.id ? { ...r, remoteUuid: res.remoteId } : r) } }));
        }
      }).catch(e => syncWarn('[rentals-sync] upload failed', e));
    }
  };
  const updateRental = (id, updates) => {
    setData(d => ({ ...d, inflows: { ...d.inflows, rentals: (d.inflows.rentals || []).map(r => r.id === id ? { ...r, ...updates } : r) } }));
    if (authSession && data.numericSyncVerifiedAt && !isAnyDemoMode) {
      const local = (data.inflows.rentals || []).find(r => r.id === id);
      if (local && local.remoteUuid) {
        const patch = {};
        if (updates.name !== undefined)           patch.display_name = updates.name;
        if (updates.address !== undefined)        patch.address = updates.address;
        if (updates.city !== undefined)           patch.city = updates.city || null;
        if (updates.state !== undefined)          patch.state = updates.state || null;
        if (updates.zip !== undefined)            patch.zip = updates.zip || null;
        if (updates.tenantName !== undefined)     patch.tenant_name = updates.tenantName || null;
        if (updates.entityId !== undefined)       patch.entity_slug = updates.entityId || null;
        if (updates.propertyType !== undefined)   patch.property_type = toRemotePropertyType(updates.propertyType);
        if (updates.status !== undefined)         patch.status = toRemoteStatus(updates.status);
        if (updates.rent !== undefined)           patch.monthly_rent = parseFloat(updates.rent) || 0;
        if (updates.actual !== undefined)         patch.rent_actual = parseFloat(updates.actual) || 0;
        if (updates.purchasePrice !== undefined)  patch.purchase_price = parseFloat(updates.purchasePrice) || 0;
        if (updates.purchaseDate !== undefined)   patch.purchase_date = updates.purchaseDate || null;
        if (updates.estimatedValue !== undefined) patch.current_market_value = parseFloat(updates.estimatedValue) || 0;
        if (updates.mortgage !== undefined) {
          patch.mortgage_balance = parseFloat(updates.mortgage?.balance) || 0;
          patch.mortgage_rate    = parseFloat(updates.mortgage?.rate) || 0;
          patch.mortgage_payment = parseFloat(updates.mortgage?.monthlyPI) || 0;
          patch.mortgage_escrow  = parseFloat(updates.mortgage?.escrow) || 0;
        }
        if (updates.notes !== undefined)          patch.notes = updates.notes;
        // Device-local edits (rooms, equipment, logs, lease/tenant/market
        // sub-objects) produce an empty patch — skip the network round-trip.
        if (Object.keys(patch).length) {
          rentalsSync.updateRow(local.remoteUuid, patch).catch(e => syncWarn('[rentals-sync] update failed', e));
        }
      }
    }
  };
  const deleteRental = (id) => {
    if (authSession && data.numericSyncVerifiedAt && !isAnyDemoMode) {
      const local = (data.inflows.rentals || []).find(r => r.id === id);
      if (local && local.remoteUuid) {
        rentalsSync.deleteRow(local.remoteUuid).catch(e => syncWarn('[rentals-sync] delete failed', e));
      }
    }
    setData(d => ({ ...d, inflows: { ...d.inflows, rentals: (d.inflows.rentals || []).filter(r => r.id !== id) } }));
  };
  const addScope = (scope) => setData(d => ({ ...d, scopes: [...d.scopes, { ...scope, id: `sc-${Date.now()}`, createdAt: new Date().toISOString(), status: 'draft' }] }));
  const deleteScope = (id) => setData(d => ({ ...d, scopes: d.scopes.filter(s => s.id !== id) }));
  // 2026-05-25 — Inquiries CRUD wired for cross-device sync. Same gate as
  // accounts/debts/transactions/projects: only push to Supabase once the user
  // has completed the VerifyBalances walkthrough. Lets Christina enter a TLC
  // inquiry on her laptop and see it on her phone (and vice versa).
  const addInquiry = (item) => {
    const nowIso = new Date().toISOString();
    const seeded = { ...item, id: `inq-${Date.now()}`, receivedAt: nowIso, status: 'new', statusHistory: [{ status: 'new', at: nowIso }] };
    setData(d => ({ ...d, inquiries: [...(d.inquiries || []), seeded] }));
    if (authSession && data.numericSyncVerifiedAt && !isAnyDemoMode) {
      inquiriesSync.upload(seeded).then((res) => {
        if (res && res.remoteId) setData(d => ({ ...d, inquiries: (d.inquiries || []).map(q => q.id === seeded.id ? { ...q, remoteUuid: res.remoteId } : q) }));
      }).catch(e => syncWarn('[inquiries-sync] upload failed', e));
    }
  };
  // v28+ Session C: checkout intent logging
  const addCheckoutIntent = (item) => setData(d => ({ ...d, checkoutIntents: [...(d.checkoutIntents || []), { ...item, id: `ci-${Date.now()}`, at: new Date().toISOString() }] }));
  const deleteCheckoutIntent = (id) => setData(d => ({ ...d, checkoutIntents: (d.checkoutIntents || []).filter(i => i.id !== id) }));
  const updateInquiry = (id, updates) => {
    setData(d => ({ ...d, inquiries: (d.inquiries || []).map(i => i.id === id ? { ...i, ...updates, statusHistory: updates.status && updates.status !== i.status ? [...(i.statusHistory || []), { status: updates.status, at: new Date().toISOString(), notes: updates.statusNotes }] : i.statusHistory } : i) }));
    if (authSession && data.numericSyncVerifiedAt && !isAnyDemoMode) {
      const local = (data.inquiries || []).find(i => i.id === id);
      if (local && local.remoteUuid) {
        const patch = {};
        if (updates.firstName !== undefined)         patch.first_name         = updates.firstName;
        if (updates.contactMethod !== undefined)     patch.contact_method     = updates.contactMethod;
        if (updates.contactValue !== undefined)      patch.contact_value      = updates.contactValue;
        if (updates.phone !== undefined && local.contactMethod !== 'email') patch.contact_value = updates.phone;
        if (updates.email !== undefined && local.contactMethod === 'email') patch.contact_value = updates.email;
        if (updates.interestArea !== undefined)      patch.interest_area      = updates.interestArea;
        if (updates.hasInsurance !== undefined)      patch.has_insurance      = updates.hasInsurance;
        if (updates.preferredProvider !== undefined) patch.preferred_provider = updates.preferredProvider;
        if (updates.bestTimeToCall !== undefined)    patch.best_time_to_call  = updates.bestTimeToCall;
        if (updates.source !== undefined)            patch.source             = updates.source;
        if (updates.sourceDetail !== undefined)      patch.source_detail      = updates.sourceDetail;
        if (updates.notes !== undefined)             patch.notes              = updates.notes;
        if (updates.status !== undefined) {
          patch.status = updates.status;
          // Mirror the local status_history append so other devices see the new entry.
          const nextHistory = updates.status !== local.status
            ? [...(local.statusHistory || []), { status: updates.status, at: new Date().toISOString(), notes: updates.statusNotes }]
            : (local.statusHistory || []);
          patch.status_history = nextHistory;
        }
        if (updates.conversationLog !== undefined)   patch.conversation_log   = updates.conversationLog;
        inquiriesSync.updateRow(local.remoteUuid, patch).catch(e => syncWarn('[inquiries-sync] update failed', e));
      }
    }
  };
  const deleteInquiry = (id) => {
    if (authSession && data.numericSyncVerifiedAt && !isAnyDemoMode) {
      const local = (data.inquiries || []).find(i => i.id === id);
      if (local && local.remoteUuid) {
        inquiriesSync.deleteRow(local.remoteUuid).catch(e => syncWarn('[inquiries-sync] delete failed', e));
      }
    }
    setData(d => ({ ...d, inquiries: (d.inquiries || []).filter(i => i.id !== id) }));
  };
  // Practice leads (0045) — client-acquisition CRM. The lead arrives fully formed
  // (newLead() in ClientGrowth sets the id + shape); reducers mirror inquiries.
  const addLead = (lead) => {
    setData(d => ({ ...d, practiceLeads: [...(d.practiceLeads || []), lead] }));
    if (authSession && data.numericSyncVerifiedAt && !isAnyDemoMode) {
      practiceLeadsSync.upload(lead).then((res) => {
        if (res && res.remoteId) setData(d => ({ ...d, practiceLeads: (d.practiceLeads || []).map(q => q.id === lead.id ? { ...q, remoteUuid: res.remoteId } : q) }));
      }).catch(e => syncWarn('[practice-leads-sync] upload failed', e));
    }
  };
  const updateLead = (id, updates) => {
    setData(d => ({ ...d, practiceLeads: (d.practiceLeads || []).map(l => l.id === id ? { ...l, ...updates, updatedAt: new Date().toISOString() } : l) }));
    if (authSession && data.numericSyncVerifiedAt && !isAnyDemoMode) {
      const local = (data.practiceLeads || []).find(l => l.id === id);
      if (local && local.remoteUuid) {
        const patch = {};
        for (const [localKey, column] of Object.entries(LEAD_COLUMN_OF)) {
          if (updates[localKey] !== undefined) patch[column] = updates[localKey];
        }
        if (Object.keys(patch).length) practiceLeadsSync.updateRow(local.remoteUuid, patch).catch(e => syncWarn('[practice-leads-sync] update failed', e));
      }
    }
  };
  const deleteLead = (id) => {
    if (authSession && data.numericSyncVerifiedAt && !isAnyDemoMode) {
      const local = (data.practiceLeads || []).find(l => l.id === id);
      if (local && local.remoteUuid) {
        practiceLeadsSync.deleteRow(local.remoteUuid).catch(e => syncWarn('[practice-leads-sync] delete failed', e));
      }
    }
    setData(d => ({ ...d, practiceLeads: (d.practiceLeads || []).filter(l => l.id !== id) }));
  };
  const toggleModuleInterest = (moduleKey, priority) => {
    setData(d => { const current = d.moduleInterest || {}; if (priority === null || priority === undefined) { const next = {...current}; delete next[moduleKey]; return { ...d, moduleInterest: next }; } return { ...d, moduleInterest: { ...current, [moduleKey]: { signedAt: new Date().toISOString(), priority } } }; });
    // 0077 — the vote pools to module_interest so About's family aggregate is real.
    if (authSession && !isAnyDemoMode) ((priority === null || priority === undefined) ? clearModuleInterest(moduleKey) : pushModuleInterest(moduleKey, { priority })).catch(e => syncWarn('[module-interest-sync] push failed', e));
  };
  // v28+ MVP v1.5: Capex / Tools list CRUD (data lives in About > Capital Spend)
  const addCapexItem = (item) => setData(d => ({ ...d, capexItems: [...(d.capexItems || []), { ...item, id: `cx-${Date.now()}`, cost: parseFloat(item.cost) || 0, priority: parseInt(item.priority) || 3 }] }));
  const updateCapexItem = (id, updates) => setData(d => ({ ...d, capexItems: (d.capexItems || []).map(x => x.id === id ? { ...x, ...updates, cost: updates.cost !== undefined ? parseFloat(updates.cost) || 0 : x.cost, priority: updates.priority !== undefined ? parseInt(updates.priority) || 3 : x.priority } : x) }));
  const deleteCapexItem = (id) => setData(d => ({ ...d, capexItems: (d.capexItems || []).filter(x => x.id !== id) }));
  // v28+ MVP v1.5: Buffer Fund — slider-driven current balance + deliberate-edit target.
  // bufferCurrent is computed from real savings balances (bufferCurrentReal),
  // never set manually — removed the painted-slider setter (DR-0061).
  const setBufferTarget = (val) => setData(d => ({ ...d, meta: { ...d.meta, bufferTarget: parseFloat(val) || 0 } }));
  // Loop Health (Darrell 2026-06-15): the app reviews its own stagnant loops. A
  // keep/retire decision persists on data.loopDecisions; 'keep' stamps a 30-day
  // re-review date (DR-0075 — nothing parked without a why + re-review date).
  const onLoopDecision = (key, decision) => setData(d => {
    const next = { ...(d.loopDecisions || {}) };
    if (decision == null) { delete next[key]; }
    else { next[key] = { decision, at: new Date().toISOString(), reReview: decision === 'keep' ? new Date(Date.now() + 30 * 86400000).toISOString() : null }; }
    return { ...d, loopDecisions: next };
  });
  // v28+ MVP v1.5 round 5: tier switcher (also persists via setData)
  const setUserTier = (tier) => setData(d => ({ ...d, userTier: tier }));
  // Round 14 — Voice Ops config setter (Phase 1 Cloudflare Worker integration)
  const setVoiceOpsConfig = (patch) => setData(d => ({ ...d, voiceOps: { ...d.voiceOps, ...patch } }));
  // v28+ MVP v1.5 round 6: skill profile CRUD for Dev/Ops opportunity matcher
  // 0077 — skill profiles feed the opportunity matcher (doc rail).
  const skillProfilesCrud = railCrud(skillProfilesSync, 'skillProfiles', 'skill-profiles-sync');
  const addSkillProfile = (item) => { skillProfilesCrud.add({ ...item, id: `sp-${Date.now()}` }); };
  const updateSkillProfile = skillProfilesCrud.update;
  const deleteSkillProfile = skillProfilesCrud.remove;
  // v28+ MVP v1.5: Markets watchlist CRUD. Symbols are Stooq format ('spy.us', 'btcusd', '^spx').
  // v28+ MVP v1.5: Church tab CRUD — local prayer-request log
  // 0077 — prayer requests pool to the family instance so a request logged on
  // one phone is visible to the household (doc rail).
  const prayerRequestsCrud = railCrud(prayerRequestsSync, 'prayerRequests', 'prayer-requests-sync');
  const addPrayerRequest = (item) => { prayerRequestsCrud.add({ ...item, id: `pr-${Date.now()}`, createdAt: new Date().toISOString(), sentAt: null }); };
  const markPrayerRequestSent = (id) => prayerRequestsCrud.update(id, { sentAt: new Date().toISOString() });
  const deletePrayerRequest = prayerRequestsCrud.remove;
  const addWatchlistSymbol = (sym) => {
    const s = (sym || '').trim().toLowerCase();
    if (!s) return;
    setData(d => {
      const list = Array.isArray(d.watchlist) ? d.watchlist : [];
      if (list.includes(s)) return d;
      return { ...d, watchlist: [...list, s] };
    });
    // 0077 — the ticker follows the family sign-in (fail-soft; idempotent add).
    if (authSession && !isAnyDemoMode) uploadWatchlistSymbol(s).catch(e => syncWarn('[watchlist-sync] upload failed', e));
  };
  const removeWatchlistSymbol = (sym) => { setData(d => ({ ...d, watchlist: (d.watchlist || []).filter(s => s !== sym) })); if (authSession && !isAnyDemoMode) removeWatchlistSymbolRemote(sym).catch(e => syncWarn('[watchlist-sync] remove failed', e)); };
  // Life Gallery — the curated hero photos on the Big Picture page. Device-
  // local data URLs in the poe-financial-v28 snapshot. HONEST LIMIT
  // (2026-06-12): photos do NOT ride cloud sync — no table carries them yet —
  // and they are NOT safe from a phone change until the sovereign photo
  // write-path (phone → NAS) lands. This device is the only copy; the
  // per-photo export button is the interim backup.
  const addLifePhotos = (photos) => setData(d => ({ ...d, lifePhotos: [...(d.lifePhotos || []), ...photos] }));
  const updateLifePhoto = (id, updates) => setData(d => ({ ...d, lifePhotos: (d.lifePhotos || []).map(p => p.id === id ? { ...p, ...updates } : p) }));
  const deleteLifePhoto = (id) => setData(d => ({ ...d, lifePhotos: (d.lifePhotos || []).filter(p => p.id !== id) }));
  // Conference (COLG 77th National Assembly) — local-first like the rest of
  // the Church tab; merges onto the seed so partial saves never lose fields.
  const updateConference = (updates) => setData(d => ({ ...d, conference: { ...(d.conference || {}), ...updates } }));
  // Church Observation (staff-only): the room-by-room photo board for the COLG
  // building. Merges like conference so a partial write never drops spaces.
  // In-app/device-local storage now; sovereign NAS write-path is the follow-up.
  const updateChurchObservation = (updates) => setData(d => ({ ...d, churchObservation: { ...(d.churchObservation || {}), ...updates } }));
  // One Voice (Church tab) — serve notes + ideas/testimony land here,
  // persisted with the rest of the data record.
  // 0077 — One Voice notes ride the doc rail to the family instance.
  const churchVoiceCrud = railCrud(churchVoiceSync, 'churchVoice', 'church-voice-sync');
  const addChurchVoice = (entry) => { churchVoiceCrud.add(entry && entry.id ? entry : { ...entry, id: `vo-${Date.now()}` }); };
  // Church > Learn (Darrell 2026-06-15): the youth A.I. class. Progress is the
  // student's REAL record (per-module completedAt); cohort start + confirmed flag
  // are Governor-set real values that drive the computed timeline (no painted dates).
  const toggleClassModule = (moduleId) => setData(d => {
    const p = { ...(d.classProgress || {}) };
    if (p[moduleId]) delete p[moduleId]; else p[moduleId] = new Date().toISOString();
    return { ...d, classProgress: p };
  });
  const setClassCohortStart = (date) => setData(d => ({ ...d, classCohort: { ...(d.classCohort || {}), startDate: date } }));
  const confirmClassCohort = (confirmed) => setData(d => ({ ...d, classCohort: { ...(d.classCohort || {}), confirmed: !!confirmed } }));
  // The Broadcast course (Darrell 2026-06-16) — its OWN cohort, same machinery.
  const setBroadcastCohortStart = (date) => setData(d => ({ ...d, broadcastCohort: { ...(d.broadcastCohort || {}), startDate: date } }));
  const confirmBroadcastCohort = (confirmed) => setData(d => ({ ...d, broadcastCohort: { ...(d.broadcastCohort || {}), confirmed: !!confirmed } }));
  // The Infrastructure course (Darrell 2026-06-16) — its OWN cohort, same machinery.
  const setInfraCohortStart = (date) => setData(d => ({ ...d, infraCohort: { ...(d.infraCohort || {}), startDate: date } }));
  const confirmInfraCohort = (confirmed) => setData(d => ({ ...d, infraCohort: { ...(d.infraCohort || {}), confirmed: !!confirmed } }));
  // The Sovereign A.I. course (why we build local) — its OWN cohort, same machinery.
  const setSovereignAiCohortStart = (date) => setData(d => ({ ...d, sovereignAiCohort: { ...(d.sovereignAiCohort || {}), startDate: date } }));
  const confirmSovereignAiCohort = (confirmed) => setData(d => ({ ...d, sovereignAiCohort: { ...(d.sovereignAiCohort || {}), confirmed: !!confirmed } }));
  // The AI Legal Blueprint course — its OWN cohort, same machinery.
  const setAiLegalBlueprintCohortStart = (date) => setData(d => ({ ...d, aiLegalBlueprintCohort: { ...(d.aiLegalBlueprintCohort || {}), startDate: date } }));
  const confirmAiLegalBlueprintCohort = (confirmed) => setData(d => ({ ...d, aiLegalBlueprintCohort: { ...(d.aiLegalBlueprintCohort || {}), confirmed: !!confirmed } }));
  // SHARED Learn-framework state (consumed by ALL three courses): quiz results keyed
  // by module id (real assessment record), the learner's depth override, and the
  // learner's AGE BAND (the master pacing control — one curriculum, age-right delivery).
  const recordClassQuiz = (moduleId, result) => setData(d => ({ ...d, classQuiz: { ...(d.classQuiz || {}), [moduleId]: result } }));
  const setLearnLevel = (level) => setData(d => ({ ...d, learnLevel: level }));
  const setLearnAgeBand = (band) => setData(d => ({ ...d, learnAgeBand: band }));
  // Thinking Space — sovereign private notes + the in-app "tell PoeTech"
  // build inbox. Persisted with the rest of the data record (device-local;
  // never synced to a shared surface — notes are siloed by design).
  // Links kept WITH the note (Darrell 2026-06-11: titles from YouTube/any
  // link stay with the thought "for easy locating it again — to think and
  // process the implications"). Titles resolve through OUR NAS (wf22
  // link-title), so what you're reading never leaks to a third-party
  // metadata service. Offline/no-token → the hostname is the label.
  const extractNoteUrls = (text) => Array.from(new Set((String(text).match(/https?:\/\/[^\s)>\]"']{4,500}/g) || []).slice(0, 6)));
  const enrichNoteLinks = (noteId, urls) => {
    let token = '';
    try { token = (localStorage.getItem('poetech-chat-bridge-token') || '').trim(); } catch (_) { /* no-op */ }
    if (!token) return;
    urls.forEach((u) => {
      try {
        fetch(`/n8n/webhook/link-title?url=${encodeURIComponent(u)}`, { headers: { authorization: `Bearer ${token}` } })
          .then(r => r.ok ? r.json() : null)
          .then(j => {
            const o = Array.isArray(j) ? j[0] : j;
            const title = (o && o.title) ? String(o.title).slice(0, 200) : '';
            if (!title) return;
            setData(d => ({ ...d, notes: (d.notes || []).map(n => n.id === noteId ? { ...n, links: (n.links || []).map(l => l.url === u ? { ...l, title } : l) } : n) }));
          })
          .catch(() => { /* offline — hostname label stands */ });
      } catch (_) { /* same */ }
    });
  };
  const addNote = (text) => {
    const id = `nt-${Date.now()}`;
    const urls = extractNoteUrls(text);
    setData(d => ({ ...d, notes: [...(d.notes || []), { id, text, createdAt: new Date().toISOString(), pinned: false, sentToPoeTech: false, links: urls.map(u => ({ url: u, title: '' })) }] }));
    if (urls.length) enrichNoteLinks(id, urls);
  };
  // 📖 Spiritual-source flag — notes marked as sources (e.g. Yahweh Speaks
  // links) feed the spiritual module's source review. Word-senior posture:
  // sources that try to clarify Yahweh's perspectives are weighed against
  // Scripture, never the other way (THE-HOLY-SPIRIT-INTEGRATION-WORLDVIEW;
  // per-tradition weights with Bishop Gwin).
  const toggleNoteSource = (id) => setData(d => ({ ...d, notes: (d.notes || []).map(n => n.id === id ? { ...n, spiritualSource: !n.spiritualSource } : n) }));
  const updateNote = (id, text) => setData(d => ({ ...d, notes: (d.notes || []).map(n => n.id === id ? { ...n, text, updatedAt: new Date().toISOString() } : n) }));
  const deleteNote = (id) => setData(d => ({ ...d, notes: (d.notes || []).filter(n => n.id !== id) }));
  const togglePinNote = (id) => setData(d => ({ ...d, notes: (d.notes || []).map(n => n.id === id ? { ...n, pinned: !n.pinned } : n) }));
  const sendNoteToPoeTech = (text, noteId) => {
    const id = `ad-${Date.now()}`;
    setData(d => ({
      ...d,
      appDirectives: [...(d.appDirectives || []), { id, text, at: new Date().toISOString(), status: 'received' }],
      notes: noteId ? (d.notes || []).map(n => n.id === noteId ? { ...n, sentToPoeTech: true } : n) : (d.notes || []),
    }));
    // Low-hanging-fruit bucket → build pipeline (Darrell 2026-06-11: "the
    // system gets better based on the bucket filling — we have workflows for
    // 90% of that"). The missing 10% was this one connection: relay the
    // directive to the NAS thought-inbox (wf26) that feeds build sessions.
    // Fire-and-forget; offline is fine — the local record above is canonical.
    // 2026-06-12 security fix: this POST was unauthenticated and reachable by
    // any anonymous visitor on poetech.us — arbitrary public text injected
    // into the autonomous-agent inbox (wf26 → wf27). Now it only fires from a
    // device holding the bridge token, and sends it so wf26 can require
    // headerAuth. No token (anonymous/public visitor) → the local record
    // stands and nothing is relayed.
    let bridgeToken = '';
    try { bridgeToken = (localStorage.getItem('poetech-chat-bridge-token') || '').trim(); } catch (_) { /* no-op */ }
    if (!bridgeToken) return;
    try {
      fetch('/n8n/webhook/thought', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${bridgeToken}` },
        body: JSON.stringify({ text, tags: ['tell-poetech', 'poetech-app'], data: { source: 'thinking-space', directiveId: id } }),
      }).then((r) => {
        if (r.ok) setData(d => ({ ...d, appDirectives: (d.appDirectives || []).map(a => a.id === id ? { ...a, relayed: true } : a) }));
      }).catch(() => { /* offline — local record stands; relays are best-effort */ });
    } catch (_) { /* same */ }
  };

  // Single source of truth for displayed balances: the DERIVED "right now"
  // balance per account (openingBalance + cleared tx). Every cash/credit figure
  // below reads this, so an entered or imported transaction moves all of them
  // (Big Picture, Accounts, Entities) in lockstep with Tx + Forecast (DR-0076).
  const derivedBalances = useMemo(() => deriveAccountBalances(data, currentDate), [data, currentDate]);
  const totals = useMemo(() => {
    const salaryActual = data.inflows.salaries.reduce((s, x) => s + x.actual, 0);
    // v28+ Real Estate restructure: only income-producing properties feed rental math.
    // Personal / secondary / vacation homes are real estate but not rentals.
    const incomeProducingRentals = data.inflows.rentals.filter(r => (r.rent || 0) > 0);
    const rentalActual = incomeProducingRentals.reduce((s, x) => s + x.actual, 0);
    const rentalExpected = incomeProducingRentals.reduce((s, x) => s + x.rent, 0);
    const rentGap = rentalExpected - rentalActual;
    const collectionRate = rentalExpected > 0 ? (rentalActual / rentalExpected) * 100 : 0;
    const totalInflow = salaryActual + rentalActual;
    const totalOutflow = Object.values(data.outflows).reduce((s, x) => s + x, 0);
    const netCashFlow = totalInflow - totalOutflow;
    const totalConsumerDebt = data.debts.filter(d => !d.leaveAlone).reduce((s, d) => s + d.balance, 0);
    const totalRentalDebt = incomeProducingRentals.reduce((s, r) => s + (r.mortgage?.balance || 0), 0);
    const totalRentalPI = incomeProducingRentals.reduce((s, r) => s + (r.mortgage?.monthlyPI || 0), 0);
    const totalPersonalRealEstateDebt = data.inflows.rentals.filter(r => (r.rent || 0) === 0).reduce((s, r) => s + (r.mortgage?.balance || 0), 0);
    const totalPersonalRealEstatePI = data.inflows.rentals.filter(r => (r.rent || 0) === 0).reduce((s, r) => s + (r.mortgage?.monthlyPI || 0), 0);
    const totalOpportunity = data.opportunities.reduce((s, o) => s + o.monthly, 0);
    const totalOppHours = data.opportunities.reduce((s, o) => s + o.hours, 0);
    // Cash on hand — spendable balances only (checking + savings + cash + investment).
    // Excludes credit cards and loans (those are debts, not cash). Also excludes
    // accounts flagged inLegal (per Darrell 2026-05-24): those are "out of the
    // financial picture" — disputed, frozen, under probate, etc. They surface
    // in the Legal tab instead.
    const CASH_TYPES = ['checking','savings','cash','investment'];
    const allAccountsCash = (data.accounts || []).filter(a => CASH_TYPES.includes(a.type) && !a.inLegal).reduce((s, a) => s + (derivedBalances[a.id] ?? a.balance ?? 0), 0);
    return { salaryActual, rentalActual, rentalExpected, rentGap, collectionRate, totalInflow, totalOutflow, netCashFlow, totalConsumerDebt, totalRentalDebt, totalRentalPI, totalPersonalRealEstateDebt, totalPersonalRealEstatePI, totalOpportunity, totalOppHours, allAccountsCash };
  }, [data, derivedBalances]);

  // Reserves math extracted into computeReserves (app/src/lib/financial-calcs.js)
  // so Pass 2 of the financial audit can unit-test it directly. See FLAG-10
  // fix in CALC-INVENTORY.md for why incidents contribute 0 to totalMonthly.
  const reserves = useMemo(() => computeReserves(data), [data]);
  // 2026-06-15 — the buffer "current" is a REAL loop now: it reflects actual
  // savings-account balances (the reserve you actually hold), not a hand-typed
  // slider (DR-0061: a surface is a live view of real state — a painted number
  // is worse than none). Recomputes whenever a balance changes or a bank sync
  // lands; sums every savings account, excluding any in a legal hold.
  const bufferCurrentReal = useMemo(
    () => (data.accounts || []).filter(a => a.type === 'savings' && !a.inLegal).reduce((s, a) => s + (derivedBalances[a.id] ?? a.balance ?? 0), 0),
    [data.accounts, derivedBalances]
  );

  // Pressure -> real money toward debt. The discretionary lever is a % of the
  // user's REAL flexible spend (outflows.household), not a flat assumed $2000
  // (Darrell 2026-06-15: reports must be dynamic from real data). The tithe is
  // never in the cut base. See computePressure (pure + tested).
  const pressureCalc = useMemo(
    () => computePressure(data.pressureMappings[pressure], totals, data.outflows, reserves.totalMonthly),
    [pressure, totals, data.pressureMappings, data.outflows, reserves],
  );

  // Debts is a LIVE VIEW of real state (deriveDebts): credit/loan accounts (the
  // Line of Credit) + rental mortgages, not the empty hand-kept data.debts that
  // made the tab show a hollow "$0 / debt-free". Deterministic; no n8n.
  const derivedDebts = useMemo(() => deriveDebts(data, currentDate), [data, currentDate]);
  const projection = useMemo(() => projectDebt(derivedDebts, pressureCalc.extraAvailable, currentDate, 240), [derivedDebts, pressureCalc.extraAvailable, currentDate]);
  const debtSnowball = useMemo(() => projectDebtSnowball(derivedDebts, debtSnowballExtra, debtSnowballSort, currentDate, 360), [derivedDebts, debtSnowballExtra, debtSnowballSort, currentDate]);
  const debtMinOnly = useMemo(() => projectDebtMinimumOnly(derivedDebts, currentDate, 600), [derivedDebts, currentDate]);
  const rentalSnowball = useMemo(() => projectRentalSnowball(data.inflows.rentals.filter(r => (r.rent || 0) > 0), snowballExtra, snowballSort, currentDate, 240), [data.inflows.rentals, snowballExtra, snowballSort, currentDate]);
  const sevenYearTarget = useMemo(() => findExtraForTarget(data.inflows.rentals.filter(r => (r.rent || 0) > 0), 7, currentDate), [data.inflows.rentals, currentDate]);

  // Round 12 fix — Cash rollup was summing ALL account types, so credit-card
  // negative balances were dragging "Cash" deep into the red (e.g., -$57K when
  // there's actually $5-6K of spendable cash). Now:
  //   · cashBalance   = checking + savings + cash + investment only
  //   · creditBalance = credit + loan accounts (typically negative)
  //   · balance       = retained as the FULL sum for back-compat (anything that
  //                     used to read .balance still gets the old number), but
  //                     Cash UI tiles now read .cashBalance.
  // Multi-user Layer A — `visibleEntities` is data.entities filtered to ones
  // the current profile can see. If `currentProfile` is null (picker hasn't
  // run yet), default to ALL entities so the app stays usable on first launch
  // before the picker mounts. The picker triggers a re-render once a profile
  // is set.
  const visibleEntities = useMemo(() => {
    if (!currentProfile) return data.entities;
    return data.entities.filter(e => !e.visibleTo || e.visibleTo.includes(currentProfile));
  }, [data.entities, currentProfile]);
  const visibleEntityIds = useMemo(() => new Set(visibleEntities.map(e => e.id)), [visibleEntities]);

  // Per-entity rollup extracted to lib/financial-engineering (deriveEntityRollups):
  // personal-first sort, visible-entity scope, and every account decorated with
  // its DERIVED balance so Accounts/Entities/Big Picture move with the ledger.
  const entityRollups = useMemo(
    () => deriveEntityRollups(data, visibleEntities, currentDate),
    [data, visibleEntities, currentDate],
  );

  const flaggedRentals = data.inflows.rentals.filter((r) => r.status === 'late' && (r.rent || 0) > 0);
  const flaggedOpportunities = data.opportunities.filter((o) => o.flag);
  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return (data.events || []).filter(e => !e.completedAt).map(e => ({ ...e, dateTime: eventDateTime(e) })).filter(e => e.dateTime >= new Date(now.getTime() - 24*60*60000)).sort((a,b) => a.dateTime - b.dateTime);
  }, [data.events]);

  const resetToSeed = async () => { if (confirm('Reset to seed data? Edits will be lost.')) { setData(SEED_DATA); setPressure(5); } };

  // No profile, no access (Darrell 2026-06-16). On the public host a signed-out
  // visitor gets the simple create-profile / sign-in front door — never the app,
  // never sample/demo data. Private host (NAS/LAN/Tailscale) is unchanged. The
  // 'loading' state renders nothing so the form never flashes at a signed-in user
  // mid auth-check. See lib/access-gate.js (proven-to-catch test).
  // TLC CLIENT DOOR — a full, PUBLIC takeover (before the sign-in gate): a
  // prospective client opening the TLC link meets "Find your therapist" with no
  // account, no PoeTech chrome, and no path to anything operator/family. The
  // door renders ONLY public marketing facts (tlc-practice.js); there is nothing
  // here to leak. This is the sendable TLC Therapy Solutions app.
  if (tlcDoorOnly) {
    // No data-theme here: TlcPublicDoor owns the theme (its own comfort controls
    // + THEME_CSS). A second data-theme wrapper here nested two theme scopes and
    // broke color inheritance (dark text on a dark surface — a contrast failure).
    return (
      <div className="min-h-screen overflow-x-clip" style={{ fontFamily: '"DM Sans", system-ui, sans-serif' }}>
        <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300..900&family=DM+Sans:opsz,wght@9..40,300..700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
        <SectionBoundary name="TLC">
          <TlcPublicDoor />
        </SectionBoundary>
      </div>
    );
  }

  const __gate = accessState({ isPublicHostVal: isPublicHost(), authChecked, authSession });
  // The Love Corner church door is a PUBLIC community (Darrell 2026-07-14): signed-
  // out visitors SEE the church (no private family/financial data lives here) — the
  // "no profile, no access" wall is only for the private PoeTech app. Sign-in stays
  // one tap away (AuthBanner) for staff / a ride account; staff surfaces self-gate.
  if (__gate !== 'app' && !churchDoorOnly) {
    return (
      <div data-theme={theme} className="min-h-screen overflow-x-clip bg-[#FAF8F4] text-[#1A1815] flex items-start justify-center p-6 sm:p-12" style={{ fontFamily: '"DM Sans", system-ui, sans-serif' }}>
        {/* The church door wears the church, not PoeTech (DR-0174): a member
            opening ?view=church meets "The Love Corner" + the church logo on
            the sign-in gate. PoeTech's own front door passes no brand. */}
        {__gate === 'gate' ? <PasswordAuth brand={isChurchDoorContext() ? LOVE_CORNER_BRAND : null} /> : null}
      </div>
    );
  }

  return (
    // overflow-x-clip — the page must NEVER scroll horizontally. Any element wider
    // than the viewport (e.g. an overflowing sub-tab row) is clipped at the themed
    // shell instead of pushing the page wide and exposing the white <body> to the
    // right of this box (the 2026-06-18 Projects "white void" regression in dark
    // mode). `clip` (not `hidden`) leaves overflow-y visible, so the sticky header
    // and normal vertical page scroll are unaffected. This is the structural guard;
    // the root cause — tab strips that don't scroll internally — is fixed via the
    // <TabScroll> primitive so content stays REACHABLE, not just clipped away.
    <div data-theme={theme} className="min-h-screen overflow-x-clip bg-[#FAF8F4] text-[#1A1815]" style={{ fontFamily: '"DM Sans", system-ui, sans-serif', paddingTop: 'var(--lwb-h, 0px)' }}>
      {/* LIVE WORSHIP BAR — app-wide pinned live player, mounted ONCE above the
          view switch so tab changes never stop the stream. Self-gates to real
          service windows; publishes --lwb-h (read by this root's padding-top and
          the sticky header's `top`, below, so the nav pins under it). */}
      <LiveWorshipBar church={data.church} view={view} churchView={churchView} onOpenChurch={() => { setView('church'); setChurchView('home'); setChurchHomeSection(null); try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) {} }} />
      <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300..900&family=DM+Sans:opsz,wght@9..40,300..700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
      <style>{`
/* Mobile keyboard fix */
input:focus,textarea:focus,select:focus{scroll-margin-bottom:280px;scroll-margin-top:80px}
html{scroll-padding-bottom:280px}

/* Premium section title polish — Apple-refined + Samsung-bold */
.section-title-wrapper{position:relative}
.section-title-text{position:relative}

${THEME_CSS}
      `}</style>

      <div className="bg-[#1A1815] text-[#FAF8F4] text-center text-[10px] uppercase tracking-[0.2em] py-1.5 px-3 print:hidden">
        Projections, not promises · Verify with licensed professionals
      </div>

      <AuthBanner />
      {persistIssue && (
        <div className="bg-[#7A1F1F] text-[#FAF8F4] text-[12px] py-2 px-4 flex items-center justify-between gap-3 print:hidden">
          <span>⚠ {persistIssue.message}</span>
          <button onClick={() => setPersistIssue(null)} className="text-[#FAF8F4]/80 hover:text-white text-[11px] uppercase tracking-wide shrink-0">Dismiss</button>
        </div>
      )}
      {showVerifyBalances && (
        <VerifyBalances
          data={data}
          onComplete={(iso) => {
            setData(d => ({ ...d, numericSyncVerifiedAt: iso }));
            setShowVerifyBalances(false);
          }}
          onSkip={() => setShowVerifyBalances(false)}
        />
      )}

      {/* Persona picker — also serves as the first-time landing page for the
          bare poetech.us URL. Opens via:
            · ?demo=picker (explicit menu)
            · "Try another scenario" button from any demo
            · First visit with no profile saved and no demo param (front door)
          Shows working personas alongside "coming soon" tiles for the rest
          of the family sizes + stakeholder cuts, so the viewer sees both
          what's shipped and what's vision. Per Darrell 2026-05-28: the
          start position is the family financial system; this front door
          appears only on first arrival. */}
      {(isPickerMode || isFirstTimeLanding) && (
        <div role="dialog" aria-modal="true" aria-labelledby="demo-picker-h" className="fixed inset-0 z-50 bg-[#1A1815] flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-[#FAF8F4] border border-[#1A1815] max-w-3xl w-full p-6 sm:p-8 my-8">
            <div className="text-[10px] uppercase tracking-[0.3em] text-[#B85838] font-semibold mb-2">PoeTech · Family OS {isFirstTimeLanding ? '· Welcome' : '· Pick a scenario'}</div>
            <h2 id="demo-picker-h" className="text-2xl sm:text-3xl mb-2" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600, letterSpacing: '-0.02em' }}>{isFirstTimeLanding ? 'Know what to do today — for everyone in your house.' : 'Which life is closest to yours?'}</h2>
            {/* Per Option B Mars Hill progressive-disclosure
                (project-progressive-disclosure-mars-hill-engagement):
                the Family-Financial badge leads (universal stewardship
                value, foreground hierarchy); the Spiritual-Module-for-the-
                Body badge stays PRESENT (plain disclosure of what's free)
                but visually SECONDARY at first-glance (outlined, not
                filled). Anyone who looks sees both; the casual visitor's
                eye anchors on the universal-value hook first. */}
            {isFirstTimeLanding && (
              <div className="flex flex-wrap gap-1.5 mb-3 items-center">
                <span className="inline-block text-[9px] sm:text-[10px] uppercase tracking-wider text-white bg-[#5A6E3D] px-2 py-1 font-semibold">Free forever · Financial System for Families</span>
                <span className="inline-block text-[9px] sm:text-[10px] uppercase tracking-wider text-[#5A6E3D] bg-transparent border border-[#5A6E3D] px-2 py-1 font-medium">Free forever · Spiritual Module for the Body</span>
              </div>
            )}
            <p className="text-base text-[#1A1815] mb-3" style={{ fontFamily: '"Fraunces", serif' }}>{isFirstTimeLanding ? 'PoeTech is the family financial system that lifts anxiety by answering — every day, on every screen — what to do, when, why, and how.' : 'One modular framework, multiple lenses. The shipped tiles run on real data right now; the coming-soon tiles are vision for the same framework — they ship as the infrastructure does.'}</p>
            {isFirstTimeLanding && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 mb-4 text-[10px] uppercase tracking-wider text-[#5A5751]">
                <div className="p-2 border border-[#E8E4DC]"><span className="block text-[#1A1815] font-semibold mb-0.5">What</span> Today's next action</div>
                <div className="p-2 border border-[#E8E4DC]"><span className="block text-[#1A1815] font-semibold mb-0.5">When</span> Date · deadline · clock</div>
                <div className="p-2 border border-[#E8E4DC]"><span className="block text-[#1A1815] font-semibold mb-0.5">Why</span> Reason it matters</div>
                <div className="p-2 border border-[#E8E4DC]"><span className="block text-[#1A1815] font-semibold mb-0.5">How</span> Step-by-step you can follow</div>
              </div>
            )}
            <p className="text-xs text-[#5A5751] mb-4" style={{ fontFamily: '"Fraunces", serif' }}>{isFirstTimeLanding ? "Pick the life closest to yours and walk through how the system works for that family. Tap any tile — nothing saves; it's a sample." : 'Tap any to look around.'}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
              {Object.entries(DEMO_PERSONA_META).map(([key, meta]) => (
                <a key={key} href={`/?demo=${key}`} onClick={markLandingSeen} className="block p-4 border border-[#1A1815] bg-white hover:bg-[#FAF8F4] hover:border-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]">
                  <div className="flex items-baseline justify-between mb-1.5 gap-2">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-[#B85838] font-semibold">{meta.label}</div>
                    <span className="text-[8px] uppercase tracking-wider text-white bg-[#5A6E3D] px-1.5 py-0.5 whitespace-nowrap">Working sample</span>
                  </div>
                  <div className="text-sm text-[#1A1815] mb-1.5 leading-snug" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{meta.headline}</div>
                  <div className="text-[11px] text-[#5A5751] leading-snug mb-2" style={{ fontFamily: '"Fraunces", serif' }}>{meta.pitch}</div>
                  {meta.free
                    ? <span className="inline-block text-[8px] uppercase tracking-wider text-[#5A6E3D] border border-[#5A6E3D] px-1.5 py-0.5 font-semibold">Free · Family financial system</span>
                    : <span className="inline-block text-[8px] uppercase tracking-wider text-[#B85838] border border-[#B85838] px-1.5 py-0.5 font-semibold">Paid plan</span>}
                </a>
              ))}
            </div>
            {/* Coming-next staging (per Darrell "I love the cards" 2026-06-02):
                the lifecycle cards are a FEATURE, not clutter — each lets a
                visitor see their own life in the system. Working samples lead;
                the full lens set flows below as "Coming next," always visible
                (no collapse). Every card grounds in a specific real-life
                tension and shows data-as-proof resolving it. Family-financial
                lifecycle cards carry the Free tag; org/professional cards show
                the paid tier. */}
            <div className="text-[10px] uppercase tracking-[0.3em] text-[#5A5751] font-semibold mb-1 mt-5">Coming next · more lives the same system holds</div>
            <p className="text-[11px] text-[#5A5751] mb-3" style={{ fontFamily: '"Fraunces", serif' }}>Every one of these is the same framework with a different lens — they ship as the modules do. Same family OS, never another app to learn. Each one turns a recurring money tension into a shared record, so the data holds when memory fails.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
              {[
                { key: 'young-adults-launching',     free: true,  label: 'For young adults launching',        headline: 'First apartment, first paycheck, first 401(k).',          summary: "First apartment, first paycheck, first 401(k). When mom and dad help with first month's rent, the gift-or-loan question gets settled in writing. If support changes, it's logged — not 'I thought you said.'" },
                { key: 'engaged-pre-marriage',       free: true,  label: 'For engaged couples · before marriage', headline: 'Build the financial system before the vows.',          summary: "The conversation about money before the vows — clear, not awkward. Joint vs. separate logged in writing. If one stops contributing, the data shows it before resentment does. Two budgets becoming one — data as the prenup-conversation starter." },
                { key: 'empty-nesters',              free: true,  label: 'For empty nesters',                 headline: 'Last kid out, attention to retirement.',                  summary: "When grown kids ask for help, you have data, not just generosity. Here's what we gave over the years, here's the picture. Retirement runway, adult-children support logged, legacy planning — all data-driven." },
                { key: 'widowed-or-divorced-restart',free: true,  label: 'For widowed or divorced restarting',headline: 'Rebuilding the financial picture after a life change.',    summary: "You don't rebuild from memory after a loss. The system already holds the history — every shared expense, every transfer, every receipt. Estate and benefits paperwork starts with data, not 'where did I put that.'" },
                { key: 'community',   free: false, label: 'For community + school orgs',     headline: 'Kitchen-table discipline at the board table.',                 summary: 'Co-op, ministry, small-org books. Every shared cost agreed and recorded, so the board votes on numbers, not memory.' },
                { key: 'church',      free: false, label: 'For church leadership',           headline: 'Tithe in, ministry out, every dollar provable.',                summary: "The Black Church is the Body of Christ's economic exemplar - pooling capital to lift its people for 200 years, from 1787 mutual aid to colleges built on washerwomen's pennies, against a wealth gap federal policy engineered. PoeTech hands that stewardship genealogy provable books and the understanding to operate outside the mechanisms: tithes in, ministry and capex out, so the board votes on numbers, not memory. Soul first, then the family economy - the Spiritual Module for the Body is free; the congregation's stewardship books are the paid tier." },
                { key: 'lawyer',      free: false, label: 'For solo lawyers',                headline: 'Practice + trust accounting kept clean.',                     summary: 'Today: alias of Solo professional; trust-account ledger in build. Every client transfer recorded, so the trust balance is provable.' },
                { key: 'therapist',   free: false, label: 'For solo therapists',             headline: 'Practice + CEU + supervision tracked.',                       summary: 'Today: alias of Solo professional; clinical-side tier in build. CEUs and supervision hours logged as the record, not the memory.' },
              ].map(s => (
                /* Coming-next cards: same THEMED surface as the working-sample
                   tiles above (bg-white, which the theme <style> block remaps
                   per theme -- e.g. #141414 under midnight, the default), then
                   dimmed with opacity-80 + a dashed (not solid) border + a
                   muted grey label + an outlined "Vision . in build" badge so
                   they read as "not built yet" while staying legible. Fixed
                   2026-06-10: the prior bg-white/70 had NO theme override (only
                   plain .bg-white does), so under the default midnight theme it
                   stayed ~70% white over the black panel while its text got
                   remapped to light -> a near-white box with invisible text.
                   Every class here IS in the theme override map, so it renders
                   correctly in all five themes and identically before/after
                   hydration (static Tailwind, no JS-conditional styling). */
                <div key={s.key} className="block p-4 border border-dashed border-[#1A1815] bg-white opacity-80">
                  <div className="flex items-baseline justify-between mb-1.5 gap-2">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-[#5A5751] font-semibold">{s.label}</div>
                    <span className="text-[8px] uppercase tracking-wider text-[#5A5751] border border-[#E8E4DC] px-1.5 py-0.5 whitespace-nowrap">Vision · in build</span>
                  </div>
                  <div className="text-sm text-[#1A1815] mb-1 leading-snug" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{s.headline}</div>
                  <div className="text-[11px] text-[#5A5751] mb-2 leading-snug" style={{ fontFamily: '"Fraunces", serif' }}>{s.summary}</div>
                  {s.free
                    ? <span className="inline-block text-[8px] uppercase tracking-wider text-[#5A6E3D] border border-[#5A6E3D] px-1.5 py-0.5 font-semibold">Free · Family financial system</span>
                    : <span className="inline-block text-[8px] uppercase tracking-wider text-[#B85838] border border-[#B85838] px-1.5 py-0.5 font-semibold">Paid plan</span>}
                </div>
              ))}
            </div>
            <div className="bg-white border border-[#E8E4DC] p-3 text-xs text-[#5A5751] leading-relaxed" style={{ fontFamily: '"Fraunces", serif' }}>
              <strong className="text-[#1A1815]">What's coming as the infrastructure ships:</strong> anonymous in-app access to specialists (therapy, legal, property, financial) so a person can read, listen, and message on their terms before revealing their identity. Multi-household co-auth so separated co-parents share one ledger of truth across two phones. IoT integration so smart-home spend flows in automatically. Modules layer on the same foundation as they ship — never another app to learn, just the same family OS getting wider.
            </div>
            {/* Pricing glimpse strip (per Freddie audit d3733f5/4cb55b9): a
                visitor with 5 seconds should know the model — FREE entry, a
                paid ladder for multi-module needs, free programs for COLG +
                need-based. FREE labels use the working-sample green (#5A6E3D).
                "See pricing" marks the landing seen and opens the About view. */}
            <div className="border border-[#E8E4DC] bg-white px-3 py-3 mt-3 mb-1" style={{ fontFamily: '"Fraunces", serif' }}>
              <div className="text-[11px] text-[#1A1815] mb-1.5 leading-snug">
                <span className="text-[9px] uppercase tracking-wider text-white bg-[#5A6E3D] px-1.5 py-0.5 font-semibold">Free forever</span> <span className="font-semibold">Financial System for Families</span> + <span className="font-semibold">Spiritual Module for the Body</span> — no credit card.
              </div>
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[11px] text-[#1A1815]">
                <span className="text-[#5A5751]">Paid for businesses, professionals + landlords:</span>
                <span><span className="font-semibold">from $39</span> PoeTech+</span>
                <span className="text-[#5A5751]">·</span>
                <span><span className="font-semibold">$89</span> Household</span>
                <span className="text-[#5A5751]">·</span>
                <span><span className="font-semibold">$149</span> Premium</span>
                <span className="text-[#5A5751]">·</span>
                <span><span className="font-semibold">$249</span> Business</span>
              </div>
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 mt-1.5 text-[10px] text-[#5A5751]">
                <span><span className="text-[#5A6E3D] font-semibold">Free for Loved Ones</span> (COLG + chosen family)</span>
                <span>·</span>
                <span>Sponsored for families in need (aligned-brand partners, not your data)</span>
                <span>·</span>
                <button type="button" onClick={() => { markLandingSeen(); setView('about'); }} className="underline text-[#B85838] hover:text-[#1A1815] font-semibold focus:outline focus:outline-2 focus:outline-[#B85838]">See pricing →</button>
              </div>
            </div>
            {/* Drop your bank file - 2026-05-29 data-dump release Layer 1.
                Most powerful invitation on the landing: their own money in
                our lens, no signup, no commitment. Per data-dump-to-matched-
                services spec session note.
                2026-06-01: Temporarily routed to waitlist modal until
                workflows 33/34/35 (data-upload Layer 1 pipeline) deploy
                to n8n. Honest copy holds the promise — the surface invites,
                the waitlist is what's wired. Restore the upload onClick
                when wf33 lands in active list. */}
            <button type="button" onClick={() => { setWaitlistOpen(true); setWaitlistState({ submitting: false, success: false, error: null, id: null }); }} className="w-full bg-[#B85838] text-white py-3 text-center text-sm uppercase tracking-wider font-semibold hover:bg-[#1A1815] focus:outline focus:outline-2 focus:outline-[#1A1815] mt-4 mb-2">Drop your bank file → join the waitlist (real-data view ships late June)</button>
            <p className="text-[10px] text-[#5A5751] italic text-center mb-3" style={{ fontFamily: '"Fraunces", serif' }}>Browser-only file reading is in build. Sign up — we'll email when OFX, QFX, or CSV uploads go live. Your data never leaves your device.</p>
            <div className="flex gap-2 mt-4 flex-wrap">
              {/* "Start your own setup" was removed 2026-05-28 evening — the
                  real app behind it would load Darrell's SEED_DATA (real
                  entities, real accounts, real balances) until Multi-user
                  Layer B PIN auth ships. Replacing with a waitlist surface
                  that captures interest without exposing data. */}
              <button type="button" onClick={() => { setWaitlistOpen(true); setWaitlistState({ submitting: false, success: false, error: null, id: null }); }} className="flex-1 bg-[#1A1815] text-white py-3 text-center text-sm uppercase tracking-wider font-semibold hover:bg-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]">Sign up for early access</button>
              <a href="/?demo=family-of-4" onClick={markLandingSeen} className="flex-1 border border-[#1A1815] text-[#1A1815] py-3 text-center text-sm uppercase tracking-wider font-semibold hover:bg-white focus:outline focus:outline-2 focus:outline-[#B85838]">See the family sample →</a>
            </div>
          </div>
        </div>
      )}

      {/* Demo welcome modal — frames what the viewer is looking at and what
          this app is for. Persona-aware copy from DEMO_PERSONA_META. */}
      {demoWelcomeOpen && isDemoMode && (() => {
        const meta = DEMO_PERSONA_META[demoPersona] || DEMO_PERSONA_META['family-of-4'];
        return (
        <div role="dialog" aria-modal="true" aria-labelledby="demo-welcome-h" className="fixed inset-0 z-50 bg-[#1A1815] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#FAF8F4] border border-[#1A1815] max-w-lg w-full p-6 sm:p-8 my-8">
            <div className="text-[10px] uppercase tracking-[0.3em] text-[#B85838] font-semibold mb-2">PoeTech · Family OS · Sample · {meta.label}</div>
            <h2 id="demo-welcome-h" className="text-2xl sm:text-3xl mb-3" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600, letterSpacing: '-0.02em' }}>{meta.headline || 'Here\'s what providing for the people in your care looks like with the books open.'}</h2>
            <div className="text-sm leading-relaxed space-y-3 mb-5" style={{ fontFamily: '"Fraunces", serif', color: '#1A1815' }}>
              <p>{meta.pitch}</p>
              <p className="text-[#5A5751]"><strong className="text-[#1A1815]">This sample:</strong> {meta.summary} {meta.audience}</p>
              <p className="text-[#5A5751]"><strong className="text-[#1A1815]">Vision in build:</strong> {meta.vision}</p>
              <p className="text-[12px] italic text-[#5A5751]">Anxiety comes from not knowing what to do. The whole point of this is to give clarity — what, when, why, and how. With assistance and guidance, almost too much. Faith-expressed-in-works. His Will be done.</p>
            </div>
            <div className="bg-white border border-[#E8E4DC] p-3 mb-5 text-xs text-[#5A5751] leading-relaxed" style={{ fontFamily: '"Fraunces", serif' }}>
              <strong className="text-[#1A1815]">Quick tour:</strong> <span className="text-[#1A1815]">Big Picture</span> = at-a-glance health · <span className="text-[#1A1815]">Books → Accounts</span> = who has what · <span className="text-[#1A1815]">Books → Tx</span> = every transaction · <span className="text-[#1A1815]">Debts</span> = payoff snowball. Tap around — nothing saves.
            </div>
            <div className="flex gap-2 flex-wrap">
              <button type="button" onClick={() => setDemoWelcomeOpen(false)} className="flex-1 bg-[#1A1815] text-white py-3 text-sm uppercase tracking-wider font-semibold hover:bg-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]">
                Show me around
              </button>
              <a href="/?demo=picker" className="px-4 py-3 border border-[#1A1815] text-[#1A1815] text-sm uppercase tracking-wider font-semibold hover:bg-white focus:outline focus:outline-2 focus:outline-[#B85838]">Try another scenario</a>
            </div>
            <p className="text-[10px] text-[#5A5751] italic text-center mt-3" style={{ fontFamily: '"Fraunces", serif' }}>Built by a family for families — and the businesses and communities they steward.</p>
          </div>
        </div>
        );
      })()}

      {/* Waitlist signup modal — opens from the "Sign up for early access"
          button in the picker. POSTs to n8n workflow 29 which writes to
          /data/waitlist/ and pings ntfy. Per BUSINESS-PROCESS-CONNECTIONS:
          this isn't a form, it's the wired connection between marketing
          surface (picker) and intake pipeline (n8n + ntfy + Governor). */}
      {waitlistOpen && (
        <div role="dialog" aria-modal="true" aria-labelledby="waitlist-h" className="fixed inset-0 z-50 bg-[#1A1815] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#FAF8F4] border border-[#1A1815] max-w-md w-full p-6 sm:p-8 my-8">
            <div className="text-[10px] uppercase tracking-[0.3em] text-[#B85838] font-semibold mb-2">PoeTech · Family OS · Early access</div>
            {!waitlistState.success ? (
              <>
                <h2 id="waitlist-h" className="text-2xl sm:text-3xl mb-2" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600, letterSpacing: '-0.02em' }}>Tell us how to reach you when this opens up.</h2>
                <p className="text-sm text-[#5A5751] mb-4" style={{ fontFamily: '"Fraunces", serif' }}>No promises on a date — we engage based on opportunities + capacity. Your spot is held in order received. You can tell us as much or as little as you want.</p>
                <div className="space-y-3">
                  <div>
                    <label htmlFor="wl-name" className="block text-[10px] uppercase tracking-wider text-[#5A5751] mb-1">Your name</label>
                    <input id="wl-name" type="text" autoComplete="name" value={waitlistForm.name} onChange={e => setWaitlistForm({ ...waitlistForm, name: e.target.value })} className="w-full p-2.5 border border-[#1A1815] bg-white text-sm focus:outline focus:outline-2 focus:outline-[#B85838]" placeholder="First + last (or whatever feels right)" />
                  </div>
                  <div>
                    <label htmlFor="wl-email" className="block text-[10px] uppercase tracking-wider text-[#5A5751] mb-1">Email <span className="text-[#B85838]">*</span></label>
                    <input id="wl-email" type="email" autoComplete="email" required value={waitlistForm.email} onChange={e => setWaitlistForm({ ...waitlistForm, email: e.target.value })} className="w-full p-2.5 border border-[#1A1815] bg-white text-sm focus:outline focus:outline-2 focus:outline-[#B85838]" placeholder="you@email.com" />
                  </div>
                  <div>
                    <label htmlFor="wl-phone" className="block text-[10px] uppercase tracking-wider text-[#5A5751] mb-1">Phone (optional)</label>
                    <input id="wl-phone" type="tel" autoComplete="tel" value={waitlistForm.phone} onChange={e => setWaitlistForm({ ...waitlistForm, phone: e.target.value })} className="w-full p-2.5 border border-[#1A1815] bg-white text-sm focus:outline focus:outline-2 focus:outline-[#B85838]" placeholder="(217) 555-0100" />
                  </div>
                  <div>
                    <label htmlFor="wl-interest" className="block text-[10px] uppercase tracking-wider text-[#5A5751] mb-1">Which fits best?</label>
                    <select id="wl-interest" value={waitlistForm.interest} onChange={e => setWaitlistForm({ ...waitlistForm, interest: e.target.value })} className="w-full p-2.5 border border-[#1A1815] bg-white text-sm focus:outline focus:outline-2 focus:outline-[#B85838]">
                      <option value="">(pick one)</option>
                      <option value="family">My family</option>
                      <option value="co-parents">Separated co-parents</option>
                      <option value="solo-practice">Solo practice (therapist / lawyer / consultant)</option>
                      <option value="landlord">Landlord</option>
                      <option value="church">Church or ministry</option>
                      <option value="community">Community / school / co-op</option>
                      <option value="business">Business owner</option>
                      <option value="other">Other / not sure yet</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="wl-notes" className="block text-[10px] uppercase tracking-wider text-[#5A5751] mb-1">Anything you want us to know (optional)</label>
                    <textarea id="wl-notes" rows="3" value={waitlistForm.notes} onChange={e => setWaitlistForm({ ...waitlistForm, notes: e.target.value })} className="w-full p-2.5 border border-[#1A1815] bg-white text-sm focus:outline focus:outline-2 focus:outline-[#B85838]" placeholder="What problem are you hoping this solves? When could you use it?" />
                  </div>
                </div>
                {waitlistState.error && (
                  <div className="mt-3 p-3 bg-[#DC2626]/10 border border-[#DC2626] text-xs text-[#DC2626]" style={{ fontFamily: '"Fraunces", serif' }}>
                    {waitlistState.error}
                  </div>
                )}
                <div className="flex gap-2 mt-5 flex-wrap">
                  <button type="button" disabled={waitlistState.submitting} onClick={submitWaitlist} className="flex-1 bg-[#1A1815] text-white py-3 text-sm uppercase tracking-wider font-semibold hover:bg-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838] disabled:opacity-50">{waitlistState.submitting ? 'Adding you…' : 'Add me to the waitlist'}</button>
                  <button type="button" disabled={waitlistState.submitting} onClick={() => setWaitlistOpen(false)} className="px-4 py-3 border border-[#1A1815] text-[#1A1815] text-sm uppercase tracking-wider font-semibold hover:bg-white focus:outline focus:outline-2 focus:outline-[#B85838] disabled:opacity-50">Cancel</button>
                </div>
                <p className="text-[10px] text-[#5A5751] italic text-center mt-3" style={{ fontFamily: '"Fraunces", serif' }}>Your info goes to a private inbox we run on our own infrastructure. No third-party trackers. No newsletter. Just a real human reaching out when there's a fit.</p>
              </>
            ) : (
              <>
                <h2 id="waitlist-h" className="text-2xl sm:text-3xl mb-2" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600, letterSpacing: '-0.02em' }}>You're on the list.</h2>
                <p className="text-base text-[#1A1815] mb-3" style={{ fontFamily: '"Fraunces", serif' }}>Thanks, {waitlistForm.name || 'friend'}. We received your interest at {waitlistForm.email}. When opportunities + capacity line up with your scenario, a real human reaches out — usually within a couple weeks, sometimes longer. No spam in the meantime.</p>
                <p className="text-sm text-[#5A5751] mb-5" style={{ fontFamily: '"Fraunces", serif' }}>Confirmation ID: <span className="font-mono text-[10px]">{waitlistState.id || '(saved)'}</span>. If you change your mind or want to update what you told us, reply to the email we send and we'll handle it.</p>
                <div className="flex gap-2 flex-wrap">
                  <button type="button" onClick={() => { setWaitlistOpen(false); setWaitlistForm({ name: '', email: '', phone: '', interest: '', notes: '' }); }} className="flex-1 bg-[#1A1815] text-white py-3 text-sm uppercase tracking-wider font-semibold hover:bg-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]">Close</button>
                  <a href="/?demo=family-of-4" onClick={() => { setWaitlistOpen(false); markLandingSeen(); }} className="px-4 py-3 border border-[#1A1815] text-[#1A1815] text-sm uppercase tracking-wider font-semibold hover:bg-white focus:outline focus:outline-2 focus:outline-[#B85838]">See a sample while you wait</a>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {(() => {
        // Show once to a signed-in, non-family, non-demo user. Keyed only on
        // auth + email + a localStorage flag — touches no data/seed/hydration.
        const ssEmail = (authSession?.user?.email || '').toLowerCase();
        const show = !!authSession && !!ssEmail && (reviewerMode || !isFamilyEmail(ssEmail)) && !isAnyDemoMode && !selfServeWelcomeDismissed;
        return show ? <SelfServeWelcome name={ssEmail.split('@')[0]} onDismiss={dismissSelfServeWelcome} /> : null;
      })()}

      {/* Data-dump release modal — 2026-05-29. Layer 1+2+3 sequenced as a
          multi-step modal. Upload → parsed view → analytics → profile →
          matched services. Session-only state per the spec. */}
      {uploadOpen && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 bg-[#1A1815] flex items-start sm:items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-[#FAF8F4] border border-[#1A1815] max-w-2xl w-full p-5 sm:p-6 my-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[10px] uppercase tracking-[0.3em] text-[#B85838] font-semibold">PoeTech · Your money · Layer {uploadStage === 'idle' || uploadStage === 'parsing' || uploadStage === 'parsed' ? '1' : (uploadStage === 'analyzing' || uploadStage === 'profile' ? '2' : '3')} of 3</div>
              <button type="button" onClick={() => setUploadOpen(false)} aria-label="Close" className="text-[#5A5751] hover:text-[#1A1815] text-lg">×</button>
            </div>
            {uploadStage === 'idle' && (
              <>
                <h2 className="text-2xl mb-2" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>Drop your bank file.</h2>
                <p className="text-sm text-[#5A5751] mb-4" style={{ fontFamily: '"Fraunces", serif' }}>OFX, QFX, or CSV from your bank's export. We read it in your browser. Nothing saves. Gone when you close this tab.</p>
                <label className="block w-full border-2 border-dashed border-[#1A1815] p-8 text-center cursor-pointer hover:bg-white" style={{ fontFamily: '"Fraunces", serif' }}>
                  <input type="file" accept=".ofx,.qfx,.csv,.OFX,.QFX,.CSV" className="hidden" onChange={e => { const f = e.target.files && e.target.files[0]; if (f) handleUploadFile(f); }} />
                  <div className="text-sm text-[#1A1815] font-semibold uppercase tracking-wider">Click to choose a file</div>
                  <div className="text-xs text-[#5A5751] mt-1">or drag and drop coming in next ship</div>
                </label>
              </>
            )}
            {uploadStage === 'parsing' && (
              <div className="text-center py-8">
                <h2 className="text-xl mb-2" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>Reading your file…</h2>
                <p className="text-sm text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>This takes a second or two.</p>
              </div>
            )}
            {uploadStage === 'parsed' && uploadResult.summary && (
              <>
                <h2 className="text-2xl mb-2" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>Here's what we see in your money.</h2>
                <p className="text-xs text-[#5A5751] mb-3" style={{ fontFamily: '"Fraunces", serif' }}>{uploadResult.summary.transaction_count} transactions · {uploadResult.summary.date_range} · {uploadResult.format.toUpperCase()} format</p>
                <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                  <div className="bg-white border border-[#E8E4DC] p-2">
                    <div className="text-[10px] uppercase tracking-wider text-[#5A5751]">Income</div>
                    <div className="text-base font-semibold text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>${(uploadResult.summary.credits_total || 0).toFixed(0)}</div>
                  </div>
                  <div className="bg-white border border-[#E8E4DC] p-2">
                    <div className="text-[10px] uppercase tracking-wider text-[#5A5751]">Spend</div>
                    <div className="text-base font-semibold text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>${Math.abs(uploadResult.summary.debits_total || 0).toFixed(0)}</div>
                  </div>
                  <div className="bg-white border border-[#E8E4DC] p-2">
                    <div className="text-[10px] uppercase tracking-wider text-[#5A5751]">Net</div>
                    <div className={`text-base font-semibold ${(uploadResult.summary.net || 0) >= 0 ? 'text-[#1A1815]' : 'text-[#B85838]'}`} style={{ fontFamily: '"Fraunces", serif' }}>${(uploadResult.summary.net || 0).toFixed(0)}</div>
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto border border-[#E8E4DC] bg-white mb-3">
                  <table className="w-full text-xs">
                    <thead className="bg-[#FAF8F4] sticky top-0">
                      <tr><th className="text-left p-2">Date</th><th className="text-left p-2">Description</th><th className="text-right p-2">Amount</th></tr>
                    </thead>
                    <tbody>
                      {uploadResult.transactions.slice(0, 50).map((t, i) => (
                        <tr key={i} className="border-t border-[#E8E4DC]">
                          <td className="p-2 text-[#5A5751]">{t.date}</td>
                          <td className="p-2 text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>{(t.description || '').slice(0, 60)}</td>
                          <td className={`p-2 text-right font-mono ${(t.amount || 0) < 0 ? 'text-[#B85838]' : 'text-[#1A1815]'}`}>{(t.amount || 0).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {uploadResult.transactions.length > 50 && (
                    <div className="p-2 text-center text-[10px] text-[#5A5751] italic">Showing first 50 of {uploadResult.transactions.length} transactions.</div>
                  )}
                </div>
                <button type="button" onClick={runSkillAnalytics} className="w-full bg-[#1A1815] text-white py-3 text-sm uppercase tracking-wider font-semibold hover:bg-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]">What does this say about your stewardship? →</button>
              </>
            )}
            {uploadStage === 'analyzing' && (
              <div className="text-center py-8">
                <h2 className="text-xl mb-2" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>Reading your stewardship pattern…</h2>
                <p className="text-sm text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>This runs on our own AI on our own infrastructure. ~30 seconds.</p>
              </div>
            )}
            {uploadStage === 'profile' && uploadResult.profile && (
              <>
                <h2 className="text-2xl mb-3" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>Your stewardship profile.</h2>
                <p className="text-sm text-[#1A1815] mb-3" style={{ fontFamily: '"Fraunces", serif' }}>{uploadResult.profile.diagnostic_summary}</p>
                {Array.isArray(uploadResult.profile.strengths) && uploadResult.profile.strengths.length > 0 && (
                  <div className="mb-3">
                    <div className="text-[10px] uppercase tracking-wider text-[#5A5751] mb-1">Strengths</div>
                    <ul className="text-sm text-[#1A1815] space-y-1" style={{ fontFamily: '"Fraunces", serif' }}>
                      {uploadResult.profile.strengths.map((s, i) => <li key={i}>· {s}</li>)}
                    </ul>
                  </div>
                )}
                {Array.isArray(uploadResult.profile.gaps_to_consider) && uploadResult.profile.gaps_to_consider.length > 0 && (
                  <div className="mb-4">
                    <div className="text-[10px] uppercase tracking-wider text-[#5A5751] mb-1">Worth considering</div>
                    <ul className="text-sm text-[#1A1815] space-y-1" style={{ fontFamily: '"Fraunces", serif' }}>
                      {uploadResult.profile.gaps_to_consider.map((g, i) => <li key={i}>· {g}</li>)}
                    </ul>
                  </div>
                )}
                <button type="button" onClick={runMatchedServices} className="w-full bg-[#1A1815] text-white py-3 text-sm uppercase tracking-wider font-semibold hover:bg-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]">Which services would actually help you most? →</button>
              </>
            )}
            {uploadStage === 'matching' && (
              <div className="text-center py-8">
                <h2 className="text-xl mb-2" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>Matching services to your pattern…</h2>
              </div>
            )}
            {uploadStage === 'matched' && (
              <>
                <h2 className="text-2xl mb-3" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>Services that fit your pattern.</h2>
                {uploadResult.matches.length === 0 ? (
                  <p className="text-sm text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>No close matches yet from our current catalog. Get on the general waitlist and we'll reach out when something fits.</p>
                ) : (
                  <div className="space-y-3">
                    {uploadResult.matches.map((m, i) => (
                      <div key={i} className="border border-[#E8E4DC] bg-white p-3">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="text-base font-semibold text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>{m.service.name}</div>
                          <div className="text-[10px] uppercase tracking-wider text-[#B85838] font-semibold whitespace-nowrap">fit {m.fit_score}/100</div>
                        </div>
                        <div className="text-xs text-[#5A5751] mb-2 italic" style={{ fontFamily: '"Fraunces", serif' }}>{m.fit_reason}</div>
                        <div className="text-xs text-[#1A1815] mb-1" style={{ fontFamily: '"Fraunces", serif' }}><strong>For:</strong> {m.service.audience}</div>
                        <div className="text-xs text-[#1A1815] mb-1" style={{ fontFamily: '"Fraunces", serif' }}><strong>Timeline:</strong> {m.service.timeline}</div>
                        <div className="text-xs text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>{m.service.promise}</div>
                      </div>
                    ))}
                  </div>
                )}
                <button type="button" onClick={() => { setUploadOpen(false); setWaitlistOpen(true); }} className="w-full mt-4 bg-[#B85838] text-white py-3 text-sm uppercase tracking-wider font-semibold hover:bg-[#1A1815] focus:outline focus:outline-2 focus:outline-[#1A1815]">Get on a waitlist →</button>
              </>
            )}
            {uploadStage === 'error' && (
              <>
                <h2 className="text-xl mb-2 text-[#B85838]" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>Something went wrong.</h2>
                <p className="text-sm text-[#1A1815] mb-3" style={{ fontFamily: '"Fraunces", serif' }}>{uploadResult.error}</p>
                <button type="button" onClick={resetUpload} className="w-full bg-[#1A1815] text-white py-3 text-sm uppercase tracking-wider font-semibold hover:bg-[#B85838]">Try again</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Demo banner — thin strip across the top whenever in demo mode (not
          picker). Stays visible the whole session. CTAs: switch persona, see
          welcome modal again, or start your own. */}
      {isDemoMode && !demoWelcomeOpen && !headerCollapsed && (
        <div className="bg-[#B85838] text-white text-xs px-3 py-2 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="uppercase tracking-[0.2em] font-semibold">Sample · {DEMO_PERSONA_META[demoPersona]?.label || 'Family of 4'}</span>
            <span className="opacity-90 hidden sm:inline" style={{ fontFamily: '"Fraunces", serif' }}>Nothing saves.</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button type="button" onClick={() => setDemoWelcomeOpen(true)} className="text-[10px] uppercase tracking-wider px-2 py-1 border border-white/40 hover:bg-white hover:text-[#B85838] focus:outline focus:outline-2 focus:outline-white">What is this?</button>
            <a href="/?demo=picker" className="text-[10px] uppercase tracking-wider px-2 py-1 border border-white/40 hover:bg-white hover:text-[#B85838] focus:outline focus:outline-2 focus:outline-white">Try another lens</a>
            <a href="/" className="text-[10px] uppercase tracking-wider px-2 py-1 bg-white text-[#B85838] hover:bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-white font-semibold">Start your own →</a>
          </div>
        </div>
      )}

      {/* Reviewer strip — always visible while the steward reviews as a user
          (never collapse-gated: with Admin hidden, Exit is the only way back). */}
      {reviewerMode && <ReviewerModeBanner />}

      {/* Multi-user Layer A — profile picker overlay. Shows on first launch
          (currentProfile === null) and via the "switch profile" button in the
          header. Blocks the whole UI so the user MUST pick before seeing data;
          TLC firewall depends on this gate, so it can't be dismissed without
          choosing. */}
      {/* Admin is a navigation aid (NAS URLs only — no family data), so it
          bypasses the profile-picker gate: the deep-link poetech.us/?view=admin
          must land straight on the panel, not behind a "who's using this device"
          modal. The TLC-firewall data gate is unaffected for every data view. */}
      {/* Multi-point auth — PIN gate (P3). Sits ABOVE the profile picker (z-60)
          so a signed-in user clears their PIN before anything else. SET mode for
          a new user/device (the second point), ENTER mode when a PIN exists.
          Only shown when mpEnforce is true (signed-in, public host, hydrated);
          degrades away entirely if the backend is unavailable (no-lockout). */}
      {showPinGate && (
        <PinGate
          mode={accessDecision.nextStep === NEXT_STEP.SET_PIN ? 'set' : 'enter'}
          title={accessDecision.nextStep === NEXT_STEP.SET_PIN ? 'Secure your space' : 'Welcome back'}
          subtitle={accessDecision.nextStep === NEXT_STEP.SET_PIN
            ? 'One more step: choose a 4–8 digit PIN. It’s your second key — used with your email sign-in or this trusted device.'
            : (mpHasBiometric
              ? 'Use your fingerprint / Face to unlock — or enter your PIN.'
              : 'Enter your PIN to unlock your space.')}
          submitLabel={accessDecision.nextStep === NEXT_STEP.SET_PIN ? 'Set PIN & continue' : 'Unlock'}
          onSubmit={accessDecision.nextStep === NEXT_STEP.SET_PIN ? handleSetPin : handleEnterPin}
          onForgot={accessDecision.nextStep !== NEXT_STEP.SET_PIN ? handleForgotPin : undefined}
          onBiometric={mpHasBiometric ? handleBiometricUnlock : undefined}
        />
      )}

      {/* Post-grant offer: enable fingerprint / Face on this device (opt-in,
          shown once). Enrollment only runs on the explicit tap; the biometric
          never leaves the device. */}
      {bioOfferOpen && authSession && (
        <div role="dialog" aria-modal="true" aria-labelledby="bio-offer-h"
          className="fixed inset-0 z-[60] bg-[#1A1815]/95 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[#FAF8F4] border border-[#1A1815] max-w-sm w-full p-5 sm:p-6">
            <div className="text-[10px] uppercase tracking-[0.3em] text-[#B85838] font-semibold mb-2">PoeTech · Faster sign-in</div>
            <h2 id="bio-offer-h" className="text-xl sm:text-2xl mb-2" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600, letterSpacing: '-0.02em' }}>Unlock with your fingerprint or face?</h2>
            <p className="text-sm text-[#5A5751] mb-4" style={{ fontFamily: '"Fraunces", serif' }}>
              On this device you can skip the PIN next time and just use your fingerprint or face. It stays on this device — we never see or store it. Your PIN still works any time.
            </p>
            <button type="button" onClick={handleEnrollBiometric}
              className="w-full bg-[#1A1815] text-white py-2.5 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838] mb-2">
              Enable fingerprint / Face
            </button>
            <button type="button" onClick={dismissBiometricOffer}
              className="w-full py-2 text-[11px] underline text-[#5A5751] hover:text-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]">
              Not now — keep using my PIN
            </button>
          </div>
        </div>
      )}

      {/* Family shared-device persona gate — verify the selected person's PIN. */}
      {pendingPersona && mpInstanceId && (
        <PinGate
          mode="enter"
          title={`${PROFILES.find(x => x.id === pendingPersona)?.name || 'This profile'}’s PIN`}
          subtitle="This profile is protected. Enter the PIN to switch to it."
          submitLabel="Switch"
          onSubmit={async (pin) => {
            const r = await verifyPersonaPin(mpInstanceId, pendingPersona, pin);
            if (r.ok) { setProfile(pendingPersona); setPendingPersona(null); }
            return r;
          }}
          onCancel={() => setPendingPersona(null)}
        />
      )}

      {/* Security → Change PIN (set a new PIN; always allowed for the signed-in
          user — this is also the no-lockout recovery once re-authenticated). */}
      {changePinOpen && authSession && (
        <PinGate
          mode="set"
          title="Change your PIN"
          subtitle="Choose a new 4–8 digit PIN. It replaces your current one everywhere."
          submitLabel="Save new PIN"
          onSubmit={async (pin) => {
            const r = await setUserPin(pin);
            if (r.ok) { setMpHasPin(true); markPinVerified(); setChangePinOpen(false); }
            return r;
          }}
          onCancel={() => setChangePinOpen(false)}
        />
      )}

      {!currentProfile && !isAnyDemoMode && !isFirstTimeLanding && view !== 'admin' && (
        <div role="dialog" aria-modal="true" aria-labelledby="profile-picker-h" className="fixed inset-0 z-50 bg-[#1A1815] flex items-center justify-center p-4">
          <div className="bg-[#FAF8F4] border border-[#1A1815] max-w-md w-full p-6 sm:p-8">
            <div className="text-[10px] uppercase tracking-[0.3em] text-[#B85838] font-semibold mb-2">PoeTech · Family OS</div>
            <h2 id="profile-picker-h" className="text-2xl sm:text-3xl mb-1" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600, letterSpacing: '-0.02em' }}>Who's using this device?</h2>
            <p className="text-sm text-[#5A5751] mb-6" style={{ fontFamily: '"Fraunces", serif' }}>Pick a profile to see the views meant for you. The practice stays private to its owner; business entities stay with the principal. You can switch any time from the header.</p>
            <div className="space-y-2">
              {PROFILES.map(p => (
                <button key={p.id} type="button" onClick={() => handlePersonaSelect(p)} className="w-full p-4 text-left border border-[#1A1815] hover:bg-white hover:border-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838] transition-colors flex items-baseline justify-between gap-3">
                  <div>
                    <div className="text-lg" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{p.name}</div>
                    <div className="text-[11px] uppercase tracking-wider text-[#5A5751]">{p.sub}</div>
                  </div>
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.accent }} aria-hidden="true" />
                </button>
              ))}
            </div>
            <p className="text-[10px] text-[#5A5751] italic mt-4" style={{ fontFamily: '"Fraunces", serif' }}>Layer A · UX privacy. Layer B (sovereign PIN auth via workflow 21) ships separately. See vacation runbook.</p>
          </div>
        </div>
      )}

      {/* First-run roadmap tour — a discrete bottom card offering the "what is
          this app" walkthrough, dismissible and remembered per device. Self-
          positions (fixed); placed once near the app root. */}
      <HelpWalkthrough setView={setView} setChurchView={setChurchView} setBooksView={setBooksView} />

      <header className="border-b border-[#1A1815] bg-[#FAF8F4] sticky z-20 print:hidden" style={{ top: 'var(--lwb-h, 0px)' }}>
        {/* Header vertical padding is CHROME: pinned to fixed px so it does not
            scale with the root multiplier (text-size scope split) — keeps the bar
            from growing taller and pushing content down at larger sizes. */}
        {/* HEADER HIDEAWAY: this whole top block (title, date/time, build line,
            account/subscribe row, voice + font controls, theme swatches) hides
            when collapsed; only the <nav> tab row below stays pinned. */}
        {!headerCollapsed && (
        <div className="w-full px-3 sm:px-6 lg:px-8 py-[12px] sm:py-[16px]">
          {/* Round 14 fix — Title row stacks BELOW the controls on small/medium
              screens so the tier-preview dropdown and Subscribe/Feedback buttons
              can't crowd "Family Operating Systems." Side-by-side only on large
              screens where there's actually room. */}
          <div className="flex flex-col-reverse lg:flex-row lg:items-baseline lg:justify-between gap-2 sm:gap-3">
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-[0.3em] text-[#B85838] mb-1 font-semibold">PoeTech · Life, Soul & Money <span className="text-[8px] tracking-[0.15em] text-[#5A5751] ml-2 sm:hidden inline-flex items-center gap-1.5" title={`Build time: ${typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : 'unknown'}`} style={{ fontFamily: '"JetBrains Mono", monospace' }}>build {typeof __BUILD_SHA__ !== 'undefined' ? __BUILD_SHA__ : '????'}<FreshnessDot compact /></span></div>
              {/* Display title is CHROME: .ts-chrome-region caps it (font + box) via
                  zoom so it stays roughly fixed while body content scales fully
                  (text-size scope split, 2026-06-17). */}
              {/* The name NEVER cuts off mid-word (Darrell 2026-07-06). It shows
                  the full "Family Operating Systems" where the title has its own
                  full-width row (sm–md, stacked); on the crowded side-by-side row
                  (lg+, where the controls leave no room) and on the tiniest phones
                  (<sm) it falls back to the clean brand "PoeTech" — an ellipsis
                  cut is never acceptable. */}
              <h1 className="ts-chrome-region text-2xl sm:text-3xl leading-none whitespace-nowrap" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600, letterSpacing: '-0.02em' }}>
                {/* In the church view the header wears the church, not PoeTech
                    (DR-0174 — "it looks like the PoeTech App... why?"). */}
                <span className="hidden sm:inline lg:hidden">{view === 'church' ? 'The Love Corner' : 'Family Operating Systems'}</span>
                <span className="sm:hidden lg:inline">{view === 'church' ? 'The Love Corner' : 'PoeTech'}</span>
              </h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap lg:flex-nowrap lg:shrink-0 justify-end">
              {/* Round 5 — Tier indicator + dev-only switcher. Round 7 fix:
                  Replaced native <details> (which doesn't auto-close on outside
                  click and felt broken) with a controlled dropdown that closes
                  on selection and clicks outside, with a brief flash on change. */}
              <TierSwitcher userTier={data.userTier} setUserTier={setUserTier} />
              {/* 2026-06-14 — the profile switcher is the family device-sharing
                  control; it is hidden for a self-serve ('self') user, who has
                  only their own identity. Clicking it would setProfile(null)
                  and re-trap them at the Poe-family picker (the load effect
                  won't re-fire to restore 'self'). */}
              {currentProfile && currentProfile !== 'self' && (() => {
                const p = PROFILES.find(x => x.id === currentProfile);
                return (
                  <button type="button" onClick={() => setProfile(null)} title={`Currently viewing as ${p?.name || currentProfile}. Tap to switch profile.`} aria-label={`Switch profile (currently ${p?.name || currentProfile})`} className="text-[10px] uppercase tracking-wider px-2 py-1.5 border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white font-semibold whitespace-nowrap flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p?.accent || '#1A1815' }} aria-hidden="true" />
                    {p?.name || currentProfile}
                  </button>
                );
              })()}
              <button type="button" onClick={() => { setView('about'); try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) {} }} className="text-[10px] uppercase tracking-wider px-2 py-1.5 bg-[#1A1815] text-white border border-[#1A1815] hover:bg-[#B85838] hover:border-[#B85838] font-semibold whitespace-nowrap" title="See plans & subscribe">
                💳 Subscribe
              </button>
              {/* Install-the-app, on every tab (Darrell 2026-07-10: "add it to
                  the space that is on each tab top space"). One tap fires the
                  browser's native install when available; otherwise it opens
                  this phone's exact steps. Hides itself once installed. */}
              <InstallAppButton />
              {/* Header feedback button removed — replaced by the persistent floating 💬 button bottom-left.
                  Single entry point keeps the header roomy and the loop unambiguous. */}
              {/* Contextual HELP — the discrete "?" Darrell asked for: tap it on any
                  tab and Ari explains THAT surface (what / how / why), plus the user
                  roadmap. Context-aware: it reads the live view/sub-view, so one
                  button covers every tab with no per-tab wiring. Sits with the other
                  "make this comfortable to understand" controls. */}
              <HelpButton
                variant="header"
                view={view}
                churchView={churchView}
                booksView={booksView}
                setView={setView}
                setChurchView={setChurchView}
                setBooksView={setBooksView}
              />
              {/* Large-print control (WCAG 1.4.4). Sits beside the theme swatches —
                  the two "make this comfortable to look at" controls live together.
                  Scales the whole app from one place; choice saved per device. */}
              <TextSizeControl variant="header" />
              {/* Reading-voice picker (HEAR half): pick once, every page reads in it.
                  Lives beside text size — the two "make this comfortable" controls
                  together. Saved to the account so it follows the user to any device. */}
              <ReadingVoiceControl variant="header" isOwner={isFamilyMember} />
              <div className="flex gap-1 items-center" role="group" aria-label="Theme selector">
                {[
                  // White and Slate take design inspiration from the two phone
                  // ecosystems most users come from — so the app feels familiar
                  // on whichever phone opens it. No brand names used.
                  { key: 'white',    color: '#F5F5F7', border: '#1D1D1F', label: 'Snow · clean light' },
                  { key: 'slate',    color: '#F2F4F7', border: '#1F6FEB', label: 'Glacier · cool light' },
                  { key: 'sapphire', color: '#EFF6FF', border: '#1E3A8A', label: 'Sapphire' },
                  { key: 'rose',     color: '#FDF2F8', border: '#831843', label: 'Rose' },
                  { key: 'midnight', color: '#000000', border: '#888888', label: 'Midnight · OLED black' },
                ].map(t => (
                  <button key={t.key} type="button" onClick={() => setTheme(t.key)} aria-label={`${t.label} theme${theme === t.key ? ' (currently selected)' : ''}`} title={t.label} className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full transition-all focus:outline focus:outline-2 focus:outline-[#B85838] ${theme === t.key ? 'ring-2 ring-[#B85838] ring-offset-1 scale-110' : 'opacity-70 hover:opacity-100 hover:scale-105'}`} style={{ backgroundColor: t.color, border: `1.5px solid ${t.border}` }}></button>
                ))}
              </div>
              <div className="text-[9px] uppercase tracking-[0.2em] text-[#5A5751] text-right hidden sm:block">
                <div className="font-medium">{data.meta.releaseLabel || `v${data.meta.appVersion}`}</div>
                <div title="Today's date">{headerDateLabel}{headerTimeLabel ? <span className="text-[#B85838]"> · {headerTimeLabel}</span> : null}</div>
                {/* 2026-05-28 — Build marker so the user can verify at a glance
                    whether the phone is on the latest deploy. iOS Safari has
                    bitten us with stale HTML caching; this is the smoke-test
                    surface. SHA comes from Vercel's VERCEL_GIT_COMMIT_SHA at
                    build time (vite.config.js define block). */}
                <div className="text-[#B85838] mt-0.5 inline-flex items-center gap-1.5" title={`Build time: ${typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : 'unknown'}`} style={{ fontFamily: '"JetBrains Mono", monospace' }}>build {typeof __BUILD_SHA__ !== 'undefined' ? __BUILD_SHA__ : '????'}<FreshnessDot /></div>
              </div>
            </div>
          </div>
        </div>
        )}
        <nav className="border-t border-[#E8E4DC]">
          {/* v28+ MVP v1.5 — Nav reordered (round 3): primary financial tabs
              first, About anchors the right side of the primary group, then a
              visible vertical divider separates the secondary "life" tabs
              (Church + Markets) which live to the far right. */}
          {/* THE reference tab row Darrell loves ("easy and fluid," "classy").
              Routed through the shared <TabScroll> primitive so every other tab
              strip in the app inherits this exact right-to-left scroll feel.
              `chrome` = .ts-chrome-region caps the whole row (tab font + padding)
              via zoom so the menu stays roughly fixed while body content scales
              (text-size scope split). Holds only rem tabs — no fixed-px control
              lives here, so nothing already-fixed is shrunk. */}
          {/* Browser-like Back/Forward, pinned left of the tab row so it never
              scrolls away. Real window.history nav (lib/nav-history.js): Back
              returns to the exact prior view/sub-view across every tab. */}
          {/* THE reference tab row Darrell loves ("easy and fluid," "classy") —
              ONE flat row of every top-level surface, routed through the shared
              <TabScroll> primitive (horizontal scroll reaches every tab). A 6-area
              cluster nav was tried (#381) and reverted 2026-06-26: grouping the
              familiar tabs behind areas read as "lost the tabs" on the live app.
              The anti-sprawl goal stands, but the regrouping must be visually
              obvious before it ships again — until then, every surface is one tap. */}
          <div className="flex items-stretch">
            <div className="pl-1 sm:pl-6 lg:pl-8 flex items-stretch">
              <NavControls chrome {...navHistory} />
            </div>
            <TabScroll chrome className="pr-1 sm:pr-6 lg:pr-8 min-w-0 flex-1" rowClassName="sm:text-sm items-stretch">
              {[
                ['overview','Big Picture'],
                ['books','Books'],
                ['inbound', <><UiIcon name="phone" /> Inbound</>],
                ['rentals','Real Estate'],
                ['projects','Projects'],
                // TLC — the unified TLC Therapy Solutions office. Operators
                // (family/Governor or a business-tier account) get ONE entry that
                // holds all three TLC surfaces (Practice, Intake, Assistant) as
                // sub-tabs; a plain premium user still reaches standalone Practice.
                // The individual routes stay valid for deep-links either way.
                ...((isFamilyMember || tierMeets(data.userTier, 'business'))
                  ? [['tlc', <><UiIcon name="heart" /> TLC</>]]
                  : [['practice','Practice']]),
                ['opportunities','Dev/Ops'],
                ['about','About'],
                ['__sep__', null],
                ['notes', <><UiIcon name="dove" /> Notes</>],
                // Create — the document / image creation workspace (Notes group:
                // capture (Notes) -> reflect (Study) -> compose/produce (Create)).
                // Available to every signed-in user; persistence is instance-scoped.
                ['create', <><UiIcon name="palette" /> Create</>],
                // Voice — "listen to anything" in a chosen voice; consent-gated
                // personal (cloned) voices as a subscriber feature. Notes group
                // sibling (capture -> reflect -> compose -> hear).
                ['voice', <><UiIcon name="volume" /> Voice</>],
                // Library — books assembled from the house's own corpus, with an
                // in-app reader whose chapters deep-link back into the live app
                // (the books<->app flywheel). Reading is open to every signed-in
                // user; the build Studio is family/Governor-gated inside.
                ['library', <><UiIcon name="bookOpen" /> Library</>],
                // Chef's Corner — the recipe surface (starts with the Poe Family
                // Vegan Recipes by Chef Mario). Open to every signed-in user;
                // persistence is instance-scoped (family-private).
                ['recipes', <><UiIcon name="chefHat" /> Chef's Corner</>],
                // Games — the family games hub ("our games"). Open to everyone
                // (the children most of all); the first game walks an African
                // American life journey, measured by Yahweh. Persistence is
                // instance-scoped and local-first.
                ['games', <><UiIcon name="dice" /> Games</>],
                // TV Time — the friend-group show tracker + discussion (Darrell
                // 2026-07-04). Open to everyone; a PWA-native home for the circle
                // when their old app shut down. Local-first, private to the device.
                ['tvtime', <><UiIcon name="monitor" /> TV Time</>],
                // Darrell's Study — private to the circle (Darrell/Christina/BG).
                // Spread so the entry is absent from the DOM entirely for everyone
                // else (no-leak); the feedback-area-guard still sees the literal
                // pair below and requires its 'study' feedback area.
                ...(isStudyCircle ? [['study', <><UiIcon name="book" /> Study</>]] : []),
                ['church','Church'],
                ['markets','Markets'],
                // Command, Control & Serve Center — the steward's seat (the
                // cockpit from which the app is built + observed). Family/Governor
                // only; spread so the entry is absent from the DOM entirely for
                // everyone else (no-leak), like Study. The component carries a
                // defense-in-depth locked fallback for any deep-link.
                ...(isFamilyMember ? [['center', <><UiIcon name="sliders" /> Center</>]] : []),
                // CRM — the one shared acquisition backbone every funnel rides.
                // Family/Governor only (steward tooling across all businesses);
                // spread so the entry is absent from the DOM for everyone else.
                ...(isFamilyMember ? [['crm', <><UiIcon name="users" /> CRM</>]] : []),
                // Relationships — the relationship permission model (guardian<->
                // child, family, landlord<->tenant/manager). Family/Governor AND
                // the Business tier (Darrell 2026-07-08, DR-0128: the delegation
                // matrix IS a business feature; RLS keeps the boundary). No-leak.
                ...((isFamilyMember || tierMeets(data.userTier, 'business')) ? [['relationships', <><UiIcon name="users" /> Relationships</>]] : []),
                // Inventory — a real inventory-control system of record (derived
                // on-hand over an immutable movement ledger). Family/Governor only
                // (operations tooling); spread so the entry is absent from the DOM
                // for everyone else, like Center / CRM.
                ...(isFamilyMember ? [['inventory', <><UiIcon name="tools" /> Inventory</>]] : []),
                // Moore Divahs — Shay's fashion business system (DR-0113 board;
                // discovery 2026-07-07). The steward door: orders + the 3-week
                // clock + change-order ladder. Family/Governor only for now (the
                // customer-facing door ships separately as the branded /moore
                // boot); spread so the entry is absent from the DOM for everyone
                // else (no-leak), like Center / CRM.
                ...(isFamilyMember ? [['moore', <><UiIcon name="palette" /> Moore Divahs</>]] : []),
                // Forecast — the financial-engineering / forward-projection layer.
                // Family/Governor only (it models the family's real money); spread
                // so the entry is absent from the DOM for everyone else (no-leak),
                // and the component carries a locked fallback for any deep-link.
                ...(isFamilyMember ? [['forecast', <><UiIcon name="chart" /> Forecast</>]] : []),
                // Academy — the PoeTech Academy. Open to everyone as a parent-facing
                // INVITE (the value/ROI pitch + register-interest): prospective
                // families must be able to see it to decide. The operations CONSOLE
                // inside (enroll, tuition, team, week-4 retro) stays operator-gated —
                // the component renders the invite for non-operators and the console
                // only for family/Governor or a business-tier operator.
                ['cohorts', <><UiIcon name="bookOpen" /> Academy</>],
                // Assistant is folded into the unified TLC workspace (above) as a
                // sub-tab — no standalone top-nav entry. The 'tlc-assistant' route
                // stays valid for deep-links; the render block below still serves it.
                // Admin — the real backend control surface. Shown to family
                // stewards, and on the trusted NAS/home host (where being on the
                // family network is itself the access control) — the SAME gate the
                // render below applies, so the tab and the surface never disagree.
                // On the public site a non-steward never gets the entry (no-leak,
                // like Center / Forecast); the module also carries a defense-in-
                // depth locked fallback for any deep-link.
                ...((!reviewerMode && (isFamilyMember || !isPublicHost())) ? [['admin', <><UiIcon name="lock" /> Admin</>]] : []),
              ].filter(([id]) => !churchDoorOnly || id === 'church')
               .map(([id, label]) => {
                if (id === '__sep__') {
                  return <span key="sep" aria-hidden="true" className="self-center mx-1 sm:mx-3 h-5 border-l border-[#1A1815] opacity-40" />;
                }
                return (
                  <button key={id} onClick={() => setView(id)} className={`px-2.5 sm:px-3 py-2.5 whitespace-nowrap border-b-2 transition-colors focus:outline focus:outline-2 focus:outline-[#B85838] ${view === id ? 'border-[#B85838] text-[#1A1815] font-medium' : 'border-transparent text-[#5A5751] hover:text-[#1A1815]'}`}>{label}</button>
                );
              })}
            </TabScroll>
            {/* HEADER HIDEAWAY toggle — pinned to the right of the tab row so it
                is ALWAYS visible (it never scrolls with the tabs and it is the
                one control that survives a collapse). One tap hides the whole top
                chrome (date/time, build line, account/subscribe row, voice + font
                controls, theme swatches, Sample banner) for max dashboard room;
                one tap brings it all back. The chevron points UP to "tuck away"
                and DOWN to "bring back." Preference persists per device. The
                color is a chrome token (#5A5751 -> 5.9:1 on the bar, remapped to
                #888888 on midnight) and the icon inherits it via currentColor, so
                it stays WCAG-legible in every theme. */}
            <button
              type="button"
              onClick={toggleHeaderChrome}
              aria-expanded={!headerCollapsed}
              aria-label={headerCollapsed ? 'Show the full header (date, account, voice, font, theme controls)' : 'Hide the top bar — keep only the tabs for more room'}
              title={headerCollapsed ? 'Show the full header' : 'Hide the top bar (keep tabs)'}
              className="shrink-0 self-stretch px-2.5 sm:px-3 flex items-center justify-center border-l border-[#E8E4DC] text-[#5A5751] hover:text-[#1A1815] hover:bg-[#E8E4DC] focus:outline focus:outline-2 focus:outline-[#B85838]"
            >
              <UiIcon name={headerCollapsed ? 'chevronDown' : 'chevronUp'} className="text-base" />
              <span className="sr-only">{headerCollapsed ? 'Show header' : 'Hide header'}</span>
            </button>
          </div>
        </nav>
        {view === 'books' && (
          <div className="border-t border-[#E8E4DC] bg-white">
            {/* Books sub-nav routes through the shared <TabScroll> primitive
                (same fluid scroll as the main nav). `chrome` = .ts-chrome-region
                caps the row via zoom while body text scales. */}
            <TabScroll chrome className="px-1 sm:px-6 lg:px-8">
                {[['entities','Entities'],['accounts','Accounts'],['debts','Debts'],['transactions','Tx'],['imported','Imported'],['cart','Cart'],['k1099','1099s'],['calendar','Calendar'],['legal', <><UiIcon name="lock" /> Legal</>]].filter(([id]) => !(id === 'imported' && !importedAllowed)).map(([id, label]) => (
                  <button key={id} onClick={() => setBooksView(id)} className={`px-2.5 sm:px-3 py-2 whitespace-nowrap border-b-2 transition-colors ${booksView === id ? 'border-[#1A1815] text-[#1A1815] font-medium' : 'border-transparent text-[#5A5751] hover:text-[#1A1815]'}`}>{label}</button>
                ))}
            </TabScroll>
          </div>
        )}
        {view === 'church' && (
          <div className="border-t border-[#E8E4DC] bg-white">
            {/* Church sub-nav routes through the shared <TabScroll> primitive
                (same fluid scroll as the main nav). `chrome` = .ts-chrome-region
                caps the row via zoom while body text scales. */}
            <TabScroll chrome className="px-1 sm:px-6 lg:px-8">
                {[['home','Church'],['pulpit', <><UiIcon name="bookOpen" /> The Word</>],['engagement','Engagement'],['choir','Choir'],['bus', <><UiIcon name="users" /> Bus Ministry</>],['program', <><UiIcon name="bookOpen" /> Order of Service</>],['learn','Learn'],['eternal-algorithms', <><UiIcon name="sparkle" /> Eternal Algorithms</>],['conference','Conference'],['events','Venues'],['projects', <><UiIcon name="sliders" /> Projects</>],['scripture', <><UiIcon name="book" /> Scripture</>], ...(isChurchStaff ? [['harvest', <><UiIcon name="sparkle" /> Harvest</>],['videowall', <><UiIcon name="monitor" /> Video Wall</>],['devices', <><UiIcon name="tools" /> Devices</>],['infra-plan', <><UiIcon name="sliders" /> Infra Plan</>],['observe', <><UiIcon name="lock" /> Observation</>]] : [])].map(([id, label]) => (
                  <button key={id} onClick={() => setChurchView(id)} className={`px-2.5 sm:px-3 py-2 whitespace-nowrap border-b-2 transition-colors focus:outline focus:outline-2 focus:outline-[#B85838] ${churchView === id ? 'border-[#1A1815] text-[#1A1815] font-medium' : 'border-transparent text-[#5A5751] hover:text-[#1A1815]'}`}>{label}</button>
                ))}
            </TabScroll>
          </div>
        )}
        {view === 'tlc' && (isFamilyMember || tierMeets(data.userTier, 'business')) && (
          <div className="border-t border-[#E8E4DC] bg-white">
            {/* TLC sub-nav — three views of the one TLC office, routed through the
                shared <TabScroll> primitive (same fluid scroll as the main nav). */}
            <TabScroll chrome className="px-1 sm:px-6 lg:px-8">
                {[['practice', <><UiIcon name="heart" /> Practice</>],['intake', <><UiIcon name="phone" /> Intake</>],['assistant', <><UiIcon name="users" /> Assistant</>]].map(([id, label]) => (
                  <button key={id} onClick={() => setTlcSub(id)} className={`px-2.5 sm:px-3 py-2 whitespace-nowrap border-b-2 transition-colors focus:outline focus:outline-2 focus:outline-[#B85838] ${tlcSub === id ? 'border-[#1A1815] text-[#1A1815] font-medium' : 'border-transparent text-[#5A5751] hover:text-[#1A1815]'}`}>{label}</button>
                ))}
            </TabScroll>
          </div>
        )}
      </header>

      <main className="w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-24">
        <Suspense fallback={<div role="status" aria-live="polite" className="py-16 text-center text-sm opacity-60">Loading...</div>}>
        {view === 'overview' && (data.userTier === 'foundation' || !data.userTier) && (
          <div className="mb-6">
            <AdvisementBanner />
          </div>
        )}
        {view === 'overview' && <SectionBoundary name="Overview"><BigPictureDashboard data={data} snowballExtra={snowballExtra} totals={totals} pressure={pressure} setPressure={setPressure} pressureCalc={pressureCalc} projection={projection} rentalSnowball={rentalSnowball} flaggedRentals={flaggedRentals} flaggedOpportunities={flaggedOpportunities} entityRollups={entityRollups} reserves={reserves} upcomingEvents={upcomingEvents} welcomeDismissed={data.welcomeDismissed} dismissWelcome={dismissWelcome} setView={setView} setFeedbackOpen={setFeedbackOpen} bufferTarget={data.meta?.bufferTarget || 0} bufferCurrent={bufferCurrentReal} capexItems={data.capexItems || []} watchlist={data.watchlist || []} rentals={data.inflows?.rentals || []} incidents={data.incidents || []} projects={data.projects || []} resolveIncident={resolveIncident} skillProfiles={data.skillProfiles || []} addIncident={addIncident} addProject={addProject} entities={data.entities || []} ingestData={ingestData} setBooksView={setBooksView} contractors={data.contractors1099 || []} workerOps={workerOps} lifePhotos={data.lifePhotos || []} addLifePhotos={addLifePhotos} updateLifePhoto={updateLifePhoto} deleteLifePhoto={deleteLifePhoto} /></SectionBoundary>}
        {view === 'books' && (
          <PrivateGate area="Financial" onCancel={() => setView('overview')}>
          {/* Router-level backstop (2026-06-25): every Books sub-tab degrades to a
              recoverable inline card instead of white-screening the whole app if it
              throws on an unexpected data shape. Keyed by booksView so switching tabs
              remounts a fresh boundary (a crash in one tab doesn't stick to the next).
              Transactions keeps its own inner boundary too — defense in depth, and it
              also catches that lazy chunk's load failures. */}
          <SectionBoundary key={booksView} name="Financial">
            {booksView === 'entities' && <BooksEntities entityRollups={entityRollups} entityFilter={entityFilter} setEntityFilter={setEntityFilter} data={data} updateEntity={updateEntity} />}
            {booksView === 'accounts' && <BooksAccounts entityRollups={entityRollups} entities={visibleEntities} addAccount={addAccount} updateAccount={updateAccount} deleteAccount={deleteAccount} toggleAccountLegal={toggleAccountLegal} bufferTarget={data.meta?.bufferTarget || 0} bufferCurrent={bufferCurrentReal} setBufferTarget={setBufferTarget} totals={totals} ingestData={ingestData} />}
            {booksView === 'debts' && <Debts debts={derivedDebts} entities={data.entities} debtSnowballSort={debtSnowballSort} setDebtSnowballSort={setDebtSnowballSort} debtSnowballExtra={debtSnowballExtra} setDebtSnowballExtra={setDebtSnowballExtra} debtSnowball={debtSnowball} debtMinOnly={debtMinOnly} currentDate={currentDate} netCashFlow={totals.netCashFlow} cashTotal={totals.allAccountsCash || 0} />}
            {/* BooksTransactions now lazy-loads its own chunk (Stage 1 extraction). The
                SectionBoundary makes the unbreakable-pass hold for the migrated surface:
                a thrown error OR a chunk-load failure degrades JUST this panel, never the
                whole app (the new failure mode lazy-loading introduces over the old inline). */}
            {booksView === 'transactions' && <SectionBoundary name="Transactions"><BooksTransactions data={data} entityFilter={entityFilter} setEntityFilter={setEntityFilter} currentDate={currentDate} addTransaction={addTransaction} updateTransaction={updateTransaction} deleteTransaction={deleteTransaction} recategorizePayee={recategorizePayee} ingestData={ingestData} visibleEntities={visibleEntities} visibleEntityIds={visibleEntityIds} /></SectionBoundary>}
            {booksView === 'imported' && (importedAllowed
              ? <Imported data={data} />
              : <ImportedDemoGuard setBooksView={setBooksView} />)}
            {booksView === 'cart' && <Cart subscriptions={data.subscriptions || []} entities={data.entities} addSubscription={addSubscription} updateSubscription={updateSubscription} deleteSubscription={deleteSubscription} />}
            {booksView === 'k1099' && <Contractors1099 contractors={data.contractors1099 || []} entities={data.entities || []} incidents={data.incidents || []} addContractor={addContractor} updateContractor={updateContractor} deleteContractor={deleteContractor} />}
            {booksView === 'calendar' && <Calendar data={data} reserves={reserves} addRecurring={addRecurring} addIncident={addIncident} addEvent={addEvent} completeEvent={completeEvent} deleteRecurring={deleteRecurring} deleteIncident={deleteIncident} deleteEvent={deleteEvent} updateRecurring={updateRecurring} updateEvent={updateEvent} notifPermission={notifPermission} requestNotif={requestNotificationPermission} upcomingEvents={upcomingEvents} />}
            {booksView === 'legal' && <LegalPlaceholder tier={data.userTier} setView={setView} accounts={data.accounts || []} entities={data.entities || []} toggleAccountLegal={toggleAccountLegal} />}
          </SectionBoundary>
          </PrivateGate>
        )}
        {view === 'inbound' && <SectionBoundary name="Inbound"><Inbound voiceOps={data.voiceOps || {}} setVoiceOpsConfig={setVoiceOpsConfig} addIncident={addIncident} addInquiry={addInquiry} addProject={addProject} entities={data.entities || []} setView={setView} /></SectionBoundary>}
        {view === 'rentals' && (() => {
          // Real Estate: Foundation tier = READ-ONLY PREVIEW of one seed property.
          // PoeTech+ and above = full editor over the user's actual rentals.
          const fullEdit = tierMeets(data.userTier, RENTALS_FULL_EDIT_TIER);
          const visibleRentals = fullEdit
            ? data.inflows.rentals
            : (data.inflows.rentals || []).slice(0, FOUNDATION_CAPS.maxRentalsPreviewVisible);
          const noop = () => alert(`Editing Real Estate unlocks at ${TIER_LABEL[RENTALS_FULL_EDIT_TIER]}. See pricing tiers in About.`);
          return (
            <>
              {!fullEdit && (
                <div className="bg-white border-2 border-[#B85838] p-3 sm:p-4 mb-3" role="status">
                  <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] font-semibold mb-1">Real Estate · Read-only preview</div>
                  <p className="text-xs text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>You're seeing one sample property so the value is concrete. Unlock the full editor (lease · tenant · equipment · rooms · maintenance · evaluator · map · snowball math) at {TIER_LABEL[RENTALS_FULL_EDIT_TIER]}. <button type="button" onClick={() => setView('about')} className="underline text-[#B85838] hover:text-[#1A1815] font-semibold">See pricing tiers →</button></p>
                </div>
              )}
              <Rentals
                rentals={visibleRentals}
                entities={data.entities}
                totals={totals}
                snowballSort={snowballSort}
                setSnowballSort={setSnowballSort}
                snowballExtra={snowballExtra}
                setSnowballExtra={setSnowballExtra}
                rentalSnowball={rentalSnowball}
                sevenYearTarget={sevenYearTarget}
                currentDate={currentDate}
                addRental={fullEdit ? addRental : noop}
                updateRental={fullEdit ? updateRental : noop}
                deleteRental={fullEdit ? deleteRental : noop}
                readOnly={!fullEdit}
                incidents={data.incidents || []}
                addIncident={addIncident}
                resolveIncident={resolveIncident}
                contractors={data.contractors1099 || []}
                workerOps={workerOps}
                voiceOps={data.voiceOps || {}}
              />
            </>
          );
        })()}
        {view === 'markets' && <Markets watchlist={data.watchlist || []} addWatchlistSymbol={addWatchlistSymbol} removeWatchlistSymbol={removeWatchlistSymbol} userTier={data.userTier} setView={setView} maxWatchlist={tierMeets(data.userTier, 'poetech-plus') ? Infinity : FOUNDATION_CAPS.maxWatchlistTickers} />}
        {view === 'church' && churchView === 'home' && <ChurchHome key={churchHomeSection || 'default'} initialSection={churchHomeSection} church={data.church} prayerRequests={data.prayerRequests || []} addPrayerRequest={addPrayerRequest} markPrayerRequestSent={markPrayerRequestSent} deletePrayerRequest={deletePrayerRequest} addEvent={addEvent} conference={data.conference} updateConference={updateConference} churchVoice={data.churchVoice || []} addChurchVoice={addChurchVoice} sendToPoeTech={sendNoteToPoeTech} addIncident={addIncident} addInquiry={addInquiry} setChurchView={setChurchView} email={authSession?.user?.email} canStudy={isStudyCircle} />}
        {view === 'church' && churchView === 'engagement' && <Engagement />}
        {view === 'church' && churchView === 'choir' && <Choir />}
        {/* Order of Service: ONE master program per Sunday; the component derives
            each staffer's sector view from it (RLS read = whole team, 0042). */}
        {view === 'church' && churchView === 'program' && <ServiceProgram />}
        {/* The Word — Migdal: PUBLIC library for everyone; the component itself
            gates prep/management/drafts to leadership (RLS-enforced, 0029). */}
        {view === 'church' && churchView === 'pulpit' && <Pulpit />}
        {view === 'church' && churchView === 'scripture' && <ScriptureLibrary email={authSession?.user?.email} canStudy={isStudyCircle} setChurchView={setChurchView} />}
        {view === 'church' && churchView === 'eternal-algorithms' && <EternalAlgorithmsStudy email={authSession?.user?.email} view={view} churchView={churchView} setView={setView} setChurchView={setChurchView} />}
        {/* Harvest Ledger: no video lost — every ingested recording fully mined
            (one-source-many-harvests). Staff-gated; RLS read = choir (0050). */}
        {view === 'church' && churchView === 'harvest' && (isChurchStaff
          ? <HarvestLedger />
          : <div className="bg-white border border-[#1A1815] p-5 text-sm text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>The Harvest Ledger is for church staff. Sign in with a church staff account to view it.</div>)}
        {view === 'church' && churchView === 'videowall' && (isChurchStaff
          ? <ChurchVideoWall />
          : <div className="bg-white border border-[#1A1815] p-5 text-sm text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>The Video Wall capital project holds church financial data. Sign in with a church staff account to view it.</div>)}
        {/* Device Inventory: the asset register for church infrastructure +
            the idle-GPU compute pool (capability index). Staff-gated; RLS
            scopes church_devices (0056). The capability fields feed the
            deterministic, brake-gated gpu-scheduler (ships inert). */}
        {view === 'church' && churchView === 'devices' && (isChurchStaff
          ? <DeviceInventory />
          : <div className="bg-white border border-[#1A1815] p-5 text-sm text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>The Device Inventory is church infrastructure data. Sign in with a church staff account to view it.</div>)}
        {view === 'church' && churchView === 'infra-plan' && (isChurchStaff
          ? <ChurchInfraPlan />
          : <div className="bg-white border border-[#1A1815] p-5 text-sm text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>The Infrastructure Plan is church staff data. Sign in with a church staff account to view it.</div>)}
        {view === 'church' && churchView === 'observe' && (isChurchStaff
          ? <ChurchObservation observation={data.churchObservation} updateChurchObservation={updateChurchObservation} />
          : <div className="bg-white border border-[#1A1815] p-5 text-sm text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>The Observation board is for church staff only. Sign in with a church staff account to view it.</div>)}
        {view === 'church' && churchView === 'learn' && (() => {
          // Resolve the cohort a learner SEES: the Governor's live in-instance
          // value when present, else the PUBLISHED confirmed date every build
          // carries (resolveCohort) — so a learner outside Darrell's instance no
          // longer sees only the static proposal. (DR-0076 cohort propagation.)
          const cohort = resolveCohort(data.classCohort);
          // Class interest rides the EXISTING cross-tenant feedback pipe (addFeedback
          // -> uploadFeedback), so a parishioner signed in on their OWN instance still
          // reaches the Governor's review — a same-instance churchVoice note never
          // would. A text tag marks the rows; the roster filters local + remote by it.
          const submitClassInterest = authSession
            ? (name) => addFeedback({ area: 'church-learn', rating: 'love', category: 'feature-request', text: `${CLASS_INTEREST_TAG} ${(name || 'A parishioner').trim()} wants to join the youth A.I. class.` })
            : null;
          const isGov = !!authSession && !reviewerMode && isFamilyEmail(authSession.user?.email);
          const classRoster = isGov ? extractClassRoster([...(data.feedback || []), ...remoteFeedback]) : null;

          // The Broadcast course descriptor (second course in the Learn tab). The
          // host owns its cohort + interest wiring; the SOP library + tutor-meta
          // ride along. Interest + graduate-helper notes use a DISTINCT tag so the
          // Governor's roster can tell broadcast sign-ups apart from the youth class.
          const bcCohort = resolveBroadcastCohort(data.broadcastCohort);
          const bcStart = bcCohort.startDate || BROADCAST_PROPOSED_COHORT_START;
          const submitBroadcastInterest = authSession
            ? (name) => addFeedback({ area: 'church-learn', rating: 'love', category: 'feature-request', text: `${BROADCAST_INTEREST_TAG} ${(name || 'A team member').trim()} wants to join the broadcast/media-team course.` })
            : null;
          const broadcastRoster = isGov ? extractClassRoster([...(data.feedback || []), ...remoteFeedback], BROADCAST_INTEREST_TAG) : null;
          const broadcastCourse = {
            meta: { ...BROADCAST_META, key: 'broadcast' },
            sessionFlow: BROADCAST_SESSION_FLOW,
            schedule: buildBroadcastSchedule(bcStart),
            cohortStart: bcStart,
            cohortConfirmed: bcCohort.confirmed,
            setCohortStart: setBroadcastCohortStart,
            confirmCohort: confirmBroadcastCohort,
            progressSummary: (p) => broadcastProgressSummary(p),
            exportMarkdown: () => exportBroadcastCurriculumMarkdown(bcStart),
            downloadName: 'the-broadcast-how-it-all-works-curriculum.md',
            submitInterest: submitBroadcastInterest,
            roster: broadcastRoster,
            interestCopy: {
              heading: 'On the media team?',
              blurb: 'Tell Darrell you want to take The Broadcast course and he’ll save you a spot in Cohort 1. Your name goes straight to his review — no form, no email.',
              cta: 'Count me in',
              sent: '✓ Sent — Darrell will see you’re in. See you at the booth.',
            },
            tutorCourseMeta: BROADCAST_TUTOR_META,
            sopSequences: SOP_SEQUENCES,
            capturePipeline: SOP_CAPTURE_PIPELINE,
          };

          // The Infrastructure course (Darrell 2026-06-16) — third course, same
          // shared framework + machinery. AGE-ADAPTIVE + venue-aware: it carries the
          // generative-visual build-target disclosure (venueAware) and the Governor's
          // engagement-by-age aggregate, both real (no fabrication).
          const infraCohort = resolveInfraCohort(data.infraCohort);
          const infraStart = infraCohort.startDate || INFRA_PROPOSED_COHORT_START;
          const submitInfraInterest = authSession
            ? (name) => addFeedback({ area: 'church-learn', rating: 'love', category: 'feature-request', text: `${INFRA_INTEREST_TAG} ${(name || 'A team member').trim()} wants to join the infrastructure course.` })
            : null;
          const infraRoster = isGov ? extractClassRoster([...(data.feedback || []), ...remoteFeedback], INFRA_INTEREST_TAG) : null;
          // Engagement-by-age aggregate (Governor only) from the real feedback stream.
          const engagementByAge = isGov ? aggregateEngagementByAge([...(data.feedback || []), ...remoteFeedback]) : null;
          const infrastructureCourse = {
            meta: { ...INFRA_META, key: 'infrastructure' },
            sessionFlow: INFRA_SESSION_FLOW,
            schedule: buildInfraSchedule(infraStart),
            cohortStart: infraStart,
            cohortConfirmed: infraCohort.confirmed,
            setCohortStart: setInfraCohortStart,
            confirmCohort: confirmInfraCohort,
            progressSummary: (p) => infraProgressSummary(p),
            exportMarkdown: () => exportInfraCurriculumMarkdown(infraStart),
            downloadName: 'the-infrastructure-how-we-build-it-sovereign-curriculum.md',
            submitInterest: submitInfraInterest,
            roster: infraRoster,
            interestCopy: {
              heading: 'Want to help build it?',
              blurb: 'Tell Darrell you want to learn the infrastructure — the home stack and the church stack — and he’ll save you a spot in Cohort 1. Paced for every age; Christian’s already on the home path.',
              cta: 'I want to build',
              sent: '✓ Sent — Darrell will see you’re in. We build it together.',
            },
            tutorCourseMeta: INFRA_TUTOR_META,
            sopSequences: INFRA_SOP_SEQUENCES,
            capturePipeline: SOP_CAPTURE_PIPELINE,
            venueAware: true,        // multi-screen venue cast + the generative-visual build target
            engagementByAge,         // Governor: real engagement-by-age aggregate
          };

          // The Sovereign A.I. course — same shared framework +
          // machinery. Teaches WHY we build local (resilience + data sovereignty),
          // the verified model-tier landscape, the Cage-gated routing, and the five
          // local-A.I. opportunities. No SOP library; reuses the Governor's
          // engagement-by-age aggregate.
          const sovereignAiCohort = resolveSovereignAiCohort(data.sovereignAiCohort);
          const sovereignAiStart = sovereignAiCohort.startDate || SOVEREIGN_AI_PROPOSED_COHORT_START;
          const submitSovereignAiInterest = authSession
            ? (name) => addFeedback({ area: 'church-learn', rating: 'love', category: 'feature-request', text: `${SOVEREIGN_AI_INTEREST_TAG} ${(name || 'A learner').trim()} wants to join the Sovereign A.I. course.` })
            : null;
          const sovereignAiRoster = isGov ? extractClassRoster([...(data.feedback || []), ...remoteFeedback], SOVEREIGN_AI_INTEREST_TAG) : null;
          const sovereignAiCourse = {
            meta: { ...SOVEREIGN_AI_META, key: 'sovereign-ai' },
            sessionFlow: SOVEREIGN_AI_SESSION_FLOW,
            schedule: buildSovereignAiSchedule(sovereignAiStart),
            cohortStart: sovereignAiStart,
            cohortConfirmed: sovereignAiCohort.confirmed,
            setCohortStart: setSovereignAiCohortStart,
            confirmCohort: confirmSovereignAiCohort,
            progressSummary: (p) => sovereignAiProgressSummary(p),
            exportMarkdown: () => exportSovereignAiCurriculumMarkdown(sovereignAiStart),
            downloadName: 'sovereign-ai-why-we-build-local-curriculum.md',
            submitInterest: submitSovereignAiInterest,
            roster: sovereignAiRoster,
            interestCopy: {
              heading: 'Want to understand why we build local?',
              blurb: 'Tell Darrell you want to take the Sovereign A.I. course — local-first resilience, the model-tier landscape, and the strategy — and he’ll save you a spot in Cohort 1. Paced for every age.',
              cta: 'I want to learn',
              sent: '✓ Sent — Darrell will see you’re in. We build it sovereign.',
            },
            tutorCourseMeta: SOVEREIGN_AI_TUTOR_META,
            engagementByAge,         // Governor: real engagement-by-age aggregate
          };

          // The AI Legal Blueprint course — the privacy/legal companion to the
          // Sovereign A.I. course. Plain-language, age-adaptive (child/teen/senior),
          // teaches what NOT to paste into a vendor chatbot and why. Same shared
          // framework + machinery; reuses the Governor's engagement-by-age aggregate.
          const aiLegalBlueprintCohort = resolveAiLegalBlueprintCohort(data.aiLegalBlueprintCohort);
          const aiLegalBlueprintStart = aiLegalBlueprintCohort.startDate || AI_LEGAL_BLUEPRINT_PROPOSED_COHORT_START;
          const submitAiLegalBlueprintInterest = authSession
            ? (name) => addFeedback({ area: 'church-learn', rating: 'love', category: 'feature-request', text: `${AI_LEGAL_BLUEPRINT_INTEREST_TAG} ${(name || 'A learner').trim()} wants to join the AI Legal Blueprint course.` })
            : null;
          const aiLegalBlueprintRoster = isGov ? extractClassRoster([...(data.feedback || []), ...remoteFeedback], AI_LEGAL_BLUEPRINT_INTEREST_TAG) : null;
          const aiLegalBlueprintCourse = {
            meta: { ...AI_LEGAL_BLUEPRINT_META, key: 'ai-legal-blueprint' },
            sessionFlow: AI_LEGAL_BLUEPRINT_SESSION_FLOW,
            schedule: buildAiLegalBlueprintSchedule(aiLegalBlueprintStart),
            cohortStart: aiLegalBlueprintStart,
            cohortConfirmed: aiLegalBlueprintCohort.confirmed,
            setCohortStart: setAiLegalBlueprintCohortStart,
            confirmCohort: confirmAiLegalBlueprintCohort,
            progressSummary: (p) => aiLegalBlueprintProgressSummary(p),
            exportMarkdown: () => exportAiLegalBlueprintCurriculumMarkdown(aiLegalBlueprintStart),
            downloadName: 'ai-legal-blueprint-what-never-to-tell-a-chatbot-curriculum.md',
            submitInterest: submitAiLegalBlueprintInterest,
            roster: aiLegalBlueprintRoster,
            interestCopy: {
              heading: 'Want to keep your data safe with A.I.?',
              blurb: 'Tell Darrell you want to take the AI Legal Blueprint — what never to tell a chatbot, and why — and he’ll save you a spot in Cohort 1. Plain language, paced for every age.',
              cta: 'Keep me safe',
              sent: '✓ Sent — Darrell will see you’re in. We protect what’s yours.',
            },
            tutorCourseMeta: AI_LEGAL_BLUEPRINT_TUTOR_META,
            engagementByAge,         // Governor: real engagement-by-age aggregate
          };

          // SELF-PACED courses — Living Lessons, Running the Board, World Issues
          // & Discernment, PoeTech Data Systems, Handed Forward, Kingdom
          // Economics, and Prophetic Voices — ALL derive from the one course
          // registry (lib/learn-catalog.js). The registry is the source of
          // truth for what finished courses exist; the render gate
          // (learn-catalog-render.test.jsx) clicks every one and holds the
          // >= 40-lesson floor, so a course that is built but unsurfaced (the
          // Kingdom Economics / Prophetic Voices miss, Darrell 2026-07-08)
          // fails CI instead of shipping. Interest + Governor rosters ride the
          // same cross-tenant feedback pipe, tagged per course.
          const selfPacedCourses = buildSelfPacedDescriptors({
            submitInterestFor: authSession
              ? (e) => (name) => addFeedback({
                  area: 'church-learn', rating: 'love', category: 'feature-request',
                  text: e.interestText(((name || '').trim()) || 'A learner'),
                })
              : null,
            rosterFor: isGov
              ? (e) => extractClassRoster([...(data.feedback || []), ...remoteFeedback], e.interestTag)
              : null,
            engagementByAge,
          });

          // Graduate → next-cohort helper (all courses), via the same feedback pipe.
          const helperTagFor = (courseKey) => helperTagForCourse(courseKey);
          const submitHelper = authSession
            ? (courseKey, courseTitle, who) => addFeedback({
                area: 'church-learn', rating: 'love', category: 'feature-request',
                text: helperInterestText(courseTitle, who, helperTagFor(courseKey)),
              })
            : null;

          // Feedback-tuned for every age (item 5): a real engagement signal, tagged
          // with the learner's age band, rides the same cross-tenant feedback pipe.
          const onLearnEngagement = authSession
            ? ({ courseKey, courseTitle, moduleId, ageBand, signal }) => addFeedback({
                area: 'church-learn', rating: 'neutral', category: 'general',
                text: engagementFeedbackText({ courseKey, courseTitle, moduleId, ageBand, signal, who: authSession?.user?.email || 'A learner' }),
              })
            : null;

          return <ChurchLearn
            cohortStart={cohort.startDate || PROPOSED_COHORT_START}
            cohortConfirmed={cohort.confirmed}
            setCohortStart={setClassCohortStart}
            confirmCohort={confirmClassCohort}
            progress={data.classProgress || {}}
            toggleModule={authSession ? toggleClassModule : null}
            addChurchVoice={authSession ? addChurchVoice : null}
            submitClassInterest={submitClassInterest}
            classRoster={classRoster}
            isGovernor={isGov}
            currentUserName={authSession?.user?.email || ''}
            onLaunch={(t) => { if (!t) return; if (t.view) setView(t.view); if (t.churchView) { setChurchView(t.churchView); if (t.churchView === 'home') setChurchHomeSection(t.churchSection || null); } }}
            broadcast={broadcastCourse}
            extraCourses={[infrastructureCourse, sovereignAiCourse, aiLegalBlueprintCourse, ...selfPacedCourses]}
            quizState={data.classQuiz || {}}
            recordQuiz={authSession ? recordClassQuiz : null}
            learnLevel={data.learnLevel || 'auto'}
            setLearnLevel={setLearnLevel}
            ageBand={data.learnAgeBand || 'adult'}
            setAgeBand={setLearnAgeBand}
            onEngagement={onLearnEngagement}
            submitHelper={submitHelper}
          />;
        })()}
        {view === 'church' && churchView === 'conference' && (
          <div className="space-y-4">
            {/* CONFERENCE / EVENT CENTER — promoted to its own Church sub-tab
                (sibling to Learn). The front door (ConferenceModule) + the real
                multi-attendee system across buildings (EventCenterModule). */}
            <ConferenceModule conference={data.conference} updateConference={updateConference} />
            <EventCenterModule />
            {/* ANTICIPATED vs ACTUAL — event-day check-in + the variance view
                (no-show rate, meals served, rooms used). Organizer-gated; reads
                the same real registration roll + rooms the engine does. */}
            <ConferenceVariance />
          </div>
        )}
        {/* Venues — COMMUNITY use of the two campuses (funerals / weddings /
            gatherings), DISTINCT from the church's own Conference. Community-facing
            request front door for everyone; staff get the back-office (calendar +
            no-double-book + responsibilities + revenue), RLS-enforced. */}
        {view === 'church' && churchView === 'events' && <EventManagement isChurchStaff={isChurchStaff} />}

        {/* Projects — the Love Corner's own project board (video wall, ministries,
            the Assembly, infra, the door, outreach). Visible to church viewers;
            church staff manage, members see it read-only (gated in-component). */}
        {view === 'church' && churchView === 'projects' && (
          <SectionBoundary name="Church Projects">
            <ChurchProjects isChurchStaff={isChurchStaff} />
          </SectionBoundary>
        )}
        {view === 'church' && churchView === 'bus' && <BusMinistry />}
        {view === 'notes' && <ThinkingSpace notes={data.notes || []} addNote={addNote} updateNote={updateNote} deleteNote={deleteNote} togglePinNote={togglePinNote} toggleNoteSource={toggleNoteSource} sendToPoeTech={sendNoteToPoeTech} appDirectives={data.appDirectives || []} addPrayerRequest={addPrayerRequest} addChurchVoice={addChurchVoice} addIncident={addIncident} addInquiry={addInquiry} />}
        {/* Create — the document / image creation workspace. Wrapped in its own
            SectionBoundary so a thrown error degrades just this surface (no
            white-screen), per the unbreakable basics. */}
        {view === 'create' && (
          <SectionBoundary name="Creation Workspace">
            <CreationWorkspace
              workspaces={data.workspaces || []}
              addWorkspace={addWorkspace}
              updateWorkspace={updateWorkspace}
              deleteWorkspace={deleteWorkspace}
              currentUserPersona={authSession ? personaOf(authSession.user?.email) : null}
            />
          </SectionBoundary>
        )}
        {/* Chef's Corner — the recipe surface. Starts with the Poe Family Vegan
            Recipes by Chef Mario (canonical content) + every recipe the family
            adds (persisted, instance-scoped). Own SectionBoundary so a thrown
            error degrades just this surface. */}
        {view === 'recipes' && (
          <SectionBoundary name="Chef's Corner">
            <ChefCorner
              recipes={data.recipes || []}
              addRecipe={addRecipe}
              updateRecipe={updateRecipe}
              deleteRecipe={deleteRecipe}
              currentUserPersona={authSession ? personaOf(authSession.user?.email) : null}
              inventory={isFamilyMember ? {
                items: data.inventoryItems || [],
                movements: data.inventoryMovements || [],
                counts: data.inventoryCounts || [],
                countLines: data.inventoryCountLines || [],
                addItem: addInventoryItem,
                updateItem: updateInventoryItem,
                recordMovements: recordInventoryMovements,
                addCount: addInventoryCount,
                updateCount: updateInventoryCount,
                addCountLine: addInventoryCountLine,
                updateCountLine: updateInventoryCountLine,
                purchaseOrders: data.purchaseOrders || [],
                purchaseOrderLines: data.purchaseOrderLines || [],
                addPurchaseOrder,
                updatePurchaseOrder,
                addPurchaseOrderLine,
                canManage: true,
              } : null}
            />
          </SectionBoundary>
        )}
        {/* Games — the family games hub. Own SectionBoundary so a thrown error
            degrades just this surface. Local-first persistence via gameSaves. */}
        {view === 'games' && (
          <SectionBoundary name="Games">
            <Games
              saves={data.gameSaves || []}
              addSave={addGameSave}
              updateSave={updateGameSave}
              deleteSave={deleteGameSave}
            />
          </SectionBoundary>
        )}
        {/* TV Time — the friend-group show tracker + discussion (Darrell 2026-07-04).
            Own SectionBoundary so a thrown error degrades just this surface.
            Owner list syncs cross-device (tv_watch, 0072); circle sharing is
            LIVE (tv_circle/tv_share, 0074 — flag opened 2026-07-04). */}
        {view === 'tvtime' && (
          <SectionBoundary name="TV Time">
            <TVTime email={authSession?.user?.email || null} />
          </SectionBoundary>
        )}
        {/* Voice — "listen to anything" in a chosen voice; consent-gated personal
            (cloned) voices as a subscriber feature. Own SectionBoundary so a thrown
            error degrades just this surface. Personal-voice timbre is honest:
            labeled stand-in until the local sovereign voice studio is live. */}
        {view === 'voice' && (
          <SectionBoundary name="Voice">
            <VoiceStudio
              personaKey={authSession && !reviewerMode ? personaOf(authSession.user?.email) : null}
              isOwner={!reviewerMode && !!authSession && personaOf(authSession.user?.email) === 'darrell'}
            />
          </SectionBoundary>
        )}
        {/* Library — the books<->app flywheel surface. Reader is open to any
            signed-in user; the build Studio is family/Governor-gated inside the
            component. Its own SectionBoundary keeps a thrown error scoped. */}
        {view === 'library' && (
          <SectionBoundary name="Library">
            <Library
              email={authSession?.user?.email || ''}
              isFamilyMember={isFamilyMember}
              sermons={[]}
              setView={setView}
              setChurchView={setChurchView}
              setChurchHomeSection={setChurchHomeSection}
              setBooksView={setBooksView}
            />
          </SectionBoundary>
        )}
        {/* Darrell's Study — private, circle-only (Darrell/Christina/BG). Gated
            again here (defense in depth) so a deep-link can't reach it; data is
            device-local + sovereign (study-space.js). */}
        {view === 'study' && (isStudyCircle
          ? <Study email={authSession?.user?.email} />
          : (
            <div className="max-w-2xl">
              <SectionTitle eyebrow="Private">Darrell's Study</SectionTitle>
              <div className="bg-white border border-[#E8E4DC] p-6 text-center">
                <div className="text-2xl mb-1" aria-hidden="true">📓</div>
                <p className="text-sm text-[#1A1815] font-semibold" style={{ fontFamily: '"Fraunces", serif' }}>This is a private space.</p>
                <p className="text-xs text-[#5A5751] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>It belongs to a small circle and isn't open here.</p>
              </div>
            </div>
          ))}
        {view === 'projects' && (tierMeets(data.userTier, VIEW_TIER_REQUIREMENTS.projects)
          ? <SectionBoundary name="Projects"><ProjectsWrapper projects={data.projects || []} scopes={data.scopes || []} entities={data.entities} contractors={data.contractors1099 || []} addProject={addProject} updateProject={updateProject} deleteProject={deleteProject} addScope={addScope} deleteScope={deleteScope} capexItems={data.capexItems || []} addCapexItem={addCapexItem} updateCapexItem={updateCapexItem} deleteCapexItem={deleteCapexItem} netCashFlow={totals.netCashFlow} rentals={data.inflows?.rentals || []} accounts={data.accounts || []} transactions={data.transactions || []} debts={data.debts || []} currentUserId={authSession?.user?.id || null} currentUserPersona={authSession ? personaOf(authSession.user?.email) : null} familyMembers={(!!authSession && isFamilyEmail(authSession.user?.email)) ? FAMILY_MEMBERS : []} isGovernor={!!authSession && isFamilyEmail(authSession.user?.email)}
              loopData={data} loopDecisions={data.loopDecisions || {}} onLoopDecision={onLoopDecision}
              discussions={data.discussions || []} addDiscussion={addDiscussion} updateDiscussion={updateDiscussion} deleteDiscussion={deleteDiscussion}
              concerns={data.concerns || []} feedback={[...(data.feedback || []), ...remoteFeedback]} addConcern={addConcern} updateConcern={updateConcern} deleteConcern={deleteConcern}
              financialDocAt={(() => { const ms = latestFinancialDocMs(ingestData); return ms ? new Date(ms).toISOString() : null; })()}
              onNavigate={(v) => { if (v) { setView(v); try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) {} } }}
              feedbackPanel={<FeedbackPromotePanel feedback={[...(data.feedback || []), ...remoteFeedback]} addProject={addProject} addIncident={addIncident} deleteFeedback={deleteFeedback} />}
            /></SectionBoundary>
          : <UpgradePrompt viewLabel="Projects" requiredTier={VIEW_TIER_REQUIREMENTS.projects} currentTier={data.userTier} setView={setView} setUserTier={setUserTier} />
        )}
        {view === 'practice' && (tierMeets(data.userTier, VIEW_TIER_REQUIREMENTS.practice)
          ? <Practice inquiries={data.inquiries} contractors={data.contractors1099} addInquiry={addInquiry} updateInquiry={updateInquiry} deleteInquiry={deleteInquiry} practiceLeads={data.practiceLeads} addLead={addLead} updateLead={updateLead} deleteLead={deleteLead} email={authSession?.user?.email || ''} isStaff={isFamilyMember} />
          : <UpgradePrompt viewLabel="Practice Operations" requiredTier={VIEW_TIER_REQUIREMENTS.practice} currentTier={data.userTier} setView={setView} setUserTier={setUserTier} />
        )}
        {view === 'opportunities' && (tierMeets(data.userTier, VIEW_TIER_REQUIREMENTS.opportunities)
          ? <Opportunities
              opportunities={data.opportunities}
              totals={totals}
              skillProfiles={data.skillProfiles || []}
              addSkillProfile={addSkillProfile}
              updateSkillProfile={updateSkillProfile}
              deleteSkillProfile={deleteSkillProfile}
              userTier={data.userTier}
              addProject={addProject}
              addScope={addScope}
              addCapexItem={addCapexItem}
              setView={setView}
              projects={data.projects || []}
              OPPORTUNITY_LIBRARY={OPPORTUNITY_LIBRARY}
              matchOpportunities={matchOpportunities}
              capacityDecisionForNewProject={capacityDecisionForNewProject}
              tierMeets={tierMeets}
              TIER_LABEL={TIER_LABEL}
            />
          : <UpgradePrompt viewLabel="Dev/Ops (personalized entrepreneurial options)" requiredTier={VIEW_TIER_REQUIREMENTS.opportunities} currentTier={data.userTier} setView={setView} setUserTier={setUserTier} />
        )}
        {view === 'about' && <About moduleInterest={data.moduleInterest || {}} familyModuleInterest={familyModuleInterest} toggleModuleInterest={toggleModuleInterest} theme={theme} setTheme={setTheme} feedback={[...(data.feedback || []), ...remoteFeedback]} deleteFeedback={deleteFeedback} checkoutIntents={data.checkoutIntents || []} addCheckoutIntent={addCheckoutIntent} deleteCheckoutIntent={deleteCheckoutIntent} addProject={addProject} VIEW_TIER_REQUIREMENTS={VIEW_TIER_REQUIREMENTS} authUserId={authSession && mpBackendAvailable ? (authSession.user?.id || null) : null} authCreatedAt={authSession?.user?.created_at || null} onChangePin={() => setChangePinOpen(true)} />}
        {view === 'center' && (
          <CommandServeCenter
            isGovernor={isFamilyMember}
            persona={personaOf(authSession?.user?.email)}
            email={authSession?.user?.email || null}
            onNavigate={(v) => { if (v) { setView(v); try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) {} } }}
            projects={data.projects || []}
            discussions={data.discussions || []}
            currentUserId={authSession?.user?.id || null}
            familyData={data}
          />
        )}

        {view === 'crm' && (isFamilyMember
          ? <CRM inquiries={data.inquiries || []} practiceLeads={data.practiceLeads || []} currentUserId={authSession?.user?.id || null} />
          : (
            <div className="max-w-2xl mx-auto bg-white border border-[#1A1815] p-6 mt-6 text-center" style={{ fontFamily: '"Fraunces", serif' }}>
              <div className="text-2xl mb-1" aria-hidden="true">🔒</div>
              <p className="text-sm text-[#1A1815] font-semibold">CRM is a stewardship space.</p>
              <p className="text-xs text-[#5A5751] mt-1.5 leading-relaxed">The shared acquisition backbone is steward-only. Sign in with a family/governor account to manage the pipelines.</p>
            </div>
          ))}

        {/* Relationships — the relationship-based permission model + the
            landlord<->tenant / guardian<->child workflows. Family/Governor only
            (it SETS access); the component carries a locked fallback for any
            deep-link, and its own SectionBoundary so a thrown error degrades just
            this surface. */}
        {view === 'relationships' && (
          <SectionBoundary name="Relationships">
            <Relationships isGovernor={isFamilyMember || tierMeets(data.userTier, 'business')} currentUserId={authSession?.user?.id || null} />
          </SectionBoundary>
        )}

        {/* Inventory — the systems-of-record demonstration: on-hand DERIVED from
            an immutable movement ledger, versioned items, corporate controls.
            Family/Governor only (operations tooling); own SectionBoundary so a
            thrown error degrades just this surface (no white-screen). */}
        {view === 'inventory' && (isFamilyMember
          ? (
            <SectionBoundary name="Inventory">
              <Inventory
                items={data.inventoryItems || []}
                movements={data.inventoryMovements || []}
                recordEvents={data.recordEvents || []}
                addItem={addInventoryItem}
                updateItem={updateInventoryItem}
                recordMovements={recordInventoryMovements}
                currentUserPersona={authSession ? personaOf(authSession.user?.email) : null}
              />
            </SectionBoundary>
          )
          : (
            <div className="max-w-2xl mx-auto bg-white border border-[#1A1815] p-6 mt-6 text-center" style={{ fontFamily: '"Fraunces", serif' }}>
              <div className="mb-1 flex justify-center" aria-hidden="true"><UiIcon name="lock" /></div>
              <p className="text-sm text-[#1A1815] font-semibold">Inventory is a stewardship space.</p>
              <p className="text-xs text-[#5A5751] mt-1.5 leading-relaxed">The inventory system of record is steward-only. Sign in with a family/governor account to manage items and stock.</p>
            </div>
          ))}

        {/* Moore Divahs — Shay's fashion business Order Board (custom orders,
            the 3-week clock, the change-order ladder). Family/Governor only for
            now; the branded customer door ships separately. Own SectionBoundary
            so a thrown error degrades just this surface. */}
        {view === 'moore' && (isFamilyMember
          ? (
            <SectionBoundary name="Moore Divahs">
              <MooreDivahs />
            </SectionBoundary>
          )
          : (
            <div className="max-w-2xl mx-auto bg-white border border-[#1A1815] p-6 mt-6 text-center" style={{ fontFamily: '"Fraunces", serif' }}>
              <div className="mb-1 flex justify-center" aria-hidden="true"><UiIcon name="lock" /></div>
              <p className="text-sm text-[#1A1815] font-semibold">Moore Divahs is a stewardship space.</p>
              <p className="text-xs text-[#5A5751] mt-1.5 leading-relaxed">The order board is steward-only. Sign in with a family/governor account to run the business.</p>
            </div>
          ))}

        {view === 'forecast' && <Forecast data={data} currentDate={currentDate} isOwner={isFamilyMember} />}

        {/* Academy — open to everyone as the parent-facing INVITE (value/ROI +
            register-interest). The component itself shows the invite to non-
            operators and the operations CONSOLE (enroll, tuition, team, retro)
            only when isGovernor is true — so the gate lives inside, one surface
            serving both parents and operators. Own SectionBoundary so a thrown
            error degrades just this surface. */}
        {view === 'cohorts' && (
          <SectionBoundary name="Academy">
            <CohortPrograms isGovernor={!reviewerMode && (isFamilyMember || tierMeets(data.userTier, 'business'))} />
          </SectionBoundary>
        )}

        {/* Assistant — TLC referral database + admin/marketing assistant workspace.
            Family/Governor or business-tier operator; writes gated to the operator;
            a non-permitted deep-link gets the locked card (nav + render agree). */}
        {view === 'tlc-assistant' && ((isFamilyMember || tierMeets(data.userTier, 'business'))
          ? (
            <SectionBoundary name="Assistant">
              <TlcAssistant isGovernor={!reviewerMode && (isFamilyMember || tierMeets(data.userTier, 'business'))} />
            </SectionBoundary>
          )
          : (
            <div className="max-w-2xl mx-auto bg-white border border-[#1A1815] p-6 mt-6 text-center">
              <div className="mb-1 flex justify-center" aria-hidden="true"><UiIcon name="lock" /></div>
              <p className="text-sm text-[#1A1815] font-semibold">The Assistant workspace is an operations space.</p>
              <p className="text-xs text-[#5A5751] mt-1.5 leading-relaxed">The TLC referral database and outreach system is for a family/governor or business-tier account.</p>
            </div>
          ))}

        {/* TLC — the unified TLC Therapy Solutions office. ONE workspace, three
            views of the same office (Darrell 2026-07-13: "the Whole TLC App...
            one single tab that holds all of it"): Practice (operations + the
            clinician roster), Intake (Inbound), and Assistant (referral/outreach).
            Gated to a family/Governor OR a business-tier operator; the sub-tab
            strip lives in the header above. Each sub-view reuses the exact same
            component + props as its standalone route, so this is a composition,
            not a fork — the individual routes stay valid for deep-links. */}
        {view === 'tlc' && ((isFamilyMember || tierMeets(data.userTier, 'business'))
          ? (
            <SectionBoundary name="TLC">
              {tlcSub === 'practice' && (
                <Practice inquiries={data.inquiries} contractors={data.contractors1099} addInquiry={addInquiry} updateInquiry={updateInquiry} deleteInquiry={deleteInquiry} practiceLeads={data.practiceLeads} addLead={addLead} updateLead={updateLead} deleteLead={deleteLead} email={authSession?.user?.email || ''} isStaff={isFamilyMember} />
              )}
              {tlcSub === 'intake' && (
                <Inbound voiceOps={data.voiceOps || {}} setVoiceOpsConfig={setVoiceOpsConfig} addIncident={addIncident} addInquiry={addInquiry} addProject={addProject} entities={data.entities || []} setView={setView} />
              )}
              {tlcSub === 'assistant' && (
                <TlcAssistant isGovernor={!reviewerMode && (isFamilyMember || tierMeets(data.userTier, 'business'))} />
              )}
            </SectionBoundary>
          )
          : (
            <div className="max-w-2xl mx-auto bg-white border border-[#1A1815] p-6 mt-6 text-center">
              <div className="mb-1 flex justify-center" aria-hidden="true"><UiIcon name="lock" /></div>
              <p className="text-sm text-[#1A1815] font-semibold">The TLC workspace is an operations space.</p>
              <p className="text-xs text-[#5A5751] mt-1.5 leading-relaxed">The TLC Therapy Solutions office — intake, practice operations, and outreach — is for a family/governor or business-tier account.</p>
            </div>
          ))}

        {/* Access & Usage was MERGED into Admin (one users report, 2026-07-04):
            AdminConsole now renders the AccessUsageMetrics report itself, and a
            ?view=access deep-link normalizes to 'admin'. No standalone block. */}
        {view === 'admin' && (
          <AdminConsole
            isGovernor={!reviewerMode && (isFamilyMember || !isPublicHost())}
            email={authSession?.user?.email || null}
            instanceId={mpInstanceId}
            backendReachable={mpBackendAvailable && !!mpInstanceId}
            data={data}
            isPublicHost={isPublicHost()}
            onResetSeed={resetToSeed}
          />
        )}

        {/* PoeTech platform footer — hidden in the focused church app (DR-0174). */}
        {!churchDoorOnly && (
        <footer className="mt-16 pt-6 border-t border-[#E8E4DC] text-center print:hidden">
          <div className="text-[10px] uppercase tracking-[0.2em] text-[#5A5751] mb-2">PoeTech · A family data platform · {data.meta.releaseLabel || `v${data.meta.appVersion}`} · {data.meta.releaseNote || ''}</div>
          <button type="button" onClick={resetToSeed} className="text-[10px] uppercase tracking-wider text-[#5A5751] hover:text-[#B85838] underline underline-offset-4">Reset to seed data</button>
        </footer>
        )}
        {!churchDoorOnly && view !== 'overview' && !(view === 'books' && booksView === 'debts') && (data.userTier === 'foundation' || !data.userTier) && (
          <div className="mt-6">
            <AdvisementBanner />
          </div>
        )}
        {view === 'books' && booksView === 'debts' && <TherapyReminder />}
        </Suspense>
      </main>
      <TTSControl isOwner={isFamilyMember} view={view} churchView={churchView} booksView={booksView} />
      <InstallPrompt />
      <UpdatePrompt />
      <NetworkStatus />
      {/* Round 15 — Persistent floating feedback button. Always reachable from
          any tab; pre-fills the current view. Sits above TTS controls in the
          stack. Hidden when the feedback modal is already open. */}
      {!feedbackOpen && (
        <button
          type="button"
          onClick={() => setFeedbackOpen(true)}
          aria-label="Open feedback"
          title="Tell us what's working / not working / missing"
          // ts-chrome-region = no text-size balloon; idle-reveal dims/reveals (Pattern 2d).
          className={`ts-chrome-region fixed bottom-4 left-4 z-30 px-4 py-3 bg-[#B85838] text-white text-xs uppercase tracking-wider font-semibold border-2 border-[#B85838] hover:bg-[#1A1815] hover:border-[#1A1815] shadow-lg min-h-[48px] min-w-[48px] focus:outline focus:outline-2 focus:outline-[#1A1815] print:hidden transition-all duration-500 hover:opacity-100 focus:opacity-100 ${feedbackReveal ? 'opacity-100 translate-y-0' : 'opacity-40 translate-y-2'}`}
          style={{ borderRadius: '999px' }}
        >
          💬 Feedback
        </button>
      )}
      {feedbackOpen && <FeedbackModal onClose={() => setFeedbackOpen(false)} onSubmit={(item) => { addFeedback(item); setFeedbackOpen(false); }} currentView={view} />}
      {/* Give floater — Church surfaces only (bottom-right; Feedback owns
          bottom-left). Links out to the congregation's own giving page + the
          blessing of giving according to the Word. See components/ChurchGiving. */}
      {view === 'church' && <ChurchGiveFloater church={data.church} />}
    </div>
  );
}

// =============================================================================
// FEEDBACK MODAL — v24 · Tester feedback collection for MVP
// =============================================================================
// =============================================================================
// SALES FOOTER BANNER — v28 · Subtle PoeTech Services promotion
// Shows at bottom of working pages (not dashboard) · rotating sales angles
// Out-of-the-way but discoverable — surfaces the "Pay us to get done now" offer
// =============================================================================
// ImportedDemoGuard — security gate for the Books -> Imported subview.
// =============================================================================
// The Imported subview (components/Imported.jsx) fetches real bank + Gmail
// transactions from n8n workflow 18 (PII: Chase payees, Zelle recipients,
// Cash App entries) and is for an authenticated family member viewing their
// OWN sovereign data only. On the public poetech.us demo / picker state every
// visitor would otherwise see Darrell's real transaction stream. This guard
// renders INSTEAD of <Imported /> whenever isAnyDemoMode is true: it never
// imports the component, never fires the /n8n/webhook/imported-transactions
// fetch, and redirects the subview back to a safe tab. Defense in depth pairs
// with hiding the tab from the demo subnav.
function ImportedDemoGuard({ setBooksView }) {
  useEffect(() => {
    // Redirect any direct landing on the imported subview away from real data.
    setBooksView('calendar');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="text-[12px] text-[#5A5751] p-4">
      Imported transactions are private to each family and shown only when you are signed in with your own data loaded.
    </div>
  );
}


// Feedback capture + promote queue moved to ./components/FeedbackCenter.jsx
// (FEEDBACK_AREAS + FEEDBACK_CATEGORIES + FeedbackModal + FeedbackPromotePanel).

// =============================================================================
// BIG PICTURE — v7 dashboard horizontal-first
// BigPictureDashboard + CompactHero moved to ./components/BigPictureDashboard.jsx
// (2026-07-03 modularization lane, second extraction). Statically imported —
// overview is the landing view, so it stays in the main chunk (no lazy flash).
// =============================================================================

// =============================================================================
// CALENDAR — v7 with EVENTS + reminders + notifications
// =============================================================================
// =============================================================================
// CART · SUBSCRIPTIONS AUDIT — v18
// Recurring monthly purchases tracking · keep / review / cancel decisions
// Plaid integration noted as future build
// =============================================================================
// Cart moved to ./components/Cart.jsx (r29) with inline edit.

// =============================================================================
// v28+ MVP v1.5 round 3 — PROJECT INVENTORY & CAPITAL FORECAST
// Tools/equipment tracker (formerly the About > Capital Spend section) plus:
//   · 12-month forecast of projected outflows (sum of items by purchaseTargetDate)
//   · monthly gap warning when projected outflow > net cash flow
//   · savings prompt per item: how much to save per month to hit the date
// Pure computation from existing data — no new paid dependencies, no backend.
// FUTURE-MODULE HOOK: each item already carries optional `entityId`, `module`,
// `projectId` so home-command / practice-ops / elder-care-coord can claim their
// own slice of the inventory without a migration.
// CAPEX_STATUSES + CAPEX_CATEGORIES moved to ./components/Projects.jsx (r41).

// =============================================================================
// v28+ MVP v1.5 round 10 — ITSM-style urgency taxonomy + capacity + Dev/Ops
// opportunity library. Moved to ./lib/opportunity-capacity.js (2026-07-03
// modularization lane) — URGENCY_BANDS/INDEX/KEYS, dueDateFor, capacity math,
// SKILL_CATEGORIES, OPPORTUNITY_LIBRARY, matchOpportunities. Imported above.
// =============================================================================

// ProjectInventory moved to ./components/Projects.jsx (r41).
// =============================================================================
// PROJECTS · TIMELINE · WORKLOAD COORDINATION — v17
// Multi-domain project tracking with start/end dates and workload visualization
// =============================================================================
// v21: ProjectsWrapper — sub-nav between Projects list and Scopes
// ProjectsWrapper + Projects + ProjectConversationLog + DateField moved to ./components/Projects.jsx (r34).


// Scope + ScopeForm + ScopeView + FormField moved to ./components/Projects.jsx (r41).
// =============================================================================
// RENTALS
// =============================================================================
// =============================================================================
// v28+ MVP v1.5 — Real Estate Ops add-on. Pulled forward from the 2019-era
// "Real Estate App" notes (lease + tenant + equipment + room-by-room) but
// trimmed for the family Financial OS use case. Zero new paid dependencies.
// All UI uses <label> + visible focus + text-not-color status, holding the
// WCAG 2.1 AA discipline used elsewhere in this file.
// =============================================================================
// ROOM_PRESETS + ROOM_ITEM_PRESETS + ROOM_ITEM_STATUSES moved to ./components/Rentals.jsx (r34/r41).
// EQUIPMENT_CATEGORIES + PropertyDetails + Rentals moved to ./components/Rentals.jsx (r34).

// =============================================================================
// v28+ MVP v1.5 — MARKETS · Watchlist with free Stooq CSV feed.
// "One-stop place for financial data" — anyone can add their main tickers.
// Cost: $0 (no API key, no signup, public CORS-friendly endpoint).
// Stooq symbol format: 'aapl.us', 'spy.us', 'btcusd', 'eurusd', '^spx'.
// CSV columns: Symbol,Date,Time,Open,High,Low,Close,Volume.
// WCAG 2.1 AA: <label> for inputs, aria-live updates, change direction
// expressed as text+symbol (not color alone), refresh button has aria-busy.
// =============================================================================
// Markets + SUGGESTED_TICKERS moved to ./components/Markets.jsx (r33/r40).

// =============================================================================
// v28+ MVP v1.5 — CHURCH · Home-church tab.
// Church (home) moved to ./components/ChurchHome.jsx (2026-07-03 Church-module
// extraction); it mounts through the surface-mount registry like its church
// siblings. COLG_DEFAULT_CHURCH lives in ./lib/default-church.js.

// =============================================================================
// Round 14 — INBOUND TAB (Phase 1 Voice Ops)
// Fetches voicemails from the Cloudflare Worker backend (see
// /backend/voice-worker/). Per row: line · caller · transcript · audio link
// + three conversion buttons (Incident / Practice Inquiry / Project). On
// conversion, PATCHes the Worker row to status='handled' so it falls out of
// the new-queue. Local PWA carries the converted record forward in normal
// data.incidents / data.inquiries / data.projects collections.
//
// Auth: PWA holds the API token in data.voiceOps.apiToken. First load shows
// a config form to capture the Worker URL + token. Token + URL are persisted
// locally only (never committed). Setup runbook lives in backend/voice-worker/README.md.
// =============================================================================
// Inbound moved to ./components/Inbound.jsx (r33).

// BooksEntities moved to ./components/BooksEntities.jsx (r30) with inline edit.



// ThousandNinetyNine moved to ./components/Contractors1099.jsx (r25) with inline edit.

// Preparatory scaffolding — Pressure-slider component pulled out of the main
// dashboard for a planned dedicated "Pressure & Reserves" surface. Exported.
export function Pressure({ pressure, setPressure, totals, pressureCalc, reserves, projection }) {
  return (<div className="space-y-8"><section><SectionTitle>Pressure Slider</SectionTitle><div className="bg-white border border-[#1A1815] p-5"><div className="flex items-baseline justify-between mb-2"><div className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751]">Current</div><div className="text-2xl" style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{pressure}/10</div></div><input type="range" min="1" max="10" step="1" value={pressure} onChange={(e) => setPressure(parseInt(e.target.value))} className="w-full accent-[#B85838] mb-2" /><div className="flex justify-between text-[10px] uppercase tracking-wider text-[#5A5751]"><span>Loose</span><span>Moderate</span><span>Sprint</span></div><div className="mt-6 pt-6 border-t border-[#E8E4DC]"><div className="text-4xl" style={{ fontFamily: '"Fraunces", serif', fontWeight: 400 }}>{projection.debtFreeYears.toFixed(1)} years</div><div className="text-sm text-[#5A5751] mt-1">to consumer debt freedom</div></div><div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#E8E4DC] mt-6 border border-[#E8E4DC]"><MetricCell label="Gross" value={fmt(pressureCalc.grossAvailable)} small /><MetricCell label="Reserves" value={fmt(pressureCalc.reservesDeducted)} small accent="rust" /><MetricCell label="To debt" value={fmt(pressureCalc.extraAvailable)} small /><MetricCell label="Rent capture" value={fmt(pressureCalc.rentCapture)} small /></div></div></section></div>);
}

// Debts moved to ./components/Debts.jsx (r33).

// =============================================================================
// v28+ MVP v1.5 round 6 — DEV/OPS · Skills → Options engine
// Personal entrepreneurial-options matcher. PoeTech services portfolio is
// demoted below the matcher (still useful, no longer the lead).
// =============================================================================
// Opportunities moved to ./components/DevOps.jsx (r35).

// PoeTechDifferentiation + LowHangingFruit + PoeTechServicesPortfolio + PoeTechProjections + TierSlider moved to ./components/DevOps.jsx (r40).

// =============================================================================
// ABOUT — v7 with PRICING + STRONGHOLD MISSION
// =============================================================================
// =============================================================================
// PRACTICE — v9 NEW: Inquiry management for TLC Therapy Solutions
// Lead capture / inquiry tracking · pre-patient · NO PHI
// =============================================================================
// INQUIRY_SOURCES + INQUIRY_INTERESTS moved to ./components/Practice.jsx (r31/r41).

// Practice + InquiryRow + INQUIRY_STATUSES / INSURANCE_CARRIERS / insuranceLabel
// extracted to ./components/Practice.jsx (r31) per MODULAR-EXTENSIBILITY.md.
