import React, { useState, useEffect, useMemo, useRef } from 'react';
import { SectionTitle, MetricCell } from './components/shared.jsx';
import About from './components/About.jsx';
import { LegalPlaceholder } from './components/Legal.jsx';
import { Contractors1099 } from './components/Contractors1099.jsx';
import { Cart } from './components/Cart.jsx';
import { BooksEntities } from './components/BooksEntities.jsx';
import { Practice } from './components/Practice.jsx';
import { Markets } from './components/Markets.jsx';
import { Debts } from './components/Debts.jsx';
import { Inbound } from './components/Inbound.jsx';
import { Rentals } from './components/Rentals.jsx';
import { ProjectsWrapper, DateField } from './components/Projects.jsx';
import { Opportunities } from './components/DevOps.jsx';
import AuthBanner from './components/AuthBanner.jsx';
import NetworkStatus from './components/NetworkStatus.jsx';
import Imported from './components/Imported.jsx';
import { onAuthChange } from './lib/supabase.js';
import { ensureTenantMembership, uploadFeedback, subscribeFeedback } from './lib/feedback-sync.js';
import { entitiesSync } from './lib/entities-sync.js';
import { accountsSync } from './lib/accounts-sync.js';
import { debtsSync } from './lib/debts-sync.js';
import { transactionsSync } from './lib/transactions-sync.js';
import { projectsSync } from './lib/projects-sync.js';
import { inquiriesSync } from './lib/inquiries-sync.js';
import VerifyBalances from './components/VerifyBalances.jsx';
import { QueueSpotlight } from './components/QueueSpotlight.jsx';
import { QueueList } from './components/QueueList.jsx';
import { Queue } from './components/Queue.jsx';
import { computeReserves } from './lib/financial-calcs.js';
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
const SEED_DATA = {
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
    { id: 'a-chase-pers-8168', entityId: 'e-personal', name: 'Personal Checking A', institution: 'Bank A', type: 'checking', fragment: '...8168', balance: 4223 },
    { id: 'a-chase-pers-3322', entityId: 'e-personal', name: 'Personal Checking B', institution: 'Bank A', type: 'checking', fragment: '...3322', balance: 1200 },
    { id: 'a-cc-amex-dp', entityId: 'e-personal', name: 'Card J (Adam)', institution: 'Card J', type: 'credit', fragment: '...AD', balance: -19811 },
    { id: 'a-cc-chase-freedom', entityId: 'e-personal', name: 'Card F (Rewards)', institution: 'Bank A', type: 'credit', fragment: '', balance: -12992 },
    { id: 'a-cc-chase-sapph', entityId: 'e-personal', name: 'Card F (Travel)', institution: 'Bank A', type: 'credit', fragment: '', balance: -29948 },
    { id: 'a-poeprops-op', entityId: 'e-poeprops', name: 'Steward RE Operating', institution: 'TBD', type: 'checking', fragment: 'TBD', balance: 0 },
    { id: 'a-poetech-op', entityId: 'e-poetech', name: 'Cornerstone Tech Operating', institution: 'TBD', type: 'checking', fragment: 'TBD', balance: 0 },
    { id: 'a-poetech-cc', entityId: 'e-poetech', name: 'Business Card A', institution: 'Bank B', type: 'credit', fragment: '...6281', balance: -7308 },
    { id: 'a-tlc-op', entityId: 'e-tlc', name: 'Wellness Practice Operating', institution: 'TBD', type: 'checking', fragment: 'TBD', balance: 0 },
  ],
  transactions: [
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
  ], // v17/v22: project timelines with start/end dates — workload coordination · examples to show usage
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
      { id: 'r4', name: '240 Cedar Ln Apt 1', address: '240 Cedar Ln Apt 1', city: 'Cedar Heights', state: 'IL', tenantName: '', rent: 850, actual: 850, status: 'paying', entityId: 'e-poeprops', mortgage: { balance: 70000, rate: 6.50, monthlyPI: 442, escrow: 150, estimated: true } },
      { id: 'r5', name: '240 Cedar Ln Apt 2', address: '240 Cedar Ln Apt 2', city: 'Cedar Heights', state: 'IL', tenantName: '', rent: 950, actual: 950, status: 'paying', entityId: 'e-poeprops', mortgage: { balance: 70000, rate: 6.50, monthlyPI: 442, escrow: 150, estimated: true } },
      { id: 'r6', name: '240 Cedar Ln Apt 3', address: '240 Cedar Ln Apt 3', city: 'Cedar Heights', state: 'IL', tenantName: '', rent: 900, actual: 900, status: 'paying', entityId: 'e-poeprops', mortgage: { balance: 70000, rate: 6.50, monthlyPI: 442, escrow: 150, estimated: true } },
      { id: 'r7', name: '240 Cedar Ln Apt 4', address: '240 Cedar Ln Apt 4', city: 'Cedar Heights', state: 'IL', tenantName: '', rent: 1000, actual: 1000, status: 'paying', entityId: 'e-poeprops', mortgage: { balance: 70000, rate: 6.50, monthlyPI: 442, escrow: 150, estimated: true } },
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
  church: {
    name: 'Cornerstone Community Church',
    nickname: 'Your Local Church',
    site: '',
    address: 'Local address (edit on Church tab)',
    phone: '(555) 555-0100',
    officeHours: 'Mon-Fri · 11:00 am - 6:00 pm',
    contactEmail: '', // intentionally blank — user can fill in
    services: [
      { id: 'svc-sun', day: 'Sunday',    time: '11:00 AM', label: 'Worship Service', online: true },
      { id: 'svc-wed1', day: 'Wednesday', time: '1:00 PM', label: 'Bible Study',     online: true },
      { id: 'svc-wed2', day: 'Wednesday', time: '6:00 PM', label: 'Bible Study',     online: true },
    ],
    media: {
      youtube:   '',
      facebook:  '',
      instagram: '',
      broadcast: '',
    },
    links: {
      give:        '',
      giversCreed: '',
      calendar:    '',
      ministries:  '',
      bibleChallenge: '',
      classPoints: '',
      lettersFromBG: '',
      stayConnected: '',
      about: '',
      assembly: '',
    },
    tagline: 'Reviving Faith · Restoring Hope · Rebuilding Communities',
    verse: { ref: 'Psalm 34:3', text: 'O magnify the LORD with me, and let us exalt His name together.' },
  },
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
const DEMO_DATA_FAMILY_OF_4 = {
  ...SEED_DATA,
  meta: { ...SEED_DATA.meta, lastUpdated: '2026-05-28', monthOfData: 'May 2026', bufferTarget: 2000, bufferCurrent: 1450, releaseLabel: 'Sample · Family of 4' },
  entities: [
    { id: 'e-family', name: 'The Reeves Family', type: 'personal', notes: 'Two parents, two kids in school', visibleTo: ['darrell', 'christina', 'family'] }
  ],
  accounts: [
    { id: 'a-checking', entityId: 'e-family', name: 'Main Checking', institution: 'First National', type: 'checking', fragment: '...4521', balance: 3850, isPrimary: true },
    { id: 'a-savings',  entityId: 'e-family', name: 'Family Savings', institution: 'First National', type: 'savings',  fragment: '...8819', balance: 7200 },
    { id: 'a-cc-1',     entityId: 'e-family', name: 'Visa Rewards',   institution: 'Capital One',     type: 'credit',   fragment: '...3344', balance: -2150 },
    { id: 'a-auto',     entityId: 'e-family', name: 'Auto Loan',      institution: 'Credit Union',    type: 'loan',     fragment: '...1290', balance: -8400 },
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
    { id: 'd-cc-1',  entityId: 'e-family', name: 'Visa',      balance: 2150, rate: 22.99, minPayment: 75,  payoffType: 'snowball' },
    { id: 'd-auto',  entityId: 'e-family', name: 'Auto Loan', balance: 8400, rate: 6.50,  minPayment: 340, payoffType: 'snowball' },
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
  meta: { ...SEED_DATA.meta, lastUpdated: '2026-05-28', monthOfData: 'May 2026', bufferTarget: 1500, bufferCurrent: 850, releaseLabel: 'Sample · Separated co-parents' },
  entities: [
    { id: 'e-mom',    name: 'Maya (mom)',         type: 'personal', notes: 'Custodial parent · 60% time',       visibleTo: ['darrell', 'christina', 'family'] },
    { id: 'e-dad',    name: 'Jordan (dad)',       type: 'personal', notes: 'Non-custodial parent · 40% time',   visibleTo: ['darrell', 'christina', 'family'] },
    { id: 'e-shared', name: 'Shared · for Avery', type: 'personal', notes: 'Child expenses split per agreement', visibleTo: ['darrell', 'christina', 'family'] },
  ],
  accounts: [
    { id: 'a-mom-chk',   entityId: 'e-mom',    name: 'Mom · Checking',   institution: 'Chase',  type: 'checking', fragment: '...2201', balance: 2150, isPrimary: true },
    { id: 'a-mom-sav',   entityId: 'e-mom',    name: 'Mom · Savings',    institution: 'Chase',  type: 'savings',  fragment: '...8870', balance: 3400 },
    { id: 'a-dad-chk',   entityId: 'e-dad',    name: 'Dad · Checking',   institution: 'BofA',   type: 'checking', fragment: '...9912', balance: 1820, isPrimary: true },
    { id: 'a-dad-cc',    entityId: 'e-dad',    name: 'Dad · Credit',     institution: 'Capital One', type: 'credit', fragment: '...4490', balance: -1100 },
    { id: 'a-shared',    entityId: 'e-shared', name: 'Shared · Avery',   institution: 'Ally',   type: 'savings',  fragment: '...5031', balance: 480, notes: 'For agreed split expenses' },
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
  outflows: { rentalMortgages: 0, propertyUtilities: 0, household: 2925, debtService: 0, charitableGiving: 0 },
  debts: [
    { id: 'd-dad-cc', entityId: 'e-dad', name: 'Capital One', balance: 1100, rate: 21.99, minPayment: 40, payoffType: 'snowball' },
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
  meta: { ...SEED_DATA.meta, lastUpdated: '2026-05-28', monthOfData: 'May 2026', bufferTarget: 5000, bufferCurrent: 3200, releaseLabel: 'Sample · Solo professional' },
  entities: [
    { id: 'e-pers',     name: 'Sam (personal)',     type: 'personal', notes: 'Solo household',                           visibleTo: ['darrell', 'christina', 'family'] },
    { id: 'e-practice', name: 'Sam · Practice LLC', type: 'business', notes: 'Therapist / lawyer / consultant practice', visibleTo: ['darrell', 'christina'] },
  ],
  accounts: [
    { id: 'a-pers-chk',  entityId: 'e-pers',     name: 'Personal Checking',  institution: 'Chase',         type: 'checking', fragment: '...7711', balance: 4200, isPrimary: true },
    { id: 'a-pers-sav',  entityId: 'e-pers',     name: 'Personal Savings',   institution: 'Chase',         type: 'savings',  fragment: '...3320', balance: 18500 },
    { id: 'a-pract-op',  entityId: 'e-practice', name: 'Practice Operating', institution: 'Local CU',      type: 'checking', fragment: '...4490', balance: 9300, isPrimary: true },
    { id: 'a-pract-tax', entityId: 'e-practice', name: 'Practice · Tax Set-aside', institution: 'Local CU', type: 'savings', fragment: '...4495', balance: 11200 },
    { id: 'a-pers-cc',   entityId: 'e-pers',     name: 'Personal Visa',      institution: 'Capital One',   type: 'credit',   fragment: '...8821', balance: -1850 },
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
    { id: 'd-pers-cc', entityId: 'e-pers', name: 'Visa', balance: 1850, rate: 19.99, minPayment: 60, payoffType: 'snowball' },
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
  meta: { ...SEED_DATA.meta, lastUpdated: '2026-05-28', monthOfData: 'May 2026', bufferTarget: 4000, bufferCurrent: 2300, releaseLabel: 'Sample · Landlord (3 doors)' },
  entities: [
    { id: 'e-pers',  name: 'The Reynolds household', type: 'personal', notes: 'Joint household',  visibleTo: ['darrell', 'christina', 'family'] },
    { id: 'e-props', name: 'Reynolds Properties LLC', type: 'business', notes: '3 rental doors', visibleTo: ['darrell'] },
  ],
  accounts: [
    { id: 'a-pers-chk',  entityId: 'e-pers',  name: 'Personal Checking',     institution: 'Chase',   type: 'checking', fragment: '...4421', balance: 3100, isPrimary: true },
    { id: 'a-pers-sav',  entityId: 'e-pers',  name: 'Personal Savings',      institution: 'Chase',   type: 'savings',  fragment: '...9990', balance: 6800 },
    { id: 'a-props-op',  entityId: 'e-props', name: 'Properties Operating',  institution: 'Local CU', type: 'checking', fragment: '...3318', balance: 8400, isPrimary: true },
    { id: 'a-props-res', entityId: 'e-props', name: 'Properties · Capex Reserve', institution: 'Local CU', type: 'savings', fragment: '...3320', balance: 14200 },
    { id: 'a-pers-cc',   entityId: 'e-pers',  name: 'Visa',                  institution: 'Capital One', type: 'credit', fragment: '...7711', balance: -2050 },
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
    { id: 'd-cc-r', entityId: 'e-pers', name: 'Visa', balance: 2050, rate: 21.99, minPayment: 65, payoffType: 'snowball' },
  ],
  watchlist: ['spy.us', 'iyr.us'],
  church: { name: 'Your home church', nickname: '', site: '', address: '', phone: '', officeHours: '', contactEmail: '', services: [], media: {}, links: {}, tagline: 'Where your family worships and serves', verse: { ref: 'Psalm 1:1', text: 'Blessed is the man who walks not in the counsel of the wicked.' } },
  voiceOps: { apiUrl: '', apiToken: '', rates: { perCallMinute: 0.0085, perTranscriptMinute: 0.05, perNumberMonthly: 1.15 }, numbersConfigured: 0, budgetAlertMonthly: 30 },
  pressureMappings: { ...SEED_DATA.pressureMappings },
};

// SCOPE_TEMPLATES moved to ./components/Projects.jsx (r41).
// =============================================================================
// REMINDER OPTIONS — for event reminders
// =============================================================================
const REMINDER_OPTIONS = [
  { key: 'at-time',       label: 'At event time',  offsetMinutes: 0 },
  { key: '30m-before',    label: '30 minutes before', offsetMinutes: 30 },
  { key: '1h-before',     label: '1 hour before',  offsetMinutes: 60 },
  { key: '4h-before',     label: '4 hours before', offsetMinutes: 240 },
  { key: '1d-before',     label: '1 day before',   offsetMinutes: 1440 },
  { key: '3d-before',     label: '3 days before',  offsetMinutes: 4320 },
  { key: '1w-before',     label: '1 week before',  offsetMinutes: 10080 },
  { key: '2w-before',     label: '2 weeks before', offsetMinutes: 20160 },
  { key: '1mo-before',    label: '1 month before', offsetMinutes: 43200 },
];

const EVENT_CATEGORIES = [
  'appointment', 'deadline', 'payment due', 'meeting', 'inspection',
  'family', 'medical', 'school', 'church', 'business', 'milestone',
  'birthday', 'anniversary', 'travel', 'tech-repair', 'tech-incident', 'other'
];

// v17: Projects · Timeline · Workload Coordination
// Round 11 — Added 'tbd' (to be decided). When auto-creating a project would
// push the family over their available hours/week, the new project lands here
// as a parking lot until capacity opens up or the user explicitly promotes it.
// TBD projects DON'T count toward workload forecast or Action Queue.
// PROJECT_STATUSES moved to ./components/Projects.jsx
const PROJECT_STATUSES_ACTIVE = ['planning', 'active', 'ending-soon']; // count toward capacity

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
const fmt = (n) => n == null || !isFinite(n) ? '—' : `${n < 0 ? '-' : ''}$${Math.abs(Math.round(n)).toLocaleString()}`;
const fmtCompact = (n) => { if (n == null || !isFinite(n)) return '—'; const a = Math.abs(n); const sign = n < 0 ? '-' : ''; if (a >= 1000000000) return `${sign}$${(a/1000000000).toFixed(2)}B`; if (a >= 1000000) return `${sign}$${(a/1000000).toFixed(1)}M`; if (a >= 1000) return `${sign}$${Math.round(a/1000)}k`; return `${sign}$${Math.round(a)}`; };
const MONTHS_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function monthLabel(d, offset) { const x = new Date(d.getFullYear(), d.getMonth() + offset, 1); return `${MONTHS_ABBR[x.getMonth()]} '${String(x.getFullYear()).slice(2)}`; }

// =============================================================================
// Lifecycle & Handoff helpers — per /docs/00-foundations/_root/LIFECYCLE-AND-HANDOFF.md
// Every status change on a trackable entity (incident / project / inquiry /
// feedback / capex / inbound) writes a lifecycle log entry. Net effect: when a
// new handler picks up an item, they see what was done, by whom, when, and why.
// No verbal handoff required — the system IS the handoff.
//
// Data shape attached to each entity:
//   item.lifecycle = {
//     phase: 'in-progress',          // current state (mirrors item.status)
//     openedAt: '2026-05-18T...',    // when this item was first created
//     closedAt: null | '2026-...',   // set when item reaches a terminal phase
//     log: [
//       { at, fromPhase, toPhase, by, note },
//       ...
//     ]
//   }
// =============================================================================
const LIFECYCLE_TERMINAL_PHASES = new Set([
  'resolved', 'closed', 'complete', 'completed', 'shipped',
  'declined', 'wont-fix', 'archived', 'converted', 'handled', 'discarded'
]);

// Pure function. Returns a NEW item with the lifecycle log appended, phase
// updated, and openedAt/closedAt timestamps set. Safe to call repeatedly — if
// the phase didn't actually change AND a log entry already exists, it's a no-op
// so the log doesn't get polluted by save buttons that don't change status.
function appendLifecycleLog(item, toPhase, by = 'user', note = '') {
  const at = new Date().toISOString();
  const fromPhase = item.status || (item.lifecycle && item.lifecycle.phase) || null;
  const existingLog = (item.lifecycle && Array.isArray(item.lifecycle.log)) ? item.lifecycle.log : [];
  if (fromPhase === toPhase && existingLog.length > 0) return item;
  const openedAt = (item.lifecycle && item.lifecycle.openedAt) || item.createdAt || item.receivedAt || at;
  const isTerminal = LIFECYCLE_TERMINAL_PHASES.has(toPhase);
  return {
    ...item,
    status: toPhase,
    lifecycle: {
      phase: toPhase,
      openedAt,
      closedAt: isTerminal ? at : null,
      log: [...existingLog, { at, fromPhase, toPhase, by, note }],
    },
  };
}

// For records that pre-date the lifecycle pattern: synthesize a one-entry log
// from current status. Idempotent — returns the item unchanged if a lifecycle
// already exists. Used inline at display time so we never bulk-rewrite stored
// data on load (which would be risky).
function ensureLifecycle(item, by = 'system') {
  if (item && item.lifecycle && Array.isArray(item.lifecycle.log)) return item;
  if (!item) return item;
  const phase = item.status || 'new';
  const at = item.createdAt || item.receivedAt || new Date().toISOString();
  const isTerminal = LIFECYCLE_TERMINAL_PHASES.has(phase);
  return {
    ...item,
    status: phase,
    lifecycle: {
      phase,
      openedAt: at,
      closedAt: isTerminal ? (item.resolvedAt || item.closedAt || at) : null,
      log: [{ at, fromPhase: null, toPhase: phase, by, note: 'created' }],
    },
  };
}
export function frequencyToMonthly(amount, frequency) { switch (frequency) { case 'monthly': return amount; case 'quarterly': return amount / 3; case 'semi-annual': return amount / 6; case 'annual': return amount / 12; case 'biennial': return amount / 24; default: return 0; } }

// =============================================================================
// CONNECTED-CONTEXT helpers (r36) — per /docs/00-foundations/_root/CONNECTED-CONTEXT.md
// Every entity carries links: [] — bidirectional connections to other entities.
// Append-only by design; manual links and auto-matched links share the shape.
// =============================================================================
function makeLink({ toEntityType, toEntityId, kind = 'related', source = 'auto', by = 'system', note = '' }) {
  return {
    id: `l-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    toEntityType, toEntityId, kind, source, by, note,
    at: new Date().toISOString(),
  };
}
// Preparatory scaffolding for CONNECTED-CONTEXT tasks #88-#90 — exported so
// the pending UI work can import directly rather than duplicate. Not yet
// consumed in the monolith; ESLint sees the export as the use.
export function ensureLinks(item) {
  if (!item) return item;
  if (Array.isArray(item.links)) return item;
  return { ...item, links: [] };
}
// Pure auto-link matcher per CONNECTED-CONTEXT Pattern 2. Returns top-N matches
// of a given entity type for a new item. Matching strategy varies per type.
// Preparatory scaffolding for CONNECTED-CONTEXT tasks #88-#90 — exported.
export function findRelatedAuto(newItem, entityType, allData, maxResults = 10) {
  if (!newItem) return [];
  const matches = [];
  // Property-scoped: incidents mentioning the same property id. Reads the
  // canonical `linkedTo: { type, id }` shape used by every addIncident call
  // site (BigPicture Action Queue, Rentals tenant-late, Inbound convert).
  if (entityType === 'incident' && newItem.linkedTo?.type === 'rental' && newItem.linkedTo?.id) {
    (allData.incidents || []).forEach(i => {
      if (i.id !== newItem.id && i.linkedTo?.type === 'rental' && i.linkedTo?.id === newItem.linkedTo.id) {
        matches.push({ toEntityType: 'incident', toEntityId: i.id, kind: 'same-property' });
      }
    });
  }
  // Same-caller voicemails
  if (entityType === 'inbound' && newItem.caller) {
    (allData.inbound || []).forEach(c => {
      if (c.id !== newItem.id && c.caller === newItem.caller) {
        matches.push({ toEntityType: 'inbound', toEntityId: c.id, kind: 'same-caller' });
      }
    });
  }
  // Same-source inquiries
  if (entityType === 'inquiry' && newItem.source) {
    (allData.inquiries || []).forEach(i => {
      if (i.id !== newItem.id && i.source === newItem.source) {
        matches.push({ toEntityType: 'inquiry', toEntityId: i.id, kind: 'same-source' });
      }
    });
  }
  // Same-view feedback
  if (entityType === 'feedback' && newItem.currentView) {
    (allData.feedback || []).forEach(f => {
      if (f.id !== newItem.id && f.currentView === newItem.currentView) {
        matches.push({ toEntityType: 'feedback', toEntityId: f.id, kind: 'same-view' });
      }
    });
  }
  // Sort newest-first (heuristic: longer IDs include later timestamps from Date.now())
  return matches.slice(0, maxResults).map(m => makeLink({ ...m, source: 'auto', by: 'system' }));
}

// =============================================================================
// ECOSYSTEM-PARTICIPANTS (r36) — externalProfile shape attached to
// contractors and rentals. No portal UI yet (Phase 3a); data shape lays the
// foundation so existing records get the field for free.
// =============================================================================
// Preparatory scaffolding for ECOSYSTEM-PARTICIPANTS tasks #115-#118 — exported.
export function ensureExternalProfile(item, type) {
  if (!item) return item;
  if (item.externalProfile && typeof item.externalProfile === 'object') return item;
  const defaultPerms = {
    contractor: ['view-assigned-projects', 'view-own-payments-ytd', 'submit-status-update', 'message-project-owner'],
    tenant:     ['view-own-lease', 'view-own-rent-history', 'submit-maintenance-request', 'message-landlord'],
  };
  return {
    ...item,
    externalProfile: {
      name: item.name || (item.tenantName || ''),
      email: item.email || (item.tenantEmail || ''),
      phone: item.phone || (item.tenantPhone || ''),
      permissions: defaultPerms[type] || [],
      inviteStatus: 'not-invited',
      invitedAt: null,
      invitedBy: null,
      acceptedAt: null,
      lastSeenAt: null,
      notes: '',
    },
  };
}
function eventDateTime(event) {
  const time = event.time || (event.allDay ? '09:00' : '12:00');
  return new Date(`${event.date}T${time}`);
}
function relativeWhen(eventDate) {
  const now = new Date();
  const diffMs = eventDate.getTime() - now.getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < -60 * 24) return `${Math.abs(Math.round(diffMin / 1440))}d ago`;
  if (diffMin < 0) return `${Math.abs(Math.round(diffMin / 60))}h ago`;
  if (diffMin < 60) return `in ${diffMin}m`;
  if (diffMin < 1440) return `in ${Math.round(diffMin / 60)}h`;
  if (diffMin < 1440 * 30) return `in ${Math.round(diffMin / 1440)}d`;
  return `in ${Math.round(diffMin / 43200)}mo`;
}

export function projectDebt(debts, monthlyExtraAvailable, currentDate, maxMonths = 240) {
  let activeDebts = debts.filter((d) => !d.leaveAlone).map((d) => ({ ...d, currentBalance: d.balance, clearedAtMonth: null }));
  const projection = []; let totalInterestPaid = 0;
  for (let m = 1; m <= maxMonths; m++) {
    activeDebts.forEach((d) => { if (d.currentBalance > 0 && d.rate > 0) { const interest = d.currentBalance * (d.rate / 100 / 12); d.currentBalance += interest; totalInterestPaid += interest; } });
    let pool = monthlyExtraAvailable;
    activeDebts.forEach((d) => { if (d.currentBalance > 0) { const pay = Math.min(d.minPayment, d.currentBalance); d.currentBalance -= pay; pool -= pay; if (d.currentBalance <= 0.01 && !d.clearedAtMonth) { d.clearedAtMonth = m; d.currentBalance = 0; } } });
    let safety = 0;
    while (pool > 0.01 && safety < 100) { safety++; const target = activeDebts.filter((d) => d.currentBalance > 0).sort((a, b) => b.rate - a.rate)[0]; if (!target) break; const pay = Math.min(pool, target.currentBalance); target.currentBalance -= pay; pool -= pay; if (target.currentBalance <= 0.01) { target.clearedAtMonth = m; target.currentBalance = 0; } }
    const totalBalance = activeDebts.reduce((s, d) => s + Math.max(d.currentBalance, 0), 0);
    projection.push({ monthOffset: m, label: monthLabel(currentDate, m), debtBalance: Math.round(totalBalance) });
    if (totalBalance <= 1) break;
  }
  return { projection, debtFreeMonth: projection.length, debtFreeYears: projection.length / 12, debtFreeDate: monthLabel(currentDate, projection.length), totalInterestPaid: Math.round(totalInterestPaid) };
}

// v12: Debt snowball with sort strategy and cascade tracking — mirrors rental snowball architecture
export function projectDebtSnowball(debts, monthlyExtra, sortOrder, currentDate, maxMonths = 360) {
  let active = debts.filter(d => !d.leaveAlone).map(d => ({ id: d.id, name: d.name, rate: d.rate, minPayment: d.minPayment, originalBalance: d.balance, currentBalance: d.balance, clearedAtMonth: null, interestPaid: 0, flag: d.flag, entityId: d.entityId }));

  function sortQueue(list) {
    return [...list].filter(d => d.currentBalance > 0).sort((a, b) => {
      if (sortOrder === 'snowball') return a.currentBalance - b.currentBalance; // smallest balance first (momentum)
      if (sortOrder === 'avalanche') return b.rate - a.rate; // highest rate first (math optimum)
      if (sortOrder === 'hybrid') {
        // Clear anything under $1500 first (psychological wins), then avalanche
        const aSmall = a.currentBalance < 1500;
        const bSmall = b.currentBalance < 1500;
        if (aSmall && !bSmall) return -1;
        if (!aSmall && bSmall) return 1;
        if (aSmall && bSmall) return a.currentBalance - b.currentBalance;
        return b.rate - a.rate;
      }
      return a.currentBalance - b.currentBalance;
    });
  }

  let freedFromSnowball = 0;
  const monthlyHistory = [];

  for (let m = 1; m <= maxMonths; m++) {
    // Accrue interest
    active.forEach(d => { if (d.currentBalance > 0 && d.rate > 0) { const interest = d.currentBalance * (d.rate / 100 / 12); d.currentBalance += interest; d.interestPaid += interest; } });

    // Pay minimums
    active.forEach(d => {
      if (d.currentBalance > 0) {
        const pay = Math.min(d.minPayment, d.currentBalance);
        d.currentBalance -= pay;
        if (d.currentBalance <= 0.01 && !d.clearedAtMonth) {
          d.clearedAtMonth = m;
          d.currentBalance = 0;
          freedFromSnowball += d.minPayment;
        }
      }
    });

    // Apply extra + freed snowball to target debt per sort order
    let pool = monthlyExtra + freedFromSnowball;
    let safety = 0;
    while (pool > 0.01 && safety < 100) {
      safety++;
      const queue = sortQueue(active);
      if (queue.length === 0) break;
      const target = queue[0];
      const pay = Math.min(pool, target.currentBalance);
      target.currentBalance -= pay;
      pool -= pay;
      if (target.currentBalance <= 0.01) {
        target.clearedAtMonth = m;
        target.currentBalance = 0;
        freedFromSnowball += target.minPayment;
      }
    }

    const totalBalance = active.reduce((s, d) => s + Math.max(d.currentBalance, 0), 0);
    monthlyHistory.push({ monthOffset: m, label: monthLabel(currentDate, m), totalBalance: Math.round(totalBalance) });
    if (totalBalance <= 1) break;
  }

  return {
    monthlyHistory,
    allClearedMonth: monthlyHistory.length,
    allClearedYears: monthlyHistory.length / 12,
    allClearedDate: monthLabel(currentDate, monthlyHistory.length),
    activeDebts: active,
    totalInterest: Math.round(active.reduce((s, d) => s + d.interestPaid, 0)),
    finalFreedCashFlow: Math.round(freedFromSnowball),
  };
}

// v12: Minimum-only baseline for interest-saved comparison
export function projectDebtMinimumOnly(debts, currentDate, maxMonths = 600) {
  let active = debts.filter(d => !d.leaveAlone).map(d => ({ id: d.id, currentBalance: d.balance, originalBalance: d.balance, rate: d.rate, minPayment: d.minPayment, clearedAtMonth: null, interestPaid: 0, stuck: false }));

  for (let m = 1; m <= maxMonths; m++) {
    active.forEach(d => {
      if (d.currentBalance > 0 && !d.stuck) {
        const interest = d.currentBalance * (d.rate / 100 / 12);
        d.currentBalance += interest;
        d.interestPaid += interest;
        const pay = Math.min(d.minPayment, d.currentBalance);
        d.currentBalance -= pay;
        // If min payment isn't even covering interest, mark as stuck (will never pay off at this rate)
        if (pay <= interest * 1.01 && d.currentBalance > d.originalBalance * 0.99) {
          d.stuck = true;
        }
        if (d.currentBalance <= 0.01 && !d.clearedAtMonth) { d.clearedAtMonth = m; d.currentBalance = 0; }
      }
    });
    const allCleared = active.every(d => d.currentBalance <= 0.01 || d.stuck);
    if (allCleared) break;
  }

  const stuckDebts = active.filter(d => d.stuck);
  const totalInterest = Math.round(active.reduce((s, d) => s + d.interestPaid, 0));
  const longestPayoff = Math.max(...active.filter(d => d.clearedAtMonth).map(d => d.clearedAtMonth), 0);
  return { totalInterest, longestPayoff, stuckDebts, allCleared: stuckDebts.length === 0 };
}


export function projectRentalSnowball(rentals, monthlyExtra, sortOrder, currentDate, maxMonths = 240) {
  let active = rentals.map(r => ({ id: r.id, name: r.name, rent: r.rent, currentBalance: r.mortgage.balance, originalBalance: r.mortgage.balance, rate: r.mortgage.rate, monthlyPI: r.mortgage.monthlyPI, escrow: r.mortgage.escrow, clearedAtMonth: null, interestPaid: 0 }));
  function sortQueue(list) { return [...list].filter(r => r.currentBalance > 0).sort((a, b) => { if (sortOrder === 'smallest-balance') return a.currentBalance - b.currentBalance; if (sortOrder === 'highest-rate') return b.rate - a.rate; if (sortOrder === 'best-cashflow') return (b.rent - b.monthlyPI - b.escrow) - (a.rent - a.monthlyPI - a.escrow); return a.currentBalance - b.currentBalance; }); }
  const monthlyHistory = []; let freedFromSnowball = 0;
  for (let m = 1; m <= maxMonths; m++) {
    active.forEach(r => { if (r.currentBalance > 0) { const interest = r.currentBalance * (r.rate / 100 / 12); r.currentBalance += interest; r.interestPaid += interest; } });
    active.forEach(r => { if (r.currentBalance > 0) { const pay = Math.min(r.monthlyPI, r.currentBalance); r.currentBalance -= pay; if (r.currentBalance <= 0.01 && !r.clearedAtMonth) { r.clearedAtMonth = m; r.currentBalance = 0; freedFromSnowball += r.monthlyPI; } } });
    let pool = monthlyExtra + freedFromSnowball; let safety = 0;
    while (pool > 0.01 && safety < 50) { safety++; const queue = sortQueue(active); if (queue.length === 0) break; const target = queue[0]; const pay = Math.min(pool, target.currentBalance); target.currentBalance -= pay; pool -= pay; if (target.currentBalance <= 0.01) { target.clearedAtMonth = m; target.currentBalance = 0; freedFromSnowball += target.monthlyPI; } }
    const totalBalance = active.reduce((s, r) => s + Math.max(r.currentBalance, 0), 0);
    monthlyHistory.push({ monthOffset: m, label: monthLabel(currentDate, m), totalBalance: Math.round(totalBalance) });
    if (totalBalance <= 1) break;
  }
  return { monthlyHistory, allClearedMonth: monthlyHistory.length, allClearedYears: monthlyHistory.length / 12, allClearedDate: monthLabel(currentDate, monthlyHistory.length), activeProperties: active, totalInterest: Math.round(active.reduce((s, r) => s + r.interestPaid, 0)), finalFreedCashFlow: Math.round(freedFromSnowball) };
}

export function findExtraForTarget(rentals, targetYears, currentDate) {
  let lo = 0, hi = 50000, bestExtra = hi;
  for (let i = 0; i < 30; i++) { const mid = (lo + hi) / 2; const result = projectRentalSnowball(rentals, mid, 'smallest-balance', currentDate, targetYears * 12 + 24); if (result.allClearedYears <= targetYears) { bestExtra = mid; hi = mid; } else { lo = mid; } if (hi - lo < 50) break; }
  return Math.ceil(bestExtra);
}

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
    return ['family-of-4', 'separated', 'professional', 'landlord'].includes(p) ? p
      // Shipped-soon personas land on the picker so the URL stays honest.
      : ['family-of-1', 'family-of-2', 'family-of-3', 'family-of-5', 'family-of-7', 'community', 'church', 'lawyer', 'therapist'].includes(p) ? 'picker'
      // Legacy alias for the first-cut family demo.
      : p === 'family' ? 'family-of-4'
      : 'picker';
  } catch (e) { return null; }
}
const DEMO_DATA_BY_PERSONA = {
  'family-of-4': DEMO_DATA_FAMILY_OF_4,
  'separated':   DEMO_DATA_SEPARATED,
  'professional':DEMO_DATA_PROFESSIONAL,
  'landlord':    DEMO_DATA_LANDLORD,
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
const DEMO_PERSONA_META = {
  'family-of-4': {
    free: true,
    label: 'For your family',
    headline: 'Know what\'s covered before the 1st — without guessing.',
    summary: 'Two parents, two kids in school.',
    audience: 'Married couples with school-age children.',
    pitch: 'Every dollar in one place. Bills, paycheck, tithe, groceries, debt. On every screen the system tells you what to do, when, why, and how. The 1st stops being a scramble.',
    vision: 'Multi-device per-profile views shipped — Naomi, Adam, and "Family" rollup all work today. Anonymous in-app specialist messaging is in design.',
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

export default function PoeFinancialSystem() {
  const demoPersona = getDemoPersona();
  const isPickerMode = demoPersona === 'picker';
  const isDemoMode = !!demoPersona && !isPickerMode;
  // Suppress storage/save/network either way — picker is also a "demo" state.
  const isAnyDemoMode = !!demoPersona;

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
      if (!!demoPersona) return false;
      const sp = new URLSearchParams(window.location.search);
      if (sp.toString() !== '') return false;
      if (localStorage.getItem('poe-landing-seen')) return false;
      if (localStorage.getItem('poe-current-profile')) return false;
      return true;
    } catch (e) { return false; }
  })();
  const [data, setData] = useState(
    isDemoMode ? DEMO_DATA_BY_PERSONA[demoPersona]
      : isPickerMode ? DEMO_DATA_FAMILY_OF_4
      : isFirstTimeLandingBoot ? DEMO_DATA_FAMILY_OF_4
      : SEED_DATA
  );
  const [pressure, setPressure] = useState(5);
  const [view, setView] = useState('overview');
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [booksView, setBooksView] = useState('calendar');
  const [entityFilter, setEntityFilter] = useState('all');
  const [snowballSort, setSnowballSort] = useState('smallest-balance');
  const [snowballExtra, setSnowballExtra] = useState(2000);
  const [debtSnowballSort, setDebtSnowballSort] = useState('snowball');
  const [debtSnowballExtra, setDebtSnowballExtra] = useState(500);
  const [theme, setTheme] = useState('midnight');
  const [notifPermission, setNotifPermission] = useState(typeof Notification !== 'undefined' ? Notification.permission : 'unsupported');
  const [loaded, setLoaded] = useState(false);
  const firedRemindersRef = useRef(new Set());
  const currentDate = useMemo(() => new Date(2026, 4, 15), []);

  // Layer 2 — cross-device feedback sync. Local feedback (data.feedback)
  // stays in localStorage; remote-authored feedback from other devices
  // lives in this separate state slice and gets merged into the array
  // passed to About.jsx. We deliberately do NOT mirror remote items into
  // data.feedback because the storage save effect would then persist
  // them to localStorage too, duplicating data.
  const [remoteFeedback, setRemoteFeedback] = useState([]);
  const [authSession, setAuthSession] = useState(null);
  const [showVerifyBalances, setShowVerifyBalances] = useState(false);

  // Multi-user Layer A (2026-05-28) — `currentProfile` gates which entities
  // the user sees. Stored separately from `data` so it doesn't pollute the
  // sync model; persists in localStorage so the picker only shows once.
  // Layer B (workflow 21 + session token) will add real auth on top. See
  // docs/99-session-notes/2026-05-28-brief-multi-user-profiles.md.
  const [currentProfile, setCurrentProfile] = useState(() => {
    if (isAnyDemoMode) return 'family'; // Demo + picker skip profile picker.
    try { return localStorage.getItem('poe-current-profile') || null; }
    catch (e) { return null; }
  });
  const setProfile = (p) => {
    setCurrentProfile(p);
    try { if (p) localStorage.setItem('poe-current-profile', p); else localStorage.removeItem('poe-current-profile'); }
    catch (e) {}
    // Reset entity filter when switching profiles so we never leave it
    // pointing at an entity the new profile can't see.
    setEntityFilter('all');
  };
  const PROFILES = [
    { id: 'darrell', name: 'Adam', sub: 'full owner view', accent: '#1A1815' },
    { id: 'christina', name: 'Naomi', sub: 'personal + practice', accent: '#B85838' },
    { id: 'family', name: 'Family', sub: 'household roll-up only', accent: '#5A6E3D' },
  ];

  // Security gate for the Books -> Imported subview, which surfaces real bank +
  // Gmail PII from n8n workflow 18 (Chase payees, Zelle recipients, Cash App).
  // Until Multi-user Layer B PIN auth ships, the closest signal for "this is
  // the family on their own device viewing their own data" is an established
  // saved profile (poe-current-profile). It is null for every public /
  // incognito / returning-but-unauthenticated visitor to poetech.us, and
  // forced to a demo value in any ?demo / picker state. So real imported
  // transactions render ONLY when not in any demo state AND a real profile is
  // set. Everyone else gets the tab hidden + a guard instead of the fetch.
  const importedAllowed = !isAnyDemoMode && !!currentProfile;

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

  // Family Suggest button — 2026-05-29. Floating button visible on every
  // screen. Opens a small modal where any family member can drop feedback
  // (bug / feature / copy edit / question / strategic). POSTs to n8n
  // workflow 30 (/webhook/family-feedback) which writes to
  // /data/finance-events/family-feedback/ and pushes ntfy. Foundation
  // Agent's 7am cron (workflow 31, queued) summarizes for the morning
  // digest. Per BUSINESS-PROCESS-CONNECTIONS Family-Voice-Is-The-Connection
  // extension: family voice is wired within 24 hours, every time.
  //
  // The sender is read from the current profile in localStorage. Falls
  // back to 'unknown' if no profile is set (demo mode visitors).
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggestForm, setSuggestForm] = useState({ type: '', message: '' });
  const [suggestState, setSuggestState] = useState({ submitting: false, success: false, error: null, id: null });
  const submitSuggest = async () => {
    if (!suggestForm.message || suggestForm.message.trim().length < 3) {
      setSuggestState({ submitting: false, success: false, error: 'Tell us what you noticed - a sentence or two is plenty.', id: null });
      return;
    }
    setSuggestState({ submitting: true, success: false, error: null, id: null });
    const base = N8N_BASE;
    if (!base) {
      setSuggestState({ submitting: false, success: false, error: 'Feedback channel is temporarily offline. Please try again later or email darrellpoe06@gmail.com.', id: null });
      return;
    }
    let senderHandle = 'unknown';
    try {
      const prof = (typeof window !== 'undefined' && window.localStorage)
        ? window.localStorage.getItem('poe-current-profile')
        : null;
      if (prof === 'darrell') senderHandle = 'dpoe';
      else if (prof === 'christina') senderHandle = 'cpoe';
      else if (prof === 'christiana') senderHandle = 'christiana';
      else if (prof === 'christian') senderHandle = 'christian'; // twin son, 10
      else if (prof === 'christyn') senderHandle = 'christyn';   // twin daughter, 10
      else if (prof === 'family') senderHandle = 'dpoe';
    } catch (_) { /* localStorage blocked or unavailable */ }
    const screenContext = {
      path: (typeof window !== 'undefined' && window.location) ? window.location.pathname + window.location.search : '/',
      tab: (typeof activeTab === 'string') ? activeTab : (typeof tab === 'string' ? tab : null),
      persona: (typeof demoPersona === 'string') ? demoPersona : null,
      is_demo: typeof isDemoMode === 'boolean' ? isDemoMode : null
    };
    try {
      const url = `${base.replace(/\/+$/, '')}/webhook/family-feedback`;
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        mode: 'cors',
        body: JSON.stringify({
          sender: senderHandle,
          type: suggestForm.type || 'other',
          message: suggestForm.message.trim(),
          screen_context: screenContext,
          user_agent: (typeof navigator !== 'undefined') ? navigator.userAgent : '',
          source: 'poetech.us'
        })
      });
      const json = await r.json().catch(() => ({}));
      if (!r.ok || json.ok === false) {
        setSuggestState({ submitting: false, success: false, error: json.error || `Submission failed (HTTP ${r.status}). Please try again.`, id: null });
        return;
      }
      setSuggestState({ submitting: false, success: true, error: null, id: json.id || null });
      // Auto-close success state after 3s so the floating button doesn't
      // stay obtrusive after a successful submission.
      setTimeout(() => {
        setSuggestOpen(false);
        setSuggestForm({ type: '', message: '' });
        setSuggestState({ submitting: false, success: false, error: null, id: null });
      }, 3000);
    } catch (e) {
      setSuggestState({ submitting: false, success: false, error: `Could not reach the feedback endpoint: ${e.message}.`, id: null });
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
  const [ingestData, setIngestData] = useState({
    transactions: [], gmail_events: [], bank_balances: {},
    counts: { total_bank: 0, total_gmail: 0, status_counts: {}, institutions: [] },
    served_at: null,
    meta: { loaded: false, error: null }
  });
  useEffect(() => {
    if (!importedAllowed) { setIngestData(d => ({ ...d, meta: { loaded: true, error: null } })); return; } // Only the family on their own device (not demo / picker / profileless public) calls the wf18 PII webhook.
    const base = N8N_BASE;
    if (!base) {
      setIngestData(d => ({ ...d, meta: { loaded: true, error: 'VITE_N8N_WEBHOOK_BASE not set — ingest overlay disabled' } }));
      return;
    }
    let cancelled = false;
    const load = async () => {
      try {
        const url = `${base.replace(/\/+$/, '')}/webhook/imported-transactions?limit=5000`;
        const r = await fetch(url, { headers: { Accept: 'application/json' }, mode: 'cors' });
        if (!r.ok) throw new Error(`Workflow 18 returned ${r.status}`);
        const json = await r.json();
        if (cancelled) return;
        setIngestData({
          transactions: json.transactions || [],
          gmail_events: json.gmail_events || [],
          bank_balances: json.bank_balances || {},
          counts: json.counts || { total_bank: 0, total_gmail: 0, status_counts: {}, institutions: [] },
          served_at: json.served_at || null,
          meta: { loaded: true, error: null }
        });
      } catch (e) {
        if (cancelled) return;
        setIngestData(d => ({ ...d, meta: { loaded: true, error: `Could not reach workflow 18: ${e.message}` } }));
      }
    };
    load();
    const id = setInterval(load, 300_000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  useEffect(() => {
    if (isAnyDemoMode) { setLoaded(true); return; } // Demo + picker skip storage load entirely.
    (async () => {
      try {
        let saved = await window.storage.get('poe-financial-v28');
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
      } catch (e) {}
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    if (isAnyDemoMode) return; // Demo + picker mode never write to localStorage.
    (async () => { try { await window.storage.set('poe-financial-v28', JSON.stringify({ data, pressure, snowballSort, snowballExtra, debtSnowballSort, debtSnowballExtra, theme })); } catch (e) { console.error('Storage failed', e); } })();
  }, [data, pressure, snowballSort, snowballExtra, debtSnowballSort, debtSnowballExtra, theme, loaded, isAnyDemoMode]);

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
        console.warn('[auth] tenant join failed', e);
        return;
      }
      unsubscribeFeedback = subscribeFeedback((items) => setRemoteFeedback(items));

      // Entities sync (no verify-gate needed — no load-bearing numbers).
      // Initial sync uploads any local entities not yet in Supabase, then
      // pulls the merged set. Realtime subscription keeps subsequent edits
      // from other devices flowing in.
      try {
        const localEntities = (typeof window !== 'undefined' && window.__POETECH_LATEST_DATA__)
          ? (window.__POETECH_LATEST_DATA__.entities || [])
          : [];
        const result = await entitiesSync.initialSync(localEntities);
        if (result && result.merged) {
          setData(d => ({ ...d, entities: result.merged }));
        }
      } catch (e) {
        console.warn('[auth] entities initial sync failed', e);
      }
      unsubscribeEntities = entitiesSync.subscribe((items) => {
        setData(d => ({ ...d, entities: items }));
      });
    });
    return () => {
      cleanupAuth();
      if (unsubscribeFeedback) unsubscribeFeedback();
      if (unsubscribeEntities) unsubscribeEntities();
    };
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
    let unsub = onAuthChange((session) => setAuthSession(session));
    return unsub;
  }, []);

  useEffect(() => {
    if (!authSession) {
      setShowVerifyBalances(false);
      return;
    }
    if (!data.numericSyncVerifiedAt) {
      setShowVerifyBalances(true);
      return;
    }
    setShowVerifyBalances(false);

    const cleanups = [];
    let cancelled = false;

    async function start() {
      const latest = (typeof window !== 'undefined' && window.__POETECH_LATEST_DATA__) || data;
      const tables = [
        { sync: accountsSync,     key: 'accounts',     localList: latest.accounts || [] },
        { sync: debtsSync,        key: 'debts',        localList: latest.debts || [] },
        { sync: transactionsSync, key: 'transactions', localList: latest.transactions || [] },
        { sync: projectsSync,     key: 'projects',     localList: latest.projects || [] },
        { sync: inquiriesSync,    key: 'inquiries',    localList: latest.inquiries || [] },
      ];
      for (const t of tables) {
        if (cancelled) return;
        try {
          const result = await t.sync.initialSync(t.localList);
          if (!cancelled && result && result.merged) {
            setData(d => ({ ...d, [t.key]: result.merged }));
          }
        } catch (e) {
          console.warn(`[${t.sync.remoteTable}-sync] initial sync failed`, e);
        }
        if (cancelled) return;
        const unsubscribe = t.sync.subscribe((items) => {
          setData(d => ({ ...d, [t.key]: items }));
        });
        cleanups.push(unsubscribe);
      }
    }
    start();

    return () => {
      cancelled = true;
      cleanups.forEach(fn => { try { fn && fn(); } catch (_) {} });
    };
  }, [authSession, data.numericSyncVerifiedAt]);

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
  const addIncident = (item) => setData(d => {
    const nowIso = new Date().toISOString();
    const initialStatus = item.status || 'open';
    const seeded = {
      urgency: 'incident',
      status: initialStatus,
      dueDate: dueDateFor(item.urgency || 'incident'),
      ...item,
      id: `in-${Date.now()}`,
      createdAt: item.createdAt || nowIso,
      lifecycle: {
        phase: initialStatus,
        openedAt: item.createdAt || nowIso,
        closedAt: LIFECYCLE_TERMINAL_PHASES.has(initialStatus) ? nowIso : null,
        log: [{ at: nowIso, fromPhase: null, toPhase: initialStatus, by: 'user', note: item._note || 'created' }],
      },
    };
    return { ...d, incidents: [...d.incidents, seeded] };
  });
  const updateIncident = (id, updates) => setData(d => ({
    ...d,
    incidents: d.incidents.map(i => {
      if (i.id !== id) return i;
      const withLifecycle = ensureLifecycle(i);
      const merged = { ...withLifecycle, ...updates };
      // If status changed, route through appendLifecycleLog to write a log entry.
      if (updates.status && updates.status !== withLifecycle.status) {
        return appendLifecycleLog(merged, updates.status, updates._by || 'user', updates._note || '');
      }
      return merged;
    }),
  }));
  const resolveIncident = (id) => updateIncident(id, { status: 'resolved', resolvedAt: new Date().toISOString().slice(0, 10), _note: 'Marked resolved' });
  const addEvent = (item) => setData(d => ({ ...d, events: [...(d.events || []), { ...item, id: `ev-${Date.now()}`, createdAt: new Date().toISOString(), completedAt: null }] }));
  const completeEvent = (id) => setData(d => ({ ...d, events: (d.events || []).map(e => e.id === id ? { ...e, completedAt: new Date().toISOString() } : e) }));
  // Projects — same lifecycle pattern.
  const addProject = (item) => setData(d => {
    const nowIso = new Date().toISOString();
    const initialStatus = item.status || 'planning';
    const seeded = {
      ...item,
      id: `pr-${Date.now()}`,
      createdAt: item.createdAt || nowIso,
      status: initialStatus,
      lifecycle: {
        phase: initialStatus,
        openedAt: item.createdAt || nowIso,
        closedAt: LIFECYCLE_TERMINAL_PHASES.has(initialStatus) ? nowIso : null,
        log: [{ at: nowIso, fromPhase: null, toPhase: initialStatus, by: 'user', note: item._note || 'created' }],
      },
    };
    return { ...d, projects: [...(d.projects || []), seeded] };
  });
  const updateProject = (id, updates) => setData(d => ({
    ...d,
    projects: (d.projects || []).map(p => {
      if (p.id !== id) return p;
      const withLifecycle = ensureLifecycle(p);
      const merged = { ...withLifecycle, ...updates };
      if (updates.status && updates.status !== withLifecycle.status) {
        return appendLifecycleLog(merged, updates.status, updates._by || 'user', updates._note || '');
      }
      return merged;
    }),
  }));
  const deleteProject = (id) => {
    if (authSession && data.numericSyncVerifiedAt) {
      const local = (data.projects || []).find(p => p.id === id);
      if (local && local.remoteUuid) {
        projectsSync.deleteRow(local.remoteUuid).catch(e => console.warn('[projects-sync] delete failed', e));
      }
    }
    setData(d => ({ ...d, projects: (d.projects || []).filter(p => p.id !== id) }));
  };
  const addSubscription = (item) => setData(d => ({ ...d, subscriptions: [...(d.subscriptions || []), { ...item, id: `sub-${Date.now()}`, createdAt: new Date().toISOString() }] }));
  const updateSubscription = (id, updates) => setData(d => ({ ...d, subscriptions: (d.subscriptions || []).map(s => s.id === id ? { ...s, ...updates } : s) }));
  // r25 — 1099 contractor CRUD per EDITABLE-EVERYWHERE.md.
  const addContractor = (item) => setData(d => ({ ...d, contractors1099: [...(d.contractors1099 || []), { ...item, id: `k-${Date.now()}` }] }));
  const updateContractor = (id, updates) => setData(d => ({ ...d, contractors1099: (d.contractors1099 || []).map(c => c.id === id ? { ...c, ...updates } : c) }));
  const deleteContractor = (id) => setData(d => ({ ...d, contractors1099: (d.contractors1099 || []).filter(c => c.id !== id) }));
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
      entitiesSync.updateRow(local.remoteUuid, patch).catch(e => console.warn('[entities-sync] update failed', e));
    }
  };
  const deleteSubscription = (id) => setData(d => ({ ...d, subscriptions: (d.subscriptions || []).filter(s => s.id !== id) }));
  // Feedback — seeded with lifecycle so the new → reviewed → planned → shipped flow has an audit trail.
  // Layer 2: after the local setData, fire-and-forget uploadFeedback so
  // other signed-in family/church devices see it. Upload no-ops when
  // signed out, so the local-only path is unchanged for guest users.
  const addFeedback = (item) => {
    const nowIso = new Date().toISOString();
    const initialStatus = item.status || 'new';
    const seeded = {
      ...item,
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
    uploadFeedback(seeded, { activeTab: view, appVersion: data.meta?.appVersion });
  };
  const deleteFeedback = (id) => setData(d => ({ ...d, feedback: (d.feedback || []).filter(f => f.id !== id) }));
  const dismissWelcome = () => setData(d => ({ ...d, welcomeDismissed: true }));
  const deleteRecurring = (id) => setData(d => ({ ...d, recurringObligations: d.recurringObligations.filter(r => r.id !== id) }));
  // r22 — Update affordances for Calendar rows (was delete-only). Per
  // IDENTITY-ROLES-AUDIT.md, every state change is attributable; lifecycle log
  // captures by/when. Recurring + event are sibling shapes; mirror the pattern.
  const updateRecurring = (id, updates) => setData(d => ({ ...d, recurringObligations: d.recurringObligations.map(r => r.id === id ? { ...r, ...updates } : r) }));
  const updateEvent = (id, updates) => setData(d => ({ ...d, events: (d.events || []).map(e => e.id === id ? { ...e, ...updates } : e) }));
  const deleteIncident = (id) => setData(d => ({ ...d, incidents: d.incidents.filter(i => i.id !== id) }));
  const deleteEvent = (id) => setData(d => ({ ...d, events: (d.events || []).filter(e => e.id !== id) }));
  // v28+ Session A: Accounts CRUD
  const addAccount = (item) => {
    const seeded = { ...item, id: `a-${Date.now()}`, balance: parseFloat(item.balance) || 0, inLegal: !!item.inLegal };
    setData(d => ({ ...d, accounts: [...(d.accounts || []), seeded] }));
    if (authSession && data.numericSyncVerifiedAt) {
      accountsSync.upload(seeded).catch(e => console.warn('[accounts-sync] upload failed', e));
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
    if (authSession && data.numericSyncVerifiedAt) {
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
        accountsSync.updateRow(local.remoteUuid, patch).catch(e => console.warn('[accounts-sync] update failed', e));
      }
    }
  };
  const deleteAccount = (id) => {
    if (authSession && data.numericSyncVerifiedAt) {
      const local = (data.accounts || []).find(a => a.id === id);
      if (local && local.remoteUuid) {
        accountsSync.deleteRow(local.remoteUuid).catch(e => console.warn('[accounts-sync] delete failed', e));
      }
    }
    setData(d => ({ ...d, accounts: (d.accounts || []).filter(a => a.id !== id) }));
  };
  // v28+ Session A: Transactions CRUD
  const addTransaction = (item) => {
    const seeded = { ...item, id: `t-${Date.now()}`, amount: parseFloat(item.amount) || 0 };
    setData(d => ({ ...d, transactions: [...(d.transactions || []), seeded] }));
    if (authSession && data.numericSyncVerifiedAt) {
      transactionsSync.upload(seeded).catch(e => console.warn('[transactions-sync] upload failed', e));
    }
  };
  const updateTransaction = (id, updates) => {
    setData(d => ({ ...d, transactions: (d.transactions || []).map(t => t.id === id ? { ...t, ...updates, amount: updates.amount !== undefined ? parseFloat(updates.amount) || 0 : t.amount } : t) }));
    if (authSession && data.numericSyncVerifiedAt) {
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
        transactionsSync.updateRow(local.remoteUuid, patch).catch(e => console.warn('[transactions-sync] update failed', e));
      }
    }
  };
  const deleteTransaction = (id) => {
    if (authSession && data.numericSyncVerifiedAt) {
      const local = (data.transactions || []).find(t => t.id === id);
      if (local && local.remoteUuid) {
        transactionsSync.deleteRow(local.remoteUuid).catch(e => console.warn('[transactions-sync] delete failed', e));
      }
    }
    setData(d => ({ ...d, transactions: (d.transactions || []).filter(t => t.id !== id) }));
  };
  // v28+ Rentals expansion: Rental property CRUD
  const addRental = (item) => setData(d => ({ ...d, inflows: { ...d.inflows, rentals: [...(d.inflows.rentals || []), { ...item, id: `r-${Date.now()}` }] } }));
  const updateRental = (id, updates) => setData(d => ({ ...d, inflows: { ...d.inflows, rentals: (d.inflows.rentals || []).map(r => r.id === id ? { ...r, ...updates } : r) } }));
  const deleteRental = (id) => setData(d => ({ ...d, inflows: { ...d.inflows, rentals: (d.inflows.rentals || []).filter(r => r.id !== id) } }));
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
    if (authSession && data.numericSyncVerifiedAt) {
      inquiriesSync.upload(seeded).catch(e => console.warn('[inquiries-sync] upload failed', e));
    }
  };
  // v28+ Session C: checkout intent logging
  const addCheckoutIntent = (item) => setData(d => ({ ...d, checkoutIntents: [...(d.checkoutIntents || []), { ...item, id: `ci-${Date.now()}`, at: new Date().toISOString() }] }));
  const deleteCheckoutIntent = (id) => setData(d => ({ ...d, checkoutIntents: (d.checkoutIntents || []).filter(i => i.id !== id) }));
  const updateInquiry = (id, updates) => {
    setData(d => ({ ...d, inquiries: (d.inquiries || []).map(i => i.id === id ? { ...i, ...updates, statusHistory: updates.status && updates.status !== i.status ? [...(i.statusHistory || []), { status: updates.status, at: new Date().toISOString(), notes: updates.statusNotes }] : i.statusHistory } : i) }));
    if (authSession && data.numericSyncVerifiedAt) {
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
        inquiriesSync.updateRow(local.remoteUuid, patch).catch(e => console.warn('[inquiries-sync] update failed', e));
      }
    }
  };
  const deleteInquiry = (id) => {
    if (authSession && data.numericSyncVerifiedAt) {
      const local = (data.inquiries || []).find(i => i.id === id);
      if (local && local.remoteUuid) {
        inquiriesSync.deleteRow(local.remoteUuid).catch(e => console.warn('[inquiries-sync] delete failed', e));
      }
    }
    setData(d => ({ ...d, inquiries: (d.inquiries || []).filter(i => i.id !== id) }));
  };
  const toggleModuleInterest = (moduleKey, priority) => setData(d => { const current = d.moduleInterest || {}; if (priority === null || priority === undefined) { const next = {...current}; delete next[moduleKey]; return { ...d, moduleInterest: next }; } return { ...d, moduleInterest: { ...current, [moduleKey]: { signedAt: new Date().toISOString(), priority } } }; });
  // v28+ MVP v1.5: Capex / Tools list CRUD (data lives in About > Capital Spend)
  const addCapexItem = (item) => setData(d => ({ ...d, capexItems: [...(d.capexItems || []), { ...item, id: `cx-${Date.now()}`, cost: parseFloat(item.cost) || 0, priority: parseInt(item.priority) || 3 }] }));
  const updateCapexItem = (id, updates) => setData(d => ({ ...d, capexItems: (d.capexItems || []).map(x => x.id === id ? { ...x, ...updates, cost: updates.cost !== undefined ? parseFloat(updates.cost) || 0 : x.cost, priority: updates.priority !== undefined ? parseInt(updates.priority) || 3 : x.priority } : x) }));
  const deleteCapexItem = (id) => setData(d => ({ ...d, capexItems: (d.capexItems || []).filter(x => x.id !== id) }));
  // v28+ MVP v1.5: Buffer Fund — slider-driven current balance + deliberate-edit target.
  const setBufferCurrent = (val) => setData(d => ({ ...d, meta: { ...d.meta, bufferCurrent: parseFloat(val) || 0 } }));
  const setBufferTarget = (val) => setData(d => ({ ...d, meta: { ...d.meta, bufferTarget: parseFloat(val) || 0 } }));
  // v28+ MVP v1.5 round 5: tier switcher (also persists via setData)
  const setUserTier = (tier) => setData(d => ({ ...d, userTier: tier }));
  // Round 14 — Voice Ops config setter (Phase 1 Cloudflare Worker integration)
  const setVoiceOpsConfig = (patch) => setData(d => ({ ...d, voiceOps: { ...d.voiceOps, ...patch } }));
  // v28+ MVP v1.5 round 6: skill profile CRUD for Dev/Ops opportunity matcher
  const addSkillProfile = (item) => setData(d => ({ ...d, skillProfiles: [...(d.skillProfiles || []), { ...item, id: `sp-${Date.now()}` }] }));
  const updateSkillProfile = (id, updates) => setData(d => ({ ...d, skillProfiles: (d.skillProfiles || []).map(p => p.id === id ? { ...p, ...updates } : p) }));
  const deleteSkillProfile = (id) => setData(d => ({ ...d, skillProfiles: (d.skillProfiles || []).filter(p => p.id !== id) }));
  // v28+ MVP v1.5: Markets watchlist CRUD. Symbols are Stooq format ('spy.us', 'btcusd', '^spx').
  // v28+ MVP v1.5: Church tab CRUD — local prayer-request log
  const addPrayerRequest = (item) => setData(d => ({ ...d, prayerRequests: [...(d.prayerRequests || []), { ...item, id: `pr-${Date.now()}`, createdAt: new Date().toISOString(), sentAt: null }] }));
  const markPrayerRequestSent = (id) => setData(d => ({ ...d, prayerRequests: (d.prayerRequests || []).map(p => p.id === id ? { ...p, sentAt: new Date().toISOString() } : p) }));
  const deletePrayerRequest = (id) => setData(d => ({ ...d, prayerRequests: (d.prayerRequests || []).filter(p => p.id !== id) }));
  const addWatchlistSymbol = (sym) => {
    const s = (sym || '').trim().toLowerCase();
    if (!s) return;
    setData(d => {
      const list = Array.isArray(d.watchlist) ? d.watchlist : [];
      if (list.includes(s)) return d;
      return { ...d, watchlist: [...list, s] };
    });
  };
  const removeWatchlistSymbol = (sym) => setData(d => ({ ...d, watchlist: (d.watchlist || []).filter(s => s !== sym) }));

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
    const allAccountsCash = (data.accounts || []).filter(a => CASH_TYPES.includes(a.type) && !a.inLegal).reduce((s, a) => s + (a.balance || 0), 0);
    return { salaryActual, rentalActual, rentalExpected, rentGap, collectionRate, totalInflow, totalOutflow, netCashFlow, totalConsumerDebt, totalRentalDebt, totalRentalPI, totalPersonalRealEstateDebt, totalPersonalRealEstatePI, totalOpportunity, totalOppHours, allAccountsCash };
  }, [data]);

  // Reserves math extracted into computeReserves (app/src/lib/financial-calcs.js)
  // so Pass 2 of the financial audit can unit-test it directly. See FLAG-10
  // fix in CALC-INVENTORY.md for why incidents contribute 0 to totalMonthly.
  const reserves = useMemo(() => computeReserves(data), [data]);

  const pressureCalc = useMemo(() => {
    const map = data.pressureMappings[pressure];
    const rentCapture = (map.rentGapClosure / 100) * totals.rentGap;
    const discretionaryGain = (map.discretionaryCut / 100) * 2000;
    const grossAvailable = totals.netCashFlow + rentCapture + discretionaryGain;
    return { ...map, rentCapture, discretionaryGain, grossAvailable, reservesDeducted: reserves.totalMonthly, extraAvailable: Math.max(0, grossAvailable - reserves.totalMonthly) };
  }, [pressure, totals, data.pressureMappings, reserves]);

  const projection = useMemo(() => projectDebt(data.debts, pressureCalc.extraAvailable, currentDate, 240), [data.debts, pressureCalc.extraAvailable, currentDate]);
  const debtSnowball = useMemo(() => projectDebtSnowball(data.debts, debtSnowballExtra, debtSnowballSort, currentDate, 360), [data.debts, debtSnowballExtra, debtSnowballSort, currentDate]);
  const debtMinOnly = useMemo(() => projectDebtMinimumOnly(data.debts, currentDate, 600), [data.debts, currentDate]);
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

  const entityRollups = useMemo(() => {
    // 2026-05-24 — sort entities so personal types render first, then business
    // types. Keeps the Accounts tab's "your money first" ordering aligned with
    // the entity grouping. Within each type, preserve insertion order.
    // Multi-user Layer A — only roll up entities visible to current profile.
    const sortedEntities = [...visibleEntities].sort((a, b) => {
      if (a.type === b.type) return 0;
      return a.type === 'personal' ? -1 : 1;
    });
    return sortedEntities.map(entity => {
      const accounts = data.accounts.filter(a => a.entityId === entity.id);
      const isCash = (a) => ['checking','savings','cash','investment'].includes(a.type);
      const isCredit = (a) => a.type === 'credit' || a.type === 'loan';
      // inLegal accounts are out of the financial picture (per Darrell 2026-05-24).
      // They still belong to the entity but don't contribute to cash/credit totals.
      const cashBalance = accounts.filter(a => isCash(a) && !a.inLegal).reduce((s, a) => s + (a.balance || 0), 0);
      const creditBalance = accounts.filter(a => isCredit(a) && !a.inLegal).reduce((s, a) => s + (a.balance || 0), 0);
      const balance = accounts.filter(a => !a.inLegal).reduce((s, a) => s + (a.balance || 0), 0); // legacy total
      const inflow = [...data.inflows.salaries.filter(s => s.entityId === entity.id).map(s => s.actual), ...data.inflows.rentals.filter(r => r.entityId === entity.id).map(r => r.actual)].reduce((s, x) => s + x, 0);
      const debts = data.debts.filter(d => d.entityId === entity.id);
      const debtBalance = debts.reduce((s, d) => s + d.balance, 0);
      return { entity, accounts, balance, cashBalance, creditBalance, inflow, debts, debtBalance };
    });
  }, [data, visibleEntities]);

  const flaggedRentals = data.inflows.rentals.filter((r) => r.status === 'late' && (r.rent || 0) > 0);
  const flaggedOpportunities = data.opportunities.filter((o) => o.flag);
  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return (data.events || []).filter(e => !e.completedAt).map(e => ({ ...e, dateTime: eventDateTime(e) })).filter(e => e.dateTime >= new Date(now.getTime() - 24*60*60000)).sort((a,b) => a.dateTime - b.dateTime);
  }, [data.events]);

  const resetToSeed = async () => { if (confirm('Reset to seed data? Edits will be lost.')) { setData(SEED_DATA); setPressure(5); } };

  return (
    <div data-theme={theme} className="min-h-screen bg-[#FAF8F4] text-[#1A1815]" style={{ fontFamily: '"DM Sans", system-ui, sans-serif' }}>
      <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300..900&family=DM+Sans:opsz,wght@9..40,300..700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
      <style>{`
/* Mobile keyboard fix */
input:focus,textarea:focus,select:focus{scroll-margin-bottom:280px;scroll-margin-top:80px}
html{scroll-padding-bottom:280px}

/* Premium section title polish — Apple-refined + Samsung-bold */
.section-title-wrapper{position:relative}
.section-title-text{position:relative}

/* ===================================================================
   THEME: WHITE · "Snow" — iOS-feel light surface (no brand affiliation)
   Design DNA borrowed from iOS / macOS conventions:
     · systemGroupedBackground (#F2F2F7) base, pure-white cards on top
     · iOS separator gray (#C6C6C8) for hairlines
     · Near-black text (#1D1D1F), iOS secondary (#8E8E93) for muted
     · Generous corner rounding (12-16px) on cards
     · Subtle stacked shadows on raised surfaces (cards + buttons)
     · Tighter letter-spacing on body for SF-feel
   All combinations exceed WCAG 2.1 AA (≥4.5:1 body, ≥3:1 UI).
   =================================================================== */
[data-theme="white"]{background-color:#F2F2F7;letter-spacing:-0.005em}
[data-theme="white"] .bg-\\[\\#FAF8F4\\]{background-color:#F2F2F7!important}
[data-theme="white"] .bg-white{background-color:#FFFFFF!important;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,0.06),0 1px 2px rgba(0,0,0,0.04)}
[data-theme="white"] .bg-\\[\\#E8E4DC\\]{background-color:#E5E5EA!important}
[data-theme="white"] .border-\\[\\#E8E4DC\\]{border-color:#C6C6C8!important}
[data-theme="white"] .border-\\[\\#1A1815\\]{border-color:#1D1D1F!important;border-radius:12px}
[data-theme="white"] .border-2{border-radius:14px}
[data-theme="white"] .text-\\[\\#1A1815\\]{color:#1D1D1F!important}
[data-theme="white"] .text-\\[\\#5A5751\\]{color:#8E8E93!important}
[data-theme="white"] .bg-\\[\\#1A1815\\]{background-color:#1D1D1F!important;border-radius:10px}
/* iOS-style breathing room on body prose */
[data-theme="white"] p,[data-theme="white"] li{line-height:1.55}
/* iOS-style soft button feel — slightly raised, subtly rounded */
[data-theme="white"] button{border-radius:10px}
[data-theme="white"] input,[data-theme="white"] select,[data-theme="white"] textarea{border-radius:8px}

/* ===================================================================
   THEME: SLATE · "Glacier" — One UI-feel surface (no brand affiliation)
   Design DNA borrowed from One UI conventions:
     · Cool blue-tinted background (#F1F3F8) with extra-rounded cards
     · Larger corner rounding (20-24px) for the soft, friendly feel
     · Deeper card shadows (more elevation)
     · Cool blue accent (#1F6FEB) where the brand accent would normally land
     · More generous padding via inset adjustments
     · Default body line-height for One UI's roomier feel
   All combinations exceed WCAG 2.1 AA.
   =================================================================== */
[data-theme="slate"]{background-color:#F1F3F8;letter-spacing:0}
[data-theme="slate"] .bg-\\[\\#FAF8F4\\]{background-color:#F1F3F8!important}
[data-theme="slate"] .bg-white{background-color:#FFFFFF!important;border-radius:22px;box-shadow:0 4px 16px rgba(15,23,42,0.06),0 1px 2px rgba(15,23,42,0.04)}
[data-theme="slate"] .bg-\\[\\#E8E4DC\\]{background-color:#E1E6EF!important}
[data-theme="slate"] .border-\\[\\#E8E4DC\\]{border-color:#DDE3EC!important}
[data-theme="slate"] .text-\\[\\#1A1815\\]{color:#1B1D1F!important}
[data-theme="slate"] .text-\\[\\#5A5751\\]{color:#4A5260!important}
[data-theme="slate"] .border-\\[\\#1A1815\\]{border-color:#1B1D1F!important;border-radius:22px}
[data-theme="slate"] .border-2{border-radius:24px}
[data-theme="slate"] .bg-\\[\\#1A1815\\]{background-color:#1F6FEB!important;border-radius:18px}
[data-theme="slate"] .hover\\:bg-\\[\\#1A1815\\]:hover{background-color:#1B5FCC!important;color:#FFFFFF!important}
/* Roomy body prose, One UI-style */
[data-theme="slate"] p,[data-theme="slate"] li{line-height:1.6}
/* Pill-shaped buttons + extra-rounded inputs */
[data-theme="slate"] button{border-radius:18px}
[data-theme="slate"] input,[data-theme="slate"] select,[data-theme="slate"] textarea{border-radius:14px}

/* ===================================================================
   THEME: SAPPHIRE — premium blue, refined
   =================================================================== */
[data-theme="sapphire"] .bg-\\[\\#FAF8F4\\]{background-color:#EFF6FF!important}
[data-theme="sapphire"] .border-\\[\\#E8E4DC\\]{border-color:#BFDBFE!important}
[data-theme="sapphire"] .bg-\\[\\#E8E4DC\\]{background-color:#BFDBFE!important}
[data-theme="sapphire"] .text-\\[\\#1A1815\\]{color:#1E3A8A!important}
[data-theme="sapphire"] .text-\\[\\#5A5751\\]{color:#3B82F6!important}
[data-theme="sapphire"] .border-\\[\\#1A1815\\]{border-color:#1E3A8A!important}
[data-theme="sapphire"] .bg-\\[\\#1A1815\\]{background-color:#1E3A8A!important}

/* ===================================================================
   THEME: ROSE — soft warm pink garden
   =================================================================== */
[data-theme="rose"] .bg-\\[\\#FAF8F4\\]{background-color:#FDF2F8!important}
[data-theme="rose"] .border-\\[\\#E8E4DC\\]{border-color:#FBCFE8!important}
[data-theme="rose"] .bg-\\[\\#E8E4DC\\]{background-color:#FBCFE8!important}
[data-theme="rose"] .text-\\[\\#1A1815\\]{color:#831843!important}
[data-theme="rose"] .text-\\[\\#5A5751\\]{color:#BE185D!important}
[data-theme="rose"] .border-\\[\\#1A1815\\]{border-color:#831843!important}
[data-theme="rose"] .bg-\\[\\#1A1815\\]{background-color:#831843!important}

/* ===================================================================
   THEME: MIDNIGHT — OLED-friendly true black + smooth grey gradient
   Battery-saving on OLED screens · soft greys merge into the deep
   =================================================================== */
[data-theme="midnight"]{color:#E5E5E5;background-color:#000000}
[data-theme="midnight"] .bg-\\[\\#FAF8F4\\]{background-color:#000000!important}
[data-theme="midnight"] .bg-white{background-color:#141414!important}
[data-theme="midnight"] .bg-\\[\\#1A1815\\]{background-color:#1F1F1F!important}
[data-theme="midnight"] .bg-\\[\\#E8E4DC\\]{background-color:#1A1A1A!important}
[data-theme="midnight"] .text-\\[\\#1A1815\\]{color:#E5E5E5!important}
[data-theme="midnight"] .text-\\[\\#FAF8F4\\]{color:#E5E5E5!important}
[data-theme="midnight"] .text-\\[\\#5A5751\\]{color:#888888!important}
[data-theme="midnight"] .text-\\[\\#B85838\\]{color:#FB923C!important}
[data-theme="midnight"] .text-\\[\\#5A6E3D\\]{color:#86EFAC!important}
[data-theme="midnight"] .border-\\[\\#1A1815\\]{border-color:#3A3A3A!important}
[data-theme="midnight"] .border-\\[\\#E8E4DC\\]{border-color:#2A2A2A!important}
[data-theme="midnight"] .border-\\[\\#B85838\\]{border-color:#FB923C!important}
[data-theme="midnight"] .border-\\[\\#5A6E3D\\]{border-color:#86EFAC!important}
[data-theme="midnight"] .bg-\\[\\#B85838\\]{background-color:#FB923C!important}
[data-theme="midnight"] .bg-\\[\\#5A6E3D\\]{background-color:#86EFAC!important}
[data-theme="midnight"] .hover\\:bg-\\[\\#1A1815\\]:hover{background-color:#2A2A2A!important;color:#E5E5E5!important}
[data-theme="midnight"] .hover\\:bg-\\[\\#FAF8F4\\]:hover{background-color:#2A2A2A!important}
[data-theme="midnight"] .hover\\:text-\\[\\#1A1815\\]:hover{color:#E5E5E5!important}
[data-theme="midnight"] input,[data-theme="midnight"] textarea,[data-theme="midnight"] select{color:#E5E5E5;background-color:#0A0A0A!important;border-color:#2A2A2A!important}
[data-theme="midnight"] input::placeholder,[data-theme="midnight"] textarea::placeholder{color:#666666}
      `}</style>

      <div className="bg-[#1A1815] text-[#FAF8F4] text-center text-[10px] uppercase tracking-[0.2em] py-1.5 px-3 print:hidden">
        Projections, not promises · Verify with licensed professionals
      </div>

      <AuthBanner />
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
            {isFirstTimeLanding && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                <span className="inline-block text-[9px] sm:text-[10px] uppercase tracking-wider text-white bg-[#5A6E3D] px-2 py-1 font-semibold">Free forever · Financial System for Families</span>
                <span className="inline-block text-[9px] sm:text-[10px] uppercase tracking-wider text-white bg-[#5A6E3D] px-2 py-1 font-semibold">Free forever · Spiritual Module for the Body</span>
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
                { key: 'family-of-1',                free: true,  label: 'For singles starting out',          headline: 'One income, one budget, no guessing.',                    summary: "One household, one income, simple books. Every subscription and 'where did it go' is on the screen, not in your head." },
                { key: 'engaged-pre-marriage',       free: true,  label: 'For engaged couples · before marriage', headline: 'Build the financial system before the vows.',          summary: "The conversation about money before the vows — clear, not awkward. Joint vs. separate logged in writing. If one stops contributing, the data shows it before resentment does. Two budgets becoming one — data as the prenup-conversation starter." },
                { key: 'family-of-2',                free: true,  label: 'For couples (no kids yet)',         headline: 'Two incomes pulling in one direction.',                   summary: "Two incomes, shared books, joint goals. Who-paid-what logged, so 'I covered more' is a number, not a feeling." },
                { key: 'family-of-3',                free: true,  label: 'For new parents',                   headline: 'First child without losing track of the rest.',           summary: 'Childcare costs, salary changes, fresh discipline. The new line items are tracked the day they start.' },
                { key: 'family-of-5',                free: true,  label: 'For families of 5+',                headline: 'Three kids, busier rhythm — same clarity.',               summary: "More mouths, more dates, same four questions. Every kid's costs visible, nothing slips." },
                { key: 'family-of-7',                free: true,  label: 'For large households',              headline: 'Big family, big load, lifted by the system.',             summary: 'Five+ kids, complex schedules, scaled views. The load is real; the record keeps it honest.' },
                { key: 'empty-nesters',              free: true,  label: 'For empty nesters',                 headline: 'Last kid out, attention to retirement.',                  summary: "When grown kids ask for help, you have data, not just generosity. Here's what we gave over the years, here's the picture. Retirement runway, adult-children support logged, legacy planning — all data-driven." },
                { key: 'widowed-or-divorced-restart',free: true,  label: 'For widowed or divorced restarting',headline: 'Rebuilding the financial picture after a life change.',    summary: "You don't rebuild from memory after a loss. The system already holds the history — every shared expense, every transfer, every receipt. Estate and benefits paperwork starts with data, not 'where did I put that.'" },
                { key: 'community',   free: false, label: 'For community + school orgs',     headline: 'Kitchen-table discipline at the board table.',                 summary: 'Co-op, ministry, small-org books. Every shared cost agreed and recorded, so the board votes on numbers, not memory.' },
                { key: 'church',      free: false, label: 'For church leadership',           headline: 'Tithe in, ministry out, every dollar provable.',                summary: "The Black Church is the Body of Christ's economic exemplar - pooling capital to lift its people for 200 years, from 1787 mutual aid to colleges built on washerwomen's pennies, against a wealth gap federal policy engineered. PoeTech hands that stewardship genealogy provable books and the understanding to operate outside the mechanisms: tithes in, ministry and capex out, so the board votes on numbers, not memory. Soul first, then the family economy - the Spiritual Module for the Body is free; the congregation's stewardship books are the paid tier." },
                { key: 'lawyer',      free: false, label: 'For solo lawyers',                headline: 'Practice + trust accounting kept clean.',                     summary: 'Today: alias of Solo professional; trust-account ledger in build. Every client transfer recorded, so the trust balance is provable.' },
                { key: 'therapist',   free: false, label: 'For solo therapists',             headline: 'Practice + CEU + supervision tracked.',                       summary: 'Today: alias of Solo professional; clinical-side tier in build. CEUs and supervision hours logged as the record, not the memory.' },
              ].map(s => (
                <div key={s.key} className="block p-4 border border-dashed border-[#5A5751] bg-white/70">
                  <div className="flex items-baseline justify-between mb-1.5 gap-2">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-[#5A5751] font-semibold">{s.label}</div>
                    <span className="text-[8px] uppercase tracking-wider text-[#5A5751] border border-[#5A5751] px-1.5 py-0.5 whitespace-nowrap">Vision · in build</span>
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
                <span>Sponsored for families in need</span>
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

      {/* Family Suggest button — 2026-05-29. Floating lower-right on every
          screen. Always visible for family members to drop feedback as they
          notice things. POSTs to n8n workflow 30 (/webhook/family-feedback).
          Per BUSINESS-PROCESS-CONNECTIONS Family-Voice-Is-The-Connection
          extension. Hidden during the picker landing to avoid cluttering
          the first impression. */}
      {!isFirstTimeLanding && !suggestOpen && (
        <button
          type="button"
          onClick={() => setSuggestOpen(true)}
          aria-label="Send feedback or suggestion"
          className="fixed bottom-4 right-4 z-40 bg-[#B85838] hover:bg-[#1A1815] text-white text-xs uppercase tracking-wider font-semibold px-3 py-2 shadow-lg focus:outline focus:outline-2 focus:outline-[#1A1815]"
          style={{ fontFamily: '"Fraunces", serif' }}
        >
          Suggest
        </button>
      )}

      {suggestOpen && (
        <div role="dialog" aria-modal="true" aria-labelledby="suggest-h" className="fixed inset-0 z-50 bg-[#1A1815]/90 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[#FAF8F4] border border-[#1A1815] max-w-md w-full p-5 sm:p-6">
            <div className="text-[10px] uppercase tracking-[0.3em] text-[#B85838] font-semibold mb-2">PoeTech · Family OS · Your voice</div>
            {!suggestState.success ? (
              <>
                <h2 id="suggest-h" className="text-xl sm:text-2xl mb-2" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600, letterSpacing: '-0.02em' }}>What do you see?</h2>
                <p className="text-xs text-[#5A5751] mb-3" style={{ fontFamily: '"Fraunces", serif' }}>Bug, idea, copy edit, question - all welcome. Family voices ship within a day.</p>
                <div className="space-y-3">
                  <div>
                    <label htmlFor="sg-type" className="block text-[10px] uppercase tracking-wider text-[#5A5751] mb-1">Kind (optional)</label>
                    <select id="sg-type" value={suggestForm.type} onChange={e => setSuggestForm({ ...suggestForm, type: e.target.value })} className="w-full p-2 border border-[#1A1815] bg-white text-sm focus:outline focus:outline-2 focus:outline-[#B85838]">
                      <option value="">(pick one or leave blank)</option>
                      <option value="bug">Bug - something is broken</option>
                      <option value="feature">Feature - I wish it did X</option>
                      <option value="copy">Copy edit - the words read off</option>
                      <option value="question">Question - I don't understand X</option>
                      <option value="strategic">Strategic - bigger direction note</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="sg-message" className="block text-[10px] uppercase tracking-wider text-[#5A5751] mb-1">What you noticed <span className="text-[#B85838]">*</span></label>
                    <textarea id="sg-message" rows="4" value={suggestForm.message} onChange={e => setSuggestForm({ ...suggestForm, message: e.target.value })} className="w-full p-2 border border-[#1A1815] bg-white text-sm focus:outline focus:outline-2 focus:outline-[#B85838]" placeholder="A sentence or two is plenty. Specifics help us ship faster." autoFocus />
                  </div>
                </div>
                {suggestState.error && (
                  <div className="mt-3 p-2 bg-[#DC2626]/10 border border-[#DC2626] text-xs text-[#DC2626]" style={{ fontFamily: '"Fraunces", serif' }}>
                    {suggestState.error}
                  </div>
                )}
                <div className="flex gap-2 mt-4 flex-wrap">
                  <button type="button" disabled={suggestState.submitting} onClick={submitSuggest} className="flex-1 bg-[#1A1815] text-white py-2 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838] disabled:opacity-50">{suggestState.submitting ? 'Sending…' : 'Send to the team'}</button>
                  <button type="button" disabled={suggestState.submitting} onClick={() => { setSuggestOpen(false); setSuggestState({ submitting: false, success: false, error: null, id: null }); }} className="px-3 py-2 border border-[#1A1815] text-[#1A1815] text-xs uppercase tracking-wider font-semibold hover:bg-white focus:outline focus:outline-2 focus:outline-[#B85838] disabled:opacity-50">Cancel</button>
                </div>
                <p className="text-[9px] text-[#5A5751] italic text-center mt-2" style={{ fontFamily: '"Fraunces", serif' }}>Goes to a private inbox on our own infrastructure. We see it within minutes.</p>
              </>
            ) : (
              <>
                <h2 id="suggest-h" className="text-xl sm:text-2xl mb-2" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600, letterSpacing: '-0.02em' }}>We hear you.</h2>
                <p className="text-sm text-[#1A1815] mb-2" style={{ fontFamily: '"Fraunces", serif' }}>Your note is captured. The team reviews family voices first - usually within a day.</p>
                <p className="text-[10px] text-[#5A5751] mb-3" style={{ fontFamily: '"Fraunces", serif' }}>Confirmation ID: <span className="font-mono">{suggestState.id || '(saved)'}</span></p>
              </>
            )}
          </div>
        </div>
      )}

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
      {isDemoMode && !demoWelcomeOpen && (
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

      {/* Multi-user Layer A — profile picker overlay. Shows on first launch
          (currentProfile === null) and via the "switch profile" button in the
          header. Blocks the whole UI so the user MUST pick before seeing data;
          TLC firewall depends on this gate, so it can't be dismissed without
          choosing. */}
      {!currentProfile && !isAnyDemoMode && !isFirstTimeLanding && (
        <div role="dialog" aria-modal="true" aria-labelledby="profile-picker-h" className="fixed inset-0 z-50 bg-[#1A1815] flex items-center justify-center p-4">
          <div className="bg-[#FAF8F4] border border-[#1A1815] max-w-md w-full p-6 sm:p-8">
            <div className="text-[10px] uppercase tracking-[0.3em] text-[#B85838] font-semibold mb-2">PoeTech · Family OS</div>
            <h2 id="profile-picker-h" className="text-2xl sm:text-3xl mb-1" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600, letterSpacing: '-0.02em' }}>Who's using this device?</h2>
            <p className="text-sm text-[#5A5751] mb-6" style={{ fontFamily: '"Fraunces", serif' }}>Pick a profile to see the views meant for you. The practice stays private to its owner; business entities stay with the principal. You can switch any time from the header.</p>
            <div className="space-y-2">
              {PROFILES.map(p => (
                <button key={p.id} type="button" onClick={() => setProfile(p.id)} className="w-full p-4 text-left border border-[#1A1815] hover:bg-white hover:border-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838] transition-colors flex items-baseline justify-between gap-3">
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

      <header className="border-b border-[#1A1815] bg-[#FAF8F4] sticky top-0 z-20 print:hidden">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4">
          {/* Round 14 fix — Title row stacks BELOW the controls on small/medium
              screens so the tier-preview dropdown and Subscribe/Feedback buttons
              can't crowd "Financial Control System." Side-by-side only on large
              screens where there's actually room. */}
          <div className="flex flex-col-reverse lg:flex-row lg:items-baseline lg:justify-between gap-2 sm:gap-3">
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-[0.3em] text-[#B85838] mb-1 font-semibold">PoeTech · Family OS <span className="text-[8px] tracking-[0.15em] text-[#5A5751] ml-2 sm:hidden" title={`Build time: ${typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : 'unknown'}`} style={{ fontFamily: '"JetBrains Mono", monospace' }}>build {typeof __BUILD_SHA__ !== 'undefined' ? __BUILD_SHA__ : '????'}</span></div>
              <h1 className="text-2xl sm:text-3xl leading-none truncate" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600, letterSpacing: '-0.02em' }}>Financial Control System</h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap lg:flex-nowrap lg:shrink-0 justify-end">
              {/* Round 5 — Tier indicator + dev-only switcher. Round 7 fix:
                  Replaced native <details> (which doesn't auto-close on outside
                  click and felt broken) with a controlled dropdown that closes
                  on selection and clicks outside, with a brief flash on change. */}
              <TierSwitcher userTier={data.userTier} setUserTier={setUserTier} />
              {currentProfile && (() => {
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
              {/* Header feedback button removed — replaced by the persistent floating 💬 button bottom-left.
                  Single entry point keeps the header roomy and the loop unambiguous. */}
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
                <div>{monthLabel(currentDate, 0)}</div>
                {/* 2026-05-28 — Build marker so the user can verify at a glance
                    whether the phone is on the latest deploy. iOS Safari has
                    bitten us with stale HTML caching; this is the smoke-test
                    surface. SHA comes from Vercel's VERCEL_GIT_COMMIT_SHA at
                    build time (vite.config.js define block). */}
                <div className="text-[#B85838] mt-0.5" title={`Build time: ${typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : 'unknown'}`} style={{ fontFamily: '"JetBrains Mono", monospace' }}>build {typeof __BUILD_SHA__ !== 'undefined' ? __BUILD_SHA__ : '????'}</div>
              </div>
            </div>
          </div>
        </div>
        <nav className="border-t border-[#E8E4DC]">
          <div className="max-w-7xl mx-auto px-1 sm:px-6 overflow-x-auto">
            {/* v28+ MVP v1.5 — Nav reordered (round 3): primary financial tabs
                first, About anchors the right side of the primary group, then a
                visible vertical divider separates the secondary "life" tabs
                (Church + Markets) which live to the far right. */}
            <div className="flex gap-1 text-xs sm:text-sm items-stretch">
              {[
                ['overview','Big Picture'],
                ['books','Books'],
                ['inbound','📞 Inbound'],
                ['rentals','Real Estate'],
                ['projects','Projects'],
                ['practice','Practice'],
                ['opportunities','Dev/Ops'],
                ['about','About'],
                ['__sep__', null],
                ['church','Church'],
                ['markets','Markets'],
              ].map(([id, label]) => {
                if (id === '__sep__') {
                  return <span key="sep" aria-hidden="true" className="self-center mx-1 sm:mx-3 h-5 border-l border-[#1A1815] opacity-40" />;
                }
                return (
                  <button key={id} onClick={() => setView(id)} className={`px-2.5 sm:px-3 py-2.5 whitespace-nowrap border-b-2 transition-colors focus:outline focus:outline-2 focus:outline-[#B85838] ${view === id ? 'border-[#B85838] text-[#1A1815] font-medium' : 'border-transparent text-[#5A5751] hover:text-[#1A1815]'}`}>{label}</button>
                );
              })}
            </div>
          </div>
        </nav>
        {view === 'books' && (
          <div className="border-t border-[#E8E4DC] bg-white">
            <div className="max-w-7xl mx-auto px-1 sm:px-6 overflow-x-auto">
              <div className="flex gap-1 text-xs">
                {[['entities','Entities'],['accounts','Accounts'],['debts','Debts'],['transactions','Tx'],['imported','Imported'],['cart','Cart'],['k1099','1099s'],['calendar','Calendar'],['legal','🔒 Legal']].filter(([id]) => !(id === 'imported' && !importedAllowed)).map(([id, label]) => (
                  <button key={id} onClick={() => setBooksView(id)} className={`px-2.5 sm:px-3 py-2 whitespace-nowrap border-b-2 transition-colors ${booksView === id ? 'border-[#1A1815] text-[#1A1815] font-medium' : 'border-transparent text-[#5A5751] hover:text-[#1A1815]'}`}>{label}</button>
                ))}
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 pb-24">
        {view === 'overview' && (data.userTier === 'foundation' || !data.userTier) && (
          <div className="mb-6">
            <AdvisementBanner />
          </div>
        )}
        {view === 'overview' && <BigPictureDashboard totals={totals} pressure={pressure} setPressure={setPressure} pressureCalc={pressureCalc} projection={projection} rentalSnowball={rentalSnowball} flaggedRentals={flaggedRentals} flaggedOpportunities={flaggedOpportunities} entityRollups={entityRollups} reserves={reserves} upcomingEvents={upcomingEvents} welcomeDismissed={data.welcomeDismissed} dismissWelcome={dismissWelcome} setView={setView} setFeedbackOpen={setFeedbackOpen} bufferTarget={data.meta?.bufferTarget || 0} bufferCurrent={data.meta?.bufferCurrent || 0} setBufferCurrent={setBufferCurrent} capexItems={data.capexItems || []} watchlist={data.watchlist || []} rentals={data.inflows?.rentals || []} incidents={data.incidents || []} projects={data.projects || []} resolveIncident={resolveIncident} skillProfiles={data.skillProfiles || []} addIncident={addIncident} addProject={addProject} entities={data.entities || []} ingestData={ingestData} setBooksView={setBooksView} />}
        {view === 'books' && (
          <>
            {booksView === 'entities' && <BooksEntities entityRollups={entityRollups} entityFilter={entityFilter} setEntityFilter={setEntityFilter} data={data} updateEntity={updateEntity} />}
            {booksView === 'accounts' && <BooksAccounts entityRollups={entityRollups} entities={visibleEntities} addAccount={addAccount} updateAccount={updateAccount} deleteAccount={deleteAccount} toggleAccountLegal={toggleAccountLegal} bufferTarget={data.meta?.bufferTarget || 0} bufferCurrent={data.meta?.bufferCurrent || 0} setBufferCurrent={setBufferCurrent} setBufferTarget={setBufferTarget} totals={totals} ingestData={ingestData} />}
            {booksView === 'debts' && <Debts debts={data.debts} entities={data.entities} debtSnowballSort={debtSnowballSort} setDebtSnowballSort={setDebtSnowballSort} debtSnowballExtra={debtSnowballExtra} setDebtSnowballExtra={setDebtSnowballExtra} debtSnowball={debtSnowball} debtMinOnly={debtMinOnly} currentDate={currentDate} netCashFlow={totals.netCashFlow} cashTotal={totals.allAccountsCash || 0} />}
            {booksView === 'transactions' && <BooksTransactions data={data} entityFilter={entityFilter} setEntityFilter={setEntityFilter} currentDate={currentDate} addTransaction={addTransaction} updateTransaction={updateTransaction} deleteTransaction={deleteTransaction} ingestData={ingestData} visibleEntities={visibleEntities} visibleEntityIds={visibleEntityIds} />}
            {booksView === 'imported' && (importedAllowed
              ? <Imported />
              : <ImportedDemoGuard setBooksView={setBooksView} />)}
            {booksView === 'cart' && <Cart subscriptions={data.subscriptions || []} entities={data.entities} addSubscription={addSubscription} updateSubscription={updateSubscription} deleteSubscription={deleteSubscription} />}
            {booksView === 'k1099' && <Contractors1099 contractors={data.contractors1099 || []} entities={data.entities || []} addContractor={addContractor} updateContractor={updateContractor} deleteContractor={deleteContractor} />}
            {booksView === 'calendar' && <Calendar data={data} reserves={reserves} addRecurring={addRecurring} addIncident={addIncident} addEvent={addEvent} completeEvent={completeEvent} deleteRecurring={deleteRecurring} deleteIncident={deleteIncident} deleteEvent={deleteEvent} updateRecurring={updateRecurring} updateEvent={updateEvent} notifPermission={notifPermission} requestNotif={requestNotificationPermission} upcomingEvents={upcomingEvents} />}
            {booksView === 'legal' && <LegalPlaceholder tier={data.userTier} setView={setView} accounts={data.accounts || []} entities={data.entities || []} toggleAccountLegal={toggleAccountLegal} />}
          </>
        )}
        {view === 'inbound' && <Inbound voiceOps={data.voiceOps || {}} setVoiceOpsConfig={setVoiceOpsConfig} addIncident={addIncident} addInquiry={addInquiry} addProject={addProject} entities={data.entities || []} setView={setView} />}
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
                voiceOps={data.voiceOps || {}}
              />
            </>
          );
        })()}
        {view === 'markets' && <Markets watchlist={data.watchlist || []} addWatchlistSymbol={addWatchlistSymbol} removeWatchlistSymbol={removeWatchlistSymbol} userTier={data.userTier} setView={setView} maxWatchlist={tierMeets(data.userTier, 'poetech-plus') ? Infinity : FOUNDATION_CAPS.maxWatchlistTickers} />}
        {view === 'church' && <Church church={data.church} prayerRequests={data.prayerRequests || []} addPrayerRequest={addPrayerRequest} markPrayerRequestSent={markPrayerRequestSent} deletePrayerRequest={deletePrayerRequest} addEvent={addEvent} />}
        {view === 'projects' && (tierMeets(data.userTier, VIEW_TIER_REQUIREMENTS.projects)
          ? <ProjectsWrapper projects={data.projects || []} scopes={data.scopes || []} entities={data.entities} contractors={data.contractors1099 || []} addProject={addProject} updateProject={updateProject} deleteProject={deleteProject} addScope={addScope} deleteScope={deleteScope} capexItems={data.capexItems || []} addCapexItem={addCapexItem} updateCapexItem={updateCapexItem} deleteCapexItem={deleteCapexItem} netCashFlow={totals.netCashFlow} rentals={data.inflows?.rentals || []} accounts={data.accounts || []}
              feedbackPanel={<FeedbackPromotePanel feedback={[...(data.feedback || []), ...remoteFeedback]} addProject={addProject} addIncident={addIncident} deleteFeedback={deleteFeedback} />}
            />
          : <UpgradePrompt viewLabel="Projects" requiredTier={VIEW_TIER_REQUIREMENTS.projects} currentTier={data.userTier} setView={setView} setUserTier={setUserTier} />
        )}
        {view === 'practice' && (tierMeets(data.userTier, VIEW_TIER_REQUIREMENTS.practice)
          ? <Practice inquiries={data.inquiries} contractors={data.contractors1099} addInquiry={addInquiry} updateInquiry={updateInquiry} deleteInquiry={deleteInquiry} />
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
        {view === 'about' && <About moduleInterest={data.moduleInterest || {}} toggleModuleInterest={toggleModuleInterest} theme={theme} setTheme={setTheme} feedback={[...(data.feedback || []), ...remoteFeedback]} deleteFeedback={deleteFeedback} checkoutIntents={data.checkoutIntents || []} addCheckoutIntent={addCheckoutIntent} deleteCheckoutIntent={deleteCheckoutIntent} addProject={addProject} VIEW_TIER_REQUIREMENTS={VIEW_TIER_REQUIREMENTS} />}

        <footer className="mt-16 pt-6 border-t border-[#E8E4DC] text-center print:hidden">
          <div className="text-[10px] uppercase tracking-[0.2em] text-[#5A5751] mb-2">PoeTech · A family data platform · {data.meta.releaseLabel || `v${data.meta.appVersion}`} · {data.meta.releaseNote || ''}</div>
          <button type="button" onClick={resetToSeed} className="text-[10px] uppercase tracking-wider text-[#5A5751] hover:text-[#B85838] underline underline-offset-4">Reset to seed data</button>
        </footer>
        {view !== 'overview' && !(view === 'books' && booksView === 'debts') && (data.userTier === 'foundation' || !data.userTier) && (
          <div className="mt-6">
            <AdvisementBanner />
          </div>
        )}
        {view === 'books' && booksView === 'debts' && <TherapyReminder />}
      </main>
      <TTSControls />
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
          className="fixed bottom-4 left-4 z-30 px-4 py-3 bg-[#B85838] text-white text-xs uppercase tracking-wider font-semibold border-2 border-[#B85838] hover:bg-[#1A1815] hover:border-[#1A1815] shadow-lg min-h-[48px] min-w-[48px] focus:outline focus:outline-2 focus:outline-[#1A1815] print:hidden"
          style={{ borderRadius: '999px' }}
        >
          💬 Feedback
        </button>
      )}
      {feedbackOpen && <FeedbackModal onClose={() => setFeedbackOpen(false)} onSubmit={(item) => { addFeedback(item); setFeedbackOpen(false); }} currentView={view} />}
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

// =============================================================================
// Preparatory scaffolding — per MVP-1-HARDENING-PLAN.md step 2.3 this re-wires
// onto About + Opportunities (selectively, not every working tab). Exported so
// the pending re-wire can import it.
export function SalesFooterBanner({ currentView, setView }) {
  const [index, setIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  const pitches = [
    { headline: '6 weeks, not 6 months.', detail: 'Want this velocity for your project? Faster + better than the big team because we\'re intimate.', cta: 'See three ways to work together' },
    { headline: 'Pay us to get done now.', detail: 'Hourly · Retainer · Equity-shadow. Operators who ship, not consultants who slide-deck.', cta: 'View PoeTech Services →' },
    { headline: 'Dev/ops AND business.', detail: 'Rare combination. We understand your stack and your P&L. Same call, same person, same week.', cta: 'See what we can build →' },
    { headline: 'Built to run lean.', detail: 'Lower price reflects lower overhead, not lower quality. No partner-track hours, no junior handoffs.', cta: 'Get a quote →' },
    { headline: 'Intimate by design.', detail: 'You talk to the people doing the work. No account managers. No telephone game. The person you call codes.', cta: 'Start a conversation →' },
    { headline: 'Pre-seed founders welcome.', detail: 'Need a thinking partner more than a contractor? Equity-shadow engagements available — senior team energy at sustainable rates.', cta: 'Founder mode → ' },
  ];

  useEffect(() => {
    const interval = setInterval(() => setIndex(i => (i + 1) % pitches.length), 10000);
    return () => clearInterval(interval);
  }, [pitches.length]);

  // Hide on dashboard — that page has the family advisement banner already
  // CRITICAL: this conditional return MUST be AFTER all hooks (Rules of Hooks)
  if (currentView === 'overview' || dismissed) return null;

  const p = pitches[index];

  const handleClick = (e) => {
    e.preventDefault();
    if (setView) setView('opportunities');
  };

  return (
    <section className="mt-10 mb-2">
      <div className="bg-white border border-[#B85838] hover:border-[#1A1815] transition-colors">
        <div className="px-3 py-1 border-b border-[#E8E4DC] flex items-baseline justify-between gap-2">
          <div className="text-[9px] uppercase tracking-[0.25em] text-[#5A5751]">⌾ PoeTech Services · Built lean, priced fair</div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {pitches.map((_, i) => (
                <button key={i} onClick={() => setIndex(i)} aria-label={`Show pitch ${i + 1}`} className={`w-1 h-1 rounded-full transition-all ${i === index ? 'bg-[#B85838] w-2' : 'bg-[#E8E4DC]'}`}></button>
              ))}
            </div>
            <button type="button" onClick={() => setDismissed(true)} aria-label="Dismiss" className="text-[9px] uppercase tracking-wider text-[#5A5751] hover:text-[#1A1815]">×</button>
          </div>
        </div>
        <a href="#" onClick={handleClick} className="block px-3 py-3 hover:bg-[#FAF8F4] transition-colors">
          <div className="flex items-baseline justify-between gap-3 flex-wrap">
            <div className="flex-1 min-w-0">
              <h4 className="text-sm sm:text-base mb-0.5" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600, letterSpacing: '-0.01em' }}>{p.headline}</h4>
              <p className="text-xs text-[#5A5751] leading-snug" style={{ fontFamily: '"Fraunces", serif' }}>{p.detail}</p>
            </div>
            <div className="text-[10px] uppercase tracking-wider text-[#B85838] font-semibold shrink-0">{p.cta}</div>
          </div>
        </a>
      </div>
    </section>
  );
}


// Shows COLG + TLC + family businesses on Foundation (free) tier
// Paid tiers won't see this (per sponsorship ethics policy)
// =============================================================================
// TherapyReminder — always-visible mental-health support footer.
// Shown to every tier (free + paid) at the bottom of every page except Debts
// and Practice. The reasoning: family-stress is real, talking to someone
// matters, and this is too important to gate behind a subscription. Distinct
// from the editorial AdvisementBanner rotation — single message, single
// purpose: "help is here when you need it."
function TherapyReminder() {
  return (
    <section className="bg-white border-l-4 border border-[#E8E4DC] mt-6 print:hidden" style={{ borderLeftColor: '#5A6E3D' }}>
      <a href="https://tlctherapysolutions-scheduleappointment.as.me/" target="_blank" rel="noopener noreferrer" className="block p-4 hover:bg-[#FAF8F4] transition-colors">
        <div className="flex items-baseline justify-between gap-3 flex-wrap mb-1">
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#5A6E3D] font-semibold">🌿 Need someone to talk to?</div>
          <div className="text-[10px] uppercase tracking-wider text-[#5A5751]">For every family · every tier</div>
        </div>
        <h3 className="text-base sm:text-lg mb-1" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600, letterSpacing: '-0.01em' }}>TLC Therapy Solutions · Real solutions for real life</h3>
        <p className="text-sm mb-1" style={{ fontFamily: '"Fraunces", serif' }}>
          Money stress. Family stress. Marriage stress. Grief. Parenting hard seasons. You don't have to carry it alone — and you don't have to wait until it's a crisis to reach out.
        </p>
        <p className="text-xs text-[#5A5751] mb-2" style={{ fontFamily: '"Fraunces", serif' }}>
          Faith-integrated therapy · 7-clinician team · accepts BCBS, Aetna, UHC, VA, Cigna · online and in-person.
        </p>
        <div className="text-[10px] uppercase tracking-wider font-semibold text-[#5A6E3D]">Book a session →</div>
      </a>
    </section>
  );
}

function AdvisementBanner() {
  const [index, setIndex] = useState(0);
  const advisements = [
    {
      brand: 'The Church of the Living God',
      tagline: 'RESET! Reviving Faith · Restoring Hope · Rebuilding Communities',
      detail: 'Sunday Worship 11AM · Wed Bible Study 1PM & 6PM · 312 E. Bradley Ave, Champaign IL',
      cta: 'Visit thechurchofthelivinggod.com',
      url: 'https://thechurchofthelivinggod.com',
      tag: 'Faith Community',
      accent: '#B85838',
    },
    {
      brand: 'TLC Therapy Solutions',
      tagline: 'Real Solutions for Real Life · Faith-integrated therapy',
      detail: 'Online & in-person · Accepts BCBS, Aetna, UHC, VA, Cigna · 7-clinician team',
      cta: 'Book a Session →',
      url: 'https://tlctherapysolutions-scheduleappointment.as.me/',
      tag: 'Mental Health',
      accent: '#5A6E3D',
    },
    {
      brand: 'COLG · YouTube Live',
      tagline: 'Worship from anywhere · The Love Corner experience',
      detail: 'Sunday service streams live · Subscribe to be notified',
      cta: 'Watch on YouTube →',
      url: 'https://www.youtube.com/channel/UC821pJh7YR5llBNnWUJj-ZA',
      tag: 'Live Worship',
      accent: '#B85838',
    },
    {
      brand: 'Poe Properties LLC',
      tagline: 'Quality rentals in Champaign-Urbana · Owner-managed',
      detail: '11 rental homes · Faith-led ownership · Community-rooted',
      cta: 'Inquire about availability',
      url: 'mailto:contact@poetech.us?subject=Poe Properties Rental Inquiry',
      tag: 'Housing',
      accent: '#5A6E3D',
    },
    {
      brand: 'COLG · 77th National Assembly',
      tagline: 'Annual gathering · Faith, fellowship, growth',
      detail: 'Find dates and registration on the church site',
      cta: 'Learn more →',
      url: 'https://www.thechurchofthelivinggod.com/77th-national-assembly.html',
      tag: 'Event',
      accent: '#B85838',
    },
    {
      brand: 'COLG · Bible Reading Challenge 2026',
      tagline: 'Read through with the church · Discussion guides included',
      detail: 'Wednesday Bible Study 1PM & 6PM · Join in-person or online',
      cta: 'See the reading plan →',
      url: 'https://www.thechurchofthelivinggod.com/bible-reading-challenge-2026.html',
      tag: 'Discipleship',
      accent: '#B85838',
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => setIndex(i => (i + 1) % advisements.length), 8000);
    return () => clearInterval(interval);
  }, [advisements.length]);

  const a = advisements[index];

  return (
    <section className="bg-white border border-[#E8E4DC]">
      <div className="px-3 py-1 border-b border-[#E8E4DC] flex items-baseline justify-between gap-2 flex-wrap">
        <div className="text-[9px] uppercase tracking-[0.25em] text-[#5A5751]">⌾ Advisement · Family Ministries & Solutions</div>
        <div className="flex items-center gap-1">
          {advisements.map((_, i) => (
            <button key={i} onClick={() => setIndex(i)} aria-label={`Show advisement ${i + 1}`} className={`w-1.5 h-1.5 rounded-full transition-all ${i === index ? 'bg-[#1A1815] w-3' : 'bg-[#E8E4DC]'}`}></button>
          ))}
        </div>
      </div>
      <a href={a.url} target="_blank" rel="noopener noreferrer" className="block p-4 hover:bg-[#FAF8F4] transition-colors">
        <div className="flex items-baseline justify-between gap-3 mb-1 flex-wrap">
          <div className="text-[10px] uppercase tracking-[0.25em] font-semibold" style={{ color: a.accent }}>{a.tag}</div>
          <div className="text-[10px] uppercase tracking-wider text-[#5A5751]">{index + 1} of {advisements.length}</div>
        </div>
        <h3 className="text-base sm:text-lg mb-1" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600, letterSpacing: '-0.01em' }}>{a.brand}</h3>
        <p className="text-sm mb-1" style={{ fontFamily: '"Fraunces", serif', fontStyle: 'italic' }}>{a.tagline}</p>
        <p className="text-xs text-[#5A5751] mb-2" style={{ fontFamily: '"Fraunces", serif' }}>{a.detail}</p>
        <div className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: a.accent }}>{a.cta} →</div>
      </a>
      <div className="px-3 py-1.5 border-t border-[#E8E4DC] text-[9px] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>
        Foundation tier · Family ministries & businesses are highlighted to all free users. Paid tiers don't see this.
      </div>
    </section>
  );
}


// Floating button bottom-right · reads the visible view · speed options
// =============================================================================
// UpdatePrompt — fires when a new service worker version is waiting to take
// over. Shows a polite "New version available · Reload to update" banner.
// Reload posts SKIP_WAITING to the SW; main.jsx's controllerchange listener
// then performs window.location.reload() exactly once when the new SW activates.
function UpdatePrompt() {
  const [reg, setReg] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onUpdate = (e) => {
      if (e && e.detail && e.detail.reg) setReg(e.detail.reg);
    };
    window.addEventListener('poetech:update-available', onUpdate);
    // Late-mount catch: if the event fired before we subscribed, the
    // registration may still be on window.
    if (window.__pwaReg && window.__pwaReg.waiting) setReg(window.__pwaReg);
    return () => window.removeEventListener('poetech:update-available', onUpdate);
  }, []);

  if (!reg || dismissed) return null;

  const reload = () => {
    try {
      if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      else window.location.reload();
    } catch (e) { window.location.reload(); }
  };

  return (
    <div className="update-prompt fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-sm print:hidden">
      <div className="bg-[#1A1815] text-white border-2 border-[#1A1815] shadow-xl p-3">
        <div className="flex items-baseline justify-between gap-2 mb-1.5">
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#FAF8F4] font-semibold opacity-90">✨ New version available</div>
          <button type="button" onClick={() => setDismissed(true)} aria-label="Dismiss" className="text-[10px] uppercase tracking-wider opacity-70 hover:opacity-100">×</button>
        </div>
        <p className="text-xs leading-snug mb-2" style={{ fontFamily: '"Fraunces", serif' }}>
          A fresh version of PoeTech downloaded in the background. Reload to use it — your data stays put.
        </p>
        <button type="button" onClick={reload} className="w-full bg-[#B85838] text-white px-3 py-2 text-xs uppercase tracking-wider font-semibold hover:bg-[#FAF8F4] hover:text-[#1A1815]">
          Reload to update
        </button>
      </div>
    </div>
  );
}

// InstallPrompt — PWA install nudge for iOS + Android visitors
// - Android Chrome / Edge: catches the beforeinstallprompt event and shows
//   a single-button "Install PoeTech" banner that fires the native prompt.
// - iOS Safari: detects iOS + non-standalone and shows a small banner with
//   manual "Tap Share, then Add to Home Screen" instructions.
// - Dismissible. Dismissal is stored in localStorage for 30 days so we don't
//   nag returning visitors. Auto-hides once installed.
function InstallPrompt() {
  const [deferredEvt, setDeferredEvt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(true); // assume dismissed until we check storage

  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Check whether already running in standalone (installed) mode
    const standalone =
      window.matchMedia && window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    if (standalone) { setInstalled(true); return; }

    // iOS detection - Safari doesn't fire beforeinstallprompt
    const ua = window.navigator.userAgent || '';
    const ios = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    setIsIOS(ios);

    // Read dismissal flag
    try {
      const stamp = window.localStorage.getItem('pwa-install-dismissed');
      if (stamp) {
        const days = (Date.now() - parseInt(stamp, 10)) / 86400000;
        if (days < 30) { setDismissed(true); return; }
      }
      setDismissed(false);
    } catch (e) {
      setDismissed(false);
    }

    const onPrompt = (e) => {
      e.preventDefault();
      setDeferredEvt(e);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', () => { setInstalled(true); setDeferredEvt(null); });
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  const dismiss = () => {
    try { window.localStorage.setItem('pwa-install-dismissed', String(Date.now())); } catch (e) {}
    setDismissed(true);
  };

  const installAndroid = async () => {
    if (!deferredEvt) return;
    deferredEvt.prompt();
    try { await deferredEvt.userChoice; } catch (e) {}
    setDeferredEvt(null);
  };

  if (installed || dismissed) return null;
  if (!deferredEvt && !isIOS) return null;

  return (
    <div className="install-prompt fixed bottom-4 left-4 right-20 sm:right-auto z-40 max-w-xs print:hidden">
      <div className="bg-white border-2 border-[#1A1815] shadow-lg p-3">
        <div className="flex items-baseline justify-between gap-2 mb-2">
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] font-semibold">📲 Install PoeTech</div>
          <button type="button" onClick={dismiss} aria-label="Dismiss install prompt" className="text-[10px] uppercase tracking-wider text-[#5A5751] hover:text-[#1A1815]">×</button>
        </div>
        {deferredEvt ? (
          <>
            <p className="text-xs leading-snug mb-2" style={{ fontFamily: '"Fraunces", serif' }}>
              Add PoeTech to your home screen so you can open it like a regular app — works offline, no browser bar, faster launch.
            </p>
            <button type="button" onClick={installAndroid} className="w-full bg-[#1A1815] text-white px-3 py-2 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838]">
              Install on this device
            </button>
          </>
        ) : isIOS ? (
          <>
            <p className="text-xs leading-snug mb-2" style={{ fontFamily: '"Fraunces", serif' }}>
              On iPhone or iPad: tap the <strong>Share</strong> button at the bottom of Safari, then choose <strong>Add to Home Screen</strong>.
            </p>
            <p className="text-[10px] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>
              Once added, PoeTech opens like a regular app — works offline, no browser bar.
            </p>
          </>
        ) : null}
      </div>
    </div>
  );
}

function TTSControls() {
  const [isOpen, setIsOpen] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [rate, setRate] = useState(1.5);
  const [supported] = useState(typeof window !== 'undefined' && 'speechSynthesis' in window);

  const stopReading = () => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setIsReading(false);
    setIsPaused(false);
  };

  const startReading = () => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    // Get visible page content — prefer the main element
    const main = document.querySelector('main') || document.body;
    if (!main) return;
    // Clone and strip floating UI elements (TTS button itself, feedback modal)
    const clone = main.cloneNode(true);
    clone.querySelectorAll('.tts-controls, .feedback-modal, [aria-hidden="true"]').forEach(el => el.remove());
    const text = clone.innerText.trim().replace(/\s+/g, ' ').slice(0, 32000);
    if (!text) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.onend = () => { setIsReading(false); setIsPaused(false); };
    utterance.onerror = () => { setIsReading(false); setIsPaused(false); };
    window.speechSynthesis.speak(utterance);
    setIsReading(true);
    setIsPaused(false);
  };

  const togglePause = () => {
    if (!supported) return;
    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    } else {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  };

  useEffect(() => {
    return () => { if (supported) window.speechSynthesis.cancel(); };
  }, [supported]);

  if (!supported) return null;

  return (
    <div className="tts-controls fixed bottom-4 right-4 z-40 print:hidden">
      {isOpen ? (
        <div className="bg-white border-2 border-[#1A1815] p-3 shadow-lg min-w-[240px]">
          <div className="flex items-baseline justify-between mb-3">
            <div>
              <div className="text-[9px] uppercase tracking-[0.25em] text-[#B85838] font-semibold">🔊 Read Aloud</div>
              <div className="text-[10px] text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>{isReading ? (isPaused ? 'Paused' : 'Reading…') : 'Ready'}</div>
            </div>
            <button type="button" onClick={() => { stopReading(); setIsOpen(false); }} className="text-[10px] uppercase tracking-wider text-[#5A5751] hover:text-[#1A1815]">× Close</button>
          </div>
          <div className="grid grid-cols-3 gap-1 mb-3">
            {!isReading ? (
              <button type="button" onClick={startReading} className="col-span-3 bg-[#1A1815] text-white px-3 py-2 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838]">▶ Read this page</button>
            ) : (
              <>
                <button type="button" onClick={togglePause} className="bg-[#1A1815] text-white px-2 py-2 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838]">{isPaused ? '▶ Resume' : '⏸ Pause'}</button>
                <button type="button" onClick={stopReading} className="col-span-2 border border-[#1A1815] text-[#1A1815] px-2 py-2 text-xs uppercase tracking-wider hover:bg-[#1A1815] hover:text-white">⏹ Stop</button>
              </>
            )}
          </div>
          <div className="mb-2">
            <div className="text-[9px] uppercase tracking-wider text-[#5A5751] mb-1">Speed: {rate.toFixed(1)}x</div>
            <div className="grid grid-cols-5 gap-1">
              {[
                { label: '1.0x', value: 1.0 },
                { label: '1.5x', value: 1.5 },
                { label: '2.0x', value: 2.0 },
                { label: '2.5x', value: 2.5 },
                { label: '3.0x', value: 3.0 },
              ].map(s => (
                <button key={s.label} onClick={() => { setRate(s.value); if (isReading) { stopReading(); setTimeout(startReading, 100); } }} className={`px-2 py-1.5 text-[10px] uppercase tracking-wider border ${rate === s.value ? 'border-[#1A1815] bg-[#1A1815] text-white' : 'border-[#E8E4DC] text-[#5A5751] hover:border-[#1A1815]'}`}>{s.label}</button>
              ))}
            </div>
          </div>
          <p className="text-[9px] text-[#5A5751] leading-snug" style={{ fontFamily: '"Fraunces", serif' }}>
            Reads the visible page so anyone can conduct business — even without reading the screen.
          </p>
        </div>
      ) : (
        <button type="button" onClick={() => setIsOpen(true)} aria-label="Open text-to-speech controls" title="Read aloud" className="bg-[#1A1815] text-white w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-lg hover:bg-[#B85838] flex items-center justify-center text-xl sm:text-2xl border-2 border-[#FAF8F4]">
          🔊
        </button>
      )}
    </div>
  );
}

// Round 12 — Feedback form refreshed to reflect every surface we've actually
// shipped through MVP v1.5. Area dropdown now mirrors the live nav + the major
// in-tab features (Action Queue, Capacity meter, Buffer Fund, Property
// Valuation, Inventory Forecast, Tier Switcher, etc.) so testers can pin
// notes to a specific surface. Adds a category picker (Bug · Confusion · Idea
// · Praise · Copy / wording · Performance · Accessibility) so we can triage
// the SME-review feedback by type. Pre-fills the user's currently-viewed tab.
const FEEDBACK_AREAS = [
  { group: 'Money', items: [
    ['overview', 'Big Picture · dashboard'],
    ['action-queue', '└ Action Queue (Changes · Incidents · Projects)'],
    ['capacity-meter', '└ Family Capacity meter'],
    ['xref-strip', '└ Cross-reference strip (rooms · equipment · leases · capex · watchlist)'],
    ['books-entities', 'Books · Entities'],
    ['books-accounts', 'Books · Accounts (cash / credit split)'],
    ['buffer-fund', '└ Buffer Fund (slider + target)'],
    ['books-transactions', 'Books · Transactions'],
    ['books-forecast', '└ 30/60/90 forecast vs trailing actuals'],
    ['books-calendar', 'Books · Calendar (recurring · incidents · events)'],
    ['books-1099', 'Books · 1099 tracking'],
    ['books-cart', 'Books · Subscriptions / Cart'],
    ['debts', 'Debts · Snowball / Avalanche'],
  ]},
  { group: 'Real Estate', items: [
    ['rentals', 'Real Estate · property list + map'],
    ['rentals-edit', '└ Inline quick-edit on property rows'],
    ['rentals-valuation', '└ Property Valuation (Zillow/Realtor/Redfin lookup + save)'],
    ['rentals-lease', '└ Lease & Tenant Contact'],
    ['rentals-equipment', '└ Mechanical & Equipment inventory'],
    ['rentals-rooms', '└ Rooms & Needed Work tracker'],
    ['rentals-maint', '└ Maintenance log (urgency-banded)'],
    ['rentals-convo', '└ Tenant / vendor conversation log'],
    ['rentals-snowball', '└ 7-year mortgage payoff snowball'],
    ['rentals-evaluator', '└ Investment evaluator (cap rate · DSCR · 1%)'],
    ['rentals-tenant-issue', '└ Tenant Not Paying → issue affordance'],
  ]},
  { group: 'Markets · Church', items: [
    ['markets', 'Markets · watchlist (Stooq feed)'],
    ['church', 'Church · service times / media / prayer / ministry'],
  ]},
  { group: 'Projects · Ops', items: [
    ['projects', 'Projects · Timeline + workload'],
    ['scopes', 'Projects · Scope-of-work agreements'],
    ['scope-payment', '└ Scope · materials-paid-by + payment policy'],
    ['inventory-forecast', 'Projects · Inventory & 12-month capital forecast'],
    ['savings-prompts', '└ Savings prompts per capex item'],
    ['itsm-taxonomy', 'ITSM taxonomy (Change · Incident · Project)'],
  ]},
  { group: 'Practice · Dev/Ops', items: [
    ['practice', 'Practice · inquiry capture & conversion'],
    ['opportunities', 'Dev/Ops · personalized options engine'],
    ['opportunities-library', '└ Curated opportunity library (~46 entries)'],
    ['opportunities-wrap', '└ "Wrap me with the tech" handoff'],
    ['opportunities-pipeline', '└ Active pipeline'],
    ['services-portfolio', '└ PoeTech Services Portfolio'],
    ['skill-profiles', '└ Skill profiles'],
  ]},
  { group: 'About · Tiers · System', items: [
    ['about-pricing', 'About · pricing tiers + features'],
    ['about-modules', 'About · planned modules + vote'],
    ['about-markets', 'About · markets we serve'],
    ['about-community', 'About · community partnership model'],
    ['tier-gating', 'Tier gating (Foundation / PoeTech+ / Family / Premium / Business)'],
    ['tier-switcher', 'Tier switcher (header dropdown)'],
  ]},
  { group: 'Cross-cutting', items: [
    ['navigation', 'Navigation · tab order · separator'],
    ['themes', 'Visual themes (Snow · Glacier · Sapphire · Rose · Midnight)'],
    ['accessibility', 'Accessibility (WCAG 2.1 AA · labels · contrast · keyboard)'],
    ['tts', 'Text-to-Speech / Read aloud'],
    ['notifications', 'Browser reminders / notifications'],
    ['storage', 'Local-first storage / load / save'],
    ['mobile', 'Mobile responsiveness'],
    ['performance', 'Performance · render speed'],
    ['copy', 'Copy / wording / clarity'],
    ['other', 'Other'],
  ]},
];
const FEEDBACK_CATEGORIES = [
  { key: 'bug',          label: '🐛 Bug',           accent: '#B85838' },
  { key: 'confusion',    label: '❓ Confusion',     accent: '#D97706' },
  { key: 'idea',         label: '💡 Idea / feature',accent: '#1F6FEB' },
  { key: 'copy',         label: '✏️ Copy / wording',accent: '#5A5751' },
  { key: 'accessibility',label: '♿ Accessibility', accent: '#5A6E3D' },
  { key: 'performance',  label: '⚡ Performance',   accent: '#D97706' },
  { key: 'praise',       label: '✨ Praise',         accent: '#5A6E3D' },
];

function FeedbackModal({ onClose, onSubmit, currentView }) {
  const [rating, setRating] = useState('');
  // Pre-fill area from the currently-active view if it maps to an area key.
  const initialArea = (() => {
    if (currentView === 'rentals') return 'rentals';
    if (currentView === 'books') return 'books-accounts';
    if (currentView === 'debts') return 'debts';
    if (currentView === 'projects') return 'projects';
    if (currentView === 'practice') return 'practice';
    if (currentView === 'opportunities') return 'opportunities';
    if (currentView === 'markets') return 'markets';
    if (currentView === 'church') return 'church';
    if (currentView === 'about') return 'about-pricing';
    return 'overview';
  })();
  const [area, setArea] = useState(initialArea);
  const [categories, setCategories] = useState([]);
  const [whatsWorking, setWhatsWorking] = useState('');
  const [whatsNot, setWhatsNot] = useState('');
  const [whatsMissing, setWhatsMissing] = useState('');
  const [formError, setFormError] = useState('');

  const toggleCategory = (k) => setCategories(prev => prev.includes(k) ? prev.filter(c => c !== k) : [...prev, k]);

  const handleSubmit = () => {
    if (!rating && categories.length === 0 && !whatsWorking && !whatsNot && !whatsMissing) {
      setFormError('Pick a rating, a category, or jot any note — anything is helpful.');
      return;
    }
    onSubmit({ rating, area, categories, whatsWorking, whatsNot, whatsMissing });
  };

  const ratings = [
    { key: 'love', label: '✨ Love it', color: '#5A6E3D' },
    { key: 'good', label: '👍 Good', color: '#5A6E3D' },
    { key: 'okay', label: '🤔 Okay', color: '#5A5751' },
    { key: 'rough', label: '😬 Rough', color: '#B85838' },
    { key: 'broken', label: '💔 Broken', color: '#B85838' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-6 print:hidden" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }} onClick={onClose}>
      <div className="bg-white border-2 border-[#1A1815] max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 sm:p-6">
          <div className="flex items-baseline justify-between gap-3 mb-3">
            <div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-[#B85838] font-semibold mb-1">💬 Feedback · MVP v1.5 · SME Review</div>
              <h3 className="text-xl sm:text-2xl" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600, letterSpacing: '-0.02em' }}>Tell us what you think.</h3>
            </div>
            <button type="button" onClick={onClose} className="text-[10px] uppercase tracking-wider text-[#5A5751] hover:text-[#1A1815]">× Close</button>
          </div>
          <p className="text-sm text-[#5A5751] mb-4" style={{ fontFamily: '"Fraunces", serif' }}>
            Anything you share helps. Skip any section — partial feedback is more useful than no feedback. Saved locally; nothing leaves your device until you choose to share it.
          </p>

          <div className="space-y-4">
            <div>
              <div className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751] mb-2 font-semibold">Overall feeling</div>
              <div className="grid grid-cols-5 gap-1">
                {ratings.map(r => (
                  <button key={r.key} type="button" onClick={() => setRating(r.key)} className={`p-2 text-xs border ${rating === r.key ? 'border-[#1A1815] bg-[#FAF8F4]' : 'border-[#E8E4DC] text-[#5A5751]'}`} style={rating === r.key ? { color: r.color, fontWeight: 600 } : {}}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751] mb-1 font-semibold">Which area? (sub-features indented)</div>
              <select className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={area} onChange={e => setArea(e.target.value)}>
                {FEEDBACK_AREAS.map(grp => (
                  <optgroup key={grp.group} label={grp.group}>
                    {grp.items.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
                  </optgroup>
                ))}
              </select>
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751] mb-1 font-semibold">Category (pick any that apply)</div>
              <div className="flex flex-wrap gap-1">
                {FEEDBACK_CATEGORIES.map(c => (
                  <button key={c.key} type="button" onClick={() => toggleCategory(c.key)} className="text-xs uppercase tracking-wider px-3 py-1.5 border min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]" style={categories.includes(c.key) ? { backgroundColor: c.accent, color: 'white', borderColor: c.accent } : { color: c.accent, borderColor: c.accent }}>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-[0.25em] text-[#5A6E3D] mb-1 font-semibold">✓ What's working</div>
              <textarea className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" rows="2" placeholder="What feels right? What helps you?" value={whatsWorking} onChange={e => setWhatsWorking(e.target.value)} />
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] mb-1 font-semibold">✗ What's not working / what's confusing</div>
              <textarea className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" rows="2" placeholder="Bug · confusion · friction · unclear text · too much · too little · doesn't reflect reality" value={whatsNot} onChange={e => setWhatsNot(e.target.value)} />
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] mb-1 font-semibold">+ What's missing / what would help</div>
              <textarea className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" rows="2" placeholder="Features you wish existed · workflows that don't fit · what would make this perfect for you" value={whatsMissing} onChange={e => setWhatsMissing(e.target.value)} />
            </div>
          </div>

          <div className="flex gap-2 mt-5 pt-4 border-t border-[#E8E4DC]">
            {formError && <div className="text-xs text-[#B85838] mb-2 px-3 py-2 bg-[#FAF8F4] border border-[#B85838] w-full" role="alert" style={{ fontFamily: '"Fraunces", serif' }}>{formError}</div>}
            <button type="button" onClick={handleSubmit} className="bg-[#1A1815] text-[#FAF8F4] px-6 py-2.5 text-xs uppercase tracking-wider hover:bg-[#B85838] font-semibold">Submit Feedback</button>
            <button type="button" onClick={onClose} className="border border-[#E8E4DC] text-[#5A5751] px-6 py-2.5 text-xs uppercase tracking-wider hover:border-[#1A1815]">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// FEEDBACK PROMOTE PANEL — Projects tab
// =============================================================================
// Wraps the QueueSpotlight pattern (one item at a time + dropdown nav)
// around the feedback log, with three promotion actions per item:
//   + Change   — creates a project tagged category='change-request' (ITIL
//                "change" model; no dedicated changes collection in v0 — the
//                v2 schema CIL section adds change_requests proper later)
//   + Incident — calls addIncident() with the feedback content as description
//   + Project  — calls addProject() with the feedback content as description
//
// Original feedback stays in the queue after any promotion (non-destructive);
// the × secondary action deletes the feedback if the user wants it removed.
// Per 2026-05-24 design ask from Darrell: reusable Queue Spotlight pattern so
// future surfaces (incidents queue, prayer requests, action queue) can adopt
// the same one-at-a-time + dropdown navigation.
// =============================================================================
function buildFeedbackDescription(f) {
  return [
    f.whatsWorking ? `✓ Working: ${f.whatsWorking}` : null,
    f.whatsNot ? `✗ Not working: ${f.whatsNot}` : null,
    f.whatsMissing ? `+ Missing: ${f.whatsMissing}` : null,
    f.rating ? `Rating: ${f.rating}` : null,
  ].filter(Boolean).join('\n\n');
}

function feedbackSummary(f, maxLen = 60) {
  const summary = (f.whatsNot || f.whatsMissing || f.whatsWorking || 'Tester note').trim();
  return summary.length > maxLen ? summary.slice(0, maxLen - 3) + '...' : summary;
}

function FeedbackPromotePanel({ feedback = [], addProject, addIncident, deleteFeedback }) {
  if (!feedback || feedback.length === 0) return null;
  const sorted = [...feedback].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const promoteToProject = (f) => {
    const name = `${f.area || 'Feedback'}: ${feedbackSummary(f)}`;
    addProject({
      name,
      description: buildFeedbackDescription(f),
      status: 'planning',
      sourceFeedbackId: f.id,
      _note: `promoted from feedback (${f.area || 'tester note'})`,
    });
    alert(`Project created: "${name}"`);
  };

  const promoteToIncident = (f) => {
    const description = `[from feedback · ${f.area || 'note'}] ${feedbackSummary(f, 120)}`;
    addIncident({
      description,
      amount: 0,
      category: 'other',
      entityId: 'e-personal',
      date: new Date().toISOString().slice(0, 10),
      contractorIds: [],
      sourceFeedbackId: f.id,
      _note: `promoted from feedback (${f.area || 'tester note'})`,
    });
    alert('Incident created. Fill in amount + entity on the incident.');
  };

  const promoteToChange = (f) => {
    // No `changes` collection yet (v2 schema CIL section adds change_requests
    // later). For v0 a "change" is a project tagged with category='change-request'
    // so it shows up alongside other projects but is filterable later.
    const name = `Change: ${f.area || 'Feedback'}: ${feedbackSummary(f)}`;
    addProject({
      name,
      description: buildFeedbackDescription(f),
      category: 'change-request',
      status: 'planning',
      sourceFeedbackId: f.id,
      _note: `promoted from feedback as change-request (${f.area || 'tester note'})`,
    });
    alert(`Change request created (tagged as 'change-request' in projects).`);
  };

  return (
    <div className="mt-8">
      <Queue
        title="Feedback Log · Promote queue"
        subtitle="Focused item is in full detail at top. Browse the rest below and click any card to bring it into focus."
        emoji="💬"
        accent="#B85838"
        items={sorted}
        getKey={(f) => f.id}
        defaultPageSize={5}
        pageSizeOptions={[5, 25, 50]}
        renderFocus={(f) => (
          <div>
            <div className="flex items-baseline justify-between gap-2 mb-2 flex-wrap">
              <div className="text-[10px] uppercase tracking-wider">
                <span className="font-semibold text-[#B85838]">{f.area || 'Note'}</span>
                {f.rating && <span className="text-[#5A5751]"> · {f.rating}</span>}
              </div>
              <span className="text-[9px] text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                {new Date(f.createdAt).toLocaleString()}
              </span>
            </div>
            {f.whatsWorking && (
              <div className="mb-2">
                <div className="text-[9px] uppercase tracking-wider text-[#5A6E3D] font-semibold">✓ Working</div>
                <p className="text-sm" style={{ fontFamily: '"Fraunces", serif' }}>{f.whatsWorking}</p>
              </div>
            )}
            {f.whatsNot && (
              <div className="mb-2">
                <div className="text-[9px] uppercase tracking-wider text-[#B85838] font-semibold">✗ Not working</div>
                <p className="text-sm" style={{ fontFamily: '"Fraunces", serif' }}>{f.whatsNot}</p>
              </div>
            )}
            {f.whatsMissing && (
              <div className="mb-2">
                <div className="text-[9px] uppercase tracking-wider text-[#B85838] font-semibold">+ Missing</div>
                <p className="text-sm" style={{ fontFamily: '"Fraunces", serif' }}>{f.whatsMissing}</p>
              </div>
            )}
          </div>
        )}
        renderCard={(f) => {
          const d = new Date(f.createdAt);
          const dateStr = `${d.getMonth() + 1}/${d.getDate()}`;
          return (
            <div className="flex items-baseline justify-between gap-2 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase tracking-wider">
                  <span className="font-semibold text-[#B85838]">{f.area || 'Note'}</span>
                  {f.rating && <span className="text-[#5A5751]"> · {f.rating}</span>}
                </div>
                <div className="text-sm truncate" style={{ fontFamily: '"Fraunces", serif' }}>
                  {feedbackSummary(f, 80)}
                </div>
              </div>
              <span className="text-[9px] text-[#5A5751] shrink-0" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                {dateStr}
              </span>
            </div>
          );
        }}
        actions={[
          { label: '+ Change', onClick: promoteToChange, color: '#5A6E3D' },
          { label: '+ Incident', onClick: promoteToIncident, color: '#B85838' },
          { label: '+ Project', onClick: promoteToProject, color: '#1A1815' },
          { label: '× Delete', onClick: (f) => { if (confirm('Delete this feedback? It will be removed from the queue but any projects/incidents/changes you already created from it remain.')) deleteFeedback(f.id); }, secondary: true },
        ]}
      />
    </div>
  );
}

// =============================================================================
// BIG PICTURE — v7 dashboard horizontal-first
// =============================================================================
function BigPictureDashboard({ totals, pressure, setPressure, pressureCalc, projection, rentalSnowball, flaggedRentals, flaggedOpportunities, entityRollups, reserves, upcomingEvents, welcomeDismissed, dismissWelcome, setView, setFeedbackOpen, bufferTarget = 0, bufferCurrent = 0, setBufferCurrent, capexItems = [], watchlist = [], rentals = [], incidents = [], projects = [], resolveIncident, skillProfiles = [], addIncident, addProject, entities = [], ingestData = null, setBooksView = null }) {
  // Round 16/17 — Action Queue per-row inline expansion. Tracks which queue
  // item (if any) is currently expanded. Tapping the row body opens the full
  // details + lifecycle log + jump-link inline, so the user never loses
  // context by navigating away. Per
  // /docs/00-foundations/_root/LIFECYCLE-AND-HANDOFF.md Pattern 1 + the
  // founder's UX feedback (r17): "clicking Open jumps to another page and I
  // lose what I clicked — feels clunky."
  const [expandedItemId, setExpandedItemId] = useState(null);
  // Round 12 — Manual Add Item form state for the Action Queue.
  const [showAddQueue, setShowAddQueue] = useState(false);
  const blankQueueItem = () => ({ urgency: 'incident', description: '', linkType: '', linkId: '', cost: 0, dueDate: '' });
  const [queueForm, setQueueForm] = useState(blankQueueItem());
  const pickUrgency = (key) => setQueueForm(f => ({ ...f, urgency: key, dueDate: dueDateFor(key) }));
  const submitQueueItem = () => {
    if (!queueForm.description.trim()) { alert('Describe the issue or work first.'); return; }
    if (queueForm.urgency === 'project') {
      const hpw = 4;
      const decision = capacityDecisionForNewProject(projects, skillProfiles, hpw, { label: `"${queueForm.description}" (~${hpw} hrs/wk)` });
      if (decision.decision === 'cancel') return;
      const todayIso = new Date().toISOString().slice(0, 10);
      addProject && addProject({
        title: queueForm.description.slice(0, 80) + (decision.decision === 'add-tbd' ? ' (TBD)' : ''),
        startDate: todayIso,
        endDate: queueForm.dueDate || '',
        status: decision.decision === 'add-tbd' ? 'tbd' : 'planning',
        domain: 'personal',
        description: `Created from Action Queue.${decision.decision === 'add-tbd' ? '\n\nTBD — parked because family is near/over capacity.' : ''}`,
        hoursPerWeek: hpw,
        entityId: queueForm.linkType === 'entity' ? queueForm.linkId : 'e-personal',
        contractorIds: [],
        conversationLog: [],
      });
      alert(`Added as Project (${decision.decision === 'add-tbd' ? 'TBD' : 'planning'}). Edit details on the Projects tab.`);
    } else {
      addIncident && addIncident({
        date: new Date().toISOString().slice(0, 10),
        amount: parseFloat(queueForm.cost) || 0,
        category: queueForm.linkType === 'rental' ? 'tenant-or-property' : 'general',
        entityId: queueForm.linkType === 'entity' ? queueForm.linkId : (queueForm.linkType === 'rental' ? 'e-poeprops' : 'e-personal'),
        description: queueForm.description,
        urgency: queueForm.urgency,
        status: 'open',
        dueDate: queueForm.dueDate || dueDateFor(queueForm.urgency),
        linkedTo: queueForm.linkType && queueForm.linkId ? { type: queueForm.linkType, id: queueForm.linkId } : undefined,
      });
    }
    setQueueForm(blankQueueItem());
    setShowAddQueue(false);
  };
  // Round 11 — Family capacity snapshot. Sums project hrs/wk (active only)
  // against total skillProfile hrs/wk. Surfaces a meter and warns at 80%/100%.
  const capacity = capacitySnapshot(projects, skillProfiles);
  // Round 10 — Action Queue. Consolidates all open ITSM-class items across the
  // app: Changes (broken now), Incidents (3-day fix), active Projects. Each
  // entry shows urgency band, what + where, age in days. Click jumps to source.
  const todayISO = new Date().toISOString().slice(0, 10);
  const ageInDays = (dateStr) => {
    if (!dateStr) return 0;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 0;
    return Math.floor((Date.now() - d.getTime()) / 86400000);
  };
  const isOverdue = (item) => item.dueDate && item.dueDate < todayISO;
  const openIncidents = incidents.filter(i => i.status !== 'resolved');
  const activeProjects = projects.filter(p => p.status !== 'complete' && p.status !== 'on-hold');
  // Tenant-not-paying — derived from rentals with status 'late' that don't
  // already have an open incident pointing at them.
  const tenantLateRentals = rentals.filter(r => r.status === 'late' && (r.rent || 0) > 0);
  const tenantLateNotTracked = tenantLateRentals.filter(r => !openIncidents.some(i => i.linkedTo?.type === 'rental' && i.linkedTo?.id === r.id));
  // Sort: by urgency order (change first), then by overdue, then by due date.
  const queue = [
    ...openIncidents.map(i => ({
      kind: 'incident',
      id: i.id,
      urgency: i.urgency || 'incident',
      title: i.description,
      meta: i.amount ? fmt(i.amount) : '',
      date: i.date,
      dueDate: i.dueDate,
      jump: (i.linkedTo?.type === 'rental') ? 'rentals' : (i.category === 'medical' || i.category === 'personal') ? 'books' : 'books',
      overdue: isOverdue(i),
      _item: i,
    })),
    ...tenantLateNotTracked.map(r => ({
      kind: 'tenant-late',
      id: `tlr-${r.id}`,
      urgency: 'incident',
      title: `Tenant at ${r.name} behind on rent`,
      meta: `${fmt(r.rent - (r.actual || 0))} short`,
      date: todayISO,
      dueDate: dueDateFor('incident'),
      jump: 'rentals',
      overdue: false,
      _item: r,
    })),
    ...activeProjects.map(p => ({
      kind: 'project',
      id: p.id,
      urgency: 'project',
      title: p.title,
      meta: p.status,
      date: p.startDate,
      dueDate: p.endDate,
      jump: 'projects',
      overdue: isOverdue({ dueDate: p.endDate }),
      _item: p,
    })),
  ].sort((a, b) => {
    const ua = URGENCY_INDEX[a.urgency]?.order || 99;
    const ub = URGENCY_INDEX[b.urgency]?.order || 99;
    if (ua !== ub) return ua - ub;
    if (a.overdue !== b.overdue) return a.overdue ? -1 : 1;
    return (a.dueDate || '').localeCompare(b.dueDate || '');
  });
  const counts = URGENCY_BANDS.reduce((acc, u) => {
    acc[u.key] = queue.filter(q => q.urgency === u.key).length;
    return acc;
  }, {});
  // v28+ MVP v1.5 — Buffer Fund mini-card. Spec source: Poe Family Financial
  // Control System v1 → BufferFund sheet ("single highest-ROI move you can make").
  // Preparatory scaffolding — values feed the pending Buffer Fund progress bar
  // + gap callout. Display wiring not yet landed.
  // eslint-disable-next-line no-unused-vars
  const bufferPct = bufferTarget > 0 ? Math.min(100, Math.round((bufferCurrent / bufferTarget) * 100)) : 0;
  // eslint-disable-next-line no-unused-vars
  const bufferGap = Math.max(0, bufferTarget - bufferCurrent);
  // v28+ MVP v1.5 — Cross-references pulled from the single source of truth
  // (setData) so the dashboard reflects edits anywhere in the app without
  // duplicating data. Each is a one-liner computation, no extra state.
  const capexOpenSpend = capexItems.filter(c => c.status !== 'purchased').reduce((s, c) => s + (parseFloat(c.cost) || 0), 0);
  const capexP1Count = capexItems.filter(c => (c.priority || 99) <= 1 && c.status !== 'purchased').length;
  const watchlistCount = watchlist.length;
  const roomItemsNeedingWork = rentals.reduce((s, r) => s + ((r.rooms || []).reduce((ss, rm) => ss + (rm.items || []).filter(it => it.status === 'needs-work' || it.status === 'quoted' || it.status === 'scheduled').length, 0)), 0);
  const equipmentTracked = rentals.reduce((s, r) => s + (r.equipment || []).length, 0);
  const leasesEndingSoon = rentals.filter(r => r.lease?.end).filter(r => {
    const end = new Date(r.lease.end); const now = new Date();
    const days = (end - now) / 86400000; return days >= 0 && days <= 60;
  }).length;
  return (
    <div className="space-y-3 sm:space-y-4">
      {/* WELCOME PANEL — only shows until dismissed */}
      {!welcomeDismissed && (
        <section className="bg-white border-2 border-[#B85838] p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-[0.3em] text-[#B85838] font-semibold mb-1">MVP v1.0 · Welcome</div>
              <h2 className="text-2xl sm:text-3xl mb-2" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600, letterSpacing: '-0.02em' }}>Welcome to Your PoeTech Family OS.</h2>
              <p className="text-base leading-relaxed text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
                A family's stronghold for stewardship, work, and ministry made visible. Sample data is loaded so you can see how everything connects before importing real numbers.
              </p>
            </div>
            <button type="button" onClick={dismissWelcome} className="text-[10px] uppercase tracking-wider text-[#5A5751] hover:text-[#1A1815] shrink-0">× Dismiss</button>
          </div>
          <div className="mt-4">
            <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] font-semibold mb-2">Things to try</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { icon: '📊', label: 'Big Picture', desc: 'You\'re here — household snapshot · 3 hero metrics, pressure slider' },
                { icon: '💸', label: 'Debts → snowball slider', desc: 'Drag it · watch interest savings move · "YOU SAVE" updates live' },
                { icon: '🏠', label: 'Rentals → snowball cascade', desc: 'See which properties pay off when · 7-year debt freedom target' },
                { icon: '🩺', label: 'Practice tab', desc: 'Your practice pipeline · 8 sample inquiries · direct booking links' },
                { icon: '📅', label: 'Projects → workload bars', desc: 'See when heavy months are coming · 6 example projects loaded' },
                { icon: '🎨', label: 'Theme swatches (top right)', desc: 'Try them — midnight is the default, easy on the eyes' },
                { icon: '🔊', label: 'Read aloud (bottom right)', desc: 'Tap the speaker — reads any page aloud · 4 speed options for accessibility' },
              ].map((t, i) => (
                <div key={i} className="bg-[#FAF8F4] border border-[#E8E4DC] p-3">
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <span className="text-base">{t.icon}</span>
                    <span className="text-sm" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{t.label}</span>
                  </div>
                  <p className="text-xs text-[#5A5751] leading-snug" style={{ fontFamily: '"Fraunces", serif' }}>{t.desc}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-[#E8E4DC]">
            <p className="text-sm leading-relaxed" style={{ fontFamily: '"Fraunces", serif' }}>
              <strong>When something works, doesn't work, or could be better — tap the floating <button type="button" onClick={() => setFeedbackOpen(true)} className="text-[#B85838] underline font-semibold hover:text-[#1A1815]">💬 Feedback</button> button bottom-left of any page.</strong> We'll review your notes together. This is your home base — make it yours.
            </p>
            <div className="flex gap-2 mt-3 flex-wrap">
              <button type="button" onClick={dismissWelcome} className="bg-[#1A1815] text-[#FAF8F4] px-5 py-2 text-xs uppercase tracking-wider hover:bg-[#B85838]">Got it · Let's go</button>
              <button type="button" onClick={() => setFeedbackOpen(true)} className="border border-[#B85838] text-[#B85838] px-5 py-2 text-xs uppercase tracking-wider hover:bg-[#B85838] hover:text-white">Leave first impression</button>
            </div>
          </div>
        </section>
      )}

      {/* v28+ MVP v1.5 round 10 — ACTION QUEUE
          One-glance triage panel: Changes (broken now), Incidents (3-day fix),
          Projects (planned work). Anything across the app that needs attention
          surfaces here so you don't have to bounce between tabs to see "what's
          on fire today." Each row jumps to the source view when clicked. */}
      {/* Round 13 — Always render the Action Queue panel. The "+ Add item"
          button stays accessible even when the queue is empty so the family
          can log a Change / Incident / Project at any time. Empty-state copy
          appears in place of the queue rows when nothing's open. */}
      {(
        <section aria-labelledby="action-queue-h" className="bg-white border border-[#1A1815] p-4 sm:p-5">
          <div className="flex items-baseline justify-between gap-2 flex-wrap mb-3">
            <div>
              <h2 id="action-queue-h" className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] font-semibold">Action Queue · what needs you</h2>
              <p className="text-xs text-[#5A5751] mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>
                Changes are broken NOW (fix today). Incidents need resolution within 3 days. Projects are multi-day planned work.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex gap-1 text-[10px] uppercase tracking-wider">
                {URGENCY_BANDS.map(u => (
                  <span key={u.key} className="px-2 py-1 border border-[#E8E4DC]" style={{ color: counts[u.key] > 0 ? u.accent : '#5A5751', borderColor: counts[u.key] > 0 ? u.accent : '#E8E4DC' }}>
                    <span aria-hidden="true">{u.symbol} </span>{u.label} · {counts[u.key]}
                  </span>
                ))}
              </div>
              <button type="button" onClick={() => { setShowAddQueue(s => !s); if (!showAddQueue) setQueueForm({ ...blankQueueItem(), dueDate: dueDateFor('incident') }); }} className="text-xs uppercase tracking-wider px-3 py-2 border border-[#B85838] text-[#B85838] hover:bg-[#B85838] hover:text-white min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">{showAddQueue ? '× Cancel' : '+ Add item'}</button>
            </div>
          </div>

          {/* Round 12 — Manual creator with parameter rules inline */}
          {showAddQueue && (
            <div className="bg-[#FAF8F4] border-2 border-[#B85838] p-3 mb-4 space-y-3">
              <div>
                <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] font-semibold mb-2">What kind of item is this?</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {URGENCY_BANDS.map(u => (
                    <button key={u.key} type="button" onClick={() => pickUrgency(u.key)} className="text-left p-3 border min-h-[64px] focus:outline focus:outline-2 focus:outline-[#B85838]" style={queueForm.urgency === u.key ? { backgroundColor: u.accent, color: 'white', borderColor: u.accent } : { color: u.accent, borderColor: u.accent }}>
                      <div className="text-xs uppercase tracking-wider font-semibold"><span aria-hidden="true">{u.symbol}</span> {u.label}</div>
                      <div className="text-[10px] mt-1 opacity-90" style={{ fontFamily: '"Fraunces", serif' }}>
                        {u.key === 'change' && 'Broken NOW. Acted on today. Same-day due. Routes to Incidents.'}
                        {u.key === 'incident' && 'Needs resolution within ~3 days. Routes to Incidents.'}
                        {u.key === 'project' && 'Takes longer than 3 days. Routes to Projects (capacity check; TBD if family is over).'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label htmlFor="aq-desc" className="text-[9px] uppercase tracking-wider text-[#5A5751] block mb-1">What's the issue or work?</label>
                <input id="aq-desc" autoFocus className="w-full p-2 border border-[#1A1815] text-sm bg-white focus:outline focus:outline-2 focus:outline-[#B85838]" placeholder="e.g., Furnace died at 240 Cedar Ln Apt 4 · Replace front door lock · File quarterly taxes" value={queueForm.description} onChange={e => setQueueForm({ ...queueForm, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label htmlFor="aq-link" className="text-[9px] uppercase tracking-wider text-[#5A5751] block mb-1">Linked to (optional)</label>
                  <select id="aq-link" className="w-full p-2 border border-[#E8E4DC] text-sm bg-white focus:outline focus:outline-2 focus:outline-[#B85838]" value={queueForm.linkType} onChange={e => setQueueForm({ ...queueForm, linkType: e.target.value, linkId: '' })}>
                    <option value="">— nothing specific —</option>
                    <option value="rental">A property</option>
                    <option value="project">An existing project</option>
                    <option value="entity">An entity (LLC / household)</option>
                  </select>
                </div>
                {queueForm.linkType && (
                  <div>
                    <label htmlFor="aq-linkid" className="text-[9px] uppercase tracking-wider text-[#5A5751] block mb-1">Which one?</label>
                    <select id="aq-linkid" className="w-full p-2 border border-[#E8E4DC] text-sm bg-white focus:outline focus:outline-2 focus:outline-[#B85838]" value={queueForm.linkId} onChange={e => setQueueForm({ ...queueForm, linkId: e.target.value })}>
                      <option value="">— pick one —</option>
                      {queueForm.linkType === 'rental' && rentals.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                      {queueForm.linkType === 'project' && projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                      {queueForm.linkType === 'entity' && entities.map(e => <option key={e.id} value={e.id}>{e.name.split('(')[0].trim()}</option>)}
                    </select>
                  </div>
                )}
                <div>
                  <label htmlFor="aq-due" className="text-[9px] uppercase tracking-wider text-[#5A5751] block mb-1">Due date (auto from urgency, editable)</label>
                  <input id="aq-due" type="date" className="w-full p-2 border border-[#E8E4DC] text-sm bg-white focus:outline focus:outline-2 focus:outline-[#B85838]" value={queueForm.dueDate} onChange={e => setQueueForm({ ...queueForm, dueDate: e.target.value })} />
                </div>
              </div>
              <div>
                <label htmlFor="aq-cost" className="text-[9px] uppercase tracking-wider text-[#5A5751] block mb-1">Estimated cost (optional)</label>
                <input id="aq-cost" type="number" step="0.01" min="0" inputMode="decimal" className="w-full p-2 border border-[#E8E4DC] text-sm bg-white focus:outline focus:outline-2 focus:outline-[#B85838]" value={queueForm.cost} onChange={e => setQueueForm({ ...queueForm, cost: e.target.value })} />
              </div>
              <div className="flex gap-2 flex-wrap pt-1">
                <button type="button" onClick={submitQueueItem} className="bg-[#1A1815] text-white px-4 py-2 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838] min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">Save {URGENCY_INDEX[queueForm.urgency]?.label}</button>
                <button type="button" onClick={() => setShowAddQueue(false)} className="border border-[#1A1815] px-4 py-2 text-xs uppercase tracking-wider hover:bg-white min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">Cancel</button>
              </div>
            </div>
          )}
          <div className="bg-white border border-[#E8E4DC]">
            {queue.length === 0 && (
              <div className="p-6 text-center">
                <div className="text-2xl mb-1" aria-hidden="true">✓</div>
                <div className="text-sm text-[#5A6E3D] font-semibold" style={{ fontFamily: '"Fraunces", serif' }}>Nothing open. Clean queue.</div>
                <p className="text-xs text-[#5A5751] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>Need to log something new? Tap <strong>+ Add item</strong> above.</p>
              </div>
            )}
            {queue.slice(0, 8).map((q, i, arr) => {
              const band = URGENCY_INDEX[q.urgency] || URGENCY_INDEX.incident;
              const age = ageInDays(q.date);
              // Resolve the underlying source record to read its lifecycle log
              // and full description. Incidents live in `incidents[]`; projects
              // live in `projects[]`.
              const sourceItem = q.kind === 'incident'
                ? (incidents.find(it => it.id === q.id) || null)
                : (projects.find(p => p.id === q.id) || null);
              const lifecycleLog = (sourceItem && sourceItem.lifecycle && sourceItem.lifecycle.log) || [];
              const fullDescription = sourceItem ? (sourceItem.description || '') : '';
              const expanded = expandedItemId === q.id;
              // Human-friendly destination tab labels for the "Open in X tab" link.
              const jumpLabelMap = { 'real-estate': 'Real Estate', 'projects': 'Projects', 'practice': 'Practice', 'books': 'Books', 'inbound': 'Inbound', 'capex': 'Projects · Inventory' };
              const jumpLabel = jumpLabelMap[q.jump] || (q.jump ? q.jump.replace(/-/g, ' ') : 'source');
              return (
                <div key={q.id} className={`${i < arr.length - 1 ? 'border-b border-[#E8E4DC]' : ''} ${q.overdue ? 'bg-[#FAF8F4]' : ''}`}>
                  <div className="p-3 flex items-center gap-3 flex-wrap">
                    <span aria-hidden="true" className="inline-block w-6 text-center text-base font-bold" style={{ color: band.accent }} title={band.label}>{band.symbol}</span>
                    {/* The whole left side is one big button — tap anywhere on it
                        to expand the row inline. No navigation, no context loss. */}
                    <button
                      type="button"
                      onClick={() => setExpandedItemId(expanded ? null : q.id)}
                      aria-expanded={expanded}
                      aria-label={expanded ? `Collapse details for ${q.title}` : `Show details and history for ${q.title}`}
                      className="flex-1 min-w-0 text-left hover:bg-[#FAF8F4] -mx-1 px-1 py-0.5 focus:outline focus:outline-2 focus:outline-[#B85838]"
                    >
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: band.accent }}>{band.label}</span>
                        <span style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{q.title}</span>
                        {q.overdue && <span className="text-[10px] uppercase tracking-wider text-[#B85838] font-semibold">⚠ overdue</span>}
                        <span className="text-[10px] text-[#5A5751] ml-auto font-semibold" aria-hidden="true">{expanded ? '▲' : '▼'} details</span>
                      </div>
                      <div className="text-[10px] uppercase tracking-wider text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                        {q.kind} · opened {age}d ago{q.dueDate ? ` · due ${q.dueDate}` : ''}{q.meta ? ` · ${q.meta}` : ''}{lifecycleLog.length > 1 ? ` · 📜 ${lifecycleLog.length} log entries` : ''}
                      </div>
                    </button>
                    {/* Primary action (Resolve for incidents) stays visible on the
                        collapsed row — most-common action, one tap away. */}
                    <div className="flex items-center gap-1 shrink-0">
                      {q.kind === 'incident' && resolveIncident && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); resolveIncident(q.id); }}
                          aria-label={`Mark "${q.title}" resolved`}
                          className="text-xs uppercase tracking-wider px-3 py-1.5 border border-[#5A6E3D] text-[#5A6E3D] hover:bg-[#5A6E3D] hover:text-white min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]"
                        >
                          ✓ Resolve
                        </button>
                      )}
                    </div>
                  </div>
                  {/* Inline expansion — full description + lifecycle log +
                      explicit "Open in <tab>" jump link. The user sees
                      everything in place; they only navigate away if they
                      explicitly choose to. Per CONNECTED-CONTEXT.md + the
                      r17 UX fix: "click Open and I lose what I clicked." */}
                  {expanded && (
                    <div className="px-3 pb-3 pt-2 bg-[#FAF8F4] border-t border-[#E8E4DC] space-y-3">
                      {fullDescription && fullDescription !== q.title && (
                        <p className="text-sm text-[#1A1815] leading-relaxed" style={{ fontFamily: '"Fraunces", serif' }}>{fullDescription}</p>
                      )}
                      {lifecycleLog.length > 0 && (
                        <div>
                          <div className="text-[9px] uppercase tracking-[0.25em] text-[#5A5751] font-semibold mb-2">📜 Lifecycle history · {lifecycleLog.length} {lifecycleLog.length === 1 ? 'entry' : 'entries'}</div>
                          <ol className="space-y-1.5">
                            {lifecycleLog.map((entry, idx) => (
                              <li key={idx} className="text-xs text-[#1A1815] flex flex-wrap items-baseline gap-x-2" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                                <span className="text-[10px] text-[#5A5751]">{(entry.at || '').slice(0, 16).replace('T', ' ')}</span>
                                <span className="text-[10px]">
                                  {entry.fromPhase ? <><span className="text-[#5A5751]">{entry.fromPhase}</span><span className="text-[#5A5751]"> → </span></> : null}
                                  <span className="font-semibold" style={{ color: band.accent }}>{entry.toPhase}</span>
                                </span>
                                <span className="text-[10px] text-[#5A5751]">by {entry.by || 'user'}</span>
                                {entry.note && <span className="text-[11px] text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>— {entry.note}</span>}
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}
                      <div className="flex gap-2 flex-wrap pt-1">
                        <button
                          type="button"
                          onClick={() => setView(q.jump)}
                          className="text-xs uppercase tracking-wider px-3 py-1.5 border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]"
                        >
                          Open in {jumpLabel} tab ↗
                        </button>
                        <button
                          type="button"
                          onClick={() => setExpandedItemId(null)}
                          className="text-xs uppercase tracking-wider px-3 py-1.5 text-[#5A5751] hover:text-[#1A1815] min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]"
                        >
                          Collapse
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {queue.length > 8 && (
              <div className="p-3 text-[10px] uppercase tracking-wider text-[#5A5751] text-center border-t border-[#E8E4DC]" style={{ fontFamily: '"Fraunces", serif' }}>
                + {queue.length - 8} more · open the source tab to see them all
              </div>
            )}
          </div>
        </section>
      )}

      {/* Round 11 — Family capacity meter. At-a-glance "do we have time?"
          Shown only when skill profiles + projects both exist. Color-banded:
          green <80%, amber 80-100%, rust >100% (over-committed). */}
      {capacity.hasProfiles && (capacity.available > 0) && (
        <section aria-labelledby="capacity-h" className="bg-white border border-[#1A1815] p-4 sm:p-5">
          <div className="flex items-baseline justify-between gap-2 flex-wrap mb-2">
            <div>
              <h2 id="capacity-h" className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751] font-semibold">Family Capacity · this week</h2>
              <p className="text-xs text-[#5A5751] mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>
                Sum of all active projects' hrs/wk vs sum of skill-profile hrs/wk. Healthy zone: under 80%. New projects past this line get parked as TBD by default.
              </p>
            </div>
            <div className="text-right">
              <div className={`text-2xl ${capacity.pct >= 100 ? 'text-[#B85838]' : capacity.pct >= 80 ? 'text-[#D97706]' : 'text-[#5A6E3D]'}`} style={{ fontFamily: '"Fraunces", serif', fontWeight: 700 }}>
                {capacity.pct}%
              </div>
              <div className="text-[10px] uppercase tracking-wider text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                {capacity.committed} / {capacity.available} hrs/wk · {capacity.remaining} free
              </div>
            </div>
          </div>
          <div role="progressbar" aria-labelledby="capacity-h" aria-valuenow={capacity.pct} aria-valuemin="0" aria-valuemax="100">
            <div className="w-full bg-[#FAF8F4] h-3 border border-[#E8E4DC]">
              <div
                className="h-full transition-all"
                style={{
                  width: `${Math.min(100, capacity.pct)}%`,
                  backgroundColor: capacity.pct >= 100 ? '#B85838' : capacity.pct >= 80 ? '#D97706' : '#5A6E3D',
                }}
              />
            </div>
            <div className="flex justify-between text-[9px] uppercase tracking-wider text-[#5A5751] mt-1">
              <span>0%</span><span>healthy ≤80%</span><span>tight ≤100%</span><span>over</span>
            </div>
          </div>
          {capacity.pct >= 80 && (
            <p className="text-xs mt-2" style={{ fontFamily: '"Fraunces", serif', color: capacity.pct >= 100 ? '#B85838' : '#D97706' }}>
              <strong>{capacity.pct >= 100 ? 'Over-committed.' : 'Tight.'}</strong> New projects from Dev/Ops &quot;Wrap me&quot; or Tenant-as-Project will prompt before adding. {projects.filter(p => p.status === 'tbd').length > 0 && <> {projects.filter(p => p.status === 'tbd').length} project{projects.filter(p => p.status === 'tbd').length === 1 ? '' : 's'} already parked as TBD.</>}
            </p>
          )}
        </section>
      )}

      {/* HERO ROW — FORCED HORIZONTAL ON MOBILE */}
      <section className="grid grid-cols-3 gap-2 sm:gap-4">
        <CompactHero label="Net cash flow" value={`${totals.netCashFlow >= 0 ? '+' : ''}${fmtCompact(totals.netCashFlow)}`} sub="per mo · all entities" accent={totals.netCashFlow >= 0 ? 'green' : 'rust'} />
        <CompactHero label="Consumer debt free" value={projection.debtFreeDate} sub={`${projection.debtFreeYears.toFixed(1)}yr · pressure ${pressure}`} />
        <CompactHero label="Rentals owned free" value={rentalSnowball.allClearedDate} sub={`${rentalSnowball.allClearedYears.toFixed(1)}yr · snowball`} />
      </section>

      {/* Phase 2B.2 — Bank reconciliation status strip. Surfaces the same
          ingest data that Tx + Accounts show, but as a Big-Picture-level
          "here's what your books look like next to what the banks say."
          Three cells, all clickable. Stays hidden until ingestData arrives
          to avoid layout shift on slow networks. */}
      {ingestData && ingestData.meta && ingestData.meta.loaded && Object.keys(ingestData.bank_balances || {}).length > 0 && (() => {
        const allUserAccounts = entityRollups.flatMap(r => r.accounts || []);
        let linkedCount = 0;
        let bankCash = 0;
        let manualCash = 0;
        for (const a of allUserAccounts) {
          if (!['checking','savings','cash','investment'].includes(a.type) || a.inLegal) continue;
          manualCash += (a.balance || 0);
          const last4 = (a.fragment || '').match(/(\d{4})/)?.[1];
          if (!last4) { bankCash += (a.balance || 0); continue; }
          const balKey = Object.keys(ingestData.bank_balances).find(k => k.includes(last4));
          if (balKey && typeof ingestData.bank_balances[balKey].ledger_balance === 'number') {
            linkedCount += 1;
            bankCash += ingestData.bank_balances[balKey].ledger_balance;
          } else {
            bankCash += (a.balance || 0);
          }
        }
        const sc = (ingestData.counts && ingestData.counts.status_counts) || {};
        const needsAttention = (sc.unexplained || 0) + (sc.unconfirmed || 0);
        const cashDelta = +(bankCash - manualCash).toFixed(2);
        const totalInstitutions = (ingestData.counts && ingestData.counts.institutions || []).length;
        return (
          <section aria-labelledby="bank-recon-h">
            <h2 id="bank-recon-h" className="sr-only">Bank reconciliation status</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-[#E8E4DC] border border-[#E8E4DC]">
              <button type="button" onClick={() => { setView('books'); setBooksView && setBooksView('accounts'); }} className="bg-white p-3 text-left hover:bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838]">
                <div className="text-[9px] uppercase tracking-[0.2em] text-[#5A5751]">Bank cash · linked</div>
                <div className={`text-lg ${bankCash < 0 ? 'text-[#B85838]' : 'text-[#1A1815]'}`} style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{fmtCompact(bankCash)}</div>
                <div className="text-[9px] uppercase tracking-wider text-[#5A5751]">{linkedCount} of {allUserAccounts.filter(a => ['checking','savings','cash','investment'].includes(a.type) && !a.inLegal).length} accounts · {totalInstitutions} feeds</div>
              </button>
              <button type="button" onClick={() => { setView('books'); setBooksView && setBooksView('accounts'); }} className="bg-white p-3 text-left hover:bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838]">
                <div className="text-[9px] uppercase tracking-[0.2em] text-[#5A5751]">Manual vs bank</div>
                <div className={`text-lg ${Math.abs(cashDelta) < 0.5 ? 'text-[#5A6E3D]' : cashDelta < 0 ? 'text-[#B85838]' : 'text-[#D97706]'}`} style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{cashDelta >= 0 ? '+' : ''}{fmtCompact(cashDelta)}</div>
                <div className="text-[9px] uppercase tracking-wider text-[#5A5751]">{Math.abs(cashDelta) < 0.5 ? 'reconciled' : cashDelta < 0 ? 'bank lower than ledger' : 'bank higher than ledger'}</div>
              </button>
              <button type="button" onClick={() => { setView('books'); setBooksView && setBooksView('transactions'); }} className="bg-white p-3 text-left hover:bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838]" title="Books → Tx → tap the 'Needs attention' filter pill">
                <div className="text-[9px] uppercase tracking-[0.2em] text-[#5A5751]">Needs attention</div>
                <div className={`text-lg ${needsAttention > 0 ? 'text-[#B85838]' : 'text-[#5A6E3D]'}`} style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{needsAttention}</div>
                <div className="text-[9px] uppercase tracking-wider text-[#5A5751]">{needsAttention > 0 ? 'ingest rows · review on Tx' : 'fully reconciled'}</div>
              </button>
            </div>
          </section>
        );
      })()}

      {/* v28+ MVP v1.5 — Cross-reference strip.
          Pulls live counts from Real Estate, Markets, and Capex so the
          dashboard reflects edits anywhere in the app without duplicating
          state. Every cell is a button → jumps to the source view.
          FUTURE-MODULE HOOK: New modules can drop a cell into this strip
          by following the same prop pattern (label + value + onClick → view). */}
      {(capexItems.length > 0 || watchlist.length > 0 || equipmentTracked > 0 || roomItemsNeedingWork > 0 || leasesEndingSoon > 0) && (
        <section aria-labelledby="xref-strip-h">
          <h2 id="xref-strip-h" className="sr-only">Cross-reference summary</h2>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-px bg-[#E8E4DC] border border-[#E8E4DC]">
            <button type="button" onClick={() => setView('rentals')} className="bg-white p-3 text-left hover:bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838]">
              <div className="text-[9px] uppercase tracking-[0.2em] text-[#5A5751]">Property work</div>
              <div className="text-lg" style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{roomItemsNeedingWork}</div>
              <div className="text-[9px] uppercase tracking-wider text-[#5A5751]">room items open</div>
            </button>
            <button type="button" onClick={() => setView('rentals')} className="bg-white p-3 text-left hover:bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838]">
              <div className="text-[9px] uppercase tracking-[0.2em] text-[#5A5751]">Equipment</div>
              <div className="text-lg" style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{equipmentTracked}</div>
              <div className="text-[9px] uppercase tracking-wider text-[#5A5751]">tracked items</div>
            </button>
            <button type="button" onClick={() => setView('rentals')} className={`bg-white p-3 text-left hover:bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838] ${leasesEndingSoon > 0 ? 'bg-[#FAF8F4]' : ''}`}>
              <div className="text-[9px] uppercase tracking-[0.2em] text-[#5A5751]">Leases</div>
              <div className={`text-lg ${leasesEndingSoon > 0 ? 'text-[#B85838]' : ''}`} style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{leasesEndingSoon}</div>
              <div className="text-[9px] uppercase tracking-wider text-[#5A5751]">ending in 60d</div>
            </button>
            <button type="button" onClick={() => setView('about')} className="bg-white p-3 text-left hover:bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838]">
              <div className="text-[9px] uppercase tracking-[0.2em] text-[#5A5751]">Capex open</div>
              <div className="text-lg" style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{fmtCompact(capexOpenSpend)}</div>
              <div className="text-[9px] uppercase tracking-wider text-[#5A5751]">{capexP1Count} P1 · {capexItems.length} total</div>
            </button>
            <button type="button" onClick={() => setView('markets')} className="bg-white p-3 text-left hover:bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838]">
              <div className="text-[9px] uppercase tracking-[0.2em] text-[#5A5751]">Watchlist</div>
              <div className="text-lg" style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{watchlistCount}</div>
              <div className="text-[9px] uppercase tracking-wider text-[#5A5751]">{watchlistCount === 1 ? 'ticker' : 'tickers'}</div>
            </button>
          </div>
        </section>
      )}

      {/* v28+ MVP v1.5 round 3 — Buffer Fund relocated to Books → Accounts
          (lives next to All Accounts Total where its meaning is clearest). */}

      {/* ENTITY STRIP — horizontal on all screens */}
      <section>
        <div className="text-[9px] uppercase tracking-[0.25em] text-[#5A5751] mb-1.5">Entities</div>
        <div className="grid grid-cols-4 gap-px bg-[#E8E4DC] border border-[#E8E4DC]">
          {entityRollups.map((r) => (
            <div key={r.entity.id} className="bg-[#FAF8F4] p-2 sm:p-3">
              <div className="text-[9px] uppercase tracking-[0.15em] text-[#5A5751]">{r.entity.type}</div>
              <div className="text-xs sm:text-sm leading-tight mt-0.5" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{r.entity.name.split('(')[0].split('LLC')[0].trim()}</div>
              <div className="text-[9px] uppercase tracking-wider text-[#5A5751] mt-1.5">Inflow</div>
              <div className="text-xs sm:text-sm" style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{fmtCompact(r.inflow)}</div>
              {r.debtBalance > 0 && (<><div className="text-[9px] uppercase tracking-wider text-[#5A5751] mt-1">Debt</div><div className="text-xs sm:text-sm text-[#B85838]" style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{fmtCompact(r.debtBalance)}</div></>)}
            </div>
          ))}
        </div>
      </section>

      {/* PRESSURE + WHAT CHANGES side-by-side on tablet+, stacked on mobile */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-white border border-[#1A1815] p-4 sm:p-5">
          <div className="flex items-baseline justify-between mb-2">
            <div className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751]">Pressure</div>
            <div className="text-xl" style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{pressure}/10</div>
          </div>
          <input type="range" min="1" max="10" step="1" value={pressure} onChange={(e) => setPressure(parseInt(e.target.value))} className="w-full accent-[#B85838] mb-2" />
          <div className="flex justify-between text-[9px] uppercase tracking-wider text-[#5A5751] mb-3">
            <span>Loose</span><span>Moderate</span><span>Sprint</span>
          </div>
          <p className="text-xs sm:text-sm italic" style={{ fontFamily: '"Fraunces", serif' }}>{pressureCalc.stress} pressure — {pressureCalc.desc}.</p>
        </div>

        <div className="bg-white border border-[#1A1815] p-4 sm:p-5">
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751] mb-2">What changes at this setting</div>
          <div className="grid grid-cols-2 gap-px bg-[#E8E4DC] border border-[#E8E4DC]">
            <MetricCell label="Debt free in" value={`${projection.debtFreeYears.toFixed(1)} yr`} small />
            <MetricCell label="Interest" value={fmtCompact(projection.totalInterestPaid)} small />
            <MetricCell label="To debt/mo" value={fmt(pressureCalc.extraAvailable)} small />
            <MetricCell label="Reserves" value={fmt(pressureCalc.reservesDeducted)} small accent="rust" />
          </div>
        </div>
      </section>

      {/* Money Date + Upcoming Events */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-white border border-[#1A1815] p-4 sm:p-5">
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] mb-2 font-medium">Money Date Packet</div>
          <div className="space-y-2.5">
            {flaggedRentals.length > 0 && (
              <div className="border-l-2 border-[#B85838] pl-3">
                <div className="text-[10px] uppercase tracking-wider text-[#5A5751] mb-0.5">Needs attention</div>
                {flaggedRentals.map((r) => (
                  <div key={r.id} className="text-xs sm:text-sm">
                    <span style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{r.name}</span>
                    <span className="text-[#5A5751]"> — {fmt(r.rent - r.actual)} short</span>
                  </div>
                ))}
              </div>
            )}
            <div className="border-l-2 border-[#5A6E3D] pl-3">
              <div className="text-[10px] uppercase tracking-wider text-[#5A5751] mb-0.5">On track</div>
              <div className="text-xs sm:text-sm">
                <span style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{totals.collectionRate.toFixed(1)}%</span> rent collection
              </div>
            </div>
            {flaggedOpportunities.length > 0 && (
              <div className="border-l-2 border-[#1A1815] pl-3">
                <div className="text-[10px] uppercase tracking-wider text-[#5A5751] mb-0.5">Priority opportunities</div>
                {flaggedOpportunities.slice(0,2).map((o) => (
                  <div key={o.id} className="text-xs sm:text-sm">
                    <span style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{o.what}</span>
                    <span className="text-[#5A5751]"> — {fmt(o.monthly)}/mo</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white border border-[#1A1815] p-4 sm:p-5">
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751] mb-2">Upcoming Events</div>
          {upcomingEvents.length === 0 ? (
            <p className="text-xs text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>No events scheduled. Add one in Books → Calendar.</p>
          ) : (
            <div className="space-y-2">
              {upcomingEvents.slice(0, 4).map(e => (
                <div key={e.id} className="border-l-2 border-[#B85838] pl-3">
                  <div className="text-xs sm:text-sm flex justify-between gap-2">
                    <span style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{e.title}</span>
                    <span className="text-[#5A5751] shrink-0 text-[10px] uppercase tracking-wider">{relativeWhen(e.dateTime)}</span>
                  </div>
                  <div className="text-[10px] text-[#5A5751] uppercase tracking-wider">{e.date}{e.time ? ` · ${e.time}` : ''} · {e.category}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function CompactHero({ label, value, sub, accent }) {
  const colorClass = accent === 'green' ? 'text-[#5A6E3D]' : accent === 'rust' ? 'text-[#B85838]' : 'text-[#1A1815]';
  return (
    <div className="bg-white border border-[#1A1815] p-2.5 sm:p-4 min-w-0">
      <div className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-[#5A5751] mb-1 leading-tight">{label}</div>
      <div className={`text-base sm:text-2xl leading-tight truncate ${colorClass}`} style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{value}</div>
      {sub && <div className="text-[9px] sm:text-xs text-[#5A5751] mt-1 leading-tight">{sub}</div>}
    </div>
  );
}

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
// v28+ MVP v1.5 round 10 — ITSM-style urgency taxonomy
// Change   = broken NOW, must be acted on today (same-day due)
// Incident = needs resolution within ~3 days
// Project  = takes longer than 3 days, treated as planned work
// Same shape across rentals, maintenance, finance, ministry — one mental model
// the whole family operates from. Linked items can point back to the source
// (property, project, account) so the Action Queue can deep-link.
// =============================================================================
const URGENCY_BANDS = [
  { key: 'change',   label: 'Change',   tagline: 'Broken now · same-day',  dueDays: 0, accent: '#B85838', symbol: '⚡', order: 1 },
  { key: 'incident', label: 'Incident', tagline: 'Resolve within 3 days',  dueDays: 3, accent: '#D97706', symbol: '!',  order: 2 },
  { key: 'project',  label: 'Project',  tagline: 'Multi-day planned work', dueDays: 14,accent: '#5A6E3D', symbol: '◆',  order: 3 },
];
// Derived helper kept available for form validation / filter UIs. Exported
// so future consumers can import rather than recompute.
export const URGENCY_KEYS = URGENCY_BANDS.map(u => u.key);
const URGENCY_INDEX = Object.fromEntries(URGENCY_BANDS.map(u => [u.key, u]));
// Compute a default due date based on urgency: today + N days.
const dueDateFor = (urgencyKey, fromDate = new Date()) => {
  const days = URGENCY_INDEX[urgencyKey]?.dueDays ?? 3;
  const d = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate() + days);
  return d.toISOString().slice(0, 10);
};

// =============================================================================
// Round 11 — CAPACITY GUARD
// Returns family-wide hrs/wk math: committed from active projects vs available
// from skillProfiles. Used to prevent the system from spamming new projects
// the family can't actually staff. Threshold: 80% = warn, 100% = block (must
// pick "Add as TBD" / "Add anyway / override" / "Cancel").
// =============================================================================
function capacitySnapshot(projects = [], skillProfiles = []) {
  const committed = projects
    .filter(p => PROJECT_STATUSES_ACTIVE.includes(p.status))
    .reduce((s, p) => s + (parseFloat(p.hoursPerWeek) || 0), 0);
  const available = skillProfiles.reduce((s, p) => s + (parseFloat(p.hoursPerWeek) || 0), 0);
  const remaining = Math.max(0, available - committed);
  const pct = available > 0 ? Math.round((committed / available) * 100) : 0;
  return { committed, available, remaining, pct, hasProfiles: skillProfiles.length > 0 };
}
// Capacity-aware project creation. Returns one of:
//   { decision: 'add-active' }     — fits, proceed
//   { decision: 'add-tbd' }        — user chose TBD
//   { decision: 'cancel' }         — user backed out
// Uses confirm() prompts so it works without a custom modal system.
function capacityDecisionForNewProject(projects, skillProfiles, newProjectHpw, opts = {}) {
  const cap = capacitySnapshot(projects, skillProfiles);
  const proposed = cap.committed + (parseFloat(newProjectHpw) || 0);
  const proposedPct = cap.available > 0 ? (proposed / cap.available) * 100 : 0;
  if (!cap.hasProfiles) {
    // No skill profiles yet — can't enforce, just proceed but warn once.
    return { decision: 'add-active', note: 'No skill profiles set yet; capacity not enforced.' };
  }
  if (proposedPct <= 80) return { decision: 'add-active' };
  const label = opts.label || 'this project';
  const msg = proposedPct > 100
    ? `Heads up — adding ${label} would put the family at ${Math.round(proposedPct)}% of available hours/week (${proposed} hrs needed vs ${cap.available} hrs available).\n\nClick OK to add as TBD (parked until capacity opens up). Click Cancel to keep it out entirely.\n\nIf you really want to add it active anyway, you can promote it later from Projects > Inventory.`
    : `Tight fit — adding ${label} would push the family to ${Math.round(proposedPct)}% of available hours/week (${proposed} hrs needed vs ${cap.available} hrs available). The healthy zone is under 80%.\n\nClick OK to add as TBD (parked, doesn't count against workload). Click Cancel to add active anyway and accept the squeeze.`;
  const useTbd = window.confirm(msg);
  return useTbd ? { decision: 'add-tbd' } : { decision: 'add-active' };
}

// =============================================================================
// v28+ MVP v1.5 round 6 — DEV/OPS · Skill → Opportunity matcher
// Curated library of entrepreneurial paths. Each entry tags the skills it
// needs, the realistic earnings + time profile, an anonymized COMPOSITE
// example (drawn from public reporting / industry surveys, not specific
// individuals), and the tech stack PoeTech would build to wrap the user.
// FUTURE-MODULE HOOK: `region` and `verified-by` fields are intentionally
// absent so community partners can extend later without breaking shape.
// =============================================================================
// Preparatory scaffolding for the Dev/Ops skill-profile editor categorization
// (pending). Exported so the future profile-form component can import.
export const SKILL_CATEGORIES = [
  'Trades','Caregiving','Teaching','Real Estate','Creative',
  'Tech','Health & Wellness','Faith / Ministry','Driving / Delivery',
  'Cooking / Food','Sales / Marketing','Operations / Admin','Translation / Multilingual',
];

// Tier visibility: 'foundation' = always visible (sampler). 'poetech-plus' and
// above pull more breadth. The Foundation tier sees the first opportunity per
// profile only — the tease — and counts unlock per tier.
const OPPORTUNITY_LIBRARY = [
  // --- TECH / NETWORKING (Darrell-aligned) ---
  { id: 'op-net-1', title: 'Small-business network architect (1099)', category: 'Tech', skillTags: ['network architecture','OT-IT','BAS','Siemens','networking'], earningsLow: 4000, earningsHigh: 18000, hoursPerWeek: 10, startupCost: 0, timeToFirstDollar: '2–6 weeks', example: 'A former school-district facilities lead in the Midwest now bills $8K/mo redesigning VLANs and adding UniFi gateways for 3–4 local businesses per year.', techStack: 'PoeTech wraps you with: scope-of-work templates, 1099 tracking, recurring-engagement calendar, capex inventory for site visits.' },
  { id: 'op-net-2', title: 'AV streaming consultant for churches', category: 'Tech', skillTags: ['church AV','streaming','OBS','live sound','networking'], earningsLow: 800, earningsHigh: 6000, hoursPerWeek: 6, startupCost: 500, timeToFirstDollar: '1–2 weeks', example: 'A worship tech director in Atlanta serves 6 small churches on a $400/mo flat retainer each, plus install fees, totaling ~$3.5K/mo.', techStack: 'PoeTech wraps you with: per-church scope, equipment inventory by site, recurring billing reminder, conversation log per pastor.' },
  { id: 'op-code-1', title: 'PWA / React build contracts', category: 'Tech', skillTags: ['react','PWA','frontend','javascript','coding'], earningsLow: 3000, earningsHigh: 25000, hoursPerWeek: 12, startupCost: 0, timeToFirstDollar: '3–8 weeks', example: 'A self-taught developer in rural Texas runs a 2-person shop building React apps for small clinics; ~$15K/project, 4–6 projects/yr.', techStack: 'PoeTech wraps you with: scope tool, project timeline, inventory forecast, client conversation log.' },
  { id: 'op-it-1', title: 'Local IT support / managed services', category: 'Tech', skillTags: ['it support','tech support','networking','windows','mac'], earningsLow: 2500, earningsHigh: 12000, hoursPerWeek: 15, startupCost: 300, timeToFirstDollar: '1–3 weeks', example: 'A 50-something with 20 yrs corporate IT in Phoenix runs a 12-account managed-services book, averaging $5.8K/mo recurring.', techStack: 'PoeTech wraps you with: per-account scope, ticket conversation log, recurring billing, equipment inventory.' },
  { id: 'op-ai-1', title: 'AI prompt + automation consultant for SMBs', category: 'Tech', skillTags: ['ai','prompt engineering','automation','no-code','python'], earningsLow: 2000, earningsHigh: 15000, hoursPerWeek: 8, startupCost: 100, timeToFirstDollar: '2–4 weeks', example: 'A bookkeeper-turned-AI-consultant in Ohio sells $2K AI-workflow audits to local businesses; ~3/mo = $6K.', techStack: 'PoeTech wraps you with: scope tool, project timeline, deliverables tracker.' },

  // --- HEALTH & WELLNESS / THERAPY (Christina-aligned) ---
  { id: 'op-th-1', title: 'Group practice with 1099 contractors', category: 'Health & Wellness', skillTags: ['therapy','clinical','LCSW','MSW','psychology'], earningsLow: 5000, earningsHigh: 35000, hoursPerWeek: 20, startupCost: 1500, timeToFirstDollar: '6–12 weeks', example: 'A licensed therapist in Illinois runs a 7-clinician group practice; owner take-home ~$22K/mo after paying contractors and overhead.', techStack: 'PoeTech wraps you with: pre-intake inquiry capture, conversion tracking, multi-clinician scope, payroll-adjacent 1099 reporting.' },
  { id: 'op-th-2', title: 'Faith-integrated counseling specialty', category: 'Health & Wellness', skillTags: ['therapy','clinical','faith','ministry','christian counseling'], earningsLow: 3000, earningsHigh: 14000, hoursPerWeek: 18, startupCost: 800, timeToFirstDollar: '4–8 weeks', example: 'A licensed counselor in Tennessee built a $9K/mo private practice serving pastors + missionaries returning from the field.', techStack: 'PoeTech wraps you with: inquiry tracking, source attribution (church referrals), scope for sliding-scale clients.' },
  { id: 'op-coach-1', title: 'Health & wellness coaching (non-clinical)', category: 'Health & Wellness', skillTags: ['coaching','wellness','nutrition','fitness'], earningsLow: 1200, earningsHigh: 8000, hoursPerWeek: 10, startupCost: 200, timeToFirstDollar: '2–6 weeks', example: 'A nurse on the side coaches busy moms via Zoom; 14 clients × $250/mo = $3.5K/mo recurring.', techStack: 'PoeTech wraps you with: client scope, scheduling calendar, recurring billing, conversation log.' },
  { id: 'op-msw-1', title: 'Independent MSW under another therapist\'s license', category: 'Health & Wellness', skillTags: ['MSW','social work','clinical contractor'], earningsLow: 2000, earningsHigh: 9000, hoursPerWeek: 20, startupCost: 0, timeToFirstDollar: '2–4 weeks', example: 'An MSW in Chicago contracts under 2 group practices; ~24 sessions/wk × $80 take-home = $7.6K/mo.', techStack: 'PoeTech wraps you with: caseload tracker, multi-practice 1099 reporting, supervision hours log.' },

  // --- MUSIC / CREATIVE (Christina-aligned, kids too) ---
  { id: 'op-music-1', title: 'Choir / vocal coach for individuals', category: 'Creative', skillTags: ['music','choir','vocal','teaching','piano'], earningsLow: 600, earningsHigh: 4000, hoursPerWeek: 8, startupCost: 100, timeToFirstDollar: '1–2 weeks', example: 'A church music director in the Carolinas keeps 12 weekly private students at $60/hr = $2.9K/mo on the side.', techStack: 'PoeTech wraps you with: scheduling calendar, recurring billing, per-student notes/conversation log.' },
  { id: 'op-music-2', title: 'Wedding / event music director', category: 'Creative', skillTags: ['music','choir','wedding','event','vocal'], earningsLow: 1000, earningsHigh: 7000, hoursPerWeek: 6, startupCost: 200, timeToFirstDollar: '2–4 weeks', example: 'A worship-trained vocalist in Charlotte averages 2 weddings/mo at $1,800 each = $3.6K/mo.', techStack: 'PoeTech wraps you with: event calendar, per-event scope (set list + tech rider), deposit/balance tracking.' },
  { id: 'op-write-1', title: 'Substack / newsletter author (subscription)', category: 'Creative', skillTags: ['writing','content','newsletter','journalism'], earningsLow: 0, earningsHigh: 20000, hoursPerWeek: 10, startupCost: 0, timeToFirstDollar: '3–9 months', example: 'A former nonprofit comms director writes a weekly newsletter about kinship caregiving; ~800 paid subscribers × $7 = $5.6K/mo after 18 months.', techStack: 'PoeTech wraps you with: subscriber pipeline (inquiry tool), recurring revenue tracker, content calendar.' },
  { id: 'op-design-1', title: 'Brand & website design for small ministries', category: 'Creative', skillTags: ['design','branding','web design','figma'], earningsLow: 1500, earningsHigh: 10000, hoursPerWeek: 10, startupCost: 50, timeToFirstDollar: '2–6 weeks', example: 'A freelance designer in Memphis specializes in small Black churches; $2K/site × 3–5/mo = $6–10K/mo.', techStack: 'PoeTech wraps you with: scope templates per package, project timeline, asset/handoff log.' },
  { id: 'op-photo-1', title: 'Real-estate listing photography', category: 'Creative', skillTags: ['photography','real estate','editing'], earningsLow: 1500, earningsHigh: 9000, hoursPerWeek: 12, startupCost: 1500, timeToFirstDollar: '1–3 weeks', example: 'A part-time photographer in the Atlanta metro shoots ~6 listings/week at $250 each = $6K/mo for 3 partner agents.', techStack: 'PoeTech wraps you with: per-listing scope, equipment inventory, recurring billing, shot-list checklist.' },
  { id: 'op-video-1', title: 'Short-form video editor for creators', category: 'Creative', skillTags: ['video','editing','social media','content'], earningsLow: 1000, earningsHigh: 12000, hoursPerWeek: 15, startupCost: 500, timeToFirstDollar: '1–4 weeks', example: 'A stay-at-home parent in Idaho edits TikTok/Reels for 5 creators on retainer; ~$1.4K each = $7K/mo.', techStack: 'PoeTech wraps you with: per-client scope, deliverable tracker, recurring monthly invoices.' },

  // --- TEACHING / EDUCATION ---
  { id: 'op-tutor-1', title: 'Online K-12 tutoring for homeschool families', category: 'Teaching', skillTags: ['teaching','tutoring','K-12','education','homeschool'], earningsLow: 1200, earningsHigh: 10000, hoursPerWeek: 12, startupCost: 100, timeToFirstDollar: '2–4 weeks', example: 'A retired teacher in Ohio runs a 3-day/week tutoring co-op for 8 homeschool families; ~$3.5K/mo at $300/student/mo.', techStack: 'PoeTech wraps you with: per-student inquiry, scheduling, recurring billing, parent conversation log.' },
  { id: 'op-tutor-2', title: 'IEP / special-needs learning support', category: 'Teaching', skillTags: ['teaching','IEP','special needs','dyslexia','tutoring'], earningsLow: 1500, earningsHigh: 9000, hoursPerWeek: 12, startupCost: 200, timeToFirstDollar: '2–6 weeks', example: 'A reading specialist in Maryland coaches 10 children with dyslexia at $90/hr × ~6 hr/wk = ~$3.9K/mo.', techStack: 'PoeTech wraps you with: per-child progress notes, IEP document store, parent updates, scheduling.' },
  { id: 'op-course-1', title: 'Niche online course (one-time + drip)', category: 'Teaching', skillTags: ['teaching','course','online','curriculum','content'], earningsLow: 0, earningsHigh: 30000, hoursPerWeek: 10, startupCost: 500, timeToFirstDollar: '3–6 months', example: 'A network engineer sells a $497 OT-IT crash course; ~25 sales/mo after launch = $12.4K/mo recurring.', techStack: 'PoeTech wraps you with: customer pipeline, refund tracker, recurring drip schedule, conversation log.' },
  { id: 'op-tutor-3', title: 'Test prep for first-gen college students', category: 'Teaching', skillTags: ['teaching','test prep','SAT','ACT','college'], earningsLow: 800, earningsHigh: 6000, hoursPerWeek: 8, startupCost: 100, timeToFirstDollar: '2–4 weeks', example: 'A former school counselor in Detroit coaches 6 students per cycle at $1,200 flat = $7.2K per 3-mo cycle.', techStack: 'PoeTech wraps you with: per-student scope (target score, sessions left), parent comms, scheduling.' },
  { id: 'op-music-3', title: 'Private music lessons (instrument or voice)', category: 'Teaching', skillTags: ['music','teaching','piano','guitar','voice','instrument'], earningsLow: 500, earningsHigh: 5000, hoursPerWeek: 10, startupCost: 200, timeToFirstDollar: '1–3 weeks', example: 'A guitar teacher in Nashville keeps 18 weekly students at $45/lesson = $3.2K/mo.', techStack: 'PoeTech wraps you with: scheduling, recurring billing, per-student notes.' },

  // --- TRADES ---
  { id: 'op-trade-1', title: 'Specialty handyman (kitchens, bathrooms, decks)', category: 'Trades', skillTags: ['carpentry','remodel','handyman','construction','trades'], earningsLow: 3000, earningsHigh: 15000, hoursPerWeek: 30, startupCost: 5000, timeToFirstDollar: '1–4 weeks', example: 'A 2nd-generation tradesman in NC averages $9K/mo on smaller remodels under $15K, no employees.', techStack: 'PoeTech wraps you with: per-job scope (acceptance criteria), inventory of repeat-buy materials, payment milestones.' },
  { id: 'op-trade-2', title: 'HVAC service + light commercial install', category: 'Trades', skillTags: ['HVAC','trades','install','service'], earningsLow: 5000, earningsHigh: 22000, hoursPerWeek: 35, startupCost: 8000, timeToFirstDollar: '2–8 weeks', example: 'An HVAC tech in Texas left a national chain to solo, runs $14K/mo on residential service contracts.', techStack: 'PoeTech wraps you with: service-call scope, equipment inventory by customer site, recurring maintenance reminders.' },
  { id: 'op-trade-3', title: 'Landscaping + small lawn-care route', category: 'Trades', skillTags: ['landscaping','lawn care','trades','outdoor'], earningsLow: 2000, earningsHigh: 11000, hoursPerWeek: 30, startupCost: 4000, timeToFirstDollar: '1–3 weeks', example: 'A teacher-turned-landscaper in NC keeps 25 weekly accounts at $50–80 each = ~$6.5K/mo seasonal.', techStack: 'PoeTech wraps you with: route schedule, per-property scope, equipment inventory.' },
  { id: 'op-trade-4', title: 'Cleaning service (residential or commercial)', category: 'Trades', skillTags: ['cleaning','trades','janitorial'], earningsLow: 1500, earningsHigh: 14000, hoursPerWeek: 25, startupCost: 800, timeToFirstDollar: '1–2 weeks', example: 'A single mom in Charlotte built a 6-staff commercial cleaning route; ~$8K/mo take-home after wages.', techStack: 'PoeTech wraps you with: per-account scope, recurring schedule, staff hours, 1099 / W-2 split tracking.' },

  // --- CAREGIVING ---
  { id: 'op-care-1', title: 'Private-pay elder companion / aide', category: 'Caregiving', skillTags: ['elder care','caregiving','CNA','companion'], earningsLow: 1200, earningsHigh: 6000, hoursPerWeek: 20, startupCost: 100, timeToFirstDollar: '1–3 weeks', example: 'A retired RN in Florida cares for 2 elderly clients privately at $28/hr × 16 hr/wk each = $3.6K/mo.', techStack: 'PoeTech wraps you with: per-client scope (meds, routines), shared-with-family notes, schedule, payroll tracking.' },
  { id: 'op-care-2', title: 'Specialized care coordinator for adult children', category: 'Caregiving', skillTags: ['elder care','care coordination','case management','social work'], earningsLow: 2500, earningsHigh: 10000, hoursPerWeek: 15, startupCost: 200, timeToFirstDollar: '4–8 weeks', example: 'A former hospital case manager in Atlanta serves 8 family-paying clients at $400/mo retainer = $3.2K/mo.', techStack: 'PoeTech wraps you with: case load, sibling-shared notes, doctor appointment calendar, document store.' },
  { id: 'op-care-3', title: 'Special-needs respite care', category: 'Caregiving', skillTags: ['caregiving','special needs','respite','autism'], earningsLow: 1000, earningsHigh: 5000, hoursPerWeek: 18, startupCost: 100, timeToFirstDollar: '2–4 weeks', example: 'A para-educator in Phoenix moonlights as respite for 4 families on weekends; $25/hr × 24 hr/wk = $2.4K/mo.', techStack: 'PoeTech wraps you with: per-family scope (routine, sensory triggers), schedule, parent comms log.' },
  { id: 'op-care-4', title: 'Pet sitting / dog walking (route)', category: 'Caregiving', skillTags: ['pet sitting','dog walking','animals'], earningsLow: 400, earningsHigh: 4000, hoursPerWeek: 12, startupCost: 50, timeToFirstDollar: '1–2 weeks', example: 'A high-schooler in Denver runs a 9-dog walking route plus weekend boarding; ~$1.2K/mo summers.', techStack: 'PoeTech wraps you with: per-client scope (feeding, meds), schedule, conversation log, key/location notes.' },

  // --- REAL ESTATE (Darrell-aligned) ---
  { id: 'op-re-1', title: 'Self-manage your own rental portfolio', category: 'Real Estate', skillTags: ['real estate','property management','rentals','landlord'], earningsLow: 0, earningsHigh: 8000, hoursPerWeek: 6, startupCost: 0, timeToFirstDollar: 'immediate', example: 'A small landlord with 8 doors in IL saved ~$1,100/mo by self-managing vs paying 10% to a PM company.', techStack: 'PoeTech wraps you with: full Real Estate module — per-property lease, tenant, equipment, rooms, maintenance log, snowball math.' },
  { id: 'op-re-2', title: 'Section 8 / housing-voucher rental specialist', category: 'Real Estate', skillTags: ['real estate','section 8','housing','rentals'], earningsLow: 1000, earningsHigh: 15000, hoursPerWeek: 8, startupCost: 0, timeToFirstDollar: '2–8 weeks', example: 'A landlord in Memphis specializes in Section 8 properties, 6 doors at ~$1,400 average rent; nets ~$5K/mo after expenses.', techStack: 'PoeTech wraps you with: per-property compliance docs, inspection calendar, voucher-amount tracking.' },
  { id: 'op-re-3', title: 'Short-term-rental property manager', category: 'Real Estate', skillTags: ['real estate','short term rental','airbnb','property management'], earningsLow: 1500, earningsHigh: 12000, hoursPerWeek: 15, startupCost: 500, timeToFirstDollar: '3–6 weeks', example: 'A property manager in TN manages 7 STR units at 20% of revenue; ~$8K/mo recurring.', techStack: 'PoeTech wraps you with: per-property scope, cleaning crew schedule, booking calendar, equipment inventory.' },
  { id: 'op-re-4', title: 'Wholesale + flip with attorney + integrity', category: 'Real Estate', skillTags: ['real estate','flipping','wholesale','investing'], earningsLow: 0, earningsHigh: 30000, hoursPerWeek: 20, startupCost: 2000, timeToFirstDollar: '1–4 months', example: 'A part-time investor in NC flips 2–3 houses/yr averaging $18K net per deal; conservative 1 deal/quarter = ~$6K/mo blended.', techStack: 'PoeTech wraps you with: per-deal scope, capex inventory + forecast, contractor 1099, conversation log per lead.' },

  // --- FAITH / MINISTRY ---
  { id: 'op-min-1', title: 'Worship leader on retainer for multi-site church', category: 'Faith / Ministry', skillTags: ['worship','music','ministry','church'], earningsLow: 800, earningsHigh: 5000, hoursPerWeek: 12, startupCost: 0, timeToFirstDollar: '2–8 weeks', example: 'A worship leader in GA serves 3 small churches at $1,200/mo each = $3.6K/mo.', techStack: 'PoeTech wraps you with: per-church scope, set-list calendar, recurring billing.' },
  { id: 'op-min-2', title: 'Bivocational church admin / bookkeeper', category: 'Faith / Ministry', skillTags: ['admin','bookkeeping','ministry','church'], earningsLow: 1500, earningsHigh: 6000, hoursPerWeek: 15, startupCost: 100, timeToFirstDollar: '2–6 weeks', example: 'An accountant in Alabama keeps books for 4 small congregations at $700/mo each = $2.8K/mo.', techStack: 'PoeTech wraps you with: per-church entity (multi-entity Books), tithe categorization, 1099 reporting.' },

  // --- COOKING / FOOD ---
  { id: 'op-food-1', title: 'Weekly meal-prep delivery (route of 12–20)', category: 'Cooking / Food', skillTags: ['cooking','meal prep','food','catering'], earningsLow: 2000, earningsHigh: 9000, hoursPerWeek: 25, startupCost: 1500, timeToFirstDollar: '2–4 weeks', example: 'A home cook in TX delivers 18 weekly meal plans at $180 each = $3.2K/mo.', techStack: 'PoeTech wraps you with: customer route, weekly menu/scope, recurring billing.' },
  { id: 'op-food-2', title: 'Specialty baking (cakes, breads) by order', category: 'Cooking / Food', skillTags: ['baking','cooking','food','custom orders'], earningsLow: 500, earningsHigh: 6000, hoursPerWeek: 15, startupCost: 500, timeToFirstDollar: '2–4 weeks', example: 'A custom cake baker in NC books 6–10 cakes/mo at $200 average = $1.5–2K/mo.', techStack: 'PoeTech wraps you with: per-order scope (flavor, design, allergies), calendar, deposit/balance tracking.' },

  // --- DRIVING / DELIVERY / GIG ---
  { id: 'op-drive-1', title: 'Local courier route (regular B2B)', category: 'Driving / Delivery', skillTags: ['driving','delivery','courier','logistics'], earningsLow: 1500, earningsHigh: 7000, hoursPerWeek: 30, startupCost: 200, timeToFirstDollar: '1–3 weeks', example: 'A retiree in OH runs a daily route for 4 medical-supply businesses; ~$4.2K/mo net.', techStack: 'PoeTech wraps you with: per-customer scope, route schedule, mileage tracker, recurring billing.' },
  { id: 'op-drive-2', title: 'Non-medical transport for elderly (NEMT-adjacent)', category: 'Driving / Delivery', skillTags: ['driving','elder care','transport','caregiving'], earningsLow: 1500, earningsHigh: 8000, hoursPerWeek: 20, startupCost: 300, timeToFirstDollar: '2–4 weeks', example: 'A retired bus driver in FL drives 8 elderly clients to appointments at $35/trip; ~$3K/mo.', techStack: 'PoeTech wraps you with: per-client scope (mobility, meds), schedule, family-shared updates.' },

  // --- SALES / MARKETING ---
  { id: 'op-sales-1', title: 'Affiliate marketing in a tight niche', category: 'Sales / Marketing', skillTags: ['marketing','affiliate','content','SEO','niche'], earningsLow: 0, earningsHigh: 15000, hoursPerWeek: 12, startupCost: 200, timeToFirstDollar: '4–12 months', example: 'A homeschool mom in TX runs a curriculum-review site; ~$5K/mo affiliate revenue after 2 yrs.', techStack: 'PoeTech wraps you with: content calendar, revenue tracker, partner conversation log.' },
  { id: 'op-sales-2', title: 'B2B sales rep (commission-only) for SMB tools', category: 'Sales / Marketing', skillTags: ['sales','B2B','relationship','networking'], earningsLow: 2000, earningsHigh: 20000, hoursPerWeek: 25, startupCost: 0, timeToFirstDollar: '2–8 weeks', example: 'A former insurance sales rep represents a regional payroll company on 12% commission; ~$8K/mo book.', techStack: 'PoeTech wraps you with: pipeline (inquiry), commission tracker, recurring deal calendar.' },

  // --- OPERATIONS / ADMIN ---
  { id: 'op-ops-1', title: 'Virtual assistant for solo professionals', category: 'Operations / Admin', skillTags: ['admin','VA','virtual assistant','operations','calendar'], earningsLow: 1200, earningsHigh: 7000, hoursPerWeek: 20, startupCost: 50, timeToFirstDollar: '1–3 weeks', example: 'A VA in WI serves 5 financial advisors at $700/mo each = $3.5K/mo.', techStack: 'PoeTech wraps you with: per-client scope, recurring billing, conversation log.' },
  { id: 'op-ops-2', title: 'Bookkeeping for small businesses', category: 'Operations / Admin', skillTags: ['bookkeeping','accounting','admin','QuickBooks'], earningsLow: 1500, earningsHigh: 10000, hoursPerWeek: 18, startupCost: 200, timeToFirstDollar: '2–6 weeks', example: 'A bookkeeper in OR keeps 9 SMB clients at $450/mo each = $4K/mo recurring.', techStack: 'PoeTech wraps you with: multi-entity Books (one per client), recurring monthly close, 1099 reporting.' },

  // --- TRANSLATION / MULTILINGUAL ---
  { id: 'op-lang-1', title: 'Medical/legal interpretation (phone or in-person)', category: 'Translation / Multilingual', skillTags: ['translation','interpretation','bilingual','spanish','medical'], earningsLow: 1500, earningsHigh: 8000, hoursPerWeek: 25, startupCost: 300, timeToFirstDollar: '2–6 weeks', example: 'A bilingual nurse in CA interprets for 3 clinics; ~$5.5K/mo at $35/hr.', techStack: 'PoeTech wraps you with: per-clinic scope, hours tracker, recurring invoicing.' },
  { id: 'op-lang-2', title: 'ESL tutoring (online, evening hours)', category: 'Translation / Multilingual', skillTags: ['teaching','ESL','language','tutoring'], earningsLow: 600, earningsHigh: 4500, hoursPerWeek: 15, startupCost: 100, timeToFirstDollar: '1–3 weeks', example: 'A retired teacher in TX teaches 14 weekly ESL students via Zoom at $30/hr = $1.8K/mo.', techStack: 'PoeTech wraps you with: per-student progress notes, scheduling, recurring billing.' },

  // --- ENTRY-LEVEL / TEEN / FAMILY-FRIENDLY (Twins-aligned) ---
  { id: 'op-teen-1', title: 'Lawn care / errands route in your neighborhood', category: 'Trades', skillTags: ['lawn care','errands','teen','neighborhood'], earningsLow: 50, earningsHigh: 800, hoursPerWeek: 8, startupCost: 100, timeToFirstDollar: '1–2 weeks', example: 'A 13-year-old in IL keeps a 6-yard route + light errand pickups; ~$280/mo summers.', techStack: 'PoeTech wraps you with: route schedule, per-customer notes, parent-shared earnings tracker.' },
  { id: 'op-teen-2', title: 'Tutoring younger kids at church / community', category: 'Teaching', skillTags: ['teaching','tutoring','teen','community'], earningsLow: 40, earningsHigh: 600, hoursPerWeek: 4, startupCost: 0, timeToFirstDollar: '1–2 weeks', example: 'A 14-year-old tutors 4 younger kids in math after church on Sundays at $15/hr = $240/mo.', techStack: 'PoeTech wraps you with: schedule, per-student notes, parent-shared earnings tracker.' },
  { id: 'op-teen-3', title: 'Tech-helper for older neighbors', category: 'Tech', skillTags: ['tech support','teen','elder','neighborhood'], earningsLow: 80, earningsHigh: 600, hoursPerWeek: 4, startupCost: 0, timeToFirstDollar: '1–2 weeks', example: 'A 15-year-old helps 8 senior neighbors with phones, smart-TVs, and email at $20/visit; ~$300/mo.', techStack: 'PoeTech wraps you with: per-visit notes, schedule, parent-shared earnings tracker.' },

  // --- FAMILY-OPERATED / HIGHER UPSIDE ---
  { id: 'op-fam-1', title: 'Family-run small farm + farmers market', category: 'Cooking / Food', skillTags: ['farming','cooking','family','seasonal'], earningsLow: 0, earningsHigh: 8000, hoursPerWeek: 30, startupCost: 5000, timeToFirstDollar: '3–8 months', example: 'A family in TN runs a 2-acre vegetable plot + 1 farmers-market stand; ~$4.5K/mo in-season.', techStack: 'PoeTech wraps you with: seasonal recurring calendar, inventory of capex equipment, per-market stand revenue tracker.' },
  { id: 'op-fam-2', title: 'Family contractor business (2nd gen entry point)', category: 'Trades', skillTags: ['carpentry','HVAC','trades','family business','construction'], earningsLow: 5000, earningsHigh: 30000, hoursPerWeek: 40, startupCost: 8000, timeToFirstDollar: '2–6 weeks', example: 'A 2-person father-son electrical contractor in OH does ~$18K/mo on residential service calls and small commercial.', techStack: 'PoeTech wraps you with: per-job scope, equipment + truck inventory, 1099 if subcontracting, multi-entity Books for the LLC.' },
];

// Match a profile against the library — returns ranked opportunities by tag overlap.
function matchOpportunities(profile, library) {
  if (!profile || !profile.skills) return [];
  const profileTags = String(profile.skills).toLowerCase().split(/[,;\n]/).map(s => s.trim()).filter(Boolean);
  if (profileTags.length === 0) return library.slice(0, 3); // fallback: top 3 unfiltered
  return library
    .map(op => {
      const tags = (op.skillTags || []).map(t => String(t).toLowerCase());
      const hits = profileTags.reduce((n, pt) => n + (tags.some(t => t.includes(pt) || pt.includes(t)) ? 1 : 0), 0);
      return { ...op, _score: hits };
    })
    .filter(op => op._score > 0)
    .sort((a, b) => b._score - a._score || b.earningsHigh - a.earningsHigh);
}

// ProjectInventory moved to ./components/Projects.jsx (r41).
// =============================================================================
// PROJECTS · TIMELINE · WORKLOAD COORDINATION — v17
// Multi-domain project tracking with start/end dates and workload visualization
// =============================================================================
// v21: ProjectsWrapper — sub-nav between Projects list and Scopes
// ProjectsWrapper + Projects + ProjectConversationLog + DateField moved to ./components/Projects.jsx (r34).

function Calendar({ data, reserves, addRecurring, addIncident, addEvent, completeEvent, deleteRecurring, deleteIncident, deleteEvent, updateRecurring, updateEvent, notifPermission, requestNotif, upcomingEvents }) {
  // r22 — Per-row inline edit (was delete-only). Tracks which row of which
  // collection is currently expanded. One target at a time keeps the UI quiet.
  const [editingRecurId, setEditingRecurId] = useState(null);
  const [editRecurForm, setEditRecurForm] = useState({ name: '', amount: 0, frequency: 'monthly', category: 'compliance', nextDue: '', entityId: 'e-personal' });
  const [editingEventId, setEditingEventId] = useState(null);
  const [editEventForm, setEditEventForm] = useState({ title: '', date: '', time: '', notes: '' });
  const startEditRecur = (r) => { setEditRecurForm({ name: r.name || '', amount: r.amount || 0, frequency: r.frequency || 'monthly', category: r.category || 'other', nextDue: r.nextDue || '', entityId: r.entityId || 'e-personal' }); setEditingRecurId(r.id); setEditingEventId(null); };
  const cancelEditRecur = () => { setEditingRecurId(null); };
  const saveEditRecur = () => { if (!editingRecurId) return; updateRecurring(editingRecurId, editRecurForm); setEditingRecurId(null); };
  const startEditEvent = (e) => { setEditEventForm({ title: e.title || '', date: e.date || '', time: e.time || '', notes: e.notes || '' }); setEditingEventId(e.id); setEditingRecurId(null); };
  const cancelEditEvent = () => { setEditingEventId(null); };
  const saveEditEvent = () => { if (!editingEventId) return; updateEvent(editingEventId, editEventForm); setEditingEventId(null); };
  const [showRecurForm, setShowRecurForm] = useState(false);
  const [showIncidentForm, setShowIncidentForm] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [newRecur, setNewRecur] = useState({ name: '', amount: '', frequency: 'annual', nextDue: '', entityId: 'e-personal', category: 'other' });
  const [newIncident, setNewIncident] = useState({ date: new Date().toISOString().slice(0,10), amount: '', category: 'other', entityId: 'e-personal', description: '', contractorIds: [] });
  const [newEvent, setNewEvent] = useState({ title: '', date: '', time: '', allDay: true, description: '', entityId: 'e-personal', category: 'appointment', reminders: ['1d-before', 'at-time'], repeat: 'none' });

  const submitRecur = () => { if (!newRecur.name || !newRecur.amount) return; addRecurring({ ...newRecur, amount: parseFloat(newRecur.amount) }); setNewRecur({ name: '', amount: '', frequency: 'annual', nextDue: '', entityId: 'e-personal', category: 'other' }); setShowRecurForm(false); };
  const submitIncident = () => { if (!newIncident.description || !newIncident.amount) return; addIncident({ ...newIncident, amount: parseFloat(newIncident.amount) }); setNewIncident({ date: new Date().toISOString().slice(0,10), amount: '', category: 'other', entityId: 'e-personal', description: '', contractorIds: [] }); setShowIncidentForm(false); };
  const submitEvent = () => {
    if (!newEvent.title || !newEvent.date) { alert('Title and date are required.'); return; }
    addEvent(newEvent);
    setNewEvent({ title: '', date: '', time: '', allDay: true, description: '', entityId: 'e-personal', category: 'appointment', reminders: ['1d-before', 'at-time'], repeat: 'none' });
    setShowEventForm(false);
  };
  const toggleReminder = (key) => setNewEvent(ev => ({ ...ev, reminders: ev.reminders.includes(key) ? ev.reminders.filter(k => k !== key) : [...ev.reminders, key] }));

  const applicableTax = data.taxCalendar.filter(t => t.applies);
  const enabledRecur = data.recurringObligations.filter(r => r.enabled);

  return (
    <div className="space-y-6">
      {/* EVENTS — top of calendar */}
      <section>
        <div className="flex items-baseline justify-between mb-3 pb-2 border-b border-[#1A1815]">
          <h2 className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751]">Recurring Obligations</h2>
          <button type="button" onClick={() => setShowRecurForm(!showRecurForm)} className="text-[10px] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815]">{showRecurForm ? '× Cancel' : '+ Add'}</button>
        </div>
        {showRecurForm && (
          <div className="bg-white border border-[#B85838] p-4 mb-3 space-y-3">
            <input className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" placeholder="Name" value={newRecur.name} onChange={e => setNewRecur({...newRecur, name: e.target.value})} />
            <div className="grid grid-cols-2 gap-2">
              <input type="number" className="p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" placeholder="Amount" value={newRecur.amount} onChange={e => setNewRecur({...newRecur, amount: e.target.value})} />
              <select className="p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={newRecur.frequency} onChange={e => setNewRecur({...newRecur, frequency: e.target.value})}>
                <option value="monthly">Monthly</option><option value="quarterly">Quarterly</option><option value="semi-annual">Semi-annual</option><option value="annual">Annual</option><option value="biennial">Biennial</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select className="p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={newRecur.entityId} onChange={e => setNewRecur({...newRecur, entityId: e.target.value})}>
                <option value="e-personal">Personal</option><option value="e-poeprops">Steward Real Estate</option><option value="e-poetech">Cornerstone Tech</option><option value="e-tlc">Wellness Practice</option>
              </select>
              <select className="p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={newRecur.category} onChange={e => setNewRecur({...newRecur, category: e.target.value})}>
                <option value="compliance">Compliance</option><option value="vehicle">Vehicle</option><option value="insurance">Insurance</option><option value="professional">Professional</option><option value="business">Business</option><option value="housing">Housing</option><option value="health">Health</option><option value="subscription">Subscription</option><option value="other">Other</option>
              </select>
            </div>
            <DateField value={newRecur.nextDue} onChange={v => setNewRecur({...newRecur, nextDue: v})} className="w-full" />
            <button type="button" onClick={submitRecur} className="w-full bg-[#1A1815] text-[#FAF8F4] py-2 text-xs uppercase tracking-wider">Add</button>
          </div>
        )}
        <div className="bg-white border border-[#1A1815]">
          {enabledRecur.map((r, i) => (
            <div key={r.id} className={`p-3 ${i < enabledRecur.length - 1 ? 'border-b border-[#E8E4DC]' : ''}`}>
              <div className="flex justify-between items-baseline gap-2">
                <div className="flex-1 min-w-0">
                  <div style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{r.name}</div>
                  <div className="text-xs text-[#5A5751]">{r.frequency} · {r.category}{r.nextDue ? ` · next ${r.nextDue}` : ''}</div>
                </div>
                <div className="flex items-baseline gap-2 shrink-0">
                  <div style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{fmt(r.amount)}</div>
                  <button type="button" onClick={() => editingRecurId === r.id ? cancelEditRecur() : startEditRecur(r)} aria-expanded={editingRecurId === r.id} aria-label={editingRecurId === r.id ? `Cancel edit for ${r.name}` : `Edit ${r.name}`} className="text-xs uppercase tracking-wider text-[#5A5751] hover:text-[#1A1815] hover:bg-[#FAF8F4] border border-transparent hover:border-[#1A1815] px-3 py-1.5 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">{editingRecurId === r.id ? '× Cancel' : '✎ Edit'}</button>
                  <button type="button" onClick={() => deleteRecurring(r.id)} aria-label={`Delete ${r.name}`} className="text-sm text-[#5A5751] hover:text-[#B85838] hover:bg-[#FAF8F4] border border-transparent hover:border-[#B85838] px-3 py-1.5 min-h-[36px] min-w-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">×</button>
                </div>
              </div>
              {/* r22 — Inline quick-edit per IN-PLACE-FIRST.md + IDENTITY-ROLES-AUDIT.md. */}
              {editingRecurId === r.id && (
                <div className="mt-3 p-3 bg-[#FAF8F4] border-2 border-[#B85838] space-y-2">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-[#B85838] font-medium">Quick edit · {r.name}</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Name</label><input className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={editRecurForm.name} onChange={e => setEditRecurForm({ ...editRecurForm, name: e.target.value })} /></div>
                    <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Amount</label><input type="number" step="0.01" className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={editRecurForm.amount} onChange={e => setEditRecurForm({ ...editRecurForm, amount: parseFloat(e.target.value) || 0 })} /></div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Frequency</label><select className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={editRecurForm.frequency} onChange={e => setEditRecurForm({ ...editRecurForm, frequency: e.target.value })}><option value="monthly">monthly</option><option value="quarterly">quarterly</option><option value="semi-annual">semi-annual</option><option value="annual">annual</option><option value="biennial">biennial</option></select></div>
                    <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Category</label><select className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={editRecurForm.category} onChange={e => setEditRecurForm({ ...editRecurForm, category: e.target.value })}><option value="compliance">compliance</option><option value="vehicle">vehicle</option><option value="insurance">insurance</option><option value="professional">professional</option><option value="business">business</option><option value="housing">housing</option><option value="health">health</option><option value="subscription">subscription</option><option value="other">other</option></select></div>
                    <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Entity</label><select className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={editRecurForm.entityId} onChange={e => setEditRecurForm({ ...editRecurForm, entityId: e.target.value })}><option value="e-personal">Personal</option><option value="e-poeprops">Steward Real Estate</option><option value="e-poetech">Cornerstone Tech</option><option value="e-tlc">Wellness Practice</option></select></div>
                  </div>
                  <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Next due date</label><input type="date" className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={editRecurForm.nextDue} onChange={e => setEditRecurForm({ ...editRecurForm, nextDue: e.target.value })} /></div>
                  <div className="flex gap-2">
                    <button type="button" onClick={saveEditRecur} className="flex-1 bg-[#1A1815] text-white px-4 py-2 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]">Save changes</button>
                    <button type="button" onClick={cancelEditRecur} className="px-4 py-2 border border-[#1A1815] text-xs uppercase tracking-wider hover:bg-white focus:outline focus:outline-2 focus:outline-[#B85838]">Cancel</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-baseline justify-between mb-3 pb-2 border-b border-[#1A1815]">
          <h2 className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751]">Incident Log</h2>
          <button type="button" onClick={() => setShowIncidentForm(!showIncidentForm)} className="text-[10px] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815]">{showIncidentForm ? '× Cancel' : '+ Log'}</button>
        </div>
        {showIncidentForm && (
          <div className="bg-white border border-[#B85838] p-4 mb-3 space-y-3">
            <input className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" placeholder="What happened?" value={newIncident.description} onChange={e => setNewIncident({...newIncident, description: e.target.value})} />
            <div className="grid grid-cols-2 gap-2">
              <DateField value={newIncident.date} onChange={v => setNewIncident({...newIncident, date: v})} />
              <input type="number" className="p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" placeholder="Amount" value={newIncident.amount} onChange={e => setNewIncident({...newIncident, amount: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select className="p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={newIncident.entityId} onChange={e => setNewIncident({...newIncident, entityId: e.target.value})}>
                <option value="e-personal">Personal</option><option value="e-poeprops">Steward Real Estate</option><option value="e-poetech">Cornerstone Tech</option><option value="e-tlc">Wellness Practice</option>
              </select>
              <select className="p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={newIncident.category} onChange={e => setNewIncident({...newIncident, category: e.target.value})}>
                <option value="vehicle">Vehicle</option><option value="medical">Medical</option><option value="property">Property repair</option><option value="travel">Travel</option><option value="legal">Legal</option><option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-[9px] uppercase tracking-wider text-[#5A5751] block mb-1.5">1099 contractors involved (optional)</label>
              {(data.contractors1099 || []).length === 0 ? (
                <div className="text-[10px] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>No contractors yet — add them in Books · 1099s.</div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {(data.contractors1099 || []).map(k => {
                    const assigned = (newIncident.contractorIds || []).includes(k.id);
                    return (
                      <button type="button" key={k.id} onClick={() => setNewIncident({ ...newIncident, contractorIds: assigned ? (newIncident.contractorIds || []).filter(id => id !== k.id) : [...(newIncident.contractorIds || []), k.id] })} className={`text-[10px] px-2 py-1 border uppercase tracking-wider ${assigned ? 'border-[#B85838] bg-[#B85838] text-white' : 'border-[#E8E4DC] text-[#5A5751] hover:border-[#B85838] hover:text-[#1A1815]'}`}>
                        {assigned ? '✓ ' : ''}{k.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <button type="button" onClick={submitIncident} className="w-full bg-[#1A1815] text-[#FAF8F4] py-2 text-xs uppercase tracking-wider">Log</button>
          </div>
        )}
        <div className="bg-white border border-[#1A1815]">
          {data.incidents.map((inc, i) => (
            <div key={inc.id} className={`p-3 ${i < data.incidents.length - 1 ? 'border-b border-[#E8E4DC]' : ''}`}>
              <div className="flex justify-between items-baseline gap-2">
                <div className="flex-1 min-w-0">
                  <div style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{inc.description}</div>
                  <div className="text-xs text-[#5A5751]">{inc.date.slice(5)} · {inc.category}</div>
                  {Array.isArray(inc.contractorIds) && inc.contractorIds.length > 0 && (
                    <div className="text-[10px] text-[#5A5751] mt-1 flex flex-wrap gap-1.5">
                      <span className="uppercase tracking-wider">👤 1099:</span>
                      {inc.contractorIds.map(cid => {
                        const k = (data.contractors1099 || []).find(c => c.id === cid);
                        return k ? <span key={cid} className="px-1.5 py-0.5 border border-[#E8E4DC] bg-[#FAF8F4]" style={{ fontFamily: '"Fraunces", serif' }}>{k.name}</span> : null;
                      })}
                    </div>
                  )}
                </div>
                <div className="flex items-baseline gap-2 shrink-0">
                  <div className="text-[#B85838]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{fmt(inc.amount)}</div>
                  <button type="button" onClick={() => deleteIncident(inc.id)} aria-label="Delete" className="text-sm text-[#5A5751] hover:text-[#B85838] hover:bg-[#FAF8F4] border border-transparent hover:border-[#B85838] px-3 py-1.5 min-h-[36px] min-w-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">×</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-baseline justify-between mb-3 pb-2 border-b border-[#1A1815] gap-2 flex-wrap">
          <h2 className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751]">Events</h2>
          <div className="flex items-center gap-3">
            {notifPermission === 'default' && (
              <button type="button" onClick={requestNotif} className="text-[10px] uppercase tracking-wider text-[#5A6E3D] hover:text-[#1A1815]">🔔 Enable notifications</button>
            )}
            {notifPermission === 'granted' && (
              <span className="text-[10px] uppercase tracking-wider text-[#5A6E3D]">🔔 Notifications on</span>
            )}
            {notifPermission === 'denied' && (
              <span className="text-[10px] uppercase tracking-wider text-[#B85838]">🔔 Blocked in browser</span>
            )}
            <button type="button" onClick={() => setShowEventForm(!showEventForm)} className="text-[10px] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815]">{showEventForm ? '× Cancel' : '+ Add event'}</button>
          </div>
        </div>

        {showEventForm && (
          <div className="bg-white border border-[#B85838] p-4 mb-3 space-y-3">
            <div className="text-[10px] uppercase tracking-[0.2em] text-[#B85838] font-medium">New event</div>
            <input className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" placeholder="Event title (e.g., Dr. Shafer ortho follow-up)" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Date</label>
                <DateField value={newEvent.date} onChange={v => setNewEvent({...newEvent, date: v})} className="w-full" />
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Time {newEvent.allDay && '(all-day)'}</label>
                <input type="time" disabled={newEvent.allDay} className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4] disabled:opacity-50" value={newEvent.time} onChange={e => setNewEvent({...newEvent, time: e.target.value})} />
              </div>
            </div>
            <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={newEvent.allDay} onChange={e => setNewEvent({...newEvent, allDay: e.target.checked, time: e.target.checked ? '' : newEvent.time})} /> All-day event</label>
            <textarea className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" rows="2" placeholder="Description / notes" value={newEvent.description} onChange={e => setNewEvent({...newEvent, description: e.target.value})} />
            <div className="grid grid-cols-2 gap-2">
              <select className="p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={newEvent.entityId} onChange={e => setNewEvent({...newEvent, entityId: e.target.value})}>
                <option value="e-personal">Personal</option><option value="e-poeprops">Steward Real Estate</option><option value="e-poetech">Cornerstone Tech</option><option value="e-tlc">Wellness Practice</option>
              </select>
              <select className="p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={newEvent.category} onChange={e => setNewEvent({...newEvent, category: e.target.value})}>
                {EVENT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[9px] uppercase tracking-wider text-[#5A5751] block mb-1.5">Reminders</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {REMINDER_OPTIONS.map(opt => (
                  <label key={opt.key} className={`text-xs px-2 py-1.5 border cursor-pointer ${newEvent.reminders.includes(opt.key) ? 'border-[#B85838] bg-[#FAF8F4] text-[#1A1815]' : 'border-[#E8E4DC] text-[#5A5751]'}`}>
                    <input type="checkbox" checked={newEvent.reminders.includes(opt.key)} onChange={() => toggleReminder(opt.key)} className="hidden" />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
            <select className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={newEvent.repeat} onChange={e => setNewEvent({...newEvent, repeat: e.target.value})}>
              <option value="none">Does not repeat</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
            <button type="button" onClick={submitEvent} className="w-full bg-[#1A1815] text-[#FAF8F4] py-2 text-xs uppercase tracking-wider hover:bg-[#B85838]">Save Event</button>
            {notifPermission !== 'granted' && notifPermission !== 'unsupported' && (
              <p className="text-[10px] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>For reminder pop-ups outside the app, click "Enable notifications" above. Visual reminders work either way.</p>
            )}
          </div>
        )}

        {upcomingEvents.length === 0 && !showEventForm && (
          <div className="bg-white border border-[#E8E4DC] p-6 text-center">
            <p className="text-sm text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>No events scheduled. Click "+ Add event" to create one with reminders.</p>
          </div>
        )}

        {upcomingEvents.length > 0 && (
          <div className="bg-white border border-[#1A1815]">
            {upcomingEvents.map((e, i) => (
              <div key={e.id} className={`p-3 ${i < upcomingEvents.length - 1 ? 'border-b border-[#E8E4DC]' : ''}`}>
                <div className="flex justify-between items-baseline gap-2 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{e.title}</div>
                    <div className="text-[10px] uppercase tracking-wider text-[#5A5751] mt-0.5">
                      {e.date}{e.time ? ` · ${e.time}` : ' · all day'} · {e.category} · {relativeWhen(e.dateTime)}
                    </div>
                    {e.description && <div className="text-xs text-[#5A5751] mt-1" style={{ fontFamily: '"Fraunces", serif', fontStyle: 'italic' }}>{e.description}</div>}
                    {e.reminders && e.reminders.length > 0 && (
                      <div className="text-[10px] text-[#5A5751] mt-1">🔔 {e.reminders.length} reminder{e.reminders.length>1?'s':''}</div>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1.5 shrink-0">
                    <button type="button" onClick={() => completeEvent(e.id)} className="text-[10px] uppercase tracking-wider text-[#5A6E3D] hover:text-[#1A1815]">✓ Done</button>
                    <button type="button" onClick={() => editingEventId === e.id ? cancelEditEvent() : startEditEvent(e)} aria-expanded={editingEventId === e.id} aria-label={editingEventId === e.id ? `Cancel edit for ${e.title}` : `Edit ${e.title}`} className="text-[10px] uppercase tracking-wider text-[#5A5751] hover:text-[#1A1815] hover:bg-[#FAF8F4] border border-transparent hover:border-[#1A1815] px-2 py-1.5 min-h-[32px] focus:outline focus:outline-2 focus:outline-[#B85838]">{editingEventId === e.id ? '× Cancel' : '✎ Edit'}</button>
                    <button type="button" onClick={() => deleteEvent(e.id)} aria-label={`Delete ${e.title}`} className="text-sm text-[#5A5751] hover:text-[#B85838] hover:bg-[#FAF8F4] border border-transparent hover:border-[#B85838] px-3 py-1.5 min-h-[36px] min-w-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">×</button>
                  </div>
                </div>
                {/* r22 — Inline event quick-edit. */}
                {editingEventId === e.id && (
                  <div className="mt-3 p-3 bg-[#FAF8F4] border-2 border-[#B85838] space-y-2">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-[#B85838] font-medium">Quick edit · {e.title}</div>
                    <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Title</label><input className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={editEventForm.title} onChange={ev => setEditEventForm({ ...editEventForm, title: ev.target.value })} /></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Date</label><input type="date" className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={editEventForm.date} onChange={ev => setEditEventForm({ ...editEventForm, date: ev.target.value })} /></div>
                      <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Time (optional)</label><input type="time" className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={editEventForm.time} onChange={ev => setEditEventForm({ ...editEventForm, time: ev.target.value })} /></div>
                    </div>
                    <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Notes</label><textarea className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" rows="2" value={editEventForm.notes} onChange={ev => setEditEventForm({ ...editEventForm, notes: ev.target.value })} /></div>
                    <div className="flex gap-2">
                      <button type="button" onClick={saveEditEvent} className="flex-1 bg-[#1A1815] text-white px-4 py-2 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]">Save changes</button>
                      <button type="button" onClick={cancelEditEvent} className="px-4 py-2 border border-[#1A1815] text-xs uppercase tracking-wider hover:bg-white focus:outline focus:outline-2 focus:outline-[#B85838]">Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionTitle>Tax & Compliance Calendar</SectionTitle>
        <div className="bg-white border border-[#1A1815]">
          {applicableTax.sort((a,b)=>a.month-b.month).map((t, i) => (
            <div key={t.id} className={`p-3 ${i < applicableTax.length - 1 ? 'border-b border-[#E8E4DC]' : ''}`}>
              <div className="flex justify-between items-baseline">
                <div>
                  <div style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{t.name}</div>
                  <div className="text-xs text-[#5A5751]">{t.desc}</div>
                </div>
                <div style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{MONTHS_ABBR[t.month-1]} {t.day}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

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
// Surfaces real info pulled from thechurchofthelivinggod.com (service times,
// broadcast/social, tithes, ministry sign-up, Bible reading) and adds
// parishioner-friendly extras: prayer request log (local-first, sent to
// the office via mailto when the user chooses), one-tap reminder save to
// the existing Calendar events, ministry-interest sign-up.
// FUTURE-MODULE HOOK: hands off to the planned `spiritual` module once it
// ships — same data shape, just more views over it.
// WCAG 2.1 AA: <label>'d inputs, focus rings, descriptive aria-labels,
// status meaning conveyed in text as well as color.
// =============================================================================
function Church({ church, prayerRequests, addPrayerRequest, markPrayerRequestSent, deletePrayerRequest, addEvent }) {
  const [prForm, setPrForm] = useState({ requester: '', request: '', shareWithChurch: true, anonymous: false });
  const [prError, setPrError] = useState('');
  const [showPrForm, setShowPrForm] = useState(false);
  const [ministryInterest, setMinistryInterest] = useState({ name: '', email: '', interest: '', skills: '' });
  const [showMinistryForm, setShowMinistryForm] = useState(false);
  const [ministryNote, setMinistryNote] = useState('');

  // ---------------------------------------------------------------------------
  // ADD YOUR VOICE — interactive contribution input (2026-05-25, per Darrell):
  // parishioners speak (Web Speech API) or paste a link to drop a note about
  // anything on the church tab — today's sermon, an article, a question for
  // leadership, a ministry idea, a building-fund follow-up. Stored locally
  // for now; future-state syncs to the v2.7 `interactions` table (schema
  // already declared in infra/supabase/schema-v2.7-church.sql §11.5 area).
  // POE binding: the user controls the mic, the link, the topic, and the
  // moment to share. Nothing leaves the device until they tap Send.
  // ---------------------------------------------------------------------------
  const [contribForm, setContribForm] = useState({ topic: '', text: '', link: '' });
  const [contribError, setContribError] = useState('');
  // Per Darrell 2026-05-25: the contribution form is the church tab's center of
  // gravity — open by default so the prompt is one tap away ("speak / type / link"
  // is the action, not a hidden affordance).
  const [showContribForm, setShowContribForm] = useState(true);
  const [contributions, setContributions] = useState([]);  // local-only until v2.7 sync wires up
  // Pagination — match the Queue / Feedback Log pattern: most-recent 5 on the
  // page; older entries reachable with ← / → arrows.
  const CONTRIB_PAGE_SIZE = 5;
  const [contribPage, setContribPage] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  // Feature detection — Web Speech API (still vendor-prefixed in some browsers)
  const speechSupported = typeof window !== 'undefined'
    && (window.SpeechRecognition || window.webkitSpeechRecognition);

  const toggleSpeech = () => {
    if (!speechSupported) {
      setContribError('Voice input is not supported in this browser. Type your note or paste a link instead.');
      return;
    }
    if (isListening) {
      try { recognitionRef.current?.stop(); } catch (_) { /* ignore */ }
      setIsListening(false);
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const r = new SR();
    r.continuous = false;
    r.interimResults = false;
    r.lang = 'en-US';
    r.onresult = (e) => {
      const transcript = Array.from(e.results)
        .map(res => res[0].transcript)
        .join(' ')
        .trim();
      if (transcript) {
        setContribForm(prev => ({
          ...prev,
          text: prev.text ? `${prev.text} ${transcript}`.trim() : transcript,
        }));
      }
    };
    r.onerror = (e) => {
      setContribError(`Voice input error: ${e.error || 'unknown'}. Type your note instead.`);
      setIsListening(false);
    };
    r.onend = () => setIsListening(false);
    recognitionRef.current = r;
    setContribError('');
    try {
      r.start();
      setIsListening(true);
    } catch (err) {
      setContribError('Could not start voice input. Type your note or paste a link instead.');
      setIsListening(false);
    }
  };

  const submitContribution = () => {
    const topic = (contribForm.topic || '').trim();
    const text  = (contribForm.text  || '').trim();
    const link  = (contribForm.link  || '').trim();
    if (!text && !link) {
      setContribError('Add a note (speak or type) or paste a link before saving.');
      return;
    }
    // Light URL sanity check — non-blocking; the user can still save if they
    // typed something that isn't a parseable URL.
    if (link && !/^https?:\/\//i.test(link)) {
      setContribError('Links should start with http:// or https://. Edit and re-save.');
      return;
    }
    setContribError('');
    const entry = {
      id: `contrib-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      topic, text, link,
      createdAt: new Date().toISOString(),
      sentAt: null,
    };
    setContributions(prev => [entry, ...prev]);
    setContribForm({ topic: '', text: '', link: '' });
    setShowContribForm(false);
  };

  const mailtoForContribution = (contrib) => {
    const subject = `Church-tab note${contrib.topic ? ` — ${contrib.topic}` : ''}`;
    const body =
      `Sent from PoeTech Family OS · Church tab.\n\n` +
      (contrib.topic ? `About: ${contrib.topic}\n\n` : '') +
      (contrib.text  ? `Note:\n${contrib.text}\n\n` : '') +
      (contrib.link  ? `Link: ${contrib.link}\n` : '');
    if (church?.contactEmail) return `mailto:${church.contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    return church?.links?.stayConnected || church?.site || '#';
  };

  const markContributionSent = (id) => {
    const at = new Date().toISOString();
    setContributions(prev => prev.map(c => c.id === id ? { ...c, sentAt: at } : c));
  };

  const deleteContribution = (id) => {
    setContributions(prev => prev.filter(c => c.id !== id));
  };

  const c = church || {};
  const fieldCls = 'w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838]';
  const labelCls = 'text-[9px] uppercase tracking-wider text-[#5A5751]';

  const submitPrayer = () => {
    const requester = prForm.anonymous ? '(anonymous)' : (prForm.requester || '').trim();
    const request = (prForm.request || '').trim();
    if (!request) { setPrError('Please describe the prayer request.'); return; }
    if (!prForm.anonymous && !requester) { setPrError('Add your name, or check anonymous.'); return; }
    setPrError('');
    addPrayerRequest({ requester, request, shareWithChurch: !!prForm.shareWithChurch });
    setPrForm({ requester: '', request: '', shareWithChurch: true, anonymous: false });
    setShowPrForm(false);
  };

  const mailtoFor = (pr) => {
    const subject = `Prayer request from ${pr.requester}`;
    const body = `Hello — please add this to the prayer list at The Love Corner.\n\nFrom: ${pr.requester}\nDate: ${pr.createdAt.slice(0, 10)}\n\n${pr.request}\n\nThank you.`;
    // The site uses an obfuscated email; users without the church's address can paste the contact form URL.
    // If a contactEmail is configured, prefer that. Otherwise fall back to the Stay Connected page.
    if (c.contactEmail) return `mailto:${c.contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    return c.links?.stayConnected || c.site || '#';
  };

  // Save a one-tap event to the family calendar from a service entry.
  const saveServiceToCalendar = (svc) => {
    if (!addEvent) return;
    // Build the next occurrence of this day-of-week + time.
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const targetDow = days.indexOf(svc.day);
    if (targetDow < 0) return;
    const now = new Date();
    const ahead = (targetDow - now.getDay() + 7) % 7;
    const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (ahead === 0 ? 7 : ahead));
    const isoDate = next.toISOString().slice(0, 10);
    // Parse "11:00 AM" → "11:00"
    const m = (svc.time || '').match(/(\d+):(\d+)\s*(AM|PM)?/i);
    let hh = m ? parseInt(m[1]) : 11; const mm = m ? parseInt(m[2]) : 0;
    if (m && m[3] && m[3].toUpperCase() === 'PM' && hh < 12) hh += 12;
    if (m && m[3] && m[3].toUpperCase() === 'AM' && hh === 12) hh = 0;
    addEvent({
      title: `${c.nickname || c.name || 'Church'} · ${svc.label}`,
      description: `${svc.day} ${svc.time} — saved from Church tab.`,
      date: isoDate,
      time: `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`,
      category: 'family',
      reminders: ['at-event', 'thirty-min-before'],
    });
    alert(`Saved to your calendar: ${svc.label} on ${isoDate} at ${svc.time}`);
  };

  const submitMinistry = () => {
    if (!ministryInterest.email) { setMinistryNote('Add an email so the church can follow up.'); return; }
    setMinistryNote('');
    const subject = `Ministry interest — ${ministryInterest.interest || 'general'}`;
    const body = `Name: ${ministryInterest.name}\nEmail: ${ministryInterest.email}\nMinistry of interest: ${ministryInterest.interest}\nSkills / availability:\n${ministryInterest.skills}\n\nSent from PoeTech Family OS · Church tab.`;
    // Open the church's Stay Connected page so the parishioner can paste/forward;
    // when contactEmail is set, open a proper mailto instead.
    if (c.contactEmail) {
      window.location.href = `mailto:${c.contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    } else {
      window.open(c.links?.stayConnected || c.site, '_blank', 'noopener,noreferrer');
    }
    setMinistryInterest({ name: '', email: '', interest: '', skills: '' });
    setShowMinistryForm(false);
  };

  return (
    <div className="space-y-6">
      {/* YAHWEH HEARS YOU — interactive contribution input (renamed 2026-05-25 per Darrell)
          The church tab's spiritual-surface name for the voice + link + text
          processing center. Per CLAUDE.md typographic theology (Yahweh always
          capitalized) and per the Holy Spirit Integration Worldview binding —
          this title testifies directly: the user speaks; Yahweh hears. The
          warmer-but-secular default ("Your Voice Matters") is reserved for the
          reusable InputCenter component (app/src/components/InputCenter.jsx)
          for use in non-spiritual modules. Below the church-identity "ad" and
          above the Service Times block. Speak (Web Speech API), paste a link,
          or type. Logged locally; sent to the church office via the user's
          email client when they tap Send. */}
      <section aria-labelledby="contrib-h" className="bg-white border-2 border-[#B85838] p-4">
        <div className="flex items-baseline justify-between gap-2 flex-wrap">
          <h3 id="contrib-h" className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] font-semibold">Yahweh Hears You · Speak · Type · Link</h3>
          <button type="button" onClick={() => { setShowContribForm(!showContribForm); setContribError(''); }} className="text-[10px] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]">{showContribForm ? '× Cancel' : '+ Speak or share'}</button>
        </div>
        <p className="text-xs text-[#5A5751] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>
          Speak it, type it, or paste a link — about today's sermon, an article worth sharing, a question for leadership, a ministry idea, a thought you don't want to lose. Logged on your device; send to the church office when you're ready.
        </p>

        {showContribForm && (
          <div className="mt-3 bg-[#FAF8F4] border border-[#B85838] p-3 space-y-2">
            <div>
              <label htmlFor="contrib-topic" className={labelCls}>What's this about? (optional)</label>
              <input
                id="contrib-topic"
                className={fieldCls}
                placeholder="e.g., Today's sermon · Building fund · Ministry idea"
                value={contribForm.topic}
                onChange={e => setContribForm({ ...contribForm, topic: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="contrib-text" className={labelCls}>Your note (type or speak)</label>
              <textarea
                id="contrib-text"
                rows="3"
                className={fieldCls}
                placeholder="Type here, or tap the mic to speak."
                value={contribForm.text}
                onChange={e => setContribForm({ ...contribForm, text: e.target.value })}
              />
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <button
                  type="button"
                  onClick={toggleSpeech}
                  aria-pressed={isListening}
                  aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
                  disabled={!speechSupported}
                  className={`text-xs uppercase tracking-wider px-3 py-2 border focus:outline focus:outline-2 focus:outline-[#B85838] ${
                    isListening
                      ? 'bg-[#B85838] text-white border-[#B85838] animate-pulse'
                      : speechSupported
                        ? 'border-[#B85838] text-[#B85838] hover:bg-[#B85838] hover:text-white'
                        : 'border-[#E8E4DC] text-[#5A5751] opacity-60 cursor-not-allowed'
                  }`}
                >
                  {isListening ? '⏹ Stop' : '🎤 Speak'}
                </button>
                {!speechSupported && (
                  <span className="text-[10px] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>
                    Voice input not available in this browser — type your note instead.
                  </span>
                )}
                {isListening && (
                  <span className="text-[10px] text-[#B85838] uppercase tracking-wider" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                    listening…
                  </span>
                )}
              </div>
            </div>
            <div>
              <label htmlFor="contrib-link" className={labelCls}>Or paste a link</label>
              <input
                id="contrib-link"
                type="url"
                className={fieldCls}
                placeholder="https://…"
                value={contribForm.link}
                onChange={e => setContribForm({ ...contribForm, link: e.target.value })}
              />
            </div>
            <button
              type="button"
              onClick={submitContribution}
              className="w-full bg-[#1A1815] text-white py-2 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]"
            >
              Save Note
            </button>
            {contribError && (
              <p role="alert" className="text-xs text-[#B85838]" style={{ fontFamily: '"Fraunces", serif' }}>
                {contribError}
              </p>
            )}
          </div>
        )}

        {contributions.length > 0 && (() => {
          const totalPages = Math.max(1, Math.ceil(contributions.length / CONTRIB_PAGE_SIZE));
          const safePage = Math.min(contribPage, totalPages - 1);
          const start = safePage * CONTRIB_PAGE_SIZE;
          const pageItems = contributions.slice(start, start + CONTRIB_PAGE_SIZE);
          return (
          <>
          <div className="mt-3 border border-[#1A1815]">
            {pageItems.map((entry, i, arr) => (
              <div key={entry.id} className={`p-3 ${i < arr.length - 1 ? 'border-b border-[#E8E4DC]' : ''}`}>
                <div className="flex items-baseline justify-between gap-2 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] uppercase tracking-wider text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                      {entry.createdAt.slice(0, 10)}{entry.topic ? ` · ${entry.topic}` : ''}
                    </div>
                    {entry.text && (
                      <div className="text-sm mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>{entry.text}</div>
                    )}
                    {entry.link && (
                      <div className="text-xs mt-0.5">
                        <a
                          href={entry.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline text-[#B85838] hover:text-[#1A1815] break-all"
                        >
                          {entry.link}
                        </a>
                      </div>
                    )}
                    <div className="text-[10px] uppercase tracking-wider mt-1 text-[#5A5751]">
                      {entry.sentAt ? `✓ sent ${entry.sentAt.slice(0, 10)}` : 'private (on this device)'}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!entry.sentAt && (
                      <a
                        href={mailtoForContribution(entry)}
                        target={c.contactEmail ? '_self' : '_blank'}
                        rel="noopener noreferrer"
                        onClick={() => markContributionSent(entry.id)}
                        className="text-xs uppercase tracking-wider px-3 py-1.5 border border-[#B85838] text-[#B85838] hover:bg-[#B85838] hover:text-white min-h-[36px] inline-flex items-center focus:outline focus:outline-2 focus:outline-[#B85838]"
                      >
                        Send →
                      </a>
                    )}
                    <span aria-hidden="true" className="h-5 w-px bg-[#E8E4DC] mx-1" />
                    <button
                      type="button"
                      onClick={() => { if (confirm('Delete this note?')) deleteContribution(entry.id); }}
                      aria-label="Delete this note"
                      className="text-sm text-[#5A5751] hover:text-[#B85838] hover:bg-[#FAF8F4] border border-transparent hover:border-[#B85838] px-3 py-1.5 min-h-[36px] min-w-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="mt-2 flex items-center justify-between gap-2 text-[10px] uppercase tracking-wider text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
              <button
                type="button"
                onClick={() => setContribPage(p => Math.max(0, p - 1))}
                disabled={safePage === 0}
                aria-label="Previous page of notes"
                className="px-3 py-1.5 border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed focus:outline focus:outline-2 focus:outline-[#B85838]"
              >
                ← prev
              </button>
              <div>
                Page {safePage + 1} of {totalPages} · {contributions.length} note{contributions.length === 1 ? '' : 's'}
              </div>
              <button
                type="button"
                onClick={() => setContribPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={safePage >= totalPages - 1}
                aria-label="Next page of notes"
                className="px-3 py-1.5 border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed focus:outline focus:outline-2 focus:outline-[#B85838]"
              >
                next →
              </button>
            </div>
          )}
          </>
          );
        })()}
      </section>

      {/* SERVICE TIMES + SAVE TO CALENDAR */}
      {(c.services || []).length > 0 && (
        <section aria-labelledby="svc-h">
          <h3 id="svc-h" className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751] mb-2 pb-2 border-b border-[#1A1815]">Service Times · in-person + online</h3>
          <div className="bg-white border border-[#1A1815]">
            {c.services.map((svc, i, arr) => (
              <div key={svc.id} className={`p-3 flex items-center justify-between gap-3 flex-wrap ${i < arr.length - 1 ? 'border-b border-[#E8E4DC]' : ''}`}>
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-wider text-[#5A5751]">{svc.day}</div>
                  <div style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{svc.label} · <span style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 500 }}>{svc.time}</span></div>
                  {svc.online && <div className="text-[10px] text-[#5A6E3D] uppercase tracking-wider">✓ live online</div>}
                </div>
                <button type="button" onClick={() => saveServiceToCalendar(svc)} className="text-xs uppercase tracking-wider px-3 py-2 border border-[#B85838] text-[#B85838] hover:bg-[#B85838] hover:text-white focus:outline focus:outline-2 focus:outline-[#B85838]">📅 Save next one</button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* MEDIA / BROADCAST */}
      {c.media && (
        <section aria-labelledby="media-h">
          <h3 id="media-h" className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751] mb-2 pb-2 border-b border-[#1A1815]">Watch · Listen · Follow</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {c.media.youtube && <a href={c.media.youtube} target="_blank" rel="noopener noreferrer" className="bg-white border border-[#E8E4DC] hover:border-[#B85838] p-3 text-center focus:outline focus:outline-2 focus:outline-[#B85838]"><div className="text-2xl mb-1" aria-hidden="true">▶</div><div className="text-xs uppercase tracking-wider font-semibold">YouTube</div><div className="text-[10px] text-[#5A5751]">Recorded services</div></a>}
            {c.media.facebook && <a href={c.media.facebook} target="_blank" rel="noopener noreferrer" className="bg-white border border-[#E8E4DC] hover:border-[#B85838] p-3 text-center focus:outline focus:outline-2 focus:outline-[#B85838]"><div className="text-2xl mb-1" aria-hidden="true">f</div><div className="text-xs uppercase tracking-wider font-semibold">Facebook</div><div className="text-[10px] text-[#5A5751]">Love Corner Live</div></a>}
            {c.media.instagram && <a href={c.media.instagram} target="_blank" rel="noopener noreferrer" className="bg-white border border-[#E8E4DC] hover:border-[#B85838] p-3 text-center focus:outline focus:outline-2 focus:outline-[#B85838]"><div className="text-2xl mb-1" aria-hidden="true">◉</div><div className="text-xs uppercase tracking-wider font-semibold">Instagram</div><div className="text-[10px] text-[#5A5751]">@tlcexperience</div></a>}
            {c.media.broadcast && <a href={c.media.broadcast} target="_blank" rel="noopener noreferrer" className="bg-white border border-[#E8E4DC] hover:border-[#B85838] p-3 text-center focus:outline focus:outline-2 focus:outline-[#B85838]"><div className="text-2xl mb-1" aria-hidden="true">📻</div><div className="text-xs uppercase tracking-wider font-semibold">Broadcast</div><div className="text-[10px] text-[#5A5751]">All channels</div></a>}
          </div>
        </section>
      )}

      {/* GIVE + PARISH LIFE */}
      <section aria-labelledby="give-h" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {c.links?.give && (
          <div className="bg-white border-2 border-[#B85838] p-4">
            <h3 id="give-h" className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] font-semibold mb-1">Tithes · Offering · Gifts</h3>
            <p className="text-sm leading-relaxed text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>Giving runs through the church's own secure page — no payment data passes through this app.</p>
            <div className="flex gap-2 mt-3 flex-wrap">
              <a href={c.links.give} target="_blank" rel="noopener noreferrer" className="text-xs uppercase tracking-wider px-3 py-2 bg-[#1A1815] text-white hover:bg-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]">Give →</a>
              {c.links.giversCreed && <a href={c.links.giversCreed} target="_blank" rel="noopener noreferrer" className="text-xs uppercase tracking-wider px-3 py-2 border border-[#1A1815] hover:bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838]">Givers Creed</a>}
            </div>
          </div>
        )}
        <div className="bg-white border border-[#1A1815] p-4">
          <h3 className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751] font-semibold mb-1">Parish Life</h3>
          <ul className="text-xs space-y-1.5" style={{ fontFamily: '"Fraunces", serif' }}>
            {c.links?.calendar && <li>📅 <a href={c.links.calendar} target="_blank" rel="noopener noreferrer" className="underline text-[#B85838] hover:text-[#1A1815]">Church calendar</a></li>}
            {c.links?.bibleChallenge && <li>📖 <a href={c.links.bibleChallenge} target="_blank" rel="noopener noreferrer" className="underline text-[#B85838] hover:text-[#1A1815]">Bible Reading Challenge 2026</a></li>}
            {c.links?.classPoints && <li>✏️ <a href={c.links.classPoints} target="_blank" rel="noopener noreferrer" className="underline text-[#B85838] hover:text-[#1A1815]">Bible study class points</a></li>}
            {c.links?.lettersFromBG && <li>✉️ <a href={c.links.lettersFromBG} target="_blank" rel="noopener noreferrer" className="underline text-[#B85838] hover:text-[#1A1815]">Letters from Bishop Gwin</a></li>}
            {c.links?.assembly && <li>🏛 <a href={c.links.assembly} target="_blank" rel="noopener noreferrer" className="underline text-[#B85838] hover:text-[#1A1815]">National Assembly</a></li>}
            {c.links?.stayConnected && <li>🔗 <a href={c.links.stayConnected} target="_blank" rel="noopener noreferrer" className="underline text-[#B85838] hover:text-[#1A1815]">Stay connected</a></li>}
          </ul>
        </div>
      </section>

      {/* MINISTRY INTEREST */}
      {c.links?.ministries && (
        <section aria-labelledby="min-h" className="bg-white border border-[#1A1815] p-4">
          <div className="flex items-baseline justify-between gap-2 flex-wrap">
            <h3 id="min-h" className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751] font-semibold">Ministry Opportunities</h3>
            <button type="button" onClick={() => setShowMinistryForm(!showMinistryForm)} className="text-[10px] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]">{showMinistryForm ? '× Cancel' : '+ Express interest'}</button>
          </div>
          <p className="text-xs text-[#5A5751] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>Where you'd like to serve, what hours fit your life. Your note goes to the church office via your email client — nothing is sent through us.</p>
          <a href={c.links.ministries} target="_blank" rel="noopener noreferrer" className="text-xs uppercase tracking-wider text-[#B85838] underline hover:text-[#1A1815] inline-block mt-2">See current openings →</a>
          {showMinistryForm && (
            <div className="mt-3 bg-[#FAF8F4] border border-[#B85838] p-3 space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div><label htmlFor="min-name" className={labelCls}>Your name</label><input id="min-name" className={fieldCls} value={ministryInterest.name} onChange={e => setMinistryInterest({ ...ministryInterest, name: e.target.value })} /></div>
                <div><label htmlFor="min-email" className={labelCls}>Email (so they can reply)</label><input id="min-email" type="email" className={fieldCls} value={ministryInterest.email} onChange={e => setMinistryInterest({ ...ministryInterest, email: e.target.value })} /></div>
              </div>
              <div><label htmlFor="min-interest" className={labelCls}>Ministry of interest</label><input id="min-interest" className={fieldCls} placeholder="e.g., Music · Youth · Tech · Outreach" value={ministryInterest.interest} onChange={e => setMinistryInterest({ ...ministryInterest, interest: e.target.value })} /></div>
              <div><label htmlFor="min-skills" className={labelCls}>Skills · availability</label><textarea id="min-skills" rows="3" className={fieldCls} value={ministryInterest.skills} onChange={e => setMinistryInterest({ ...ministryInterest, skills: e.target.value })} /></div>
              <button type="button" onClick={submitMinistry} className="w-full bg-[#1A1815] text-white py-2 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]">Send to Church Office</button>
              {ministryNote && <p role="alert" className="text-xs text-[#B85838]" style={{ fontFamily: '"Fraunces", serif' }}>{ministryNote}</p>}
            </div>
          )}
        </section>
      )}

      {/* PRAYER REQUESTS — local log, optional send-out */}
      <section aria-labelledby="pr-h">
        <div className="flex items-baseline justify-between mb-2 pb-2 border-b border-[#1A1815] gap-2 flex-wrap">
          <h3 id="pr-h" className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751]">Prayer Requests · {prayerRequests.length}</h3>
          <button type="button" onClick={() => { setShowPrForm(!showPrForm); setPrError(''); }} className="text-[10px] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]">{showPrForm ? '× Cancel' : '+ Add request'}</button>
        </div>
        <p className="text-xs text-[#5A5751] italic mb-2" style={{ fontFamily: '"Fraunces", serif' }}>
          Logged locally on your device. Tap "Send" to forward a request to the church office through your email client — you stay in control of what leaves your device.
        </p>
        {showPrForm && (
          <div className="bg-white border border-[#B85838] p-3 mb-3 space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div><label htmlFor="pr-name" className={labelCls}>Requested by</label><input id="pr-name" className={fieldCls} value={prForm.requester} onChange={e => setPrForm({ ...prForm, requester: e.target.value })} disabled={prForm.anonymous} placeholder={prForm.anonymous ? '(anonymous)' : 'Your name'} /></div>
              <div className="flex items-end gap-3">
                <label className="flex items-baseline gap-2 text-xs" style={{ fontFamily: '"Fraunces", serif' }}>
                  <input type="checkbox" checked={prForm.anonymous} onChange={e => setPrForm({ ...prForm, anonymous: e.target.checked })} className="accent-[#B85838]" /> Submit anonymously
                </label>
              </div>
            </div>
            <div><label htmlFor="pr-text" className={labelCls}>Prayer request</label><textarea id="pr-text" rows="3" className={fieldCls} value={prForm.request} onChange={e => setPrForm({ ...prForm, request: e.target.value })} /></div>
            <label className="flex items-baseline gap-2 text-xs" style={{ fontFamily: '"Fraunces", serif' }}>
              <input type="checkbox" checked={prForm.shareWithChurch} onChange={e => setPrForm({ ...prForm, shareWithChurch: e.target.checked })} className="accent-[#B85838]" /> Mark as ready to share with the church
            </label>
            <button type="button" onClick={submitPrayer} className="w-full bg-[#1A1815] text-white py-2 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]">Save Prayer Request</button>
            {prError && <p role="alert" className="text-xs text-[#B85838]" style={{ fontFamily: '"Fraunces", serif' }}>{prError}</p>}
          </div>
        )}
        {prayerRequests.length === 0 ? (
          <p className="text-xs text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>No prayer requests logged yet.</p>
        ) : (
          <div className="bg-white border border-[#1A1815]">
            {[...prayerRequests].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((pr, i, arr) => (
              <div key={pr.id} className={`p-3 ${i < arr.length - 1 ? 'border-b border-[#E8E4DC]' : ''}`}>
                <div className="flex items-baseline justify-between gap-2 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] uppercase tracking-wider text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{pr.createdAt.slice(0, 10)} · {pr.requester || '(anonymous)'}</div>
                    <div className="text-sm mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>{pr.request}</div>
                    <div className="text-[10px] uppercase tracking-wider mt-1 text-[#5A5751]">{pr.sentAt ? `✓ sent ${pr.sentAt.slice(0, 10)}` : pr.shareWithChurch ? 'ready to share' : 'private'}</div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {pr.shareWithChurch && !pr.sentAt && (
                      <a href={mailtoFor(pr)} target={c.contactEmail ? '_self' : '_blank'} rel="noopener noreferrer" onClick={() => markPrayerRequestSent(pr.id)} className="text-xs uppercase tracking-wider px-3 py-1.5 border border-[#B85838] text-[#B85838] hover:bg-[#B85838] hover:text-white min-h-[36px] inline-flex items-center focus:outline focus:outline-2 focus:outline-[#B85838]">Send →</a>
                    )}
                    <span aria-hidden="true" className="h-5 w-px bg-[#E8E4DC] mx-1" />
                    <button type="button" onClick={() => { if (confirm('Delete this prayer request?')) deletePrayerRequest(pr.id); }} aria-label={`Delete prayer request from ${pr.requester}`} className="text-sm text-[#5A5751] hover:text-[#B85838] hover:bg-[#FAF8F4] border border-transparent hover:border-[#B85838] px-3 py-1.5 min-h-[36px] min-w-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">×</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* HEADER (moved to bottom 2026-05-25 per Darrell — the church-identity "ad"
          lives below the spiritual + parish-life surfaces so the page opens with
          the actions, not with the marquee). */}
      <section className="bg-white border border-[#1A1815] p-5">
        <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] font-medium mb-1">Home Church</div>
        <h2 className="text-2xl sm:text-3xl" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600, letterSpacing: '-0.02em' }}>{c.name}</h2>
        {c.nickname && <div className="text-base text-[#5A5751] italic mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>{c.nickname}</div>}
        {c.tagline && <p className="text-sm text-[#5A5751] mt-2" style={{ fontFamily: '"Fraunces", serif' }}>{c.tagline}</p>}
        {c.verse && (
          <blockquote className="mt-3 border-l-2 border-[#B85838] pl-3 text-sm italic" style={{ fontFamily: '"Fraunces", serif' }}>
            "{c.verse.text}" <span className="not-italic text-[#5A5751] text-xs"> — {c.verse.ref}</span>
          </blockquote>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-4 text-xs" style={{ fontFamily: '"Fraunces", serif' }}>
          {c.address && <div><div className={labelCls}>Location</div><div>{c.address}</div></div>}
          {c.phone && <div><div className={labelCls}>Phone</div><a href={`tel:${c.phone.replace(/[^0-9]/g, '')}`} className="underline text-[#B85838] hover:text-[#1A1815]">{c.phone}</a></div>}
          {c.officeHours && <div><div className={labelCls}>Office</div><div>{c.officeHours}</div></div>}
        </div>
        <div className="mt-3 flex gap-2 flex-wrap">
          {c.site && <a href={c.site} target="_blank" rel="noopener noreferrer" className="text-xs uppercase tracking-wider px-3 py-2 bg-[#1A1815] text-white hover:bg-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]">Visit Church Site →</a>}
          {c.links?.about && <a href={c.links.about} target="_blank" rel="noopener noreferrer" className="text-xs uppercase tracking-wider px-3 py-2 border border-[#1A1815] hover:bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838]">About Us →</a>}
        </div>
      </section>

      <p className="text-[10px] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>
        Content links to the church's own pages. Service times, media, and ministry openings live on <a href={c.site} target="_blank" rel="noopener noreferrer" className="underline">{(c.site || '').replace(/^https?:\/\//, '')}</a> — this tab is a shortcut, not a copy. Edits to service times can be made in the seed data ({`data.church.services`}) as the church publishes them.
      </p>
    </div>
  );
}

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

const ACCOUNT_TYPES = ['checking', 'savings', 'credit', 'loan', 'investment', 'cash', 'other'];

function BooksAccounts({ entityRollups, entities, addAccount, updateAccount, deleteAccount, toggleAccountLegal, bufferTarget = 0, bufferCurrent = 0, setBufferCurrent, setBufferTarget, totals = {}, ingestData = null }) {
  // v28+ MVP v1.5 round 4 — Buffer target editing is deliberate (modal-style),
  // current balance is slider-driven (continuous, live feedback).
  const [editingTarget, setEditingTarget] = useState(false);
  const [targetDraft, setTargetDraft] = useState(bufferTarget);

  // Phase 2B.2 (2026-05-28) — ingestData now comes from the top-level App
  // component so Tx / Accounts / Big Picture all share one network feed.
  // Falls back to empty shape if a parent forgot to pass it.
  const ingestBalances = (ingestData && ingestData.bank_balances) || {};
  const ingestMeta = (ingestData && ingestData.meta) || { loaded: false, error: null };

  // Map an account → its matching institution slug in ingestBalances.
  // QFX filenames embed last-4 of the account number; institution slug is
  // the filename's first segment lowercased (e.g. "chase8168_activity_...").
  // We match an account by extracting digits from a.fragment and finding the
  // first institution slug that contains those digits.
  const balanceFor = (acc) => {
    const last4 = (acc.fragment || '').match(/(\d{4})/)?.[1];
    if (!last4) return null;
    const key = Object.keys(ingestBalances).find(k => k.includes(last4));
    return key ? { inst: key, ...ingestBalances[key] } : null;
  };
  // Suggested target = ~1 month of total rental P&I (covers timing gap for
  // a full month), rounded to nearest $500. Falls back to $5,000.
  const suggestedTarget = (() => {
    const pAndI = (totals && totals.totalRentalPI) ? totals.totalRentalPI : 0;
    if (!pAndI) return 5000;
    return Math.max(1000, Math.round(pAndI / 500) * 500);
  })();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const blank = { name: '', institution: '', type: 'checking', fragment: '', balance: 0, entityId: entities[0]?.id || 'e-personal', notes: '', isPrimary: false };
  const [form, setForm] = useState(blank);

  // Round 9: no scroll-to-top. Form opens above the account list; the toast at
  // the form header makes it obvious. Tapping the edit button on a row no
  // longer hijacks the user's scroll position.
  const startAdd = () => { setForm(blank); setEditingId(null); setShowForm(true); };
  // r20 — Inline edit per IN-PLACE-FIRST.md. Top form for Add only;
  // edit mounts inline under the row the user tapped.
  const startEdit = (a) => { setForm({ name: a.name, institution: a.institution, type: a.type, fragment: a.fragment || '', balance: a.balance, entityId: a.entityId, notes: a.notes || '', isPrimary: !!a.isPrimary }); setEditingId(a.id); setShowForm(false); };
  const cancel = () => { setShowForm(false); setEditingId(null); setForm(blank); };
  const submit = () => {
    if (!form.name || !form.institution) { alert('Account name and institution are required.'); return; }
    if (editingId) updateAccount(editingId, form);
    else addAccount(form);
    cancel();
  };
  const confirmDelete = (a) => { if (confirm(`Delete account "${a.name}"? Transactions referencing it will keep the original accountId reference but will no longer roll up to an entity.`)) deleteAccount(a.id); };

  // v28+ MVP v1.5 round 3 — All Accounts Total + Buffer Fund occupy the
  // formerly-blank space at the top of this view. Buffer lives here because
  // its meaning ("liquid reserve set aside") sits next to the actual liquid
  // balance figure rather than the big-picture summary.
  const allAccounts = entityRollups.flatMap(r => r.accounts || []);
  // 2026-05-24: liquid = cash types AND not in legal. Credit cards and loans
  // no longer surface on this tab; their totals live on the Debts page.
  const liquidAccounts = allAccounts.filter(a => ['checking','savings','cash','investment'].includes(a.type) && !a.inLegal);
  const liquidTotal = liquidAccounts.reduce((s, a) => s + (a.balance || 0), 0);

  // Phase 2B — bank-derived totals for the same liquid set. Sums LEDGERBAL
  // for each linked account, plus the manual balance for accounts that
  // haven't been linked yet. This is the "what the bank actually says"
  // number alongside the user's manual record-of-truth.
  let bankLinkedCount = 0;
  let bankDerivedLiquid = 0;
  for (const a of liquidAccounts) {
    const bal = balanceFor(a);
    if (bal && typeof bal.ledger_balance === 'number') {
      bankLinkedCount += 1;
      bankDerivedLiquid += bal.ledger_balance;
    } else {
      bankDerivedLiquid += (a.balance || 0);
    }
  }
  const bankDerivedDelta = +(bankDerivedLiquid - liquidTotal).toFixed(2);
  // Round 8 — netWorth no longer surfaced in the top card; net-position view
  // moves to the Big Picture dashboard where it belongs alongside debt totals.
  const bufferPct = bufferTarget > 0 ? Math.min(100, Math.round((bufferCurrent / bufferTarget) * 100)) : 0;
  const bufferGap = Math.max(0, bufferTarget - bufferCurrent);

  return (
    <div className="space-y-6">
      <section className="bg-white border border-[#1A1815] p-5 sm:p-6">
        <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] mb-2 font-medium">Accounts · Add · Edit · Delete</div>
        <h2 className="text-2xl mb-3" style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>Every account, every entity, every balance.</h2>
        <p className="text-base leading-relaxed" style={{ fontFamily: '"Fraunces", serif' }}>
          Add the checking, savings, credit, and loan accounts that hold the household's cash flow. Each account belongs to an entity (Personal, Steward Real Estate, Cornerstone Tech, Wellness Practice). Balances feed every rollup, projection, and the funds-available check on upcoming transactions.
        </p>
      </section>

      {/* v28+ MVP v1.5 round 8 — All Accounts Total card now CASH ONLY.
          Credit / loans surface in the per-entity "Credit Cards & Loans"
          group below, plus a dedicated "Debt Accounts · Total" summary
          card that appears right above that group (when any exist).
          The Buffer Fund pairs with the cash total — meaningful side-by-side
          because both are "how much spendable cash is on hand." */}
      <section aria-labelledby="all-accounts-total-h" className="grid grid-cols-1 lg:grid-cols-5 gap-3">
        {/* Totals card — cash only, 2/5 of the row */}
        <div className="lg:col-span-2 bg-white border border-[#1A1815] p-4 sm:p-5">
          <h2 id="all-accounts-total-h" className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751] font-semibold">All Accounts · Total Cash</h2>
          <p className="text-xs text-[#5A5751] mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>Spendable: checking + savings + cash + investments.</p>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="text-[10px] uppercase tracking-wider text-[#5A5751]">{liquidAccounts.length} cash accounts</div>
            <div className={`text-3xl ${liquidTotal < 0 ? 'text-[#B85838]' : 'text-[#5A6E3D]'}`} style={{ fontFamily: '"Fraunces", serif', fontWeight: 700 }}>{fmt(liquidTotal)}</div>
          </div>
          {/* Phase 2B — bank-derived total when any account is linked to a
              QFX feed. Uses bank LEDGERBAL where available, manual balance
              elsewhere, so the figure represents one consistent picture. */}
          {bankLinkedCount > 0 && (
            <div className="mt-2 pt-2 border-t border-[#E8E4DC] flex items-baseline justify-between">
              <div className="text-[10px] uppercase tracking-wider text-[#5A5751]" title="Sum of bank ledger balance for linked accounts plus manual balance for unlinked accounts.">
                bank-derived · {bankLinkedCount} linked
              </div>
              <div className="text-right">
                <div className={`text-lg ${bankDerivedLiquid < 0 ? 'text-[#B85838]' : 'text-[#1A1815]'}`} style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 600 }}>{fmt(bankDerivedLiquid)}</div>
                {Math.abs(bankDerivedDelta) >= 0.5 && (
                  <div className={`text-[10px] uppercase tracking-wider ${bankDerivedDelta < 0 ? 'text-[#B85838]' : 'text-[#D97706]'}`} title="Difference between your manual cash total and what the banks say. Reconcile per-account on the rows below.">
                    Δ {bankDerivedDelta > 0 ? '+' : ''}{fmt(bankDerivedDelta)}
                  </div>
                )}
              </div>
            </div>
          )}
          <p className="text-[10px] text-[#5A5751] italic mt-3" style={{ fontFamily: '"Fraunces", serif' }}>
            Credit cards and loans live on the <strong>Debts</strong> tab. Accounts under legal hold live in the <strong>Legal</strong> tab. Both are excluded from this cash total.
          </p>
          {ingestMeta.error && (
            <p className="text-[9px] text-[#B85838] italic mt-2" style={{ fontFamily: '"Fraunces", serif' }} title={ingestMeta.error}>
              Bank balance overlay offline · {ingestMeta.error.length > 60 ? ingestMeta.error.slice(0, 60) + '…' : ingestMeta.error}
            </p>
          )}
        </div>

        {/* Buffer Fund card — slider for current balance (live), target edit is deliberate. */}
        {bufferTarget > 0 && (
          <div className="lg:col-span-3 bg-white border-2 border-[#B85838] p-4 sm:p-5">
            <div className="flex items-baseline justify-between gap-2 flex-wrap">
              <div>
                <h3 id="buffer-fund-heading" className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] font-semibold">Buffer Fund · Mortgage Protection</h3>
                <p className="text-xs text-[#5A5751] mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>The single highest-ROI move right now. Once funded, mortgage money sits before the 1st — turning "tight" into "covered" without changing income.</p>
              </div>
              <div className="text-right shrink-0">
                <div className="text-2xl" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{fmt(bufferCurrent)}<span className="text-sm text-[#5A5751]"> / {fmt(bufferTarget)}</span></div>
                <div className="text-[10px] uppercase tracking-wider text-[#5A5751]">{bufferPct}% funded · gap {fmt(bufferGap)}</div>
              </div>
            </div>

            <div className="mt-3" role="progressbar" aria-labelledby="buffer-fund-heading" aria-valuenow={bufferPct} aria-valuemin="0" aria-valuemax="100">
              <div className="w-full bg-[#FAF8F4] h-3 border border-[#E8E4DC]">
                <div className="h-full bg-[#5A6E3D] transition-all" style={{ width: `${bufferPct}%` }} />
              </div>
              <div className="flex justify-between text-[9px] uppercase tracking-wider text-[#5A5751] mt-1">
                <span>$0</span>
                <span>{fmt(bufferTarget / 2)}</span>
                <span>{fmt(bufferTarget)}</span>
              </div>
            </div>

            {/* Slider — current balance, live update */}
            <div className="mt-4">
              <div className="flex items-baseline justify-between mb-1">
                <label htmlFor="buffer-current-slider" className="text-[9px] uppercase tracking-wider text-[#5A5751]">Current balance · slide to update</label>
                <span className="text-xs" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{fmt(bufferCurrent)}</span>
              </div>
              <input
                id="buffer-current-slider"
                type="range"
                min="0"
                max={bufferTarget}
                step={Math.max(25, Math.round(bufferTarget / 200))}
                value={Math.min(bufferCurrent, bufferTarget)}
                onChange={e => setBufferCurrent && setBufferCurrent(e.target.value)}
                aria-valuemin="0"
                aria-valuemax={bufferTarget}
                aria-valuenow={bufferCurrent}
                aria-valuetext={`${fmt(bufferCurrent)} of ${fmt(bufferTarget)}`}
                className="w-full accent-[#B85838]"
              />
            </div>

            {/* Target — deliberate edit only */}
            <div className="mt-3 flex items-baseline justify-between gap-2 flex-wrap">
              <div className="text-[10px] uppercase tracking-wider text-[#5A5751]">
                Target: <strong style={{ fontFamily: '"JetBrains Mono", monospace' }}>{fmt(bufferTarget)}</strong>
                {bufferTarget !== suggestedTarget && <> · suggested {fmt(suggestedTarget)} (~1 mo rental P&amp;I)</>}
              </div>
              {!editingTarget ? (
                <button type="button" onClick={() => { setTargetDraft(bufferTarget); setEditingTarget(true); }} className="text-[10px] uppercase tracking-wider px-3 py-2 border border-[#1A1815] hover:bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838]">Edit target</button>
              ) : (
                <div className="flex items-center gap-1 flex-wrap">
                  <label htmlFor="buffer-target-edit" className="sr-only">Target balance</label>
                  <input
                    id="buffer-target-edit"
                    type="number"
                    step="100"
                    min="0"
                    inputMode="decimal"
                    value={targetDraft}
                    onChange={e => setTargetDraft(e.target.value)}
                    className="p-2 border border-[#1A1815] text-sm bg-[#FAF8F4] w-28 focus:outline focus:outline-2 focus:outline-[#B85838]"
                  />
                  <button type="button" onClick={() => { setBufferTarget && setBufferTarget(targetDraft); setEditingTarget(false); }} className="text-[10px] uppercase tracking-wider px-3 py-2 bg-[#1A1815] text-white hover:bg-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]">Save</button>
                  <button type="button" onClick={() => { setBufferTarget && setBufferTarget(suggestedTarget); setEditingTarget(false); }} className="text-[10px] uppercase tracking-wider px-3 py-2 border border-[#1A1815] hover:bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838]" title="Use the suggested target">Use suggested</button>
                  <button type="button" onClick={() => setEditingTarget(false)} className="text-[10px] uppercase tracking-wider px-3 py-2 text-[#5A5751] hover:text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]">Cancel</button>
                </div>
              )}
            </div>

            <div className="mt-3 text-xs text-[#5A5751] leading-relaxed" style={{ fontFamily: '"Fraunces", serif' }}>
              {bufferPct >= 100 ? (
                <span className="text-[#5A6E3D] font-semibold">✓ Buffer fully funded. Keep replenishing as you draw from it for early mortgage timing.</span>
              ) : bufferPct >= 60 ? (
                <span>Close. About <strong>{fmt(bufferGap)}</strong> more closes the timing gap on the 1st.</span>
              ) : (
                <span>First {fmt(bufferTarget)} is the most important dollars in this whole system. Aim ~$500/mo until full.</span>
              )}
            </div>
          </div>
        )}
      </section>

      <section>
        <div className="flex items-baseline justify-between mb-3 pb-2 border-b border-[#1A1815] gap-2 flex-wrap">
          <h2 className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751]">All Accounts</h2>
          <button type="button" onClick={() => showForm ? cancel() : startAdd()} className="text-[10px] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815]">{showForm ? '× Cancel' : '+ Add account'}</button>
        </div>

        {/* r20 — Top form ONLY for Add. Edit happens inline under the row. */}
        {showForm && !editingId && (
          <div className="bg-white border border-[#B85838] p-4 mb-3 space-y-3">
            <div className="text-[10px] uppercase tracking-[0.2em] text-[#B85838] font-medium">New account</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Account name</label>
                <input className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" placeholder="e.g., Chase Personal Checking" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Institution</label>
                <input className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" placeholder="e.g., Chase, AMEX, UIECU" value={form.institution} onChange={e => setForm({ ...form, institution: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Type</label>
                <select className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                  {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Fragment</label>
                <input className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" placeholder="...8168" value={form.fragment} onChange={e => setForm({ ...form, fragment: e.target.value })} />
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Balance</label>
                <input type="number" step="0.01" className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={form.balance} onChange={e => setForm({ ...form, balance: e.target.value })} />
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Entity</label>
                <select className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={form.entityId} onChange={e => setForm({ ...form, entityId: e.target.value })}>
                  {entities.map(en => <option key={en.id} value={en.id}>{en.name.split('(')[0].trim()}</option>)}
                </select>
              </div>
            </div>
            <textarea className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" rows="2" placeholder="Notes (optional)" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ fontFamily: '"Fraunces", serif' }}>
              <input type="checkbox" checked={!!form.isPrimary} onChange={e => setForm({ ...form, isPrimary: e.target.checked })} className="accent-[#B85838]" />
              <span><strong>Primary bill-pay account</strong> — shown prominently at the top of Transactions so the family can see at a glance what's available to pay bills.</span>
            </label>
            <button type="button" onClick={submit} className="w-full bg-[#1A1815] text-[#FAF8F4] py-2 text-xs uppercase tracking-wider hover:bg-[#B85838]">{editingId ? 'Save Changes' : 'Save Account'}</button>
          </div>
        )}
      </section>

      {/* 2026-05-24 reorg per Darrell:
          - Credit cards + loans are removed from this tab entirely. They live on
            the Debts page now (their primary identity is "debt," not "account").
          - The Debt Accounts Total card that used to live here is gone for the
            same reason.
          - Accounts flagged inLegal don't surface here either — they live in
            the Legal tab and are excluded from cash totals.
          - Entity rendering order is personal-first → business-second (handled
            upstream in entityRollups). */}
      {entityRollups.map(r => {
        // Bank accounts only (cash types), and only those NOT in legal status.
        const bankAccounts = r.accounts.filter(a => ['checking','savings','cash','investment'].includes(a.type) && !a.inLegal);
        const bankTotal = bankAccounts.reduce((s, a) => s + (a.balance || 0), 0);
        const renderRow = (a, i, arr) => {
          // Phase 2B — bank-side balance for this account, if we can match it.
          const bal = balanceFor(a);
          const hasBankBal = bal && typeof bal.ledger_balance === 'number';
          const delta = hasBankBal ? +(bal.ledger_balance - (a.balance || 0)).toFixed(2) : null;
          const deltaClass = delta === null ? '' :
            Math.abs(delta) < 0.5 ? 'text-[#5A6E3D]' :
            delta < 0 ? 'text-[#B85838]' : 'text-[#D97706]';
          return (
          <div key={a.id} className={`p-3 ${i < arr.length - 1 ? 'border-b border-[#E8E4DC]' : ''}`}>
            <div className="flex justify-between items-baseline gap-3 flex-wrap">
              <div className="flex-1 min-w-0">
                <span style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{a.name}</span>
                <span className="text-xs text-[#5A5751] ml-2">{a.institution} {a.fragment}</span>
                <span className="text-[9px] uppercase tracking-wider text-[#5A5751] ml-2">{a.type}</span>
                {a.isPrimary && <span className="text-[9px] uppercase tracking-wider text-[#B85838] font-semibold ml-2">★ primary</span>}
                {bal && (
                  <span className="ml-2 inline-block px-1.5 py-0.5 text-[9px] uppercase tracking-wider"
                    style={{ backgroundColor: '#1F6FEB22', color: '#1F6FEB', border: '1px solid #1F6FEB' }}
                    title={`Linked to QFX feed: ${bal.inst}${bal.tx_count ? ' · ' + bal.tx_count + ' transactions' : ''}`}>
                    bank-linked
                  </span>
                )}
              </div>
              <div className="text-right">
                <div className={`${a.balance < 0 ? 'text-[#B85838]' : ''}`} style={{ fontFamily: '"JetBrains Mono", monospace' }}>{fmt(a.balance)}</div>
                {hasBankBal && (
                  <div className="text-[10px] mt-0.5" style={{ fontFamily: '"JetBrains Mono", monospace' }} title={bal.balance_as_of ? `Bank ledger balance as of ${bal.balance_as_of}` : 'Bank ledger balance'}>
                    <span className="text-[#5A5751] uppercase tracking-wider mr-1">bank:</span>
                    <span className={bal.ledger_balance < 0 ? 'text-[#B85838]' : 'text-[#1A1815]'}>{fmt(bal.ledger_balance)}</span>
                    {bal.balance_as_of && <span className="text-[#5A5751] ml-1">· {bal.balance_as_of.slice(5)}</span>}
                  </div>
                )}
                {hasBankBal && delta !== null && Math.abs(delta) >= 0.5 && (
                  <div className={`text-[9px] mt-0.5 uppercase tracking-wider ${deltaClass}`} style={{ fontFamily: '"JetBrains Mono", monospace' }}
                    title="Difference between your manual balance and the bank's ledger balance. Edit your account to reconcile.">
                    Δ {delta > 0 ? '+' : ''}{fmt(delta)}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <button type="button" onClick={() => editingId === a.id ? cancel() : startEdit(a)} aria-expanded={editingId === a.id} className="text-xs uppercase tracking-wider text-[#5A5751] hover:text-[#1A1815] hover:bg-[#FAF8F4] border border-transparent hover:border-[#1A1815] px-3 py-1.5 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">{editingId === a.id ? '× Cancel edit' : '✎ Edit'}</button>
              {toggleAccountLegal && (
                <button type="button" onClick={() => { if (confirm(`Move "${a.name}" to Legal? It will be removed from cash totals and surface in the Legal tab. You can restore it from there.`)) toggleAccountLegal(a.id); }} className="text-xs uppercase tracking-wider text-[#5A5751] hover:text-[#B85838] hover:bg-[#FAF8F4] border border-transparent hover:border-[#B85838] px-3 py-1.5 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">🔒 Move to Legal</button>
              )}
              <span aria-hidden="true" className="h-5 w-px bg-[#E8E4DC] ml-auto" />
              <button type="button" onClick={() => confirmDelete(a)} className="text-xs uppercase tracking-wider text-[#5A5751] hover:text-[#B85838] hover:bg-[#FAF8F4] border border-transparent hover:border-[#B85838] px-3 py-1.5 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">Delete</button>
            </div>
            {a.notes && <p className="text-xs text-[#5A5751] italic mt-1" style={{ fontFamily: '"Fraunces", serif' }}>{a.notes}</p>}
            {/* r20 — Inline edit drop-down per IN-PLACE-FIRST.md. */}
            {editingId === a.id && (
              <div className="mt-3 p-3 bg-[#FAF8F4] border-2 border-[#B85838] space-y-2">
                <div className="text-[10px] uppercase tracking-[0.2em] text-[#B85838] font-medium">Quick edit · {a.name}</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Account name</label><input className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                  <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Institution</label><input className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={form.institution} onChange={e => setForm({ ...form, institution: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Type</label><select className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>{ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                  <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Fragment</label><input className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" placeholder="...8168" value={form.fragment} onChange={e => setForm({ ...form, fragment: e.target.value })} /></div>
                  <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Balance</label><input type="number" step="0.01" className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={form.balance} onChange={e => setForm({ ...form, balance: e.target.value })} /></div>
                  <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Entity</label><select className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={form.entityId} onChange={e => setForm({ ...form, entityId: e.target.value })}>{entities.map(en => <option key={en.id} value={en.id}>{en.name.split('(')[0].trim()}</option>)}</select></div>
                </div>
                <textarea className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" rows="2" placeholder="Notes (optional)" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
                <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ fontFamily: '"Fraunces", serif' }}>
                  <input type="checkbox" checked={!!form.isPrimary} onChange={e => setForm({ ...form, isPrimary: e.target.checked })} className="accent-[#B85838]" />
                  <span><strong>Primary bill-pay account</strong></span>
                </label>
                <div className="flex gap-2">
                  <button type="button" onClick={submit} className="flex-1 bg-[#1A1815] text-white px-4 py-2 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]">Save changes</button>
                  <button type="button" onClick={cancel} className="px-4 py-2 border border-[#1A1815] text-xs uppercase tracking-wider hover:bg-white focus:outline focus:outline-2 focus:outline-[#B85838]">Cancel</button>
                </div>
              </div>
            )}
          </div>
          );
        };
        return (
          <section key={r.entity.id} className="space-y-3">
            <h3 className="text-sm" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{r.entity.name.split('(')[0].trim()}</h3>

            {/* PRIMARY: Bank Accounts */}
            <div>
              <div className="flex items-baseline justify-between mb-1.5">
                <h4 className="text-[10px] uppercase tracking-[0.25em] text-[#1A1815] font-semibold">💰 Bank Accounts</h4>
                <div className="text-xs text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{bankAccounts.length} · {fmt(bankTotal)}</div>
              </div>
              {bankAccounts.length === 0 ? (
                <div className="bg-white border border-[#E8E4DC] p-3 text-xs text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>No bank accounts yet.</div>
              ) : (
                <div className="bg-white border-2 border-[#1A1815]">
                  {bankAccounts.map((a, i) => renderRow(a, i, bankAccounts))}
                </div>
              )}
            </div>

            {/* 2026-05-24: Credit Cards & Loans removed from this tab. They
                live on the Debts page now. The Move-to-Legal button on each
                bank-account row sends an account to the Legal tab if it's in
                dispute / probate / frozen / etc. */}
          </section>
        );
      })}
    </div>
  );
}

const TX_CATEGORIES = ['salary', 'rental-income', 'transfer', 'groceries', 'fuel', 'utilities', 'dining', 'medical', 'vehicle', 'household', 'charitable', 'business', 'professional', 'insurance', 'subscription', 'debt-payment', 'other'];

function BooksTransactions({ data, entityFilter, setEntityFilter, currentDate, addTransaction, updateTransaction, deleteTransaction, ingestData = null, visibleEntities = null, visibleEntityIds = null }) {
  const [txView, setTxView] = useState('history');
  const [page, setPage] = useState(0);
  const pageSize = 25;
  // Phase 2C (2026-05-28) — reconcile-status filter. Lets the user narrow
  // the merged Tx feed to just the rows that need attention.
  // 'all' (default) shows everything; 'unexplained' is the most-useful
  // surface for the workflow-16 reconcile data (1900+ unexplained rows).
  const [statusFilter, setStatusFilter] = useState('all');
  // Reset pagination whenever any filter changes so user lands on page 1.
  useEffect(() => { setPage(0); }, [txView, entityFilter, statusFilter]);

  // Phase 2A — merge ingested bank/Gmail transactions from n8n workflow 18
  // alongside the manual entries. Sovereign-loop: data flows from
  // /volume1/PoeTech/finance-events/ on the NAS, never from a SaaS.
  //
  // Phase 2B.2 — ingestData is now lifted to the top-level App component so
  // Tx + Accounts + Big Picture share one feed. Falls back gracefully if a
  // parent didn't pass it (e.g. during unit tests).
  // Re-derive the same per-row shape Phase 2A built locally, but from the
  // shared `ingestData.transactions` so we keep the dedupe + badge code below
  // unchanged.
  const ingestedTx = useMemo(() => {
    const raw = (ingestData && ingestData.transactions) || [];
    return raw.map(rec => {
      const instStr = String(rec.institution || '');
      const last4Match = instStr.match(/(\d{4})/);
      const last4 = last4Match ? last4Match[1] : null;
      let matchedAccountId = null;
      if (last4 && Array.isArray(data.accounts)) {
        const cand = data.accounts.find(a => (a.fragment || '').includes(last4));
        if (cand) matchedAccountId = cand.id;
      }
      const id = `ingest-${rec.id || (rec.fitid || rec.posted + '-' + rec.amount + '-' + rec.name)}`;
      return {
        id,
        date: rec.posted || (rec.captured_at || '').slice(0, 10),
        accountId: matchedAccountId,
        amount: rec.amount,
        description: rec.name || rec.memo || '(no description)',
        category: 'imported',
        _source: 'bank-ingest',
        _institution: instStr,
        _last4: last4,
        _fitid: rec.fitid || null,
        _status: rec.status || 'unknown',
        _accountMatched: !!matchedAccountId,
      };
    });
  }, [ingestData, data.accounts]);

  // Dedupe key for matching a manual entry to an ingested one.
  // Account match optional (a manual entry might predate the bank link).
  const dedupeKey = (t) => {
    const dt = (t.date || '').slice(0, 10);
    const amt = Math.round((t.amount || 0) * 100); // cents, integer
    const descPrefix = (t.description || '').toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 12);
    const last4 = t._last4 || (t.accountId && (data.accounts.find(a => a.id === t.accountId)?.fragment || '').match(/\d{4}/)?.[0]) || '';
    return `${last4}|${dt}|${amt}|${descPrefix}`;
  };

  // v28+ Session B: funds-verify trigger + transfer popup
  const FUNDS_BUFFER = 200; // dollars - any projected balance below this triggers the cover prompt
  const [transferContext, setTransferContext] = useState(null); // { targetAccountId, shortfall, occasion }
  const [transferAmount, setTransferAmount] = useState(0);
  const [transferSourceId, setTransferSourceId] = useState('');

  // v28+ CSV import state
  const [csvOpen, setCsvOpen] = useState(false);
  const [csvRaw, setCsvRaw] = useState('');
  const [csvAccountId, setCsvAccountId] = useState(data.accounts[0]?.id || '');
  const [csvFlipSign, setCsvFlipSign] = useState(false);
  const [csvError, setCsvError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const todayISO = currentDate.toISOString().slice(0, 10);
  const blank = { date: todayISO, accountId: data.accounts[0]?.id || '', amount: 0, description: '', category: 'other', entityOverride: '' };
  const [form, setForm] = useState(blank);

  // Round 9: no scroll-to-top. Form opens at the top of the transaction list;
  // the user keeps their place in whatever row they were reading.
  const startAdd = () => { setForm({ ...blank, accountId: data.accounts[0]?.id || '' }); setEditingId(null); setShowForm(true); };
  // r32 — Inline edit per IN-PLACE-FIRST: edit form drops down under the row,
  // top form reserved for Add only.
  const startEdit = (t) => { setForm({ date: t.date, accountId: t.accountId, amount: t.amount, description: t.description, category: t.category || 'other', entityOverride: t.entityOverride || '' }); setEditingId(t.id); setShowForm(false); };
  const cancel = () => { setShowForm(false); setEditingId(null); setForm(blank); };
  const submit = () => {
    if (!form.date || !form.accountId || !form.description) { alert('Date, account, and description are required.'); return; }
    const payload = { ...form, amount: parseFloat(form.amount) || 0 };
    if (!payload.entityOverride) delete payload.entityOverride;
    if (editingId) updateTransaction(editingId, payload);
    else addTransaction(payload);
    cancel();
  };
  const confirmDelete = (t) => { if (confirm(`Delete transaction "${t.description}"?`)) deleteTransaction(t.id); };

  // Phase 2E (2026-05-28) — accept an ingest row as a manual entry. Two
  // ergonomic modes: 'review' opens the new-transaction form pre-filled so
  // the user can adjust category/description before saving; 'quick' adds
  // the entry immediately with the suggested category. The next ingest
  // refresh dedupes — the manual entry and the bank row merge with a
  // green "bank-confirmed" badge.
  const suggestCategory = (description) => {
    const d = (description || '').toLowerCase();
    if (/payroll|deposit.*salary|direct deposit/.test(d)) return 'salary';
    if (/zelle|venmo|cashapp|cash app/.test(d)) return 'transfer';
    if (/uber|lyft|gas|shell|chevron|bp |arco|exxon|mobil/.test(d)) return 'fuel';
    if (/whole foods|jewel|aldi|grocery|trader joe|kroger|walmart|target/.test(d)) return 'groceries';
    if (/restaurant|cafe|coffee|starbucks|chipotle|mcdonald|dunkin/.test(d)) return 'dining';
    if (/comed|nicor|water|gas company|electric|utility/.test(d)) return 'utilities';
    if (/netflix|spotify|hulu|disney|apple\.com\/bill|prime|youtube/.test(d)) return 'subscription';
    if (/state farm|geico|progressive|allstate|insurance/.test(d)) return 'insurance';
    if (/medical|pharmacy|cvs|walgreens|hospital|clinic/.test(d)) return 'medical';
    if (/auto|car wash|jiffy|mechanic/.test(d)) return 'vehicle';
    if (/mortgage|rent payment/.test(d)) return 'debt-payment';
    return 'other';
  };
  // Phase 2F (2026-05-28) — mark a bank-ingest row as noise. Posts the
  // institution + fitid to n8n workflow 19, which writes 'noise-skip' into
  // the reconcile state file. Workflow 18's next 5-min refresh sees the
  // updated state and the row drops off "Needs attention" forever.
  // We also hold a local Set of just-marked fitids so the row vanishes
  // immediately, before the network round-trip; vital for grinding through
  // a few hundred rows on the plane without 5-min waits between each.
  const [noisedLocally, setNoisedLocally] = useState(new Set());
  const markNoise = async (t) => {
    if (!t || t._source !== 'bank-ingest') return;
    const inst = t._institution || '';
    const fitid = t._fitid || '';
    if (!inst || !fitid) {
      alert('Cannot mark as noise — this row is missing institution or FITID.');
      return;
    }
    // Optimistic: hide it from the merged feed right away.
    setNoisedLocally(prev => {
      const next = new Set(prev);
      next.add(fitid);
      return next;
    });
    const base = N8N_BASE;
    if (!base) return; // local-only optimism; state will not persist
    try {
      const url = `${base.replace(/\/+$/, '')}/webhook/mark-noise`;
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        mode: 'cors',
        body: JSON.stringify({ institution: inst, fitid, reason: 'pwa-tx-mark-noise' })
      });
      if (!r.ok) throw new Error('Mark-noise endpoint returned ' + r.status);
    } catch (e) {
      // Revert optimism on failure so the user knows it didn't stick.
      setNoisedLocally(prev => {
        const next = new Set(prev);
        next.delete(fitid);
        return next;
      });
      alert('Could not save noise marking: ' + e.message);
    }
  };

  const acceptIngest = (t, mode = 'review') => {
    // Find an account: matched by last4 if available; otherwise prompt user
    // to pick during review. Quick-add requires a matched account.
    const matchedAccountId = t.accountId || (t._last4 ? data.accounts.find(a => (a.fragment || '').includes(t._last4))?.id : null);
    const prefill = {
      date: t.date,
      accountId: matchedAccountId || data.accounts[0]?.id || '',
      amount: t.amount,
      description: t.description,
      category: suggestCategory(t.description),
      entityOverride: '',
    };
    if (mode === 'quick') {
      if (!prefill.accountId) {
        alert('Cannot quick-add — no account matches this institution. Use Review instead.');
        return;
      }
      const payload = { ...prefill, amount: parseFloat(prefill.amount) || 0 };
      addTransaction(payload);
      return;
    }
    // Review mode: open the form with the prefill and let the user adjust.
    setForm(prefill);
    setEditingId(null);
    setShowForm(true);
    try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) {}
  };

  const matchesEntity = (t) => {
    // Multi-user Layer A — when 'all' is selected, only show transactions
    // whose account belongs to a visible entity. Without this gate the
    // 'all' view would leak every entity's transactions across profiles.
    if (entityFilter === 'all') {
      if (visibleEntityIds && t.accountId) {
        const acc = data.accounts.find(a => a.id === t.accountId);
        return acc ? visibleEntityIds.has(acc.entityId) : true;
      }
      return true;
    }
    if (t.entityOverride) return t.entityOverride === entityFilter;
    const acc = data.accounts.find(a => a.id === t.accountId);
    if (acc) return acc.entityId === entityFilter;
    // Ingest entries with no mapped accountId: surface them under the
    // "all" view only — they don't have an entity until you link the
    // account in Books → Accounts. Filtered out of entity-scoped views
    // so they don't muddle entity-specific totals.
    return false;
  };

  // Phase 2A — merge manual transactions with ingested ones. Dedupe by
  // composite key (last4 + date + cents + descPrefix). Manual entries always
  // win when both exist for the same key — the user's record-of-truth is
  // authoritative; the ingest is supporting evidence. Ingested entries that
  // match a manual one get tagged onto the manual row's _ingestMatched flag
  // so renderRow can show a "✓ Bank-confirmed" badge in-line.
  const manualByKey = (() => {
    const m = {};
    for (const t of (data.transactions || [])) {
      m[dedupeKey(t)] = t.id;
    }
    return m;
  })();
  const ingestedFiltered = ingestedTx.filter(t => {
    // Phase 2F — optimistic hide for rows the user just marked noise.
    // Persists locally until the next n8n refresh reflects the state-file
    // update; after that, workflow 18 returns status='noise-skip' and the
    // statusFilter pills already partition it correctly.
    if (t._fitid && noisedLocally.has(t._fitid)) return false;
    // Drop ingest entries that already match a manual entry's dedupe key —
    // the manual row will surface a "bank-confirmed" badge instead.
    return !manualByKey[dedupeKey(t)];
  });
  // Mark manual rows that have an ingest match (for badge rendering).
  const ingestMatchSet = new Set();
  for (const t of ingestedTx) {
    const k = dedupeKey(t);
    if (manualByKey[k]) ingestMatchSet.add(manualByKey[k]);
  }
  const allTxBeforeStatusFilter = [
    ...(data.transactions || []).map(t => ({ ...t, _ingestMatched: ingestMatchSet.has(t.id) })),
    ...ingestedFiltered
  ].filter(matchesEntity);
  // Phase 2C — apply the reconcile-status filter. Manual entries pass through
  // any status filter (they're authoritative). Ingest rows get filtered by
  // their reconcile-status. "needs-attention" is a synthetic filter that
  // combines unexplained + unconfirmed since both want the user's eye.
  const allTx = allTxBeforeStatusFilter.filter(t => {
    if (statusFilter === 'all') return true;
    if (t._source !== 'bank-ingest') return true; // manual entries always show
    if (statusFilter === 'needs-attention') return t._status === 'unexplained' || t._status === 'unconfirmed';
    return t._status === statusFilter;
  });
  const history = allTx.filter(t => t.date <= todayISO).sort((a, b) => b.date.localeCompare(a.date));
  const futureTx = allTx.filter(t => t.date > todayISO).sort((a, b) => a.date.localeCompare(b.date));
  // Counts for the filter dropdown — built from the pre-filter set so each
  // pill always shows the true count regardless of which filter is active.
  const statusCounts = (() => {
    const c = { all: 0, 'needs-attention': 0, unexplained: 0, unconfirmed: 0, verified: 0, 'noise-skip': 0 };
    for (const t of allTxBeforeStatusFilter) {
      c.all += 1;
      if (t._source !== 'bank-ingest') continue;
      if (t._status === 'unexplained' || t._status === 'unconfirmed') c['needs-attention'] += 1;
      if (Object.prototype.hasOwnProperty.call(c, t._status)) c[t._status] += 1;
    }
    return c;
  })();

  const recurringUpcoming = (data.recurringObligations || [])
    .filter(r => r.enabled !== false && r.nextDue && r.nextDue > todayISO)
    .map(r => {
      // Preparatory scaffolding — used by the pending "renews every N months"
      // hint chip in the recurring-obligations preview.
      // eslint-disable-next-line no-unused-vars
      const months = r.frequency === 'monthly' ? 1 : r.frequency === 'quarterly' ? 3 : r.frequency === 'semi-annual' ? 6 : r.frequency === 'annual' ? 12 : r.frequency === 'biennial' ? 24 : 1;
      return {
        id: `ro-preview-${r.id}`,
        date: r.nextDue,
        description: r.name,
        amount: -Math.abs(r.amount),
        category: r.category || 'subscription',
        _source: 'recurring',
        _frequency: r.frequency,
        _entityId: r.entityId,
      };
    })
    .filter(item => entityFilter === 'all' || item._entityId === entityFilter);

  const upcoming = [...futureTx.map(t => ({ ...t, _source: 'transaction' })), ...recurringUpcoming].sort((a, b) => a.date.localeCompare(b.date));

  // Per-account current balance lookup
  const balanceByAccount = (data.accounts || []).reduce((acc, a) => { acc[a.id] = a.balance; return acc; }, {});

  // For Upcoming: walk transactions chronologically per account, tracking
  // projected running balance so each row can show what the account will
  // become AFTER this charge posts.
  const projectedAfter = (() => {
    const running = { ...balanceByAccount };
    const map = {};
    [...upcoming].sort((a, b) => a.date.localeCompare(b.date)).forEach(t => {
      if (t.accountId && t.accountId in running) {
        running[t.accountId] = (running[t.accountId] || 0) + (t.amount || 0);
        map[t.id] = running[t.accountId];
      }
    });
    return map;
  })();

  // Round 7 — 30/60/90 forecast revised:
  //   · Cash-only (bank/savings/cash/investment). Credit + loan are tracked
  //     separately because they don't hold cash you can spend; mixing them
  //     inflates the negative balances and breaks the projection's meaning.
  //   · Adds previous 30/60/90 days of ACTUALS (from settled transactions)
  //     alongside the forward windows so you can sanity-check the forecast
  //     against lived history — "is what we're projecting realistic?"
  const CASH_ACCOUNT_TYPES = ['checking','savings','cash','investment'];
  const forecast = (() => {
    const today = currentDate;
    const horizon = (days) => {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + days);
      return d.toISOString().slice(0, 10);
    };
    const lookback = (days) => {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - days);
      return d.toISOString().slice(0, 10);
    };
    const fw = { '30': horizon(30), '60': horizon(60), '90': horizon(90) };
    const bw = { '30': lookback(30), '60': lookback(60), '90': lookback(90) };
    const todayISO = today.toISOString().slice(0, 10);

    const cashAccounts = (data.accounts || []).filter(a => CASH_ACCOUNT_TYPES.includes(a.type));
    const perAccount = {};
    cashAccounts.forEach(a => {
      perAccount[a.id] = {
        id: a.id, name: a.name, fragment: a.fragment, type: a.type,
        balance: a.balance, isPrimary: !!a.isPrimary,
        // forward windows
        w30: a.balance, w60: a.balance, w90: a.balance,
        // backward windows — net cash movement over the prior period (sum of actuals)
        a30: 0, a60: 0, a90: 0,
      };
    });

    // Forward projection from upcoming
    upcoming.forEach(t => {
      if (!t.accountId || !(t.accountId in perAccount)) return;
      if (t.date <= fw['30']) perAccount[t.accountId].w30 += (t.amount || 0);
      if (t.date <= fw['60']) perAccount[t.accountId].w60 += (t.amount || 0);
      if (t.date <= fw['90']) perAccount[t.accountId].w90 += (t.amount || 0);
    });

    // Trailing actuals from settled transactions (date <= today and >= lookback)
    (data.transactions || []).forEach(t => {
      if (!t.accountId || !(t.accountId in perAccount)) return;
      if (!t.date || t.date > todayISO) return; // future tx already counted in forward
      if (t.date >= bw['30']) perAccount[t.accountId].a30 += (t.amount || 0);
      if (t.date >= bw['60']) perAccount[t.accountId].a60 += (t.amount || 0);
      if (t.date >= bw['90']) perAccount[t.accountId].a90 += (t.amount || 0);
    });

    return Object.values(perAccount);
  })();
  // Cash-only totals for the "Total cash" row below the per-account grid.
  const forecastTotals = forecast.reduce((acc, f) => ({
    balance: acc.balance + (f.balance || 0),
    w30: acc.w30 + (f.w30 || 0), w60: acc.w60 + (f.w60 || 0), w90: acc.w90 + (f.w90 || 0),
    a30: acc.a30 + (f.a30 || 0), a60: acc.a60 + (f.a60 || 0), a90: acc.a90 + (f.a90 || 0),
  }), { balance: 0, w30: 0, w60: 0, w90: 0, a30: 0, a60: 0, a90: 0 });

  // Per-row shortfall: if projected balance after this charge drops below FUNDS_BUFFER,
  // record how much short we'd be (using the buffer as the floor).
  const shortfallFor = (t) => {
    if (txView !== 'upcoming') return 0;
    const proj = projectedAfter[t.id];
    if (proj === undefined || proj >= FUNDS_BUFFER) return 0;
    return FUNDS_BUFFER - proj;
  };

  const openTransfer = (t) => {
    const short = shortfallFor(t);
    if (short <= 0) return;
    const otherAccounts = (data.accounts || []).filter(a => a.id !== t.accountId && a.balance > 0);
    const best = otherAccounts.sort((a, b) => b.balance - a.balance)[0];
    setTransferContext({ targetAccountId: t.accountId, shortfall: short, txDescription: t.description, txAmount: t.amount });
    setTransferAmount(Math.ceil(short));
    setTransferSourceId(best ? best.id : '');
  };
  const closeTransfer = () => { setTransferContext(null); setTransferSourceId(''); setTransferAmount(0); };
  const executeTransfer = () => {
    if (!transferContext || !transferSourceId) return;
    const amt = parseFloat(transferAmount) || 0;
    if (amt <= 0) { alert('Transfer amount must be positive.'); return; }
    const src = (data.accounts || []).find(a => a.id === transferSourceId);
    const tgt = (data.accounts || []).find(a => a.id === transferContext.targetAccountId);
    if (!src || !tgt) { alert('Source or target account missing.'); return; }
    const today = currentDate.toISOString().slice(0, 10);
    // Two paired transactions, both marked as transfers so they don't muddy expense math
    addTransaction({ date: today, accountId: src.id, amount: -amt, description: `Transfer to ${tgt.name}${tgt.fragment ? ' ' + tgt.fragment : ''}`, category: 'transfer' });
    addTransaction({ date: today, accountId: tgt.id, amount: amt, description: `Transfer from ${src.name}${src.fragment ? ' ' + src.fragment : ''}`, category: 'transfer' });
    closeTransfer();
  };

  // ---- CSV import helpers ----------------------------------------------------
  // Minimal RFC 4180-ish CSV splitter (handles quoted commas + escaped quotes).
  const parseCsvLine = (line) => {
    const out = [];
    let cur = '';
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (inQ) {
        if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
        else if (c === '"') inQ = false;
        else cur += c;
      } else {
        if (c === ',') { out.push(cur); cur = ''; }
        else if (c === '"') inQ = true;
        else cur += c;
      }
    }
    out.push(cur);
    return out.map(s => s.trim());
  };
  const normalizeDate = (s) => {
    if (!s) return '';
    // Try ISO YYYY-MM-DD first
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    // MM/DD/YYYY
    let m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
    if (m) {
      let [, mo, da, yr] = m;
      if (yr.length === 2) yr = (parseInt(yr) > 50 ? '19' : '20') + yr;
      return `${yr}-${mo.padStart(2,'0')}-${da.padStart(2,'0')}`;
    }
    // MM-DD-YYYY
    m = s.match(/^(\d{1,2})-(\d{1,2})-(\d{2,4})$/);
    if (m) {
      let [, mo, da, yr] = m;
      if (yr.length === 2) yr = (parseInt(yr) > 50 ? '19' : '20') + yr;
      return `${yr}-${mo.padStart(2,'0')}-${da.padStart(2,'0')}`;
    }
    return s; // give up, show raw
  };
  const csvParsed = (() => {
    if (!csvRaw.trim()) return { rows: [], headers: [], idx: {}, errors: [] };
    const lines = csvRaw.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length === 0) return { rows: [], headers: [], idx: {}, errors: ['File is empty.'] };
    const headers = parseCsvLine(lines[0]).map(h => h.toLowerCase());
    const findCol = (...names) => {
      for (const n of names) {
        const i = headers.indexOf(n);
        if (i !== -1) return i;
      }
      return -1;
    };
    const idx = {
      date: findCol('transaction date', 'date', 'posted date', 'post date'),
      desc: findCol('description', 'details', 'memo', 'name', 'payee'),
      amount: findCol('amount', 'debit', 'transaction amount'),
      credit: findCol('credit'),
      category: findCol('category', 'type'),
    };
    const errors = [];
    if (idx.date === -1) errors.push('No Date column found.');
    if (idx.desc === -1) errors.push('No Description column found.');
    if (idx.amount === -1 && idx.credit === -1) errors.push('No Amount column found.');
    if (errors.length) return { rows: [], headers, idx, errors };
    const rows = lines.slice(1).map((line, i) => {
      const cells = parseCsvLine(line);
      const rawDate = cells[idx.date] || '';
      const date = normalizeDate(rawDate);
      const desc = cells[idx.desc] || '';
      let amt = 0;
      if (idx.amount !== -1 && cells[idx.amount]) amt = parseFloat(cells[idx.amount].replace(/[$,]/g, '')) || 0;
      else if (idx.credit !== -1 && cells[idx.credit]) amt = parseFloat(cells[idx.credit].replace(/[$,]/g, '')) || 0;
      if (csvFlipSign) amt = -amt;
      const category = idx.category !== -1 ? (cells[idx.category] || 'other').toLowerCase() : 'other';
      const ok = !!date && !!desc && /^\d{4}-\d{2}-\d{2}$/.test(date);
      return { lineNo: i + 2, rawDate, date, desc, amount: amt, category, ok };
    });
    return { rows, headers, idx, errors };
  })();

  const importCsv = () => {
    if (!csvAccountId) { setCsvError('Pick a target account first.'); return; }
    const valid = csvParsed.rows.filter(r => r.ok);
    if (valid.length === 0) { setCsvError('No valid rows to import.'); return; }
    if (!confirm(`Import ${valid.length} transaction(s) into ${(data.accounts.find(a => a.id === csvAccountId) || {}).name || 'this account'}?`)) return;
    valid.forEach(r => {
      addTransaction({
        date: r.date,
        accountId: csvAccountId,
        amount: r.amount,
        description: r.desc.slice(0, 200),
        category: ['salary','rental-income','transfer','groceries','fuel','utilities','dining','medical','vehicle','household','charitable','business','professional','insurance','subscription','debt-payment','other'].includes(r.category) ? r.category : 'other',
      });
    });
    setCsvOpen(false);
    setCsvRaw('');
    setCsvError('');
    alert(`Imported ${valid.length} transaction(s).`);
  };
  const onCsvFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => { setCsvRaw(String(e.target.result || '')); setCsvError(''); };
    reader.onerror = () => setCsvError('Could not read file.');
    reader.readAsText(file);
  };

  const renderRow = (t) => {
    const acc = data.accounts.find(a => a.id === t.accountId);
    // Phase 2A — label for ingest entries that haven't been linked to an
    // account yet: show the institution + last4 from the QFX so the user
    // recognizes which account it came from.
    const ingestLabel = t._source === 'bank-ingest'
      ? `${(t._institution || 'imported').replace(/_.*$/,'').replace(/(\d{4})$/, ' ····$1')}${acc ? '' : ' · unlinked'}`
      : null;
    const accLabel = acc
      ? `${acc.name}${acc.fragment ? ' ' + acc.fragment : ''}`
      : (t._source === 'recurring' ? 'Recurring obligation' : (ingestLabel || '—'));
    const currentBal = acc ? balanceByAccount[acc.id] : null;
    const afterBal = txView === 'upcoming' && acc && projectedAfter[t.id] !== undefined ? projectedAfter[t.id] : null;
    return (
      <React.Fragment key={t.id}>
      <tr className="border-b border-[#E8E4DC] align-top">
        <td className="p-2 text-xs whitespace-nowrap" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{t.date.slice(5)}</td>
        <td className="p-2">
          <div style={{ fontFamily: '"Fraunces", serif' }}>{t.description}</div>
          <div className="text-[10px] text-[#5A5751] mt-0.5">
            <span>{accLabel}</span>
            {currentBal !== null && <span className={`ml-1 ${currentBal < 0 ? 'text-[#B85838]' : 'text-[#5A5751]'}`} style={{ fontFamily: '"JetBrains Mono", monospace' }}>(now {fmt(currentBal)})</span>}
            {t.category && <span className="ml-2 uppercase tracking-wider">· {t.category}</span>}
            {t._source === 'recurring' && <span className="ml-2 text-[#B85838] uppercase tracking-wider">· recurring · {t._frequency}</span>}
            {/* Phase 2A — ingest provenance + reconcile status pills. Stays
                quiet on plain manual entries so the existing UX is unchanged. */}
            {t._source === 'bank-ingest' && (
              <span className="ml-2 inline-block px-1.5 py-0.5 text-[9px] uppercase tracking-wider"
                style={{ backgroundColor: '#1F6FEB22', color: '#1F6FEB', border: '1px solid #1F6FEB' }}
                title={`Imported from bank QFX${t._fitid ? ' · FITID ' + t._fitid : ''}`}>
                bank
              </span>
            )}
            {t._source === 'gmail-ingest' && (
              <span className="ml-2 inline-block px-1.5 py-0.5 text-[9px] uppercase tracking-wider"
                style={{ backgroundColor: '#DB444422', color: '#DB4444', border: '1px solid #DB4444' }}
                title="Imported from Gmail finance event">
                gmail
              </span>
            )}
            {t._ingestMatched && (
              <span className="ml-2 inline-block px-1.5 py-0.5 text-[9px] uppercase tracking-wider"
                style={{ backgroundColor: '#16A34A22', color: '#16A34A', border: '1px solid #16A34A' }}
                title="A bank-ingested transaction matches this manual entry — verified.">
                ✓ bank-confirmed
              </span>
            )}
            {t._status && t._source === 'bank-ingest' && t._status !== 'unknown' && (
              <span className="ml-2 inline-block px-1.5 py-0.5 text-[9px] uppercase tracking-wider"
                style={{
                  backgroundColor: (t._status === 'verified' ? '#16A34A' : t._status === 'unexplained' ? '#DC2626' : '#D97706') + '22',
                  color: t._status === 'verified' ? '#16A34A' : t._status === 'unexplained' ? '#DC2626' : '#D97706',
                  border: `1px solid ${t._status === 'verified' ? '#16A34A' : t._status === 'unexplained' ? '#DC2626' : '#D97706'}`
                }}
                title={`Reconcile status: ${t._status}`}>
                {t._status}
              </span>
            )}
          </div>
          {afterBal !== null && (() => {
            const short = shortfallFor(t);
            return (
              <>
                <div className={`text-[10px] mt-0.5 ${afterBal < 0 ? 'text-[#B85838] font-semibold' : short > 0 ? 'text-[#B85838]' : 'text-[#5A6E3D]'}`} style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                  {afterBal < 0 ? '⚠ ' : short > 0 ? '⚐ ' : '→ '}After this hits: {fmt(afterBal)}
                  {short > 0 && afterBal >= 0 && <span className="ml-1">(below {fmt(FUNDS_BUFFER)} buffer)</span>}
                </div>
                {short > 0 && (
                  <button type="button" onClick={() => openTransfer(t)} className="mt-1 text-[10px] uppercase tracking-wider px-2 py-0.5 border border-[#B85838] text-[#B85838] hover:bg-[#B85838] hover:text-white">
                    ⚐ Cover with transfer
                  </button>
                )}
              </>
            );
          })()}
        </td>
        <td className={`p-2 text-right whitespace-nowrap ${t.amount < 0 ? 'text-[#B85838]' : 'text-[#5A6E3D]'}`} style={{ fontFamily: '"JetBrains Mono", monospace' }}>{t.amount > 0 ? '+' : ''}{fmt(t.amount)}</td>
        <td className="p-2 text-right whitespace-nowrap">
          {t._source === 'bank-ingest' ? (
            // Phase 2E — ingest rows are read-only on the NAS side, but the
            // user can promote them into the manual ledger. Two flows: Review
            // (open prefilled form to adjust category) and Quick (file as-is
            // with the suggested category). Once accepted, the next ingest
            // refresh tags the ingest row's dedupe key against the new
            // manual entry and the bank-confirmed badge appears.
            // Phase 2F — third action: mark as noise. Writes back to the
            // workflow-16 state file via workflow 19, then the row stays
            // suppressed across refreshes. Used for fee reversals, internal
            // transfers, and other junk that shouldn't surface in the work
            // queue but isn't really worth a manual ledger entry either.
            <span className="inline-flex items-center gap-1 flex-wrap justify-end">
              <button type="button" onClick={() => acceptIngest(t, 'review')} aria-label={`Review and accept ${t.description} as manual entry`} className="text-xs uppercase tracking-wider text-[#1F6FEB] hover:bg-[#1F6FEB] hover:text-white border border-[#1F6FEB] px-3 py-1.5 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">✎ Review</button>
              <span aria-hidden="true" className="h-5 w-px bg-[#E8E4DC]" />
              <button type="button" onClick={() => acceptIngest(t, 'quick')} aria-label={`Quick accept ${t.description} as manual entry with suggested category`} title={`File as manual entry · category guess: ${suggestCategory(t.description)}`} className="text-xs uppercase tracking-wider text-[#5A6E3D] hover:bg-[#5A6E3D] hover:text-white border border-[#5A6E3D] px-3 py-1.5 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">✓ Accept</button>
              <span aria-hidden="true" className="h-5 w-px bg-[#E8E4DC]" />
              <button type="button" onClick={() => { if (confirm(`Mark "${t.description}" as noise? It will stop appearing in 'Needs attention' across all devices.`)) markNoise(t); }} aria-label={`Mark ${t.description} as noise and hide from needs-attention`} title="Mark as noise — fee reversal, internal transfer, or other non-actionable row" className="text-xs uppercase tracking-wider text-[#5A5751] hover:bg-[#5A5751] hover:text-white border border-[#5A5751] px-3 py-1.5 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">🗑 Noise</button>
            </span>
          ) : t._source !== 'recurring' && (
            <span className="inline-flex items-center gap-1">
              <button type="button" onClick={() => editingId === t.id ? cancel() : startEdit(t)} aria-expanded={editingId === t.id} aria-label={editingId === t.id ? `Cancel edit for ${t.description}` : `Edit transaction ${t.description}`} className="text-xs uppercase tracking-wider text-[#5A5751] hover:text-[#1A1815] hover:bg-[#FAF8F4] border border-transparent hover:border-[#1A1815] px-3 py-1.5 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">{editingId === t.id ? '× Cancel' : '✎ Edit'}</button>
              <span aria-hidden="true" className="h-5 w-px bg-[#E8E4DC]" />
              <button type="button" onClick={() => confirmDelete(t)} aria-label={`Delete transaction ${t.description}`} className="text-xs uppercase tracking-wider text-[#5A5751] hover:text-[#B85838] hover:bg-[#FAF8F4] border border-transparent hover:border-[#B85838] px-3 py-1.5 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">Delete</button>
            </span>
          )}
        </td>
      </tr>
      {/* r32 — Inline edit row spans all 4 columns. Per IN-PLACE-FIRST + EDITABLE-EVERYWHERE. */}
      {editingId === t.id && (
        <tr className="border-b border-[#B85838]">
          <td colSpan={4} className="p-3 bg-[#FAF8F4] border-l-4 border-[#B85838]">
            <div className="space-y-2">
              <div className="text-[10px] uppercase tracking-[0.2em] text-[#B85838] font-medium">Quick edit · {t.description}</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Date</label><input type="date" className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
                <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Amount (+ in / − out)</label><input type="number" step="0.01" className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></div>
                <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Account</label><select className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={form.accountId} onChange={e => setForm({ ...form, accountId: e.target.value })}>{data.accounts.map(a => <option key={a.id} value={a.id}>{a.name}{a.fragment ? ' ' + a.fragment : ''}</option>)}</select></div>
                <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Category</label><select className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{TX_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
              </div>
              <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Description</label><input className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
              <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Entity override (optional)</label><select className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={form.entityOverride} onChange={e => setForm({ ...form, entityOverride: e.target.value })}><option value="">— No override —</option>{data.entities.map(en => <option key={en.id} value={en.id}>{en.name.split('(')[0].trim()}</option>)}</select></div>
              <div className="flex gap-2">
                <button type="button" onClick={submit} className="flex-1 bg-[#1A1815] text-white px-4 py-2 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]">Save changes</button>
                <button type="button" onClick={cancel} className="px-4 py-2 border border-[#1A1815] text-xs uppercase tracking-wider hover:bg-white focus:outline focus:outline-2 focus:outline-[#B85838]">Cancel</button>
              </div>
            </div>
          </td>
        </tr>
      )}
      </React.Fragment>
    );
  };

  const list = txView === 'upcoming' ? upcoming : history;

  return (
    <div className="space-y-6">
      <section className="bg-white border border-[#1A1815] p-5 sm:p-6">
        <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] mb-2 font-medium">Transactions · Upcoming · History · Add</div>
        <h2 className="text-2xl mb-3" style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>Every dollar in. Every dollar out. Every dollar coming.</h2>
        <p className="text-base leading-relaxed" style={{ fontFamily: '"Fraunces", serif' }}>
          Add transactions as they happen. See what is already cleared (History) and what is expected to hit next (Upcoming, including the next instance of each enabled recurring obligation). Filters carry through from Entities. Projections, funds-available checks, and the transfer-from popup come in the next pass.
        </p>
      </section>

      {(() => {
        const primary = (data.accounts || []).find(a => a.isPrimary) || (data.accounts || []).find(a => a.type === 'checking') || (data.accounts || [])[0];
        if (!primary) return null;
        // Project after all upcoming charges that hit this account
        const futureImpact = upcoming.filter(t => t.accountId === primary.id).reduce((s, t) => s + (t.amount || 0), 0);
        const projected = primary.balance + futureImpact;
        return (
          <section className="bg-white border-2 border-[#1A1815] p-4 sm:p-5">
            <div className="flex items-baseline justify-between gap-3 flex-wrap mb-2">
              <div>
                <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] font-semibold">★ Primary Bill-Pay Account</div>
                <div className="text-sm text-[#5A5751] mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>{primary.name}{primary.fragment ? ' ' + primary.fragment : ''}</div>
              </div>
              {!primary.isPrimary && <span className="text-[10px] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>Mark one account as primary in Accounts to lock this</span>}
            </div>
            <div className="grid grid-cols-2 gap-px bg-[#E8E4DC] border border-[#E8E4DC]">
              <div className="bg-white p-3">
                <div className="text-[9px] uppercase tracking-wider text-[#5A5751]">Right now</div>
                <div className={`text-2xl ${primary.balance < 0 ? 'text-[#B85838]' : 'text-[#1A1815]'}`} style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 600 }}>{fmt(primary.balance)}</div>
              </div>
              <div className="bg-white p-3">
                <div className="text-[9px] uppercase tracking-wider text-[#5A5751]">After upcoming charges clear</div>
                <div className={`text-2xl ${projected < 0 ? 'text-[#B85838]' : 'text-[#5A6E3D]'}`} style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 600 }}>{fmt(projected)}</div>
              </div>
            </div>
            <p className="text-[10px] text-[#5A5751] italic mt-2" style={{ fontFamily: '"Fraunces", serif' }}>
              Full balances for every account live at the bottom of this tab. Each row also shows that account's current balance inline.
            </p>
          </section>
        );
      })()}


      <section>
        <div className="border-b border-[#E8E4DC] mb-3">
          <div className="flex gap-1 text-xs">
            {[['upcoming', `Upcoming · ${upcoming.length}`], ['history', `History · ${history.length}`]].map(([id, label]) => (
              <button key={id} onClick={() => setTxView(id)} className={`px-3 py-2 whitespace-nowrap border-b-2 transition-colors ${txView === id ? 'border-[#B85838] text-[#1A1815] font-medium' : 'border-transparent text-[#5A5751] hover:text-[#1A1815]'}`}>{label}</button>
            ))}
          </div>
        </div>

        <div className="flex items-baseline justify-between mb-3 gap-2 flex-wrap">
          <div className="flex gap-1 flex-wrap text-xs">
            <button type="button" onClick={() => setEntityFilter('all')} className={`px-3 py-1.5 border ${entityFilter === 'all' ? 'border-[#1A1815] bg-[#1A1815] text-white' : 'border-[#E8E4DC] text-[#5A5751]'}`}>All</button>
            {(visibleEntities || data.entities).map(e => <button key={e.id} onClick={() => setEntityFilter(e.id)} className={`px-3 py-1.5 border ${entityFilter === e.id ? 'border-[#1A1815] bg-[#1A1815] text-white' : 'border-[#E8E4DC] text-[#5A5751]'}`}>{e.name.split('(')[0].trim()}</button>)}
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setCsvOpen(true)} className="text-[10px] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815]">📤 Import CSV</button>
            <button type="button" onClick={() => showForm ? cancel() : startAdd()} className="text-[10px] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815]">{showForm ? '× Cancel' : '+ Add transaction'}</button>
          </div>
        </div>

        {/* Phase 2C — reconcile-status pills. Only show when there are
            ingest rows in the merged feed; otherwise this is just clutter. */}
        {statusCounts.all > (data.transactions || []).length && (
          <div className="mb-3 flex items-center gap-1 flex-wrap text-[10px]">
            <span className="uppercase tracking-wider text-[#5A5751] mr-1">Filter</span>
            {[
              ['all', `All · ${statusCounts.all}`, '#1A1815'],
              ['needs-attention', `Needs attention · ${statusCounts['needs-attention']}`, '#B85838'],
              ['unexplained', `Unexplained · ${statusCounts.unexplained}`, '#DC2626'],
              ['unconfirmed', `Unconfirmed · ${statusCounts.unconfirmed}`, '#D97706'],
              ['verified', `Verified · ${statusCounts.verified}`, '#16A34A'],
              ['noise-skip', `Noise · ${statusCounts['noise-skip']}`, '#5A5751'],
            ].map(([id, label, color]) => (
              <button key={id} type="button" onClick={() => setStatusFilter(id)} className={`px-2 py-1 border uppercase tracking-wider ${statusFilter === id ? 'text-white' : 'text-[#5A5751]'}`} style={{ backgroundColor: statusFilter === id ? color : 'transparent', borderColor: statusFilter === id ? color : '#E8E4DC' }} title={`Show ${id === 'all' ? 'all rows' : id === 'needs-attention' ? 'unexplained + unconfirmed bank rows' : id + ' bank rows'} (manual entries always shown)`}>
                {label}
              </button>
            ))}
          </div>
        )}

        {/* r32 — Top form for Add only; edit happens inline under the row. */}
        {showForm && !editingId && (
          <div className="bg-white border border-[#B85838] p-4 mb-3 space-y-3">
            <div className="text-[10px] uppercase tracking-[0.2em] text-[#B85838] font-medium">New transaction</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Date</label>
                <input type="date" className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Amount (+ in / − out)</label>
                <input type="number" step="0.01" className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" placeholder="-49.99" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Account</label>
                <select className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={form.accountId} onChange={e => setForm({ ...form, accountId: e.target.value })}>
                  {data.accounts.length === 0 && <option value="">— Add an account first —</option>}
                  {data.accounts.map(a => <option key={a.id} value={a.id}>{a.name}{a.fragment ? ' ' + a.fragment : ''}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Category</label>
                <select className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  {TX_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Description</label>
              <input className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" placeholder="e.g., Costco · groceries" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Entity override (optional — defaults to account entity)</label>
              <select className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={form.entityOverride} onChange={e => setForm({ ...form, entityOverride: e.target.value })}>
                <option value="">— No override —</option>
                {data.entities.map(en => <option key={en.id} value={en.id}>{en.name.split('(')[0].trim()}</option>)}
              </select>
            </div>
            <button type="button" onClick={submit} className="w-full bg-[#1A1815] text-[#FAF8F4] py-2 text-xs uppercase tracking-wider hover:bg-[#B85838]">{editingId ? 'Save Changes' : 'Save Transaction'}</button>
          </div>
        )}

        {list.length === 0 ? (
          <div className="bg-white border border-[#E8E4DC] p-6 text-center">
            <p className="text-sm text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>
              {txView === 'upcoming'
                ? 'Nothing upcoming. Future-dated transactions and the next instance of each enabled recurring obligation will appear here.'
                : 'No history yet. Use + Add transaction above, or add recurring obligations in the Calendar tab.'}
            </p>
          </div>
        ) : (() => {
          const totalPages = Math.max(1, Math.ceil(list.length / pageSize));
          const safePage = Math.min(page, totalPages - 1);
          const startIdx = safePage * pageSize;
          const pageItems = list.slice(startIdx, startIdx + pageSize);
          return (
            <>
              <section className="bg-white border border-[#1A1815] p-3 sm:p-5 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#1A1815]">
                      <th className="text-left p-2 text-[10px] uppercase tracking-wider text-[#5A5751]">Date</th>
                      <th className="text-left p-2 text-[10px] uppercase tracking-wider text-[#5A5751]">Description · Account · Category</th>
                      <th className="text-right p-2 text-[10px] uppercase tracking-wider text-[#5A5751]">Amount</th>
                      <th className="text-right p-2 text-[10px] uppercase tracking-wider text-[#5A5751]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>{pageItems.map(renderRow)}</tbody>
                </table>
              </section>
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-3 gap-2 flex-wrap">
                  <button type="button" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={safePage === 0} className="text-[10px] uppercase tracking-wider px-3 py-1.5 border border-[#1A1815] bg-white text-[#1A1815] hover:bg-[#1A1815] hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-[#1A1815]">« Previous</button>
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-[#5A5751]">
                    <span>Page</span>
                    <select value={safePage} onChange={e => setPage(parseInt(e.target.value, 10))} className="p-1 border border-[#E8E4DC] text-xs bg-[#FAF8F4]">
                      {Array.from({ length: totalPages }).map((_, i) => <option key={i} value={i}>{i + 1}</option>)}
                    </select>
                    <span>of {totalPages} · showing {startIdx + 1}–{Math.min(startIdx + pageSize, list.length)} of {list.length}</span>
                  </div>
                  <button type="button" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={safePage >= totalPages - 1} className="text-[10px] uppercase tracking-wider px-3 py-1.5 border border-[#1A1815] bg-white text-[#1A1815] hover:bg-[#1A1815] hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-[#1A1815]">Next »</button>
                </div>
              )}
            </>
          );
        })()}
      </section>

      {csvOpen && (
        <div className="fixed inset-0 z-50 bg-[#1A1815]/60 flex items-center justify-center p-4" onClick={() => setCsvOpen(false)}>
          <div className="bg-white border-2 border-[#1A1815] max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-[#1A1815] flex items-baseline justify-between gap-3 flex-wrap">
              <div>
                <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] font-semibold">📤 Import CSV</div>
                <h2 className="text-2xl mt-1" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>Drop a bank export</h2>
                <div className="text-xs text-[#5A5751] mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>
                  Chase, AMEX, Discover, and most banks export a CSV with Date / Description / Amount columns. Other columns are ignored.
                </div>
              </div>
              <button type="button" onClick={() => setCsvOpen(false)} aria-label="Close" className="text-[10px] uppercase tracking-wider text-[#5A5751] hover:text-[#1A1815]">× Close</button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">1. Target account (all rows will be assigned to this account)</label>
                <select className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={csvAccountId} onChange={e => setCsvAccountId(e.target.value)}>
                  {data.accounts.length === 0 && <option value="">— Add an account first —</option>}
                  {data.accounts.map(a => <option key={a.id} value={a.id}>{a.name}{a.fragment ? ' ' + a.fragment : ''}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">2. Pick CSV file</label>
                <input type="file" accept=".csv,text/csv" onChange={e => onCsvFile(e.target.files && e.target.files[0])} className="block w-full text-xs file:mr-3 file:px-3 file:py-1.5 file:bg-[#1A1815] file:text-white file:border-0 file:uppercase file:tracking-wider file:text-[10px] file:hover:bg-[#B85838] file:cursor-pointer" />
              </div>

              <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ fontFamily: '"Fraunces", serif' }}>
                <input type="checkbox" checked={csvFlipSign} onChange={e => setCsvFlipSign(e.target.checked)} className="accent-[#B85838]" />
                <span>Flip the sign on every amount. <em>Tick this if your bank exports charges as positive (AMEX, some Discover exports). Chase usually doesn't need this.</em></span>
              </label>

              {csvParsed.errors.length > 0 && (
                <div className="text-xs text-[#B85838] px-3 py-2 bg-[#FAF8F4] border border-[#B85838]" role="alert" style={{ fontFamily: '"Fraunces", serif' }}>
                  {csvParsed.errors.map((er, i) => <div key={i}>· {er}</div>)}
                </div>
              )}

              {csvParsed.rows.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751] mb-2">3. Preview · {csvParsed.rows.filter(r => r.ok).length} valid / {csvParsed.rows.length} total</div>
                  <div className="border border-[#1A1815] overflow-x-auto max-h-72 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-white">
                        <tr className="border-b border-[#1A1815]">
                          <th className="text-left p-2 text-[10px] uppercase tracking-wider text-[#5A5751]">Date</th>
                          <th className="text-left p-2 text-[10px] uppercase tracking-wider text-[#5A5751]">Description</th>
                          <th className="text-right p-2 text-[10px] uppercase tracking-wider text-[#5A5751]">Amount</th>
                          <th className="text-left p-2 text-[10px] uppercase tracking-wider text-[#5A5751]">Cat</th>
                          <th className="text-left p-2 text-[10px] uppercase tracking-wider text-[#5A5751]">Ok?</th>
                        </tr>
                      </thead>
                      <tbody>
                        {csvParsed.rows.slice(0, 100).map((r, i) => (
                          <tr key={i} className={`border-b border-[#E8E4DC] ${r.ok ? '' : 'bg-[#FAF8F4] opacity-60'}`}>
                            <td className="p-2 whitespace-nowrap" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{r.date || r.rawDate}</td>
                            <td className="p-2" style={{ fontFamily: '"Fraunces", serif' }}>{r.desc.slice(0, 60)}</td>
                            <td className={`p-2 text-right whitespace-nowrap ${r.amount < 0 ? 'text-[#B85838]' : 'text-[#5A6E3D]'}`} style={{ fontFamily: '"JetBrains Mono", monospace' }}>{r.amount > 0 ? '+' : ''}{fmt(r.amount)}</td>
                            <td className="p-2 text-[10px] uppercase tracking-wider">{r.category}</td>
                            <td className="p-2 text-[10px] uppercase tracking-wider">{r.ok ? <span className="text-[#5A6E3D]">✓</span> : <span className="text-[#B85838]">skip</span>}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {csvParsed.rows.length > 100 && <p className="text-[10px] text-[#5A5751] italic mt-1" style={{ fontFamily: '"Fraunces", serif' }}>Showing first 100 rows in preview — all {csvParsed.rows.length} will import.</p>}
                </div>
              )}

              {csvError && <div className="text-xs text-[#B85838] px-3 py-2 bg-[#FAF8F4] border border-[#B85838]" role="alert" style={{ fontFamily: '"Fraunces", serif' }}>{csvError}</div>}

              <button type="button" onClick={importCsv} disabled={csvParsed.rows.filter(r => r.ok).length === 0 || !csvAccountId} className="w-full bg-[#1A1815] text-white py-3 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838] disabled:opacity-40 disabled:hover:bg-[#1A1815]">
                Import {csvParsed.rows.filter(r => r.ok).length} transaction{csvParsed.rows.filter(r => r.ok).length === 1 ? '' : 's'}
              </button>
              <p className="text-[10px] text-[#5A5751] italic text-center" style={{ fontFamily: '"Fraunces", serif' }}>
                Rows without a parseable date are skipped automatically. Amounts with $ or commas are normalized. Unknown categories become 'other'.
              </p>
            </div>
          </div>
        </div>
      )}

      {transferContext && (() => {
        const tgt = (data.accounts || []).find(a => a.id === transferContext.targetAccountId);
        const candidates = (data.accounts || []).filter(a => a.id !== transferContext.targetAccountId);
        const src = candidates.find(a => a.id === transferSourceId);
        // Preparatory scaffolding — slot reserved for the pending "balance after
        // this transfer" projection chip (currently mirrors src.balance).
        // eslint-disable-next-line no-unused-vars
        const srcProjected = src ? (projectedAfter[transferContext.txId] !== undefined ? src.balance : src.balance) : 0;
        const wouldDrainSource = src && (src.balance - (parseFloat(transferAmount) || 0)) < 0;
        return (
          <div className="fixed inset-0 z-50 bg-[#1A1815]/60 flex items-center justify-center p-4" onClick={closeTransfer}>
            <div className="bg-white border-2 border-[#1A1815] max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="p-5 border-b border-[#1A1815] flex items-baseline justify-between gap-3 flex-wrap">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] font-semibold">⚐ Too close to call</div>
                  <h2 className="text-2xl mt-1" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>Cover the gap with a transfer</h2>
                  <div className="text-xs text-[#5A5751] mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>
                    Upcoming: {transferContext.txDescription} ({fmt(transferContext.txAmount)}) on {tgt?.name}
                  </div>
                </div>
                <button type="button" onClick={closeTransfer} aria-label="Close" className="text-[10px] uppercase tracking-wider text-[#5A5751] hover:text-[#1A1815]">× Close</button>
              </div>

              <div className="p-5 space-y-4">
                <div className="bg-[#FAF8F4] border border-[#B85838] p-3">
                  <div className="text-[10px] uppercase tracking-wider text-[#B85838] font-semibold mb-1">Projected shortfall</div>
                  <div className="text-xl" style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 600 }}>{fmt(transferContext.shortfall)}</div>
                  <p className="text-[10px] text-[#5A5751] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>
                    Amount needed to keep <strong>{tgt?.name}</strong> at or above the {fmt(FUNDS_BUFFER)} cushion after this charge.
                  </p>
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751] block mb-2">Transfer from</label>
                  <div className="space-y-1 max-h-56 overflow-y-auto border border-[#E8E4DC]">
                    {candidates.length === 0 && <p className="p-3 text-xs text-[#5A5751] italic">No other accounts available.</p>}
                    {candidates.map(a => {
                      const selected = a.id === transferSourceId;
                      const after = a.balance - (parseFloat(transferAmount) || 0);
                      return (
                        <button key={a.id} type="button" onClick={() => setTransferSourceId(a.id)} className={`w-full text-left p-3 border-b border-[#E8E4DC] last:border-b-0 ${selected ? 'bg-[#1A1815] text-white' : 'bg-white hover:bg-[#FAF8F4]'}`}>
                          <div className="flex items-baseline justify-between gap-2">
                            <span style={{ fontFamily: '"Fraunces", serif', fontWeight: selected ? 600 : 500 }}>{a.name}{a.fragment ? ' ' + a.fragment : ''}</span>
                            <span className={`text-sm ${!selected && a.balance < 0 ? 'text-[#B85838]' : ''}`} style={{ fontFamily: '"JetBrains Mono", monospace' }}>{fmt(a.balance)}</span>
                          </div>
                          {selected && (
                            <div className={`text-[10px] mt-1 ${after < 0 ? 'text-[#B85838]' : 'opacity-75'}`} style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                              After transfer: {fmt(after)} {after < 0 && '(would go negative)'}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Transfer amount (defaults to shortfall + cushion)</label>
                  <input type="number" step="0.01" min="0" className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={transferAmount} onChange={e => setTransferAmount(e.target.value)} />
                </div>

                {wouldDrainSource && (
                  <div className="text-xs text-[#B85838] px-3 py-2 bg-[#FAF8F4] border border-[#B85838]" role="alert" style={{ fontFamily: '"Fraunces", serif' }}>
                    This transfer would push the source account below zero. Either pick a different source or reduce the amount.
                  </div>
                )}

                <button type="button" onClick={executeTransfer} disabled={!transferSourceId || (parseFloat(transferAmount) || 0) <= 0} className="w-full bg-[#1A1815] text-white py-3 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838] disabled:opacity-40 disabled:hover:bg-[#1A1815]">
                  Move {fmt(parseFloat(transferAmount) || 0)} · {src ? `${src.name} → ${tgt?.name}` : 'pick a source'}
                </button>
                <p className="text-[10px] text-[#5A5751] italic text-center" style={{ fontFamily: '"Fraunces", serif' }}>
                  Creates two paired transactions dated today, both marked as <em>transfer</em> so they don't double-count in expense math.
                </p>
              </div>
            </div>
          </div>
        );
      })()}

      <section>
        <div className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751] mb-2">30 / 60 / 90-Day Cash Forecast · vs prior 30 / 60 / 90 actuals</div>
        <div className="bg-white border border-[#1A1815] overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1A1815] bg-[#FAF8F4]">
                <th className="text-left p-2 text-[10px] uppercase tracking-wider text-[#5A5751]" rowSpan="2">Cash account</th>
                <th className="text-center p-2 text-[10px] uppercase tracking-wider text-[#5A5751] border-l border-[#E8E4DC]" colSpan="3">Previous (actual cash flow)</th>
                <th className="text-center p-2 text-[10px] uppercase tracking-wider text-[#1A1815] border-l border-[#E8E4DC]" rowSpan="2">Now</th>
                <th className="text-center p-2 text-[10px] uppercase tracking-wider text-[#B85838] border-l border-[#E8E4DC]" colSpan="3">Projected (forward)</th>
              </tr>
              <tr className="border-b border-[#1A1815] bg-[#FAF8F4]">
                <th className="text-right p-2 text-[9px] uppercase tracking-wider text-[#5A5751] border-l border-[#E8E4DC]">−90d</th>
                <th className="text-right p-2 text-[9px] uppercase tracking-wider text-[#5A5751]">−60d</th>
                <th className="text-right p-2 text-[9px] uppercase tracking-wider text-[#5A5751]">−30d</th>
                <th className="text-right p-2 text-[9px] uppercase tracking-wider text-[#B85838] border-l border-[#E8E4DC]">+30d</th>
                <th className="text-right p-2 text-[9px] uppercase tracking-wider text-[#B85838]">+60d</th>
                <th className="text-right p-2 text-[9px] uppercase tracking-wider text-[#B85838]">+90d</th>
              </tr>
            </thead>
            <tbody>
              {forecast.length === 0 ? (
                <tr><td colSpan="8" className="p-3 text-xs text-[#5A5751] italic text-center" style={{ fontFamily: '"Fraunces", serif' }}>No cash accounts yet. Add a checking/savings account in Books → Accounts.</td></tr>
              ) : forecast.map(f => (
                <tr key={f.id} className="border-b border-[#E8E4DC]">
                  <td className="p-2">
                    <span style={{ fontFamily: '"Fraunces", serif' }}>{f.name}{f.fragment ? ' ' + f.fragment : ''}</span>
                    {f.isPrimary && <span className="ml-2 text-[9px] uppercase tracking-wider text-[#B85838] font-semibold">★</span>}
                    <span className="ml-2 text-[9px] uppercase tracking-wider text-[#5A5751]">{f.type}</span>
                  </td>
                  {/* Trailing actuals — net change over the lookback window */}
                  <td className={`p-2 text-right border-l border-[#E8E4DC] ${f.a90 < 0 ? 'text-[#B85838]' : f.a90 > 0 ? 'text-[#5A6E3D]' : 'text-[#5A5751]'}`} style={{ fontFamily: '"JetBrains Mono", monospace' }}>{f.a90 === 0 ? '—' : `${f.a90 > 0 ? '+' : ''}${fmt(f.a90)}`}</td>
                  <td className={`p-2 text-right ${f.a60 < 0 ? 'text-[#B85838]' : f.a60 > 0 ? 'text-[#5A6E3D]' : 'text-[#5A5751]'}`} style={{ fontFamily: '"JetBrains Mono", monospace' }}>{f.a60 === 0 ? '—' : `${f.a60 > 0 ? '+' : ''}${fmt(f.a60)}`}</td>
                  <td className={`p-2 text-right ${f.a30 < 0 ? 'text-[#B85838]' : f.a30 > 0 ? 'text-[#5A6E3D]' : 'text-[#5A5751]'}`} style={{ fontFamily: '"JetBrains Mono", monospace' }}>{f.a30 === 0 ? '—' : `${f.a30 > 0 ? '+' : ''}${fmt(f.a30)}`}</td>
                  {/* Now */}
                  <td className={`p-2 text-right border-l border-[#E8E4DC] ${f.balance < 0 ? 'text-[#B85838] font-semibold' : ''}`} style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 500 }}>{fmt(f.balance)}</td>
                  {/* Forward projection */}
                  <td className={`p-2 text-right border-l border-[#E8E4DC] ${f.w30 < 0 ? 'text-[#B85838] font-semibold' : f.w30 < FUNDS_BUFFER ? 'text-[#B85838]' : ''}`} style={{ fontFamily: '"JetBrains Mono", monospace' }}>{fmt(f.w30)}</td>
                  <td className={`p-2 text-right ${f.w60 < 0 ? 'text-[#B85838] font-semibold' : f.w60 < FUNDS_BUFFER ? 'text-[#B85838]' : ''}`} style={{ fontFamily: '"JetBrains Mono", monospace' }}>{fmt(f.w60)}</td>
                  <td className={`p-2 text-right ${f.w90 < 0 ? 'text-[#B85838] font-semibold' : f.w90 < FUNDS_BUFFER ? 'text-[#B85838]' : ''}`} style={{ fontFamily: '"JetBrains Mono", monospace' }}>{fmt(f.w90)}</td>
                </tr>
              ))}
              {forecast.length > 1 && (
                <tr className="border-t-2 border-[#1A1815] bg-[#FAF8F4]">
                  <td className="p-2 text-[10px] uppercase tracking-[0.2em] text-[#1A1815] font-semibold">All cash (total)</td>
                  <td className={`p-2 text-right border-l border-[#E8E4DC] ${forecastTotals.a90 < 0 ? 'text-[#B85838]' : 'text-[#5A6E3D]'}`} style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 600 }}>{forecastTotals.a90 === 0 ? '—' : `${forecastTotals.a90 > 0 ? '+' : ''}${fmt(forecastTotals.a90)}`}</td>
                  <td className={`p-2 text-right ${forecastTotals.a60 < 0 ? 'text-[#B85838]' : 'text-[#5A6E3D]'}`} style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 600 }}>{forecastTotals.a60 === 0 ? '—' : `${forecastTotals.a60 > 0 ? '+' : ''}${fmt(forecastTotals.a60)}`}</td>
                  <td className={`p-2 text-right ${forecastTotals.a30 < 0 ? 'text-[#B85838]' : 'text-[#5A6E3D]'}`} style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 600 }}>{forecastTotals.a30 === 0 ? '—' : `${forecastTotals.a30 > 0 ? '+' : ''}${fmt(forecastTotals.a30)}`}</td>
                  <td className={`p-2 text-right border-l border-[#E8E4DC] ${forecastTotals.balance < 0 ? 'text-[#B85838]' : 'text-[#5A6E3D]'}`} style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 700 }}>{fmt(forecastTotals.balance)}</td>
                  <td className={`p-2 text-right border-l border-[#E8E4DC] ${forecastTotals.w30 < 0 ? 'text-[#B85838]' : ''}`} style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 600 }}>{fmt(forecastTotals.w30)}</td>
                  <td className={`p-2 text-right ${forecastTotals.w60 < 0 ? 'text-[#B85838]' : ''}`} style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 600 }}>{fmt(forecastTotals.w60)}</td>
                  <td className={`p-2 text-right ${forecastTotals.w90 < 0 ? 'text-[#B85838]' : ''}`} style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 600 }}>{fmt(forecastTotals.w90)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-[#5A5751] italic mt-2" style={{ fontFamily: '"Fraunces", serif' }}>
          <strong>Cash only</strong> — credit cards and loans are tracked separately in Books → Accounts because they don't hold spendable cash. The <strong>left side</strong> is the actual net cash movement over the prior 30/60/90 days (from settled transactions, +inflow / −outflow). The <strong>right side</strong> is the projected balance at each forward window (current balance + upcoming charges + recurring). Compare the two sides to gut-check: if the forward projection drops faster than the prior 90 days bled, you're projecting tighter than reality — or you've got a real upcoming squeeze. Bold rust = below zero; plain rust = below the {fmt(FUNDS_BUFFER)} cushion. Tap any upcoming row's <strong>⚐ Cover with transfer</strong> button to move money preemptively.
        </p>
      </section>

      {(data.accounts || []).length > 0 && (
        <section>
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751] mb-2">All Account Balances</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-px bg-[#E8E4DC] border border-[#E8E4DC]">
            {(data.accounts || []).map(a => (
              <div key={a.id} className="bg-white p-3">
                <div className="flex items-baseline justify-between gap-2">
                  <div className="text-[10px] text-[#5A5751] truncate flex-1" style={{ fontFamily: '"Fraunces", serif' }}>{a.name}{a.fragment ? ' ' + a.fragment : ''}</div>
                  {a.isPrimary && <span className="text-[9px] uppercase tracking-wider text-[#B85838] font-semibold shrink-0">★</span>}
                </div>
                <div className={`text-base ${a.balance < 0 ? 'text-[#B85838]' : 'text-[#1A1815]'}`} style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 500 }}>{fmt(a.balance)}</div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-[#5A5751] italic mt-2" style={{ fontFamily: '"Fraunces", serif' }}>
            Full balance sweep across every entity. The primary bill-pay account (★) is shown prominently at the top of this tab. Edit any account in Books · Accounts to mark it primary.
          </p>
        </section>
      )}
    </div>
  );
}

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
